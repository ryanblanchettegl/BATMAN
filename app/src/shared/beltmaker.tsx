/* Create a Belt: one pop-up where a title's belt is built from parts, and the belt on the left redraws with every
   choice. Nothing is saved until Save the belt is pressed. It ships with no presets that copy a real company's belt:
   only the parts, and ideas made from the title's own words. Open it with openBeltMaker(). The engine fills and
   checks a belt (E.beltFill) and makes the ideas (E.beltIdeas). */
import { E } from '../engine';
import { view, openModal, closeModal, Modal } from '../store';
import { Window, Btn, Belt, BeltData, dataAttrs, METAL, GEM, Sel, Opt } from '../kit';

export interface BeltJob {
  /** the title, as it is in the world or the game, and its company */
  title: any; co: any;
  /** the belt it has now */
  belt: BeltData;
  /** keep it (null puts back the one the title gives itself). Answers whether it was kept, and what to say if not. */
  onSave: (b: BeltData | null) => { ok: boolean; msg?: string };
}
export function openBeltMaker(job: BeltJob) { openModal({ kind: 'belt', job, b: { ...job.belt }, hist: [], seed: 0, note: '' }); }

export function BeltMaker(p: { m: Modal }) {
  const st = p.m, job: BeltJob = st.job, b: BeltData = st.b, P = E.BELT;
  const set = (ch: Partial<BeltData>) => view(() => { st.hist.push({ ...b }); if (st.hist.length > 40) st.hist.shift(); st.b = E.beltFill({ ...b, ...ch }, job.title, job.co); st.note = ''; });
  const ideas: BeltData[] = E.beltIdeas(job.title, job.co, 6, st.seed);
  const save = (x: BeltData | null) => { const r = job.onSave(x); if (r.ok) closeModal(); else view(() => { st.note = r.msg || 'That belt could not be kept.'; }); };
  /* a choice in words is a dropdown (Ryan, 20 October: more dropdown menus than buttons in the World Editor) */
  const row = (label: string, k: keyof BeltData, L: any[]) => <div class="mm-row"><span class="mm-l">{label}</span>
    <span class="mm-opts"><Sel t={'belt-' + k} label={label} value={String(b[k])} options={L.map((o: any) => [String(o[0]), o[1]] as Opt)} onChange={v => set({ [k]: k === 'sd' ? +v : v } as any)} /></span></div>;
  const chips = (label: string, k: 'mt' | 'gm' | 'st', L: any[], col: (v: string) => string) => <div class="mm-row" role="group" aria-label={label}><span class="mm-l">{label}</span>
    <span class="mm-sw">{L.map((c: any) => <button type="button" class={'mm-c' + (b[k] === c[0] ? ' on' : '') + (c[0] === 'none' ? ' none' : '')} style={{ background: col(c[0]) }} aria-label={label + ': ' + c[1]} title={c[1]} aria-pressed={b[k] === c[0]} {...dataAttrs('belt-' + k, { v: c[0] })} onClick={() => set({ [k]: c[0] } as any)} />)}</span></div>;
  return <Window title={'Create a Belt: ' + (job.title.name || 'a title')} wide noOk hint="Esc closes without saving"
    footer={<><Btn kind="go" t="belt-save" onClick={() => save(b)}>Save the belt</Btn><Btn kind="less" t="belt-undo" disabled={!st.hist.length} onClick={() => view(() => { st.b = st.hist.pop(); st.note = ''; })}>Undo</Btn><Btn kind="less" t="belt-reset" onClick={() => set(E.beltFill(null, job.title, job.co))}>Its own design</Btn><Btn kind="less" t="modal-close" onClick={closeModal}>Not now</Btn></>}>
    <div class="mm bm">
      <div class="mm-left">
        <Belt of={b} size="board" dot={2.4} t="belt-preview" label={'The belt as it stands: ' + b.w} />
        <p class="mm-as"><span class="muted">In a list</span> <Belt of={b} dot={1} /></p>
        {st.note ? <p class="muted" data-t="belt-note">{st.note}</p> : null}
        <div class="mm-row"><span class="mm-l">On the plate</span><span class="mm-opts"><input type="text" value={b.w} maxLength={14} aria-label="The word on the plate, up to fourteen letters" style={{ width: 'calc(16 * var(--ch))' }} {...dataAttrs('belt-w')}
          onInput={e => set({ w: (e.currentTarget as HTMLInputElement).value })} /></span></div>
        <div class="mm-row"><span class="mm-l">Above it</span><span class="mm-opts"><input type="text" value={b.top} maxLength={6} aria-label="The small line above, up to six letters" style={{ width: 'calc(9 * var(--ch))' }} {...dataAttrs('belt-top')}
          onInput={e => set({ top: (e.currentTarget as HTMLInputElement).value })} /></span></div>
      </div>
      <div class="mm-mid">
        <div class="mm-row" role="group" aria-label="Centre plate"><span class="mm-l">Centre plate</span><span class="mm-shapes">{P.plates.map((o: any) => <button type="button" class={'mm-s' + (b.pl === o[0] ? ' on' : '')} aria-label={'Centre plate: ' + o[1]} aria-pressed={b.pl === o[0]} title={o[1]} {...dataAttrs('belt-pl', { v: o[0] })} onClick={() => set({ pl: o[0] })}>
          <Belt of={{ ...b, pl: o[0], sd: 0, w: '', top: '' }} dot={0.75} label={o[1]} /></button>)}</span></div>
        {chips('Metal', 'mt', P.metals, v => (METAL[v] || METAL.gold)[1])}
        {chips('Strap', 'st', P.straps, v => v)}
        {chips('Gem', 'gm', P.gems, v => GEM[v] || 'transparent')}
        {row('Side plates', 'sd', P.sides)}
        {b.sd ? row('Their shape', 'ss', P.sideShapes) : null}
        {row('Trim', 'tr', P.trims)}
        <div class="mm-right" role="group" aria-label="Ideas">
          <p class="mm-h"><span>Ideas for this belt</span><Btn kind="sm" t="belt-shuffle" onClick={() => view(() => { st.seed++; })}>Shuffle</Btn></p>
          <div class="mm-ideas">{ideas.map((x, i) => <button type="button" class="mm-s" aria-label={'Idea ' + (i + 1) + ': take this belt'} {...dataAttrs('belt-idea', { v: i })} onClick={() => set(x)}><Belt of={x} dot={1} label={'Idea ' + (i + 1)} /></button>)}</div>
        </div>
      </div>
    </div>
  </Window>;
}
