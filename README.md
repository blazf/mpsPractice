# MPS Text Mining and Sensor Data Analysis

## Slides from the lectures

- [Text mining](TextMiningMPS_Nov2016.pdf)
- [Sensor Data Analysis](SensorAnalytics_November2016.pdf)

## Exercises

### Text mining:

- [Sentiment classification](textmining/sentiment.js) -- constructing bag-of-words
from tweets and classification of sentiment using nearest neighbor and
support vector machine. Example is also available as [RunKit notebook](https://runkit.com/rupnikj/qminer-sentiment-extraction)
- [Wikifier](textmining/wikifier.js) -- call wikifier web service
- [OntoGen](http://ontogen.ijs.si)

### Sensor Data Analysis

- [Hangover regression](https://runkit.com/blazf/hangover-regression)
- [Processing timeseries data](sensordata/processing.js) -- preprocessing of timeseries data
- [Predicting timeseries](sensordata/prediction.js) -- basic timeseries prediction using autoregressive features

## Seminar tasks

### Text Mining

Prepare a presentation of the results in a 5-10 page report and
5-10 slides (10-15 minutes) presentation (all in English).

Overall task description:
- Data loading, cleaning and modeling process
- Identify how to best evaluate the results given the task
- Implement it as a RunKit notebook

Assignments:
- Andraz Repar: Translation memory in OntoGen
- Matej Martinc: Author profiling on tweets PAN (gender classification, Language variety identification)
- Blaz Skrlj: Sentiment detection
- Miha Torkar, Zala Herga: Trend detection on Event Registry data
- Erik Novak, Klemen Kenda: Novelty detection on event Registry data
- James Hodson: ?
- Gregor Grasselli, Tamara Hovhannisyan: Topic classification [dataset](textmining/dataset/news.001.txt)
- Gjorgi Peev, Gordana Ispirova: Topic classification [dataset](textmining/datset/news.002.txt)

***Instructions for topic classification task:***

Datasets are provided in the following format:
- one line is one news article
- first token in the line is article ID
- ID is followed by categories, marked by ! mark and category code
- [Map from category codes to full names](http://jmlr.csail.mit.edu/papers/volume5/lewis04a/a03-expanded-topics-hierarchy/rcv1.topics.hier.expanded)

Goals:
- Parse your dataset
  - Identify categories and how many articles they have
- Generate bag-of-words feature space for the dataset
- Perform classification for two frequent and two rare categorie
  - Identify precision and recall them using cross-validation
- Find an article on the internet that is positively classified into
  each of the selected categories

You can use [sentiment example](textmining/sentiment.js) as a template
on how to load data, create feature space and apply classifier.


### Sensor Data Analysis

Implement prediction task
- Data loading, cleaning and modeling process
- Identify how to best evaluate the results given the task
- Implement it as a RunKit notebook

Assignments:
- Martin Gjoreski: Microsoft Band – predicting stress level
- Miha Torkar, James Hodson: Finance dataset
- Klemen Kenda: Smart grid data
- Zala Herga: credit scoring
- Erik Novak: BicikeLJ
