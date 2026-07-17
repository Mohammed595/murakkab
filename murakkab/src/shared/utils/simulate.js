/**
 * Pure simulator — single source of truth.
 * actions: [{m, act:'sell'|'invest'|'dcaOff'|'dcaOn', f?}]
 * Returns per-month history + per-action receipts.
 */
export function simulate(scen, actions, upto) {
  const P = scen.prices;
  let units = scen.start / P[0];
  let cost = scen.start;
  let cash = 0;
  let autoD = true;
  let sUnits = scen.start / P[0];

  const hist = [{
    total: scen.start, salem: scen.start,
    invVal: scen.start, cash: 0, units, avgCost: P[0],
  }];
  const receipts = [];
  const outMonths = new Set();
  let dcaOff = 0;

  const acts = [...actions].sort((a, b) => a.m - b.m);
  let ai = 0;

  for (let i = 1; i <= upto; i++) {
    const p = P[i];
    units *= (1 + scen.divM);
    sUnits *= (1 + scen.divM);
    sUnits += scen.salary / p;
    if (autoD) { units += scen.salary / p; cost += scen.salary; }
    else { cash += scen.salary; dcaOff++; }

    while (ai < acts.length && acts[ai].m === i) {
      const a = acts[ai];
      if (a.act === 'sell' && units > 1e-9) {
        const su = units * a.f;
        const proceeds = su * p;
        const rmCost = cost * a.f;
        units -= su; cost -= rmCost; cash += proceeds;
        receipts.push({ m: i, act: 'sell', f: a.f, price: p, soldUnits: su, proceeds, realized: proceeds - rmCost });
      } else if (a.act === 'invest' && cash > 1) {
        units += cash / p; cost += cash;
        receipts.push({ m: i, act: 'invest', price: p, amount: cash });
        cash = 0;
      } else if (a.act === 'dcaOff') { autoD = false; }
      else if (a.act === 'dcaOn') { autoD = true; }
      ai++;
    }

    const invVal = units * p;
    const total = invVal + cash;
    if (invVal < total * 0.5) outMonths.add(i);
    hist.push({ total, salem: sUnits * p, invVal, cash, units, avgCost: units > 1e-9 ? cost / units : 0 });
  }

  const last = hist[upto];
  return { hist, receipts, outMonths, dcaOff, final: last.total, salemFinal: last.salem, autoD };
}

export function computeStars(scen, sim) {
  const N = scen.prices.length;
  let runMax = scen.prices[0];
  const maxAt = [];
  for (let i = 0; i < N; i++) { runMax = Math.max(runMax, scen.prices[i]); maxAt.push(runMax); }

  let panic = false;
  sim.receipts.forEach(r => { if (r.act === 'sell' && r.f >= 0.5 && r.price < maxAt[r.m] * 0.85) panic = true; });

  const rets = [];
  for (let i = 1; i < N; i++) rets.push({ i, r: scen.prices[i] / scen.prices[i - 1] - 1 });
  rets.sort((a, b) => b.r - a.r);
  const missed = rets.slice(0, 10).filter(t => sim.outMonths.has(t.i)).length;

  const flags = [sim.dcaOff <= N * 0.2, !panic, missed <= 3];
  const why = [
    flags[0] ? 'واصلت استثمار راتبك' : 'وقّفت راتبك عن الاستثمار فترة طويلة',
    flags[1] ? 'ما بعت وقت الذعر' : 'بعت أثناء هبوط حاد (بيع ذعر)',
    flags[2] ? 'حضرت أفضل الشهور' : 'فاتتك أفضل شهور التعافي',
  ];
  return { stars: flags.filter(Boolean).length, flags, why, panic, missed };
}

export function redMonthsStats(scen, sim) {
  let held = 0, total = 0;
  for (let i = 1; i < scen.prices.length; i++) {
    if (scen.prices[i] < scen.prices[i - 1]) {
      total++;
      const h = sim.hist[i];
      const soldThat = sim.receipts.some(r => r.act === 'sell' && r.m === i);
      if (h.invVal >= h.total * 0.5 && !soldThat) held++;
    }
  }
  return { held, total };
}
