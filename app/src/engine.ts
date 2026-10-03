/* The simulation engine is loaded before this bundle and exposes one global, GP.
   The interface never changes game state directly: it calls E.* and redraws. */
export const E: any = (globalThis as any).GP;

/** A wrestler or other worker. Fields are documented in docs/universe-format.md and src/00-core.js. */
export type W = any;
export type Promo = any;
export type GameState = any;
export interface Check { target: number; mods: { n: string; v: number }[]; mod: number; p: number }
export interface Roll { d: [number, number]; mod: number; target: number; total: number; ok: boolean }
