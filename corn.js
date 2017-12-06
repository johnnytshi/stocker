'use strict';

const util = require('util');
const YahooFinanceAPI = require('yahoo-finance-data');
const AWS = require("aws-sdk");
AWS.config.update({
  region: "us-west-2"
});
const docClient = new AWS.DynamoDB.DocumentClient();

const api = new YahooFinanceAPI({
  key: process.env.key,
  secret: process.env.secret
});

function generateQuery(symbol, lowest_close) {
  return {
        TableName: "StockSummary",
        Key:{
            "Symbol": symbol,
        },
        UpdateExpression: "set Symbol = :Symbol, LowestClose = :LowestClose",
        ConditionExpression: "attribute_not_exists(Symbol) OR Symbol = :Symbol",
        ExpressionAttributeValues: {
            ':Symbol': symbol,
            ':LowestClose': lowest_close
        },
        ReturnValues: "UPDATED_NEW"
    };
}

// A simple hello world Lambda function
exports.handler = (event, context, callback) => {
    api.getHistoricalData('AAPL', '1d', '3mo')
    .then(data => console.log(util.inspect(data.chart.result[0].indicators, false, null)))
    .catch(err => console.log(err))
    .finally(() => {
        callback(null, "Hello");
    });
}
