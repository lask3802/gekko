/*

  MACD - DJM 31/12/2013

  (updated a couple of times since, check git history)

 */

// helpers
var _ = require('lodash');
var log = require('../core/log.js');

// let's create our own method
var method = {};
var util = require('../core/util');
var dirs = util.dirs();
var talib = require(dirs.core + 'talib');

// prepare everything our method needs
method.init = function() {
  // keep state about the current trend
  // here, on every new candle we use this
  // state object to check if we need to
  // report it.


  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;
  //log.debug(talib);
  // define the indicators we need
  this.duration = 0;
  this.trend = "none";

  this.addTalibIndicator('kdj', 'stochf', this.settings.kdj);

};

// what happens on every new candle?
method.update = function(candle) {
  // nothing!
};

// for debugging purposes: log the last calculated
// EMAs and diff.
method.log = function() {
  //this._log();
};

method._log = function(){
  var digits = 8;
  var kdj = this.talibIndicators.kdj.result;
  log.debug("Output of kdj:",kdj);
  log.debug("\t", "k:",this.k);
  log.debug("\t", "d:",this.d);
  log.debug("\t", "j:",this.j);
}

method.check = function() {
  this.k = this.talibIndicators.kdj.result['outFastK'];
  this.d = this.talibIndicators.kdj.result['outFastD'];
  this.j = this.k*3-this.d*2;

  var intersaction = false;
  this.duration++;

  //Trend up
  if(this.k > this.d
    || (this.trend === "down" && Math.abs(this.k-this.d)<this.settings.thresholds.margin)){
    if(this.trend === "down") {intersaction = true;
    }// from down to up
    this.trend = "up";
  }
  else if(this.k < this.d
    || (this.trend ==="up" && Math.abs(this.k-this.d)<this.settings.thresholds.margin)){
    if(this.trend === "up") {
      intersaction = true;}

    this.trend = "down";
  }


  //buy signal
  if(this.trend ==="up" && intersaction){
    if(this.d <= this.settings.thresholds.low
      && this.duration >= this.settings.thresholds.persistence)
    {
      //if(this.j<0)
      this.longAdvice();

    }

  }

  //sell signal
  if(this.trend === "down" && intersaction){
    if(this.d >= this.settings.thresholds.high
      && this.duration >= this.settings.thresholds.persistence
    )
    {
      //if(this.j>100)
      this.shortAdvice();

    }
  }



  if(intersaction){
    this.duration = 0;
  }

  this.advice();
};

// all positive
method.isKnownPositive = function (window) {
    return window.map(val=>val >= 0).reduce((acc,val)=>acc&&val );
};

method.isKnownNegative =  function (window){
  return window.map(val=>val <= 0).reduce((acc,val)=>acc&&val );
};


method.isUnknown = function(window){
  return this.directionChanges(window) >1;
};

method.tailCount = function (window) {
  var headSign = Math.sign(window[window.length-1]);
  return window.filter(val=>Math.sign(val) === headSign).length;
};

method.isShortSignal = function (window) {

};

method.isLongSignal = function (window) {


};

method.shortAdvice = function(){
  this.advice("short");
  this.lastAdviced = "short";
  //this._log();
  //this.trend = "unknown";

};

method.longAdvice = function () {
  this.advice("long");
  this.lastAdviced = "long";
  //this._log();
  //this.trend = "unknown";

}

module.exports = method;
