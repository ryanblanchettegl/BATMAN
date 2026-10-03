var DB = root.GP_DB, E = {};
var CAL0=DB?{y:DB.startYear,m:DB.startMonth}:{y:2026,m:9};
function dbOf(S){return (S&&S.db)||DB;}
var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var STYLE = {B:[6,-12,-10,0],T:[-8,8,-6,2],H:[-14,-6,10,3],P:[8,-14,-16,-8],A:[0,0,-2,0],S:[4,0,-4,0],E:[0,-6,-6,-4]};
var STYLE_NAME = {B:'Brawler',T:'Technician',H:'High flyer',P:'Powerhouse',A:'All-rounder',S:'Striker',E:'Entertainer'};
var MT = {'1v1':{n:'Singles',sides:2,per:1},tag:{n:'Tag team',sides:2,per:2},'3way':{n:'Triple threat',sides:3,per:1},'4way':{n:'Four-way',sides:4,per:1},'6man':{n:'Six-man tag',sides:2,per:3},br:{n:'Battle royal',sides:8,per:1}};
var STIP = {
  std:{n:'Standard',w:null,heat:0,inj:1},
  hardcore:{n:'Hardcore',w:[0.7,0.1,0.2],heat:4,inj:2.2,hc:0.45},
  ladder:{n:'Ladder',w:[0.25,0.15,0.6],heat:4,inj:2.6,hc:0.15},
  cage:{n:'Steel cage',w:[0.55,0.15,0.3],heat:4,inj:1.6,hc:0.25},
  sub:{n:'Submission',w:[0.25,0.75,0],heat:2,inj:1},
  iron:{n:'Iron man',w:null,heat:3,inj:1.3}
};
var FIN = {clean:{r:0,wg:1,lg:1},flash:{r:-1,wg:0.7,lg:0.5},cheap:{r:-1,wg:0.6,lg:0.4},interf:{r:-1,wg:0.5,lg:0.25},foiled:{r:1,wg:1.1,lg:0.8},dq:{r:-5,wg:0.2,lg:0.1},co:{r:-6,wg:0.3,lg:0.2},draw:{r:-3,wg:0,lg:0}};
var LEN = {S:6,M:12,L:20};
var PRODF=[0.4,0.7,1,1.45,2.1],PRODN=['Bare bones','Basic','Standard','Slick','State of the art'];
var RISKN=['Family','Mainstream','Edgy','Extreme'],RISK_STIP=[0.5,1,1.3,1.6],RISK_INJ=[0.8,1,1.15,1.35];
var TIXN=['Low','Standard','High','Premium'],TIX_P=[0.75,1,1.25,1.6],TIX_D=[1.18,1,0.86,0.68];
var ADVN=['None','Local','Regional','Saturation'],ADV_H=[0,0.06,0.12,0.18],ADV_C=[0,0.006,0.015,0.03];
var SLOTN=['Late night','Early evening','Prime time'],SLOT_V=[0.55,0.8,1],SLOT_MAX=[6,7,8],SLOT_REQ=[0,40,60],SLOT_RISK=[3,3,2];
var CAPS = [300,600,1000,1500,2500,4000,6000,8000,10000,13000,16000,20000,30000,45000,60000,80000,100000];
var ACH = [
  {id:'ACH_FIRST_BELL',name:'Opening Bell',desc:'Run your first show.'},
  {id:'ACH_SHOW_80',name:'Solid Outing',desc:'Run a show rated 80% or better.'},
  {id:'ACH_SHOW_90',name:'Blowaway Show',desc:'Run a show rated 90% or better.'},
  {id:'ACH_MATCH_90',name:'Match of the Year Candidate',desc:'Book a match rated 90% or better.'},
  {id:'ACH_MATCH_97',name:'Five Stars',desc:'Book a match rated 97% or better.'},
  {id:'ACH_TITLE_CHANGE',name:'And New!',desc:'Book a title change.'},
  {id:'ACH_CROWN',name:'Filling the Vacancy',desc:'Crown a champion for a vacant title.'},
  {id:'ACH_FEUD_HOT',name:'Blood Feud',desc:'Get a feud to 90 heat.'},
  {id:'ACH_BLOWOFF',name:'Blow-off',desc:'Finish a hot feud with a big-event or gimmick match.'},
  {id:'ACH_FEUDS_5',name:'Long-term Booking',desc:'Bring five feuds to a proper finish.'},
  {id:'ACH_TURN',name:'Swerve',desc:'See a wrestler turn.'},
  {id:'ACH_BETRAYAL',name:'Et Tu?',desc:'Watch a tag team implode.'},
  {id:'ACH_MYSTERY',name:'Whodunnit',desc:'Unmask a mystery attacker.'},
  {id:'ACH_UPSET',name:'Giant Killer',desc:'Book an upset over someone 20+ overness higher.'},
  {id:'ACH_STREAK',name:'The Streak',desc:'Build a 10-match winning streak.'},
  {id:'ACH_STREAK_END',name:'Streak Breaker',desc:'End a winning streak of 6 or more.'},
  {id:'ACH_SIGN',name:'Ink Dries',desc:'Sign a free agent.'},
  {id:'ACH_POACH',name:'Shots Fired',desc:'Sign a wrestler away from a rival promotion.'},
  {id:'ACH_SELLOUT',name:'Standing Room Only',desc:'Sell out a venue.'},
  {id:'ACH_RUN_5',name:'Hot Streak',desc:'Beat expectations five shows in a row.'},
  {id:'ACH_STAR_MAKER',name:'Star Maker',desc:'Raise a wrestler 15 overness above where you found them.'},
  {id:'ACH_PROMISE',name:'Man of Your Word',desc:'Keep a promise made to a wrestler.'},
  {id:'ACH_QUEST',name:'Network Darling',desc:'Hit a network or sponsor target.'},
  {id:'ACH_IMAGE_UP',name:'On the Rise',desc:'Raise your promotion’s popularity by 5 points.'},
  {id:'ACH_NO1',name:'Top of the Mountain',desc:'Be the most popular promotion in the world.'},
  {id:'ACH_YEAR',name:'Year One',desc:'Complete 48 weeks in charge.'},
  {id:'ACH_CALL',name:'Calling the Shot',desc:'Spend booking power to call a finish.'},
  {id:'ACH_LONGSHOT',name:'Against the Odds',desc:'Call a finish for a long shot (under 25%).'},
  {id:'ACH_DIRECTIVE',name:'Company Man',desc:'Deliver on one of the owner\u2019s directives.'},
  {id:'ACH_OWNER_TRUST',name:'Right Hand',desc:'Reach 90 trust with the owner.'},
  {id:'ACH_TRUST',name:'Good as Your Word',desc:'Reach 90 locker-room trust.'},
  {id:'ACH_LEVEL5',name:'Seasoned',desc:'Reach booker level 5.'},
  {id:'ACH_OWNER',name:'The Office',desc:'Take over the company as owner.'},
  {id:'ACH_TOURN',name:'Bracket Buster',desc:'See a tournament through to a winner.'},
  {id:'ACH_BR',name:'Over the Top',desc:'Run a battle royal.'},
  {id:'ACH_AWARDS',name:'Awards Season',desc:'Reach the year-end awards.'},
  {id:'ACH_HOF',name:'Immortal',desc:'Induct someone into the hall of fame.'},
  {id:'ACH_GRAD',name:'Graduate',desc:'Call up a wrestler who improved in training camp.'},
  {id:'ACH_REFORM',name:'Clear the Air',desc:'Talk a diva or a toxic influence round.'},
  {id:'ACH_BRUTAL',name:'Left It All in There',desc:'Run a brutal gimmick match rated 90% or better.'},
  {id:'ACH_MENTOR',name:'Passing It On',desc:'Put a young wrestler under a mentor.'},
  {id:'ACH_HOUSE',name:'My House, My Rules',desc:'Fill every house rule slot.'},
  {id:'ACH_COURT',name:'Order in the Court',desc:'Give five fair verdicts in wrestlers’ court.'},
  {id:'ACH_CHAOS',name:'The Show Must Go On',desc:'Get a match of 80% or better out of mid-match chaos.'},
  {id:'ACH_BREAKOUT',name:'A Star Is Born',desc:'Fill the breakout clock for a young wrestler.'},
  {id:'ACH_FED',name:'Under New Management',desc:'Start your own federation.'},
  {id:'ACH_CREATE',name:'Diamond in the Rough',desc:'Create and sign a wrestler of your own.'},
  {id:'ACH_PROMO',name:'Pipe Bomb',desc:'Plan an opening promo that scores 85% or better.'},
  {id:'ACH_TRADE',name:'Deal Maker',desc:'Complete a talent trade with a rival promotion.'},
  {id:'ACH_SUPERSHOW',name:'Forbidden Door',desc:'Run a supershow with a rival promotion.'},
  {id:'ACH_WAR',name:'Turf War',desc:'Win a war against an invading promotion.'},
  {id:'ACH_SAGA',name:'Season Finale',desc:'Finish a season with three or more chapters complete.'},
  {id:'ACH_BOARD',name:'Internet Darling',desc:'Get the fan board’s mood to 90.'},
  {id:'ACH_HARD',name:'The Hard Way',desc:'Last a year on Main eventer or Legend difficulty.'},
  {id:'ACH_FIRED',name:'Future Endeavours',desc:'Get fired by the owner.',hidden:true},
  {id:'ACH_BOMB',name:'Go-Home Heat',desc:'Run a show rated under 40%.',hidden:true},
  {id:'ACH_BROKE',name:'Folded',desc:'Go out of business.',hidden:true},
  {id:'ACH_STARTUP_2Y',name:'Blank Cheque Survivor',desc:'Reach week 104 with the new-money company.'},
  {id:'ACH_OUTLAW_CEIL',name:'Top of the Gutter',desc:'Take the outlaw company to the most popularity its crowd allows.'},
  {id:'ACH_TRAD_VET',name:'Old Hand, New Crown',desc:'Crown a ten-year veteran as champion in the traditional company.'},
  {id:'ACH_JOSHI_MERCH',name:'The Longest Table',desc:'Out-sell a bigger company in merchandise for a week with the all-women company.'},
  {id:'MS_SELLOUT',ms:true,name:'First sell-out',desc:'Fill a building to the rafters.'},
  {id:'MS_TOPMATCH',ms:true,name:'First top-grade match',desc:'Book a match rated 90% or better.'},
  {id:'MS_SHOW80',ms:true,name:'First show of 80% or more',desc:'Run a show rated 80% or better.'},
  {id:'MS_TITLECHANGE',ms:true,name:'First title change',desc:'See a belt change hands on your show.'},
  {id:'MS_CROWN',ms:true,name:'First champion crowned',desc:'Crown a champion for a vacant title.'},
  {id:'MS_BUILT',ms:true,name:'A champion built from nothing',desc:'Make a champion of someone who arrived as an unknown.'},
  {id:'MS_FEUD',ms:true,name:'First feud finished',desc:'Settle a rivalry.'},
  {id:'MS_SPONSOR',ms:true,name:'First sponsor signed',desc:'Put a sponsor on the show.'},
  {id:'MS_50',ms:true,name:'Fiftieth show',desc:'Run fifty shows.'},
  {id:'MS_100',ms:true,name:'Hundredth show',desc:'Run one hundred shows.'},
  {id:'ACH_BOARD_4',name:'Beating the Board',desc:'Beat the corporate board\u2019s plan four months running.'}
];

/* Invented finishing moves, handed out by style. Add an eighth field to a roster row to name one yourself. */
var FINISH={
  B:['Closing Bell','Bar Tab','Hard Goodbye','Knuckle Sermon','Dead Stop','Back Alley Driver','Sledge Elbow','Final Notice','Rust Belt Lariat','Eviction Notice'],
  T:['Iron Clutch','Paperclip Stretch','Anchor Lock','Ninth Hold','Tourniquet','Long Division','Bridge to Nowhere','Padlock','Slow Fuse','Vise Grip Cradle'],
  H:['Skyline Splash','Halo Drop','Red-Eye Dive','Cloudburst','Final Descent','Daybreak Stomp','Comet Tail','Free Fall','Paper Plane','High Tide'],
  P:['Wrecking Yard Slam','Bulldozer Drop','Fault Line','Freight Yard','Rockfall','Big Rig','Ground Floor Bomb','Mudslide','Load Bearer','Cement Mixer'],
  A:['Standing Ovation','Signature Edition','Exclamation Point','Last Word','Final Bow','Full Stop','Final Draft','Encore','Headline','Closing Argument'],
  S:['Thunderclap Kick','Switchblade Knee','Lamp Post','Brain Rattler','Short Fuse','Whiplash Kick','Power Cut Elbow','Circuit Breaker','Head Start','Door Knocker'],
  E:['Crowd Pleaser','Photo Finish','Grand Finale','Punchline','Plot Twist','Applause Break','Cliffhanger','Spoiler Alert','Victory Lap','Roll Credits']
};
var ENTR={
  F:['slaps hands all the way down the aisle','sprints to the ring and slides under the bottom rope','comes through the crowd','stands on the stage and soaks it in before walking down','climbs the turnbuckle and salutes the crowd','jogs down the ramp with a wave to the front row','takes a slow lap around ringside','walks out to a wall of noise'],
  H:['walks out slowly, never taking an eye off the ring','ignores the fans completely on the way down','stops halfway to argue with someone in the front row','takes all the time in the world getting to the ring','sneers at the crowd from the top of the ramp','marches straight down and demands the microphone be taken away','strolls out and tells the referee to hold the ropes open','walks out to a wall of boos']
};
/* ---------- utilities ---------- */
function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function h01(s){return hash(s)/4294967296;}
function rnd(S){var a=(S.rs=(S.rs+0x6D2B79F5)|0);var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;}
function ri(S,a,b){return a+Math.floor(rnd(S)*(b-a+1));}
function pick(S,arr){return arr[Math.floor(rnd(S)*arr.length)];}
function chance(S,p){return rnd(S)<p;}
function avg(a){if(!a.length)return 0;var s=0;for(var i=0;i<a.length;i++)s+=a[i];return s/a.length;}
function flat(a){return [].concat.apply([],a);}
function r1(v){return Math.round(v*10)/10;}
function names(ws){var n=ws.map(function(w){return w.name;});if(n.length<2)return n[0]||'';return n.slice(0,-1).join(', ')+' & '+n[n.length-1];}
function vsLabel(sides){return sides.map(names).join(' vs ');}

function cal(week){var w=week-1;var mi=CAL0.m+Math.floor(w/4);return {wom:w%4+1,month:mi%12,year:CAL0.y+Math.floor(mi/12),label:'Week '+(w%4+1)+', '+MONTHS[mi%12]+' '+(CAL0.y+Math.floor(mi/12))};}
function wageFor(ovr,P){var v=110*Math.pow(1.072,ovr)*P.wageMult;return Math.max(100,v<1000?Math.round(v/10)*10:Math.round(v/50)*50);}
function workRate(w){var a=[w.brawl,w.tech,w.speed].sort(function(x,y){return y-x;});return Math.round(a[0]*0.5+a[1]*0.35+a[2]*0.15);}
function isDev(P,brand){if(!P.brands)return false;for(var i=0;i<P.brands.length;i++)if(P.brands[i].id===brand)return !!P.brands[i].dev;return false;}
function rosterOf(S,pid){return S.w.filter(function(w){return w.promo===pid;});}
function news(S,kind,text){S.news.unshift({w:S.week,k:kind,t:text});if(S.news.length>160)S.news.length=160;}
function award(S,id){if(S.cal||S.ach[id])return;S.ach[id]=S.week;S.toasts.push(id);}

/* ---------- world setup ---------- */
function addWrestler(S,d,promo,brand){
  var j=function(k){return Math.round((h01(d.name+k)-0.5)*6);};
  var st=STYLE[d.style]||STYLE.A,num=function(v){return v!=null&&isFinite(+v);};
  var wk=num(d.work)?+d.work:(function(){var a=[num(d.brawl)?+d.brawl:50,num(d.tech)?+d.tech:50,num(d.speed)?+d.speed:50].sort(function(x,y){return y-x;});return Math.round(a[0]*0.5+a[1]*0.35+a[2]*0.15);})();
  var w={id:S.w.length,name:d.name,g:d.g,promo:promo,brand:brand||null,style:d.style,ovr:d.ovr,o0:d.ovr,
    brawl:num(d.brawl)?clamp(+d.brawl,1,99):clamp(wk+st[0]+j('b'),15,99),tech:num(d.tech)?clamp(+d.tech,1,99):clamp(wk+st[1]+j('t'),15,99),speed:num(d.speed)?clamp(+d.speed,1,99):clamp(wk+st[2]+j('s'),15,99),
    stam:num(d.stam)?clamp(+d.stam,1,99):clamp(wk+st[3]+j('m'),20,99),mic:d.mic,align:d.align,morale:num(d.morale)?clamp(+d.morale,0,100):clamp(70+j('o')*2,40,95),cond:100,mom:0,inj:0,
    wage:0,con:0,ws:0,wins:0,losses:0,lu:0,team:null,xp:0,ret:false,cn:false};
  var sv=function(v,def,lo){return clamp(Math.round(num(v)?+v:def),lo||10,99);},hs=hash(d.name+'age');
  w.cha=sv(d.cha,d.mic+j('c')*2+(d.style==='E'?4:0),15);
  w.hc=sv(d.hc,w.brawl*0.7+({B:16,P:8,S:4,H:-4,T:-8}[d.style]||0)+j('h')*3);
  w.dur=sv(d.dur,62+j('d')*5+({P:8,B:4,H:-8}[d.style]||0),25);
  w.safe=sv(d.safe,55+(wk-60)*0.6+j('f')*4,25);
  w.sq=sv(d.sq,d.ovr*0.6+d.mic*0.25+12+j('q')*4,20);
  w.cons=sv(d.cons,60+(wk-60)*0.4+j('k')*5,30);
  w.age=num(d.age)?+d.age:24+hs%15+(d.ovr>=80?2:0);w.bw=hash(d.name+'bw')%48;
  var p0=d.peak?+d.peak[0]:26+(hs>>>4)%4+({H:-1,T:1,E:1,B:1}[d.style]||0),p1=d.peak?+d.peak[1]:33+(hs>>>7)%6+({H:-2,T:2,E:2,B:2}[d.style]||0);
  w.pk=[p0,Math.max(p0+2,p1)];w.cl=num(d.cliff)?+d.cliff:w.pk[1]+3+(hs>>>11)%5;
  if(d.tweener)w.twn=true;if(d.roles&&(d.roles.length!==1||d.roles[0]!=='wrestler')){w.roles=d.roles.slice();if(d.roles.indexOf('wrestler')<0)w.nw=true;}
  w.pot=num(d.pot)?clamp(+d.pot,workRate(w),99):clamp(wk+Math.round(h01(d.name+'p')*(d.ovr<60?12:3)),Math.min(wk,99),99);
  if(d.uid)w.uid=d.uid;if(d.real)w.real=d.real;if(d.town)w.town=d.town;if(d.wc)w.wc=d.wc;if(d.media)w.media=d.media;if(d.face)w.face=d.face;if(num(d.gr))w.gr=+d.gr;
  var fp=FINISH[d.style]||FINISH.A;w.fin=d.fin||fp[hash(d.name+'f')%fp.length];w.ent=hash(d.name+'e')%ENTR.F.length;
  S.w.push(w);return w;
}
E.newGame=function(playerId,seed,opts){
  opts=opts||{};
  var S={v:4,rs:(seed|0)||7,seed:seed,week:1,player:playerId,diff:DIFF[opts.diff]?opts.diff:'normal',iron:!!opts.iron,dpart:opts.dpart&&typeof opts.dpart==='object'?{money:clamp(+opts.dpart.money|0,0,2),inj:clamp(+opts.dpart.inj|0,0,2),ego:clamp(+opts.dpart.ego|0,0,2),rival:clamp(+opts.dpart.rival|0,0,2)}:null,mode:'booker',w:[],promos:{},order:[],teams:[],feuds:[],mystery:null,news:[],inbox:[],quests:[],ach:{},toasts:[],
    stats:{shows:0,matches:0,run:0,feudsDone:0,bestMatch:0,bestShow:0},said:[],h2h:{},trust:60,ledger:[],sponsors:[],spOffers:[],slotAsk:-99,hype:0,rateMod:0,reports:[],queue:[],qi:0,card:[],over:null,nid:1,recent:{},fin:null};
  var cur={promo:'FA',brand:null},byName={};
  CAL0={y:DB.startYear,m:DB.startMonth};
  S.db={startYear:DB.startYear,startMonth:DB.startMonth,events:DB.events,rules:DB.rules||null,indie:DB.indie,sponsors:DB.sponsors||null,columnists:DB.columnists||null,uni:DB.uni||null,fictional:!!DB.fictional};
  var preset=[];
  if(DB.rows)DB.rows.forEach(function(d){var w=addWrestler(S,d,d.promo||'FA',d.brand||null);byName[w.name]=w.id;byName['#'+d.uid]=w.id;if(d.wage||d.con||d.tw!=null)preset.push([w,d]);});
  else DB.roster.split('\n').forEach(function(line){
    line=line.trim();if(!line)return;
    if(line[0]==='#'){var p=line.slice(1).trim().split(/\s+/);cur={promo:p[0],brand:p[1]||null};return;}
    var f=line.split('|');if(f.length<7)return;
    var w=addWrestler(S,{name:f[0],g:f[1],ovr:+f[2],style:f[3],work:+f[4],mic:+f[5],align:f[6],fin:f[7]||null},cur.promo,cur.brand);byName[w.name]=w.id;
  });
  // unsigned independent talent (invented names)
  var I=DB.indie,styles=['B','T','H','P','A','S','E'],seen={};
  for(var i=0,nInd=(DB.freeAgents!=null?DB.freeAgents:36)+(opts.fed?48:0);i<nInd;i++){
    var g=i%3===2?'F':'M',nm;
    var fp=(g==='F'?I.firstF:I.firstM).filter(function(x){return !seen['f:'+x];}),lp=I.last.filter(function(x){return !seen['l:'+x];}),fn,ln;
    do{fn=pick(S,fp.length?fp:(g==='F'?I.firstF:I.firstM));ln=pick(S,lp.length?lp:I.last);nm=fn+' '+ln;}while(seen[nm]||byName[nm]!==undefined);
    seen[nm]=1;seen['f:'+fn]=1;seen['l:'+ln]=1;
    var o=ri(S,18,52);
    addWrestler(S,{name:nm,g:g,ovr:o,style:pick(S,styles),work:clamp(o+ri(S,8,30),40,86),mic:ri(S,30,80),align:chance(S,0.5)?'F':'H'},'FA',null);
  }
  var defs=DB.promotions.slice();
  if(opts.fed){var fd=mkFedDef(opts.fed,clean(opts.name,24)||'The Booker');defs.push(fd);S.custom=fd;S.player=playerId=fd.id;}
  defs.forEach(function(d){
    var P={id:d.id,name:d.name,blurb:d.blurb,cash:d.cash,cash0:d.cash,image:d.image,image0:d.image,wq:d.wq,angles:d.angles,style:(d.owner&&d.owner.style)||'stars',staff:d.staff||{agent:'The road agent',writer:'The head writer'},wageMult:d.wageMult,tvRate:d.tvRate,prod:d.prod,net:d.net,flagship:d.flagship,
      prodLvl:d.prodLvl==null?2:d.prodLvl,prod0:d.prodLvl==null?2:d.prodLvl,risk:d.risk==null?1:d.risk,risk0:d.risk==null?1:d.risk,tix:1,adv:0,slot:d.slot==null?1:d.slot,slot0:d.slot==null?1:d.slot,camp:d.image>=60?2:1,med:d.image>=80?3:(d.image>=60?2:(d.image>=45?1:0)),starB:{},ann:(d.announcers||['The play-by-play man','The colour man']).slice(),cities:(d.cities||['the city']).slice(),brands:d.brands?JSON.parse(JSON.stringify(d.brands)):null,shows:JSON.parse(JSON.stringify(d.shows)),titles:[],hist:[],led:{tv:0,gate:0,ppv:0,bonus:0,prod:0},base:{},mainB:{},trend:0,neg:0,fixed:0,varRate:0,last:null};
    d.titles.forEach(function(t){P.titles.push({id:t.id,name:t.name,brand:t.brand||null,g:t.g,lvl:t.lvl,tag:!!t.tag,holders:t.holders.map(function(n){return byName[n];}).filter(function(x){return x!==undefined;}),prestige:t.lvl===3?85:(t.lvl===2?68:52),since:1,last:1,defs:0});});
    if(d.full)P.full=d.full;if(d.owner)P.owner=d.owner;if(d.media)P.media=d.media;if(d.model&&MODELS[d.model]&&d.model!=='classic')P.model=d.model;S.promos[P.id]=P;S.order.push(P.id);if(d.draft)draftRoster(S,P,d);
    (d.teams||[]).forEach(function(tm){var a=byName[tm[0]],b=byName[tm[1]];if(a===undefined||b===undefined||S.w[a].promo!==P.id||S.w[b].promo!==P.id)return;var t=formTeam(S,P,S.w[a],S.w[b],tm[2]!=null?clamp(tm[2],0,100):35+Math.round(h01(tm[0]+tm[1])*50));if(tm[3])t.chem=clamp(tm[3],-10,10);if(tm[4])t.name=tm[4];});
  });
  S.w.forEach(function(w){if(w.promo!=='FA'&&!S.promos[w.promo]){w.promo='FA';w.brand=null;}if(w.promo!=='FA'){w.wage=wageFor(w.ovr,S.promos[w.promo]);w.con=ri(S,14,140);}});
  preset.forEach(function(x){if(x[0].promo==='FA')return;if(x[1].wage)x[0].wage=x[1].wage;if(x[1].con)x[0].con=x[1].con;if(x[1].tw!=null)x[0].jw=S.week-x[1].tw;});
  S.columnist=pick(S,DB.columnists||['The Ringside Wire']);S.uni=DB.uni?{id:DB.uni.id,name:DB.uni.name,version:DB.uni.version}:null;S.stables=[];
  initYou(S,opts);
  initGimmicks(S);
  calibrate(S);
  NEWX.forEach(function(fn){fn(S);});
  startWeek(S);
  news(S,'world',S.custom?(S.custom.full||S.custom.name)+' opens its doors.':'You take over booking for '+S.promos[playerId].name+'.');if(S.custom)award(S,'ACH_FED');
  return S;
};
function formTeam(S,P,a,b,exp){var t={id:S.nid++,promo:P.id,m:[a.id,b.id],exp:exp||5,ls:0};S.teams.push(t);a.team=t.id;b.team=t.id;return t;}
function teamOf(S,w){if(w.team==null)return null;for(var i=0;i<S.teams.length;i++)if(S.teams[i].id===w.team)return S.teams[i];return null;}
function dissolveTeam(S,t){t.m.forEach(function(id){S.w[id].team=null;});S.teams=S.teams.filter(function(x){return x!==t;});}
function partnerOf(S,w){var t=teamOf(S,w);if(!t)return null;return S.w[t.m[0]===w.id?t.m[1]:t.m[0]];}

/* ---------- money model ---------- */
function showMult(show){return show.big?1:(show.mult||1);}
function viewersK(P,show,qf){return 2200*Math.pow(P.image/100,3)*showMult(show)*qf;}
function demand(P,show,hype){return (show.big?60000*(show.flag?1.7:1):20000*showMult(show))*Math.pow(P.image/100,3)*hype;}
function ticket(P,show){return (15+P.image*0.85)*(show.big?1.6:1);}
function buysK(P,show,hype){return 700*Math.pow(P.image/100,4)*hype*(show.flag?1.8:1);}
function capFor(d){for(var i=0;i<CAPS.length;i++)if(CAPS[i]>=d)return CAPS[i];return CAPS[CAPS.length-1];}
function merchWeek(S,P){var r=rosterOf(S,P.id).map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}).slice(0,10);return 2.5e6*Math.pow(P.image/100,3)*Math.pow(avg(r)/100,2)*mixOf(P).merch*(1+catchBoost(S,P));}
function wagesWeek(S,P){var s=0;S.w.forEach(function(w){if(w.promo===P.id)s+=w.wage;});return s;}
function baselineIncome(S,P){
  // what an on-expectation month brings in, per week (big events run a little hot: feuds peak there)
  var inc=merchWeek(S,P),mx=mixOf(P);
  P.shows.forEach(function(sh){var d=demand(P,sh,1);inc+=viewersK(P,sh,1)*P.tvRate*mx.tv+Math.min(capFor(d),d*1.04)*ticket(P,sh)*mx.gate;});
  var big={big:true},bd=demand(P,big,1);
  inc+=(buysK(P,big,1.17)*1000*22*(1+0.8/12)*mx.ppv+Math.min(capFor(bd),bd*1.17)*ticket(P,big)*(1+0.7/12)*mx.gate)/4;
  return inc*1.02;
}
function calibrate(S){
  // 1) what an average, competently booked card scores for each show (the audience's expectation)
  var C=JSON.parse(JSON.stringify(S));C.cal=true;C.player=null;
  S.order.forEach(function(pid){
    var P=C.promos[pid],RP=S.promos[pid];
    P.shows.concat([{id:'big',big:true,name:'x'}]).forEach(function(sh){
      var rs=[],mains=[],stars=[];
      for(var k=0;k<4;k++){var rep=runShow(C,P,sh,autoBook(C,P,sh));rs.push(rep.rating);mains.push(rep.mainOv);stars.push(rep.mainStar);restAll(C,pid);}
      RP.base[sh.id]=r1(avg(rs));RP.mainB[sh.id]=r1(avg(mains));RP.starB[sh.id]=r1(avg(stars));
    });
  });
  // 2) overheads sized so an on-expectation promotion clears its target weekly margin
  S.order.forEach(function(pid){
    var P=S.promos[pid],inc=baselineIncome(S,P);
    var over=Math.max(0,inc-wagesWeek(S,P)-P.prod*P.shows.length-P.prod-P.net-CAMP_C[P.camp||0]*inc-MED_C[P.med||0]*inc);
    P.fixed=Math.round(over*0.4);P.varRate=over*0.6/inc;P.inc0=inc;
  });
}
function restAll(S,pid){S.w.forEach(function(w){if(w.promo===pid){w.cond=100;w.inj=0;}});}
function expected(P,show){var b=show.big?P.base.big:(P.base[show.id]||P.base.big);return b+0.6*(P.image-P.image0)+(P.expB||0)+(P.expA||0);}

/* ---------- storyline helpers ---------- */
function activeFeuds(S){return S.feuds.filter(function(f){return !f.res;});}
function feudOf(S,a,b){for(var i=0;i<S.feuds.length;i++){var f=S.feuds[i];if(f.res)continue;if((f.a.indexOf(a)>=0&&f.b.indexOf(b)>=0)||(f.a.indexOf(b)>=0&&f.b.indexOf(a)>=0))return f;}return null;}
function feudsFor(S,id){return S.feuds.filter(function(f){return !f.res&&(f.a.indexOf(id)>=0||f.b.indexOf(id)>=0);});}
function inFeud(S,id){return feudsFor(S,id).length>0;}
function feudLabel(S,f){return f.a.map(function(i){return S.w[i].name;}).join(' & ')+' vs '+f.b.map(function(i){return S.w[i].name;}).join(' & ');}
function feudStage(f){return f.res?'Finished':(f.heat>=85?'White hot':(f.heat>=60?'Hot':(f.heat>=30?'Heating up':'Simmering')));}
function startFeud(S,P,a,b,heat,why,opts){
  opts=opts||{};
  if(a.id===b.id)return null;
  var f=feudOf(S,a.id,b.id);
  if(f){f.heat=clamp(Math.max(f.heat,heat),0,100);f.last=S.week;f.log.push({w:S.week,t:why});return f;}
  if(activeFeuds(S).length>=8&&!opts.force)return null;
  f={id:S.nid++,promo:P.id,a:[a.id],b:[b.id],heat:clamp(heat,0,100),start:S.week,last:S.week,matches:0,aw:0,bw:0,log:[{w:S.week,t:why}],title:opts.title||null,kind:opts.kind||'feud',res:false};
  S.feuds.push(f);
  news(S,'story','New rivalry: '+a.name+' vs '+b.name+'.');
  return f;
}
function heatUp(S,f,amt,txt){if(amt>0)amt*=modelOf(S.promos[f.promo]).heat||1;if(amt>0&&S.booker&&f.promo===S.player)amt*=(1+0.06*S.booker.sk.creative)*houseHeat(S);f.heat=clamp(f.heat+amt,0,100);f.last=S.week;if(txt){f.log.push({w:S.week,t:txt});if(f.log.length>16)f.log.shift();}if(f.heat>=90&&f.promo===S.player)award(S,'ACH_FEUD_HOT');}
function turn(S,w,why){
  // a turn that was teased in the last two weeks lands harder; a wrestler who already turned inside the last year lands softer, and the fans say so
  var built=w.la!=null&&S.week-w.la<=2,tired=w.tw!=null&&S.week-w.tw<52,note='';
  if(!S.cal){
    if(tired){w.mom=clamp(w.mom-1,-10,10);note=' The fans have seen '+w.name+' change sides before and groan.';}
    else if(built){w.mom=clamp(w.mom+3,-10,10);w.ovr=clamp(w.ovr+0.6,1,100);note=' It was built over the last two weeks and the crowd bought it.';}
    else note=' It came out of nowhere. The crowd is not sure what to make of it.';
  }
  w.align=w.align==='F'?'H':'F';w.tw=S.week;w.gs=S.week;mile(S,w,'turn','Turned '+(w.align==='F'?'face':'heel')+(why?': '+why:'')+(tired?' (too soon after the last turn)':(built?' (well built)':'')));
  news(S,'story',w.name+' turns '+(w.align==='F'?'face':'heel')+(why?' — '+why:'')+'.'+note);if(w.promo===S.player)award(S,'ACH_TURN');}
function holdLvl(P,id){var l=0;P.titles.forEach(function(t){if(t.holders.indexOf(id)>=0&&t.lvl>l)l=t.lvl;});return l;}
function titleById(P,id){for(var i=0;i<P.titles.length;i++)if(P.titles[i].id===id)return P.titles[i];return null;}
function rkey(a,b){return a<b?a+'-'+b:b+'-'+a;}
function titleFits(t,m){var d=MT[m.mt];return !!d&&(t.tag?m.mt==='tag':(d.per===1&&!(m.mt==='br'&&t.holders.length)));}

/* ---------- booking ---------- */
function eligible(S,P,show){return S.w.filter(function(w){return (w.promo===P.id&&w.inj<=0&&!w.camp&&!w.nw&&w.rest!==S.week&&!(w.away>=S.week)&&(show.big||!show.brand||w.brand===show.brand))||isGuest(S,P,w,show);});}
function showTitles(P,show){return P.titles.filter(function(t){return show.big?!isDev(P,t.brand):(!show.brand||!t.brand||t.brand===show.brand);});}
function gimmickFor(S,a){return a.style==='H'?'ladder':(a.style==='T'?'sub':(chance(S,0.5)?'cage':'hardcore'));}

function autoBook(S,P,show){
  var big=!!show.big,n=big?7:5,used={},card=[],isPl=P.id===S.player;
  var pool=eligible(S,P,show).filter(function(w){return w.cond>=40&&!(big&&isDev(P,w.brand));});
  var guests=pool.filter(function(w){return w.promo!==P.id;});pool=pool.filter(function(w){return w.promo===P.id;});
  var inPool={};pool.forEach(function(w){inPool[w.id]=1;});
  var titles=showTitles(P,show);
  function free(w){return inPool[w.id]&&!used[w.id];}
  function take(m,pos){flat(m.sides).forEach(function(id){used[id]=1;});m._p=pos;card.push(m);}
  function byOvr(a,b){return b.ovr-a.ovr;}
  var men=pool.filter(function(w){return w.g==='M';}).sort(byOvr),women=pool.filter(function(w){return w.g==='F';}).sort(byOvr);
  // the bigger division carries the card; in an all-women company that is the women
  var G1=women.length>men.length?'F':'M',G2=G1==='M'?'F':'M',L2=G1==='M'?women:men;
  function opp(w,range,filter){
    var best=null,bs=-1e9;
    pool.forEach(function(o){
      if(o.id===w.id||!free(o)||o.g!==w.g)return;
      if(w.team!=null&&o.team===w.team)return;
      var d=Math.abs(o.ovr-w.ovr);if(d>range)return;
      if(filter&&!filter(o))return;
      var s=-d-(o.align===w.align?8:0)+rnd(S)*8,rk=S.recent[P.id+':'+rkey(w.id,o.id)];
      if(rk&&S.week-rk<4)s-=14;
      if(feudOf(S,w.id,o.id))s+=big?25:-6;
      if(s>bs){bs=s;best=o;}
    });
    return best;
  }
  function single(a,b,o,pos){o=o||{};var p=clamp(0.5+(a.ovr-b.ovr)/40+(a.mom-b.mom)*0.02+(o.bias||0),0.12,0.9);
    take({mt:'1v1',sides:[[a.id],[b.id]],win:chance(S,p)?0:1,title:o.title||null,stip:o.stip||'std',len:o.len||'M'},pos);}
  function contenders(t){
    var L=(t.g==='F'?women:men).filter(function(w){return free(w)&&holdLvl(P,w.id)===0&&(!t.brand||big||w.brand===t.brand);});
    var skip=t.lvl===3?0:(t.lvl===2?3:8);skip=Math.max(0,Math.min(skip,L.length-2));
    return L.slice(skip);
  }
  function titleSingles(t,len,pos){
    if(t.tag)return false;
    var T=isPl&&S.tourn&&!S.tourn.done&&S.tourn.title===t.id?S.tourn:null,rk=rankFor(S,P,t,5).filter(free);
    if(!t.holders.length){if(T)return false;var c=rk.length>=2?rk:contenders(t);if(c.length<2)return false;single(c[0],c[1],{title:t.id,len:len},pos);return true;}
    var ch=S.w[t.holders[0]],o=null;if(!free(ch))return false;
    rk.forEach(function(w){if(!o&&w.shot===t.id)o=w;});
    if(!o)activeFeuds(S).forEach(function(f){if(o||f.title!==t.id)return;var id=f.a[0]===ch.id?f.b[0]:(f.b[0]===ch.id?f.a[0]:null);if(id!=null&&free(S.w[id])&&S.w[id].g===t.g)o=S.w[id];});
    if(!o&&!T){var fresh=rk.filter(function(w){var r=S.recent[P.id+':'+rkey(ch.id,w.id)];return !(r&&S.week-r<4);});if(fresh.length)o=fresh[Math.min(fresh.length-1,Math.floor(rnd(S)*rnd(S)*3))];}
    if(!o&&!T)o=opp(ch,22,function(x){return holdLvl(P,x.id)===0&&(t.lvl>1||x.ovr<=ch.ovr+8);});
    if(!o)return false;
    single(ch,o,{title:t.id,len:len,bias:0.3},pos);return true;
  }
  function tavg(t){return (S.w[t.m[0]].ovr+S.w[t.m[1]].ovr)/2;}
  function teamsAvail(g){return S.teams.filter(function(t){return t.promo===P.id&&t.m.every(function(id){var w=S.w[id];return free(w)&&w.g===g;});});}
  function tagMatch(t,len,pos){
    var g=t?t.g:G1,av=teamsAvail(g),A=null,B=null,bias=0;
    if(t&&t.holders.length===2){
      if(!t.holders.every(function(id){return free(S.w[id]);}))return false;
      A=t.holders.slice();bias=0.3;av=av.filter(function(x){return x.m.indexOf(A[0])<0&&x.m.indexOf(A[1])<0;});
    }else if(t){
      if(av.length<2)return false;av.sort(function(x,y){return tavg(y)-tavg(x);});A=av[0].m.slice();B=av[1].m.slice();
    }
    if(!A){if(av.length<2)return false;var ta=pick(S,av);A=ta.m.slice();av=av.filter(function(x){return x!==ta;});}
    if(!B){if(!av.length)return false;var aa=(S.w[A[0]].ovr+S.w[A[1]].ovr)/2;av.sort(function(x,y){return Math.abs(tavg(x)-aa)-Math.abs(tavg(y)-aa);});B=av[0].m.slice();}
    var p=clamp(0.5+((S.w[A[0]].ovr+S.w[A[1]].ovr)-(S.w[B[0]].ovr+S.w[B[1]].ovr))/80+bias,0.12,0.9);
    take({mt:'tag',sides:[A,B],win:chance(S,p)?0:1,title:t?t.id:null,stip:'std',len:len||'M'},pos);return true;
  }
  function filler(tier,len,g,pos){
    var L=(g==='F'?women:men).filter(free);if(L.length<2)return false;
    var i=Math.min(L.length-2,Math.floor(L.length*tier+rnd(S)*Math.max(1,L.length*0.12)));
    var a=L[i],b=opp(a,16)||opp(a,45);if(!b)return false;single(a,b,{len:len},pos);return true;
  }
  var mt=titles.filter(function(t){return !t.tag&&t.g===G1;}).sort(function(a,b){return b.lvl-a.lvl;});
  var topLvl=mt.length?mt[0].lvl:0;
  var stale=function(a,b){return (a.holders.length?a.last:-99)-(b.holders.length?b.last:-99)||b.lvl-a.lvl;};
  var worlds=mt.filter(function(t){return t.lvl===topLvl;}),mids=mt.filter(function(t){return t.lvl<topLvl;}).sort(stale);
  var wt=titles.filter(function(t){return !t.tag&&t.g===G2;}).sort(stale);
  var tt=titles.filter(function(t){return t.tag;}).sort(stale);
  // tournament matches come first: they are owed to the bracket
  if(isPl&&S.tourn&&!S.tourn.done&&S.tourn.promo===P.id){
    var TT=S.tourn,tb=0,last=TT.fmt==='ko'&&TT.pend.length===1;
    TT.pend.forEach(function(p){if(tb>=(big?4:2))return;var a=S.w[p[0]],b=S.w[p[1]];if(!free(a)||!free(b))return;single(a,b,{len:last?'L':'M'},last?95:65);tb++;});
  }
  // what the owner asked for this month: a match that helps it along, with the finish called if the booking power allows
  if(isPl)S.quests.forEach(function(q){
    if(!/^o_/.test(q.type))return;var w=S.w[q.w];if(!w||!free(w))return;
    if(q.type==='o_belt'){var t=titles.filter(function(x){return x.id===q.title;})[0];if(!t||!t.holders.length||t.holders.indexOf(w.id)>=0)return;var ch=S.w[t.holders[0]];if(!ch||!free(ch))return;
      take({mt:'1v1',sides:[[w.id],[ch.id]],win:-2,call:0,title:t.id,stip:'std',len:'M'},75);card[card.length-1]._q=1;return;}
    var o=opp(w,35);if(!o)return;
    take({mt:'1v1',sides:[[w.id],[o.id]],win:-2,call:0,title:null,stip:'std',len:'M'},60);card[card.length-1]._q=1;
  });
  // visitors from another promotion get a home opponent each
  guests.slice(0,big?3:2).forEach(function(g){
    var best=null,bd=99;pool.forEach(function(o){if(!free(o)||o.g!==g.g||holdLvl(P,o.id)>=3)return;var rk=S.recent[P.id+':'+rkey(o.id,g.id)],d=Math.abs(o.ovr-g.ovr)+rnd(S)*6+(rk&&S.week-rk<5?14:0);if(d<bd){bd=d;best=o;}});
    if(best&&bd<=30)take({mt:'1v1',sides:[[best.id],[g.id]],win:-2,title:null,stip:'std',len:'M'},72);
  });
  // main event(s)
  if(big){
    if(!(worlds[0]&&titleSingles(worlds[0],'L',100)))filler(0,'L',G1,100);
    if(!(worlds[1]&&titleSingles(worlds[1],'L',90)))filler(0,'L',G1,90);
  }else{
    if(!(worlds[0]&&(chance(S,0.3)||!worlds[0].holders.length)&&titleSingles(worlds[0],'L',100)))filler(0,'L',G1,100);
  }
  // the player's running feuds
  if(isPl){
    var fs=activeFeuds(S).filter(function(f){return f.promo===P.id;}).sort(function(a,b){return b.heat-a.heat;}),booked=0;
    fs.forEach(function(f){
      if(booked>=(big?2:1))return;
      var a=S.w[f.a[0]],b=S.w[f.b[0]];if(!free(a)||!free(b)||a.g!==b.g)return;
      if(big?f.heat>=45:(f.heat>=30&&chance(S,0.35))){single(a,b,{len:big?'L':'M',stip:big&&f.heat>=60?gimmickFor(S,a):'std'},70);booked++;}
    });
  }
  if(L2.length>=2){if(!(wt[0]&&(big||chance(S,0.25)||!wt[0].holders.length)&&titleSingles(wt[0],'M',50)))filler(0,'M',G2,50);}
  if(mids[0]&&(big||chance(S,0.35)||!mids[0].holders.length)&&titleSingles(mids[0],'M',60)){}else filler(0.2,'M',G1,60);
  if(card.length<n){if(!((tt[0]&&(big||chance(S,0.25)||!tt[0].holders.length)&&tagMatch(tt[0],'M',40))||tagMatch(null,'M',40)))filler(0.4,'M',G1,40);}
  if(card.length<n)filler(0.5,big?'M':'S',G1,10);
  var guard=0;
  while(card.length<n&&guard++<12){
    if(big&&mids[1]&&!card.some(function(m){return m.title===mids[1].id;})&&titleSingles(mids[1],'M',55))continue;
    if(!filler(0.2+rnd(S)*0.5,'M',(L2.filter(free).length>=2&&chance(S,0.25))?G2:G1,30))if(!filler(0.1,'M',G1,30))break;
  }
  // the company's model shapes the card: gimmick matches for an outlaw, a multi-man match for a spectacle, trios for the traditionalists
  var MD=modelOf(P);
  if(MD.card)MD.card({card:card,big:big,chance:function(p){return chance(S,p);},pick:function(a){return pick(S,a);},multi:function(kind){
    var need=kind==='6man'?6:4,L=pool.filter(function(w){return free(w)&&w.g===G1;}).sort(byOvr);
    if(L.length<need){var low=card.filter(function(m){return !m.title&&m.mt==='1v1'&&m._p<=40&&S.w[m.sides[0][0]].g===G1;}).sort(function(a,b){return a._p-b._p;})[0];
      if(low){card.splice(card.indexOf(low),1);flat(low.sides).forEach(function(id){delete used[id];});L=pool.filter(function(w){return free(w)&&w.g===G1;}).sort(byOvr);}}
    if(L.length<need)return;
    var s0=Math.max(0,Math.min(L.length-need,Math.floor((L.length-need)*0.35))),ws=L.slice(s0,s0+need),fs=ws.filter(function(w){return w.align==='F';}),hs=ws.filter(function(w){return w.align!=='F';});
    if(kind==='6man'){var o=fs.concat(hs),A=o.slice(0,3),B=o.slice(3);take({mt:'6man',sides:[A.map(function(w){return w.id;}),B.map(function(w){return w.id;})],win:-2,title:null,stip:'std',len:'M'},45);}
    else take({mt:'4way',sides:ws.map(function(w){return [w.id];}),win:-2,title:null,stip:'std',len:'M'},45);
    while(card.length>n){var lo=card.filter(function(m){return !m.title&&m._p<45;}).sort(function(a,b){return a._p-b._p;})[0];if(!lo)break;card.splice(card.indexOf(lo),1);}
  }});
  card.sort(function(a,b){return a._p-b._p;});
  // calls cost booking power: drop the ones the player cannot afford, last asked first
  if(isPl){var g2=0;while(g2++<8&&cardCost(S,card)>S.bp){var pm=card.filter(function(m){return m._q&&m.call!=null;})[0];if(!pm)break;delete pm.call;}}
  card.forEach(function(m){delete m._p;delete m._q;m.win=-2;});
  return card;
}

function validate(S,P,show,card){
  var err=[],warn=[],seen={},max=show.big?10:SLOT_MAX[P.slot];
  if(card.length<3)err.push('Book at least 3 matches.');
  if(card.length>max)err.push('This show has room for '+max+' matches.');
  card.forEach(function(m,i){
    var n=i+1,def=MT[m.mt];if(!def){err.push('Match '+n+': pick a match type.');return;}
    var ids=flat(m.sides),ws=[],bad=false,dup={};
    if(m.sides.length!==def.sides||m.sides.some(function(s){return s.length!==def.per;}))bad=true;
    ids.forEach(function(id){if(id==null||!S.w[id]){bad=true;return;}if(dup[id])err.push('Match '+n+': '+S.w[id].name+' is booked twice in the same match.');dup[id]=1;ws.push(S.w[id]);});
    if(bad){err.push('Match '+n+': fill every spot.');return;}
    ws.forEach(function(w){
      var gu=isGuest(S,P,w,show);
      if(w.promo!==P.id&&!gu)err.push('Match '+n+': '+w.name+' is not on your roster.');
      else if(w.nw)err.push('Match '+n+': '+w.name+' is not a wrestler.');
      else if(w.rest===S.week)err.push('Match '+n+': '+w.name+' has the week off.');
      else if(w.inj>0)err.push('Match '+n+': '+w.name+' is injured ('+w.inj+' wk).');
      else if(w.camp)err.push('Match '+n+': '+w.name+' is in training camp. Call them up first.');
      else if(w.away>=S.week)err.push('Match '+n+': '+w.name+' is off the show this week (storyline).');
      else if(!gu&&!show.big&&show.brand&&w.brand!==show.brand)err.push('Match '+n+': '+w.name+' is not on this brand.');
      seen[w.id]=(seen[w.id]||0)+1;if(seen[w.id]===2)warn.push(w.name+' is working twice tonight.');
      if(w.cond<45&&w.inj<=0)warn.push(w.name+' is worn down ('+Math.round(w.cond)+'% condition).');
    });
    if(m.title){
      var t=titleById(P,m.title);
      if(!t){err.push('Match '+n+': unknown title.');return;}
      if(!titleFits(t,m))err.push('Match '+n+': the '+t.name+' '+(t.tag?'need a tag team match.':(m.mt==='br'?'can only be decided in a battle royal when vacant.':'can’t be defended in a tag match.')));
      if(ws.some(function(w){return w.g!==t.g;}))err.push('Match '+n+': wrong division for the '+t.name+'.');
      if(ws.some(function(w){return w.promo!==P.id;}))err.push('Match '+n+': a visiting wrestler cannot challenge for your titles.');
      if(t.holders.length&&!m.sides.some(function(s){return t.holders.every(function(h){return s.indexOf(h)>=0;});}))err.push('Match '+n+': the '+t.name+' champion'+(t.tag?'s are':' is')+' not in this match.');
    }
  });
  return {errors:err,warnings:warn.filter(function(x,i,a){return a.indexOf(x)===i;})};
}

