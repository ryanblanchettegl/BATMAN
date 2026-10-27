// @ts-nocheck
/* Moved from src/99-gimmicks.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, clamp } from './00-core';
import { CRX, NEWX } from './10-match';
import { GIMBY, GIMS } from './60-rpg';
$L.gimFromWords = gimFromWords; $L.gimBestFit = gimBestFit; $L.gimSmart = gimSmart; $L.gfx = gfx; $L.gimStip = gimStip; $L.gimPair = gimPair;
/* wraps: 00-core.js, 60-rpg.js, 93-segments.js (it must sort after them; test-buildorder.js checks) */
/* A smart gimmick system (Ryan, 20 October: "make sure each wrestler has a gimmick that has benefits for certain
   matches, pairings, feuds, promos, storylines"). The fourteen gimmicks of src/60-rpg.js each say what they are good
   for:
     - best: the match rules they shine in (a brute in a street fight, a technician in a submission match), and the
       kinds of match (a daredevil in a ladder or multi-man match, a workhorse in a long one);
     - hot: the gimmicks they make a hot pairing with (the hero against the cocky heel, the underdog against the
       monster), and flat: the ones that fall flat (two comedy acts, a technician against a monster);
     - promo: how good the gimmick is on the microphone, from a mumble to a show-stealer;
     - main: whether the crowd buys them at the top of the card;
     - grow: the attributes the character grows fastest in (src/99-progress.js lets them choose by it).
   What it does: a match is louder when the gimmicks fit it and the pairing is hot (CRX); a feud between a hot pairing
   heats faster and a flat one slower (heatUp); a promo is better or worse by the gimmick (segMean). When a game
   begins, everybody gets the gimmick their character's own words point to (the world's gimmick category and text),
   or the one their ratings fit best. Nothing here calls rnd(S). */
export var GFX={
  brute:{d:'A brawler who hurts people.',best:['hardcore','street','tables','nodq','cage','lumber'],mt:['1v1'],hot:['hero','underdog','technician'],flat:['comedy'],promo:-1,main:0},
  cocky:{d:'A loudmouth who thinks they are better than you.',best:['std'],mt:['1v1'],hot:['hero','underdog','oldhand','rebel'],flat:['comedy','cocky'],promo:4,main:1},
  underdog:{d:'The one nobody expects to win, and the crowd wants to.',best:['ladder','cage'],mt:['3way','4way','br'],hot:['monster','brute','cocky'],flat:['underdog'],promo:0,main:0},
  daredevil:{d:'Throws themselves off anything high.',best:['ladder','tables','cell'],mt:['3way','4way','tag','6man','br'],hot:['daredevil','technician'],flat:['monster'],promo:-1,main:0},
  technician:{d:'Knows every hold there is.',best:['sub','iron'],mt:['1v1'],hot:['technician','brute','workhorse'],flat:['comedy','monster'],promo:-1,main:0},
  monster:{d:'A giant who walks through people.',best:['cage','nodq','street','cell'],mt:['1v1'],hot:['hero','underdog'],flat:['monster','daredevil'],promo:-2,main:1},
  oldhand:{d:'A veteran who has seen it all and makes others look good.',best:['std','iron'],mt:['1v1','tag'],hot:['cocky','rebel','underdog'],flat:['oldhand'],promo:2,main:0},
  rebel:{d:'Answers to nobody, least of all the boss.',best:['street','hardcore','nodq'],mt:['1v1'],hot:['cocky','hero','oldhand'],flat:['rebel'],promo:3,main:1},
  hero:{d:'The clean-cut good guy the crowd believes in.',best:['std','ladder','cage'],mt:['1v1','tag'],hot:['cocky','monster','outlaw','brute','mystic'],flat:['hero'],promo:1,main:1},
  showman:{d:'Lives for the spotlight and the entrance.',best:['ladder','std'],mt:['1v1','3way','4way'],hot:['cocky','mystic','hero'],flat:['technician'],promo:4,main:1},
  mystic:{d:'Dark, strange and hard to read.',best:['cell','fire','cage'],mt:['1v1'],hot:['hero','showman'],flat:['comedy'],promo:2,main:0},
  workhorse:{d:'Gives you a great match every single night.',best:['iron','std'],mt:['1v1','tag','3way'],hot:['workhorse','technician'],flat:['comedy'],promo:-1,main:0,long:1},
  outlaw:{d:'A lawless brawler with a gang behind them.',best:['hardcore','street','tables','nodq'],mt:['tag','6man','1v1'],hot:['hero','technician','oldhand'],flat:['outlaw'],promo:2,main:0},
  comedy:{d:'Here to make the crowd laugh, and sometimes win.',best:['lumber'],mt:['6man','tag','br'],hot:['cocky'],flat:['comedy','monster','technician','mystic'],promo:3,main:-1}
};
$L.GFX = GFX;
export var GIM_WORDS=[
  [/skate|daredevil|stunt|flyer|high-fly|highlight|jet|lightning|luchador|rope|sky|air|flash|speed|kick|bounce/i,'daredevil'],
  [/showman|flamboyant|starlet|glamour|peacock|rapper|glitter|singing|sequin|timeless|hollywood|pinup|goddess|pop star/i,'showman'],
  [/cocky|smug|better than|ceo|boss|rich|salt of the earth|mogul|pitchman|patriarch|realest|alpha|executive|vice president/i,'cocky'],
  [/lazy|comedy|bubblegum|jingle|clown|pocket|laugh|laziest/i,'comedy'],
  [/goth|witch|mystic|alien|outer space|galaxy|phantom|dark|gloom|ghost/i,'mystic'],
  [/technician|submission|holds|best bout|professor|wizard|pretzel|catch|grappl|leg lock|technical/i,'technician'],
  [/workhorse|machine|strongman|swiss|clockwork|best wrestler|union/i,'workhorse'],
  [/monster|giant|beast|megasaurus|destroyer|landslide|mountain|island choke|powerhouse/i,'monster'],
  [/outlaw|cowboy gang|biker|gang|violence|bleeding|street fighter|purveyor/i,'outlaw'],
  [/hardcore|brawler|hurt|backbreaker|nastiest|rock-hard|knife|bronx|backhand/i,'brute'],
  [/rebel|punk|answers to nobody|riot/i,'rebel'],
  [/veteran|legend|ageless|forever|icon|\bdad\b|natural/i,'oldhand'],
  [/underdog|organic|rising|prodigy|teen|prospect|kid/i,'underdog'],
  [/hero|clean-cut|patriot|babe with the power|power|cowboy|sorry/i,'hero']
];
$L.GIM_WORDS = GIM_WORDS;
/* the gimmick a character's own words point to, or null */
export function gimFromWords(S,w){
  var ps=typeof E.persona==='function'?E.persona(S,w.id):null;if(!ps)return null;
  // the character's category says it best; the longer description only when the category says nothing
  var tries=[ps.cat||'',ps.d||''];
  for(var t=0;t<tries.length;t++){if(!tries[t])continue;for(var i=0;i<$L.GIM_WORDS.length;i++)if($L.GIM_WORDS[i][0].test(tries[t]))return $L.GIM_WORDS[i][1];}
  return null;
}
/* the gimmick the ratings fit best of all fourteen */
export function gimBestFit(w){var best=null,bs=-1;GIMS.forEach(function(g){var s=g.f(w);if(s>bs){bs=s;best=g.id;}});return best;}
export function gimSmart(S){S.w.forEach(function(w){if(w.nw)return;var gw=gimFromWords(S,w),g=gw||gimBestFit(w);if(g&&GIMBY[g]){w.gim=g;w.gw=0;if(gw)w.gwd=g;}});}
/* a gimmick that is who the character is fits them, whatever the numbers say */
(function(){var gf=$L.gimFit;$L.gimFit=function(w){var v=gf.apply(this,arguments);return w&&w.gwd&&w.gwd===w.gim?Math.max(v,72):v;};})();
NEWX.push(function(S){if(!S.custom)gimSmart(S);});
export function gfx(w){return w&&w.gim?$L.GFX[w.gim]:null;}
export function gimStip(stip){var s=String(stip||'std').toLowerCase().replace(/[^a-z]/g,'');return s==='standard'?'std':(s==='steelcage'?'cage':(s==='steelcell'?'cell':(s==='ringoffire'?'fire':(s==='ironman'?'iron':(s==='submission'?'sub':(s==='lumberjack'?'lumber':s))))));}
/** How a pairing of two gimmicks reads: 1 hot, -1 flat, 0 neither. */
export function gimPair(a,b){var A=gfx(a),B=gfx(b);if(!A||!B)return 0;if(A.hot.indexOf(b.gim)>=0||B.hot.indexOf(a.gim)>=0)return 1;if(A.flat.indexOf(b.gim)>=0||B.flat.indexOf(a.gim)>=0)return -1;return 0;}
/* the match: gimmicks that fit the rules, the kind of match and the spot on the card, and a hot or flat pairing */
CRX.push(function(ctx){
  if(!ctx||!ctx.all||!ctx.all.length)return null;var st=gimStip(ctx.stip),mt=ctx.m&&ctx.m.mt||'1v1',d=0,fit=null,pair=0;
  ctx.all.forEach(function(w){var G=gfx(w);if(!G)return;
    if(st!=='std'&&G.best.indexOf(st)>=0){d+=0.9;fit=fit||w;}
    if(G.mt.indexOf(mt)>=0)d+=0.25;
    if(G.long&&ctx.mins>=20)d+=0.6;
    if(ctx.isMain)d+=0.35*G.main;
  });
  d/=Math.max(1,ctx.all.length)/2;
  if(ctx.sides&&ctx.sides.length>=2){var a=ctx.sides[0][0],b=ctx.sides[1][0];pair=gimPair(a,b);d+=pair*0.8;}
  d=clamp(d,-1.5,2);if(Math.abs(d)<0.3)return null;
  var x=pair>0&&ctx.sides?GIMBY[ctx.sides[0][0].gim].n+' against '+GIMBY[ctx.sides[1][0].gim].n.toLowerCase()+': a pairing the crowd wants':(fit?fit.name+' is in their element':(pair<0?'The characters did not mesh':null));
  return {d:d,x:x};
});
/* a feud: a hot pairing heats faster, a flat one slower */
(function(){
  var hu=$L.heatUp;
  $L.heatUp=function(S,f,amt,txt){
    if(amt>0&&f&&f.a&&f.b&&S.w[f.a[0]]&&S.w[f.b[0]]){var p=gimPair(S.w[f.a[0]],S.w[f.b[0]]);if(p)amt*=p>0?1.2:0.8;}
    return hu.call(this,S,f,amt,txt);
  };
})();
/* a promo: the gimmick decides how much the microphone matters */
(function(){
  var sm=$L.segMean;
  $L.segMean=function(S,w,bonus){var v=sm.apply(this,arguments),G=gfx(w);return G?v+G.promo*0.9:v;};
})();
/** What a wrestler's gimmick is good for, for the screens. */
E.gimInfo=function(S,id){var w=S.w[id];if(!w||!w.gim||!$L.GFX[w.gim])return null;var G=$L.GFX[w.gim],nm=function(k){return GIMBY[k]?GIMBY[k].n.toLowerCase():k;};
  var SN={std:'standard matches',hardcore:'hardcore matches',street:'street fights',tables:'tables matches',nodq:'no disqualification',cage:'cage matches',cell:'the steel cell',fire:'the ring of fire',ladder:'ladder matches',sub:'submission matches',iron:'iron man matches',lumber:'lumberjack matches'};
  var MN={'1v1':'one on one','tag':'tag matches','3way':'triple threats','4way':'four-ways','6man':'six-man tags','br':'battle royals'};
  return {id:w.gim,n:GIMBY[w.gim].n,d:G.d,fit:$L.gimFit(w),best:G.best.map(function(k){return SN[k]||k;}),mt:G.mt.map(function(k){return MN[k]||k;}),hot:G.hot.map(nm),flat:G.flat.map(nm),
    promo:G.promo>=3?'a show-stealer on the microphone':G.promo>=1?'good on the microphone':G.promo<=-2?'lets their fists talk':G.promo<0?'better in the ring than on the microphone':'fine on the microphone',
    main:G.main>0?'The crowd buys them at the top of the card.':G.main<0?'Hard to take seriously in a main event.':''};};
E.GFX=GFX;

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.GFX = GFX;
$L.GIM_WORDS = GIM_WORDS;
$L.gimFromWords = gimFromWords;
$L.gimBestFit = gimBestFit;
$L.gimSmart = gimSmart;
$L.gfx = gfx;
$L.gimStip = gimStip;
$L.gimPair = gimPair;
