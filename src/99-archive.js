/* wraps: 80-world.js (it must sort after them; test-buildorder.js checks) */
/* Career-scale saves (the add-ons run, item 9). Once a game year the state is compacted so a thirty-year career stays
   small: yearly match records older than two years fold into one "earlier years" row (w.ysOld), career logs keep the
   first line and the newest fifteen, and free agents nobody has signed in two years and who are 36 or older retire
   quietly, and so do the weakest unused ones when the free-agent pool passes 350. Somebody retired over two years ago
   keeps only their name, their record and a few career lines. Old reports, feeds and dirt sheets are kept short elsewhere (src/70-season.js, src/94-net.js). Nothing here
   calls rnd(S), and it runs at the same week in every game, so it cannot change how a game plays out. */
var ARCH_KEEP=['id','name','g','promo','ovr','align','age','uid','town','face','log','rt','rtp','ysOld','ysTo','ys','wins','losses','nw','inj','arch','hof','con','morale','cond'],ARCH_YEARS=2,ARCH_LOG=10,FA_CAP=350,ROSTER_CAP=60,TITLE_KEEP=40;
function archYear(S){
  var y=cal(S.week).year,keep=y-ARCH_YEARS+1;
  S.w.forEach(function(w){
    for(var k in w){var v=w[k];if(typeof v==='number'&&v!==Math.round(v))w[k]=Math.round(v*100)/100;}   // two places is plenty for a number nobody reads to the third
    if(w.ys){var old=w.ysOld||[0,0,0,0,0,0,0],moved=0;Object.keys(w.ys).forEach(function(k){if(+k<keep){var a=w.ys[k];for(var i=0;i<7;i++)old[i]=i===4?Math.max(old[i],a[i]||0):old[i]+(a[i]||0);delete w.ys[k];moved=1;}});
      if(moved){w.ysOld=old;w.ysTo=keep-1;}}
    if(w.log&&w.log.length>ARCH_LOG)w.log=w.log.slice(0,1).concat(w.log.slice(-(ARCH_LOG-1)));
    if(w.promo==='FA'&&w.rt==null&&!w.nw&&w.age>=36&&S.week-(w.lu||0)>96)retire(S,w,'never signed again');
  });
  // a rival roster that only grows lets its least-used people go (never a champion, never somebody in a feud)
  S.order.forEach(function(pid){if(pid===S.player)return;var P=S.promos[pid],R=rosterOf(S,pid).filter(function(w){return !w.nw;});if(R.length<=ROSTER_CAP)return;
    R.filter(function(w){return holdLvl(P,w.id)===0&&!inFeud(S,w.id);}).sort(function(a,b){return (a.lu||0)-(b.lu||0)||a.ovr-b.ovr||a.id-b.id;}).slice(0,R.length-ROSTER_CAP)
      .forEach(function(w){leaveCompany(S,w,'released');w.promo='FA';w.brand=null;w.cut={w:S.week,from:pid,img:P.image};});});
  // a pool that only grows: past the cap, the weakest free agents unused for two years leave the business
  var fa=S.w.filter(function(w){return w.promo==='FA'&&w.rt==null&&!w.nw&&S.week-(w.lu||0)>96;}).sort(function(a,b){return a.ovr-b.ovr||a.id-b.id;}),n=S.w.filter(function(w){return w.promo==='FA'&&w.rt==null&&!w.nw;}).length;
  for(var i=0;i<fa.length&&n>FA_CAP;i++,n--)retire(S,fa[i],'left the business');
  // and somebody who left the business long ago and was never a champion keeps only a name and a line
  S.w.forEach(function(w){if(w.rt!=null&&S.week-w.rt>96&&!w.arch&&w.promo==='FA'&&!w.srole){
    Object.keys(w).forEach(function(k){if(ARCH_KEEP.indexOf(k)<0)delete w[k];});if(w.log&&w.log.length>3)w.log=w.log.slice(0,1).concat(w.log.slice(-2));w.arch=1;}});
  // title lines: an old reign keeps who, when and how long; past forty reigns the first one and the newest stay, and the count of the rest
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){var H=t.hist;if(!H)return;
    H.forEach(function(h){if(h.to!=null&&S.week-h.to>96)delete h.show;});
    if(H.length>TITLE_KEEP){t.histCut=(t.histCut||0)+H.length-TITLE_KEEP;t.hist=H.slice(0,1).concat(H.slice(-(TITLE_KEEP-1)));}});});
  S.archived=S.week;
}
WEEKX.push(function(S){if(S.week>0&&S.week%48===0)archYear(S);});
/* the career page shows the folded years as one row */
(function(){var was=E.career;E.career=function(S,id){var c=was(S,id),w=S.w[id];if(c&&w&&w.ysOld){var a=w.ysOld;c.years.push({y:'Up to '+w.ysTo,m:a[0],w:a[1],l:a[2],d:a[3],best:a[4],main:a[5],titles:a[6],old:1});}return c;};})();
