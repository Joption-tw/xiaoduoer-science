/* 一步一步播放的動畫：⏮ ▶ ⏭，每一步下面有一句說明。
   每個主題是一串 steps：{ cap: 說明, draw(ctx, w, h, p, t) }，畫第 k 步時，前面的步驟都畫完整（p = 1），
   目前這一步用 p（0→1）慢慢畫出來；t 是時間，給氣泡、粒子這類一直在動的東西用。 */
(function () {
  const W = window.WIDGETS, U = W._u;
  const { setup, animate, txt, line, arrow, dot } = U;
  const INK = '#2b2540', MUTED = '#8a84a0', RED = '#ff4d6d', BLUE = '#3a86ff', GREEN = '#20b07a', ORANGE = '#ff8c1a', PURPLE = '#7b5cff', LENS = '#2f6db5';
  const ease = p => p < 0 ? 0 : p > 1 ? 1 : 1 - Math.pow(1 - p, 3);

  /* 折線畫到一部分（p = 0～1），可以加箭頭 */
  function path(ctx, pts, p, color, w, dash, head) {
    let L = 0; const seg = [];
    for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; }
    let left = L * Math.max(0, Math.min(1, p));
    ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w || 2.5; ctx.lineCap = 'round'; if (dash) ctx.setLineDash(dash);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    let end = pts[0], ang = 0;
    for (let i = 1; i < pts.length && left > 0; i++) {
      const k = Math.min(1, left / seg[i - 1]), x = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, y = pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k;
      ctx.lineTo(x, y); end = [x, y]; ang = Math.atan2(pts[i][1] - pts[i - 1][1], pts[i][0] - pts[i - 1][0]); left -= seg[i - 1];
    }
    ctx.stroke(); ctx.restore();
    if (head && p > 0.05) { ctx.save(); ctx.translate(end[0], end[1]); ctx.rotate(ang); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-7, 5); ctx.lineTo(-7, -5); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  /* 直立箭頭（物體、像） */
  function vArrow(ctx, x, y0, y1, color, w, dashed, p) {
    const yy = y0 + (y1 - y0) * (p == null ? 1 : p), dir = yy < y0 ? -1 : 1;
    if (Math.abs(yy - y0) < 4) return;
    line(ctx, x, y0, x, yy - dir * 10, color, w || 5, dashed ? [6, 5] : null);
    ctx.save(); ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x - 8, yy - dir * 13); ctx.lineTo(x + 8, yy - dir * 13); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const alpha = (ctx, a, fn) => { ctx.save(); ctx.globalAlpha = a; fn(); ctx.restore(); };

  /* ---------- 播放器 ---------- */
  function player(el, title, steps, hMax, ratio) {
    const o = setup(el, title, hMax || 260, ratio || 0.52);
    o.el.querySelector('.wg-t').classList.add('st');
    let i = 0, p = 0, playing = false, hold = 0, t = 0;
    const mk = (txt0, fn, cls) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'wbtn ' + (cls || 'ghost'); b.textContent = txt0; b.addEventListener('click', fn); o.ctl.appendChild(b); return b; };
    const prev = mk('⏮ 上一步', () => { playing = false; if (i > 0) { i--; p = 1; } upd(); });
    const play = mk('▶ 播放', () => { if (playing) { playing = false; } else { if (i === steps.length - 1 && p >= 1) { i = 0; p = 0; } playing = true; hold = 0; } upd(); }, ' ');
    const next = mk('⏭ 下一步', () => { playing = false; if (i < steps.length - 1) { i++; p = 0; } upd(); });
    const dots = document.createElement('span'); dots.style.cssText = 'display:inline-flex;gap:5px;align-items:center;margin-left:4px'; o.ctl.appendChild(dots);
    dots.addEventListener('click', e => { const d = e.target.closest('[data-k]'); if (!d) return; playing = false; i = +d.dataset.k; p = 0; upd(); });
    function upd() {
      play.textContent = playing ? '⏸ 暫停' : (i === steps.length - 1 && p >= 1 ? '↺ 重播' : '▶ 播放');
      prev.disabled = i === 0; next.disabled = i === steps.length - 1;
      dots.innerHTML = steps.map((_, k) => `<span data-k="${k}" title="第 ${k + 1} 步" style="cursor:pointer;width:${k === i ? 20 : 10}px;height:10px;border-radius:5px;border:2px solid #2b2540;background:${k < i ? '#ffd23f' : k === i ? '#ff7eb6' : '#fff'}"></span>`).join('');
      o.read.innerHTML = `<b>第 ${i + 1} / ${steps.length} 步</b>　${steps[i].cap}`;
    }
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      for (let k = 0; k <= i; k++) steps[k].draw(ctx, w, h, k < i ? 1 : ease(p), t);
    };
    animate(o, dt => {
      t += dt;
      if (p < 1) p = Math.min(1, p + dt / 1.1);
      else if (playing) { hold += dt; if (hold > 1.8) { hold = 0; if (i < steps.length - 1) { i++; p = 0; upd(); } else { playing = false; upd(); } } }
      o.draw();
    });
    upd();
  }

  /* ---------- 共用：凸透鏡／凹面鏡作圖的座標 ---------- */
  const optic = (w, h) => {
    const cy = h * 0.5, f = Math.min(w * 0.13, 95), oh = Math.min(h * 0.17, 46);
    return { cy, f, oh };
  };

  /* ========== 凸透鏡作圖（物體在 F～2F） ========== */
  W.stepsLens = el => {
    const G = (w, h) => { const { cy, f, oh } = optic(w, h), lx = w * 0.42, ox = lx - 1.5 * f, oy = cy - oh, ix = lx + 3 * f, iy = cy + 2 * oh; return { cy, f, oh, lx, ox, oy, ix, iy }; };
    player(el, '一步一步看：凸透鏡作圖（物體在 F 和 2F 之間）', [
      { cap: '先畫好主軸、凸透鏡、兩側的焦點 F 和 2F，再把物體（紫色箭頭）放在 F 和 2F 之間。', draw: (ctx, w, h, p) => {
        const g = G(w, h);
        line(ctx, 10, g.cy, w - 10, g.cy, '#cfc9dc', 1.5, [8, 6]);
        alpha(ctx, p, () => {
          ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.3)'; ctx.strokeStyle = LENS; ctx.lineWidth = 2.5; ctx.beginPath(); const hh = h * 0.42;
          ctx.moveTo(g.lx, g.cy - hh); ctx.quadraticCurveTo(g.lx + 18, g.cy, g.lx, g.cy + hh); ctx.quadraticCurveTo(g.lx - 18, g.cy, g.lx, g.cy - hh); ctx.fill(); ctx.stroke(); ctx.restore();
          for (const [x, s] of [[-1, 'F'], [1, 'F'], [-2, '2F'], [2, '2F']]) { dot(ctx, g.lx + x * g.f, g.cy, 4, INK); txt(ctx, s, g.lx + x * g.f, g.cy + 16, INK, 12, 'center', 900); }
        });
        vArrow(ctx, g.ox, g.cy, g.oy, PURPLE, 5, false, p); if (p > 0.6) txt(ctx, '物體', g.ox - 22, g.oy + 4, PURPLE, 12, 'center', 900);
      } },
      { cap: '光線 ①：從物體頂端<b>平行主軸</b>射向透鏡，折射後<b>通過另一側的焦點 F</b>。', draw: (ctx, w, h, p) => { const g = G(w, h); path(ctx, [[g.ox, g.oy], [g.lx, g.oy], [g.ix + 0.4 * g.f, g.iy + (g.iy - g.oy) / (g.ix - g.lx) * 0.4 * g.f]], p, RED, 2.5, null, true); } },
      { cap: '光線 ②：<b>通過這一側的焦點 F</b> 射向透鏡，折射後變成<b>平行主軸</b>。', draw: (ctx, w, h, p) => { const g = G(w, h); path(ctx, [[g.ox, g.oy], [g.lx, g.iy], [g.ix + 0.4 * g.f, g.iy]], p, BLUE, 2.5, null, true); } },
      { cap: '光線 ③（可以用來檢查）：通過<b>透鏡中心（光心）</b>的光，<b>直直前進不偏折</b>。', draw: (ctx, w, h, p) => { const g = G(w, h); const k = 1.15; path(ctx, [[g.ox, g.oy], [g.ox + (g.ix - g.ox) * k, g.oy + (g.iy - g.oy) * k]], p, GREEN, 2, [7, 5], true); } },
      { cap: '三條光線<b>真的交在同一點</b> → 那裡就是像的頂端。光線真的會聚，所以是<b>實像</b>，放一張紙就接得到。', draw: (ctx, w, h, p, t) => { const g = G(w, h); vArrow(ctx, g.ix, g.cy, g.iy, ORANGE, 5, false, p); if (p > 0.5) { dot(ctx, g.ix, g.iy, 6 + Math.sin(t * 6) * 1.5, '#fff', ORANGE); txt(ctx, '實像', g.ix + 26, g.iy - 4, ORANGE, 13, 'center', 900); } } },
      { cap: '結論：物體在 F～2F → 像在另一側 2F 以外，<b>倒立、放大、實像</b>。投影機、幻燈機就是這樣。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#fff8d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(w - 168, 10, 158, 34); ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, '倒立・放大・實像', w - 89, 27, RED, 14, 'center', 900); }); } },
    ]);
  };

  /* ========== 凹面鏡作圖（物體在 C 以外） ========== */
  W.stepsMirror = el => {
    const G = (w, h) => { const { cy, f, oh } = optic(w, h), mx = w * 0.8, ox = mx - 2.5 * f, oy = cy - oh * 1.1, ix = mx - 5 / 3 * f, iy = cy + (cy - oy) * 2 / 3; return { cy, f, mx, ox, oy, ix, iy }; };
    player(el, '一步一步看：凹面鏡作圖（物體在球心 C 以外）', [
      { cap: '畫出主軸、凹面鏡、焦點 F 和球心 C（C 到鏡面的距離 = 2 倍焦距）。物體放在 C 的外面。', draw: (ctx, w, h, p) => {
        const g = G(w, h), hh = h * 0.42;
        line(ctx, 10, g.cy, w - 10, g.cy, '#cfc9dc', 1.5, [8, 6]);
        alpha(ctx, p, () => {
          ctx.save(); ctx.strokeStyle = LENS; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(g.mx - 10, g.cy - hh); ctx.quadraticCurveTo(g.mx + 10, g.cy, g.mx - 10, g.cy + hh); ctx.stroke(); ctx.restore();
          for (let y = -hh + 8; y < hh; y += 12) line(ctx, g.mx + 4, g.cy + y, g.mx + 13, g.cy + y + 7, '#9fb7e8', 1.5);
          dot(ctx, g.mx - g.f, g.cy, 4, INK); txt(ctx, 'F', g.mx - g.f, g.cy + 16, INK, 12, 'center', 900);
          dot(ctx, g.mx - 2 * g.f, g.cy, 4, INK); txt(ctx, 'C', g.mx - 2 * g.f, g.cy + 16, INK, 12, 'center', 900);
        });
        vArrow(ctx, g.ox, g.cy, g.oy, PURPLE, 5, false, p); if (p > 0.6) txt(ctx, '物體', g.ox - 22, g.oy + 4, PURPLE, 12, 'center', 900);
      } },
      { cap: '光線 ①：<b>平行主軸</b>射向鏡面，反射後<b>通過焦點 F</b>。', draw: (ctx, w, h, p) => { const g = G(w, h); path(ctx, [[g.ox, g.oy], [g.mx, g.oy], [g.ix - 0.5 * g.f, g.iy + (g.iy - g.oy) / (g.mx - g.ix) * 0.5 * g.f]], p, RED, 2.5, null, true); } },
      { cap: '光線 ②：<b>通過焦點 F</b> 射向鏡面，反射後<b>平行主軸</b>回來。', draw: (ctx, w, h, p) => { const g = G(w, h); path(ctx, [[g.ox, g.oy], [g.mx, g.iy], [g.ix - 0.6 * g.f, g.iy]], p, BLUE, 2.5, null, true); } },
      { cap: '兩條反射光<b>真的交會</b>在鏡子前方 → 那裡就是像的頂端，是<b>實像</b>（在 F 和 C 之間）。', draw: (ctx, w, h, p, t) => { const g = G(w, h); vArrow(ctx, g.ix, g.cy, g.iy, ORANGE, 5, false, p); if (p > 0.5) { dot(ctx, g.ix, g.iy, 6 + Math.sin(t * 6) * 1.5, '#fff', ORANGE); txt(ctx, '實像', g.ix - 28, g.iy + 4, ORANGE, 13, 'center', 900); } } },
      { cap: '結論：物體在 C 以外 → <b>倒立、縮小、實像</b>，在鏡前 F 和 C 之間。反射式望遠鏡用的就是這個。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#fff8d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(10, 10, 158, 34); ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, '倒立・縮小・實像', 89, 27, RED, 14, 'center', 900); }); } },
    ]);
  };

  /* ========== 平面鏡成像 ========== */
  W.stepsPlane = el => {
    const G = (w, h) => { const mx = w * 0.5, d = Math.min(w * 0.22, 170), ox = mx - d, ix = mx + d, gy = h - 26, oh = h * 0.42, ex = mx - d * 0.55, ey = gy - oh * 1.15; return { mx, d, ox, ix, gy, oh, ex, ey }; };
    player(el, '一步一步看：平面鏡怎麼成像', [
      { cap: '物體（蠟燭）放在平面鏡前面。', draw: (ctx, w, h, p) => {
        const g = G(w, h);
        line(ctx, 10, g.gy, w - 10, g.gy, '#e2dccd', 2);
        alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#d8e6f7'; ctx.fillRect(g.mx - 3, 16, 6, g.gy - 16); ctx.restore(); line(ctx, g.mx, 16, g.mx, g.gy, LENS, 3); txt(ctx, '平面鏡', g.mx, 10, LENS, 11, 'center', 900); });
        vArrow(ctx, g.ox, g.gy, g.gy - g.oh, PURPLE, 6, false, p); if (p > 0.6) txt(ctx, '物體', g.ox, g.gy + 14, PURPLE, 12, 'center', 900);
      } },
      { cap: '像在鏡子後面，和物體<b>對稱</b>：<b>像距 = 物距</b>，大小一樣。', draw: (ctx, w, h, p) => {
        const g = G(w, h);
        vArrow(ctx, g.ix, g.gy, g.gy - g.oh, ORANGE, 6, true, p);
        if (p > 0.6) { txt(ctx, '像', g.ix, g.gy + 14, ORANGE, 12, 'center', 900); line(ctx, g.ox, g.gy - 8, g.mx, g.gy - 8, MUTED, 1.5); line(ctx, g.mx, g.gy - 8, g.ix, g.gy - 8, MUTED, 1.5, [4, 4]); txt(ctx, '物距', (g.ox + g.mx) / 2, g.gy - 18, MUTED, 11); txt(ctx, '像距', (g.ix + g.mx) / 2, g.gy - 18, MUTED, 11); }
      } },
      { cap: '眼睛看向鏡子：大腦以為光是從<b>像</b>那裡直直射過來的（虛線只是「看起來」的路線）。', draw: (ctx, w, h, p) => {
        const g = G(w, h), ty = g.gy - g.oh, k = (g.mx - g.ex) / (g.ix - g.ex), py = g.ey + (ty - g.ey) * k;
        ctx.save(); ctx.font = '22px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = Math.min(1, p * 2); ctx.fillText('👁️', g.ex - 14, g.ey); ctx.restore();
        path(ctx, [[g.ix, ty], [g.mx, py]], p, 'rgba(255,140,26,.7)', 2, [6, 5]);
      } },
      { cap: '真正的光：從物體頂端射到鏡面，<b>反射</b>進眼睛，遵守<b>入射角 = 反射角</b>。', draw: (ctx, w, h, p) => {
        const g = G(w, h), ty = g.gy - g.oh, k = (g.mx - g.ex) / (g.ix - g.ex), py = g.ey + (ty - g.ey) * k;
        path(ctx, [[g.ox, ty], [g.mx, py], [g.ex, g.ey]], p, RED, 2.8, null, true);
      } },
      { cap: '結論：平面鏡成<b>正立、等大、左右相反</b>的<b>虛像</b>，像距 = 物距；虛像不是光真的會聚，所以屏幕接不到。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#fff8d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(w - 196, 26, 186, 34); ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, '正立・等大・左右相反・虛像', w - 103, 43, RED, 12, 'center', 900); }); } },
    ]);
  };

  /* ========== 電解水 ========== */
  W.stepsWater = el => {
    const G = (w, h) => { const bx = w * 0.5, bw = Math.min(w * 0.6, 340), top = 24, bot = h - 30, tl = bx - bw * 0.22, tr = bx + bw * 0.22; return { bx, bw, top, bot, tl, tr }; };
    const tube = (ctx, g, x, gas, col, lab) => {
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(x - 16, g.top, 32, g.bot - g.top - 30); ctx.restore();
      if (gas > 0) { ctx.save(); ctx.fillStyle = col; ctx.fillRect(x - 14, g.top + 2, 28, gas); ctx.restore(); }
      if (lab) txt(ctx, lab, x, g.top - 10, INK, 12, 'center', 900);
    };
    const base = (ctx, w, h, gl, gr, t, bub) => {
      const g = G(w, h);
      ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.28)'; ctx.fillRect(g.bx - g.bw / 2, g.top + 40, g.bw, g.bot - g.top - 40); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.strokeRect(g.bx - g.bw / 2, g.top + 40, g.bw, g.bot - g.top - 40); ctx.restore();
      tube(ctx, g, g.tl, gl, 'rgba(255,255,255,.95)', '負極（−）'); tube(ctx, g, g.tr, gr, 'rgba(255,255,255,.95)', '正極（+）');
      line(ctx, g.tl, g.bot - 26, g.tl, g.bot - 6, '#555', 6); line(ctx, g.tr, g.bot - 26, g.tr, g.bot - 6, '#555', 6);
      if (bub) for (let k = 0; k < 8; k++) { const ph = (t * 0.8 + k / 8) % 1; dot(ctx, g.tl - 6 + (k % 3) * 6, g.bot - 30 - ph * (g.bot - g.top - 60 - gl), 2.5, '#fff', '#7fa0dc'); if (k % 2 === 0) dot(ctx, g.tr - 4 + (k % 4) * 3, g.bot - 30 - ((ph + 0.3) % 1) * (g.bot - g.top - 60 - gr), 2.5, '#fff', '#7fa0dc'); }
      return g;
    };
    let gasL = 0, gasR = 0;
    player(el, '一步一步看：電解水', [
      { cap: '水裡加一點點<b>氫氧化鈉（或硫酸）</b>，讓水比較容易導電。兩根電極接上電池的正、負極。', draw: (ctx, w, h, p, t) => { gasL = 0; gasR = 0; base(ctx, w, h, 0, 0, t, false); } },
      { cap: '通電後，<b>兩個電極都冒出氣泡</b>——水被電分解了（電能 → 化學能）。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); gasL = 30 * p; gasR = 15 * p; base(ctx, w, h, gasL, gasR, t, true); } },
      { cap: '收集到的氣體：<b>負極那邊的體積是正極的 2 倍</b>（氫：氧 = 2：1）。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = G(w, h), H = (g.bot - g.top - 60) * 0.7; gasL = 30 + (H - 30) * p; gasR = 15 + (H / 2 - 15) * p; base(ctx, w, h, gasL, gasR, t, true); if (p > 0.8) { txt(ctx, '2 份', g.tl - 38, g.top + gasL / 2, RED, 13, 'center', 900); txt(ctx, '1 份', g.tr + 38, g.top + gasR / 2, RED, 13, 'center', 900); } } },
      { cap: '檢驗：負極的氣體點火會發出<b>「啵」的爆鳴聲 → 氫氣</b>；正極的氣體讓<b>線香復燃 → 氧氣</b>。', draw: (ctx, w, h, p) => { const g = G(w, h); alpha(ctx, p, () => { txt(ctx, '🔥 啵！氫氣', g.tl - 10, g.top + 20, ORANGE, 13, 'center', 900); txt(ctx, '✨ 復燃！氧氣', g.tr + 14, g.top + 20, GREEN, 13, 'center', 900); }); } },
      { cap: '結論：<b>2H₂O → 2H₂ + O₂</b>。水可以被分解成兩種元素，證明水是<b>化合物</b>。口訣：<b>負氫正氧、氫二氧一</b>。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#fff8d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(w / 2 - 110, h - 26, 220, 24); ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, '2H₂O → 2H₂ + O₂', w / 2, h - 14, RED, 14, 'center', 900); }); } },
    ], 280, 0.55);
  };

  /* ========== 酸鹼中和（粒子） ========== */
  W.stepsNeutral = el => {
    const ion = (ctx, x, y, s, fill, a) => { alpha(ctx, a == null ? 1 : a, () => { dot(ctx, x, y, 15, fill, INK); txt(ctx, s, x, y, INK, 11, 'center', 900); }); };
    const P = (w, h) => { const cx = w / 2, cy = h / 2 + 8, sx = Math.min(w * 0.11, 70); return [0, 1, 2].map(k => ({ hx: cx - 2.4 * sx, hy: cy - sx + k * sx * 0.95, cx2: cx - 1.4 * sx, ohx: cx + 2.4 * sx, nax: cx + 1.4 * sx, y: cy - sx + k * sx * 0.95, mx: cx, my: cy - sx + k * sx * 0.95 })); };
    player(el, '一步一步看：酸鹼中和（鹽酸 + 氫氧化鈉）', [
      { cap: '鹽酸在水中解離成 <b>H⁺</b> 和 <b>Cl⁻</b>：有 H⁺ 所以是<b>酸性</b>。', draw: (ctx, w, h, p) => { P(w, h).forEach(q => { ion(ctx, q.hx, q.y, 'H⁺', '#ffb3b3', p); ion(ctx, q.cx2, q.y, 'Cl⁻', '#d9f2c9', p); }); txt(ctx, '鹽酸 HCl', w * 0.22, 18, RED, 13, 'center', 900); } },
      { cap: '氫氧化鈉在水中解離成 <b>Na⁺</b> 和 <b>OH⁻</b>：有 OH⁻ 所以是<b>鹼性</b>。', draw: (ctx, w, h, p) => { P(w, h).forEach(q => { ion(ctx, q.ohx, q.y, 'OH⁻', '#b3ccff', p); ion(ctx, q.nax, q.y, 'Na⁺', '#e6d9ff', p); }); txt(ctx, '氫氧化鈉 NaOH', w * 0.78, 18, BLUE, 13, 'center', 900); } },
      { cap: '倒在一起：<b>H⁺ 和 OH⁻ 互相吸引、結合成水 H₂O</b>，同時會<b>放熱</b>。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); txt(ctx, '混合！', w / 2, 18, INK, 13, 'center', 900);
        P(w, h).forEach(q => { const hx = q.hx + (q.mx - 14 - q.hx) * p, ox = q.ohx + (q.mx + 14 - q.ohx) * p; ion(ctx, q.cx2, q.y + 26, 'Cl⁻', '#d9f2c9'); ion(ctx, q.nax, q.y + 26, 'Na⁺', '#e6d9ff');
          if (p < 1) { ion(ctx, hx, q.y, 'H⁺', '#ffb3b3'); ion(ctx, ox, q.y, 'OH⁻', '#b3ccff'); } else { dot(ctx, q.mx, q.y, 18, '#cfe8ff', INK); txt(ctx, 'H₂O', q.mx, q.y, INK, 11, 'center', 900); } });
        if (p >= 1) txt(ctx, '🔥 放熱', w / 2, h - 12 + Math.sin(t * 5), ORANGE, 12, 'center', 900); } },
      { cap: '剩下的 <b>Na⁺ 和 Cl⁻</b> 留在水裡 → 就是<b>食鹽水</b>。剛好完全中和時 <b>pH = 7（中性）</b>。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.strokeStyle = GREEN; ctx.lineWidth = 3; ctx.setLineDash([6, 5]); ctx.strokeRect(w / 2 - Math.min(w * 0.11, 70) * 2.1, h / 2 - Math.min(w * 0.11, 70) * 1.5, Math.min(w * 0.11, 70) * 4.2, Math.min(w * 0.11, 70) * 3.3); ctx.restore(); txt(ctx, '鹽 NaCl（食鹽）', w / 2, h - 30, GREEN, 13, 'center', 900); }); } },
      { cap: '結論：<b>酸 + 鹼 → 鹽 + 水</b>，本質是 <b>H⁺ + OH⁻ → H₂O</b>。胃藥中和胃酸、酸性土壤撒石灰都是中和。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#fff8d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(w / 2 - 130, 30, 260, 28); ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, 'HCl + NaOH → NaCl + H₂O', w / 2, 44, RED, 14, 'center', 900); }); } },
    ], 270, 0.5);
  };

  /* ========== 鋅銅電池 ========== */
  W.stepsCell = el => {
    const G = (w, h) => { const bw = Math.min(w * 0.3, 200), lx = w * 0.27, rx = w * 0.73, top = h * 0.38, bot = h - 14, wy = 26; return { bw, lx, rx, top, bot, wy }; };
    const scene = (ctx, w, h, opt) => {
      const g = G(w, h);
      [[g.lx, opt.znSol || 'rgba(220,220,230,.5)'], [g.rx, `rgba(80,140,255,${opt.blue == null ? 0.45 : opt.blue})`]].forEach(([x, c]) => { ctx.save(); ctx.fillStyle = c; ctx.fillRect(x - g.bw / 2, g.top + 16, g.bw, g.bot - g.top - 16); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - g.bw / 2, g.top); ctx.lineTo(x - g.bw / 2, g.bot); ctx.lineTo(x + g.bw / 2, g.bot); ctx.lineTo(x + g.bw / 2, g.top); ctx.stroke(); ctx.restore(); });
      const zw = 16 * (opt.thin == null ? 1 : opt.thin), cw = 16 + (opt.thick || 0);
      ctx.fillStyle = '#9aa1ad'; ctx.fillRect(g.lx - zw / 2, g.top - 18, zw, g.bot - g.top - 4); ctx.fillStyle = '#d08a4e'; ctx.fillRect(g.rx - cw / 2, g.top - 18, cw, g.bot - g.top - 4);
      txt(ctx, '鋅 Zn（負極）', g.lx, g.bot + 0 - (g.bot - g.top) - 30, INK, 12, 'center', 900); txt(ctx, '銅 Cu（正極）', g.rx, g.top - 30, INK, 12, 'center', 900);
      txt(ctx, '硫酸鋅', g.lx, g.bot - 12, MUTED, 11); txt(ctx, '硫酸銅', g.rx, g.bot - 12, '#2f50a8', 11);
      ctx.save(); ctx.strokeStyle = '#c9b38a'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(g.lx + g.bw * 0.3, g.bot - 26); ctx.lineTo(g.lx + g.bw * 0.3, g.top - 6); ctx.lineTo(g.rx - g.bw * 0.3, g.top - 6); ctx.lineTo(g.rx - g.bw * 0.3, g.bot - 26); ctx.stroke(); ctx.restore();
      txt(ctx, '鹽橋', w / 2, g.top + 8, '#8a6d3b', 11);
      return g;
    };
    const wire = (ctx, g, w, on, t) => {
      line(ctx, g.lx, g.top - 18, g.lx, g.wy, INK, 2.5); line(ctx, g.lx, g.wy, g.rx, g.wy, INK, 2.5); line(ctx, g.rx, g.wy, g.rx, g.top - 18, INK, 2.5);
      if (on) { ctx.save(); ctx.fillStyle = 'rgba(255,214,60,.55)'; ctx.beginPath(); ctx.arc(w / 2, g.wy, 22, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      dot(ctx, w / 2, g.wy, 11, on ? '#fff3a6' : '#eee', INK);
      if (on) for (let k = 0; k < 6; k++) { const s = ((t * 0.35 + k / 6) % 1), L = (g.wy - (g.top - 18)) * 2 + (g.rx - g.lx); let d = s * L, x, y; if (d < g.top - 18 - g.wy) { x = g.lx; y = g.top - 18 - d; } else if ((d -= g.top - 18 - g.wy) < g.rx - g.lx) { x = g.lx + d; y = g.wy; } else { d -= g.rx - g.lx; x = g.rx; y = g.wy + d; } if (Math.abs(x - w / 2) > 14 || y !== g.wy) { dot(ctx, x, y, 5, '#ffe27a', INK); txt(ctx, 'e⁻', x, y - 11, INK, 9); } }
    };
    player(el, '一步一步看：鋅銅電池（化學能 → 電能）', [
      { cap: '鋅片放在硫酸鋅溶液、銅片放在硫酸銅溶液（藍色），中間用<b>鹽橋</b>連起來，再用導線接一顆燈泡。', draw: (ctx, w, h, p, t) => { alpha(ctx, p, () => { const g = scene(ctx, w, h, {}); wire(ctx, g, w, false, t); }); } },
      { cap: '鋅的<b>活性比銅大</b>：鋅原子<b>失去電子</b>變成 Zn²⁺ 溶到水裡（鋅被<b>氧化</b>），所以鋅是<b>負極</b>，會越來越薄。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = scene(ctx, w, h, { thin: 1 - 0.25 * p }); wire(ctx, g, w, false, t); for (let k = 0; k < 3; k++) { const yy = g.top + 40 + k * 30; const x = g.lx + 10 + 40 * p; alpha(ctx, p, () => { dot(ctx, x, yy, 9, '#d9dde6', INK); txt(ctx, 'Zn²⁺', x, yy, INK, 8, 'center', 900); }); } txt(ctx, 'Zn → Zn²⁺ + 2e⁻', g.lx, g.bot - 34, RED, 12, 'center', 900); } },
      { cap: '電子從<b>鋅（負極）經過導線流到銅（正極）</b>，燈泡亮了！（<b>電流方向和電子相反</b>：正極 → 負極）', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = scene(ctx, w, h, { thin: 0.75 }); wire(ctx, g, w, p > 0.2, t); txt(ctx, '電子 →', w / 2 + 50, g.wy - 14, INK, 12, 'center', 900); } },
      { cap: '銅片那邊，溶液中的 <b>Cu²⁺ 得到電子</b>變成銅附在銅片上（被<b>還原</b>），所以溶液的<b>藍色越來越淡</b>。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = scene(ctx, w, h, { thin: 0.75, blue: 0.45 - 0.3 * p, thick: 6 * p }); wire(ctx, g, w, true, t); txt(ctx, 'Cu²⁺ + 2e⁻ → Cu', g.rx, g.bot - 34, BLUE, 12, 'center', 900); } },
      { cap: '<b>鹽橋</b>裡的離子移動，讓兩杯溶液保持電中性，電流才能一直流。拿掉鹽橋，燈就熄了。', draw: (ctx, w, h, p, t) => { const g = G(w, h); for (let k = 0; k < 4; k++) { const s = (t * 0.4 + k / 4) % 1; dot(ctx, w / 2 - 60 + s * 120, g.top - 6, 4, k % 2 ? '#ff9db8' : '#9fc3ff', INK); } } },
      { cap: '結論：<b>活性大的金屬當負極、被氧化</b>；電子由負極經導線流向正極。電池把<b>化學能變成電能</b>，兩種金屬活性差越大，電壓越大。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = '#fff8d6'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.rect(w / 2 - 105, h - 34, 210, 26); ctx.fill(); ctx.stroke(); ctx.restore(); txt(ctx, '化學能 → 電能', w / 2, h - 21, RED, 14, 'center', 900); }); } },
    ], 300, 0.6);
  };

  /* ========== 對流 ========== */
  W.stepsConvect = el => {
    const G = (w, h) => { const bw = Math.min(w * 0.5, 300), bx = w / 2, top = 20, bot = h - 40; return { bw, bx, top, bot, hx: bx - bw * 0.25 }; };
    const pot = (ctx, g, heat, t) => {
      ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.3)'; ctx.fillRect(g.bx - g.bw / 2, g.top + 14, g.bw, g.bot - g.top - 14); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(g.bx - g.bw / 2, g.top); ctx.lineTo(g.bx - g.bw / 2, g.bot); ctx.lineTo(g.bx + g.bw / 2, g.bot); ctx.lineTo(g.bx + g.bw / 2, g.top); ctx.stroke(); ctx.restore();
      if (heat) for (let k = 0; k < 5; k++) { const fx = g.hx - 24 + k * 12, fh = 12 + 5 * Math.sin(t * 9 + k); ctx.save(); ctx.fillStyle = k % 2 ? '#ffb02e' : '#ff6a2b'; ctx.beginPath(); ctx.moveTo(fx - 6, g.bot + 22); ctx.quadraticCurveTo(fx, g.bot + 22 - fh * 2, fx + 6, g.bot + 22); ctx.fill(); ctx.restore(); }
    };
    const loop = (ctx, g, p, t) => {
      const L = g.bx - g.bw / 2 + 30, R = g.bx + g.bw / 2 - 30, T = g.top + 36, B = g.bot - 22, x1 = g.hx;
      path(ctx, [[x1, B], [x1, T]], p, RED, 3.5, null, true);
      return { L, R, T, B, x1 };
    };
    player(el, '一步一步看：對流（燒開水）', [
      { cap: '在鍋子的<b>左下方</b>加熱。', draw: (ctx, w, h, p, t) => { const g = G(w, h); pot(ctx, g, p > 0.3, t); } },
      { cap: '底部的水受熱 → <b>膨脹、密度變小</b> → <b>往上升</b>（紅色箭頭）。', draw: (ctx, w, h, p) => { const g = G(w, h); loop(ctx, g, p); txt(ctx, '熱水上升', g.hx + 34, g.top + 70, RED, 12, 'center', 900); } },
      { cap: '上面比較冷的水<b>密度比較大</b> → <b>往下沉</b>補上空位（藍色箭頭）。', draw: (ctx, w, h, p) => { const g = G(w, h), R = g.bx + g.bw / 2 - 34; path(ctx, [[g.hx + 10, g.top + 34], [R, g.top + 34], [R, g.bot - 22], [g.hx + 14, g.bot - 22]], p, BLUE, 3.5, null, true); txt(ctx, '冷水下沉', R - 40, (g.top + g.bot) / 2, BLUE, 12, 'center', 900); } },
      { cap: '一直循環，整鍋水就慢慢熱了——這就是<b>對流</b>，發生在<b>液體和氣體</b>。', draw: (ctx, w, h, p, t) => { const g = G(w, h), R = g.bx + g.bw / 2 - 34, pts = [[g.hx, g.bot - 22], [g.hx, g.top + 34], [R, g.top + 34], [R, g.bot - 22], [g.hx, g.bot - 22]]; for (let k = 0; k < 8; k++) { const s = (t * 0.18 + k / 8) % 1; let L = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); L += d; } let d = s * L, i = 0; while (d > seg[i]) { d -= seg[i]; i++; } const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * d / seg[i], y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * d / seg[i]; alpha(ctx, p, () => dot(ctx, x, y, 5, i === 0 ? '#ff9db8' : i === 2 ? '#9fc3ff' : '#fff', INK)); } } },
      { cap: '生活應用：<b>冷氣裝高處</b>（冷空氣下沉）、<b>暖氣放低處</b>（熱空氣上升）；海陸風、天氣變化也是大規模的對流。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { txt(ctx, '❄️ 冷氣：高處', w * 0.12, 30, BLUE, 13, 'center', 900); txt(ctx, '🔥 暖氣：低處', w * 0.12, h - 30, RED, 13, 'center', 900); }); } },
    ], 270, 0.55);
  };
})();
