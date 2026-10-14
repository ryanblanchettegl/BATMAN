/* The Free agents page (page id `market`): free agents and rivals' talent near the end of their deals, offers, and the way in to the creator. */
import { useLayoutEffect } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, me, act, view, say, cash, full, openModal, plural, slice } from '../../store';
import { Btn, Sel, TextBox, Tag, Side, Name, Field, Empty, Desktop, Win, showResult } from '../../kit';
import { rs } from './state';
import { range, sendScout } from './Profile';

/** The scouts' window: the way in to the creator, and the wage budget. */
function Scouts() {
  const S = G.S, P = me(), info = E.createInfo(S);
  return <Win title="Your scouts" area="scouts" t="mk-scouts">
    <div class="row"><Btn t="cw-open" onClick={() => openModal({ kind: 'caw' })}>Create a wrestler</Btn></div>
    <p class="muted">{info.ok ? 'Your scouts have somebody for you to look at.' : 'Your scouts need ' + info.wait + ' more ' + plural(info.wait, 'week') + '. You can still design one.'}</p>
    {!S.owner.me && <p>Wage budget <b>{cash(E.budget(S))}</b> a week, the bill is <b>{cash(E.rosterOf(S, P.id).reduce((a: number, w: W) => a + w.wage, 0))}</b>.</p>}
  </Win>;
}

/** The offer being made: wage, length, and the ways to learn more first. */
function Offer(p: { w: W; ask: number }) {
  const S = G.S, st = rs(), w = p.w;
  const send = () => act(() => { const r = E.sign(S, w.id, +st.wage || 0, +st.weeks || 48); say(r.msg, { err: !r.ok }); st.offer = null; });
  return <Win title={'Offer to ' + w.name} area="side" t="mk-offer" tone="gold">
    <p class="muted">They are asking about {full(p.ask)} a week. A lowball ends talks for a month.</p>
    {/* the kit text box has no min or step, and the wage moves in fifties */}
    <label class="row mt1">Weekly wage <input type="number" id="offer-wage" class="wage" data-t="offer-wage" min={0} step={50} value={st.wage} onInput={e => { st.wage = (e.currentTarget as HTMLInputElement).value; }} /></label>
    <label class="row mt1">Length <Sel id="offer-weeks" t="offer-weeks" value={st.weeks} options={[['48', '48 weeks'], ['96', '96 weeks']]} onChange={v => view(() => { st.weeks = v; })} /></label>
    <div class="row mt1"><Btn kind="go" t="sign" d={{ id: w.id }} onClick={send}>Send offer</Btn><Btn kind="sm" t="offer-cancel" onClick={() => view(() => { st.offer = null; })}>Cancel</Btn></div>
    <div class="row mt1"><Btn kind="sm" t="askroom" d={{ id: w.id }} onClick={() => showResult('Ask the room', E.askRoom(S, w.id).text)}>Ask the room</Btn>
      {!w.sc && <Btn kind="sm" t="scout" d={{ id: w.id }} onClick={() => sendScout(w.id)}>Scout first ({full(E.scoutInfo(S).cost)})</Btn>}</div>
  </Win>;
}

const SORTS: [string, string][] = [['ovr', 'Overness'], ['fit', 'Fit'], ['ask', 'Asking wage'], ['age', 'Youngest']];
/** Each January's class of rookies: where they came from and what they might become. Pick a year to look back. */
function ClassPanel() {
  const S = G.S, yrs: number[] = E.classYears(S), cs = slice<{ y: number }>('class', () => ({ y: 0 }));
  if (!yrs.length) return <Win title="The rookie class" area="side" t="mk-class"><p class="muted">The first class turns professional in January. Rookies arrive from five regions, and each region leans toward a style.</p></Win>;
  const y = yrs.indexOf(cs.y) >= 0 ? cs.y : yrs[0], R = E.classReport(S, y);
  return <Win title="The rookie class" area="side" t="mk-class">
    <Field label="Class of"><Sel id="cls-y" t="cls-y" value={y} options={yrs.map(v => [v, 'Class of ' + v] as [number, string])} onChange={v => view(() => { cs.y = +v; })} /></Field>
    <p class="muted">{R.text}</p>
    <ul class="list mt1">{R.rows.slice(0, 5).map((r: any) => <li class="col"><span><Name w={r.w} /> <span class="muted">{'·'} {r.region}</span></span>
      <span class="muted">Potential {r.potential}{r.sc ? '' : '?'} {'·'} {r.status}</span></li>)}</ul>
    {R.n > 5 ? <p class="muted">And {R.n - 5} more.</p> : null}
  </Win>;
}

export function Market() {
  const S = G.S, st = rs(), q = st.mq.toLowerCase(), mk = slice<{ sort: string; will: boolean; pg: number; key: string; per?: number }>('market', () => ({ sort: 'ovr', will: false, pg: 0, key: '' }));
  const fitV = (w: W) => { const f = E.fit(S, w.id); return f ? f.v : -999; };
  const key: Record<string, (w: W) => number> = { ovr: w => -w.ovr, fit: w => -fitV(w), ask: w => E.ask(S, w), age: w => w.age };
  const L: W[] = E.market(S).filter((w: W) => (!q || w.name.toLowerCase().indexOf(q) >= 0) && (!mk.will || (E.canSign(S, w) && !(w.lock > S.week)))).sort((a: W, b: W) => (key[mk.sort](a) - key[mk.sort](b)) || b.ovr - a.ovr).slice(0, 120);
  // as many to a page as the window holds, never more than twenty; the page goes back to the first whenever the search, sort or filter changes
  const flat = !!(window as any).EWF_FLAT, PER = flat ? 20 : Math.min(20, mk.per || 14), fk = q + '|' + mk.sort + '|' + mk.will; if (mk.key !== fk) { mk.key = fk; mk.pg = 0; }
  const pages = Math.max(1, Math.ceil(L.length / PER)), pg = Math.min(mk.pg || 0, pages - 1), shown = L.slice(pg * PER, pg * PER + PER);
  useLayoutEffect(() => { if (flat) return; const box = document.querySelector('.mkpage .mkl') as HTMLElement | null, rw = box && box.querySelector('tbody tr') as HTMLElement | null, hd = box && box.querySelector('thead') as HTMLElement | null;
    if (!box || !rw) return; const fit = Math.max(4, Math.min(20, Math.floor((box.clientHeight - (hd ? hd.offsetHeight : 0) - 2) / rw.offsetHeight))); if (fit !== PER && (fit < PER || L.length > PER)) view(() => { mk.per = fit; }); });
  const toggle = (w: W, ask: number) => view(() => { if (st.offer === w.id) st.offer = null; else { st.offer = w.id; st.wage = String(ask); st.weeks = '48'; } });
  const ow = st.offer != null ? S.w[st.offer] : null, offerOpen = ow && L.indexOf(ow) >= 0 && !(ow.lock > S.week) && E.canSign(S, ow);
  return <div class="onescreen"><Desktop cls="mkpage" t="market">
    <Win title={'Free agents: ' + L.length + ' available'} area="list" t="mk-list" right={pages > 1 ? 'Page ' + (pg + 1) + ' of ' + pages : undefined}>
      <div class="row nowrap">
        <TextBox type="search" id="mq" t="mq" label="Search market" placeholder="Search by name" value={st.mq} onInput={v => view(() => { st.mq = v; })} />
        {SORTS.map(o => <Btn kind="sm" on={mk.sort === o[0]} t="mksort" d={{ v: o[0] }} onClick={() => view(() => { mk.sort = o[0]; })}>{o[1]}</Btn>)}
        <Btn kind="sm" on={mk.will} t="mkwill" onClick={() => view(() => { mk.will = !mk.will; })}>Would sign with us</Btn>
      </div>
      <div class="tw mkt mkl"><table>
        <thead><tr><th>Name</th><th>Status</th><th>Side</th><th>Style</th><th class="r">Age</th><th class="r">Over</th><th class="r">Potential</th><th>Fit</th><th class="r">Asking</th><th /></tr></thead>
        <tbody>
          {shown.map(w => {
            const ask = E.ask(S, w), locked = w.lock > S.week, can = E.canSign(S, w);
            return <tr key={w.id} class={st.offer === w.id ? 'on' : undefined}>
              <td><span class="nm">{w.name}</span></td>
              <td>{w.promo === 'FA' ? (w.cut && S.promos[w.cut.from] ? 'Released by ' + S.promos[w.cut.from].name : 'Free agent') : S.promos[w.promo].name + ', ' + Math.max(0, w.con) + ' wk'}</td>
              <td><Side w={w} /></td>
              <td>{E.STYLE_NAME[w.style] || ''}{w.rk ? <> <Tag kind="gold">Rookie</Tag></> : null}</td>
              <td class="r num">{w.age}</td><td class="r num">{Math.round(w.ovr)}</td>
              <td class="r num">{range(E.intel(S, w.id).stats.pot)}</td><td>{(() => { const f = E.fit(S, w.id); return f ? <span class={f.v >= 1 ? 'good' : (f.v <= -2 ? 'bad' : 'muted')}>{f.n}</span> : null; })()}</td><td class="r num">{cash(ask)}</td>
              <td>{!can ? <span class="muted">{E.modelOf(S).gender && w.g !== E.modelOf(S).gender ? 'Not for us' : 'Out of reach'}</span> : locked ? <span class="muted">Not talking</span>
                : <Btn kind="sm" t="offer" d={{ id: w.id }} onClick={() => toggle(w, ask)}>{st.offer === w.id ? 'Cancel' : 'Offer'}</Btn>}</td>
            </tr>;
          })}
          {!L.length && <tr><td colSpan={12} class="muted">Nobody available.</td></tr>}
        </tbody>
      </table></div>
      {pages > 1 ? <p class="pgr"><Btn kind="sm" t="mkpage-prev" label="Earlier names" disabled={pg === 0} onClick={() => view(() => { mk.pg = pg - 1; })}>{'◄'}</Btn><span class="num">Page {pg + 1} of {pages}</span><Btn kind="sm" t="mkpage-next" label="More names" disabled={pg >= pages - 1} onClick={() => view(() => { mk.pg = pg + 1; })}>{'►'}</Btn></p> : null}
    </Win>
    <Scouts />
    {offerOpen && ow ? <Offer w={ow} ask={E.ask(S, ow)} /> : <ClassPanel />}
  </Desktop></div>;
}
