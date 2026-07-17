export default function GoalBar({ scen, sim, m }) {
  if (!scen?.persona || !sim) return null;
  const { goal, goalLbl } = scen.persona;
  const N = scen.prices.length;
  const total = sim.hist[m]?.total ?? 0;
  const fillPct = Math.min(100, (total / goal) * 100);
  const pacePct = Math.min(97, (m / N) * 100);
  const pace = goal * (m / N);
  const late = total < pace * 0.85;

  let status, statusCls;
  if (total >= goal) { status = 'وصلت الهدف 🎉'; statusCls = 'ok'; }
  else if (late) { status = 'متأخر عن هدفك ⏳'; statusCls = 'late'; }
  else { status = 'على المسار ✓'; statusCls = 'ok'; }

  return (
    <div className="goalbar">
      <div className="goal-track">
        <div className="goal-fill" style={{ width: fillPct + '%' }} />
        <div className="goal-pace" style={{ right: pacePct + '%' }} />
      </div>
      <div className="goal-row">
        <span className="goal-lbl">{goalLbl}</span>
        <span className={`gs ${statusCls}`}>{status}</span>
      </div>
    </div>
  );
}
