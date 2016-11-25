'use strict'

// Sentiment classification using qminer. Given a set of tweets and their sentiment labels
// (1 for positive and -1 for negative) we will train a machine learning model that predicts
// the sentiment on new texts (uses Support Vector Machines as the machine learning model
// and tfidf-weighted bag of words feature extraction for text processing).

// Import libraries: the main library qminer and a helper package for the example dataset.
let qm = require('qminer');
let loader = require('qminer-data-loader');

// Define the storage schema. We define one store called 'tweets' where each record has two fields:
// text and target (+1 is for positive sentiment and -1 for negative sentiment).
let base = new qm.Base({
    mode: 'createClean',
    schema: [
        { name: 'tweets',
          fields: [
              { name: 'text', type: 'string' },
              { name: 'target', type: 'float' }
          ]
        }
    ]
});

// Import data and select all records.
loader.loadSentimentDataset(base.store('tweets'));
let tweets = base.store('tweets').allRecords;
console.log('got ' + tweets.length + ' tweets');

// Let's print the first few tweets in the training set and its sentiment.
for (let i = 1000; i < 1010; i++) {
    console.log(i, tweets[i].text, tweets[i].target > 0 ? 'POS' : 'NEG');
}

// Build feature space (mapping from records to linear algebra vectors). Here we use a simple
// tfidf weighted bag-of-words feature extractor.
let featureSpace = new qm.FeatureSpace(base, {
    type: 'text', source: 'tweets', field: 'text',
    weight: 'tfidf', // none, tf, idf, tfidf
    tokenizer: {
        type: 'simple',
        stopwords: 'none', // none, en, [...]
        stemmer: 'none' // porter, none
    },
    ngrams: 2,
    normalize: true
});
featureSpace.updateRecords(tweets);
console.log('built feature space with ' + featureSpace.dim + ' dimensions');

// check how feature speace looks like
if (true) {
    // Let's look at how the feature space model looks like. Let's look at dimensions of the
    // underlying vector space:  1, 10, 100, 1000 - what words do they correspond to?
    for (let i of [1, 10, 100, 1000]) {
        console.log('"' + featureSpace.getFeature(i) + '" => id=' + i);
    }

    // Let's try to use the model and map a short text to a vector. We will list the indices
    // of the words that are nonzero.
    for (let p of ['kitty cat', 'kitty cat cats', 'zizek and slavoj zizek', 'eating and chatting on my computer']) {
        // convert to sparse vector
        let sparseVector = featureSpace.extractSparseVector({ text: p });
        // check the vector
        console.log('"' + p + '"  => ' + sparseVector.toString());
        // check indices for individual words in the sparse vector
        for (let i of sparseVector.idxVec().toArray()) {
            console.log('  "' + featureSpace.getFeature(i) +
                        '" => id=' + i +
                        ', vec=' + sparseVector.at(i).toFixed(2));
        }
    }
}

// nearest neighbour search
if (false) {
    // construct sparse matrix
    let bowMatrix = featureSpace.extractSparseMatrix(tweets);
    // check how big is the matrix
    console.log('cols=' + bowMatrix.cols + ', rows=' + bowMatrix.rows + ', nnz=' + bowMatrix.nnz());
    // find nearest neighbours for couple of examples
    let examples = [
        "It is a rainy day",
        "Cats are funny",
        "Cats are stupid.",
        "Cats are totally amazing!",
        "Cats are not totally amazing!"
    ];
    for (let example of examples) {
        // get sparse vector
        let sparseVector = featureSpace.extractSparseVector({ text: example });
        console.log('"' + example + '"  => ' + sparseVector.toString());
        // compute cosine similarity with all the tweets
        let sim = bowMatrix.multiplyT(sparseVector);
        // sort by weight
        let sort = sim.sortPerm(false);
        for (let i = 0; i < 5; i++) {
            // get tweet
            let tweet = tweets[sort.perm[i]].text;
            let target = tweets[sort.perm[i]].target > 0 ? 'POS' : 'NEG'
            // get similarity
            let sim = sort.vec[i];
            // report
            console.log('   ' + sim.toFixed(2) + ' => "' + tweet + '" ' + target);
        }
    }
}

// sentiment classification
if (true) {
    // Build a sentiment classifier model. We use a Support Vector Classifier with default
    // parameters (C = 1). Try varying to see control of overfitting in action!
    let SVC = new qm.analytics.SVC({ c:1, maxTime: 5 });
    SVC.fit(featureSpace.extractSparseMatrix(tweets), tweets.getVector('target'));

    // Let's inspect the model! Since it's a linear model we can directly interpret the
    // weights - words with positive weights will contribute to the decision that the
    // sentiment is positive. Let's look at the weights for 'good', 'cool', 'bad', 'crap'.
    for (let w of ['good', 'cool', 'bad', 'crap', 'find', 'nice', 'zizek']) {
        // convert word to sparse vector
        let sparseVector = featureSpace.extractSparseVector({text: w});
        // if we have any non-zero element
        if (sparseVector.nnz > 0) {
            // First get the word indices.
            let idx = sparseVector.idxVec()[0];
            // Now display the weights! Are the positive words associated with
            // positive weights? What about the negative?
            console.log('"' + w + '" => id=' + idx + ', model=' + SVC.getModel().weights[idx].toFixed(4));
        } else {
            // word not in our space
            console.log('"' + w + '" => not in our feature space');
        }
    }

    // Try our classifier on few examples
    let examples = [
        "Cats are stupid.",
        "Cats are totally amazing!",
        "Cats are not totally amazing!",
        "Cats are on my computer"
    ];

    for (let example of examples) {
        // first make a sparse vector
        let sparseVector = featureSpace.extractSparseVector({ text: example });
        // get the prediction
        let y = SVC.predict(sparseVector);
        // report
        console.log('"' + example + '" => ' + (y > 0 ? 'POS' : 'NEG'));
        for (let i of sparseVector.idxVec().toArray()) {
            console.log('  "' +
                        featureSpace.getFeature(i) + '" => id=' + i +
                        ', vec=' + sparseVector.at(i).toFixed(2) +
                        ', model=' + SVC.getModel().weights[i].toFixed(4));
        }
    }
}
