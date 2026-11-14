/* 章節頁的互動動畫元件（八下、九上、九下）。共用工具在 widgets.js 的 WIDGETS._u。 */
(function () {
  const W = window.WIDGETS, U = W._u;
  const { setup, animate, range, seg, btn, txt, line, arrow, dot } = U;
  const INK = '#2b2540', MUTED = '#8a84a0', RED = '#ff4d6d', BLUE = '#3a86ff', GREEN = '#20b07a', ORANGE = '#ff8c1a', PURPLE = '#7b5cff';
  const FONT = '"Noto Sans TC","Microsoft JhengHei",sans-serif';
  const deg = Math.PI / 180;

  /* ---------- 八下 1-2 平衡化學反應式（質量守恆） ---------- */
  W.balance = el => {
    const o = U.dom(el, '配平化學反應式：反應前後原子數目要一樣');
    const RX = [
      ['氫氣燃燒', [['H₂', { H: 2 }], ['O₂', { O: 2 }]], [['H₂O', { H: 2, O: 1 }]]],
      ['鎂帶燃燒', [['Mg', { Mg: 1 }], ['O₂', { O: 2 }]], [['MgO', { Mg: 1, O: 1 }]]],
      ['甲烷燃燒', [['CH₄', { C: 1, H: 4 }], ['O₂', { O: 2 }]], [['CO₂', { C: 1, O: 2 }], ['H₂O', { H: 2, O: 1 }]]],
      ['雙氧水分解', [['H₂O₂', { H: 2, O: 2 }]], [['H₂O', { H: 2, O: 1 }], ['O₂', { O: 2 }]]],
      ['小蘇打受熱', [['NaHCO₃', { Na: 1, H: 1, C: 1, O: 3 }]], [['Na₂CO₃', { Na: 2, C: 1, O: 3 }], ['H₂O', { H: 2, O: 1 }], ['CO₂', { C: 1, O: 2 }]]],
      ['鐵燃燒', [['Fe', { Fe: 1 }], ['O₂', { O: 2 }]], [['Fe₃O₄', { Fe: 3, O: 4 }]]],
    ];
    let r = 0, co = [];
    const sel = document.createElement('label');
    sel.innerHTML = '反應 <select>' + RX.map((x, i) => `<option value="${i}">${x[0]}</option>`).join('') + '</select>';
    sel.querySelector('select').addEventListener('change', e => { r = +e.target.value; reset(); });
    o.ctl.appendChild(sel);
    const reset = () => { co = new Array(RX[r][1].length + RX[r][2].length).fill(1); o.draw(); };
    const gcd = (a, b) => b ? gcd(b, a % b) : a;
    o.draw = () => {
      const [nm, L, R] = RX[r], all = L.concat(R);
      const term = (sp, i) => `<span style="display:inline-flex;align-items:center;gap:4px;margin:4px 2px"><button type="button" class="wbtn ghost" data-i="${i}" data-d="-1" style="padding:0 8px">−</button>` +
        `<b style="font-size:1.4rem;color:#e8364f;min-width:1ch;text-align:center">${co[i] === 1 ? '' : co[i]}</b><b style="font-size:1.4rem">${sp[0]}</b>` +
        `<button type="button" class="wbtn ghost" data-i="${i}" data-d="1" style="padding:0 8px">＋</button></span>`;
      let html = '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px">';
      L.forEach((sp, i) => { html += (i ? '<b style="font-size:1.3rem">＋</b>' : '') + term(sp, i); });
      html += '<b style="font-size:1.4rem;margin:0 6px">→</b>';
      R.forEach((sp, j) => { html += (j ? '<b style="font-size:1.3rem">＋</b>' : '') + term(sp, L.length + j); });
      html += '</div>';
      const els = [...new Set(all.flatMap(s => Object.keys(s[1])))], cnt = (arr, off) => { const c = {}; arr.forEach((s, i) => { for (const e in s[1]) c[e] = (c[e] || 0) + s[1][e] * co[off + i]; }); return c; };
      const cl = cnt(L, 0), cr = cnt(R, L.length);
      const ok = els.every(e => cl[e] === cr[e]), g = co.reduce(gcd);
      html += '<div class="scroll" style="margin-top:8px"><table><thead><tr><th>原子</th>' + els.map(e => `<th>${e}</th>`).join('') + '</tr></thead><tbody>' +
        '<tr><td>反應前</td>' + els.map(e => `<td>${cl[e] || 0}</td>`).join('') + '</tr><tr><td>反應後</td>' + els.map(e => `<td style="color:${cl[e] === cr[e] ? '#20b07a' : '#e8364f'};font-weight:900">${cr[e] || 0}</td>`).join('') + '</tr></tbody></table></div>';
      o.body.innerHTML = html;
      o.read.innerHTML = ok ? (g === 1 ? '🎉 <b>平衡了！</b>反應前後每一種原子的數目都一樣 → 這就是<b>質量守恆</b>：原子只是重新排列組合，不會多也不會少。' : `原子數一樣了，但係數可以再約分（都除以 ${g}），要寫成<b>最簡單整數比</b>。`) :
        '按＋、−調整係數（大字的紅色數字）。<b>只能改係數，不能改化學式的小數字</b>，改了就變成別的物質。';
    };
    o.body.addEventListener('click', e => { const b = e.target.closest('[data-i]'); if (!b) return; const i = +b.dataset.i; co[i] = Math.max(1, Math.min(9, co[i] + +b.dataset.d)); o.draw(); });
    reset();
  };

  /* ---------- 八下 3-3 pH 值 ---------- */
  W.ph = el => {
    const o = U.dom(el, 'pH 值：拉拉看，酸性、中性、鹼性');
    const EX = [[1.5, '胃酸'], [2.2, '檸檬汁'], [3, '醋'], [4, '汽水'], [5.6, '正常雨水'], [7, '純水'], [7.4, '血液'], [8.3, '小蘇打水'], [10, '肥皂水'], [11.5, '氨水'], [12.5, '漂白水'], [14, '氫氧化鈉']];
    let p = 7;
    range(o, 'pH', 0, 14, 0.1, p, x => { p = x; return x.toFixed(1); });
    o.draw = () => {
      const pos = p / 14 * 100, near = EX.reduce((a, b) => Math.abs(b[0] - p) < Math.abs(a[0] - p) ? b : a);
      const kind = p < 6.95 ? '酸性' : p > 7.05 ? '鹼性' : '中性', col = p < 6.95 ? '#e8364f' : p > 7.05 ? '#3a6dff' : '#20b07a';
      const lit = p < 6.95 ? '藍色石蕊試紙 → <b style="color:#e8364f">變紅</b>' : p > 7.05 ? '紅色石蕊試紙 → <b style="color:#3a6dff">變藍</b>' : '石蕊試紙都不變色';
      const phe = p > 8.2 ? '<b style="color:#e0479e">變紅（粉紅）</b>' : '無色';
      const times = Math.pow(10, Math.abs(7 - p));
      o.body.innerHTML = `<div style="position:relative;height:46px;border:2px solid #2b2540;border-radius:12px;background:linear-gradient(90deg,#e8364f,#ff8a3d,#ffd23f,#9be15d,#20b07a,#3fb3c9,#3a6dff,#6a3bd6);margin:6px 0 26px">
        <div style="position:absolute;left:calc(${pos}% - 2px);top:-6px;bottom:-6px;width:4px;background:#2b2540;border-radius:2px"></div>
        <div style="position:absolute;left:0;right:0;top:50px;display:flex;justify-content:space-between;font-size:.75rem;font-weight:700"><span>0</span><span>7</span><span>14</span></div></div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">${EX.map(e => `<span style="font-size:.85rem;padding:1px 8px;border-radius:8px;border:2px solid ${e === near ? '#2b2540' : '#ddd'};background:${e === near ? '#fff3c4' : '#fff'}">${e[1]} ${e[0]}</span>`).join('')}</div>`;
      o.read.innerHTML = `pH ${p.toFixed(1)}：<b style="color:${col}">${kind}</b>（接近${near[1]}）。${lit}；酚酞：${phe}。` +
        (kind === '中性' ? '' : `　pH 每差 1，[H⁺] 差 10 倍 → 這杯的${kind === '酸性' ? '[H⁺]' : '[OH⁻]'}是純水的約 <b>${times >= 1000 ? Math.round(times).toLocaleString() : times.toFixed(1)}</b> 倍。`) +
        ' 25°C 時：<b>pH < 7 酸性、= 7 中性、> 7 鹼性</b>。';
    };
    o.draw();
  };

  /* ---------- 八下 6-4 浮力 ---------- */
  W.buoy = el => {
    const o = setup(el, '浮力：物體放進液體，會浮、懸浮還是沉？（物體體積 100 cm³）', 250, 0.5);
    let rho = 0.6, liq = 1, y = 0;
    seg(o, [['0.8', '酒精 0.8'], ['1', '水 1.0'], ['1.2', '鹽水 1.2']], '1', k => { liq = +k; });
    range(o, '物體密度', 0.2, 2.5, 0.05, rho, x => { rho = x; return x.toFixed(2) + ' g/cm³'; });
    const target = () => { const { H: h } = o, top = h * 0.32, bot = h - 16, s = 60; if (rho > liq + 1e-6) return bot - s; if (Math.abs(rho - liq) < 0.026) return top + (bot - top - s) * 0.45; return top - s * (1 - rho / liq); };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const top = h * 0.32, bot = h - 16, s = 60, cx = w * 0.36, tw = Math.min(260, w * 0.56);
      ctx.fillStyle = liq === 1 ? 'rgba(120,190,255,.35)' : liq > 1 ? 'rgba(100,170,230,.5)' : 'rgba(190,220,255,.35)';
      ctx.fillRect(cx - tw / 2, top, tw, bot - top);
      ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(cx - tw / 2, 10); ctx.lineTo(cx - tw / 2, bot); ctx.lineTo(cx + tw / 2, bot); ctx.lineTo(cx + tw / 2, 10); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.fillStyle = '#ffcf9e'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(cx - s / 2, y, s, s); ctx.strokeRect(cx - s / 2, y, s, s); ctx.restore();
      const sub = Math.max(0, Math.min(1, (y + s - top) / s)), B = liq * 100 * sub, G = rho * 100, k = 0.55;
      arrow(ctx, cx - 12, y + s / 2, cx - 12, y + s / 2 + G * k, RED, 3); txt(ctx, `重量 ${G.toFixed(0)} gw`, cx - 70, y + s / 2 + G * k * 0.6, RED, 12);
      if (B > 0) { arrow(ctx, cx + 12, y + s / 2, cx + 12, y + s / 2 - B * k, BLUE, 3); txt(ctx, `浮力 ${B.toFixed(0)} gw`, cx + 72, y + s / 2 - B * k * 0.6, BLUE, 12); }
      const state = rho > liq + 1e-6 ? '沉到底' : Math.abs(rho - liq) < 0.026 ? '懸浮' : '浮在液面';
      txt(ctx, state, w * 0.82, 40, rho > liq ? RED : GREEN, 18, 'center', 900);
      txt(ctx, `沒入 ${(sub * 100).toFixed(0)}%`, w * 0.82, 68, INK, 12);
      o.read.innerHTML = `<b>浮力 = 排開液體的重量</b>（阿基米德原理）＝ 液體密度 × 沒入體積。物體密度 ${rho.toFixed(2)}，液體密度 ${liq}：` +
        (state === '浮在液面' ? `物體比液體輕 → 浮起來，<b>浮力 = 重量</b>，沒入的比例 = ${rho.toFixed(2)} ÷ ${liq} ≈ ${(rho / liq * 100).toFixed(0)}%。` :
          state === '懸浮' ? '密度一樣 → 可以停在液體中任何位置（懸浮），浮力 = 重量。' : `物體比液體重 → 沉下去，浮力（${(liq * 100).toFixed(0)} gw）< 重量，杯底撐住剩下的力。`);
    };
    animate(o, dt => { const t = target(); if (Math.abs(t - y) > 0.3) { y += (t - y) * Math.min(1, dt * 4); o.draw(); } });
    y = 20;
  };

  /* ---------- 九上 1 直線運動：x-t、v-t 圖 ---------- */
  W.motion = el => {
    const o = setup(el, '直線運動：看小車和位置－時間圖、速度－時間圖', 300, 0.62);
    let mode = 'u', t = 0, run = false;
    const M = { u: ['等速度', 4, 0], a: ['等加速度（從靜止出發）', 0, 2], d: ['等減速度（煞車）', 8, -1.6] };
    seg(o, [['u', '等速度'], ['a', '等加速度'], ['d', '減速']], 'u', k => { mode = k; t = 0; run = false; });
    btn(o, '▶ 開始', () => { t = 0; run = true; });
    const X = (tt) => { const [, v0, a] = M[mode]; return v0 * tt + 0.5 * a * tt * tt; }, V = tt => M[mode][1] + M[mode][2] * tt;
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const tx0 = 20, tx1 = w - 20, ty = 34, sc = (tx1 - tx0) / 25;
      line(ctx, tx0, ty + 14, tx1, ty + 14, INK, 2);
      for (let m = 0; m <= 25; m += 5) { line(ctx, tx0 + m * sc, ty + 10, tx0 + m * sc, ty + 18, INK, 1.5); txt(ctx, m + 'm', tx0 + m * sc, ty + 28, MUTED, 10); }
      for (let k = 0; k <= Math.floor(t / 0.5 + 1e-6); k++) dot(ctx, tx0 + X(k * 0.5) * sc, ty + 14, 3, ORANGE);
      const cxp = tx0 + X(t) * sc;
      ctx.save(); ctx.font = `24px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.translate(cxp, ty - 2); ctx.scale(-1, 1); ctx.fillText('🚗', 0, 0); ctx.restore();
      const gy0 = 78, gh = h - gy0 - 30, gw = (w - 60) / 2;
      const graph = (gx, title, f, ymax, ylab, col) => {
        ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(gx, gy0); ctx.lineTo(gx, gy0 + gh); ctx.lineTo(gx + gw, gy0 + gh); ctx.stroke(); ctx.restore();
        txt(ctx, title, gx + gw / 2, gy0 - 8, INK, 12, 'center', 900); txt(ctx, ylab, gx + 4, gy0 + 6, MUTED, 10, 'left'); txt(ctx, '時間 t（秒）', gx + gw - 30, gy0 + gh + 14, MUTED, 10);
        for (let s = 1; s <= 5; s++) line(ctx, gx + s * gw / 5, gy0 + gh, gx + s * gw / 5, gy0 + gh + 4, INK, 1);
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
        for (let s = 0; s <= t + 1e-6; s += 0.05) { const px = gx + s / 5 * gw, py = gy0 + gh - f(Math.min(s, t)) / ymax * gh; s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
        ctx.stroke(); ctx.restore();
      };
      graph(30, '位置－時間（x-t）', X, 25, 'x（m）', BLUE);
      graph(40 + gw, '速度－時間（v-t）', V, 10, 'v（m/s）', RED);
      const [nm, v0, a] = M[mode];
      o.read.innerHTML = `${nm}：t = ${t.toFixed(1)} s、位置 x = <b>${X(t).toFixed(1)} m</b>、速度 v = <b>${V(t).toFixed(1)} m/s</b>、加速度 a = <b>${a} m/s²</b>。` +
        (mode === 'u' ? '等速度：x-t 圖是<b>斜直線</b>（斜率 = 速度），v-t 圖是<b>水平線</b>。' : mode === 'a' ? '等加速度：x-t 圖是<b>彎曲往上</b>的曲線，v-t 圖是<b>斜直線</b>（斜率 = 加速度）。' : '減速：v-t 圖往下斜，加速度為負。') +
        ' 橘點是每 0.5 秒的位置：間隔一樣 → 等速；越來越大 → 加速。<b>v-t 圖下的面積 = 位移</b>。';
    };
    animate(o, dt => { if (run) { t += dt; if (t >= 5) { t = 5; run = false; } o.draw(); } });
    o.draw();
  };

  /* ---------- 九上 2-5 槓桿與力矩 ---------- */
  W.lever = el => {
    const o = setup(el, '槓桿原理：左右力矩一樣大就會平衡', 230, 0.45);
    let w1 = 30, d1 = 2, w2 = 20, d2 = 3, ang = 0;
    range(o, '左邊重', 10, 50, 10, w1, x => { w1 = x; return x + ' gw'; });
    range(o, '左距離', 1, 5, 1, d1, x => { d1 = x; return x + ' 格'; });
    range(o, '右邊重', 10, 50, 10, w2, x => { w2 = x; return x + ' gw'; });
    range(o, '右距離', 1, 5, 1, d2, x => { d2 = x; return x + ' 格'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.5, L = Math.min(w * 0.42, 300), u = L / 5;
      ctx.save(); ctx.fillStyle = '#c9b8a0'; ctx.beginPath(); ctx.moveTo(cx, cy + 4); ctx.lineTo(cx - 18, cy + 40); ctx.lineTo(cx + 18, cy + 40); ctx.closePath(); ctx.fill(); ctx.restore();
      txt(ctx, '支點', cx, cy + 54, MUTED, 11);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
      ctx.fillStyle = '#e9d3b0'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(-L, -5, 2 * L, 10); ctx.strokeRect(-L, -5, 2 * L, 10);
      for (let i = -5; i <= 5; i++) line(ctx, i * u, -5, i * u, 5, INK, 1);
      const hang = (x, wt, col) => { line(ctx, x, 5, x, 30, INK, 1.5); const s = 12 + wt * 0.5; ctx.fillStyle = col; ctx.fillRect(x - s / 2, 30, s, s); ctx.strokeRect(x - s / 2, 30, s, s); };
      hang(-d1 * u, w1, '#ffb3c7'); hang(d2 * u, w2, '#b3d1ff');
      ctx.restore();
      const tl = w1 * d1, tr = w2 * d2;
      txt(ctx, `左力矩 ${w1}×${d1} = ${tl}`, cx - L * 0.55, 20, RED, 13, 'center', 900);
      txt(ctx, `右力矩 ${w2}×${d2} = ${tr}`, cx + L * 0.55, 20, BLUE, 13, 'center', 900);
      o.read.innerHTML = `<b>力矩 = 力 × 力臂</b>（支點到力的作用線的垂直距離）。` +
        (tl === tr ? '左右力矩相等 → <b>平衡</b>（W₁ × d₁ = W₂ × d₂）。' : tl > tr ? '左邊力矩比較大 → 往<b>左</b>（逆時針）轉。' : '右邊力矩比較大 → 往<b>右</b>（順時針）轉。');
    };
    animate(o, dt => { const tgt = Math.max(-0.22, Math.min(0.22, (w2 * d2 - w1 * d1) * 0.004)); if (Math.abs(tgt - ang) > 0.0005) { ang += (tgt - ang) * Math.min(1, dt * 5); o.draw(); } });
    o.draw();
  };

  /* ---------- 九上 3-3 能量守恆：單擺 ---------- */
  W.energy = el => {
    const o = setup(el, '力學能守恆：單擺的動能和位能', 250, 0.5);
    let th0 = 45 * deg, th = th0, om = 0, fr = false, E0 = 0, Eh = 0;
    range(o, '拉開角度', 10, 70, 1, 45, x => { th0 = x * deg; th = th0; om = 0; Eh = 0; return x + '°'; });
    seg(o, [['0', '沒有摩擦'], ['1', '有空氣阻力']], '0', k => { fr = k === '1'; th = th0; om = 0; Eh = 0; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const px = w * 0.34, py = 18, L = h - 60, bx = px + L * Math.sin(th), by = py + L * Math.cos(th);
      line(ctx, px - 40, py, px + 40, py, INK, 3); line(ctx, px, py, bx, by, INK, 2); dot(ctx, bx, by, 13, '#ffd23f', INK);
      line(ctx, px - L * 0.8, py + L, px + L * 0.8, py + L, '#cfc9dc', 1.5, [5, 5]); txt(ctx, '最低點', px + L * 0.8 - 20, py + L + 10, MUTED, 10);
      const gA = 900, hMax = L * (1 - Math.cos(th0));   // 和 animate 用同一個重力，能量才對得上
      const pe = L * (1 - Math.cos(th)), ke = 0.5 * Math.pow(om * L, 2) / gA;
      E0 = hMax; const tot = E0 || 1;
      const bars = [['位能', pe / tot, BLUE], ['動能', ke / tot, RED], ['熱能', Eh / tot, ORANGE], ['總和', (pe + ke + Eh) / tot, GREEN]];
      const bx0 = w * 0.64, bw = (w - bx0 - 14) / 4, bh = h - 70;
      bars.forEach(([n, v, c], i) => { const x = bx0 + i * bw; ctx.fillStyle = c; ctx.fillRect(x + 6, 20 + bh * (1 - Math.min(1, v)), bw - 12, bh * Math.min(1, v)); ctx.strokeStyle = INK; ctx.strokeRect(x + 6, 20, bw - 12, bh); txt(ctx, n, x + bw / 2, h - 34, INK, 12, 'center', 900); });
    };
    let sig = '';
    animate(o, dt => {
      const { H: h } = o, L = h - 60, g = 900; // 畫面用的重力
      for (let i = 0; i < 4; i++) {
        const s = dt / 4, a = -(g / L) * Math.sin(th) - (fr ? 0.35 * om : 0);
        om += a * s; th += om * s;
        if (fr) { const ke = 0.5 * om * om * L * L / g, pe = L * (1 - Math.cos(th)); Eh = Math.max(0, L * (1 - Math.cos(th0)) - ke - pe); }
      }
      o.draw();
      const s = fr ? 'f' : 'n';
      if (s !== sig) { sig = s; o.read.innerHTML = fr ? '有阻力時，力學能慢慢變成<b>熱能</b>，擺越盪越低，但<b>總能量</b>（綠色）還是不變——能量只會轉換，不會消失。' : '沒有摩擦時，位能↔動能互相轉換：<b>最高點位能最大、動能 0</b>；<b>最低點動能最大</b>。位能 + 動能 = 力學能，保持不變（力學能守恆）。'; }
    });
  };

  /* ---------- 九上 4-4 歐姆定律、串聯與並聯 ---------- */
  W.ohm = el => {
    const o = setup(el, '歐姆定律：電壓、電流、電阻，串聯和並聯', 260, 0.52);
    let V = 6, R = 10, mode = '1', ph = 0;
    seg(o, [['1', '一個燈泡'], ['s', '兩燈串聯'], ['p', '兩燈並聯']], '1', k => { mode = k; });
    range(o, '電池電壓', 1.5, 9, 1.5, V, x => { V = x; return x + ' V'; });
    range(o, '每個燈泡電阻', 2, 20, 1, R, x => { R = x; return x + ' Ω'; });
    const calc = () => { if (mode === '1') return { Rt: R, I: V / R, b: [[V, V / R]] }; if (mode === 's') return { Rt: 2 * R, I: V / (2 * R), b: [[V / 2, V / (2 * R)], [V / 2, V / (2 * R)]] }; return { Rt: R / 2, I: 2 * V / R, b: [[V, V / R], [V, V / R]] }; };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const c = calc(), x0 = 40, x1 = w - 40, y0 = 30, y1 = h - 34;
      const wire = (pts) => { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore(); };
      const bulb = (x, y, P) => { const g = Math.min(1, P / 4); ctx.save(); ctx.fillStyle = `rgba(255,214,60,${0.12 + g * 0.6})`; ctx.beginPath(); ctx.arc(x, y, 14 + g * 20, 0, Math.PI * 2); ctx.fill(); ctx.restore(); dot(ctx, x, y, 12, g > 0.05 ? '#fff3a6' : '#eee', INK); };
      wire([[x0, y1], [x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
      ctx.fillStyle = '#fff'; ctx.fillRect(x0 - 14, (y0 + y1) / 2 - 18, 28, 36);
      line(ctx, x0 - 14, (y0 + y1) / 2 - 6, x0 + 14, (y0 + y1) / 2 - 6, INK, 3); line(ctx, x0 - 7, (y0 + y1) / 2 + 6, x0 + 7, (y0 + y1) / 2 + 6, INK, 5);
      txt(ctx, `${V} V`, x0 + 32, (y0 + y1) / 2, INK, 12, 'center', 900);
      const P = c.b.map(([v, i]) => v * i);
      if (mode === '1') bulb((x0 + x1) / 2, y0, P[0]);
      else if (mode === 's') { bulb(x0 + (x1 - x0) * 0.4, y0, P[0]); bulb(x0 + (x1 - x0) * 0.7, y0, P[1]); }
      else { const ym = (y0 + y1) / 2, xa = x0 + (x1 - x0) * 0.55, xb = x0 + (x1 - x0) * 0.8; wire([[xa, y0], [xa, y1]]); wire([[xb, y0], [xb, y1]]); ctx.fillStyle = '#fff'; ctx.fillRect(x1 - 4, y0 + 4, 8, y1 - y0 - 8); bulb(xa, ym, P[0]); bulb(xb, ym, P[1]); }
      const n = 22, per = 2 * ((x1 - x0) + (y1 - y0));
      for (let k = 0; k < n; k++) {
        let s = ((k / n) * per + ph) % per, x, y;
        if (s < y1 - y0) { x = x0; y = y1 - s; } else if ((s -= y1 - y0) < x1 - x0) { x = x0 + s; y = y0; } else if ((s -= x1 - x0) < y1 - y0) { x = x1; y = y0 + s; } else { s -= y1 - y0; x = x1 - s; y = y1; }
        if (mode === 'p' && x === x1) continue;
        dot(ctx, x, y, 3, BLUE);
      }
      txt(ctx, `總電阻 ${c.Rt.toFixed(1)} Ω　總電流 ${c.I.toFixed(2)} A`, w / 2, h - 12, RED, 13, 'center', 900);
      o.read.innerHTML = `<b>V = I × R</b>（歐姆定律）。` + (mode === '1' ? `I = ${V} ÷ ${R} = <b>${c.I.toFixed(2)} A</b>。` :
        mode === 's' ? `串聯：<b>總電阻相加</b> = ${2 * R} Ω，電流處處相同 ${c.I.toFixed(2)} A，每個燈泡分到一半電壓 ${(V / 2).toFixed(2)} V → 比單獨一個燈<b>暗</b>。拔掉一個，全部都熄。` :
          `並聯：每個燈泡兩端電壓都是 ${V} V，各自電流 ${(V / R).toFixed(2)} A，總電流 = 相加 ${c.I.toFixed(2)} A；總電阻變小 = ${(R / 2).toFixed(1)} Ω。亮度和單獨一個燈一樣，拔掉一個另一個照亮（家裡電器都是並聯）。`) +
        ' 藍點跑越快代表電流越大。';
    };
    animate(o, dt => { ph += dt * calc().I * 120; o.draw(); });
  };

  /* ---------- 九下 2-4 電磁感應 ---------- */
  W.induction = el => {
    const o = setup(el, '電磁感應：磁鐵進出線圈，檢流計指針會偏轉', 240, 0.48);
    let x = 0, px = 0, auto = false, tA = 0, needle = 0;
    const sl = range(o, '磁鐵位置', 0, 100, 1, 0, v => { x = v; auto = false; });
    btn(o, '🔁 自動推拉', () => { auto = !auto; tA = 0; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const cy = h * 0.36, coilX = w * 0.62, coilW = Math.min(150, w * 0.3), mL = 110, mx = 20 + (coilX - coilW / 2 - 20) * (x / 100) + coilW * 0.6 * (x / 100);
      ctx.save(); ctx.strokeStyle = '#c47b2a'; ctx.lineWidth = 3;
      for (let i = 0; i <= 8; i++) { const xx = coilX - coilW / 2 + i * coilW / 8; ctx.beginPath(); ctx.ellipse(xx, cy, 7, 34, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
      ctx.save(); ctx.fillStyle = '#4f8cff'; ctx.fillRect(mx - mL, cy - 14, mL / 2, 28); ctx.fillStyle = '#ff4d6d'; ctx.fillRect(mx - mL / 2, cy - 14, mL / 2, 28); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(mx - mL, cy - 14, mL, 28); ctx.restore();
      txt(ctx, 'S', mx - mL * 0.75, cy, '#fff', 14, 'center', 900); txt(ctx, 'N', mx - mL * 0.25, cy, '#fff', 14, 'center', 900);
      const gx = coilX, gy = h - 40;
      line(ctx, coilX - coilW / 2, cy + 34, coilX - coilW / 2, gy, '#c47b2a', 2); line(ctx, coilX + coilW / 2, cy + 34, coilX + coilW / 2, gy, '#c47b2a', 2);
      line(ctx, coilX - coilW / 2, gy, gx - 34, gy, '#c47b2a', 2); line(ctx, coilX + coilW / 2, gy, gx + 34, gy, '#c47b2a', 2);
      ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, 34, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      txt(ctx, '0', gx, gy - 40, MUTED, 10); txt(ctx, '檢流計', gx, gy + 12, MUTED, 11);
      const a = -Math.PI / 2 + Math.max(-1.2, Math.min(1.2, needle));
      line(ctx, gx, gy, gx + 28 * Math.cos(a), gy + 28 * Math.sin(a), RED, 3);
    };
    animate(o, dt => {
      if (auto) { tA += dt; x = 50 - 50 * Math.cos(tA * 2.2); sl.value = x; }
      const flux = v => 1 / (1 + Math.pow((v - 78) / 18, 2));
      const emf = -(flux(x) - flux(px)) / Math.max(dt, 1e-3);
      px = x;
      needle += (emf * 0.9 - needle) * Math.min(1, dt * 10);
      o.draw();
      const s = Math.abs(needle) < 0.05 ? '0' : needle > 0 ? 'r' : 'l';
      if (s !== o._s) { o._s = s; o.read.innerHTML = (s === '0' ? '磁鐵<b>不動</b>（或離很遠）：線圈裡的磁場沒有變化 → <b>沒有感應電流</b>，指針停在 0。' : s === 'l' ? '磁鐵<b>靠近</b>線圈：線圈裡的磁場變強 → 產生感應電流，指針往一邊偏。' : '磁鐵<b>離開</b>線圈：磁場變弱 → 感應電流<b>方向相反</b>，指針往另一邊偏。') + ' 動得越快，磁場變化越快，電流越大。發電機就是這個原理。'; }
    });
  };

  /* ---------- 九下 2-1 磁場與指北針 ---------- */
  W.field = el => {
    const o = setup(el, '磁場：拖動指北針（或用滑桿），看它指向哪裡', 240, 0.5);
    let fx = 0.75, fy = 0.25;
    range(o, '左右', 0, 100, 1, 75, v => { fx = v / 100; });
    range(o, '上下', 0, 100, 1, 25, v => { fy = v / 100; });
    const B = (x, y, w, h) => { const cx = w / 2, cy = h / 2, d = Math.min(w * 0.18, 70), poles = [[cx + d, cy, 1], [cx - d, cy, -1]]; let bx = 0, by = 0; for (const [px, py, q] of poles) { const dx = x - px, dy = y - py, r = Math.max(14, Math.hypot(dx, dy)); bx += q * dx / r ** 3; by += q * dy / r ** 3; } return [bx, by]; };
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      for (let gy = 18; gy < h; gy += 26) for (let gx = 18; gx < w; gx += 26) {
        const [bx, by] = B(gx, gy, w, h), a = Math.atan2(by, bx);
        line(ctx, gx - 6 * Math.cos(a), gy - 6 * Math.sin(a), gx + 6 * Math.cos(a), gy + 6 * Math.sin(a), 'rgba(122,110,160,.45)', 1.5);
      }
      const cx = w / 2, cy = h / 2, d = Math.min(w * 0.18, 70);
      ctx.save(); ctx.fillStyle = '#ff4d6d'; ctx.fillRect(cx, cy - 13, d + 14, 26); ctx.fillStyle = '#4f8cff'; ctx.fillRect(cx - d - 14, cy - 13, d + 14, 26); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.strokeRect(cx - d - 14, cy - 13, 2 * d + 28, 26); ctx.restore();
      txt(ctx, 'N', cx + d, cy, '#fff', 14, 'center', 900); txt(ctx, 'S', cx - d, cy, '#fff', 14, 'center', 900);
      const nx = 20 + fx * (w - 40), ny = 20 + fy * (h - 40), [bx, by] = B(nx, ny, w, h), a = Math.atan2(by, bx);
      dot(ctx, nx, ny, 20, '#fff', INK);
      ctx.save(); ctx.translate(nx, ny); ctx.rotate(a); ctx.fillStyle = RED; ctx.beginPath(); ctx.moveTo(16, 0); ctx.lineTo(0, 5); ctx.lineTo(0, -5); ctx.fill(); ctx.fillStyle = '#9fb7e8'; ctx.beginPath(); ctx.moveTo(-16, 0); ctx.lineTo(0, 5); ctx.lineTo(0, -5); ctx.fill(); ctx.restore();
      o.read.innerHTML = '指北針的 <b style="color:#ff4d6d">N 極</b> 指的方向 = 該點的<b>磁場方向</b>。磁力線在磁鐵外面<b>從 N 極出來、回到 S 極</b>，兩極附近最密（磁場最強）。';
    };
    o.draw();
  };
})();
