/* ---------- backstage: people, not rooms ----------
   Ryan, 6 October: "I like people not rooms. I want the people who show up in these rooms to be connected to
   ongoing storylines or the current goings-on in your company."
   Nobody is in a room by chance. Each person backstage is there because of something that is true of the company
   right now: a matter the last show left on the desk, an injury, a rivalry, a contract running down, the crowd
   taking to them, real heat with somebody. The room says what kind of thing it is and what can be done about it.
   One action point is spent on a person, once a week each (S.apWho). What it does goes through relBump() and
   youRemember(), so they remember it. Nothing here calls rnd(S) to decide who shows up: E.people(S) only reads
   the game. An attempt uses rollCheck() like every other attempt.
   A new reason for somebody to be backstage is one more block in peopleNow(); what can be done about it is one
   more entry in PPL_ACT. */
var PPL_ROOMS=['catering','trainer','gym','lot','truck'],PPL_MAX=3;
function pplMatter(S,type,id){for(var i=0;i<S.inbox.length;i++){var e=S.inbox[i];if(!e.done&&e.type===type&&e.w===id)return e;}return null;}
function pplFeudOf(S,P,id){return S.feuds.filter(function(f){return !f.res&&f.promo===P.id&&(f.a.indexOf(id)>=0||f.b.indexOf(id)>=0);}).sort(function(a,b){return b.heat-a.heat;})[0]||null;}
function pplOther(S,f,id){var o=f.a.indexOf(id)>=0?f.b:f.a;return S.w[o[0]];}
function pplWorst(w){var z=zonesOf(w),k='b';['n','s','b','k'].forEach(function(q){if(z[q]>z[k])k=q;});return {k:k,v:z[k]};}
/** Everybody who is backstage for a reason, in the room the reason belongs to. A person appears once. */
function peopleNow(S){
  bsInit(S);var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),out={},seen={},used=S.apWho||{};
  PPL_ROOMS.forEach(function(k){out[k]=[];});
  var put=function(room,w,k,why,tone,acts,o){
    if(!w||seen[w.id]||out[room].length>=PPL_MAX)return false;seen[w.id]=1;
    out[room].push({id:w.id,k:k,why:why,tone:tone||'',acts:acts,with:o&&o.with!=null?o.with:null,story:o&&o.story||null,used:!!used[w.id]});return true;
  };
  var here=function(w){return w&&w.promo===P.id&&!w.nw&&!(w.away>=S.week)&&!w.camp;};
  var byOvr=R.slice().sort(function(a,b){return b.ovr-a.ovr;});
  /* the trainer's room: who is hurt, who is worn down. A champion first. */
  byOvr.filter(function(w){return w.inj>0;}).sort(function(a,b){return holdLvl(P,b.id)-holdLvl(P,a.id)||b.ovr-a.ovr;}).forEach(function(w){
    var t=P.titles.filter(function(x){return x.holders.indexOf(w.id)>=0;})[0];
    put('trainer',w,'hurt','Out for '+w.inj+' '+(w.inj===1?'week':'weeks')+(t?'. Holds the '+t.name:''),'bad',w.inj>=2?['treat']:['visit'],{story:pplMatter(S,'champout',w.id)?'It is on your desk':null});});
  byOvr.filter(function(w){return here(w)&&!(w.inj>0)&&(pplWorst(w).v>=60||w.cond<45);}).sort(function(a,b){return pplWorst(b).v-pplWorst(a).v;}).forEach(function(w){
    var z=pplWorst(w);put('trainer',w,'worn',z.v>=60?'Worn down: the '+ZONE_WORD[z.k]+' is bad':'Running on fumes','warn',['treat']);});
  /* catering: who is unhappy, who has real heat with whom */
  byOvr.filter(function(w){return here(w)&&pplMatter(S,'furious',w.id);}).forEach(function(w){put('catering',w,'furious','Went home furious after the last show','bad',['sit'],{story:'It is on your desk'});});
  var pairs=[];R.forEach(function(a){R.forEach(function(b){if(a.id<b.id&&here(a)&&here(b)){var v=bondOf(S,a.id,b.id);if(v<=-REL_ON)pairs.push({a:a,b:b,v:v});}});});
  pairs.sort(function(x,y){return x.v-y.v||x.a.id-y.a.id;}).slice(0,1).forEach(function(p){var f=feudOf(S,p.a.id,p.b.id);
    if(put('catering',p.a,'heat','Real heat with '+p.b.name+'. They are at separate tables, and everybody has noticed','bad',f?['shake']:['shake','air'],{with:p.b.id,story:f?'They are also in a rivalry on television':null}))seen[p.b.id]=1;});
  byOvr.filter(function(w){return here(w)&&!(w.inj>0)&&w.morale<38;}).sort(function(a,b){return a.morale-b.morale;}).forEach(function(w){put('catering',w,'low','Low, and saying so to anyone who sits down','warn',['sit']);});
  /* the parking lot: who is on the phone, who is waiting for whom */
  byOvr.filter(function(w){return here(w)&&w.off>S.week;}).forEach(function(w){put('lot',w,'offer','A rival has made them an offer. On the phone, with the door shut','bad',['stay']);});
  var hot=S.feuds.filter(function(f){return !f.res&&f.promo===P.id&&f.heat>=20&&f.a.length===1&&f.b.length===1;}).sort(function(a,b){return b.heat-a.heat;});
  hot.slice(0,1).forEach(function(f){var a=S.w[f.a[0]],b=S.w[f.b[0]],h=a&&a.align==='H'?a:b,o=h===a?b:a;
    if(here(h)&&here(o)&&!(h.inj>0)&&!(o.inj>0)&&h.g===o.g)put('lot',h,'ambush','Waiting by the door for '+o.name+' to arrive','warn',['jump'],{with:o.id,story:'Their rivalry is '+(f.heat>=70?'red hot':'warming up')});});
  byOvr.filter(function(w){return here(w)&&w.con!=null&&w.con<=8&&!(w.off>S.week);}).sort(function(a,b){return a.con-b.con;}).forEach(function(w){put('lot',w,'deal','Contract is up in '+w.con+' '+(w.con===1?'week':'weeks')+'. Taking calls','warn',['stay']);});
  /* the gym: who is on the way up, who has a match coming with somebody they do not click with */
  var st=S.clocks&&S.clocks.star&&S.clocks.star.w!=null?S.w[S.clocks.star.w]:null;
  if(here(st)&&!(st.inj>0))put('gym',st,'star','Your scouts like this one. In early, working on the basics','good',['coach'],{story:'The breakout clock is following them'});
  byOvr.filter(function(w){return here(w)&&!(w.inj>0)&&(pplMatter(S,'caughtfire',w.id)||w.mom>=4)&&holdLvl(P,w.id)===0;}).forEach(function(w){put('gym',w,'fire','The crowd is with them, and they know it','good',['next'],{story:pplMatter(S,'caughtfire',w.id)?'It is on your desk':null});});
  hot.slice(0,3).forEach(function(f){var a=S.w[f.a[0]],b=S.w[f.b[0]];
    if(here(a)&&here(b)&&!(a.inj>0)&&!(b.inj>0)&&chem(S,a.id,b.id)<0)if(put('gym',a,'clash','Has matches coming with '+b.name+', and they do not click in the ring','warn',['walk'],{with:b.id,story:'Their rivalry needs good matches'}))seen[b.id]=1;});
  /* the production truck: the story that is running, a newcomer, the one the shows are built around */
  hot.slice(0,2).forEach(function(f){var a=S.w[f.a[0]],b=S.w[f.b[0]],w=!seen[a.id]&&here(a)?a:b,o=w===a?b:a;
    if(here(w)&&o)put('truck',w,'story','Has an idea for the next chapter with '+o.name,'',['package'],{with:o.id,story:'A rivalry '+(f.heat>=70?'at its peak':(f.heat>=50?'that is hot':'that is building'))});});
  byOvr.filter(function(w){return here(w)&&w.deb&&(w.hy||0)<3;}).forEach(function(w){put('truck',w,'debut','Has not appeared on the shows yet. Wants to know how they will be introduced','',['tease']);});
  var top=P.titles.filter(function(t){return !t.tag&&t.holders.length;}).sort(function(a,b){return b.lvl-a.lvl||b.prestige-a.prestige;})[0],ch=top?S.w[top.holders[0]]:null;
  if(here(ch)&&!(ch.inj>0))put('truck',ch,'champ','Holds the '+top.name+'. Wants to know who is next','',['plan'],{story:pplFeudOf(S,P,ch.id)?'In a rivalry with '+pplOther(S,pplFeudOf(S,P,ch.id),ch.id).name:'No challenger has been built yet'});
  var fav=S.owner&&S.owner.fav!=null&&!S.owner.me?S.w[S.owner.fav]:null;
  if(here(fav)&&!(fav.inj>0))put('catering',fav,'fav',S.owner.name+'’s favourite. Has the owner’s ear, and knows it','',['word'],{});
  var face=typeof faceOf==='function'?faceOf(S):null;
  if(here(face)&&!(face.inj>0))put('truck',face,'face','The shows are built around them. Wants to see the run sheet','good',['run'],{});
  return out;
}
var PPL_ACT={
  treat:{n:'Stand over the trainer while they work',d:'Eight points off every worn body zone, and a week off an injury of two weeks or more.',
    run:function(S,P,w){var z=zonesOf(w),e=0;['n','s','b','k'].forEach(function(k){var f=zoneFloor(w,k),nv=Math.max(f,z[k]-8);e+=z[k]-nv;z[k]=nv;});var wk=w.inj>=2;if(wk)w.inj--;stressAdd(S,w,-4);youRemember(S,w,'trainer','You stood over the trainer until they were looked after.',3);
      return {ok:true,msg:w.name+' gets the full treatment'+(wk?' and should be back a week sooner.':(e>=4?' and walks out moving more freely.':'. There was not much to fix.'))};}},
  visit:{n:'Look in on them',d:'Nothing can hurry this one. They will remember who came.',
    run:function(S,P,w){w.morale=clamp(w.morale+5,0,100);youRemember(S,w,'visited','You came to see them when they were hurt.',5);return {ok:true,msg:'You sit with '+w.name+' for a while. It changes nothing about the injury. It changes something else.'};}},
  sit:{n:'Sit down with them',d:'Hear them out. If it goes well they leave the table lighter. If not, it is a little worse.',
    ck:function(S,P,w){return mkCheck(7,[{n:'Where you stand with them',v:youLean(S,w)},{n:'Their morale is '+Math.round(w.morale),v:w.morale<25?-1:0}].concat(skillMods(S,'talk')));},
    run:function(S,P,w,o,r){var ev=pplMatter(S,'furious',w.id),msg;
      if(r.ok){w.morale=clamp(w.morale+10,0,100);stressAdd(S,w,-8);youRemember(S,w,'talked','You came and found them and heard them out.',6);msg='You hear '+w.name+' out. They leave the table lighter than they sat down.';}
      else{w.morale=clamp(w.morale-3,0,100);youRemember(S,w,'talkedbad','You tried to talk them round, and it made it worse.',-4);msg=w.name+' did not want to be managed today. It is a little worse than before.';}
      if(ev){ev.done=true;ev.result=rollText(r)+msg;}return {ok:r.ok,msg:msg};}},
  shake:{n:'Make them shake hands',d:'Sit the two of them down. If it works the heat goes out of it. If not, it is worse, and they both remember who pushed.',
    ck:function(S,P,w,o){return mkCheck(8,[{n:'Where you stand with '+w.name,v:youLean(S,w)},{n:'Where you stand with '+o.name,v:youLean(S,o)}].concat(skillMods(S,'talk')));},
    run:function(S,P,w,o,r){
      if(r.ok){relBump(S,w.id,o.id,28,{k:'peace',t:'The booker sat them down and they shook hands.',by:'you'});[w,o].forEach(function(x){stressAdd(S,x,-5);youRemember(S,x,'peace','You sat them down with '+(x===w?o.name:w.name)+' and it was settled.',4);});return {ok:true,msg:w.name+' and '+o.name+' shake hands. Nobody is friends, but the room breathes out.'};}
      relBump(S,w.id,o.id,-8,{k:'forced',t:'The booker tried to make them shake hands.',by:'you'});[w,o].forEach(function(x){youRemember(S,x,'forced','You tried to force a handshake with '+(x===w?o.name:w.name)+'.',-3);});return {ok:false,msg:'It lasts about a minute. '+w.name+' walks out first.'};}},
  air:{n:'Put it on television',d:'It is real, so use it. A rivalry starts warm. They will work stiff, and neither will thank you.',
    run:function(S,P,w,o){var f=startFeud(S,P,w,o,34,'It is real, and the booker put it on television');if(!f)return {ok:false,stop:true,msg:'There are too many rivalries running to start another.'};
      [w,o].forEach(function(x){youRemember(S,x,'usedheat','You put their real trouble with '+(x===w?o.name:w.name)+' on television.',-2);});return {ok:true,msg:w.name+' against '+o.name+' is a rivalry now, and none of it is acting. It is on the Storylines page.'};}},
  stay:{n:'Tell them you want them to stay',d:'In person, in the car park, not through an agent. It does not sign anything. It is remembered when the offer comes.',
    run:function(S,P,w){w.morale=clamp(w.morale+6,0,100);youRemember(S,w,'wanted','You came out to the car park and told them you wanted them to stay.',8);return {ok:true,msg:w.name+' puts the phone away. Nothing is signed, but they heard it from you first.'};}},
  jump:{n:'Let it happen, with a camera on it',d:'The first one jumps the second. Fuel on the rivalry if the camera catches it.',
    ck:function(S){return mkCheck(7,skillMods(S,'creative'));},
    run:function(S,P,w,o,r){var f=feudOf(S,w.id,o.id);if(!f)return {ok:false,stop:true,msg:'That rivalry is over.'};heatUp(S,f,r.ok?12:5,w.name+' jumped '+o.name+' in the parking lot');
      if(!r.ok){var z=zonesOf(o),hz=hurtZone(S,o);z[hz]=Math.min(100,z[hz]+6);stressAdd(S,o,5);}if(w.align==='H')addOvr(P,w,0.4);
      return {ok:r.ok,msg:r.ok?w.name+' leaves '+o.name+' on the tarmac, and it makes the news. The rivalry is hotter for it.':'The camera missed most of it, and '+o.name+' landed badly. Word gets round anyway.'};}},
  coach:{n:'Work with them yourself',d:'An hour in the ring with the booker. They learn a little faster this week, and the breakout clock moves.',
    run:function(S,P,w){w.xp=(w.xp||0)+0.3;E.clocks(S);if(S.clocks.star.w===w.id){S.clocks.star.v=clamp(S.clocks.star.v+1,0,CLOCKS.star.segs);S.clocks.star.why='You worked with them yourself';}youRemember(S,w,'coached','You got in the ring and worked with them yourself.',6);
      return {ok:true,msg:'An hour of basics with '+w.name+'. They are better for it, and the breakout clock moves a segment.'};}},
  next:{n:'Tell them they are next',d:'A promise of a win within two weeks, and they go out with momentum.',
    run:function(S,P,w){var ev=pplMatter(S,'caughtfire',w.id);if(hasQuest(S,w.id)&&!ev)return {ok:false,stop:true,msg:'You have already promised '+w.name+' something. Keep that first.'};
      if(ev){ev.done=true;ev.result='You found them in the gym and gave your word: a win within two weeks.';}nightWin(S,w);w.mom=clamp((w.mom||0)+2,-10,10);w.morale=clamp(w.morale+6,0,100);youRemember(S,w,'backed','You told them to their face that they were next.',8);
      return {ok:true,msg:'You gave your word: a win for '+w.name+' within two weeks. They have momentum, and they know you noticed.'};}},
  walk:{n:'Make them walk through it together',d:'An hour in the ring, the two of them, until it clicks. Their matches get better.',
    run:function(S,P,w,o){var k=rkey(w.id,o.id),c=chem(S,w.id,o.id);(S.chemX||(S.chemX={}))[k]=clamp((S.chemX[k]!=null?S.chemX[k]:c)+1.5,-6,6);w.cond=clamp(w.cond-4,5,100);o.cond=clamp(o.cond-4,5,100);
      return {ok:true,msg:w.name+' and '+o.name+' work through it until it clicks. The next match between them will be better for it.'};}},
  'package':{n:'Shoot their idea',d:'A video package for the rivalry. It goes out at the top of the next show.',
    run:function(S,P,w,o){var f=feudOf(S,w.id,o.id);if(!f)return {ok:false,stop:true,msg:'That rivalry is over.'};heatUp(S,f,7,'A video package told the story so far');w.morale=clamp(w.morale+3,0,100);youRemember(S,w,'idea','You took their idea for the story and shot it.',4);
      return {ok:true,msg:'The package is in the can. '+w.name+' against '+o.name+' is hotter for it, and '+w.name+' saw their idea make the air.'};}},
  tease:{n:'Shoot a teaser vignette',d:'Each teaser builds hype for the debut, up to three. A hyped debut starts hot.',
    run:function(S,P,w){if(!w.deb||(w.hy||0)>=3)return {ok:false,stop:true,msg:w.name+' does not need another teaser.'};w.hy=(w.hy||0)+1;return {ok:true,msg:'A dark, grainy teaser for '+w.name+' airs on the next show. Hype for the debut: '+w.hy+' of 3.'};}},
  plan:{n:'Talk through the title picture',d:'Tell the champion where the belt is going. They work harder for a plan they believe in.',
    run:function(S,P,w){w.morale=clamp(w.morale+5,0,100);stressAdd(S,w,-4);S.hype=(S.hype||0)+0.02;youRemember(S,w,'plan','You sat down and told them where the title was going.',5);return {ok:true,msg:w.name+' leaves knowing the plan, and likes being told first. A champion who believes in the story sells it.'};}},
  word:{n:'Ask them to put in a word',d:'The owner listens to this one. A little more trust upstairs. They will expect to be looked after.',
    run:function(S,P,w){S.owner.trust=clamp(S.owner.trust+3,0,100);youRemember(S,w,'favour','You asked them for a favour with '+S.owner.name+'. They will want one back.',2);return {ok:true,msg:w.name+' has a word with '+S.owner.name+'. It lands. You owe them one now.'};}},
  run:{n:'Walk them through the show',d:'The one the shows are built around knows what the night needs. A bigger house next time, and they feel like it is theirs.',
    run:function(S,P,w){S.hype=(S.hype||0)+0.04;w.morale=clamp(w.morale+4,0,100);youRemember(S,w,'trusted','You walked them through the whole show before anybody else saw it.',4);return {ok:true,msg:w.name+' reads the run sheet twice and has one note. It is a good note. Expect a bigger house.'};}}
};
/** Backstage as people: each room, who is in it and why, and what one action point does about it. */
E.people=function(S){
  var N=peopleNow(S),P=S.promos[S.player],n=0;
  var rooms=PPL_ROOMS.map(function(k){return {id:k,n:PLACES[k].n,people:N[k].map(function(p){var w=S.w[p.id],o=p.with!=null?S.w[p.with]:null;n++;
    return {id:p.id,name:w.name,k:p.k,why:p.why,tone:p.tone,story:p.story,with:p.with,used:p.used,
      acts:p.acts.map(function(a){var A=PPL_ACT[a];return {id:a,n:A.n,d:A.d,ck:A.ck?A.ck(S,P,w,o):null};})};})};});
  return {ap:S.ap,max:apMax(S),rooms:rooms,count:n};
};
/** Spend one action point on a person. */
E.peopleDo=function(S,wid,act){
  var N=peopleNow(S),P=S.promos[S.player],p=null,room=null;
  PPL_ROOMS.forEach(function(k){N[k].forEach(function(x){if(x.id===+wid){p=x;room=k;}});});
  if(!p||p.acts.indexOf(act)<0)return {ok:false,msg:'They are not there any more.'};
  if(S.ap<=0)return {ok:false,msg:'You are out of action points this week.'};
  if(p.used)return {ok:false,msg:'You have already spent time with them this week.'};
  var A=PPL_ACT[act],w=S.w[p.id],o=p.with!=null?S.w[p.with]:null,r=A.ck?rollCheck(S,A.ck(S,P,w,o)):null,res=A.run(S,P,w,o,r);
  if(res.stop)return {ok:false,msg:res.msg};
  S.ap--;(S.apWho=S.apWho||{})[w.id]=1;if(o)S.apWho[o.id]=1;gainXp(S,4);
  var out=(r?rollText(r):'')+res.msg;S.apLog.push({pl:room,place:PLACES[room].n,act:A.n,ok:res.ok,msg:out,who:[w,o].filter(Boolean).map(function(x){return x.name;})});
  return {ok:res.ok,done:true,roll:r,msg:out};
};
WEEKX.push(function(S){S.apWho={};});
