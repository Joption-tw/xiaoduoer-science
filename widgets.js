/* 章節頁的互動動畫元件（八上）。在資料檔某一節寫 w: 'wave'，章節頁就會放這個動畫。
   共用：setup() 建畫布＋控制列＋讀數；animate() 只在畫布出現在畫面上時才跑，手機省電又順。 */
(function () {
  const W = window.WIDGETS = window.WIDGETS || {};
  const INK = '#2b2540', MUTED = '#8a84a0', RED = '#ff4d6d', BLUE = '#3a86ff', GREEN = '#20b07a', ORANGE = '#ff8c1a', PURPLE = '#7b5cff';
  const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
  const U = W._u = {};

  /* ---------- 共用工具 ---------- */
  U.setup = function (el, title, hMax, ratio) {
    el.innerHTML = `<p class="wg-t">${title}</p><canvas></canvas><div class="ctl"></div><div class="read"></div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const o = { el, cv, ctx, W: 0, H: 0, ctl: el.querySelector('.ctl'), read: el.querySelector('.read'), draw: null };
    const fit = () => {
      const w = cv.clientWidth; if (!w) return;
      const hh = Math.round(Math.min(hMax, Math.max(180, w * (ratio || 0.55))));
      if (Math.abs(cv.clientHeight - hh) > 1) cv.style.height = hh + 'px';
      const d = Math.min(window.devicePixelRatio || 1, 2);
      o.W = w; o.H = hh; cv.width = Math.round(w * d); cv.height = Math.round(hh * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      if (o.draw) o.draw();
    };
    cv.style.height = hMax + 'px';
    new ResizeObserver(fit).observe(cv);
    fit();
    return o;
  };
  U.dom = function (el, title) {
    el.innerHTML = `<p class="wg-t">${title}</p><div class="wbody"></div><div class="ctl"></div><div class="read"></div>`;
    return { el, body: el.querySelector('.wbody'), ctl: el.querySelector('.ctl'), read: el.querySelector('.read') };
  };
  U.animate = function (o, step) {
    let vis = true, last = performance.now();
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[0].isIntersecting; }).observe(o.cv || o.el);
    function f(t) {
      const dt = Math.min(0.05, (t - last) / 1000); last = t;
      if (vis && !document.hidden && (o.W || !o.cv)) step(dt, t / 1000);
      requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  };
  U.range = function (o, label, min, max, step, val, on) {
    const l = document.createElement('label');
    l.innerHTML = `${label} <input type="range" min="${min}" max="${max}" step="${step}" value="${val}"> <span></span>`;
    const i = l.querySelector('input'), s = l.querySelector('span');
    const u = () => { const t = on(+i.value); s.textContent = t == null ? '' : t; if (o.draw) o.draw(); };
    i.addEventListener('input', u); o.ctl.appendChild(l); u();
    return i;
  };
  U.seg = function (o, opts, val, on) {
    const g = document.createElement('div'); g.className = 'seg';
    g.innerHTML = opts.map(([k, t]) => `<button type="button" data-k="${k}" class="${k === val ? 'on' : ''}">${t}</button>`).join('');
    g.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
      on(b.dataset.k); if (o.draw) o.draw();
    });
    o.ctl.appendChild(g); on(val);
    return g;
  };
  U.btn = function (o, text, on, ghost) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn' + (ghost ? ' ghost' : '');
    b.textContent = text; b.addEventListener('click', () => { on(b); if (o.draw) o.draw(); }); o.ctl.appendChild(b); return b;
  };
  U.txt = function (ctx, s, x, y, color, size, align, weight) {
    ctx.save(); ctx.font = `${weight || 700} ${size || 13}px ${FONT}`; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,.92)'; ctx.strokeText(s, x, y); ctx.fillStyle = color || INK; ctx.fillText(s, x, y); ctx.restore();
  };
  U.line = function (ctx, x1, y1, x2, y2, color, w, dash) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w || 2; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
  };
  U.arrow = function (ctx, x1, y1, x2, y2, color, w, head) {
    const a = Math.atan2(y2 - y1, x2 - x1), s = head || 9;
    U.line(ctx, x1, y1, x2 - Math.cos(a) * s * 0.6, y2 - Math.sin(a) * s * 0.6, color, w || 2.5);
    ctx.save(); ctx.translate(x2, y2); ctx.rotate(a); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s, s * 0.55); ctx.lineTo(-s, -s * 0.55); ctx.closePath(); ctx.fill(); ctx.restore();
  };
  U.dot = function (ctx, x, y, r, fill, stroke) {
    ctx.save(); ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); } ctx.restore();
  };
  U.arc = function (ctx, x, y, r, a0, a1, color) {
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r, a0, a1, a1 < a0); ctx.stroke(); ctx.restore();
  };
  const { setup, animate, range, seg, btn, txt, line, arrow, dot } = U;
  const deg = Math.PI / 180;

  /* ---------- 3-1 波：橫波、縱波 ---------- */
  W.wave = el => {
    const o = setup(el, '波的傳播：繩子上的橫波、彈簧上的縱波', 230, 0.42);
    let type = 't', A = 0.6, f = 1.2, t = 0, sig = '';
    const V = 120; // 畫面上的波速（像素／秒），同一介質固定
    seg(o, [['t', '橫波（繩波）'], ['l', '縱波（彈簧、聲波）']], 't', k => { type = k; });
    range(o, '振幅', 0.2, 1, 0.05, A, x => { A = x; });
    range(o, '頻率', 0.5, 3, 0.1, f, x => { f = x; return x.toFixed(1) + ' 次/秒'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const lam = V / f, k = 2 * Math.PI / lam, om = 2 * Math.PI * f, cy = h * 0.55, x0 = 24, x1 = w - 16;
      line(ctx, x0, cy, x1, cy, '#cfc9dc', 1.5, [6, 5]);
      const ph = x => k * (x - x0) - om * t;
      if (type === 't') {
        const amp = A * h * 0.3;
        ctx.save(); ctx.strokeStyle = '#9fb7e8'; ctx.lineWidth = 3; ctx.beginPath();
        for (let x = x0; x <= x1; x += 3) { const y = cy - amp * Math.sin(ph(x)); x === x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
        for (let x = x0; x <= x1; x += 16) dot(ctx, x, cy - amp * Math.sin(ph(x)), 4, '#fff', BLUE);
        const xr = x0 + 16 * Math.round((lam * 1.1) / 16);
        const yr = cy - amp * Math.sin(ph(xr));
        line(ctx, xr, cy - amp - 6, xr, cy + amp + 6, 'rgba(255,77,109,.35)', 2, [3, 4]);
        dot(ctx, xr, yr, 7, RED, INK); txt(ctx, '這顆只上下動', xr, cy + amp + 20, RED, 12);
        // 波峰、波長
        let c0 = ((Math.PI / 2 + om * t) / k) % lam; while (c0 < 30) c0 += lam;
        const xc = x0 + c0, xc2 = xc + lam;
        if (xc2 < x1) {
          const yb = cy - amp - 16;
          line(ctx, xc, yb, xc2, yb, ORANGE, 2); line(ctx, xc, yb - 5, xc, yb + 5, ORANGE, 2); line(ctx, xc2, yb - 5, xc2, yb + 5, ORANGE, 2);
          txt(ctx, '波長 λ', (xc + xc2) / 2, yb - 10, ORANGE, 13, 'center', 900);
        }
        txt(ctx, '波峰', xc, cy - amp + 14, INK, 11);
        if (xc + lam / 2 < x1) txt(ctx, '波谷', xc + lam / 2, cy + amp - 14, INK, 11);
        arrow(ctx, x1 - 6, cy, x1 - 6, cy - amp, PURPLE, 2, 7); txt(ctx, '振幅', x1 - 26, cy - amp / 2, PURPLE, 11);
      } else {
        const B = Math.min(A * 14, 0.8 / k), hh = h * 0.42;
        for (let x = x0; x <= x1; x += 7) {
          const xs = x + B * Math.sin(ph(x));
          line(ctx, xs, cy - hh / 2, xs, cy + hh / 2, '#7fa0dc', 2);
        }
        const xr = x0 + 7 * Math.round((lam * 1.1) / 7), xs = xr + B * Math.sin(ph(xr));
        line(ctx, xr - B, cy + hh / 2 + 8, xr + B, cy + hh / 2 + 8, 'rgba(255,77,109,.5)', 2, [3, 3]);
        line(ctx, xs, cy - hh / 2, xs, cy + hh / 2, RED, 3.5); txt(ctx, '這圈只左右動', xr, cy + hh / 2 + 22, RED, 12);
        let c0 = ((Math.PI + om * t) / k) % lam; while (c0 < 20) c0 += lam;
        const xc = x0 + c0, yb = cy - hh / 2 - 14;
        txt(ctx, '密部', xc, yb, INK, 12, 'center', 900);
        if (xc + lam / 2 < x1) txt(ctx, '疏部', xc + lam / 2, yb, MUTED, 12, 'center', 900);
        if (xc + lam < x1) {
          const y2 = cy + hh / 2 + 40;
          if (y2 < h - 6) { line(ctx, xc, y2, xc + lam, y2, ORANGE, 2); txt(ctx, '波長 λ', xc + lam / 2, y2 - 10, ORANGE, 12, 'center', 900); }
        }
      }
      arrow(ctx, x0, 16, x0 + 70, 16, GREEN, 2, 7); txt(ctx, '波前進', x0 + 100, 16, GREEN, 12);
      const s = type + f.toFixed(1);
      if (s !== sig) {
        sig = s;
        o.read.innerHTML = `頻率 f = <b>${f.toFixed(1)}</b> 次/秒、波長 λ = <b>${(lam / 40).toFixed(2)}</b> 格 → 波速 v = f × λ = <b>${(V / 40).toFixed(1)}</b> 格/秒。` +
          `同一種介質，波速固定：<b>頻率變大，波長就變短</b>。${type === 't' ? '橫波：振動方向和前進方向<b>垂直</b>。' : '縱波：振動方向和前進方向<b>平行</b>，聲波就是縱波。'}介質只在原地振動，傳出去的是<b>能量</b>。`;
      }
    };
    animate(o, dt => { t += dt; o.draw(); });
  };

  /* ---------- 3-3 聲音三要素（可以按播放聽） ---------- */
  W.sound = el => {
    const o = setup(el, '聲音三要素：音調（頻率）、響度（振幅）、音色（波形）', 210, 0.4);
    let fr = 440, amp = 0.7, tim = 'fork';
    const SH = {
      fork: { n: '音叉', c: [1] },
      flute: { n: '直笛', c: [1, 0.35, 0.15, 0.06] },
      violin: { n: '小提琴', c: [1, 1 / 2, 1 / 3, 1 / 4, 1 / 5, 1 / 6, 1 / 7, 1 / 8] },
    };
    for (const k in SH) { const c = SH[k].c; let m = 0; for (let x = 0; x < Math.PI * 2; x += 0.01) { let y = 0; c.forEach((a, i) => y += a * Math.sin((i + 1) * x)); m = Math.max(m, Math.abs(y)); } SH[k].m = m; }
    range(o, '音調', 200, 1000, 10, fr, x => { fr = x; return x + ' Hz'; });
    range(o, '響度', 0.2, 1, 0.05, amp, x => { amp = x; });
    const sel = document.createElement('label');
    sel.innerHTML = '音色 <select><option value="fork">音叉</option><option value="flute">直笛</option><option value="violin">小提琴</option></select>';
    sel.querySelector('select').addEventListener('change', e => { tim = e.target.value; o.draw(); });
    o.ctl.appendChild(sel);
    let ac = null;
    btn(o, '🔊 播放', () => {
      try {
        ac = ac || new (window.AudioContext || window.webkitAudioContext)();
        const c = SH[tim].c, real = new Float32Array(c.length + 1), imag = new Float32Array(c.length + 1);
        c.forEach((a, i) => { imag[i + 1] = a; });
        const osc = ac.createOscillator(), g = ac.createGain(), now = ac.currentTime;
        osc.setPeriodicWave(ac.createPeriodicWave(real, imag)); osc.frequency.value = fr;
        g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.22 * amp * amp, now + 0.03); g.gain.setValueAtTime(0.22 * amp * amp, now + 0.7); g.gain.linearRampToValueAtTime(0, now + 0.9);
        osc.connect(g).connect(ac.destination); osc.start(now); osc.stop(now + 0.95);
      } catch (e) { o.read.textContent = '這台裝置不能播放聲音。'; }
    });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2, x0 = 20, x1 = w - 12, A = amp * h * 0.38, cycles = fr / 110, sh = SH[tim];
      line(ctx, x0, cy, x1, cy, '#cfc9dc', 1.5, [6, 5]);
      ctx.save(); ctx.strokeStyle = tim === 'fork' ? GREEN : tim === 'flute' ? '#3aa36b' : PURPLE; ctx.lineWidth = 3; ctx.beginPath();
      for (let x = x0; x <= x1; x += 1.5) {
        const p = (x - x0) / (x1 - x0) * cycles * Math.PI * 2; let y = 0;
        sh.c.forEach((a, i) => y += a * Math.sin((i + 1) * p));
        const yy = cy - A * y / sh.m; x === x0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
      }
      ctx.stroke(); ctx.restore();
      const per = (x1 - x0) / cycles;
      if (per > 30) {
        line(ctx, x0, h - 16, x0 + per, h - 16, ORANGE, 2); txt(ctx, '一個週期', x0 + per / 2, h - 28, ORANGE, 11);
      }
      arrow(ctx, x1 - 4, cy, x1 - 4, cy - A, PURPLE, 2, 7); txt(ctx, '振幅', x1 - 24, cy - A / 2, PURPLE, 11);
      o.read.innerHTML = `音調：頻率 <b>${fr} Hz</b>（${fr >= 650 ? '高音' : fr <= 330 ? '低音' : '中音'}）——頻率越高、波越密、音調越高。` +
        `響度：振幅越大越大聲。音色：<b>${sh.n}</b>的波形${tim === 'fork' ? '最平滑（純音）' : '有其他起伏'}——同音高、同響度，波形不同聽起來就不同。`;
    };
    o.draw();
  };

  /* ---------- 3-4 回聲與聲納 ---------- */
  W.echo = el => {
    const o = setup(el, '回聲：對山壁大喊，聲音碰到再反射回來', 200, 0.36);
    let d = 34, p = 1, run = false;
    range(o, '和山壁的距離', 5, 170, 1, d, x => { d = x; p = 1; return x + ' 公尺'; });
    btn(o, '📣 喊一聲！', () => { p = 0; run = true; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const gy = h - 24, px = 46, cx = 110 + (w - 150) * (d - 5) / 165;
      ctx.fillStyle = '#eef6e9'; ctx.fillRect(0, gy, w, h - gy);
      ctx.save(); ctx.fillStyle = '#b9a58c'; ctx.beginPath(); ctx.moveTo(cx, gy); ctx.lineTo(cx + 6, 30); ctx.lineTo(cx + 40, 18); ctx.lineTo(w, 20); ctx.lineTo(w, gy); ctx.closePath(); ctx.fill(); ctx.restore();
      txt(ctx, '山壁', cx + 30, 46, '#5b4a36', 12);
      ctx.save(); ctx.font = `28px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🧒', px, gy - 22); ctx.restore();
      line(ctx, px, gy + 10, cx, gy + 10, MUTED, 1.5); txt(ctx, `${d} 公尺`, (px + cx) / 2, gy + 10, INK, 11);
      if (p < 1) {
        const out = p < 0.5, q = out ? p * 2 : (p - 0.5) * 2, x = out ? px + 20 + (cx - px - 20) * q : cx - (cx - px - 20) * q, y = gy - 22;
        ctx.save(); ctx.strokeStyle = out ? GREEN : RED; ctx.lineWidth = 3;
        for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(x - (out ? i * 8 : -i * 8), y, 14 + i * 5, out ? -0.7 : Math.PI - 0.7, out ? 0.7 : Math.PI + 0.7); ctx.stroke(); }
        ctx.restore();
        txt(ctx, out ? '原聲 →' : '← 回聲', x, y - 34, out ? GREEN : RED, 12);
      }
      const T = 2 * d / 340;
      o.read.innerHTML = `來回距離 = 2 × ${d} = ${2 * d} 公尺；時間 t = 2d ÷ 340 = <b>${T.toFixed(3)} 秒</b> → ` +
        (T >= 0.1 ? '<b>超過 0.1 秒，聽得到回聲</b>。' : '<b>不到 0.1 秒</b>，回聲和原聲混在一起，聽不出來（要離山壁 17 公尺以上）。') +
        ' 聲納測深度也是這樣算：<b>深度 = 聲速 × 來回時間 ÷ 2</b>。';
    };
    animate(o, dt => { if (run) { const T = 2 * d / 340; p += dt / Math.max(1.6, T * 5); if (p >= 1) { p = 1; run = false; } o.draw(); } });
    o.draw();
  };

  /* ---------- 4-1 針孔成像 ---------- */
  W.pinhole = el => {
    const o = setup(el, '針孔成像：移動蠟燭和屏幕，看像怎麼變', 240, 0.46);
    let du = 110, dv = 110, big = false;
    range(o, '物距', 50, 200, 5, du, x => { du = x; return x + ''; });
    range(o, '屏距', 40, 200, 5, dv, x => { dv = x; return x + ''; });
    seg(o, [['s', '小孔'], ['b', '大孔']], 's', k => { big = k === 'b'; });
    const candle = (ctx, x, yb, hh, inv, a) => {
      ctx.save(); ctx.globalAlpha = a; const s = inv ? -1 : 1, ww = Math.max(4, hh * 0.22);
      ctx.fillStyle = '#ff9db8'; ctx.strokeStyle = INK; ctx.lineWidth = 1.5;
      ctx.fillRect(x - ww / 2, inv ? yb : yb - hh * 0.72, ww, hh * 0.72); ctx.strokeRect(x - ww / 2, inv ? yb : yb - hh * 0.72, ww, hh * 0.72);
      ctx.fillStyle = ORANGE; ctx.beginPath(); const fy = yb - s * hh * 0.72, fh = hh * 0.28;
      ctx.moveTo(x, fy - s * fh); ctx.quadraticCurveTo(x + ww * 0.7, fy - s * fh * 0.3, x, fy); ctx.quadraticCurveTo(x - ww * 0.7, fy - s * fh * 0.3, x, fy - s * fh); ctx.fill(); ctx.restore();
    };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const hx = w * 0.46, sc = Math.min((hx - 40) / 200, (w - hx - 24) / 200), ho = Math.min(76, h * 0.32), yh = h * 0.47, yb = yh + ho / 2;
      const ox = hx - du * sc, sx = hx + dv * sc, m = dv / du, hi = ho * m;
      ctx.fillStyle = '#f5efe3'; ctx.fillRect(0, yb, hx, 6);
      line(ctx, hx, 14, hx, yh - (big ? 9 : 3), INK, 6); line(ctx, hx, yh + (big ? 9 : 3), hx, h - 10, INK, 6);
      txt(ctx, '針孔', hx, 10, INK, 11);
      ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#9a94ad'; ctx.lineWidth = 2; ctx.fillRect(sx - 3, 14, 6, h - 28); ctx.strokeRect(sx - 3, 14, 6, h - 28); ctx.restore();
      txt(ctx, '屏幕', sx, h - 6, MUTED, 11);
      candle(ctx, ox, yb, ho, false, 1); txt(ctx, '物體', ox, yb + 14, INK, 11);
      const top = [ox, yb - ho], bot = [ox, yb], it = [sx, yh + (yh - top[1]) * m], ib = [sx, yh - (bot[1] - yh) * m];
      line(ctx, top[0], top[1], it[0], it[1], 'rgba(255,140,26,.85)', 2);
      line(ctx, bot[0], bot[1], ib[0], ib[1], 'rgba(255,77,109,.7)', 2);
      const imgYb = yh - (yb - yh) * m;
      if (big) { for (const dy of [-7, -3.5, 3.5, 7]) candle(ctx, sx - 8, imgYb + dy, hi, true, 0.22); candle(ctx, sx - 8, imgYb, hi, true, 0.45); }
      else candle(ctx, sx - 8, imgYb, hi, true, 1);
      o.read.innerHTML = `像的大小 = 物體大小 × 屏距 ÷ 物距 = <b>${m.toFixed(2)} 倍</b>（${m > 1.02 ? '放大' : m < 0.98 ? '縮小' : '等大'}）。` +
        `永遠是<b>倒立</b>（上下、左右都相反）的<b>實像</b>。${big ? '孔變大：進來的光多 → <b>比較亮，但變模糊</b>。' : '孔小：像清楚，但比較暗。'}`;
    };
    o.draw();
  };

  /* ---------- 4-2 反射定律、鏡面反射與漫射 ---------- */
  W.reflect = el => {
    const o = setup(el, '反射定律：入射角 = 反射角', 240, 0.5);
    let ang = 40, mode = 'm';
    range(o, '入射角', 5, 85, 1, ang, x => { ang = x; return x + '°'; });
    seg(o, [['m', '鏡面反射'], ['d', '漫射（粗糙表面）']], 'm', k => { mode = k; });
    const tilt = [-14, 9, -6, 16, -10, 5];
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const ys = h - 44, cx = w / 2, L = Math.min(h - 70, w * 0.42), a = ang * deg;
      if (mode === 'm') {
        ctx.fillStyle = '#d8e6f7'; ctx.fillRect(24, ys, w - 48, 10); line(ctx, 24, ys, w - 24, ys, '#2f6db5', 4);
        for (let x = 30; x < w - 24; x += 12) line(ctx, x, ys + 12, x + 8, ys + 22, '#9fb7e8', 1.5);
        line(ctx, cx, ys, cx, ys - L - 10, MUTED, 1.5, [6, 5]); txt(ctx, '法線', cx, ys - L - 18, MUTED, 11);
        const sx = cx - L * Math.sin(a), sy = ys - L * Math.cos(a), rx = cx + L * Math.sin(a), ry = sy;
        arrow(ctx, sx, sy, cx, ys, ORANGE, 3); arrow(ctx, cx, ys, rx, ry, RED, 3);
        dot(ctx, sx, sy, 6, '#ffe27a', INK);
        U.arc(ctx, cx, ys, 40, -Math.PI / 2 - a, -Math.PI / 2, ORANGE); U.arc(ctx, cx, ys, 48, -Math.PI / 2, -Math.PI / 2 + a, RED);
        txt(ctx, `入射角 ${ang}°`, cx - 70, ys - 58, ORANGE, 12, 'center', 900); txt(ctx, `反射角 ${ang}°`, cx + 70, ys - 58, RED, 12, 'center', 900);
        txt(ctx, '入射光', (sx + cx) / 2 - 22, (sy + ys) / 2, ORANGE, 11); txt(ctx, '反射光', (rx + cx) / 2 + 22, (ry + ys) / 2, RED, 11);
        o.read.innerHTML = '入射角、反射角都是和<b>法線</b>（垂直鏡面的線）的夾角。入射光、反射光、法線在<b>同一平面</b>，且<b>入射角 = 反射角</b>。';
      } else {
        ctx.save(); ctx.strokeStyle = '#8b6f4e'; ctx.lineWidth = 3; ctx.beginPath();
        for (let x = 24, i = 0; x <= w - 24; x += 14, i++) { const y = ys + (i % 2 ? 6 : -2); x === 24 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
        const n = 6, gap = Math.min(40, (w - 120) / n);
        for (let i = 0; i < n; i++) {
          const px = cx - (n - 1) * gap / 2 + i * gap, sx = px - L * 0.6 * Math.sin(a), sy = ys - L * 0.6 * Math.cos(a);
          arrow(ctx, sx, sy, px, ys, ORANGE, 2, 7);
          const na = tilt[i] * deg, ra = 2 * na + a; // 每一點的法線方向不同
          arrow(ctx, px, ys, px + L * 0.55 * Math.sin(ra), ys - L * 0.55 * Math.cos(ra), RED, 2, 7);
        }
        o.read.innerHTML = '表面凹凸不平，每一點的法線方向都不一樣，平行的光反射後<b>射向四面八方</b>，叫<b>漫射</b>。每一條光線<b>仍然遵守反射定律</b>。我們能從各個方向看到書本，就是因為漫射。';
      }
    };
    o.draw();
  };

  /* ---------- 4-3 折射 ---------- */
  W.refract = el => {
    const o = setup(el, '光的折射：從空氣進到水或玻璃，會偏折', 250, 0.52);
    let ang = 45, med = 'w', dir = 'in';
    range(o, '入射角', 0, 80, 1, ang, x => { ang = x; return x + '°'; });
    seg(o, [['w', '水'], ['g', '玻璃']], 'w', k => { med = k; });
    seg(o, [['in', '空氣 → 介質'], ['out', '介質 → 空氣']], 'in', k => { dir = k; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const n = med === 'w' ? 1.33 : 1.5, name = med === 'w' ? '水' : '玻璃', cy = h / 2, cx = w / 2, L = Math.min(h / 2 - 16, w * 0.4);
      ctx.fillStyle = med === 'w' ? 'rgba(120,190,255,.25)' : 'rgba(170,220,210,.35)'; ctx.fillRect(0, cy, w, h - cy);
      line(ctx, 0, cy, w, cy, '#2f6db5', 2);
      txt(ctx, '空氣', 30, 16, MUTED, 12); txt(ctx, name, 30, h - 14, '#2f6db5', 12);
      line(ctx, cx, 8, cx, h - 8, MUTED, 1.5, [6, 5]); txt(ctx, '法線', cx + 22, 14, MUTED, 11);
      const a = ang * deg;
      if (dir === 'in') {
        const r = Math.asin(Math.sin(a) / n);
        arrow(ctx, cx - L * Math.sin(a), cy - L * Math.cos(a), cx, cy, ORANGE, 3);
        arrow(ctx, cx, cy, cx + L * Math.sin(r), cy + L * Math.cos(r), RED, 3);
        U.line(ctx, cx, cy, cx + L * 0.6 * Math.sin(a), cy - L * 0.6 * Math.cos(a), 'rgba(255,140,26,.3)', 2, [4, 4]);
        txt(ctx, `入射角 ${ang}°`, cx - 64, cy - 30, ORANGE, 12, 'center', 900);
        txt(ctx, `折射角 ${(r / deg).toFixed(0)}°`, cx + 66, cy + 30, RED, 12, 'center', 900);
        o.read.innerHTML = ang === 0 ? '<b>垂直射入不會偏折</b>（方向不變，只是速度變慢）。' :
          `光從空氣進入${name}，速度<b>變慢</b> → <b>偏向法線</b>，折射角（${(r / deg).toFixed(0)}°）< 入射角（${ang}°）。淡淡的虛線是有一小部分光被反射。`;
      } else {
        const s = n * Math.sin(a);
        arrow(ctx, cx - L * Math.sin(a), cy + L * Math.cos(a), cx, cy, ORANGE, 3);
        txt(ctx, `入射角 ${ang}°`, cx - 64, cy + 30, ORANGE, 12, 'center', 900);
        if (s < 1) {
          const r = Math.asin(s);
          arrow(ctx, cx, cy, cx + L * Math.sin(r), cy - L * Math.cos(r), RED, 3);
          txt(ctx, `折射角 ${(r / deg).toFixed(0)}°`, cx + 66, cy - 30, RED, 12, 'center', 900);
          o.read.innerHTML = ang === 0 ? '垂直射出不偏折。' : `光從${name}進入空氣，速度<b>變快</b> → <b>偏離法線</b>，折射角 > 入射角。所以看水中的東西，會覺得<b>比實際淺</b>（視深 < 實深）。`;
        } else {
          arrow(ctx, cx, cy, cx + L * Math.sin(a), cy + L * Math.cos(a), RED, 3);
          txt(ctx, '全反射！', cx + 60, cy + 30, RED, 13, 'center', 900);
          o.read.innerHTML = `入射角太大，光出不去，全部反射回${name}裡，叫<b>全反射</b>（光纖就是利用它，課外補充）。`;
        }
      }
    };
    o.draw();
  };

  /* ---------- 4-5 色光三原色 ---------- */
  W.rgb = el => {
    const o = setup(el, '色光三原色：紅、綠、藍光混在一起', 240, 0.5);
    const on = { r: true, g: true, b: true };
    for (const [k, t] of [['r', '紅光'], ['g', '綠光'], ['b', '藍光']]) btn(o, '✓ ' + t, b => { on[k] = !on[k]; b.textContent = (on[k] ? '✓ ' : '　') + t; b.classList.toggle('ghost', !on[k]); });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.fillStyle = '#16131f'; ctx.fillRect(0, 0, w, h);
      const r = Math.min(h * 0.3, w * 0.2), cx = w / 2, cy = h / 2 + 6, d = r * 0.62;
      const C = { r: [cx, cy - d * 0.75, '#ff0000'], g: [cx - d * 0.85, cy + d * 0.5, '#00ff00'], b: [cx + d * 0.85, cy + d * 0.5, '#0000ff'] };
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const k of ['r', 'g', 'b']) if (on[k]) { ctx.fillStyle = C[k][2]; ctx.beginPath(); ctx.arc(C[k][0], C[k][1], r, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      const lab = (s, x, y) => { ctx.save(); ctx.font = `900 13px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.6)'; ctx.strokeText(s, x, y); ctx.fillStyle = '#fff'; ctx.fillText(s, x, y); ctx.restore(); };
      if (on.r && on.g) lab('黃', (C.r[0] + C.g[0]) / 2 - 8, (C.r[1] + C.g[1]) / 2);
      if (on.g && on.b) lab('青', cx, cy + d * 0.95);
      if (on.r && on.b) lab('洋紅', (C.r[0] + C.b[0]) / 2 + 10, (C.r[1] + C.b[1]) / 2);
      if (on.r && on.g && on.b) lab('白', cx, cy + 4);
      const n = on.r + on.g + on.b;
      o.read.innerHTML = n === 3 ? '紅＋綠＋藍 = <b>白光</b>。調整三種色光的強弱，可以混出各種顏色（手機、電視螢幕就是這樣）。' :
        n === 2 ? '兩種色光混合：紅＋綠 = <b>黃</b>、綠＋藍 = <b>青</b>、紅＋藍 = <b>洋紅</b>。' : '點按鈕打開或關掉色光，看看會混出什麼顏色。';
    };
    o.draw();
  };

  /* ---------- 4-5 物體的顏色 ---------- */
  W.objcolor = el => {
    const o = setup(el, '物體的顏色：用不同色光照不同的紙', 230, 0.45);
    const NAME = { 0: '黑', 1: '紅', 2: '綠', 4: '藍', 7: '白' }, CSS = { 0: '#1b1825', 1: '#ff3b3b', 2: '#2fbf4f', 4: '#3b6dff', 7: '#ffffff' };
    let L = 7, O = 'rp';
    const OB = { wp: ['白紙', 7, 0], rp: ['紅紙', 1, 0], gp: ['綠紙', 2, 0], bp: ['藍紙', 4, 0], kp: ['黑紙', 0, 0], rg: ['紅色玻璃紙', 1, 1] };
    seg(o, [['7', '白光'], ['1', '紅光'], ['2', '綠光'], ['4', '藍光']], '7', k => { L = +k; });
    const s = document.createElement('label');
    s.innerHTML = '照在 <select>' + Object.entries(OB).map(([k, v]) => `<option value="${k}"${k === O ? ' selected' : ''}>${v[0]}</option>`).join('') + '</select>';
    s.querySelector('select').addEventListener('change', e => { O = e.target.value; o.draw(); }); o.ctl.appendChild(s);
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const [nm, mask, glass] = OB[O], res = L & mask, lx = 40, ly = 26, px = w * 0.5, py = glass ? h * 0.45 : h - 50;
      ctx.save(); ctx.font = `30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('🔦', lx, ly); ctx.restore();
      const lc = L === 7 ? '#ffd23f' : CSS[L];
      ctx.save(); ctx.strokeStyle = lc; ctx.globalAlpha = 0.85; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(lx + 14, ly + 10); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
      txt(ctx, NAME[L] + '光', (lx + px) / 2 - 20, (ly + py) / 2 - 18, INK, 12);
      if (!glass) {
        ctx.save(); ctx.fillStyle = CSS[mask === 7 ? 7 : mask]; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(px - 70, py, 140, 18); ctx.strokeRect(px - 70, py, 140, 18); ctx.restore();
        txt(ctx, nm + '（白光下的顏色）', px, py + 32, INK, 11);
        if (res) { ctx.save(); ctx.strokeStyle = CSS[res] === '#ffffff' ? '#ffd23f' : CSS[res]; ctx.globalAlpha = 0.85; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(w - 50, ly + 10); ctx.stroke(); ctx.restore(); }
        ctx.save(); ctx.font = `30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('👀', w - 40, ly); ctx.restore();
        const sw = CSS[res]; ctx.save(); ctx.fillStyle = sw; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w - 40, ly + 48, 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
        txt(ctx, `看起來是${NAME[res]}色`, w - 70, ly + 80, INK, 12, 'center', 900);
        o.read.innerHTML = `不透明物體的顏色由<b>反射的色光</b>決定。${nm}只反射${mask === 7 ? '所有色光' : mask === 0 ? '不了任何色光（全部吸收）' : NAME[mask] + '光'}，` +
          `${NAME[L]}光照上去 → ${res ? '反射' + NAME[res] + '光' : '沒有光反射'}，所以看起來是<b>${NAME[res]}色</b>。`;
      } else {
        ctx.save(); ctx.fillStyle = 'rgba(255,60,60,.45)'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(px - 60, py - 4, 120, 8); ctx.strokeRect(px - 60, py - 4, 120, 8); ctx.restore();
        txt(ctx, nm, px + 90, py, INK, 11);
        if (res) { ctx.save(); ctx.strokeStyle = CSS[res]; ctx.globalAlpha = 0.85; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + (px - lx) * 0.35, h - 30); ctx.stroke(); ctx.restore(); }
        ctx.save(); ctx.fillStyle = res ? CSS[res] : '#ddd'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(px - 20, h - 28, 200, 14); ctx.strokeRect(px - 20, h - 28, 200, 14); ctx.restore();
        txt(ctx, res ? `白紙被照成${NAME[res]}色` : '沒有光穿過，白紙是暗的', px + 80, h - 40, INK, 12, 'center', 900);
        o.read.innerHTML = `透明物體的顏色由<b>透過的色光</b>決定。紅色玻璃紙只讓紅光通過，${NAME[L]}光照上去 → ${res ? '紅光穿過' : '全部被吸收，沒有光穿過'}。`;
      }
    };
    o.draw();
  };

  /* ---------- 1-3 排水法量體積、密度 ---------- */
  W.density = el => {
    const o = setup(el, '排水法量體積，算出密度', 260, 0.55);
    const OB = { fe: ['鐵塊', 39.5, 5, '#8a8f9c'], al: ['鋁塊', 27, 10, '#c9ced8'], cu: ['銅塊', 44.5, 5, '#d08a4e'], gl: ['玻璃彈珠', 25, 10, '#9fe3e0'] };
    let k = 'al', inside = false, lv = 50, pos = 0;
    seg(o, Object.entries(OB).map(([a, b]) => [a, b[0]]), k, x => { k = x; inside = false; });
    btn(o, '放進量筒 / 拿出來', () => { inside = !inside; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const [nm, m, V, col] = OB[k], cx = w * 0.32, top = 24, bot = h - 18, cw = 70, sc = (bot - top) / 100;
      const wy = bot - lv * sc;
      ctx.fillStyle = 'rgba(120,190,255,.35)'; ctx.fillRect(cx - cw / 2, wy, cw, bot - wy);
      ctx.save(); ctx.strokeStyle = '#2f6db5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - cw / 2, wy + 4); ctx.quadraticCurveTo(cx, wy + 10, cx + cw / 2, wy + 4); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(cx - cw / 2, top, cw, bot - top); ctx.restore();
      for (let v = 0; v <= 100; v += 2) { const y = bot - v * sc, big = v % 10 === 0; line(ctx, cx + cw / 2 - (big ? 18 : 9), y, cx + cw / 2, y, INK, big ? 1.6 : 1); if (big && v) txt(ctx, v + '', cx + cw / 2 + 16, y, INK, 10); }
      txt(ctx, 'mL', cx + cw / 2 + 16, top - 10, INK, 10);
      const side = Math.cbrt(V) * 12, ox = cx, oy = top - side - 4 + pos * (bot - side - 2 - (top - side - 4));
      ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (k === 'gl') { ctx.beginPath(); ctx.arc(ox, oy + side / 2, side / 2 + 2, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } else { ctx.fillRect(ox - side / 2, oy, side, side); ctx.strokeRect(ox - side / 2, oy, side, side); }
      ctx.restore();
      line(ctx, cx - cw / 2 - 30, wy + 6, cx - cw / 2 - 4, wy + 6, RED, 1.5, [3, 3]); txt(ctx, '平視凹面最低點', cx - cw / 2 - 18, wy - 8, RED, 10, 'right');
      const D = m / V;
      const x2 = w * 0.62;
      txt(ctx, nm, x2, 40, INK, 15, 'left', 900);
      txt(ctx, `質量 ${m} g（天平量）`, x2, 66, INK, 12, 'left');
      txt(ctx, `水位 50 → ${50 + V} mL`, x2, 90, INK, 12, 'left');
      txt(ctx, `體積 = ${V} cm³`, x2, 114, INK, 12, 'left');
      txt(ctx, `密度 = ${m} ÷ ${V} = ${D.toFixed(2)} g/cm³`, x2, 142, RED, 13, 'left', 900);
      o.read.innerHTML = `體積 = 放入後水位 − 放入前水位（1 mL = 1 cm³）。<b>密度 = 質量 ÷ 體積</b>，${nm}約 ${D.toFixed(2)} g/cm³，比水（1 g/cm³）大，所以會沉下去。` +
        '同一種物質密度固定，可以用密度來<b>分辨物質</b>。';
    };
    animate(o, dt => {
      const V = OB[k][2], tp = inside ? 1 : 0, tl = inside ? 50 + V : 50;
      if (Math.abs(pos - tp) > 0.001 || Math.abs(lv - tl) > 0.01) {
        pos += Math.sign(tp - pos) * Math.min(Math.abs(tp - pos), dt * 1.6);
        lv = pos > 0.7 ? lv + (tl - lv) * Math.min(1, dt * 6) : lv + (50 - lv) * Math.min(1, dt * 6);
        o.draw();
      }
    });
  };

  /* ---------- 2-2 溶液與濃度、飽和 ---------- */
  W.solution = el => {
    const o = setup(el, '溶液與濃度：食鹽加進水裡（20°C 時每 100 g 水最多溶 36 g）', 240, 0.5);
    let salt = 20, water = 100;
    range(o, '食鹽', 0, 60, 1, salt, x => { salt = x; return x + ' g'; });
    range(o, '水', 50, 200, 5, water, x => { water = x; return x + ' g'; });
    const R = []; for (let i = 0; i < 160; i++) R.push([Math.random(), Math.random()]);
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const max = water * 0.36, dis = Math.min(salt, max), extra = salt - dis, cx = w * 0.32, bw = Math.min(170, w * 0.42), bot = h - 18, top = 24;
      const wh = (bot - top - 10) * water / 220, wy = bot - wh;
      ctx.fillStyle = 'rgba(120,190,255,.3)'; ctx.fillRect(cx - bw / 2, wy, bw, wh);
      const n = Math.round(dis * 2.2);
      for (let i = 0; i < n && i < R.length; i++) dot(ctx, cx - bw / 2 + 6 + R[i][0] * (bw - 12), wy + 6 + R[i][1] * (wh - 20), 2.6, '#fff', '#7fa0dc');
      for (let i = 0; i < Math.round(extra * 1.4); i++) { const x = cx - bw / 2 + 10 + ((i * 37) % (bw - 20)), y = bot - 6 - Math.floor(i / 9) * 5; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#8a84a0'; ctx.fillRect(x, y, 5, 5); ctx.strokeRect(x, y, 5, 5); }
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - bw / 2, top); ctx.lineTo(cx - bw / 2, bot); ctx.lineTo(cx + bw / 2, bot); ctx.lineTo(cx + bw / 2, top); ctx.stroke(); ctx.restore();
      const c = dis / (dis + water) * 100, x2 = w * 0.62;
      txt(ctx, `溶質（溶了）${dis.toFixed(1)} g`, x2, 44, INK, 12, 'left');
      txt(ctx, `溶劑（水）${water} g`, x2, 68, INK, 12, 'left');
      txt(ctx, `溶液 = ${(dis + water).toFixed(1)} g`, x2, 92, INK, 12, 'left');
      txt(ctx, `重量百分濃度 ${c.toFixed(1)}%`, x2, 122, RED, 14, 'left', 900);
      txt(ctx, extra > 0 ? `飽和！沉了 ${extra.toFixed(1)} g` : salt >= max - 0.01 && salt > 0 ? '剛好飽和' : '未飽和', x2, 150, extra > 0 ? RED : GREEN, 13, 'left', 900);
      o.read.innerHTML = `<b>重量百分濃度 = 溶質 ÷ 溶液 × 100%</b>（溶液 = 溶質 + 溶劑）。這杯水最多溶 ${max.toFixed(1)} g 食鹽，` +
        (extra > 0 ? `多出來的 ${extra.toFixed(1)} g 溶不了、沉在杯底，濃度停在最大值（飽和溶液）。` : '還能再溶，是未飽和溶液。') + '加更多水，能溶的量也變多。';
    };
    o.draw();
  };

  /* ---------- 2-1 / 5-4 粒子模型：固體、液體、氣體 ---------- */
  W.states = el => {
    const o = setup(el, '粒子模型：水的三態（調溫度看看）', 220, 0.45);
    let T = 25; const N = 36, P = [];
    for (let i = 0; i < N; i++) P.push({ x: 0, y: 0, vx: (Math.random() - 0.5), vy: (Math.random() - 0.5), gx: i % 6, gy: Math.floor(i / 6), ph: Math.random() * 6 });
    range(o, '溫度', -20, 130, 1, T, x => { T = x; return x + '°C'; });
    let st = '', init = false;
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(20, 14, w - 40, h - 28); ctx.restore();
      for (const p of P) dot(ctx, p.x, p.y, 7, T < 0 ? '#bfe0ff' : T < 100 ? '#7fb6ff' : '#cfe4ff', INK);
      txt(ctx, T < 0 ? '固體（冰）' : T < 100 ? '液體（水）' : '氣體（水蒸氣）', w / 2, 30, RED, 14, 'center', 900);
    };
    animate(o, (dt, now) => {
      const { W: w, H: h } = o; if (!w) return;
      const s = T < 0 ? 's' : T < 100 ? 'l' : 'g', sp = 30 + (T + 20) * 2.2;
      if (!init || s !== st) {
        init = true; st = s;
        P.forEach(p => {
          if (s === 's') { p.x = w / 2 - 75 + p.gx * 30; p.y = h / 2 - 60 + p.gy * 22 + 10; }
          else if (s === 'l') { p.x = 40 + Math.random() * (w - 80); p.y = h - 40 - Math.random() * (h * 0.4); }
          else { p.x = 30 + Math.random() * (w - 60); p.y = 40 + Math.random() * (h - 70); }
        });
        o.read.innerHTML = s === 's' ? '<b>固體</b>：粒子排列整齊、距離近，只在原位置<b>振動</b>，有固定形狀和體積。' :
          s === 'l' ? '<b>液體</b>：粒子距離近、可以<b>互相滑動</b>，有固定體積、沒有固定形狀（隨容器改變）。' :
          '<b>氣體</b>：粒子距離遠、<b>快速亂跑</b>，沒有固定形狀和體積，會充滿整個容器。溫度越高，粒子運動越快。';
      }
      for (const p of P) {
        if (s === 's') { const bx = w / 2 - 75 + p.gx * 30, by = h / 2 - 50 + p.gy * 22, a = 1 + (T + 20) * 0.08; p.x = bx + Math.sin(now * 9 + p.ph) * a; p.y = by + Math.cos(now * 11 + p.ph) * a; continue; }
        p.x += p.vx * sp * dt; p.y += p.vy * sp * dt;
        const yTop = s === 'l' ? h * 0.48 : 26;
        if (p.x < 28 || p.x > w - 28) { p.vx *= -1; p.x = Math.max(28, Math.min(w - 28, p.x)); }
        if (p.y < yTop || p.y > h - 22) { p.vy *= -1; p.y = Math.max(yTop, Math.min(h - 22, p.y)); }
        if (s === 'l' && Math.random() < 0.03) { p.vx += (Math.random() - 0.5) * 0.4; p.vy += (Math.random() - 0.5) * 0.4; const m = Math.hypot(p.vx, p.vy) || 1; p.vx /= m * 1.2; p.vy /= m * 1.2; }
        if (s === 'g') { const m = Math.hypot(p.vx, p.vy) || 1; p.vx /= m; p.vy /= m; }
      }
      o.draw();
    });
  };

  /* ---------- 5-3 比熱：同樣加熱，誰升溫快 ---------- */
  W.heat = el => {
    const o = setup(el, '比熱：同樣的熱量，水、油、沙子誰升溫快？（各 100 g，從 20°C 開始）', 240, 0.48);
    let t = 0, run = false;
    const S = [['水', 1, '#7fb6ff'], ['沙拉油', 0.5, '#ffd23f'], ['沙子', 0.2, '#d4b48a']], RATE = 50; // 每秒 50 卡
    range(o, '加熱時間', 0, 60, 1, 0, x => { t = x; run = false; return x + ' 秒'; });
    btn(o, '🔥 自動加熱', () => { t = 0; run = true; });
    const inp = o.ctl.querySelector('input');
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const Q = RATE * t, col = w / 3, top = 30, bot = h - 40, sc = (bot - top) / 100;
      S.forEach(([nm, s, c], i) => {
        const T = Math.min(120, 20 + Q / (100 * s)), x = col * i + col / 2;
        ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x - 9, top, 18, bot - top, 9); else ctx.rect(x - 9, top, 18, bot - top); ctx.fill(); ctx.stroke(); ctx.restore();
        const yT = bot - Math.min(100, T) * sc;
        ctx.fillStyle = RED; ctx.fillRect(x - 4, yT, 8, bot - yT);
        dot(ctx, x, bot + 8, 11, RED, INK);
        txt(ctx, `${T >= 120 ? '>' : ''}${T.toFixed(0)}°C`, x, yT - 12, INK, 13, 'center', 900);
        txt(ctx, `${nm}（比熱 ${s}）`, x, h - 10, INK, 12);
        ctx.fillStyle = c; ctx.fillRect(x + 16, bot - 26, 26, 26);
      });
      o.read.innerHTML = `已加熱 ${t.toFixed(0)} 秒，每杯吸收 <b>${Q.toFixed(0)} 卡</b>。<b>H = m × s × ΔT</b>：質量、熱量一樣時，<b>比熱越大，溫度變化越小</b>。` +
        '水的比熱最大（1 cal/g·°C），所以海邊早晚溫差小、沙漠溫差大。';
    };
    animate(o, dt => { if (run) { t += dt * 10; if (t >= 60) { t = 60; run = false; } inp.value = t; inp.nextElementSibling.textContent = t.toFixed(0) + ' 秒'; o.draw(); } });
    o.draw();
  };

  /* ---------- 5-1 溫度換算 ---------- */
  W.temp = el => {
    const o = U.dom(el, '攝氏、華氏換算');
    let c = 37;
    range(o, '攝氏', -40, 120, 1, c, x => { c = x; return x + ' °C'; });
    o.draw = () => {
      const f = c * 9 / 5 + 32;
      o.body.innerHTML = `<div style="display:flex;gap:12px;flex-wrap:wrap;font-weight:900;font-size:1.3rem"><span style="background:#ffe8e0;border:2px solid #2b2540;border-radius:12px;padding:6px 14px">${c} °C</span><span>＝</span><span style="background:#e3edff;border:2px solid #2b2540;border-radius:12px;padding:6px 14px">${f.toFixed(1)} °F</span></div>`;
      o.read.innerHTML = '<b>°F = °C × 9/5 + 32</b>。水的凝固點 0°C = 32°F，沸點 100°C = 212°F（一大氣壓下），中間攝氏分 100 格、華氏分 180 格。' +
        (c === -40 ? '　剛好 −40 度時兩種溫標數字一樣！' : '');
    };
    o.draw();
  };

  /* ---------- 6-3 原子模型（原子序 1～20） ---------- */
  W.atom = el => {
    const E = [[1, 'H', '氫', 1], [2, 'He', '氦', 4], [3, 'Li', '鋰', 7], [4, 'Be', '鈹', 9], [5, 'B', '硼', 11], [6, 'C', '碳', 12], [7, 'N', '氮', 14], [8, 'O', '氧', 16], [9, 'F', '氟', 19], [10, 'Ne', '氖', 20],
      [11, 'Na', '鈉', 23], [12, 'Mg', '鎂', 24], [13, 'Al', '鋁', 27], [14, 'Si', '矽', 28], [15, 'P', '磷', 31], [16, 'S', '硫', 32], [17, 'Cl', '氯', 35], [18, 'Ar', '氬', 40], [19, 'K', '鉀', 39], [20, 'Ca', '鈣', 40]];
    const METAL = new Set([3, 4, 11, 12, 13, 19, 20]);
    const o = setup(el, '原子的構造：點元素看質子、中子、電子', 260, 0.55);
    let z = 6, rot = 0;
    const g = document.createElement('div'); g.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;width:100%';
    g.innerHTML = E.map(e => `<button type="button" class="wbtn ghost" data-z="${e[0]}" style="padding:2px 8px;min-width:40px">${e[1]}</button>`).join('');
    g.addEventListener('click', ev => { const b = ev.target.closest('[data-z]'); if (!b) return; z = +b.dataset.z; mark(); o.draw(); });
    o.ctl.appendChild(g);
    const mark = () => g.querySelectorAll('button').forEach(b => b.classList.toggle('ghost', +b.dataset.z !== z));
    mark();
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const [Z, sym, nm, A] = E[z - 1], sh = []; let left = Z;
      for (const cap of [2, 8, 8, 2]) { if (left <= 0) break; const n = Math.min(cap, left); sh.push(n); left -= n; }
      const cx = w * 0.36, cy = h / 2, R = Math.min(h / 2 - 14, w * 0.3), step = R / (sh.length + 0.6);
      sh.forEach((n, i) => {
        const r = step * (i + 1.4);
        ctx.save(); ctx.strokeStyle = '#c9d6ee'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        for (let k = 0; k < n; k++) { const a = rot * (1 - i * 0.2) + k * Math.PI * 2 / n + i; dot(ctx, cx + r * Math.cos(a), cy + r * Math.sin(a), 5, BLUE, INK); }
      });
      dot(ctx, cx, cy, step * 0.85, '#ffd6e2', INK);
      txt(ctx, `${Z} p⁺`, cx, cy - 7, RED, 12, 'center', 900); txt(ctx, `${A - Z} n`, cx, cy + 9, MUTED, 11, 'center', 900);
      const x2 = w * 0.68;
      txt(ctx, `${nm}  ${sym}`, x2, 40, INK, 22, 'center', 900);
      txt(ctx, `原子序 ${Z}`, x2, 72, INK, 13);
      txt(ctx, `質子 ${Z}、電子 ${Z}、中子 ${A - Z}`, x2, 96, INK, 12);
      txt(ctx, `電子排列 ${sh.join('、')}`, x2, 120, INK, 12);
      txt(ctx, Z === 2 || Z === 10 || Z === 18 ? '鈍氣（很穩定）' : METAL.has(Z) ? '金屬元素' : '非金屬元素', x2, 146, METAL.has(Z) ? ORANGE : GREEN, 13, 'center', 900);
      o.read.innerHTML = `原子 = 原子核（<b>質子＋中子</b>）＋外面的<b>電子</b>。<b>原子序 = 質子數 = 電子數</b>（原子是電中性），質量數 = 質子 + 中子 = ${A}。` +
        `電子層數 ${sh.length} 層 → 在週期表第 <b>${sh.length}</b> 週期；最外層 ${sh[sh.length - 1]} 個電子，同一族的元素最外層電子數相同、性質相近。`;
    };
    animate(o, dt => { rot += dt * 0.8; o.draw(); });
  };

  /* ---------- 4-4 眼睛：近視、遠視與矯正 ---------- */
  W.eye = el => {
    const o = setup(el, '眼睛成像：近視、遠視怎麼矯正', 230, 0.45);
    let type = 'n', fix = false;
    seg(o, [['n', '正常'], ['m', '近視'], ['h', '遠視']], 'n', k => { type = k; });
    btn(o, '戴上眼鏡 / 拿掉', () => { fix = !fix; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const cy = h / 2, ex = w * 0.62, R = Math.min(h * 0.38, w * 0.2), lx = ex - R * 0.82, retina = ex + R;
      ctx.save(); ctx.fillStyle = '#fff4ee'; ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(ex, cy, R, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(ex, cy, R - 2, -0.6, 0.6); ctx.stroke(); ctx.restore();
      txt(ctx, '視網膜', retina + 26, cy - R * 0.55, RED, 11);
      ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.5)'; ctx.strokeStyle = '#2f6db5'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(lx, cy, 9, R * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, '水晶體', lx, cy + R * 0.45 + 14, '#2f6db5', 11);
      let fx = type === 'n' ? retina - 2 : type === 'm' ? retina - R * 0.5 : retina + R * 0.45;
      const gx = lx - 70, glass = fix && type !== 'n';
      if (glass) {
        ctx.save(); ctx.fillStyle = 'rgba(160,210,255,.5)'; ctx.strokeStyle = '#2f6db5'; ctx.lineWidth = 2; ctx.beginPath();
        const hh = R * 0.6;
        if (type === 'm') { ctx.moveTo(gx - 8, cy - hh); ctx.lineTo(gx + 8, cy - hh); ctx.quadraticCurveTo(gx - 2, cy, gx + 8, cy + hh); ctx.lineTo(gx - 8, cy + hh); ctx.quadraticCurveTo(gx + 2, cy, gx - 8, cy - hh); }
        else { ctx.moveTo(gx, cy - hh); ctx.quadraticCurveTo(gx + 16, cy, gx, cy + hh); ctx.quadraticCurveTo(gx - 16, cy, gx, cy - hh); }
        ctx.fill(); ctx.stroke(); ctx.restore();
        txt(ctx, type === 'm' ? '凹透鏡' : '凸透鏡', gx, cy - R * 0.6 - 12, '#2f6db5', 12, 'center', 900);
        fx = retina - 2;
      }
      for (const dy of [-R * 0.32, 0, R * 0.32]) {
        const y0 = cy + dy; let x = 20, y = y0, ang = 0;
        if (glass) { line(ctx, x, y, gx, y, ORANGE, 2.2); x = gx; ang = type === 'm' ? dy * 0.0035 : -dy * 0.0035; const y1 = y + Math.tan(ang) * (lx - gx); line(ctx, x, y, lx, y1, ORANGE, 2.2); y = y1; }
        else line(ctx, x, y, lx, y, ORANGE, 2.2);
        const yEnd = cy, xEnd = Math.min(fx, retina);
        const t = (xEnd - lx) / (fx - lx); line(ctx, lx, y, xEnd, y + (yEnd - y) * t, ORANGE, 2.2);
        if (fx < retina - 4) { const k = (cy - y) / (fx - lx); line(ctx, fx, cy, retina - 4, cy + k * (retina - 4 - fx), 'rgba(255,140,26,.55)', 2); }  // 近視：過了焦點又散開，打在視網膜上是一片模糊
      }
      dot(ctx, Math.min(fx, retina + R * 0.5), cy, 5, fx === retina - 2 ? GREEN : RED, INK);
      o.read.innerHTML = type === 'n' ? '正常眼睛：光線剛好<b>聚焦在視網膜上</b>，成<b>倒立、縮小的實像</b>，大腦再把它轉正。' :
        type === 'm' ? (glass ? '戴<b>凹透鏡</b>：先讓光線發散一點，焦點<b>往後移</b>到視網膜上，就看清楚了。' : '<b>近視</b>：眼球太長或水晶體太凸，遠處的光聚焦在視網膜<b>前方</b> → 看遠不清楚。') :
        (glass ? '戴<b>凸透鏡</b>：先讓光線會聚一點，焦點<b>往前移</b>到視網膜上。老花眼也是用凸透鏡。' : '<b>遠視</b>：眼球太短或水晶體太扁，光聚焦在視網膜<b>後方</b> → 看近不清楚。');
    };
    o.draw();
  };
})();
