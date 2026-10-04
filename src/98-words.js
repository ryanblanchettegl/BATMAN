/* ---------- Words for numbers ----------
   A show's score is a number, and a number says nothing by itself: "the crowd expects 80%" reads like a promise of a
   very good show. So how good a show was, and how good a show a crowd expects, are said in the words of the business.
   One ladder, used everywhere a show is described to the player. The score itself is still kept and shown as the
   show's rating; what a crowd expects is only ever said in words. */
var SHOW_WORDS=[
  {v:95,w:'All-time classic',a:'an all-time classic',one:'an all-time classic',d:'They will talk about it for years.'},
  {v:90,w:'Blow-away',a:'a blow-away show',one:'a blow-away one',d:'Nothing missed. The building never sat down.'},
  {v:84,w:'Red hot',a:'a red-hot show',one:'a red-hot one',d:'The crowd was loud from the first bell to the last.'},
  {v:77,w:'Hot',a:'a hot show',one:'a hot one',d:'Good wrestling, stories that mattered, a crowd that cared.'},
  {v:70,w:'Strong',a:'a strong show',one:'a strong one',d:'More good than bad, and a main event that delivered.'},
  {v:62,w:'Solid',a:'a solid show',one:'a solid one',d:'It did its job. Nobody asked for their money back.'},
  {v:54,w:'Decent',a:'a decent show',one:'a decent one',d:'Watchable. A match or two worth the ticket.'},
  {v:46,w:'Flat',a:'a flat show',one:'a flat one',d:'The crowd sat on its hands for most of it.'},
  {v:38,w:'A dud',a:'a dud',one:'a dud',d:'Little worked, and the building knew it.'},
  {v:0,w:'A bomb',a:'a bomb',one:'a bomb',d:'It died in front of a live audience.'}
];
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
E.SHOW_LADDER=SHOW_WORDS.map(function(x){return {w:x.w,a:x.a,d:x.d};});
