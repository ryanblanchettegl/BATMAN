// @ts-nocheck
/* Moved from src/66-owner-year.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, cal, clamp, r1 } from './00-core';
import { NEWX, SHOWX } from './10-match';
import { flagWeekFrom } from './42-events';
import { gainXp } from './65-you';
$L.yearNew = yearNew; $L.yearInfo = yearInfo;
/* ---------- The owner's goal for the year (Bill, 21 October: grades, popularity and money answer to the owner) ----------
   A year runs to the flagship. The owner asks for three things: grow the company's popularity, give the crowd what it
   came for at least half the time (a B- or better), and never need the owner to cover the losses. At the flagship the
   owner judges the year, and the company is only handed over after two years with all three met. Nothing here rolls
   a number, so it cannot change how a seed plays out. */
export var YEAR_GROW=1.5,YEAR_MIN_SHOWS=8;
$L.YEAR_GROW = YEAR_GROW; $L.YEAR_MIN_SHOWS = YEAR_MIN_SHOWS;
export function yearNew(S){
  var P=S.promos[S.player],o=S.owner;if(!P||!o)return null;
  var cap=$L.modelOf(P).cap||100,pop=Math.min(cap-0.5,P.image+$L.YEAR_GROW);
  o.yr={w0:S.week,pop0:r1(P.image),pop:r1(Math.max(P.image,pop)),shows:0,good:0,bail0:o.bail||0};
  return o.yr;
}
/** The three asks, where each stands, and whether the year is on course. */
export function yearInfo(S){
  var P=S.promos[S.player],o=S.owner;if(!P||!o||o.me)return null;var Y=o.yr||yearNew(S);if(!Y)return null;
  var fw=flagWeekFrom({week:S.week-1},P),bails=(o.bail||0)-Y.bail0;
  var L=[
    {k:'pop',n:'Popularity '+Y.pop+' or more',now:'now '+r1(P.image),ok:P.image>=Y.pop},
    {k:'shows',n:'Half the shows a B- or better',now:Y.good+' of '+Y.shows,ok:Y.good*2>=Y.shows},
    {k:'money',n:'No losses for '+o.name+' to cover',now:bails?bails+' so far':'none so far',ok:!bails}
  ];
  return {asks:L,met:L.filter(function(x){return x.ok;}).length,end:fw!=null?cal(fw).label:null,left:fw!=null?fw-S.week:null,years:o.goals||0,short:o.yr.shows<$L.YEAR_MIN_SHOWS};
}
E.ownerYear=function(S){return yearInfo(S);};
NEWX.push(function(S){if(S.owner&&!S.owner.me)yearNew(S);});
SHOWX.push(function(S,P,show,rep){
  var o=S.owner;if(P.id!==S.player||!o||o.me||S.cal)return;var Y=o.yr||yearNew(S);
  Y.shows++;if($L.gradeMeets($L.repCS(rep),'B-'))Y.good++;
  if(!show.big||!show.flag)return;
  // the flagship closes the year. A year of fewer than eight shows is too short to judge: it starts again.
  if(Y.shows<$L.YEAR_MIN_SHOWS){yearNew(S);return;}
  var I=yearInfo(S),k=I.met,dt=[-15,-8,3,12][k],miss=I.asks.filter(function(x){return !x.ok;}).map(function(x){return x.n.toLowerCase();});
  o.trust=clamp(o.trust+dt,0,100);o.years=(o.years||0)+1;
  if(k===3){o.goals=(o.goals||0)+1;S.bp+=3;gainXp(S,40);}
  var head=k===3?o.name+' is pleased with the year':(k===2?o.name+' calls the year a pass':o.name+' is unhappy with the year');
  var text=(k===3?'Every goal for the year was met. ':'Missed: '+miss.join('; ')+'. ')+'Trust '+(dt>=0?'rises by '+dt:'falls by '+(-dt))+'.'+(k===3?' Three more booking power.':'');
  $L.news(S,'you',head+'. '+text);$L.note(S,head,text,k>=2?'good':'bad');
  rep.year={met:k,dt:dt,text:head+'. '+text};
  yearNew(S);
});

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.YEAR_GROW = YEAR_GROW;
$L.YEAR_MIN_SHOWS = YEAR_MIN_SHOWS;
$L.yearNew = yearNew;
$L.yearInfo = yearInfo;
