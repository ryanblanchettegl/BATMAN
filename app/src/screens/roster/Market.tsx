/* The Free agents page (page id `market`): free agents and rivals' talent near the end of their deals, offers, and the way in to the creator. */
import { Ovr } from '../../shared/ovr';
import { SFX } from '../../sfx';
import { E, W } from '../../engine';
import { G, me, act, view, say, cash, full, openModal, plural, slice } from '../../store';
import { Btn, Sel, TextBox, Tag, Side, Name, Field, Empty, Desktop, Win, showResult } from '../../kit';
import { rs } from './state';
import { range, sendScout } from './Profile';

/** The scouts' window: the way in to the creator, and the wage budget. */
function Scouts() {
  const S = G.S, P = me();
  return <Win title="Your scouts" area="scouts" t="mk-scouts">
    <div class="row"><Btn t="cw-open" onClick={() => openModal({ kind: 'player', id: 'new' })}>Create a wrestler</Btn><Btn t="staff-open" onClick={() => openModal({ kind: 'staff' })}>Create staff</Btn></div>
    <p class="muted">Create a Wrestler makes a new wrestler. They join the free agents, and you sign them like anybody else. Create staff hires a referee, commentator, interviewer or authority figure straight onto your books.</p>
    {!S.owner.me && <p>Wage budget <b>{cash(E.budget(S))}</b> a week, the bill is <b>{cash(E.rosterOf(S, P.id).reduce((a: number, w: W) => a + w.wage, 0))}</b>.</p>}
  </Win>;
}

/** The offer being made: wage, length, and the ways to learn more first. */
function Offer(p: { w: W; ask: number }) {
  const S = G.S, st = rs(), w = p.w;
  if (st.clFor !== w.id) { st.clFor = w.id; st.cl = []; }
  const C: any[] = E.clauses(S, w.id), on = (k: string) => (st.cl || []).indexOf(k) >= 0, save = C.filter(c => on(c.k)).reduce((a, c) => a + c.save, 0);
  // the kind of deal is the company's: a yearly salary at a big company, a fee for each show at a small one
  const T = E.offerTerms(S, w.id), perShow = !!T && T.ct === 'show';
  if (perShow && st.feeFor !== w.id) { st.feeFor = w.id; st.wage = String(T.fee); }
  const toFee = (weekly: number) => perShow ? Math.max(50, Math.round(T.fee * weekly / Math.max(1, p.ask) / 10) * 10) : weekly;
  const send = () => act(() => { const r = perShow ? E.signFee(S, w.id, +st.wage || 0, st.cl || []) : E.sign(S, w.id, +st.wage || 0, +st.weeks || 48, st.cl || []); const star = r.ok && E.overallOf(w) >= 80; say(r.msg, star ? undefined : { err: !r.ok }); if (star) SFX.star(); st.offer = null; });
  return <Win title={'Offer to ' + w.name} area="side" t="mk-offer" tone="gold">
    {T ? <p data-t="offer-kind"><b>{T.n}.</b> <span class="muted">{T.why}</span></p> : null}
    <p class="muted">They are asking about {perShow ? full(T.fee) + ' a show' : full(p.ask) + ' a week'}. A lowball ends talks for a month.</p>
    {/* the kit text box has no min or step, and the wage moves in fifties */}
    <label class="row mt1">{perShow ? 'Fee per show' : 'Weekly wage'} <input type="number" id="offer-wage" class="wage" data-t="offer-wage" min={0} step={50} value={st.wage} onInput={e => { st.wage = (e.currentTarget as HTMLInputElement).value; }} /></label>
    {perShow ? <p class="muted mt1" data-t="offer-weeks">Length: a handshake. It rolls on, and either side can walk away.</p>
      : <label class="row mt1">Length <Sel id="offer-weeks" t="offer-weeks" value={st.weeks} options={(T && T.lens ? T.lens : [[48, '1 year'], [96, '2 years']]).map((x: any) => [String(x[0]), x[1]] as [string, string])} onChange={v => view(() => { st.weeks = v; })} /></label>}
    {C.length ? <div class="mt1" data-t="offer-clauses"><p class="muted">They would like it in the contract:{save ? ' with these, about ' + full(p.ask - save) + ' a week.' : ''}</p>
      <div class="row">{C.map(c => <Btn key={c.k} kind="sm" on={on(c.k)} t="offer-clause" d={{ k: c.k }} label={c.n + '. ' + c.d} onClick={() => view(() => { st.cl = on(c.k) ? (st.cl || []).filter(x => x !== c.k) : (st.cl || []).concat([c.k]); st.wage = String(toFee(p.ask - C.filter(x => (st.cl || []).indexOf(x.k) >= 0).reduce((a, x) => a + x.save, 0))); })}>{c.n}, saves {cash(c.save)}</Btn>)}</div></div> : null}
    <div class="row mt1"><Btn kind="go" t="sign" d={{ id: w.id }} onClick={send}>Send offer</Btn><Btn kind="sm" t="offer-cancel" onClick={() => view(() => { st.offer = null; })}>Cancel</Btn></div>
    <div class="row mt1"><Btn kind="sm" t="askroom" d={{ id: w.id }} onClick={() => showResult('Ask the room', E.askRoom(S, w.id).text)}>Ask the room</Btn>
      {!w.sc && <Btn kind="sm" t="scout" d={{ id: w.id }} onClick={() => sendScout(w.id)}>Scout first ({full(E.scoutInfo(S).cost)})</Btn>}</div>
  </Win>;
}

const SORTS: [string, string][] = [['all', 'Overall'], ['ovr', 'Overness'], ['fit', 'Fit'], ['ask', 'Asking wage'], ['age', 'Youngest']];
/** Each January's class of rookies: where they came from and what they might become. Pick a year to look back. */
function ClassPanel() {
  const S = G.S, yrs: number[] = E.classYears(S), cs = slice<{ y: number }>('class', () => ({ y: 0 })), H: any[] = E.indieHot(S, 3);
  const hot = H.length ? <div class="mb1" data-t="mk-indie"><p><b>Hot on the indies</b></p><ul class="list">{H.map(h => <li key={h.id}><span><Name w={S.w[h.id]} /> <span class="muted">{'·'} {h.n}{h.where ? ' (' + h.where + ')' : ''}, {h.k} weeks</span></span></li>)}</ul></div> : null;
  if (!yrs.length) return <Win title="Rookies and the indies" area="side" t="mk-class">{hot}<p class="muted">The first class turns professional in January. Rookies arrive from five regions, and each region leans toward a style.</p></Win>;
  const y = yrs.indexOf(cs.y) >= 0 ? cs.y : yrs[0], R = E.classReport(S, y);
  return <Win title="Rookies and the indies" area="side" t="mk-class">
    {hot}
    <Field label="Class of"><Sel id="cls-y" t="cls-y" value={y} options={yrs.map(v => [v, 'Class of ' + v] as [number, string])} onChange={v => view(() => { cs.y = +v; })} /></Field>
    <p class="muted">{R.text}</p>
    <ul class="list mt1">{R.rows.slice(0, 5).map((r: any) => <li class="col"><span><Name w={r.w} /> <span class="muted">{'·'} {r.region}</span></span>
      <span class="muted">Potential {r.potential}{r.sc ? '' : '?'} {'·'} {r.status}</span></li>)}</ul>
    {R.n > 5 ? <p class="muted">And {R.n - 5} more.</p> : null}
  </Win>;
}

export function Market() {
  const S = G.S, st = rs(), q = st.mq.toLowerCase(), mk = slice<{ sort: string; will: boolean; pg: number; key: string; per?: number }>('market', () => ({ sort: 'all', will: false, pg: 0, key: '' }));
  const fitV = (w: W) => { const f = E.fit(S, w.id); return f ? f.v : -999; };
  const key: Record<string, (w: W) => number> = { all: w => -E.overallOf(w), ovr: w => -w.ovr, fit: w => -fitV(w), ask: w => E.ask(S, w), age: w => w.age };
  const L: W[] = E.market(S).filter((w: W) => (!q || w.name.toLowerCase().indexOf(q) >= 0) && (!mk.will || (E.canSign(S, w) && !(w.lock > S.week)))).sort((a: W, b: W) => ((key[mk.sort] || key.all)(a) - (key[mk.sort] || key.all)(b)) || b.ovr - a.ovr);
  // the whole list, in a window that scrolls inside itself (Ryan, 20 October: "I want it scrollable")
  const shown = L;
  const toggle = (w: W, ask: number) => view(() => { if (st.offer === w.id) st.offer = null; else { st.offer = w.id; st.wage = String(ask); st.weeks = '48'; st.feeFor = null; } });
  const ow = st.offer != null ? S.w[st.offer] : null, offerOpen = ow && L.indexOf(ow) >= 0 && !(ow.lock > S.week) && E.canSign(S, ow);
  return <div class="onescreen"><Desktop cls="mkpage" t="market">
    <Win title={'Free agents: ' + L.length + ' available'} area="list" t="mk-list">
      <div class="row nowrap">
        <TextBox type="search" id="mq" t="mq" label="Search market" placeholder="Search by name" value={st.mq} onInput={v => view(() => { st.mq = v; })} />
        {SORTS.map(o => <Btn kind="sm" on={mk.sort === o[0]} t="mksort" d={{ v: o[0] }} onClick={() => view(() => { mk.sort = o[0]; })}>{o[1]}</Btn>)}
        <Btn kind="sm" on={mk.will} t="mkwill" onClick={() => view(() => { mk.will = !mk.will; })}>Would sign with us</Btn>
      </div>
      <div class="tw mkt mkl lb scroll"><table>
        <thead><tr><th>Name</th><th>Status</th><th>Side</th><th class="wide">Style</th><th class="r">Age</th><th class="r">Overall</th><th class="r wide">Over</th><th class="r">Potential</th><th>Fit</th><th class="r">Asking</th><th /></tr></thead>
        <tbody>
          {shown.map(w => {
            const ask = E.ask(S, w), locked = w.lock > S.week, can = E.canSign(S, w), T = E.offerTerms(S, w.id);   // a company that pays per appearance shows the fee for a show
            return <tr key={w.id} class={st.offer === w.id ? 'on' : undefined}>
              <td><span class="nm" title={w.name}>{w.name}</span></td>
              <td>{w.promo === 'FA' ? (w.cut && S.promos[w.cut.from] && S.week - (w.cut.w || 0) < 6 ? 'Released by ' + S.promos[w.cut.from].name : (E.indieOf(S, w.id) ? <span title={'Working dates for ' + E.indieOf(S, w.id).n}>{E.indieOf(S, w.id).n.split(' ').slice(0, 2).join(' ')}{E.indieOf(S, w.id).weeks >= 3 ? ', ' + E.indieOf(S, w.id).weeks + ' wk' : ''}</span> : 'Free agent')) : S.promos[w.promo].name + (w.dl === 'show' ? ', per show' : ', ' + Math.max(0, w.con) + ' wk')}</td>
              <td><Side w={w} /></td>
              <td class="wide">{E.STYLE_NAME[w.style] || ''}{w.rk ? <> <Tag kind="gold">Rookie</Tag></> : null}</td>
              <td class="r num">{w.age}</td><td class="r"><Ovr w={w} /></td><td class="r num wide">{Math.round(w.ovr)}</td>
              <td class="r num">{range(E.intel(S, w.id).stats.pot)}</td><td>{(() => { const f = E.fit(S, w.id); return f ? <span class={f.v >= 1 ? 'good' : (f.v <= -2 ? 'bad' : 'muted')}>{f.n}</span> : null; })()}</td><td class="r num">{T && T.ct === 'show' ? cash(T.fee) + ' a show' : cash(ask)}</td>
              <td>{!can ? <span class="muted">{E.modelOf(S).gender && w.g !== E.modelOf(S).gender ? 'Not for us' : 'Out of reach'}</span> : locked ? <span class="muted">Not talking</span>
                : <Btn kind="sm" t="offer" d={{ id: w.id }} onClick={() => toggle(w, ask)}>{st.offer === w.id ? 'Cancel' : 'Offer'}</Btn>}</td>
            </tr>;
          })}
          {!L.length && <tr><td colSpan={13} class="muted">Nobody available.</td></tr>}
        </tbody>
      </table></div>
    </Win>
    <Scouts />
    {offerOpen && ow ? <Offer w={ow} ask={E.ask(S, ow)} /> : <ClassPanel />}
  </Desktop></div>;
}
