import { useState, useEffect, useRef, useCallback } from 'react';
import { fmt, AR_MONTHS, REDUCED } from '../../shared/utils/format';
import { computeStars } from '../../shared/utils/simulate';
import { usePlayEngine } from './usePlayEngine';
import Chart from './Chart';
import GoalBar from './GoalBar';

const BASE_MS = 850;
const FRACS = [0.25, 0.5, 0.75, 1];

function countUp(setter, target) {
  const t0 = performance.now(), dur = 1300;
  let raf;
  function step(t) {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    setter(Math.round(target * e));
    if (p < 1) raf = requestAnimationFrame(step);
  }
  raf = requestAnimationFrame(step);
  return () => cancelAnimationFrame(raf);
}

export default function PlayScreen({
  active, scen, m, sim, actions, hiddenMode, hiddenMeta, unlocked, guess,
  onTick, onAddAction, onHome, onReplay, onReview, onCoach, onMarkDone, onSetEraGuess,
}) {
  // ── local UI state ──
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [slowUntil, setSlowUntil] = useState(-1);
  const [newsUntil, setNewsUntil] = useState(-1);
  const [news, setNews] = useState({ text: '', type: '' });
  const [showSalem, setShowSalem] = useState(false);
  const [salemMsg, setSalemMsg] = useState('');
  const [calloutText, setCalloutText] = useState('');
  const [showCallout, setShowCallout] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showFork, setShowFork] = useState(false);
  const [forkText, setForkText] = useState('');
  const [forkColor, setForkColor] = useState('');
  // Decide overlay
  const [decideOpen, setDecideOpen] = useState(false);
  const [decideEv, setDecideEv] = useState(null);
  // Trade sheet
  const [tradeOpen, setTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState('sell');
  const [tradeFrac, setTradeFrac] = useState(1);
  // Reveal sheet
  const [revealOpen, setRevealOpen] = useState(false);
  const [youFinal, setYouFinal] = useState(0);
  const [botFinal, setBotFinal] = useState(0);
  const [starsData, setStarsData] = useState(null);
  const [firstUnlock, setFirstUnlock] = useState(false);
  // Era guess
  const [eraOpen, setEraOpen] = useState(false);
  const [eraSlider, setEraSlider] = useState(2012);

  const redHeldRef = useRef(0);
  const calloutFiredRef = useRef(new Set());
  const salemTimerRef = useRef(null);
  const calloutTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const confettiRef = useRef(null);
  const holdRafRef = useRef(null);

  const maxM = scen ? scen.prices.length - 1 : 0;
  const cur = sim?.hist[m] ?? null;
  const engineBlocked = decideOpen || tradeOpen || revealOpen || eraOpen;

  // Reset on new game
  useEffect(() => {
    if (!active || !scen) return;
    setPaused(false); setSpeed(1); setSlowUntil(-1); setNewsUntil(-1);
    setNews({ text: '', type: '' }); setShowSalem(false); setShowCallout(false);
    setShowFork(false); setDecideOpen(false); setTradeOpen(false);
    setRevealOpen(false); setEraOpen(false);
    redHeldRef.current = 0; calloutFiredRef.current = new Set();
  }, [scen, active]);

  // Process each new month
  useEffect(() => {
    if (!active || !scen || !sim || m === 0) return;

    // Salary toast
    setShowToast(true);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setShowToast(false), (BASE_MS / speed) * 0.6);

    // Discipline callouts
    const red = scen.prices[m] < scen.prices[m - 1];
    const soldNow = actions.some(a => a.m === m && a.act === 'sell');
    const invested = cur && cur.invVal >= cur.total * 0.5;
    if (red && invested && !soldNow) {
      redHeldRef.current++;
      const tiers = { 2: 'ثبات ✊', 4: 'أعصاب حديد 🔩', 7: 'يد من صخر 🗿' };
      const t = tiers[redHeldRef.current];
      if (t && !calloutFiredRef.current.has(redHeldRef.current)) {
        calloutFiredRef.current.add(redHeldRef.current);
        setCalloutText(t); setShowCallout(true);
        clearTimeout(calloutTimerRef.current);
        calloutTimerRef.current = setTimeout(() => setShowCallout(false), 2200);
      }
    }
    if (soldNow || !invested) redHeldRef.current = 0;

    // Fork chip
    const lastSell = [...sim.receipts].reverse().find(r => r.act === 'sell');
    if (lastSell && m > lastSell.m) {
      const nowVal = lastSell.soldUnits * scen.prices[m];
      const d = nowVal - lastSell.proceeds;
      setForkText(d > 0 ? `بيعتك كلفتك −${fmt(d)} حتى الآن` : `بيعتك وفّرت +${fmt(-d)} حتى الآن`);
      setForkColor(d > 0 ? '#EDA79C' : '#9FD9B4');
      setShowFork(true);
    } else {
      setShowFork(false);
    }

    // Events
    const ev = scen.events[m];
    if (ev) {
      setNews({ text: ev.x, type: ev.t });
      if (ev.slow) setSlowUntil(m + 3);
      setNewsUntil(m + 2);
      if (ev.decide) {
        setPaused(true);
        setDecideEv(ev);
        setDecideOpen(true);
      }
    }

    // Salem messages
    if (scen.salem[m]) {
      setSalemMsg(scen.salem[m]);
      setShowSalem(true);
      clearTimeout(salemTimerRef.current);
      salemTimerRef.current = setTimeout(() => setShowSalem(false), 4000);
    }
  }, [m]); // eslint-disable-line

  const handleFinish = useCallback(() => {
    if (hiddenMode) {
      setPaused(true);
      setEraOpen(true);
    } else {
      openReveal();
    }
  }, [hiddenMode, sim, scen]); // eslint-disable-line

  usePlayEngine({
    running: active && !engineBlocked,
    paused, m, maxM, speed, slowUntil, newsUntil,
    onTick, onFinish: handleFinish,
  });

  // ── Reveal ──
  function openReveal(eg = null) {
    if (!sim || !scen) return;
    const fy = sim.final, fb = sim.salemFinal;
    const st = computeStars(scen, sim);
    const wasUnlocked = unlocked;
    onMarkDone({ eraGuess: eg });
    setYouFinal(0); setBotFinal(0);
    setStarsData(st);
    setFirstUnlock(!wasUnlocked);
    setRevealOpen(true);
    setTimeout(() => {
      countUp(setYouFinal, fy);
      countUp(setBotFinal, fb);
    }, 200);
    if (st.stars === 3 || fy >= fb) fireConfetti();
  }

  function fireConfetti() {
    if (REDUCED || !confettiRef.current) return;
    const canvas = confettiRef.current;
    const ctx = canvas.getContext('2d');
    const r = canvas.parentElement.getBoundingClientRect();
    canvas.width = r.width; canvas.height = r.height;
    const P = [], cols = ['#E3A83B', '#35B8A0', '#F5F1E6'];
    for (let i = 0; i < 46; i++) P.push({
      x: r.width / 2 + (i % 20 - 10) * 8, y: r.height * 0.35,
      vx: Math.sin(i * 2.7) * 3.2, vy: -4 - (i % 5), g: 0.16,
      s: 3 + i % 4, c: cols[i % 3], a: 1,
    });
    const t0 = performance.now();
    (function step(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      P.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.vy += p.g; p.a -= 0.008;
        ctx.globalAlpha = Math.max(0, p.a); ctx.fillStyle = p.c;
        ctx.fillRect(p.x, p.y, p.s, p.s * 1.6);
      });
      ctx.globalAlpha = 1;
      if (t - t0 < 2400) requestAnimationFrame(step);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    })(t0);
  }

  // ── Decide handlers ──
  function handleDecideOption(opt) {
    if (!opt) { setDecideOpen(false); setPaused(false); return; }
    if (opt.f != null) {
      onAddAction({ m, act: 'sell', f: opt.f });
    } else if (opt.inv) {
      onAddAction({ m, act: 'invest' });
    }
    setDecideOpen(false);
    setPaused(false);
  }

  // ── Trade sheet ──
  function openTrade(type) {
    setPaused(true);
    setTradeType(type);
    setTradeFrac(type === 'sell' ? 1 : null);
    setTradeOpen(true);
  }

  function closeTrade() {
    setTradeOpen(false);
    setPaused(false);
  }

  function buildTradePreview() {
    if (!cur || !scen) return '';
    if (tradeType === 'invest') {
      if (cur.cash < 1) return '<span class="neg">ما عندك كاش للاستثمار</span>';
      const units = cur.cash / scen.prices[m];
      return `ريال → وحدات بسعر ${fmt(scen.prices[m])} · تشتري <b>${units.toFixed(2)}</b> وحدة`;
    }
    if (tradeFrac == null) return '';
    const proceeds = cur.units * tradeFrac * scen.prices[m];
    const rmCost = (cur.avgCost || scen.prices[m]) * cur.units * tradeFrac;
    const realized = proceeds - rmCost;
    const cls = realized >= 0 ? 'pos' : 'neg';
    const sign = realized >= 0 ? '▲ +' : '▼ −';
    let html = `تبيع <b>${Math.round(tradeFrac * 100)}%</b> بسعر <b>${fmt(scen.prices[m])}</b><br>`;
    html += `ستحصل على <b class="${cls}">${fmt(proceeds)}</b> ريال · ربح/خسارة <b class="${cls}">${sign}${fmt(Math.abs(realized))}</b>`;
    const inDD = (() => {
      let runMax = scen.prices[0];
      for (let i = 1; i <= m; i++) runMax = Math.max(runMax, scen.prices[i]);
      return scen.prices[m] < runMax * 0.85;
    })();
    if (inDD) html += `<br><span class="warn">⚠️ السوق في هبوط حاد — بيع الذعر؟</span>`;
    return html;
  }

  function confirmTrade() {
    if (tradeType === 'invest') {
      onAddAction({ m, act: 'invest' });
    } else if (tradeFrac != null) {
      onAddAction({ m, act: 'sell', f: tradeFrac });
    }
    setTradeOpen(false);
    setPaused(false);
  }

  function toggleDCA() {
    const on = sim?.autoD ?? true;
    onAddAction({ m, act: on ? 'dcaOff' : 'dcaOn' });
  }

  // ── Hold button (press-and-hold to confirm sell) ──
  function armHold(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const prog = btn.querySelector('.hold-prog');
    let t0 = null;
    function step(t) {
      if (!t0) t0 = t;
      const pct = Math.min(100, ((t - t0) / 1200) * 100);
      if (prog) prog.style.width = pct + '%';
      if (pct < 100) holdRafRef.current = requestAnimationFrame(step);
      else { cancelAnimationFrame(holdRafRef.current); confirmTrade(); }
    }
    holdRafRef.current = requestAnimationFrame(step);
    const cancel = () => {
      cancelAnimationFrame(holdRafRef.current);
      if (prog) prog.style.width = '0%';
      btn.removeEventListener('pointerup', cancel);
      btn.removeEventListener('pointerleave', cancel);
    };
    btn.addEventListener('pointerup', cancel, { once: true });
    btn.addEventListener('pointerleave', cancel, { once: true });
  }

  // ── Era guess ──
  function confirmEra() {
    const eg = eraSlider;
    onSetEraGuess(eg);
    setEraOpen(false);
    openReveal(eg);
  }

  // ── Derived UI values ──
  const dcaOn = sim?.autoD ?? true;
  const fy = sim?.final ?? 0;
  const fb = sim?.salemFinal ?? 0;
  const delta = cur ? cur.total - cur.salem : 0;
  const deltaText = Math.abs(delta) < 1 ? '= سالم' : delta > 0 ? `▲ +${fmt(delta)} عن سالم` : `▼ −${fmt(-delta)} عن سالم`;
  const deltaCls = delta >= 0 ? 'deltachip ahead' : 'deltachip behind';
  const dateText = hiddenMode ? 'سنة ؟؟؟' : AR_MONTHS[m % 12] + ' ' + (scen ? scen.startYear + Math.floor(m / 12) : '');
  const mktChange = m > 0 && scen ? scen.prices[m] / scen.prices[m - 1] - 1 : 0;

  // Stars display
  function starsHtml(st) {
    if (!st) return null;
    return [0, 1, 2].map(i => (
      <span key={i} style={{ color: i < st.stars ? '#E3A83B' : '#2A2718', fontSize: 18 }}>★</span>
    ));
  }

  // Verdict text
  function verdictHtml() {
    if (!sim) return '';
    const diff = Math.abs(fy - fb);
    if (Math.round(fy) === Math.round(fb)) return 'تعادل تام — لعبت مثل سالم بالضبط ✨';
    if (fb > fy) return `سالم غلبك بـ <span class="neg">▼ ${fmt(diff)} ريال</span> — بدون أي ذكاء… بس انضباط`;
    return `غلبت سالم بـ <span class="pos">▲ ${fmt(diff)} ريال</span> — بس تقدر تكررها؟`;
  }

  // Goal result
  function goalResultHtml(eraGuessVal) {
    if (!sim || !scen) return null;
    if (scen.persona) {
      const ok = fy >= scen.persona.goal;
      return (
        <div className={`goalres ${ok ? 'ok' : 'no'}`}>
          {ok
            ? `🎉 ${scen.persona.goalLbl.split(':')[0]} — تحقق! جمعت ${fmt(fy)}`
            : `الهدف ما اكتمل — جمعت ${fmt(fy)} وباقي ${fmt(scen.persona.goal - fy)} ريال`}
        </div>
      );
    }
    if (hiddenMode && eraGuessVal != null && hiddenMeta) {
      const dy = Math.abs(eraGuessVal - hiddenMeta.year);
      const cls = dy <= 1 ? 'ok' : 'no';
      return (
        <div className={`goalres ${cls}`}>
          {`الحقبة: ${AR_MONTHS[hiddenMeta.month]} ${hiddenMeta.year} — تخمينك ${eraGuessVal} ${dy <= 1 ? '🎯 ضبطت!' : dy <= 3 ? '· قريب' : '· بعيد'}`}
        </div>
      );
    }
    return null;
  }

  const emotionCost = fb - fy;

  if (!active || !scen) return null;

  return (
    <div className={`scr${active ? ' on' : ''}`}>
      {/* Chrome */}
      <div className="chrome">
        <button className="back" onClick={onHome}>→ الرئيسية</button>
        <span className="app"><span className="mk">مُ</span> <span>{scen.title}</span></span>
        <span className="vpill">فلوس افتراضية</span>
      </div>

      {/* HUD */}
      <div className="hud">
        <div className="hud-l">
          <div className="date">{dateText}</div>
          <div className="mo">الشهر {m + 1} من {scen.prices.length}</div>
          {m > 0 && (
            <div className={`d ${mktChange >= 0 ? 'pos' : 'neg'}`}>
              السوق {mktChange >= 0 ? '▲ +' : '▼ '}{(mktChange * 100).toFixed(1)}% هالشهر
            </div>
          )}
        </div>
        <div className="hud-r">
          <div className="youv">{fmt(cur?.total ?? scen.start)}</div>
          <div className="youinv">
            مستثمر {fmt(cur?.invVal ?? scen.start)} · كاش {fmt(cur?.cash ?? 0)}
          </div>
        </div>
      </div>

      {/* Scores row */}
      <div className="scores">
        <div className="scard">
          <div className="who"><span className="dot" style={{ background: '#E3A83B' }} />أنت</div>
          <div className="val">{fmt(cur?.total ?? scen.start)}</div>
        </div>
        <div className="scard">
          <div className="who"><span className="dot" style={{ background: '#35B8A0' }} />سالم</div>
          <div className="val" style={{ color: '#35B8A0' }}>{fmt(cur?.salem ?? scen.start)}</div>
        </div>
        <span className={deltaCls}>{deltaText}</span>
      </div>

      {/* Salary toast */}
      <div className={`salary-toast${showToast ? ' show' : ''}`}>+{fmt(scen.salary)} راتب ✓</div>

      {/* Chart */}
      <Chart scen={scen} sim={sim} m={m} hiddenMode={hiddenMode} />

      {/* Fork chip */}
      {showFork && (
        <div className="fork-chip show" style={{ color: forkColor }}>{forkText}</div>
      )}

      {/* Goal bar */}
      <GoalBar scen={scen} sim={sim} m={m} />

      {/* News flash */}
      {news.text && (
        <div className={`newsflash ${news.type}`}>{news.text}</div>
      )}

      {/* Salem strip */}
      <div className={`salemstrip${showSalem ? ' show' : ''}`}>
        <div className="ava">س</div>
        <span>{salemMsg}</span>
      </div>

      {/* Callout */}
      <div className={`callout${showCallout ? ' show' : ''}`}>{calloutText}</div>

      {/* Action buttons */}
      <div className="acts">
        <button className="act-btn sell" onClick={() => openTrade('sell')}>بِع 📉</button>
        <button className="act-btn hold" onClick={() => { setPaused(p => !p); }}>
          {paused ? '▶ استمر' : '⏸ وقّف'}
        </button>
        {unlocked && (
          <button className="act-btn invest" onClick={() => openTrade('invest')}>استثمر 💵</button>
        )}
      </div>

      {/* DCA + speed row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        {unlocked && (
          <button className={`dca-chip${dcaOn ? ' on' : ''}`} onClick={toggleDCA}>
            {dcaOn ? '✓ راتبي يستثمر تلقائي' : '✗ راتب موقوف'}
          </button>
        )}
        <div className="speed-row">
          {[1, 2, 4].map(s => (
            <button key={s} className={`spd-btn${speed === s ? ' on' : ''}`} onClick={() => setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* ── DECIDE OVERLAY ── */}
      <div className={`decide-dim${decideOpen ? ' on' : ''}`} />
      <div className={`decide${decideOpen ? ' on' : ''}`}>
        {decideEv && (
          <>
            <div className="eye">لحظة فاصلة</div>
            <div className={`dnews ${decideEv.t}`}>{decideEv.x}</div>
            <div className="dq">ماذا تفعل؟</div>
            {decideEv.decide?.map(([label, opt], i) => {
              const cls = opt == null ? 'dopt stay' : opt.inv ? 'dopt invest-p' : 'dopt sell-p';
              return (
                <button key={i} className={cls} onClick={() => handleDecideOption(opt)}>
                  {label}
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* ── TRADE SHEET ── */}
      <div className={`decide-dim${tradeOpen ? ' on' : ''}`} onClick={closeTrade} />
      <div className={`tsheet${tradeOpen ? ' on' : ''}`}>
        <h3>{tradeType === 'sell' ? 'بيع الأسهم' : 'استثمار الكاش'}</h3>
        {tradeType === 'sell' && (
          <div className="frac-row">
            {FRACS.map(f => (
              <button
                key={f}
                className={`frac${tradeFrac === f ? ' on' : ''}`}
                onClick={() => setTradeFrac(f)}
              >
                {f === 1 ? 'الكل' : `${f * 100}%`}
              </button>
            ))}
          </div>
        )}
        <div className="tprev" dangerouslySetInnerHTML={{ __html: buildTradePreview() }} />
        {tradeType === 'sell' ? (
          <div className="hold-btn-wrap">
            <button className="hold-btn" onPointerDown={armHold}>
              اضغط مطوّلاً للبيع 🔴
              <div className="hold-prog" />
            </button>
          </div>
        ) : (
          <button className="btn gold" onClick={confirmTrade}>استثمر كل الكاش</button>
        )}
        <button className="tcancel" onClick={closeTrade}>إلغاء — خلني أفكر</button>
      </div>

      {/* ── ERA GUESS OVERLAY ── */}
      <div className={`decide-dim${eraOpen ? ' on' : ''}`} />
      <div className={`decide${eraOpen ? ' on' : ''}`}>
        <div className="eye">خلصت الرحلة — سؤال أخير 🎲</div>
        <div className="dnews hype">🟡 عشت 18 شهر من تاريخ تاسي الحقيقي… بس متى؟</div>
        <div className="dq">خمّن السنة اللي بدأت فيها هالفترة:</div>
        <div className="era-val">{eraSlider}</div>
        <input
          type="range" className="era-slider"
          min={2004} max={2021} step={1} value={eraSlider}
          onChange={e => setEraSlider(+e.target.value)}
        />
        <button className="dopt stay" onClick={confirmEra}>هذا تخميني 🎯</button>
      </div>

      {/* ── REVEAL SHEET ── */}
      <div className={`sheet-dim${revealOpen ? ' on' : ''}`} />
      <div className={`sheet${revealOpen ? ' on' : ''}`}>
        <div className="grab" />
        <h2>
          {hiddenMode
            ? 'النتيجة — والحين… متى كانت؟'
            : `النتيجة بعد ${Math.round(scen.prices.length / 12)} سنوات`}
        </h2>

        <div className="res">
          {[{ who: 'أنت', val: youFinal, fy, color: '#E3A83B', win: youFinal >= botFinal },
            { who: 'سالم', val: botFinal, fy: fb, color: '#35B8A0', win: botFinal > youFinal }
          ].map(({ who, val, color, win }, i) => {
            const mx = Math.max(youFinal, botFinal, 1);
            return (
              <div className="r" key={i} style={i === 1 && botFinal > youFinal ? { outline: '1.5px solid rgba(53,184,160,.5)', borderRadius: 8 } : {}}>
                <div className="bar" style={{ width: (val / mx * 100) + '%', background: color }} />
                <div className="in2">
                  <span className="who2">
                    <span className="dot2" style={{ background: color }} />
                    {who}{win ? ' 🏆' : ''}
                  </span>
                  <span className="amt">{fmt(val)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rline" dangerouslySetInnerHTML={{ __html: verdictHtml() }} />
        {goalResultHtml(eraOpen ? null : eraSlider)}

        <div className="ledger">
          <span className="k">💭 كلفة قراراتك العاطفية (مقارنة بخطة سالم)</span>
          {emotionCost > 1
            ? <span style={{ color: '#E0584A' }}>−{fmt(emotionCost)} ريال ▼</span>
            : <span style={{ color: '#57BF7E' }}>صفر — قراراتك ما كلفتك ✓</span>}
        </div>

        {starsData && (
          <>
            <div className="disc">
              <span className="k">نقاط الانضباط</span>
              <span className="stars">{starsHtml(starsData)}</span>
            </div>
            <div className="discwhy">{starsData.why.join(' · ')}</div>
          </>
        )}

        {firstUnlock && (
          <div className="unlock show">
            🔓 انفتحت لك: البيع الجزئي + تحكم الراتب + النافذة المخفية
          </div>
        )}

        <div className="sheet-acts">
          <button className="btn gold" onClick={() => { setRevealOpen(false); onReview(); }}>
            🎬 راجع لحظاتك المفصلية
          </button>
          <button className="btn tealb" onClick={() => { setRevealOpen(false); onCoach(); }}>
            ليش صار كذا؟ ← اسأل المدرب 🧠
          </button>
          <button className="btn ghost" onClick={() => { setRevealOpen(false); onReplay(); }}>
            ↺ عيد الجولة بقرارات ثانية
          </button>
        </div>
      </div>

      {/* Confetti */}
      <canvas id="confetti-canvas" ref={confettiRef} />
    </div>
  );
}
