// @ts-nocheck
/* Moved from src/86-editor.js (ADR-0001). Names from the rest of the engine come through the bridge, $L. Types come in step 3. */
import { L as $L } from './_gen/legacy.js';
$L.edRnd = edRnd; $L.edPick = edPick; $L.edShape = edShape; $L.edId = edId; $L.edFind = edFind; $L.edHome = edHome; $L.edIsWrestler = edIsWrestler; $L.edRatings = edRatings; $L.edNames = edNames;
/* The World Editor's working parts: make, change and check a universe package.
   A package is plain JSON (docs/universe-format.md). Nothing here touches a running game. */
export var ED_PUSH_N={main_eventer:'Main event',upper_midcarder:'Upper mid-card',midcarder:'Mid-card',lower_midcarder:'Lower mid-card',jobber:'Opening match',non_wrestler:'Does not wrestle'};
$L.ED_PUSH_N = ED_PUSH_N;
export var ED_STYLE_N={brawler:'Brawler',technician:'Technician',flyer:'High flyer',powerhouse:'Powerhouse',all_rounder:'All-rounder',striker:'Striker',entertainer:'Entertainer'};
$L.ED_STYLE_N = ED_STYLE_N;
export var ED_ROLE_N={wrestler:'Wrestler',manager:'Manager',announcer:'Announcer',referee:'Referee',road_agent:'Road agent',owner:'Owner',booker:'Booker'};
$L.ED_ROLE_N = ED_ROLE_N;
export var ED_REL_N={rivalry:'Rivals',friendship:'Friends',mentor:'Mentor and student',family:'Family',partners:'Partners',dislike:'Dislike each other'};
$L.ED_REL_N = ED_REL_N;
export var ED_RATINGS=[['overness','Overness',1],['brawling','Brawling',1],['technical','Technical',1],['aerial','Agility',1],['stamina','Stamina',1],['promo_skill','Promo',1],
  ['charisma','Charisma',0],['hardcore','Hardcore',0],['star_quality','Star quality',0],['consistency','Consistency',0],['potential','Potential',0]];
$L.ED_RATINGS = ED_RATINGS;
export var ED_TABLES=['promotions','shows','titles','workers','contracts','teams','relationships','events'];
$L.ED_TABLES = ED_TABLES;
export var ED_TABLE_N={promotions:'Companies',shows:'Shows',titles:'Belts',workers:'Wrestlers',contracts:'Wrestlers',teams:'Teams',relationships:'Relationships',events:'Shows',manifest:'World',package:'World',media:'World'};
$L.ED_TABLE_N = ED_TABLE_N;
export var ED_TAB={promotions:'companies',shows:'shows',titles:'belts',workers:'wrestlers',contracts:'wrestlers',teams:'teams',relationships:'teams',events:'shows',manifest:'world',package:'world',media:'world'};
$L.ED_TAB = ED_TAB;

export function edRnd(st){st.s=(st.s*1664525+1013904223)%4294967296;return st.s/4294967296;}
export function edPick(st,a){return a[Math.floor($L.edRnd(st)*a.length)];}
export function edShape(pkg){$L.ED_TABLES.forEach(function(t){if(!Array.isArray(pkg[t]))pkg[t]=[];});if(!pkg.manifest||typeof pkg.manifest!=='object')pkg.manifest={};return pkg;}
/** An id nobody sees: a slug of the name, made unique inside its table. */
export function edId(pkg,table,name,fallback){
  var base=$L.slug(name||'')||fallback||table.slice(0,4),used={},n=2,id;
  if(base.length<2)base=base+'_x';base=base.slice(0,36);
  (pkg[table]||[]).forEach(function(r){if(r&&r.id)used[r.id]=1;});
  id=base;while(used[id]){id=base+'_'+n;n++;}
  return id;
}
export function edFind(pkg,table,id){var a=pkg[table]||[];for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===id)return a[i];return null;}
export function edHome(pkg,wid){var c=(pkg.contracts||[]).filter(function(x){return x.worker_id===wid&&(x.contract_type||'exclusive')==='exclusive';})[0];return c||null;}
export function edIsWrestler(w){return !w.roles||!w.roles.length||w.roles.indexOf('wrestler')>=0;}

/** A new, empty world. It will not pass the check until it has two companies with six wrestlers and a show each. */
$L.E.edNew=function(name,author){
  name=String(name||'').trim()||'My world';
  return {manifest:{id:$L.slug(name)||'my_world',name:name,author:String(author||'').trim(),version:'1.0',schema_version:$L.SCHEMA_VERSION,description:'',start_year:2026,start_month:10,free_agents:36},
    promotions:[],shows:[],titles:[],workers:[],contracts:[],teams:[],relationships:[],events:[]};
};
/** A deep copy under a new name, so the original is left alone. */
$L.E.edCopy=function(pkg,name){
  var c=$L.edShape(JSON.parse(JSON.stringify(pkg)));name=String(name||'').trim()||((c.manifest.name||'World')+' (copy)');
  c.manifest.id=$L.slug(name)||'my_world';c.manifest.name=name;c.manifest.schema_version=$L.SCHEMA_VERSION;return c;
};
/** Add a company. It arrives with a weekly show and a top title so it is playable as soon as it has a roster. */
$L.E.edAddPromo=function(pkg,o){
  $L.edShape(pkg);o=o||{};
  var name=String(o.name||'').trim()||'NEW',full=String(o.full_name||'').trim(),model=$L.MODELS[o.model]?o.model:'classic',g=$L.MODELS[model].gender||'M';
  var p={id:$L.edId(pkg,'promotions',name,'fed'),name:name,full_name:full||name+' Wrestling',blurb:'',popularity:o.popularity!=null?$L.clamp(Math.round(o.popularity),5,100):50,model:model,
    owner:{name:'The owner',style:'stars',roots:'tradition',pledge:'pay'},cities:[]};
  pkg.promotions.push(p);
  pkg.shows.push({id:$L.edId(pkg,'shows',p.id+'_weekly'),promotion_id:p.id,name:name+' Weekly',weight:1});
  pkg.titles.push({id:$L.edId(pkg,'titles',p.id+'_world'),promotion_id:p.id,name:name+' World Title',gender:g,level:3,tag:false,holder_ids:[]});
  return p;
};
$L.E.edAddShow=function(pkg,pid,name){$L.edShape(pkg);var s={id:$L.edId(pkg,'shows',pid+'_'+(name||'show')),promotion_id:pid,name:String(name||'').trim()||'New show',weight:1};pkg.shows.push(s);return s;};
$L.E.edAddTitle=function(pkg,pid,o){
  $L.edShape(pkg);o=o||{};var p=$L.edFind(pkg,'promotions',pid),MD=p&&$L.MODELS[p.model];
  var t={id:$L.edId(pkg,'titles',pid+'_'+(o.name||'title')),promotion_id:pid,name:String(o.name||'').trim()||'New title',gender:(MD&&MD.gender)||o.gender||'M',level:o.level||2,tag:!!o.tag,holder_ids:[]};
  pkg.titles.push(t);return t;
};
$L.E.edAddWorker=function(pkg,o){
  $L.edShape(pkg);o=o||{};var name=String(o.ring_name||'').trim()||'New wrestler';
  var w={id:$L.edId(pkg,'workers',name,'worker'),ring_name:name,gender:o.gender==='F'?'F':'M',age:o.age||28,disposition:o.disposition||'face',roles:['wrestler'],style:o.style||'all_rounder',finisher:'',hometown:'',
    ratings:{overness:50,brawling:60,technical:60,aerial:55,stamina:60,promo_skill:55,charisma:55}};
  if(o.ratings)Object.keys(o.ratings).forEach(function(k){w.ratings[k]=o.ratings[k];});
  pkg.workers.push(w);
  if(o.promotion_id)$L.E.edSign(pkg,w.id,o.promotion_id,o.push_level);
  return w;
};
$L.E.edAddTeam=function(pkg,pid,kind){
  $L.edShape(pkg);kind=kind==='stable'?'stable':'tag';
  var t={id:$L.edId(pkg,'teams',pid+'_'+kind),name:kind==='stable'?'New stable':'New team',kind:kind,member_ids:[],promotion_id:pid};
  if(kind==='tag'){t.experience=50;t.chemistry=3;}
  pkg.teams.push(t);return t;
};
$L.E.edAddRel=function(pkg,a,b,type){$L.edShape(pkg);var r={a:a,b:b,type:$L.REL_TYPES.indexOf(type)>=0?type:'rivalry',strength:60};pkg.relationships.push(r);return r;};

/** Put a wrestler under contract to a company, or make them a free agent with pid null.
    Titles and teams they held somewhere else are tidied up, so the world never points at someone who has left. */
/** A copy of one record, under a new name. A wrestler joins the same company at the same push; a belt starts vacant;
    a team starts with no members; a company brings its shows and belts but not its roster. Returns the copy. */
$L.E.edDup=function(pkg,table,id){
  $L.edShape(pkg);var r=$L.edFind(pkg,table,id);if(!r)return null;
  var c=JSON.parse(JSON.stringify(r)),nk=table==='workers'?'ring_name':'name',nm=String(r[nk]||'')+' (copy)';c[nk]=nm;
  c.id=$L.edId(pkg,table,nm,table.slice(0,4));
  if(table==='workers'){pkg.workers.push(c);var h=$L.edHome(pkg,r.id);if(h)$L.E.edSign(pkg,c.id,h.promotion_id,h.push_level);return c;}
  if(table==='titles'){c.holder_ids=[];pkg.titles.push(c);return c;}
  if(table==='teams'){c.member_ids=[];delete c.leader_id;pkg.teams.push(c);return c;}
  if(table==='promotions'){
    c.full_name=String(r.full_name||r.name)+' (copy)';pkg.promotions.push(c);
    pkg.shows.filter(function(x){return x.promotion_id===r.id;}).forEach(function(x){var y=JSON.parse(JSON.stringify(x));y.promotion_id=c.id;y.id=$L.edId(pkg,'shows',c.id+'_'+(x.name||'show'));pkg.shows.push(y);});
    pkg.titles.filter(function(x){return x.promotion_id===r.id;}).forEach(function(x){var y=JSON.parse(JSON.stringify(x));y.promotion_id=c.id;y.holder_ids=[];y.id=$L.edId(pkg,'titles',c.id+'_'+(x.name||'title'));pkg.titles.push(y);});
    return c;
  }
  return null;
};
$L.E.edSign=function(pkg,wid,pid,push){
  $L.edShape(pkg);var old=$L.edHome(pkg,wid),from=old?old.promotion_id:null;
  if(from===pid){if(old&&push)old.push_level=push;return old;}
  pkg.contracts=pkg.contracts.filter(function(c){return c.worker_id!==wid;});
  if(from){
    pkg.titles.forEach(function(t){if(t.promotion_id===from&&t.holder_ids)t.holder_ids=t.holder_ids.filter(function(h){return h!==wid;});});
    pkg.teams.forEach(function(t){if(t.promotion_id===from){t.member_ids=(t.member_ids||[]).filter(function(m){return m!==wid;});if(t.leader_id===wid)delete t.leader_id;}});
  }
  if(!pid)return null;
  var w=$L.edFind(pkg,'workers',wid),c={worker_id:wid,promotion_id:pid,contract_type:'exclusive',push_level:$L.PUSH.indexOf(push)>=0?push:(w&&!$L.edIsWrestler(w)?'non_wrestler':'midcarder')};
  pkg.contracts.push(c);return c;
};
/** Remove a record and everything that pointed at it. */
$L.E.edRemove=function(pkg,table,id){
  $L.edShape(pkg);
  if(table==='promotions'){
    pkg.promotions=pkg.promotions.filter(function(p){return p.id!==id;});
    ['shows','titles','teams'].forEach(function(t){pkg[t]=pkg[t].filter(function(r){return r.promotion_id!==id;});});
    pkg.contracts=pkg.contracts.filter(function(c){return c.promotion_id!==id;});
  }else if(table==='workers'){
    $L.E.edSign(pkg,id,null);
    pkg.workers=pkg.workers.filter(function(w){return w.id!==id;});
    pkg.workers.forEach(function(w){if(w.manager_id===id)delete w.manager_id;});
    pkg.titles.forEach(function(t){if(t.holder_ids)t.holder_ids=t.holder_ids.filter(function(h){return h!==id;});});
    pkg.teams.forEach(function(t){t.member_ids=(t.member_ids||[]).filter(function(m){return m!==id;});if(t.leader_id===id)delete t.leader_id;});
    pkg.relationships=pkg.relationships.filter(function(r){return r.a!==id&&r.b!==id;});
  }else if(table==='relationships'||table==='events'){
    pkg[table].splice(id,1);
  }else if(pkg[table])pkg[table]=pkg[table].filter(function(r){return r.id!==id;});
  return pkg;
};

/** Give a record a new name. Its id follows the name, and so does everything that pointed at the old id,
    so a shared world has ids a person can read. Returns the id the record has now. */
$L.E.edRename=function(pkg,table,id,name){
  $L.edShape(pkg);var rec=$L.edFind(pkg,table,id);if(!rec)return id;
  var key=table==='workers'?'ring_name':'name',was=rec[key];rec[key]=name;
  if(!String(name||'').trim())return id;
  var pre=(table==='shows'||table==='titles'||table==='teams')?rec.promotion_id+'_':'';
  rec.id='';var nid=$L.edId(pkg,table,pre+name);rec.id=nid;
  if(nid===id)return id;
  if(table==='promotions'){
    ['shows','titles','teams','contracts'].forEach(function(t){pkg[t].forEach(function(r){if(r.promotion_id===id)r.promotion_id=nid;});});
    ['shows','titles','teams'].forEach(function(t){pkg[t].forEach(function(r){
      if(r.promotion_id!==nid)return;
      if(r.id.indexOf(id+'_')===0){var tail=r.id.slice(id.length+1);r.id='';r.id=$L.edId(pkg,t,nid+'_'+tail);}
      if(was&&typeof r.name==='string'&&r.name.indexOf(was+' ')===0)r.name=name+r.name.slice(was.length);
    });});
  }else if(table==='workers'){
    var sw=function(v){return v===id?nid:v;};
    pkg.contracts.forEach(function(c){c.worker_id=sw(c.worker_id);});
    pkg.titles.forEach(function(t){if(t.holder_ids)t.holder_ids=t.holder_ids.map(sw);});
    pkg.teams.forEach(function(t){t.member_ids=(t.member_ids||[]).map(sw);if(t.leader_id)t.leader_id=sw(t.leader_id);});
    pkg.relationships.forEach(function(r){r.a=sw(r.a);r.b=sw(r.b);});
    pkg.workers.forEach(function(w){if(w.manager_id)w.manager_id=sw(w.manager_id);});
  }
  return nid;
};

/** The same world without some companies, for a player who wants a smaller game. Their wrestlers become
    free agents, or leave the world too when `gone` is true. The package passed in is left alone. */
$L.E.edWithout=function(pkg,ids,gone){
  var c=$L.edShape(JSON.parse(JSON.stringify(pkg)));
  (ids||[]).forEach(function(id){
    if(!$L.edFind(c,'promotions',id))return;
    var home=$L.E.edInfo(c).home,staff=c.workers.filter(function(w){return home[w.id]===id;}).map(function(w){return w.id;});
    $L.E.edRemove(c,'promotions',id);
    if(gone){
      var out={};staff.forEach(function(wid){out[wid]=1;});
      c.workers=c.workers.filter(function(w){return !out[w.id];});
      c.workers.forEach(function(w){if(w.manager_id&&out[w.manager_id])delete w.manager_id;});
      c.contracts=c.contracts.filter(function(x){return !out[x.worker_id];});
      c.titles.forEach(function(t){if(t.holder_ids)t.holder_ids=t.holder_ids.filter(function(h){return !out[h];});});
      c.teams.forEach(function(t){t.member_ids=(t.member_ids||[]).filter(function(m){return !out[m];});if(t.leader_id&&out[t.leader_id])delete t.leader_id;});
      c.teams=c.teams.filter(function(t){return (t.member_ids||[]).length>=2;});
      c.relationships=c.relationships.filter(function(r){return !out[r.a]&&!out[r.b];});
    }
  });
  return c;
};

/** Fill a company with unknowns so a new world is playable at once. The same seed makes the same people. */
export var ED_LADDER=['main_eventer','upper_midcarder','midcarder','midcarder','lower_midcarder','jobber'];
$L.ED_LADDER = ED_LADDER;
/** Ratings for a place on the card in a company of popularity `pop`: the maths E.edFill uses for unknowns. */
export function edRatings(st,pop,push,style){
  var tier=Math.max(0,$L.ED_LADDER.indexOf(push)),top=1-tier/5;
  var sk=function(lo,hi){return $L.clamp(Math.round(lo+(hi-lo)*$L.edRnd(st)+top*10),20,96);};
  var r={overness:$L.clamp(Math.round(pop-28+top*30+$L.edRnd(st)*8),8,97),brawling:sk(42,70),technical:sk(40,70),aerial:sk(35,68),stamina:sk(45,72),promo_skill:sk(35,70),charisma:sk(38,72)};
  if(style==='brawler'||style==='powerhouse')r.brawling=$L.clamp(r.brawling+10,20,96);
  if(style==='technician')r.technical=$L.clamp(r.technical+12,20,96);
  if(style==='flyer'||style==='striker')r.aerial=$L.clamp(r.aerial+12,20,96);
  if(style==='entertainer'){r.promo_skill=$L.clamp(r.promo_skill+12,20,96);r.charisma=$L.clamp(r.charisma+10,20,96);}
  return r;
}
export function edNames(pkg){var nm=pkg.names||{};return {m:nm.first_m&&nm.first_m.length>=8?nm.first_m:$L.FALLBACK_NAMES.firstM,f:nm.first_f&&nm.first_f.length>=6?nm.first_f:$L.FALLBACK_NAMES.firstF,l:nm.last&&nm.last.length>=8?nm.last:$L.FALLBACK_NAMES.last};}
/** A ring name nobody in the world has, from the world's own name lists (or the built-in ones). */
$L.E.edRandomName=function(pkg,gender,seed){
  $L.edShape(pkg);var st={s:(seed>>>0)||1},N=$L.edNames(pkg),used={},name,tries=0;pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  do{name=$L.edPick(st,gender==='F'?N.f:N.m)+' '+$L.edPick(st,N.l);tries++;}while(used[name]&&tries<60);
  return name;
};
/** Set a wrestler's ratings for a place on the card (main_eventer, midcarder or jobber), to suit their company. Keeps the
    ratings this does not set. Their push follows. */
$L.E.edSetTier=function(pkg,wid,push,seed){
  $L.edShape(pkg);var w=$L.edFind(pkg,'workers',wid);if(!w||$L.ED_LADDER.indexOf(push)<0)return null;
  var h=$L.edHome(pkg,wid),p=h?$L.edFind(pkg,'promotions',h.promotion_id):null,r=$L.edRatings({s:(seed>>>0)||1},p?$L.clamp(p.popularity,5,100):50,push,w.style);
  w.ratings=Object.assign({},w.ratings||{},r);if(h)h.push_level=push;return w;
};
/** Unsigned unknowns for the free-agent pool: names from the world's lists, ratings for the lower half of a card in
    a middling company. Men and women both. Returns the new wrestlers. */
/** Who can manage a wrestler: anyone with the Manager job other than themselves, the ones in the same company first. */
$L.E.edManagers=function(pkg,wid){
  $L.edShape(pkg);var home=$L.E.edHome(pkg,wid);
  return pkg.workers.filter(function(m){return m.id!==wid&&m.roles&&m.roles.indexOf('manager')>=0;})
    .sort(function(a,b){return (($L.E.edHome(pkg,b.id)===home)-($L.E.edHome(pkg,a.id)===home))||String(a.ring_name).localeCompare(String(b.ring_name));})
    .map(function(m){return {id:m.id,name:m.ring_name,same:$L.E.edHome(pkg,m.id)===home};});
};
/** Tie a wrestler to a manager, or untie them with null. */
$L.E.edSetManager=function(pkg,wid,mid){
  $L.edShape(pkg);var w=$L.edFind(pkg,'workers',wid);if(!w)return null;
  if(mid==null||mid===''){delete w.manager_id;return w;}
  var m=$L.edFind(pkg,'workers',mid);if(!m||m.id===wid||!m.roles||m.roles.indexOf('manager')<0)return null;
  w.manager_id=m.id;return w;
};
/** One thing done to several wrestlers at once: 'sign' to company `pid`, 'release' (free agents) or 'delete'. Returns how many. */
$L.E.edMany=function(pkg,ids,what,pid){
  $L.edShape(pkg);var n=0;(ids||[]).forEach(function(id){if(!$L.edFind(pkg,'workers',id))return;
    if(what==='sign'&&pid){$L.E.edSign(pkg,id,pid);n++;}else if(what==='release'){$L.E.edSign(pkg,id,null);n++;}else if(what==='delete'){$L.E.edRemove(pkg,'workers',id);n++;}});
  return n;
};
/* ---------- brands: a company split into rosters, each with its own shows and belts ---------- */
/** Add a brand to company `pid`. Returns it. */
$L.E.edAddBrand=function(pkg,pid,name){
  $L.edShape(pkg);var p=$L.edFind(pkg,'promotions',pid);if(!p)return null;var B=p.brands||(p.brands=[]),nm=String(name||'').trim()||'Brand '+(B.length+1),used={};
  B.forEach(function(b){used[b.id]=1;});var base=$L.slug(nm)||'brand',id=base,n=2;while(used[id]){id=base+'_'+n;n++;}
  var b={id:id,name:nm};B.push(b);return b;
};
/** Rename a brand, or set whether it is the developmental one. */
$L.E.edSetBrand=function(pkg,pid,bid,o){
  var p=$L.edFind(pkg,'promotions',pid),b=p&&p.brands?p.brands.filter(function(x){return x.id===bid;})[0]:null;if(!b)return null;
  if(o.name!=null)b.name=String(o.name);if(o.dev!=null){if(o.dev)b.dev=true;else delete b.dev;}return b;
};
/** Remove a brand. Its shows, belts and contracts are left with no brand. */
$L.E.edRemoveBrand=function(pkg,pid,bid){
  $L.edShape(pkg);var p=$L.edFind(pkg,'promotions',pid);if(!p||!p.brands)return false;
  p.brands=p.brands.filter(function(b){return b.id!==bid;});if(!p.brands.length)delete p.brands;
  ['shows','titles','contracts'].forEach(function(t){pkg[t].forEach(function(r){if(r.promotion_id===pid&&r.brand===bid)delete r.brand;});});
  return true;
};
/** Put a show, belt or contract on a brand ('' for none). */
$L.E.edPutBrand=function(rec,bid){if(!rec)return;if(bid)rec.brand=bid;else delete rec.brand;};
/* ---------- the world's own lists: sponsors, columnists and the names newcomers are given ---------- */
export var ED_LISTS={sponsors:['sponsors'],columnists:['columnists'],first_m:['names','first_m'],first_f:['names','first_f'],last:['names','last'],
  net_small:['networks','small'],net_cable:['networks','cable'],net_major:['networks','major']};
$L.ED_LISTS = ED_LISTS;
/** A world list as text, one name a line. */
$L.E.edListText=function(pkg,key){var k=$L.ED_LISTS[key];if(!k)return '';var v=k.length===1?pkg[k[0]]:(pkg[k[0]]||{})[k[1]];return (v||[]).join('\n');};
/** Set a world list from text, one name a line. Blank lines and repeats go; an empty list goes back to the game's own. */
$L.E.edSetList=function(pkg,key,text){
  var k=$L.ED_LISTS[key];if(!k)return 0;var seen={},L=String(text||'').split(/\r?\n/).map(function(x){return x.trim().slice(0,40);}).filter(function(x){if(!x||seen[x])return false;seen[x]=1;return true;}).slice(0,200);
  if(k.length===1){if(L.length)pkg[k[0]]=L;else delete pkg[k[0]];}
  else{var N=pkg[k[0]]||(pkg[k[0]]={});if(L.length)N[k[1]]=L;else delete N[k[1]];if(!Object.keys(N).length)delete pkg[k[0]];}
  return L.length;
};
/** The three sizes of network a show can be on, in order (0 small, 1 cable, 2 major), and the game's own names for each. */
$L.E.NET_SIZES=[['small','A small network'],['cable','A cable network'],['major','A major network']];
$L.E.edNetNames=function(pkg,t){var k=$L.E.NET_SIZES[t]&&$L.E.NET_SIZES[t][0],L=k&&pkg.networks&&pkg.networks[k];return L&&L.length>1?L.slice():$L.AIR_NETS[t].slice();};
/** A world ready to rename instead of build. 'territory': two companies sharing a region, one bigger than the other.
    'nine': nine companies, one of each model, from a national giant down to a small promotion, every roster filled with
    unknowns. Names are invented and plain, made to be changed. */
export var ED_QUICK={
  territory:[['NTW','Northern Territory Wrestling','classic',58,22],['SCW','Southern Championship Wrestling','outlaw',44,16]],
  nine:[['UWA','United Wrestling Alliance','corporate',85,40],['GPW','Grand Prix Wrestling','purist',66,26],['HCW','Hard Count Wrestling','workrate',58,22],
    ['RCW','Rust City Wrestling','outlaw',50,20],['NMP','New Money Pro','startup',48,18],['UPW','Underground Pro Wrestling','underdog',44,18],
    ['LEL','Liga Estrella Libre','spectacle',56,22],['LTC','Lucha Tradicional del Centro','tradition',46,18],['SJW','Starlight Joshi Wrestling','joshi',42,16]]
};
$L.ED_QUICK = ED_QUICK;
$L.E.edQuick=function(kind,name,seed){
  var L=$L.ED_QUICK[kind];if(!L)return null;var pkg=$L.E.edNew(name||(kind==='nine'?'A world of unknowns':'A territory')),k=(seed>>>0)||1;
  L.forEach(function(x,i){var p=$L.E.edAddPromo(pkg,{name:x[0],full_name:x[1],model:$L.MODELS[x[2]]?x[2]:'classic',popularity:x[3]});
    if($L.MODELS[p.model]&&$L.MODELS[p.model].gender==='F')pkg.titles.forEach(function(t){if(t.promotion_id===p.id)t.gender='F';});
    $L.E.edFill(pkg,p.id,x[4],k+i*7919);});
  $L.E.edFillFree(pkg,kind==='nine'?12:6,k+104729);
  return pkg;
};
/** How a company stands, in a few plain lines: the top of the card against its popularity, and its men and women
    against its belts. `warn` is set on a line that needs fixing before the world plays well. */
$L.E.edHealth=function(pkg,pid){
  $L.edShape(pkg);var p=$L.edFind(pkg,'promotions',pid);if(!p)return [];
  var ros=pkg.contracts.filter(function(c){return c.promotion_id===pid;}).map(function(c){return {c:c,w:$L.edFind(pkg,'workers',c.worker_id)};}).filter(function(x){return x.w&&$L.edIsWrestler(x.w);});
  var ov=function(x){return (x.w.ratings&&x.w.ratings.overness)||0;},top=ros.filter(function(x){return x.c.push_level==='main_eventer';}),L=[];
  var pop=p.popularity||50,need=Math.max(20,pop-5);
  if(!top.length)L.push({t:'Nobody is booked as a main eventer. Put two or three of the most over at the top.',warn:true});
  else{var a=Math.round(top.reduce(function(s,x){return s+ov(x);},0)/top.length);
    L.push({t:top.length+' main eventer'+(top.length===1?'':'s')+', '+a+' overness on average, for a company at '+pop+' popularity.'+(a<need-10?' The top of the card is far below what a company this size needs.':(a<need?' A little light at the top.':'')),warn:a<need-10});}
  var men=ros.filter(function(x){return x.w.gender!=='F';}).length,women=ros.length-men,belts=pkg.titles.filter(function(t){return t.promotion_id===pid;});
  var mb=belts.filter(function(t){return t.gender!=='F';}).length,wb=belts.length-mb;
  L.push({t:men+' men and '+women+' women for '+mb+' men\'s and '+wb+' women\'s belt'+(belts.length===1?'':'s')+'.'+(wb&&women<4?' Too few women for a women\'s belt.':'')+(mb&&men<4?' Too few men for a men\'s belt.':''),warn:(wb&&women<4)||(mb&&men<4)});
  return L;
};
$L.E.edFillFree=function(pkg,n,seed){
  $L.edShape(pkg);var st={s:(seed>>>0)||1},N=$L.edNames(pkg),used={},made=[],styles=Object.keys($L.STYLE_KEY),low=['midcarder','lower_midcarder','jobber'];
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});n=$L.clamp(Math.round(n)||6,1,40);
  for(var i=0;i<n;i++){
    var g=i%3===2?'F':'M',name,tries=0;do{name=$L.edPick(st,g==='F'?N.f:N.m)+' '+$L.edPick(st,N.l);tries++;}while(used[name]&&tries<40);used[name]=1;
    var style=$L.edPick(st,styles);
    made.push($L.E.edAddWorker(pkg,{ring_name:name,gender:g,age:19+Math.floor($L.edRnd(st)*16),disposition:$L.edRnd(st)<0.5?'face':'heel',style:style,ratings:$L.edRatings(st,45,low[i%3],style)}));
  }
  return made;
};
$L.E.edFill=function(pkg,pid,n,seed){
  $L.edShape(pkg);var p=$L.edFind(pkg,'promotions',pid);if(!p)return [];
  var st={s:(seed>>>0)||1},MD=$L.MODELS[p.model]||$L.MODELS.classic,nm=pkg.names||{},made=[];
  var fm=nm.first_m&&nm.first_m.length>=8?nm.first_m:$L.FALLBACK_NAMES.firstM,ff=nm.first_f&&nm.first_f.length>=6?nm.first_f:$L.FALLBACK_NAMES.firstF,ln=nm.last&&nm.last.length>=8?nm.last:$L.FALLBACK_NAMES.last;
  var women=(pkg.titles||[]).some(function(t){return t.promotion_id===pid&&t.gender==='F';}),styles=Object.keys($L.STYLE_KEY),used={};
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  var ladder=$L.ED_LADDER,pop=$L.clamp(p.popularity,5,100);
  n=$L.clamp(Math.round(n)||12,1,60);
  for(var i=0;i<n;i++){
    var g=MD.gender||(women&&i%4===3?'F':'M'),name,tries=0;
    do{name=$L.edPick(st,g==='F'?ff:fm)+' '+$L.edPick(st,ln);tries++;}while(used[name]&&tries<40);used[name]=1;
    var push=ladder[i%ladder.length],style=$L.edPick(st,styles),r=$L.edRatings(st,pop,push,style);
    made.push($L.E.edAddWorker(pkg,{ring_name:name,gender:g,age:20+Math.floor($L.edRnd(st)*18),disposition:$L.edRnd(st)<0.5?'face':'heel',style:style,ratings:r,promotion_id:pid,push_level:push}));
  }
  return made;
};

/** Counts for the editor's lists. */
$L.E.edInfo=function(pkg){
  $L.edShape(pkg);var per={},home={};
  pkg.promotions.forEach(function(p){per[p.id]={roster:0,men:0,women:0,shows:0,titles:0,teams:0};});
  pkg.contracts.forEach(function(c){if((c.contract_type||'exclusive')==='exclusive')home[c.worker_id]=c.promotion_id;});
  pkg.workers.forEach(function(w){var h=home[w.id];if(h&&per[h]&&$L.edIsWrestler(w)){per[h].roster++;per[h][w.gender==='F'?'women':'men']++;}});
  pkg.shows.forEach(function(s){if(per[s.promotion_id])per[s.promotion_id].shows++;});
  pkg.titles.forEach(function(t){if(per[t.promotion_id])per[t.promotion_id].titles++;});
  pkg.teams.forEach(function(t){if(per[t.promotion_id])per[t.promotion_id].teams++;});
  return {per:per,home:home,workers:pkg.workers.length,free:pkg.workers.filter(function(w){return !home[w.id];}).length};
};

/** The checker, in plain words. Each line says where the problem is, so the editor can take the player to it. */
$L.E.edCheck=function(pkg){
  $L.edShape(pkg);var v=$L.E.validateUniverse(pkg),out=[];
  var line=function(lvl){return function(x){
    var m=/^([a-z]+)(?:\[(\d+)\])?/.exec(String(x.at)),table=m?m[1]:'package',i=m&&m[2]!=null?+m[2]:-1,rec=i>=0&&pkg[table]?pkg[table][i]:null,name='';
    if(table==='contracts'&&rec){var w=$L.edFind(pkg,'workers',rec.worker_id);name=w?w.ring_name:rec.worker_id;rec=w;table='workers';}
    else if(table==='relationships'&&rec){var a=$L.edFind(pkg,'workers',rec.a),b=$L.edFind(pkg,'workers',rec.b);name=(a?a.ring_name:rec.a)+' and '+(b?b.ring_name:rec.b);}
    else if(table==='events'&&rec)name=rec.name||('month '+rec.month);
    else if(rec)name=rec.ring_name||rec.name||rec.id||'';
    var msg=String(x.msg).replace(/\bpromotions\b/g,'companies').replace(/\bpromotion\b/g,'company').replace(/\buniverse\b/g,'world');
    msg=msg.charAt(0).toUpperCase()+msg.slice(1);if(!/[.!?]$/.test(msg))msg+='.';
    out.push({lvl:lvl,tab:$L.ED_TAB[table]||'world',table:table,id:rec&&rec.id?rec.id:null,where:$L.ED_TABLE_N[table]||'World',name:name,msg:msg});
  };};
  // a short events list is normal in the editor: empty months are called the Showcase
  var warns=v.warnings.filter(function(x){return x.at!=='events';});
  v.errors.forEach(line('error'));warns.forEach(line('warning'));
  return {ok:v.ok,errors:v.errors.length,warnings:warns.length,lines:out};
};

$L.E.ED={push:ED_PUSH_N,styles:ED_STYLE_N,roles:ED_ROLE_N,rels:ED_REL_N,ratings:ED_RATINGS,sides:{face:'Face',heel:'Heel',tweener:'In between'},
  levels:{3:'Top title',2:'Second title',1:'Third title'},weights:{cruiser:'Cruiserweight',heavy:'Heavyweight',super_heavy:'Super heavyweight'},
  lockers:{mentor:'Mentor',leader:'Leader',gatekeeper:'Gatekeeper',diva:'Diva',toxic:'Troublemaker'}};
$L.E.edHome=function(pkg,wid){var c=$L.edHome(pkg,wid);return c?c.promotion_id:null;};
$L.E.edContract=function(pkg,wid){return $L.edHome(pkg,wid);};

/* a company's own big events (NEXT.md 1.15): a name and a kind for a month; an empty name and the arena kind take the month back to the world's list */
$L.E.edPromoEvent=function(pkg,pid,month,o){
  var p=(pkg.promotions||[]).filter(function(x){return x.id===pid;})[0];if(!p||!(month>=1&&month<=12))return false;
  var L=p.events||(p.events=[]),e=L.filter(function(x){return x.month===month;})[0];if(!e){e={month:month};L.push(e);L.sort(function(a,b){return a.month-b.month;});}
  if(o.name!=null){var n=String(o.name).replace(/\s+/g,' ').replace(/^\s+/,'').slice(0,28);if(n.trim())e.name=n;else delete e.name;}
  if(o.type!=null){if(o.type&&o.type!=='arena'&&$L.EV_TYPES[o.type]&&o.type!=='flag')e.type=o.type;else delete e.type;}
  if(!e.name&&!e.type)p.events=L.filter(function(x){return x!==e;});else if(!e.name){e.name=(((pkg.events||[]).filter(function(x){return x.month===month;})[0])||{}).name||$L.MONTHS[month-1]+' Showcase';}
  if(!p.events.length)delete p.events;
  return true;
};

// hand this module's names back to the bridge once more, in case top-level code reassigned one
$L.ED_PUSH_N = ED_PUSH_N;
$L.ED_STYLE_N = ED_STYLE_N;
$L.ED_ROLE_N = ED_ROLE_N;
$L.ED_REL_N = ED_REL_N;
$L.ED_RATINGS = ED_RATINGS;
$L.ED_TABLES = ED_TABLES;
$L.ED_TABLE_N = ED_TABLE_N;
$L.ED_TAB = ED_TAB;
$L.edRnd = edRnd;
$L.edPick = edPick;
$L.edShape = edShape;
$L.edId = edId;
$L.edFind = edFind;
$L.edHome = edHome;
$L.edIsWrestler = edIsWrestler;
$L.ED_LADDER = ED_LADDER;
$L.edRatings = edRatings;
$L.edNames = edNames;
$L.ED_LISTS = ED_LISTS;
$L.ED_QUICK = ED_QUICK;
