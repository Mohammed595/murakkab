import { useRef, useEffect } from 'react';
import { fmt } from '../../shared/utils/format';

export default function ReviewChart({ scen, sim, actions }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!scen || !sim) return;
    draw();
  });

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const W = containerRef.current.getBoundingClientRect().width - 12;
    const H = 150;
    canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.height = H + 'px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const N = scen.prices.length - 1;
    const padL = 6, padR = 44, padT = 12, padB = 8;
    const plotW = W - padL - padR, plotH = H - padT - padB;
    const hy = sim.hist.map(h => h.total);
    const hs = sim.hist.map(h => h.salem);
    const maxV = Math.max(...hy, ...hs) * 1.12;
    const X = i => padL + plotW * (i / N);
    const Y = v => padT + plotH * (1 - v / maxV);

    const line = (vals, color, dash) => {
      ctx.save(); if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      vals.forEach((v, i) => { const x = X(i), y = Y(v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
    };
    line(hs, '#35B8A0', [6, 5]);
    line(hy, '#E3A83B');

    // Action pins
    actions.filter(a => a.act === 'sell' || a.act === 'invest').forEach(a => {
      const x = X(a.m), y = Y(sim.hist[a.m].total);
      ctx.beginPath(); ctx.arc(x, y, 5, 0, 7);
      ctx.fillStyle = a.act === 'sell' ? '#E0584A' : '#57BF7E'; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = '#14120C'; ctx.stroke();
    });

    ctx.font = '9.5px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillStyle = '#E3A83B'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(fmt(sim.final), padL + plotW + 4, Y(sim.final));
    ctx.fillStyle = '#35B8A0';
    ctx.fillText(fmt(sim.salemFinal), padL + plotW + 4, Math.min(Y(sim.salemFinal), padT + plotH - 8));
  }

  return (
    <div className="rvchart" ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
