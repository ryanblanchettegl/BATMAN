/* World Editor: Stories, the promos and angles a booker puts on the card (TASKS.md 0u, rule 9c). The world's own are
   made here from nothing; the game's own can be changed for this world (name, description, character labels, scene,
   report line) and put back. The engine keeps and plays both (src/93-segworld.js). Choices are dropdowns (rule 5d). */
import { E } from '../../engine';
import { Btn, Panel, Sel, Field, Opt } from '../../kit';
import { es, world, edit, look, note } from './state';
import { PickList, TwoPane } from './parts';
import { SHOW_SCENES, Scene } from '../../kit/scene';
import { ScenePlayer } from '../../kit/sceneplayer';

const opts = (L: any[]): Opt[] => L.map(x => [String(x[0]), x[1]] as Opt);
const LETTER = ['A', 'B', 'C'];
export function StoriesTab() {
  const st = es(), pkg = world(), L: any[] = E.edSegKinds(pkg), mine = L.filter(x => !x.over), over: Record<string, any> = {};
  L.filter(x => x.over).forEach(x => { over[x.id] = x; });
  const games = Object.keys(E.SEGK0).filter(id => id !== 'writers'), selId: string | null = st.sel.stories || null;
  const k = L.find(x => x.id === selId) || null, base = selId && E.SEGK0[selId] && !k ? E.SEGK0[selId] : null;
  const add = (t: string) => edit(() => { const n = E.edNewSegKind(pkg, t); if (n) { st.sel.stories = n.id; note('A new ' + (t === 'angle' ? 'angle' : 'promo') + ' for this world. Name it, pick its scene and what it does.'); } });
  const list = <>
    <div class="row mb2"><Btn kind="go" t="ed-story-new" d={{ v: 'promo' }} onClick={() => add('promo')}>New promo</Btn><Btn t="ed-story-new" d={{ v: 'angle' }} onClick={() => add('angle')}>New angle</Btn></div>
    <p class="eyebrow">Made for this world</p>
    <PickList t="ed-pick" sel={selId} onPick={id => { st.sel.stories = id; }} empty="None yet."
      items={mine.map(x => ({ id: x.id, label: x.n, sub: (x.t === 'angle' ? 'Angle' : 'Promo') + ' · ' + x.roles.length + (x.roles.length > 1 ? ' characters' : ' character') }))} />
    <p class="eyebrow mt2">The game's own</p>
    <PickList t="ed-pick" sel={selId} onPick={id => { st.sel.stories = id; }} empty=""
      items={games.map(id => ({ id, label: over[id] ? over[id].n : E.SEGK0[id].n, sub: (E.SEGK0[id].t === 'angle' ? 'Angle' : 'Promo') + (over[id] ? ' · changed for this world' : '') }))} />
  </>;
  if (!k && !base) return <TwoPane open={false} list={list} onBack={() => { }}><p class="empty">Pick one on the left, or make a new one.</p></TwoPane>;
  const back = () => look(() => { st.sel.stories = null; });
  if (base) {   // one of the game's own, as it ships: read it, and change it for this world
    return <TwoPane open list={list} onBack={back}>
      <Panel cls="mb4" title={base.n}>
        <p>{base.d}</p>
        <div class="kv mt1"><div><small>Type</small><span>{base.t === 'angle' ? 'Angle' : 'Promo'}</span></div><div><small>Participants</small><span>{base.roles.length}</span></div>
          {base.roles.map((r: string, i: number) => <div key={i}><small>{'Character ' + LETTER[i]}</small><span>{r}</span></div>)}</div>
        <div class="row mt2"><Btn kind="go" t="ed-story-over" onClick={() => edit(() => { E.edOverSegKind(pkg, selId); note(base.n + ' can now be changed for this world. What it does stays the game\'s own.'); })}>Change it for this world</Btn></div>
      </Panel>
    </TwoPane>;
  }
  const upd = (ch: any) => edit(() => { E.edSetSegKind(pkg, { ...k, ...ch }); });
  const scenes: Scene[] = E.edScenes(pkg), sc = scenes.concat(SHOW_SCENES).find(x => x.id === k.scene) || (k.over ? SHOW_SCENES.find(x => x.when === 'seg_' + k.id) : null) || null;
  const two = k.roles.length > 1, role = (i: number) => <Field label={'Character ' + LETTER[i]}><input type="text" value={k.roles[i]} maxLength={24} data-t="ed-story-role" data-v={String(i)} onInput={e => { const r = k.roles.slice(); r[i] = (e.currentTarget as HTMLInputElement).value; upd({ roles: r }); }} /></Field>;
  return <TwoPane open list={list} onBack={back}>
    <Panel cls="mb4" title={k.n}>
      <div class="editor plain">
        <Field label="Name"><input type="text" value={k.n} maxLength={28} data-t="ed-story-name" onInput={e => upd({ n: (e.currentTarget as HTMLInputElement).value })} /></Field>
        {k.over ? <Field label="Type"><span class="edro">{k.t === 'angle' ? 'Angle' : 'Promo'}</span></Field>
          : <Field label="Type"><Sel t="ed-story-t" value={k.t} options={[['promo', 'Promo: words on the microphone'], ['angle', 'Angle: something happens']]} onChange={v => upd({ t: v })} /></Field>}
        {k.over ? <Field label="Participants"><span class="edro">{k.roles.length}</span></Field>
          : <Field label="Participants"><Sel t="ed-story-n" value={String(k.roles.length)} options={[['1', '1: Character A'], ['2', '2: Characters A and B']]} onChange={v => upd({ roles: v === '2' ? [k.roles[0], k.roles[1] || 'Character B'] : [k.roles[0]] })} /></Field>}
        {k.roles.map((_: string, i: number) => role(i))}
        <Field label="Description"><input type="text" value={k.d} maxLength={160} placeholder="What the booker reads: one line on what it is for" data-t="ed-story-d" onInput={e => upd({ d: (e.currentTarget as HTMLInputElement).value })} /></Field>
        <Field label="Report line"><input type="text" value={k.line} maxLength={160} placeholder={'{a} is Character A' + (two ? ', {b} Character B' : '')} data-t="ed-story-line" onInput={e => upd({ line: (e.currentTarget as HTMLInputElement).value })} /></Field>
      </div>
    </Panel>
    <Panel cls="mb4" title="Effects">
      {k.over ? <p class="muted">What it does is the game's own: {E.SEGK0[k.id].d}</p> : <div class="editor plain">
        {two ? <Field label="Feud effect"><Sel t="ed-story-fx" value={k.fx} options={opts(E.SEGFX)} onChange={v => upd({ fx: v })} /></Field> : null}
        {two && k.fx !== 'none' ? <Field label="Heat"><Sel t="ed-story-heat" value={String(k.heat)} options={opts(E.SEGHEAT)} onChange={v => upd({ heat: +v })} /></Field> : null}
        {two ? <Field label="Relationship after"><Sel t="ed-story-bond" value={String(k.bond)} options={opts(E.SEGBOND)} onChange={v => upd({ bond: +v })} /></Field> : null}
        <Field label="Character A after"><Sel t="ed-story-lift" value={k.lift ? '1' : ''} options={[['', 'No change'], ['1', 'A lift when it goes well']]} onChange={v => upd({ lift: v ? 1 : 0 })} /></Field>
      </div>}
    </Panel>
    <Panel cls="mb4" title="Preview">
      <div class="row"><Field label="Scene"><Sel t="ed-story-scene" value={k.scene} options={[['', k.over ? 'The game\'s own scene for it' : 'The game picks one for a ' + k.t] as Opt]}
        groups={[{ label: 'Made for this world', options: scenes.filter(x => !x.still).map(x => [x.id, x.name] as Opt) }, { label: 'The game\'s scenes of the show', options: SHOW_SCENES.filter(x => !x.still).map(x => [x.id, x.name] as Opt) }]}
        onChange={v => upd({ scene: v })} /></Field></div>
      {sc ? <div class="edstory-pic"><ScenePlayer key={sc.id} sc={sc} cast={{}} play={sc.id} t="ed-story-pic" label={'Preview: ' + sc.name} /></div> : <p class="muted mt1">Pick a scene, or make one in the Scenes tab (Animation) and pick it here.</p>}
    </Panel>
    <div class="row mb4">{k.over
      ? <Btn kind="danger" t="ed-story-drop" onClick={() => edit(() => { E.edRemoveSegKind(pkg, k.id); note(E.SEGK0[k.id].n + ' is the game\'s own again.'); })}>Put back the game's own</Btn>
      : <Btn kind="danger" t="ed-story-drop" onClick={() => edit(() => { E.edRemoveSegKind(pkg, k.id); st.sel.stories = null; note('"' + k.n + '" is no longer in this world.'); })}>Take it out</Btn>}</div>
  </TwoPane>;
}
