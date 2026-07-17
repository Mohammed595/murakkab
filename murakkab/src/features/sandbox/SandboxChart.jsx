import { useRef, useEffect } from 'react';
import { fmt } from '../../shared/utils/format';

export default function SandboxChart({ series, startYear }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!series?.length) return;
    draw();
  });

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas || !containerRef.current) return;
    const dpr = Math.max(2, window.devicePixelRatio || 1);
    const sbW = containerRef.current.getBoundingClientRect().width - 12;
    canvas.width = sbW * dpr; canvas.height = 145 * dpr; canvas.style.height = '145px';
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, sbW, 145);

    const padL = 6, padR = 48, padT = 10, padB = 16;
    const W = sbW - padL - padR, H = 145 - padT - padB;
    const mx = Math.max(series[series.length - 1].v, 1) * 1.1;
    const X = i => padL + W * (i / (series.length - 1));
    const Y = v => padT + H * (1 - v / mx);

    // Grid
    ctx.strokeStyle = '#242013'; ctx.lineWidth = 1;
    for (let g = 1; g <= 2; g++) {
      const y = padT + H * g / 3;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + W, y); ctx.stroke();
    }

    // Portfolio line
    ctx.beginPath();
    series.forEach((p, i) => { const x = X(i), y = Y(p.v); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = '#E3A83B'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round'; ctx.stroke();
    ctx.lineTo(X(series.length - 1), Y(0)); ctx.lineTo(X(0), Y(0)); ctx.closePath();
    const gr = ctx.createLinearGradient(0, padT, 0, padT + H);
    gr.addColorStop(0, 'rgba(227,168,59,.3)'); gr.addColorStop(1, 'rgba(227,168,59,.02)');
    ctx.fillStyle = gr; ctx.fill();

    // Deposit line
    ctx.save(); ctx.setLineDash([6, 5]);
    ctx.beginPath();
    series.forEach((p, i) => { const x = X(i), y = Y(p.dep); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = '#35B8A0'; ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore();

    // Labels
    const font = getComputedStyle(document.body).fontFamily;
    ctx.font = '10px ' + font;
    ctx.fillStyle = '#7D7663'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(startYear), X(0) + 12, padT + H + 9);
    ctx.fillText('2025', X(series.length - 1) - 12, padT + H + 9);

    const last = series[series.length - 1];
    ctx.textAlign = 'left';
    ctx.fillStyle = '#E3A83B'; ctx.fillText(fmt(last.v), padL + W + 4, Y(last.v));
    ctx.fillStyle = '#35B8A0'; ctx.fillText(fmt(last.dep), padL + W + 4, Math.min(Y(last.dep), padT + H - 6));

    ctx.beginPath(); ctx.arc(X(series.length - 1), Y(last.v), 4, 0, 7);
    ctx.fillStyle = '#E3A83B'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#14120C'; ctx.stroke();
  }

  return (
    <div ref={containerRef}>
      <canvas ref={canvasRef} />
    </div>
  );
}
