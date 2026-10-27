/* Moved from src/93-segworld.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
import { E, clamp, feudOf, rnd, startFeud } from './00-core';
import { addOvr } from './10-match';
import { angle } from './20-story';
import { micOf } from './60-rpg';
import { relBump } from './66-relations';
import { SEGK, segLen, segMins, segWhy } from './93-segments';
$L.segoClean = segoClean; $L.segkClean = segkClean; $L.segkSync = segkSync;
/* A world's own promos and angles (TASKS.md 0u, rule 9c): made in the World Editor's Stories tab, kept in the world
   package (pkg.segkinds), carried into a game (S.db.segkinds) and booked on the run sheet like the game's own kinds.
   Each says who is in it (one or two), which scene plays, and what it does: heats a feud or starts one, moves how
   the two feel about each other (relBump), gives the one who leads it a lift. Ids start with c_. */
export var SEGFX=[['none','Nothing beyond the segment'],['heat','Heats the feud they have'],['start','Starts a feud, or heats theirs']];
$L.SEGFX = SEGFX;
export var SEGHEAT=[[4,'A little'],[8,'Some'],[12,'A lot']];
$L.SEGHEAT = SEGHEAT;
export var SEGBOND=[[8,'Closer friends'],[0,'No change'],[-8,'Worse enemies']];
$L.SEGBOND = SEGBOND;
/** The game's own kinds as they ship, so a world can change one (its name, what the booker reads, the characters'
    labels, the scene it plays, the report's line) and put it back. What it does in the game stays the game's. */
export var SEGK0={};
$L.SEGK0 = SEGK0;Object.keys(SEGK).forEach(function(k){$L.SEGK0[k]=SEGK[k];});
export function segoClean(k){
  var txt=function(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n);},B=$L.SEGK0[k.id];
  var roles=B.roles.map(function(r,i){return txt(Array.isArray(k.roles)?k.roles[i]:'',24)||r;});
  return {id:k.id,over:1,n:txt(k.n,28)||B.n,t:B.t,roles:roles,d:txt(k.d,160),scene:txt(k.scene,60),line:txt(k.line,160)};
}
export function segkClean(k){
  if(!k||typeof k!=='object')return null;
  var txt=function(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n);},pick=function(L,v,d){for(var i=0;i<L.length;i++)if(String(L[i][0])===String(v))return L[i][0];return d;};
  var id=String(k.id||'');if($L.SEGK0[id]&&id!=='writers')return segoClean(k);
  if(!/^c_[a-z0-9_]{1,40}$/.test(id))id='c_'+(txt(k.n,28).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'story');
  var roles=(Array.isArray(k.roles)?k.roles:[]).map(function(r){return txt(r,24);}).filter(Boolean).slice(0,2);if(!roles.length)roles=['Who it is about'];
  return {id:id,n:txt(k.n,28)||'My segment',t:k.t==='angle'?'angle':'promo',roles:roles,d:txt(k.d,160),fx:pick($L.SEGFX,k.fx,'none'),heat:pick($L.SEGHEAT,k.heat,8),bond:pick($L.SEGBOND,k.bond,0),
    lift:k.lift?1:0,scene:txt(k.scene,60),line:txt(k.line,160)};
}
/** The world's own kinds into SEGK for this game (and out again when another game or world is loaded). */
export function segkSync(S){
  var L=S&&S.db&&Array.isArray(S.db.segkinds)?S.db.segkinds:[],key=L.map(function(k){return k&&k.id;}).join(',');
  if(SEGK.__key===key)return;
  Object.keys(SEGK).forEach(function(k){if(SEGK[k]&&SEGK[k].custom)delete SEGK[k];});
  Object.keys($L.SEGK0).forEach(function(k){SEGK[k]=$L.SEGK0[k];});
  L.forEach(function(k0){var k: any=segkClean(k0);if(!k)return;
    if(k.over){var B=$L.SEGK0[k.id],o: any={};Object.keys(B).forEach(function(x){o[x]=B[x];});o.n=k.n;o.roles=k.roles;if(k.d)o.d=k.d;o.over=k;SEGK[k.id]=o;return;}
    if(SEGK[k.id])return;SEGK[k.id]={len:'M',n:k.n,t:k.t,roles:k.roles,d:k.d||(k.t==='promo'?'A promo made for this world.':'An angle made for this world.'),custom:k};});
  Object.defineProperty(SEGK,'__key',{value:key,writable:true,configurable:true,enumerable:false});
}
(function(){
  var list0=$L.segList,read0=$L.segRead,booked0=$L.segBooked,choices0=$L.segChoices,look0=$L.segLook,label0=$L.segLabel,run0=$L.runSeg;
  $L.segList=function(S){segkSync(S);return list0(S);};
  $L.segRead=function(S){segkSync(S);return read0(S);};
  $L.segBooked=function(S,show,n){segkSync(S);return booked0(S,show,n);};
  $L.segChoices=function(S,kind,who,slot){var K=SEGK[kind];if(K&&K.custom)return choices0(S,K.roles.length>1?'callout':'interview',who,slot);return choices0(S,kind,who,slot);};
  $L.segLook=function(S,sg,slot){
    var K=sg&&SEGK[sg.k];if(!K||!K.custom)return look0(S,sg,slot);
    var why=segWhy(S,sg,slot);if(why)return {ok:false,why:why};
    var c=K.custom,a=S.w[sg.who[0]],b=sg.who[1]!=null?S.w[sg.who[1]]:null,f=b?feudOf(S,a.id,b.id):null,notes=[],mid;
    if(c.t==='promo')mid=$L.segMean(S,b&&micOf(S,b)>micOf(S,a)?b:a,2);else mid=0.8*(a.ovr+(b?b.ovr:a.ovr))/2+6;
    if(c.fx==='heat')notes.push(f?[1,'It heats the feud they have']:[-1,'They have no feud for it to heat']);
    if(c.fx==='start')notes.push([1,f?'It heats the feud they have':'It starts a rivalry']);
    if(c.bond>0&&b)notes.push([1,'They come out of it closer']);if(c.bond<0&&b)notes.push([-1,'They come out of it worse enemies']);
    if(c.lift)notes.push([1,a.name+' looks good if it goes well']);
    mid=clamp(Math.round(mid),5,99);return {ok:true,mid:mid,lo:clamp(mid-4,5,99),hi:clamp(mid+4,5,99),notes:notes,mins:segMins(sg)};
  };
  $L.segLabel=function(S,sg){var K=SEGK[sg.k];if(!K||!K.custom)return label0(S,sg);var n=sg.who.map(function(id){return S.w[id]?S.w[id].name:'?';});return K.n+': '+n.join(' and ');};
  $L.runSeg=function(S,P,show,ctx,sg,slot,opens){
    var K=sg&&SEGK[sg.k];
    if(K&&K.over){var r0=run0(S,P,show,ctx,sg,slot,opens);if(r0&&K.over.line){var n0=sg.who.map(function(id){return S.w[id]?S.w[id].name:'';});r0.text=K.over.line.replace(/\{a\}/g,n0[0]||'').replace(/\{b\}/g,n0[1]||'').replace(/\{c\}/g,n0[2]||'')+(r0.ov>=72?' The crowd loves it.':(r0.ov<45?' It falls flat.':''));}return r0;}
    if(!K||!K.custom)return run0(S,P,show,ctx,sg,slot,opens);
    if(segWhy(S,sg,slot))return null;
    var c=K.custom,L=$L.segLook(S,sg,slot);if(!L.ok)return null;
    var ln=segLen(sg),hm=(c.t==='angle'?(ln==='L'?1.25:(ln==='S'?0.8:1)):(ln==='S'?0.85:1)),a=S.w[sg.who[0]],b=sg.who[1]!=null?S.w[sg.who[1]]:null,f=b?feudOf(S,a.id,b.id):null;
    sg.who.forEach(function(id){ctx.angled[id]=1;});
    var ov=L.mid+rnd(S)*8-4+(sg.mod||0),why=c.n+': '+a.name+(b?' and '+b.name:'');
    if(b&&c.fx==='start'&&!f)f=startFeud(S,P,b,a,20+c.heat,why,{force:true});
    else if(b&&f&&c.fx!=='none')$L.heatUp(S,f,c.heat*hm*clamp(0.6+(ov-50)/50,0.4,1.4),why);
    if(b&&c.bond)relBump(S,a.id,b.id,{bond:c.bond},{t:why,k:'segment'});
    if(c.lift&&ov>=60)addOvr(P,a,0.5);
    var line=c.line?c.line.replace(/\{a\}/g,a.name).replace(/\{b\}/g,b?b.name:''):(b?a.name+' and '+b.name+': '+c.n.toLowerCase()+'.':a.name+': '+c.n.toLowerCase()+'.');
    var r: any=angle(c.t==='promo'?'Promo':'Angle',line+(ov>=72?' The crowd loves it.':(ov<45?' It falls flat.':'')),ov);
    r.booked=c.id;r.ids=sg.who.slice();if(f&&f.id!=null)r.feud=f.id;return r;
  };
})();
E.SEGK0=SEGK0;E.SEGFX=SEGFX;E.SEGHEAT=SEGHEAT;E.SEGBOND=SEGBOND;E.segkClean=segkClean;
/** The World Editor: a world's own promos and angles. */
E.edSegKinds=function(pkg){return (pkg&&Array.isArray(pkg.segkinds)?pkg.segkinds:[]).map(segkClean).filter(Boolean);};
E.edSetSegKind=function(pkg,k){var c=segkClean(k);if(!pkg||!c)return null;var L=E.edSegKinds(pkg).filter(function(x){return x.id!==c.id;});L.push(c);pkg.segkinds=L;return c;};
E.edNewSegKind=function(pkg,t){var L=E.edSegKinds(pkg),n=1;while(L.some(function(x){return x.id==='c_story_'+n;}))n++;return E.edSetSegKind(pkg,{id:'c_story_'+n,n:(t==='angle'?'My angle ':'My promo ')+n,t:t==='angle'?'angle':'promo',roles:t==='angle'?['The attacker','Who gets attacked']:['Who talks','Who they talk to'],fx:'start',heat:8,bond:0});};
/** Change one of the game's own kinds for this world: a copy that starts as the game ships it. */
E.edOverSegKind=function(pkg,id){if(!$L.SEGK0[id]||id==='writers')return null;var have=E.edSegKinds(pkg).find(function(x){return x.id===id;});return have||E.edSetSegKind(pkg,{id:id,n:$L.SEGK0[id].n,roles:$L.SEGK0[id].roles});};
E.edRemoveSegKind=function(pkg,id){if(pkg&&Array.isArray(pkg.segkinds)){pkg.segkinds=pkg.segkinds.filter(function(x){return x&&x.id!==id;});if(!pkg.segkinds.length)delete pkg.segkinds;}};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.SEGFX = SEGFX;
$L.SEGHEAT = SEGHEAT;
$L.SEGBOND = SEGBOND;
$L.SEGK0 = SEGK0;
$L.segoClean = segoClean;
$L.segkClean = segkClean;
$L.segkSync = segkSync;
