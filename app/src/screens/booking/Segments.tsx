/* Promos and angles on the run sheet. A show has a few segment slots. The player books them here, beside the
   matches: what kind, who is in it, and where on the show it goes. A slot left alone goes to the writers. */
import { E } from '../../engine';
import { G, Modal, act, say, view, slice, openModal, closeModal } from '../../store';
import { Btn, Panel, Window, Sel, Field, Name, Opt } from '../../kit';
import { pickSide, sideText } from './run';

interface Draft { slot: number; k: string; who: (number | null)[]; pos: number }
const draft = () => slice<Draft>('segdraft', () => ({ slot: 0, k: 'interview', who: [], pos: 0 }));
const kindWord = (k: string) => (E.SEGK[k].t === 'promo' ? 'Promo' : 'Angle');

/** Open the booking window for a slot: the segment already there, or a fresh one. */
function openSeg(slot: number) {
  const S = G.S, I = E.segInfo(S), cur = I.list[slot], d = draft(), n = S.card.length;
  d.slot = slot; d.k = cur ? cur.k : 'interview'; d.who = cur ? cur.who.slice() : []; d.pos = cur ? cur.pos : (slot % 2 ? Math.max(0, n - 1) : Math.min(1, Math.max(0, n - 1)));
  openModal({ kind: 'segwin' });
}
const firstFree = (I: any): number => I.list.findIndex((x: any) => !x);
/** Book into the first free slot. For the button beside "Add a match". */
export function bookSeg() { const f = firstFree(E.segInfo(G.S)); if (f >= 0) openSeg(f); }
export const segFree = () => firstFree(E.segInfo(G.S)) >= 0;

/** The opening promo's line on the run sheet. The form itself is the Opening promo tab beside the card. */
export function OpenRow() {
  const S = G.S, pl = S.plan, w = pl ? S.w[pl.sp] : null;
  const go = () => { pickSide('promo'); setTimeout(() => { const el = document.getElementById('plan-sp'); if (el) { el.scrollIntoView({ block: 'center' }); (el as HTMLElement).focus(); } }, 0); };
  return <div class="seg sg">
    <div class="no" aria-hidden="true">MIC</div>
    <div class="body"><div class="line1">
      <div><div class="who">{w ? <><Name w={w} /> opens the show</> : <span class="muted">Nobody opens the show. The writers decide.</span>}</div>
        <div class="meta">Opening promo{w && pl ? ' · ' + E.PKIND[pl.kind || 'interview'].n : ''}</div></div>
      <div class="row"><Btn kind="sm" t="promo-open" onClick={go}>{w ? 'Change' : 'Book it'}</Btn></div>
    </div></div>
  </div>;
}

/** The booked segments that come before match `i`. */
export function SegRows(p: { i: number; n: number }) {
  const S = G.S, I = E.segInfo(S), mine = I.list.filter((x: any) => x && Math.max(0, Math.min(x.pos, p.n - 1)) === p.i);
  if (!mine.length) return null;
  return <>{mine.map((x: any) => <div class={'seg sg' + (x.why ? ' bad' : '')} key={'sg' + x.slot}>
    <div class="no" aria-hidden="true">{E.SEGK[x.k].t === 'promo' ? 'MIC' : 'ANG'}</div>
    <div class="body"><div class="line1">
      <div><div class="who">{x.why ? <span class="bad">{x.why}</span> : x.who.map((id: number, q: number) => <>{q ? ', ' : null}<Name w={S.w[id]} /></>)}</div>
        <div class="meta">{kindWord(x.k)}: {E.SEGK[x.k].n}{x.look ? <> {'·'} should score about <b class="num">{x.look.mid}%</b></> : null}</div></div>
      <div class="row"><Btn kind="sm" t="seg-edit" d={{ v: x.slot }} onClick={() => openSeg(x.slot)}>Change</Btn>
        <Btn kind="sm" t="seg-rm" d={{ v: x.slot }} onClick={() => act(() => { const r = E.setSeg(S, x.slot, null); say(r.msg); })}>Back to the writers</Btn></div>
    </div></div>
  </div>)}</>;
}

/** How many slots are booked, and the buttons to book or suggest. Sits under the run sheet. */
export function SegBar() {
  const S = G.S, I = E.segInfo(S), free = firstFree(I);
  if (!I.slots) return null;
  return <Panel title="Promos and angles">
    <p><b>{I.booked} of {I.slots}</b> booked for this show. {I.booked < I.slots ? 'The writers fill the rest on the night.' : 'The writers have nothing left to fill.'}</p>
    <div class="row mt2">
      <Btn t="seg-add" disabled={free < 0} onClick={() => openSeg(free)}>Book a promo or an angle</Btn>
      <Btn t="seg-suggest" disabled={free < 0} onClick={() => act(() => { const r = E.segSuggest(S); say(r.msg, { err: !r.ok }); })}>Suggest them</Btn>
    </div>
    <p class="muted mt1">A promo is talking: an interview, a call-out, a title challenge. An angle is action: an ambush, a brawl, a save, a turn. You pick who and what kind. The game writes it and grades it.</p>
  </Panel>;
}

export function SegWindow(_p: { m: Modal }) {
  const S = G.S, d = draft(), I = E.segInfo(S), K = E.SEGK[d.k], n = S.card.length, had = !!I.list[d.slot];
  const kinds = (t: string): Opt[] => Object.keys(E.SEGK).filter(k => E.SEGK[k].t === t).map(k => [k, E.SEGK[k].n] as Opt);
  const full = K.roles.every((_: string, i: number) => d.who[i] != null), sg = { k: d.k, who: d.who.slice(0, K.roles.length), pos: d.pos };
  const look = full ? E.segLook(S, sg, d.slot) : null;
  const setWho = (i: number, v: string) => view(() => { d.who = d.who.slice(0, i); if (v !== '') d.who[i] = +v; });
  const save = () => act(() => { const r = E.setSeg(S, d.slot, sg); say(r.msg, { err: !r.ok }); if (r.ok) closeModal(); });
  const wlabel = (id: number) => { const w = S.w[id]; return w.name + ' · ' + Math.round(w.ovr) + ' · ' + (w.align === 'F' ? 'Face' : 'Heel'); };
  return <Window title="Book a promo or an angle" wide ok="Close"
    footer={<><Btn kind="go" t="seg-save" disabled={!look || !look.ok} onClick={save}>Book it</Btn>
      {had ? <Btn t="seg-clear" onClick={() => act(() => { const r = E.setSeg(S, d.slot, null); say(r.msg); closeModal(); })}>Hand it back to the writers</Btn> : null}</>}>
    <div class="editor plain">
      <Field label="What kind?"><Sel id="seg-kind" t="seg-kind" value={d.k} options={[]} groups={[{ label: 'Promos', options: kinds('promo') }, { label: 'Angles', options: kinds('angle') }]}
        onChange={v => view(() => { d.k = v; d.who = []; })} /></Field>
      <Field label="When?"><Sel id="seg-pos" t="seg-pos" value={Math.max(0, Math.min(d.pos, Math.max(0, n - 1)))} onChange={v => view(() => { d.pos = +v; })}
        options={n ? S.card.map((m: any, i: number) => [i, (i === n - 1 ? 'Before the main event: ' : 'Before match ' + (i + 1) + ': ') + m.sides.map((s: any) => sideText(s)).join(' vs ')] as Opt) : [[0, 'Before the first match']]} /></Field>
    </div>
    <p class="muted mt1">{K.d}</p>
    <div class="editor plain mt1">{K.roles.map((role: string, i: number) => {
      const ready = i === 0 || d.who[i - 1] != null, ids: number[] = ready ? (E.segChoices(S, d.k, d.who.slice(0, i), d.slot)[i] || []) : [];
      return <Field label={role} key={d.k + i}><Sel id={'seg-who-' + i} t="seg-who" d={{ v: i }} value={d.who[i] == null ? '' : d.who[i]} disabled={!ready || !ids.length}
        options={[['', !ready ? 'Pick the one before first' : (ids.length ? 'Pick someone' : 'Nobody fits')] as Opt].concat(ids.map(id => [id, wlabel(id)] as Opt))} onChange={v => setWho(i, v)} /></Field>;
    })}</div>
    {look ? (look.ok ? <>
      <p class="mt2" data-t="seg-look">It should score about <b class="num">{look.mid}%</b> <span class="muted">(between {look.lo} and {look.hi} on the night)</span>.</p>
      {look.notes.length ? <p class="muted">{look.notes.map((x: any, q: number) => <span key={q} class={x[0] > 0 ? 'good' : 'bad'}>{q ? ' · ' : ''}{x[0] > 0 ? '▲' : '▼'} {x[1]}</span>)}</p> : null}
    </> : <p class="bad mt2" data-t="seg-look">{look.why}</p>)
      : <p class="muted mt2">Pick who is in it and the game tells you what to expect.</p>}
  </Window>;
}
