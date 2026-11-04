/* =====================================================================
   Review runtime: the shared helpers that template files use, and makeVersion(),
   which turns a template into one A–E question with fresh numbers.

   A template file calls  Review.add(id, gen).  gen(r) returns
     prompt : question text ($...$ math, [[plot ...]] graphs allowed)
     answer : the right choice
     wrong  : 4 or more distractors (common mistakes); 4 are picked at random
   Helpers: r.int(a,b) r.nz(a,b) r.pick([...])  need(cond)
            N(v) number  M(v) money  poly([c2,c1,c0])  lin(m,b)  ekx(k)  xp(n)  fac(p) = (x-p)
            coef(v) (blank when 1)  ord(n) = 1st, 2nd...  zeros(n)  cubicFromRoots(p,q)
   ===================================================================== */
(function (global) {
  'use strict';
  var T = {};

  function N(v) { return String(+(+v).toFixed(6)); }
  function M(v) {
    v = +(+v).toFixed(2);
    var s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
    return (v < 0 ? '-' : '') + '\\$' + s;
  }
  function coef(v) { return v === 1 ? '' : N(v); }
  function xp(n) { return n === 0 ? '' : n === 1 ? 'x' : 'x^{' + n + '}'; }
  function ekx(k) { return 'e^{' + (k === 1 ? '' : k === -1 ? '-' : N(k)) + 'x}'; }
  function zeros(n) { var a = []; while (n-- > 0) a.push(0); return a; }
  function fac(p) { return p === 0 ? 'x' : '(x' + (p > 0 ? '-' + p : '+' + (-p)) + ')'; }
  function ord(n) { var s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function lin(m, b) { return poly([m, b]); }
  function poly(c, v) {
    v = v || 'x'; var n = c.length - 1, s = '';
    c.forEach(function (a, i) {
      var p = n - i; if (!a) return;
      var abs = Math.abs(a), sign = a < 0 ? '-' : (s ? '+' : '');
      s += sign + (abs === 1 && p > 0 ? '' : N(abs)) + (p === 0 ? '' : p === 1 ? v : v + '^{' + p + '}');
    });
    return s || '0';
  }
  function cubicFromRoots(p, q) { return poly([2, -3 * (p + q), 6 * p * q, 0]); }   // f' = 6(x-p)(x-q)

  function RETRY() {}
  function need(ok) { if (!ok) throw new RETRY(); }
  var r = {
    int: function (a, b) { return a + Math.floor(Math.random() * (b - a + 1)); },
    nz: function (a, b) { var v; do { v = r.int(a, b); } while (v === 0); return v; },
    pick: function (arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  };
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var norm = function (s) { return String(s).replace(/\s+/g, ''); };

  function add(id, gen) {
    if (T[id]) throw new Error('template id used twice: ' + id);
    T[id] = { id: id, gen: gen };
  }

  /* Avoid list: exact real-exam problem strings that a template must never show.
     The public site only has fingerprints [length, FNV-1a hash] of them, so the exam text isn't readable;
     the private source repo keeps the plain strings (tools/publish.py converts them). */
  function fnv(s, i, n) { var h = 0x811c9dc5; for (var k = i; k < i + n; k++) { h ^= s.charCodeAt(k); h = Math.imul(h, 0x01000193) >>> 0; } return h; }
  function hits(p, avoid) {
    return avoid.some(function (a) {
      if (typeof a === 'string') return p.indexOf(norm(a)) >= 0;
      var n = a[0], h = a[1];
      for (var i = 0; i + n <= p.length; i++) if (fnv(p, i, n) === h) return true;
      return false;
    });
  }

  /* One version of template id, never matching anything in avoid (strings or fingerprints). */
  function makeVersion(id, avoid) {
    var t = T[id]; if (!t) throw new Error('no template ' + id);
    avoid = avoid || [];
    for (var tries = 0; tries < 300; tries++) {
      var o;
      try { o = t.gen(r); } catch (e) { if (e instanceof RETRY) continue; throw e; }
      if (avoid.length && hits(norm(o.prompt), avoid)) continue;
      var seen = {}; seen[norm(o.answer)] = 1;
      var wrong = shuffle(o.wrong.slice()).filter(function (w) { var k = norm(w); if (seen[k]) return false; seen[k] = 1; return true; });
      if (wrong.length < 4) continue;
      var choices = shuffle([o.answer].concat(wrong.slice(0, 4)));
      return { id: id, prompt: o.prompt, choices: choices, key: 'ABCDE'[choices.indexOf(o.answer)], template: true };
    }
    throw new Error('template ' + id + ' could not make a version');
  }

  global.Review = {
    add: add, need: need, makeVersion: makeVersion, templates: T, fnv: fnv,
    N: N, M: M, coef: coef, xp: xp, ekx: ekx, zeros: zeros, fac: fac, ord: ord, lin: lin, poly: poly, cubicFromRoots: cubicFromRoots
  };
})(typeof window !== 'undefined' ? window : globalThis);
