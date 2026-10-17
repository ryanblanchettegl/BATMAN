/* The scenarios' fingerprint: how each built-in scenario starts and ends on suggested cards, and its words.
   test-scenarios.js compares against it. Renew it (node tools/scn-ref.js > tests/scenario-reference.json) when a new
   system changes how a game plays, after checking test-scenarios fails only on the fingerprint. */
process.chdir(require('path').join(__dirname,'..'));require('../engine.js');const E=GP,fs=require('fs'),crypto=require('crypto');E.useUniverse(JSON.parse(fs.readFileSync('universes/public_domain.json','utf8')));
const out={};
for(const sc of E.SCENARIOS){const S=E.scenarioStart(sc.id);const pre=crypto.createHash('md5').update(JSON.stringify(S)).digest('hex');
 for(let w=0;w<60&&!S.over;w++){S.inbox.filter(e=>!e.done).forEach(e=>E.resolveEvent(S,e.id,1));if(S.owner.pending)E.setCreed(S,{style:'merit',roots:'tradition',pledge:'stable'});while(S.qi<S.queue.length&&!S.over){const c=E.suggest(S);if(E.validate(S,c).errors.length){S.qi++;continue;}E.runPlayerShow(S,c);}if(!S.over)E.endWeek(S);}
 if(S.scn.res)delete S.scn.res.score; out[sc.id]={start:pre,end:crypto.createHash('md5').update(JSON.stringify(S)).digest('hex'),week:S.week,res:(()=>{const r=Object.assign({},S.scn.res);delete r.score;return r;})()};}
console.log(JSON.stringify(out,null,1));
const force={rescue:S=>{S.promos[S.player].cash=2e6;},champion:S=>{const P=S.promos[S.player],w=S.w[S.scn.target];const top=P.titles.filter(t=>!t.tag&&t.g===w.g).sort((a,b)=>b.lvl-a.lvl)[0];top.holders=[w.id];},war:S=>{S.scn.me=[2,3];S.scn.rv=[0];}};
const out2={};for(const sc of E.SCENARIOS){const S=E.scenarioStart(sc.id);out2[sc.id]={lose:E.scnCheck(S)};force[sc.id](S);out2[sc.id].win=E.scnCheck(S);}
fs.writeFileSync('tests/scenario-checks.json',JSON.stringify(out2,null,1));
