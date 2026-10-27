// @ts-nocheck
/* Moved from src/94-livefeed.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.crowdWord = crowdWord; $L.liveFeed = liveFeed;
/* The live feed: what people post while your show is on the air (Ryan, 19 October: the broadcast's right side is "a
   twitter like feed, and below the crowd meter"). Fans, the wrestlers in the show, the company's own account and the
   press post as the show goes: a match starting, a near fall, a finish, a new champion, a promo or an angle, and the
   crowd itself. It only reads the report as far as the broadcast has shown it, and every pick is a hash of stable
   values (h01), never rnd(S), so the feed can never change how a show plays out. A new kind of post is one more
   block in liveFeed() and a line list below. */
export var LF={
  start:['{a} vs {b}. Here we go!!','{a} and {b} right now. Locked in.','been waiting all week for {a} vs {b}','{a} vs {b} on {show}. lets go','ok {a} vs {b}, I am watching'],
  feud:['{a} and {b} cannot stand each other and it SHOWS','this {a}/{b} thing is personal now','{a} vs {b}. finish it tonight please','the {a} {b} feud is the best thing going'],
  title:['the {t} is on the line!!!','{t} match. this is the big one','title match time. {a} or {b}?'],
  near:['HOW DID {x} KICK OUT','{x} WAS DONE. THAT WAS THREE','2.9!!! I am out of my chair','nearly!!! the whole place jumped','i thought that was it. {x} is unreal','NO NO NO. still going'],
  win:['{w} wins it!','{w} gets the win. deserved','{w}!!!! yes!!!','{l} could not hang with {w} tonight','called it. {w}.','clean win for {w}. respect'],
  upset:['WHAT. {w} BEAT {l}???','UPSET!!! nobody had {w} winning that','{l} lost to {w}?? i need a minute','biggest upset of the year. {w}!!'],
  champ:['NEW CHAMPION!!! {w}!!!!','{w} with the {t}. I am crying','AND NEW. {w}. history.','{w} is the champ!!! what a night'],
  retain:['{w} keeps the {t}. still the champ','and still... {w}','{w} survives. {t} stays put'],
  promo:['{a} on the mic is must see','{a} cooked. no notes','that promo from {a} gave me chills','{a} talking. everybody shut up','{a} said what everybody was thinking'],
  angle:['WHAT did {a} just do to {b}','{a} is out of control','oh {a} is EVIL for that','{b} did not see that coming. neither did i','this is going to be ugly. {a} vs {b} has to happen'],
  dead:['this crowd is asleep','awful quiet in there tonight','can we get a reaction please','the building is dead. not their fault'],
  hot:['listen to this crowd!!!','the building is SHAKING','best crowd of the year easily','you can hear them from outside'],
  winF:['Thank you, {city}. That one was for you.','Told you I would do it. Done.','Listen to that crowd. I will never get used to it.'],
  winH:['Nobody in that building is on my level.','Boo all you like. Same result.','That was a lesson, not a fight.'],
  lose:['Not my night. It will not happen twice.','I heard the count. I will be back.','No excuses. Run it back.'],
  taunt:['{b}, that was only the start.','I warned you, {b}.','Look at my face, {b}. Does it look sorry?'],
  hurt:['You will pay for that, {a}.','Cheap. Even for you, {a}.','I am not done with you, {a}.']
};
$L.LF = LF;
export var LF_PRESS='The Ringside Wire';
$L.LF_PRESS = LF_PRESS;
/** The crowd in a word, from how loud the building is (0 to 100). */
export function crowdWord(v){return v<20?'Dead':(v<38?'Quiet':(v<55?'Warm':(v<70?'Loud':(v<85?'Electric':'Unglued'))));}
/** What the feed shows when the broadcast is at segment `si`, beat `b` (b past the end means its result is up). */
export function liveFeed(S,rep,si,b){
  var out=[],P=S.promos[rep.promo||S.player]||S.promos[S.player],key0=(rep.week||S.week)+':'+(rep.id||rep.name)+':',city=rep.venue?String(rep.venue).split(',').pop().trim().replace(/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/,''):'everybody';
  var at=0,show=rep.name;
  function nm(id){var w=S.w[id];return w?w.name:'';}
  function fan(k,i){var f=$L.FANS[Math.floor($L.h01(k+'f'+i)*$L.FANS.length)%$L.FANS.length];return f[0];}
  function post(k,kind,u,n,txt,base,wid,mins){out.push({id:k,k:kind,u:u,n:n,t:txt,l:$L.netLikes(base,k),r:Math.round($L.netLikes(base,k+'r')/6),w:wid==null?null:wid,at:mins});}
  function fanPost(k,list,o,base,mins){var u=fan(k,0);post(k,'f','@'+u,u,$L.fill($L.netPickH(list,k+'t'),o),base||90,null,mins);}
  for(var i=0;i<=si&&i<rep.segs.length;i++){
    var s=rep.segs[i],bc=s.bc||[],upto=i<si?bc.length:Math.min(b,bc.length),done=i<si||b>=bc.length,k=key0+i,mins=Math.round(at);
    if(s.k==='match'){
      var ids=s.ids||[],nsd=(s.sidesN||[]).length||2,per=Math.max(1,Math.floor(ids.length/nsd)),A=s.sidesN&&s.sidesN[0]||nm(ids[0]),B=s.sidesN&&s.sidesN[1]||nm(ids[per]);
      var f=ids.length>=2?$L.feudOf(S,ids[0],ids[per]):null;
      fanPost(k+'s',s.title?$L.LF.title:(f&&f.heat>=50?$L.LF.feud:$L.LF.start),{a:A,b:B,t:s.title,show:show},s.title?260:120,mins);
      for(var j=0;j<upto;j++)if(bc[j].h===1&&$L.h01(k+'n'+j)<0.75){var x='';ids.forEach(function(id){var w=S.w[id];if(w&&!x&&bc[j].x&&bc[j].x.indexOf(w.name)>=0)x=w.name;});fanPost(k+'n'+j,$L.LF.near,{x:x||'they'},220,mins+Math.round((s.mins||10)*j/Math.max(1,bc.length)));}
      if(done&&s.win){
        var wi=(s.wi&&s.wi.length?s.wi:[]),lid=ids.filter(function(id){return wi.indexOf(id)<0;})[0],W=S.w[wi[0]],Lw=S.w[lid],L=lid!=null?nm(lid):B,end=mins+(s.mins||10);
        var up=W&&Lw&&Lw.ovr-W.ovr>=12;
        fanPost(k+'w',s.change?$L.LF.champ:(up?$L.LF.upset:(s.title?$L.LF.retain:$L.LF.win)),{w:s.win,l:L,t:s.title},s.change?900:(up?520:160),end);
        if(W&&(s.change||i===rep.segs.length-1||$L.h01(k+'ww')<0.35))post(k+'wp','w',$L.netHandle(W.name),W.name,$L.fill($L.netPickH(W.align==='H'?$L.LF.winH:$L.LF.winF,k+'wpt'),{city:city}),W.ovr*W.ovr*0.9,W.id,end);
        if(Lw&&$L.h01(k+'lp')<0.3)post(k+'lp','w',$L.netHandle(Lw.name),Lw.name,$L.netPickH($L.LF.lose,k+'lpt'),Lw.ovr*Lw.ovr*0.5,Lw.id,end);
        if(s.ov!=null&&(i===rep.segs.length-1||s.ov>=70||$L.h01(k+'pr')<0.4))post(k+'pr','p',$L.netHandle($L.LF_PRESS),$L.LF_PRESS,(s.label||A+' vs '+B)+': '+$L.starG(s.ov)+'.',600,null,end);
        if(s.cr!=null&&$L.h01(k+'cr')<0.5)fanPost(k+'cr',s.cr>=75?$L.LF.hot:(s.cr<35?$L.LF.dead:$L.LF.start),{a:A,b:B,show:show},110,end);
      }
    }else{
      var who=(s.ids&&s.ids.length?s.ids:(s.bids||[])),a=nm(who[0]),bb=nm(who[1]);
      if(done&&a){
        var isA=s.booked?($L.SEGK[s.booked]&&$L.SEGK[s.booked].t==='angle'):/Ambush|Brawl|Attack|Betrayal|Turn|Save|Reveal/.test(s.head||'');
        fanPost(k+'g',isA&&bb?$L.LF.angle:$L.LF.promo,{a:a,b:bb},isA?300:150,mins+(s.mins||5));
        var Aw=S.w[who[0]],Bw=S.w[who[1]];
        if(isA&&Aw&&Bw&&$L.h01(k+'gt')<0.6)post(k+'gt','w',$L.netHandle(Aw.name),Aw.name,$L.fill($L.netPickH($L.LF.taunt,k+'gtt'),{b:Bw.name}),Aw.ovr*Aw.ovr*0.7,Aw.id,mins+(s.mins||5));
        if(isA&&Aw&&Bw&&$L.h01(k+'gh')<0.4)post(k+'gh','w',$L.netHandle(Bw.name),Bw.name,$L.fill($L.netPickH($L.LF.hurt,k+'ght'),{a:Aw.name}),Bw.ovr*Bw.ovr*0.6,Bw.id,mins+(s.mins||5));
      }
    }
    at+=s.mins||(s.k==='match'?12:6);
  }
  if(P&&si>=rep.segs.length-1&&b>=((rep.segs[rep.segs.length-1]||{}).bc||[]).length&&rep.segs.length)post(key0+'co','c',$L.netHandle(P.name),P.full||P.name,'Thank you, '+city+'. See you next week.',P.image*P.image*1.5,null,Math.round(at));
  return out.reverse();   // the newest first
}
/** The feed and the crowd for the broadcast at segment `si`, beat `b`: {posts, crowd: {v, word}}. */
$L.E.liveFeed=function(S,rep,si,b){
  if(!rep||!rep.segs)return {posts:[],crowd:{v:50,word:$L.crowdWord(50)}};
  var s=rep.segs[Math.max(0,Math.min(si,rep.segs.length-1))],bc=(s&&s.bc)||[],done=s&&b>=bc.length;
  // how loud the building is: the night's energy, lifted by a big moment on screen, and the match's own crowd once it is over
  var v=rep.en==null?60:rep.en;if(s&&s.k==='match'&&done&&s.cr!=null)v=0.5*v+0.5*s.cr;
  var hb=s&&bc[Math.min(b,bc.length-1)];if(hb&&hb.h)v=Math.min(100,v+(hb.h>1?25:12));
  v=$L.clamp(Math.round(v),0,100);
  return {posts:si<0?[]:$L.liveFeed(S,rep,si,b),crowd:{v:v,word:$L.crowdWord(v)}};
};

/* ---------- the poster for the next show (the desk) ----------
   Who headlines it, so the desk can show them face to face: the main event once the card is booked, else the hottest
   story on the roster, else the champion and the closest challenger. Only reads the game. */
$L.E.posterPair=function(S){
  var P=S.promos[S.player],sh=S.queue&&S.queue[S.qi];if(!P||!sh)return null;
  var card=S.card||[],m=card.length?card[card.length-1]:null;
  if(m&&m.sides&&m.sides.length>=2&&m.sides[0].length&&m.sides[1].length)return {a:m.sides[0][0],b:m.sides[1][0],why:'main',title:m.title?($L.titleById(P,m.title)||{}).name||null:null};
  var fs=$L.activeFeuds(S).filter(function(f){return f.promo===P.id&&!f.res&&S.w[f.a[0]]&&S.w[f.b[0]];}).sort(function(x,y){return y.heat-x.heat;});
  if(fs.length)return {a:fs[0].a[0],b:fs[0].b[0],why:'feud',title:fs[0].title?($L.titleById(P,fs[0].title)||{}).name||null:null};
  var t=P.titles.filter(function(t){return !t.tag&&t.holders.length&&S.w[t.holders[0]];}).sort(function(x,y){return (y.lvl||0)-(x.lvl||0);})[0];
  if(t){var c=S.w[t.holders[0]],ch=$L.rosterOf(S,P.id).filter(function(w){return w.id!==c.id&&w.g===c.g&&w.inj<=0;}).sort(function(x,y){return y.ovr-x.ovr;})[0];if(ch)return {a:c.id,b:ch.id,why:'title',title:t.name};}
  var top=$L.rosterOf(S,P.id).filter(function(w){return w.inj<=0;}).sort(function(x,y){return y.ovr-x.ovr;});
  return top.length>=2?{a:top[0].id,b:top[1].id,why:'top',title:null}:null;
};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.LF = LF;
$L.LF_PRESS = LF_PRESS;
$L.crowdWord = crowdWord;
$L.liveFeed = liveFeed;
