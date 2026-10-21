/* Guest commentary and run-ins, on every match (Ryan, 21 October: "so people can easily add feud members", and run-in
   participants "to keep shows going"). docs/plans/arcs-on-the-card.md.
   m.gc is the guest at the commentary desk for the match, m.ri the one booked to run in. Neither is in the match.
   A guest who has a story with somebody in the match lifts the crowd and heats the feud, and says their piece on the
   call (beats of type 'col' with g: their id, played at the desk's third chair). A booked run-in does not decide the
   finish: the writers or a call on the air do. When the match comes up the run-in is at the curtain and the gorilla
   position decides when they go (LIVEK.bookrun): after the bell (a beat-down, the finish untouched; what a game nobody
   plays does), during the match to cost somebody it, during it and fought off, or not at all. Either way they are now
   in a story with the one they went after, through startFeud(), relBump() and youRemember(). Picks of words come from
   h01(), never rnd(S). */
function rsIn(S,show,id,m){var P=S.promos[S.player];if(id==null||!S.w[id]||(m&&flat(m.sides).indexOf(id)>=0))return false;return eligible(S,P,show).some(function(w){return w.id===id;});}
/** The one in the match a guest or a run-in has the most story with: a feud first, then the worst blood. */
function rsTarget(S,m,id){
  var ids=flat(m.sides).filter(function(x){return x!=null&&S.w[x];}),best=null,bs=-1e9;
  ids.forEach(function(x){var f=feudOf(S,id,x),v=(f?200+f.heat:0)-(typeof bondOf==='function'?bondOf(S,id,x):0);if(v>bs){bs=v;best=x;}});
  return best;
}
/** Why somebody fits a match's desk or curtain, in a few words, or ''. */
function rsWhy(S,m,id){return rsAbout(S,m,id).t;}
/** Why, and who in the match it is about: {t, id}. */
function rsAbout(S,m,id){
  var ids=flat(m.sides).filter(function(x){return x!=null&&S.w[x];}),f=null,fr=null,i;
  for(i=0;i<ids.length;i++){var g=feudOf(S,id,ids[i]);if(g&&(!f||g.heat>f.heat)){f=g;fr=ids[i];}}
  if(f)return {t:'feuding with '+S.w[fr].name,id:fr};
  var A=S.sa;if(A&&!A.done){var cast=Object.keys(A.cast).map(function(r){return A.cast[r];});var ia=ids.filter(function(x){return cast.indexOf(x)>=0;})[0];if(cast.indexOf(id)>=0&&ia!=null)return {t:'in the arc',id:ia};}
  for(i=0;i<ids.length;i++){var b=typeof bondOf==='function'?bondOf(S,id,ids[i]):0;if(b>=40)return {t:S.w[ids[i]].name+'’s friend',id:ids[i]};if(b<=-40)return {t:'bad blood with '+S.w[ids[i]].name,id:ids[i]};}
  return {t:'',id:rsTarget(S,m,id)};
}
/** Who can sit in on commentary for match i, or run in: everybody working tonight who is not in it, the ones with a story first. */
E.ringsideChoices=function(S,i){
  var m=S.card&&S.card[i],show=S.queue&&S.queue[S.qi],P=S.promos[S.player];if(!m||!show)return [];
  var ids=flat(m.sides);
  return eligible(S,P,show).filter(function(w){return ids.indexOf(w.id)<0;}).map(function(w){return {id:w.id,n:w.name,why:rsWhy(S,m,w.id),ovr:w.ovr};})
    .sort(function(a,b){return (b.why?1:0)-(a.why?1:0)||b.ovr-a.ovr;});
};
/** Put somebody at the desk (k 'gc') or at the curtain (k 'ri') for match i. v '' takes them away. */
E.setRingside=function(S,i,k,v){
  var m=S.card&&S.card[i];if(!m||(k!=='gc'&&k!=='ri'))return {ok:false,msg:''};
  if(v===''||v==null){delete m[k];return {ok:true,msg:k==='gc'?'No guest on commentary.':'Nobody runs in.'};}
  var id=+v,w=S.w[id];if(!w)return {ok:false,msg:''};
  if(flat(m.sides).indexOf(id)>=0)return {ok:false,msg:w.name+' is in the match.'};
  if(m[k==='gc'?'ri':'gc']===id)return {ok:false,msg:w.name+' cannot be at the desk and at the curtain.'};
  m[k]=id;var why=rsWhy(S,m,id);
  return {ok:true,msg:k==='gc'?w.name+' joins the commentary desk for this match'+(why?' ('+why+').':'.'):w.name+' will be at the curtain. When they go is your call on the night.'};
};
/* a guest with a story with somebody in the match lifts the crowd; a run-in after the bell gets a pop */
CRX.push(function(ctx){
  if(!ctx.isPl)return null;var S=ctx.S,m=ctx.m,d=0,x=null;
  if(m.gc!=null&&rsIn(S,ctx.show,m.gc,m)){var g=S.w[m.gc],why=rsWhy(S,m,g.id);if(/^feuding|arc/.test(why)){d+=1.5;x=g.name+' on commentary, with a score to settle';}else{d+=0.4;x=x||g.name+' joined the commentary desk';}}
  if(m.runin&&m.runin.after){d+=1;x=x||'A run-in after the bell';}
  return d?{d:d,x:x}:null;
});
var GC_LINES={
  feud:['{g}: “I am not here to call the match. I am here to watch {t} lose.”','{g}: “Look at {t}. That is somebody who knows I am sitting right here.”','{g}: “Enjoy it, {t}. Next time it is me in there.”','{g}: “Every move {t} makes tonight, I am taking notes.”'],
  friend:['{g}: “Come on, {t}! That is my friend in there, and I will say so on live television.”','{g}: “I have known {t} for years. Nobody works harder.”','{g}: “Get up, {t}! Get up!”'],
  bad:['{g}: “I would not cross the street to help {t}. Just saying.”','{g}: “Somebody had to say it: {t} is overrated.”'],
  any:['{g}: “Thanks for having me. Great match so far.”','{g}: “I could do that. I have done that, better.”','{g}: “This crowd is hot tonight. You can feel it from here.”']
};
/* the guest's piece on the call, the heat it adds, and the run-in after the bell or during the match */
POST.push(function(ctx){
  var S=ctx.S,m=ctx.m,seg=ctx.res&&ctx.res.seg,P=ctx.P;if(!ctx.isPl||S.cal||!seg)return;
  var bc=seg.bc||(seg.bc=[]);
  if(m.gc!=null&&rsIn(S,ctx.show,m.gc,m)){
    var g=S.w[m.gc],ab=rsAbout(S,m,g.id),t=ab.id,tw=t!=null?S.w[t]:null,why=ab.t,set=/^feuding|arc/.test(why)?'feud':(/friend/.test(why)?'friend':(/bad blood/.test(why)?'bad':'any'));
    var cols=[];bc.forEach(function(b,k){if(b.t==='col')cols.push(k);});
    var L=GC_LINES[set],key='gc'+S.week+':'+g.id+':'+(ctx.i||0),k0=Math.floor(h01(key)*L.length)%L.length,line=function(n){return fill(L[(k0+n)%L.length],{g:g.name,t:tw?tw.name:'them'});};   // two different lines
    var at=[cols.length?cols[Math.floor(cols.length/3)]+1:2,cols.length>1?cols[cols.length-1]+1:bc.length];
    bc.splice(Math.min(at[1],bc.length),0,{t:'col',g:g.id,x:line(1)});bc.splice(Math.min(at[0],bc.length),0,{t:'col',g:g.id,x:line(0)});
    seg.gc=g.id;
    if(set==='feud'&&tw){var f=feudOf(S,g.id,tw.id);if(f)heatUp(S,f,3,g.name+' sat in on commentary for '+tw.name+'’s match');relBump(S,g.id,tw.id,{bond:-3},{k:'gc',t:g.name+' ran '+tw.name+' down on commentary.'});}
    else if(set==='friend'&&tw)relBump(S,g.id,tw.id,{bond:2},{k:'gc',t:g.name+' cheered '+tw.name+' on from the desk.'});
    youRemember(S,g,'gc','You put them on the commentary desk for a match.',1);
  }
  var R=m.runin;
  if(R&&R.booked&&S.w[R.r]&&S.w[R.p]){
    var r=S.w[R.r],p=S.w[R.p],f2=feudOf(S,r.id,p.id),nf=!f2;
    if(!f2)f2=startFeud(S,P,p,r,R.after?32:28,r.name+' ran in on '+p.name,{force:true});else heatUp(S,f2,R.after?7:4,r.name+' ran in on '+p.name);
    relBump(S,r.id,p.id,{bond:-8},{k:'runin',t:r.name+' ran in on '+p.name+'.'});
    if(R.after){bc.push({t:'note',x:'The bell has barely gone when '+r.name+' hits the ring and lays '+p.name+' out. Officials pour down the ramp.'});seg.notes.push(r.name+' ran in after the bell and laid out '+p.name+'.'+(nf&&f2?' A new rivalry begins.':''));}
    seg.ri=r.id;youRemember(S,r,'runin','You sent them out on '+p.name+'.',2);
  }
});
/* a booked run-in is at the curtain when the match comes up, every time: a call of its own, outside the night's limit */
LIVEK.bookrun={n:'At the curtain',free:true,
  pre:function(S,L,step){
    if(step.t!=='match')return null;var M=liveMatch(S,L,step.i);if(!M||M.m.ri==null||M.m.runin||M.m.norun||M.m.rasked)return null;
    var show=S.queue[S.qi],r=S.w[M.m.ri];if(!r||!rsIn(S,show,r.id,M.m))return null;
    M.m.rasked=1;
    var pid=rsAbout(S,M.m,r.id).id,p=S.w[pid];if(!p)return null;
    var side=M.m.sides[0].indexOf(p.id)>=0?0:1,two=M.c.sides.length===2&&M.m.mt!=='br',why=rsWhy(S,M.m,r.id);
    var ch=[{n:'After the bell: '+r.name+' lays '+p.name+' out',says:'The match ends the way it was going to. Then '+r.name+' hits the ring. The story gets hotter, and the finish is left alone.'}];
    if(two){ch.push({n:'During the match: '+r.name+' costs '+p.name+' the match',bp:1,says:p.name+' loses on the interference. The story gets much hotter. '+p.name+' may not thank you.'});
      ch.push({n:'During the match: '+p.name+' fights '+r.name+' off',bp:1,says:p.name+' wins and looks strong. The story gets a little hotter.'});}
    ch.push({n:'Keep '+r.name+' in the back',says:'Nothing happens. '+r.name+' was told to be ready for nothing.'});
    return {phase:'mid',mi:step.i,who:r.id,other:p.id,side:side,
      text:r.name+' is at the curtain, booked to run in on '+p.name+'. When do they go?',
      why:[why?r.name+': '+why:r.name+' has no story with anybody in the match yet','How the match ends stays with the writers unless you send them in during it'],safe:0,choices:ch};
  },
  run:function(S,L,ev,c){
    var M=liveMatch(S,L,ev.mi),p=S.w[ev.other],r=S.w[ev.who],pick=ev.choices[c];if(!M||!p||!r||!pick)return 'The moment passes.';
    if(/^Keep /.test(pick.n)){M.m.norun=1;youRemember(S,r,'benched','You booked them to run in, then kept them in the back.',-2);return r.name+' stays in the back.';}
    var f=feudOf(S,r.id,p.id);if(!f&&c!==0)f=startFeud(S,S.promos[S.player],p,r,26,r.name+' ran in on '+p.name,{force:true});   // the match needs a story for the run-in to be part of
    M.m.runin={r:r.id,p:p.id,f:f?f.id:null,booked:1};
    if(c===0){M.m.runin.after=1;return r.name+' waits for the bell. Then '+r.name+' goes.';}
    if(/costs/.test(pick.n)){M.m.call=1-ev.side;M.m.ff='interf';if(p.align==='F'&&p.mom>=2)youRemember(S,p,'screwed','You sent '+r.name+' out to cost them a match.',-6);return r.name+' hits the ring behind the referee’s back.';}
    M.m.call=ev.side;M.m.ff='foiled';youRemember(S,p,'strong','You let them fight off '+r.name+' and win anyway.',6);
    return r.name+' comes down the ramp, and '+p.name+' is ready.';
  }
};
LIVE_ORDER.unshift('bookrun');
/* someone at the desk or the curtain who cannot be there tonight is simply not there; the booker is told */
(function(){
  var v0=E.validate;
  E.validate=function(S,card){
    var v=v0(S,card),show=S.queue&&S.queue[S.qi];if(!show)return v;
    (card||[]).forEach(function(m,i){
      if(m.gc!=null&&!rsIn(S,show,m.gc,m))v.warnings.push((S.w[m.gc]?S.w[m.gc].name:'The guest')+' cannot be at the desk tonight, so match '+(i+1)+' has no guest on commentary.');
      if(m.ri!=null&&!rsIn(S,show,m.ri,m))v.warnings.push((S.w[m.ri]?S.w[m.ri].name:'The run-in')+' cannot be here tonight, so nobody runs in during match '+(i+1)+'.');
    });
    return v;
  };
})();
