/* Review app. Started by boot.js with { root, set, banks, config }.
   Two views share one saved progress record (per set, in this browser only):
     check    — Readiness Check: one question per section (+ extras), results as Ready / Review by section
     practice — every question in the set, with per-section progress, modes and a question map */
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
      '  <div class="topRow"><h1>' + esc(set.title) + '</h1><button class="link" id="viewTog"></button></div>' +
      '  <div id="checkTop" class="hide"><div class="line"><div class="track"><div class="fill" id="lFill"></div></div><div class="lbl" id="lLbl"></div></div></div>' +
      '  <div id="pracTop" class="hide">' +
      '    <div class="sub">Every question in this review. Tap a section to practice just that one. Questions marked “new numbers” change every time.</div>' +
      '    <div class="prog"><div class="track"><div class="fill" id="pFill"></div><div class="miss" id="pMiss"></div></div>' +
      '      <div class="txt"><span><b id="pOk">0</b> of <span id="pN">0</span> mastered</span><span id="pMissTxt"></span></div></div>' +
      '    <div class="secHead"><span>By section</span><button class="link" id="secTog">Hide</button></div>' +
      '    <div class="secs" id="secs"></div>' +
      '    <div class="ctl"><div class="seg" id="modes"><button data-mode="order">In order</button><button data-mode="missed">Missed first</button></div>' +
      '      <button class="tog" id="shuffle">Shuffle</button></div>' +
      '  </div>' +
      '  <div class="card" id="card"></div>' +
      '  <div class="hint" id="hint">Keys: A–E to answer, Enter or → for next, ← for back</div>' +
      '  <div id="pracBottom" class="hide">' +
      '    <details><summary>All questions (green = right last time, red = missed)</summary><div class="map" id="map"></div></details>' +
      '    <div class="foot"><span>' + Q.length + ' questions</span><button class="link" id="reset">Reset my progress</button></div>' +
      '  </div>' +
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
      delete s.quick; delete s.full;
      s.view = s.view === 'full' || s.view === 'practice' ? 'practice' : 'check';
      s.res = s.res || {}; s.mode = s.mode || 'order'; s.shuffle = !!s.shuffle; s.topic = s.topic || '';
      ['check', 'practice'].forEach(function (v) {
        var l = s[v] || {};
        if (!(l.queue || []).every(function (id) { return byId[id]; })) l = {};
        s[v] = { queue: l.queue || [], pos: Math.min(l.pos || 0, (l.queue || []).length), round: l.round || {}, started: !!l.started, sent: l.sent || '' };
      });
      Object.keys(s.res).forEach(function (id) { if (!byId[id]) delete s.res[id]; });
      if (s.topic && !SECS.some(function (x) { return x.code === s.topic; })) s.topic = '';
      if (!s.id) s.id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);   // anonymous device id
      return s;
    }
    function save() { try { localStorage.setItem(STORE, JSON.stringify(S)); } catch (e) {} }
    function L() { return S[S.view]; }

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
      el.textContent = '';                 // **word** -> bold; everything else stays plain text (no HTML parsing)
      String(text || '').split(/\*\*([^*]+?)\*\*/).forEach(function (part, i) {
        if (!part) return;
        if (i % 2) { var b = document.createElement('b'); b.textContent = part; el.appendChild(b); }
        else el.appendChild(document.createTextNode(part));
      });
      if (text && window.renderQuickGraphs) renderQuickGraphs(el);
      if (text && window.renderMathInElement) renderMathInElement(el, { delimiters: [
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
    function go() { cur = null; answered = null; save(); }
    function buildPractice() {
      var ids = idsIn(S.topic), mix = S.shuffle ? shuffled : function (a) { return a; }, queue;
      if (S.mode === 'missed') {
        queue = mix(ids.filter(function (i) { return S.res[i] === 'miss'; }))
          .concat(mix(ids.filter(function (i) { return !S.res[i]; })), mix(ids.filter(function (i) { return S.res[i] === 'ok'; })));
      } else queue = mix(ids);
      S.practice = { queue: queue, pos: 0, round: {}, started: true }; go();
    }
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
      S.check = { queue: picks, pos: 0, round: {}, started: true, sent: '' }; go();
    }
    function current() {
      var l = L(), key = S.view + ':' + l.pos;
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
      var check = S.view === 'check', l = L();
      show('checkTop', check && S.check.started && S.check.pos < S.check.queue.length);
      show('pracTop', !check); show('pracBottom', !check);
      $('viewTog').textContent = check ? 'Practice by section →' : '← ' + CHECK;
      if (check) {
        $('lFill').style.width = (l.queue.length ? 100 * l.pos / l.queue.length : 0) + '%';
        $('lLbl').textContent = 'Question ' + Math.min(l.pos + 1, l.queue.length) + ' of ' + l.queue.length;
      } else drawPractice();
    }

    function drawPractice() {
      var ids = idsIn(''), n = ids.length, ok = 0, miss = 0;
      ids.forEach(function (id) { if (S.res[id] === 'ok') ok++; else if (S.res[id] === 'miss') miss++; });
      $('pN').textContent = n; $('pOk').textContent = ok;
      $('pFill').style.width = (n ? 100 * ok / n : 0) + '%';
      $('pMiss').style.width = (n ? 100 * miss / n : 0) + '%';
      $('pMissTxt').textContent = miss ? miss + ' to redo' : (ok === n && n ? 'All mastered' : (n - ok) + ' to go');
      [].forEach.call($('modes').children, function (b) { b.classList.toggle('on', b.dataset.mode === S.mode); });
      $('shuffle').classList.toggle('on', S.shuffle);

      var box = $('secs');
      box.classList.toggle('hide', !!S.hideSecs); $('secTog').textContent = S.hideSecs ? 'Show' : 'Hide';
      box.innerHTML = '';
      SECS.forEach(function (s) {
        var ids = idsIn(s.code); if (!ids.length) return;
        var ok = ids.filter(function (i) { return S.res[i] === 'ok'; }).length, miss = ids.filter(function (i) { return S.res[i] === 'miss'; }).length;
        var b = document.createElement('button');
        b.className = (S.topic === s.code ? 'on' : '') + (ok === ids.length ? ' all-ok' : '');
        b.innerHTML = '<span class="nm"><b>' + esc(s.code) + '</b>' + esc(s.name) + '</span><span class="bar"><i class="g" style="width:' + 100 * ok / ids.length +
          '%"></i><i class="r" style="width:' + 100 * miss / ids.length + '%"></i></span><span class="ct">' + ok + '/' + ids.length + '</span>';
        b.onclick = function () { S.topic = S.topic === s.code ? '' : s.code; buildPractice(); draw(); };
        box.appendChild(b);
      });

      var map = $('map'), l = S.practice; map.innerHTML = '';
      l.queue.forEach(function (id, i) {
        var b = document.createElement('button');
        b.textContent = i + 1;
        b.className = (S.res[id] || '') + (i === l.pos ? ' cur' : '');
        b.title = byId[id].sec + ' ' + secName(byId[id].sec);
        b.onclick = function () { l.pos = i; go(); draw(); };
        map.appendChild(b);
      });
    }

    function draw() {
      drawChrome();
      var card = $('card'), l = L();
      var onQuestion = !(S.view === 'check' && !S.check.started) && l.pos < l.queue.length;
      show('hint', onQuestion);
      if (S.view === 'check' && !S.check.started) return drawStart(card);
      if (l.pos >= l.queue.length) return S.view === 'check' ? drawResults(card) : drawDone(card);

      var q = current(), prev = S.res[q.id];
      card.innerHTML = '';
      var meta = document.createElement('div'); meta.className = 'meta';
      var left = document.createElement('span');
      left.textContent = (S.view === 'practice' ? (l.pos + 1) + ' of ' + l.queue.length + ' · ' : '') + q.sec + ' ' + secName(q.sec);
      meta.appendChild(left);
      var pills = document.createElement('span'); pills.className = 'pills';
      if (q.template && S.view === 'practice') pills.innerHTML += '<span class="pill new">new numbers</span>';
      if (prev && S.view === 'practice') pills.innerHTML += '<span class="pill ' + prev + '">' + (prev === 'ok' ? 'got it last time' : 'missed last time') + '</span>';
      meta.appendChild(pills);
      card.appendChild(meta);

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
      nav.innerHTML = '<button id="back">← Back</button>' + (q.template && S.view === 'practice' ? '<button id="again1" class="hide">↻ New numbers</button>' : '') +
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
      var l = L();
      if (answered || l.pos >= l.queue.length || (S.view === 'check' && !S.check.started)) return;
      var q = current();
      if (!q.choices[LET.indexOf(Ltr)]) return;
      answered = Ltr;
      S.res[q.id] = Ltr === q.key ? 'ok' : 'miss';
      l.round[q.id] = S.res[q.id];
      record(q, Ltr === q.key);
      save(); if (S.view === 'practice') drawPractice(); reveal(q, Ltr);
    }
    function next() {
      var l = L();
      if (S.view === 'check' && !S.check.started) return;
      if (l.pos >= l.queue.length) return;
      l.pos++; go(); draw(); window.scrollTo(0, 0);
      if (S.view === 'check' && l.pos === l.queue.length) {
        var st = readiness();
        ping('check-done', { score: st.right + '/' + l.queue.length, ready: st.ready + '/' + st.rows.length });
      }
    }
    function back() { var l = L(); if (l.pos > 0) { l.pos--; go(); draw(); } }

    function drawStart(card) {
      var ok = Q.filter(function (q) { return S.res[q.id] === 'ok'; }).length;
      card.innerHTML = '<div class="start"><h2>' + esc(CHECK) + '</h2>' +
        '<p>' + CHECK_N + ' questions, one from each section below. You’ll see which sections you’re ready for and which to review. ' +
        'Most questions take a minute or two.</p>' +
        '<div class="covers">' + SECS.map(function (s) { return '<b>' + esc(s.code) + '</b><span>' + esc(s.name) + '</span>'; }).join('') + '</div>' +
        '<button class="go" id="startBtn">Begin</button>' +
        '<p class="alt"><button class="link" id="toPrac">Or practice all ' + Q.length + ' questions by section</button></p>' +
        (ok ? '<p class="small">' + ok + ' of ' + Q.length + ' questions mastered so far on this device.</p>' : '') + '</div>';
      $('startBtn').onclick = function () { buildCheck(); draw(); };
      $('toPrac').onclick = function () { setView('practice'); };
    }

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
        : 'You’re ready for ' + st.ready + ' of ' + st.rows.length + ' sections. Practice the ' + (todo === 1 ? 'one' : todo) + ' marked Review.';
      card.innerHTML = '<div class="results"><h2>Your results</h2><p>' + line + '</p><div class="ready">' +
        st.rows.map(function (x) {
          return '<div class="row ' + (x.ok ? 'ok' : 'miss') + '"><b>' + esc(x.code) + '</b><span>' + esc(x.name) + '</span>' +
            '<span class="st">' + (x.ok ? 'Ready' : '<button data-sec="' + esc(x.code) + '">Review →</button>') + '</span></div>';
        }).join('') + '</div>' +
        sendBox(st) +
        '<div class="nav col">' + (todo ? '<button class="primary" id="toPrac2">Practice by section</button>' : '') +
        '<button id="again"' + (todo ? '' : ' class="primary"') + '>Take another check</button></div>' +
        '<p class="small">Another check picks different questions, favoring the ones you missed.</p></div>';
      [].forEach.call(card.querySelectorAll('[data-sec]'), function (b) {
        b.onclick = function () { S.topic = b.dataset.sec; S.mode = 'missed'; S.view = 'practice'; buildPractice(); draw(); window.scrollTo(0, 0); };
      });
      if ($('toPrac2')) $('toPrac2').onclick = function () { S.mode = 'missed'; S.topic = ''; S.view = 'practice'; buildPractice(); draw(); window.scrollTo(0, 0); };
      $('again').onclick = function () { buildCheck(); draw(); };
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
      var all = idsIn(S.topic), ok = all.filter(function (id) { return S.res[id] === 'ok'; }).length, miss = all.filter(function (id) { return S.res[id] === 'miss'; }).length;
      card.innerHTML = '<div class="done"><div class="sub">End of the list</div>' +
        '<div class="big">' + right + ' / ' + ids.length + '</div>' +
        '<p>right on the first try this round.<br>' + ok + ' of ' + all.length + ' mastered' + (S.topic ? ' in ' + esc(S.topic) : ' overall') + '.</p>' +
        '<div class="nav">' + (miss ? '<button class="primary" id="again">Redo the ' + miss + ' missed</button>' : '') +
        '<button id="restart"' + (miss ? '' : ' class="primary"') + '>Go through all again</button></div></div>';
      if (miss) $('again').onclick = function () { S.mode = 'missed'; buildPractice(); S.practice.queue = S.practice.queue.slice(0, miss); save(); draw(); };
      $('restart').onclick = function () { buildPractice(); draw(); };
    }

    function setView(v) {
      S.view = v;
      if (v === 'practice' && !S.practice.queue.length) buildPractice(); else go();
      draw(); window.scrollTo(0, 0);
    }

    // ---------- controls ----------
    $('viewTog').onclick = function () { setView(S.view === 'check' ? 'practice' : 'check'); };
    [].forEach.call($('modes').children, function (b) { b.onclick = function () { S.mode = b.dataset.mode; buildPractice(); draw(); }; });
    $('shuffle').onclick = function () { S.shuffle = !S.shuffle; buildPractice(); draw(); };
    $('secTog').onclick = function () { S.hideSecs = !S.hideSecs; save(); drawPractice(); };
    $('reset').onclick = function () {
      if (!$('reset').dataset.sure) { $('reset').dataset.sure = 1; $('reset').textContent = 'Tap again to erase progress'; return; }
      S.res = {}; S.check = { queue: [], pos: 0, round: {}, started: false }; buildPractice(); draw();
      delete $('reset').dataset.sure; $('reset').textContent = 'Reset my progress';
    };
    document.addEventListener('keydown', function (e) {
      if (e.metaKey || e.ctrlKey || e.altKey || /^(SELECT|SUMMARY|INPUT)$/.test(e.target.tagName)) return;
      var k = e.key.toUpperCase();
      if (k.length === 1 && LET.indexOf(k) >= 0) pick(k);
      else if (e.key === 'Enter' || e.key === 'ArrowRight') { if (e.target.tagName !== 'BUTTON') next(); }
      else if (e.key === 'ArrowLeft') back();
    });

    S = load();
    if (S.practice.queue.length && S.practice.queue.length !== idsIn(S.topic).length) S.practice = { queue: [], pos: 0, round: {} };
    if (!S.practice.queue.length) { var v = S.view; buildPractice(); S.view = v; }
    save(); draw();
    ping('open');
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  window.ReviewApp = { start: start };
})();
