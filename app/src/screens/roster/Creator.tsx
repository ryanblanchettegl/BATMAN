/* Create a wrestler: the one Windows 95 window in the game. It draws its own markup with the caw-* classes (styles/caw.css). */
import { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { E } from '../../engine';
import { G, ui, act, view, say, full, closeModal, plural } from '../../store';
import { NAV, onKey } from '../../input';
import { FaceCanvas, Sel, TextBox, Opt, dataAttrs } from '../../kit';
import { derive, NAMES, Face, FaceKey } from '../../lib/portrait';
import { rs, Draft } from './state';

export function cwDefault(): Draft { return { name: '', g: 'M', style: 'A', align: 'F', bg: 'indie', emph: 'ring', fin: '', gim: '', face: derive('cw' + Date.now(), 'M', 25) }; }
const CAWPART: [FaceKey, string][] = [['hr', 'Hair'], ['fh', 'Facial hair'], ['ms', 'Mustache'], ['ey', 'Eyes'], ['ns', 'Nose']];
type Cat = 'head' | 'face' | 'body' | 'gear' | 'skills';

/** The part of the face the style picker is editing: the head shape, one of the five face parts, or nothing. */
function cawPart(): FaceKey | null { const A = rs().caw; return A.cat === 'head' ? 'h' : (A.cat === 'face' ? A.part : null); }
/** The face as previewed: the draft, with the style being tried on (not yet applied) in place. */
function cawFace(): Face { const st = rs(), part = cawPart(), f = { ...st.cw!.face }; if (part && st.caw.pick != null) f[part] = st.caw.pick; return f; }
function step(by: number) { const st = rs(), part = cawPart(); if (!part) return; const cur = st.caw.pick != null ? st.caw.pick : st.cw!.face[part]; st.caw.pick = (cur + by + 10) % 10; }
function apply() { const st = rs(), part = cawPart(); if (part && st.caw.pick != null) { st.cw!.face[part] = st.caw.pick; st.caw.pick = null; } }

/* Left and Right step the style while the window is open. A remote uses the arrows to move the highlight instead. */
onKey(e => {
  if (!ui.modal || ui.modal.kind !== 'caw' || NAV.on || !rs().cw) return false;
  if ((e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') || e.altKey || e.ctrlKey || e.metaKey) return false;
  const tag = e.target ? (e.target as HTMLElement).tagName : '';
  if (tag === 'INPUT' || tag === 'SELECT') return false;
  view(() => step(e.key === 'ArrowLeft' ? -1 : 1));
  return true;
});

/** Style picker for the chosen part: scroll bar, skin and hair colour sliders, the ten styles, and Apply. */
function StylePicker(p: { part: FaceKey; pname: string; cur: number; pick: number }) {
  const st = rs(), c = st.cw!, A = st.caw, { part, pname, cur, pick } = p;
  const slider = (k: 'sk' | 'hc', label: string, ico: string) => <label class="caw-slider" title={label}><span class="caw-ico" aria-hidden="true">{ico}</span>
    <input class="caw-range" type="range" min={0} max={100} value={c.face[k]} aria-label={label} onInput={e => view(() => { c.face[k] = +(e.currentTarget as HTMLInputElement).value; })} {...dataAttrs('cawsl', { k })} /></label>;
  return <>
    <div class="caw-scroll">
      <button class="caw-arr" type="button" aria-label="Previous style" onClick={() => view(() => step(-1))} {...dataAttrs('caw-step', { v: -1 })}>{'◄'}</button>
      <div class="caw-track"><i class="caw-thumb" style={{ left: (pick / 9 * 78).toFixed(1) + '%' }} /></div>
      <button class="caw-arr" type="button" aria-label="Next style" onClick={() => view(() => step(1))} {...dataAttrs('caw-step', { v: 1 })}>{'►'}</button>
    </div>
    <div class="caw-ctl">
      <div class="caw-sliders">{slider('sk', 'Skin tone', '☼')}{slider('hc', 'Hair colour', '✎')}</div>
      <div class="caw-pages" role="group" aria-label={pname + ' style'}>
        {Array.from({ length: 10 }, (_, k) => <button type="button" class={(k === pick ? 'on' : '') + (k === cur ? ' cur' : '')} aria-label={pname + ' style ' + (k + 1) + ': ' + NAMES[part][k]} aria-pressed={k === pick ? true : undefined}
          onClick={() => view(() => { A.pick = k; })} {...dataAttrs('caw-pick', { v: k })}>{k + 1}</button>)}
      </div>
      <button class="caw-btn" type="button" data-t="caw-apply" disabled={pick === cur} onClick={() => view(apply)}>APPLY {pname.toUpperCase()} {pick + 1}</button>
    </div>
  </>;
}

export function Creator() {
  const S = G.S, st = rs(), opened = useRef(false), box = useRef<HTMLDivElement>(null);
  // every time the window opens it starts on Face > Hair with the draft the player left behind
  if (!opened.current) { opened.current = true; st.cawMsg = null; st.caw = { cat: 'face', part: 'hr', pick: null }; }
  if (!st.cw) st.cw = cwDefault();
  if (!st.cw.face) st.cw.face = derive('cw' + Date.now(), st.cw.g, 25);
  // focus moves into the window when it opens and returns to where it was when it closes
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null, first = box.current && box.current.querySelector('.caw-cat.on') as HTMLElement | null;
    if (first && !NAV.on) first.focus();
    return () => { if (prev && prev !== document.body && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } };
  }, []);
  const c = st.cw, A = st.caw, info = E.createInfo(S), pv = E.createPreview(S, c);
  const part = cawPart(), cur = part ? c.face[part] : 0, pick = part && A.pick != null ? A.pick : cur;
  const pname = part ? (part === 'h' ? 'Head' : CAWPART.find(x => x[0] === part)![1]) : '';
  const weeks = 'Your scouts need ' + info.wait + ' more ' + plural(info.wait, 'week') + '.';
  const cat = (k: Cat, n: string) => <button class={'caw-cat' + (A.cat === k ? ' on' : '')} type="button" aria-expanded={A.cat === k} onClick={() => view(() => { A.cat = k; A.pick = null; st.cawMsg = null; })} {...dataAttrs('caw-cat', { v: k })}>
    <span class="lbl">{n}</span>{A.cat === k ? <i class="caw-led" aria-hidden="true" /> : null}</button>;
  const set = (k: keyof Draft) => (v: string) => view(() => { (c as any)[k] = v; st.cawMsg = null; });
  const sel = (k: keyof Draft, label: string, options: Opt[]): ComponentChildren => <><label for={'cw-' + k}>{label}</label><Sel id={'cw-' + k} t="cw" d={{ k }} value={c[k] as string} options={options} onChange={set(k)} /></>;
  const txt = (k: keyof Draft, label: string, max: number): ComponentChildren => <><label for={'cw-' + k}>{label}</label><TextBox id={'cw-' + k} t="cw" d={{ k }} max={max} value={c[k] as string} onInput={set(k)} /></>;
  const make = () => act(() => {
    apply();
    const r = E.createWrestler(S, c);
    if (r.ok) { say(r.msg); st.cw = null; st.cawMsg = null; closeModal(); } else st.cawMsg = r.msg;
  });
  return <div class="scrim cawscrim"><div class="caw"><div ref={box} class="caw-win" role="dialog" aria-modal="true" aria-label="Create a wrestler">
    <div class="caw-title"><span>Create a wrestler - Edit {A.cat}</span><button class="caw-x" type="button" data-t="cw-open" aria-label="Close" onClick={closeModal}>{'✕'}</button></div>
    <div class="caw-body">
      <div class="caw-left">
        {cat('head', 'Head')}{cat('face', 'Face')}
        {A.cat === 'face' && <ul class="caw-tree">{CAWPART.map(x => <li><button type="button" class={A.part === x[0] ? 'on' : undefined} aria-current={A.part === x[0] ? 'true' : undefined}
          onClick={() => view(() => { A.part = x[0]; A.pick = null; })} {...dataAttrs('caw-part', { v: x[0] })}>{x[1]}</button></li>)}</ul>}
        {part && <StylePicker part={part} pname={pname} cur={cur} pick={pick} />}
        <div class="caw-split">{cat('body', 'Body')}<div class="caw-btn" role="status">{part ? pname + ' ' + (pick + 1) + ': ' + NAMES[part][pick] : (c.name || 'No name yet')}</div></div>
        {A.cat === 'body' && <div class="caw-fields">
          {sel('g', 'Division', [['M', 'Men'], ['F', 'Women']])}
          {sel('style', 'Style', Object.keys(E.STYLE_NAME).map(k => [k, E.STYLE_NAME[k]] as Opt))}
          {sel('bg', 'Background', Object.keys(info.bgs).map(k => [k, info.bgs[k].n] as Opt))}
          <p>{(info.bgs[c.bg] || info.bgs.indie).d}</p>
        </div>}
        {cat('gear', 'Gear')}
        {A.cat === 'gear' && <div class="caw-fields">
          {txt('name', 'Ring name', 28)}{txt('fin', 'Finisher', 24)}
          {sel('align', 'Side', [['F', 'Face'], ['H', 'Heel']])}
          {sel('gim', 'Gimmick', [['', 'Whatever suits them'] as Opt].concat(E.GIMS.map((g: any) => [g.id, g.n] as Opt)))}
        </div>}
        {cat('skills', 'Skills')}
        {A.cat === 'skills' && <div class="caw-fields">
          {sel('emph', 'Strongest suit', Object.keys(info.emph).map(k => [k, info.emph[k]] as Opt))}
          <p>Overness <b>{pv.ovr}</b> {'·'} Work rate about <b>{pv.work}</b></p>
          <p>Charisma <b>{pv.mic}</b> {'·'} Potential <b>{pv.pot}</b></p>
        </div>}
      </div>
      <div class="caw-view"><div class="caw-screen"><FaceCanvas id="portraitCanvas" face={cawFace()} g={c.g} bg={c.align} label="Portrait preview" /></div></div>
    </div>
    <div class="caw-foot">
      <span role="status">{st.cawMsg ? <span class="caw-err">{st.cawMsg}</span> : (info.ok ? full(pv.wage) + ' a week · ' + full(pv.fee) + ' to sign' : weeks)}</span>
      <span class="sp" />
      <button class="caw-btn up" type="button" data-t="caw-rnd" onClick={() => view(() => { c.face = derive('cw' + Math.random(), c.g, 25); A.pick = null; })}>Random face</button>
      <button class="caw-btn up" type="button" data-t="cw-make" disabled={!info.ok} onClick={make}>Sign them</button>
      <button class="caw-btn up" type="button" data-t="cw-open" onClick={closeModal}>Cancel</button>
    </div>
  </div></div></div>;
}
