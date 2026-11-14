/* 上課連線（白板、在課程頁上畫都用這支）。
   同一個「教室代碼」的裝置連在一起：PeerJS 免費配對伺服器只負責牽線，之後裝置之間直接傳，不經過資料庫。
   誰先到誰當中繼（拿到 xdeb-room-代碼 這個名字），其他人連它，中繼再轉給大家；中繼離開，剩下的人自動有人接手。
   代碼記在這台裝置（localStorage xde-room），所以每次開都是同一個教室。
   連線中點站內連結會帶著對方一起換頁（nav），換頁後自動接回來（sessionStorage xde-live）。
   網址帶 ?room=代碼 就會自動加入（課程頁加入後把 room 從網址拿掉，免得分享到 FB 時把陌生人帶進教室）。

   用法：LIVE.on('msg', m => …)  收這一頁的訊息（m.pg 不是這一頁的會自動略過）
         LIVE.on('status', (狀態, 人數) => …)   狀態：off / wait / ok / bad
         LIVE.on('elsewhere', info => …)        對方在別頁（info.url、info.title）
         LIVE.onInit(() => [訊息…])              有人連進來時，中繼要先傳給他的東西（這一頁目前的內容）
         LIVE.send(m)  LIVE.start(代碼)  LIVE.stop()  LIVE.code  LIVE.people  LIVE.newCode() */
(function () {
  if (window.LIVE) return;
  const PREFIX = 'xdeb-room-';
  const PEERJS = 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js';
  const mk = s => ({ get(k) { try { return s().getItem(k); } catch (e) { return null; } }, set(k, v) { try { s().setItem(k, v); } catch (e) {} } });
  const ls = mk(() => localStorage), ss = mk(() => sessionStorage);
  let me = ss.get('xde-me'); if (!me) { me = Math.random().toString(36).slice(2, 8); ss.set('xde-me', me); }

  const pageKey = () => {
    const u = new URL(location.href); u.searchParams.delete('room'); u.searchParams.delete('v'); u.hash = '';
    return (u.pathname.split('/').pop() || 'index.html') + u.search;
  };
  const GLOBAL = { n: 1, here: 1, nav: 1 };
  const L = { msg: [], status: [], elsewhere: [] }, inits = [];
  const emit = (k, ...a) => L[k].forEach(f => { try { f(...a); } catch (e) { console.error(e); } });

  let peer = null, conns = new Set(), hostConn = null, role = '', gen = 0, active = false;
  const S = { code: '', people: 1, state: 'off', why: '', fails: 0, teacher: ss.get('xde-teach') === '1' };   // why：連不上的原因（net 網路、p2p 兩台直連失敗）   // teacher：老師主控畫面，學生跟著
  const setState = (st, why) => { S.state = st; S.why = st === 'bad' ? (why || 'net') : ''; emit('status', st, S.people); };
  const PeerC = () => window.Peer || (window.peerjs && window.peerjs.Peer);
  const OPTS = { debug: 0, config: { iceServers: [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
    { urls: ['stun:stun.cloudflare.com:3478'] },
    { urls: ['stun:stun.miwifi.com:3478', 'stun:stun.chat.bilibili.com:3478'] },
    { urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'], username: 'peerjs', credential: 'peerjsp' },
  ] } };
  function loadPeer(cb) {
    if (PeerC()) return cb();
    const s = document.createElement('script'); s.src = PEERJS; s.onload = cb; s.onerror = () => setState('bad');
    document.head.appendChild(s);
  }
  const ok = m => m && typeof m === 'object' && typeof m.t === 'string';
  const here = () => { const u = new URL(location.href); u.searchParams.delete('room'); return { t: 'here', url: (u.pathname.split('/').pop() || 'index.html') + u.search, title: document.title, pg: pageKey(), by: me, tc: S.teacher ? 1 : 0 }; };
  const go = url => { let u; try { u = new URL(url, location.href); } catch (e) { return; } if (u.origin !== location.origin) return; ss.set('xde-live', S.code); location.href = u.href; };

  function deliver(m) {
    if (m.t === 'n') { S.people = +m.n || 1; setState('ok'); return; }
    if (m.t === 'here') {                                   // 學生：老師在別頁就自動跟過去
      if (m.pg !== pageKey()) { if (m.tc && !S.teacher) go(m.url); else emit('elsewhere', m); }
      return;
    }
    if (m.t === 'nav') { if (m.tc && !S.teacher) go(m.url); return; }   // 只跟老師換頁
    if (m.pg && m.pg !== pageKey()) return;
    emit('msg', m);
  }
  function count() {
    S.people = 1 + [...conns].filter(c => c.open).length;
    for (const c of conns) if (c.open) try { c.send({ t: 'n', n: S.people }); } catch (e) {}
    setState('ok');
  }
  function destroy() { gen++; try { peer && peer.destroy(); } catch (e) {} peer = null; conns = new Set(); hostConn = null; role = ''; }

  function claim() {                       // 先試著當中繼
    if (!active) return; destroy(); const g = gen;
    if (S.state !== 'ok') setState('wait');
    const p = peer = new (PeerC())(PREFIX + S.code, OPTS);
    p.on('open', () => { if (g !== gen) return; role = 'host'; S.fails = 0; S.people = 1; count(); });
    p.on('connection', c => {
      c.on('open', () => {
        if (g !== gen) return; conns.add(c);
        try { c.send(here()); inits.forEach(f => (f() || []).forEach(m => c.send(Object.assign({ pg: pageKey() }, m)))); } catch (e) {}
        count();
      });
      c.on('data', m => {
        if (g !== gen || !ok(m)) return;
        deliver(m);
        for (const o of conns) if (o !== c && o.open) try { o.send(m); } catch (e) {}   // 轉給其他人
      });
      const bye = () => { if (conns.delete(c)) count(); };
      c.on('close', bye); c.on('error', bye);
    });
    p.on('disconnected', () => { if (g === gen) setTimeout(() => { if (g === gen) try { p.reconnect(); } catch (e) {} }, 1500); });
    p.on('error', err => {
      if (g !== gen) return;
      if (err.type === 'unavailable-id') join();            // 已經有人當中繼了 → 連過去
      else if (/network|server-error|socket-error|socket-closed/.test(err.type)) { setState('bad'); setTimeout(() => { if (g === gen) claim(); }, 4000); }
    });
  }
  function join() {
    destroy(); const g = gen;
    const p = peer = new (PeerC())(OPTS);
    const again = ms => setTimeout(() => { if (g === gen) claim(); }, ms);
    p.on('open', () => {
      if (g !== gen) return;
      const c = hostConn = p.connect(PREFIX + S.code, { reliable: true });
      // 找到對方了，但兩台之間 12 秒還打不通（網路不同、VPN、防火牆）→ 告訴使用者原因，再重試
      const tm = setTimeout(() => {
        if (g !== gen || c.open) return;
        S.fails++; setState('bad', 'p2p'); again(2500);
      }, 12000);
      c.on('open', () => { clearTimeout(tm); if (g !== gen) return; role = 'guest'; S.fails = 0; try { c.send(here()); } catch (e) {} setState('ok'); });
      c.on('data', m => { if (g === gen && ok(m)) deliver(m); });
      c.on('close', () => { if (g !== gen) return; hostConn = null; S.people = 1; setState('wait'); again(300 + Math.random() * 1200); });
    });
    p.on('error', err => {
      if (g !== gen) return;
      if (err.type === 'peer-unavailable') again(600 + Math.random() * 900);   // 中繼剛離開 → 換自己試試
      else if (/network|server-error|socket-error|socket-closed/.test(err.type)) { setState('bad'); again(4000); }
    });
  }

  const LIVE = window.LIVE = {
    me, pageKey,
    get code() { return S.code; }, get people() { return S.people; }, get state() { return S.state; }, get role() { return role; }, get why() { return S.why; }, get fails() { return S.fails; },
    get savedCode() { return ls.get('xde-room') || ''; },
    get teacher() { return S.teacher; },
    on(k, f) { L[k].push(f); if (k === 'status') f(S.state, S.people); },
    onInit(f) { inits.push(f); },
    newCode() { return String(100000 + Math.floor(Math.random() * 900000)); },
    start(code, asTeacher) {          // asTeacher：true 老師、false 學生、不給就照這個分頁原本的身分
      code = String(code || '').replace(/\D/g, '').slice(0, 6); if (code.length !== 6) return;
      if (asTeacher !== undefined) { S.teacher = !!asTeacher; ss.set('xde-teach', S.teacher ? '1' : ''); }
      if (active && code === S.code) { setState(S.state); if (role === 'host') count(); else if (hostConn && hostConn.open) try { hostConn.send(here()); } catch (e) {} return; }
      S.code = code; active = true; ls.set('xde-room', code); ss.set('xde-live', code);
      loadPeer(claim);
    },
    stop() { active = false; S.teacher = false; ss.set('xde-teach', ''); ss.set('xde-live', ''); destroy(); S.people = 1; setState('off'); },
    send(m) {
      if (!active) return; m = Object.assign({ pg: pageKey(), tc: S.teacher ? 1 : 0 }, m);
      if (role === 'host') { for (const c of conns) if (c.open) try { c.send(m); } catch (e) {} }
      else if (hostConn && hostConn.open) try { hostConn.send(m); } catch (e) {}
    },
    link(code) {     // 帶教室代碼的這一頁網址（傳給對方用）
      const u = new URL(location.href); u.searchParams.delete('v'); u.searchParams.set('room', code || S.code); u.hash = ''; return u.href;
    },
  };

  // 老師點站內連結：帶學生一起換頁
  document.addEventListener('click', e => {
    if (!active || !S.teacher || role === '' || S.people < 2 || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || (a.target && a.target !== '_self')) return;
    let u; try { u = new URL(a.href, location.href); } catch (err) { return; }
    if (u.origin !== location.origin || (u.pathname === location.pathname && u.search === location.search)) return;
    e.preventDefault(); LIVE.send({ t: 'nav', url: (u.pathname.split('/').pop() || 'index.html') + u.search + u.hash });   // 只傳檔名，對方用自己的網址組回去
    setTimeout(() => { location.href = u.href; }, 160);
  }, true);
  // 老師每 4 秒報一次自己在哪一頁：學生自己跑去別頁會被帶回來，晚進來的也會跟上
  setInterval(() => { if (active && S.teacher && S.people > 1) LIVE.send(here()); }, 4000);
  window.addEventListener('pagehide', () => { try { peer && peer.destroy(); } catch (e) {} });

  // 自動加入：網址帶 ?room=，或這個分頁剛剛在連線中換頁過來
  setTimeout(() => {
    if (window.LIVE_MANUAL) return;
    const q = (new URLSearchParams(location.search).get('room') || '').replace(/\D/g, '');
    if (q.length === 6) {
      const u = new URL(location.href); u.searchParams.delete('room'); history.replaceState(null, '', u.pathname + u.search + u.hash);
      LIVE.start(q, false);   // 點老師給的連結進來的是學生
    } else if (ss.get('xde-live')) LIVE.start(ss.get('xde-live'));
  }, 0);
})();
