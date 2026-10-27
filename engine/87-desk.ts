// @ts-nocheck
/* Moved from src/87-desk.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.mkVoices = mkVoices; $L.deskWage = deskWage; $L.voiceOf = voiceOf; $L.voiceChem = voiceChem; $L.deskQ = deskQ; $L.deskHeat = deskHeat; $L.deskNames = deskNames;
/* ---------- 19. The commentary desk: a play-by-play voice and a colour voice, signed like anyone else, with chemistry between them (S.voices, P.desk) ---------- */
export var VSTYLE={hot:'Excitable',dry:'Dry',warm:'Warm'};
$L.VSTYLE = VSTYLE;
export function mkVoices(S,n){
  var I=S.db&&S.db.indie;if(!I)return;S.voices=S.voices||[];var have={};S.voices.forEach(function(v){have[v.name]=1;});
  for(var i=0;i<n;i++){
    var g=$L.chance(S,0.3)?'F':'M',nm,t=0;do{nm=$L.pick(S,g==='F'?I.firstF:I.firstM)+' '+$L.pick(S,I.last);}while(have[nm]&&t++<40);if(have[nm])continue;have[nm]=1;
    var pbp=$L.ri(S,35,88),col=$L.ri(S,35,88);
    S.voices.push({id:S.nid++,name:nm,g:g,pbp:pbp,col:col,style:$L.pick(S,['hot','dry','warm']),wage:Math.round((300+(pbp+col)*6)/50)*50,hired:null,added:S.week});
  }
}
$L.NEWX.push(function(S){S.voices=[];$L.mkVoices(S,8);});
$L.WEEKX.push(function(S){if(S.cal||S.week%52!==0)return;S.voices=(S.voices||[]).filter(function(v){return v.hired||S.week-v.added<156;});$L.mkVoices(S,2);});
export function deskWage(S,P){
  if(!P||P.id!==S.player||!P.desk)return 0;var t=0;['pbp','col'].forEach(function(k){var v=$L.voiceOf(S,P.desk[k]);if(v)t+=v.wage;});return t;
}
export function voiceOf(S,id){if(id==null)return null;for(var i=0;i<(S.voices||[]).length;i++)if(S.voices[i].id===id)return S.voices[i];return null;}
/* two voices work well together when their styles pair (hot with dry, warm with anybody) and by the luck of a pair */
export function voiceChem(S,a,b){
  if(!a||!b)return 0;var k=S.seed+':v'+Math.min(a.id,b.id)+'-'+Math.max(a.id,b.id),base=($L.h01('vc'+k)-0.5)*3;
  var pair=(a.style==='hot'&&b.style==='dry')||(a.style==='dry'&&b.style==='hot')?1.2:(a.style===b.style?-0.8:0.2);
  return Math.round($L.clamp(base+pair,-3,3)*10)/10;
}
export function deskQ(S,P){
  var d=P.desk||{},a=$L.voiceOf(S,d.pbp),b=$L.voiceOf(S,d.col);
  var sa=a?a.pbp:35,sb=b?b.col:35,ch=a&&b?$L.voiceChem(S,a,b):0;
  return (sa+sb)/2+ch*5;
}
export function deskHeat(S,pid){var P=S.promos[pid];if(!P||pid!==S.player||!P.desk)return 1;return 1+$L.clamp(($L.deskQ(S,P)-55)/250,-0.1,0.2);}
$L.CRX.push(function(ctx){
  var P=ctx.P;if(!ctx.isPl||ctx.S.cal||!P.desk)return null;
  var q=$L.deskQ(ctx.S,P),d=$L.clamp((q-55)/25,-0.5,1.6);
  if(Math.abs(d)<0.3)return null;
  return {d:d,x:d>0?'The commentary desk lifted it':'The commentary desk let it down'};
});
$L.E.voices=function(S){
  var P=S.promos[S.player],D=P.desk||{};if(!S.voices){S.voices=[];$L.mkVoices(S,8);}
  return {pool:(S.voices||[]).filter(function(v){return !v.hired;}).map(function(v){return {id:v.id,name:v.name,pbp:v.pbp,col:v.col,style:$L.VSTYLE[v.style],wage:v.wage,
      chemPbp:$L.voiceOf(S,D.col)?$L.voiceChem(S,v,$L.voiceOf(S,D.col)):null,chemCol:$L.voiceOf(S,D.pbp)?$L.voiceChem(S,v,$L.voiceOf(S,D.pbp)):null};}),
    pbp:$L.voiceOf(S,D.pbp),col:$L.voiceOf(S,D.col),
    chem:$L.voiceOf(S,D.pbp)&&$L.voiceOf(S,D.col)?$L.voiceChem(S,$L.voiceOf(S,D.pbp),$L.voiceOf(S,D.col)):null,
    q:Math.round($L.deskQ(S,P)),cost:$L.deskWage(S,P)};
};
$L.E.chemWord=function(v){return v==null?'':(v>=1.5?'They click':(v<=-1.5?'They talk over each other':'Workable'));};
$L.E.hireVoice=function(S,id,seat){
  var P=S.promos[S.player],v=$L.voiceOf(S,id);if(!v||v.hired)return {ok:false,text:'That voice is not available.'};
  if(seat!=='pbp'&&seat!=='col')return {ok:false,text:'Pick a seat.'};
  P.desk=P.desk||{pbp:null,col:null};
  if(P.desk[seat]!=null)$L.E.dropVoice(S,seat);
  v.hired=P.id;P.desk[seat]=v.id;
  return {ok:true,text:v.name+' takes the '+(seat==='pbp'?'play-by-play':'colour')+' chair at '+$L.money(v.wage)+' a week.'};
};
$L.E.dropVoice=function(S,seat){
  var P=S.promos[S.player],D=P.desk;if(!D||D[seat]==null)return {ok:false,text:'Nobody is in that chair.'};
  var v=$L.voiceOf(S,D[seat]);if(v)v.hired=null;D[seat]=null;return {ok:true,text:'The chair is empty.'};
};
/* the names on the air: both chairs filled means they replace the announcers from the universe file */
export function deskNames(S,P){
  if(!P||P.id!==S.player||!P.desk)return null;var a=$L.voiceOf(S,P.desk.pbp),b=$L.voiceOf(S,P.desk.col);
  return a||b?[a?a.name:P.ann[0],b?b.name:P.ann[1]]:null;
}

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.VSTYLE = VSTYLE;
$L.mkVoices = mkVoices;
$L.deskWage = deskWage;
$L.voiceOf = voiceOf;
$L.voiceChem = voiceChem;
$L.deskQ = deskQ;
$L.deskHeat = deskHeat;
$L.deskNames = deskNames;
