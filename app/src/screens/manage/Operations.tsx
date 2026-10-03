/* Manage: everything about the company that is a choice. Operations (the broadcast slot, the six settings, the universe
   export), House (house style and house rules) and Deals (sponsors, rivals, trades). What the choices add up to is read on Company. */
import { E } from '../../engine';
import { G, me, Modal, act, say, cash, plural, openModal, redraw, slice, view } from '../../store';
import { Head, Panel, Btn, Tag, Empty, Window, showResult, Name, Sel, Field } from '../../kit';
import { copyText } from '../start';
import { HouseStyle } from './HouseStyle';
import { RivalsPanel } from './Rivals';
import { useKeepFocus } from './focus';

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

/** The six dials: production, risk, tickets, advertising, training camp, medical staff. The page shows them as two columns of three. */
function Settings(p: { from: number; to: number }) {
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
    <Panel title="Ticket prices"><OptRow k="tix" cur={P.tix} names={E.TIXN} notes={tix} /></Panel>,
    <Panel title="Advertising"><OptRow k="adv" cur={P.adv} names={E.ADVN} notes={adv} /></Panel>,
    <Panel title="Training camp"><OptRow k="camp" cur={P.camp || 0} names={ci.names} notes={camp} /></Panel>,
    <Panel title="Medical staff"><OptRow k="med" cur={P.med || 0} names={md.names} notes={med} /></Panel>,
    <Panel title="Travel"><OptRow k="trv" cur={P.trv || 0} names={tv.names} notes={trv} /></Panel>
  ];
  return <>{all.slice(p.from, p.to)}</>;
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

export function Operations() {
  const P = me();
  useKeepFocus();
  return <>
    <Head eyebrow={P.name} title="Operations" />
    <div class="cols">
      <div class="stack"><Broadcast /><Settings from={0} to={3} /></div>
      <div class="stack"><Settings from={3} to={7} /><Merch /><Universe /></div>
    </div>
  </>;
}

export function House() {
  const P = me();
  useKeepFocus();
  return <>
    <Head eyebrow={P.name} title="House" />
    <div class="cols">
      <HouseStyle />
      <HousePanel />
    </div>
  </>;
}

export function Deals() {
  const P = me();
  useKeepFocus();
  return <>
    <Head eyebrow={P.name} title="Deals" />
    <div class="cols">
      <div class="stack"><Sponsors /><Offers /></div>
      <RivalsPanel />
    </div>
  </>;
}
