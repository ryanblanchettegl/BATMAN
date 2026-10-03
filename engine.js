/* Gorilla Position — simulation engine (built from src/). No DOM. State is plain JSON so it can be saved as-is. */
(function (root) {
'use strict';
/* ===== 00-core.js ===== */
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
  iron:{n:'Iron man',w:null,heat:3,inj:1.3},
  tables:{n:'Tables',w:[0.65,0.1,0.25],heat:4,inj:1.9,hc:0.3},
  lumber:{n:'Lumberjack',w:[0.5,0.2,0.3],heat:3,inj:1.3,hc:0.1},
  mask:{n:'Mask against mask',w:[0.2,0.4,0.4],heat:6,inj:1.1},
  hair:{n:'Hair against hair',w:[0.5,0.2,0.3],heat:5,inj:1.2}
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
function merchWeek(S,P){var r=rosterOf(S,P.id).map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}).slice(0,10);return 2.5e6*Math.pow(P.image/100,3)*Math.pow(avg(r)/100,2)*mixOf(P).merch*(1+catchBoost(S,P))+linesWeek(S,P);}
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
function gimmickFor(S,a,b){
  var k=a.style==='H'?'ladder':(a.style==='T'?'sub':(chance(S,0.5)?'cage':'hardcore')),pm=a.promo!=='FA'&&S.promos[a.promo]?S.promos[a.promo].model:'';
  var x=rnd(S);   // the wider library: a mask or hair match for the right pair, tables and lumberjacks now and then
  if(b&&masked(a)===1&&masked(b)===1&&x<0.4)return 'mask';
  if(b&&pm==='joshi'&&x<0.4&&!(a.sh>S.week-20)&&!(b.sh>S.week-20))return 'hair';
  if(x>0.88)return pm==='purist'||pm==='corporate'?k:'tables';
  if(x>0.8&&pm!=='purist')return 'lumber';
  return k;
}

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
      if(big?f.heat>=45:(f.heat>=30&&chance(S,0.35))){single(a,b,{len:big?'L':'M',stip:big&&f.heat>=60?gimmickFor(S,a,b):'std'},70);booked++;}
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


/* ===== 10-match.js ===== */
/* ---------- extension hooks: later systems plug into the match engine here ---------- */
// EFX(ctx,w) -> effort delta; MQX/CRX(ctx) -> {d,x} quality / crowd delta with an optional dirt-sheet label;
// POST(ctx) after a match is settled; SHOWX(S,P,show,rep) after a show; WEEKX(S) at week end; NEWX(S) on a new game.
var MODEL_CROWD={},ANGDONE=[],EFX=[],MQX=[],CRX=[],FINX=[],POST=[],SHOWX=[],WEEKX=[],NEWX=[],ANGX=[],EVMAKE=[],EVR={},QEND={},PREX=[];

/* ---------- match engine ---------- */
function workOf(w,stip,mins){
  var st=STIP[stip]||STIP.std,v;
  if(st.w)v=w.brawl*st.w[0]+w.tech*st.w[1]+w.speed*st.w[2];
  else{var a=[w.brawl,w.tech,w.speed].sort(function(x,y){return y-x;});v=a[0]*0.5+a[1]*0.35+a[2]*0.15;}
  if(st.hc)v=v*(1-st.hc)+(w.hc==null?w.brawl:w.hc)*st.hc;
  var comfort=6+w.stam*0.25;if(mins>comfort)v-=(mins-comfort)*0.9;
  return v;
}
function chem(S,a,b){var k0=rkey(a,b),x=S.chemX&&S.chemX[k0],bd=S.bond&&S.bond[k0]?clamp(S.bond[k0]*0.3,-3,3):0;if(x!=null)return x+bd;var k=S.seed+':'+k0;return (h01('c'+k)+h01('d'+k)-1)*6+bd+styleBlend(S.w[a],S.w[b]);}
function addOvr(P,w,d){var cap=ovrCap(P,w);if(d>0&&w.ovr>=cap)d*=0.2;w.ovr=clamp(w.ovr+d,1,100);}
function fill(t,o){return t.replace(/\{(\w+)\}/g,function(_,k){return o[k]!=null?o[k]:'';});}

/* ---------- commentary grammar: lines are assembled from parts so calls rarely repeat ---------- */
var GR={
  bell:['There is the bell.','And we are under way.','The bell sounds, and here we go.','The referee calls for the bell.','We are off and running.'],
  open_T:['{a} takes it to the mat early and goes after {b}’s #limb#.','{a} grounds {b} with a string of holds.','{a} ties {b} up in knots in the opening minutes.','A wrestling clinic early on, and {a} is the teacher.'],
  open_B:['{a} turns it into a fight right away and brawls {b} around ringside.','{a} backs {b} into the corner and unloads.','{a} wants no part of a wrestling match. This is a scrap.','{a} clubs {b} down and stays right on top.'],
  open_H:['{a} picks up the pace early and sends {b} to the floor with a dive.','{a} flies around the ring and keeps {b} off balance.','{a} is moving at a different speed tonight.','{a} springs off the ropes and wipes {b} out.'],
  open_P:['{a} throws {b} around in the early going.','{a} shrugs off {b}’s offence and takes over with power.','{a} just tossed {b} halfway across the ring.','Pure power from {a}. {b} cannot get anything going.'],
  open_S:['{a} lights {b} up with strikes from the opening bell.','{a} and {b} trade shots, and {a} gets the better of it.','{a} is throwing bombs already.','Hard kicks from {a}. You can hear every one of them.'],
  open_E:['{a} plays to the crowd, then catches {b} off guard.','{a} stalls on the outside before taking control.','{a} is having a great time out there, and {b} is not.','{a} takes a bow, and {b} takes exception.'],
  open_A:['{a} and {b} feel each other out before {a} takes control.','{a} out-wrestles {b} in the opening minutes.','A cautious start, and {a} finds the first opening.','{a} gets the better of the early exchanges.'],
  open_multi:['It is every wrestler for themselves, and {a} is the first to find a target in {b}.','The bell rings and the ring fills with bodies. {a} goes straight for {b}.','No partners, no friends, and the referee has their hands full. {a} starts with {b}.','Everyone is a rival here. {a} and {b} collide first while the others circle.'],
  open_six:['Three against three, and the corner is a crowded place. {a} starts for their side against {b}.','A six-man tag: {a} and {b} start it, and the other four lean on the ropes.','Six bodies, two corners, one referee. {a} and {b} get things going.','{a} tags in, {b} tags out, and the crowd cannot keep track of who is legal.'],
  mid_multi:['The ring turns into a pile-up and {b} is lost in the middle of it.','Two of them spill to the floor while {a} and {b} trade near-falls, and a third breaks up the cover.','Alliances flip every thirty seconds. {b} thinks about trusting {a}, then thinks better of it.','Nobody can stay on one opponent for long. {a} is pulled off {b} twice in a minute.'],
  mid_six:['The hot tag brings the crowd up. {b} cannot reach the corner while {a} cuts the ring in half.','{a} is cut off from the corner, and the other side takes turns.','Chaos in the corner: the referee has three wrestlers on the apron and no idea who is legal.','{b} makes the tag and the whole building rises with them.'],
  limb:['arm','leg','knee','shoulder','neck'],
  mid:['{b} fights back and the two trade near-falls.','{b} cuts {a} off and slows the pace.','{b} rallies, and the momentum swings back and forth.','{b} survives a close call and fires up.','{b} catches {a} coming in and turns the tide.','Back and forth they go. Neither can keep the advantage.','{b} finds a second wind out of nowhere.'],
  near:['Cover by {b}! One, two... no! {a} kicks out!','{b} hooks the leg! One, two... {a} gets the shoulder up!','{a} goes for the finish, but {b} slips out the back!','#bigmove# from {b}! That has to be it... only a two count!','{a} thought that was three. So did I, {c}!','Shoulder up at two and nine-tenths!'],
  bigmove:['A huge clothesline','A spinning kick','A suplex out of nowhere','A dive to the floor','A knee to the jaw','A slam in the centre of the ring','A counter in mid-air'],
  late:['We are past the {mark}-minute mark and neither one will stay down.','{mark} minutes gone, and they are still throwing everything they have.','They have been at it for over {mark} minutes. Somebody has to break.'],
  q_great:['This is a classic in the making.','Remember where you were when you saw this one.','I have not seen many better than this, {p}.','They are going to be talking about this match for years.'],
  q_good:['What a match this has turned into.','These two are putting on a show.','This is why you buy a ticket.','Everything is clicking out there.'],
  q_ok:['Solid stuff from both sides.','Nothing fancy, but it is getting the job done.','A good, honest contest.','They are working hard out there.'],
  q_poor:['They are not on the same page tonight.','It has not really come together.','A few missed cues in this one, {p}.','This one is struggling to get going.'],
  q_bad:['This one is falling apart, and the crowd knows it.','I would like to say something nice. I am still thinking.','Let’s just say it is not their night.'],
  q_off:['Somebody is a step slow tonight, and it shows.','An off night for somebody in that ring.'],
  c_hot:['Listen to this crowd, {p}!','You can feel the building shaking.','They are on their feet already!','This place is electric.'],
  c_mid:['Let’s see what these two have got.','The crowd is waiting to be won over.','A decent buzz for this one.'],
  c_cold:['The fans are still finding their seats for this one.','It is quiet out here, {p}.','They are going to have to earn a reaction tonight.'],
  f_clean:['{w} hits {fin}! Cover! One, two, three!','{fin}! {w} hooks the leg... and that is it!','There it is, {fin}! One, two, three! {w} wins it!','{w} connects with {fin}. Nobody gets up from that. Three count!'],
  f_sub:['{w} locks it in the middle of the ring! {l} has nowhere to go! {l} is tapping!','{l} is fading in that hold... and the referee calls for the bell!','{w} cinches it in deep. {l} fights, fights... and taps!'],
  f_flash:['Roll-up out of nowhere! One, two, three! {w} steals it!','Small package! One, two, three! Where did that come from?','{w} counters into a cradle... and gets the three!'],
  f_cheap:['The referee did not see that! {w} with the cover... and gets the three!','A handful of tights! One, two, three! {w} gets away with it!','Feet on the ropes! The referee cannot see it! Three count!','Low blow behind the referee’s back, and {w} takes full advantage!'],
  f_interf:['Wait a minute, that is {x}! {l} is distracted, and {w} strikes from behind! One, two, three!','{x} is on the apron! {l} turns around... right into {fin}! It is over!','Here comes {x}! The referee is tied up, {l} goes down, and {w} makes the cover!'],
  f_foiled:['{x} is out here! But {w} sees it coming and sends {x} to the floor! {fin}! One, two, three!','{x} tries to get involved, and {w} wants none of it! There is {fin}, and there is the win!','Not tonight, {x}! {w} clears the ring and finishes it anyway!'],
  f_dq:['The referee has seen enough. He is calling for the bell!','{l} will not break! Four... five! That is a disqualification!','{l} has lost it completely, and the referee throws this one out!'],
  f_co:['...eight, nine, ten! {l} is counted out!','{l} cannot beat the count! This one is over!'],
  f_time:['There is the bell! We are out of time!','The time limit has expired! Neither could finish it!'],
  f_dco:['Both of them are down on the floor... nine, ten! Double count-out!','They are still brawling in the crowd, and the referee has counted them both out!'],
  r_clean:['Clean as a sheet. No excuses tonight.','You cannot argue with that one.','Decisive. That is how you make a statement.','{l} gave it everything. It was not enough.'],
  r_flash:['{l} never saw it coming.','Blink and you missed it.','It only takes three seconds, {p}.'],
  r_cheap:['A win is a win, {p}. Check the record book in the morning.','Smart, if you ask me.','{l} was robbed, and everybody in the building knows it.','Whatever it takes. That is {w} all over.'],
  r_interf:['{x} just cost {l} this match!','This is not over between {x} and {l}. Not even close.','{l} had it won until {x} showed up.'],
  r_foiled:['{x} came out here for nothing!','{w} had eyes in the back of the head tonight.'],
  r_dq:['{l} got disqualified, and I do not think {l} cares.','That is one way to keep from getting pinned.'],
  r_co:['Not the way anybody wanted this to end.','The crowd is letting them know what they think of that.'],
  r_draw:['Nothing settled tonight. They will have to do this again.','Five more minutes! That is what this crowd wants.'],
  br_start:['Eight in the ring and fists flying everywhere!','Everybody pairs off, and nobody is safe near those ropes.','It is every wrestler for themselves, {p}!','Bodies in every corner. Good luck keeping track of this one.'],
  br_elim:['{e} goes over the top and hits the floor! Gone!','{e} is dumped out! That is one fewer.','{e} hangs on... hangs on... no! Eliminated!','Three of them gang up on {e}. Over the top and out!','{e} never saw it coming. Over the top and out!','{e} skins the cat, climbs back up... and gets knocked right off the apron!'],
  br_two:['We are down to two: {w} and {l}!','Just {w} and {l} left, and both of them can barely stand.','It comes down to {l} and {w}. Listen to this place!'],
  br_final:['{l} charges, {w} ducks, and {l} goes over the top! {w} wins it!','{w} clotheslines {l} over the top rope! It is over!','{l} is teetering on the apron... and {w} knocks {l} to the floor! {w} has done it!'],
  newchamp:['We have a new champion! What a moment!','The title changes hands! Can you believe it?','A new era starts tonight!']
};
function sayPick(S,arr){
  var said=S.said||(S.said=[]),c=arr[0],i;
  for(i=0;i<5;i++){c=arr[Math.floor(rnd(S)*arr.length)];if(said.indexOf(hash(c))<0)break;}
  said.push(hash(c));if(said.length>90)said.shift();return c;
}
function expand(S,str,o,depth){
  if((depth||0)>4)return str;
  return fill(str.replace(/#(\w+)#/g,function(_,k){return GR[k]?expand(S,sayPick(S,GR[k]),o,(depth||0)+1):'';}),o);
}
function say(S,sym,o){var t=expand(S,'#'+sym+'#',o);return t.charAt(0).toUpperCase()+t.slice(1);}
var STIPLINE={tables:['A table is set up at ringside, and nobody is happy about it.','Somebody is going through a table tonight. The only question is who.'],lumber:['The lumberjacks line the ring and wait for somebody to roll out.','Nowhere to hide: the floor is full of angry colleagues.'],mask:['Everything they have built behind that mask is on the line tonight.','A mask is a promise. Tonight one of them breaks it.'],hair:['They have both put their hair on the line, and neither will step back.','Clippers are waiting at ringside for whoever loses.'],hardcore:['Chairs and tables come into play.','They have found a trash can, and it is not for recycling.','Weapons everywhere. The referee can only watch.'],ladder:['Both climb, and both crash off the ladder.','Somebody just went through a ladder. I felt that from here.','Fingertips on the prize... and the ladder goes over!'],cage:['The cage itself becomes a weapon.','Face first into the steel!','Nowhere to run inside that cage.'],sub:['Each hunts for the hold that ends it.','Hold, counter, hold. Somebody is going to have to give up.'],iron:['The falls go back and forth across the half hour.','Pacing is everything in a match like this, and they both know it.']};
var CHEAP=['{w} grabs a handful of tights to steal the pin on {l}.','{w} uses the ropes for leverage and pins {l}.','A low blow behind the referee’s back lets {w} pin {l}.'];
var REACT={Interview:['Say what you like about that, it got the people talking.','Confident. Maybe too confident.'],Promo:['Strong words. Now go and back them up.','That one is going to sting.'],Brawl:['Somebody get security out here!','They cannot keep these two apart.'],Ambush:['From behind! That is how you send a message.','No warning at all. That is how it is going to be, then.'],Challenge:['Now that is a match I want to see.','The champion did not look happy about that.'],Mystery:['Who would do this? Somebody in that locker room knows something.','I have a few names in mind, {p}, and I am keeping them to myself.'],Reveal:['I do not believe it. It was right in front of us the whole time!','Of all the people. Of all the people!'],'Face-off':['Feel this building shake. Sign that match!','Neither one blinked.'],Return:['Welcome back! This place has come unglued!','Look who it is!'],Save:['A helping hand, and maybe the start of something.','The cavalry has arrived.'],Turn:['Everything just changed.','I did not see that coming, and neither did they.'],'Mind games':['That is going to play on somebody’s mind all week.','Just watching. Just letting them know.'],'Contract signing':['Has a contract signing ever ended well?','Well, the table did not survive.'],Video:['When you see it all laid out like that, you understand why they hate each other.','That is the story so far. The ending is still to be written.'],Stakes:['The stakes just went through the roof.','No going back now.'],Betrayal:['Betrayed by a friend! I feel sick, {p}.','You think you know somebody.'],Attack:['That was not wrestling. That was an assault.','We need help out here!'],Announcement:['Mark your calendar. That one is going to be special.','It is official, and it is going to be a war.']};

function pop(ws){
  var o=avg(ws.map(function(w){return w.ovr;})),f=ws[0].align==='F';
  return o>=85?(f?'the roof comes off':'deafening boos'):(o>=65?(f?'a big cheer':'loud boos'):(o>=45?(f?'a decent hand':'some jeers'):'barely a reaction'));
}
function venueFor(S,P,cap){
  var c=pick(S,P.cities||['the city']);
  return c+' '+(cap<=1000?'Armory':(cap<=2500?'Civic Auditorium':(cap<=6000?'Fieldhouse':(cap<=13000?'Coliseum':(cap<=30000?'Arena':'Stadium')))));
}
function nth(n){return ['zero','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'][n]||(n+'th');}
function weeksAgo(S,w){var d=S.week-w;return d<=0?'earlier tonight':(d===1?'last week':d+' weeks ago');}

/* the announcers remember: each candidate line carries a salience score, and the best two make the air */
function memoryLines(S,P,x){
  var L=[],all=x.all,one=x.m.mt==='1v1',a=all[0],b=all[1];
  function add(s,t){L.push({s:s+rnd(S)*1.5,x:t});}
  if(one){
    var h=S.h2h&&S.h2h[rkey(a.id,b.id)];
    if(h&&h.n){
      var lw=h.lw>=0?S.w[h.lw].name:null,wa=a.id<b.id?h.a:h.b,wb=a.id<b.id?h.b:h.a;
      if(h.n>=3)add(7,'This is the '+nth(h.n+1)+' meeting between these two. '+(wa===wb?'They are dead level.':(wa>wb?a.name:b.name)+' leads the series '+Math.max(wa,wb)+' to '+Math.min(wa,wb)+'.'));
      else add(S.week-h.w<=6?8:6,'These two met '+weeksAgo(S,h.w)+(lw?', and '+lw+' got the win.':', and nobody could win it.'));
    }
  }
  if(x.feud&&x.feud.log.length>1){var lg=x.feud.log[x.feud.log.length-1];if(S.week-lg.w<=2)add(8,'Do not forget what happened '+weeksAgo(S,lg.w)+': '+lg.t+'.');}
  if(x.feud&&x.feud.stakes)add(9,'Remember the stakes tonight: '+x.feud.stakes.toLowerCase()+'.');
  all.forEach(function(w){
    if(w.lt&&w.lt.w<S.week&&S.week-w.lt.w<=8)add(x.t&&x.t.id===w.lt.id?9.5:7,w.name+' lost the '+w.lt.n+' '+weeksAgo(S,w.lt.w)+(x.t&&x.t.id===w.lt.id?' and wants it back tonight.':' and has had a point to prove ever since.'));
    if(w.tw&&S.week-w.tw<=4)add(7,w.align==='H'?'Not long ago these fans cheered '+w.name+'. Listen to them now.':'It was not long ago they booed '+w.name+' out of the building. What a change.');
    if(w.rw&&S.week-w.rw<=2)add(7.5,'This is '+w.name+'’s first match back from injury.');
    if(w.deb)add(8.5,'This is the first time we have seen '+w.name+' in a '+P.name+' ring.');
    if(x.pre[w.id]>=4)add(6+Math.min(3,x.pre[w.id]/4),w.name+' has won '+x.pre[w.id]+' in a row coming in.');
    else if(x.pre[w.id]<=-3)add(5.5,w.name+' has dropped '+(-x.pre[w.id])+' straight and badly needs this one.');
    if(S.mystery&&S.mystery.v===w.id)add(6.5,'Still no answers on who attacked '+w.name+'.');
  });
  if(x.t&&x.champ&&!x.change){
    if(x.t.defs>=2)add(5.5,'This is title defence number '+(x.t.defs+1)+' for '+names(x.champ)+'.');
    if(S.week-x.t.since>=12)add(6,names(x.champ)+' '+(x.champ.length>1?'have':'has')+' held that title for '+(S.week-x.t.since)+' weeks.');
  }
  if(x.m.mt==='tag')x.sides.forEach(function(s){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;if(tm&&tm.exp>=70)add(4,names(s)+' have been together a long time. Watch the timing.');else if(!tm)add(4,names(s)+' have barely teamed before tonight.');});
  if(x.gap>25&&one)add(5,'On paper this is a mismatch. '+x.under+' has it all to do.');
  L.sort(function(p,q){return q.s-p.s;});
  return L.slice(0,2).map(function(l){return l.x;});
}
function callMatch(S,P,x){
  var bc=[],o=x.o,first=function(n){return String(n).split(' ')[0];};
  o.p=first(P.ann[0]);o.c=first(P.ann[1]);o.mark=x.mins>=27?'twenty-five':'fifteen';
  function ring(t){bc.push({t:'ring',x:fill(t,o)});}
  function pbp(sym){bc.push({t:'pbp',x:say(S,sym,o)});}
  function col(sym){bc.push({t:'col',x:say(S,sym,o)});}
  function raw(who,t){bc.push({t:who,x:fill(t,o)});}
  if(x.m.mt==='br'){
    var outs=x.all.filter(function(w){return w.name!==o.w&&w.name!==o.l;}).sort(function(p,q){return p.ovr-q.ovr;});
    ring('This is an over-the-top-rope battle royal'+(x.t?' for the vacant '+x.t.name:'')+'! The last one left in the ring wins.');
    bc.push({t:'ent',x:'The ring fills up: '+names(x.all)+'.'});
    raw('pbp',say(S,'bell',o)+' '+say(S,'br_start',o));
    outs.forEach(function(w,k){if(k<2||k>=outs.length-2||k===3){o.e=w.name;pbp('br_elim');}});
    col(x.MQ>=75?'q_good':(x.MQ>=55?'q_ok':'q_poor'));
    pbp('br_two');pbp('br_final');col('r_clean');
    ring('Here is your winner'+(x.t?', and NEW '+x.t.name+' champion':'')+': {w}!');
    if(x.change)pbp('newchamp');
    return bc;
  }
  ring('This '+x.mt.toLowerCase()+' match is scheduled for one fall'+(x.stipName?', and it is a '+x.stipName.toLowerCase()+' match':'')+(x.t?'. It is for the '+x.t.name+'!':'.'));
  x.sides.forEach(function(s,k){
    var isCh=x.champ&&x.champ===s,lead=s[0],big=avg(s.map(function(w){return w.ovr;}))>=62||isCh;
    ring((k===0?'Introducing first, ':(k===x.sides.length-1?'And the opponent'+(s.length>1?'s':'')+', ':'Next, '))+(isCh?'the '+x.t.name+' champion'+(s.length>1?'s':'')+', ':'')+names(s)+'!');
    bc.push({t:'ent',x:big?names(s)+' '+(s.length>1?'make their way out together':ENTR[lead.align==='F'?'F':'H'][lead.ent||0])+(isCh?', the title held high':'')+'. The reaction: '+pop(s)+'.':'The reaction: '+pop(s)+'.'});
  });
  var mem=memoryLines(S,P,x);
  if(mem[0])raw('col',mem[0]);
  else if(x.feud&&x.feud.kind==='dream')raw('col','This is the match everybody has been asking for, {p}.');
  else if(x.feud&&x.feudHeat>=60)raw('col','This has been building for weeks, {p}. Tonight somebody pays.');
  else if(x.t)raw('col','Championship gold on the line. Nobody holds anything back tonight.');
  else col(x.CR>=80?'c_hot':(x.CR>=55?'c_mid':'c_cold'));
  var mk=x.m.mt==='4way'||x.m.mt==='3way'?'multi':(x.m.mt==='6man'?'six':null);
  raw('pbp',say(S,'bell',o)+' '+say(S,mk?'open_'+mk:(GR['open_'+x.ca.style]?'open_'+x.ca.style:'open_A'),o));
  if(mem[1])raw('pbp',mem[1]);
  if(STIPLINE[x.stip])raw('pbp',sayPick(S,STIPLINE[x.stip]));
  if(x.mins>8){pbp(mk?'mid_'+mk:'mid');pbp('near');}
  if(x.mins>=20)pbp('late');
  col(x.bad?'q_off':(x.MQ>=88?'q_great':(x.MQ>=75?'q_good':(x.MQ>=60?'q_ok':(x.MQ>=45?'q_poor':'q_bad')))));
  if(x.mins>=14&&x.CR>=82)col('c_hot');
  // when the company model's bonus or penalty fired, the crowd sounds like that company's crowd
  var mf=(x.fx||[]).filter(function(q){return q.m;});
  if(mf.length&&MODEL_CROWD[P.model||'classic']){var cl=MODEL_CROWD[P.model||'classic'][mf[0].s>0?0:1];if(cl&&cl.length)raw('col',sayPick(S,cl));}
  var f=x.fin;
  if(f==='clean'){pbp(x.sub?'f_sub':'f_clean');col('r_clean');}
  else if(f==='flash'){pbp('f_flash');col('r_flash');}
  else if(f==='cheap'){pbp('f_cheap');col('r_cheap');}
  else if(f==='interf'){pbp('f_interf');col('r_interf');}
  else if(f==='foiled'){pbp('f_foiled');col('r_foiled');}
  else if(f==='dq'){pbp('f_dq');col('r_dq');}
  else if(f==='co'){pbp('f_co');col('r_co');}
  else{pbp(x.mins>=20?'f_time':'f_dco');col('r_draw');}
  if(x.win<0)ring('This match is a draw.');
  else ring('Here '+(x.plural?'are your winners':'is your winner')+(f==='dq'?' by disqualification':(f==='co'?' by count-out':''))+(x.change?', and NEW '+x.t.name+' champion'+(x.plural?'s':''):(x.t&&x.retain?', and STILL '+x.t.name+' champion'+(x.plural?'s':''):''))+': {w}!');
  if(x.change)pbp('newchamp');
  return bc;
}

/* Who wins? Unless the booker spends booking power to call it, the match is decided by the odds:
   overness, work rate, momentum, condition, the champion's advantage, traits, feud story logic and the house style. */
function winOdds(S,P,show,m,sides,t,champSide,feud,big,isMain){
  var st=P.style||'stars',T=st==='drama'?10:7.5,MD=modelOf(P);
  var sc=sides.map(function(s,k){
    var v=avg(s.map(function(w){
      var x=0.45*w.ovr+0.2*workRate(w)+1.2*w.mom+(w.cond-70)*0.05+(w.ws>=4?2:0)-Math.min(18,Math.max(0,w.ws-7)*0.6);
      if(st==='stars')x+=0.15*w.ovr;else if(st==='merit')x+=0.15*workRate(w)+0.6*w.mom;
      else if(st==='heroes')x+=w.align==='F'?(big?5:0):(big?0:2.5);
      if(MD.push)x+=clamp(MD.push(w,P,S),-4,4);
      if(has(w,'aura'))x+=2;if(big&&has(w,'bigmatch'))x+=2;if(isMain&&has(w,'closer'))x+=1;
      if(w.fav)x+=3;
      return x;
    }));
    if(k===champSide)v+=5-Math.min(6,(t?t.defs:0)*0.6);
    if(feud){var heel=s[0].align==='H',end=big&&feud.heat>=60;v+=st==='drama'?(end?(heel?-4:4):(heel?4:-2)):(end?(heel?-2:2):(heel?1.5:0));}
    if(m.mt==='tag'&&s[0].team!=null&&s[0].team===s[1].team){var tm=teamOf(S,s[0]);if(tm)v+=tm.exp/40;}
    return v;
  });
  var mx=Math.max.apply(null,sc);
  sides.forEach(function(s,k){if(sc[k]<mx-6&&s.some(function(w){return has(w,'giant');}))sc[k]+=3;});
  var ex=sc.map(function(v){return Math.exp((v-mx)/T);}),tot=0;ex.forEach(function(e){tot+=e;});
  var draw=sides.length>2?0:(t?0.01:0.03);
  return {p:ex.map(function(e){return e/tot*(1-draw);}),draw:draw};
}
function doMatch(S,P,show,m,i,n,rep,used){
  var isPl=P.id===S.player&&!S.cal,big=!!show.big,isMain=i===n-1;
  var sides=m.sides.map(function(ids){return ids.map(function(id){return S.w[id];});}),all=flat(sides);
  var stip=STIP[m.stip]?m.stip:'std',mins=Math.max(4,(stip==='iron'?30:(LEN[m.len]||12))+(big?4:0)+(isMain?3:0)+noteMins(m));
  var t=m.title?titleById(P,m.title):null,champSide=-1;
  if(t&&!titleFits(t,m))t=null;
  if(t&&t.holders.length){m.sides.forEach(function(s,k){if(t.holders.every(function(h){return s.indexOf(h)>=0;}))champSide=k;});if(champSide<0)t=null;}
  var feud=null,x,y,a,b,br=m.mt==='br';
  for(x=0;x<sides.length&&!feud;x++)for(y=x+1;y<sides.length&&!feud;y++)for(a=0;a<sides[x].length&&!feud;a++)for(b=0;b<sides[y].length&&!feud;b++)feud=feudOf(S,sides[x][a].id,sides[y][b].id);
  var fx=[],FX=function(good,text){fx.push({s:good?1:-1,x:text});};
  var ctx={rep:rep,S:S,P:P,show:show,m:m,sides:sides,all:all,stip:stip,mins:mins,t:t,feud:feud,isMain:isMain,big:big,isPl:isPl,i:i,n:n,rep:rep,fx:fx,champSide:champSide};
  var pre={};all.forEach(function(w){pre[w.id]=w.ws;});
  // effort and performance
  var effs=[],perfs=[],bad=false;
  all.forEach(function(w){
    var e=78+(w.morale-60)*0.25+(w.cond-70)*0.2+(isMain?6:(i===0?-2:0))+(big?6:0)+w.mom*0.8+(rnd(S)*2-1)*(5+(100-w.cons)*0.15);
    EFX.forEach(function(fn){e+=fn(ctx,w)||0;});
    if(chance(S,clamp(0.045-w.cons*0.0004,0.005,0.04))){e-=25;bad=true;}
    e=clamp(e,30,100);effs.push(e);perfs.push(workOf(w,stip,mins)*(0.72+0.28*e/100));
    if(mins>6+w.stam*0.25+3)FX(false,w.name+' ran out of gas');
    if(w.cond<45)FX(false,w.name+' came in worn down');
  });
  var q=0.55*avg(perfs)+0.45*Math.max.apply(null,perfs),cs=[];
  for(x=0;x<sides.length;x++)for(y=x+1;y<sides.length;y++)sides[x].forEach(function(p){sides[y].forEach(function(o){cs.push(chem(S,p.id,o.id));});});
  var c=avg(cs)*(m.mt==='1v1'?1:0.6),tb=clamp((mins-12)*0.3,-3,4)*clamp((q-55)/30,-1,1),tx=0;
  if(m.mt==='tag')sides.forEach(function(s){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;tx+=tm?tm.exp/50+(tm.chem||0)*0.3:-1.5;});
  if(c>=2.2)FX(true,'Great chemistry between them');else if(c<=-2.2)FX(false,'No chemistry between them');
  if(tb>=2)FX(true,'Given time to tell a story');else if(tb<=-1.5)FX(false,mins<12?'Too short for workers this good':'Went too long for what they can do');
  if(tx>=2.4)FX(true,'Polished teamwork');else if(tx<=-1.5)FX(false,'Thrown-together team');
  var mq=q+c+tb+tx;
  MQX.forEach(function(fn){var r=fn(ctx);if(r){mq+=r.d;if(r.x)FX(r.d>=0,r.x);}});
  var MQ=clamp(mq,5,99);ctx.MQ=MQ;
  // crowd reaction
  var ov=all.map(function(w){return w.ovr;}),mavg=avg(all.map(function(w){return w.mom;})),cr=0.6*avg(ov)+0.4*Math.max.apply(null,ov)+mavg*0.6+(avg(all.map(function(w){return w.cha;}))-65)*0.06;
  if(mavg>=3.5)FX(true,'Hot momentum coming in');else if(mavg<=-3.5)FX(false,'Cold momentum coming in');
  if(m.mt==='1v1'){
    var d=Math.abs(ov[0]-ov[1]);if(d>25&&mins>7){cr-=(d-25)*0.3;FX(false,'A mismatch that dragged on');}
    if(all[0].twn||all[1].twn){cr+=0.5;}
    else if(all[0].align!==all[1].align){cr+=2;FX(true,'Clear face against heel');}else{cr-=3;FX(false,all[0].align==='F'?'Nobody to boo':'Nobody to cheer');}
  }else if(m.mt==='tag'||m.mt==='6man')cr+=sides[0][0].align!==sides[1][0].align?1.5:-2;
  else if(br){cr+=2;FX(true,'A ring full of bodies: the crowd loves a battle royal');}
  if(feud){
    var stale=clamp(1-0.15*Math.max(0,feud.matches-2),0.3,1),fb=Math.min(11,feud.heat*0.11)*stale*(feud.kind==='dream'?1.2:1);cr+=fb;
    if(stale<0.6)FX(false,'This feud has been to the well too often');else if(fb>=6)FX(true,'Red-hot feud');else if(fb>=2.5)FX(true,'The feud adds heat');
  }
  if(t){cr+=t.prestige*0.04;if(t.prestige>=70)FX(true,'A prestigious title on the line');if(show.rule==='all_titles'){cr+=2;FX(true,'Every title is on the line tonight');}}
  var rsk=RISK_STIP[P.risk]/RISK_STIP[P.risk0],sh=STIP[stip].heat*(feud&&feud.heat>=40?1.5:0.3)*rsk;cr+=sh;
  if(stip!=='std'){if(feud&&feud.heat>=40)FX(true,'The stipulation fits the feud');if(rep.gim&&show.rule!=='gimmick_free'&&!modelOf(P).gimFree){cr-=4;FX(false,'Second gimmick match of the night');}rep.gim=true;}
  all.forEach(function(w){if(w.ws>=6){cr+=1.5;FX(true,w.name+'’s winning streak draws interest');}if(used[w.id]){cr-=4;FX(false,w.name+' already worked tonight');}});
  if(m.mt==='1v1'){var rk=S.recent[P.id+':'+rkey(all[0].id,all[1].id)];if(rk&&S.week-rk<4&&!feud){cr-=4;FX(false,'A rematch too soon');}}
  if(rep.energy){cr+=rep.energy;if(rep.energy>=1)FX(true,'A packed, noisy house');else if(rep.energy<=-1)FX(false,'Empty seats flattened the crowd');}
  CRX.forEach(function(fn){var r=fn(ctx);if(r){cr+=r.d;if(r.x)FX(r.d>=0,r.x);}});
  var CR=clamp(cr,5,100);
  // finish: you pick the winner, the story decides how
  var od=winOdds(S,P,show,m,sides,t,champSide,feud,big,isMain),called=m.call!=null&&m.call>=-1&&m.call<sides.length,win,fin='clean',runin=null,winners=[],losers=[];
  if(called)win=m.call;
  else{var roll=rnd(S);if(roll<od.draw)win=-1;else{roll-=od.draw;win=sides.length-1;for(x=0;x<sides.length;x++){roll-=od.p[x];if(roll<=0){win=x;break;}}}}
  if(m.nc)win=-1;
  var ccNote=null;
  if(isPl&&!called&&win>=0&&!m.nc){var ccx=ccRefusal(S,sides,win,t,champSide);if(ccx){win=ccx.side;ccNote=ccx.w.name;}}
  if(!(win>=0&&win<sides.length)){win=-1;fin='draw';}
  else{
    winners=sides[win];losers=flat(sides.filter(function(s,k){return k!==win;}));
    var heelWin=winners[0].align==='H';
    if(isPl&&!br)all.forEach(function(p){feudsFor(S,p.id).forEach(function(f){
      if(runin||f.kind==='dream')return;
      var rs=(f.a.indexOf(p.id)>=0?f.b:f.a).map(function(id){return S.w[id];}).filter(function(r){return all.indexOf(r)<0&&r.inj<=0&&r.promo===P.id&&!(r.away>=S.week);});
      rs=rs.concat(stableMates(S,rs,all));
      if(rs.length&&chance(S,0.10+f.heat/400+(rs.length>1?0.06:0)))runin={r:pick(S,rs),p:p,f:f};
    });});
    if(br)fin='clean';
    else if(m.ff&&FIN[m.ff])fin=m.ff;
    else if(howOf(S,m,isPl))fin=howOf(S,m,isPl);
    else if(runin)fin=losers.indexOf(runin.p)>=0?'interf':'foiled';
    else if(feud&&feud.stakes&&/disqual/i.test(feud.stakes))fin=heelWin&&chance(S,0.4)?'cheap':'clean';
    else if(heelWin&&chance(S,0.3+(hasMouthpiece(S,winners[0])?0.15:0)))fin='cheap';
    else if(!t&&!heelWin&&losers[0].align==='H'&&chance(S,0.07))fin='dq';
    else if(!t&&chance(S,0.03))fin='co';
    else if(!heelWin&&chance(S,0.08))fin='flash';
    if(fin!=='interf'&&fin!=='foiled')runin=null;
  }
  if(isPl&&!m.ff&&(fin==='cheap'||fin==='dq'||fin==='co')&&hasRule(S,'clean'))fin='clean';
  var fr=FIN[fin].r-((fin==='dq'||fin==='co')&&isMain?3:0);
  if(fin==='draw'&&mins>=20&&MQ>=80)fr=0;
  FINX.forEach(function(fn){var r=fn(ctx,fin,winners,losers,win);if(r){fr+=r.d;if(r.x)FX(r.d>=0,r.x);}});
  if(fin==='dq'||fin==='co')FX(false,'A non-finish annoyed the crowd');else if(fin==='foiled')FX(true,'The crowd loved seeing the run-in fail');else if(fin==='draw'&&fr<0)FX(false,'No winner');
  if(bad)FX(false,'Somebody had an off night');
  var ea=avg(effs);if(ea>=92)FX(true,'Everybody worked hard');else if(ea<70)FX(false,'Low effort: morale or fatigue');
  var OV=clamp(Math.round(P.wq*MQ+(1-P.wq)*CR+fr+(rnd(S)*4-2)-(bad?6:0)),5,99);
  var seg={k:'match',label:br?all.map(function(w){return w.name;}).join(', '):vsLabel(sides),mt:MT[m.mt].n,stip:stip==='std'?null:STIP[stip].n,title:t?t.name:null,mins:mins,mq:Math.round(MQ),cr:Math.round(CR),eff:Math.round(ea),ov:OV,lines:[],finish:'',notes:[],win:win>=0?names(winners):null,fin:fin,fx:fx,ids:all.map(function(w){return w.id;}),odds:od.p.map(function(p){return Math.round(p*100);}),called:called,sidesN:sides.map(names)};
  // bookkeeping
  all.forEach(function(w){w.lu=S.week;used[w.id]=(used[w.id]||0)+1;w.cond=clamp(w.cond-mins*0.45*(STIP[stip].inj>1.5?1.35:1),5,100);});
  if(m.mt==='1v1')S.recent[P.id+':'+rkey(all[0].id,all[1].id)]=S.week;
  var F=FIN[fin],qb=function(w){return clamp((OV-w.ovr)/90,-0.15,0.5);},upset=false,endedStreak=0,wAvg=0,lAvg=0;
  if(win>=0){
    wAvg=avg(winners.map(function(w){return w.ovr;}));lAvg=avg(losers.map(function(w){return w.ovr;}));
    upset=lAvg-wAvg>=15&&fin!=='dq'&&fin!=='co';
    losers.forEach(function(w){
      if(br){addOvr(P,w,qb(w));return;}
      if(w.ws>=6&&fin!=='dq'&&fin!=='co')endedStreak=Math.max(endedStreak,w.ws);
      addOvr(P,w,-0.4*clamp(1+(w.ovr-wAvg)/35,0.2,2.5)*F.lg*(big?1.3:1)+qb(w));
      w.losses++;w.ws=w.ws<0?w.ws-1:-1;w.mom=clamp(w.mom-1,-10,10);w.morale=clamp(w.morale-(F.lg>=1?1.2:0.5),0,100);
    });
    winners.forEach(function(w){
      addOvr(P,w,0.5*clamp(1+(lAvg-w.ovr)/35,0.2,2.5)*F.wg*(big?1.5:1)*(isMain?1.2:1)+qb(w)+(endedStreak?1.5:0));
      w.wins++;w.ws=w.ws>0?w.ws+1:1;w.mom=clamp(w.mom+1+(big?1:0)+(upset?2:0)+(endedStreak?2:0),-10,10);w.morale=clamp(w.morale+1.5,0,100);
      if(isPl&&w.ws>=10)award(S,'ACH_STREAK');
    });
  }else all.forEach(function(w){addOvr(P,w,qb(w));});
  // title
  var champ=t&&champSide>=0?sides[champSide]:null;
  if(t){
    t.last=S.week;t.prestige=clamp(t.prestige+(OV-t.prestige)*0.08,10,100);
    if(win>=0&&win!==champSide&&fin!=='dq'&&fin!=='co'){
      var had=t.holders.length;
      t.holders.forEach(function(id){S.w[id].lt={n:t.name,id:t.id,w:S.week};});
      t.holders=m.sides[win].slice();t.since=S.week;t.defs=0;seg.change=true;seg.crown=!had;
      winners.forEach(function(w){w.mom=clamp(w.mom+2,-10,10);w.morale=clamp(w.morale+6,0,100);w.lt=null;});
      news(S,'title',names(winners)+(had?' won the ':' won the vacant ')+P.name+' '+t.name+'.');
      seg.notes.push('New champion'+(t.tag?'s':'')+': '+names(winners)+'.');
      if(isPl)award(S,had?'ACH_TITLE_CHANGE':'ACH_CROWN');
    }else{t.defs++;if(win>=0&&champSide>=0)seg.notes.push(names(sides[champSide])+' retain'+(sides[champSide].length>1?'':'s')+'.');}
  }
  // each wrestler keeps their last five results for the profile pop-up
  if(!S.cal&&!br&&win>=0)all.forEach(function(w){
    var mine=winners.indexOf(w)>=0,own=sides.filter(function(sd){return sd.indexOf(w)>=0;})[0]||[],foe=all.filter(function(o){return own.indexOf(o)<0;}).map(function(o){return o.name;}).join(' & ');
    var L=w.rr||(w.rr=[]);L.unshift({w:S.week,r:mine?'W':'L',v:foe.slice(0,40),ov:OV});if(L.length>5)L.length=5;
  });
  // injuries, growth, tag experience
  var injm=RISK_INJ[P.risk]/RISK_INJ[P.risk0]*(isPl?dif(S).inj:1)*(modelOf(P).inj||1)*(isPl&&hasRule(S,'testing')?0.88:1);
  all.forEach(function(w,ix){
    var osafe=avg(all.filter(function(o){return o!==w;}).map(function(o){return o.safe;}));
    if(!S.cal&&chance(S,0.006*STIP[stip].inj*injm*(1+(mins-12)/40)*(w.cond<45?1.8:1)*(m.hurt===w.id?5:1)*(1.6-w.dur*0.012)*(1.5-osafe/100)*hurtRisk(S,P,w,m))){
      var hz=hurtZone(S,w),zz=zonesOf(w),chronic=zz[hz]>=85;
      w.inj=Math.max(1,Math.round(ri(S,2,ri(S,4,16))*(1.3-w.dur/200)*ZONES[hz].len*MED_L[P.med||0]*(chronic?1.8:1)));w.iz=hz;zz[hz]=Math.min(100,zz[hz]+12);if(chronic)w.dur=Math.max(15,w.dur-3);
      if(w.inj>=6)mile(S,w,'injury','Injured at '+show.name+' ('+ZONES[hz].n.toLowerCase()+'), out '+w.inj+' weeks');seg.notes.push(w.name+' is hurt ('+ZONES[hz].n.toLowerCase()+') and will miss about '+w.inj+' weeks.'+(chronic?' That had been coming for a while.':''));
      news(S,'injury',w.name+' ('+P.name+') is injured ('+ZONES[hz].n.toLowerCase()+'): out about '+w.inj+' weeks.');
      if(w.inj>=8)vacateFor(S,P,w,'injury');
    }
    if(workRate(w)<w.pot){w.xp+=0.06+(Math.max.apply(null,perfs)>perfs[ix]?0.1:0)+(big?0.05:0);if(w.xp>=1){w.xp-=1;w.brawl=Math.min(99,w.brawl+1);w.tech=Math.min(99,w.tech+1);w.speed=Math.min(99,w.speed+1);if(isPl)seg.notes.push(w.name+' is improving in the ring.');}}
  });
  if(m.mt==='tag')sides.forEach(function(s,k){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;if(tm){tm.exp=Math.min(100,tm.exp+2+(k===win?1:0));tm.ls=(win>=0&&k!==win)?tm.ls+1:0;if(win>=0){if(k===win)tm.w=(tm.w|0)+1;else tm.l=(tm.l|0)+1;}}});
  // feud progress
  var feudMsg=null,heatWas=feud?feud.heat:0;
  if(feud){
    feud.matches++;
    if(win>=0){if(m.sides[win].some(function(id){return feud.a.indexOf(id)>=0;}))feud.aw++;else if(m.sides[win].some(function(id){return feud.b.indexOf(id)>=0;}))feud.bw++;}
    heatUp(S,feud,5+(fin==='cheap'||fin==='interf'?5:0),(win>=0?names(winners)+' beat '+names(losers):'A draw')+(fin==='cheap'||fin==='interf'?' with a cheap finish':'')+' at '+show.name);
    if(win>=0&&(big||stip!=='std')&&feud.heat>=(show.rule==='no_turning_back'?45:60)&&fin!=='dq'&&fin!=='co')feudMsg=settleFeud(S,P,show,feud,winners,losers,isPl);
  }
  if(S.cal)return seg;
  // report text
  var lead=win>=0?winners[0]:sides[0][0],other=win>=0?losers.slice().sort(function(p,o){return br?o.ovr-p.ovr:p.ovr-o.ovr;})[0]:sides[1][0];
  var ca=chance(S,0.55)?other:lead,cb=ca===lead?other:lead,o={a:ca.name,b:cb.name,w:names(winners),l:other.name,x:runin?runin.r.name:'',fin:(m.mt==='tag'&&win>=0&&teamFin(S,winners))||(lead.fin?'the '+lead.fin:'the finish')};
  if(isPl){
    var mk=m.mt==='4way'||m.mt==='3way'?'multi':(m.mt==='6man'?'six':null);   // matches with more than two people read differently from singles
    seg.lines.push(say(S,mk?'open_'+mk:(GR['open_'+ca.style]?'open_'+ca.style:'open_A'),o));
    if(STIPLINE[stip])seg.lines.push(STIPLINE[stip][0]);
    if(mins>8)seg.lines.push(say(S,mk?'mid_'+mk:'mid',o));
    seg.lines.push((MQ>=88?'This is something special. ':(MQ>=75?'A very good match. ':(MQ>=60?'Solid work. ':(MQ>=45?'It never finds a rhythm. ':'It falls apart in places. '))))+(CR>=88?'The crowd is molten.':(CR>=72?'The crowd is loud throughout.':(CR>=55?'The crowd is into it.':(CR>=40?'The crowd is polite but quiet.':'The crowd sits on its hands.')))));
  }
  seg.finish=fill(br?'{w} throws {l} over the top rope and is the last one standing.':fin==='clean'?(lead.style==='T'||stip==='sub'?'{w} forces {l} to submit clean in the middle of the ring.':stip==='tables'?'{w} drives {l} through a table for the win.':stip==='mask'?'{w} wins, and {l} has to take off the mask.':stip==='hair'?'{w} wins, and the clippers come out for {l}.':'{w} hits {fin} and pins {l} clean.'):
    fin==='flash'?'{w} catches {l} in a roll-up out of nowhere.':
    fin==='cheap'?pick(S,CHEAP):
    fin==='interf'?'{x} runs in and distracts {l}; {w} takes advantage for the win.':
    fin==='foiled'?'{x} tries to interfere, but {w} fights it off and wins anyway.':
    fin==='dq'?'{l} is disqualified for ignoring the referee; {w} wins by DQ.':
    fin==='co'?'{l} is counted out on the floor; {w} wins by count-out.':
    (mins>=20?'The time limit expires with neither able to put the other away.':'Both are counted out brawling on the floor.'),o);
  if(isPl){
    var srt=all.slice().sort(function(p,q){return p.ovr-q.ovr;});
    seg.bc=callMatch(S,P,{fx:fx,o:o,m:m,all:all,pre:pre,champ:champ,mt:MT[m.mt].n,stip:stip,stipName:stip==='std'?null:STIP[stip].n,t:t,sides:sides,feud:feud,feudHeat:heatWas,gap:srt[srt.length-1].ovr-srt[0].ovr,under:srt[0].name,CR:CR,MQ:MQ,mins:mins,ca:ca,bad:bad,fin:fin,sub:lead.style==='T'||stip==='sub',win:win,plural:winners.length>1,change:!!seg.change,retain:win>=0&&win===champSide,entrance:ctx.entrance});
    if(m.mt==='1v1'){var hk=rkey(all[0].id,all[1].id),hh=(S.h2h||(S.h2h={}))[hk]||(S.h2h[hk]={n:0,a:0,b:0,lw:-1,w:0});hh.n++;hh.w=S.week;hh.lw=win>=0?winners[0].id:-1;if(win>=0){if(winners[0].id===Math.min(all[0].id,all[1].id))hh.a++;else hh.b++;}}
    all.forEach(function(w){w.deb=false;});
  }
  if(ccNote)seg.notes.push(ccNote+' used creative control and would not take the loss.');
  if(upset)seg.notes.push('Upset: '+names(winners)+' beat a much bigger name.');
  if(endedStreak)seg.notes.push('The winning streak ends at '+endedStreak+'.');
  if(feudMsg)seg.notes.push(feudMsg);
  ctx.res={win:win,winners:winners,losers:losers,fin:fin,OV:OV,MQ:MQ,CR:CR,seg:seg,upset:upset,endedStreak:endedStreak,pre:pre};
  if(isPl){
    S.stats.matches++;if(OV>S.stats.bestMatch)S.stats.bestMatch=OV;
    if(OV>=90)award(S,'ACH_MATCH_90');if(OV>=97)award(S,'ACH_MATCH_97');
    if(win>=0&&lAvg-wAvg>=20&&fin!=='dq'&&fin!=='co')award(S,'ACH_UPSET');
    if(endedStreak)award(S,'ACH_STREAK_END');
    matchQuests(S,P,show,m,sides,win,t,OV,isMain,seg);
    if(win>=0)afterBell(S,P,show,m,sides,win,winners,losers,fin,runin,feud,t,OV,seg);
  }
  POST.forEach(function(fn){fn(ctx);});
  if(isPl)seg.notes.forEach(function(nt){if(!/^New champion|retains?\.$/.test(nt))seg.bc.push({t:'note',x:nt});});
  return seg;
}
function settleFeud(S,P,show,feud,winners,losers,isPl){
  feud.res=true;feud.end=S.week;
  var full=feud.twist&&feud.finale;
  winners.forEach(function(w){addOvr(P,w,full?3.5:2.5);w.mom=clamp(w.mom+2,-10,10);});losers.forEach(function(w){addOvr(P,w,full?1.5:1);});
  var msg='The feud between '+feudLabel(S,feud)+' is settled'+(full?' after a full story, start to finish':'')+'. Both come out of it bigger stars.';
  if(feud.stakes&&/sits out/i.test(feud.stakes)){losers.forEach(function(w){w.away=S.week+4;});msg+=' As agreed, '+names(losers)+' will sit out the next four weeks.';}
  else if(feud.stakes&&/title shot/i.test(feud.stakes)){
    var w0=winners[0],tt=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w0.g&&x.holders.length&&x.holders[0]!==w0.id&&(!x.brand||x.brand===w0.brand)&&(!tt||x.lvl>tt.lvl))tt=x;});
    if(tt&&holdLvl(P,w0.id)===0&&startFeud(S,P,w0,S.w[tt.holders[0]],40,w0.name+' earned a shot at the '+tt.name,{title:tt.id,force:true}))msg+=' '+w0.name+' has earned a shot at the '+tt.name+'.';
  }
  news(S,'story','Feud settled: '+names(winners)+' beat '+names(losers)+' at '+show.name+'.');
  if(isPl){S.stats.feudsDone++;award(S,'ACH_BLOWOFF');if(S.stats.feudsDone>=5)award(S,'ACH_FEUDS_5');}
  return msg;
}
function vacateFor(S,P,w,why,quiet){P.titles.forEach(function(t){if(t.holders.indexOf(w.id)>=0){t.holders=[];t.since=S.week;if(!quiet)news(S,'title','The '+P.name+' '+t.name+' '+(t.tag?'are':'is')+' vacated ('+w.name+': '+why+').');}});}

function afterBell(S,P,show,m,sides,win,winners,losers,fin,runin,feud,t,OV,seg){
  if(runin){
    if(fin==='interf'){heatUp(S,runin.f,8,runin.r.name+' cost '+runin.p.name+' a match');seg.notes.push(runin.r.name+' stands over '+runin.p.name+' after the bell. This is getting personal.');}
    else{heatUp(S,runin.f,5,runin.p.name+' fought off '+runin.r.name);seg.notes.push(runin.p.name+' sends '+runin.r.name+' packing.');}
    return;
  }
  // a losing team implodes
  if(m.mt==='tag'){
    var ls=sides[win===0?1:0],tm=(ls[0].team!=null&&ls[0].team===ls[1].team)?teamOf(S,ls[0]):null;
    if(tm&&(tm.ls>=2||tm.exp<25||show.rule==='betrayal')&&chance(S,show.rule==='betrayal'?0.28:0.14)){
      var att=chance(S,0.5)?ls[0]:ls[1],vic=att===ls[0]?ls[1]:ls[0];
      P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(att.id)>=0){tt.holders=[];tt.since=S.week;news(S,'title','The '+P.name+' '+tt.name+' are vacated after the champions split.');}});
      dissolveTeam(S,tm);
      if(att.align==='F')turn(S,att,'turned on '+vic.name);else if(vic.align==='H')turn(S,vic,'betrayed by '+att.name);
      startFeud(S,P,vic,att,55,att.name+' turned on partner '+vic.name,{force:true});memBetray(S,att,vic);
      seg.notes.push('After the loss, '+att.name+' turns on '+vic.name+'. The team is finished.');
      award(S,'ACH_BETRAYAL');return;
    }
  }
  var w0=winners[0],l0=losers[0];
  if(m.mt==='1v1'&&l0.align==='F'&&l0.ws<=-4&&chance(S,0.15)){
    turn(S,l0,'snapped after another loss');startFeud(S,P,w0,l0,40,l0.name+' attacked '+w0.name+' after losing again');
    l0.mom=clamp(l0.mom+3,-10,10);
    seg.notes.push(l0.name+' snaps after another loss and lays out '+w0.name+'. That is a heel turn.');return;
  }
  if(feud&&!feud.res&&l0.align==='H'&&chance(S,0.4)){
    heatUp(S,feud,7,l0.name+' attacked '+w0.name+' after the bell');
    var pt=partnerOf(S,w0),msg=l0.name+' attacks '+w0.name+' after the bell.';
    if(pt&&pt.inj<=0&&winners.indexOf(pt)<0&&feud.a.concat(feud.b).indexOf(pt.id)<0&&chance(S,0.5)){
      var side=feud.a.indexOf(w0.id)>=0?feud.a:feud.b;if(side.indexOf(pt.id)<0&&side.length<2)side.push(pt.id);
      msg+=' '+pt.name+' runs out to make the save.';
    }
    seg.notes.push(msg);return;
  }
  if(m.mt==='1v1'&&!t&&!feud&&fin!=='dq'&&fin!=='co'&&holdLvl(P,l0.id)>0&&holdLvl(P,w0.id)===0){
    var ht=null;P.titles.forEach(function(tt){if(!tt.tag&&tt.holders[0]===l0.id&&(!ht||tt.lvl>ht.lvl))ht=tt;});
    if(ht&&ht.g===w0.g&&startFeud(S,P,w0,l0,35,w0.name+' beat the champion in a non-title match',{title:ht.id})){
      seg.notes.push(w0.name+' just beat the champion and wants a shot at the '+ht.name+'.');return;
    }
  }
  if(m.mt==='1v1'&&w0.align==='F'&&l0.align==='F'&&OV>=85&&chance(S,0.35)){
    w0.morale=clamp(w0.morale+2,0,100);l0.morale=clamp(l0.morale+2,0,100);seg.notes.push('The two shake hands after the bell.');
  }
}

/* ===== 20-story.js ===== */
/* ---------- angles: the story director ---------- */
function promoScore(S,w,bonus){return clamp(Math.round(0.62*micOf(S,w)+0.38*w.ovr+(bonus||0)+(S.booker&&w.promo===S.player?S.booker.sk.creative:0)+rnd(S)*8-4),5,99);}
function angle(head,text,ov){return {k:'angle',head:head,text:text,ov:clamp(Math.round(ov),5,99)};}
var ACTN=['','Spark','Escalation','Twist','Blow-off'];
function feudAct(f){return f.res?4:(f.heat>=60?(f.twist?4:3):(f.heat>=30?2:1));}
function nextBigName(S,P){var w=S.week+(4-cal(S.week).wom);return P.name+' '+dbOf(S).events[cal(w).month];}

/* Feud storylets: each feud moves through four acts, and each act unlocks different beats.
   A storylet is {id, head, acts, w (weight), ok(c) -> bool, run(c) -> angle}. c carries the feud and both leads. */
var FEUDLETS=[
  {id:'words',head:'Promo',acts:[1,2],w:4,ok:function(){return true;},run:function(c){
    var sp=c.a.mic>=c.b.mic?c.a:c.b,tg=sp===c.a?c.b:c.a,sc=promoScore(c.S,sp,c.f.heat*0.06);
    heatUp(c.S,c.f,3+sc/14,sp.name+' cut a promo on '+tg.name);
    return angle('Promo',chance(c.S,0.5)?sp.name+' runs down '+tg.name+' on the microphone and promises to settle it in the ring.':sp.name+' calls out '+tg.name+'. The two go nose to nose on the stage before officials step in.',sc);}},
  {id:'stare',head:'Mind games',acts:[1],w:2,ok:function(){return true;},run:function(c){
    var x=c.h||c.a,y=x===c.a?c.b:c.a;heatUp(c.S,c.f,4,x.name+' played mind games with '+y.name);
    return angle('Mind games',x.name+' appears at the top of the ramp during '+y.name+'’s interview, says nothing, and walks away.',0.7*(c.a.ovr+c.b.ovr)/2+6+rnd(c.S)*6-3);}},
  {id:'sneak',head:'Ambush',acts:[1,2],w:3,ok:function(c){return !!c.h&&c.f.kind!=='dream';},run:function(c){
    heatUp(c.S,c.f,7,c.h.name+' jumped '+c.o.name+' from behind');
    return angle('Ambush',c.h.name+' jumps '+c.o.name+' from behind in the parking lot and leaves '+c.o.name+' down on the concrete.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+4);}},
  {id:'brawl',head:'Brawl',acts:[2,3,4],w:3,ok:function(c){return c.f.kind!=='dream';},run:function(c){
    heatUp(c.S,c.f,8,'Pull-apart brawl between '+c.a.name+' and '+c.b.name);
    return angle('Brawl',chance(c.S,0.5)?c.a.name+' and '+c.b.name+' come to blows backstage. Officials pull them apart.':(c.h||c.a).name+' jumps '+(c.o||c.b).name+' during an interview. Security separates them.',0.7*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+4+rnd(c.S)*8-4);}},
  {id:'partner',head:'Attack',acts:[2],w:3,ok:function(c){if(!c.h||c.f.kind==='dream')return false;var pt=partnerOf(c.S,c.o);return !!pt&&c.ok(pt.id)&&c.f.a.concat(c.f.b).indexOf(pt.id)<0;},run:function(c){
    var pt=partnerOf(c.S,c.o),side=c.f.a.indexOf(c.o.id)>=0?c.f.a:c.f.b;if(side.length<2)side.push(pt.id);c.mark(pt);
    heatUp(c.S,c.f,8,c.h.name+' went after '+c.o.name+'’s partner '+pt.name);
    return angle('Attack',c.h.name+' cannot get to '+c.o.name+', so '+pt.name+' pays for it instead. '+c.o.name+' arrives too late to help.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+5);}},
  {id:'signing',head:'Contract signing',acts:[2,4],w:4,ok:function(c){return cal(c.S.week).wom>=3||c.show.big;},run:function(c){
    heatUp(c.S,c.f,10,'The contract signing between '+c.a.name+' and '+c.b.name+' ended in a brawl');
    return angle('Contract signing',c.a.name+' and '+c.b.name+' sit down to sign the contract. Pens are thrown, the table goes over, and security floods the ring.',0.75*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+5);}},
  {id:'video',head:'Video',acts:[2,3,4],w:1.5,ok:function(c){return c.f.log.length>=4;},run:function(c){
    heatUp(c.S,c.f,3,'A video package told the story so far');
    return angle('Video','A video package retells the story of '+c.a.name+' and '+c.b.name+', from the first shove to last week.',0.8*(c.a.ovr+c.b.ovr)/2+4);}},
  {id:'stakes',head:'Stakes',acts:[3],w:7,twist:true,ok:function(){return true;},run:function(c){
    var st=pick(c.S,c.f.title?['Loser sits out four weeks','No disqualifications: nobody can save you']:['Loser sits out four weeks','Winner gets a title shot','No disqualifications: nobody can save you']);
    c.f.stakes=st;c.f.twist='stakes';heatUp(c.S,c.f,10,'The stakes were raised: '+st.toLowerCase());
    var sp=c.a.mic>=c.b.mic?c.a:c.b;
    return angle('Stakes',sp.name+' raises the stakes, and '+(sp===c.a?c.b:c.a).name+' accepts on the spot. '+st+'.',promoScore(c.S,sp,8));}},
  {id:'betray',head:'Betrayal',acts:[3],w:8,twist:true,ok:function(c){var A=c.f.a,B=c.f.b;return (A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))||(B.length>1&&A.indexOf(B[1])<0&&c.ok(B[1]));},run:function(c){
    var S=c.S,A=c.f.a,B=c.f.b,from=(A.length>1&&B.indexOf(A[1])<0&&c.ok(A[1]))?A:B,to=from===A?B:A,lead=S.w[from[0]],ally=S.w[from[1]];
    if(!ally){heatUp(S,c.f,6,c.a.name+' and '+c.b.name+' had to be pulled apart');return angle('Brawl',c.a.name+' and '+c.b.name+' go at it before the bell and have to be pulled apart.',0.7*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+5);}
    from.splice(1,1);if(to.length<2)to.push(ally.id);
    var tm=teamOf(S,ally);if(tm&&tm.m.indexOf(lead.id)>=0){c.P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(lead.id)>=0&&tt.holders.indexOf(ally.id)>=0){tt.holders=[];tt.since=S.week;news(S,'title','The '+c.P.name+' '+tt.name+' are vacated after the champions split.');}});dissolveTeam(S,tm);}
    if(ally.align===lead.align)turn(S,ally,'turned on '+lead.name);
    c.f.twist='betray';c.mark(ally);heatUp(S,c.f,15,ally.name+' turned on '+lead.name);memBetray(S,ally,lead);award(S,'ACH_BETRAYAL');
    return angle('Betrayal',lead.name+' turns around to find '+ally.name+' standing there. '+ally.name+' strikes first. The one person '+lead.name+' trusted has switched sides.',0.8*(lead.ovr+ally.ovr)/2+12);}},
  {id:'injury',head:'Attack',acts:[3],w:6,twist:true,ok:function(c){return !!c.h&&c.f.kind!=='dream'&&!c.left[c.o.id]&&!c.left[c.h.id];},run:function(c){
    c.o.away=c.S.week+1;c.f.twist='injury';heatUp(c.S,c.f,12,c.h.name+' put '+c.o.name+' through a table');
    return angle('Attack',c.h.name+' puts '+c.o.name+' through the announce table. '+c.o.name+' is helped to the back and will miss next week.',0.75*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+8);}},
  {id:'swerve',head:'Turn',acts:[3],w:8,twist:true,ok:function(c){return c.f.kind==='dream';},run:function(c){
    var x=c.a.mic>=c.b.mic?c.b:c.a,y=x===c.a?c.b:c.a;turn(c.S,x,'attacked '+y.name+' during a handshake');
    c.f.kind='feud';c.f.twist='swerve';heatUp(c.S,c.f,20,x.name+' attacked '+y.name+' during a handshake');
    return angle('Turn',y.name+' offers a handshake. '+x.name+' takes it, pulls '+y.name+' in, and lays '+y.name+' out. Respect is finished.',0.8*(c.a.ovr+c.b.ovr)/2+14);}},
  {id:'made',head:'Announcement',acts:[4],w:8,ok:function(c){return !c.f.finale&&!c.show.big;},run:function(c){
    var ev=nextBigName(c.S,c.P),tt=c.f.title?titleById(c.P,c.f.title):null;c.f.finale=true;
    heatUp(c.S,c.f,6,'The match was made official for '+ev);
    return angle('Announcement','It is official: '+c.a.name+' against '+c.b.name+' at '+ev+(tt?', for the '+tt.name:'')+(c.f.stakes?'. '+c.f.stakes:'')+'.',0.75*(c.a.ovr+c.b.ovr)/2+0.2*c.f.heat+4);}},
  {id:'final',head:'Face-off',acts:[4],w:3,ok:function(c){return !!c.f.finale;},run:function(c){
    heatUp(c.S,c.f,5,'One last face-off before the match');
    return angle('Face-off',c.a.name+' and '+c.b.name+' stand nose to nose in the ring. Nothing left to say. It ends at the big event.',0.75*(c.a.ovr+c.b.ovr)/2+0.25*c.f.heat+3);}}
];

function genAngle(S,P,show,ctx){
  var pool=ctx.pool,inP=ctx.inP,ang=ctx.angled,opts=[];
  function ok(id){return inP[id]&&!ang[id]&&!(S.w[id].away>=S.week);}
  function mark(){for(var i=0;i<arguments.length;i++)ang[arguments[i].id]=1;}
  var my=S.mystery&&S.mystery.promo===P.id?S.mystery:null;
  // feud storylets
  activeFeuds(S).forEach(function(f){
    if(f.promo!==P.id||!ok(f.a[0])||!ok(f.b[0]))return;
    var a=S.w[f.a[0]],b=S.w[f.b[0]],h=a.align==='H'?a:(b.align==='H'?b:null),act=feudAct(f);
    var c={S:S,P:P,f:f,a:a,b:b,h:h,o:h?(h===a?b:a):null,show:show,ok:ok,mark:mark,left:ctx.left||{}};
    FEUDLETS.forEach(function(sl){
      if(sl.acts.indexOf(act)<0||!sl.ok(c))return;
      opts.push([sl.w*(1+f.heat/100)*(f.beat===sl.id?0.12:1),function(){mark(a,b);f.beat=sl.id;var r=sl.run(c);r.feud=f.id;r.act=feudAct(f);return r;}]);
    });
  });
  function interview(){
    var c=pool.filter(function(w){return !ang[w.id];}).sort(function(a,b){return (b.mic+b.ovr*0.5)-(a.mic+a.ovr*0.5);}).slice(0,4);
    if(!c.length)return null;var sp=pick(S,c),sc=promoScore(S,sp,0),lv=holdLvl(P,sp.id);mark(sp);
    if(sc>sp.ovr)addOvr(P,sp,0.25);
    if(hasMouthpiece(S,sp))return angle('Interview',S.w[sp.mgr].name+' does the talking for '+sp.name+', and does it well: '+(lv?'the title is going nowhere.':'the best is still to come.'),sc);
    return angle('Interview',sp.name+' takes the microphone and '+(lv?'vows that the title is going nowhere.':(sp.ws>=3?'talks up a '+sp.ws+'-match winning streak.':'promises bigger things are coming.')),sc);
  }
  function callOut(){
    var hs=pool.filter(function(w){return w.align==='H'&&w.mic>=55&&!ang[w.id]&&!inFeud(S,w.id);});if(!hs.length)return null;
    hs.sort(function(a,b){return b.ovr-a.ovr;});var h=pick(S,hs.slice(0,8));
    var ts=pool.filter(function(w){return w.align==='F'&&w.g===h.g&&!ang[w.id]&&!inFeud(S,w.id)&&Math.abs(w.ovr-h.ovr)<=10&&(h.team==null||w.team!==h.team);});
    if(!ts.length)return null;ts.sort(function(a,b){return Math.abs(a.ovr-h.ovr)-Math.abs(b.ovr-h.ovr);});
    var tg=ts[0];if(!startFeud(S,P,tg,h,24+ri(S,0,10),h.name+' attacked '+tg.name+' from behind'))return null;mark(h,tg);
    return angle('Ambush',h.name+' interrupts '+tg.name+'’s interview and attacks from behind. A new rivalry begins.',promoScore(S,h,3));
  }
  function champChallenge(){
    var ts=showTitles(P,show).filter(function(t){return !t.tag&&t.holders.length&&ok(t.holders[0])&&!inFeud(S,t.holders[0]);});if(!ts.length)return null;
    var t=pick(S,ts),c=S.w[t.holders[0]];
    var cs=pool.filter(function(w){return w.id!==c.id&&w.g===c.g&&!ang[w.id]&&holdLvl(P,w.id)===0&&!inFeud(S,w.id)&&Math.abs(w.ovr-c.ovr)<=16&&(!t.brand||show.big||w.brand===t.brand);});
    if(!cs.length)return null;cs.sort(function(a,b){return (b.ovr+b.mom*2+(b.align!==c.align?6:0))-(a.ovr+a.mom*2+(a.align!==c.align?6:0));});
    var ch=cs[0];if(!startFeud(S,P,ch,c,30,ch.name+' challenged for the '+t.name,{title:t.id}))return null;mark(c,ch);
    return angle('Challenge',ch.name+' interrupts '+c.name+' and lays claim to the '+t.name+'.',promoScore(S,ch.mic>c.mic?ch:c,4));
  }
  function mysteryStart(){
    var os=pool.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=os[Math.floor(os.length*0.3)]||0;
    var vs=pool.filter(function(w){return w.align==='F'&&w.ovr>=cut&&!ang[w.id]&&!inFeud(S,w.id);});if(!vs.length)return null;
    var v=pick(S,vs);S.mystery={v:v.id,left:ri(S,2,3),promo:P.id,start:S.week};mark(v);
    news(S,'story','Who attacked '+v.name+'? Nobody saw a thing.');
    return angle('Mystery',v.name+' is found laid out in the locker room. Nobody saw the attacker.',0.8*v.ovr+8+rnd(S)*6-3);
  }
  function mysteryClue(){
    var v=S.w[my.v];my.left--;mark(v);
    return angle('Mystery',chance(S,0.5)?'Footage of the attack on '+v.name+' airs. The attacker’s face is hidden.':v.name+' demands answers and accuses half the locker room.',0.75*v.ovr+8+rnd(S)*6-3);
  }
  function mysteryReveal(){
    var v=S.w[my.v],pt=partnerOf(S,v),c=null,betray=false;
    if(pt&&pt.promo===P.id&&pt.inj<=0&&chance(S,0.4)){c=pt;betray=true;}
    if(!c){var hs=rosterOf(S,P.id).filter(function(w){return w.id!==v.id&&w.g===v.g&&w.inj<=0&&!w.camp&&!w.nw&&!inFeud(S,w.id)&&(w.team==null||w.team!==v.team);});
      hs.sort(function(a,b){return (Math.abs(a.ovr-v.ovr)+(a.align==='H'?0:12))-(Math.abs(b.ovr-v.ovr)+(b.align==='H'?0:12));});c=hs[0];}
    S.mystery=null;if(!c)return null;
    if(betray){var tm=teamOf(S,v);P.titles.forEach(function(tt){if(tt.tag&&tt.holders.indexOf(v.id)>=0){tt.holders=[];tt.since=S.week;news(S,'title','The '+P.name+' '+tt.name+' are vacated after the champions split.');}});if(tm)dissolveTeam(S,tm);award(S,'ACH_BETRAYAL');}
    if(c.align==='F')turn(S,c,'revealed as the mystery attacker');
    var f=startFeud(S,P,v,c,65,c.name+' was revealed as the one who attacked '+v.name,{force:true});if(f)f.twist='reveal';
    award(S,'ACH_MYSTERY');mark(v,c);
    return angle('Reveal','The attacker is revealed: '+c.name+'.'+(betray?' '+v.name+'’s own partner.':'')+' '+v.name+' wants revenge.',0.8*(v.ovr+c.ovr)/2+12);
  }
  function stareDown(){
    var GX=mainG(S,P),L=pool.filter(function(w){return !ang[w.id]&&!inFeud(S,w.id)&&w.g===GX;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,6);
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){
      var a=L[i],b=L[j],rk=S.recent[P.id+':'+rkey(a.id,b.id)];
      if(a.align!=='F'||b.align!=='F'||(a.team!=null&&a.team===b.team)||(rk&&S.week-rk<10))continue;
      if(!startFeud(S,P,a,b,30,a.name+' and '+b.name+' faced off',{kind:'dream'}))return null;mark(a,b);
      return angle('Face-off',a.name+' and '+b.name+' cross paths on the stage. Neither backs down, and the crowd wants the match.',0.8*(a.ovr+b.ovr)/2+8);
    }
    return null;
  }
  function comeback(){
    var c=pool.filter(function(w){return w.ret&&!ang[w.id];});if(!c.length)return null;
    var w=c[0],f=feudsFor(S,w.id)[0],r=null;w.ret=false;w.mom=clamp(w.mom+3,-10,10);mark(w);
    if(f){r=S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]];heatUp(S,f,10,w.name+' returned and went after '+r.name);}
    return angle('Return',w.name+' returns to a big reaction'+(r?' and goes straight after '+r.name+'.':'.'),0.9*w.ovr+8);
  }
  function teamUp(){
    var os=pool.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),lo=os[Math.floor(os.length*0.3)]||0,hi=os[Math.floor(os.length*0.8)]||100;
    var fa=pool.filter(function(w){return w.align==='F'&&w.team==null&&!ang[w.id]&&w.ovr>=lo&&w.ovr<=hi&&!inFeud(S,w.id);});
    if(fa.length<2)return null;var a=pick(S,fa);
    var bs=fa.filter(function(w){return w.id!==a.id&&w.g===a.g&&Math.abs(w.ovr-a.ovr)<=8&&(!a.brand||w.brand===a.brand);});if(!bs.length)return null;
    var hs=pool.filter(function(w){return w.align==='H'&&w.g===a.g&&!ang[w.id]&&Math.abs(w.ovr-a.ovr)<=14;});if(!hs.length)return null;
    var b=pick(S,bs),h=pick(S,hs);formTeam(S,P,a,b,8);mark(a,b,h);
    var f=startFeud(S,P,a,h,20,h.name+' attacked '+a.name+'; '+b.name+' made the save');if(f&&f.a.indexOf(a.id)>=0&&f.a.length<2)f.a.push(b.id);
    news(S,'story','New team: '+a.name+' & '+b.name+'.');
    return angle('Save',h.name+' attacks '+a.name+' after an interview. '+b.name+' runs out to make the save, and the two shake hands. A new team is born.',0.75*(a.ovr+b.ovr+h.ovr)/3+6);
  }
  function crowdTurn(){
    var c=pool.filter(function(w){return !ang[w.id]&&!inFeud(S,w.id)&&((w.align==='H'&&w.mom>=4&&w.mic>=65)||(w.align==='F'&&w.mom<=-4&&w.mic>=60));});if(!c.length)return null;
    var w=pick(S,c),was=w.align;mark(w);
    turn(S,w,was==='H'?'the crowd got behind them':'turned on the fans');
    if(was==='H')addOvr(P,w,2);else w.mom=clamp(w.mom+3,-10,10);
    return angle('Turn',was==='H'?'The crowd has been cheering '+w.name+' for weeks. Tonight '+w.name+' embraces it.':'After weeks of losses, '+w.name+' blames the fans and walks out to boos.',promoScore(S,w,6));
  }
  if(my&&my.left<=0){var r=mysteryReveal();if(r)return r;}
  if(pool.some(function(w){return w.ret&&!ang[w.id];}))opts.push([7,comeback]);
  if(my&&inP[my.v]&&!ang[my.v])opts.push([4,mysteryClue]);
  var nf=activeFeuds(S).length;
  if(nf<6){opts.push([nf<3?5:2,callOut]);opts.push([nf<3?4:2,champChallenge]);opts.push([0.8,stareDown]);}
  if(!S.mystery)opts.push([0.7,mysteryStart]);
  opts.push([0.8,teamUp]);opts.push([1,crowdTurn]);opts.push([1.5,interview]);
  ANGX.forEach(function(fn){var e=fn(S,P,show,ctx,{ok:ok,mark:mark,pool:pool,ang:ang});if(e)opts.push(e);});
  for(var tries=0;tries<5&&opts.length;tries++){
    var tot=0,i;for(i=0;i<opts.length;i++)tot+=opts[i][0];
    var x=rnd(S)*tot;for(i=0;i<opts.length;i++){x-=opts[i][0];if(x<=0)break;}
    i=Math.min(i,opts.length-1);
    var res=opts[i][1]();if(res)return res;opts.splice(i,1);
  }
  return interview();
}

/* ===== 30-show.js ===== */
/* ---------- running a show ---------- */
function dirtSheet(S,P,show,rep,pool){
  var ms=rep.segs.filter(function(s){return s.k==='match';}),L=[],d=rep.rating-rep.exp,i;
  L.push(d>=4?show.name+' beat every expectation. This is a company on a roll.':(d>=0.5?'A good night. '+show.name+' gave the crowd a little more than they came for.':(d>-0.5?show.name+' was exactly the show people expected. No more, no less.':(d>-4?'A flat night. '+show.name+' came up short of what this audience expects.':show.name+' was a miss. People were leaving before the main event ended.'))));
  var best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],worst=ms.slice().sort(function(a,b){return a.ov-b.ov;})[0],main=ms[ms.length-1];
  if(best)L.push('Match of the night: '+best.label+' at '+best.ov+'%'+(best.fx.filter(function(f){return f.s>0;})[0]?'. '+best.fx.filter(function(f){return f.s>0;})[0].x+'.':'.'));
  if(worst&&worst!==best&&worst.ov<rep.rating-10){var why=worst.fx.filter(function(f){return f.s<0;})[0];L.push('Low point: '+worst.label+' at '+worst.ov+'%'+(why?'. '+why.x+'.':'.'));}
  if(main&&main!==best)L.push(main.ov>=rep.rating+4?'The main event delivered at '+main.ov+'%.':(main.ov<rep.rating-3?'The main event ('+main.ov+'%) did not close the show the way it needed to.':'The main event did its job.'));
  var nf=ms.filter(function(s){return s.fin==='dq'||s.fin==='co'||s.fin==='draw';}).length;if(nf>=2)L.push(nf+' matches without a real finish is too many for one night.');
  var flat=ms.filter(function(s){return s.fx.some(function(f){return /^Nobody to/.test(f.x);});}).length;if(flat>=2)L.push(flat+' matches had nobody to cheer against. Mix your faces and heels.');
  var seen={};rep.segs.forEach(function(s){(s.ids||[]).forEach(function(id){seen[id]=1;});if(s.feud)seen['f'+s.feud]=1;});
  var cold=activeFeuds(S).filter(function(f){return f.promo===P.id&&!seen['f'+f.id]&&!(seen[f.a[0]]&&seen[f.b[0]])&&pool[f.a[0]]&&pool[f.b[0]];}).sort(function(a,b){return b.heat-a.heat;})[0];
  if(cold)L.push('Nothing tonight from '+feudLabel(S,cold)+'. That feud cools a little every week it is left alone.');
  var top=Object.keys(pool).map(function(id){return S.w[id];}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,8).filter(function(w){return S.week-w.lu>=3;})[0];
  if(top)L.push(top.name+' has not wrestled in '+(S.week-top.lu)+' weeks. Stars fade when they are off the card.');
  L.push(rep.sellout?'The building was sold out, '+rep.att.toLocaleString('en-US')+' strong.':(rep.att<rep.cap*0.75?'Only '+rep.att.toLocaleString('en-US')+' in a building that holds '+rep.cap.toLocaleString('en-US')+'. The card did not sell tickets.':rep.att.toLocaleString('en-US')+' paid to get in.'));
  return {by:S.columnist||'The Ringside Wire',lines:L.slice(0,7)};
}
function runShow(S,P,show,card){
  var isPl=P.id===S.player&&!S.cal,big=!!show.big,n=card.length,used={},i,k,key=big?'big':show.id;
  var rep={promo:P.id,id:show.id,name:show.name,big:big,week:S.week,segs:[],gim:false};
  var pool=eligible(S,P,show).filter(function(w){return w.promo===P.id&&!(big&&isDev(P,w.brand));}),inP={};pool.forEach(function(w){inP[w.id]=1;});
  // the advertised card sells the tickets: star power in the main event, the hottest feud, and advertising
  var star=n?avg(flat(card[n-1].sides).map(function(id){return S.w[id].ovr;})):50,heat=0;
  card.forEach(function(m){var ids=flat(m.sides);for(var x=0;x<ids.length;x++)for(var y=x+1;y<ids.length;y++){var f=feudOf(S,ids[x],ids[y]);if(f&&f.heat>heat)heat=f.heat;}});
  rep.mainStar=star;
  if(!S.cal){
    var hype=clamp(1+(star-(P.starB[key]||star))/80+heat/500+ADV_H[P.adv]+(isPl&&S.hype?S.hype:0),0.8,1.4),dm=TIX_D[P.tix],d=demand(P,show,1)*(isPl?tourBoost(S,P)*tasteDraw(S,P,card,rep):1),cap=capFor(d);
    rep.hype=hype;rep.cap=cap;rep.att=Math.round(Math.min(cap,d*hype*dm));rep.sellout=rep.att>=cap;
    rep.energy=isPl?clamp((hype*dm-1)*9,-2,2):0;
    if(isPl){rep.venue=venueFor(S,P,cap);rep.ann=P.ann.slice();S.hype=0;
      rep.lineup=card.map(function(m){var t=m.title?titleById(P,m.title):null;return vsLabel(m.sides.map(function(ids){return ids.map(function(id){return S.w[id];});}))+(t?' — '+t.name:'');});}
  }
  var ctx={pool:pool,inP:inP,angled:{},left:{},extra:[]},slots={};
  if(isPl){var idx=[];for(i=0;i<n;i++)idx.push(i);for(i=idx.length-1;i>0;i--){var j=Math.floor(rnd(S)*(i+1)),tmp=idx[i];idx[i]=idx[j];idx[j]=tmp;}
    var na=big?2:P.angles;if(S.mystery&&S.mystery.promo===P.id&&S.mystery.left<=0)na=Math.max(na,1);
    for(k=0;k<na&&k<idx.length;k++)slots[idx[k]]=1;}
  if(isPl){var pp=planPromo(S,P,show,ctx);if(pp)rep.segs.push(pp);}
  for(i=0;i<n;i++){
    if(slots[i]){
      ctx.left={};for(k=i;k<n;k++)flat(card[k].sides).forEach(function(id){ctx.left[id]=1;});
      var nang=Object.keys(ctx.angled).length,a=genAngle(S,P,show,ctx);
      if(a){rep.en=Math.min(100,(rep.en==null?100:rep.en)+14);ANGDONE.forEach(function(fn){fn(S,P,a,Object.keys(ctx.angled).slice(nang));});var o={p:P.ann[0].split(' ')[0],c:P.ann[1].split(' ')[0]};a.bc=[{t:'note',x:a.text},{t:'col',x:fill(sayPick(S,REACT[a.head]||['Well, how about that.']),o)}];rep.segs.push(a);}
    }
    rep.segs.push(doMatch(S,P,show,card[i],i,n,rep,used));
  }
  if(!isPl){var top=pool.slice().sort(function(a,b){return (b.mic+b.ovr)-(a.mic+a.ovr);});
    for(k=0;k<(big?2:P.angles)&&k<top.length;k++)rep.segs.push({k:'angle',ai:true,ov:clamp(Math.round(0.62*top[k].mic+0.38*top[k].ovr+rnd(S)*8-4),5,99)});}
  // rating: the main event counts triple; production values lift the whole show
  var ms=rep.segs.filter(function(s){return s.k==='match';}),num=0,den=0;
  ms.forEach(function(s,ix){var w=ix===ms.length-1?3:(ix===ms.length-2?2:(ix===0?1.5:1));num+=s.ov*w;den+=w;});
  rep.segs.forEach(function(s){if(s.k==='angle'){num+=s.ov*0.7;den+=0.7;}});
  rep.rating=clamp(r1((den?num/den:30)+(P.prodLvl-P.prod0)*0.6*(modelOf(P).prodX==null?1:modelOf(P).prodX)+(isPl&&S.rateMod?S.rateMod:0)),5,99);rep.mainOv=ms.length?ms[ms.length-1].ov:0;
  if(isPl)S.rateMod=0;
  if(S.cal)return rep;
  var exp=expected(P,show);
  if(isPl&&rep.venue){var bar=barCity(S,rep.venue);if(bar){exp+=bar.d;rep.barNote=bar.note;}}
  var qf=clamp(1+(P.trend||0)/60,0.85,1.15)*(SLOT_V[P.slot]/SLOT_V[P.slot0])*(1+0.03*(P.prodLvl-P.prod0));
  rep.exp=r1(exp);
  var mx=mixOf(P);
  rep.viewers=Math.round(viewersK(P,show,qf)*1000);rep.gate=Math.round(rep.att*ticket(P,show)*TIX_P[P.tix]*mx.gate);rep.tv=Math.round(rep.viewers/1000*P.tvRate*mx.tv);
  rep.buys=big?Math.round(buysK(P,show,rep.hype)*1000):0;rep.ppv=Math.round(rep.buys*22*mx.ppv);
  P.led.tv+=rep.tv;P.led.gate+=rep.gate;P.led.ppv+=rep.ppv;P.led.prod+=P.prod*(big?4:1)*PRODF[P.prodLvl]/PRODF[P.prod0];
  var before=P.image;
  P.image=clamp(P.image+(rep.rating-exp)*(big?0.08:0.03*showMult(show)),5,modelOf(P).cap||100);rep.dImage=r1(P.image-before);
  P.trend=(P.trend||0)*0.6+(rep.rating-exp)*0.4;P.mainB[key]=(P.mainB[key]||rep.mainOv)*0.9+rep.mainOv*0.1;
  P.last={name:show.name,rating:rep.rating,week:S.week};
  // the crowd gets used to about half of whatever you keep giving it, good or bad
  if(isPl){var raw=rep.rating-(exp-(P.expA||0)-(P.expB||0));P.expA=clamp((P.expA||0)+(0.5*raw-(P.expA||0))*0.16/(P.shows.length+1),-4,8);}
  if(isPl){
    S.stats.shows++;if(rep.rating>S.stats.bestShow)S.stats.bestShow=rep.rating;
    S.stats.run=rep.rating>exp?S.stats.run+1:0;
    award(S,'ACH_FIRST_BELL');if(rep.rating>=80)award(S,'ACH_SHOW_80');if(rep.rating>=90)award(S,'ACH_SHOW_90');if(rep.rating<40)award(S,'ACH_BOMB');
    if(rep.sellout)award(S,'ACH_SELLOUT');if(S.stats.run>=5)award(S,'ACH_RUN_5');
    rep.quest=rep.quest||[];
    S.quests.slice().forEach(function(q){
      if(q.type==='sponsor'&&big){if(rep.rating>=q.target){P.led.bonus+=q.bonus;rep.quest.push('Sponsor target hit: +$'+q.bonus.toLocaleString('en-US')+'.');award(S,'ACH_QUEST');}else rep.quest.push('Sponsor target missed ('+q.target+'% needed).');dropQuest(S,q);}
      if(q.type==='network'&&q.show===show.id){if(q.hit){P.led.bonus+=q.bonus;rep.quest.push('Network target hit: +$'+q.bonus.toLocaleString('en-US')+'.');award(S,'ACH_QUEST');}else rep.quest.push('Network target missed ('+q.target+'% main event needed).');dropQuest(S,q);}
    });
    rep.sheet=dirtSheet(S,P,show,rep,inP);
    S.reports.unshift(rep);if(S.reports.length>8)S.reports.length=8;
  }else if(big){var mm=ms[ms.length-1];news(S,'world',show.name+' scored '+rep.rating+'%. Main event: '+mm.label+(mm.win?' ('+mm.win+' won).':' (draw).'));}
  if(isPl)Object.keys(ctx.angled).forEach(function(id){if(S.w[id])S.w[id].la=S.week;});
  SHOWX.forEach(function(fn){fn(S,P,show,rep,card);});
  return rep;
}
function dropQuest(S,q){S.quests=S.quests.filter(function(x){return x!==q;});}
function matchQuests(S,P,show,m,sides,win,t,OV,isMain,seg){
  var ids=flat(m.sides);
  S.quests.slice().forEach(function(q){
    if(q.type==='shot'&&t&&t.id===q.title&&ids.indexOf(q.w)>=0){S.w[q.w].morale=clamp(S.w[q.w].morale+6,0,100);seg.notes.push('Promise kept: '+S.w[q.w].name+' got the title shot.');award(S,'ACH_PROMISE');keptPromise(S,q,true);dropQuest(S,q);}
    else if(q.type==='win'&&win>=0&&m.sides[win].indexOf(q.w)>=0){S.w[q.w].morale=clamp(S.w[q.w].morale+6,0,100);seg.notes.push('Promise kept: '+S.w[q.w].name+' got the win.');award(S,'ACH_PROMISE');keptPromise(S,q,true);dropQuest(S,q);}
    else if(q.type==='network'&&isMain&&q.show===show.id){q.hit=OV>=q.target;}
    else if(q.type==='dream'&&show.big&&ids.indexOf(q.a)>=0&&ids.indexOf(q.b)>=0){P.led.bonus+=q.bonus;P.image=clamp(P.image+0.6,5,100);seg.notes.push('The dream match delivered: +$'+q.bonus.toLocaleString('en-US')+' in extra buys.');award(S,'ACH_QUEST');dropQuest(S,q);}
  });
}
function keptPromise(S,q,kept){
  S.ledger=S.ledger||[];S.ledger.unshift({w:S.week,k:kept,t:q.text.replace(/^Promise: /,'')});if(S.ledger.length>16)S.ledger.length=16;
  S.trust=clamp((S.trust==null?60:S.trust)+(kept?3:-8),0,100);
  var pw=q.w!=null?S.w[q.w]:null;if(pw){if(kept){pw.pk2=(pw.pk2||0)+1;stressAdd(S,pw,-10);}else{pw.pb2=(pw.pb2||0)+1;stressAdd(S,pw,15);}}
}

/* ===== 40-week.js ===== */
/* ---------- the week ---------- */
function weekShows(S,P){
  var c=cal(S.week),out=P.shows.map(function(sh){return {id:sh.id,name:sh.name,brand:sh.brand||null,mult:sh.mult};});
  if(c.wom===4)out.push({id:'big',big:true,flag:c.month===P.flagship,brand:null,name:P.name+' '+dbOf(S).events[c.month],rule:(dbOf(S).rules&&dbOf(S).rules[c.month])||null});
  return out;
}
function startWeek(S){var P=S.promos[S.player];S.queue=weekShows(S,P);S.qi=0;S.card=[];grantBP(S);S.inbox=S.inbox.filter(function(e){return !e.done;});genEvents(S);}
function leaveCompany(S,w,why,quiet){
  var P=S.promos[w.promo];if(!P)return;
  vacateFor(S,P,w,why,quiet);var tm=teamOf(S,w);if(tm)dissolveTeam(S,tm);leaveStable(S,w);w.mgr=null;S.w.forEach(function(x){if(x.mgr===w.id)x.mgr=null;});
  S.feuds.forEach(function(f){if(!f.res&&(f.a.indexOf(w.id)>=0||f.b.indexOf(w.id)>=0)){f.res=true;f.dead=true;f.end=S.week;}});
  if(S.mystery&&S.mystery.v===w.id)S.mystery=null;
  S.quests=S.quests.filter(function(q){return q.w!==w.id&&q.a!==w.id&&q.b!==w.id;});
  S.inbox=S.inbox.filter(function(e){return e.done||e.w!==w.id;});
}
function joinCompany(S,w,P,wage,weeks){
  w.promo=P.id;w.brand=null;
  if(P.brands){var main=P.brands.filter(function(b){return !b.dev;}),dev=P.brands.filter(function(b){return b.dev;});w.brand=(w.ovr<55&&dev.length?dev[0]:main[Math.floor(rnd(S)*main.length)]).id;}
  w.wage=wage||wageFor(w.ovr,P);w.con=weeks||ri(S,48,96);w.o0=w.ovr;w.morale=75;modelJoin(S,w,P);w.cn=false;w.lu=S.week;w.deb=true;w.away=0;w.camp=false;w.ex=w.nw?1.1:(w.ovr>=P.image+8?4.4:(w.ovr>=P.image-2?3.5:(w.ovr>=P.image-12?2.6:(w.ovr>=P.image-22?1.8:1.1))));w.pos=w.ex;w.stress=0;w.ment=null;w.pk2=0;w.pb2=0;w.you=0;if(S.week>1)mile(S,w,'sign','Joined '+P.name);
}
function settle(S,P){
  var mine=P.id===S.player,sp=0;if(mine)S.sponsors.forEach(function(x){sp+=x.pay;});
  var adv=Math.round(ADV_C[P.adv]*P.inc0),camp=campCost(P),med=medCost(P),trv=travelCost(P);
  var L=P.led,merch=merchWeek(S,P),wages=wagesWeek(S,P),inc=L.tv+L.gate+L.ppv+L.bonus+merch+sp,over=P.fixed+P.varRate*(inc-sp),exp=wages+L.prod+over+adv+camp+med+trv;var fnc=mine?financeCost(S,P,inc-exp):0;exp+=fnc;
  var row={w:S.week,spons:sp,adv:adv,camp:camp,med:med,trv:trv,fin:fnc,tv:Math.round(L.tv),gate:Math.round(L.gate),ppv:Math.round(L.ppv),bonus:Math.round(L.bonus),merch:Math.round(merch),wages:Math.round(wages),prod:Math.round(L.prod),over:Math.round(over),inc:Math.round(inc),exp:Math.round(exp),net:Math.round(inc-exp),image:r1(P.image)};
  P.cash+=row.net;row.cash=Math.round(P.cash);P.hist.push(row);if(P.hist.length>60)P.hist.shift();
  P.led={tv:0,gate:0,ppv:0,bonus:0,prod:0};
  return row;
}
E.endWeek=function(S){
  if(S.over)return;
  var PL=S.promos[S.player];
  S.order.forEach(function(pid){if(pid===S.player)return;var P=S.promos[pid];weekShows(S,P).forEach(function(sh){var card=autoBook(S,P,sh);if(card.length>=3)runShow(S,P,sh,card);});});
  S.order.forEach(function(pid){var P=S.promos[pid],row=settle(S,P);if(pid===S.player)S.fin=row;P.mer=row.merch;P.neg=P.cash<0?(P.neg||0)+1:0;});
  // roster upkeep
  var top={};S.order.forEach(function(pid){var o=rosterOf(S,pid).map(function(w){return w.ovr;}).sort(function(a,b){return b-a;});top[pid]=o[Math.floor(o.length/3)]||0;});
  S.w.forEach(function(w){
    if(w.promo==='FA')return;var P=S.promos[w.promo],mine=w.promo===S.player;
    if(w.inj>0){w.inj--;w.il=(w.il||0)+1;if(w.inj===0){w.ret=true;w.rw=S.week+1;w.rwl=w.il;w.il=0;if(mine)news(S,'injury',w.name+' is cleared to return.');}}
    if(w.away&&w.away===S.week)w.ret=true;
    w.cond=Math.min(100,w.cond+14);
    w.mom+=w.mom>0?-Math.min(0.5,w.mom):Math.min(0.5,-w.mom);
    if(w.inj<=0&&S.week-w.lu>=4){addOvr(P,w,-0.25);if(mine&&w.ovr>=top[w.promo]&&!modelOf(P).noTvEgo)w.morale=clamp(w.morale-2,0,100);}
    if(w.ovr>ovrCap(P,w))w.ovr-=0.1;
    var mt=mine?egoTarget(S,w):65;w.morale=clamp(w.morale+clamp((mt-w.morale)*0.08,-1.2,1.2),0,100);
    if(mine&&w.ovr>=w.o0+15)award(S,'ACH_STAR_MAKER');
    w.con--;
    if(w.con<=0){
      if(mine){news(S,'contract',w.name+'’s contract ran out. They are now a free agent.');leaveCompany(S,w,'contract expired');w.promo='FA';w.brand=null;}
      else if(chance(S,0.8)){w.con=ri(S,48,110);w.wage=wageFor(w.ovr,P);}
      else{var held=P.titles.filter(function(t){return t.holders.indexOf(w.id)>=0;});news(S,'contract',w.name+' has left '+P.name+' and is a free agent.'+(held.length?' The '+held.map(function(t){return t.name;}).join(' and the ')+' '+(held.length>1||held[0].tag?'are':'is')+' vacated.':''));leaveCompany(S,w,'left the company',held.length>0);w.cut={w:S.week,from:P.id,img:P.image};w.promo='FA';w.brand=null;}
    }
  });
  // feuds cool off if you leave them alone
  activeFeuds(S).forEach(function(f){
    if(f.last<S.week)f.heat=Math.max(0,f.heat-3);
    if(f.heat<=0||S.week-f.last>=5){f.res=true;f.dead=true;f.end=S.week;f.a.concat(f.b).forEach(function(id){var w=S.w[id];if(w.promo===f.promo)addOvr(S.promos[f.promo],w,-0.5);});news(S,'story','The '+feudLabel(S,f)+' rivalry fizzles out.');}
  });
  var done=S.feuds.filter(function(f){return f.res;});if(done.length>12){var drop=done.slice(0,done.length-12);S.feuds=S.feuds.filter(function(f){return drop.indexOf(f)<0;});}
  // promises come due
  S.quests.slice().forEach(function(q){
    if(q.due>S.week)return;
    if(QEND[q.type])QEND[q.type](S,q);
    if(q.type==='shot'||q.type==='win'){var w=S.w[q.w];w.morale=clamp(w.morale-(q.type==='shot'?18:12),0,100);w.mom=clamp(w.mom-2,-10,10);news(S,'contract','You broke your promise to '+w.name+'. Morale drops.');keptPromise(S,q,false);}
    dropQuest(S,q);
  });
  // rivals pick up free agents
  S.order.forEach(function(pid){
    if(pid===S.player)return;var P=S.promos[pid],n=rosterOf(S,pid).length,short=(P.size0||n)-n;
    if(!chance(S,short>=3?0.6:0.2))return;
    // each company hires for its own system: the fit score, youth with potential, and for an underdog a recent castoff
    var M=modelOf(P),sc=function(w){return fitFor(S,P,w)+(w.age<=26?(w.pot-50)*0.4:0)-(w.age>=36?(w.age-35)*4:0);};
    var fa=S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw&&(!M.gender||w.g===M.gender)&&!(w.cut&&w.cut.from===pid&&S.week-w.cut.w<52)&&w.ovr<=P.image+(M.reach?M.reach-15:10)&&(short>=3||w.ovr>=P.image-45||(w.age<=24&&w.pot>=80));}).sort(function(a,b){return sc(b)-sc(a);});
    for(var k=0;k<(short>=8?2:1)&&k<fa.length;k++){joinCompany(S,fa[k],P);if(fa[k].ovr>=50)news(S,'contract',P.name+' signed free agent '+fa[k].name+'.');}
  });
  WEEKX.forEach(function(fn){fn(S);});
  var k,keys=Object.keys(S.recent);if(keys.length>4000)for(k=0;k<keys.length;k++)if(S.week-S.recent[keys[k]]>12)delete S.recent[keys[k]];
  if(S.week>=48)award(S,'ACH_YEAR');
  if(PL.image>=PL.image0+5)award(S,'ACH_IMAGE_UP');
  if(S.order.every(function(pid){return pid===S.player||S.promos[pid].image<PL.image;}))award(S,'ACH_NO1');
  if(PL.neg>=6){S.over={why:'bankrupt',week:S.week};award(S,'ACH_BROKE');news(S,'world',PL.name+' has run out of money.');return;}
  S.week++;startWeek(S);
};

/* ---------- the office: events with choices ---------- */
function hasQuest(S,id){return S.quests.some(function(q){return q.w===id||q.a===id||q.b===id;})||S.inbox.some(function(e){return !e.done&&e.w===id;});}
function money(n){return '$'+Math.round(n).toLocaleString('en-US');}
function pushEv(S,ev){if(!ev.checks)addChecks(S,ev);ev.id=S.nid++;ev.done=!ev.choices;ev.result=null;S.inbox.push(ev);return ev;}
var EV={
  shot:function(S,P,R){
    var c=R.filter(function(w){return w.mom>=2&&holdLvl(P,w.id)===0&&!hasQuest(S,w.id);}).sort(function(a,b){return b.mom-a.mom;});
    for(var i=0;i<c.length;i++){var w=c[i],t=null;
      P.titles.forEach(function(x){if(x.tag||x.g!==w.g||!x.holders.length||(x.brand&&x.brand!==w.brand))return;var ch=S.w[x.holders[0]];if(w.ovr>=ch.ovr-25&&w.ovr<=ch.ovr+12&&(!t||x.lvl>t.lvl))t=x;});
      if(t)return {type:'shot',w:w.id,title:t.id,text:w.name+' is on a roll and asks for a shot at the '+t.name+'.',choices:['Promise the shot within 6 weeks','Not yet']};}
    return null;
  },
  losing:function(S,P,R){
    var os=R.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),med=os[Math.floor(os.length/2)]||0;
    var c=R.filter(function(w){return w.ws<=-3&&w.ovr>=med&&!hasQuest(S,w.id);});if(!c.length)return null;
    var w=pick(S,c);return {type:'losing',w:w.id,text:w.name+' has lost '+(-w.ws)+' in a row and wants to know where this is going.',choices:['Promise a win within 2 weeks','Ask for patience']};
  },
  offer:function(S,P,R){
    var c=R.slice().sort(function(a,b){return b.ovr-a.ovr;}).slice(0,12).filter(function(w){return (w.con<=30||w.morale<55)&&!hasQuest(S,w.id)&&!(w.off>S.week);});if(!c.length)return null;
    var rv=S.order.filter(function(id){return id!==P.id&&S.promos[id].image>=P.image-25;}).sort(function(a,b){return S.promos[b].image-S.promos[a].image;});if(!rv.length)return null;
    var w=pick(S,c),raise=Math.round(w.wage*1.25/50)*50,beat=Math.round(w.wage*1.45/50)*50,rid=rv.filter(function(id){return temperKey(S.promos[id])==='raider';})[0]||rv[0],RVP=S.promos[rid];w.off=S.week+10;
    // a raider goes after the best; anyone else makes the offer when they can
    return {type:'offer',w:w.id,rival:rid,raise:raise,beat:beat,text:(RVP.owner&&RVP.owner.name?RVP.owner.name+' of ':'')+RVP.name+' has made '+w.name+' an offer.',choices:['Match it: '+money(raise)+' a week, new 48-week deal','Appeal to loyalty','Let them go','Beat it: '+money(beat)+' a week and a title shot']};
  },
  team:function(S,P,R){
    var c=R.filter(function(w){return w.team==null&&!hasQuest(S,w.id)&&!inFeud(S,w.id);});
    for(var k=0;k<12&&c.length>1;k++){var a=pick(S,c),bs=c.filter(function(w){return w.id!==a.id&&w.g===a.g&&w.align===a.align&&w.brand===a.brand&&Math.abs(w.ovr-a.ovr)<=8;});
      if(bs.length){var b=pick(S,bs);return {type:'team',w:a.id,o:b.id,text:a.name+' and '+b.name+' want to team up.',choices:['Make it official','No']};}}
    return null;
  },
  pitch:function(S,P,R){
    var c=R.filter(function(w){return w.mic>=60&&w.mom<=0&&!hasQuest(S,w.id)&&!inFeud(S,w.id);});if(!c.length)return null;
    var w=pick(S,c);return {type:'pitch',w:w.id,text:w.name+' pitches a '+(w.align==='F'?'heel':'face')+' turn to freshen things up.',choices:['Go with it','Keep things as they are']};
  },
  buzz:function(S,P,R){
    var c=R.filter(function(w){return w.ovr>=35&&w.ovr<=75&&S.week-w.lu<=2;});if(!c.length)return null;
    var w=pick(S,c);addOvr(P,w,2);w.mom=clamp(w.mom+3,-10,10);return {type:'buzz',w:w.id,text:w.name+' is catching fire with the fans. Overness and momentum are up.'};
  },
  mentor:function(S,P,R){
    var ps=R.filter(function(w){return w.pot-workRate(w)>=5&&w.ovr<60&&!hasQuest(S,w.id);});if(!ps.length)return null;
    var p=pick(S,ps),vs=R.filter(function(w){return w.id!==p.id&&w.g===p.g&&workRate(w)>=80&&w.ovr>=60&&w.brand===p.brand;});if(!vs.length)return null;
    var v=pick(S,vs);return {type:'mentor',w:p.id,o:v.id,text:v.name+' offers to take '+p.name+' under their wing.',choices:['Pair them up','Not now']};
  },
  dream:function(S,P,R){
    if(S.quests.some(function(q){return q.type==='dream';})||activeFeuds(S).length>=7)return null;
    var GX=mainG(S,P),L=R.filter(function(w){return w.align==='F'&&w.g===GX&&!inFeud(S,w.id)&&!hasQuest(S,w.id)&&!isDev(P,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,6);
    for(var i=0;i<L.length;i++)for(var j=i+1;j<L.length;j++){var a=L[i],b=L[j],rk=S.recent[P.id+':'+rkey(a.id,b.id)];if((rk&&S.week-rk<10)||(a.team!=null&&a.team===b.team))continue;
      var due=S.week+(4-cal(S.week).wom)+(cal(S.week).wom===4?4:0),bonus=Math.round(P.inc0*0.1/1000)*1000;
      startFeud(S,P,a,b,35,'Fans are calling for '+a.name+' vs '+b.name,{kind:'dream'});
      S.quests.push({id:S.nid++,type:'dream',a:a.id,b:b.id,bonus:bonus,due:due+1,text:'Dream match: book '+a.name+' vs '+b.name+' at the next big event ('+money(bonus)+' in extra buys)'});
      return {type:'dream',w:a.id,o:b.id,text:'Fans are calling for a dream match: '+a.name+' vs '+b.name+'. Book it at the next big event for a boost in buys.'};}
    return null;
  },
  network:function(S,P){
    if(S.quests.some(function(q){return q.type==='network';}))return null;
    var sh=pick(S,P.shows),target=Math.round((P.mainB[sh.id]||75)+4),bonus=Math.round(P.inc0*0.04/1000)*1000;
    S.quests.push({id:S.nid++,type:'network',show:sh.id,target:target,bonus:bonus,due:S.week,text:'Network: main event of '+sh.name+' rated '+target+'% or better this week ('+money(bonus)+')'});
    return {type:'network',text:'The network wants a big main event on '+sh.name+' this week. '+target+'% or better pays a '+money(bonus)+' bonus.'};
  },
  sponsor:function(S,P){
    if(cal(S.week).wom!==4||S.quests.some(function(q){return q.type==='sponsor';}))return null;
    var target=Math.round(expected(P,{big:true})+3),bonus=Math.round(P.inc0*0.08/1000)*1000;
    S.quests.push({id:S.nid++,type:'sponsor',target:target,bonus:bonus,due:S.week,text:'Sponsor: big event rated '+target+'% or better ('+money(bonus)+')'});
    return {type:'sponsor',text:'A sponsor will pay '+money(bonus)+' if this month’s big event rates '+target+'% or better.'};
  }
};
function genEvents(S){
  var P=S.promos[S.player],all=rosterOf(S,P.id),R=all.filter(function(w){return w.inj<=0&&!w.camp&&!w.nw&&!w.retiring;});
  all.filter(function(w){return w.con<=6&&!w.cn;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,3).forEach(function(w){
    w.cn=true;var ask=renewAsk(S,w);
    pushEv(S,{type:'expire',w:w.id,ask:ask,text:w.name+'’s contract is up in '+Math.max(1,w.con)+' week'+(w.con>1?'s':'')+'. They want '+money(ask)+' a week to stay.',choices:['Renew for 48 weeks at '+money(ask),'Renew for 96 weeks at '+money(Math.round(ask*1.1/50)*50),'Let it run out']});
  });
  EVMAKE.forEach(function(fn){var e=fn(S,P,R);if(e)pushEv(S,e);});
  var types=['shot','losing','offer','team','pitch','buzz','mentor','dream','network','sponsor'],i,j,t;
  for(i=types.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=types[i];types[i]=types[j];types[j]=t;}
  if(S.week===1)types.unshift('network');else if(cal(S.week).wom===4)types.unshift('sponsor');
  var want=S.week===1?1:(chance(S,0.2)?0:(chance(S,0.45)?2:1)),made=0;
  if(cal(S.week).wom===4&&want<1)want=1;
  for(i=0;i<types.length&&made<want;i++){var ev=EV[types[i]](S,P,R);if(ev){pushEv(S,ev);made++;}}
}
function renewAsk(S,w){return Math.round(wageFor(w.ovr,S.promos[S.player])*(1.05+(70-w.morale)/200)*talkDiscount(S)*pledgeRenew(S)/50)*50;}
E.resolveEvent=function(S,id,choice){
  var ev=null;S.inbox.forEach(function(e){if(e.id===id)ev=e;});if(!ev||ev.done)return null;
  var P=S.promos[S.player],w=ev.w!=null?S.w[ev.w]:null,o=ev.o!=null?S.w[ev.o]:null,res='',roll;
  if(EVR[ev.type]){res=EVR[ev.type](S,ev,choice,P,w,o);ev.done=true;ev.result=res;return res;}
  if(ev.type==='shot'){
    if(choice===0){var t=titleById(P,ev.title);S.quests.push({id:S.nid++,type:'shot',w:w.id,title:ev.title,due:S.week+6,text:'Promise: give '+w.name+' a '+t.name+' match by '+cal(S.week+6).label});w.morale=clamp(w.morale+8,0,100);res='You gave your word. '+w.name+' is fired up.';}
    else{w.morale=clamp(w.morale-6,0,100);res=w.name+' is not happy, but accepts it for now.';}
  }else if(ev.type==='losing'){
    if(choice===0){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+2,text:'Promise: book a win for '+w.name+' by '+cal(S.week+2).label});w.morale=clamp(w.morale+5,0,100);res='You promised a win. '+w.name+' will hold you to it.';}
    else{roll=ri(S,1,100);if(roll<=w.morale){w.morale=clamp(w.morale-2,0,100);res='You ask for patience. '+w.name+' agrees to wait.';}else{w.morale=clamp(w.morale-10,0,100);res='You ask for patience. '+w.name+' storms out. Morale drops.';}}
  }else if(ev.type==='offer'){
    var RV=S.promos[ev.rival];
    if(choice===0){w.wage=ev.raise;w.con=48;w.cn=false;w.morale=clamp(w.morale+6,0,100);res=w.name+' re-signs for '+money(ev.raise)+' a week.';}
    else{var stay=false;if(choice===1){roll=ri(S,1,100);stay=roll<=w.morale;res='You make your case. ';}
      if(stay){w.con=Math.max(w.con,24);w.morale=clamp(w.morale+2,0,100);res+=w.name+' stays.';}
      else{leaveCompany(S,w,'left for '+RV.name);joinCompany(S,w,RV);news(S,'contract',w.name+' has jumped to '+RV.name+'.');res+=w.name+' signs with '+RV.name+'.';}}
  }else if(ev.type==='team'){
    if(choice===0&&w.team==null&&o.team==null){formTeam(S,P,w,o,10);w.morale=clamp(w.morale+4,0,100);o.morale=clamp(o.morale+4,0,100);news(S,'story','New team: '+w.name+' & '+o.name+'.');res=w.name+' & '+o.name+' are now a team.';}
    else res='They stay singles wrestlers.';
  }else if(ev.type==='pitch'){
    if(choice===0){var need=Math.round(40+w.mic/2);roll=ri(S,1,100);turn(S,w,'a new attitude');if(roll<=need){addOvr(P,w,3);w.mom=clamp(w.mom+3,-10,10);res='The turn lands. Overness up.';}else{addOvr(P,w,-2.5);res='The crowd does not buy it. Overness down.';}}
    else{w.morale=clamp(w.morale-3,0,100);res=w.name+' shrugs it off.';}
  }else if(ev.type==='mentor'){
    if(choice===0){var up=function(v){return Math.min(99,v+2);};w.brawl=up(w.brawl);w.tech=up(w.tech);w.speed=up(w.speed);o.morale=clamp(o.morale+3,0,100);res=w.name+' is already picking things up from '+o.name+'.';}
    else res='Maybe another time.';
  }else if(ev.type==='expire'){
    if(choice===0||choice===1){w.wage=choice===0?ev.ask:Math.round(ev.ask*1.1/50)*50;w.con=choice===0?48:96;w.cn=false;w.morale=clamp(w.morale+3,0,100);res=w.name+' re-signs for '+money(w.wage)+' a week.';}
    else res=w.name+' will leave when the contract ends.';
  }
  ev.done=true;ev.result=res;return res;
};


/* ===== 50-company.js ===== */
/* ---------- the company: broadcast slot, production, risk, tickets, advertising, sponsors ---------- */
function mkOffer(S,P){
  var used={};S.sponsors.concat(S.spOffers).forEach(function(x){used[x.name]=1;});
  var names=(dbOf(S).sponsors||['Ironclad Tools','Blue Comet Energy','Harbor Lager','Pinnacle Insurance','Redline Auto Parts','Summit Sports Drinks','Big Sky Jerky','Voltage Games']).filter(function(n){return !used[n];});if(!names.length)return null;
  var MD=modelOf(P),type=pick(S,MD.riskFree?['image','rating']:['risk','image','rating']),o={name:pick(S,names),weeks:ri(S,12,36),type:type},mult=1;
  if(type==='risk'){o.val=ri(S,0,2);mult=[1.5,1.2,1][o.val];o.text='Keep the product '+RISKN[o.val]+(o.val?' or tamer':'');}
  else if(type==='image'){o.val=Math.round(P.image-ri(S,0,3));o.text='Popularity stays at '+o.val+' or better';}
  else{var lo=99;Object.keys(P.base).forEach(function(k){if(P.base[k]<lo)lo=P.base[k];});o.val=Math.round(lo+0.6*(P.image-P.image0)-ri(S,5,10));o.text='No show rated under '+o.val+'%';}
  o.pay=Math.max(1000,Math.round(P.inc0*(0.012+rnd(S)*0.02)*mult*mixOf(P).sp/1000)*1000);
  return o;
}
function refreshOffers(S){var P=S.promos[S.player];S.spOffers=[];for(var i=0;i<3;i++){var o=mkOffer(S,P);if(o)S.spOffers.push(o);}}
function sponsorBroken(S,P,x){
  if(x.type==='risk')return P.risk>x.val;
  if(x.type==='image')return P.image<x.val;
  return S.reports.some(function(r){return r.week===S.week&&r.rating<x.val;});
}
NEWX.push(function(S){refreshOffers(S);});
WEEKX.push(function(S){
  var P=S.promos[S.player];
  S.sponsors=S.sponsors.filter(function(x){
    if(sponsorBroken(S,P,x)){news(S,'money',x.name+' pulled its sponsorship: '+x.text.toLowerCase()+' was the deal.');P.image=clamp(P.image-0.3,5,100);return false;}
    x.weeks--;if(x.weeks<=0){news(S,'money','The '+x.name+' sponsorship ran its course.');return false;}
    return true;
  });
  if(S.week%4===0)refreshOffers(S);
  // the network reviews your slot
  if(P.slot>0&&(P.image<SLOT_REQ[P.slot]-5||P.risk>SLOT_RISK[P.slot])){P.slot--;news(S,'money','The network moved '+P.name+' down to '+SLOTN[P.slot].toLowerCase()+'.');}
});
E.setCompany=function(S,k,v){
  var P=S.promos[S.player],max={prodLvl:4,risk:3,tix:3,adv:3,camp:3,med:3,trv:2}[k];if(max==null||!S.owner.me)return;
  P[k]=clamp(Math.round(v),0,max);if(k==='risk'){var rr=riskRange(P);P.risk=clamp(P.risk,rr[0],rr[1]);}
};
E.sponsorOk=function(S,o){var P=S.promos[S.player];return S.sponsors.length<spMax(P)&&!(o.type==='risk'&&P.risk>o.val)&&!(o.type==='image'&&P.image<o.val);};
E.acceptSponsor=function(S,i){var o=S.spOffers[i];if(!o||!E.sponsorOk(S,o))return null;S.spOffers.splice(i,1);S.sponsors.push(o);news(S,'money',o.name+' signed on as a sponsor for '+money(o.pay)+' a week.');return o.name+' is on board for '+o.weeks+' weeks.';};
E.dropSponsor=function(S,i){var o=S.sponsors[i];if(!o)return null;S.sponsors.splice(i,1);return 'You ended the '+o.name+' deal.';};
E.slotOdds=function(S){
  var P=S.promos[S.player],to=P.slot+1;if(to>2)return {can:false,why:'You already have the best slot there is.'};
  if(P.risk>SLOT_RISK[to])return {can:false,why:'The network will not put an '+RISKN[P.risk].toLowerCase()+' product in '+SLOTN[to].toLowerCase()+'.'};
  if(P.image<SLOT_REQ[to])return {can:false,why:SLOTN[to]+' needs popularity '+SLOT_REQ[to]+'. You are at '+P.image.toFixed(1)+'.'};
  if(S.week-S.slotAsk<8)return {can:false,why:'The network will not take another meeting for '+(8-(S.week-S.slotAsk))+' weeks.'};
  return {can:true,to:to,p:clamp(0.25+(P.image-SLOT_REQ[to])/40+(P.trend||0)/20,0.05,0.9)};
};
E.askSlot=function(S){
  var P=S.promos[S.player],o=E.slotOdds(S);if(!o.can)return o.why;
  S.slotAsk=S.week;var roll=rnd(S);
  if(roll<o.p){P.slot=o.to;news(S,'money','The network moved '+P.name+' up to '+SLOTN[P.slot].toLowerCase()+'.');return 'The network says yes. You move to '+SLOTN[P.slot].toLowerCase()+': more viewers, and room for '+SLOT_MAX[P.slot]+' matches a show.';}
  S.quests.push({id:S.nid++,type:'prove',left:2,due:S.week+12,text:'Network: beat expectations on your next two TV shows to earn the better slot'});
  return 'The network says not yet, but leaves a door open: beat expectations on your next two TV shows and the slot is yours.';
};
E.company=function(S){var P=S.promos[S.player],rr=riskRange(P);return {riskMin:rr[0],riskMax:rr[1],spMax:spMax(P),adCost:ADV_C.map(function(c){return Math.round(c*P.inc0);}),prodCost:PRODF.map(function(f){return Math.round(P.prod*f/PRODF[P.prod0]);}),tixP:TIX_P,tixD:TIX_D,slotV:SLOT_V.map(function(v){return v/SLOT_V[P.slot0];}),slotReq:SLOT_REQ};};

/* ===== 55-preshow.js ===== */
/* ---------- before the bell: something goes wrong (or right) and you make a call ---------- */
EFX.push(function(ctx,w){return ctx.m.eff&&ctx.m.eff[w.id]?ctx.m.eff[w.id]:0;});
function showKey(S){var sh=S.queue[S.qi];return sh?S.week+':'+sh.id:'';}
function onCard(card){var o={};card.forEach(function(m,i){flat(m.sides).forEach(function(id){if(o[id]==null)o[id]=i;});});return o;}
E.preShow=function(S,card){
  var key=showKey(S);if(!key||S.over)return null;
  if(S.pre&&S.pre.key===key)return S.pre.done?null:S.pre;
  S.pre={key:key,done:true};
  if(!chance(S,0.38))return null;
  var P=S.promos[S.player],oc=onCard(card),ids=Object.keys(oc).map(Number),n=card.length,pre=null,w,mi,m;
  var kind=pick(S,['travel','banged','truck','protect','walkup','walkup']);
  if(kind==='travel'&&ids.length){
    w=S.w[pick(S,ids)];mi=oc[w.id];
    pre={type:'travel',w:w.id,mi:mi,text:w.name+'’s flight is delayed. They may not make it to the building in time for match '+(mi+1)+'.',choices:['Pull '+w.name+' and find a replacement',mi<n-1?'Move the match to later in the show':'Go on as planned and hope']};
  }else if(kind==='banged'&&ids.length&&ids.some(function(id){return S.w[id].cond<78;})){
    var tired=ids.map(function(id){return S.w[id];}).sort(function(a,b){return a.cond-b.cond;})[0];w=tired;mi=oc[w.id];
    pre={type:'banged',w:w.id,mi:mi,text:w.name+' is banged up tonight ('+Math.round(w.cond)+'% condition) and the trainer wants a word about match '+(mi+1)+'.',choices:['Work the match as planned','Keep the match short','Pull '+w.name+' and find a replacement']};
  }else if(kind==='truck'){
    var cost=Math.round(P.prod*0.5/1000)*1000;
    pre={type:'truck',cost:cost,text:'The production truck has a fault. The lighting rig and half the cameras are down.',choices:['Pay '+money(cost)+' for an emergency fix','Run the show without them']};
  }else if(kind==='protect'){
    var c=[];card.forEach(function(mm,i){if(mm.mt!=='1v1'||mm.title||!(mm.win>=0))return;var l=S.w[mm.sides[mm.win===0?1:0][0]];if(inFeud(S,l.id)&&!feudOf(S,mm.sides[0][0],mm.sides[1][0]))c.push([l,i]);});
    if(c.length){var p=pick(S,c);w=p[0];mi=p[1];var f=feudsFor(S,w.id)[0];
      pre={type:'protect',w:w.id,mi:mi,text:'The writers suggest protecting '+w.name+' in match '+(mi+1)+'. A clean loss tonight would take the shine off the feud with '+S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]].name+'.',choices:['Protect '+w.name+' with a disqualification finish','Stick to the plan']};}
  }
  if(!pre&&kind==='walkup'||(!pre&&chance(S,0.5))){
    var up=chance(S,0.55);S.hype=(S.hype||0)+(up?0.08:-0.08);
    pre={type:'walkup',text:up?'The box office reports a big walk-up crowd. The building will be fuller and louder than expected.':'Bad weather has hit the walk-up. Expect some empty seats tonight.',choices:['Noted']};
  }
  if(!pre)return null;
  pre.key=key;pre.done=false;pre.result=null;S.pre=pre;return pre;
};
function replaceOn(S,card,mi,w){
  var P=S.promos[S.player],show=S.queue[S.qi],oc=onCard(card),m=card[mi];
  var cands=eligible(S,P,show).filter(function(x){return oc[x.id]==null&&x.g===w.g&&x.id!==w.id;}).sort(function(a,b){return Math.abs(a.ovr-w.ovr)-Math.abs(b.ovr-w.ovr);});
  if(m.title){var t=titleById(P,m.title);if(t&&t.holders.indexOf(w.id)>=0)m.title=null;}
  if(!cands.length){card.splice(mi,1);return null;}
  m.sides.forEach(function(s){var k=s.indexOf(w.id);if(k>=0)s[k]=cands[0].id;});
  return cands[0];
}
E.resolvePre=function(S,card,choice){
  var pre=S.pre;if(!pre||pre.done)return null;
  var P=S.promos[S.player],w=pre.w!=null?S.w[pre.w]:null,m=pre.mi!=null?card[pre.mi]:null,res='',r;
  if(pre.mi!=null&&(!m||(w&&flat(m.sides).indexOf(w.id)<0))){pre.done=true;pre.result='The card changed, so it no longer matters.';return pre.result;}
  if(pre.type==='travel'){
    if(choice===0){r=replaceOn(S,card,pre.mi,w);res=r?r.name+' steps in for '+w.name+'.':'No replacement was available, so the match is off the card.';}
    else if(pre.mi<card.length-1){var mv=card.splice(pre.mi,1)[0];card.splice(card.length-1,0,mv);(mv.eff=mv.eff||{})[w.id]=-12;res=w.name+' arrives with minutes to spare and goes on cold. The match moves to the semi-main slot.';}
    else{(m.eff=m.eff||{})[w.id]=-12;res=w.name+' makes it, just, and goes on cold.';}
  }else if(pre.type==='banged'){
    if(choice===0){m.hurt=w.id;(m.eff=m.eff||{})[w.id]=-6;res=w.name+' will work through it. The risk of a real injury is much higher tonight.';}
    else if(choice===1){m.len='S';if(m.stip==='iron')m.stip='std';res='Match '+(pre.mi+1)+' is cut short to protect '+w.name+'.';}
    else{r=replaceOn(S,card,pre.mi,w);res=r?r.name+' steps in for '+w.name+'.':'No replacement was available, so the match is off the card.';}
  }else if(pre.type==='truck'){
    if(choice===0){P.cash-=pre.cost;res='The crew gets it working ten minutes before air. That cost '+money(pre.cost)+'.';}
    else{S.rateMod=(S.rateMod||0)-2;res='The show goes out looking cheaper than usual. It will cost a couple of points.';}
  }else if(pre.type==='protect'){
    if(choice===0){m.ff='dq';res=w.name+' will lose by disqualification and keep the heat for the feud.';}
    else res='The plan stands. '+w.name+' does the job clean.';
  }else res=pre.text;
  pre.done=true;pre.result=res;return res;
};

/* ===== 60-rpg.js ===== */
/* ---------- attempts: a chance of success built from what helps and what hurts, shown before you choose ----------
   Under the hood it is two six-sided numbers plus modifiers against a target; the player only ever sees the chance. */
var P2D6=[1,1,1,35/36,33/36,30/36,26/36,21/36,15/36,10/36,6/36,3/36,1/36];
function odds(target,mod){var k=target-mod;return k<=2?1:(k>12?0:P2D6[k]);}
function mkCheck(target,mods){mods=mods.filter(function(m){return m&&m.v;});var mod=0;mods.forEach(function(m){mod+=m.v;});return {target:target,mods:mods,mod:mod,p:odds(target,mod)};}
function rollCheck(S,ck){var a=ri(S,1,6),b=ri(S,1,6),tot=a+b+ck.mod;return {d:[a,b],mod:ck.mod,target:ck.target,total:tot,ok:tot>=ck.target};}
function rollText(r){return r.ok?'The attempt worked. ':'The attempt did not come off. ';}
function moraleMod(w){return {n:'Morale '+Math.round(w.morale),v:w.morale>=85?2:(w.morale>=70?1:(w.morale<35?-2:(w.morale<50?-1:0)))};}
function trustMod(S){var t=S.trust==null?60:S.trust;return {n:'Locker-room trust '+Math.round(t),v:t>=75?1:(t<40?-1:0)};}
var SKILLMOD=[];   // later systems (your booker's skills) add modifiers here: fn(S,kind) -> {n,v}
function skillMods(S,kind){return SKILLMOD.map(function(fn){return fn(S,kind);});}
function addChecks(S,ev){
  var P=S.promos[S.player],w=ev.w!=null?S.w[ev.w]:null;
  if(ev.type==='losing')ev.checks={1:mkCheck(7,[moraleMod(w),trustMod(S)].concat(skillMods(S,'talk')))};
  else if(ev.type==='offer'){var RV=S.promos[ev.rival];ev.checks={1:mkCheck(8,[moraleMod(w),trustMod(S),{n:'Your popularity against theirs',v:P.image>=RV.image?1:(RV.image-P.image>20?-1:0)},{n:'Holds a title here',v:holdLvl(P,w.id)>0?1:0}].concat(skillMods(S,'talk')))};}
  else if(ev.type==='pitch')ev.checks={0:mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=80?1:(w.mic<65?-1:0)},{n:'A crowd ready for a change',v:w.mom<=-3?1:0}].concat(skillMods(S,'creative')))};
  else if(ev.type==='flop')ev.checks={0:mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=75?1:0},{n:'Second attempt',v:1}].concat(skillMods(S,'creative')))};
}

/* ---------- fail forward: a failed attempt starts a different story ---------- */
EVR.losing=function(S,ev,choice,P,w){
  if(choice===0){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+2,text:'Promise: book a win for '+w.name+' by '+cal(S.week+2).label});w.morale=clamp(w.morale+5,0,100);return 'You promised a win. '+w.name+' will hold you to it.';}
  var r=rollCheck(S,ev.checks[1]);ev.roll=r;
  if(r.ok){w.morale=clamp(w.morale-2,0,100);return rollText(r)+w.name+' agrees to be patient.';}
  w.morale=clamp(w.morale-6,0,100);w.arc={t:'grievance'};
  return rollText(r)+w.name+' is not taking it quietly. Expect them to say so on the next show, and the crowd may well take their side.';
};
EVR.offer=function(S,ev,choice,P,w){
  var RV=S.promos[ev.rival];
  if(choice===0){w.wage=ev.raise;w.con=48;w.cn=false;w.morale=clamp(w.morale+6,0,100);return w.name+' re-signs for '+money(ev.raise)+' a week.';}
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){w.con=Math.max(w.con,24);w.morale=clamp(w.morale+2,0,100);return rollText(r)+w.name+' stays.';}
    w.notice=S.week+2;w.to=ev.rival;
    return rollText(r)+w.name+' gives notice and joins '+RV.name+' in two weeks. Until then they are yours to book: a clean loss on the way out will make whoever beats them.';
  }
  if(choice===3){
    var t=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w.g&&x.holders.length&&x.holders.indexOf(w.id)<0&&(!x.brand||x.brand===w.brand)&&(!t||x.lvl>t.lvl))t=x;});
    w.wage=ev.beat||Math.round(w.wage*1.45/50)*50;w.con=60;w.cn=false;w.morale=clamp(w.morale+12,0,100);
    if(t)S.quests.push({id:S.nid++,type:'shot',w:w.id,title:t.id,due:S.week+8,text:'Promise: give '+w.name+' a '+t.name+' match by '+cal(S.week+8).label});
    RV.rel=clamp((RV.rel||0)-4,-100,100);
    return w.name+' stays at '+money(w.wage)+' a week on a 60-week deal'+(t?', with your word on a shot at the '+t.name+'.':'.')+' '+RV.name+' will not forget being outbid.';
  }
  leaveCompany(S,w,'left for '+RV.name);joinCompany(S,w,RV);news(S,'contract',w.name+' has jumped to '+RV.name+'.');return w.name+' signs with '+RV.name+'.';
};
EVR.pitch=function(S,ev,choice,P,w){
  if(choice!==0){w.morale=clamp(w.morale-3,0,100);return w.name+' shrugs it off.';}
  var r=rollCheck(S,ev.checks[0]);ev.roll=r;turn(S,w,'a new attitude');
  if(r.ok){addOvr(P,w,3);w.mom=clamp(w.mom+3,-10,10);return rollText(r)+'The turn lands. Overness up.';}
  w.arc={t:'flop',until:S.week+4,asked:false};
  return rollText(r)+'The crowd is not buying the new '+w.name+'. Reactions will suffer for a month, and you will have a decision to make.';
};
EVR.flop=function(S,ev,choice,P,w){
  if(choice===0){
    var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){w.arc=null;addOvr(P,w,4);w.mom=clamp(w.mom+3,-10,10);return rollText(r)+'Doubling down worked. The crowd finally gets it, and '+w.name+' comes out of this a bigger star.';}
    w.arc={t:'flop',until:S.week+3,asked:true};addOvr(P,w,-1);return rollText(r)+'Still nothing. '+w.name+' is stuck with it for another three weeks.';
  }
  turn(S,w,'back where they belong');w.arc=null;addOvr(P,w,1);w.morale=clamp(w.morale-2,0,100);return w.name+' goes back to what worked. The crowd is relieved.';
};
EVR.counter=function(S,ev,choice,P,w){
  if(choice===0&&wagesWeek(S,P)+ev.ask>E.budget(S))return S.owner.name+' will not sign off on that: it breaks the wage budget.';
  if(choice===0&&w.promo!==P.id&&E.canSign(S,w)){var from=w.promo;if(from!=='FA')leaveCompany(S,w,'left for '+P.name);joinCompany(S,w,P,ev.ask,ev.weeks);news(S,'contract',P.name+' signed '+w.name+(from!=='FA'?' away from '+S.promos[from].name:'')+'.');award(S,from==='FA'?'ACH_SIGN':'ACH_POACH');return w.name+' signs for '+money(ev.ask)+' a week.';}
  w.lock=S.week+4;return 'You walk away. '+w.name+' will not talk again for a month.';
};
EVMAKE.push(function(S,P,R){
  var c=R.filter(function(w){return w.arc&&w.arc.t==='flop'&&!w.arc.asked;})[0];if(!c)return null;c.arc.asked=true;
  return {type:'flop',w:c.id,text:'The new '+c.name+' is not connecting. The writers want to know what to do.',choices:['Double down on it','Turn '+c.name+' back']};
});
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.notice&&S.week>=w.notice&&w.promo===S.player){var RV=S.promos[w.to];w.notice=0;leaveCompany(S,w,'left for '+RV.name);joinCompany(S,w,RV);news(S,'contract',w.name+' has left for '+RV.name+'.');}
    if(w.arc&&w.arc.t==='flop'&&S.week>w.arc.until)w.arc=null;
  });
});
POST.push(function(ctx){
  var r=ctx.res;if(!ctx.isPl||r.win<0)return;
  r.losers.forEach(function(l){if(l.notice&&(r.fin==='clean'||r.fin==='flash')){r.winners.forEach(function(w){addOvr(ctx.P,w,2);w.mom=clamp(w.mom+3,-10,10);});r.seg.notes.push(l.name+' puts '+names(r.winners)+' over on the way out. That is how you make a new star.');}});
});
ANGX.push(function(S,P,show,ctx,h){
  var c=h.pool.filter(function(w){return w.arc&&w.arc.t==='grievance'&&!h.ang[w.id];})[0];if(!c)return null;
  return [9,function(){
    c.arc=null;h.mark(c);var sc=promoScore(S,c,8);addOvr(P,c,1);c.mom=clamp(c.mom+3,-10,10);
    S.quests.push({id:S.nid++,type:'win',w:c.id,due:S.week+3,text:'The crowd is behind '+c.name+' now: book them a win by '+cal(S.week+3).label});
    return angle('Interview',c.name+' takes a live microphone and says the losing has gone on long enough. It sounds a little too real, and the crowd roars in agreement.',sc);
  }];
});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||show.big)return;
  S.quests.slice().forEach(function(q){
    if(q.type!=='prove')return;
    if(rep.rating>rep.exp){q.left--;if(q.left<=0){P.slot=Math.min(2,P.slot+1);news(S,'money','You proved it. The network moved '+P.name+' up to '+SLOTN[P.slot].toLowerCase()+'.');rep.quest.push('The network is convinced: you move to '+SLOTN[P.slot].toLowerCase()+'.');award(S,'ACH_QUEST');dropQuest(S,q);}else q.text='Network: beat expectations on one more TV show to earn the better slot';}
    else{rep.quest.push('The network wanted a show above expectations. The slot upgrade is off the table.');dropQuest(S,q);}
  });
});

/* ---------- gimmicks: a character type that either fits the wrestler or does not ---------- */
var GIMS=[
  {id:'brute',n:'Brute',f:function(w){return w.brawl*0.6+(w.style==='P'||w.style==='B'?28:0)+(w.align==='H'?8:0);}},
  {id:'cocky',n:'Cocky',f:function(w){return w.mic*0.6+(w.align==='H'?35:5);}},
  {id:'underdog',n:'Underdog',f:function(w){return (w.align==='F'?35:0)+(100-w.ovr)*0.3+w.speed*0.3;}},
  {id:'daredevil',n:'Daredevil',f:function(w){return w.speed*0.7+(w.style==='H'?25:0);}},
  {id:'technician',n:'Technician',f:function(w){return w.tech*0.7+(w.style==='T'?25:0);}},
  {id:'monster',n:'Monster',f:function(w){return (w.style==='P'?35:0)+w.brawl*0.4+(100-w.mic)*0.2;}},
  {id:'oldhand',n:'Old hand',f:function(w){return workRate(w)*0.45+w.ovr*0.45+5;}},
  {id:'rebel',n:'Rebel',f:function(w){return w.mic*0.4+w.brawl*0.3+22;}},
  {id:'hero',n:'Clean-cut hero',f:function(w){return (w.align==='F'?35:0)+w.ovr*0.3+workRate(w)*0.3;}},
  {id:'showman',n:'Showman',f:function(w){return w.mic*0.5+(w.style==='E'?35:0)+w.ovr*0.2;}},
  {id:'mystic',n:'Mystic',f:function(w){return (100-w.mic)*0.3+(w.align==='H'?20:10)+w.ovr*0.3+15;}},
  {id:'workhorse',n:'Workhorse',f:function(w){return workRate(w)*0.6+w.stam*0.35;}},
  {id:'outlaw',n:'Outlaw',f:function(w){return (w.align==='H'?25:5)+w.brawl*0.5+w.mic*0.25;}},
  {id:'comedy',n:'Comedy',f:function(w){return (w.style==='E'?40:0)+w.mic*0.5;}}
];
var GIMBY={};GIMS.forEach(function(g){GIMBY[g.id]=g;});
function gimFit(w){var g=GIMBY[w.gim];return g?clamp(Math.round(g.f(w)+(w.gr!=null?(w.gr-60)*0.3:0)),0,100):60;}
function assignGim(w){var best=null,bs=-1;for(var k=0;k<3;k++){var g=GIMS[hash(w.name+'g'+k)%GIMS.length],s=g.f(w);if(s>bs){bs=s;best=g;}}w.gim=best.id;w.gw=0;}
function initGimmicks(S){S.w.forEach(assignGim);}
CRX.push(function(ctx){
  var d=0,S=ctx.S,flop=null;
  ctx.all.forEach(function(w){
    var x=clamp((gimFit(w)-60)/14,-2.5,2.5);
    if(w.gw&&S.week-w.gw<=4)x+=1;else if(w.gw&&S.week-w.gw>60)x-=1;
    if(w.arc&&w.arc.t==='flop'){x-=3;flop=w;}
    d+=x;
  });
  d/=ctx.all.length;
  return {d:d,x:flop?'The crowd is rejecting the new '+flop.name:(d>=1.2?'Characters the crowd believes in':(d<=-1.2?'Gimmicks that are not connecting':null))};
});
E.repackOdds=function(S,id,gim){
  var w=S.w[id],old=w.gim;w.gim=gim;var fit=gimFit(w);w.gim=old;
  return mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=75?1:(w.mic<50?-1:0)},{n:'How well it suits them',v:fit>=70?1:(fit<45?-1:0)}].concat(skillMods(S,'creative')));
};
E.repackage=function(S,id,gim){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id||!GIMBY[gim]||gim===w.gim)return null;
  if(w.gcd>S.week)return w.name+' was repackaged recently. Give it until '+cal(w.gcd).label+'.';
  var r=rollCheck(S,E.repackOdds(S,id,gim));w.gim=gim;w.gw=S.week;w.gcd=S.week+12;
  if(r.ok){w.mom=clamp(w.mom+2,-10,10);return rollText(r)+w.name+' debuts the new '+GIMBY[gim].n.toLowerCase()+' character to a good reaction.';}
  w.arc={t:'flop',until:S.week+4,asked:false};return rollText(r)+'The '+GIMBY[gim].n.toLowerCase()+' character falls flat. Reactions will suffer for a month.';
};

/* ---------- earned traits ---------- */
var TRAITS={
  bigmatch:{n:'Big-match performer',d:'Raises their game at big events.'},
  giant:{n:'Giant killer',d:'The crowd believes in them as an underdog.'},
  iron:{n:'Iron lungs',d:'Stamina to go long.'},
  fav:{n:'Crowd favourite',d:'A bigger reaction as a face.'},
  hated:{n:'Most hated',d:'A bigger reaction as a heel.'},
  horse:{n:'Workhorse',d:'Loses less condition per match.'},
  closer:{n:'Closer',d:'Raises their game in main events.'},
  tag:{n:'Tag specialist',d:'Better tag matches.'},
  aura:{n:'Unbeatable aura',d:'A long winning streak left a mark on the crowd.'}
};
function has(w,t){return w.tr&&w.tr.indexOf(t)>=0;}
function earn(ctx,w,t){
  if(has(w,t))return;(w.tr=w.tr||[]).push(t);
  if(t==='iron')w.stam=Math.min(99,w.stam+8);
  if(w.promo===ctx.S.player){ctx.res.seg.notes.push(w.name+' has earned a trait: '+TRAITS[t].n+'.');news(ctx.S,'story',w.name+' earned a trait: '+TRAITS[t].n+'.');}
}
function bump(w,k){w.ct=w.ct||{};w.ct[k]=(w.ct[k]||0)+1;return w.ct[k];}
EFX.push(function(ctx,w){return (ctx.big&&has(w,'bigmatch')?6:0)+(ctx.isMain&&has(w,'closer')?4:0);});
MQX.push(function(ctx){if(ctx.m.mt!=='tag')return null;var n=ctx.all.filter(function(w){return has(w,'tag');}).length;return n?{d:Math.min(2,n*0.6),x:n>=2?'Tag specialists at work':null}:null;});
CRX.push(function(ctx){
  var d=0,lab=null,ov=ctx.all.map(function(w){return w.ovr;}),top=Math.max.apply(null,ov);
  ctx.all.forEach(function(w){
    if(has(w,'fav')&&w.align==='F'){d+=1.5;lab=w.name+' is a crowd favourite';}
    if(has(w,'hated')&&w.align==='H'){d+=1.5;lab='The crowd loves to hate '+w.name;}
    if(has(w,'aura'))d+=1;
    if(has(w,'giant')&&top-w.ovr>=10){d+=2;lab='They believe '+w.name+' can pull off the upset';}
  });
  return d?{d:Math.min(4,d),x:lab}:null;
});
POST.push(function(ctx){
  var r=ctx.res,P=ctx.P;
  ctx.all.forEach(function(w){
    if(bump(w,'m')>=25)earn(ctx,w,'horse');
    if(has(w,'horse'))w.cond=clamp(w.cond+ctx.mins*0.11,5,100);
    if(ctx.mins>=20&&bump(w,'long')>=5)earn(ctx,w,'iron');
    if(ctx.m.mt==='tag'&&bump(w,'tag')>=15)earn(ctx,w,'tag');
    if(ctx.big&&r.OV>=(P.base.big||80)+2&&bump(w,'big')>=3)earn(ctx,w,'bigmatch');
    if(ctx.isMain&&!ctx.big&&r.OV>=(P.mainB[ctx.show.id]||80)&&bump(w,'main')>=8)earn(ctx,w,'closer');
  });
  if(r.win<0)return;
  r.winners.forEach(function(w){
    if(r.upset&&bump(w,'upset')>=2)earn(ctx,w,'giant');
    if(w.ws>=10)earn(ctx,w,'aura');
    if(w.ws>=6&&w.align==='F')earn(ctx,w,'fav');
    if(w.align==='H'&&(r.fin==='cheap'||r.fin==='interf')&&bump(w,'cheap')>=5)earn(ctx,w,'hated');
  });
});

/* ---------- stables and managers ---------- */
var STABLEN=['The Iron Circle','Night Shift','The Foundry','Cold Front','The Ledger','Black Harbor','The Standard','Sixth Street','The Understudies','House Money','The Long Table','Grey Market'];
function stableOf(S,w){if(w.stable==null)return null;for(var i=0;i<S.stables.length;i++)if(S.stables[i].id===w.stable)return S.stables[i];return null;}
function endStable(S,st,why){st.m.forEach(function(id){S.w[id].stable=null;});S.stables=S.stables.filter(function(x){return x!==st;});news(S,'story',st.name+' are finished'+(why?': '+why:'')+'.');}
function leaveStable(S,w){var st=stableOf(S,w);if(!st)return;w.stable=null;st.m=st.m.filter(function(id){return id!==w.id;});if(st.leader===w.id||st.m.length<2)endStable(S,st,st.leader===w.id?'the leader is gone':'not enough members left');}
function stableMates(S,rivals,all){
  var out=[];rivals.forEach(function(r){var st=stableOf(S,r);if(st)st.m.forEach(function(id){var w=S.w[id];if(w.id!==r.id&&all.indexOf(w)<0&&w.inj<=0&&w.promo===r.promo&&!(w.away>=S.week)&&out.indexOf(w)<0)out.push(w);});});
  return out;
}
function micOf(S,w){var m=w.mgr!=null?S.w[w.mgr]:null;return m&&m.promo===w.promo&&m.inj<=0?Math.max(w.mic,Math.round(m.mic*0.92)):w.mic;}
function hasMouthpiece(S,w){var m=w.mgr!=null?S.w[w.mgr]:null;return !!(m&&m.promo===w.promo&&m.inj<=0&&m.mic>w.mic);}
NEWX.push(function(S){S.stables=[];});
ANGX.push(function(S,P,show,ctx,h){
  if(S.stables.filter(function(s){return s.promo===P.id;}).length>=2)return null;
  var hs=h.pool.filter(function(w){return w.align==='H'&&w.stable==null&&!h.ang[w.id];}).sort(function(a,b){return b.ovr-a.ovr;});
  if(hs.length<6)return null;
  return [0.9,function(){
    var L=hs.slice(0,Math.max(2,Math.floor(hs.length/4))).filter(function(w){return w.mic>=60;});if(!L.length)return null;
    var lead=pick(S,L),ms=hs.filter(function(w){return w.id!==lead.id&&w.g===lead.g&&w.ovr<lead.ovr-3&&w.ovr>lead.ovr-30&&(!lead.brand||w.brand===lead.brand);}).slice(0,2);
    if(ms.length<2)return null;
    var used={};S.stables.forEach(function(s){used[s.name]=1;});var nm=STABLEN.filter(function(n){return !used[n];});if(!nm.length)return null;
    var st={id:S.nid++,promo:P.id,name:pick(S,nm),leader:lead.id,m:[lead.id,ms[0].id,ms[1].id],formed:S.week,tension:0};
    S.stables.push(st);st.m.forEach(function(id){S.w[id].stable=st.id;});h.mark(lead,ms[0],ms[1]);
    news(S,'story','A new stable: '+st.name+' ('+lead.name+', '+ms[0].name+' and '+ms[1].name+').');
    return angle('Announcement',lead.name+' steps out flanked by '+ms[0].name+' and '+ms[1].name+'. From tonight they answer to one name: '+st.name+'.',promoScore(S,lead,6));
  }];
});
ANGX.push(function(S,P,show,ctx,h){
  var st=S.stables.filter(function(s){return s.promo===P.id&&s.tension>=10&&h.ok(s.leader);})[0];if(!st)return null;
  var outs=st.m.filter(function(id){return id!==st.leader&&h.ok(id);});if(!outs.length)return null;
  return [8,function(){
    var lead=S.w[st.leader],weakIds=E.stableWeak(S,st).map(function(x){return x.id;}).filter(function(id){return outs.indexOf(id)>=0;}),out=S.w[(weakIds.length?weakIds:outs).sort(function(a,b){return S.w[a].mom-S.w[b].mom;})[0]];
    h.mark(lead,out);leaveStable(S,out);if(out.align==='H')turn(S,out,'thrown out of '+st.name);
    var f=startFeud(S,P,out,lead,50,lead.name+' threw '+out.name+' out of '+st.name,{force:true});if(f)f.twist='expelled';memBetray(S,lead,out);st.tension=3;
    return angle('Betrayal',lead.name+' blames '+out.name+' for everything going wrong in '+st.name+'. The rest of the group turns on '+out.name+' and leaves them lying in the ring.',0.8*(lead.ovr+out.ovr)/2+10);
  }];
});
POST.push(function(ctx){
  var r=ctx.res,S=ctx.S;if(r.win<0||!S.stables)return;
  r.losers.forEach(function(w){var st=stableOf(S,w);if(st)st.tension+=w.id===st.leader?2:1;});
  r.winners.forEach(function(w){var st=stableOf(S,w);if(st)st.tension=Math.max(0,st.tension-0.5);});
});
E.setManager=function(S,id,mid){var w=S.w[id];if(!w||w.promo!==S.player)return;if(mid==null||mid===''||isNaN(mid)){w.mgr=null;return;}S.w.forEach(function(x){if(x.mgr===+mid&&x.promo===w.promo)x.mgr=null;});w.mgr=+mid;};
E.mouthpieces=function(S,id){var w=S.w[id];return rosterOf(S,w.promo).filter(function(x){return x.id!==w.id&&x.mic>=70&&x.mic>w.mic&&(x.nw||(x.g===w.g&&(!w.brand||x.brand===w.brand)));}).sort(function(a,b){return b.mic-a.mic;});};
E.gimFit=gimFit;E.GIMS=GIMS;E.TRAITS=TRAITS;E.stableOf=stableOf;E.micOf=micOf;E.odds=odds;

/* ===== 65-you.js ===== */
/* ---------- you: the booker, the owner you answer to, and booking power ---------- */
var STYLES={
  stars:{n:'Star system',d:'The biggest names win. Overness counts for more than anything else.',likes:'star power in the main event'},
  merit:{n:'Sport',d:'The better wrestler on a roll wins. Work rate and momentum count for more.',likes:'a great match on every show'},
  drama:{n:'Soap opera',d:'Villains cheat their way through the build and get what is coming at the big event. Expect more upsets.',likes:'feuds on every show'},
  heroes:{n:'Heroes and villains',d:'Heels win on TV, and heroes win the big ones.',likes:'a hero standing tall at the end of the night'}
};
var ROOTS={
  tradition:{n:'Tradition',d:'Clean finishes are rewarded. Cheap finishes and non-finishes cost more.'},
  rebellion:{n:'Rebellion',d:'Rule-breaking is the brand. Cheap heel wins and gimmick matches go over better.'},
  family:{n:'Family entertainment',d:'A face winning the main event lifts the show. A heel winning it deflates it.'}
};
var PLEDGE={
  pay:{n:'Fair pay',d:'Morale runs higher, but contract renewals cost a little more.'},
  chance:{n:'Opportunity',d:'The lower card works harder, but anyone left off the shows for a month gets unhappy fast.'},
  stable:{n:'Stability',d:'Renewals are cheaper and morale is steadier, but every release shakes the whole locker room.'}
};
var SKILLS={
  creative:{n:'Creative',max:5,d:'Better angles, hotter feuds, and better odds on creative gambles.'},
  talk:{n:'Negotiation',max:5,d:'Cheaper contracts and better odds when you have to talk someone round.'},
  eye:{n:'Eye for talent',max:3,d:'1: see potential. 2: see ring chemistry. 3: your staff spot more problems.'},
  motivator:{n:'Motivator',max:5,d:'More effort in the ring and steadier morale.'},
  clout:{n:'Clout',max:3,d:'One more point of booking power every week.'}
};
function cap1(t){return t.charAt(0).toUpperCase()+t.slice(1);}
function xpNeed(l){return 80+50*l;}
function gainXp(S,n){
  var b=S.booker;if(!b||S.cal)return;b.xp+=Math.round(n);
  while(b.xp>=xpNeed(b.lvl)&&b.lvl<22){b.xp-=xpNeed(b.lvl);b.lvl++;b.pts++;news(S,'you','You reached booker level '+b.lvl+'. You have a skill point to spend.');if(b.lvl>=5)award(S,'ACH_LEVEL5');}
}
function initYou(S,opts){
  var d=S.custom&&S.custom.id===S.player?S.custom:DB.promotions.filter(function(p){return p.id===S.player;})[0],o=d.owner||{name:'The owner',style:'stars',roots:'tradition',pledge:'pay'};
  S.booker={name:String(opts.name||'').trim().slice(0,24)||'The Booker',xp:0,lvl:1,pts:0,sk:{creative:0,talk:0,eye:0,motivator:0,clout:0}};
  if(opts.booker){S.booker.xp=opts.booker.xp;S.booker.lvl=opts.booker.lvl;S.booker.pts=opts.booker.pts;Object.keys(S.booker.sk).forEach(function(k){S.booker.sk[k]=opts.booker.sk[k]||0;});}
  S.owner={name:o.name,trust:55,me:false,style:o.style,roots:o.roots,pledge:o.pledge,lobby:{},asked:0,creedWeek:-99,wage0:wagesWeek(S,S.promos[S.player])};
  S.creedScore=60;S.bp=0;S.rel={};S.stats.calls=0;
  if(d.mine){S.owner.me=true;S.owner.name=S.booker.name;S.owner.creedWeek=1;S.mode='owner';}
}
SKILLMOD.push(function(S,kind){var b=S.booker;if(!b)return null;var l=kind==='creative'?b.sk.creative:b.sk.talk;return {n:(kind==='creative'?'Your creative skill':'Your negotiation skill'),v:l>=4?2:(l>=2?1:0)};});
function talkDiscount(S){return S.booker?1-0.03*S.booker.sk.talk:1;}
function pledgeRenew(S){return S.owner?(S.owner.pledge==='pay'?1.05:(S.owner.pledge==='stable'?0.9:1)):1;}
function moraleTarget(S){var o=S.owner,b=S.booker;return 65+dif(S).mor+((S.trust==null?60:S.trust)-60)/5+(b?1.5*b.sk.motivator:0)+(o?(o.pledge==='pay'?5:(o.pledge==='stable'?3:0)):0);}
E.spendPoint=function(S,k){var b=S.booker,sk=SKILLS[k];if(!sk||b.pts<=0||b.sk[k]>=sk.max)return false;b.sk[k]++;b.pts--;return true;};

/* booking power */
function bpGrant(S){
  var P=S.promos[S.player],n=P.shows.length,b=S.booker,o=S.owner,big=cal(S.week).wom===4?3:0;
  return Math.max(1,(o.me?n*3+2+Math.floor(b.lvl/2):Math.round(n*1.5)+Math.floor(o.trust/25)+Math.floor(b.lvl/3))+b.sk.clout+big+dif(S).bp);
}
function grantBP(S){var g=bpGrant(S);S.bpGrant=g;S.bp=Math.min(g*2,(S.bp||0)+g);}
function matchSetup(S,m){
  var P=S.promos[S.player],show=S.queue[S.qi],def=MT[m.mt];if(!show||!def)return null;
  var ids=flat(m.sides);if(m.sides.length!==def.sides||ids.some(function(id){return id==null||!S.w[id];}))return null;
  var sides=m.sides.map(function(s){return s.map(function(id){return S.w[id];});}),t=m.title?titleById(P,m.title):null,champSide=-1,feud=null,x,y;
  if(t&&!titleFits(t,m))t=null;
  if(t&&t.holders.length){m.sides.forEach(function(s,k){if(t.holders.every(function(h){return s.indexOf(h)>=0;}))champSide=k;});if(champSide<0)t=null;}
  for(x=0;x<ids.length&&!feud;x++)for(y=x+1;y<ids.length&&!feud;y++)feud=feudOf(S,ids[x],ids[y]);
  return {P:P,show:show,sides:sides,t:t,champSide:champSide,feud:feud};
}
E.matchOdds=function(S,m,i,n){
  var c=matchSetup(S,m);if(!c)return null;
  var od=winOdds(S,c.P,c.show,m,c.sides,c.t,c.champSide,c.feud,!!c.show.big,i===n-1),fav=0;
  od.p.forEach(function(p,k){if(p>od.p[fav])fav=k;});
  var cost=od.p.map(function(p,k){return (p>=0.5?1:(p>=0.25?2:3))+(c.t&&c.t.holders.length&&k!==c.champSide?1:0)+ccCost(S,m,k);});
  return {p:od.p,draw:od.draw,fav:fav,cost:cost,drawCost:2,chem:(S.booker.sk.eye>=2&&m.mt==='1v1')?chem(S,c.sides[0][0].id,c.sides[1][0].id):null};
};
function cardCost(S,card){
  var tot=0,n=card.length;
  card.forEach(function(m,i){if(m.call==null)return;var o=E.matchOdds(S,m,i,n);if(!o)return;tot+=m.call<0?o.drawCost:(o.cost[m.call]||1);});
  return tot;
}
function spendBP(S,card){
  var c=cardCost(S,card),n=card.length,long=false;if(!c)return;
  card.forEach(function(m,i){if(m.call!=null&&m.call>=0){var o=E.matchOdds(S,m,i,n);if(o&&o.p[m.call]<0.25)long=true;}});
  if(c>S.bp){S.trust=clamp(S.trust-2*(c-S.bp),0,100);S.bp=0;}else S.bp-=c;
  S.stats.calls+=card.filter(function(m){return m.call!=null;}).length;award(S,'ACH_CALL');if(long)award(S,'ACH_LONGSHOT');
}
E.cardCost=cardCost;

/* the owner judges every show, and the locker room's creed colours the crowd */
FINX.push(function(ctx,fin,winners,losers,win){
  var S=ctx.S;if(!ctx.isPl||!S.owner)return null;var r=S.owner.roots;
  if(r==='tradition'){if(fin==='clean')return {d:1,x:'A clean finish, the way this crowd likes it'};if(fin==='cheap'||fin==='interf')return {d:-1,x:null};if(fin==='dq'||fin==='co')return {d:-1.5,x:null};}
  else if(r==='rebellion'){if(win>=0&&winners[0].align==='H'&&(fin==='cheap'||fin==='interf'))return {d:1.5,x:'They love a villain getting away with it here'};}
  else if(r==='family'&&ctx.isMain&&win>=0)return winners[0].align==='F'?{d:2,x:'The hero won the main event'}:{d:-2,x:'The villain won the main event, and the families went home unhappy'};
  return null;
});
CRX.push(function(ctx){var S=ctx.S;if(!ctx.isPl||!S.owner||S.owner.roots!=='rebellion'||ctx.stip==='std')return null;return {d:1,x:null};});
EFX.push(function(ctx,w){
  var S=ctx.S;if(!ctx.isPl||!S.booker)return 0;var e=S.booker.sk.motivator;
  if(S.owner.pledge==='chance'){if(ctx.rep._med==null){var o=rosterOf(S,ctx.P.id).map(function(x){return x.ovr;}).sort(function(a,b){return a-b;});ctx.rep._med=o[Math.floor(o.length/2)]||0;}if(w.ovr<ctx.rep._med)e+=3;}
  return e;
});
POST.push(function(ctx){var r=ctx.res;r.seg.wi=r.winners.map(function(w){return w.id;});if(ctx.isPl&&r.seg.change)gainXp(ctx.S,5);});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||!S.owner)return;
  var o=S.owner,d=rep.rating-rep.exp,ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1],key=show.big?'big':show.id,like=false;
  if(o.style==='stars')like=rep.mainStar>=(P.starB[key]||0)+1;
  else if(o.style==='merit')like=ms.some(function(s){return s.mq>=85||s.ov>=(P.mainB[key]||80)+3;});
  else if(o.style==='drama')like=rep.segs.some(function(s){return s.feud;})||ms.some(function(s){return s.fx.some(function(f){return /feud/i.test(f.x)&&f.s>0;});});
  else like=!!(main&&main.wi&&main.wi.length&&S.w[main.wi[0]].align==='F');
  // staying true to what the crowd came for
  var r=o.roots,clean=ms.filter(function(s){return s.fin==='clean';}).length/Math.max(1,ms.length);
  var faceWon=!!(main&&main.wi&&main.wi.length&&S.w[main.wi[0]].align==='F');
  var okc=r==='tradition'?clean>=0.6:(r==='rebellion'?ms.some(function(s){return s.stip||s.fin==='cheap'||s.fin==='interf';}):faceWon);
  S.creedScore=clamp(S.creedScore+(okc?4:-5),0,100);
  if(S.creedScore>=75)P.image=clamp(P.image+0.01,5,100);else if(S.creedScore<=35)P.image=clamp(P.image-0.04,5,100);
  gainXp(S,clamp(10+d*3,2,40)*2/(P.shows.length+1));
  if(o.me){rep.owner={me:true,like:like};if(d>=3)S.bp+=1;return;}
  // the company's model colours the verdict: a board cares less about the reviews, a founder who is a fan cares more
  var MD=modelOf(P),mv=MD.show?MD.show(S,P,show,rep):null;
  var dt=(clamp(d*0.5,-3,3)*(MD.ownShow||1)+(like?0.5:(show.big?-0.5:0)))*2/(P.shows.length+1)+(mv?mv.d:0);
  o.trust=clamp(o.trust+dt,0,100);if(d>=3)S.bp+=1;
  rep.owner={d:r1(dt),like:like,bonus:d>=3,text:o.name+(dt>=2?' is delighted.':(dt>=0.5?' is pleased.':(dt>-0.5?' has no complaints.':(dt>-2?' is not impressed.':' is furious.'))))+(like?' You gave them '+STYLES[o.style].likes+'.':'')+(mv?' '+mv.x:'')};
  if(o.trust>=90)award(S,'ACH_OWNER_TRUST');
});
WEEKX.push(function(S){
  var o=S.owner,P=S.promos[S.player];if(!o)return;
  if(S.trust>=90)award(S,'ACH_TRUST');
  if(S.owner.pledge==='chance')rosterOf(S,P.id).forEach(function(w){if(w.inj<=0&&!w.nw&&!w.camp&&S.week-w.lu>=4&&w.morale>30)w.morale-=1;});
  if(o.me)return;
  if(S.fin)o.trust=clamp(o.trust+(S.fin.net<0&&cal(S.week).wom===4?-2:0)+(o.trust>55?-0.3:(o.trust<45?0.2:0)),0,100);
  if(o.trust<=5+dif(S).fire&&!S.over){S.over={why:'fired',week:S.week};award(S,'ACH_FIRED');news(S,'you',o.name+' has let you go.');}
});

/* directives: what the owner wants this month */
function ownerQuest(S){return S.quests.some(function(q){return /^o_/.test(q.type);});}
function directiveDone(S,q,ok,why){
  var o=S.owner;dropQuest(S,q);if(o.me)return;
  if(ok){o.trust=clamp(o.trust+(q.gain||6),0,100);S.bp+=q.bp||2;gainXp(S,20);award(S,'ACH_DIRECTIVE');news(S,'you','Directive met: '+why+' '+o.name+' gives you '+(q.bp||2)+' more booking power.');}
  else{o.trust=clamp(o.trust-(q.loss||6),0,100);news(S,'you','Directive missed: '+why+' '+o.name+' is not happy.');}
}
NEWX.push(function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !isDev(P,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;});
  var f=pick(S,R.slice(0,10));f.fav=true;S.owner.fav=f.id;
  // working relationships are rolled fresh for every game
  S.order.forEach(function(pid){
    var L=rosterOf(S,pid);
    L.forEach(function(w){
      var c=L.filter(function(x){return x.id!==w.id&&x.g===w.g&&x.brand===w.brand;});if(!c.length)return;
      if(chance(S,0.5)){var a=pick(S,c),k=rkey(w.id,a.id);if(S.rel[k]==null)S.rel[k]=1;}
      if(chance(S,0.25)){var b=pick(S,c),k2=rkey(w.id,b.id);if(S.rel[k2]==null)S.rel[k2]=-1;}
    });
  });
});
EVMAKE.push(function(S,P,R){
  var o=S.owner;if(o.me||cal(S.week).wom!==1||ownerQuest(S))return null;
  var kinds=['strong','belt','elevate'],i,j,t;for(i=kinds.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=kinds[i];kinds[i]=kinds[j];kinds[j]=t;}
  for(i=0;i<kinds.length;i++){
    if(kinds[i]==='strong'){
      var f=S.w[o.fav];if(!f||f.promo!==P.id||f.inj>0){var top=R.filter(function(w){return !isDev(P,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,10);if(!top.length)continue;if(f)f.fav=false;f=pick(S,top);f.fav=true;o.fav=f.id;}
      S.quests.push({id:S.nid++,type:'o_strong',w:f.id,due:S.week+3,gain:6,bp:2,text:o.name+': keep '+f.name+' strong this month. No clean losses.'});
      return {type:'directive',w:f.id,text:o.name+' has a favourite. “'+f.name+' is the future of this company. I do not want to see a clean loss this month.”'};
    }
    if(kinds[i]==='belt'){
      var ts=P.titles.filter(function(x){return !x.tag&&x.holders.length&&!isDev(P,x.brand);});if(!ts.length)continue;
      var tt=pick(S,ts),ch=S.w[tt.holders[0]],cs=R.filter(function(w){return w.id!==ch.id&&w.g===tt.g&&holdLvl(P,w.id)===0&&(!tt.brand||w.brand===tt.brand)&&Math.abs(w.ovr-ch.ovr)<=14&&(o.style!=='heroes'||w.align==='F');}).sort(function(a,b){return b.ovr+b.mom*2-a.ovr-a.mom*2;});
      if(!cs.length)continue;var c=cs[0];
      S.quests.push({id:S.nid++,type:'o_belt',w:c.id,title:tt.id,due:S.week+7,gain:8,bp:3,loss:6,text:o.name+': get the '+tt.name+' on '+c.name+' by '+cal(S.week+7).label});
      return {type:'directive',w:c.id,text:o.name+' wants a change at the top. “I want the '+tt.name+' on '+c.name+' within two months. How you get there is your business.”'};
    }
    if(kinds[i]==='elevate'){
      var ms=R.filter(function(w){return w.ovr>=40&&w.ovr<=66&&!isDev(P,w.brand)&&!hasQuest(S,w.id);});if(!ms.length)continue;
      var m=pick(S,ms),tg=Math.round(m.ovr+4);
      S.quests.push({id:S.nid++,type:'o_elevate',w:m.id,target:tg,due:S.week+7,gain:6,bp:2,loss:4,text:o.name+': build '+m.name+' to '+tg+' overness by '+cal(S.week+7).label});
      return {type:'directive',w:m.id,text:o.name+' sees something in '+m.name+'. “Make me a star. I want '+m.name+' at '+tg+' overness in two months.”'};
    }
  }
  return null;
});
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(!ctx.isPl)return;
  S.quests.slice().forEach(function(q){
    if(q.type==='o_strong'&&r.win>=0&&r.losers.some(function(w){return w.id===q.w;})&&(r.fin==='clean'||r.fin==='flash')){r.seg.notes.push(S.owner.name+' is not going to like that. '+S.w[q.w].name+' was supposed to be kept strong.');directiveDone(S,q,false,S.w[q.w].name+' lost clean.');}
    else if(q.type==='o_belt'&&r.seg.change&&ctx.t&&ctx.t.id===q.title&&r.winners.some(function(w){return w.id===q.w;})){r.seg.notes.push('That is exactly what '+S.owner.name+' asked for.');directiveDone(S,q,true,S.w[q.w].name+' has the title.');}
  });
});
WEEKX.push(function(S){S.quests.slice().forEach(function(q){if(q.type==='o_elevate'&&S.w[q.w].ovr>=q.target)directiveDone(S,q,true,S.w[q.w].name+' is at '+q.target+' overness.');});});
QEND.o_strong=function(S,q){directiveDone(S,q,true,S.w[q.w].name+' stayed strong all month.');};
QEND.o_belt=function(S,q){directiveDone(S,q,false,S.w[q.w].name+' never got the title.');};
QEND.o_elevate=function(S,q){directiveDone(S,q,false,S.w[q.w].name+' did not get there.');};

/* taking over the company */
EVMAKE.push(function(S){
  var o=S.owner,b=S.booker;if(o.me||b.lvl<5||o.trust<80||S.week<30||S.week-o.asked<12)return null;o.asked=S.week;
  return {type:'handover',text:o.name+' calls you in. “I am stepping back. You have earned this. The company is yours if you want it.”',choices:['Take the keys','Not yet']};
});
EVR.handover=function(S,ev,choice){
  if(choice!==0)return 'You tell '+S.owner.name+' you are not ready. The offer will come round again.';
  var o=S.owner,old=o.name;o.me=true;o.name=S.booker.name;o.pending=true;if(o.fav!=null&&S.w[o.fav])S.w[o.fav].fav=false;o.fav=null;
  S.quests=S.quests.filter(function(q){return !/^o_/.test(q.type);});
  award(S,'ACH_OWNER');news(S,'you',old+' has handed '+S.promos[S.player].name+' to '+S.booker.name+'.');grantBP(S);
  return 'The company is yours. Set your house style on the Manage screen. Nobody grants you booking power now: you have more of it, and you can overrule past it at a cost to locker-room trust.';
};
EVR.directive=function(){return '';};
function recalibrate(S,pid){
  var C=JSON.parse(JSON.stringify(S));C.cal=true;C.player=null;var P=C.promos[pid],RP=S.promos[pid],d0=RP.image-RP.image0;
  P.shows.concat([{id:'big',big:true,name:'x'}]).forEach(function(sh){
    var rs=[],mains=[],stars=[];for(var k=0;k<4;k++){var rep=runShow(C,P,sh,autoBook(C,P,sh));rs.push(rep.rating);mains.push(rep.mainOv);stars.push(rep.mainStar);restAll(C,pid);}
    RP.base[sh.id]=r1(avg(rs)-0.6*d0);RP.starB[sh.id]=r1(avg(stars));
  });
}
E.setCreed=function(S,c){
  var o=S.owner,P=S.promos[S.player];if(!o.me)return 'Only the owner sets the house style.';
  if(!o.pending&&S.week-o.creedWeek<12)return 'You changed the house style recently. The crowd needs until '+cal(o.creedWeek+12).label+' to settle.';
  if(STYLES[c.style])o.style=c.style;if(ROOTS[c.roots])o.roots=c.roots;if(PLEDGE[c.pledge])o.pledge=c.pledge;
  P.style=o.style;o.pending=false;o.creedWeek=S.week;S.creedScore=60;recalibrate(S,P.id);
  return 'The house style is set: '+STYLES[o.style].n+', '+ROOTS[o.roots].n.toLowerCase()+', '+PLEDGE[o.pledge].n.toLowerCase()+'.';
};

/* as a booker you have to talk the owner into company changes, and stay inside the wage budget */
E.budget=function(S){var P=S.promos[S.player];return S.owner.me?Infinity:Math.round(S.owner.wage0*(1.12+Math.max(0,P.image-P.image0)*0.02)/1000)*1000;};
E.lobbyOdds=function(S,k,v){
  var P=S.promos[S.player],o=S.owner,up=v>P[k],costly=(k==='prodLvl'||k==='adv'||k==='camp'||k==='med'||k==='trv')?up:(k==='tix'?!up:false);
  return mkCheck(8,[{n:'Owner’s trust '+Math.round(o.trust),v:o.trust>=75?2:(o.trust>=55?1:(o.trust<35?-1:0))},{n:costly?'It costs the owner money':'It saves or makes money',v:costly?-1:(k==='risk'?0:1)}].concat(skillMods(S,'talk')));
};
E.lobby=function(S,k,v){
  var o=S.owner,rr=riskRange(S.promos[S.player]);
  if(k==='risk'&&(v<rr[0]||v>rr[1]))return {ok:false,msg:cap1(modelOf(S.promos[S.player]).ph)+' cannot run '+(/^[AEIOU]/.test(RISKN[v])?'an ':'a ')+RISKN[v]+' product.'};
  if(o.lobby[k]&&S.week-o.lobby[k]<4)return {ok:false,msg:o.name+' has heard enough about that for now. Bring it up again after '+cal(o.lobby[k]+4).label+'.'};
  var r=rollCheck(S,E.lobbyOdds(S,k,v));o.lobby[k]=S.week;
  if(r.ok){S.promos[S.player][k]=v;return {ok:true,msg:rollText(r)+o.name+' agrees.'};}
  o.trust=clamp(o.trust-1,0,100);return {ok:false,msg:rollText(r)+o.name+' says no.'};
};
E.jobOffers=function(S){var cur=S.promos[S.player].image;var L=S.order.filter(function(id){return id!==S.player&&S.promos[id].image<cur;});if(!L.length)L=S.order.filter(function(id){return id!==S.player;});return L;};

/* relationships: who clicks in the ring and who does not */
function relOf(S,a,b){var r=S.rel?S.rel[rkey(a,b)]||0:0;if(!r&&S.bond){var bd=S.bond[rkey(a,b)]||0;r=bd>=3?1:(bd<=-3?-1:0);}return r;}   // the bond score only speaks once it is strong
MQX.push(function(ctx){
  var S=ctx.S,d=0,lab=null;
  ctx.sides.forEach(function(s,k){
    if(s.length>1){var r=relOf(S,s[0].id,s[1].id);if(r>0){d+=1.5;lab='Partners who click';}else if(r<0){d-=2;lab='Partners who do not mesh';}}
    for(var j=k+1;j<ctx.sides.length;j++)s.forEach(function(p){ctx.sides[j].forEach(function(q){var r2=relOf(S,p.id,q.id);if(r2>0){d+=1;lab=lab||'Opponents who trust each other';}else if(r2<0)d-=1;});});
  });
  return d?{d:clamp(d,-3,3),x:lab}:null;
});
E.relations=function(S,id){var w=S.w[id],good=[],bad=[];rosterOf(S,w.promo).forEach(function(x){if(x.id===w.id)return;var r=relOf(S,w.id,x.id);if(r>0)good.push(x);else if(r<0)bad.push(x);});return {good:good,bad:bad};};

/* advisors: three voices look over your card before it runs */
E.advice=function(S,card){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return [];
  var agent=[],writer=[],ann=[],n=card.length,on={},twice={},extra=S.booker.sk.eye>=3?1:0;
  card.forEach(function(m){flat(m.sides).forEach(function(id){if(id!=null){if(on[id])twice[id]=1;on[id]=1;}});});
  card.forEach(function(m,i){
    var c=matchSetup(S,m);if(!c)return;var all=flat(c.sides),mins=(m.stip==='iron'?30:(LEN[m.len]||12))+(show.big?4:0)+(i===n-1?3:0);
    all.forEach(function(w){var zs=E.zones(S,w.id).sort(function(a,b){return b.v-a.v;})[0];if(zs.v>=65&&m.int!=='safe')agent.push(w.name+'\u2019s '+zs.n.toLowerCase()+(zs.k==='n'||zs.k==='b'?' is':' are')+' in a bad way ('+zs.v+'). Book match '+(i+1)+' safe, or give them the week off.');
      if(w.cond<50)agent.push(w.name+' is running on fumes ('+Math.round(w.cond)+'%). Match '+(i+1)+' will suffer.');else if(mins>6+w.stam*0.25+3)agent.push(w.name+' cannot go '+mins+' minutes. Shorten match '+(i+1)+'.');});
    if(m.mt==='1v1'){
      var ch=chem(S,all[0].id,all[1].id),gap=Math.abs(all[0].ovr-all[1].ovr);
      if(ch>=2.2)agent.push(all[0].name+' and '+all[1].name+' have real chemistry. Give match '+(i+1)+' time.');else if(ch<=-2.2)agent.push(all[0].name+' and '+all[1].name+' do not click in the ring. Keep match '+(i+1)+' short or change it.');
      if(gap>25&&mins>7)agent.push('Match '+(i+1)+' is a squash. Keep it short.');
      if(all[0].align===all[1].align&&!c.feud)writer.push('Match '+(i+1)+' is '+(all[0].align==='F'?'face against face. Who do they boo?':'heel against heel. Who do they cheer?'));
      var rk=S.recent[P.id+':'+rkey(all[0].id,all[1].id)];if(rk&&S.week-rk<4&&!c.feud)ann.push('We just saw '+all[0].name+' against '+all[1].name+'. The crowd will not care a second time.');
    }
    if(m.mt==='tag')c.sides.forEach(function(s){if(s[0].team==null||s[0].team!==s[1].team)agent.push(names(s)+' are not a regular team. Expect a rough match.');else if(relOf(S,s[0].id,s[1].id)<0)agent.push(names(s)+' do not mesh as partners.');});
    if(c.feud&&c.feud.heat>=60&&!show.big&&m.stip==='std')writer.push(feudLabel(S,c.feud)+' is hot enough to end. Save that match for the big event, or it will only simmer on.');
    if(m.call==null){var od=winOdds(S,P,show,m,c.sides,c.t,c.champSide,c.feud,!!show.big,i===n-1);S.quests.forEach(function(q){if(q.type==='win'||q.type==='o_strong'){var k=-1;c.sides.forEach(function(s,x){if(s.some(function(w){return w.id===q.w;}))k=x;});if(k>=0&&od.p[k]<0.6)writer.push(S.w[q.w].name+' is only '+Math.round(od.p[k]*100)+'% to win match '+(i+1)+', and you have a promise riding on it. Consider calling it.');}});}
  });
  activeFeuds(S).forEach(function(f){
    if(f.promo!==P.id)return;var a=S.w[f.a[0]],b=S.w[f.b[0]],av=function(w){return w.inj<=0&&!(w.away>=S.week)&&(show.big||!show.brand||w.brand===show.brand);};
    if(!av(a)||!av(b))return;
    if(!(on[a.id]&&on[b.id]))writer.push('Nothing tonight for '+feudLabel(S,f)+'? Both need to be on the show or the feud cools.');
    else if(show.big&&f.heat>=60&&!card.some(function(m){var ids=flat(m.sides);return ids.indexOf(a.id)>=0&&ids.indexOf(b.id)>=0;}))writer.push('This is the night to finish '+feudLabel(S,f)+'. Put them in a match.');
  });
  P.titles.forEach(function(t){if(!t.holders.length||(!show.big&&t.brand&&show.brand&&t.brand!==show.brand))return;if(S.week-t.last>=6&&!card.some(function(m){return m.title===t.id;}))writer.push('The '+t.name+' has not been defended in '+(S.week-t.last)+' weeks.');});
  if(n){var mc=matchSetup(S,card[n-1]);if(mc){var star=avg(flat(mc.sides).map(function(w){return w.ovr;})),base=P.starB[show.big?'big':show.id]||star;if(star<base-5)ann.push('That main event will not sell a ticket. The crowd expects bigger names on last.');}}
  if(card.filter(function(m){return m.stip&&m.stip!=='std';}).length>=2)ann.push('Two gimmick matches on one show. The second one will fall flat.');
  Object.keys(twice).forEach(function(id){ann.push(S.w[id].name+' is working twice tonight. The second reaction will be weaker.');});
  var pool=eligible(S,P,show).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,8).filter(function(w){return !on[w.id]&&S.week-w.lu>=3;});
  if(pool.length)ann.push(pool[0].name+' has been off the shows for '+(S.week-pool[0].lu)+' weeks. People are asking.');
  var out=[],cap=2+extra;
  [[P.staff.agent+', road agent',agent],[P.staff.writer+', head writer',writer],[P.ann[0]+', lead announcer',ann]].forEach(function(x){out.push({who:x[0],tips:x[1].filter(function(t,i,a){return a.indexOf(t)===i;}).slice(0,cap)});});
  return out;
};
E.STYLES=STYLES;E.ROOTS=ROOTS;E.PLEDGE=PLEDGE;E.SKILLS=SKILLS;E.xpNeed=xpNeed;E.bpGrant=bpGrant;

/* ===== 70-season.js ===== */
/* ---------- contender rankings ---------- */
function rankFor(S,P,t,n){
  var L=rosterOf(S,P.id).filter(function(w){return w.g===t.g&&t.holders.indexOf(w.id)<0&&w.inj<=0&&!w.camp&&!w.nw&&(!t.brand||w.brand===t.brand)&&isDev(P,w.brand)===isDev(P,t.brand)&&holdLvl(P,w.id)<t.lvl;});
  if(t.lvl<3&&L.length){var top=Math.max.apply(null,L.map(function(w){return w.ovr;}));L=L.filter(function(w){return w.ovr<=top-(t.lvl===2?3:10);});}
  return L.map(function(w){return {w:w,s:(w.pts||0)+w.ovr*0.12+w.mom*0.3+(w.shot===t.id?50:0)};}).sort(function(a,b){return b.s-a.s;}).slice(0,n||5).map(function(x){return x.w;});
}
POST.push(function(ctx){
  var r=ctx.res;if(r.win<0)return;
  var wa=avg(r.winners.map(function(w){return w.ovr;})),la=avg(r.losers.map(function(w){return w.ovr;}));
  var st=0.6+ctx.P.image/125;
  r.winners.forEach(function(w){var p=3+(la>wa?1:0)+(ctx.big?2:0)+(ctx.isMain?1:0);w.pts=(w.pts||0)+p;w.yp=(w.yp||0)+p*st;w.cp=(w.cp||0)+p;});
  if(ctx.m.mt!=='br')r.losers.forEach(function(w){w.pts=Math.max(0,(w.pts||0)-1);});
});
/* a battle royal win is a title shot in the bank; a stable fighting as a unit gets a hand */
POST.push(function(ctx){
  var r=ctx.res,P=ctx.P;if(ctx.m.mt!=='br'||r.win<0)return;
  if(ctx.isPl)award(ctx.S,'ACH_BR');
  if(ctx.t)return;
  var w=r.winners[0],tt=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w.g&&x.holders.length&&x.holders[0]!==w.id&&(!x.brand||x.brand===w.brand)&&isDev(P,x.brand)===isDev(P,w.brand)&&x.lvl>holdLvl(P,w.id)&&(!tt||x.lvl>tt.lvl))tt=x;});
  if(!tt)return;w.shot=tt.id;w.pts=(w.pts||0)+6;r.seg.notes.push(w.name+' has earned a shot at the '+tt.name+'.');
});
CRX.push(function(ctx){
  if(ctx.m.mt!=='6man')return null;var d=0;
  ctx.sides.forEach(function(s){var st=stableOf(ctx.S,s[0]);if(st&&s.every(function(w){return stableOf(ctx.S,w)===st;}))d+=2;});
  return d?{d:d,x:'A stable fighting as a unit'}:null;
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.pts)w.pts=Math.round(w.pts*90)/100;});
  // a short prestige history for every title, so the Titles page can show which way it is moving
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){var h=t.ph||(t.ph=[]);h.push(Math.round(t.prestige*10)/10);if(h.length>8)h.shift();});});});
CRX.push(function(ctx){
  var t=ctx.t;if(!t||t.tag||ctx.champSide<0||ctx.m.mt!=='1v1')return null;
  var ch=ctx.sides[ctx.champSide===0?1:0][0];
  if(ch.shot===t.id)return {d:3,x:'A challenger who earned the shot the hard way'};
  var rk=rankFor(ctx.S,ctx.P,t,5).map(function(w){return w.id;}),ix=rk.indexOf(ch.id);
  return ix<0?{d:-3,x:'The challenger has not earned a title shot'}:(ix<=1?{d:2,x:'The top contender gets the shot'}:null);
});
POST.push(function(ctx){var t=ctx.t;if(t)ctx.all.forEach(function(w){if(w.shot===t.id)w.shot=null;});});
E.rankFor=function(S,tid,n){var P=S.promos[S.player],t=titleById(P,tid);return t&&!t.tag?rankFor(S,P,t,n||5):[];};

/* ---------- tournaments: an eight-wrestler knockout or a six-wrestler league ---------- */
function tournActive(S){return S.tourn&&!S.tourn.done?S.tourn:null;}
function koPairs(ids){return [[ids[0],ids[7]],[ids[3],ids[4]],[ids[1],ids[6]],[ids[2],ids[5]]];}
E.tournOk=function(S,tid,fmt){
  var P=S.promos[S.player],t=titleById(P,tid);if(!t||t.tag)return 'Tournaments are for singles titles.';
  if(tournActive(S))return 'Finish the '+S.tourn.name+' first.';
  var need=fmt==='rr'?6:8;if(rankFor(S,P,t,need).length<need)return 'Not enough healthy contenders for that ('+need+' needed).';
  return null;
};
E.startTourn=function(S,tid,fmt){
  var why=E.tournOk(S,tid,fmt);if(why)return why;
  var P=S.promos[S.player],t=titleById(P,tid),need=fmt==='rr'?6:8,ents=rankFor(S,P,t,need).map(function(w){return w.id;}),T;
  T=S.tourn={id:S.nid++,promo:P.id,title:t.id,fmt:fmt,name:t.name.replace(/ Titles?$/,'')+(fmt==='rr'?' League':' Tournament'),ents:ents,round:1,pend:[],res:[],pts:{},done:false,start:S.week};
  if(fmt==='rr'){for(var i=0;i<ents.length;i++){T.pts[ents[i]]=0;for(var j=i+1;j<ents.length;j++)T.pend.push([ents[i],ents[j]]);}}
  else{T.pend=koPairs(ents);T.br={1:koPairs(ents)};}
  news(S,'story','The '+T.name+' begins: '+ents.map(function(id){return S.w[id].name;}).join(', ')+'.');
  return 'The '+T.name+' is set. Book the listed matches on your shows; the suggested card includes them.';
};
function tournAdvance(S,T){
  var P=S.promos[T.promo],t=titleById(P,T.title);
  if(T.pend.length)return;
  var champ=null;
  if(T.fmt==='rr'){champ=T.ents.slice().sort(function(a,b){return (T.pts[b]-T.pts[a])||(S.w[b].ovr-S.w[a].ovr);})[0];}
  else{
    var ws=T.res.filter(function(r){return r.round===T.round;}).map(function(r){return r.w;});
    // winners are paired by their place in the bracket, not by the order the matches were run in
    if(T.br&&T.br[T.round]){var prs=T.br[T.round],ow=[];prs.forEach(function(pr){var rr=T.res.filter(function(x){return x.round===T.round&&((x.a===pr[0]&&x.b===pr[1])||(x.a===pr[1]&&x.b===pr[0]));})[0];if(rr)ow.push(rr.w);});if(ow.length===prs.length)ws=ow;}
    if(ws.length>1){T.round++;var nx=[];for(var i=0;i<ws.length;i+=2){T.pend.push([ws[i],ws[i+1]]);nx.push([ws[i],ws[i+1]]);}if(T.br)T.br[T.round]=nx;return;}
    champ=ws[0];
  }
  T.done=true;T.champ=champ;var w=S.w[champ];mile(S,w,'tourn','Won the '+T.name);w.mom=clamp(w.mom+3,-10,10);addOvr(P,w,1.5);
  if(t.holders[0]===champ){news(S,'story',w.name+' won the '+T.name+' as champion. Nobody is left to argue.');t.prestige=clamp(t.prestige+3,10,100);}
  else if(!t.holders.length){t.holders=[champ];t.since=S.week;t.defs=0;ystat(S,w)[6]++;mile(S,w,'title','Won the vacant '+P.name+' '+t.name);news(S,'title',w.name+' won the '+T.name+' and the vacant '+P.name+' '+t.name+'.');}
  else{w.shot=t.id;startFeud(S,P,w,S.w[t.holders[0]],45,w.name+' won the '+T.name+' and a shot at the '+t.name,{title:t.id,force:true});news(S,'story',w.name+' won the '+T.name+' and a shot at the '+t.name+'.');}
  if(P.id===S.player){gainXp(S,25);award(S,'ACH_TOURN');}
}
function tournPair(T,a,b){for(var i=0;i<T.pend.length;i++){var p=T.pend[i];if((p[0]===a&&p[1]===b)||(p[0]===b&&p[1]===a))return i;}return -1;}
CRX.push(function(ctx){var T=tournActive(ctx.S);if(!T||!ctx.isPl||ctx.m.mt!=='1v1'||tournPair(T,ctx.all[0].id,ctx.all[1].id)<0)return null;return {d:2,x:'Tournament stakes'};});
POST.push(function(ctx){
  var S=ctx.S,T=tournActive(S),r=ctx.res;if(!T||!ctx.isPl||ctx.m.mt!=='1v1')return;
  var a=ctx.all[0].id,b=ctx.all[1].id,ix=tournPair(T,a,b);if(ix<0)return;
  if(T.fmt==='rr'){
    T.pend.splice(ix,1);if(r.win<0){T.pts[a]+=1;T.pts[b]+=1;}else T.pts[r.winners[0].id]+=2;
    T.res.push({a:a,b:b,w:r.win<0?-1:r.winners[0].id,week:S.week,round:1});
    r.seg.notes.push(T.name+': '+(r.win<0?'a point each.':r.winners[0].name+' takes two points.'));
  }else{
    if(r.win<0||r.fin==='dq'||r.fin==='co'){r.seg.notes.push('No clear winner. The '+T.name+' match will have to be run again.');return;}
    T.pend.splice(ix,1);T.res.push({a:a,b:b,w:r.winners[0].id,week:S.week,round:T.round});
    r.seg.notes.push(r.winners[0].name+' advances in the '+T.name+'.');
  }
  tournAdvance(S,T);
  if(T.done)r.seg.notes.push(S.w[T.champ].name+' wins the '+T.name+'!');
});
WEEKX.push(function(S){
  var T=tournActive(S);if(!T)return;
  T.pend.slice().forEach(function(p){
    var a=S.w[p[0]],b=S.w[p[1]],ga=a.promo!==T.promo||a.inj>=2||a.camp,gb=b.promo!==T.promo||b.inj>=2||b.camp;if(!ga&&!gb)return;
    T.pend.splice(T.pend.indexOf(p),1);var w=ga&&gb?(a.ovr>=b.ovr?a:b):(ga?b:a);
    if(T.fmt==='rr')T.pts[w.id]=(T.pts[w.id]||0)+2;T.res.push({a:a.id,b:b.id,w:w.id,week:S.week,round:T.round,bye:true});
    news(S,'story',w.name+' gets a walkover in the '+T.name+'.');
  });
  tournAdvance(S,T);
});

/* ---------- title histories and the record book ---------- */
function syncTitles(S){
  S.order.forEach(function(pid){var P=S.promos[pid];P.titles.forEach(function(t){
    t.hist=t.hist||[];var last=t.hist[t.hist.length-1],cur=t.holders.slice().sort().join(',');
    if(last&&last.to==null&&last.ids===cur){last.defs=t.defs;return;}
    if(last&&last.to==null){last.to=S.week;}
    if(cur)t.hist.push({ids:cur,h:t.holders.map(function(id){return S.w[id].name;}),from:S.week,to:null,show:S.week<=1?'Before your time':(P.last?P.last.name:''),defs:0});
    if(t.hist.length>60)t.hist.shift();
  });});
}
NEWX.push(function(S){S.rec={matches:[],shows:[],gate:null,buys:null,streak:null};S.year={};S.awards=[];S.hof=[];S.w.forEach(function(w){w.oy=w.ovr;});syncTitles(S);});
SHOWX.push(function(S,P,show,rep){
  syncTitles(S);if(P.id!==S.player)return;
  var R=S.rec,Y=S.year;
  rep.segs.forEach(function(s){if(s.k!=='match')return;
    R.matches.push({l:s.label,ov:s.ov,show:rep.name,w:S.week});
    if(!Y.match||s.ov>Y.match.ov)Y.match={l:s.label,ov:s.ov,show:rep.name,w:S.week};
  });
  R.matches.sort(function(a,b){return b.ov-a.ov;});R.matches.length=Math.min(10,R.matches.length);
  R.shows.push({n:rep.name,r:rep.rating,w:S.week});R.shows.sort(function(a,b){return b.r-a.r;});R.shows.length=Math.min(5,R.shows.length);
  if(!Y.show||rep.rating>Y.show.r)Y.show={n:rep.name,r:rep.rating,w:S.week};
  if(!R.gate||rep.att>R.gate.v)R.gate={v:rep.att,n:rep.name,w:S.week};
  if(rep.buys&&(!R.buys||rep.buys>R.buys.v))R.buys={v:rep.buys,n:rep.name,w:S.week};
  rosterOf(S,P.id).forEach(function(w){if(w.ws>=3&&(!R.streak||w.ws>R.streak.v))R.streak={v:w.ws,n:w.name,w:S.week};});
  S.feuds.forEach(function(f){if(f.res&&!f.dead&&f.end===S.week&&f.promo===P.id&&(!Y.feud||f.heat>Y.feud.h))Y.feud={l:feudLabel(S,f),h:Math.round(f.heat),w:S.week};});
});

/* ---------- year-end awards and the hall of fame ---------- */
function yearEnd(S){
  var P=S.promos[S.player],yr=cal(S.week).year,Y=S.year||{},L=[],all=S.w.filter(function(w){return w.promo!=='FA';}),mine=rosterOf(S,P.id);
  var by=function(arr,f){return arr.slice().sort(function(a,b){return f(b)-f(a);})[0];};
  var woy=by(all,function(w){return w.yp||0;}),mwoy=by(mine,function(w){return w.yp||0;}),imp=by(mine,function(w){return w.ovr-(w.oy==null?w.ovr:w.oy);});
  if(woy&&woy.yp){L.push({k:'Wrestler of the year',v:woy.name+' ('+S.promos[woy.promo].name+')'});mile(S,woy,'award','Wrestler of the year, '+yr);}
  if(mwoy&&mwoy.yp){L.push({k:P.name+' wrestler of the year',v:mwoy.name});addOvr(P,mwoy,1);mwoy.morale=clamp(mwoy.morale+5,0,100);}
  if(Y.match)L.push({k:'Match of the year',v:Y.match.l+', '+Y.match.ov+'% at '+Y.match.show});
  if(Y.feud)L.push({k:'Feud of the year',v:Y.feud.l});
  if(Y.show)L.push({k:'Show of the year',v:Y.show.n+', '+Y.show.r+'%'});
  if(imp&&imp.ovr-imp.oy>=2)L.push({k:'Most improved',v:imp.name+' (+'+Math.round(imp.ovr-imp.oy)+' overness)'});
  var tm=by(S.teams.filter(function(t){return t.promo===P.id;}),function(t){return t.exp;});if(tm)L.push({k:'Tag team of the year',v:S.w[tm.m[0]].name+' & '+S.w[tm.m[1]].name});
  var pr=by(S.order.map(function(id){return S.promos[id];}),function(p){return p.image-(p.imgY==null?p.image0:p.imgY);});if(pr)L.push({k:'Promotion of the year',v:pr.name});
  S.awards.unshift({year:yr,list:L});
  news(S,'world','The '+yr+' awards are in. '+(woy?woy.name+' is wrestler of the year.':''));
  S.inbox.push({id:S.nid++,type:'awards',text:'The '+yr+' year-end awards: '+L.map(function(x){return x.k+': '+x.v;}).join('. ')+'.',done:true,result:null});
  S.w.forEach(function(w){w.yp=0;w.oy=w.ovr;});S.order.forEach(function(id){S.promos[id].imgY=S.promos[id].image;});S.year={};S.hofDue=true;
  if(P.id===S.player)award(S,'ACH_AWARDS');
}
WEEKX.push(function(S){syncTitles(S);var c=cal(S.week);if(c.month===11&&c.wom===4)yearEnd(S);});
EVMAKE.push(function(S,P){
  if(!S.hofDue)return null;S.hofDue=false;
  var c=rosterOf(S,P.id).filter(function(w){return !w.hof&&(w.ovr>=75||(w.cp||0)>=60||(w.tr&&w.tr.length>=2));}).sort(function(a,b){return (b.cp||0)+b.ovr*2-(a.cp||0)-a.ovr*2;}).slice(0,3);
  if(!c.length)return null;
  return {type:'hof',c:c.map(function(w){return w.id;}),text:'It is hall of fame season. Who goes in this year?',choices:c.map(function(w){return 'Induct '+w.name;}).concat(['Nobody this year'])};
});
EVR.hof=function(S,ev,choice,P){
  var id=ev.c[choice];if(id==null)return 'No induction this year.';
  var w=S.w[id];w.hof=true;mile(S,w,'hof','Inducted into the '+P.name+' hall of fame');S.hof.unshift({n:w.name,year:cal(S.week).year,p:P.name});addOvr(P,w,1);w.morale=clamp(w.morale+10,0,100);P.image=clamp(P.image+0.3,5,100);
  news(S,'story',w.name+' was inducted into the '+P.name+' hall of fame.');award(S,'ACH_HOF');
  return w.name+' takes a place in the hall of fame. The ceremony is a moment the crowd will remember.';
};
E.power=function(S,n){return S.w.filter(function(w){return w.promo!=='FA';}).sort(function(a,b){return ((b.yp||0)+b.ovr*0.25)-((a.yp||0)+a.ovr*0.25);}).slice(0,n||10);};

/* ---------- training camp ---------- */
var CAMP_CAP=[0,4,8,12],CAMP_C=[0,0.004,0.009,0.015],CAMPN=['None','Small gym','Training centre','Performance institute'];
var FOCUS={ring:'In-ring work',mic:'Promos',cond:'Conditioning'};
function campCost(P){return Math.round(CAMP_C[P.camp||0]*P.inc0);}
WEEKX.push(function(S){
  var P=S.promos[S.player],lv=P.camp||0;
  S.w.forEach(function(w){
    if(w.promo==='FA')return;var Q=S.promos[w.promo];
    if(isDev(Q,w.brand)&&workRate(w)<w.pot)w.xp+=0.1;
    if(!w.camp||w.promo!==P.id)return;
    var rate=0.6+0.2*lv;addOvr(P,w,-0.2);w.lu=S.week;w.cond=100;
    if(w.focus==='mic'){var cap=Math.min(88,w.mic0+15);if(w.mic<cap){w.micx=(w.micx||0)+0.45*rate;if(w.micx>=1){w.micx-=1;w.mic++;}}}
    else if(w.focus==='cond'){if(w.stam<90){w.stx=(w.stx||0)+0.6*rate;if(w.stx>=1){w.stx-=1;w.stam++;}}}
    else if(workRate(w)<w.pot){w.xp+=0.42*rate;if(w.xp>=1){w.xp-=1;w.brawl=Math.min(99,w.brawl+1);w.tech=Math.min(99,w.tech+1);w.speed=Math.min(99,w.speed+1);}}
    else if(chance(S,0.05)){w.pot=Math.min(99,w.pot+1);}
  });
});
E.campInfo=function(S){var P=S.promos[S.player],n=rosterOf(S,P.id).filter(function(w){return w.camp;}).length;return {lvl:P.camp||0,cap:CAMP_CAP[P.camp||0],n:n,cost:campCost(P),names:CAMPN,costs:CAMP_C.map(function(c){return Math.round(c*P.inc0);}),caps:CAMP_CAP};};
E.sendCamp=function(S,id,focus){
  var w=S.w[id],P=S.promos[S.player],i=E.campInfo(S);if(!w||w.promo!==P.id)return null;
  if(!w.camp&&i.n>=i.cap)return 'The camp is full ('+i.cap+' places). Call someone up or ask for a bigger one.';
  if(holdLvl(P,w.id)>0)return w.name+' is a champion. Champions do not go to camp.';
  if(!w.camp){leaveStable(S,w);var tm=teamOf(S,w);if(tm)dissolveTeam(S,tm);S.feuds.forEach(function(f){if(!f.res&&(f.a.indexOf(w.id)>=0||f.b.indexOf(w.id)>=0)){f.res=true;f.dead=true;f.end=S.week;}});}
  if(!w.camp){w.cw0=workRate(w);w.cm0=w.mic;}w.camp=true;w.focus=FOCUS[focus]?focus:'ring';if(w.mic0==null)w.mic0=w.mic;
  return w.name+' is in camp, working on '+FOCUS[w.focus].toLowerCase()+'. They are off the shows until you call them up.';
};
E.callUp=function(S,id){var w=S.w[id];if(!w||!w.camp)return null;w.camp=false;w.deb=true;w.mom=clamp(w.mom+2,-10,10);w.lu=S.week;if(workRate(w)>(w.cw0||999)||w.mic>(w.cm0||999))award(S,'ACH_GRAD');return w.name+' is back on the active roster.';};
WEEKX.push(function(S){var P=S.promos[S.player],L=rosterOf(S,P.id).filter(function(w){return w.camp;}),cap=CAMP_CAP[P.camp||0];while(L.length>cap){var w=L.pop();E.callUp(S,w.id);news(S,'story',w.name+' was sent back from camp: there is no longer room.');}});
E.FOCUS=FOCUS;E.tournActive=tournActive;

/* Housekeeping: retired wrestlers who never held a title do not need their year lines, recent results or long logs.
   Keeps the save small in a long game (about 1.4 MB at week 300). Runs every 26 weeks. */
WEEKX.push(function(S){
  if(S.week%26!==0)return;
  var champs={};S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){String(h.ids||'').split(',').forEach(function(id){champs[id]=1;});});t.holders.forEach(function(id){champs[id]=1;});});});
  S.w.forEach(function(w){
    if(!w.rt||champs[w.id])return;
    delete w.rr;delete w.ys;delete w.bz;
    if(w.log&&w.log.length>6)w.log=w.log.slice(0,1).concat(w.log.slice(-5));
  });
  // old head-to-head and recent-match keys nobody will read again
  var keys=Object.keys(S.recent||{});if(keys.length>1500)keys.forEach(function(k){if(S.week-S.recent[k]>26)delete S.recent[k];});
});

/* ===== 75-people.js ===== */
/* ---------- people: ageing, retirement, each year's rookie class, and what your scouts can tell you ---------- */
function ovrCap(P,w){return Math.min(100,P.image+10+(w.sq==null?50:w.sq)*0.2);}
function phaseOf(w){return w.age<w.pk[0]?0:(w.age<=w.pk[1]?1:(w.age<w.cl?2:3));}
var PHASE=['Still developing','In their prime','Past their peak','In steep decline'];
function retire(S,w,why){
  if(w.promo!=='FA'){var P=S.promos[w.promo];leaveCompany(S,w,'retired');if(w.ovr>=50||w.promo===S.player)news(S,'contract',w.name+' ('+P.name+') has retired at '+w.age+(why?': '+why:'')+'.');}
  mile(S,w,'retire','Retired at '+w.age);w.rtp=w.promo!=='FA'?w.promo:null;w.promo='FA';w.brand=null;w.rt=S.week;w.camp=false;w.retiring=null;
}
function birthday(S,w){
  w.age++;var act=w.ya||0;w.ya=0;
  if(w.rt)return;
  if(w.age<=w.pk[0]){if(workRate(w)<w.pot)w.xp+=0.6;return;}
  if(w.age<=w.pk[1])return;
  // past the peak: decline can be slowed by staying active and healthy, never stopped
  var over=w.age-w.pk[1],d=(w.age>=w.cl?2.2:1)*(act>=20?0.7:(act<6?1.25:1))*((w.yi||0)>=8?1.25:1);w.yi=0;
  var dn=function(k,n){w[k]=clamp(w[k]-Math.max(0,Math.round(n)),15,99);};
  dn('speed',(w.style==='H'?1.7:1.4)*d+over*0.3);dn('stam',1.1*d+over*0.2);dn('brawl',0.6*d);dn('tech',0.3*d);dn('dur',1.5*d);
  w.pot=Math.max(workRate(w),w.pot-2);
  if(w.promo===S.player&&!w.slow){w.slow=true;news(S,'story',w.name+' is '+w.age+' and starting to slow down.');mile(S,w,'age','Began to slow down at '+w.age);}
  if(w.age>=w.cl+1&&!w.retiring&&(workRate(w)<52||w.age>=w.cl+4||chance(S,0.3))){
    if(w.promo===S.player){w.retiring=S.week+8;news(S,'contract',w.name+' has told you this is the end. They will retire after '+cal(w.retiring).label+'.');pushEv(S,{type:'finalyear',w:w.id,text:w.name+', '+w.age+', has decided to retire. They would like a farewell tour: one last year, with the building full of people who came to say goodbye. Or a short goodbye after eight weeks.',choices:['A final year: a farewell tour','Eight weeks, then a short goodbye']});}
    else retire(S,w);
  }
}
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.inj>0)w.yi=(w.yi||0)+1;
    if(w.retiring&&S.week>=w.retiring&&w.fw&&!w.fwDone&&w.promo===S.player){
      // a farewell tour ends with a last match, and the booker chooses who gets the honour of the final win
      var heirs=rosterOf(S,S.player).filter(function(x){return !x.nw&&x.id!==w.id&&x.g===w.g&&x.inj<=0&&x.age<=32;}).sort(function(a,b){return (b.pot+b.ovr)-(a.pot+a.ovr);}).slice(0,3);
      w.fwDone=true;w.retiring=S.week+1;
      if(heirs.length){pushEv(S,{type:'lastwin',w:w.id,c:heirs.map(function(x){return x.id;}),text:w.name+'’s last match is tonight. Who gets the honour of the final win over them?',choices:heirs.map(function(x){return x.name;})});return;}
    }
    if(w.retiring&&S.week>=w.retiring){var P=S.promos[w.promo];if(P){rosterOf(S,P.id).forEach(function(x){x.morale=clamp(x.morale+2,0,100);});P.image=clamp(P.image+(w.ovr>=P.image?0.3:0.1),5,100);}retire(S,w,'a farewell the locker room will remember');}
    if((S.week+w.bw)%48===0)birthday(S,w);
    // in rival companies, young talent with star quality rises whether you are watching or not
    if(w.promo!=='FA'&&w.promo!==S.player&&!w.nw&&w.age<=w.pk[0]+1){var Q=S.promos[w.promo],tg=Math.min(ovrCap(Q,w),w.sq+5);if(w.ovr<tg)w.ovr+=0.02*(tg-w.ovr);if(workRate(w)<w.pot)w.xp+=0.05;}
    // unsigned youngsters learn their trade on small shows nobody sees
    if(w.promo==='FA'&&!w.rt&&w.age<=28){if(workRate(w)<w.pot){w.xp+=0.07;if(w.xp>=1){w.xp-=1;w.brawl=Math.min(99,w.brawl+1);w.tech=Math.min(99,w.tech+1);w.speed=Math.min(99,w.speed+1);}}if(w.ovr<12+(w.pot-50)*0.5)w.ovr+=0.08;}
    // free agents nobody wants drift out of the business
    if(w.promo==='FA'&&!w.rt&&w.age>=36&&S.week%12===0&&chance(S,0.25)){mile(S,w,'retire','Left the business at '+w.age);w.rt=S.week;}
  });
  var c=cal(S.week+1);if(c.month===0&&c.wom===1)rookieClass(S,c.year);
});
POST.push(function(ctx){ctx.all.forEach(function(w){w.ya=(w.ya||0)+1;});});
function rookieClass(S,year){
  var I=dbOf(S).indie,styles=['B','T','H','P','A','S','E'],made=[],have={};S.w.forEach(function(w){have[w.name]=1;});
  // the class grows with the number of promotions, so the free agent pool does not drain in a big world
  for(var i=0,nClass=Math.max(22,Math.round(8*S.order.length));i<nClass;i++){
    var g=i%3===2?'F':'M',nm,tries=0;
    do{nm=pick(S,g==='F'?I.firstF:I.firstM)+' '+pick(S,I.last);}while(have[nm]&&tries++<40);
    if(have[nm])continue;have[nm]=1;
    var rg=ri(S,0,REGIONS.length-1),rst={brawl:['B','P','S','A'],work:['T','A','S','H'],spectacle:['H','E','A','P']}[REGIONS[rg].taste],
      work=ri(S,38,60),blue=chance(S,0.15),w=addWrestler(S,{name:nm,g:g,ovr:ri(S,6,20)+(blue?6:0),style:chance(S,0.6)?pick(S,rst):pick(S,styles),work:work,mic:ri(S,30,75),align:chance(S,0.5)?'F':'H',age:ri(S,19,23)},'FA',null);
    w.pot=clamp(work+ri(S,10,24)+(blue?12:0),work,97);w.sq=clamp(ri(S,30,72)+(blue?16:0),20,97);w.blue=blue;w.rk=year;w.reg=rg;assignGim(w);mile(S,w,'debut','Turned professional, class of '+year);made.push(w);
  }
  made.sort(function(a,b){return b.pot-a.pot;});
  (S.classes||(S.classes={}))[year]=made.map(function(w){return w.id;});
  if(made.length)news(S,'world','The class of '+year+' has turned professional: '+made.length+' rookies. The one everybody is talking about is '+made[0].name+'.');
}
/* scouting: hidden ratings show as a range until you know the wrestler well */
var HIDDEN={pot:'Potential',sq:'Star quality',dur:'Durability',safe:'Safety',cons:'Consistency'};
function margin(S,w){var eye=S.booker?S.booker.sk.eye:0,m=(w.promo===S.player?10:18)-3*eye;if(w.sc)m-=8;return Math.max(0,m);}
E.intel=function(S,id){
  var w=S.w[id];if(!w)return null;var m=margin(S,w),out={m:m,exact:m<=1,stats:{}};
  Object.keys(HIDDEN).forEach(function(k){
    var v=w[k];if(m<=1){out.stats[k]={lo:v,hi:v};return;}
    var c=v+Math.round((h01(S.seed+':'+w.id+k)-0.5)*m*1.2);out.stats[k]={lo:clamp(c-m,1,99),hi:clamp(c+m,1,99)};
  });
  out.phase=PHASE[phaseOf(w)];out.peak=m<=4?[w.pk[0],w.pk[1]]:null;out.cliff=m<=1?w.cl:null;
  return out;
};
E.scoutInfo=function(S){var P=S.promos[S.player],used=S.scoutWeek===S.week?(S.scoutN||0):0,max=2+S.booker.sk.eye;return {left:Math.max(0,max-used),max:max,cost:Math.max(200,Math.round(P.inc0*0.002/100)*100)};};
E.scout=function(S,id){
  var w=S.w[id],P=S.promos[S.player],i=E.scoutInfo(S);if(!w)return null;
  if(w.sc)return 'Your scouts have already filed a full report on '+w.name+'.';
  if(i.left<=0)return 'Your scouts are stretched this week. They can file '+i.max+' report'+(i.max===1?'':'s')+' a week.';
  if(S.scoutWeek!==S.week){S.scoutWeek=S.week;S.scoutN=0;}S.scoutN++;P.cash-=i.cost;w.sc=S.week;
  var n=E.intel(S,id);return 'The report on '+w.name+' is in: potential '+rng(n.stats.pot)+', star quality '+rng(n.stats.sq)+'. '+n.phase+'.';
};
function rng(r){return r.lo===r.hi?String(r.lo):r.lo+'–'+r.hi;}
NEWX.push(function(S){S.order.forEach(function(id){S.promos[id].size0=rosterOf(S,id).length;});});
E.HIDDEN=HIDDEN;E.phaseOf=phaseOf;E.PHASE=PHASE;

/* ===== 76-locker.js ===== */
/* ---------- the locker room: roles, the ego grid, stress, bodies that wear out, and the people who patch them up ---------- */
var ROLE={
  leader:{n:'Locker-room leader',d:'Steadies everyone around them while content. An unhappy leader drags the room down.'},
  mentor:{n:'Mentor',d:'Can take a young wrestler under their wing and speed up their growth.'},
  gate:{n:'Gatekeeper',d:'The test every newcomer has to pass. Beating them clean means more, and they do not mind losing.'},
  diva:{n:'Diva',d:'Works hard in the main event and sulks anywhere else. Expects top money.'},
  toxic:{n:'Toxic influence',d:'Spreads unhappiness through the locker room every week until somebody deals with it.'}
};
var ZONES={n:{n:'Neck',len:1.6},s:{n:'Shoulders',len:1.0},b:{n:'Back',len:1.1},k:{n:'Knees',len:1.3}};
var INTN={safe:{n:'Safe',w:0.6,i:0.6},normal:{n:'Normal',w:1,i:1},brutal:{n:'Brutal',w:1.7,i:1.6}};
var MEDN=['No medical cover','Ringside trainer','Physio team','Full medical staff'],MED_C=[0,0.003,0.007,0.012],MED_R=[0,0.1,0.2,0.35],MED_L=[1,0.92,0.82,0.72],MED_I=[1,0.96,0.9,0.85];
var EXN={'Main event':4.4,'Upper midcard':3.5,'Midcard':2.6,'Lower midcard':1.8,'Opener':1.1},PUSHN={main_eventer:4.4,upper_midcarder:3.5,midcarder:2.6,lower_midcarder:1.8,jobber:1.1,non_wrestler:1.1};
function medCost(P){return Math.round(MED_C[P.med||0]*P.inc0);}
function zonesOf(w){return w.bz||(w.bz={n:0,s:0,b:0,k:0});}
function zoneFloor(w,k){return clamp(((w.age-26)*1.4+(w.ml||0)/30)*(1.25-w.dur/200)*(OWNZ[w.style]===k?1.3:1),0,50);}
function maxZone(w){var z=zonesOf(w);return Math.max(z.n,z.s,z.b,z.k);}
function fictional(S){return !!(S.db&&S.db.fictional);}

/* --- set-up --- */
function assignRoles(S){
  var fic=fictional(S);
  S.order.forEach(function(pid){
    var P=S.promos[pid],R=rosterOf(S,pid).filter(function(w){return !w.nw;}),n=R.length,ov=R.map(function(w){return w.ovr;}).sort(function(a,b){return a-b;}),med=ov[Math.floor(n/2)]||50;
    var h=function(w,k){return h01(S.seed+k+w.id);},by=function(f,ok){return R.filter(function(w){return !w.role&&ok(w);}).sort(function(a,b){return f(b)-f(a);});};
    var take=function(L,role,k){var have=R.filter(function(w){return w.role===role;}).length;L.slice(0,Math.max(0,k-have)).forEach(function(w){w.role=role;});};
    take(by(function(w){return w.mic*0.4+w.ovr*0.4+h(w,'L')*25;},function(w){return w.age>=30;}),'leader',n>=40?2:1);
    take(by(function(w){return (w.age-30)*3+workRate(w)*0.6+h(w,'M')*20;},function(w){return w.age>=33&&workRate(w)>=66;}),'mentor',n>=40?3:2);
    take(by(function(w){return w.cons*0.5+workRate(w)*0.4+h(w,'G')*25-Math.abs(w.ovr-med)*1.2;},function(w){return w.age>=29;}),'gate',2);
    if(fic){
      take(by(function(w){return w.sq*0.5+w.ovr*0.5+h(w,'D')*30;},function(w){return w.ovr>=P.image-5;}),'diva',n>=40?2:1);
      take(by(function(w){return h(w,'X')*100;},function(w){return w.ovr>=P.image-25&&w.ovr<P.image+5;}),'toxic',1);
    }
    if(pid!==S.player)autoMentor(S,pid);
  });
}
function autoMentor(S,pid){
  var R=rosterOf(S,pid),ms=R.filter(function(w){return w.role==='mentor';}),ys=R.filter(function(w){return !w.nw&&w.age<=26&&w.ment==null;}).sort(function(a,b){return b.pot-a.pot;});
  ms.forEach(function(m,i){if(ys[i])ys[i].ment=m.id;});
}
NEWX.push(function(S){
  var by={};S.w.forEach(function(w){if(w.uid)by[w.uid]=w;});
  (DB.rows||[]).forEach(function(d){var w=by[d.uid];if(w&&d.lrole&&ROLE[d.lrole])w.role=d.lrole;});
  S.w.forEach(function(w){
    var z=zonesOf(w),j=function(k){return h01(S.seed+'z'+k+w.id);};w.ml=Math.max(0,w.age-21)*30;
    ['n','s','b','k'].forEach(function(k){z[k]=Math.min(58,Math.round(zoneFloor(w,k)*(1+j(k)*0.6)));});
    w.stress=0;
  });
  assignRoles(S);
  S.order.forEach(function(pid){var pm=E.pushMap(S,pid);rosterOf(S,pid).forEach(function(w){w.ex=w.push&&PUSHN[w.push]?PUSHN[w.push]:(EXN[pm[w.id]]||2);w.pos=w.ex;});});
});

/* --- the ego grid: seven lines that say why somebody is happy or not --- */
function egoLines(S,w){
  var P=S.promos[w.promo],L=[],add=function(k,n,v,why){L.push({k:k,n:n,v:clamp(v,-2,2),why:why});};
  var ex=w.ex==null?2:w.ex,pos=w.pos==null?ex:w.pos,d=pos-ex,idle=S.week-(w.lu||0),low=ex<=1.3;
  var pv=d>=0.8?2:(d>=0.3?1:(d<=-1.2?-2:(d<=-0.5?-1:0)));if(low&&pv<0)pv=idle>=12?-1:0;if(w.nw||w.camp)pv=0;
  add('push','Push',pv,pv>0?'Booked above what they expected':(pv<0?'Expects a bigger spot than they are getting':'Booked about where they expect to be'));
  var fair=wageFor(w.ovr,P)*(w.role==='diva'?1.15:1),r=w.wage/Math.max(1,fair);
  add('pay','Pay',r>=1.4?2:(r>=1.15?1:(r<=0.65?-2:(r<=0.85?-1:0))),r>=1.15?'Paid better than their standing':(r<=0.85?'Underpaid for how big a star they are now':'Paid about right'));
  var pk=w.pk2||0,pb=w.pb2||0;add('promise','Promises',pk-2*pb,pb?'You have broken your word to them':(pk?'You kept your word':'No promises between you'));
  var lv=holdLvl(P,w.id),lost=w.lt&&S.week-w.lt.w<=12;
  add('title','Titles',lv>=3?2:(lv>0?1:(lost?-1:(ex>=4&&!w.hadTop&&S.week>24?-1:0))),lv?'Holds a title':(lost?'Lost a title recently':(ex>=4&&!w.hadTop&&S.week>24?'A main eventer who has never held the top title here':'No strong feelings')));
  var i1=ex>=4?3:(ex>=2.4?5:8),sp=(w.la&&S.week-w.la<=2?1:0)+(idle>=i1*2?-2:(idle>=i1?-1:0));if(w.nw||w.camp||w.inj>0)sp=Math.max(0,sp);
  add('spot','Spotlight',sp,sp>0?'Got time on the microphone lately':(sp<0?'Off the shows for '+idle+' weeks':'On the shows often enough'));
  var cv=(P.image-P.image0>=3?1:(P.image-P.image0<=-3?-1:0))+(P.cash<0?-1:0);add('company','The company',cv,cv>0?'The company is growing':(cv<0?'The company is going the wrong way':'The company is steady'));
  var t=S.trust==null?60:S.trust,yv=(t>=90?2:(t>=75?1:(t<20?-2:(t<40?-1:0))))+(w.you||0);add('you','You',yv,yv>0?'Trusts the booker':(yv<0?'Does not trust the booker':'No opinion of the booker yet'));
  return L;
}
function egoSum(S,w){var s=0;egoLines(S,w).forEach(function(l){s+=l.v;});return s;}
function roomMood(S,P){var d=0;rosterOf(S,P.id).forEach(function(w){if(w.inj>0||w.camp)return;if(w.role==='leader')d+=w.morale>=60?1.5:(w.morale<40?-2:0);else if(w.role==='toxic')d-=2;});return d;}
function egoTarget(S,w){return clamp(moraleTarget(S)+2.5*egoSum(S,w)+roomMood(S,S.promos[w.promo])+ruleMorale(S,w),15,97);}
E.ego=function(S,id){var w=S.w[id];if(!w||w.promo==='FA')return null;var L=egoLines(S,w),s=0;L.forEach(function(l){s+=l.v;});return {lines:L,sum:s,target:Math.round(egoTarget(S,w)),stress:Math.round(w.stress||0),ex:w.ex,pos:w.pos,role:w.role||null};};
E.lockerRoom=function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id),o={happy:0,ok:0,unhappy:0,roles:{},trouble:[],hurt:[],mood:roomMood(S,P)};
  R.forEach(function(w){
    var s=egoSum(S,w);if(w.morale>=70)o.happy++;else if(w.morale>=45)o.ok++;else o.unhappy++;
    if(w.role)(o.roles[w.role]=o.roles[w.role]||[]).push(w.id);
    if((w.stress||0)>=50||s<=-3){var worst=egoLines(S,w).sort(function(a,b){return a.v-b.v;})[0];o.trouble.push({id:w.id,stress:Math.round(w.stress||0),sum:s,why:worst.v<0?worst.why:'Stress is building'});}
    if(maxZone(w)>=60)o.hurt.push(w.id);
  });
  o.trouble.sort(function(a,b){return (b.stress-b.sum*8)-(a.stress-a.sum*8);});
  return o;
};

/* --- stress and breaking points --- */
function stressAdd(S,w,n){if(S.cal||!w||w.promo!==S.player)return;if(n>0&&has(w,'grudge'))n*=1.25;w.stress=clamp((w.stress||0)+n,0,100);}
function breakdown(S,w){
  w.brk=S.week;var P=S.promos[w.promo],kind=w.role==='diva'||w.ex>=4?'noshow':(w.mic>=70?'shoot':'walkout');
  if(kind==='shoot'){w.arc={t:'grievance'};w.stress=Math.max(0,w.stress-25);
    S.inbox.push({id:S.nid++,type:'break',w:w.id,text:w.name+' has had enough. Word is they plan to say so on the next show, script or no script.',done:true,result:null});news(S,'story',w.name+' is at breaking point.');return;}
  w.away=S.week+(kind==='walkout'?2:1);
  pushEv(S,{type:'break',kind:kind,w:w.id,text:kind==='noshow'?w.name+' did not turn up to the building this week. The stress has been building for a while.':w.name+' has walked out. They will be gone for two weeks at least.',
    choices:['Sit down and listen','Fine them','Let it go'],checks:{0:mkCheck(7,[moraleMod(w),trustMod(S),{n:'A leader in the locker room',v:roomMood(S,P)>0?1:0}].concat(skillMods(S,'talk')))}});
  news(S,'story',w.name+(kind==='noshow'?' no-showed.':' walked out on '+P.name+'.'));
}
EVR['break']=function(S,ev,choice,P,w){
  if(!w)return '';
  if(choice===0){
    var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){w.stress=Math.max(0,w.stress-35);w.morale=clamp(w.morale+6,0,100);w.you=clamp((w.you||0)+1,-1,1);return rollText(r)+w.name+' talks it through and comes back in a better place.';}
    w.morale=clamp(w.morale-6,0,100);w.stress=Math.max(0,w.stress-10);return rollText(r)+w.name+' hears you out and is not convinced.';
  }
  if(choice===1){w.stress=clamp(w.stress+5,0,100);w.morale=clamp(w.morale-5,0,100);S.trust=clamp(S.trust+2,0,100);w.you=clamp((w.you||0)-1,-1,1);return 'You fine '+w.name+'. The locker room notices that the rules apply to everyone.';}
  w.stress=Math.max(0,w.stress-20);S.trust=clamp(S.trust-3,0,100);return 'You let it go. '+w.name+' calms down, and the others notice what you let slide.';
};
TRAITS.grudge={n:'Holds a grudge',d:'Stress builds faster. Works harder inside a feud.'};
EFX.push(function(ctx,w){
  if(ctx.S.cal)return 0;var e=0,z=zonesOf(w),S=ctx.S;
  ['n','s','b','k'].forEach(function(k){if(z[k]>60)e-=(z[k]-60)*0.22;});
  if(w.hurt===S.week)e-=10;
  if(w.promo===S.player){
    if((w.stress||0)>=75)e-=6;else if((w.stress||0)>=50)e-=3;
    if(w.role==='diva')e+=ctx.isMain||ctx.i===ctx.n-2?3:-5;
    if(has(w,'grudge')&&ctx.feud)e+=2;
  }
  return e;
});

/* --- the brutality dial --- */
CRX.push(function(ctx){
  var it=ctx.m.int;if(!it||it==='normal'||!INTN[it])return null;var gim=ctx.stip!=='std';
  if(it==='safe')return {d:gim?-4:-2,x:gim?'A gimmick match where everyone held back':'They played it safe, and the crowd could tell'};
  var rk=ctx.P.risk>=2?1:0;return {d:(gim?(ctx.feud&&ctx.feud.heat>=40?5:3):2)+rk,x:gim?'They left everything in there':'Stiff, reckless and loud'};
});
MQX.push(function(ctx){var it=ctx.m.int;return it==='brutal'?{d:1.5,x:null}:(it==='safe'?{d:-1,x:null}:null);});
function hurtRisk(S,P,w,m){var it=INTN[m.int]||INTN.normal;return it.i*MED_I[P.med||0]*(1+Math.max(0,maxZone(w)-50)/40)*(w.hurt===S.week?3:1)*(1+Math.max(0,(w.rd||0)-60)/80)*agentRisk(S,m)*(m.note==='steal'?1.5:(m.note==='safe'?0.55:(m.note==='long'?1.15:(m.note==='short'?0.85:1))));}
function hurtZone(S,w){var z=zonesOf(w),ks=['n','s','b','k'],tot=0,x;ks.forEach(function(k){tot+=10+z[k];});x=rnd(S)*tot;for(var i=0;i<4;i++){x-=10+z[ks[i]];if(x<=0)return ks[i];}return 'b';}
var OWNZ={H:'k',P:'b',B:'s',T:'n',S:'s',A:'b',E:'k'},OPPZ={T:'s',P:'b',S:'n',H:'n',B:'b',A:'s',E:'k'};
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P,m=ctx.m,it=INTN[m.int]||INTN.normal,mine=ctx.isPl;if(S.cal)return;
  ctx.sides.forEach(function(side,k){
    side.forEach(function(w){
      // wear: half from how they work, half from who they are in there with
      var opp=flat(ctx.sides.filter(function(s,x){return x!==k;})),o=opp.length?opp[Math.floor(rnd(S)*opp.length)]:w,z=zonesOf(w);
      var wear=ctx.mins*0.07*it.w*(STIP[ctx.stip].inj>1.5?1.5:1)*(1.5-w.dur/125)*(w.age>w.pk[1]?1.3:1)*(has(w,'horse')?0.8:1);
      var a=OWNZ[w.style]||'b',b=OPPZ[o.style]||'s';z[a]=Math.min(100,z[a]+wear*0.55);z[b]=Math.min(100,z[b]+wear*0.45);w.wk=S.week;w.ml=(w.ml||0)+1;
      if(!mine)return;
      // where they stood on the card
      var n=ctx.n,i=ctx.i,sc=ctx.isMain?5:(i===n-2?4:(i>=n*0.5?3:(i>=1?2:1.6)));if(ctx.t)sc+=0.5;if(ctx.big)sc*=1.15;
      if(r.win>=0&&m.mt!=='br')sc+=r.winners.indexOf(w)>=0?0.3:(r.fin==='clean'?-0.3:0);
      w.pos=(w.pos==null?w.ex:w.pos)*0.8+Math.min(5.5,sc)*0.2;
      if(w.wkW!==S.week){w.wkW=S.week;w.wkN=0;}w.wkN++;if(w.wkN>1)stressAdd(S,w,5);
      if(w.cond<35)stressAdd(S,w,4);
    });
  });
  if(mine&&m.int==='brutal'&&ctx.stip!=='std'&&r.OV>=90)award(S,'ACH_BRUTAL');
  if(r.win<0)return;
  if(ctx.t&&r.seg.change)r.winners.forEach(function(w){if(ctx.t.lvl>=3)w.hadTop=true;stressAdd(S,w,-15);});
  else if(ctx.isMain||ctx.big)r.winners.forEach(function(w){stressAdd(S,w,-4);});
  var wa=avg(r.winners.map(function(w){return w.ovr;}));
  if(m.mt!=='br')r.losers.forEach(function(l){
    if(r.fin==='clean'&&(l.role==='diva'||l.ex>=4)&&wa<=l.ovr-10)stressAdd(S,l,12);
    if(l.ws<=-4)stressAdd(S,l,4);
    if(l.role==='gate'&&(r.fin==='clean'||r.fin==='flash')&&wa<l.ovr){
      r.winners.forEach(function(w){addOvr(P,w,0.6);w.pts=(w.pts||0)+2;});addOvr(P,l,0.25);l.morale=clamp(l.morale+1,0,100);
      if(mine)r.seg.notes.push(names(r.winners)+' passed the '+l.name+' test. That win means more than most.');
    }
  });
});

/* --- every week --- */
WEEKX.push(function(S){
  var PL=S.promos[S.player],lead=rosterOf(S,PL.id).some(function(w){return w.role==='leader'&&w.morale>=60&&w.inj<=0;});
  S.w.forEach(function(w){
    if(w.rt)return;var z=zonesOf(w),P=w.promo!=='FA'?S.promos[w.promo]:null,worked=w.wk===S.week,rec=((worked?0.25:0.6)+(P?MED_R[P.med||0]:0)+(w.inj>0?0.6:0)+(w.rest===S.week?0.8:0))*(P&&P.id===S.player&&hasRule(S,'iron')?0.65:1);
    ['n','s','b','k'].forEach(function(k){z[k]=Math.max(zoneFloor(w,k),z[k]-rec);});
    if(!P)return;
    if(w.ment!=null){var mt=S.w[w.ment];if(!mt||mt.promo!==w.promo||mt.rt||mt.role!=='mentor'||w.age>28)w.ment=null;else{if(workRate(w)<w.pot)w.xp+=0.12*(w.promo===S.player&&hasRule(S,'senior')?1.4:1);if(w.mic<Math.min(88,mt.mic-5)){w.mx=(w.mx||0)+0.2;if(w.mx>=1){w.mx-=1;w.mic++;}}mt.morale=clamp(mt.morale+0.4,0,100);}}
    if(w.promo!==S.player)return;
    // stress: what eases it and what feeds it
    var L=egoLines(S,w),g={};L.forEach(function(l){g[l.k]=l.v;});
    var ds=-3-(lead?2:0)-(worked?0:2)+(maxZone(w)>=70?2:0)+(g.pay<=-1?1:0)+(g.push<=-2?3:(g.push<=-1?1.5:0))+(g.promise<0?1.5:0);
    stressAdd(S,w,ds);
    if((w.stress||0)>=75&&w.inj<=0&&!w.camp&&!(w.away>=S.week)&&S.week-(w.brk||-99)>=8&&chance(S,0.35)){breakdown(S,w);if(chance(S,0.3)&&!has(w,'grudge')){(w.tr=w.tr||[]).push('grudge');news(S,'story',w.name+' earned a trait: '+TRAITS.grudge.n+'.');}}
  });
  // a toxic influence works on the people around them
  rosterOf(S,PL.id).filter(function(w){return w.role==='toxic'&&w.inj<=0&&!w.camp;}).forEach(function(tx){
    var c=rosterOf(S,PL.id).filter(function(w){return w.id!==tx.id&&!w.nw&&w.role!=='leader';});
    for(var k=0;k<3&&c.length;k++)stressAdd(S,pick(S,c),3);
  });
  if(S.week%4===0)S.order.forEach(function(pid){var pm=E.pushMap(S,pid);rosterOf(S,pid).forEach(function(w){var tg=EXN[pm[w.id]]||2;w.ex=(w.ex==null?tg:w.ex)*0.75+tg*0.25;});});
  if(S.week%48===0){S.w.forEach(function(w){if(w.pk2)w.pk2=Math.floor(w.pk2/2);if(w.pb2)w.pb2=Math.floor(w.pb2/2);});S.order.forEach(function(pid){if(pid!==S.player)autoMentor(S,pid);});}
});

/* --- things you can do about it --- */
E.ROLE=ROLE;E.ZONES=ZONES;E.INTN=INTN;E.MEDN=MEDN;
E.zones=function(S,id){var w=S.w[id];if(!w)return null;var z=zonesOf(w);return ['n','s','b','k'].map(function(k){return {k:k,n:ZONES[k].n,v:Math.round(z[k])};});};
E.medInfo=function(S){var P=S.promos[S.player];return {lvl:P.med||0,names:MEDN,costs:MED_C.map(function(c){return Math.round(c*P.inc0);}),cost:medCost(P)};};
E.rest=function(S,id){var w=S.w[id];if(!w||w.promo!==S.player)return null;if(w.rest===S.week){w.rest=0;return w.name+' is back on the card this week.';}w.rest=S.week;return w.name+' gets the week off. Rest eases wear and stress, and they cannot be booked until next week.';};
E.workHurtOk=function(S,id){var w=S.w[id];return !!(w&&w.promo===S.player&&w.inj>0&&w.inj<=2+(S.promos[S.player].med>=2?1:0));};
E.workHurt=function(S,id){
  var w=S.w[id];if(!E.workHurtOk(S,id))return null;var z=zonesOf(w),k=w.iz||'b';
  w.inj=0;w.hurt=S.week;z[k]=Math.min(100,z[k]+8);stressAdd(S,w,6);
  return w.name+' is cleared to work hurt this week ('+ZONES[k].n.toLowerCase()+'). They will not be at their best, and the risk of making it worse is three times normal.';
};
E.mentorsFor=function(S,id){var w=S.w[id];if(!w||w.age>26||w.nw)return [];return rosterOf(S,w.promo).filter(function(m){return m.role==='mentor'&&m.id!==w.id&&rosterOf(S,w.promo).filter(function(x){return x.ment===m.id&&x.id!==w.id;}).length<2;});};
E.setMentor=function(S,id,mid){var w=S.w[id];if(!w||w.promo!==S.player)return null;if(mid==null){w.ment=null;return w.name+' is on their own again.';}var m=S.w[mid];if(!m||m.role!=='mentor'||m.promo!==w.promo)return null;w.ment=m.id;award(S,'ACH_MENTOR');return m.name+' takes '+w.name+' under their wing. Expect faster growth in the ring and on the microphone.';};
E.wordOdds=function(S,id){var w=S.w[id],P=S.promos[S.player];if(!w||(w.role!=='toxic'&&w.role!=='diva'))return null;return mkCheck(w.role==='toxic'?10:9,[moraleMod(w),trustMod(S),{n:'A leader backs you up',v:roomMood(S,P)>0?1:0}].concat(skillMods(S,'talk')));};
E.haveWord=function(S,id){
  var w=S.w[id],ck=E.wordOdds(S,id);if(!ck||w.promo!==S.player)return null;
  if(w.wordWeek&&S.week-w.wordWeek<8)return {ok:false,msg:'You have had that conversation with '+w.name+' recently. Give it until '+cal(w.wordWeek+8).label+'.'};
  var r=rollCheck(S,ck);w.wordWeek=S.week;
  if(r.ok){var was=w.role;w.role=null;award(S,'ACH_REFORM');w.morale=clamp(w.morale+4,0,100);news(S,'story',w.name+' has turned a corner backstage.');return {ok:true,roll:r,msg:rollText(r)+w.name+' takes it on board. '+(was==='toxic'?'The poison stops.':'The demands stop.')};}
  stressAdd(S,w,15);w.morale=clamp(w.morale-4,0,100);return {ok:false,roll:r,msg:rollText(r)+w.name+' does not take it well.'};
};

/* ---------- who trained whom: the trainer is remembered after the mentoring ends ---------- */
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.ment==null||w.rt)return;var m=S.w[w.ment];if(!m)return;
    if(w.coach==null)w.coach=m.id;
    w.cw=(w.cw||0)+1;
    // every quarter a student moves one point towards the trainer's way of working
    if(w.cw%13===0)['brawl','tech','speed'].forEach(function(k){var d=m[k]-w[k];if(Math.abs(d)>=4)w[k]=clamp(w[k]+(d>0?1:-1),1,99);});
    if(w.cw===52&&w.style!==m.style){var was=w.style;w.style=m.style;if(w.promo===S.player)news(S,'story',w.name+' has spent a year with '+m.name+' and has picked up their style of working.');mile(S,w,'train','Took on the style of '+m.name);}
  });
});
/* the family tree of one wrestler: the line of trainers above, the students below */
E.family=function(S,id){
  var w=S.w[id];if(!w)return null;var up=[],seen={},c=w,g=0;seen[id]=1;
  while(c.coach!=null&&!seen[c.coach]&&g++<6){c=S.w[c.coach];if(!c)break;seen[c.id]=1;up.push(c.id);}
  function kids(x,depth){if(depth>3)return [];return S.w.filter(function(s){return s.coach===x&&s.id!==x;}).slice(0,12).map(function(s){return {id:s.id,kids:kids(s.id,depth+1)};});}
  return {coach:w.coach!=null&&S.w[w.coach]?w.coach:null,up:up,students:S.w.filter(function(s){return s.coach===id;}).map(function(s){return s.id;}),tree:kids(id,1)};
};

/* ===== 77-backstage.js ===== */
/* ---------- your week: house rules, action points and the backstage map, wrestlers' court, mid-match chaos, clocks ---------- */
function bsInit(S){
  if(!S.house)S.house={on:[],wk:null};
  if(S.ap==null){S.ap=apMax(S);S.apUsed={};}
  if(!S.apLog)S.apLog=[];
  if(!S.court)S.court=[];
  if(!S.clocks){S.clocks={};Object.keys(CLOCKS).forEach(function(k){S.clocks[k]={v:0,why:''};});}
  if(!S.mainLog)S.mainLog=[];
}
NEWX.push(function(S){bsInit(S);});

/* --- house rules: pick a few, live with the trade-offs --- */
var HOUSE={
  clean:{n:'Clean finishes',d:'No screwjobs. Cheap wins, disqualifications and count-outs are rebooked as clean falls.',plus:'The crowd likes knowing every match has a finish.',minus:'Feuds heat up more slowly and nobody is protected in defeat.'},
  ranked:{n:'Rankings are law',d:'Title shots go to the top five contenders and nobody else.',plus:'A ranked challenger draws a louder crowd for a title match.',minus:'An unranked challenger is booed, and it costs you locker-room trust.'},
  def4:{n:'Thirty-day rule',d:'Every champion defends at least once every four weeks.',plus:'Titles feel important: title matches score higher.',minus:'A title left on the shelf sours the fans, week after week.'},
  open:{n:'Open door',d:'Anybody can walk through your door, and your people can talk to anybody.',plus:'Guests lift your crowd and rivals warm to you over time.',minus:'Rivals circle your roster: the raid clock runs faster.'},
  youth:{n:'Youth movement',d:'The future is now. Young wrestlers get the time and the trust.',plus:'Wrestlers of 26 and under improve faster.',minus:'Veterans of 35 and over are unhappy about it.',x:'senior'},
  senior:{n:'Respect your elders',d:'Seniority decides who speaks first and who goes on last.',plus:'Veterans of 33 and over are happier, and mentors teach faster.',minus:'Wrestlers of 25 and under feel held back.',x:'youth'},
  iron:{n:'Iron schedule',d:'House shows between every taping. The crew lives on the road.',plus:'Gate money rises by a tenth.',minus:'Bodies recover more slowly and stress creeps up.'},
  kayfabe:{n:'Kayfabe is sacred',d:'Heroes and villains never travel together. Nobody breaks character in public.',plus:'Feuds heat up faster.',minus:'Living the gimmick adds stress, and tempers flare into more disputes.'},
  curfew:{n:'Curfew and dress code',d:'In by midnight, collared shirt on the plane.',plus:'Stress falls faster and there are fewer disputes.',minus:'Your biggest egos resent it.'},
  testing:{n:'Fitness checks',d:'Everyone is checked by the medical staff before every show.',plus:'Injuries are a little rarer.',minus:'Wrestlers resent the queue and the paperwork.'},
  bonus:{n:'Win bonuses',d:'The winner’s purse is bigger than the loser’s.',plus:'Everybody works harder to win.',minus:'It costs a slice of every gate, and losing stings more.'}
};
function hasRule(S,k){return !!(S&&!S.cal&&S.house&&S.house.on.indexOf(k)>=0);}
function houseSlots(S){return 2+(S.booker&&S.booker.lvl>=4?1:0)+(S.owner&&S.owner.me?1:0);}
function houseHeat(S){return (hasRule(S,'clean')?0.8:1)*(hasRule(S,'kayfabe')?1.12:1);}
function ruleMorale(S,w){
  var d=0;if(!S.house||!S.house.on.length)return 0;
  if(hasRule(S,'youth')&&w.age>=35)d-=4;
  if(hasRule(S,'senior')){if(w.age>=33)d+=4;else if(w.age<=25)d-=3;}
  if(hasRule(S,'testing'))d-=1;
  if(hasRule(S,'curfew')){d-=1;if(w.role==='diva'||w.role==='toxic'||w.ex>=4)d-=4;}
  return d;
}
/* each company model has a view on the house rules: +1 approves, -1 frowns. The owner's trust follows once a month. */
var HOUSE_VIEW={corporate:{clean:1,curfew:1,testing:1,iron:-1,open:-1},workrate:{def4:1,ranked:1,bonus:1,kayfabe:-1},purist:{clean:1,ranked:1,testing:1,curfew:1,kayfabe:-1},
  underdog:{open:1,iron:1,bonus:-1},startup:{iron:1,open:1,curfew:-1},outlaw:{curfew:-1,clean:-1,kayfabe:1,testing:-1},spectacle:{kayfabe:1,open:1,youth:1,clean:-1},
  tradition:{senior:1,kayfabe:1,ranked:1,clean:1,youth:-1},joshi:{testing:1,youth:1,def4:1,iron:-1}};
function houseView(P,k){var v=HOUSE_VIEW[P.model||'classic'];return v&&v[k]||0;}
WEEKX.push(function(S){
  if(S.owner&&S.owner.me||cal(S.week).wom!==4||!S.house)return;var P=S.promos[S.player],d=0,likes=[],frowns=[];
  S.house.on.forEach(function(k){var v=houseView(P,k);d+=0.6*v;if(v>0)likes.push(HOUSE[k].n);else if(v<0)frowns.push(HOUSE[k].n);});
  if(d){S.owner.trust=clamp(S.owner.trust+d,0,100);news(S,'you',S.owner.name+(d>0?' approves of ':' is not happy about ')+(d>0?likes:frowns).join(' and ')+' under '+modelOf(P).ph+'.');}
});
E.HOUSE=HOUSE;
E.houseInfo=function(S){bsInit(S);var H=S.house,wait=Math.max(0,(H.wk==null?-99:H.wk)+4-S.week);
  return {slots:houseSlots(S),on:H.on.slice(),wait:wait,rules:Object.keys(HOUSE).map(function(k){var r=HOUSE[k];return {id:k,view:houseView(S.promos[S.player],k),n:r.n,d:r.d,plus:r.plus,minus:r.minus,on:H.on.indexOf(k)>=0,clash:r.x&&H.on.indexOf(r.x)>=0?HOUSE[r.x].n:null};})};};
E.setHouse=function(S,k){
  bsInit(S);var H=S.house,i=H.on.indexOf(k),r=HOUSE[k];if(!r)return null;
  if(i>=0){H.on.splice(i,1);H.wk=S.week;news(S,'you','You scrapped a house rule: '+r.n+'.');return {ok:true,msg:r.n+' is scrapped. The locker room needs four weeks to settle before a new rule can take its place.'};}
  if(H.on.length>=houseSlots(S))return {ok:false,msg:'Every slot is in use. Scrap a rule first.'};
  if(r.x&&H.on.indexOf(r.x)>=0)return {ok:false,msg:'That cannot stand alongside '+HOUSE[r.x].n+'.'};
  var wait=(H.wk==null?-99:H.wk)+4-S.week;if(wait>0)return {ok:false,msg:'You changed the rules recently. Wait '+wait+' more week'+(wait===1?'':'s')+'.'};
  H.on.push(k);news(S,'you','New house rule: '+r.n+'.');if(H.on.length>=houseSlots(S))award(S,'ACH_HOUSE');
  return {ok:true,msg:r.n+' is now the rule of the house.'};
};
CRX.push(function(ctx){
  if(!ctx.isPl)return null;var S=ctx.S,d=0,x=null;
  if(hasRule(S,'clean'))d+=0.8;
  if(ctx.t&&ctx.champSide>=0){
    if(hasRule(S,'def4')){d+=1.5;x='The thirty-day rule keeps this title busy';}
    if(hasRule(S,'ranked')&&!ctx.t.tag&&ctx.m.mt==='1v1'){
      var top=rankFor(S,ctx.P,ctx.t,5).map(function(w){return w.id;}),ch=flat(ctx.sides.filter(function(s,k){return k!==ctx.champSide;}));
      if(ch.every(function(w){return top.indexOf(w.id)>=0;})){d+=2.5;x='A ranked contender who earned the shot';}else{d-=5;x='The challenger has not earned this shot';S.trust=clamp(S.trust-1,0,100);}
    }
  }
  if(hasRule(S,'open')&&ctx.all.some(function(w){return w.promo!==ctx.P.id;})){d+=2;x=x||'The open door brings a guest through it';}
  return d?{d:d,x:x}:null;
});
EFX.push(function(ctx,w){var S=ctx.S,e=0;if(!ctx.isPl)return 0;if(hasRule(S,'bonus'))e+=2;if(S.pep&&S.pep===showKey(S))e+=2;return e;});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal)return;bsInit(S);
  if(hasRule(S,'iron')){var x=Math.round(rep.gate*0.1);P.led.gate+=x;rep.gate+=x;}
  if(hasRule(S,'bonus'))P.led.bonus-=Math.round(rep.gate*0.04);
  var ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1];
  if(main&&main.ids){S.mainLog.push({w:S.week,ids:main.ids.slice()});if(S.mainLog.length>8)S.mainLog.shift();}
  S.pep=null;
});

/* --- action points and the backstage map --- */
function apMax(S){return 3+(S.booker&&S.booker.lvl>=5?1:0)+(S.owner&&S.owner.me?1:0);}
var PLACES={
  office:{n:'The owner’s office',d:'Where the money and the booking power come from.'},
  court:{n:'Wrestlers’ court',d:'The locker room settles its own disputes. You wear the robe.'},
  trainer:{n:'The trainer’s room',d:'Ice, tape and bad news.'},
  gym:{n:'The gym',d:'A ring, some mats and whoever turned up early.'},
  catering:{n:'Catering',d:'Where everybody talks and nobody is on guard.'},
  lot:{n:'The parking lot',d:'No cameras, as far as anybody knows.'},
  truck:{n:'The production truck',d:'Forty screens and one director with a headset.'}
};
function ownerMod(S){var t=S.owner.trust;return {n:'Owner trust '+Math.round(t),v:t>=75?2:(t>=55?1:(t<35?-1:0))};}
function activeRoster(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.inj<=0&&!w.camp&&!(w.away>=S.week);});}
function apActs(S,pl){
  var P=S.promos[S.player],own=S.owner.me,L=[];
  if(pl==='office'){
    if(own){L.push({id:'network',n:'Call the network',d:'Talk up this week’s show. A bigger audience for your next card.',ck:mkCheck(7,skillMods(S,'talk'))});
      L.push({id:'sponsors',n:'Work the phones',d:'A fresh set of sponsor offers lands on your desk.'});}
    else{L.push({id:'bp',n:'Ask for more booking power',d:'Three extra points this week if the owner says yes. A little trust lost if not.',ck:mkCheck(8,[ownerMod(S)].concat(skillMods(S,'talk')))});
      L.push({id:'budget',n:'Ask for a bigger wage budget',d:'Five per cent more to spend on contracts, for good.',ck:mkCheck(9,[ownerMod(S),{n:'The company is making money',v:S.fin&&S.fin.net>0?1:0}].concat(skillMods(S,'talk')))});}
  }else if(pl==='court'){
    S.court.forEach(function(c){L.push({id:'case',n:'Hear the case: '+S.w[c.a].name+' against '+S.w[c.b].name,d:c.text,cid:c.id});});
    if(!L.length)L.push({id:'none',n:'No cases on the docket',d:'Nobody has brought a dispute this week.',off:true});
  }else if(pl==='trainer'){
    L.push({id:'treat',n:'Stand over the trainer while they work',d:'One wrestler: eight points off every worn body zone, and a week off an injury of two weeks or more.',need:'w'});
  }else if(pl==='gym'){
    L.push({id:'drill',n:'Put two wrestlers through drills',d:'Their ring chemistry improves. A regular team also gains experience.',need:'pair'});
    L.push({id:'class',n:'Run the class yourself',d:'Up to six wrestlers of 25 and under learn a little faster this week.'});
  }else if(pl==='catering'){
    L.push({id:'rounds',n:'Do the rounds',d:'Sit down with the three most stressed people on the roster.',ck:mkCheck(7,[trustMod(S)].concat(skillMods(S,'talk')))});
    L.push({id:'pep',n:'Give the pep talk',d:'Everybody works a little harder on your next show.'});
  }else if(pl==='lot'){
    L.push({id:'attack',n:'Stage a sneak attack',d:'The first wrestler jumps the second. Starts a rivalry, or pours fuel on one they already have.',need:'pair',same:true,ck:mkCheck(7,skillMods(S,'creative'))});
  }else if(pl==='truck'){
    L.push({id:'meet',n:'Sit in on the production meeting',d:'Your next show looks sharper. Better still if your ideas land.',ck:mkCheck(7,skillMods(S,'creative'))});
    L.push({id:'tease',n:'Shoot a teaser vignette',d:'For a newcomer who has not appeared yet. Each teaser builds hype for the debut, up to three. A hyped debut starts hot, but a weak one that was over-hyped costs you.',need:'w'});
    L.push({id:'hype',n:'Cut a hype package',d:'A video for the top of the show. More people in the building next time.'});
  }
  return L;
}
E.PLACES=PLACES;
E.backstage=function(S){bsInit(S);return {log:S.apLog,ap:S.ap,max:apMax(S),places:Object.keys(PLACES).map(function(k){return {id:k,n:PLACES[k].n,d:PLACES[k].d,used:!!S.apUsed[k],acts:apActs(S,k),badge:k==='court'?S.court.length:0};})};};
E.apDo=function(S,pl,act,o){
  bsInit(S);o=o||{};var P=S.promos[S.player],L=apActs(S,pl),A=L.filter(function(x){return x.id===act&&(act!=='case'||x.cid===+o.cid);})[0];
  if(!A||A.off)return {ok:false,msg:'Nothing to do there.'};
  if(S.ap<=0)return {ok:false,msg:'You are out of action points this week.'};
  if(S.apUsed[pl])return {ok:false,msg:'You have already spent time there this week.'};
  var a=o.a!=null&&o.a!==''?S.w[+o.a]:null,b=o.b!=null&&o.b!==''?S.w[+o.b]:null,r=null,msg='',ok=true,fair=null,mine=function(w){return w&&w.promo===P.id&&!w.nw;};
  if(A.need==='pair'){if(!mine(a)||!mine(b)||a.id===b.id)return {ok:false,msg:'Pick two different wrestlers first.'};if(A.same&&a.g!==b.g)return {ok:false,msg:'Pick two wrestlers from the same division.'};
    if(a.inj>0||b.inj>0||a.camp||b.camp)return {ok:false,msg:'Both of them need to be fit and in the building.'};}
  if(A.need==='w'&&!mine(a))return {ok:false,msg:'Pick a wrestler first.'};
  if(A.ck){r=rollCheck(S,A.ck);ok=r.ok;}
  if(act==='bp'){if(ok){S.bp+=3;msg=S.owner.name+' nods. Three more points of booking power this week.';}else{S.owner.trust=clamp(S.owner.trust-2,0,100);msg=S.owner.name+' says you have enough rope already.';}}
  else if(act==='budget'){if(ok){S.owner.wage0=Math.round(S.owner.wage0*1.05);msg=S.owner.name+' signs off on a bigger wage budget: '+money(E.budget(S))+' a week.';}else{S.owner.trust=clamp(S.owner.trust-2,0,100);msg=S.owner.name+' wants to see the books improve first.';}}
  else if(act==='network'){S.hype=(S.hype||0)+(ok?0.07:0.02);msg=ok?'The network gives your next show a push in the listings.':'They take the call. That is about all they do.';}
  else if(act==='sponsors'){refreshOffers(S);msg='Three new sponsor offers are on the Manage screen, under Deals.';}
  else if(act==='case'){var res=E.courtRule(S,+o.cid,+o.v);if(!res.ok)return res;msg=res.msg;fair=res.fair;ok=res.fair!==false;}
  else if(act==='treat'){var z=zonesOf(a),eased=0;['n','s','b','k'].forEach(function(k){var f=zoneFloor(a,k),nv=Math.max(f,z[k]-8);eased+=z[k]-nv;z[k]=nv;});if(a.inj>=2)a.inj--;stressAdd(S,a,-4);
    msg=a.name+' gets the full treatment'+(a.inj>0?' and should be back a week sooner.':(eased>=4?' and walks out moving more freely.':'. There was not much to fix.'));}
  else if(act==='drill'){var k=rkey(a.id,b.id),c=chem(S,a.id,b.id);(S.chemX||(S.chemX={}))[k]=clamp(c+1.2,-6,6);var tm=a.team!=null&&a.team===b.team?teamOf(S,a):null;if(tm)tm.exp=Math.min(100,tm.exp+6);
    a.cond=clamp(a.cond-5,5,100);b.cond=clamp(b.cond-5,5,100);msg=a.name+' and '+b.name+' work through it until it clicks. Their chemistry is better for it'+(tm?', and so is their teamwork.':'.');}
  else if(act==='class'){var ys=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.age<=25&&w.inj<=0&&workRate(w)<w.pot;}).sort(function(x,y){return y.pot-x.pot;}).slice(0,6);ys.forEach(function(w){w.xp+=0.22;});
    msg=ys.length?'You run the class. '+names(ys.slice(0,3))+(ys.length>3?' and '+(ys.length-3)+' more':'')+' get a little better.':'Nobody young enough to teach turned up.';}
  else if(act==='rounds'){var st=rosterOf(S,P.id).filter(function(w){return !w.nw;}).sort(function(x,y){return (y.stress||0)-(x.stress||0);}).slice(0,3);
    st.forEach(function(w){stressAdd(S,w,ok?-12:-4);});if(ok)S.trust=clamp(S.trust+1,0,100);msg=ok?'You listen more than you talk. '+names(st)+' leave the table lighter.':'They are polite about it. Nobody says what is really on their mind.';}
  else if(act==='pep'){S.pep=showKey(S)||('next');if(!S.queue[S.qi])S.pep=null;msg=S.pep?'You have the room. Expect more effort on '+S.queue[S.qi].name+'.':'There is no show left this week to fire them up for.';if(!S.pep)return {ok:false,msg:msg};}
  else if(act==='tease'){if(!a.deb||a.hy>=3)return {ok:false,msg:a.deb?a.name+' already has all the hype a debut can carry.':a.name+' has already appeared on the shows. Pick a newcomer.'};
    a.hy=(a.hy||0)+1;msg='A dark, grainy teaser for '+a.name+' airs on the next show. Hype for the debut: '+a.hy+' of 3.'+(a.hy>=3?' Any more would be too much.':'');}
  else if(act==='attack'){
    var f=feudOf(S,a.id,b.id);
    if(f){heatUp(S,f,ok?12:5,a.name+' jumped '+b.name+' in the parking lot');msg=ok?'It makes the news. The rivalry is hotter for it.':'The camera missed most of it, but word gets round.';}
    else{f=startFeud(S,P,a,b,ok?22:14,a.name+' jumped '+b.name+' in the parking lot');if(!f)return {ok:false,msg:'There are too many rivalries running to start another.'};msg=ok?a.name+' leaves '+b.name+' on the tarmac. A new rivalry, and people are talking.':a.name+' jumps '+b.name+'. It looked clumsy, but the rivalry is on.';}
    if(!ok){var zz=zonesOf(b),hz=hurtZone(S,b);zz[hz]=Math.min(100,zz[hz]+6);stressAdd(S,b,5);}
    if(a.align==='H')addOvr(P,a,0.4);b.mom=clamp(b.mom+(b.align==='F'?1:0),-10,10);
  }
  else if(act==='meet'){S.rateMod=(S.rateMod||0)+(ok?1.5:0.5);msg=ok?'Your notes make it to air. The next show will look a point or two better.':'They nod, and change one camera angle.';}
  else if(act==='hype'){S.hype=(S.hype||0)+0.05;msg='The package is in the can. Expect a bigger house.';}
  S.ap--;S.apUsed[pl]=1;gainXp(S,4);
  // keep a note of what was done and how it went, so the desk can show the week so far
  var out=(r?rollText(r):'')+msg;S.apLog.push({pl:pl,place:PLACES[pl].n,act:A.n,ok:ok,msg:out,who:[a,b].filter(Boolean).map(function(w){return w.name;})});
  return {ok:ok,done:true,fair:fair,roll:r,msg:out};
};

/* --- wrestlers' court --- */
var CASES=[
  ['stiff','{a} says {b} worked stiff on purpose and wants it dealt with.'],
  ['spot','{a} says {b} went to the office behind their back to take their spot on the card.'],
  ['rib','{a} found their gear bag full of shaving foam and blames {b}.'],
  ['late','{a} wants {b} fined for turning up late and skipping the handshakes.'],
  ['phrase','{a} says {b} lifted their catchphrase.'],
  ['ride','{a} says {b} left them at a gas station on the drive between towns.']
];
function mkCase(S){
  var R=activeRoster(S);if(R.length<6)return null;
  var a=pick(S,R),bad=R.filter(function(w){return w.id!==a.id&&relOf(S,a.id,w.id)<0;}),b=bad.length&&chance(S,0.6)?pick(S,bad):pick(S,R.filter(function(w){return w.id!==a.id;}));
  if(S.court.some(function(c){return c.a===a.id||c.b===a.id||c.a===b.id||c.b===b.id;}))return null;
  var k=pick(S,CASES),right=chance(S,b.role==='toxic'?0.8:(a.role==='toxic'||a.role==='diva'?0.3:0.55))?'a':'b';
  var wit=R.filter(function(w){return w.id!==a.id&&w.id!==b.id;}).sort(function(x,y){return ({leader:3,gate:2,mentor:2,toxic:2}[y.role]||0)+h01(S.seed+'w'+y.id+S.week)-({leader:3,gate:2,mentor:2,toxic:2}[x.role]||0)-h01(S.seed+'w'+x.id+S.week);}).slice(0,3);
  var ev=wit.map(function(w){var rel=w.role==='leader'?0.88:(w.role==='gate'||w.role==='mentor'?0.78:(w.role==='toxic'?0.25:0.66)),says=chance(S,rel)?right:(right==='a'?'b':'a');return {w:w.id,side:says};});
  return {id:S.nid++,a:a.id,b:b.id,k:k[0],wk:S.week,right:right,ev:ev,text:fill(k[1],{a:a.name,b:b.name})};
}
E.court=function(S){bsInit(S);return S.court.map(function(c){return {id:c.id,a:c.a,b:c.b,text:c.text,age:S.week-c.wk,left:Math.max(0,3-(S.week-c.wk)),ev:c.ev.map(function(e){var w=S.w[e.w];return {w:e.w,name:w.name,role:w.role?ROLE[w.role].n:null,backs:S.w[c[e.side]].name};}),ring:S.w[c.a].g===S.w[c.b].g,leader:rosterOf(S,S.player).some(function(w){return !w.nw&&w.inj<=0&&w.id!==c.a&&w.id!==c.b&&(w.role==='leader'||(w.age>=35&&w.morale>=50));})};});};
E.courtLog=function(S){return (S.verdicts||[]).slice(0,6).map(function(v){return {w:v.w,win:v.win,lose:v.lose,fair:v.fair,judge:v.judge,rep:v.rep,n:v.n};});};
function courtApply(S,c,side,byYou){
  var win=S.w[c[side]],lose=S.w[c[side==='a'?'b':'a']],fair=side===c.right;
  win.morale=clamp(win.morale+5,0,100);stressAdd(S,win,-8);lose.morale=clamp(lose.morale-5,0,100);stressAdd(S,lose,8);
  // the court remembers: a wrestler found against again and again is dealt with harder, and every verdict is kept
  lose.cl=(lose.cl||0)+1;var rep=lose.cl>=2;if(rep){lose.morale=clamp(lose.morale-Math.min(9,3*(lose.cl-1)),0,100);stressAdd(S,lose,Math.min(10,4*(lose.cl-1)));}
  (S.verdicts||(S.verdicts=[])).unshift({w:S.week,win:win.id,lose:lose.id,fair:fair,judge:byYou?null:(S.lastJudge||null),rep:rep,n:lose.cl});if(S.verdicts.length>20)S.verdicts.length=20;S.lastJudge=null;
  if(byYou){win.you=clamp((win.you||0)+1,-1,1);
    if(fair){S.trust=clamp(S.trust+2,0,100);S.courtFair=(S.courtFair||0)+1;if(S.courtFair>=5)award(S,'ACH_COURT');}
    else{S.trust=clamp(S.trust-3,0,100);stressAdd(S,lose,8);lose.you=clamp((lose.you||0)-1,-1,1);S.rel[rkey(win.id,lose.id)]=-1;}}
  return fair;
}
E.courtRule=function(S,cid,v){
  var c=S.court.filter(function(x){return x.id===cid;})[0];if(!c)return {ok:false,msg:'That case is closed.'};
  var a=S.w[c.a],b=S.w[c.b],P=S.promos[S.player],msg,fair=null;
  if(v===0||v===1){var side=v===0?'a':'b';fair=courtApply(S,c,side,true);msg='You find for '+S.w[c[side]].name+'. '+(fair?'The room agrees: that was the right call.':'The room goes quiet. Most of them think you got it wrong.');}
  else if(v===2){if(a.g!==b.g)return {ok:false,msg:'They are in different divisions. It cannot be settled in the ring.'};
    var f=startFeud(S,P,a,b,22,'Settled in the ring by order of wrestlers’ court');if(!f)return {ok:false,msg:'There are too many rivalries running to add another.'};
    stressAdd(S,a,-5);stressAdd(S,b,-5);S.trust=clamp(S.trust+1,0,100);msg='Settle it in the ring. '+a.name+' and '+b.name+' have a match to build to, and the room likes the ruling.';}
  else{a.morale=clamp(a.morale-2,0,100);b.morale=clamp(b.morale-2,0,100);S.trust=clamp(S.trust-1,0,100);msg='Case dismissed. Neither of them is happy, and it is over.';}
  S.court=S.court.filter(function(x){return x!==c;});news(S,'story','Wrestlers’ court: '+a.name+' against '+b.name+'. '+(v===2?'To be settled in the ring.':(v===3?'Dismissed.':'Decided for '+S.w[c[v===0?'a':'b']].name+'.')));
  return {ok:true,fair:fair,msg:msg};
};
E.courtDelegate=function(S,cid){
  var c=S.court.filter(function(x){return x.id===cid;})[0];if(!c)return {ok:false,msg:'That case is closed.'};
  var inCase=function(w){return w.id===c.a||w.id===c.b;},R0=rosterOf(S,S.player).filter(function(w){return !w.nw&&w.inj<=0&&!inCase(w);});
  // the judge is a leader if there is one, otherwise the most senior veteran in good spirits
  var ld=R0.filter(function(w){return w.role==='leader';})[0]||R0.filter(function(w){return w.age>=35&&w.morale>=50;}).sort(function(x,y){return y.age-x.age;})[0];
  if(!ld)return {ok:false,msg:'You have no leader or veteran to hand it to.'};
  S.lastJudge=ld.id;var side=chance(S,0.75)?c.right:(c.right==='a'?'b':'a');courtApply(S,c,side,false);S.court=S.court.filter(function(x){return x!==c;});
  news(S,'story','Wrestlers’ court: '+ld.name+' heard '+S.w[c.a].name+' against '+S.w[c.b].name+' and found for '+S.w[c[side]].name+'.');
  return {ok:true,msg:ld.name+' hears the case and finds for '+S.w[c[side]].name+'. It costs you nothing and earns you nothing.'};
};

/* --- mid-match chaos: something goes wrong on the air and the headset wants an answer --- */
E.chaos=function(S,card){
  var key=showKey(S);if(!key||S.over)return null;
  if(S.chs&&S.chs.key===key)return S.chs.done?null:S.chs;
  S.chs={key:key,done:true};
  var P=S.promos[S.player],show=S.queue[S.qi],n=card.length;if(n<3)return null;
  if(!chance(S,0.13+(show.big?0.09:0)+(P.risk>=2?0.05:0)))return null;
  var mi=ri(S,0,n-1),m=card[mi],ids=flat(m.sides),ws=ids.map(function(id){return S.w[id];}),oc=onCard(card),ch=null;
  var kind=pick(S,['lights','power','shoot','riot','ko']),label='Match '+(mi+1)+(mi===n-1?', the main event':'')+': ';
  if(kind==='lights'){
    var free=eligible(S,P,show).filter(function(w){return oc[w.id]==null&&w.promo===P.id;}).sort(function(x,y){return y.ovr-x.ovr;}),x=free.filter(function(w){return w.align==='H';})[0]||free[0];
    if(x)ch={type:'lights',x:x.id,text:label+'the lights go out. The whole building is dark and the crowd is roaring.',choices:['Put '+x.name+' in the ring when they come back on','Restart the match when the lights return','Call it a no contest']};
  }else if(kind==='shoot'&&(m.mt==='1v1'||m.mt==='tag')){
    var a=m.sides[0][0],b=m.sides[1][0];
    ch={type:'shoot',w:a,o:b,text:label+S.w[a].name+' and '+S.w[b].name+' have stopped working. Those are real punches.',choices:['Send the locker room out to break it up','Let them fight','Tell the referee to go home early']};
  }else if(kind==='riot'){
    var hs=ws.filter(function(w){return w.align==='H';}).sort(function(x,y){return y.ovr-x.ovr;}),fs=ws.filter(function(w){return w.align==='F';}).sort(function(x,y){return y.cha-x.cha;});
    if(hs.length&&fs.length)ch={type:'riot',w:fs[0].id,o:hs[0].id,text:label+'the crowd is throwing things and somebody is over the barrier. Security is outnumbered.',choices:['Send '+fs[0].name+' out to calm them down','Cut to commercial and let security handle it','Hand '+hs[0].name+' the microphone'],
      checks:{0:mkCheck(7,[{n:fs[0].name+'’s charisma '+fs[0].cha,v:fs[0].cha>=85?2:(fs[0].cha>=70?1:(fs[0].cha<50?-1:0))}])}};
  }else if(kind==='ko'){
    var w=pick(S,ws),opp=ws.filter(function(q){return q.id!==w.id;}).sort(function(x,y){return workRate(y)-workRate(x);})[0];
    ch={type:'ko',w:w.id,o:opp.id,text:label+w.name+' took a bad landing and is not responding. The referee is throwing up the X.',choices:['Stop the match','Go straight to the finish','Have '+opp.name+' carry it and hide the damage'],
      checks:{2:mkCheck(8,[{n:opp.name+'’s work rate '+workRate(opp),v:workRate(opp)>=85?2:(workRate(opp)>=72?1:(workRate(opp)<55?-1:0))}])}};
  }
  if(!ch){var tk=rosterOf(S,P.id).filter(function(q){return q.inj<=0&&!q.camp;}).sort(function(x,y){return y.mic-x.mic;})[0],cost=Math.round(P.prod*0.4/1000)*1000;
    ch={type:'power',w:tk.id,cost:cost,text:label+'the truck has lost power. You are off the air and the building does not know it yet.',choices:['Send '+tk.name+' out to fill time until you are back','Carry on for the live crowd','Pay '+money(cost)+' for the emergency generator'],
      checks:{0:mkCheck(7,[{n:tk.name+'’s promo skill '+tk.mic,v:tk.mic>=85?2:(tk.mic>=70?1:(tk.mic<50?-1:0))}])}};}
  ch.key=key;ch.mi=mi;ch.done=false;ch.result=null;ch.roll=null;S.chs=ch;return ch;
};
E.resolveChaos=function(S,card,c){
  var ch=S.chs;if(!ch||ch.done)return null;
  var P=S.promos[S.player],m=card[ch.mi],w=ch.w!=null?S.w[ch.w]:null,o=ch.o!=null?S.w[ch.o]:null,X={k:ch.type,c:c,cr:0,mq:0,x:null,note:''},res='',r=null;
  if(ch.checks&&ch.checks[c]){r=rollCheck(S,ch.checks[c]);ch.roll=r;}
  if(!m){ch.done=true;return '';}
  if(ch.type==='lights'){
    var x=S.w[ch.x];
    if(c===0){X.cr=5;X.x='The lights came back on and the building came unglued';var tg=flat(m.sides).map(function(id){return S.w[id];}).filter(function(q){return q.g===x.g&&q.align!==x.align;}).sort(function(p,q){return q.ovr-p.ovr;})[0];
      if(tg){startFeud(S,P,x,tg,24,x.name+' appeared when the lights came back on');X.note='When the lights came back, '+x.name+' was standing over '+tg.name+'.';}else X.note='When the lights came back, '+x.name+' was standing in the ring.';
      x.la=S.week;res=x.name+' is in position. This will get a reaction.';}
    else if(c===1){X.cr=-2;X.mq=-1;X.x='A blackout broke the rhythm of the match';X.note='The match restarted after a blackout.';res='The referee restarts it once the lights are back. The match loses its rhythm.';}
    else{m.nc=true;X.cr=-4;X.x='Thrown out after the blackout';X.fin='The referee waves it off after the blackout. No contest.';X.note='Ruled a no contest after the lights went out.';res='You throw it out. Nobody got hurt in the dark, and nobody got a finish.';}
  }else if(ch.type==='power'){
    if(c===0){if(r.ok){S.rateMod=(S.rateMod||0)+1;addOvr(P,w,0.5);w.la=S.week;res=w.name+' holds the building in the palm of one hand until the picture returns.';X.note=w.name+' filled time during a power failure and stole the show.';}
      else{S.rateMod=(S.rateMod||0)-2;res=w.name+' runs out of things to say after a minute. It feels like ten.';X.note='Dead air during a power failure.';}}
    else if(c===1){S.rateMod=(S.rateMod||0)-1.5;X.cr=1;res='The building sees a match the cameras miss.';X.note='This match did not make it to air.';}
    else{P.cash-=ch.cost;res='The generator kicks in after ninety seconds. That cost '+money(ch.cost)+'.';X.note='A short power failure, fixed fast.';}
  }else if(ch.type==='shoot'){
    S.rel[rkey(w.id,o.id)]=-1;
    if(c===0){m.nc=true;X.cr=1;X.x='It turned into a real fight and the locker room emptied';X.fin='The locker room pours out to pull them apart. No contest.';stressAdd(S,w,10);stressAdd(S,o,10);
      if(w.g===o.g)startFeud(S,P,w,o,30,'It got real between them');X.note='The match broke down into a real fight.';res='Twenty wrestlers pull them apart. There is no finish, but nobody will forget it.';}
    else if(c===1){X.cr=7;X.mq=-3;X.x='A real fight, and the crowd could tell';m.hurt=w.dur<=o.dur?w.id:o.id;[w,o].forEach(function(q){var z=zonesOf(q),hz=hurtZone(S,q);z[hz]=Math.min(100,z[hz]+8);stressAdd(S,q,6);});
      S.trust=clamp(S.trust-3,0,100);if(w.g===o.g)startFeud(S,P,w,o,35,'It got real between them');X.note='They stopped co-operating. It was ugly and the crowd loved it.';res='You let it go. The crowd loves it. The locker room notices that you did nothing.';}
    else{m.len='S';if(m.stip==='iron')m.stip='std';X.cr=-2;X.mq=-3;X.x='Rushed to the finish';stressAdd(S,w,5);stressAdd(S,o,5);X.note='The referee hurried them to the finish.';res='The referee gets them to the finish early. It looks rushed because it was.';}
  }else if(ch.type==='riot'){
    if(c===0){if(r.ok){X.cr=3;X.x=w.name+' settled the crowd';addOvr(P,w,0.8);res=w.name+' gets them back in their seats, and gets a bigger cheer for it.';X.note=w.name+' talked down an angry crowd.';}
      else{X.cr=-4;X.x='The crowd turned ugly';var fine=Math.round(P.prod*0.3/1000)*1000;P.cash-=fine;res='They do not listen. The building fines you '+money(fine)+' for the damage.';X.note='Crowd trouble stopped the show for several minutes.';}}
    else if(c===1){S.rateMod=(S.rateMod||0)-1;res='Security clears it up during the break. The show loses its momentum.';X.note='Crowd trouble during the match.';}
    else{X.cr=4;X.x=o.name+' poured petrol on it';addOvr(P,o,1.2);o.la=S.week;if(S.net)S.net.mood=clamp(S.net.mood+3,0,100);X.note=o.name+' took the microphone and made it worse, on purpose.';res=o.name+' makes it much worse and loves every second.';
      if(S.sponsors.length&&chance(S,0.35)){var sp=pick(S,S.sponsors);P.led.bonus-=sp.pay;res+=' '+sp.name+' are not amused and withhold this week’s payment.';news(S,'money',sp.name+' withheld a payment after crowd trouble at '+S.queue[S.qi].name+'.');}}
  }else if(ch.type==='ko'){
    if(c===0){m.nc=true;X.ko=w.id;X.cr=-3;X.x='Stopped for a real injury';X.fin='The referee stops the match. '+w.name+' is helped to the back.';S.trust=clamp(S.trust+3,0,100);X.note='Stopped by the referee: '+w.name+' was hurt for real.';res='You stop it. '+w.name+' walks to the back with help. The locker room will remember that you made the safe call.';}
    else if(c===1){m.len='S';if(m.stip==='iron')m.stip='std';m.hurt=w.id;X.mq=-4;X.x='They went home early with somebody hurt';S.trust=clamp(S.trust-1,0,100);X.note=w.name+' was hurt and they went straight to the finish.';res='They go to the finish. '+w.name+' is on autopilot.';}
    else{if(r.ok){X.mq=-1;X.note=o.name+' carried an injured '+w.name+' through it.';res=o.name+' walks '+w.name+' through the rest of it. Nobody in the building knew.';o.morale=clamp(o.morale+2,0,100);}
      else{X.mq=-6;X.x='It fell apart with somebody hurt';m.hurt=w.id;S.trust=clamp(S.trust-2,0,100);X.note='The match fell apart after '+w.name+' was hurt.';res='It falls apart in front of everybody, and '+w.name+' takes more punishment.';}}
  }
  m.chaos=X;ch.done=true;ch.result=(r?rollText(r):'')+res;gainXp(S,3);return ch.result;
};
CRX.push(function(ctx){var c=ctx.m.chaos;return c&&c.cr?{d:c.cr,x:c.x}:null;});
MQX.push(function(ctx){var c=ctx.m.chaos;return c&&c.mq?{d:c.mq,x:c.cr?null:c.x}:null;});
POST.push(function(ctx){
  var S=ctx.S,m=ctx.m,r=ctx.res,c=m.chaos;if(S.cal)return;
  if(ctx.isPl){
    r.winners.forEach(function(w){w.wonWk=S.week;});
    if(hasRule(S,'bonus'))r.losers.forEach(function(w){w.morale=clamp(w.morale-0.6,0,100);});
    if(hasRule(S,'youth'))ctx.all.forEach(function(w){if(w.age<=26&&workRate(w)<w.pot)w.xp+=0.035;});
    if(ctx.isMain)S.quests.slice().forEach(function(q){if(q.type==='netvow'&&r.OV>=q.target){dropQuest(S,q);ctx.P.led.bonus+=q.bonus;S.clocks.net.v=0;news(S,'money','You kept your promise to the network: a '+r.OV+'% main event. They send a bonus of '+money(q.bonus)+'.');r.seg.notes.push('The network got the main event you promised.');}});
  }
  if(!c)return;
  if(c.fin)r.seg.finish=c.fin;
  if(c.ko&&S.w[c.ko]){var w=S.w[c.ko];if(w.inj<=0){w.inj=1;w.iz=w.iz||'n';news(S,'injury',w.name+' ('+ctx.P.name+') was hurt at '+ctx.show.name+' and will miss a week.');}}
  if(c.note){r.seg.notes.unshift(c.note);if(r.seg.bc)r.seg.bc.splice(Math.min(2,r.seg.bc.length),0,{t:'note',x:c.note});}
  if(ctx.isPl&&r.OV>=80)award(S,'ACH_CHAOS');
});

/* --- clocks: slow pressure you can watch build --- */
var CLOCKS={
  mutiny:{n:'Mutiny',segs:6,bad:true,d:'Fills while the locker room is unhappy or under strain. When it is full they call a meeting without you.'},
  raid:{n:'Talent raid',segs:6,bad:true,d:'Fills while a rival has reason to go after your stars: short contracts or low morale near the top of your card.'},
  stale:{n:'Stale act',segs:8,bad:true,d:'Fills when the same faces close every show or a title reign drags. A title change or a big turn winds it back.'},
  net:{n:'Network patience',segs:6,bad:true,d:'Fills when a weekly show comes in under expectations. When it is full the network wants a meeting.'},
  hot:{n:'Hot streak',segs:4,bad:false,d:'Fills each week every show beats expectations. Full, it pays out booking power and goodwill.'},
  star:{n:'Breakout',segs:6,bad:false,d:'Follows one young wrestler. Fills each week they win. Full, they arrive as a star.'}
};
function starPick(S){
  var P=S.promos[S.player],c=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.age<=27&&w.inj<=4&&!w.camp&&(w.ex==null||w.ex<=3)&&w.ovr<P.image+2;}).sort(function(a,b){return (b.pot-workRate(b)+b.cha*0.3+b.sq*0.3)-(a.pot-workRate(a)+a.cha*0.3+a.sq*0.3);});
  return c.length?c[0].id:null;
}
E.CLOCKS=CLOCKS;
E.clocks=function(S){bsInit(S);return Object.keys(CLOCKS).map(function(k){var c=S.clocks[k],d=CLOCKS[k];return {id:k,n:d.n+(k==='star'&&c.w!=null&&S.w[c.w]?': '+S.w[c.w].name:''),v:Math.max(0,Math.min(d.segs,Math.round(c.v))),segs:d.segs,bad:d.bad,d:d.d,why:c.why||'',w:k==='star'?c.w:null};});};
function tickClocks(S){
  var P=S.promos[S.player],C=S.clocks,R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),n=Math.max(1,R.length),bump=function(k,d,why){C[k].v=clamp(C[k].v+d,0,CLOCKS[k].segs);C[k].why=why;};
  // mutiny
  var un=R.filter(function(w){return w.morale<45;}).length/n,strained=R.filter(function(w){return (w.stress||0)>=75;}).length;
  if(un>=0.12||strained>=2||(roomMood(S,P)<0&&un>=0.06))bump('mutiny',1,strained>=2?strained+' wrestlers are close to breaking':Math.round(un*100)+'% of the roster is unhappy');
  else if(un<0.05&&S.trust>=55)bump('mutiny',-1,'The room is settled');else C.mutiny.why='Holding';
  if(C.mutiny.v>=CLOCKS.mutiny.segs){C.mutiny.v=2;var own=S.owner.me;
    pushEv(S,{type:'mutiny',text:'The locker room has held a meeting without you. They want answers about pay, pushes and promises.',choices:['Face the room',own?'Give everybody a five per cent rise':'Send '+S.owner.name+' in to talk to them','Ignore it'],
      checks:{0:mkCheck(8,[trustMod(S),{n:'A leader in the locker room',v:roomMood(S,P)>0?1:0}].concat(skillMods(S,'talk')))}});news(S,'story','The '+P.name+' locker room held a meeting without the booker.');}
  // raid
  var top=R.slice().sort(function(a,b){return b.ovr-a.ovr;}).slice(0,8).filter(function(w){return (w.con<=16||w.morale<50)&&!hasQuest(S,w.id)&&w.inj<=0;});
  var rv=S.order.filter(function(id){return id!==P.id&&S.promos[id].image>=P.image-15;}).sort(function(a,b){return S.promos[b].image-S.promos[a].image;});
  if(top.length&&rv.length)bump('raid',(S.dpart&&S.dpart.rival===0&&S.week%2?0:1)+(S.dpart&&S.dpart.rival===2?1:0)+(hasRule(S,'open')&&S.week%2===0?1:0),top[0].name+(top[0].con<=16?' is nearly out of contract':' is unhappy')+', and rivals know it');
  else bump('raid',-1,'Your stars are tied down and content');
  if(C.raid.v>=CLOCKS.raid.segs&&top.length&&rv.length){C.raid.v=1;var tw=top[0],RV=S.promos[rv[0]],raise=Math.round(tw.wage*1.3/50)*50;tw.off=S.week+10;
    pushEv(S,{type:'offer',w:tw.id,rival:rv[0],raise:raise,text:RV.name+' have been circling for weeks. Now they have made '+tw.name+' an offer.',choices:['Match it: '+money(raise)+' a week, new 48-week deal','Appeal to loyalty','Let them go']});}
  // stale
  var last=S.mainLog.slice(-4),cnt={},worst=0,who=null;last.forEach(function(e){e.ids.forEach(function(id){cnt[id]=(cnt[id]||0)+1;if(cnt[id]>worst){worst=cnt[id];who=id;}});});
  var topT=P.titles.filter(function(t){return t.lvl>=3&&t.holders.length;})[0],changed=P.titles.some(function(t){return t.lvl>=3&&t.since===S.week&&t.holders.length;}),turned=R.some(function(w){return w.tw===S.week&&w.ovr>=P.image-12;});
  if(changed)bump('stale',-3,'A new champion freshens everything up');
  else if(turned)bump('stale',-2,'A big turn has people talking');
  else if(last.length>=4&&worst>=4)bump('stale',1,S.w[who].name+' has closed four shows in a row');
  else if(topT&&S.week-topT.since>30&&S.week%2===0)bump('stale',1,'The '+topT.name+' has not changed hands in '+(S.week-topT.since)+' weeks');
  else if(S.week%3===0)bump('stale',-1,'Enough variety at the top of the card');else C.stale.why=C.stale.why||'Holding';
  if(C.stale.v>=CLOCKS.stale.segs){C.stale.v=4;S.staleUntil=S.week+4;if(S.net)S.net.mood=clamp(S.net.mood-15,0,100);news(S,'world','The crowd has seen this act too many times. Expect thinner houses for '+P.name+' until something changes.');}
  // network patience and hot streak
  var reps=S.reports.filter(function(r){return r.week===S.week;}),tv=reps.filter(function(r){return !r.big;});
  if(tv.some(function(r){return r.rating<r.exp-2;}))bump('net',1,'A weekly show came in well under expectations');
  else if(tv.length&&tv.every(function(r){return r.rating>r.exp+1;}))bump('net',-1,'The network liked this week');else C.net.why=C.net.why||'Holding';
  if(C.net.v>=CLOCKS.net.segs){C.net.v=2;pushEv(S,{type:'netmeet',text:'The network wants a meeting. The numbers for your weekly show have been soft for too long.',choices:['Promise them a big main event','Accept a worse time slot','Push back'],checks:{2:mkCheck(9,[{n:'Popularity '+Math.round(P.image),v:P.image>=75?2:(P.image>=55?1:0)}].concat(skillMods(S,'talk')))}});}
  if(reps.length&&reps.every(function(r){return r.rating>r.exp;}))bump('hot',1,'Every show this week beat expectations');
  else if(reps.some(function(r){return r.rating<r.exp-2;})){C.hot.v=0;C.hot.why='A flat show broke the streak';}
  if(C.hot.v>=CLOCKS.hot.segs){C.hot.v=0;S.bp=(S.bp||0)+3;S.trust=clamp(S.trust+2,0,100);if(S.net)S.net.mood=clamp(S.net.mood+5,0,100);if(!S.owner.me)S.owner.trust=clamp(S.owner.trust+2,0,100);news(S,'you',P.name+' is on a hot streak. You bank three extra booking power.');}
  // breakout
  var st=C.star,sw=st.w!=null?S.w[st.w]:null;
  if(!sw||sw.promo!==P.id||sw.rt||sw.age>28||sw.camp){st.w=starPick(S);st.v=0;st.why=st.w!=null?'Your scouts like this one':'Nobody on the roster fits';sw=null;}
  if(sw){if(sw.wonWk===S.week)bump('star',1,sw.name+' won this week');else if(sw.ws<=-2)bump('star',-1,sw.name+' keeps losing');else if(S.week-(sw.lu||0)>=3)st.why=sw.name+' is not being used';
    if(st.v>=CLOCKS.star.segs){sw.ovr=clamp(sw.ovr+5,1,100);sw.mom=clamp(sw.mom+3,-10,10);sw.morale=clamp(sw.morale+8,0,100);mile(S,sw,'breakout','Broke out as a star in '+P.name);news(S,'story',sw.name+' has arrived. The crowd treats them like a star now.');award(S,'ACH_BREAKOUT');st.w=starPick(S);if(st.w===sw.id)st.w=null;st.v=0;st.why='Looking for the next one';}}
}
EVR.mutiny=function(S,ev,choice,P){
  var R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),all=function(fn){R.forEach(fn);};
  if(choice===0){var r=rollCheck(S,ev.checks[0]);ev.roll=r;
    if(r.ok){S.trust=clamp(S.trust+8,0,100);all(function(w){stressAdd(S,w,-12);w.morale=clamp(w.morale+3,0,100);});S.clocks.mutiny.v=0;return rollText(r)+'You take every question and duck none of them. The room is with you again.';}
    S.trust=clamp(S.trust-5,0,100);all(function(w){w.morale=clamp(w.morale-3,0,100);});return rollText(r)+'It turns into a shouting match. You leave with less than you walked in with.';}
  if(choice===1){
    if(S.owner.me){all(function(w){w.wage=Math.round(w.wage*1.05/10)*10;w.morale=clamp(w.morale+6,0,100);stressAdd(S,w,-6);});S.clocks.mutiny.v=0;return 'Everybody gets five per cent. It is expensive, and it works.';}
    S.owner.trust=clamp(S.owner.trust-6,0,100);all(function(w){w.morale=clamp(w.morale+3,0,100);stressAdd(S,w,-6);});return S.owner.name+' calms them down, and reminds you afterwards whose job that was.';}
  S.trust=clamp(S.trust-10,0,100);all(function(w){w.morale=clamp(w.morale-4,0,100);stressAdd(S,w,8);});return 'You carry on as if nothing happened. They notice.';
};
EVR.netmeet=function(S,ev,choice,P){
  var down=function(){if(P.slot>0){P.slot--;return 'Your show moves to '+SLOTN[P.slot].toLowerCase()+'.';}P.tvRate=Math.round(P.tvRate*0.93);return 'There is no worse slot to give you, so they cut the rights fee instead.';};
  if(choice===0){var sh=P.shows[0],tg=Math.round(clamp(expected(P,sh)+4,40,95)),bonus=Math.round(P.inc0*0.05/1000)*1000;
    S.quests.push({id:S.nid++,type:'netvow',due:S.week+3,target:tg,bonus:bonus,text:'Promise to the network: a main event of '+tg+'% or better by '+cal(S.week+3).label});return 'You give your word: a main event of '+tg+'% or better within three weeks.';}
  if(choice===1){S.clocks.net.v=0;return 'You take the hit. '+down();}
  var r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){S.clocks.net.v=0;return rollText(r)+'You remind them what your show does for their Thursday. They back off.';}
  if(!S.owner.me)S.owner.trust=clamp(S.owner.trust-4,0,100);return rollText(r)+'They do not appreciate the tone. '+down();
};
QEND.netvow=function(S,q){var P=S.promos[S.player];if(P.slot>0){P.slot--;news(S,'money','You broke your promise to the network. '+P.name+' moves to '+SLOTN[P.slot].toLowerCase()+'.');}else{P.tvRate=Math.round(P.tvRate*0.93);news(S,'money','You broke your promise to the network. They cut the rights fee.');}};
PREX.push(function(S){if(S.staleUntil&&S.week<=S.staleUntil)S.hype=(S.hype||0)-0.05;});

/* --- every week --- */
WEEKX.push(function(S){
  if(S.over)return;bsInit(S);
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  // house rules that work on the week
  if(S.house.on.length)R.forEach(function(w){var d=(hasRule(S,'iron')?1:0)+(hasRule(S,'kayfabe')?0.5:0)-(hasRule(S,'curfew')?1.5:0);if(d)stressAdd(S,w,d);});
  if(hasRule(S,'def4'))P.titles.forEach(function(t){if(t.holders.length&&S.week-(t.last||t.since||0)>4){if(S.net)S.net.mood=clamp(S.net.mood-3,0,100);if(!t.warn||S.week-t.warn>=4){t.warn=S.week;news(S,'title','The '+t.name+' has gone more than four weeks without a defence. The thirty-day rule is being ignored.');}}});
  if(hasRule(S,'open'))S.order.forEach(function(id){if(id!==P.id){var RV=S.promos[id];if((RV.rel||0)<40)RV.rel=(RV.rel||0)+0.5;}});
  // the docket
  S.court.slice().forEach(function(c){
    var a=S.w[c.a],b=S.w[c.b];
    if(a.promo!==P.id||b.promo!==P.id){S.court=S.court.filter(function(x){return x!==c;});return;}
    if(S.week-c.wk>=3){stressAdd(S,a,10);stressAdd(S,b,10);S.rel[rkey(a.id,b.id)]=-1;S.trust=clamp(S.trust-2,0,100);S.court=S.court.filter(function(x){return x!==c;});news(S,'story','Nobody heard '+a.name+'’s complaint against '+b.name+'. It has turned into a grudge.');}
  });
  if(S.court.length<2&&chance(S,0.15+(hasRule(S,'kayfabe')?0.08:0)-(hasRule(S,'curfew')?0.07:0)+(R.some(function(w){return w.role==='toxic';})?0.06:0)+(R.some(function(w){return w.role==='leader'&&w.morale>=50;})?0:0.07))){var c=mkCase(S);if(c){S.court.push(c);news(S,'story','A case for wrestlers’ court: '+c.text);}}
  tickClocks(S);
  S.ap=apMax(S);S.apUsed={};S.apLog=[];
});

/* ===== 78-models.js ===== */
/* ---------- company models: how a promotion is run ----------
   Every promotion follows one model. A model changes what its crowd rewards, where its money comes from, how much risk
   it can carry, who it pushes, who it hires and who it lets go. The same wrestler is worth a different amount to each.
   Models are patterns of how wrestling companies are really run; the promotions and people using them are invented.
   Hooks: mq/cr/fin(ctx) add to match quality, crowd and finish; push(w,P,S) biases who wins; fit(w,P,S) scores a wrestler
   for this company (overness-like units); card(h) reshapes a suggested card; show(S,P,show,rep) and month(S,P) are the
   owner's verdict when the player books here. */
function mAvg(ws,k){return avg(ws.map(function(w){return w[k]==null?60:w[k];}));}
function isMulti(m){return m.mt==='3way'||m.mt==='4way'||m.mt==='6man'||m.mt==='br';}
function isGim(stip){return stip==='hardcore'||stip==='ladder'||stip==='cage';}
function tenureW(S,w){return S.week-(w.jw==null?-104:w.jw);}
var MGC={};   // main gender per promotion, counted once a week (the roster does not change its mind inside a week)
function mainG(S,P){var k=S.seed+':'+S.week+':'+P.id,c=MGC[k];if(c)return c;var m=0,f=0;S.w.forEach(function(w){if(w.promo===P.id&&!w.nw){if(w.g==='F')f++;else m++;}});if(Object.keys(MGC).length>200)MGC={};return MGC[k]=f>m?'F':'M';}
/* add `d` to a running total and put a line on the match's plus-and-minus list when it is big enough to matter */
function mNote(ctx,d,text){if(text&&Math.abs(d)>=1)ctx.fx.push({s:d>=0?1:-1,x:text,m:1});return d;}

var MODELS={
  classic:{n:'Independent',ph:'an independent company',vals:'overness',d:'No house system. The crowd takes each show as it comes.',good:[],bad:[],mix:{}},

  corporate:{n:'Corporate giant',ph:'a corporate giant',vals:'overness, charisma and star quality',wq:0.34,own:'the board',
    d:'Publicly traded. A family audience, entertainment before sport, and a board that reads the accounts before the reviews.',
    good:['Star quality and charisma lift every match','Television and sponsors pay more here than anywhere','Fewer injuries: the house style is safe'],
    bad:['Hardcore matches upset the audience and the sponsors','The product can never go past Mainstream','Great wrestlers nobody cares about get lost, and then released','The shareholders take a dividend of any surplus above a reserve'],
    mix:{tv:1.25,gate:0.95,merch:1.2,sp:1.4},riskMax:1,inj:0.9,turn:1.3,ownShow:0.5,div:[1.3,0.5],
    cr:function(ctx){var d=0,sq=mAvg(ctx.all,'sq'),ch=mAvg(ctx.all,'cha');
      d+=mNote(ctx,clamp((sq-70)*0.07,-2,2.5),sq>=70?'Star presence: this audience buys names':'Nobody in there looks like a star to this audience');
      if(ctx.stip==='hardcore')d+=mNote(ctx,-3,'Too violent for a family audience');
      if(ch<60)d+=mNote(ctx,-1.5,'Good wrestlers this audience has been given no reason to care about');
      return {d:d,x:null};},
    push:function(w){return 0.12*(w.sq-65)+0.06*(w.cha-65);},
    fit:function(w){return 0.5*w.ovr+0.3*w.cha+0.2*w.sq;},
    show:function(S,P,show,rep){return rep.segs.some(function(s){return s.k==='match'&&s.stip==='Hardcore';})?{d:-1,x:'The board had calls from sponsors about the violence.'}:null;},
    month:function(S,P){var H=P.hist.slice(-4),net=0;H.forEach(function(h){net+=h.net;});var tgt=4*P.net,d=(net-tgt)/Math.max(1,Math.abs(tgt))*2;d=Math.abs(d)<0.5?0:(d>0?1:-1)*clamp(Math.abs(d),1,3);   // a good or bad month moves trust by one to three points
      P.planRun=net>=tgt?(P.planRun||0)+1:0;if(P.planRun>=4)award(S,'ACH_BOARD_4');
      return {d:r1(d),x:'The board reviewed the month: '+money(net)+' against a plan of '+money(tgt)+'.'};}},

  workrate:{n:'Wrestling for the diehards',ph:'a diehards’ company',vals:'overness and work rate, with some stamina',wq:0.62,own:'the founder',
    d:'Founded by a fan for the fans who rate matches. The work comes first, the crowd knows the difference, and the internet is always watching.',
    good:['Great matches lift the crowd as well as the rating','Two elite workers together are an event','Gimmick matches that settle a feud go over big'],
    bad:['A bad match gets booed, whoever is in it','Fan mood online moves ticket sales twice as much','Wages run high: the best workers know their value'],
    mix:{gate:1.1,ppv:1.15,merch:0.95,sp:0.9},inj:1.1,reach:30,netX:2,ownShow:1.15,
    mq:function(ctx){var d=0;if(ctx.all.length<=4&&ctx.all.every(function(w){return workRate(w)>=84;}))d+=mNote(ctx,2,'Two elite workers: the diehards came for this');
      if(ctx.stip!=='std'&&ctx.feud&&ctx.feud.heat>=40)d+=mNote(ctx,1,'A feud settled the hard way');return {d:d,x:null};},
    cr:function(ctx){var d=clamp((ctx.MQ-75)*0.12,-2.5,3.5);return {d:mNote(ctx,d,d>=0?'This crowd rewards the work':'This crowd knows a bad match when it sees one'),x:null};},
    post:function(ctx){if(ctx.res.OV>=88)ctx.all.forEach(function(w){w.morale=clamp(w.morale+1,0,100);});},
    push:function(w){return 0.12*(workRate(w)-72);},
    fit:function(w){return 0.45*w.ovr+0.45*workRate(w)+0.1*w.stam;},
    show:function(S,P,show,rep){return rep.segs.some(function(s){return s.k==='match'&&s.mq>=88;})?{d:0.5,x:'The founder is a fan first: one of those matches made the night.'}:null;}},

  purist:{n:'Sport first',ph:'a sport-first company',vals:'overness, work rate and stamina. Showmen are marked down',wq:0.68,own:'the committee',
    d:'Wrestling presented as a sport. Stamina, fighting spirit and clean results; the roster is judged on its matches, not its television time.',
    good:['Stamina and long matches are rewarded','Tournament matches mean more','Great matches lift locker-room morale; time off television does not hurt it'],
    bad:['Entertainers and comedy are rejected','Gimmick matches and cheap finishes cost you','Little television money: the gate is the business'],
    mix:{tv:0.7,gate:1.35,ppv:1.1,sp:0.9},riskMax:1,inj:1.15,noTvEgo:true,turn:1.1,
    mq:function(ctx){var d=0,st=mAvg(ctx.all,'stam');d+=mNote(ctx,clamp((st-72)*0.06,-1.5,2),st>=72?'Conditioning this crowd respects':'Short of the conditioning this crowd expects');
      if(ctx.m.len==='S'&&ctx.i>=ctx.n-3)d+=mNote(ctx,-1.5,'Too short to be taken seriously here');
      if(isGim(ctx.stip))d+=mNote(ctx,-3,'Gimmick matches are not what this crowd pays for');
      var T=ctx.S.tourn;if(T&&!T.done&&T.promo===ctx.P.id&&ctx.m.mt==='1v1'&&tournPair(T,ctx.all[0].id,ctx.all[1].id)>=0)d+=mNote(ctx,2,'A tournament match in a company built on them');
      return {d:d,x:null};},
    cr:function(ctx){var e=ctx.all.filter(function(w){return w.style==='E';}).length;return e?{d:mNote(ctx,-Math.min(3,e*2),'An entertainer in a company that sells sport'),x:null}:null;},
    fin:function(ctx,fin){return fin==='clean'?{d:1,x:null}:(fin==='cheap'||fin==='interf'?{d:mNote(ctx,-2,'This crowd wants a clean result'),x:null}:null);},
    post:function(ctx){var ov=ctx.res.OV;if(ov>=85||ov<55)ctx.all.forEach(function(w){w.morale=clamp(w.morale+(ov>=85?1.5:-1),0,100);});},
    push:function(w){return 0.1*(workRate(w)-72)+0.08*(w.stam-70);},
    fit:function(w){return 0.45*w.ovr+0.35*workRate(w)+0.2*w.stam-(w.style==='E'?8:0);},
    card:function(h){h.card.forEach(function(m){if(m._p>=60&&m.len!=='L')m.len=m._p>=90?'L':'M';});},
    show:function(S,P,show,rep){var ms=rep.segs.filter(function(s){return s.k==='match';}),cl=ms.filter(function(s){return s.fin==='clean';}).length/Math.max(1,ms.length),main=ms[ms.length-1];
      if(main&&(main.fin==='dq'||main.fin==='co'))return {d:-0.5,x:'The committee does not accept a main event without a result.'};return cl>=0.7?{d:0.3,x:'The committee approved of the clean results.'}:null;}},

  underdog:{n:'Resilient underdog',ph:'an underdog company',vals:'overness, work rate and charisma. A recent castoff gets a boost',wq:0.52,own:'the promoter',
    d:'A small budget and a long memory. It builds divisions the big companies ignore and turns their castoffs back into stars.',
    good:['Matches for secondary and division titles draw extra interest','Wrestlers released by a bigger company arrive cheap and motivated','Division titles gain prestige faster'],
    bad:['Thin margins: one bad month shows','Stars you build get poached','Low production values to start'],
    mix:{tv:1.1,gate:0.9,ppv:0.9,sp:1.1},chip:true,
    cr:function(ctx){var t=ctx.t,d=0;if(t&&(t.lvl<3||t.g!==mainG(ctx.S,ctx.P)))d+=mNote(ctx,2.5,'The division is the draw here');
      if(ctx.all.some(function(w){return w.chip>=ctx.S.week;}))d+=mNote(ctx,1,'A castoff with a point to prove');return d?{d:d,x:null}:null;},
    post:function(ctx){var t=ctx.t,r=ctx.res;if(t&&t.lvl<3&&r.OV>=70)t.prestige=clamp(t.prestige+0.6,10,100);if(r.win>=0)r.winners.forEach(function(w){if(w.chip>=ctx.S.week)addOvr(ctx.P,w,0.3);});},
    push:function(w,P,S){return (w.chip>=S.week?3:0)+0.05*(workRate(w)-70);},
    fit:function(w,P,S){return 0.6*w.ovr+0.25*workRate(w)+0.15*w.cha+(w.cut&&S.week-w.cut.w<52?6:0);}},

  startup:{n:'New money',ph:'a new-money company',vals:'overness and star quality, and young wrestlers with potential',wq:0.5,own:'the backer',
    d:'A brand-new company with a blank cheque and a clock. Stars cost a fortune, the rest of the roster is unknowns, and it loses money until it lands real television.',
    good:['Big names will sign for a company this size, at a price','A marquee name in the main event lifts the crowd','Television is worth more here than anywhere once the slot improves'],
    bad:['It loses money every week it stays in a late-night slot','Popularity leaks away while there is no better TV deal','A main event without a star falls flat'],
    mix:{tv:1.3,sp:1.1},turn:1.9,reach:45,premium:1.35,
    cr:function(ctx){if(!ctx.isMain)return null;var top=Math.max.apply(null,ctx.all.map(function(w){return w.ovr;})),im=ctx.P.image;
      return top>=im+22?{d:mNote(ctx,2,'A marquee name the building came to see'),x:null}:(top<im+8?{d:mNote(ctx,-2,'No star in the main event of a company built on stars'),x:null}:null);},
    push:function(w,P){return clamp(0.1*(w.ovr-P.image-10),-2,4);},
    fit:function(w){return 0.7*w.ovr+0.3*w.sq+(w.age<=25?(w.pot-60)*0.25:0);},
    month:function(S,P){
      if(P.slot>(P.slotSeen==null?P.slot0:P.slotSeen)){P.slotSeen=P.slot;P.image=clamp(P.image+1.5,5,100);return {d:6,x:'A better television slot is exactly what this company was built to land. The buzz is back.'};}
      P.slotSeen=P.slot;if(P.slot===0&&S.week>12){P.image=clamp(P.image-0.4,5,100);return {d:-1.5,x:'Still in a late-night slot. The backer is losing patience and the buzz is fading.'};}return null;}},

  outlaw:{n:'Outlaw',ph:'an outlaw company',vals:'overness, hardcore skill and charisma',wq:0.4,own:'the promoter',
    d:'A cult following and no rules. Weapons, blood and personality; technique is beside the point. Cheap to run, and it will never be mainstream.',
    good:['Toughness and charisma are the work rate here','Gimmick matches hit harder, and you can run as many as you like','Tiny production costs; the gate and the merchandise table pay the bills'],
    bad:['Popularity has a ceiling','Sponsors and networks pay little','A plain wrestling match bores this crowd'],
    mix:{tv:0.6,gate:1.3,ppv:0.9,merch:1.35,sp:0.5},prodX:0.25,turn:0.6,cap:62,riskMin:2,riskFree:true,gimFree:true,
    mq:function(ctx){var d=0,g=clamp((mAvg(ctx.all,'hc')-mAvg(ctx.all,'tech'))*0.08,-3,3);d+=mNote(ctx,g,g>=0?'Toughness is the work rate here':'Technicians without the stomach for this');
      if(isGim(ctx.stip))d+=mNote(ctx,2,'Exactly the kind of match this crowd came for');else if(ctx.stip==='std'&&ctx.i>=ctx.n-2)d+=mNote(ctx,-1.5,'No weapons, no blood: this crowd got restless');return {d:d,x:null};},
    cr:function(ctx){var c=mAvg(ctx.all,'cha');return {d:mNote(ctx,clamp((c-68)*0.1,-3,3),c>=68?'Personalities this crowd lives for':'Nobody in there this crowd connects with'),x:null};},
    push:function(w){return 0.1*(w.hc-65)+0.08*(w.cha-68);},
    fit:function(w){return 0.4*w.ovr+0.3*w.hc+0.3*w.cha;},
    card:function(h){var k=0;h.card.forEach(function(m){if(m.mt==='1v1'&&m.stip==='std'&&k<3&&(m._p>=90||h.chance(0.3))){m.stip=h.pick(['hardcore','hardcore','cage','ladder']);k++;}});}},

  spectacle:{n:'Lucha spectacle',ph:'a lucha spectacle company',vals:'overness, charisma and high flying',wq:0.42,own:'the showman',
    d:'Commercial, colourful and chaotic. Multi-man matches, soap-opera feuds, a sponsor on every turnbuckle and a door always open to crossover shows.',
    good:['Multi-man matches are the house style','Feuds heat up faster','Sponsors pay far more, and rivals say yes to supershows more easily'],
    bad:['A plain undercard singles match feels flat','High flying means more injuries','The product cannot go past Edgy without losing the sponsors'],
    mix:{tv:1.1,ppv:0.9,merch:1.15,sp:1.7},riskMax:2,inj:1.1,heat:1.2,xf:1,
    cr:function(ctx){var d=0,sp=mAvg(ctx.all,'speed');if(isMulti(ctx.m))d+=mNote(ctx,3,'Chaos in the ring is the house style');
      else if(ctx.m.mt==='1v1'&&!ctx.t&&!ctx.feud&&!ctx.isMain)d+=mNote(ctx,-1,'A plain singles match on a card built for spectacle');
      var fl=clamp((sp-70)*0.05,-1,1.5);d+=mNote(ctx,fl,fl>0?'High flying this crowd came to see':'Too grounded for this crowd');return {d:d,x:null};},
    fin:function(ctx,fin){return fin==='cheap'||fin==='interf'||fin==='foiled'?{d:1,x:null}:null;},
    push:function(w){return 0.1*(w.cha-68)+0.06*(w.speed-68);},
    fit:function(w){return 0.45*w.ovr+0.3*w.cha+0.25*w.speed;},
    card:function(h){h.multi(h.chance(0.5)?'6man':'4way');}},

  tradition:{n:'Lucha tradition',ph:'a lucha tradition company',vals:'overness, work rate, consistency and years with the company',wq:0.55,own:'the council',
    d:'The oldest way of doing things. Clean wrestling, teams and trios, family names, and a top spot that has to be earned over years.',
    good:['Tag and trios matches are the tradition','Clean finishes are rewarded','Long-serving wrestlers lift the top of the card and stay loyal'],
    bad:['Pushing anyone with under a year in the company costs you','A newcomer taking a title angers the veterans','Gimmick matches and cheap finishes go down badly'],
    mix:{tv:0.9,gate:1.3,ppv:0.85,merch:0.9,sp:0.9},riskMax:1,inj:0.95,turn:0.9,
    cr:function(ctx){var d=0,S=ctx.S;
      if(ctx.isMain||ctx.t){var nw=ctx.all.filter(function(w){return tenureW(S,w)<52;});
        if(nw.length)d+=mNote(ctx,-2.5,nw[0].name+' has not paid their dues in this company');else if(ctx.all.every(function(w){return tenureW(S,w)>=156;}))d+=mNote(ctx,1,'Faces this crowd has trusted for years');}
      if(ctx.m.mt==='6man'||ctx.m.mt==='tag')d+=mNote(ctx,2,'Teams are the tradition here');
      if(isGim(ctx.stip))d+=mNote(ctx,-2,'A gimmick match in a company that does not hold with them');return d?{d:d,x:null}:null;},
    fin:function(ctx,fin){return fin==='clean'?{d:1,x:null}:(fin==='cheap'||fin==='interf'?{d:mNote(ctx,-1.5,'Not how matches are won here'),x:null}:(fin==='dq'?{d:-1,x:null}:null));},
    post:function(ctx){var S=ctx.S,r=ctx.res;if(!r.seg.change)return;var nw=r.winners.filter(function(w){return tenureW(S,w)<52;});if(!nw.length)return;
      rosterOf(S,ctx.P.id).forEach(function(w){if(tenureW(S,w)>=104&&r.winners.indexOf(w)<0)w.morale=clamp(w.morale-3,0,100);});
      if(ctx.isPl)r.seg.notes.push('The veterans did not like a newcomer taking that title.');r.newcomer=true;},
    push:function(w,P,S){return Math.min(3,tenureW(S,w)/104)+(w.age>=35?1:0)-(tenureW(S,w)<52?3:0);},
    fit:function(w,P,S){return 0.5*w.ovr+0.25*workRate(w)+0.15*w.cons+Math.min(10,tenureW(S,w)/26);},
    card:function(h){h.multi('6man');},
    show:function(S,P,show,rep){return rep.segs.some(function(s){return s.k==='match'&&s.newcomer;})?{d:-2,x:'The council does not hand titles to newcomers.'}:null;}},

  joshi:{n:'Joshi',ph:'a joshi company',vals:'overness, work rate and charisma',wq:0.62,own:'the founder',gender:'F',
    d:'An all-women company. Blistering pace, stiff strikes and loyal factions; the money comes from the merchandise table, not the network.',
    good:['Speed and conditioning are rewarded','Faction against faction lifts the crowd','Merchandise pays double: the stars you build are the business'],
    bad:['Only women can be signed','The stiff style means more injuries','Television money is half what it is elsewhere'],
    mix:{tv:0.5,gate:1.1,ppv:0.8,merch:1.35},turn:1.3,riskMax:2,inj:1.3,
    mq:function(ctx){var d=0,p=(mAvg(ctx.all,'speed')+mAvg(ctx.all,'stam'))/2;d+=mNote(ctx,clamp((p-72)*0.07,-2,2.5),p>=72?'The pace this crowd expects':'Too slow for this crowd');
      if(ctx.m.len==='L'&&!ctx.isMain)d+=mNote(ctx,-1,'The pace dropped in a long undercard match');return {d:d,x:null};},
    cr:function(ctx){if(ctx.sides.length!==2)return null;var a=ctx.sides[0][0].stable,b=ctx.sides[1][0].stable;if(a==null||b==null)return null;
      return a!==b?{d:mNote(ctx,2,'Faction against faction'),x:null}:{d:mNote(ctx,-1,'Stablemates with nothing to fight over'),x:null};},
    push:function(w){return 0.1*(workRate(w)-75)+0.05*(w.cha-65);},
    fit:function(w){return w.g==='F'?0.45*w.ovr+0.4*workRate(w)+0.15*w.cha:-999;}}
};
/* what that company's crowd says when its model's bonus (first list) or penalty (second list) fires in a match */
MODEL_CROWD.corporate=[['The family sections are on their feet, {p}. This is the night out they paid for.','Star power in the ring, and the cameras are loving it.'],['The suits upstairs will not enjoy that one, {p}.','Too rough for this family crowd. You can hear the parents.']];
MODEL_CROWD.workrate=[['The purists are standing for this one, {p}. Real wrestling.','You can hear the old hands in the crowd nodding along.'],['This crowd knows its wrestling, and it is not impressed.','The diehards in the front row are shaking their heads.']];
MODEL_CROWD.purist=[['Not a wasted move in there. The sport-first crowd loves it.','That is wrestling as it should be, {p}.'],['Too much show and not enough sport for this crowd.','The judges at ringside are scribbling notes, and none of them kind.']];
MODEL_CROWD.underdog=[['The small crowd is making the noise of a big one, {p}.','This place loves a fighter nobody gave a chance.'],['Hard to sell the big moment in a building this size.','The cheap seats want more fight than that.']];
MODEL_CROWD.startup=[['The new money is on show tonight and it is working, {p}.','Fresh faces, big names. The buzz is real.'],['Plenty of cheque, not much heart. The crowd feels it.','The people who paid for the big names expected more than that.']];
MODEL_CROWD.outlaw=[['This outlaw crowd came for blood and it is getting its money’s worth.','Chairs, chaos, and a building that loves every second.'],['Nobody came to an outlaw show for a technical clinic. Boos in the cheap seats.','This crowd wants it nastier, {p}.']];
MODEL_CROWD.spectacle=[['Masks, flips and a roar from the cheap seats. This is what they came for.','The whole building is on its feet and waving, {p}.'],['Too grounded for a lucha crowd. They want flying.','Where are the high spots? The crowd wants colour.']];
MODEL_CROWD.tradition=[['Generations in the stands, and they know a classic when they see one.','The old rules, done right. The crowd respects it, {p}.'],['The elders of the crowd are not satisfied by that.','Tradition asks for more than that, and the crowd says so.']];
MODEL_CROWD.joshi=[['Fierce, fast and fearless. The crowd is chanting for them.','The merchandise tables will sell out after that, {p}.'],['The fans expect more fire from this division.','Not the spark this crowd came for.']];
function modelOf(P){return (P&&MODELS[P.model])||MODELS.classic;}
function mixOf(P){var m=modelOf(P).mix||{};return {tv:m.tv||1,gate:m.gate||1,ppv:m.ppv||1,merch:m.merch||1,sp:m.sp||1};}
function fitFor(S,P,w){var M=modelOf(P);return M.fit?M.fit(w,P,S):w.ovr;}
function riskRange(P){var M=modelOf(P);return [M.riskMin||0,M.riskMax==null?3:M.riskMax];}
function spMax(P){return modelOf(P).spMax||3;}

/* the match engine asks the model at every step */
MQX.push(function(ctx){var M=modelOf(ctx.P);return M.mq?M.mq(ctx):null;});
CRX.push(function(ctx){var M=modelOf(ctx.P);return M.cr?M.cr(ctx):null;});
FINX.push(function(ctx,fin,winners,losers,win){var M=modelOf(ctx.P);return M.fin?M.fin(ctx,fin,winners,losers,win):null;});
EFX.push(function(ctx,w){return w.chip>=ctx.S.week?5:0;});
POST.push(function(ctx){var M=modelOf(ctx.P);if(M.post&&!ctx.S.cal)M.post(ctx);if(ctx.res.newcomer)ctx.res.seg.newcomer=true;});

/* a new world: tenure for everybody already under contract, and each company clamps its risk level to what its model allows */
NEWX.push(function(S){
  S.w.forEach(function(w){if(w.promo!=='FA'&&w.jw==null)w.jw=-Math.round(52*clamp((w.age-21)*0.5*(0.4+h01(w.name+'ten')),0.2,12));});
  S.order.forEach(function(pid){var P=S.promos[pid],rr=riskRange(P);P.risk=clamp(P.risk,rr[0],rr[1]);P.size0=rosterOf(S,pid).length;});
});

/* achievements that belong to one company model */
WEEKX.push(function(S){
  var P=S.promos[S.player],id=P.model||'classic';
  if(id==='startup'&&S.week>=104&&!S.over)award(S,'ACH_STARTUP_2Y');
  if(id==='outlaw'&&MODELS.outlaw.cap&&P.image>=MODELS.outlaw.cap-0.3)award(S,'ACH_OUTLAW_CEIL');
  if(id==='joshi'&&S.week>8&&S.order.some(function(o){return o!==S.player&&S.promos[o].image>P.image&&(S.promos[o].mer||0)<(P.mer||0);}))award(S,'ACH_JOSHI_MERCH');
});
POST.push(function(ctx){var P=ctx.P,r=ctx.res;if(ctx.isPl&&P.model==='tradition'&&r.seg.change)r.winners.forEach(function(w){if(w.age>=33)award(ctx.S,'ACH_TRAD_VET');});});
/* every week: the popularity ceiling; every fourth week: the owner's monthly verdict, and rival companies trim and restock by fit */
WEEKX.push(function(S){
  S.order.forEach(function(pid){var P=S.promos[pid],M=modelOf(P);if(M.cap&&P.image>M.cap)P.image=M.cap;});
  // a company run for its shareholders pays out most of what piles up beyond a healthy reserve, once a month
  if(cal(S.week).wom===4)S.order.forEach(function(pid){var P=S.promos[pid],M=modelOf(P);if(!M.div)return;var ex=P.cash-(P.cash0||P.cash)*M.div[0];
    if(ex>0){var dv=Math.round(ex*M.div[1]/10000)*10000;P.cash-=dv;if(pid===S.player)news(S,'money','The shareholders took a dividend of '+money(dv)+' from the month\'s surplus.');}});
  var PL=S.promos[S.player],MP=modelOf(PL);
  if(cal(S.week).wom===4&&MP.month){var v=MP.month(S,PL);if(v){if(S.owner&&!S.owner.me)S.owner.trust=clamp(S.owner.trust+v.d,0,100);news(S,'you',v.x);}}
  S.order.forEach(function(pid,ix){
    if(pid===S.player||(S.week+ix)%4)return;
    var P=S.promos[pid],M=modelOf(P),R=rosterOf(S,pid).filter(function(w){return !w.nw;});
    if(M===MODELS.startup){if(P.slot<2&&P.image>=SLOT_REQ[P.slot+1]&&chance(S,0.2)){P.slot++;news(S,'money',P.name+' landed a better television slot: '+SLOTN[P.slot].toLowerCase()+'.');}M.month(S,P);}
    // a company that has run out of money sheds its biggest wage
    if(P.cash<0&&P.neg>=12&&(P.prodLvl>0||P.adv>0)){
      if(P.prodLvl>0){P.prodLvl--;news(S,'money',P.name+' cut production to '+PRODN[P.prodLvl].toLowerCase()+' after weeks in the red.');}
      else{P.adv--;news(S,'money',P.name+' cut its advertising after weeks in the red.');}
      P.neg=8;return;}
    if(P.cash<0&&P.neg>=3&&chance(S,0.5)){var big=R.filter(function(w){return holdLvl(P,w.id)===0&&!inFeud(S,w.id);}).sort(function(a,b){return b.wage-a.wage;})[0];
      if(big){news(S,'contract',P.name+' can no longer afford '+big.name+', who is a free agent.');P.nrel=(P.nrel||0)+1;leaveCompany(S,big,'released');big.cut={w:S.week,from:pid,img:P.image};big.promo='FA';big.brand=null;return;}}
    if(!M.fit||R.length<Math.max(14,(P.size0||R.length)-3)||!chance(S,0.2*(M.turn||1)))return;
    // let go of whoever is worth least to this company relative to their standing: never a champion, a team half or anyone mid-feud
    var G=mainG(S,P),c=R.filter(function(w){return holdLvl(P,w.id)===0&&w.team==null&&w.inj<=0&&!inFeud(S,w.id)&&S.week-(w.jw||0)>=26&&R.filter(function(x){return x.g===w.g;}).length>6;});
    if(!c.length)return;
    var res=function(x){return fitFor(S,P,x)-x.ovr;},all=R.map(res).sort(function(a,b){return a-b;}),med=all[Math.floor(all.length/2)];
    c.sort(function(a,b){return res(a)-res(b);});
    var w=c[0];if(res(w)>med-5)return;
    news(S,'contract',P.name+' released '+w.name+'.'+(w.ovr>=60?' '+pick(S,['Not what that company is looking for.','A good hand who never fitted the system there.','Somebody else is going to be glad of that.']):''));
    P.nrel=(P.nrel||0)+1;leaveCompany(S,w,'released');w.cut={w:S.week,from:pid,img:P.image};w.promo='FA';w.brand=null;w.morale=clamp(w.morale-10,20,100);
  });
});

/* joining and leaving: tenure starts again, and a castoff arrives at an underdog with something to prove */
function modelJoin(S,w,P){
  w.jw=S.week;
  if(modelOf(P).chip&&w.cut&&S.week-w.cut.w<52&&w.cut.img>P.image+5){w.chip=S.week+26;w.mom=clamp(w.mom+3,-10,10);w.morale=Math.max(w.morale,88);if(P.id===S.player)news(S,'contract',w.name+' arrives with a point to prove after being let go by '+(S.promos[w.cut.from]?S.promos[w.cut.from].name:'a bigger company')+'.');}
}

/* what the screens show */
E.MODELS=MODELS;E.tenure=function(S,id){var w=S.w[id];return w&&w.jw!=null?Math.max(0,S.week-w.jw):null;};E.chem=function(S,a,b){return chem(S,a,b);};
E.modelOf=function(S,pid){var P=S.promos[pid||S.player],M=modelOf(P),rr=riskRange(P),mx=mixOf(P);return {id:P.model||'classic',n:M.n,ph:M.ph,vals:M.vals||'overness',d:M.d,good:M.good,bad:M.bad,own:M.own||'the owner',mix:mx,riskMin:rr[0],riskMax:rr[1],spMax:spMax(P),cap:M.cap||null,gender:M.gender||null};};
E.modelList=function(){return Object.keys(MODELS).map(function(k){var M=MODELS[k];return {id:k,n:M.n,d:M.d,good:M.good,bad:M.bad};});};
/* how well a wrestler suits the player's company: the fit score set against their overness */
var fitMed={k:'',v:0};
E.fit=function(S,id){var w=S.w[id],P=S.promos[S.player],M=modelOf(P);if(!w||!M.fit)return null;var f=M.fit(w,P,S);if(f<-100)return {v:-99,n:'Cannot work here'};
  // judged against the typical member of your own roster, so a star is not marked down just for being a star
  var R=rosterOf(S,P.id).filter(function(x){return !x.nw;}),k=S.seed+':'+S.week+':'+P.id+':'+R.length;
  if(fitMed.k!==k){var a=R.map(function(x){return M.fit(x,P,S)-x.ovr;}).sort(function(x,y){return x-y;});fitMed={k:k,v:a.length?a[Math.floor(a.length/2)]:0};}
  var d=f-w.ovr-fitMed.v;
  return {v:Math.round(d),n:d>=5?'Made for this company':(d>=2?'A good fit':(d>-2?'Fits well enough':(d>-5?'An awkward fit':'Wrong for this company')))};};

/* ===== 80-world.js ===== */
/* ---------- difficulty ---------- */
var DIFF={
  easy:{n:'Rookie',d:'A patient owner, extra booking power and a softer crowd.',bp:2,exp:-1.5,over:-0.03,inj:0.8,fire:-5,mor:3},
  normal:{n:'Veteran',d:'The game as designed.',bp:0,exp:0,over:0,inj:1,fire:0,mor:0},
  hard:{n:'Main eventer',d:'The crowd expects more, money is tighter and the owner has less patience.',bp:-1,exp:1.5,over:0.03,inj:1.15,fire:7,mor:-2},
  brutal:{n:'Legend',d:'Thin margins, a demanding crowd and an owner who fires fast.',bp:-2,exp:3,over:0.06,inj:1.3,fire:13,mor:-4}
};
/* difficulty by part: money, injuries, egos and rival aggression can each be set a step easier (0) or harder (2) than the chosen level (1) */
var DPART_N={money:'Money',inj:'Injuries',ego:'Egos',rival:'Rival aggression'};
function dif(S){
  var d=DIFF[S.diff]||DIFF.normal,p=S.dpart;if(!p)return d;
  return {n:d.n,d:d.d,bp:d.bp,exp:d.exp,fire:d.fire,over:d.over+(p.money-1)*0.03,inj:d.inj*[0.8,1,1.25][p.inj],mor:d.mor+(1-p.ego)*3};
}
E.DPART=DPART_N;
E.diffSummary=function(S){var p=S.dpart;if(!p)return null;var w=['easier','as set','harder'];return Object.keys(DPART_N).filter(function(k){return p[k]!==1;}).map(function(k){return DPART_N[k].toLowerCase()+' '+w[p[k]];}).join(', ')||null;};
NEWX.push(function(S){var P=S.promos[S.player],d=dif(S);P.expB=d.exp;P.fixed=Math.max(0,P.fixed+Math.round(P.inc0*d.over));});
WEEKX.push(function(S){if(S.week>=49&&(S.diff==='hard'||S.diff==='brutal'))award(S,'ACH_HARD');});
E.DIFF=DIFF;

/* ---------- create a federation ---------- */
var FED_SIZE={
  local:{n:'Local',d:'A few hundred fans in an armory. Tiny wages, tiny margins, everything to build.',image:20,cash:150000,wageMult:0.22,tvRate:300,prod:4000,net:300,roster:18,prodLvl:0,angles:1},
  regional:{n:'Regional',d:'A regional TV deal and a loyal territory.',image:32,cash:800000,wageMult:0.32,tvRate:700,prod:20000,net:1500,roster:24,prodLvl:1,angles:2},
  cult:{n:'Cult favourite',d:'A national following without the national money.',image:44,cash:3000000,wageMult:0.45,tvRate:1200,prod:60000,net:5000,roster:32,prodLvl:1,angles:2}
};
var FED_REGION={
  midwest:{n:'Midwest',c:['Minneapolis','Chicago','Milwaukee','Des Moines','Omaha','St. Louis','Kansas City','Indianapolis','Detroit','Cleveland']},
  south:{n:'South',c:['Atlanta','Nashville','Memphis','Charlotte','Birmingham','New Orleans','Dallas','Houston','Tampa','Louisville']},
  east:{n:'Northeast',c:['Philadelphia','Boston','Pittsburgh','Baltimore','Hartford','Providence','Albany','Buffalo','Newark','Allentown']},
  west:{n:'West',c:['Phoenix','Denver','Portland','Sacramento','Las Vegas','Salt Lake City','San Diego','Albuquerque','Spokane','Reno']}
};
function clean(s,n){return String(s==null?'':s).replace(/[<>&"|\n\r]/g,'').replace(/\s+/g,' ').trim().slice(0,n);}
function mkFedDef(f,bookerName){
  var z=FED_SIZE[f.size]||FED_SIZE.regional,rg=FED_REGION[f.region]||FED_REGION.midwest,MF=MODELS[f.model]||MODELS.classic,only=MF.gender||null,women=only==='F'||f.women!==false,g1=only||'M';
  var short=clean(f.short,6).toUpperCase()||'EWF',titles=[{id:'own_w',name:clean(f.title,28)||'World Title',g:g1,lvl:3,holders:[]},{id:'own_m',name:'Television Title',g:g1,lvl:2,holders:[]}];
  if(women&&!only)titles.push({id:'own_f',name:'Women’s Title',g:'F',lvl:3,holders:[]});
  titles.push({id:'own_t',name:'Tag Team Titles',g:g1,lvl:2,tag:true,holders:[]});
  return {id:'OWN',mine:true,name:short,full:clean(f.name,40)||'Elite Wrestling Federation',blurb:'Your own promotion.',cash:z.cash,image:z.image,wq:MF.wq||0.5,angles:z.angles,wageMult:z.wageMult,tvRate:z.tvRate,prod:z.prod,net:z.net,flagship:3,
    prodLvl:z.prodLvl,risk:clamp(1,MF.riskMin||0,MF.riskMax==null?3:MF.riskMax),slot:0,model:MODELS[f.model]&&f.model!=='classic'?f.model:null,announcers:['Dale Pruitt','Vic Marlowe'],cities:rg.c.slice(),staff:{agent:'Walt Dunleavy',writer:'June Castellan'},
    owner:{name:bookerName,style:STYLES[f.style]?f.style:'merit',roots:ROOTS[f.roots]?f.roots:'tradition',pledge:PLEDGE[f.pledge]?f.pledge:'chance'},
    shows:[{id:'own1',name:clean(f.show,28)||'Friday Night Fury',mult:1}],titles:titles,teams:[],draft:{n:z.roster,women:women,only:only}};
}
function draftRoster(S,P,d){
  var fa=S.w.filter(function(w){return w.promo==='FA'&&!w.rt&&!w.nw&&w.ovr<=P.image+12;}).sort(function(a,b){return b.ovr-a.ovr;});
  // a company drafts for its own system: the best fits first
  fa.sort(function(a,b){return fitFor(S,P,b)-fitFor(S,P,a);});
  var only=d.draft.only,nf=only==='F'?d.draft.n:(d.draft.women?Math.round(d.draft.n*0.3):0),nm=d.draft.n-nf,men=fa.filter(function(w){return w.g==='M';}).slice(0,nm),wom=fa.filter(function(w){return w.g==='F';}).slice(0,nf);
  men.concat(wom).forEach(function(w,i){w.promo=P.id;w.brand=null;w.align=i%2?'H':'F';});
  var tm=only==='F'?wom:men;
  for(var i=2;i+1<tm.length&&i<8;i+=2)formTeam(S,P,tm[i],tm[i+1],20);
}
E.FED_SIZE=FED_SIZE;E.FED_REGION=FED_REGION;

/* ---------- career records: the shared bones for a booking game and a career mode ----------
   Every wrestler carries a milestone log and a stat line per year, whoever books them. */
function mile(S,w,k,t){if(S.cal||!w)return;var L=w.log||(w.log=[]);L.push({w:S.week,k:k,t:t});if(L.length>24)L.splice(1,1);}
function ystat(S,w){var y=cal(S.week).year,Y=w.ys||(w.ys={});return Y[y]||(Y[y]=[0,0,0,0,0,0,0]);}   // matches, wins, losses, draws, best match, main events, titles won
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P;if(S.cal)return;
  ctx.all.forEach(function(w){var y=ystat(S,w);y[0]++;if(r.OV>y[4])y[4]=r.OV;if(ctx.isMain)y[5]++;if(r.win<0)y[3]++;});
  r.winners.forEach(function(w){ystat(S,w)[1]++;if(w.ws===10)mile(S,w,'streak','Reached ten wins in a row');});
  if(ctx.m.mt!=='br')r.losers.forEach(function(w){ystat(S,w)[2]++;});
  if(r.seg.change&&ctx.t)r.winners.forEach(function(w){ystat(S,w)[6]++;mile(S,w,'title','Won the '+P.name+' '+ctx.t.name+' at '+ctx.show.name);});
  if(ctx.isPl&&r.OV>=97&&ctx.m.mt!=='br')ctx.all.forEach(function(w){mile(S,w,'match','A '+r.OV+'% match at '+ctx.show.name);});
});
E.career=function(S,id){
  var w=S.w[id];if(!w)return null;var Y=w.ys||{},reigns=[];
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){(t.hist||[]).forEach(function(h){if((','+h.ids+',').indexOf(','+id+',')>=0)reigns.push({t:t.name,p:S.promos[pid].name,from:h.from,to:h.to,defs:h.defs});});});});
  return {log:(w.log||[]).slice().reverse(),years:Object.keys(Y).sort().reverse().map(function(y){var a=Y[y];return {y:+y,m:a[0],w:a[1],l:a[2],d:a[3],best:a[4],main:a[5],titles:a[6]};}),reigns:reigns.sort(function(a,b){return b.from-a.from;})};
};

/* ---------- create a wrestler ---------- */
var BGS={
  rookie:{n:'Green rookie',d:'Raw and cheap, with a high ceiling. Send them to camp.',ovr:-28,work:46,mic:45,pot:24},
  indie:{n:'Indie standout',d:'Can work today. The crowd does not know them yet.',ovr:-20,work:68,mic:55,pot:9},
  athlete:{n:'Crossover athlete',d:'A name from another sport. People will look, but the ring work is years away.',ovr:-8,work:40,mic:58,pot:26},
  veteran:{n:'Veteran hand',d:'Knows every trick and can talk. No room left to grow.',ovr:-14,work:76,mic:72,pot:0}
};
var EMPH={ring:'Ring work',mic:'Charisma',look:'Star presence'};
function createStats(S,o){
  var P=S.promos[S.player],bg=BGS[o.bg]||BGS.indie,ovr=clamp(Math.round(P.image+bg.ovr+(o.emph==='look'?5:0)),5,90),work=bg.work+(o.emph==='ring'?8:0),mic=bg.mic+(o.emph==='mic'?10:0),wage=wageFor(ovr,P);
  return {ovr:ovr,work:work,mic:mic,pot:Math.min(99,work+bg.pot),wage:wage,fee:wage*8};
}
E.createInfo=function(S){var wait=(S.lastCreate==null?-99:S.lastCreate)+6-S.week;return {ok:wait<=0,wait:Math.max(0,wait),bgs:BGS,emph:EMPH};};
E.createPreview=createStats;
E.createWrestler=function(S,o){
  var P=S.promos[S.player],info=E.createInfo(S);if(!info.ok)return {ok:false,msg:'Your scouts need '+info.wait+' more week'+(info.wait===1?'':'s')+' before they bring you anyone new.'};
  var name=clean(o.name,28);if(name.length<2)return {ok:false,msg:'Give them a name first.'};
  if(S.w.some(function(w){return w.name.toLowerCase()===name.toLowerCase();}))return {ok:false,msg:'There is already a '+name+' in the business.'};
  var st=createStats(S,o);
  if(wagesWeek(S,P)+st.wage>E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on another wage.'};
  var w=addWrestler(S,{name:name,g:o.g==='F'?'F':'M',ovr:st.ovr,style:STYLE[o.style]?o.style:'A',work:st.work,mic:st.mic,align:o.align==='H'?'H':'F',fin:clean(o.fin,24)||null},'FA',null);
  w.pot=clamp(st.pot,workRate(w),99);w.cr=true;assignGim(w);if(GIMBY[o.gim])w.gim=o.gim;
  if(o.face&&typeof o.face==='object'){w.face={};['h','hr','fh','ms','ey','ns'].forEach(function(k){w.face[k]=clamp(Math.round(+o.face[k]||0),0,9);});w.face.sk=clamp(Math.round(+o.face.sk||0),0,100);w.face.hc=clamp(Math.round(+o.face.hc||0),0,100);}
  joinCompany(S,w,P,st.wage,96);P.cash-=st.fee;S.lastCreate=S.week;
  mile(S,w,'debut','Discovered and signed by '+P.name);news(S,'contract',P.name+' signed newcomer '+w.name+'.');award(S,'ACH_CREATE');
  return {ok:true,id:w.id,msg:w.name+' signs a two-year deal at '+money(st.wage)+' a week. Signing cost: '+money(st.fee)+'.'};
};

/* ---------- the opening promo: you choose who talks, about what, and how ---------- */
var TOPIC={
  rival:{n:'Go after a rival',d:'Needs a feud. A good one adds heat to it.'},
  title:{n:'Talk about the title',d:'Best from a champion or a ranked contender.'},
  crowd:{n:'Work the crowd',d:'Safe anywhere. Builds momentum.'},
  story:{n:'Tell their own story',d:'Best right after something has happened to them.'}
};
var DELIV={
  script:{n:'Scripted word for word',t:5,cap:7,d:'Hard to get wrong, and never great.'},
  notes:{n:'Bullet points',t:7,cap:9,d:'The usual way.'},
  cuff:{n:'Off the cuff',t:9,cap:10,d:'The best promos are made this way. So are the worst.'}
};
function promoParts(S,P,w,topic){
  var f=feudsFor(S,w.id).filter(function(x){return x.promo===P.id;}).sort(function(a,b){return b.heat-a.heat;})[0],rv=f?S.w[(f.a.indexOf(w.id)>=0?f.b:f.a)[0]]:null;
  var C=5,why='',heel=w.align==='H',fit=7;
  if(topic==='rival'){C=f?Math.min(10,Math.round(6+f.heat/25)):3;why=f?'There is a live feud with '+rv.name+' to talk about':'Nobody to aim it at';fit=heel?9:7;}
  else if(topic==='title'){
    var lv=holdLvl(P,w.id),rk=-1,tn=null;
    if(lv>0){P.titles.forEach(function(t){if(t.holders.indexOf(w.id)>=0&&(!tn||t.lvl>tn.lvl))tn=t;});C=tn&&tn.defs>=3?9:8;why='Speaks as '+tn.name+' champion';}
    else{P.titles.forEach(function(t){if(t.tag||t.g!==w.g)return;var ix=rankFor(S,P,t,5).map(function(x){return x.id;}).indexOf(w.id);if(ix>=0&&(rk<0||ix<rk)){rk=ix;tn=t;}});
      C=w.shot?9:(rk<0?3:(rk<=2?8:6));why=w.shot?'Has a title shot in hand':(rk<0?'Has not earned the right to talk about a title':'Ranked number '+(rk+1)+' for the '+tn.name);}
    fit=7;
  }else if(topic==='crowd'){C=6;why='Always something to say about the town';fit=8;}
  else{
    var hot=(w.lt&&S.week-w.lt.w<=8)||(w.tw&&S.week-w.tw<=6)||(w.rw&&S.week-w.rw<=3)||w.ws>=4||w.ws<=-3||w.deb;
    C=hot?9:5;why=hot?'Something has just happened to them worth talking about':'Nothing new in their story right now';fit=heel?6:9;
  }
  var Ch=clamp(Math.round(0.5*gimFit(w)/10+0.5*fit),1,10);
  return {f:f,rv:rv,C:C,why:why,Ch:Ch,Cr:clamp(Math.round(0.07*w.ovr+0.03*w.cha+w.mom*0.3),1,10)};
}
function promoCheck(S,w,del){
  var D=DELIV[del]||DELIV.notes,m=micOf(S,w);
  return mkCheck(D.t,[{n:(hasMouthpiece(S,w)?'A mouthpiece does the talking: charisma ':'Charisma ')+Math.round(m),v:m>=85?2:(m>=70?1:(m<50?-1:0))},{n:'The gimmick fits',v:gimFit(w)>=80?1:0},moraleMod(w)].concat(skillMods(S,'creative')));
}
E.TOPIC=TOPIC;E.DELIV=DELIV;
E.promoBrief=function(S){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return [];
  return eligible(S,P,show).filter(function(w){return w.promo===P.id&&!(show.big&&isDev(P,w.brand));}).sort(function(a,b){return (micOf(S,b)+b.ovr*0.5)-(micOf(S,a)+a.ovr*0.5);}).slice(0,12);
};
E.promoOdds=function(S,plan){
  var P=S.promos[S.player],w=plan&&S.w[plan.sp];if(!w)return null;
  var pp=promoParts(S,P,w,plan.topic),ck=promoCheck(S,w,plan.del);
  return {ck:ck,content:pp.C,why:pp.why,character:pp.Ch,crowd:pp.Cr,rival:pp.rv?pp.rv.name:null,cap:(DELIV[plan.del]||DELIV.notes).cap};
};
E.setPlan=function(S,plan){S.plan=plan&&S.w[plan.sp]?{sp:+plan.sp,topic:TOPIC[plan.topic]?plan.topic:'crowd',del:DELIV[plan.del]?plan.del:'notes'}:null;};
function planPromo(S,P,show,ctx){
  var pl=S.plan;S.plan=null;if(!pl)return null;var w=S.w[pl.sp];if(!w||!ctx.inP[w.id])return null;
  var pp=promoParts(S,P,w,pl.topic),D0=DELIV[pl.del],r=rollCheck(S,promoCheck(S,w,pl.del)),mg=r.total-r.target;
  var D=r.ok?Math.min(D0.cap,7+mg):Math.max(2,5+mg),ov=clamp(Math.round(10*(0.35*D+0.25*pp.C+0.2*pp.Ch+0.2*pp.Cr)),5,99);
  ctx.angled[w.id]=1;
  var who=hasMouthpiece(S,w)?S.w[w.mgr].name+', speaking for '+w.name+',':w.name;
  var text=who+' opens the show '+(pl.topic==='rival'?(pp.rv?'and goes after '+pp.rv.name:'looking for a fight and finding nobody'):(pl.topic==='title'?'and talks about championship gold':(pl.topic==='crowd'?'and plays to the crowd':'and tells the people where things stand')))+', '+(pl.del==='script'?'word for word from the script':(pl.del==='notes'?'working from a few bullet points':'with no script at all'))+'. '+
    (r.ok?(D>=9?'Every line lands.':'It does the job.'):(pl.del==='cuff'?'It wanders, and the crowd drifts.':'The delivery is flat.'));
  addOvr(P,w,clamp((ov-w.ovr)/30,-1,1.5));
  var extra='';
  if(pl.topic==='rival'&&pp.f){heatUp(S,pp.f,clamp((ov-55)/4,-3,9),w.name+' cut a promo on '+pp.rv.name);ctx.angled[pp.rv.id]=1;}
  else if(pl.topic==='title'&&pp.C>=8&&holdLvl(P,w.id)===0)w.pts=(w.pts||0)+3;
  else if(pl.topic==='crowd'&&ov>=70)w.mom=clamp(w.mom+1,-10,10);
  else if(pl.topic==='story'&&ov>=70)w.morale=clamp(w.morale+3,0,100);
  if(!r.ok&&pl.del==='cuff'&&chance(S,0.4)){
    var cs=ctx.pool.filter(function(x){return x.id!==w.id&&x.g===w.g&&Math.abs(x.ovr-w.ovr)<=10&&!feudOf(S,w.id,x.id)&&(w.team==null||x.team!==w.team);});
    if(cs.length){var tg=pick(S,cs);if(startFeud(S,P,tg,w,30,w.name+' took an unscripted shot at '+tg.name))extra=' An unscripted remark about '+tg.name+' has started something.';}
  }
  if(ov>=80)gainXp(S,3);if(ov>=85)award(S,'ACH_PROMO');
  var seg=angle('Opening promo',text+extra,ov);
  seg.rub={d:D,c:pp.C,ch:pp.Ch,cr:pp.Cr};seg.roll=r;seg.who=w.name;if(pp.f&&pl.topic==='rival')seg.feud=pp.f.id;
  seg.bc=[{t:'note',x:text+extra},{t:'note',x:rollText(r)+'Delivery '+D+', content '+pp.C+', character '+pp.Ch+', crowd '+pp.Cr+' out of 10.'},{t:'col',x:ov>=80?'That is how you open a show.':(ov>=60?'A solid start to the night.':'Well. We have a long show ahead of us to make up for that.')}];
  return seg;
}

/* ---------- fed against fed: relations, trades, supershows and turf wars ---------- */

function xf(S){return S.xf&&S.xf.until>=S.week?S.xf:null;}
function isGuest(S,P,w,show){var x=S.xf;return !!x&&x.until>=S.week&&P.id===S.player&&w.promo===x.with&&x.guests.indexOf(w.id)>=0&&w.inj<=0&&(x.kind==='war'||!!show.big);}
function relMod(RV){var r=RV.rel||0;return {n:'Relations with '+RV.name+(r>=20?' are good':(r<=-20?' are bad':' are neutral')),v:r>=50?2:(r>=20?1:(r<=-50?-2:(r<=-20?-1:0)))};}
/* ---------- 59. Rival owners are people: raider, gentleman, hermit or showman decides how they trade, fight and talk ---------- */
var TEMPER={
  raider:{n:'Raider',d:'Takes what is not nailed down. Drives a hard bargain and raids contracts.',trade:-1,show:0,war:1},
  gentleman:{n:'Gentleman',d:'Plays fair and keeps their word. Easy to deal with, rarely starts a fight.',trade:1,show:1,war:-1},
  hermit:{n:'Hermit',d:'Keeps to themselves. Hard to reach, and it is hard to start a war with them.',trade:-1,show:-2,war:-2},
  showman:{n:'Showman',d:'Lives for the spectacle. Loves a crossover show and a good fight.',trade:0,show:1,war:1}
};
function temperOf(P){
  if(!P)return TEMPER.gentleman;if(P.temper&&TEMPER[P.temper])return TEMPER[P.temper];
  var m=P.model,k=m==='outlaw'?'raider':(m==='tradition'?'gentleman':(m==='spectacle'?'showman':(m==='corporate'?'hermit':['raider','gentleman','hermit','showman'][hash('temper'+P.id)%4])));
  return TEMPER[k];
}
function temperKey(P){var t=temperOf(P);return Object.keys(TEMPER).filter(function(k){return TEMPER[k]===t;})[0];}
function temperMod(RV,kind){var t=temperOf(RV),v=t[kind]||0;return {n:RV.owner&&RV.owner.name?RV.owner.name+', a '+t.n.toLowerCase():'Their owner, a '+t.n.toLowerCase(),v:v};}
E.TEMPER=TEMPER;
E.temperOf=function(S,pid){var P=S.promos[pid];if(!P)return null;var t=temperOf(P);return {key:temperKey(P),n:t.n,d:t.d,owner:P.owner?P.owner.name:null};};
function agreeTradeMod(S,RV){return S.agree&&S.agree.with===RV.id?{n:'Your working agreement: talent moves easily between you',v:2}:null;}
function gapMod(P,RV){return {n:'Your popularity against theirs',v:P.image>=RV.image?1:(RV.image-P.image>30?-3:(RV.image-P.image>15?-2:-1))};}
E.xfOdds=function(S,pid,kind){
  var P=S.promos[S.player],RV=S.promos[pid];if(!RV||pid===P.id)return null;
  if(kind==='war'){var rm=relMod(RV);return mkCheck(7,[{n:rm.n,v:-rm.v},gapMod(P,RV),temperMod(RV,'war')].concat(skillMods(S,'creative')));}
  var xm=(modelOf(P).xf||0)+(modelOf(RV).xf||0);
  return mkCheck(8,[relMod(RV),gapMod(P,RV),temperMod(RV,'show')].concat(xm?[{n:'Crossover shows are the business of a lucha spectacle',v:Math.min(2,xm)}]:[]).concat(skillMods(S,'talk')));
};
E.xfCan=function(S,pid){
  if(xf(S))return 'You already have an arrangement running with '+S.promos[S.xf.with].name+'.';
  var RV=S.promos[pid];if(RV.image-S.promos[S.player].image>25)return RV.name+' is too big to take your calls yet.';
  if(RV.xfAsk&&S.week-RV.xfAsk<4)return RV.name+' will not take another call until '+cal(RV.xfAsk+4).label+'.';
  return null;
};
function startXf(S,pid,kind){
  var P=S.promos[S.player],RV=S.promos[pid],GX=mainG(S,P),L=rosterOf(S,pid).filter(function(w){return w.inj<=0&&!w.nw&&w.g===GX&&!isDev(RV,w.brand);}).sort(function(a,b){return b.ovr-a.ovr;});
  var pickIx=kind==='war'?[3,5,7,9]:[1,2,4],guests=pickIx.map(function(i){return L[i];}).filter(Boolean).map(function(w){return w.id;});
  if(kind==='super'&&rosterOf(S,P.id).some(function(w){return w.g==='F';})){var fw=rosterOf(S,pid).filter(function(w){return w.inj<=0&&w.g==='F';}).sort(function(a,b){return b.ovr-a.ovr;})[1];if(fw)guests.push(fw.id);}
  var wom=cal(S.week).wom,until;
  if(kind==='war'){until=S.week+7;until+=4-cal(until).wom;}else until=S.week+(4-wom)+(wom===4&&S.qi>=S.queue.length?4:0);
  S.xf={kind:kind,with:pid,start:S.week,until:until,guests:guests,sc:[0,0],n:0};
  news(S,'world',kind==='war'?RV.name+' and '+P.name+' are at war: '+guests.map(function(id){return S.w[id].name;}).join(', ')+' have crossed the line.':P.name+' and '+RV.name+' will share a supershow at '+P.name+' '+dbOf(S).events[cal(until).month]+'.');
}
E.xfPropose=function(S,pid,kind){
  var why=E.xfCan(S,pid);if(why)return {ok:false,msg:why};
  var RV=S.promos[pid],r=rollCheck(S,E.xfOdds(S,pid,kind));RV.xfAsk=S.week;
  if(!r.ok){RV.rel=clamp((RV.rel||0)-(kind==='war'?0:4),-100,100);return {ok:false,roll:r,msg:rollText(r)+(kind==='war'?RV.name+' will not be drawn into a fight.':RV.name+' turns the idea down.')};}
  startXf(S,pid,kind);
  return {ok:true,roll:r,msg:rollText(r)+(kind==='war'?'It is on. Four of theirs will show up on your shows until '+cal(S.xf.until).label+'. Beat them in the ring.':'They are in. Their wrestlers are yours to book at the big event in '+cal(S.xf.until).label+'.')};
};
function endXf(S,P,rep){
  var x=S.xf,RV=S.promos[x.with],msg;
  if(x.kind==='super'){
    if(x.n>0&&rep){var bonus=Math.round(0.15*(rep.ppv+rep.gate));P.led.bonus+=bonus;RV.cash+=Math.round(bonus*0.5);RV.rel=clamp((RV.rel||0)+10,-100,100);P.image=clamp(P.image+0.3,5,100);RV.image=clamp(RV.image+0.2,5,100);
      msg='The supershow with '+RV.name+' ended '+x.sc[0]+'–'+x.sc[1]+' in '+(x.sc[0]>=x.sc[1]?P.name:RV.name)+'’s favour and brought in '+money(bonus)+' extra.';rep.quest.push(msg);award(S,'ACH_SUPERSHOW');gainXp(S,15);}
    else{RV.rel=clamp((RV.rel||0)-8,-100,100);msg=RV.name+' sent talent to your big event and you never used them. They will remember that.';if(rep)rep.quest.push(msg);}
  }else{
    var won=x.sc[0]>x.sc[1],tie=x.sc[0]===x.sc[1];
    if(!tie){P.image=clamp(P.image+(won?0.6:-0.4),5,100);RV.image=clamp(RV.image+(won?-0.4:0.4),5,100);}
    RV.rel=clamp((RV.rel||0)+15,-100,100);
    msg='The war with '+RV.name+' is over, '+x.sc[0]+'–'+x.sc[1]+'. '+(tie?'Honours even.':(won?P.name+' held the line.':RV.name+' got the better of it.'));if(rep)rep.quest.push(msg);
    if(won){award(S,'ACH_WAR');gainXp(S,25);}
  }
  news(S,'world',msg);
  S.feuds.forEach(function(f){if(!f.res&&f.a.concat(f.b).some(function(id){return x.guests.indexOf(id)>=0;})){f.res=true;f.dead=true;f.end=S.week;}});
  S.xfLast={kind:x.kind,with:x.with,sc:x.sc,week:S.week};S.xf=null;
}
PREX.push(function(S,P,show){var x=xf(S);if(x&&(x.kind==='war'||show.big))S.hype=(S.hype||0)+(x.kind==='war'?0.04:0.1);});
CRX.push(function(ctx){
  var x=ctx.S.xf;if(!x||!ctx.isPl)return null;
  var g=ctx.sides.filter(function(s){return s.some(function(w){return w.promo!==ctx.P.id;});}).length;
  if(!g||g===ctx.sides.length)return g?{d:-2,x:'Two visitors and nobody from the home team'}:null;
  return {d:x.kind==='war'?6:4,x:'Promotion against promotion'};
});
POST.push(function(ctx){
  var S=ctx.S,x=S.xf,r=ctx.res;if(!x||!ctx.isPl)return;
  var g=ctx.sides.filter(function(s){return s.some(function(w){return w.promo!==ctx.P.id;});}).length;if(!g||g===ctx.sides.length)return;
  x.n++;r.seg.xf=true;if(r.win<0)return;
  var home=r.winners[0].promo===ctx.P.id;x.sc[home?0:1]++;
  r.seg.notes.push((home?ctx.P.name:S.promos[x.with].name)+' takes that one. The series stands at '+x.sc[0]+'–'+x.sc[1]+'.');
});
SHOWX.push(function(S,P,show,rep){var x=S.xf;if(!x||P.id!==S.player||!show.big||S.week<x.until)return;endXf(S,P,rep);});
WEEKX.push(function(S){
  S.order.forEach(function(id){var Q=S.promos[id];if(Q.rel)Q.rel+=Q.rel>0?-Math.min(0.5,Q.rel):Math.min(0.5,-Q.rel);});
  if(S.xf&&S.xf.until<=S.week)endXf(S,S.promos[S.player],null);
});
EVMAKE.push(function(S,P){
  if(S.xf||S.week<6)return null;
  var L=S.order.filter(function(id){return id!==P.id&&(S.promos[id].rel||0)<=-20&&S.promos[id].image-P.image<=25&&!(S.promos[id].xfAsk&&S.week-S.promos[id].xfAsk<8);});
  if(!L.length||!chance(S,0.3))return null;var pid=pick(S,L);S.promos[pid].xfAsk=S.week;
  return {type:'invasion',rival:pid,text:'Wrestlers from '+S.promos[pid].name+' bought front-row tickets to your last show and jumped the rail. The crowd went wild. Security is waiting on your word.',choices:['Turn it into a turf war','Throw them out']};
});
EVR.invasion=function(S,ev,choice){
  var RV=S.promos[ev.rival];
  if(choice===0&&!S.xf){startXf(S,ev.rival,'war');return 'It is a war. Four of theirs will be on your shows until '+cal(S.xf.until).label+'. Win more of those matches than you lose.';}
  RV.rel=clamp((RV.rel||0)+6,-100,100);S.hype=(S.hype||0)-0.03;return 'Security walks them out. The crowd wanted the fight, and the next house will be a little flatter for it.';
};
function tradeVal(w){return w.ovr+Math.max(0,w.pot-workRate(w))*0.3+(w.mic-60)*0.05;}
E.tradeList=function(S,pid){var RV=S.promos[pid];return rosterOf(S,pid).filter(function(w){return holdLvl(RV,w.id)===0&&w.inj<=0&&!w.nw&&E.canSign(S,w);}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,40);};
E.tradeOdds=function(S,mine,theirs){
  var a=S.w[mine],b=S.w[theirs];if(!a||!b||a.promo!==S.player||b.promo===S.player||b.promo==='FA')return null;
  var RV=S.promos[b.promo];
  return mkCheck(8,[{n:'What they get against what they give up',v:clamp(Math.round((tradeVal(a)-tradeVal(b))/3),-5,4)},relMod(RV),temperMod(RV,'trade'),agreeTradeMod(S,RV)].concat(skillMods(S,'talk')));
};
E.trade=function(S,mine,theirs){
  var a=S.w[mine],b=S.w[theirs],P=S.promos[S.player],ck=E.tradeOdds(S,mine,theirs);if(!ck)return {ok:false,msg:'Pick one of yours and one of theirs.'};
  var RV=S.promos[b.promo];
  if(holdLvl(P,a.id)>0||holdLvl(RV,b.id)>0)return {ok:false,msg:'Champions are not on the table.'};
  if(a.inj>0||b.inj>0)return {ok:false,msg:'Nobody trades for an injured wrestler.'};
  if(RV.tradeAsk&&S.week-RV.tradeAsk<4)return {ok:false,msg:RV.name+' will not talk trades again until '+cal(RV.tradeAsk+4).label+'.'};
  if(!E.canSign(S,b))return {ok:false,msg:b.name+' would not come to a promotion your size.'};
  var wage=wageFor(b.ovr,P);if(wagesWeek(S,P)-a.wage+wage>E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on the wages.'};
  var r=rollCheck(S,ck);RV.tradeAsk=S.week;
  if(!r.ok){RV.rel=clamp((RV.rel||0)-3,-100,100);return {ok:false,roll:r,msg:rollText(r)+RV.name+' says no deal.'};}
  leaveCompany(S,a,'traded to '+RV.name);leaveCompany(S,b,'traded to '+P.name);
  joinCompany(S,a,RV,wageFor(a.ovr,RV),48);joinCompany(S,b,P,wage,48);
  RV.rel=clamp((RV.rel||0)+5,-100,100);news(S,'contract',P.name+' traded '+a.name+' to '+RV.name+' for '+b.name+'.');award(S,'ACH_TRADE');
  return {ok:true,roll:r,msg:rollText(r)+a.name+' goes to '+RV.name+'. '+b.name+' is yours at '+money(wage)+' a week.'};
};
E.xfState=function(S){var x=xf(S);return x?{kind:x.kind,with:x.with,until:x.until,sc:x.sc,guests:x.guests}:null;};

/* ---------- the net: what the fans are saying ---------- */
var FANS=[['ringrat_88','smark'],['FiveStarFrogSplash','smark'],['KayfabeKaren','casual'],['markmywords','casual'],['TurnbuckleTed','old'],['BellToBell_Bill','old'],['xX_HeelHeat_Xx','heel'],['statsguy_dave','stats'],['JobberJoe','under'],['CheapPop_Chris','casual'],['TapOrSnap','smark'],['row_z_ronnie','under']];
function fanFor(S,kind,used){var L=FANS.filter(function(f){return f[1]===kind&&!used[f[0]];});if(!L.length)L=FANS.filter(function(f){return !used[f[0]];});if(!L.length)L=FANS;var f=pick(S,L);used[f[0]]=1;return f[0];}
function netPosts(S,P,show,rep){
  var ms=rep.segs.filter(function(s){return s.k==='match';}),out=[],used={},d=rep.rating-rep.exp;if(!ms.length)return out;
  var best=ms.slice().sort(function(a,b){return b.ov-a.ov;})[0],worst=ms.slice().sort(function(a,b){return a.ov-b.ov;})[0],main=ms[ms.length-1];
  var mw=main.wi&&main.wi.length?S.w[main.wi[0]]:null,cheap=ms.filter(function(s){return s.fin==='cheap'||s.fin==='interf';}).length,nonf=ms.filter(function(s){return s.fin==='dq'||s.fin==='co'||s.fin==='draw';}).length,clean=ms.filter(function(s){return s.fin==='clean';}).length;
  function add(kind,s,t){out.push({k:kind,s:s,t:t});}
  if(best.ov>=rep.exp+10)add('smark',1,pick(S,[best.label+' was a clinic. I had the work at '+best.mq+'%.',best.label+'. Bookmark it. '+best.ov+'% and worth every point.','Go out of your way to see '+best.label+'. Best thing this company has done in a while.']));
  else if(best.ov<rep.exp+2)add('smark',-1,pick(S,['Not one match tonight worth watching twice. '+best.label+' was the best of it and that is being generous.','Nothing on that card stood out. '+best.label+' was fine, I suppose.','A show with no peak. Even '+best.label+' never got out of second gear.']));
  if(worst!==best&&worst.ov<rep.rating-12)add('smark',-1,pick(S,['Whoever laid out '+worst.label+' owes me '+worst.mins+' minutes of my life back.',worst.label+' at '+worst.ov+'%. Somebody in that office thought that was a good idea.']));
  ms.forEach(function(s){
    if(s.change)add('casual',1,pick(S,['NEW CHAMPION!!! '+s.win+' did it! I am still shaking.',s.win+' with the '+s.title+'. I did not think they would pull the trigger.']));
    if(s.win&&s.wi&&!s.called&&s.sidesN.length===2){var k=s.sidesN.indexOf(s.win);if(k>=0&&s.odds[k]<=25)add('stats',1,s.win+' had a '+s.odds[k]+'% chance going in by my numbers. My numbers are in the bin.');}
    if(s.win&&s.called&&s.sidesN.length===2){var k2=s.sidesN.indexOf(s.win);if(k2>=0&&s.odds[k2]<=30)add('under',0,s.win+' going over like that? Somebody in the office made a phone call. Not complaining.');}
    if(s.xf)add('casual',1,'Company against company. This is the stuff I used to argue about at school.');
  });
  if(mw)add(mw.align==='F'?'casual':'heel',mw.align==='F'?1:1,mw.align==='F'?pick(S,[main.win+' on top to end the night. That is all I ask.','Sent home happy. '+main.win+' in the main event is money.']):pick(S,[main.win+' is the best thing in wrestling and the booker knows it.',main.win+' wins again and the crowd hated every second. Perfect.']));
  if(mw&&mw.align==='H')add('casual',-1,'Why does '+main.win+' keep winning? I nearly threw the remote.');
  if(mw&&mw.align==='F')add('heel',-1,'The hero wins the main event. Groundbreaking. I was asleep by the bell.');
  if(cheap>=2)add('old',-1,'In my day you won with a wrestling hold, not a handful of tights. '+cheap+' cheap finishes tonight.');
  if(nonf>=2)add('old',-1,nonf+' matches without a winner. I counted. Finish your matches.');
  if(clean>=ms.length-1&&ms.length>=4)add('old',1,'Clean finishes up and down the card. That is how you build a division.');
  if(rep.gim&&!show.big)add('old',-1,'Giving away gimmick matches on free TV now. Save something for the big show.');
  add('stats',d>=0?1:-1,rep.name+': '+rep.rating+'% against an expected '+rep.exp+'%. '+(d>=0?'That is '+r1(d)+' over par.':'That is '+r1(-d)+' under.')+' Paid attendance '+rep.att.toLocaleString('en-US')+(rep.sellout?', a sell-out.':'.'));
  var pr=rep.segs.filter(function(s){return s.rub;})[0];
  if(pr){var pd=pr.ov-rep.exp;if(pd>=5)add('casual',1,pick(S,['That opening promo from '+pr.who+'. Chills.',pr.who+' on the microphone to open the show. More of that.']));else if(pd<-8)add('smark',-1,pick(S,['The opening promo died in front of a live audience.','Somebody take the microphone away from '+pr.who+'.']));}
  if(d>=4)add('under',1,'Best show in months. Tell your friends.');else if(d<=-4)add('under',-1,'I defend this company every week and they give me that.');
  if(rep.sellout)add('under',1,'I was there. Could not hear myself think. Sold out and it sounded like it.');
  // five posts at most, one per poster, in a shuffled order
  for(var i=out.length-1;i>0;i--){var j=Math.floor(rnd(S)*(i+1)),t=out[i];out[i]=out[j];out[j]=t;}
  return out.slice(0,5).map(function(p){return {u:fanFor(S,p.k,used),t:p.t,s:p.s};});
}
NEWX.push(function(S){S.net={mood:60,threads:[]};});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal||!S.net)return;
  var posts=netPosts(S,P,show,rep),sum=0;posts.forEach(function(p){sum+=p.s;});
  S.net.mood=clamp(S.net.mood+(clamp(55+(rep.rating-rep.exp)*5+sum*3,0,100)-S.net.mood)*0.25,0,100);
  S.net.threads.unshift({w:S.week,sub:rep.name+' ('+rep.rating+'%)',posts:posts});if(S.net.threads.length>10)S.net.threads.length=10;
  if(S.net.mood>=90)award(S,'ACH_BOARD');
});
PREX.push(function(S){if(S.net)S.hype=(S.hype||0)+clamp((S.net.mood-55)/900,-0.03,0.04)*(modelOf(S.promos[S.player]).netX||1);});
WEEKX.push(function(S){
  if(!S.net||S.over)return;var P=S.promos[S.player],R=rosterOf(S,P.id),L=[],used={};
  var exp=R.filter(function(w){return w.con<=6;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
  if(exp&&exp.ovr>=P.image-10)L.push(['casual','Hearing '+exp.name+'’s deal is nearly up. If '+P.name+' lets that walk out of the door I am done.']);
  if(!S.owner.me&&S.owner.trust<30)L.push(['smark','Word is the owner is losing patience with whoever is booking this. You can see why.']);
  var T=tournActive(S);if(T&&T.pend.length){var fav=T.ents.slice().sort(function(a,b){return S.w[b].ovr-S.w[a].ovr;})[0];L.push(['stats','My pick for the '+T.name+': '+S.w[fav].name+'. Bracket predictions below.']);}
  P.titles.forEach(function(t){if(t.holders.length&&!t.tag&&S.week-t.since>=20&&S.week%4===0)L.push(['old',S.w[t.holders[0]].name+' has held the '+t.name+' for '+(S.week-t.since)+' weeks. All-time great reign or going stale? Discuss.']);});
  var hot=activeFeuds(S).filter(function(f){return f.promo===P.id&&f.heat>=80;})[0];if(hot)L.push(['under',feudLabel(S,hot)+' has to happen at '+nextBigName(S,P)+'. Do not give it away on free TV.']);
  if(S.xf)L.push(['heel',S.promos[S.xf.with].name+' are going to walk through this roster.'+(S.xf.n?' '+S.xf.sc[1]+' to '+S.xf.sc[0]+' in their favour so far by my count.':' Wait and see.')]);
  var top=R.filter(function(w){return w.inj<=0&&!w.camp&&S.week-w.lu>=4;}).sort(function(a,b){return b.ovr-a.ovr;})[0];
  if(top&&top.ovr>=P.image)L.push(['casual','Has anyone seen '+top.name+'? '+(S.week-top.lu)+' weeks off the shows now.']);
  var said=S.net.said||(S.net.said={});L=L.filter(function(p){var k=p[1].slice(0,24);if(said[k]&&S.week-said[k]<6)return false;return true;});
  if(!L.length)return;
  for(var i=L.length-1;i>0;i--){var j=Math.floor(rnd(S)*(i+1)),t=L[i];L[i]=L[j];L[j]=t;}
  L=L.slice(0,2);L.forEach(function(p){said[p[1].slice(0,24)]=S.week;});Object.keys(said).forEach(function(k){if(S.week-said[k]>8)delete said[k];});
  S.net.threads.unshift({w:S.week,sub:'Rumour mill',posts:L.map(function(p){return {u:fanFor(S,p[0],used),t:p[1],s:0};})});if(S.net.threads.length>10)S.net.threads.length=10;
});

/* ---------- the season saga: four chapters, twelve weeks each, and a chronicle at the end ---------- */
var SAGA={
  reign:{n:'Find your champion',g:function(){return 'Have your champions make four successful title defences.';},need:function(){return 4;},v:function(S,c){return c.cnt.defs;}},
  star:{n:'Make a star',g:function(){return 'Raise one wrestler five points of overness.';},need:function(){return 5;},v:function(S,c){var P=S.promos[S.player],m=0;rosterOf(S,P.id).forEach(function(w){if(w.sg!=null&&w.ovr-w.sg>m)m=w.ovr-w.sg;});return Math.floor(m);}},
  feud:{n:'The rivalry',g:function(){return 'Settle two feuds in the ring.';},need:function(){return 2;},v:function(S,c){return S.stats.feudsDone-c.b.feuds;}},
  match:{n:'Match of the season',g:function(S,c){return 'Put on a match rated '+c.b.thr+'% or better.';},need:function(){return 1;},v:function(S,c){return c.cnt.m;}},
  blood:{n:'New blood',g:function(){return 'Crown two new champions.';},need:function(){return 2;},v:function(S,c){return c.cnt.changes;}},
  roll:{n:'On a roll',g:function(){return 'Beat the crowd’s expectations on six shows.';},need:function(){return 6;},v:function(S,c){return c.cnt.beat;}},
  house:{n:'Full house',g:function(){return 'Sell out three shows.';},need:function(){return 3;},v:function(S,c){return c.cnt.sell;}},
  grow:{n:'Grow the territory',g:function(){return 'Raise your popularity by a point and a half.';},need:function(){return 1.5;},v:function(S,c){return r1(S.promos[S.player].image-c.b.image);}},
  big:{n:'The big one',g:function(){return 'Run a big event three points over what the crowd expects.';},need:function(){return 1;},v:function(S,c){return c.cnt.big;}}
};
function sagaChapter(S,k){
  var P=S.promos[S.player];rosterOf(S,P.id).forEach(function(w){w.sg=w.ovr;});
  return {k:k,start:S.week,due:S.week+11,done:null,cnt:{defs:0,changes:0,m:0,beat:0,sell:0,big:0},b:{feuds:S.stats.feudsDone,image:P.image,thr:Math.min(97,Math.round((P.mainB.big||75)+6))}};
}
function newSaga(S,n){
  var ks=Object.keys(SAGA).filter(function(k){return k!=='big';}),i,j,t;
  for(i=ks.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=ks[i];ks[i]=ks[j];ks[j]=t;}
  var P=S.promos[S.player];
  S.saga={n:n,start:S.week,plan:ks.slice(0,3).concat(['big']),ch:[],i:0,b:{image:P.image,cash:P.cash,feuds:S.stats.feudsDone,shows:S.stats.shows,lvl:S.booker.lvl}};
  S.saga.ch.push(sagaChapter(S,S.saga.plan[0]));
}
NEWX.push(function(S){S.chron=[];newSaga(S,1);});
function sagaCheck(S){
  var G=S.saga;if(!G||S.over)return;var c=G.ch[G.i];if(!c||c.done!=null)return;
  var def=SAGA[c.k];
  if(def.v(S,c)>=def.need(S,c)){
    c.done=true;c.week=S.week;gainXp(S,30);S.bp+=2;if(!S.owner.me)S.owner.trust=clamp(S.owner.trust+3,0,100);
    news(S,'you','Season '+G.n+', chapter '+(G.i+1)+' complete: '+def.n+'. You earn 2 booking power.');
  }
}
function sagaAdvance(S){
  var G=S.saga;if(!G||S.over)return;var c=G.ch[G.i];
  if(c.done==null&&S.week>c.due){c.done=false;c.week=S.week;news(S,'you','Season '+G.n+', chapter '+(G.i+1)+' slipped away: '+SAGA[c.k].n+'.');}
  if(c.done==null||S.week<=c.due)return;
  if(G.i<3){G.i++;G.ch.push(sagaChapter(S,G.plan[G.i]));return;}
  chronicle(S);newSaga(S,G.n+1);
}
function chronicle(S){
  var G=S.saga,P=S.promos[S.player],L=[],done=G.ch.filter(function(c){return c.done;}).length;
  L.push('Season '+G.n+' ran from '+cal(G.start).label+' to '+cal(S.week).label+'. '+S.booker.name+' ran '+(S.stats.shows-G.b.shows)+' shows.');
  var top=P.titles.filter(function(t){return !t.tag;}).sort(function(a,b){return b.lvl-a.lvl;})[0];
  if(top){var ch=(top.hist||[]).filter(function(h){return h.from>=G.start;}).length;L.push('The '+top.name+' changed hands '+ch+' time'+(ch===1?'':'s')+'. '+(top.holders.length?S.w[top.holders[0]].name+' ended the season as champion.':'It ended the season vacant.'));}
  var bm=(S.rec.matches||[]).filter(function(m){return m.w>=G.start;})[0];if(bm)L.push('The match people will remember: '+bm.l+', '+bm.ov+'% at '+bm.show+'.');
  var fd=S.stats.feudsDone-G.b.feuds;L.push(fd?fd+' feud'+(fd===1?' was':'s were')+' settled in the ring.':'Not one feud reached a proper ending.');
  var di=P.image-G.b.image;L.push('Popularity went from '+G.b.image.toFixed(1)+' to '+P.image.toFixed(1)+(di>=1?', a season of growth.':(di<=-1?', a season of decline.':', holding steady.'))+' The bank balance moved by '+money(P.cash-G.b.cash)+'.');
  G.ch.forEach(function(c,i){L.push('Chapter '+(i+1)+', “'+SAGA[c.k].n+'”: '+(c.done?'done in '+cal(c.week).label+'.':'missed.'));});
  if(S.xfLast&&S.xfLast.week>=G.start)L.push('There was '+(S.xfLast.kind==='war'?'a war':'a supershow')+' with '+S.promos[S.xfLast.with].name+', '+S.xfLast.sc[0]+'–'+S.xfLast.sc[1]+'.');
  L.push(S.owner.me?S.booker.name+' owns the company and answers to nobody.':S.owner.name+'’s trust in '+S.booker.name+' stands at '+Math.round(S.owner.trust)+'.');
  S.chron.unshift({n:G.n,title:done>=4?'A perfect season':(done>=3?'A season to be proud of':(done>=2?'A mixed season':'A season to forget')),done:done,lines:L});if(S.chron.length>12)S.chron.length=12;
  if(done>=3){award(S,'ACH_SAGA');P.image=clamp(P.image+0.5,5,100);}
  news(S,'you','Season '+G.n+' is in the books: '+S.chron[0].title.toLowerCase()+'. Read the chronicle on the History screen.');
}
POST.push(function(ctx){
  var S=ctx.S,G=S.saga,r=ctx.res;if(!G||!ctx.isPl)return;var c=G.ch[G.i];if(!c||c.done!=null)return;
  if(ctx.t&&r.seg.change)c.cnt.changes++;else if(ctx.t&&ctx.champSide>=0&&r.win===ctx.champSide)c.cnt.defs++;
  if(r.OV>=c.b.thr)c.cnt.m++;
});
SHOWX.push(function(S,P,show,rep){
  var G=S.saga;if(!G||P.id!==S.player||S.cal)return;var c=G.ch[G.i];if(!c||c.done!=null)return;
  if(rep.rating>rep.exp)c.cnt.beat++;if(rep.sellout)c.cnt.sell++;if(show.big&&rep.rating>=rep.exp+3)c.cnt.big++;
  sagaCheck(S);
});
WEEKX.push(function(S){sagaCheck(S);sagaAdvance(S);});
E.sagaInfo=function(S){
  var G=S.saga;if(!G)return null;
  return {n:G.n,i:G.i,ch:G.plan.map(function(k,i){var c=G.ch[i],def=SAGA[k];return {name:def.n,goal:c?def.g(S,c):null,done:c?c.done:null,cur:i===G.i,v:c?Math.max(0,def.v(S,c)):0,need:c?def.need(S,c):0,due:c?c.due:null};})};
};

/* ===== 82-wishes.js ===== */
/* ---------- small depth systems from WISHLIST.md ---------- */

/* a wrestler back from a long injury gets a returning pop that fades over four weeks */
CRX.push(function(ctx){
  var d=0,names=[];
  ctx.all.forEach(function(w){
    if(!w.rw||w.rwl==null)return;var age=ctx.S.week-w.rw;
    if(age<0||age>3||w.rwl<3)return;
    d+=2.4*(1-age/4)*(w.ovr>=50?1:0.6);names.push(w.name);
  });
  return names.length?{d:d,x:names.join(' and ')+(names.length>1?' are':' is')+' back from injury and the crowd knows it'}:null;
});

/* gimmick matches wear out: each stipulation draws a little less every time it is used inside a year, and recovers with rest */
function stipUseList(P,stip){var u=P.su||(P.su={});return u[stip]||(u[stip]=[]);}
function stipWorn(S,P,stip){if(!stip||stip==='std')return 0;var L=stipUseList(P,stip).filter(function(w){return S.week-w<52;});return modelOf(P).gimFree?0:Math.max(0,L.length-12);}   // a gimmick company's crowd never tires of them
CRX.push(function(ctx){
  var n=stipWorn(ctx.S,ctx.P,ctx.stip);if(!n)return null;
  return {d:-Math.min(2,n*0.15),x:'The '+STIP[ctx.stip].n.toLowerCase()+' match has been done to death this year'};
});
POST.push(function(ctx){if(ctx.S.cal||!ctx.stip||ctx.stip==='std')return;var L=stipUseList(ctx.P,ctx.stip);L.push(ctx.S.week);while(L.length&&ctx.S.week-L[0]>=52)L.shift();});
/* for the booking screen: how worn is a stipulation for the player's company */
E.stipFresh=function(S,stip){var n=stipWorn(S,S.promos[S.player],stip);return {worn:n,word:n>=12?'overused':(n>=5?'getting stale':'fresh')};};

/* referees: four named officials with a skill. A sharp one lifts the main event; a weak one can miss a call, and it becomes a story */
var REFEREES=[{n:'Inspector Bucket',sk:82},{n:'Sergeant Cuff',sk:70},{n:'Mr. Pickwick',sk:56},{n:'Dogberry',sk:32}];
function refFor(ctx){var h=(ctx.S.week*7+(ctx.show.id||'x').length*3+(ctx.isMain?0:1+ctx.m.sides.length))%REFEREES.length;return REFEREES[h];}
CRX.push(function(ctx){
  var r=refFor(ctx);if(!ctx.isMain||r.sk<75)return null;
  return {d:1.2,x:r.n+' is the referee for the main event, and nothing gets past them'};
});
POST.push(function(ctx){
  if(ctx.S.cal)return;var r=refFor(ctx),seg=ctx.res.seg;seg.ref=r.n;
  if(r.sk>=45||!chance(ctx.S,0.14))return;
  var what=pick(ctx.S,['a clear pin','a low blow','a tag','a rope break','a foreign object']);
  seg.ov=clamp(seg.ov-3,5,99);seg.notes.push(r.n+' missed '+what+'. The crowd is furious.');
  if(ctx.feud)heatUp(ctx.S,ctx.feud,4,r.n+' missed '+what);
  if(ctx.isPl)news(ctx.S,'story',r.n+' missed '+what+' at '+ctx.show.name+'. The talk is of nothing else.');
});

/* managers meddle: ringside interference, heat that belongs to the manager, and the manager turning on a client who keeps losing */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(S.cal||!ctx.isPl)return;
  ctx.all.forEach(function(w){
    if(w.mgr==null)return;var mg=S.w[w.mgr];if(!mg||mg.promo!==w.promo||mg.rt)return;
    var won=r.winners.indexOf(w)>=0,fin=r.fin;
    // the manager turns on a client who keeps losing, once they have made enough enemies of their own
    if(!won&&r.win>=0&&w.ws<=-3&&(mg.mh||0)>=30&&chance(S,0.2)){
      w.mgr=null;w.morale=clamp(w.morale-6,0,100);if(mg.align===w.align)turn(S,mg,'walked out on '+w.name);
      r.seg.notes.push(mg.name+' has seen enough, shoves '+w.name+' and walks to the back.');news(S,'story',mg.name+' has walked out on '+w.name+' after the losing streak.');return;}
    if(fin==='interf'||fin==='foiled'||!chance(S,0.1))return;
    var good=chance(S,clamp(0.45+(mg.mic-60)/200,0.2,0.75));
    if(good){mg.mh=clamp((mg.mh||0)+6,0,100);r.seg.notes.push(mg.name+' distracts the referee at ringside and '+w.name+' gets the edge.');if(ctx.feud)heatUp(S,ctx.feud,3,mg.name+' interfered for '+w.name);r.seg.ov=clamp(r.seg.ov+1,5,99);}
    else{mg.mh=clamp((mg.mh||0)+2,0,100);r.seg.notes.push(mg.name+' tries to interfere and is thrown out by the referee.');r.seg.ov=clamp(r.seg.ov+0.5,5,99);}
  });
});
/* a manager the crowd hates is worth a little to the show */
CRX.push(function(ctx){
  var h=0,who=null;ctx.all.forEach(function(w){if(w.mgr!=null){var mg=ctx.S.w[w.mgr];if(mg&&(mg.mh||0)>=30&&mg.promo===w.promo){h=Math.max(h,mg.mh);who=mg;}}});
  return who?{d:clamp(h/40,0.5,2),x:'The crowd loves to hate '+who.name}:null;
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.mh)w.mh=w.mh>1?w.mh*0.96:0;});});   // a manager's heat cools if they stay quiet

/* botches and saves: rarely a risky move goes wrong, and a veteran in the match can cover for it */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal)return;var risk=0.012*(STIP[ctx.stip]?STIP[ctx.stip].inj:1)*(ctx.mins>=14?1.2:1);
  if(!chance(S,risk))return;
  var seg=ctx.res.seg,mover=pick(S,ctx.all),vets=ctx.all.filter(function(w){return w!==mover&&w.age>=33;}).sort(function(a,b){return (b.cons||60)-(a.cons||60);}),vet=vets[0];
  var move=pick(S,['a top-rope move','a bump on the floor','a springboard','a suplex','a dive over the top']);
  if(vet&&chance(S,clamp(0.45+((vet.cons||60)-60)/150,0.3,0.85))){
    seg.notes.push(mover.name+' slipped on '+move+', and '+vet.name+' covered it so smoothly that most of the crowd never noticed.');vet.morale=clamp(vet.morale+2,0,100);mover.morale=clamp(mover.morale+1,0,100);
  }else{
    seg.ov=clamp(seg.ov-5,5,99);seg.notes.push(mover.name+' botched '+move+(vet?' and even '+vet.name+' could not cover it.':'. Nobody in the ring could cover it.')+' The crowd noticed.');
    mover.morale=clamp(mover.morale-3,0,100);
  }
});

/* match of the year, live: a running top ten of this calendar year's best matches across every promotion */
SHOWX.push(function(S,P,show,rep){
  var yr=cal(S.week).year,L=S.moty||(S.moty=[]);
  rep.segs.forEach(function(s){if(s.k!=='match'||s.ov==null)return;
    L.push({l:s.label,ov:s.ov,show:rep.name,promo:P.id,w:S.week,yr:yr,win:s.win||null,title:s.title||null,stip:s.stip||null,mt:s.mt||'',mins:s.mins||0,ids:(s.ids||[]).slice(0,8)});});
  S.moty=L.filter(function(m){return m.yr===yr;}).sort(function(a,b){return b.ov-a.ov||a.w-b.w;}).slice(0,10);
});
E.matchOfYear=function(S){var yr=cal(S.week).year;return (S.moty||[]).filter(function(m){return m.yr===yr;}).map(function(m){return {l:m.l,ov:m.ov,show:m.show,promo:m.promo,promoName:S.promos[m.promo]?S.promos[m.promo].name:m.promo,w:m.w,win:m.win,title:m.title,stip:m.stip,mt:m.mt,mins:m.mins,ids:m.ids};});};

/* catchphrases: a promo that lands can coin one. It lifts the crowd and merchandise until it is overused */
var CATCHES=['Nobody leaves until I say so.','The house always wins.','Count the lights. Then count me out.','Kneel, or be knelt.','My name is the last thing you will hear.','Read it, and weep.','Say it to my face.','The bell tolls for you.','Ask the crowd who owns this ring.','Every story ends. Yours ends tonight.','You are late to your own funeral.','Bow to the champion.','The curtain falls on you.','Hear that? That is the sound of the end.','I was here before the bell.','Keep your eyes on the door.'];
ANGDONE.push(function(S,P,a,ids){
  if(S.cal||P.id!==S.player||!a||a.ov<72||!ids.length)return;
  var w=ids.map(function(id){return S.w[id];}).filter(function(x){return x&&!x.cphrase&&x.mic>=60;}).sort(function(p,q){return q.mic-p.mic;})[0];
  if(!w||rosterOf(S,P.id).filter(function(x){return x.cphrase;}).length>=6||!chance(S,0.15))return;
  var taken={};S.w.forEach(function(x){if(x.cphrase)taken[x.cphrase.t]=1;});var free=CATCHES.filter(function(c){return !taken['“'+c+'”'];});if(!free.length)return;
  var ph='“'+pick(S,free)+'”';w.cphrase={t:ph,w:S.week,n:0};
  a.text+=' '+w.name+' ends it with a line the crowd will not forget: '+ph;news(S,'story',w.name+' has a catchphrase now: '+ph);mile(S,w,'promo','Coined a catchphrase: '+ph);
});
function catchFresh(w){return w.cphrase?clamp(1-w.cphrase.n/40,0,1):0;}
function catchBoost(S,P){var b=0;rosterOf(S,P.id).forEach(function(w){if(w.cphrase)b+=0.025*catchFresh(w);if(w.fol>20)b+=Math.min(0.02,w.fol/5000);});return Math.min(0.16,b);}
CRX.push(function(ctx){
  var d=0,who=[];ctx.all.forEach(function(w){if(w.cphrase&&catchFresh(w)>0.15){d+=1.2*catchFresh(w);who.push(w.name);}});
  return who.length?{d:Math.min(2,d),x:'The crowd chants '+who[0]+'’s catchphrase with them'}:null;
});
POST.push(function(ctx){if(ctx.S.cal)return;ctx.all.forEach(function(w){if(w.cphrase)w.cphrase.n++;});});

/* debuts with a build: teaser vignettes before a newcomer's first match. A hyped debut starts hot; an over-hyped one that flops costs more than no hype */
CRX.push(function(ctx){
  var d=0,who=[];ctx.all.forEach(function(w){if(w.deb&&w.hy){d+=1.3*w.hy;who.push(w);}});
  ctx.debuts=who;
  return who.length?{d:Math.min(4,d),x:who[0].name+'’s debut has been talked up for weeks'}:null;
});
POST.push(function(ctx){
  var S=ctx.S,seg=ctx.res.seg;if(S.cal||!ctx.debuts||!ctx.debuts.length)return;
  ctx.debuts.forEach(function(w){
    var hy=w.hy;w.hy=0;
    if(seg.ov<62&&hy>=2){w.morale=clamp(w.morale-8,0,100);ctx.P.image=clamp(ctx.P.image-0.25*hy,5,100);seg.notes.push(w.name+' was sold as the next big thing and the debut did not deliver. The crowd feels cheated.');if(ctx.isPl)news(S,'story',w.name+'’s debut flopped after weeks of hype.');}
    else if(seg.ov>=72){w.mom=clamp(w.mom+2,-10,10);addOvr(ctx.P,w,0.6*hy);seg.notes.push(w.name+' arrives hot. The weeks of teasers paid off.');if(ctx.isPl)news(S,'story',w.name+' made a hot debut.');}
  });
});

/* cliffhangers: a main event that settles nothing leaves a question open and the next show opens to a bigger crowd. Three open at once and the crowd stops caring */
PREX.push(function(S,P,show){
  var L=(S.open||[]).filter(function(o){return S.week-o.w<=2&&!o.used;});S.carryNote=null;if(!L.length)return;
  var n=L.length;S.hype=(S.hype||0)+(n<=2?0.04*n:-0.04);
  S.carryNote=n<=2?(n===1?'Last time out left a question hanging. The crowd came back to hear the answer.':'Two questions are hanging. The crowd came back curious.'):'There are '+n+' questions hanging at once. The crowd has stopped caring about any of them.';
  L.forEach(function(o){o.used=1;});
});
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player)return;var ms=rep.segs.filter(function(s){return s.k==='match';}),main=ms[ms.length-1];
  if(S.carryNote){rep.carry=S.carryNote;if(rep.sheet)rep.sheet.lines.unshift(S.carryNote);S.carryNote=null;}
  var open=S.open||(S.open=[]);S.open=open.filter(function(o){return S.week-o.w<=2;});
  if(main&&(main.fin==='dq'||main.fin==='co'||main.fin==='draw'||main.fin==='interf')&&S.open.length<6)S.open.push({w:S.week,t:main.label});
});
E.openThreads=function(S){return (S.open||[]).filter(function(o){return S.week-o.w<=2&&!o.used;}).map(function(o){return {w:o.w,t:o.t};});};

/* ask the room: before a signing, who is glad and who is angry about it */
E.askRoom=function(S,id){
  var w=S.w[id],P=S.promos[S.player];if(!w)return null;
  var glad=[],angry=[];
  rosterOf(S,P.id).forEach(function(x){
    if(x.nw||x.id===id||x.inj>0)return;var c=chem(S,x.id,id),threat=x.g===w.g&&w.ovr>x.ovr+4&&w.ovr<x.ovr+28&&holdLvl(P,x.id)===0&&x.ovr>=P.image-12&&x.morale<75,champThreat=x.g===w.g&&holdLvl(P,x.id)>0&&w.ovr>x.ovr-4;
    if(c>=2.2)glad.push({w:x,s:c,why:'they work well together'});
    else if(c<=-2.2)angry.push({w:x,s:c,why:'they do not get on'});
    else if(champThreat)angry.push({w:x,s:-9,why:'the title picture just got crowded'});
    else if(threat)angry.push({w:x,s:-3,why:'they see a rival for the same spot'});
  });
  glad.sort(function(a,b){return b.s-a.s;});angry.sort(function(a,b){return a.s-b.s;});
  var f=function(L){return L.slice(0,3).map(function(o){return o.w.name+' ('+o.why+')';}).join('; ');};
  var text=w.name+': '+(glad.length?'glad to see them: '+f(glad)+'. ':'nobody is especially glad. ')+(angry.length?'Unhappy: '+f(angry)+'.':'Nobody has a problem with it.');
  return {glad:glad.map(function(o){return o.w.id;}),angry:angry.map(function(o){return o.w.id;}),text:text};
};

/* production values: lights, set, pyro and cameras lift a big match. A corporate board expects a slick show; an outlaw crowd does not care */
CRX.push(function(ctx){
  var P=ctx.P,lv=P.prodLvl,M=modelOf(P),d=0,x=null;
  if(ctx.isMain&&(ctx.big||ctx.show.big)&&M.prodX!==0.25&&lv!==P.prod0){d=0.7*(lv-P.prod0);x=d>0?'The production team makes the main event look huge':'The main event looks cheap next to what this crowd expects';}
  if(M===MODELS.corporate&&lv<2){d-=1;x=x||'The board expects a slicker product than this';}
  return d?{d:d,x:x}:null;
});

/* the annual report: at the end of the year, money by source, best draw, best match, biggest signing and a letter from the owner */
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal)return;var y=S.ybest||(S.ybest={});
  if(!y.draw||rep.att>y.draw.v)y.draw={v:rep.att,n:rep.name,w:S.week};
});
WEEKX.push(function(S){
  var c=cal(S.week);if(c.month!==11||c.wom!==4||S.cal)return;
  var P=S.promos[S.player],rows=P.hist.slice(-48),sum=function(k){return rows.reduce(function(a,r){return a+(r[k]||0);},0);};
  var src=[{n:'Television',v:sum('tv')},{n:'Tickets',v:sum('gate')},{n:'Big event buys',v:sum('ppv')},{n:'Merchandise',v:sum('merch')},{n:'Sponsors',v:sum('spons')},{n:'Bonuses',v:sum('bonus')}],net=sum('net'),plan=P.net*rows.length;
  var A=(S.awards&&S.awards[0]&&S.awards[0].year===c.year)?S.awards[0].list:[],mt=A.filter(function(x){return x.k==='Match of the year';})[0];
  var sign=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.jw!=null&&S.week-w.jw<=48;}).sort(function(a,b){return b.wage-a.wage;})[0];
  var o=S.owner,good=net>=plan,t=o.me?null:o.trust;
  var letter=o.me?'You kept the doors open for another year. Read the figures, then decide what the next one is for.':
    o.name+(good?' writes: “The year beat the plan by '+money(net-plan)+'. ':' writes: “The year fell short of the plan by '+money(plan-net)+'. ')+(t>=70?'You have my confidence, and I mean to show it.”':(t>=45?'I will be watching the next one closely.”':'I need to see a different year from this one.”'));
  S.annual={year:c.year,src:src,net:net,plan:plan,draw:S.ybest&&S.ybest.draw||null,match:mt?mt.v:null,sign:sign?{name:sign.name,wage:sign.wage,id:sign.id}:null,letter:letter};S.annualNew=true;S.ybest={};
});
E.annualReport=function(S){return S.annual||null;};

/* the bar moves: when a rival has a great night in a city you share, your next show there has more to live up to */
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id===S.player||rep.exp==null||rep.rating<rep.exp+4)return;
  var mine=S.promos[S.player].cities||[],theirs=P.cities||[];if(!theirs.length)return;
  var city=theirs[hash('bar'+S.seed+P.id+S.week)%theirs.length];if(mine.indexOf(city)<0)return;
  (S.bar||(S.bar={}))[city]={w:S.week,d:Math.min(3,(rep.rating-rep.exp)/3),by:P.name,r:rep.rating};
  news(S,'world',P.name+' had a great night in '+city+' ('+rep.rating+'%). Anyone who follows them there has more to live up to.');
});
function barCity(S,venue){
  var B=S.bar;if(!B)return null;
  for(var c in B){if(venue.indexOf(c)===0&&S.week-B[c].w<=4){var b=B[c];delete B[c];return {d:b.d,note:b.by+' had a great night in '+c+' recently. The crowd expected more from this show.'};}}
  return null;
}
SHOWX.push(function(S,P,show,rep){if(P.id===S.player&&rep.barNote&&rep.sheet)rep.sheet.lines.unshift(rep.barNote);});

/* followers: every wrestler has a following that grows with big moments and fades without them. A clip can spread, bringing casual fans and merchandise */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal)return;var r=ctx.res,big=ctx.big||ctx.show.big,gain=0,clip=false;
  if(r.seg.change)gain+=8;if(r.upset)gain+=4;if(ctx.isMain&&big&&r.OV>=80)gain+=5;if(r.OV>=90){gain+=6;clip=true;}else if(r.OV>=80)gain+=1.5;
  if(!gain&&!clip)return;
  var shared=r.win>=0?r.winners:ctx.all;shared.forEach(function(w){w.fol=Math.min(400,(w.fol||0)+gain*(w.ovr>=70?0.8:1.2));});
  if(clip&&ctx.isPl&&chance(S,0.3)){var star=shared.slice().sort(function(a,b){return b.ovr-a.ovr;})[0];star.fol=Math.min(400,(star.fol||0)+10);r.seg.notes.push('A clip of this match is spreading online. Casual fans are asking who '+star.name+' is.');news(S,'story','A clip of '+r.seg.label+' is everywhere. '+star.name+' has a lot of new followers.');}
});
WEEKX.push(function(S){S.w.forEach(function(w){if(w.fol)w.fol=w.fol>2?w.fol*0.985:0;});});

/* guest stars: an invented actor, athlete or singer wants a one-night spot. Casuals tune in, diehards groan, and the match itself is a risk */
var GUESTS=[['Marlowe Kane','a film actor'],['Tessa Quill','a pop singer'],['Dag Holloway','an Olympic sprinter'],['Iris Valdane','a television host'],['Rudy Ashgrove','a retired boxer']];
EVMAKE.push(function(S,P,R){
  if(S.cal||(S.guestWeek!=null&&S.week-S.guestWeek<20)||S.week<6||!chance(S,0.05))return null;
  var g=pick(S,GUESTS);S.guestWeek=S.week;
  return {type:'guest',g:g[0],text:g[0]+', '+g[1]+', has asked for a one-night spot on your show. The casuals would tune in. The diehards would not thank you.',choices:['Book them in a match','A short cameo only','Turn them down']};
});
EVR.guest=function(S,ev,choice,P){
  if(choice===2)return 'You thank '+ev.g+' and say the card is full. Nobody is surprised.';
  if(choice===1){S.hype=(S.hype||0)+0.05;S.rateMod=(S.rateMod||0)-1;return ev.g+' walks out, waves, and walks off. Casual viewers will notice. The diehards will grumble. Expect a slight lift in the building and a flat spot in the show.';}
  var ok=chance(S,0.5);S.hype=(S.hype||0)+0.12;S.rateMod=(S.rateMod||0)+(ok?3:-5);S.guestNote=ev.g+(ok?' held up better than anyone dared hope.':' was a liability in the ring.');
  return ev.g+' will take part in a match on your next show. A big lift in the building, and a real risk in the ring.';
};
SHOWX.push(function(S,P,show,rep){if(P.id===S.player&&S.guestNote){rep.guest=S.guestNote;if(rep.sheet)rep.sheet.lines.unshift('Guest spot: '+S.guestNote);S.guestNote=null;}});

/* hall of fame night: an induction is held on the flagship weekend, with a speech and a lift for the crowd */
var HOF_SPEECH=['“I never thought a bag, a bell and a bad idea would bring me here.”','“Thank you to everyone who booed me. You made me.”','“The ring was the only place I ever knew who I was.”','“Look after each other. The business forgets, but we should not.”','“I fell more times than I won. I would do every one of them again.”'];
(function(){
  var old=EVR.hof;
  EVR.hof=function(S,ev,choice,P){
    var res=old(S,ev,choice,P),id=ev.c[choice];
    if(id!=null){S.hofNight={id:id,week:E.nextBig(S).week};res+=' The ceremony will be held at '+E.nextBig(S).name+'.';}
    return res;
  };
})();
CRX.push(function(ctx){
  var h=ctx.S.hofNight;if(!h||!(ctx.big||ctx.show.big)||ctx.S.week<h.week||ctx.P.id!==ctx.S.player||!ctx.isMain)return null;
  return {d:1.5,x:'The hall of fame induction has warmed the building before the bell'};
});
SHOWX.push(function(S,P,show,rep){
  var h=S.hofNight;if(!h||P.id!==S.player||!show.big||S.week<h.week)return;
  var w=S.w[h.id];S.hofNight=null;if(!w)return;
  rep.hofNight={name:w.name,speech:pick(S,HOF_SPEECH)};
  if(rep.sheet)rep.sheet.lines.unshift(w.name+' was inducted into the hall of fame tonight. '+rep.hofNight.speech);
  P.image=clamp(P.image+0.2,5,100);news(S,'story',w.name+'’s hall of fame induction was the emotional moment of '+show.name+'. '+rep.hofNight.speech);
});

/* home-town heroes: a wrestler in their home city gets a pop. Beating them there costs. A home-town title win lifts the city */
function atHome(ctx,w){return !!(w.town&&ctx.rep&&ctx.rep.venue&&ctx.rep.venue.indexOf(w.town)===0);}
CRX.push(function(ctx){
  var h=ctx.all.filter(function(w){return atHome(ctx,w);});
  return h.length?{d:1.6*Math.min(2,h.length),x:h[0].name+' is a hometown hero here'+(ctx.rep.venue?' in '+h[0].town:'')}:null;
});
POST.push(function(ctx){
  if(ctx.S.cal||!ctx.rep||!ctx.rep.venue)return;var r=ctx.res,seg=r.seg;
  var home=r.losers.filter(function(w){return atHome(ctx,w);});
  if(home.length&&r.win>=0&&r.fin!=='dq'&&r.fin!=='co'){r.winners.forEach(function(w){w.mom=clamp(w.mom-1,-10,10);});seg.notes.push('The home crowd turns on '+names(r.winners)+' for beating '+home[0].name+' in '+home[0].town+'.');}
  var champ=r.win>=0&&seg.change?r.winners.filter(function(w){return atHome(ctx,w);})[0]:null;
  if(champ){ctx.P.image=clamp(ctx.P.image+0.15,5,100);seg.notes.push(champ.name+' wins the title in '+champ.town+'. The whole city is celebrating.');if(ctx.isPl)news(ctx.S,'story',champ.name+' won the title in their home town of '+champ.town+'.');}
});

/* the milestone wall: a list of firsts with dates. Each one lands as a pop-up and is listed on Career */
function msAward(S,id){if(S.cal||(S.firsts&&S.firsts[id]))return;(S.firsts||(S.firsts={}))[id]=S.week;S.toasts.push(id);}
SHOWX.push(function(S,P,show,rep){
  if(P.id!==S.player||S.cal)return;var ms=rep.segs.filter(function(s){return s.k==='match';});
  if(rep.sellout)msAward(S,'MS_SELLOUT');if(rep.rating>=80)msAward(S,'MS_SHOW80');
  if(ms.some(function(s){return s.ov>=90;}))msAward(S,'MS_TOPMATCH');
  if(ms.some(function(s){return s.change;}))msAward(S,'MS_TITLECHANGE');
  if(ms.some(function(s){return s.crown;}))msAward(S,'MS_CROWN');
  ms.forEach(function(s){if(!s.change||!s.wids)return;s.wids.forEach(function(id){var w=S.w[id];if(w&&w.o0!=null&&w.o0<=35&&w.promo===S.player)msAward(S,'MS_BUILT');});});
  if(S.stats.shows>=50)msAward(S,'MS_50');if(S.stats.shows>=100)msAward(S,'MS_100');
});
WEEKX.push(function(S){
  if(S.stats&&S.stats.feudsDone>=1)msAward(S,'MS_FEUD');if(S.sponsors&&S.sponsors.length)msAward(S,'MS_SPONSOR');
});
E.milestones=function(S){return E.ACH.filter(function(a){return a.ms;}).map(function(a){return {id:a.id,name:a.name,desc:a.desc,w:(S.firsts&&S.firsts[a.id])||null};});};

/* careers have a shape: rising, in their prime, past their best, on the way out. High flyers peak young and fade fast; brawlers and talkers last */
E.phase=function(w){
  if(!w||w.rt)return {id:'retired',word:'retired'};
  if(w.age<w.pk[0])return {id:'rising',word:'rising'};
  if(w.age<=w.pk[1])return {id:'prime',word:'in their prime'};
  if(w.age<w.cl)return {id:'past',word:'past their best'};
  return {id:'late',word:'on the way out'};
};
/* once a year the booker hears who has moved from one phase to the next */
WEEKX.push(function(S){
  S.w.forEach(function(w){
    if(w.rt||w.promo!==S.player||w.nw)return;var ph=E.phase(w).id;
    if(w.ph==null){w.ph=ph;return;}
    if(w.ph!==ph){(S.phaseLog||(S.phaseLog=[])).push({id:w.id,from:w.ph,to:ph,w:S.week});w.ph=ph;}
  });
  var c=cal(S.week);if(c.month!==11||c.wom!==4||S.cal)return;
  var L=(S.phaseLog||[]).filter(function(x){return S.week-x.w<48&&S.w[x.id]&&S.w[x.id].promo===S.player;});S.phaseLog=[];if(!L.length)return;
  var word={prime:'has reached their prime',past:'is now past their best',late:'is on the way out',rising:'is on the rise'};
  news(S,'you','The year in careers: '+L.map(function(x){return S.w[x.id].name+' '+word[x.to];}).join('; ')+'.');
});

/* wear and tear in one word: fresh, sore, banged up, running on fumes. Combines condition and the worst body zone */
E.bodyWord=function(S,id){
  var w=S.w[id];if(!w)return null;var worst=Math.max(maxZone(w),100-w.cond),word=worst<25?'fresh':(worst<45?'sore':(worst<65?'banged up':'running on fumes'));
  return {word:word,v:Math.round(worst),bad:worst>=45};
};

/* finishers: a finisher nobody kicks out of lifts the crowd. A booked kick-out (m.kick) spends that protection and makes the match */
CRX.push(function(ctx){
  var d=0,who=null;ctx.all.forEach(function(w){if((w.fp||0)>=2&&w.fin){d+=Math.min(0.8,w.fp*0.16);who=who||w;}});
  var k=ctx.m.kick&&who;d=Math.min(1.2,d);if(k)d+=1.2;
  return who?{d:d,x:k?'The crowd gasps as '+who.name+'’s '+(who.fin||'finish')+' is kicked out of':'Everyone knows '+who.name+'’s '+(who.fin||'finish')+' ends it'}:null;
});
POST.push(function(ctx){
  var r=ctx.res,S=ctx.S;if(S.cal||r.win<0)return;
  r.winners.forEach(function(w){
    if(ctx.m.kick&&(w.fp||0)>=2){w.fp=Math.max(0,w.fp-2);ctx.res.seg.notes.push(w.name+'’s finisher was kicked out of. Its protection drops to '+w.fp+'.');}
    else if(r.fin==='clean'&&w.fin)w.fp=Math.min(5,(w.fp||0)+1);
  });
  r.losers.forEach(function(w){if(w.fp)w.fp=Math.max(0,w.fp-0.5);});
});
E.finisherWord=function(w){var f=w.fp||0;return f>=4?'unbeaten':(f>=2?'strong':(f>=1?'building':'untested'));};

/* gimmicks go stale: freshness climbs for the first twelve weeks, peaks, then fades. A repackage or a turn starts it over */
function gimFresh(S,w){
  var set=Math.max(w.gw==null?-1e4:w.gw,w.gs==null?-1e4:w.gs);if(set<-9e3)set=-26;   // a repackage (gw) or a turn (gs) starts it over
  var t=S.week-set;
  return Math.round(t<12?45+t*3.75:(t<30?90:Math.max(20,90-(t-30)*0.9)));
}
E.gimFresh=function(S,id){var w=S.w[id];return w?gimFresh(S,w):null;};
CRX.push(function(ctx){
  var d=0,up=null,down=null;ctx.all.forEach(function(w){var f=gimFresh(ctx.S,w);if(f>=85){d+=0.4;up=up||w;}else if(f<=35){d-=0.7;down=down||w;}});
  d=clamp(d,-1.5,1);return d?{d:d,x:d>0?up.name+'’s act is at its freshest':down.name+'’s gimmick has gone stale'}:null;
});

/* booking makes friends and enemies: pairs build a score from what happens between them in the ring. It feeds chemistry, relations and backstage disputes */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||!ctx.isPl)return;var B=S.bond||(S.bond={}),r=ctx.res,all=ctx.all;
  function add(a,b,d){var k=rkey(a.id,b.id);B[k]=clamp((B[k]||0)+d,-8,8);}
  for(var i=0;i<all.length;i++)for(var j=i+1;j<all.length;j++){
    var a=all[i],b=all[j],same=ctx.sides.some(function(s){return s.indexOf(a)>=0&&s.indexOf(b)>=0;});
    if(same)add(a,b,0.4);                                   // partners who travel together grow close
    else if(r.OV>=85)add(a,b,0.7);                          // made each other look good
    else if(r.OV>=65)add(a,b,0.15);
    else if(r.OV<50)add(a,b,-0.5);
    if(!same&&r.win>=0){                  // a winner called again and again over the same person is a grudge
      var ka=rkey(a.id,b.id),last=(S.bondLast||(S.bondLast={}))[ka],w=r.winners[0]&&r.winners[0].id;
      if(last===w&&w!=null){add(a,b,-0.7);if(B[ka]<=-3&&!S.bondNote)S.bondNote=1;}S.bondLast[ka]=w;
    }
  }
});
WEEKX.push(function(S){if(S.bond)Object.keys(S.bond).forEach(function(k){S.bond[k]*=0.985;if(Math.abs(S.bond[k])<0.05)delete S.bond[k];});});
E.bond=function(S,a,b){return S.bond?S.bond[rkey(a,b)]||0:0;};
E.bondWord=function(S,a,b){var v=E.bond(S,a,b);return v>=6?'inseparable':(v>=3?'close':(v<=-6?'bitter enemies':(v<=-3?'at odds':'neutral')));};

/* the last year: a veteran can announce a final year. The farewell tour lifts gates, and the last match gives one rising star the honour of the final win */
EVR.finalyear=function(S,ev,choice,P,w){
  if(choice===0){w.retiring=S.week+48;w.fw=true;w.morale=clamp(w.morale+10,0,100);news(S,'story',w.name+' has announced a final year. The farewell tour starts now.');return w.name+' will wrestle for one more year, and every crowd will know it. Expect fuller buildings when they are on the card, and a last match to decide.';}
  w.morale=clamp(w.morale+2,0,100);return w.name+' will retire after '+cal(w.retiring).label+'. A short goodbye, then.';
};
EVR.lastwin=function(S,ev,choice,P,w){
  var id=ev.c[choice],h=S.w[id];if(!h)return 'The last match goes ahead without a ceremony.';
  addOvr(P,h,3);h.mom=clamp(h.mom+5,-10,10);h.morale=clamp(h.morale+10,0,100);w.morale=clamp(w.morale+5,0,100);mile(S,h,'honour','Got the final win over '+w.name+' in their last match');
  news(S,'story',h.name+' got the final win over '+w.name+' in their last match. The crowd gave '+w.name+' a standing ovation.');
  return h.name+' pins '+w.name+' in the last match of a long career. The building stands for both of them.';
};
PREX.push(function(S,P,show,card){if(S.cal)return;if(card.some(function(m){return [].concat.apply([],m.sides).some(function(id){var w=S.w[id];return w&&w.fw&&w.retiring>S.week;});}))S.hype=(S.hype||0)+0.04;});
CRX.push(function(ctx){var f=ctx.all.filter(function(w){return w.fw&&w.retiring>ctx.S.week;})[0];return f?{d:1.4,x:'Everyone came to say goodbye to '+f.name}:null;});

/* the crowd has a night: one pool of energy across the show. Hot matches back to back tire it, a talking segment lets it breathe */
CRX.push(function(ctx){
  var rep=ctx.rep;if(!rep)return null;var en=rep.en==null?100:rep.en;
  if(en>=88)return null;
  var d=clamp((en-72)/28,-1.4,0.6);if(Math.abs(d)<0.3)return null;
  return {d:d,x:d>0?'The crowd is fresh and ready':(en<40?'The crowd is spent after what it has already seen':'The crowd is starting to tire')};
});
POST.push(function(ctx){
  var rep=ctx.rep;if(!rep)return;var en=rep.en==null?100:rep.en,cr=ctx.res.CR;
  rep.en=clamp(en-(12+(cr-50)*0.35)+6,0,100);
});
/* for the booking screen: a text line of the crowd's energy across a card, from the names on it */
E.energyLine=function(S,card){
  var en=100,out=[];
  card.forEach(function(m){
    var ids=[].concat.apply([],m.sides).filter(function(id){return id!=null&&S.w[id];}),o=ids.length?avg(ids.map(function(id){return S.w[id].ovr;})):50,cr=clamp(35+o*0.6,20,95);
    out.push(Math.round(en));en=clamp(en-(12+(cr-50)*0.35)+6,0,100);
  });
  out.push(Math.round(en));
  var low=out.some(function(v,i){return i>=2&&v<45;});
  return {steps:out,text:'Crowd energy: '+out.join(' → '),warn:low?'The crowd will be spent before the end. Put a talking segment or an easy match in the middle.':null};
};

/* ---------- 14. Agent notes: one instruction per match (m.note) ---------- */
var NOTES={
  long:{n:'Go long',d:'Adds five minutes. Workers with stamina can use the time. Everyone tires, and a hurt is a little likelier.'},
  short:{n:'Keep it short',d:'Cuts four minutes. Less wear and less risk, and less time to tell a story.'},
  protect:{n:'Protect the loser',d:'The loser keeps their standing and their mood. The match plays flatter.'},
  crowd:{n:'Work the crowd',d:'Play to the seats. The crowd gets louder if they have the charisma. The match itself is rougher.'},
  steal:{n:'Steal the show',d:'Go for the match of the night. Skilled workers can do it. A hurt is half again as likely, and it flops if they lack the skill.'},
  safe:{n:'Work safe',d:'A hurt is almost half as likely. The match is a little flatter.'}
};
function noteMins(m){return m&&m.note==='long'?5:(m&&m.note==='short'?-4:0);}
function noteSkill(ctx){return avg(ctx.all.map(function(w){return workOf(w,ctx.stip,ctx.mins);}));}
MQX.push(function(ctx){
  var k=ctx.m.note;if(!k||!NOTES[k])return null;
  if(k==='long'){var st=avg(ctx.all.map(function(w){return w.stam;}));return st>=55?{d:1,x:'Given room to build, and they had the stamina for it'}:{d:-1.5,x:'Told to go long without the stamina for it'};}
  if(k==='short')return {d:-0.5,x:null};
  if(k==='protect')return {d:-1.5,x:'The loser was held back to protect them'};
  if(k==='crowd')return {d:-1,x:null};
  if(k==='safe')return {d:-1.2,x:null};
  if(k==='steal'){var sk=noteSkill(ctx);return sk>=72?{d:3.5,x:'They stole the show'}:(sk<=58?{d:-3.5,x:'They tried to steal the show and could not'}:null);}
  return null;
});
CRX.push(function(ctx){
  if(ctx.m.note!=='crowd')return null;
  var ch=avg(ctx.all.map(function(w){return w.cha;}));
  return ch>=62?{d:2.5,x:'They worked the crowd and the crowd answered'}:(ch<=48?{d:-2,x:'They worked the crowd and the crowd shrugged'}:{d:1,x:null});
});
POST.push(function(ctx){
  var m=ctx.m,r=ctx.res;if(m.note!=='protect'||ctx.S.cal||r.win<0)return;
  // give back what the loss cost them
  r.losers.forEach(function(w){var F=FIN[r.fin]||FIN.clean;addOvr(ctx.P,w,0.4*clamp(1+(w.ovr-avg(r.winners.map(function(x){return x.ovr;})))/35,0.2,2.5)*F.lg*(ctx.big?1.3:1)*0.7);w.mom=clamp(w.mom+1,-10,10);w.morale=clamp(w.morale+1.5,0,100);});
  if(ctx.isPl)r.seg.notes.push(names(r.losers)+(r.losers.length>1?' were':' was')+' protected in defeat.');
});
E.NOTES=NOTES;
E.noteLabel=function(k){return NOTES[k]?NOTES[k].n:'No note';};
E.setNote=function(S,i,k){var m=S.card&&S.card[i];if(!m)return false;if(!k||!NOTES[k]){delete m.note;return true;}m.note=k;return true;};
/* the booker's read of a note for this match, for the editor's help line */
E.noteHint=function(S,m,k){
  if(!NOTES[k])return '';
  var ids=[].concat.apply([],m.sides).filter(function(id){return id!=null&&S.w[id];}).map(function(id){return S.w[id];});
  if(!ids.length)return NOTES[k].d;
  var st=avg(ids.map(function(w){return w.stam;})),ch=avg(ids.map(function(w){return w.cha;})),sk=avg(ids.map(function(w){return workOf(w,m.stip||'std',12);}));
  if(k==='long')return st>=55?'They have the stamina for it.':'They will tire. Better to keep it short.';
  if(k==='crowd')return ch>=62?'They have the charisma to carry it.':(ch<=48?'The crowd will not follow them.':'It should help a little.');
  if(k==='steal')return sk>=72?'They are good enough to try.':(sk<=58?'They are not good enough. It would flop.':'It could go either way.');
  return NOTES[k].d;
};

/* ---------- 15. Finishes have a price (m.how: the finish the booker picks) ---------- */
var HOWS={
  clean:{n:'Clean win',price:'The winner gains in full. The loser pays most, and a third clean loss in a row buries them.'},
  flash:{n:'Roll-up',price:'A small win for the winner. The loser is protected. The feud heats up: they will want a rematch.'},
  cheap:{n:'Cheap win',price:'The feud gets hot and the loser gets sympathy. A hero who wins this way confuses the crowd.'},
  dq:{n:'Disqualification',price:'Both are protected and the feud keeps its heat. The crowd is annoyed, most of all in a main event.'},
  co:{n:'Count-out',price:'Both are protected, the feud cools and the crowd is annoyed.'}
};
var UNCLEAN={cheap:1,interf:1,dq:1,co:1,draw:1};
function howOf(S,m,isPl){
  var k=m&&m.how;if(!isPl||!k||!HOWS[k]||m.mt==='br')return null;
  if((k==='cheap'||k==='dq'||k==='co')&&hasRule(S,'clean'))return null;
  return k;
}
function sourMood(S){
  var n=0,u=0;(S.fh||[]).forEach(function(e){if(S.week-e.w<4){n++;if(e.u)u++;}});
  var sh=n?u/n:0;return {n:n,u:u,share:sh,pen:n>=12?clamp((sh-0.5)*14,0,4):0};
}
CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var o=sourMood(ctx.S);
  return o.pen>=0.5?{d:-o.pen,x:'The crowd is tired of matches that end without a clean winner'}:null;
});
FINX.push(function(ctx,fin,winners){
  if(fin==='cheap'&&winners[0]&&winners[0].align==='F'&&ctx.isPl)return {d:-2.5,x:'A hero won with a cheap shot and the crowd did not like it'};
  return null;
});
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P;if(S.cal||!ctx.isPl)return;
  var fh=S.fh||(S.fh=[]);fh.push({w:S.week,u:UNCLEAN[r.fin]?1:0});S.fh=fh.filter(function(e){return S.week-e.w<8;});
  if(ctx.m.mt==='br')return;
  var f=ctx.feud;
  if(f){
    if(r.fin==='flash')heatUp(S,f,2);
    else if(r.fin==='co')heatUp(S,f,-7);
    else if(r.fin==='draw')heatUp(S,f,-2);
  }
  if(r.win>=0){
    if(r.fin==='clean')r.losers.forEach(function(l){
      if(l.ws<=-3){l.morale=clamp(l.morale-2,0,100);l.mom=clamp(l.mom-1,-10,10);if(r.losers.indexOf(l)===0)r.seg.notes.push(l.name+' has lost clean '+(-l.ws)+' times running. The fans have stopped believing.');}
    });
    if(r.fin==='cheap'){
      r.losers.forEach(function(l){if(l.align==='F')l.mom=clamp(l.mom+1,-10,10);});
      r.winners.forEach(function(w){w.mom=clamp(w.mom+(w.align==='H'?0.5:-1),-10,10);});
    }
  }
  var o=sourMood(S);
  if(o.pen>=0.5&&!S.fsour){S.fsour=1;r.seg.notes.push('The crowd is tired of cheap finishes. Give them a clean one.');news(S,'story','Fans of '+P.name+' are grumbling about shows that end without a winner.');}
  else if(o.pen<0.2&&S.fsour)S.fsour=0;
});
E.HOWS=HOWS;
E.finishPrice=function(k){return HOWS[k]?HOWS[k].price:'The story decides how it ends.';};
/* for the desk and the booking screen: how many finishes in the last four weeks were not clean */
E.finishMood=function(S){
  var o=sourMood(S);
  return {n:o.n,u:o.u,share:o.share,sour:o.pen>=0.5,text:o.n<4?null:'Unclean finishes in the last four weeks: '+o.u+' of '+o.n+(o.pen>=0.5?'. The crowd is losing patience.':'.')};
};
E.hasRule=hasRule;

/* ---------- 16. A library of match types: tables, lumberjack, mask against mask, hair against hair ---------- */
/* masks: about one in seven wrestlers works in one. w.mk is 1 (masked), 0 (lost it) or missing (decided by name) */
function masked(w){if(!w)return 0;if(w.mk!=null)return w.mk;return h01('mask'+w.id+w.name)<0.14?1:0;}
var STIPFIT={
  purist:{tables:[-3,'Tables are not what this crowd pays for'],lumber:[-1.5,'A lumberjack match is a circus to this crowd'],hair:[-1.5,'A haircut is a gimmick, and this crowd does not pay for gimmicks']},
  corporate:{tables:[-2,'The sponsors winced at the tables'],mask:[-1,'Masks do not sell to this audience'],hair:[-1,'A haircut on television was a step too far']},
  workrate:{tables:[-2,'Spots instead of wrestling, and this crowd noticed'],lumber:[-1,'Lumberjacks got in the way of the wrestling'],mask:[1.5,'A mask match decided by skill: the crowd approved'],hair:[-1,'The wager mattered more than the wrestling']},
  outlaw:{tables:[3,'This crowd wanted to see someone go through a table'],lumber:[1.5,'A ring of lumberjacks suits this crowd'],hair:[1,'A wager like that suits this crowd']},
  spectacle:{tables:[2,'Tables make a spectacle, and this crowd loves one'],lumber:[1.5,'The lumberjacks made it a show'],mask:[3,'A mask on the line: this crowd came for exactly this'],hair:[2,'Hair on the line is a big night here']},
  tradition:{tables:[-2,'Tables are not how this crowd likes it done'],lumber:[1,'An old-fashioned lumberjack match'],mask:[2,'An old wager, and this crowd respects it'],hair:[2,'An old wager, and this crowd respects it']},
  joshi:{tables:[-1,'Tables are not what this crowd came for'],mask:[1,null],hair:[3,'A hair match is a big night in this tradition']},
  underdog:{tables:[1,null],lumber:[1,null],mask:[1,null],hair:[1,null]},
  startup:{tables:[1.5,'A table keeps the new crowd awake'],lumber:[0.5,null]},
  classic:{mask:[1,null],hair:[1,null]}
};
CRX.push(function(ctx){
  var k=ctx.stip,d=0,f;if(!STIP[k]||(k!=='tables'&&k!=='lumber'&&k!=='mask'&&k!=='hair'))return null;
  var fit=(STIPFIT[ctx.P.model]||{})[k];
  if(fit){d+=fit[0];if(fit[1]&&Math.abs(fit[0])>=1)ctx.fx.push({s:fit[0]>=0?1:-1,x:fit[1],m:1});}
  if((k==='mask'||k==='hair')&&!(ctx.feud&&ctx.feud.heat>=40)){d-=3;ctx.fx.push({s:-1,x:'Nothing in the story to wager a '+(k==='mask'?'mask':'head of hair')+' on'});}
  if(k==='tables'&&ctx.P.risk===0){d-=2.5;ctx.fx.push({s:-1,x:'Tables are too rough for a family show'});}
  if(k==='lumber'&&!ctx.S.cal){
    var idle=rosterOf(ctx.S,ctx.P.id).filter(function(w){return w.inj<=0&&!w.nw&&ctx.all.indexOf(w)<0;}).length;
    if(idle>=10){d+=1.5;ctx.fx.push({s:1,x:'Plenty of lumberjacks at ringside'});}else if(idle<6){d-=3;ctx.fx.push({s:-1,x:'Too few lumberjacks to fill the ringside'});}
  }
  return d?{d:d,x:null}:null;
});
/* the wager is paid when the bell rings */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,k=ctx.stip;if(S.cal||r.win<0||(k!=='mask'&&k!=='hair'))return;
  r.losers.forEach(function(w){
    if(k==='mask'){w.mk=0;w.mom=clamp(w.mom-3,-10,10);w.morale=clamp(w.morale-8,0,100);addOvr(ctx.P,w,-0.6);}
    else{w.sh=S.week;w.mom=clamp(w.mom-2,-10,10);w.morale=clamp(w.morale-6,0,100);}
  });
  r.winners.forEach(function(w){w.mom=clamp(w.mom+3,-10,10);addOvr(ctx.P,w,1);w.morale=clamp(w.morale+4,0,100);});
  var txt=names(r.losers)+(k==='mask'?' lost the mask to ':' lost their hair to ')+names(r.winners)+' at '+ctx.show.name+'.';
  news(S,'story',txt);
  if(ctx.isPl)r.seg.notes.push(k==='mask'?names(r.losers)+(r.losers.length>1?' are':' is')+' unmasked for good.':names(r.losers)+(r.losers.length>1?' have':' has')+' lost '+(r.losers.length>1?'their':'their')+' hair.');
});
E.masked=masked;
E.STIPNOTE={
  hardcore:'Rewards brawlers. Heavy wear and hurts. Not for family shows.',
  ladder:'Rewards high flyers. The biggest risk of a hurt.',
  cage:'Rewards brawlers. Good for ending a feud.',
  sub:'Rewards technicians.',
  iron:'Thirty minutes. Only the fittest should try it.',
  tables:'Rewards brawlers. A heavy risk of a hurt. Purist and family crowds hate it.',
  lumber:'Needs ten healthy wrestlers waiting at ringside to feel big.',
  mask:'Everyone in it must wear a mask. Needs a hot feud. The loser is unmasked for good.',
  hair:'Needs a hot feud. The loser is shaved and cannot wager again for 20 weeks.'
};

/* ---------- 21. Teams grow together: a team finisher once they have 60 experience (tm.fin) ---------- */
var TFIN=['the Pincer','the Last Orders','the Double Drop','the Closing Time','the Tight Squeeze','the Hammer and Anvil','the Final Notice','the Crossroads','the Twin Bells','the Short Fuse','the Slingshot Special','the Open Door','the Second Opinion','the Long Goodbye','the Rush Hour','the Sandwich'];
function teamSides(S,ctx){
  if(ctx.m.mt!=='tag')return [];
  return ctx.sides.map(function(s){var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;return tm&&tm.fin?tm:null;});
}
function teamFin(S,winners){if(winners.length!==2||winners[0].team==null||winners[0].team!==winners[1].team)return null;var tm=teamOf(S,winners[0]);return tm&&tm.fin?tm.fin:null;}
MQX.push(function(ctx){
  var n=teamSides(ctx.S,ctx).filter(function(t){return t;}).length;
  return n?{d:Math.min(1.6,0.8*n),x:'A team finisher the crowd knows'}:null;
});
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||ctx.m.mt!=='tag')return;
  ctx.sides.forEach(function(s){
    var tm=(s[0].team!=null&&s[0].team===s[1].team)?teamOf(S,s[0]):null;
    if(!tm||tm.fin||tm.exp<60)return;
    tm.fin=TFIN[hash('tfin'+tm.id+s[0].name)%TFIN.length];
    if(tm.promo===S.player){
      news(S,'story',s[0].name+' and '+s[1].name+' now have a team finisher: '+tm.fin+'.');
      if(ctx.isPl)ctx.res.seg.notes.push(s[0].name+' and '+s[1].name+' have worked together long enough to have a finisher of their own: '+tm.fin+'.');
    }
  });
});
E.teamFinisher=function(S,t){return t&&t.fin?t.fin:null;};
WEEKX.push(function(S){
  S.teams.forEach(function(tm){
    if(tm.fin||tm.exp<60||!S.w[tm.m[0]]||!S.w[tm.m[1]])return;
    tm.fin=TFIN[hash('tfin'+tm.id+S.w[tm.m[0]].name)%TFIN.length];
    if(tm.promo===S.player)news(S,'story',S.w[tm.m[0]].name+' and '+S.w[tm.m[1]].name+' now have a team finisher: '+tm.fin+'.');
  });
});

/* ---------- 24. Styles clash and blend: a grid of style against style (added to ring chemistry) ---------- */
var SGRID={BB:1,BT:-1.5,BH:-0.5,BP:0.5,BA:0,BS:1.5,BE:-0.5,TT:1.5,TH:1.5,TP:0.5,TA:1,TS:-0.5,TE:-1,HH:1,HP:2,HA:0.5,HS:-1,HE:0.5,PP:-2,PA:0,PS:0.5,PE:-0.5,AA:0.5,AS:0.5,AE:0.5,SS:1.5,SE:-1.5,EE:-0.5};
function styleKey(x,y){return x<=y?x+y:y+x;}
function styleBlend(a,b){if(!a||!b)return 0;var k=styleKey('BTHPASE'.indexOf(a.style)<=-1?'A':a.style,'BTHPASE'.indexOf(b.style)<=-1?'A':b.style);return SGRID[k]||0;}
/* every match remembers which style met which; the booker only learns what a pair is like by seeing it twice */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||!ctx.isPl||ctx.m.mt==='br')return;
  var seen=S.sty||(S.sty={}),done={};
  for(var x=0;x<ctx.sides.length;x++)for(var y=x+1;y<ctx.sides.length;y++)ctx.sides[x].forEach(function(p){ctx.sides[y].forEach(function(o){
    var k=styleKey(p.style,o.style);if(done[k])return;done[k]=1;seen[k]=(seen[k]||0)+1;
    if(seen[k]===2&&Math.abs(SGRID[k]||0)>=1.5)ctx.res.seg.notes.push('The booker has seen it twice now: '+E.STYLE_NAME[p.style].toLowerCase()+' against '+E.STYLE_NAME[o.style].toLowerCase()+' '+((SGRID[k]||0)>0?'works well.':'does not mesh.'));
  });});
});
E.styleBlend=styleBlend;
E.STYLE_GRID=SGRID;
/* what the booker has learned about this wrestler's style: which others it works well and badly with */
E.styleLessons=function(S,w){
  var seen=S.sty||{},good=[],bad=[];
  Object.keys(E.STYLE_NAME).forEach(function(o){
    var k=styleKey(w.style,o),g=SGRID[k]||0;if((seen[k]||0)<2)return;
    if(g>=1.5)good.push(E.STYLE_NAME[o]);else if(g<=-1.5)bad.push(E.STYLE_NAME[o]);
  });
  return {good:good,bad:bad};
};

/* ---------- 26. The long plan: pencil in the flagship main event months ahead (S.lp) ---------- */
function flagshipWeek(S){var P=S.promos[S.player];for(var w=S.week;w<S.week+60;w++){var c=cal(w);if(c.wom===4&&c.month===P.flagship)return w;}return null;}
function lpFeud(S,lp){var f=feudOf(S,lp.a,lp.b);return f&&!f.res?f:null;}
E.longPlan=function(S){
  var lp=S.lp;if(!lp)return null;
  var a=S.w[lp.a],b=S.w[lp.b],toGo=Math.max(0,lp.wk-S.week),made=S.week-lp.made;
  var early=lp.wk-lp.made>=12;
  return {a:a,b:b,title:lp.title,wk:lp.wk,toGo:toGo,made:made,built:lp.built,early:early,
    when:cal(lp.wk).label,bonus:Math.round(Math.min(9,lp.built*0.5+(early?2:(lp.wk-lp.made>=8?1:0)))*10)/10,
    state:lp.built>=10?'Everyone is talking about it.':(lp.built>=5?'The build is working.':(lp.built>=2?'The story is getting going.':'Nothing has been built yet. Put them in a feud.'))};
};
/* the flagship week, for the screen's heading */
E.flagshipWeek=flagshipWeek;
E.setLongPlan=function(S,a,b,title){
  var P=S.promos[S.player],A=S.w[a],B=S.w[b],wk=flagshipWeek(S);
  if(!wk)return {ok:false,text:'There is no flagship show in sight.'};
  if(!A||!B||A===B||A.promo!==P.id||B.promo!==P.id)return {ok:false,text:'Pick two different wrestlers from your roster.'};
  var cost='',old=S.lp;
  if(old&&(old.a!==a||old.b!==b)){
    if(old.wk-S.week<=4){
      [S.w[old.a],S.w[old.b]].forEach(function(w){if(w)w.morale=clamp(w.morale-4,0,100);});S.trust=clamp(S.trust-2,0,100);
      cost=' Changing the plan this late cost some trust, and '+(S.w[old.a]?S.w[old.a].name:'one')+' and '+(S.w[old.b]?S.w[old.b].name:'one')+' are not happy.';
    }
  }
  var keep=old&&old.a===a&&old.b===b;
  S.lp={a:a,b:b,title:title||null,made:keep?old.made:S.week,wk:wk,built:keep?old.built:0};
  return {ok:true,text:A.name+' against '+B.name+' is pencilled in for '+cal(wk).label+'.'+cost};
};
E.clearLongPlan=function(S){
  var old=S.lp;if(!old)return {ok:true,text:'There was no plan.'};
  var cost='';
  if(old.wk-S.week<=4){[S.w[old.a],S.w[old.b]].forEach(function(w){if(w)w.morale=clamp(w.morale-4,0,100);});S.trust=clamp(S.trust-2,0,100);cost=' Scrapping it this late cost some trust.';}
  S.lp=null;return {ok:true,text:'The plan is scrapped.'+cost};
};
WEEKX.push(function(S){
  var lp=S.lp;if(!lp||S.cal)return;
  var a=S.w[lp.a],b=S.w[lp.b],P=S.promos[S.player];
  if(!a||!b||a.promo!==P.id||b.promo!==P.id){news(S,'story','The plan for the flagship main event fell apart: one of the two has left.');S.lp=null;return;}
  if(S.week>=lp.wk){
    if(!lp.done)news(S,'story','The flagship passed without the planned main event.');
    S.lp=null;return;
  }
  if(a.inj>lp.wk-S.week||b.inj>lp.wk-S.week){news(S,'story','The plan for the flagship main event is in doubt: '+(a.inj>lp.wk-S.week?a.name:b.name)+' will not be fit in time.');}
  var f=lpFeud(S,lp),n=0;
  if(f)n+=1+(f.heat>=50?1:0)+(f.heat>=75?1:0);else n+=(a.lu===S.week?0.3:0)+(b.lu===S.week?0.3:0);
  lp.built=Math.round((lp.built+n)*10)/10;
});
CRX.push(function(ctx){
  var S=ctx.S,lp=S.lp;if(!lp||!ctx.isPl||!ctx.show.big||!ctx.show.flag||!ctx.isMain)return null;
  var sd=ctx.m.sides,ia=-1,ib=-1;sd.forEach(function(s,k){if(s.indexOf(lp.a)>=0)ia=k;if(s.indexOf(lp.b)>=0)ib=k;});
  if(ia<0||ib<0||ia===ib)return null;
  var pl=E.longPlan(S);if(!pl.bonus)return null;
  return {d:pl.bonus,x:pl.early?'The main event they have been building to for months':'A main event that was planned ahead'};
});
POST.push(function(ctx){
  var S=ctx.S,lp=S.lp;if(!lp||!ctx.isPl||S.cal||!ctx.show.big||!ctx.show.flag||!ctx.isMain)return;
  var ia=-1,ib=-1;ctx.m.sides.forEach(function(s,k){if(s.indexOf(lp.a)>=0)ia=k;if(s.indexOf(lp.b)>=0)ib=k;});
  if(ia<0||ib<0||ia===ib)return;
  lp.done=true;var pl=E.longPlan(S);
  [S.w[lp.a],S.w[lp.b]].forEach(function(w){w.morale=clamp(w.morale+5,0,100);w.mom=clamp(w.mom+1,-10,10);});
  ctx.res.seg.notes.push('The plan paid off: the flagship main event that was pencilled in '+pl.made+' weeks ago was worth the wait.'+(pl.bonus>=3?' The crowd knew what it was there for.':''));
  news(S,'story','The long plan paid off at '+ctx.show.name+': '+S.w[lp.a].name+' against '+S.w[lp.b].name+'.');
  S.stats.plans=(S.stats.plans||0)+1;
});

/* ---------- 29. Titles have prestige: a short log of why it moves (t.pw), rises and falls ---------- */
function presMove(S,t,d,why){
  t.prestige=clamp(t.prestige+d,10,100);var L=t.pw||(t.pw=[]);
  if(L.length&&L[0].x===why&&L[0].w===S.week){L[0].d=Math.round((L[0].d+d)*10)/10;return;}
  L.unshift({w:S.week,d:Math.round(d*10)/10,x:why});if(L.length>6)L.length=6;
}
CRX.push(function(ctx){if(ctx.t){ctx.since0=ctx.t.since;ctx.defs0=ctx.t.defs;}return null;});
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res,P=ctx.P,t=ctx.t;if(S.cal||ctx.m.mt==='br')return;
  if(t){
    if(r.seg.change&&!r.seg.crown){
      var len=S.week-(ctx.since0||0);
      if(len<4)presMove(S,t,-5,'It changed hands after only '+Math.max(1,len)+' '+(len<=1?'week':'weeks'));
      else if(len>=26&&(ctx.defs0|0)>=4)presMove(S,t,2,'A long, credible reign came to a proper end');
    }else if(r.win===ctx.champSide&&ctx.champSide>=0){
      if(r.OV>=80&&(r.fin==='clean'||r.fin==='foiled'))presMove(S,t,1,'A strong defence');
      else if(r.OV<50)presMove(S,t,-1,'A poor defence');
    }
  }
  if(r.win>=0&&r.fin!=='dq'&&r.fin!=='co')r.losers.forEach(function(w){
    P.titles.forEach(function(x){
      if(x===t||x.holders.indexOf(w.id)<0)return;
      presMove(S,x,-1.2,w.name+' lost a non-title match');
    });
  });
});
WEEKX.push(function(S){
  if(S.cal)return;
  S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){
    if(t.holders.length){
      if(S.week-(t.last|0)>=10)presMove(S,t,-0.4,'Nobody has seen the title defended in weeks');
      else if(S.week-t.since>=13&&t.defs>=3&&t.prestige<85)presMove(S,t,0.3,'A reign with real defences');
    }else if(S.week-t.since>=6)presMove(S,t,-0.5,'The title has been vacant for weeks');
  });});
});
E.prestigeWhy=function(t){return (t.pw||[]).slice(0,3);};

/* ---------- 30. Contender ladders: jumping the queue costs most in the purist and tradition models ---------- */
CRX.push(function(ctx){
  var t=ctx.t;if(!t||t.tag||ctx.champSide<0||ctx.m.mt!=='1v1'||ctx.S.cal)return null;
  var m=ctx.P.model;if(m!=='purist'&&m!=='tradition')return null;
  var ch=ctx.sides[ctx.champSide===0?1:0][0];if(ch.shot===t.id)return null;
  var rk=rankFor(ctx.S,ctx.P,t,5).map(function(w){return w.id;});
  return rk.indexOf(ch.id)<0?{d:-3,x:m==='purist'?'The purists want a title shot earned in the ring':'Tradition says you wait your turn for a title shot'}:null;
});

/* ---------- 31. Brackets and leagues: a bracket drawn in text, and upsets that turn into stories ---------- */
/* the knockout as lines of text: three columns, names cut to twelve letters, with the winners carried across */
E.bracketLines=function(S,T){
  if(!T||T.fmt!=='ko')return [];
  var W=12,rows=[],R1=T.br&&T.br[1]?T.br[1]:koPairs(T.ents),names=function(id){return id==null?'':S.w[id].name.slice(0,W);};
  // who goes where in every round: from what has been played
  var rounds=[[]];R1.forEach(function(p){rounds[0].push(p[0],p[1]);});
  function winnerOf(r,a,b){var x=T.res.filter(function(q){return q.round===r&&((q.a===a&&q.b===b)||(q.a===b&&q.b===a));})[0];return x&&x.w>=0?x.w:null;}
  for(var r=1;r<=3;r++){
    var prev=rounds[r-1],nxt=[];
    for(var i=0;i<prev.length;i+=2)nxt.push(prev[i]==null||prev[i+1]==null?null:winnerOf(r,prev[i],prev[i+1]));
    rounds.push(nxt);
  }
  var H=15,grid=[];for(var y=0;y<H;y++)grid.push(new Array(58).join(' ').split(''));
  function put(y,x,str){for(var k=0;k<str.length;k++)grid[y][x+k]=str[k];}
  var rowOf=function(r,i){return r===0?2*i:(r===1?4*i+1:(r===2?8*i+3:7));};
  for(var rr=0;rr<=3;rr++){
    var x=rr*15;
    rounds[rr].forEach(function(id,i){
      var y=rowOf(rr,i);put(y,x,(id==null?'':names(id)).padEnd(W,' '));
      if(rr<3){grid[y][x+W]='─';}
      if(rr<3){var cx=x+W+1;grid[y][cx]=i%2===0?'┐':'┘';if(i%2===0){var yb=rowOf(rr,i+1);for(var q=y+1;q<yb;q++)grid[q][cx]='│';grid[(y+yb)/2][cx]='├';grid[(y+yb)/2][cx+1]='─';}}
    });
  }
  grid.forEach(function(g){rows.push(g.join('').replace(/\s+$/,''));});
  return rows;
};
POST.push(function(ctx){
  var S=ctx.S,T=S.tourn,r=ctx.res;if(!T||!ctx.isPl||ctx.m.mt!=='1v1'||r.win<0||S.cal)return;
  var last=T.res[T.res.length-1];if(!last||last.week!==S.week||last.bye)return;
  var a=ctx.all[0].id,b=ctx.all[1].id;if(!((last.a===a&&last.b===b)||(last.a===b&&last.b===a)))return;
  var w=r.winners[0],l=r.losers[0],sw=T.ents.indexOf(w.id),sl=T.ents.indexOf(l.id);
  if(sw<0||sl<0||sw-sl<3||w.ovr>l.ovr-6)return;
  w.mom=clamp(w.mom+2,-10,10);
  news(S,'story','Upset in the '+T.name+': '+w.name+', the number '+(sw+1)+' seed, beat '+l.name+'.');
  r.seg.notes.push('An upset in the '+T.name+': '+w.name+' beat '+l.name+', who was seeded much higher.');
  if(S.promos[S.player].id===T.promo)startFeud(S,S.promos[T.promo],l,w,35,l.name+' wants to settle the score after the '+T.name+' upset',{force:true});
});

/* ---------- 32. Stable roles: leader, enforcer, mouthpiece, young gun, workhorse; unity (st.unity) ---------- */
var SROLE_N={leader:'Leader',enforcer:'Enforcer',mouth:'Mouthpiece',young:'Young gun',horse:'Workhorse'};
var SROLE_D={enforcer:'Brings the muscle. Needs real fighting skill.',mouth:'Does the talking. Needs a good voice.',young:'The future of the group. Young with room to grow.',horse:'Carries the match. Needs stamina and technique.'};
function srFit(role,w){
  if(role==='enforcer')return Math.max(w.brawl,w.hc==null?w.brawl:w.hc)-(w.style==='P'||w.style==='B'?0:8);
  if(role==='mouth')return w.mic;
  if(role==='young')return w.age<=27&&w.pot>=62?w.pot+(27-w.age)*2:0;
  if(role==='horse')return (w.stam+w.tech)/2;
  return 0;
}
/* hand out the roles: the leader first, then each role goes to the best fit among the rest; a member nobody needs has no role */
function stableRoles(S,st){
  var roles={},left=st.m.filter(function(id){return id!==st.leader&&S.w[id];});roles[st.leader]='leader';
  var order=['mouth','enforcer','young','horse'],need={mouth:60,enforcer:62,young:62,horse:60};
  order.forEach(function(r){
    var best=null,bs=0;left.forEach(function(id){var f=srFit(r,S.w[id]);if(f>bs){bs=f;best=id;}});
    if(best!=null&&bs>=need[r]){roles[best]=r;left=left.filter(function(id){return id!==best;});}
  });
  return roles;
}
E.stableRoles=function(S,st){
  var roles=stableRoles(S,st);
  return st.m.filter(function(id){return S.w[id];}).map(function(id){var r=roles[id]||null;return {w:S.w[id],role:r,name:r?SROLE_N[r]:'No role',note:r&&SROLE_D[r]||'Nobody needs what they do. Unless that changes, they will be the first out.'};});
};
E.stableUnity=function(S,st){return Math.round(st.unity==null?60:st.unity);};
E.stableWeak=function(S,st){
  var roles=stableRoles(S,st);
  return st.m.filter(function(id){var w=S.w[id];return w&&id!==st.leader&&(!roles[id]||(w.rr&&w.rr.length>=4&&w.rr.every(function(x){return x.r==='L';})));}).map(function(id){return S.w[id];});
};
WEEKX.push(function(S){
  (S.stables||[]).forEach(function(st){
    var roles=stableRoles(S,st),d=0,weak=[];
    st.m.forEach(function(id){
      var w=S.w[id];if(!w)return;
      var noWins=w.rr&&w.rr.length>=4&&w.rr.every(function(x){return x.r==='L';});
      if(id!==st.leader&&!roles[id]){d-=1.5;weak.push(w);}
      if(noWins){d-=1;if(weak.indexOf(w)<0)weak.push(w);}
    });
    if(!weak.length)d+=1.2;
    st.unity=clamp((st.unity==null?60:st.unity)+d,0,100);
    if(weak.length)st.tension=(st.tension||0)+0.3*weak.length;
    if(st.promo===S.player&&weak.length&&st.unity<40&&S.week%6===0)news(S,'story',st.name+' are coming apart: '+weak[0].name+' has no place in the group and no wins. Somebody is going to be thrown out.');
  });
});
/* a group that works as a unit lifts the matches its members are in */
CRX.push(function(ctx){
  if(!ctx.S.stables||ctx.S.cal)return null;var best=null;
  ctx.all.forEach(function(w){var st=stableOf(ctx.S,w);if(st&&(st.unity==null?60:st.unity)>=72&&stableWeak2(ctx.S,st)===0&&(!best||st.unity>best.unity))best=st;});
  return best?{d:1,x:best.name+' work as one unit and the crowd sees it'}:null;
});
function stableWeak2(S,st){return E.stableWeak(S,st).length;}

/* ---------- 35. The game remembers: betrayals, first meetings, droughts and history (S.mem) ---------- */
function memBetray(S,att,vic){var M=S.mem||(S.mem={bet:{}});M.bet[rkey(att.id,vic.id)]={att:att.id,vic:vic.id,w:S.week};}
function memOf(S,a,b){
  var hh=S.h2h&&S.h2h[rkey(a.id,b.id)],bt=S.mem&&S.mem.bet&&S.mem.bet[rkey(a.id,b.id)];
  var n=hh?hh.n:0,wa=hh?(a.id<b.id?hh.a:hh.b):0,wb=hh?(a.id<b.id?hh.b:hh.a):0;
  return {n:n,wa:wa,wb:wb,last:hh?hh.w:null,bet:bt&&S.week-bt.w<104?bt:null,
    drought:n>=3&&(wa===0||wb===0)?(wa===0?a:b):null};
}
CRX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal||ctx.m.mt!=='1v1')return null;
  var a=ctx.all[0],b=ctx.all[1],o=memOf(ctx.S,a,b),d=0,x=null;
  if(o.bet){d+=2;x=S_name(ctx.S,o.bet.vic)+' has not forgotten what '+S_name(ctx.S,o.bet.att)+' did';}
  else if(o.n===0&&(a.ovr+b.ovr)/2>=60&&(ctx.i>=ctx.n-2||ctx.t)){d+=1.5;x='The first time these two have ever met';}
  else if(o.drought){d+=1.2;x=o.drought.name+' has never beaten '+(o.drought===a?b:a).name;}
  else if(o.n>=4&&ctx.S.week-(o.last|0)>=6){d+=0.8;x='These two have a history';}
  return d?{d:d,x:x}:null;
});
function S_name(S,id){return S.w[id]?S.w[id].name:'Someone';}
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(!ctx.isPl||S.cal||ctx.m.mt!=='1v1'||r.win<0)return;
  var a=ctx.all[0],b=ctx.all[1],o=memOf(S,a,b),w=r.winners[0],l=r.losers[0];
  // the h2h record was updated before this hook, so n counts the match just played
  if(o.n===1&&(a.ovr+b.ovr)/2>=60&&(ctx.i>=ctx.n-2||ctx.t))r.seg.notes.push('Their first meeting. '+w.name+' wins it.');
  // a drought ends: the winner had lost every earlier meeting
  var hw=S.h2h[rkey(a.id,b.id)],winsW=w.id===Math.min(a.id,b.id)?hw.a:hw.b;
  if(o.n>=4&&winsW===1){w.mom=clamp(w.mom+2,-10,10);addOvr(ctx.P,w,1);r.seg.notes.push(w.name+' has finally beaten '+l.name+', at the '+(o.n)+'th attempt.');news(S,'story',w.name+' finally beat '+l.name+' after '+(o.n-1)+' defeats.');}
});
/* what the booker knows about a pair, for the editor */
E.pairMemory=function(S,aId,bId){
  var a=S.w[aId],b=S.w[bId];if(!a||!b)return '';
  var o=memOf(S,a,b),L=[];
  if(o.n===0)L.push('They have never met.');
  else L.push('They have met '+o.n+' '+(o.n===1?'time':'times')+': '+a.name+' '+o.wa+', '+b.name+' '+o.wb+'.');
  if(o.drought)L.push(o.drought.name+' has never beaten '+(o.drought===a?b:a).name+'.');
  if(o.bet)L.push(S_name(S,o.bet.att)+' turned on '+S_name(S,o.bet.vic)+' in '+E.cal(o.bet.w).label+'.');
  return L.join(' ');
};
E.memBetray=memBetray;

/* ===== 83-moments.js ===== */
/* ---------- moments from wrestling history ----------
   Situations modelled on famous nights, under invented names. Each is an inbox event with three or four choices, an attempt where luck
   matters, and results that last for weeks. A moment can turn up about once every ten weeks, when the story is in place for it.
   MOM[id] = {make(S,P,R) -> event or null, res(S,ev,choice,P,w,o) -> text}. Follow-ups are kept in S.after and run when due. */
var MOM={},AFTER={};
function momTop(P){var best=null;P.titles.forEach(function(t){if(!t.tag&&t.holders.length&&(!best||t.lvl>best.lvl))best=t;});return best;}
function momMine(S){return rosterOf(S,S.player).filter(function(w){return !w.nw&&w.inj<=0;});}
function momLater(S,wks,key,args){(S.after||(S.after=[])).push({w:S.week+Math.max(1,wks),k:key,a:args||{}});}
function momLose(S,w,why){var P=S.promos[w.promo];leaveCompany(S,w,why);w.cut={w:S.week,from:P.id,img:P.image};w.promo='FA';w.brand=null;}
WEEKX.push(function(S){
  if(!S.after||!S.after.length)return;var due=S.after.filter(function(x){return x.w<=S.week;});
  S.after=S.after.filter(function(x){return x.w>S.week;});due.forEach(function(x){if(AFTER[x.k])AFTER[x.k](S,x.a);});
});
EVMAKE.push(function(S,P,R){
  if(S.cal||S.week<8||(S.momWeek!=null&&S.week-S.momWeek<10)||!chance(S,0.22))return null;
  var ids=Object.keys(MOM),i,j,t;for(i=ids.length-1;i>0;i--){j=Math.floor(rnd(S)*(i+1));t=ids[i];ids[i]=ids[j];ids[j]=t;}
  for(i=0;i<ids.length;i++){var ev=MOM[ids[i]].make(S,P,R);if(ev){ev.type='mom';ev.mid=ids[i];S.momWeek=S.week;return ev;}}
  return null;
});
EVR.mom=function(S,ev,choice,P,w,o){return MOM[ev.mid].res(S,ev,choice,P,w,o);};
E.momentIds=function(){return Object.keys(MOM);};

/* 79. The champion who is leaving */
MOM.leaving={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var ch=S.w[t.holders[0]];if(!ch||ch.con>8||ch.retiring||ch.nw)return null;var big=E.nextBig(S);
    return {w:ch.id,title:t.id,wks:Math.max(1,big.week-S.week),text:ch.name+'’s contract ends the night of '+big.name+', and word is out that they will not lose the '+t.name+' in front of that crowd. What do you do?',
      choices:['Trust them and book the finish as planned','Change the finish behind their back','Strip the title now','Pay to keep them'],
      checks:{0:mkCheck(7,[moraleMod(ch),trustMod(S)]),1:mkCheck(8,skillMods(S,'creative').concat([{n:'They are not watching the card',v:ch.mic<70?1:0}]))}};
  },
  res:function(S,ev,c,P,w){
    var t=titleById(P,ev.title),r;
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;
      if(r.ok){w.morale=clamp(w.morale+6,0,100);S.trust=clamp(S.trust+3,0,100);momLater(S,ev.wks,'leaveGood',{w:w.id,t:t.id});return rollText(r)+w.name+' gives you their word and keeps it. The title will change hands on the night and they leave on good terms.';}
      momLater(S,ev.wks,'leaveBad',{w:w.id,t:t.id});return rollText(r)+w.name+' smiles and says nothing. You have a bad feeling about the big show.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;
      if(r.ok){momLater(S,ev.wks,'leaveForced',{w:w.id,t:t.id});return rollText(r)+'The new finish is in the booker’s head and nobody else’s. '+w.name+' suspects nothing. For now.';}
      t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-8,10,100);S.trust=clamp(S.trust-4,0,100);momLose(S,w,'walked out');news(S,'title',w.name+' found out about the finish and walked out with the '+P.name+' '+t.name+'.');
      return rollText(r)+w.name+' found out and walked out of the building tonight with the title. It will be on every dirt sheet.';}
    if(c===2){t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-3,10,100);w.morale=clamp(w.morale-15,0,100);w.con=Math.min(w.con,2);news(S,'title',P.name+' stripped '+w.name+' of the '+t.name+'.');
      return 'You strip '+w.name+' of the title before anything can happen. Safe, and a little cold. They will not forget it.';}
    var cost=w.wage*12;P.cash-=cost;w.wage=Math.round(w.wage*1.15/50)*50;w.con=48;w.cn=false;w.morale=clamp(w.morale+8,0,100);
    momMine(S).filter(function(x){return x.id!==w.id&&x.ovr>=w.ovr-8;}).forEach(function(x){x.morale=clamp(x.morale-2,0,100);});
    return 'You pay '+money(cost)+' up front and a raise to '+money(w.wage)+' a week. '+w.name+' stays, and the other top names notice what it took.';
  }
};
AFTER.leaveGood=function(S,a){var w=S.w[a.w],P=S.promos[S.player],t=titleById(P,a.t);if(!w||w.promo!==P.id)return;t.holders=[];t.since=S.week;news(S,'title',w.name+' put the '+t.name+' over at the big show and left '+P.name+' on good terms. The title is vacant.');momLose(S,w,'contract ended');};
AFTER.leaveBad=function(S,a){var w=S.w[a.w],P=S.promos[S.player],t=titleById(P,a.t);if(!w||w.promo!==P.id)return;t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-6,10,100);S.trust=clamp(S.trust-3,0,100);news(S,'title',w.name+' refused to lose and left with the '+t.name+' on their shoulder. The crowd went home angry.');momLose(S,w,'walked out');};
AFTER.leaveForced=function(S,a){var w=S.w[a.w],P=S.promos[S.player],t=titleById(P,a.t);if(!w||w.promo!==P.id)return;t.holders=[];t.since=S.week;t.prestige=clamp(t.prestige-2,10,100);news(S,'title',w.name+' lost the '+t.name+' on the night as booked, and left '+P.name+' furious about it.');momLose(S,w,'contract ended');};

/* 80. The belt on the wrong show */
MOM.beltElsewhere={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var ch=S.w[t.holders[0]];if(!ch||ch.con>4||ch.nw||ch.morale>55)return null;var rv=S.order.filter(function(id){return id!==S.player&&S.promos[id].image>=P.image-20;});if(!rv.length)return null;var RV=S.promos[pick(S,rv)];
    return {w:ch.id,title:t.id,rv:RV.id,text:ch.name+' has walked out and turned up on '+RV.name+'’s broadcast, holding your '+t.name+' over their head. The phones in your office are ringing.',
      choices:['Take them to court for the belt','Laugh it off and mock them on air','Crown a new champion in a hurry'],
      checks:{0:mkCheck(8,skillMods(S,'talk').concat([trustMod(S)])),1:mkCheck(7,skillMods(S,'creative'))}};
  },
  res:function(S,ev,c,P,w){
    var t=titleById(P,ev.title),RV=S.promos[ev.rv],r;t.holders=[];t.since=S.week;momLose(S,w,'walked out with the belt');joinCompany(S,w,RV,null,48);news(S,'title',w.name+' walked out of '+P.name+' with the '+t.name+' and appeared on '+RV.name+'’s show.');
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;P.cash-=90000;if(r.ok){t.prestige=clamp(t.prestige+3,10,100);RV.rel=clamp((RV.rel||0)-10,-100,100);return rollText(r)+'The lawyers get the belt back inside the week. It costs '+money(90000)+' and you are the injured party for once. The title is vacant and its prestige is up.';}
      P.image=clamp(P.image-0.3,5,100);P.cash-=60000;return rollText(r)+'The case drags. You spend '+money(150000)+' and the papers call you petty.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){S.hype=(S.hype||0)+0.06;P.image=clamp(P.image+0.2,5,100);return rollText(r)+'Your next show opens with a joke at their expense. The crowd loves it and the story is yours now.';}
      S.rateMod=(S.rateMod||0)-2;return rollText(r)+'The joke dies on air. The belt is still on their show and you look small.';}
    momMine(S).filter(function(x){return x.g===w.g;}).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,4).forEach(function(x){x.morale=clamp(x.morale+4,0,100);});
    return 'You declare the title vacant and book a hunt for its next champion. The top contenders are suddenly very keen.';
  }
};

/* 81. The live microphone */
MOM.liveMic={
  make:function(S,P){
    var c=momMine(S).filter(function(w){return w.mic>=65&&w.morale<50&&w.ovr>=P.image-15;}).sort(function(a,b){return a.morale-b.morale;})[0];if(!c)return null;
    return {w:c.id,text:c.name+' has real grievances about their booking, and tonight, live on the air, they have gone off script. The director is shouting in your ear. What do you do?',
      choices:['Cut the feed','Let it run','Fine them after the show'],checks:{0:mkCheck(7,skillMods(S,'talk')),1:mkCheck(8,[{n:'Charisma '+c.mic,v:c.mic>=80?2:1}].concat(skillMods(S,'creative')))}};
  },
  res:function(S,ev,c,P,w){
    var r;
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;w.morale=clamp(w.morale-6,0,100);if(r.ok){return rollText(r)+'The feed cuts to a video package before anyone at home understands. '+w.name+' storms out. The damage stays inside the building.';}
      P.image=clamp(P.image-0.3,5,100);return rollText(r)+'The cut is clumsy and the viewers see all of it anyway. Worse, it looks like you were afraid of them.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;
      if(r.ok){addOvr(P,w,3);w.mom=clamp(w.mom+4,-10,10);w.morale=clamp(w.morale+10,0,100);S.hype=(S.hype||0)+0.06;news(S,'story',w.name+' went off script live and the crowd has not stopped talking about it.');return rollText(r)+'You let it run. It is the best thing on the show: raw, angry and true. '+w.name+' has made a name for themselves tonight.';}
      P.image=clamp(P.image-0.5,5,100);w.morale=clamp(w.morale-4,0,100);return rollText(r)+'You let it run, and it turns into a rant that goes nowhere. The company looks out of control.';}
    w.morale=clamp(w.morale-12,0,100);S.trust=clamp(S.trust-2,0,100);stressAdd(S,w,15);return 'You fine '+w.name+' after the show. They pay it, and the grievance stays exactly where it was.';
  }
};

/* 82. The curtain call */
MOM.curtainCall={
  make:function(S,P){
    var vet=momMine(S).filter(function(w){return w.retiring;})[0];if(!vet)return null;
    var f=activeFeuds(S).filter(function(x){return x.promo===P.id&&x.heat>=35&&S.w[x.a[0]].inj<=0&&S.w[x.b[0]].inj<=0;})[0];if(!f)return null;var a=S.w[f.a[0]],b=S.w[f.b[0]];
    return {w:a.id,o:b.id,vet:vet.id,feud:f.id,text:'At '+vet.name+'’s farewell, '+a.name+' and '+b.name+', who are supposed to hate each other, embrace in the ring. The locker room loved it. The story you spent weeks building did not. Someone has to answer for it.',
      choices:['Punish both of them','Punish only '+(a.ovr<b.ovr?a.name:b.name),'Let it go'],checks:{}};
  },
  res:function(S,ev,c,P,a,b){
    var f=S.feuds.filter(function(x){return x.id===ev.feud;})[0],junior=a.ovr<b.ovr?a:b,senior=junior===a?b:a;
    if(c===0){a.morale=clamp(a.morale-8,0,100);b.morale=clamp(b.morale-8,0,100);S.trust=clamp(S.trust-1,0,100);if(f)heatUp(S,f,6,'Punished for the farewell hug');return 'You punish both. The feud is saved and the room goes quiet. Nobody hugs anyone for a while.';}
    if(c===1){junior.morale=clamp(junior.morale-12,0,100);junior.mom=clamp(junior.mom-2,-10,10);senior.morale=clamp(senior.morale+3,0,100);S.trust=clamp(S.trust-3,0,100);if(f)heatUp(S,f,6,'Punished for the farewell hug');return 'You punish '+junior.name+' only, because you cannot afford to punish '+senior.name+'. Everyone sees exactly what that means. '+junior.name+' will remember it.';}
    S.trust=clamp(S.trust+3,0,100);if(f){f.heat=Math.max(0,f.heat-20);f.log.push({w:S.week,t:'The farewell hug took the edge off'});}return 'You let it go. The room is grateful, and the feud has lost a little of its poison. You will have to rebuild it.';
  }
};

/* 83. The title handed over */
MOM.handed={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var ch=S.w[t.holders[0]];if(!ch||!ch.stable)return null;var st=S.stables.filter(function(s){return s.id===ch.stable;})[0];if(!st)return null;
    var fr=st.m.map(function(id){return S.w[id];}).filter(function(x){return x&&x.id!==ch.id&&x.promo===P.id&&x.g===ch.g&&x.inj<=0;})[0];if(!fr)return null;
    return {w:ch.id,o:fr.id,title:t.id,text:'The leader of '+st.name+' wants the '+t.name+' passed to their friend '+fr.name+' without a real match. They have the room behind them and they are not asking twice.',
      choices:['Agree','Refuse','Offer a title match with strings attached'],checks:{1:mkCheck(9,skillMods(S,'talk').concat([trustMod(S)])),2:mkCheck(7,skillMods(S,'talk').concat([ownerMod(S)]))}};
  },
  res:function(S,ev,c,P,ch,fr){
    var t=titleById(P,ev.title),r;
    if(c===0){t.holders=[fr.id];t.since=S.week;t.defs=0;t.last=S.week;t.prestige=clamp(t.prestige-12,10,100);ch.morale=clamp(ch.morale+8,0,100);S.trust=clamp(S.trust-2,0,100);news(S,'title',ch.name+' handed the '+t.name+' to '+fr.name+' without a match. The fans are not impressed.');return 'You agree. The title changes hands in a back room, then on air. Its prestige drops by twelve points. The stable is delighted.';}
    if(c===1){r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){S.trust=clamp(S.trust+3,0,100);ch.morale=clamp(ch.morale-5,0,100);return rollText(r)+'You say no, and you hold it. The stable sulks and the title keeps its meaning.';}
      ch.morale=clamp(ch.morale-14,0,100);stressAdd(S,ch,14);S.trust=clamp(S.trust-3,0,100);if(ch.align===fr.align)turn(S,ch,'turned on the office');return rollText(r)+'They do not take no for an answer. '+ch.name+' now acts as if the office is the enemy, and the room is watching.';}
    r=rollCheck(S,ev.checks[2]);ev.roll=r;
    if(r.ok){S.quests.push({id:S.nid++,type:'shot',w:fr.id,title:t.id,due:S.week+6,text:'Promise: give '+fr.name+' a '+t.name+' match by '+cal(S.week+6).label});ch.morale=clamp(ch.morale+2,0,100);return rollText(r)+'They accept a real match for '+fr.name+' within six weeks. The title keeps its meaning and the stable keeps its pride.';}
    ch.morale=clamp(ch.morale-8,0,100);return rollText(r)+'They laugh at the offer and walk out. The champion is still on side, just about.';
  }
};

/* 84. The surprise arrival */
MOM.arrival={
  make:function(S,P){
    var rv=S.order.filter(function(id){return id!==S.player;}).map(function(id){return S.promos[id];}).sort(function(a,b){return b.image-a.image;})[0];if(!rv)return null;
    var star=rosterOf(S,rv.id).filter(function(w){return !w.nw&&holdLvl(rv,w.id)>0;}).sort(function(a,b){return b.ovr-a.ovr;})[0];if(!star||star.ovr<P.image)return null;var fee=Math.round(star.wage*10/1000)*1000+25000;
    return {w:star.id,rv:rv.id,fee:fee,text:rv.name+'’s biggest star, '+star.name+', has a free night and is willing to walk onto your show unannounced for '+money(fee)+'. Your locker room is watching what you do.',
      choices:['Pay '+money(fee)+' and spring it','Decline','Tease it on the air and decide later'],checks:{2:mkCheck(7,skillMods(S,'creative'))}};
  },
  res:function(S,ev,c,P,star){
    var RV=S.promos[ev.rv],r;
    if(c===0){P.cash-=ev.fee;S.hype=(S.hype||0)+0.1;S.rateMod=(S.rateMod||0)+2;RV.rel=clamp((RV.rel||0)-8,-100,100);momMine(S).sort(function(a,b){return b.ovr-a.ovr;}).slice(0,5).forEach(function(x){x.morale=clamp(x.morale-2,0,100);});news(S,'story',star.name+' walked onto a '+P.name+' show unannounced.');return 'You pay '+money(ev.fee)+'. The building erupts. Your top names grumble about who is getting paid, and '+RV.name+' will remember this.';}
    if(c===1){S.trust=clamp(S.trust+2,0,100);RV.rel=clamp((RV.rel||0)+3,-100,100);return 'You decline. Your own people notice that you backed them over a famous name.';}
    r=rollCheck(S,ev.checks[2]);ev.roll=r;if(r.ok){S.hype=(S.hype||0)+0.07;return rollText(r)+'The tease runs all week. The building is full of people wondering who is coming. You keep your money and your option.';}
    return rollText(r)+'The tease lands flat, and by the time you call, '+star.name+' has other plans.';
  }
};

/* 85. Giving away their result */
MOM.spoiler={
  make:function(S,P){
    var rv=S.order.filter(function(id){return id!==S.player;}).map(function(id){return S.promos[id];}).sort(function(a,b){return b.image-a.image;})[0];if(!rv||!rv.last||rv.image<P.image-10)return null;
    return {rv:rv.id,text:'Your show goes out live tonight. '+rv.name+'’s was taped last week, and one of your staff knows exactly how its big match ended. Spoil it on air and some of their audience will switch over. It is also not the kind of thing people forgive.',
      choices:['Spoil it on air','Leave it alone'],checks:{0:mkCheck(7,skillMods(S,'creative'))}};
  },
  res:function(S,ev,c,P){
    var RV=S.promos[ev.rv],r;
    if(c===1){S.trust=clamp(S.trust+1,0,100);return 'You leave it alone. The pettiness would have cost more than it won.';}
    r=rollCheck(S,ev.checks[0]);ev.roll=r;RV.rel=clamp((RV.rel||0)-12,-100,100);RV.image=clamp(RV.image-0.3,5,100);
    if(r.ok){S.hype=(S.hype||0)+0.07;P.image=clamp(P.image+0.2,5,100);news(S,'world',P.name+' spoiled '+RV.name+'’s taped main event on the air. Their viewers are furious. Some of them are watching '+P.name+'.');return rollText(r)+'You spoil it. Their viewers flood your lines and your numbers jump. '+RV.name+' will not forget this.';}
    P.image=clamp(P.image-0.4,5,100);return rollText(r)+'The spoiler gets out, but the story turns on you: “petty”, they call it. Their viewers stay where they are and yours are embarrassed.';
  }
};

/* 86. The walkout */
MOM.walkout={
  make:function(S,P){
    var L=momMine(S).filter(function(w){return w.morale<38&&w.ovr>=P.image-20;}).sort(function(a,b){return a.morale-b.morale;});if(L.length<2)return null;var a=L[0],b=L[1];
    return {w:a.id,o:b.id,text:a.name+' and '+b.name+', both unhappy with their booking, have left the building before a live show. You have ten minutes.',
      choices:['Rebook the card in ten minutes','Suspend them both','Go after them yourself'],checks:{2:mkCheck(8,skillMods(S,'talk').concat([trustMod(S)]))}};
  },
  res:function(S,ev,c,P,a,b){
    var r;
    if(c===0){S.rateMod=(S.rateMod||0)-2;a.morale=clamp(a.morale-4,0,100);b.morale=clamp(b.morale-4,0,100);return 'You rebuild the card on the back of an envelope. The show gets through it, a little thinner. Their grievance is still there on Monday.';}
    if(c===1){a.away=S.week+4;b.away=S.week+4;a.morale=clamp(a.morale-10,0,100);b.morale=clamp(b.morale-10,0,100);S.trust=clamp(S.trust-2,0,100);return 'You suspend them both for four weeks. Order is order, and the rest of the room sees it. Some of them see the unhappiness behind it too.';}
    r=rollCheck(S,ev.checks[2]);ev.roll=r;if(r.ok){a.morale=clamp(a.morale+10,0,100);b.morale=clamp(b.morale+10,0,100);S.trust=clamp(S.trust+3,0,100);return rollText(r)+'You find them in the car park and hear them out. They come back for the main event, and they come back as yours.';}
    momLose(S,b,'walked out');b.morale=40;a.morale=clamp(a.morale-6,0,100);return rollText(r)+'You find them, and it goes badly. '+a.name+' comes back. '+b.name+' does not, and has left the company.';
  }
};

/* 87. Not fit to perform */
MOM.unfit={
  make:function(S,P){
    if(!S.queue.some(function(sh){return sh.big;}))return null;var star=momMine(S).sort(function(a,b){return b.ovr-a.ovr;})[0];if(!star||star.ovr<P.image)return null;
    return {w:star.id,text:star.name+' has arrived at the biggest show of the year in no state to wrestle. Everyone can see it and nobody wants to say it.',
      choices:['Send them out anyway','Swap the match','Tell the crowd the truth'],checks:{0:mkCheck(8,[moraleMod(star),{n:'Veteran',v:star.age>=33?1:0}].concat(skillMods(S,'motivator')))}};
  },
  res:function(S,ev,c,P,w){
    var r;
    if(c===0){r=rollCheck(S,ev.checks[0]);ev.roll=r;if(r.ok){addOvr(P,w,1);w.morale=clamp(w.morale+5,0,100);S.rateMod=(S.rateMod||0)-1;return rollText(r)+w.name+' somehow gets through it. Not their best night, but nobody will remember anything except the finish.';}
      S.rateMod=(S.rateMod||0)-6;w.inj=Math.max(w.inj,2);return rollText(r)+w.name+' cannot get through it. The match is a mess and they are hurt for two weeks.';}
    if(c===1){S.rateMod=(S.rateMod||0)-2;w.morale=clamp(w.morale-4,0,100);w.away=S.week+1;return 'You swap the match and rest '+w.name+'. The show loses a little shine, and they are grateful, in a quiet way.';}
    S.hype=(S.hype||0)+0.04;S.rateMod=(S.rateMod||0)+1;w.mom=clamp(w.mom-3,-10,10);w.away=S.week+2;news(S,'story',P.name+' told the crowd the truth about '+w.name+'’s condition.');return 'You tell the crowd. They take it well, and sympathy fills the building. '+w.name+' loses some of their aura and rests for two weeks.';
  }
};

/* 88. The wrong hero */
MOM.wrongHero={
  make:function(S,P){
    var t=momTop(P);if(!t)return null;var hero=S.w[t.holders[0]];if(!hero||hero.align!=='F'||hero.nw)return null;
    var vil=momMine(S).filter(function(w){return w.align==='H'&&w.g===hero.g&&w.mic>=70&&w.id!==hero.id;}).sort(function(a,b){return b.mic-a.mic;})[0];if(!vil)return null;
    return {w:hero.id,o:vil.id,title:t.id,text:'The crowd is booing '+hero.name+', the hero you spent a year building, and cheering '+vil.name+', the villain, louder than they have cheered anyone. The big match is tonight. What do you do?',
      choices:['Change the finish: let the villain win','Hold your nerve'],checks:{1:mkCheck(8,skillMods(S,'creative').concat([{n:'Momentum '+Math.round(hero.mom),v:hero.mom>=2?1:(hero.mom<=-3?-1:0)}]))}};
  },
  res:function(S,ev,c,P,hero,vil){
    var t=titleById(P,ev.title),r;
    if(c===0){t.holders=[vil.id];t.since=S.week;t.defs=0;t.last=S.week;hero.morale=clamp(hero.morale-8,0,100);vil.mom=clamp(vil.mom+3,-10,10);vil.morale=clamp(vil.morale+8,0,100);S.rateMod=(S.rateMod||0)+2;news(S,'title',vil.name+' won the '+t.name+' from '+hero.name+' as the crowd roared. A hero has been made of the villain.');if(vil.align==='H')turn(S,vil,'the crowd made them a hero');return 'You change the finish on the night. '+vil.name+' wins the title to the loudest noise of the year, and the crowd has told you who its hero is. '+hero.name+' will take some talking round.';}
    r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){hero.mom=clamp(hero.mom+3,-10,10);addOvr(P,hero,2);return rollText(r)+'You hold your nerve. By the end of the match the crowd has come round. '+hero.name+' has earned it the hard way.';}
    S.rateMod=(S.rateMod||0)-4;hero.mom=clamp(hero.mom-3,-10,10);return rollText(r)+'You hold, and the crowd does not come round. The finish is met with silence, and '+hero.name+' knows it.';
  }
};
/* for tests: build a moment now, if the story for it is in place, and put it in the inbox */
E.momentForce=function(S,id){var P=S.promos[S.player],ev=MOM[id]&&MOM[id].make(S,P,rosterOf(S,P.id));if(!ev)return null;ev.type='mom';ev.mid=id;return pushEv(S,ev);};

/* ===== 84-life.js ===== */
/* ---------- life outside the ring ----------
   A wedding, a new baby, a move across the country, a film part, a book. Each is an inbox event with a real choice: time off, a lighter
   schedule, or work it into a story. About every six weeks, for someone who matters to the show. */
var LIFE=[
  {id:'wedding',t:function(w){return w.name+' is getting married next month, and the whole locker room has been invited.';},story:'The wedding is staged on the show: a ring, a bouquet, and an invitation to every villain in town.'},
  {id:'baby',t:function(w){return w.name+' is about to become a parent and would like to be home more.';},story:'The news is announced on air and the crowd sends cards to the arena.'},
  {id:'move',t:function(w){return w.name+' is moving across the country and the travel will be hard on them.';},story:'The move becomes a storyline: a new city, a new rival, a fresh start.'},
  {id:'film',t:function(w){return w.name+' has been offered a part in a film and needs six weeks for the shoot.';},story:'The film part becomes an angle: a star returns with a new swagger.'},
  {id:'book',t:function(w){return w.name+' has written a book and wants time for a tour of bookshops.';},story:'The book is launched on air, and a rival tears out the first page.'}
];
EVMAKE.push(function(S,P,R){
  if(S.cal||S.week<5||(S.lifeWeek!=null&&S.week-S.lifeWeek<6)||!chance(S,0.18))return null;
  var c=R.filter(function(w){return w.ovr>=P.image-10&&!w.retiring&&!w.lgt;});if(!c.length)return null;var w=pick(S,c),L=pick(S,LIFE);S.lifeWeek=S.week;
  return {type:'life',w:w.id,lid:L.id,text:L.t(w),choices:['Give them time off','A lighter schedule for a while','Work it into a story'],checks:{2:mkCheck(7,[{n:'Charisma '+w.mic,v:w.mic>=75?1:(w.mic<55?-1:0)}].concat(skillMods(S,'creative')))}};
});
EVR.life=function(S,ev,choice,P,w){
  var L=LIFE.filter(function(x){return x.id===ev.lid;})[0];
  if(choice===0){w.away=S.week+3;w.morale=clamp(w.morale+8,0,100);stressAdd(S,w,-12);w.hy=0;return w.name+' is away for three weeks and comes back a different person. The card will have a hole in it.';}
  if(choice===1){w.lgt=S.week+8;w.morale=clamp(w.morale+4,0,100);stressAdd(S,w,-6);return w.name+' works every other week for the next eight. It keeps them on the shows and happy at home.';}
  var r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){S.hype=(S.hype||0)+0.04;w.mom=clamp(w.mom+2,-10,10);addOvr(P,w,0.5);w.morale=clamp(w.morale+6,0,100);news(S,'story',w.name+': '+L.story);return rollText(r)+L.story+' The crowd loves it and it costs you nothing.';}
  w.morale=clamp(w.morale-3,0,100);return rollText(r)+'You try to work it into a story and the crowd shrugs. '+w.name+' feels like a prop.';
};
/* a lighter schedule: every other week off */
WEEKX.push(function(S){S.w.forEach(function(w){if(w.lgt&&w.promo===S.player){if(S.week+1<w.lgt&&(S.week+1)%2===0)w.rest=S.week+1;if(S.week+1>=w.lgt)w.lgt=null;}});});

/* ===== 85-second.js ===== */
/* ---------- second careers ----------
   A retired wrestler of yours can stay: road agent, trainer, commentator, manager or on-screen boss. Each role uses one of their old skills.
   Staff stay on the roster as non-wrestlers (nw) with a role in w.srole. */
var SROLES={
  agent:{n:'Road agent',skill:function(w){return (w.cons||60)*0.5+workRate(w)*0.5;},d:'Keeps the matches tight: young wrestlers on the card work a little better and get hurt a little less.'},
  trainer:{n:'Trainer',skill:function(w){return workRate(w);},d:'Teaches the young: every wrestler of 26 and under learns a little faster.'},
  commentator:{n:'Commentator',skill:function(w){return w.mic;},d:'Sells the stories on air: the show reads a little better.'},
  manager:{n:'Manager',skill:function(w){return w.mic;},d:'Speaks for a client at ringside and can be given one from the roster page.'},
  boss:{n:'On-screen boss',skill:function(w){return (w.mic+w.ovr)/2;},d:'Makes matches and feuds with a rebel on screen. Helps a show, overshadows it if overused.'}
};
E.SROLES=Object.keys(SROLES).map(function(k){return {id:k,n:SROLES[k].n,d:SROLES[k].d};});
WEEKX.push(function(S){
  if(S.cal)return;
  S.w.forEach(function(w){
    if(w.rt!==S.week||w.rtp!==S.player||w.nw||w.srole||w.age>60)return;
    var ch=Object.keys(SROLES).filter(function(k){return SROLES[k].skill(w)>=58;});if(!ch.length||(w.ovr<45&&w.age<45))return;
    pushEv(S,{type:'secondcareer',w:w.id,roles:ch,text:w.name+' has retired, and would like to stay in the business. What could they do for you?',choices:ch.map(function(k){return SROLES[k].n+': '+SROLES[k].d;}).concat(['Let them go with thanks'])});
  });
});
EVR.secondcareer=function(S,ev,choice,P,w){
  var k=ev.roles[choice];if(!k)return w.name+' is thanked, given a watch and sent home.';
  w.promo=S.player;w.nw=true;w.srole=k;w.roles=[SROLES[k].n.toLowerCase().replace(/ /g,'_')];w.wage=Math.round(w.wage*0.35/50)*50;w.con=48;w.morale=85;w.inj=0;w.rest=0;
  news(S,'contract',w.name+' stays on as '+SROLES[k].n.toLowerCase()+'.');return w.name+' takes the job of '+SROLES[k].n.toLowerCase()+'. '+SROLES[k].d;
};
function staffOf(S,k){return rosterOf(S,S.player).filter(function(w){return w.nw&&w.srole===k&&!w.rt0;});}
E.staff=function(S){return rosterOf(S,S.player).filter(function(w){return w.srole;}).map(function(w){return {id:w.id,role:SROLES[w.srole].n,d:SROLES[w.srole].d};});};
/* the effects */
CRX.push(function(ctx){
  if(!ctx.isPl)return null;var S=ctx.S,d=0,x=null;
  if(staffOf(S,'agent').length&&!ctx.m.agent&&ctx.all.some(function(w){return w.age<=28;})){d+=0.5;x='The road agent keeps the young wrestlers on script';}
  if(staffOf(S,'commentator').length){d+=0.3;x=x||'The commentary team sells the story';}
  var boss=staffOf(S,'boss')[0];if(boss){d+=0.4-(S.bossUse>5?0.8:0);x=x||(boss.name+' is on screen again');}
  return d?{d:d,x:x}:null;
});
WEEKX.push(function(S){
  if(S.cal)return;var tr=staffOf(S,'trainer');if(tr.length)rosterOf(S,S.player).forEach(function(w){if(!w.nw&&w.age<=26&&workRate(w)<w.pot)w.xp+=0.04;});
  S.bossUse=Math.max(0,(S.bossUse||0)*0.7);if(S.bossUse<3)S.bossWarn=0;
});
/* an on-screen boss who is on every show overshadows the wrestlers, and the fans say so */
SHOWX.push(function(S,P,show,rep){if(P.id!==S.player||S.cal)return;if(staffOf(S,'boss').length){S.bossUse=(S.bossUse||0)+0.3;if(S.bossUse>5&&!S.bossWarn){S.bossWarn=1;news(S,'story','The fans are asking why the boss is on every show. The wrestlers are being overshadowed.');}}});

/* ---------- 34. The on-screen boss makes matches and feuds with a rebel (m.boss, S.rebel) ---------- */
/* a match marked as the boss's own: it reads well when the story explains it, and every one adds to the overshadowing count */
E.hasBoss=function(S){return staffOf(S,'boss').length>0;};
E.bossMakes=function(S,i,on){
  var m=S.card&&S.card[i];if(!m)return false;
  if(on&&E.hasBoss(S))m.boss=1;else delete m.boss;return true;
};
CRX.push(function(ctx){
  if(!ctx.isPl||!ctx.m.boss||!E.hasBoss(ctx.S))return null;
  var f=ctx.feud;
  return f&&f.heat>=30?{d:1.8,x:'The boss made this match, and the story explains why'}:{d:0.5,x:'The boss put them in the ring'};
});
POST.push(function(ctx){if(ctx.isPl&&ctx.m.boss&&!ctx.S.cal&&E.hasBoss(ctx.S))ctx.S.bossUse=(ctx.S.bossUse||0)+0.7;});
/* now and then a heel rebels against the boss: weeks of build, then an inbox choice settles it */
WEEKX.push(function(S){
  if(S.cal||!E.hasBoss(S))return;
  var P=S.promos[S.player],R=S.rebel;
  if(R){
    var w=S.w[R.w];
    if(!w||w.promo!==P.id||w.nw){S.rebel=null;S.rebelEnd=S.week;return;}
    if(w.lu===S.week)R.heat=Math.min(100,R.heat+3);R.heat=Math.min(100,R.heat+2);
    if(!R.ev&&(R.heat>=70||S.week-R.since>=10)){
      R.ev=true;var bs=staffOf(S,'boss')[0];
      pushEv(S,{type:'rebel',w:w.id,text:w.name+' has been at war with '+bs.name+' for '+(S.week-R.since)+' weeks. The crowd wants it settled. How does it end?',choices:[bs.name+' wins and makes an example of '+w.name,w.name+' wins and the boss is humbled','Let it fizzle out']});
    }
    return;
  }
  if(S.week-(S.rebelEnd||0)<20||!chance(S,0.07))return;
  var c=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.align==='H'&&w.inj<=0&&w.mic>=55&&w.ovr>=P.image-5&&!w.away;}).sort(function(a,b){return b.ovr-a.ovr;});
  if(!c.length)return;
  var rb=c[0],bs=staffOf(S,'boss')[0];
  S.rebel={w:rb.id,since:S.week,heat:30};
  news(S,'story',rb.name+' has declared war on '+bs.name+', the boss, and says nobody tells them where to wrestle.');
});
EVR.rebel=function(S,ev,choice,P,w){
  var bs=staffOf(S,'boss')[0],name=bs?bs.name:'The boss';
  S.rebel=null;S.rebelEnd=S.week;
  if(choice===0){w.morale=clamp(w.morale-10,0,100);w.away=S.week+1;S.bossUse=(S.bossUse||0)+2;w.mom=clamp(w.mom-2,-10,10);news(S,'story',name+' put '+w.name+' in their place on screen.');return name+' wins. '+w.name+' sits out a week and is not happy about it. The fans saw a lot of the boss, though.';}
  if(choice===1){S.bossUse=0;w.morale=clamp(w.morale+10,0,100);w.mom=clamp(w.mom+4,-10,10);addOvr(P,w,1.5);
    var t=null;P.titles.forEach(function(x){if(!x.tag&&x.g===w.g&&x.holders.length&&x.holders[0]!==w.id&&(!x.brand||x.brand===w.brand)&&(!t||x.lvl>t.lvl))t=x;});
    if(t)w.shot=t.id;news(S,'story',w.name+' beat the boss at '+name+'’s own game.');return w.name+' wins. The crowd loved it and the boss is quiet for a while.'+(t?' '+w.name+' has earned a shot at the '+t.name+'.':'');}
  w.morale=clamp(w.morale-3,0,100);return 'The feud fades. Nobody got the ending they wanted.';
};
E.rebelInfo=function(S){var R=S.rebel;if(!R||!S.w[R.w])return null;var bs=staffOf(S,'boss')[0];return {w:S.w[R.w],boss:bs||null,heat:Math.round(R.heat),weeks:S.week-R.since};};

/* ---------- 46. Road agents: give a match to an agent (m.agent); one agent covers two matches a night ---------- */
function agentOf(S,m){var a=m&&m.agent!=null?S.w[m.agent]:null;return a&&a.nw&&a.srole==='agent'&&a.promo===S.player?a:null;}
function agentQ(a){return clamp((SROLES.agent.skill(a)-50)/40,0.2,1.2);}
function agentRisk(S,m){var a=agentOf(S,m);return a?1-0.25*agentQ(a):1;}
E.agents=function(S){return staffOf(S,'agent').map(function(w){return {id:w.id,name:w.name,skill:Math.round(SROLES.agent.skill(w))};});};
E.setAgent=function(S,i,id){var m=S.card&&S.card[i];if(!m)return false;if(id==null||id===''||!S.w[id])delete m.agent;else m.agent=+id;return true;};
MQX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var a=agentOf(ctx.S,ctx.m);if(!a)return null;
  var young=ctx.all.some(function(w){return w.age<=28;});
  return {d:Math.round((0.6+agentQ(a)*1.2+(young?0.5:0))*10)/10,x:a.name+', the road agent, kept the match tight'};
});
POST.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return;var a=agentOf(ctx.S,ctx.m);if(!a)return;
  var n=0;ctx.all.forEach(function(w){if(w.age<=26&&workRate(w)<w.pot){w.xp+=0.08;n++;}});
  if(n&&ctx.res.OV>=75)ctx.res.seg.notes.push(a.name+' talked the young ones through it afterwards.');
});

/* ===== 85-universe.js ===== */
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

/* ===== 86-room.js ===== */
/* ---------- the locker room as a group of people: cliques, creative control ---------- */

/* ---------- 38. Cliques: friends form a group; a group with a star asks for favours as a block ---------- */
/* three or more of your people who all get on with somebody in the group (relOf above zero), found as connected groups */
E.cliques=function(S){
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&w.inj<=0&&!w.rt;}),seen={},out=[];
  var ovrs=R.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=ovrs[Math.floor(R.length*0.3)]||0;
  R.forEach(function(w){
    if(seen[w.id])return;
    var grp=[w],q=[w];seen[w.id]=1;
    while(q.length){var c=q.pop();R.forEach(function(o){if(!seen[o.id]&&relOf(S,c.id,o.id)>0){seen[o.id]=1;grp.push(o);q.push(o);}});}
    if(grp.length<3)return;
    grp.sort(function(a,b){return b.ovr-a.ovr;});
    out.push({star:grp[0],m:grp,name:grp[0].name.split(' ')[0]+'’s circle',power:grp[0].ovr>=cut});
  });
  return out;
};
WEEKX.push(function(S){
  if(S.cal||S.week-(S.cliqueAt||0)<10||!chance(S,0.07))return;
  if(S.inbox.some(function(e){return e.type==='clique'&&!e.done;}))return;
  var P=S.promos[S.player],cl=E.cliques(S).filter(function(c){return c.power&&c.star.morale>=25;});if(!cl.length)return;
  var c=pick(S,cl),star=c.star,friends=c.m.filter(function(w){return w!==star&&w.ovr<star.ovr-6&&w.ws<=1;}).sort(function(a,b){return a.ovr-b.ovr;});
  var rivals=rosterOf(S,P.id).filter(function(w){return !w.nw&&c.m.indexOf(w)<0&&relOf(S,star.id,w.id)<0&&w.ovr<=star.ovr+5&&w.ovr>=star.ovr-25&&!w.held;}).sort(function(a,b){return b.ovr-a.ovr;});
  var kind=friends.length&&(!rivals.length||chance(S,0.55))?'push':(rivals.length?'hold':null);if(!kind)return;
  var tgt=kind==='push'?friends[0]:rivals[0];S.cliqueAt=S.week;
  var names=c.m.filter(function(w){return w!==star;}).slice(0,3).map(function(w){return w.name;});
  var ev={type:'clique',w:star.id,target:tgt.id,kind:kind,members:c.m.map(function(w){return w.id;}),cname:c.name,
    text:star.name+' comes to you with '+names.join(', ')+'. They stand together, and they have a favour to ask: '+(kind==='push'?'a win for '+tgt.name+', one of their own.':'keep '+tgt.name+' down for eight weeks.'),
    choices:['Say yes','Say no','Break up the group'],
    checks:{1:mkCheck(7,[moraleMod(star),trustMod(S)].concat(skillMods(S,'talk'))),2:mkCheck(8,[moraleMod(star),trustMod(S),{n:'A big group',v:c.m.length>=5?-1:0}].concat(skillMods(S,'talk')))}};
  pushEv(S,ev);
});
EVR.clique=function(S,ev,choice,P,w){
  var tgt=S.w[ev.target],mem=ev.members.map(function(id){return S.w[id];}).filter(Boolean),r;
  if(choice===0){
    mem.forEach(function(x){x.morale=clamp(x.morale+4,0,100);});
    if(ev.kind==='push'&&tgt){S.quests.push({id:S.nid++,type:'win',w:tgt.id,due:S.week+3,text:'Promise to '+ev.cname+': book a win for '+tgt.name+' by '+cal(S.week+3).label});return 'You said yes. '+w.name+' and the others are pleased, and they will hold you to a win for '+tgt.name+'.';}
    if(tgt){tgt.held=S.week+8;tgt.heldBy=w.id;tgt.morale=clamp(tgt.morale-4,0,100);return 'You said yes. '+tgt.name+' will hear about it, and '+w.name+' will notice if you push them in the next eight weeks.';}
    return 'You said yes.';
  }
  if(choice===1){
    r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){mem.forEach(function(x){x.morale=clamp(x.morale-1,0,100);});return rollText(r)+w.name+' takes it well enough. The group goes quiet.';}
    mem.forEach(function(x){x.morale=clamp(x.morale-5,0,100);});w.arc={t:'grievance'};
    return rollText(r)+'The group closes ranks against you. Expect '+w.name+' to say so on the next show.';
  }
  r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){
    for(var i=0;i<mem.length;i++)for(var j=i+1;j<mem.length;j++){var k=rkey(mem[i].id,mem[j].id);if(S.rel&&S.rel[k]>0)S.rel[k]=0;if(S.bond&&S.bond[k]>0)S.bond[k]=0;}
    mem.forEach(function(x){x.morale=clamp(x.morale-3,0,100);});
    news(S,'story','The locker room is quieter. '+ev.cname+' has been broken up.');
    return rollText(r)+'You split them up on the card and in the dressing room. The group is gone. Nobody enjoyed it.';
  }
  mem.forEach(function(x){x.morale=clamp(x.morale-6,0,100);});
  for(var a=0;a<mem.length;a++)for(var b=a+1;b<mem.length;b++){var kk=rkey(mem[a].id,mem[b].id);S.bond=S.bond||{};S.bond[kk]=Math.min(10,(S.bond[kk]||0)+2);}
  return rollText(r)+'It backfires. They are closer than ever, and angrier.';
};
/* if you push someone you promised to hold down, their friends notice */
POST.push(function(ctx){
  var S=ctx.S,r=ctx.res;if(!ctx.isPl||S.cal||r.win<0)return;
  r.winners.forEach(function(w){
    if(w.held==null||w.held<S.week)return;
    var star=S.w[w.heldBy];w.held=null;if(!star)return;
    star.morale=clamp(star.morale-6,0,100);S.trust=clamp(S.trust-1,0,100);
    r.seg.notes.push(star.name+' noticed that '+w.name+' got the win. You said you would hold them down.');
  });
});

/* ---------- 39. Creative control: a top star can win the right to refuse a loss (w.cc) ---------- */
/* the extra booking power for calling a loss on someone with control; a draw costs nothing extra */
function ccCost(S,m,k){
  return m.sides.some(function(s,j){return j!==k&&s.some(function(id){return S.w[id]&&S.w[id].cc;});})?2:0;
}
/* when the result is left to play out and the dice would have a controlling star lose, they refuse (not as a challenger in a title match) */
function ccRefusal(S,sides,win,t,champSide){
  for(var k=0;k<sides.length;k++){
    if(k===win)continue;
    for(var i=0;i<sides[k].length;i++){
      var w=sides[k][i];
      if(w.cc&&!(t&&champSide>=0&&k!==champSide))return {side:k,w:w};
    }
  }
  return null;
}
WEEKX.push(function(S){
  if(S.cal)return;
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;});
  R.forEach(function(w){if(w.cc&&(S.week>=(w.ccUntil||0)||w.promo!==P.id)){w.cc=0;news(S,'contract',w.name+'’s creative control ended with the contract.');}});
  if(!chance(S,0.05)||S.inbox.some(function(e){return e.type==='ccask'&&!e.done;}))return;
  var ovrs=R.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=ovrs[Math.max(0,Math.floor(R.length*0.12))]||0;
  var c=R.filter(function(w){return w.ovr>=cut&&w.ovr>=60&&!w.cc&&w.con>=6&&w.morale>=40&&w.inj<=0&&(w.ccAsk==null||S.week-w.ccAsk>=52);}).sort(function(a,b){return b.ovr-a.ovr;});
  if(!c.length)return;
  var w=c[0];w.ccAsk=S.week;
  pushEv(S,{type:'ccask',w:w.id,text:w.name+' wants a clause in the contract: creative control. They would be able to refuse a loss on any show until the contract ends.',
    choices:['Grant it until the contract ends','Offer ten percent more money instead','Turn them down'],
    checks:{1:mkCheck(7,[moraleMod(w),trustMod(S)].concat(skillMods(S,'talk')))}});
});
EVR.ccask=function(S,ev,choice,P,w){
  if(choice===0){w.cc=1;w.ccUntil=S.week+Math.max(6,w.con|0);w.morale=clamp(w.morale+10,0,100);return w.name+' has creative control until the contract ends. Leaving them to play out can end in a win they asked for, and calling a loss on them costs 2 more booking power.';}
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){w.wage=Math.round(w.wage*1.1/50)*50;w.morale=clamp(w.morale+3,0,100);return rollText(r)+w.name+' takes the money, now '+money(w.wage)+' a week, and drops the clause.';}
    w.morale=clamp(w.morale-4,0,100);return rollText(r)+w.name+' says money is not the point.';
  }
  w.morale=clamp(w.morale-8,0,100);stressAdd(S,w,6);return w.name+' is not happy, but it is your show.';
};
POST.push(function(ctx){
  var S=ctx.S,m=ctx.m,r=ctx.res;if(!ctx.isPl||S.cal||m.call==null||m.call<0||r.win<0)return;
  ctx.sides.forEach(function(s,k){if(k===m.call)return;s.forEach(function(w){if(w.cc){w.morale=clamp(w.morale-5,0,100);S.trust=clamp(S.trust-1,0,100);r.seg.notes.push(w.name+' has creative control, and you overrode it. They remember.');}});});
});
E.controlWord=function(w){return w.cc?'Can refuse to lose. Calling a loss on them costs 2 more booking power and a little trust.':null;};

/* ---------- 44. The road: wear from the schedule (w.rd), travel partners, and a bus or a charter (P.trv) ---------- */
var TRVN=['Vans and cars','Tour bus','Charter flights'],TRV_C=[0,0.004,0.011],TRV_R=[0,0.3,0.6];
function travelCost(P){return Math.round(TRV_C[P.trv||0]*P.inc0);}
E.TRVN=TRVN;E.TRV_C=TRV_C;
E.travelInfo=function(S){var P=S.promos[S.player];return {lvl:P.trv||0,names:TRVN,costs:TRV_C.map(function(c){return Math.round(c*P.inc0);}),cost:travelCost(P)};};
E.roadWord=function(w){var v=w.rd||0;return v>=80?'Wrecked':(v>=60?'Worn down':(v>=35?'Tired':'Fresh'));};
WEEKX.push(function(S){
  if(S.cal)return;
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw;}),cut=1-TRV_R[P.trv||0];
  R.forEach(function(w){
    var worked=w.wk===S.week,n=worked?(w.wkW===S.week?w.wkN||1:1):0;
    w.rd=clamp((w.rd||0)+(worked?(5+(n-1)*3)*cut:-9-(w.rest===S.week?6:0)),0,100);
  });
  // cars: the people who worked this week are shuffled into groups of three on the road
  var on=R.filter(function(w){return w.wk===S.week&&w.inj<=0;}).sort(function(a,b){return hash('car'+S.week+a.id)-hash('car'+S.week+b.id);});
  var fric=[0.02,0.01,0.004][P.trv||0],B=S.bond||(S.bond={});
  for(var i=0;i+1<on.length;i+=3){
    var grp=on.slice(i,i+3);
    for(var a=0;a<grp.length;a++)for(var b=a+1;b<grp.length;b++){
      var x=grp[a],y=grp[b],k=rkey(x.id,y.id),v=B[k]||0;
      B[k]=clamp(v+(relOf(S,x.id,y.id)<0?-0.3:0.25),-8,8);
      var p=fric*(1+Math.max(0,-v)*0.4)*(1+((x.stress||0)+(y.stress||0))/150);
      if(S.week-(S.carAt||-99)>=10&&chance(S,p)&&!S.inbox.some(function(e){return e.type==='carfight'&&!e.done;})){
        S.carAt=S.week;
        pushEv(S,{type:'carfight',w:x.id,o:y.id,text:x.name+' and '+y.name+' came to blows on the road after a long week. Word is already out.',
          choices:['Turn it into a feud','Make them shake hands','Fine them both'],checks:{1:mkCheck(7,[trustMod(S),{n:'They are tired of the road',v:((x.rd||0)+(y.rd||0))/2>=60?-1:0}].concat(skillMods(S,'talk')))}});
      }
    }
  }
});
EVR.carfight=function(S,ev,choice,P,w){
  var o=S.w[ev.o],k=rkey(w.id,o.id);S.bond=S.bond||{};
  if(choice===0){var f=startFeud(S,P,w,o,40,w.name+' and '+o.name+' fought on the road',{force:true});w.mom=clamp(w.mom+1,-10,10);o.mom=clamp(o.mom+1,-10,10);return f?'You turned it into a story. '+w.name+' against '+o.name+' is on.':'There was already a story between them, and the fight fed it.';}
  if(choice===1){
    var r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){S.bond[k]=Math.min(8,(S.bond[k]||0)+2);return rollText(r)+'They shake hands and mean it, mostly.';}
    S.bond[k]=Math.max(-8,(S.bond[k]||0)-1.5);w.morale=clamp(w.morale-3,0,100);o.morale=clamp(o.morale-3,0,100);return rollText(r)+'They shake hands for the cameras and go back to glaring.';
  }
  w.morale=clamp(w.morale-5,0,100);o.morale=clamp(o.morale-5,0,100);P.cash-=5000;S.bond[k]=Math.max(-8,(S.bond[k]||0)-0.5);return 'You fined them both. Nobody argued, and nobody forgot.';
};
MQX.push(function(ctx){
  if(!ctx.isPl||ctx.S.cal)return null;var v=avg(ctx.all.map(function(w){return w.rd||0;}));
  return v>=65?{d:-(v-60)/12,x:'Worn out from the road'}:null;
});

/* ---------- 45. Holdouts: a star who earns well under a peer stays home until it is fixed (w.hold) ---------- */
function holdPeer(S,P,w,R){
  var best=null;R.forEach(function(o){if(o===w||o.g!==w.g||Math.abs(o.ovr-w.ovr)>4||o.wage<w.wage*1.35)return;if(!best||o.wage>best.wage)best=o;});
  return best;
}
WEEKX.push(function(S){
  if(S.cal)return;
  var P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt;});
  R.forEach(function(w){if(w.hold&&S.week>=w.hold.until){w.hold=null;w.morale=clamp(w.morale-5,0,100);news(S,'contract',w.name+' ended the holdout and came back without being paid more.');}});
  if(!chance(S,0.04)||S.inbox.some(function(e){return e.type==='holdout'&&!e.done;}))return;
  var ovrs=R.map(function(w){return w.ovr;}).sort(function(a,b){return b-a;}),cut=ovrs[Math.floor(R.length*0.25)]||0;
  var c=R.filter(function(w){return w.ovr>=cut&&w.ovr>=55&&!w.hold&&w.inj<=0&&w.morale<75&&(w.hoAt==null||S.week-w.hoAt>=40)&&holdPeer(S,P,w,R);}).sort(function(a,b){return a.morale-b.morale;});
  if(!c.length)return;
  var w=c[0],peer=holdPeer(S,P,w,R);w.hoAt=S.week;w.hold={until:S.week+6,peer:peer.id,ask:Math.round(peer.wage*0.95/50)*50};w.away=S.week+1;
  pushEv(S,{type:'holdout',w:w.id,o:peer.id,text:w.name+' earns '+money(w.wage)+' a week. '+peer.name+', who is no better, earns '+money(peer.wage)+'. '+w.name+' is staying home until it is fixed.',
    choices:['Pay up: '+money(w.hold.ask)+' a week','Promise a win this month and a raise at the next renewal','Call the bluff'],
    checks:{1:mkCheck(7,[moraleMod(w),trustMod(S)].concat(skillMods(S,'talk'))),2:mkCheck(8,[moraleMod(w),trustMod(S),{n:'Nowhere else to go',v:w.ovr<P.image?1:0},{n:'Other companies would take them',v:w.ovr>=P.image+5?-1:0}].concat(skillMods(S,'talk')))}});
});
EVR.holdout=function(S,ev,choice,P,w){
  var h=w.hold,r;if(!h)return w.name+' is already back.';
  if(choice===0){w.wage=h.ask;w.hold=null;w.away=null;w.morale=clamp(w.morale+10,0,100);return w.name+' is paid '+money(w.wage)+' a week and is back on the card.';}
  if(choice===1){
    r=rollCheck(S,ev.checks[1]);ev.roll=r;
    if(r.ok){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+3,text:'Promise: book a win for '+w.name+' by '+cal(S.week+3).label});w.hold=null;w.away=null;w.morale=clamp(w.morale+4,0,100);return rollText(r)+w.name+' takes your word and returns. They will hold you to the win.';}
    h.until=S.week+3;w.away=S.week+2;return rollText(r)+w.name+' wants it in writing. They stay home another two weeks.';
  }
  r=rollCheck(S,ev.checks[2]);ev.roll=r;
  if(r.ok){w.hold=null;w.away=S.week+1;w.morale=clamp(w.morale-8,0,100);return rollText(r)+w.name+' blinks and comes back after a week, angry.';}
  w.away=S.week+4;h.until=S.week+4;w.morale=clamp(w.morale-12,0,100);stressAdd(S,w,10);
  news(S,'contract',w.name+' is still at home. Other companies are said to be interested.');
  return rollText(r)+w.name+' does not blink. Four more weeks at home, and the room is talking about it.';
};


/* ---------- 47. Merchandise lines: commission a design for a wrestler (P.lines), each with its own sales curve ---------- */
var LINEK={
  shirt:{n:'T-shirt',cost:0.004,mult:0.14,plateau:6,hl:8,d:'A quick seller. Sells hard for six weeks, then fades.'},
  poster:{n:'Poster',cost:0.0015,mult:0.15,plateau:4,hl:6,d:'Cheap and quick. A small, short run.'},
  mask:{n:'Replica mask',cost:0.006,mult:0.17,plateau:6,hl:10,d:'For masked wrestlers only. Fans love a mask they can wear.'},
  figure:{n:'Action figure',cost:0.012,mult:0.12,plateau:12,hl:16,d:'Dear to make and slow to catch on, but it sells for months.'}
};
function lineHeat(S,w){
  var h=clamp(Math.pow(w.ovr/70,2),0.3,2.2)*(1+w.mom*0.04);
  var P=S.promos[w.promo];if(P&&holdLvl(P,w.id)>0)h*=1.25;
  if(P&&P.titles.some(function(t){return t.holders.indexOf(w.id)>=0&&S.week-t.since<=6;}))h*=1.35;   // a fresh title win
  if(w.cphrase&&w.cphrase.n<15)h*=1.1;
  return h;
}
function lineCurve(L,age){var k=LINEK[L.kind];return age<2?(age+1)/3:(age<2+k.plateau?1:Math.pow(0.5,(age-2-k.plateau)/k.hl));}
function linesWeek(S,P){
  if(!P||!P.lines||!P.lines.length)return 0;var t=0;
  P.lines.forEach(function(L){var w=S.w[L.w],k=LINEK[L.kind];if(!w||!k)return;t+=P.inc0*k.cost*k.mult*lineHeat(S,w)*lineCurve(L,S.week-L.started);});
  return t;
}
E.LINEK=LINEK;
E.lineSlots=function(S){var P=S.promos[S.player];return 2+Math.floor(P.image/30);};
E.lineList=function(S){
  var P=S.promos[S.player];
  return (P.lines||[]).map(function(L){var w=S.w[L.w],k=LINEK[L.kind],age=S.week-L.started,c=lineCurve(L,age);
    return {w:w,kind:k.n,age:age,state:age<2?'Launching':(c>=1?'Selling well':(c>0.5?'Slowing':'Nearly done')),rev:Math.round(P.inc0*k.cost*k.mult*lineHeat(S,w)*c),id:L.id};});
};
E.lineCost=function(S,kind){var P=S.promos[S.player],k=LINEK[kind];return k?Math.round(P.inc0*k.cost):0;};
E.lineWhy=function(S,wid,kind){
  var P=S.promos[S.player],w=S.w[wid],k=LINEK[kind];
  if(!w||!k||w.promo!==P.id||w.nw)return 'Pick one of your wrestlers.';
  if((P.lines||[]).length>=E.lineSlots(S))return 'You have all '+E.lineSlots(S)+' lines going. More open as popularity grows.';
  if((P.lines||[]).some(function(L){return L.w===wid&&L.kind===kind;}))return 'That line is already out.';
  if(kind==='mask'&&masked(w)!==1)return w.name+' does not wear a mask.';
  if(P.cash<E.lineCost(S,kind))return 'Not enough cash.';
  return null;
};
E.commissionLine=function(S,wid,kind){
  var why=E.lineWhy(S,wid,kind);if(why)return {ok:false,text:why};
  var P=S.promos[S.player],w=S.w[wid],c=E.lineCost(S,kind);P.cash-=c;
  (P.lines||(P.lines=[])).push({id:S.nid++,w:wid,kind:kind,started:S.week});
  news(S,'money','A '+LINEK[kind].n.toLowerCase()+' for '+w.name+' goes on sale.');
  return {ok:true,text:'You paid '+money(c)+' for a '+LINEK[kind].n.toLowerCase()+' for '+w.name+'. It goes on sale this week.'};
};
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];if(!P.lines||!P.lines.length)return;
  P.lines=P.lines.filter(function(L){
    var w=S.w[L.w],k=LINEK[L.kind],age=S.week-L.started;
    if(!w||w.promo!==P.id||(L.kind==='mask'&&masked(w)!==1)){news(S,'money','The '+k.n.toLowerCase()+' for '+(w?w.name:'a departed wrestler')+' is pulled from sale.');return false;}
    if(age>2+k.plateau&&lineCurve(L,age)<0.1){news(S,'money','The '+k.n.toLowerCase()+' for '+w.name+' has run its course.');return false;}
    return true;
  });
});

/* ---------- 48. Ticket prices: the game suggests a price from the next show's demand and the building (engine half; per-building tiers belong to TASKS 4) ---------- */
E.ticketAdvice=function(S){
  var P=S.promos[S.player],show=S.queue&&S.queue[S.qi];if(!show)show=weekShows(S,P)[0];if(!show)return null;
  var d=demand(P,show,1),cap=capFor(d),mx=mixOf(P),rows=[];
  for(var l=0;l<TIX_P.length;l++){
    var att=Math.min(cap,d*TIX_D[l]),fill=att/cap;
    // empty seats flatten the crowd, which costs ratings later, so the count of lost crowd energy is charged against the gate
    var en=clamp((TIX_D[l]-1)*9,-2,2),gate=att*ticket(P,show)*TIX_P[l]*mx.gate*(1-Math.max(0,-en)*0.04);
    rows.push({lvl:l,name:TIXN[l],att:Math.round(att),cap:cap,fill:Math.round(fill*100),gate:Math.round(gate)});
  }
  var best=0;rows.forEach(function(r,i){if(r.gate>rows[best].gate)best=i;});
  var cur=P.tix,gain=rows[best].gate-rows[cur].gate;
  return {rows:rows,best:best,cur:cur,gain:gain,
    text:best===cur?'The current price is the best one for '+show.name+': '+rows[cur].fill+'% of '+cap.toLocaleString('en-US')+' seats filled.'
      :'For '+show.name+', '+TIXN[best].toLowerCase()+' prices would bring in about '+money(gain)+' more and leave '+rows[best].fill+'% of '+cap.toLocaleString('en-US')+' seats filled.'};
};

/* ---------- 50. The tape library: every show of yours joins a back catalogue (P.tape) that earns, can be licensed out, or sold in a crisis ---------- */
function tapeValue(S,P){var v=0;(P.tape||[]).forEach(function(e){v+=e.v*Math.pow(0.992,S.week-e.w);});return v;}
function tapeWeekly(S,P){return tapeValue(S,P)*0.0015*(P.tapeLic&&S.week<P.tapeLic?0.5:1);}
SHOWX.push(function(S,P,show,rep){
  if(S.cal||P.id!==S.player)return;
  var L=P.tape||(P.tape=[]);L.push({w:S.week,n:show.name,r:Math.round(rep.rating),v:Math.round(P.inc0*Math.pow(rep.rating/100,3)*0.05)});
  if(L.length>200)L.shift();
  if(P.tapeW!==S.week){P.tapeW=S.week;P.led.bonus+=tapeWeekly(S,P);}   // once a week, whichever show goes first
});
E.tape=function(S){
  var P=S.promos[S.player],L=P.tape||[],v=tapeValue(S,P);
  return {n:L.length,value:Math.round(v),weekly:Math.round(tapeWeekly(S,P)),licensed:P.tapeLic&&S.week<P.tapeLic?P.tapeLic-S.week:0,
    best:L.slice().sort(function(a,b){return b.v*Math.pow(0.992,S.week-b.w)-a.v*Math.pow(0.992,S.week-a.w);}).slice(0,3),
    licenseFor:Math.round(v*0.12),sellFor:Math.round(v*0.55)};
};
E.licenseTape=function(S){
  var P=S.promos[S.player],t=E.tape(S);
  if(t.n<8)return {ok:false,text:'There is not enough back catalogue to license. Run more shows.'};
  if(t.licensed)return {ok:false,text:'The library is already licensed out for '+t.licensed+' more weeks.'};
  P.cash+=t.licenseFor;P.tapeLic=S.week+26;
  news(S,'money','A network licensed your back catalogue for 26 weeks and paid '+money(t.licenseFor)+'.');
  return {ok:true,text:'The library is licensed out for 26 weeks. You were paid '+money(t.licenseFor)+', and your own streaming income is halved while it lasts.'};
};
E.sellTape=function(S){
  var P=S.promos[S.player],t=E.tape(S);
  if(t.n<8)return {ok:false,text:'There is not enough back catalogue to sell.'};
  P.cash+=t.sellFor;P.tape=[];P.tapeLic=0;P.tapeSold=(P.tapeSold|0)+1;
  news(S,'money','You sold the back catalogue for '+money(t.sellFor)+'. The tapes belong to someone else now.');
  return {ok:true,text:'Sold for '+money(t.sellFor)+'. The shows already made are gone, and the library starts again from today.'};
};

/* ---------- 70. The crowd takes over: a crowd that rejects the pushed star chants for someone else (more in diehard cities) ---------- */
function showCity(rep){return rep&&rep.venue?String(rep.venue).replace(/ (Armory|Civic Auditorium|Fieldhouse|Coliseum|Arena|Stadium)$/,''):'';}
function diehard(S,city){return !!city&&h01('diehard'+city+S.seed)<0.35;}
E.isDiehard=function(S,city){return diehard(S,city);};
CRX.push(function(ctx){
  var S=ctx.S;if(!ctx.isPl||S.cal||!ctx.isMain||ctx.m.mt==='br'||ctx.sides.length!==2||ctx.takeover!==undefined)return null;
  var ps=ctx.t&&ctx.champSide>=0?ctx.champSide:(ctx.m.call!=null&&ctx.m.call>=0?ctx.m.call:-1);ctx.takeover=null;if(ps<0)return null;
  var pushed=ctx.sides[ps],other=ctx.sides[ps===0?1:0],po=avg(pushed.map(function(w){return w.ovr;})),oo=avg(other.map(function(w){return w.ovr;}));
  if(po>=oo+3)return null;
  var city=showCity(ctx.rep),dh=diehard(S,city),lead=pushed[0];
  var p=Math.min(0.4,0.04+0.01*Math.max(0,oo-po)+(dh?0.1:0)+(lead.mom<=-2?0.06:0));
  if(!chance(S,p))return null;
  var fav=ctx.all.length&&S.w.filter(function(w){return w.promo===ctx.P.id&&!w.nw&&w.inj<=0&&ctx.all.indexOf(w)<0&&w.align==='F'&&!(w.away>=S.week);}).sort(function(a,b){return (b.mom+b.ovr/20)-(a.mom+a.ovr/20);})[0]||other[0];
  ctx.takeover={pushed:lead,fav:fav,city:city,dh:dh};
  return {d:-3,x:'The crowd rejected '+lead.name+' and chanted for '+fav.name+(dh&&city?'. '+city+' is a hard crowd to push anything past':'')};
});
POST.push(function(ctx){
  var S=ctx.S,tk=ctx.takeover;if(!tk||S.cal||!ctx.isPl)return;
  var lead=tk.pushed,fav=tk.fav;lead.mom=clamp(lead.mom-1,-10,10);fav.mom=clamp(fav.mom+2,-10,10);
  ctx.res.seg.notes.push('The crowd took over: they turned on '+lead.name+' and chanted for '+fav.name+'.');
  news(S,'story','The crowd in '+(tk.city||'the building')+' chanted for '+fav.name+' during '+lead.name+'’s match.');
  if(S.inbox.some(function(e){return e.type==='chant'&&!e.done;}))return;
  pushEv(S,{type:'chant',w:fav.id,o:lead.id,text:'The crowd would not let it go: they rejected '+lead.name+' and wanted '+fav.name+'. What do you do about it?',
    choices:['Give them what they want: a win for '+fav.name,'Stay the course with '+lead.name,'Turn it into a feud']});
});
EVR.chant=function(S,ev,choice,P,w){
  var lead=S.w[ev.o];if(!lead)return 'The moment has passed.';
  if(choice===0){S.quests.push({id:S.nid++,type:'win',w:w.id,due:S.week+3,text:'The crowd chose: book a win for '+w.name+' by '+cal(S.week+3).label});w.morale=clamp(w.morale+8,0,100);lead.morale=clamp(lead.morale-6,0,100);return 'You will give '+w.name+' the win. '+lead.name+' is not happy about it.';}
  if(choice===1){lead.morale=clamp(lead.morale+3,0,100);S.trust=clamp(S.trust-1,0,100);w.morale=clamp(w.morale-3,0,100);return 'You are staying with '+lead.name+'. The crowd will not like it, and '+w.name+' knows they were wanted.';}
  var f=startFeud(S,P,w,lead,45,w.name+' answered the crowd’s call against '+lead.name,{force:true});return f?'The chant becomes a story: '+w.name+' against '+lead.name+'.':'They were already feuding, and the chant fed it.';
};
E.crowdCity=function(S,rep){var c=showCity(rep);return {city:c,diehard:diehard(S,c)};};

/* ===== 87-develop.js ===== */
/* ---------- the development side: the camp's weekly show, and (later) the wrestling school ---------- */

/* ---------- 51. A developmental show: campers work a small weekly show that runs by itself (w.dv, P.devRep) ---------- */
function campers(S){var P=S.promos[S.player];return rosterOf(S,P.id).filter(function(w){return w.camp&&!w.nw;});}
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],C=campers(S);if(C.length<2){P.devRep=P.devRep||[];return;}
  var order=C.slice().sort(function(a,b){return hash('dv'+S.week+a.id)-hash('dv'+S.week+b.id);}),lines=[],lv=P.camp||0;
  for(var i=0;i+1<order.length;i+=2){
    var a=order[i],b=order[i+1],ra=workRate(a),rb=workRate(b),ch=chem(S,a.id,b.id),q=(ra+rb)/2+ch+(rnd(S)*2-1)*6;
    var win=chance(S,clamp(0.5+(a.ovr-b.ovr)/80,0.2,0.8))?a:b,los=win===a?b:a;
    [a,b].forEach(function(w){
      if(workRate(w)<w.pot)w.xp+=0.12+0.04*lv;
      var d=w.dv||(w.dv={n:0,best:0,w:0,last:''});d.n++;d.w=S.week;d.best=Math.max(d.best,Math.round(q));
    });
    win.dv.last=win.name+' beat '+los.name+'. '+(q>=75?'Real polish.':(q>=60?'Solid work.':(q>=45?'Plenty of rough edges.':'It was hard to watch.')));
    los.dv.last=los.name+' lost to '+win.name+'. '+(q>=75?'They looked good doing it.':(q>=60?'A fair showing.':'Not their night.'));
    lines.push({a:a.id,b:b.id,w:win.id,q:Math.round(q),text:win.dv.last});
    if(chance(S,0.015)){var h=chance(S,0.5)?a:b;h.inj=Math.max(h.inj,ri(S,1,3));lines[lines.length-1].text+=' '+h.name+' picked up a knock.';}
  }
  if(order.length%2){var o=order[order.length-1];o.dv=o.dv||{n:0,best:0,w:0,last:''};o.dv.w=S.week;o.dv.last=o.name+' cut a promo on the show.';if(o.mic<(o.mic0||o.mic)+15)o.micx=(o.micx||0)+0.15;lines.push({a:o.id,b:null,w:null,q:0,text:o.dv.last});}
  P.devRep=(P.devRep||[]);P.devRep.unshift({w:S.week,lines:lines});if(P.devRep.length>4)P.devRep.length=4;
  // a camper who has outgrown the camp asks for a call-up
  if(S.inbox.some(function(e){return e.type==='callup'&&!e.done;}))return;
  var rd=C.filter(function(w){return w.dv&&w.dv.n>=6&&(w.dvHold==null||S.week>=w.dvHold)&&(workRate(w)>=(w.cw0||999)+5||w.mic>=(w.cm0||999)+8||w.dv.n>=16);}).sort(function(a,b){return b.ovr-a.ovr;});
  if(rd.length){
    var w=rd[0];
    pushEv(S,{type:'callup',w:w.id,text:w.name+' has been on the camp show for '+w.dv.n+' weeks and has outgrown it. '+(w.dv.best>=70?'Their best match there was rated '+w.dv.best+'%. ':'')+'The crowd at the camp show knows the name.',
      choices:['Call them up now, with a debut','Another month in camp','Release them']});
  }
});
EVR.callup=function(S,ev,choice,P,w){
  if(!w.camp)return w.name+' is already back on the roster.';
  if(choice===0){E.callUp(S,w.id);w.mom=clamp(w.mom+2,-10,10);w.morale=clamp(w.morale+8,0,100);news(S,'story',w.name+' graduated from the camp show and makes a debut.');return w.name+' is called up. The crowd will meet them on the next show.';}
  if(choice===1){w.dvHold=S.week+4;w.morale=clamp(w.morale-2,0,100);return w.name+' stays in camp for a month.';}
  return E.release(S,w.id)||w.name+' is released.';
};
E.devShow=function(S){
  var P=S.promos[S.player],C=campers(S);
  return {n:C.length,cap:E.campInfo(S).cap,report:(P.devRep&&P.devRep[0])||null,
    rows:C.map(function(w){return {w:w,matches:(w.dv&&w.dv.n)|0,best:(w.dv&&w.dv.best)|0,last:(w.dv&&w.dv.last)||'No matches yet.',gain:Math.round(workRate(w)-(w.cw0||workRate(w))),micGain:Math.round(w.mic-(w.cm0||w.mic))};})};
};

/* ---------- 52. The wrestling school: students pay a fee, one in several becomes a prospect, the trainer decides how good (P.school) ---------- */
function trainerQ(S,P){
  var tr=staffOf(S,'trainer').sort(function(a,b){return workRate(b)-workRate(a);})[0];
  return tr?{q:clamp((workRate(tr)-50)/40,0.1,1.2),who:tr}:{q:0.1+0.15*(P.camp||0),who:null};
}
function schoolCap(P){return 8+6*(P.camp||0);}
function schoolFee(P){return Math.round(P.inc0*0.00018);}
function schoolRun(P){return Math.round(P.inc0*0.0015);}
E.school=function(S){
  var P=S.promos[S.player],sc=P.school,tq=trainerQ(S,P);
  return {open:!!sc,students:sc?sc.n:0,cap:schoolCap(P),fee:schoolFee(P),run:schoolRun(P),setup:Math.round(P.inc0*0.03),
    quality:tq.q,qualityWord:tq.q>=0.8?'excellent':(tq.q>=0.5?'good':(tq.q>=0.3?'fair':'poor')),trainer:tq.who,
    chance:Math.round((0.03+0.1*tq.q)*100),grads:sc?sc.grads:0,prospects:sc?sc.pros:0,next:sc?Math.max(0,sc.term-S.week):0,
    income:sc?sc.n*schoolFee(P)-schoolRun(P):0};
};
E.openSchool=function(S){
  var P=S.promos[S.player],i=E.school(S);
  if(P.school)return {ok:false,text:'The school is already open.'};
  if(P.cash<i.setup)return {ok:false,text:'Not enough cash to open a school ('+money(i.setup)+').'};
  P.cash-=i.setup;P.school={since:S.week,n:Math.min(4,i.cap),term:S.week+12,grads:0,pros:0};
  news(S,'story','You opened a wrestling school.');
  return {ok:true,text:'The school is open. It cost '+money(i.setup)+'. Students pay '+money(i.fee)+' a week each, and a class graduates every twelve weeks.'};
};
E.closeSchool=function(S){var P=S.promos[S.player];if(!P.school)return {ok:false,text:'There is no school.'};P.school=null;news(S,'story','You closed the wrestling school.');return {ok:true,text:'The school is closed.'};};
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],sc=P.school;if(!sc)return;
  var cap=schoolCap(P),tq=trainerQ(S,P);
  sc.n=Math.min(cap,sc.n+(chance(S,0.5+P.image/200)?2:1));   // word spreads, so the class fills
  P.cash+=sc.n*schoolFee(P)-schoolRun(P);
  if(S.week<sc.term)return;
  // graduation day
  var I=dbOf(S).indie,styles=['B','T','H','P','A','S','E'],made=[],have={};S.w.forEach(function(w){have[w.name]=1;});
  var grads=sc.n,p=0.03+0.1*tq.q,mine=rosterOf(S,P.id).filter(function(x){return x.sch===P.id&&x.ovr<45;}).length;sc.grads+=grads;
  for(var i=0;i<grads;i++){
    if(!chance(S,p)||mine+made.length>=3)continue;
    var g=chance(S,0.3)?'F':'M',nm,tries=0;
    do{nm=pick(S,g==='F'?I.firstF:I.firstM)+' '+pick(S,I.last);}while(have[nm]&&tries++<40);
    if(have[nm])continue;have[nm]=1;
    var work=ri(S,40,58)+Math.round(tq.q*8),w=addWrestler(S,{name:nm,g:g,ovr:ri(S,8,22)+Math.round(tq.q*4),style:pick(S,styles),work:work,mic:ri(S,35,75),align:chance(S,0.5)?'F':'H',age:ri(S,19,25)},'FA',null);
    w.pot=clamp(work+ri(S,10,22)+Math.round(tq.q*10),work,97);w.sq=clamp(ri(S,35,75),20,97);w.rk=cal(S.week).year;assignGim(w);mile(S,w,'debut','Graduated from the '+P.name+' school');
    joinCompany(S,w,P,150,52);w.sch=P.id;
    if(E.campInfo(S).n<E.campInfo(S).cap)E.sendCamp(S,w.id,'ring');
    made.push(w);
  }
  sc.pros+=made.length;sc.n=Math.round(sc.n*0.3);sc.term=S.week+12;
  news(S,'story','The school class graduated: '+grads+' students, '+(made.length?made.length+' signed as prospects ('+made.map(function(w){return w.name;}).join(', ')+')':'nobody good enough to sign')+'.');
});

/* ===== 88-finance.js ===== */
/* ---------- the money side: loans and investors, licensing, budgets ---------- */

/* ---------- 53. Loans and investors (P.loan, P.inv); only an owner can borrow or sell a share ---------- */
var LOANT={
  small:{n:'Small loan',mult:4,rate:0.0016},
  medium:{n:'Medium loan',mult:10,rate:0.0020},
  large:{n:'Large loan',mult:20,rate:0.0026}
};
var INVWANT={
  risk:{n:'want the product pushed harder',d:'A risk level of Edgy or above.',ok:function(S,P){return P.risk>=2;},fix:function(S,P){P.risk=Math.min(riskRange(P)[1],Math.max(P.risk,2));}},
  safe:{n:'want no trouble with sponsors',d:'A risk level of Mainstream or below.',ok:function(S,P){return P.risk<=1;},fix:function(S,P){P.risk=Math.max(riskRange(P)[0],Math.min(P.risk,1));}},
  prod:{n:'want a better looking show',d:'Production values of Slick or better.',ok:function(S,P){return P.prodLvl>=3;},fix:function(S,P){P.prodLvl=Math.max(P.prodLvl,3);}},
  lean:{n:'want a lean company',d:'Wages under 45% of what comes in.',ok:function(S,P){var r=P.hist[P.hist.length-1];return !r||r.wages<=r.inc*0.45;},fix:null}
};
function financeCost(S,P,net){
  var t=0;
  if(P.loan){var pay=P.loan.amt/52+P.loan.bal*P.loan.rate;t+=pay;P.loan.bal=Math.max(0,P.loan.bal-P.loan.amt/52);if(P.loan.bal<=1){news(S,'money','The last loan payment is made. You owe nothing.');P.loan=null;}}
  if(P.inv&&net>0)t+=net*P.inv.share;
  return Math.round(t);
}
E.loanOffers=function(S){var P=S.promos[S.player];return Object.keys(LOANT).map(function(k){return {id:k,n:LOANT[k].n,amt:Math.round(P.inc0*LOANT[k].mult),weekly:Math.round(P.inc0*LOANT[k].mult*(1/52+LOANT[k].rate)),apr:Math.round(LOANT[k].rate*52*1000)/10};});};
E.investorOffer=function(S){var P=S.promos[S.player];return {amt:Math.round(P.inc0*16),share:0.15};};
E.finance=function(S){
  var P=S.promos[S.player],wants=P.inv?INVWANT[P.inv.want]:null;
  return {owner:!!S.owner.me,loan:P.loan?{amt:P.loan.amt,bal:Math.round(P.loan.bal),weekly:Math.round(P.loan.amt/52+P.loan.bal*P.loan.rate)}:null,
    inv:P.inv?{share:P.inv.share,want:wants.n,d:wants.d,ok:wants.ok(S,P),trust:Math.round(P.inv.trust),buyout:Math.round(P.inv.paid*1.4)}:null};
};
E.takeLoan=function(S,k){
  var P=S.promos[S.player],T=LOANT[k];if(!S.owner.me)return {ok:false,text:'Only an owner can borrow for the company.'};
  if(!T)return {ok:false,text:'Pick a loan.'};if(P.loan)return {ok:false,text:'You already have a loan. Pay it off first.'};
  var amt=Math.round(P.inc0*T.mult);P.cash+=amt;P.loan={amt:amt,bal:amt,rate:T.rate};
  news(S,'money','You borrowed '+money(amt)+' from the bank.');
  return {ok:true,text:'The bank lends '+money(amt)+'. It comes back over a year, at about '+money(Math.round(amt/52+amt*T.rate))+' a week with interest.'};
};
E.repayLoan=function(S){
  var P=S.promos[S.player];if(!P.loan)return {ok:false,text:'You have no loan.'};
  var due=Math.round(P.loan.bal);if(P.cash<due)return {ok:false,text:'You need '+money(due)+' in the bank to clear it.'};
  P.cash-=due;P.loan=null;news(S,'money','You paid off the bank loan early.');return {ok:true,text:'The loan is paid off.'};
};
E.sellShare=function(S){
  var P=S.promos[S.player],o=E.investorOffer(S);if(!S.owner.me)return {ok:false,text:'Only an owner can sell a share.'};
  if(P.inv)return {ok:false,text:'You already have an investor.'};
  var want=pick(S,Object.keys(INVWANT));P.cash+=o.amt;P.inv={share:o.share,want:want,trust:60,paid:o.amt};
  news(S,'money','An investor bought '+Math.round(o.share*100)+'% of '+P.name+' for '+money(o.amt)+'.');
  return {ok:true,text:'The investor puts in '+money(o.amt)+' and takes '+Math.round(o.share*100)+'% of every profit. They '+INVWANT[want].n+': '+INVWANT[want].d};
};
E.buyOutInvestor=function(S){
  var P=S.promos[S.player];if(!P.inv)return {ok:false,text:'There is no investor.'};
  var due=Math.round(P.inv.paid*1.4);if(P.cash<due)return {ok:false,text:'Buying them out costs '+money(due)+'.'};
  P.cash-=due;P.inv=null;news(S,'money','You bought your investor out.');return {ok:true,text:'The investor is gone and the company is yours again.'};
};
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player],iv=P.inv;if(!iv)return;
  var W=INVWANT[iv.want];iv.trust=clamp(iv.trust+(W.ok(S,P)?1:-2),0,100);
  if(iv.trust<=25&&!S.inbox.some(function(e){return e.type==='investor'&&!e.done;})&&(iv.at==null||S.week-iv.at>=8)){
    iv.at=S.week;
    pushEv(S,{type:'investor',text:'Your investor is losing patience. They '+W.n+', and they say the product is not there. They would like it fixed, or to talk about being bought out.',
      choices:[W.fix?'Give in: change the product to suit them':'Promise to cut the payroll','Buy them out for '+money(Math.round(iv.paid*1.4)),'Hold your ground']});
  }
});
EVR.investor=function(S,ev,choice,P){
  var iv=P.inv;if(!iv)return 'The investor is already gone.';var W=INVWANT[iv.want];
  if(choice===0){if(W.fix)W.fix(S,P);iv.trust=clamp(iv.trust+25,0,100);return W.fix?'You changed the product to suit them. The investor is content for now.':'You promised to trim the payroll. The investor will be watching the numbers.';}
  if(choice===1){var r=E.buyOutInvestor(S);return r.text;}
  iv.trust=clamp(iv.trust-10,0,100);S.owner.trust=clamp(S.owner.trust-2,0,100);P.image=clamp(P.image-0.3,0,100);
  return 'You told them no. The investor leaks their side to the press, and the company looks a little less steady.';
};
E.LOANT=LOANT;

/* ---------- 56. Licensing: toys, trading cards and a video game (P.lic), paid once a year, wanting stars on long contracts ---------- */
var LICK={
  toys:{n:'Toys',partner:'Tinplate Toys',need:40,stars:3,pay:0.4,d:'Figures and playsets. The easiest to land.'},
  cards:{n:'Trading cards',partner:'Pocket Press',need:50,stars:4,pay:0.6,d:'Cards of your roster, a new set every year.'},
  game:{n:'Video game',partner:'Brightline Games',need:65,stars:5,pay:1.5,d:'A game with your roster on the box. The big one.'}
};
function licStars(S,P){return rosterOf(S,P.id).filter(function(w){return !w.nw&&!w.rt&&w.ovr>=Math.max(55,P.image-10)&&w.con>=26;});}
E.LICK=LICK;
E.licensing=function(S){
  var P=S.promos[S.player],st=licStars(S,P);
  return Object.keys(LICK).map(function(k){var L=LICK[k],cur=P.lic&&P.lic[k];
    return {id:k,n:L.n,partner:L.partner,d:L.d,open:P.image>=L.need,need:L.need,stars:L.stars,have:st.length,
      signed:!!cur,since:cur?cur.since:null,next:cur?cur.next-S.week:null,last:cur?cur.last:0,pay:Math.round(P.inc0*L.pay*Math.min(1.3,0.7+st.length*0.1))};});
};
E.signLicense=function(S,k){
  var P=S.promos[S.player],L=LICK[k],i=E.licensing(S).filter(function(x){return x.id===k;})[0];
  if(!L)return {ok:false,text:'Pick a deal.'};if(!i.open)return {ok:false,text:L.partner+' will not call until your popularity reaches '+L.need+'.'};
  if(i.signed)return {ok:false,text:'That deal is already signed.'};
  if(i.have<L.stars)return {ok:false,text:L.partner+' wants '+L.stars+' stars on contracts of at least 26 weeks. You have '+i.have+'.'};
  (P.lic||(P.lic={}))[k]={since:S.week,next:S.week+52,miss:0,last:0};
  news(S,'money',L.partner+' signed a licensing deal with '+P.name+': '+L.n.toLowerCase()+'.');
  return {ok:true,text:L.partner+' signs on for '+L.n.toLowerCase()+'. They pay once a year, about '+money(i.pay)+', and they want '+L.stars+' stars on long contracts for as long as the deal runs.'};
};
E.dropLicense=function(S,k){var P=S.promos[S.player];if(!P.lic||!P.lic[k])return {ok:false,text:'There is no such deal.'};delete P.lic[k];return {ok:true,text:'The '+LICK[k].n.toLowerCase()+' deal is ended.'};};
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];if(!P.lic)return;
  Object.keys(P.lic).forEach(function(k){
    var c=P.lic[k],L=LICK[k];if(S.week<c.next)return;
    var st=licStars(S,P),full=Math.round(P.inc0*L.pay*Math.min(1.3,0.7+st.length*0.1)),ok=st.length>=L.stars,pay=ok?full:Math.round(full*0.5);
    P.led.bonus+=pay;c.last=pay;c.next=S.week+52;
    if(ok){c.miss=0;news(S,'money',L.partner+' paid '+money(pay)+' for the year.');}
    else{c.miss++;news(S,'money',L.partner+' paid half ('+money(pay)+'): not enough stars on long contracts.'+(c.miss>=2?' They are ending the deal.':''));if(c.miss>=2)delete P.lic[k];}
  });
});

/* ---------- 58. Department budgets: a monthly limit for talent, production, travel and promotion, with a warning when one runs over (P.bud) ---------- */
var DEPT={
  talent:{n:'Talent',get:function(r){return r.wages;}},
  prod:{n:'Production',get:function(r){return r.prod;}},
  travel:{n:'Travel',get:function(r){return r.trv||0;}},
  promo:{n:'Promotion',get:function(r){return r.adv||0;}}
};
function deptSpent(P,k,weeks){var h=P.hist.slice(-weeks),t=0;h.forEach(function(r){t+=DEPT[k].get(r);});return t;}
E.DEPT=Object.keys(DEPT).map(function(k){return {id:k,n:DEPT[k].n};});
E.budgets=function(S){
  var P=S.promos[S.player],B=P.bud||{};
  return Object.keys(DEPT).map(function(k){
    var run=Math.round(deptSpent(P,k,4)/Math.max(1,Math.min(4,P.hist.length))*4),lim=B[k]==null?null:B[k];
    return {id:k,n:DEPT[k].n,month:Math.round(deptSpent(P,k,4)),run:run,limit:lim,over:lim!=null&&deptSpent(P,k,4)>lim,pct:lim?Math.round(deptSpent(P,k,4)/lim*100):null};
  });
};
E.setBudget=function(S,k,mult){
  var P=S.promos[S.player];if(!DEPT[k])return {ok:false,text:'Pick a department.'};
  var b=E.budgets(S).filter(function(x){return x.id===k;})[0];
  P.bud=P.bud||{};
  if(!mult){P.bud[k]=null;return {ok:true,text:b.n+' has no monthly limit.'};}
  if(!b.run)return {ok:false,text:b.n+' costs nothing at the moment, so there is nothing to limit.'};
  P.bud[k]=Math.round(b.run*mult/1000)*1000;
  return {ok:true,text:b.n+' is limited to '+money(P.bud[k])+' a month.'};
};
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];if(!P.bud||P.hist.length<4)return;
  var m=Math.floor(S.week/4);P.budWarn=P.budWarn||{};
  E.budgets(S).forEach(function(b){
    if(b.over&&P.budWarn[b.id]!==m){P.budWarn[b.id]=m;news(S,'money',b.n+' is over budget: '+money(b.month)+' in the last four weeks against '+money(b.limit)+'.');}
  });
});

/* ===== 89-regions.js ===== */
/* ---------- regions: where the world likes what ---------- */

/* ---------- 55. Tours abroad (P.tour) and the regions' tastes; 64 extends the tastes to the home region ---------- */
var REGIONS=[
  {id:'iron',n:'the Iron Coast',taste:'brawl',d:'Dockworkers and mill towns. They come for a fight.'},
  {id:'garden',n:'the Garden Cities',taste:'spectacle',d:'Big halls and bigger entrances.'},
  {id:'reach',n:'the Eastern Reach',taste:'work',d:'Students of the sport. They count the holds.'},
  {id:'high',n:'the Highlands',taste:'brawl',d:'Hard people who like it hard.'},
  {id:'isles',n:'the Sunlit Isles',taste:'spectacle',d:'Colour, noise and flyers.'}
];
var TASTEN={brawl:'brawling',work:'work rate',spectacle:'spectacle'};
function homeReg(P){return hash('reg'+P.id)%REGIONS.length;}
E.REGIONS=REGIONS;E.TASTEN=TASTEN;
E.homeRegion=function(S){var P=S.promos[S.player];return REGIONS[homeReg(P)];};
function tourCost(P,weeks){return Math.round(P.inc0*(0.02+0.025*weeks)*(1-TRV_R[P.trv||0]*0.5));}
function tourBoost(S,P){
  if(!P.tour)return 1;var f=(P.fol&&P.fol[P.tour.reg])||0;
  return 1.3+f/250;
}
E.tourInfo=function(S){
  var P=S.promos[S.player],home=homeReg(P);
  return {tour:P.tour?{reg:REGIONS[P.tour.reg],left:P.tour.left,weeks:P.tour.weeks,earned:Math.round(P.tour.earned||0)}:null,
    options:REGIONS.map(function(r,i){return {id:i,reg:r,home:i===home,fol:Math.round((P.fol&&P.fol[i])||0),cost2:tourCost(P,2),cost3:tourCost(P,3)};}).filter(function(o){return !o.home;}),
    follow:REGIONS.map(function(r,i){return {reg:r,fol:Math.round((P.fol&&P.fol[i])||0)};}).filter(function(o){return o.fol>=1;})};
};
E.startTour=function(S,reg,weeks){
  var P=S.promos[S.player],r=REGIONS[reg];if(!r||reg===homeReg(P))return {ok:false,text:'Pick a region away from home.'};
  if(P.tour)return {ok:false,text:'You are already on tour.'};
  if(weeks!==2&&weeks!==3)return {ok:false,text:'A tour is two or three weeks.'};
  if(S.week-(P.tourEnd||-99)<8)return {ok:false,text:'The roster needs eight weeks at home first.'};
  var c=tourCost(P,weeks);if(P.cash<c)return {ok:false,text:'A '+weeks+'-week tour costs '+money(c)+' up front.'};
  P.cash-=c;P.tour={reg:reg,left:weeks,weeks:weeks,earned:0,start:S.week};
  news(S,'story',P.name+' set out on a '+weeks+'-week tour of '+r.n+'.');
  return {ok:true,text:'The tour of '+r.n+' starts now and lasts '+weeks+' weeks. It cost '+money(c)+'. Crowds will be bigger. The roster will be worn out by the end.'};
};
/* a tour brings bigger crowds, and wears the whole roster down */
WEEKX.push(function(S){
  if(S.cal)return;var P=S.promos[S.player];
  P.fol=P.fol||{};Object.keys(P.fol).forEach(function(k){P.fol[k]=Math.max(0,P.fol[k]-0.4);});
  if(!P.tour)return;
  var T=P.tour,last=P.hist[P.hist.length-1];if(last)T.earned+=last.gate*0.3;
  rosterOf(S,P.id).forEach(function(w){if(!w.nw)w.rd=clamp((w.rd||0)+10,0,100);});
  var good=P.last&&P.last.rating>=70;
  P.fol[T.reg]=clamp((P.fol[T.reg]||0)+(good?6:2),0,100);
  T.left--;
  if(T.left<=0){
    news(S,'story',P.name+' came home from '+REGIONS[T.reg].n+' with a following of '+Math.round(P.fol[T.reg])+'.');
    P.tour=null;P.tourEnd=S.week;
  }
});
/* each region has a taste, and the wrong product plays flat there */
function tasteVal(taste,ws,stips){
  if(!ws.length)return 0;
  if(taste==='brawl')return (avg(ws.map(function(w){return w.brawl;}))-74)/10+(stips.filter(function(s){return s==='hardcore'||s==='cage'||s==='tables';}).length?0.3:0);
  if(taste==='work')return (avg(ws.map(workRate))-74)/10;
  return (avg(ws.map(function(w){return w.sq;}))-76)/10+(stips.filter(function(s){return s==='ladder'||s==='mask'||s==='hair';}).length?0.3:0);
}
/* the advertised card meets the region's taste: a smaller or bigger house */
function tasteFit(S,P,card){
  var reg=P.tour?REGIONS[P.tour.reg]:REGIONS[homeReg(P)],ids={},ws=[],stips=[];
  card.forEach(function(m){stips.push(m.stip||'std');m.sides.forEach(function(s){s.forEach(function(id){if(id!=null&&S.w[id]&&!ids[id]){ids[id]=1;ws.push(S.w[id]);}});});});
  return {reg:reg,fit:clamp(tasteVal(reg.taste,ws,stips),-1,1)};
}
function tasteDraw(S,P,card,rep){
  var f=tasteFit(S,P,card);
  if(Math.abs(f.fit)>=0.5)(rep.quest=rep.quest||[]).push((P.tour?'On tour, ':'At home, ')+f.reg.n+' '+(f.fit>0?'got the '+TASTEN[f.reg.taste]+' it likes, and the house was a little bigger.':'wanted '+TASTEN[f.reg.taste]+' and did not get enough of it, and the house was a little smaller.'));
  return 1+0.06*f.fit;
}
/* for the booking screen: what the region will make of this card */
E.tasteForecast=function(S,card){
  var P=S.promos[S.player],f=tasteFit(S,P,card);
  return {region:f.reg,fit:f.fit,text:(P.tour?'On tour in ':'At home in ')+f.reg.n+', where they like '+TASTEN[f.reg.taste]+': '+(f.fit>=0.5?'this card suits them. Expect a bigger house.':(f.fit<=-0.5?'this card is short of it. Expect a smaller house.':'this card is about right.'))};
};
CRX.push(function(ctx){
  var P=ctx.P;if(!ctx.isPl||ctx.S.cal)return null;
  var home=!P.tour,k=home?0.7:1,t=(home?REGIONS[homeReg(P)]:REGIONS[P.tour.reg]).taste,all=ctx.all,d=0,x=null;
  if(t==='brawl'){var b=avg(all.map(function(w){return w.brawl;}));if(b>=62||ctx.stip==='hardcore'||ctx.stip==='cage'){d=1.5;x='A brawl, and this region likes a brawl';}else if(b<=48){d=-1.5;x='Too gentle for a region that likes a fight';}}
  else if(t==='work'){var wk=avg(all.map(workRate));if(wk>=65){d=1.5;x='Fine wrestling for a region that counts the holds';}else if(wk<50){d=-1.5;x='Sloppy work in front of a region that notices';}}
  else{var sq=avg(all.map(function(w){return w.sq;}));if(sq>=65||ctx.stip==='ladder'){d=1.5;x='Spectacle, and this region came for spectacle';}else if(sq<=45){d=-1.5;x='Plain stuff for a region that wants spectacle';}}
  return d?{d:d*k,x:x}:null;
});

/* ---------- 59 (continued): what the rival owners say about you, by temperament ---------- */
WEEKX.push(function(S){
  if(S.cal||!chance(S,0.35))return;
  var P=S.promos[S.player],pid=pick(S,S.order.filter(function(id){return id!==P.id;})),RV=S.promos[pid];if(!RV||!RV.owner)return;
  var t=E.temperOf(S,pid),nm=RV.owner.name,up=P.image>RV.image,last=P.last&&P.last.rating>=75,L=null;
  if(t.key==='raider')L=up?nm+' of '+RV.name+' said '+P.name+' has the best roster in the business and is "ripe for the picking".':(chance(S,0.5)?nm+' of '+RV.name+' told a reporter that '+P.name+' is "a company that has had its day".':null);
  else if(t.key==='gentleman')L=(last||(RV.rel||0)>=20)?nm+' of '+RV.name+' tipped a hat to '+P.name+': "Good wrestling is good for all of us."':null;
  else if(t.key==='showman')L=nm+' of '+RV.name+' dared '+P.name+' to put its best against '+RV.name+'’s on one stage, "and let the people decide".';
  else L=chance(S,0.15)?nm+' of '+RV.name+' has still not said a word in public about anyone.':null;
  if(L&&(S.week-(S.talkAt||-99)>=3)){S.talkAt=S.week;news(S,'world',L);}
});

/* ---------- 61. Working agreements: a formal partnership with one rival (S.agree) that can sour ---------- */
/* terms: trades are easier (exchange), top titles are recognised by both (title), and a joint supershow every twelve weeks (show) */
E.agreeOdds=function(S,pid){
  var P=S.promos[S.player],RV=S.promos[pid];if(!RV||pid===P.id)return null;
  return mkCheck(9,[relMod(RV),gapMod(P,RV),temperMod(RV,'show')].concat(skillMods(S,'talk')));
};
E.agreeCan=function(S,pid){
  var P=S.promos[S.player],RV=S.promos[pid];
  if(S.agree)return 'You already have a working agreement with '+S.promos[S.agree.with].name+'.';
  if((RV.rel||0)<30)return RV.name+' does not know you well enough yet. Relations must reach 30.';
  if(RV.image-P.image>25)return RV.name+' is too big to sit down with you yet.';
  if(RV.agAsk&&S.week-RV.agAsk<8)return RV.name+' will not take another meeting until '+cal(RV.agAsk+8).label+'.';
  return null;
};
E.agreePropose=function(S,pid){
  var why=E.agreeCan(S,pid);if(why)return {ok:false,text:why};
  var RV=S.promos[pid],r=rollCheck(S,E.agreeOdds(S,pid));RV.agAsk=S.week;
  if(!r.ok){RV.rel=clamp((RV.rel||0)-3,-100,100);return {ok:false,text:rollText(r)+RV.name+' wants to think about it.'};}
  S.agree={with:pid,since:S.week,next:S.week+12,trouble:0};
  news(S,'world',S.promos[S.player].name+' and '+RV.name+' signed a working agreement.');
  return {ok:true,text:rollText(r)+'You and '+RV.name+' are partners. Trades are easier, your top titles are recognised by both, and a joint supershow runs every twelve weeks.'};
};
E.agreeEnd=function(S){var A=S.agree;if(!A)return {ok:false,text:'There is no agreement.'};var RV=S.promos[A.with];RV.rel=clamp((RV.rel||0)-10,-100,100);S.agree=null;news(S,'world',S.promos[S.player].name+' ended the working agreement with '+RV.name+'.');return {ok:true,text:'The agreement is over. '+RV.name+' is not pleased.'};};
E.agreement=function(S){
  var A=S.agree;if(!A)return null;var RV=S.promos[A.with];
  return {with:RV,rel:Math.round(RV.rel||0),since:A.since,next:Math.max(0,A.next-S.week),trouble:A.trouble};
};
WEEKX.push(function(S){
  var A=S.agree;if(S.cal||!A)return;
  var P=S.promos[S.player],RV=S.promos[A.with];
  // a recognised title lifts both companies' top titles a little
  [P,RV].forEach(function(Q){var t=Q.titles.filter(function(x){return !x.tag&&x.lvl>=3;})[0];if(t&&t.prestige<90)t.prestige=Math.min(90,t.prestige+0.15);});
  // the joint show
  if(S.week>=A.next&&!E.xfState(S)&&!E.xfCan(S,A.with)){A.next=S.week+12;startXf(S,A.with,'super');news(S,'world','The joint supershow with '+RV.name+' is on, as agreed.');}
  // partners fall out over time: the incident is more likely with a raider
  var p=({raider:0.05,gentleman:0.01,hermit:0.02,showman:0.03})[E.temperOf(S,A.with).key]||0.02;
  if(chance(S,p)&&!S.inbox.some(function(e){return e.type==='agreetrouble'&&!e.done;})){
    var o=RV.owner&&RV.owner.name?RV.owner.name:'Their owner',cost=Math.round(P.inc0*0.3);
    A.trouble++;pushEv(S,{type:'agreetrouble',text:o+' of '+RV.name+' is angry: one of their stars was sent home early from your show and no one told them. The agreement is at risk.',
      choices:['Send a gift and an apology: '+money(cost),'Say it was a mistake (an attempt)','End the agreement'],cost:cost,checks:{1:mkCheck(7,[relMod(RV),trustMod(S)].concat(skillMods(S,'talk')))}});
  }
  if((RV.rel||0)<0&&A.trouble>=2){S.agree=null;news(S,'world','The working agreement with '+RV.name+' collapsed.');}
});
EVR.agreetrouble=function(S,ev,choice,P){
  var A=S.agree;if(!A)return 'The agreement is already over.';var RV=S.promos[A.with];
  if(choice===0){if(P.cash<ev.cost){RV.rel=clamp((RV.rel||0)-6,-100,100);return 'You cannot afford the gift. '+RV.name+' takes that badly.';}P.cash-=ev.cost;RV.rel=clamp((RV.rel||0)+12,-100,100);A.trouble=Math.max(0,A.trouble-1);return 'The gift and the apology work. '+RV.name+' is back on side.';}
  if(choice===1){var r=rollCheck(S,ev.checks[1]);ev.roll=r;if(r.ok){RV.rel=clamp((RV.rel||0)+4,-100,100);return rollText(r)+RV.name+' accepts the explanation.';}RV.rel=clamp((RV.rel||0)-12,-100,100);return rollText(r)+RV.name+' does not believe it. Relations take a hit.';}
  return E.agreeEnd(S).text;
};
CRX.push(function(ctx){
  var A=ctx.S.agree;if(!A||!ctx.isPl||!ctx.t||ctx.t.lvl<3||ctx.S.cal)return null;
  return {d:1,x:'The title is recognised by both companies'};
});

/* ---------- 62. Rivals can die: a broke rival folds or is bought; its roster floods the free agents, its titles and tape go on sale (S.sale) ---------- */
function retireCompany(S,pid,buyerId){
  var P=S.promos[pid],buyer=buyerId?S.promos[buyerId]:null,R=rosterOf(S,pid).filter(function(w){return !w.nw;}).sort(function(a,b){return b.ovr-a.ovr;});
  // the biggest names go to the buyer, if there is one; everyone else is a free agent
  var keep=buyer?Math.ceil(R.length*0.4):0;
  R.forEach(function(w,i){
    leaveCompany(S,w,buyer&&i<keep?'moved to '+buyer.name:'company folded',true);
    if(buyer&&i<keep)joinCompany(S,w,buyer);
    else{w.promo='FA';w.brand=null;w.cut={w:S.week,from:pid,img:P.image};}
  });
  rosterOf(S,pid).forEach(function(w){w.promo='FA';w.brand=null;});   // staff and anyone left
  var tit=P.titles.filter(function(t){return !t.tag;}).sort(function(a,b){return b.prestige-a.prestige;});
  if(buyer&&tit[0]){var c=JSON.parse(JSON.stringify(tit[0]));c.holders=[];c.since=S.week;c.id='x'+S.nid++;c.name=tit[0].name;buyer.titles.push(c);}
  else tit.slice(0,2).forEach(function(t){(S.sale=S.sale||[]).push({id:S.nid++,kind:'title',from:pid,fromName:P.name,name:t.name,g:t.g,lvl:t.lvl,tag:!!t.tag,prestige:Math.round(t.prestige),price:Math.round(S.promos[S.player].inc0*0.6*Math.max(0.3,t.prestige/50)),until:S.week+12});});
  var tv=Math.round(P.inc0*0.05*18);
  if(!buyer)(S.sale=S.sale||[]).push({id:S.nid++,kind:'tape',from:pid,fromName:P.name,name:'The '+P.name+' library',value:tv,price:Math.round(tv*0.4),until:S.week+12});
  S.feuds.forEach(function(f){if(!f.res&&f.promo===pid){f.res=true;f.dead=true;f.end=S.week;}});
  S.order=S.order.filter(function(id){return id!==pid;});P.dead=S.week;
  if(S.agree&&S.agree.with===pid)S.agree=null;
  if(S.xf&&S.xf.with===pid)S.xf=null;
  news(S,'world',buyer?buyer.name+' bought '+P.name+'. Its best names move over, and the rest are on the market.':P.name+' has folded. Its roster is on the market, and its titles and tapes are up for sale.');
}
WEEKX.push(function(S){
  if(S.cal||S.week%4||S.order.length<=4)return;
  S.order.forEach(function(pid){
    var P=S.promos[pid];if(pid===S.player||P.dead||P.cash>=0||(P.neg||0)<16||P.image>=45||!chance(S,0.2))return;
    var rich=S.order.filter(function(id){return id!==pid&&id!==S.player&&S.promos[id].cash>S.promos[id].inc0*10&&S.promos[id].image>P.image;}).sort(function(a,b){return S.promos[b].cash-S.promos[a].cash;})[0];
    retireCompany(S,pid,rich&&chance(S,0.55)?rich:null);
  });
  S.sale=(S.sale||[]).filter(function(l){return S.week<=l.until;});
});
E.forSale=function(S){return (S.sale||[]).filter(function(l){return S.week<=l.until;}).map(function(l){return {id:l.id,kind:l.kind,name:l.name,from:l.fromName,price:l.price,left:l.until-S.week,note:l.kind==='title'?'A '+(l.g==='F'?'women’s ':'')+'title with prestige '+l.prestige+' and no champion.':'About '+money(l.value)+' of back catalogue.'};});};
E.buyLot=function(S,id){
  var P=S.promos[S.player],i=(S.sale||[]).findIndex(function(l){return l.id===id;}),l=S.sale[i];
  if(!l||S.week>l.until)return {ok:false,text:'That lot is gone.'};
  if(!S.owner.me)return {ok:false,text:'Only an owner can buy a company’s belongings.'};
  if(P.cash<l.price)return {ok:false,text:'It costs '+money(l.price)+'.'};
  P.cash-=l.price;S.sale.splice(i,1);
  if(l.kind==='title'){
    P.titles.push({id:'x'+S.nid++,name:l.name,brand:null,g:l.g,lvl:Math.min(l.lvl,2),tag:l.tag,holders:[],prestige:Math.round(l.prestige*0.7),defs:0,since:S.week,last:S.week,hist:[]});
    news(S,'title','You bought the '+l.name+' from the ruins of '+l.fromName+'. It is vacant.');
    return {ok:true,text:'The '+l.name+' is yours, and vacant. Crown a champion on your next show.'};
  }
  (P.tape||(P.tape=[])).push({w:Math.max(1,S.week-30),n:l.name,r:70,v:l.value});
  news(S,'money','You bought '+l.name+'.');return {ok:true,text:'The library is yours. It is worth about '+money(l.value)+' and earns every week.'};
};

/* ---------- 65. Title histories of the world: partners can unify their top titles (the belt of one absorbs the other and the lineages join) ---------- */
function topTitle(P,g){return P.titles.filter(function(t){return !t.tag&&t.g===g&&t.lvl>=3;}).sort(function(a,b){return b.prestige-a.prestige;})[0]||null;}
E.unifyOptions=function(S){
  var A=S.agree;if(!A)return [];var P=S.promos[S.player],RV=S.promos[A.with],out=[];
  ['M','F'].forEach(function(g){
    var m=topTitle(P,g),t=topTitle(RV,g);if(!m||!t||!m.holders.length)return;
    var ck=mkCheck(9,[relMod(RV),temperMod(RV,'show'),{n:'A working agreement',v:1},{n:'Their belt against yours',v:t.prestige>m.prestige+10?-1:(m.prestige>t.prestige+10?1:0)}].concat(skillMods(S,'talk')));
    out.push({g:g,mine:m,theirs:t,odds:Math.round(ck.p*100),ck:ck});
  });
  return out;
};
E.unify=function(S,g){
  var o=E.unifyOptions(S).filter(function(x){return x.g===g;})[0];if(!o)return {ok:false,text:'There is nothing to unify.'};
  var P=S.promos[S.player],RV=S.promos[S.agree.with],r=rollCheck(S,o.ck);
  if(!r.ok){RV.rel=clamp((RV.rel||0)-6,-100,100);return {ok:false,text:rollText(r)+RV.name+' will not give up its belt.'};}
  var m=o.mine,t=o.theirs;
  // the lineages join, oldest first, with the other company's reigns marked
  var merged=(t.hist||[]).map(function(h){var c=JSON.parse(JSON.stringify(h));c.show=(c.show?c.show+' · ':'')+RV.name;return c;}).concat(m.hist||[]).sort(function(a,b){return a.from-b.from;});
  m.hist=merged.slice(-60);m.prestige=clamp(Math.max(m.prestige,t.prestige)+5,10,100);m.uni=(m.uni||[]).concat([RV.name]);
  t.holders.forEach(function(id){if(S.w[id])S.w[id].lt={n:t.name,id:t.id,w:S.week};});
  RV.titles=RV.titles.filter(function(x){return x!==t;});RV.rel=clamp((RV.rel||0)+5,-100,100);
  news(S,'title','The '+m.name+' and the '+RV.name+' '+t.name+' are unified. '+names(m.holders.map(function(id){return S.w[id];}))+' is the champion of both.');
  return {ok:true,text:rollText(r)+'The belts are unified. The '+m.name+' now carries both lines of champions, and its prestige is up. '+RV.name+' retires its title.'};
};

/* ---------- 67. The rookie class: each year's class, where they came from, a scouting report, and a look back ---------- */
E.classYears=function(S){return Object.keys(S.classes||{}).map(Number).sort(function(a,b){return b-a;});};
E.classReport=function(S,year){
  var ids=(S.classes||{})[year];if(!ids)return null;
  var P=S.promos[S.player],rows=ids.map(function(id){
    var w=S.w[id],n=E.intel(S,id),pr=n.stats.pot,st;
    if(w.promo==='FA')st=w.rt?'Retired':'Still a free agent';else if(w.promo===P.id)st='Signed by you';else st='Signed by '+(S.promos[w.promo]?S.promos[w.promo].name:'another company');
    var champ=false;S.order.forEach(function(pid){S.promos[pid].titles.forEach(function(t){if(t.holders.indexOf(id)>=0)champ=true;});});
    return {w:w,region:REGIONS[w.reg==null?0:w.reg].n,potential:pr.lo===pr.hi?String(pr.lo):pr.lo+'–'+pr.hi,now:Math.round(w.ovr),status:st,champ:champ,sc:!!w.sc};
  }).sort(function(a,b){return b.w.pot-a.w.pot;});
  var mine=rows.filter(function(r){return r.w.promo===P.id;}).length,fa=rows.filter(function(r){return r.w.promo==='FA'&&!r.w.rt;}).length;
  return {year:year,n:rows.length,rows:rows,mine:mine,fa:fa,champs:rows.filter(function(r){return r.champ;}).length,best:rows[0]?rows[0].w:null,
    text:'The class of '+year+': '+rows.length+' rookies, '+fa+' still free agents, '+mine+' with you, '+rows.filter(function(r){return r.champ;}).length+' champions so far.'};
};

/* ===== 90-api.js ===== */
/* ---------- roster moves ---------- */
E.ask=function(S,w){var P=S.promos[S.player],MD=modelOf(P),m=(w.promo==='FA'?1:1.3)*talkDiscount(S);if(w.promo!=='FA'&&S.promos[w.promo].image>P.image+10)m+=0.25;
  if(MD.premium&&w.ovr>P.image+8)m*=MD.premium;                                   // a startup pays over the odds for a name
  if(MD.chip&&w.cut&&S.week-w.cut.w<52&&w.promo==='FA')m*=0.85;                   // a castoff comes cheap to an underdog
  return Math.round(wageFor(w.ovr,P)*m/50)*50;};
E.canSign=function(S,w){var P=S.promos[S.player],MD=modelOf(P);return !(MD.gender&&w.g!==MD.gender)&&w.ovr<=P.image+(MD.reach||25);};
E.signWhy=function(S,w){var P=S.promos[S.player],MD=modelOf(P);return MD.gender&&w.g!==MD.gender?P.name+' is an all-women company.':(E.canSign(S,w)?null:w.name+' is not interested in a promotion your size yet. Raise your popularity first.');};
E.market=function(S){return S.w.filter(function(w){return !w.rt&&(w.promo==='FA'||(w.promo!==S.player&&w.con<=12));});};
E.sign=function(S,id,wage,weeks){
  var w=S.w[id],P=S.promos[S.player];if(!w||w.promo===P.id)return {ok:false,msg:'Not available.'};
  if(w.rt)return {ok:false,msg:w.name+' has retired.'};
  if(w.lock>S.week)return {ok:false,msg:w.name+' will not talk again until '+cal(w.lock).label+'.'};
  if(w.promo!=='FA'&&w.con>12)return {ok:false,msg:w.name+' is under contract.'};
  if(!E.canSign(S,w))return {ok:false,msg:E.signWhy(S,w)};
  if(wagesWeek(S,P)+wage>E.budget(S))return {ok:false,msg:S.owner.name+' will not sign off on that. It would take the wage bill past the '+money(E.budget(S))+' a week budget.'};
  var ask=E.ask(S,w);
  if(wage<ask*0.97){
    if(!w.ctr){w.ctr=true;var ca=Math.round(ask*1.08/50)*50;pushEv(S,{type:'counter',w:w.id,ask:ca,weeks:weeks||48,text:w.name+'\u2019s side did not like your offer, but they have come back with a number: '+money(ca)+' a week.',choices:['Accept at '+money(ca)+' a week','Walk away']});return {ok:false,msg:w.name+' turned that down and sent a counter-offer. It is in your inbox.'};}
    w.lock=S.week+4;return {ok:false,msg:'Talks broke down. '+w.name+' wanted about '+money(ask)+' a week.'};
  }
  var from=w.promo;if(from!=='FA'){S.promos[from].rel=clamp((S.promos[from].rel||0)-12,-100,100);leaveCompany(S,w,'left for '+P.name);}
  joinCompany(S,w,P,wage,weeks||48);
  news(S,'contract',P.name+' signed '+w.name+(from!=='FA'?' away from '+S.promos[from].name:'')+'.');
  award(S,from==='FA'?'ACH_SIGN':'ACH_POACH');
  return {ok:true,msg:w.name+' signs for '+money(wage)+' a week.'};
};
E.release=function(S,id){var w=S.w[id],P=S.promos[S.player];if(!w||w.promo!==P.id)return null;var pay=w.wage*4;P.cash-=pay;if(S.owner.pledge==='stable'){rosterOf(S,P.id).forEach(function(x){x.morale=clamp(x.morale-3,0,100);});S.trust=clamp(S.trust-4,0,100);}leaveCompany(S,w,'released');w.promo='FA';w.brand=null;news(S,'contract',P.name+' released '+w.name+'.');return w.name+' is released. Severance: '+money(pay)+'.';};
E.renew=function(S,id,weeks){var w=S.w[id];if(!w||w.promo!==S.player)return null;var ask=Math.round(renewAsk(S,w)*(weeks>60?1.1:1)/50)*50;w.wage=ask;w.con=weeks;w.cn=false;w.morale=clamp(w.morale+3,0,100);return w.name+' re-signs for '+money(ask)+' a week.';};
E.setBrand=function(S,id,b){var w=S.w[id];if(w&&w.promo===S.player){w.brand=b;var tm=teamOf(S,w);if(tm&&S.w[tm.m[0]].brand!==S.w[tm.m[1]].brand)dissolveTeam(S,tm);}};
E.pushMap=function(S,pid){
  var out={},P=S.promos[pid],groups={};
  rosterOf(S,pid).forEach(function(w){var k=(w.brand||'')+w.g;(groups[k]=groups[k]||[]).push(w);});
  Object.keys(groups).forEach(function(k){var L=groups[k].sort(function(a,b){return b.ovr-a.ovr;}),n=L.length;L.forEach(function(w,i){var f=i/n;out[w.id]=f<0.1?'Main event':(f<0.3?'Upper midcard':(f<0.6?'Midcard':(f<0.85?'Lower midcard':'Opener')));});});
  return out;
};
E.runPlayerShow=function(S,card){
  var P=S.promos[S.player],show=S.queue[S.qi];if(!show||S.over)return {errors:['No show to run.']};
  var v=E.validate(S,card);if(v.errors.length)return {errors:v.errors};
  spendBP(S,card);PREX.forEach(function(fn){fn(S,P,show,card);});
  var key=showKey(S),rep=runShow(S,P,show,JSON.parse(JSON.stringify(card)));if(S.pre&&S.pre.key===key&&S.pre.result)rep.pre=S.pre.result;
  // what the booker did with their action points since the last show goes on the report too
  rep.prep=(S.apLog||[]).filter(function(l){return !l.sh;}).map(function(l){l.sh=1;return {place:l.place,act:l.act,ok:l.ok,msg:l.msg};});S.qi++;S.card=[];return {rep:rep};
};
E.suggest=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?autoBook(S,P,show):[];};
E.validate=function(S,card){var P=S.promos[S.player],show=S.queue[S.qi];if(!show)return {errors:[],warnings:[]};var v=validate(S,P,show,card),c=cardCost(S,card);if(c>S.bp){if(S.owner.me)v.warnings.push('You are '+(c-S.bp)+' booking power over. As the owner you can overrule, but each extra point costs locker-room trust.');else v.errors.push('These calls need '+c+' booking power and you have '+S.bp+'. Let some matches play out.');}return v;};
E.eligible=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?eligible(S,P,show):[];};
E.showTitles=function(S){var P=S.promos[S.player],show=S.queue[S.qi];return show?(show.big?P.titles:showTitles(P,show)):[];};
E.nextBig=function(S){var w=S.week+(4-cal(S.week).wom),c=cal(w);return {week:w,name:dbOf(S).events[c.month]||'the next big show',label:c.label};};
E.expected=function(S,show){return r1(expected(S.promos[S.player],show));};
E.cal=cal;E.workRate=workRate;E.rosterOf=rosterOf;E.teamOf=teamOf;E.partnerOf=partnerOf;E.feudOf=feudOf;E.feudsFor=feudsFor;E.activeFeuds=activeFeuds;E.feudLabel=feudLabel;E.feudStage=feudStage;
E.holdLvl=holdLvl;E.isDev=isDev;E.wageFor=wageFor;E.money=money;E.autoBook=autoBook;E.runShow=runShow;E.weekShows=weekShows;
E.feudAct=feudAct;E.ACTN=ACTN;E.RISKN=RISKN;E.TIXN=TIXN;E.ADVN=ADVN;E.SLOTN=SLOTN;E.PRODN=PRODN;E.SLOT_MAX=SLOT_MAX;
E.MT=MT;E.STIP=STIP;E.ACH=ACH;E.STYLE_NAME=STYLE_NAME;E.MONTHS=MONTHS;

/* ===== 91-wishes-late.js ===== */
/* ---------- depth systems that wrap the player API in 90-api.js ---------- */

/* speaking out: a released wrestler may give an interview. It can sour the room, give away a rival's plans, or settle a score */
(function(){
  var rel=E.release;
  E.release=function(S,id){
    var w=S.w[id],mine=w&&w.promo===S.player&&!w.nw,msg=rel(S,id);
    if(!msg||!mine)return msg;
    var good=w.ovr>=P_img(S)-15&&chance(S,0.6);if(!good)return msg;
    var kind=pick(S,['bitter','rival','score']),P=S.promos[S.player],R=rosterOf(S,P.id).filter(function(x){return !x.nw;}),line='';
    if(kind==='bitter'){R.forEach(function(x){x.morale=clamp(x.morale-2,0,100);});line=w.name+' gave an interview calling the way they were let go “a disgrace”. The room does not enjoy reading it.';}
    else if(kind==='rival'){var rv=S.order.filter(function(o){return o!==S.player;}),rp=S.promos[pick(S,rv)];line=w.name+' told a reporter what they heard on the road: '+rp.name+' is building toward '+E.nextBig(S).name+' and has its eye on your contracts.';rp.rel=clamp((rp.rel||0)-4,-100,100);}
    else{var foe=R.filter(function(x){return chem(S,x.id,w.id)<=-1.5;}).sort(function(a,b){return chem(S,a.id,w.id)-chem(S,b.id,w.id);})[0];
      if(foe){foe.morale=clamp(foe.morale-4,0,100);line=w.name+' used the interview to settle a score with '+foe.name+', and '+foe.name+' is not pleased.';}
      else line=w.name+' thanked the fans and said there were no hard feelings. That is that.';}
    news(S,'story',line);return msg+' '+line;
  };
  function P_img(S){return S.promos[S.player].image;}
})();

/* job offers with terms: ask for a bigger wage budget, more booking power, or one signing of your choice. Asking is an attempt, and a failed ask offends the new owner */
var JOB_TERMS={budget:{n:'A bigger wage budget',d:'Twelve per cent more to spend on contracts.'},freedom:{n:'Creative freedom',d:'Four extra points of booking power to start with.'},signing:{n:'One signing of your choice',d:'The first free agent you sign needs no approval and ignores how big the company is.'}};
E.JOB_TERMS=JOB_TERMS;
function jobCheck(S,terms){var n=terms.length;return mkCheck(4+2*n,[{n:'Booker level '+S.booker.lvl,v:S.booker.lvl>=8?2:(S.booker.lvl>=4?1:0)}].concat(skillMods(S,'talk')));}
E.jobTermsCheck=function(S,terms){return terms&&terms.length?jobCheck(S,terms):null;};
E.applyJobTerms=function(S,terms){
  terms=(terms||[]).filter(function(t){return JOB_TERMS[t];});if(!terms.length)return null;
  var ck=jobCheck(S,terms),r=rollCheck(S,ck);
  if(!r.ok){S.owner.trust=clamp(S.owner.trust-8,0,100);return S.owner.name+' did not like being asked for '+terms.map(function(t){return JOB_TERMS[t].n.toLowerCase();}).join(' and ')+' before you had done a day’s work. You start on the wrong foot.';}
  var out=[];
  terms.forEach(function(t){
    if(t==='budget'){S.owner.wage0=Math.round(S.owner.wage0*1.12);out.push('a wage budget of '+money(E.budget(S))+' a week');}
    else if(t==='freedom'){S.bp+=4;out.push('four extra points of booking power');}
    else if(t==='signing'){S.freeSign=true;out.push('one signing of your choice (see Free agents)');}
  });
  return S.owner.name+' agrees to '+out.join(', ')+'.';
};
(function(){
  var cs=E.canSign,sg=E.sign;
  E.canSign=function(S,w){if(S.freeSign&&w.promo==='FA'&&!w.rt){var MD=modelOf(S.promos[S.player]);return !(MD.gender&&w.g!==MD.gender);}return cs(S,w);};
  E.sign=function(S,id,wage,weeks){var was=S.freeSign,r=sg(S,id,wage,weeks);if(was&&r&&r.ok)S.freeSign=false;return r;};
})();

/* a mask match needs masks, a hair match needs hair that has grown back */
(function(){
  var was=E.validate;
  E.validate=function(S,card){
    var v=was(S,card),cover={};
    card.forEach(function(m,i){
      if(m.agent!=null){cover[m.agent]=(cover[m.agent]||0)+1;if(cover[m.agent]===3)v.errors.push((S.w[m.agent]?S.w[m.agent].name:'The agent')+' can only cover two matches a night.');}
      if(m.stip!=='mask'&&m.stip!=='hair')return;
      var ws=[].concat.apply([],m.sides).filter(function(id){return id!=null&&S.w[id];}).map(function(id){return S.w[id];});
      if(m.stip==='mask'&&ws.some(function(w){return masked(w)!==1;}))v.errors.push('Match '+(i+1)+': a mask match needs everyone in it to wear a mask.');
      if(m.stip==='hair'){var bald=ws.filter(function(w){return w.sh!=null&&S.week-w.sh<20;})[0];if(bald)v.errors.push('Match '+(i+1)+': '+bald.name+' has not grown the hair back yet.');}
    });
    return v;
  };
})();

/* the suggested card for the flagship puts the planned match in the main event */
(function(){
  var was=E.suggest;
  function agents(S,card){
    var ag=E.agents(S).sort(function(x,y){return y.skill-x.skill;});if(!ag.length)return card;
    // the main event and the matches with the most young wrestlers get the agents, two each
    var score=card.map(function(m,i){var ws=[].concat.apply([],m.sides).map(function(id){return S.w[id];}).filter(Boolean);return {i:i,v:(i===card.length-1?3:0)+ws.filter(function(w){return w.age<=26;}).length};}).sort(function(x,y){return y.v-x.v;});
    var k=0;ag.forEach(function(a){for(var n=0;n<2&&k<score.length&&score[k].v>0;n++,k++)card[score[k].i].agent=a.id;});
    return card;
  }
  E.suggest=function(S){return agents(S,suggestPlan(S));};
  function suggestPlan(S){
    var card=was(S),lp=S.lp,show=S.queue&&S.queue[S.qi];
    if(!lp||!show||!show.big||!show.flag||S.cal||!card.length)return card;
    var a=S.w[lp.a],b=S.w[lp.b];if(!a||!b||a.inj>0||b.inj>0||a.away>=S.week||b.away>=S.week||a.rest===S.week||b.rest===S.week)return card;
    var rest=card.filter(function(m){var ids=[].concat.apply([],m.sides);return ids.indexOf(lp.a)<0&&ids.indexOf(lp.b)<0;});
    var tt=lp.title&&titleById(S.promos[S.player],lp.title);
    var mm={mt:'1v1',sides:[[lp.a],[lp.b]],stip:'std',len:'L',title:tt&&tt.holders.length&&(tt.holders.indexOf(lp.a)>=0||tt.holders.indexOf(lp.b)>=0)?lp.title:null};
    while(rest.length>=SLOT_MAX[S.promos[S.player].slot]+(show.big?3:0)&&rest.length>3)rest.shift();
    rest.push(mm);return rest;
  }
})();

root.GP=E;
})(typeof window !== 'undefined' ? window : globalThis);
