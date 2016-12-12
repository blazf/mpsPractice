"use strict"

// this is the package we will use for creating web requests
let request = require('request').defaults({jar:true});

// document we wont to wikify
let text = "Wikifier was developed at JSI, a research institute in Ljubljana. Ljubljana is the capital of Slovenia";

// create URL for wikify-ing our document.
// Can also be done using a POST request, but we keep it simple here.
let url = "http://www.wikifier.org/annotate-article?" // web-service link
    + "userKey=zxcvyafzxibbazdjiivvjascdosiyw&"       // user-key, register on www.wikifier.org to get a new one
    + "lang=en&"                                      // language of the submitted document
    + "text=" + encodeURIComponent(text);             // submitted document

// create the request for annotation
request(url, function (err, resp, html) {
    // parse response to json object
    let data = JSON.parse(html);
    // sort annotations according to page rank
    data.annotations = data.annotations.sort((a,b) => b.pageRank - a.pageRank);
    // make a pretty print to screen
    console.log(JSON.stringify(data, null, "  "));
});
