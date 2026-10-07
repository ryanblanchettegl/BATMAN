/* The kit sheet: every part of the new look on one screen, with real people from the game in it.
   It is a page for building and testing the look (app/tests/kit.js). It is on no menu: go('kit') opens it. */
import { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';
import { E, W } from '../../engine';
import { G, openModal } from '../../store';
import { Btn, Tag, Meter, Name, Portrait, Desktop, Win, Group, Line, ListBox, Row, Answer, Tabs, showResult } from '../../kit';

function Kit() {
  const S = G.S, P = S.promos[S.player];
  const R: W[] = E.rosterOf(S, S.player).filter((w: W) => !w.nw).sort((a: W, b: W) => b.ovr - a.ovr).slice(0, 7);
  const [pick, setPick] = useState<number>(R.length ? R[0].id : -1), [tab, setTab] = useState('all');
  const w = R.find(x => x.id === pick) || R[0];
  const said = (t: string) => showResult('The kit', t);
  return <div class="onescreen"><Desktop cls="kitsheet" t="kit">
    <Win title="The list box" right={R.length + ' of ' + E.rosterOf(S, S.player).length} t="kit-list">
      <ListBox cols="1.3em minmax(0,1fr) 8ch 5ch" label="The top of the roster" head={<><span /><span>Name</span><span>Popular</span><span>Mood</span></>}>
        {R.map(x => <Row key={x.id} sel={x.id === pick} onPick={() => setPick(x.id)} t="kit-row" d={{ id: x.id }} label={x.name}>
          <Portrait w={x} /><b>{x.name}</b><Meter v={x.ovr} n={8} kind="cool" /><Meter v={x.morale} n={5} kind={x.morale < 40 ? 'hot' : undefined} />
        </Row>)}
      </ListBox>
    </Win>
    <Win title={w ? w.name : 'Nobody'} right={P.name} t="kit-person">
      {w && <>
        <div class="row top nowrap"><Portrait w={w} cls="m" /><div>
          <p class="big"><Name w={w} /></p>
          <p class="muted">Age {w.age} {'·'} {E.STYLE_NAME[w.style] || w.style}</p>
          <p><Tag kind={w.align === 'F' ? 'face' : 'heel'}>{w.align === 'F' ? 'Hero' : 'Heel'}</Tag>{w.morale < 40 && <Tag kind="bad">Unhappy</Tag>}{w.inj > 0 && <Tag kind="bad">Hurt</Tag>}{w.ovr >= 80 && <Tag kind="gold">Star</Tag>}</p>
        </div></div>
        <Group title="How they stand">
          <Line label="Popularity"><Meter v={w.ovr} kind="cool" /> <b class="bl">{Math.round(w.ovr)}</b></Line>
          <Line label="Mood"><Meter v={w.morale} kind={w.morale < 40 ? 'hot' : undefined} /> <span class={w.morale < 40 ? 'bad' : 'good'}>{w.morale < 40 ? 'low' : (w.morale >= 70 ? 'good' : 'steady')}</span></Line>
        </Group>
        <Group title="Things to do">
          <Btn t="kit-talk" cost="1 point" onClick={() => said('A green button does the thing. This one would cost a point.')}>Sit down</Btn>
          <Btn kind="less" t="kit-later" onClick={() => said('A grey button is the lesser choice.')}>Not now</Btn>
        </Group>
      </>}
    </Win>
    <Win title="Wants an answer" tone="hot" right="Friday" t="kit-hot">
      <p>A red bar wants an answer.</p>
      <Answer t="kit-ans-1" note="safe" onClick={() => said('The safe answer.')}>Do as the office asks</Answer>
      <Answer kind="go" t="kit-ans-2" note="60% chance" onClick={() => said('An attempt with a 60% chance.')}>Find a way round</Answer>
      <Answer kind="danger" t="kit-ans-3" note="remembered" onClick={() => said('The one that hurts.')}>Refuse</Answer>
      <Answer kind="less" t="kit-ans-4" disabled note="not this week">Ask the owner</Answer>
    </Win>
    <Win title="Tags and bars" t="kit-tags">
      <p><Tag kind="bad">Today</Tag><Tag kind="off">To do</Tag><Tag kind="good">Good</Tag><Tag kind="info">Required</Tag><Tag kind="warn">Late</Tag></p>
      <Group title="Bars">
        <Line label="Ten wide"><Meter v={72} /></Line>
        <Line label="Eight wide"><Meter v={55} n={8} kind="cool" /></Line>
        <Line label="Five wide"><Meter v={30} n={5} kind="hot" /> <Meter v={80} n={5} kind="au" /></Line>
      </Group>
    </Win>
    <Win title="Buttons" right="four kinds" t="kit-buttons">
      <p><Btn t="kit-b1" onClick={() => said('Green: the ordinary button.')}>Do it</Btn><Btn kind="go" t="kit-b2" onClick={() => said('Yellow: the one that moves things on.')}>Move on</Btn></p>
      <p><Btn kind="less" t="kit-b3" onClick={() => said('Grey: the lesser choice.')}>Wait</Btn><Btn kind="danger" t="kit-b4" onClick={() => said('Red: the one that hurts.')}>Hurt</Btn><Btn t="kit-b5" disabled>Cannot yet</Btn></p>
      <Tabs label="A row of switches" items={[{ id: 'all', label: 'Everybody' }, { id: 'hurt', label: 'Hurt' }, { id: 'low', label: 'Unhappy' }]} value={tab} onPick={setTab} />
    </Win>
    <Win title="A night to remember" tone="gold" right={P.name} t="kit-gold">
      <p>Gold is for a celebration. Text is <b>black</b>, <span class="bl">blue for names</span>, <span class="bad">red for trouble</span>, <span class="good">green for good news</span>, <span class="muted">grey for notes</span>.</p>
      <p><Btn kind="go" t="kit-popup" onClick={() => openModal({ kind: 'info', title: 'A pop-up in the new look', body: () => <><p>Pop-ups wear the same bevel and blue bar as the windows.</p><p class="good">Good news is dark green.</p><p class="bad">Trouble is dark red.</p></> })}>Open a pop-up</Btn></p>
    </Win>
  </Desktop></div>;
}
export const pages: Record<string, () => ComponentChildren> = { kit: Kit };
