/* Moved from src/89-streaming.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, cal } from './00-core';
import { WEEKX } from './10-match';
import { money } from './40-week';
import { airRec } from './88-shows';
$L.streamOn = streamOn; $L.streamCap = streamCap; $L.streamOpenCost = streamOpenCost; $L.streamRunCost = streamRunCost;
/* wraps: 88-shows.js (it must sort after them; test-buildorder.js checks) */
/* ===== Streaming (NEXT.md 7.4) =====
   A company can open its own streaming service (Manage, Deals). It costs money to open and a little every week to
   run. Subscribers pay every week. How many there can be depends on the company's popularity and its tape library
   (src/86-room.js, P.tape): more shows on the shelf, more reason to subscribe. Good shows bring people in, bad ones
   lose some. While it runs, the cities you do not tour still see you, so their markets do not cool. A major network
   wants your show to itself, and pays a little less while you stream. P.strm = {on, subs, mx}. No rnd(S). */
export var STRM_PRICE=2,STRM_OPEN=1.5,STRM_RUN=0.01;
$L.STRM_PRICE = STRM_PRICE; $L.STRM_OPEN = STRM_OPEN; $L.STRM_RUN = STRM_RUN;
export function streamOn(S){var P=S.promos[S.player];return !!(P&&P.strm&&P.strm.on);}
/* at its fullest a service earns about a tenth of what the company takes in a week: more for a popular one */
export function streamCap(S,P){var n=(P.tape||[]).length;return Math.round(P.inc0*0.06*(0.5+P.image/120)*(1+Math.min(1,n/100))/$L.STRM_PRICE);}
export function streamOpenCost(P){return Math.round(P.inc0*$L.STRM_OPEN/1000)*1000;}
export function streamRunCost(P){return Math.round(P.inc0*$L.STRM_RUN/100)*100;}
/** Open the service. */
E.streamStart=function(S){var P=S.promos[S.player];if(P.strm&&P.strm.on)return {ok:false,msg:'Your service is already running.'};
  var c=streamOpenCost(P);if(P.cash<c)return {ok:false,msg:'Opening a service costs '+money(c)+'. You do not have it.'};
  P.cash-=c;P.strm={on:S.week,subs:0,mx:0};$L.news(S,'money',P.name+' has opened its own streaming service.');$L.note(S,'Streaming','Your service is open. Subscribers will come as the library grows.','good');
  return {ok:true,msg:'The service is open. It cost '+money(c)+', and runs at about '+money(streamRunCost(P))+' a week.'};};
/** Close it. The subscribers go. */
E.streamStop=function(S){var P=S.promos[S.player];if(!P.strm||!P.strm.on)return {ok:false,msg:'There is no service to close.'};
  var n=P.strm.subs;P.strm.on=0;P.strm.subs=0;$L.news(S,'money',P.name+' has closed its streaming service.');return {ok:true,msg:'The service is closed. '+n.toLocaleString('en-US')+' subscribers have gone.'};};
/* every week: subscribers move toward what the company can hold, and pay; running it costs a little */
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];if(!P||!P.strm||!P.strm.on)return;var st=P.strm,cap=streamCap(S,P),r=S.reports[0];
  var q=r&&r.week>=S.week-1?($L.repCS(r)-55)/100:0;   // how the last show went: good brings people in, bad loses some
  var was=st.subs;st.subs=Math.max(0,Math.round(st.subs+(cap-st.subs)*0.06+cap*0.02*q));st.mx=Math.max(st.mx||0,st.subs);st.wk=st.subs-was;
  st.pay=st.subs*$L.STRM_PRICE-streamRunCost(P);P.led.bonus+=st.pay;
});
/* a major network wants the show to itself: a little less while you stream */
(function(){var was=$L.airRate;$L.airRate=function(P,show){var r=was(P,show),sh=show&&!show.big?airRec(P,show.id):null;return r*(sh&&sh.tier===2&&P.strm&&P.strm.on?0.95:1);};})();
/** Everything the Streaming pop-up shows. */
E.streamInfo=function(S){var P=S.promos[S.player],st=P.strm||{},on=!!st.on,maj=P.shows.filter(function(sh){return !sh.big&&sh.tier===2;}).map(function(sh){return sh.name;});
  return {on:on,since:on?cal(st.on).label:null,subs:st.subs||0,wk:st.wk||0,cap:streamCap(S,P),pay:on?st.pay||0:0,open:streamOpenCost(P),run:streamRunCost(P),price:$L.STRM_PRICE,
    lib:(P.tape||[]).length,major:maj};};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.STRM_PRICE = STRM_PRICE;
$L.STRM_OPEN = STRM_OPEN;
$L.STRM_RUN = STRM_RUN;
$L.streamOn = streamOn;
$L.streamCap = streamCap;
$L.streamOpenCost = streamOpenCost;
$L.streamRunCost = streamRunCost;
