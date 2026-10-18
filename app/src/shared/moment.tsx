/* The picture of a moment the booker answers (Ryan, 18 October): a matter on the desk or a call from the gorilla
   position shows one still diorama picture beside its answers. Which still comes from what the moment is about
   (`STILL_OF` below), who is in it from the people the moment names, and the game's own stills are made in Create a
   Scene like any other (`STILLS` in kit/scene.ts); a world can bring its own. It only reads the game. */
import { E } from '../engine';
import { G } from '../store';
import { ScenePlayer } from '../kit/sceneplayer';
import { Scene, scenesFor, copy } from '../kit/scene';
import { recipeOf, Recipe } from '../kit/puppet';

/** Who plays each part of a scene: a slot with a hook gets whoever the game says fills it (E.sceneHooks); a slot
    with none gets A or B by its role. A slot nobody can fill is left out of the picture. */
export function fillScene(sc: Scene, hk: Record<string, number>, cast: Record<string, Recipe>): Scene | null {
  const S = G.S, keep = sc.slots.filter(sl => {
    if (cast[sl.id] || sl.role === 'ref' || sl.dress === 'suit') return true;
    const id = hk[sl.hook || sl.role]; if (id == null || !S.w[id]) return false;
    cast[sl.id] = recipeOf(S.w[id]); return true;
  });
  if (keep.filter(sl => sl.role !== 'ref').length < Math.min(2, sc.slots.filter(sl => sl.role !== 'ref').length)) return null;
  return keep.length === sc.slots.length ? sc : { ...sc, slots: keep };
}

/** What each matter (by `type`) and each call (by `kind`) is a picture of. Anything not here: across your desk when it
    names somebody, a call to the office when it names nobody. */
const STILL_OF: Record<string, string> = {
  champout: 'hurt', botch: 'hurt',
  break: 'walkout', holdout: 'walkout', goalblocked: 'walkout', offer: 'walkout',
  carfight: 'brawl', chaos: 'brawl', runin: 'brawl',
  furious: 'argue', passed: 'argue', upset: 'argue', rebel: 'argue', mainflop: 'argue', afterbell: 'argue',
  caughtfire: 'cheer', rematch: 'cheer', callup: 'cheer', chant: 'cheer', lastwin: 'cheer', overtime: 'cheer', face: 'cheer', audible: 'cheer',
  clause: 'title', friends: 'title', titlecall: 'title',
  scrum: 'press', hotmic: 'press',
};
/** The headline on a call to the office with nobody in it. */
const CAP_OF: Record<string, string> = {
  investor: 'THE INVESTOR', netmeet: 'THE NETWORK', netexec: 'THE NETWORK', network: 'THE NETWORK', rights: 'TV RIGHTS', nightmove: 'THE NETWORK',
  netback: 'THE NETWORK', xfdeal: 'THE WAR', agreetrouble: 'THE RIVALS', mutiny: 'THE LOCKER ROOM', arcch: 'THE STORY', owner: 'THE OWNER', sponsor: 'THE SPONSOR',
};
const idOf = (x: any): number | null => typeof x === 'number' ? x : (x && typeof x.id === 'number' ? x.id : null);

/** The still for a moment: `k` is the matter's type or the call's kind, `a` and `b` the people it names. */
export function momentPick(k: string, a: number | null, b: number | null, salt: number): { sc: Scene; cast: Record<string, Recipe>; when: string } | null {
  const S = G.S; if (!S) return null;
  const has = (id: number | null) => id != null && !!S.w[id];
  const pa = has(a) ? a : (has(b) ? b : null), pb = pa === a && has(b) && b !== a ? b : null;
  // the network, the owner, the sponsor and the like are a call to the office, whoever is in the match
  let when = CAP_OF[k] ? 'phone' : (STILL_OF[k] || (pa != null ? 'meeting' : 'phone'));
  if (pa == null) when = 'phone';
  const world = E.worldScenes(S) as Scene[], hk = pa == null ? {} : E.sceneHooks(S, { ids: [pa].concat(pb != null ? [pb] : []), a: pa, b: pb });
  if (pa != null) { hk.a = pa; if (pb != null) hk.b = pb; else delete hk.b; }
  const list = scenesFor(when, world).filter(s => s.still);
  // two people named: a still for two first; one: a still for one
  const two = (s: Scene) => s.slots.filter(sl => sl.role !== 'ref').length >= 2;
  const fit = list.filter(s => pb != null ? two(s) : !two(s));
  const pool = fit.length ? fit : list;
  for (let i = 0; i < pool.length; i++) {
    const cast: Record<string, Recipe> = {}, sc0 = pool[(Math.abs(salt) + i) % pool.length], sc = fillScene(sc0, hk, cast);
    if (!sc) continue;
    if (when === 'phone') { const c = copy(sc); c.keys.forEach(kk => kk.props.forEach(p => { if (p.id === 'cap') p.txt = CAP_OF[k] || 'THE OFFICE'; })); return { sc: c, cast, when }; }
    return { sc, cast, when };
  }
  return null;
}

/** The picture beside a moment. `ev` is a matter from the inbox or a call from the gorilla position. */
export function MomentPic(p: { ev: any; call?: boolean; t?: string }) {
  const ev = p.ev, k = p.call ? ev.kind : ev.type;
  const a = idOf(p.call ? ev.who : ev.w), b = idOf(p.call ? ev.other : ev.o);
  const pk = momentPick(k, a, b, (ev.id || 0) * 7 + String(k).length);
  if (!pk) return null;
  const S = G.S, names = Object.keys(pk.cast).map(sl => { const sl0 = pk.sc.slots.find(x => x.id === sl); const id = sl0 && (sl0.role === 'a' ? a : b); return id != null && S.w[id] ? S.w[id].name : ''; }).filter(Boolean);
  const label = pk.sc.name + (names.length ? ': ' + names.join(' and ') : '');
  return <figure class="mfig" data-t={p.t || 'moment-pic'} data-v={pk.sc.id} data-k={pk.when}>
    <div class="moment"><ScenePlayer sc={pk.sc} cast={pk.cast} play={'m' + (ev.id || 0)} still t="moment-scene" label={label} /></div>
    <figcaption class="mcap">{label}</figcaption>
  </figure>;
}
