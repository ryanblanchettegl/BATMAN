/* The card builder: tonight's show, the run sheet you are putting together, and the notes beside it. */
import { ComponentChildren } from 'preact';
import { E } from '../../engine';
import { G, me, openModal } from '../../store';
import { book } from '../../flow';
import { GateNote } from '../../shared/week';
import { roleOf } from './Shape';
import { Head, Panel, Btn, Name, Meter, brandName } from '../../kit';
import { Editor } from './Editor';
import { Side } from './Side';
import { Opening, PlanRow, SegRows, SegBar, TopTag, addPromo, addAngle, hm } from './Segments';
import { Match, onCard, sideText, suggest, addMatch, clearCard, toggleEdit, moveMatch, removeMatch, run } from './run';

const DOT = ' · ';
const LEN: Record<string, string> = { S: 'Short', M: 'Medium', L: 'Long' };

/** Who is in a match, names in their alignment colours. */
function Sides(p: { m: Match }) {
  const S = G.S, m = p.m, br = m.mt === 'br';
  const who = (id: number | null) => id == null ? <span class="muted">open spot</span> : <Name w={S.w[id]} />;
  return <>
    {br ? <span class="muted">Battle royal: </span> : null}
    {m.sides.map((s: (number | null)[], k: number) => <span key={k}>{k ? (br ? ', ' : <span class="muted"> vs </span>) : null}{s.map((id, q) => <>{q ? ' & ' : null}{who(id)}</>)}</span>)}
  </>;
}
/** The favourite and their chance, or the finish you have called and what it costs. */
function odds(m: Match, i: number, n: number) {
  const o = E.matchOdds(G.S, m, i, n);
  if (!o) return <span class="warn">Unfinished</span>;
  if (m.call != null) return <span class="gold">Your call: {m.call < 0 ? 'a draw' : sideText(m.sides[m.call]) + ' wins'} ({m.call < 0 ? o.drawCost : o.cost[m.call]} BP)</span>;
  return <span>Favourite: <b>{sideText(m.sides[o.fav])}</b> {Math.round(o.p[o.fav] * 100)}%</span>;
}

function MatchRow(p: { m: Match; i: number; n: number; c: any }) {
  const m = p.m, i = p.i, n = p.n, P = me(), open = book().edit === i, it = p.c.items.find((x: any) => x.t === 'match' && x.i === i);
  const t = m.title ? P.titles.find((x: any) => x.id === m.title) : null;
  // each part is a keyed span: rows trade places without keys, and Preact needs the parts to keep one shape while they do
  const meta: [string, ComponentChildren][] = [['mt', (roleOf(i, n) ? roleOf(i, n) + DOT : '') + E.MT[m.mt].n], ['len', LEN[m.len] + (it ? ', ' + it.mins + ' min' : '')]];
  if (m.stip !== 'std') meta.push(['stip', E.STIP[m.stip].n]);
  if (m.int && m.int !== 'normal') meta.push(['int', <span class={m.int === 'brutal' ? 'bad' : 'good'}>{E.INTN[m.int].n}</span>]);
  if (t) meta.push(['title', <span class="gold">{t.name}</span>]);
  meta.push(['odds', odds(m, i, n)]);
  if (it && it.top) meta.push(['top', <TopTag top={it.top} />]);
  return <div class={'seg' + (i === n - 1 ? ' me' : '') + (it && it.top ? ' top' : '')} data-m={i}>
    <div class="no" aria-hidden="true"><span>{i + 1}</span>{it ? <small class="at">{hm(it.at)}</small> : null}</div>
    <div class="body">
      <div class="line1">
        <div><div class="who"><Sides m={m} /></div><div class="meta">{meta.map((x, k) => <span key={x[0]}>{k ? DOT : null}{x[1]}</span>)}</div></div>
        <div class="row">
          <Btn kind="sm" t="edit" d={{ v: i }} onClick={() => toggleEdit(i)}>{open ? 'Done' : 'Edit'}</Btn>
          <Btn kind="sm" t="up" d={{ v: i }} label={'Move match ' + (i + 1) + ' earlier'} disabled={i === 0} onClick={() => moveMatch(i, -1)}>{'↑'}</Btn>
          <Btn kind="sm" t="down" d={{ v: i }} label={'Move match ' + (i + 1) + ' later'} disabled={i === n - 1} onClick={() => moveMatch(i, 1)}>{'↓'}</Btn>
          <Btn kind="sm" t="rm" d={{ v: i }} onClick={() => removeMatch(i)}>Remove</Btn>
        </div>
      </div>
      {open && <Editor m={m} i={i} />}
    </div>
  </div>;
}

/** Something happened before the bell and it needs an answer before the show can run. */
function PreShow(p: { pre: any }) {
  return <Panel cls="mb3" title="Before the show">
    <p>{p.pre.text}</p>
    <div class="row mt3">{p.pre.choices.map((c: string, i: number) => <Btn kind="go" t="pre" d={{ c: i, home: i ? null : '' }} onClick={() => run('pre', i)}>{c}</Btn>)}</div>
  </Panel>;
}

export function Card() {
  const S = G.S, P = me(), b = book(), c = E.cal(S.week), show = S.queue[S.qi], n = S.card.length;
  const v = E.validate(S, S.card), cost = E.cardCost(S, S.card), on = onCard(), ck = E.clock(S), tcls = ck.over || ck.short ? 'bad' : (ck.light ? 'warn' : 'good');
  const pre = S.pre && !S.pre.done && S.pre.key === S.week + ':' + show.id ? S.pre : null;
  return <>
    <Head eyebrow={c.label + DOT + 'show ' + (S.qi + 1) + ' of ' + S.queue.length} title={show.name}>
      <p class="muted mt1">{show.big ? 'Big event' + (show.flag ? ', the biggest of the year' : '') + '. Whole roster available.' : 'Weekly TV' + (show.brand ? ', ' + brandName(P, show.brand) + ' brand roster' : '') + '.'} This crowd expects <b class="gold" data-t="expect">{E.expectWords(S, show).a}</b>. <button type="button" class="lnk" data-t="ladder" onClick={() => openModal({ kind: 'ladder' })}>What that means</button></p>
      {show.rule && E.RULES[show.rule] ? <p class="good mt1">{E.RULES[show.rule]}</p> : null}
      <p class="mt1">Booking power: <b class="gold">{S.bp}</b> {cost
        ? <span class={cost > S.bp ? 'bad' : 'muted'}>({cost} committed on this card)</span>
        : <span class="muted">(nothing called yet: every match plays out on the odds)</span>}</p>
      <p class="mt1 showtime" data-t="clock" data-v={ck.over ? 'over' : (ck.short ? 'short' : (ck.light ? 'light' : 'ok'))}>Show time: <b class={'num ' + tcls}>{hm(ck.total)}</b> of <b class="num">{hm(ck.budget)}</b> <Meter v={Math.min(100, ck.total / ck.budget * 100)} kind="au" /> <span class={tcls}>{n || ck.total ? ck.words : (ck.budget / 60) + ' hours to fill.'}</span></p>
      <div class="row center mt2">
        <Btn t="suggest" onClick={suggest}>Suggest a card</Btn>
        <Btn t="add" onClick={addMatch}>Add a match</Btn>
        <Btn t="add-promo" onClick={addPromo}>Add a promo</Btn>
        <Btn t="add-angle" onClick={addAngle}>Add an angle</Btn>
        {(n > 0 || ck.total > 0) && <Btn t="clear" onClick={clearCard}>Clear</Btn>}
      </div>
    </Head>
    <GateNote />
    {pre && <PreShow pre={pre} />}
    {b.tried && v.errors.length > 0 && <div class="flash err"><b>Fix before the show can run</b><ul>{v.errors.map((e: string) => <li>{e}</li>)}</ul></div>}
    {n > 0 && v.warnings.length > 0 && <div class="flash">{v.warnings.map((w: string, k: number) => <>{k ? <br /> : null}{w}</>)}</div>}
    <div class="cols">
      <div class="stack">
        <div class="sheet"><Opening c={ck} /><PlanRow c={ck} />{n ? S.card.map((m: Match, i: number) => <><SegRows i={i} n={n} c={ck} /><MatchRow m={m} i={i} n={n} c={ck} /></>) : <SegRows i={0} n={1} c={ck} />}</div>
        {n ? null : <Panel><p><b>The card is empty.</b> You have {ck.budget / 60} hours to fill. Add matches, promos and angles one at a time, or start from a suggested card and change what you like.</p>
            <p class="muted mt1">You choose who wrestles. The odds decide who wins, unless you spend booking power to call a finish. Everything on the run sheet takes time off the clock, and the show cannot run until the time is filled.</p></Panel>}
        <SegBar c={ck} />
      </div>
      <div class="stack"><Side on={on} /></div>
    </div>
  </>;
}
