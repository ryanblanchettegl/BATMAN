/* ===== The text grammar: procedurally written lines for the newsletter, the websites and the chat room =====
   A small grammar engine in the manner of Tracery, with Improv's idea that a line may only be used when it is true
   of the world. A rule set maps a symbol to its choices; "#sym#" in a choice expands that symbol, "{key}" fills in a
   value from the context, and "#sym.cap#" or "#sym.up#" changes its case. A choice is a string, or {t, if, w}: `if`
   is a function of the context that must hold, `w` a weight (1 if left out). Every pick comes from h01() on a key, so
   the same week writes the same words, and nothing here ever draws on rnd(S): words never change how a game plays. */
function gramPick(L,ctx,key){
  var ok=[],tot=0;
  for(var i=0;i<L.length;i++){var c=L[i];if(typeof c==='string'){ok.push({t:c,w:1});tot+=1;}else if(!c.if||c.if(ctx)){var w=c.w==null?1:c.w;ok.push({t:c.t,w:w});tot+=w;}}
  if(!ok.length)return '';
  var r=h01(key)*tot;for(var j=0;j<ok.length;j++){r-=ok[j].w;if(r<0)return ok[j].t;}
  return ok[ok.length-1].t;
}
function gramCase(s,m){if(m==='cap')return s.charAt(0).toUpperCase()+s.slice(1);if(m==='up')return s.toUpperCase();if(m==='low')return s.toLowerCase();return s;}
/** Expand `start` in rule set R with context ctx. key makes the picks repeatable; depth stops runaway rules. */
function gram(R,start,ctx,key,depth){
  depth=depth||0;var n=0;
  var src=R[start]?gramPick(R[start],ctx,key+'|'+start):start;
  if(depth>8)return src;
  return src.replace(/#(\w+)(?:\.(\w+))?#/g,function(_,sym,mod){n++;return gramCase(gram(R,sym,ctx,key+'|'+n+sym,depth+1),mod);})
    .replace(/\{(\w+)\}/g,function(_,k){return ctx[k]!=null?String(ctx[k]):'';});
}

/* ---------- the newsletter ---------- */
var GR_SHEET={
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

/* ---------- the websites on Wrestle Search ---------- */
var GR_WEB={
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

/* ---------- the chat room ---------- */
var GR_CHAT={
  line:[
    {t:'#chat_hot#',if:function(c){return c.band>0;},w:3},
    {t:'#chat_bad#',if:function(c){return c.band<0;},w:3},
    {t:'#chat_par#',if:function(c){return c.band===0;},w:3},
    {t:'#chat_best#',if:function(c){return !!c.best;},w:2},
    {t:'#chat_win#',if:function(c){return !!c.win&&!!c.lose;},w:2},
    {t:'#chat_new#',if:function(c){return !!c.champ;},w:3}
  ],
  chat_hot:['{show} was awesome!!!','anybody else see {show}?? wow','{show} = show of the year so far','ok {co} is on fire right now','that crowd was LOUD tonight','i take back everything i said about {co}'],
  chat_bad:['{show} put me to sleep lol','{co} needs a new booker','why do i keep watching {co}','{show} was rough. real rough','zzzzzz','who books this stuff'],
  chat_par:['{show} was ok i guess','not bad from {co} tonight','{show} was fine. nothing special','decent show, slow middle'],
  chat_best:['{best} stole the show','did you see {best}?? unreal','{best} was the only thing worth watching','rewinding {best} right now'],
  chat_win:['cant believe {win} beat {lose}','{win} over {lose} was the right call','{lose} got robbed!!!','{win} {win} {win}!!!!','{lose} fans in shambles'],
  chat_new:['NEW CHAMPION!!! {champ}!!!','{champ} with the belt. finally','{champ} as champ? not sure about that','about time {champ} got the gold','{champ} wont hold it a month, watch']
};
