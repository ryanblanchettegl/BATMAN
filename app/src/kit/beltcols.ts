/* A belt's data and the colours of its metals and gems, shared by the belt painter (belt.tsx) and the belt a scene
   holds up (puppet.ts). */
export interface BeltData { pl: string; mt: string; st: string; gm: string; sd: number; ss: string; tr: string; w: string; top: string }
/** Each metal: rim, face, shine. */
export const METAL: Record<string, [string, string, string]> = {
  gold: ['#8a5e10', '#e2ac33', '#ffe286'], silver: ['#5d636e', '#bfc5cf', '#f4f6fa'], bronze: ['#5e3418', '#b3713a', '#e8ad7a'],
  black: ['#0c0c0e', '#2e2e35', '#d9b14a'], rose: ['#7c4040', '#d6968a', '#f8d0c4'],
};
export const GEM: Record<string, string> = { red: '#d42c3a', blue: '#2f6ee0', green: '#25a35a', white: '#eef6ff', purple: '#9a4ee0' };
