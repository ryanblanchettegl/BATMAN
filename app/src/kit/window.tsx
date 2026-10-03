import { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { closeModal } from '../store';
import { Btn } from './index';

/** The grey DOS pop-up. One is open at a time (ui.modal). Esc and the Back button close it. */
export function Window(p: { title: string; wide?: boolean; children: ComponentChildren; ok?: string; noOk?: boolean; hint?: string; footer?: ComponentChildren; onClose?: () => void }) {
  const close = p.onClose || closeModal;
  const box = useRef<HTMLDivElement>(null);
  // focus moves into the window when it opens and returns to where it was when it closes
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null, el = box.current;
    if (el) { const first = (el.querySelector('#modal-ok') || el.querySelector('.wb button, .wb select, .wb input') || el.querySelector('button')) as HTMLElement | null; if (first) first.focus(); }
    return () => { if (prev && prev !== document.body && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } };
  }, []);
  return <div class="scrim">
    <div ref={box} class={'win' + (p.wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={p.title}>
      <div class="wt"><span>{p.title}</span><button type="button" data-t="modal-close" aria-label="Close" onClick={close}>[{'■'}]</button></div>
      <div class="wb">{p.children}</div>
      <div class="wf">{p.footer}{!p.noOk && <Btn kind="go" id="modal-ok" t="modal-close" onClick={close}>{p.ok || 'OK'}</Btn>}<span class="muted opt">{p.hint || 'Esc closes'}</span></div>
    </div>
  </div>;
}
