/* Title belts: every title has a belt of its own, built from parts (Create a Belt). A belt is data on the title,
   t.belt = {pl, mt, st, gm, sd, ss, tr, w, top}: the centre plate's shape, its metal, the strap's colour, the gem,
   side plates on each side and their shape, the trim, the word on the plate (14 letters at most) and the small line above it. Anything
   missing comes from the title itself (how big a prize, tag or not, its name), so E.beltOf always answers and old
   saves and worlds need nothing. Picks are hashed (h01), never rnd(S). */
var BELT_PLATES=[['round','Round'],['oval','Oval'],['shield','Shield'],['crest','Winged crest'],['globe','Globe'],['star','Star'],['diamond','Diamond'],['square','Square'],['bar','Long bar'],['crown','Crown']];
var BELT_METALS=[['gold','Gold'],['silver','Silver'],['bronze','Bronze'],['black','Black chrome'],['rose','Rose gold']];
var BELT_STRAPS=[['#1c1b1f','Black'],['#5a3a22','Brown'],['#a3221f','Red'],['#1f4fa3','Blue'],['#18264a','Navy'],['#ece6d6','White'],['#2f7a3a','Green'],['#5e2f86','Purple'],['#d06aa0','Pink'],['#e0b43a','Gold']];
var BELT_GEMS=[['none','None'],['red','Ruby'],['blue','Sapphire'],['green','Emerald'],['white','Diamond'],['purple','Amethyst']];
var BELT_SIDES=[[0,'None'],[1,'One'],[2,'Two'],[3,'Three']];
var BELT_SIDE_SHAPES=[['round','Round'],['square','Square'],['shield','Shield']];
var BELT_TRIMS=[['none','Plain'],['stitch','Stitched'],['studs','Studded'],['rope','Rope edge'],['etched','Etched']];
function beltHas(L,v){for(var i=0;i<L.length;i++)if(L[i][0]===v)return true;return false;}
function beltWordClean(s,max){return String(s||'').toUpperCase().replace(/[^A-Z0-9 '’&.-]/g,'').replace(/\s+/g,' ').trim().slice(0,max);}
/** The word on the plate from the title's name: what is left once the company and "championship" are gone. */
function beltWordOf(t,P){
  var n=String((t&&t.name)||'').replace(/[’']s\b/g,'').replace(/\b(championships?|titles?|champions?|belts?|the|of)\b/gi,' ');
  var co=P?[P.name,P.full,P.full_name]:[];co.forEach(function(c){if(c)n=n.split(c).join(' ');});
  var ws=n.split(/\s+/).filter(function(w){return w&&(w==='TV'||!/^[A-Z]{2,4}$/.test(w));});
  if(t&&t.tag)return 'TAG TEAM';
  var pick=ws.filter(function(w){return /^(world|hardcore|television|tv|women|cruiserweight|heavyweight|national|international|united|intercontinental|pure|state|global|grand|crown|junior|internet|openweight|tag)/i.test(w);});
  var fit=function(L){return L.filter(function(x){return x.replace(/-ish$/i,'').length<=14;});};
  var w=(fit(pick)[0]||fit(ws)[0]||'CHAMPION');if(/^women/i.test(w)&&pick[1])w=pick[1];
  if(/^tv$/i.test(w))w='TELEVISION';if(/^wom[ae]n$/i.test(w))w='WOMEN’S';
  w=beltWordClean(w,40);if(w.length>14&&w.indexOf('-')>0)w=w.split('-')[0];
  return beltWordClean(w,14)||'CHAMPION';
}
/** A whole belt from whatever is given, for title t of company P. */
function beltFill(b,t,P){
  b=b&&typeof b==='object'?b:{};t=t||{};var id=String(t.id||t.name||'belt'),lvl=t.lvl||t.level||2,h=function(k){return h01(id+':'+k);},nm=String(t.name||'');
  var pk=function(L,k){return L[Math.floor(h(k)*L.length)%L.length][0];};
  var hard=/hardcore|extreme|street|ultra/i.test(nm),tv=/television|\btv\b/i.test(nm),fem=(t.g||t.gender)==='F'||/women/i.test(nm),light=/cruiser|junior|light|x[- ]?div/i.test(nm);
  var D={pl:lvl>=3?['crest','globe','round','crown'][Math.floor(h('pl')*4)]:(lvl===2?['shield','oval','star','round'][Math.floor(h('pl')*4)]:['square','diamond','bar','oval'][Math.floor(h('pl')*4)]),
    mt:lvl>=3?'gold':(lvl===2?(h('mt')<0.5?'silver':'gold'):(h('mt')<0.5?'bronze':'silver')),
    st:lvl>=3?(h('st')<0.6?'#1c1b1f':'#5a3a22'):pk(BELT_STRAPS.slice(0,8),'st'),
    gm:lvl>=3?pk(BELT_GEMS.slice(1),'gm'):(h('gm')<0.4?pk(BELT_GEMS.slice(1),'gm2'):'none'),
    sd:lvl>=3?3:(lvl===2?2:1),ss:pk(BELT_SIDE_SHAPES,'ss'),tr:lvl>=3?'etched':(h('tr')<0.5?'stitch':'none'),w:beltWordOf(t,P),
    top:P?String(E.logoOf(P).l||''):''};
  if(t.tag){D.pl='shield';D.sd=2;}
  if(hard){D.mt='black';D.st='#1c1b1f';D.tr='studs';D.gm='red';D.pl=lvl>=3?D.pl:'square';}
  if(tv){D.pl='bar';D.sd=2;}
  if(fem){D.st=h('fs')<0.5?'#ece6d6':(h('fs')<0.75?'#5e2f86':'#d06aa0');if(lvl>=3&&D.pl==='crest')D.pl='oval';}
  if(light){D.st='#1f4fa3';D.pl='star';}
  var col=function(v,d){v=String(v||'').toLowerCase();return beltHas(BELT_STRAPS,v)?v:d;};
  return {pl:beltHas(BELT_PLATES,b.pl)?b.pl:D.pl,mt:beltHas(BELT_METALS,b.mt)?b.mt:D.mt,st:col(b.st,D.st),gm:beltHas(BELT_GEMS,b.gm)?b.gm:D.gm,
    sd:b.sd!=null&&beltHas(BELT_SIDES,b.sd|0)?b.sd|0:D.sd,ss:beltHas(BELT_SIDE_SHAPES,b.ss)?b.ss:D.ss,tr:beltHas(BELT_TRIMS,b.tr)?b.tr:D.tr,
    w:b.w!=null?beltWordClean(b.w,14):D.w,top:b.top!=null?beltWordClean(b.top,6):D.top};
}
/** A title's belt, every part filled in. t is a title in a game or a world package; P its company (or a world's promotion). */
E.beltOf=function(t,P){return beltFill(t&&t.belt,t,P);};
E.BELT={plates:BELT_PLATES,metals:BELT_METALS,straps:BELT_STRAPS,gems:BELT_GEMS,sides:BELT_SIDES,sideShapes:BELT_SIDE_SHAPES,trims:BELT_TRIMS};
/** n ideas for a belt, each different, from a seed (Shuffle moves it). They keep the words on the plate. */
E.beltIdeas=function(t,P,n,seed){
  var base=E.beltOf(t,P),out=[],seen={},k=0;n=clamp(n|0||6,1,24);seed=seed|0;var id=String((t&&t.id)||'b');
  var pk=function(L,s){return L[Math.floor(h01(id+':'+seed+':'+k+':'+s)*L.length)%L.length][0];};
  while(out.length<n&&k<300){
    var b={pl:pk(BELT_PLATES,'pl'),mt:pk(BELT_METALS,'mt'),st:pk(BELT_STRAPS,'st'),gm:pk(BELT_GEMS,'gm'),sd:pk(BELT_SIDES,'sd'),ss:pk(BELT_SIDE_SHAPES,'ss'),tr:pk(BELT_TRIMS,'tr'),w:base.w,top:base.top};
    k++;if(b.mt==='gold'&&b.st==='#e0b43a')continue;var key=JSON.stringify(b);if(seen[key])continue;seen[key]=1;out.push(b);
  }
  return out;
};
/** The World Editor: set a title's belt (null puts back the one the title gives itself). */
E.edSetBelt=function(pkg,tid,belt){
  var t=(pkg.titles||[]).filter(function(x){return x.id===tid;})[0];if(!t)return {ok:false,msg:'There is no such belt.'};
  var P=(pkg.promotions||[]).filter(function(p){return p.id===t.promotion_id;})[0]||null;
  if(belt==null){delete t.belt;return {ok:true,belt:E.beltOf(t,P),msg:'The '+t.name+' is back to the belt it gives itself.'};}
  t.belt=beltFill(belt,t,P);return {ok:true,belt:t.belt,msg:'A new design for the '+t.name+'.'};
};
/** In a game: give one of your own titles a new belt. It is a moment, and the news says so. */
E.setBelt=function(S,tid,belt){
  var P=S.promos[S.player],t=(P.titles||[]).filter(function(x){return x.id===tid;})[0];if(!t)return {ok:false,msg:'That is not one of your titles.'};
  if(belt==null){delete t.belt;return {ok:true,belt:E.beltOf(t,P),msg:'The '+t.name+' is back to its old belt.'};}
  t.belt=beltFill(belt,t,P);news(S,'you','The '+t.name+' has a new belt.');return {ok:true,belt:t.belt,msg:'The '+t.name+' has a new belt.'};
};
/** The belt of a title found by id anywhere in the game, with its company: for a scene that shows somebody's belt. */
E.beltById=function(S,tid){
  for(var i=0;i<S.order.length;i++){var P=S.promos[S.order[i]];for(var j=0;j<(P.titles||[]).length;j++)if(P.titles[j].id===tid)return E.beltOf(P.titles[j],P);}return null;
};
E.beltFill=function(b,t,P){return beltFill(b,t,P);};
