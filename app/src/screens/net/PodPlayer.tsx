/* The podcast player (Bill, 21 October: "a weekly podcast with animations and closed captioning"). One episode at the
   size of the whole screen: the picture on the left with the line being said under it as a caption, the chapters and
   the transcript down the right, and the controls under the picture. The hosts sit at the commentary desk for now
   (the studio set comes later): the one talking moves, and some lines cut to a picture of who they are talking about,
   the champion with the belt on the shoulder or two people face to face. Each host talks in the commentators'
   wah-wah voices. Only the view changes here; the episode itself is written by the engine (src/99-zpodcast.js). */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, Modal, slice, reduceMotion } from '../../store';
import { onKey } from '../../input';
import { Window, Btn, Empty } from '../../kit';
import { ScenePlayer } from '../../kit/sceneplayer';
import { Scene, scenesFor, copy, templateScene } from '../../kit/scene';
import { recipeOf, commentator, dress, Recipe } from '../../kit/puppet';
import { momentPick } from '../../shared/moment';
import { speak } from '../../audio/engine';

/** What the viewer has chosen for the player, kept while the game is open. */
const look = () => slice('podplayer', () => ({ cap: true, box: false, speed: 1 }));
const SPEEDS: [number, string][] = [[0.75, 'Slow'], [1, 'Normal'], [1.5, 'Fast'], [2, 'Fastest']];
/** How long a line stays up, in milliseconds at normal speed: a little over a third of a second a word. */
export function lineMs(L: any): number { return L.s === 'x' ? 2200 : Math.max(1800, 900 + L.t.split(/\s+/).length * 330); }
/** The hosts' voices: the commentators' wah-wah talk Ryan picked (src/audio), A in the play-by-play voice and B in the colour.
    A stage direction in brackets, such as the theme, has no sound yet: nothing is played that Ryan has not picked. */
function voice(L: any, speed: number) {
  if (L.s === 'x') return;
  speak(L.s === 'a' ? 'wah_pbp' : 'wah_col', lineMs(L) / speed / 1000 - 0.4);
}

let ctl: { tog: () => void; step: (d: number) => void } | null = null;
onKey((e: KeyboardEvent) => {
  if (!ctl) return false;
  if (e.key === ' ' || e.key === 'k') { ctl.tog(); return true; }
  if (e.key === 'ArrowRight' || e.key === 'l') { ctl.step(1); return true; }
  if (e.key === 'ArrowLeft' || e.key === 'j') { ctl.step(-1); return true; }
  return false;
});

export function PodPlayer(p: { m: Modal }) {
  const S = G.S, I = E.podcast(S), ep: any = useMemo(() => E.podEp(S, p.m.n), [p.m.n]), lk = look();
  const [i, setI] = useState(0), [on, setOn] = useState(true), [, bump] = useState(0), list = useRef<HTMLOListElement>(null);
  const n = ep ? ep.lines.length : 0, L = ep ? ep.lines[i] : null;
  const names: Record<string, string> = { a: I.hosts[0].name, b: I.hosts[1].name };
  const go = (k: number) => { setI(Math.max(0, Math.min(n - 1, k))); };
  ctl = { tog: () => setOn(x => !x), step: (d: number) => go(i + d) };
  useEffect(() => () => { ctl = null; }, []);
  // the line plays, and the next follows when its time is up
  useEffect(() => {
    if (!on || !L) return;
    voice(L, lk.speed);
    const t = setTimeout(() => { if (i + 1 < n) setI(i + 1); else setOn(false); }, lineMs(L) / lk.speed);
    return () => clearTimeout(t);
  }, [i, on, lk.speed]);
  // the transcript keeps the line being said in view
  useLayoutEffect(() => { const el = list.current && list.current.querySelector('.now') as HTMLElement | null; if (el && list.current) list.current.scrollTop = el.offsetTop - list.current.clientHeight / 2; }, [i]);
  const cast = useMemo(() => hostCast(I), []);
  const pic = useMemo(() => L ? picFor(L, i, cast, names) : null, [i]);
  if (!ep || !L) return <Window title={I.show} ok="Close"><Empty>That episode is no longer kept.</Empty></Window>;
  const seg = ep.segs[L.g], set = (fn: () => void) => { fn(); bump(x => x + 1); };
  return <Window title={I.show + ': ' + ep.title} wide ok="Close" hint="Space plays and pauses. The arrow keys go a line back or on. Esc closes.">
    <div class="podplayer" data-t="pod-player">
      <div class="pp-main">
        <div class="pp-tv tvframe" data-t="pod-tv">
          {pic && <ScenePlayer key="pod" sc={pic.sc} cast={pic.cast} play={pic.play} label={pic.label} still={reduceMotion() || !on} fill />}
          <div class="pp-seg">{seg ? seg.n : ''}</div>
          {lk.cap && <div class={'pp-cap' + (lk.box ? ' box' : '')} data-t="pod-caption" aria-hidden="true">{L.s !== 'x' && <b class={'k-' + L.s}>{names[L.s]}: </b>}{L.t}</div>}
        </div>
        <p class="sr" aria-live="polite">{L.s !== 'x' ? names[L.s] + ': ' : ''}{L.t}</p>
        <div class="pp-ctl" role="group" aria-label="Player">
          <Btn kind="sm" t="pod-first" onClick={() => go(0)}>{'⏮'} Start</Btn>
          <Btn kind="sm" t="pod-back" onClick={() => go(i - 1)}>{'◀'} Line back</Btn>
          <Btn kind="go" t="pod-toggle" onClick={() => setOn(x => !x)}>{on ? 'Pause' : (i + 1 >= n ? 'Done' : 'Play')}</Btn>
          <Btn kind="sm" t="pod-next" onClick={() => go(i + 1)}>Line on {'▶'}</Btn>
          <label class="pp-speed">Speed <select data-t="pod-speed" value={String(lk.speed)} onChange={e => set(() => { lk.speed = +(e.target as HTMLSelectElement).value; })}>
            {SPEEDS.map(([v, t]) => <option key={v} value={String(v)}>{t}</option>)}</select></label>
          <Btn kind="sm" t="pod-cap" d={{ v: lk.cap ? 1 : 0 }} onClick={() => set(() => { lk.cap = !lk.cap; })}>{lk.cap ? 'Captions on' : 'Captions off'}</Btn>
          <Btn kind="sm" t="pod-capbox" d={{ v: lk.box ? 1 : 0 }} onClick={() => set(() => { lk.box = !lk.box; })}>{lk.box ? 'Caption box on' : 'Caption box off'}</Btn>
          <span class="pp-pos muted" data-t="pod-pos">Line {i + 1} of {n}</span>
        </div>
        <div class="pp-bar" aria-hidden="true"><span style={{ width: Math.round((i + 1) / n * 100) + '%' }} /></div>
      </div>
      <aside class="pp-side">
        <h3>Chapters</h3>
        <ol class="pp-chap">{ep.segs.map((s: any, k: number) => <li key={k}><Btn kind="sm" t="pod-chapter" d={{ v: k }} on={L.g === k} onClick={() => go(s.i)}>{s.n}</Btn></li>)}</ol>
        <h3>Transcript</h3>
        <ol class="pp-tx" ref={list} role="log" aria-label="Transcript" tabIndex={0} data-t="pod-transcript">
          {ep.lines.map((x: any, k: number) => <li key={k} class={k === i ? 'now' : ''}><button type="button" data-t="pod-line" data-v={k} onClick={() => go(k)}>{x.s !== 'x' && <b class={'k-' + x.s}>{names[x.s]}: </b>}{x.t}</button></li>)}
        </ol>
      </aside>
    </div>
  </Window>;
}

/** The two hosts as dolls: the writer in a suit, the co-host as themselves (a retired wrestler) or in a suit. */
function hostCast(I: any): Record<string, Recipe> {
  const S = G.S, b = I.hosts[1], w = b.w != null ? S.w[b.w] : null;
  return { C1: { ...commentator(0), name: I.hosts[0].name }, C2: w ? { ...dress(recipeOf(w), 1), name: b.name } : { ...commentator(1), name: b.name } };
}
/** The picture for a line: who is talking at the desk, or a cut to who they are talking about. */
function picFor(L: any, i: number, hosts: Record<string, Recipe>, names: Record<string, string>): { sc: Scene; cast: Record<string, Recipe>; play: string; label: string } | null {
  const S = G.S, world = E.worldScenes(S) as Scene[], P = S.promos[S.player], q = L.p;
  if (q && q.k === 'champ' && S.w[q.w]) {
    const w = S.w[q.w], t = (P.titles || []).find((x: any) => x.id === q.t), sc = copy(templateScene('portrait'));
    sc.frame = 'wide'; sc.keys.forEach(k => k.props.forEach(pr => { if (pr.k === 'headline') pr.txt = t ? String(t.name).toUpperCase().slice(0, 28) : 'CHAMPION'; }));
    const r = recipeOf(w), cast = { A: t ? { ...r, belts: 1, beltL: [E.beltOf(t, P)] } : r };
    return { sc, cast, play: i + ':c', label: w.name + ' with the ' + (t ? t.name : 'belt') + ' over the shoulder' };
  }
  if (q && q.k === 'face' && q.ids && S.w[q.ids[0]] && S.w[q.ids[1]]) {
    const pk = momentPick('furious', q.ids[0], q.ids[1], i);
    if (pk) return { sc: pk.sc, cast: pk.cast, play: i + ':f', label: S.w[q.ids[0]].name + ' and ' + S.w[q.ids[1]].name + ', face to face' };
  }
  const who = L.s === 'b' ? 'desk2' : 'desk1', sc = scenesFor(who, world)[0];
  if (!sc) return null;
  return { sc, cast: hosts, play: i + ':' + L.s, label: L.s === 'x' ? 'The two hosts at the desk' : names[L.s] + ' talking' };
}
