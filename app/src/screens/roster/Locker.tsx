/* The Locker room page: the mood of the room, who plays which part in it, who is under strain and who is hurt. */
import { E, W } from '../../engine';
import { G, me, act, say } from '../../store';
import { Panel, Btn, Meter, Pie, Empty } from '../../kit';
import { rs, selected, pick } from './state';
import { RosterHead } from './Roster';
import { Profile } from './Profile';
import { zoneCls } from './LockerBlock';

/** A name that opens that wrestler's profile at the top of the page. After the profile closes, a remote lands back on the name. */
function Who(p: { id: number }) {
  const st = rs(), w = G.S.w[p.id];
  return <Btn kind="sm" t="sel" d={{ id: w.id, home: st.sel == null && st.last === w.id ? '' : undefined }} onClick={() => pick(w.id)}>{w.name}</Btn>;
}

export function Locker() {
  const S = G.S, P = me(), L = E.lockerRoom(S), R: W[] = E.rosterOf(S, P.id), mi = E.medInfo(S), sel = selected();
  return <>
    <RosterHead title="Locker room" />
    {sel && <Profile w={sel} />}
    <div class="cols">
      <div class="stack">
        <Panel title="Mood of the room">
          <Pie title="Morale across the roster" parts={[{ n: 'Content (70+)', v: L.happy }, { n: 'Getting by', v: L.ok }, { n: 'Unhappy (under 45)', v: L.unhappy }]} />
          <p class="mt2">{L.mood > 0 ? 'Your leaders are steadying the room: everybody’s morale settles ' + L.mood + ' higher.'
            : (L.mood < 0 ? <span class="bad">Something is dragging the room down: everybody{'’'}s morale settles {-L.mood} lower.</span> : 'Nobody is pulling the room up or down.')}</p>
          {!(L.roles.leader || []).length ? <p class="bad mt1">Nobody is keeping order. Scuffles and cases for the wrestlers{'’'} court are more likely until a veteran steps up.</p> : null}
        </Panel>
        <Panel title="Who is who">
          <ul class="list">{Object.keys(E.ROLE).map(k => {
            const ids: number[] = L.roles[k] || [];
            return <li class="col"><span><b>{E.ROLE[k].n}{ids.length > 1 ? 's' : ''}</b><br /><span class="muted">{E.ROLE[k].d}</span></span>
              <span>{ids.length ? ids.map(id => <><Who id={id} /> </>) : <span class="muted">Nobody</span>}</span></li>;
          })}</ul>
        </Panel>
        <Panel title="Cliques">
          {E.cliques(S).length ? <ul class="list">{E.cliques(S).map((c: any) => <li class="col"><span><b>{c.name}</b>{c.power ? <span class="muted"> · a star among them</span> : null}</span>
            <span>{c.m.map((w: W) => <><Who id={w.id} /> </>)}</span></li>)}</ul> : <Empty>Nobody is running in a pack. Friends form from good matches and long road trips.</Empty>}
          <p class="muted mt2">A group with a star in it will ask for favours together. Say yes, say no, or break them up.</p>
        </Panel>
        {E.staff(S).length ? <Panel title="Second careers">
          <ul class="list">{E.staff(S).map((s: any) => <li class="col"><span><Who id={s.id} /> <b>{s.role}</b><br /><span class="muted">{s.d}</span></span></li>)}</ul>
        </Panel> : null}
      </div>
      <div class="stack">
        <Panel title="Under strain">
          {L.trouble.length ? <ul class="list">{L.trouble.slice(0, 12).map((t: any) =>
            <li><span><Who id={t.id} /> <span class="muted">{t.why}</span></span><span class="row"><Meter v={t.stress} kind="hot" /><span class="num">stress {t.stress}</span></span></li>)}</ul>
            : <Empty>Nobody is close to the edge.</Empty>}
          <p class="muted mt2">Stress builds from bad pay, a push below expectations, broken promises, pain and overwork. At 75 somebody snaps.</p>
        </Panel>
        <Panel title="The trainer’s room">
          <p class="muted">{mi.names[mi.lvl]}. {R.filter(w => w.inj > 0).length} injured.</p>
          {L.hurt.length ? <ul class="list">{L.hurt.slice(0, 12).map((id: number) => {
            const w = S.w[id], z = E.zones(S, id).sort((a: any, b: any) => b.v - a.v)[0], resting = w.rest === S.week;
            return <li><span><Who id={id} /> <span class={zoneCls(z.v)}>{z.n} {z.v}</span></span>
              <Btn kind="sm" on={resting} t="rest" d={{ id }} onClick={() => act(() => say(E.rest(S, id)))}>{resting ? 'Resting' : 'Rest this week'}</Btn></li>;
          })}</ul> : <Empty>No bodies in the danger zone.</Empty>}
        </Panel>
      </div>
    </div>
  </>;
}
