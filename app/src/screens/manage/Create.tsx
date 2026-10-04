/* Manage: shows and belts made during a game. One small panel on Operations, and a window for each.
   A new belt or a new weekly show is a big moment: it takes an occasion (src/87-create.js). Each window lists the
   occasions, says which are open and why, and only then offers the form. */
import { E } from '../../engine';
import { G, Modal, act, say, cash, full, openModal, slice, view } from '../../store';
import { Panel, Btn, Window, Sel, Field, CheckLine, Tag, Opt } from '../../kit';

interface MakeState { show: string; belt: { name: string; occ: string }; ren: string | null; renText: string; del: string | null; msg: string; err: boolean }
const ms = () => slice<MakeState>('make', () => ({ show: '', belt: { name: '', occ: '' }, ren: null, renText: '', del: null, msg: '', err: false }));
/** Run an engine call from inside the window and keep its answer where the player is looking. */
function run(fn: () => any, after?: (r: any) => void) { const st = ms(); act(() => { const r = fn(); st.msg = r.msg; st.err = !r.ok; st.del = null; if (r.ok) { st.ren = null; if (after) after(r); } say(r.msg, { err: !r.ok }); }); }
/** The occasions on which a company adds a belt or a show, each with whether it is open now and why. */
function Occasions(p: { t: string; items: any[] }) {
  return <ul class="list" data-t={p.t}>{p.items.map((o: any) => <li key={o.k} data-v={o.open ? 'open' : 'shut'}><span><b>{o.n}</b><br /><span class="muted">{o.say}</span></span><Tag kind={o.open ? 'good' : undefined}>{o.open ? 'Open now' : 'Not yet'}</Tag></li>)}</ul>;
}
const Msg = () => { const st = ms(); return st.msg ? <p class={(st.err ? 'bad' : 'good') + ' mb2'} role="status" data-t="make-msg">{st.msg}</p> : null; };

/** Rename in place: the name turns into a text box with Save and Cancel. */
function Rename(p: { id: string; name: string; max: number; save: (v: string) => any }) {
  const st = ms();
  if (st.ren !== p.id) return <Btn kind="sm" t="make-ren" d={{ id: p.id }} onClick={() => view(() => { st.ren = p.id; st.renText = p.name; st.del = null; })}>Rename</Btn>;
  return <span class="row"><input type="text" value={st.renText} maxLength={p.max} aria-label="New name" data-t="make-ren-text" onInput={e => { st.renText = (e.currentTarget as HTMLInputElement).value; }} />
    <Btn kind="sm" t="make-ren-save" onClick={() => run(() => p.save(st.renText))}>Save</Btn><Btn kind="sm" t="make-ren-no" onClick={() => view(() => { st.ren = null; })}>Cancel</Btn></span>;
}
/** Two presses to take something away. */
function Remove(p: { id: string; label: string; yes: string; go: () => any; disabled?: boolean }) {
  const st = ms();
  if (st.del !== p.id) return <Btn kind="sm" t="make-del" d={{ id: p.id }} disabled={p.disabled} onClick={() => view(() => { st.del = p.id; st.ren = null; })}>{p.label}</Btn>;
  return <span class="row"><Btn kind="danger" t="make-del-yes" onClick={() => run(p.go)}>{p.yes}</Btn><Btn kind="sm" t="make-del-no" onClick={() => view(() => { st.del = null; })}>Keep it</Btn></span>;
}

export function ShowsBelts() {
  const I = E.makeInfo(G.S), open = (kind: string) => { const st = ms(); st.msg = ''; st.ren = null; st.del = null; openModal({ kind }); };
  return <Panel title="Shows and belts">
    <p><b>{I.shows.length}</b> weekly {I.shows.length === 1 ? 'show' : 'shows'} and <b>{I.titles.length}</b> {I.titles.length === 1 ? 'belt' : 'belts'}. Adding to either is a big moment, and it takes an occasion.</p>
    <div class="row mt2"><Btn t="make-shows" onClick={() => open('makeshows')}>Weekly shows</Btn><Btn t="make-belts" onClick={() => open('makebelts')}>Belts</Btn></div>
  </Panel>;
}

export function ShowsWindow(_p: { m: Modal }) {
  const S = G.S, st = ms(), I = E.makeInfo(S);
  return <Window title="Weekly shows" wide ok="Done">
    <Msg />
    <ul class="list">{I.shows.map((s: any) => <li class="col" key={s.id}>
      <span><b>{s.name}</b><br /><span class="muted">{s.size} {'·'} about {cash(s.income)} a week from television and the gate{s.since ? ' · added in week ' + s.since : ''}</span></span>
      <span class="row opts"><Rename id={s.id} name={s.name} max={32} save={v => E.renameShow(S, s.id, v)} />
        {I.shows.length > 1 ? <Remove id={s.id} label="Cancel this show" yes={'Yes, cancel ' + s.name} go={() => E.dropShow(S, s.id)} /> : null}</span></li>)}</ul>
    <p class="eyebrow mt2">A new weekly show</p>
    <p class="muted">A new weekly show comes along once in years. A network gives a company another night when something calls for it.</p>
    <Occasions t="show-occ" items={I.showOcc} />
    {I.showCan ? <>
      <div class="row mt2"><Field label="Name of the show"><input type="text" id="make-show-name" data-t="make-show-name" value={st.show} maxLength={32} placeholder={I.showSay} onInput={e => { st.show = (e.currentTarget as HTMLInputElement).value; }} /></Field>
        <Btn kind="go" t="make-show" onClick={() => run(() => E.makeShow(S, { name: st.show.trim() || I.showSay }), () => { st.show = ''; })}>Ask the network</Btn></div>
      <CheckLine label="The network" ck={I.showCheck} />
      <p class="muted mt1">Launching it costs {full(I.showCost)}. It starts as a small show: about {cash(I.showGain)} a week coming in, {cash(I.showProd)} a show to produce, and your overheads grow with it. Your wrestlers work one more night a week. Its first night is an occasion. A show that does well gets a better hour each year.</p>
    </> : <p class="muted mt1" data-t="make-show-why">{I.showWhy}</p>}
  </Window>;
}

export function BeltsWindow(_p: { m: Modal }) {
  const S = G.S, st = ms(), I = E.makeInfo(S), b = st.belt, open: any[] = I.beltOcc.filter((o: any) => o.open), pick = open.find((o: any) => o.k === b.occ) || open[0] || null;
  const why: string = I.beltWhy;
  const champ = (t: any) => t.holders.length ? t.holders.map((id: number) => S.w[id].name).join(' and ') : 'Vacant';
  return <Window title="Belts" wide ok="Done">
    <Msg />
    <ul class="list">{I.titles.map((t: any) => <li class="col" key={t.id}>
      <span><b>{t.name}</b><br /><span class="muted">{t.g === 'F' ? 'Women' : 'Men'} {'·'} {E.MAKE_LVL[t.lvl]}{t.tag ? ' · Tag team' : ''} {'·'} {champ(t)} {'·'} Prestige {t.prestige}</span></span>
      <span class="row opts"><Rename id={t.id} name={t.name} max={40} save={v => E.renameTitle(S, t.id, v)} />
        <Remove id={t.id} label="Retire this belt" yes={'Yes, retire the ' + t.name} go={() => E.dropTitle(S, t.id)} /></span></li>)}</ul>
    <p class="eyebrow mt2">A new belt</p>
    <p class="muted">A new belt is a big moment: one a year at most, and only when something calls for it. {I.titles.length} of the {I.titleMax} belts a roster of {I.roster} can carry.</p>
    <Occasions t="belt-occ" items={I.beltOcc} />
    {why || !pick ? <p class="muted mt1" data-t="make-belt-why">{why}</p> : <>
      <div class="editor plain mt2">
        <Field label="The occasion"><Sel t="make-belt-occ" value={pick.k} options={open.map((o: any) => [o.k, o.n] as Opt)} onChange={v => view(() => { b.occ = v; })} /></Field>
        <Field label="Name of the belt"><input type="text" id="make-belt-name" data-t="make-belt-name" value={b.name} maxLength={40} placeholder="Television Title" onInput={e => { b.name = (e.currentTarget as HTMLInputElement).value; }} /></Field>
      </div>
      <p class="mt1" data-t="make-belt-what">It will be: <b>{pick.what}</b>.</p>
      <div class="row mt2"><Btn kind="go" t="make-belt" onClick={() => run(() => E.makeTitle(S, { name: b.name, occ: pick.k }), () => { b.name = ''; b.occ = ''; })}>Create the belt</Btn>
        <span class="muted">Costs {full(I.titleCost)} to have made. It starts vacant, with little prestige. The night its first champion is crowned is an occasion.</span></div>
    </>}
    {I.old.length ? <><p class="eyebrow mt2">Retired belts</p><ul class="list">{I.old.slice(0, 6).map((o: any, i: number) => <li key={i}><span>{o.name} <span class="muted">{'·'} retired in week {o.to}{o.last.length ? ' · last held by ' + o.last.join(' and ') : ''}</span></span></li>)}</ul></> : null}
  </Window>;
}
