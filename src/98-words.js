/* ---------- Words for numbers ----------
   A show's score is a number, and a number says nothing by itself: "the crowd expects 80%" reads like a promise of a
   very good show. So how good a show was, and how good a show a crowd expects, are said in the words of the business.
   One ladder, used everywhere a show is described to the player, and each rung lines up with a letter grade. The
   show's own score is shown as that letter grade only; what a crowd expects is only ever said in words. */
var SHOW_WORDS=[
  {v:95,g:'A+',w:'All-time classic',a:'an all-time classic',one:'an all-time classic',d:'They will talk about it for years.'},
  {v:90,g:'A+',w:'Blow-away',a:'a blow-away show',one:'a blow-away one',d:'Nothing missed. The building never sat down.'},
  {v:85,g:'A',w:'Red hot',a:'a red-hot show',one:'a red-hot one',d:'The crowd was loud from the first bell to the last.'},
  {v:80,g:'A-',w:'Hot',a:'a hot show',one:'a hot one',d:'Good wrestling, stories that mattered, a crowd that cared.'},
  {v:75,g:'B+',w:'Strong',a:'a strong show',one:'a strong one',d:'More good than bad, and a main event that delivered.'},
  {v:70,g:'B',w:'Solid',a:'a solid show',one:'a solid one',d:'It did its job. Nobody asked for their money back.'},
  {v:65,g:'B-',w:'Decent',a:'a decent show',one:'a decent one',d:'Watchable. A match or two worth the ticket.'},
  {v:55,g:'C+ or C',w:'Flat',a:'a flat show',one:'a flat one',d:'The crowd sat on its hands for most of it.'},
  {v:40,g:'C- or D',w:'A dud',a:'a dud',one:'a dud',d:'Little worked, and the building knew it.'},
  {v:0,g:'F',w:'A bomb',a:'a bomb',one:'a bomb',d:'It died in front of a live audience.'}
];
/* A show's own score is shown to the player as a letter grade and nothing else. A target about a show is worded as a
   grade and checked with gradeMeets(), so what the player reads is what is checked. */
var GRADES=[[90,'A+'],[85,'A'],[80,'A-'],[75,'B+'],[70,'B'],[65,'B-'],[60,'C+'],[55,'C'],[50,'C-'],[40,'D']];
function gradeIdx(v){for(var i=0;i<GRADES.length;i++)if(v>=GRADES[i][0])return GRADES.length-i;return 0;}
function gradeG(v){for(var i=0;i<GRADES.length;i++)if(v>=GRADES[i][0])return GRADES[i][1];return 'F';}
/** The grade with its article: "an A-", "a B+". */
function gradeA(v){var g=gradeG(v);return (/^[AF]/.test(g)?'an ':'a ')+g;}
function gradeMeets(v,target){return gradeIdx(v)>=gradeIdx(target);}
/* The letter is the show against its own crowd (Ryan, 6 October): an A means it beat what this crowd expected, a B is
   what they came for, and a big company and a small one are each graded on their own bar. crowdScore() puts the gap
   between the show and the expectation on the grade scale, so gradeG() and gradeMeets() work on it unchanged. The
   bands are the same ones the headline, the dirt sheet and the Net use (verdictBand), so the four can never disagree. */
var CROWD_PTS=[[-12,40],[-8,50],[-6,55],[-4,60],[-2,65],[-0.5,70],[0.5,75],[2,80],[4,85],[7,90]];
function crowdScoreD(d){
  var p=CROWD_PTS,i;if(d<=p[0][0])return Math.max(5,p[0][1]+(d-p[0][0])*2.5);if(d>=p[p.length-1][0])return Math.min(99,90+(d-7));
  for(i=1;i<p.length;i++)if(d<p[i][0])return p[i-1][1]+(d-p[i-1][0])/(p[i][0]-p[i-1][0])*(p[i][1]-p[i-1][1]);return 90;
}
function crowdScore(rating,exp){return Math.round(crowdScoreD(rating-exp)*10)/10;}
/** A filed show's score on the grade scale. A report from before this has no `cs`: work it out, or fall back on the raw score. */
function repCS(r){return !r?0:(r.cs!=null?r.cs:(r.exp!=null?crowdScore(r.rating,r.exp):r.rating));}
/** 2 blew the roof off, 1 a little more, 0 what they came for, -1 short, -2 a miss. */
function verdictBand(d){var c=Math.round(crowdScoreD(d)*10)/10;return c>=85?2:(c>=75?1:(c>=70?0:(c>=60?-1:-2)));}
/* targets written before the letter meant this: put them on the same scale, once */
function cgFix(S){
  var P=S.promos[S.player];if(!P)return;
  (S.sponsors||[]).concat(S.spOffers||[]).forEach(function(o){if(o&&o.type==='rating'&&!o.cg){var lo=99;Object.keys(P.base).forEach(function(k){if(P.base[k]<lo)lo=P.base[k];});
    o.val=Math.round(crowdScoreD(o.val-(lo+0.6*(P.image-P.image0))));o.cg=1;o.text='No show graded under '+gradeG(o.val);}});
  (S.quests||[]).forEach(function(q){if(q.type==='sponsor'&&!q.cg){q.target=Math.round(crowdScoreD(q.target-expected(P,{big:true})));q.cg=1;q.text='Sponsor: big event graded '+gradeG(q.target)+' or better ('+money(q.bonus)+')';}});
}
function showWord(v){for(var i=0;i<SHOW_WORDS.length;i++)if(v>=SHOW_WORDS[i].v)return {i:i,w:SHOW_WORDS[i].w,a:SHOW_WORDS[i].a,one:SHOW_WORDS[i].one};return {i:SHOW_WORDS.length-1,w:'A bomb',a:'a bomb',one:'a bomb'};}
function capW(t){return t.charAt(0).toUpperCase()+t.slice(1);}
/** How a show did against what its crowd expects, in words: a headline and one line. s is 1 better, 0 level, -1 worse. */
function showVerdict(rating,exp){
  var d=rating-exp,w=showWord(rating),e=showWord(exp),same=w.i===e.i;
  var band=verdictBand(d),head=['Died in front of them','Came up short','Gave them what they came for','Sent them home happy','Blew the roof off'][band+2];
  var line=band===0?capW(w.a)+', which is what this crowd expects.':(same?capW(w.a)+(band>0?', and a little more than this crowd expects.':', but this crowd wanted a little more.'):capW(w.a)+' for a crowd that expects '+e.one+'.');
  return {head:head,line:line,s:band>0?1:(band<0?-1:0),band:band,grade:gradeG(crowdScore(rating,exp)),word:w,exp:e};
}
E.showWord=function(v){return showWord(v);};
E.showVerdict=function(rating,exp){return showVerdict(rating,exp);};
/** What the crowd expects of the show on the desk (or the one given), in words. */
E.expectWords=function(S,show){
  show=show||(S.queue&&S.queue[S.qi]);if(!show)return null;
  var e=expected(S.promos[S.player],show),w=showWord(e);
  return {i:w.i,w:w.w,a:w.a,bar:starG(e),text:'This crowd expects '+w.a+'.'};
};
/** The ladder, best first, for the guide window. */
E.SHOW_LADDER=SHOW_WORDS.map(function(x){return {w:x.w,a:x.a,d:x.d};});
E.grade=function(v){return gradeG(v);};E.repGrade=function(r){return gradeG(repCS(r));};E.repCS=function(r){return repCS(r);};E.crowdScore=function(a,b){return crowdScore(a,b);};E.gradeMeets=function(v,t){return gradeMeets(v,t);};
/* a save from before grades: reword the sponsor lines it carries */
WEEKX.push(function(S){
  cgFix(S);
  (S.sponsors||[]).concat(S.spOffers||[]).forEach(function(o){if(o&&o.type==='rating'&&/%/.test(o.text||''))o.text='No show graded under '+gradeG(o.val);});
  (S.quests||[]).forEach(function(q){if(q.type==='sponsor'&&/%/.test(q.text||''))q.text='Sponsor: big event graded '+gradeG(q.target)+' or better ('+money(q.bonus)+')';});
});
