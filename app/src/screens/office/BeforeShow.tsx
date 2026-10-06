/* Before the show: the first thing on the desk. The next show and the button that books it, then the backstage map and
   what one action point buys in the room that is open. */
import { E, W } from '../../engine';
import { G, ui, me, act, say, view, plural, openModal, Modal } from '../../store';
import { go, weekDone } from '../../nav';
import { Panel, Btn, Sel, Opt, Tag, CheckLine, Empty, brandName, dataAttrs, Txt, showResult, Name, Head, Window } from '../../kit';
import { Portrait } from '../../kit/portrait';
import { EndWeekBtn } from '../../shared/week';
import { office, focusAfter, useFocusAfter, TO_MAP } from './util';
import { Court } from './Court';
import { openNight } from '../booking/run';
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
  return <div class="bsmap small">{p.places.map(pl => {
    const on = pl.id === p.open;
    return <button type="button" class={'room' + (on ? ' on' : '') + (pl.used ? ' used' : '')} aria-pressed={on} {...dataAttrs('bs-room', { v: pl.id })}
      onClick={() => view(() => { st.pl = st.pl === pl.id ? null : pl.id; (st as any).who = null; ui.flash = null; })}>
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

/** Backstage as people, not rooms. Everybody shown is there for a reason that is true of the company right now.
    Pick a face, then spend a point on them. */
function People(p: { B: any }) {
  const S = G.S, st = office() as any, B = p.B;
  const all: any[] = B.rooms.reduce((a: any[], r: any) => a.concat(r.people.map((x: any) => ({ ...x, room: r }))), []);
  const sel = all.find(x => x.id === st.who) || null;
  const spend = (id: string) => act(() => { const r = E.peopleDo(S, sel.id, id); say(r.msg, { err: !r.ok }); showResult(sel.name + ', ' + sel.room.n.replace(/^The /, 'the '), r.msg, !r.ok); });
  if (!all.length) return <Empty>Nobody needs you backstage right now. That will not last.</Empty>;
  return <div data-t="people">
    <div class="ppl">{B.rooms.map((r: any) => <div class="pl" key={r.id} data-t="ppl-room" data-v={r.id}>
      <h4>{r.n.replace(/^The /, '')}{r.id === 'court' && S.court && S.court.length ? ' (' + S.court.length + ')' : ''}</h4>
      {r.people.length ? r.people.map((x: any) => <button type="button" key={x.id} class={'who' + (st.who === x.id ? ' on' : '') + (x.used ? ' used' : '')} aria-pressed={st.who === x.id} {...dataAttrs('ppl-who', { v: x.id, k: x.k })}
        onClick={() => view(() => { st.who = st.who === x.id ? null : x.id; st.pl = null; ui.flash = null; })}>
        <Portrait w={S.w[x.id]} cls="pf" />
        <span><b>{x.name}{x.duo ? ' and ' + x.duo : ''}</b><span class={'wy ' + (x.used ? 'muted' : (x.tone || 'muted'))}>{x.used ? 'You have seen them this week' : x.why}</span></span>
      </button>) : <span class="muted nobody">Nobody</span>}
    </div>)}</div>
    {sel ? <div class="roomdet" aria-live="polite" data-t="ppl-det">
      <h3><Name w={S.w[sel.id]} />{sel.duo ? <> and <Name w={S.w[sel.with]} /></> : null}, in {sel.room.n.replace(/^The /, 'the ')}</h3>
      <p class={sel.tone || 'muted'}>{sel.why}.{sel.story ? <span class="muted"> {sel.story}.</span> : null}</p>
      {sel.used ? <p class="muted mt1">You have already spent time with them this week.</p> : (B.ap <= 0 && !sel.acts.some((a: any) => a.free) ? <p class="bad mt1">You are out of action points this week.</p> : null)}
      {sel.room.id === 'court' ? <div class="row mt1"><span class="muted">The case is heard in the court itself.</span><Btn kind="sm" t="ppl-court" onClick={() => openAct('court', 'case')}>Hold court</Btn></div> : null}
      <ul class="list">{sel.acts.map((a: any) => <li class="col" key={a.id}>
        <span><b>{a.n}</b><br /><span class="muted">{a.d}</span>{a.ck ? <CheckLine label={a.n} ck={a.ck} /> : null}</span>
        <span class="row"><Btn kind="sm" cls={/_no$/.test(a.id) ? undefined : 'go'} t="ppl-do" d={{ v: a.id }} disabled={sel.used || (B.ap <= 0 && !a.free)} onClick={() => spend(a.id)}>{a.free ? (/_no$/.test(a.id) ? 'Say no' : (/_yes$/.test(a.id) ? 'Say yes' : a.n)) : 'Spend 1 action point'}</Btn>{a.free ? <span class="muted">No action point</span> : null}</span></li>)}</ul>
    </div> : <p class="muted mt1">Pick somebody. One action point is spent on a person, once a week each. Everybody here is here for a reason.</p>}
  </div>;
}

/** The nearest countdowns, so there is always something about to pay off. Each one goes to its page. */
function ComingUp() {
  const U: any[] = E.comingUp(G.S); if (!U.length) return null;
  return <span class="coming" data-t="coming"><span class="eyebrow">Coming up</span> {U.map((u, i) => <>{i ? <span class="muted"> {'·'} </span> : null}<button type="button" class="lnk" data-t="coming-go" data-v={u.k} onClick={() => go(u.to)}>{u.t}</button></>)}</span>;
}
/** The fire: whatever needs an answer comes first on the desk, above the tasks, with its deadline. Each open matter
    shows the chance of each attempt and one button for each answer. */
function Fire() {
  const S = G.S, open: any[] = S.inbox.filter((e: any) => !e.done);
  if (!open.length) return null;
  const answer = (id: number, c: number) => act(() => { E.resolveEvent(S, id, c); focusAfter(['[data-t="ev"]'], ['[data-t="endweek"]:not([disabled])', '[data-t="book-next"]']); });
  return <div class="fire" data-t="fire">
    <p class="eyebrow"><span class="bad">{open.length === 1 ? 'One matter needs' : open.length + ' matters need'} an answer</span> <span class="muted">{'·'} before the week can end</span></p>
    <ul class="list">{open.map((e: any) => <li key={e.id} class={e.night ? 'night' : undefined}>
      <span>{e.night ? <><Tag kind="bad">From last night</Tag> </> : null}<Txt>{e.text}</Txt>
        {e.checks ? Object.keys(e.checks).map(k => <CheckLine label={e.choices[k]} ck={e.checks[k]} />) : null}</span>
      <span class="row">{e.choices.map((c: string, i: number) => <Btn kind="sm" t="ev" d={{ id: e.id, c: i }} onClick={() => answer(e.id, i)}>{c}</Btn>)}</span>
    </li>)}</ul>
  </div>;
}
/** After a show has run this week: the button that goes back to After the show. */
function Recap() { const A = E.afterShow(G.S); return A ? <Btn kind="sm" t="night-recap" onClick={openNight}>After the show recap</Btn> : null; }
/** The show that is next, and the one button that takes you to book it. Once every show has run, the button ends the week. */
function NextShow() {
  const S = G.S, sh = S.queue[S.qi], left = S.queue.length - S.qi, gate = E.taskGate(S, 'book');
  if (weekDone()) return <div class="nextshow">
    <p>Every show this week has run.<ComingUp /></p>
    <EndWeekBtn /><Recap />
  </div>;
  return <div class="nextshow">
    <p><span class="eyebrow">Next show</span><br /><b class="ns">{sh.name}</b> {sh.big ? <Tag kind="gold">Big event</Tag> : <Tag>TV</Tag>}{sh.brand ? <> <Tag>{brandName(me(), sh.brand)}</Tag></> : null}
      <br /><span class="muted">{left > 1 ? left + ' shows left this week.' : ''}</span><ComingUp /></p>
    <div class="row"><Btn kind="go" t="book-next" d={{ home: '' }} disabled={!gate.ok} onClick={() => go('booking')}>Book the next show</Btn>
      {gate.ok ? null : <span class="muted" data-t="book-wait">Finish this week{'’'}s tasks first: {gate.left.length} to do.</span>}<Recap /></div>
  </div>;
}

export function BeforeShow() {
  const S = G.S, B = E.backstage(S), N = E.people(S);
  useFocusAfter();
  return <Panel title="Before the show" cls="pre mb3">
    <NextShow />
    <Fire />
    <Tasks />
    <p class="mt2" data-t="bs-line">Backstage: <span class="pips" role="img" aria-label={B.ap + ' of ' + B.max}>{Array.from({ length: B.max }, (_, i) => i < B.ap ? <span class="gold">{'◆'}</span> : <span class="muted">{'◇'}</span>)}</span> <span class="num">{B.ap} of {B.max}</span> action {plural(B.max, 'point')} left
      {' · '}<span class={N.count ? undefined : 'muted'}>{N.count ? N.count + ' ' + (N.count === 1 ? 'person is' : 'people are') + ' in the building for a reason' : 'nobody is waiting'}</span>
      {S.court && S.court.length ? <span class="warn"> {'·'} {S.court.length} in court</span> : null}
      {' '}<Btn kind="sm" t="to-backstage" onClick={() => go('backstage')}>Go backstage</Btn></p>
  </Panel>;
}

/** What each thing to do backstage is called on its button: what you get, in plain words, and which group it sits in.
    The engine's own name for it (the flavour) is the title of the pop-up. */
const ACT_UI: Record<string, string[]> = {
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
const ACT_GROUPS: [string, string][] = [['people', 'Your people'], ['show', 'Your next show'], ['story', 'The stories'], ['owner', 'The money and the office']];
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

/** Backstage, its own page in the Office: every room, who is in it and why, and what a point does about it. */
export function Backstage() {
  const S = G.S, B = E.backstage(S), st = office();
  const room = st.pl ? B.places.find((p: any) => p.id === st.pl) : null;
  const blocked = !room ? '' : (B.ap <= 0 ? 'You are out of action points this week.' : (room.used ? 'You have already spent time here this week.' : ''));
  useFocusAfter();
  const nc = S.court ? S.court.length : 0;
  const acts: { pl: any; a: any; ui: string[]; hot?: boolean }[] = [];
  B.places.forEach((pl: any) => pl.acts.forEach((a: any) => { if (!a.off && a.id !== 'case' && ACT_UI[a.id]) acts.push({ pl, a, ui: ACT_UI[a.id] }); }));
  const court = B.places.find((x: any) => x.id === 'court');
  if (court) acts.push({ pl: court, a: { id: 'case' }, ui: ['Judge a dispute between two wrestlers' + (nc ? ' (' + nc + ' waiting)' : ''), nc ? 'Hear both sides and rule. The winner and the loser both remember, and so does the room.' : 'Nobody has brought a case this week.', 'people'], hot: nc > 0 });
  return <>
    <Head eyebrow={E.cal(S.week).label} title="Backstage" />
    <Panel cls="mb2">
      <p data-t="bs-ap">Action points this week: <span class="pips" role="img" aria-label={B.ap + ' of ' + B.max}>{Array.from({ length: B.max }, (_, i) => i < B.ap ? <span class="gold">{'◆'}</span> : <span class="muted">{'◇'}</span>)}</span> <span class="num">{B.ap} of {B.max}</span>
        <span class="muted"> {'·'} One point on a person, once a week each. One visit to each room a week.</span></p>
      <People B={E.people(S)} />
    </Panel>
    <Panel title="Things to do">
      <p class="muted">One action point each. Each place can be used once a week. The button says what you get.</p>
      {ACT_GROUPS.map(g => { const L = acts.filter(x => x.ui[2] === g[0]); return L.length ? <div key={g[0]} class="bsgrp" data-t="bs-grp" data-v={g[0]}>
        <p class="eyebrow">{g[1]}</p>
        <div class="bsacts">{L.map(x => <button type="button" key={x.pl.id + x.a.id} class={'bsact' + (x.pl.used ? ' used' : '') + (x.hot ? ' hot' : '')} {...dataAttrs('bs-act', { k: x.pl.id, v: x.a.id })} onClick={() => openAct(x.pl.id, x.a.id)}>
          <b>{x.ui[0]}</b><span class="eff">{x.ui[1]}</span>
          <span class="muted ft">{x.a.ck ? <span class="warn">{Math.round(x.a.ck.p * 100)}% chance {'·'} </span> : (x.a.id === 'case' ? null : <span class="good">Sure thing {'·'} </span>)}{x.pl.n.replace(/^The /, '')}{x.pl.used ? ' · done this week' : ''}</span></button>)}</div>
      </div> : null; })}
    </Panel>
    {B.log && B.log.length ? <Panel title="What you have done this week" cls="mt2"><div class="aplog">
      <ul class="list">{B.log.map((l: any) => <li class="col"><span><b>{l.place}</b> {'·'} {l.act}{l.who && l.who.length ? ' (' + l.who.join(', ') + ')' : ''}</span><span class={l.ok ? 'good' : 'bad'}><Txt>{l.msg}</Txt></span></li>)}</ul>
    </div></Panel> : null}
  </>;
}
