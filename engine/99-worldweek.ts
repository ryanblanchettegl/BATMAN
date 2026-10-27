// @ts-nocheck
/* Moved from src/99-worldweek.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
/* The week around the world (the week of 20 October, step 4). Rival companies already book shows, change titles and
   keep feuds, but the player only saw it as loose lines in the news. Now, at the end of every week, the game files a
   short digest of what every other company did: their shows and how each went against its own crowd, new champions
   and how they got there, stories that started and stories that ended. It is kept for twelve weeks (S.ww) and read in
   "The week in full" on the desk (the Around the world tab). It only reads the game and never calls rnd(S).
   What it hands on (rule 7a): a rival who is hot right now, a champion crowned elsewhere, a star whose story just
   ended and who may be looking for work. */
export var WW_KEEP=12;
export function wwCompany(S,P,wk){
  var out={id:P.id,name:P.name,shows:[],titles:[],begun:[],ended:[],lead:null};
  (S.wwShows||[]).forEach(function(r){if(r.p===P.id&&r.w===wk)out.shows.push(r);});
  (P.titles||[]).forEach(function(t){(t.hist||[]).forEach(function(h,i){if(h.from!==wk||!h.h||!h.h.length)return;
    var prev=t.hist[i-1],old=prev&&prev.to===wk?prev:null,how='';
    if(old){var f=(S.feuds||[]).filter(function(x){return x.promo===P.id&&x.title===t.id;})[0];
      how=f?'after weeks of chasing':(h.show?'at '+h.show:'');}
    else how='for the vacant title';
    out.titles.push({title:$L.titleFull(P,t),now:h.h.join(' & '),old:old&&old.h?old.h.join(' & '):null,weeks:old&&old.from!=null?wk-old.from:null,how:how});});});
  (S.feuds||[]).forEach(function(f){if(f.promo!==P.id)return;var nm=function(L){return L.map(function(id){return S.w[id]?S.w[id].name:'?';}).join(' & ');};
    if(f.start===wk)out.begun.push(nm(f.a)+' and '+nm(f.b));
    if(f.res&&f.end===wk&&!f.dead)out.ended.push(nm(f.a)+' and '+nm(f.b));});
  // the line that leads: a new champion, then a story that ended, then the best show
  var t0=out.titles[0],best=out.shows.slice().sort(function(a,b){return (b.big?1:0)-(a.big?1:0);})[0];
  out.lead=t0?t0.now+' won the '+t0.title+(t0.how?' '+t0.how:'')+(t0.weeks&&t0.weeks>=12?', ending a reign of '+t0.weeks+' weeks':'')+'.'
    :(out.ended[0]?'The story of '+out.ended[0]+' ended.':(best&&best.big?best.name+': '+best.word+', '+best.grade+'.':(out.begun[0]?'A new story: '+out.begun[0]+'.':(best?best.name+': '+best.word+', '+best.grade+'.':null))));
  return out;
}
export function wwFile(S){
  if(S.cal)return;var wk=S.week,L=[];
  S.order.forEach(function(pid){if(pid===S.player)return;var P=S.promos[pid];if(!P||P.dead)return;var c=wwCompany(S,P,wk);if(c.lead||c.begun.length)L.push(c);});
  L.sort(function(a,b){return (b.titles.length*3+b.ended.length*2+b.shows.length)-(a.titles.length*3+a.ended.length*2+a.shows.length);});
  var ww=S.ww||(S.ww=[]);ww.unshift({w:wk,label:$L.cal(wk).label,cos:L});if(ww.length>WW_KEEP)ww.length=WW_KEEP;
}
// rival shows are not kept as reports, so each one is noted as it airs: its grade against its own crowd, and its main event
$L.SHOWX.push(function(S,P,show,rep){
  if(S.cal||!P||P.id===S.player||!rep)return;var L=S.wwShows||(S.wwShows=[]),cs=$L.repCS(rep),me=rep.lineup&&rep.lineup.length?rep.lineup[rep.lineup.length-1]:null;
  L.push({p:P.id,w:S.week,name:show.name,big:!!show.big,grade:$L.gradeG(cs),word:verdictWord(rep),main:typeof me==='string'?me:null});
});
// the verdict in the game's own words (rule 8c): the same ladder the letter and the dirt sheet use
export function verdictWord(rep){var v=rep.rating!=null&&rep.exp!=null?$L.E.showVerdict(rep.rating,rep.exp):null;return v?v.head.toLowerCase():'';}
$L.WEEKX.push(function(S){wwFile(S);S.wwShows=[];});
/** The week around the world: the latest filed weeks, newest first ({w, label, cos:[{name, lead, shows, titles, begun, ended}]}). */
$L.E.worldWeek=function(S,n){return (S.ww||[]).slice(0,n||WW_KEEP);};

// hand this module's names back to the bridge, so legacy code that calls them finds them
$L.WW_KEEP = WW_KEEP;
$L.wwCompany = wwCompany;
$L.wwFile = wwFile;
$L.verdictWord = verdictWord;
