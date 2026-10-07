import { ComponentChildren } from 'preact';
import { useEffect, useRef } from 'preact/hooks';
import { closeModal } from '../store';
import { Btn } from './index';

/** The grey DOS pop-up. One is open at a time (ui.modal). Esc and the Back button close it. */
export function Window(p: { title: string; wide?: boolean; children: ComponentChildren; ok?: string; noOk?: boolean; hint?: string; footer?: ComponentChildren; onClose?: () => void }) {
  const close = p.onClose || closeModal;
  const box = useRef<HTMLDivElement>(null);
  // focus moves into the window when it opens and returns to where it was when it closes. It lands on the button that
  // closes it, unless something in the window is marked data-first (the thing the player just came back from).
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null, el = box.current;
    if (el) { const first = (el.querySelector('.wb [data-first]') || el.querySelector('#modal-ok') || el.querySelector('.wb button, .wb select, .wb input') || el.querySelector('button')) as HTMLElement | null; if (first) first.focus(); }
    return () => { if (prev && prev !== document.body && document.contains(prev)) { try { prev.focus({ preventScroll: true }); } catch (e) { /* ignore */ } } };
  }, []);
  // Tab and Shift+Tab go round inside the window and never reach the page behind it
  const trap = (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !box.current) return;
    const L = ([].slice.call(box.current.querySelectorAll('button:not([disabled]),select:not([disabled]),input:not([disabled]),textarea,a[href],[tabindex="0"]')) as HTMLElement[]).filter(x => x.getBoundingClientRect().width > 0);
    if (!L.length) return;
    const first = L[0], last = L[L.length - 1], ae = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (ae === first || !box.current.contains(ae))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (ae === last || !box.current.contains(ae))) { e.preventDefault(); first.focus(); }
  };
  return <div class="scrim">
    <div ref={box} onKeyDown={trap} class={'win' + (p.wide ? ' wide' : '')} role="dialog" aria-modal="true" aria-label={p.title}>
      <div class="wt"><span>{p.title}</span><button type="button" data-t="modal-close" aria-label="Close" onClick={close}>[{'■'}]</button></div>
      <div class="wb">{p.children}</div>
      <div class="wf">{p.footer}{!p.noOk && <Btn kind="go" id="modal-ok" t="modal-close" onClick={close}>{p.ok || 'OK'}</Btn>}<span class="muted opt">{p.hint || 'Esc closes'}</span></div>
    </div>
  </div>;
}
