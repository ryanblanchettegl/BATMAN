/* Web: the dirt sheet, the chat room and Wrestle Search on one page (Ryan, 14 October). All of it is information: nothing to decide here. */
import { Desktop, Win } from '../../kit';
import { Sheet } from './Sheet';
import { Feed } from './Feed';
import { Search } from './Search';

export function Web() {
  return <>
    <div class="head sr"><h1>Web</h1></div>
    <Desktop cls="webpage" t="web">
      <Win title="Dirt sheet" area="sheet" t="web-sheet"><Sheet /></Win>
      <Win title="Chat room" area="feed" t="web-feed"><Feed /></Win>
      <Win title="Wrestle Search" area="boards" t="web-boards"><Search /></Win>
    </Desktop>
  </>;
}
