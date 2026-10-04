/* ---------- The direction of the company ----------
   Two calls from the gorilla position that decide more than tonight (src/31-live.js runs them):

   The owner on the headset. The owner has a favourite, and some months asks for somebody to be kept strong. When
   that person is in a match they may well lose, the office calls the truck. Do as told, refuse, or find a way round.

   Who the show is built around. After a main event, when the building will not sit down for the winner, the last
   shot of the night is an answer to a bigger question. S.fc = {id, w} is the face of the company: who, and the week
   it was decided. The crowd comes to see them: a lift when they are in the main event, a letdown when they are off
   the card, and louder matches. Everyone near the top has a view about it, and so does the owner. */
var FACE_CD=8,OWNER_CD=3,FACE_UP=0.04,FACE_DOWN=0.03;
function faceOf(S){var f=S.fc,w=f?S.w[f.id]:null;return w&&w.promo===S.player&&!w.nw?w:null;}
/** Could they be on a show this week? */
function faceHere(S,w){return !!w&&w.inj<=0&&!(w.away>=S.week)&&!w.camp;}
function faceOn(card,id){var n=card.length,i;if(!n)return 0;if(flat(card[n-1].sides).indexOf(id)>=0)return 2;for(i=0;i<n;i++)if(flat(card[i].sides).indexOf(id)>=0)return 1;return 0;}
/** What the crowd makes of where the face of the company is on tonight's card. Added to the show's hype. */
function faceHype(S,P,card){
  var w=faceOf(S);if(!w||S.cal||P.id!==S.player||!card.length)return 0;
  var on=faceOn(card,w.id);
  return on===2?FACE_UP:(on===1?0:(faceHere(S,w)&&S.week>S.fc.w?-FACE_DOWN:0));
}
/** One line for the card builder when the face of the company could be on the show and is not. */
function faceWarn(S,card){
  var w=faceOf(S);if(!w||!card.length||!faceHere(S,w)||faceOn(card,w.id))return null;
  var show=S.queue&&S.queue[S.qi],P=S.promos[S.player];if(show&&!show.big&&show.brand&&w.brand&&w.brand!==show.brand&&!isDev(P,w.brand))return null;   // not their brand's show
  return 'The shows are built around '+w.name+', and '+w.name+' is not on this card. The crowd will feel it.';
}
CRX.push(function(ctx){var w=ctx.isPl?faceOf(ctx.S):null;if(!w||ctx.all.indexOf(w)<0)return null;return {d:2,x:'The crowd came to see '+w.name};});
WEEKX.push(function(S){
  var f=S.fc;if(!f||faceOf(S))return;var w=S.w[f.id];S.fc=null;
  news(S,'you',(w?w.name:'The one the shows were built around')+' is gone. The company has nobody to build its shows around.');
  note(S,'Nobody to build the shows around',w?w.name+' is no longer here.':'','bad');
});
E.faceInfo=function(S){var w=faceOf(S);return w?{id:w.id,name:w.name,since:S.fc.w,weeks:S.week-S.fc.w,here:faceHere(S,w)}:null;};
function topNames(S,P,skip,n){return rosterOf(S,P.id).filter(function(x){return !x.nw&&!isDev(P,x.brand)&&skip.indexOf(x.id)<0;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,n);}

LIVEK.owner={n:'The owner on the headset',
  pre:function(S,L,step){
    var o=S.owner;if(step.t!=='match'||!o||o.me)return null;
    var cd=S.lcd&&S.lcd.owner;if(cd!=null&&S.week-cd<OWNER_CD)return null;
    var M=liveMatch(S,L,step.i);if(!M||M.c.sides.length!==2||M.m.mt==='br'||M.m.call!=null||M.m.ff||M.m.nc||M.m.how||M.m.runin)return null;
    var q=S.quests.filter(function(x){return x.type==='o_strong'&&M.ids.indexOf(x.w)>=0;})[0],fid=q?q.w:(o.fav!=null&&M.ids.indexOf(o.fav)>=0?o.fav:null);if(fid==null)return null;
    var f=S.w[fid],side=M.m.sides[0].indexOf(fid)>=0?0:1,od=E.matchOdds(S,M.m,step.i,M.n);if(!f||!od)return null;
    var p=od.p[side];if(p>=(q?0.7:0.45))return null;   // the office only calls when its favourite may well lose
    var opp=M.c.sides[1-side];(S.lcd=S.lcd||{}).owner=S.week;
    return {phase:'mid',mi:step.i,who:f.id,other:opp[0].id,side:side,
      text:o.name+' is on the headset from the office. “'+f.name+' does not lose tonight. I am not asking.”',
      why:[q?o.name+' asked for '+f.name+' to be kept strong this month':f.name+' is '+o.name+'’s favourite','The odds give '+f.name+' a '+Math.round(p*100)+'% chance tonight'],safe:0,
      choices:[{n:'The match plays out',says:'The odds decide it. '+o.name+' will know you did not take the call, and will be angrier still if '+f.name+' loses clean.'},
        {n:f.name+' wins. Tell the referee',says:'The office gets its way, and it costs no booking power. '+names(opp)+' will remember being fed to the owner’s favourite, and the top of the card will see who the office is behind.'},
        {n:f.name+' loses, but not clean',bp:1,says:f.name+' is disqualified and stays protected. '+o.name+' can live with it. The crowd will not like the finish.'}]};
  },
  run:function(S,L,ev,c){
    var M=liveMatch(S,L,ev.mi),o=S.owner,f=S.w[ev.who],P=S.promos[S.player];if(!M||!f)return 'The moment passes.';
    var opp=M.c.sides[1-ev.side];
    if(c===1){
      M.m.call=ev.side;o.trust=clamp(o.trust+4,0,100);
      livePut(M.m,{cr:-2,x:'The crowd could see the office’s hand in the finish'});
      opp.forEach(function(w){youRemember(S,w,'fed','You fed them to the owner’s favourite because the office said so.',-8);});
      youRemember(S,f,'protected','The office wanted them to win, and you made the call.',4);
      topNames(S,P,[f.id].concat(opp.map(function(w){return w.id;})),2).forEach(function(x){relBump(S,x.id,f.id,{ja:8},{k:'office',t:x.name+' saw the office hand '+f.name+' a win.'});});
      return 'The word goes to the referee. '+f.name+' is going over, because the office says so.';
    }
    if(c===2){
      M.m.call=1-ev.side;M.m.ff='dq';o.trust=clamp(o.trust+1,0,100);
      opp.forEach(function(w){youRemember(S,w,'tainted','They got their win, but you made sure it was not a clean one.',-3);});
      return f.name+' gets disqualified on purpose. '+names(opp)+' '+(opp.length>1?'get':'gets')+' the win, and '+f.name+' walks out without being beaten.';
    }
    o.trust=clamp(o.trust-2,0,100);M.m.ownerNo=f.id;
    opp.forEach(function(w){youRemember(S,w,'fair','You would not fix their match for the owner’s favourite.',5);});
    return 'You tell the office the match plays out. The line goes quiet.';
  }
};
/* refusing the office is a bet: it pays if the favourite wins anyway */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,id=ctx.m.ownerNo;if(id==null||!ctx.isPl||S.cal||!S.owner||S.owner.me||!S.w[id])return;
  var o=S.owner,f=S.w[id];
  if(r.win>=0&&r.winners.indexOf(f)>=0){o.trust=clamp(o.trust+3,0,100);r.seg.notes.push(f.name+' won without the office’s help. '+o.name+' has to admit you called it right.');}
  else if(r.win>=0&&(r.fin==='clean'||r.fin==='flash')){o.trust=clamp(o.trust-3,0,100);r.seg.notes.push(o.name+' told you this would happen, and will not let you forget it.');}
});

LIVEK.face={n:'Who the show is built around',
  post:function(S,L,step,seg){
    if(step.t!=='match'||!seg||seg.k!=='match'||!seg.wi||seg.wi.length!==1||seg.ids.length!==2||seg.ov<70)return null;
    var M=liveMatch(S,L,step.i),P=S.promos[S.player],o=S.owner;if(!M||!M.main||S.reports.length<2)return null;
    var cd=S.lcd&&S.lcd.face;if(cd!=null&&S.week-cd<FACE_CD)return null;
    var w=S.w[seg.wi[0]],l=S.w[seg.ids[0]===seg.wi[0]?seg.ids[1]:seg.ids[0]],f=faceOf(S);
    if(!w||!l||w.promo!==P.id||w.nw||(f&&f.id===w.id)||seg.fin==='dq'||seg.fin==='co'||seg.fin==='draw')return null;
    var rk=topNames(S,P,[],99).indexOf(w);if(rk<0||(rk>=5&&w.mom<3))return null;
    if(f&&!(l.id===f.id||w.ovr>=f.ovr-3||!faceHere(S,f)))return null;
    var why=[];
    if(seg.ov>=80)why.push('The crowd is on its feet after '+starG(seg.ov));
    if(w.mom>=3)why.push(w.name+' is on a run');
    if(rk<3)why.push(w.name+' is one of the three biggest names here');
    if(f)why.push(l.id===f.id?w.name+' has just beaten '+f.name+', the one the shows are built around':f.name+' has been the one the shows are built around for '+Math.max(1,S.week-S.fc.w)+' weeks');
    else why.push('The shows are not built around anyone yet');
    var fav=o&&!o.me&&o.fav!=null&&S.w[o.fav]&&S.w[o.fav].promo===P.id?S.w[o.fav]:null;
    if(fav&&fav.id===w.id)why.push(o.name+' already sees '+w.name+' as the future');
    (S.lcd=S.lcd||{}).face=S.week;
    var ch=[f?{n:'Stay with '+f.name,says:f.name+' stays the one the shows are built around. '+w.name+' will notice being passed over.'}:{n:'No one name above the company',says:'The titles and the brand stay the draw. Nothing changes.'},
      {n:'Build the company around '+w.name,says:'The crowd will come to see '+w.name+': a lift when '+w.name+' is in the main event, a letdown when '+w.name+' is off the card. '+(f?f.name+' will not forget it. ':'')+'The other top names will be jealous.'+(fav?(fav.id===w.id?' '+o.name+' wants this.':' '+o.name+' had '+fav.name+' in mind.'):'')}];
    if(f)ch.push({n:'Nobody is bigger than the company',says:f.name+' stops being the one the shows are built around, and nobody takes the place. '+f.name+' will hold it against you.'});
    return {phase:'post',si:L.st.rep.segs.indexOf(seg),mi:step.i,who:w.id,other:l.id,
      text:'The building will not sit down for '+w.name+'. The truck wants to know where the last shot of the night goes, and everyone will read it as an answer: who is this company built around?',why:why,safe:0,choices:ch};
  },
  run:function(S,L,ev,c){
    var w=S.w[ev.who],P=S.promos[S.player],f=faceOf(S),o=S.owner;if(!w)return 'The moment passes.';
    if(c===1){
      S.fc={id:w.id,w:S.week};w.morale=clamp(w.morale+6,0,100);
      youRemember(S,w,'theone','You built the company around them.',18);
      if(f){youRemember(S,f,'replaced','You took the company off their shoulders and gave it to '+w.name+'.',-15);relBump(S,f.id,w.id,{bond:-10,ja:25},{k:'passed',keep:true,t:f.name+' watched the company get built around '+w.name+'.'});}
      topNames(S,P,[w.id].concat(f?[f.id]:[]),3).filter(function(x){return x.ovr>=w.ovr-10;}).forEach(function(x){relBump(S,x.id,w.id,{ja:10},{k:'passed',t:x.name+' thinks the company should have been built around someone else.'});});
      var line='';
      if(o&&!o.me&&o.fav!=null&&S.w[o.fav]&&S.w[o.fav].promo===P.id){
        if(o.fav===w.id){o.trust=clamp(o.trust+5,0,100);line=' '+o.name+' is delighted.';}
        else{o.trust=clamp(o.trust-3,0,100);line=' '+o.name+' had '+S.w[o.fav].name+' in mind, and says so.';}
      }
      news(S,'you',P.name+' is now built around '+w.name+'.');
      return 'The last shot of the night is '+w.name+', alone in the ring. The announcers say it out loud: this is '+w.name+'’s company now.'+line;
    }
    if(c===2&&f){
      S.fc=null;youRemember(S,f,'demoted','You told the world nobody is bigger than the company. They knew who you meant.',-10);
      S.trust=clamp((S.trust==null?60:S.trust)+2,0,100);
      news(S,'you',P.name+' is not built around any one name now.');
      return 'The show goes off the air on the company’s name, not on one person. The locker room notices that nobody is above it.';
    }
    if(f){
      youRemember(S,f,'loyal','You stayed with them when the building wanted '+w.name+'.',8);
      youRemember(S,w,'passed','The building wanted them, and you stayed with '+f.name+'.',-6);
      return 'The cameras find '+f.name+' before the show ends. It is still '+f.name+'’s company.';
    }
    return w.name+' celebrates, and the show goes off the air on the company’s name. Nothing has been decided.';
  }
};
LIVE_ORDER=['chaos','titlecall','owner','runin','hotmic'];
