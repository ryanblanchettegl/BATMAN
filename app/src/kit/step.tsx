/* Step through a list, the way the classic create-a-wrestler screens do it: ◀ the choice ▶, and the picture changes at
   once. It wraps a dropdown that is already there (a <select> or a Sel), so the dropdown still opens the whole list,
   its data-t still names it for the tests, and its onChange still does the work: the arrows only move it one step and
   fire its change. Left and Right do the same when the dropdown has the focus (a pad's d-pad too); Up and Down are
   left to move between lines. `onZone` is told which control is being changed, so the camera can move in on it.
   The whole name of the choice is shown, wrapping if it must, never cut short (Ryan, 20 October); the dropdown lies
   over it unseen, so pressing the name still opens the whole list. */
import { ComponentChildren } from 'preact';
import { useLayoutEffect, useRef, useState } from 'preact/hooks';

export function Step(p: { children: ComponentChildren; onZone?: (t: string, v: string) => void; label?: string }) {
  const box = useRef<HTMLSpanElement>(null), [count, setCount] = useState(''), [txt, setTxt] = useState('');
  const sel = () => box.current ? box.current.querySelector('select') as HTMLSelectElement | null : null;
  const zone = (s: HTMLSelectElement | null) => { if (s && p.onZone) p.onZone(s.getAttribute('data-t') || '', s.getAttribute('data-v') || ''); };
  const move = (d: number) => {
    const s = sel(); if (!s || s.disabled) return; const n = s.options.length; if (!n) return;
    let i = s.selectedIndex; for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!s.options[i].disabled) break; }
    if (i === s.selectedIndex) return; s.selectedIndex = i; s.dispatchEvent(new Event('change', { bubbles: true })); s.dispatchEvent(new Event('input', { bubbles: true })); zone(s);
  };
  // the count beside it and the whole name of the choice, read from the dropdown after each draw (never cut short)
  useLayoutEffect(() => { const s = sel(); const t = s && s.options.length > 1 ? (s.selectedIndex + 1) + ' / ' + s.options.length : ''; if (t !== count) setCount(t);
    const o = s && s.selectedIndex >= 0 ? s.options[s.selectedIndex] : null, n = o ? o.text : ''; if (n !== txt) setTxt(n); });
  const key = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName !== 'SELECT' || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); move(e.key === 'ArrowLeft' ? -1 : 1); }
  };
  const s0 = sel(), off = !!(s0 && s0.disabled), lab = p.label || (s0 && s0.getAttribute('aria-label')) || 'the choice';
  return <span class="step" ref={box} onKeyDown={key} onFocusCapture={() => zone(sel())}>
    <button type="button" class="step-b" data-t="step-prev" tabIndex={-1} disabled={off} aria-label={'Back one: ' + lab} onClick={() => move(-1)}>◀</button>
    <span class="step-mid"><span class="step-txt" aria-hidden="true">{txt}</span><span class="step-open" aria-hidden="true">▼</span>{p.children}</span>
    <button type="button" class="step-b" data-t="step-next" tabIndex={-1} disabled={off} aria-label={'On one: ' + lab} onClick={() => move(1)}>▶</button>
    {count ? <span class="step-n" aria-hidden="true">{count}</span> : null}
  </span>;
}
