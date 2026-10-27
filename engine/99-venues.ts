// @ts-nocheck
/* Moved from src/99-venues.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, flat, h01, rosterOf } from './00-core';
import { CRX } from './10-match';
import { LIVEK, liveMatch, livePut } from './31-live';
import { money } from './40-week';
import { youRemember } from './66-relations';
import { cityOfVenue } from './91-road';
$L.venueQuirks = venueQuirks;
/* wraps: 91-road.js (it must sort after them; test-buildorder.js checks) */
/* Venue personality and disasters (the add-ons run, item 12). Every building (cityBuildings() in src/91-road.js) has
   quirks of its own, fixed by its name: how it feels full or half empty, how it sounds, its sightlines, the local crowd's
   temper, and whether it is open to the weather. They lift or dampen the crowd on the night (CRX) and are said on the
   desk. Now and then something goes wrong in the building: the power, the ring, the weather (open-air buildings only),
   trouble in the crowd (worse where the crowd runs rowdy). It comes as a call from the gorilla position before the
   first match (LIVEK.disaster), and every answer has its price. Nothing here calls rnd(S): quirks and disasters come from
   hashes of the building and the night. */
export var VQ_FEEL={intimate:'intimate: every seat is close',cavernous:'cavernous: hard to fill, hard to warm up',right:''},VQ_SOUND={loud:'the roof keeps the noise in',dead:'the sound dies in the rafters',plain:''};
$L.VQ_FEEL = VQ_FEEL; $L.VQ_SOUND = VQ_SOUND;
export var VQ_CROWD={rowdy:'a rowdy local crowd',smart:'a crowd that knows its wrestling',polite:'a polite crowd that needs warming up',plain:''};
$L.VQ_CROWD = VQ_CROWD;
export function venueQuirks(vname){
  var v=String(vname||''),h=function(k){return h01('vq:'+k+':'+v);},open=/ (Stadium|Bowl|Field)\b/.test(v),small=/ (Armory|Union Hall|Legion Hall|Rec Center|Ballroom|Music Hall)\b/.test(v);
  var q={feel:small||h('f')<0.25?'intimate':(h('f')>0.8&&!small?'cavernous':'right'),sound:h('s')<0.3?'loud':(h('s')>0.82?'dead':'plain'),crowd:h('c')<0.25?'rowdy':(h('c')<0.45?'smart':(h('c')>0.85?'polite':'plain')),sight:h('g')>0.85?'poor':'fine',open:open};
  var w=[];if($L.VQ_FEEL[q.feel])w.push($L.VQ_FEEL[q.feel]);if($L.VQ_SOUND[q.sound])w.push($L.VQ_SOUND[q.sound]);if($L.VQ_CROWD[q.crowd])w.push($L.VQ_CROWD[q.crowd]);if(q.sight==='poor')w.push('poor sightlines from the cheap seats');if(q.open)w.push('open to the sky');
  q.words=w;q.short=w.length?w[0].split(':')[0]:'nothing special';return q;
}
E.venueQuirks=function(v){return venueQuirks(v);};
/* the building on the night */
CRX.push(function(ctx){
  if(!ctx.isPl||!ctx.rep||!ctx.rep.venue)return null;var q=venueQuirks(ctx.rep.venue),d=0,x=[];
  if(q.feel==='intimate'){d+=1;x.push('an intimate building');}
  if(q.feel==='cavernous'&&ctx.rep.att&&ctx.rep.cap&&ctx.rep.att<ctx.rep.cap*0.7){d-=1;x.push('a cavernous building half full');}
  if(q.sound==='loud'){d+=1;x.push('a loud building');}else if(q.sound==='dead'){d-=1;x.push('a building where the sound dies');}
  if(q.crowd==='rowdy'&&ctx.all.some(function(w){return w.align==='H';})){d+=1;x.push('a rowdy crowd that loves to boo');}
  if(q.crowd==='smart'&&ctx.isMain){d+=1;x.push('a crowd that knows good wrestling');}
  if(q.crowd==='polite'&&ctx.isMain===false&&d>=0){d-=0.5;}
  return d?{d:d,x:x.join(', ')}:null;
});
/* something goes wrong in the building */
export var DISASTER={
  power:{n:'The power goes out',text:'The lights die halfway through the entrances. The building is black and the crowd is getting restless.',choices:[
    {n:'Keep going under the emergency lights',says:'It is grim to look at, and the crowd sings to keep itself warm.',cr:-2},
    {n:'Stop the show until the power is back',says:'Twenty minutes of nothing. The show runs short, and the crowd is cold when it comes back.',cr:-3,cut:1},
    {n:'Send your biggest name out with a microphone',says:'One voice in the dark, and the crowd hangs on every word.',cr:1,star:1,cost:'They will remember you threw them out there.'}]},
  ring:{n:'The ring is broken',text:'A turnbuckle has snapped in warm-ups and the bottom rope is loose. The crew say ten minutes, maybe more.',choices:[
    {n:'Work around it',says:'They wrestle away from the bad corner. It shows, and somebody could get hurt.',cr:-1,hurt:1},
    {n:'Fix it properly',says:'The crew fix it right. The show runs late and loses a segment.',cr:-1,cut:1},
    {n:'Make it part of the show: a no-ropes match',says:'The announcers sell it as a special attraction. It is a risk, and it might be remembered.',cr:2,hurt:1}]},
  weather:{n:'The weather turns',text:'Rain is coming in sideways over the open end of the building. Half the floor seats are getting wet.',choices:[
    {n:'Carry on in the rain',says:'They wrestle in the rain. Some love it. Some go home.',cr:1,hurt:1,mkt:-1},
    {n:'Wait it out',says:'An hour under ponchos. The show is cut short, and the people who stayed are cold.',cr:-2,cut:1},
    {n:'Refund the floor seats',says:'Every wet seat gets its money back. It costs, and the city will remember the gesture.',cr:0,refund:1,mkt:2}]},
  crowd:{n:'Trouble in the crowd',text:'A fight has broken out in the cheap seats and it is spreading. Security is stretched thin.',choices:[
    {n:'Stop the show until it is cleared',says:'Security clears it. The show runs short, and the city talks about it for a week.',cr:-1,cut:1,mkt:-1},
    {n:'Keep the show going and let security handle it',says:'The show goes on over the noise. A few people get hurt in the stands.',cr:-2,mkt:-2},
    {n:'Send a hero out to calm them down',says:'They walk to the barricade and the fight stops. The crowd chants their name.',cr:2,star:1,face:1}]}
};
$L.DISASTER = DISASTER;
LIVEK.disaster={n:'Trouble in the building',
  pre:function(S,L,step){
    if(step.t!=='match'||L.had.disaster)return null;var rep=L.st&&L.st.rep;if(!rep||!rep.venue)return null;var q=venueQuirks(rep.venue);
    var p=0.025+(q.open?0.04:0)+(q.crowd==='rowdy'?0.02:0)+(q.feel==='cavernous'?0.01:0);
    if(h01(S.seed+':dis:'+S.week+':'+S.qi)>=p)return null;
    var kinds=['power','ring'].concat(q.open?['weather']:[]).concat(q.crowd==='rowdy'?['crowd','crowd']:['crowd']),k=kinds[Math.floor(h01(S.seed+':disk:'+S.week+':'+S.qi)*kinds.length)],D=$L.DISASTER[k];
    var M=liveMatch(S,L,step.i),R=rosterOf(S,S.player).filter(function(w){return !w.nw&&!(w.inj>0);}).sort(function(a,b){return b.ovr-a.ovr;}),star=(D.choices.some(function(c){return c.face;})?R.filter(function(w){return w.align!=='H';})[0]:R[0])||R[0];
    return {phase:'mid',mi:step.i,dk:k,who:star?star.id:null,text:D.text+' ('+rep.venue+')',why:q.words.length?['The building: '+q.words.join('; ')]:[],safe:1,
      choices:D.choices.map(function(c){return {n:c.star&&star?c.n.replace(/your biggest name|a hero/,star.name):c.n,says:c.says,who:c.star&&star?star.id:null};})};
  },
  run:function(S,L,ev,c){
    var D=$L.DISASTER[ev.dk],o=D.choices[c],M=liveMatch(S,L,ev.mi),P=S.promos[S.player],rep=L.st.rep,city=cityOfVenue(rep.venue);if(!o)return '';
    if(M&&o.cr)livePut(M.m,{cr:o.cr,x:D.n.toLowerCase()+': '+o.n.toLowerCase()});
    if(o.cut)rep.short=1;
    if(o.hurt&&M){var w=flat(M.c.sides)[0];if(w&&h01(S.seed+':dish:'+S.week)<0.35){w.inj=Math.max(w.inj||0,2);$L.news(S,'injury',w.name+' was hurt when '+D.n.toLowerCase()+' at '+rep.venue+'.');youRemember(S,w,'venuehurt','Got hurt in a broken building because the show went on.',-3);}}
    if(o.refund){var cost=Math.round((rep.gate||0)*0.25);P.cash-=cost;o.says+=' It costs '+money(cost)+'.';}
    if(o.mkt&&S.mkt&&S.mkt[city])S.mkt[city].k=clamp((S.mkt[city].k||50)+o.mkt*3,0,100);
    if(o.star&&ev.who!=null&&S.w[ev.who]){var s=S.w[ev.who];youRemember(S,s,'venuesave','You sent them out to save the night when '+D.n.toLowerCase()+'.',o.face?3:1);s.mom=clamp((s.mom||0)+1,-10,10);}
    $L.note(S,D.n,o.says,o.cr>0?'good':(o.cr<0?'bad':''));
    return o.says;
  }
};
$L.LIVE_ORDER.push('disaster');   // tried last: trouble in the building never takes the place of another call
/** For the desk: the quirks of tonight's building, in words. */
E.buildingWords=function(S){var R=E.road(S);if(!R||!R.now||!R.now.venue)return null;var q=venueQuirks(R.now.venue);return {words:q.words,short:q.short};};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.VQ_FEEL = VQ_FEEL;
$L.VQ_SOUND = VQ_SOUND;
$L.VQ_CROWD = VQ_CROWD;
$L.venueQuirks = venueQuirks;
$L.DISASTER = DISASTER;
