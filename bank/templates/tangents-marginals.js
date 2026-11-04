/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, M = R.M, coef = R.coef, xp = R.xp, ekx = R.ekx, zeros = R.zeros,
      fac = R.fac, ord = R.ord, lin = R.lin, poly = R.poly, cubicFromRoots = R.cubicFromRoots;
    add('t-tangent-quad', function (r) {
    var a = r.nz(-3, 3), b = r.int(-6, 6), c = r.int(-6, 6), x0 = r.nz(-3, 3);
    var m = 2 * a * x0 + b, y0 = a * x0 * x0 + b * x0 + c, bb = y0 - m * x0;
    need(m !== 0 && bb !== 0 && y0 !== 0 && m !== y0);
    var m2 = a * x0 + b;                                   // forgot to multiply by the power
    return {
      prompt: 'Find the equation of the tangent line to $f(x)=' + poly([a, b, c]) + '$ at $x=' + x0 + '$.',
      answer: '$y=' + lin(m, bb) + '$',
      wrong: ['$y=' + lin(m, y0) + '$',                    // used f(x0) as b
              '$y=' + lin(m, -bb) + '$',
              '$y=' + lin(m2, y0 - m2 * x0) + '$',
              '$y=' + lin(y0, y0 - y0 * x0) + '$',         // used f(x0) as the slope
              '$y=' + lin(m, bb + 2 * m) + '$']
    };
  });

  add('t-tangent-lnexp', function (r) {
    var k = r.nz(-4, 5), m, bb, f, x0;
    if (r.int(0, 1)) {                                     // k x^n ln x at x = 1:  f(1)=0, f'(1)=k
      var n = r.int(2, 3);
      f = (k === 1 ? '' : k === -1 ? '-' : k) + xp(n) + '\\ln x'; x0 = 1; m = k; bb = -k;
      return { prompt: 'Find the equation of the tangent line to $f(x)=' + f + '$ at $x=1$.',
        answer: '$y=' + lin(m, bb) + '$',
        wrong: ['$y=' + lin(m, 0) + '$', '$y=' + lin(m, -bb) + '$', '$y=' + lin(n * k, -n * k) + '$',
                '$y=' + lin(k + 1, -(k + 1)) + '$', '$y=' + lin(m, 1) + '$'] };
    }
    var a = r.pick([2, 3, 4, 5]), kk = r.nz(-3, 3);       // a e^{kx} at x = 0: f(0)=a, f'(0)=ak
    m = a * kk; bb = a;
    return { prompt: 'Find the equation of the tangent line to $f(x)=' + a + ekx(kk) + '$ at $x=0$.',
      answer: '$y=' + lin(m, bb) + '$',
      wrong: ['$y=' + lin(a, a) + '$', '$y=' + lin(m, 0) + '$', '$y=' + lin(kk, a) + '$',
              '$y=' + lin(m, m) + '$', '$y=' + lin(a, m) + '$'] };
  });

  add('t-marginal-cost', function (r) {
    var c = r.pick([0.1, 0.2, 0.4, 0.5]), d = r.pick([10, 15, 20, 25, 30, 40]), F = r.pick([500, 1000, 1500, 2000, 3000]);
    var x0 = r.pick([50, 100, 150, 200]), item = r.pick(['bikes', 'chairs', 'lamps', 'guitars', 'tables']);
    var mc = 2 * c * x0 + d, Cx = c * x0 * x0 + d * x0 + F;
    return {
      prompt: 'The cost to make $x$ ' + item + ' is $C(x)=' + poly([c, d, F]) + '$ dollars. Which is true?',
      answer: '$MC(' + x0 + ')=' + M(mc) + '$, so the ' + ord(x0 + 1) + ' item costs about ' + M(mc),
      wrong: ['$MC(' + x0 + ')=' + M(mc) + '$, so ' + x0 + ' items cost about ' + M(mc) + ' in total',
              '$MC(' + x0 + ')=' + M(c * x0 + d) + '$, so the ' + ord(x0 + 1) + ' item costs about ' + M(c * x0 + d),
              '$C(' + x0 + ')=' + M(Cx) + '$, so the ' + ord(x0 + 1) + ' item costs about ' + M(Cx),
              '$MC(' + x0 + ')=' + M(mc) + '$, so the ' + ord(x0) + ' item costs exactly ' + M(mc)]
    };
  });

  add('t-marginal-revenue', function (r) {
    var a = r.pick([20, 30, 40, 50, 60, 80]), b = r.pick([0.01, 0.02, 0.05, 0.1]), x0 = r.pick([100, 200, 250, 300, 400, 500]);
    var mr = a - 2 * b * x0, Rx = a * x0 - b * x0 * x0, item = r.pick(['mugs', 'posters', 'phone cases', 'hats', 'notebooks']);
    need(mr > 0 && Rx > 0);
    return {
      prompt: 'The revenue from selling $x$ ' + item + ' is $R(x)=' + a + 'x-' + N(b) + 'x^{2}$ dollars. Which is true?',
      answer: '$MR(' + x0 + ')=' + M(mr) + '$, so the ' + ord(x0 + 1) + ' item brings in about ' + M(mr),
      wrong: ['$MR(' + x0 + ')=' + M(mr) + '$, so ' + x0 + ' items bring in about ' + M(mr) + ' in total',
              '$MR(' + x0 + ')=' + M(a - b * x0) + '$, so the ' + ord(x0 + 1) + ' item brings in about ' + M(a - b * x0),
              '$R(' + x0 + ')=' + M(Rx) + '$, so the ' + ord(x0 + 1) + ' item brings in about ' + M(Rx),
              '$MR(' + x0 + ')=' + M(mr) + '$, so the ' + ord(x0) + ' item brings in exactly ' + M(mr)]
    };
  });

})(window.Review);

