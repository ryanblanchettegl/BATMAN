/* The notes beside the card: what the office thinks, the opening promo, the storylines in play, what you have promised. */
import { E } from '../../engine';
import { G } from '../../store';
import { book } from '../../flow';
import { QuestList } from '../../shared/week';
import { Panel, Tabs, Sel, Field, Tag, Name, Meter, CheckLine, Empty, Opt } from '../../kit';
import { pickSide, setPlan } from './run';

type OnCard = Record<number, 1>;

function Advice() {
  const S = G.S, A = E.advice(S, S.card).filter((a: any) => a.tips.length);
  if (!S.card.length) return <Empty>Put a card together and your staff will look it over.</Empty>;
  if (!A.length) return <p class="good">Nobody in the office has a complaint about this card.</p>;
  return <>{A.map((a: any) => <><p class="eyebrow mt2">{a.who}</p>{a.tips.map((t: string) => <p>{'“'}{t}{'”'}</p>)}</>)}</>;
}

function Promo() {
  const S = G.S, L = E.promoBrief(S), pl = S.plan, o = pl ? E.promoOdds(S, pl) : null, x = E.xfState(S);
  return <Panel title="Opening promo">
    <div class="promo">
      <Field label="Who opens the show?"><Sel id="plan-sp" t="plan" d={{ k: 'sp' }} value={pl ? pl.sp : ''} onChange={v => setPlan('sp', v)}
        options={[['', 'Nobody. Leave it to the writers'], ...L.map((w: any) => [w.id, w.name + ' · mic ' + w.mic] as Opt)]} /></Field>
      {pl && <Field label="About what?"><Sel id="plan-topic" t="plan" d={{ k: 'topic' }} value={pl.topic} onChange={v => setPlan('topic', v)} options={Object.keys(E.TOPIC).map(k => [k, E.TOPIC[k].n] as Opt)} /></Field>}
      {pl && <Field label="How?"><Sel id="plan-del" t="plan" d={{ k: 'del' }} value={pl.del} onChange={v => setPlan('del', v)} options={Object.keys(E.DELIV).map(k => [k, E.DELIV[k].n] as Opt)} /></Field>}
    </div>
    {pl && o ? <>
      <p class="muted mt2">{E.DELIV[pl.del].d} {o.why}.</p>
      <CheckLine label={'Delivery (up to ' + o.cap + ' of 10)'} ck={o.ck} />
      <p>Content <b>{o.content}</b> {'·'} Character <b>{o.character}</b> {'·'} Crowd <b>{o.crowd}</b> <span class="muted">out of 10</span></p>
    </> : <p class="muted mt2">Pick someone and you choose the subject and how tightly it is scripted. It is scored on delivery, content, character and crowd, and it counts toward the show.</p>}
    {x && <p class="note mt2"><span>{x.kind === 'war' ? 'War with ' : 'Supershow with '}{S.promos[x.with].name}: {x.sc[0]}{'–'}{x.sc[1]}. Their wrestlers are marked {'“'}visiting{'”'} in the match editor{x.kind === 'war' ? '' : ' at the big event'}.</span></p>}
  </Panel>;
}

/** Rivalries in your company, hottest first. With `on`, each says whether both sides are booked tonight. */
export function Feuds(p: { on?: OnCard }) {
  const S = G.S, fs = E.activeFeuds(S).filter((f: any) => f.promo === S.player).sort((a: any, b: any) => b.heat - a.heat);
  if (!fs.length) return <Empty>No rivalries yet. They start on their own once you run shows.</Empty>;
  return <ul class="list">{fs.map((f: any) => {
    const ids: number[] = f.a.concat(f.b), booked = p.on ? ids.filter(id => p.on![id]).length : -1, out = ids.filter(id => S.w[id].inj > 0).length;
    const meta = E.feudStage(f) + (f.kind === 'dream' ? ' · dream match' : '') + (out ? ' · injury' : '') + (booked >= 0 ? ' · ' + (booked === ids.length ? 'all booked tonight' : (booked ? 'partly booked tonight' : 'not booked tonight')) : '');
    return <li><span><b>{E.feudLabel(S, f)}</b><br /><span class="muted">{meta}</span></span><span class="row"><Meter v={f.heat} kind="hot" /><span class="num">{Math.round(f.heat)}</span></span></li>;
  })}</ul>;
}

/** Tournament matches still owed, and whether tonight's card runs them. */
function TournOwed(p: { on: OnCard }) {
  const S = G.S, T = E.tournActive(S); if (!T || !T.pend.length) return null;
  const booked = (a: number, b: number) => !!p.on[a] && !!p.on[b] && S.card.some((m: any) => m.mt === '1v1' && ((m.sides[0][0] === a && m.sides[1][0] === b) || (m.sides[0][0] === b && m.sides[1][0] === a)));
  return <Panel title={T.name}>
    <ul class="list">{T.pend.slice(0, 8).map((q: number[]) => { const on = booked(q[0], q[1]); return <li><span><Name w={S.w[q[0]]} /> <span class="muted">vs</span> <Name w={S.w[q[1]]} /></span><Tag kind={on ? 'good' : undefined}>{on ? 'On tonight' : 'Still to run'}</Tag></li>; })}</ul>
    {T.pend.length > 8 && <p class="muted">And {T.pend.length - 8} more.</p>}
    <p class="muted mt2">Book these as singles matches. A disqualification or count-out in a knockout match means it has to be run again.</p>
  </Panel>;
}

const TABS = [['advice', 'Staff notes'], ['promo', 'Opening promo'], ['feuds', 'Storylines'], ['targets', 'Targets']];
export function Side(p: { on: OnCard }) {
  const k = book().side || 'advice';
  return <>
    <Tabs label="Booking notes" value={k} onPick={pickSide} items={TABS.map(t => ({ id: t[0], label: t[1], t: 'bk', d: { v: t[0] } }))} />
    {k === 'promo' ? <Promo />
      : k === 'feuds' ? <Panel title="Storylines in play"><Feuds on={p.on} /><p class="muted mt2">Rivals who are both on the show get promos, brawls and run-ins. A hot feud ends with a win at a big event or in a gimmick match.</p></Panel>
      : k === 'targets' ? <Panel title="Promises and targets"><QuestList /></Panel>
      : <Panel title="The office says"><Advice /></Panel>}
    <TournOwed on={p.on} />
  </>;
}
