// @ts-nocheck
/* Moved from src/60-grammar.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.gramPick = gramPick; $L.gramCase = gramCase; $L.gram = gram; $L.promoSpeech = promoSpeech; $L.matchShape = matchShape;
/* ===== The text grammar: procedurally written lines for the newsletter, the websites and the chat room =====
   A small grammar engine in the manner of Tracery, with Improv's idea that a line may only be used when it is true
   of the world. A rule set maps a symbol to its choices; "#sym#" in a choice expands that symbol, "{key}" fills in a
   value from the context, and "#sym.cap#" or "#sym.up#" changes its case. A choice is a string, or {t, if, w}: `if`
   is a function of the context that must hold, `w` a weight (1 if left out). Every pick comes from h01() on a key, so
   the same week writes the same words, and nothing here ever draws on rnd(S): words never change how a game plays. */
export function gramPick(L,ctx,key){
  var ok=[],tot=0;
  for(var i=0;i<L.length;i++){var c=L[i];if(typeof c==='string'){ok.push({t:c,w:1});tot+=1;}else if(!c.if||c.if(ctx)){var w=c.w==null?1:c.w;ok.push({t:c.t,w:w});tot+=w;}}
  if(!ok.length)return '';
  var r=$L.h01(key)*tot;for(var j=0;j<ok.length;j++){r-=ok[j].w;if(r<0)return ok[j].t;}
  return ok[ok.length-1].t;
}
export function gramCase(s,m){if(m==='cap')return s.charAt(0).toUpperCase()+s.slice(1);if(m==='up')return s.toUpperCase();if(m==='low')return s.toLowerCase();return s;}
/** Expand `start` in rule set R with context ctx. key makes the picks repeatable; depth stops runaway rules. */
export function gram(R,start,ctx,key,depth){
  depth=depth||0;var n=0;
  var src=R[start]?$L.gramPick(R[start],ctx,key+'|'+start):start;
  if(depth>8)return src;
  return src.replace(/#(\w+)(?:\.(\w+))?#/g,function(_,sym,mod){n++;return $L.gramCase($L.gram(R,sym,ctx,key+'|'+n+sym,depth+1),mod);})
    .replace(/\{(\w+)\}/g,function(_,k){return ctx[k]!=null?String(ctx[k]):'';});
}

/* ---------- the newsletter ---------- */
export var GR_SHEET={
  // the headline over the lead story
  head:[
    {t:'#title_head#',if:function(c){return c.k==='title';},w:3},
    {t:'#hot_head#',if:function(c){return c.k==='hot';},w:3},
    {t:'#cold_head#',if:function(c){return c.k==='cold';},w:3},
    {t:'#world_head#',if:function(c){return c.k==='world';},w:3},
    {t:'#quiet_head#',if:function(c){return c.k==='quiet';},w:3}
  ],
  title_head:['Gold changes hands','The belt moves','So much for the long reign','A new name on the belt',{t:'{who} takes the gold',if:function(c){return !!c.who;},w:2},{t:'Title change: {who}',if:function(c){return !!c.who;},w:2},{t:'The night {who} got the belt',if:function(c){return !!c.who;},w:2}],
  hot_head:['{co} on a roll','A big week for {co}','{co} is the hottest act in the business','Everything clicked for {co}','The crowds are coming back to {co}','{co} delivers again'],
  cold_head:['A rough week for {co}','{co} misses the mark','Where did the crowd go?','Trouble in {co}','{co} has some thinking to do','Flat, flat, flat'],
  world_head:['Around the business','News from around the rings','The rest of the world','Elsewhere this week','Meanwhile, over in {rival}'],
  quiet_head:['A quiet week','Not much to report','The calm before something','Nothing broke this week','A slow news week'],
  // the editor's opening line, set above everything else, the way the 90s sheets began
  open:[
    {t:'#open_title#',if:function(c){return c.k==='title';},w:2},
    {t:'#open_hot#',if:function(c){return c.k==='hot';},w:2},
    {t:'#open_cold#',if:function(c){return c.k==='cold';},w:2},
    '#open_any#'
  ],
  open_title:['Let us start with the title change, because nothing else this week comes close.','We have a new champion, and the phones have not stopped ringing about it.','The big story is the belt, and we will get to everything else after.'],
  open_hot:['If you only watch one company right now, it is {co}.','The word coming out of {co} this week is all good.','{co} put on the kind of week that gets people talking at work on Monday.'],
  open_cold:['There is no nice way to put this week for {co}.','The tapes from {co} this week were a chore to get through.','Somebody at {co} needs to have a long look at the last few shows.'],
  open_any:['Here is what happened this week.','Plenty to cover, so let us get to it.','As always, the phone lines were busy this week.','Lots of notes this week, some of them even good.','Pour a coffee. This one runs long.'],
  // the closing verdict on the booking
  verdict:[
    {t:'#v_good#',if:function(c){return c.d>=3;}},
    {t:'#v_bad#',if:function(c){return c.d<=-3;}},
    {t:'#v_par#',if:function(c){return c.d>-3&&c.d<3;}}
  ],
  v_good:['The booking is working: the shows are beating expectations.','Whoever is putting these cards together deserves a raise.','Credit where it is due. The shows are better than they need to be.','This is a company that knows what its crowd wants.'],
  v_bad:['The booking is missing: the shows are under what the crowd expects.','The cards are not landing, and the crowd is starting to notice.','Something has to change, and soon.','You cannot keep running shows like this and expect people to keep buying tickets.'],
  v_par:['The booking is doing its job, no more.','Solid enough. Nobody is going to remember it in a month.','Not bad, not great. Par for the course.','The shows are fine. Fine is not what sells tickets.']
};
$L.GR_SHEET = GR_SHEET;

/* ---------- the websites on Wrestle Search ---------- */
export var GR_WEB={
  rumor:[
    {t:'EXCLUSIVE: #rumor_tease#',w:2},'SHOCKER: #rumor_tease#','You will NOT believe it: #rumor_tease#','Sources say: #rumor_tease#','BREAKING!!! #rumor_tease#'
  ],
  rumor_tease:[
    {t:'{who} is not happy',if:function(c){return !!c.who;}},
    {t:'{who} could be on the move',if:function(c){return !!c.who;}},
    {t:'Big changes coming to {co}',if:function(c){return !!c.co;}},
    'Somebody big is about to jump ship','The locker room is talking','Contracts, egos and a lot of phone calls'
  ],
  results:[
    {t:'{show}: #res_hot#',if:function(c){return c.band>0;},w:2},
    {t:'{show}: #res_par#',if:function(c){return c.band===0;},w:2},
    {t:'{show}: #res_bad#',if:function(c){return c.band<0;},w:2},
    'Full results from {show}'
  ],
  res_hot:['A must see','The crowd went home happy','Go find the tape','Best show in weeks','Do not miss this one'],
  res_par:['A solid night','Nothing wrong with it','Business as usual','Did its job'],
  res_bad:['Skip it','A long night','Not their finest hour','The crowd checked out early','We watched so you do not have to'],
  rank:['The list is in!','Who is the best in the world?','This week’s top ten','The rankings everybody argues about',{t:'{who} holds number one',if:function(c){return !!c.who;},w:2}],
  belts:['Every champion, every company','Who holds the gold right now','Champions of the world','The title picture, updated weekly',{t:'{n} belts and counting',if:function(c){return c.n>0;}}],
  whisper:['What really happened behind the curtain','You did not hear it from us','The locker room report','Heard in catering',{t:'All eyes on {who}',if:function(c){return !!c.who;},w:2}],
  board:['Welcome to the board! Be nice.','The fans have spoken','Hot topic: {topic}','Post your thoughts below',{t:'The board is in a mood today',if:function(c){return c.mood<45;},w:2},{t:'Everybody is happy for once',if:function(c){return c.mood>=75;},w:2}]
};
$L.GR_WEB = GR_WEB;

/* ---------- the chat room ---------- */
export var GR_CHAT={
  line:[
    {t:'#chat_hot#',if:function(c){return c.band>0;},w:3},
    {t:'#chat_bad#',if:function(c){return c.band<0;},w:3},
    {t:'#chat_par#',if:function(c){return c.band===0;},w:3},
    {t:'#chat_best#',if:function(c){return !!c.best;},w:2},
    {t:'#chat_win#',if:function(c){return !!c.win&&!!c.lose;},w:2},
    {t:'#chat_new#',if:function(c){return !!c.champ;},w:3},
    {t:'#chat_fhot#',if:function(c){return !!c.feud&&c.fheat>=70&&!c.fend;},w:2},
    {t:'#chat_fold#',if:function(c){return !!c.feud&&c.fstale;},w:2},
    {t:'#chat_fend#',if:function(c){return !!c.feud&&c.fend;},w:3},
    {t:'#chat_heel#',if:function(c){return !!c.turn&&c.heel;},w:4},
    {t:'#chat_face#',if:function(c){return !!c.turn&&!c.heel;},w:4}
  ],
  chat_heel:['{turn} turned on us!!!','i KNEW {turn} was going bad. called it','{turn} is dead to me','{turn} as a villain is going to be so good','why {turn} WHY'],
  chat_face:['{turn} is one of the good guys now??','{turn} turning good was overdue','not buying the new {turn}. give it a month','cheering for {turn} feels weird lol','{turn} finally sees the light'],
  chat_fhot:['{feud} is the best thing on tv right now','i need {feud} to never end','{feud}!!! this is what wrestling is about'],
  chat_fold:['how is {feud} STILL going','end {feud} already please','{feud} again?? zzz'],
  chat_fend:['so thats the end of {feud}. what a run','{feud} is over and i am not ok','cant believe they ended {feud} like that'],
  chat_hot:['{show} was awesome!!!','anybody else see {show}?? wow','{show} = show of the year so far','ok {co} is on fire right now','that crowd was LOUD tonight','i take back everything i said about {co}'],
  chat_bad:['{show} put me to sleep lol','{co} needs a new booker','why do i keep watching {co}','{show} was rough. real rough','zzzzzz','who books this stuff'],
  chat_par:['{show} was ok i guess','not bad from {co} tonight','{show} was fine. nothing special','decent show, slow middle'],
  chat_best:['{best} stole the show','did you see {best}?? unreal','{best} was the only thing worth watching','rewinding {best} right now'],
  chat_win:['cant believe {win} beat {lose}','{win} over {lose} was the right call','{lose} got robbed!!!','{win} {win} {win}!!!!','{lose} fans in shambles'],
  chat_new:['NEW CHAMPION!!! {champ}!!!','{champ} with the belt. finally','{champ} as champ? not sure about that','about time {champ} got the gold','{champ} wont hold it a month, watch']
};
$L.GR_CHAT = GR_CHAT;

/* ---------- promos: the words a wrestler says on the microphone ----------
   Built from parts: an opener, a callback to something that really happened, the point (a boast, a threat, a
   challenge), and a closer. How good they are on the mic decides the tier: 2 is polished, 1 says what needs saying,
   0 fumbles. Heels and heroes talk differently. */
export var GR_PROMO={
  speech:[
    {t:'#open# #callback# #point# #close#',if:function(c){return c.tier===2;},w:3},
    {t:'#open# #point# #close#',if:function(c){return c.tier===2;}},
    {t:'#open# #callback# #point#',if:function(c){return c.tier===1;},w:2},
    {t:'#point# #close#',if:function(c){return c.tier===1;}},
    {t:'#fumble#',if:function(c){return c.tier===0;}}
  ],
  open:[
    {t:'#open_f#',if:function(c){return !c.heel;}},{t:'#open_h#',if:function(c){return c.heel;}}
  ],
  open_f:['Thank you. Thank you all.',{t:'{city}, it is good to be home!',if:function(c){return c.home;},w:3},'I am not going to keep you long.','Everybody here knows why I am out here.','I have waited a long time to say this.'],
  open_h:['Shut up. All of you.','Sit down. I am talking now.','Look at you people.','I did not come out here to be cheered, and I sure did not come out here to be booed.','You can boo all you like. It changes nothing.'],
  callback:[
    {t:'#cb_beat#',if:function(c){return !!c.lostTo;},w:3},
    {t:'#cb_won#',if:function(c){return !!c.beat;},w:3},
    {t:'#cb_champ#',if:function(c){return !!c.held;},w:3},
    {t:'#cb_streak#',if:function(c){return c.streak>=3;},w:2},
    {t:'#cb_home#',if:function(c){return !!c.home;},w:2},
    {t:'#cb_feud#',if:function(c){return c.weeks>=3;},w:2},
    {t:'#cb_any#',w:1}
  ],
  cb_beat:['{lostTo} beat me. I know it. You know it. I have watched that tape every night since.','Last time, {lostTo} got the better of me. Last time.','I have not forgotten what {lostTo} did to me, and I never will.'],
  cb_won:['I already beat {beat} once. I can do it again.','{beat} knows what happens when we get in there. {beat} has the bruises to prove it.','The scoreboard says I am ahead of {beat}, and it is going to stay that way.'],
  cb_champ:['This is the {held}, and it is mine.','Every day I wake up as the {held} holder, I earn it again.','People said I would never hold the {held}. Look at my shoulder.'],
  cb_streak:['{streak} straight. Name one person who has done better.','I have not lost in {streak} matches. Think about that.','{streak} wins in a row, and I am just warming up.'],
  cb_home:['I grew up ten minutes from this building.','{city} made me. Tonight I give something back.','I used to sit up in those seats and dream about this.'],
  cb_feud:['{them} and I have been at it for {weeks} weeks now.','{weeks} weeks of this, and it ends soon.','This has been going on for {weeks} weeks, and I am tired of talking.'],
  cb_any:['I have been in this business a long time.','People keep asking me what I am going to do next.','Everybody has an opinion about me.'],
  point:[
    {t:'#pt_challenge#',if:function(c){return c.k==='challenge';},w:3},
    {t:'#pt_call#',if:function(c){return (c.k==='callout'||c.k==='faceoff'||c.k==='words')&&!!c.them;},w:3},
    {t:'#pt_boast_h#',if:function(c){return c.heel;}},
    {t:'#pt_boast_f#',if:function(c){return !c.heel;}}
  ],
  pt_challenge:['I want the {title}, {them}. Name the night.','{them}, enjoy holding the {title} while you can. It is coming home with me.','That belt looks good on you, {them}. It will look better on me.'],
  pt_call:[{t:'{them}, I am calling you out. Right here, right now.',w:2},'{them}, you know where to find me.','{them}, I hope you are watching, because I am coming for you.',{t:'{them}, when this is over, nobody will remember your name.',if:function(c){return c.heel;},w:2},{t:'{them}, I respect you. I am still going to beat you.',if:function(c){return !c.heel;},w:2}],
  pt_boast_h:['There is not one person in that locker room who can stay in the ring with me.','I am the best thing that ever happened to this company, and none of you deserve me.','Every one of you paid to see me. You are welcome.'],
  pt_boast_f:['Every night I go out there and give you everything I have.','I do not care who is next. Send them out.','As long as you keep showing up, so will I.'],
  close:[
    {t:'#cl_fin#',if:function(c){return !!c.fin;},w:2},
    {t:'#cl_h#',if:function(c){return c.heel;}},{t:'#cl_f#',if:function(c){return !c.heel;}}
  ],
  cl_fin:['And when it is over, it ends with the {fin}.','One {fin}, and it is done.','You know how this ends. The {fin}.'],
  cl_h:['Now get out of my ring.','Remember my name. You will be saying it for years.','That is all. You are dismissed.'],
  cl_f:['I will see you out there.','That is a promise.','Count on it.'],
  fumble:['I, uh. I am going to win. That is what I am going to do.','{them}, you are going down. Down. You know what I mean.','I am the best. The best there is. At this. At wrestling.','People ask me, they say, what are you going to do? And I say. Well. I am going to do it.','I came out here to say something, and I am saying it. Right now.']
};
$L.GR_PROMO = GR_PROMO;
/** The words one wrestler says in a promo, in quotes after their name. Reads only; picks from h01. */
export function promoSpeech(S,a,b,kind,ov,city,key){
  var P=S.promos[a.promo]||S.promos[S.player],h=b&&S.h2h?S.h2h[$L.rkey(a.id,b.id)]:null,f=b?$L.feudOf(S,a.id,b.id):null,t=null,held=null;
  if(P)P.titles.forEach(function(x){if(!t&&kind==='challenge'&&b&&x.holders.indexOf(b.id)>=0)t=x;if(!held&&x.holders.indexOf(a.id)>=0)held=x;});
  var lo=b?Math.min(a.id,b.id):0,aw=h?(a.id===lo?h.a:h.b):0,bw=h?(a.id===lo?h.b:h.a):0;
  var c={k:kind,heel:a.align==='H',tier:ov>=72?2:(ov>=52?1:0),them:b?b.name:null,title:t?t.name:null,held:held?held.name:null,
    lostTo:h&&h.lw===(b&&b.id)&&bw>0?b.name:null,beat:h&&h.lw===a.id&&aw>0&&b?b.name:null,streak:a.ws||0,
    home:!!(city&&a.town&&$L.homeKm(S,a,city)!=null&&$L.homeKm(S,a,city)<=100),city:city||'everybody',weeks:f?Math.max(0,S.week-(f.start||S.week)):0,fin:a.fin?String(a.fin).replace(/^the /i,''):null};
  return a.name+': “'+$L.gram($L.GR_PROMO,'speech',c,key).replace(/\s+/g,' ').trim()+'”';
}

/* ---------- match shapes: how a match is told ----------
   Every one-on-one or tag match gets a shape from what it is (a mismatch, a war in a hot feud, two high flyers, two
   technicians, an underdog's comeback, or back and forth), and moves named for each wrestler's style. Picked by a hash
   of the match, so the call varies while results never change. */
export var MOVES={
  B:['a running clothesline','a headbutt','a stomp in the corner','a backbreaker','a lariat','a chair-shot of a forearm'],
  T:['a suplex','a German suplex','an armbar','a figure-four','a bridging pin','a hammerlock'],
  H:['a dive to the floor','a moonsault','a crossbody from the top','a springboard kick','a corkscrew press'],
  P:['a powerbomb','a gorilla press','a spinebuster','a bearhug','a chokeslam'],
  A:['a dropkick','a neckbreaker','a DDT','a vertical suplex','a flying elbow'],
  S:['a spinning heel kick','a knee strike','a flurry of kicks','a superkick','a backfist'],
  E:['a showboat elbow drop','a strut and a slap','a jumping elbow','a dance before a dropkick']
};
$L.MOVES = MOVES;
export var GR_SHAPE={
  intro:[
    {t:'#i_squash#',if:function(c){return c.k==='squash';}},{t:'#i_war#',if:function(c){return c.k==='war';}},
    {t:'#i_sprint#',if:function(c){return c.k==='sprint';}},{t:'#i_chess#',if:function(c){return c.k==='chess';}},
    {t:'#i_back#',if:function(c){return c.k==='back'||c.k==='comeback';}}
  ],
  i_squash:['This is a mismatch, {p}, and everybody in the building knows it.','{big} is not even breathing hard.','{small} is in over their head here.'],
  i_war:['They are not wrestling, {p}. They are fighting.','No feeling out here: they go straight for each other.','You can feel the bad blood from up here, {p}.'],
  i_sprint:['They are going a mile a minute, {p}!','Nobody in this match is slowing down.','Blink and you will miss something in this one.'],
  i_chess:['A chess match, {p}: every hold has a counter.','Hold for hold, counter for counter.','These two could wrestle each other for an hour.'],
  i_back:['Back and forth early. Neither one gives an inch.','They trade holds, then they trade blows.','An even start. Nobody has the edge yet.'],
  spot:[
    {t:'#s_war#',if:function(c){return c.k==='war';},w:2},
    {t:'{a} hits {am}, and {b} answers with {bm}.',w:2},
    {t:'{a} goes for {am}, but {b} counters with {bm}!',w:2},
    {t:'{b} catches {a} with {bm} out of nowhere.'}
  ],
  s_war:['They spill out to the floor and fight into the crowd.','{a} sends {b} into the steel steps.','The referee is losing control of this one.'],
  late:[
    {t:'{w} has been on the defensive all match, but here comes the comeback!',if:function(c){return c.k==='comeback';}},
    {t:'{a} hits the {fa}... and {b} kicks out! Nobody kicks out of that!',if:function(c){return !!c.fa&&c.hot;}},
    {t:'{b} goes for the {fb}, but {a} slips out of it!',if:function(c){return !!c.fb;}},
    {t:'Both of them are down, {p}. The referee starts to count.',if:function(c){return c.hot;}}
  ]
};
$L.GR_SHAPE = GR_SHAPE;
/** The extra beats a match's shape adds: an intro line for the colour man, a spot in the middle, a late swing. */
export function matchShape(x,o,hk){
  var A=x.all.filter(function(w){return w.name===o.a;})[0]||x.all[0],B=x.all.filter(function(w){return w.name===o.b;})[0]||x.all[1];if(!A||!B)return null;
  var k='back';
  if(x.gap>=15&&x.mins<=8)k='squash';
  else if(x.feud&&x.feudHeat>=60||/street|nodq|hardcore|cage|lms|brawl/.test(String(x.stip||'')))k='war';
  else if(/[HS]/.test(A.style)&&/[HS]/.test(B.style))k='sprint';
  else if(A.style==='T'&&B.style==='T')k='chess';
  else if(x.upset||(x.under&&x.under===o.w&&x.gap>=6))k='comeback';
  var pk=function(L,s){return L[Math.floor($L.h01(hk+s)*L.length)%L.length];};
  var srt=[A,B].sort(function(p,q){return q.ovr-p.ovr;});
  var c={k:k,p:o.p,a:A.name,b:B.name,w:o.w||A.name,big:srt[0].name,small:srt[1].name,am:pk($L.MOVES[A.style]||$L.MOVES.A,'am'),bm:pk($L.MOVES[B.style]||$L.MOVES.A,'bm'),
    fa:A.fin||null,fb:B.fin||null,hot:x.MQ>=72&&x.mins>=12};
  return {k:k,intro:$L.gram($L.GR_SHAPE,'intro',c,hk+'i'),spot:x.mins>8&&k!=='squash'?$L.gram($L.GR_SHAPE,'spot',c,hk+'s'):null,late:x.mins>=12&&k!=='squash'?$L.gram($L.GR_SHAPE,'late',c,hk+'l'):null};
}

/* ---------- the newsletter's feud watch: how the stories around the business stand ---------- */
export var GR_FEUD={
  line:[
    {t:'#fw_hot#',if:function(c){return c.k==='hot';}},{t:'#fw_stale#',if:function(c){return c.k==='stale';}},
    {t:'#fw_new#',if:function(c){return c.k==='new';}},{t:'#fw_long#',if:function(c){return c.k==='long';}},
    {t:'#fw_done#',if:function(c){return c.k==='done';}},{t:'#fw_fizz#',if:function(c){return c.k==='fizz';}}
  ],
  fw_hot:['{f} in {co} is the hottest thing going right now.','Nobody is drawing like {f} in {co}.','{f} ({co}) has the crowds on their feet every week.'],
  fw_stale:['{f} in {co} has run out of road. Time to end it.','We have seen everything {f} has to offer. {co} should take the hint.','{f} ({co}) is starting to drag.'],
  fw_new:['Keep an eye on {f} in {co}. It is only just starting.','{co} has started something with {f}.','Early days for {f} in {co}, but there is something there.'],
  fw_long:['{f} has been going for {w} weeks in {co}, and it is still hot. Remarkable.','{w} weeks in, {f} is still the story in {co}.'],
  fw_done:['{f} came to an end in {co} this week.','That is a wrap on {f} in {co}.'],
  fw_fizz:['{f} in {co} never caught on, and it is over.','{co} quietly let {f} die. Nobody noticed.']
};
$L.GR_FEUD = GR_FEUD;

/* ---------- the podcast: two hosts talk through the week (src/99-zpodcast.js) ----------
   Host A is a writer from the press, sure of the facts. Host B is a retired wrestler with dry jokes. {a} and {b} are
   their first names, {show} the podcast, {co} your company. `tone` is how warm the writer is to your company:
   1 friendly, 0 fair, -1 cool. */
export var GR_POD={
  hello:['Welcome to {show}. I am {a}, here with {b}, and we have a lot to get to this week.','Hello and welcome to {show}. {a} here, and {b} is with me as always.','It is {wk}, this is {show}, I am {a}, and across the desk is {b}.','Welcome, everybody. This is {show}. I am {a}, that is {b}, and there is plenty to talk about.'],
  hi_b:['We always have a lot to get to.','Hello, everybody. Get comfortable. {a} will be a while.','Good to be here. I think.','Hello. I have notes this week. Two of them.','Hi, all. I have had three coffees, so let us go.'],
  lead:['The big story this week. {lead}','Let us start with the news everybody is talking about. {lead}','First things first. {lead}'],
  lead_b:['That is a big one.','I did not see that coming.','People in the locker room will have opinions about that.','Well. That changes things.','I saw that and said a word I cannot say here.'],
  // your company's shows
  grade:[
    {t:'#grade_up#',if:function(c){return c.band>0;},w:3},{t:'#grade_par#',if:function(c){return c.band===0;},w:3},{t:'#grade_down#',if:function(c){return c.band<0;},w:3}],
  grade_up:[{t:'{sh} from {co}. I had it at {g}, and that crowd got more than they came for.',w:2},{t:'{sh} was a good night for {co}. I graded it {g}, better than that crowd expected.',if:function(c){return c.tone>=0;}},{t:'Fine. {sh} was good. I had it at {g}. I will give {co} that one.',if:function(c){return c.tone<0;},w:3},{t:'Credit where it is due. {sh} gets {ag} from me, and {co} earned it.',if:function(c){return c.tone>0;},w:2}],
  grade_par:['{sh} from {co} gets {ag} from me. About what that crowd came for.','I had {sh} at {g}. Nothing wrong with it, nothing special either.',{t:'I graded {sh} {g}. A solid night, and {co} has done worse.',if:function(c){return c.tone>=0;}},{t:'I graded {sh} {g}. Middle of the road, as {co} so often is.',if:function(c){return c.tone<0;},w:2}],
  grade_down:['I graded {sh} {g}, and that crowd wanted more.','I have to be honest. {sh} gets {ag}. It came up short.',{t:'I had {sh} at {g}. Not their best, and they will know it.',if:function(c){return c.tone>0;},w:2},{t:'{sh} gets {ag} from me. I am not surprised. {co} has been coasting.',if:function(c){return c.tone<0;},w:3}],
  grade_b:[{t:'#gb_up#',if:function(c){return c.band>0;}},{t:'#gb_par#',if:function(c){return c.band===0;}},{t:'#gb_down#',if:function(c){return c.band<0;}}],
  gb_up:['I watched it twice. That is how you know.','The crowd was hot all night. That makes everybody look good.','I agree, and I hate agreeing with you.','The people in the back will be happy with that one.'],
  gb_par:['It was fine. Fine is not a bad word.','I fell asleep in the middle and woke up for the main event. So it did its job.','A television show. Not every week has to be a classic.'],
  gb_down:['The middle of that show was a long walk.','I kept checking the clock.','Somebody in the office is having a bad week.','You can feel when a crowd stops caring. They stopped caring.'],
  best:['The match of the night was {best}. {stars}.','Best thing on the show: {best}. I had it at {stars}.','{best} stole the night. {stars}, and I might go higher on a second watch.'],
  best_b:['You always go higher on a second watch.','Those two have chemistry. You cannot teach that.','That match was worked the right way. Nothing wasted.','Was it a good match, though? Yes. Yes it was.','I would have cut a minute out of the middle. Still great.','They told a story. People forget that is the job.'],
  main:['In the main event, {win} beat {lose}.','The main event went to {win} over {lose}.','{win} won the main event against {lose}.'],
  main_b:['Right result.','I would have gone the other way, but nobody asks me.','{lose} looked good in losing. That matters.','{win} needed that one.','Big win for {win}. Now do something with it.'],
  champ:['And we have a new champion. {win} won the {title}.','The {title} changed hands. {win} is the new champion.','{win} walked out with the {title}. A new champion.'],
  champ_b:['Look at {win} with the belt on the shoulder. That is a picture.','About time.','I give it three months. Prove me wrong, {win}.','The right person at the right time.','Good for {win}. I remember when nobody would book them.'],
  crowd:['{att} people were in the building for it.','The crowd was {att}.','{att} paid to get in.'],
  sellout:['A sell-out, too.','And it was sold out.'],
  post:['After the show, {n} posted this. “{t}”','{n} had something to say afterwards. “{t}”','{n} posted after the show. “{t}”'],
  post_b:['Somebody take the phone away.','I like it. Short and to the point.','They wrote that one themselves. You can tell.','The fans will love that.','That is a wrestler who knows how to stay in the news.'],
  // the other companies
  world_in:['Around the rest of the business.','Let us go around the other companies.','What else happened out there this week.'],
  world:['Over at {co}. {t}','{co} news. {t}','From {co}. {t}'],
  world_b:['Good for them.','I hear their locker room is happy right now.','Nobody watches that.','They are coming for the top spot. Watch.','I would have liked to see that one.'],
  // feuds
  feud_in:['Feud watch.','Time for the feuds.','Let us talk stories.'],
  feud_b:[{t:'#fb_hot#',if:function(c){return c.fk==='hot';}},{t:'#fb_stale#',if:function(c){return c.fk==='stale';}},{t:'#fb_new#',if:function(c){return c.fk==='new';}},{t:'#fb_end#',if:function(c){return c.fk==='end';}}],
  fb_hot:['That one has legs.','Feuds are why people buy tickets.','That is the best thing in wrestling right now.','Every week they top the last one.'],
  fb_stale:['I am tired of that one, to be honest.','The fans tell you when it is over. Listen to them.','Put it out of its misery.'],
  fb_new:['Give it a month and we will know.','I like how it started.','Early days. Do not rush it.'],
  fb_end:['A good run.','They ended it at the right time.','I will miss that one.','About time.'],
  // business
  money_in:['Some business news.','The money side.','Now the boring part. Business.'],
  money_b:['That is the boring part, everybody.','Money talks.','I only understand about half of that.','Follow the money. Always.'],
  // the rumour mill
  rum_in:['Now, the rumour mill.','A few things I am hearing.','Let us get to what people are saying behind the curtain.'],
  rum_sure:['This one is solid. {t}','I am sure of this one. {t}','You can take this to the bank. {t}'],
  rum_likely:['I am fairly sure of this. {t}','Good sources on this one. {t}','I believe this. {t}'],
  rum_thin:['This one is thin, so do not quote me. {t}','I heard this, but I have not confirmed it. {t}','Take this with a pinch of salt. {t}'],
  rum_b:['I will believe that when I see it.','You said the same thing last year.','Where do you get these?','I heard the same thing, actually.','Somebody is talking. Somebody always is.'],
  fix_ok:['An update on something we said. {t}','We called this one. {t}','Remember this? {t}'],
  fix_no:['A correction. {t}','I got one wrong, and I will say so. {t}','We have to fix one from before. {t}'],
  fix_ok_b:['Put that on your record.','Even a broken clock.','{a} will be talking about that one for weeks.'],
  fix_no_b:['There it is.','I am writing this down.','The great one gets one wrong.','Your sources need sources.'],
  // the title picture
  title_in:['The title picture in {co}.','Let us go through the champions in {co}.','Who holds the gold in {co} right now.'],
  hold:['{w} {hv} the {title}, {n} weeks now.','{w} {hs} held the {title} for {n} weeks.','{w} still {hv} the {title}. {n} weeks.'],
  hold_new:['{w} {is} the new holder of the {title}.','{w} {hv} the {title}, and it is brand new.'],
  vacant:['The {title} is vacant right now.','Nobody holds the {title} at the moment.'],
  next:['I think {c} is next in line.','{c} is the one I would book against them.','If it is not {c} next, I do not know who it is.','{c} has earned a shot.'],
  // mail
  mail_in:['Into the mailbag.','Time for your emails.','We got some mail.'],
  mail:['An email from {u}. “{t}”','From {u}. “{t}”','This one is from {u}. “{t}”','Next, {u} writes. “{t}”'],
  mail_re:['Thank you for writing.','A fair point.','I do not agree, but thank you.','Strong feelings this week.','Keep them coming.','We read every one.'],
  // picks and the scorecard
  pick:['My pick for {big}. {p} over {o}.','At {big}, I am taking {p} over {o}.','For {big}, I like {p} to beat {o}.'],
  pick_same:['Same. {p} wins.','I am with you. {p}.','No argument from me.'],
  pick_diff:['No. {o} wins it.','I am going the other way. {o}.','You are wrong. {o} takes it.'],
  score_ok:['My pick on {f} came in. That makes me {r} right and {x} wrong.','I was right about {f}. {r} and {x} on my picks now.'],
  score_no:['I got {f} wrong. That makes me {r} right and {x} wrong.','I missed on {f}. {r} and {x} now.'],
  month:[{t:'It is the end of the month, so a quick look back at {co}. What went well: {good}. What did not: {bad}.',if:function(c){return !!c.bad;}},{t:'Month in review for {co}. The good: {good}. The bad: {bad}.',if:function(c){return !!c.bad;}},{t:'It is the end of the month in {co}. {good}.',if:function(c){return !c.bad;}}],
  // sign off
  bye:['That is the show. Thank you for listening to {show}. We will be back next week.','That is all for this week. Thanks for listening, and see you next week on {show}.','We are out of time. This has been {show}. See you next week.'],
  bye_b:['Bye, everybody. Be nice to each other.','See you next week. Bring snacks.','That is it. Go outside.','Goodbye. {a} will keep talking after we stop recording.']
};
$L.GR_POD = GR_POD;

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.gramPick = gramPick;
$L.gramCase = gramCase;
$L.gram = gram;
$L.GR_SHEET = GR_SHEET;
$L.GR_WEB = GR_WEB;
$L.GR_CHAT = GR_CHAT;
$L.GR_PROMO = GR_PROMO;
$L.promoSpeech = promoSpeech;
$L.MOVES = MOVES;
$L.GR_SHAPE = GR_SHAPE;
$L.matchShape = matchShape;
$L.GR_FEUD = GR_FEUD;
$L.GR_POD = GR_POD;
