/* The running order: what each spot on the card is for, how this card reads against the old rules of the booking
   office, and a window that spells those rules out. The engine side is src/92-shape.js. */
import { E } from '../../engine';
import { G, Modal, openModal } from '../../store';
import { Btn, Window, Empty } from '../../kit';

/** The name of a spot on a card of `n` matches, or ''. */
export function roleOf(i: number, n: number): string { return n < 3 ? '' : (i === n - 1 ? 'Main event' : (i === 0 ? 'Opener' : (i === n - 2 && n >= 4 ? 'Semi-main' : ''))); }

/** How the card on the desk reads, rule by rule. */
export function Shape() {
  const S = G.S, R = E.shape(S, S.card);
  return <>
    {S.card.length < 3 ? <Empty>Put three or more matches on the card and the road agent reads the running order.</Empty>
      : <ul class="shape" data-t="shape-notes">{R.notes.map((x: any, k: number) => <li key={k} class={x.s > 0 ? 'good' : (x.s < 0 ? 'bad' : undefined)}><span aria-hidden="true">{x.s > 0 ? '▲' : (x.s < 0 ? '▼' : '·')}</span> {x.t}</li>)}</ul>}
    <div class="row mt2"><Btn kind="sm" t="shape-guide" onClick={() => openModal({ kind: 'shapeguide' })}>How a show should flow</Btn></div>
  </>;
}

export function ShapeGuide(_p: { m: Modal }) {
  return <Window title="How a show should flow" wide>
    <p class="muted">Where a match sits matters as much as who is in it. These are the old rules of the booking office. Follow them and the crowd gives you more. Each one shows up in the report by name.</p>
    <ol class="rules">{E.SHAPE_GUIDE.map((r: any) => <li key={r.n}><b>{r.n}.</b> {r.d}</li>)}</ol>
  </Window>;
}
