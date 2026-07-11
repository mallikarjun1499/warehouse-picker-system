'use strict';
import{getLocXY}from'./algorithm.js';
export async function parseExcelFile(buf){
  const XLSX=window.XLSX;if(!XLSX)throw new Error('SheetJS not loaded');
  const wb=XLSX.read(new Uint8Array(buf),{type:'array'});
  const warnings=[];
  if(!wb.SheetNames.includes('Orders'))throw new Error("Missing 'Orders' sheet");
  let coordMap=null;
  if(wb.SheetNames.includes('Coordinates')){try{coordMap=_parseCoords(wb.Sheets['Coordinates'],XLSX);}catch(e){warnings.push('Coords error: '+e.message+'; using built-in map.');}}
  else warnings.push("No 'Coordinates' sheet; using built-in map.");
  const{orders,allLocs}=_parseOrders(wb.Sheets['Orders'],XLSX);
  if(!Object.keys(orders).length)throw new Error('No orders found. Check file format.');
  const locations={};
  locations[0]={loc_id:0,x:1,y:0,aisle:1};
  for(const id of allLocs){const xy=getLocXY(id,coordMap);locations[id]={loc_id:id,x:Number(xy.x),y:Number(xy.y),aisle:Number(xy.x)};}
  return{orders,locations,warnings};
}
function _parseCoords(sheet,XLSX){
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null});
  if(!rows||rows.length<2)throw new Error('Empty');
  let hRow=0;
  for(let i=0;i<Math.min(5,rows.length);i++){const l=(rows[i]||[]).map(v=>String(v??'').toLowerCase());if(l.some(v=>['location','loc','x','y'].includes(v))){hRow=i;break;}}
  const h=(rows[hRow]||[]).map(v=>String(v??'').trim().toLowerCase());
  const iL=h.findIndex(v=>['location','loc','loc_id','id'].includes(v));
  const iX=h.findIndex(v=>v==='x');const iY=h.findIndex(v=>v==='y');
  const lI=iL>=0?iL:0,xI=iX>=0?iX:1,yI=iY>=0?iY:2;
  const m={};
  for(let i=hRow+1;i<rows.length;i++){const r=rows[i];if(!r||r[lI]==null)continue;const id=parseInt(r[lI]),x=parseFloat(r[xI]),y=parseFloat(r[yI]);if(!isNaN(id)&&!isNaN(x)&&!isNaN(y))m[id]={x,y};}
  return m;
}
function _parseOrders(sheet,XLSX){
  const rows=XLSX.utils.sheet_to_json(sheet,{header:1,defval:null});
  const orders={},allLocs=new Set();let cur=null;
  const SKIP=new Set(['line','item','pick','location','pick location','note','notes','qty','quantity','description','desc','part','part no','part number','sample order','sample picklist','order id']);
  for(const row of rows){
    if(!row)continue;
    const vals=row.map(v=>(v!=null?String(v).trim():'')).filter(Boolean);
    if(!vals.length)continue;
    const first=vals[0];
    const lineNum=Number(first);
    if(Number.isInteger(lineNum)&&lineNum>0&&cur&&vals.length>=3){
      const loc=parseInt(vals[2]);
      if(!isNaN(loc)&&loc>0){orders[cur].lines.push({line:lineNum,item:vals[1]||'',pickLocation:loc});allLocs.add(loc);}
      continue;
    }
    for(const v of vals){
      const lo=v.toLowerCase();
      if(SKIP.has(lo))continue;
      if(/^[A-Za-z0-9][A-Za-z0-9_\-\.]{2,}$/.test(v)&&isNaN(Number(v))){
        if(!orders[v]){cur=v;orders[v]={orderId:v,lines:[]};}
        else cur=v;
        break;
      }
    }
  }
  for(const k of Object.keys(orders))if(!orders[k].lines.length)delete orders[k];
  if(!Object.keys(orders).length){
    const fb='ORDER_001';orders[fb]={orderId:fb,lines:[]};
    for(const row of rows){if(!row)continue;const ns=row.map(v=>parseInt(v)).filter(v=>!isNaN(v)&&v>0);if(ns.length>=2){const loc=ns[ns.length-1];orders[fb].lines.push({line:orders[fb].lines.length+1,item:'Item_'+(orders[fb].lines.length+1),pickLocation:loc});allLocs.add(loc);}}
    if(!orders[fb].lines.length)delete orders[fb];
  }
  return{orders,allLocs};
}
export function createSampleExcel(){
  const XLSX=window.XLSX;
  const coords=[['Location','X','Y'],[0,1,0],[57,4,12],[37,4,7],[202,10,23],[58,4,13],[64,7,4],[245,4,21],[52,4,7],[69,7,9],[176,10,27],[247,4,23],[185,10,17],[56,4,11],[136,13,1],[169,13,4],[44,4,14],[73,7,13],[104,10,14],[210,10,14],[82,7,12]];
  const orderRows=[['O09_37609'],['Line','Item','Pick Location'],[1,'Part No. 25997',57],[2,'Part No. 29691',37],[3,'Part No. 13067',202],[4,'Part No. 28385',58],[5,'Part No. 7516',64],[6,'Part No. 6456',245],[7,'Part No. 45809',52],[8,'Part No. 33928',69],[9,'Part No. 58812',176],[10,'Part No. 49382',247],[],['O07_13471'],['Line','Item','Pick Location'],[1,'Part No. 55001',185],[2,'Part No. 55002',56],[3,'Part No. 55003',136],[4,'Part No. 55004',169],[5,'Part No. 55005',44],[6,'Part No. 55006',73],[7,'Part No. 55007',104],[8,'Part No. 55008',210],[9,'Part No. 55009',82],[10,'Part No. 55010',37]];
  const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(coords),'Coordinates');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(orderRows),'Orders');
  return XLSX.write(wb,{bookType:'xlsx',type:'array'});
}
