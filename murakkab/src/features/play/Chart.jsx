import { useRef, useEffect } from 'react';
import { fmt } from '../../shared/utils/format';

export default function Chart({ scen, sim, m, hiddenMode }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!scen || !sim || !canvasRef.current) return;
    draw();
  });

  function draw() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const cw = container.getBoundingClientRect().width - 12;
    const chH = 185;
    canvas.width = cw * dpr;
    canvas.height = chH * dpr;
    canvas.style.height = chH + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, chH);

    const N = scen.prices.length - 1;
    const padL = 8, padR = 52, padT = 13, padB = 20;
    const plotW = cw - padL - padR, plotH = chH - padT - padB;

    const hy = sim.hist.map(h => h.total);
    const hs = sim.hist.map(h => h.salem);
    let maxV = Math.max(...hy, ...hs, scen.start);
    sim.receipts.filter(r => r.act === 'sell').forEach(r => {
      for (let i = r.m; i <= m; i++) {
        maxV = Math.max(maxV, sim.hist[i].total + r.soldUnits * scen.prices[i] - r.proceeds);
      }
    });
    maxV *= 1.16;

    const X = i => padL + plotW * (i / N);
    const Y = v => padT + plotH * (1 - v / maxV);
    const font = getComputedStyle(document.body).fontFamily;
    ctx.font = '9.5px ' + font;
    ctx.textBaseline = 'middle';

    // Grid lines
    for (let g = 0; g <= 3; g++) {
      const v = maxV * g / 3, y = Y(v);
      ctx.strokeStyle = '#242013'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
      ctx.fillStyle = '#7D7663'; ctx.textAlign = 'left';
      ctx.fillText(v >= 1000 ? Math.round(v / 1000) + 'K' : Math.round(v), padL + plotW + 7, y);
    }

    // Year labels
    if (!hiddenMode) {
      ctx.textAlign = 'center';
      for (let i = 0; i <= N; i += 12) {
        ctx.fillStyle = '#7D7663';
        ctx.fillText(String(scen.startYear + i / 12), X(i), padT + plotH + 11);
      }
    }

    // Drawdown shading
    let runMax = scen.prices[0];
    for (let i = 1; i <= m; i++) {
      runMax = Math.max(runMax, scen.prices[i]);
      if (scen.prices[i] < runMax * 0.85) {
        ctx.fillStyle = 'rgba(224,88,74,.055)';
        ctx.fillRect(X(i - 1), padT, X(i) - X(i - 1), plotH);
      }
    }

    // Goal line
    if (scen.persona) {
      const gy = Y(scen.persona.goal);
      if (gy > padT) {
        ctx.save(); ctx.setLineDash([3, 5]);
        ctx.strokeStyle = 'rgba(227,168,59,.4)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + plotW, gy); ctx.stroke();
        ctx.restore();
        ctx.fillStyle = 'rgba(227,168,59,.7)'; ctx.textAlign = 'left';
        ctx.fillText('🎯', padL + plotW + 7, gy - 9);
      }
    }

    const line = (vals, color, dash, fill, width) => {
      if (m === 0) return;
      ctx.save();
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      vals.forEach((v, i) => {
        if (v === null) return;
        const x = X(i), y = Y(v);
        i && vals[i - 1] !== null ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      });
      ctx.strokeStyle = color; ctx.lineWidth = width || 2.4;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke();
      if (fill) {
        ctx.lineTo(X(m), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
        const gr = ctx.createLinearGradient(0, padT, 0, padT + plotH);
        gr.addColorStop(0, 'rgba(227,168,59,.18)');
        gr.addColorStop(1, 'rgba(227,168,59,.01)');
        ctx.fillStyle = gr; ctx.fill();
      }
      ctx.restore();
    };

    // Fork ghost lines
    sim.receipts.filter(r => r.act === 'sell').slice(-2).forEach(r => {
      const vals = sim.hist.map((h, i) =>
        i < r.m ? null : h.total + r.soldUnits * scen.prices[i] - r.proceeds
      );
      line(vals, 'rgba(245,241,230,.32)', [3, 4], false, 1.6);
    });

    line(hs, '#35B8A0', [6, 5], false);
    line(hy, '#E3A83B', null, true);

    // End dots
    const dot = (v, color) => {
      const x = X(m), y = Y(v);
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, 7);
      ctx.fillStyle = color; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#14120C'; ctx.stroke();
    };
    dot(hs[m], '#35B8A0');
    dot(hy[m], '#E3A83B');
  }

  return (
    <div className="chartbox" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
