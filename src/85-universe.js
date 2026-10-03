/* ---------- universe packages: every roster, built-in or community-made, loads through this ----------
   A package is a manifest plus eight tables joined by string ids. The folder form (one JSON file per table)
   and the packed form (one JSON file with every table) carry the same data; this module reads the packed form. */
var SCHEMA_VERSION=1;
var STYLE_KEY={brawler:'B',technician:'T',flyer:'H',powerhouse:'P',all_rounder:'A',striker:'S',entertainer:'E'},STYLE_OUT={};
Object.keys(STYLE_KEY).forEach(function(k){STYLE_OUT[STYLE_KEY[k]]=k;});
var RMAP={brawling:'brawl',technical:'tech',aerial:'speed',hardcore:'hc',stamina:'stam',durability:'dur',safety:'safe',charisma:'cha',promo_skill:'mic',gimmick_rating:'gr',star_quality:'sq',consistency:'cons',overness:'ovr',potential:'pot',morale:'morale'};
var ROLES=['wrestler','manager','announcer','referee','road_agent','owner','booker'];
var PUSH=['main_eventer','upper_midcarder','midcarder','lower_midcarder','jobber','non_wrestler'];
var REL_TYPES=['rivalry','friendship','mentor','family','partners','dislike'];
var ID_RE=/^[a-z0-9_]{2,40}$/;
// field types: 'id', 'str', 'int', 'num', 'bool', 'obj', 'list', an array of allowed values, or 'ref:<table>'; a trailing ? makes it optional
var SCHEMAS={
  promotions:{required:['id','name','popularity'],fields:{id:'id',name:'str',full_name:'str?',blurb:'str?',owner:'obj?',staff:'obj?',announcers:'list?',cities:'list?',cash:'num?',popularity:'num',work_rate_weight:'num?',angles_per_show:'int?',wage_scale:'num?',tv_rate:'num?',production_cost:'num?',target_weekly_net:'num?',flagship_month:'int?',production_level:'int?',risk_level:'int?',tv_slot:'int?',model:'str?',brands:'list?',media:'obj?'}},
  workers:{required:['id','ring_name','gender','disposition','style','ratings'],fields:{id:'id',ring_name:'str',real_name:'str?',birth_date:'str?',age:'int?',hometown:'str?',gender:['M','F'],weight_class:['cruiser','heavy','super_heavy'],disposition:['face','heel','tweener'],roles:'list?',style:Object.keys(STYLE_KEY),finisher:'str?',manager_id:'str?',locker_role:['mentor','diva','gatekeeper','leader','toxic'],ratings:'obj',peak_years:'list?',age_cliff:'int?',media:'obj?',face:'obj?'}},
  contracts:{required:['worker_id','promotion_id'],fields:{worker_id:'str',promotion_id:'str',contract_type:['exclusive','pwa'],monthly_salary:'num?',per_show_fee:'num?',weeks_left:'int?',tenure_weeks:'int?',push_level:PUSH,brand:'str?'}},
  titles:{required:['id','promotion_id','name','gender','level'],fields:{id:'id',promotion_id:'str',name:'str',gender:['M','F'],level:'int',tag:'bool?',brand:'str?',holder_ids:'list?',media:'obj?'}},
  teams:{required:['id','name','member_ids','promotion_id'],fields:{id:'id',name:'str',kind:['tag','stable'],member_ids:'list',leader_id:'str?',experience:'num?',chemistry:'num?',finisher:'str?',promotion_id:'str'}},
  relationships:{required:['a','b','type'],fields:{a:'str',b:'str',type:REL_TYPES,strength:'num?',ring_chemistry:'num?',note:'str?'}},
  events:{required:['month','name'],fields:{month:'int',name:'str',rule:'str?'}},
  shows:{required:['id','promotion_id','name'],fields:{id:'id',promotion_id:'str',name:'str',brand:'str?',weight:'num?'}}
};
function lev(a,b){var m=[],i,j;for(i=0;i<=a.length;i++){m[i]=[i];}for(j=1;j<=b.length;j++)m[0][j]=j;for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length];}
function nearest(f,names){var best=null,bd=3;names.forEach(function(n){var d=lev(f,n);if(d<bd){bd=d;best=n;}});return best?' (did you mean '+best+'?)':'';}
function safeRel(p){return typeof p==='string'&&p.length<200&&!/^([a-zA-Z]:|[\\/])/.test(p)&&p.split(/[\\/]/).indexOf('..')<0;}
E.validateUniverse=function(pkg,fileList){
  var errors=[],warnings=[],err=function(at,msg){errors.push({at:at,msg:msg});},warn=function(at,msg){warnings.push({at:at,msg:msg});};
  var out=function(){return {ok:!errors.length,errors:errors,warnings:warnings};};
  if(!pkg||typeof pkg!=='object'){err('package','not a JSON object');return out();}
  var man=pkg.manifest;
  if(!man||typeof man!=='object'){err('manifest','missing');return out();}
  if(!ID_RE.test(String(man.id||'')))err('manifest','id must be 2–40 lowercase letters, digits or underscores');
  if(!man.name)err('manifest','name is missing');
  if(typeof man.schema_version!=='number')err('manifest','schema_version is missing');
  else if(man.schema_version>SCHEMA_VERSION){err('manifest','this package needs a newer version of the game (schema '+man.schema_version+', this game reads '+SCHEMA_VERSION+')');return out();}
  var ids={};
  Object.keys(SCHEMAS).forEach(function(table){
    var sc=SCHEMAS[table],rows=pkg[table],seen={},names=Object.keys(sc.fields);ids[table]={};
    if(rows==null){if(table==='promotions'||table==='workers'||table==='contracts'||table==='shows')err(table,'table is missing');return;}
    if(!Array.isArray(rows)){err(table,'must be a list');return;}
    rows.forEach(function(rec,i){
      var at=table+'['+i+']'+(rec&&rec.id?' '+rec.id:(rec&&rec.ring_name?' '+rec.ring_name:''));
      if(!rec||typeof rec!=='object'){err(at,'not an object');return;}
      sc.required.forEach(function(f){if(rec[f]==null||rec[f]==='')err(at,'missing '+f);});
      Object.keys(rec).forEach(function(f){
        var t=sc.fields[f],v=rec[f];
        if(t===undefined){warn(at,'unknown field '+f+nearest(f,names)+', ignored');return;}
        if(v==null)return;
        if(Array.isArray(t)){if(t.indexOf(v)<0)err(at,f+' must be one of: '+t.join(', '));return;}
        t=t.replace('?','');
        if(t==='id'){if(!ID_RE.test(String(v)))err(at,f+' must be 2–40 lowercase letters, digits or underscores');}
        else if(t==='str'){if(typeof v!=='string')err(at,f+' must be text');}
        else if(t==='int'||t==='num'){if(typeof v!=='number'||!isFinite(v))err(at,f+' must be a number');}
        else if(t==='bool'){if(typeof v!=='boolean')err(at,f+' must be true or false');}
        else if(t==='list'){if(!Array.isArray(v))err(at,f+' must be a list');}
        else if(t==='obj'){if(typeof v!=='object'||Array.isArray(v))err(at,f+' must be an object');}
      });
      if(rec.id!=null){if(seen[rec.id])err(at,'duplicate id');seen[rec.id]=1;ids[table][rec.id]=rec;}
      if(table==='workers'&&rec.ratings&&typeof rec.ratings==='object'){
        Object.keys(rec.ratings).forEach(function(k){
          if(!RMAP[k]){warn(at,'unknown rating '+k+nearest(k,Object.keys(RMAP))+', ignored');return;}
          var v=rec.ratings[k];if(typeof v!=='number'||!isFinite(v))err(at,'rating '+k+' must be a number');else if(v<0||v>100)warn(at,'rating '+k+' is '+v+', clamped to 0–100');
        });
        ['brawling','technical','aerial','stamina','promo_skill','overness'].forEach(function(k){if(rec.ratings[k]==null)err(at,'missing rating '+k);});
        (rec.roles||[]).forEach(function(r){if(ROLES.indexOf(r)<0)warn(at,'unknown role '+r+nearest(r,ROLES)+', ignored');});
      }
    });
  });
  if(errors.length)return out();
  // references between tables
  var W=ids.workers,PR=ids.promotions,ref=function(tbl,id,at,what,optional){if(tbl[id])return true;(optional?warn:err)(at,what+' points at '+JSON.stringify(id)+', which does not exist'+(optional?'; link dropped':''));return false;};
  var excl={},byPromo={};
  (pkg.contracts||[]).forEach(function(c,i){var at='contracts['+i+']';ref(W,c.worker_id,at,'worker_id');ref(PR,c.promotion_id,at,'promotion_id');
    if((c.contract_type||'exclusive')==='exclusive'){if(excl[c.worker_id])err(at,c.worker_id+' has two exclusive contracts');excl[c.worker_id]=c.promotion_id;}
    var w=W[c.worker_id];if(w&&(!w.roles||w.roles.indexOf('wrestler')>=0))byPromo[c.promotion_id]=(byPromo[c.promotion_id]||0)+1;});
  var PRO={};(pkg.promotions||[]).forEach(function(p){PRO[p.id]=p;});
  // a gender-locked model (joshi) cannot sign or crown the other gender; say so where the data says otherwise
  (pkg.contracts||[]).forEach(function(c,i){var pr=PRO[c.promotion_id],w=W[c.worker_id],MD=pr&&MODELS[pr.model];
    if(MD&&MD.gender&&w&&(!w.roles||w.roles.indexOf('wrestler')>=0)&&w.gender!==MD.gender)warn('contracts['+i+']',w.ring_name+' is under contract to '+pr.name+', which runs as '+MD.n+' and signs only '+(MD.gender==='F'?'women':'men')+'; the game will not sign others like them');});
  (pkg.titles||[]).forEach(function(t,i){var pr=PRO[t.promotion_id],MD=pr&&MODELS[pr.model];
    if(MD&&MD.gender&&t.gender!==MD.gender)warn('titles['+i+'] '+t.id,t.name+' is a '+(t.gender==='F'?"women's":"men's")+' title in a '+MD.n+' promotion');});
  (pkg.shows||[]).forEach(function(s,i){ref(PR,s.promotion_id,'shows['+i+'] '+s.id,'promotion_id');});
  (pkg.titles||[]).forEach(function(t,i){var at='titles['+i+'] '+t.id;ref(PR,t.promotion_id,at,'promotion_id');
    (t.holder_ids||[]).forEach(function(h){if(ref(W,h,at,'holder')&&excl[h]!==t.promotion_id)warn(at,h+' holds this title but is not under contract to '+t.promotion_id+'; title vacated');});
    if(t.level<1||t.level>3)warn(at,'level should be 1, 2 or 3');});
  (pkg.teams||[]).forEach(function(t,i){var at='teams['+i+'] '+t.id;ref(PR,t.promotion_id,at,'promotion_id');(t.member_ids||[]).forEach(function(m){ref(W,m,at,'member');});
    if((t.kind||'tag')==='tag'&&(t.member_ids||[]).length!==2)warn(at,'a tag team needs exactly two members; ignored');if(t.leader_id)ref(W,t.leader_id,at,'leader_id',true);});
  (pkg.relationships||[]).forEach(function(r,i){var at='relationships['+i+']';ref(W,r.a,at,'a',true);ref(W,r.b,at,'b',true);});
  (pkg.workers||[]).forEach(function(w,i){var at='workers['+i+'] '+w.id;if(w.manager_id&&ref(W,w.manager_id,at,'manager_id',true)){var m=W[w.manager_id];if(!m.roles||m.roles.indexOf('manager')<0)warn(at,'manager_id points at '+w.manager_id+', who does not have the manager role');}});
  if(errors.length)return out();
  // world rules
  (pkg.promotions||[]).forEach(function(p){
    var n=byPromo[p.id]||0,at='promotions '+p.id;
    if(n<6)err(at,'has '+n+' wrestlers under contract; a promotion needs at least 6');else if(n<12)warn(at,'has only '+n+' wrestlers; cards will be thin');
    if(!(pkg.shows||[]).some(function(s){return s.promotion_id===p.id;}))err(at,'has no weekly show');
    if(!(pkg.titles||[]).some(function(t){return t.promotion_id===p.id;}))warn(at,'has no titles');
    if(p.popularity<5||p.popularity>100)warn(at,'popularity '+p.popularity+' clamped to 5–100');
    if(p.model!=null&&!MODELS[p.model])warn(at,'unknown model '+JSON.stringify(p.model)+nearest(String(p.model),Object.keys(MODELS))+'; the promotion runs as an independent');
  });
  if((pkg.promotions||[]).length<2)err('promotions','a universe needs at least two promotions');
  var ev=pkg.events||[];if(ev.length&&ev.length<12)warn('events',ev.length+' events listed; months without one use a default name');
  // media: safe relative paths, allowed types, then existence
  var miss=0;
  ['workers','promotions','titles'].forEach(function(table){(pkg[table]||[]).forEach(function(rec){
    var m=rec.media||{};Object.keys(m).forEach(function(k){var p=m[k];
      if(!safeRel(p)||!/\.(png|jpe?g|webp)$/i.test(p))err(table+' '+rec.id,'media.'+k+' is not a safe relative image path');
      else if(fileList&&!fileList[p])miss++;});
  });});
  if(miss)warn('media',miss+' image'+(miss===1?'':'s')+' not found; placeholders will be used');
  return out();
};
/* turn a validated package into the shape the engine starts a world from */
function econ(pop){var x=clamp(pop,5,100)/100;return {wageMult:Math.max(0.15,r1(2.6*Math.pow(x,2.6)*10)/10||0.2),tvRate:Math.round(5200*Math.pow(x,1.9)/50)*50||200,prod:Math.round(900000*Math.pow(x,3.4)/1000)*1000||3000,net:Math.round(2400000*Math.pow(x,6)/100)*100||200,cash:Math.round(190e6*Math.pow(x,4.6)/1000)*1000||100000};}
function buildDB(pkg){
  var man=pkg.manifest,W={},rows=[],promos=[],PR={};(pkg.workers||[]).forEach(function(w){W[w.id]=w;});
  (pkg.promotions||[]).forEach(function(p){
    var e=econ(p.popularity),own=p.owner||{},MD=MODELS[p.model]||MODELS.classic,d={id:p.id,model:MODELS[p.model]?p.model:null,name:p.name,full:p.full_name||null,blurb:p.blurb||'',cash:p.cash!=null?p.cash:e.cash,image:clamp(p.popularity,5,100),wq:p.work_rate_weight!=null?clamp(p.work_rate_weight,0.2,0.8):(MD.wq||0.5),
      angles:p.angles_per_show!=null?clamp(p.angles_per_show,0,3):2,wageMult:p.wage_scale!=null?p.wage_scale:e.wageMult,tvRate:p.tv_rate!=null?p.tv_rate:e.tvRate,prod:p.production_cost!=null?p.production_cost:e.prod,net:p.target_weekly_net!=null?p.target_weekly_net:e.net,
      flagship:p.flagship_month!=null?clamp(p.flagship_month-1,0,11):3,prodLvl:p.production_level!=null?clamp(p.production_level,0,4):2,risk:p.risk_level!=null?clamp(p.risk_level,0,3):1,slot:p.tv_slot!=null?clamp(p.tv_slot,0,2):1,
      owner:{name:own.name||'The owner',style:STYLES[own.style]?own.style:'stars',roots:ROOTS[own.roots]?own.roots:'tradition',pledge:PLEDGE[own.pledge]?own.pledge:'pay'},
      staff:{agent:(p.staff&&p.staff.road_agent)||'The road agent',writer:(p.staff&&p.staff.head_writer)||'The head writer'},announcers:p.announcers&&p.announcers.length>=2?p.announcers.slice(0,2):['The play-by-play man','The colour man'],
      cities:p.cities&&p.cities.length?p.cities.slice():['the city'],brands:p.brands&&p.brands.length?p.brands.map(function(b){return {id:b.id,name:b.name,dev:!!b.dev};}):null,shows:[],titles:[],teams:[],media:p.media||null};
    promos.push(d);PR[p.id]=d;
  });
  (pkg.shows||[]).forEach(function(s){PR[s.promotion_id].shows.push({id:s.id,name:s.name,brand:s.brand||undefined,mult:s.weight!=null?clamp(s.weight,0.2,1):1});});
  var home={},con={};(pkg.contracts||[]).forEach(function(c){if((c.contract_type||'exclusive')==='exclusive'||!home[c.worker_id]){home[c.worker_id]=c.promotion_id;con[c.worker_id]=c;}});
  (pkg.titles||[]).forEach(function(t){PR[t.promotion_id].titles.push({id:t.id,name:t.name,g:t.gender,lvl:clamp(t.level,1,3),tag:!!t.tag,brand:t.brand||undefined,holders:(t.holder_ids||[]).every(function(h){return home[h]===t.promotion_id;})?(t.holder_ids||[]).map(function(h){return '#'+h;}):[]});});
  var stables=[];
  (pkg.teams||[]).forEach(function(t){
    if((t.kind||'tag')==='stable')stables.push({name:t.name,promo:t.promotion_id,leader:t.leader_id||t.member_ids[0],m:t.member_ids.slice()});
    else if(t.member_ids.length===2)PR[t.promotion_id].teams.push(['#'+t.member_ids[0],'#'+t.member_ids[1],t.experience,t.chemistry,t.name]);
  });
  (pkg.workers||[]).forEach(function(w){
    var r=w.ratings,c=con[w.id],d={uid:w.id,name:w.ring_name,g:w.gender,style:STYLE_KEY[w.style]||'A',align:w.disposition==='heel'?'H':'F',tweener:w.disposition==='tweener',fin:w.finisher||null,promo:c?c.promotion_id:'FA',brand:c&&c.brand?c.brand:null,
      roles:(w.roles&&w.roles.length?w.roles:['wrestler']).filter(function(x){return ROLES.indexOf(x)>=0;}),age:w.age!=null?w.age:(w.birth_date?Math.max(16,(man.start_year||2026)-(+String(w.birth_date).slice(0,4)||1990)):null),peak:w.peak_years&&w.peak_years.length===2?w.peak_years:null,cliff:w.age_cliff!=null?w.age_cliff:null,mgr:w.manager_id||null,
      real:w.real_name||null,town:w.hometown||null,wc:w.weight_class||null,media:w.media||null,face:w.face||null};
    Object.keys(RMAP).forEach(function(k){if(r[k]!=null)d[RMAP[k]]=clamp(Math.round(r[k]),0,100);});
    if(w.locker_role)d.lrole=w.locker_role==='gatekeeper'?'gate':w.locker_role;
    if(c){d.con=c.weeks_left!=null?Math.max(1,c.weeks_left):null;d.tw=c.tenure_weeks!=null?Math.max(0,c.tenure_weeks):null;d.push=c.push_level||null;d.wage=c.monthly_salary?Math.round(c.monthly_salary*12/52/10)*10:(c.per_show_fee?Math.round(c.per_show_fee/10)*10:null);d.pwa=c.contract_type==='pwa';}
    rows.push(d);
  });
  var ev=[];for(var m=0;m<12;m++)ev.push(MONTHS[m]+' Showcase');(pkg.events||[]).forEach(function(e){if(e.month>=1&&e.month<=12)ev[e.month-1]=e.name;});
  var nm=pkg.names||{};
  return {fictional:!!man.fictional,uni:{id:man.id,name:man.name,version:String(man.version||'1'),author:man.author||'',desc:man.description||''},startYear:man.start_year||2026,startMonth:clamp((man.start_month||10)-1,0,11),
    events:ev,rules:(pkg.events||[]).reduce(function(o,e){if(e.rule)o[e.month-1]=e.rule;return o;},{}),sponsors:pkg.sponsors&&pkg.sponsors.length?pkg.sponsors:null,columnists:pkg.columnists&&pkg.columnists.length?pkg.columnists:null,
    indie:{firstM:nm.first_m&&nm.first_m.length>=8?nm.first_m:FALLBACK_NAMES.firstM,firstF:nm.first_f&&nm.first_f.length>=6?nm.first_f:FALLBACK_NAMES.firstF,last:nm.last&&nm.last.length>=8?nm.last:FALLBACK_NAMES.last},
    freeAgents:man.free_agents!=null?clamp(man.free_agents,0,120):36,promotions:promos,rows:rows,stables:stables,rels:(pkg.relationships||[]).filter(function(r){return W[r.a]&&W[r.b];})};
}
var FALLBACK_NAMES={firstM:['Cass','Dex','Rowan','Milo','Jett','Bram','Niko','Tobin','Ozzy','Rafe','Koda','Lars','Emmett','Zeke','Idris','Mateo','Hollis','Ansel','Tycho','Wade','Remy','Stellan','Jonas','Caius','Boone','Cyrus','Ellis','Flint','Gideon','Hale','Kip','Magnus','Nash','Orrin','Pax','Quill','Ridley','Silas','Thane','Vaughn'],
  firstF:['Mara','Juno','Petra','Sable','Liv','Odessa','Rue','Tamsin','Noor','Vesper','Indra','Calla','Wren','Zora','Astrid','Bex','Cleo','Dahlia','Esme','Faye','Greta','Harlow','Ione','Kit','Lux','Nell','Opal','Quinn','Romy','Sloane','Thea','Willa'],
  last:['Harrow','Vale','Quist','Marlowe','Stroud','Bellamy','Thorne','Castellan','Rusk','Devane','Halloran','Maddox','Sorrell','Lindqvist','Rourke','Kessler','Brannigan','Whitlock','Drummond','Ferro','Pruitt','Ashdown','Barrowe','Calloway','Easton','Fairbanks','Galloway','Hathaway','Jessup','Mercer','Northcott','Pemberton','Radcliffe','Tillman','Underhill','Wexler','Zeller','Blackwood','Crane','Granger','Kincaid','Novak']};
E.useUniverse=function(pkg,fileList){
  var v=E.validateUniverse(pkg,fileList);if(!v.ok)return v;
  DB=buildDB(pkg);CAL0={y:DB.startYear,m:DB.startMonth};v.info=E.universe();return v;
};
E.universe=function(){var n=0,count={},cur=null;if(DB.rows){n=DB.rows.length;DB.rows.forEach(function(d){if(d.promo)count[d.promo]=(count[d.promo]||0)+1;});}else DB.roster.split('\n').forEach(function(l){l=l.trim();if(!l)return;if(l[0]==='#'){cur=l.slice(1).trim().split(/\s+/)[0];return;}n++;count[cur]=(count[cur]||0)+1;});return {count:count,start:MONTHS[DB.startMonth]+' '+DB.startYear,id:DB.uni?DB.uni.id:'legacy',name:DB.uni?DB.uni.name:'Built-in roster',version:DB.uni?DB.uni.version:'1',author:DB.uni?DB.uni.author:'',desc:DB.uni?DB.uni.desc:'',workers:n,promotions:DB.promotions};};
E.attach=function(S){var d=S&&S.db;CAL0=d?{y:d.startYear,m:d.startMonth}:{y:DB.startYear,m:DB.startMonth};};
/* what a package told us that the world builder cannot express row by row */
NEWX.push(function(S){
  var by={};S.w.forEach(function(w){if(w.uid)by[w.uid]=w;});
  (DB.rows||[]).forEach(function(d){var w=by[d.uid];if(!w)return;if(d.mgr&&by[d.mgr]&&by[d.mgr].promo===w.promo)w.mgr=by[d.mgr].id;if(d.push)w.push=d.push;if(d.pwa)w.pwa=true;});
  (DB.stables||[]).forEach(function(s){var ms=s.m.map(function(u){return by[u];}).filter(function(w){return w&&w.promo===s.promo&&w.stable==null;});if(ms.length<3)return;
    var lead=by[s.leader]&&ms.indexOf(by[s.leader])>=0?by[s.leader]:ms[0],st={id:S.nid++,promo:s.promo,name:s.name,leader:lead.id,m:ms.map(function(w){return w.id;}),formed:1,tension:0};S.stables.push(st);ms.forEach(function(w){w.stable=st.id;});});
  (DB.rels||[]).forEach(function(r){var a=by[r.a],b=by[r.b];if(!a||!b)return;var k=rkey(a.id,b.id);
    if(r.ring_chemistry!=null)(S.chemX||(S.chemX={}))[k]=clamp(r.ring_chemistry,-10,10)*0.6;
    var s=r.strength!=null?r.strength:(r.type==='dislike'||r.type==='rivalry'?-50:50);if(Math.abs(s)>=25)S.rel[k]=s>0?1:-1;
    (S.relT||(S.relT={}))[k]=r.type;});
});
/* write the world as it stands back out as a package */
function slug(s){return String(s).toLowerCase().normalize?String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,40):String(s).toLowerCase().replace(/[^a-z0-9]+/g,'_');}
E.exportUniverse=function(S,meta){
  meta=meta||{};var d=S.db||DB,uid={},used={},P0=S.promos,pid=function(id){return slug(id)||'promo';};
  S.w.forEach(function(w){if(w.rt)return;var u=w.uid&&ID_RE.test(w.uid)&&!used[w.uid]?w.uid:slug(w.name)||'worker';if(u.length<2)u='w_'+u;var b=u,n=2;while(used[u])u=(b.slice(0,36)+'_'+(n++));used[u]=1;uid[w.id]=u;});
  var c0=cal(S.week),pkg={manifest:{id:slug(meta.id||meta.name||'my_universe')||'my_universe',name:meta.name||'My universe',author:meta.author||(S.booker?S.booker.name:''),version:meta.version||'1.0',schema_version:SCHEMA_VERSION,fictional:!!d.fictional,start_year:c0.year,start_month:c0.month+1,free_agents:0,description:meta.description||'Exported from Elite Wrestling Federation 9000, '+c0.label+'.'},
    promotions:[],shows:[],titles:[],workers:[],contracts:[],teams:[],relationships:[],events:d.events.map(function(n,i){var o={month:i+1,name:n};if(d.rules&&d.rules[i])o.rule=d.rules[i];return o;}),names:{first_m:d.indie.firstM,first_f:d.indie.firstF,last:d.indie.last}};
  if(d.sponsors)pkg.sponsors=d.sponsors;if(d.columnists)pkg.columnists=d.columnists;
  S.order.forEach(function(id){
    var P=P0[id],own=id===S.player?{name:S.owner.name,style:S.owner.style,roots:S.owner.roots,pledge:S.owner.pledge}:(P.owner||{name:'The owner',style:P.style||'stars',roots:'tradition',pledge:'pay'});
    var o={id:pid(id),name:P.name,blurb:P.blurb||'',owner:own,staff:{road_agent:P.staff.agent,head_writer:P.staff.writer},announcers:P.ann.slice(),cities:P.cities.slice(),cash:Math.round(P.cash),popularity:r1(P.image),work_rate_weight:P.wq,angles_per_show:P.angles,wage_scale:P.wageMult,tv_rate:P.tvRate,production_cost:P.prod,target_weekly_net:P.net,flagship_month:P.flagship+1,production_level:P.prodLvl,risk_level:P.risk,tv_slot:P.slot};
    if(P.full)o.full_name=P.full;if(P.brands)o.brands=P.brands.map(function(b){var x={id:b.id,name:b.name};if(b.dev)x.dev=true;return x;});
    if(P.model)o.model=P.model;
    pkg.promotions.push(o);
    P.shows.forEach(function(s){var x={id:slug(id+'_'+s.id),promotion_id:pid(id),name:s.name,weight:s.mult==null?1:s.mult};if(s.brand)x.brand=s.brand;pkg.shows.push(x);});
    P.titles.forEach(function(t){var x={id:slug(t.id),promotion_id:pid(id),name:t.name,gender:t.g,level:t.lvl,tag:!!t.tag,holder_ids:t.holders.map(function(h){return uid[h];}).filter(Boolean)};if(t.brand)x.brand=t.brand;pkg.titles.push(x);});
  });
  var push=S.order.reduce(function(o,id){var m=E.pushMap(S,id);Object.keys(m).forEach(function(k){o[k]=m[k];});return o;},{});
  var PL={'Main event':'main_eventer','Upper midcard':'upper_midcarder','Midcard':'midcarder','Lower midcard':'lower_midcarder','Opener':'jobber'};
  S.w.forEach(function(w){
    if(w.rt)return;var r={};Object.keys(RMAP).forEach(function(k){var v=w[RMAP[k]];if(k==='gimmick_rating')v=w.gim?gimFit(w):null;if(v!=null)r[k]=clamp(Math.round(v),0,100);});
    var o={id:uid[w.id],ring_name:w.name,age:w.age,gender:w.g,disposition:w.twn?'tweener':(w.align==='H'?'heel':'face'),roles:w.roles?w.roles.slice():['wrestler'],style:STYLE_OUT[w.style]||'all_rounder',finisher:w.fin||undefined,ratings:r,peak_years:w.pk.slice(),age_cliff:w.cl};
    if(w.role)o.locker_role=w.role==='gate'?'gatekeeper':w.role;
    if(w.real)o.real_name=w.real;if(w.town)o.hometown=w.town;if(w.wc)o.weight_class=w.wc;if(w.media)o.media=w.media;if(w.face)o.face=w.face;if(w.mgr!=null&&uid[w.mgr])o.manager_id=uid[w.mgr];
    pkg.workers.push(o);
    if(w.promo!=='FA'&&P0[w.promo]){var c={worker_id:uid[w.id],promotion_id:pid(w.promo),contract_type:w.pwa?'pwa':'exclusive',monthly_salary:Math.round(w.wage*52/12),per_show_fee:0,weeks_left:Math.max(1,w.con),tenure_weeks:w.jw!=null?Math.max(0,S.week-w.jw):undefined,push_level:w.nw?'non_wrestler':(PL[push[w.id]]||'midcarder')};if(w.brand)c.brand=w.brand;pkg.contracts.push(c);}
  });
  S.teams.forEach(function(t,i){if(!uid[t.m[0]]||!uid[t.m[1]]||!P0[t.promo])return;pkg.teams.push({id:'team_'+(i+1),name:t.name||S.w[t.m[0]].name+' & '+S.w[t.m[1]].name,kind:'tag',member_ids:[uid[t.m[0]],uid[t.m[1]]],experience:Math.round(t.exp),chemistry:t.chem||0,promotion_id:pid(t.promo)});});
  (S.stables||[]).forEach(function(s,i){var ms=s.m.map(function(m){return uid[m];}).filter(Boolean);if(ms.length>=3)pkg.teams.push({id:'stable_'+(i+1),name:s.name,kind:'stable',member_ids:ms,leader_id:uid[s.leader],promotion_id:pid(s.promo)});});
  Object.keys(S.rel||{}).forEach(function(k){var p=k.split('-'),a=uid[+p[0]],b=uid[+p[1]];if(!a||!b||!S.rel[k])return;pkg.relationships.push({a:a,b:b,type:(S.relT&&S.relT[k])||(S.rel[k]>0?'friendship':'dislike'),strength:S.rel[k]>0?50:-50,ring_chemistry:Math.round(chem(S,+p[0],+p[1])/0.6)});});
  return pkg;
};
E.SCHEMA_VERSION=SCHEMA_VERSION;
E.RULES={no_turning_back:'No turning back: a feud can be settled tonight at 45 heat instead of 60.',betrayal:'The betrayal show: a losing team is twice as likely to split.',gimmick_free:'Anything goes: a second gimmick match carries no penalty.',all_titles:'Every title on the line: title matches get a bigger reaction.'};
