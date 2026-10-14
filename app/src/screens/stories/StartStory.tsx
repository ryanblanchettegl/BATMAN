/* Start a story: two people and booking power (docs/plans/living-storylines.md: no length) (docs/plans/storylines.md, step 2; the picture is
   docs/mockups/storylines/st-2-start.png). Everything shown comes from E.storyPreview; nothing is spent until Start it. */
import { E } from '../../engine';
import { G, slice, act, view, say, Modal } from '../../store';
import { Btn, Sel, Field, showResult, Window } from '../../kit';
import { Group } from '../../kit/win';
import { Portrait } from '../../kit/portrait';

const storyState = () => slice<{ a: string; b: string; len: string }>('story', () => ({ a: '', b: '', len: 'm' }));
/** Clear the picks before the pop-up opens (a story can be started with one person already chosen). */
export function storyReset(a?: number, b?: number) { const st = storyState(); st.a = a != null ? String(a) : ''; st.b = b != null ? String(b) : ''; }


export function StoryWindow(_p: { m: Modal }) {
  const S = G.S, st = storyState(), people = E.storyPeople(S);
  const A = people.find((w: any) => String(w.id) === st.a) || null;
  const foes = A ? people.filter((w: any) => w.id !== A.id && w.g === A.g) : [];
  const pv = A && st.b ? E.storyPreview(S, +st.a, +st.b) : null;
  const tag = (w: any) => w.name + (w.hurt ? ' (hurt)' : '') + (w.n ? ' · in ' + w.n + (w.n === 1 ? ' feud' : ' feuds') : '');
  const start = () => act(() => { const r = E.storyStart(S, +st.a, +st.b); if (r.ok) slice<any>('stl', () => ({ sel: null, spg: 0, npg: 0 })).sel = r.id; say(r.msg, { err: !r.ok }); showResult('Start a feud', r.msg, !r.ok); });
  const face = (id: string) => S.w[+id] ? <Portrait w={S.w[+id]} cls="ss-face" /> : <span class="ss-face ss-none" />;
  return <Window title="Start a feud" wide ok="Not now"
    footer={<Btn kind="go" t="story-start" disabled={!pv || !pv.ok} onClick={start}>{'Start it · ' + (pv ? pv.cost : 2) + ' booking power'}</Btn>}>
    <div class="ss-who">
      <div class="ss-side">{face(st.a)}<Field label="Who"><Sel t="story-a" label="Who" value={st.a} options={[['', 'Pick a wrestler'], ...people.map((w: any): [string, string] => [String(w.id), tag(w)])]} onChange={v => view(() => { st.a = v; st.b = ''; })} /></Field></div>
      <b class="ss-vs">VS</b>
      <div class="ss-side">{face(st.b)}<Field label="Against whom"><Sel t="story-b" label="Against whom" value={st.b} disabled={!A} options={[['', A ? 'Pick an opponent' : 'Pick the first one'], ...foes.map((w: any): [string, string] => [String(w.id), tag(w)])]} onChange={v => view(() => { st.b = v; })} /></Field></div>
    </div>
    <Group title="How it runs">
      <p>A feud has no set length. It heats up with every promo, angle and match between them, goes stale if you feed it the same thing, and cools if you leave it alone. Twists and a week off freshen it. End it when the time is right, or watch it fizzle if the crowd never buys it.</p>
    </Group>
    {pv ? <div class="ss-two">
      <Group title="What the office knows">
        {pv.know.map((t: string) => <p>{t}</p>)}
        <p><b class="ss-ag">{pv.agent}:</b> “{pv.read}”</p>
      </Group>
      <Group title={pv.stop.length ? 'It cannot start' : (pv.warn.length ? 'Before you start' : 'Ready')} cls={pv.stop.length || pv.warn.length ? 'ss-warn' : ''}>
        {pv.stop.map((t: string) => <p class="bad" data-t="story-stop">{t}</p>)}
        {pv.warn.slice(0, 3).map((t: string) => <p class="warn" data-t="story-warn">{t}</p>)}
        {pv.good.map((t: string) => <p class="good">{t}</p>)}
        {!pv.stop.length && !pv.warn.length ? <p class="good">Nothing in the way. Both will remember who gave them the feud.</p> : null}
      </Group>
    </div> : <p class="muted mt1">Pick two people who can wrestle each other. Booking power: {S.bp}.</p>}
  </Window>;
}
