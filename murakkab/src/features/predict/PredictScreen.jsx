import { useState, useEffect } from 'react';
import { fmt } from '../../shared/utils/format';

export default function PredictScreen({ active, scen, onBack, onConfirm }) {
  const [val, setVal] = useState(scen?.guess?.def ?? 38000);

  useEffect(() => {
    if (scen?.guess) setVal(scen.guess.def);
  }, [scen]);

  if (!scen) return null;
  const g = scen.guess;
  const N = scen.prices.length;
  const dep = scen.start + scen.salary * N;

  return (
    <div className={`scr${active ? ' on' : ''}`}>
      <div className="chrome">
        <button className="back" onClick={onBack}>→ رجوع</button>
        <span className="vpill">فلوس افتراضية</span>
      </div>

      <div className="qcard">
        <div className="q">
          راتبك بيحط <em>{scen.salary} ريال</em> كل شهر لمدة{' '}
          <em>{Math.round(N / 12)} سنوات</em> — مع الـ<em>{fmt(scen.start)}</em> اللي معك،
          مجموع اللي بتحطه <em>{fmt(dep)} ريال</em>.
        </div>
        <div className="qsub">كم تتوقع تصير محفظتك بالنهاية؟</div>
        <div className="guess-num">{fmt(val)}</div>
        <div className="slider-row">
          <input
            type="range"
            min={g.min} max={g.max} value={val}
            onChange={e => setVal(+e.target.value)}
          />
        </div>
        <div className="slider-labels">
          <span>{fmt(g.max)}</span>
          <span>{fmt(g.min)}</span>
        </div>
      </div>

      <button className="btn gold" onClick={() => onConfirm(val)}>
        هذا تخميني — يلا نشوف ▶
      </button>
      <div className="whisper">مو مهم إذا ضبطت — التجربة هي الهدف</div>
    </div>
  );
}
