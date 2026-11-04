/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, M = R.M, coef = R.coef, xp = R.xp, ekx = R.ekx, zeros = R.zeros,
      fac = R.fac, ord = R.ord, lin = R.lin, poly = R.poly, cubicFromRoots = R.cubicFromRoots;
    add('t-exp-rate', function (r) {
    var up = r.int(0, 1);
    var P = up ? r.pick([5000, 8000, 12000, 20000, 50000]) : r.pick([15000, 20000, 25000, 30000, 40000]);
    var k = up ? r.pick([0.02, 0.03, 0.04, 0.05, 0.08]) : r.pick([-0.1, -0.2, -0.05, -0.15]);
    var e = 'e^{' + N(k) + 't}', Pk = N(P * k);
    var what = up ? r.pick(['A town\'s population is $P(t)=' + P + e + '$ people', 'An investment is worth $P(t)=' + P + e + '$ dollars'])
                  : "A car's value is $P(t)=" + P + e + '$ dollars';
    return {
      prompt: what + ' after $t$ years. Which is $P\'(t)$?',
      answer: '$' + Pk + e + '$',
      wrong: ['$' + P + e + '$', '$' + N(k) + e + '$', '$' + Pk + 't\\,' + e + '$', '$' + P + 't\\,e^{' + N(k) + 't-1}$']
    };
  });

  add('t-exp-value', function (r) {
    var pop = r.int(0, 1), P = r.pick([5000, 8000, 10000, 12000, 20000]), k = r.pick([0.02, 0.03, 0.04, 0.05]), t = r.pick([5, 10, 20]);
    var unit = pop ? 'people' : 'dollars', v = Math.round(P * k * Math.exp(k * t)), Pt = Math.round(P * Math.exp(k * t));
    var fmt = function (n) { return n.toLocaleString('en-US'); };
    return {
      prompt: (pop ? "A town's population is" : 'An investment is worth') + ' $P(t)=' + P + 'e^{' + N(k) + 't}$ ' + unit + ' after $t$ years. Find $P\'(' + t + ')$ with units.',
      answer: 'about ' + fmt(v) + ' ' + unit + ' per year',
      wrong: ['about ' + fmt(v) + ' ' + unit, 'about ' + fmt(Pt) + ' ' + unit + ' per year', 'about ' + fmt(Math.round(P * k)) + ' ' + unit + ' per year',
              'about ' + fmt(v) + ' years per ' + (pop ? 'person' : 'dollar'), 'about ' + fmt(Pt) + ' ' + unit]
    };
  });

  add('t-ln-rate', function (r) {
    var b = r.pick([2, 3, 4, 5, 6, 8, 10, 12]), x0 = r.pick([2, 4, 5, 8, 10, 20]), a = r.pick([10, 20, 40, 50, 60]);
    need(Number.isInteger(b * 1000 / x0) && b !== x0);
    return {
      prompt: 'Weekly sales are $S(x)=' + a + '+' + b + '\\ln x$ thousand dollars when $x$ thousand dollars is spent on ads. Find $S\'(' + x0 + ')$.',
      answer: '$' + N(b / x0) + '$',
      wrong: ['$' + b + '$', '$' + N(1 / x0) + '$', '$' + N(+(a + b * Math.log(x0)).toFixed(2)) + '$', '$' + N(b * x0) + '$', '$' + N(b / (x0 * x0)) + '$']
    };
  });

  add('t-ln-chain', function (r) {
    var n = r.int(2, 4), a = r.pick([1, 2, 3]), b = r.nz(-6, 6);
    var u = poly([a].concat(zeros(n - 2), [b, 0])), du = poly([n * a].concat(zeros(n - 2), [b]));
    return {
      prompt: 'Find the derivative of $y=\\ln\\!\\left(' + u + '\\right)$.',
      answer: "$y'=\\dfrac{" + du + '}{' + u + '}$',
      wrong: ["$y'=\\dfrac{1}{" + u + '}$', "$y'=\\dfrac{1}{" + du + '}$', "$y'=\\dfrac{" + u + '}{' + du + '}$',
              "$y'=\\ln\\!\\left(" + du + '\\right)$', "$y'=\\dfrac{" + du + '}{x}$']
    };
  });

  add('t-quotient-ln', function (r) {
    var a = r.int(1, 6), den = 'x+' + a;
    return {
      prompt: 'Find the derivative of $y=\\dfrac{\\ln x}{' + den + '}$.',
      answer: "$y'=\\dfrac{(" + den + ')\\cdot\\frac{1}{x}-\\ln x\\cdot 1}{(' + den + ')^{2}}$',
      wrong: ["$y'=\\dfrac{\\ln x\\cdot 1-(" + den + ')\\cdot\\frac{1}{x}}{(' + den + ')^{2}}$', "$y'=\\dfrac{1}{x}$",
              "$y'=\\dfrac{(" + den + ')\\cdot\\frac{1}{x}+\\ln x\\cdot 1}{(' + den + ')^{2}}$',
              "$y'=\\dfrac{(" + den + ')\\cdot\\frac{1}{x}-\\ln x\\cdot 1}{' + den + '}$']
    };
  });

  add('t-log10', function (r) {
    var k = r.pick([1, 2, 3, 4, 5, 7]);
    return {
      prompt: 'Find the derivative of $y=' + coef(k) + '\\log_{10} x$.',
      answer: "$y'=\\dfrac{" + k + '}{x\\ln(10)}$',
      wrong: ["$y'=\\dfrac{" + k + '}{x}$', "$y'=\\dfrac{" + k + '\\ln(10)}{x}$', "$y'=\\dfrac{" + k + '}{10x}$', "$y'=\\dfrac{" + k + '}{\\ln(10)}$']
    };
  });

  add('t-product-ln', function (r) {
    var n = r.int(2, 5);
    return {
      prompt: 'Find the derivative of $y=' + xp(n) + '\\ln x$.',
      answer: "$y'=" + n + xp(n - 1) + '\\ln x+' + xp(n) + '\\cdot\\dfrac{1}{x}$',
      wrong: ["$y'=" + n + xp(n - 1) + '\\cdot\\dfrac{1}{x}$', "$y'=" + n + xp(n - 1) + '\\ln x$',
              "$y'=" + n + xp(n - 1) + '\\ln x+\\dfrac{1}{x}$', "$y'=" + n + xp(n - 1) + '+\\dfrac{1}{x}$',
              "$y'=" + xp(n) + '\\cdot\\dfrac{1}{x}$']
    };
  });

  add('t-product-exp', function (r) {
    var n = r.int(2, 4), k = r.pick([2, 3, 4, 5, -2, -3]), e = ekx(k);
    return {
      prompt: 'Find the derivative of $y=' + xp(n) + e + '$.',
      answer: "$y'=" + n + xp(n - 1) + e + (k < 0 ? '-' + (-k) : '+' + k) + xp(n) + e + '$',
      wrong: ["$y'=" + n + xp(n - 1) + e + '$', "$y'=" + n * k + xp(n - 1) + e + '$',
              "$y'=" + n + xp(n - 1) + e + '+' + xp(n) + e + '$', "$y'=" + (k < 0 ? '-' + -k : k) + xp(n) + e + '$',
              "$y'=" + n + xp(n - 1) + e + '+' + xp(n) + ekx(k - 1) + '$']
    };
  });

  add('t-chain-exp', function (r) {
    var a = r.pick([1, 2, 3, 4]), b = r.nz(-5, 5);
    var u = poly([a, b, 0]), du = poly([2 * a, b]);
    return {
      prompt: 'Find the derivative of $y=e^{' + u + '}$.',
      answer: "$y'=(" + du + ')\\,e^{' + u + '}$',
      wrong: ["$y'=e^{" + u + '}$', "$y'=(" + u + ')\\,e^{' + poly([a, b, -1]) + '}$', "$y'=(" + du + ')\\,e^{' + du + '}$',
              "$y'=e^{" + du + '}$']
    };
  });

  add('t-a-to-x', function (r) {
    var a = r.pick([2, 3, 5, 7, 10]);
    return {
      prompt: 'Find the derivative of $y=' + a + '^{x}$.',
      answer: "$y'=" + a + '^{x}\\ln(' + a + ')$',
      wrong: ["$y'=x\\cdot " + a + '^{x-1}$', "$y'=" + a + '^{x}$', "$y'=\\dfrac{" + a + '^{x}}{\\ln(' + a + ')}$',
              "$y'=" + a + '^{x}\\ln(x)$']
    };
  });

})(window.Review);

