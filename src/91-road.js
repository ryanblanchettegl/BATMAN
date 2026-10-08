/* ---------- the road: where every city is, the map it is on, and where the next shows are ----------
   (docs/plans/art-direction.md, sections 6.4 and 6.5)

   A city is a name in a company's list (P.cities). CITY_AT says where each one is (latitude, longitude, and for a
   city on a border the area it lights); a fictional or ancient city has a
   real spot (Troy at its site, West Egg on Long Island, Camelot in Somerset). A world made in the editor can bring
   its own in S.places. A city with no place still works: it has no dot on the map.

   The road is a loop through the company's cities, each stop the nearest one not yet visited, so the arcs on the map
   make a tour and not a scribble. Stop number S.rdn is the next show to go on the air. Nothing here uses rnd(S). */
var CITY_AT={'Rome':[41.9,12.5],'Athens':[37.98,23.73],'Alexandria':[31.2,29.92],'Constantinople':[41.01,28.98],'London':[51.51,-0.13],'Paris':[48.86,2.35],'Vienna':[48.21,16.37],'Kyoto':[35.01,135.77],
  'Philadelphia':[39.95,-75.17,['Pennsylvania']],'Boston':[42.36,-71.06],'Chicago':[41.88,-87.63,['Illinois']],'St. Louis':[38.63,-90.2],'Edinburgh':[55.95,-3.19],'Dublin':[53.35,-6.26],'Verona':[45.44,10.99],'Nottingham':[52.95,-1.15],
  'Camelot':[51.02,-2.53],'Springfield':[39.8,-89.65],'New York':[40.71,-74,['New York']],'Baltimore':[39.29,-76.61],'New Orleans':[29.95,-90.07],'Sparta':[37.07,22.43],'Thebes':[38.32,23.32],'Corinth':[37.94,22.93],
  'Delphi':[38.48,22.5],'Troy':[39.96,26.24],'Memphis':[29.85,31.25],'Uppsala':[59.86,17.64],'Uruk':[31.32,45.64],'Tara':[53.58,-6.61,['Ireland']],'Whitby':[54.49,-0.61],'Sleepy Hollow':[41.09,-73.86],'Prague':[50.08,14.44],
  'Styria':[47.07,15.44],'Ingolstadt':[48.77,11.42],'Salem':[42.52,-70.9],'Hannibal':[39.71,-91.36],'Deadwood':[44.38,-103.73],'Dodge City':[37.75,-100.02],'Tombstone':[31.71,-110.07],'Abilene':[38.92,-97.21],
  'Natchez':[31.56,-91.4,['Mississippi']],'Bangor':[44.8,-68.77],'Baghdad':[33.31,44.36],'Hamelin':[52.1,9.36],'West Egg':[40.8,-73.7,['New York']],'Louisville':[38.25,-85.76],'Saint Paul':[44.95,-93.09],'San Francisco':[37.77,-122.42],
  'Dawson City':[64.06,-139.43],'Atlantic City':[39.36,-74.42],'Monte Carlo':[43.74,7.43],'Melbourne':[-37.81,144.96],'Tenochtitlan':[19.43,-99.13],'Teotihuacan':[19.69,-98.84,['the Valley of Mexico']],'Tula':[20.06,-99.34],
  'Cholula':[19.06,-98.3,['Puebla']],'Chichen Itza':[20.68,-88.57],'Tikal':[17.22,-89.62],'Palenque':[17.48,-92.05],'Copan':[14.84,-89.14],'Cusco':[-13.53,-71.97],'Tiwanaku':[-16.55,-68.67,['Bolivia']],'Guatavita':[4.98,-73.78],
  'Chiloe':[-42.6,-73.9,['Chile']],'Mexico City':[19.43,-99.13],'Puebla':[19.04,-98.2,['Puebla']],'Guadalajara':[20.67,-103.35],'Veracruz':[19.17,-96.13],'Havana':[23.11,-82.37],'Caracas':[10.48,-66.9],'Bogota':[4.71,-74.07],
  'Quito':[-0.18,-78.47],'Lima':[-12.05,-77.04],'Santiago':[-33.45,-70.67],'Buenos Aires':[-34.6,-58.38],'Madrid':[40.42,-3.7],'Nara':[34.69,135.8],'Edo':[35.68,139.69],'Osaka':[34.69,135.5],
  'Kamakura':[35.32,139.55],'Izumo':[35.37,132.75],'Ise':[34.49,136.71],'Aizu':[37.49,139.93],'Sendai':[38.27,140.87],'Hakata':[33.59,130.4],'Nikko':[36.75,139.6],'Kanazawa':[36.56,136.65]};
var VENUE_RE=/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/;
function venueName(city,cap){return city+' '+(cap<=1000?'Armory':(cap<=2500?'Civic Auditorium':(cap<=6000?'Fieldhouse':(cap<=13000?'Coliseum':(cap<=30000?'Arena':'Stadium')))));}
function cityOfVenue(v){return v?String(v).replace(VENUE_RE,''):'';}
function placeOf(S,city){var p=(S&&S.places&&S.places[city])||CITY_AT[city];return p?{n:city,lat:p[0],lon:p[1],a:p[2]||null}:null;}
function mapById(id){for(var i=0;i<MAPS.length;i++)if(MAPS[i].id===id)return MAPS[i];return null;}
/* where a place falls on a map's board, in dots (it may be off the board) */
function mapXY(M,pl){var x=pl.lon-M.f[0];if(x<0)x+=360;if(x>=360)x-=360;return [x/M.f[1],(M.f[2]-pl.lat)/M.f[3]];}
function mapHas(M,pl){var p=mapXY(M,pl);return p[0]>=0.5&&p[0]<MAP_W-0.5&&p[1]>=0.5&&p[1]<MAP_H-0.5;}
/* the area a place lights on a map: its own dot, or the nearest lit dot within two (a city on the coast) */
function mapArea(M,pl){
  var i,p=mapXY(M,pl),cx=Math.floor(p[0]),cy=Math.floor(p[1]),best=-1,bd=9;
  if(pl.a)for(i=0;i<pl.a.length;i++)if(M.a.indexOf(pl.a[i])>=0)return M.a.indexOf(pl.a[i]);   // a city on a border says which side it is on
  if(cy>=0&&cy<MAP_H&&cx>=0&&cx<MAP_W&&M.g[cy].charAt(cx)==='-')return -1;                      // it stands in a land this map does not light
  for(var y=cy-2;y<=cy+2;y++)for(var x=cx-2;x<=cx+2;x++){
    if(y<0||y>=MAP_H||x<0||x>=MAP_W)continue;var ch=M.g[y].charAt(x);if(ch===' '||ch==='-')continue;
    var d=(x+0.5-p[0])*(x+0.5-p[0])+(y+0.5-p[1])*(y+0.5-p[1]);if(d<bd){bd=d;best=MAP_ABC.indexOf(ch);}
  }
  return best;
}
function geoDist(a,b){var k=Math.cos((a.lat+b.lat)/2*Math.PI/180),dx=Math.abs(a.lon-b.lon);if(dx>180)dx=360-dx;dx*=k;var dy=a.lat-b.lat;return Math.sqrt(dx*dx+dy*dy);}
/* the loop a company tours: start somewhere the seed picks, then always the nearest city not yet visited */
function roadRoute(S,P){
  var C=(P.cities&&P.cities.length?P.cities:['the city']).slice(),known=[],lost=[];
  C.forEach(function(c){var p=placeOf(S,c);if(p)known.push(p);else lost.push(c);});
  var out=[];
  if(known.length){
    var cur=known.splice(hash('road'+S.seed+P.id)%known.length,1)[0];out.push(cur.n);
    while(known.length){var bi=0,bd=1e9;for(var i=0;i<known.length;i++){var d=geoDist(cur,known[i]);if(d<bd){bd=d;bi=i;}}cur=known.splice(bi,1)[0];out.push(cur.n);}
  }
  return out.concat(lost);
}
function roadCity(S,P,n){var R=roadRoute(S,P);return R[((n%R.length)+R.length)%R.length];}
/* the building is booked before the card is: its size comes from what this company draws, not from tonight's matches */
function roadCap(S,P,show){return capFor(demand(P,show,1)*tourBoost(S,P));}
/* ---------- tickets sold before the night (docs/plans/art-direction.md, 6.6) ----------
   A television show goes on sale four weeks out, a big event eight. Each week more of the house is sold, up to about
   nine in ten by the week of the show; the rest walk up on the night. What a stop will draw is worked out the way the
   night itself works it out (cardHype() in src/30-show.js): popularity, ticket prices, advertising, anything done this
   week to talk the next show up, the hottest story, and once the card is booked, the card itself. S.tix[stop] is what
   had been sold when the last week ended, so a ticket once sold stays sold. Nothing here uses rnd(S). */
function saleSpan(show){return show.big?8:4;}
function saleFrac(wo,show){var span=saleSpan(show);if(wo>span)return 0;if(wo<0)wo=0;return 0.88*Math.pow(1-wo/(span+1),0.7);}
function stopDraw(S,P,show,next){
  var d0=demand(P,show,1)*tourBoost(S,P),hype;
  if(next&&S.card&&S.card.length)hype=cardHype(S,P,show,S.card,true);
  else{var heat=0;activeFeuds(S).forEach(function(f){if(f.heat>heat&&f.a.concat(f.b).some(function(id){return S.w[id]&&S.w[id].promo===P.id;}))heat=f.heat;});
    hype=clamp(1+ADV_H[P.adv]+(next&&S.hype?S.hype:0)+heat/1000,0.8,1.4);}
  return Math.min(roadCap(S,P,show),d0*hype*TIX_D[P.tix]);
}
/* what a stop has sold, what it had sold when this week began, and whether it is on sale yet */
function stopSales(S,P,w,show,k,next){
  var cap=roadCap(S,P,show),was=Math.min(cap,(S.tix&&S.tix[k])||0),wo=w-S.week,live=Math.round(stopDraw(S,P,show,next)*saleFrac(wo,show)),sold=Math.max(was,live);
  return {sold:sold,wk:sold-was,cap:cap,on:wo<=saleSpan(show),opens:Math.max(0,wo-saleSpan(show))};
}
/* on the night: whatever was sold is paid for, whoever turns up */
function roadSoldNow(S,P){var k=S.rdn||0;return Math.round((S.tix&&S.tix[k])||0);}
/* when a week ends, what each stop has sold is written down, so the next week's sales start from there */
(function(){var ew=E.endWeek;E.endWeek=function(S){
  var P=S.promos[S.player],w0=S.week,keep={};
  if(P&&!S.over)roadAhead(S,P,8).forEach(function(a,i){var x=stopSales(S,P,a.w,a.show,a.k,i===0);if(x.sold>0)keep[a.k]=x.sold;});
  var r=ew.apply(this,arguments);
  if(S.week!==w0){S.tix=keep;Object.keys(S.tix).forEach(function(k){if(+k<(S.rdn||0))delete S.tix[k];});}
  return r;
};})();
/* a new game starts with the shows ahead already selling: what they had sold by the end of last week */
(function(){var ng=E.newGame;E.newGame=function(){
  var S=ng.apply(this,arguments),P=S&&S.promos&&S.promos[S.player];
  if(P&&S.queue){S.tix={};roadAhead(S,P,8).forEach(function(a,i){var n=Math.round(stopDraw(S,P,a.show,i===0)*saleFrac(a.w-S.week+1,a.show));if(n>0)S.tix[a.k]=n;});}
  return S;
};})();
/* the stops still to come: what is left of this week, then the weeks after it */
function roadAhead(S,P,n){
  var out=[],k=S.rdn||0,w=S.week,i;
  for(i=S.qi||0;S.queue&&i<S.queue.length;i++){out.push({w:w,show:S.queue[i],city:roadCity(S,P,k),k:k});k++;}
  while(out.length<n&&w<S.week+12){w++;weekShows(S,P,w).forEach(function(sh){out.push({w:w,show:sh,city:roadCity(S,P,k),k:k});k++;});}
  return out.slice(0,n);
}
/* a night in a city is remembered: when, how it went and how full it was */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player||!rep.venue)return;
  var c=cityOfVenue(rep.venue);rep.city=c;
  (S.rdv||(S.rdv={}))[c]={w:S.week,cs:Math.round(repCS(rep)),att:rep.att,cap:rep.cap,so:rep.sellout?1:0};
});
E.MAPS=MAPS;E.MAP_W=MAP_W;E.MAP_H=MAP_H;E.MAP_ABC=MAP_ABC;
E.placeOf=function(S,city){return placeOf(S,city);};
/** The map a city is shown on: the smallest map that holds it and as many of the stops around it as any other. */
var MAP_FIRST=['brit','jap','mex','med','usa','sam','eur'];   // closest in first: of two maps that show as much, the closer one wins
function roadMap(S,cities){
  var here=placeOf(S,cities[0]),best=null,bs=-1;
  if(!here)return null;
  MAP_FIRST.forEach(function(id){
    var M=mapById(id);if(!M||!mapHas(M,here)||mapArea(M,here)<0)return;
    var s=0;cities.forEach(function(c){var p=placeOf(S,c);if(p&&mapHas(M,p)&&mapArea(M,p)>=0)s++;});
    if(s>bs){bs=s;best=M;}
  });
  var Wd=mapById('world');                                      // the world map only when nothing closer will do
  return best||(Wd&&mapHas(Wd,here)&&mapArea(Wd,here)>=0?Wd:null);
}
/** Everything the road window on the desk shows. It only reads the game.
    `map` is the board to draw (see E.MAPS), `lit` the areas that light, `stops` the road so far and the road ahead
    with each stop's dot, `now` this stop in full. */
E.road=function(S){
  var P=S.promos[S.player],ahead=roadAhead(S,P,6),past=[],i;
  if(!ahead.length)return null;
  for(i=0;i<S.reports.length&&past.length<3;i++){var r=S.reports[i];if(r&&r.venue)past.unshift({k:'past',city:r.city||cityOfVenue(r.venue),show:r.name,w:r.week,grade:gradeG(repCS(r)),att:r.att,cap:r.cap,so:!!r.sellout});}
  var stops=past.concat(ahead.map(function(a,j){var x=stopSales(S,P,a.w,a.show,a.k,j===0);return {k:j===0?'now':(j===1?'next':'far'),city:a.city,show:a.show.name,big:!!a.show.big,w:a.w,sold:x.sold,cap:x.cap,on:x.on,opens:x.opens};}));
  var A=ahead[0],city=A.city,near=[city];
  if(ahead[1])near.push(ahead[1].city);past.slice().reverse().forEach(function(p){near.push(p.city);});if(ahead[2])near.push(ahead[2].city);
  var M=roadMap(S,near),here=placeOf(S,city),lit={now:-1,next:-1,mine:[]},off=[];
  if(M){
    lit.now=mapArea(M,here);
    stops.forEach(function(s){var p=placeOf(S,s.city);if(p&&mapHas(M,p)&&mapArea(M,p)>=0){var q=mapXY(M,p);s.x=Math.round(q[0]*100)/100;s.y=Math.round(q[1]*100)/100;if(s.k==='next')lit.next=mapArea(M,p);}else if(s.k!=='past'&&off.indexOf(s.city)<0)off.push(s.city);});
    if(lit.next===lit.now)lit.next=-1;
    (P.cities||[]).forEach(function(c){var p=placeOf(S,c);if(p&&mapHas(M,p)){var a=mapArea(M,p);if(a>=0&&lit.mine.indexOf(a)<0)lit.mine.push(a);}});
  }
  var cap=roadCap(S,P,A.show),sale=stopSales(S,P,A.w,A.show,A.k,true),last=S.rdv&&S.rdv[city],bar=S.bar&&S.bar[city],reg=P.tour?REGIONS[P.tour.reg]:REGIONS[homeReg(P)];
  var home=rosterOf(S,P.id).filter(function(w){return w.town===city&&!w.nw;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,3).map(function(w){return {id:w.id,name:w.name,hurt:w.inj>0};});
  return {map:M?M.id:null,mapName:M?M.n:null,lit:lit,stops:stops,off:off,
    now:{city:city,land:M&&lit.now>=0?M.a[lit.now]:null,show:A.show.name,big:!!A.show.big,w:A.w,later:A.w>S.week,left:Math.max(0,(S.queue?S.queue.length:0)-(S.qi||0)),
      venue:venueName(city,cap),cap:cap,seat:Math.round(ticket(P,A.show)*TIX_P[P.tix]),tix:TIXN[P.tix],
      sold:sale.sold,wk:sale.wk,on:sale.on,opens:sale.opens,gate:Math.round(sale.sold*ticket(P,A.show)*TIX_P[P.tix]),
      last:last?{ago:S.week-last.w,grade:gradeG(last.cs),att:last.att,cap:last.cap,so:!!last.so}:null,
      rival:bar&&S.week-bar.w<=4?{by:bar.by,ago:S.week-bar.w}:null,
      taste:TASTEN[reg.taste],tour:P.tour?reg.n:null,home:home}};
};
/** The year ahead on the road: every stop for the next `n` shows, for the schedule pop-up. */
E.roadAhead=function(S,n){var P=S.promos[S.player];return roadAhead(S,P,n||16).map(function(a,i){var c=cal(a.w);var x=stopSales(S,P,a.w,a.show,a.k,i===0);return {w:a.w,when:a.w===S.week?'This week':(a.w===S.week+1?'Next week':c.label),show:a.show.name,big:!!a.show.big,city:a.city,cap:x.cap,sold:x.sold,on:x.on,opens:x.opens};});};
E.roadRoute=function(S,pid){return roadRoute(S,S.promos[pid==null?S.player:pid]);};
E.mapArea=function(S,mapId,city){var M=mapById(mapId),p=placeOf(S,city);return M&&p&&mapHas(M,p)?mapArea(M,p):-1;};
E.mapXY=function(S,mapId,city){var M=mapById(mapId),p=placeOf(S,city);return M&&p&&mapHas(M,p)?mapXY(M,p):null;};
