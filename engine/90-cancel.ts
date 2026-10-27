// @ts-nocheck
/* Moved from src/90-cancel.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, rosterOf } from './00-core';
import { EVR, SHOWX } from './10-match';
import { pushEv } from './40-week';
import { youRemember } from './66-relations';
import { airPickNet, airRec } from './88-shows';
$L.showOff = showOff;
/* wraps: 00-core.js, 88-shows.js (it must sort after them; test-buildorder.js checks) */
/* Cancellation (roadmap 4, Ryan 16 October). A network can cancel a weekly show after warnings: every meeting the
   network calls (netmeet, when its patience runs out) is a warning, and the third in a year cancels the weakest
   weekly show. A cancelled show is not gone: it runs on as a house show (sh.off), with no television money and a
   smaller crowd, and a strong run of house shows (six in a row the crowd liked) can win a small network's offer back.
   Nothing here calls rnd(S). It wraps EVR.netmeet from src/77-backstage.js and airRate from src/88-shows.js. */
export var CANCEL_WARN=3,HOUSE_DRAW=0.75,BACK_RUN=6,BACK_CS=65;
$L.CANCEL_WARN = CANCEL_WARN; $L.HOUSE_DRAW = HOUSE_DRAW; $L.BACK_RUN = BACK_RUN; $L.BACK_CS = BACK_CS;
export function showOff(P,show){var sh=show&&!show.big?airRec(P,show.id):null;return !!(sh&&sh.off);}
(function(){
  var rate=$L.airRate;$L.airRate=function(P,show){return showOff(P,show)?0:rate(P,show);};
  var dem=$L.demand;$L.demand=function(P,show,hype){return dem(P,show,hype)*(showOff(P,show)?$L.HOUSE_DRAW:1);};
  var meet=EVR.netmeet;
  EVR.netmeet=function(S,ev,choice,P){
    var out=meet(S,ev,choice,P);
    P.nmw=(P.nmw||[]).filter(function(w){return S.week-w<48;});P.nmw.push(S.week);
    var left=$L.CANCEL_WARN-P.nmw.length;
    if(left>0)return out+' The network says this is warning '+P.nmw.length+' of '+$L.CANCEL_WARN+'.';
    var live=P.shows.filter(function(sh){return !sh.off;}).sort(function(a,b){return (a.pr||0)-(b.pr||0);})[0];
    P.nmw=[];if(!live)return out;
    live.off=S.week;live.offRun=0;
    rosterOf(S,P.id).filter(function(w){return !w.nw;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,4).forEach(function(w){youRemember(S,w,'cancel','Lost the television show under this booker.',-3);});
    $L.news(S,'money',live.name+' has been cancelled. It runs on as a house show, with no television money.');
    $L.note(S,'Cancelled',live.name+' is off television. Six strong house shows in a row could win a deal back.','bad');
    return out+' It was the third warning. '+live.name+' is cancelled. It will run on as a house show: no television money, and a smaller crowd.';
  };
})();
/* a house show keeps count of its run; a strong run brings a small network to the door */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player||!showOff(P,show))return;
  var sh=airRec(P,show.id);rep.hs=1;
  sh.offRun=$L.repCS(rep)>=$L.BACK_CS?(sh.offRun||0)+1:0;
  if(sh.offRun>=$L.BACK_RUN&&!S.inbox.some(function(e){return !e.done&&e.type==='netback';})){
    sh.offRun=0;var net=airPickNet(S,P,sh,0,null);
    pushEv(S,{type:'netback',sid:sh.id,net:net,text:net+' has seen the crowds at '+sh.name+'. Six strong house shows in a row. They offer it a slot on television again: a small network, a small fee, a fresh start.',choices:['Take the deal','Not yet']});
  }
});
EVR.netback=function(S,ev,choice,P){
  var sh=airRec(P,ev.sid);if(!sh||!sh.off)return 'That show is already on television.';
  if(choice===1)return 'You say not yet. They will be watching.';
  delete sh.off;delete sh.offRun;sh.tier=0;$L.airSign(S,P,sh,ev.net,0,0.8);E.clocks(S);S.clocks.net.v=0;S.clocks.net.why='A new network, and a clean slate';
  rosterOf(S,P.id).filter(function(w){return !w.nw;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,4).forEach(function(w){youRemember(S,w,'tvback','Got the show back on television.',3);});
  $L.note(S,'Back on television',sh.name+' is back on the air, on '+ev.net+'.','good');
  return sh.name+' is back on television, on '+ev.net+'. Small money, a clean slate, and a crowd that never left.';
};
/** For the screens: the network's warnings and any show off the air. */
E.cancelInfo=function(S){var P=S.promos[S.player];return {warn:(P.nmw||[]).filter(function(w){return S.week-w<48;}).length,of:$L.CANCEL_WARN,off:P.shows.filter(function(sh){return sh.off;}).map(function(sh){return {id:sh.id,n:sh.name,run:sh.offRun||0,need:$L.BACK_RUN};})};};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.CANCEL_WARN = CANCEL_WARN;
$L.HOUSE_DRAW = HOUSE_DRAW;
$L.BACK_RUN = BACK_RUN;
$L.BACK_CS = BACK_CS;
$L.showOff = showOff;
