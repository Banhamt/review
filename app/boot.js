/* Loads a review page.  A set's index.html needs only:
     <script src="../../app/boot.js" data-set="157-exam2"></script>
   It loads the styles, KaTeX, the graph code, the runtime, the set's templates and banks,
   then starts the app. Paths are worked out from where boot.js lives. */
(function () {
  'use strict';
  var me = document.currentScript, ROOT = me.src.replace(/app\/boot\.js(\?.*)?$/, ''), SET = me.getAttribute('data-set');
  var KATEX = 'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/';
  var V = '?v=' + (me.getAttribute('data-v') || '1');

  function css(href) { var l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
  function js(src) {
    return new Promise(function (ok, no) {
      var s = document.createElement('script'); s.src = src; s.onload = ok;
      s.onerror = function () { no(new Error('could not load ' + src.replace(ROOT, ''))); };
      document.head.appendChild(s);
    });
  }
  function json(url) {
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(url.replace(ROOT, '') + ': ' + r.status); return r.json();
    });
  }
  function fail(e) {
    var b = document.body || document.documentElement;
    b.innerHTML = '<div style="font-family:sans-serif;max-width:500px;margin:40px auto;color:#A63D40">Could not load this review (' +
      String(e.message).replace(/</g, '&lt;') + '). Try reloading the page.</div>';
  }

  css(KATEX + 'katex.min.css'); css(ROOT + 'app/style.css' + V);
  var meta = document.createElement('meta'); meta.name = 'viewport'; meta.content = 'width=device-width, initial-scale=1'; document.head.appendChild(meta);

  // math is optional: if the CDN is slow or blocked the page still works, with raw $...$
  var math = js(KATEX + 'katex.min.js').then(function () { return js(KATEX + 'contrib/auto-render.min.js'); }).catch(function () {});

  Promise.all([js(ROOT + 'app/quickgraph.js' + V), js(ROOT + 'app/runtime.js' + V), json(ROOT + 'sets/' + SET + '.json'),
               json(ROOT + 'app/config.json').catch(function () { return {}; })])
    .then(function (a) {
      var set = a[2], config = a[3];
      return Promise.all([
        Promise.all((set.templates || []).map(function (t) { return js(ROOT + 'bank/templates/' + t + '.js' + V); })),
        Promise.all((set.banks || []).map(function (b) { return json(ROOT + 'bank/' + b + '/questions.json'); })),
        js(ROOT + 'app/app.js' + V), math
      ]).then(function (b) { window.ReviewApp.start({ root: ROOT, set: set, banks: b[1], config: config }); });
    })
    .catch(function (e) {
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { fail(e); }); else fail(e);
    });
})();
