/* ---------- the development side: the camp's weekly show, and (later) the wrestling school ---------- */

/* ---------- 51. A developmental show: campers work a small weekly show that runs by itself (w.dv, P.devRep) ---------- */
function campers(S){var P=S.promos[S.player];return rosterOf(S,P.id).filter(function(w){return w.camp&&!w.nw;});}
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],C=campers(S);if(C.length<2){P.devRep=P.devRep||[];return;}
  var order=C.slice().sort(function(a,b){return hash('dv'+S.week+a.id)-hash('dv'+S.week+b.id);}),lines=[],lv=P.camp||0;
  for(var i=0;i+1<order.length;i+=2){
    var a=order[i],b=order[i+1],ra=workRate(a),rb=workRate(b),ch=chem(S,a.id,b.id),q=(ra+rb)/2+ch+(rnd(S)*2-1)*6;
    var win=chance(S,clamp(0.5+(a.ovr-b.ovr)/80,0.2,0.8))?a:b,los=win===a?b:a;
    [a,b].forEach(function(w){
      if(workRate(w)<w.pot)w.xp+=0.12+0.04*lv;
      var d=w.dv||(w.dv={n:0,best:0,w:0,last:''});d.n++;d.w=S.week;d.best=Math.max(d.best,Math.round(q));
    });
    win.dv.last=win.name+' beat '+los.name+'. '+(q>=75?'Real polish.':(q>=60?'Solid work.':(q>=45?'Plenty of rough edges.':'It was hard to watch.')));
    los.dv.last=los.name+' lost to '+win.name+'. '+(q>=75?'They looked good doing it.':(q>=60?'A fair showing.':'Not their night.'));
    lines.push({a:a.id,b:b.id,w:win.id,q:Math.round(q),text:win.dv.last});
    if(chance(S,0.015)){var h=chance(S,0.5)?a:b;h.inj=Math.max(h.inj,ri(S,1,3));lines[lines.length-1].text+=' '+h.name+' picked up a knock.';}
  }
  if(order.length%2){var o=order[order.length-1];o.dv=o.dv||{n:0,best:0,w:0,last:''};o.dv.w=S.week;o.dv.last=o.name+' cut a promo on the show.';if(o.mic<(o.mic0||o.mic)+15)o.micx=(o.micx||0)+0.15;lines.push({a:o.id,b:null,w:null,q:0,text:o.dv.last});}
  P.devRep=(P.devRep||[]);P.devRep.unshift({w:S.week,lines:lines});if(P.devRep.length>4)P.devRep.length=4;
  // a camper who has outgrown the camp asks for a call-up
  if(S.inbox.some(function(e){return e.type==='callup'&&!e.done;}))return;
  var rd=C.filter(function(w){return w.dv&&w.dv.n>=6&&(w.dvHold==null||S.week>=w.dvHold)&&(workRate(w)>=(w.cw0||999)+5||w.mic>=(w.cm0||999)+8||w.dv.n>=16);}).sort(function(a,b){return b.ovr-a.ovr;});
  if(rd.length){
    var w=rd[0];
    pushEv(S,{type:'callup',w:w.id,text:w.name+' has been on the camp show for '+w.dv.n+' weeks and has outgrown it. '+(w.dv.best>=70?'Their best match there was rated '+w.dv.best+'%. ':'')+'The crowd at the camp show knows the name.',
      choices:['Call them up now, with a debut','Another month in camp','Release them']});
  }
});
EVR.callup=function(S,ev,choice,P,w){
  if(!w.camp)return w.name+' is already back on the roster.';
  if(choice===0){E.callUp(S,w.id);w.mom=clamp(w.mom+2,-10,10);w.morale=clamp(w.morale+8,0,100);news(S,'story',w.name+' graduated from the camp show and makes a debut.');return w.name+' is called up. The crowd will meet them on the next show.';}
  if(choice===1){w.dvHold=S.week+4;w.morale=clamp(w.morale-2,0,100);return w.name+' stays in camp for a month.';}
  return E.release(S,w.id)||w.name+' is released.';
};
E.devShow=function(S){
  var P=S.promos[S.player],C=campers(S);
  return {n:C.length,cap:E.campInfo(S).cap,report:(P.devRep&&P.devRep[0])||null,
    rows:C.map(function(w){return {w:w,matches:(w.dv&&w.dv.n)|0,best:(w.dv&&w.dv.best)|0,last:(w.dv&&w.dv.last)||'No matches yet.',gain:Math.round(workRate(w)-(w.cw0||workRate(w))),micGain:Math.round(w.mic-(w.cm0||w.mic))};})};
};
