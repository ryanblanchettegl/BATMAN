/* ===== Nights (NEXT.md 7.5, a first step) =====
   Every weekly show has a night, read from its name. When a rival in the same part of the world runs a weekly show
   on the same night as yours, the two go head to head: your audience tonight against what theirs has been drawing. Of several on the night, the one nearest your size is the one you are measured against.
   Winning the night gets people talking (a little hype for your next show); the news keeps the count. Only reads
   the game and uses no rnd(S). */
var NIGHT_ALT={Lunes:'Monday',Martes:'Tuesday',Miercoles:'Wednesday',Jueves:'Thursday',Viernes:'Friday',Sabado:'Saturday',Domingo:'Sunday'};
function nightOf(sh){if(!sh||sh.big)return '';var d=showDay(sh);if(d)return d;for(var k in NIGHT_ALT)if(sh.name.indexOf(k)>=0)return NIGHT_ALT[k];return '';}
function regionOf(S,P){try{var c=roadRoute(S,P);var M=c&&c.length?roadMap(S,c):null;return M?M.id:null;}catch(e){return null;}}
/** The rival weekly shows on the same night as one of yours, in the same part of the world. */
function nightRivals(S,show){var P=S.promos[S.player],d=nightOf(show),reg=regionOf(S,P),out=[];if(!d||!reg)return out;
  S.order.forEach(function(id){if(id===P.id)return;var R=S.promos[id];if(R.dead||regionOf(S,R)!==reg)return;
    (R.shows||[]).forEach(function(sh){if(!sh.big&&nightOf(sh)===d){var a=airRec(R,sh.id);out.push({co:R.name,n:sh.name,va:a&&a.va?Math.round(a.va):0});}});});
  return out;}
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player||show.big)return;var L=nightRivals(S,show).filter(function(x){return x.va>0;});if(!L.length)return;
  var me=airRec(P,show.id),base=me&&me.va?me.va:rep.viewers,R=L.sort(function(a,b){return Math.abs(a.va-base)-Math.abs(b.va-base);})[0],won=rep.viewers>=R.va,d=nightOf(show),W=(S.nw||(S.nw={}))[d]||(S.nw[d]={w:0,l:0});
  if(won){W.w++;S.hype=(S.hype||0)+0.02;}else W.l++;
  rep.h2h={day:d,co:R.co,n:R.n,us:rep.viewers,them:R.va,won:won?1:0,w:W.w,l:W.l};
  if((W.w+W.l)%4===0)news(S,'world','The '+d+' night war: '+show.name+' has won '+W.w+' and lost '+W.l+' against '+R.n+'.');
});
E.nightRivals=function(S,show){return nightRivals(S,show);};
