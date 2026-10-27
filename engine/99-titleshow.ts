/* Moved from src/99-titleshow.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, titleById, titleFull } from './00-core';
/* wraps: 00-core.js (it must sort after them; test-buildorder.js checks) */
/* A title for one show (Ryan, 20 October: "belts should have an option to be only for a specific show"). A title can
   belong to one of the company's weekly shows (t.show, the show's id): on weekly television it is defended only there,
   so a second show can have a belt of its own the way a brand does. Big events can still put it on, the way every
   big night can. Left empty, the title goes where it went before (by brand). The belt itself is drawn in Create a
   Belt; this only says where it is defended. No rnd(S). */
(function(){
  var st=$L.showTitles;
  $L.showTitles=function(P,show){var L=st.apply(this,arguments);if(!show||show.big)return L;
    return L.filter(function(t){return !t.show||!show.id||t.show===show.id;});};
})();
/** The weekly shows a title of yours could belong to, and the one it belongs to now. */
E.titleShows=function(S,tid){
  var P=S.promos[S.player],t=titleById(P,tid);
  return {now:t&&t.show||null,shows:(P.shows||[]).filter(function(sh){return !sh.dead;}).map(function(sh){return {id:sh.id,name:sh.name};})};
};
/** Make a title of yours belong to one weekly show, or to none (show null). */
E.setTitleShow=function(S,tid,show){
  var P=S.promos[S.player],t=titleById(P,tid);if(!t)return {ok:false,msg:'That title is not yours.'};
  if(show==null||show===''){delete t.show;return {ok:true,msg:'The '+t.name+' can be defended on any of your shows.'};}
  var sh=(P.shows||[]).filter(function(x){return x.id===show&&!x.dead;})[0];if(!sh)return {ok:false,msg:'That show is not on the air.'};
  t.show=sh.id;$L.news(S,'title','The '+titleFull(P,t)+' is now defended on '+sh.name+'.');
  return {ok:true,msg:'The '+t.name+' belongs to '+sh.name+' now. It is defended there, and on your big events.'};
};
/** The ids of the titles of yours a show can put on the line. */
E.titlesOnShow=function(S,show){return $L.showTitles(S.promos[S.player],show).map(function(t){return t.id;});};
