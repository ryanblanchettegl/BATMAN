/* ===== Networks and what they want (NEXT.md 7.1 and 7.3) =====
   Every network a weekly show can be on has a taste, worked out from its name with a hash (never rnd(S)):
     family  wants a clean show: hardcore, tables and ladder matches and a lot of shouting go down badly
     sport   wants wrestling: matches over talking, and good ones
     late    wants a show people talk about: promos, angles and stipulations
     niche   cares less about the numbers: its target is softer, and it likes long, serious matches
   A deal has a ratings target: what the show was drawing when the deal was signed. Every episode of yours is measured
   against it and against the network's taste. Missing the target or going against the taste fills the network's
   patience (S.clocks.net, which already ends in a meeting). Three misses in a row, and an executive calls (an inbox
   matter with three answers). At renewal, a show the business rates can get two networks bidding for it.
   Rivals' shows have targets too, but nobody calls them. */
var NET_TASTE={
  family:{n:'Family',d:'wants a clean show. Hardcore, tables and ladder matches go down badly.'},
  sport:{n:'Sport',d:'wants wrestling: more matches than talking, and good ones.'},
  late:{n:'Late night',d:'wants a show people talk about: promos, angles and stipulations.'},
  niche:{n:'Niche',d:'cares less about the numbers, and likes long, serious matches.'}
};
var NET_KEYS=['family','sport','late','niche'];
function netTaste(name){if(/Sport/.test(name))return 'sport';if(/Family|Kids/.test(name))return 'family';if(/Indie|Underground|Cult/.test(name))return 'niche';if(/Gaslight|Midnight|Late/.test(name))return 'late';return NET_KEYS[hash('taste:'+name)%NET_KEYS.length];}
/** The ratings target for a show's deal. Set when it is first asked for, and again when a deal is signed. */
function netTarget(sh){if(!sh.tgt&&sh.va)sh.tgt=Math.round(sh.va*(netTaste(sh.net)==='niche'?0.85:0.97));return sh.tgt||0;}
/** Did tonight go against the network's taste? Returns a short reason, or ''. */
function netClash(S,sh,rep){
  var t=netTaste(sh.net),ms=(rep.segs||[]).filter(function(g){return g.k==='match';}),talk=(rep.segs||[]).filter(function(g){return g.k==='promo'||g.k==='angle';}).length;
  if(t==='family'){var hc=ms.filter(function(g){return g.stip==='Hardcore'||g.stip==='Tables'||g.stip==='Ladder';}).length;if(hc)return 'a '+ms.filter(function(g){return g.stip==='Hardcore'||g.stip==='Tables'||g.stip==='Ladder';})[0].stip.toLowerCase()+' match on a family network';}
  if(t==='sport'&&talk>ms.length)return 'more talking than wrestling';
  if(t==='late'&&!talk&&!ms.some(function(g){return g.stip;}))return 'nothing to talk about: no promo, no angle, no stipulation';
  return '';
}
/** And did it give them what they like? */
function netPleased(S,sh,rep){
  var t=netTaste(sh.net),ms=(rep.segs||[]).filter(function(g){return g.k==='match';});
  if(t==='sport')return ms.some(function(g){return g.ov>=rep.exp+8;});
  if(t==='late')return (rep.segs||[]).some(function(g){return (g.k==='angle'||g.k==='promo')&&g.ov>=rep.exp+5;});
  if(t==='niche')return ms.some(function(g){return g.mins>=20&&g.ov>=rep.exp+4;});
  if(t==='family')return !netClash(S,sh,rep)&&rep.rating>=rep.exp;
  return false;
}
SHOWX.push(function(S,P,show,rep){
  if(S.cal||show.big||P.id!==S.player)return;var sh=airRec(P,show.id);if(!sh||!sh.net)return;
  var tgt=netTarget(sh);if(!tgt)return;
  var hit=rep.viewers>=tgt,clash=netClash(S,sh,rep),pleased=!clash&&netPleased(S,sh,rep);
  sh.miss=hit?0:(sh.miss||0)+1;sh.hits=hit?(sh.hits||0)+1:0;
  rep.net={n:sh.net,taste:netTaste(sh.net),tgt:tgt,hit:hit?1:0,clash:clash,pleased:pleased?1:0,miss:sh.miss};
  E.clocks(S);var c=S.clocks.net;
  // a clash is noted; every second one costs patience
  if(clash){sh.cl=(sh.cl||0)+1;if(sh.cl%2===0){c.v=clamp(c.v+1,0,CLOCKS.net.segs);c.why=sh.net+' did not like '+clash+'.';}}
  if(pleased||sh.hits>=4){if(c.v>0)c.v--;if(sh.hits>=4)sh.hits=0;}
  // three misses in a row and an executive calls (not while one is waiting, and not more than once in eight weeks)
  if(sh.miss>=3&&!(S.lcd&&S.lcd['nx'+sh.id]>S.week)&&!S.inbox.some(function(e){return !e.done&&e.type==='netexec';})){
    (S.lcd||(S.lcd={}))['nx'+sh.id]=S.week+8;
    pushEv(S,{type:'netexec',sid:sh.id,text:'An executive from '+sh.net+' is on the phone. '+sh.name+' has come in under its target three weeks running: they want about '+tgt.toLocaleString('en-US')+' watching, and last week it was '+rep.viewers.toLocaleString('en-US')+'. They are a '+NET_TASTE[netTaste(sh.net)].n.toLowerCase()+' network: it '+NET_TASTE[netTaste(sh.net)].d,
      choices:['Promise them a big main event next week','Lower the target: give up a little of the fee','Tell them the numbers will come'],
      checks:{2:mkCheck(9,[{n:'The show is '+airWord(sh).toLowerCase(),v:sh.lv>=3?1:(sh.lv<=1?-1:0)}].concat(skillMods(S,'talk')))}});
  }
});
EVR.netexec=function(S,ev,choice,P){
  var sh=airRec(P,ev.sid);if(!sh)return 'That show is no longer on your schedule.';E.clocks(S);var c=S.clocks.net;
  if(choice===0){var tg=Math.round(clamp(expected(P,sh)+4,40,95)),bonus=Math.round(P.inc0*0.03/1000)*1000;c.v=Math.max(0,c.v-1);
    S.quests.push({id:S.nid++,type:'netvow',due:S.week+2,target:tg,bonus:bonus,text:'Promise to '+sh.net+': a main event of '+starG(tg)+' or better by '+cal(S.week+2).label});
    return 'They will hold you to it: a main event of '+starG(tg)+' or better within two weeks.';}
  if(choice===1){sh.tgt=Math.round(netTarget(sh)*0.9);sh.rate=clamp((sh.rate||1)*0.95,0.6,1.8);sh.miss=0;c.v=Math.max(0,c.v-2);
    return sh.net+' takes a smaller target, about '+sh.tgt.toLocaleString('en-US')+' watching, and pays a little less for it.';}
  var r=rollCheck(S,ev.checks[2]);ev.roll=r;sh.miss=0;
  if(r.ok)return rollText(r)+'They believe you, for now.';
  c.v=clamp(c.v+2,0,CLOCKS.net.segs);c.why='You told '+sh.net+' the numbers would come';
  return rollText(r)+'They have heard that before. The network’s patience is thinner.';
};
/* a new deal: the target is what the show draws now */
(function(){var was=airSign;airSign=function(S,P,sh,net,tier,rate){was(S,P,sh,net,tier,rate);sh.tgt=sh.va?Math.round(sh.va*(netTaste(sh.net)==='niche'?0.85:0.97)):0;sh.miss=0;};})();
/* a bidding war: when a show the business rates (a fixture or better) comes up for renewal, a second network of
   the same size or bigger can join in. The rights matter gets a fourth answer. */
(function(){var was=airAsk;airAsk=function(S,P,sh){was(S,P,sh);
  if((sh.lv||0)<2||hash('bid'+P.id+sh.id+':'+(sh.deals||0))%3===0)return;
  var ev=S.inbox.filter(function(e){return !e.done&&e.type==='rights'&&e.sid===sh.id;})[0];if(!ev)return;
  var t3=Math.min(2,sh.tier+(sh.lv>=4?1:0)),third=airNets(S,t3).filter(function(n){return n!==sh.net&&n!==ev.other;})[0];if(!third)return;
  ev.third=third;ev.t3=t3;ev.text+=' And '+third+', '+AIR_TIERN[t3]+', has heard. You could let them bid against each other.';
  ev.choices.push('Let '+ev.other+' and '+third+' bid for it');
  ev.checks[3]=mkCheck(8,[{n:'The show is '+airWord(sh).toLowerCase(),v:sh.lv>=4?2:1}].concat(skillMods(S,'talk')));
};})();
(function(){var was=EVR.rights;EVR.rights=function(S,ev,choice,P){
  if(choice!==3)return was(S,ev,choice,P);
  var sh=airRec(P,ev.sid);if(!sh)return 'That show is no longer on your schedule.';var o=airOffer(S,P,sh),old=sh.net,r=rollCheck(S,ev.checks[3]);ev.roll=r;
  if(r.ok){airSign(S,P,sh,ev.third,ev.t3,o.move+sh.rate*0.12);sh.pr=clamp(sh.pr-2,0,100);sh.prd=sh.pr;airStep(sh);E.clocks(S);S.clocks.net.v=0;S.clocks.net.why='A new network, and a clean slate';
    news(S,'money',ev.third+' won a bidding war for '+sh.name+'.');note(S,'A bidding war won',sh.name+' goes to '+sh.net+'.','good');
    return rollText(r)+ev.third+' wins the bidding. '+sh.name+' moves from '+old+' at about '+money(airPay(P,sh,sh.rate,sh.tier))+' a week.';}
  airSign(S,P,sh,ev.other,ev.t2,o.move-sh.rate*0.04);sh.pr=clamp(sh.pr-3,0,100);sh.prd=sh.pr;airStep(sh);
  return rollText(r)+ev.third+' drops out early, and '+ev.other+' knows it. '+sh.name+' moves there for less than they first offered, about '+money(airPay(P,sh,sh.rate,sh.tier))+' a week.';
};})();
/** Before the bell: will tonight's card go against the network's taste? A short line for Tonight's stakes, or ''. */
function netCardClash(S,show,card){
  var P=S.promos[S.player],sh=show&&!show.big?airRec(P,show.id):null;if(!sh||!sh.net||!card.length)return '';
  var t=netTaste(sh.net),talk=segRead(S).length,hc=card.filter(function(m){return m&&(m.stip==='hardcore'||m.stip==='tables'||m.stip==='ladder'||m.stip==='fire'||m.stip==='cell');}).length,st=card.some(function(m){return m&&m.stip&&m.stip!=='std';});
  if(t==='family'&&hc)return sh.net+' is a family network, and a '+STIP[card.filter(function(m){return m&&(m.stip==='hardcore'||m.stip==='tables'||m.stip==='ladder'||m.stip==='fire'||m.stip==='cell');})[0].stip].n.toLowerCase()+' match will not go down well.';
  if(t==='sport'&&talk>card.length)return sh.net+' is a sport network, and tonight has more talking than wrestling.';
  if(t==='late'&&!talk&&!st)return sh.net+' is a late night network, and tonight has nothing to talk about: no promo, no angle, no stipulation.';
  return '';
}
/** For the screens: each of your weekly shows' network, its taste, the target and how the last show did against it. */
E.netInfo=function(S){var P=S.promos[S.player];return P.shows.filter(function(sh){return !sh.big&&sh.net;}).map(function(sh){var t=netTaste(sh.net);
  return {id:sh.id,name:sh.name,net:sh.net,taste:NET_TASTE[t].n,want:NET_TASTE[t].d,tgt:netTarget(sh),miss:sh.miss||0};});};
E.NET_TASTE=NET_TASTE;
