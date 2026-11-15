/* 共用計數工具（閱覽人數、分享次數都用）：免費的 Abacus（abacus.jasoncameron.dev，不用帳號），只送頁面名稱，不送個人資料。
   不在 github.io 上（本機測試）時記到 -dev。 */
(function () {
  const NS = /github\.io$/.test(location.hostname) ? 'xiaoduoer-science' : 'xiaoduoer-science-dev';
  const file = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
  const c = new URLSearchParams(location.search).get('c');
  const key = ((file === 'index' ? 'home' : file) + (c ? '-' + c : '')).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 50);
  // 還沒有人按過的計數器會回 404，當成 0
  const api = (op, k) => !window.fetch ? Promise.resolve(null) : fetch(`https://abacus.jasoncameron.dev/${op}/${NS}/${k}`)
    .then(r => r.ok ? r.json() : r.status === 404 ? { value: 0 } : null)
    .then(j => j && typeof j.value === 'number' ? j.value : null).catch(() => null);
  window.XD_COUNT = { NS, key, api };
})();

/* 頁尾的閱覽人數也在這支檔案（最下面 views）。
   每一頁共用的分享列：在頁面最上面（header 下方）放 <div data-share data-compact></div>，再載入這支檔案就會出現
   「分享這一頁 / LINE / 複製連結」三顆按鈕。分享的是目前這一頁的網址和標題。 */
(function () {
  const css = `
  .share-bar { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 48px; }
  .share-bar .share-hint { margin: 0; color: #6d6782; font-weight: 700; font-size: .95rem; }
  .share-bar .share-row { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }
  .share-btn {
    font: inherit; font-weight: 900; font-size: 1.02rem; cursor: pointer; text-decoration: none;
    display: inline-flex; align-items: center; gap: 6px;
    color: #2b2540; background: #fff; border: 2.5px solid #2b2540; border-radius: 999px;
    padding: 9px 22px; box-shadow: 4px 4px 0 #2b2540; transition: transform .12s, box-shadow .12s;
  }
  .share-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px 0 #2b2540; }
  .share-btn:active { transform: translate(2px, 2px); box-shadow: 1px 1px 0 #2b2540; }
  .share-btn:focus-visible { outline: 3px solid #ff7eb6; outline-offset: 3px; }
  .share-btn.line { background: #5fc663; color: #fff; }
  .share-count { font-size: .88rem; font-weight: 700; color: #6d6782; white-space: nowrap; }
  .share-count b { color: #d6337a; font-variant-numeric: tabular-nums; }
  footer .shares { margin-top: 4px; font-size: .88rem; color: #6d6782; }
  footer .shares b { color: #2b2540; font-variant-numeric: tabular-nums; }
  /* 放在頁面最上面的精簡版：提示文字和按鈕排同一行 */
  .share-bar.compact { flex-direction: row; flex-wrap: wrap; justify-content: center; gap: 8px 14px; margin-top: 16px; }
  .share-bar.compact .share-hint { font-size: .9rem; }
  .share-bar.compact .share-row { gap: 10px; }
  .share-bar.compact .share-btn { font-size: .92rem; padding: 6px 16px; box-shadow: 3px 3px 0 #2b2540; }
  @media (max-width: 560px) { .share-bar.compact .share-hint { width: 100%; text-align: center; } }
  .share-toast {
    position: fixed; left: 50%; bottom: max(24px, env(safe-area-inset-bottom, 0px)); z-index: 50;
    transform: translate(-50%, 20px); opacity: 0; pointer-events: none;
    background: #2b2540; color: #fff; font-weight: 700; padding: 10px 20px; border-radius: 999px;
    transition: opacity .2s, transform .2s;
  }
  .share-toast.show { opacity: 1; transform: translate(-50%, 0); }
  @media (prefers-reduced-motion: reduce) { .share-btn, .share-toast { transition: none; } }
  footer .views { margin-top: 8px; font-size: .88rem; color: #6d6782; }
  .rot-hint { display: none; }
  @media (orientation: portrait) and (max-width: 600px) {
    .rot-hint { display: flex; align-items: center; gap: 6px; width: fit-content; margin: 0 0 6px auto; font: inherit; font-size: .8rem; font-weight: 700;
      color: #6d6782; background: #fff; border: 2px dashed #c9c3d6; border-radius: 999px; padding: 2px 10px; cursor: pointer; }
    .rot-hint[hidden] { display: none; }
    .rot-hint .ph { display: inline-block; animation: rot-ph 2.4s ease-in-out infinite; }
  }
  @keyframes rot-ph { 0%, 30% { transform: rotate(0); } 50%, 80% { transform: rotate(-90deg); } 100% { transform: rotate(0); } }
  @media (prefers-reduced-motion: reduce) { .rot-hint .ph { animation: none; } }
  footer .views b { color: #2b2540; font-variant-numeric: tabular-nums; }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const toast = document.createElement('div'); toast.className = 'share-toast'; toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  let timer;
  function say(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

  /* 分享次數：分享這一頁 / LINE / 複製連結 各記一個計數器，再加全站合計。
     同一個分頁、同一種按鈕只算一次（免得連按灌數字）。上課連線面板的「LINE 傳給學生」「複製連結」也會呼叫 XD_SHARE。 */
  const C = window.XD_COUNT, KINDS = { share: '分享這一頁', line: 'LINE', copy: '複製連結' };
  const counts = { share: null, line: null, copy: null, site: null };
  const kk = k => `sh-${k}-${C.key}`;
  function show() {
    const page = ['share', 'line', 'copy'].reduce((a, k) => a + (counts[k] || 0), 0);
    document.querySelectorAll('.share-count').forEach(e => { e.hidden = false; e.querySelector('b').textContent = page.toLocaleString('zh-TW'); });
    const f = document.querySelector('footer'); if (!f) return;
    let el = f.querySelector('.shares'); if (!el) { el = document.createElement('div'); el.className = 'shares'; f.appendChild(el); }
    const n = v => v == null ? '—' : v.toLocaleString('zh-TW');
    el.innerHTML = `📣 這一頁被分享：${Object.keys(KINDS).map(k => `${KINDS[k]} <b>${n(counts[k])}</b> 次`).join('、')}　·　全站分享共 <b>${n(counts.site)}</b> 次`;
  }
  function tally(kind) {
    if (!KINDS[kind]) return;
    try { const t = 'sh:' + kind + ':' + C.key; if (sessionStorage.getItem(t)) return; sessionStorage.setItem(t, '1'); } catch (e) {}
    counts[kind] = (counts[kind] || 0) + 1; counts.site = (counts.site || 0) + 1; show();
    C.api('hit', kk(kind)).then(v => { if (v != null) { counts[kind] = v; show(); } });
    C.api('hit', 'sh-site').then(v => { if (v != null) { counts.site = v; show(); } });
  }
  window.XD_SHARE = tally;
  Promise.all(['share', 'line', 'copy'].map(k => C.api('get', kk(k))).concat(C.api('get', 'sh-site'))).then(([a, b, c2, d]) => {
    if (a == null && b == null && c2 == null && d == null) return;
    if (counts.share == null) counts.share = a; if (counts.line == null) counts.line = b; if (counts.copy == null) counts.copy = c2; if (counts.site == null) counts.site = d;
    show();
  });

  const url = () => location.href.split('#')[0];
  const title = () => document.title;

  async function copy() {
    try { await navigator.clipboard.writeText(url()); say('連結已複製，可以貼給別人囉！'); }
    catch (e) {
      // 舊瀏覽器：用隱藏的輸入框複製
      const t = document.createElement('textarea'); t.value = url(); t.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(t); t.select();
      let ok = false; try { ok = document.execCommand('copy'); } catch (e2) {}
      t.remove();
      say(ok ? '連結已複製，可以貼給別人囉！' : '請長按網址列複製連結');
    }
  }

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: title(), text: title(), url: url() }); }
      catch (e) { if (e && e.name !== 'AbortError') copy(); }
    } else {
      copy();
    }
  }

  document.querySelectorAll('[data-share]').forEach(box => {
    box.classList.add('share-bar');
    if (box.hasAttribute('data-compact')) box.classList.add('compact');
    box.innerHTML = `
      <p class="share-hint">${box.dataset.share || '📣 覺得好用？分享給同學一起學！'}</p>
      <div class="share-row">
        <button type="button" class="share-btn" data-act="share">分享這一頁</button>
        <a class="share-btn line" target="_blank" rel="noopener">LINE</a>
        <button type="button" class="share-btn" data-act="copy">複製連結</button>
      </div>
      <span class="share-count" hidden>📣 已分享 <b>0</b> 次</span>`;
    box.querySelector('.line').href =
      'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url()) + '&text=' + encodeURIComponent(title());
    box.querySelector('[data-act="share"]').addEventListener('click', () => { tally('share'); share(); });
    box.querySelector('[data-act="copy"]').addEventListener('click', () => { tally('copy'); copy(); });
    box.querySelector('.line').addEventListener('click', () => tally('line'));
  });
})();

/* 閱覽人數：每一頁最底下顯示「這一頁閱覽 N 次 · 全站累計 M 次」。
   計數用免費的 Abacus（abacus.jasoncameron.dev，不用帳號），只送頁面名稱，不送任何個人資料。
   同一個瀏覽器分頁重新整理不重複算（sessionStorage）。不在 github.io 上（本機測試）時記到 -dev 計數器。 */
(function () {
  const foot = document.querySelector('footer'); if (!foot || !window.fetch) return;
  const el = document.createElement('div'); el.className = 'views'; el.textContent = '👀 閱覽人數讀取中…'; foot.appendChild(el);
  const NS = window.XD_COUNT.NS, key = window.XD_COUNT.key;
  const first = k => { try { if (sessionStorage.getItem('v:' + k)) return false; sessionStorage.setItem('v:' + k, '1'); } catch (e) {} return true; };
  const count = k => fetch(`https://abacus.jasoncameron.dev/${first(k) ? 'hit' : 'get'}/${NS}/${k}`)
    .then(r => r.ok ? r.json() : null).then(j => j && typeof j.value === 'number' ? j.value : null).catch(() => null);
  Promise.all([count(key), count('site')]).then(([p, s]) => {
    if (p == null && s == null) { el.remove(); return; }
    const f = n => n == null ? '—' : n.toLocaleString('zh-TW');
    el.innerHTML = `👀 這一頁閱覽 <b>${f(p)}</b> 次　·　全站累計 <b>${f(s)}</b> 次`;
  });
})();

/* 手機直拿提示：動畫、太寬的表格、白板上方放一顆「📱 打橫看更清楚」。
   只在手機直拿時顯示（CSS 控制）；表格塞得下就不顯示。按一下說明怎麼轉。章節頁內容是後來才產生的，所以載入後再掃幾次。 */
(function () {
  const SEL = '.wg, #sim, .stage-wrap, .scroll';
  let toastT;
  function tip() {
    const t = document.querySelector('.share-toast'); if (!t) return;
    t.textContent = '把手機轉成橫的就好（iPhone 先到控制中心關掉「直向鎖定」）';
    t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 3200);
  }
  function scan() {
    document.querySelectorAll(SEL).forEach(el => {
      if (el.closest('.wg') && el.classList.contains('scroll')) return;
      let h = el.previousElementSibling && el.previousElementSibling.classList.contains('rot-hint') ? el.previousElementSibling : null;
      if (!h) {
        h = document.createElement('button'); h.type = 'button'; h.className = 'rot-hint';
        h.innerHTML = '<span class="ph">📱</span> 打橫看更清楚'; h.addEventListener('click', tip);
        el.parentNode.insertBefore(h, el);
      }
      if (el.classList.contains('scroll')) h.hidden = el.scrollWidth <= el.clientWidth + 2;   // 表格塞得下就不用提示
    });
  }
  const go = () => { scan(); setTimeout(scan, 1500); setTimeout(scan, 4000); };
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
  window.addEventListener('resize', () => { clearTimeout(scan.t); scan.t = setTimeout(scan, 300); });
})();
