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
