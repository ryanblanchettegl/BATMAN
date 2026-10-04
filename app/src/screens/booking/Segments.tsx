/* Promos and angles on the run sheet, and the clock they share with the matches. A show takes as many as fit in its
   time. The player books them here: what kind, who is in it, how long it runs, and where on the show it goes.
   The engine side is src/93-segments.js (the segments) and src/97-time.js (the clock, and how a show opens). */
import { E } from '../../engine';
import { G, Modal, act, say, view, slice, openModal, closeModal } from '../../store';
import { Btn, Panel, Window, Sel, Field, Name, Tag, Opt, stars } from '../../kit';
import { pickSide } from './run';

type Cat = 'promo' | 'angle';
interface Draft { slot: number; cat: Cat; k: string; who: (number | null)[]; pos: number; len: string }
const draft = () => slice<Draft>('segdraft', () => ({ slot: -1, cat: 'promo', k: 'interview', who: [], pos: 0, len: 'M' }));
const CATN: Record<string, string> = { promo: 'Promo', angle: 'Angle', any: 'Writers' };
const FIRST: Record<Cat, string> = { promo: 'interview', angle: 'ambush' };
/** Minutes as a clock time: 75 is 1:15. */
export const hm = (m: number) => Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2);
/** The tag for the item that is on the air when an hour starts. */
export function TopTag(p: { top?: number }) { return p.top ? <Tag kind="gold">{p.top === 1 ? 'Opens the show' : 'Top of hour ' + p.top}</Tag> : null; }

/** Open the booking window: a segment already on the show, or a fresh promo or angle. */
function openSeg(slot: number, cat?: Cat) {
  const S = G.S, cur = slot >= 0 ? E.segInfo(S).list[slot] : null, d = draft(), n = S.card.length;
  d.slot = cur ? slot : -1;
  d.cat = cur ? (cur.t === 'angle' ? 'angle' : (cur.t === 'promo' ? 'promo' : (cat || 'angle'))) : (cat || 'promo');
  d.k = cur ? cur.k : FIRST[d.cat]; d.who = cur ? cur.who.slice() : []; d.len = cur ? cur.len : E.SEGK[d.k].len;
  d.pos = cur ? cur.pos : Math.min(1, Math.max(0, n - 1));
  openModal({ kind: 'segwin' });
}
/** For the buttons beside "Add a match". */
export const addPromo = () => openSeg(-1, 'promo');
export const addAngle = () => openSeg(-1, 'angle');

/** How the show opens. The first thing on the run sheet is the opening, and each way of opening pays in its own way. */
export function Opening(p: { c: any }) {
  const S = G.S, pl = S.plan, w = pl ? S.w[pl.sp] : null, o = p.c.open;
  const go = () => { pickSide('promo'); setTimeout(() => { const el = document.getElementById('plan-sp'); if (el) { el.scrollIntoView({ block: 'center' }); (el as HTMLElement).focus(); } }, 0); };
  return <div class="seg sg opener" data-t="opening" data-v={o.k}>
    <div class="no" aria-hidden="true">TOP</div>
    <div class="body"><div class="line1">
      <div><div class="who">{o.n}{w ? <>: <Name w={w} /></> : null}</div>
        <div class="meta">{o.d}</div></div>
      <div class="row">
        <Btn kind="sm" t="promo-open" onClick={go}>{w ? 'Change the opening promo' : 'Script an opening promo'}</Btn>
        <Btn kind="sm" t="open-guide" onClick={() => openModal({ kind: 'openguide' })}>Ways to open</Btn>
      </div>
    </div></div>
  </div>;
}
/** The opening promo's own line, when one is scripted. Its form is the Opening promo tab beside the card. */
export function PlanRow(p: { c: any }) {
  const S = G.S, pl = S.plan, w = pl ? S.w[pl.sp] : null, it = p.c.items[0];
  if (!w || !it || it.t !== 'plan') return null;
  return <div class="seg sg">
    <div class="no" aria-hidden="true"><span>MIC</span><small class="at">{hm(it.at)}</small></div>
    <div class="body"><div class="line1">
      <div><div class="who"><Name w={w} /> opens the show</div>
        <div class="meta">Promo: {E.PKIND[pl.kind || 'interview'].n} {'·'} {it.mins} min {'·'} <TopTag top={it.top} /></div></div>
    </div></div>
  </div>;
}

/** The booked promos and angles that come before match `i`. */
export function SegRows(p: { i: number; n: number; c: any }) {
  const S = G.S, I = E.segInfo(S), mine = I.list.filter((x: any) => Math.max(0, Math.min(x.pos, p.n - 1)) === p.i);
  if (!mine.length) return null;
  return <>{mine.map((x: any) => {
    const it = p.c.items.find((q: any) => q.t === 'seg' && q.slot === x.slot);
    return <div class={'seg sg' + (x.why ? ' bad' : '') + (it && it.top ? ' top' : '')} key={'sg' + x.slot} data-seg={x.slot}>
      <div class="no" aria-hidden="true"><span>{x.t === 'promo' ? 'MIC' : (x.t === 'angle' ? 'ANG' : 'WRI')}</span>{it ? <small class="at">{hm(it.at)}</small> : null}</div>
      <div class="body"><div class="line1">
        <div><div class="who">{x.why ? <span class="bad">{x.why}</span> : (x.who.length ? x.who.map((id: number, q: number) => <>{q ? ', ' : null}<Name w={S.w[id]} /></>) : <span>The writers decide</span>)}</div>
          <div class="meta">{x.t === 'any' ? '' : CATN[x.t] + ': '}{E.SEGK[x.k].n} {'·'} {E.SEGLENN[x.len]}, {x.mins} min{x.look && x.look.mid != null ? <> {'·'} should be about <b class="gold">{stars(x.look.mid)}</b></> : null}{it && it.top ? <> {'·'} <TopTag top={it.top} /></> : null}</div></div>
        <div class="row"><Btn kind="sm" t="seg-edit" d={{ v: x.slot }} onClick={() => openSeg(x.slot)}>Change</Btn>
          <Btn kind="sm" t="seg-rm" d={{ v: x.slot }} onClick={() => act(() => { const r = E.setSeg(S, x.slot, null); say(r.msg); })}>Remove</Btn></div>
      </div></div>
    </div>;
  })}</>;
}

/** What is on the show by kind, with the time each kind takes. Sits under the run sheet. */
export function SegBar(p: { c: any }) {
  const S = G.S, c = p.c, part = (k: string, one: string, many: string) => <span data-t={'cat-' + k}><b>{c.cats[k].n}</b> {c.cats[k].n === 1 ? one : many} {'·'} <span class="num">{c.cats[k].mins}</span> min</span>;
  return <Panel title="Matches, promos and angles">
    <p class="cats">{part('match', 'match', 'matches')}{part('promo', 'promo', 'promos')}{part('angle', 'angle', 'angles')}</p>
    <div class="row mt2">
      <Btn t="seg-suggest" onClick={() => act(() => { const r = E.segSuggest(S); say(r.msg, { err: !r.ok }); })}>Suggest a promo or an angle</Btn>
    </div>
    <p class="muted mt1">Book as many of each as the time allows. A promo is talking: an interview, a call-out, a title challenge, a video recap. An angle is action: an ambush, a brawl, a save, a turn. Each is short, medium or long. Give time to the writers and they write it on the night.</p>
  </Panel>;
}

export function SegWindow(_p: { m: Modal }) {
  const S = G.S, d = draft(), I = E.segInfo(S), K = E.SEGK[d.k], n = S.card.length, had = d.slot >= 0 && !!I.list[d.slot];
  const kinds: Opt[] = Object.keys(E.SEGK).filter(k => E.SEGK[k].t === d.cat || E.SEGK[k].t === 'any').map(k => [k, E.SEGK[k].n] as Opt);
  const full = K.roles.every((_: string, i: number) => d.who[i] != null), sg = { k: d.k, who: d.who.slice(0, K.roles.length), pos: d.pos, len: d.len };
  const look = full ? E.segLook(S, sg, d.slot) : null, word = d.cat === 'promo' ? 'promo' : 'angle', cl = E.clock(S);
  const setWho = (i: number, v: string) => view(() => { d.who = d.who.slice(0, i); if (v !== '') d.who[i] = +v; });
  const save = () => act(() => { const r = E.setSeg(S, d.slot, sg); say(r.msg, { err: !r.ok }); if (r.ok) closeModal(); });
  const wlabel = (id: number) => { const w = S.w[id]; return w.name + ' · ' + Math.round(w.ovr) + ' · ' + (w.align === 'F' ? 'Face' : 'Heel'); };
  const lens: Opt[] = K.fix ? [[K.len, E.SEGLENN[K.len] + ' · ' + E.SEGLEN[K.len] + ' min (always)']] : ['S', 'M', 'L'].map(l => [l, E.SEGLENN[l] + ' · ' + E.SEGLEN[l] + ' min'] as Opt);
  const where = (i: number) => (i === 0 ? 'Opens the show, before match 1: ' : (i === n - 1 ? 'Before the main event: ' : 'Before match ' + (i + 1) + ': '));
  return <Window title={(had ? 'Change the ' : 'Book ' + (word === 'angle' ? 'an ' : 'a ')) + word} wide ok="Close"
    footer={<><Btn kind="go" t="seg-save" disabled={!look || !look.ok} onClick={save}>{had ? 'Save it' : 'Book it'}</Btn>
      {had ? <Btn t="seg-clear" onClick={() => act(() => { const r = E.setSeg(S, d.slot, null); say(r.msg); closeModal(); })}>Take it off the show</Btn> : null}</>}>
    <div class="editor plain">
      <Field label={'What kind of ' + word + '?'}><Sel id="seg-kind" t="seg-kind" value={d.k} options={kinds}
        onChange={v => view(() => { d.k = v; d.who = []; d.len = E.SEGK[v].len; })} /></Field>
      <Field label="How long?"><Sel id="seg-len" t="seg-len" value={K.fix ? K.len : d.len} disabled={!!K.fix} options={lens} onChange={v => view(() => { d.len = v; })} /></Field>
      <Field label="When?"><Sel id="seg-pos" t="seg-pos" value={Math.max(0, Math.min(d.pos, Math.max(0, n - 1)))} onChange={v => view(() => { d.pos = +v; })}
        options={n ? S.card.map((m: any, i: number) => [i, where(i) + cl.items.filter((x: any) => x.t === 'match' && x.i === i).map((x: any) => x.label).join('')] as Opt) : [[0, 'Opens the show']]} /></Field>
    </div>
    <p class="muted mt1">{K.d}</p>
    <p class="muted" data-t="seg-left">{cl.left > 0 ? 'The show has ' + cl.left + ' minutes still to fill.' : (cl.left < 0 ? 'The show is ' + (-cl.left) + ' minutes over already.' : 'The show is full to the minute.')}</p>
    <div class="editor plain mt1">{K.roles.map((role: string, i: number) => {
      const ready = i === 0 || d.who[i - 1] != null, ids: number[] = ready ? (E.segChoices(S, d.k, d.who.slice(0, i), d.slot)[i] || []) : [];
      return <Field label={role} key={d.k + i}><Sel id={'seg-who-' + i} t="seg-who" d={{ v: i }} value={d.who[i] == null ? '' : d.who[i]} disabled={!ready || !ids.length}
        options={[['', !ready ? 'Pick the one before first' : (ids.length ? 'Pick someone' : 'Nobody fits')] as Opt].concat(ids.map(id => [id, wlabel(id)] as Opt))} onChange={v => setWho(i, v)} /></Field>;
    })}</div>
    {look ? (look.ok ? <>
      {look.mid != null
        ? <p class="mt2" data-t="seg-look">It should be about <b class="gold">{stars(look.mid)}</b> <span class="muted">(between {stars(look.lo)} and {stars(look.hi)} on the night)</span>. It takes <b>{look.mins} minutes</b>.</p>
        : <p class="mt2" data-t="seg-look">The writers get <b>{look.mins} minutes</b>. What they do with it, you find out on the night.</p>}
      {look.notes.length ? <p class="muted">{look.notes.map((x: any, q: number) => <span key={q} class={x[0] > 0 ? 'good' : (x[0] < 0 ? 'bad' : undefined)}>{q ? ' · ' : ''}{x[0] > 0 ? '▲' : (x[0] < 0 ? '▼' : '')} {x[1]}</span>)}</p> : null}
    </> : <p class="bad mt2" data-t="seg-look">{look.why}</p>)
      : <p class="muted mt2">Pick who is in it and the game tells you what to expect.</p>}
  </Window>;
}

/** The ways a show can open, and the top-of-the-hour rule. */
export function OpenGuide(_p: { m: Modal }) {
  return <Window title="Ways to open a show" wide>
    <p class="muted">The first thing on the run sheet opens the show. Not every show starts with somebody talking. Each way of opening pays in its own way.</p>
    <ol class="rules">{E.OPEN_GUIDE.map((r: any) => <li key={r.k}><b>{r.n}.</b> {r.d}</li>)}</ol>
    <p class="mt2"><b>The top of the hour.</b> Whatever is on the air when an hour starts is what the people tuning in see. If it is clearly better than this crowd expects of you, they stay, and the show scores higher. If it is clearly worse, they switch off. The run sheet marks which item that is for every hour.</p>
  </Window>;
}
