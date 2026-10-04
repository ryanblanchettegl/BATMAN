/* Promos and angles: the window that books one, and the guide to how a show opens. A show takes as many as fit in
   its time. The player picks what kind, who is in it, how long it runs, and where on the show it goes. Their lines on
   the run sheet are drawn by Card.tsx and their details by Side.tsx.
   The engine side is src/93-segments.js (the segments) and src/97-time.js (the clock, and how a show opens). */
import { E } from '../../engine';
import { G, Modal, act, say, view, slice, openModal, closeModal } from '../../store';
import { Btn, Window, Sel, Field, Tag, Opt } from '../../kit';
import { sel } from './run';

type Cat = 'promo' | 'angle';
interface Draft { slot: number; cat: Cat; k: string; who: (number | null)[]; pos: number; len: string }
const draft = () => slice<Draft>('segdraft', () => ({ slot: -1, cat: 'promo', k: 'interview', who: [], pos: 0, len: 'M' }));
export const CATN: Record<string, string> = { promo: 'Promo', angle: 'Angle', any: 'Writers' };
const FIRST: Record<Cat, string> = { promo: 'interview', angle: 'ambush' };
/** Minutes as a clock time: 75 is 1:15. */
export const hm = (m: number) => Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2);
/** The tag for the item that is on the air when an hour starts. */
export function TopTag(p: { top?: number }) { return p.top ? <Tag kind="gold">{p.top === 1 ? 'Opens the show' : 'Top of hour ' + p.top}</Tag> : null; }

/** Open the booking window: a segment already on the show, or a fresh promo or angle. */
export function openSeg(slot: number, cat?: Cat) {
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

export function SegWindow(_p: { m: Modal }) {
  const S = G.S, d = draft(), I = E.segInfo(S), K = E.SEGK[d.k], n = S.card.length, had = d.slot >= 0 && !!I.list[d.slot];
  const kinds: Opt[] = Object.keys(E.SEGK).filter(k => E.SEGK[k].t === d.cat || E.SEGK[k].t === 'any').map(k => [k, E.SEGK[k].n] as Opt);
  const full = K.roles.every((_: string, i: number) => d.who[i] != null), sg = { k: d.k, who: d.who.slice(0, K.roles.length), pos: d.pos, len: d.len };
  const look = full ? E.segLook(S, sg, d.slot) : null, word = d.cat === 'promo' ? 'promo' : 'angle', cl = E.clock(S);
  const setWho = (i: number, v: string) => view(() => { d.who = d.who.slice(0, i); if (v !== '') d.who[i] = +v; });
  const save = () => act(() => { const r = E.setSeg(S, d.slot, sg); say(r.msg, { err: !r.ok }); if (r.ok) { if (r.slot != null) sel().seg = r.slot; closeModal(); } });
  const wlabel = (id: number) => { const w = S.w[id]; return w.name + ' · ' + Math.round(w.ovr) + ' · ' + (w.align === 'F' ? 'Face' : 'Heel'); };
  const lens: Opt[] = K.fix ? [[K.len, E.SEGLENN[K.len] + ' · ' + E.SEGLEN[K.len] + ' min (always)']] : ['S', 'M', 'L'].map(l => [l, E.SEGLENN[l] + ' · ' + E.SEGLEN[l] + ' min'] as Opt);
  const where = (i: number) => (i === 0 ? 'Opens the show, before match 1: ' : (i === n - 1 ? 'Before the main event: ' : 'Before match ' + (i + 1) + ': '));
  return <Window title={(had ? 'Change the ' : 'Book ' + (word === 'angle' ? 'an ' : 'a ')) + word} wide ok="Close"
    footer={<><Btn kind="go" t="seg-save" disabled={!look || !look.ok} onClick={save}>{had ? 'Save it' : 'Book it'}</Btn>
      {had ? <Btn t="seg-clear" onClick={() => act(() => { const r = E.setSeg(S, d.slot, null); sel().seg = -1; say(r.msg); closeModal(); })}>Take it off the show</Btn> : null}</>}>
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
        ? <p class="mt2" data-t="seg-look"><span class={look.read.k === 'good' ? 'good' : (look.read.k === 'bad' ? 'bad' : undefined)}>{look.read.t}</span> It takes <b>{look.mins} minutes</b>.</p>
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
