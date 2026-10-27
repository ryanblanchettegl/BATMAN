// @ts-nocheck
/* Moved from src/99-progress.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, cal, clamp, h01, rosterOf, starQ, workRate } from './00-core';
import { NEWX, SHOWX, TASKX, WEEKX } from './10-match';
import { youRemember } from './66-relations';
import { overallOf, overallRaw } from './99-overall';
$L.progNeed = progNeed; $L.progAgeX = progAgeX; $L.progInit = progInit; $L.progAll = progAll; $L.progCap = progCap; $L.progCost = progCost; $L.progGain = progGain; $L.progUse = progUse; $L.progSpend = progSpend; $L.progAuto = progAuto; $L.progShow = progShow; $L.rgWhy = rgWhy; $L.rgRow = rgRow; $L.progLose = progLose; $L.regWeek = regWeek;
/* wraps: 75-people.js, 90-api.js, 34-night.js (it must sort after them; test-buildorder.js checks) */
/* Progression (Ryan, 20 October: "each wrestler levels up and each level they are able to add 1 or 2 attribute points,
   similar to how Madden does progression ... older wrestlers get worse in the ring but keep their mic skills,
   hardcore matches help your hardcore skill"). After Madden's franchise mode and NBA 2K's career modes:
     - Experience (w.pxp) comes from what happens on the night: how many stars a match or a promo got (squared, so a
       great match is worth far more than two average ones), the main event, a big show, a title, a win. A five-star
       match or promo pays a bonus of its own.
     - Experience fills levels (w.lv). Each level gives two attribute points, some give three (w.ap). Raising an attribute
       that is already high costs more, the way Madden's skill points do.
     - A development trait (w.dev: Normal, Rising star, Blue-chip, Generational) speeds learning and adds points, and
       can move up or down at the end of a year by how the year went.
     - Use it to grow it (NBA 2K's badges): a hardcore match teaches Hardcore, a submission or iron man match Technical,
       a long match Stamina, a promo the Microphone and Charisma, a main event Star quality. These come on their own,
       a little at a time (w.gx), over and above the points.
     - Caps: ring skills stop at what the wrestler's potential allows; speed, stamina and toughness stop growing once
       they are past their peak (the yearly decline in src/75-people.js still takes them down); the microphone and
       charisma keep growing with age, and a veteran gains a little on the microphone each year.
   Rival companies spend their points at once, by style and gimmick. The player's go into a pop-up on the Roster
   (or let them choose), and After the show says who gained, who levelled up and who earned a five-star bonus.
   Money: the asking wage counts the overall rating as well as popularity, so a rich company can buy the finished
   article and a small one signs the raw and builds them up. No rnd(S): everything here is worked out. */
export var PROG_ATTR=[
  {k:'brawl',n:'Brawling',g:'ring'},{k:'tech',n:'Technical',g:'ring'},{k:'speed',n:'Agility',g:'body'},{k:'stam',n:'Stamina',g:'body'},
  {k:'hc',n:'Hardcore',g:'ring'},{k:'dur',n:'Toughness',g:'body'},{k:'safe',n:'Injury',g:'ring',d:'How safely they work: high means fewer injuries, to them and to the people they work with.'},{k:'cons',n:'Consistency',g:'ring'},
  {k:'mic',n:'Microphone',g:'mic'},{k:'cha',n:'Charisma',g:'mic'},{k:'sq',n:'Star quality',g:'mic'}
];
$L.PROG_ATTR = PROG_ATTR;
export var PROG_BY={};
$L.PROG_BY = PROG_BY;PROG_ATTR.forEach(function(a){$L.PROG_BY[a.k]=a;});
export var DEV=[{n:'Normal',x:1,d:'Learns at the usual rate.'},{n:'Rising star',x:1.2,d:'Learns a little faster than most.'},
  {n:'Blue-chip',x:1.45,d:'Learns fast, and earns an extra point every fourth level.'},{n:'Generational',x:1.75,d:'Learns fastest of all, and earns an extra point every other level.'}];
$L.DEV = DEV;
/* which attributes each style and gimmick works on first, when the wrestler chooses */
export var STYLE_PRI={B:['brawl','hc','dur'],T:['tech','cons','safe'],H:['speed','stam','tech'],P:['brawl','dur','stam'],A:['tech','brawl','speed'],S:['brawl','tech','speed'],E:['cha','mic','sq']};
$L.STYLE_PRI = STYLE_PRI;
export var GIM_PRI={brute:['brawl','hc'],cocky:['mic','cha'],underdog:['speed','stam'],daredevil:['speed','hc'],technician:['tech','cons'],monster:['brawl','dur'],oldhand:['tech','mic'],rebel:['mic','brawl'],hero:['cha','stam'],showman:['cha','mic'],mystic:['cha','sq'],workhorse:['stam','cons'],outlaw:['hc','brawl'],comedy:['mic','cha']};
$L.GIM_PRI = GIM_PRI;
export function progNeed(lv){return 300+60*lv;}   // a young prospect levels every month or two; an established star three or four times a year
export function progAgeX(w){var a=w.age||28;return a<=23?1.35:a<=27?1.15:a<=31?1:a<=35?0.85:0.7;}
export function progInit(S,w){
  if(!w||w.lv!=null)return;
  var ov=overallRaw(w),a=w.age||28,sq=w.sq==null?50:w.sq,pot=w.pot||workRate(w);
  w.lv=clamp(Math.round(1+Math.max(0,a-19)*0.9+(ov-55)/5),1,45);
  w.pxp=Math.floor(h01(w.name+'pxp')*progNeed(w.lv)*0.8);w.ap=0;w.gx={};
  var sc=(pot-60)*0.6+(sq-50)*0.4-Math.max(0,a-27)*3;
  w.dev=sc>=28&&a<=26?3:sc>=20?2:sc>=9?1:0;
}
export function progAll(S){S.w.forEach(function(w){progInit(S,w);});}
/** How far an attribute can go for this wrestler now. */
export function progCap(w,k){
  var A=$L.PROG_BY[k];if(!A)return 99;var cur=w[k]||1,pri=($L.STYLE_PRI[w.style]||[]).indexOf(k)>=0?4:0;
  if(A.g==='mic')return 99;
  var cap=clamp((w.pot||workRate(w))+6+pri,cur,99);
  if(A.g==='body'&&w.pk&&w.age>w.pk[1])cap=cur;   // past the peak the body does not come back
  if(A.g==='ring'&&w.cl&&w.age>=w.cl)cap=cur;     // in steep decline nothing new is learned in the ring
  return cap;
}
/** What a point costs at this value, the way Madden's skill points cost more near the top. */
export function progCost(v){return v<80?1:v<90?2:3;}
/* add experience; levels go up; points are earned (and spent at once for anybody but the player) */
export function progGain(S,w,n,out){
  progInit(S,w);n=Math.round(n*($L.DEV[w.dev]||$L.DEV[0]).x*progAgeX(w));if(n<=0)return;
  w.pxp+=n;w.yxp=(w.yxp||0)+n;var lv0=w.lv,pts=0;
  while(w.pxp>=progNeed(w.lv)&&w.lv<99){w.pxp-=progNeed(w.lv);w.lv++;var p=2+(w.lv%5===0?1:0)+(w.dev===2&&w.lv%4===0?1:0)+(w.dev===3&&w.lv%2===0?1:0);pts+=p;}
  if(pts){w.ap=(w.ap||0)+pts;if(w.promo!==S.player)progAuto(S,w);else if(w.lv>lv0)youRemember(S,w,'levelup','They reached level '+w.lv+' on your shows',1);}
  if(out){out.xp+=n;if(w.lv>lv0){out.lv0=out.lv0||lv0;out.lv1=w.lv;out.pts=(out.pts||0)+pts;}}
}
/* use it to grow it: a little of one attribute, kept until it adds up to a whole point */
export function progUse(w,k,amt,out){
  if(!$L.PROG_BY[k]||amt<=0)return;var gx=w.gx||(w.gx={});gx[k]=Math.round(((gx[k]||0)+amt)*100)/100;
  if(gx[k]>=1){gx[k]=Math.round((gx[k]-1)*100)/100;if(!gx[k])delete gx[k];if((w[k]||1)<progCap(w,k)){w[k]=clamp((w[k]||1)+1,1,99);if(out)(out.learned=out.learned||[]).push($L.PROG_BY[k].n);}}
}
/** Spend one point on an attribute. Returns null on success, or why not. */
export function progSpend(w,k){
  var A=$L.PROG_BY[k];if(!A)return 'That is not an attribute.';var v=w[k]||1,c=progCost(v);
  if((w.ap||0)<c)return 'Not enough points: that takes '+c+'.';if(v>=progCap(w,k))return A.n+' is as high as it can go for them right now.';
  w.ap-=c;w[k]=v+1;return null;
}
/** Let them choose: points go to their style's and gimmick's strengths first, then wherever is cheapest to grow. */
export function progAuto(S,w){
  var pri=($L.STYLE_PRI[w.style]||[]).concat($L.GIM_PRI[w.gim]||[]),guard=0;
  if(w.age>=34)pri=['mic','cha'].concat(pri);   // a veteran puts it into the microphone
  while((w.ap||0)>0&&guard++<40){
    var opts=$L.PROG_ATTR.map(function(a){var v=w[a.k]||1,i=pri.indexOf(a.k);return {k:a.k,v:v,c:progCost(v),s:(i>=0?30-i*4:0)-(v-50)*0.3};})
      .filter(function(o){return o.v<progCap(w,o.k)&&o.c<=w.ap;}).sort(function(a,b){return b.s-a.s;});
    if(!opts.length)break;progSpend(w,opts[0].k);
  }
}
export var PROG_HC=/hardcore|tables|street|nodq|no_dq|barbed|weapons|cell|lumber|fire|cage|ladder/;
$L.PROG_HC = PROG_HC;
/* every show of every company: experience for the people on it, and what they used */
export function progShow(S,P,show,rep,card){
  if(S.cal||!rep||!rep.segs)return;var isPl=P&&P.id===S.player,big=!!(show&&show.big),acc={};
  var ms=rep.segs.filter(function(s){return s.k==='match';}),last=ms[ms.length-1];
  var row=function(w){var o=acc[w.id];if(!o)o=acc[w.id]={id:w.id,xp:0,why:[]};return o;};
  rep.segs.forEach(function(s){
    var ids=(s.ids||s.bids||[]).filter(function(id){var w=S.w[id];return w&&!w.nw&&w.promo===P.id;});if(!ids.length)return;
    var q=starQ(s.ov||0),st=q/4,five=q>=20;
    if(s.k==='match'){
      var base=(6+5*st*st)*(s===last?1.3:1)*(big?1.3:1),stip=String(s.stip||'').toLowerCase().replace(/[^a-z]/g,'');
      ids.forEach(function(id){var w=S.w[id],o=row(w),won=s.win&&String(s.win).indexOf(w.name)>=0;
        progGain(S,w,base*(won?1.2:1)+(s.title&&won?30:0)+(five?150:0),o);if(five)o.why.push('a five-star match');
        if($L.PROG_HC.test(stip))progUse(w,'hc',0.45,o);
        if(/submission|iron/.test(stip))progUse(w,'tech',0.35,o);
        if(/ladder/.test(stip)||w.style==='H')progUse(w,'speed',0.2,o);
        if((s.mins||0)>=20)progUse(w,'stam',0.35,o);
        if(st>=4)progUse(w,'cons',0.2,o);
        if(s===last)progUse(w,'sq',0.15,o);
        // regression: three poor matches in a row and they lose their touch a little
        if(st<=1.5){w.cold=(w.cold||0)+1;if(w.cold>=3){delete w.cold;w.pxp=Math.max(0,(w.pxp||0)-Math.round(progNeed(w.lv)*0.25));progLose(S,w,'cons',1,'c',o);}}else delete w.cold;
      });
    }else if(s.k==='angle'||s.k==='promo'){
      ids.forEach(function(id){var w=S.w[id],o=row(w);progGain(S,w,(5+4*st*st)*(big?1.2:1)+(five?120:0),o);if(five)o.why.push('a five-star promo');
        progUse(w,'mic',five?1:0.35,o);progUse(w,'cha',0.25,o);});
    }
  });
  if(isPl)rep.prog=Object.keys(acc).map(function(k){return acc[k];}).filter(function(o){return o.xp>0||(o.lost&&o.lost.length);}).sort(function(a,b){return (b.lv1?1:0)-(a.lv1?1:0)||b.xp-a.xp;});
}
SHOWX.push(progShow);
E.__progShow=progShow;   // for test-progress.js
/* ---------- regression (Ryan, 21 October: "they should be a system for regression as well") ----------
   What can take an attribute down, the way the sports games do it, worked out and never drawn at random:
     - age: past the peak the body goes first (the yearly decline in src/75-people.js), and in steep decline
       consistency and how safely they work go too; the microphone never does;
     - ring rust: eight weeks without a match takes the edge off stamina and consistency, a point every four weeks,
       up to three a spell; matches give it back (long matches teach Stamina, good ones Consistency);
     - a cold streak: three poor matches in a row costs consistency and a quarter of a level's experience;
     - a long injury: six weeks out or more costs agility and stamina when they come back, more after twelve.
   Every loss is kept on the wrestler (w.rgx, the last four, each [week, attribute, points, reason code] to keep saves small), named on the notification bar for the player's own
   people, listed after the show and shown in the Attributes pop-up. */
/** A reason code in words: a age, c a cold streak, rN ring rust after N weeks, iN back from N weeks injured. */
export function rgWhy(c){c=String(c||'');var n=c.slice(1);return c[0]==='a'?'age':c[0]==='c'?'a cold streak':c[0]==='r'?'ring rust: '+n+' weeks without a match':c[0]==='i'?n+' weeks out injured':c;}
export function rgRow(r){return Array.isArray(r)?{w:r[0],k:r[1],n:r[2],why:rgWhy(r[3])}:r;}   // an older save kept them as objects
export function progLose(S,w,k,n,code,out){
  if(!w||!$L.PROG_BY[k]||n<=0)return 0;var v0=w[k]||1,v1=clamp(v0-n,15,99),d=v0-v1;if(!d)return 0;w[k]=v1;var why=rgWhy(code);
  var R=w.rgx||(w.rgx=[]);R.unshift([S.week,k,d,code]);if(R.length>4)R.length=4;
  if(out)(out.lost=out.lost||[]).push($L.PROG_BY[k].n+' -'+d+' ('+why+')');
  else if(w.promo===S.player&&!w.nw){var q=S.regQ||(S.regQ={});(q[w.id]=q[w.id]||[]).push($L.PROG_BY[k].n+' -'+d+' ('+why+')');}
  return d;
}
/* age: the existing yearly decline, written down; past the cliff consistency and safety go too */
(function(){
  var bd=$L.birthday;
  $L.birthday=function(S,w){
    var before={};$L.PROG_ATTR.forEach(function(a){before[a.k]=w[a.k];});bd.apply(this,arguments);if(w.rt||w.nw)return;
    var R=w.rgx||(w.rgx=[]),lost=[];
    $L.PROG_ATTR.forEach(function(a){var d=(before[a.k]||0)-(w[a.k]||0);if(d>0){R.unshift([S.week,a.k,d,'a']);lost.push(a.n+' -'+d);}});
    if(R.length>4)R.length=4;
    if(w.cl&&w.age>=w.cl){progLose(S,w,'cons',1,'a',{lost:lost});progLose(S,w,'safe',1,'a',{lost:lost});}
    if(lost.length&&w.promo===S.player)$L.note(S,'Regression',w.name+' turned '+w.age+': '+lost.join(', ')+'.','bad');
  };
})();
export function regWeek(S){
  if(S.cal)return;
  S.w.forEach(function(w){
    if(!w||w.nw||w.rt||w.promo==='FA')return;
    if(w.wk==null)w.wk=S.week;   // nobody starts a game rusty
    // a long injury: back in the ring a step slower
    if(w.rwl>=6&&w.rgI!==w.rw){w.rgI=w.rw;var big=w.rwl>=12?2:1;progLose(S,w,'speed',big,'i'+w.rwl);progLose(S,w,'stam',big,'i'+w.rwl);}
    // ring rust: weeks without a match, not counting time out hurt
    if(w.inj>0)return;var idle=S.week-w.wk;
    if(idle<8){delete w.rustN;return;}
    if(idle%4===0&&(w.rustN||0)<3){w.rustN=(w.rustN||0)+1;progLose(S,w,w.rustN%2?'stam':'cons',1,'r'+idle);}
  });
  var q=S.regQ;S.regQ=null;
  if(q)Object.keys(q).forEach(function(id){var w=S.w[id];if(w)$L.note(S,'Regression',w.name+': '+q[id].join(', ')+'.','bad');});
}
WEEKX.push(regWeek);
E.__regWeek=regWeek;E.__birthday=function(S,w){$L.birthday(S,w);};   // for test-progress.js
/* somebody who leaves you for a rival with points still to spend spends them at once, as the rival's people do */
WEEKX.push(function(S){if(S.cal)return;S.w.forEach(function(w){if(w&&(w.ap||0)>0&&!w.nw&&w.promo!==S.player&&w.promo!=='FA')progAuto(S,w);});});
/* points left unspent for eight weeks: the wrestler trains on their own and spends them (they do not wait forever) */
WEEKX.push(function(S){
  if(S.cal)return;var n=0;
  rosterOf(S,S.player).forEach(function(w){if(!(w.ap>0)||w.nw){w.apw=null;return;}if(w.apw==null){w.apw=S.week;return;}if(S.week-w.apw>=8){progAuto(S,w);w.apw=null;n++;}});
  if(n)$L.note(S,'Progress',n+(n===1?' wrestler':' wrestlers')+' spent points you left waiting on what suits them.','');
});
/* a year ends: the development trait moves with the year they had (Madden's dev trait changes) */
WEEKX.push(function(S){
  if(S.cal||S.week%48!==0)return;
  S.w.forEach(function(w){if(w.lv==null||w.nw||w.rt)return;var y=w.yxp||0;w.yxp=0;
    var up=y>=6500&&w.age<=30&&w.dev<3,down=y<1200&&w.dev>0&&(w.age>=30||w.promo!=='FA');
    if(up){w.dev++;if(w.promo===S.player)$L.note(S,'Progress',w.name+' is now '+$L.DEV[w.dev].n.toLowerCase()+': a big year.','good');}
    else if(down){w.dev--;if(w.promo===S.player)$L.note(S,'Progress',w.name+' has slowed to '+$L.DEV[w.dev].n.toLowerCase()+': a quiet year.','bad');}
  });
});
/* a birthday: the yearly decline still takes the body; a veteran's microphone and presence keep growing */
(function(){
  var bd=$L.birthday;
  $L.birthday=function(S,w){bd.apply(this,arguments);if(w.rt||w.nw)return;
    if(w.age>=30&&w.mic<92)w.mic=Math.min(99,w.mic+1);
    if(w.age>=32&&w.age%2===0&&(w.cha||50)<92)w.cha=Math.min(99,(w.cha||50)+1);
  };
})();
/* the first time a game is opened, everybody gets a level and a trait */
NEWX.push(function(S){progAll(S);});
/* money: what a wrestler asks counts how good they are as well as how popular, so the best cost the most */
(function(){
  var a0=E.ask,c0=E.canSign;
  E.ask=function(S,w){var a=a0.apply(this,arguments);if(!w||w.nw)return a;var ov=overallRaw(w),m=clamp(Math.pow(1.045,ov-(w.ovr||50)),0.7,1.6);return Math.round(a*m/50)*50;};
  E.canSign=function(S,w){if(!c0.apply(this,arguments))return false;var P=S.promos[S.player];return !w||overallRaw(w)<=P.image+45;};
})();
/* the player's wrestlers with points waiting: a reminder on the desk, never a stop */
TASKX.push(function(S,P,add){
  var n=rosterOf(S,S.player).filter(function(w){return (w.ap||0)>0&&!w.nw;});if(!n.length)return;
  var t=n.reduce(function(a,w){return a+w.ap;},0);
  add('points',t+' attribute point'+(t===1?'':'s')+' to spend across '+n.length+(n.length===1?' wrestler':' wrestlers')+'. Spend them on the Roster, or let them choose.','roster','Spend points',{need:false,done:'Points spent.',short:'Points to spend ('+t+')'});
});
/* After the show: who gained, who levelled up, who earned a bonus, what they learned */
(function(){var af=E.afterShow;E.afterShow=function(S){var r=af.apply(this,arguments);if(!r||!r.items)return r;
  var rep=null;for(var i=0;i<S.reports.length;i++){if(S.reports[i].week===S.week&&S.reports[i].left&&S.reports[i].left.key===r.key){rep=S.reports[i];break;}}
  if(!rep||!rep.prog||!rep.prog.length)return r;
  var P=rep.prog,lostP=P.filter(function(o){return o.lost&&o.lost.length;}),ups=P.filter(function(o){return o.lv1;}),five=P.filter(function(o){return o.why.length;}),learned=P.filter(function(o){return o.learned&&o.learned.length;});
  var nm=function(o){return S.w[o.id]?S.w[o.id].name:'Somebody';};
  var line=(ups.length?ups.slice(0,2).map(nm).join(' and ')+(ups.length>2?' and '+(ups.length-2)+' more':'')+' levelled up':'Nobody levelled up')+(five.length?'; '+nm(five[0])+' earned a five-star bonus':'')+(lostP.length?'; '+nm(lostP[0])+' slipped':'')+'.';
  var detail=P.slice(0,24).map(function(o){var w=S.w[o.id];return nm(o)+': +'+o.xp+' XP'+(o.why.length?' ('+o.why[0]+')':'')+(o.lv1?'. Level '+o.lv0+' to '+o.lv1+', '+o.pts+' point'+(o.pts===1?'':'s')+' to spend':(w?', level '+w.lv:''))+(o.learned&&o.learned.length?'. Learned: '+o.learned.join(', ')+' +1':'')+(o.lost&&o.lost.length?'. Lost: '+o.lost.join(', '):'')+'.';});
  if(learned.length)detail.push('Doing it grows it: hardcore matches teach Hardcore, submission and iron man matches Technical, long matches Stamina, promos the Microphone.');
  var seen=!!(S.nightSeen&&S.nightSeen.key===r.key&&S.nightSeen.k&&S.nightSeen.k.prog),it={k:'prog',n:'Progress',line:line,detail:detail,tone:ups.length||five.length?'good':'',seen:seen};
  var at=r.items.findIndex(function(x){return x.k==='next';});if(at<0)r.items.push(it);else r.items.splice(at,0,it);if(!seen)r.unseen=(r.unseen||0)+1;
  return r;};})();
/** A wrestler's progression for the screens: level, experience, trait, points, and every attribute with its cap and cost. */
E.progInfo=function(S,id){var w=S.w[id];if(!w)return null;progInit(S,w);
  return {lv:w.lv,xp:w.pxp,need:progNeed(w.lv),ap:w.ap||0,dev:w.dev,devN:$L.DEV[w.dev].n,devD:$L.DEV[w.dev].d,overall:overallOf(w),
    reg:(w.rgx||[]).map(rgRow).map(function(r){return {k:r.k,n:$L.PROG_BY[r.k]?$L.PROG_BY[r.k].n:r.k,by:r.n,why:r.why,when:cal(r.w).label};}),
    attrs:$L.PROG_ATTR.map(function(a){var v=w[a.k]||1,cap=progCap(w,a.k),fall=(w.rgx||[]).map(rgRow).filter(function(r){return r.k===a.k&&S.week-r.w<48;}).reduce(function(t,r){return t+r.n;},0);return {k:a.k,n:a.n,d:a.d||'',g:a.g,fall:fall,v:v,cap:cap,cost:progCost(v),can:v<cap&&(w.ap||0)>=progCost(v),grow:+((w.gx||{})[a.k]||0).toFixed(2)};})};};
/** Spend a point (the player's own wrestlers). */
E.spendAttr=function(S,id,k){var w=S.w[id];if(!w||w.promo!==S.player)return {ok:false,msg:'Not one of yours.'};progInit(S,w);var why=progSpend(w,k);return why?{ok:false,msg:why}:{ok:true,msg:w.name+': '+$L.PROG_BY[k].n+' '+w[k]+'.'};};
/** Let them choose where their points go. */
E.autoSpend=function(S,id){var w=S.w[id];if(!w||w.promo!==S.player)return {ok:false,msg:'Not one of yours.'};var a=w.ap||0;progAuto(S,w);return {ok:true,msg:w.name+' spent '+(a-(w.ap||0))+' point'+(a-(w.ap||0)===1?'':'s')+' on what suits them.'};};
/** Let every wrestler of yours with points choose. */
E.autoSpendAll=function(S){var n=0;rosterOf(S,S.player).forEach(function(w){if((w.ap||0)>0){var a=w.ap;progAuto(S,w);n+=a-(w.ap||0);}});return {ok:true,msg:n+' point'+(n===1?'':'s')+' spent across the roster.'};};
E.PROG_ATTR=PROG_ATTR;E.DEV=DEV;

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.PROG_ATTR = PROG_ATTR;
$L.PROG_BY = PROG_BY;
$L.DEV = DEV;
$L.STYLE_PRI = STYLE_PRI;
$L.GIM_PRI = GIM_PRI;
$L.progNeed = progNeed;
$L.progAgeX = progAgeX;
$L.progInit = progInit;
$L.progAll = progAll;
$L.progCap = progCap;
$L.progCost = progCost;
$L.progGain = progGain;
$L.progUse = progUse;
$L.progSpend = progSpend;
$L.progAuto = progAuto;
$L.PROG_HC = PROG_HC;
$L.progShow = progShow;
$L.rgWhy = rgWhy;
$L.rgRow = rgRow;
$L.progLose = progLose;
$L.regWeek = regWeek;
