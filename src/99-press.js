/* wraps: 99-kayfabe.js (it must sort after them; test-buildorder.js checks) */
/* Journalists as characters (the add-ons run, item 15). Four reporters, each with a name, a beat (the ring, the money,
   backstage), a lean for or against your company (bias), how they feel about you (warm, -100 to 100), a grudge (0 to
   100), and sources among your people. What reaches the dirt sheet depends on who has it and who they like: a reporter
   with a source near a secret makes it likelier to leak and gets the credit, a reporter who likes you calls before
   printing, and every week one of them writes a column about your last show, coloured by how they feel. The booker can
   court one (dinner on the company), freeze one out, or feed one a story. The world's dirt sheet writers
   (DB.columnists) are the first reporters; the rest are made from original names. No rnd(S): everything is hashed. */
var PRESS_FIRST=['Mona','Lewis','Dot','Hank','Rosa','Vern','Ida','Clem','Nell','Otis','Fay','Gus'];
var PRESS_LAST=['Pickering','Crane','Haddow','Vance','Mulgrew','Talbot','Okafor','Lindqvist','Barrow','Esposito','Quill','Ferris'];
var PRESS_BEAT={ring:{n:'in the ring',d:'Match quality and who is getting better.'},money:{n:'the money',d:'Ratings, gates, contracts and deals.'},back:{n:'backstage',d:'Who is unhappy, who is feuding for real, who is leaving.'}};
var PRESS_ACT={
  court:{n:'Take them to dinner',d:'On the company. They warm to you, and a grudge softens.',cost:function(S){var P=S.promos[S.player];return Math.max(2000,Math.round(P.inc0*0.004/500)*500);}},
  freeze:{n:'Freeze them out',d:'No access, no comment. Their sources talk more, and the columns turn.'},
  feed:{n:'Feed them a story',d:'Give them something good about your next show. A lift in the build, once a month at most.'}
};
function pressInit(S){
  if(S.press)return S.press;var cols=(dbOf(S).columnists||[]).slice(0,2),L=[],beats=['back','ring','money','back'];
  for(var i=0;i<4;i++){var nm=cols[i]||(PRESS_FIRST[hash(S.seed+'pf'+i)%PRESS_FIRST.length]+' '+PRESS_LAST[hash(S.seed+'pl'+i)%PRESS_LAST.length]);
    L.push({id:i,name:nm,beat:beats[i],bias:Math.round((h01(S.seed+':pb'+i)*2-1)*60),warm:0,grudge:0,src:[],frozen:0,fed:-99});}
  S.press={rep:L,last:-1};return S.press;
}
function pressWord(r){var v=r.warm+r.bias*0.5;return v>=40?'friendly':(v>=10?'fair to you':(v>-20?'neutral':(v>-50?'cool on you':'hostile')));}
/* each reporter keeps one or two sources among your people: the unhappy and the talkative first */
function pressSources(S,X){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;}).sort(function(a,b){return (a.morale-(a.mic||50)*0.2)-(b.morale-(b.mic||50)*0.2)||a.id-b.id;});
  X.rep.forEach(function(r,i){r.src=r.src.filter(function(id){var w=S.w[id];return w&&w.promo===P.id;});if(r.src.length<2&&R.length){var w=R[(i*3+S.week)%Math.min(R.length,8)];if(w&&r.src.indexOf(w.id)<0)r.src.push(w.id);}});
}
/* a source near a secret makes it likelier to get out; a frozen-out reporter's sources talk more */
(function(){var lp=kfLeakP;kfLeakP=function(S,s){var p=lp(S,s);if(!S.press)return p;S.press.rep.forEach(function(r){if(s.ids.some(function(id){return r.src.indexOf(id)>=0;}))p+=r.frozen>S.week?0.05:0.03;});return clamp(p,0.01,0.35);};})();
/* who broke it: the reporter with a source in it, else the one whose beat it is */
function pressWho(S,s){var X=pressInit(S),beat=s.k==='leave'?'money':(s.k==='hurt'?'ring':'back');
  return X.rep.filter(function(r){return s.ids.some(function(id){return r.src.indexOf(id)>=0;});})[0]||X.rep.filter(function(r){return r.beat===beat;})[0]||X.rep[0];}
/* the leak names its reporter; a reporter who likes you calls before printing */
(function(){var ev=EVR.leak;EVR.leak=function(S,e,choice,P){
  if(e.calls!=null&&choice===3){var r=S.press.rep[e.calls];r.warm=clamp(r.warm-15,-100,100);S.kf.prot=clamp(S.kf.prot+12,0,100);youRemember(S,S.w[e.ids[0]],'kill','You had the story about them killed before it ran.',1);
    return r.name+' sits on it, as a favour. It costs you some of their goodwill, and the secret is safe for now.';}
  return ev(S,e,choice,P);};})();
WEEKX.push(function(S){
  if(S.cal||S.over)return;var X=pressInit(S);pressSources(S,X);
  // credit the leak this week to a reporter, and let a friendly one call first
  var e=S.inbox.filter(function(x){return x.type==='leak'&&!x.done&&x.week===undefined;})[0];
  if(e){e.week=S.week;var s={k:e.key,ids:e.ids},r=pressWho(S,s);e.by=r.id;e.text=r.name+' ('+PRESS_BEAT[r.beat].n+') has it. '+e.text;
    var n0=S.news.filter(function(x){return x.w===S.week&&/^RUMOUR:/.test(x.t);})[0];if(n0)n0.t=n0.t.replace(/^RUMOUR:/,'RUMOUR ('+r.name+'):');
    if(r.warm+r.bias*0.5>=40){e.calls=r.id;e.choices=e.choices.concat(['Ask '+r.name+' to sit on it']);e.text+=' '+r.name+' called you before printing.';}}
  // the weekly column on your last show, coloured by how its writer feels about you
  var rep=(S.reports||[]).filter(function(x){return x.promo===S.player&&x.week===S.week;})[0];if(!rep)return;
  var c=X.rep[S.week%X.rep.length],tone=c.warm+c.bias*0.5+(repCS(rep)-70)*1.5,g=gradeG(repCS(rep)),line;
  var pk=function(L){return L[Math.floor(h01(S.seed+':col:'+S.week)*L.length)];};
  if(tone>=25){line=c.name+' on '+rep.name+' ('+g+'): '+pk(['"The office knows what it is doing."','"Whoever books this has a plan, and it shows."','"Worth the ticket. Worth the next one too."']);S.hype=(S.hype||0)+0.02;}
  else if(tone<=-25){line=c.name+' on '+rep.name+' ('+g+'): '+pk(['"Somebody should be asking who books this."','"Three hours I will not get back."','"The talent deserves better than this office."']);S.hype=(S.hype||0)-0.02;if(c.grudge>=60&&!S.owner.me)S.owner.trust=clamp(S.owner.trust-1,0,100);}
  else line=c.name+' on '+rep.name+' ('+g+'): '+pk(['"It was a wrestling show."','"Some of it worked. Some of it was filler."','"Nothing to write home about, nothing to complain about."']);
  news(S,'world','COLUMN: '+line);X.last=S.week;
});
/** For the screens: the reporters, how each feels about you, and what each answer costs. */
E.press=function(S){var X=pressInit(S);pressSources(S,X);return X.rep.map(function(r){return {id:r.id,name:r.name,beat:PRESS_BEAT[r.beat].n,beatD:PRESS_BEAT[r.beat].d,word:pressWord(r),grudge:r.grudge>=60?'holds a grudge':(r.grudge>=30?'remembers being snubbed':''),
  frozen:r.frozen>S.week,sources:r.src.length,acts:Object.keys(PRESS_ACT).map(function(k){var A=PRESS_ACT[k];return {k:k,n:A.n,d:A.d,cost:A.cost?A.cost(S):0,can:k!=='feed'||S.week-r.fed>=4,why:k==='feed'&&S.week-r.fed<4?'You fed them a story '+(S.week-r.fed)+' weeks ago.':''};})};});};
E.pressDo=function(S,id,k){
  var X=pressInit(S),r=X.rep[id],P=S.promos[S.player];if(!r||!PRESS_ACT[k])return {ok:false,msg:'Nobody to talk to.'};
  if(k==='court'){var c=PRESS_ACT.court.cost(S);if(P.cash<c)return {ok:false,msg:'The company cannot cover dinner.'};P.cash-=c;r.warm=clamp(r.warm+20,-100,100);r.grudge=clamp(r.grudge-15,0,100);r.frozen=0;return {ok:true,msg:'Dinner with '+r.name+'. They are '+pressWord(r)+' now.'};}
  if(k==='freeze'){r.warm=clamp(r.warm-30,-100,100);r.grudge=clamp(r.grudge+25,0,100);r.frozen=S.week+8;return {ok:true,msg:r.name+' is frozen out for eight weeks. Their sources will talk more, and they will remember it.'};}
  if(S.week-r.fed<4)return {ok:false,msg:'You fed them a story a few weeks ago. Too often and it stops being news.'};
  r.fed=S.week;r.warm=clamp(r.warm+8,-100,100);S.hype=(S.hype||0)+0.05;news(S,'world','SCOOP ('+r.name+'): big plans for '+P.name+'’s next show, sources say.');
  return {ok:true,msg:r.name+' runs it. A little more buzz for your next show.'};
};
