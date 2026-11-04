/* Review app. Started by boot.js with { root, set, banks, config }.
   Three screens share one saved progress record (per set, in this browser only):
     home     — Readiness Check card, every section with its progress, and the collapsed "All questions" grid
     check    — Readiness Check: one question per section (+ extras), results as Ready / Review by section
     section  — practice one section: missed first, then not tried, then ones already right */
(function () {
  'use strict';
  var LET = 'ABCDE';

  function start(opt) {
    var set = opt.set, cfg = opt.config || {}, STORE = set.storage || ('review:' + set.id);
    var CHECK = (set.check && set.check.name) || 'Readiness Check';
    var CHECK_N = (set.check && set.check.size) || 10, CHECK_EXTRA = (set.check && set.check.extra) || [];
    var PING = cfg.ping || '';
    var bank = {}, Q = [], byId = {}, SECS = [], secOf = {}, S, cur = null, answered = null;

    opt.banks.forEach(function (b) { b.questions.forEach(function (q) { bank[q.id] = q; }); });
    set.sections.forEach(function (sec) {
      SECS.push(sec);
      sec.ids.forEach(function (id) {
        var q = bank[id] ? { id: id, prompt: bank[id].prompt, choices: bank[id].choices, key: bank[id].key }
              : window.Review.templates[id] ? { id: id, template: true } : null;
        if (!q) { console.warn('unknown question id', id); return; }
        q.sec = sec.code; byId[id] = q; secOf[id] = sec; Q.push(q);
      });
    });
    var secName = function (code) { var s = SECS.filter(function (x) { return x.code === code; })[0]; return s ? s.name : ''; };

    // ---------- page ----------
    document.title = (set.course_title ? set.course_title + ' · ' : '') + set.title;
    document.body.innerHTML =
      '<div class="wrap">' +
      '  <div class="eyebrow">' + esc(set.course_title || '') + (set.covers ? ' · ' + esc(set.covers) : '') + '</div>' +
      '  <h1>' + esc(set.title) + '</h1>' +
      '  <button class="crumb hide" id="toHome">← All sections</button>' +
      '  <div id="checkTop" class="hide"><div class="line"><div class="track"><div class="fill" id="lFill"></div></div><div class="lbl" id="lLbl"></div></div></div>' +
      '  <div id="secTop" class="hide">' +
      '    <div class="secTitle"><h2 id="sName"></h2><span id="sPos"></span></div>' +
      '    <div class="prog"><div class="track"><div class="fill" id="sFill"></div><div class="miss" id="sMiss"></div></div>' +
      '      <div class="txt"><span id="sOk"></span><span id="sMissTxt"></span></div></div>' +
      '  </div>' +
      '  <div id="home" class="hide"></div>' +
      '  <div class="card" id="card"></div>' +
      '  <div class="hint" id="hint">Keys: A–E to answer, Enter or → for next, ← for back</div>' +
      '  <div id="secBottom" class="hide"><button class="tog small" id="shuffle"></button></div>' +
      '  <div class="copy">© 2026 Tim Banham. All rights reserved.</div>' +
      '</div>';
    var $ = function (id) { return document.getElementById(id); };
    function show(id, on) { $(id).classList.toggle('hide', !on); }

    // ---------- saved progress ----------
    function load() {
      var s = null;
      try { s = JSON.parse(localStorage.getItem(STORE)); } catch (e) {}
      s = s || {};
      if (s.quick && !s.check) s.check = s.quick;            // older versions of this page
      if (s.full && !s.practice) s.practice = s.full;
      delete s.quick; delete s.full; delete s.hideSecs; delete s.mode;
      s.res = s.res || {}; s.shuffle = !!s.shuffle; s.topic = s.topic || '';
      ['check', 'practice'].forEach(function (v) {
        var l = s[v] || {};
        if (!(l.queue || []).every(function (id) { return byId[id]; })) l = {};
        s[v] = { queue: l.queue || [], pos: Math.min(l.pos || 0, (l.queue || []).length), round: l.round || {}, started: !!l.started, sent: l.sent || '' };
      });
      Object.keys(s.res).forEach(function (id) { if (!byId[id]) delete s.res[id]; });
      if (s.topic && !SECS.some(function (x) { return x.code === s.topic; })) s.topic = '';
      // reopen mid-check or mid-section where the student left off; otherwise start at home
      var v = s.view;
      if (v === 'check' && s.check.started && s.check.pos < s.check.queue.length) s.view = 'check';
      else if ((v === 'section' || v === 'practice' || v === 'full') && s.topic) s.view = 'section';
      else s.view = 'home';
      if (!s.id) s.id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);   // anonymous device id
      return s;
    }
    function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
    function L() { return S.view === 'check' ? S.check : S.practice; }

    // ---------- usage ping (anonymous) ----------
    // Sends small batches: each answer (question, section, right?, seconds) plus active time on the page.
    // Active time only counts while the page is visible and the student has done something in the last 3 minutes.
    var SESSION = Math.random().toString(36).slice(2, 10), buf = [], active = 0, lastAct = Date.now(), lastTick = Date.now();
    function tick() {
      var now = Date.now();
      if (document.visibilityState === 'visible' && now - lastAct < 180000) { var dt = (now - lastTick) / 1000; active += dt; if (S) S.activeSec = (S.activeSec || 0) + dt; }
      lastTick = now;
    }
    ['pointerdown', 'keydown', 'scroll', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function () { tick(); lastAct = Date.now(); }, { passive: true });
    });
    setInterval(tick, 5000);
    function ping(ev, extra) {
      if (!PING) return;
      tick();
      var ok = Q.filter(function (q) { return S.res[q.id] === 'ok'; }).length;
      var body = { v: 2, course: set.course || '', set: set.id, id: S.id, session: SESSION, ev: ev, active: Math.round(active), ok: ok, of: Q.length, view: S.view, answers: buf };
      for (var k in extra || {}) body[k] = extra[k];
      buf = []; active = 0;
      var data = JSON.stringify(body);
      try {
        if (navigator.sendBeacon && navigator.sendBeacon(PING, data)) return;
        fetch(PING, { method: 'POST', mode: 'no-cors', keepalive: true, body: data });
      } catch (e) {}
    }
    function flush() { tick(); if (buf.length || active >= 5) ping('answers'); }
    function record(q, right) {
      var label = q.template ? q.id : String(bank[q.id] ? bank[q.id].prompt : '').replace(/\[\[[\s\S]*?\]\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 70);
      buf.push({ q: q.id, sec: q.sec, ok: right ? 1 : 0, s: Math.min(900, Math.round((Date.now() - (cur && cur.shown || Date.now())) / 1000)),
                 view: S.view, t: q.template ? 1 : 0, label: label });
      if (buf.length >= 20) flush();
    }
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); else { lastTick = Date.now(); lastAct = Date.now(); } });
    window.addEventListener('pagehide', flush);

    // ---------- math + graphs ----------
    function tex(el, text) {
      // Plain text only (no HTML parsing). Math $…$ (may contain \$) is left for KaTeX; **word** -> bold;
      // \$ outside math -> a literal $ in a span KaTeX skips, so it can't pair up with other dollar signs.
      el.textContent = '';
      var pieces = String(text || '').split(/(\$\$[\s\S]*?\$\$|\$(?:\\[\s\S]|[^$\\])*\$|\\\$)/);
      pieces.forEach(function (seg, j) {
        if (!seg) return;
        if (j % 2 && seg === '\\$') { var u = document.createElement('span'); u.className = 'usd'; u.textContent = '$'; el.appendChild(u); return; }
        if (j % 2) { el.appendChild(document.createTextNode(seg)); return; }
        seg.split(/\*\*([^*]+?)\*\*/).forEach(function (part, i) {
          if (!part) return;
          if (i % 2) { var b = document.createElement('b'); b.textContent = part; el.appendChild(b); }
          else el.appendChild(document.createTextNode(part));
        });
      });
      if (text && window.renderQuickGraphs) renderQuickGraphs(el);
      if (text && window.renderMathInElement) renderMathInElement(el, { ignoredClasses: ['usd'], delimiters: [
        { left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true } ], throwOnError: false });
    }

    // ---------- lists ----------
    function shuffled(a) {
      a = a.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    function idsIn(code) { return Q.filter(function (q) { return !code || q.sec === code; }).map(function (q) { return q.id; }); }
    function tally(ids) {
      var ok = 0, miss = 0;
      ids.forEach(function (id) { if (S.res[id] === 'ok') ok++; else if (S.res[id] === 'miss') miss++; });
      return { n: ids.length, ok: ok, miss: miss };
    }
    function go() { cur = null; answered = null; save(); }
    function buildSection(code) {          // missed first, then not tried, then ones already right
      var ids = idsIn(code), mix = S.shuffle ? shuffled : function (a) { return a; };
      var queue = mix(ids.filter(function (i) { return S.res[i] === 'miss'; }))
        .concat(mix(ids.filter(function (i) { return !S.res[i]; })), mix(ids.filter(function (i) { return S.res[i] === 'ok'; })));
      S.topic = code;
      S.practice = { queue: queue, pos: 0, round: {}, started: true };
    }
    function openSection(code, atId) {
      var p = S.practice, resume = !atId && S.topic === code && p.queue.length && p.pos < p.queue.length;
      if (!resume) buildSection(code);
      if (atId) S.practice.pos = Math.max(0, S.practice.queue.indexOf(atId));
      S.view = 'section'; go(); draw(); window.scrollTo(0, 0);
    }
    function goHome() { S.view = 'home'; go(); draw(); window.scrollTo(0, 0); }
    function choose(ids, taken) {          // missed first, then not tried, then any
      ids = ids.filter(function (i) { return taken.indexOf(i) < 0; });
      var tiers = [ids.filter(function (i) { return S.res[i] === 'miss'; }), ids.filter(function (i) { return !S.res[i]; }), ids];
      for (var t = 0; t < tiers.length; t++) if (tiers[t].length) return shuffled(tiers[t])[0];
      return null;
    }
    function buildCheck() {
      var picks = [];
      SECS.forEach(function (s) { var c = choose(s.ids.filter(function (i) { return byId[i]; }), picks); if (c) picks.push(c); });
      var extra = shuffled(CHECK_EXTRA);
      for (var i = 0; picks.length < CHECK_N && extra.length && i < 40; i++) {
        var c = choose(idsIn(extra[i % extra.length]), picks); if (c) picks.push(c);
      }
      var order = Q.map(function (q) { return q.id; });
      picks.sort(function (a, b) { return order.indexOf(a) - order.indexOf(b); });
      S.check = { queue: picks, pos: 0, round: {}, started: true, sent: '' };
    }
    function startCheck() { buildCheck(); S.view = 'check'; go(); draw(); window.scrollTo(0, 0); }
    function checkDone() { return S.check.started && S.check.queue.length && S.check.pos >= S.check.queue.length; }
    function reviewCodes() {               // sections marked Review in the last finished check and not yet mastered
      if (!checkDone()) return [];
      return readiness().rows.filter(function (x) {
        if (x.ok) return false;
        var t = tally(idsIn(x.code)); return t.ok < t.n;
      }).map(function (x) { return x.code; });
    }
    function nextWeak(except) {            // marked Review first, then most to redo, then the earliest section not yet mastered
      var rev = reviewCodes(), best = null, score = -1;
      SECS.forEach(function (s, i) {
        if (s.code === except) return;
        var t = tally(idsIn(s.code)); if (!t.n || t.ok === t.n) return;
        var sc = (rev.indexOf(s.code) >= 0 ? 1000 : 0) + t.miss * 10 - i / 100;
        if (sc > score) { score = sc; best = s; }
      });
      return best;
    }
    function current() {
      var l = L(), key = S.view + ':' + S.topic + ':' + l.pos;
      if (!cur || cur.key !== key) {
        var base = byId[l.queue[l.pos]];
        var q = base.template ? window.Review.makeVersion(base.id, set.avoid) : base;
        q.sec = base.sec;
        cur = { key: key, q: q, shown: Date.now() };
      }
      return cur.q;
    }

    // ---------- drawing ----------
    function drawChrome() {
      var v = S.view, l = L();
      show('toHome', v !== 'home');
      show('home', v === 'home'); show('card', v !== 'home');
      show('checkTop', v === 'check' && l.pos < l.queue.length);
      show('secTop', v === 'section'); show('secBottom', v === 'section');
      if (v === 'check') {
        $('lFill').style.width = (l.queue.length ? 100 * l.pos / l.queue.length : 0) + '%';
        $('lLbl').textContent = CHECK + ' · question ' + Math.min(l.pos + 1, l.queue.length) + ' of ' + l.queue.length;
      }
      if (v === 'section') drawSectionTop();
      if (v === 'home') drawHome();
    }

    function drawSectionTop() {
      var l = S.practice, t = tally(idsIn(S.topic));
      $('sName').innerHTML = '<b>' + esc(S.topic) + '</b> ' + esc(secName(S.topic));
      $('sPos').textContent = l.pos < l.queue.length ? 'Question ' + (l.pos + 1) + ' of ' + l.queue.length : 'Done';
      $('sFill').style.width = (t.n ? 100 * t.ok / t.n : 0) + '%';
      $('sMiss').style.width = (t.n ? 100 * t.miss / t.n : 0) + '%';
      $('sOk').innerHTML = '<b>' + t.ok + '</b> of ' + t.n + ' mastered';
      $('sMissTxt').textContent = t.miss ? t.miss + ' to redo' : (t.ok === t.n ? 'All mastered' : '');
      $('shuffle').textContent = 'Shuffle order: ' + (S.shuffle ? 'on' : 'off');
      $('shuffle').classList.toggle('on', S.shuffle);
    }

    function drawHome() {
      var box = $('home'), c = S.check, all = tally(idsIn('')), rev = reviewCodes(), chk;
      if (!c.started || !c.queue.length) {
        chk = '<p>' + CHECK_N + ' questions, one from each section. You’ll see which sections you’re ready for and which to review. Most take a minute or two.</p>' +
              '<button class="go" id="chkGo">Begin the check</button>';
      } else if (c.pos < c.queue.length) {
        chk = '<p>You stopped at question ' + (c.pos + 1) + ' of ' + c.queue.length + '.</p>' +
              '<button class="go" id="chkGo">Continue the check</button><p class="alt"><button class="link" id="chkNew">Start over</button></p>';
      } else {
        var st = readiness();
        chk = '<p>Last check: ready for ' + st.ready + ' of ' + st.rows.length + ' sections.' + (rev.length ? ' Sections to review are marked below.' : '') + '</p>' +
              '<button class="go" id="chkGo">Take another check</button><p class="alt"><button class="link" id="chkRes">See last results</button></p>';
      }
      box.innerHTML =
        '<div class="card checkCard"><h2>' + esc(CHECK) + '</h2>' + chk + '</div>' +
        '<div class="secHead"><h3>Practice by section</h3><span>' + all.ok + ' of ' + all.n + ' mastered</span></div>' +
        '<div class="secs" id="secs"></div>' +
        '<details id="allQ"' + (S.mapOpen ? ' open' : '') + '><summary>All ' + Q.length + ' questions (green = right last time, red = missed)</summary><div class="map" id="map"></div></details>' +
        '<div class="foot"><span>Progress is saved in this browser.</span><button class="link" id="reset">Reset my progress</button></div>';

      var secs = $('secs');
      SECS.forEach(function (s) {
        var ids = idsIn(s.code); if (!ids.length) return;
        var t = tally(ids), done = t.ok === t.n, r = rev.indexOf(s.code) >= 0;
        var b = document.createElement('button');
        b.className = 'sec' + (done ? ' all-ok' : '') + (r ? ' rev' : '');
        b.innerHTML = '<span class="nm"><b>' + esc(s.code) + '</b>' + esc(s.name) + (r ? '<span class="pill miss">Review</span>' : '') + '</span>' +
          '<span class="meter"><span class="bar"><i class="g" style="width:' + 100 * t.ok / t.n + '%"></i><i class="r" style="width:' + 100 * t.miss / t.n + '%"></i></span>' +
          '<span class="ct' + (t.miss ? ' bad' : '') + '">' + (done ? '✓ ' + t.n + ' of ' + t.n : t.miss ? t.miss + ' to redo' : t.ok + ' of ' + t.n) + '</span></span>' +
          '<span class="chev">›</span>';
        b.onclick = function () { openSection(s.code); };
        secs.appendChild(b);
      });

      var map = $('map');
      Q.forEach(function (q, i) {
        var b = document.createElement('button');
        b.textContent = i + 1;
        b.className = S.res[q.id] || '';
        b.title = q.sec + ' ' + secName(q.sec);
        b.onclick = function () { openSection(q.sec, q.id); };
        map.appendChild(b);
      });
      $('allQ').ontoggle = function () { S.mapOpen = $('allQ').open; save(); };

      $('chkGo').onclick = function () { if (c.started && c.queue.length && c.pos < c.queue.length) { S.view = 'check'; go(); draw(); window.scrollTo(0, 0); } else startCheck(); };
      if ($('chkNew')) $('chkNew').onclick = startCheck;
      if ($('chkRes')) $('chkRes').onclick = function () { S.view = 'check'; go(); draw(); window.scrollTo(0, 0); };
      $('reset').onclick = function () {
        if (!$('reset').dataset.sure) { $('reset').dataset.sure = 1; $('reset').textContent = 'Tap again to erase progress'; return; }
        S.res = {}; S.topic = ''; S.check = { queue: [], pos: 0, round: {}, started: false, sent: '' };
        S.practice = { queue: [], pos: 0, round: {}, started: false }; go(); draw();
      };
    }

    function draw() {
      drawChrome();
      if (S.view === 'home') { show('hint', false); return; }
      var card = $('card'), l = L();
      show('hint', l.pos < l.queue.length);
      if (l.pos >= l.queue.length) return S.view === 'check' ? drawResults(card) : drawDone(card);

      var q = current(), prev = S.res[q.id], sec = S.view === 'section';
      card.innerHTML = '';
      var meta = document.createElement('div'); meta.className = 'meta';
      var left = document.createElement('span');
      left.textContent = sec ? '' : q.sec + ' ' + secName(q.sec);
      meta.appendChild(left);
      var pills = document.createElement('span'); pills.className = 'pills';
      if (q.template && sec) pills.innerHTML += '<span class="pill new">new numbers</span>';
      if (prev && sec) pills.innerHTML += '<span class="pill ' + prev + '">' + (prev === 'ok' ? 'got it last time' : 'missed last time') + '</span>';
      meta.appendChild(pills);
      if (left.textContent || pills.innerHTML) card.appendChild(meta);

      var p = document.createElement('div'); p.className = 'prompt'; tex(p, q.prompt); card.appendChild(p);
      var grid = document.createElement('div'); grid.className = 'grid';
      q.choices.forEach(function (c, i) {
        if (!c) return;
        var Ltr = LET[i], b = document.createElement('button');
        b.className = 'choice'; b.dataset.l = Ltr;
        b.innerHTML = '<span class="L">' + Ltr + '</span><span class="T"></span>';
        tex(b.querySelector('.T'), c);
        b.onclick = function () { pick(Ltr); };
        grid.appendChild(b);
      });
      card.appendChild(grid);

      var v = document.createElement('div'); v.className = 'verdict'; v.id = 'verdict'; card.appendChild(v);
      var nav = document.createElement('div'); nav.className = 'nav';
      nav.innerHTML = '<button id="back">← Back</button>' + (q.template && sec ? '<button id="again1" class="hide">↻ New numbers</button>' : '') +
                      '<button id="next" class="primary">Skip →</button>';
      card.appendChild(nav);
      $('back').disabled = l.pos === 0;
      $('back').onclick = back; $('next').onclick = next;
      if ($('again1')) $('again1').onclick = function () { go(); draw(); };
      var qid = document.createElement('div'); qid.className = 'qid'; qid.textContent = q.id; card.appendChild(qid);   // for telling Claude which question to edit
      if (answered) reveal(q, answered);
    }

    function reveal(q, Ltr) {
      [].forEach.call(document.querySelectorAll('button.choice'), function (b) {
        b.disabled = true;
        if (b.dataset.l === q.key) b.classList.add('correct');
        else if (b.dataset.l === Ltr) b.classList.add('wrong');
        else b.classList.add('dim');
      });
      var v = $('verdict');
      if (Ltr === q.key) { v.className = 'verdict ok'; v.textContent = 'Correct'; }
      else { v.className = 'verdict no'; v.textContent = 'Not quite — the answer is ' + q.key + '.'; }
      var l = L();
      $('next').textContent = l.pos + 1 < l.queue.length ? 'Next →' : (S.view === 'check' ? 'See results →' : 'Finish →');
      if ($('again1')) $('again1').classList.remove('hide');
    }

    function pick(Ltr) {
      if (S.view === 'home') return;
      var l = L();
      if (answered || l.pos >= l.queue.length) return;
      var q = current();
      if (!q.choices[LET.indexOf(Ltr)]) return;
      answered = Ltr;
      S.res[q.id] = Ltr === q.key ? 'ok' : 'miss';
      l.round[q.id] = S.res[q.id];
      record(q, Ltr === q.key);
      save(); if (S.view === 'section') drawSectionTop(); reveal(q, Ltr);
    }
    function next() {
      if (S.view === 'home') return;
      var l = L();
      if (l.pos >= l.queue.length) return;
      l.pos++; go(); draw(); window.scrollTo(0, 0);
      if (S.view === 'check' && l.pos === l.queue.length) {
        var st = readiness();
        ping('check-done', { score: st.right + '/' + l.queue.length, ready: st.ready + '/' + st.rows.length });
      }
    }
    function back() { if (S.view === 'home') return; var l = L(); if (l.pos > 0) { l.pos--; go(); draw(); } }

    function readiness() {
      var l = S.check, r = l.round, by = {};
      l.queue.forEach(function (id) { var c = byId[id].sec; (by[c] = by[c] || []).push(r[id]); });
      var rows = SECS.filter(function (s) { return by[s.code]; }).map(function (s) {
        return { code: s.code, name: s.name, ok: by[s.code].every(function (x) { return x === 'ok'; }) };
      });
      return { rows: rows, ready: rows.filter(function (x) { return x.ok; }).length,
               right: l.queue.filter(function (i) { return r[i] === 'ok'; }).length };
    }

    function drawResults(card) {
      var st = readiness(), todo = st.rows.length - st.ready;
      var line = todo === 0 ? 'You’re ready for every section. Nice work.'
        : 'You’re ready for ' + st.ready + ' of ' + st.rows.length + ' sections. Tap Review to practice ' + (todo === 1 ? 'that section' : 'a section') + '.';
      card.innerHTML = '<div class="results"><h2>Your results</h2><p>' + line + '</p><div class="ready">' +
        st.rows.map(function (x) {
          return '<div class="row ' + (x.ok ? 'ok' : 'miss') + '"><b>' + esc(x.code) + '</b><span>' + esc(x.name) + '</span>' +
            '<span class="st">' + (x.ok ? 'Ready' : '<button data-sec="' + esc(x.code) + '">Review →</button>') + '</span></div>';
        }).join('') + '</div>' +
        sendBox(st) +
        '<div class="nav col"><button class="primary" id="toSecs">' + (todo ? 'See all sections' : 'Back to all sections') + '</button>' +
        '<button id="again">Take another check</button></div>' +
        '<p class="small">Another check picks different questions, favoring the ones you missed.</p></div>';
      [].forEach.call(card.querySelectorAll('[data-sec]'), function (b) {
        b.onclick = function () { buildSection(b.dataset.sec); openSection(b.dataset.sec); };
      });
      $('toSecs').onclick = goHome;
      $('again').onclick = startCheck;
      wireSend(st);
    }

    // ---------- "Send my results" (opt-in, the only place a name is ever sent) ----------
    var WHO = cfg.instructor || 'your instructor';
    function sendBox(st) {
      if (!PING) return '';
      var sent = S.check.sent;
      return '<div class="send">' + (sent
        ? '<p class="sent">✓ Sent to ' + esc(WHO) + ' as ' + esc(sent) + '</p>'
        : '<button class="link" id="sendTog">Send my results to ' + esc(WHO) + '</button>' +
          '<div id="sendBox" class="hide"><div class="sendRow"><input id="sendName" placeholder="Your first and last name" autocomplete="name" value="' + esc(S.name || '') + '">' +
          '<button id="sendBtn">Send</button></div>' +
          '<p class="small">Sends your name, this check’s results, and how many questions you’ve mastered. ' +
          'Your practice answers stay anonymous.</p></div>') + '</div>';
    }
    function wireSend(st) {
      if (!$('sendTog')) return;
      $('sendTog').onclick = function () { show('sendBox', true); $('sendTog').classList.add('hide'); $('sendName').focus(); };
      $('sendName').onkeydown = function (e) { if (e.key === 'Enter') $('sendBtn').click(); };
      $('sendBtn').onclick = function () {
        var name = $('sendName').value.replace(/\s+/g, ' ').trim().slice(0, 60);
        if (name.length < 2) { $('sendName').focus(); return; }
        var ok = Q.filter(function (q) { return S.res[q.id] === 'ok'; }).length;
        var body = { v: 2, ev: 'send-results', course: set.course || '', set: set.id, name: name,
          score: st.right + '/' + S.check.queue.length, ready: st.ready + '/' + st.rows.length,
          review: st.rows.filter(function (x) { return !x.ok; }).map(function (x) { return x.code; }).join(', '),
          ok: ok, of: Q.length, minutes: Math.round((S.activeSec || 0) / 6) / 10 };
        try {
          var data = JSON.stringify(body);
          if (!(navigator.sendBeacon && navigator.sendBeacon(PING, data))) fetch(PING, { method: 'POST', mode: 'no-cors', body: data });
        } catch (e) {}
        S.name = name; S.check.sent = name; save(); draw();
      };
    }

    function drawDone(card) {
      var l = S.practice, r = l.round, ids = Object.keys(r), right = ids.filter(function (i) { return r[i] === 'ok'; }).length;
      var t = tally(idsIn(S.topic)), nx = nextWeak(S.topic);
      card.innerHTML = '<div class="done"><div class="sub">' + esc(S.topic + ' ' + secName(S.topic)) + ' · end of section</div>' +
        '<div class="big">' + right + ' / ' + ids.length + '</div>' +
        '<p>right this time through.<br>' + t.ok + ' of ' + t.n + ' mastered in this section.</p>' +
        '<div class="nav col">' +
        (t.miss ? '<button class="primary" id="redo">Redo the ' + t.miss + ' missed</button>' : '') +
        (nx ? '<button' + (t.miss ? '' : ' class="primary"') + ' id="nextSec">Next weak section: ' + esc(nx.code + ' ' + nx.name) + ' →</button>' : '') +
        '<button' + (t.miss || nx ? '' : ' class="primary"') + ' id="toSecs">Back to all sections</button></div>' +
        (!nx && !t.miss ? '<p class="small">Every question mastered. Nice work.</p>' : '') + '</div>';
      if ($('redo')) $('redo').onclick = function () { buildSection(S.topic); S.practice.queue = S.practice.queue.slice(0, t.miss); go(); draw(); window.scrollTo(0, 0); };
      if ($('nextSec')) $('nextSec').onclick = function () { buildSection(nx.code); openSection(nx.code); };
      $('toSecs').onclick = goHome;
    }

    // ---------- controls ----------
    $('toHome').onclick = goHome;
    $('shuffle').onclick = function () { S.shuffle = !S.shuffle; buildSection(S.topic); go(); draw(); };
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || /^(SELECT|SUMMARY|INPUT)$/.test(e.target.tagName)) return;
      var k = e.key.toUpperCase();
      if (k.length === 1 && LET.indexOf(k) >= 0) pick(k);
      else if (e.key === 'Enter' || e.key === 'ArrowRight') { if (e.target.tagName !== 'BUTTON') next(); }
      else if (e.key === 'ArrowLeft') back();
    });

    S = load();
    if (S.practice.queue.length && S.practice.queue.length > idsIn(S.topic).length) S.practice = { queue: [], pos: 0, round: {}, started: false };
    if (S.view === 'section' && !S.practice.queue.length) buildSection(S.topic);
    save(); draw();
    ping('open');
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  window.ReviewApp = { start: start };
})();
