/* ---------- 19. The commentary desk: a play-by-play voice and a colour voice, signed like anyone else, with chemistry between them (S.voices, P.desk) ---------- */
var VSTYLE={hot:'Excitable',dry:'Dry',warm:'Warm'};
function mkVoices(S,n){
  var I=S.db&&S.db.indie;if(!I)return;S.voices=S.voices||[];var have={};S.voices.forEach(function(v){have[v.name]=1;});
  for(var i=0;i<n;i++){
    var g=chance(S,0.3)?'F':'M',nm,t=0;do{nm=pick(S,g==='F'?I.firstF:I.firstM)+' '+pick(S,I.last);}while(have[nm]&&t++<40);if(have[nm])continue;have[nm]=1;
    var pbp=ri(S,35,88),col=ri(S,35,88);
    S.voices.push({id:S.nid++,name:nm,g:g,pbp:pbp,col:col,style:pick(S,['hot','dry','warm']),wage:Math.round((300+(pbp+col)*6)/50)*50,hired:null,added:S.week});
  }
}
NEWX.push(function(S){S.voices=[];mkVoices(S,8);});
WEEKX.push(function(S){if(S.cal||S.week%52!==0)return;S.voices=(S.voices||[]).filter(function(v){return v.hired||S.week-v.added<156;});mkVoices(S,2);});
function deskWage(S,P){
  if(!P||P.id!==S.player||!P.desk)return 0;var t=0;['pbp','col'].forEach(function(k){var v=voiceOf(S,P.desk[k]);if(v)t+=v.wage;});return t;
}
function voiceOf(S,id){if(id==null)return null;for(var i=0;i<(S.voices||[]).length;i++)if(S.voices[i].id===id)return S.voices[i];return null;}
/* two voices work well together when their styles pair (hot with dry, warm with anybody) and by the luck of a pair */
function voiceChem(S,a,b){
  if(!a||!b)return 0;var k=S.seed+':v'+Math.min(a.id,b.id)+'-'+Math.max(a.id,b.id),base=(h01('vc'+k)-0.5)*3;
  var pair=(a.style==='hot'&&b.style==='dry')||(a.style==='dry'&&b.style==='hot')?1.2:(a.style===b.style?-0.8:0.2);
  return Math.round(clamp(base+pair,-3,3)*10)/10;
}
function deskQ(S,P){
  var d=P.desk||{},a=voiceOf(S,d.pbp),b=voiceOf(S,d.col);
  var sa=a?a.pbp:35,sb=b?b.col:35,ch=a&&b?voiceChem(S,a,b):0;
  return (sa+sb)/2+ch*5;
}
function deskHeat(S,pid){var P=S.promos[pid];if(!P||pid!==S.player||!P.desk)return 1;return 1+clamp((deskQ(S,P)-55)/250,-0.1,0.2);}
CRX.push(function(ctx){
  var P=ctx.P;if(!ctx.isPl||ctx.S.cal||!P.desk)return null;
  var q=deskQ(ctx.S,P),d=clamp((q-55)/25,-0.5,1.6);
  if(Math.abs(d)<0.3)return null;
  return {d:d,x:d>0?'The commentary desk lifted it':'The commentary desk let it down'};
});
E.voices=function(S){
  var P=S.promos[S.player],D=P.desk||{};if(!S.voices){S.voices=[];mkVoices(S,8);}
  return {pool:(S.voices||[]).filter(function(v){return !v.hired;}).map(function(v){return {id:v.id,name:v.name,pbp:v.pbp,col:v.col,style:VSTYLE[v.style],wage:v.wage,
      chemPbp:voiceOf(S,D.col)?voiceChem(S,v,voiceOf(S,D.col)):null,chemCol:voiceOf(S,D.pbp)?voiceChem(S,v,voiceOf(S,D.pbp)):null};}),
    pbp:voiceOf(S,D.pbp),col:voiceOf(S,D.col),
    chem:voiceOf(S,D.pbp)&&voiceOf(S,D.col)?voiceChem(S,voiceOf(S,D.pbp),voiceOf(S,D.col)):null,
    q:Math.round(deskQ(S,P)),cost:deskWage(S,P)};
};
E.chemWord=function(v){return v==null?'':(v>=1.5?'They click':(v<=-1.5?'They talk over each other':'Workable'));};
E.hireVoice=function(S,id,seat){
  var P=S.promos[S.player],v=voiceOf(S,id);if(!v||v.hired)return {ok:false,text:'That voice is not available.'};
  if(seat!=='pbp'&&seat!=='col')return {ok:false,text:'Pick a seat.'};
  P.desk=P.desk||{pbp:null,col:null};
  if(P.desk[seat]!=null)E.dropVoice(S,seat);
  v.hired=P.id;P.desk[seat]=v.id;
  return {ok:true,text:v.name+' takes the '+(seat==='pbp'?'play-by-play':'colour')+' chair at '+money(v.wage)+' a week.'};
};
E.dropVoice=function(S,seat){
  var P=S.promos[S.player],D=P.desk;if(!D||D[seat]==null)return {ok:false,text:'Nobody is in that chair.'};
  var v=voiceOf(S,D[seat]);if(v)v.hired=null;D[seat]=null;return {ok:true,text:'The chair is empty.'};
};
/* the names on the air: both chairs filled means they replace the announcers from the universe file */
function deskNames(S,P){
  if(!P||P.id!==S.player||!P.desk)return null;var a=voiceOf(S,P.desk.pbp),b=voiceOf(S,P.desk.col);
  return a||b?[a?a.name:P.ann[0],b?b.name:P.ann[1]]:null;
}
