/* ===== Invasions: who wins is agreed, and a bad one costs a year (NEXT.md 11.2, WISHLIST 66) =====
   A war with a rival (src/80-world.js, S.xf kind 'war') now starts with a phone call between the two offices about
   the finishes:
     trade      the wins are shared. Both companies come out of it looking strong, and the rival likes you better.
     ours       you ask them to put your people over. An attempt: if they agree and you win the war, they look weak
                for a year; if they refuse, they pull their wrestlers and the war is over before it starts.
     ring       nobody agrees anything, as before. The ring decides.
   A war lost by two or more leaves the loser looking weak for a year (P.weak, a week): a little less hype on every
   big night until it passes. A rival that looks weak loses a little popularity at once. Never rnd(S) outside the attempt. */
(function(){var was=startXf;startXf=function(S,pid,kind){was(S,pid,kind);if(kind!=='war'||!S.xf)return;var RV=S.promos[pid];
  pushEv(S,{type:'xfdeal',rival:pid,text:RV.name+'’s office is on the phone about the war. Before anybody gets in the ring, who wins what?',
    choices:['Trade wins: both sides come out strong','Ask them to put your people over','Let the ring decide'],
    checks:{1:mkCheck(9,[{n:RV.image>S.promos[S.player].image?'They are the bigger company':'You are the bigger company',v:RV.image>S.promos[S.player].image?-2:1},{n:(RV.rel||0)>0?'They like you':'They do not like you',v:(RV.rel||0)>0?1:-1}].concat(skillMods(S,'talk')))}});};})();
EVR.xfdeal=function(S,ev,choice,P){
  var x=S.xf,RV=S.promos[ev.rival];if(!x||x.with!==ev.rival)return 'The war is already over.';
  var guests=function(t,v){(x.guests||[]).forEach(function(id){var w=S.w[id];if(w)youRemember(S,w,'xfdeal',t,v);});};
  if(choice===0){x.deal='trade';guests('You shared the wins with my company. We did not come here to be fed.',3);RV.rel=clamp((RV.rel||0)+8,-100,100);return 'You agree to share the wins. Nobody leaves looking weak, and '+RV.name+' will remember that you played fair.';}
  if(choice===1){var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){x.deal='ours';guests('You had my office agree that I lose to your people.',-5);return rollText(r)+RV.name+' agrees to put your people over. Win the war and they will look weak for a year.';}
    RV.rel=clamp((RV.rel||0)-15,-100,100);news(S,'world',RV.name+' pulled its wrestlers out of the war with '+P.name+' before it began.');S.xfLast={kind:'war',with:x.with,sc:[0,0],week:S.week};S.xf=null;
    return rollText(r)+RV.name+' will not lie down for anybody. They pull their people out, and the war is over before it starts.';}
  x.deal='ring';return 'Nothing agreed. The ring decides.';
};
(function(){var was=endXf;endXf=function(S,P,rep){var x=S.xf;if(!x||x.kind!=='war')return was(S,P,rep);var RV=S.promos[x.with],d=x.sc[0]-x.sc[1],deal=x.deal;
  was(S,P,rep);
  var weak=function(Q,who){Q.weak=S.week+48;if(Q.id!==S.player)Q.image=clamp(Q.image-0.5,5,100);news(S,'world',who+' came out of the war looking weak. It will take a year to live down.');};
  if(deal==='trade'){P.image=clamp(P.image+0.2,5,100);RV.image=clamp(RV.image+0.2,5,100);RV.rel=clamp((RV.rel||0)+5,-100,100);news(S,'world','The war between '+P.name+' and '+RV.name+' made both look strong.');return;}
  if(deal==='ours'&&d>0){weak(RV,RV.name);return;}
  if(d>=2)weak(RV,RV.name);else if(d<=-2){weak(P,P.name);note(S,'Looking weak','You lost the war badly. Big nights will draw a little less for a year.','bad');}
};})();
/* a company that looks weak draws a little less on its big nights until the year is up */
PREX.push(function(S,P,show){if(P.id===S.player&&P.weak&&P.weak>S.week&&show.big)S.hype=(S.hype||0)-0.03;});
/** Whether a company is living down a war, for the screens: the week it ends, or 0. */
E.weakUntil=function(S,pid){var P=S.promos[pid||S.player];return P.weak&&P.weak>S.week?P.weak:0;};
