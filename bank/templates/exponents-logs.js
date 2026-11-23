/* © 2026 Tim Banham. All rights reserved. */
(function (R) {
  'use strict';
  var add = R.add, need = R.need, fac = R.fac;

    function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function fr(n, d) { d = d || 1; if (d < 0) { n = -n; d = -d; } var g = gcd(n, d); return [n / g, d / g]; }
  function T(n, d) {                       // number as TeX: 3, -\tfrac{1}{8}
    var f = fr(n, d); if (f[1] === 1) return String(f[0]);
    return (f[0] < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f[0]) + '}{' + f[1] + '}';
  }
  function E(n, d) { var f = fr(n, d); return f[1] === 1 ? String(f[0]) : f[0] + '/' + f[1]; }   // exponent text 7/3
  function P(b, n, d) { var f = fr(n, d); return (f[0] === 1 && f[1] === 1) ? b : b + '^{' + E(f[0], f[1]) + '}'; }
  function root(n, inner) { return n === 2 ? '\\sqrt{' + inner + '}' : '\\sqrt[' + n + ']{' + inner + '}'; }
  function pw(v, k) { return k === 1 ? v : v + '^{' + k + '}'; }
  function L(b) { return b === 10 ? '\\log' : b === 'e' ? '\\ln' : '\\log_{' + b + '}'; }
  function $(s) { return '$' + s + '$'; }
  function ipow(b, k) { var v = 1; for (var i = 0; i < k; i++) v *= b; return v; }
  function rpow(b, k) { return k >= 0 ? [ipow(b, k), 1] : [1, ipow(b, -k)]; }        // b^k as [num, den]
  function plusk(k) { return k === 0 ? '' : k > 0 ? '+' + k : String(k); }
  function cf(c) { return c === 1 ? '' : c === -1 ? '-' : String(c); }                // coefficient in front of a log
  function terms(list) {                   // [[coefTeX or number, body]] -> "2\log x-\tfrac13\log y"
    var s = '';
    list.forEach(function (t) {
      var c = t[0], body = t[1], neg = false, txt;
      if (typeof c === 'number') { neg = c < 0; txt = Math.abs(c) === 1 && body ? '' : String(Math.abs(c)); }
      else { neg = c.charAt(0) === '-'; txt = neg ? c.slice(1) : c; if (txt === '1' && body) txt = ''; }
      s += (neg ? '-' : (s ? '+' : '')) + txt + body;
    });
    return s;
  }
  function arg(n, d) { return d === 1 ? String(n) : '\\tfrac{' + n + '}{' + d + '}'; }      // positive log input

    add('t-ex-prod-root', function (r) {
    var b = r.pick(['a', 'a', 'e']), m = r.int(1, 4), n = r.int(2, 5), k = r.int(1, n - 1);
    need(gcd(k, n) === 1);
    need(!(m === 3 && n === 2 && k === 1) && !(m === 2 && n === 3 && k === 1));
    var ex = (m === 1 ? b : b + '^{' + m + '}') + root(n, pw(b, k));
    return {
      prompt: 'Write $' + ex + '$ as $' + b + '$ raised to a single number.',
      answer: $(P(b, m * n + k, n)),
      wrong: [$(P(b, m * k, n)), $(P(b, m + k, n)), $(P(b, m * k + n, k)), $(P(b, m * n - k, n)), $(P(b, m + k, 1))]
    };
  });

  add('t-ex-quot-root', function (r) {
    var b = r.pick(['a', 'e', 'e']), m = r.int(1, 5), n = r.int(2, 4), k = r.int(1, n + 1), top = r.int(0, 3) === 0;
    need(gcd(k, n) === 1 && k !== n);
    need(!(b === 'e' && m === 2 && n === 3 && k === 1 && !top) && !(b === 'e' && m === 3 && n === 2 && k === 1 && !top));
    var pm = m === 1 ? b : b + '^{' + m + '}', rt = root(n, pw(b, k));
    var num = top ? rt : pm, den = top ? pm : rt;
    var an = top ? k - m * n : m * n - k;           // answer exponent = an/n
    return {
      prompt: 'Write $\\dfrac{' + num + '}{' + den + '}$ as $' + b + '$ raised to a single number.',
      answer: $(P(b, an, n)),
      wrong: [$(P(b, m * n + k, n)), $(P(b, -an, n)), $(P(b, top ? k - m : m - k, n)), $(P(b, top ? k : m * n, top ? m * n : k)),
              $(P(b, top ? k * m : m * k, n))]
    };
  });

  add('t-ex-recip-root', function (r) {
    var b = r.pick(['a', 'e']), n = r.int(2, 5), k = r.int(1, n + 2);
    need(gcd(k, n) === 1 && k !== n);
    need(!(n === 4 && k === 1) && !(n === 5 && k === 2));
    return {
      prompt: 'Write $\\dfrac{1}{' + root(n, pw(b, k)) + '}$ as $' + b + '$ raised to a single number.',
      answer: $(P(b, -k, n)),
      wrong: [$(P(b, k, n)), $(P(b, -n, k)), $(P(b, n, k)), $(P(b, -k * n, 1)), $(P(b, k - n, 1))]
    };
  });

  add('t-ex-power', function (r) {
    var b = r.pick(['a', 'e']), m = r.int(1, 3), n = r.int(2, 4), p = r.pick([2, 3, 4, 6]);
    need(!(m === 2 && n === 3 && p === 3) && !(m === 1 && n === 2 && p === 4));
    var inner = (m === 1 ? b : b + '^{' + m + '}') + root(n, b);
    return {
      prompt: 'Write $\\bigl(' + inner + '\\bigr)^{' + p + '}$ as $' + b + '$ raised to a single number.',
      answer: $(P(b, p * (m * n + 1), n)),
      wrong: [$(P(b, p * m * n + 1, n)), $(P(b, (m + p) * n + 1, n)), $(P(b, m * n + 1, n * p)), $(P(b, p * m, n)), $(P(b, m * n + 1, n))]
    };
  });

    var X0 = [[-2, 1], [-1, 1], [2, 1], [1, 2], [-1, 2], [3, 2]];
  function bpow(b, p, q) {                // b^(p/q) as [num, den] (q = 1 or 2; b a square when q = 2)
    var s = q === 2 ? Math.round(Math.sqrt(b)) : b;
    if (q === 2 && s * s !== b) return null;
    return rpow(s, p);
  }
  add('t-ef-eval', function (r) {
    var c = r.int(2, 6), b = r.pick([2, 3, 4, 5, 9, 16, 25]), x = r.pick(X0), p = x[0], q = x[1];
    var v = bpow(b, p, q); need(v && v[0] <= 400 && v[1] <= 400);
    need(!(c === 3 && b === 9) && !(c === 2 && b === 4) && !(c === 5 && b === 2));
    var vi = bpow(b, -p, q), ans = fr(c * v[0], v[1]);
    var w = [$(T(c * vi[0], vi[1])), $(T(c * b * p, q)), $(T(-c * v[0], v[1])), $(T(c * v[1] + v[0], v[1]))];
    var cb = bpow(c * b, p, q); if (cb) w.push($(T(cb[0], cb[1])));
    return {
      prompt: 'Let $f(x)=' + c + '\\cdot ' + b + '^{x}$. Find $f\\!\\left(' + T(p, q) + '\\right)$.',
      answer: $(T(ans[0], ans[1])),
      wrong: w
    };
  });

  add('t-ef-solve', function (r) {
    var c = r.int(2, 6), b = r.pick([2, 3, 4, 5, 9]), x = r.pick(X0.concat([[0, 1], [3, 1], [-3, 1]])), p = x[0], q = x[1];
    var v = bpow(b, p, q); need(v && v[0] * c <= 600 && v[1] <= 600);
    need(!(c === 3 && b === 9) && !(c === 2 && b === 4) && !(c === 6 && b === 4));
    var y = fr(c * v[0], v[1]);
    return {
      prompt: 'Let $f(x)=' + c + '\\cdot ' + b + '^{x}$. Solve $f(x)=' + T(y[0], y[1]) + '$.',
      answer: $('x=' + T(p, q)),
      wrong: [$('x=' + T(-p, q)), $('x=' + T(p + q, q)), $('x=' + T(p - q, q)), $('x=' + T(2 * p, q)), $('x=' + T(y[0], y[1] * c)), $('x=' + T(q, p || 1))]
    };
  });

  add('t-ef-likebase', function (r) {
    var p = r.pick([2, 3, 5]), s = r.int(1, 4), t = r.int(1, 5), neg = r.int(0, 2) === 0;
    var B = ipow(p, s), V = ipow(p, t); need(s !== t && B <= 81 && V <= 243);
    need(!(p === 2 && s === 2 && t === 5 && !neg));
    var sg = neg ? -1 : 1;
    return {
      prompt: 'Solve $' + B + '^{x}=' + (neg ? '\\tfrac{1}{' + V + '}' : V) + '$.',
      answer: $('x=' + T(sg * t, s)),
      wrong: [$('x=' + T(sg * s, t)), $('x=' + T(-sg * t, s)), $('x=' + (sg * t)), $('x=' + T(sg * V, B)), $('x=' + (sg * (t - s)))]
    };
  });

    var BS = [[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3]];
  function ab(a, b) { return $('a=' + T(a[0], a[1]) + ',\\ b=' + T(b[0], b[1])); }
  function pt(x, y) { return '(' + x + ',\\,' + T(y[0], y[1]) + ')'; }
  add('t-2pt-int', function (r) {
    var a = r.int(2, 6), b = r.pick(BS), k = r.int(1, 3);
    var bk = [ipow(b[0], k), ipow(b[1], k)], y2 = fr(a * bk[0], bk[1]);
    need(y2[0] <= 500 && y2[1] <= 500);
    need(!(a === 2 && b[0] === 3 && k === 2) && !(a === 3 && b[0] === 4 && k === 2));
    return {
      prompt: '$f(x)=a\\cdot b^{x}$ passes through $(0,\\,' + a + ')$ and $' + pt(k, y2) + '$. Find $a$ and $b$.',
      answer: ab([a, 1], b),
      wrong: [ab([a, 1], bk), ab(b, [a, 1]), ab(y2, b), ab([a, 1], [b[1], b[0]]), ab([a, 1], fr(y2[0], y2[1] * a * k)), ab([a, 1], fr(y2[0] - a * y2[1], y2[1] * k))]
    };
  });

  add('t-2pt-gen', function (r) {
    var a = r.int(1, 6), b = r.pick([[2, 1], [3, 1], [1, 2], [1, 3]]), x1 = r.pick([-2, -1, 1, 2]), d = r.int(2, 3), x2 = x1 + d;
    need(x2 !== 0);
    function y(x) { var p = rpow(b[0], x), q = rpow(b[1], x); return fr(a * p[0] * q[1], p[1] * q[0]); }
    var y1 = y(x1), y2 = y(x2);
    need(Math.max(Math.abs(y1[0]), y1[1], Math.abs(y2[0]), y2[1]) <= 200);
    var key = x1 + ',' + T(y1[0], y1[1]) + ',' + x2 + ',' + T(y2[0], y2[1]);
    need(['-1,8,2,1', '-1,2,2,54', '1,10,3,\\tfrac{2}{5}', '-2,18,1,\\tfrac{2}{3}', '1,12,3,96'].indexOf(key) < 0);
    var bd = [ipow(b[0], d), ipow(b[1], d)];
    var wa = y(2 * x1);                                  // multiplied by b^x1 instead of dividing
    return {
      prompt: '$f(x)=a\\cdot b^{x}$ passes through $' + pt(x1, y1) + '$ and $' + pt(x2, y2) + '$. Find $a$ and $b$.',
      answer: ab([a, 1], b),
      wrong: [ab(y1, b), ab([a, 1], bd), ab([a, 1], [b[1], b[0]]), ab(wa, b), ab(y2, b)]
    };
  });

  add('t-2pt-formula', function (r) {
    var a = r.int(2, 9), b = r.pick([[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3], [1, 4]]);
    var y1 = fr(a * b[0], b[1]);
    need(!(a === 5 && (b[0] === 3 || b[1] === 3)));
    function f(c, d) { var bb = d[1] === 1 ? String(d[0]) : '\\left(\\tfrac{' + d[0] + '}{' + d[1] + '}\\right)'; return $('f(x)=' + T(c[0], c[1]) + '\\cdot ' + bb + '^{x}'); }
    var diff = fr(y1[0] - a * y1[1], y1[1]);
    return {
      prompt: 'An exponential function $f(x)=a\\cdot b^{x}$ passes through $(0,\\,' + a + ')$ and $' + pt(1, y1) + '$. Find $f(x)$.',
      answer: f([a, 1], b),
      wrong: [f(y1, [a, 1]), f([a, 1], [b[1], b[0]]), f(y1, b), diff[0] > 0 ? f([a, 1], diff) : f([a, 1], fr(b[0] + 1, b[1])), f([b[0], b[1]], [a, 1])]
    };
  });

    function powPair(r) {                     // b, exponent tex, value [n,d], exponent [p,q]
    var o = r.pick([
      function () { var b = r.pick([2, 3, 4, 5, 10]), p = r.pick([-3, -2, -1, 2, 3, 4]); var v = rpow(b, p); return v[0] <= 1000 && v[1] <= 1000 ? { b: b, e: [p, 1], v: v } : null; },
      function () { var c = r.pick([[4, 2, 2], [9, 3, 2], [16, 4, 2], [25, 5, 2], [36, 6, 2], [8, 2, 3], [27, 3, 3], [64, 4, 3], [125, 5, 3]]); return { b: c[0], e: [1, c[2]], v: [c[1], 1] }; }
    ])();
    need(o); return o;
  }
  add('t-to-log', function (r) {
    var o = powPair(r), b = o.b, e = T(o.e[0], o.e[1]), v = arg(o.v[0], o.v[1]);
    need(!(b === 5 && o.e[0] === -2) && !(b === 2 && o.e[0] === -3) && !(b === 3 && o.e[0] === -4));
    var bs = String(b), ev = o.e[0] < 0 ? '(' + e + ')' : e;
    return {
      prompt: 'Write $' + b + '^{' + E(o.e[0], o.e[1]) + '}=' + v + '$ in logarithmic form.',
      answer: $(L(b) + ' ' + v + '=' + e),
      wrong: [$(L(b) + ' ' + ev + '=' + v), $('\\log_{' + v + '}' + bs + '=' + e), $('\\log_{' + e + '}' + v + '=' + bs), $('\\log_{' + v + '}' + ev + '=' + bs)]
    };
  });

  add('t-to-exp', function (r) {
    var o = powPair(r), b = o.b, e = T(o.e[0], o.e[1]), v = arg(o.v[0], o.v[1]);
    need(!(b === 4 && o.e[0] === 3) && !(b === 9 && o.e[1] === 2) && !(b === 3 && o.e[0] === 4));
    var ee = E(o.e[0], o.e[1]), ep = o.e[0] < 0 || o.e[1] > 1 ? '\\left(' + e + '\\right)' : e;
    return {
      prompt: 'Write $' + L(b) + ' ' + v + '=' + e + '$ in exponential form.',
      answer: $(b + '^{' + ee + '}=' + v),
      wrong: [$(ep + '^{' + b + '}=' + v), $('\\left(' + v + '\\right)^{' + ee + '}=' + b), $(b + '^{' + v + '}=' + e), $('\\left(' + v + '\\right)^{' + b + '}=' + e)]
    };
  });

  add('t-solve-base', function (r) {
    var s = r.pick([2, 3, 4, 5]), q = r.int(1, 3), p = r.int(1, 4);
    need(gcd(p, q) === 1 && p !== q);
    var V = ipow(s, p), X = ipow(s, q); need(V <= 256 && X <= 125 && V > 1);
    need(['27:3/2', '64:3/2', '25:2/3', '8:3/2', '16:2'].indexOf(V + ':' + E(p, q)) < 0);
    var w = [s, V, X * s, ipow(s, p + q) <= 5000 ? ipow(s, p + q) : V * s];
    if ((V * q) % p === 0) w.push(V * q / p);
    return {
      prompt: 'Solve $\\log_{x}' + V + '=' + T(p, q) + '$.',
      answer: $('x=' + X),
      wrong: w.map(function (n) { return $('x=' + n); }).concat([$('x=' + T(V * q, p))])
    };
  });

  add('t-solve-arg', function (r) {
    var b = r.pick([2, 3, 4, 5, 10]), p = r.pick([-3, -2, -1, 2, 3, 4]);
    var v = rpow(b, p); need(v[0] <= 1000 && v[1] <= 1000);
    var w = [T(b * p, 1), T(-v[1] * v[0], 1), T(p, b), T(b, p)];
    if (p > 0) w.push(String(ipow(p, b) <= 100000 ? ipow(p, b) : b + p));
    return {
      prompt: 'Solve $' + L(b) + ' x=' + p + '$.',
      answer: $('x=' + T(v[0], v[1])),
      wrong: w.map(function (s) { return $('x=' + s); })
    };
  });

  add('t-log-between', function (r) {
    var b = r.pick([2, 3, 5, 10]), n = r.int(1, 5), neg = r.int(0, 3) === 0;
    var lo = ipow(b, n), hi = ipow(b, n + 1); need(hi <= 1000);
    var N = r.int(lo + 1, hi - 1);
    need(!(b === 2 && N === 50) && !(b === 3 && N === 100) && !(b === 3 && N === 50 && neg));
    var x = neg ? '\\tfrac{1}{' + N + '}' : String(N), a = neg ? -(n + 1) : n;
    function pair(k) { return $(k + '<' + L(b) + ' ' + x + '<' + (k + 1)); }
    return {
      prompt: 'Between which two consecutive integers is $' + L(b) + ' ' + x + '$?',
      answer: pair(a),
      wrong: [pair(a - 1), pair(a + 1), pair(a + 2), pair(-a - 1), pair(a - 2)]
    };
  });

    add('t-ev-pow', function (r) {
    var p = r.pick([2, 3, 5]), s = r.int(1, 3), t = r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5]);
    var B = ipow(p, s), A = ipow(p, Math.abs(t)); need(B <= 125 && A <= 625 && s !== t && (s > 1 || Math.abs(t) > 1));
    var x = t < 0 ? '\\tfrac{1}{' + A + '}' : String(A);
    need(['8:16', '27:\\tfrac{1}{9}', '9:27', '4:8', '16:\\tfrac{1}{8}'].indexOf(B + ':' + x) < 0);
    return {
      prompt: 'Evaluate $\\log_{' + B + '}' + x + '$.',
      answer: $(T(t, s)),
      wrong: [$(T(s, t)), $(T(-t, s)), $(String(t)), $(T(s, -t)), $(T(t * s, 1)), $(T(t - s, 1))]
    };
  });

  add('t-ev-root', function (r) {
    var p = r.pick([2, 3, 5]), s = r.int(1, 3), q = r.pick([2, 3]), t = r.pick([1, 1, 2]), inv = r.int(0, 2) === 0;
    var B = ipow(p, s); need(B > 2 && B <= 81 && gcd(t, q) === 1);
    need(!(B === 4 && p === 2 && q === 2 && t === 1 && !inv));
    var x = root(q, pw(String(p), t)); if (inv) x = '\\tfrac{1}{' + x + '}';
    var sg = inv ? -1 : 1;
    return {
      prompt: 'Evaluate $\\log_{' + B + '}' + x + '$.',
      answer: $(T(sg * t, q * s)),
      wrong: [$(T(sg * q * s, t)), $(T(sg * t * q, s)), $(T(sg * t, s)), $(T(-sg * t, q * s)), $(T(sg * t * s, q))]
    };
  });

  add('t-ev-log10', function (r) {
    var k = r.pick([-5, -3, -2, -1, 2, 3, 4, 5, 6]), x;
    if (k > 0) { x = '1' + new Array(k + 1).join('0'); if (k > 3) x = x.slice(0, x.length - 3) + '{,}' + x.slice(-3); }
    else x = '0.' + new Array(-k).join('0') + '1';
    return {
      prompt: 'Evaluate $\\log ' + x + '$.',
      answer: $(String(k)),
      wrong: [$(String(-k)), $(String(k > 0 ? k + 1 : k + 1)), $(String(k > 0 ? k - 1 : k - 1)), $(T(1, k)), $(String(10 * k))]
    };
  });

  add('t-ev-ln', function (r) {
    var form = r.int(0, 3), k = r.int(2, 6), n = r.pick([2, 3, 4]), x, a;
    if (form === 0) { x = 'e^{' + k + '}'; a = [k, 1]; }
    else if (form === 1) { x = '\\tfrac{1}{e^{' + k + '}}'; a = [-k, 1]; }
    else if (form === 2) { k = r.int(1, n + 1); need(gcd(k, n) === 1 && !(k === 1 && n === 2)); x = root(n, pw('e', k)); a = [k, n]; }
    else { x = '\\tfrac{1}{' + root(n, 'e') + '}'; a = [-1, n]; need(n !== 3); }
    return {
      prompt: 'Evaluate $\\ln ' + x + '$.',
      answer: $(T(a[0], a[1])),
      wrong: [$(T(-a[0], a[1])), $(T(a[1], a[0])), $('e^{' + E(a[0], a[1]) + '}'), $(T(a[0] * a[1], 1)), $('1'), $('0')]
    };
  });

    function logf(b, h, k) { return L(b) + (h === 0 ? ' x' : fac(h)) + plusk(k); }
  function badExam(b, h, k) {
    return (b === 2 && h === -1 && k === -2) || (b === 3 && h === -2 && k === -1) || (b === 2 && h === 2 && k === 1) ||
           (b === 3 && h === 4 && k === 1) || (b === 2 && h === 3 && k === 1) || (b === 3 && h === -1 && k === -2);
  }
  add('t-log-asym', function (r) {
    var b = r.pick([2, 3, 5, 10, 'e']), h = r.nz(-6, 6), k = r.nz(-4, 4);
    need(!badExam(b, h, k) && Math.abs(h) !== Math.abs(k));
    return {
      prompt: 'What is the vertical asymptote of $y=' + logf(b, h, k) + '$?',
      answer: $('x=' + h),
      wrong: [$('x=' + (-h)), $('x=0'), $('x=' + k), $('y=' + k), $('x=' + (h + k))]
    };
  });

  add('t-log-shift', function (r) {
    var b = r.pick([2, 3, 5, 10, 'e']), h = r.nz(-5, 5), k = r.nz(-4, 4);
    need(!badExam(b, h, k) && Math.abs(h) !== Math.abs(k));
    function d(hh, kk) { return (hh > 0 ? 'right ' : 'left ') + Math.abs(hh) + ' and ' + (kk > 0 ? 'up ' : 'down ') + Math.abs(kk); }
    return {
      prompt: 'Compared to $y=' + L(b) + ' x$, how is the graph of $y=' + logf(b, h, k) + '$ shifted?',
      answer: d(h, k),
      wrong: [d(-h, k), d(-h, -k), d(h, -k), d(k, h), d(-k, -h)]
    };
  });

  add('t-log-point', function (r) {
    var b = r.pick([2, 3, 5]), h = r.nz(-4, 5), k = r.int(-3, 3), j = r.int(0, 1);
    need(!badExam(b, h, k) && h !== k);
    var bj = ipow(b, j);
    function P2(x, y) { return $('(' + x + ',\\,' + y + ')'); }
    return {
      prompt: 'Which point is on the graph of $y=' + logf(b, h, k) + '$?',
      answer: P2(h + bj, k + j),
      wrong: [P2(-h + bj, k + j), P2(bj, k + j), P2(h + bj, j - k), P2(h + bj, k - j), P2(h + j, k + bj), P2(h + bj, j)]
    };
  });

  add('t-inv-point', function (r) {
    var b = r.pick([2, 3, 4, 5]), x = r.pick([-2, -1, 2, 3]);
    var v = rpow(b, x); need(v[0] <= 125 && v[1] <= 125);
    var V = T(v[0], v[1]), Vi = T(v[1], v[0]);
    function P2(a, c) { return $('(' + a + ',\\,' + c + ')'); }
    return {
      prompt: 'The point $(' + x + ',\\,' + V + ')$ is on the graph of $y=' + b + '^{x}$. Which point must be on the graph of $y=\\log_{' + b + '}x$?',
      answer: P2(V, x),
      wrong: [P2(x, V), P2(V, -x), P2(-x, V), P2(Vi, x), P2(x, Vi)]
    };
  });

    add('t-lr-add', function (r) {
    var b = r.pick([2, 3, 4, 5, 6, 10]), n = r.int(1, 3), bn = ipow(b, n); need(bn <= 1000);
    var neg = r.int(0, 2) === 0, M, N, ans, inside;
    if (!neg) {
      var ds = []; for (var d = 2; d < bn; d++) if (bn % d === 0) ds.push(d);
      need(ds.length); M = r.pick(ds); N = bn / M; ans = n;
      need(M !== b && N !== b);
      inside = L(b) + ' ' + M + '+' + L(b) + ' ' + N;
    } else {
      M = r.int(2, 12); N = M * bn; need(N <= 500 && M % b !== 0); ans = -n;
      inside = L(b) + ' ' + M + '+' + L(b) + '\\tfrac{1}{' + N + '}';
    }
    return {
      prompt: 'Find the exact value of $' + inside + '$.',
      answer: $(String(ans)),
      wrong: [$(String(-ans)), $(String(ans + 1)), $(neg ? T(1, bn) : String(bn)), $(neg ? T(M + N, 1) : String(M + N)), $(String(ans - 1))]
    };
  });

  add('t-lr-sub', function (r) {
    var b = r.pick([2, 3, 4, 5, 10]), n = r.pick([-2, -1, 1, 2, 3]), N = r.int(2, 12), bn = ipow(b, Math.abs(n));
    need(N % b !== 0);
    var M = n > 0 ? N * bn : N, D = n > 0 ? N : N * bn; need(Math.max(M, D) <= 600);
    return {
      prompt: 'Find the exact value of $' + L(b) + ' ' + M + '-' + L(b) + ' ' + D + '$.',
      answer: $(String(n)),
      wrong: [$(String(-n)), $(String(M - D)), $(T(M, D)), $(String(n + 1)), $(String(n - 1))]
    };
  });

  add('t-lr-mixed', function (r) {
    var b = r.pick([2, 3, 5, 6, 10]), n = r.pick([1, 2, 3, -1]), A = r.int(2, 20), B = r.int(2, 20);
    var bn = rpow(b, n), num = A * B * bn[1], C = num / bn[0];
    need(Number.isInteger(C) && C >= 2 && C <= 200 && C !== A && C !== B && A !== B);
    need(A % b !== 0 || B % b !== 0);
    var k = b + ':' + [A, B].sort(function (x, y) { return x - y; }).join(',') + ':' + C;
    need(['2:6,24:9', '3:12,18:8', '6:8,9:2', '2:4,12:3'].indexOf(k) < 0);
    return {
      prompt: 'Find the exact value of $' + L(b) + ' ' + A + '+' + L(b) + ' ' + B + '-' + L(b) + ' ' + C + '$.',
      answer: $(String(n)),
      wrong: [$(String(A + B - C)), $(T(bn[0], bn[1])), $(String(-n)), $(String(n + 1)), $(String(n - 1))]
    };
  });

  add('t-lr-coef', function (r) {
    var b = r.pick([2, 3, 4, 5, 10]), c = r.pick(['2', '3', '1/2', '1/3']), n = r.pick([-2, -1, 1, 2]), M, Q;
    if (c === '2') { M = r.int(2, 12); Q = M * M; }
    else if (c === '3') { M = r.int(2, 6); Q = M * M * M; }
    else if (c === '1/2') { Q = r.int(2, 10); M = Q * Q; }
    else { Q = r.int(2, 5); M = Q * Q * Q; }
    var bn = ipow(b, Math.abs(n)), N = n > 0 ? Q / bn : Q * bn;
    need(Number.isInteger(N) && N >= 2 && N <= 600 && N !== Q);
    need(!(c === '1/3' && b === 5 && M === 8) && !(c === '1/2' && b === 5 && M === 100) && !(c === '2' && b === 4 && M === 6));
    var ct = c === '1/2' ? '\\tfrac12' : c === '1/3' ? '\\tfrac13' : c;
    return {
      prompt: 'Find the exact value of $' + ct + L(b) + ' ' + M + '-' + L(b) + ' ' + N + '$.',
      answer: $(String(n)),
      wrong: [$(String(-n)), $(String(n + 1)), $(String(n - 1)), $(n > 0 ? String(bn) : T(1, bn)), $(String(2 * n))]
    };
  });

  add('t-lr-AB', function (r) {
    var f = r.pick([[2, 1, '12'], [1, 2, '18'], [3, 0, '8'], [0, 2, '9'], [1, 1, '6'], [-1, 1, '\\tfrac32'], [1, -1, '\\tfrac23'],
                    [2, -1, '\\tfrac43'], [3, 1, '24'], [0, 3, '27'], [-2, 1, '\\tfrac34'], [4, 0, '16'], [2, 2, '36']]);
    var i = f[0], j = f[1];
    function e(a, c) { return terms([[a, 'A'], [c, 'B']].filter(function (t) { return t[0] !== 0; })) || '0'; }
    function prod(a, c) { return (a ? (a === 1 ? 'A' : 'A^{' + a + '}') : '') + (c ? (c === 1 ? 'B' : 'B^{' + c + '}') : ''); }
    return {
      prompt: 'Suppose $\\log_b 2=A$ and $\\log_b 3=B$. Write $\\log_b ' + f[2] + '$ in terms of $A$ and $B$.',
      answer: $(e(i, j)),
      wrong: [$(e(j, i)), $(e(i, -j)), $(e(-i, j)), $(e(i + 1, j)), $(prod(Math.abs(i), Math.abs(j))), $('A+B'), $(e(i, j + 1))]
    };
  });

    var LB = [10, 'e', 2, 3, 5];
  add('t-ex-quot', function (r) {
    var b = r.pick(LB), p = r.int(2, 5), q = r.int(1, 4), c = b === 'e' ? 0 : r.int(0, 2), l = L(b) + ' ';
    need(!(b === 10 && p === 3 && q === 2 && c === 0) && p !== q);
    var K = c ? ipow(b, c) : null;
    var body = '\\dfrac{' + (K ? K : '') + 'x^{' + p + '}}{' + pw('y', q) + '}';
    var ans = terms((c ? [[c, '']] : []).concat([[p, l + 'x'], [-q, l + 'y']]));
    return {
      prompt: 'Expand $' + L(b) + '\\left(' + body + '\\right)$.',
      answer: $(ans),
      wrong: [$(terms((c ? [[c, '']] : []).concat([[p, l + 'x'], [q, l + 'y']]))),
              $(terms((c ? [[c, '']] : []).concat([[1, l + p + 'x'], [-1, l + (q === 1 ? '' : q) + 'y']]))),
              $(c ? terms([[K, '']].concat([[p, l + 'x'], [-q, l + 'y']])) : terms([[p, l + 'x'], [-1, l + q + 'y']])),
              $((c ? c + '+' : '') + '\\dfrac{' + p + l + 'x}{' + cf(q) + l + 'y}'),
              $(terms((c ? [[c, '']] : []).concat([[-p, l + 'x'], [q, l + 'y']])))]
    };
  });

  add('t-ex-root', function (r) {
    var b = r.pick([10, 'e', 2, 3]), n = r.int(2, 5), p = r.int(1, 5), q = r.int(1, 4), quot = r.int(0, 1) === 1, l = L(b) + ' ';
    need(p % n !== 0 && q % n !== 0 && p !== q);
    need(!(b === 2 && n === 3 && p === 2 && q === 1 && quot) && !(b === 10 && n === 3 && p === 2 && q === 1 && !quot) &&
         !(b === 'e' && n === 2 && p === 3 && q === 5 && quot));
    var inner = quot ? '\\dfrac{' + pw('x', p) + '}{' + pw('y', q) + '}' : pw('x', p) + pw('y', q);
    var sg = quot ? -1 : 1;
    return {
      prompt: 'Expand $' + L(b) + root(n, inner) + '$. Write the answer with no exponents or roots.',
      answer: $(terms([[T(p, n), l + 'x'], [T(sg * q, n), l + 'y']])),
      wrong: [$(terms([[T(p, n), l + 'x'], [sg * q, l + 'y']])), $(terms([[T(n, p), l + 'x'], [T(sg * n, q), l + 'y']])),
              $(terms([[p, l + 'x'], [sg * q, l + 'y']])), $(terms([[T(p, n), l + 'x'], [T(-sg * q, n), l + 'y']])),
              $(terms([[T(p * n, 1), l + 'x'], [T(sg * q * n, 1), l + 'y']]))]
    };
  });

  var CO = [['1', 1], ['2', 2], ['3', 3], ['4', 4], ['\\tfrac12', 'h'], ['\\tfrac13', 't']];
  function rp(v, c) { return c === 'h' ? '\\sqrt{' + v + '}' : c === 't' ? '\\sqrt[3]{' + v + '}' : pw(v, c); }
  add('t-cond', function (r) {
    var b = r.pick([10, 'e', 2, 3]), three = r.int(0, 1) === 1, l = L(b);
    var cx = r.pick(CO.slice(0, 4)), cy = r.pick(CO), cz = r.pick(CO.slice(0, 4));
    need(cx[1] !== cy[1]);
    var X = rp('x', cx[1]), Y = rp('y', cy[1]), Z = rp('z', cz[1]);
    var lhs, ans, w;
    function fx(n, d) { return '\\left(\\dfrac{' + n + '}{' + d + '}\\right)'; }
    if (three) {
      need(!(cx[1] === 2 && cy[1] === 'h' && cz[1] === 1));
      lhs = terms([[cx[0], l + ' x'], [cy[0], l + ' y'], ['-' + cz[0], l + ' z']]);
      ans = l + fx(X + Y, Z);
      w = [l + fx(X, Y + Z), l + '\\left(' + X + Y + Z + '\\right)', '\\dfrac{' + l + '\\left(' + X + Y + '\\right)}{' + l + ' ' + Z + '}',
           l + '\\left(' + X + Y + '-' + Z + '\\right)', l + '\\left(' + (cx[0] === '1' ? '' : cx[0]) + 'x' + '+' + (cy[0] === '1' ? '' : cy[0]) + 'y-' + (cz[0] === '1' ? '' : cz[0]) + 'z\\right)'];
    } else {
      lhs = terms([[cx[0], l + ' x'], ['-' + cy[0], l + ' y']]);
      ans = l + fx(X, Y);
      w = [l + '\\left(' + X + Y + '\\right)', l + fx(Y, X), '\\dfrac{' + l + ' ' + X + '}{' + l + ' ' + Y + '}',
           l + '\\left(' + X + '-' + Y + '\\right)', l + fx(cx[0] === '1' ? 'x' : cx[0] + 'x', cy[0] === '1' ? 'y' : cy[0] + 'y')];
    }
    return { prompt: 'Condense into a single log: $' + lhs + '$', answer: $(ans), wrong: w.map($) };
  });

  add('t-cond-const', function (r) {
    var b = r.pick([10, 2, 3, 5]), c = r.int(1, 3), p = r.int(1, 4), plus = r.int(0, 2) > 0, k = r.int(0, 2) === 0 ? r.nz(-5, 5) : 0;
    var K = ipow(b, c); need(K <= 1000);
    need(!(b === 10 && c === 2 && p === 1 && plus && k === 0));
    var l = L(b), u = k ? pw('(x' + plusk(k) + ')', p) : pw('x', p), body = k ? l + '(x' + plusk(k) + ')' : l + ' x';
    var lhs = plus ? c + '+' + cf(p) + body : cf(p) + body + '-' + c;
    var ans = plus ? l + '\\left(' + K + u + '\\right)' : l + '\\left(\\dfrac{' + u + '}{' + K + '}\\right)';
    var w = plus ? [l + '\\left(' + c + u + '\\right)', l + '\\left(' + K + '+' + u + '\\right)', l + '\\left(' + b + u + '\\right)', l + '\\left(' + (c + 0) + '+' + u + '\\right)', l + '\\left(' + ipow(b, c + 1) + u + '\\right)']
                 : [l + '\\left(\\dfrac{' + u + '}{' + c + '}\\right)', l + '\\left(' + u + '-' + K + '\\right)', l + '\\left(\\dfrac{' + K + '}{' + u + '}\\right)', l + '\\left(\\dfrac{' + u + '}{' + b + '}\\right)', l + '\\left(' + u + '-' + c + '\\right)'];
    return { prompt: 'Condense into a single log: $' + lhs + '$', answer: $(ans), wrong: w.map($) };
  });
})(window.Review);

