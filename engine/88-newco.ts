// @ts-nocheck
/* Moved from src/88-newco.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.newCompany = newCompany;
/* ---------- 63. New companies appear: a backer starts a company and signs free agents; sometimes it grows out of an indie ---------- */
export var NC_A=['Harbor','Lantern','Copperfield','Greywater','Stonebridge','Ember','Northgate','Silverline','Oakhurst','Redwing','Halcyon','Marlowe','Briar','Ironvale'];
$L.NC_A = NC_A;
export var NC_B=['Wrestling Alliance','Championship Wrestling','Pro Wrestling','Wrestling Company','All-Star Wrestling','Wrestling Syndicate'];
$L.NC_B = NC_B;
export var NC_SHOW=['Thursday Night Brawl','The Harbor Hour','Lantern Live','Main Street Showdown','Saturday Slam','The Late Card'];
$L.NC_SHOW = NC_SHOW;
export var NC_TITLE=['Heavyweight Title','Crown Title','Championship','Grand Title'];
$L.NC_TITLE = NC_TITLE;
export function newCompany(S){
  if(S.order.length>=12||!S.db||!S.db.indie)return null;
  var I=S.db.indie,used={},used2={};S.order.forEach(function(id){used[S.promos[id].name]=1;});Object.keys(S.promos).forEach(function(id){used2[id]=1;});
  var a,t=0,full,short;do{a=$L.pick(S,$L.NC_A);full=a+' '+$L.pick(S,$L.NC_B);short=a.slice(0,3).toUpperCase();t++;}while((used[short]||full===null)&&t<30);
  if(used[short])short=short.slice(0,2)+String.fromCharCode(65+$L.ri(S,0,25));
  var id='nc'+S.nid++,backer=$L.pick(S,I.firstM.concat(I.firstF))+' '+$L.pick(S,I.last),indie=$L.chance(S,0.4);
  // an indie that grows up keeps its name: one of the circuits the free agents have been working (src/88-indies.js)
  if(indie&&typeof $L.INDIES!=='undefined'){var fullUsed={};S.order.forEach(function(x){fullUsed[S.promos[x].full||S.promos[x].name]=1;});var cand=$L.INDIES.filter(function(x){return !fullUsed[x.n];});
    if(cand.length){var ci=cand[$L.hash('ncind'+S.seed+S.week)%cand.length],ini=ci.n.split(' ').filter(function(x){return /^[A-Z]/.test(x);}).map(function(x){return x[0];}).join('').slice(0,3);
      if(ini.length>=2&&!used[ini]){full=ci.n;short=ini;}}}
  var models=Object.keys($L.MODELS).filter(function(k){return k!=='classic'&&k!=='joshi';}),model=$L.chance(S,0.35)?'classic':$L.pick(S,models);
  var f={name:full,short:short,show:$L.pick(S,$L.NC_SHOW),title:$L.pick(S,$L.NC_TITLE),size:$L.chance(S,0.7)?'regional':'national',region:$L.pick(S,Object.keys($L.FED_REGION)),model:model,style:'merit',roots:'tradition',pledge:'chance',women:model!=='joshi'?$L.chance(S,0.7):true};
  var d=$L.mkFedDef(f,backer);
  d.id=id;d.mine=false;d.owner={name:backer,style:$L.pick(S,Object.keys($L.STYLES)),roots:'tradition',pledge:'chance'};
  d.shows=[{id:id+'_1',name:f.show,mult:1}];d.titles.forEach(function(x,i){x.id=id+'_t'+i;});
  d.draft.n=indie?16:12;
  var P=$L.buildPromo(S,d,{});
  var C=JSON.parse(JSON.stringify(S));C.cal=true;C.player=null;$L.calibrateShows(S,C,id);$L.calibrateCosts(S,id);
  P.size0=$L.rosterOf(S,id).length;P.rel=0;P.born=S.week;
  $L.news(S,'world',(indie?'A well-known indie circuit has grown up: ':'A new company is on the air: ')+full+' ('+short+'), backed by '+backer+', has signed '+P.size0+' free agents.');
  return P;
}
$L.E.newCompany=function(S){return $L.newCompany(S);};
$L.WEEKX.push(function(S){
  if(S.cal||S.week<78||S.week%26||S.order.length>=12||!$L.chance(S,0.3))return;
  $L.newCompany(S);
});

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.NC_A = NC_A;
$L.NC_B = NC_B;
$L.NC_SHOW = NC_SHOW;
$L.NC_TITLE = NC_TITLE;
$L.newCompany = newCompany;
