/* ---------- Time is the budget ----------
   A show is two hours of weekly television or three hours of big event, and the booker has to fill it. Everything
   on the run sheet takes time off the clock: a match takes its bell time plus entrances and a break (more people, or
   a cage to build, take longer), and a promo or an angle is short, medium or long. There is no fixed number of
   anything: as many matches, promos and angles as fit.
     - Up to five minutes over is allowed. More than that and the show cannot run.
     - More than ten minutes empty and the show cannot run. Six to ten minutes light costs a little on the night.
   The top of the hour: whatever is on the air when an hour starts is what people tuning in see. Something clearly
   better than this crowd expects of the company holds them, and something clearly worse loses them. Hour one is the opening, and how a show opens is a choice with its own pay-off:
     - straight to a match: no time spent, and the first match carries the top of the hour;
     - a promo: if the one talking wrestles later, the crowd is ready for that match;
     - an angle: the feud heats faster, and a good one has the building buzzing for the first match;
     - a video recap: five minutes, and that feud's match tonight means more.
   Only the player's shows are on this clock. Rival shows and the sample shows that set expectations run as before.
   Nothing here uses random numbers. */
var SHOW_LEN={tv:120,big:180},TIME_OVER=5,TIME_FREE=5,TIME_LIGHT=10,PLAN_MINS=10,TOP_GOOD=6,TOP_BAD=6;
var MT_OVER={'1v1':5,tag:6,'3way':6,'4way':7,'6man':7,br:9},STIP_SET={cage:3,ladder:2};
REACT['Video recap']=['Now you know why these two cannot be in the same building.','That is the story so far. Tonight it gets another chapter.'];

function showMins(show){return show?(show.mins||(show.big?SHOW_LEN.big:SHOW_LEN.tv)):0;}
/** Bell to bell, the same sum the match itself uses. */
function bellMins(show,m,isMain){return Math.max(4,(m.stip==='iron'?30:(LEN[m.len]||12))+(show&&show.big?4:0)+(isMain?3:0)+noteMins(m));}
/** What a match takes off the clock: bell to bell, plus entrances and a break. */
function matchSlot(show,m,isMain){return bellMins(show,m,isMain)+(MT_OVER[m.mt]||5)+(STIP_SET[m.stip]||0);}
function hasPlan(S){return !!(S.plan&&S.w[S.plan.sp]);}
/** The run sheet against the clock. Reads only. items are in running order: {t:'plan'|'seg'|'match', at, mins, slot|i}. */
function showClock(S,card){
  var show=S.queue&&S.queue[S.qi],n=card.length,items=[],t=0,L=segRead(S),B=showMins(show),i;
  var put=function(o){o.at=t;t+=o.mins;items.push(o);};
  if(hasPlan(S))put({t:'plan',mins:PLAN_MINS});
  for(i=0;i<Math.max(n,1);i++){
    L.forEach(function(sg,slot){if(clamp(sg.pos|0,0,Math.max(0,n-1))===i)put({t:'seg',slot:slot,k:sg.k,mins:segMins(sg)});});
    if(i<n)put({t:'match',i:i,mins:matchSlot(show,card[i],i===n-1)});
  }
  var tops=[],h;for(h=0;h*60<B;h++){for(i=0;i<items.length;i++)if(items[i].at<=h*60&&h*60<items[i].at+items[i].mins){items[i].top=h+1;tops.push({hour:h+1,at:h*60,k:i});break;}}
  return {budget:B,total:t,left:B-t,items:items,tops:tops,over:t-B>TIME_OVER,short:B-t>TIME_LIGHT,light:B-t>TIME_FREE&&B-t<=TIME_LIGHT};
}
var OPENS={
  none:{n:'Nothing is booked yet',d:'The first thing on the run sheet opens the show.'},
  match:{n:'Straight to the ring',d:'No time is spent talking. The first match carries the top of the hour, so make it a hot one.'},
  promo:{n:'A promo opens the show',d:'If the one talking wrestles later tonight, the crowd is ready for that match. A weak promo leaves the first match in a quiet building.'},
  angle:{n:'An angle opens the show',d:'The feud heats faster from the top of the show, and a good angle has the building buzzing for the first match.'},
  recap:{n:'A video recap opens the show',d:'Five minutes, and tonight’s match between the two of them means more. More still at a big event.'},
  writers:{n:'The writers open the show',d:'You find out what they wrote on the night. If it is good the first match gains from it.'}
};
function openKind(S,card){
  var c=showClock(S,card),f=c.items[0];if(!f)return 'none';
  if(f.t==='plan')return 'promo';if(f.t==='match')return 'match';
  return f.k==='writers'?'writers':(f.k==='recap'?'recap':SEGK[f.k].t);
}

/* ---------- on the night ---------- */
/* how the show opened reaches the matches it was meant to set up */
CRX.push(function(ctx){
  var o=ctx.rep&&ctx.rep.open;if(!o||!ctx.isPl||o.k==='match')return null;
  var ids=flat(ctx.m.sides),inIt=!!o.ids&&o.ids.some(function(id){return ids.indexOf(id)>=0;}),flatOpen=ctx.i===0&&o.ov<45?{d:-1,x:'The show opened flat, and the first match walked into a quiet building'}:null;
  if(o.k==='recap')return ctx.feud&&ctx.feud.id===o.feud?{d:ctx.big?2.5:1.5,x:'The video package that opened the show told their story before the bell'}:null;
  if(o.k==='promo'){
    if(inIt&&o.ov>=50)return {d:o.ov>=70?1.5:0.8,x:'The promo that opened the show set this match up'};
    return flatOpen;
  }
  if(inIt&&o.ov>=50)return {d:1.5,x:'The crowd had wanted this since the angle that opened the show'};
  if(ctx.i===0&&o.ov>=65)return {d:1,x:'The building was buzzing after the angle that opened the show'};
  return flatOpen;
});
/** After the last match: put every segment on the clock, judge the top of each hour, and price any dead air.
    Returns what it adds to the show's rating. */
function showTimes(S,P,show,rep,card){
  var B=showMins(show),t=0,mi=0,n=card.length,d=0,h,i,s,ex=expected(P,show);
  rep.segs.forEach(function(x){
    if(x.k==='match'){x.slot=matchSlot(show,card[mi],mi===n-1);mi++;}else x.slot=x.mins||SEGLEN.M;
    x.at=t;t+=x.slot;
  });
  rep.clock={budget:B,total:t};rep.tops=[];
  for(h=0;h*60<B;h++)for(i=0;i<rep.segs.length;i++){
    s=rep.segs[i];if(!(s.at<=h*60&&h*60<s.at+s.slot))continue;
    var td=s.ov>=ex+TOP_GOOD?0.5:(s.ov<=ex-TOP_BAD?-0.5:0),what=s.k==='match'?s.label:(s.head||'A segment');
    s.top=h+1;
    rep.tops.push({hour:h+1,label:what,ov:s.ov,d:td,x:td>0?(h?'Hour '+(h+1)+' opened strong. The people who tuned in stayed':'A strong start. The people who tuned in stayed'):(td<0?(h?'Hour '+(h+1)+' opened weak. Sets were turned off':'A weak start. Sets were turned off'):(h?'Hour '+(h+1)+' opened on something ordinary':'An ordinary start'))});
    d+=td;break;
  }
  var empty=B-t-(rep.slack||0);
  if(empty>TIME_FREE){rep.light=empty;d-=(empty-TIME_FREE)*0.3;}
  else if(t>B)rep.overrun=t-B;
  return d;
}

/* ---------- making a show fit ---------- */
/** Change lengths, and add or drop a segment if it must, until the show fits its time (within five minutes either
    way). The suggested card uses it, and so does anything that books without a person. Returns how many changes.
    `keep` is the index of a match that must not be given more time (one a call on the night has just cut short). */
function fitShow(S,card,keep){
  var show=S.queue&&S.queue[S.qi];if(!show||!card.length)return 0;
  var P=S.promos[S.player],B=showMins(show),L=segList(S),changed=0,it,t,n;
  var total=function(){var s=hasPlan(S)?PLAN_MINS:0;card.forEach(function(m,i){s+=matchSlot(show,m,i===card.length-1);});L.forEach(function(sg){s+=segMins(sg);});return s;};
  var size=function(i){var f=shFacts(S,P,card[i]);return f?f.size:0;};
  var lenOf=function(m){return m.len||'M';};
  var segStep=function(from,to,writersFirst){
    for(var pass=0;pass<2;pass++)for(var k=L.length-1;k>=0;k--){
      var sg=L[k];if(((pass===0)===writersFirst)!==(sg.k==='writers')||SEGK[sg.k].fix||segLen(sg)!==from)continue;
      sg.len=to;return true;
    }
    return false;
  };
  var choose=function(ok,low){var best=-1,bs=low?1e9:-1e9,i,v;for(i=0;i<n;i++){if(!ok(i))continue;v=size(i);if(low?v<bs:v>bs){bs=v;best=i;}}return best;};
  var shrink=function(){
    var i;
    if(segStep('L','M',true)||segStep('M','S',true))return true;
    i=choose(function(k){return k<n-1&&lenOf(card[k])==='L'&&card[k].stip!=='iron';},true);if(i>=0){card[i].len='M';return true;}
    if(n>1&&lenOf(card[0])==='M'&&!card[0].title&&card[0].stip!=='iron'){card[0].len='S';return true;}
    i=choose(function(k){return k<n-1&&lenOf(card[k])==='M'&&!card[k].title&&card[k].stip!=='iron';},true);if(i>=0){card[i].len='S';return true;}
    if(L.length){for(i=L.length-1;i>=0;i--)if(L[i].k==='writers'){L.splice(i,1);return true;}L.pop();return true;}
    if(lenOf(card[n-1])==='L'&&card[n-1].stip!=='iron'){card[n-1].len='M';return true;}
    if(n>3){i=choose(function(k){return k<n-1&&!card[k].title;},true);if(i>=0){card.splice(i,1);L.forEach(function(sg){if(sg.pos>i)sg.pos--;});return true;}}
    return false;
  };
  var grow=function(){
    var i,m=card[n-1];
    if(n-1!==keep&&lenOf(m)!=='L'&&m.stip!=='iron'){m.len=lenOf(m)==='S'?'M':'L';return true;}
    if(segStep('S','M',false))return true;
    // an undercard match gets more time, where it would not sit next to another long one (the last two may both be long)
    i=choose(function(k){return k!==keep&&k>0&&k<n-1&&lenOf(card[k])==='M'&&card[k].stip!=='iron'&&lenOf(card[k-1])!=='L'&&(k+1>=n-1||lenOf(card[k+1])!=='L');},false);if(i>=0){card[i].len='L';return true;}
    for(i=0;i<n;i++)if(i!==keep&&lenOf(card[i])==='S'&&card[i].stip!=='iron'){card[i].len='M';return true;}
    if(L.length<4){var taken={};L.forEach(function(sg){taken[clamp(sg.pos|0,0,n-1)]=1;});var at=[n-1,Math.min(1,n-1),Math.min(2,n-1),Math.min(3,n-1)].filter(function(p){return !taken[p];})[0];L.push({k:'writers',who:[],pos:at==null?n-1:at,len:'M'});return true;}
    if(segStep('M','L',false))return true;
    i=choose(function(k){return k!==keep&&k>0&&k<n-1&&lenOf(card[k])==='M'&&card[k].stip!=='iron';},false);if(i>=0){card[i].len='L';return true;}
    return false;
  };
  for(it=0;it<40;it++){
    t=total();n=card.length;
    if(t>B+TIME_OVER){if(!shrink())break;changed++;continue;}
    if(t<B-TIME_FREE){if(!grow())break;changed++;continue;}
    break;
  }
  return changed;
}

/* ---------- what the booking screen calls ---------- */
E.SHOW_OPENS=OPENS;
E.showMins=function(S){return showMins(S.queue&&S.queue[S.qi]);};
/** The clock for the card on the desk: the budget, what is booked, every item with its start time, the top of each
    hour, and how the show opens. */
E.clock=function(S,card){
  card=card||S.card||[];var c=showClock(S,card),k=openKind(S,card);
  c.open={k:k,n:OPENS[k].n,d:OPENS[k].d};
  c.cats={match:{n:0,mins:0},promo:{n:0,mins:0},angle:{n:0,mins:0}};
  var L=segRead(S),nm=function(ids){return ids.map(function(id){return id==null||!S.w[id]?'open spot':S.w[id].name;}).join(' & ');};
  c.items.forEach(function(x){
    var cat=x.t==='match'?'match':(x.t==='plan'?'promo':(SEGK[x.k].t==='promo'?'promo':'angle'));c.cats[cat].n++;c.cats[cat].mins+=x.mins;x.cat=cat;
    x.label=x.t==='match'?card[x.i].sides.map(nm).join(' vs '):(x.t==='plan'?S.w[S.plan.sp].name+' opens with a promo':(segWhy(S,L[x.slot],x.slot)?SEGK[x.k].n:segLabel(S,L[x.slot])));
  });
  c.words=c.over?'The show runs '+(c.total-c.budget)+' minutes over.':(c.short||c.light?(c.budget-c.total)+' minutes still to fill.':(c.left>0?c.left+' minutes spare. Close enough: the announcers will cover it.':(c.left<0?(-c.left)+' minutes over. The network allows five.':'Timed to the minute.')));
  return c;
};
/** How long this match would take off the clock at each length, where it sits now. */
E.matchMins=function(S,m,i,n){
  var show=S.queue&&S.queue[S.qi],main=i===n-1,o={};
  ['S','M','L'].forEach(function(l){var c={mt:m.mt,stip:m.stip,len:l,note:m.note};o[l]=matchSlot(show,c,main);});
  o.now=matchSlot(show,m,main);o.bell=bellMins(show,m,main);return o;
};
E.fitShow=function(S,card){return fitShow(S,card||S.card||[]);};
/** The ways a show can open, for the guide window. */
E.OPEN_GUIDE=['match','promo','angle','recap','writers'].map(function(k){return {k:k,n:OPENS[k].n,d:OPENS[k].d};});
/** A whole show for a card that was booked without a person: the company's usual promos and angles, fitted to the time. */
function showFill(S,card){
  var show=S.queue&&S.queue[S.qi];if(!show||!card.length)return card;
  var P=S.promos[S.player],n=card.length,want=segSlots(P,show),L,k,spots=[Math.min(1,n-1),n-1,Math.min(2,n-1)];
  S.segs=[];S.segKey=showKey(S);L=S.segs;
  if(want>0)E.segSuggest(S,1,card);
  for(k=L.length;k<want;k++)L.push({k:'writers',who:[],pos:spots[k%spots.length],len:'M'});
  fitShow(S,card);
  return card;
}

(function(){
  var v0=E.validate,s0=E.suggest,c0=E.resolveChaos;
  /* a call on the headset can cut a match short. The show is on the air by then, so the rest of the night stretches to
     cover it: the booker is not sent back to the card. The match that was cut keeps its new length. */
  E.resolveChaos=function(S,card,c){
    var mi=S.chs&&!S.chs.done?S.chs.mi:null,r=c0(S,card,c);
    if(card&&card.length&&!S.live){var k=showClock(S,card);if(k.over||k.short)fitShow(S,card,mi);}   // on the air there is no re-fitting: the night runs short, and it is not held against the booker
    return r;
  };
  /* a show that does not fit its time cannot run */
  E.validate=function(S,card){
    var v=v0(S,card),show=S.queue&&S.queue[S.qi];if(!show||!card.length)return v;
    var c=showClock(S,card),hrs=c.budget/60,hw=(hrs===1?'one hour':(hrs===2?'two hours':(hrs===3?'three hours':hrs+' hours')));
    if(c.over)v.errors.push('The show runs '+(c.total-c.budget)+' minutes over its '+hw+'. Take something off, or give a match, a promo or an angle less time.');
    else if(c.short)v.errors.push((c.budget-c.total)+' minutes of the '+hw+' are still empty. Add a match, a promo or an angle, or give something more time.');
    else if(c.light)v.warnings.push('The show is '+(c.budget-c.total)+' minutes light. The announcers will have to fill, and the crowd will notice.');
    var my=S.mystery&&S.mystery.promo===S.player?S.mystery:null;
    if(my&&S.w[my.v]&&!segRead(S).some(function(sg){return sg.k==='writers';}))v.warnings.push('Nobody knows yet who attacked '+S.w[my.v].name+'. That story moves only when the writers have time on the show (a Writers’ pick).');
    return v;
  };
  /* the suggested card is a whole show: matches, the company's usual number of promos and angles, and it fits the time */
  E.suggest=function(S){return showFill(S,s0(S));};
})();
