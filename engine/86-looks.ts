// @ts-nocheck
/* Moved from src/86-looks.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.lkStr = lkStr; $L.lkId = lkId; $L.lkNum = lkNum; $L.lkPrune = lkPrune; $L.lookClean = lookClean; $L.lkWorker = lkWorker; $L.lookFin = lookFin; $L.finProt = finProt;
/* ---------- Create a Player: a wrestler's look as a file (docs/plans/create-a-player.md) ----------
   A wrestler made in Create a Player is a small record in the shape Ryan set out (18 October): who they are, their
   body (height, weight, a body type and four sliders), three outfits (ring gear, entrance gear, street clothes),
   each with the parts worn, the colours of its palette slots and the lettering and shapes stuck on it, and their
   finishing moves. It is kept on the worker in a world package (`look`), carried onto the wrestler in a game
   (`w.look`), and written out as its own .wrestler.json file to share. The interface draws it (app/src/kit/caw.ts);
   nothing here plays a part in how a match goes yet, and nothing calls rnd(S). lookClean() keeps only what it knows,
   so a file from anywhere is safe to load. */
export var LOOK_ATTIRES=['primary_ring','entrance_gear','street_clothes'],LOOK_SLOTS=['primary','secondary','trim','hardware'],LOOK_PARTS=['head','upper_body','lower_body','footwear'];
$L.LOOK_ATTIRES = LOOK_ATTIRES; $L.LOOK_SLOTS = LOOK_SLOTS; $L.LOOK_PARTS = LOOK_PARTS;
export var LOOK_KICK=['Easy','Medium','Protected','Instant'],LOOK_POS=['Standing','Top Rope','Running','Counter'];
$L.LOOK_KICK = LOOK_KICK; $L.LOOK_POS = LOOK_POS;
export function lkStr(v,n){return typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').slice(0,n||40):undefined;}
export function lkId(v){return typeof v==='string'&&/^[#a-z0-9_ -]{1,48}$/i.test(v)?v:undefined;}
export function lkNum(v,a,b){return typeof v==='number'&&isFinite(v)?Math.max(a,Math.min(b,v)):undefined;}
export function lkPrune(o){Object.keys(o).forEach(function(k){if(o[k]===undefined)delete o[k];});return o;}
/** A clean copy of a look, or null when it is not one. */
export function lookClean(x){
  if(!x||typeof x!=='object'||Array.isArray(x))return null;
  var o=$L.lkPrune({id:$L.lkId(x.id),name:$L.lkStr(x.name,32),moniker:$L.lkStr(x.moniker,40),hometown:$L.lkStr(x.hometown,40),archetype:$L.lkStr(x.archetype,32)});
  var pa=x.physical_attributes;
  if(pa&&typeof pa==='object'){var ps=pa.proportional_scalers||{};
    o.physical_attributes=$L.lkPrune({sex:pa.sex==='F'||pa.sex==='M'?pa.sex:undefined,height_inches:$L.lkNum(pa.height_inches,58,96),weight_lbs:$L.lkNum(pa.weight_lbs,100,600),body_archetype:$L.lkId(pa.body_archetype),
      proportional_scalers:$L.lkPrune({torso_width:$L.lkNum(ps.torso_width,0.7,1.5),torso_height:$L.lkNum(ps.torso_height,0.8,1.25),limb_length:$L.lkNum(ps.limb_length,0.8,1.25),muscle_mass:$L.lkNum(ps.muscle_mass,0.6,1.6)})});}
  var ap=x.appearance;
  if(ap&&typeof ap==='object'){var f=null;if(ap.face&&typeof ap.face==='object'){f={};['h','hr','fh','ms','ey','ns','sk','hc'].forEach(function(k){var v=$L.lkNum(ap.face[k],0,100);if(v!=null)f[k]=Math.round(v);});}
    var shp=null;if(ap.shape&&typeof ap.shape==='object'){shp={};['head_w','head_h','jaw','chin','eye_size','eye_gap','eye_height','brow_thick','brow_angle','nose_w','nose_l','mouth_w','ears'].forEach(function(k){var v=$L.lkNum(ap.shape[k],-1,1);if(v)shp[k]=Math.round(v*100)/100;});if(!Object.keys(shp).length)shp=null;}
var ft=null;if(ap.features&&typeof ap.features==='object'){ft={};['eyes','nose','mouth','ears'].forEach(function(k){var v=$L.lkId(ap.features[k]);if(v)ft[k]=v;});if(!Object.keys(ft).length)ft=null;}
    o.appearance=$L.lkPrune({features:ft||undefined,shape:shp||undefined,face:f&&Object.keys(f).length?f:undefined,skin_tone:$L.lkNum(ap.skin_tone,0,100),hair_colour:$L.lkId(ap.hair_colour),facial_hair:$L.lkId(ap.facial_hair),face_paint:$L.lkId(ap.face_paint),paint_colour:$L.lkId(ap.paint_colour),
      paint_layers:Array.isArray(ap.paint_layers)?ap.paint_layers.filter(function(l){return l&&$L.lkId(l.k);}).slice(0,3).map(function(l){return $L.lkPrune({k:$L.lkId(l.k),c:$L.lkId(l.c)});}):undefined,
      tattoos:Array.isArray(ap.tattoos)?ap.tattoos.map($L.lkId).filter(function(v){return !!v;}).slice(0,8):undefined,
      hair_colour2:$L.lkId(ap.hair_colour2),hair_mix:$L.lkId(ap.hair_mix),body_hair:$L.lkNum(ap.body_hair,0,2),freckles:ap.freckles===true?true:undefined,mask_design:$L.lkId(ap.mask_design),
      cheeks:$L.lkId(ap.cheeks),eye_colour:$L.lkId(ap.eye_colour),mood:$L.lkId(ap.mood),hair_shine:ap.hair_shine===false?false:undefined,
      scars:Array.isArray(ap.scars)?ap.scars.map($L.lkId).filter(function(v){return !!v;}).slice(0,6):undefined});}
  if(x.attires&&typeof x.attires==='object'){var at={};$L.LOOK_ATTIRES.forEach(function(k){var a=x.attires[k];if(!a||typeof a!=='object')return;
    var eq=a.equipped_assets||{},e={};$L.LOOK_PARTS.forEach(function(p){var v=$L.lkId(eq[p]);if(v)e[p]=v;});
    if(Array.isArray(eq.accessories))e.accessories=eq.accessories.map($L.lkId).filter(function(v){return !!v;}).slice(0,8);
    var pal={};$L.LOOK_SLOTS.forEach(function(s){var v=$L.lkId((a.palette_slots||{})[s]);if(v)pal[s]=v;});
    var lay=(Array.isArray(a.custom_layers)?a.custom_layers:[]).slice(0,16).map(function(l){
      if(!l||(l.type!=='text_decal'&&l.type!=='shape_combiner'))return null;var pl=l.placement||{};
      var c=$L.lkPrune({type:l.type,string:l.type==='text_decal'?$L.lkStr(l.string,20):undefined,font:$L.lkId(l.font),shape_id:l.type==='shape_combiner'?$L.lkId(l.shape_id):undefined,
        placement:{x:$L.lkNum(pl.x,-20,20)||0,y:$L.lkNum(pl.y,-20,20)||0,z:$L.lkNum(pl.z,0,20)||0},palette_slot:$L.lkId(l.palette_slot),on:l.on==='lower_body'||l.on==='back'?l.on:undefined,
        arch:$L.lkNum(l.arch,-1,1),scale:$L.lkNum(l.scale,0.2,4),rot:$L.lkNum(l.rot,-180,180)});
      return (c.type==='text_decal'&&c.string)||(c.type==='shape_combiner'&&c.shape_id)?c:null;}).filter(function(l){return !!l;});
    var pcs={};['upper_body','lower_body','footwear'].forEach(function(q){var v=$L.lkId((a.part_colours||{})[q]);if(v)pcs[q]=v;});
    at[k]=$L.lkPrune({description:$L.lkStr(a.description,40),equipped_assets:e,palette_slots:pal,custom_layers:lay,part_colours:Object.keys(pcs).length?pcs:undefined});});
    if(Object.keys(at).length)o.attires=at;}
  if(Array.isArray(x.finishing_moves))o.finishing_moves=x.finishing_moves.slice(0,3).map(function(m){
    if(!m||typeof m!=='object'||!$L.lkStr(m.name,32))return null;
    return $L.lkPrune({name:$L.lkStr(m.name,32),impact_damage:$L.lkNum(m.impact_damage,1,100),kickout_difficulty:$L.LOOK_KICK.indexOf(m.kickout_difficulty)>=0?m.kickout_difficulty:undefined,
      position:$L.LOOK_POS.indexOf(m.position)>=0?m.position:undefined,category:$L.lkStr(m.category,24),preview_pose_id:$L.lkId(m.preview_pose_id),stage:['early','mid','late'].indexOf(m.stage)>=0?m.stage:undefined});}).filter(function(m){return !!m;});
  if(Array.isArray(x.taunts)){var tn=x.taunts.map($L.lkId).filter(function(v,i,a){return !!v&&a.indexOf(v)===i;}).slice(0,3);if(tn.length)o.taunts=tn;}   // up to three taunts, each a scene id
  var en=$L.lkId(x.entrance);if(en)o.entrance=en;   // one of the canned entrances
  if(x.entrance_fx&&typeof x.entrance_fx==='object'){var ef=$L.lkPrune({pyro:$L.lkId(x.entrance_fx.pyro),lights:$L.lkId(x.entrance_fx.lights),music:$L.lkStr(x.entrance_fx.music,32)||undefined});if(Object.keys(ef).length)o.entrance_fx=ef;}   // pyro, lights and their music
  if(x.portrait&&typeof x.portrait==='object'){var pt=x.portrait;o.portrait=$L.lkPrune({attire:$L.LOOK_ATTIRES.indexOf(pt.attire)>=0?pt.attire:undefined,expr:typeof pt.expr==='string'&&/^[a-z]{0,8}$/.test(pt.expr)?pt.expr:undefined,pose:$L.lkId(pt.pose),bg:$L.lkId(pt.bg),frame:pt.frame==='chest'||pt.frame==='head'?pt.frame:undefined});if(!Object.keys(o.portrait).length)delete o.portrait;}   // their portrait
  return Object.keys(o).length?o:null;
}
/** Is this a wrestler's look (a .wrestler.json file)? */
$L.E.lookOk=function(x){var c=$L.lookClean(x);return !!(c&&(c.attires||c.physical_attributes||c.appearance));};
$L.E.lookClean=lookClean;
export function lkWorker(pkg,id){return pkg&&Array.isArray(pkg.workers)?pkg.workers.filter(function(w){return w&&w.id===id;})[0]:null;}
/** The look a worker in a world package wears, or null. */
$L.E.edLook=function(pkg,id){var w=$L.lkWorker(pkg,id);return w&&w.look?$L.lookClean(w.look):null;};
/** Keep a look on a worker in the world. Returns false for anything that is not a look. */
$L.E.edSetLook=function(pkg,id,look){var w=$L.lkWorker(pkg,id),c=$L.lookClean(look);if(!w||!c||!$L.E.lookOk(c))return false;w.look=c;return true;};
$L.E.edRemoveLook=function(pkg,id){var w=$L.lkWorker(pkg,id);if(w)delete w.look;};
/** The look a wrestler in a game wears, or null (somebody never made in Create a Player). */
$L.E.lookOf=function(S,id){var w=S&&S.w[id];return w&&w.look?w.look:null;};

/* ---------- finishing moves in the match (docs/plans/create-a-player.md, next step 1) ----------
   A finisher from a wrestler's file changes how a finish lands, never who wins (the booker still decides that).
   People kick out of finishers: an easy one often, a medium one now and then on a big night, a protected one hardly
   ever (and the building comes apart when it happens), an instant one almost never. Every kick-out wears the move
   down (up to eight steps): it gets kicked out of a little more and lands a little lighter, and it comes back a step
   every month. Whoever kicks out gains momentum. A clean win with the move pays by how protected it is,
   how hard it hits and where it comes from. Kick-outs are picked by a hash of the match, never rnd(S). */
export function lookFin(w){var l=w&&w.look;return l&&l.finishing_moves&&l.finishing_moves[0]||null;}
export var FIN_KO={Easy:0.5,Medium:0.28,Protected:0.06,Instant:0.015},FIN_PAY={Easy:0.3,Medium:0.8,Protected:1.6,Instant:2.2};
$L.FIN_KO = FIN_KO; $L.FIN_PAY = FIN_PAY;
/** How much of its protection a wrestler's finisher still has, 1 when it has never been kicked out of. */
export function finProt(w){return 1/(1+(w.fko||0)*0.25);}
$L.FINX.push(function(ctx,fin,W,L,win){
  if(win<0||!W.length||!L.length||ctx.m.mt==='br'||fin==='dq'||fin==='co')return null;
  var S=ctx.S,w=W[0],l=L[0],d=0,xs=[],ko=null;
  var weight=(ctx.isMain||ctx.big?1:0.4)*(ctx.mins>=14?1:(ctx.mins>=10?0.5:0.2)),key=S.week+':'+ctx.i+':'+w.id+':'+l.id+':'+(ctx.show&&ctx.show.name||'');
  // the loser's finisher kicked out of by the winner, or the winner's own kicked out of before it finally lands
  [[l,w],[w,l]].forEach(function(p,k){
    if(ko)return;var who=p[0],by=p[1],f=$L.lookFin(who);if(!f)return;
    var pk=Math.min(0.85,($L.FIN_KO[f.kickout_difficulty]||$L.FIN_KO.Medium)+Math.min(8,who.fko||0)*0.025)*weight*(by.ovr>=who.ovr+10?1.3:1);
    if($L.h01(key+':fko'+k)<pk)ko={who:who,by:by,f:f,again:k===1};
  });
  if(ko){
    var lv=ko.f.kickout_difficulty||'Medium',huge=lv==='Protected'||lv==='Instant';
    d+=huge?3:1.5;xs.push(huge?ko.by.name+' kicked out of '+ko.f.name+', and nobody kicks out of that':'A kick-out from '+ko.f.name);
    if(!S.cal){ko.who.fko=Math.min(8,(ko.who.fko||0)+1);ko.by.mom=$L.clamp(ko.by.mom+(huge?2:1),-10,10);}
    ctx.fko={who:ko.who.name,by:ko.by.name,f:ko.f.name,huge:huge,again:ko.again};
  }
  var fw=$L.lookFin(w);
  if(fw&&fin==='clean'){
    var pay=($L.FIN_PAY[fw.kickout_difficulty]||$L.FIN_PAY.Medium)*$L.finProt(w)+((fw.impact_damage||0)>=85?0.5:0)+(fw.position==='Top Rope'?0.4:0);
    d+=pay;if(pay>=1)xs.push(fw.name+' put it away');ctx.fm=fw;
  }
  if(!d)return null;
  return {d:Math.min(4,Math.round(d*10)/10),x:xs.join('. ')};
});
$L.WEEKX.push(function(S){if(S.week%4!==0)return;S.w.forEach(function(w){if(w&&w.fko)w.fko--;});});
/** A wrestler's finisher as the screens show it: the move, and how much of its protection it still has. */
$L.E.finInfo=function(S,id){var w=S.w[id],f=$L.lookFin(w);return f?{name:f.name,kick:f.kickout_difficulty||'Medium',kicked:w.fko||0,prot:Math.round($L.finProt(w)*100)}:null;};

/* ---------- Create a Player in a game: a new look for somebody on your roster ---------- */
/** Give a wrestler on your roster a new look (or their first). Their first finishing move becomes their finisher.
    They remember it, once a week at most. */
$L.E.setLook=function(S,id,look){
  var w=S.w[id];if(!w||w.promo!==S.player)return {ok:false,msg:'Only somebody on your roster can be changed.'};
  var c=$L.lookClean(look);if(!c||!$L.E.lookOk(c))return {ok:false,msg:'That is not a wrestler\'s look.'};
  var first=!w.look;w.look=c;var f=$L.lookFin(w);if(f)w.fin=f.name;
  if(w.lookW!==S.week){w.lookW=S.week;$L.youRemember(S,w,'look',first?'You gave them a look of their own.':'You gave them a new look.',1);}
  return {ok:true,msg:w.name+(first?' has a look of their own now.':' has a new look.')+' Every scene draws them like this.'};
};
/** Take the look off a wrestler on your roster: the game draws them again. */
$L.E.clearLook=function(S,id){var w=S.w[id];if(!w||w.promo!==S.player||!w.look)return {ok:false,msg:'Nothing to take off.'};delete w.look;return {ok:true,msg:w.name+' is drawn by the game again.'};};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.LOOK_ATTIRES = LOOK_ATTIRES;
$L.LOOK_SLOTS = LOOK_SLOTS;
$L.LOOK_PARTS = LOOK_PARTS;
$L.LOOK_KICK = LOOK_KICK;
$L.LOOK_POS = LOOK_POS;
$L.lkStr = lkStr;
$L.lkId = lkId;
$L.lkNum = lkNum;
$L.lkPrune = lkPrune;
$L.lookClean = lookClean;
$L.lkWorker = lkWorker;
$L.lookFin = lookFin;
$L.FIN_KO = FIN_KO;
$L.FIN_PAY = FIN_PAY;
$L.finProt = finProt;
