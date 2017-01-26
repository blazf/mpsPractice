"use strict"

var qm = require('qminer');
var loader = require('qminer-data-loader');

// we create two stores:
// 1) store for raw data we get on input
// 2) store for cleaned equaly-spaced data
var base = new qm.Base({
    mode: "createClean",
    schema: [{
        name: "Raw",
        fields: [
            { name: "Time", type: "datetime" },
            { name: "Value", type: "float" }
        ]
    }, {
        name: "Clean",
        fields: [
            { name: "Time", type: "datetime" },
            { name: "Value", type: "float" },
            { name: "Ema_1min", type: "float" },
            { name: "Ema_10min", type: "float" },
            { name: "Prediction", type: "float", null: true }
        ]
    }]
});
var rawStore = base.store("Raw");
var cleanStore = base.store("Clean");

// first we resample the input values to intervals of 10 seconds
let tick = rawStore.addStreamAggr({
    type: "timeSeriesTick",
    timestamp: "Time",
    value: "Value"
});
let resampler = rawStore.addStreamAggr({
    type: "aggrResample",
    inAggr: tick,
    roundStart: "s",
    interval: 10*1000,
    aggType: "avg"
});
// lets also compute few EMAs and use them as extra features
let ema_1min = rawStore.addStreamAggr({
    type: "ema",
    inAggr: tick,
    emaType: "previous",
    interval: 60*1000,
    initWindow: 10*1000
});
let ema_10min = rawStore.addStreamAggr({
    type: "ema",
    inAggr: tick,
    emaType: "previous",
    interval: 600*1000,
    initWindow: 10*1000
});
// lets insert this into a new store where we will have clean data
let insert = rawStore.addStreamAggr({
    onStep: () => {
        // add to clean store
        cleanStore.push({
            Time: new Date(resampler.getTimestamp()).toISOString(),
            Value: resampler.getFloat(),
            Ema_1min: ema_1min.getFloat(),
            Ema_10min: ema_10min.getFloat()
        });
        // report just for the fun of it
        let newRec = cleanStore.last;
        console.log(
            newRec.Time.toISOString(),
            newRec.Value.toFixed(4),
            newRec.Ema_1min.toFixed(4),
            newRec.Ema_10min.toFixed(4)
        );
    }
});
resampler.setParams({ outAggr: insert });

// now we want to train, first prepare a model that we can update
// we will use recursive linear regression
var linreg = new qm.analytics.RecLinReg({ "dim": 3, "forgetFact": 1.0 });
// we will train for time window of 1 minute (== 6 records)
let window = 6;
// create stream aggregate that will be called for each new clean record and update the regression
let trainStreamAggr = cleanStore.addStreamAggr({
    onAdd: (rec) => {
        // check if we have at least 6 records
        if (cleanStore.length >= 6) {
            // we do, go back 6 records and create a feature vector
            let trainRec = cleanStore[rec.$id - window];
            let trainVec = new qm.la.Vector([trainRec.Value, trainRec.Ema_1min, trainRec.Ema_10min]);
            // we use current record as target value
            let target = rec.Value;
            // update the model
            linreg.partialFit(trainVec, target);
        }
    }
});

// create stream aggregate that will be evaluating how well we are doing
let testStreamAggr = cleanStore.addStreamAggr({
    onAdd: (rec) => {
        // check if we trained on at leat 10 records before we start testing
        if (cleanStore.length > (window + 10)) {
            // prepare feature vector
            let testVec = new qm.la.Vector([rec.Value, rec.Ema_1min, rec.Ema_10min]);
            // compute prediction and store for future reference
            rec.Prediction = linreg.predict(testVec);
            // check if we have prediction how close it is to the actual value
            // first get record that was used to predict value current value
            let trainRec = cleanStore[rec.$id - window];
            // compare its prediction to current value
            let diff = Math.abs(trainRec.Prediction - rec.Value);
            console.log(
                "Prediction",
                trainRec.Prediction.toFixed(4),
                rec.Value.toFixed(4),
                diff.toFixed(4)
            );
        }
    }
});

// load the dataset
loader.loadForexDataset(rawStore);
