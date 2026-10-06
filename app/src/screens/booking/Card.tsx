/* The card builder, on one screen with nothing to scroll. Top: the show, what the crowd expects, the clock and the
   Add buttons. Left: the run sheet, one line for each match, promo and angle, in running order with its start time.
   Right: whatever is selected on the sheet (its details and its editor), or the booking notes when nothing is.
   The sheet turns pages if a show ever has more lines than fit. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, me, openModal, view, slice } from '../../store';
import { book } from '../../flow';
import { roleOf } from './Shape';
import { Btn, Meter, brandName, teamName } from '../../kit';
import { Side } from './Side';
import { TopTag, addPromo, addAngle, hm, CATN } from './Segments';
import { Match, onCard, sideText, suggest, addMatch, clearCard, pickMatch, pickSeg, pickSide, sel } from './run';

const DOT = ' · ';
const LEN: Record<string, string> = { S: 'Short', M: 'Medium', L: 'Long' };
/** How many lines of the run sheet show at once. More than this and the sheet turns pages. */
const PER = 13;
const pager = () => slice<{ p: number }>('sheetpage', () => ({ p: 0 }));

/** One side of a match as text: the team's name when it is a regular team, else the names. */
function sideLabel(s: (number | null)[]): string {
  const S = G.S;
  if (s.length > 1 && s.every(id => id != null)) { const t = S.teams.find((x: any) => x.m.length === s.length && x.m.every((id: number) => s.indexOf(id) >= 0)); if (t) return teamName(t); }
  return sideText(s);
}
export function matchLabel(m: Match): string { return (m.mt === 'br' ? 'Battle royal: ' : '') + m.sides.map(sideLabel).join(m.mt === 'br' ? ', ' : ' vs '); }
/** The favourite and their chance, or the finish you have called and what it costs. */
export function odds(m: Match, i: number, n: number) {
  const o = E.matchOdds(G.S, m, i, n);
  if (!o) return <span class="warn">Unfinished</span>;
  if (m.call != null) return <span class="gold">Your call: {m.call < 0 ? 'a draw' : sideText(m.sides[m.call]) + ' wins'} ({m.call < 0 ? o.drawCost : o.cost[m.call]} BP)</span>;
  return <span>Favourite: <b>{sideText(m.sides[o.fav])}</b> {Math.round(o.p[o.fav] * 100)}%</span>;
}
/** Everything the sheet says about a match after its names. The line may be cut short on screen; the detail pane has it in full. */
export function matchMeta(m: Match, i: number, n: number, it: any): [string, ComponentChildren][] {
  const t = m.title ? me().titles.find((x: any) => x.id === m.title) : null;
  const meta: [string, ComponentChildren][] = [['mt', (roleOf(i, n) ? roleOf(i, n) + DOT : '') + E.MT[m.mt].n], ['len', LEN[m.len] + (it ? ', ' + it.mins + ' min' : '')]];
  if (m.stip !== 'std') meta.push(['stip', E.STIP[m.stip].n]);
  if (m.int && m.int !== 'normal') meta.push(['int', <span class={m.int === 'brutal' ? 'bad' : 'good'}>{E.INTN[m.int].n}</span>]);
  if (t) meta.push(['title', <span class="gold">{t.name}</span>]);
  meta.push(['odds', odds(m, i, n)]);
  if (it && it.top) meta.push(['top', <TopTag top={it.top} />]);
  return meta;
}

interface Line { key: string; cls: string; at: number | null; no: string; who: ComponentChildren; meta: ComponentChildren; t: string; v: number; dm?: number; ds?: number; on: boolean; pick: () => void }
/** One line of the run sheet: a button that selects it. */
function Row(p: { l: Line }) {
  const l = p.l;
  return <div class={'seg r1 ' + l.cls + (l.on ? ' sel' : '')} data-m={l.dm} data-seg={l.ds}>
    <button type="button" class="r1b" data-t={l.t} data-v={l.v} aria-pressed={l.on} onClick={l.pick}>
      <span class="at">{l.at == null ? '' : hm(l.at)}</span><span class="no">{l.no}</span><span class="who">{l.who}</span><span class="meta">{l.meta}</span>
    </button>
  </div>;
}

export function Card() {
  const S = G.S, P = me(), b = book(), c = E.cal(S.week), show = S.queue[S.qi], n = S.card.length, s = sel();
  const cost = E.cardCost(S, S.card), on = onCard(), ck = E.clock(S), I = E.segInfo(S), tcls = ck.over || ck.short ? 'bad' : (ck.light ? 'warn' : 'good');
  const itemOf = (f: (x: any) => boolean) => ck.items.find(f);
  // the run sheet, in running order
  const L: Line[] = [];
  const pl = S.plan && S.w[S.plan.sp] ? S.plan : null, pit = itemOf((x: any) => x.t === 'plan');
  if (pl && pit) L.push({ key: 'plan', cls: 'sg' + (pit.top ? ' top' : ''), at: pit.at, no: 'MIC', who: S.w[pl.sp].name + ' opens the show', meta: <><TopTag top={pit.top} /> Promo: {E.PKIND[pl.kind || 'interview'].n}{DOT}{pit.mins} min</>, t: 'plan-row', v: 0, on: false, pick: () => pickSide('promo') });
  const segsAt = (i: number, m: number) => I.list.filter((x: any) => Math.max(0, Math.min(x.pos, m - 1)) === i).forEach((x: any) => {
    const it = itemOf((q: any) => q.t === 'seg' && q.slot === x.slot);
    L.push({ key: 'sg' + x.slot, cls: 'sg' + (x.why ? ' bad' : '') + (it && it.top ? ' top' : ''), at: it ? it.at : null, no: x.t === 'promo' ? 'MIC' : (x.t === 'angle' ? 'ANG' : 'WRI'), ds: x.slot,
      who: x.why ? x.why : (x.who.length ? x.who.map((id: number) => S.w[id].name).join(', ') : 'The writers decide'),
      meta: <>{it && it.top ? <><TopTag top={it.top} /> </> : null}{x.t === 'any' ? '' : CATN[x.t] + ': '}{E.SEGK[x.k].n}{DOT}{x.mins} min</>,
      t: 'seg-edit', v: x.slot, on: s.seg === x.slot, pick: () => pickSeg(x.slot) });
  });
  const FL: any[][] = n ? E.cardFlags(S) : [];
  if (n) S.card.forEach((m: Match, i: number) => {
    segsAt(i, n);
    const it = itemOf((x: any) => x.t === 'match' && x.i === i), t = m.title ? P.titles.find((x: any) => x.id === m.title) : null, done = !!E.matchOdds(S, m, i, n);
    // the line on the sheet is short: what the spot is, the kind of match, the minutes, and the things that stand out
    const fl: any[] = done ? (FL[i] || []) : [];
    const meta = <>{fl.length ? <span data-t="row-flags">{fl.map((f: any, k: number) => <span key={k} class={f.k === 'bad' ? 'bad' : (f.k === 'good' ? 'good' : 'warn')}>[{f.t}] </span>)}</span> : null}{it && it.top ? <><TopTag top={it.top} /> </> : null}{roleOf(i, n) ? roleOf(i, n) + DOT : ''}{E.MT[m.mt].n}{m.stip !== 'std' ? DOT + E.STIP[m.stip].n : ''}{it ? DOT + it.mins + ' min' : ''}
      {!done ? <>{DOT}<span class="warn">Unfinished</span></> : null}{m.call != null ? <>{DOT}<span class="gold">Your call</span></> : null}{t ? <>{DOT}<span class="gold">{t.name}</span></> : null}</>;
    L.push({ key: 'm' + i, cls: (i === n - 1 ? 'me' : '') + (it && it.top ? ' top' : ''), at: it ? it.at : null, no: String(i + 1), dm: i, who: matchLabel(m),
      meta: meta, t: 'edit', v: i, on: b.edit === i, pick: () => pickMatch(i) });
  }); else segsAt(0, 1);
  // pages, when a show has more lines than the sheet holds
  const pg = pager(), pages = Math.max(1, Math.ceil(L.length / PER)), want = L.findIndex(l => l.on);
  if (want >= 0 && Math.floor(want / PER) !== pg.p && pg.p < pages) pg.p = Math.floor(want / PER);
  if (pg.p >= pages) pg.p = pages - 1;
  const shown = L.slice(pg.p * PER, pg.p * PER + PER), turn = (d: number) => view(() => { book().edit = -1; sel().seg = -1; pg.p = Math.max(0, Math.min(pages - 1, pg.p + d)); });
  const cat = (k: string, one: string, many: string) => <span data-t={'cat-' + k}><b>{ck.cats[k].n}</b> {ck.cats[k].n === 1 ? one : many} <span class="num">{ck.cats[k].mins}</span> min</span>;
  return <div class="onescreen book1" data-t="book1">
    <div class="b1-head head">
      <div class="b1-title"><p class="eyebrow">{c.label}{DOT}show {S.qi + 1} of {S.queue.length}</p><h1><span class="hl">{show.name}</span></h1></div>
      <p class="muted b1-info">{show.big ? 'Big event' + (show.flag ? ', the biggest of the year' : '') + '. Whole roster available.' : 'Weekly TV' + (show.brand ? ', ' + brandName(P, show.brand) + ' brand roster' : '') + '.'} This crowd expects <b class="gold" data-t="expect">{E.expectWords(S, show).a}</b>. <button type="button" class="lnk" data-t="ladder" onClick={() => openModal({ kind: 'ladder' })}>What that means</button>
        {DOT}Booking power: <b class="gold">{S.bp}</b> {cost ? <span class={cost > S.bp ? 'bad' : 'muted'}>({cost} committed on this card)</span> : <span class="muted">(nothing called yet)</span>}
        {show.rule && E.RULES[show.rule] ? <>{DOT}<span class="good">{E.RULES[show.rule]}</span></> : null}</p>
      <p class="showtime" data-t="clock" data-v={ck.over ? 'over' : (ck.short ? 'short' : (ck.light ? 'light' : 'ok'))}>Show time: <b class={'num ' + tcls}>{hm(ck.total)}</b> of <b class="num">{hm(ck.budget)}</b> <Meter v={Math.min(100, ck.total / ck.budget * 100)} kind="au" /> <span class={tcls}>{n || ck.total ? ck.words : (ck.budget / 60) + ' hours to fill.'}</span></p>
      <div class="row center b1-btns">
        <Btn t="suggest" onClick={suggest}>Suggest a card</Btn>
        <Btn t="add" onClick={addMatch}>Add a match</Btn>
        <Btn t="add-promo" onClick={addPromo}>Add a promo</Btn>
        <Btn t="add-angle" onClick={addAngle}>Add an angle</Btn>
        {(n > 0 || ck.total > 0) && <Btn t="clear" onClick={clearCard}>Clear</Btn>}
      </div>
    </div>
    <div class="b1-body">
      <div class="b1-sheet">
        <div class="b1-cap" data-t="opening" data-v={ck.open.k}><span class="gold">{ck.open.n}</span> <button type="button" class="lnk" data-t="open-guide" onClick={() => openModal({ kind: 'openguide' })}>Ways to open</button></div>
        <div class="sheet b1-rows" style={{ '--rows': Math.max(10, Math.min(PER, L.length)) } as any}>
          {shown.map(l => <Row key={l.key} l={l} />)}
          {L.length ? null : <div class="b1-empty"><p><b>The card is empty.</b> You have {ck.budget / 60} hours to fill. Add matches, promos and angles one at a time, or start from a suggested card and change what you like.</p>
            <p class="muted mt1">You choose who wrestles. The odds decide who wins, unless you spend booking power to call a finish. Everything on the run sheet takes time off the clock, and the show cannot run until the time is filled.</p></div>}
        </div>
        <div class="b1-foot">
          <span class="cats">{cat('match', 'match', 'matches')}{cat('promo', 'promo', 'promos')}{cat('angle', 'angle', 'angles')}</span>
          {pages > 1 ? <span class="row" data-t="sheet-pages"><Btn kind="sm" t="sheet-prev" disabled={pg.p === 0} onClick={() => turn(-1)}>{'↑'}</Btn><span class="num">Page {pg.p + 1} of {pages}</span><Btn kind="sm" t="sheet-next" disabled={pg.p >= pages - 1} onClick={() => turn(1)}>{'↓'}</Btn></span> : null}
        </div>
      </div>
      <Side on={on} ck={ck} />
    </div>
  </div>;
}
