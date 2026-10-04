/* A wrestler profile: one panel with four pages (Overview, Contract, Locker room, Scouting and career), and the scouting report window. */
import { useEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, ui, me, Modal, act, view, say, full, openModal, plural } from '../../store';
import { Btn, Panel, Tabs, Sel, Tag, Side, Meter, Stat, CheckLine, Empty, RangeBar, Portrait, Window, Opt, champOf, brandName, stars } from '../../kit';
import { rs, pick, ProfilePage } from './state';
import { LockerBlock } from './LockerBlock';

const PAGES: [ProfilePage, string][] = [['over', 'Overview'], ['deal', 'Contract'], ['room', 'Locker room'], ['scout', 'Scouting and career']];
export function gimName(id: string): string { const g = E.GIMS.find((x: any) => x.id === id); return g ? g.n : 'None'; }
/** A scouted range as text: one number when the scouts are sure. */
export function range(r: { lo: number; hi: number }): string { return r.lo === r.hi ? String(r.lo) : r.lo + '–' + r.hi; }

/* ---------- scouting ---------- */
function ScoutRows(p: { it: any }) {
  return <>{Object.keys(E.HIDDEN).map(k => { const r = p.it.stats[k]; return <div><span>{E.HIDDEN[k]}</span><RangeBar lo={r.lo} hi={r.hi} /><span class="num">{range(r)}</span></div>; })}</>;
}
/** Pay for a report on somebody (old `scout`), then show it in a window. The engine says so if no report could be filed. */
export function sendScout(id: number) { act(() => { const r = E.scout(G.S, id); openModal({ kind: 'scout', id, msg: r || '' }); }); }
export function ScoutWindow(p: { m: Modal }) {
  const S = G.S, w: W = S.w[p.m.id], it = E.intel(S, w.id);
  return <Window title={'Scouting report: ' + w.name}>
    <div class="row top nowrap gap2"><Portrait w={w} /><div><p>{p.m.msg}</p><p class="muted">Age {w.age} {'·'} {E.STYLE_NAME[w.style] || ''} {'·'} overness {Math.round(w.ovr)}</p></div></div>
    <div class="scout mt2"><ScoutRows it={it} /></div>
    {it.peak ? <p class="mt1">Peak years {it.peak[0]} to {it.peak[1]}.</p> : null}
  </Window>;
}
function ScoutBlock(p: { w: W }) {
  const S = G.S, w = p.w, it = E.intel(S, w.id), si = E.scoutInfo(S);
  return <div class="mt3">
    <p class="eyebrow">Scouting report{it.exact ? '' : (w.sc ? ' (full report on file)' : ' (rough: your scouts have not filed on this one)')}</p>
    <div class="scout"><ScoutRows it={it} /></div>
    <p class="muted">{it.phase}.{it.peak ? ' Peak years ' + it.peak[0] + ' to ' + it.peak[1] + '.' : ''}{it.cliff ? ' Expect a sharp drop from ' + it.cliff + '.' : ''}</p>
    {!(it.exact || w.sc) && <div class="row mt1"><Btn kind="sm" t="scout" d={{ id: w.id }} disabled={!si.left} onClick={() => sendScout(w.id)}>Send a scout ({full(si.cost)})</Btn><span class="muted">{si.left} of {si.max} reports left this week.</span></div>}
  </div>;
}
function CareerBlock(p: { cr: any }) {
  const cr = p.cr;
  return <div class="cols mt3">
    <div><p class="eyebrow">Career, year by year</p>
      {cr.years.length ? <div class="tw"><table>
        <thead><tr><th>Year</th><th class="r">Matches</th><th class="r">W</th><th class="r">L</th><th class="r">D</th><th class="r">Best</th><th class="r">Main events</th><th class="r">Titles</th></tr></thead>
        <tbody>{cr.years.map((y: any) => <tr><td class="num">{y.y}</td><td class="r num">{y.m}</td><td class="r num">{y.w}</td><td class="r num">{y.l}</td><td class="r num">{y.d}</td><td class="r">{y.best ? stars(y.best) : ''}</td><td class="r num">{y.main}</td><td class="r num">{y.titles}</td></tr>)}</tbody>
      </table></div> : <Empty>No matches yet. Put them on a card on Booking.</Empty>}
    </div>
    <div><p class="eyebrow">Milestones</p>
      {cr.log.length ? <div class="log">{cr.log.slice(0, 8).map((l: any) => <span>{E.cal(l.w).label}{'  '}{l.t}</span>)}</div> : <Empty>Nothing of note yet.</Empty>}
    </div>
  </div>;
}

/* ---------- overview ---------- */
function Overview(p: { w: W }) {
  const S = G.S, w = p.w, tm = E.teamOf(S, w), fs: any[] = E.feudsFor(S, w.id), rel = E.relations(S, w.id), fit = E.gimFit(w), cf = E.fit(S, w.id);
  const names = (L: W[]) => L.slice(0, 3).map(x => x.name).join(', ');
  return <>
    <div class="kv mt3 mb2">
      <Stat label="Overness" v={w.ovr} kind="au" /><Stat label="Brawling" v={w.brawl} /><Stat label="Technical" v={w.tech} /><Stat label="Aerial" v={w.speed} /><Stat label="Hardcore" v={w.hc} />
      <Stat label="Stamina" v={w.stam} /><Stat label="Charisma" v={w.cha} kind="au" /><Stat label="Promo" v={w.mic} kind="au" /><Stat label="Condition" v={w.cond} kind="cool" /><Stat label="Morale" v={w.morale} kind="cool" />
    </div>
    <p>Finisher: <b>the {w.fin || 'finish'}</b> {'·'} Gimmick: <b>{gimName(w.gim)}</b> <Meter v={fit} kind="au" /> <span class="num">{fit}% fit</span></p>
    {E.tenure(S, w.id) != null ? <p class="muted">With the company {E.tenure(S, w.id)} {plural(E.tenure(S, w.id), 'week')}.</p> : null}
    <p class="muted">{E.modelOf(S).n} values {E.modelOf(S).vals}.</p>
    {cf ? <p>For {E.modelOf(S).ph}: <b class={cf.v >= 1 ? 'good' : (cf.v <= -2 ? 'bad' : undefined)}>{cf.n}</b></p> : null}
    {w.tr && w.tr.length ? <p>Traits: {w.tr.map((t: string) => <><Tag kind="good">{E.TRAITS[t].n}</Tag> </>)}</p> : null}
    {w.arc && w.arc.t === 'flop' ? <p class="bad">The crowd is rejecting the current act until {E.cal(w.arc.until).label}.</p> : null}
    {w.notice ? <p class="bad">Has given notice and leaves after {E.cal(w.notice).label}.</p> : null}
    <p class="muted">Record {w.wins}{'–'}{w.losses}{w.ws >= 2 ? ', won ' + w.ws + ' in a row' : (w.ws <= -2 ? ', lost ' + (-w.ws) + ' in a row' : '')}. Momentum {(w.mom > 0 ? '+' : '') + w.mom.toFixed(1)}. Work rate {E.workRate(w)}.
      {rel.good.length ? ' Clicks with ' + names(rel.good) + '.' : ''}{rel.bad.length ? ' An awkward pairing with ' + names(rel.bad) + '.' : ''}{w.fav ? <> <span class="gold">The owner{'’'}s favourite.</span></> : null}
      {tm ? ' Teams with ' + E.partnerOf(S, w).name + ' (experience ' + tm.exp + ').' : ''}{fs.length ? ' Feuding: ' + fs.map(f => E.feudLabel(S, f)).join('; ') + '.' : ''}</p>
  </>;
}

/* ---------- contract ---------- */
function Contract(p: { w: W }) {
  const S = G.S, P = me(), st = rs(), w = p.w, id = w.id, ci = E.campInfo(S);
  const mps: W[] = E.mouthpieces(S, id), rg = st.repack && st.repack.id === id ? st.repack.g : '';
  const talkers: W[] = (w.mgr != null && S.w[w.mgr] && !mps.some(x => x.id === w.mgr) ? [S.w[w.mgr]] : []).concat(mps);
  const renew = (weeks: number) => <Btn kind="sm" t="renew" d={{ id, w: weeks }} onClick={() => act(() => say(E.renew(S, id, weeks)))}>Renew {weeks} weeks</Btn>;
  return <>
    <p class="mt3">{full(w.wage)} a week, {Math.max(0, w.con)} weeks left.</p>
    <div class="row mt2">
      {renew(48)}{renew(96)}
      {(mps.length > 0 || w.mgr != null) && <label class="row">Mouthpiece <Sel id={'mgr-' + id} t="mgr" d={{ id }} value={w.mgr == null ? '' : w.mgr}
        options={[['', 'Nobody'] as Opt].concat(talkers.map(x => [x.id, x.name + ' · mic ' + x.mic] as Opt))} onChange={v => act(() => { E.setManager(S, id, v === '' ? null : +v); })} /></label>}
      {P.brands && <label class="row">Brand <Sel id={'brand-' + id} t="brand" d={{ id }} value={w.brand} options={P.brands.map((b: any) => [b.id, b.name] as Opt)} onChange={v => act(() => { E.setBrand(S, id, v); })} /></label>}
      {ui.confirm === 'rel' + id
        ? <><span>Release and pay {full(w.wage * 4)} severance?</span>
          <Btn kind="danger" t="release-yes" d={{ id }} onClick={() => act(() => { const r = E.release(S, id); ui.confirm = null; st.sel = null; st.last = null; say(r); })}>Release</Btn>
          <Btn kind="sm" t="cancel" onClick={() => view(() => { ui.confirm = null; })}>Keep</Btn></>
        : <Btn kind="danger" t="release" d={{ id }} onClick={() => view(() => { ui.confirm = 'rel' + id; })}>Release</Btn>}
    </div>
    <div class="row mt2">
      <label class="row">Repackage as <Sel id={'repack-' + id} t="repack" d={{ id }} value={rg} options={[['', 'Pick a gimmick'] as Opt].concat(E.GIMS.filter((g: any) => g.id !== w.gim).map((g: any) => [g.id, g.n] as Opt))}
        onChange={v => view(() => { st.repack = v ? { id, g: v } : null; })} /></label>
      {rg ? <Btn kind="sm" t="repack" d={{ id }} onClick={() => act(() => { const r = E.repackage(S, id, rg); st.repack = null; if (r) say(r, { err: /failure/.test(r) }); })}>Try it</Btn> : null}
    </div>
    {rg ? <CheckLine ck={E.repackOdds(S, id, rg)} /> : null}
    <div class="row mt2">
      {w.camp ? <><span>In training camp, working on <b>{E.FOCUS[w.focus].toLowerCase()}</b>.</span><Btn kind="sm" t="callup" d={{ id }} onClick={() => act(() => say(E.callUp(S, id)))}>Call up</Btn></>
        : <span class="muted">{ci.cap ? 'Training camp (' + ci.n + ' of ' + ci.cap + ' places):' : 'The company has no training camp.'}</span>}
      {ci.cap ? Object.keys(E.FOCUS).map(k => <Btn kind="sm" on={!!w.camp && w.focus === k} t="camp" d={{ id, k }} onClick={() => act(() => { const r = E.sendCamp(S, id, k); if (r) say(r, { err: /full|champion/.test(r) }); })}>{w.camp ? '' : 'Send: '}{E.FOCUS[k]}</Btn>) : null}
    </div>
    {!w.camp && <p class="muted">In camp a wrestler improves every week but is off the shows, and the crowd slowly forgets them.</p>}
  </>;
}

/* ---------- the panel ---------- */
export function Profile(p: { w: W }) {
  const S = G.S, P = me(), st = rs(), w = p.w, pt = st.pt, ch = champOf(P, w.id), push = E.pushMap(S, P.id)[w.id];
  // opening a profile moves the highlight to it, so a remote or keyboard carries on from the profile, not from a row that scrolled away
  useEffect(() => { const el = document.querySelector('.prof .subnav .btn.on') as HTMLElement | null; if (el) { try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } }, [w.id]);
  const cr = pt === 'scout' ? E.career(S, w.id) : null;
  return <Panel cls="prof mb2">
    <div class="row between top">
      <div class="row top nowrap gap2 who">
        <Portrait w={w} />
        <div>
          <h2>{w.name}</h2>
          <p class="muted">Age {w.age} {'·'} {E.intel(S, w.id).phase}{w.nw ? ' · Not a wrestler' : ''}{w.retiring ? <> {'·'} <span class="bad">Retiring after {E.cal(w.retiring).label}</span></> : null}</p>
          <div class="row mt1">
            <Side w={w} /><Tag>{E.STYLE_NAME[w.style] || ''}</Tag><Tag>{push}</Tag>
            {w.brand ? <Tag>{brandName(P, w.brand)}</Tag> : null}
            {ch.map(c => <Tag kind="gold">{c}</Tag>)}
            {w.inj > 0 ? <Tag kind="bad">Out {w.inj} wk</Tag> : null}
            {w.role ? <Tag kind={w.role === 'toxic' || w.role === 'diva' ? 'bad' : 'good'}>{E.ROLE[w.role].n}</Tag> : null}
            {w.camp ? <Tag kind="warn">In camp: {E.FOCUS[w.focus] || ''}</Tag> : null}
            {w.hof ? <Tag kind="gold">Hall of fame</Tag> : null}
            {S.fc && S.fc.id === w.id ? <Tag kind="gold">The shows are built around them</Tag> : null}
          </div>
        </div>
      </div>
      <Btn kind="sm" t="sel" d={{ id: w.id }} onClick={() => pick(w.id)}>Close</Btn>
    </div>
    <Tabs label="Profile pages" value={pt} onPick={v => view(() => { st.pt = v as ProfilePage; })} items={PAGES.map(t => ({ id: t[0], label: t[1], t: 'ptab', d: { v: t[0] } }))} />
    {pt === 'over' && <Overview w={w} />}
    {pt === 'deal' && <Contract w={w} />}
    {pt === 'room' && <LockerBlock w={w} />}
    {pt === 'scout' && <><ScoutBlock w={w} />{cr && (cr.years.length || cr.log.length) ? <CareerBlock cr={cr} /> : null}</>}
  </Panel>;
}
