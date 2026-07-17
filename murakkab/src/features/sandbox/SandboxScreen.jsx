import { useState, useMemo } from 'react';
import { SP } from '../../shared/data/spData';
import { fmt } from '../../shared/utils/format';
import SandboxChart from './SandboxChart';

const MIN_YEAR = 1995, MAX_YEAR = 2024;

export default function SandboxScreen({ active, onBack }) {
  const [startYear, setStartYear] = useState(2015);
  const [monthly, setMonthly] = useState(500);

  const yEnd = 2025;

  const result = useMemo(() => {
    let acc = 0, dep = 0;
    const series = [];
    for (let y = startYear; y <= yEnd; y++) {
      const ret = (SP[y] ?? 10) / 100;
      // Monthly compounding approximation
      for (let mo = 0; mo < 12; mo++) {
        acc += monthly;
        dep += monthly;
        acc *= (1 + ret / 12);
      }
      series.push({ v: Math.round(acc), dep: Math.round(dep) });
    }
    const years = yEnd - startYear + 1;
    const totalDep = dep;
    const growth = Math.max(0, acc - dep);
    const cagr = Math.pow(acc / (totalDep || 1), 1 / years) - 1;
    const dbl = cagr > 0 ? Math.round(Math.log(2) / Math.log(1 + cagr)) : 99;
    return { acc, dep: totalDep, growth, cagr, dbl, series, years };
  }, [startYear, monthly]);

  function adjustYear(d) {
    setStartYear(y => Math.min(MAX_YEAR, Math.max(MIN_YEAR, y + d)));
  }
  function adjustMonthly(d) {
    setMonthly(v => Math.min(5000, Math.max(100, v + d)));
  }

  return (
    <div className={`scr${active ? ' on' : ''}`}>
      <div className="chrome">
        <button className="back" onClick={onBack}>→ رجوع</button>
        <span className="vpill">بيانات حقيقية</span>
      </div>

      <div className="card" style={{ marginBottom: 10 }}>
        <div className="step-row" style={{ marginBottom: 10 }}>
          <span className="step-label">بدأت الاستثمار سنة</span>
          <button className="stepbtn" onClick={() => adjustYear(1)}>+</button>
          <span className="step-val">{startYear}</span>
          <button className="stepbtn" onClick={() => adjustYear(-1)}>−</button>
        </div>
        <div className="step-row">
          <span className="step-label">استثمرت شهرياً</span>
          <button className="stepbtn" onClick={() => adjustMonthly(100)}>+</button>
          <span className="step-val">{monthly}</span>
          <button className="stepbtn" onClick={() => adjustMonthly(-100)}>−</button>
        </div>
      </div>

      <SandboxChart series={result.series} startYear={startYear} />

      <div className="sb-stats">
        <div className="sb-stat">
          <div className="k">محفظتك اليوم</div>
          <div className={`v${result.acc > result.dep ? ' pos' : ''}`}>{fmt(result.acc)}</div>
        </div>
        <div className="sb-stat">
          <div className="k">مجموع ما حطيت</div>
          <div className="v">{fmt(result.dep)}</div>
        </div>
        <div className="sb-stat">
          <div className="k">نمو السوق</div>
          <div className="v pos">+{fmt(result.growth)}</div>
        </div>
      </div>

      <div className="sb-insight">
        💡 بمتوسط عائد هالفترة ({(result.cagr * 100).toFixed(1)}%)، فلوسك تتضاعف كل ~{result.dbl} سنوات — والتضعيفة الجاية دايم أكبر من كل اللي قبلها
      </div>
    </div>
  );
}
