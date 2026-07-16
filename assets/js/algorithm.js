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
function shuffle(a,r){for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}
function pick2(n,r){let a=Math.floor(r()*n),b=Math.floor(r()*(n-1));if(b>=a)b++;return[Math.min(a,b),Math.max(a,b)];}

class Chrom{constructor(g){this.genes=g.slice();this.fit=Infinity;}clone(){const c=new Chrom(this.genes);c.fit=this.fit;return c;}}

class GA{
  constructor(mat,opts={}){
    this.mat=mat;this.n=mat.length;
    this.pop=opts.popSize??50;this.maxGen=opts.maxGen??200;
    this.pc=opts.crossoverProb??.85;this.pm=opts.mutationProb??.15;
    this.sr=opts.survivorRatio??.3;this.ms=opts.maxSimilar??30;
    this.r=rng(opts.seed??42);
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
  const ga=new GA(mat,{popSize:gaOpts.popSize??50,maxGen:gaOpts.maxGen??200,crossoverProb:gaOpts.crossoverProb??.85,mutationProb:gaOpts.mutationProb??.15,survivorRatio:gaOpts.survivorRatio??.3,maxSimilar:gaOpts.maxSimilar??30,seed:42});
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

// ═════════════════════════════════════════════════════════════════════════
// EXACT PORT of the desktop application's picker-assignment GA.
// Source: PickerRouteOpti C# project (namespace ParallelMachine_GA) —
//   Chromosome.cs, Machine.cs, Job.cs, Population.cs, PickerRouteGAImpl.cs
//
// This is a single, UNIFIED genetic algorithm that decides simultaneously
// (a) which picker ("machine") each location ("job") is assigned to, AND
// (b) the order in which that picker visits their locations. The desktop
// app has NO separate route-sequencing stage — sequencing falls out of the
// same chromosome via a sort-key, so this GA's output is used directly as
// each picker's final optimized sequence.
//
// Ported 1:1, including source quirks that were deliberately NOT "fixed":
//   - Sort key is a STRING concatenation "{gene:0.00}{jobIndex}", sorted
//     lexicographically (not numerically) — matches C#'s
//     SortedDictionary<string, Job> ordering exactly, ties and all.
//   - Mutation touches exactly ONE random gene per offspring chromosome
//     (not independent per-gene mutation).
//   - No balance constraint of any kind: Penalty is hardcoded to 0 and
//     ValidateConstraints() is unused in the source, so picker location
//     counts are NOT balanced. A picker can end up with zero locations.
//   - Selection re-shuffles the ENTIRE previous generation from scratch
//     whenever the current shuffled pool is exhausted, repeating until the
//     mating pool reaches population size (see SortSolutionsRandomly()).
//
// Distance matrix: reuses buildDistMatrix()/manhattanWarehouse() above.
// This has been verified numerically IDENTICAL to the C# DetermineDistances()
// across all 301x301 location pairs (after fixing the block-1 cross-aisle
// constant to {16,32}, matching the C# blockCrossAisle array exactly).
//
// NOTE on determinism: the C# source calls `new Random()` with no seed, so
// the desktop app itself does not produce identical output between two runs
// on the same input. This port therefore matches the desktop's algorithm/
// operators exactly; it does not (and cannot) guarantee bit-identical
// output, since the source of truth has no such guarantee either.
// ═════════════════════════════════════════════════════════════════════════

// ── Job.cs ──────────────────────────────────────────────────────────────
class Job{
  constructor(id,machineID){
    this.jobID=id;
    this.startTime=0;
    this.completionTime=0;
    this.processingMachineID=machineID;
    this.distanceTravelled=0;
  }
}

// ── Machine.cs ──────────────────────────────────────────────────────────
class Machine{
  constructor(){
    this.machineID=-999;
    this.lastJobCompletionTime=-999;
    this.assignedJobCount=-999;
    this.assignedJobs=[];              // array of [keyStr, Job], kept sorted by keyStr (mirrors SortedDictionary<string,Job>)
  }
  // AddJob(gValue formatted string, Job) — key = "{gValue:0.00}{jobID}" (string concat, exactly as C#)
  addJob(gValueStr,job){
    const key=`${gValueStr}${job.jobID}`;
    let lo=0,hi=this.assignedJobs.length;
    while(lo<hi){const mid=(lo+hi)>>1;if(this.assignedJobs[mid][0]<key)lo=mid+1;else hi=mid;}
    this.assignedJobs.splice(lo,0,[key,job]);
    this.assignedJobCount=this.assignedJobs.length;
    return true;
  }
  getJobCompletionTime(jobIndex){
    for(const[,job]of this.assignedJobs)if(job.jobID===jobIndex)return job.completionTime;
    return 0;
  }
}

// ── Chromosome.cs ───────────────────────────────────────────────────────
class Chromosome{
  constructor(len,genNum,csNum,m,dist,pickingLoc){
    this.nGenes=len;
    this.generationNum=genNum;
    this.chromosomeNum=csNum;
    this.nMachines=m;
    this.machines=new Map();           // int machineID -> Machine (kept sorted by key on read, mirrors SortedDictionary<int,Machine>)
    this.distance=dist;
    this.pickingLoc=pickingLoc;
    this.geneValues=new Array(len);
    for(let jj=0;jj<len;jj++)this.geneValues[jj]=jj;
    this.chromosomeFitness=0;
    this.penalty=0;
  }
  // AddGene(double gValue, int jobIndex)
  addGene(gValue,jobIndex){
    if(gValue>=this.nMachines)gValue-=0.01;
    const tmpStr=gValue.toFixed(2);
    const rounded=Number(tmpStr);
    this.geneValues[jobIndex]=rounded;
    this.updateMachineJobDetails(rounded,jobIndex);
    return true;
  }
  updateMachineJobDetails(gValue,jobIndex){
    const intValue=Math.trunc(gValue);
    const tmpStr=gValue.toFixed(2);
    if(!this.machines.has(intValue)){
      const tmpMachine=new Machine();
      tmpMachine.machineID=intValue;
      const tmpJob=new Job(jobIndex,intValue);
      tmpMachine.addJob(tmpStr,tmpJob);
      this.machines.set(intValue,tmpMachine);
    }else{
      const tmpMachine=this.machines.get(intValue);
      const tmpJob=new Job(jobIndex,intValue);
      tmpMachine.addJob(tmpStr,tmpJob);
    }
    return true;
  }
  // EvaluateFitness(): iterate machines in ascending machineID order (SortedDictionary<int,Machine> semantics)
  evaluateFitness(){
    const machineIDs=[...this.machines.keys()].sort((a,b)=>a-b);
    for(const mid of machineIDs){
      const machine=this.machines.get(mid);
      let tmpST=0,tmpStart=0,tmpJobID=0;
      for(const[,job]of machine.assignedJobs){
        tmpJobID=job.jobID;
        const tmpDist=this.distance[tmpStart][tmpJobID+1];
        const tmpCT=tmpST+tmpDist;
        job.startTime=tmpST;
        job.completionTime=tmpCT;
        job.distanceTravelled=tmpDist;
        tmpStart=tmpJobID+1;
        tmpST=tmpCT;
      }
      // Back to DEPOT (only reached if the machine has >=1 job, exactly as C#'s
      // lazy machine-creation means empty machines never enter `this.machines` at all)
      const tmpDist=this.distance[tmpJobID+1][0];
      machine.lastJobCompletionTime=tmpST+tmpDist;
    }
    let fitness=0;
    for(const mid of machineIDs)fitness+=this.machines.get(mid).lastJobCompletionTime;
    this.chromosomeFitness=fitness;
    return true;
  }
  getChromosomeGeneString(){
    return this.geneValues.map(g=>g.toFixed(2)).join(' ')+' ';
  }
}

// ── Population.cs ───────────────────────────────────────────────────────
class PARPopulation{
  constructor(size,gID){
    this.populationSize=size;
    this.generationID=gID;
    this.chromosomePopulation=[];
    this.bestFitness=0;
    this.lowestPenalty=0;
    this.bestChromosomeID=0;
  }
  get chromosomeAddedCount(){return this.chromosomePopulation.length;}
  addChromosome(cs){this.chromosomePopulation.push(cs);return true;}
  // SortSolutionsRandomly(): random permutation of population indices, consumed pairwise
  sortSolutionsRandomly(r){
    const idx=this.chromosomePopulation.map((_,i)=>i);
    shuffle(idx,r);
    return idx;
  }
  // GetChromosomeFitnessValues(): indices sorted ascending by fitness (stable)
  getChromosomeFitnessValues(){
    const idx=this.chromosomePopulation.map((_,i)=>i);
    idx.sort((a,b)=>this.chromosomePopulation[a].chromosomeFitness-this.chromosomePopulation[b].chromosomeFitness);
    return idx;
  }
  identifyBestfitness(){
    this.bestFitness=0;this.bestChromosomeID=0;
    for(const cs of this.chromosomePopulation){
      if(this.bestFitness<=0){this.bestFitness=cs.chromosomeFitness;this.bestChromosomeID=cs.chromosomeNum;this.lowestPenalty=cs.penalty;}
      else if(this.bestFitness>cs.chromosomeFitness){this.bestFitness=cs.chromosomeFitness;this.bestChromosomeID=cs.chromosomeNum;this.lowestPenalty=cs.penalty;}
    }
    return true;
  }
}

// ── PickerRouteGAImpl.cs ────────────────────────────────────────────────
class PickerRouteGAImpl{
  // (m, N, T, Pc, Pm, sR, PickList, iSimFitness) — same signature/order as the C# constructor
  constructor(nMachines,nPopulationSize,nMaxGenerations,Pc,Pm,sR,pickList,nMaxSimilarFitness,locations){
    this.nMachines=nMachines;
    this.pickingLoc=pickList.slice();
    this.nJobs=this.pickingLoc.length;
    this.locations=locations;
    this.distance=null;
    this.determineDistances();
    this.nPopulationSize=nPopulationSize;
    this.nMaxGenerations=nMaxGenerations;
    this.crossoverProbability=Pc;
    this.mutationProbability=Pm;
    this.survivorPopulationRatio=sR;
    this.nMaxSimilarFitness=nMaxSimilarFitness;
    this.r=rng((Math.random()*0xffffffff)>>>0); // C# `new Random()` is unseeded/time-based — see determinism note above
    this.initialPopulation=new PARPopulation(this.nPopulationSize,0);
  }
  getNumPickingLocation(){return this.pickingLoc.length;}
  getDistance(){return this.distance;}
  // DetermineDistances(): delegates to the shared, verified-identical warehouse
  // distance model above (buildDistMatrix/manhattanWarehouse) instead of
  // re-embedding a duplicate 250-line coordinate table. See file header note.
  determineDistances(){
    const allLocs=[0,...this.pickingLoc];
    this.distance=buildDistMatrix(allLocs,this.locations);
  }
  newChromosome(genNum,csNum){
    return new Chromosome(this.nJobs,genNum,csNum,this.nMachines,this.distance,this.pickingLoc);
  }
  evaluateChromosomeFitness(cs){
    cs.evaluateFitness();
    cs.penalty=0;
    return true;
  }
  evaluatePopulationFitness(pop){
    for(const cs of pop.chromosomePopulation)if(cs)this.evaluateChromosomeFitness(cs);
    return true;
  }
  // GenerateInitialPopulation(): for every job, a random machine + random fractional key.
  // (The C# source draws jobs off a shrinking list in random order before assigning each
  // one's gene; since every job's final gene value depends only on its own draws, this is
  // behaviorally identical and is implemented directly here.)
  generateInitialPopulation(){
    let nGenerated=0;
    while(nGenerated<this.nPopulationSize){
      const cs=this.newChromosome(0,nGenerated);
      for(let jj=0;jj<this.nJobs;jj++){
        let geneIntValue=Math.floor(this.r()*this.nMachines);
        if(geneIntValue>=this.nMachines)geneIntValue=this.nMachines-1;
        const geneFltValue=this.r();
        cs.addGene(geneIntValue+geneFltValue,jj);
      }
      this.initialPopulation.addChromosome(cs);
      nGenerated++;
    }
    return this.initialPopulation;
  }
  // ExecuteGAAlgorithm(): the main GA loop, ported step-for-step from the C# source.
  executeGAAlgorithm(progressCb=null){
    const initialPopulation=this.generateInitialPopulation();
    this.evaluatePopulationFitness(initialPopulation);
    initialPopulation.identifyBestfitness();

    let nSimPrevFitnessCount=0;
    let nPrevFitness=initialPopulation.bestFitness;
    let t=1;
    let Pprev=initialPopulation;          // P[t-1] — the most recently completed generation
    const hist=[initialPopulation.bestFitness];

    while(t<this.nMaxGenerations){
      let matingPopCnt=0;
      let selection=[];                   // shuffled index list still to consume
      const M=new PARPopulation(this.nPopulationSize,t-1);   // Mating pool

      // 06. M(t) := Selection(P(t-1)) — binary tournament via shuffled pairing,
      //     re-shuffling the ENTIRE previous generation from scratch whenever exhausted.
      while(matingPopCnt<this.nPopulationSize){
        if(selection.length<=0)selection=Pprev.sortSolutionsRandomly(this.r);
        if(selection.length<2)selection=Pprev.sortSolutionsRandomly(this.r); // guards the odd-population-size edge case (would throw in C#)

        const firstCS=selection[0],secondCS=selection[1];
        const fitFirst=Pprev.chromosomePopulation[firstCS].chromosomeFitness;
        const fitSecond=Pprev.chromosomePopulation[secondCS].chromosomeFitness;
        let winner;
        if(fitFirst===fitSecond)winner=this.r()<0.5?secondCS:firstCS; // C#: Next(0,2)==1 -> first, else second
        else winner=fitFirst<fitSecond?firstCS:secondCS;

        const tmpCS=this.newChromosome(t-1,matingPopCnt);
        for(let jj=0;jj<this.nJobs;jj++)tmpCS.addGene(Pprev.chromosomePopulation[winner].geneValues[jj],jj);
        this.evaluateChromosomeFitness(tmpCS);
        M.addChromosome(tmpCS);

        selection=selection.slice(2);
        matingPopCnt++;
      }

      // 07. Q(t) := Variation(M(t)): Crossover — single fresh shuffle of M, single-point crossover per pair
      const CO=new PARPopulation(this.nPopulationSize,t-1);
      let csCnt=0;
      let coSelection=M.sortSolutionsRandomly(this.r);
      while(CO.chromosomeAddedCount<this.nPopulationSize){
        if(coSelection.length<2)coSelection=M.sortSolutionsRandomly(this.r);
        const rNum=this.r();
        const firstCS=coSelection[0],secondCS=coSelection[1];
        const origCS1=M.chromosomePopulation[firstCS],origCS2=M.chromosomePopulation[secondCS];
        const cs1=this.newChromosome(t-1,csCnt++),cs2=this.newChromosome(t-1,csCnt++);

        if(rNum<=this.crossoverProbability){
          const nSite=1+Math.floor(this.r()*(this.nJobs-1)); // C#: Next(1, nJobs) -> [1, nJobs-1]
          for(let jj=0;jj<nSite;jj++){cs1.addGene(origCS1.geneValues[jj],jj);cs2.addGene(origCS2.geneValues[jj],jj);}
          for(let jj=nSite;jj<this.nJobs;jj++){cs1.addGene(origCS2.geneValues[jj],jj);cs2.addGene(origCS1.geneValues[jj],jj);}
        }else{
          for(let jj=0;jj<this.nJobs;jj++){cs1.addGene(origCS1.geneValues[jj],jj);cs2.addGene(origCS2.geneValues[jj],jj);}
        }
        this.evaluateChromosomeFitness(cs1);this.evaluateChromosomeFitness(cs2);
        CO.addChromosome(cs1);CO.addChromosome(cs2);
        coSelection=coSelection.slice(2);
      }

      // Mutation: exactly ONE random gene per offspring is eligible, with probability Pm
      const MU=new PARPopulation(this.nPopulationSize,t-1);
      for(let coCSCnt=0;coCSCnt<this.nPopulationSize;coCSCnt++){
        const rSelGene=Math.floor(this.r()*this.nJobs);
        const origCS=CO.chromosomePopulation[coCSCnt];
        const mutaCS=this.newChromosome(t-1,coCSCnt);
        for(let jj=0;jj<this.nJobs;jj++){
          let geneValue=origCS.geneValues[jj];
          if(rSelGene===jj){
            const rMutation=this.r();
            if(rMutation<=this.mutationProbability){
              let geneIntValue=Math.floor(this.r()*this.nMachines);
              if(geneIntValue>=this.nMachines)geneIntValue=this.nMachines-1;
              const geneFltValue=this.r();
              geneValue=geneIntValue+geneFltValue;
            }
          }
          mutaCS.addGene(geneValue,jj);
        }
        this.evaluateChromosomeFitness(mutaCS);
        MU.addChromosome(mutaCS);
      }
      this.evaluatePopulationFitness(MU);

      // 09. Survivor: top (N*survivorRatio) elites from P(t-1) + best of MU filling the rest
      const Q=new PARPopulation(this.nPopulationSize,t);
      const randPrevSolution=Pprev.getChromosomeFitnessValues();     // ascending by fitness
      const randCurrSolution=MU.getChromosomeFitnessValues();        // ascending by fitness
      const numPrevSolutions=Math.floor(this.nPopulationSize*this.survivorPopulationRatio);

      let addCnt=0;
      for(const kIdx of randPrevSolution){
        const tmpCS=this.newChromosome(t,addCnt);
        for(let jj=0;jj<this.nJobs;jj++)tmpCS.addGene(Pprev.chromosomePopulation[kIdx].geneValues[jj],jj);
        this.evaluateChromosomeFitness(tmpCS);
        Q.addChromosome(tmpCS);
        addCnt++;
        if(addCnt>=numPrevSolutions)break;
      }
      for(const kIdx of randCurrSolution){
        const tmpCS=this.newChromosome(t,addCnt);
        for(let jj=0;jj<this.nJobs;jj++)tmpCS.addGene(MU.chromosomePopulation[kIdx].geneValues[jj],jj);
        this.evaluateChromosomeFitness(tmpCS);
        Q.addChromosome(tmpCS);
        addCnt++;
        if(addCnt>=this.nPopulationSize)break;
      }
      Q.identifyBestfitness();

      Pprev=Q;         // P[t-1] for the next iteration is this generation's Q
      hist.push(Q.bestFitness);
      if(progressCb)progressCb(t,this.nMaxGenerations,Q.bestFitness);

      // 10. Termination: stop after (nMaxSimilarFitness - 1) consecutive generations
      //     with unchanged best fitness (and penalty <= 0, which is always true here)
      const nCurrFitness=Q.bestFitness;
      if(nCurrFitness===nPrevFitness&&Q.lowestPenalty<=0)nSimPrevFitnessCount++;
      else nSimPrevFitnessCount=0;
      if(nSimPrevFitnessCount>=this.nMaxSimilarFitness-1)break;
      nPrevFitness=nCurrFitness;

      t++;
    }

    return{finalPopulation:Pprev,generationsRun:t,fitnessHistory:hist};
  }
}

// Public API: EXACT port of the desktop's GA-based picker assignment.
// Returns per-picker location assignment AND per-picker optimized sequence
// together (both come from the same chromosome, exactly as the desktop app
// produces them — there is no separate route-sequencing pass).
export function optimizeAssignment(pickLocIds,pickerNames,locations,gaOpts={},progressCb=null){
  const k=pickerNames.length;
  const assignment={},sequence={};
  pickerNames.forEach(n=>{assignment[n]=[];sequence[n]=[];});
  if(!k||!pickLocIds.length)return{assignment,sequence,fitnessHistory:[0],generationsRun:0,totalCost:0};

  const ga=new PickerRouteGAImpl(
    k,
    gaOpts.popSize??200,
    gaOpts.maxGen??400,
    gaOpts.crossoverProb??0.85,
    gaOpts.mutationProb??0.05,
    gaOpts.survivorRatio??0.10,
    pickLocIds,
    gaOpts.maxSimilar??150,
    locations,
  );
  const{finalPopulation,generationsRun,fitnessHistory}=ga.executeGAAlgorithm(progressCb);
  const best=finalPopulation.chromosomePopulation[finalPopulation.bestChromosomeID];

  const machineIDs=[...best.machines.keys()].sort((a,b)=>a-b);
  for(const mid of machineIDs){
    const pickerName=pickerNames[mid];
    if(!pickerName)continue; // defensive: shouldn't happen since nMachines===k
    const machine=best.machines.get(mid);
    for(const[,job]of machine.assignedJobs){
      const locId=pickLocIds[job.jobID];
      assignment[pickerName].push(locId);
      sequence[pickerName].push(locId);
    }
  }
  return{assignment,sequence,fitnessHistory,generationsRun,totalCost:best.chromosomeFitness};
}