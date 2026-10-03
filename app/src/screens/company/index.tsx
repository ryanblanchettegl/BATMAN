/* Company: information only. Where the company stands (Overview), its money (Finances) and the world around it (World).
   Everything that is a choice lives in the Manage section. */
import { ComponentChildren } from 'preact';
import { Modal } from '../../store';
import { Overview } from './Overview';
import { Finances } from './Finances';
import { World } from './World';

export const pages: Record<string, () => ComponentChildren> = { overview: Overview, finances: Finances, world: World };
export const modals: Record<string, (p: { m: Modal }) => ComponentChildren> = {};
