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
  this.macdHistory = [];
  // define the indicators we need
  this.addTalibIndicator('macd', 'macd', this.settings.macd);
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

};

method._log = function(){
  var digits = 8;
  var macdResult = this.talibIndicators.macd.result;
  var macddiff = macdResult['outMACD'] - macdResult['outMACDSignal'];
  log.debug('calculated MACD properties for candle:');
  log.debug('\t', 'macdiff:', macddiff.toFixed(digits));
  log.debug('\t', 'trend:', this.trend);
  log.debug('\t', 'rsiPositive:', this.indicators.rsiPositive.result);
  log.debug('\t', 'rsiNegative:', this.indicators.rsiNegative.result);
  log.debug('\t', 'lastAdviced:', this.lastAdviced);
  log.debug('\t', 'decision:', this.decision);
  log.debug('\t', 'tail:', this.tailCount(this.macdWindow));
  //log.debug('\t', 'window:', this.macdWindow);
}

method.check = function() {
  var rsiPositive = this.indicators.rsiPositive.result;
  var rsiNegative = this.indicators.rsiNegative.result;
  //add and remove macd values
  var macdResult = this.talibIndicators.macd.result;
  var macddiff = macdResult['outMACD'] - macdResult['outMACDSignal'];

  var window = this.macdWindow;
  var windowSize = this.settings.macdThresholds.windowSize;
  var history = this.macdHistory;


    history.push(macddiff);
  //log.debug(history);
  var factor = _.max(history.map(v=>Math.abs(v)));

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

  this.macdWindow = history.slice(history.length-1-windowSize, history.length-1).map(v=>v/factor);

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

/*
  if(this.isShortSignal(window)){

    this.shortAdvice();
    return;
  }

  if(this.isLongSignal(window)){
    this.longAdvice();
    return;
  }


  //Sell it!
  if(rsiPositive > this.settings.rsiThresholds.high){
    this.shortAdvice();
    return;
  }

  //Buy it!
  if(rsiPositive < this.settings.rsiThresholds.low){
    this.longAdvice();
    return;
  }*/

  //Ask Positive RSI
  /*
  if(this.trend === "unknown") {
    if (rsiPositive > this.settings.rsiThresholds.high) {
      this.decision = "rsiPositive";
      this.shortAdvice();

      return;
    }

    //Buy it!
    if (rsiPositive < this.settings.rsiThresholds.low) {
      this.decision = "rsiPositive";
      this.longAdvice();
      return;
    }
  }*/

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
      if(this.tailCount(window)>=this.settings.macdThresholds.persistence
      ){

        this.decision = "macd";
        this.shortAdvice();

        return;
      }


      if(rsiNegative > this.settings.rsiThresholds.high){
        this.decision = "rsiNegative";
        this.shortAdvice();

        return;
      }

    }

    if(this.trend === "long"){
      //Ask negative RSI or just buy
      if(this.tailCount(window)>=this.settings.macdThresholds.persistence){

        this.decision = "macd";
        this.longAdvice();
        return;
      }

      if(rsiNegative < this.settings.rsiThresholds.low){
        this.decision = "rsiNegative";
        this.longAdvice();
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

method.isShortSignal = function (window) {
  return Math.sign(window[0]) === 1
    && this.directionChanges(window) ===1
    && this.tailCount(window) === this.settings.macdThresholds.persistence;

};

method.isLongSignal = function (window) {
  return Math.sign(window[0]) === -1
    && this.directionChanges(window) ===1
    && this.tailCount(window) === this.settings.macdThresholds.persistence;

};

method.shortAdvice = function(){
  this.advice("short");
  this.lastAdviced = "short";
  this._log();
  this.trend = "unknown";

};

method.longAdvice = function () {
  this.advice("long");
  this.lastAdviced = "long";
  this._log();
  this.trend = "unknown";

}

module.exports = method;
