// @ts-nocheck
/* Moved from src/92-scenarios.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, avg, clamp, hash, rosterOf } from './00-core';
import { SHOWX, WEEKX } from './10-match';
import { money } from './40-week';
$L.scnSign = scnSign; $L.scnFill = scnFill; $L.scnLoad = scnLoad; $L.scnJudge = scnJudge; $L.scnCut = scnCut;
/* wraps: 00-core.js, 40-week.js, 85-universe.js (it must sort after them; test-buildorder.js checks) */
/* ---------- 95. Scenarios: a problem and a deadline, each ending with a result (S.scn) ----------
   A scenario is data (docs/modding.md, "Scenarios"): who you play, how many weeks, a list of setup steps, one win
   condition, the words for winning and losing, the figures shown at the end, and a score from 0 to 100. The steps and
   conditions it can use are SCN_OPS and SCN_WIN below; a new kind is one more entry there. A world package can bring
   its own scenarios in "scenarios", in the same shape. A scenario also ends, lost, if the booker is fired or the money
   runs out before the deadline. */
export var SCN_BUILT=[
  {id:'rescue',name:'Save the company',promotion:'ttt',weeks:26,
   description:'A small company with the wage bill too high and almost no cash. Keep it open for 26 weeks and end with about three weeks of income in the bank.',
   setup:[{op:'cash',inc0:0.8},{op:'wages',mult:1.25,round:50}],
   win:{type:'cash',incWeeks:2.9},   // the target follows the company's own income (a realistic economy, 21 October): $1.5M on the old money
   text:{win:'The company is safe: {cash} in the bank after 26 weeks.',lose:'The company is still open, but only {cash} is in the bank. The target was {goal}.'},
   figures:['Cash {cash} (target {goal})']},
  {id:'champion',name:'A champion from the bottom',promotion:'ocw',weeks:39,
   description:'One of the least known men on the roster has been picked as your project. Have them hold the top title when 39 weeks are up.',
   setup:[{op:'target',g:'M',maxAge:30,nth:2}],
   win:{type:'holdsTop',who:'target'},
   text:{win:'{name} holds the {title}. From the bottom of the roster to the top of the company.',lose:'{name} does not hold the {title} after 39 weeks. They are now rated {ovr}.'},
   figures:['{name} rated {ovr} (started at {o0})']},
  {id:'war',name:'Win the ratings war',promotion:'ocw',weeks:26,
   description:'PDW has come after your audience, and a war is on. For 26 weeks, your shows must beat what the audience expects by more than theirs do.',
   setup:[{op:'rival',id:'pdw'},{op:'image',who:'player',v:60},{op:'image',who:'pdw',v:66},{op:'war',with:'pdw'}],
   win:{type:'beatRival',by:0.3},
   text:{win:'You won the ratings war: your shows averaged {m} against expectations, theirs {r}.',lose:'You lost the ratings war: your shows averaged {m} against expectations, theirs {r}.'},
   figures:['Your shows: {mFig} against expectations','Theirs: {rFig}']}
];
$L.SCN_BUILT = SCN_BUILT;
/** Setup steps: each changes the new game once, before the first week. */
export var SCN_OPS={
  cash:function(S,o){var P=S.promos[S.player];P.cash=Math.round(P.inc0*o.inc0);},
  wages:function(S,o){var P=S.promos[S.player],r=o.round||50;rosterOf(S,P.id).forEach(function(w){w.wage=Math.round(w.wage*o.mult/r)*r;});},
  target:function(S,o){var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&(!o.g||w.g===o.g)&&(!o.maxAge||w.age<=o.maxAge);}).sort(function(a,b){return a.ovr-b.ovr;});var tg=R[Math.min(o.nth||0,R.length-1)];S.scn.target=tg.id;tg.mom=0;},
  image:function(S,o){var P=o.who==='player'?S.promos[S.player]:S.promos[o.who];if(P)P.image=o.v;},
  rival:function(S,o){S.scn.rival=o.id;S.scn.me=[];S.scn.rv=[];},
  war:function(S,o){if(!S.xf)$L.startXf(S,o['with'],'war');}
};
$L.SCN_OPS = SCN_OPS;
export function scnSign(x){return (x>=0?'+':'')+x.toFixed(1);}
/** Win conditions: whether it is met, the words that fill the texts, and a score from 0 to 100. */
export var SCN_WIN={
  // a set amount (atLeast), or a number of weeks of the company's own income (incWeeks), so a target fits a company of any size
  cash:{vars:function(S,c){var P=S.promos[S.player],g=c.atLeast!=null?c.atLeast:Math.max(1000,Math.round((P.inc0||0)*(c.incWeeks||1)/1000)*1000);return {ok:P.cash>=g,cash:money(P.cash),goal:money(g),score:clamp(Math.round(P.cash/g*100),0,100)};}},
  holdsTop:{vars:function(S,c){var P=S.promos[S.player],w=S.w[S.scn[c.who||'target']],top=P.titles.filter(function(t){return !t.tag&&t.g===w.g;}).sort(function(a,b){return b.lvl-a.lvl;})[0],ok=!!(top&&top.holders.indexOf(w.id)>=0&&w.promo===P.id);
    return {ok:ok,name:w.name,title:top?top.name:'top title',ovr:Math.round(w.ovr),o0:Math.round(S.scn.o0),score:ok?100:clamp(Math.round(w.ovr-(S.scn.o0||0)+50),0,99)};}},
  beatRival:{vars:function(S,c){var C=S.scn,m=avg(C.me||[0]),r=avg(C.rv||[0]);return {ok:m>r+c.by,m:scnSign(m),r:scnSign(r),mFig:(C.me&&C.me.length)?scnSign(avg(C.me)):'0',rFig:(C.rv&&C.rv.length)?scnSign(avg(C.rv)):'0',score:clamp(Math.round(50+(m-r)*20),0,100)};}}
};
$L.SCN_WIN = SCN_WIN;
export var SCN={};
$L.SCN = SCN;
export function scnFill(t,v){return String(t).replace(/\{(\w+)\}/g,function(_,k){return v[k]!=null?String(v[k]):'{'+k+'}';});}
export function scnLoad(list){
  $L.SCN={};(list||[]).forEach(function(d){if(d&&d.id&&$L.SCN_WIN[d.win&&d.win.type])$L.SCN[d.id]=d;});
  E.SCENARIOS=Object.keys($L.SCN).map(function(k){var d=$L.SCN[k];return {id:k,n:d.name,d:d.description,weeks:d.weeks,promo:d.promotion};});
}
/** What a scenario's win condition says about a state: {ok, text, figures, score}. It ends nothing. */
export function scnJudge(S){var C=S.scn,D=$L.SCN[C.id];if(!D)return null;var v=$L.SCN_WIN[D.win.type].vars(S,D.win);
  return {ok:!!v.ok,text:scnFill(v.ok?D.text.win:D.text.lose,v),figures:(D.figures||[]).map(function(f){return scnFill(f,v);}),score:v.score};}
/** Problems with a list of scenarios from a world package, as messages. */
E.scenarioProblems=function(list,promoIds){var out=[];(list||[]).forEach(function(d,i){var at='scenarios['+i+']';
  if(!d||!d.id)out.push(at+': no id');else{if(!$L.SCN_WIN[d.win&&d.win.type])out.push(at+' '+d.id+': unknown win type');if(!(d.weeks>0))out.push(at+' '+d.id+': weeks must be more than 0');
    if(promoIds&&promoIds.indexOf(d.promotion)<0)out.push(at+' '+d.id+': unknown promotion '+d.promotion);(d.setup||[]).forEach(function(o){if(!$L.SCN_OPS[o.op])out.push(at+' '+d.id+': unknown setup step '+o.op);});
    if(!d.text||!d.text.win||!d.text.lose)out.push(at+' '+d.id+': needs text.win and text.lose');}});return out;};
E.SCENARIO_FORMAT={ops:Object.keys(SCN_OPS),win:Object.keys(SCN_WIN)};
scnLoad(SCN_BUILT);
/* a world package can bring its own scenarios; they sit beside the built-in ones, and the package check reads them */
(function(){var val=E.validateUniverse;E.validateUniverse=function(pkg){var v=val.apply(this,arguments);if(pkg&&pkg.scenarios){var ids=(pkg.promotions||[]).map(function(p){return p.id;});
  E.scenarioProblems(pkg.scenarios,ids).forEach(function(m){v.errors.push({at:'scenarios',msg:m});});v.ok=v.ok&&!v.errors.length;}return v;};})();
(function(){var use=E.useUniverse;E.useUniverse=function(pkg){var r=use.apply(this,arguments);var own=pkg&&Array.isArray(pkg.scenarios)?pkg.scenarios:[];scnLoad($L.SCN_BUILT.concat(own));return r;};})();
E.scenarioStart=function(id){
  var D=$L.SCN[id];if(!D)return null;var U=E.universe();if(!U.promotions.some(function(p){return p.id===D.promotion;}))return null;
  return E.newGame(D.promotion,5000+hash('scn'+id)%1000000,{name:'Booker',diff:'normal',fed:null,scn:id});
};
(function(){
  var ng=E.newGame;
  E.newGame=function(pid,seed,opts){
    var S=ng(pid,seed,opts);
    if(opts&&opts.scn&&$L.SCN[opts.scn]){var D=$L.SCN[opts.scn];S.scn={id:opts.scn,weeks:D.weeks,done:false};S.scn.o0=0;(D.setup||[]).forEach(function(o){$L.SCN_OPS[o.op](S,o);});if(S.scn.target!=null)S.scn.o0=S.w[S.scn.target].ovr;}
    return S;
  };
})();
SHOWX.push(function(S,P,show,rep){
  var C=S.scn;if(S.cal||!C||C.done||!C.rival)return;
  if(P.id===S.player)C.me.push(rep.rating-rep.exp);else if(P.id===C.rival)C.rv.push(rep.rating-rep.exp);
});
WEEKX.push(function(S){
  var C=S.scn;if(S.cal||!C||C.done||S.over)return;
  if(S.week>=C.weeks){C.done=true;C.res=scnJudge(S);S.over={why:'scenario',week:S.week};}
});
/* a scenario that ends early, with the company broke or the booker fired, is a scenario lost: it gets the scenario's own ending */
export function scnCut(S){
  var C=S.scn;if(!C||C.done||!S.over||S.over.why==='scenario')return;
  var why=S.over.why,J=scnJudge(S);C.done=true;
  C.res={ok:false,text:why==='fired'?'You were let go before the '+C.weeks+' weeks were up.':'The company ran out of money before the '+C.weeks+' weeks were up.',figures:J?J.figures:[],score:0};
  S.over={why:'scenario',week:S.over.week,cut:why};
}
(function(){
  var ew=E.endWeek,rs=E.runPlayerShow;
  E.endWeek=function(S){var r=ew.apply(this,arguments);scnCut(S);return r;};
  E.runPlayerShow=function(S){var r=rs.apply(this,arguments);scnCut(S);return r;};
})();
/** For tests: what a scenario's check says about a state, without ending anything. */
E.scnCheck=function(S){var C=S.scn;if(!C||!$L.SCN[C.id])return null;var r=scnJudge(S);delete r.score;return r;};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.SCN_BUILT = SCN_BUILT;
$L.SCN_OPS = SCN_OPS;
$L.scnSign = scnSign;
$L.SCN_WIN = SCN_WIN;
$L.SCN = SCN;
$L.scnFill = scnFill;
$L.scnLoad = scnLoad;
$L.scnJudge = scnJudge;
$L.scnCut = scnCut;
