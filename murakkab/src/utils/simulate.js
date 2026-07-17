/**
 * Pure simulator — single source of truth.
 * actions: [{m, act:'sell'|'invest'|'dcaOff'|'dcaOn', f?}]
 *   applied at month m AFTER growth+salary.
 * Returns per-month history + per-action receipts.
 * Player and Salem share identical math.
 */
export function simulate(scen, actions, upto) {
  const P = scen.prices;
  const sal = scen.salary;
  const div = scen.divM;
  let units = scen.start / P[0];
  let cost = scen.start;
  let cash = 0;
  let autoD = true;
  let sUnits = scen.start / P[0];

  const hist = [{ total: scen.start, salem: scen.start, invVal: scen.start, cash: 0, units, avgCost: P[0] }];
  const receipts = [];
  const outMonths = new Set();
  let dcaOff = 0;

  const acts = [...actions].sort((a, b) => a.m - b.m);
  let ai = 0;

  for (let i = 1; i <= upto; i++) {
    const p = P[i];
    // dividends reinvest (units grow, cost unchanged)
    units *= (1 + div);
    sUnits *= (1 + div);
    // Salem always DCA
    sUnits += sal / p;
    if (autoD) { units += sal / p; cost += sal; } else { cash += sal; dcaOff++; }

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
        receipts.push({ m: i, act: 'invest', price: p, amount: cash }); cash = 0;
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
