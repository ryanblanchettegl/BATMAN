// @ts-nocheck
/* Moved from src/87-develop.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.campers = campers; $L.trainerQ = trainerQ; $L.schoolCap = schoolCap; $L.schoolFee = schoolFee; $L.schoolRun = schoolRun;
/* ---------- the development side: the camp's weekly show, and (later) the wrestling school ---------- */

/* ---------- 51. A developmental show: campers work a small weekly show that runs by itself (w.dv, P.devRep) ---------- */
export function campers(S){var P=S.promos[S.player];return $L.rosterOf(S,P.id).filter(function(w){return w.camp&&!w.nw;});}
$L.WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],C=$L.campers(S);if(C.length<2){P.devRep=P.devRep||[];return;}
  var order=C.slice().sort(function(a,b){return $L.hash('dv'+S.week+a.id)-$L.hash('dv'+S.week+b.id);}),lines=[],lv=P.camp||0;
  for(var i=0;i+1<order.length;i+=2){
    var a=order[i],b=order[i+1],ra=$L.workRate(a),rb=$L.workRate(b),ch=$L.chem(S,a.id,b.id),q=(ra+rb)/2+ch+($L.rnd(S)*2-1)*6;
    var win=$L.chance(S,$L.clamp(0.5+(a.ovr-b.ovr)/80,0.2,0.8))?a:b,los=win===a?b:a;
    [a,b].forEach(function(w){
      if($L.workRate(w)<w.pot)w.xp+=0.12+0.04*lv;
      var d=w.dv||(w.dv={n:0,best:0,w:0,last:''});d.n++;d.w=S.week;d.best=Math.max(d.best,Math.round(q));
    });
    win.dv.last=win.name+' beat '+los.name+'. '+(q>=75?'Real polish.':(q>=60?'Solid work.':(q>=45?'Plenty of rough edges.':'It was hard to watch.')));
    los.dv.last=los.name+' lost to '+win.name+'. '+(q>=75?'They looked good doing it.':(q>=60?'A fair showing.':'Not their night.'));
    lines.push({a:a.id,b:b.id,w:win.id,q:Math.round(q),text:win.dv.last});
    if($L.chance(S,0.015)){var h=$L.chance(S,0.5)?a:b;h.inj=Math.max(h.inj,$L.ri(S,1,3));lines[lines.length-1].text+=' '+h.name+' picked up a knock.';}
  }
  if(order.length%2){var o=order[order.length-1];o.dv=o.dv||{n:0,best:0,w:0,last:''};o.dv.w=S.week;o.dv.last=o.name+' cut a promo on the show.';if(o.mic<(o.mic0||o.mic)+15)o.micx=(o.micx||0)+0.15;lines.push({a:o.id,b:null,w:null,q:0,text:o.dv.last});}
  P.devRep=(P.devRep||[]);P.devRep.unshift({w:S.week,lines:lines});if(P.devRep.length>4)P.devRep.length=4;
  // a camper who has outgrown the camp asks for a call-up
  if(S.inbox.some(function(e){return e.type==='callup'&&!e.done;}))return;
  var rd=C.filter(function(w){return w.dv&&w.dv.n>=6&&(w.dvHold==null||S.week>=w.dvHold)&&($L.workRate(w)>=(w.cw0||999)+5||w.mic>=(w.cm0||999)+8||w.dv.n>=16);}).sort(function(a,b){return b.ovr-a.ovr;});
  if(rd.length){
    var w=rd[0];
    $L.pushEv(S,{type:'callup',w:w.id,text:w.name+' has been on the camp show for '+w.dv.n+' weeks and has outgrown it. '+(w.dv.best>=70?'Their best match there was '+$L.starG(w.dv.best)+'. ':'')+'The crowd at the camp show knows the name.',
      choices:['Call them up now, with a debut','Another month in camp','Release them']});
  }
});
$L.EVR.callup=function(S,ev,choice,P,w){
  if(!w.camp)return w.name+' is already back on the roster.';
  if(choice===0){$L.E.callUp(S,w.id);w.mom=$L.clamp(w.mom+2,-10,10);w.morale=$L.clamp(w.morale+8,0,100);$L.news(S,'story',w.name+' graduated from the camp show and makes a debut.');return w.name+' is called up. The crowd will meet them on the next show.';}
  if(choice===1){w.dvHold=S.week+4;w.morale=$L.clamp(w.morale-2,0,100);return w.name+' stays in camp for a month.';}
  return $L.E.release(S,w.id)||w.name+' is released.';
};
$L.E.devShow=function(S){
  var P=S.promos[S.player],C=$L.campers(S);
  return {n:C.length,cap:$L.E.campInfo(S).cap,report:(P.devRep&&P.devRep[0])||null,
    rows:C.map(function(w){return {w:w,matches:(w.dv&&w.dv.n)|0,best:(w.dv&&w.dv.best)|0,last:(w.dv&&w.dv.last)||'No matches yet.',gain:Math.round($L.workRate(w)-(w.cw0||$L.workRate(w))),micGain:Math.round(w.mic-(w.cm0||w.mic))};})};
};

/* ---------- 52. The wrestling school: students pay a fee, one in several becomes a prospect, the trainer decides how good (P.school) ---------- */
export function trainerQ(S,P){
  var tr=$L.staffOf(S,'trainer').sort(function(a,b){return $L.workRate(b)-$L.workRate(a);})[0];
  return tr?{q:$L.clamp(($L.workRate(tr)-50)/40,0.1,1.2),who:tr}:{q:0.1+0.15*(P.camp||0),who:null};
}
export function schoolCap(P){return 8+6*(P.camp||0);}
export function schoolFee(P){return Math.round(P.inc0*0.00018);}
export function schoolRun(P){return Math.round(P.inc0*0.0015);}
$L.E.school=function(S){
  var P=S.promos[S.player],sc=P.school,tq=$L.trainerQ(S,P);
  return {open:!!sc,students:sc?sc.n:0,cap:$L.schoolCap(P),fee:$L.schoolFee(P),run:$L.schoolRun(P),setup:Math.round(P.inc0*0.03),
    quality:tq.q,qualityWord:tq.q>=0.8?'excellent':(tq.q>=0.5?'good':(tq.q>=0.3?'fair':'poor')),trainer:tq.who,
    chance:Math.round((0.03+0.1*tq.q)*100),grads:sc?sc.grads:0,prospects:sc?sc.pros:0,next:sc?Math.max(0,sc.term-S.week):0,
    income:sc?sc.n*$L.schoolFee(P)-$L.schoolRun(P):0};
};
$L.E.openSchool=function(S){
  var P=S.promos[S.player],i=$L.E.school(S);
  if(P.school)return {ok:false,text:'The school is already open.'};
  if(P.cash<i.setup)return {ok:false,text:'Not enough cash to open a school ('+$L.money(i.setup)+').'};
  P.cash-=i.setup;P.school={since:S.week,n:Math.min(4,i.cap),term:S.week+12,grads:0,pros:0};
  $L.news(S,'story','You opened a wrestling school.');
  return {ok:true,text:'The school is open. It cost '+$L.money(i.setup)+'. Students pay '+$L.money(i.fee)+' a week each, and a class graduates every twelve weeks.'};
};
$L.E.closeSchool=function(S){var P=S.promos[S.player];if(!P.school)return {ok:false,text:'There is no school.'};P.school=null;$L.news(S,'story','You closed the wrestling school.');return {ok:true,text:'The school is closed.'};};
$L.WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],sc=P.school;if(!sc)return;
  var cap=$L.schoolCap(P),tq=$L.trainerQ(S,P);
  sc.n=Math.min(cap,sc.n+($L.chance(S,0.5+P.image/200)?2:1));   // word spreads, so the class fills
  P.cash+=sc.n*$L.schoolFee(P)-$L.schoolRun(P);
  if(S.week<sc.term)return;
  // graduation day
  var I=$L.dbOf(S).indie,styles=['B','T','H','P','A','S','E'],made=[],have={};S.w.forEach(function(w){have[w.name]=1;});
  var grads=sc.n,p=0.03+0.1*tq.q,mine=$L.rosterOf(S,P.id).filter(function(x){return x.sch===P.id&&x.ovr<45;}).length;sc.grads+=grads;
  for(var i=0;i<grads;i++){
    if(!$L.chance(S,p)||mine+made.length>=3)continue;
    var g=$L.chance(S,0.3)?'F':'M',nm,tries=0;
    do{nm=$L.pick(S,g==='F'?I.firstF:I.firstM)+' '+$L.pick(S,I.last);}while(have[nm]&&tries++<40);
    if(have[nm])continue;have[nm]=1;
    var work=$L.ri(S,40,58)+Math.round(tq.q*8),w=$L.addWrestler(S,{name:nm,g:g,ovr:$L.ri(S,8,22)+Math.round(tq.q*4),style:$L.pick(S,styles),work:work,mic:$L.ri(S,35,75),align:$L.chance(S,0.5)?'F':'H',age:$L.ri(S,19,25)},'FA',null);
    w.pot=$L.clamp(work+$L.ri(S,10,22)+Math.round(tq.q*10),work,97);w.sq=$L.clamp($L.ri(S,35,75),20,97);w.rk=$L.cal(S.week).year;$L.assignGim(w);$L.mile(S,w,'debut','Graduated from the '+P.name+' school');
    $L.joinCompany(S,w,P,150,52);w.sch=P.id;
    if($L.E.campInfo(S).n<$L.E.campInfo(S).cap)$L.E.sendCamp(S,w.id,'ring');
    made.push(w);
  }
  sc.pros+=made.length;sc.n=Math.round(sc.n*0.3);sc.term=S.week+12;
  $L.news(S,'story','The school class graduated: '+grads+' students, '+(made.length?made.length+' signed as prospects ('+made.map(function(w){return w.name;}).join(', ')+')':'nobody good enough to sign')+'.');
});

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.campers = campers;
$L.trainerQ = trainerQ;
$L.schoolCap = schoolCap;
$L.schoolFee = schoolFee;
$L.schoolRun = schoolRun;
