/* 高一化學（第 1、2 章）的動畫。共用工具在 widgets.js 的 WIDGETS._u，一步一步播放器在 widgets-4.js（WIDGETS._player）。 */
(function () {
  const W = window.WIDGETS, U = W._u;
  const { setup, dom, animate, range, seg, btn, txt, line, arrow, dot } = U;
  const player = W._player, alpha = W._alpha;
  const INK = '#2b2540', MUTED = '#8a84a0', RED = '#ff4d6d', BLUE = '#3a86ff', GREEN = '#20b07a', ORANGE = '#ff8c1a', PURPLE = '#7b5cff';
  const box = (ctx, x, y, w, h, fill, stroke, r) => { ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = stroke || INK; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r || 8); else ctx.rect(x, y, w, h); ctx.fill(); if (stroke !== 'none') ctx.stroke(); ctx.restore(); };
  const note = (ctx, s, w, h, y) => { ctx.save(); ctx.font = `900 14px "Noto Sans TC",sans-serif`; const tw = Math.min(w - 20, ctx.measureText(s).width + 28); ctx.restore(); box(ctx, w / 2 - tw / 2, y - 14, tw, 28, '#fff8d6'); txt(ctx, s, w / 2, y, RED, 14, 'center', 900); };
  const atomBall = (ctx, x, y, r, fill, lab, size) => { dot(ctx, x, y, r, fill, INK); if (lab) txt(ctx, lab, x, y, INK, size || Math.max(9, r * 0.75), 'center', 900); };

  /* ================= 1-2 蒸餾 ================= */
  W.stepsDistill = el => {
    const G = (w, h) => {
      const fx = w * 0.2, fy = h * 0.62, fr = Math.min(h * 0.2, 46), cx1 = fx + 18, cy1 = fy - fr - 22, cx2 = w * 0.74, cy2 = h * 0.56;
      // 冷凝管：管線中間那一段；lo＝低的一端（靠錐形瓶，冷水進），hi＝高的一端（靠燒瓶，冷水出）
      const mx = (cx1 + cx2) / 2 + 10, my = (cy1 + cy2) / 2, ang = Math.atan2(cy2 - cy1, cx2 - cx1), L = Math.hypot(cx2 - cx1, cy2 - cy1) * 0.62;
      return { fx, fy, fr, neckTop: fy - fr - 40, cx1, cy1, cx2, cy2, rx: w * 0.84, ry: h - 20, mx, my, ang, L,
        lo: [mx + Math.cos(ang) * L / 2 - 14, my + Math.sin(ang) * L / 2], hi: [mx - Math.cos(ang) * L / 2 + 14, my - Math.sin(ang) * L / 2] };
    };
    const water = (ctx, g) => { arrow(ctx, g.lo[0], g.lo[1] + 40, g.lo[0], g.lo[1] + 14, BLUE, 2.5, 8); txt(ctx, '冷水進', g.lo[0], g.lo[1] + 50, BLUE, 11, 'center', 900); arrow(ctx, g.hi[0], g.hi[1] - 14, g.hi[0], g.hi[1] - 40, BLUE, 2.5, 8); txt(ctx, '冷水出', g.hi[0], g.hi[1] - 50, BLUE, 11, 'center', 900); };
    const flask = (ctx, g, liq, t, boil) => {
      ctx.save(); ctx.fillStyle = 'rgba(255,190,120,.35)'; ctx.beginPath(); ctx.arc(g.fx, g.fy, g.fr - 2, Math.PI * (0.12 + (1 - liq) * 0.38), Math.PI * (0.88 - (1 - liq) * 0.38)); ctx.closePath(); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(g.fx, g.fy, g.fr, -Math.PI * 0.42, Math.PI * 1.42); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.fx - 8, g.fy - g.fr + 3); ctx.lineTo(g.fx - 8, g.neckTop); ctx.moveTo(g.fx + 8, g.fy - g.fr + 3); ctx.lineTo(g.fx + 8, g.cy1 + 6); ctx.stroke(); ctx.restore();
      // 支管 → 冷凝管
      line(ctx, g.fx + 8, g.cy1, g.cx2, g.cy2, INK, 2.5);
      ctx.save(); ctx.translate(g.mx, g.my); ctx.rotate(g.ang); const L = g.L;
      ctx.fillStyle = 'rgba(120,190,255,.3)'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-L / 2, -12, L, 24); ctx.strokeRect(-L / 2, -12, L, 24); ctx.restore();
      txt(ctx, '冷凝管', g.mx, g.my - 24, MUTED, 11, 'center', 900);
      // 溫度計
      line(ctx, g.fx, g.neckTop - 26, g.fx, g.cy1 + 2, '#999', 3); dot(ctx, g.fx, g.cy1 + 2, 4, RED);
      // 沸石、火
      for (let k = 0; k < 3; k++) dot(ctx, g.fx - 12 + k * 12, g.fy + g.fr - 10, 3, '#888');
      if (boil != null) for (let k = 0; k < 5; k++) { const fx = g.fx - 20 + k * 10, fh = 10 + 4 * Math.sin(t * 9 + k); ctx.save(); ctx.fillStyle = k % 2 ? '#ffb02e' : '#ff6a2b'; ctx.beginPath(); ctx.moveTo(fx - 5, g.fy + g.fr + 22); ctx.quadraticCurveTo(fx, g.fy + g.fr + 22 - fh * 2, fx + 5, g.fy + g.fr + 22); ctx.fill(); ctx.restore(); }
      if (boil) for (let k = 0; k < 6; k++) { const ph = (t * 0.9 + k / 6) % 1; dot(ctx, g.fx - 15 + (k % 4) * 10, g.fy + g.fr * 0.5 - ph * g.fr * 0.6, 2.5, '#fff', '#c98'); }
      // 錐形瓶
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(g.rx - 8, g.ry - 48); ctx.lineTo(g.rx - 8, g.ry - 36); ctx.lineTo(g.rx - 28, g.ry); ctx.lineTo(g.rx + 28, g.ry); ctx.lineTo(g.rx + 8, g.ry - 36); ctx.lineTo(g.rx + 8, g.ry - 48); ctx.stroke(); ctx.restore();
    };
    let col = 0;
    player(el, '一步一步看：蒸餾（把酒精和水分開）', [
      { cap: '蒸餾瓶裡放<b>酒精和水的混合液</b>（不超過 2/3），加幾顆<b>沸石</b>防止突沸。溫度計的水銀球放在<b>支管口</b>，量的是蒸氣的溫度。', draw: (ctx, w, h, p, t) => { col = 0; alpha(ctx, p, () => { const g = G(w, h); flask(ctx, g, 0.62, t, null); txt(ctx, '沸石', g.fx + 30, g.fy + g.fr - 4, MUTED, 11); txt(ctx, '溫度計', g.fx - 34, g.neckTop - 14, MUTED, 11); }); } },
      { cap: '冷凝管的冷水<b>從低的一端（下面）進、高的一端（上面）出</b>，管子才會充滿冷水，冷卻效果最好。', draw: (ctx, w, h, p) => { const g = G(w, h); alpha(ctx, p, () => water(ctx, g)); } },
      { cap: '加熱後，<b>沸點低的酒精（78 °C）先汽化</b>。溫度計會停在 78 °C 左右一段時間。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = G(w, h); flask(ctx, g, 0.62 - 0.12 * p, t, true); water(ctx, g); txt(ctx, `${Math.round(25 + 53 * p)} °C`, g.fx - 36, g.cy1, RED, 14, 'center', 900); for (let k = 0; k < 4; k++) { const s = (t * 0.5 + k / 4) % 1; alpha(ctx, p, () => dot(ctx, g.fx + 8 + (g.cx2 - g.fx - 8) * s * 0.9, g.cy1 + (g.cy2 - g.cy1) * s * 0.9 - 2, 4, 'rgba(255,255,255,.95)', '#c9a')); } } },
      { cap: '酒精蒸氣進入冷凝管被冷卻，<b>液化</b>成液體流下來，收集在錐形瓶 → 這就是<b>餾出液</b>。', draw: (ctx, w, h, p, t) => { const g = G(w, h); col = p; for (let k = 0; k < 3; k++) { const s = (t * 0.7 + k / 3) % 1; dot(ctx, g.rx, g.cy2 + 14 + (g.ry - 40 - g.cy2 - 14) * s, 3, BLUE); } ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.5)'; const lv = 6 + 18 * p; ctx.beginPath(); ctx.moveTo(g.rx - 28 + lv * 0.55, g.ry - lv); ctx.lineTo(g.rx + 28 - lv * 0.55, g.ry - lv); ctx.lineTo(g.rx + 27, g.ry - 1); ctx.lineTo(g.rx - 27, g.ry - 1); ctx.fill(); ctx.restore(); line(ctx, g.cx2, g.cy2 + 6, g.rx, g.cy2 + 6, INK, 2.5); line(ctx, g.rx, g.cy2 + 6, g.rx, g.ry - 44, INK, 2.5); txt(ctx, '餾出液（酒精）', g.rx, g.ry - 62, BLUE, 11, 'center', 900); } },
      { cap: '原理：利用<b>沸點不同</b>分離互溶的液體。石油分餾、海水淡化、製造蒸餾水都是同樣道理。注意：<b>不可以蒸乾</b>。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => note(ctx, '沸點低的先跑出來', w, h, 18)); } },
    ], 290, 0.58);
  };

  /* ================= 實驗 1 萃取 ================= */
  W.stepsExtract = el => {
    const G = (w, h) => { const cx = w * 0.42, top = 16, bot = h - 40, bw = Math.min(w * 0.18, 70); return { cx, top, bot, bw }; };
    const funnel = (ctx, g, layers, shake, t) => {
      const dx = shake ? Math.sin(t * 20) * 6 : 0, cx = g.cx + dx, mid = (g.top + g.bot) / 2;
      // 外形：上窄下寬的梨形，下面接活栓
      const shape = () => { ctx.beginPath(); ctx.moveTo(cx - 8, g.top); ctx.lineTo(cx - 8, g.top + 18); ctx.quadraticCurveTo(cx - g.bw, mid - 10, cx - g.bw * 0.9, mid + 20); ctx.quadraticCurveTo(cx - g.bw * 0.6, g.bot - 30, cx - 5, g.bot - 14); ctx.lineTo(cx + 5, g.bot - 14); ctx.quadraticCurveTo(cx + g.bw * 0.6, g.bot - 30, cx + g.bw * 0.9, mid + 20); ctx.quadraticCurveTo(cx + g.bw, mid - 10, cx + 8, g.top + 18); ctx.lineTo(cx + 8, g.top); };
      ctx.save(); shape(); ctx.clip();
      layers.forEach(([y0, y1, c]) => { ctx.fillStyle = c; ctx.fillRect(cx - g.bw - 4, y0, g.bw * 2 + 8, y1 - y0); });
      ctx.restore();
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; shape(); ctx.stroke(); ctx.restore();
      line(ctx, cx, g.bot - 14, cx, g.bot + 10, INK, 4); box(ctx, cx - 12, g.bot - 6, 24, 8, '#ccc');
      box(ctx, cx - 10, g.top - 8, 20, 9, '#ddd');
      return { cx, mid };
    };
    player(el, '一步一步看：萃取（把碘從水裡抓出來）', [
      { cap: '分液漏斗裡裝<b>碘水</b>（碘溶在水裡，淡褐色）。碘在水裡溶得不多。', draw: (ctx, w, h, p, t) => { const g = G(w, h), m = (g.top + g.bot) / 2; alpha(ctx, p, () => funnel(ctx, g, [[m + 10, g.bot, 'rgba(200,140,60,.45)']], false, t)); txt(ctx, '碘水', g.cx + g.bw + 30, m + 40, '#a0622b', 13, 'center', 900); } },
      { cap: '加入<b>正己烷</b>：正己烷和水<b>不互溶</b>，而且密度比水小，浮在上層。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = G(w, h), m = (g.top + g.bot) / 2; funnel(ctx, g, [[m + 10, g.bot, 'rgba(200,140,60,.45)'], [m + 10 - 34 * p, m + 10, 'rgba(240,240,255,.9)']], false, t); txt(ctx, '正己烷（無色）', g.cx + g.bw + 44, m - 6, MUTED, 12, 'center', 900); txt(ctx, '碘水', g.cx + g.bw + 30, m + 40, '#a0622b', 13, 'center', 900); } },
      { cap: '蓋上塞子<b>上下搖動</b>，並且常常打開活栓<b>放氣</b>（正己烷揮發會讓壓力變大）。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = G(w, h), m = (g.top + g.bot) / 2; const mix = `rgba(${200 - 60 * p},${140 - 60 * p},${60 + 100 * p},.5)`; funnel(ctx, g, [[m - 24, g.bot, mix]], p < 0.95, t); txt(ctx, '搖一搖！', g.cx + g.bw + 34, m, ORANGE, 14, 'center', 900); if (Math.sin(t * 3) > 0.3) txt(ctx, '💨 放氣', g.cx - g.bw - 30, g.bot - 4, BLUE, 12, 'center', 900); } },
      { cap: '靜置後分成兩層：碘大部分跑到<b>上層正己烷</b>，變成<b>紫色</b>；下層的水顏色變淡。這就是<b>萃取</b>：碘在正己烷中溶解度比較大。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = G(w, h), m = (g.top + g.bot) / 2; funnel(ctx, g, [[m + 10, g.bot, `rgba(200,140,60,${0.45 - 0.33 * p})`], [m - 24, m + 10, `rgba(140,60,200,${0.25 + 0.5 * p})`]], false, t); txt(ctx, '上層：正己烷 + 碘（紫）', g.cx + g.bw + 70, m - 8, PURPLE, 12, 'center', 900); txt(ctx, '下層：水（變淡）', g.cx + g.bw + 56, m + 40, '#a0622b', 12, 'center', 900); } },
      { cap: '<b>下層</b>從下面的活栓放出，<b>上層</b>從上口倒出，兩層就分開了。原理：<b>溶質在兩種不互溶溶劑中的溶解度不同</b>。', draw: (ctx, w, h, p) => { const g = G(w, h); alpha(ctx, p, () => { arrow(ctx, g.cx, g.bot + 12, g.cx, g.bot + 34, BLUE, 2.5, 8); txt(ctx, '下層從活栓放出', g.cx + 60, g.bot + 26, BLUE, 11, 'center', 900); arrow(ctx, g.cx + 14, g.top - 4, g.cx + 44, g.top - 4, PURPLE, 2.5, 8); txt(ctx, '上層從上口倒', g.cx + 92, g.top - 4, PURPLE, 11, 'center', 900); }); } },
    ], 300, 0.6);
  };

  /* ================= 1-2 層析 ================= */
  W.chromo = el => {
    const o = setup(el, '層析：同一個墨水裡的不同成分，跑的速度不一樣（算 Rf 值）', 270, 0.52);
    const SETS = {
      pen: [['#f2b705', '黃色', 0.82], ['#ff4d6d', '紅色', 0.57], ['#3a6fd8', '藍色', 0.30]],
      leaf: [['#f0a500', '胡蘿蔔素', 0.93], ['#c9b400', '葉黃素', 0.62], ['#2e8b57', '葉綠素 a', 0.45], ['#7aa33a', '葉綠素 b', 0.33]],
    };
    let set = 'pen', s = 0, run = false;
    seg(o, [['pen', '黑色水性筆'], ['leaf', '菠菜葉色素']], 'pen', k => { set = k; s = 0; run = false; });
    const b = btn(o, '▶ 開始展開', () => { if (s >= 1) s = 0; run = !run; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const px = w * 0.3, pw = Math.min(110, w * 0.2), top = 14, bot = h - 16, liq = bot - 20, y0 = bot - 38, yMax = top + 18;
      const front = liq - (liq - yMax) * s;
      // 燒杯和溶劑
      ctx.save(); ctx.fillStyle = 'rgba(150,200,255,.35)'; ctx.fillRect(px - pw / 2 - 30, liq, pw + 60, bot - liq); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(px - pw / 2 - 30, top + 30); ctx.lineTo(px - pw / 2 - 30, bot); ctx.lineTo(px + pw / 2 + 30, bot); ctx.lineTo(px + pw / 2 + 30, top + 30); ctx.stroke(); ctx.restore();
      // 濾紙（濕的部分）
      ctx.save(); ctx.fillStyle = '#fff'; ctx.fillRect(px - pw / 2, top, pw, bot - 6 - top); ctx.fillStyle = 'rgba(150,200,255,.22)'; ctx.fillRect(px - pw / 2, front, pw, bot - 6 - front); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(px - pw / 2, top, pw, bot - 6 - top); ctx.restore();
      line(ctx, px - pw / 2 + 4, y0, px + pw / 2 - 4, y0, '#999', 1.5, [4, 3]); txt(ctx, '起始線（鉛筆）', px + pw / 2 + 70, y0, MUTED, 11);
      if (s > 0.02) { line(ctx, px - pw / 2 + 2, front, px + pw / 2 - 2, front, BLUE, 1.5, [2, 3]); txt(ctx, '溶劑前緣', px + pw / 2 + 52, front, BLUE, 11); }
      const comps = SETS[set], dS = Math.max(0, y0 - front);
      if (s < 0.04) dot(ctx, px, y0, 7, set === 'pen' ? '#333' : '#2f6a3a');
      else comps.forEach(([c, n, rf]) => { const y = y0 - rf * dS; ctx.save(); ctx.fillStyle = c; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(px, y, 9, 5 + 4 * s, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); if (s >= 1) txt(ctx, n, px - pw / 2 - 40, y, c, 11, 'center', 900); });
      // 右邊：Rf 計算
      const rx = Math.min(w - 120, px + pw / 2 + 150);
      if (s >= 1) { const full = 8.0; txt(ctx, `溶劑跑了 ${full.toFixed(1)} cm`, rx, top + 20, BLUE, 12, 'center', 900); comps.forEach(([c, n, rf], i) => txt(ctx, `${n}：${(rf * full).toFixed(1)} ÷ ${full.toFixed(1)} = ${rf.toFixed(2)}`, rx, top + 46 + i * 22, c, 12, 'center', 900)); }
      o.read.innerHTML = s < 1 ? '把樣品點在起始線上，濾紙下端泡在溶劑裡（<b>溶劑面要低於起始線</b>）。溶劑往上爬，帶著各成分一起跑。按「開始展開」看看。'
        : '各成分在溶劑（<b>移動相</b>）和濾紙（<b>固定相</b>）之間的吸附、溶解能力不同，所以跑得不一樣遠。<b>Rf = 成分移動距離 ÷ 溶劑移動距離</b>（0～1），同一條件下，同一種物質的 Rf 固定，可以用來辨認物質。';
    };
    animate(o, dt => { if (run) { s = Math.min(1, s + dt / 6); if (s >= 1) run = false; } const tt = run ? '⏸ 暫停' : s >= 1 ? '↺ 重新展開' : '▶ 開始展開'; if (b.textContent !== tt) b.textContent = tt; o.draw(); });
  };

  /* ================= 1-3 基本定律 ================= */
  W.laws = el => {
    const o = setup(el, '化學的基本定律：質量守恆、定比、倍比、氣體化合體積', 260, 0.52);
    let mode = 'mass', amt = 2;
    seg(o, [['mass', '質量守恆'], ['def', '定比定律'], ['mul', '倍比定律'], ['vol', '氣體體積']], 'mass', k => { mode = k; });
    range(o, '份量', 1, 4, 1, amt, v => { amt = v; return '× ' + v; });
    const mol = (ctx, x, y, parts, r) => parts.forEach(([dx, dy, c, l]) => atomBall(ctx, x + dx * r, y + dy * r, r, c, l, r * 0.8));
    const H = '#f4f4f8', O = '#ff8a8a', C = '#555a66', Mg = '#c7cbd6';
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const r = Math.min(13, w / 50);
      if (mode === 'mass') {
        // 密閉容器中：2Mg + O2 → 2MgO，前後兩邊天平一樣重
        const lx = w * 0.27, rx = w * 0.73, by = h * 0.62, mg = 24.3 * 2 * amt, ox = 32 * amt;
        [[lx, '反應前', false], [rx, '反應後', true]].forEach(([x, lab, after]) => {
          box(ctx, x - 90, by - 110, 180, 110, 'rgba(230,240,255,.6)'); txt(ctx, lab + '（密閉）', x, by - 124, INK, 13, 'center', 900);
          for (let k = 0; k < amt; k++) {
            const yy = by - 86 + k * 24;
            if (!after) { atomBall(ctx, x - 60, yy, r * 0.9, Mg, 'Mg'); atomBall(ctx, x - 30, yy, r * 0.9, Mg, 'Mg'); mol(ctx, x + 30, yy, [[-0.5, 0, O, 'O'], [0.5, 0, O, 'O']], r * 0.9); }
            else { mol(ctx, x - 40, yy, [[-0.5, 0, Mg, 'Mg'], [0.5, 0, O, 'O']], r * 0.9); mol(ctx, x + 30, yy, [[-0.5, 0, Mg, 'Mg'], [0.5, 0, O, 'O']], r * 0.9); }
          }
          line(ctx, x - 70, by + 18, x + 70, by + 18, INK, 4); line(ctx, x, by + 18, x, by + 40, INK, 4);
          txt(ctx, `${(mg + ox).toFixed(1)} g`, x, by + 52, RED, 14, 'center', 900);
        });
        arrow(ctx, w / 2 - 30, by - 55, w / 2 + 30, by - 55, ORANGE, 3, 10);
        o.read.innerHTML = `<b>質量守恆定律</b>（拉瓦節）：2Mg + O₂ → 2MgO，反應前 ${mg.toFixed(1)} + ${ox} = <b>${(mg + ox).toFixed(1)} g</b>，反應後也是 <b>${(mg + ox).toFixed(1)} g</b>。原子只是<b>重新排列</b>，種類和數目都沒變。（要在密閉容器裡秤，否則氣體跑進跑出會誤判。）`;
      } else if (mode === 'def') {
        const water = 9 * amt * 2, hm = water / 9, om = water * 8 / 9, bx = w * 0.15, bw = w * 0.6, y = h * 0.35;
        txt(ctx, `${water} g 的水`, w / 2, 22, INK, 14, 'center', 900);
        const sc = bw / 72;
        box(ctx, bx, y, hm * sc, 34, '#e8e8f2'); box(ctx, bx + hm * sc, y, om * sc, 34, O);
        txt(ctx, `H ${hm} g`, bx + hm * sc / 2, y + 52, INK, 12, 'center', 900); txt(ctx, `O ${om} g`, bx + hm * sc + om * sc / 2, y + 17, INK, 13, 'center', 900);
        txt(ctx, `H : O = ${hm} : ${om} = 1 : 8`, w / 2, h - 30, RED, 16, 'center', 900);
        for (let k = 0; k < Math.min(amt * 2, 8); k++) mol(ctx, bx + 20 + k * r * 4.6, y - 32, [[0, 0, O, 'O'], [-0.8, 0.7, H, 'H'], [0.8, 0.7, H, 'H']], r * 0.7);
        o.read.innerHTML = '<b>定比定律</b>（普魯斯特）：不管水從哪裡來、有多少，<b>氫和氧的質量比永遠是 1 : 8</b>。化合物的組成固定。（混合物就沒有固定比例。）';
      } else if (mode === 'mul') {
        const bx = w * 0.14, sc = (w * 0.6) / 44, y1 = h * 0.28, y2 = h * 0.58;
        [[y1, 'CO（一氧化碳）', 16], [y2, 'CO₂（二氧化碳）', 32]].forEach(([y, n, om]) => {
          txt(ctx, n, bx, y - 22, INK, 13, 'left', 900);
          box(ctx, bx, y, 12 * sc, 30, '#9aa0ab'); box(ctx, bx + 12 * sc, y, om * sc, 30, O);
          txt(ctx, 'C 12 g', bx + 6 * sc, y + 15, '#fff', 12, 'center', 900); txt(ctx, `O ${om} g`, bx + 12 * sc + om * sc / 2, y + 15, INK, 12, 'center', 900);
        });
        txt(ctx, '和 12 g 碳結合的氧：16 : 32 = 1 : 2', w / 2, h - 22, RED, 15, 'center', 900);
        o.read.innerHTML = '<b>倍比定律</b>（道耳頓）：同樣兩種元素（C 和 O）形成兩種化合物，<b>固定碳的質量</b>時，和它結合的氧質量成<b>簡單整數比 1 : 2</b>。這支持「原子是一顆一顆、不能切一半」的原子說。';
      } else {
        // 每顆氣球 = 1 體積，裡面畫 1 個分子代表（同溫同壓同體積 → 分子數相同）
        const n = 5 * amt, gx = Math.min(70, (w - 60) / (n + 2)), y = h * 0.42, br = gx * 0.42;
        let x = (w - gx * (n + 2)) / 2 + gx / 2;
        txt(ctx, '同溫同壓，每一顆氣球體積一樣', w / 2, 16, MUTED, 12, 'center', 900);
        const balloon = (fill, draw) => { box(ctx, x - br, y - br * 1.3, br * 2, br * 2.6, fill, INK, br); draw(x, y); x += gx; };
        const rr = Math.min(10, br * 0.42);
        for (let k = 0; k < 2 * amt; k++) balloon('#f0f4ff', (cx, cy) => mol(ctx, cx, cy, [[-0.55, 0, H, 'H'], [0.55, 0, H, 'H']], rr));
        txt(ctx, '+', x - gx / 2 - gx * 0.0, y, INK, 18, 'center', 900); x += 0;
        for (let k = 0; k < amt; k++) balloon('#ffecec', (cx, cy) => mol(ctx, cx, cy, [[-0.55, 0, O, 'O'], [0.55, 0, O, 'O']], rr));
        arrow(ctx, x - gx * 0.45, y, x + gx * 0.45, y, ORANGE, 3, 9); x += gx;
        for (let k = 0; k < 2 * amt; k++) balloon('#eef8ff', (cx, cy) => mol(ctx, cx, cy, [[0, -0.3, O, 'O'], [-0.75, 0.45, H, 'H'], [0.75, 0.45, H, 'H']], rr * 0.85));
        txt(ctx, `${2 * amt} 體積 H₂ + ${amt} 體積 O₂ → ${2 * amt} 體積 H₂O(g)`, w / 2, h - 28, RED, 14, 'center', 900);
        o.read.innerHTML = '<b>氣體化合體積定律</b>（給呂薩克）：同溫同壓下，氣體反應的體積成<b>簡單整數比 2 : 1 : 2</b>。<b>亞佛加厥</b>提出「同溫同壓同體積的氣體含有相同數目的<b>分子</b>」，而且氫、氧是<b>雙原子分子</b>，才解釋得通。';
      }
    };
    o.draw();
  };

  /* ================= 1-4 原子模型的演進 ================= */
  W.stepsModels = el => {
    const R = (w, h) => Math.min(h * 0.32, w * 0.16);
    player(el, '一步一步看：原子模型怎麼演變', [
      { cap: '<b>道耳頓（1803）</b>：原子是<b>實心、不可分割</b>的小球。同元素的原子都一樣。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { const r = R(w, h); const g = ctx.createRadialGradient(w / 2 - r / 3, h / 2 - r / 3, 4, w / 2, h / 2, r); g.addColorStop(0, '#fff'); g.addColorStop(1, '#9aa3b5'); ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); txt(ctx, '實心球', w / 2, h - 14, INK, 13, 'center', 900); }); } },
      { cap: '<b>湯姆森（1897）</b>：陰極射線實驗發現<b>電子</b>（帶負電）。他想像原子是帶正電的「布丁」，電子像葡萄乾嵌在裡面。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const r = R(w, h); alpha(ctx, p, () => { dot(ctx, w / 2, h / 2, r, 'rgba(255,170,170,.55)', INK); for (let k = 0; k < 9; k++) { const a = k * 2.4, d = r * (0.25 + 0.6 * ((k * 37) % 10) / 10); dot(ctx, w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 6, '#6ea0ff', INK); txt(ctx, '−', w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, '#fff', 10, 'center', 900); } txt(ctx, '正電布丁 + 電子', w / 2, h - 14, INK, 13, 'center', 900); }); } },
      { cap: '<b>拉塞福（1911）</b>：α 粒子撞金箔，大多直接穿過、少數大角度反彈 → 原子<b>大部分是空的</b>，正電和質量集中在很小的<b>原子核</b>，電子在外面繞。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const r = R(w, h); alpha(ctx, p, () => { dot(ctx, w / 2, h / 2, 7, RED, INK); txt(ctx, '+', w / 2, h / 2, '#fff', 10, 'center', 900); for (let k = 0; k < 3; k++) { ctx.save(); ctx.strokeStyle = 'rgba(43,37,64,.25)'; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, r, r * 0.38, k * Math.PI / 3, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); const a = t * 2 + k * 2; const ex = Math.cos(a) * r, ey = Math.sin(a) * r * 0.38, c = Math.cos(k * Math.PI / 3), s = Math.sin(k * Math.PI / 3); dot(ctx, w / 2 + ex * c - ey * s, h / 2 + ex * s + ey * c, 5, '#6ea0ff', INK); } txt(ctx, '原子核（很小）', w / 2, h - 14, INK, 13, 'center', 900); }); } },
      { cap: '<b>波耳（1913）</b>：電子只能在<b>特定能量的軌道（能階）</b>上運動：K、L、M…層，每層最多 2n² 個電子。例如鈉：2、8、1。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const r = R(w, h); alpha(ctx, p, () => { dot(ctx, w / 2, h / 2, 9, RED, INK); txt(ctx, '11+', w / 2, h / 2, '#fff', 8, 'center', 900); [2, 8, 1].forEach((n, k) => { const rr = r * (0.38 + k * 0.31); ctx.save(); ctx.strokeStyle = 'rgba(43,37,64,.35)'; ctx.beginPath(); ctx.arc(w / 2, h / 2, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + k; dot(ctx, w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr, 4, '#6ea0ff', INK); } txt(ctx, 'KLM'[k], w / 2 + rr + 10, h / 2 - 8, MUTED, 11, 'center', 900); }); txt(ctx, '鈉 Na：2, 8, 1', w / 2, h - 14, INK, 13, 'center', 900); }); } },
      { cap: '<b>現代模型</b>：電子位置只能用<b>機率</b>描述，像一團「<b>電子雲</b>」，越濃的地方越可能找到電子。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const r = R(w, h); alpha(ctx, p, () => { for (let k = 0; k < 420; k++) { const a = (k * 137.5) * Math.PI / 180, d = r * Math.sqrt(-Math.log(1 - ((k * 0.618) % 1) * 0.98)) * 0.55; ctx.fillStyle = 'rgba(80,120,230,.35)'; ctx.fillRect(w / 2 + Math.cos(a) * d, h / 2 + Math.sin(a) * d, 2, 2); } dot(ctx, w / 2, h / 2, 5, RED); txt(ctx, '電子雲', w / 2, h - 14, INK, 13, 'center', 900); }); } },
    ], 260, 0.5);
  };

  /* ================= 1-4 拉塞福 α 粒子散射 ================= */
  W.rutherford = el => {
    const o = setup(el, '拉塞福的 α 粒子散射實驗：大部分穿過、少數反彈', 270, 0.52);
    let model = 'r', ps = [], cnt = { pass: 0, small: 0, big: 0 }, acc = 0, seed = 1;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    seg(o, [['r', '拉塞福模型（有原子核）'], ['t', '湯姆森模型（布丁）']], 'r', k => { model = k; ps = []; cnt = { pass: 0, small: 0, big: 0 }; });
    btn(o, '↺ 重新計數', () => { cnt = { pass: 0, small: 0, big: 0 }; }, true);
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const fx = w * 0.55;
      // 金箔：一排原子
      ctx.save(); ctx.fillStyle = 'rgba(255,214,60,.25)'; ctx.fillRect(fx - 10, 10, 20, h - 20); ctx.restore();
      for (let y = 22; y < h - 10; y += 26) { if (model === 't') dot(ctx, fx, y, 12, 'rgba(255,170,170,.5)'); else { ctx.save(); ctx.strokeStyle = 'rgba(43,37,64,.12)'; ctx.beginPath(); ctx.arc(fx, y, 12, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); dot(ctx, fx, y, 2.4, RED); } }
      txt(ctx, '金箔', fx, h - 4, '#b8860b', 11, 'center', 900);
      box(ctx, 8, h / 2 - 18, 40, 36, '#e8e1f5'); txt(ctx, 'α 源', 28, h / 2, PURPLE, 11, 'center', 900);
      ps.forEach(q => { ctx.save(); ctx.strokeStyle = q.big ? 'rgba(255,77,109,.6)' : 'rgba(123,92,255,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); q.tr.forEach((pt, i) => i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])); ctx.stroke(); ctx.restore(); dot(ctx, q.x, q.y, 3.5, q.big ? RED : PURPLE); });
      const tot = cnt.pass + cnt.small + cnt.big || 1;
      txt(ctx, `直直穿過 ${cnt.pass}`, w - 70, 20, PURPLE, 12, 'center', 900);
      txt(ctx, `小角度偏折 ${cnt.small}`, w - 70, 40, BLUE, 12, 'center', 900);
      txt(ctx, `大角度反彈 ${cnt.big}`, w - 70, 60, RED, 12, 'center', 900);
      o.read.innerHTML = model === 'r'
        ? `原子核很小，<b>大部分 α 粒子直直穿過</b>（${Math.round(cnt.pass / tot * 100)}%）；剛好靠近原子核的，被<b>帶正電的原子核</b>強烈排斥 → 大角度偏折甚至反彈。結論：原子大部分是空的、正電和質量集中在<b>很小的原子核</b>。`
        : '如果原子是正電均勻散開的「布丁」，排斥力很分散，<b>α 粒子應該全部幾乎直直穿過</b>，不會反彈。實驗卻看到少數反彈 → 湯姆森模型被推翻。';
    };
    animate(o, dt => {
      const w = o.W, h = o.H; if (!w) return;
      acc += dt; while (acc > 0.12) { acc -= 0.12; const y = h / 2 + (rnd() - 0.5) * (h - 30); ps.push({ x: 50, y, vx: 220, vy: 0, tr: [[50, y]], big: false, done: false }); }
      const fx = w * 0.55;
      ps.forEach(q => {
        const x0 = q.x; q.x += q.vx * dt; q.y += q.vy * dt;
        if (!q.done && x0 < fx && q.x >= fx) {
          // 穿過金箔那一刻：離最近原子核的距離 b 決定偏折角（拉塞福散射 θ = 2·atan(k/b)）
          q.done = true;
          const ny = 22 + Math.round((q.y - 22) / 26) * 26, b = Math.abs(q.y - ny) + 0.02;
          const th = model === 'r' ? 2 * Math.atan(0.12 / b) : (rnd() - 0.5) * 0.02, sg = q.y < ny ? -1 : 1, v = Math.hypot(q.vx, q.vy);
          q.vx = v * Math.cos(th); q.vy = v * Math.sin(th) * sg;
          const deg = th * 180 / Math.PI;
          if (deg > 45) { cnt.big++; q.big = true; } else if (deg > 3) cnt.small++; else cnt.pass++;
        }
        if (q.tr.length > 60) q.tr.shift(); q.tr.push([q.x, q.y]);
      });
      ps = ps.filter(q => q.x > -20 && q.x < w + 20 && q.y > -20 && q.y < h + 20).slice(-60);
      o.draw();
    });
  };

  /* ================= 1-5 週期表（前 20 個元素） ================= */
  W.ptable = el => {
    const o = dom(el, '週期表（前 20 個元素）：點一下看電子排列');
    const D = [
      ['H', '氫', 1.008, '非金屬'], ['He', '氦', 4.003, '惰性氣體'], ['Li', '鋰', 6.94, '鹼金屬'], ['Be', '鈹', 9.012, '鹼土金屬'], ['B', '硼', 10.81, '類金屬'],
      ['C', '碳', 12.01, '非金屬'], ['N', '氮', 14.01, '非金屬'], ['O', '氧', 16.00, '非金屬'], ['F', '氟', 19.00, '鹵素'], ['Ne', '氖', 20.18, '惰性氣體'],
      ['Na', '鈉', 22.99, '鹼金屬'], ['Mg', '鎂', 24.31, '鹼土金屬'], ['Al', '鋁', 26.98, '金屬'], ['Si', '矽', 28.09, '類金屬'], ['P', '磷', 30.97, '非金屬'],
      ['S', '硫', 32.07, '非金屬'], ['Cl', '氯', 35.45, '鹵素'], ['Ar', '氬', 39.95, '惰性氣體'], ['K', '鉀', 39.10, '鹼金屬'], ['Ca', '鈣', 40.08, '鹼土金屬'],
    ];
    const COL = { '鹼金屬': '#ffd1d1', '鹼土金屬': '#ffe3c2', '金屬': '#e3e6ee', '類金屬': '#e8f5c9', '非金屬': '#d7f3e6', '鹵素': '#d6ecff', '惰性氣體': '#ecdcff' };
    const shells = z => z <= 2 ? [z] : z <= 10 ? [2, z - 2] : z <= 18 ? [2, 8, z - 10] : [2, 8, 8, z - 18];
    const group = z => { const sh = shells(z), v = sh[sh.length - 1]; if (z === 2) return 18; return v <= 2 ? v : v + 10; };
    const pos = z => { const g = group(z), col = g <= 2 ? g : g - 10; return [shells(z).length, col]; };
    let sel = 11;
    o.body.innerHTML = `<div class="pt" style="display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:4px;max-width:520px"></div>
      <div style="display:flex;gap:14px;align-items:center;margin-top:10px;flex-wrap:wrap"><canvas style="width:150px;height:150px;flex:none;border:2px solid #d9e2f0;border-radius:12px;background:#fff"></canvas><div class="pi" style="min-width:0;flex:1"></div></div>`;
    const grid = o.body.querySelector('.pt'), cv = o.body.querySelector('canvas'), info = o.body.querySelector('.pi');
    const head = ['1', '2', '13', '14', '15', '16', '17', '18'];
    let html = head.map(g => `<div style="text-align:center;font-size:.72rem;color:#8a84a0;font-weight:700">${g} 族</div>`).join('');
    const cells = {};
    for (let z = 1; z <= 20; z++) cells[pos(z).join(',')] = z;
    for (let r = 1; r <= 4; r++) for (let c = 1; c <= 8; c++) {
      const z = cells[r + ',' + c];
      html += z ? `<button type="button" data-z="${z}" style="font:inherit;cursor:pointer;border:2px solid #2b2540;border-radius:8px;padding:2px 0;background:${COL[D[z - 1][3]]};line-height:1.1"><small style="font-size:.62rem;display:block">${z}</small><b style="font-size:1rem">${D[z - 1][0]}</b><small style="font-size:.62rem;display:block">${D[z - 1][1]}</small></button>` : '<span></span>';
    }
    grid.innerHTML = html;
    const ctx = cv.getContext('2d'), d = Math.min(2, window.devicePixelRatio || 1); cv.width = 150 * d; cv.height = 150 * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    function show() {
      const [sym, nm, m, cat] = D[sel - 1], sh = shells(sel), g = group(sel), v = sh[sh.length - 1];
      grid.querySelectorAll('[data-z]').forEach(b => { b.style.outline = +b.dataset.z === sel ? '3px solid #ff4d6d' : ''; });
      ctx.clearRect(0, 0, 150, 150); dot(ctx, 75, 75, 12, RED, INK); txt(ctx, sel + '+', 75, 75, '#fff', 9, 'center', 900);
      sh.forEach((n, k) => { const rr = 24 + k * 15; ctx.save(); ctx.strokeStyle = 'rgba(43,37,64,.3)'; ctx.beginPath(); ctx.arc(75, 75, rr, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 - Math.PI / 2; dot(ctx, 75 + Math.cos(a) * rr, 75 + Math.sin(a) * rr, 3.5, k === sh.length - 1 ? '#ff8c1a' : '#6ea0ff', INK); } });
      const ion = sel === 2 || sel === 10 || sel === 18 ? '很穩定，不容易形成離子' : (v <= 3 && sel > 2 ? `容易<b>失去 ${v} 個電子</b> → ${sym}${v > 1 ? v : ''}⁺` : sel === 1 ? '可失去 1 個電子成 H⁺，也可共用電子' : v >= 5 ? `容易<b>得到 ${8 - v} 個電子</b> → ${sym}${8 - v > 1 ? 8 - v : ''}⁻` : '多半和別的原子<b>共用電子</b>（共價鍵）');
      info.innerHTML = `<div style="font-size:1.25rem;font-weight:900">${nm} ${sym}　<small style="font-weight:700;color:#6d6782">原子序 ${sel}・原子量 ${m}</small></div>
        <div>第 <b>${sh.length}</b> 週期・第 <b>${g}</b> 族・<span style="background:${COL[cat]};padding:0 6px;border-radius:6px;border:1px solid #2b2540">${cat}</span></div>
        <div>電子排列：<b>${sh.join('、')}</b>（價電子 <b style="color:#ff8c1a">${v}</b> 個）</div><div>${ion}</div>`;
      o.read.innerHTML = '<b>週期</b>（橫列）= 電子層數；<b>族</b>（直行）看價電子數，同族化學性質相似。橘色的是最外層的<b>價電子</b>。';
    }
    grid.addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (!b) return; sel = +b.dataset.z; show(); });
    show();
  };

  /* ================= 2-1 化學鍵 ================= */
  W.stepsBonds = el => {
    const e = (ctx, x, y, c) => dot(ctx, x, y, 4, c || '#6ea0ff', INK);
    const shell = (ctx, x, y, r, n, c, start) => { ctx.save(); ctx.strokeStyle = 'rgba(43,37,64,.3)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); for (let i = 0; i < n; i++) { const a = (start || 0) + i / 8 * Math.PI * 2; e(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, c); } };
    player(el, '一步一步看：離子鍵、共價鍵、金屬鍵', [
      { cap: '<b>鈉</b>最外層只有 1 個電子，<b>氯</b>最外層有 7 個。原子都想讓最外層變成 <b>8 個</b>（八隅體，像惰性氣體一樣穩定）。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { const y = h * 0.45, r = Math.min(h * 0.28, 60); dot(ctx, w * 0.27, y, 12, '#c7cbd6', INK); txt(ctx, 'Na', w * 0.27, y, INK, 10, 'center', 900); shell(ctx, w * 0.27, y, r, 1, '#ff8c1a', Math.PI * 0.15); dot(ctx, w * 0.62, y, 12, '#b9f0b0', INK); txt(ctx, 'Cl', w * 0.62, y, INK, 10, 'center', 900); shell(ctx, w * 0.62, y, r * 0.85, 7, '#6ea0ff', Math.PI * 0.25); txt(ctx, '鈉 2,8,1', w * 0.27, h - 14, INK, 12, 'center', 900); txt(ctx, '氯 2,8,7', w * 0.62, h - 14, INK, 12, 'center', 900); }); } },
      { cap: '鈉把 1 個電子<b>給</b>氯 → 變成 <b>Na⁺</b> 和 <b>Cl⁻</b>，正負離子用<b>靜電引力</b>吸在一起，這就是<b>離子鍵</b>（金屬 + 非金屬，例：NaCl）。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const y = h * 0.45, r = Math.min(h * 0.28, 60), x0 = w * 0.27 + r * Math.cos(Math.PI * 0.15), y0 = y + r * Math.sin(Math.PI * 0.15), a = Math.PI * 0.25 + 7 / 8 * Math.PI * 2, x1 = w * 0.62 + r * 0.85 * Math.cos(a), y1 = y + r * 0.85 * Math.sin(a); dot(ctx, w * 0.27, y, 12, '#c7cbd6', INK); txt(ctx, p > 0.9 ? 'Na⁺' : 'Na', w * 0.27, y, INK, 10, 'center', 900); dot(ctx, w * 0.62, y, 12, '#b9f0b0', INK); txt(ctx, p > 0.9 ? 'Cl⁻' : 'Cl', w * 0.62, y, INK, 10, 'center', 900); shell(ctx, w * 0.62, y, r * 0.85, 7, '#6ea0ff', Math.PI * 0.25); e(ctx, x0 + (x1 - x0) * p, y0 + (y1 - y0) * p, '#ff8c1a'); if (p > 0.9) { txt(ctx, '+', w * 0.27, y - 30, RED, 22, 'center', 900); txt(ctx, '−', w * 0.62, y - r - 12, BLUE, 22, 'center', 900); note(ctx, '離子鍵：Na⁺ Cl⁻ 互相吸引', w, h, h - 16); } } },
      { cap: '兩個<b>氫原子</b>都想要 2 個電子 → 各拿出 1 個電子<b>共用</b>，形成 <b>H–H 共價鍵</b>（非金屬 + 非金屬，形成分子）。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const y = h * 0.45, d = (1 - p) * w * 0.18 + w * 0.06; [-1, 1].forEach(s => { const x = w / 2 + s * d; dot(ctx, x, y, 10, '#f4f4f8', INK); txt(ctx, 'H', x, y, INK, 10, 'center', 900); ctx.save(); ctx.strokeStyle = 'rgba(43,37,64,.3)'; ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }); e(ctx, w / 2, y - 8 - 20 * (1 - p), '#ff8c1a'); e(ctx, w / 2, y + 8 + 20 * (1 - p), '#6ea0ff'); if (p > 0.9) note(ctx, '共價鍵：共用一對電子 → H₂', w, h, h - 16); } },
      { cap: '<b>水 H₂O</b>：氧（6 個價電子）和兩個氫各共用一對電子，氧就有 8 個、氫各有 2 個。CO₂ 是<b>雙鍵</b>（O=C=O），N₂ 是<b>參鍵</b>（N≡N）。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); alpha(ctx, p, () => { const x = w * 0.35, y = h * 0.42; dot(ctx, x, y, 18, '#ff8a8a', INK); txt(ctx, 'O', x, y, INK, 13, 'center', 900); [[-1, 1], [1, 1]].forEach(([sx, sy]) => { const hx = x + sx * 42, hy = y + sy * 30; line(ctx, x, y, hx, hy, INK, 3); dot(ctx, hx, hy, 12, '#f4f4f8', INK); txt(ctx, 'H', hx, hy, INK, 11, 'center', 900); }); txt(ctx, 'H₂O（單鍵）', x, h - 14, INK, 12, 'center', 900); const cx = w * 0.72; [[-44, '#ff8a8a', 'O'], [0, '#555a66', 'C'], [44, '#ff8a8a', 'O']].forEach(([dx, c, l]) => { dot(ctx, cx + dx, y, 14, c, INK); txt(ctx, l, cx + dx, y, l === 'C' ? '#fff' : INK, 12, 'center', 900); }); [-1, 1].forEach(s => { line(ctx, cx + s * 14, y - 4, cx + s * 30, y - 4, INK, 2.5); line(ctx, cx + s * 14, y + 4, cx + s * 30, y + 4, INK, 2.5); }); txt(ctx, 'CO₂（雙鍵 O=C=O）', cx, h - 14, INK, 12, 'center', 900); }); } },
      { cap: '<b>金屬鍵</b>：金屬原子放出價電子，變成一排排<b>陽離子</b>，泡在自由移動的「<b>電子海</b>」裡 → 所以金屬能<b>導電、導熱、有延展性</b>。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); alpha(ctx, p, () => { const nx = 7, ny = 3, gx = w * 0.7 / nx, gy = h * 0.6 / ny, x0 = w * 0.15 + gx / 2, y0 = h * 0.15 + gy / 2; for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { dot(ctx, x0 + i * gx, y0 + j * gy, Math.min(gx, gy) * 0.3, '#c7cbd6', INK); txt(ctx, '+', x0 + i * gx, y0 + j * gy, INK, 12, 'center', 900); } for (let k = 0; k < 24; k++) { const xx = w * 0.15 + ((k * 53 + t * 60 * (1 + k % 3)) % (w * 0.7)), yy = h * 0.15 + ((k * 31) % (h * 0.6)); e(ctx, xx, yy + Math.sin(t * 3 + k) * 6, '#ffb84d'); } note(ctx, '陽離子 + 電子海', w, h, h - 16); }); } },
    ], 270, 0.52);
  };

  /* ================= 2-2 平衡化學反應式 ================= */
  W.balance = el => {
    const o = dom(el, '平衡化學反應式：按 ＋／－ 調係數，讓左右每種原子一樣多');
    const EQ = [
      { n: '氫氣燃燒', L: [['H₂', { H: 2 }], ['O₂', { O: 2 }]], R: [['H₂O', { H: 2, O: 1 }]], ans: [2, 1, 2] },
      { n: '合成氨', L: [['N₂', { N: 2 }], ['H₂', { H: 2 }]], R: [['NH₃', { N: 1, H: 3 }]], ans: [1, 3, 2] },
      { n: '甲烷燃燒', L: [['CH₄', { C: 1, H: 4 }], ['O₂', { O: 2 }]], R: [['CO₂', { C: 1, O: 2 }], ['H₂O', { H: 2, O: 1 }]], ans: [1, 2, 1, 2] },
      { n: '丙烷燃燒', L: [['C₃H₈', { C: 3, H: 8 }], ['O₂', { O: 2 }]], R: [['CO₂', { C: 1, O: 2 }], ['H₂O', { H: 2, O: 1 }]], ans: [1, 5, 3, 4] },
      { n: '鐵生鏽', L: [['Fe', { Fe: 1 }], ['O₂', { O: 2 }]], R: [['Fe₂O₃', { Fe: 2, O: 3 }]], ans: [4, 3, 2] },
      { n: '鋁和鹽酸', L: [['Al', { Al: 1 }], ['HCl', { H: 1, Cl: 1 }]], R: [['AlCl₃', { Al: 1, Cl: 3 }], ['H₂', { H: 2 }]], ans: [2, 6, 2, 3] },
    ];
    let k = 0, cf = [];
    const sel = document.createElement('select'); sel.innerHTML = EQ.map((q, i) => `<option value="${i}">${q.n}</option>`).join(''); o.ctl.appendChild(sel);
    const reset = btn(o, '↺ 重設', () => { cf = cf.map(() => 1); show(); }, true);
    const hint = btn(o, '💡 看答案', () => { cf = EQ[k].ans.slice(); show(); }, true);
    void reset; void hint;
    sel.addEventListener('change', () => { k = +sel.value; cf = EQ[k].L.concat(EQ[k].R).map(() => 1); show(); });
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    function show() {
      const q = EQ[k], all = q.L.concat(q.R), nL = q.L.length;
      const term = (s, i) => `<span style="display:inline-flex;align-items:center;gap:2px;white-space:nowrap"><button type="button" data-i="${i}" data-d="-1" class="wbtn ghost" style="padding:0 7px">−</button><b style="min-width:1.2em;text-align:center;font-size:1.2rem;color:#ff4d6d">${cf[i] === 1 ? '' : cf[i]}</b><b style="font-size:1.2rem">${s[0]}</b><button type="button" data-i="${i}" data-d="1" class="wbtn ghost" style="padding:0 7px">＋</button></span>`;
      const eq = all.map((s, i) => term(s, i) + (i < nL - 1 || (i >= nL && i < all.length - 1) ? '<b style="margin:0 4px">＋</b>' : i === nL - 1 ? '<b style="margin:0 6px;font-size:1.3rem">→</b>' : '')).join('');
      const els = [...new Set(all.flatMap(s => Object.keys(s[1])))];
      const cnt = side => els.map(e => side.reduce((a, s, j) => a + (s[1][e] || 0) * cf[side === q.L ? j : nL + j], 0));
      const L = cnt(q.L), R = cnt(q.R), ok = L.every((v, i) => v === R[i]), g = cf.reduce(gcd);
      o.body.innerHTML = `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:4px 0;padding:10px;background:#fff;border:2px solid #d9e2f0;border-radius:12px">${eq}</div>
        <table style="margin-top:10px;width:auto;min-width:0"><thead><tr><th>原子</th>${els.map(e => `<th>${e}</th>`).join('')}</tr></thead><tbody>
        <tr><td>左邊</td>${L.map(v => `<td>${v}</td>`).join('')}</tr><tr><td>右邊</td>${R.map(v => `<td>${v}</td>`).join('')}</tr>
        <tr><td></td>${L.map((v, i) => `<td>${v === R[i] ? '✅' : '❌'}</td>`).join('')}</tr></tbody></table>`;
      o.read.innerHTML = ok ? (g > 1 ? `平衡了，但係數可以再<b>約分</b>（都除以 ${g}），寫最簡整數比。` : '🎉 <b>平衡了！</b>左右每種原子都一樣多（原子不滅、質量守恆）。') :
        '小技巧：先平衡<b>最複雜的分子</b>裡的原子，<b>單質</b>（O₂、H₂、Fe）留到最後。只能改係數，<b>不能改下標</b>。';
    }
    o.body.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i; cf[i] = Math.max(1, Math.min(12, cf[i] + +b.dataset.d)); show(); });
    cf = EQ[0].L.concat(EQ[0].R).map(() => 1); show();
  };

  /* ================= 2-3 莫耳換算 ================= */
  W.mole = el => {
    const o = setup(el, '莫耳換算：質量 ↔ 莫耳數 ↔ 粒子數 ↔ 氣體體積', 230, 0.45);
    const S = { H2O: ['水 H₂O', 18.0, false], CO2: ['二氧化碳 CO₂', 44.0, true], O2: ['氧氣 O₂', 32.0, true], NaCl: ['食鹽 NaCl', 58.5, false], C: ['碳 C', 12.0, false] };
    let k = 'H2O', m = 36;
    seg(o, Object.keys(S).map(x => [x, S[x][0].split(' ')[1]]), 'H2O', v => { k = v; });
    range(o, '質量', 1, 120, 1, m, v => { m = v; return v + ' g'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const [nm, M, gas] = S[k], n = m / M, N = n * 6.02;
      const cols = [[`${m} g`, '質量', ORANGE], [n.toFixed(3) + ' mol', '莫耳數', RED], [`${N.toFixed(2)} × 10²³ 個`, '粒子數', PURPLE], [gas ? (n * 22.4).toFixed(1) + ' L' : '（不是氣體）', 'STP 體積', BLUE]];
      const bw = (w - 30) / 4;
      cols.forEach(([v, l, c], i) => { const x = 15 + i * bw + bw / 2; box(ctx, x - bw / 2 + 6, 24, bw - 12, 62, '#fff', c); txt(ctx, l, x, 40, MUTED, 11, 'center', 900); txt(ctx, v, x, 64, c, Math.min(16, bw / 7), 'center', 900); if (i < 3) arrow(ctx, x + bw / 2 - 8, 55, x + bw / 2 + 8, 55, INK, 2, 6); });
      txt(ctx, `÷ ${M}`, 15 + bw, 98, ORANGE, 11, 'center', 900); txt(ctx, '× 6.02×10²³', 15 + bw * 2, 98, PURPLE, 11, 'center', 900); txt(ctx, '× 22.4', 15 + bw * 3, 98, BLUE, 11, 'center', 900);
      // 一袋一袋：1 袋 = 1 mol
      const bags = Math.min(12, Math.ceil(n - 1e-9)), full = Math.floor(n + 1e-9), part = n - full;
      for (let i = 0; i < bags; i++) { const x = 30 + i * Math.min(48, (w - 60) / 12), y = h - 44, f = i < full ? 1 : part; box(ctx, x, y, 34, 34, '#f3efe6', INK, 10); ctx.save(); ctx.fillStyle = 'rgba(255,126,182,.55)'; ctx.fillRect(x + 2, y + 34 - 32 * f, 30, 32 * f); ctx.restore(); txt(ctx, f >= 1 ? '1' : f.toFixed(2), x + 17, y + 17, INK, 11, 'center', 900); }
      txt(ctx, '每一袋 = 1 mol = 6.02 × 10²³ 個', w / 2, h - 54, MUTED, 11, 'center', 900);
      o.read.innerHTML = `${nm} 的莫耳質量 <b>${M} g/mol</b>：${m} g ÷ ${M} = <b>${n.toFixed(3)} mol</b>，約 <b>${N.toFixed(2)} × 10²³</b> 個${k === 'NaCl' ? '（NaCl 是離子化合物，這裡算的是 NaCl「單位」）' : '分子'}。` + (gas ? `在 STP（0 °C、1 atm）下體積約 <b>${(n * 22.4).toFixed(1)} L</b>。` : '');
    };
    o.draw();
  };

  /* ================= 2-3 限量試劑 ================= */
  W.limit = el => {
    const o = setup(el, '限量試劑：2H₂ + O₂ → 2H₂O，誰先用完？', 260, 0.5);
    let a = 6, b = 2;
    range(o, 'H₂', 2, 12, 2, a, v => { a = v; return v + ' 個'; });
    range(o, 'O₂', 1, 8, 1, b, v => { b = v; return v + ' 個'; });
    const h2 = (ctx, x, y, r) => { atomBall(ctx, x - r * 0.55, y, r * 0.6, '#f4f4f8', 'H', 9); atomBall(ctx, x + r * 0.55, y, r * 0.6, '#f4f4f8', 'H', 9); };
    const o2 = (ctx, x, y, r) => { atomBall(ctx, x - r * 0.6, y, r * 0.7, '#ff8a8a', 'O', 9); atomBall(ctx, x + r * 0.6, y, r * 0.7, '#ff8a8a', 'O', 9); };
    const wat = (ctx, x, y, r) => { atomBall(ctx, x, y, r * 0.75, '#ff8a8a', 'O', 9); atomBall(ctx, x - r * 0.7, y + r * 0.55, r * 0.5, '#f4f4f8', 'H', 8); atomBall(ctx, x + r * 0.7, y + r * 0.55, r * 0.5, '#f4f4f8', 'H', 8); };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const water = Math.min(a, 2 * b), leftH = a - water, leftO = b - water / 2, r = Math.min(14, w / 40);
      const grid = (x0, x1, list) => { const cols = Math.max(2, Math.floor((x1 - x0) / (r * 3.4))); list.forEach(([f, hl], i) => { const x = x0 + r * 2 + (i % cols) * r * 3.4, y = 46 + Math.floor(i / cols) * r * 3; if (hl) { ctx.save(); ctx.fillStyle = 'rgba(255,214,60,.45)'; ctx.beginPath(); ctx.arc(x, y, r * 1.5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } f(ctx, x, y, r); }); };
      txt(ctx, '反應前', w * 0.22, 18, INK, 13, 'center', 900); txt(ctx, '反應後', w * 0.74, 18, INK, 13, 'center', 900);
      grid(10, w * 0.44, Array.from({ length: a }, () => [h2, false]).concat(Array.from({ length: b }, () => [o2, false])));
      arrow(ctx, w * 0.46, h / 2, w * 0.52, h / 2, ORANGE, 3, 10);
      grid(w * 0.53, w - 10, Array.from({ length: water }, () => [wat, false]).concat(Array.from({ length: leftH }, () => [h2, true])).concat(Array.from({ length: leftO }, () => [o2, true])));
      const lim = leftH === 0 && leftO === 0 ? '剛好完全反應' : leftH === 0 ? '<b>H₂ 是限量試劑</b>（先用完），O₂ 過量' : '<b>O₂ 是限量試劑</b>（先用完），H₂ 過量';
      txt(ctx, `生成 ${water} 個 H₂O`, w * 0.74, h - 16, BLUE, 13, 'center', 900);
      o.read.innerHTML = `${a} 個 H₂ + ${b} 個 O₂：係數比 H₂ : O₂ = 2 : 1。${lim}。` + (leftH + leftO ? `剩下（黃色圈）${leftH ? leftH + ' 個 H₂' : ''}${leftO ? leftO + ' 個 O₂' : ''}。` : '') + ' 判斷方法：各反應物的<b>莫耳數 ÷ 係數</b>，比較小的就是限量試劑，生成物的量由它決定。';
    };
    o.draw();
  };

  /* ================= 2-4 反應熱（能量圖） ================= */
  W.enthalpy = el => {
    const o = setup(el, '反應熱：放熱、吸熱和活化能（能量圖）', 260, 0.5);
    let type = 'exo', cat = false, t = 0;
    seg(o, [['exo', '放熱反應 ΔH < 0'], ['endo', '吸熱反應 ΔH > 0']], 'exo', v => { type = v; });
    seg(o, [['0', '沒有催化劑'], ['1', '加催化劑']], '0', v => { cat = v === '1'; });
    const curve = (w, h, peak) => { const R = type === 'exo' ? h * 0.52 : h * 0.72, P = type === 'exo' ? h * 0.8 : h * 0.4, x0 = 50, x1 = w - 30, pk = Math.min(R, P) - peak; return { R, P, x0, x1, pk, y: x => { const s = (x - x0) / (x1 - x0); if (s < 0.25) return R; if (s > 0.75) return P; const u = (s - 0.25) / 0.5; const base = R + (P - R) * (u * u * (3 - 2 * u)); return base - (base - pk) * Math.sin(Math.PI * u) * 1.0 + (0) ; } }; };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      line(ctx, 40, 12, 40, h - 22, INK, 2); line(ctx, 40, h - 22, w - 16, h - 22, INK, 2); arrow(ctx, 40, 30, 40, 10, INK, 2, 7);
      txt(ctx, '能量', 22, 20, MUTED, 11); txt(ctx, '反應進行 →', w - 60, h - 10, MUTED, 11);
      const c0 = curve(w, h, h * 0.3), c1 = curve(w, h, h * 0.12);
      const drawC = (c, col, dash) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; if (dash) ctx.setLineDash([6, 5]); ctx.beginPath(); for (let x = c.x0; x <= c.x1; x += 3) { const y = c.y(x); x === c.x0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); ctx.restore(); };
      drawC(c0, INK); if (cat) drawC(c1, GREEN, true);
      const c = cat ? c1 : c0;
      txt(ctx, '反應物', c0.x0 + 30, c0.R - 14, INK, 12, 'center', 900); txt(ctx, '生成物', c0.x1 - 30, c0.P - 14, INK, 12, 'center', 900);
      // 活化能
      const xp = (c0.x0 + c0.x1) / 2, ypk = Math.min(...Array.from({ length: 60 }, (_, i) => c.y(c0.x0 + (c0.x1 - c0.x0) * i / 59)));
      arrow(ctx, xp - 70, c0.R, xp - 70, ypk + 2, cat ? GREEN : ORANGE, 2.5, 8); txt(ctx, cat ? '活化能變小' : '活化能 Ea', xp - 70, ypk - 10, cat ? GREEN : ORANGE, 12, 'center', 900);
      line(ctx, c0.x0, c0.R, xp - 60, c0.R, '#bbb', 1, [4, 4]);
      // ΔH
      const xd = c0.x1 - 70; line(ctx, xp, c0.R, xd + 20, c0.R, '#bbb', 1, [4, 4]);
      arrow(ctx, xd, c0.R, xd, c0.P, type === 'exo' ? RED : BLUE, 3, 9); txt(ctx, type === 'exo' ? 'ΔH < 0 放熱' : 'ΔH > 0 吸熱', xd - 50, (c0.R + c0.P) / 2, type === 'exo' ? RED : BLUE, 12, 'center', 900);
      // 小球沿曲線跑
      const s = (t * 0.25) % 1, bx = c.x0 + (c.x1 - c.x0) * s; dot(ctx, bx, c.y(bx) - 8, 7, '#ffd23f', INK);
      o.read.innerHTML = (type === 'exo' ? '<b>放熱反應</b>：生成物能量比反應物<b>低</b>，多出的能量以熱放出，<b>ΔH < 0</b>（燃燒、中和、暖暖包）。' : '<b>吸熱反應</b>：生成物能量比反應物<b>高</b>，要從外界吸熱，<b>ΔH > 0</b>（光合作用、電解水、多數分解反應）。')
        + (cat ? ' <b>催化劑</b>只降低<b>活化能</b>、讓反應變快，<b>ΔH 不變</b>。' : ' 不管放熱或吸熱，都要先越過<b>活化能</b>這座小山才會反應（所以紙要點火才會燒）。');
    };
    animate(o, dt => { t += dt; o.draw(); });
  };
})();
