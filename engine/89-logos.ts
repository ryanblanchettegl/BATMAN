// @ts-nocheck
/* Moved from src/89-logos.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.logoHas = logoHas; $L.logoLetters = logoLetters; $L.logoTag = logoTag; $L.logoLum = logoLum; $L.logoDist = logoDist; $L.logoBehind = logoBehind; $L.logoReads = logoReads; $L.logoFix = logoFix; $L.logoFill = logoFill; $L.logoKey = logoKey;
/* ---------- Company logos: every company has its own icon, built from its initials ----------
   Ryan, 6 October: "I want every company to have their own icons based on their 3 initials", and a logo creator with
   enough parts that a player can build any logo they have in mind (docs/plans/art-direction.md, sections 3 and 3a).
   A logo is data, never an image: P.logo = {l, st, lay, sh, fin, c1, c2, c3, ex, tag}. Anything missing comes from the
   company's model, so a company always has a logo and an old save or world needs nothing done to it.
   Nothing here names or copies a real company's logo (rule 3): the parts are general, and what ships is the default
   for each model. Nothing here touches the generator: ideas are picked with a hash of the letters and a counter. */
export var LOGO_SHAPES=[['none','Letters only'],['shield','Shield'],['ring','Ring'],['laurel','Laurel'],['slash','Banner'],['star','Star'],['diamond','Diamond'],['sun','Sun'],['steps','Pyramid'],['moon','Moon'],
  ['circle','Seal'],['hex','Plate'],['crown','Crown'],['oval','Oval'],['globe','Globe'],['bolt','Bolt'],['wings','Wings'],['flame','Flame'],['pennant','Pennant']];
$L.LOGO_SHAPES = LOGO_SHAPES;
export var LOGO_STYLES=[['block','Block'],['slant','Slanted'],['wide','Wide'],['tall','Tall'],['outline','Outlined'],['shadow','Shadowed']];
$L.LOGO_STYLES = LOGO_STYLES;
export var LOGO_LAYS=[['row','In a row'],['stack','Stacked'],['stair','Stairs'],['big','Big middle']];
$L.LOGO_LAYS = LOGO_LAYS;
export var LOGO_FINS=[['flat','Flat'],['split','Two-tone'],['stripe','Striped']];
$L.LOGO_FINS = LOGO_FINS;
/** The lettering a logo is drawn in: marker, a heavy block face, a typewriter, a brush, a neat hand, a scrawl. */
export var LOGO_FONTS=[['marker','Marker'],['block','Heavy print'],['typed','Typewriter'],['brush','Brush'],['neat','Neat hand'],['scrawl','Scrawl']];
$L.LOGO_FONTS = LOGO_FONTS;
export var LOGO_EXTRAS=[['none','Nothing'],['stars','Three stars'],['bar','A bar'],['tag','A second line'],['edge','Edge lights']];
$L.LOGO_EXTRAS = LOGO_EXTRAS;
export var LOGO_COLS=[['#0000aa','Blue'],['#00aa00','Green'],['#00aaaa','Teal'],['#aa0000','Red'],['#aa00aa','Purple'],['#aa5500','Brown'],['#aaaaaa','Silver'],['#555555','Grey'],
  ['#5555ff','Bright blue'],['#55ff55','Bright green'],['#55ffff','Cyan'],['#ff5555','Bright red'],['#ff55ff','Pink'],['#ffff55','Yellow'],['#ffffff','White'],['#000000','Black']];
$L.LOGO_COLS = LOGO_COLS;
/* what each company model starts from: a shape and its colours (shape, trim, letters) */
export var LOGO_MODEL={classic:['circle','#0000aa','#aaaaaa','#ffffff'],corporate:['shield','#5555ff','#ffff55','#ffffff'],workrate:['ring','#aa0000','#ffffff','#ffff55'],purist:['laurel','#00aa00','#ffff55','#ffffff'],
  outlaw:['slash','#aa0000','#555555','#ffffff'],underdog:['star','#aa5500','#ffff55','#ffffff'],startup:['diamond','#00aaaa','#ffffff','#ffff55'],spectacle:['sun','#aa00aa','#ffff55','#ffffff'],
  tradition:['steps','#00aa00','#ff5555','#ffffff'],joshi:['moon','#ff55ff','#ffffff','#ffff55']};
$L.LOGO_MODEL = LOGO_MODEL;
export function logoHas(L,v){for(var i=0;i<L.length;i++)if(L[i][0]===v)return true;return false;}
/** Two or three capital letters for a company: its short name if that is letters, else the capitals of its full name. */
export function logoLetters(name,full){
  var a=String(name||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(a.length<2||a.length>3){var caps=String(full||'').replace(/[^A-Z]/g,'');if(caps.length>=2)a=caps;}
  a=a.slice(0,3);return a.length>=2?a:(a+'XX').slice(0,2);
}
export function logoTag(t){return String(t||'').toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,8);}
/* how far apart two colours are to the eye, 0 to 1: letters must stand off what is behind them */
export function logoLum(h){var n=parseInt(String(h).slice(1),16);return (0.3*(n>>16)+0.59*((n>>8)&255)+0.11*(n&255))/255;}
export function logoDist(a,b){var x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16),d=function(s){return ((x>>s)&255)-((y>>s)&255);};return Math.sqrt(d(16)*d(16)+d(8)*d(8)+d(0)*d(0))/441.7;}
/* what the letters sit on: the shape's colour, or the black board when there is no shape */
export function logoBehind(m){return m.sh==='none'?'#000000':m.c1;}
export function logoReads(m){return $L.logoDist(m.c3,$L.logoBehind(m))>=0.38&&Math.abs($L.logoLum(m.c3)-$L.logoLum($L.logoBehind(m)))>=0.18;}
/* the nearest colour to the one asked for that can be read on what is behind it */
export function logoFix(m){
  if($L.logoReads(m))return m.c3;
  var best=null,bd=9;$L.LOGO_COLS.forEach(function(c){var t={sh:m.sh,c1:m.c1,c3:c[0]};if(!$L.logoReads(t))return;var d=$L.logoDist(c[0],m.c3);if(d<bd){bd=d;best=c[0];}});
  return best||'#ffffff';
}
/** A whole logo from whatever is given: every field filled in and valid. model is the company's model id. */
export function logoFill(m,model,name,full){
  m=m&&typeof m==='object'?m:{};var D=$L.LOGO_MODEL[model]||$L.LOGO_MODEL.classic,col=function(v,d){return $L.logoHas($L.LOGO_COLS,String(v).toLowerCase())?String(v).toLowerCase():d;};
  var o={l:m.l?$L.logoLetters(m.l,''):$L.logoLetters(name,full),st:$L.logoHas($L.LOGO_STYLES,m.st)?m.st:'block',lay:$L.logoHas($L.LOGO_LAYS,m.lay)?m.lay:'row',sh:$L.logoHas($L.LOGO_SHAPES,m.sh)?m.sh:D[0],
    fin:$L.logoHas($L.LOGO_FINS,m.fin)?m.fin:'flat',c1:col(m.c1,D[1]),c2:col(m.c2,D[2]),c3:col(m.c3,D[3]),ex:$L.logoHas($L.LOGO_EXTRAS,m.ex)?m.ex:'none',tag:$L.logoTag(m.tag),fo:$L.logoHas($L.LOGO_FONTS,m.fo)?m.fo:'marker'};
  if(o.ex==='tag'&&!o.tag)o.ex='none';
  return o;
}
export function logoKey(m){return [m.l,m.st,m.lay,m.sh,m.fin,m.c1,m.c2,m.c3,m.ex,m.ex==='tag'?m.tag:'',m.fo&&m.fo!=='marker'?m.fo:''].join('|');}
/** A company's logo, in full. Works on a company in a game (P.name, P.full, P.model) and on one in a world package
    (name, full_name, model). */
$L.E.logoOf=function(P){return P?$L.logoFill(P.logo,P.model||'classic',P.name,P.full||P.full_name):$L.logoFill(null,'classic','EWF','');};
/** The parts a logo can be made of, for the creator: each list is [id, name] pairs. */
$L.E.LOGO={shapes:LOGO_SHAPES,styles:LOGO_STYLES,lays:LOGO_LAYS,fins:LOGO_FINS,fonts:LOGO_FONTS,extras:LOGO_EXTRAS,cols:LOGO_COLS};
/** Fill in and tidy a logo that is being worked on. */
$L.E.logoFill=function(m,model,name,full){return $L.logoFill(m,model,name,full);};
/** Finished logos to choose from, made from the same letters: n of them, the same every time for the same letters and seed. */
$L.E.logoIdeas=function(letters,n,seed){
  var l=$L.logoLetters(letters,''),out=[],seen={},k=0;n=$L.clamp(n|0||6,1,24);seed=seed|0;
  var pickOf=function(L,salt){return L[Math.floor($L.h01(l+':'+seed+':'+k+':'+salt)*L.length)%L.length][0];};
  while(out.length<n&&k<400){
    var m={l:l,st:pickOf($L.LOGO_STYLES,'st'),lay:l.length===3||$L.h01(l+seed+k+'lay2')<0.6?pickOf($L.LOGO_LAYS,'lay'):'row',sh:pickOf($L.LOGO_SHAPES,'sh'),fin:pickOf($L.LOGO_FINS,'fin'),c1:pickOf($L.LOGO_COLS,'c1'),c2:pickOf($L.LOGO_COLS,'c2'),c3:pickOf($L.LOGO_COLS,'c3'),ex:pickOf($L.LOGO_EXTRAS.filter(function(x){return x[0]!=='tag';}),'ex'),tag:'',fo:$L.h01(l+seed+k+'fo')<0.5?'marker':pickOf($L.LOGO_FONTS,'fo')};
    k++;
    if(m.c1==='#000000'||m.c2===m.c1)continue;
    m.c3=$L.logoFix(m);var key=$L.logoKey(m);if(seen[key])continue;seen[key]=1;out.push(m);
  }
  return out;
};
/** Can this logo be used? list is the other companies (each with id, name, model and maybe logo); self is the id of the
    company the logo is for. Answers {ok, errors, c3}: c3 is the nearest letter colour that can be read, when the one asked for cannot. */
$L.E.logoOk=function(list,logo,self){
  var m=$L.logoFill(logo,'classic',logo&&logo.l,''),errs=[],fix=null;
  if(!logo||String(logo.l||'').replace(/[^A-Za-z0-9]/g,'').length<2)errs.push('A logo needs two or three letters.');
  if(!$L.logoReads(m)){fix=$L.logoFix(m);errs.push('Those letters cannot be read on that colour. '+(($L.LOGO_COLS.filter(function(c){return c[0]===fix;})[0]||[])[1]||'White')+' would show.');}
  (list||[]).forEach(function(p){if(!p||p.id===self)return;if($L.logoKey($L.E.logoOf(p))===$L.logoKey(m))errs.push((p.name||'Another company')+' already has that logo.');});
  return {ok:!errs.length,errors:errs,c3:fix};
};
/** World Editor: set a company's logo. Pass null to go back to the logo its model gives it. */
$L.E.edSetLogo=function(pkg,pid,logo){
  $L.edShape(pkg);var p=(pkg.promotions||[]).filter(function(x){return x.id===pid;})[0];if(!p)return {ok:false,msg:'There is no such company.'};
  if(logo==null){delete p.logo;return {ok:true,logo:$L.E.logoOf(p),msg:p.name+' is back to the logo its model gives it.'};}
  var m=$L.logoFill(logo,p.model||'classic',p.name,p.full_name),v=$L.E.logoOk(pkg.promotions,m,pid);
  if(!v.ok)return {ok:false,msg:v.errors[0],errors:v.errors,c3:v.c3};
  p.logo=m;return {ok:true,logo:m,msg:p.name+' has a new logo.'};
};
/** In a game: the player's company takes a new logo. Only an owner may change it. */
$L.E.setLogo=function(S,logo){
  var P=S.promos[S.player];if(!S.owner||!S.owner.me)return {ok:false,msg:'The logo is the owner’s to change, and '+(S.owner?S.owner.name:'the owner')+' has not asked for a new one.'};
  var m=$L.logoFill(logo,P.model||'classic',P.name,P.full),v=$L.E.logoOk(S.order.map(function(id){return S.promos[id];}),m,P.id);
  if(!v.ok)return {ok:false,msg:v.errors[0],errors:v.errors,c3:v.c3};
  P.logo=m;$L.news(S,'you',P.name+' has a new logo.');return {ok:true,logo:m,msg:P.name+' has a new logo.'};
};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.LOGO_SHAPES = LOGO_SHAPES;
$L.LOGO_STYLES = LOGO_STYLES;
$L.LOGO_LAYS = LOGO_LAYS;
$L.LOGO_FINS = LOGO_FINS;
$L.LOGO_FONTS = LOGO_FONTS;
$L.LOGO_EXTRAS = LOGO_EXTRAS;
$L.LOGO_COLS = LOGO_COLS;
$L.LOGO_MODEL = LOGO_MODEL;
$L.logoHas = logoHas;
$L.logoLetters = logoLetters;
$L.logoTag = logoTag;
$L.logoLum = logoLum;
$L.logoDist = logoDist;
$L.logoBehind = logoBehind;
$L.logoReads = logoReads;
$L.logoFix = logoFix;
$L.logoFill = logoFill;
$L.logoKey = logoKey;
