/* ---------- depth systems that wrap the player API in 90-api.js ---------- */

/* speaking out: a released wrestler may give an interview. It can sour the room, give away a rival's plans, or settle a score */
(function(){
  var rel=E.release;
  E.release=function(S,id){
    var w=S.w[id],mine=w&&w.promo===S.player&&!w.nw,msg=rel(S,id);
    if(!msg||!mine)return msg;
    var good=w.ovr>=P_img(S)-15&&chance(S,0.6);if(!good)return msg;
    var kind=pick(S,['bitter','rival','score']),P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(x){return !x.nw;}),line='';
    if(kind==='bitter'){R.forEach(function(x){x.morale=clamp(x.morale-2,0,100);});line=w.name+' gave an interview calling the way they were let go “a disgrace”. The room does not enjoy reading it.';}
    else if(kind==='rival'){var rv=S.order.filter(function(o){return o!==S.player;}),rp=S.promos[pick(S,rv)];line=w.name+' told a reporter what they heard on the road: '+rp.name+' is building toward '+E.nextBig(S).name+' and has its eye on your contracts.';rp.rel=clamp((rp.rel||0)-4,-100,100);}
    else{var foe=R.filter(function(x){return chem(S,x.id,w.id)<=-1.5;}).sort(function(a,b){return chem(S,a.id,w.id)-chem(S,b.id,w.id);})[0];
      if(foe){foe.morale=clamp(foe.morale-4,0,100);line=w.name+' used the interview to settle a score with '+foe.name+', and '+foe.name+' is not pleased.';}
      else line=w.name+' thanked the fans and said there were no hard feelings. That is that.';}
    news(S,'story',line);return msg+' '+line;
  };
  function P_img(S){return S.promos[S.player].image;}
})();
