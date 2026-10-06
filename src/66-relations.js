/* ---------- The relationship matrix (S.rm) and what people remember ----------
   How two people feel about each other is the centre of the game. Every pair with any history has one entry:

     S.rm["12-45"] = {            // key: the two worker ids, lower first (rkey)
       bond: -62,                 // -100 real heat ... 0 nothing ... +100 close friends. Felt by both.
       base: -40,                 // the part of the bond that has settled for good. The bond drifts back to it.
       resp: [35, -10],           // respect. resp[0] is what the lower id thinks of the higher, resp[1] the reverse. -100..100
       jeal: [0, 45],             // jealousy, same order. 0..100. It fades unless it is fed, and while high it sours the bond.
       mem:  [ {w: 31, k: 'shoot', by: 45, t: 'Dracula went off script about King Arthur on live television.'} ],
       last: 31                   // the week it last changed
     }

   Standing ties (mentor and student, tag partners, family) are read from where the game already keeps them
   (w.ment, w.team, S.relT), so there is one source for each.

   What each wrestler remembers about YOU, the booker, sits beside it:

     S.rmY["12"] = { v: -20, mem: [ {w: 31, k: 'pushed', v: -20, t: 'You sent them to the finish while they were hurt.'} ] }

   Rules: nothing here calls rnd(S); every change goes through relBump() or youRemember(); a change the player caused, or
   one that turns two people into friends or enemies, is put on the notification bar (note()).
   Before version 0.16 the same feelings were split over S.rel (a friend or enemy flag) and S.bond (a score). An old save
   is folded into the matrix the first time it is read (relMigrate). */
var REL_MEM=6,REL_ON=30,REL_STRONG=60;
function relBlank(){return {bond:0,base:0,resp:[0,0],jeal:[0,0],mem:[],last:0,st:0};}
/* what was last announced about a pair: friends (1), enemies (-1) or neither. A pair has to fall well back (to 20) before
   the bar says they have drifted apart, so a bond that hovers around the line does not flap. */
function relState(e){var v=e.bond,s=e.st||0;return v>=REL_ON?1:(v<=-REL_ON?-1:(s>0&&v>=20?1:(s<0&&v<=-20?-1:0)));}
function relMigrate(S){
  var M=S.rm={};
  Object.keys(S.rel||{}).forEach(function(k){var v=S.rel[k];if(!v)return;var e=M[k]=relBlank();e.bond=e.base=v>0?REL_STRONG:-REL_STRONG;});
  Object.keys(S.bond||{}).forEach(function(k){var v=S.bond[k];if(!v)return;var e=M[k]||(M[k]=relBlank());e.bond=clamp(e.bond+v*10,-100,100);e.base=clamp(e.base+v*3.5,-100,100);});
  Object.keys(M).forEach(function(k){M[k].st=relState(M[k]);});
  delete S.rel;delete S.bond;
  return M;
}
function rmAll(S){return S.rm||relMigrate(S);}
function relIdx(a,b){return a<b?0:1;}
function relGet(S,a,b){return rmAll(S)[rkey(a,b)]||null;}
function relEntry(S,a,b){var M=rmAll(S),k=rkey(a,b);return M[k]||(M[k]=relBlank());}
/** The bond between two people: -100 real heat to +100 close friends. */
function bondOf(S,a,b){var e=relGet(S,a,b);return e?e.bond:0;}
/** What a thinks of b as a professional: -100 to 100. */
function respOf(S,a,b){var e=relGet(S,a,b);return e?e.resp[relIdx(a,b)]:0;}
/** How jealous a is of b: 0 to 100. */
function jealOf(S,a,b){var e=relGet(S,a,b);return e?e.jeal[relIdx(a,b)]:0;}
/** Friends (1), enemies (-1) or neither (0). The short answer most of the game asks for. */
function relOf(S,a,b){var v=bondOf(S,a,b);return v>=REL_ON?1:(v<=-REL_ON?-1:0);}
/** A standing tie between two people, read from where the game keeps it. */
function tieOf(S,a,b){
  var x=S.w[a],y=S.w[b];if(!x||!y)return null;
  if(x.ment===b)return {k:'mentor',of:b};if(y.ment===a)return {k:'mentor',of:a};
  if(x.team!=null&&x.team===y.team)return {k:'partners'};
  var t=S.relT&&S.relT[rkey(a,b)];return t==='family'?{k:'family'}:null;
}

/** Something for the notification bar: a heading and one line. kind: 'good', 'bad' or nothing. */
function note(S,head,text,kind){
  if(S.cal||!S.toasts)return;
  S.toasts.push({h:head,t:text||'',k:kind||''});
  if(S.live)nightNote(S,head,text,kind);
  if(S.toasts.length>40){for(var i=0;i<S.toasts.length;i++)if(typeof S.toasts[i]!=='string'){S.toasts.splice(i,1);break;}}
}
function relMine(S,a,b){var x=S.w[a],y=S.w[b];return !!x&&!!y&&x.promo===S.player&&y.promo===S.player;}

/** Set how two people start out, with no memory and no notification (new games, world files). */
function relSet(S,a,b,bond,o){
  if(a===b)return null;var e=relEntry(S,a,b),i=relIdx(a,b);o=o||{};
  e.bond=e.base=clamp(bond,-100,100);e.st=0;e.st=relState(e);
  if(o.ra!=null)e.resp[i]=clamp(o.ra,-100,100);if(o.rb!=null)e.resp[1-i]=clamp(o.rb,-100,100);
  return e;
}
/** Change how two people feel about each other.
    d: {bond, ra, rb, ja, jb}: bond is shared; ra is a's respect for b, rb is b's for a; ja is a's jealousy of b, jb b's of a.
    mem: {k, t, by, keep}: a line both will remember. keep marks the things nobody gets over: most of the change is permanent. */
function relBump(S,a,b,d,mem){
  if(a===b||a==null||b==null||!S.w[a]||!S.w[b])return null;
  var e=relEntry(S,a,b),was=e.st||0,i=relIdx(a,b),j=1-i,stick=mem&&mem.keep?0.7:0.35;
  if(d.bond){e.bond=clamp(e.bond+d.bond,-100,100);e.base=clamp(e.base+d.bond*stick,-100,100);}
  if(d.ra)e.resp[i]=clamp(e.resp[i]+d.ra,-100,100);
  if(d.rb)e.resp[j]=clamp(e.resp[j]+d.rb,-100,100);
  if(d.ja)e.jeal[i]=clamp(e.jeal[i]+d.ja,0,100);
  if(d.jb)e.jeal[j]=clamp(e.jeal[j]+d.jb,0,100);
  e.last=S.week;
  if(mem&&mem.t){e.mem.unshift({w:S.week,k:mem.k||'',t:mem.t,by:mem.by==null?null:mem.by});if(e.mem.length>REL_MEM)e.mem.length=REL_MEM;}
  var now=relState(e);e.st=now;
  if(now!==was&&relMine(S,a,b)){
    var A=S.w[a].name,B=S.w[b].name;
    if(now<0)note(S,A+' and '+B+' have real heat now',mem&&mem.t?mem.t:'It will show when they share a ring or a locker room.','bad');
    else if(now>0)note(S,A+' and '+B+' have become friends',mem&&mem.t?mem.t:'They work better together for it.','good');
    else note(S,was<0?A+' and '+B+' have let it go':A+' and '+B+' have drifted apart',mem&&mem.t?mem.t:'','');
  }
  return e;
}

/** A wrestler remembers something you did. v moves where you stand with them (-100..100), and the notification bar says so. */
function youRemember(S,w,k,text,v){
  if(!w||S.cal)return;
  var Y=S.rmY||(S.rmY={}),e=Y[w.id]||(Y[w.id]={v:0,mem:[]});
  e.v=clamp(e.v+v,-100,100);e.mem.unshift({w:S.week,k:k,t:text,v:v});if(e.mem.length>REL_MEM)e.mem.length=REL_MEM;
  if(w.promo===S.player)note(S,w.name+' will remember that',text,v>0?'good':(v<0?'bad':''));
}
/** Where you stand with a wrestler from what they remember: 1, 0 or -1. Feeds the "You" line of their morale. */
function youLean(S,w){var e=S.rmY&&S.rmY[w.id];return e?(e.v>=REL_ON?1:(e.v<=-REL_ON?-1:0)):0;}

/* how the feeling shows in the ring: friends and people who respect each other work better together */
function relChem(S,a,b){var e=relGet(S,a,b);return e?clamp(e.bond*0.03+(e.resp[0]+e.resp[1])*0.01,-3.5,3.5):0;}

/* a new game: working relationships are rolled fresh (src/65-you.js calls relSet). The matrix starts empty. */
NEWX.unshift(function(S){S.rm={};S.rmY={};});

/* every match on your shows moves the pairs in it */
POST.push(function(ctx){
  var S=ctx.S;if(S.cal||!ctx.isPl)return;var r=ctx.res,all=ctx.all,show=ctx.show.name,br=ctx.m.mt==='br';
  for(var i=0;i<all.length;i++)for(var j=i+1;j<all.length;j++){
    var a=all[i],b=all[j],same=ctx.sides.some(function(s){return s.indexOf(a)>=0&&s.indexOf(b)>=0;}),d={bond:0,ra:0,rb:0},mem=null;
    if(same)d.bond=4;                                              // partners who travel together grow close
    else if(br){if(r.OV>=85)d.bond=2;}
    else{
      if(r.OV>=85){d.bond=7;d.ra=3;d.rb=3;                         // made each other look good
        if(starQ(r.OV)>=19)mem={k:'classic',keep:true,t:a.name+' and '+b.name+' had a '+starG(r.OV)+' match at '+show+'.'};}
      else if(r.OV>=65)d.bond=1.5;
      else if(r.OV<50){d.bond=-5;d.ra=-2;d.rb=-2;}
      if(r.win>=0&&r.fin==='clean'){                                // a bigger name who loses clean has done the winner a favour
        var wa=r.winners.indexOf(a)>=0,wb=r.winners.indexOf(b)>=0,win=wa?a:(wb?b:null),lose=wa?b:(wb?a:null);
        if(win&&lose&&lose.ovr>=win.ovr+5){if(win===a)d.ra+=6;else d.rb+=6;d.bond+=3;
          if(!relGet(S,a.id,b.id)||!relGet(S,a.id,b.id).mem.some(function(x){return x.k==='putover'&&S.week-x.w<12;}))mem={k:'putover',by:lose.id,t:lose.name+' put '+win.name+' over clean at '+show+'.'};}
      }
      if(r.win>=0){                                                 // the same person called over the same opponent again and again is a grudge
        var ka=rkey(a.id,b.id),last=(S.bondLast||(S.bondLast={}))[ka],w0=r.winners[0]&&r.winners[0].id;
        if(last===w0&&w0!=null)d.bond-=7;S.bondLast[ka]=w0;
      }
    }
    if(d.bond||d.ra||d.rb||mem)relBump(S,a.id,b.id,d,mem);
  }
  // a title changes hands: the people who thought it should be theirs watch somebody else hold it up
  var t=ctx.t;
  if(r.seg.change&&t&&!t.tag&&r.winners.length===1){
    var W=r.winners[0],P=ctx.P;
    rosterOf(S,P.id).filter(function(x){return x.id!==W.id&&!x.nw&&x.g===W.g&&x.ovr>=W.ovr-2&&all.indexOf(x)<0&&holdLvl(P,x.id)===0&&relOf(S,x.id,W.id)<=0;})
      .sort(function(x,y){return y.ovr-x.ovr;}).slice(0,3).forEach(function(x,k){
        relBump(S,x.id,W.id,{ja:10+clamp(x.ovr-W.ovr,0,10)},k===0?{k:'passed',by:W.id,t:x.name+' watched '+W.name+' win the '+t.name+' and thinks it should have been theirs.'}:null);
      });
  }
});

/* every week: bonds settle back to where they have set, jealousy fades unless fed and sours the bond while it is high */
WEEKX.push(function(S){
  var M=S.rm;if(!M||S.cal)return;
  Object.keys(M).forEach(function(k){
    var e=M[k];
    e.bond+=(e.base-e.bond)*0.015;
    for(var i=0;i<2;i++){if(e.jeal[i]>=50){e.bond=clamp(e.bond-0.6,-100,100);e.base=clamp(e.base-0.2,-100,100);}e.jeal[i]=e.jeal[i]<0.5?0:Math.round(e.jeal[i]*97)/100;}
    e.bond=Math.round(e.bond*100)/100;e.base=Math.round(e.base*100)/100;
    // a pair with next to nothing between them, and nothing new for three months, is forgotten
    if(Math.abs(e.bond)<4&&Math.abs(e.base)<4&&S.week-(e.last||0)>=12&&Math.abs(e.resp[0])<3&&Math.abs(e.resp[1])<3&&!e.jeal[0]&&!e.jeal[1]&&!e.mem.length)delete M[k];
  });
});

/* ---------- for the screens ---------- */
function bondWord(v){return v>=REL_STRONG?'close friends':(v>=REL_ON?'friends':(v<=-REL_STRONG?'real heat':(v<=-REL_ON?'do not get on':'no strong feeling')));}
E.bond=function(S,a,b){return bondOf(S,a,b)/10;};   // the old ten-point scale, for anything that still reads it
E.bondWord=function(S,a,b){return bondWord(bondOf(S,a,b));};
/** Everything between two people, in numbers and in words. respA is what a thinks of b; jealA is how jealous a is of b. */
E.rel=function(S,a,b){
  var e=relGet(S,a,b)||relBlank(),i=relIdx(a,b);
  return {bond:Math.round(e.bond),word:bondWord(e.bond),respA:Math.round(e.resp[i]),respB:Math.round(e.resp[1-i]),jealA:Math.round(e.jeal[i]),jealB:Math.round(e.jeal[1-i]),tie:tieOf(S,a,b),mem:e.mem.slice()};
};
/** For a wrestler card: who they get on with, who they do not, what they remember, and where you stand with them. */
E.relations=function(S,id){
  var w=S.w[id],good=[],bad=[],notes=[],M=rmAll(S);
  rosterOf(S,w.promo).forEach(function(x){
    if(x.id===w.id)return;var e=M[rkey(w.id,x.id)];if(!e)return;
    if(e.bond>=REL_ON)good.push(x);else if(e.bond<=-REL_ON)bad.push(x);
    var j=e.jeal[relIdx(w.id,x.id)];if(j>=40)notes.push({w:e.last,t:'Jealous of '+x.name+'.',o:x.id,k:'jeal'});
    e.mem.forEach(function(mm){notes.push({w:mm.w,t:mm.t,o:x.id,k:mm.k});});
  });
  good.sort(function(a,b){return bondOf(S,id,b.id)-bondOf(S,id,a.id);});bad.sort(function(a,b){return bondOf(S,id,a.id)-bondOf(S,id,b.id);});
  notes.sort(function(a,b){return b.w-a.w;});
  var y=S.rmY&&S.rmY[id];
  return {good:good,bad:bad,notes:notes.slice(0,4),you:y?{v:Math.round(y.v),word:y.v>=REL_ON?'On your side':(y.v<=-REL_ON?'Has not forgiven you':'No strong feeling about you'),mem:y.mem.slice(0,3)}:null};
};
E.relBump=function(S,a,b,d,mem){return relBump(S,a,b,d||{},mem||null);};
E.youRemember=function(S,id,k,text,v){youRemember(S,S.w[id],k,text,v);};
