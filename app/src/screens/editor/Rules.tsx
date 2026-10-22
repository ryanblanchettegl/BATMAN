/* World Editor: Match rules. The world's own rules are built on an included one (they fight like it) with their own
   name, set, note and commentary; the included ones can be changed for this world and put back. The engine keeps and
   plays both (src/93-stipworld.js). Choices are dropdowns (rule 5d), labels are nouns (rule 5e). */
import { E } from '../../engine';
import { Btn, Panel, Sel, Field, Opt } from '../../kit';
import { es, world, edit, look, note } from './state';
import { TwoPane, ScrollMenu } from './parts';
import { useState } from 'preact/hooks';
import { ImportThings } from './importer';
import { SCENES, Scene } from '../../kit/scene';
import { ScenePlayer } from '../../kit/sceneplayer';

const setName = (v: string) => ((E.STIP_SETS as [string, string][]).find(x => x[0] === (v || '')) || ['', 'The ring'])[1];
/** The lock-up, played in the rule's set, so the booker sees where the match will be fought. */
function preview(set: string): Scene | null {
  const sc = SCENES.find(x => x.id === 'lockup'); if (!sc) return null;
  return { ...sc, id: 'rule-' + (set || 'ring'), name: setName(set), set: set || 'ring' };
}
export function RulesTab() {
  const [imp, setImp] = useState(false);
  const st = es(), pkg = world(), L: any[] = E.edStips(pkg), mine = L.filter(x => !x.over), over: Record<string, any> = {};
  L.filter(x => x.over).forEach(x => { over[x.id] = x; });
  const inc = Object.keys(E.STIP0).filter(id => id !== 'std'), selId: string | null = st.sel.rules || null;
  const k = L.find(x => x.id === selId) || null, base = selId && E.STIP0[selId] && !k ? E.STIP0[selId] : null;
  const add = () => edit(() => { const n = E.edNewStip(pkg, 'cage'); if (n) { st.sel.rules = n.id; note('A new match rule for this world. Name it, pick its base and its set.'); } });
  const list = <>
    <div class="row mb2"><Btn kind="go" t="ed-rule-new" onClick={add}>New match rule</Btn><Btn kind="sm" t="ed-imp-open" d={{ v: 'stips' }} onClick={() => setImp(true)}>Import</Btn></div>
    {imp ? <ImportThings kind="stips" onClose={() => setImp(false)} /> : null}
    <ScrollMenu t="ed-pick" label="Match rules" tall onPick={id => look(() => { st.sel.rules = id; })} items={
      mine.map(x => ({ id: x.id, label: x.n, on: x.id === selId, mine: true, sub: 'This world · like ' + E.STIP0[x.base].n.toLowerCase() }))
        .concat(inc.map(id => ({ id, label: over[id] ? over[id].n : E.STIP0[id].n, on: id === selId, mine: !!over[id], sub: (over[id] ? 'Changed for this world · ' : '') + setName(over[id] ? over[id].set : E.STIP0[id].set) })))} />
  </>;
  if (!k && !base) return <TwoPane open={false} list={list} onBack={() => { }}><p class="empty">Pick one on the left, or make a new one.</p></TwoPane>;
  const back = () => look(() => { st.sel.rules = null; });
  if (base) {   // an included one, as it ships: read it, and change it for this world
    const sc = preview(base.set || '');
    return <TwoPane open list={list} onBack={back}>
      <Panel cls="mb4" title={base.n}>
        <p>{E.stipNote0(selId)}</p>
        <div class="kv mt1"><div><small>Set</small><span>{setName(base.set)}</span></div></div>
        <div class="row mt2"><Btn kind="go" t="ed-rule-over" onClick={() => edit(() => { E.edOverStip(pkg, selId); note(base.n + ' can now be changed for this world. How it fights stays as included.'); })}>Change it for this world</Btn></div>
      </Panel>
      {sc ? <Panel cls="mb4" title="Preview"><div class="edstory-pic"><ScenePlayer key={sc.id} sc={sc} cast={{}} play={sc.id} t="ed-rule-pic" label={'Preview: ' + sc.name} /></div></Panel> : null}
    </TwoPane>;
  }
  const upd = (ch: any) => edit(() => { E.edSetStip(pkg, { ...k, ...ch }); });
  const from = k.over ? k.id : k.base, B = E.STIP0[from], lines0: string[] = E.stipLines0(from), sc = preview(k.set);
  const line = (i: number) => <Field key={i} label={'Commentary ' + (i + 1)}><input type="text" value={k.lines[i] || ''} maxLength={120} placeholder={lines0[i] || 'Something the commentators say during it'} data-t="ed-rule-line" data-v={String(i)}
    onInput={e => { const v = (e.currentTarget as HTMLInputElement).value, ls = [0, 1, 2].map(j => j === i ? v : (k.lines[j] || '')); upd({ lines: ls.filter(x => x.trim()) }); }} /></Field>;
  return <TwoPane open list={list} onBack={back}>
    <Panel cls="mb4" title={k.n}>
      <div class="editor plain">
        <Field label="Name"><input type="text" value={k.n} maxLength={24} data-t="ed-rule-name" onInput={e => upd({ n: (e.currentTarget as HTMLInputElement).value })} /></Field>
        {k.over ? <Field label="Base"><span class="edro">{B.n}</span></Field>
          : <Field label="Base"><Sel t="ed-rule-base" value={k.base} options={(E.STIP_BASES as string[]).map(b => [b, E.STIP0[b].n + (b === 'std' ? ': a straight match' : '')] as Opt)} onChange={v => upd({ base: v })} /></Field>}
        <Field label="Set"><Sel t="ed-rule-set" value={k.set || ''} options={E.STIP_SETS as Opt[]} onChange={v => upd({ set: v })} /></Field>
        <Field label="Description"><input type="text" value={k.d} maxLength={160} placeholder={E.stipNote0(from) || 'What the booker reads on the card'} data-t="ed-rule-d" onInput={e => upd({ d: (e.currentTarget as HTMLInputElement).value })} /></Field>
        {[0, 1, 2].map(line)}
      </div>
    </Panel>
    <Panel cls="mb4" title="Effects">
      <p class="muted">{k.over ? 'How it fights stays as included.' : 'It fights like ' + B.n.toLowerCase() + ': the same styles do well in it, it wears and hurts the same, and a feud needs the same heat for it.'} {E.stipNote0(from)}</p>
    </Panel>
    <Panel cls="mb4" title="Preview">
      {sc ? <div class="edstory-pic"><ScenePlayer key={sc.id} sc={sc} cast={{}} play={sc.id} t="ed-rule-pic" label={'Preview: ' + sc.name} /></div> : null}
    </Panel>
    <div class="row mb4">{k.over
      ? <Btn kind="danger" t="ed-rule-drop" onClick={() => edit(() => { E.edRemoveStip(pkg, k.id); note(E.STIP0[k.id].n + ' is back as included.'); })}>Put back as included</Btn>
      : <Btn kind="danger" t="ed-rule-drop" onClick={() => edit(() => { E.edRemoveStip(pkg, k.id); st.sel.rules = null; note('"' + k.n + '" is no longer in this world.'); })}>Take it out</Btn>}</div>
  </TwoPane>;
}
