/* Create a Player (docs/plans/create-a-player.md): the wrestler full length on the left, drawn by the diorama engine
   in the outfit being changed, and the choices in windows on the right: the body, the head, the gear of each of the
   three outfits, its colours, lettering and shapes cut from card, and the finishing moves, which the wrestler acts
   out on a plain card dummy. It opens full screen from a wrestler's page in the World Editor and keeps the file on
   that wrestler in the world (E.edSetLook); Write a file gives the same record as a .wrestler.json to share. The
   screen only edits its own copy until Save (rule 1: the engine checks and keeps it). */
import { useRef, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, act, full, say as note } from '../../store';
import { Btn, TextBox, Desktop, Win, Group, Sel, Opt } from '../../kit';
import { ScenePlayer } from '../../kit/sceneplayer';
import { Scene, SCENES, POSES, WAIST, copy, scenesFor, allScenes, WHEN, PYRO, LIGHTS, dressEntrance } from '../../kit/scene';
import { Recipe, recipeOf, blank } from '../../kit/puppet';
import { SwatchOpts } from '../../kit/swatchopts';
import { Look, Attire, AttireKey, Layer, Finisher, ATTIRES, PARTS, SWATCHES, SLOTS, FONTS, SHAPES, ARCHETYPES, FACIAL, PAINT, PAINT_LAYERS, TATTOOS, HAIR_MIX, SCARS, MASK_DESIGNS, FACE_SLIDERS, FEATURES, CHEEKS, EYE_COLOURS, MOODS, KICKOUT, POSITIONS, CATEGORIES, FIN_SCENES, STAGES, threeMoves, randomLook, fromLook, blankLook, finScene, swatch } from '../../kit/caw';
import { derive, NAMES, FaceKey } from '../../lib/portrait';
import { PaperPortrait, PT_POSES, PT_FRAMES, companyCard } from '../../kit/paperportrait';
import { EXPR } from '../../kit/puppet';

type Tab = 'face' | 'ink' | 'portrait' | 'sign' | 'body' | 'head' | 'gear' | 'colour' | 'studio' | 'fin' | 'scenes' | 'file' | 'a_head' | 'a_upper' | 'a_lower' | 'a_feet';
/** Edit attire's camera: in close on the part of the body being dressed. */
const REGION_CAM: Record<string, { x: number; y: number; z: number }> = { a_head: { x: 0, y: 2.6, z: 3.8 }, a_upper: { x: 0, y: 1.1, z: 2.1 }, a_lower: { x: 0, y: -1.3, z: 2.1 }, a_feet: { x: 0, y: -2.5, z: 2.8 } };
const SET_OF: Record<AttireKey, string> = { primary_ring: 'ring', entrance_gear: 'ramp', street_clothes: 'hall' };
const CAM_OF: Record<AttireKey, { x: number; y: number; z: number }> = { primary_ring: { x: 0, y: 0.15, z: 1.4 }, entrance_gear: { x: 0, y: -0.3, z: 1.1 }, street_clothes: { x: 0, y: -0.5, z: 0.88 } };
const STY: Record<string, string> = { brawler: 'B', technician: 'T', high_flyer: 'H', powerhouse: 'P', showman: 'S', all_rounder: 'A', hardcore: 'B', submission: 'T' };
const VIEW_POSES: [string, string][] = [['stand', 'Standing'], ['fists', 'Fists up'], ['flex', 'Flexing'], ['armsup', 'Both arms up'], ['mic', 'On the microphone']];
const FACE_PARTS: [FaceKey, string][] = [['h', 'Face shape']];
const feet = (n: number) => Math.floor(n / 12) + "'" + (n % 12) + '"';
const r2 = (v: number) => Math.round(v * 100) / 100;

/** A wrestler from a world package, in the shape the paper doll is cut from. */
export function workerW(w: any) {
  return { id: 0, name: w.ring_name || w.id, g: w.gender === 'F' ? 'F' : 'M', align: w.disposition === 'heel' ? 'H' : 'F', twn: w.disposition === 'tweener', style: STY[w.style] || 'A',
    face: w.face, age: w.age || 28, gim: (w.gimmick_category || '') + ' ' + (w.gimmick || ''), uid: w.id, town: w.hometown, height: w.height, weight: w.weight };
}

/** What the suite is open on: a wrestler (from a world package through workerW, or from the game), the file they
    wear if any, and what Save and Take the file off do. With `sign`, it makes a new wrestler and signs them. */
export interface PlayerProps { world: string; w: any; had: Look | null; onSave: (look: Look) => { ok: boolean; msg: string }; onForget?: () => { ok: boolean; msg: string }; onDone: () => void; sign?: boolean;
  /** Edit attire: the outfits a part of the body at a time (head, upper body, lower body, feet), then lettering and colours. */
  attire?: boolean;
  /** The world's own scenes, besides the game's: its entrances are offered too. In the World Editor, onNewEntrance
      keeps the wrestler and opens Create a Scene to make them a custom entrance. */
  scenes?: Scene[]; onNewEntrance?: (look: Look) => void;
  /** In the World Editor: keep the wrestler and open Create a Move on a copy of their move number `fi`, with them in it. */
  onNewMove?: (look: Look, fi: number) => void;
  /** The card behind their portrait: their company's or brand's colour. */
  card?: string }   // sign: a new wrestler, made in a game, who goes to free agency
/** The choices for a new signing, as the old Create a wrestler window had them (E.createWrestler). */
interface Draft { g: string; style: string; bg: string; emph: string; align: string; gim: string }

export function CreatePlayer(pp: PlayerProps) {
  const [d, setD] = useState<Draft>({ g: 'M', style: 'A', bg: 'indie', emph: 'ring', align: 'F', gim: '' });
  const [seed] = useState(() => 'cw' + Date.now());
  const startW = pp.sign ? { id: -1, name: '', g: 'M', align: 'F', style: 'A', face: derive(seed, 'M', 25), age: 25 } : pp.w;
  const [lk, setLk] = useState<Look>(() => {
    const had = pp.had ? E.lookClean(pp.had) : null;
    if (had) { had.finishing_moves = threeMoves(startW, had.finishing_moves); return had; }   // one finisher and two signature moves, always
    const n = blankLook(startW, recipeOf({ ...startW, look: null })); n.appearance = { face: { ...derive(startW.name || seed, startW.g, startW.age || 25), ...(startW.face || {}) } };
    n.finishing_moves = threeMoves(startW);
    if (pp.sign) { n.name = ''; n.id = undefined; }
    return n;
  });
  const w0 = pp.sign ? { ...startW, name: lk.name || 'New wrestler', g: d.g, align: d.align, style: d.style } : pp.w, base = recipeOf({ ...w0, look: null });
  const [att, setAtt] = useState<AttireKey>('primary_ring'), [tab, setTab] = useState<Tab>(pp.sign ? 'sign' : pp.attire ? 'a_head' : 'body'), [pose, setPose] = useState('stand'), [back, setBack] = useState(false);
  const [lay, setLay] = useState(-1), [fi, setFi] = useState(-1), [acting, setActing] = useState(false), [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [text, setText] = useState('CHAMP'), [font, setFont] = useState('block'), [shp, setShp] = useState('star'), file = useRef<HTMLInputElement>(null);
  const say = (t: string, err = false) => setMsg({ t, err });
  const change = (fn: (n: Look) => void) => { const n = copy(lk); fn(n); setLk(n); setMsg(null); };
  const A = (n: Look): Attire => { n.attires = n.attires || {}; const a = n.attires[att] || (n.attires[att] = { equipped_assets: {}, palette_slots: {}, custom_layers: [] }); a.custom_layers = a.custom_layers || []; return a; };
  const cur = (lk.attires && lk.attires[att]) || { equipped_assets: {}, palette_slots: {}, custom_layers: [] } as Attire, layers = cur.custom_layers || [];
  const pa = lk.physical_attributes || {}, ps = pa.proportional_scalers || {}, face = (lk.appearance && lk.appearance.face) || {};
  const ap = lk.appearance || {}, setAp = (fn: (a: NonNullable<Look['appearance']>) => void) => change(n => { n.appearance = n.appearance || {}; fn(n.appearance); });
  const r: Recipe = fromLook(lk, recipeOf({ ...w0, face: { ...(w0.face || {}), ...face }, look: null }));
  const fins = lk.finishing_moves || [], fin: Finisher | null = fi >= 0 && fi < fins.length ? fins[fi] : null;

  // what the viewport shows: the wrestler in the outfit being changed, or acting out a finisher on a dummy
  let sc: Scene, cast: Record<string, Recipe> = { A: r }, play: string;
  const world = pp.scenes || [], [prev, setPrev] = useState<string | null>(null), prevSc = prev ? allScenes(world).find(x => x.id === prev) : null;
  if (acting && fin) {
    const src = allScenes(world).find(x => x.id === finScene(fin)) || SCENES[0];
    sc = { ...copy(src), attire: 'primary_ring', loop: true }; cast.B = { ...blank(1), name: 'The dummy' }; play = 'fin' + fi + JSON.stringify(lk) + sc.id;
  } else if (prevSc && tab === 'scenes') {   // the entrance they picked, with them in it
    sc = { ...dressEntrance(copy(prevSc), lk.entrance_fx), loop: true }; play = 'sc' + prevSc.id + JSON.stringify(lk);
  } else if (prevSc && prevSc.when === 'taunt' && tab === 'fin') {   // a taunt they picked, over the dummy
    sc = { ...copy(prevSc), attire: 'primary_ring', loop: true }; cast.B = { ...blank(1), name: 'The dummy' }; play = 'tn' + prevSc.id + JSON.stringify(lk);
  } else {
    const pd = (POSES.find(x => x[0] === pose) || POSES[0])[1];
    sc = { v: 1, id: 'caw', name: 'Create a Wrestler', when: 'any', set: SET_OF[att], attire: att, slots: [{ id: 'A', n: lk.name || w0.name, role: 'a' }],
      keys: [{ t: 0, figs: { A: { x: 0, y: pd.y ?? WAIST, r: pd.r || 0, f: 1, z: 0.6, p: { ...pd.p }, e: pd.e || '', b: back || undefined } }, props: pose === 'mic' ? [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] : [], cam: (pp.attire && REGION_CAM[tab]) || CAM_OF[att] }] };
    play = att + pose + (back ? 'back' : '') + (pp.attire ? tab : '') + JSON.stringify(lk);
  }

  const save = () => { if (pp.sign) { setTab('sign'); say('Press Create on Who they are to make them.'); return; } const r0 = pp.onSave(lk); say(r0.msg, !r0.ok); };
  // a new wrestler: who they are, what that makes them, and Create (they go to free agency)
  const info = pp.sign ? E.createInfo(G.S) : null, pv = pp.sign ? E.createPreview(G.S, { ...d, name: lk.name || '' }) : null;
  const setDraft = (k: keyof Draft, v: string) => { setD({ ...d, [k]: v }); setMsg(null);
    if (k === 'g') change(n => { (n.physical_attributes = n.physical_attributes || {}).sex = v as 'M' | 'F'; const a = (n.attires || {}).primary_ring; if (a) { if (v === 'F' && a.equipped_assets.upper_body === 'bare') a.equipped_assets.upper_body = 'top_sports'; if (v === 'M' && a.equipped_assets.upper_body === 'top_sports') a.equipped_assets.upper_body = 'bare'; } }); };
  const signIt = () => {
    let r0: any = null; const fm = (lk.finishing_moves || [])[0];
    act(() => { r0 = E.createWrestler(G.S, { ...d, name: lk.name || '', fin: fm ? fm.name : '', face: (lk.appearance || {}).face, look: lk }); });
    if (r0 && r0.ok) { pp.onDone(); note(r0.msg); } else say(r0 ? r0.msg : 'That did not work.', true);
  };
  const writeOut = () => {
    const b = new Blob([JSON.stringify(lk, null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = ((lk.name || w0.name).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'wrestler') + '.wrestler.json'; document.body.appendChild(a); a.click(); a.remove();
    say('Written out as ' + a.download + '. Anybody can open it in Create a Wrestler.');
  };
  const readIn = (f: File) => { f.text().then(t => { let x: any = null; try { x = JSON.parse(t); } catch (e) { x = null; } if (!x || !E.lookOk(x)) { say('That file is not a wrestler.', true); return; } setLk(E.lookClean(x)); setLay(-1); setFi(-1); say('Opened ' + (x.name || 'a wrestler') + '. Save to keep it on ' + w0.name + '.'); }); };

  const setScale = (k: string, v: number) => change(n => { n.physical_attributes = n.physical_attributes || {}; const s = n.physical_attributes.proportional_scalers = n.physical_attributes.proportional_scalers || {}; (s as any)[k] = r2(v); });
  const setFace = (k: string, v: number) => change(n => { n.appearance = n.appearance || {}; n.appearance.face = { ...(n.appearance.face || {}), [k]: v }; });
  const setLayer = (fn: (l: Layer) => void) => change(n => { const L = A(n).custom_layers!; if (L[lay]) fn(L[lay]); });
  const setFin = (fn: (f: Finisher) => void) => change(n => { const F = n.finishing_moves || []; if (F[fi]) fn(F[fi]); n.finishing_moves = F; });
  const chip = (id?: string) => { const s = swatch(id, { c: '#888' }); return <span class={'caw-chip' + (s.f && s.f !== 'matte' ? ' ' + s.f : '')} style={{ background: s.c }} aria-hidden="true" />; };

  // a part with its own colour, and extras to switch on: the Gear tab, and the regions of Edit attire
  const partRow = (slot: 'upper_body' | 'lower_body' | 'footwear') => <div class="sc-row"><span class="sc-slot">{slot === 'upper_body' ? 'Top' : slot === 'lower_body' ? 'Bottoms' : 'Footwear'}</span>
            <select aria-label={slot === 'upper_body' ? 'Top' : slot === 'lower_body' ? 'Bottoms' : 'Footwear'} data-t="caw-part" data-v={slot} value={cur.equipped_assets[slot] || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { A(n).equipped_assets[slot] = v; }); }}>
              {PARTS[slot].map(p => <option value={p[0]}>{p[1]}</option>)}</select>
            {chip((cur.part_colours || {})[slot] || undefined)}<select aria-label={'Colour of the ' + (slot === 'upper_body' ? 'top' : slot === 'lower_body' ? 'bottoms' : 'footwear')} data-t="caw-partcol" data-v={slot} value={(cur.part_colours || {})[slot] || ''}
              onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { const a2 = A(n), pc: any = a2.part_colours = a2.part_colours || {}; if (v) pc[slot] = v; else delete pc[slot]; if (!Object.keys(pc).length) delete a2.part_colours; }); }}>
              <option value="">The outfit's colours</option><SwatchOpts /></select></div>;
  const extras = (ids: string[]) => <div class="sc-row">{PARTS.accessories.filter(p => ids.indexOf(p[0]) >= 0).map(p => { const on = (cur.equipped_assets.accessories || []).indexOf(p[0]) >= 0; return <Btn kind="less" t="caw-acc" d={{ v: p[0] }} on={on} onClick={() => change(n => { const e = A(n).equipped_assets, l = e.accessories || []; e.accessories = on ? l.filter(x => x !== p[0]) : l.concat([p[0]]).slice(0, 8); })}>{p[1]}</Btn>; })}</div>;
  const hairRow = <div class="sc-row"><span class="sc-slot">Hair or mask</span><select aria-label="Hair" data-t="caw-hair" value={cur.equipped_assets.head || 'hair_face'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { ATTIRES.forEach(a => { const x = (n.attires = n.attires || {})[a[0]] || (n.attires[a[0]] = { equipped_assets: {}, palette_slots: {} }); x.equipped_assets.head = v; }); }); }}>
    {PARTS.head.map(p => <option value={p[0]}>{p[1]}</option>)}</select></div>;
  const AN = ATTIRES.find(a => a[0] === att)![1];
  const pt = lk.portrait || {}, card = pp.card || companyCard(null);
  const setPt = (o: any) => change(n => { const q: any = { ...(n.portrait || {}), ...o }; Object.keys(q).forEach(k => { if (q[k] === undefined || q[k] === '') delete q[k]; }); if (Object.keys(q).length) n.portrait = q; else delete n.portrait; });
  const titles: Record<Tab, string> = { face: 'Shape the face', ink: 'Paint and ink', portrait: 'Their portrait', a_head: 'Head: ' + AN, a_upper: 'Upper body: ' + AN, a_lower: 'Lower body: ' + AN, a_feet: 'Feet: ' + AN, sign: 'A new wrestler', body: 'The body', head: 'The head', gear: 'Gear: ' + ATTIRES.find(a => a[0] === att)![1], colour: 'Colours: ' + ATTIRES.find(a => a[0] === att)![1], studio: 'Gear studio: lettering and shapes', fin: 'Their moves', scenes: 'Their entrance', file: 'The file' };
  return <div class="scfull paper" data-t="caw">
    <div class="pmenu sc-menubar" role="group" aria-label={pp.sign ? 'Create a Wrestler' : pp.attire ? 'Edit attire' : 'Edit wrestler'}>
      <b class="pm-app">{pp.sign ? 'Create a Wrestler' : pp.attire ? 'Edit attire' : 'Edit wrestler'}</b><span class="pm-world">{pp.world}</span><span class="sp" />
      <Btn kind="sm" t="caw-random" onClick={() => { change(n => { Object.assign(n, randomLook(n, Math.random)); }); say('A new look, at random. Press it again for another, or change anything.'); }}>Surprise me</Btn>
      <Btn kind="go" t="caw-save" onClick={save}>Save</Btn>
      <Btn kind="sm" t="caw-done" onClick={pp.onDone}>Done</Btn>
    </div>
    <div class={'pnote sc-hint' + (msg ? (msg.err ? ' bad' : ' good') : '')} role="status" data-t="caw-msg">{msg ? msg.t : 'Change anything on the right; the wrestler on the left changes with it.'}</div>
    <Desktop cls="scpage cawpage">
      <Win title={(lk.name || w0.name) + (lk.moniker ? ', ' + lk.moniker : '')} right={acting && fin ? fin.name : ATTIRES.find(a => a[0] === att)![2]} area="stage" t="caw-win">
        <div class="sc-keys" role="group" aria-label="Outfit">
          <span class="sc-lbl">Outfit</span>
          <Sel t="caw-attire" label="Outfit" value={att} options={ATTIRES.map(a => [a[0], a[1]] as Opt)} onChange={v => { setAtt(v as any); setActing(false); setLay(-1); }} />
          <span class="sp" /><Btn kind="less" t="caw-back" on={back} onClick={() => { setBack(!back); setActing(false); }}>{back ? 'Their front' : 'Their back'}</Btn>
        </div>
        <div class="caw-stagerow"><div class="sc-stage caw-stage"><ScenePlayer key="caw" sc={sc} cast={cast} play={play} still={!(acting && fin) && !(prevSc && (tab === 'scenes' || tab === 'fin'))} orbit fill={!(acting && fin) && !(prevSc && (tab === 'scenes' || tab === 'fin'))} t="caw-view" label={(lk.name || w0.name) + ' in ' + ATTIRES.find(a => a[0] === att)![1].toLowerCase() + '. Drag to walk round them.'} /></div>
          <div class="caw-ptcol"><button type="button" class={'caw-ptbtn' + (tab === 'portrait' ? ' on' : '')} data-t="caw-portrait" aria-label="Their portrait: press to change it" title="Their portrait: press to change it" onClick={() => setTab('portrait')}><PaperPortrait r={r} ps={pt} card={card} label={'Portrait of ' + (lk.name || w0.name)} /><span class="caw-ptlbl">Portrait</span></button></div></div>
        <div class="sc-keys" role="group" aria-label="Pose">
          <span class="sc-lbl">Pose</span>
          <Sel t="caw-pose" label="Pose" value={acting ? '' : pose} options={(acting ? [['', 'Doing their move'] as Opt] : []).concat(VIEW_POSES.map(p => [p[0], p[1]] as Opt))} onChange={v => { if (v) { setPose(v as any); setActing(false); } }} />
          <span class="sp" />
        </div>
      </Win>
      <Win title={titles[tab]} right={tab === 'gear' || tab === 'colour' || tab === 'studio' ? ATTIRES.find(a => a[0] === att)![1] : ''} area="side" t="caw-side">
        {(() => { const its: { id: string; label: string; t?: string }[] = pp.attire ? [{ id: 'a_head', label: 'Head', t: 'caw-tab' }, { id: 'a_upper', label: 'Upper body', t: 'caw-tab' }, { id: 'a_lower', label: 'Lower body', t: 'caw-tab' }, { id: 'a_feet', label: 'Feet', t: 'caw-tab' }, { id: 'studio', label: 'Lettering', t: 'caw-tab' }, { id: 'colour', label: 'Colours', t: 'caw-tab' }] : [...(pp.sign ? [{ id: 'sign', label: 'Who they are', t: 'caw-tab' }] : []), { id: 'body', label: 'Body', t: 'caw-tab' }, { id: 'head', label: 'Head', t: 'caw-tab' }, { id: 'face', label: 'Face shape', t: 'caw-tab' }, { id: 'ink', label: 'Paint and ink', t: 'caw-tab' }, { id: 'gear', label: 'Gear', t: 'caw-tab' },
          { id: 'colour', label: 'Colours', t: 'caw-tab' }, { id: 'studio', label: 'Lettering', t: 'caw-tab' }, { id: 'fin', label: 'Moves', t: 'caw-tab' }, { id: 'scenes', label: 'Entrance', t: 'caw-tab' }, { id: 'file', label: 'File', t: 'caw-tab' }]; return <div class="sc-row sc-section"><span class="sc-lbl">Change</span><Sel t="caw-tab" label="What to change" value={tab} options={its.map(x => [x.id, x.label] as Opt)} onChange={v => setTab(v as Tab)} /></div>; })()}
        {tab === 'sign' && info && pv && <>
          <div class="sc-row"><span class="sc-slot">Ring name</span><TextBox value={lk.name || ''} max={28} label="Ring name" t="caw-name" width="18ch" onInput={v => change(n => { n.name = v; })} /></div>
          {([['g', 'Division', [['M', 'Men'], ['F', 'Women']]], ['align', 'Side', [['F', 'Face'], ['H', 'Heel']]], ['style', 'Style', Object.keys(E.STYLE_NAME).map(k => [k, E.STYLE_NAME[k]])],
            ['bg', 'Background', Object.keys(info.bgs).map(k => [k, info.bgs[k].n])], ['emph', 'Strongest suit', Object.keys(info.emph).map(k => [k, info.emph[k]])],
            ['gim', 'Gimmick', [['', 'Whatever suits them']].concat(E.GIMS.map((g: any) => [g.id, g.n]))]] as [keyof Draft, string, string[][]][]).map(([k, n, opts]) =>
            <div class="sc-row"><span class="sc-slot">{n}</span><select aria-label={n} data-t="caw-draft" data-v={k} value={d[k]} onChange={e => setDraft(k, (e.currentTarget as HTMLSelectElement).value)}>{opts.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>)}
          <p class="muted">{(info.bgs[d.bg] || info.bgs.indie).d}</p>
          <Group title="Summary">
            <p>Overness <b>{pv.ovr}</b>{' · '}Work rate about <b>{pv.work}</b>{' · '}Charisma <b>{pv.mic}</b>{' · '}Potential <b>{pv.pot}</b></p>
            <p data-t="caw-cost">They will ask for about {full(pv.wage)} a week.</p>
          </Group>
          <div class="sc-row"><Btn kind="go" t="caw-create" onClick={signIt}>Create</Btn><span class="muted">They join the free agents, with their look, outfits and finisher. Sign them from Free agents like anybody else.</span></div>
        </>}
        {tab === 'face' && <>
          <Group title="Face shape">
            {FACE_SLIDERS.map(([k, n, lo, hi]) => { const v = ((lk.appearance && lk.appearance.shape) || {})[k] || 0; return <div class="sc-row caw-fsl"><span class="caw-lbl">{n}</span><small>{lo}</small>
              <input type="range" min={-100} max={100} step={5} value={Math.round(v * 100)} aria-label={n + ': from ' + lo + ' to ' + hi} data-t="caw-fsl" data-v={k} onInput={e => { const x = +(e.currentTarget as HTMLInputElement).value / 100; change(n2 => { n2.appearance = n2.appearance || {}; const shp: any = n2.appearance.shape = { ...(n2.appearance.shape || {}) }; if (x) shp[k] = x; else delete shp[k]; if (!Object.keys(shp).length) delete n2.appearance.shape; }); }} /><small>{hi}</small></div>; })}
            <div class="sc-row"><Btn kind="less" t="caw-fslreset" disabled={!(lk.appearance && lk.appearance.shape)} onClick={() => change(n2 => { if (n2.appearance) delete n2.appearance.shape; })}>Back to the face shape</Btn></div>
          </Group>
        </>}
        {tab === 'ink' && <>
          <Group title="Paint and ink">
            <div class="sc-row"><span class="sc-slot">Face paint</span><select aria-label="Face paint" data-t="caw-paint" value={(lk.appearance && lk.appearance.face_paint) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { n.appearance = n.appearance || {}; if (v) n.appearance.face_paint = v; else delete n.appearance.face_paint; }); }}>
              {PAINT.map(f => <option value={f[0]}>{f[1]}</option>)}</select>
              {lk.appearance && lk.appearance.face_paint && <select aria-label="Paint colour" data-t="caw-paintcol" value={lk.appearance.paint_colour || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { n.appearance = n.appearance || {}; if (v) n.appearance.paint_colour = v; else delete n.appearance.paint_colour; }); }}>
                <option value="">{lk.appearance.face_paint === 'skull' ? 'White' : 'Red'}</option><SwatchOpts /></select>}</div>
            {(ap.paint_layers || []).map((l, i) => <div class="sc-row" key={'pl' + i}><span class="sc-slot">{'Layer ' + (i + 1)}</span>
              <select aria-label={'Paint layer ' + (i + 1)} data-t="caw-paintly" data-v={i} value={l.k} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { a.paint_layers![i].k = v; }); }}>{PAINT_LAYERS.map(f => <option value={f[0]}>{f[1]}</option>)}</select>
              <select aria-label={'Colour of layer ' + (i + 1)} data-t="caw-paintlycol" data-v={i} value={l.c || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { if (v) a.paint_layers![i].c = v; else delete a.paint_layers![i].c; }); }}><option value="">Black</option><SwatchOpts /></select>
              <Btn kind="sm" t="caw-paintlyup" d={{ v: i }} disabled={i >= (ap.paint_layers || []).length - 1} label={'Paint layer ' + (i + 1) + ' over the next'} onClick={() => setAp(a => { const L = a.paint_layers!, x = L[i]; L[i] = L[i + 1]; L[i + 1] = x; })}>Over</Btn>
              <Btn kind="less" t="caw-paintlydel" d={{ v: i }} onClick={() => setAp(a => { a.paint_layers!.splice(i, 1); if (!a.paint_layers!.length) delete a.paint_layers; })}>Wipe off</Btn></div>)}
            {(ap.paint_layers || []).length < 3 && <div class="sc-row"><span class="sc-slot"></span><Btn kind="less" t="caw-paintlyadd" onClick={() => setAp(a => { a.paint_layers = (a.paint_layers || []).concat([{ k: 'eyes' }]); })}>Paint a layer over it</Btn></div>}
            <div class="sc-row"><span class="sc-slot">Tattoos</span>{TATTOOS.map(t => { const on = ((lk.appearance && lk.appearance.tattoos) || []).indexOf(t[0]) >= 0; return <Btn kind="less" t="caw-tat" d={{ v: t[0] }} on={on} onClick={() => change(n => { n.appearance = n.appearance || {}; const l = n.appearance.tattoos || []; n.appearance.tattoos = on ? l.filter(x => x !== t[0]) : l.concat([t[0]]); if (!n.appearance.tattoos.length) delete n.appearance.tattoos; })}>{t[1]}</Btn>; })}</div>
          </Group>
          <Group title="Scars and marks">
            <div class="sc-row"><span class="sc-slot">Scars</span>{SCARS.map(t => { const on = (ap.scars || []).indexOf(t[0]) >= 0; return <Btn kind="less" t="caw-scar" d={{ v: t[0] }} on={on} onClick={() => setAp(a => { const l = a.scars || []; a.scars = on ? l.filter(x => x !== t[0]) : l.concat([t[0]]); if (!a.scars.length) delete a.scars; })}>{t[1]}</Btn>; })}</div>
            <div class="sc-row"><span class="sc-slot">Freckles</span><Btn kind="less" t="caw-freckles" on={!!ap.freckles} onClick={() => setAp(a => { if (a.freckles) delete a.freckles; else a.freckles = true; })}>{ap.freckles ? 'Freckles' : 'None'}</Btn>
              <span class="sc-slot">Body hair</span><Sel t="caw-bodyhair" label="Body hair" value={String(ap.body_hair || 0)} options={[['0', 'None'], ['1', 'The chest'], ['2', 'Chest and belly']]} onChange={v => setAp(a => { const i = +v; if (i) a.body_hair = i; else delete a.body_hair; })} /></div>
            <p class="muted">Scars and body hair show only where skin does.</p>
          </Group>
        </>}
        {tab === 'body' && <>
          <Group title="Sex">
            <div class="sc-row"><Sel t="caw-sex" label="Sex" value={pa.sex || (w0.g === 'F' ? 'F' : 'M')} options={[['M', 'Men'], ['F', 'Women']]} onChange={gv => { const g = gv as 'M' | 'F';  change(n2 => { const p2 = n2.physical_attributes = n2.physical_attributes || {}; p2.sex = g; const a = (n2.attires || {}).primary_ring; if (a) { if (g === 'F' && a.equipped_assets.upper_body === 'bare') a.equipped_assets.upper_body = 'top_sports'; if (g === 'M' && a.equipped_assets.upper_body === 'top_sports') a.equipped_assets.upper_body = 'bare'; } }); if (pp.sign) setD({ ...d, g }); }} />
              <span class="muted">{pp.sign || pp.onNewEntrance ? 'Their division follows.' : 'In a running game this changes how they look; their division stays.'}</span></div>
          </Group>
          <Group title="Body type">
            <div class="sc-row"><Sel t="caw-arch" label="Body type" value={pa.body_archetype || ''} options={(pa.body_archetype ? [] : [['', 'Pick a body type'] as Opt]).concat(ARCHETYPES.map(a => [a[0], a[1]] as Opt))} onChange={v => { const a = ARCHETYPES.find(x => x[0] === v); if (a) change(n => { n.archetype = a[0]; n.physical_attributes = { sex: (n.physical_attributes || {}).sex, height_inches: a[2].h, weight_lbs: a[2].w, body_archetype: a[0], proportional_scalers: { torso_width: a[2].s[0], torso_height: a[2].s[1], limb_length: a[2].s[2], muscle_mass: a[2].s[3] } }; }); }} /></div>
          </Group>
          <Group title="Height and weight">
            <div class="sc-row"><span class="sc-slot">Height</span>
              <Btn kind="less" t="caw-height" d={{ v: '-' }} disabled={(pa.height_inches || 74) <= 60} onClick={() => change(n => { const p = n.physical_attributes = n.physical_attributes || {}; p.height_inches = Math.max(60, (p.height_inches || 74) - 1); })}>-</Btn>
              <b data-t="caw-heightv">{feet(pa.height_inches || 74)}</b>
              <Btn kind="less" t="caw-height" d={{ v: '+' }} disabled={(pa.height_inches || 74) >= 90} onClick={() => change(n => { const p = n.physical_attributes = n.physical_attributes || {}; p.height_inches = Math.min(90, (p.height_inches || 74) + 1); })}>+</Btn></div>
            <div class="sc-row"><span class="sc-slot">Weight</span>
              <Btn kind="less" t="caw-weight" d={{ v: '-' }} disabled={(pa.weight_lbs || 240) <= 120} onClick={() => change(n => { const p = n.physical_attributes = n.physical_attributes || {}; p.weight_lbs = Math.max(120, (p.weight_lbs || 240) - 10); })}>-</Btn>
              <b data-t="caw-weightv">{(pa.weight_lbs || 240) + ' lb'}</b>
              <Btn kind="less" t="caw-weight" d={{ v: '+' }} disabled={(pa.weight_lbs || 240) >= 500} onClick={() => change(n => { const p = n.physical_attributes = n.physical_attributes || {}; p.weight_lbs = Math.min(500, (p.weight_lbs || 240) + 10); })}>+</Btn></div>
          </Group>
          <Group title="Proportions">
            {([['torso_width', 'Chest and shoulders', 0.7, 1.5], ['torso_height', 'Length of the body', 0.85, 1.2], ['limb_length', 'Length of arms and legs', 0.85, 1.2], ['muscle_mass', 'Muscle', 0.6, 1.6]] as [string, string, number, number][]).map(([k, n, lo, hi]) =>
              <div class="sc-row"><span class="caw-lbl">{n}</span><input type="range" min={lo} max={hi} step={0.01} value={(ps as any)[k] || 1} aria-label={n} data-t="caw-scale" data-v={k} onInput={e => setScale(k, +(e.currentTarget as HTMLInputElement).value)} /><b>{Math.round(((ps as any)[k] || 1) * 100) + '%'}</b></div>)}
          </Group>
        </>}
        {tab === 'head' && <>
          <Group title="Hair or mask">
            <div class="sc-row"><select aria-label="Hair" data-t="caw-hair" value={cur.equipped_assets.head || 'hair_face'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { ATTIRES.forEach(a => { const x = (n.attires = n.attires || {})[a[0]] || (n.attires[a[0]] = { equipped_assets: {}, palette_slots: {} }); x.equipped_assets.head = v; }); }); }}>
              {PARTS.head.map(p => <option value={p[0]}>{p[1]}</option>)}</select>
              <span class="muted">Worn with every outfit; a mask takes the main colour and the trim of each.</span></div>
            <div class="sc-row"><span class="sc-slot">Hair colour</span><select aria-label="Hair colour" data-t="caw-haircol" value={(lk.appearance && lk.appearance.hair_colour) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { n.appearance = n.appearance || {}; if (v) n.appearance.hair_colour = v; else delete n.appearance.hair_colour; }); }}>
              <option value="">From the face</option><SwatchOpts hair /></select></div>
            {!/^mask/.test(cur.equipped_assets.head || '') ? <div class="sc-row"><span class="sc-slot">Second colour</span><select aria-label="A second hair colour" data-t="caw-hairmix" value={ap.hair_mix || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { if (v) { a.hair_mix = v; a.hair_colour2 = a.hair_colour2 || 'swatch_yellow_paper'; } else { delete a.hair_mix; delete a.hair_colour2; } }); }}>
              {HAIR_MIX.map(m => <option value={m[0]}>{m[1]}</option>)}</select>
              {ap.hair_mix ? <select aria-label="Second hair colour" data-t="caw-haircol2" value={ap.hair_colour2 || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { a.hair_colour2 = v; }); }}><SwatchOpts hair /></select> : null}</div>
            : <div class="sc-row"><span class="sc-slot">Mask design</span><select aria-label="Mask design" data-t="caw-maskdesign" value={ap.mask_design || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { if (v) a.mask_design = v; else delete a.mask_design; }); }}>
              <option value="">{cur.equipped_assets.head === 'mask_hood_01' ? 'Plain' : 'Flames round the eyes'}</option>{MASK_DESIGNS.filter(m => m[0] !== 'flames').map(m => <option value={m[0]}>{m[1]}</option>)}</select>
              <span class="muted">Cut in the trim colour.</span></div>}
            <div class="sc-row"><span class="sc-slot">Facial hair</span><select aria-label="Facial hair" data-t="caw-facial" value={(lk.appearance && lk.appearance.facial_hair) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { n.appearance = n.appearance || {}; if (v) n.appearance.facial_hair = v; else delete n.appearance.facial_hair; }); }}>
              {FACIAL.map(f => <option value={f[0]}>{f[1]}</option>)}</select></div>
          </Group>
          <Group title="Face">
            {FACE_PARTS.map(([k, n]) => { const v = face[k] ?? 0; return <div class="sc-row"><span class="sc-slot">{n}</span>
              <Btn kind="less" t="caw-face" d={{ k, v: -1 }} label={'Previous ' + n} onClick={() => setFace(k, (v + 9) % 10)}>{'<'}</Btn><b>{NAMES[k][v]}</b>
              <Btn kind="less" t="caw-face" d={{ k, v: 1 }} label={'Next ' + n} onClick={() => setFace(k, (v + 1) % 10)}>{'>'}</Btn></div>; })}
            {(['eyes', 'nose', 'mouth'] as const).map(k => <div class="sc-row"><span class="sc-slot">{k === 'eyes' ? 'Eyes' : k === 'nose' ? 'Nose' : 'Mouth'}</span>
              <select aria-label={k} data-t="caw-feat" data-v={k} value={((lk.appearance && lk.appearance.features) || {})[k] || FEATURES[k][0][0]} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n2 => { n2.appearance = n2.appearance || {}; const f: any = n2.appearance.features = { ...(n2.appearance.features || {}) }; if (v === FEATURES[k][0][0]) delete f[k]; else f[k] = v; if (!Object.keys(f).length) delete n2.appearance.features; }); }}>
                {FEATURES[k].map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>)}
            <div class="sc-row"><span class="sc-slot">Eye colour</span><select aria-label="Eye colour" data-t="caw-eyecol" value={ap.eye_colour || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { if (v) a.eye_colour = v; else delete a.eye_colour; }); }}>
              {EYE_COLOURS.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>
            <div class="sc-row"><span class="sc-slot">Cheeks</span><select aria-label="Cheeks" data-t="caw-cheeks" value={ap.cheeks || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { if (v) a.cheeks = v; else delete a.cheeks; }); }}>
              {CHEEKS.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>
            <div class="sc-row"><span class="sc-slot">Face at rest</span><select aria-label="Face at rest" data-t="caw-mood" value={ap.mood || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setAp(a => { if (v) a.mood = v; else delete a.mood; }); }}>
              {MOODS.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>
            <div class="sc-row"><span class="sc-slot">Hair shine</span><Btn kind="less" t="caw-shine" on={ap.hair_shine !== false} onClick={() => setAp(a => { if (a.hair_shine === false) delete a.hair_shine; else a.hair_shine = false; })}>{ap.hair_shine !== false ? 'Shine' : 'Matte'}</Btn></div>
            <div class="sc-row"><span class="caw-lbl">Skin tone</span><input type="range" min={0} max={100} value={face.sk ?? 50} aria-label="Skin tone" data-t="caw-skin" onInput={e => setFace('sk', +(e.currentTarget as HTMLInputElement).value)} /></div>
          </Group>
        </>}
        {tab === 'portrait' && <>
          <div class="sc-row"><span class="sc-slot">Outfit</span><Sel t="caw-ptatt" label="Outfit" value={pt.attire || 'primary_ring'} options={ATTIRES.map(a => [a[0], a[1]] as Opt)} onChange={v => setPt({ attire: v })} /></div>
          <Group title="Face"><div class="sc-row"><Sel t="caw-ptexpr" label="Their face" value={pt.expr || 'calm'} options={EXPR.map(x => [x[0] || 'calm', x[1]] as Opt)} onChange={v => setPt({ expr: v === 'calm' ? '' : v })} /></div></Group>
          <div class="sc-row"><span class="sc-slot">Pose</span><select aria-label="Pose" data-t="caw-ptpose" value={pt.pose || 'stand'} onChange={e => setPt({ pose: (e.currentTarget as HTMLSelectElement).value })}>{PT_POSES.map(x => <option value={x[0]}>{x[1]}</option>)}</select>
            <select aria-label="Framing" data-t="caw-ptframe" value={pt.frame || 'head'} onChange={e => setPt({ frame: (e.currentTarget as HTMLSelectElement).value as 'head' | 'chest' })}>{PT_FRAMES.map(x => <option value={x[0]}>{x[1]}</option>)}</select></div>

          <p class="muted">This is the picture the game shows of them: on the roster, in lists, on cards and in their file. The card behind them is their company's colour, or their brand's.</p>
        </>}
        {tab === 'a_head' && <>{hairRow}<Group title="On the head">{extras(['hat_cowboy', 'hat_cap', 'hat_beanie', 'bandana', 'headband', 'antennae', 'crown', 'sunglasses_aviator', 'sunglasses_round', 'glasses_plain', 'headset', 'hat_campaign'])}</Group><p class="muted">Hair is worn with every outfit; a mask takes this outfit's main colour and trim.</p></>}
        {tab === 'a_upper' && <>{partRow('upper_body')}<Group title="Arms and chest">{extras(['wrist_tape_white', 'wrist_wraps', 'elbow_pads', 'gloves_fingerless', 'armband', 'chain_gold', 'pearls', 'scarf', 'feather_boa', 'guitar', 'bat', 'collar_spiked', 'whistle', 'trombone', 'sword', 'sledgehammer', 'arm_tassels', 'snake', 'shoulder_pads_spiked', 'kendo_stick'])}</Group></>}
        {tab === 'a_lower' && <>{partRow('lower_body')}<Group title="Knees">{extras(['knee_pads', 'knee_sleeves', 'fishnets'])}</Group></>}
        {tab === 'a_feet' && <>{partRow('footwear')}<p class="muted">Boots come up the shin; kick pads leave the foot bare.</p></>}
        {tab === 'gear' && <>
          {(['upper_body', 'lower_body', 'footwear'] as const).map(partRow)}
          <Group title="Extras">{extras(PARTS.accessories.map(p => p[0]))}</Group>
          <p class="muted">Each outfit is worn where it belongs: ring gear in the ring, entrance gear on the ramp, street clothes backstage and in promos.</p>
        </>}
        {tab === 'colour' && <>
          {SLOTS.map(([k, n]) => <div class="sc-row"><span class="sc-slot">{n}</span>{chip((cur.palette_slots as any)[k])}
            <select aria-label={n} data-t="caw-swatch" data-v={k} value={(cur.palette_slots as any)[k] || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n2 => { (A(n2).palette_slots as any)[k] = v; }); }}>
              <option value="">Their own colour</option><SwatchOpts /></select></div>)}
          <p class="muted">Main colour: trunks, tights, jeans and ring tops. Second colour: shirts and jackets worn over, boots, pads and gloves. Trim: stripes, edges, laces and soles. Buckles and metal: zips, buckles, chains and glasses. Foil shines, neon glows, corrugated board has ridges.</p>
          <div class="sc-row">{ATTIRES.filter(a => a[0] !== att).map(a => <Btn kind="sm" t="caw-copycol" d={{ v: a[0] }} onClick={() => change(n => { const from = (n.attires || {})[a[0]]; if (from) A(n).palette_slots = { ...from.palette_slots }; })}>{'Colours from ' + a[1].toLowerCase()}</Btn>)}</div>
        </>}
        {tab === 'studio' && <>
          <Group title="Outfit pieces">
            <div class="sc-row"><TextBox value={text} max={20} label="Lettering" t="caw-text" width="12ch" onInput={v => setText(v.toUpperCase())} />
              <select aria-label="Lettering style" data-t="caw-font" value={font} onChange={e => setFont((e.currentTarget as HTMLSelectElement).value)}>{FONTS.map(f => <option value={f[0]}>{f[1]}</option>)}</select>
              <Btn t="caw-addtext" disabled={!text.trim() || layers.length >= 16} onClick={() => { change(n => { A(n).custom_layers!.push({ type: 'text_decal', string: text.trim(), font, placement: { x: 0, y: -2, z: layers.length }, palette_slot: 'trim' }); }); setLay(layers.length); }}>Add lettering</Btn></div>
            <div class="sc-row"><select aria-label="Shape" data-t="caw-shape" value={shp} onChange={e => setShp((e.currentTarget as HTMLSelectElement).value)}>{SHAPES.map(s => <option value={s[0]}>{s[1]}</option>)}</select>
              <Btn t="caw-addshape" disabled={layers.length >= 16} onClick={() => { change(n => { A(n).custom_layers!.push({ type: 'shape_combiner', shape_id: shp, placement: { x: 0, y: shp === 'tactical_vest_straps' ? -3 : 0, z: layers.length }, palette_slot: 'secondary', scale: shp === 'tactical_vest_straps' || shp === 'bandolier' ? 1 : 0.5 }); }); setLay(layers.length); }}>Add shape</Btn></div>
          </Group>
          <Group title={'On this outfit, back to front (' + layers.length + ')'}>
            <div class="sc-row">{layers.length ? <Sel t="caw-layer" label="Which piece" value={String(lay)} options={[['-1', 'Pick a piece...'] as Opt].concat(layers.map((l, i) => [String(i), l.type === 'text_decal' ? '"' + l.string + '"' : (SHAPES.find(s => s[0] === l.shape_id) || ['', l.shape_id])[1]] as Opt))} onChange={v => setLay(+v)} /> : <span class="muted">Nothing yet. Lettering and shapes are cut from card and stuck on the chest or down the leg.</span>}</div>
            {layers[lay] && <>
              <div class="sc-row" role="group" aria-label="Order">
                <Btn kind="sm" t="caw-lorder" d={{ v: 'f' }} disabled={lay >= layers.length - 1} onClick={() => { const j = lay + 1; change(n => { const L = A(n).custom_layers!, a = L[lay], b = L[j], z = a.placement.z || 0; a.placement.z = b.placement.z || 0; b.placement.z = z; L[lay] = b; L[j] = a; }); setLay(j); }}>Bring forward</Btn>
                <Btn kind="sm" t="caw-lorder" d={{ v: 'b' }} disabled={lay <= 0} onClick={() => { const j = lay - 1; change(n => { const L = A(n).custom_layers!, a = L[lay], b = L[j], z = a.placement.z || 0; a.placement.z = b.placement.z || 0; b.placement.z = z; L[lay] = b; L[j] = a; }); setLay(j); }}>Send back</Btn>
              </div>
              <div class="sc-row" role="group" aria-label="Move">
                <Btn kind="less" t="caw-lmove" d={{ v: 'l' }} onClick={() => setLayer(l => { l.placement.x = Math.max(-20, l.placement.x - 1); })}>Left</Btn><Btn kind="less" t="caw-lmove" d={{ v: 'r' }} onClick={() => setLayer(l => { l.placement.x = Math.min(20, l.placement.x + 1); })}>Right</Btn>
                <Btn kind="less" t="caw-lmove" d={{ v: 'u' }} onClick={() => setLayer(l => { l.placement.y = Math.min(20, l.placement.y + 1); })}>Up</Btn><Btn kind="less" t="caw-lmove" d={{ v: 'd' }} onClick={() => setLayer(l => { l.placement.y = Math.max(-20, l.placement.y - 1); })}>Down</Btn>
                <Btn kind="less" t="caw-lsize" d={{ v: '+' }} onClick={() => setLayer(l => { l.scale = Math.min(4, r2((l.scale || 1) + 0.1)); })}>Bigger</Btn><Btn kind="less" t="caw-lsize" d={{ v: '-' }} onClick={() => setLayer(l => { l.scale = Math.max(0.2, r2((l.scale || 1) - 0.1)); })}>Smaller</Btn>
                <Btn kind="less" t="caw-lturn" d={{ v: 15 }} onClick={() => setLayer(l => { l.rot = Math.max(-180, Math.min(180, (l.rot || 0) + 15)); })}>Turn</Btn>
                {layers[lay].type === 'text_decal' && <><Btn kind="less" t="caw-larch" d={{ v: '+' }} onClick={() => setLayer(l => { l.arch = Math.min(1, r2((l.arch || 0) + 0.25)); })}>Arch up</Btn><Btn kind="less" t="caw-larch" d={{ v: '-' }} onClick={() => setLayer(l => { l.arch = Math.max(-1, r2((l.arch || 0) - 0.25)); })}>Arch down</Btn></>}
              </div>
              <div class="sc-row">
                <select aria-label="Colour" data-t="caw-lcol" value={layers[lay].palette_slot || 'trim'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setLayer(l => { l.palette_slot = v; }); }}>
                  {SLOTS.map(s => <option value={s[0]}>{'The outfit: ' + s[1].toLowerCase()}</option>)}<SwatchOpts /></select>
                <select aria-label="Where it goes" data-t="caw-lon" value={layers[lay].on || 'upper_body'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setLayer(l => { if (v === 'lower_body' || v === 'back') l.on = v; else delete l.on; }); setBack(v === 'back'); }}>
                  <option value="upper_body">On the chest</option><option value="lower_body">Down the leg</option><option value="back">Across the back</option></select>
                <Btn kind="danger" t="caw-ldrop" onClick={() => { change(n => { A(n).custom_layers!.splice(lay, 1); }); setLay(-1); }}>Remove</Btn>
              </div>
            </>}
          </Group>
        </>}
        {tab === 'fin' && <>
          <div class="sc-row"><Sel t="caw-fin" label="Which move" value={String(fi)} options={fins.map((f, i) => [String(i), (i ? 'Signature: ' : 'Finisher: ') + f.name] as Opt)} onChange={v => { setFi(+v); setActing(false); }} /></div>
          {fin ? <>
            <div class="sc-row"><TextBox value={fin.name} max={32} label="Name of the move" t="caw-finname" width="18ch" onInput={v => setFin(f => { f.name = v; })} /></div>
            <div class="sc-row"><span class="caw-lbl">Impact</span><input type="range" min={1} max={100} value={fin.impact_damage || 50} aria-label="Impact" data-t="caw-findmg" onInput={e => { const v = +(e.currentTarget as HTMLInputElement).value; setFin(f => { f.impact_damage = v; }); }} /><b>{fin.impact_damage || 50}</b></div>
            {([['kickout_difficulty', 'Kick out', KICKOUT], ['position', 'From', POSITIONS], ['category', 'How it wins', CATEGORIES], ['preview_pose_id', 'In the picture', FIN_SCENES.concat(world.filter(x => x.when === 'move').map(x => [x.id, 'This world: ' + x.name] as [string, string]))]] as [keyof Finisher, string, [string, string][]][]).map(([k, n, opts]) =>
              <div class="sc-row"><span class="sc-slot">{n}</span><select aria-label={n} data-t="caw-finopt" data-v={k} value={(k === 'preview_pose_id' ? finScene(fin) : (fin[k] as string)) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setFin(f => { (f as any)[k] = v; }); }}>{opts.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>)}
            {fi > 0 ? <div class="sc-row"><span class="sc-slot">When</span><select aria-label="When in a match" data-t="caw-finstage" value={fin.stage || 'mid'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setFin(f => { if (v === 'mid') delete f.stage; else f.stage = v; }); }}>{STAGES.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div> : null}
            <div class="sc-row"><Btn kind="go" t="caw-act" onClick={() => setActing(!acting)}>{acting ? 'Stop' : 'Act it out on the dummy'}</Btn>
              {pp.onNewMove ? <Btn kind="sm" t="caw-newmove" tip="Saves them, and opens Create a Move on this move with them in it" onClick={() => pp.onNewMove!(lk, fi)}>Make a custom move</Btn> : null}
</div>
            <p class="muted">One finisher and two signature moves, each played when it says. The more protected a finisher, the rarer and bigger a kick-out.</p>
          </> : <p class="empty">Pick a move to change it.</p>}
          <Group title={'Taunts (' + (lk.taunts || []).length + ' of 3)'}>
            <div class="sc-row">{scenesFor('taunt', world).map(o => { const on = (lk.taunts || []).indexOf(o.id) >= 0; return <Btn kind="less" t="caw-taunt" d={{ v: o.id }} on={on} disabled={!on && (lk.taunts || []).length >= 3} onClick={() => { change(n => { const l = n.taunts || []; n.taunts = on ? l.filter(x => x !== o.id) : l.concat([o.id]); if (!n.taunts.length) delete n.taunts; }); setActing(false); setPrev(on ? null : o.id); }}>{o.name}</Btn>; })}</div>
            {prevSc && prevSc.when === 'taunt' ? <div class="sc-row"><Btn kind="sm" t="caw-tauntstop" onClick={() => setPrev(null)}>Stop</Btn><span class="muted">{prevSc.name}</span></div> : <p class="muted">Pick up to three. When they are on top in a match, the broadcast now and then shows one instead of a move.</p>}
          </Group>
        </>}
        {tab === 'scenes' && <>
          <div class="sc-row" role="group" aria-label="Entrances">
            <Sel t="caw-ent" label="Their entrance" value={lk.entrance || ''} options={[['', 'Whatever the show picks'] as Opt].concat(scenesFor('entrance', world).map(o => [o.id, o.name] as Opt))} onChange={v => { if (v) { change(n => { n.entrance = v; }); setPrev(v); } else { change(n => { delete n.entrance; }); setPrev(null); } }} />
          </div>
          <Group title="Pyro, lights, music">
            <div class="sc-row"><span class="sc-slot">Pyro</span><select aria-label="Pyro" data-t="caw-pyro" value={(lk.entrance_fx || {}).pyro || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { const f = n.entrance_fx = n.entrance_fx || {}; if (v) f.pyro = v; else delete f.pyro; if (!Object.keys(f).length) delete n.entrance_fx; }); setPrev(lk.entrance || 'entrance'); }}>{PYRO.map(o => <option value={o[0]}>{o[1]}</option>)}</select>
              <span class="sc-slot">Lights</span><select aria-label="Lights" data-t="caw-lights" value={(lk.entrance_fx || {}).lights || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { const f = n.entrance_fx = n.entrance_fx || {}; if (v) f.lights = v; else delete f.lights; if (!Object.keys(f).length) delete n.entrance_fx; }); setPrev(lk.entrance || 'entrance'); }}>{LIGHTS.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>
            <div class="sc-row"><span class="sc-slot">Music</span><TextBox value={(lk.entrance_fx || {}).music || ''} max={32} label="The name of their music" t="caw-music" width="20ch" onInput={v => change(n => { const f = n.entrance_fx = n.entrance_fx || {}; if (v) f.music = v; else delete f.music; if (!Object.keys(f).length) delete n.entrance_fx; })} /><span class="muted">The announcers name it as they come out.</span></div>
          </Group>
          {pp.onNewEntrance && <div class="sc-row"><Btn kind="go" t="caw-newent" onClick={() => pp.onNewEntrance!(lk)}>Make a custom entrance</Btn><span class="muted">Saves them, and opens Create a Scene with them in it.</span></div>}
          {prevSc && <div class="sc-row"><Btn kind="sm" t="caw-entstop" onClick={() => setPrev(null)}>Stop</Btn><span class="muted">{prevSc.name}, in their entrance gear</span></div>}
          <p class="muted">Pick an entrance, or make a custom one in the World Editor. Entrances are worn in entrance gear. Their own pictures are their moves: each finisher and signature move picks the picture it plays as, on the Moves tab.</p>
        </>}
        {tab === 'file' && <>
          <Group title="Identity">
            <div class="sc-row"><span class="sc-slot">Name</span><TextBox value={lk.name || ''} max={32} label="Ring name" t="caw-name" width="18ch" onInput={v => change(n => { n.name = v; })} /></div>
            <div class="sc-row"><span class="sc-slot">Nickname</span><TextBox value={lk.moniker || ''} max={40} label="Nickname" t="caw-moniker" width="18ch" onInput={v => change(n => { n.moniker = v; })} /></div>
            <div class="sc-row"><span class="sc-slot">Hometown</span><TextBox value={lk.hometown || ''} max={40} label="Home town" t="caw-town" width="18ch" onInput={v => change(n => { n.hometown = v; })} /></div>
          </Group>
          <Group title="Files">
            <div class="sc-row"><Btn t="caw-save2" onClick={save}>{pp.sign ? 'Create them first' : 'Save'}</Btn><Btn kind="sm" t="caw-export" onClick={writeOut}>Write a file</Btn><Btn kind="sm" t="caw-import" onClick={() => file.current && file.current.click()}>Open a file</Btn>
              <input ref={file} type="file" accept=".json,application/json" hidden data-t="caw-file" onChange={e => { const f = (e.currentTarget as HTMLInputElement).files; if (f && f[0]) readIn(f[0]); (e.currentTarget as HTMLInputElement).value = ''; }} /></div>
            <div class="sc-row"><Btn kind="less" t="caw-reset" onClick={() => { const n = blankLook(w0, base); n.appearance = { face: { ...derive(w0.name, w0.g, w0.age), ...(w0.face || {}) } }; setLk(n); setLay(-1); setFi(-1); say('Back to how the game drew them. Save to keep it.'); }}>Start again</Btn>
              {pp.had && pp.onForget && <Btn kind="danger" t="caw-forget" onClick={() => { const r0 = pp.onForget!(); if (r0) say(r0.msg, !r0.ok); }}>Take the file off them</Btn>}</div>
          </Group>
          <p class="muted">A wrestler is one small file: the body, three outfits, lettering and shapes, and the finishing moves. No pictures, so it shares in a moment.</p>
        </>}
      </Win>
    </Desktop>
  </div>;
}
