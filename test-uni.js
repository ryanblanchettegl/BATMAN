const fs=require('fs');require('./engine.js');
const E=globalThis.GP;
const file=process.argv[2]||'universes/parody.json',weeks=+process.argv[3]||40;
const pkg=JSON.parse(fs.readFileSync(file,'utf8'));
const v=E.useUniverse(pkg);
console.log(file,'ok',v.ok,'errors',v.errors.length,'warnings',v.warnings.length);
v.errors.slice(0,12).forEach(e=>console.log('  E',e.at,'-',e.msg));v.warnings.slice(0,12).forEach(e=>console.log('  W',e.at,'-',e.msg));
if(!v.ok)process.exit(1);
let failures=0;
/* sim invariants, checked every week: nobody on both sides of a feud, nobody twice in a match, every title holder under contract to that promotion */
function invariants(S,where,card){
  const bad=[];
  S.feuds.filter(f=>!f.res).forEach(f=>{if(f.a.some(id=>f.b.indexOf(id)>=0))bad.push('feud '+f.id+' has someone on both sides');});
  S.order.forEach(pid=>S.promos[pid].titles.forEach(t=>t.holders.forEach(id=>{const w=S.w[id];if(!w||w.promo!==pid)bad.push(pid+' '+t.name+' held by '+(w?w.name+' ('+w.promo+')':'nobody'));})));
  if(card){const seen={};card.forEach((m,i)=>m.sides.forEach(sd=>sd.forEach(id=>{if(seen[id]!=null)bad.push('match '+(i+1)+' repeats '+S.w[id].name+' from match '+(seen[id]+1));seen[id]=i;})));}
  return bad.map(b=>where+': '+b);
}
const info=E.universe();console.log(info.name,'workers',info.workers,'promotions',info.promotions.map(p=>p.id+' '+p.image).join(', '));
for(const p of info.promotions){
  const S=E.newGame(p.id,3,{name:'R'});const P=S.promos[p.id];let errs=0,rs=[],inv=[];
  for(let wk=0;wk<weeks&&!S.over;wk++){
    S.inbox.filter(e=>!e.done).forEach(e=>E.resolveEvent(S,e.id,e.type==='handover'?0:1));
    if(S.owner.pending)E.setCreed(S,{style:'merit',roots:'tradition',pledge:'stable'});
    while(S.qi<S.queue.length){const card=E.suggest(S);const pr=E.preShow(S,card);if(pr)E.resolvePre(S,card,0);inv.push(...invariants(S,p.id+' wk '+S.week,card));const vv=E.validate(S,card);if(vv.errors.length){errs++;if(errs<3)console.log('  VALIDATION',p.id,S.week,vv.errors.slice(0,2),card.length);S.qi++;continue;}const r=E.runPlayerShow(S,card);rs.push(r.rep.rating-r.rep.exp);}
    E.endWeek(S);inv.push(...invariants(S,p.id+' wk '+S.week,null));
  }
  if(inv.length){failures++;console.log('  INVARIANTS',p.id,inv.length,'broken, first:',inv.slice(0,3).join(' | '));}
  const bad=S.w.filter(w=>[w.ovr,w.cond,w.morale,w.mom,w.brawl,w.wage,w.age].some(x=>!isFinite(x)));
  console.log(' ',p.id.padEnd(5),E.cal(1).label,'->',E.cal(S.week).label,'over',JSON.stringify(S.over),'img',p.image,'->',P.image.toFixed(1),'cash',(P.cash0/1e6).toFixed(2),'->',(P.cash/1e6).toFixed(2)+'M','r-exp',(rs.reduce((a,b)=>a+b,0)/rs.length).toFixed(2),'roster',E.rosterOf(S,p.id).length,'errs',errs,'NaN',bad.length,'stables',S.stables.length,'teams',S.teams.filter(t=>t.promo===p.id).length,'nets',P.hist.slice(0,4).map(h=>Math.round(h.net/1000)+'k').join(','));
  if(errs>0||bad.length>0||(S.over&&S.over.why!=='fired')){failures++;console.log('  FAIL',p.id,'errs',errs,'NaN',bad.length,'over',JSON.stringify(S.over));}
  if(p===info.promotions[0]){const rt=E.exportUniverse(S,{name:'round trip'});const v2=E.validateUniverse(rt);console.log('  re-export valid:',v2.ok,'errors',v2.errors.length,'warnings',v2.warnings.length,v2.errors.slice(0,3).map(e=>e.at+' '+e.msg).join(' | '));}
}
// broken packages must be caught
const bad1=JSON.parse(JSON.stringify(pkg));bad1.workers[0].ratings.brawlling=50;delete bad1.workers[1].gender;bad1.contracts[2].promotion_id='nope';bad1.workers[3].ratings.overness=140;bad1.titles[0].holder_ids=['ghost'];bad1.workers[4].media={portrait:'../../etc/passwd.png'};
const r1=E.validateUniverse(bad1);console.log('broken package: ok',r1.ok,'|',r1.errors.map(e=>e.at+': '+e.msg).join(' | ').slice(0,600),'| W:',r1.warnings.slice(0,3).map(e=>e.msg).join(' | '));
const r2=E.validateUniverse({manifest:{id:'x1',name:'n',schema_version:9}});console.log('newer schema:',r2.errors[0].msg);
if(failures){console.log('FAILED:',failures,'promotion(s) had errors, bad numbers or ended early');process.exit(1);}
