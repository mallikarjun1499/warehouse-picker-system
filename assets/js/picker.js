'use strict';
import{AppState,saveState,updatePickerStatus}from'./app.js';
let _id=Date.now();

// Define the available pickers (Step 4). Pickers are never linked to a
// specific order here or anywhere else — pick LOCATIONS are assigned to
// them independently during optimization (see optimize.html Step 5).
export function addPicker(name){
  const n=(name||'').trim();
  if(!n)return{ok:false,msg:'Name cannot be empty.'};
  if(AppState.pickers.find(p=>p.name===n))return{ok:false,msg:`"${n}" already exists.`};
  AppState.pickers.push({id:_id++,name:n,status:'Available',assignedLocationCount:0});
  updatePickerStatus();saveState();return{ok:true};
}
export function removePicker(name){
  AppState.pickers=AppState.pickers.filter(p=>p.name!==name);
  updatePickerStatus();saveState();
}