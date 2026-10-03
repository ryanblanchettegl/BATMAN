export interface Face { h: number; hr: number; fh: number; ms: number; ey: number; ns: number; sk: number; hc: number }
export type FaceKey = 'h' | 'hr' | 'fh' | 'ms' | 'ey' | 'ns';
export const N: number;
/** Draw a face on a canvas. `g` is 'M' or 'F'; `bg` is 'F' (face, teal), 'H' (heel, maroon) or 'N' (tweener, grey). */
export function draw(canvas: HTMLCanvasElement, face: Partial<Face>, opt?: { g?: string; bg?: string; gear?: number[] }): void;
/** A stable face for anybody who was not given one: derived from the name, never random. */
export function derive(name: string, g: string, age: number): Face;
export function norm(face: Partial<Face> | null | undefined): Face;
/** Style names for each part, ten per part. */
export const NAMES: Record<FaceKey, string[]>;
export const PARTS: Record<FaceKey, string>;
