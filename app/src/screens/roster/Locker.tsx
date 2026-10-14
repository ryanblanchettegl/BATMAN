/* The Locker room page: the mood of the room, who plays which part in it, who is under strain and who is hurt. */
import { E, W } from '../../engine';
import { useLayoutEffect } from 'preact/hooks';
import { G, ui, me, act, say, plural, slice, view } from '../../store';
import { onLeavePage } from '../../nav';
import { Btn, Meter, Pie, Empty, Desktop, Win, stars } from '../../kit';
import { rs, selected, pick } from './state';
import { Profile } from './Profile';
import { zoneCls } from './LockerBlock';

/** A name that opens that wrestler's profile at the top of the page. After the profile closes, a remote lands back on the name. */
function Who(p: { id: number }) {
  const st = rs(), w = G.S.w[p.id];
  return <Btn kind="sm" t="sel" d={{ id: w.id, home: st.sel == null && st.last === w.id ? '' : undefined }} onClick={() => pick(w.id)}>{w.name}</Btn>;
}

export function Locker() {
  const S = G.S, P = me(), L = E.lockerRoom(S), R: W[] = E.rosterOf(S, P.id), mi = E.medInfo(S), sel = selected();
  const flat = !!(window as any).EWF_FLAT, lim = slice<Record<string, number>>('lklim', () => ({})), cut = (n: number, k: string) => flat ? 99 : Math.min(n, lim[k] || n);
  // each window shows as many lines as it holds: one that runs over shows one fewer and is drawn again
  useLayoutEffect(() => { if (flat) return; let ch = false; ['who', 'cliques', 'camp', 'strain', 'hurt'].forEach(k => { const b = document.querySelector('[data-t="lk-' + k + '"] > .bd') as HTMLElement | null; if (b && b.scrollHeight > b.clientHeight + 1) { if ((lim[k] || 9) > 1) { lim[k] = (lim[k] || 9) - 1; ch = true; } else if (k === 'cliques' && (lim.cm || 9) > 2) { lim.cm = (lim.cm || 9) - 1; ch = true; } } }); if (ch) view(() => {}); });
  const D = E.devShow(S), C = E.cliques(S), ST = E.staff(S);
  return <div class="onescreen"><Desktop cls="lkpage" t="locker">
        <Win title="Mood of the room" area="mood" t="lk-mood">
          <Pie title="Morale across the roster" parts={[{ n: 'Content (70+)', v: L.happy }, { n: 'Getting by', v: L.ok }, { n: 'Unhappy (under 45)', v: L.unhappy }]} />
          <p class="mt2">{L.mood > 0 ? 'Your leaders are steadying the room: everybody’s morale settles ' + L.mood + ' higher.'
            : (L.mood < 0 ? <span class="bad">Something is dragging the room down: everybody{'’'}s morale settles {-L.mood} lower.</span> : 'Nobody is pulling the room up or down.')}</p>
          {!(L.roles.leader || []).length ? <p class="bad mt1">Nobody is keeping order. Scuffles and cases for the wrestlers{'’'} court are more likely until a veteran steps up.</p> : null}
        </Win>
        <Win title="Who is who" area="who" t="lk-who">
          <ul class="list">{Object.keys(E.ROLE).map(k => {
            const ids: number[] = L.roles[k] || [];
            return <li class="col" title={E.ROLE[k].d}><span><b>{E.ROLE[k].n}{ids.length > 1 ? 's' : ''}</b></span>
              <span>{ids.length ? ids.slice(0, cut(3, 'who')).map(id => <><Who id={id} /> </>) : <span class="muted">Nobody</span>}{ids.length > cut(3, 'who') ? <span class="muted"> +{ids.length - cut(3, 'who')}</span> : null}</span></li>;
          })}{ST.length ? <li class="col"><span><b>Second careers</b></span><span>{ST.slice(0, cut(3, 'who')).map((x: any) => <><Who id={x.id} /> </>)}</span></li> : null}</ul>
        </Win>
        <Win title="Cliques" area="cliques" t="lk-cliques" right={C.length ? String(C.length) : undefined}>
          {C.length ? <ul class="list">{C.slice(0, cut(3, 'cliques')).map((c: any) => <li class="col"><span><b>{c.name}</b>{c.power ? <span class="muted"> · a star among them</span> : null}</span>
            <span>{c.m.slice(0, cut(9, 'cm')).map((w: W) => <><Who id={w.id} /> </>)}{c.m.length > cut(9, 'cm') ? <span class="muted">+{c.m.length - cut(9, 'cm')}</span> : null}</span></li>)}</ul> : <Empty>Nobody is running in a pack. Friends form from good matches and long road trips.</Empty>}
          <p class="muted mt1">A group with a star in it will ask for favours together.</p>
        </Win>
        <Win title="The camp show" area="camp" t="lk-camp">
          {D.n ? <>
            <ul class="list">{D.rows.slice(0, cut(3, 'camp')).map((r: any) => <li class="col"><span><Who id={r.w.id} /> <span class="muted">{'·'} {r.matches} {plural(r.matches, 'match', 'matches')}, best {stars(r.best)}, ring {r.gain >= 0 ? '+' : '−'}{Math.abs(r.gain)}, promos {r.micGain >= 0 ? '+' : '−'}{Math.abs(r.micGain)}</span></span><span class="muted">{r.last}</span></li>)}</ul>
            <p class="muted mt1">A small show runs itself every week with the people in camp.</p>
          </> : <Empty>Nobody is in camp. Send two or more prospects from their profile and the camp puts on its own show.</Empty>}
        </Win>
        <Win title="Under strain" area="strain" t="lk-strain" tone={L.trouble.some((t: any) => t.stress >= 75) ? 'hot' : undefined} right={L.trouble.length ? String(L.trouble.length) : undefined}>
          {L.trouble.length ? <ul class="list">{L.trouble.slice(0, cut(5, 'strain')).map((t: any) =>
            <li><span><Who id={t.id} /> <span class="muted">{t.why}</span></span><span class="row"><Meter v={t.stress} kind="hot" /><span class="num">stress {t.stress}</span></span></li>)}</ul>
            : <Empty>Nobody is close to the edge.</Empty>}
          <p class="muted mt1">Stress builds from bad pay, a low push, broken promises, pain and overwork. At 75 somebody snaps.</p>
        </Win>
        <Win title="The trainer’s room" area="hurt" t="lk-hurt">
          <p class="muted">{mi.names[mi.lvl]}. {R.filter(w => w.inj > 0).length} injured.</p>
          {L.hurt.length ? <ul class="list">{L.hurt.slice(0, cut(5, 'hurt')).map((id: number) => {
            const w = S.w[id], z = E.zones(S, id).sort((a: any, b: any) => b.v - a.v)[0], resting = w.rest === S.week;
            return <li><span><Who id={id} /> <span class={zoneCls(z.v)}>{z.n} {z.v}</span></span>
              <Btn kind="sm" on={resting} t="rest" d={{ id }} onClick={() => act(() => say(E.rest(S, id)))}>{resting ? 'Resting' : 'Rest this week'}</Btn></li>;
          })}</ul> : <Empty>No bodies in the danger zone.</Empty>}
        </Win>
    {sel ? <div class="rsfull" role="dialog" aria-label={'Profile of ' + sel.name}><div class="rsfull-in"><Profile w={sel} /></div></div> : null}
  </Desktop></div>;
}

/* The fitted lengths are worked out again on the next visit, at whatever size the window is then. */
onLeavePage(() => { delete (ui.slices as any).lklim; });
