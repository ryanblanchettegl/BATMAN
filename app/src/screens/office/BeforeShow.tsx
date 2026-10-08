/* The things to do backstage and the pop-up that spends a point on one (ActWindow). The page itself is Backstage.tsx. */
import { E, W } from '../../engine';
import { G, ui, me, act, say, view, plural, openModal, Modal } from '../../store';
import { go, weekDone } from '../../nav';
import { Panel, Btn, Sel, Opt, Tag, CheckLine, Empty, brandName, dataAttrs, Txt, showResult, Name, Head, Window } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { office, focusAfter, useFocusAfter, TO_MAP } from './util';
import { Court } from './Court';

export const ROOMART: Record<string, string[]> = {
  office: ['╔═══╗', '║ $ ║', '╚═╩═╝'], court: [' ─┬─ ', '╱ │ ╲', '▔▔┴▔▔'], trainer: ['┌───┐', '│ + │', '└───┘'], gym: ['╔═╤═╗', '╟─┼─╢', '╚═╧═╝'],
  catering: [' ≈≈≈ ', '╲▁▁▁╱', ' ▔▔▔ '], lot: ['│P│ │', '│ │ │', '╵ ╵ ╵'], truck: ['┌───┐', '│▶ ■│', '└o─o┘']
};

/** The drop-down for the first (`a`) or second (`b`) wrestler an action needs. */
function WrestlerSel(p: { k: 'a' | 'b'; list: W[] }) {
  const st = office();
  const opts: Opt[] = [['', 'Pick a wrestler'], ...p.list.map((w): Opt => [w.id, w.name + ' · ' + Math.round(w.ovr) + ' ' + w.align + (w.inj > 0 ? ' · injured' : '')])];
  return <Sel id={'bs-' + p.k} t="bs" d={{ k: p.k }} label={p.k === 'a' ? 'First wrestler' : 'Second wrestler'} value={st[p.k]} options={opts}
    onChange={v => view(() => { st[p.k] = v === '' ? null : +v; })} />;
}

/** What each thing to do backstage is called on its button: what you get, in plain words, and which group it sits in.
    The engine's own name for it (the flavour) is the title of the pop-up. */
export const ACT_UI: Record<string, string[]> = {
  treat: ['Treat one wrestler’s injuries', 'Eases every worn body part, and takes a week off an injury of two weeks or more.', 'people'],
  drill: ['Train two wrestlers together', 'Better chemistry between the two you pick, so their matches improve. A regular team gains experience.', 'people'],
  class: ['Teach the young wrestlers', 'Up to six wrestlers of 25 and under learn a little faster this week.', 'people'],
  rounds: ['Calm the three most stressed people', 'If it works, stress drops a lot for all three and the room trusts you more.', 'people'],
  pep: ['Fire up the roster for your next show', 'Everybody works harder on the next show you run.', 'show'],
  meet: ['Sharpen your next show with the crew', 'The next show is graded a little better. More if your ideas land.', 'show'],
  hype: ['Advertise your next show', 'A video package for the top of the show. More people in the building next time.', 'show'],
  network: ['Call the network to talk up the show', 'A bigger audience for your next card.', 'show'],
  attack: ['Have one wrestler jump another', 'Starts a rivalry between the two you pick, or heats the one they have.', 'story'],
  tease: ['Tease a newcomer’s debut', 'Hype for somebody who has not appeared yet, up to three times. A hyped debut starts hot.', 'story'],
  bp: ['Ask the owner for 3 more booking power', 'Three extra points this week if the owner says yes. A little trust lost if not.', 'owner'],
  budget: ['Ask the owner for a 5% bigger wage budget', 'More to spend on contracts, for good, if the owner says yes.', 'owner'],
  sponsors: ['Get three new sponsor offers', 'A fresh set of offers lands on Manage, under Deals.', 'owner']
};
export const ACT_GROUPS: [string, string][] = [['people', 'Your people'], ['show', 'Your next show'], ['story', 'The stories'], ['owner', 'The money and the office']];
/** Open the pop-up for one thing to do backstage. */
export function openAct(room: string, actId: string) { const st = office(); st.a = null; st.b = null; openModal({ kind: 'apact', k: room, v: actId }); }
/** One thing to do backstage, in a pop-up: what it is, who it needs, the chance, and the button that spends the point. */
export function ActWindow(p: { m: Modal }) {
  const S = G.S, B = E.backstage(S), room = B.places.find((x: any) => x.id === p.m.k), st = office();
  if (!room) return <Window title="Backstage"><Empty>Nothing to do there.</Empty></Window>;
  const blocked = B.ap <= 0 ? 'You are out of action points this week.' : (room.used ? 'You have already spent time in ' + room.n.replace(/^The /, 'the ') + ' this week.' : '');
  if (room.id === 'court') return <Window title="Wrestlers’ court" wide ok="Done"><p class="muted">{room.d}</p>{blocked ? <p class="bad mt1">{blocked}</p> : null}<Court blocked={blocked} /></Window>;
  const a = room.acts.find((x: any) => x.id === p.m.v);
  if (!a) return <Window title={room.n}><Empty>That is not on offer right now.</Empty></Window>;
  const R: W[] = E.rosterOf(S, S.player).filter((w: W) => !w.nw).sort((x: W, y: W) => y.ovr - x.ovr), first = st.a != null ? S.w[st.a] : null;
  const spend = () => act(() => { const r = E.apDo(S, room.id, a.id, { a: st.a, b: st.b }); say(r.msg, { err: !r.ok }); showResult(a.n, r.msg, !r.ok); });
  return <Window title={(ACT_UI[a.id] || [a.n])[0]} wide ok="Not now">
    <p class="gold">{a.n}</p>
    <p data-t="bs-act-what">{a.d}</p>
    <p class="muted">{room.n}: {room.d}</p>
    {a.ck ? <CheckLine label={a.n} ck={a.ck} /> : null}
    {blocked ? <p class="bad mt1">{blocked}</p> : null}
    <div class="row mt2">
      {a.need ? <WrestlerSel k="a" list={R} /> : null}
      {a.need === 'pair' ? <WrestlerSel k="b" list={a.same && first ? R.filter(w => w.g === first.g && w.id !== first.id) : R} /> : null}
      <Btn kind="go" t="bs-do" d={{ k: room.id, v: a.id }} disabled={!!blocked} onClick={spend}>Spend 1 action point</Btn>
    </div>
  </Window>;
}

