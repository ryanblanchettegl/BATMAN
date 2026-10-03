/* ---------- 1. Career goals: each wrestler of yours chases one or two goals; meeting one lifts them; one blocked for a year starts a clock (w.goals) ---------- */
function goalTier(S,P,w){return w.ovr>=P.image-5?'star':'mid';}
function topTitleFor(P,w){return P.titles.filter(function(t){return !t.tag&&t.g===w.g&&t.lvl>=3;})[0]||null;}
var GOALK={
  title:{n:'Hold the top title',ok:function(S,P,w){return holdLvl(P,w.id)>=3;},prog:function(S,P,w){return holdLvl(P,w.id)>=3?1:clamp(w.ovr/Math.max(1,P.image+8),0,0.95);}},
  midtitle:{n:'Win a title',ok:function(S,P,w){return holdLvl(P,w.id)>=1;},prog:function(S,P,w){return holdLvl(P,w.id)>=1?1:clamp(w.ovr/Math.max(1,P.image),0,0.9)*0.8;}},
  flagship:{n:'Main-event the flagship show',ok:function(S,P,w,g){return (w.mf|0)>(g.mf0|0);},prog:function(S,P,w,g){return (w.mf|0)>(g.mf0|0)?1:clamp(w.ovr/Math.max(1,P.image+5),0,0.9)*0.7;}},
  tourn:{n:'Win a tournament',ok:function(S,P,w,g){return (w.tourns|0)>(g.t0|0);},prog:function(S,P,w,g){return (w.tourns|0)>(g.t0|0)?1:0.15;}},
  team:{n:'Team with a hero',ok:function(S,P,w){var tm=teamOf(S,w);if(!tm)return false;var o=S.w[tm.m[0]===w.id?tm.m[1]:tm.m[0]];return !!o&&o.ovr>=P.image;},prog:function(S,P,w){return teamOf(S,w)?0.6:0;}},
  wage:{n:'Earn more',ok:function(S,P,w,g){return w.wage>=g.v;},prog:function(S,P,w,g){return clamp(w.wage/g.v,0,1);}}
};
function newGoal(S,P,w,have){
  var kinds=[];
  if(goalTier(S,P,w)==='star'){if(topTitleFor(P,w))kinds.push('title');kinds.push('flagship');}else kinds.push('midtitle');
  kinds.push('tourn');if(w.team==null)kinds.push('team');kinds.push('wage');
  kinds=kinds.filter(function(k){return !have.some(function(g){return g.k===k;});});if(!kinds.length)return null;
  var k=pick(S,kinds.slice(0,3)),g={k:k,since:S.week,mf0:w.mf|0,t0:w.tourns|0};
  if(k==='wage')g.v=Math.ceil(w.wage*1.4/50)*50;
  return g;
}
function goalText(S,P,w,g){var K=GOALK[g.k];return g.k==='title'?'Hold the '+topTitleFor(P,w).name:(g.k==='wage'?'Earn '+money(g.v)+' a week':K.n);}
E.goalsOf=function(S,id){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id||w.nw||!w.goals)return [];
  return w.goals.filter(function(g){return GOALK[g.k]&&(g.k!=='title'||topTitleFor(P,w));}).map(function(g){
    var K=GOALK[g.k],met=!!g.met,pr=met?1:K.prog(S,P,w,g);
    return {k:g.k,text:goalText(S,P,w,g),met:met,pct:Math.round(pr*100),weeks:S.week-g.since,blocked:!!g.clock,clockLeft:g.clock?Math.max(0,g.clock+12-S.week):null};
  });
};
POST.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return;
  if(ctx.isMain&&ctx.show.flag)ctx.all.forEach(function(w){w.mf=(w.mf|0)+1;});
});
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt&&w.ovr>=45;});
  if(S.tourn&&S.tourn.done&&S.tourn.champ!=null&&!S.tourn.credited){S.tourn.credited=true;var cw=S.w[S.tourn.champ];if(cw)cw.tourns=(cw.tourns|0)+1;}
  var asked=S.inbox.some(function(e){return e.type==='goalblocked'&&!e.done;});
  R.forEach(function(w){
    var G=w.goals||(w.goals=[]);
    // meeting a goal
    G.forEach(function(g){
      if(g.met)return;var K=GOALK[g.k];if(!K||(g.k==='title'&&!topTitleFor(P,w)))return;
      if(K.ok(S,P,w,g)){g.met=S.week;w.morale=clamp(w.morale+10,0,100);if(w.con<=12)w.con+=12;w.loy=(w.loy|0)+1;
        if(goalTier(S,P,w)==='star'||g.k==='title')news(S,'story',w.name+' reached a career goal: '+goalText(S,P,w,g).toLowerCase()+'.');}
    });
    // met goals clear after a while, and a new one is chosen; most wrestlers carry one or two
    w.goals=G.filter(function(g){return !g.met||S.week-g.met<20;});
    if(w.goals.filter(function(g){return !g.met;}).length<(w.ovr>=P.image-10?2:1)&&(w.gAt==null||S.week-w.gAt>=8)){var ng=newGoal(S,P,w,w.goals);if(ng){w.goals.push(ng);w.gAt=S.week;}}
    // blocked for a year: a clock starts and the inbox asks what you will do
    w.goals.forEach(function(g){
      if(g.met||g.clock||S.week-g.since<52)return;
      // only the wrestlers who matter get the clock, and no more than one conversation every ten weeks; the rest let the goal lapse
      if(asked||w.ovr<P.image-15||S.week-(S.goalAt||-99)<10){if(S.week-g.since>=78)w.goals=w.goals.filter(function(x){return x!==g;});return;}
      g.clock=S.week;asked=true;S.goalAt=S.week;
      pushEv(S,{type:'goalblocked',w:w.id,gk:g.k,text:w.name+' has chased one goal for a year: '+goalText(S,P,w,g).toLowerCase()+'. They feel it is being blocked, and they are starting to look around.',
        choices:['Promise it: a shot within twelve weeks','Offer more money and a new goal','Tell them to wait'],checks:{1:mkCheck(7,[moraleMod(w),trustMod(S)].concat(skillMods(S,'talk')))}});
    });
    // the clock runs out
    w.goals.forEach(function(g){
      if(g.met||!g.clock||S.week<g.clock+12||g.over)return;
      g.over=true;w.morale=clamp(w.morale-12,0,100);stressAdd(S,w,10);
      news(S,'contract',w.name+' is unhappy that their goal never came: '+goalText(S,P,w,g).toLowerCase()+'.');
    });
  });
});
EVR.goalblocked=function(S,ev,choice,P,w){
  var g=(w.goals||[]).filter(function(x){return x.k===ev.gk&&!x.met;})[0];
  if(choice===0){
    var t=P.titles.filter(function(x){return !x.tag&&x.g===w.g&&x.holders.length&&x.holders.indexOf(w.id)<0;}).sort(function(a,b){return b.lvl-a.lvl;})[0];
    if(t&&(ev.gk==='title'||ev.gk==='midtitle'))S.quests.push({id:S.nid++,type:'shot',w:w.id,title:t.id,due:S.week+12,text:'Promise: give '+w.name+' a '+t.name+' match by '+cal(S.week+12).label});
    else S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+4,text:'Promise: book a win for '+w.name+' by '+cal(S.week+4).label});
    if(g)g.clock=S.week;w.morale=clamp(w.morale+6,0,100);return 'You gave your word. '+w.name+' will give you twelve weeks.';
  }
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){w.wage=Math.round(w.wage*1.1/50)*50;w.goals=(w.goals||[]).filter(function(x){return x!==g;});w.gAt=null;w.morale=clamp(w.morale+8,0,100);return rollText(r)+w.name+' takes a raise to '+money(w.wage)+' a week and a different goal.';}
    w.morale=clamp(w.morale-4,0,100);return rollText(r)+w.name+' wants the goal, not the money.';
  }
  w.morale=clamp(w.morale-8,0,100);return w.name+' goes quiet. The clock is running.';
};
