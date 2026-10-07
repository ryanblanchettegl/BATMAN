/* The logo creator: one pop-up where a company's logo is built from general parts, and the logo on the left redraws
   with every choice (docs/plans/art-direction.md, section 3a). Nothing is saved until Save the logo is pressed.
   It ships with no presets that copy a real company's logo: only the parts, and ideas made from the company's own letters.
   Open it with openLogoMaker(). The engine does the checking (E.logoOk) and the ideas (E.logoIdeas). */
import { E } from '../engine';
import { view, openModal, closeModal, Modal } from '../store';
import { Window, Btn, Logo, LogoData, dataAttrs } from '../kit';

export interface LogoJob {
  /** the company the logo is for, as a line in the title */
  name: string; model: string;
  /** the logo it has now */
  logo: LogoData;
  /** the other companies in the same world or game, for the rule that no two share a logo */
  list: any[]; self: string;
  /** keep it. Answers whether it was kept, and what to say if not. */
  onSave: (m: LogoData) => { ok: boolean; msg?: string };
}
export function openLogoMaker(job: LogoJob) { openModal({ kind: 'logo', job, m: { ...job.logo }, hist: [], seed: 0, note: '' }); }

const colName = (h: string) => (E.LOGO.cols.find((c: any) => c[0] === h) || ['', h])[1];
export function LogoMaker(p: { m: Modal }) {
  const st = p.m, job: LogoJob = st.job, m: LogoData = st.m, P = E.LOGO;
  /* every change goes through here: tidy it, keep the letters readable, remember the step before for Undo */
  const set = (ch: Partial<LogoData>) => view(() => {
    st.hist.push({ ...m }); if (st.hist.length > 40) st.hist.shift();
    let n: LogoData = E.logoFill({ ...m, ...ch }, job.model, job.name, '');
    if (ch.ex === 'tag' && !n.tag) n = E.logoFill({ ...m, ...ch, tag: 'EST 2026' }, job.model, job.name, '');
    st.note = '';
    const v = E.logoOk([], n, job.self);
    if (!v.ok && v.c3) { n.c3 = v.c3; st.note = 'The letters are now ' + colName(v.c3).toLowerCase() + ', so they can be read.'; }
    st.m = n;
  });
  const v = E.logoOk(job.list, m, job.self), ideas: LogoData[] = E.logoIdeas(m.l, 6, st.seed);
  const save = () => { if (!v.ok) return; const r = job.onSave(m); if (r.ok) closeModal(); else view(() => { st.note = r.msg || 'That logo could not be kept.'; }); };
  const row = (label: string, k: keyof LogoData, L: any[]) => <div class="mm-row" role="group" aria-label={label}><span class="mm-l">{label}</span>
    <span class="mm-opts">{L.map((o: any) => <Btn kind="sm" t={'logo-' + k} d={{ v: o[0] }} on={m[k] === o[0]} onClick={() => set({ [k]: o[0] } as any)}>{o[1]}</Btn>)}</span></div>;
  const sw = (label: string, k: 'c1' | 'c2' | 'c3') => <div class="mm-row" role="group" aria-label={label}><span class="mm-l">{label}</span>
    <span class="mm-sw">{P.cols.map((c: any) => <button type="button" class={'mm-c' + (m[k] === c[0] ? ' on' : '')} style={{ background: c[0] }} aria-label={label + ': ' + c[1]} aria-pressed={m[k] === c[0]} {...dataAttrs('logo-' + k, { v: c[0] })} onClick={() => set({ [k]: c[0] } as any)} />)}</span></div>;
  return <Window title={'The logo of ' + job.name} wide noOk hint="Esc closes without saving"
    footer={<><Btn kind="go" t="logo-save" disabled={!v.ok} onClick={save}>Save the logo</Btn><Btn kind="less" t="logo-undo" disabled={!st.hist.length} onClick={() => view(() => { st.m = st.hist.pop(); st.note = ''; })}>Undo</Btn><Btn kind="less" t="logo-reset" onClick={() => set(E.logoFill(null, job.model, m.l, ''))}>The model’s own</Btn><Btn kind="less" t="modal-close" onClick={closeModal}>Not now</Btn></>}>
    <div class="mm">
      <div class="mm-left">
        <Logo of={m} size="board" t="logo-preview" label={'The logo as it stands: ' + m.l} />
        <p class="mm-as"><span class="muted">In a list</span> <Logo of={m} size="chip" t="logo-chip" /> <span class="muted">Small</span> <Logo of={m} dot={1} /></p>
        <p class={v.ok ? 'good' : 'bad'} data-t="logo-check" role="status">{v.ok ? 'This logo is free to use.' : v.errors[0]}</p>
        {st.note ? <p class="muted" data-t="logo-note">{st.note}</p> : null}
      </div>
      <div class="mm-mid">
        <div class="mm-row"><span class="mm-l">Letters</span><span class="mm-opts"><input type="text" value={m.l} maxLength={3} aria-label="Two or three letters" style={{ width: '7ch' }} {...dataAttrs('logo-l')}
          onInput={e => { const t = (e.currentTarget as HTMLInputElement).value.toUpperCase().replace(/[^A-Z0-9]/g, ''); if (t.length >= 2) set({ l: t }); }} />
          {P.styles.map((o: any) => <Btn kind="sm" t="logo-st" d={{ v: o[0] }} on={m.st === o[0]} onClick={() => set({ st: o[0] })}>{o[1]}</Btn>)}</span></div>
        {row('Layout', 'lay', P.lays)}
        <div class="mm-row" role="group" aria-label="Shape"><span class="mm-l">Shape</span><span class="mm-shapes">{P.shapes.map((o: any) => <button type="button" class={'mm-s' + (m.sh === o[0] ? ' on' : '')} aria-label={'Shape: ' + o[1]} aria-pressed={m.sh === o[0]} title={o[1]} {...dataAttrs('logo-sh', { v: o[0] })} onClick={() => set({ sh: o[0] })}>
          <Logo of={{ ...m, sh: o[0], ex: 'none', l: m.l }} dot={1} label={o[1]} /></button>)}</span></div>
        {row('Finish', 'fin', P.fins)}
        {sw('Shape colour', 'c1')}{sw('Trim colour', 'c2')}{sw('Letter colour', 'c3')}
        {row('One extra', 'ex', P.extras)}
        {m.ex === 'tag' ? <div class="mm-row"><span class="mm-l">Second line</span><span class="mm-opts"><input type="text" value={m.tag} maxLength={8} aria-label="A second line, up to eight letters" style={{ width: '12ch' }} {...dataAttrs('logo-tag')}
          onInput={e => set({ tag: (e.currentTarget as HTMLInputElement).value })} /></span></div> : null}
        <div class="mm-right" role="group" aria-label="Ideas">
        <p class="mm-h"><span>Ideas from {m.l}</span><Btn kind="sm" t="logo-shuffle" onClick={() => view(() => { st.seed++; })}>Shuffle</Btn></p>
        <div class="mm-ideas">{ideas.map((x, i) => <button type="button" class="mm-s" aria-label={'Idea ' + (i + 1) + ': take this logo'} {...dataAttrs('logo-idea', { v: i })} onClick={() => set(x)}><Logo of={x} dot={2} label={'Idea ' + (i + 1)} /></button>)}</div>
      </div>
      </div>
    </div>
  </Window>;
}
