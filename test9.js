const fs=require('fs');require('./engine.js');
const E=globalThis.GP;
const pkg=JSON.parse(fs.readFileSync('universes/public_domain.json','utf8'));
function play(pid,seed,weeks,rules,label,opts){
  E.useUniverse(pkg);const S=E.newGame(pid,seed,Object.assign({name:'R'},opts||{}));pid=S.player;const P=S.promos[pid];
  let errs=0,rs=[],st={ap:{},apFail:0,court:{},chaos:{},ev:{},full:{}};
  const hr=rules.map(k=>E.setHouse(S,k));
  for(let wk=0;wk<weeks&&!S.over;wk++){
    S.inbox.filter(e=>!e.done).forEach(e=>{st.ev[e.type]=(st.ev[e.type]||0)+1;E.resolveEvent(S,e.id,e.type==='handover'?0:(['mutiny','netmeet','break'].includes(e.type)?wk%3:1));});
    if(S.owner.pending)E.setCreed(S,{style:'merit',roots:'tradition',pledge:'stable'});
    // spend the action points
    const B=E.backstage(S),R=E.rosterOf(S,pid).filter(w=>!w.nw&&w.inj<=0&&!w.camp);
    const cases=E.court(S);
    cases.forEach((c,i)=>{ if(i===0){const backA=c.ev.filter(e=>e.backs===S.w[c.a].name).length;const v=wk%5===4?2:(wk%7===6?3:(backA>=2?0:1));const r=E.apDo(S,'court','case',{cid:c.id,v});const kk=r.done?(r.fair===true?'fair':(r.fair===false?'unfair':'other')):'refused';st.court[kk]=(st.court[kk]||0)+1;}
      else if(c.leader){const r=E.courtDelegate(S,c.id);st.court.deleg=(st.court.deleg||0)+1;} });
    const tries=[['office',B.places[0].acts[wk%B.places[0].acts.length].id,{}],['trainer','treat',{a:R.slice().sort((a,b)=>Math.max(...E.zones(S,b.id).map(z=>z.v))-Math.max(...E.zones(S,a.id).map(z=>z.v)))[0].id}],['gym',wk%2?'drill':'class',{a:R[0].id,b:R[1].id}],['catering',wk%2?'rounds':'pep',{}],['lot','attack',{a:R[2+wk%5].id,b:(R.filter(w=>w.g===R[2+wk%5].g&&w.id!==R[2+wk%5].id)[wk%7]||R[0]).id}],['truck',wk%2?'meet':'hype',{}]];
    for(let k=0;k<tries.length;k++){const t=tries[(k+wk)%tries.length];const r=E.apDo(S,t[0],t[1],t[2]);if(r.msg&&/NaN|undefined/.test(r.msg))console.log('  BAD MSG',r.msg);if(r.done)st.ap[t[0]+'.'+t[1]]=(st.ap[t[0]+'.'+t[1]]||0)+1;else st.apFail++;}
    while(S.qi<S.queue.length){
      const card=E.suggest(S);const pr=E.preShow(S,card);if(pr)E.resolvePre(S,card,0);
      const vv=E.validate(S,card);if(vv.errors.length){errs++;if(errs<3)console.log('  VALIDATION',S.week,vv.errors.slice(0,2));S.qi++;continue;}
      const ch=E.chaos(S,card);if(ch){const c=(wk+S.qi)%ch.choices.length;const res=E.resolveChaos(S,card,c);st.chaos[ch.type+c]=(st.chaos[ch.type+c]||0)+1;if(/NaN|undefined/.test(res+ch.text+ch.choices.join()))console.log('  BAD CHAOS',ch.text,res);}
      const r=E.runPlayerShow(S,card);if(r.errors){errs++;console.log('  RUN ERR',r.errors);S.qi++;continue;}rs.push(r.rep.rating-r.rep.exp);
    }
    E.endWeek(S);
    E.clocks(S).forEach(c=>{if(!isFinite(c.v))console.log('  BAD CLOCK',c);});
  }
  const bad=S.w.filter(w=>[w.ovr,w.cond,w.morale,w.mom,w.stress||0].some(x=>!isFinite(x)));
  console.log(label,'wk',S.week,'over',JSON.stringify(S.over),'img',P.image0,'->',P.image.toFixed(1),'cash',(P.cash/1e6).toFixed(1)+'M','r-exp',(rs.reduce((a,b)=>a+b,0)/rs.length).toFixed(2),'errs',errs,'NaN',bad.length,'trust',Math.round(S.trust),'owner',Math.round(S.owner.trust),'slot',P.slot,'feuds',E.activeFeuds(S).filter(f=>f.promo===pid).length);
  console.log('   house',JSON.stringify(hr.map(r=>r.ok)),S.house.on.join(','),'| ap',JSON.stringify(st.ap),'refused',st.apFail,'| court',JSON.stringify(st.court),'open',S.court.length);
  console.log('   chaos',JSON.stringify(st.chaos),'| events',JSON.stringify(st.ev));
  console.log('   clocks',E.clocks(S).map(c=>c.n+' '+c.v+'/'+c.segs+' ('+c.why+')').join(' | '));
  console.log('   news',S.news.filter(n=>/hot streak|has arrived|seen this act|meeting without|court|promise to the network|thirty-day|withheld/i.test(n.t)).slice(0,6).map(n=>n.w+': '+n.t).join(' || '));
  return S;
}
const W=+process.argv[2]||60;
play('pdw',5,W,[],'PDW none   ');
play('pdw',5,W,['clean','def4'],'PDW clean+def');
play('pdw',6,W,['ranked','iron'],'PDW ranked+iron');
play('ttt',7,W,['kayfabe','bonus'],'TTT kayf+bonus');
play('whw',8,W,['curfew','youth','senior'],'WHW curfew+youth(+senior refused)');
play('ocw',9,W,['open','senior'],'OCW open+senior');
const S=play(null,11,W,['youth','bonus','iron'],'OWN fed',{fed:{name:'Test Fed',short:'TF',show:'TF TV',title:'World',size:'regional',region:'midwest',style:'merit',roots:'tradition',pledge:'chance',women:true}});
console.log(JSON.stringify(E.backstage(S).places.map(p=>p.id+':'+p.acts.map(a=>a.id).join('/'))));
console.log(JSON.stringify(E.houseInfo(S)).slice(0,300));
