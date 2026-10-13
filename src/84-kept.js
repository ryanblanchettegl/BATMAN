/* ---------- moments that are kept ----------
   The biggest moments of the player's shows are saved for Company History: a new champion of the top title (or of
   any title at a big event), an upset, a streak of ten or more broken, and the finish of a five-star match. One from each match at most,
   in the words they were called on the air (the beats marked `h` in callMatch). Reads the report; never uses rnd(S). */
var KEPT_MAX=40;
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player)return;
  var K=S.kept||(S.kept=[]);
  var ms=rep.segs.filter(function(sg){return sg.k==='match'&&sg.bc;}),best=ms.slice().sort(function(x,y){return y.ov-x.ov;})[0];
  ms.forEach(function(sg){
    var hot=sg.bc.filter(function(b){return b.h;});if(!hot.length)return;
    var top=momTop(P),gold=hot.filter(function(b){return b.h>1;})[0];
    if(gold&&!(rep.big||(top&&sg.title===top.name)))gold=null;   // the top title, or any title at a big event
    var up=(sg.notes||[]).some(function(n){return /^Upset/.test(n);}),st=(sg.notes||[]).some(function(n){var m=/streak ends at (\d+)/i.exec(n);return m&&+m[1]>=10;});
    if(gold){var named=sg.bc.filter(function(b){return b.t==='ring'&&/NEW /.test(b.x);})[0];if(named)gold=named;}   // the announcer's line names the new champion
    var great=sg===best&&starQ(sg.ov)>=20,pick=gold||((up||st||great)?hot[hot.length-1]:null);if(!pick)return;
    K.unshift({w:S.week,show:rep.name,label:sg.label,x:pick.x,ov:sg.ov,k:gold?'gold':(up?'upset':(st?'streak':'match'))});
  });
  if(K.length>KEPT_MAX)K.length=KEPT_MAX;
});
/** The kept moments, newest first. */
E.kept=function(S){return (S.kept||[]).slice();};
