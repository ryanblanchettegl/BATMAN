/* Moved from src/99-overall.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, workRate } from './00-core';
$L.overallRaw = overallRaw; $L.overallOf = overallOf;
/* The overall rating (Ryan, 20 October: "add overall rating to wrestlers for easy sorting"). One number from 1 to 99
   that says how good a wrestler is all round, for sorting a list at a glance: their work in the ring weighs most,
   then how over they are with the crowd, then the microphone and their presence, then stamina, how steady they are
   and how safe they are to work with. It moves as they do, since it is worked out from them each time and never
   kept. It is a rating of the person, not a forecast of a match: a match is still told in stars after the bell. */
export function overallRaw(w){
  if(!w)return 0;
  var ring=workRate(w),mic=((w.mic||50)+(w.cha||w.mic||50))/2;
  var v=ring*0.38+(w.ovr||0)*0.27+mic*0.17+(w.stam||50)*0.08+(w.cons||60)*0.05+(w.safe||55)*0.05;
  return clamp(Math.round(70+(v-70)*1.1),1,99);   // the scale wages, signings and levels were set on: kept as it was
}
/* The number shown (Ryan, 21 October: "realistic ratings, not a bunch of 90 overall guys to start"): the way the sports
   games spread it. A handful in the world reach 90, a main-eventer is in the low to high 80s, the middle of a card sits
   in the 60s and low 70s, a rookie in the 50s. The curve bends the old scale down in the middle and keeps its top. */
export function overallOf(w){
  if(!w)return 0;var v=70+(overallRaw(w)-70)/1.1,d=v-48;
  return clamp(Math.round(d>0?48+d*0.6056+d*d*0.00971:v),1,99);
}
/** The overall rating of a wrestler, 1 to 99 (a wrestler, or an id). */
E.overall=function(S,w){if(typeof w==='number')w=S.w[w];return overallOf(w);};
E.overallOf=overallOf;

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.overallRaw = overallRaw;
$L.overallOf = overallOf;
