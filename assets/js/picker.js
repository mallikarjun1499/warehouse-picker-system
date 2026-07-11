'use strict';
import{AppState,saveState,updatePickerStatus}from'./app.js';
let _id=Date.now();
export function addPicker(name){
  const n=(name||'').trim();
  if(!n)return{ok:false,msg:'Name cannot be empty.'};
  if(AppState.pickers.find(p=>p.name===n))return{ok:false,msg:`"${n}" already exists.`};
  AppState.pickers.push({id:_id++,name:n,status:'Available',assignedOrderId:null});
  updatePickerStatus();saveState();return{ok:true};
}
export function removePicker(name){
  AppState.pickers=AppState.pickers.filter(p=>p.name!==name);
  for(const[k,v]of Object.entries(AppState.assignments))if(v===name)delete AppState.assignments[k];
  updatePickerStatus();saveState();
}
export function assignPicker(orderId,name){
  if(!orderId||!name)return;
  AppState.assignments[orderId]=name;
  if(AppState.results[orderId])AppState.results[orderId].assignedPicker=name;
  updatePickerStatus();saveState();
}
export function unassignOrder(orderId){
  delete AppState.assignments[orderId];
  if(AppState.results[orderId])AppState.results[orderId].assignedPicker='Unassigned';
  updatePickerStatus();saveState();
}
