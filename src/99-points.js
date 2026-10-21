/* wraps: 65-you.js (it must sort after them; test-buildorder.js checks) */
/* Booking power and action points refill after every show of yours, not once a week (roadmap 10, Ryan 16 October).
   Each show brings its share of the week's booking power and one more point, plus up to two points left unspent from
   before; action points come back in full after every show, and one unspent point carries over. A week with several
   shows now holds more of both. Perks (clout, owning the company, the booker's level) still raise them through
   bpGrant() and apMax(). The weekly grant is kept for a new game and old saves until the first show refills them. */
var BP_CARRY=2,AP_CARRY=1;
function bpPerShow(S){var P=S.promos[S.player],n=Math.max(1,(S.queue||[]).length||P.shows.length);return Math.max(2,Math.round(bpGrant(S)/n)+1);}
(function(){var g=grantBP;grantBP=function(S){if(S.bpPS)return;g(S);};})();
SHOWX.push(function(S,P){
  if(S.cal||P.id!==S.player||S.noRefill)return;   // noRefill: a test that measures what one call spends
  var add=bpPerShow(S),keep=Math.min(BP_CARRY,Math.max(0,S.bp||0));S.bp=keep+add;S.bpGrant=add;S.bpPS=1;
  var ak=0;if(S.ap!=null){ak=Math.min(AP_CARRY,Math.max(0,S.ap));S.ap=apMax(S)+ak;S.apUsed={};S.apWho={};}
  note(S,'Refilled',S.bp+' booking power and '+(S.ap||0)+' action points for the next show'+(keep||ak?' (some carried over).':'.'),'good');
});
/** For the screens: how the points come back. */
E.pointsInfo=function(S){return {bp:S.bp||0,perShow:bpPerShow(S),bpCarry:BP_CARRY,ap:S.ap||0,apMax:apMax(S),apCarry:AP_CARRY};};
