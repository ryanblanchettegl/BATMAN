/* Manage: everything about the company that is a choice. Operations (the broadcast slot, the six settings, the universe
   export), House (house style and house rules) and Deals (sponsors, rivals, trades). What the choices add up to is read on Company. */
import { E } from '../../engine';
import { G, me, Modal, act, say, cash, plural, openModal, redraw, slice, view } from '../../store';
import { Head, Panel, Btn, Tag, Empty, Window, showResult, Name, Sel, Field } from '../../kit';
import { copyText } from '../start';
import { HouseStyle } from './HouseStyle';
import { RivalsPanel } from './Rivals';
import { useKeepFocus } from './focus';
import { ShowsBelts } from './Create';

/** A multiplier as a signed percentage: 1.1 is +10%. */
const pct = (x: number) => (x >= 1 ? '+' : '−') + Math.abs(Math.round((x - 1) * 100)) + '%';

/** One company setting. An owner just sets it. A booker has to talk the owner into it, so a click on another level is an attempt to persuade them. */
function OptRow(p: { k: string; cur: number; names: string[]; notes: string[]; min?: number; max?: number; why?: string }) {
  const S = G.S, own = S.owner.me, last = p.names.length - 1;
  const set = (i: number) => act(() => {
    if (own) E.setCompany(S, p.k, i);
    else if (i !== p.cur) { const r = E.lobby(S, p.k, i); say(r.msg, { err: !r.ok }); showResult('Asking ' + S.owner.name, r.msg, !r.ok); }
  });
  const up = !own && p.cur < last ? E.lobbyOdds(S, p.k, p.cur + 1) : null, dn = !own && p.cur > 0 ? E.lobbyOdds(S, p.k, p.cur - 1) : null;
  return <>
    <div class="row opts">{p.names.map((n, i) => <Btn kind="sm" on={i === p.cur} t="co-set" d={{ k: p.k, v: i }} disabled={(p.min != null && i < p.min) || (p.max != null && i > p.max)} onClick={() => set(i)}>{n}</Btn>)}</div>
    {p.why ? <p class="muted mt1">{p.why}</p> : null}
    <p class="muted mt1">{p.notes[p.cur]}</p>
    {!own && <p class="muted">Needs {S.owner.name}{'’'}s approval:
      {up ? <> <b>{Math.round(up.p * 100)}%</b> to go up</> : null}{up && dn ? ',' : ''}{dn ? <> <b>{Math.round(dn.p * 100)}%</b> to go down</> : null}. One ask per setting every four weeks.</p>}
  </>;
}

function Broadcast() {
  const S = G.S, P = me(), C = E.company(S), so = E.slotOdds(S);
  return <Panel title="Broadcast">
    <p>Your shows air in <b>{E.SLOTN[P.slot].toLowerCase()}</b>: room for {E.SLOT_MAX[P.slot]} matches a show{P.slot !== P.slot0 ? ', viewers ' + pct(C.slotV[P.slot]) + ' against where you started' : ''}.</p>
    {so.can ? <div class="row mt2">
      <Btn t="slot-ask" onClick={() => act(() => say(E.askSlot(S)))}>Ask the network for {E.SLOTN[so.to].toLowerCase()}</Btn>
      <span class="muted">{Math.round(so.p * 100)}% chance. One meeting every eight weeks.</span>
    </div> : <p class="muted mt1">{so.why}</p>}
  </Panel>;
}

/** The commentary desk: two chairs, and the voices you can sign for them. */
function Desk() {
  const S = G.S, V = E.voices(S), st = slice<{ seat: string }>('desk', () => ({ seat: 'pbp' }));
  const run = (fn: () => any) => act(() => { const r = fn(); say(r.text, { err: !r.ok }); showResult('The commentary desk', r.text, !r.ok); });
  const chair = (k: string, label: string, v: any, skill: string) => <li class="col"><span><b>{label}</b> {v ? <><span>{v.name}</span> <span class="muted">{'·'} {skill} {v[k]} {'·'} {cash(v.wage)} a week</span></> : <span class="muted">Empty</span>}</span>
    {v ? <span class="row opts"><Btn kind="sm" t="desk-drop" d={{ k }} onClick={() => run(() => E.dropVoice(S, k))}>Let go</Btn></span> : null}</li>;
  return <Panel title="Commentary desk">
    <ul class="list">{chair('pbp', 'Play-by-play', V.pbp, 'calling')}{chair('col', 'Colour', V.col, 'colour')}</ul>
    {V.chem != null ? <p class="mt1">Together: <b class={V.chem >= 1.5 ? 'good' : (V.chem <= -1.5 ? 'bad' : undefined)}>{E.chemWord(V.chem)}</b>. The desk is worth about <b class="num">{V.q}</b>. A good desk lifts every match and helps stories get across.</p>
      : <p class="muted mt1">Two voices that work well together lift every match and help stories get across. A weak desk drags them down.</p>}
    <div class="row opts mt2"><span class="muted">Sign for the</span><Btn kind="sm" on={st.seat === 'pbp'} t="desk-seat" d={{ v: 'pbp' }} onClick={() => view(() => { st.seat = 'pbp'; })}>play-by-play chair</Btn><Btn kind="sm" on={st.seat === 'col'} t="desk-seat" d={{ v: 'col' }} onClick={() => view(() => { st.seat = 'col'; })}>colour chair</Btn></div>
    <ul class="list mt1">{V.pool.slice().sort((a: any, b: any) => (b[st.seat] - a[st.seat])).slice(0, 6).map((v: any) => { const ch = st.seat === 'pbp' ? v.chemPbp : v.chemCol; return <li class="col"><span><b>{v.name}</b> <span class="muted">{'·'} {v.style} {'·'} calling {v.pbp}, colour {v.col} {'·'} {cash(v.wage)} a week{ch != null ? ' · ' + E.chemWord(ch).toLowerCase() + ' with your other voice' : ''}</span></span>
      <span class="row opts"><Btn kind="sm" t="desk-hire" d={{ id: v.id }} onClick={() => run(() => E.hireVoice(S, v.id, st.seat))}>Sign</Btn></span></li>; })}</ul>
  </Panel>;
}

/** Merchandise lines: commission a design for a wrestler, and watch the ones that are selling. */
function Merch() {
  const S = G.S, P = me(), L = E.lineList(S), st = slice<{ w: string; k: string }>('merch', () => ({ w: '', k: 'shirt' }));
  const R = S.w.filter((w: any) => w.promo === P.id && !w.nw).sort((a: any, b: any) => b.ovr - a.ovr).slice(0, 30);
  const why = st.w ? E.lineWhy(S, +st.w, st.k) : 'Pick a wrestler.';
  const go = () => act(() => { const r = E.commissionLine(S, +st.w, st.k); say(r.text, { err: !r.ok }); showResult('Merchandise', r.text, !r.ok); });
  return <Panel title="Merchandise">
    {L.length ? <ul class="list">{L.map((x: any) => <li><span><Name w={x.w} /> <span class="muted">{'·'} {x.kind}</span></span><span class="row"><span class="muted">{x.state}</span><span class="num">{cash(x.rev)} a week</span></span></li>)}</ul>
      : <p class="muted">No lines out. A design costs a little up front and sells for weeks, more for a hot name.</p>}
    <p class="muted mt1">{L.length} of {E.lineSlots(S)} lines.</p>
    <Field label="Wrestler"><Sel id="mc-w" t="mc-w" value={st.w} options={[['', 'Pick a wrestler'], ...R.map((w: any) => [w.id, w.name + ' · ' + Math.round(w.ovr)] as [number | string, string])] as any} onChange={v => view(() => { st.w = v; })} /></Field>
    <Field label="Design"><Sel id="mc-k" t="mc-k" value={st.k} options={Object.keys(E.LINEK).map(k => [k, E.LINEK[k].n + ' · ' + cash(E.lineCost(S, k))] as [string, string]) as any} onChange={v => view(() => { st.k = v; })} /></Field>
    <p class="muted">{E.LINEK[st.k].d}</p>
    <div class="row opts mt1"><Btn kind="sm" t="mc-go" disabled={!!why} onClick={go}>Commission it</Btn></div>
    {why && st.w ? <p class="muted mt1">{why}</p> : null}
  </Panel>;
}

/** Tours abroad: two or three weeks in another region. Big gates, a worn roster, and a following. */
function Tours() {
  const S = G.S, T = E.tourInfo(S), home = E.homeRegion(S);
  const go = (reg: number, w: number) => act(() => { const r = E.startTour(S, reg, w); say(r.text, { err: !r.ok }); showResult('The tour', r.text, !r.ok); });
  return <Panel title="Tours abroad">
    <p class="muted">Home is {home.n}: {E.TASTEN[home.taste]}. A tour brings bigger crowds, tires everyone out, and builds a following in the region.</p>
    {T.tour ? <p class="good mt1">On tour in {T.tour.reg.n}: {T.tour.left} {plural(T.tour.left, 'week')} to go. They like {E.TASTEN[T.tour.reg.taste]}.</p> : null}
    <ul class="list mt1">{T.options.map((o: any) => <li class="col"><span><b>{o.reg.n}</b> <span class="muted">{'·'} likes {E.TASTEN[o.reg.taste]}{o.fol ? ' · following ' + o.fol : ''}</span><br /><span class="muted">{o.reg.d}</span></span>
      <span class="row opts"><Btn kind="sm" t="tour" d={{ k: o.id, v: 2 }} disabled={!!T.tour} onClick={() => go(o.id, 2)}>2 weeks: {cash(o.cost2)}</Btn><Btn kind="sm" t="tour" d={{ k: o.id, v: 3 }} disabled={!!T.tour} onClick={() => go(o.id, 3)}>3 weeks: {cash(o.cost3)}</Btn></span></li>)}</ul>
  </Panel>;
}

/** The wrestling school: open it, watch the class fill, see who graduates. */
function School() {
  const S = G.S, c = E.school(S);
  const open = () => act(() => { const r = E.openSchool(S); say(r.text, { err: !r.ok }); showResult('The school', r.text, !r.ok); });
  const shut = () => act(() => { const r = E.closeSchool(S); say(r.text); });
  return <Panel title="Wrestling school">
    {c.open ? <>
      <div class="kv"><div><small>Students</small><span class="num">{c.students} of {c.cap}</span></div><div><small>Pays</small><span class="num">{cash(c.income)} a week</span></div><div><small>Next class</small><span class="num">{c.next} {plural(c.next, 'week')}</span></div></div>
      <p class="muted mt1">So far {c.grads} students have graduated and {c.prospects} became prospects.</p>
    </> : <p class="muted">Take students for a fee. Every twelve weeks a class graduates, and some of them are good enough to sign. Setup costs {cash(c.setup)}.</p>}
    <p class="muted mt1">{c.trainer ? <>Trainer: <Name w={c.trainer} />.</> : 'No trainer on staff.'} The teaching is {c.qualityWord}: about {c.chance}% of a class becomes a prospect. A retired wrestler working as a trainer, or a bigger training camp, makes it better.</p>
    <div class="row opts mt1">{c.open ? <Btn kind="sm" t="school-close" onClick={shut}>Close the school</Btn> : <Btn kind="sm" t="school-open" onClick={open}>Open the school: {cash(c.setup)}</Btn>}</div>
  </Panel>;
}

/** The six dials: production, risk, tickets, advertising, training camp, medical staff. The page shows them as two columns of three. */
function Settings(p: { from: number; to: number; only?: number }) {
  const S = G.S, P = me(), C = E.company(S), md = E.medInfo(S), ci = E.campInfo(S);
  const prod = E.PRODN.map((n: string, i: number) => cash(C.prodCost[i]) + ' a TV show. ' + (i === P.prod0 ? 'What this audience is used to.'
    : (i > P.prod0 ? 'Show ratings +' + ((i - P.prod0) * 0.6).toFixed(1) + ', a few more viewers.' : 'Show ratings −' + ((P.prod0 - i) * 0.6).toFixed(1) + ', fewer viewers.')));
  const risk = ['Sponsors pay the most. Gimmick matches fall flat and injuries are rarer.', 'The middle of the road. Sponsors are comfortable.', 'Gimmick matches hit harder. Sponsors pay less and injuries go up.', 'Gimmick matches hit hardest. Sponsors pay half, injuries climb, and prime time is off the table.'];
  const tix = E.TIXN.map((n: string, i: number) => 'Ticket price ' + pct(C.tixP[i]) + ', demand ' + pct(C.tixD[i]) + '. ' + (i === 0 ? 'Fuller buildings are louder.' : (i === 3 ? 'Empty seats flatten a crowd.' : '')));
  const adv = E.ADVN.map((n: string, i: number) => i ? cash(C.adCost[i]) + ' a week. Lifts ticket demand and big-event buys by about ' + [0, 6, 12, 18][i] + '%.' : 'No spend. The card has to sell itself.');
  const camp = ci.names.map((n: string, i: number) => i ? cash(ci.costs[i]) + ' a week. ' + ci.caps[i] + ' places. Wrestlers in camp improve ' + ['', 'steadily', 'faster', 'fastest'][i] + '. ' + ci.n + ' there now.' : 'No camp. Nobody can be sent away to train.');
  const med = md.names.map((n: string, i: number) => i ? cash(md.costs[i]) + ' a week. Bodies recover faster, injuries are ' + [0, 8, 18, 28][i] + '% shorter and a little rarer.' : 'Nobody at ringside. Wear heals at its own pace.');
  const tv = E.travelInfo(S);
  const trv = tv.names.map((n: string, i: number) => i ? cash(tv.costs[i]) + ' a week. The road wears the roster ' + [0, 30, 60][i] + '% less and fights in the car are ' + [0, 'half as likely', 'rare'][i] + '.' : 'Free. A long week tires people, and a tired roster works worse and gets hurt more.');
  const ph: string = E.modelOf(S).ph;
  const all = [
    <Panel title="Production values"><OptRow k="prodLvl" cur={P.prodLvl} names={E.PRODN} notes={prod} /></Panel>,
    <Panel title="Risk level"><OptRow k="risk" cur={P.risk} names={E.RISKN} notes={risk} min={C.riskMin} max={C.riskMax} why={C.riskMin > 0 || C.riskMax < 3 ? (ph.charAt(0).toUpperCase() + ph.slice(1)) + ' can only run ' + E.RISKN.slice(C.riskMin, C.riskMax + 1).join(' or ') + '.' : undefined} /></Panel>,
    <Panel title="Ticket prices"><OptRow k="tix" cur={P.tix} names={E.TIXN} notes={tix} why={(E.ticketAdvice(S) || { text: undefined }).text} /></Panel>,
    <Panel title="Advertising"><OptRow k="adv" cur={P.adv} names={E.ADVN} notes={adv} /></Panel>,
    <Panel title="Training camp"><OptRow k="camp" cur={P.camp || 0} names={ci.names} notes={camp} /></Panel>,
    <Panel title="Medical staff"><OptRow k="med" cur={P.med || 0} names={md.names} notes={med} /></Panel>,
    <Panel title="Travel"><OptRow k="trv" cur={P.trv || 0} names={tv.names} notes={trv} /></Panel>
  ];
  return <>{p.only != null ? all[p.only] : all.slice(p.from, p.to)}</>;
}

export function HousePanel() {
  const S = G.S, H = E.houseInfo(S);
  const toggle = (id: string) => act(() => { const r = E.setHouse(S, id); if (r) say(r.msg, { err: !r.ok }); });
  return <Panel title="House rules">
    <p><b>{H.on.length} of {H.slots}</b> slots in use.{H.wait ? <span class="bad"> The room needs {H.wait} more {plural(H.wait, 'week')} before a new rule.</span> : null} <span class="muted">A third slot opens at booker level 4, and another when you own the company.</span></p>
    <ul class="list">{H.rules.map((r: any) => <li>
      <span><b>{r.n}</b>{r.on ? <> <Tag kind="gold">In force</Tag></> : null}{r.view > 0 ? <> <Tag kind="good">Company approves</Tag></> : (r.view < 0 ? <> <Tag kind="bad">Company frowns</Tag></> : null)}<br /><span class="muted">{r.d}</span><br /><span class="good">+ {r.plus}</span><br /><span class="bad">− {r.minus}</span></span>
      <Btn kind="sm" on={r.on} t="house" d={{ k: r.id }} disabled={!r.on && (H.on.length >= H.slots || !!r.clash || !!H.wait)} onClick={() => toggle(r.id)}>{r.on ? 'Scrap it' : 'Adopt'}</Btn>
    </li>)}</ul>
  </Panel>;
}

function Sponsors() {
  const S = G.S;
  return <Panel title="Sponsors">
    {S.sponsors.length ? <ul class="list">{S.sponsors.map((x: any, i: number) => <li>
      <span><b>{x.name}</b> {'·'} {cash(x.pay)} a week {'·'} {x.weeks} weeks left<br /><span class="muted">Condition: {x.text}</span></span>
      <Btn kind="sm" t="sp-drop" d={{ v: i }} onClick={() => act(() => say(E.dropSponsor(S, i)))}>End deal</Btn>
    </li>)}</ul> : <Empty>No sponsors signed. You can carry three. Take an offer from the list below.</Empty>}
  </Panel>;
}
function Offers() {
  const S = G.S;
  return <Panel title="Offers">
    {S.spOffers.length ? <ul class="list">{S.spOffers.map((x: any, i: number) => {
      const ok = E.sponsorOk(S, x);
      return <li>
        <span><b>{x.name}</b> {'·'} {cash(x.pay)} a week for {x.weeks} weeks<br /><span class="muted">Condition: {x.text}</span></span>
        <Btn kind="sm" t="sp-accept" d={{ v: i }} disabled={!ok} onClick={() => act(() => say(E.acceptSponsor(S, i)))}>{ok ? 'Sign' : (S.sponsors.length >= 3 ? 'Full' : 'Not met')}</Btn>
      </li>;
    })}</ul> : <Empty>No offers on the table. New ones arrive every four weeks.</Empty>}
    <p class="muted mt2">Break a condition and the sponsor walks, taking a little of your reputation along.</p>
  </Panel>;
}

/* ---------- universe export ---------- */
function exportWorld() {
  const S = G.S, base = S.uni ? S.uni.name : 'My universe', id = S.uni ? S.uni.id : 'my_universe';
  const pk = E.exportUniverse(S, { name: base + ', ' + E.cal(S.week).label, id: id + '_wk' + S.week });
  openModal({ kind: 'export', text: JSON.stringify(pk), workers: pk.workers.length, promos: pk.promotions.length });
}
function Universe() {
  const S = G.S;
  return <Panel title="Universe">
    <p>This world began as <b>{S.uni ? S.uni.name : 'the built-in roster'}</b>.</p>
    <p class="muted mt1">Export it as it stands today, with every signing, title change and created wrestler, as a universe package you can share or start a new game from.</p>
    <div class="row mt2"><Btn t="uni-export" onClick={exportWorld}>Export this world</Btn></div>
  </Panel>;
}
/** The export pop-up: the package as text, ready to copy. */
export function ExportWindow(p: { m: Modal }) {
  const m = p.m, copy = () => copyText(m.text, 'modal-text', () => { m.copied = true; redraw(); });
  return <Window title="Export universe" wide footer={<Btn t="copy-modal" onClick={copy}>{m.copied ? 'Copied' : 'Copy to clipboard'}</Btn>}>
    <p>{m.workers} workers, {m.promos} promotions, {Math.round(m.text.length / 1024)} KB. Copy the text and save it as a <b>.json</b> file. Anyone can load it from the Universe panel on the title screen.</p>
    <textarea id="modal-text" class="export-text mt2" readOnly rows={8} aria-label="Universe package" value={m.text} />
  </Window>;
}

/* Every choice on Manage is a button. The button says what it is and where it stands now; pressing it opens a pop-up
   with the choices (Ryan, 6 October). A tile is: an id, a name, what it is set to now, and the body of its pop-up. */
interface Tile { id: string; n: string; now: () => string; d: string; body: () => any }
function tiles(page: string): { grp: string; list: Tile[] }[] {
  const S = G.S, P = me(), ci = E.campInfo(S), md = E.medInfo(S), tv = E.travelInfo(S), I = E.makeInfo(S), V = E.voices(S);
  const set = (id: string, n: string, i: number, now: string, d: string): Tile => ({ id, n, now: () => now, d, body: () => <Settings from={0} to={0} only={i} /> });
  if (page === 'manage') return [
    { grp: 'On the air', list: [
      { id: 'broadcast', n: 'Broadcast slot', now: () => E.SLOTN[P.slot], d: 'When your shows air. Ask the network for a better one.', body: () => <Broadcast /> },
      { id: 'showsbelts', n: 'Shows and belts', now: () => I.shows.length + ' weekly ' + plural(I.shows.length, 'show') + ', ' + I.titles.length + ' ' + plural(I.titles.length, 'belt'), d: 'Your shows, their networks and standing. Add a show or a belt when there is an occasion.', body: () => <ShowsBelts /> },
      { id: 'desk', n: 'Commentary desk', now: () => (V.pbp ? V.pbp.name : 'Empty') + ' and ' + (V.col ? V.col.name : 'empty'), d: 'The two voices on the air. A good desk lifts every match.', body: () => <Desk /> },
      set('prodLvl', 'Production values', 0, E.PRODN[P.prodLvl], 'What the show looks like, and what it costs to make.'),
      set('risk', 'Risk level', 1, E.RISKN[P.risk], 'How far the product goes. Sponsors and gimmick matches pull opposite ways.')] },
    { grp: 'At the door', list: [
      set('tix', 'Ticket prices', 2, E.TIXN[P.tix], 'Price against how full the building is.'),
      set('adv', 'Advertising', 3, E.ADVN[P.adv], 'A weekly spend that lifts ticket demand and big-event buys.'),
      { id: 'merch', n: 'Merchandise', now: () => 'Lines and shirts', d: 'Launch a line for a wrestler who is hot.', body: () => <Merch /> },
      { id: 'tours', n: 'Tours abroad', now: () => 'The road', d: 'Take the company overseas for a run of shows.', body: () => <Tours /> }] },
    { grp: 'Your people', list: [
      set('camp', 'Training camp', 4, ci.names[P.camp || 0], 'Places in camp, where wrestlers improve faster.'),
      set('med', 'Medical staff', 5, md.names[P.med || 0], 'Faster recovery and shorter injuries.'),
      set('trv', 'Travel', 6, tv.names[P.trv || 0], 'How hard the road is on the roster.'),
      { id: 'school', n: 'Wrestling school', now: () => 'Rookies', d: 'Open a school and bring your own rookies through.', body: () => <School /> }] },
    { grp: 'The books', list: [
      { id: 'budgets', n: 'Budgets', now: () => 'Wages and spending', d: 'What you are allowed to spend, and on what.', body: () => <Budgets /> },
      { id: 'universe', n: 'Universe', now: () => 'Export this world', d: 'Save this world as a file to share or edit.', body: () => <Universe /> }] }];
  if (page === 'house') return [{ grp: 'How the company does things', list: [
    { id: 'style', n: 'House style', now: () => S.owner.me ? 'Yours to set' : S.owner.name + '’s creed', d: 'What the company stands for, and what the crowd is taught to expect.', body: () => <HouseStyle /> },
    { id: 'rules', n: 'House rules', now: () => { const H = E.houseInfo(S); return (H && H.on ? H.on.length : 0) + ' in force'; }, d: 'Standing rules for the locker room and the booking sheet.', body: () => <HousePanel /> }] }];
  return [
    { grp: 'Sponsors', list: [
      { id: 'sponsors', n: 'Your sponsors', now: () => S.sponsors.length + ' signed', d: 'The deals you have, what they pay and the condition on each.', body: () => <Sponsors /> },
      { id: 'offers', n: 'Sponsor offers', now: () => S.spOffers.length + ' on the table', d: 'Money every week for a condition you have to keep.', body: () => <Offers /> }] },
    { grp: 'The library and the money', list: [
      { id: 'tape', n: 'Back catalogue', now: () => 'Your tape library', d: 'What your old shows are worth and what they earn.', body: () => <Tape /> },
      { id: 'licensing', n: 'Licensing', now: () => 'Names and likenesses', d: 'License what you own to somebody else.', body: () => <Licensing /> },
      { id: 'money', n: 'Loans and investors', now: () => P.loan ? 'A loan is running' : 'No loan', d: 'Borrow against the company, or bring money in.', body: () => <Money /> },
      { id: 'forsale', n: 'For sale', now: () => 'The market', d: 'What can be bought or sold right now.', body: () => <ForSale /> }] },
    { grp: 'The other companies', list: [
      { id: 'rivals', n: 'Rivals', now: () => (S.order.length - 1) + ' companies', d: 'Where you stand with each rival, and what can be done with them.', body: () => <RivalsPanel /> }] }];
}
function Tiles(p: { page: string }) {
  // for the browser tests of the choices themselves: every pop-up's body laid out on the page, as it was before the buttons
  if ((window as any).EWF_FLAT) { const all = tiles(p.page).reduce((a: Tile[], g) => a.concat(g.list), []), h = Math.ceil(all.length / 2);
    return <div class="cols"><div class="stack">{all.slice(0, h).map(t => t.body())}</div><div class="stack">{all.slice(h).map(t => t.body())}</div></div>; }
  return <>{tiles(p.page).map(g => <Panel title={g.grp} cls="mb2" key={g.grp}>
    <div class="bsacts">{g.list.map(t => <button type="button" key={t.id} class="bsact" data-t="mng" data-v={t.id} onClick={() => openModal({ kind: 'mng', k: p.page, v: t.id })}>
      <b>{t.n}</b><span class="eff" data-t="mng-now">{t.now()}</span><span class="muted ft">{t.d}</span></button>)}</div>
  </Panel>)}</>;
}
/** The pop-up for one tile: its choices. */
export function ManageWindow(p: { m: Modal }) {
  let t: Tile | null = null; tiles(p.m.k).forEach(g => g.list.forEach(x => { if (x.id === p.m.v) t = x; }));
  if (!t) return <Window title="Manage"><Empty>That is not on this page.</Empty></Window>;
  const T = t as Tile;
  return <Window title={T.n} wide ok="Done"><p class="muted mb1">{T.d} <span class="gold">Now: {T.now()}.</span></p><div class="inwin" data-t="mng-body" data-v={T.id}>{T.body()}</div></Window>;
}

export function Operations() {
  const P = me();
  useKeepFocus();
  return <><Head eyebrow={P.name} title="Operations" /><Tiles page="manage" /></>;
}

export function House() {
  const P = me();
  useKeepFocus();
  return <><Head eyebrow={P.name} title="House" /><Tiles page="house" /></>;
}

/** The back catalogue: what it is worth, what it earns, and the two ways to cash it in. */
function Tape() {
  const S = G.S, t = E.tape(S);
  const lic = () => act(() => { const r = E.licenseTape(S); say(r.text, { err: !r.ok }); showResult('Back catalogue', r.text, !r.ok); });
  const sell = () => act(() => { const r = E.sellTape(S); say(r.text, { err: !r.ok }); showResult('Back catalogue', r.text, !r.ok); });
  return <Panel title="Back catalogue">
    <div class="kv"><div><small>Shows on tape</small><span class="num">{t.n}</span></div><div><small>Worth</small><span class="num">{cash(t.value)}</span></div><div><small>Earns</small><span class="num">{cash(t.weekly)} a week</span></div></div>
    {t.licensed ? <p class="muted mt1">Licensed out for {t.licensed} more {plural(t.licensed, 'week')}.</p> : null}
    {t.best.length ? <p class="muted mt1">Best of the library: {t.best.map((x: any) => x.n + ' (' + x.r + '%)').join(', ')}.</p> : <p class="muted mt1">Every show you run is filmed. Great shows are worth the most, and the value fades slowly.</p>}
    <div class="row opts mt1">
      <Btn kind="sm" t="tape-license" disabled={!!t.licensed || t.n < 8} onClick={lic}>License it: {cash(t.licenseFor)}</Btn>
      <Btn kind="sm" t="tape-sell" disabled={t.n < 8} onClick={sell}>Sell it: {cash(t.sellFor)}</Btn>
    </div>
    <p class="muted mt1">Licensing pays a lump sum and halves your own streaming income for 26 weeks. Selling pays more and clears the library for good.</p>
  </Panel>;
}

/** Monthly budgets for four departments. A limit is set against what you spend now; a warning comes when a month runs over. */
function Budgets() {
  const S = G.S, L = E.budgets(S);
  const set = (k: string, v: string) => act(() => { const r = E.setBudget(S, k, +v); say(r.text, { err: !r.ok }); });
  return <Panel title="Budgets">
    <ul class="list">{L.map((b: any) => <li class="col"><span><b>{b.n}</b> <span class={b.over ? 'bad' : 'muted'}>{'·'} {cash(b.month)} in four weeks{b.limit != null ? ' of ' + cash(b.limit) + (b.over ? ': over' : '') : ''}</span></span>
      <Sel id={'bud-' + b.id} t="bud" d={{ k: b.id }} value={b.limit == null ? '' : 'x'} onChange={v => v !== 'x' && set(b.id, v)} options={[['', 'No limit'], ...(b.limit != null ? [['x', 'Limit set: ' + cash(b.limit)]] : []), ['0.9', 'Set to 90% of what you spend now'], ['1', 'Set to 100% of it'], ['1.1', 'Set to 110% of it'], ['1.25', 'Set to 125% of it']] as any} /></li>)}</ul>
    <p class="muted mt1">A limit is set against what a department costs now. The news says when a month runs over.</p>
  </Panel>;
}

/** Licensing deals: toys, cards and a game. They pay once a year and want stars on long contracts. */
function Licensing() {
  const S = G.S, L = E.licensing(S);
  const run = (fn: () => any) => act(() => { const r = fn(); say(r.text, { err: !r.ok }); showResult('Licensing', r.text, !r.ok); });
  return <Panel title="Licensing">
    <ul class="list">{L.map((x: any) => <li class="col"><span><b>{x.n}</b> <span class="muted">{'·'} {x.partner}</span><br /><span class="muted">{x.d}</span><br />
      <span class="muted">{!x.open ? 'Opens at popularity ' + x.need + '.' : (x.signed ? 'Signed. Next payment in ' + x.next + ' ' + plural(x.next, 'week') + ', about ' + cash(x.pay) + '. Wants ' + x.stars + ' stars on long contracts (you have ' + x.have + ').' : 'Pays about ' + cash(x.pay) + ' a year. Wants ' + x.stars + ' stars on long contracts (you have ' + x.have + ').')}</span></span>
      <span class="row opts">{x.signed ? <Btn kind="sm" t="lic-drop" d={{ k: x.id }} onClick={() => run(() => E.dropLicense(S, x.id))}>End the deal</Btn> : <Btn kind="sm" t="lic-sign" d={{ k: x.id }} disabled={!x.open} onClick={() => run(() => E.signLicense(S, x.id))}>Sign</Btn>}</span></li>)}</ul>
  </Panel>;
}

/** What the companies that closed left behind. */
function ForSale() {
  const S = G.S, L = E.forSale(S);
  if (!L.length) return null;
  return <Panel title="For sale">
    <ul class="list">{L.map((l: any) => <li class="col"><span><b>{l.name}</b> <span class="muted">{'·'} from {l.from}, {l.left} {plural(l.left, 'week')} left</span><br /><span class="muted">{l.note}</span></span>
      <span class="row opts"><Btn kind="sm" t="lot" d={{ id: l.id }} onClick={() => act(() => { const r = E.buyLot(S, l.id); say(r.text, { err: !r.ok }); showResult('For sale', r.text, !r.ok); })}>Buy: {cash(l.price)}</Btn></span></li>)}</ul>
  </Panel>;
}

/** Borrowing and selling a share. A loan is paid back over a year with interest. An investor takes part of every profit and has views. */
function Money() {
  const S = G.S, F = E.finance(S), inv = E.investorOffer(S);
  const run = (fn: () => any, title: string) => act(() => { const r = fn(); say(r.text, { err: !r.ok }); showResult(title, r.text, !r.ok); });
  return <Panel title="Loans and investors">
    {!F.owner ? <p class="muted">Only an owner can borrow for the company or sell a share of it.</p> : <>
      {F.loan ? <>
        <p>You owe <b class="num">{cash(F.loan.bal)}</b> of {cash(F.loan.amt)}. Payments: <b class="num">{cash(F.loan.weekly)}</b> a week.</p>
        <div class="row opts mt1"><Btn kind="sm" t="loan-repay" onClick={() => run(() => E.repayLoan(S), 'The bank')}>Pay it off: {cash(F.loan.bal)}</Btn></div>
      </> : <>
        <p class="muted">A bank loan comes back over a year, with interest. One at a time.</p>
        <div class="row opts mt1">{E.loanOffers(S).map((o: any) => <Btn kind="sm" t="loan" d={{ k: o.id }} onClick={() => run(() => E.takeLoan(S, o.id), 'The bank')}>{o.n}: {cash(o.amt)}</Btn>)}</div>
        <p class="muted mt1">Weekly payments: {E.loanOffers(S).map((o: any) => cash(o.weekly)).join(', ')}.</p>
      </>}
      <p class="eyebrow mt2">Investor</p>
      {F.inv ? <>
        <p>An investor owns <b class="num">{Math.round(F.inv.share * 100)}%</b> of every profit. They {F.inv.want}: {F.inv.d} <span class={F.inv.ok ? 'good' : 'bad'}>{F.inv.ok ? 'You are giving them that.' : 'You are not.'}</span> Patience {F.inv.trust} of 100.</p>
        <div class="row opts mt1"><Btn kind="sm" t="inv-buyout" onClick={() => run(() => E.buyOutInvestor(S), 'The investor')}>Buy them out: {cash(F.inv.buyout)}</Btn></div>
      </> : <>
        <p class="muted">An investor puts in {cash(inv.amt)} now and takes {Math.round(inv.share * 100)}% of every profit for good, unless you buy them out. They will have opinions about the product.</p>
        <div class="row opts mt1"><Btn kind="sm" t="inv-sell" onClick={() => run(() => E.sellShare(S), 'The investor')}>Take the money</Btn></div>
      </>}
    </>}
  </Panel>;
}

export function Deals() {
  const P = me();
  useKeepFocus();
  return <><Head eyebrow={P.name} title="Deals" /><Tiles page="deals" /></>;
}
