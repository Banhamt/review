/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, M = R.M, coef = R.coef, xp = R.xp, ekx = R.ekx, zeros = R.zeros,
      fac = R.fac, ord = R.ord, lin = R.lin, poly = R.poly, cubicFromRoots = R.cubicFromRoots;
    add('t-avg-cost', function (r) {
    var x = r.pick([20, 40, 50, 60, 100, 200]), c = r.pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2]);
    var F = Math.round(c * x * x), d = r.pick([5, 8, 10, 12, 15, 20, 25]);
    need(F >= 50 && F <= 20000);
    return {
      prompt: 'The cost of making $x$ units is $C(x)=' + poly([c, d, F]) + '$. How many units minimize the <b>average</b> cost?',
      answer: N(x) + ' units',
      wrong: [N(2 * x) + ' units', N(x / 2) + ' units', N(Math.round(Math.sqrt(F))) + ' units', N(10 * x) + ' units', N(F / x / 2) + ' units']
    };
  });

  add('t-avg-cost-func', function (r) {
    var c = r.pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 2, 3]), d = r.pick([5, 8, 10, 12, 15, 20, 25]), F = r.pick([200, 400, 500, 800, 1000, 1200, 2000]);
    var A = '\\overline{C}(x)=';
    return {
      prompt: 'The cost of making $x$ units is $C(x)=' + poly([c, d, F]) + '$. Which is the average cost function?',
      answer: '$' + A + poly([c, d]) + '+\\dfrac{' + F + '}{x}$',
      wrong: ['$' + A + poly([c, d, 0]) + '+\\dfrac{' + F + '}{x}$', '$' + A + poly([c, d, F]) + '$',
              '$' + A + poly([2 * c, d]) + '$', '$' + A + coef(c) + 'x+\\dfrac{' + d + '}{x}+\\dfrac{' + F + '}{x}$',
              '$' + A + poly([c, d]) + '+' + F + 'x$']
    };
  });

  add('t-min-avg-value', function (r) {
    var x = r.pick([20, 40, 50, 100, 200]), c = r.pick([0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2]);
    var F = Math.round(c * x * x), d = r.pick([5, 8, 10, 12, 15, 20, 25]);
    need(F >= 50 && F <= 20000);
    var Cx = c * x * x + d * x + F;
    return {
      prompt: 'The cost of making $x$ units is $C(x)=' + poly([c, d, F]) + '$ dollars. The average cost is smallest at $x=' + x +
              '$. What is the minimum average cost?',
      answer: M(2 * c * x + d) + ' per unit',
      wrong: [M(Cx) + ' per unit', M(c * x + d) + ' per unit', M(c * x + d + F) + ' per unit', M(3 * c * x + d) + ' per unit', M(Cx / 2) + ' per unit']
    };
  });

  add('t-linear-demand', function (r) {
    var q1 = r.pick([100, 200, 300, 400, 500]), dq = r.pick([100, 200]), dp = r.pick([1, 2, 4, 5]);
    var m = -dp / dq, p1 = r.int(dp + 4, 30), b = p1 - m * q1, p2 = p1 - dp;
    var thing = r.pick(['pies', 'T-shirts', 'tickets', 'sandwiches', 'candles']);
    return {
      prompt: 'A shop sells ' + q1 + ' ' + thing + ' a month at ' + M(p1) + ' each. At ' + M(p2) + ' it sells ' + (q1 + dq) +
              '. Assuming linear demand, which gives the price $p$ in terms of the number sold $x$?',
      answer: '$p=' + lin(m, b) + '$',
      wrong: ['$p=' + lin(-m, p1 + m * q1) + '$', '$p=' + lin(m, p1) + '$', '$p=' + lin(-dq / dp, p1 + dq / dp * q1) + '$',
              '$p=' + lin(m, p1 + m * q1) + '$', '$p=' + lin(-m, b) + '$']
    };
  });

  add('t-max-revenue', function (r) {
    var x = r.pick([100, 150, 200, 250, 300, 400, 500, 600, 800]), s = r.pick([0.01, 0.02, 0.05, 0.1]);
    var b = 2 * s * x;
    need(b === Math.round(b) && b >= 4);
    return {
      prompt: 'The price for selling $x$ items is $p=' + lin(-s, b) + '$ dollars. How many items maximize revenue?',
      answer: N(x) + ' items',
      wrong: [N(2 * x) + ' items', N(x / 2) + ' items', N(b) + ' items', N(s * x) + ' items', N(4 * x) + ' items']
    };
  });

  add('t-price-at-max', function (r) {
    var x = r.pick([100, 150, 200, 250, 300, 400, 500, 600, 800]), s = r.pick([0.01, 0.02, 0.05, 0.1]);
    var b = 2 * s * x;
    need(b === Math.round(b) && b >= 6);
    return {
      prompt: 'The price for selling $x$ items is $p=' + lin(-s, b) + '$ dollars, and revenue is largest at $x=' + x + '$. What price gives the maximum revenue?',
      answer: M(s * x),
      wrong: [M(x), M(b), M(s * x * x), M(s * x / 2), M(b - s)]
    };
  });

  add('t-avg-cost-at', function (r) {
    var x0 = r.pick([10, 20, 25, 50, 100]), c = r.pick([0.1, 0.2, 0.5, 1, 2]), d = r.pick([4, 6, 8, 10, 12, 15]);
    var F = r.pick([500, 1000, 2000, 2500, 5000]), Cx = c * x0 * x0 + d * x0 + F;
    return {
      prompt: 'The cost of making $x$ units is $C(x)=' + poly([c, d, F]) + '$ dollars. What is the average cost per unit when ' + x0 + ' units are made?',
      answer: M(Cx / x0) + ' per unit',
      wrong: [M(Cx) + ' per unit', M(2 * c * x0 + d) + ' per unit', M(c * x0 + d) + ' per unit', M(F / x0) + ' per unit', M(Cx / x0 + F / x0) + ' per unit']
    };
  });

})(window.Review);

