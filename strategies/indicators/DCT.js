// required indicators
// Simple Moving Average - O(1) implementation

var dct = require('dct');

var Indicator = function(windowLength) {
  this.input = 'price';
  this.windowLength = windowLength;
  this.prices = [];
  this.result = [];

}

Indicator.prototype.update = function(price) {
  this.enqueue(this.prices, price);
  this.result = dct(this.prices);

}

Indicator.prototype.enqueue = function (arr, val){
  arr.push(val);
  //log.debug("window.length:", window.length, " windowSize:", windowSize);
  if(arr.length > this.windowLength){
    arr.shift();
  }
}

module.exports = Indicator;
