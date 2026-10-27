// @ts-nocheck
/* Moved from src/93-stipworld.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.stipBase = stipBase; $L.stipClean = stipClean; $L.stipSync = stipSync; $L.edStipPut = edStipPut;
/* wraps: 78-models.js (it must sort after them; test-buildorder.js checks) */
/* A world's own match rules: made in the World Editor's Match rules tab, kept in the world package (pkg.stips),
   carried into a game (S.db.stips) and picked on the card like the included rules. A new rule is built on an
   included one (its base): it fights like the base, wears and hurts like it and needs the same heat, and has its own
   name, the set it is played in on the broadcast, the note the booker reads and the lines the commentators say.
   An entry with the id of an included rule changes that rule for the world (name, set, note, lines) and can be put
   back. Ids of new rules start with c_. Nothing here calls rnd(S). */
export var STIP_SETS=[['','The ring'],['cage','A steel cage'],['cell','The cell, with its roof'],['inferno','A ring of fire'],['ladder','A belt hung over the ring'],['ballroom','A ballroom'],['gym','A gym'],['bigstadium','A stadium']];
$L.STIP_SETS = STIP_SETS;
/** The rules a new one can be built on: the ones whose effects are all in their numbers. */
export var STIP_BASES=['std','hardcore','tables','ladder','cage','cell','fire','sub'];
$L.STIP_BASES = STIP_BASES;
$L.STIP.cage.set='cage';$L.STIP.cell.set='cell';$L.STIP.fire.set='inferno';$L.STIP.ladder.set='ladder';
export var STIP0={},STIPNOTE0={},STIPLINE0={},STIPNEED0={};
$L.STIP0 = STIP0; $L.STIPNOTE0 = STIPNOTE0; $L.STIPLINE0 = STIPLINE0; $L.STIPNEED0 = STIPNEED0;
Object.keys($L.STIP).forEach(function(k){$L.STIP0[k]=$L.STIP[k];$L.STIPNOTE0[k]=$L.E.STIPNOTE[k];$L.STIPLINE0[k]=$L.STIPLINE[k];$L.STIPNEED0[k]=$L.STIP_NEED[k];});
/** The included rule a rule fights like. */
export function stipBase(k){var s=$L.STIP[k];return (s&&s.base)||k;}
export function stipClean(k){
  if(!k||typeof k!=='object')return null;
  var txt=function(v,n){return String(v==null?'':v).replace(/\s+/g,' ').trim().slice(0,n);};
  var set=$L.STIP_SETS.some(function(x){return x[0]===k.set;})?k.set:'',lines=(Array.isArray(k.lines)?k.lines:[]).map(function(x){return txt(x,120);}).filter(Boolean).slice(0,3);
  var id=String(k.id||'');
  if($L.STIP0[id]&&id!=='std')return {id:id,over:1,n:txt(k.n,24)||$L.STIP0[id].n,set:k.set==null?($L.STIP0[id].set||''):set,d:txt(k.d,160),lines:lines};
  if(!/^c_[a-z0-9_]{1,40}$/.test(id))id='c_'+(txt(k.n,24).toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_|_$/g,'')||'rule');
  return {id:id,n:txt(k.n,24)||'My match',base:$L.STIP_BASES.indexOf(k.base)>=0?k.base:'std',set:set,d:txt(k.d,160),lines:lines};
}
/** The world's rules into STIP for this game, and out again when another game or world is loaded. */
export function stipSync(S){
  var L=S&&S.db&&Array.isArray(S.db.stips)?S.db.stips:[],key=JSON.stringify(L);
  if($L.stipSync.key===key)return;$L.stipSync.key=key;
  Object.keys($L.STIP).forEach(function(k){if(!$L.STIP0[k]){delete $L.STIP[k];delete $L.E.STIPNOTE[k];delete $L.STIPLINE[k];delete $L.STIP_NEED[k];}});
  Object.keys($L.STIP0).forEach(function(k){$L.STIP[k]=$L.STIP0[k];$L.E.STIPNOTE[k]=$L.STIPNOTE0[k];if($L.STIPLINE0[k])$L.STIPLINE[k]=$L.STIPLINE0[k];else delete $L.STIPLINE[k];if($L.STIPNEED0[k]!=null)$L.STIP_NEED[k]=$L.STIPNEED0[k];});
  L.forEach(function(k0){var k=$L.stipClean(k0);if(!k)return;
    var B=$L.STIP0[k.over?k.id:k.base],o={};Object.keys(B).forEach(function(x){o[x]=B[x];});o.n=k.n;o.set=k.set||undefined;
    if(k.over){o.over=1;$L.STIP[k.id]=o;}else{if($L.STIP0[k.id])return;o.base=k.base;o.custom=1;$L.STIP[k.id]=o;if($L.STIPNEED0[k.base]!=null)$L.STIP_NEED[k.id]=$L.STIPNEED0[k.base];}
    $L.E.STIPNOTE[k.id]=k.d||$L.STIPNOTE0[k.over?k.id:k.base]||(k.over?'':'A match made for this world.');
    var ln=k.lines.length?k.lines:$L.STIPLINE0[k.over?k.id:k.base];if(ln)$L.STIPLINE[k.id]=ln;else delete $L.STIPLINE[k.id];});
}
(function(){
  var attach0=$L.E.attach,new0=$L.E.newGame;
  $L.E.attach=function(S){var r=attach0.apply(this,arguments);$L.stipSync(S);return r;};
  $L.E.newGame=function(){var S=new0.apply(this,arguments);$L.stipSync(S);return S;};
  // a rule built on a gimmick match counts as one
  var gim0=$L.isGim;$L.isGim=function(k){return gim0($L.stipBase(k));};
})();
$L.WEEKX.push(function(S){$L.stipSync(S);});

/* ---------- the World Editor ---------- */
$L.E.STIP0=STIP0;$L.E.STIP_SETS=STIP_SETS;$L.E.STIP_BASES=STIP_BASES;$L.E.stipClean=stipClean;
$L.E.stipNote0=function(k){return $L.STIPNOTE0[k]||'';};$L.E.stipLines0=function(k){return ($L.STIPLINE0[k]||[]).slice();};
/** A world's rules, cleaned: its own and the included ones it has changed. */
$L.E.edStips=function(pkg){return (Array.isArray(pkg.stips)?pkg.stips:[]).map($L.stipClean).filter(Boolean);};
export function edStipPut(pkg,k){var L=Array.isArray(pkg.stips)?pkg.stips:(pkg.stips=[]),i=L.findIndex(function(x){return x&&x.id===k.id;});if(i>=0)L[i]=k;else L.push(k);}
/** Keep one rule (a whole record). Returns it as kept. */
$L.E.edSetStip=function(pkg,k){var c=$L.stipClean(k);if(!c)return null;$L.edStipPut(pkg,c);return c;};
/** A new rule for this world, built on an included one. */
$L.E.edNewStip=function(pkg,base){
  var L=$L.E.edStips(pkg),n=1,id;do{id='c_rule_'+n++;}while(L.some(function(x){return x.id===id;}));
  var b=$L.STIP_BASES.indexOf(base)>=0?base:'cage',k=$L.stipClean({id:id,n:'New match',base:b,set:$L.STIP0[b].set||''});$L.edStipPut(pkg,k);return k;
};
/** Change an included rule for this world, starting from how it ships. */
$L.E.edOverStip=function(pkg,id){if(!$L.STIP0[id]||id==='std')return null;var k=$L.stipClean({id:id,n:$L.STIP0[id].n,set:$L.STIP0[id].set||'',d:'',lines:[]});$L.edStipPut(pkg,k);return k;};
/** Take a world's rule out, or put an included one back as it ships. */
$L.E.edRemoveStip=function(pkg,id){if(!Array.isArray(pkg.stips))return false;var n=pkg.stips.length;pkg.stips=pkg.stips.filter(function(x){return !x||x.id!==id;});if(!pkg.stips.length)delete pkg.stips;return n!==(pkg.stips||[]).length;};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.STIP_SETS = STIP_SETS;
$L.STIP_BASES = STIP_BASES;
$L.STIP0 = STIP0;
$L.STIPNOTE0 = STIPNOTE0;
$L.STIPLINE0 = STIPLINE0;
$L.STIPNEED0 = STIPNEED0;
$L.stipBase = stipBase;
$L.stipClean = stipClean;
$L.stipSync = stipSync;
$L.edStipPut = edStipPut;
