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
function showWord(v){for(var i=0;i<SHOW_WORDS.length;i++)if(v>=SHOW_WORDS[i].v)return {i:i,w:SHOW_WORDS[i].w,a:SHOW_WORDS[i].a,one:SHOW_WORDS[i].one};return {i:SHOW_WORDS.length-1,w:'A bomb',a:'a bomb',one:'a bomb'};}
function capW(t){return t.charAt(0).toUpperCase()+t.slice(1);}
/** How a show did against what its crowd expects, in words: a headline and one line. s is 1 better, 0 level, -1 worse. */
function showVerdict(rating,exp){
  var d=rating-exp,w=showWord(rating),e=showWord(exp);
  var head=d>=4?'Blew the roof off':(d>=0.5?'Sent them home happy':(d>-0.5?'Gave them what they came for':(d>-4?'Came up short':'Died in front of them')));
  var line=w.i===e.i?capW(w.a)+', which is what this crowd expects.':capW(w.a)+' for a crowd that expects '+e.one+'.';
  return {head:head,line:line,s:d>=0.5?1:(d>-0.5?0:-1),word:w,exp:e};
}
E.showWord=function(v){return showWord(v);};
E.showVerdict=function(rating,exp){return showVerdict(rating,exp);};
/** What the crowd expects of the show on the desk (or the one given), in words. */
E.expectWords=function(S,show){
  show=show||(S.queue&&S.queue[S.qi]);if(!show)return null;
  var e=expected(S.promos[S.player],show),w=showWord(e);
  return {i:w.i,w:w.w,a:w.a,text:'This crowd expects '+w.a+'.'};
};
/** The ladder, best first, for the guide window. */
E.SHOW_LADDER=SHOW_WORDS.map(function(x){return {w:x.w,a:x.a,d:x.d,g:x.g};});
E.grade=function(v){return gradeG(v);};E.gradeMeets=function(v,t){return gradeMeets(v,t);};
/* a save from before grades: reword the sponsor lines it carries */
WEEKX.push(function(S){
  (S.sponsors||[]).concat(S.spOffers||[]).forEach(function(o){if(o&&o.type==='rating'&&/%/.test(o.text||''))o.text='No show graded under '+gradeG(o.val);});
  (S.quests||[]).forEach(function(q){if(q.type==='sponsor'&&/%/.test(q.text||''))q.text='Sponsor: big event graded '+gradeG(q.target)+' or better ('+money(q.bonus)+')';});
});
