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
