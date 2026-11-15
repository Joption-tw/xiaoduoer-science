/* 翻頁模式：手機上把整頁內容排成「一頁一頁」，每頁剛好一個螢幕高、有完整外框，滑一下就停在下一頁開頭。
   做法：不搬動任何內容（老師同步、畫筆位置都靠原本的結構），只在每一頁第一個東西上面加間距，再在後面畫頁框。
   哪裡換頁：依序擺內容，放不下就換頁；太高的區塊（整節、清單、題目區）會拆成小塊再擺；表格、動畫不拆。
   標題不會被留在上一頁最底下（跟著下一塊一起換頁）。
   開關在分享列旁邊（📖 一頁一頁），記在這台手機（localStorage xd-pg）。手機預設開、電腦預設關。 */
(function () {
  if (window.XD_PAGES) return;
  const css = `
  html.pg { scroll-snap-type: y mandatory; }
  html.pg body { padding-bottom: 0; }
  .pg-frames { position: absolute; left: 0; top: 0; width: 100%; height: 0; z-index: -1; pointer-events: none; }
  .pg-frame { position: absolute; left: max(6px, env(safe-area-inset-left, 0px)); right: max(6px, env(safe-area-inset-right, 0px));
    background: #fff; border: 3px solid #2b2540; border-radius: 20px; scroll-snap-align: start; scroll-snap-stop: always; }
  .pg-frame::after { content: attr(data-n); position: absolute; left: 12px; bottom: 6px; font: 700 .72rem/1 "Noto Sans TC", sans-serif;
    color: #8a84a0; background: #fff; padding: 2px 6px; border-radius: 999px; border: 1.5px solid #e4dcef; }
  /* 翻頁模式時，整節的大框交給頁框，自己不畫框（一節可能跨兩頁） */
  html.pg section.sec { border: 0 !important; box-shadow: none !important; background: transparent !important; padding: 0 !important; margin-left: 0 !important; margin-right: 0 !important; border-radius: 0 !important; }
  html.pg .chapters, html.pg .links, html.pg .tips { grid-template-columns: 1fr !important; }
  .pg-fit { overflow-y: auto !important; overscroll-behavior: contain; }
  .pg-fit thead th { position: sticky; top: 0; z-index: 2; }
  .pg-fit thead th:first-child { z-index: 3; }
  /* 打橫：首頁大封面縮小 */
  @media (orientation: landscape) and (max-height: 540px) {
    html.pg .hero { padding: 14px 20px; grid-template-columns: 1fr; }
    html.pg .hero-art { display: none; }
    html.pg .hero h1 { font-size: 1.9rem; margin: 8px 0; }
    html.pg .hero p { margin-bottom: 10px; }
    html.pg .scroll th, html.pg .scroll td { padding-top: 3px; padding-bottom: 3px; line-height: 1.35; }
  }
  html.pg .wrap { padding-left: max(22px, env(safe-area-inset-left, 0px)) !important; padding-right: max(22px, env(safe-area-inset-right, 0px)) !important; }
  html.pg .scroll th, html.pg .scroll td { padding-top: 6px; padding-bottom: 6px; }
  /* 直拿：讓每一塊都塞得進一頁 */
  @media (orientation: portrait) {
    html.pg .hero-art { display: none; }
    html.pg .hero { padding: 24px 20px; }
    html.pg .wg > .read { max-height: 10em; overflow-y: auto; }
    html.pg .sim .hint, html.pg .sim .tip, html.pg .sim .box-nums { display: none; }
    html.pg .sim .legend { display: flex; gap: 6px; }
    html.pg .sim .legend li { flex: 1; padding: 4px 6px; font-size: .8rem; justify-content: center; }
    html.pg .sim .legend li .txt { display: none; }
    html.pg .sim canvas:not(.xd-ov) { height: clamp(230px, 68vw, 320px) !important; }
  }
  .pg-toggle { font: inherit; font-weight: 900; font-size: .85rem; cursor: pointer; color: #2b2540; background: #fff; border: 2px dashed #2b2540; border-radius: 999px; padding: 4px 12px; }
  .pg-toggle[aria-pressed="true"] { background: #ffd23f; border-style: solid; }
  @media print { .pg-frames { display: none; } }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const KEY = 'xd-pg';
  const pref = () => { try { return localStorage.getItem(KEY); } catch (e) { return null; } };
  const phone = () => matchMedia('(pointer: coarse)').matches || window.innerWidth <= 700;
  let on = pref() ? pref() === 'on' : phone();
  const root = document.querySelector('.wrap'); if (!root) return;
  const frames = document.createElement('div'); frames.className = 'pg-frames'; document.body.appendChild(frames);

  let GAP = 14, PT = 12, PB = 26;            // 頁與頁的間隔、頁框內上下留白（下面留給頁碼）；打橫時會縮小
  const HEAD = 'h2,h3,h4,.sec-h,.sec-head,.rot-hint,p.sub';
  const SPLIT = 'main, section, header, ul, ol, .sum, .quiz, .links, .tips, .boxes, .wrap, nav.toc, .chapters';
  let shifted = [], pages = [], busy = false, quietUntil = 0, lastLeaves = [], fitted = [];

  const docTop = el => el.getBoundingClientRect().top + window.scrollY;
  const docBot = el => el.getBoundingClientRect().bottom + window.scrollY;
  function visible(el) {
    if (el.matches('script, style, .xd-ui, .pg-frames, svg[width="0"]')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.position === 'fixed' || cs.position === 'absolute') return false;
    return el.getBoundingClientRect().height > 0;
  }
  function oneColumn(el) {
    const cs = getComputedStyle(el);
    if (cs.display.includes('grid')) return cs.gridTemplateColumns.trim().split(/\s+/).length === 1;
    if (cs.display.includes('flex')) return cs.flexDirection.startsWith('column') || cs.flexWrap === 'nowrap' && el.children.length < 2;
    return true;
  }
  function collect(el, usable, out) {
    for (const c of el.children) {
      if (!visible(c)) continue;
      const h = c.getBoundingClientRect().height;
      if (h > usable && c.matches(SPLIT) && c.children.length > 1 && oneColumn(c)) collect(c, usable, out);
      else out.push(c);
    }
    return out;
  }
  function setShift(el, px) {
    if (!el.dataset.pgMt) { el.dataset.pgMt = el.style.marginTop || '-'; shifted.push(el); }
    const base = parseFloat(getComputedStyle(el).marginTop) || 0;
    el.style.marginTop = (base + px) + 'px';
  }
  function reset() {
    shifted.forEach(el => { el.style.marginTop = el.dataset.pgMt === '-' ? '' : el.dataset.pgMt; delete el.dataset.pgMt; });
    fitted.forEach(el => { el.classList.remove('pg-fit'); el.style.maxHeight = ''; });
    shifted = []; pages = []; fitted = []; frames.innerHTML = '';
  }
  // 把 el 推到 y（文件座標）的位置；邊界合併可能讓位移打折，所以量一次再補一次
  function pushTo(el, y) {
    for (let i = 0; i < 3; i++) { const d = y - docTop(el); if (Math.abs(d) < 1) break; setShift(el, d); }
  }

  function paginate() {
    if (busy) return; busy = true;
    const keep = pageAt(window.scrollY);
    reset();
    document.documentElement.classList.toggle('pg', on);
    if (!on) { busy = false; quietUntil = performance.now() + 300; return; }
    const H = document.documentElement.clientHeight;
    if (H < 500) { GAP = 8; PT = 6; PB = 26; } else { GAP = 14; PT = 12; PB = 32; }
    const usable = H - GAP - PT - PB;
    const leaves = lastLeaves = collect(root, usable, []);
    // 保險：拆不開又比一頁高的（長表格、大卡片），限高、在頁裡面自己捲動，每一頁就一定剛好一個螢幕
    leaves.forEach(el => { if (el.getBoundingClientRect().height > usable) { el.classList.add('pg-fit'); el.style.maxHeight = usable + 'px'; fitted.push(el); } });
    let cur = { S: 0, n: 0, last: null };
    const close = () => { const E = Math.max(cur.S + H, (cur.last ? docBot(cur.last) : cur.S) + PB + GAP / 2); pages.push({ S: cur.S, E }); return E; };
    for (let i = 0; i < leaves.length; i++) {
      const el = leaves[i];
      if (cur.n && docBot(el) > cur.S + H - GAP / 2 - PB) {
        // 換頁；如果上一塊是標題，帶著它一起到下一頁
        let j = i;
        while (j - 1 > i - cur.n && leaves[j - 1].matches(HEAD)) j--;   // 往回找連在一起的標題、提示
        if (j < i && docBot(el) - docTop(leaves[j]) > usable) j = i;     // 標題加下一塊一頁放不下，就不硬帶（免得那一頁超過螢幕）
        const start = leaves[j];
        if (j < i) cur.last = leaves[j - 1];
        const E = close();
        pushTo(start, E + GAP / 2 + PT);
        cur = { S: E, n: i - j + 1, last: el };
        continue;
      }
      cur.n++; cur.last = el;
    }
    close();
    pages.forEach((p, k) => {
      const f = document.createElement('div'); f.className = 'pg-frame';
      f.style.top = (p.S + GAP / 2) + 'px'; f.style.height = (p.E - p.S - GAP) + 'px'; f.style.scrollMarginTop = (GAP / 2) + 'px';
      f.dataset.n = `${k + 1} / ${pages.length}`; frames.appendChild(f);
    });
    if (keep > 0 && pages[keep]) window.scrollTo(0, pages[keep].S);
    busy = false; quietUntil = performance.now() + 400;
  }
  const pageAt = y => { for (let k = pages.length - 1; k >= 0; k--) if (y >= pages[k].S - 40) return k; return 0; };

  // 內容高度變了（章節是後來才產生、想一想打開、答題）就重排；自己加間距造成的變化不算
  let t = 0, lastW = window.innerWidth, lastH = document.documentElement.clientHeight;
  const later = (ms) => { clearTimeout(t); t = setTimeout(paginate, ms || 350); };
  new ResizeObserver(() => { if (on && performance.now() > quietUntil) later(); }).observe(root);
  window.addEventListener('resize', () => {
    const w = window.innerWidth, h = document.documentElement.clientHeight;
    if (w !== lastW || Math.abs(h - lastH) > 60) { lastW = w; lastH = h; later(250); }   // iPhone 網址列伸縮造成的小變化不重排
  });
  window.addEventListener('load', () => later(100));
  setTimeout(() => later(50), 0); setTimeout(() => later(), 1500);

  // 開關：放在分享列裡
  function addToggle() {
    const bar = document.querySelector('[data-share]'); if (!bar || bar.querySelector('.pg-toggle')) return !!bar;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pg-toggle';
    const sync = () => { b.setAttribute('aria-pressed', on); b.textContent = on ? '📖 一頁一頁：開' : '📜 連續捲動'; };
    b.addEventListener('click', () => { on = !on; try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) {} sync(); paginate(); });
    sync(); bar.appendChild(b); return true;
  }
  if (!addToggle()) { const iv = setInterval(() => { if (addToggle()) clearInterval(iv); }, 300); setTimeout(() => clearInterval(iv), 6000); }

  window.XD_PAGES = { paginate, get pages() { return pages; }, get on() { return on; }, get leaves() { return lastLeaves; } };
})();
