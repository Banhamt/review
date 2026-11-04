/* =====================================================================
   QuickGraph — draws graphs inside QuickPoll question text.
   Paste this whole <script> block into Teacher.html and StudentApp
   (just before </body>), then call  renderQuickGraphs(el)  on any
   element that holds question or choice text, BEFORE KaTeX runs.

   Tags you can type in a spreadsheet cell:
     [[plot  y=x^2-4x; x=-1..5; y=-5..5]]
     [[img   https://banhamt.github.io/quickpoll/img/graph1.svg]]

   Plot items (separate with ;, any order):
     y=EXPR              curve        e.g. y=2x^2-3x+1, y=sqrt(x), y=1/x
     y=EXPR on a..b      curve drawn only for a <= x <= b
     x=a..b   y=c..d     viewing window (default -5..5 both)
     x=NUM               vertical line (for vertical line test)
     x=EXPR on a..b      sideways curve, x as a function of y, drawn for
                         a <= y <= b (on is optional), e.g. x=2+0.2sin(3y)
     dot(a,b)(c,d)       closed dots        open(a,b)   open dots
     label(a,b,A)        text A next to (a,b); add ,below ,left or ,right
                         to move it (default above), e.g. label(2,6,C,below)
     seg(a,b)(c,d)(e,f)  line segments joining the points in order
     w=NUM  h=NUM        size: w=200 is small, 320 default; h sets shape
     (every graph is also capped at MAX_VH % of screen height, below)
     nolabels            hide tick numbers (like \minigraph)
     plain               no grid, axes or tick numbers (for diagrams drawn with seg)
   Functions: sqrt abs cbrt sin cos tan ln log exp, constants pi e.
   Implicit multiplication works: 2x, 3(x-1), x(x+2), 2sqrt(x).
   ===================================================================== */
(function (global) {
  'use strict';

  /* ---------------- expression parser ---------------- */
  var FUNCS = { sqrt: Math.sqrt, abs: Math.abs, cbrt: Math.cbrt, sin: Math.sin,
                cos: Math.cos, tan: Math.tan, ln: Math.log, log: Math.log10, exp: Math.exp };
  var CONSTS = { pi: Math.PI, e: Math.E };
  var NAMES = ['sqrt', 'cbrt', 'abs', 'sin', 'cos', 'tan', 'exp', 'ln', 'log', 'pi', 'e', 'x', 'y'];

  function tokenize(s) {
    var toks = [], i = 0, m;
    while (i < s.length) {
      var c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i)))) {
        toks.push({ t: 'num', v: parseFloat(m[1]) }); i += m[1].length; continue;
      }
      if (/[a-z]/i.test(c)) {
        var rest = s.slice(i).toLowerCase(), hit = null;
        for (var k = 0; k < NAMES.length; k++) if (rest.indexOf(NAMES[k]) === 0) { hit = NAMES[k]; break; }
        if (!hit) throw new Error('unknown name at "' + s.slice(i) + '"');
        toks.push({ t: 'name', v: hit }); i += hit.length; continue;
      }
      if ('+-*/^()'.indexOf(c) >= 0) { toks.push({ t: 'op', v: c }); i++; continue; }
      throw new Error('unexpected "' + c + '"');
    }
    return toks;
  }

  function bin(op, a, b) {
    if (op === '+') return function (x) { return a(x) + b(x); };
    if (op === '-') return function (x) { return a(x) - b(x); };
    if (op === '*') return function (x) { return a(x) * b(x); };
    if (op === '/') return function (x) { return a(x) / b(x); };
    return function (x) { return Math.pow(a(x), b(x)); };
  }

  function compile(src, vname) {
    vname = vname || 'x';
    var t = tokenize(src), p = 0;
    function isOp(v) { return t[p] && t[p].t === 'op' && t[p].v === v; }
    function eat(v) { if (isOp(v)) { p++; return true; } return false; }
    function startsFactor() { return t[p] && (t[p].t !== 'op' || t[p].v === '('); }
    function expr() {
      var f = term();
      for (;;) {
        if (eat('+')) f = bin('+', f, term());
        else if (eat('-')) f = bin('-', f, term());
        else return f;
      }
    }
    function term() {
      var f = unary();
      for (;;) {
        if (eat('*')) f = bin('*', f, unary());
        else if (eat('/')) f = bin('/', f, unary());
        else if (startsFactor()) f = bin('*', f, power());   // implicit: 2x, 3(x+1)
        else return f;
      }
    }
    function unary() {
      if (eat('-')) { var g = unary(); return function (x) { return -g(x); }; }
      if (eat('+')) return unary();
      return power();
    }
    function power() {
      var b = atom();
      if (eat('^')) return bin('^', b, unary());          // right-assoc, -x^2 = -(x^2)
      return b;
    }
    function atom() {
      var tok = t[p++];
      if (!tok) throw new Error('expression ends early');
      if (tok.t === 'num') { var v = tok.v; return function () { return v; }; }
      if (tok.t === 'name') {
        if (tok.v === 'x' || tok.v === 'y') {
          if (tok.v !== vname) throw new Error('use ' + vname + ' here, not ' + tok.v);
          return function (x) { return x; };
        }
        if (tok.v in CONSTS) { var cv = CONSTS[tok.v]; return function () { return cv; }; }
        var fn = FUNCS[tok.v];
        if (!eat('(')) throw new Error(tok.v + ' needs parentheses, like ' + tok.v + '(x)');
        var arg = expr();
        if (!eat(')')) throw new Error('missing )');
        return function (x) { return fn(arg(x)); };
      }
      if (tok.v === '(') {
        var inner = expr();
        if (!eat(')')) throw new Error('missing )');
        return inner;
      }
      throw new Error('unexpected "' + tok.v + '"');
    }
    var f = expr();
    if (p < t.length) throw new Error('extra "' + t[p].v + '"');
    return f;
  }

  /* ---------------- spec parser ---------------- */
  var NUM = '(-?(?:\\d+\\.?\\d*|\\.\\d+))';
  var RANGE = new RegExp('^([xy])\\s*=\\s*' + NUM + '\\s*\\.\\.\\s*' + NUM + '$', 'i');
  var VLINE = new RegExp('^x\\s*=\\s*' + NUM + '$', 'i');
  var CURVE = new RegExp('^y\\s*=\\s*(.+?)(?:\\s+on\\s+' + NUM + '\\s*\\.\\.\\s*' + NUM + ')?$', 'i');
  var XCURVE = new RegExp('^x\\s*=\\s*(.+?)(?:\\s+on\\s+' + NUM + '\\s*\\.\\.\\s*' + NUM + ')?$', 'i');
  var SIZE = new RegExp('^([wh])\\s*=\\s*' + NUM + '$', 'i');

  function points(s) {
    var out = [], re = /\(([^()]*(?:\([^()]*\)[^()]*)*)\)/g, m;
    while ((m = re.exec(s))) {
      var parts = m[1].split(',');
      if (parts.length !== 2) throw new Error('point needs (x,y): ' + m[0]);
      out.push([compile(parts[0])(0), compile(parts[1])(0)]);
    }
    if (!out.length) throw new Error('no points in "' + s + '"');
    return out;
  }

  function parseSpec(spec) {
    var g = { xmin: -5, xmax: 5, ymin: -5, ymax: 5, w: 320, h: null, labels: true, plain: false,
              curves: [], xcurves: [], dots: [], opens: [], segs: [], vlines: [], texts: [] };
    spec.replace(/\u2212/g, '-').split(';').forEach(function (raw) {
      var s = raw.trim(), m;
      if (!s) return;
      if ((m = RANGE.exec(s))) {
        var a = +m[2], b = +m[3];
        if (!(b > a)) throw new Error(s + ': second number must be larger');
        if (m[1].toLowerCase() === 'x') { g.xmin = a; g.xmax = b; } else { g.ymin = a; g.ymax = b; }
      } else if ((m = VLINE.exec(s))) g.vlines.push(+m[1]);
      else if ((m = SIZE.exec(s))) g[m[1].toLowerCase()] = +m[2];
      else if (/^nolabels$/i.test(s)) g.labels = false;
      else if (/^plain$/i.test(s)) { g.plain = true; g.labels = false; }
      else if ((m = /^label\s*\((.*)\)$/i.exec(s))) {
        var lp = m[1].split(',').map(function (q) { return q.trim(); });
        if (lp.length < 3 || lp.length > 4) throw new Error('label needs (x,y,text): ' + s);
        var pos = (lp[3] || 'above').toLowerCase();
        if (!/^(above|below|left|right)$/.test(pos)) throw new Error('label position must be above, below, left or right');
        g.texts.push({ x: compile(lp[0])(0), y: compile(lp[1])(0), s: lp[2], pos: pos });
      }
      else if ((m = /^(dot|open|seg)\s*(\(.*)$/i.exec(s))) {
        var kind = m[1].toLowerCase(), pts = points(m[2]);
        if (kind === 'dot') g.dots = g.dots.concat(pts);
        else if (kind === 'open') g.opens = g.opens.concat(pts);
        else g.segs.push(pts);
      } else if ((m = CURVE.exec(s))) {
        g.curves.push({ f: compile(m[1]),
                        a: m[2] !== undefined ? +m[2] : null,
                        b: m[3] !== undefined ? +m[3] : null });
      } else if ((m = XCURVE.exec(s))) {
        g.xcurves.push({ f: compile(m[1], 'y'),
                         a: m[2] !== undefined ? +m[2] : null,
                         b: m[3] !== undefined ? +m[3] : null });
      } else throw new Error('did not understand "' + s + '"');
    });
    return g;
  }

  /* ---------------- SVG drawing ---------------- */
  var uid = 0;
  var MAX_VH = 38;   // no graph taller than 38% of the screen; lower this to shrink every graph
  var BLUE = '#1f5fbf', GRID = '#dcdcdc', MINOR = '#eeeeee', AXIS = '#333';

  function niceStep(range) {
    var raw = range / 10, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var mults = [1, 2, 5, 10];
    for (var i = 0; i < mults.length; i++) if (mults[i] * mag >= raw - 1e-12) return mults[i] * mag;
    return 10 * mag;
  }
  function fmt(v) { return String(+v.toFixed(6)).replace('-', '\u2212'); }
  function r2(v) { return Math.round(v * 100) / 100; }

  function quickGraphSVG(spec) {
    var g = parseSpec(spec);
    var W = g.w, pad = 8;
    var H = g.h || Math.max(160, Math.min(380, W * (g.ymax - g.ymin) / (g.xmax - g.xmin)));
    var X = function (x) { return r2(pad + (x - g.xmin) / (g.xmax - g.xmin) * (W - 2 * pad)); };
    var Y = function (y) { return r2(H - pad - (y - g.ymin) / (g.ymax - g.ymin) * (H - 2 * pad)); };
    var id = 'qgclip' + (++uid), o = [];
    var sx = niceStep(g.xmax - g.xmin), sy = niceStep(g.ymax - g.ymin);
    var step = Math.max(sx, sy);

    o.push('<svg class="qg" data-w="' + W + '" data-xs="' + r2(step * (W - 2 * pad) / (g.xmax - g.xmin)) +
      '" data-ys="' + r2(step * (H - 2 * pad) / (g.ymax - g.ymin)) + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + r2(H) + '" ' +
      'style="display:block;width:100%;max-width:min(' + Math.round(W * 1.6) + 'px,calc(' + MAX_VH + 'vh * ' + r2(W / H) + '));height:auto;margin:.6em auto;' +
      'background:#fff;border-radius:4px" font-family="Helvetica,Arial,sans-serif">');
    o.push('<defs><clipPath id="' + id + '"><rect x="' + pad + '" y="' + pad + '" width="' +
      (W - 2 * pad) + '" height="' + r2(H - 2 * pad) + '"/></clipPath></defs>');

    // grid
    function grid(step, color) {
      var k, v;
      for (k = Math.ceil(g.xmin / step); k * step <= g.xmax + 1e-9; k++) {
        v = X(k * step); o.push('<line x1="' + v + '" y1="' + pad + '" x2="' + v + '" y2="' + r2(H - pad) + '" stroke="' + color + '" stroke-width="1"/>');
      }
      for (k = Math.ceil(g.ymin / step); k * step <= g.ymax + 1e-9; k++) {
        v = Y(k * step); o.push('<line x1="' + pad + '" y1="' + v + '" x2="' + (W - pad) + '" y2="' + v + '" stroke="' + color + '" stroke-width="1"/>');
      }
    }
    if (!g.plain) {
    if (Math.abs(step / Math.pow(10, Math.floor(Math.log10(step))) - 2) < 1e-9) grid(step / 2, MINOR);
    grid(step, GRID);
    }

    // axes
    var ax = Math.min(Math.max(0, g.ymin), g.ymax), ay = Math.min(Math.max(0, g.xmin), g.xmax);
    if (!g.plain) {
    o.push('<line x1="' + pad + '" y1="' + Y(ax) + '" x2="' + (W - pad) + '" y2="' + Y(ax) + '" stroke="' + AXIS + '" stroke-width="1.5"/>');
    o.push('<line x1="' + X(ay) + '" y1="' + pad + '" x2="' + X(ay) + '" y2="' + r2(H - pad) + '" stroke="' + AXIS + '" stroke-width="1.5"/>');
    }
    // text: font sizes are in screen px (data-px); fitText() rescales them after the graph is on the page
    var AX = AXIS, T = function (x, y, px, extra, str) {
      return '<text x="' + r2(x) + '" y="' + r2(y) + '" font-size="' + px + '" data-px="' + px + '" ' + extra + '>' + str + '</text>';
    };
    var atBottom = (H - pad) - Y(ax) < 16, atLeft = X(ay) - pad < 24, atTop = Y(ax) - pad < 16;
if (!g.plain) {
        o.push(T(W - pad - 2, Y(ax), 13, 'dy="' + (atTop ? '1.1em' : '-0.45em') + '" font-style="italic" text-anchor="end" fill="' + AX + '"', 'x'));
    o.push(T(X(ay), pad, 13, 'dx="0.45em" dy="0.95em" font-style="italic" fill="' + AX + '"', 'y'));
    }

    // tick labels (data-i lets fitText thin them out when the graph is small)
    if (g.labels) {
      var k, v;
      for (k = Math.ceil(g.xmin / step); k * step <= g.xmax + 1e-9; k++) {
        v = k * step; if (Math.abs(v) < 1e-9 || X(v) > W - pad - 16 || X(v) < pad + 8) continue;
        o.push(T(X(v), Y(ax), 11, 'dy="' + (atBottom ? '-0.45em' : '1.15em') + '" text-anchor="middle" fill="#555" data-ax="x" data-i="' + k + '"', fmt(v)));
      }
      for (k = Math.ceil(g.ymin / step); k * step <= g.ymax + 1e-9; k++) {
        v = k * step; if (Math.abs(v) < 1e-9 || Y(v) < pad + 14 || Y(v) > H - pad - 6) continue;
        o.push(T(X(ay), Y(v), 11, 'dx="' + (atLeft ? '0.35em' : '-0.35em') + '" dy="0.35em" text-anchor="' + (atLeft ? 'start' : 'end') + '" fill="#555" data-ax="y" data-i="' + k + '"', fmt(v)));
      }
    }

    // curves (clipped to the window, broken at asymptotes and undefined spots)
    o.push('<g clip-path="url(#' + id + ')" fill="none" stroke="' + BLUE + '" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">');
    var Hr = g.ymax - g.ymin, N = 800;
    g.curves.forEach(function (c) {
      var a = c.a === null ? g.xmin : Math.max(c.a, g.xmin), b = c.b === null ? g.xmax : Math.min(c.b, g.xmax);
      if (!(b > a)) return;
      var d = '', down = false, py = null;
      for (var i = 0; i <= N; i++) {
        var x = a + (b - a) * i / N, y = c.f(x);
        var ok = isFinite(y) && y > g.ymin - 4 * Hr && y < g.ymax + 4 * Hr;
        if (ok && down && Math.abs(y - py) > Hr) down = false;       // jump = asymptote
        if (!ok) { down = false; py = null; continue; }
        d += (down ? 'L' : 'M') + X(x) + ' ' + Y(y);
        down = true; py = y;
      }
      if (d) o.push('<path d="' + d + '"/>');
    });
    var Wr = g.xmax - g.xmin;
    g.xcurves.forEach(function (c) {
      var a = c.a === null ? g.ymin : Math.max(c.a, g.ymin), b = c.b === null ? g.ymax : Math.min(c.b, g.ymax);
      if (!(b > a)) return;
      var d = '', down = false, px = null;
      for (var i = 0; i <= N; i++) {
        var y = a + (b - a) * i / N, x = c.f(y);
        var ok = isFinite(x) && x > g.xmin - 4 * Wr && x < g.xmax + 4 * Wr;
        if (ok && down && Math.abs(x - px) > Wr) down = false;
        if (!ok) { down = false; px = null; continue; }
        d += (down ? 'L' : 'M') + X(x) + ' ' + Y(y);
        down = true; px = x;
      }
      if (d) o.push('<path d="' + d + '"/>');
    });
    g.vlines.forEach(function (v) {
      o.push('<line x1="' + X(v) + '" y1="' + pad + '" x2="' + X(v) + '" y2="' + r2(H - pad) + '" stroke="#c0392b" stroke-dasharray="6 4"/>');
    });
    g.segs.forEach(function (pts) {
      o.push('<polyline points="' + pts.map(function (p) { return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '"/>');
    });
    o.push('</g>');

    // dots on top
    // (drawn as round-capped zero-length strokes so they stay the same size on screen at any scale)
    function blob(p, color, size) {
      return '<path d="M' + X(p[0]) + ' ' + Y(p[1]) + 'l0 0" stroke="' + color + '" stroke-width="' + size + '" stroke-linecap="round" fill="none"/>';
    }
    g.dots.forEach(function (p) { o.push(blob(p, BLUE, 8)); });
    g.opens.forEach(function (p) { o.push(blob(p, BLUE, 9.5)); o.push(blob(p, '#fff', 5.7)); });

    // point labels (white outline keeps them readable over grid lines and the curve)
    var OFF = { above: 'dy="-0.6em" text-anchor="middle"', below: 'dy="1.3em" text-anchor="middle"',
                left: 'dx="-0.6em" dy="0.35em" text-anchor="end"', right: 'dx="0.6em" dy="0.35em" text-anchor="start"' };
    g.texts.forEach(function (t) {
      var str = t.s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      o.push(T(X(t.x), Y(t.y), 16, OFF[t.pos] + ' font-weight="bold" fill="#111" stroke="#fff" stroke-width="3" paint-order="stroke"', str));
    });

    o.push('</svg>');
    // keep line thickness fixed in screen pixels, however much the graph is shrunk or enlarged
    return o.join('').replace(/<(line|path|polyline) /g, '<$1 vector-effect="non-scaling-stroke" ');
  }

  /* ---------------- keep text the same size on screen ---------------- */
  function fitText(svg) {
    var w = svg.getBoundingClientRect().width;
    if (!w) return;
    svg._qgSeen = true;
    var k = (+svg.getAttribute('data-w')) / w;                  // drawing units per screen pixel
    var strideX = Math.max(1, Math.ceil(30 / (+svg.getAttribute('data-xs') / k)));
    var strideY = Math.max(1, Math.ceil(18 / (+svg.getAttribute('data-ys') / k)));
    var list = svg.querySelectorAll('text[data-px]');
    for (var i = 0; i < list.length; i++) {
      var el = list[i];
      el.setAttribute('font-size', r2(+el.getAttribute('data-px') * k));
      var axis = el.getAttribute('data-ax');
      if (axis) el.style.display = (+el.getAttribute('data-i')) % (axis === 'x' ? strideX : strideY) === 0 ? '' : 'none';
    }
  }
  var ro = global.ResizeObserver ? new ResizeObserver(function (es) { es.forEach(function (e) { fitText(e.target); }); }) : null;
  var watched = [];
  function watch(root) {
    watched = watched.filter(function (s) { if (s.isConnected || !s._qgSeen) return true; ro.unobserve(s); return false; });
    var list = root.querySelectorAll('svg.qg');
    for (var i = 0; i < list.length; i++) {
      if (ro) { ro.observe(list[i]); watched.push(list[i]); }
      else (function (s) { setTimeout(function () { fitText(s); }, 0); })(list[i]);
    }
  }

  /* ---------------- page hook ---------------- */
  var TAG = /\[\[\s*(plot|img)\s+([\s\S]*?)\]\]/gi;

  function renderQuickGraphs(root) {
    if (!root || root.innerHTML.indexOf('[[') < 0) return;
    root.innerHTML = root.innerHTML.replace(TAG, function (all, kind, body) {
      body = body.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/<br\s*\/?>/gi, ' ').trim();
      try {
        if (kind.toLowerCase() === 'img') {
          if (!/^https:\/\/\S+$/.test(body)) throw new Error('image link must start with https://');
          return '<img src="' + body.replace(/"/g, '%22') + '" alt="" style="display:block;max-width:100%;max-height:45vh;margin:.6em auto">';
        }
        return quickGraphSVG(body);
      } catch (err) {
        return '<span style="color:#b00020;font-size:.85em">[graph error: ' +
          String(err.message).replace(/</g, '&lt;') + ']</span>';
      }
    });
    watch(root);
  }

  global.renderQuickGraphs = renderQuickGraphs;
  global.quickGraphSVG = quickGraphSVG;
})(window);
