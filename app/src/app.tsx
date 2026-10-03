/* The root. Chooses between the boot sequence, the start screens and the game frame, and hosts the one pop-up. */
import { Component, ComponentChildren } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import { G, ui, Modal, VER, onRedraw } from './store';
import { afterDraw, applyScreen } from './input';
import { MenuBar, SubNav, StatusBar, FlashBar, drainToasts } from './shell/Frame';
import { Window, Panel, Btn } from './kit';
import { go } from './nav';
import { CardHost } from './shared/cards';
import * as start from './screens/start';
import { copyText } from './screens/start';
import { Editor } from './screens/editor';
import * as office from './screens/office';
import * as booking from './screens/booking';
import * as roster from './screens/roster';
import * as stories from './screens/stories';
import * as manage from './screens/manage';
import * as company from './screens/company';

type Page = () => ComponentChildren;
type ModalView = (p: { m: Modal }) => ComponentChildren;
const PAGES: Record<string, Page> = { ...office.pages, ...booking.pages, ...roster.pages, ...stories.pages, ...manage.pages, ...company.pages };
const MODALS: Record<string, ModalView> = { ...start.modals, ...office.modals, ...booking.modals, ...roster.modals, ...stories.modals, ...manage.modals, ...company.modals };

/** The open pop-up. `{kind:'info', title, body}` shows any content; other kinds are registered by the sections. */
function ModalHost() {
  const m = ui.modal; if (!m) return null;
  const V = MODALS[m.kind];
  if (V) return <V m={m} />;
  return <Window title={m.title || ''} wide={m.wide} ok={m.ok}>{typeof m.body === 'function' ? m.body() : m.body}</Window>;
}

/** If a page throws while drawing, say so, and offer the error to copy and a way back to the desk instead of a blank page. */
class Boundary extends Component<{ children?: ComponentChildren }, { err: any }> {
  state = { err: null as any };
  componentDidCatch(err: any) { this.setState({ err }); }
  render() {
    const err = this.state.err; if (!err) return this.props.children;
    const text = 'EWF 9000 ' + VER + ' page ' + ui.page + ' week ' + (G.S ? G.S.week : '-') + '\n' + String(err && (err.stack || err.message || err));
    return <Panel title="Something went wrong">
      <p>This page could not be drawn. Your game is safe: nothing was lost.</p>
      <p class="bad mt1">{String(err && err.message || err)}</p>
      <textarea id="err-text" class="savebox mt1" rows={4} readOnly value={text} />
      <div class="row mt2"><Btn t="err-copy" onClick={() => copyText(text, 'err-text')}>Copy the error</Btn>
        <Btn kind="go" t="err-desk" onClick={() => { this.setState({ err: null }); go('desk'); }}>Back to the desk</Btn></div>
    </Panel>;
  }
}

export function App() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  onRedraw(() => force(0));
  applyScreen();
  useEffect(() => { afterDraw(); drainToasts(); });
  if (ui.boot) return <start.Boot />;
  const S = G.S;
  if (!S) return <>{ui.setup ? <start.Setup /> : (ui.scr === 'editor' ? <Editor /> : (ui.scr === 'select' ? <start.Select /> : <start.Title />))}<ModalHost /></>;
  const P = PAGES[ui.page] || PAGES.desk;
  return <>
    <div class="crt">
      <MenuBar />
      <main class="main"><FlashBar />{S.over ? <office.GameOver /> : <><SubNav /><Boundary key={ui.page}><P /></Boundary></>}</main>
      <StatusBar />
    </div>
    <CardHost />
    <ModalHost />
  </>;
}
