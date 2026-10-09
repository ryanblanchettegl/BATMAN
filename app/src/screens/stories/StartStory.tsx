/* Start a story: two people, a length, and booking power (docs/plans/storylines.md, step 2; the picture is
   docs/mockups/storylines/st-2-start.png). Everything shown comes from E.storyPreview; nothing is spent until Start it. */
import { E } from '../../engine';
import { G, slice, act, view, say, Modal } from '../../store';
import { Btn, Sel, Field, showResult, Window } from '../../kit';
import { Group } from '../../kit/win';
import { Portrait } from '../../kit/portrait';

const storyState = () => slice<{ a: string; b: string; len: string }>('story', () => ({ a: '', b: '', len: 'm' }));
/** Clear the picks before the pop-up opens (a story can be started with one person already chosen). */
export function storyReset(a?: number) { const st = storyState(); st.a = a != null ? String(a) : ''; st.b = ''; st.len = 'm'; }

const wk = (n: number) => n <= 0 ? 'this week' : n === 1 ? 'next week' : 'in ' + n + ' weeks';

export function StoryWindow(_p: { m: Modal }) {
  const S = G.S, st = storyState(), people = E.storyPeople(S);
  const A = people.find((w: any) => String(w.id) === st.a) || null;
  const foes = A ? people.filter((w: any) => w.id !== A.id && w.g === A.g) : [];
  const pv = A && st.b ? E.storyPreview(S, +st.a, +st.b) : null;
  const L = pv ? pv.lens.find((x: any) => x.len === st.len) : null;
  const tag = (w: any) => w.name + (w.hurt ? ' (hurt)' : '') + (w.n ? ' · in ' + w.n + (w.n === 1 ? ' feud' : ' feuds') : '');
  const start = () => act(() => { const r = E.storyStart(S, +st.a, +st.b, st.len); if (r.ok) slice<any>('stl', () => ({ sel: null, spg: 0, npg: 0 })).sel = r.id; say(r.msg, { err: !r.ok }); showResult('Start a feud', r.msg, !r.ok); });
  const face = (id: string) => S.w[+id] ? <Portrait w={S.w[+id]} cls="ss-face" /> : <span class="ss-face ss-none" />;
  return <Window title="Start a feud" wide ok="Not now"
    footer={<Btn kind="go" t="story-start" disabled={!pv || !pv.ok || !L || !L.can} onClick={start}>{L ? 'Start it · ' + L.cost + ' booking power' : 'Start it'}</Btn>}>
    <div class="ss-who">
      <div class="ss-side">{face(st.a)}<Field label="Who"><Sel t="story-a" label="Who" value={st.a} options={[['', 'Pick a wrestler'], ...people.map((w: any): [string, string] => [String(w.id), tag(w)])]} onChange={v => view(() => { st.a = v; st.b = ''; })} /></Field></div>
      <b class="ss-vs">VS</b>
      <div class="ss-side">{face(st.b)}<Field label="Against whom"><Sel t="story-b" label="Against whom" value={st.b} disabled={!A} options={[['', A ? 'Pick an opponent' : 'Pick the first one'], ...foes.map((w: any): [string, string] => [String(w.id), tag(w)])]} onChange={v => view(() => { st.b = v; })} /></Field></div>
    </div>
    <Group title="How long">
      <div class="ss-lens" role="radiogroup" aria-label="How long the feud runs">
        {(pv ? pv.lens : lensBlank()).map((x: any) => <button type="button" key={x.len} role="radio" aria-checked={st.len === x.len} class={'ss-len k' + x.len + (st.len === x.len ? ' on' : '') + (x.can === false ? ' poor' : '')}
          data-t="story-len" data-v={x.len} onClick={() => view(() => { st.len = x.len; })}>
          <b>{st.len === x.len ? '● ' : ''}{x.n}</b>
          <span><i>Runs</i><em>{x.runs}</em></span>
          <span><i>Ends at</i><em data-t="story-ends">{x.at ? (x.ch ? '3 chapters, the last at ' + x.atS : x.atS + ', ' + wk(x.in)) : 'pick two people'}</em></span>
          <span><i>Heat to</i><em>{x.cap}</em></span>
          <span><i>Cost</i><em class={x.can === false ? 'bad' : ''}>{x.cost} booking power</em></span>
          <small>{x.good}</small>
        </button>)}
      </div>
    </Group>
    {pv ? <div class="ss-two">
      <Group title="What the office knows">
        {pv.know.map((t: string) => <p>{t}</p>)}
        <p><b class="ss-ag">{pv.agent}:</b> “{pv.read}”</p>
      </Group>
      <Group title={pv.stop.length ? 'It cannot start' : (pv.warn.length ? 'Before you start' : 'Ready')} cls={pv.stop.length || pv.warn.length ? 'ss-warn' : ''}>
        {pv.stop.map((t: string) => <p class="bad" data-t="story-stop">{t}</p>)}
        {pv.warn.slice(0, 3).map((t: string) => <p class="warn" data-t="story-warn">{t}</p>)}
        {!pv.stop.length && !pv.warn.length ? <p class="good">Nothing in the way. Both will remember who gave them the feud.</p> : null}
        {L && L.ch ? <p class="muted">Chapters end at {L.ch.map((c: any) => c.atS + ' (' + wk(c.in) + ')').join(', ')}.</p> : null}
      </Group>
    </div> : <p class="muted mt1">Pick two people who can wrestle each other. Booking power: {S.bp}.</p>}
  </Window>;
}
/** The three lengths before anybody is picked: what each runs and costs, with no ending yet. */
function lensBlank() {
  const F = E.FLEN, good: Record<string, string> = { s: 'A challenger for a month. Quick and safe.', m: 'Four acts and a blow-off at the big event.', l: 'The feud of the year, in three chapters.' };
  const cap: Record<string, string> = { s: 'Hot', m: 'White hot', l: 'As far as it goes' };
  return ['s', 'm', 'l'].map(k => ({ len: k, n: F[k].n, runs: F[k].runs, cost: F[k].cost, can: G.S.bp >= F[k].cost, cap: cap[k], good: good[k], at: null, ch: null, in: 0 }));
}
