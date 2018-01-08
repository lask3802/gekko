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
  this.prevDct = [];
  this.addIndicator("dct","DCT", 30);
};

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
};

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  //log.debug(this.prevDct);
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

  var coeff = this.indicators.dct.result.slice();
  /*for(var idx = 0 ; idx < coeff.length ; idx++){
    coeff[idx] = coeff[idx] - this.prevDct[idx];
  }*/
  log.debug(coeff);
  if(coeff[0] >0 ){
    this.advice("short");
  }
  else if(coeff[0]<0 ){
    this.advice("long");
  }else
    this.advice();
  this.prevDct = this.indicators.dct.result;


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
