/* The tip: a slip of paper with the longer words for whatever the pointer is over (Ryan, 19 October: buttons say one
   or two words, "people can hover for description"). Anything with data-tip has one. Nothing depends on hover (rule
   5): the tip also opens when a key or a pad moves the focus there, and on a long press on a touch screen. It is one
   element for the whole game, fixed above everything, so no window can cut it off. */
let el: HTMLDivElement | null = null, cur: Element | null = null, timer = 0, press = 0;
function show(t: Element, now = false) {
  const txt = t.getAttribute('data-tip'); if (!txt) return;
  cur = t; clearTimeout(timer);
  timer = window.setTimeout(() => {
    if (cur !== t || !el) return;
    el.textContent = txt; el.classList.add('on');
    const r = t.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight, vw = innerWidth, vh = innerHeight;
    let x = r.left + r.width / 2 - w / 2, y = r.bottom + 8;
    if (y + h > vh - 6) y = r.top - h - 8;
    x = Math.max(6, Math.min(vw - w - 6, x));
    el.style.left = x + 'px'; el.style.top = Math.max(6, y) + 'px';
  }, now ? 0 : 380);
}
function hide() { cur = null; clearTimeout(timer); if (el) el.classList.remove('on'); }
const tipOf = (e: Event) => (e.target as Element | null)?.closest?.('[data-tip]') || null;
export function mountTips() {
  if (el) return;
  el = document.createElement('div'); el.className = 'tipslip'; el.setAttribute('role', 'tooltip'); el.setAttribute('data-t', 'tip'); document.body.appendChild(el);
  document.addEventListener('pointerover', e => { if ((e as PointerEvent).pointerType === 'touch') return; const t = tipOf(e); if (t) show(t); else if (cur) hide(); });
  document.addEventListener('pointerout', e => { const t = tipOf(e); if (t && t === cur && !t.contains((e as PointerEvent).relatedTarget as Node)) hide(); });
  document.addEventListener('focusin', e => { const t = tipOf(e); if (t && (t as HTMLElement).matches(':focus-visible')) show(t); else hide(); });
  document.addEventListener('focusout', () => hide());
  // a long press on a touch screen
  document.addEventListener('pointerdown', e => { hide(); if ((e as PointerEvent).pointerType !== 'touch') return; const t = tipOf(e); clearTimeout(press); if (t) press = window.setTimeout(() => show(t, true), 450); });
  document.addEventListener('pointerup', () => clearTimeout(press));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
  document.addEventListener('scroll', hide, true);
}
