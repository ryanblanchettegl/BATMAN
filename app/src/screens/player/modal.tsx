/* Create a Player in a game: over the whole screen, from a wrestler's file on the Roster page (edit them) or from
   Create a wrestler on Free agents (a new wrestler, who goes to free agency). Save goes through the engine
   (E.setLook, E.createWrestler). Only the World Editor puts somebody straight into a company. */
import { E } from '../../engine';
import { G, Modal, act, closeModal, me } from '../../store';
import { CreatePlayer } from './index';
import { cardOf } from '../../kit/portrait';

export function PlayerModal(p: { m: Modal }) {
  const S = G.S, P = me(), id = p.m.id, nm = P ? P.name : 'your company';
  if (id === 'new') return <CreatePlayer key="new" world={nm} w={null} had={null} sign scenes={E.worldScenes(S)} onSave={() => ({ ok: false, msg: '' })} onDone={closeModal} />;
  const w = S && S.w[id]; if (!w) return null;
  const run = (fn: () => any) => { let r: any = null; act(() => { r = fn(); }); return r || { ok: false, msg: 'That did not work.' }; };
  return <CreatePlayer key={'w' + id} world={nm} w={w} had={w.look || null} card={cardOf(w)} scenes={E.worldScenes(S)} onSave={lk => run(() => E.setLook(S, id, lk))} onForget={() => run(() => E.clearLook(S, id))} onDone={closeModal} />;
}
