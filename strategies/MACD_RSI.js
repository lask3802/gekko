/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};

// prepare everything our method needs
method.init = function() {
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.
  this.trend = "unknown";

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;
  this.macdWindow = [];
  // define the indicators we need
  this.addIndicator('macd', 'MACD', this.settings.macd);
  this.addIndicator('rsiPositive', 'RSI', this.settings.rsiPositive);
  this.addIndicator('rsiNegative', 'RSI', this.settings.rsiNegative);
};

// what happens on every new candle?
method.update = function(candle) {

  // nothing!
};

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  var digits = 8;
  var macd = this.indicators.macd;

  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
  log.debug('\t', 'trend:', this.trend);
  log.debug('\t', 'rsiPositive:', this.indicators.rsiPositive.result);
  log.debug('\t', 'rsiNegative:', this.indicators.rsiNegative.result);
  log.debug('\t', 'lastAdviced:', this.lastAdviced);
  log.debug('\t', 'window:', this.macdWindow);
};

method.check = function() {
  var macddiff = this.indicators.macd.result;
  var rsiPositive = this.indicators.rsiPositive.result;
  var rsiNegative = this.indicators.rsiNegative.result;
  //add and remove macd values
  var window = this.macdWindow;
  var windowSize = this.settings.macdThresholds.windowSize;


  window.push(macddiff);
  //log.debug("window.length:", window.length, " windowSize:", windowSize);
  if(window.length > windowSize){
    window.shift();
  }

  //warming up
  if(window.length < windowSize){
    this.advice();
    this.lastAdviced = "none";
    return;
  }

  //State changes
  if(this.isKnownPositive(window)){
    this.trend = "positive";
  }
  if(this.isKnownNegative(window)){
    this.trend = "negative";
  }
  if(this.isUnknown(window)){
    this.trend = "unknown";
  }

  //Ask positive RSI
  if(this.trend === "unknown"){
/*
    //Sell it!
    if(rsiPositive > this.settings.rsiThresholds.high){
      this.advice("short");
      this.lastAdviced = "short";
      this.trend = "unknown";
      return;
    }

    //Buy it!
    if(rsiPositive < this.settings.rsiThresholds.low){
      this.advice("long");
      this.lastAdviced = "long";
      this.trend = "unknown";
      return;
    }*/

  }

  //MACD wants sell
  if(this.trend === "positive"){
    if(this.directionChanges(window) === 1){
      this.trend = "short";
    }
  }

  //MACD wants buy
  if(this.trend === "negative"){
    if(this.directionChanges(window) === 1){
      this.trend = "long";
    }
  }


  if(this.trend === "short"){
    //Ask negative RSI or just sell
    if(this.tailCount(window)>=3){
      this.advice("short");
      this.lastAdviced = "short";
      this.trend = "unknown";
      return;
    }


    if(rsiNegative < this.settings.rsiThresholds.low){
      this.advice("short");
      this.lastAdviced = "short";
      this.trend = "unknown";
      return;
    }

  }

  if(this.trend === "long"){
    //Ask negative RSI or just buy
    if(this.tailCount(window)>=3){
      this.advice("long");
      this.lastAdviced = "long";
      this.trend = "unknown";
      return;
    }

    if(rsiNegative > this.settings.rsiThresholds.high){
      this.advice("long");
      this.lastAdviced = "long";
      this.trend = "unknown";
      return;
    }


  }
  this.advice();
  this.lastAdviced = "none";

};

// all positive
method.isKnownPositive = function (window) {
    return window.map(val=>val >= 0).reduce((acc,val)=>acc&&val );
};

method.isKnownNegative =  function (window){
  return window.map(val=>val <= 0).reduce((acc,val)=>acc&&val );
};

method.directionChanges = function (window) {
  var directionChange = 0;
  var currentSign = Math.sign(window[0]);
  for (var idx = 0; idx < window.length; idx++) {
    var sign = Math.sign(window[idx]);
    if (currentSign !== sign) {
      directionChange++;
      currentSign = sign;
    }
  }
  return directionChange;
};

method.isUnknown = function(window){
  return this.directionChanges(window) >1;
};

method.tailCount = function (window) {
  var headSign = Math.sign(window[window.length-1]);
  return window.filter(val=>Math.sign(val) === headSign).length;
};

module.exports = method;
