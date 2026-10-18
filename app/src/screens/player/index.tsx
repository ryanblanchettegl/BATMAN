/* Create a Player (docs/plans/create-a-player.md): the wrestler full length on the left, drawn by the diorama engine
   in the outfit being changed, and the choices in windows on the right: the body, the head, the gear of each of the
   three outfits, its colours, lettering and shapes cut from card, and the finishing moves, which the wrestler acts
   out on a plain card dummy. It opens full screen from a wrestler's page in the World Editor and keeps the file on
   that wrestler in the world (E.edSetLook); Write a file gives the same record as a .wrestler.json to share. The
   screen only edits its own copy until Save (rule 1: the engine checks and keeps it). */
import { useRef, useState } from 'preact/hooks';
import { E } from '../../engine';
import { G, act, full, say as note } from '../../store';
import { Btn, TextBox, Desktop, Win, Group, Tabs } from '../../kit';
import { ScenePlayer } from '../../kit/sceneplayer';
import { Scene, SCENES, POSES, WAIST, copy } from '../../kit/scene';
import { Recipe, recipeOf, blank } from '../../kit/puppet';
import { Look, Attire, AttireKey, Layer, Finisher, ATTIRES, PARTS, SWATCHES, SLOTS, FONTS, SHAPES, ARCHETYPES, FACIAL, KICKOUT, POSITIONS, CATEGORIES, FIN_SCENES, fromLook, blankLook, finScene, swatch } from '../../kit/caw';
import { derive, NAMES, FaceKey } from '../../lib/portrait';

type Tab = 'sign' | 'body' | 'head' | 'gear' | 'colour' | 'studio' | 'fin' | 'file';
const SET_OF: Record<AttireKey, string> = { primary_ring: 'ring', entrance_gear: 'ramp', street_clothes: 'hall' };
const CAM_OF: Record<AttireKey, { x: number; y: number; z: number }> = { primary_ring: { x: 0, y: 0.15, z: 1.4 }, entrance_gear: { x: 0, y: -0.3, z: 1.1 }, street_clothes: { x: 0, y: -0.5, z: 0.88 } };
const STY: Record<string, string> = { brawler: 'B', technician: 'T', high_flyer: 'H', powerhouse: 'P', showman: 'S', all_rounder: 'A', hardcore: 'B', submission: 'T' };
const VIEW_POSES: [string, string][] = [['stand', 'Standing'], ['fists', 'Fists up'], ['flex', 'Flexing'], ['armsup', 'Both arms up'], ['mic', 'On the microphone']];
const FACE_PARTS: [FaceKey, string][] = [['h', 'Face shape'], ['ey', 'Eyes'], ['ns', 'Nose']];
const feet = (n: number) => Math.floor(n / 12) + "'" + (n % 12) + '"';
const r2 = (v: number) => Math.round(v * 100) / 100;

/** A wrestler from a world package, in the shape the paper doll is cut from. */
export function workerW(w: any) {
  return { id: 0, name: w.ring_name || w.id, g: w.gender === 'F' ? 'F' : 'M', align: w.disposition === 'heel' ? 'H' : 'F', twn: w.disposition === 'tweener', style: STY[w.style] || 'A',
    face: w.face, age: w.age || 28, gim: (w.gimmick_category || '') + ' ' + (w.gimmick || ''), uid: w.id, town: w.hometown, height: w.height, weight: w.weight };
}

/** What the suite is open on: a wrestler (from a world package through workerW, or from the game), the file they
    wear if any, and what Save and Take the file off do. With `sign`, it makes a new wrestler and signs them. */
export interface PlayerProps { world: string; w: any; had: Look | null; onSave: (look: Look) => { ok: boolean; msg: string }; onForget?: () => { ok: boolean; msg: string }; onDone: () => void; sign?: boolean }   // sign: a new wrestler, made in a game, who goes to free agency
/** The choices for a new signing, as the old Create a wrestler window had them (E.createWrestler). */
interface Draft { g: string; style: string; bg: string; emph: string; align: string; gim: string }

export function CreatePlayer(pp: PlayerProps) {
  const [d, setD] = useState<Draft>({ g: 'M', style: 'A', bg: 'indie', emph: 'ring', align: 'F', gim: '' });
  const [seed] = useState(() => 'cw' + Date.now());
  const startW = pp.sign ? { id: -1, name: '', g: 'M', align: 'F', style: 'A', face: derive(seed, 'M', 25), age: 25 } : pp.w;
  const [lk, setLk] = useState<Look>(() => {
    const had = pp.had ? E.lookClean(pp.had) : null;
    if (had) return had;
    const n = blankLook(startW, recipeOf({ ...startW, look: null })); n.appearance = { face: { ...derive(startW.name || seed, startW.g, startW.age || 25), ...(startW.face || {}) } };
    if (pp.sign) { n.name = ''; n.id = undefined; }
    return n;
  });
  const w0 = pp.sign ? { ...startW, name: lk.name || 'New wrestler', g: d.g, align: d.align, style: d.style } : pp.w, base = recipeOf({ ...w0, look: null });
  const [att, setAtt] = useState<AttireKey>('primary_ring'), [tab, setTab] = useState<Tab>(pp.sign ? 'sign' : 'body'), [pose, setPose] = useState('stand');
  const [lay, setLay] = useState(-1), [fi, setFi] = useState(-1), [acting, setActing] = useState(false), [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null);
  const [text, setText] = useState('CHAMP'), [font, setFont] = useState('block'), [shp, setShp] = useState('star'), file = useRef<HTMLInputElement>(null);
  const say = (t: string, err = false) => setMsg({ t, err });
  const change = (fn: (n: Look) => void) => { const n = copy(lk); fn(n); setLk(n); setMsg(null); };
  const A = (n: Look): Attire => { n.attires = n.attires || {}; const a = n.attires[att] || (n.attires[att] = { equipped_assets: {}, palette_slots: {}, custom_layers: [] }); a.custom_layers = a.custom_layers || []; return a; };
  const cur = (lk.attires && lk.attires[att]) || { equipped_assets: {}, palette_slots: {}, custom_layers: [] } as Attire, layers = cur.custom_layers || [];
  const pa = lk.physical_attributes || {}, ps = pa.proportional_scalers || {}, face = (lk.appearance && lk.appearance.face) || {};
  const r: Recipe = fromLook(lk, recipeOf({ ...w0, face: { ...(w0.face || {}), ...face }, look: null }));
  const fins = lk.finishing_moves || [], fin: Finisher | null = fi >= 0 && fi < fins.length ? fins[fi] : null;

  // what the viewport shows: the wrestler in the outfit being changed, or acting out a finisher on a dummy
  let sc: Scene, cast: Record<string, Recipe> = { A: r }, play: string;
  if (acting && fin) {
    const src = SCENES.find(x => x.id === finScene(fin)) || SCENES[0];
    sc = { ...copy(src), attire: 'primary_ring', loop: true }; cast.B = { ...blank(1), name: 'The dummy' }; play = 'fin' + fi + JSON.stringify(lk) + sc.id;
  } else {
    const pd = (POSES.find(x => x[0] === pose) || POSES[0])[1];
    sc = { v: 1, id: 'caw', name: 'Create a Player', when: 'any', set: SET_OF[att], attire: att, slots: [{ id: 'A', n: lk.name || w0.name, role: 'a' }],
      keys: [{ t: 0, figs: { A: { x: 0, y: pd.y ?? WAIST, r: pd.r || 0, f: 1, z: 0.6, p: { ...pd.p }, e: pd.e || '' } }, props: pose === 'mic' ? [{ id: 'mic', k: 'mic', x: 0.1, y: 0.1, r: -30, z: 1.2, at: 'A:hand_n' }] : [], cam: CAM_OF[att] }] };
    play = att + pose + JSON.stringify(lk);
  }

  const save = () => { if (pp.sign) { setTab('sign'); say('Press Create on Who they are to make them.'); return; } const r0 = pp.onSave(lk); say(r0.msg, !r0.ok); };
  // a new wrestler: who they are, what that makes them, and Create (they go to free agency)
  const info = pp.sign ? E.createInfo(G.S) : null, pv = pp.sign ? E.createPreview(G.S, { ...d, name: lk.name || '' }) : null;
  const setDraft = (k: keyof Draft, v: string) => { setD({ ...d, [k]: v }); setMsg(null);
    if (k === 'g') change(n => { const a = (n.attires || {}).primary_ring; if (a) { if (v === 'F' && a.equipped_assets.upper_body === 'bare') a.equipped_assets.upper_body = 'top_sports'; if (v === 'M' && a.equipped_assets.upper_body === 'top_sports') a.equipped_assets.upper_body = 'bare'; } }); };
  const signIt = () => {
    let r0: any = null; const fm = (lk.finishing_moves || [])[0];
    act(() => { r0 = E.createWrestler(G.S, { ...d, name: lk.name || '', fin: fm ? fm.name : '', face: (lk.appearance || {}).face, look: lk }); });
    if (r0 && r0.ok) { pp.onDone(); note(r0.msg); } else say(r0 ? r0.msg : 'That did not work.', true);
  };
  const writeOut = () => {
    const b = new Blob([JSON.stringify(lk, null, 2)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = ((lk.name || w0.name).replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'wrestler') + '.wrestler.json'; document.body.appendChild(a); a.click(); a.remove();
    say('Written out as ' + a.download + '. Anybody can open it in Create a Player.');
  };
  const readIn = (f: File) => { f.text().then(t => { let x: any = null; try { x = JSON.parse(t); } catch (e) { x = null; } if (!x || !E.lookOk(x)) { say('That file is not a wrestler.', true); return; } setLk(E.lookClean(x)); setLay(-1); setFi(-1); say('Opened ' + (x.name || 'a wrestler') + '. Save to keep it on ' + w0.name + '.'); }); };

  const setScale = (k: string, v: number) => change(n => { n.physical_attributes = n.physical_attributes || {}; const s = n.physical_attributes.proportional_scalers = n.physical_attributes.proportional_scalers || {}; (s as any)[k] = r2(v); });
  const setFace = (k: string, v: number) => change(n => { n.appearance = n.appearance || {}; n.appearance.face = { ...(n.appearance.face || {}), [k]: v }; });
  const setLayer = (fn: (l: Layer) => void) => change(n => { const L = A(n).custom_layers!; if (L[lay]) fn(L[lay]); });
  const setFin = (fn: (f: Finisher) => void) => change(n => { const F = n.finishing_moves || []; if (F[fi]) fn(F[fi]); n.finishing_moves = F; });
  const chip = (id?: string) => { const s = swatch(id, { c: '#888' }); return <span class={'caw-chip' + (s.f && s.f !== 'matte' ? ' ' + s.f : '')} style={{ background: s.c }} aria-hidden="true" />; };

  const titles: Record<Tab, string> = { sign: 'A new wrestler', body: 'The body', head: 'The head', gear: 'Gear: ' + ATTIRES.find(a => a[0] === att)![1], colour: 'Colours: ' + ATTIRES.find(a => a[0] === att)![1], studio: 'Gear studio: lettering and shapes', fin: 'Finishing moves', file: 'The file' };
  return <div class="scfull paper" data-t="caw">
    <div class="sc-menubar" role="group" aria-label={pp.sign ? 'Create a Player' : 'Edit wrestler'}>
      <span class="sc-belt" aria-hidden="true" /><b class="on">{pp.sign ? 'Create a Player' : 'Edit wrestler'}</b><span>{pp.world}</span><span class="sp" />
      <span class={'sc-hint' + (msg ? (msg.err ? ' bad' : ' good') : '')} role="status" data-t="caw-msg">{msg ? msg.t : 'Change anything on the right; the wrestler on the left changes with it'}</span>
      <Btn kind="go" t="caw-save" onClick={save}>Save</Btn>
      <Btn kind="sm" t="caw-done" onClick={pp.onDone}>Done</Btn>
    </div>
    <Desktop cls="scpage cawpage">
      <Win title={(lk.name || w0.name) + (lk.moniker ? ', ' + lk.moniker : '')} right={acting && fin ? fin.name : ATTIRES.find(a => a[0] === att)![2]} area="stage" t="caw-win">
        <div class="sc-keys" role="group" aria-label="Outfit">
          <span class="sc-lbl">Outfit</span>
          {ATTIRES.map(a => <Btn kind="sm" t="caw-attire" d={{ v: a[0] }} on={att === a[0]} onClick={() => { setAtt(a[0]); setActing(false); setLay(-1); }}>{a[1]}</Btn>)}
        </div>
        <div class="sc-stage caw-stage"><ScenePlayer key="caw" sc={sc} cast={cast} play={play} still={!(acting && fin)} orbit fill={!(acting && fin)} t="caw-view" label={(lk.name || w0.name) + ' in ' + ATTIRES.find(a => a[0] === att)![1].toLowerCase() + '. Drag to walk round them.'} /></div>
        <div class="sc-keys" role="group" aria-label="Pose">
          <span class="sc-lbl">Pose</span>
          {VIEW_POSES.map(p => <Btn kind="less" t="caw-pose" d={{ v: p[0] }} on={pose === p[0] && !acting} onClick={() => { setPose(p[0]); setActing(false); }}>{p[1]}</Btn>)}
          <span class="sp" /><span class="muted">Drag the picture to walk round them</span>
        </div>
      </Win>
      <Win title={titles[tab]} right={tab === 'gear' || tab === 'colour' || tab === 'studio' ? ATTIRES.find(a => a[0] === att)![1] : ''} area="side" t="caw-side">
        <Tabs label="What to change" value={tab} onPick={v => setTab(v as Tab)} items={[...(pp.sign ? [{ id: 'sign', label: 'Who they are', t: 'caw-tab' }] : []), { id: 'body', label: 'Body', t: 'caw-tab' }, { id: 'head', label: 'Head', t: 'caw-tab' }, { id: 'gear', label: 'Gear', t: 'caw-tab' },
          { id: 'colour', label: 'Colours', t: 'caw-tab' }, { id: 'studio', label: 'Lettering', t: 'caw-tab' }, { id: 'fin', label: 'Finishers', t: 'caw-tab' }, { id: 'file', label: 'File', t: 'caw-tab' }]} />
        {tab === 'sign' && info && pv && <>
          <div class="sc-row"><span class="sc-slot">Ring name</span><TextBox value={lk.name || ''} max={28} label="Ring name" t="caw-name" width="18ch" onInput={v => change(n => { n.name = v; })} /></div>
          {([['g', 'Division', [['M', 'Men'], ['F', 'Women']]], ['align', 'Side', [['F', 'Face'], ['H', 'Heel']]], ['style', 'Style', Object.keys(E.STYLE_NAME).map(k => [k, E.STYLE_NAME[k]])],
            ['bg', 'Background', Object.keys(info.bgs).map(k => [k, info.bgs[k].n])], ['emph', 'Strongest suit', Object.keys(info.emph).map(k => [k, info.emph[k]])],
            ['gim', 'Gimmick', [['', 'Whatever suits them']].concat(E.GIMS.map((g: any) => [g.id, g.n]))]] as [keyof Draft, string, string[][]][]).map(([k, n, opts]) =>
            <div class="sc-row"><span class="sc-slot">{n}</span><select aria-label={n} data-t="caw-draft" data-v={k} value={d[k]} onChange={e => setDraft(k, (e.currentTarget as HTMLSelectElement).value)}>{opts.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>)}
          <p class="muted">{(info.bgs[d.bg] || info.bgs.indie).d}</p>
          <Group title="What you get">
            <p>Overness <b>{pv.ovr}</b>{' · '}Work rate about <b>{pv.work}</b>{' · '}Charisma <b>{pv.mic}</b>{' · '}Potential <b>{pv.pot}</b></p>
            <p data-t="caw-cost">They will ask for about {full(pv.wage)} a week.</p>
          </Group>
          <div class="sc-row"><Btn kind="go" t="caw-create" onClick={signIt}>Create</Btn><span class="muted">They join the free agents, with their look, outfits and finisher. Sign them from Free agents like anybody else.</span></div>
        </>}
        {tab === 'body' && <>
          <Group title="Body type">
            <div class="sc-row">{ARCHETYPES.map(a => <Btn kind="less" t="caw-arch" d={{ v: a[0] }} on={pa.body_archetype === a[0]} onClick={() => change(n => { n.archetype = a[0]; n.physical_attributes = { height_inches: a[2].h, weight_lbs: a[2].w, body_archetype: a[0], proportional_scalers: { torso_width: a[2].s[0], torso_height: a[2].s[1], limb_length: a[2].s[2], muscle_mass: a[2].s[3] } }; })}>{a[1]}</Btn>)}</div>
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
          <Group title="Hair, or a mask">
            <div class="sc-row"><select aria-label="Hair" data-t="caw-hair" value={cur.equipped_assets.head || 'hair_face'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { ATTIRES.forEach(a => { const x = (n.attires = n.attires || {})[a[0]] || (n.attires[a[0]] = { equipped_assets: {}, palette_slots: {} }); x.equipped_assets.head = v; }); }); }}>
              {PARTS.head.map(p => <option value={p[0]}>{p[1]}</option>)}</select>
              <span class="muted">Worn with every outfit; a mask takes the main colour and the trim of each.</span></div>
            <div class="sc-row"><span class="sc-slot">Hair colour</span><select aria-label="Hair colour" data-t="caw-haircol" value={(lk.appearance && lk.appearance.hair_colour) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { n.appearance = n.appearance || {}; if (v) n.appearance.hair_colour = v; else delete n.appearance.hair_colour; }); }}>
              <option value="">From the face</option>{SWATCHES.map(s => <option value={s[0]}>{s[1]}</option>)}</select></div>
            <div class="sc-row"><span class="sc-slot">Facial hair</span><select aria-label="Facial hair" data-t="caw-facial" value={(lk.appearance && lk.appearance.facial_hair) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { n.appearance = n.appearance || {}; if (v) n.appearance.facial_hair = v; else delete n.appearance.facial_hair; }); }}>
              {FACIAL.map(f => <option value={f[0]}>{f[1]}</option>)}</select></div>
          </Group>
          <Group title="The face">
            {FACE_PARTS.map(([k, n]) => { const v = face[k] ?? 0; return <div class="sc-row"><span class="sc-slot">{n}</span>
              <Btn kind="less" t="caw-face" d={{ k, v: -1 }} label={'Previous ' + n} onClick={() => setFace(k, (v + 9) % 10)}>{'<'}</Btn><b>{NAMES[k][v]}</b>
              <Btn kind="less" t="caw-face" d={{ k, v: 1 }} label={'Next ' + n} onClick={() => setFace(k, (v + 1) % 10)}>{'>'}</Btn></div>; })}
            <div class="sc-row"><span class="caw-lbl">Skin tone</span><input type="range" min={0} max={100} value={face.sk ?? 50} aria-label="Skin tone" data-t="caw-skin" onInput={e => setFace('sk', +(e.currentTarget as HTMLInputElement).value)} /></div>
          </Group>
        </>}
        {tab === 'gear' && <>
          {(['upper_body', 'lower_body', 'footwear'] as const).map(slot => <div class="sc-row"><span class="sc-slot">{slot === 'upper_body' ? 'Top' : slot === 'lower_body' ? 'Bottoms' : 'Footwear'}</span>
            <select aria-label={slot === 'upper_body' ? 'Top' : slot === 'lower_body' ? 'Bottoms' : 'Footwear'} data-t="caw-part" data-v={slot} value={cur.equipped_assets[slot] || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n => { A(n).equipped_assets[slot] = v; }); }}>
              {PARTS[slot].map(p => <option value={p[0]}>{p[1]}</option>)}</select></div>)}
          <Group title="Extras">
            <div class="sc-row">{PARTS.accessories.map(p => { const on = (cur.equipped_assets.accessories || []).indexOf(p[0]) >= 0; return <Btn kind="less" t="caw-acc" d={{ v: p[0] }} on={on} onClick={() => change(n => { const e = A(n).equipped_assets, l = e.accessories || []; e.accessories = on ? l.filter(x => x !== p[0]) : l.concat([p[0]]).slice(0, 8); })}>{p[1]}</Btn>; })}</div>
          </Group>
          <p class="muted">Each outfit is worn where it belongs: ring gear in the ring, entrance gear on the ramp, street clothes backstage and in promos.</p>
        </>}
        {tab === 'colour' && <>
          {SLOTS.map(([k, n]) => <div class="sc-row"><span class="sc-slot">{n}</span>{chip((cur.palette_slots as any)[k])}
            <select aria-label={n} data-t="caw-swatch" data-v={k} value={(cur.palette_slots as any)[k] || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; change(n2 => { (A(n2).palette_slots as any)[k] = v; }); }}>
              <option value="">Their own colour</option>{SWATCHES.map(s => <option value={s[0]}>{s[1]}</option>)}</select></div>)}
          <p class="muted">Main colour: trunks, tights, jeans and ring tops. Second colour: shirts and jackets worn over, boots, pads and gloves. Trim: stripes, edges, laces and soles. Buckles and metal: zips, buckles, chains and glasses. Foil shines, neon glows, corrugated board has ridges.</p>
          <div class="sc-row">{ATTIRES.filter(a => a[0] !== att).map(a => <Btn kind="sm" t="caw-copycol" d={{ v: a[0] }} onClick={() => change(n => { const from = (n.attires || {})[a[0]]; if (from) A(n).palette_slots = { ...from.palette_slots }; })}>{'Colours from ' + a[1].toLowerCase()}</Btn>)}</div>
        </>}
        {tab === 'studio' && <>
          <Group title="Add to this outfit">
            <div class="sc-row"><TextBox value={text} max={20} label="Lettering" t="caw-text" width="12ch" onInput={v => setText(v.toUpperCase())} />
              <select aria-label="Lettering style" data-t="caw-font" value={font} onChange={e => setFont((e.currentTarget as HTMLSelectElement).value)}>{FONTS.map(f => <option value={f[0]}>{f[1]}</option>)}</select>
              <Btn t="caw-addtext" disabled={!text.trim() || layers.length >= 16} onClick={() => { change(n => { A(n).custom_layers!.push({ type: 'text_decal', string: text.trim(), font, placement: { x: 0, y: -2, z: layers.length }, palette_slot: 'trim' }); }); setLay(layers.length); }}>Add lettering</Btn></div>
            <div class="sc-row"><select aria-label="Shape" data-t="caw-shape" value={shp} onChange={e => setShp((e.currentTarget as HTMLSelectElement).value)}>{SHAPES.map(s => <option value={s[0]}>{s[1]}</option>)}</select>
              <Btn t="caw-addshape" disabled={layers.length >= 16} onClick={() => { change(n => { A(n).custom_layers!.push({ type: 'shape_combiner', shape_id: shp, placement: { x: 0, y: shp === 'tactical_vest_straps' ? -3 : 0, z: layers.length }, palette_slot: 'secondary', scale: shp === 'tactical_vest_straps' || shp === 'bandolier' ? 1 : 0.5 }); }); setLay(layers.length); }}>Add shape</Btn></div>
          </Group>
          <Group title={'On this outfit (' + layers.length + ')'}>
            <div class="sc-row">{layers.length ? layers.map((l, i) => <Btn kind="less" t="caw-layer" d={{ v: i }} on={i === lay} onClick={() => setLay(i)}>{l.type === 'text_decal' ? '"' + l.string + '"' : (SHAPES.find(s => s[0] === l.shape_id) || ['', l.shape_id])[1]}</Btn>) : <span class="muted">Nothing yet. Lettering and shapes are cut from card and stuck on the chest or down the leg.</span>}</div>
            {layers[lay] && <>
              <div class="sc-row" role="group" aria-label="Move">
                <Btn kind="less" t="caw-lmove" d={{ v: 'l' }} onClick={() => setLayer(l => { l.placement.x = Math.max(-20, l.placement.x - 1); })}>Left</Btn><Btn kind="less" t="caw-lmove" d={{ v: 'r' }} onClick={() => setLayer(l => { l.placement.x = Math.min(20, l.placement.x + 1); })}>Right</Btn>
                <Btn kind="less" t="caw-lmove" d={{ v: 'u' }} onClick={() => setLayer(l => { l.placement.y = Math.min(20, l.placement.y + 1); })}>Up</Btn><Btn kind="less" t="caw-lmove" d={{ v: 'd' }} onClick={() => setLayer(l => { l.placement.y = Math.max(-20, l.placement.y - 1); })}>Down</Btn>
                <Btn kind="less" t="caw-lsize" d={{ v: '+' }} onClick={() => setLayer(l => { l.scale = Math.min(4, r2((l.scale || 1) + 0.1)); })}>Bigger</Btn><Btn kind="less" t="caw-lsize" d={{ v: '-' }} onClick={() => setLayer(l => { l.scale = Math.max(0.2, r2((l.scale || 1) - 0.1)); })}>Smaller</Btn>
                <Btn kind="less" t="caw-lturn" d={{ v: 15 }} onClick={() => setLayer(l => { l.rot = Math.max(-180, Math.min(180, (l.rot || 0) + 15)); })}>Turn</Btn>
                {layers[lay].type === 'text_decal' && <><Btn kind="less" t="caw-larch" d={{ v: '+' }} onClick={() => setLayer(l => { l.arch = Math.min(1, r2((l.arch || 0) + 0.25)); })}>Arch up</Btn><Btn kind="less" t="caw-larch" d={{ v: '-' }} onClick={() => setLayer(l => { l.arch = Math.max(-1, r2((l.arch || 0) - 0.25)); })}>Arch down</Btn></>}
              </div>
              <div class="sc-row">
                <select aria-label="Colour" data-t="caw-lcol" value={layers[lay].palette_slot || 'trim'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setLayer(l => { l.palette_slot = v; }); }}>
                  {SLOTS.map(s => <option value={s[0]}>{'The outfit: ' + s[1].toLowerCase()}</option>)}{SWATCHES.map(s => <option value={s[0]}>{s[1]}</option>)}</select>
                <select aria-label="Where it goes" data-t="caw-lon" value={layers[lay].on || 'upper_body'} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setLayer(l => { if (v === 'lower_body') l.on = 'lower_body'; else delete l.on; }); }}>
                  <option value="upper_body">On the chest</option><option value="lower_body">Down the leg</option></select>
                <Btn kind="danger" t="caw-ldrop" onClick={() => { change(n => { A(n).custom_layers!.splice(lay, 1); }); setLay(-1); }}>Remove</Btn>
              </div>
            </>}
          </Group>
        </>}
        {tab === 'fin' && <>
          <div class="sc-row">{fins.map((f, i) => <Btn kind="less" t="caw-fin" d={{ v: i }} on={i === fi} onClick={() => { setFi(i); setActing(false); }}>{f.name}</Btn>)}
            <Btn kind="sm" t="caw-addfin" disabled={fins.length >= 4} onClick={() => { change(n => { const F = n.finishing_moves = n.finishing_moves || []; F.push({ name: fins.length ? 'Signature move ' + fins.length : 'The finisher', impact_damage: 80, kickout_difficulty: 'Protected', position: 'Standing', category: 'Pinfall Impact', preview_pose_id: 'slam' }); }); setFi(fins.length); }}>Add a move</Btn></div>
          {fin ? <>
            <div class="sc-row"><TextBox value={fin.name} max={32} label="Name of the move" t="caw-finname" width="18ch" onInput={v => setFin(f => { f.name = v; })} /></div>
            <div class="sc-row"><span class="caw-lbl">Impact</span><input type="range" min={1} max={100} value={fin.impact_damage || 50} aria-label="Impact" data-t="caw-findmg" onInput={e => { const v = +(e.currentTarget as HTMLInputElement).value; setFin(f => { f.impact_damage = v; }); }} /><b>{fin.impact_damage || 50}</b></div>
            {([['kickout_difficulty', 'Kick out', KICKOUT], ['position', 'From', POSITIONS], ['category', 'How it wins', CATEGORIES], ['preview_pose_id', 'In the picture', FIN_SCENES]] as [keyof Finisher, string, [string, string][]][]).map(([k, n, opts]) =>
              <div class="sc-row"><span class="sc-slot">{n}</span><select aria-label={n} data-t="caw-finopt" data-v={k} value={(k === 'preview_pose_id' ? finScene(fin) : (fin[k] as string)) || ''} onChange={e => { const v = (e.currentTarget as HTMLSelectElement).value; setFin(f => { (f as any)[k] = v; }); }}>{opts.map(o => <option value={o[0]}>{o[1]}</option>)}</select></div>)}
            <div class="sc-row"><Btn kind="go" t="caw-act" onClick={() => setActing(!acting)}>{acting ? 'Stop' : 'Act it out on the dummy'}</Btn>
              <Btn kind="danger" t="caw-dropfin" onClick={() => { change(n => { (n.finishing_moves || []).splice(fi, 1); }); setFi(-1); setActing(false); }}>Remove</Btn></div>
            <p class="muted">The picture plays on the broadcast when this move ends a match. People do kick out of finishers: the more protected the move, the rarer and bigger the kick-out, and every kick-out wears it down a little until it rests. A clean win with it lands by how protected it is, how hard it hits and where it comes from.</p>
          </> : <p class="empty">{fins.length ? 'Pick a move to change it.' : 'No finishing moves yet.'}</p>}
        </>}
        {tab === 'file' && <>
          <Group title="Who they are">
            <div class="sc-row"><span class="sc-slot">Name</span><TextBox value={lk.name || ''} max={32} label="Ring name" t="caw-name" width="18ch" onInput={v => change(n => { n.name = v; })} /></div>
            <div class="sc-row"><span class="sc-slot">Nickname</span><TextBox value={lk.moniker || ''} max={40} label="Nickname" t="caw-moniker" width="18ch" onInput={v => change(n => { n.moniker = v; })} /></div>
            <div class="sc-row"><span class="sc-slot">Home town</span><TextBox value={lk.hometown || ''} max={40} label="Home town" t="caw-town" width="18ch" onInput={v => change(n => { n.hometown = v; })} /></div>
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
