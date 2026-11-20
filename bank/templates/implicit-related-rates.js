/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N, poly = R.poly;

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function frac(n, d) {                    // reduced fraction as LaTeX: 3, -2, \frac{3}{4}, -\frac{3}{4}
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d); n /= g; d /= g;
    return d === 1 ? String(n) : (n < 0 ? '-' : '') + '\\frac{' + Math.abs(n) + '}{' + d + '}';
  }
  function mono(c, v, p) {                 // c v^p, e.g. 6x^{2}, -y, 4
    var pw = p === 0 ? '' : p === 1 ? v : v + '^{' + p + '}';
    if (!pw) return String(c);
    return (c === 1 ? '' : c === -1 ? '-' : String(c)) + pw;
  }
  function dfrac(a, b) { return '\\dfrac{' + a + '}{' + b + '}'; }
  var DY = '\\frac{dy}{dx}';
  function dd(v) { return '\\frac{d' + v + '}{dt}'; }

    add('t-imp-power', function (r) {
    var n = r.int(2, 4), m = r.int(2, 4), b = r.pick([1, 2, 3, 4, 5, -2, -3, -4]), c = r.int(5, 40);
    var eq = 'y^{' + n + '}' + (b > 0 ? '+' : '-') + mono(Math.abs(b), 'x', m) + '=' + c;
    var top = mono(-b * m, 'x', m - 1), topPos = mono(b * m, 'x', m - 1), bot = mono(n, 'y', n - 1);
    return {
      prompt: 'Use implicit differentiation to find $' + DY + '$ for $' + eq + '$.',
      answer: '$' + DY + '=' + dfrac(top, bot) + '$',
      wrong: ['$' + DY + '=' + dfrac(topPos, bot) + '$', '$' + DY + '=' + dfrac(bot, top) + '$',
              '$' + DY + '=' + top + '$', '$' + DY + '=' + dfrac(top, mono(n, 'y', n)) + '$',
              '$' + DY + '=' + dfrac(top, String(n)) + '$']
    };
  });

  add('t-imp-two-y', function (r) {
    var a = r.int(1, 4), b = r.int(2, 7), c = r.int(1, 3), n = r.int(2, 4);
    var eq = mono(a, 'y', 2) + '+' + mono(b, 'y', 1) + '=' + mono(c, 'x', n);
    var top = mono(c * n, 'x', n - 1), bot = mono(2 * a, 'y', 1) + '+' + b;
    return {
      prompt: 'Use implicit differentiation to find $' + DY + '$ for $' + eq + '$.',
      answer: '$' + DY + '=' + dfrac(top, bot) + '$',
      wrong: ['$' + DY + '=' + dfrac(top, mono(2 * a, 'y', 1)) + '$', '$' + DY + '=' + dfrac(bot, top) + '$',
              '$' + DY + '=' + dfrac('-' + top, bot) + '$', '$' + DY + '=' + top + '-(' + bot + ')$',
              '$' + DY + '=' + dfrac(top, mono(2 * a, 'y', 1) + '+' + mono(b, 'y', 1)) + '$']
    };
  });

  add('t-imp-slope', function (r) {
    if (r.int(0, 1)) {
      var x0 = r.int(1, 3), y0 = r.int(2, 6), k = y0 * y0 - x0 * x0 * x0;
      need(k !== 0);
      var eq = 'y^{2}=x^{3}' + (k > 0 ? '+' : '-') + Math.abs(k);
      return {
        prompt: 'The point $(' + x0 + ',\\,' + y0 + ')$ is on the curve $' + eq + '$. Find the slope of the tangent line there.',
        answer: '$' + frac(3 * x0 * x0, 2 * y0) + '$',
        wrong: ['$' + frac(2 * y0, 3 * x0 * x0) + '$', '$' + (3 * x0 * x0) + '$', '$' + frac(-3 * x0 * x0, 2 * y0) + '$',
                '$' + frac(3 * x0, 2 * y0) + '$', '$' + frac(3 * x0 * x0, y0) + '$']
      };
    }
    var X = r.int(1, 5), Y = r.int(1, 3), K = X * X + Y * Y * Y;
    return {
      prompt: 'The point $(' + X + ',\\,' + Y + ')$ is on the curve $x^{2}+y^{3}=' + K + '$. Find the slope of the tangent line there.',
      answer: '$' + frac(-2 * X, 3 * Y * Y) + '$',
      wrong: ['$' + frac(2 * X, 3 * Y * Y) + '$', '$' + frac(-3 * Y * Y, 2 * X) + '$', '$' + (-2 * X) + '$',
              '$' + frac(-2 * X, 3 * Y) + '$', '$' + frac(-2 * X, Y * Y) + '$']
    };
  });

  add('t-imp-tangent', function (r) {
    var x0 = r.pick([2, 4]), y0 = r.pick([1, 2, 3, 4, 6, 12]), k = y0 * y0 - x0 * x0 * x0, m = 3 * x0 * x0 / (2 * y0);
    need(k !== 0 && Number.isInteger(m) && m <= 8);
    var line = function (s, b) { return '$y=' + (s === 1 ? '' : s) + 'x' + (b === 0 ? '' : (b > 0 ? '+' : '-') + Math.abs(b)) + '$'; };
    var eq = 'y^{2}=x^{3}' + (k > 0 ? '+' : '-') + Math.abs(k);
    return {
      prompt: 'The point $(' + x0 + ',\\,' + y0 + ')$ is on the curve $' + eq + '$. Find the equation of the tangent line there.',
      answer: line(m, y0 - m * x0),
      wrong: [line(m, 0), line(m, y0), line(m, y0 + m * x0), line(3 * x0 * x0, y0 - 3 * x0 * x0 * x0), line(x0, y0)]
    };
  });

    add('t-rr-eq', function (r) {
    var pair = r.pick([['y', 'x'], ['A', 's'], ['V', 'r'], ['C', 'q']]), Y = pair[0], X = pair[1];
    var a = r.int(1, 6), n = r.int(2, 4);
    var d = mono(a * n, X, n - 1);
    return {
      prompt: 'Let $' + Y + '=' + mono(a, X, n) + '$, where $' + Y + '$ and $' + X + '$ both change with time $t$. Which is the related rates equation?',
      answer: '$' + dd(Y) + '=' + d + '\\cdot' + dd(X) + '$',
      wrong: ['$' + dd(Y) + '=' + d + '$', '$' + dd(Y) + '=' + mono(a, X, n) + '\\cdot' + dd(X) + '$',
              '$' + dd(X) + '=' + d + '\\cdot' + dd(Y) + '$', '$' + dd(Y) + '=' + (a * n) + dd(X) + '$',
              '$' + dd(Y) + '=' + d + '\\cdot' + dd(Y) + '$']
    };
  });

  add('t-rr-revenue', function (r) {
    var p = r.pick([40, 50, 60, 80, 100]), q = r.pick([0.1, 0.2, 0.25, 0.5]), c = r.pick([5, 10, 20]), x0 = r.pick([50, 100, 150, 200, 250]);
    var v = (p - 2 * q * x0) * c;
    need(Math.abs(v) > 0 && Number.isInteger(v));
    var Rv = p * x0 - q * x0 * x0;
    var d = function (val) { return '$' + N(val) + '$ dollars per week'; };
    return {
      prompt: 'Revenue is $R=' + p + 'x-' + N(q) + 'x^{2}$ dollars for $x$ units, and sales are increasing by ' + c +
              ' units per week. How fast is revenue changing when $x=' + x0 + '$?',
      answer: d(v),
      wrong: [d(p - 2 * q * x0), d((p - q * x0) * c), d(-v), d(Rv), d(p * c)]
    };
  });

  add('t-rr-find-rate', function (r) {
    var a = r.int(1, 4), n = r.int(2, 3), x0 = r.int(1, 4), c = r.pick([6, 8, 12, 18, 24, 36, 48]);
    var k = a * n * Math.pow(x0, n - 1);
    need(k > 1 && k !== c);
    var u = function (s) { return '$' + s + '$ units per second'; };
    return {
      prompt: 'Let $y=' + mono(a, 'x', n) + '$. If $y$ is increasing at ' + c + ' units per second, how fast is $x$ changing when $x=' + x0 + '$?',
      answer: u(frac(c, k)),
      wrong: [u(String(c * k)), u(frac(k, c)), u(frac(c, a * Math.pow(x0, n))), u(String(k)), u(frac(c, a * n))]
    };
  });

    var TRIPLES = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [12, 16, 20], [7, 24, 25]];

  add('t-rr-ladder', function (r) {
    var t = r.pick(TRIPLES), flip = r.int(0, 1), x0 = flip ? t[1] : t[0], y0 = flip ? t[0] : t[1], L = t[2], v = r.pick([1, 2, 3, 4]);
    var ft = function (s) { return '$' + s + '$ ft/sec'; };
    return {
      prompt: 'A ' + L + ' ft ladder leans against a wall, so $x^{2}+y^{2}=' + (L * L) + '$. The bottom slides away from the wall at ' + v +
              ' ft/sec. How fast is the top moving when the bottom is ' + x0 + ' ft from the wall?',
      answer: ft(frac(-x0 * v, y0)),
      wrong: [ft(frac(x0 * v, y0)), ft(frac(-y0 * v, x0)), ft(String(-v)), ft(String(-x0 * v)), ft(frac(-x0 * v, L))]
    };
  });

  add('t-rr-cars', function (r) {
    var t = r.pick([[6, 8, 10], [3, 4, 5], [5, 12, 13], [9, 12, 15], [12, 16, 20]]), flip = r.int(0, 1);
    var y0 = flip ? t[1] : t[0], x0 = flip ? t[0] : t[1], D = t[2];
    var a = r.pick([20, 30, 40, 50, 60]), b = r.pick([20, 30, 40, 50, 60]);
    var top = x0 * b + y0 * a;
    need(a !== b && top % D === 0);
    var swap = x0 * a + y0 * b;
    var mph = function (s) { return '$' + s + '$ mph'; };
    return {
      prompt: 'Car A is ' + y0 + ' miles north of an intersection, driving north at ' + a + ' mph. Car B is ' + x0 +
              ' miles east of it, driving east at ' + b + ' mph. With $D^{2}=x^{2}+y^{2}$, how fast is the distance $D$ between them increasing?',
      answer: mph(String(top / D)),
      wrong: [mph(String(a + b)), mph(String(top)), mph(frac(swap, D)), mph(N(+Math.sqrt(a * a + b * b).toFixed(1))), mph(frac(top, 2 * D))]
    };
  });

  add('t-rr-demand', function (r) {
    var k = r.pick([1, 2, 4, 9]), x0 = r.pick([20, 30, 40, 50, 60]), p0 = r.pick([5, 10, 15, 20]), s = r.pick([0.5, 1, 1.5, 2]);
    var v = k * p0 * s / x0;
    need(Math.round(v * 100) === v * 100 && v !== s);
    var C = x0 * x0 + k * p0 * p0;
    var u = function (val) { return '$' + N(val) + '$ units per week'; };
    return {
      prompt: 'Weekly sales $x$ and price $p$ (dollars) are related by $x^{2}+' + (k === 1 ? '' : k) + 'p^{2}=' + C + '$. The price is falling ' +
              R.M(s) + ' per week. How fast are sales changing when $p=' + p0 + '$ and $x=' + x0 + '$?',
      answer: u(v),
      wrong: [u(-v), u(k * p0 * s), u(k * p0 / x0), u(+(x0 * s / (k * p0)).toFixed(2)), u(+(2 * k * p0 * s / x0).toFixed(2))]
    };
  });

  add('t-rr-sign', function (r) {
    var c = r.pick([
      ['The price of a product', 'p', 'falling', 'dollars per week', -1],
      ['The radius of a melting snowball', 'r', 'shrinking', 'cm per minute', -1],
      ['The water level in a tank', 'h', 'dropping', 'ft per hour', -1],
      ['Weekly sales', 'x', 'increasing', 'units per week', 1],
      ['The radius of an oil spill', 'r', 'growing', 'ft per minute', 1]]);
    var amt = r.pick([2, 3, 4, 5, 1.5]), v = c[1], val = c[4] * amt;
    return {
      prompt: c[0] + ' $' + v + '$ is ' + c[2] + ' at ' + N(amt) + ' ' + c[3] + '. Which is correct?',
      answer: '$' + dd(v) + '=' + N(val) + '$',
      wrong: ['$' + dd(v) + '=' + N(-val) + '$', '$' + v + '=' + N(val) + '$', '$' + dd(v) + '=0$', '$' + dd(v) + '=' + N(val) + 't$']
    };
  });

  add('t-rr-word-eq', function (r) {
    var which = r.int(0, 2);
    if (which === 0) {
      var k = r.pick([2, 4, 9]), C = r.pick([1600, 2500, 3600]);
      return {
        prompt: 'Weekly sales $x$ and price $p$ are related by $x^{2}+' + k + 'p^{2}=' + C + '$, where both change with time $t$. Which is the related rates equation?',
        answer: '$2x' + dd('x') + '+' + (2 * k) + 'p' + dd('p') + '=0$',
        wrong: ['$2x+' + (2 * k) + 'p=0$', '$2x' + dd('x') + '+' + (2 * k) + 'p' + dd('p') + '=' + C + '$',
                '$2x' + dd('x') + '=' + (2 * k) + 'p' + dd('p') + '$', '$' + dd('x') + '+' + k + dd('p') + '=0$',
                '$2x' + dd('x') + '+' + k + 'p^{2}' + dd('p') + '=0$']
      };
    }
    if (which === 1) {
      return {
        prompt: 'Two cars drive away from an intersection, one north and one east, so $D^{2}=x^{2}+y^{2}$. Which is the related rates equation?',
        answer: '$2D' + dd('D') + '=2x' + dd('x') + '+2y' + dd('y') + '$',
        wrong: ['$2D=2x+2y$', '$' + dd('D') + '=2x' + dd('x') + '+2y' + dd('y') + '$', '$2D' + dd('D') + '=' + dd('x') + '+' + dd('y') + '$',
                '$D' + dd('D') + '=2x' + dd('x') + '+2y' + dd('y') + '$']
      };
    }
    var L = r.pick([10, 13, 15, 17, 20, 25]);
    return {
      prompt: 'A ' + L + ' ft ladder leans against a wall, with $x^{2}+y^{2}=' + (L * L) + '$. Which is the related rates equation?',
      answer: '$2x' + dd('x') + '+2y' + dd('y') + '=0$',
      wrong: ['$2x+2y=0$', '$2x' + dd('x') + '+2y' + dd('y') + '=' + (L * L) + '$', '$2x' + dd('x') + '=2y' + dd('y') + '$',
              '$' + dd('x') + '+' + dd('y') + '=0$', '$2x' + dd('x') + '+2y' + dd('y') + '=' + (2 * L) + '$']
    };
  });

})(window.Review);

