'use strict';

const util = require('util');
const Promise = require('bluebird');
const fs = Promise.promisifyAll(require('fs'));
const csv = require("fast-csv");
const YahooFinanceAPI = require('yahoo-finance-data');
const alpha = require('alphavantage');
const portfolioDir = 'portfolio';
const yahoo = new YahooFinanceAPI({
    key: process.env.YAHOO_KEY,
    secret: process.env.YAHOO_SECRET
});

var WebClient = require('@slack/client').WebClient;
var slack = new WebClient(process.env.SLACK_API_TOKEN);

// A simple hello world Lambda function
exports.handler = (event, context, callback) => {
    // get all stock symbols
    fs.readdirAsync(portfolioDir).then(files => {
        return Promise.map(files, file => {
            return new Promise((resolve, reject) => {
                var symbols = [];
                fs.createReadStream(portfolioDir + '/' + file)
                .pipe(csv())
                .on("data", data => {
                    if (data[0] === "Symbol") return;
                    symbols.push(data[0]);
                })
                .on("end", () => {
                    resolve(symbols);
                });
            });
        });
    })
    .then(portfolios => {
        return Promise.map(portfolios, portfolio => {
            return Promise.map(portfolio, symbol => {
                // get a random key
                var api_keys = process.env.ALPHA_VANTAGE_KEY.split(',');
                var random = Math.floor(Math.random() * api_keys.length);
                return alpha({key: api_keys[random]}).technical.rsi(symbol, '10min', '14', 'close')
                .then(data => {
                    var RSIs = data['Technical Analysis: RSI'];
                    if (RSIs) {
                        var timestamps = Object.keys(RSIs);
                        if (timestamps.length > 0) {
                            var latestRSI = parseFloat(RSIs[timestamps[0]]['RSI']);
                            if (latestRSI && (latestRSI <= 20 || latestRSI >= 80)) {
                                // send slack notification
                                return new Promise((resolve, reject) => {
                                    slack.chat.postMessage('#stock', `<https://finance.yahoo.com/quote/${symbol}|${symbol}>: ${latestRSI}`, function(err, res) {
                                        if (err) {
                                            console.error('slack: ', err);
                                        }
                                        resolve();
                                    });
                                });
                            }
                        }
                    }
                })
                .catch(e => {console.error(`failed: ${symbol}`, e)});
            }, {concurrency: 10});
        }, {concurrency: 1});
    })
    .then(() => {
        callback(null, 'success');
    })
    .catch(e => {
        console.error(e);
        callback(null, e);
    });
}
