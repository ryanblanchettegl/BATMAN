/* Rival promotions: relations, supershows and wars (fed against fed), and one-for-one talent trades. */
import { E } from '../../engine';
import { G, me, act, view, say } from '../../store';
import { Panel, Btn, Sel, Field, CheckLine, Opt, champOf } from '../../kit';
import { co, noTrade } from './state';

const others = (): string[] => { const S = G.S; return S.order.filter((id: string) => id !== S.player); };

/** The working agreement: who with, what it gives, when the next joint show is, and a way out. */
function Agreement() {
  const S = G.S, A = E.agreement(S);
  if (!A) return null;
  return <p class="note mb1"><span>Working agreement with {A.with.name}: easier trades, top titles recognised by both, a joint supershow in {A.next} {A.next === 1 ? 'week' : 'weeks'}. Relations {A.rel}{A.trouble ? '. Trouble: ' + A.trouble : ''}.</span>
    <Btn kind="sm" t="agree-end" onClick={() => act(() => { const r = E.agreeEnd(S); say(r.text); })}>End it</Btn>
    {E.unifyOptions(S).map((o: any) => <Btn kind="sm" t="unify" d={{ g: o.g }} onClick={() => act(() => { const r = E.unify(S, o.g); say(r.text, { err: !r.ok }); })}>Unify the {o.mine.name} with the {o.theirs.name} {o.odds}%</Btn>)}</p>;
}

/** A supershow or a war already running: who with, until when, the series score and who is visiting. */
function Arrangement() {
  const S = G.S, x = E.xfState(S);
  if (!x) return null;
  return <p class="note mb1"><span>{x.kind === 'war' ? 'At war with ' : 'Supershow with '}{S.promos[x.with].name} until {E.cal(x.until).label}. Series: {x.sc[0]}–{x.sc[1]}. Visiting: {x.guests.map((id: number) => S.w[id].name).join(', ')}.</span></p>;
}

function RivalRow(p: { id: string; busy: boolean }) {
  const S = G.S, id = p.id, R = S.promos[id], r = Math.round(R.rel || 0), why = E.xfCan(S, id), tp = E.temperOf(S, id);
  const propose = (kind: string) => act(() => { const x = E.xfPropose(S, id, kind); say(x.msg, { err: !x.ok }); });
  const odds = (kind: string) => Math.round(E.xfOdds(S, id, kind).p * 100) + '%';
  return <li>
    <span><b>{R.name}</b> {tp && tp.owner ? <span class="muted">({tp.owner}, {tp.n.toLowerCase()})</span> : null} <span class="muted">relations</span> <span class={r >= 20 ? 'good' : (r <= -20 ? 'bad' : 'muted')}>{(r > 0 ? '+' : '') + r}</span>
      {why && !p.busy ? <><br /><span class="muted">{why}</span></> : null}</span>
    <span class="row">
      <Btn kind="sm" t="xf" d={{ k: id, v: 'super' }} disabled={!!why} onClick={() => propose('super')}>Supershow {odds('super')}</Btn>
      <Btn kind="sm" t="xf" d={{ k: id, v: 'war' }} disabled={!!why} onClick={() => propose('war')}>Start a war {odds('war')}</Btn>
      <Btn kind="sm" t="agree" d={{ k: id }} disabled={!!E.agreeCan(S, id)} onClick={() => act(() => { const x = E.agreePropose(S, id); say(x.text, { err: !x.ok }); })}>Partner {Math.round(E.agreeOdds(S, id).p * 100)}%</Btn>
    </span>
  </li>;
}

/** Pick a promotion, one of theirs and one of yours; the odds show before you ask.
    The three selects sit in one column: on a remote, up and down move between them and left and right change the pick. */
function TradeDesk() {
  const S = G.S, P = me(), st = co(), T = st.trade;
  const their: any[] = T.pid && S.promos[T.pid] ? E.tradeList(S, T.pid) : [];
  const mine: any[] = E.rosterOf(S, P.id).filter((w: any) => !champOf(P, w.id).length && w.inj <= 0).sort((a: any, b: any) => b.ovr - a.ovr);
  // a pick can go stale when the week turns (signed elsewhere, injured, now a champion): treat it as not picked
  const has = (L: any[], v: string) => v !== '' && L.some(w => String(w.id) === v);
  const theirs = has(their, T.theirs) ? T.theirs : '', give = has(mine, T.mine) ? T.mine : '';
  const ck = give !== '' && theirs !== '' ? E.tradeOdds(S, +give, +theirs) : null;
  const opt = (w: any): Opt => [w.id, w.name + ' · ' + Math.round(w.ovr)];
  const pick = (k: 'pid' | 'theirs' | 'mine') => (v: string) => view(() => { T[k] = v; if (k === 'pid') T.theirs = ''; });
  const propose = () => act(() => { const r = E.trade(S, +give, +theirs); say(r.msg, { err: !r.ok }); if (r.ok) st.trade = noTrade(); });
  return <>
    <p class="eyebrow mt3">Talent trade</p>
    <div class="tradeform">
      <Field label="Trade with"><Sel id="tr-pid" t="trade" d={{ k: 'pid' }} value={T.pid} onChange={pick('pid')} options={[['', 'Pick a promotion'], ...others().map((id): Opt => [id, S.promos[id].name])]} /></Field>
      {T.pid ? <>
        <Field label="You get"><Sel id="tr-theirs" t="trade" d={{ k: 'theirs' }} value={theirs} onChange={pick('theirs')} options={[['', 'Pick one of theirs'], ...their.map(opt)]} /></Field>
        <Field label="You give"><Sel id="tr-mine" t="trade" d={{ k: 'mine' }} value={give} onChange={pick('mine')} options={[['', 'Pick one of yours'], ...mine.map(opt)]} /></Field>
      </> : null}
    </div>
    {ck ? <>
      <div class="mt2"><CheckLine label="They say yes" ck={ck} /></div>
      <div class="row mt2"><Btn kind="go" t="trade" onClick={propose}>Propose the trade</Btn><span class="muted">Champions and anyone out of your reach are not listed.</span></div>
    </> : null}
  </>;
}

export function RivalsPanel() {
  const busy = !!E.xfState(G.S);
  return <Panel cls="mb3" title="Rival promotions">
    <Agreement />
    <Arrangement />
    <ul class="list">{others().map(id => <RivalRow id={id} busy={busy} />)}</ul>
    <p class="muted mt2">{Object.keys(E.TEMPER).map((k: string) => E.TEMPER[k].n + ': ' + E.TEMPER[k].d).join(' ')}</p>
    <p class="muted mt2">A supershow lends you their stars for your next big event and lifts the gate. A war puts four of theirs on your shows for two months: win the series and your popularity rises at their expense. Signing a rival{'’'}s talent sours relations.</p>
    <TradeDesk />
  </Panel>;
}
