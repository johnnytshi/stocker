'use strict';

const util = require('util');
const YahooFinanceAPI = require('yahoo-finance-data');

const api = new YahooFinanceAPI({
  key: process.env.key,
  secret: process.env.secret
});

// A simple hello world Lambda function
exports.handler = (event, context, callback) => {
    api.getHistoricalData('AAPL', '1d', '3mo')
    .then(data => console.log(util.inspect(data.chart.result[0].indicators.quote[0].close, false, null)))
    .catch(err => console.log(err))
    .finally(() => {
        callback(null, "Hello");
    });
}
