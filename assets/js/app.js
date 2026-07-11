'use strict';
export const AppState={orders:{},locations:{},pickers:[],results:{},assignments:{},dataLoaded:false,gaOptions:{popSize:50,maxGen:200,crossoverProb:.85,mutationProb:.15,survivorRatio:.3,maxSimilar:30}};
export function saveState(){try{localStorage.setItem('wms_state',JSON.stringify({orders:AppState.orders,locations:AppState.locations,pickers:AppState.pickers,results:AppState.results,assignments:AppState.assignments,dataLoaded:AppState.dataLoaded,gaOptions:AppState.gaOptions}));}catch(e){}}
export function loadState(){try{const r=localStorage.getItem('wms_state');if(!r)return;const s=JSON.parse(r);Object.assign(AppState,s);if(AppState.locations)Object.values(AppState.locations).forEach(l=>{l.x=Number(l.x)||0;l.y=Number(l.y)||0;l.aisle=Number(l.aisle)||0;});}catch(e){}}
export function getPickerForOrder(id){return AppState.assignments[id]||'Unassigned';}
export function updatePickerStatus(){const busy=new Set(Object.values(AppState.assignments));AppState.pickers.forEach(p=>{p.status=busy.has(p.name)?'Busy':'Available';p.assignedOrderId=Object.entries(AppState.assignments).find(([,n])=>n===p.name)?.[0]??null;});}
export function initUI(){
  loadState();
  if(window.AOS)AOS.init({duration:500,once:true,offset:40});
  const pages={'dashboard':'index.html','load-data':'load-data.html','orders':'orders.html','pickers':'pickers.html','optimize':'optimize.html','reports':'reports.html'};
  const cur=location.pathname.split('/').pop()||'index.html';
  document.querySelectorAll('[data-page]').forEach(el=>{const t=pages[el.dataset.page]||'index.html';if(cur===t||(cur===''&&t==='index.html'))el.classList.add('active');else el.classList.remove('active');});
  const toggle=document.getElementById('sidebarToggle'),sidebar=document.getElementById('sidebar'),overlay=document.getElementById('sidebarOverlay');
  if(toggle&&sidebar){toggle.addEventListener('click',()=>{sidebar.classList.toggle('open');overlay?.classList.toggle('hidden');});overlay?.addEventListener('click',()=>{sidebar.classList.remove('open');overlay.classList.add('hidden');});}
}
