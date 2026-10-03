/* ---------- life outside the ring ----------
   A wedding, a new baby, a move across the country, a film part, a book. Each is an inbox event with a real choice: time off, a lighter
   schedule, or work it into a story. About every six weeks, for someone who matters to the show. */
var LIFE=[
  {id:'wedding',t:function(w){return w.name+' is getting married next month, and the whole locker room has been invited.';},story:'The wedding is staged on the show: a ring, a bouquet, and an invitation to every villain in town.'},
  {id:'baby',t:function(w){return w.name+' is about to become a parent and would like to be home more.';},story:'The news is announced on air and the crowd sends cards to the arena.'},
  {id:'move',t:function(w){return w.name+' is moving across the country and the travel will be hard on them.';},story:'The move becomes a storyline: a new city, a new rival, a fresh start.'},
  {id:'film',t:function(w){return w.name+' has been offered a part in a film and needs six weeks for the shoot.';},story:'The film part becomes an angle: a star returns with a new swagger.'},
  {id:'book',t:function(w){return w.name+' has written a book and wants time for a tour of bookshops.';},story:'The book is launched on air, and a rival tears out the first page.'}
];
EVMAKE.push(function(S,P,R){
  if(S.cal||S.week<5||(S.lifeWeek!=null&&S.week-S.lifeWeek<6)||!chance(S,0.18))return null;
  var c=R.filter(function(w){return w.ovr>=P.image-10&&!w.retiring&&!w.lgt;});if(!c.length)return null;var w=pick(S,c),L=pick(S,LIFE);S.lifeWeek=S.week;
  return {type:'life',w:w.id,lid:L.id,text:L.t(w),choices:['Give them time off','A lighter schedule for a while','Work it into a story'],checks:{2:mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=75?1:(w.mic<55?-1:0)}].concat(skillMods(S,'creative')))}};
});
EVR.life=function(S,ev,choice,P,w){
  var L=LIFE.filter(function(x){return x.id===ev.lid;})[0];
  if(choice===0){w.away=S.week+3;w.morale=clamp(w.morale+8,0,100);stressAdd(S,w,-12);w.hy=0;return w.name+' is away for three weeks and comes back a different person. The card will have a hole in it.';}
  if(choice===1){w.lgt=S.week+8;w.morale=clamp(w.morale+4,0,100);stressAdd(S,w,-6);return w.name+' works every other week for the next eight. It keeps them on the shows and happy at home.';}
  var r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){S.hype=(S.hype||0)+0.04;w.mom=clamp(w.mom+2,-10,10);addOvr(P,w,0.5);w.morale=clamp(w.morale+6,0,100);news(S,'story',w.name+': '+L.story);return rollText(r)+L.story+' The crowd loves it and it costs you nothing.';}
  w.morale=clamp(w.morale-3,0,100);return rollText(r)+'You try to work it into a story and the crowd shrugs. '+w.name+' feels like a prop.';
};
/* a lighter schedule: every other week off */
WEEKX.push(function(S){S.w.forEach(function(w){if(w.lgt&&w.promo===S.player){if(S.week+1<w.lgt&&(S.week+1)%2===0)w.rest=S.week+1;if(S.week+1>=w.lgt)w.lgt=null;}});});
