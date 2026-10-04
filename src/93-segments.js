/* Promos and angles the player books, beside the matches. There is no fixed number: a show takes as many as fit in
   its time (src/97-time.js). A promo or an angle is short, medium or long (5, 10 or 15 minutes).
   A booked segment is {k: kind, who: [wrestler ids], pos: the match it comes before, len: 'S' | 'M' | 'L'}.
   The kind 'writers' hands the time to the writers, who write it on the night (genAngle).
   They live in S.segs for the show being booked (S.segKey says which show) and are cleared when it runs. */
var SEGLEN={S:5,M:10,L:15},SEGLENN={S:'Short',M:'Medium',L:'Long'};
var SEGK={
  interview:{len:'M',n:'Interview',t:'promo',roles:['Who talks'],d:'One wrestler and a microphone. Graded on how well they talk and how much the crowd cares.'},
  callout:{len:'S',n:'Call-out',t:'promo',roles:['Who speaks','Who they call out'],d:'One calls the other out. It starts a rivalry, or heats one that is already going.'},
  words:{len:'M',n:'War of words',t:'promo',roles:['One rival','The other'],d:'Two rivals trade words in the ring. It heats their feud without anyone throwing a punch.'},
  challenge:{len:'S',n:'Title challenge',t:'promo',roles:['The challenger','The champion'],d:'A challenger lays claim to the champion’s title. The feud that follows is for the belt.'},
  faceoff:{len:'S',n:'Face-off',t:'promo',roles:['One star','The other'],d:'Two stars cross paths and neither backs down. The crowd is told a big match is coming.'},
  ambush:{len:'S',n:'Ambush',t:'angle',roles:['The attacker','Who gets attacked'],d:'An attack from behind. A villain doing it starts a hot feud. A hero doing it confuses the crowd unless the feud has earned it.'},
  brawl:{len:'M',n:'Brawl',t:'angle',roles:['One rival','The other'],d:'Two rivals fight all over the building. It heats a feud fast, and now and then somebody gets a knock.'},
  save:{len:'M',n:'Save',t:'angle',roles:['Who gets attacked','Who makes the save','The attacker'],d:'One is attacked, another runs out to help, and the two shake hands. A new team is born, with an enemy.'},
  turn:{len:'M',n:'Turn',t:'angle',roles:['Who changes sides'],d:'A hero turns villain or a villain turns hero. It lands when the crowd was already leaning that way, and falls flat from nowhere.'},
  recap:{len:'S',fix:1,n:'Video recap',t:'promo',roles:['One rival','The other'],d:'A video package on a feud: how it started and where it stands. Always five minutes. It keeps the feud warm, and when it opens the show their match that night means more.'},
  writers:{len:'M',n:'Writers’ pick',t:'any',roles:[],d:'Hand the time to the writers. They write whatever tonight’s stories need: the next beat of a feud, a mystery, a surprise. You find out on the night.'}
};
function segLen(sg){var K=SEGK[sg.k];return K&&K.fix?K.len:(SEGLEN[sg.len]?sg.len:(K?K.len:'M'));}
function segMins(sg){return SEGLEN[segLen(sg)];}
/** How many promos and angles a suggested card comes with: the company's habit on weekly television, two at a big event. */
function segSlots(P,show){return show&&show.big?2:clamp(P.angles==null?2:P.angles,0,3);}
/** The segments booked for the show on the desk. Starts a fresh list when the show changes. */
function segList(S){
  var show=S.queue&&S.queue[S.qi];if(!show)return [];
  if(S.segKey!==showKey(S)){S.segs=[];S.segKey=showKey(S);}
  var L=S.segs||(S.segs=[]);for(var i=L.length-1;i>=0;i--)if(!L[i]||!SEGK[L[i].k])L.splice(i,1);
  return L;
}
/** The same list, read only (for anything that must not change the game, like the ADVANCE button). */
function segRead(S){return S.segKey===showKey(S)?(S.segs||[]).filter(function(sg){return sg&&SEGK[sg.k];}):[];}
function segPool(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?eligible(S,P,show).filter(function(w){return w.promo===P.id&&!(show.big&&isDev(P,w.brand));}):[];}
function segTitleOf(S,P,show,w){return showTitles(P,show).filter(function(t){return !t.tag&&t.holders.length&&t.holders[0]===w.id;}).sort(function(a,b){return b.lvl-a.lvl;})[0]||null;}
/** Who may fill each role of a kind, given the roles already picked. Returns one list of wrestlers per role. */
function segChoices(S,kind,who,slot){
  var K=SEGK[kind];if(!K)return [];
  var P=S.promos[S.player],show=S.queue[S.qi],pool=segPool(S),busy={};
  segList(S).forEach(function(sg,i){if(sg&&i!==slot)sg.who.forEach(function(id){busy[id]=1;});});
  var free=pool.filter(function(w){return !busy[w.id];}).sort(function(a,b){return b.ovr-a.ovr;}),a=who&&who[0]!=null?S.w[who[0]]:null,b=who&&who[1]!=null?S.w[who[1]]:null;
  var others=function(x){return free.filter(function(w){return !x||(w.id!==x.id&&w.g===x.g);});};
  if(!K.roles.length)return [];
  if(kind==='interview'||kind==='turn')return [free];
  if(kind==='words'||kind==='brawl'||kind==='recap'){
    var inF=free.filter(function(w){return feudsFor(S,w.id).some(function(f){return f.promo===P.id;});});
    return [inF,a?free.filter(function(w){return w.id!==a.id&&!!feudOf(S,a.id,w.id);}):[]];
  }
  if(kind==='challenge')return [free.filter(function(w){return true;}),free.filter(function(w){return (!a||(w.id!==a.id&&w.g===a.g))&&!!segTitleOf(S,P,show,w);})];
  if(kind==='callout'||kind==='faceoff')return [free,a?others(a):[]];
  if(kind==='ambush')return [free,a?others(a).filter(function(w){return a.team==null||w.team!==a.team;}):[]];
  if(kind==='save')return [free,a?others(a).filter(function(w){return w.team==null&&a.team==null&&w.align===a.align;}):[],a?others(a).filter(function(w){return !b||w.id!==b.id;}):[]];
  return [free];
}
/** Why a booked segment cannot run as it stands, or ''. */
function segWhy(S,sg,slot){
  var K=sg&&SEGK[sg.k];if(!K)return 'Pick what kind of segment it is.';
  var who=sg.who||[],i,C;
  for(i=0;i<K.roles.length;i++){
    if(who[i]==null||!S.w[who[i]])return 'Pick '+K.roles[i].toLowerCase()+'.';
    C=segChoices(S,sg.k,who.slice(0,i),slot)[i]||[];
    if(!C.some(function(w){return w.id===who[i];})){
      var w=S.w[who[i]];
      if(who.slice(0,i).indexOf(who[i])>=0)return w.name+' is picked twice.';
      if(!segPool(S).some(function(x){return x.id===w.id;}))return w.name+' is not available for this show.';
      if(sg.k==='words'||sg.k==='brawl'||sg.k==='recap')return i?w.name+' is not in a feud with '+S.w[who[0]].name+'. Use a call-out or an ambush to start one.':w.name+' is not in a feud.';
      if(sg.k==='challenge'&&i===1)return w.name+' does not hold a singles title that is on this show.';
      if(sg.k==='save'&&i===1)return 'The one making the save must be free of a team, like the one they save, and on the same side.';
      return w.name+' cannot fill that part of this segment. They may already be booked in another one.';
    }
  }
  return '';
}
function segMean(S,w,bonus){return 0.62*micOf(S,w)+0.38*w.ovr+(bonus||0)+(S.booker&&w.promo===S.player?S.booker.sk.creative:0);}
/** What the segment should score, before the night adds its luck: the middle of the range, and notes on what moves it. */
function segLook(S,sg,slot){
  var why=segWhy(S,sg,slot);if(why)return {ok:false,why:why};
  if(sg.k==='writers')return {ok:true,mid:null,lo:null,hi:null,notes:[[0,'The writers decide on the night']],mins:segMins(sg)};
  var P=S.promos[S.player],a=S.w[sg.who[0]],b=sg.who[1]!=null?S.w[sg.who[1]]:null,c=sg.who[2]!=null?S.w[sg.who[2]]:null,f=b?feudOf(S,a.id,b.id):null,mid=50,notes=[];
  if(sg.k==='interview'){mid=segMean(S,a,0);if(hasMouthpiece(S,a))notes.push([1,S.w[a.mgr].name+' does the talking']);}
  else if(sg.k==='callout'){mid=segMean(S,a,3);notes.push([1,f?'It heats the feud they already have':'It starts a rivalry']);if(!f&&activeFeuds(S).length>=8)notes.push([-1,'Eight feuds are running already, so no new one will start']);}
  else if(sg.k==='words'){mid=segMean(S,micOf(S,a)>=micOf(S,b)?a:b,2)+f.heat/25;notes.push([1,'A feud at '+Math.round(f.heat)+' heat']);}
  else if(sg.k==='challenge'){mid=segMean(S,micOf(S,a)>=micOf(S,b)?a:b,4);var t=segTitleOf(S,P,S.queue[S.qi],b);notes.push([1,'For the '+t.name]);if(Math.abs(a.ovr-b.ovr)>16){mid-=6;notes.push([-1,a.name+' is far from the champion’s level']);}}
  else if(sg.k==='faceoff'){mid=0.8*(a.ovr+b.ovr)/2+8;if(a.align===b.align)notes.push([1,'Two on the same side: the crowd calls it a dream match']);}
  else if(sg.k==='ambush'){mid=0.8*(a.ovr+b.ovr)/2+6;if(a.align==='F'&&!(f&&f.heat>=50)){mid-=8;notes.push([-1,'A hero attacking from behind, with no feud to earn it']);}else notes.push([1,a.align==='H'?'A villain doing what villains do':'The feud has earned it']);}
  else if(sg.k==='brawl'){mid=0.8*(a.ovr+b.ovr)/2+8+f.heat/10;notes.push([1,'A feud at '+Math.round(f.heat)+' heat']);notes.push([-1,'A small chance of a knock']);}
  else if(sg.k==='save'){mid=0.75*(a.ovr+b.ovr+c.ovr)/3+6;notes.push([1,'A new team: '+a.name+' and '+b.name]);}
  else if(sg.k==='turn'){
    var lean=(a.align==='H'&&a.mom>=4)||(a.align==='F'&&a.mom<=-4),tired=a.tw!=null&&S.week-a.tw<48;
    mid=segMean(S,a,lean?6:-14);
    notes.push(lean?[1,a.align==='H'?'The crowd is already cheering them':'A losing run gives them a reason']:[-1,'Nothing has set it up: it comes from nowhere']);
    if(tired)notes.push([-1,'They changed sides less than a year ago']);
  }
  else if(sg.k==='recap'){
    mid=42+f.heat*0.4;notes.push([1,'A feud at '+Math.round(f.heat)+' heat']);
    var onCard=(S.card||[]).some(function(m){var ids=flat(m.sides);return ids.indexOf(a.id)>=0&&ids.indexOf(b.id)>=0;});
    notes.push(onCard?[1,'They have a match tonight: open the show with this and that match gains']:[-1,'They have no match tonight, so it only keeps the feud warm']);
  }
  // how long it runs: a talker who can fill the time gains from more of it, and one who cannot is found out
  var K=SEGK[sg.k],len=segLen(sg),best=b&&K.t==='promo'?Math.max(micOf(S,a),micOf(S,b)):micOf(S,a);
  if(K.t==='promo'&&!K.fix){
    if(len==='L'){if(best>=75){mid+=3;notes.push([1,'A talker who can fill fifteen minutes',1]);}else{mid-=5;notes.push([-1,'Fifteen minutes is a long time on the microphone for them',1]);}}
    else if(len==='S'){if(best>=75){mid-=2;notes.push([-1,'Cut short: they could have done more with the time',1]);}else{mid+=1;notes.push([1,'Short and to the point',1]);}}
  }else if(K.t==='angle'){
    if(len==='L'){mid+=2;notes.push([1,'Given time to become a scene. The feud heats faster']);}
    else if(len==='S')mid-=1;
  }
  mid=clamp(Math.round(mid),5,99);
  return {ok:true,mid:mid,lo:clamp(mid-4,5,99),hi:clamp(mid+4,5,99),notes:notes,mins:segMins(sg)};
}
function segLabel(S,sg){
  var K=SEGK[sg.k],n=sg.who.map(function(id){return S.w[id]?S.w[id].name:'?';});
  if(sg.k==='interview')return n[0]+' talks';
  if(sg.k==='writers')return 'The writers’ pick';
  if(sg.k==='recap')return 'Video recap: '+n[0]+' and '+n[1];
  if(sg.k==='turn')return n[0]+' changes sides';
  if(sg.k==='callout')return n[0]+' calls out '+n[1];
  if(sg.k==='challenge')return n[0]+' challenges '+n[1];
  if(sg.k==='ambush')return n[0]+' attacks '+n[1];
  if(sg.k==='save')return n[2]+' attacks '+n[0]+', '+n[1]+' makes the save';
  return n[0]+' and '+n[1];
}
/** Run one booked segment on the night. Returns an angle record for the report. */
function runSeg(S,P,show,ctx,sg,slot,opens){
  if(segWhy(S,sg,slot)||sg.k==='writers')return null;
  var ln=segLen(sg),hm=(SEGK[sg.k].t==='angle'?(ln==='L'?1.25:(ln==='S'?0.8:1)):(ln==='S'?0.85:1))*(opens&&SEGK[sg.k].t==='angle'?1.3:1);
  var a=S.w[sg.who[0]],b=sg.who[1]!=null?S.w[sg.who[1]]:null,c=sg.who[2]!=null?S.w[sg.who[2]]:null,luck=rnd(S)*8-4,L=segLook(S,sg,slot),f=b?feudOf(S,a.id,b.id):null,r=null,nf;
  if(!L.ok)return null;
  sg.who.forEach(function(id){ctx.angled[id]=1;});
  var ov=L.mid+luck;
  if(sg.k==='interview'){
    if(ov>a.ovr)addOvr(P,a,0.25);
    r=angle('Interview',(hasMouthpiece(S,a)?S.w[a.mgr].name+' does the talking for '+a.name+', and ':a.name+' takes the microphone and ')+(ov>=75?'has the crowd in the palm of a hand.':(ov>=55?'says what needed saying.':'loses the room.')),ov);
  }else if(sg.k==='callout'){
    nf=!f;f=startFeud(S,P,b,a,24+ri(S,0,10),a.name+' called out '+b.name);
    if(f&&!nf)heatUp(S,f,clamp((ov-50)/5,2,9)*hm,a.name+' called out '+b.name);
    r=angle('Promo',a.name+' calls out '+b.name+' by name'+(f?(nf?'. '+b.name+' answers from the stage. A new rivalry begins.':'. The feud gets hotter.'):'. The words hang in the air, and nothing more comes of it tonight.'),ov);
  }else if(sg.k==='words'){
    heatUp(S,f,clamp((ov-50)/4,2,10)*hm,a.name+' and '+b.name+' traded words');
    r=angle('Promo',a.name+' and '+b.name+' stand face to face with a microphone each. '+(ov>=72?'Every line draws blood.':'It gets personal.'),ov);
  }else if(sg.k==='challenge'){
    var t=segTitleOf(S,P,show,b);nf=!f;f=startFeud(S,P,a,b,30,a.name+' challenged for the '+t.name,{title:t.id});
    if(f&&!nf){if(!f.title)f.title=t.id;heatUp(S,f,6*hm,a.name+' challenged for the '+t.name);}
    r=angle('Challenge',a.name+' interrupts '+b.name+' and lays claim to the '+t.name+'.'+(f?'':' The champion laughs it off.'),ov);
  }else if(sg.k==='faceoff'){
    nf=!f;f=startFeud(S,P,a,b,30,a.name+' and '+b.name+' faced off',a.align===b.align?{kind:'dream'}:{});
    if(f&&!nf)heatUp(S,f,6*hm,a.name+' and '+b.name+' faced off');
    r=angle('Face-off',a.name+' and '+b.name+' cross paths on the stage. Neither backs down, and the crowd wants the match.',ov);
  }else if(sg.k==='ambush'){
    nf=!f;f=startFeud(S,P,b,a,32+ri(S,0,8),a.name+' attacked '+b.name+' from behind');
    if(f&&!nf)heatUp(S,f,12*hm,a.name+' attacked '+b.name+' from behind');
    r=angle('Ambush',a.name+' attacks '+b.name+' from behind'+(a.align==='F'&&L.notes.some(function(x){return x[0]<0;})?'. The crowd does not know what to make of a hero doing that.':(nf&&f?'. A new rivalry begins.':'. This one is getting ugly.')),ov);
  }else if(sg.k==='brawl'){
    heatUp(S,f,clamp(10+(ov-60)/5,6,16)*hm,a.name+' and '+b.name+' brawled through the building');
    var hurt=chance(S,ln==='L'?0.06:0.04)?(chance(S,0.5)?a:b):null;if(hurt)hurt.cond=clamp(hurt.cond-15,5,100);
    r=angle('Brawl',a.name+' and '+b.name+' fight through the crowd and out to the loading dock. Security pulls them apart.'+(hurt?' '+hurt.name+' comes out of it with a knock.':''),ov);
  }else if(sg.k==='save'){
    formTeam(S,P,a,b,8);
    f=startFeud(S,P,a,c,20,c.name+' attacked '+a.name+'; '+b.name+' made the save');if(f&&f.a.indexOf(a.id)>=0&&f.a.length<2)f.a.push(b.id);
    news(S,'story','New team: '+a.name+' & '+b.name+'.');
    r=angle('Save',c.name+' attacks '+a.name+' after an interview. '+b.name+' runs out to make the save, and the two shake hands. A new team is born.',ov);
  }else if(sg.k==='recap'){
    heatUp(S,f,3,'A video package told the story of '+a.name+' and '+b.name);
    r=angle('Video recap','A video package tells the story of '+a.name+' and '+b.name+': how it started, and what is at stake.',ov);
  }else if(sg.k==='turn'){
    var was=a.align;turn(S,a,was==='H'?'the crowd got behind them':'turned on the fans');
    if(L.notes[0][0]>0){if(was==='H')addOvr(P,a,2);else a.mom=clamp(a.mom+3,-10,10);}else a.mom=clamp(a.mom-2,-10,10);
    r=angle('Turn',was==='H'?a.name+' turns away from the villains'+(L.notes[0][0]>0?', and the crowd that has been cheering for weeks roars.':'. The crowd is not sure what to make of it.'):a.name+' turns on the fans'+(L.notes[0][0]>0?' after weeks of losses, and walks out to boos.':'. Nobody saw a reason for it.'),ov);
  }
  if(r){r.booked=sg.k;r.ids=sg.who.slice();if(f&&f.id!=null)r.feud=f.id;}
  return r;
}
/** Tonight's booked segments, grouped by the match they come before. Called by runShow for the player's shows. */
function segBooked(S,show,n){
  var out={count:0,at:{}};if(S.cal||!n)return out;
  if(S.segKey!==showKey(S))return out;
  (S.segs||[]).forEach(function(sg,i){
    if(!sg||!SEGK[sg.k]||segWhy(S,sg,i))return;
    var p=clamp(sg.pos|0,0,n-1);(out.at[p]||(out.at[p]=[])).push({sg:sg,slot:i});out.count++;
  });
  return out;
}

/* ---------- what the booking screen calls ---------- */
E.SEGK=SEGK;
E.SEGLEN=SEGLEN;E.SEGLENN=SEGLENN;
/** The promos and angles booked for the show on the desk, in the order they were booked. slot is the place in the list. */
E.segInfo=function(S){
  var show=S.queue[S.qi];if(!show)return {list:[],booked:0,mins:0};
  var L=segList(S),mins=0;
  var list=L.map(function(sg,i){
    var why=segWhy(S,sg,i),look=why?null:segLook(S,sg,i),K=SEGK[sg.k];mins+=segMins(sg);
    return {slot:i,k:sg.k,t:K.t,who:sg.who.slice(),pos:sg.pos|0,len:segLen(sg),mins:segMins(sg),label:why?K.n:segLabel(S,sg),why:why,look:look};
  });
  return {booked:L.length,list:list,mins:mins};
};
E.segChoices=function(S,kind,who,slot){return segChoices(S,kind,who||[],slot==null?-1:slot).map(function(L){return L.map(function(w){return w.id;});});};
E.segLook=function(S,sg,slot){return segLook(S,sg,slot==null?-1:slot);};
/** Book, change or remove a segment. A slot past the end of the list (or -1) adds a new one. sg null removes it. */
E.setSeg=function(S,slot,sg){
  var L=segList(S),isNew=slot==null||slot<0||slot>=L.length;
  if(!sg){if(isNew)return {ok:true,msg:'Nothing was booked there.'};L.splice(slot,1);return {ok:true,msg:'That segment is off the show.'};}
  var K=SEGK[sg.k];if(!K)return {ok:false,msg:'Pick what kind of segment it is.'};
  var clean={k:sg.k,who:(sg.who||[]).slice(0,K.roles.length).map(function(x){return +x;}),pos:Math.max(0,sg.pos|0),len:K.fix?K.len:(SEGLEN[sg.len]?sg.len:K.len)},why=segWhy(S,clean,isNew?-1:slot);
  if(why)return {ok:false,msg:why};
  if(isNew)L.push(clean);else L[slot]=clean;
  var lk=segLook(S,clean,isNew?L.length-1:slot),mins=segMins(clean);
  return {ok:true,slot:isNew?L.length-1:slot,msg:clean.k==='writers'?'Booked: '+mins+' minutes for the writers.':'Booked: '+segLabel(S,clean)+', '+mins+' minutes. It should be about '+starG(lk.mid)+'.'};
};
/** Take every promo and angle off the show on the desk. */
E.segClear=function(S){var L=segList(S);L.length=0;return {ok:true,msg:'The run sheet is clear.'};};
/** Add sensible segments: the hottest feud first, then a champion who needs a challenger, then the best talker.
    `max` is how many to add (one unless told). `card` is the card they sit on (the draft card unless told). */
E.segSuggest=function(S,max,card){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return {ok:false,msg:'No show to book.'};
  var L=segList(S),n=Math.max(1,(card||S.card||[]).length),made=0,i;if(max==null)max=1;
  var used=function(){var u={};L.forEach(function(sg){sg.who.forEach(function(id){u[id]=1;});});return u;};
  var tryPut=function(sg){if(!segWhy(S,sg,-1)){L.push(sg);made++;return true;}return false;};
  for(i=0;i<max;i++){
    var u=used(),pool=segPool(S).filter(function(w){return !u[w.id];}),inPool={};pool.forEach(function(w){inPool[w.id]=1;});
    var pos=L.length%2===0?Math.min(1,n-1):n-1,done=false;
    var fs=activeFeuds(S).filter(function(f){return f.promo===P.id&&inPool[f.a[0]]&&inPool[f.b[0]];}).sort(function(x,y){return y.heat-x.heat;});
    if(fs.length)done=tryPut({k:fs[0].heat>=45?'brawl':'words',who:[fs[0].a[0],fs[0].b[0]],pos:pos,len:'M'});
    if(!done){
      var champs=pool.filter(function(w){return segTitleOf(S,P,show,w)&&!inFeud(S,w.id);}).sort(function(x,y){return y.ovr-x.ovr;});
      for(var c=0;c<champs.length&&!done;c++){
        var ch=champs[c],cs=pool.filter(function(w){return w.id!==ch.id&&w.g===ch.g&&holdLvl(P,w.id)===0&&!inFeud(S,w.id)&&Math.abs(w.ovr-ch.ovr)<=16;}).sort(function(x,y){return (y.ovr+y.mom*2)-(x.ovr+x.mom*2);});
        if(cs.length)done=tryPut({k:'challenge',who:[cs[0].id,ch.id],pos:pos,len:'S'});
      }
    }
    if(!done){var tk=pool.slice().sort(function(x,y){return segMean(S,y,0)-segMean(S,x,0);})[0];if(tk)done=tryPut({k:'interview',who:[tk.id],pos:pos,len:'M'});}
    if(!done)break;
  }
  return {ok:made>0,msg:made?(made===1?'One segment pencilled in: '+segLabel(S,L[L.length-1])+'.':made+' segments pencilled in.')+' Change it, or take it off.':'Nobody is free for another segment.'};
};
/* a card cannot run with a booked segment that no longer works (someone got hurt, a feud ended) */
(function(){
  var v0=E.validate,r0=E.runPlayerShow;
  E.validate=function(S,card){
    var v=v0(S,card);
    if(S.segKey===showKey(S))(S.segs||[]).forEach(function(sg,i){if(!sg||!SEGK[sg.k])return;var why=segWhy(S,sg,i);if(why)v.errors.push('Booked '+SEGK[sg.k].n.toLowerCase()+': '+why+' Change it or take it off the show.');});
    return v;
  };
  E.runPlayerShow=function(S,card){var r=r0(S,card);if(!r.errors){S.segs=[];S.segKey=null;}return r;};
})();
