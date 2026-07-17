import { AR_MONTHS } from '../../shared/utils/format';
import { simulate, computeStars, redMonthsStats } from '../../shared/utils/simulate';
import { fmt } from '../../shared/utils/format';
import ReviewChart from './ReviewChart';

export default function ReviewScreen({ active, scen, sim, actions, hiddenMode, onCoach, onReplay, onHome }) {
  if (!active || !scen || !sim) return null;

  const N = scen.prices.length;
  const whenLabel = m => hiddenMode ? `الشهر ${m + 1}` : AR_MONTHS[m % 12] + ' ' + (scen.startYear + Math.floor(m / 12));

  // Action moments with counterfactual
  const realActs = actions.filter(a => a.act === 'sell' || a.act === 'invest');
  const momentCards = [];

  realActs.slice(0, 3).forEach(a => {
    const alt = simulate(scen, actions.filter(x => x !== a), N - 1);
    const d = alt.final - sim.final;
    const when = whenLabel(a.m);
    let tag, tcls;
    if (a.act === 'sell') {
      tag = d > 500 ? 'بيع هلع 🔻' : 'بيع';
      tcls = d > 500 ? 'panic' : 'miss';
    } else {
      tag = d < -500 ? 'دخول موفّق 🎯' : 'استثمار';
      tcls = d < -500 ? 'hold' : 'miss';
    }
    momentCards.push({
      m: a.m,
      when,
      label: a.act === 'sell'
        ? `بعت ${a.f === 1 ? 'كل شي' : Math.round(a.f * 100) + '%'}`
        : 'استثمرت نقدك',
      tag, tcls,
      altFinal: alt.final,
      d,
    });
  });

  // Discipline hold streak
  const rm = redMonthsStats(scen, sim);
  const holdCard = rm.held > 0 ? {
    m: 999, label: 'صمودك في الشهور الحمراء', tag: 'ثبات ✊', tcls: 'hold',
    note: `صمدت في ${rm.held} من ${rm.total} شهر أحمر وأنت مستثمر — وهذي اللي خلت راتبك يشتري رخيص.`,
  } : null;

  if (!momentCards.length) {
    momentCards.push({
      m: 0, label: 'جولة بدون أي حركة', tag: 'مثل سالم ✨', tcls: 'hold',
      note: 'ما لمست شي — وهذا بحد ذاته أصعب قرار في الاستثمار.',
    });
  }

  // Near miss
  const st = computeStars(scen, sim);
  let nearMiss = null;
  if (sim.salemFinal > sim.final && rm.total - rm.held > 0 && rm.total - rm.held <= 3) {
    nearMiss = `صمدت ${rm.held} من ${rm.total} شهر أحمر — ${rm.total - rm.held === 1 ? 'شهر' : 'شهور'} زيادة وكان غلبت سالم! قربت مرة…`;
  } else if (st.stars === 2) {
    nearMiss = 'نجمتين من ثلاث — نجمة وحدة تفصلك عن الانضباط الكامل ⭐';
  }

  const allCards = [...momentCards, ...(holdCard ? [holdCard] : [])].sort((a, b) => a.m - b.m);

  return (
    <div className={`scr${active ? ' on' : ''}`}>
      <div className="chrome">
        <button className="back" onClick={onHome}>→ الرئيسية</button>
        <span className="vpill">مراجعة الجولة 🎬</span>
      </div>

      <ReviewChart scen={scen} sim={sim} actions={actions} />

      {nearMiss && <div className="nearmiss">{nearMiss}</div>}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {allCards.map((c, i) => (
          <div className="moment" key={i}>
            <div className="mtop">
              <span className="mt">{c.when ? `${c.when} — ${c.label}` : c.label}</span>
              <span className={`mtag ${c.tcls}`}>{c.tag}</span>
            </div>
            {c.note ? (
              <div className="mw">{c.note}</div>
            ) : (
              <div
                className="mw"
                dangerouslySetInnerHTML={{
                  __html: `لو ما سويتها، كانت نهايتك <b class="${c.d > 0 ? 'pos' : 'neg'}">${fmt(c.altFinal)} ريال</b> — يعني هالقرار ${c.d > 0 ? `<b class="neg">كلفك ▼ ${fmt(c.d)}</b>` : `<b class="pos">كسبك ▲ ${fmt(-c.d)}</b>`} ريال.`,
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="sheet-acts">
        <button className="btn tealb" onClick={onCoach}>اسأل المدرب عن جولتك 🧠</button>
        <button className="btn ghost" onClick={onReplay}>↺ عيد الجولة</button>
      </div>
    </div>
  );
}
