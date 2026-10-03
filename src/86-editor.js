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
E.edFill=function(pkg,pid,n,seed){
  edShape(pkg);var p=edFind(pkg,'promotions',pid);if(!p)return [];
  var st={s:(seed>>>0)||1},MD=MODELS[p.model]||MODELS.classic,nm=pkg.names||{},made=[];
  var fm=nm.first_m&&nm.first_m.length>=8?nm.first_m:FALLBACK_NAMES.firstM,ff=nm.first_f&&nm.first_f.length>=6?nm.first_f:FALLBACK_NAMES.firstF,ln=nm.last&&nm.last.length>=8?nm.last:FALLBACK_NAMES.last;
  var women=(pkg.titles||[]).some(function(t){return t.promotion_id===pid&&t.gender==='F';}),styles=Object.keys(STYLE_KEY),used={};
  pkg.workers.forEach(function(w){used[w.ring_name]=1;});
  var ladder=['main_eventer','upper_midcarder','midcarder','midcarder','lower_midcarder','jobber'],pop=clamp(p.popularity,5,100);
  n=clamp(Math.round(n)||12,1,60);
  for(var i=0;i<n;i++){
    var g=MD.gender||(women&&i%4===3?'F':'M'),name,tries=0;
    do{name=edPick(st,g==='F'?ff:fm)+' '+edPick(st,ln);tries++;}while(used[name]&&tries<40);used[name]=1;
    var push=ladder[i%ladder.length],tier=ladder.indexOf(push),top=1-tier/5,style=edPick(st,styles);
    var sk=function(lo,hi){return clamp(Math.round(lo+(hi-lo)*edRnd(st)+top*10),20,96);};
    var r={overness:clamp(Math.round(pop-28+top*30+edRnd(st)*8),8,97),brawling:sk(42,70),technical:sk(40,70),aerial:sk(35,68),stamina:sk(45,72),promo_skill:sk(35,70),charisma:sk(38,72)};
    if(style==='brawler'||style==='powerhouse')r.brawling=clamp(r.brawling+10,20,96);
    if(style==='technician')r.technical=clamp(r.technical+12,20,96);
    if(style==='flyer'||style==='striker')r.aerial=clamp(r.aerial+12,20,96);
    if(style==='entertainer'){r.promo_skill=clamp(r.promo_skill+12,20,96);r.charisma=clamp(r.charisma+10,20,96);}
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
