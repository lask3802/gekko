// If you want to use your own trading methods you can
// write them here. For more information on everything you
// can use please refer to this document:
//
// https://github.com/askmike/gekko/blob/stable/docs/trading_methods.md

var config = require('../core/util.js').getConfig();
var settings = config['talib-macd'];

// Let's create our own method
var method = {};

// Prepare everything our method needs
method.init = function() {
  this.name = 'talib-macd'
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = 'none';

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = config.tradingAdvisor.historySize;

  var customMACDSettings = settings.parameters;
  this.mcadq = [];

  // define the indicators we need
  this.addTalibIndicator('mymacd', 'macd', customMACDSettings);
}

// What happens on every new candle?
method.update = function(candle) {
  // nothing!
}


method.log = function() {
  // nothing!
}

// Based on the newly calculated
// information, check if we should
// update or not.
method.check = function(candle) {
  var price = candle.close;
  var result = this.talibIndicators.mymacd.result;
  var macddiff = result['outMACD'] - result['outMACDSignal'];

  var macdq = this.macdq;
  //not enough data, no trend
  if(macdq.length < 3){
    this.advice();
    return;
  }

  // Will we going up?
  if(this.trend !== "up" && macddiff > 0){

  }

  // Will we going down?
  if(this.trend !== "down" && macddiff < 0){

  }

  this.macdq.push(macddiff);
  if(this.mcadq.length>5) {
    this.mcadq.shift();
  }
}

function isPositiveMountain(macdq){
    for(var idx = macdq.length-1; idx >=0 ; )

}

module.exports = method;
