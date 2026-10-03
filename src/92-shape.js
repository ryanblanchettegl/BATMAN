/* ---------- The shape of a show ----------
   How a card is laid out matters as much as what is on it. These are the old rules of the booking office, each one a
   small push on the crowd that the report names in plain words:
     1. Open hot. The first match sets the mood, and the next two feel it.
     2. Peaks and valleys. Not two of the same thing back to back; a promo or an angle lets the crowd breathe.
     3. The biggest match goes on last (the biggest names, the top title, the hottest feud), with time to work, and
        not straight after a war.
     4. Mix the finishes. The third dirty finish of a night means nothing, and a clean sweep for one side kills the room.
     5. Send them home happy from a big event; leave them wanting more on weekly television.
   Every company's shows follow the same rules, the rivals' and the sample shows that set expectations included, and the
   automatic card (autoBook) lays its cards out by them. So a well-shaped card is what the crowd expects, and the player
   gains by shaping better and loses by ignoring it.
   The show rating already weighs position: the main event counts three times, the match before it twice, the opener
   one and a half times (src/30-show.js). E.shape() tells the player all of this before the show. */
var SH_HOT=70,SH_SLOW=58;
function shIds(m){return flat(m.sides).filter(function(id){return id!=null;});}
/** What the running order cares about in one match of a card. Null when the match is not filled in yet. */
function shFacts(S,P,m){
  var ids=shIds(m),ws=ids.map(function(id){return S.w[id];}).filter(function(w){return !!w;});
  if(ws.length<2||ws.length!==flat(m.sides).length)return null;
  var t=m.title?titleById(P,m.title):null,heat=0,x,y,f;
  for(x=0;x<ws.length;x++)for(y=x+1;y<ws.length;y++){f=feudOf(S,ws[x].id,ws[y].id);if(f&&f.heat>heat)heat=f.heat;}
  var star=avg(ws.map(function(w){return w.ovr;})),top=shTopLvl(P);
  // how big a match is: the names in it, the title on the line, the heat of the feud
  return {pace:avg(ws.map(function(w){return (w.speed+w.stam)/2;})),star:star,len:m.len||'M',mt:m.mt,stip:m.stip&&m.stip!=='std'?m.stip:null,
    lvl:t?t.lvl:0,heat:heat,size:star+(t?(t.lvl>=top&&!t.tag?5:1.5):0)+Math.min(5,heat/15)};
}
/** How an opener reads: 1 hot, -1 too long, -2 too slow, 0 fine. */
function shOpener(f){return f.len==='L'?-1:(f.pace>=SH_HOT?1:(f.pace<SH_SLOW?-2:0));}
function shTopLvl(P){var l=0;P.titles.forEach(function(t){if(!t.tag&&t.lvl>l)l=t.lvl;});return l;}
var SH_MT={tag:'tag matches','6man':'six-man tags','4way':'four-way matches',br:'battle royals'};
function shPrev(rep){for(var k=rep.segs.length-1;k>=0;k--)if(rep.segs[k].k==='match')return rep.segs[k];return null;}
function shBreak(rep){var l=rep.segs[rep.segs.length-1];return !!l&&l.k!=='match';}

/* every match remembers what the running order needs to know about it */
POST.push(function(ctx){var f=shFacts(ctx.S,ctx.P,ctx.m);if(f)ctx.res.seg.sh={pace:Math.round(f.pace),size:Math.round(f.size*10)/10,len:f.len,mt:f.mt,i:ctx.i};});

/* 1. the opener, and the mood it leaves behind */
CRX.push(function(ctx){
  if(ctx.n<3)return null;var f=shFacts(ctx.S,ctx.P,ctx.m);if(!f)return null;
  if(ctx.i===0){var o=shOpener(f);return o>0?{d:1.5,x:'A fast opener woke the building up'}:(o===-1?{d:-2,x:'A long opener: the crowd was not ready to sit through it'}:(o===-2?{d:-1.5,x:'A slow opener: the building took a while to wake up'}:null));}
  if(ctx.i>2||ctx.isMain||!ctx.rep)return null;
  var op=ctx.rep.segs.filter(function(s){return s.k==='match';})[0];if(!op||!op.sh)return null;
  var tone=shOpener({len:op.sh.len,pace:op.sh.pace})+(op.fin==='dq'||op.fin==='co'||op.fin==='draw'?-1:0)+(op.wi&&op.wi.length&&ctx.S.w[op.wi[0]]&&ctx.S.w[op.wi[0]].align==='F'&&op.fin!=='dq'&&op.fin!=='co'?0.5:0);
  return tone>=1?{d:1,x:'The opener had them up'}:(tone<=-1?{d:-1,x:'Still flat after the opener'}:null);
});
/* 2. peaks and valleys: the same thing twice in a row, with nothing in between */
CRX.push(function(ctx){
  if(ctx.i===0||!ctx.rep||shBreak(ctx.rep))return null;var p=shPrev(ctx.rep);if(!p||!p.sh)return null;
  if((ctx.m.len||'M')==='L'&&p.sh.len==='L'&&!ctx.isMain)return {d:-2,x:'Two long matches back to back'};
  if(ctx.m.mt!=='1v1'&&ctx.m.mt===p.sh.mt)return {d:-1.5,x:'Two '+(SH_MT[ctx.m.mt]||'matches of the same kind')+' in a row'};
  return null;
});
/* 3. the main event: the biggest match of the night, given time, and not straight after a war */
CRX.push(function(ctx){
  if(!ctx.isMain||ctx.n<3||!ctx.rep)return null;var f=shFacts(ctx.S,ctx.P,ctx.m);if(!f)return null;
  var ms=ctx.rep.segs.filter(function(s){return s.k==='match'&&s.sh;}),big=0;ms.forEach(function(s){if(s.sh.size>big)big=s.sh.size;});
  if(big>f.size+3)return {d:-2.5,x:'The biggest match of the night was not on last'};
  if(f.len==='S')return {d:-2,x:'Too short to feel like a main event'};
  var p=shPrev(ctx.rep);
  if(p&&!shBreak(ctx.rep)&&p.ov>=85&&p.mins>=12)return {d:-1.5,x:'It had to follow a great match with no break'};
  if(shBreak(ctx.rep)&&ms.some(function(s){return s.ov>=80;}))return {d:0.8,x:'The crowd caught its breath before the main event'};
  return null;
});
/* 4 and 5. finishes across the night, and how the show ends */
FINX.push(function(ctx,fin,winners,losers,win){
  var rep=ctx.rep;if(!rep||ctx.n<3)return null;var sh=rep.shf||(rep.shf={dirty:0,f:0,h:0});
  var dirty=fin==='cheap'||fin==='interf'||fin==='dq'||fin==='co',heel=win>=0&&winners.length&&winners[0].align==='H',face=win>=0&&winners.length&&winners[0].align==='F',out=null;
  if(dirty)sh.dirty++;
  if(dirty&&sh.dirty>=3)out={d:-2,x:'Another dirty finish: by now it meant nothing'};
  else if(ctx.isMain){
    if(heel&&sh.h>=3&&!sh.f)out={d:-2,x:'The heels won all night. Nobody had anything to cheer'};
    else if(face&&sh.f>=4&&!sh.h)out={d:-1,x:'The faces won everything. Nobody was ever in danger'};
    else if(ctx.big&&face&&!dirty)out={d:1,x:'The crowd went home happy'};
    else if(!ctx.big&&ctx.feud&&(heel||fin==='interf')&&fin!=='dq'&&fin!=='co'){
      if(ctx.isPl)ctx.S.hype=(ctx.S.hype||0)+0.03;
      out={d:0.5,x:'A cliffhanger: they will be back next week to see it answered'};
    }
  }
  if(heel)sh.h++;else if(face)sh.f++;
  return out;
});

/** Lay an automatic card out by the rules: the biggest match closes, the best opener the undercard has goes on first,
    and no two long matches or two multi-person matches of the same kind sit together. Uses no random numbers. */
function shapeAuto(S,P,card){
  var n=card.length;if(n<4)return;
  var best=-1,bs=-99,i,F=card.map(function(m){return shFacts(S,P,m);}),bg=n-1;
  if(F[n-1]){for(i=0;i<n-1;i++)if(F[i]&&F[i].size>F[bg].size)bg=i;// the names in the main event also sell the tickets (runShow), so a match only moves up if its names are close to as big
    if(bg!==n-1&&F[bg].size>F[n-1].size+3&&F[bg].star>=F[n-1].star-3){var mv=card.splice(bg,1)[0],was=card[card.length-1];card.push(mv);if(was.len==='L'&&!was.title)was.len='M';mv.len='L';}}
  best=-1;
  for(i=0;i<n-2;i++){var m=card[i],f=shFacts(S,P,m);if(!f||m.title||m._q||m.stip&&m.stip!=='std')continue;var sc=(f.len==='L'?-20:0)+f.pace+(m.mt==='1v1'?2:0);if(sc>bs){bs=sc;best=i;}}
  if(best>0){var op=card.splice(best,1)[0];card.unshift(op);}
  if(card[0].len==='L'&&!card[0].title)card[0].len='M';
  var k,t;
  for(i=1;i<n-2;i++)if(card[i].mt!=='1v1'&&card[i].mt===card[i-1].mt){for(k=i+1;k<n-2;k++)if(card[k].mt!==card[i].mt){t=card[i];card[i]=card[k];card[k]=t;break;}}
  // a shorter match goes between two long ones (the last two may both be long: that is the top of the card)
  for(i=n-2;i>=2;i--)if(card[i].len==='L'&&card[i-1].len==='L'){for(k=i-2;k>=1;k--)if(card[k].len!=='L'){t=card.splice(k,1)[0];card.splice(i-1,0,t);break;}}
}

/** For the booking screen: what each spot on the card is for, and how this card reads against the rules. */
E.shape=function(S,card){
  var P=S.promos[S.player],show=S.queue[S.qi],n=card.length,F=card.map(function(m){return shFacts(S,P,m);}),notes=[],roles=[];
  var add=function(s,t){notes.push({s:s,t:t});};
  for(var i=0;i<n;i++)roles.push(n<3?'':(i===n-1?'Main event':(i===0?'Opener':(i===n-2&&n>=4?'Semi-main':''))));
  if(!show||n<3)return {roles:roles,notes:notes,ready:false};
  var seg={};(S.segs||[]).forEach(function(x){if(x)seg[Math.max(0,Math.min(x.pos,n-1))]=1;});
  if(F[0]){var o=shOpener(F[0]);add(o>0?1:(o<0?-1:0),o>0?'A fast opener. It will wake the building up, and the next two matches gain from it.':(o===-1?'The opener is a long match. Open with something short and quick, and save the long ones for later.':(o===-2?'The opener is slow. Put your quickest workers on first.':'The opener is fine. A quicker pair would start the show hotter.')));}
  for(i=1;i<n;i++){
    if(!F[i]||!F[i-1]||seg[i])continue;
    if(F[i].len==='L'&&F[i-1].len==='L'&&i!==n-1)add(-1,'Matches '+i+' and '+(i+1)+' are both long. Put a short match, a promo or an angle between them.');
    else if(F[i].mt!=='1v1'&&F[i].mt===F[i-1].mt)add(-1,'Matches '+i+' and '+(i+1)+' are the same kind. Split them up.');
  }
  if(card.filter(function(m){return m.stip&&m.stip!=='std';}).length>=2&&show.rule!=='gimmick_free'&&!modelOf(P).gimFree)add(-1,'More than one gimmick match. The second one loses its punch.');
  var M=F[n-1];
  if(M){
    var big=0,bi=-1;F.forEach(function(f,k){if(f&&k<n-1&&f.size>big){big=f.size;bi=k;}});
    if(big>M.size+3)add(-1,'Match '+(bi+1)+' is a bigger match than the main event. The biggest match goes on last: the biggest names, the top title, the hottest feud.');else add(1,'The biggest match is on last.');
    if(M.len==='S')add(-1,'The main event is short. Give it time.');
    if(seg[n-1])add(1,'A promo or an angle sits before the main event. The crowd gets a breather.');
    else if(F[n-2]&&F[n-2].len==='L')add(0,'A long match runs straight into the main event. If it is a great one, the main event has to follow it with no break.');
  }
  return {roles:roles,notes:notes,ready:F.every(function(f){return !!f;})};
};
/** The rules, for the guide window. */
E.SHAPE_GUIDE=[
  {n:'Open hot',d:'The first match sets the mood for the night. Put quick workers on first and keep it short. A fast opener lifts itself and the next two matches. A long or slow one drags them down.'},
  {n:'Peaks and valleys',d:'A crowd cannot shout all night. Do not put two long matches, or two matches of the same kind, back to back. A promo or an angle between two big matches gives everybody a breather.'},
  {n:'The biggest match goes on last',d:'The main event is what they paid for: the biggest names, the top title, or the hottest feud. It counts three times in the show’s rating, the match before it counts twice, and the opener one and a half times. If a bigger match runs earlier, the main event suffers.'},
  {n:'Give the main event time',d:'A short main event does not feel like one. And do not make it follow a war: if the match before it is a great one, put a promo or an angle in between.'},
  {n:'One gimmick match a night',d:'A cage or a ladder is special once. The second gimmick match of the night falls flat.'},
  {n:'Mix the finishes',d:'A clean win means something. The third dirty finish in one night means nothing. If the heels win everything, or the faces do, the room goes quiet.'},
  {n:'Send them home happy, or wanting more',d:'A big event should end with the crowd on its feet: a face winning clean. Weekly television can end on a cliffhanger. A heel getting the better of a feud in the last match brings more people back next week.'}
];
