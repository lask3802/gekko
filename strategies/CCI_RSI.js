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
  this.trend = {
    direction: 'none',
    duration: 0,
    persisted: false,
    adviced: false
  };

  // how many candles do we need as a base
  // before we can start giving advice?
  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need

  this.uplevel = this.settings.cciSlave.up;
  this.downlevel = this.settings.cciSlave.down;
  this.persisted = this.settings.cciSlave.persistence;

  this.pump = this.settings.cciMaster.up;
  this.dump = this.settings.cciMaster.down;
  this.age = 0;


  this.worker = this.rsiWorker;
  this.cooldownUp = this.settings.cciMaster.cooldownUp;
  this.cooldownDown = this.settings.cciMaster.cooldownDown;
  this.cooldownPersistence = this.settings.cciMaster.persistence;
  this.cooldown = 0;

  this.addIndicator("bb","BB",this.settings.bbands);
  this.addIndicator('cciMaster', 'CCI', this.settings.cciMaster);
  this.addIndicator('rsi', 'RSI', this.settings.rsi);
  this.addIndicator('cciSlave', 'CCI', this.settings.cciSlave);
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

}

method.check = function(candle) {
  this.rsiWorker(candle);
};

method.bbMasterStratrgy = function (candle) {

}

method.cciRsiStrategy = function(candle){
  var cciMaster = this.indicators.cciMaster.result;
  this.age++
  if(cciMaster === false){
    this.rsiWorker(candle);
    return;
  }
  if(cciMaster > this.pump || cciMaster<this.dump){
    //dont work when pump/dump start
    if(this.worker === this.rsiWorker) {
      this.stun = this.settings.cciMaster.stun;
      this.cciWorker(candle);
    }
    this.worker = this.cciWorker;
    log.debug("cci take over, cciMaster:",cciMaster, "age:",this.age,"stun:",this.stun);
    this.cooldown = 0;


  }
  if(cciMaster > this.cooldownDown && cciMaster < this.cooldownUp){
    this.cooldown++;
  }else{
    this.cooldown = 0;
  }

  //dont play at pump/dump
  if(--this.stun >= 0){
    this.advice();
    return;
  }

  if(this.cooldown >= this.cooldownPersistence){
    this.worker = this.rsiWorker;
    this.cooldown = 0;
    log.debug("rsi take over, cciMaster:",cciMaster, "age:",this.age);
  }
  this.worker(candle);
};

method.rsiWorker = function(candle){

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  var bb = this.indicators.bb;
  if(rsiVal > this.settings.rsi.high) {

    // new trend detected
    if(this.trend.direction !== 'high')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'high',
        adviced: false
      };

    this.trend.duration++;

   // log.debug('In high since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.rsi.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;

      this.advice('short');
    } else
      this.advice();

  } else if(rsiVal < this.settings.rsi.low) {

    // new trend detected
    if(this.trend.direction !== 'low')
      this.trend = {
        duration: 0,
        persisted: false,
        direction: 'low',
        adviced: false
      };

    this.trend.duration++;

  //  log.debug('In low since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.rsi.persistence)
      this.trend.persisted = true;

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      //log.debug(candle.close, bb.middle);
      if(candle.close > (bb.middle - bb.lower)*this.settings.bbands.factor+bb.middle ){
        this.advice();
        return;
      }
      this.advice('long');
    } else
      this.advice();

  } else {

    //log.debug('In no trend');
    this.advice();
  }
};

method.cciWorker = function (candle) {

  var price = candle.close;
  this.lastPrice = price;


  var cci = this.indicators.cciSlave;

  if (typeof(cci.result) == 'number') {

    // overbought?

    if (cci.result >= this.uplevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'overbought' ) {
      this.trend.adviced = true;
      this.trend.duration++;
      this.advice('short');
      log.debug('cci short:',cci.result);
    } else if (cci.result >= this.uplevel && this.trend.direction != 'overbought') {
      this.trend.duration = 1;
      this.trend.direction = 'overbought';
      this.trend.persisted = false;
      this.trend.adviced = false;
      if (this.persisted == 0) {
        this.trend.adviced = true;
        this.advice('short');
        log.debug('cci short:',cci.result);
      }
    } else if (cci.result >= this.uplevel) {
      this.trend.duration++;
      if (this.trend.duration >= this.persisted) {
        this.trend.persisted = true;
      }
    } else if (cci.result <= this.downlevel && (this.trend.persisted || this.persisted == 0) && !this.trend.adviced && this.trend.direction == 'oversold') {
      this.trend.adviced = true;
      this.trend.duration++;
      this.advice('long');
      log.debug('cci long:',cci.result);
    } else if (cci.result <= this.downlevel && this.trend.direction != 'oversold') {
      this.trend.duration = 1;
      this.trend.direction = 'oversold';
      this.trend.persisted = false;
      this.trend.adviced = false;
      if (this.persisted == 0) {
        this.trend.adviced = true;
        this.advice('long');
        log.debug('cci long:',cci.result);
      }
    } else if (cci.result <= this.downlevel) {
      this.trend.duration++;
      if (this.trend.duration >= this.persisted) {
        this.trend.persisted = true;
      }
    } else {
      if( this.trend.direction != 'nodirection') {
        this.trend = {
          direction: 'nodirection',
          duration: 0,
          persisted: false,
          adviced: false
        };
      } else {
        this.trend.duration++;
      }
      this.advice();
    }

  } else {
    this.advice();
  }

 // log.debug("Trend: ", this.trend.direction, " for ", this.trend.duration);
}

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
