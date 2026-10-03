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

/* job offers with terms: ask for a bigger wage budget, more booking power, or one signing of your choice. Asking is an attempt, and a failed ask offends the new owner */
var JOB_TERMS={budget:{n:'A bigger wage budget',d:'Twelve per cent more to spend on contracts.'},freedom:{n:'Creative freedom',d:'Four extra points of booking power to start with.'},signing:{n:'One signing of your choice',d:'The first free agent you sign needs no approval and ignores how big the company is.'}};
E.JOB_TERMS=JOB_TERMS;
function jobCheck(S,terms){var n=terms.length;return mkCheck(4+2*n,[{n:'Booker level '+S.booker.lvl,v:S.booker.lvl>=8?2:(S.booker.lvl>=4?1:0)}].concat(skillMods(S,'talk')));}
E.jobTermsCheck=function(S,terms){return terms&&terms.length?jobCheck(S,terms):null;};
E.applyJobTerms=function(S,terms){
  terms=(terms||[]).filter(function(t){return JOB_TERMS[t];});if(!terms.length)return null;
  var ck=jobCheck(S,terms),r=rollCheck(S,ck);
  if(!r.ok){S.owner.trust=clamp(S.owner.trust-8,0,100);return S.owner.name+' did not like being asked for '+terms.map(function(t){return JOB_TERMS[t].n.toLowerCase();}).join(' and ')+' before you had done a day’s work. You start on the wrong foot.';}
  var out=[];
  terms.forEach(function(t){
    if(t==='budget'){S.owner.wage0=Math.round(S.owner.wage0*1.12);out.push('a wage budget of '+money(E.budget(S))+' a week');}
    else if(t==='freedom'){S.bp+=4;out.push('four extra points of booking power');}
    else if(t==='signing'){S.freeSign=true;out.push('one signing of your choice (see Free agents)');}
  });
  return S.owner.name+' agrees to '+out.join(', ')+'.';
};
(function(){
  var cs=E.canSign,sg=E.sign;
  E.canSign=function(S,w){if(S.freeSign&&w.promo==='FA'&&!w.rt){var MD=modelOf(S.promos[S.player]);return !(MD.gender&&w.g!==MD.gender);}return cs(S,w);};
  E.sign=function(S,id,wage,weeks){var was=S.freeSign,r=sg(S,id,wage,weeks);if(was&&r&&r.ok)S.freeSign=false;return r;};
})();

/* a mask match needs masks, a hair match needs hair that has grown back */
(function(){
  var was=E.validate;
  E.validate=function(S,card){
    var v=was(S,card);
    card.forEach(function(m,i){
      if(m.stip!=='mask'&&m.stip!=='hair')return;
      var ws=[].concat.apply([],m.sides).filter(function(id){return id!=null&&S.w[id];}).map(function(id){return S.w[id];});
      if(m.stip==='mask'&&ws.some(function(w){return masked(w)!==1;}))v.errors.push('Match '+(i+1)+': a mask match needs everyone in it to wear a mask.');
      if(m.stip==='hair'){var bald=ws.filter(function(w){return w.sh!=null&&S.week-w.sh<20;})[0];if(bald)v.errors.push('Match '+(i+1)+': '+bald.name+' has not grown the hair back yet.');}
    });
    return v;
  };
})();

/* the suggested card for the flagship puts the planned match in the main event */
(function(){
  var was=E.suggest;
  E.suggest=function(S){
    var card=was(S),lp=S.lp,show=S.queue&&S.queue[S.qi];
    if(!lp||!show||!show.big||!show.flag||S.cal||!card.length)return card;
    var a=S.w[lp.a],b=S.w[lp.b];if(!a||!b||a.inj>0||b.inj>0||a.away>=S.week||b.away>=S.week||a.rest===S.week||b.rest===S.week)return card;
    var rest=card.filter(function(m){var ids=[].concat.apply([],m.sides);return ids.indexOf(lp.a)<0&&ids.indexOf(lp.b)<0;});
    var tt=lp.title&&titleById(S.promos[S.player],lp.title);
    var mm={mt:'1v1',sides:[[lp.a],[lp.b]],stip:'std',len:'L',title:tt&&tt.holders.length&&(tt.holders.indexOf(lp.a)>=0||tt.holders.indexOf(lp.b)>=0)?lp.title:null};
    while(rest.length>=SLOT_MAX[S.promos[S.player].slot]+(show.big?3:0)&&rest.length>3)rest.shift();
    rest.push(mm);return rest;
  };
})();
