/* ---------- 63. New companies appear: a backer starts a company and signs free agents; sometimes it grows out of an indie ---------- */
var NC_A=['Harbor','Lantern','Copperfield','Greywater','Stonebridge','Ember','Northgate','Silverline','Oakhurst','Redwing','Halcyon','Marlowe','Briar','Ironvale'];
var NC_B=['Wrestling Alliance','Championship Wrestling','Pro Wrestling','Wrestling Company','All-Star Wrestling','Wrestling Syndicate'];
var NC_SHOW=['Thursday Night Brawl','The Harbor Hour','Lantern Live','Main Street Showdown','Saturday Slam','The Late Card'];
var NC_TITLE=['Heavyweight Title','Crown Title','Championship','Grand Title'];
function newCompany(S){
  if(S.order.length>=12||!S.db||!S.db.indie)return null;
  var I=S.db.indie,used={},used2={};S.order.forEach(function(id){used[S.promos[id].name]=1;});Object.keys(S.promos).forEach(function(id){used2[id]=1;});
  var a,t=0,full,short;do{a=pick(S,NC_A);full=a+' '+pick(S,NC_B);short=a.slice(0,3).toUpperCase();t++;}while((used[short]||full===null)&&t<30);
  if(used[short])short=short.slice(0,2)+String.fromCharCode(65+ri(S,0,25));
  var id='nc'+S.nid++,backer=pick(S,I.firstM.concat(I.firstF))+' '+pick(S,I.last),indie=chance(S,0.4);
  var models=Object.keys(MODELS).filter(function(k){return k!=='classic'&&k!=='joshi';}),model=chance(S,0.35)?'classic':pick(S,models);
  var f={name:full,short:short,show:pick(S,NC_SHOW),title:pick(S,NC_TITLE),size:chance(S,0.7)?'regional':'national',region:pick(S,Object.keys(FED_REGION)),model:model,style:'merit',roots:'tradition',pledge:'chance',women:model!=='joshi'?chance(S,0.7):true};
  var d=mkFedDef(f,backer);
  d.id=id;d.mine=false;d.owner={name:backer,style:pick(S,Object.keys(STYLES)),roots:'tradition',pledge:'chance'};
  d.shows=[{id:id+'_1',name:f.show,mult:1}];d.titles.forEach(function(x,i){x.id=id+'_t'+i;});
  d.draft.n=indie?16:12;
  var P=buildPromo(S,d,{});
  var C=JSON.parse(JSON.stringify(S));C.cal=true;C.player=null;calibrateShows(S,C,id);calibrateCosts(S,id);
  P.size0=rosterOf(S,id).length;P.rel=0;P.born=S.week;
  news(S,'world',(indie?'A well-known indie circuit has grown up: ':'A new company is on the air: ')+full+' ('+short+'), backed by '+backer+', has signed '+P.size0+' free agents.');
  return P;
}
E.newCompany=function(S){return newCompany(S);};
WEEKX.push(function(S){
  if(S.cal||S.week<78||S.week%26||S.order.length>=12||!chance(S,0.3))return;
  newCompany(S);
});
