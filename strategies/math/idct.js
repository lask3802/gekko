

var method = {};

method.idct = function(arr){
  var N = arr.length;
  var x = new Array(N);
  var X = arr;
  for (var n = 0; n < N; ++n) {
    var sum = 0.;
    for (var k = 0; k < N; ++k) {
      var s = (k == 0) ? Math.sqrt(.5) : 1.;
      sum += s * X[k] * Math.cos(Math.PI * (n + .5) * k / N);
    }
    x[n] = sum * Math.sqrt(2. / N) *0.2;
  }
  return x;
}

module.exports = method.idct;
