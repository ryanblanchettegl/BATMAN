// @ts-nocheck
/* Moved from src/88-indies.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.indieMeta = indieMeta; $L.indiesOn = indiesOn; $L.indieOf = indieOf;
/* ===== The indie scene (NEXT.md job 10, a first step) =====
   Small independent promotions are not companies in the game: a name, a region and a night. Free agents work them
   while they wait for a call. Who works where comes from a hash, never rnd(S), so it cannot shift a seeded game's
   draws. A free agent who works the indies keeps their body ready; a young one with room to grow gets a little better;
   one who stops working drifts back. The news reports a free agent who is tearing it up. */
export var INDIES=[
  {n:'Rust Belt Wrestling Alliance',r:'the Midwest'},{n:'Harbour Lights Pro',r:'the coast'},{n:'Backyard Kings',r:'the South'},
  {n:'Lantern Street Wrestling',r:'the old town'},{n:'Iron Valley Championship',r:'the valleys'},{n:'Midnight Fair Wrestling',r:'the fairgrounds'},
  {n:'Northern Lights Grappling',r:'the north'},{n:'Saltmarsh Pro',r:'the marshes'},{n:'Union Hall Wrestling',r:'the union halls'},
  {n:'High Plains Wrestling League',r:'the plains'},{n:'Quarry Road Pro',r:'the quarries'},{n:'Second Street Rumble',r:'the city'},
  {n:'Lighthouse Wrestling Club',r:'the harbour'},{n:'Cinder Track Wrestling',r:'the speedway'}
];
$L.INDIES = INDIES;
/* more names for the years to come: an indie closes once a year and a new one opens in its place (NEXT.md 10.1) */
export var INDIE_NEW=[
  {n:'Brickyard Wrestling',r:'the mill towns'},{n:'Tidewater Pro',r:'the tidewater'},{n:'Crossroads Championship Wrestling',r:'the crossroads'},
  {n:'Gaslight Grappling',r:'the old quarter'},{n:'Red Clay Wrestling',r:'the hill country'},{n:'Pier Nine Pro',r:'the docks'},
  {n:'Boxcar Wrestling',r:'the rail yards'},{n:'Copper Hills Pro',r:'the mining towns'},{n:'Riverboat Rumble',r:'the river'},
  {n:'Ember Street Wrestling',r:'the east side'}
];
$L.INDIE_NEW = INDIE_NEW;
/* each indie's size and night, from its name: a hall of a few hundred on a Thursday, or a fairground on a Saturday.
   A bigger indie is better for a young wrestler: more people, better opponents. */
export var INDIE_SIZE=['a back room of a hundred','a hall of a few hundred','a fairground of a thousand'],INDIE_NIGHT=['Thursdays','Fridays','Saturdays','Sundays'];
$L.INDIE_SIZE = INDIE_SIZE; $L.INDIE_NIGHT = INDIE_NIGHT;
export function indieMeta(x){var h=$L.hash('indm:'+x.n);return {size:h%3,night:$L.INDIE_NIGHT[(h>>>3)%4]};}
/** The indies running now. A new game starts with the first fourteen. */
export function indiesOn(S){var all=$L.INDIES.concat($L.INDIE_NEW);return (S.indOn||$L.INDIES.map(function(x){return x.n;})).map(function(n){return all.filter(function(x){return x.n===n;})[0];}).filter(Boolean);}
export function indieOf(S,w){var L=$L.indiesOn(S),k=$L.hash('ind'+S.seed+':'+w.id+':'+Math.floor(S.week/8));return L[k%L.length];}
/* once a year, in the middle of the year, one indie runs its last show and a new one runs its first */
$L.WEEKX.push(function(S){
  if(S.cal||S.week%48!==24)return;var L=$L.indiesOn(S).map(function(x){return x.n;}),all=$L.INDIES.concat($L.INDIE_NEW),used={};
  L.forEach(function(n){used[n]=1;});(S.indGone||[]).forEach(function(n){used[n]=1;});
  var fresh=all.filter(function(x){return !used[x.n];});if(!fresh.length)return;
  var gone=L[$L.hash('indx'+S.seed+':'+S.week)%L.length],born=fresh[$L.hash('indn'+S.seed+':'+S.week)%fresh.length];
  S.indOn=L.filter(function(n){return n!==gone;}).concat([born.n]);S.indGone=(S.indGone||[]).concat([gone]).slice(-20);
  $L.news(S,'world',gone+' has run its last show. '+born.n+' runs its first, in '+born.r+'.');
});
$L.WEEKX.push(function(S){
  if(S.cal)return;var star=null;
  S.w.forEach(function(w){if(w.promo!=='FA'||w.rt||w.nw)return;var h=$L.h01('indw'+S.seed+':'+w.id+':'+S.week),ind=$L.indieOf(S,w);
    if(h<0.65){w.ind={n:ind.n,w:S.week,k:(w.ind&&w.ind.n===ind.n?(w.ind.k||0):0)+1};w.cond=Math.min(100,w.cond+1);
      if(w.age<=27&&w.pot!=null&&w.ovr<w.pot-5)w.ovr=Math.min(w.pot,w.ovr+0.1+0.05*$L.indieMeta(ind).size);
      if(w.ind.k===6&&(!star||w.ovr>star.ovr))star=w;}
    else if(w.ind&&S.week-w.ind.w>6)w.ovr=Math.max(1,w.ovr-0.05);});
  if(star)$L.news(S,'world',star.name+' has been tearing it up for '+star.ind.n+'. Somebody will sign them soon.');
});
/** Where a free agent has been working, for the Free agents page. */
$L.E.indieOf=function(S,id){var w=S.w[id];if(!w||w.promo!=='FA'||!w.ind||S.week-w.ind.w>4)return null;return {n:w.ind.n,weeks:w.ind.k||1};};
$L.E.INDIES=INDIES;
$L.E.indiesOn=function(S){return $L.indiesOn(S).map(function(x){var m=$L.indieMeta(x);return {n:x.n,r:x.r,size:$L.INDIE_SIZE[m.size],night:m.night};});};
/** Free agents on the longest run with one indie right now, best first: who the scene is talking about. */
$L.E.indieHot=function(S,n){return S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw&&w.ind&&S.week-w.ind.w<=2&&(w.ind.k||0)>=3;}).sort(function(a,b){return (b.ind.k-a.ind.k)||(b.ovr-a.ovr);}).slice(0,n||3).map(function(w){var x=$L.INDIES.concat($L.INDIE_NEW).filter(function(i){return i.n===w.ind.n;})[0],m=x?$L.indieMeta(x):null;return {id:w.id,name:w.name,n:w.ind.n,k:w.ind.k,where:x?m.night+' in '+x.r:''};});};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.INDIES = INDIES;
$L.INDIE_NEW = INDIE_NEW;
$L.INDIE_SIZE = INDIE_SIZE;
$L.INDIE_NIGHT = INDIE_NIGHT;
$L.indieMeta = indieMeta;
$L.indiesOn = indiesOn;
$L.indieOf = indieOf;
