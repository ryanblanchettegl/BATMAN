/* The Titles page: who holds what, the running tournament, and the contenders for each singles title. */
import { ComponentChildren } from 'preact';
import { E, W } from '../../engine';
import { G, me, act, say, plural, openModal, slice, view } from '../../store';
import { Btn, Tag, Name, Meter, Empty, Desktop, Win, brandName, TitleName, Sel, Opt } from '../../kit';

/** Names joined the way a card reads: "A & B". */
function joined(items: ComponentChildren[], sep: ComponentChildren): ComponentChildren[] { const out: ComponentChildren[] = []; items.forEach((x, i) => { if (i) out.push(sep); out.push(x); }); return out; }

function Tourn() {
  const S = G.S, T = S.tourn; if (!T) return null;
  const who = (id: number, won: boolean) => won ? <b>{S.w[id].name}</b> : S.w[id].name;
  const res = (r: any) => <li><span>{who(r.a, r.w === r.a)} <span class="muted">vs</span> {who(r.b, r.w === r.b)}</span><span class="muted">{r.bye ? 'Walkover' : (r.w < 0 ? 'Draw' : 'Wk ' + r.week)}</span></li>;
  const todo = (p: number[]) => <li><span><Name w={S.w[p[0]]} /> <span class="muted">vs</span> <Name w={S.w[p[1]]} /></span><Tag>To run</Tag></li>;
  let body: ComponentChildren;
  if (T.fmt === 'rr') {
    const left: Record<number, number> = {}; T.pend.forEach((p: number[]) => { left[p[0]] = (left[p[0]] || 0) + 1; left[p[1]] = (left[p[1]] || 0) + 1; });
    const table: number[] = T.ents.slice().sort((a: number, b: number) => (T.pts[b] - T.pts[a]) || (S.w[b].ovr - S.w[a].ovr));
    body = <>
      <div class="tw"><table>
        <thead><tr><th>#</th><th>Wrestler</th><th class="r">Points</th><th class="r">Matches left</th></tr></thead>
        <tbody>{table.map((id, i) => <tr><td class="num">{i + 1}</td><td><Name w={S.w[id]} /></td><td class="r num">{T.pts[id]}</td><td class="r num">{left[id] || 0}</td></tr>)}</tbody>
      </table></div>
      <p class="muted mt1">Two points for a win, one each for a draw.</p>
      {T.pend.length > 0 && <ul class="list mt2">{T.pend.slice(0, 3).map(todo)}</ul>}
      {T.pend.length > 3 && <p class="muted">And {T.pend.length - 3} more.</p>}
    </>;
  } else {
    const RN = ['', 'Quarter-finals', 'Semi-finals', 'Final'], rounds: ComponentChildren[] = [];
    for (let r = 1; r <= T.round; r++) {
      const done = T.res.filter((x: any) => x.round === r), pn = r === T.round ? T.pend : [];
      if (!done.length && !pn.length) continue;
      rounds.push(<><p class="eyebrow mt2">{RN[r]}</p><ul class="list">{done.map(res)}{pn.map(todo)}</ul></>);
    }
    const drawn = T.res.length || T.round > 1 || T.pend.length;
    body = drawn ? <div class="bracket" aria-label="The bracket">{E.bracketLines(S, T).join('\n')}</div> : <>{rounds}</>;
  }
  return <Win title={T.name} area="tourn" t="tourn-win" right={T.done ? 'Done' : 'Running'}>
    {T.done ? <p class="good">Winner: <b>{S.w[T.champ].name}</b>.</p>
      : <p class="muted">Started {E.cal(T.start).label}. {T.pend.length} {plural(T.pend.length, 'match', 'matches')} still to run{T.fmt === 'ko' ? ' in this round' : ''}.</p>}
    {body}
  </Win>;
}

function Contenders(p: { t: any; busy: boolean }) {
  const S = G.S, t = p.t, L: W[] = E.rankFor(S, t.id, 5), ko = E.tournOk(S, t.id, 'ko'), rr = E.tournOk(S, t.id, 'rr');
  const start = (fmt: string) => act(() => { const r = E.startTourn(S, t.id, fmt); if (r) say(r, { err: !/is set/.test(r) }); });
  return <>
    <p><b>{t.name}</b></p>
    {L.length ? <ol class="rank">{L.map(w => <li><Name w={w} /> <span class="muted num">{Math.round(w.ovr)} {'·'} {Math.round(w.pts || 0)} pts</span>{w.shot === t.id ? <> <Tag kind="gold">Earned a shot</Tag></> : null}</li>)}</ol>
      : <Empty>Nobody is in line. Wins on your shows earn ranking points.</Empty>}
    <div class="row mt2">
      <Btn kind="sm" t="tourn" d={{ k: t.id, v: 'ko' }} disabled={!!ko} onClick={() => start('ko')}>Knockout (8)</Btn>
      <Btn kind="sm" t="tourn" d={{ k: t.id, v: 'rr' }} disabled={!!rr} onClick={() => start('rr')}>League (6)</Btn>
    </div>
    {ko && !p.busy ? <p class="muted">{ko}</p> : null}
  </>;
}

/** The picked belt's last few reigns, newest first, and a line on how a shot is earned. */
function Lineage(p: { t: any }) {
  const S = G.S, t = p.t, H: any[] = t ? (t.hist || []).slice(-5).reverse() : [];
  return <Win title={t ? 'The line of the ' + t.name.replace(/ (Title|Titles|Championship)$/, '') : 'The line'} area="tourn" t="lineage">
    {H.length ? <ul class="list">{H.map((r: any, i: number) => { const ids = String(r.ids).split(',').map(Number), wk = (r.to == null ? S.week : r.to) - r.from;
      return <li key={i}><span>{joined(ids.map(id => S.w[id] ? <Name w={S.w[id]} /> : <>{(r.h || [])[0] || 'Unknown'}</>), ' & ')} <span class="muted">{wk} {plural(wk, 'week')}{r.defs ? ', ' + r.defs + ' ' + plural(r.defs, 'defence') : ''}</span></span>{i === 0 && r.to == null ? <Tag kind="good">Now</Tag> : null}</li>; })}</ul>
      : <p class="muted">No reigns on record yet.</p>}
    {(() => { const A: any[] = t ? (t.hist || []).filter((r: any) => r.show !== 'Before your time' || r.to != null) : [], cnt: Record<string, number> = {};
      if (A.length < 2) return null;
      A.forEach((r: any) => { const k = String(r.ids); cnt[k] = (cnt[k] || 0) + 1; });
      const nm = (ids: any) => String(ids).split(',').map(Number).map(id => S.w[id] ? S.w[id].name : '?').join(' & ');
      const most = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0], len = (r: any) => (r.to == null ? S.week : r.to) - r.from;
      const lng = A.slice().sort((a: any, b: any) => len(b) - len(a))[0], dfs = A.slice().sort((a: any, b: any) => (b.defs || 0) - (a.defs || 0))[0];
      return <p class="mt1" data-t="title-records"><b>Records:</b> {cnt[most] > 1 ? <>most reigns, {nm(most)} ({cnt[most]}); </> : null}longest, {nm(lng.ids)} ({len(lng)} {plural(len(lng), 'week')}){dfs.defs ? <>; most defences, {nm(dfs.ids)} ({dfs.defs})</> : null}.</p>; })()}
    <p class="muted mt1">Wins earn ranking points, more at big events. A challenger who has not earned the shot gets a cold reception.</p>
  </Win>;
}
/** Which way a title's prestige has moved over the last four weeks. */
function trend(t: any) {
  const h: number[] = t.ph || [], d = h.length >= 5 ? t.prestige - h[h.length - 5] : 0;
  return d >= 0.5 ? <span class="good" title="Up over four weeks">{'▲'}</span> : (d <= -0.5 ? <span class="bad" title="Down over four weeks">{'▼'}</span> : <span class="muted" title="Level over four weeks">{'■'}</span>);
}
export function Titles() {
  const S = G.S, P = me(), busy = !!E.tournActive(S), st = slice<{ k: string | null }>('titles', () => ({ k: null }));
  const singles = P.titles.filter((t: any) => !t.tag), cur = singles.find((t: any) => t.id === st.k) || singles[0];
  // a title can belong to one weekly show (src/99-titleshow.js); the choice shows only when there is more than one
  const shows: any[] = (P.shows || []).filter((x: any) => !x.dead), many = shows.length > 1;
  const onShow = (t: any) => <Sel id={'tshow-' + t.id} t="title-show" d={{ k: t.id }} label={'Where the ' + t.name + ' is defended'} value={t.show || ''}
    onChange={v => act(() => { const r = E.setTitleShow(S, t.id, v || null); say(r.msg, { err: !r.ok }); })}
    options={[['', 'Any show'] as Opt].concat(shows.map((x: any) => [x.id, x.name.replace(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday) Night /, '')] as Opt))} />;
  return <div class="onescreen"><Desktop cls="ttpage" t="titles">
    <Win title={'Titles: ' + P.titles.length + ' belts'} area="belts" t="belts" right={P.titles.filter((t: any) => !t.holders.length).length + ' vacant'}>
      <div class="tw"><table>
        <thead><tr><th>Title</th>{P.brands && <th>Brand</th>}{many && <th>Defended on</th>}<th>Champion</th><th class="r">Reign</th><th class="r">Defences</th><th>Prestige</th><th class="r" title="Last defended">Last</th></tr></thead>
        <tbody>{P.titles.map((t: any) => <tr key={t.id}>
          <td><TitleName pid={P.id} t={t} /></td>
          {P.brands && <td>{brandName(P, t.brand)}</td>}
          {many && <td>{onShow(t)}</td>}
          <td>{t.holders.length ? joined(t.holders.map((id: number) => <Name w={S.w[id]} />), ' & ') : <span class="mark">Vacant</span>}{!t.holders.length && !t.tag && !busy ? <> <Btn kind="sm" t="tourn-vacant" d={{ k: t.id }} disabled={!!E.tournOk(S, t.id, 'ko')} onClick={() => act(() => { const r = E.startTourn(S, t.id, 'ko'); if (r) say(r, { err: !/is set/.test(r) }); })}>Start a tournament</Btn></> : null}</td>
          <td class="r num">{t.holders.length ? (S.week - t.since) + ' wk' : '—'}</td>
          <td class="r num">{t.defs}</td>
          <td><Meter v={t.prestige} kind="au" n={8} /> <span class="num">{Math.round(t.prestige)}</span> {trend(t)}</td>
          <td class="r num">{S.week - t.last === 0 ? 'This week' : (S.week - t.last) + ' wk ago'}</td>
        </tr>)}</tbody>
      </table></div>
      <div class="row"><Btn kind="sm" t="make-belts" onClick={() => openModal({ kind: 'makebelts' })}>Create or retire a belt</Btn><span class="muted">Put a title on the line when you book a match. Prestige follows the quality of title matches.</span></div>
    </Win>
    <Win title="Contenders" area="cont" t="contenders">
      {singles.length > 4 ? <Sel id="cont-pick" t="cont-sel" label="Title" value={cur.id} onChange={(v: string) => view(() => { st.k = v; })} options={singles.map((t: any) => [t.id, t.name] as Opt)} />
        : singles.length > 1 ? <div class="row">{singles.map((t: any) => <Btn key={t.id} kind="sm" on={t.id === cur.id} t="cont-pick" d={{ k: t.id }} onClick={() => view(() => { st.k = t.id; })}>{t.name.replace(/ (World )?(Heavyweight )?(Title|Championship|Titles)$/, '')}</Btn>)}</div> : null}
      {cur ? <Contenders t={cur} busy={busy} /> : <Empty>No singles titles.</Empty>}
    </Win>
    {S.tourn ? <Tourn /> : <Lineage t={cur} />}
  </Desktop></div>;
}
