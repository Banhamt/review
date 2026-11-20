/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, N = R.N;

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function red(n, d) { if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return [n / g, d / g]; }
  function frac(n, d) { var f = red(n, d); return f[1] === 1 ? String(f[0]) : (f[0] < 0 ? '-' : '') + '\\frac{' + Math.abs(f[0]) + '}{' + f[1] + '}'; }
  function cf(n, d) {                      // coefficient in front of something: '' for 1, '-' for -1
    var f = red(n, d);
    if (f[1] === 1) return f[0] === 1 ? '' : f[0] === -1 ? '-' : String(f[0]);
    return frac(n, d);
  }
  function pw(n, d, v) {                   // v^{n/d}: x, x^{3}, x^{4/3}, x^{-2}
    v = v || 'x';
    var f = red(n, d);
    if (f[0] === 0) return '';
    if (f[1] === 1) return f[0] === 1 ? v : v + '^{' + f[0] + '}';
    return v + '^{' + f[0] + '/' + f[1] + '}';
  }
  function term(cn, cd, en, ed) { var p = pw(en, ed), c = cf(cn, cd); return p ? c + p : frac(cn, cd); }
  function sum(terms) {                    // join terms, turning +- into -
    return terms.filter(Boolean).join('+').replace(/\+-/g, '-');
  }
  function I(f) { return '$\\displaystyle\\int ' + f + '\\,dx$'; }
  function A(s) { return '$' + s + '+C$'; }
  var C = '+C';

    add('t-anti-whole', function (r) {
    var a = r.int(1, 12), n = r.int(2, 9);
    need(a !== n + 1);
    return {
      prompt: 'Find ' + I(term(a, 1, n, 1)) + '.',
      answer: A(term(a, n + 1, n + 1, 1)),
      wrong: [A(term(a, 1, n + 1, 1)), A(term(a * n, 1, n - 1, 1)), A(term(a, n, n + 1, 1)), A(term(a * (n + 1), 1, n + 1, 1)),
              '$' + term(a, n + 1, n + 1, 1) + '$']
    };
  });

  add('t-anti-frac-power', function (r) {
    var e = r.pick([[1, 2], [1, 3], [2, 3], [3, 2], [5, 2], [3, 4], [1, 4], [4, 3]]), p = e[0], q = e[1];
    return {
      prompt: 'Find ' + I(pw(p, q)) + '.',
      answer: A(term(q, p + q, p + q, q)),
      wrong: [A(term(p + q, q, p + q, q)), A(term(p, q, p - q, q)), A(pw(p + q, q)), A(term(q, p + q, p, q))]
    };
  });

  add('t-anti-negative', function (r) {
    var n = r.int(2, 6), a = r.pick([1, 1, 2, 3, 4, 6]);
    return {
      prompt: 'Find ' + I(term(a, 1, -n, 1)) + '.',
      answer: A(term(-a, n - 1, 1 - n, 1)),
      wrong: [A(term(a, n - 1, 1 - n, 1)), A(term(-a, n + 1, -n - 1, 1)), A(term(-a * n, 1, -n - 1, 1)), A(term(a, 1 - n, -n, 1)),
              A(term(a, n + 1, -n - 1, 1))]
    };
  });

  add('t-anti-rewrite', function (r) {
    var n = r.int(2, 5), a = r.pick([1, 2, 3, 4, 5, 6, 8, 10]);
    return {
      prompt: 'Find ' + I('\\dfrac{' + a + '}{x^{' + n + '}}') + '. (Rewrite as a power of $x$ first.)',
      answer: A(term(-a, n - 1, 1 - n, 1)),
      wrong: [A(term(a, n - 1, 1 - n, 1)), A(term(a, n + 1, n + 1, 1)), A(term(-a, n + 1, -n - 1, 1)), A(a + '\\ln|x|'),
              A(term(-a * n, 1, -n - 1, 1))]
    };
  });

  add('t-anti-root', function (r) {
    var f = r.pick([['\\sqrt{x}', 1, 2], ['\\sqrt[3]{x}', 1, 3], ['\\sqrt{x^{3}}', 3, 2], ['\\dfrac{1}{\\sqrt{x}}', -1, 2],
                    ['\\dfrac{1}{\\sqrt[3]{x^{2}}}', -2, 3], ['\\sqrt[3]{x^{2}}', 2, 3]]);
    var k = r.pick([1, 2, 3, 4, 6, 8, 9, 10]), p = f[1], q = f[2];
    var shown = (k === 1 ? '' : k) + f[0];
    return {
      prompt: 'Find ' + I(shown) + '.',
      answer: A(term(k * q, p + q, p + q, q)),
      wrong: [A(term(k * (p + q), q, p + q, q)), A(term(k * p, q, p - q, q)), A(term(k * q, p + q, p, q)), A(term(k, 1, p + q, q))]
    };
  });

  add('t-anti-sum', function (r) {
    var m = r.int(3, 6), n = r.int(1, m - 1), a = r.int(1, 4) * (m + 1), b = r.int(1, 5) * (n + 1), c = r.int(2, 9), neg = r.int(0, 1);
    var sb = neg ? -b : b, sc = neg ? c : -c;
    var f = sum([term(a, 1, m, 1), term(sb, 1, n, 1), String(sc)]);
    var ans = function (cx) { return A(sum([term(a, m + 1, m + 1, 1), term(sb, n + 1, n + 1, 1), cx])); };
    return {
      prompt: 'Find ' + I('\\left(' + f + '\\right)') + '.',
      answer: ans(term(sc, 1, 1, 1)),
      wrong: [ans(String(sc)), ans(''), A(sum([term(a * m, 1, m - 1, 1), term(sb * n, 1, n - 1, 1)])),
              A(sum([term(a, 1, m + 1, 1), term(sb, 1, n + 1, 1), term(sc, 1, 1, 1)])),
              A(sum([term(a, m, m + 1, 1), term(sb, n, n + 1, 1), term(sc, 1, 1, 1)]))]
    };
  });

  add('t-anti-mixed', function (r) {
    var e = r.pick([[1, 2], [1, 3], [2, 3]]), p = e[0], q = e[1], a = (p + q) * r.int(1, 3), n = r.int(2, 4), b = (n - 1) * r.int(1, 3);
    var root = q === 2 ? '\\sqrt{x}' : p === 1 ? '\\sqrt[3]{x}' : '\\sqrt[3]{x^{2}}';
    var f = a + root + '-\\dfrac{' + b + '}{x^{' + n + '}}';
    var first = term(a * q, p + q, p + q, q);
    return {
      prompt: 'Find ' + I('\\left(' + f + '\\right)') + '.',
      answer: A(sum([first, term(b, n - 1, 1 - n, 1)])),
      wrong: [A(sum([first, term(-b, n - 1, 1 - n, 1)])), A(sum([first, term(b, n + 1, -n - 1, 1)])),
              A(sum([term(a * (p + q), q, p + q, q), term(-b, n - 1, 1 - n, 1)])), A(sum([first, '-' + b + '\\ln|x|'])),
              A(sum([term(a * p, q, p - q, q), term(b * n, 1, -n - 1, 1)]))]
    };
  });

  add('t-anti-check', function (r) {
    var a = r.int(1, 5), n = r.int(1, 4), c = r.int(1, 9), coef = a * (n + 1);
    var f = term(coef, 1, n, 1);
    return {
      prompt: 'Which function has derivative $' + f + '$?',
      answer: '$' + term(a, 1, n + 1, 1) + '+' + c + '$',
      wrong: ['$' + term(coef * n, 1, n - 1, 1) + '$', '$' + term(coef, 1, n + 1, 1) + '$', '$' + term(coef, n, n + 1, 1) + '+' + c + '$',
              '$' + term(coef, 1, n, 1) + '+' + c + '$', '$' + term(a, 1, n, 1) + '+' + c + '$']
    };
  });

    function inner(a, n, b) { return sum([term(a, 1, n, 1), String(b)]); }

  add('t-sub-exact', function (r) {
    var n = r.int(2, 4), a = r.pick([1, 1, 2]), b = r.nz(-9, 9), m = r.int(2, 6);
    var u = inner(a, n, b), du = term(n * a, 1, n - 1, 1);
    var U = function (e) { return '\\left(' + u + '\\right)^{' + e + '}'; };
    return {
      prompt: 'Find ' + I(du + U(m)) + '.',
      answer: A(cf(1, m + 1) + U(m + 1)),
      wrong: [A(U(m + 1)), A(cf(1, m + 1) + 'u^{' + (m + 1) + '}'), A(cf(1, m + 1) + U(m + 1) + '\\cdot ' + du), A(m + U(m - 1) + '\\cdot ' + du),
              A(cf(1, m) + U(m + 1))]
    };
  });

  add('t-sub-fix-constant', function (r) {
    var n = r.int(2, 5), b = r.nz(-9, 9), m = r.int(2, 6);
    var u = inner(1, n, b), U = function (e) { return '\\left(' + u + '\\right)^{' + e + '}'; };
    return {
      prompt: 'Find ' + I(pw(n - 1, 1) + U(m)) + '.',
      answer: A(cf(1, n * (m + 1)) + U(m + 1)),
      wrong: [A(cf(1, m + 1) + U(m + 1)), A(cf(n, m + 1) + U(m + 1)), A(cf(1, n * (m + 1)) + 'u^{' + (m + 1) + '}'),
              A(cf(1, n * (m + 1)) + U(m + 1) + '\\cdot ' + pw(n - 1, 1)), A(cf(1, n * m) + U(m + 1))]
    };
  });

  add('t-sub-linear', function (r) {
    var a = r.int(2, 6), b = r.nz(-9, 9), m = r.int(2, 6);
    var u = inner(a, 1, b), U = function (e) { return '\\left(' + u + '\\right)^{' + e + '}'; };
    need(a !== m + 1);
    return {
      prompt: 'Find ' + I(U(m)) + '.',
      answer: A(cf(1, a * (m + 1)) + U(m + 1)),
      wrong: [A(cf(1, m + 1) + U(m + 1)), A(cf(a, m + 1) + U(m + 1)), A(cf(a * m, 1) + U(m - 1)), A(cf(1, a * m) + U(m + 1)),
              A(cf(1, a) + U(m + 1))]
    };
  });

  add('t-sub-root-or-quotient', function (r) {
    var n = r.int(2, 4), b = r.int(1, 9), u = inner(1, n, b), up = '\\left(' + u + '\\right)';
    if (r.int(0, 1)) {
      return {
        prompt: 'Find ' + I(pw(n - 1, 1) + '\\sqrt{' + u + '}') + '.',
        answer: A(cf(2, 3 * n) + up + '^{3/2}'),
        wrong: [A(cf(2, 3) + up + '^{3/2}'), A(cf(3, 2 * n) + up + '^{3/2}'), A(cf(1, 2 * n) + up + '^{-1/2}'), A(cf(2 * n, 3) + up + '^{3/2}'),
                A(cf(2, 3 * n) + up + '^{1/2}')]
      };
    }
    var m = r.int(2, 4);
    return {
      prompt: 'Find ' + I('\\dfrac{' + pw(n - 1, 1) + '}{' + up + '^{' + m + '}}') + '.',
      answer: A(cf(-1, n * (m - 1)) + up + '^{' + (1 - m) + '}'),
      wrong: [A(cf(1, n * (m - 1)) + up + '^{' + (1 - m) + '}'), A(cf(-1, m - 1) + up + '^{' + (1 - m) + '}'), A(cf(1, n) + '\\ln|' + u + '|'),
              A(cf(-1, n * (m + 1)) + up + '^{' + (-1 - m) + '}'), A(cf(-n, m - 1) + up + '^{' + (1 - m) + '}')]
    };
  });

    add('t-ln-basic', function (r) {
    var a = r.int(1, 9), b = r.int(2, 9);
    need(a !== b);
    return {
      prompt: 'Find ' + I('\\dfrac{' + a + '}{' + b + 'x}') + '.',
      answer: A(cf(a, b) + '\\ln|x|'),
      wrong: [A(a + '\\ln|x|'), A(cf(b, a) + '\\ln|x|'), A('-\\dfrac{' + a + '}{' + b + 'x^{2}}'), A(cf(a * b, 1) + '\\ln|x|'), A(cf(a, b) + 'x')]
    };
  });

  add('t-ln-poly', function (r) {
    var n = r.int(2, 4), b = r.int(1, 9), c = r.pick([1, 2, 3, 4, 5, 6, 8, 9, 10, 12]);
    need(c !== n);
    var u = inner(1, n, b);
    return {
      prompt: 'Find ' + I('\\dfrac{' + term(c, 1, n - 1, 1) + '}{' + u + '}') + '.',
      answer: A(cf(c, n) + '\\ln|' + u + '|'),
      wrong: [A(cf(c, 1) + '\\ln|' + u + '|'), A(cf(c * n, 1) + '\\ln|' + u + '|'), A(cf(c, n) + '\\cdot\\dfrac{1}{' + u + '}'),
              A(cf(c, n) + pw(n, 1) + '\\ln|' + u + '|'), A(cf(-c, n) + '\\left(' + u + '\\right)^{-2}')]
    };
  });

  add('t-ln-exp', function (r) {
    var k = r.int(2, 7), b = r.int(1, 9), e = 'e^{' + k + 'x}', u = e + '+' + b;
    return {
      prompt: 'Find ' + I('\\dfrac{' + e + '}{' + u + '}') + '.',
      answer: A(cf(1, k) + '\\ln\\left(' + u + '\\right)'),
      wrong: [A('\\ln\\left(' + u + '\\right)'), A(k + '\\ln\\left(' + u + '\\right)'), A(cf(1, k) + e + '\\ln\\left(' + u + '\\right)'),
              A(cf(1, k) + '\\dfrac{1}{' + u + '}'), A(cf(1, k) + '\\ln\\left(' + e + '\\right)')]
    };
  });

  add('t-ln-power', function (r) {
    var b = r.nz(-6, 6), m = r.int(2, 5), u = '\\ln x' + (b > 0 ? '+' : '-') + Math.abs(b), up = '\\left(' + u + '\\right)';
    return {
      prompt: 'Find ' + I('\\dfrac{' + up + '^{' + m + '}}{x}') + '.',
      answer: A(cf(1, m + 1) + up + '^{' + (m + 1) + '}'),
      wrong: [A('\\ln\\left|' + up + '^{' + m + '}\\right|'), A(up + '^{' + (m + 1) + '}'), A(cf(1, m + 1) + up + '^{' + (m + 1) + '}\\ln|x|'),
              A(m + up + '^{' + (m - 1) + '}\\cdot\\dfrac{1}{x}'), A(cf(1, m + 1) + '\\dfrac{' + up + '^{' + (m + 1) + '}}{x}')]
    };
  });

    function E(s) { return 'e^{' + s + '}'; }

  add('t-exp-basic', function (r) {
    var a = r.int(1, 12), k = r.int(2, 6);
    need(a !== k);
    var ex = E(k + 'x');
    return {
      prompt: 'Find ' + I((a === 1 ? '' : a) + ex) + '.',
      answer: A(cf(a, k) + ex),
      wrong: [A(cf(a, 1) + ex), A(cf(a * k, 1) + ex), A('\\dfrac{' + (a === 1 ? '' : a) + E(k + 'x+1') + '}{' + k + 'x+1}'), A(cf(a, k) + E('x')),
              A(cf(k, a) + ex)]
    };
  });

  add('t-exp-negative', function (r) {
    var a = r.int(1, 10), k = r.int(2, 5);
    need(a !== k);
    var ex = E('-' + k + 'x');
    return {
      prompt: 'Find ' + I((a === 1 ? '' : a) + ex) + '.',
      answer: A(cf(-a, k) + ex),
      wrong: [A(cf(a, k) + ex), A(cf(-a * k, 1) + ex), A(cf(a, 1) + ex), A(cf(-a, 1) + ex), A(cf(-k, a) + ex)]
    };
  });

  add('t-exp-linear', function (r) {
    var a = r.int(2, 8), b = r.nz(-9, 9), lin = function (c) { return a + 'x' + (c > 0 ? '+' : '-') + Math.abs(c); };
    need(b !== -1);
    var s = lin(b), s1 = lin(b + 1), ex = E(s);
    return {
      prompt: 'Find ' + I(ex) + '.',
      answer: A(cf(1, a) + ex),
      wrong: [A(ex), A(a + ex), A('\\dfrac{' + E(s1) + '}{' + s1 + '}'), A(cf(1, b) + ex), A(cf(1, a) + E(a + 'x'))]
    };
  });

  add('t-exp-chain', function (r) {
    var n = r.int(2, 5), du = term(n, 1, n - 1, 1), ex = E('x^{' + n + '}');
    return {
      prompt: 'Find ' + I(ex + '\\cdot ' + du) + '.',
      answer: A(ex),
      wrong: [A(ex + '\\cdot ' + du), A(cf(1, n) + ex), A('\\dfrac{' + E('x^{' + n + '}+1') + '}{x^{' + n + '}+1}'), A(E(du)), A(n + ex)]
    };
  });

  add('t-exp-chain-constant', function (r) {
    var n = r.int(2, 5), c = r.pick([1, 1, 2, 3, 4, 6, 10]), ex = E('x^{' + n + '}');
    need(c !== n);
    return {
      prompt: 'Find ' + I(term(c, 1, n - 1, 1) + ex) + '.',
      answer: A(cf(c, n) + ex),
      wrong: [A(cf(c, 1) + ex), A(cf(c * n, 1) + ex), A(cf(c, n) + pw(n, 1) + ex), A(cf(c, n) + ex + '\\cdot ' + pw(n - 1, 1)), A(cf(n, c) + ex)]
    };
  });

  add('t-exp-power', function (r) {
    var k = r.int(2, 5), b = r.int(1, 9), m = r.int(2, 5), e = E(k + 'x'), up = '\\left(' + e + '+' + b + '\\right)';
    return {
      prompt: 'Find ' + I(up + '^{' + m + '}\\cdot ' + e) + '.',
      answer: A(cf(1, k * (m + 1)) + up + '^{' + (m + 1) + '}'),
      wrong: [A(cf(1, m + 1) + up + '^{' + (m + 1) + '}'), A(cf(k, m + 1) + up + '^{' + (m + 1) + '}'), A(cf(1, k) + up + '^{' + (m + 1) + '}'),
              A(cf(1, k * (m + 1)) + up + '^{' + (m + 1) + '}\\cdot ' + e), A(cf(1, k) + '\\ln\\left|' + up + '^{' + m + '}\\right|')]
    };
  });

})(window.Review);

