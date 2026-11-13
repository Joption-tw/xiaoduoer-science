/* 每一頁共用的分享列：在頁面放 <div data-share></div>，再載入這支檔案就會出現
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
  .share-toast {
    position: fixed; left: 50%; bottom: max(24px, env(safe-area-inset-bottom, 0px)); z-index: 50;
    transform: translate(-50%, 20px); opacity: 0; pointer-events: none;
    background: #2b2540; color: #fff; font-weight: 700; padding: 10px 20px; border-radius: 999px;
    transition: opacity .2s, transform .2s;
  }
  .share-toast.show { opacity: 1; transform: translate(-50%, 0); }
  @media (prefers-reduced-motion: reduce) { .share-btn, .share-toast { transition: none; } }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const toast = document.createElement('div'); toast.className = 'share-toast'; toast.setAttribute('role', 'status');
  document.body.appendChild(toast);
  let timer;
  function say(msg) {
    toast.textContent = msg; toast.classList.add('show');
    clearTimeout(timer); timer = setTimeout(() => toast.classList.remove('show'), 2000);
  }

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
    box.innerHTML = `
      <p class="share-hint">${box.dataset.share || '覺得好用？分享給同學一起學！'}</p>
      <div class="share-row">
        <button type="button" class="share-btn" data-act="share">分享這一頁</button>
        <a class="share-btn line" target="_blank" rel="noopener">LINE</a>
        <button type="button" class="share-btn" data-act="copy">複製連結</button>
      </div>`;
    box.querySelector('.line').href =
      'https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url()) + '&text=' + encodeURIComponent(title());
    box.querySelector('[data-act="share"]').addEventListener('click', share);
    box.querySelector('[data-act="copy"]').addEventListener('click', copy);
  });
})();
