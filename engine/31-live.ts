/* Moved from src/31-live.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, ENTR, MT, STIP, avg, clamp, feudOf, feudsFor, flat, h01, names, rosterOf, starG, startFeud, titleById, turn, vsLabel } from './00-core';
import { CRX, MQX, POST, PREX, pop } from './10-match';
import { showEnd, showStart, showStep } from './30-show';
$L.liveMatch = liveMatch; $L.liveLater = liveLater; $L.livePut = livePut; $L.liveIntro = liveIntro; $L.afterBellText = afterBellText; $L.liveMax = liveMax; $L.liveMake = liveMake; $L.livePre = livePre; $L.livePost = livePost; $L.liveFinish = liveFinish; $L.livePlay = livePlay;
/* ---------- The live show ----------
   The player's show is not worked out in one go. It goes on the air (E.liveBegin), and then runs one step at a time
   (E.liveNext): a promo, an angle, a match. Between steps, and in the middle of a match, the show can stop for a
   call from the gorilla position. The booker answers on the headset (E.liveDecide) and the night carries on with
   that answer built into it. Nobody knows how a match ends until it has run, the booker included.

   A call is CAUSED, never a flat chance: each kind looks at what is true of the next step (who is in it, how they
   feel about each other, whose title is on the line, whose rival is in the building) and offers itself if it fits.
   Every answer says what it does to the match, to the people in it (relBump, youRemember, so they remember and the
   notification bar reports it), to the feuds and titles, and to the booker.

   S.live = { key, card, st, n, cnt, ev, pend, had, post }   // all plain data: a show on the air can be saved
     card  the card as it stood at the bell (a copy; calls change this copy)
     st    the show's own state between steps (src/30-show.js)
     ev    the call waiting for an answer, or the last one answered
     pend  an answered call that the next segment should carry in its commentary
   A new kind of call is one entry in LIVEK: pre(S, L, step) or post(S, L, step, seg) returns the call or null,
   run(S, L, ev, choice) applies the answer and returns one line saying what happened. */
export var LIVE_MAX_TV=3,LIVE_MAX_BIG=4,LIVE_HM_CD=8,LIVEK: any={},LIVE_ORDER=['chaos','titlecall','runin','hotmic'],LIVE_POST=['face','afterbell'];
$L.LIVE_MAX_TV = LIVE_MAX_TV; $L.LIVE_MAX_BIG = LIVE_MAX_BIG; $L.LIVE_HM_CD = LIVE_HM_CD; $L.LIVEK = LIVEK; $L.LIVE_ORDER = LIVE_ORDER; $L.LIVE_POST = LIVE_POST;
/* calls change a match through fields on it (m.call, m.ff, m.runin, m.nc) and through m.lx: [{cr, mq, x, note}] */
CRX.push(function(ctx){var L=ctx.m.lx,d=0,x=null;if(!L)return null;L.forEach(function(e){if(e.cr){d+=e.cr;x=x||e.x;}});return d?{d:d,x:x}:null;});
MQX.push(function(ctx){var L=ctx.m.lx,d=0,x=null;if(!L)return null;L.forEach(function(e){if(e.mq){d+=e.mq;if(!e.cr)x=x||e.x;}});return d?{d:d,x:x}:null;});
POST.push(function(ctx){var L=ctx.m.lx;if(!L||ctx.S.cal)return;L.forEach(function(e){if(e.note)ctx.res.seg.notes.unshift(e.note);});});

export function liveMatch(S,L,i){var m=L.card[i],c=m?$L.matchSetup(S,m):null;return c?{m:m,c:c,ids:flat(m.sides),n:L.card.length,main:i===L.card.length-1}:null;}
export function liveLater(L,i){var o={};for(var q=i+1;q<L.card.length;q++)flat(L.card[q].sides).forEach(function(id){o[id]=1;});return o;}
export function livePut(m,e){(m.lx=m.lx||[]).push(e);}
/** The ring introductions for a match, before anything has been decided: what the booker watches while the call comes in. */
export function liveIntro(S,P,show,m,i,n){
  var c=$L.matchSetup(S,m),bc=[];if(!c)return bc;
  if(m.mt==='br'){bc.push({t:'ring',x:'This is an over-the-top-rope battle royal! The last one left in the ring wins.'});bc.push({t:'ent',x:'The ring fills up: '+names(flat(c.sides).filter(function(w){return w.id!==m.surpId;}))+'.'});if(m.surpId!=null&&S.w[m.surpId])bc.push({t:'ent',h:1,x:'Wait, that music! '+S.w[m.surpId].name+' is here, and nobody knew. The surprise entrant is in the ring!'});}
  else{
    var stip=STIP[m.stip]&&m.stip!=='std'?STIP[m.stip].n:null;
    bc.push({t:'ring',x:'This '+MT[m.mt].n.toLowerCase()+' match is scheduled for one fall'+(stip?', and it is a '+stip.toLowerCase()+' match':'')+(c.t?'. It is for the '+c.t.name+'!':'.')});
    c.sides.forEach(function(s,k){
      var isCh=c.t&&k===c.champSide,lead=s[0],big=avg(s.map(function(w){return w.ovr;}))>=62||isCh;
      bc.push({t:'ring',x:(k===0?'Introducing first, ':(k===c.sides.length-1?'And the opponent'+(s.length>1?'s':'')+', ':'Next, '))+(isCh?'the '+c.t.name+' champion'+(s.length>1?'s':'')+', ':'')+names(s)+'!'});
      bc.push({t:'ent',side:s.map(function(x){return x.id;}),x:big?(s.length===1&&lead.look&&lead.look.entrance_fx&&lead.look.entrance_fx.music?'"'+lead.look.entrance_fx.music+'" hits, and ':'')+names(s)+' '+(s.length>1?'make their way out together':ENTR[lead.align==='F'?'F':'H'][lead.ent||0])+(isCh?', the title held high':'')+'. The reaction: '+pop(s)+'.':'The reaction: '+pop(s)+'.'});
    });
  }
  bc.push({t:'pbp',x:'The bell sounds, and this one is under way.'});
  return bc;
}

/* ---------- the kinds of call ---------- */
/* the old headset calls (the lights, the power, a real fight, a riot, a bad landing): now they come up in their match */
export var CHAOS_SAFE={lights:1,shoot:0,riot:1,ko:0,power:1};
$L.CHAOS_SAFE = CHAOS_SAFE;
LIVEK.chaos={n:'Trouble on the air',free:true,
  pre:function(S,L,step){
    var ch=S.chs;if(step.t!=='match'||!ch||ch.done||ch.key!==L.key||ch.mi!==step.i||!ch.choices)return null;
    var text=ch.text.replace(/^Match \d+(, the main event)?: /,'');
    return {phase:'mid',mi:step.i,text:text.charAt(0).toUpperCase()+text.slice(1),why:[],choices:ch.choices.map(function(x){return {n:x};}),checks:ch.checks||null,safe:$L.CHAOS_SAFE[ch.type]||0};
  },
  run:function(S,L,ev,c){var b0=$L.showClock(S,L.card).total,r=E.resolveChaos(S,L.card,c);L.st.rep.slack=(L.st.rep.slack||0)+Math.max(0,b0-$L.showClock(S,L.card).total);return r||'The moment passes.';}
};
/* a title match the crowd believes in: the finish is still the booker's to call */
LIVEK.titlecall={n:'The title is on the line',
  pre:function(S,L,step){
    if(step.t!=='match')return null;var M=liveMatch(S,L,step.i);if(!M||!M.c.t||M.c.champSide<0||M.m.call!=null||M.m.nc||M.m.ff||M.c.sides.length!==2)return null;
    var t=M.c.t,cs=M.c.champSide,ch=M.c.sides[cs],co=M.c.sides[1-cs],f=M.c.feud,reign=S.week-(t.since||0),why=[],show=S.queue[S.qi];
    if(reign>=20)why.push(names(ch)+' '+(ch.length>1?'have':'has')+' held the '+t.name+' for '+reign+' weeks');
    if(f&&f.heat>=50)why.push('The feud is at '+Math.round(f.heat)+' heat');
    if(show.big&&f)why.push('It is a big event, and the feud wants an ending');
    if(co[0].align==='F'&&ch[0].align==='H'&&co[0].mom>=3)why.push('The crowd is behind '+names(co));
    if(S.owner&&!S.owner.me&&S.quests.some(function(q){return q.type==='o_belt'&&q.title===t.id&&co.some(function(w){return w.id===q.w;});}))why.push(S.owner.name+' wants the '+t.name+' on '+names(co));
    if(!why.length)return null;
    return {phase:'mid',mi:step.i,who:co[0].id,other:ch[0].id,side:1-cs,
      text:'The building believes tonight is the night. '+names(co)+' '+(co.length>1?'have':'has')+' '+names(ch)+' in trouble, and the referee is looking at you.',why:why,safe:0,
      choices:[{n:'Stay with the plan',says:'The match plays out on the odds.'},
        {n:'Call the title change',bp:2,says:'New champion'+(co.length>1?'s':'')+' tonight. The crowd gets what it wants. '+names(ch)+' will remember who made the call.'},
        {n:'Protect the champion with a disqualification',bp:1,says:names(ch)+' '+(ch.length>1?'keep':'keeps')+' the title on a dirty finish. The crowd will hate it, and the feud gets hotter.'}]};
  },
  run:function(S,L,ev,c){
    var M=liveMatch(S,L,ev.mi),P=S.promos[S.player];if(!M||!M.c.t)return 'The moment passes.';
    var t=M.c.t,cs=M.c.champSide,ch=M.c.sides[cs],co=M.c.sides[1-cs],f=M.c.feud;
    if(c===1){
      M.m.call=1-cs;livePut(M.m,{cr:3,x:'The crowd got the title change it had been waiting for'});
      ch.forEach(function(w){$L.youRemember(S,w,'tookbelt','You took the '+t.name+' off them with a call from the headset.',-15);});
      co.forEach(function(w){$L.youRemember(S,w,'gavebelt','You called the title change on the night. They will not forget who believed in them.',15);});
      $L.rankFor(S,P,t,3).filter(function(w){return co.indexOf(w)<0;}).slice(0,2).forEach(function(w){$L.relBump(S,w.id,co[0].id,{ja:12},{k:'passed',t:w.name+' watched '+co[0].name+' get the '+t.name+' on a call from the headset.'});});
      return 'The referee gets the word. '+names(co)+' '+(co.length>1?'are':'is')+' going over, and the '+t.name+' changes hands tonight.';
    }
    if(c===2){
      M.m.call=1-cs;M.m.ff='dq';if(f)$L.heatUp(S,f,8,names(ch)+' kept the '+t.name+' by getting disqualified');
      co.forEach(function(w){$L.youRemember(S,w,'robbed','You had the champion disqualified to keep the title off them.',-6);});
      return names(ch)+' '+(ch.length>1?'get':'gets')+' disqualified on purpose and '+(ch.length>1?'keep':'keeps')+' the title. The building is furious, which is the point.';
    }
    return 'The plan stands. Whatever happens, happens.';
  }
};
/* a rival is in the building and not booked: send them out, or keep them in the back */
LIVEK.runin={n:'A rival at the curtain',
  pre:function(S,L,step){
    if(step.t!=='match')return null;var M=liveMatch(S,L,step.i);if(!M||M.m.mt==='br'||M.c.sides.length!==2||M.m.ff||M.m.how||M.m.nc||M.m.runin)return null;
    var P=S.promos[S.player],later=liveLater(L,step.i),best=null;
    M.ids.forEach(function(id){feudsFor(S,id).forEach(function(f){
      if(f.promo!==P.id||f.kind==='dream'||f.heat<40||(f.ro!=null&&S.week-f.ro<2))return;
      var rs=(f.a.indexOf(id)>=0?f.b:f.a).map(function(x){return S.w[x];}).filter(function(r){return r&&M.ids.indexOf(r.id)<0&&!later[r.id]&&!L.st.used[r.id]&&r.inj<=0&&r.promo===P.id&&!(r.away>=S.week)&&!r.camp;});
      if(rs.length&&(!best||f.heat>best.f.heat))best={p:S.w[id],r:rs[0],f:f};
    });});
    if(!best)return null;
    var p=best.p,r=best.r,side=M.m.sides[0].indexOf(p.id)>=0?0:1;best.f.ro=S.week;
    return {phase:'mid',mi:step.i,who:r.id,other:p.id,feud:best.f.id,side:side,
      text:r.name+' is standing at the curtain in street clothes, watching '+p.name+' on the monitor. '+r.name+' looks at you and waits.',
      why:[r.name+' and '+p.name+' are feuding ('+Math.round(best.f.heat)+' heat)',r.name+' is not booked tonight'],safe:0,
      choices:[{n:'Keep '+r.name+' in the back',says:'The match plays out as booked. The feud gets nothing tonight.'},
        {n:'Send '+r.name+' out to cost '+p.name+' the match',bp:1,says:p.name+' loses on the interference. The feud gets much hotter. '+p.name+' may not thank you.'},
        {n:'Send '+r.name+' out, and '+p.name+' fights them off',bp:1,says:p.name+' wins and looks strong. The feud gets a little hotter.'}]};
  },
  run:function(S,L,ev,c){
    var M=liveMatch(S,L,ev.mi),p=S.w[ev.other],r=S.w[ev.who];if(!M||!p||!r)return 'The moment passes.';
    if(c===0){M.m.norun=1;return r.name+' stays in the back. '+p.name+' never knows how close it was.';}
    M.m.runin={r:r.id,p:p.id,f:ev.feud};L.st.used[r.id]=(L.st.used[r.id]||0);
    if(c===1){
      M.m.call=1-ev.side;M.m.ff='interf';
      if(p.align==='F'&&p.mom>=2)$L.youRemember(S,p,'screwed','You sent '+r.name+' out to cost them a match they were winning.',-8);
      $L.youRemember(S,r,'used','You sent them out when it mattered. They felt part of the show.',6);
      return r.name+' hits the ring behind the referee’s back. '+p.name+' never sees it coming.';
    }
    M.m.call=ev.side;M.m.ff='foiled';
    $L.youRemember(S,p,'strong','You let them fight off '+r.name+' and win anyway.',8);
    return r.name+' comes down the ramp, and '+p.name+' is ready. The plan is for '+p.name+' to stand tall.';
  }
};
/* a promo goes off the script, about someone the speaker has real trouble with */
LIVEK.hotmic={n:'Off the script',
  pre:function(S,L,step){
    if(step.t!=='seg'||!step.sg||!step.sg.who||!step.sg.who.length)return null;
    var K=$L.SEGK[step.sg.k];if(!K||K.t!=='promo'||K.fix||step.sg.k==='faceoff')return null;
    var w=S.w[step.sg.who[0]],P=S.promos[S.player];if(!w)return null;
    var o=null,ob=-45;rosterOf(S,P.id).forEach(function(x){if(x.id===w.id||x.nw||x.inj>0||step.sg.who.indexOf(x.id)>=0)return;var b=$L.bondOf(S,w.id,x.id);if(b<=ob){ob=b;o=x;}});
    if(!o)return null;
    var cd=S.lcd&&S.lcd['hm'+w.id];if(cd!=null&&S.week-cd<$L.LIVE_HM_CD)return null;
    var why=[w.name+' and '+o.name+(ob<=-$L.REL_STRONG?' have real heat':' do not get on')],hot=false;
    if(w.morale<55){why.push(w.name+'’s morale is low');hot=true;}
    if($L.youLean(S,w)<0){why.push(w.name+' has not forgotten what you did');hot=true;}
    if($L.jealOf(S,w.id,o.id)>=40){why.push(w.name+' is jealous of '+o.name);hot=true;}
    if(ob<=-70)hot=true;
    if(!hot)return null;
    var mc=$L.micOf(S,w);(S.lcd=S.lcd||{})['hm'+w.id]=S.week;
    return {phase:'mid',si:L.st.k,who:w.id,other:o.id,label:w.name+': '+K.n,
      intro:[{t:'ent',x:w.name+' is in the ring with the microphone.'},{t:'pbp',x:'Hold on. This is not what we were told was coming.'}],
      text:w.name+' has stopped reading the script. This is about '+o.name+' now, and it is not a storyline. The truck is asking if you want the microphone cut.',why:why,safe:0,
      choices:[{n:'Cut the microphone',says:'The segment dies on the spot. '+w.name+' will be furious. '+o.name+' will be grateful.'},
        {n:'Let them talk',says:(mc>=70?'It could be the best thing on the show. ':'It may not even be good television. ')+'What '+w.name+' says about '+o.name+' cannot be taken back, and '+o.name+' will know you let it air.'}]};
  },
  run:function(S,L,ev,c){
    var w=S.w[ev.who],o=S.w[ev.other],P=S.promos[S.player],step=L.st.steps[ev.si];if(!w||!o||!step)return 'The moment passes.';
    if(c===0){
      step.sg.mod=-20;w.morale=clamp(w.morale-8,0,100);
      $L.youRemember(S,w,'cutmic','You cut their microphone on live television.',-15);
      $L.youRemember(S,o,'covered','You cut the microphone when '+w.name+' went after them.',8);
      return 'The microphone goes dead mid-sentence. '+w.name+' throws it down and walks out.';
    }
    step.sg.mod=clamp(Math.round(($L.micOf(S,w)-55)/1.5),-6,30);
    $L.relBump(S,w.id,o.id,{bond:-45,rb:-20},{k:'shoot',by:w.id,keep:true,t:w.name+' went off the script about '+o.name+' on live television.'});
    $L.youRemember(S,o,'aired','You let '+w.name+' say it on the air.',-20);
    rosterOf(S,P.id).forEach(function(x){if(x.id!==w.id&&x.id!==o.id&&$L.bondOf(S,o.id,x.id)>=30)$L.relBump(S,w.id,x.id,{bond:-8},{k:'sided',t:x.name+' took '+o.name+'’s side after what '+w.name+' said on the air.'});});
    var f=w.g===o.g?startFeud(S,P,o,w,38,w.name+' went off the script about '+o.name):null;
    return w.name+' says all of it. The building goes quiet, then very loud.'+(f?' '+o.name+' will want an answer in the ring.':'');
  }
};
/* after a big match: how does it go off the air? */
/** What the headset says when the bell has gone, from what just happened. Picked by a hash, never the random stream. */
export function afterBellText(S,w,l,seg,M,f,t){
  var k=S.week+':'+w.id+':'+l.id,pk=function(L){return L[Math.floor(h01(k)*L.length)%L.length];},W=w.name,L=l.name,o;
  if(seg.change)o=[W+' has the gold, and '+L+' is still in the ring staring at it. The cameras are rolling. What now?',W+' is the new champion. '+L+' has not left. What do you want the last picture to be?'];
  else if(seg.title)o=[W+' keeps the '+seg.title+'. '+L+' is still down on the mat. What happens now?','Still champion. '+W+' holds the '+seg.title+' up, and '+L+' is watching from the corner. What now?'];
  else if((seg.notes||[]).some(function(n){return /^Upset/.test(n);}))o=[W+' has beaten '+L+', and nobody saw it coming. '+L+' looks like they want to break something. What now?','The upset is in. '+L+' cannot believe it, and neither can the crowd. Where do you take it?'];
  else if(f&&!f.res)o=['The bell has gone, but this feud is not finished. '+W+' won tonight. '+L+' is getting up. What happens now?',W+' takes this round. '+L+' is already looking for the next one. What now?'];
  else if(seg.ov>=85)o=['The crowd will not sit down. '+W+' beat '+L+' in that one, and both are still out there. What now?','That was something special. '+W+' and '+L+' are both on their knees. What is the last thing they see?'];
  else o=['The bell has gone. '+W+' has beaten '+L+', and the cameras are still on them. What happens now?',W+' gets the win over '+L+'. The show has a minute to fill. What do you want in it?'];
  return pk(o);
}
LIVEK.afterbell={n:'After the bell',
  post:function(S,L,step,seg){
    if(step.t!=='match'||!seg||seg.k!=='match'||!seg.wi||seg.wi.length!==1||seg.ids.length!==2)return null;
    var M=liveMatch(S,L,step.i),P=S.promos[S.player];if(!M)return null;
    var w=S.w[seg.wi[0]],l=S.w[seg.ids[0]===w.id?seg.ids[1]:seg.ids[0]],f=feudOf(S,w.id,l.id);
    if(!w||!l||seg.fin==='dq'||seg.fin==='co'||seg.fin==='draw')return null;
    if(!(M.main||seg.ov>=85||(f&&f.heat>=55&&!f.res)))return null;
    var t=P.titles.filter(function(x){return !x.tag&&x.holders.length&&x.holders[0]===w.id;}).sort(function(a,b){return b.lvl-a.lvl;})[0];
    var busy=liveLater(L,step.i),c=t?$L.rankFor(S,P,t,6).filter(function(x){return x.id!==l.id&&!busy[x.id]&&!feudOf(S,x.id,w.id)&&!(x.away>=S.week);})[0]:null;
    var why=[];if(M.main)why.push('It is the last thing people will see tonight');if(seg.ov>=85)why.push('The crowd is on its feet after '+starG(seg.ov));if(f&&!f.res)why.push('The feud is at '+Math.round(f.heat)+' heat');
    var ch: any=[{n:M.main?'Fade out on '+w.name+' celebrating':'Go to the next thing',says:'Nothing more. The result speaks for itself.'},
      {n:'They shake hands',says:'Respect between them, and the crowd likes it. Any feud between them cools.'},
      {n:l.name+' attacks '+w.name,says:(f&&!f.res?'The feud gets hotter. ':'A feud starts tonight. ')+(l.align==='F'?l.name+' turns on the crowd to do it.':'It is what the crowd expects of '+l.name+'.')}];
    if(c)ch.push({n:c.name+' walks out and points at the title',who:c.id,title:t.id,says:'A new feud for the title starts tonight: '+c.name+' against '+w.name+'.'});
    return {phase:'post',si:L.st.rep.segs.indexOf(seg),mi:step.i,who:w.id,other:l.id,text:afterBellText(S,w,l,seg,M,f,t),why:why,safe:0,choices:ch};
  },
  run:function(S,L,ev,c){
    var w=S.w[ev.who],l=S.w[ev.other],P=S.promos[S.player],f=feudOf(S,w.id,l.id),pick=ev.choices[c];
    if(c===1){
      $L.relBump(S,w.id,l.id,{bond:14,ra:8,rb:8},{k:'respect',t:w.name+' and '+l.name+' shook hands in the ring after their match.'});
      if(f&&!f.res)$L.heatUp(S,f,-10,w.name+' and '+l.name+' shook hands');
      S.rateMod=(S.rateMod||0)+0.3;w.morale=clamp(w.morale+2,0,100);l.morale=clamp(l.morale+3,0,100);
      return l.name+' offers a hand. '+w.name+' takes it, and the building stands for both of them.';
    }
    if(c===2){
      var was=l.align;if(was==='F')turn(S,l,'attacked '+w.name+' after the bell');
      var nf=startFeud(S,P,w,l,36,l.name+' attacked '+w.name+' after the bell');if(nf&&f)$L.heatUp(S,nf,10,l.name+' attacked '+w.name+' after the bell');
      $L.relBump(S,w.id,l.id,{bond:-10},{k:'attack',by:l.id,t:l.name+' attacked '+w.name+' after the bell.'});
      S.hype=(S.hype||0)+0.03;
      return l.name+' waits for '+w.name+' to turn around.'+(was==='F'?' The crowd cannot believe what it is seeing.':' Nobody is surprised, and everybody is angry.')+(nf?'':' The office already has too many feuds to make this one official.');
    }
    if(pick&&pick.who&&S.w[pick.who]){
      var c2=S.w[pick.who],t=titleById(P,pick.title),nf2=startFeud(S,P,c2,w,32,c2.name+' came out to challenge for the '+(t?t.name:'title'),t?{title:t.id}:{});
      if(t)c2.shot=t.id;S.hype=(S.hype||0)+0.03;
      $L.youRemember(S,c2,'spot','You sent them out to close the show and challenge for the title.',8);
      return c2.name+' walks out onto the stage and points at the '+(t?t.name:'title')+'. '+w.name+' holds it up.'+(nf2?'':' The office already has too many feuds to make it official, but the challenge is made.');
    }
    return w.name+' celebrates as the show moves on.';
  }
};

/* ---------- the engine of the night ---------- */
export function liveMax(S){var sh=S.queue[S.qi];return sh&&sh.big?$L.LIVE_MAX_BIG:$L.LIVE_MAX_TV;}
export function liveMake(S,L,kind,ev){ev.kind=kind;ev.title=$L.LIVEK[kind].n;ev.id=++L.n;ev.done=false;ev.pick=null;ev.result=null;if(!$L.LIVEK[kind].free)L.cnt++;L.had[kind]=(L.had[kind]||0)+1;return ev;}
export function livePre(S,L){
  var st=L.st,step=st.steps[st.k],ev=null,k;if(!step||L.pre===st.k)return null;L.pre=st.k;
  for(k=0;k<$L.LIVE_ORDER.length&&!ev;k++){
    var kind=$L.LIVE_ORDER[k],K=$L.LIVEK[kind];if(!K.pre||(!K.free&&(L.cnt>=liveMax(S)||L.had[kind])))continue;
    ev=K.pre(S,L,step);if(ev)liveMake(S,L,kind,ev);
  }
  if(ev&&ev.mi!=null&&ev.phase==='mid'){var sh=S.queue[S.qi],P=S.promos[S.player];ev.intro=liveIntro(S,P,sh,L.card[ev.mi],ev.mi,L.card.length);ev.label=sh&&L.card[ev.mi]?vsLabel($L.matchSetup(S,L.card[ev.mi]).sides):'';}
  return ev;
}
export function livePost(S,L){
  var st=L.st,i=st.k-1,step=st.steps[i];if(i<0||!step||L.post>=i)return null;L.post=i;
  var seg=L.last>=0?st.rep.segs[L.last]:null;if(!seg)return null;
  if(L.cnt>=liveMax(S)+1)return null;
  for(var k=0;k<$L.LIVE_POST.length;k++){   // one call after a segment: the first kind that fits
    var kind=$L.LIVE_POST[k],K=$L.LIVEK[kind];if(!K||!K.post||L.had[kind])continue;
    var ev=K.post(S,L,step,seg);if(ev)return liveMake(S,L,kind,ev);
  }
  return null;
}
/** Close the show: score it, file the report, move the week on. */
export function liveFinish(S){
  var L=S.live,P=S.promos[S.player],show=S.queue[S.qi],key=L.key;
  // the night's run sheet stays with the report, so a replay shows the same sheet the broadcast did
  var night=E.liveInfo(S).sheet.map(function(x){return {t:x.t,cat:x.cat,label:x.label,at:x.at,si:x.si,no:x.no,main:x.main};});
  var rep=showEnd(S,P,show,L.card,L.st);rep.night=night;
  if(S.pre&&S.pre.key===key&&S.pre.result)rep.pre=S.pre.result;
  if(L.log.length)rep.calls=L.log.slice();
  // what the booker did with their action points since the last show goes on the report too
  rep.prep=(S.apLog||[]).filter(function(l){return !l.sh;}).map(function(l){l.sh=1;return {place:l.place,act:l.act,ok:l.ok,msg:l.msg};});
  S.qi++;S.card=[];S.live=null;S.segs=[];S.segKey=null;$L.scnCut(S);
  return rep;
}
/** Put the show on the air. After this the card cannot be changed, only answered for. */
E.liveBegin=function(S,card){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show||S.over)return {errors:['No show to run.']};
  if(S.live)return {errors:['The show is already on the air.']};
  var v=E.validate(S,card);if(v.errors.length)return {errors:v.errors};
  $L.spendBP(S,card);PREX.forEach(function(fn){fn(S,P,show,card);});
  var c2=JSON.parse(JSON.stringify(card)),key=$L.showKey(S);
  E.chaos(S,c2);
  S.live={key:key,card:c2,st:showStart(S,P,show,c2),n:0,cnt:0,ev:null,pend:null,had:{},post:-1,pre:-1,log:[],last:-1};
  return {ok:true};
};
/** The next thing on the show. Returns {event} (a call is waiting for an answer), {seg, i} (a segment ran: play it),
    {skip:true} (a segment that could not run), or {done:true, rep} (the show is over and its report is filed). */
E.liveNext=function(S){
  var L=S.live;if(!L)return {done:true,rep:null};
  var P=S.promos[S.player],show=S.queue[S.qi],st=L.st;
  if(L.ev&&!L.ev.done)return {event:L.ev};
  var ev=livePost(S,L)||livePre(S,L);
  if(ev){L.ev=ev;return {event:ev};}
  if(st.k>=st.steps.length)return {done:true,rep:liveFinish(S)};
  var seg=showStep(S,P,show,L.card,st);L.last=seg?st.rep.segs.length-1:-1;st.steps[st.k-1].si=L.last;
  if(!seg){L.pend=null;return {skip:true};}
  if(L.pend){   // the call that shaped this segment is part of its commentary
    var at=0,bc=seg.bc||(seg.bc=[]),q,mark=seg.k==='match'?'pbp':'note';for(q=0;q<bc.length;q++)if(bc[q].t===mark){at=q+1;break;}   // a match: after the bell; a promo or angle: after the first thing that happens
    bc.splice(at,0,{t:'call',x:'Your call: '+L.pend.a+'. '+L.pend.r});(seg.calls=seg.calls||[]).push(L.pend);L.pend=null;
  }
  return {seg:seg,i:st.rep.segs.length-1};
};
/** Answer the call that is waiting. */
E.liveDecide=function(S,c){
  var L=S.live,ev=L&&L.ev;if(!ev||ev.done)return {ok:false,msg:'There is no call waiting.'};
  c=clamp(c|0,0,ev.choices.length-1);var ch=ev.choices[c];
  if(ch.bp&&S.bp<ch.bp)return {ok:false,msg:'That call needs '+ch.bp+' booking power and you have '+S.bp+'.'};
  if(ch.bp)S.bp-=ch.bp;
  var text=$L.LIVEK[ev.kind].run(S,L,ev,c)||'';
  ev.done=true;ev.pick=c;ev.result=text;
  var rec={k:ev.kind,q:ev.text,a:ch.n,r:text};L.log.push(rec);
  if(ev.phase==='post'){var sg=L.st.rep.segs[ev.si];if(sg){(sg.calls=sg.calls||[]).push(rec);(sg.bc=sg.bc||[]).push({t:'call',x:'Your call: '+ch.n+'. '+text});sg.notes.push(text);}}
  else L.pend=rec;
  $L.gainXp(S,2);
  return {ok:true,text:text};
};
/** What is on the air, for the screen: how far the show has got, the call that is waiting if any, and the night's
    run sheet (sheet: one line for each thing booked, with its time; `si` is the segment it became, once it has run). */
E.liveInfo=function(S){
  var L=S.live;if(!L)return null;
  var st=L.st,ck=E.clock(S,L.card),by={},key=function(x){return x.t==='plan'?'plan':(x.t==='seg'?'s'+x.slot:'m'+x.i);};
  ck.items.forEach(function(x){by[key(x)]=x;});
  var sheet=st.steps.map(function(sp,k){
    var it=by[key(sp)]||{},seg=sp.si!=null&&sp.si>=0?st.rep.segs[sp.si]:null;
    return {k:k,t:sp.t,cat:it.cat||sp.t,label:it.label||'',at:it.at==null?null:it.at,mins:it.mins||0,top:it.top||0,ran:k<st.k,cut:!!sp.cut,si:sp.si==null?-1:sp.si,ov:seg?seg.ov:null,no:sp.t==='match'?sp.i+1:0,main:sp.t==='match'&&sp.i===L.card.length-1};
  });
  return {step:st.k,steps:st.steps.length,segs:st.rep.segs.length,event:L.ev&&!L.ev.done?L.ev:null,calls:L.log.length,max:liveMax(S),bp:S.bp,budget:ck.budget,sheet:sheet};
};
/** The whole show in one go, every call answered with its safe choice: for anything that runs a show without a person. */
export function livePlay(S,card){
  var b=E.liveBegin(S,card);if(b.errors)return b;
  for(var g=0;g<400;g++){var r=E.liveNext(S);if(r.event)E.liveDecide(S,r.event.safe||0);else if(r.done)return {rep:r.rep};}
  return {errors:['The show did not finish.']};
}

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.LIVE_MAX_TV = LIVE_MAX_TV;
$L.LIVE_MAX_BIG = LIVE_MAX_BIG;
$L.LIVE_HM_CD = LIVE_HM_CD;
$L.LIVEK = LIVEK;
$L.LIVE_ORDER = LIVE_ORDER;
$L.LIVE_POST = LIVE_POST;
$L.liveMatch = liveMatch;
$L.liveLater = liveLater;
$L.livePut = livePut;
$L.liveIntro = liveIntro;
$L.CHAOS_SAFE = CHAOS_SAFE;
$L.afterBellText = afterBellText;
$L.liveMax = liveMax;
$L.liveMake = liveMake;
$L.livePre = livePre;
$L.livePost = livePost;
$L.liveFinish = liveFinish;
$L.livePlay = livePlay;
