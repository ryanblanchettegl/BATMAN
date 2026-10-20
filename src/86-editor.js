/* The World Editor's working parts: make, change and check a universe package.
   A package is plain JSON (docs/universe-format.md). Nothing here touches a running game. */
var ED_PUSH_N={main_eventer:'Main event',upper_midcarder:'Upper mid-card',midcarder:'Mid-card',lower_midcarder:'Lower mid-card',jobber:'Opening match',non_wrestler:'Does not wrestle'};
var ED_STYLE_N={brawler:'Brawler',technician:'Technician',flyer:'High flyer',powerhouse:'Powerhouse',all_rounder:'All-rounder',striker:'Striker',entertainer:'Entertainer'};
var ED_ROLE_N={wrestler:'Wrestler',manager:'Manager',announcer:'Announcer',referee:'Referee',road_agent:'Road agent',owner:'Owner',booker:'Booker'};
var ED_REL_N={rivalry:'Rivals',friendship:'Friends',mentor:'Mentor and student',family:'Family',partners:'Partners',dislike:'Dislike each other'};
var ED_RATINGS=[['overness','Overness',1],['brawling','Brawling',1],['technical','Technical',1],['aerial','Aerial',1],['stamina','Stamina',1],['promo_skill','Promo',1],
  ['charisma','Charisma',0],['hardcore','Hardcore',0],['star_quality','Star quality',0],['consistency','Consistency',0],['potential','Potential',0]];
var ED_TABLES=['promotions','shows','titles','workers','contracts','teams','relationships','events'];
var ED_TABLE_N={promotions:'Companies',shows:'Shows',titles:'Belts',workers:'Wrestlers',contracts:'Wrestlers',teams:'Teams',relationships:'Relationships',events:'Shows',manifest:'World',package:'World',media:'World'};
var ED_TAB={promotions:'companies',shows:'shows',titles:'belts',workers:'wrestlers',contracts:'wrestlers',teams:'teams',relationships:'teams',events:'shows',manifest:'world',package:'world',media:'world'};

function edRnd(st){st.s=(st.s*1664525+1013904223)%4294967296;return st.s/4294967296;}
function edPick(st,a){return a[Math.floor(edRnd(st)*a.length)];}
function edShape(pkg){ED_TABLES.forEach(function(t){if(!Array.isArray(pkg[t]))pkg[t]=[];});if(!pkg.manifest||typeof pkg.manifest!=='object')pkg.manifest={};return pkg;}
/** An id nobody sees: a slug of the name, made unique inside its table. */
function edId(pkg,table,name,fallback){
  var base=slug(name||'')||fallback||table.slice(0,4),used={},n=2,id;
  if(base.length<2)base=base+'_x';base=base.slice(0,36);
  (pkg[table]||[]).forEach(function(r){if(r&&r.id)used[r.id]=1;});
  id=base;while(used[id]){id=base+'_'+n;n++;}
  return id;
}
function edFind(pkg,table,id){var a=pkg[table]||[];for(var i=0;i<a.length;i++)if(a[i]&&a[i].id===id)return a[i];return null;}
function edHome(pkg,wid){var c=(pkg.contracts||[]).filter(function(x){return x.worker_id===wid&&(x.contract_type||'exclusive')==='exclusive';})[0];return c||null;}
function edIsWrestler(w){return !w.roles||!w.roles.length||w.roles.indexOf('wrestler')>=0;}

/** A new, empty world. It will not pass the check until it has two companies with six wrestlers and a show each. */
E.edNew=function(name,author){
  name=String(name||'').trim()||'My world';
  return {manifest:{id:slug(name)||'my_world',name:name,author:String(author||'').trim(),version:'1.0',schema_version:SCHEMA_VERSION,description:'',start_year:2026,start_month:10,free_agents:36},
    promotions:[],shows:[],titles:[],workers:[],contracts:[],teams:[],relationships:[],events:[]};
};
/** A deep copy under a new name, so the original is left alone. */
E.edCopy=function(pkg,name){
  var c=edShape(JSON.parse(JSON.stringify(pkg)));name=String(name||'').trim()||((c.manifest.name||'World')+' (copy)');
  c.manifest.id=slug(name)||'my_world';c.manifest.name=name;c.manifest.schema_version=SCHEMA_VERSION;return c;
};
/** Add a company. It arrives with a weekly show and a top title so it is playable as soon as it has a roster. */
E.edAddPromo=function(pkg,o){
  edShape(pkg);o=o||{};
  var name=String(o.name||'').trim()||'NEW',full=String(o.full_name||'').trim(),model=MODELS[o.model]?o.model:'classic',g=MODELS[model].gender||'M';
  var p={id:edId(pkg,'promotions',name,'fed'),name:name,full_name:full||name+' Wrestling',blurb:'',popularity:o.popularity!=null?clamp(Math.round(o.popularity),5,100):50,model:model,
    owner:{name:'The owner',style:'stars',roots:'tradition',pledge:'pay'},cities:[]};
  pkg.promotions.push(p);
  pkg.shows.push({id:edId(pkg,'shows',p.id+'_weekly'),promotion_id:p.id,name:name+' Weekly',weight:1});
  pkg.titles.push({id:edId(pkg,'titles',p.id+'_world'),promotion_id:p.id,name:name+' World Title',gender:g,level:3,tag:false,holder_ids:[]});
  return p;
};
E.edAddShow=function(pkg,pid,name){edShape(pkg);var s={id:edId(pkg,'shows',pid+'_'+(name||'show')),promotion_id:pid,name:String(name||'').trim()||'New show',weight:1};pkg.shows.push(s);return s;};
E.edAddTitle=function(pkg,pid,o){
  edShape(pkg);o=o||{};var p=edFind(pkg,'promotions',pid),MD=p&&MODELS[p.model];
  var t={id:edId(pkg,'titles',pid+'_'+(o.name||'title')),promotion_id:pid,name:String(o.name||'').trim()||'New title',gender:(MD&&MD.gender)||o.gender||'M',level:o.level||2,tag:!!o.tag,holder_ids:[]};
  pkg.titles.push(t);return t;
};
E.edAddWorker=function(pkg,o){
  edShape(pkg);o=o||{};var name=String(o.ring_name||'').trim()||'New wrestler';
  var w={id:edId(pkg,'workers',name,'worker'),ring_name:name,gender:o.gender==='F'?'F':'M',age:o.age||28,disposition:o.disposition||'face',roles:['wrestler'],style:o.style||'all_rounder',finisher:'',hometown:'',
    ratings:{overness:50,brawling:60,technical:60,aerial:55,stamina:60,promo_skill:55,charisma:55}};
  if(o.ratings)Object.keys(o.ratings).forEach(function(k){w.ratings[k]=o.ratings[k];});
  pkg.workers.push(w);
  if(o.promotion_id)E.edSign(pkg,w.id,o.promotion_id,o.push_level);
  return w;
};
E.edAddTeam=function(pkg,pid,kind){
  edShape(pkg);kind=kind==='stable'?'stable':'tag';
  var t={id:edId(pkg,'teams',pid+'_'+kind),name:kind==='stable'?'New stable':'New team',kind:kind,member_ids:[],promotion_id:pid};
  if(kind==='tag'){t.experience=50;t.chemistry=3;}
  pkg.teams.push(t);return t;
};
E.edAddRel=function(pkg,a,b,type){edShape(pkg);var r={a:a,b:b,type:REL_TYPES.indexOf(type)>=0?type:'rivalry',strength:60};pkg.relationships.push(r);return r;};

/** Put a wrestler under contract to a company, or make them a free agent with pid null.
    Titles and teams they held somewhere else are tidied up, so the world never points at someone who has left. */
/** A copy of one record, under a new name. A wrestler joins the same company at the same push; a belt starts vacant;
    a team starts with no members; a company brings its shows and belts but not its roster. Returns the copy. */
E.edDup=function(pkg,table,id){
  edShape(pkg);var r=edFind(pkg,table,id);if(!r)return null;
  var c=JSON.parse(JSON.stringify(r)),nk=table==='workers'?'ring_name':'name',nm=String(r[nk]||'')+' (copy)';c[nk]=nm;
  c.id=edId(pkg,table,nm,table.slice(0,4));
  if(table==='workers'){pkg.workers.push(c);var h=edHome(pkg,r.id);if(h)E.edSign(pkg,c.id,h.promotion_id,h.push_level);return c;}
  if(table==='titles'){c.holder_ids=[];pkg.titles.push(c);return c;}
  if(table==='teams'){c.member_ids=[];delete c.leader_id;pkg.teams.push(c);return c;}
  if(table==='promotions'){
    c.full_name=String(r.full_name||r.name)+' (copy)';pkg.promotions.push(c);
    pkg.shows.filter(function(x){return x.promotion_id===r.id;}).forEach(function(x){var y=JSON.parse(JSON.stringify(x));y.promotion_id=c.id;y.id=edId(pkg,'shows',c.id+'_'+(x.name||'show'));pkg.shows.push(y);});
    pkg.titles.filter(function(x){return x.promotion_id===r.id;}).forEach(function(x){var y=JSON.parse(JSON.stringify(x));y.promotion_id=c.id;y.holder_ids=[];y.id=edId(pkg,'titles',c.id+'_'+(x.name||'title'));pkg.titles.push(y);});
    return c;
  }
  return null;
};
E.edSign=function(pkg,wid,pid,push){
  edShape(pkg);var old=edHome(pkg,wid),from=old?old.promotion_id:null;
  if(from===pid){if(old&&push)old.push_level=push;return old;}
  pkg.contracts=pkg.contracts.filter(function(c){return c.worker_id!==wid;});
  if(from){
    pkg.titles.forEach(function(t){if(t.promotion_id===from&&t.holder_ids)t.holder_ids=t.holder_ids.filter(function(h){return h!==wid;});});
    pkg.teams.forEach(function(t){if(t.promotion_id===from){t.member_ids=(t.member_ids||[]).filter(function(m){return m!==wid;});if(t.leader_id===wid)delete t.leader_id;}});
  }
  if(!pid)return null;
  var w=edFind(pkg,'workers',wid),c={worker_id:wid,promotion_id:pid,contract_type:'exclusive',push_level:PUSH.indexOf(push)>=0?push:(w&&!edIsWrestler(w)?'non_wrestler':'midcarder')};
  pkg.contracts.push(c);return c;
};
/** Remove a record and everything that pointed at it. */
E.edRemove=function(pkg,table,id){
  edShape(pkg);
  if(table==='promotions'){
    pkg.promotions=pkg.promotions.filter(function(p){return p.id!==id;});
    ['shows','titles','teams'].forEach(function(t){pkg[t]=pkg[t].filter(function(r){return r.promotion_id!==id;});});
    pkg.contracts=pkg.contracts.filter(function(c){return c.promotion_id!==id;});
  }else if(table==='workers'){
    E.edSign(pkg,id,null);
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
E.edRename=function(pkg,table,id,name){
  edShape(pkg);var rec=edFind(pkg,table,id);if(!rec)return id;
  var key=table==='workers'?'ring_name':'name',was=rec[key];rec[key]=name;
  if(!String(name||'').trim())return id;
  var pre=(table==='shows'||table==='titles'||table==='teams')?rec.promotion_id+'_':'';
  rec.id='';var nid=edId(pkg,table,pre+name);rec.id=nid;
  if(nid===id)return id;
  if(table==='promotions'){
    ['shows','titles','teams','contracts'].forEach(function(t){pkg[t].forEach(function(r){if(r.promotion_id===id)r.promotion_id=nid;});});
    ['shows','titles','teams'].forEach(function(t){pkg[t].forEach(function(r){
      if(r.promotion_id!==nid)return;
      if(r.id.indexOf(id+'_')===0){var tail=r.id.slice(id.length+1);r.id='';r.id=edId(pkg,t,nid+'_'+tail);}
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
E.edWithout=function(pkg,ids,gone){
  var c=edShape(JSON.parse(JSON.stringify(pkg)));
  (ids||[]).forEach(function(id){
    if(!edFind(c,'promotions',id))return;
    var home=E.edInfo(c).home,staff=c.workers.filter(function(w){return home[w.id]===id;}).map(function(w){return w.id;});
    E.edRemove(c,'promotions',id);
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
var ED_LADDER=['main_eventer','upper_midcarder','midcarder','midcarder','lower_midcarder','jobber'];
/** Ratings for a place on the card in a company of popularity `pop`: the maths E.edFill uses for unknowns. */
function edRatings(st,pop,push,style){
  var tier=Math.max(0,ED_LADDER.indexOf(push)),top=1-tier/5;
  var sk=function(lo,hi){return clamp(Math.round(lo+(hi-lo)*edRnd(st)+top*10),20,96);};
  var r={overness:clamp(Math.round(pop-28+top*30+edRnd(st)*8),8,97),brawling:sk(42,70),technical:sk(40,70),aerial:sk(35,68),stamina:sk(45,72),promo_skill:sk(35,70),charisma:sk(38,72)};
  if(style==='brawler'||style==='powerhouse')r.brawling=clamp(r.brawling+10,20,96);
  if(style==='technician')r.technical=clamp(r.technical+12,20,96);
  if(style==='flyer'||style==='striker')r.aerial=clamp(r.aerial+12,20,96);
  if(style==='entertainer'){r.promo_skill=clamp(r.promo_skill+12,20,96);r.charisma=clamp(r.charisma+10,20,96);}
  return r;
}
function edNames(pkg){var nm=pkg.names||{};return {m:nm.first_m&&nm.first_m.length>=8?nm.first_m:FALLBACK_NAMES.firstM,f:nm.first_f&&nm.first_f.length>=6?nm.first_f:FALLBACK_NAMES.firstF,l:nm.last&&nm.last.length>=8?nm.last:FALLBACK_NAMES.last};}
/** A ring name nobody in the world has, from the world's own name lists (or the built-in ones). */
E.edRandomName=function(pkg,gender,seed){
  edShape(pkg);var st={s:(seed>>>0)||1},N=edNames(pkg),used={},name,tries=0;pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  do{name=edPick(st,gender==='F'?N.f:N.m)+' '+edPick(st,N.l);tries++;}while(used[name]&&tries<60);
  return name;
};
/** Set a wrestler's ratings for a place on the card (main_eventer, midcarder or jobber), to suit their company. Keeps the
    ratings this does not set. Their push follows. */
E.edSetTier=function(pkg,wid,push,seed){
  edShape(pkg);var w=edFind(pkg,'workers',wid);if(!w||ED_LADDER.indexOf(push)<0)return null;
  var h=edHome(pkg,wid),p=h?edFind(pkg,'promotions',h.promotion_id):null,r=edRatings({s:(seed>>>0)||1},p?clamp(p.popularity,5,100):50,push,w.style);
  w.ratings=Object.assign({},w.ratings||{},r);if(h)h.push_level=push;return w;
};
/** Unsigned unknowns for the free-agent pool: names from the world's lists, ratings for the lower half of a card in
    a middling company. Men and women both. Returns the new wrestlers. */
/** Who can manage a wrestler: anyone with the Manager job other than themselves, the ones in the same company first. */
E.edManagers=function(pkg,wid){
  edShape(pkg);var home=E.edHome(pkg,wid);
  return pkg.workers.filter(function(m){return m.id!==wid&&m.roles&&m.roles.indexOf('manager')>=0;})
    .sort(function(a,b){return ((E.edHome(pkg,b.id)===home)-(E.edHome(pkg,a.id)===home))||String(a.ring_name).localeCompare(String(b.ring_name));})
    .map(function(m){return {id:m.id,name:m.ring_name,same:E.edHome(pkg,m.id)===home};});
};
/** Tie a wrestler to a manager, or untie them with null. */
E.edSetManager=function(pkg,wid,mid){
  edShape(pkg);var w=edFind(pkg,'workers',wid);if(!w)return null;
  if(mid==null||mid===''){delete w.manager_id;return w;}
  var m=edFind(pkg,'workers',mid);if(!m||m.id===wid||!m.roles||m.roles.indexOf('manager')<0)return null;
  w.manager_id=m.id;return w;
};
/** One thing done to several wrestlers at once: 'sign' to company `pid`, 'release' (free agents) or 'delete'. Returns how many. */
E.edMany=function(pkg,ids,what,pid){
  edShape(pkg);var n=0;(ids||[]).forEach(function(id){if(!edFind(pkg,'workers',id))return;
    if(what==='sign'&&pid){E.edSign(pkg,id,pid);n++;}else if(what==='release'){E.edSign(pkg,id,null);n++;}else if(what==='delete'){E.edRemove(pkg,'workers',id);n++;}});
  return n;
};
/* ---------- brands: a company split into rosters, each with its own shows and belts ---------- */
/** Add a brand to company `pid`. Returns it. */
E.edAddBrand=function(pkg,pid,name){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p)return null;var B=p.brands||(p.brands=[]),nm=String(name||'').trim()||'Brand '+(B.length+1),used={};
  B.forEach(function(b){used[b.id]=1;});var base=slug(nm)||'brand',id=base,n=2;while(used[id]){id=base+'_'+n;n++;}
  var b={id:id,name:nm};B.push(b);return b;
};
/** Rename a brand, or set whether it is the developmental one. */
E.edSetBrand=function(pkg,pid,bid,o){
  var p=edFind(pkg,'promotions',pid),b=p&&p.brands?p.brands.filter(function(x){return x.id===bid;})[0]:null;if(!b)return null;
  if(o.name!=null)b.name=String(o.name);if(o.dev!=null){if(o.dev)b.dev=true;else delete b.dev;}return b;
};
/** Remove a brand. Its shows, belts and contracts are left with no brand. */
E.edRemoveBrand=function(pkg,pid,bid){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p||!p.brands)return false;
  p.brands=p.brands.filter(function(b){return b.id!==bid;});if(!p.brands.length)delete p.brands;
  ['shows','titles','contracts'].forEach(function(t){pkg[t].forEach(function(r){if(r.promotion_id===pid&&r.brand===bid)delete r.brand;});});
  return true;
};
/** Put a show, belt or contract on a brand ('' for none). */
E.edPutBrand=function(rec,bid){if(!rec)return;if(bid)rec.brand=bid;else delete rec.brand;};
/* ---------- the world's own lists: sponsors, columnists and the names newcomers are given ---------- */
var ED_LISTS={sponsors:['sponsors'],columnists:['columnists'],first_m:['names','first_m'],first_f:['names','first_f'],last:['names','last'],
  net_small:['networks','small'],net_cable:['networks','cable'],net_major:['networks','major']};
/** A world list as text, one name a line. */
E.edListText=function(pkg,key){var k=ED_LISTS[key];if(!k)return '';var v=k.length===1?pkg[k[0]]:(pkg[k[0]]||{})[k[1]];return (v||[]).join('\n');};
/** Set a world list from text, one name a line. Blank lines and repeats go; an empty list goes back to the game's own. */
E.edSetList=function(pkg,key,text){
  var k=ED_LISTS[key];if(!k)return 0;var seen={},L=String(text||'').split(/\r?\n/).map(function(x){return x.trim().slice(0,40);}).filter(function(x){if(!x||seen[x])return false;seen[x]=1;return true;}).slice(0,200);
  if(k.length===1){if(L.length)pkg[k[0]]=L;else delete pkg[k[0]];}
  else{var N=pkg[k[0]]||(pkg[k[0]]={});if(L.length)N[k[1]]=L;else delete N[k[1]];if(!Object.keys(N).length)delete pkg[k[0]];}
  return L.length;
};
/** The three sizes of network a show can be on, in order (0 small, 1 cable, 2 major), and the game's own names for each. */
E.NET_SIZES=[['small','A small network'],['cable','A cable network'],['major','A major network']];
E.edNetNames=function(pkg,t){var k=E.NET_SIZES[t]&&E.NET_SIZES[t][0],L=k&&pkg.networks&&pkg.networks[k];return L&&L.length>1?L.slice():AIR_NETS[t].slice();};
/** A world ready to rename instead of build. 'territory': two companies sharing a region, one bigger than the other.
    'nine': nine companies, one of each model, from a national giant down to a small promotion, every roster filled with
    unknowns. Names are invented and plain, made to be changed. */
var ED_QUICK={
  territory:[['NTW','Northern Territory Wrestling','classic',58,22],['SCW','Southern Championship Wrestling','outlaw',44,16]],
  nine:[['UWA','United Wrestling Alliance','corporate',85,40],['GPW','Grand Prix Wrestling','purist',66,26],['HCW','Hard Count Wrestling','workrate',58,22],
    ['RCW','Rust City Wrestling','outlaw',50,20],['NMP','New Money Pro','startup',48,18],['UPW','Underground Pro Wrestling','underdog',44,18],
    ['LEL','Liga Estrella Libre','spectacle',56,22],['LTC','Lucha Tradicional del Centro','tradition',46,18],['SJW','Starlight Joshi Wrestling','joshi',42,16]]
};
E.edQuick=function(kind,name,seed){
  var L=ED_QUICK[kind];if(!L)return null;var pkg=E.edNew(name||(kind==='nine'?'A world of unknowns':'A territory')),k=(seed>>>0)||1;
  L.forEach(function(x,i){var p=E.edAddPromo(pkg,{name:x[0],full_name:x[1],model:MODELS[x[2]]?x[2]:'classic',popularity:x[3]});
    if(MODELS[p.model]&&MODELS[p.model].gender==='F')pkg.titles.forEach(function(t){if(t.promotion_id===p.id)t.gender='F';});
    E.edFill(pkg,p.id,x[4],k+i*7919);});
  E.edFillFree(pkg,kind==='nine'?12:6,k+104729);
  return E.edComplete(pkg,k);
};
/* ---------- a world from a template comes complete (Ryan, 20 October: "new worlds come with templates or start from
   scratch"; a template has everything filled in). edComplete fills only what is missing, so it never undoes a change. */
var ED_EVENTS=['First Bell','Cold Steel','Spring Riot','The Grand Stage','Iron Bloom','Long Day Brawl','Scorcher','Dog Days','Harvest Moon Brawl','Fright Night Fight','Last Leaves','Year End Brawl'];
var ED_COLUMNS=['The Ringside Wire','The Turnbuckle Times','Mat Talk Weekly'];
var ED_SPONSORS=['Ironclad Tools','Blue Comet Energy','Harbor Lager','Pinnacle Insurance','Redline Auto Parts','Summit Sports Drinks','Big Sky Jerky','Voltage Games'];
var ED_STAFF={agent:['Hank Doyle','Rita Vance','Moe Kessler','Lou Bramble','Dot Fairweather','Sal Ortega','Gus Whitley','Ida Crane','Vic Lorne'],
  writer:['Penny Marsh','Theo Grant','Nadia Rook','Cliff Harlan','June Abbott','Rex Mallory','Ana Solis','Kit Darrow','Walt Emery'],
  pbp:['Jim Calder','Rosa Delgado','Marty Kane','Sam Whitfield','Eve Langston','Tony Brisco','Max Ferrell','Lena Ward','Art Hollis'],
  col:['Bobby Stroud','Dee Marlow','Chuck Rennick','Gail Torres','Vince Halloway','Frankie Moss','Nell Brody','Duke Carver','Tess Rowan']};
/** The cities a company of this kind tours, from the places the road knows: Mexico for lucha, Japan for joshi, the USA for the rest. */
function edCitiesFor(model,k,n){
  var all=Object.keys(CITY_AT),inMx=function(c){var a=CITY_AT[c];return a[0]>14&&a[0]<29.5&&a[1]>-118&&a[1]<-86;},inJp=function(c){var a=CITY_AT[c];return a[1]>128&&a[1]<146&&a[0]>30;},inUs=function(c){var a=CITY_AT[c];return a[0]>24&&a[0]<50&&a[1]>-125&&a[1]<-66&&!inMx(c);};
  var L=all.filter(model==='spectacle'||model==='tradition'?inMx:(model==='joshi'?inJp:inUs));if(L.length<4)L=all.filter(inUs);
  L.sort(function(a,b){return CITY_AT[a][1]-CITY_AT[b][1];});var out=[],st=k%L.length;for(var i=0;i<Math.min(n,L.length);i++)out.push(L[(st+i)%L.length]);return out;
}
E.edComplete=function(pkg,seed){
  edShape(pkg);var k=(seed>>>0)||1,pk=function(L,i){return L[(k+i*7)%L.length];};
  if(!pkg.events||!pkg.events.length)pkg.events=ED_EVENTS.map(function(n,i){return {month:i+1,name:n};});
  if(!pkg.networks)pkg.networks={small:AIR_NETS[0].slice(),cable:AIR_NETS[1].slice(),major:AIR_NETS[2].slice()};
  if(!pkg.sponsors||!pkg.sponsors.length)pkg.sponsors=ED_SPONSORS.slice();
  if(!pkg.columnists||!pkg.columnists.length)pkg.columnists=ED_COLUMNS.slice();
  var N=pkg.names||(pkg.names={});if(!N.first_m||N.first_m.length<8)N.first_m=FALLBACK_NAMES.firstM.slice();if(!N.first_f||N.first_f.length<6)N.first_f=FALLBACK_NAMES.firstF.slice();if(!N.last||N.last.length<8)N.last=FALLBACK_NAMES.last.slice();
  pkg.promotions.forEach(function(p,i){
    var MD=MODELS[p.model]||MODELS.classic,g=MD.gender,mine=pkg.titles.filter(function(t){return t.promotion_id===p.id;}),has=function(f){return mine.some(f);};
    if(!has(function(t){return t.level===2;}))E.edAddTitle(pkg,p.id,{name:p.name+(g==='F'?' International Title':' National Title'),level:2,gender:g||'M'});
    if(!has(function(t){return t.tag;})&&(pkg.workers||[]).filter(function(w){return E.edHome(pkg,w.id)===p.id;}).length>=12)E.edAddTitle(pkg,p.id,{name:p.name+' Tag Team Titles',level:2,tag:true,gender:g||'M'});
    if(!g&&!has(function(t){return t.gender==='F';}))E.edAddTitle(pkg,p.id,{name:p.name+' Women’s Title',level:3,gender:'F'});
    if(!p.cities||!p.cities.length)p.cities=edCitiesFor(p.model,hash(p.id+':'+k),8);
    if(!p.announcers||p.announcers.length<2)p.announcers=[pk(ED_STAFF.pbp,i),pk(ED_STAFF.col,i)];
    var sf=p.staff||(p.staff={});if(!sf.road_agent)sf.road_agent=pk(ED_STAFF.agent,i);if(!sf.head_writer)sf.head_writer=pk(ED_STAFF.writer,i);
    // the main show on a network to suit the company's size, with years on the air to match
    var sh=pkg.shows.filter(function(x){return x.promotion_id===p.id;})[0],pop=p.popularity||50;
    if(sh&&!sh.network){var t=pop>=68?2:(pop>=46?1:0),nets=pkg.networks[['small','cable','major'][t]]||AIR_NETS[t];sh.network=nets[(hash(p.id)+k)%nets.length];sh.network_size=t;if(sh.years_on_air==null)sh.years_on_air=p.model==='startup'?0:clamp(Math.round((pop-32)/2.2),1,40);}
  });
  return pkg;
};
/** The templates a new world can start from, besides the built-in worlds: what each is, for the New world pop-up. */
E.ED_TEMPLATES=[['territory','A two-company territory','Two companies sharing one region, one bigger than the other. Small rosters, ready to rename.'],['nine','Nine companies of unknowns','One company of each kind, from a national giant to a small joshi promotion, every roster filled with unknowns.']];
/* ---------- import wrestlers from another world (Ryan, 20 October: "an import button so people can import their wrestlers
   from other worlds or Steam"). Each comes in as a free agent with a new id, their look, ratings and biography, and any of
   the other world's own scenes their entrance, moves and taunts play (moves made in Create a Move come with them). */
function edLookScenes(lk){var L=[];if(!lk)return L;if(lk.entrance)L.push(lk.entrance);(lk.finishing_moves||[]).forEach(function(f){if(f.preview_pose_id)L.push(f.preview_pose_id);});(lk.moveset||[]).forEach(function(m){if(m.scene)L.push(m.scene);});(lk.taunts||[]).forEach(function(t){L.push(t);});return L;}
/** The wrestlers in a world, for the Import pop-up: id, name, company and overness. */
E.edImportList=function(src){var h={};(src.contracts||[]).forEach(function(c){var p=(src.promotions||[]).filter(function(x){return x.id===c.promotion_id;})[0];if(p)h[c.worker_id]=p.name;});
  return (src.workers||[]).map(function(w){return {id:w.id,name:w.ring_name||w.id,co:h[w.id]||'Free agent',over:(w.ratings&&w.ratings.overness)||0,look:!!w.look,g:w.gender};});};
/** Bring workers `ids` from world `src` into `pkg` as free agents. Returns the new records. */
E.edImportWorkers=function(pkg,src,ids){
  edShape(pkg);var out=[],want={};(ids||[]).forEach(function(i){want[i]=1;});
  var have={};(pkg.scenes||[]).forEach(function(x){have[x.id]=1;});
  (src.workers||[]).forEach(function(w0){if(!want[w0.id])return;
    var w=JSON.parse(JSON.stringify(w0));delete w.manager_id;w.id=edId(pkg,'workers',w.ring_name||w0.id,'work');pkg.workers.push(w);out.push(w);
    edLookScenes(w.look).forEach(function(sid){if(have[sid])return;var sc=(src.scenes||[]).filter(function(x){return x&&x.id===sid;})[0];if(sc){(pkg.scenes||(pkg.scenes=[])).push(JSON.parse(JSON.stringify(sc)));have[sid]=1;}});});
  return out;
};
/** Wrestlers `ids` of world `pkg` as one file (.wrestler.json) to keep, share or put on the Steam Workshop: each whole
    record (biography, attributes, look, moves) and the world's own scenes their entrance, moves and taunts play. */
E.edExportWorkers=function(pkg,ids){
  var want={},out={kind:'wrestlers',v:1,from:(pkg.manifest&&pkg.manifest.name)||'',workers:[],scenes:[]},seen={};(ids||[]).forEach(function(i){want[i]=1;});
  (pkg.workers||[]).forEach(function(w){if(!want[w.id])return;var c=JSON.parse(JSON.stringify(w));delete c.manager_id;out.workers.push(c);
    edLookScenes(w.look).forEach(function(sid){if(seen[sid])return;var sc=(pkg.scenes||[]).filter(function(x){return x&&x.id===sid;})[0];if(sc){seen[sid]=1;out.scenes.push(JSON.parse(JSON.stringify(sc)));}});});
  return out;
};
/** Bring in a wrestler file: one written by Export (any number of whole wrestlers) or by Create a Wrestler's Write a file (a look). Returns the new records, or null when it is not one. */
E.edImportFile=function(pkg,data,o){
  if(data&&data.kind==='wrestlers'&&Array.isArray(data.workers)){var ok=data.workers.filter(function(w){return w&&typeof w==='object'&&w.ring_name;});
    return E.edImportWorkers(pkg,{workers:ok,scenes:Array.isArray(data.scenes)?data.scenes:[]},ok.map(function(w){return w.id;}));}
  var w=E.edImportLook(pkg,data,o);return w?[w]:null;
};
/** A wrestler from a .wrestler.json file (Create a Wrestler's Write a file), as a free agent in `pkg`. */
E.edImportLook=function(pkg,look,o){
  var c=lookClean(look);if(!c||!E.lookOk(c))return null;o=o||{};var pa=c.physical_attributes||{};
  var w=E.edAddWorker(pkg,{ring_name:c.name||o.name||'New wrestler',gender:pa.sex==='F'?'F':'M'});w.look=c;if(c.hometown)w.hometown=c.hometown;return w;
};
/** How a company stands, in a few plain lines: the top of the card against its popularity, and its men and women
    against its belts. `warn` is set on a line that needs fixing before the world plays well. */
E.edHealth=function(pkg,pid){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p)return [];
  var ros=pkg.contracts.filter(function(c){return c.promotion_id===pid;}).map(function(c){return {c:c,w:edFind(pkg,'workers',c.worker_id)};}).filter(function(x){return x.w&&edIsWrestler(x.w);});
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
E.edFillFree=function(pkg,n,seed){
  edShape(pkg);var st={s:(seed>>>0)||1},N=edNames(pkg),used={},made=[],styles=Object.keys(STYLE_KEY),low=['midcarder','lower_midcarder','jobber'];
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});n=clamp(Math.round(n)||6,1,40);
  for(var i=0;i<n;i++){
    var g=i%3===2?'F':'M',name,tries=0;do{name=edPick(st,g==='F'?N.f:N.m)+' '+edPick(st,N.l);tries++;}while(used[name]&&tries<40);used[name]=1;
    var style=edPick(st,styles);
    made.push(E.edAddWorker(pkg,{ring_name:name,gender:g,age:19+Math.floor(edRnd(st)*16),disposition:edRnd(st)<0.5?'face':'heel',style:style,ratings:edRatings(st,45,low[i%3],style)}));
  }
  return made;
};
E.edFill=function(pkg,pid,n,seed){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p)return [];
  var st={s:(seed>>>0)||1},MD=MODELS[p.model]||MODELS.classic,nm=pkg.names||{},made=[];
  var fm=nm.first_m&&nm.first_m.length>=8?nm.first_m:FALLBACK_NAMES.firstM,ff=nm.first_f&&nm.first_f.length>=6?nm.first_f:FALLBACK_NAMES.firstF,ln=nm.last&&nm.last.length>=8?nm.last:FALLBACK_NAMES.last;
  var women=(pkg.titles||[]).some(function(t){return t.promotion_id===pid&&t.gender==='F';}),styles=Object.keys(STYLE_KEY),used={};
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  var ladder=ED_LADDER,pop=clamp(p.popularity,5,100);
  n=clamp(Math.round(n)||12,1,60);
  for(var i=0;i<n;i++){
    var g=MD.gender||(women&&i%4===3?'F':'M'),name,tries=0;
    do{name=edPick(st,g==='F'?ff:fm)+' '+edPick(st,ln);tries++;}while(used[name]&&tries<40);used[name]=1;
    var push=ladder[i%ladder.length],style=edPick(st,styles),r=edRatings(st,pop,push,style);
    made.push(E.edAddWorker(pkg,{ring_name:name,gender:g,age:20+Math.floor(edRnd(st)*18),disposition:edRnd(st)<0.5?'face':'heel',style:style,ratings:r,promotion_id:pid,push_level:push}));
  }
  return made;
};

/** Counts for the editor's lists. */
E.edInfo=function(pkg){
  edShape(pkg);var per={},home={};
  pkg.promotions.forEach(function(p){per[p.id]={roster:0,men:0,women:0,shows:0,titles:0,teams:0};});
  pkg.contracts.forEach(function(c){if((c.contract_type||'exclusive')==='exclusive')home[c.worker_id]=c.promotion_id;});
  pkg.workers.forEach(function(w){var h=home[w.id];if(h&&per[h]&&edIsWrestler(w)){per[h].roster++;per[h][w.gender==='F'?'women':'men']++;}});
  pkg.shows.forEach(function(s){if(per[s.promotion_id])per[s.promotion_id].shows++;});
  pkg.titles.forEach(function(t){if(per[t.promotion_id])per[t.promotion_id].titles++;});
  pkg.teams.forEach(function(t){if(per[t.promotion_id])per[t.promotion_id].teams++;});
  return {per:per,home:home,workers:pkg.workers.length,free:pkg.workers.filter(function(w){return !home[w.id];}).length};
};

/** The checker, in plain words. Each line says where the problem is, so the editor can take the player to it. */
E.edCheck=function(pkg){
  edShape(pkg);var v=E.validateUniverse(pkg),out=[];
  var line=function(lvl){return function(x){
    var m=/^([a-z]+)(?:\[(\d+)\])?/.exec(String(x.at)),table=m?m[1]:'package',i=m&&m[2]!=null?+m[2]:-1,rec=i>=0&&pkg[table]?pkg[table][i]:null,name='';
    if(table==='contracts'&&rec){var w=edFind(pkg,'workers',rec.worker_id);name=w?w.ring_name:rec.worker_id;rec=w;table='workers';}
    else if(table==='relationships'&&rec){var a=edFind(pkg,'workers',rec.a),b=edFind(pkg,'workers',rec.b);name=(a?a.ring_name:rec.a)+' and '+(b?b.ring_name:rec.b);}
    else if(table==='events'&&rec)name=rec.name||('month '+rec.month);
    else if(rec)name=rec.ring_name||rec.name||rec.id||'';
    var msg=String(x.msg).replace(/\bpromotions\b/g,'companies').replace(/\bpromotion\b/g,'company').replace(/\buniverse\b/g,'world');
    msg=msg.charAt(0).toUpperCase()+msg.slice(1);if(!/[.!?]$/.test(msg))msg+='.';
    out.push({lvl:lvl,tab:ED_TAB[table]||'world',table:table,id:rec&&rec.id?rec.id:null,where:ED_TABLE_N[table]||'World',name:name,msg:msg});
  };};
  // a short events list is normal in the editor: empty months are called the Showcase
  var warns=v.warnings.filter(function(x){return x.at!=='events';});
  v.errors.forEach(line('error'));warns.forEach(line('warning'));
  return {ok:v.ok,errors:v.errors.length,warnings:warns.length,lines:out};
};

E.ED={push:ED_PUSH_N,styles:ED_STYLE_N,roles:ED_ROLE_N,rels:ED_REL_N,ratings:ED_RATINGS,sides:{face:'Face',heel:'Heel',tweener:'In between'},
  levels:{3:'Top title',2:'Second title',1:'Third title'},weights:{cruiser:'Cruiserweight',heavy:'Heavyweight',super_heavy:'Super heavyweight'},
  lockers:{mentor:'Mentor',leader:'Leader',gatekeeper:'Gatekeeper',diva:'Diva',toxic:'Troublemaker'}};
E.edHome=function(pkg,wid){var c=edHome(pkg,wid);return c?c.promotion_id:null;};
E.edContract=function(pkg,wid){return edHome(pkg,wid);};

/* a company's own big events (NEXT.md 1.15): a name and a kind for a month; an empty name and the arena kind take the month back to the world's list */
E.edPromoEvent=function(pkg,pid,month,o){
  var p=(pkg.promotions||[]).filter(function(x){return x.id===pid;})[0];if(!p||!(month>=1&&month<=12))return false;
  var L=p.events||(p.events=[]),e=L.filter(function(x){return x.month===month;})[0];if(!e){e={month:month};L.push(e);L.sort(function(a,b){return a.month-b.month;});}
  if(o.name!=null){var n=String(o.name).replace(/\s+/g,' ').replace(/^\s+/,'').slice(0,28);if(n.trim())e.name=n;else delete e.name;}
  if(o.type!=null){if(o.type&&o.type!=='arena'&&EV_TYPES[o.type]&&o.type!=='flag')e.type=o.type;else delete e.type;}
  if(!e.name&&!e.type)p.events=L.filter(function(x){return x!==e;});else if(!e.name){e.name=(((pkg.events||[]).filter(function(x){return x.month===month;})[0])||{}).name||MONTHS[month-1]+' Showcase';}
  if(!p.events.length)delete p.events;
  return true;
};
