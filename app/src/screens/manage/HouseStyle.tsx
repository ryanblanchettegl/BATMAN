/* The house style: what kind of promotion this is. Only an owner sets it; a booker reads it on Company. */
import { E } from '../../engine';
import { G, me, act, view, say } from '../../store';
import { Panel, Btn, Meter } from '../../kit';
import { co, Creed } from './state';

/** One of the three house-style choices. The pick is view state until "Set the house style" is pressed. */
function CreedRow(p: { kind: keyof Creed; table: Record<string, any>; cur: string; label: string }) {
  const st = co(), c = (st.creed && st.creed[p.kind]) || p.cur;
  return <>
    <p class="eyebrow">{p.label}</p>
    <div class="row opts">{Object.keys(p.table).map(k =>
      <Btn kind="sm" on={k === c} t="creed-pick" d={{ k: p.kind, v: k }} onClick={() => view(() => { st.creed = st.creed || {}; st.creed[p.kind] = k; })}>{p.table[k].n}</Btn>)}</div>
    <p class="muted mt1 mb2">{p.table[c].d}</p>
  </>;
}

function TrueToCrowd() { const S = G.S; return <>True to the crowd <Meter v={S.creedScore} kind="cool" /> {S.creedScore}.</>; }

export function HouseStyle() {
  const S = G.S, o = S.owner, P = me(), st = co();
  if (!o.me) return <Panel title="House style">
    <p>The house style is <b>{o.name}</b>{'’'}s to set: {E.STYLES[o.style].n}, {E.ROOTS[o.roots].n}, {E.PLEDGE[o.pledge].n}.</p>
    <p class="muted mt1">Reach booker level 5 with {o.name}{'’'}s trust at 80 and {P.name} can become yours. Then you choose it here.</p>
  </Panel>;
  const save = () => act(() => {
    const c = st.creed || {};
    const r = E.setCreed(S, { style: c.style || o.style, roots: c.roots || o.roots, pledge: c.pledge || o.pledge });
    st.creed = null;
    say(r);
  });
  return <Panel title="Your house style">
    {o.pending ? <p class="mark mb1">The company is yours. Decide what kind of promotion it is.</p> : null}
    <CreedRow kind="style" table={E.STYLES} cur={o.style} label="What wins matches here?" />
    <CreedRow kind="roots" table={E.ROOTS} cur={o.roots} label="What does your crowd expect?" />
    <CreedRow kind="pledge" table={E.PLEDGE} cur={o.pledge} label="What do you promise the locker room?" />
    <div class="row"><Btn kind="go" t="creed-save" onClick={save}>Set the house style</Btn><span class="muted"><TrueToCrowd /> You can change this once every 12 weeks.</span></div>
  </Panel>;
}
