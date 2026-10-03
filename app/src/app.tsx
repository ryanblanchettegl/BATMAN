/* The root. Chooses between the boot sequence, the start screens and the game frame, and hosts the one pop-up. */
import { ComponentChildren } from 'preact';
import { useEffect, useReducer } from 'preact/hooks';
import { G, ui, Modal, onRedraw } from './store';
import { afterDraw, applyScreen } from './input';
import { MenuBar, SubNav, StatusBar, FlashBar, drainToasts } from './shell/Frame';
import { Window } from './kit';
import { CardHost } from './shared/cards';
import * as start from './screens/start';
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

export function App() {
  const [, force] = useReducer((x: number) => x + 1, 0);
  onRedraw(() => force(0));
  applyScreen();
  useEffect(() => { afterDraw(); drainToasts(); });
  if (ui.boot) return <start.Boot />;
  const S = G.S;
  if (!S) return <>{ui.setup ? <start.Setup /> : (ui.scr === 'select' ? <start.Select /> : <start.Title />)}<ModalHost /></>;
  const P = PAGES[ui.page] || PAGES.desk;
  return <>
    <div class="crt">
      <MenuBar />
      <main class="main"><FlashBar />{S.over ? <office.GameOver /> : <><SubNav /><P /></>}</main>
      <StatusBar />
    </div>
    <CardHost />
    <ModalHost />
  </>;
}
