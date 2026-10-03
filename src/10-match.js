/* ---------- extension hooks: later systems plug into the match engine here ---------- */
// EFX(ctx,w) -> effort delta; MQX/CRX(ctx) -> {d,x} quality / crowd delta with an optional dirt-sheet label;
// POST(ctx) after a match is settled; SHOWX(S,P,show,rep) after a show; WEEKX(S) at week end; NEWX(S) on a new game.
var EFX=[],MQX=[],CRX=[],FINX=[],POST=[],SHOWX=[],WEEKX=[],NEWX=[],ANGX=[],EVMAKE=[],EVR={},QEND={},PREX=[];

/* ---------- match engine ---------- */
function workOf(w,stip,mins){
  var st=STIP[stip]||STIP.std,v;
  if(st.w)v=w.brawl*st.w[0]+w.tech*st.w[1]+w.speed*st.w[2];
  else{var a=[w.brawl,w.tech,w.speed].sort(function(x,y){return y-x;});v=a[0]*0.5+a[1]*0.35+a[2]*0.15;}
  if(st.hc)v=v*(1-st.hc)+(w.hc==null?w.brawl:w.hc)*st.hc;
  var comfort=6+w.stam*0.25;if(mins>comfort)v-=(mins-comfort)*0.9;
  return v;
}
function chem(S,a,b){var x=S.chemX&&S.chemX[rkey(a,b)];if(x!=null)return x;var k=S.seed+':'+rkey(a,b);return (h01('c'+k)+h01('d'+k)-1)*6;}
function addOvr(P,w,d){var cap=ovrCap(P,w);if(d>0&&w.ovr>=cap)d*=0.2;w.ovr=clamp(w.ovr+d,1,100);}
function fill(t,o){return t.replace(/\{(\w+)\}/g,function(_,k){return o[k]!=null?o[k]:'';});}

/* ---------- commentary grammar: lines are assembled from parts so calls rarely repeat ---------- */
var GR={
  bell:['There is the bell.','And we are under way.','The bell sounds, and here we go.','The referee calls for the bell.','We are off and running.'],
  open_T:['{a} takes it to the mat early and goes after {b}’s #limb#.','{a} grounds {b} with a string of holds.','{a} ties {b} up in knots in the opening minutes.','A wrestling clinic early on, and {a} is the teacher.'],
  open_B:['{a} turns it into a fight right away and brawls {b} around ringside.','{a} backs {b} into the corner and unloads.','{a} wants no part of a wrestling match. This is a scrap.','{a} clubs {b} down and stays right on top.'],
  open_H:['{a} picks up the pace early and sends {b} to the floor with a dive.','{a} flies around the ring and keeps {b} off balance.','{a} is moving at a different speed tonight.','{a} springs off the ropes and wipes {b} out.'],
  open_P:['{a} throws {b} around in the early going.','{a} shrugs off {b}’s offence and takes over with power.','{a} just tossed {b} halfway across the ring.','Pure power from {a}. {b} cannot get anything going.'],
  open_S:['{a} lights {b} up with strikes from the opening bell.','{a} and {b} trade shots, and {a} gets the better of it.','{a} is throwing bombs already.','Hard kicks from {a}. You can hear every one of them.'],
  open_E:['{a} plays to the crowd, then catches {b} off guard.','{a} stalls on the outside before taking control.','{a} is having a great time out there, and {b} is not.','{a} takes a bow, and {b} takes exception.'],
  open_A:['{a} and {b} feel each other out before {a} takes control.','{a} out-wrestles {b} in the opening minutes.','A cautious start, and {a} finds the first opening.','{a} gets the better of the early exchanges.'],
  open_multi:['It is every wrestler for themselves, and {a} is the first to find a target in {b}.','The bell rings and the ring fills with bodies. {a} goes straight for {b}.','No partners, no friends, and the referee has their hands full. {a} starts with {b}.','Everyone is a rival here. {a} and {b} collide first while the others circle.'],
  open_six:['Three against three, and the corner is a crowded place. {a} starts for their side against {b}.','A six-man tag: {a} and {b} start it, and the other four lean on the ropes.','Six bodies, two corners, one referee. {a} and {b} get things going.','{a} tags in, {b} tags out, and the crowd cannot keep track of who is legal.'],
  mid_multi:['The ring turns into a pile-up and {b} is lost in the middle of it.','Two of them spill to the floor while {a} and {b} trade near-falls, and a third breaks up the cover.','Alliances flip every thirty seconds. {b} thinks about trusting {a}, then thinks better of it.','Nobody can stay on one opponent for long. {a} is pulled off {b} twice in a minute.'],
  mid_six:['The hot tag brings the crowd up. {b} cannot reach the corner while {a} cuts the ring in half.','{a} is cut off from the corner, and the other side takes turns.','Chaos in the corner: the referee has three wrestlers on the apron and no idea who is legal.','{b} makes the tag and the whole building rises with them.'],
  limb:['arm','leg','knee','shoulder','neck'],
  mid:['{b} fights back and the two trade near-falls.','{b} cuts {a} off and slows the pace.','{b} rallies, and the momentum swings back and forth.','{b} survives a close call and fires up.','{b} catches {a} coming in and turns the tide.','Back and forth they go. Neither can keep the advantage.','{b} finds a second wind out of nowhere.'],
  near:['Cover by {b}! One, two... no! {a} kicks out!','{b} hooks the leg! One, two... {a} gets the shoulder up!','{a} goes for the finish, but {b} slips out the back!','#bigmove# from {b}! That has to be it... only a two count!','{a} thought that was three. So did I, {c}!','Shoulder up at two and nine-tenths!'],
  bigmove:['A huge clothesline','A spinning kick','A suplex out of nowhere','A dive to the floor','A knee to the jaw','A slam in the centre of the ring','A counter in mid-air'],
  late:['We are past the {mark}-minute mark and neither one will stay down.','{mark} minutes gone, and they are still throwing everything they have.','They have been at it for over {mark} minutes. Somebody has to break.'],
  q_great:['This is a classic in the making.','Remember where you were when you saw this one.','I have not seen many better than this, {p}.','They are going to be talking about this match for years.'],
  q_good:['What a match this has turned into.','These two are putting on a show.','This is why you buy a ticket.','Everything is clicking out there.'],
  q_ok:['Solid stuff from both sides.','Nothing fancy, but it is getting the job done.','A good, honest contest.','They are working hard out there.'],
  q_poor:['They are not on the same page tonight.','It has not really come together.','A few missed cues in this one, {p}.','This one is struggling to get going.'],
  q_bad:['This one is falling apart, and the crowd knows it.','I would like to say something nice. I am still thinking.','Let’s just say it is not their night.'],
  q_off:['Somebody is a step slow tonight, and it shows.','An off night for somebody in that ring.'],
  c_hot:['Listen to this crowd, {p}!','You can feel the building shaking.','They are on their feet already!','This place is electric.'],
  c_mid:['Let’s see what these two have got.','The crowd is waiting to be won over.','A decent buzz for this one.'],
  c_cold:['The fans are still finding their seats for this one.','It is quiet out here, {p}.','They are going to have to earn a reaction tonight.'],
  f_clean:['{w} hits {fin}! Cover! One, two, three!','{fin}! {w} hooks the leg... and that is it!','There it is, {fin}! One, two, three! {w} wins it!','{w} connects with {fin}. Nobody gets up from that. Three count!'],
  f_sub:['{w} locks it in the middle of the ring! {l} has nowhere to go! {l} is tapping!','{l} is fading in that hold... and the referee calls for the bell!','{w} cinches it in deep. {l} fights, fights... and taps!'],
  f_flash:['Roll-up out of nowhere! One, two, three! {w} steals it!','Small package! One, two, three! Where did that come from?','{w} counters into a cradle... and gets the three!'],
  f_cheap:['The referee did not see that! {w} with the cover... and gets the three!','A handful of tights! One, two, three! {w} gets away with it!','Feet on the ropes! The referee cannot see it! Three count!','Low blow behind the referee’s back, and {w} takes full advantage!'],
  f_interf:['Wait a minute, that is {x}! {l} is distracted, and {w} strikes from behind! One, two, three!','{x} is on the apron! {l} turns around... right into {fin}! It is over!','Here comes {x}! The referee is tied up, {l} goes down, and {w} makes the cover!'],
  f_foiled:['{x} is out here! But {w} sees it coming and sends {x} to the floor! {fin}! One, two, three!','{x} tries to get involved, and {w} wants none of it! There is {fin}, and there is the win!','Not tonight, {x}! {w} clears the ring and finishes it anyway!'],
  f_dq:['The referee has seen enough. He is calling for the bell!','{l} will not break! Four... five! That is a disqualification!','{l} has lost it completely, and the referee throws this one out!'],
  f_co:['...eight, nine, ten! {l} is counted out!','{l} cannot beat the count! This one is over!'],
  f_time:['There is the bell! We are out of time!','The time limit has expired! Neither could finish it!'],
  f_dco:['Both of them are down on the floor... nine, ten! Double count-out!','They are still brawling in the crowd, and the referee has counted them both out!'],
  r_clean:['Clean as a sheet. No excuses tonight.','You cannot argue with that one.','Decisive. That is how you make a statement.','{l} gave it everything. It was not enough.'],
  r_flash:['{l} never saw it coming.','Blink and you missed it.','It only takes three seconds, {p}.'],
  r_cheap:['A win is a win, {p}. Check the record book in the morning.','Smart, if you ask me.','{l} was robbed, and everybody in the building knows it.','Whatever it takes. That is {w} all over.'],
  r_interf:['{x} just cost {l} this match!','This is not over between {x} and {l}. Not even close.','{l} had it won until {x} showed up.'],
  r_foiled:['{x} came out here for nothing!','{w} had eyes in the back of the head tonight.'],
  r_dq:['{l} got disqualified, and I do not think {l} cares.','That is one way to keep from getting pinned.'],
  r_co:['Not the way anybody wanted this to end.','The crowd is letting them know what they think of that.'],
  r_draw:['Nothing settled tonight. They will have to do this again.','Five more minutes! That is what this crowd wants.'],
  br_start:['Eight in the ring and fists flying everywhere!','Everybody pairs off, and nobody is safe near those ropes.','It is every wrestler for themselves, {p}!','Bodies in every corner. Good luck keeping track of this one.'],
  br_elim:['{e} goes over the top and hits the floor! Gone!','{e} is dumped out! That is one fewer.','{e} hangs on... hangs on... no! Eliminated!','Three of them gang up on {e}. Over the top and out!','{e} never saw it coming. Over the top and out!','{e} skins the cat, climbs back up... and gets knocked right off the apron!'],
  br_two:['We are down to two: {w} and {l}!','Just {w} and {l} left, and both of them can barely stand.','It comes down to {l} and {w}. Listen to this place!'],
  br_final:['{l} charges, {w} ducks, and {l} goes over the top! {w} wins it!','{w} clotheslines {l} over the top rope! It is over!','{l} is teetering on the apron... and {w} knocks {l} to the floor! {w} has done it!'],
  newchamp:['We have a new champion! What a moment!','The title changes hands! Can you believe it?','A new era starts tonight!']
};
function sayPick(S,arr){
  var said=S.said||(S.said=[]),c=arr[0],i;
  for(i=0;i<5;i++){c=arr[Math.floor(rnd(S)*arr.length)];if(said.indexOf(hash(c))<0)break;}
  said.push(hash(c));if(said.length>90)said.shift();return c;
}
function expand(S,str,o,depth){
  if((depth||0)>4)return str;
  return fill(str.replace(/#(\w+)#/g,function(_,k){return GR[k]?expand(S,sayPick(S,GR[k]),o,(depth||0)+1):'';}),o);
}
function say(S,sym,o){var t=expand(S,'#'+sym+'#',o);return t.charAt(0).toUpperCase()+t.slice(1);}
var STIPLINE={hardcore:['Chairs and tables come into play.','They have found a trash can, and it is not for recycling.','Weapons everywhere. The referee can only watch.'],ladder:['Both climb, and both crash off the ladder.','Somebody just went through a ladder. I felt that from here.','Fingertips on the prize... and the ladder goes over!'],cage:['The cage itself becomes a weapon.','Face first into the steel!','Nowhere to run inside that cage.'],sub:['Each hunts for the hold that ends it.','Hold, counter, hold. Somebody is going to have to give up.'],iron:['The falls go back and forth across the half hour.','Pacing is everything in a match like this, and they both know it.']};
var CHEAP=['{w} grabs a handful of tights to steal the pin on {l}.','{w} uses the ropes for leverage and pins {l}.','A low blow behind the referee’s back lets {w} pin {l}.'];
var REACT={Interview:['Say what you like about that, it got the people talking.','Confident. Maybe too confident.'],Promo:['Strong words. Now go and back them up.','That one is going to sting.'],Brawl:['Somebody get security out here!','They cannot keep these two apart.'],Ambush:['From behind! That is how you send a message.','No warning at all. That is how it is going to be, then.'],Challenge:['Now that is a match I want to see.','The champion did not look happy about that.'],Mystery:['Who would do this? Somebody in that locker room knows something.','I have a few names in mind, {p}, and I am keeping them to myself.'],Reveal:['I do not believe it. It was right in front of us the whole time!','Of all the people. Of all the people!'],'Face-off':['Feel this building shake. Sign that match!','Neither one blinked.'],Return:['Welcome back! This place has come unglued!','Look who it is!'],Save:['A helping hand, and maybe the start of something.','The cavalry has arrived.'],Turn:['Everything just changed.','I did not see that coming, and neither did they.'],'Mind games':['That is going to play on somebody’s mind all week.','Just watching. Just letting them know.'],'Contract signing':['Has a contract signing ever ended well?','Well, the table did not survive.'],Video:['When you see it all laid out like that, you understand why they hate each other.','That is the story so far. The ending is still to be written.'],Stakes:['The stakes just went through the roof.','No going back now.'],Betrayal:['Betrayed by a friend! I feel sick, {p}.','You think you know somebody.'],Attack:['That was not wrestling. That was an assault.','We need help out here!'],Announcement:['Mark your calendar. That one is going to be special.','It is official, and it is going to be a war.']};

function pop(ws){
  var o=avg(ws.map(function(w){return w.ovr;})),f=ws[0].align==='F';
  return o>=85?(f?'the roof comes off':'deafening boos'):(o>=65?(f?'a big cheer':'loud boos'):(o>=45?(f?'a decent hand':'some jeers'):'barely a reaction'));
}
function venueFor(S,P,cap){
  var c=pick(S,P.cities||['the city']);
  return c+' '+(cap<=1000?'Armory':(cap<=2500?'Civic Auditorium':(cap<=6000?'Fieldhouse':(cap<=13000?'Coliseum':(cap<=30000?'Arena':'Stadium')))));
}
function nth(n){return ['zero','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'][n]||(n+'th');}
function weeksAgo(S,w){var d=S.week-w;return d<=0?'earlier tonight':(d===1?'last week':d+' weeks ago');}

/* the announcers remember: each candidate line carries a salience score, and the best two make the air */
function memoryLines(S,P,x){
  var L=[],all=x.all,one=x.m.mt==='1v1',a=all[0],b=all[1];
  function add(s,t){L.push({s:s+rnd(S)*1.5,x:t});}
  if(one){
    var h=S.h2h&&S.h2h[rkey(a.id,b.id)];
    if(h&&h.n){
      var lw=h.lw>=0?S.w[h.lw].name:null,wa=a.id<b.id?h.a:h.b,wb=a.id<b.id?h.b:h.a;
      if(h.n>=3)add(7,'This is the '+nth(h.n+1)+' meeting between these two. '+(wa===wb?'They are dead level.':(wa>wb?a.name:b.name)+' leads the series '+Math.max(wa,wb)+' to '+Math.min(wa,wb)+'.'));
      else add(S.week-h.w<=6?8:6,'These two met '+weeksAgo(S,h.w)+(lw?', and '+lw+' got the win.':', and nobody could win it.'));
    }
  }
  if(x.feud&&x.feud.log.length>1){var lg=x.feud.log[x.feud.log.length-1];if(S.week-lg.w<=2)add(8,'Do not forget what happened '+weeksAgo(S,lg.w)+': '+lg.t+'.');}
  if(x.feud&&x.feud.stakes)add(9,'Remember the stakes tonight: '+x.feud.stakes.toLowerCase()+'.');
  all.forEach(function(w){
    if(w.lt&&w.lt.w<S.week&&S.week-w.lt.w<=8)add(x.t&&x.t.id===w.lt.id?9.5:7,w.name+' lost the '+w.lt.n+' '+weeksAgo(S,w.lt.w)+(x.t&&x.t.id===w.lt.id?' and wants it back tonight.':' and has had a point to prove ever since.'));
    if(w.tw&&S.week-w.tw<=4)add(7,w.align==='H'?'Not long ago these fans cheered '+w.name+'. Listen to them now.':'It was not long ago they booed '+w.name+' out of the building. What a change.');
    if(w.rw&&S.week-w.rw<=2)add(7.5,'This is '+w.name+'’s first match back from injury.');
    if(w.deb)add(8.5,'This is the first time we have seen '+w.name+' in a '+P.name+' ring.');
    if(x.pre[w.id]>=4)add(6+Math.min(3,x.pre[w.id]/4),w.name+' has won '+x.pre[w.id]+' in a row coming in.');
    else if(x.pre[w.id]<=-3)add(5.5,w.name+' has dropped '+(-x.pre[w.id])+' straight and badly needs this one.');
    if(S.mystery&&S.mystery.v===w.id)add(6.5,'Still no answers on who attacked '+w.name+'.');
  });
  if(x.t&&x.champ&&!x.change){
    if(x.t.defs>=2)add(5.5,'This is title defence number '+(x.t.defs+1)+' for '+names(x.champ)+'.');
    if(S.week-x.t.since>=12)add(6,names(x.champ)+' '+(x.champ.length>1?'have':'has')+' held that title for '+(S.week-x.t.since)+' weeks.');
  }
  if(x.m.mt==='tag')x.sides.forEach(function(s){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;if(tm&&tm.exp>=70)add(4,names(s)+' have been together a long time. Watch the timing.');else if(!tm)add(4,names(s)+' have barely teamed before tonight.');});
  if(x.gap>25&&one)add(5,'On paper this is a mismatch. '+x.under+' has it all to do.');
  L.sort(function(p,q){return q.s-p.s;});
  return L.slice(0,2).map(function(l){return l.x;});
}
function callMatch(S,P,x){
  var bc=[],o=x.o,first=function(n){return String(n).split(' ')[0];};
  o.p=first(P.ann[0]);o.c=first(P.ann[1]);o.mark=x.mins>=27?'twenty-five':'fifteen';
  function ring(t){bc.push({t:'ring',x:fill(t,o)});}
  function pbp(sym){bc.push({t:'pbp',x:say(S,sym,o)});}
  function col(sym){bc.push({t:'col',x:say(S,sym,o)});}
  function raw(who,t){bc.push({t:who,x:fill(t,o)});}
  if(x.m.mt==='br'){
    var outs=x.all.filter(function(w){return w.name!==o.w&&w.name!==o.l;}).sort(function(p,q){return p.ovr-q.ovr;});
    ring('This is an over-the-top-rope battle royal'+(x.t?' for the vacant '+x.t.name:'')+'! The last one left in the ring wins.');
    bc.push({t:'ent',x:'The ring fills up: '+names(x.all)+'.'});
    raw('pbp',say(S,'bell',o)+' '+say(S,'br_start',o));
    outs.forEach(function(w,k){if(k<2||k>=outs.length-2||k===3){o.e=w.name;pbp('br_elim');}});
    col(x.MQ>=75?'q_good':(x.MQ>=55?'q_ok':'q_poor'));
    pbp('br_two');pbp('br_final');col('r_clean');
    ring('Here is your winner'+(x.t?', and NEW '+x.t.name+' champion':'')+': {w}!');
    if(x.change)pbp('newchamp');
    return bc;
  }
  ring('This '+x.mt.toLowerCase()+' match is scheduled for one fall'+(x.stipName?', and it is a '+x.stipName.toLowerCase()+' match':'')+(x.t?'. It is for the '+x.t.name+'!':'.'));
  x.sides.forEach(function(s,k){
    var isCh=x.champ&&x.champ===s,lead=s[0],big=avg(s.map(function(w){return w.ovr;}))>=62||isCh;
    ring((k===0?'Introducing first, ':(k===x.sides.length-1?'And the opponent'+(s.length>1?'s':'')+', ':'Next, '))+(isCh?'the '+x.t.name+' champion'+(s.length>1?'s':'')+', ':'')+names(s)+'!');
    bc.push({t:'ent',x:big?names(s)+' '+(s.length>1?'make their way out together':ENTR[lead.align==='F'?'F':'H'][lead.ent||0])+(isCh?', the title held high':'')+'. The reaction: '+pop(s)+'.':'The reaction: '+pop(s)+'.'});
  });
  var mem=memoryLines(S,P,x);
  if(mem[0])raw('col',mem[0]);
  else if(x.feud&&x.feud.kind==='dream')raw('col','This is the match everybody has been asking for, {p}.');
  else if(x.feud&&x.feudHeat>=60)raw('col','This has been building for weeks, {p}. Tonight somebody pays.');
  else if(x.t)raw('col','Championship gold on the line. Nobody holds anything back tonight.');
  else col(x.CR>=80?'c_hot':(x.CR>=55?'c_mid':'c_cold'));
  raw('pbp',say(S,'bell',o)+' '+say(S,GR['open_'+x.ca.style]?'open_'+x.ca.style:'open_A',o));
  if(mem[1])raw('pbp',mem[1]);
  if(STIPLINE[x.stip])raw('pbp',sayPick(S,STIPLINE[x.stip]));
  if(x.mins>8){pbp('mid');pbp('near');}
  if(x.mins>=20)pbp('late');
  col(x.bad?'q_off':(x.MQ>=88?'q_great':(x.MQ>=75?'q_good':(x.MQ>=60?'q_ok':(x.MQ>=45?'q_poor':'q_bad')))));
  if(x.mins>=14&&x.CR>=82)col('c_hot');
  var f=x.fin;
  if(f==='clean'){pbp(x.sub?'f_sub':'f_clean');col('r_clean');}
  else if(f==='flash'){pbp('f_flash');col('r_flash');}
  else if(f==='cheap'){pbp('f_cheap');col('r_cheap');}
  else if(f==='interf'){pbp('f_interf');col('r_interf');}
  else if(f==='foiled'){pbp('f_foiled');col('r_foiled');}
  else if(f==='dq'){pbp('f_dq');col('r_dq');}
  else if(f==='co'){pbp('f_co');col('r_co');}
  else{pbp(x.mins>=20?'f_time':'f_dco');col('r_draw');}
  if(x.win<0)ring('This match is a draw.');
  else ring('Here '+(x.plural?'are your winners':'is your winner')+(f==='dq'?' by disqualification':(f==='co'?' by count-out':''))+(x.change?', and NEW '+x.t.name+' champion'+(x.plural?'s':''):(x.t&&x.retain?', and STILL '+x.t.name+' champion'+(x.plural?'s':''):''))+': {w}!');
  if(x.change)pbp('newchamp');
  return bc;
}

/* Who wins? Unless the booker spends booking power to call it, the match is decided by the odds:
   overness, work rate, momentum, condition, the champion's advantage, traits, feud story logic and the house style. */
function winOdds(S,P,show,m,sides,t,champSide,feud,big,isMain){
  var st=P.style||'stars',T=st==='drama'?10:7.5,MD=modelOf(P);
  var sc=sides.map(function(s,k){
    var v=avg(s.map(function(w){
      var x=0.45*w.ovr+0.2*workRate(w)+1.2*w.mom+(w.cond-70)*0.05+(w.ws>=4?2:0)-Math.min(18,Math.max(0,w.ws-7)*0.6);
      if(st==='stars')x+=0.15*w.ovr;else if(st==='merit')x+=0.15*workRate(w)+0.6*w.mom;
      else if(st==='heroes')x+=w.align==='F'?(big?5:0):(big?0:2.5);
      if(MD.push)x+=clamp(MD.push(w,P,S),-4,4);
      if(has(w,'aura'))x+=2;if(big&&has(w,'bigmatch'))x+=2;if(isMain&&has(w,'closer'))x+=1;
      if(w.fav)x+=3;
      return x;
    }));
    if(k===champSide)v+=5-Math.min(6,(t?t.defs:0)*0.6);
    if(feud){var heel=s[0].align==='H',end=big&&feud.heat>=60;v+=st==='drama'?(end?(heel?-4:4):(heel?4:-2)):(end?(heel?-2:2):(heel?1.5:0));}
    if(m.mt==='tag'&&s[0].team!=null&&s[0].team===s[1].team){var tm=teamOf(S,s[0]);if(tm)v+=tm.exp/40;}
    return v;
  });
  var mx=Math.max.apply(null,sc);
  sides.forEach(function(s,k){if(sc[k]<mx-6&&s.some(function(w){return has(w,'giant');}))sc[k]+=3;});
  var ex=sc.map(function(v){return Math.exp((v-mx)/T);}),tot=0;ex.forEach(function(e){tot+=e;});
  var draw=sides.length>2?0:(t?0.01:0.03);
  return {p:ex.map(function(e){return e/tot*(1-draw);}),draw:draw};
}
function doMatch(S,P,show,m,i,n,rep,used){
  var isPl=P.id===S.player&&!S.cal,big=!!show.big,isMain=i===n-1;
  var sides=m.sides.map(function(ids){return ids.map(function(id){return S.w[id];});}),all=flat(sides);
  var stip=STIP[m.stip]?m.stip:'std',mins=(stip==='iron'?30:(LEN[m.len]||12))+(big?4:0)+(isMain?3:0);
  var t=m.title?titleById(P,m.title):null,champSide=-1;
  if(t&&!titleFits(t,m))t=null;
  if(t&&t.holders.length){m.sides.forEach(function(s,k){if(t.holders.every(function(h){return s.indexOf(h)>=0;}))champSide=k;});if(champSide<0)t=null;}
  var feud=null,x,y,a,b,br=m.mt==='br';
  for(x=0;x<sides.length&&!feud;x++)for(y=x+1;y<sides.length&&!feud;y++)for(a=0;a<sides[x].length&&!feud;a++)for(b=0;b<sides[y].length&&!feud;b++)feud=feudOf(S,sides[x][a].id,sides[y][b].id);
  var fx=[],FX=function(good,text){fx.push({s:good?1:-1,x:text});};
  var ctx={S:S,P:P,show:show,m:m,sides:sides,all:all,stip:stip,mins:mins,t:t,feud:feud,isMain:isMain,big:big,isPl:isPl,i:i,n:n,rep:rep,fx:fx,champSide:champSide};
  var pre={};all.forEach(function(w){pre[w.id]=w.ws;});
  // effort and performance
  var effs=[],perfs=[],bad=false;
  all.forEach(function(w){
    var e=78+(w.morale-60)*0.25+(w.cond-70)*0.2+(isMain?6:(i===0?-2:0))+(big?6:0)+w.mom*0.8+(rnd(S)*2-1)*(5+(100-w.cons)*0.15);
    EFX.forEach(function(fn){e+=fn(ctx,w)||0;});
    if(chance(S,clamp(0.045-w.cons*0.0004,0.005,0.04))){e-=25;bad=true;}
    e=clamp(e,30,100);effs.push(e);perfs.push(workOf(w,stip,mins)*(0.72+0.28*e/100));
    if(mins>6+w.stam*0.25+3)FX(false,w.name+' ran out of gas');
    if(w.cond<45)FX(false,w.name+' came in worn down');
  });
  var q=0.55*avg(perfs)+0.45*Math.max.apply(null,perfs),cs=[];
  for(x=0;x<sides.length;x++)for(y=x+1;y<sides.length;y++)sides[x].forEach(function(p){sides[y].forEach(function(o){cs.push(chem(S,p.id,o.id));});});
  var c=avg(cs)*(m.mt==='1v1'?1:0.6),tb=clamp((mins-12)*0.3,-3,4)*clamp((q-55)/30,-1,1),tx=0;
  if(m.mt==='tag')sides.forEach(function(s){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;tx+=tm?tm.exp/50+(tm.chem||0)*0.3:-1.5;});
  if(c>=2.2)FX(true,'Great chemistry between them');else if(c<=-2.2)FX(false,'No chemistry between them');
  if(tb>=2)FX(true,'Given time to tell a story');else if(tb<=-1.5)FX(false,mins<12?'Too short for workers this good':'Went too long for what they can do');
  if(tx>=2.4)FX(true,'Polished teamwork');else if(tx<=-1.5)FX(false,'Thrown-together team');
  var mq=q+c+tb+tx;
  MQX.forEach(function(fn){var r=fn(ctx);if(r){mq+=r.d;if(r.x)FX(r.d>=0,r.x);}});
  var MQ=clamp(mq,5,99);ctx.MQ=MQ;
  // crowd reaction
  var ov=all.map(function(w){return w.ovr;}),mavg=avg(all.map(function(w){return w.mom;})),cr=0.6*avg(ov)+0.4*Math.max.apply(null,ov)+mavg*0.6+(avg(all.map(function(w){return w.cha;}))-65)*0.06;
  if(mavg>=3.5)FX(true,'Hot momentum coming in');else if(mavg<=-3.5)FX(false,'Cold momentum coming in');
  if(m.mt==='1v1'){
    var d=Math.abs(ov[0]-ov[1]);if(d>25&&mins>7){cr-=(d-25)*0.3;FX(false,'A mismatch that dragged on');}
    if(all[0].twn||all[1].twn){cr+=0.5;}
    else if(all[0].align!==all[1].align){cr+=2;FX(true,'Clear face against heel');}else{cr-=3;FX(false,all[0].align==='F'?'Nobody to boo':'Nobody to cheer');}
  }else if(m.mt==='tag'||m.mt==='6man')cr+=sides[0][0].align!==sides[1][0].align?1.5:-2;
  else if(br){cr+=2;FX(true,'A ring full of bodies: the crowd loves a battle royal');}
  if(feud){
    var stale=clamp(1-0.15*Math.max(0,feud.matches-2),0.3,1),fb=Math.min(11,feud.heat*0.11)*stale*(feud.kind==='dream'?1.2:1);cr+=fb;
    if(stale<0.6)FX(false,'This feud has been to the well too often');else if(fb>=6)FX(true,'Red-hot feud');else if(fb>=2.5)FX(true,'The feud adds heat');
  }
  if(t){cr+=t.prestige*0.04;if(t.prestige>=70)FX(true,'A prestigious title on the line');if(show.rule==='all_titles'){cr+=2;FX(true,'Every title is on the line tonight');}}
  var rsk=RISK_STIP[P.risk]/RISK_STIP[P.risk0],sh=STIP[stip].heat*(feud&&feud.heat>=40?1.5:0.3)*rsk;cr+=sh;
  if(stip!=='std'){if(feud&&feud.heat>=40)FX(true,'The stipulation fits the feud');if(rep.gim&&show.rule!=='gimmick_free'&&!modelOf(P).gimFree){cr-=4;FX(false,'Second gimmick match of the night');}rep.gim=true;}
  all.forEach(function(w){if(w.ws>=6){cr+=1.5;FX(true,w.name+'’s winning streak draws interest');}if(used[w.id]){cr-=4;FX(false,w.name+' already worked tonight');}});
  if(m.mt==='1v1'){var rk=S.recent[P.id+':'+rkey(all[0].id,all[1].id)];if(rk&&S.week-rk<4&&!feud){cr-=4;FX(false,'A rematch too soon');}}
  if(rep.energy){cr+=rep.energy;if(rep.energy>=1)FX(true,'A packed, noisy house');else if(rep.energy<=-1)FX(false,'Empty seats flattened the crowd');}
  CRX.forEach(function(fn){var r=fn(ctx);if(r){cr+=r.d;if(r.x)FX(r.d>=0,r.x);}});
  var CR=clamp(cr,5,100);
  // finish: you pick the winner, the story decides how
  var od=winOdds(S,P,show,m,sides,t,champSide,feud,big,isMain),called=m.call!=null&&m.call>=-1&&m.call<sides.length,win,fin='clean',runin=null,winners=[],losers=[];
  if(called)win=m.call;
  else{var roll=rnd(S);if(roll<od.draw)win=-1;else{roll-=od.draw;win=sides.length-1;for(x=0;x<sides.length;x++){roll-=od.p[x];if(roll<=0){win=x;break;}}}}
  if(m.nc)win=-1;
  if(!(win>=0&&win<sides.length)){win=-1;fin='draw';}
  else{
    winners=sides[win];losers=flat(sides.filter(function(s,k){return k!==win;}));
    var heelWin=winners[0].align==='H';
    if(isPl&&!br)all.forEach(function(p){feudsFor(S,p.id).forEach(function(f){
      if(runin||f.kind==='dream')return;
      var rs=(f.a.indexOf(p.id)>=0?f.b:f.a).map(function(id){return S.w[id];}).filter(function(r){return all.indexOf(r)<0&&r.inj<=0&&r.promo===P.id&&!(r.away>=S.week);});
      rs=rs.concat(stableMates(S,rs,all));
      if(rs.length&&chance(S,0.10+f.heat/400+(rs.length>1?0.06:0)))runin={r:pick(S,rs),p:p,f:f};
    });});
    if(br)fin='clean';
    else if(m.ff&&FIN[m.ff])fin=m.ff;
    else if(runin)fin=losers.indexOf(runin.p)>=0?'interf':'foiled';
    else if(feud&&feud.stakes&&/disqual/i.test(feud.stakes))fin=heelWin&&chance(S,0.4)?'cheap':'clean';
    else if(heelWin&&chance(S,0.3+(hasMouthpiece(S,winners[0])?0.15:0)))fin='cheap';
    else if(!t&&!heelWin&&losers[0].align==='H'&&chance(S,0.07))fin='dq';
    else if(!t&&chance(S,0.03))fin='co';
    else if(!heelWin&&chance(S,0.08))fin='flash';
    if(fin!=='interf'&&fin!=='foiled')runin=null;
  }
  if(isPl&&!m.ff&&(fin==='cheap'||fin==='dq'||fin==='co')&&hasRule(S,'clean'))fin='clean';
  var fr=FIN[fin].r-((fin==='dq'||fin==='co')&&isMain?3:0);
  if(fin==='draw'&&mins>=20&&MQ>=80)fr=0;
  FINX.forEach(function(fn){var r=fn(ctx,fin,winners,losers,win);if(r){fr+=r.d;if(r.x)FX(r.d>=0,r.x);}});
  if(fin==='dq'||fin==='co')FX(false,'A non-finish annoyed the crowd');else if(fin==='foiled')FX(true,'The crowd loved seeing the run-in fail');else if(fin==='draw'&&fr<0)FX(false,'No winner');
  if(bad)FX(false,'Somebody had an off night');
  var ea=avg(effs);if(ea>=92)FX(true,'Everybody worked hard');else if(ea<70)FX(false,'Low effort: morale or fatigue');
  var OV=clamp(Math.round(P.wq*MQ+(1-P.wq)*CR+fr+(rnd(S)*4-2)-(bad?6:0)),5,99);
  var seg={k:'match',label:br?all.map(function(w){return w.name;}).join(', '):vsLabel(sides),mt:MT[m.mt].n,stip:stip==='std'?null:STIP[stip].n,title:t?t.name:null,mins:mins,mq:Math.round(MQ),cr:Math.round(CR),eff:Math.round(ea),ov:OV,lines:[],finish:'',notes:[],win:win>=0?names(winners):null,fin:fin,fx:fx,ids:all.map(function(w){return w.id;}),odds:od.p.map(function(p){return Math.round(p*100);}),called:called,sidesN:sides.map(names)};
  // bookkeeping
  all.forEach(function(w){w.lu=S.week;used[w.id]=(used[w.id]||0)+1;w.cond=clamp(w.cond-mins*0.45*(STIP[stip].inj>1.5?1.35:1),5,100);});
  if(m.mt==='1v1')S.recent[P.id+':'+rkey(all[0].id,all[1].id)]=S.week;
  var F=FIN[fin],qb=function(w){return clamp((OV-w.ovr)/90,-0.15,0.5);},upset=false,endedStreak=0,wAvg=0,lAvg=0;
  if(win>=0){
    wAvg=avg(winners.map(function(w){return w.ovr;}));lAvg=avg(losers.map(function(w){return w.ovr;}));
    upset=lAvg-wAvg>=15&&fin!=='dq'&&fin!=='co';
    losers.forEach(function(w){
      if(br){addOvr(P,w,qb(w));return;}
      if(w.ws>=6&&fin!=='dq'&&fin!=='co')endedStreak=Math.max(endedStreak,w.ws);
      addOvr(P,w,-0.4*clamp(1+(w.ovr-wAvg)/35,0.2,2.5)*F.lg*(big?1.3:1)+qb(w));
      w.losses++;w.ws=w.ws<0?w.ws-1:-1;w.mom=clamp(w.mom-1,-10,10);w.morale=clamp(w.morale-(F.lg>=1?1.2:0.5),0,100);
    });
    winners.forEach(function(w){
      addOvr(P,w,0.5*clamp(1+(lAvg-w.ovr)/35,0.2,2.5)*F.wg*(big?1.5:1)*(isMain?1.2:1)+qb(w)+(endedStreak?1.5:0));
      w.wins++;w.ws=w.ws>0?w.ws+1:1;w.mom=clamp(w.mom+1+(big?1:0)+(upset?2:0)+(endedStreak?2:0),-10,10);w.morale=clamp(w.morale+1.5,0,100);
      if(isPl&&w.ws>=10)award(S,'ACH_STREAK');
    });
  }else all.forEach(function(w){addOvr(P,w,qb(w));});
  // title
  var champ=t&&champSide>=0?sides[champSide]:null;
  if(t){
    t.last=S.week;t.prestige=clamp(t.prestige+(OV-t.prestige)*0.08,10,100);
    if(win>=0&&win!==champSide&&fin!=='dq'&&fin!=='co'){
      var had=t.holders.length;
      t.holders.forEach(function(id){S.w[id].lt={n:t.name,id:t.id,w:S.week};});
      t.holders=m.sides[win].slice();t.since=S.week;t.defs=0;seg.change=true;
      winners.forEach(function(w){w.mom=clamp(w.mom+2,-10,10);w.morale=clamp(w.morale+6,0,100);w.lt=null;});
      news(S,'title',names(winners)+(had?' won the ':' won the vacant ')+P.name+' '+t.name+'.');
      seg.notes.push('New champion'+(t.tag?'s':'')+': '+names(winners)+'.');
      if(isPl)award(S,had?'ACH_TITLE_CHANGE':'ACH_CROWN');
    }else{t.defs++;if(win>=0&&champSide>=0)seg.notes.push(names(sides[champSide])+' retain'+(sides[champSide].length>1?'':'s')+'.');}
  }
  // each wrestler keeps their last five results for the profile pop-up
  if(!S.cal&&!br&&win>=0)all.forEach(function(w){
    var mine=winners.indexOf(w)>=0,own=sides.filter(function(sd){return sd.indexOf(w)>=0;})[0]||[],foe=all.filter(function(o){return own.indexOf(o)<0;}).map(function(o){return o.name;}).join(' & ');
    var L=w.rr||(w.rr=[]);L.unshift({w:S.week,r:mine?'W':'L',v:foe.slice(0,40),ov:OV});if(L.length>5)L.length=5;
  });
  // injuries, growth, tag experience
  var injm=RISK_INJ[P.risk]/RISK_INJ[P.risk0]*(isPl?dif(S).inj:1)*(modelOf(P).inj||1);
  all.forEach(function(w,ix){
    var osafe=avg(all.filter(function(o){return o!==w;}).map(function(o){return o.safe;}));
    if(!S.cal&&chance(S,0.006*STIP[stip].inj*injm*(1+(mins-12)/40)*(w.cond<45?1.8:1)*(m.hurt===w.id?5:1)*(1.6-w.dur*0.012)*(1.5-osafe/100)*hurtRisk(S,P,w,m))){
      var hz=hurtZone(S,w),zz=zonesOf(w),chronic=zz[hz]>=85;
      w.inj=Math.max(1,Math.round(ri(S,2,ri(S,4,16))*(1.3-w.dur/200)*ZONES[hz].len*MED_L[P.med||0]*(chronic?1.8:1)));w.iz=hz;zz[hz]=Math.min(100,zz[hz]+12);if(chronic)w.dur=Math.max(15,w.dur-3);
      if(w.inj>=6)mile(S,w,'injury','Injured at '+show.name+' ('+ZONES[hz].n.toLowerCase()+'), out '+w.inj+' weeks');seg.notes.push(w.name+' is hurt ('+ZONES[hz].n.toLowerCase()+') and will miss about '+w.inj+' weeks.'+(chronic?' That had been coming for a while.':''));
      news(S,'injury',w.name+' ('+P.name+') is injured ('+ZONES[hz].n.toLowerCase()+'): out about '+w.inj+' weeks.');
      if(w.inj>=8)vacateFor(S,P,w,'injury');
    }
    if(workRate(w)<w.pot){w.xp+=0.06+(Math.max.apply(null,perfs)>perfs[ix]?0.1:0)+(big?0.05:0);if(w.xp>=1){w.xp-=1;w.brawl=Math.min(99,w.brawl+1);w.tech=Math.min(99,w.tech+1);w.speed=Math.min(99,w.speed+1);if(isPl)seg.notes.push(w.name+' is improving in the ring.');}}
  });
  if(m.mt==='tag')sides.forEach(function(s,k){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;if(tm){tm.exp=Math.min(100,tm.exp+2+(k===win?1:0));tm.ls=(win>=0&&k!==win)?tm.ls+1:0;if(win>=0){if(k===win)tm.w=(tm.w|0)+1;else tm.l=(tm.l|0)+1;}}});
  // feud progress
  var feudMsg=null,heatWas=feud?feud.heat:0;
  if(feud){
    feud.matches++;
    if(win>=0){if(m.sides[win].some(function(id){return feud.a.indexOf(id)>=0;}))feud.aw++;else if(m.sides[win].some(function(id){return feud.b.indexOf(id)>=0;}))feud.bw++;}
    heatUp(S,feud,5+(fin==='cheap'||fin==='interf'?5:0),(win>=0?names(winners)+' beat '+names(losers):'A draw')+(fin==='cheap'||fin==='interf'?' with a cheap finish':'')+' at '+show.name);
    if(win>=0&&(big||stip!=='std')&&feud.heat>=(show.rule==='no_turning_back'?45:60)&&fin!=='dq'&&fin!=='co')feudMsg=settleFeud(S,P,show,feud,winners,losers,isPl);
  }
  if(S.cal)return seg;
  // report text
  var lead=win>=0?winners[0]:sides[0][0],other=win>=0?losers.slice().sort(function(p,o){return br?o.ovr-p.ovr:p.ovr-o.ovr;})[0]:sides[1][0];
  var ca=chance(S,0.55)?other:lead,cb=ca===lead?other:lead,o={a:ca.name,b:cb.name,w:names(winners),l:other.name,x:runin?runin.r.name:'',fin:lead.fin?'the '+lead.fin:'the finish'};
  if(isPl){
    var mk=m.mt==='4way'||m.mt==='3way'?'multi':(m.mt==='6man'?'six':null);   // matches with more than two people read differently from singles
    seg.lines.push(say(S,mk?'open_'+mk:(GR['open_'+ca.style]?'open_'+ca.style:'open_A'),o));
    if(STIPLINE[stip])seg.lines.push(STIPLINE[stip][0]);
    if(mins>8)seg.lines.push(say(S,mk?'mid_'+mk:'mid',o));
    seg.lines.push((MQ>=88?'This is something special. ':(MQ>=75?'A very good match. ':(MQ>=60?'Solid work. ':(MQ>=45?'It never finds a rhythm. ':'It falls apart in places. '))))+(CR>=88?'The crowd is molten.':(CR>=72?'The crowd is loud throughout.':(CR>=55?'The crowd is into it.':(CR>=40?'The crowd is polite but quiet.':'The crowd sits on its hands.')))));
  }
  seg.finish=fill(br?'{w} throws {l} over the top rope and is the last one standing.':fin==='clean'?(lead.style==='T'||stip==='sub'?'{w} forces {l} to submit clean in the middle of the ring.':'{w} hits {fin} and pins {l} clean.'):
    fin==='flash'?'{w} catches {l} in a roll-up out of nowhere.':
    fin==='cheap'?pick(S,CHEAP):
    fin==='interf'?'{x} runs in and distracts {l}; {w} takes advantage for the win.':
    fin==='foiled'?'{x} tries to interfere, but {w} fights it off and wins anyway.':
    fin==='dq'?'{l} is disqualified for ignoring the referee; {w} wins by DQ.':
    fin==='co'?'{l} is counted out on the floor; {w} wins by count-out.':
    (mins>=20?'The time limit expires with neither able to put the other away.':'Both are counted out brawling on the floor.'),o);
  if(isPl){
    var srt=all.slice().sort(function(p,q){return p.ovr-q.ovr;});
    seg.bc=callMatch(S,P,{o:o,m:m,all:all,pre:pre,champ:champ,mt:MT[m.mt].n,stip:stip,stipName:stip==='std'?null:STIP[stip].n,t:t,sides:sides,feud:feud,feudHeat:heatWas,gap:srt[srt.length-1].ovr-srt[0].ovr,under:srt[0].name,CR:CR,MQ:MQ,mins:mins,ca:ca,bad:bad,fin:fin,sub:lead.style==='T'||stip==='sub',win:win,plural:winners.length>1,change:!!seg.change,retain:win>=0&&win===champSide,entrance:ctx.entrance});
    if(m.mt==='1v1'){var hk=rkey(all[0].id,all[1].id),hh=(S.h2h||(S.h2h={}))[hk]||(S.h2h[hk]={n:0,a:0,b:0,lw:-1,w:0});hh.n++;hh.w=S.week;hh.lw=win>=0?winners[0].id:-1;if(win>=0){if(winners[0].id===Math.min(all[0].id,all[1].id))hh.a++;else hh.b++;}}
    all.forEach(function(w){w.deb=false;});
  }
  if(upset)seg.notes.push('Upset: '+names(winners)+' beat a much bigger name.');
  if(endedStreak)seg.notes.push('The winning streak ends at '+endedStreak+'.');
  if(feudMsg)seg.notes.push(feudMsg);
  ctx.res={win:win,winners:winners,losers:losers,fin:fin,OV:OV,MQ:MQ,CR:CR,seg:seg,upset:upset,endedStreak:endedStreak,pre:pre};
  if(isPl){
    S.stats.matches++;if(OV>S.stats.bestMatch)S.stats.bestMatch=OV;
    if(OV>=90)award(S,'ACH_MATCH_90');if(OV>=97)award(S,'ACH_MATCH_97');
    if(win>=0&&lAvg-wAvg>=20&&fin!=='dq'&&fin!=='co')award(S,'ACH_UPSET');
    if(endedStreak)award(S,'ACH_STREAK_END');
    matchQuests(S,P,show,m,sides,win,t,OV,isMain,seg);
    if(win>=0)afterBell(S,P,show,m,sides,win,winners,losers,fin,runin,feud,t,OV,seg);
  }
  POST.forEach(function(fn){fn(ctx);});
  if(isPl)seg.notes.forEach(function(nt){if(!/^New champion|retains?\.$/.test(nt))seg.bc.push({t:'note',x:nt});});
  return seg;
}
function settleFeud(S,P,show,feud,winners,losers,isPl){
  feud.res=true;feud.end=S.week;
  var full=feud.twist&&feud.finale;
  winners.forEach(function(w){addOvr(P,w,full?3.5:2.5);w.mom=clamp(w.mom+2,-10,10);});losers.forEach(function(w){addOvr(P,w,full?1.5:1);});
  var msg='The feud between '+feudLabel(S,feud)+' is settled'+(full?' after a full story, start to finish':'')+'. Both come out of it bigger stars.';
  if(feud.stakes&&/sits out/i.test(feud.stakes)){losers.forEach(function(w){w.away=S.week+4;});msg+=' As agreed, '+names(losers)+' will sit out the next four weeks.';}
  else if(feud.stakes&&/title shot/i.test(feud.stakes)){
    var w0=winners[0],tt=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w0.g&&x.holders.length&&x.holders[0]!==w0.id&&(!x.brand||x.brand===w0.brand)&&(!tt||x.lvl>tt.lvl))tt=x;});
    if(tt&&holdLvl(P,w0.id)===0&&startFeud(S,P,w0,S.w[tt.holders[0]],40,w0.name+' earned a shot at the '+tt.name,{title:tt.id,force:true}))msg+=' '+w0.name+' has earned a shot at the '+tt.name+'.';
  }
  news(S,'story','Feud settled: '+names(winners)+' beat '+names(losers)+' at '+show.name+'.');
  if(isPl){S.stats.feudsDone++;award(S,'ACH_BLOWOFF');if(S.stats.feudsDone>=5)award(S,'ACH_FEUDS_5');}
  return msg;
}
function vacateFor(S,P,w,why,quiet){P.titles.forEach(function(t){if(t.holders.indexOf(w.id)>=0){t.holders=[];t.since=S.week;if(!quiet)news(S,'title','The '+P.name+' '+t.name+' '+(t.tag?'are':'is')+' vacated ('+w.name+': '+why+').');}});}

function afterBell(S,P,show,m,sides,win,winners,losers,fin,runin,feud,t,OV,seg){
  if(runin){
    if(fin==='interf'){heatUp(S,runin.f,8,runin.r.name+' cost '+runin.p.name+' a match');seg.notes.push(runin.r.name+' stands over '+runin.p.name+' after the bell. This is getting personal.');}
    else{heatUp(S,runin.f,5,runin.p.name+' fought off '+runin.r.name);seg.notes.push(runin.p.name+' sends '+runin.r.name+' packing.');}
    return;
  }
  // a losing team implodes
  if(m.mt==='tag'){
    var ls=sides[win===0?1:0],tm=(ls[0].team!=null&&ls[0].team===ls[1].team)?teamOf(S,ls[0]):null;
    if(tm&&(tm.ls>=2||tm.exp<25||show.rule==='betrayal')&&chance(S,show.rule==='betrayal'?0.28:0.14)){
      var att=chance(S,0.5)?ls[0]:ls[1],vic=att===ls[0]?ls[1]:ls[0];
      P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(att.id)>=0){tt.holders=[];tt.since=S.week;news(S,'title','The '+P.name+' '+tt.name+' are vacated after the champions split.');}});
      dissolveTeam(S,tm);
      if(att.align==='F')turn(S,att,'turned on '+vic.name);else if(vic.align==='H')turn(S,vic,'betrayed by '+att.name);
      startFeud(S,P,vic,att,55,att.name+' turned on partner '+vic.name,{force:true});
      seg.notes.push('After the loss, '+att.name+' turns on '+vic.name+'. The team is finished.');
      award(S,'ACH_BETRAYAL');return;
    }
  }
  var w0=winners[0],l0=losers[0];
  if(m.mt==='1v1'&&l0.align==='F'&&l0.ws<=-4&&chance(S,0.15)){
    turn(S,l0,'snapped after another loss');startFeud(S,P,w0,l0,40,l0.name+' attacked '+w0.name+' after losing again');
    l0.mom=clamp(l0.mom+3,-10,10);
    seg.notes.push(l0.name+' snaps after another loss and lays out '+w0.name+'. That is a heel turn.');return;
  }
  if(feud&&!feud.res&&l0.align==='H'&&chance(S,0.4)){
    heatUp(S,feud,7,l0.name+' attacked '+w0.name+' after the bell');
    var pt=partnerOf(S,w0),msg=l0.name+' attacks '+w0.name+' after the bell.';
    if(pt&&pt.inj<=0&&winners.indexOf(pt)<0&&feud.a.concat(feud.b).indexOf(pt.id)<0&&chance(S,0.5)){
      var side=feud.a.indexOf(w0.id)>=0?feud.a:feud.b;if(side.indexOf(pt.id)<0&&side.length<2)side.push(pt.id);
      msg+=' '+pt.name+' runs out to make the save.';
    }
    seg.notes.push(msg);return;
  }
  if(m.mt==='1v1'&&!t&&!feud&&fin!=='dq'&&fin!=='co'&&holdLvl(P,l0.id)>0&&holdLvl(P,w0.id)===0){
    var ht=null;P.titles.forEach(function(tt){if(!tt.tag&&tt.holders[0]===l0.id&&(!ht||tt.lvl>ht.lvl))ht=tt;});
    if(ht&&ht.g===w0.g&&startFeud(S,P,w0,l0,35,w0.name+' beat the champion in a non-title match',{title:ht.id})){
      seg.notes.push(w0.name+' just beat the champion and wants a shot at the '+ht.name+'.');return;
    }
  }
  if(m.mt==='1v1'&&w0.align==='F'&&l0.align==='F'&&OV>=85&&chance(S,0.35)){
    w0.morale=clamp(w0.morale+2,0,100);l0.morale=clamp(l0.morale+2,0,100);seg.notes.push('The two shake hands after the bell.');
  }
}
