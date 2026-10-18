/* ---------- scenes in a world (Create a Scene, docs/plans/papercraft-engine.md, sections 4 and 5) ----------
   A world package can carry `scenes`: the pictures of moments made in Create a Scene, which sits in the World
   Editor. Each is plain data (a set, slots, keyframes; the interface in app/src/kit/scene.ts reads and draws it).
   A new game keeps the world's scenes in S.db, so the broadcast plays them, and writing the world out keeps them.
   Nothing here plays a part in how a game goes, and nothing calls rnd(S). */
function sceneOk(sc){return !!sc&&sc.v===1&&typeof sc.id==='string'&&/^[a-z0-9_-]{1,48}$/i.test(sc.id)&&typeof sc.name==='string'&&Array.isArray(sc.slots)&&Array.isArray(sc.keys)&&sc.keys.length>0&&sc.keys.length<=40&&
  sc.keys.every(function(k){return typeof k.t==='number'&&k.figs&&typeof k.figs==='object'&&Array.isArray(k.props);});}
/** The scenes a world carries, made in Create a Scene. */
E.edScenes=function(pkg){return (pkg&&Array.isArray(pkg.scenes)?pkg.scenes:[]).filter(sceneOk);};
/** Keep a scene in the world, in place of one with the same id. Returns false for anything that is not a scene. */
E.edSetScene=function(pkg,sc){if(!pkg||!sceneOk(sc))return false;var a=Array.isArray(pkg.scenes)?pkg.scenes.filter(function(x){return x&&x.id!==sc.id;}):[];a.push(JSON.parse(JSON.stringify(sc)));pkg.scenes=a;return true;};
E.edRemoveScene=function(pkg,id){if(pkg&&Array.isArray(pkg.scenes))pkg.scenes=pkg.scenes.filter(function(x){return x&&x.id!==id;});if(pkg&&pkg.scenes&&!pkg.scenes.length)delete pkg.scenes;};
/** The scenes the world of this game carries (none for a world without any, or an old save). */
E.worldScenes=function(S){var d=(S&&S.db)||DB;return d&&Array.isArray(d.scenes)?d.scenes.filter(sceneOk):[];};
E.sceneOk=sceneOk;

/* ---------- hooks: who a scene is about (docs/plans/papercraft-engine.md, "Hooks") ----------
   A slot in a scene can name a part in the story instead of a fixed person: the hero, the villain, the villain's
   group, the champion, the manager. E.sceneHooks fills every part it can from a moment of the show and what the
   game knows (stables, tag teams, managers, titles, the face of the company). It only reads the game. */
var HOOKS=['a','b','hero','villain','heel1','heel2','heel3','ally','manager','champ','challenger','winner','loser','talker','attacker','victim','face'];
/** o: {ids: everybody in the moment, in the order they appear; a: who does it (the attacker, the winner, the one
    talking); b: who it is done to; win: the winners' ids; title: the title's name, if one is on the line}. Returns
    {hook: wrestler id} for every part that could be filled. */
E.sceneHooks=function(S,o){
  o=o||{};var W=function(id){return id!=null&&S.w[id]?S.w[id]:null;},ids=(o.ids||[]).filter(function(id){return !!W(id);}),out={},used={};
  var a=W(o.a)?o.a:ids[0],b=W(o.b)?o.b:ids.filter(function(x){return x!==a;})[0];
  var put=function(k,id){if(W(id)&&out[k]==null)out[k]=id;};
  put('a',a);put('b',b);put('attacker',a);put('victim',b);put('talker',a);
  var all=[a,b].concat(ids).filter(function(x,i,l){return W(x)&&l.indexOf(x)===i;});
  var hero=all.filter(function(id){return W(id).align!=='H';})[0],villain=all.filter(function(id){return W(id).align==='H'&&id!==hero;})[0];
  if(hero==null&&villain!=null)hero=all.filter(function(id){return id!==villain;})[0];
  if(villain==null&&hero!=null)villain=all.filter(function(id){return id!==hero;})[0];
  put('hero',hero);put('villain',villain);
  // the villain's people: the stable first (the leader before the rest), then a tag partner, then the manager
  var v=W(villain),h=W(hero),grp=[];
  if(v){var st=stableOf(S,v);if(st)[st.leader].concat(st.m).forEach(function(id){if(id!==villain&&id!==hero&&W(id)&&grp.indexOf(id)<0)grp.push(id);});
    var tm=teamOf(S,v);if(tm&&tm.m)tm.m.forEach(function(id){if(id!==villain&&id!==hero&&W(id)&&grp.indexOf(id)<0)grp.push(id);});
    if(v.mgr!=null&&W(v.mgr)&&grp.indexOf(v.mgr)<0&&v.mgr!==hero)grp.push(v.mgr);}
  // whoever else in the moment is on the villain's side counts too
  all.forEach(function(id){if(id!==villain&&id!==hero&&W(id).align==='H'&&grp.indexOf(id)<0)grp.push(id);});
  grp.slice(0,3).forEach(function(id,i){put('heel'+(i+1),id);});
  if(h){var ht=teamOf(S,h),al=ht&&ht.m?ht.m.filter(function(id){return id!==hero&&W(id);}):[];if(al.length)put('ally',al[0]);
    else{var sh=stableOf(S,h);if(sh)put('ally',sh.m.filter(function(id){return id!==hero;})[0]);}}
  put('manager',v&&v.mgr!=null?v.mgr:(h&&h.mgr!=null?h.mgr:null));
  // the champion: whoever holds the title on the line; else the best title held by somebody in the moment
  var P=S.promos&&S.promos[W(all[0])?W(all[0]).promo:S.player],best=null;
  if(P&&P.titles)P.titles.forEach(function(t){var hd=t.holders[0];if(hd==null)return;if(o.title&&t.name===o.title){best={t:t,id:hd,on:1};return;}
    if(all.indexOf(hd)>=0&&(!best||(!best.on&&t.lvl>best.t.lvl)))best={t:t,id:hd};});
  if(best){put('champ',best.id);put('challenger',all.filter(function(id){return id!==best.id;})[0]);}
  var win=(o.win||[]).filter(function(id){return !!W(id);});
  if(win.length){put('winner',win[0]);put('loser',all.filter(function(id){return win.indexOf(id)<0;})[0]);}
  var f=faceOf(S);if(f)put('face',f.id);
  return out;
};
E.SCENE_HOOKS=HOOKS;
