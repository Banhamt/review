/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, M = R.M, coef = R.coef, xp = R.xp, ekx = R.ekx, zeros = R.zeros,
      fac = R.fac, ord = R.ord, lin = R.lin, poly = R.poly, cubicFromRoots = R.cubicFromRoots;
    add('t-critical', function (r) {
    var p = r.nz(-4, 3), q = r.nz(p + 1, 5);
    need(p + q !== 0 && q !== 0);
    return {
      prompt: 'Find all critical numbers of $f(x)=' + cubicFromRoots(p, q) + '$.',
      answer: '$x=' + p + ',\\ ' + q + '$',
      wrong: ['$x=' + (-q) + ',\\ ' + (-p) + '$', '$x=0,\\ ' + p + ',\\ ' + q + '$', '$x=' + N((p + q) / 2) + '$',
              '$x=' + p + '$ only', '$x=0,\\ ' + (-q) + ',\\ ' + (-p) + '$']
    };
  });

  add('t-first-deriv-test', function (r) {
    var p = r.int(-5, 3), q = r.int(p + 1, 6), k = r.pick([1, 2, 3, -1, -2, -3]);
    var fp = (k === 1 ? '' : k === -1 ? '-' : k) + fac(p) + fac(q);
    var lo = k > 0 ? 'max' : 'min', hi = k > 0 ? 'min' : 'max';
    return {
      prompt: "Suppose $f'(x)=" + fp + "$. Use a sign diagram for $f'$. Which is true?",
      answer: 'relative ' + lo + ' at $x=' + p + '$, relative ' + hi + ' at $x=' + q + '$',
      wrong: ['relative ' + hi + ' at $x=' + p + '$, relative ' + lo + ' at $x=' + q + '$',
              'relative max at $x=' + (-p) + '$, relative min at $x=' + (-q) + '$',
              'relative ' + lo + ' at $x=' + p + '$, no extremum at $x=' + q + '$',
              'relative max at both $x=' + p + '$ and $x=' + q + '$',
              'relative min at both $x=' + p + '$ and $x=' + q + '$']
    };
  });

  add('t-extremum-point', function (r) {
    var p = r.int(-3, 2), q = r.int(p + 1, 4), d = r.int(-10, 10);
    need(p + q !== 0 && p * q !== 0);
    var f = function (x) { return 2 * x * x * x - 3 * (p + q) * x * x + 6 * p * q * x + d; };
    var fpp = 12 * p - 6 * (p + q);
    return {
      prompt: 'The function $f(x)=' + poly([2, -3 * (p + q), 6 * p * q, d]) + '$ has critical points $x=' + p + '$ and $x=' + q +
              '$, with a relative max at $x=' + p + '$. What is the relative maximum point?',
      answer: '$(' + p + ',\\ ' + f(p) + ')$',
      wrong: ['$(' + p + ',\\ 0)$', '$(' + q + ',\\ ' + f(q) + ')$', '$(' + p + ',\\ ' + fpp + ')$', '$(' + p + ',\\ ' + (-f(p)) + ')$', '$(' + f(p) + ',\\ ' + p + ')$']
    };
  });

    add('t-second-deriv-test', function (r) {
    var p = r.int(-4, 2), q = r.int(p + 1, 5);
    need(p + q !== 0 && p * q !== 0);
    var c = r.pick([p, q]), v = 12 * c - 6 * (p + q);       // f'' = 12x - 6(p+q)
    var kind = v < 0 ? 'relative max' : 'relative min', other = v < 0 ? 'relative min' : 'relative max';
    return {
      prompt: 'The function $f(x)=' + cubicFromRoots(p, q) + '$ has critical points $x=' + p + '$ and $x=' + q +
              "$. Use the second-derivative test at $x=" + c + '$.',
      answer: "$f''(" + c + ')=' + v + '$, so $f$ has a ' + kind,
      wrong: ["$f''(" + c + ')=' + v + '$, so $f$ has a ' + other,
              "$f''(" + c + ')=' + (-v) + '$, so $f$ has a ' + other,
              "$f''(" + c + ')=0$, so there is no conclusion',
              "$f''(" + c + ')=' + v + '$, so $f$ has an inflection point',
              "$f''(" + c + ')=' + (v / 2) + '$, so $f$ has a ' + other]
    };
  });

  add('t-inflection', function (r) {
    var a = r.pick([1, 1, 2, -1]), k = r.nz(-4, 4), c = r.int(-9, 9);
    var f = poly([a, 3 * a * k, c, r.int(-5, 5)]);           // f'' = 6a x + 6a k  ->  x = -k
    return {
      prompt: 'Find the $x$-value of the inflection point of $f(x)=' + f + '$.',
      answer: '$x=' + (-k) + '$',
      wrong: ['$x=' + k + '$', '$x=' + (-3 * k) + '$', '$x=' + (-2 * k) + '$', '$x=' + N(-k / 2) + '$', '$x=0$']
    };
  });

})(window.Review);

