/* ---------- Create a Player: a wrestler's look as a file (docs/plans/create-a-player.md) ----------
   A wrestler made in Create a Player is a small record in the shape Ryan set out (18 October): who they are, their
   body (height, weight, a body type and four sliders), three outfits (ring gear, entrance gear, street clothes),
   each with the parts worn, the colours of its palette slots and the lettering and shapes stuck on it, and their
   finishing moves. It is kept on the worker in a world package (`look`), carried onto the wrestler in a game
   (`w.look`), and written out as its own .wrestler.json file to share. The interface draws it (app/src/kit/caw.ts);
   nothing here plays a part in how a match goes yet, and nothing calls rnd(S). lookClean() keeps only what it knows,
   so a file from anywhere is safe to load. */
var LOOK_ATTIRES=['primary_ring','entrance_gear','street_clothes'],LOOK_SLOTS=['primary','secondary','trim','hardware'],LOOK_PARTS=['head','upper_body','lower_body','footwear'];
var LOOK_KICK=['Easy','Medium','Protected','Instant'],LOOK_POS=['Standing','Top Rope','Running','Counter'];
function lkStr(v,n){return typeof v==='string'?v.replace(/[\u0000-\u001f<>]/g,'').slice(0,n||40):undefined;}
function lkId(v){return typeof v==='string'&&/^[#a-z0-9_ -]{1,48}$/i.test(v)?v:undefined;}
function lkNum(v,a,b){return typeof v==='number'&&isFinite(v)?Math.max(a,Math.min(b,v)):undefined;}
function lkPrune(o){Object.keys(o).forEach(function(k){if(o[k]===undefined)delete o[k];});return o;}
/** A clean copy of a look, or null when it is not one. */
function lookClean(x){
  if(!x||typeof x!=='object'||Array.isArray(x))return null;
  var o=lkPrune({id:lkId(x.id),name:lkStr(x.name,32),moniker:lkStr(x.moniker,40),hometown:lkStr(x.hometown,40),archetype:lkStr(x.archetype,32)});
  var pa=x.physical_attributes;
  if(pa&&typeof pa==='object'){var ps=pa.proportional_scalers||{};
    o.physical_attributes=lkPrune({height_inches:lkNum(pa.height_inches,58,96),weight_lbs:lkNum(pa.weight_lbs,100,600),body_archetype:lkId(pa.body_archetype),
      proportional_scalers:lkPrune({torso_width:lkNum(ps.torso_width,0.7,1.5),torso_height:lkNum(ps.torso_height,0.8,1.25),limb_length:lkNum(ps.limb_length,0.8,1.25),muscle_mass:lkNum(ps.muscle_mass,0.6,1.6)})});}
  var ap=x.appearance;
  if(ap&&typeof ap==='object'){var f=null;if(ap.face&&typeof ap.face==='object'){f={};['h','hr','fh','ms','ey','ns','sk','hc'].forEach(function(k){var v=lkNum(ap.face[k],0,100);if(v!=null)f[k]=Math.round(v);});}
    o.appearance=lkPrune({face:f&&Object.keys(f).length?f:undefined,skin_tone:lkNum(ap.skin_tone,0,100),hair_colour:lkId(ap.hair_colour),facial_hair:lkId(ap.facial_hair)});}
  if(x.attires&&typeof x.attires==='object'){var at={};LOOK_ATTIRES.forEach(function(k){var a=x.attires[k];if(!a||typeof a!=='object')return;
    var eq=a.equipped_assets||{},e={};LOOK_PARTS.forEach(function(p){var v=lkId(eq[p]);if(v)e[p]=v;});
    if(Array.isArray(eq.accessories))e.accessories=eq.accessories.map(lkId).filter(function(v){return !!v;}).slice(0,8);
    var pal={};LOOK_SLOTS.forEach(function(s){var v=lkId((a.palette_slots||{})[s]);if(v)pal[s]=v;});
    var lay=(Array.isArray(a.custom_layers)?a.custom_layers:[]).slice(0,16).map(function(l){
      if(!l||(l.type!=='text_decal'&&l.type!=='shape_combiner'))return null;var pl=l.placement||{};
      var c=lkPrune({type:l.type,string:l.type==='text_decal'?lkStr(l.string,20):undefined,font:lkId(l.font),shape_id:l.type==='shape_combiner'?lkId(l.shape_id):undefined,
        placement:{x:lkNum(pl.x,-20,20)||0,y:lkNum(pl.y,-20,20)||0,z:lkNum(pl.z,0,20)||0},palette_slot:lkId(l.palette_slot),on:l.on==='lower_body'?'lower_body':undefined,
        arch:lkNum(l.arch,-1,1),scale:lkNum(l.scale,0.2,4),rot:lkNum(l.rot,-180,180)});
      return (c.type==='text_decal'&&c.string)||(c.type==='shape_combiner'&&c.shape_id)?c:null;}).filter(function(l){return !!l;});
    at[k]=lkPrune({description:lkStr(a.description,40),equipped_assets:e,palette_slots:pal,custom_layers:lay});});
    if(Object.keys(at).length)o.attires=at;}
  if(Array.isArray(x.finishing_moves))o.finishing_moves=x.finishing_moves.slice(0,4).map(function(m){
    if(!m||typeof m!=='object'||!lkStr(m.name,32))return null;
    return lkPrune({name:lkStr(m.name,32),impact_damage:lkNum(m.impact_damage,1,100),kickout_difficulty:LOOK_KICK.indexOf(m.kickout_difficulty)>=0?m.kickout_difficulty:undefined,
      position:LOOK_POS.indexOf(m.position)>=0?m.position:undefined,category:lkStr(m.category,24),preview_pose_id:lkId(m.preview_pose_id)});}).filter(function(m){return !!m;});
  return Object.keys(o).length?o:null;
}
/** Is this a wrestler's look (a .wrestler.json file)? */
E.lookOk=function(x){var c=lookClean(x);return !!(c&&(c.attires||c.physical_attributes||c.appearance));};
E.lookClean=lookClean;
function lkWorker(pkg,id){return pkg&&Array.isArray(pkg.workers)?pkg.workers.filter(function(w){return w&&w.id===id;})[0]:null;}
/** The look a worker in a world package wears, or null. */
E.edLook=function(pkg,id){var w=lkWorker(pkg,id);return w&&w.look?lookClean(w.look):null;};
/** Keep a look on a worker in the world. Returns false for anything that is not a look. */
E.edSetLook=function(pkg,id,look){var w=lkWorker(pkg,id),c=lookClean(look);if(!w||!c||!E.lookOk(c))return false;w.look=c;return true;};
E.edRemoveLook=function(pkg,id){var w=lkWorker(pkg,id);if(w)delete w.look;};
/** The look a wrestler in a game wears, or null (somebody never made in Create a Player). */
E.lookOf=function(S,id){var w=S&&S.w[id];return w&&w.look?w.look:null;};
