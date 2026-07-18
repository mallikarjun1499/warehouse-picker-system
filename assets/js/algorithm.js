'use strict';
// Coordinate map - aisles at x=1,4,7,10,13 (mirrors Python data_loader)
const _COORD_MAP=(()=>{
  const x=[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,7,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
  const y=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31];
  const m={};for(let i=0;i<Math.min(x.length,y.length);i++)m[i]={x:x[i],y:y[i]};
  return m;
})();

export function getLocXY(id,coordMap=null){
  if(coordMap&&coordMap[id])return coordMap[id];
  if(_COORD_MAP[id])return _COORD_MAP[id];
  return{x:(Math.floor(id/30)*3+1),y:(id%15)+1};
}

const _BLOCK=[[0,150],[151,300]];
// Matches C# PickerRouteGAImpl.cs `blockCrossAisle = {{0,16},{16,32}}` EXACTLY.
// (Verified: full 301x301 pairwise diff against the C# DetermineDistances()
// shows 0 mismatches with this constant; the previous [17,31] here caused
// ~20% of location-pair distances to be wrong.)
const _CROSS=[[0,16],[16,32]];
function getBlock(id){for(let b=0;b<_BLOCK.length;b++)if(id>=_BLOCK[b][0]&&id<=_BLOCK[b][1])return b;return 0;}

export function manhattanWarehouse(a,b,locs){
  if(a===b)return 0;
  const la=locs[a]||{x:getLocXY(a).x,y:getLocXY(a).y};
  const lb=locs[b]||{x:getLocXY(b).x,y:getLocXY(b).y};
  const sx=la.x,sy=la.y,dx=lb.x,dy=lb.y;
  const ba=getBlock(a),bb=getBlock(b);
  if(sx===dx)return Math.abs(sy-dy);
  if(ba===bb){const[top,bot]=_CROSS[ba];return Math.abs(sx-dx)+Math.min(Math.abs(top-sy)+Math.abs(top-dy),Math.abs(bot-sy)+Math.abs(bot-dy));}
  return Math.abs(sx-dx)+Math.abs(sy-dy);
}

export function buildDistMatrix(allLocs,locs){
  const n=allLocs.length;
  const m=Array.from({length:n},()=>new Float64Array(n));
  for(let i=0;i<n;i++)for(let j=0;j<n;j++)if(i!==j)m[i][j]=manhattanWarehouse(allLocs[i],allLocs[j],locs);
  return m;
}

// Mulberry32 seeded PRNG
function rng(seed){let s=seed>>>0;return()=>{s+=0x6D2B79F5;let z=s;z=Math.imul(z^(z>>>15),z|1);z^=z+Math.imul(z^(z>>>7),z|61);return((z^(z>>>14))>>>0)/4294967296;};}
// Fresh, non-repeating seed source for each GA run (Date.now() mixed with
// Math.random() so two runs started in the same millisecond still differ).
// NEVER a fixed constant — every Optimize click must get a new initial
// population, per the "no fixed random seed" requirement.
function freshSeed(){return((Date.now()^Math.floor(Math.random()*0xffffffff))>>>0);}
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function pick2(n,r){let a=Math.floor(r()*n),b=Math.floor(r()*(n-1));if(b>=a)b++;return[Math.min(a,b),Math.max(a,b)];}

class Chrom{constructor(g){this.genes=g.slice();this.fit=Infinity;}clone(){const c=new Chrom(this.genes);c.fit=this.fit;return c;}}

// ── Route-sequencing GA (TSP-style permutation GA) ─────────────────────────
// UNCHANGED algorithm/operators — only the seed source below was fixed:
//   - Selection: binary tournament via shuffled pairing (select())
//   - Crossover: Order Crossover / OX (ox() + cross())
//   - Mutation:  swap mutation, applied per-offspring with probability pm (mutate())
//   - Elitism:   top (popSize * survivorRatio) carried over each generation (run())
class GA{
  constructor(mat,opts={}){
    this.mat=mat;this.n=mat.length;
    this.pop=opts.popSize??50;this.maxGen=opts.maxGen??200;
    this.pc=opts.crossoverProb??.85;this.pm=opts.mutationProb??.15;
    this.sr=opts.survivorRatio??.3;this.ms=opts.maxSimilar??30;
    this.r=rng(opts.seed??freshSeed());
  }
  dist(route){let t=0;for(let i=0;i<route.length-1;i++)t+=this.mat[route[i]][route[i+1]];return t;}
  fit(genes){return this.dist([0,...genes,0]);}
  initPop(inner){const p=[];for(let i=0;i<this.pop;i++){const g=inner.slice();shuffle(g,this.r);p.push(new Chrom(g));}return p;}
  eval(p){p.forEach(c=>c.fit=this.fit(c.genes));}
  select(pop){const pool=[];const cp=pop.map(c=>c.clone());shuffle(cp,this.r);for(let i=0;i<cp.length-1;i+=2)pool.push(cp[i].fit<=cp[i+1].fit?cp[i].clone():cp[i+1].clone());if(pool.length<this.pop)pool.push(pop[0].clone());return pool.slice(0,this.pop);}
  ox(p1,p2){const n=p1.length;const[a,b]=pick2(n,this.r);const make=(pA,pB)=>{const c=new Array(n).fill(-1);for(let k=a;k<=b;k++)c[k]=pA[k];const taken=new Set(c.slice(a,b+1));const fill=pB.filter(g=>!taken.has(g));let idx=0;for(let k=0;k<n;k++)if(c[k]===-1)c[k]=fill[idx++];return c;};return[make(p1,p2),make(p2,p1)];}
  cross(pool){const off=[];const sh=pool.map(c=>c.clone());shuffle(sh,this.r);for(let i=0;i<sh.length-1;i+=2){if(this.r()<this.pc){const[c1,c2]=this.ox(sh[i].genes,sh[i+1].genes);off.push(new Chrom(c1),new Chrom(c2));}else{off.push(new Chrom(sh[i].genes),new Chrom(sh[i+1].genes));}}return off.slice(0,this.pop);}
  mutate(pop){pop.forEach(c=>{if(this.r()<this.pm){const[i,j]=pick2(c.genes.length,this.r);[c.genes[i],c.genes[j]]=[c.genes[j],c.genes[i]];}});}
  run(cb=null){
    if(this.n<=2){const r=Array.from({length:this.n},(_,i)=>i);const d=this.dist(r);return{route:r,dist:d,gen:0,hist:[d]};}
    const inner=Array.from({length:this.n-1},(_,i)=>i+1);
    let pop=this.initPop(inner);this.eval(pop);pop.sort((a,b)=>a.fit-b.fit);
    const hist=[pop[0].fit];let same=0,prev=pop[0].fit,gen;
    for(gen=1;gen<=this.maxGen;gen++){
      const pool=this.select(pop);const off=this.cross(pool);this.mutate(off);this.eval(off);
      const elite=Math.max(1,Math.floor(this.pop*this.sr));
      pop=[...pop.slice(0,elite),...off].sort((a,b)=>a.fit-b.fit).slice(0,this.pop);
      const cur=pop[0].fit;hist.push(cur);
      if(cb)cb(gen,this.maxGen,cur);
      same=cur>=prev-1e-9?same+1:0;prev=cur;
      if(same>=this.ms)break;
    }
    return{route:[0,...pop[0].genes,0],dist:pop[0].fit,gen,hist};
  }
}

export function optimizeRoute(pickLocIds,locations,gaOpts={},progressCb=null){
  const SPEED=84.0;
  const allLocs=[0,...pickLocIds];
  const mat=buildDistMatrix(allLocs,locations);
  // No fixed seed: every call gets a brand-new random initial population (see freshSeed()).
  const ga=new GA(mat,{popSize:gaOpts.popSize??50,maxGen:gaOpts.maxGen??200,crossoverProb:gaOpts.crossoverProb??.85,mutationProb:gaOpts.mutationProb??.15,survivorRatio:gaOpts.survivorRatio??.3,maxSimilar:gaOpts.maxSimilar??30});
  const res=ga.run(progressCb);
  const route=res.route.map(i=>allLocs[i]);
  const steps=[];
  for(let s=0;s<route.length-1;s++){
    const fId=route[s],tId=route[s+1];
    const d=manhattanWarehouse(fId,tId,locations);
    const ts=(d/SPEED)*60;
    const tloc=locations[tId];
    steps.push({step:s+1,locId:tId,isDepot:tId===0,block:tId===0?'-':String(tloc?.aisle??tloc?.x??'-'),distanceM:d,timeSec:ts});
  }
  return{orderId:null,optimizedRoute:route,totalDistance:res.dist,travelTimeMin:res.dist/SPEED,numPickLocations:pickLocIds.length,steps,generationsRun:res.gen,fitnessHistory:res.hist};
}