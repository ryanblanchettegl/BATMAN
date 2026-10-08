/* A person's file, in a pop-up (docs/mockups/final/bs-full-1-dossier.png): who they are, why they are in the building,
   how they stand, what they remember about you, the people around them, and what you can do about it now.
   The engine reads it all in one call (E.dossier); the room above Backstage's people is E.roomInfo. */
import { E } from '../../engine';
import { G, act, say, openModal, Modal } from '../../store';
import { Window, Group, Line, Meter, Tag, Name, Empty, Answer, showResult, Txt } from '../../kit';
import { Portrait } from '../../kit/portrait';

export function openDossier(id: number) { openModal({ kind: 'dossier', id }); }

const sign = (d: number) => d > 0 ? '▲ ' + d : (d < 0 ? '▼ ' + (-d) : 'no change');
export function DossierWindow(p: { m: Modal }) {
  const S = G.S, D = E.dossier(S, p.m.id);
  if (!D) return <Window title="Their file"><Empty>They are not on your roster any more.</Empty></Window>;
  const w = S.w[D.id], H = D.here;
  const spend = (a: any) => act(() => { const r = E.peopleDo(S, H.pid, a.id); say(r.msg, { err: !r.ok }); showResult(D.name, r.msg, !r.ok); });
  const who = (x: any, foe: boolean) => <p class="one dz-who" key={x.id}><Portrait w={S.w[x.id]} /><Name w={S.w[x.id]} /> <span class={foe ? 'bad' : 'good'}>{foe ? (x.bond <= -60 ? 'real heat' : 'no love lost') : (x.bond >= 60 ? 'close friend' : 'friend')}</span>{x.why ? <span class="muted"> {'·'} <Txt>{x.why}</Txt></span> : null}</p>;
  return <Window title={D.name} wide ok="Back">
    <div class="dz" data-t="dossier" data-id={D.id}>
      <div class="dz-head"><Portrait w={w} cls="m" /><div>
        <p class="bl dz-name">{D.name}</p>
        <p>{D.align === 'F' ? 'Hero' : (D.align === 'H' ? 'Heel' : 'In between')} {'·'} {D.age} {'·'} {D.town ? 'from ' + D.town : 'from nowhere in particular'}</p>
        <p class="muted">{D.con} {D.con === 1 ? 'week' : 'weeks'} left {'·'} {E.money(D.wage)} a week{D.hurt ? <span class="bad"> {'·'} hurt, {D.hurt} {D.hurt === 1 ? 'week' : 'weeks'}</span> : null}</p>
      </div></div>
      <Group title="What is going on" t="dz-here">
        {H ? <p><Tag kind={H.tone === 'bad' ? 'bad' : 'info'}>{H.place}</Tag><Txt>{H.why}</Txt>.{H.story ? <span class="muted"> {H.story}.</span> : null}</p>
          : <p class="muted">Not waiting on you this week.</p>}
        {D.feuds.length ? <p class="muted">{D.feuds.map((f: any) => f.label + ' (' + f.stage.toLowerCase() + ')').join('. ')}.</p> : null}
      </Group>
      <Group title="How they stand" t="dz-stand">
        <Line label="Mood" w={10}><Meter v={D.mood.v} n={8} kind={D.mood.v < 40 ? 'hot' : undefined} /> <b>{D.mood.w}</b>{D.mood.d != null ? <span class={D.mood.d < 0 ? 'bad' : (D.mood.d > 0 ? 'good' : 'muted')}> {sign(D.mood.d)} since the show</span> : null}</Line>
        <Line label="With you" w={10}><Meter v={50 + D.you.v / 2} n={8} kind="cool" /> {D.you.w}</Line>
        <Line label="Stress" w={10}><Meter v={D.stress.v} n={8} kind={D.stress.v >= 55 ? 'hot' : undefined} /> {D.stress.w}</Line>
      </Group>
      <Group title="They remember" t="dz-mem">
        {D.remember.length ? D.remember.map((m: any, i: number) => <p key={i}><Tag kind={m.v < 0 ? 'bad' : (m.v > 0 ? 'good' : 'off')}>{m.ago <= 0 ? 'This week' : (m.ago === 1 ? 'Last week' : m.ago + ' weeks ago')}</Tag><Txt>{m.t}</Txt></p>) : <p class="muted">Nothing about you yet. Everything you do from here, they will.</p>}
      </Group>
      <Group title="The people around them" t="dz-ties">
        {D.friends.length || D.rivals.length ? <>{D.friends.map((x: any) => who(x, false))}{D.rivals.map((x: any) => who(x, true))}</> : <p class="muted">Nobody close, and nobody against them.</p>}
      </Group>
      <Group title="What you can do" t="dz-acts">
        {H && H.acts.length ? H.acts.map((a: any) => <Answer key={a.id} kind={/_no$/.test(a.id) ? 'less' : 'go'} t="dz-do" d={{ v: a.id }} disabled={H.used || (S.ap <= 0 && !a.free)} note={(a.p != null ? a.p + '% chance · ' : '') + a.cost} onClick={() => spend(a)}>{a.n}</Answer>)
          : <p class="muted">Nothing they are asking of you this week. Backstage shows who is.</p>}
        {H && H.used ? <p class="muted">You have already spent time with them this week.</p> : null}
      </Group>
    </div>
  </Window>;
}

/** One line about the whole locker room, for the top of Backstage. */
export function RoomLine() {
  const R = E.roomInfo(G.S);
  return <p data-t="room-line"><b>The room:</b> {R.trust.w.toLowerCase()} {'·'} the mood is {R.mood.w.toLowerCase()}{R.mood.d != null && R.mood.d !== 0 ? <span class={R.mood.d < 0 ? 'bad' : 'good'}> ({R.mood.d > 0 ? 'up' : 'down'} since the show)</span> : null}
    {' · '}<span class={R.unhappy ? 'bad' : undefined}>{R.unhappy} unhappy</span>{' · '}<span class={R.hurt ? 'bad' : undefined}>{R.hurt} hurt</span>
    {' · '}{R.circles.length} {R.circles.length === 1 ? 'circle' : 'circles'}{R.heatN ? <span class="bad"> {'·'} {R.heatN} {R.heatN === 1 ? 'pair' : 'pairs'} with real heat{R.heat[0] ? ', worst ' + R.heat[0].a + ' and ' + R.heat[0].b : ''}</span> : null}</p>;
}
