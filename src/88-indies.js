/* ===== The indie scene (NEXT.md job 10, a first step) =====
   Small independent promotions are not companies in the game: a name, a region and a night. Free agents work them
   while they wait for a call. Who works where comes from a hash, never rnd(S), so it cannot shift a seeded game's
   draws. A free agent who works the indies keeps their body ready; a young one with room to grow gets a little better;
   one who stops working drifts back. The news reports a free agent who is tearing it up. */
var INDIES=[
  {n:'Rust Belt Wrestling Alliance',r:'the Midwest'},{n:'Harbour Lights Pro',r:'the coast'},{n:'Backyard Kings',r:'the South'},
  {n:'Lantern Street Wrestling',r:'the old town'},{n:'Iron Valley Championship',r:'the valleys'},{n:'Midnight Fair Wrestling',r:'the fairgrounds'},
  {n:'Northern Lights Grappling',r:'the north'},{n:'Saltmarsh Pro',r:'the marshes'},{n:'Union Hall Wrestling',r:'the union halls'},
  {n:'High Plains Wrestling League',r:'the plains'},{n:'Quarry Road Pro',r:'the quarries'},{n:'Second Street Rumble',r:'the city'},
  {n:'Lighthouse Wrestling Club',r:'the harbour'},{n:'Cinder Track Wrestling',r:'the speedway'}
];
function indieOf(S,w){var k=hash('ind'+S.seed+':'+w.id+':'+Math.floor(S.week/8));return INDIES[k%INDIES.length];}
WEEKX.push(function(S){
  if(S.cal)return;var star=null;
  S.w.forEach(function(w){if(w.promo!=='FA'||w.rt||w.nw)return;var h=h01('indw'+S.seed+':'+w.id+':'+S.week),ind=indieOf(S,w);
    if(h<0.65){w.ind={n:ind.n,w:S.week,k:(w.ind&&w.ind.n===ind.n?(w.ind.k||0):0)+1};w.cond=Math.min(100,w.cond+1);
      if(w.age<=27&&w.pot!=null&&w.ovr<w.pot-5)w.ovr=Math.min(w.pot,w.ovr+0.15);
      if(w.ind.k===6&&(!star||w.ovr>star.ovr))star=w;}
    else if(w.ind&&S.week-w.ind.w>6)w.ovr=Math.max(1,w.ovr-0.05);});
  if(star)news(S,'world',star.name+' has been tearing it up for '+star.ind.n+'. Somebody will sign them soon.');
});
/** Where a free agent has been working, for the Free agents page. */
E.indieOf=function(S,id){var w=S.w[id];if(!w||w.promo!=='FA'||!w.ind||S.week-w.ind.w>4)return null;return {n:w.ind.n,weeks:w.ind.k||1};};
E.INDIES=INDIES;
