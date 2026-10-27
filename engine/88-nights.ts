/* Moved from src/88-nights.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, hash } from './00-core';
import { EVR, SHOWX, WEEKX } from './10-match';
import { pushEv } from './40-week';
import { CLOCKS } from './77-backstage';
$L.nightOf = nightOf; $L.regionOf = regionOf; $L.nightRivals = nightRivals; $L.nightOpen = nightOpen;
/* ===== Nights (NEXT.md 7.5, a first step) =====
   Every weekly show has a night, read from its name. When a rival in the same part of the world runs a weekly show
   on the same night as yours, the two go head to head: your audience tonight against what theirs has been drawing. Of several on the night, the one nearest your size is the one you are measured against.
   Winning the night gets people talking (a little hype for your next show); the news keeps the count. Only reads
   the game and uses no rnd(S). */
export var NIGHT_ALT={Lunes:'Monday',Martes:'Tuesday',Miercoles:'Wednesday',Jueves:'Thursday',Viernes:'Friday',Sabado:'Saturday',Domingo:'Sunday'};
$L.NIGHT_ALT = NIGHT_ALT;
export function nightOf(sh){if(!sh||sh.big)return '';if(sh.day)return sh.day;var d=$L.showDay(sh);if(d)return d;for(var k in $L.NIGHT_ALT)if(sh.name.indexOf(k)>=0)return $L.NIGHT_ALT[k];return '';}
export function regionOf(S,P){try{var c=$L.roadRoute(S,P);var M=c&&c.length?$L.roadMap(S,c):null;return M?M.id:null;}catch(e){return null;}}
/** The rival weekly shows on the same night as one of yours, in the same part of the world. */
export function nightRivals(S,show){var P=S.promos[S.player],d=nightOf($L.airRec(P,show.id)||show),reg=regionOf(S,P),out=[];if(!d||!reg)return out;
  S.order.forEach(function(id){if(id===P.id)return;var R=S.promos[id];if(R.dead||regionOf(S,R)!==reg)return;
    (R.shows||[]).forEach(function(sh){if(!sh.big&&nightOf(sh)===d){var a=$L.airRec(R,sh.id);out.push({co:R.name,n:sh.name,va:a&&a.va?Math.round(a.va):0});}});});
  return out;}
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player||show.big)return;var L=nightRivals(S,show).filter(function(x){return x.va>0;});if(!L.length)return;
  var me=$L.airRec(P,show.id),base=me&&me.va?me.va:rep.viewers,R=L.sort(function(a,b){return Math.abs(a.va-base)-Math.abs(b.va-base);})[0],won=rep.viewers>=R.va,d=nightOf($L.airRec(P,show.id)||show),W=(S.nw||(S.nw={}))[d]||(S.nw[d]={w:0,l:0});
  if(won){W.w++;S.hype=(S.hype||0)+0.02;}else W.l++;
  rep.h2h={day:d,co:R.co,n:R.n,us:rep.viewers,them:R.va,won:won?1:0,w:W.w,l:W.l};
  if((W.w+W.l)%4===0)$L.news(S,'world','The '+d+' night war: '+show.name+' has won '+W.w+' and lost '+W.l+' against '+R.n+'.');
});
E.nightRivals=function(S,show){return nightRivals(S,show);};
/* the network's offer (NEXT.md 7.5): now and then the network a show is on wants it on a rival's night, and pays a
   little more for the fight. Yes moves the night (sh.day) and starts a war; no is remembered by nobody but the
   network, whose patience thins a little. Once a year at most, only when a rival in your part of the world has a
   weekly show on a night none of yours is on. */
export function nightOpen(S,P){var reg=regionOf(S,P),mine={},out=[];P.shows.forEach(function(sh){var d=nightOf(sh);if(d)mine[d]=1;});if(!reg)return out;
  S.order.forEach(function(id){if(id===P.id)return;var R=S.promos[id];if(R.dead||regionOf(S,R)!==reg)return;(R.shows||[]).forEach(function(sh){var d=nightOf(sh);if(d&&!mine[d]&&!sh.big)out.push({day:d,co:R.name,n:sh.name});});});
  return out;}
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];if(!P||(S.lcd&&S.lcd.nmove>S.week))return;
  if(hash('nmove'+S.seed+':'+S.week)%12!==0)return;
  var sh=P.shows.filter(function(x){return !x.big&&x.net;})[0],L=nightOpen(S,P);if(!sh||!L.length)return;
  var o=L[hash('nmv'+S.seed+':'+S.week)%L.length];(S.lcd||(S.lcd={})).nmove=S.week+48;
  pushEv(S,{type:'nightmove',sid:sh.id,day:o.day,text:sh.net+' wants '+sh.name+' moved to '+o.day+', head to head with '+o.n+' ('+o.co+'). They would pay about a tenth more for the fight, and the war would be news every week.',
    choices:['Move to '+o.day+' and take them on','Stay where you are']});
});
EVR.nightmove=function(S,ev,choice,P){
  var sh=$L.airRec(P,ev.sid);if(!sh)return 'That show is no longer on your schedule.';
  if(choice===0){var was=nightOf(sh);sh.day=ev.day;sh.rate=clamp((sh.rate||1)*1.1,0.6,1.8);
    $L.news(S,'world',P.name+' is moving '+sh.name+' to '+ev.day+'. A night war is on.');$L.note(S,'A night war',sh.name+' moves to '+ev.day+'.','');
    return sh.name+' moves from '+(was||'its night')+' to '+ev.day+'. '+sh.net+' pays a tenth more, and every week now is a fight for the night.';}
  E.clocks(S);S.clocks.net.v=clamp(S.clocks.net.v+1,0,CLOCKS.net.segs);S.clocks.net.why='You turned down the network’s move';
  return 'You stay on your night. '+sh.net+' is not pleased.';
};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.NIGHT_ALT = NIGHT_ALT;
$L.nightOf = nightOf;
$L.regionOf = regionOf;
$L.nightRivals = nightRivals;
$L.nightOpen = nightOpen;
