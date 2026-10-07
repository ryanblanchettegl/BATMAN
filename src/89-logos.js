/* ---------- Company logos: every company has its own icon, built from its initials ----------
   Ryan, 6 October: "I want every company to have their own icons based on their 3 initials", and a logo creator with
   enough parts that a player can build any logo they have in mind (docs/plans/art-direction.md, sections 3 and 3a).
   A logo is data, never an image: P.logo = {l, st, lay, sh, fin, c1, c2, c3, ex, tag}. Anything missing comes from the
   company's model, so a company always has a logo and an old save or world needs nothing done to it.
   Nothing here names or copies a real company's logo (rule 3): the parts are general, and what ships is the default
   for each model. Nothing here touches the generator: ideas are picked with a hash of the letters and a counter. */
var LOGO_SHAPES=[['none','Letters only'],['shield','Shield'],['ring','Ring'],['laurel','Laurel'],['slash','Banner'],['star','Star'],['diamond','Diamond'],['sun','Sun'],['steps','Pyramid'],['moon','Moon'],
  ['circle','Seal'],['hex','Plate'],['crown','Crown'],['oval','Oval'],['globe','Globe'],['bolt','Bolt'],['wings','Wings'],['flame','Flame'],['pennant','Pennant']];
var LOGO_STYLES=[['block','Block'],['slant','Slanted'],['wide','Wide'],['tall','Tall'],['outline','Outlined'],['shadow','Shadowed']];
var LOGO_LAYS=[['row','In a row'],['stack','Stacked'],['stair','Stairs'],['big','Big middle']];
var LOGO_FINS=[['flat','Flat'],['split','Two-tone'],['stripe','Striped']];
var LOGO_EXTRAS=[['none','Nothing'],['stars','Three stars'],['bar','A bar'],['tag','A second line'],['edge','Edge lights']];
var LOGO_COLS=[['#0000aa','Blue'],['#00aa00','Green'],['#00aaaa','Teal'],['#aa0000','Red'],['#aa00aa','Purple'],['#aa5500','Brown'],['#aaaaaa','Silver'],['#555555','Grey'],
  ['#5555ff','Bright blue'],['#55ff55','Bright green'],['#55ffff','Cyan'],['#ff5555','Bright red'],['#ff55ff','Pink'],['#ffff55','Yellow'],['#ffffff','White'],['#000000','Black']];
/* what each company model starts from: a shape and its colours (shape, trim, letters) */
var LOGO_MODEL={classic:['circle','#0000aa','#aaaaaa','#ffffff'],corporate:['shield','#5555ff','#ffff55','#ffffff'],workrate:['ring','#aa0000','#ffffff','#ffff55'],purist:['laurel','#00aa00','#ffff55','#ffffff'],
  outlaw:['slash','#aa0000','#555555','#ffffff'],underdog:['star','#aa5500','#ffff55','#ffffff'],startup:['diamond','#00aaaa','#ffffff','#ffff55'],spectacle:['sun','#aa00aa','#ffff55','#ffffff'],
  tradition:['steps','#00aa00','#ff5555','#ffffff'],joshi:['moon','#ff55ff','#ffffff','#ffff55']};
function logoHas(L,v){for(var i=0;i<L.length;i++)if(L[i][0]===v)return true;return false;}
/** Two or three capital letters for a company: its short name if that is letters, else the capitals of its full name. */
function logoLetters(name,full){
  var a=String(name||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
  if(a.length<2||a.length>3){var caps=String(full||'').replace(/[^A-Z]/g,'');if(caps.length>=2)a=caps;}
  a=a.slice(0,3);return a.length>=2?a:(a+'XX').slice(0,2);
}
function logoTag(t){return String(t||'').toUpperCase().replace(/[^A-Z0-9 ]/g,'').slice(0,8);}
/* how far apart two colours are to the eye, 0 to 1: letters must stand off what is behind them */
function logoLum(h){var n=parseInt(String(h).slice(1),16);return (0.3*(n>>16)+0.59*((n>>8)&255)+0.11*(n&255))/255;}
function logoDist(a,b){var x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16),d=function(s){return ((x>>s)&255)-((y>>s)&255);};return Math.sqrt(d(16)*d(16)+d(8)*d(8)+d(0)*d(0))/441.7;}
/* what the letters sit on: the shape's colour, or the black board when there is no shape */
function logoBehind(m){return m.sh==='none'?'#000000':m.c1;}
function logoReads(m){return logoDist(m.c3,logoBehind(m))>=0.38&&Math.abs(logoLum(m.c3)-logoLum(logoBehind(m)))>=0.18;}
/* the nearest colour to the one asked for that can be read on what is behind it */
function logoFix(m){
  if(logoReads(m))return m.c3;
  var best=null,bd=9;LOGO_COLS.forEach(function(c){var t={sh:m.sh,c1:m.c1,c3:c[0]};if(!logoReads(t))return;var d=logoDist(c[0],m.c3);if(d<bd){bd=d;best=c[0];}});
  return best||'#ffffff';
}
/** A whole logo from whatever is given: every field filled in and valid. model is the company's model id. */
function logoFill(m,model,name,full){
  m=m&&typeof m==='object'?m:{};var D=LOGO_MODEL[model]||LOGO_MODEL.classic,col=function(v,d){return logoHas(LOGO_COLS,String(v).toLowerCase())?String(v).toLowerCase():d;};
  var o={l:m.l?logoLetters(m.l,''):logoLetters(name,full),st:logoHas(LOGO_STYLES,m.st)?m.st:'block',lay:logoHas(LOGO_LAYS,m.lay)?m.lay:'row',sh:logoHas(LOGO_SHAPES,m.sh)?m.sh:D[0],
    fin:logoHas(LOGO_FINS,m.fin)?m.fin:'flat',c1:col(m.c1,D[1]),c2:col(m.c2,D[2]),c3:col(m.c3,D[3]),ex:logoHas(LOGO_EXTRAS,m.ex)?m.ex:'none',tag:logoTag(m.tag)};
  if(o.ex==='tag'&&!o.tag)o.ex='none';
  return o;
}
function logoKey(m){return [m.l,m.st,m.lay,m.sh,m.fin,m.c1,m.c2,m.c3,m.ex,m.ex==='tag'?m.tag:''].join('|');}
/** A company's logo, in full. Works on a company in a game (P.name, P.full, P.model) and on one in a world package
    (name, full_name, model). */
E.logoOf=function(P){return P?logoFill(P.logo,P.model||'classic',P.name,P.full||P.full_name):logoFill(null,'classic','EWF','');};
/** The parts a logo can be made of, for the creator: each list is [id, name] pairs. */
E.LOGO={shapes:LOGO_SHAPES,styles:LOGO_STYLES,lays:LOGO_LAYS,fins:LOGO_FINS,extras:LOGO_EXTRAS,cols:LOGO_COLS};
/** Fill in and tidy a logo that is being worked on. */
E.logoFill=function(m,model,name,full){return logoFill(m,model,name,full);};
/** Finished logos to choose from, made from the same letters: n of them, the same every time for the same letters and seed. */
E.logoIdeas=function(letters,n,seed){
  var l=logoLetters(letters,''),out=[],seen={},k=0;n=clamp(n|0||6,1,24);seed=seed|0;
  var pickOf=function(L,salt){return L[Math.floor(h01(l+':'+seed+':'+k+':'+salt)*L.length)%L.length][0];};
  while(out.length<n&&k<400){
    var m={l:l,st:pickOf(LOGO_STYLES,'st'),lay:l.length===3||h01(l+seed+k+'lay2')<0.6?pickOf(LOGO_LAYS,'lay'):'row',sh:pickOf(LOGO_SHAPES,'sh'),fin:pickOf(LOGO_FINS,'fin'),c1:pickOf(LOGO_COLS,'c1'),c2:pickOf(LOGO_COLS,'c2'),c3:pickOf(LOGO_COLS,'c3'),ex:pickOf(LOGO_EXTRAS.filter(function(x){return x[0]!=='tag';}),'ex'),tag:''};
    k++;
    if(m.c1==='#000000'||m.c2===m.c1)continue;
    m.c3=logoFix(m);var key=logoKey(m);if(seen[key])continue;seen[key]=1;out.push(m);
  }
  return out;
};
/** Can this logo be used? list is the other companies (each with id, name, model and maybe logo); self is the id of the
    company the logo is for. Answers {ok, errors, c3}: c3 is the nearest letter colour that can be read, when the one asked for cannot. */
E.logoOk=function(list,logo,self){
  var m=logoFill(logo,'classic',logo&&logo.l,''),errs=[],fix=null;
  if(!logo||String(logo.l||'').replace(/[^A-Za-z0-9]/g,'').length<2)errs.push('A logo needs two or three letters.');
  if(!logoReads(m)){fix=logoFix(m);errs.push('Those letters cannot be read on that colour. '+((LOGO_COLS.filter(function(c){return c[0]===fix;})[0]||[])[1]||'White')+' would show.');}
  (list||[]).forEach(function(p){if(!p||p.id===self)return;if(logoKey(E.logoOf(p))===logoKey(m))errs.push((p.name||'Another company')+' already has that logo.');});
  return {ok:!errs.length,errors:errs,c3:fix};
};
/** World Editor: set a company's logo. Pass null to go back to the logo its model gives it. */
E.edSetLogo=function(pkg,pid,logo){
  edShape(pkg);var p=(pkg.promotions||[]).filter(function(x){return x.id===pid;})[0];if(!p)return {ok:false,msg:'There is no such company.'};
  if(logo==null){delete p.logo;return {ok:true,logo:E.logoOf(p),msg:p.name+' is back to the logo its model gives it.'};}
  var m=logoFill(logo,p.model||'classic',p.name,p.full_name),v=E.logoOk(pkg.promotions,m,pid);
  if(!v.ok)return {ok:false,msg:v.errors[0],errors:v.errors,c3:v.c3};
  p.logo=m;return {ok:true,logo:m,msg:p.name+' has a new logo.'};
};
/** In a game: the player's company takes a new logo. Only an owner may change it. */
E.setLogo=function(S,logo){
  var P=S.promos[S.player];if(!S.owner||!S.owner.me)return {ok:false,msg:'The logo is the owner’s to change, and '+(S.owner?S.owner.name:'the owner')+' has not asked for a new one.'};
  var m=logoFill(logo,P.model||'classic',P.name,P.full),v=E.logoOk(S.order.map(function(id){return S.promos[id];}),m,P.id);
  if(!v.ok)return {ok:false,msg:v.errors[0],errors:v.errors,c3:v.c3};
  P.logo=m;news(S,'you',P.name+' has a new logo.');return {ok:true,logo:m,msg:P.name+' has a new logo.'};
};
