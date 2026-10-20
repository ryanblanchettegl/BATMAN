/* The World Editor's Scenes tab: the scenes this world carries, made in Create a Scene (app/src/screens/scene). A
   scene with the same id as one of the game's takes its place in games of this world. Create a Scene opens full
   screen from here, and Done comes back. */
import { E } from '../../engine';
import { Btn, Panel, Sel, Opt } from '../../kit';
import { es, world, look, edit, editDel, note } from './state';
import { SCENES, STILLS, SHOW_SCENES, WHEN, STILL_WHEN, SHOW_WHEN, Scene, STUDIOS, Studio, studioOf, MOVES } from '../../kit/scene';

const use = (sc: Scene) => ((sc.still ? STILL_WHEN : WHEN.concat(SHOW_WHEN)).find(w => w[0] === sc.when) || ['', 'Only by hand'])[1];
export function ScenesTab() {
  const st = es(), pkg = world(), mine: Scene[] = E.edScenes(pkg);
  const openIt = (id: string, mode: Studio) => look(() => { st.scene = id; st.sceneMode = mode; });
  const game = SCENES.concat(STILLS, SHOW_SCENES, MOVES);
  /* three studios (Ryan, 20 October): Animation, Create a Move, Create a Scene; each opens new, or opens a scene of its kind from a dropdown */
  return <>
    <div class="edstudios">{STUDIOS.map(([mode, name, what]) => { const own = mine.filter(x => studioOf(x) === mode), theirs = game.filter(x => studioOf(x) === mode && !mine.some(m => m.id === x.id));
      return <Panel cls="mb4 edstudio" title={name} key={mode}>
        <p>{what}</p>
        <div class="row mt2"><Btn kind="go" t="ed-scene-new" d={{ v: mode }} onClick={() => openIt('__new', mode)}>{mode === 'still' ? 'New from a template' : mode === 'move' ? 'New move' : 'New animation'}</Btn></div>
        <div class="row mt2"><Sel t="ed-scene-pick" d={{ v: mode }} label={'Open one in ' + name} value="" options={[['', 'Open or change one...'] as Opt].concat(own.map(x => [x.id, 'This world: ' + x.name] as Opt))} groups={[{ label: 'The game\'s own (saving keeps a changed copy for this world)', options: theirs.map(x => [x.id, x.name + ' (' + use(x) + ')'] as Opt) }]} onChange={v => { if (v) openIt(v, mode); }} /></div>
        <p class="muted mt2">{own.length ? own.length + ' made for this world.' : 'None made for this world yet; it plays the game\'s own.'} {theirs.length} in the game.</p>
      </Panel>; })}</div>
    <Panel cls="mb4" title={'Made for this world (' + mine.length + ')'}>
      {mine.length ? <ul class="list">{mine.map(sc => <li key={sc.id}><span><b>{sc.name}</b> <span class="muted">{'·'} {(STUDIOS.find(x => x[0] === studioOf(sc)) || STUDIOS[0])[1]} {'·'} {use(sc)} {'·'} {sc.still ? 'a still' : sc.keys.length + ' keyframes'}{game.some(x => x.id === sc.id) ? ' · in place of the game\'s' : ''}</span></span>
        <span class="row opts"><Btn kind="sm" t="ed-scene-edit" d={{ id: sc.id }} onClick={() => openIt(sc.id, studioOf(sc))}>Edit</Btn>
          <Btn kind="danger" t="ed-scene-drop" d={{ id: sc.id }} onClick={() => editDel(() => E.edRemoveScene(pkg, sc.id), '"' + sc.name + '"')}>Take out</Btn></span></li>)}</ul>
        : <p class="empty">None yet. This world plays the game's own scenes until it has some.</p>}
    </Panel>
  </>;
}
/** Keep a scene from the studio in the open world. */
export function keepScene(sc: Scene): boolean { let okd = false; edit(() => { okd = E.edSetScene(world(), sc); if (!okd) note('That scene could not be kept.', true); }); return okd; }
export function forgetScene(id: string) { edit(() => E.edRemoveScene(world(), id)); }
