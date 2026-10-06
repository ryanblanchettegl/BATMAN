/* This week's tasks, on the desk: everything that should be filled in before a show is booked or the week ends.
   Each one has a button that takes you to it, and where it can wait, a button to leave it for another week. */
import { E } from '../../engine';
import { G, act, say } from '../../store';
import { go } from '../../nav';
import { Btn, Tag, Txt } from '../../kit';
import { office } from './util';
import { openVoices, openFace } from './Windows';

const TAG: Record<string, [string, 'warn' | 'good' | 'bad' | undefined]> = { todo: ['Must do', 'warn'], optional: ['Worth doing', undefined], waved: ['Not this week', undefined], done: ['Done', 'good'] };

function open(t: any) {
  if (t.id === 'ap') { go('backstage'); return; }
  if (t.id === 'desk-pbp' || t.id === 'desk-col') { openVoices(t.id === 'desk-col' ? 'col' : 'pbp'); return; }   // answered in a pop-up, without leaving the Office
  if (t.id === 'face') { openFace(); return; }
  if (t.id === 'inbox') { const el = document.querySelector('[data-t="ev"]') as HTMLElement | null; if (el) { el.scrollIntoView({ block: 'center' }); el.focus(); } return; }
  go(t.to);
}

export function Tasks() {
  const S = G.S, T = E.tasks(S);
  return <div class="tasks">
    <p class="eyebrow">This week{'’'}s tasks</p>
    {T.list.length ? <ul class="list">{T.list.map((t: any) => <li key={t.id} class={'task ' + t.state + (t.state === 'todo' && T.strict ? ' must' : '')} data-task={t.id}>
      <span>{t.state === 'todo' && T.strict ? <span class="mark" aria-hidden="true">!</span> : null}<Tag kind={t.req ? 'bad' : TAG[t.state][1]}>{t.req ? 'Required' : (t.state === 'todo' && !T.strict ? 'To do' : TAG[t.state][0])}</Tag> <span class={t.state === 'done' || t.state === 'waved' ? 'muted' : undefined}><Txt>{t.text}</Txt></span></span>
      <span class="row opts">
        {t.state === 'todo' || t.state === 'optional' ? <Btn kind="sm" t="task-go" d={{ v: t.id }} onClick={() => open(t)}>{t.label}</Btn> : null}
        {t.state === 'todo' && t.waive ? <Btn kind="sm" t="task-wave" d={{ v: t.id }} onClick={() => act(() => { const r = E.taskWave(S, t.id); say(r.msg, { err: !r.ok }); })}>Not this week</Btn> : null}
        {t.state === 'waved' ? <Btn kind="sm" t="task-unwave" d={{ v: t.id }} onClick={() => act(() => { E.taskUnwave(S, t.id); })}>Put it back</Btn> : null}
      </span></li>)}</ul> : <p class="good">Nothing is waiting on your desk this week.</p>}
    <div class="row opts mt1"><span class="muted">From the desk:</span><Btn kind="sm" t="open-voices" onClick={() => openVoices()}>Commentary desk</Btn></div>
    {T.list.length ? <p class="muted mt1" data-t="task-note">{!T.strict ? 'Reminders only. You turned off the rule that tasks come first (Options).'
      : (T.todo ? T.todo + ' to do. ' + (T.show ? 'A show cannot run until ' + (T.show === 1 ? 'it is' : 'they are') + ' done or left for another week.' : 'The week cannot end until ' + (T.todo === 1 ? 'it is' : 'they are') + ' done.') : 'Everything that had to be done is done.')}</p> : null}
  </div>;
}
