/* The Free agents page (page id `market`): free agents and rivals' talent near the end of their deals, offers, and the way in to the creator. */
import { Fragment } from 'preact';
import { E, W } from '../../engine';
import { G, me, act, view, say, cash, full, openModal, plural, slice } from '../../store';
import { Head, Panel, Btn, Sel, TextBox, Tag, Side, Name, Field, showResult } from '../../kit';
import { rs } from './state';
import { range, sendScout } from './Profile';

function CreatePanel() {
  const info = E.createInfo(G.S);
  return <Panel cls="mb2"><div class="row">
    <Btn t="cw-open" onClick={() => openModal({ kind: 'caw' })}>Create a wrestler</Btn>
    <span class="muted">{info.ok ? 'Your scouts have somebody for you to look at.' : 'Your scouts need ' + info.wait + ' more ' + plural(info.wait, 'week') + '. You can still design one.'}</span>
  </div></Panel>;
}

/** The row that opens under a wrestler while you are making them an offer. */
function OfferRow(p: { w: W; ask: number }) {
  const S = G.S, st = rs(), w = p.w;
  const send = () => act(() => { const r = E.sign(S, w.id, +st.wage || 0, +st.weeks || 48); say(r.msg, { err: !r.ok }); st.offer = null; });
  return <tr class="offer-row"><td colSpan={12}><div class="row offer">
    {/* the kit text box has no min or step, and the wage moves in fifties */}
    <label class="row">Weekly wage <input type="number" id="offer-wage" class="wage" data-t="offer-wage" min={0} step={50} value={st.wage} onInput={e => { st.wage = (e.currentTarget as HTMLInputElement).value; }} /></label>
    <label class="row">Length <Sel id="offer-weeks" t="offer-weeks" value={st.weeks} options={[['48', '48 weeks'], ['96', '96 weeks']]} onChange={v => view(() => { st.weeks = v; })} /></label>
    <Btn kind="go" t="sign" d={{ id: w.id }} onClick={send}>Send offer</Btn>
    <span class="muted">They are asking about {full(p.ask)}. A lowball ends talks for a month.</span>
    <Btn kind="sm" t="askroom" d={{ id: w.id }} onClick={() => showResult('Ask the room', E.askRoom(S, w.id).text)}>Ask the room</Btn>
    {!w.sc && <Btn kind="sm" t="scout" d={{ id: w.id }} onClick={() => sendScout(w.id)}>Scout first ({full(E.scoutInfo(S).cost)})</Btn>}
  </div></td></tr>;
}

const SORTS: [string, string][] = [['ovr', 'Overness'], ['fit', 'Fit'], ['ask', 'Asking wage'], ['age', 'Youngest']];
/** Each January's class of rookies: where they came from and what they might become. Pick a year to look back. */
function ClassPanel() {
  const S = G.S, yrs: number[] = E.classYears(S), cs = slice<{ y: number }>('class', () => ({ y: 0 }));
  if (!yrs.length) return <Panel cls="mb2" title="The rookie class"><p class="muted">The first class turns professional in January. Rookies arrive from five regions, and each region leans toward a style.</p></Panel>;
  const y = yrs.indexOf(cs.y) >= 0 ? cs.y : yrs[0], R = E.classReport(S, y);
  return <Panel cls="mb2" title="The rookie class">
    <Field label="Class of"><Sel id="cls-y" t="cls-y" value={y} options={yrs.map(v => [v, 'Class of ' + v] as [number, string])} onChange={v => view(() => { cs.y = +v; })} /></Field>
    <p class="muted">{R.text}</p>
    <ul class="list mt1">{R.rows.slice(0, 8).map((r: any) => <li class="col"><span><Name w={r.w} /> <span class="muted">{'·'} {r.region}, {E.STYLE_NAME[r.w.style]}</span></span>
      <span class="muted">Potential {r.potential}{r.sc ? '' : ' (a rough guess until scouted)'} {'·'} now {r.now} {'·'} {r.status}{r.champ ? ' · a champion' : ''}</span></li>)}</ul>
    {R.n > 8 ? <p class="muted">And {R.n - 8} more.</p> : null}
  </Panel>;
}

export function Market() {
  const S = G.S, P = me(), st = rs(), q = st.mq.toLowerCase(), mk = slice<{ sort: string; will: boolean }>('market', () => ({ sort: 'ovr', will: false }));
  const fitV = (w: W) => { const f = E.fit(S, w.id); return f ? f.v : -999; };
  const key: Record<string, (w: W) => number> = { ovr: w => -w.ovr, fit: w => -fitV(w), ask: w => E.ask(S, w), age: w => w.age };
  const L: W[] = E.market(S).filter((w: W) => (!q || w.name.toLowerCase().indexOf(q) >= 0) && (!mk.will || (E.canSign(S, w) && !(w.lock > S.week)))).sort((a: W, b: W) => (key[mk.sort](a) - key[mk.sort](b)) || b.ovr - a.ovr).slice(0, 120);
  const toggle = (w: W, ask: number) => view(() => { if (st.offer === w.id) st.offer = null; else { st.offer = w.id; st.wage = String(ask); st.weeks = '48'; } });
  return <>
    <Head eyebrow={'Free agents and rivals’ talent with 12 weeks or less on their deals'} title="Free agents" />
    {!S.owner.me && <p class="muted mb2">{S.owner.name}{'’'}s wage budget is {full(E.budget(S))} a week. The bill is {full(E.rosterOf(S, P.id).reduce((a: number, w: W) => a + w.wage, 0))}.</p>}
    <CreatePanel />
    <ClassPanel />
    <div class="row mb2">
      <TextBox type="search" id="mq" t="mq" label="Search market" placeholder="Search by name" value={st.mq} onInput={v => view(() => { st.mq = v; })} />
      <span class="muted">{L.length} available</span>
    </div>
    <div class="row opts mb2"><span class="muted">Sort by</span>{SORTS.map(o => <Btn kind="sm" on={mk.sort === o[0]} t="mksort" d={{ v: o[0] }} onClick={() => view(() => { mk.sort = o[0]; })}>{o[1]}</Btn>)}
      <Btn kind="sm" on={mk.will} t="mkwill" onClick={() => view(() => { mk.will = !mk.will; })}>Would sign with us</Btn></div>
    <div class="tw mkt"><table>
      <thead><tr><th>Name</th><th>Status</th><th>Side</th><th>Style</th><th class="r">Age</th><th class="r">Over</th><th class="r">Work</th><th class="r">Promo</th><th class="r">Potential</th><th>Fit</th><th class="r">Asking/wk</th><th /></tr></thead>
      <tbody>
        {L.map(w => {
          const ask = E.ask(S, w), locked = w.lock > S.week, can = E.canSign(S, w), open = st.offer === w.id && !locked && can;
          return <Fragment key={w.id}>
            <tr>
              <td><span class="nm">{w.name}</span></td>
              <td>{w.promo === 'FA' ? (w.cut && S.promos[w.cut.from] ? 'Released by ' + S.promos[w.cut.from].name + ', ' + Math.max(1, S.week - w.cut.w) + ' ' + plural(Math.max(1, S.week - w.cut.w), 'week') + ' ago' : 'Free agent') : S.promos[w.promo].name + ', ' + Math.max(0, w.con) + ' wk left'}</td>
              <td><Side w={w} /></td>
              <td>{E.STYLE_NAME[w.style] || ''}{w.rk ? <> <Tag kind="gold">Rookie</Tag></> : null}</td>
              <td class="r num">{w.age}</td><td class="r num">{Math.round(w.ovr)}</td><td class="r num">{E.workRate(w)}</td><td class="r num">{w.mic}</td>
              <td class="r num">{range(E.intel(S, w.id).stats.pot)}</td><td>{(() => { const f = E.fit(S, w.id); return f ? <span class={f.v >= 1 ? 'good' : (f.v <= -2 ? 'bad' : 'muted')}>{f.n}</span> : null; })()}</td><td class="r num">{cash(ask)}</td>
              <td>{!can ? <span class="muted">{E.modelOf(S).gender && w.g !== E.modelOf(S).gender ? 'Not for this company' : 'Out of reach for now'}</span> : locked ? <span class="muted">Not talking</span>
                : <Btn kind="sm" t="offer" d={{ id: w.id }} onClick={() => toggle(w, ask)}>{st.offer === w.id ? 'Cancel' : 'Make an offer'}</Btn>}</td>
            </tr>
            {open && <OfferRow w={w} ask={ask} />}
          </Fragment>;
        })}
        {!L.length && <tr><td colSpan={12} class="muted">Nobody available.</td></tr>}
      </tbody>
    </table></div>
  </>;
}
