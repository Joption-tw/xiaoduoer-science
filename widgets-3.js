/* 補充的互動動畫：虎克定律、單擺等時性、變壓器。共用工具在 widgets.js 的 WIDGETS._u。 */
(function () {
  const W = window.WIDGETS, U = W._u;
  const { setup, animate, range, seg, txt, line, arrow, dot } = U;
  const INK = '#2b2540', MUTED = '#8a84a0', RED = '#ff4d6d', BLUE = '#3a86ff', GREEN = '#20b07a', ORANGE = '#ff8c1a';

  /* ---------- 八下 6-1 虎克定律 ---------- */
  W.hooke = el => {
    const o = setup(el, '虎克定律：掛越重，彈簧伸長越多（彈性限度內成正比）', 260, 0.5);
    let F = 30, k = 5; const LIMIT = 80;
    seg(o, [['5', '軟彈簧 k = 5 gw/cm'], ['10', '硬彈簧 k = 10 gw/cm']], '5', v => { k = +v; });
    range(o, '掛的重量', 0, 100, 10, F, v => { F = v; return v + ' gw'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const over = F > LIMIT, x = F / k + (over ? (F - LIMIT) / k * 0.8 : 0), sx = w * 0.22, top = 16, L0 = 60, sc = Math.min(6, (h - top - L0 - 60) / 24), len = L0 + x * sc;
      line(ctx, sx - 50, top, sx + 50, top, INK, 4);
      ctx.save(); ctx.strokeStyle = over ? RED : '#4f7ccf'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(sx, top);
      const n = 14; for (let i = 1; i <= n; i++) ctx.lineTo(sx + (i % 2 ? 12 : -12), top + len * i / (n + 1)); ctx.lineTo(sx, top + len); ctx.stroke(); ctx.restore();
      const m = 14 + F * 0.25; ctx.save(); ctx.fillStyle = '#ffcf9e'; ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.fillRect(sx - m / 2, top + len, m, m); ctx.strokeRect(sx - m / 2, top + len, m, m); ctx.restore();
      txt(ctx, `${F} gw`, sx, top + len + m / 2, INK, 11, 'center', 900);
      line(ctx, sx + 40, top + L0, sx + 70, top + L0, MUTED, 1.5, [4, 4]); line(ctx, sx + 40, top + len, sx + 70, top + len, RED, 1.5, [4, 4]);
      arrow(ctx, sx + 62, top + L0, sx + 62, top + len, RED, 2, 7); txt(ctx, `伸長 ${x.toFixed(1)} cm`, sx + 110, top + (L0 + len) / 2, RED, 12, 'center', 900);
      // 右邊 F–x 圖
      const gx = w * 0.55, gy = h - 30, gw = w * 0.4, gh = h - 60;
      line(ctx, gx, gy, gx + gw, gy, INK, 1.5); line(ctx, gx, gy, gx, gy - gh, INK, 1.5);
      txt(ctx, '伸長量 x（cm）', gx + gw - 40, gy + 14, MUTED, 10); txt(ctx, '力 F（gw）', gx + 34, gy - gh - 6, MUTED, 10);
      const X = v => gx + v / 24 * gw, Y = v => gy - v / 100 * gh;
      ctx.save(); ctx.strokeStyle = 'rgba(79,140,255,.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(LIMIT / k), Y(LIMIT)); ctx.stroke(); ctx.restore();
      line(ctx, X(0), Y(LIMIT), X(24), Y(LIMIT), 'rgba(255,77,109,.4)', 1.5, [5, 4]); txt(ctx, '彈性限度', X(24) - 26, Y(LIMIT) - 9, RED, 10);
      dot(ctx, X(Math.min(24, x)), Y(F), 6, over ? RED : BLUE, INK);
      o.read.innerHTML = over ? `超過<b>彈性限度</b>（${LIMIT} gw）！伸長量不再和力成正比，拿掉重物也回不到原長。` :
        `<b>F = k × x</b>：${F} = ${k} × ${x.toFixed(1)}。在彈性限度內，力和伸長量<b>成正比</b>（F-x 圖是通過原點的直線，斜率 = k）。硬彈簧 k 大，同樣的力伸長比較少。`;
    };
    o.draw();
  };

  /* ---------- 九上 1-1 單擺等時性 ---------- */
  W.pendulum = el => {
    const o = setup(el, '單擺：週期只和擺長有關（擺錘輕重、小擺角都不影響）', 260, 0.5);
    let L = 60, mass = 1, amp = 10, t = 0;
    range(o, '擺長', 20, 100, 5, L, v => { L = v; t = 0; return v + ' cm'; });
    range(o, '擺角', 4, 15, 1, amp, v => { amp = v; t = 0; return v + '°'; });
    seg(o, [['1', '輕擺錘'], ['3', '重擺錘']], '1', v => { mass = +v; t = 0; });
    const T = () => 2 * Math.PI * Math.sqrt(L / 980);
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const px = w * 0.32, py = 14, sc = (h - 50) / 100, len = L * sc, th = amp * Math.PI / 180 * Math.cos(2 * Math.PI * t / T());
      line(ctx, px - 50, py, px + 50, py, INK, 4);
      line(ctx, px, py, px, py + len + 10, '#ddd', 1, [4, 4]);
      const bx = px + len * Math.sin(th), by = py + len * Math.cos(th);
      line(ctx, px, py, bx, by, INK, 2); dot(ctx, bx, by, 8 + mass * 3, mass > 1 ? '#8a8f9c' : '#ffd23f', INK);
      const x2 = w * 0.7;
      txt(ctx, `週期 T = ${T().toFixed(2)} 秒`, x2, 50, RED, 17, 'center', 900);
      txt(ctx, `擺 10 次約 ${(T() * 10).toFixed(1)} 秒`, x2, 80, INK, 13);
      txt(ctx, `已經擺了 ${Math.floor(t / T())} 次`, x2, 108, MUTED, 12);
      o.read.innerHTML = `擺長 ${L} cm → 週期 ${T().toFixed(2)} 秒。換<b>重擺錘</b>或改<b>擺角</b>（小角度）週期都不變，只有<b>擺長越長、週期越長</b>。古時候伽利略看教堂吊燈發現了這件事，擺鐘就是靠它計時。`;
    };
    animate(o, dt => { t += dt; o.draw(); });
  };

  /* ---------- 九下 2-4 變壓器 ---------- */
  W.transformer = el => {
    const o = setup(el, '變壓器：電壓比 = 匝數比（只能用交流電）', 240, 0.48);
    let N1 = 400, N2 = 200, ac = true, t = 0; const V1 = 110;
    range(o, '原線圈匝數', 100, 1000, 50, N1, v => { N1 = v; return v + ' 匝'; });
    range(o, '副線圈匝數', 50, 1000, 50, N2, v => { N2 = v; return v + ' 匝'; });
    seg(o, [['ac', '交流電'], ['dc', '直流電（電池）']], 'ac', v => { ac = v === 'ac'; });
    o.draw = () => {
      const { ctx, W: w, H: h } = o; if (!w) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cw = Math.min(260, w * 0.5), ch = h - 70, x0 = cx - cw / 2, y0 = 26;
      ctx.save(); ctx.strokeStyle = '#9aa3b5'; ctx.lineWidth = 18; ctx.strokeRect(x0, y0, cw, ch); ctx.restore();
      const coil = (x, n, col) => { const k = Math.max(3, Math.round(n / 70)); ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5; for (let i = 0; i < k; i++) { const y = y0 + 16 + i * (ch - 32) / Math.max(1, k - 1); ctx.beginPath(); ctx.ellipse(x, y, 16, 5, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.restore(); };
      coil(x0, N1, '#c47b2a'); coil(x0 + cw, N2, '#2f6db5');
      const V2 = ac ? V1 * N2 / N1 : 0, flux = ac ? Math.sin(t * 6) : 0;
      if (ac) for (let i = 0; i < 4; i++) { const yy = y0 + ch / 2 + Math.sin(t * 6 + i) * 4; arrow(ctx, x0 + 30 + i * (cw - 60) / 3, y0 - 0.5, x0 + 30 + i * (cw - 60) / 3 + 14 * Math.sign(flux || 1), y0 - 0.5, 'rgba(255,77,109,.7)', 2, 6); void yy; }
      txt(ctx, `原線圈 ${N1} 匝`, x0, h - 26, '#c47b2a', 12, 'center', 900); txt(ctx, `${V1} V ${ac ? '交流' : '直流'}`, x0, h - 10, INK, 11);
      txt(ctx, `副線圈 ${N2} 匝`, x0 + cw, h - 26, '#2f6db5', 12, 'center', 900); txt(ctx, `輸出 ${V2.toFixed(0)} V`, x0 + cw, h - 10, RED, 12, 'center', 900);
      const bx = Math.min(w - 26, x0 + cw + 60), g = Math.min(1, V2 / 220);
      ctx.save(); ctx.fillStyle = `rgba(255,214,60,${g * 0.7})`; ctx.beginPath(); ctx.arc(bx, y0 + ch / 2, 10 + g * 22, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      dot(ctx, bx, y0 + ch / 2, 11, g > 0.02 ? '#fff3a6' : '#eee', INK);
      txt(ctx, '鐵芯', cx, y0 + ch / 2, MUTED, 12);
      o.read.innerHTML = ac ? `<b>V₂ = V₁ × N₂ ÷ N₁</b> = 110 × ${N2} ÷ ${N1} = <b>${V2.toFixed(1)} V</b>（${N2 > N1 ? '升壓' : N2 < N1 ? '降壓' : '電壓不變'}）。交流電讓鐵芯裡的磁場一直變化，副線圈因為<b>電磁感應</b>產生電流。` :
        '直流電產生的磁場<b>不會變化</b> → 副線圈沒有感應電流，燈不亮。所以<b>變壓器只能用在交流電</b>（家裡的插座是交流電）。';
    };
    animate(o, dt => { t += dt; o.draw(); });
  };
})();
