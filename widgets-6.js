/* 高一化學（第 3、4 章）的動畫。共用工具在 widgets.js（WIDGETS._u），一步一步播放器在 widgets-4.js（WIDGETS._player）。 */
(function () {
  const W = window.WIDGETS, U = W._u;
  const { setup, animate, range, seg, btn, txt, line, arrow, dot } = U;
  const player = W._player, alpha = W._alpha;
  const INK = '#2b2540', MUTED = '#8a84a0', RED = '#ff4d6d', BLUE = '#3a86ff', GREEN = '#20b07a', ORANGE = '#ff8c1a', PURPLE = '#7b5cff';
  const box = (ctx, x, y, w, h, fill, stroke, r) => { ctx.save(); ctx.fillStyle = fill; ctx.strokeStyle = stroke || INK; ctx.lineWidth = 2; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r || 8); else ctx.rect(x, y, w, h); ctx.fill(); if (stroke !== 'none') ctx.stroke(); ctx.restore(); };
  const note = (ctx, s, w, y) => { ctx.save(); ctx.font = `900 14px "Noto Sans TC",sans-serif`; const tw = Math.min(w - 20, ctx.measureText(s).width + 28); ctx.restore(); box(ctx, w / 2 - tw / 2, y - 14, tw, 28, '#fff8d6'); txt(ctx, s, w / 2, y, RED, 14, 'center', 900); };
  const lerp = (tab, x) => { for (let i = 1; i < tab.length; i++) if (x <= tab[i][0]) { const [x0, y0] = tab[i - 1], [x1, y1] = tab[i]; return y0 + (y1 - y0) * (x - x0) / (x1 - x0); } return tab[tab.length - 1][1]; };
  const mix = (c1, c2, f) => { const a = c1.match(/\w\w/g).map(h => parseInt(h, 16)), b = c2.match(/\w\w/g).map(h => parseInt(h, 16)); return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, f)))).join(',') + ')'; };
  const beaker = (ctx, x, y, bw, bh, fill, level) => {
    ctx.save(); ctx.fillStyle = fill; ctx.fillRect(x - bw / 2 + 2, y + bh * (1 - level), bw - 4, bh * level - 2); ctx.strokeStyle = INK; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - bw / 2 - 4, y); ctx.lineTo(x - bw / 2, y + 4); ctx.lineTo(x - bw / 2, y + bh); ctx.lineTo(x + bw / 2, y + bh); ctx.lineTo(x + bw / 2, y + 4); ctx.lineTo(x + bw / 2 + 4, y); ctx.stroke(); ctx.restore();
  };

  /* ================= 3-1、實驗 2 溶解度曲線 ================= */
  W.solubility = el => {
    const o = setup(el, '溶解度曲線：溫度變了，溶得下多少？', 270, 0.5);
    const DATA = {
      KNO3: ['硝酸鉀 KNO₃', [[0, 13.3], [10, 20.9], [20, 31.6], [30, 45.8], [40, 63.9], [50, 85.5], [60, 110], [70, 138], [80, 169], [90, 202], [100, 246]], ORANGE],
      NaCl: ['食鹽 NaCl', [[0, 35.7], [20, 36.0], [40, 36.6], [60, 37.3], [80, 38.4], [100, 39.8]], BLUE],
    };
    let k = 'KNO3', T = 60, m = 80;
    seg(o, [['KNO3', '硝酸鉀'], ['NaCl', '食鹽']], 'KNO3', v => { k = v; });
    range(o, '溫度', 0, 100, 1, T, v => { T = v; return v + ' °C'; });
    range(o, '加入', 5, 200, 5, m, v => { m = v; return v + ' g / 100 g 水'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const gx = 44, gy = h - 26, gw = w * 0.56, gh = h - 44, X = t => gx + t / 100 * gw, Y = s => gy - Math.min(s, 250) / 250 * gh;
      line(ctx, gx, gy, gx + gw, gy, INK, 1.5); line(ctx, gx, gy, gx, gy - gh, INK, 1.5);
      [0, 50, 100, 150, 200, 250].forEach(s => { line(ctx, gx, Y(s), gx + gw, Y(s), '#eee', 1); txt(ctx, s, gx - 16, Y(s), MUTED, 10); });
      [0, 20, 40, 60, 80, 100].forEach(t => txt(ctx, t, X(t), gy + 12, MUTED, 10));
      txt(ctx, '溫度（°C）', gx + gw - 30, gy - 10, MUTED, 10); txt(ctx, 'g / 100 g 水', gx + 40, 8, MUTED, 10);
      Object.keys(DATA).forEach(key => { const [nm, tab, c] = DATA[key]; ctx.save(); ctx.strokeStyle = c; ctx.globalAlpha = key === k ? 1 : 0.3; ctx.lineWidth = 3; ctx.beginPath(); for (let t = 0; t <= 100; t += 2) { const x = X(t), y = Y(lerp(tab, t)); t ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore(); txt(ctx, nm.split(' ')[0], X(100) - 30, Y(lerp(tab, 100)) - 10, c, 11, 'center', 900); });
      const [nm, tab, c] = DATA[k], S = lerp(tab, T), over = m - S;
      line(ctx, X(T), gy, X(T), Y(S), c, 1.5, [4, 4]);
      dot(ctx, X(T), Y(m), 7, over > 0.5 ? RED : GREEN, INK);
      // 右邊燒杯
      const bx = gx + gw + (w - gx - gw) / 2, bw = Math.min(110, (w - gx - gw) * 0.7), bh = h * 0.55, by = h * 0.2;
      beaker(ctx, bx, by, bw, bh, 'rgba(120,190,255,.3)', 0.8);
      if (over > 0.5) { const n = Math.min(40, Math.round(over / 3)); for (let i = 0; i < n; i++) { const x = bx - bw / 2 + 8 + ((i * 37) % (bw - 16)), y = by + bh - 6 - Math.floor(i / 8) * 5; ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = c; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); } }
      txt(ctx, `${T} °C`, bx, by - 12, INK, 13, 'center', 900);
      txt(ctx, over > 0.5 ? `析出 ${over.toFixed(0)} g` : Math.abs(over) <= 0.5 ? '剛好飽和' : '全部溶解', bx, by + bh + 16, over > 0.5 ? RED : GREEN, 13, 'center', 900);
      o.read.innerHTML = `${T} °C 時，${nm} 的溶解度約 <b>${S.toFixed(1)} g / 100 g 水</b>。加入 ${m} g：` + (over > 0.5 ? `已經<b>飽和</b>，多出的 <b>${over.toFixed(0)} g</b> 沉在杯底（點在曲線<b>上方</b>）。` : `<b>${Math.abs(over) <= 0.5 ? '剛好飽和' : '未飽和'}</b>，還溶得下 ${Math.max(0, -over).toFixed(0)} g（點在曲線下方）。`)
        + (k === 'KNO3' ? ' 硝酸鉀溶解度<b>隨溫度變化很大</b>，熱的飽和溶液冷卻就會析出晶體（<b>再結晶</b>）。' : ' 食鹽溶解度<b>幾乎不隨溫度改變</b>，所以海水曬鹽要靠<b>蒸發</b>，不是降溫。');
    };
    o.draw();
  };

  /* ================= 3-1 體積莫耳濃度 ================= */
  W.molarity = el => {
    const o = setup(el, '體積莫耳濃度：C = 溶質莫耳數 ÷ 溶液體積（L）', 250, 0.48);
    const S = { NaCl: ['氯化鈉 NaCl', 58.5], NaOH: ['氫氧化鈉 NaOH', 40.0], Glu: ['葡萄糖 C₆H₁₂O₆', 180] };
    let k = 'NaCl', m = 5.85, V = 500, add = 0;
    seg(o, [['NaCl', 'NaCl'], ['NaOH', 'NaOH'], ['Glu', '葡萄糖']], 'NaCl', v => { k = v; });
    range(o, '溶質', 1, 40, 0.05, m, v => { m = v; return v.toFixed(2) + ' g'; });
    range(o, '配成', 100, 1000, 50, V, v => { V = v; return v + ' mL'; });
    range(o, '再加水稀釋', 0, 1000, 50, add, v => { add = v; return '+' + v + ' mL'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const [nm, M] = S[k], n = m / M, C1 = n / (V / 1000), V2 = V + add, C2 = n / (V2 / 1000);
      const flask = (x, vol, C, lab) => {
        const r = Math.min(h * 0.24, 54), cy = h * 0.58, lv = Math.min(1, vol / 1500 + 0.25);
        ctx.save(); ctx.beginPath(); ctx.arc(x, cy, r, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = `rgba(80,140,255,${Math.min(0.85, 0.12 + C * 0.35)})`; ctx.fillRect(x - r, cy + r - 2 * r * lv, 2 * r, 2 * r * lv); ctx.restore();
        ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, cy, r, -Math.PI * 0.42, Math.PI * 1.42); ctx.moveTo(x - 9, cy - r + 2); ctx.lineTo(x - 9, cy - r - 46); ctx.moveTo(x + 9, cy - r + 2); ctx.lineTo(x + 9, cy - r - 46); ctx.stroke(); ctx.restore();
        txt(ctx, `${vol} mL`, x, cy - r - 56, MUTED, 11, 'center', 900); txt(ctx, `${C.toFixed(3)} M`, x, cy, INK, 14, 'center', 900); txt(ctx, lab, x, h - 10, INK, 12, 'center', 900);
      };
      flask(w * 0.28, V, C1, '配好的溶液');
      if (add > 0) { arrow(ctx, w * 0.42, h * 0.58, w * 0.56, h * 0.58, ORANGE, 3, 10); txt(ctx, `+${add} mL 水`, w * 0.49, h * 0.58 - 16, ORANGE, 11, 'center', 900); flask(w * 0.72, V2, C2, '稀釋後'); }
      o.read.innerHTML = `${m.toFixed(2)} g ${nm} = ${m.toFixed(2)} ÷ ${M} = <b>${n.toFixed(4)} mol</b>；配成 ${V} mL：C = ${n.toFixed(4)} ÷ ${(V / 1000).toFixed(3)} L = <b>${C1.toFixed(3)} M</b>。`
        + (add > 0 ? ` 稀釋時<b>溶質莫耳數不變</b>：C₁V₁ = C₂V₂ → ${C1.toFixed(3)} × ${V} = C₂ × ${V2}，C₂ = <b>${C2.toFixed(3)} M</b>。` : ' 注意 V 是<b>溶液</b>的體積，不是水的體積（用<b>定量瓶</b>加水到刻度線）。');
    };
    o.draw();
  };

  /* ================= 3-2 酸鹼滴定 ================= */
  W.titration = el => {
    const o = setup(el, '酸鹼滴定：用 0.1 M NaOH 滴定 25 mL 0.1 M 的酸（酚酞指示劑）', 280, 0.52);
    let acid = 'strong', V = 0, run = false;
    seg(o, [['strong', '強酸 HCl'], ['weak', '弱酸 醋酸']], 'strong', v => { acid = v; });
    const sl = range(o, '加入 NaOH', 0, 50, 0.1, V, v => { V = v; return v.toFixed(1) + ' mL'; });
    const b = btn(o, '▶ 自動滴', () => { if (V >= 50) { V = 0; } run = !run; });
    const pH = (v, a) => {
      const nA = 0.1 * 25e-3, nB = 0.1 * v / 1000, Vt = (25 + v) / 1000, Kw = 1e-14;
      if (a === 'strong') { const d = (nA - nB) / Vt, H = (d + Math.sqrt(d * d + 4 * Kw)) / 2; return -Math.log10(H); }
      const Ka = 1.8e-5;
      if (nB <= 1e-12) return -Math.log10(Math.sqrt(Ka * 0.1));
      if (nB < nA - 1e-9) return -Math.log10(Ka) + Math.log10(nB / (nA - nB));
      if (Math.abs(nB - nA) <= 1e-9) { const Cs = nA / Vt, OH = Math.sqrt(Kw / Ka * Cs); return 14 + Math.log10(OH); }
      const OH = (nB - nA) / Vt; return 14 + Math.log10(OH);
    };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const p = pH(V, acid);
      // 左：滴定管 + 錐形瓶
      const bx = w * 0.16, top = 10, bot = h * 0.52;
      box(ctx, bx - 8, top, 16, bot - top, '#f3f6ff'); ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.6)'; ctx.fillRect(bx - 6, top + 2 + (bot - top - 4) * V / 50, 12, (bot - top - 4) * (1 - V / 50)); ctx.restore();
      for (let i = 0; i <= 5; i++) { line(ctx, bx + 8, top + (bot - top) * i / 5, bx + 14, top + (bot - top) * i / 5, INK, 1); txt(ctx, i * 10, bx + 24, top + (bot - top) * i / 5, MUTED, 9); }
      line(ctx, bx, bot, bx, bot + 14, INK, 3);
      if (run) dot(ctx, bx, bot + 22 + (Date.now() / 6 % 14), 3, BLUE);
      const pink = p < 8.2 ? 0 : Math.min(1, (p - 8.2) / 1.8);
      const fy = h - 14, fw = Math.min(90, w * 0.2);
      ctx.save(); ctx.fillStyle = `rgba(255,${Math.round(240 - 150 * pink)},${Math.round(250 - 60 * pink)},${0.35 + 0.5 * pink})`; ctx.beginPath(); ctx.moveTo(bx - fw * 0.45, fy - 1); ctx.lineTo(bx - fw * 0.3, fy - 30); ctx.lineTo(bx + fw * 0.3, fy - 30); ctx.lineTo(bx + fw * 0.45, fy - 1); ctx.fill(); ctx.restore();
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(bx - 8, fy - 64); ctx.lineTo(bx - 8, fy - 50); ctx.lineTo(bx - fw / 2, fy); ctx.lineTo(bx + fw / 2, fy); ctx.lineTo(bx + 8, fy - 50); ctx.lineTo(bx + 8, fy - 64); ctx.stroke(); ctx.restore();
      // 右：滴定曲線
      const gx = w * 0.36, gy = h - 22, gw = w * 0.6, gh = h - 36, X = v => gx + v / 50 * gw, Y = q => gy - q / 14 * gh;
      line(ctx, gx, gy, gx + gw, gy, INK, 1.5); line(ctx, gx, gy, gx, gy - gh, INK, 1.5);
      [0, 7, 14].forEach(q => { line(ctx, gx, Y(q), gx + gw, Y(q), '#eee', 1); txt(ctx, 'pH ' + q, gx - 18, Y(q), MUTED, 9); });
      [0, 25, 50].forEach(v => txt(ctx, v + ' mL', X(v), gy + 11, MUTED, 9));
      ctx.save(); ctx.fillStyle = 'rgba(255,126,182,.12)'; ctx.fillRect(gx, Y(10), gw, Y(8.2) - Y(10)); ctx.restore(); txt(ctx, '酚酞變色', gx + gw - 32, Y(9.1), '#d6337a', 9);
      ctx.save(); ctx.strokeStyle = acid === 'strong' ? RED : ORANGE; ctx.lineWidth = 2.5; ctx.beginPath(); for (let v = 0; v <= V + 1e-9; v += 0.1) { const x = X(v), y = Y(pH(v, acid)); v ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
      line(ctx, X(25), gy, X(25), gy - gh, PURPLE, 1, [4, 4]); txt(ctx, '當量點', X(25) + 22, gy - gh + 8, PURPLE, 10, 'center', 900);
      dot(ctx, X(V), Y(p), 6, '#ffd23f', INK);
      const eq = Math.abs(V - 25) < 0.15;
      o.read.innerHTML = `加了 ${V.toFixed(1)} mL，<b>pH = ${p.toFixed(2)}</b>。` + (V < 24.9 ? '酸還沒中和完，酚酞<b>無色</b>。' : eq ? `<b>當量點</b>！酸的 H⁺ 莫耳數 = 鹼的 OH⁻ 莫耳數（0.1 × 25 = 0.1 × 25）。${acid === 'strong' ? '強酸強鹼的當量點 pH = 7。' : '弱酸強鹼生成的醋酸鈉偏鹼性，當量點 pH 約 8.7。'}` : '鹼過量，溶液變<b>粉紅色</b>。')
        + ' 注意當量點附近<b>多一滴，pH 就大跳</b>，所以要慢慢滴、搖勻。';
    };
    animate(o, dt => { if (run) { V = Math.min(50, V + dt * (Math.abs(V - 25) < 3 ? 1.5 : 6)); sl.value = V; sl.dispatchEvent(new Event('input')); if (V >= 50) run = false; } const t = run ? '⏸ 停' : V >= 50 ? '↺ 重來' : '▶ 自動滴'; if (b.textContent !== t) b.textContent = t; o.draw(); });
  };

  /* ================= 3-2、實驗 3 酸鹼指示劑 ================= */
  W.indicator = el => {
    const o = setup(el, '酸鹼指示劑：拉 pH，看各種指示劑變什麼顏色', 250, 0.5);
    let pHv = 7;
    range(o, 'pH', 0, 14, 0.1, pHv, v => { pHv = v; return v.toFixed(1) + (v < 7 ? '（酸性）' : v > 7 ? '（鹼性）' : '（中性）'); });
    const IND = [
      ['石蕊', [[0, 'e8424e'], [4.5, 'e8424e'], [6.4, '9b59b6'], [8.3, '3a6fd8'], [14, '3a6fd8']], '酸紅、鹼藍（4.5～8.3）'],
      ['酚酞', [[0, 'fbfbfd'], [8.2, 'fbfbfd'], [10, 'ff3fa4'], [14, 'ff3fa4']], '酸、中性無色，鹼粉紅（8.2～10）'],
      ['甲基橙', [[0, 'e8424e'], [3.1, 'e8424e'], [4.4, 'f7c600'], [14, 'f7c600']], '酸紅、鹼黃（3.1～4.4）'],
      ['BTB', [[0, 'f2d400'], [6.0, 'f2d400'], [6.8, '3fae5a'], [7.6, '2f6fd8'], [14, '2f6fd8']], '酸黃、中性綠、鹼藍（6.0～7.6）'],
      ['紫高麗菜汁', [[0, 'e0245a'], [2, 'e0245a'], [4, 'c2337a'], [6, '8e44ad'], [8, '3a6fd8'], [10, '1f9e8a'], [12, '58b947'], [14, 'f2d400']], '紅 → 紫 → 藍 → 綠 → 黃'],
    ];
    const col = (stops, x) => { for (let i = 1; i < stops.length; i++) if (x <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (x - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0] || 1)); return '#' + stops[stops.length - 1][1]; };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const n = IND.length, gw = w / n, tw = Math.min(46, gw * 0.5), top = 24, th = h - 80;
      IND.forEach(([nm, stops, d], i) => {
        const x = gw * i + gw / 2, c = col(stops, pHv);
        ctx.save(); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - tw / 2, top + th * 0.3); ctx.lineTo(x - tw / 2, top + th - tw / 2); ctx.arc(x, top + th - tw / 2, tw / 2, Math.PI, 0, true); ctx.lineTo(x + tw / 2, top + th * 0.3); ctx.closePath(); ctx.fill(); ctx.restore();
        ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - tw / 2, top); ctx.lineTo(x - tw / 2, top + th - tw / 2); ctx.arc(x, top + th - tw / 2, tw / 2, Math.PI, 0, true); ctx.lineTo(x + tw / 2, top); ctx.stroke(); ctx.restore();
        txt(ctx, nm, x, top + th + 16, INK, 12, 'center', 900);
      });
      // pH 色帶
      for (let x = 0; x < w - 20; x++) { const q = x / (w - 20) * 14; ctx.fillStyle = col(IND[4][1], q); ctx.fillRect(10 + x, h - 24, 1, 10); }
      dot(ctx, 10 + pHv / 14 * (w - 20), h - 19, 6, '#fff', INK);
      txt(ctx, '酸', 18, h - 6, RED, 10, 'center', 900); txt(ctx, '中性', w / 2, h - 6, MUTED, 10, 'center', 900); txt(ctx, '鹼', w - 18, h - 6, BLUE, 10, 'center', 900);
      o.read.innerHTML = `pH ${pHv.toFixed(1)}：` + IND.map(x => `<b>${x[0]}</b> ${x[2]}`).join('；') + '。「神奇的七個杯子」就是事先在杯子裡放不同的酸、鹼和指示劑，倒入溶液時依序變色。';
    };
    o.draw();
  };

  /* ================= 3-3 金屬活性（氧化還原） ================= */
  W.activity = el => {
    const o = setup(el, '金屬活性：把金屬放進溶液，會不會反應？', 260, 0.52);
    const ORDER = ['K', 'Ca', 'Na', 'Mg', 'Al', 'Zn', 'Fe', 'Sn', 'Pb', 'H', 'Cu', 'Hg', 'Ag', 'Au'];
    const MET = { Mg: ['鎂', '#c7cbd6', 2], Zn: ['鋅', '#a9b0bd', 2], Fe: ['鐵', '#6f747d', 2], Cu: ['銅', '#d08a4e', 2], Ag: ['銀', '#e8e8ee', 1] };
    const SOL = { Cu: ['硫酸銅 CuSO₄', 'rgba(70,130,255,.5)', 'Cu²⁺', 2], Ag: ['硝酸銀 AgNO₃', 'rgba(230,240,250,.6)', 'Ag⁺', 1], Zn: ['硫酸鋅 ZnSO₄', 'rgba(230,235,240,.6)', 'Zn²⁺', 2], H: ['稀鹽酸 HCl', 'rgba(220,250,230,.6)', 'H⁺', 1] };
    let m = 'Zn', s = 'Cu', t = 0, prog = 0;
    seg(o, Object.keys(MET).map(k => [k, MET[k][0]]), 'Zn', v => { m = v; prog = 0; });
    seg(o, Object.keys(SOL).map(k => [k, SOL[k][0].split(' ')[0]]), 'Cu', v => { s = v; prog = 0; });
    const react = () => m !== s && ORDER.indexOf(m) < ORDER.indexOf(s);
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const r = react(), bx = w * 0.3, bw = Math.min(160, w * 0.36), bh = h * 0.66, by = h * 0.24;
      let fill = SOL[s][1];
      if (r && s === 'Cu') fill = `rgba(70,130,255,${0.5 - 0.35 * prog})`;
      if (r && s === 'Ag' && m === 'Cu') fill = `rgba(70,130,255,${0.08 + 0.4 * prog})`;
      beaker(ctx, bx, by, bw, bh, fill, 0.82);
      // 金屬片
      const sx = bx, sw = 22, sy = by - 20, sh = bh - 6;
      ctx.save(); ctx.fillStyle = MET[m][1]; ctx.fillRect(sx - sw / 2, sy, sw, sh); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(sx - sw / 2, sy, sw, sh); ctx.restore();
      if (r && s !== 'H') { const c = s === 'Cu' ? '#b5652b' : '#555'; for (let i = 0; i < 26 * prog; i++) { const yy = by + bh * 0.25 + ((i * 41) % (bh * 0.7)), xx = sx + ((i % 2) ? sw / 2 + 2 : -sw / 2 - 2) + Math.sin(i) * 2; dot(ctx, xx, yy, s === 'Ag' ? 3 : 2.6, c); } }
      if (r && s === 'H') for (let k = 0; k < 8; k++) { const ph = (t * 0.7 + k / 8) % 1; dot(ctx, sx + (k % 2 ? 14 : -14), by + bh - 10 - ph * bh * 0.7, 3, '#fff', '#7fa0dc'); }
      txt(ctx, MET[m][0] + '片', sx, sy - 12, INK, 12, 'center', 900); txt(ctx, SOL[s][0], bx, by + bh + 14, INK, 11, 'center', 900);
      // 右：活性順序
      const ox = w * 0.6, ow = w * 0.38;
      txt(ctx, '活性大 ← → 活性小', ox + ow / 2, 22, MUTED, 11, 'center', 900);
      ORDER.forEach((e, i) => { const x = ox + (i + 0.5) * ow / ORDER.length, hi = e === m || e === s; dot(ctx, x, 46, hi ? 11 : 8, hi ? (e === m ? '#ffd23f' : '#9fc3ff') : '#f3efe6', INK); txt(ctx, e, x, 46, INK, hi ? 9 : 8, 'center', 900); });
      const ion = SOL[s][2];
      let eq = '';
      if (m === s) eq = '同一種金屬，不會反應。';
      else if (!r) eq = `<b>不反應</b>：${MET[m][0]}的活性比 ${s === 'H' ? '氫' : MET[s] ? MET[s][0] : s} 小，搶不走對方的電子。`;
      else { const ion2 = s === 'H' ? '2H⁺' : s === 'Ag' ? '2Ag⁺' : ion, prod = s === 'H' ? 'H₂↑' : s === 'Ag' ? '2Ag' : s; eq = `<b>會反應</b>：${m} + ${ion2} → ${m}²⁺ + ${prod}。${MET[m][0]}<b>失去電子被氧化</b>（是還原劑）；${ion}<b>得到電子被還原</b>（是氧化劑）。` + (s === 'Cu' ? '藍色變淡、表面長出紅棕色的銅。' : s === 'Ag' ? '表面長出灰黑色的銀' + (m === 'Cu' ? '，溶液慢慢變藍（生成 Cu²⁺）。' : '。') : s === 'H' ? '冒出氫氣泡泡。' : '表面析出灰色的鋅。'); }
      o.read.innerHTML = eq + ' 規則：<b>活性大的金屬，可以把活性小的金屬離子還原出來</b>（排在氫前面的金屬才能和稀酸反應放出氫氣）。';
    };
    animate(o, dt => { t += dt; if (react()) prog = Math.min(1, prog + dt / 4); o.draw(); });
  };

  /* ================= 4-1 脫水縮合 ================= */
  W.stepsPolymer = el => {
    const hex = (ctx, x, y, r, c, lab) => { ctx.save(); ctx.fillStyle = c; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; i ? ctx.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)) : ctx.moveTo(x + r * Math.cos(a), y + r * Math.sin(a)); } ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); if (lab) txt(ctx, lab, x, y, INK, 10, 'center', 900); };
    const water = (ctx, x, y, a) => alpha(ctx, a, () => { dot(ctx, x, y, 8, '#ff8a8a', INK); dot(ctx, x - 8, y + 6, 5, '#f4f4f8', INK); dot(ctx, x + 8, y + 6, 5, '#f4f4f8', INK); txt(ctx, 'H₂O', x, y - 16, BLUE, 10, 'center', 900); });
    const N = 5;
    player(el, '一步一步看：小分子連成大分子（脫水縮合）', [
      { cap: '<b>葡萄糖</b>（C₆H₁₂O₆）是<b>單醣</b>，一個環狀的小分子。每個葡萄糖兩端都有 –OH 和 –H 可以「接手」。', draw: (ctx, w, h, p) => { const r = Math.min(24, w / 18), gap = w / (N + 1); for (let i = 0; i < N; i++) alpha(ctx, p, () => hex(ctx, gap * (i + 1), h * 0.42, r, '#ffe7a8', '葡萄糖')); } },
      { cap: '兩個葡萄糖接起來時，一個給 <b>–OH</b>、另一個給 <b>–H</b>，脫下一個<b>水分子</b>，中間形成鍵 → 這叫<b>脫水縮合</b>。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const r = Math.min(24, w / 18), gap0 = w / (N + 1), gap1 = r * 2.1; const x0 = w / 2 - gap1 * (N - 1) / 2; for (let i = 0; i < N; i++) { const xa = gap0 * (i + 1), xb = x0 + gap1 * i; hex(ctx, xa + (xb - xa) * p, h * 0.42, r, '#ffe7a8', ''); } for (let i = 0; i < N - 1; i++) water(ctx, x0 + gap1 * (i + 0.5), h * 0.42 - 34 - 30 * p, p); } },
      { cap: '一直接下去，幾百到幾千個葡萄糖連成長鏈 → <b>澱粉</b>、<b>肝醣</b>、<b>纖維素</b>（多醣）。這種大分子叫<b>聚合物</b>。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => note(ctx, 'n 葡萄糖 → 多醣 + (n−1) H₂O', w, h - 22)); } },
      { cap: '反過來，加水把長鏈切回小分子叫<b>水解</b>：吃進去的澱粉在消化道被<b>酵素</b>水解成葡萄糖，才能被吸收。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); const r = Math.min(24, w / 18), gap1 = r * 2.1, x0 = w / 2 - gap1 * (N - 1) / 2; for (let i = 0; i < N; i++) hex(ctx, x0 + gap1 * i + (i - 2) * 26 * p, h * 0.42, r, '#ffe7a8', p > 0.8 ? '葡萄糖' : ''); for (let i = 0; i < N - 1; i++) water(ctx, x0 + gap1 * (i + 0.5) + (i - 1.5) * 26 * p, h * 0.42 - 64 + 30 * p, 1 - p); txt(ctx, '✂️ 酵素', w / 2, h - 20, GREEN, 13, 'center', 900); } },
      { cap: '同樣的道理：<b>胺基酸</b>用<b>肽鍵</b>連成<b>蛋白質</b>；<b>甘油 + 3 個脂肪酸</b>形成<b>油脂</b>；<b>核苷酸</b>連成 <b>DNA、RNA</b>。都是脫水縮合！', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); alpha(ctx, p, () => { const cols = ['#ffd1d1', '#d6ecff', '#d7f3e6', '#ecdcff', '#ffe3c2', '#fff3a6']; for (let i = 0; i < 8; i++) { const x = w * 0.12 + i * w * 0.1, y = h * 0.4 + Math.sin(i) * 10; dot(ctx, x, y, 13, cols[i % 6], INK); if (i < 7) line(ctx, x + 13, y, x + w * 0.1 - 13, h * 0.4 + Math.sin(i + 1) * 10, INK, 2.5); } txt(ctx, '胺基酸 → 蛋白質', w / 2, h * 0.4 + 40, INK, 13, 'center', 900); }); } },
    ], 250, 0.48);
  };

  /* ================= 4-2、實驗 4 肥皂去油汙 ================= */
  W.stepsSoap = el => {
    const surf = (ctx, x, y, ang, s) => { const L = 22 * (s || 1); const tx = x - Math.cos(ang) * L, ty = y - Math.sin(ang) * L; ctx.save(); ctx.strokeStyle = '#8a6d3b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, y); for (let k = 1; k <= 6; k++) { const f = k / 6; ctx.lineTo(x + (tx - x) * f + Math.sin(ang) * (k % 2 ? 3 : -3), y + (ty - y) * f - Math.cos(ang) * (k % 2 ? 3 : -3)); } ctx.stroke(); ctx.restore(); dot(ctx, x, y, 5.5, '#ff7eb6', INK); };
    player(el, '一步一步看：肥皂（界面活性劑）怎麼把油洗掉', [
      { cap: '油汙<b>不溶於水</b>：只用水沖，油滴黏在衣服上不走。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.2)'; ctx.fillRect(0, 0, w, h); ctx.restore(); ctx.save(); ctx.fillStyle = '#d9c7a1'; ctx.fillRect(0, h - 26, w, 26); ctx.restore(); txt(ctx, '布料', 30, h - 13, INK, 11, 'center', 900); ctx.save(); ctx.fillStyle = 'rgba(255,200,40,.85)'; ctx.beginPath(); ctx.ellipse(w / 2, h - 46, 50, 22, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = INK; ctx.stroke(); ctx.restore(); txt(ctx, '油汙', w / 2, h - 46, INK, 12, 'center', 900); }); } },
      { cap: '肥皂分子有兩端：<b>親水的頭</b>（粉紅色，帶電）喜歡水；<b>親油的長尾巴</b>（碳鏈）喜歡油。', draw: (ctx, w, h, p, t) => { alpha(ctx, p, () => { for (let k = 0; k < 6; k++) surf(ctx, w * 0.12 + k * w * 0.13, h * 0.28 + Math.sin(t * 2 + k) * 6, Math.PI / 2 + Math.sin(k) * 0.4); surf(ctx, w - 70, 30, 0, 1.4); txt(ctx, '← 親水頭', w - 30, 50, '#d6337a', 10, 'center', 900); txt(ctx, '親油尾 →', w - 120, 50, '#8a6d3b', 10, 'center', 900); }); } },
      { cap: '尾巴<b>插進油滴</b>，頭朝外對著水，一圈一圈把油滴<b>包起來</b>。', draw: (ctx, w, h, p) => { ctx.clearRect(0, 0, w, h); ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.2)'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#d9c7a1'; ctx.fillRect(0, h - 26, w, 26); ctx.restore(); const cx = w / 2, cy = h - 46 - 30 * p, rx = 50 - 14 * p, ry = 22 + 8 * p; ctx.save(); ctx.fillStyle = 'rgba(255,200,40,.85)'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); const n = Math.round(14 * p); for (let k = 0; k < n; k++) { const a = k / 14 * Math.PI * 2; surf(ctx, cx + Math.cos(a) * (rx + 18), cy + Math.sin(a) * (ry + 18), a); } } },
      { cap: '油滴被包成一顆顆<b>微胞</b>（外面全是親水頭），就能<b>分散在水中</b>，被水沖走了！這叫<b>乳化作用</b>。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); ctx.save(); ctx.fillStyle = 'rgba(120,190,255,.2)'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#d9c7a1'; ctx.fillRect(0, h - 26, w, 26); ctx.restore(); [[w / 2, h - 76], [w * 0.25, h * 0.35], [w * 0.75, h * 0.3]].forEach(([x0, y0], i) => { const x = x0 + (i ? 0 : 160 * p) + Math.sin(t + i) * 4, y = y0 - (i ? 0 : 40 * p), rr = i ? 14 : 22; ctx.save(); ctx.fillStyle = 'rgba(255,200,40,.85)'; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.restore(); for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; surf(ctx, x + Math.cos(a) * (rr + 14), y + Math.sin(a) * (rr + 14), a, 0.7); } }); } },
      { cap: '<b>硬水</b>（含 Ca²⁺、Mg²⁺ 多）會和肥皂結合成不溶的<b>皂垢</b>，泡沫變少、洗不乾淨；<b>合成清潔劑</b>比較不受硬水影響。肥皂是油脂和 NaOH 的<b>皂化反應</b>做出來的。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => note(ctx, '油脂 + NaOH → 肥皂 + 甘油（皂化）', w, 22)); } },
    ], 260, 0.5);
  };

  /* ================= 4-3 溫室效應 ================= */
  W.greenhouse = el => {
    const o = setup(el, '溫室效應：大氣中的 CO₂ 越多，留住的熱越多', 260, 0.5);
    let ppm = 420, t = 0;
    range(o, 'CO₂ 濃度', 280, 1000, 10, ppm, v => { ppm = v; return v + ' ppm'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const gy = h - 30, ay = h * 0.3, trap = Math.min(0.85, 0.25 + (ppm - 280) / 1200);
      ctx.save(); const g = ctx.createLinearGradient(0, 0, 0, gy); g.addColorStop(0, '#0e1a3a'); g.addColorStop(0.3, '#2a4a8a'); g.addColorStop(1, '#bfe2ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, gy); ctx.restore();
      ctx.save(); ctx.fillStyle = `rgba(255,160,120,${0.12 + trap * 0.25})`; ctx.fillRect(0, ay - 16, w, 32); ctx.restore(); txt(ctx, '大氣中的溫室氣體（CO₂、CH₄、水蒸氣…）', w / 2, ay, '#fff', 11, 'center', 900);
      ctx.save(); ctx.fillStyle = '#4a9b4a'; ctx.fillRect(0, gy, w, h - gy); ctx.restore(); dot(ctx, w - 40, 26, 16, '#ffd23f', '#f5a623');
      // 陽光進來（黃）
      for (let k = 0; k < 4; k++) { const x = w * 0.12 + k * w * 0.09, s = (t * 0.5 + k / 4) % 1; arrow(ctx, x + 40 - 40 * s, 10 + (gy - 20) * s - 26, x + 40 - 40 * s - 8, 10 + (gy - 20) * s, '#ffd23f', 3, 8); }
      // 紅外線往上：一部分逃出去，一部分被擋回來
      const n = 8;
      for (let k = 0; k < n; k++) {
        const x = w * 0.5 + k * w * 0.055, s = (t * 0.45 + k / n) % 1, back = k / n < trap;
        let y; if (!back || s < 0.5) y = gy - s * 2 * (gy - (back ? ay : -20)); else y = ay + (s - 0.5) * 2 * (gy - ay);
        if (!back) y = gy - s * (gy + 20);
        const up = !back || s < 0.5;
        arrow(ctx, x, y + (up ? 16 : -16), x, y, back ? '#ff6a6a' : '#ffb3b3', 2.5, 7);
      }
      const T = 14 + 3 * Math.log2(ppm / 280);
      box(ctx, 10, 10, 116, 44, 'rgba(255,255,255,.9)'); txt(ctx, '地表平均溫度', 68, 24, MUTED, 10, 'center', 900); txt(ctx, `約 ${T.toFixed(1)} °C`, 68, 42, T > 15.5 ? RED : INK, 15, 'center', 900);
      o.read.innerHTML = `陽光（黃）穿過大氣把地表曬熱，地表再放出<b>紅外線</b>（紅）。溫室氣體會<b>吸收紅外線再放回來</b>，把熱留住。工業革命前 CO₂ 約 280 ppm，現在約 420 ppm。CO₂ ${ppm} ppm 時，粗估地表平均溫度約 <b>${T.toFixed(1)} °C</b>（簡化模型）。溫室效應本身讓地球適合生活，問題是溫室氣體<b>太多</b> → 全球暖化。`;
    };
    animate(o, dt => { t += dt; o.draw(); });
  };

  /* ================= 4-3 酸雨 ================= */
  W.stepsAcidRain = el => {
    const sky = (ctx, w, h) => { ctx.save(); ctx.fillStyle = '#eaf4ff'; ctx.fillRect(0, 0, w, h); ctx.fillStyle = '#9ccf7a'; ctx.fillRect(0, h - 22, w, 22); ctx.restore(); };
    const factory = (ctx, x, gy, t, smoke) => { box(ctx, x - 30, gy - 40, 60, 40, '#c9c3d6', INK, 4); box(ctx, x + 10, gy - 78, 14, 40, '#a59fb8', INK, 2); if (smoke) for (let k = 0; k < 6; k++) { const s = (t * 0.4 + k / 6) % 1; dot(ctx, x + 17 + s * 70, gy - 84 - s * 50, 6 + s * 8, `rgba(110,110,120,${0.6 - s * 0.5})`); } };
    const cloud = (ctx, x, y, c) => { [[-24, 4, 18], [0, -6, 24], [26, 4, 18]].forEach(([dx, dy, r]) => dot(ctx, x + dx, y + dy, r, c)); };
    player(el, '一步一步看：酸雨是怎麼形成的', [
      { cap: '燃燒<b>煤、石油</b>（工廠、發電廠、汽機車）會排出<b>二氧化硫 SO₂</b> 和<b>氮氧化物 NOₓ</b>。', draw: (ctx, w, h, p, t) => { sky(ctx, w, h); factory(ctx, w * 0.22, h - 22, t, p > 0.2); txt(ctx, 'SO₂、NOₓ', w * 0.36, h * 0.3, '#555', 13, 'center', 900); } },
      { cap: '這些氣體飄到空中，和<b>氧氣、水</b>反應，變成<b>硫酸 H₂SO₄</b> 和<b>硝酸 HNO₃</b>，溶在雲裡的小水滴中。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => { cloud(ctx, w * 0.62, h * 0.24, '#b9bccb'); txt(ctx, 'H₂SO₄、HNO₃', w * 0.62, h * 0.24 + 34, RED, 12, 'center', 900); arrow(ctx, w * 0.42, h * 0.3, w * 0.52, h * 0.26, '#777', 2.5, 8); }); } },
      { cap: '下雨時就變成<b>酸雨</b>。正常雨水溶了 CO₂，pH 約 <b>5.6</b>；pH 比這更低的叫酸雨（臺灣環境監測以 <b>pH < 5.0</b> 為酸雨）。', draw: (ctx, w, h, p, t) => { for (let k = 0; k < 14; k++) { const s = (t * 0.8 + k / 14) % 1; alpha(ctx, p, () => line(ctx, w * 0.52 + (k % 7) * 12, h * 0.34 + s * (h * 0.55), w * 0.52 + (k % 7) * 12 - 3, h * 0.34 + s * (h * 0.55) + 9, '#5b8def', 2)); } alpha(ctx, p, () => txt(ctx, 'pH < 5', w * 0.86, h * 0.5, RED, 15, 'center', 900)); } },
      { cap: '危害：腐蝕<b>大理石建築、雕像</b>（CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂↑）、金屬生鏽；湖泊、土壤<b>酸化</b>，魚和植物受害。', draw: (ctx, w, h, p, t) => { alpha(ctx, p, () => { box(ctx, w * 0.78 - 18, h - 82, 36, 60, '#efeae0', INK, 4); txt(ctx, '石像', w * 0.78, h - 52, INK, 11, 'center', 900); for (let k = 0; k < 4; k++) { const s = (t * 0.6 + k / 4) % 1; dot(ctx, w * 0.78 - 12 + k * 8, h - 84 - s * 20, 2.5, '#fff', '#888'); } }); } },
      { cap: '防治：燃料<b>脫硫</b>、工廠<b>排煙脫硫</b>、汽車裝<b>觸媒轉化器</b>減少 NOₓ、多用<b>潔淨能源</b>、搭大眾運輸。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => note(ctx, '減少 SO₂、NOₓ 排放 = 減少酸雨', w, 20)); } },
    ], 260, 0.5);
  };

  /* ================= 4-4 燃料電池 ================= */
  W.stepsFuelCell = el => {
    const G = (w, h) => ({ ax: w * 0.3, cx: w * 0.7, top: h * 0.3, bot: h - 16, wy: 22 });
    const frame = (ctx, w, h, on, t) => {
      const g = G(w, h);
      box(ctx, g.ax - 60, g.top, 50, g.bot - g.top, '#e3edff'); box(ctx, g.cx + 10, g.top, 50, g.bot - g.top, '#ffe8e8');
      box(ctx, w / 2 - 12, g.top, 24, g.bot - g.top, '#f3efe6'); txt(ctx, '電解質膜', w / 2, g.bot + 0 - 8, '#8a6d3b', 9, 'center', 900);
      line(ctx, g.ax, g.top, g.ax, g.bot, INK, 5); line(ctx, g.cx, g.top, g.cx, g.bot, INK, 5);
      txt(ctx, '負極', g.ax, g.top - 10, INK, 11, 'center', 900); txt(ctx, '正極', g.cx, g.top - 10, INK, 11, 'center', 900);
      line(ctx, g.ax, g.top, g.ax, g.wy, INK, 2.5); line(ctx, g.ax, g.wy, g.cx, g.wy, INK, 2.5); line(ctx, g.cx, g.wy, g.cx, g.top, INK, 2.5);
      if (on) { ctx.save(); ctx.fillStyle = 'rgba(255,214,60,.55)'; ctx.beginPath(); ctx.arc(w / 2, g.wy, 18, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      dot(ctx, w / 2, g.wy, 10, on ? '#fff3a6' : '#eee', INK);
      txt(ctx, 'H₂ →', g.ax - 35, g.top + 18, BLUE, 12, 'center', 900); txt(ctx, '← O₂', g.cx + 35, g.top + 18, RED, 12, 'center', 900);
      return g;
    };
    player(el, '一步一步看：氫燃料電池', [
      { cap: '負極通入<b>氫氣 H₂</b>，正極通入<b>氧氣 O₂</b>（空氣），中間隔著只讓 H⁺ 通過的<b>電解質膜</b>。', draw: (ctx, w, h, p, t) => { alpha(ctx, p, () => frame(ctx, w, h, false, t)); } },
      { cap: '負極：氫被<b>氧化</b>，<b>H₂ → 2H⁺ + 2e⁻</b>。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = frame(ctx, w, h, false, t); alpha(ctx, p, () => { txt(ctx, 'H₂ → 2H⁺ + 2e⁻', g.ax - 10, g.bot - 20, BLUE, 12, 'center', 900); }); } },
      { cap: '電子走外面的<b>導線</b>到正極，路上點亮燈泡（<b>化學能直接變電能</b>）；H⁺ 穿過電解質膜到正極。', draw: (ctx, w, h, p, t) => { ctx.clearRect(0, 0, w, h); const g = frame(ctx, w, h, p > 0.3, t); for (let k = 0; k < 5; k++) { const s = (t * 0.35 + k / 5) % 1, L = (g.top - g.wy) * 2 + (g.cx - g.ax); let d = s * L, x, y; if (d < g.top - g.wy) { x = g.ax; y = g.top - d; } else if ((d -= g.top - g.wy) < g.cx - g.ax) { x = g.ax + d; y = g.wy; } else { d -= g.cx - g.ax; x = g.cx; y = g.wy + d; } if (Math.abs(x - w / 2) > 12) { dot(ctx, x, y, 4.5, '#ffe27a', INK); } } for (let k = 0; k < 3; k++) { const s = (t * 0.4 + k / 3) % 1; dot(ctx, g.ax + 8 + (g.cx - g.ax - 16) * s, (g.top + g.bot) / 2 + (k - 1) * 18, 5, '#ffb3b3', INK); } txt(ctx, 'H⁺ →', w / 2, (g.top + g.bot) / 2 - 34, RED, 11, 'center', 900); } },
      { cap: '正極：氧被<b>還原</b>，和 H⁺、電子結合成水：<b>O₂ + 4H⁺ + 4e⁻ → 2H₂O</b>。', draw: (ctx, w, h, p, t) => { const g = G(w, h); alpha(ctx, p, () => { txt(ctx, 'O₂ + 4H⁺ + 4e⁻ → 2H₂O', g.cx + 10, g.bot - 20, RED, 12, 'center', 900); for (let k = 0; k < 3; k++) { const s = (t * 0.3 + k / 3) % 1; dot(ctx, g.cx + 30, g.bot - 30 + s * 20, 4, '#9fc3ff', INK); } }); } },
      { cap: '總反應 <b>2H₂ + O₂ → 2H₂O</b>：產物<b>只有水</b>、效率高、安靜。挑戰是<b>氫氣的製造和儲存</b>（最好用再生能源電解水產氫，叫「綠氫」）。', draw: (ctx, w, h, p) => { alpha(ctx, p, () => note(ctx, '2H₂ + O₂ → 2H₂O + 電能', w, h - 16)); } },
    ], 270, 0.52);
  };
})();
