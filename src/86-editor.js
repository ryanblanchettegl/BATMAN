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

/* ---------- unknowns: made-up people with ratings that suit a place on the card in a company of a given popularity ---------- */
var ED_LADDER=['main_eventer','upper_midcarder','midcarder','midcarder','lower_midcarder','jobber'];
function edNameLists(pkg){
  var nm=pkg.names||{};
  return {fm:nm.first_m&&nm.first_m.length>=8?nm.first_m:FALLBACK_NAMES.firstM,ff:nm.first_f&&nm.first_f.length>=6?nm.first_f:FALLBACK_NAMES.firstF,ln:nm.last&&nm.last.length>=8?nm.last:FALLBACK_NAMES.last};
}
/** The seven ratings that suit this style at this place on the card in a company of this popularity. `tier` counts from 0 (main event) to 5 (opener). */
function edRatings(st,pop,style,tier){
  var top=1-tier/5;
  var sk=function(lo,hi){return clamp(Math.round(lo+(hi-lo)*edRnd(st)+top*10),20,96);};
  var r={overness:clamp(Math.round(pop-28+top*30+edRnd(st)*8),8,97),brawling:sk(42,70),technical:sk(40,70),aerial:sk(35,68),stamina:sk(45,72),promo_skill:sk(35,70),charisma:sk(38,72)};
  if(style==='brawler'||style==='powerhouse')r.brawling=clamp(r.brawling+10,20,96);
  if(style==='technician')r.technical=clamp(r.technical+12,20,96);
  if(style==='flyer'||style==='striker')r.aerial=clamp(r.aerial+12,20,96);
  if(style==='entertainer'){r.promo_skill=clamp(r.promo_skill+12,20,96);r.charisma=clamp(r.charisma+10,20,96);}
  return r;
}
/** Make n unknowns. With a company they are signed to it; without one they are free agents. */
function edMakeWorkers(pkg,n,seed,o){
  edShape(pkg);var st={s:(seed>>>0)||1},L=edNameLists(pkg),made=[],used={};
  var styles=Object.keys(STYLE_KEY),ladder=ED_LADDER,pop=clamp(o.pop,5,100);
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  n=clamp(Math.round(n)||12,1,60);
  for(var i=0;i<n;i++){
    var g=o.only||(o.women&&i%4===3?'F':'M'),name,tries=0;
    do{name=edPick(st,g==='F'?L.ff:L.fm)+' '+edPick(st,L.ln);tries++;}while(used[name]&&tries<40);used[name]=1;
    var push=ladder[i%ladder.length],tier=ladder.indexOf(push),style=edPick(st,styles);
    var r=edRatings(st,pop,style,tier);
    made.push(E.edAddWorker(pkg,{ring_name:name,gender:g,age:20+Math.floor(edRnd(st)*18),disposition:edRnd(st)<0.5?'face':'heel',style:style,ratings:r,promotion_id:o.pid||null,push_level:o.pid?push:undefined}));
  }
  return made;
}
/** Fill a company with unknowns so a new world is playable at once. The same seed makes the same people. */
E.edFill=function(pkg,pid,n,seed){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p)return [];
  var MD=MODELS[p.model]||MODELS.classic;
  var women=(pkg.titles||[]).some(function(t){return t.promotion_id===pid&&t.gender==='F';});
  return edMakeWorkers(pkg,n,seed,{pid:pid,pop:p.popularity,only:MD.gender||null,women:women});
};
/** Make n unsigned wrestlers. Their ratings suit the middle of the world's companies. */
E.edMakeFree=function(pkg,n,seed){
  edShape(pkg);var ps=pkg.promotions.map(function(p){return p.popularity;}),pop=ps.length?Math.round(ps.reduce(function(a,b){return a+b;},0)/ps.length):40;
  var women=(pkg.titles||[]).some(function(t){return t.gender==='F';});
  return edMakeWorkers(pkg,n,seed,{pid:null,pop:pop,only:null,women:women});
};
/** A made-up ring name from the world's own lists. */
E.edRandomName=function(pkg,gender,seed){
  edShape(pkg);var st={s:(seed>>>0)||1},L=edNameLists(pkg),used={},name,tries=0;
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  do{name=edPick(st,gender==='F'?L.ff:L.fm)+' '+edPick(st,L.ln);tries++;}while(used[name]&&tries<40);
  return name;
};
/** Where a wrestler stands, for the "set ratings for" buttons: the three places an editor sets by hand. */
E.EDLEVELS={main_eventer:['Main eventer',0],midcarder:['Mid-carder',2],jobber:['Opener',5]};
/** Set a wrestler's seven main ratings to suit a place on the card in their company (or the middle of the world if unsigned). Other ratings are left as they were. */
E.edSetRatings=function(pkg,wid,level,seed){
  edShape(pkg);var w=edFind(pkg,'workers',wid),lv=E.EDLEVELS[level];if(!w||!lv)return null;
  var con=edHome(pkg,wid),p=con?edFind(pkg,'promotions',con.promotion_id):null,pop;
  if(p)pop=p.popularity;else{var ps=pkg.promotions.map(function(x){return x.popularity;});pop=ps.length?Math.round(ps.reduce(function(a,b){return a+b;},0)/ps.length):40;}
  var st={s:(seed>>>0)||1},r=edRatings(st,clamp(pop,5,100),w.style||'all_rounder',lv[1]);
  w.ratings=w.ratings||{};Object.keys(r).forEach(function(k){w.ratings[k]=r[k];});
  if(con&&edIsWrestler(w)){con.push_level=level==='main_eventer'?'main_eventer':(level==='jobber'?'jobber':'midcarder');}
  return w.ratings;
};

/* ---------- the lists: sort, find, count ---------- */
E.ED_SORTS={ovr:'Overness, highest first',name:'Name, A to Z',age:'Age, youngest first',company:'Company, then overness'};
/** The Wrestlers list: who matches the company filter and the search, in the chosen order, and how many of them are shown.
    o = {fp: '' (everyone), 'FA' (unsigned) or a company id; q: text; sort: a key of E.ED_SORTS; limit: how many rows to show} */
E.edList=function(pkg,o){
  edShape(pkg);o=o||{};var info=E.edInfo(pkg),q=String(o.q||'').trim().toLowerCase(),fp=o.fp||'',sort=E.ED_SORTS[o.sort]?o.sort:'ovr';
  var pname={};pkg.promotions.forEach(function(p){pname[p.id]=p.name;});
  var ov=function(w){return (w.ratings&&w.ratings.overness)||0;};
  var all=pkg.workers.filter(function(w){
    var h=info.home[w.id];
    return (fp===''||(fp==='FA'?!h:h===fp))&&(!q||String(w.ring_name).toLowerCase().indexOf(q)>=0);
  });
  all.sort(function(a,b){
    if(sort==='name')return String(a.ring_name).toLowerCase()<String(b.ring_name).toLowerCase()?-1:(String(a.ring_name).toLowerCase()>String(b.ring_name).toLowerCase()?1:0);
    if(sort==='age')return ((a.age==null?99:a.age)-(b.age==null?99:b.age))||(ov(b)-ov(a));
    if(sort==='company'){var pa=pname[info.home[a.id]]||'~',pb=pname[info.home[b.id]]||'~';return pa<pb?-1:(pa>pb?1:ov(b)-ov(a));}
    return ov(b)-ov(a);
  });
  var limit=o.limit||60;
  return {items:all.slice(0,limit),matching:all.length,shown:Math.min(all.length,limit),total:pkg.workers.length,info:info,pname:pname};
};

/* ---------- copies ---------- */
function edCopyName(pkg,table,name,max){
  var key=table==='workers'?'ring_name':'name',used={};(pkg[table]||[]).forEach(function(r){used[r[key]]=1;});
  var base=String(name||'').replace(/ \(copy( \d+)?\)$/,'').replace(/ \d+$/,''),n=2,cand;
  if(table==='promotions'){cand=base+' '+n;while(used[cand]||(max&&cand.length>max)){n++;cand=base.slice(0,Math.max(1,(max||12)-String(n).length-1))+' '+n;if(n>99)break;}return cand;}
  cand=base+' (copy)';while(used[cand]){n++;cand=base+' (copy '+n+')';}
  return cand;
}
/** A copy of a wrestler (with the same contract), a belt or a team (empty, with no champions or members), a show, or a company
    (with its shows and belts, empty of champions, and a new roster of unknowns as big as the old one, so the copy can be played at once;
    teams and ties are not copied). Returns the new record, or null. */
E.edDuplicate=function(pkg,table,id){
  edShape(pkg);var rec=edFind(pkg,table,id);if(!rec)return null;
  var c=JSON.parse(JSON.stringify(rec));
  if(table==='workers'){
    c.ring_name=edCopyName(pkg,'workers',rec.ring_name);c.id=edId(pkg,'workers',c.ring_name);
    delete c.manager_id;pkg.workers.push(c);
    var con=edHome(pkg,id);if(con){var k=JSON.parse(JSON.stringify(con));k.worker_id=c.id;pkg.contracts.push(k);}
    return c;
  }
  if(table==='titles'||table==='shows'||table==='teams'){
    c.name=edCopyName(pkg,table,rec.name);c.id=edId(pkg,table,rec.promotion_id+'_'+c.name);
    if(table==='titles')c.holder_ids=[];
    if(table==='teams'){c.member_ids=[];delete c.leader_id;}
    pkg[table].push(c);return c;
  }
  if(table==='promotions'){
    c.name=edCopyName(pkg,'promotions',rec.name,12);c.id=edId(pkg,'promotions',c.name,'fed');
    if(c.full_name)c.full_name=edCopyName(pkg,'promotions',c.full_name)+'';
    pkg.promotions.push(c);
    ['shows','titles'].forEach(function(t){
      pkg[t].filter(function(r){return r.promotion_id===id;}).slice().forEach(function(r){
        var x=JSON.parse(JSON.stringify(r)),tail=r.id.indexOf(id+'_')===0?r.id.slice(id.length+1):r.id;
        x.promotion_id=c.id;x.id=edId(pkg,t,c.id+'_'+tail);if(t==='titles')x.holder_ids=[];pkg[t].push(x);
      });
    });
    var n=pkg.contracts.filter(function(k){return k.promotion_id===id&&(k.contract_type||'exclusive')==='exclusive';}).length;
    E.edFill(pkg,c.id,clamp(n,8,40),(String(c.id).split('').reduce(function(a,ch){return (a*31+ch.charCodeAt(0))>>>0;},7))||1);
    return c;
  }
  return null;
};

/* ---------- several at once ---------- */
/** Sign every wrestler in the list to a company (pid null makes them free agents). */
E.edSignMany=function(pkg,ids,pid,push){edShape(pkg);var n=0;(ids||[]).forEach(function(id){if(edFind(pkg,'workers',id)){E.edSign(pkg,id,pid||null,push);n++;}});return n;};
/** Remove every wrestler in the list from the world. */
E.edRemoveMany=function(pkg,ids){edShape(pkg);var n=0;(ids||[]).slice().forEach(function(id){if(edFind(pkg,'workers',id)){E.edRemove(pkg,'workers',id);n++;}});return n;};

/* ---------- undo: a snapshot of the world before a delete, put back in place so open screens keep their handle on it ---------- */
E.edSnapshot=function(pkg){return JSON.stringify(pkg);};
E.edRestore=function(pkg,snap){
  var back=JSON.parse(snap);Object.keys(pkg).forEach(function(k){delete pkg[k];});Object.keys(back).forEach(function(k){pkg[k]=back[k];});return pkg;
};

/* ---------- managers ---------- */
/** Everyone in the world who has the Manager job, for the "managed by" pick. */
E.edManagers=function(pkg){edShape(pkg);return pkg.workers.filter(function(w){return w.roles&&w.roles.indexOf('manager')>=0;});};
E.edClients=function(pkg,mid){edShape(pkg);return pkg.workers.filter(function(w){return w.manager_id===mid;});};
/** Tie a wrestler to a manager, or untie with null. Taking the Manager job away from someone unties their clients (done by the caller through edSetRoles). */
E.edSetManager=function(pkg,wid,mid){
  var w=edFind(pkg,'workers',wid);if(!w)return false;
  if(!mid){delete w.manager_id;return true;}
  var m=edFind(pkg,'workers',mid);if(!m||mid===wid)return false;w.manager_id=mid;return true;
};
/** Set what a person does. If they stop being a manager, their clients lose them. */
E.edSetRoles=function(pkg,wid,roles){
  var w=edFind(pkg,'workers',wid);if(!w)return;
  w.roles=roles&&roles.length?roles.slice():['wrestler'];
  if(w.roles.indexOf('manager')<0)pkg.workers.forEach(function(x){if(x.manager_id===wid)delete x.manager_id;});
};

/* ---------- announcers, staff and brands on a company ---------- */
/** play-by-play and colour names, and the road agent and head writer */
E.edSetCrew=function(p,o){
  o=o||{};var clean1=function(v){return String(v==null?'':v).trim().slice(0,32);};
  if(o.pbp!=null||o.col!=null){
    var a=(p.announcers||[]).slice(0,2);while(a.length<2)a.push('');
    if(o.pbp!=null)a[0]=clean1(o.pbp);if(o.col!=null)a[1]=clean1(o.col);
    if(!a[0]&&!a[1])delete p.announcers;else p.announcers=a;
  }
  if(o.agent!=null||o.writer!=null){
    var s=p.staff||{};
    if(o.agent!=null){if(clean1(o.agent))s.road_agent=clean1(o.agent);else delete s.road_agent;}
    if(o.writer!=null){if(clean1(o.writer))s.head_writer=clean1(o.writer);else delete s.head_writer;}
    if(Object.keys(s).length)p.staff=s;else delete p.staff;
  }
  return p;
};
E.edBrands=function(p){return (p&&p.brands)||[];};
/** Add a brand to a company. A brand split needs two or more brands; the game ignores a single one. */
E.edAddBrand=function(pkg,pid,name,dev){
  var p=edFind(pkg,'promotions',pid);if(!p)return null;p.brands=p.brands||[];
  var nm=String(name||'').trim()||('Brand '+(p.brands.length+1)),used={};p.brands.forEach(function(b){used[b.id]=1;});
  var id=slug(nm)||'brand',base=id.slice(0,24),n=2;while(used[id]){id=base+'_'+n;n++;}
  var b={id:id,name:nm.slice(0,24)};if(dev)b.dev=true;p.brands.push(b);return b;
};
E.edRenameBrand=function(pkg,pid,bid,name){
  var p=edFind(pkg,'promotions',pid),b=p&&(p.brands||[]).filter(function(x){return x.id===bid;})[0];if(!b)return false;
  var nm=String(name==null?'':name).slice(0,24);b.name=nm;return true;
};
/** Remove a brand and clear it from every show, belt and contract that used it. If one brand is left, the split is dropped. */
E.edRemoveBrand=function(pkg,pid,bid){
  var p=edFind(pkg,'promotions',pid);if(!p||!p.brands)return false;
  var gone={};gone[bid]=1;
  p.brands=p.brands.filter(function(b){return b.id!==bid;});
  if(p.brands.length<2){p.brands.forEach(function(b){gone[b.id]=1;});delete p.brands;}
  ['shows','titles','contracts'].forEach(function(t){pkg[t].forEach(function(r){if(r.promotion_id===pid&&gone[r.brand])delete r.brand;});});
  return true;
};

/* ---------- world-wide lists: sponsors, columnists and the names newcomers get ---------- */
/** Turn text (one per line) into a clean list: trimmed, no blanks, no repeats, each at most 40 characters, at most 40 lines. */
E.edParseList=function(text,max){
  var seen={},out=[];String(text==null?'':text).split(/\r?\n/).forEach(function(l){
    l=l.trim().slice(0,max||40);if(l&&!seen[l.toLowerCase()]){seen[l.toLowerCase()]=1;out.push(l);}
  });
  return out.slice(0,40);
};
/** Write a world list. An empty list removes the field so the game uses its own. key: sponsors, columnists, first_m, first_f or last. */
E.edSetList=function(pkg,key,text){
  edShape(pkg);var list=E.edParseList(text);
  if(key==='sponsors'||key==='columnists'){if(list.length)pkg[key]=list;else delete pkg[key];return list;}
  if(key==='first_m'||key==='first_f'||key==='last'){
    pkg.names=pkg.names||{};if(list.length)pkg.names[key]=list;else delete pkg.names[key];
    if(!Object.keys(pkg.names).length)delete pkg.names;return list;
  }
  return null;
};
E.edGetList=function(pkg,key){
  if(key==='sponsors'||key==='columnists')return (pkg[key]||[]).slice();
  return ((pkg.names||{})[key]||[]).slice();
};
/** How many names the game needs before it uses a world's list instead of its own. */
E.ED_NEED={first_m:8,first_f:6,last:8};

/* ---------- a health line for each company ---------- */
/** Plain-word checks on a company: is the top of the card as strong as a company this popular needs, and do its belts match its people?
    Returns {ok, lines:[{lvl:'ok'|'warn', text}]}. */
E.edHealth=function(pkg,pid){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p)return {ok:true,lines:[]};
  var info=E.edInfo(pkg),roster=pkg.workers.filter(function(w){return info.home[w.id]===pid&&edIsWrestler(w);}),lines=[];
  var men=roster.filter(function(w){return w.gender!=='F';}).length,women=roster.length-men;
  var ov=function(w){return (w.ratings&&w.ratings.overness)||0;},top=roster.slice().sort(function(a,b){return ov(b)-ov(a);}).slice(0,3);
  if(top.length){
    var avgTop=Math.round(top.reduce(function(a,w){return a+ov(w);},0)/top.length),need=clamp(Math.round(p.popularity+4),12,97);
    if(avgTop<need-14)lines.push({lvl:'warn',text:'The top of the card is weak. Its three best average '+avgTop+' overness, and a company at popularity '+p.popularity+' needs about '+need+'. Crowds will not believe in the main events.'});
    else if(avgTop>need+16)lines.push({lvl:'warn',text:'The top of the card is far stronger than the company: its three best average '+avgTop+' overness against a popularity of '+p.popularity+'. Raise the popularity or the company will outgrow its place at once.'});
    else lines.push({lvl:'ok',text:'The top of the card suits the company: its three best average '+avgTop+' overness at popularity '+p.popularity+'.'});
  }else lines.push({lvl:'warn',text:'There is nobody on the roster yet.'});
  var belts=pkg.titles.filter(function(t){return t.promotion_id===pid;}),bm=belts.filter(function(t){return t.gender!=='F'&&!t.tag;}).length,bw=belts.filter(function(t){return t.gender==='F'&&!t.tag;}).length,bt=belts.filter(function(t){return t.tag;}).length;
  if(bw&&women<4)lines.push({lvl:'warn',text:'It has '+bw+' women’s '+(bw===1?'belt':'belts')+' but only '+women+(women===1?' woman':' women')+'. A women’s division needs at least four.'});
  if(bm&&men<Math.max(4,bm*3))lines.push({lvl:'warn',text:'It has '+bm+' men’s singles '+(bm===1?'belt':'belts')+' but only '+men+(men===1?' man':' men')+'. Each belt needs about three contenders.'});
  if(bt&&men+women<bt*4)lines.push({lvl:'warn',text:'It has '+bt+' tag '+(bt===1?'belt':'belts')+' but too few wrestlers to make teams. Each needs about four people.'});
  if(!lines.some(function(l){return l.lvl==='warn';})&&roster.length)lines.push({lvl:'ok',text:'Its belts and its roster match: '+men+' men, '+women+' women, '+belts.length+' '+(belts.length===1?'belt':'belts')+'.'});
  return {ok:!lines.some(function(l){return l.lvl==='warn';}),lines:lines};
};

/* ---------- quick starts: a whole world made in one press, to rename instead of build ---------- */
var QS_A=['Harbor','Lantern','Copperfield','Greywater','Stonebridge','Ember','Northgate','Silverline','Oakhurst','Redwing','Halcyon','Marlowe','Briar','Ironvale'];
var QS_B=['Wrestling Alliance','Championship Wrestling','Pro Wrestling','Wrestling Company','All-Star Wrestling','Wrestling Syndicate'];
/** kind: 'territory' (two companies, one big and one small) or 'nine' (nine companies of different sizes and models). */
E.edQuick=function(kind,name,seed){
  var st={s:(seed>>>0)||1},W=E.edNew(name||(kind==='nine'?'Nine companies':'A two-company territory'),''),spec;
  if(kind==='nine'){
    var models=['corporate','workrate','classic','outlaw','purist','spectacle','underdog','startup','tradition'];
    spec=[[85,0],[74,1],[66,2],[58,3],[50,4],[44,5],[38,6],[32,7],[26,8]].map(function(x){return {pop:x[0],model:models[x[1]]};});
    W.manifest.free_agents=60;
  }else spec=[{pop:64,model:'classic'},{pop:36,model:'underdog'}];
  var used={};
  spec.forEach(function(x){
    var a,full,short,t=0;do{a=edPick(st,QS_A);full=a+' '+edPick(st,QS_B);short=a.slice(0,3).toUpperCase();t++;}while((used[a]||used[short])&&t<50);used[a]=1;used[short]=1;
    var p=E.edAddPromo(W,{name:short,full_name:full,popularity:x.pop,model:x.model});
    p.owner={name:edPick(st,FALLBACK_NAMES.firstM)+' '+edPick(st,FALLBACK_NAMES.last),style:'stars',roots:'tradition',pledge:'pay'};
    E.edFill(W,p.id,Math.round(8+x.pop*0.22),Math.floor(edRnd(st)*1e9)+1);
    var men=W.workers.filter(function(w){return E.edHome(W,w.id)===p.id&&w.gender==='M';}).sort(function(a,b){return b.ratings.overness-a.ratings.overness;});
    var top=W.titles.filter(function(t2){return t2.promotion_id===p.id;})[0];if(top&&men[0]&&top.gender==='M')top.holder_ids=[men[0].id];
  });
  return W;
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
