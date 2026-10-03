/* Profile pop-ups: a wrestler, a tag team or a title, opened from any name on any screen.
   They stack: a name inside a pop-up opens another on top, Back steps out one at a time, and the close box shuts them all. */
import { ComponentChildren } from 'preact';
import { E, W } from '../engine';
import { G, ui, me, Card, openCard, popCard, closeCards, cash, full, plural, openModal } from '../store';
import { go } from '../nav';
import { rs } from '../screens/roster/state';
import { sendScout } from '../screens/roster/Profile';
import { Window, Btn, Tag, Name, Side, Meter, Portrait, BeltArt, TitleName, TeamName, PromoName, Empty, champOf, teamName } from '../kit';

const promoName = (pid: string) => pid === 'FA' ? 'Free agent' : (G.S.promos[pid] ? G.S.promos[pid].name : pid);
/** Every title in the world this wrestler holds, with the promotion that owns it. */
function held(id: number): { pid: string; t: any }[] { const S = G.S, out: { pid: string; t: any }[] = []; S.order.forEach((pid: string) => S.promos[pid].titles.forEach((t: any) => { if (t.holders.indexOf(id) >= 0) out.push({ pid, t }); })); return out; }
function list(items: ComponentChildren[]): ComponentChildren { return items.map((x, i) => <>{i ? ', ' : ''}{x}</>); }
function weeksText(n: number) { return n + ' ' + plural(n, 'week'); }

function WrestlerCard(p: { id: number }) {
  const S = G.S, w: W = S.w[p.id], P = me(), mine = w.promo === P.id, fa = w.promo === 'FA';
  const tm = E.teamOf(S, w), fs: any[] = E.feudsFor(S, w.id), ts = held(w.id), cr = E.career(S, w.id), yr = cr.years[0], fit = E.fit(S, w.id);
  const rel = mine ? E.relations(S, w.id) : null, mom = Math.round(w.mom);
  const full_ = () => { closeCards(); rs().sel = w.id; go('roster'); };
  return <>
    <div class="row top nowrap gap2">
      <Portrait w={w} />
      <div>
        <p><Side w={w} /> {w.rt ? <Tag>Retired</Tag> : null}{ts.map(x => <> <Tag kind="gold">Champion</Tag></>).slice(0, 1)}</p>
        <p><b>{w.promo === 'FA' ? 'Free agent' : <PromoName id={w.promo} />}</b> {'·'} Age {w.age} {'·'} {E.STYLE_NAME[w.style] || ''}</p>
        <p class="muted">Finisher: the {w.fin || 'finish'}</p>
      </div>
    </div>
    <div class="kv mt2">
      <div><small>Popularity</small><span><Meter v={w.ovr} kind="au" /> <b class="num">{Math.round(w.ovr)}</b></span></div>
      <div><small>Momentum</small><span class={mom >= 2 ? 'good' : (mom <= -2 ? 'bad' : undefined)}>{mom >= 2 ? '▲ Hot (+' + mom + ')' : (mom <= -2 ? '▼ Cold (' + mom + ')' : '■ Steady')}</span></div>
      <div><small>Mood</small><span>{mine ? <><Meter v={w.morale} kind="cool" /> <b class="num">{Math.round(w.morale)}</b></> : <span class="muted">Not yours to know</span>}</span></div>
      {mine ? <div><small>Body</small><span class={E.bodyWord(S, w.id).bad ? 'bad' : 'good'}>{E.bodyWord(S, w.id).word}</span></div> : null}
      <div><small>Career</small><span class={E.phase(w).id === 'past' || E.phase(w).id === 'late' ? 'bad' : (E.phase(w).id === 'prime' ? 'good' : undefined)}>{E.phase(w).word}</span></div>
      <div><small>Record</small><span class="num">{w.wins}{'–'}{w.losses}{w.ws >= 2 ? ' · won ' + w.ws + ' straight' : (w.ws <= -2 ? ' · lost ' + (-w.ws) + ' straight' : '')}</span></div>
    </div>
    <ul class="list mt2">
      {ts.length ? <li><span>Titles</span><span class="r">{list(ts.map(x => <TitleName pid={x.pid} t={x.t} />))}</span></li> : null}
      {cr.reigns.length ? <li><span>Title reigns</span><span class="r num">{cr.reigns.length}</span></li> : null}
      {fs.length ? <li><span>Feud</span><span class="r">{list(fs.slice(0, 2).map((f: any) => { const o = S.w[(f.a.indexOf(w.id) >= 0 ? f.b : f.a)[0]]; return <>with <Name w={o} /> <span class="muted">({E.feudStage(f).toLowerCase()})</span></>; }))}</span></li> : null}
      {(() => { const st = (S.stables || []).filter((x: any) => x.m.indexOf(w.id) >= 0)[0]; return st ? <li><span>Stable</span><span class="r"><b>{st.name}</b>{st.leader === w.id ? ' (leader)' : ''} <span class="muted">with {list(st.m.filter((id: number) => id !== w.id).map((id: number) => <Name w={S.w[id]} />))}</span></span></li> : null; })()}
      {(() => { const F = E.family(S, w.id); return F && (F.coach != null || F.students.length) ? <li class="col"><span>Trainer and students</span><span class="r">{F.coach != null ? <>Trained by <Name w={S.w[F.coach]} /></> : null}{F.coach != null && F.students.length ? '. ' : ''}{F.students.length ? <>Students: {list(F.students.slice(0, 4).map((id: number) => <Name w={S.w[id]} />))}{F.students.length > 4 ? ' and ' + (F.students.length - 4) + ' more' : ''}</> : null} <Btn kind="sm" t="card-tree" onClick={() => openCard({ k: 'tree', id: w.id })}>Family tree</Btn></span></li> : null; })()}
      {w.fol >= 5 ? <li><span>Following</span><span class="r num">{(Math.round(w.fol * 250 / 100) * 100).toLocaleString('en-US')}</span></li> : null}
      {w.cphrase ? <li class="col"><span>Catchphrase</span><span class="r">{w.cphrase.t} <span class={w.cphrase.n < 15 ? 'good' : (w.cphrase.n < 30 ? 'muted' : 'bad')}>({w.cphrase.n < 15 ? 'fresh' : (w.cphrase.n < 30 ? 'wearing thin' : 'worn out')})</span></span></li> : null}
      {tm ? <li><span>Tag team</span><span class="r"><TeamName t={tm} /></span></li> : null}
      {rel && rel.good.length ? <li><span>Gets on with</span><span class="r">{list(rel.good.slice(0, 4).map((x: W) => <Name w={x} />))}</span></li> : null}
      {rel && rel.bad.length ? <li><span>Does not get on with</span><span class="r">{list(rel.bad.slice(0, 4).map((x: W) => <Name w={x} />))}</span></li> : null}
      {w.rr && w.rr.length ? <li class="col"><span>Last {w.rr.length} {plural(w.rr.length, 'result')}</span><span class="r">{w.rr.map((x: any) => <div><b class={x.r === 'W' ? 'good' : 'bad'}>{x.r}</b> <span class="muted">vs {x.v} {'·'} {x.ov}%</span></div>)}</span></li> : null}
      {yr ? <li><span>This year</span><span class="r num">{yr.m} {plural(yr.m, 'match', 'matches')}, {yr.w}{'–'}{yr.l}{yr.best ? ', best ' + yr.best + '%' : ''}</span></li> : null}
      <li><span>Contract</span><span class="r">{w.rt ? 'Retired' : fa ? <>Free agent, asking about <b class="num">{cash(E.ask(S, w))}</b> a week</> : mine ? <><b class="num">{full(w.wage)}</b> a week, {weeksText(Math.max(0, w.con))} left</> : <>With {promoName(w.promo)}{w.con <= 12 ? ', ' + weeksText(Math.max(0, w.con)) + ' left' : ''}</>}</span></li>
      {fit && !w.rt ? <li><span>For your company</span><span class={'r ' + (fit.v >= 1 ? 'good' : (fit.v <= -2 ? 'bad' : ''))}>{fit.n}</span></li> : null}
    </ul>
    <div class="row mt2">
      {mine ? <Btn kind="sm" t="card-full" onClick={full_}>Full profile</Btn> : null}
      {!mine && !w.rt && !w.nw ? <Btn kind="sm" t="card-scout" onClick={() => sendScout(w.id)}>{w.sc ? 'Scouting report' : 'Send a scout (' + full(E.scoutInfo(S).cost) + ')'}</Btn> : null}
      {!mine && !w.rt && (fa || w.con <= 12) ? <Btn kind="sm" t="card-market" onClick={() => { closeCards(); go('market'); }}>Go to Free agents</Btn> : null}
    </div>
  </>;
}

function TeamCard(p: { id: number }) {
  const S = G.S, t = S.teams.filter((x: any) => x.id === p.id)[0];
  if (!t) return <Empty>This team has split up.</Empty>;
  const a: W = S.w[t.m[0]], b: W = S.w[t.m[1]], key = t.m.slice().sort().join(','), reigns: any[] = [], now: { pid: string; t: any }[] = [];
  S.order.forEach((pid: string) => S.promos[pid].titles.forEach((x: any) => { if (!x.tag) return; (x.hist || []).forEach((h: any) => { if (h.ids === key) reigns.push({ pid, t: x, h }); }); if (x.holders.length === 2 && x.holders.slice().sort().join(',') === key) now.push({ pid, t: x }); }));
  const chem = Math.round(E.chem(S, a.id, b.id) + (t.chem || 0) * 0.3);
  return <>
    <div class="row top gap2">{[a, b].map(w => <div class="row top nowrap"><Portrait w={w} /><div><p><Name w={w} /></p><p class="muted">Age {w.age} {'·'} {E.STYLE_NAME[w.style] || ''}</p><p class="num">Popularity {Math.round(w.ovr)}</p></div></div>)}</div>
    <div class="kv mt2">
      <div><small>Promotion</small><span><PromoName id={t.promo} /></span></div>
      <div><small>Experience together</small><span><Meter v={t.exp} kind="cool" /> <b class="num">{Math.round(t.exp)}</b></span></div>
      <div><small>Chemistry</small><span class={chem >= 2 ? 'good' : (chem <= -2 ? 'bad' : undefined)}>{chem >= 2 ? 'They click' : (chem <= -2 ? 'They get in each other’s way' : 'Workable')}</span></div>
      <div><small>Record together</small><span class="num">{(t.w | 0) + ' wins, ' + (t.l | 0) + ' losses'}</span></div>
      <div><small>Form</small><span>{t.ls >= 2 ? 'Lost ' + t.ls + ' in a row' : 'Steady'}</span></div>
    </div>
    <ul class="list mt2">
      {now.length ? <li><span>Champions</span><span class="r">{list(now.map(x => <TitleName pid={x.pid} t={x.t} />))}</span></li> : null}
      <li><span>Title reigns together</span><span class="r num">{reigns.length}</span></li>
      {reigns.slice(-3).reverse().map(r => <li><span><TitleName pid={r.pid} t={r.t} /></span><span class="r muted">{E.cal(Math.max(1, r.h.from)).label}{r.h.to ? ' to ' + E.cal(r.h.to).label : ' to now'}</span></li>)}
    </ul>
  </>;
}

/** The line of trainers above a wrestler and the students below, drawn in text. */
function TreeCard(p: { id: number }) {
  const S = G.S, F = E.family(S, p.id), w: W = S.w[p.id];
  if (!F) return <Empty>Nobody here.</Empty>;
  const chain: number[] = F.up.slice().reverse(), rows: ComponentChildren[] = [];
  chain.forEach((id, i) => rows.push(<div>{'   '.repeat(i) + (i ? '└─ ' : '')}<Name w={S.w[id]} /></div>));
  rows.push(<div>{'   '.repeat(chain.length) + (chain.length ? '└─ ' : '')}<b>{w.name}</b></div>);
  const walk = (nodes: any[], pre: string) => nodes.forEach((n, i) => { const last = i === nodes.length - 1; rows.push(<div>{pre + (last ? '└─ ' : '├─ ')}<Name w={S.w[n.id]} /></div>); walk(n.kids, pre + (last ? '   ' : '│  ')); });
  walk(F.tree, '   '.repeat(chain.length + 1));
  return <>
    {chain.length ? <p class="muted">Trained by {list(F.up.map((id: number) => <Name w={S.w[id]} />))}, back to the start of the line.</p> : <p class="muted">Nobody is known to have trained {w.name}.</p>}
    <div class="ascii tree">{rows}</div>
    {!F.students.length ? <p class="muted mt1">No students yet. Put a prospect with a mentor on the Locker room page.</p> : null}
  </>;
}

function PromoCard(p: { id: string }) {
  const S = G.S, P = S.promos[p.id];
  if (!P) return <Empty>This promotion is gone.</Empty>;
  const M = E.modelOf(S, p.id), mine = p.id === S.player, rel = Math.round(P.rel || 0), roster = E.rosterOf(S, p.id).length;
  return <>
    <p><b>{P.full || P.name}</b> {mine ? <Tag>You</Tag> : null}</p>
    {P.blurb ? <p class="muted">{P.blurb}</p> : null}
    <div class="kv mt2">
      <div><small>Model</small><span>{M.n}</span></div>
      <div><small>Popularity</small><span><Meter v={P.image} /> <b class="num">{P.image.toFixed(1)}</b></span></div>
      <div><small>Roster</small><span class="num">{roster}</span></div>
      <div><small>Last show</small><span>{P.last ? <>{P.last.name} <b class="num">{P.last.rating}%</b></> : '—'}</span></div>
      {mine ? null : <div><small>Relations with you</small><span class={'num ' + (rel >= 20 ? 'good' : (rel <= -20 ? 'bad' : ''))}>{(rel > 0 ? '+' : '') + rel}</span></div>}
    </div>
    <p class="eyebrow mt2">Champions</p>
    <ul class="list">{P.titles.map((t: any) => <li><span><TitleName pid={p.id} t={t} /></span><span class="r">{t.holders.length ? list(t.holders.map((id: number) => <Name w={S.w[id]} />)) : <span class="muted">Vacant</span>}</span></li>)}</ul>
  </>;
}

function TitleCard(p: { pid: string; id: string }) {
  const S = G.S, P = S.promos[p.pid], t = P && P.titles.filter((x: any) => x.id === p.id)[0];
  if (!t) return <Empty>This title has been retired.</Empty>;
  const H: any[] = (t.hist || []).slice().reverse(), len = (h: any) => (h.to || S.week) - Math.max(1, h.from);
  let longest: any = null, most: any = null;
  (t.hist || []).forEach((h: any) => { if (!longest || len(h) > len(longest)) longest = h; if (!most || h.defs > most.defs) most = h; });
  const who = (h: any) => list(String(h.ids).split(',').filter(Boolean).map((id: string) => S.w[+id] ? <Name w={S.w[+id]} /> : null));
  return <>
    <BeltArt name={t.name} top={P.full || P.name} />
    <div class="kv mt1">
      <div><small>Promotion</small><span>{P.name}</span></div>
      <div><small>Division</small><span>{t.tag ? 'Tag team' : (t.g === 'F' ? 'Women' : 'Men')} {'·'} {t.lvl === 3 ? 'top title' : (t.lvl === 2 ? 'secondary' : 'third tier')}</span></div>
      <div><small>Prestige</small><span><Meter v={t.prestige} kind="au" /> <b class="num">{Math.round(t.prestige)}</b></span></div>
      <div><small>Champion{t.tag ? 's' : ''}</small><span>{t.holders.length ? list(t.holders.map((id: number) => <Name w={S.w[id]} />)) : <span class="mark">Vacant</span>}</span></div>
    </div>
    {t.holders.length ? <p class="mt1 muted">Held since {E.cal(Math.max(1, t.since)).label}: {weeksText(S.week - Math.max(1, t.since))}, {t.defs} {plural(t.defs, 'defence')}.</p> : null}
    <p class="eyebrow mt2">Lineage</p>
    {H.length ? <ul class="list">{H.slice(0, 12).map((h: any) => <li><span>{who(h)}</span><span class="r muted num">{h.from <= 1 ? 'Before your time' : E.cal(h.from).label}{h.to ? ' to ' + E.cal(h.to).label : ' to now'} {'·'} {weeksText(len(h))} {'·'} {h.defs} {plural(h.defs, 'defence')}</span></li>)}</ul> : <Empty>No champion has been crowned yet.</Empty>}
    {H.length > 12 ? <p class="muted">And {H.length - 12} earlier {plural(H.length - 12, 'reign')}.</p> : null}
    {longest && H.length > 1 ? <p class="mt1 muted">Longest reign: {who(longest)}, {weeksText(len(longest))}.{most && most.defs ? <> Most defences: {who(most)}, {most.defs}.</> : null}</p> : null}
  </>;
}

function titleOf(c: Card): string {
  const S = G.S;
  if (c.k === 'w') return S.w[c.id as number] ? S.w[c.id as number].name : 'Wrestler';
  if (c.k === 'tree') return 'Family tree: ' + (S.w[c.id as number] ? S.w[c.id as number].name : '');
  if (c.k === 'promo') { const P = S.promos[c.id as string]; return P ? P.name : 'Promotion'; }
  if (c.k === 'team') { const t = S.teams.filter((x: any) => x.id === c.id)[0]; return t ? (t.name || teamName(t)) : 'Tag team'; }
  const P = S.promos[c.pid!], t = P && P.titles.filter((x: any) => x.id === c.id)[0]; return t ? t.name : 'Title';
}

/** The pop-up on top of the stack. Drawn before the ordinary pop-up so the highlight goes to it. */
export function CardHost() {
  const S = G.S, n = ui.cards.length; if (!S || !n) return null;
  const c = ui.cards[n - 1];
  return <div class="cards" key={c.k + ':' + c.pid + ':' + c.id + ':' + n}>
    <Window title={titleOf(c)} onClose={closeCards} noOk hint={n > 1 ? 'Esc goes back' : 'Esc closes'}
      footer={<>{n > 1 ? <Btn t="card-back" onClick={popCard}>Back to {titleOf(ui.cards[n - 2])}</Btn> : null}<Btn kind="go" id="modal-ok" t="card-close" onClick={closeCards}>Close</Btn></>}>
      {c.k === 'w' ? <WrestlerCard id={c.id as number} /> : c.k === 'team' ? <TeamCard id={c.id as number} /> : c.k === 'promo' ? <PromoCard id={c.id as string} /> : c.k === 'tree' ? <TreeCard id={c.id as number} /> : <TitleCard pid={c.pid!} id={c.id as string} />}
    </Window>
  </div>;
}
void openCard; void openModal; void champOf;
