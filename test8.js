const fs=require('fs');require('./engine.js');
const E=globalThis.GP;
const pkg=JSON.parse(fs.readFileSync('universes/public_domain.json','utf8'));
function play(pid,seed,weeks,mode,label){
  E.useUniverse(pkg);const S=E.newGame(pid,seed,{name:'R'});const P=S.promos[pid];
  let errs=0,rs=[],acts={rest:0,hurt:0,ment:0,word:[]};
  const pct=(a,p)=>{a=a.slice().sort((x,y)=>x-y);return a.length?Math.round(a[Math.floor((a.length-1)*p)]):'-';};
  for(let wk=0;wk<weeks&&!S.over;wk++){
    S.inbox.filter(e=>!e.done).forEach(e=>E.resolveEvent(S,e.id,e.type==='handover'?0:(e.type==='break'?wk%3:1)));
    if(S.owner.pending)E.setCreed(S,{style:'merit',roots:'tradition',pledge:'stable'});
    const R=E.rosterOf(S,pid);
    if(mode!=='plain'){
      R.forEach(w=>{const z=E.zones(S,w.id);if(Math.max(...z.map(x=>x.v))>=70&&w.inj<=0&&w.rest!==S.week){E.rest(S,w.id);acts.rest++;}
        if(E.workHurtOk(S,w.id)&&wk%4===0){E.workHurt(S,w.id);acts.hurt++;}
        if(w.ment==null){const ms=E.mentorsFor(S,w.id);if(ms.length){E.setMentor(S,w.id,ms[0].id);acts.ment++;}}
        if((w.role==='toxic'||w.role==='diva')&&wk%9===3){const was=w.role;const r=E.haveWord(S,w.id);if(r&&r.roll)acts.word.push((r.ok?'Y':'N')+was);}});
    }
    while(S.qi<S.queue.length){
      const card=E.suggest(S);const pr=E.preShow(S,card);if(pr)E.resolvePre(S,card,0);
      if(mode==='brutal')card.forEach((m,i)=>{m.int='brutal';if(i===card.length-1&&S.queue[S.qi].big)m.stip='ladder';});
      if(mode==='mixed')card.forEach((m,i)=>{m.int=i===card.length-1&&S.queue[S.qi].big?'brutal':(i===0?'safe':'normal');});
      const vv=E.validate(S,card);if(vv.errors.length){errs++;if(errs<3)console.log('  VALIDATION',S.week,vv.errors.slice(0,2));S.qi++;continue;}
      const r=E.runPlayerShow(S,card);rs.push(r.rep.rating-r.rep.exp);
    }
    E.endWeek(S);
  }
  const R=E.rosterOf(S,pid).filter(w=>!w.nw),egos=R.map(w=>E.ego(S,w.id));
  const zs=k=>R.map(w=>E.zones(S,w.id).find(z=>z.k===k).v);
  const bad=S.w.filter(w=>[w.ovr,w.cond,w.morale,w.mom,w.stress||0,w.pos==null?0:w.pos,(w.bz||{n:0}).n].some(x=>!isFinite(x)));
  console.log(label,'wk',S.week,'over',JSON.stringify(S.over),'img',P.image0,'->',P.image.toFixed(1),'cash',(P.cash/1e6).toFixed(1)+'M','r-exp',(rs.reduce((a,b)=>a+b,0)/rs.length).toFixed(2),'errs',errs,'NaN',bad.length,'roster',R.length,'trust',Math.round(S.trust));
  console.log('   morale p10/50/90',pct(R.map(w=>w.morale),.1),pct(R.map(w=>w.morale),.5),pct(R.map(w=>w.morale),.9),'| ego sum p10/50/90',pct(egos.map(e=>e.sum),.1),pct(egos.map(e=>e.sum),.5),pct(egos.map(e=>e.sum),.9),'| target p10/50/90',pct(egos.map(e=>e.target),.1),pct(egos.map(e=>e.target),.5),pct(egos.map(e=>e.target),.9),'| stress p50/90/max',pct(R.map(w=>w.stress||0),.5),pct(R.map(w=>w.stress||0),.9),pct(R.map(w=>w.stress||0),1));
  console.log('   zones p50/p90/max neck',pct(zs('n'),.5),pct(zs('n'),.9),pct(zs('n'),1),'shoulders',pct(zs('s'),.5),pct(zs('s'),.9),pct(zs('s'),1),'back',pct(zs('b'),.5),pct(zs('b'),.9),pct(zs('b'),1),'knees',pct(zs('k'),.5),pct(zs('k'),.9),pct(zs('k'),1),'| injured now',R.filter(w=>w.inj>0).length,'| breaks',S.news.filter(n=>/breaking point|no-showed|walked out/.test(n.t)).length,'| injuries in news',S.news.filter(n=>n.k==='injury'&&/injured \(/.test(n.t)&&n.t.indexOf('('+P.name+')')>=0).length);
  console.log('   acts',JSON.stringify(acts),'roles',Object.entries(E.lockerRoom(S).roles).map(([k,v])=>k+':'+v.map(id=>S.w[id].name).join('/')).join(' | '));
  const lines={};egos.forEach(e=>e.lines.forEach(l=>{lines[l.k]=lines[l.k]||[0,0,0];lines[l.k][l.v<0?0:(l.v>0?2:1)]++;}));console.log('   ego lines (-,0,+)',JSON.stringify(lines),'med',P.med,'medcost',E.medInfo(S).cost,'last row med',P.hist[P.hist.length-1].med);
  return S;
}
const W=+process.argv[2]||96;
play('pdw',5,W,'plain','PDW plain ');
const S=play('pdw',5,W,'mixed','PDW mixed ');
play('pdw',5,W,'brutal','PDW brutal');
play('ttt',5,W,'mixed','TTT mixed ');
play('whw',5,W,'mixed','WHW mixed ');
const top=E.rosterOf(S,'pdw').sort((a,b)=>b.ovr-a.ovr)[0];console.log(top.name,JSON.stringify(E.ego(S,top.id)));console.log(JSON.stringify(E.zones(S,top.id)));
console.log(S.news.filter(n=>/trait|test|turned a corner|breaking|walked|no-show/.test(n.t)).slice(0,8).map(n=>n.w+' '+n.t).join('\n'));
