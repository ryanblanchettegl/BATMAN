/* Manage: the choices that run the company. Operations (broadcast slot, settings, universe export), House (house style
   and house rules) and Deals (sponsors, rival promotions, trades). Company shows what these add up to and offers no choices. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Operations, House, Deals, ExportWindow } from './Operations';

export const pages: Record<string, () => ComponentChildren> = { manage: Operations, house: House, deals: Deals };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = { 'export': ExportWindow };
