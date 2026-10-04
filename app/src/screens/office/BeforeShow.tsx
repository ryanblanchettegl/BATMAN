/* Before the show: the first thing on the desk. The next show and the button that books it, then the backstage map and
   what one action point buys in the room that is open. */
import { E, W } from '../../engine';
import { G, ui, me, act, say, view, plural } from '../../store';
import { go, weekDone } from '../../nav';
import { Panel, Btn, Sel, Opt, Tag, CheckLine, Empty, brandName, dataAttrs, Txt, showResult } from '../../kit';
import { EndWeekBtn } from '../../shared/week';
import { office, focusAfter, useFocusAfter, TO_MAP } from './util';
import { Court } from './Court';
import { Tasks } from './Tasks';

const ROOMART: Record<string, string[]> = {
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

function RoomMap(p: { places: any[]; open: string | null }) {
  const st = office();
  return <div class="bsmap">{p.places.map(pl => {
    const on = pl.id === p.open;
    return <button type="button" class={'room' + (on ? ' on' : '') + (pl.used ? ' used' : '')} aria-pressed={on} {...dataAttrs('bs-room', { v: pl.id })}
      onClick={() => view(() => { st.pl = st.pl === pl.id ? null : pl.id; ui.flash = null; })}>
      <pre aria-hidden="true">{(ROOMART[pl.id] || []).join('\n')}</pre>
      <span class="rn">{pl.n}</span>
      <span class="rs">{pl.used ? 'Visited this week' : (pl.badge ? pl.badge + ' ' + plural(pl.badge, 'case') + ' waiting' : ' ')}</span>
    </button>;
  })}</div>;
}

/** Every room but the court: a list of things to do, each costing one action point. */
function RoomActs(p: { room: any; blocked: string }) {
  const S = G.S, st = office();
  const R: W[] = E.rosterOf(S, S.player).filter((w: W) => !w.nw).sort((a: W, b: W) => b.ovr - a.ovr);
  const first = st.a != null ? S.w[st.a] : null;
  const spend = (id: string) => act(() => {
    const r = E.apDo(S, p.room.id, id, { a: st.a, b: st.b });
    say(r.msg, { err: !r.ok });
    showResult(p.room.n, r.msg, !r.ok);
    focusAfter(TO_MAP);
  });
  return <ul class="list">{p.room.acts.map((a: any) => <li class="col">
    <span><b>{a.n}</b><br /><span class="muted">{a.d}</span>{a.ck ? <CheckLine label={a.n} ck={a.ck} /> : null}</span>
    <span class="row">
      {a.need ? <WrestlerSel k="a" list={R} /> : null}
      {a.need === 'pair' ? <WrestlerSel k="b" list={a.same && first ? R.filter(w => w.g === first.g && w.id !== first.id) : R} /> : null}
      <Btn kind="sm" cls="go" t="bs-do" d={{ k: p.room.id, v: a.id }} disabled={!!p.blocked} onClick={() => spend(a.id)}>Spend 1 action point</Btn>
    </span>
  </li>)}</ul>;
}

/** The nearest countdowns, so there is always something about to pay off. Each one goes to its page. */
function ComingUp() {
  const U: any[] = E.comingUp(G.S); if (!U.length) return null;
  return <span class="coming" data-t="coming"><span class="eyebrow">Coming up</span> {U.map((u, i) => <>{i ? <span class="muted"> {'·'} </span> : null}<button type="button" class="lnk" data-t="coming-go" data-v={u.k} onClick={() => go(u.to)}>{u.t}</button></>)}</span>;
}
/** The show that is next, and the one button that takes you to book it. Once every show has run, the button ends the week. */
function NextShow() {
  const S = G.S, sh = S.queue[S.qi], left = S.queue.length - S.qi, gate = E.taskGate(S, 'book');
  if (weekDone()) return <div class="nextshow">
    <p>Every show this week has run.<ComingUp /></p>
    <EndWeekBtn />
  </div>;
  return <div class="nextshow">
    <p><span class="eyebrow">Next show</span><br /><b class="ns">{sh.name}</b> {sh.big ? <Tag kind="gold">Big event</Tag> : <Tag>TV</Tag>}{sh.brand ? <> <Tag>{brandName(me(), sh.brand)}</Tag></> : null}
      <br /><span class="muted">{left > 1 ? left + ' shows left this week.' : ''}</span><ComingUp /></p>
    <div class="row"><Btn kind="go" t="book-next" d={{ home: '' }} disabled={!gate.ok} onClick={() => go('booking')}>Book the next show</Btn>
      {gate.ok ? null : <span class="muted" data-t="book-wait">Finish this week{'’'}s tasks first: {gate.left.length} to do.</span>}</div>
  </div>;
}

export function BeforeShow() {
  const S = G.S, B = E.backstage(S), st = office();
  const room = st.pl ? B.places.find((p: any) => p.id === st.pl) : null;
  const blocked = !room ? '' : (B.ap <= 0 ? 'You are out of action points this week.' : (room.used ? 'You have already spent time here this week.' : ''));
  if (B.ap > 0) st.rooms = false;
  const fold = B.ap <= 0 && !st.rooms && !room;
  useFocusAfter();
  return <Panel title="Before the show" cls="pre mb3">
    <NextShow />
    <Tasks />
    <p class="mt2">Action points this week: <span class="pips" role="img" aria-label={B.ap + ' of ' + B.max}>{Array.from({ length: B.max }, (_, i) => i < B.ap ? <span class="gold">{'◆'}</span> : <span class="muted">{'◇'}</span>)}</span> <span class="num">{B.ap} of {B.max}</span>
      {S.court && S.court.length ? <span class="warn"> {'·'} {S.court.length} in court</span> : null}</p>
    {fold ? <div class="row mt1"><span class="muted">The rooms are closed until next week.</span><Btn kind="sm" t="rooms-show" onClick={() => view(() => { st.rooms = true; })}>Show the rooms</Btn></div> : <>
    <RoomMap places={B.places} open={room ? room.id : null} />
    <div class="roomdet" aria-live="polite">
      {!room ? <Empty>Pick a room. Each visit costs one action point, and you can visit each room once a week.</Empty> : <>
        <h3>{room.n}</h3>
        <p class="muted">{room.d}</p>
        {blocked ? <p class="bad mt1">{blocked}</p> : null}
        {room.id === 'court' ? <Court blocked={blocked} /> : <RoomActs room={room} blocked={blocked} />}
      </>}
    </div></>}
    {B.log && B.log.length ? <div class="aplog">
      <p class="eyebrow">What you have done this week</p>
      <ul class="list">{B.log.map((l: any) => <li class="col"><span><b>{l.place}</b> {'·'} {l.act}{l.who && l.who.length ? ' (' + l.who.join(', ') + ')' : ''}</span><span class={l.ok ? 'good' : 'bad'}><Txt>{l.msg}</Txt></span></li>)}</ul>
    </div> : null}
  </Panel>;
}
