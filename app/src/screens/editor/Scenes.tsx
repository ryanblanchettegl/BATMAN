/* The World Editor's Scenes tab: the scenes this world carries, made in Create a Scene (app/src/screens/scene). A
   scene with the same id as one of the game's takes its place in games of this world. Create a Scene opens full
   screen from here, and Done comes back. */
import { E } from '../../engine';
import { Btn, Panel } from '../../kit';
import { es, world, look, edit, editDel, note } from './state';
import { SCENES, STILLS, WHEN, STILL_WHEN, Scene } from '../../kit/scene';

const use = (sc: Scene) => ((sc.still ? STILL_WHEN : WHEN).find(w => w[0] === sc.when) || ['', 'Only by hand'])[1];
export function ScenesTab() {
  const st = es(), pkg = world(), mine: Scene[] = E.edScenes(pkg);
  const openIt = (id: string) => look(() => { st.scene = id; });
  return <>
    <Panel cls="mb4" title="Create a Scene">
      <p>Scenes are the pictures of this world: the lock-up at the bell, the count at a near fall, a new champion with the belt held high, and soon breaking news, talk shows, posters, magazine covers and portraits. Pose paper wrestlers, add props, set keyframes, and the game plays the scene with whoever is on the card. A still is one picture with no keyframes, for the moments you answer.</p>
      <div class="row mt2"><Btn kind="go" t="ed-scene-new" onClick={() => openIt('__new')}>Create a new scene</Btn></div>
    </Panel>
    <Panel cls="mb4" title={'In this world (' + mine.length + ')'}>
      {mine.length ? <ul class="list">{mine.map(sc => <li key={sc.id}><span><b>{sc.name}</b> <span class="muted">{'·'} {use(sc)} {'·'} {sc.still ? 'a still' : sc.keys.length + ' keyframes'}{SCENES.concat(STILLS).some(x => x.id === sc.id) ? ' · in place of the game’s' : ''}</span></span>
        <span class="row opts"><Btn kind="sm" t="ed-scene-edit" d={{ id: sc.id }} onClick={() => openIt(sc.id)}>Edit</Btn>
          <Btn kind="danger" t="ed-scene-drop" d={{ id: sc.id }} onClick={() => editDel(() => E.edRemoveScene(pkg, sc.id), '"' + sc.name + '"')}>Take out</Btn></span></li>)}</ul>
        : <p class="empty">None yet. This world plays the game's own scenes until it has some.</p>}
    </Panel>
    <Panel cls="mb4" title="The game's scenes">
      <p class="muted">Open one to change it for this world, or to start a new scene from it.</p>
      <ul class="list">{SCENES.map(sc => <li key={sc.id}><span><b>{sc.name}</b> <span class="muted">{'·'} {use(sc)}</span></span>
        <Btn kind="sm" t="ed-scene-open" d={{ id: sc.id }} onClick={() => openIt(sc.id)}>Open</Btn></li>)}</ul>
    </Panel>
    <Panel cls="mb4" title="The game's stills">
      <p class="muted">One picture each, no keyframes: they go beside the moments you answer, a matter on the desk or a call from the gorilla position.</p>
      <ul class="list">{STILLS.map(sc => <li key={sc.id}><span><b>{sc.name}</b> <span class="muted">{'·'} {use(sc)}</span></span>
        <Btn kind="sm" t="ed-scene-open" d={{ id: sc.id }} onClick={() => openIt(sc.id)}>Open</Btn></li>)}</ul>
    </Panel>
  </>;
}
/** Keep a scene from the studio in the open world. */
export function keepScene(sc: Scene): boolean { let okd = false; edit(() => { okd = E.edSetScene(world(), sc); if (!okd) note('That scene could not be kept.', true); }); return okd; }
export function forgetScene(id: string) { edit(() => E.edRemoveScene(world(), id)); }
