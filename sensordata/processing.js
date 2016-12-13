"use strict"

let qm = require("qminer");
let loader = require("qminer-data-loader");

// create store for our data stream
let base = new qm.Base({
    mode: "createClean",
    schema: [{
        name: "Sensor",
        fields: [
            { name: "Time", type: "datetime" },
            { name: "Value", type: "float" }
        ]
    }]
});
let store = base.store("Sensor");

// first we need to read the value from the store
let tick = store.addStreamAggr({
    type: "timeSeriesTick",
    timestamp: "Time",
    value: "Value"
});

// create one stream aggregate that prints out the data
store.addStreamAggr({
    onAdd: rec => { console.log(
        rec.$id, "raw",
        new Date(tick.getTimestamp()).toISOString(),
        tick.getFloat().toFixed(2)
    );}
});

// let's compute moving average on the data
// first we keep it in the time window
let window = store.addStreamAggr({
    type: "timeSeriesWinBufVector",
    inAggr: tick,
    winsize: 10*1000 // we keep 10 seconds
});
// now compute moving average on the window
let ma = store.addStreamAggr({
    type: "ma",
    inAggr: window
    });
// and print what we read
store.addStreamAggr({
    onAdd: rec => { console.log(
        "MAvg",
        new Date(tick.getTimestamp()).toISOString(),
        ma.getFloat().toFixed(2)
    );}
});

// we can avoid keeping time window if we compute exponential moving average (EMA)
let ema = store.addStreamAggr({
    type: "ema",
    inAggr: tick,
    emaType: "previous", // [previous, next, linear]
    interval: 10*1000,  // values from the last 10 seconds contribute 90%
    initWindow: 10*1000 // how much do we need to initialize
});
// and print what we read
store.addStreamAggr({
    onAdd: rec => { console.log(
        "EMA",
        new Date(tick.getTimestamp()).toISOString(),
        ema.getFloat().toFixed(2)
    );}
});

// can we resample to have equally spaced time series
let resampler = store.addStreamAggr({
    type: "aggrResample",
    inAggr: tick,
    roundStart: "s", // output on round seconds
    interval: 1000,  // we output one measurement per second
    aggType: "avg"   // [sum, avg, min, max]
});
// print the output
let resamplerOut = new qm.StreamAggr(base, {
    onStep: () => { console.log(
        "Resampler",
        new Date(resampler.getTimestamp()).toISOString(),
        resampler.getFloat().toFixed(2)
    );}
});
resampler.setParams({ outAggr: resamplerOut });

// load data
loader.loadBrownianDataset(store);
