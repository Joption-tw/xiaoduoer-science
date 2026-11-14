/* 在課程頁上直接畫：右下角「🖍️ 在這頁畫」→ 直接在重點、動畫上面畫圈、畫箭頭。
   筆跡黏在畫的那個東西上（記「哪個元素 + 相對位置」），所以捲動、換手機寬度都還在差不多的位置。
   連線（live.js）時：對方同步看到筆跡和雷射筆，捲動和換頁也會跟著。筆跡存在這個分頁（sessionStorage），關掉就沒了。
   畫的時候：一根手指畫、兩根手指捲動；滑鼠滾輪照樣捲。要操作動畫時按「收起」。 */
(function () {
  if (window.XD_DRAW) return; window.XD_DRAW = 1;
  const LIVE = window.LIVE;
  const css = `
  /* 透明圖層：頁面自己的 canvas 樣式（白底、邊框、高度）不能套到這裡，不然會整片蓋住內容 */
  canvas.xd-ov { position: fixed !important; inset: 0 !important; left: 0 !important; top: 0 !important; width: 100vw !important; height: 100vh !important;
    min-height: 0 !important; max-width: none !important; margin: 0 !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important;
    background: transparent !important; box-shadow: none !important; outline: 0 !important; display: block !important; order: 0 !important;
    grid-area: auto !important; z-index: 900; pointer-events: none; touch-action: none; }
  canvas.xd-ov.on { pointer-events: auto; cursor: crosshair; }
  .xd-ui { position: fixed; z-index: 1000; font-family: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif; color: #2b2540; }
  .xd-fab { right: max(14px, env(safe-area-inset-right, 0px)); bottom: max(14px, env(safe-area-inset-bottom, 0px)); display: flex; gap: 8px; align-items: center; }
  .xd-b { font: inherit; font-weight: 900; font-size: .95rem; cursor: pointer; color: #2b2540; background: #ffd23f; border: 2.5px solid #2b2540; border-radius: 999px; padding: 8px 16px; box-shadow: 3px 3px 0 #2b2540; display: inline-flex; align-items: center; gap: 6px; }
  .xd-b.w { background: #fff; }
  .xd-b:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #2b2540; }
  .xd-live { font-size: .85rem; padding: 6px 12px; }
  .xd-live .led { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #2b2540; background: #c9c3d6; }
  .xd-live.ok .led { background: #3ccf9e; } .xd-live.wait .led { background: #ffd23f; } .xd-live.bad .led { background: #ff4d6d; }
  .xd-bar { left: 12px; right: 12px; margin: 0 auto; width: fit-content; bottom: max(12px, env(safe-area-inset-bottom, 0px)); display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; align-items: center;
    background: #fff; border: 2.5px solid #2b2540; border-radius: 18px; box-shadow: 4px 4px 0 #2b2540; padding: 8px 10px; }
  .xd-t { font: inherit; font-weight: 700; font-size: .88rem; cursor: pointer; height: 38px; min-width: 38px; padding: 0 9px; border: 2px solid #2b2540; border-radius: 11px; background: #fff; color: #2b2540; display: inline-flex; align-items: center; justify-content: center; gap: 4px; }
  .xd-t[aria-pressed="true"] { background: #ffe0ee; box-shadow: inset 0 0 0 2px #ff7eb6; }
  .xd-sw { width: 30px; min-width: 30px; height: 30px; border-radius: 50%; padding: 0; }
  .xd-sw[aria-pressed="true"] { box-shadow: 0 0 0 3px #fff, 0 0 0 5.5px #2b2540; }
  .xd-sep { width: 2px; height: 26px; background: #e4dcef; }
  .xd-tip { flex-basis: 100%; text-align: center; font-size: .78rem; color: #6d6782; margin-top: -2px; }
  .xd-panel { right: max(14px, env(safe-area-inset-right, 0px)); bottom: calc(max(14px, env(safe-area-inset-bottom, 0px)) + 58px); width: min(340px, calc(100vw - 28px));
    background: #fff; border: 2.5px solid #2b2540; border-radius: 18px; box-shadow: 4px 4px 0 #2b2540; padding: 14px 16px; }
  .xd-panel h4 { margin: 0 0 4px; font-size: 1.05rem; }
  .xd-panel p { margin: 0 0 10px; font-size: .88rem; color: #6d6782; line-height: 1.55; }
  .xd-panel .code { font-weight: 900; font-size: 1.2rem; letter-spacing: .12em; color: #d6337a; }
  .xd-panel .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .xd-panel .row .xd-b { font-size: .88rem; padding: 6px 13px; }
  .xd-in { font: inherit; font-weight: 700; letter-spacing: .1em; width: 9em; padding: 6px 10px; border: 2.5px solid #2b2540; border-radius: 12px; background: #fff; color: #2b2540; }
  .xd-panel .line { background: #5fc663; color: #fff; text-decoration: none; }
  .xd-panel .x { position: absolute; right: 10px; top: 8px; border: 0; background: none; font-size: 1.1rem; cursor: pointer; color: #6d6782; }
  .xd-else { left: 12px; right: 12px; margin: 0 auto; width: fit-content; top: max(10px, env(safe-area-inset-top, 0px)); background: #2b2540; color: #fff; border-radius: 999px; padding: 6px 8px 6px 16px; display: flex; gap: 10px; align-items: center; font-weight: 700; font-size: .9rem; }
  .xd-else span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .xd-else .xd-b { font-size: .85rem; padding: 4px 12px; box-shadow: none; flex: none; }
  .xd-toast { left: 12px; right: 12px; margin: 0 auto; width: fit-content; text-align: center; top: max(56px, env(safe-area-inset-top, 0px)); background: #2b2540; color: #fff; font-weight: 700; padding: 8px 18px; border-radius: 999px; pointer-events: none; opacity: 0; transition: opacity .2s; }
  .xd-toast.show { opacity: 1; }
  .xd-ui[hidden] { display: none !important; }
  @media (max-width: 560px) { .xd-fab .lbl { display: none; } .xd-t .lbl { display: none; } }
  @media print { .xd-ov, .xd-ui { display: none !important; } }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };

  /* ---------- 畫面元件 ---------- */
  const cv = el('canvas', 'xd-ov'); document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const fab = el('div', 'xd-ui xd-fab');
  const liveBtn = el('button', 'xd-b w xd-live', '<span class="led"></span><span class="lt">📡 上課連線</span>'); liveBtn.type = 'button';
  const penBtn = el('button', 'xd-b', '🖍️<span class="lbl"> 在這頁畫</span>'); penBtn.type = 'button';
  fab.append(liveBtn, penBtn); document.body.appendChild(fab);
  const bar = el('div', 'xd-ui xd-bar'); bar.hidden = true; document.body.appendChild(bar);
  const panel = el('div', 'xd-ui xd-panel'); panel.hidden = true; document.body.appendChild(panel);
  const elseBar = el('div', 'xd-ui xd-else'); elseBar.hidden = true; document.body.appendChild(elseBar);
  const toastEl = el('div', 'xd-ui xd-toast'); document.body.appendChild(toastEl);
  let tt; const toast = s => { toastEl.textContent = s; toastEl.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => toastEl.classList.remove('show'), 2200); };

  const COLORS = [['#ff4d6d', '紅'], ['#3a86ff', '藍'], ['#20b07a', '綠'], ['#2b2540', '黑']];
  const TOOLS = [['pen', '✏️', '筆'], ['hl', '🖍️', '螢光筆'], ['laser', '🔴', '雷射筆'], ['eraser', '🧽', '擦掉']];
  let tool = 'pen', color = '#ff4d6d', on = false;
  const tb = (html, title, fn, cls) => { const b = el('button', 'xd-t' + (cls ? ' ' + cls : ''), html); b.type = 'button'; b.title = title; b.addEventListener('click', fn); bar.appendChild(b); return b; };
  const toolBtns = TOOLS.map(([k, i, t]) => { const b = tb(`${i}<span class="lbl">${t}</span>`, t, () => { tool = k; sync(); }); b.dataset.k = k; return b; });
  bar.appendChild(el('span', 'xd-sep'));
  const colorBtns = COLORS.map(([c, t]) => { const b = tb('', t, () => { color = c; if (tool !== 'pen' && tool !== 'hl') tool = 'pen'; sync(); }, 'xd-sw'); b.style.background = c; b.dataset.c = c; b.setAttribute('aria-label', t); return b; });
  bar.appendChild(el('span', 'xd-sep'));
  tb('↶<span class="lbl">復原</span>', '復原', undo);
  tb('🗑️<span class="lbl">全清</span>', '清掉這一頁所有筆跡', () => { if (strokes.length && confirm('要清掉這一頁所有人的筆跡嗎？')) act({ t: 'dclr' }); });
  tb('✖<span class="lbl">收起</span>', '收起畫筆（筆跡會留著）', () => setOn(false));
  const tip = el('div', 'xd-tip', matchMedia('(pointer: coarse)').matches ? '一根手指畫，兩根手指捲動；要操作動畫先按「收起」' : '滑鼠滾輪可以捲動；要操作動畫先按「收起」');
  bar.appendChild(tip);
  function sync() {
    toolBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.k === tool));
    colorBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.c === color && (tool === 'pen' || tool === 'hl')));
  }
  function setOn(v) {
    on = v; cv.classList.toggle('on', v); bar.hidden = !v; fab.hidden = v; if (v) panel.hidden = true; sync();
    cv.style.cursor = tool === 'laser' ? 'pointer' : 'crosshair';
  }
  penBtn.addEventListener('click', () => setOn(true));

  /* ---------- 筆跡黏在元素上 ---------- */
  const BLOCK = 'canvas,svg,img,table,li,p,h1,h2,h3,h4,summary,details,figure,label,section,main,header,footer';
  function target(x, y) {
    const els = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
    for (const e of els) { if (e === cv || (e.closest && e.closest('.xd-ui'))) continue; return (e.closest && e.closest(BLOCK)) || document.body; }
    return document.body;
  }
  function pathOf(e) {
    const p = [];
    while (e && e !== document.body && !e.id) { const par = e.parentElement; if (!par) break; p.unshift(Array.prototype.indexOf.call(par.children, e)); e = par; }
    return { i: e && e !== document.body && e.id ? e.id : '', p };
  }
  function resolve(a) {
    let e = (a && a.i && document.getElementById(a.i)) || document.body;
    if (a && Array.isArray(a.p)) for (const k of a.p) { if (!e.children[k]) break; e = e.children[k]; }
    return e;
  }
  const rectOf = e => { const r = e.getBoundingClientRect(); return r.width ? r : null; };

  /* ---------- 狀態與畫 ---------- */
  const PG = LIVE ? LIVE.pageKey() : location.pathname;
  const SKEY = 'xd-draw:' + PG;
  let strokes = [], byId = Object.create(null), seq = 0;
  const me = LIVE ? LIVE.me : 'me';
  const lasers = Object.create(null);
  const cleanA = a => ({ i: String((a && a.i) || '').slice(0, 60), p: ((a && Array.isArray(a.p) && a.p) || []).slice(0, 40).map(n => Math.max(0, n | 0)) });
  const clean = s => ({ id: String(s.id).slice(0, 40), by: String(s.by).slice(0, 12), hl: !!s.hl, c: String(s.c || '#ff4d6d').slice(0, 9),
    a: cleanA(s.a), pts: Array.isArray(s.pts) ? s.pts.slice(0, 5000) : [], done: !!s.done });
  const strip = s => ({ id: s.id, by: s.by, hl: s.hl, c: s.c, a: s.a, pts: s.pts, done: true });
  let saveT; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => ss.set(SKEY, JSON.stringify(strokes.filter(s => s.done).map(strip))), 500); };
  try { (JSON.parse(ss.get(SKEY) || '[]') || []).forEach(s => { s = clean(s); strokes.push(s); byId[s.id] = s; }); } catch (e) {}

  let dpr = 1, raf = 0;
  function size() { dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); kick(); }
  const kick = () => { if (!raf) raf = requestAnimationFrame(render); };
  const elOf = s => resolve(s.a);   // 每次重找（章節內容是後來才產生的，不能先記住）
  function render() {
    raf = 0; const now = performance.now();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const s of strokes) {
      const r = rectOf(elOf(s)); if (!r || !s.pts.length) continue;
      const X = q => r.left + q[0] * r.width, Y = q => r.top + q[1] * r.width;
      ctx.save(); ctx.strokeStyle = s.c; ctx.lineWidth = s.hl ? 18 : 4; if (s.hl) { ctx.globalAlpha = 0.33; ctx.lineCap = 'butt'; }
      ctx.beginPath(); ctx.moveTo(X(s.pts[0]), Y(s.pts[0]));
      if (s.pts.length === 1) ctx.lineTo(X(s.pts[0]) + 0.1, Y(s.pts[0]));
      for (let i = 1; i < s.pts.length - 1; i++) { const a = s.pts[i], b = s.pts[i + 1]; ctx.quadraticCurveTo(X(a), Y(a), (X(a) + X(b)) / 2, (Y(a) + Y(b)) / 2); }
      if (s.pts.length > 1) { const l = s.pts[s.pts.length - 1]; ctx.lineTo(X(l), Y(l)); }
      ctx.stroke(); ctx.restore();
    }
    let live = false;
    for (const k in lasers) {
      const Lz = lasers[k]; Lz.pts = Lz.pts.filter((q, i, a) => now - q[3] < 650 || (Lz.on && i === a.length - 1));
      if (!Lz.pts.length) { if (!Lz.on) delete lasers[k]; continue; }
      live = true;
      const P = Lz.pts.map(q => { const r = rectOf(resolve(q[0])); return r ? [r.left + q[1] * r.width, r.top + q[2] * r.width, q[3]] : null; }).filter(Boolean);
      for (let i = 1; i < P.length; i++) { const f = 1 - (now - P[i][2]) / 650; ctx.strokeStyle = `rgba(255,40,80,${(f * 0.75).toFixed(3)})`; ctx.lineWidth = 3 + f * 6; ctx.beginPath(); ctx.moveTo(P[i - 1][0], P[i - 1][1]); ctx.lineTo(P[i][0], P[i][1]); ctx.stroke(); }
      const h = P[P.length - 1]; if (h) {
        ctx.fillStyle = 'rgba(255,40,80,.25)'; ctx.beginPath(); ctx.arc(h[0], h[1], 16, 0, 7); ctx.fill();
        ctx.fillStyle = '#ff2850'; ctx.beginPath(); ctx.arc(h[0], h[1], 7, 0, 7); ctx.fill();
      }
    }
    if (live) kick();
  }

  function apply(m) {
    let s;
    switch (m.t) {
      case 'ds': if (!m.s || byId[m.s.id]) break; s = clean(m.s); s.done = false; strokes.push(s); byId[s.id] = s; break;
      case 'dp': s = byId[m.id]; if (s && Array.isArray(m.pts)) for (const q of m.pts) s.pts.push(q); break;
      case 'de': s = byId[m.id]; if (s) { s.done = true; save(); } break;
      case 'dx': (m.ids || []).forEach(id => { if (byId[id]) { strokes = strokes.filter(x => x.id !== id); delete byId[id]; } }); save(); break;
      case 'dclr': strokes = []; byId = Object.create(null); save(); break;
      case 'dinit': strokes = []; byId = Object.create(null); (m.strokes || []).forEach(x => { x = clean(x); x.done = true; strokes.push(x); byId[x.id] = x; }); save(); break;
      case 'l': { const Lz = lasers[m.by] || (lasers[m.by] = { pts: [], on: true }); Lz.on = true; Lz.pts.push([cleanA(m.a), +m.x, +m.y, performance.now()]); break; }
      case 'lo': if (lasers[m.by]) lasers[m.by].on = false; break;
      case 'sc': followScroll(m); break;
    }
    kick();
  }
  const send = m => { if (LIVE) LIVE.send(m); };
  const act = m => { apply(m); send(m); };
  function undo() { for (let i = strokes.length - 1; i >= 0; i--) if (strokes[i].by === me && strokes[i].done) { act({ t: 'dx', ids: [strokes[i].id] }); return; } toast('沒有可以復原的了'); }

  /* ---------- 輸入：一根手指（或滑鼠）畫，兩根手指捲動 ---------- */
  const pts = new Map(); let cur = null, curR = null, pend = [], lastSend = 0, panY = null, laserOn = false, laserSent = 0;
  const avgY = () => { let t = 0; for (const v of pts.values()) t += v[1]; return t / pts.size; };
  const rel = (x, y, r) => [Math.round((x - r.left) / r.width * 10000) / 10000, Math.round((y - r.top) / r.width * 10000) / 10000];
  function laserAt(x, y) {
    const a = pathOf(target(x, y)), r = rectOf(resolve(a)); if (!r) return;
    const [fx, fy] = rel(x, y, r), m = { t: 'l', by: me, a, x: fx, y: fy };
    apply(m); const now = performance.now(); if (now - laserSent > 30) { laserSent = now; send(m); }
  }
  function eraseAt(x, y) {
    const ids = [];
    for (const s of strokes) {
      const r = rectOf(elOf(s)); if (!r) continue;
      if (s.pts.some(q => Math.hypot(r.left + q[0] * r.width - x, r.top + q[1] * r.width - y) < 16)) ids.push(s.id);
    }
    if (ids.length) act({ t: 'dx', ids });
  }
  function flush(force) {
    const now = performance.now(); if (!cur || !pend.length || (!force && now - lastSend < 40)) return;
    lastSend = now; send({ t: 'dp', id: cur.id, pts: pend }); pend = [];
  }
  function cancelStroke() { if (cur) { const id = cur.id; cur = null; pend = []; act({ t: 'dx', ids: [id] }); } if (laserOn) { laserOn = false; act({ t: 'lo', by: me }); } }

  cv.addEventListener('pointerdown', e => {
    if (!on) return; e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size >= 2) { cancelStroke(); panY = avgY(); return; }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const x = e.clientX, y = e.clientY;
    if (tool === 'laser') { laserOn = true; laserAt(x, y); return; }
    if (tool === 'eraser') { eraseAt(x, y); return; }
    const a = pathOf(target(x, y)); curR = rectOf(resolve(a)); if (!curR) return;
    const s = { id: me + '-' + Date.now().toString(36) + (++seq), by: me, hl: tool === 'hl', c: tool === 'hl' && color === '#2b2540' ? '#ffd23f' : color, a, pts: [rel(x, y, curR)] };
    act({ t: 'ds', s }); cur = byId[s.id]; pend = [];
  });
  cv.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (panY != null) { const y = avgY(); window.scrollBy(0, panY - y); panY = y; return; }
    if (laserOn) { laserAt(e.clientX, e.clientY); return; }
    if (tool === 'eraser' && pts.size === 1) { eraseAt(e.clientX, e.clientY); return; }
    if (!cur) return;
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : []; const list = evs.length ? evs : [e];
    for (const ev of list) {
      const q = rel(ev.clientX, ev.clientY, curR), l = cur.pts[cur.pts.length - 1];
      if (Math.hypot((q[0] - l[0]) * curR.width, (q[1] - l[1]) * curR.width) < 1.5) continue;
      cur.pts.push(q); pend.push(q);
    }
    flush(false); kick();
  });
  function up(e) {
    if (!pts.delete(e.pointerId)) return;
    if (panY != null) { if (!pts.size) panY = null; return; }
    if (laserOn) { laserOn = false; act({ t: 'lo', by: me }); return; }
    if (cur) { flush(true); const id = cur.id; cur = null; act({ t: 'de', id }); }
  }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  document.addEventListener('keydown', e => { if (on && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); } if (on && e.key === 'Escape') setOn(false); });

  /* ---------- 老師主控：捲動、按鈕、滑桿、拖拉動畫，學生畫面跟著動 ---------- */
  const isT = () => !!(LIVE && LIVE.teacher && LIVE.state === 'ok' && LIVE.people > 1);
  const fromTeacher = m => !!(LIVE && m.tc && !LIVE.teacher);
  const R4 = v => Math.round(v * 10000) / 10000;
  let quietUntil = 0, scT = 0, scLast = 0;
  function scrollMsg() {
    // 找畫面上方一個「小一點」的元素當基準（大區塊在不同寬度的螢幕上高度差很多）
    const BIG = { MAIN: 1, SECTION: 1, BODY: 1, HEADER: 1, FOOTER: 1, DETAILS: 1 };
    let y = Math.min(90, innerHeight / 3), t = null;
    for (let yy = y; yy < innerHeight * 0.6 && !t; yy += 30) for (const xx of [0.5, 0.3, 0.7]) {
      const c = target(innerWidth * xx, yy); if (!BIG[c.tagName]) { t = c; y = yy; break; }
    }
    if (!t) t = target(innerWidth / 2, y);
    const r = t.getBoundingClientRect();
    return { t: 'sc', a: pathOf(t), f: r.height ? R4((y - r.top) / r.height) : 0, y, top: window.scrollY <= 2 };
  }
  window.addEventListener('scroll', () => {
    kick();
    if (!isT() || performance.now() < quietUntil) return;
    clearTimeout(scT);
    const go = () => { scLast = performance.now(); send(scrollMsg()); };
    if (performance.now() - scLast > 250) go(); else scT = setTimeout(go, 150);
  }, { passive: true });
  setInterval(() => { if (isT()) send(Object.assign(scrollMsg(), { soft: 1 })); }, 2500);   // 晚進來的學生也會跟上
  function followScroll(m) {
    if (!fromTeacher(m)) return;
    let top;
    if (m.top) top = 0;
    else { const t = resolve(cleanA(m.a)), r = t.getBoundingClientRect(); top = window.scrollY + r.top + (+m.f || 0) * r.height - (+m.y || 90); }
    top = Math.max(0, top);
    if (m.soft && Math.abs(top - window.scrollY) < 40) return;
    quietUntil = performance.now() + 700;
    window.scrollTo(0, top);
  }

  // 老師這邊：記下操作送出去
  const skip = t => !t || !t.closest || t === cv || t.closest('.xd-ui, .share-bar');
  const sendVal = (t, ev) => {
    if (!t.matches || !t.matches('input,select,textarea')) return;
    const cb = t.type === 'checkbox' || t.type === 'radio';
    send({ t: 'ui', k: 'v', ev, a: pathOf(t), cb: cb ? 1 : 0, v: cb ? (t.checked ? 1 : 0) : String(t.value).slice(0, 200) });
  };
  document.addEventListener('input', e => { if (isT() && e.isTrusted && !skip(e.target)) sendVal(e.target, 'input'); }, true);
  document.addEventListener('change', e => { if (isT() && e.isTrusted && !skip(e.target)) sendVal(e.target, 'change'); }, true);
  document.addEventListener('click', e => {
    if (!isT() || !e.isTrusted || skip(e.target)) return;
    const b = e.target.closest('button,summary,[role=button],[role=tab]'); if (!b || skip(b)) return;
    send({ t: 'ui', k: 'c', a: pathOf(b) });
  }, true);
  let pdEl = null, pmLast = 0;
  const sendPe = (ty, e) => { const r = pdEl.getBoundingClientRect(); if (r.width) send({ t: 'ui', k: 'p', ty, a: pathOf(pdEl), x: R4((e.clientX - r.left) / r.width), y: R4((e.clientY - r.top) / r.height) }); };
  document.addEventListener('pointerdown', e => {
    if (!isT() || !e.isTrusted || on) return;
    const c = e.target.closest && e.target.closest('canvas'); if (!c || c === cv) return;
    pdEl = c; sendPe('pointerdown', e);
  }, true);
  window.addEventListener('pointermove', e => {
    if (!pdEl || !e.isTrusted) return; const n = performance.now(); if (n - pmLast < 33) return; pmLast = n; sendPe('pointermove', e);
  }, true);
  const pEnd = e => { if (!pdEl || !e.isTrusted) return; sendPe('pointermove', e); sendPe('pointerup', e); pdEl = null; };
  window.addEventListener('pointerup', pEnd, true); window.addEventListener('pointercancel', pEnd, true);

  // 學生這邊：照做一次
  function mirror(m) {
    if (!fromTeacher(m)) return;
    const t = resolve(cleanA(m.a)); if (!t || t === document.body) return;
    if (m.k === 'v') {
      if (!t.matches('input,select,textarea')) return;
      if (m.cb) t.checked = !!m.v; else t.value = String(m.v);
      t.dispatchEvent(new Event(m.ev === 'change' ? 'change' : 'input', { bubbles: true }));
    } else if (m.k === 'c') {
      if (t.matches('button,summary,[role=button],[role=tab]')) t.click();
    } else if (m.k === 'p') {
      if (t.tagName !== 'CANVAS') return;
      const r = t.getBoundingClientRect(), ty = { pointerdown: 1, pointermove: 1, pointerup: 1 }[m.ty] ? m.ty : 'pointermove';
      t.dispatchEvent(new PointerEvent(ty, { bubbles: true, cancelable: true, pointerId: 91, pointerType: 'mouse', isPrimary: true, button: 0, buttons: ty === 'pointerup' ? 0 : 1,
        clientX: r.left + (+m.x || 0) * r.width, clientY: r.top + (+m.y || 0) * r.height }));
    }
  }

  /* ---------- 上課連線面板 ---------- */
  function renderPanel() {
    const code = LIVE.code || LIVE.savedCode, conn = LIVE.state !== 'off', T = LIVE.teacher;
    const link = LIVE.link(code || '000000');
    const st = LIVE.state === 'ok' ? (T ? (LIVE.people > 1 ? `上課中，${LIVE.people - 1} 位學生在線上` : '已開好，等學生打開連結…') : (LIVE.people > 1 ? '已連上老師，畫面會跟著老師動' : '等老師上線…'))
      : LIVE.state === 'bad' ? '網路連不上，自動重試中…' : '連線中…';
    panel.innerHTML = `<button class="x" type="button" aria-label="關閉">✖</button>` + (!conn ? `
      <h4>📡 上課連線</h4>
      <p>老師換頁、捲動、操作動畫，學生的畫面就跟著動；兩邊都可以按 🖍️ 寫字、畫圈。說話可以同時開 LINE 通話。</p>
      <div class="row"><button class="xd-b" type="button" data-a="teach">👩‍🏫 我是老師，開始上課</button></div>
      <p style="margin:14px 0 0"><b style="color:#2b2540">🙋 我是學生</b>：輸入老師給的 6 位數代碼</p>
      <form class="row" data-a="joinf"><input class="xd-in" inputmode="numeric" autocomplete="off" maxlength="7" placeholder="例如 123456" aria-label="老師給的代碼"><button class="xd-b" type="submit">加入</button></form>`
      : T ? `
      <h4>👩‍🏫 你是老師</h4>
      <p>把連結傳給學生。學生打開後，你換頁、捲動、拖動畫，他的畫面都會跟著動。</p>
      <div>上課代碼 <span class="code">${code.slice(0, 3)} ${code.slice(3)}</span></div>
      <div style="font-size:.88rem;color:#6d6782;margin-top:2px">${st}</div>
      <div class="row"><a class="xd-b line" target="_blank" rel="noopener" href="https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}">LINE 傳給學生</a>
        <button class="xd-b w" type="button" data-a="copy">複製連結</button><button class="xd-b w" type="button" data-a="stop">下課</button></div>`
      : `
      <h4>👀 跟著老師上課</h4>
      <p>畫面會跟著老師換頁、捲動。想寫字或畫圈，按右下角 🖍️。</p>
      <div>上課代碼 <span class="code">${code.slice(0, 3)} ${code.slice(3)}</span></div>
      <div style="font-size:.88rem;color:#6d6782;margin-top:2px">${st}</div>
      <div class="row"><button class="xd-b w" type="button" data-a="stop">離開</button></div>`);
    panel.querySelector('.x').onclick = () => { panel.hidden = true; };
    const b = a => panel.querySelector(`[data-a="${a}"]`);
    if (b('teach')) b('teach').onclick = () => { LIVE.start(LIVE.savedCode || LIVE.newCode(), true); };
    if (b('joinf')) b('joinf').onsubmit = e => {
      e.preventDefault(); const v = b('joinf').querySelector('input').value.replace(/\D/g, '');
      if (v.length !== 6) { toast('代碼是 6 個數字'); return; }
      LIVE.start(v, false); toast('連線中，等一下畫面就會跟著老師');
    };
    if (b('stop')) b('stop').onclick = () => { LIVE.stop(); panel.hidden = true; };
    if (b('copy')) b('copy').onclick = async () => {
      try { await navigator.clipboard.writeText(link); toast('連結已複製，貼給學生就可以了'); }
      catch (e) { window.prompt('複製這個連結傳給學生：', link); }
    };
  }
  if (LIVE) {
    liveBtn.addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) renderPanel(); });
    let wasN = 1;
    LIVE.on('status', (stt, n) => {
      liveBtn.classList.remove('ok', 'wait', 'bad'); if (stt !== 'off') liveBtn.classList.add(stt);
      const T = LIVE.teacher;
      liveBtn.querySelector('.lt').textContent = stt === 'off' ? '📡 上課連線'
        : stt === 'ok' ? (T ? (n > 1 ? `👩‍🏫 ${n - 1} 位學生` : '👩‍🏫 等學生…') : (n > 1 ? '👀 跟著老師' : '等老師…')) : '連線中';
      if (stt === 'ok' && n > wasN) toast(T ? '有學生加入了 👋' : '連上老師了 👀 畫面會跟著老師動');
      wasN = stt === 'ok' ? n : 1;
      if (!panel.hidden) renderPanel();
    });
    LIVE.on('msg', m => { if (m.t === 'ui') mirror(m); else apply(m); });
    LIVE.onInit(() => [{ t: 'dinit', strokes: strokes.filter(s => s.done).map(strip) }]);
    LIVE.on('elsewhere', m => {
      if (!LIVE.teacher) return;   // 學生會自動跟過去；老師這邊只提醒
      elseBar.innerHTML = ''; const sp = el('span', '', `📡 有學生在「${String(m.title || '').replace(/[<>&]/g, '').replace(/｜.*/, '')}」`);
      const x = el('button', 'xd-b w', '✖'); x.type = 'button'; x.onclick = () => { elseBar.hidden = true; };
      elseBar.append(sp, x); elseBar.hidden = false; setTimeout(() => { elseBar.hidden = true; }, 5000);
    });
  } else liveBtn.hidden = true;

  window.addEventListener('resize', size);
  if (window.ResizeObserver) new ResizeObserver(kick).observe(document.body);
  size(); sync();
  window.XD_DRAW = { redraw() { raf = 0; render(); }, scrollMsg, follow: followScroll, get strokes() { return strokes; } };   // 測試用
})();
