'use strict';
export function toast(msg,type='info'){
  document.querySelectorAll('.wms-toast').forEach(t=>t.remove());
  const C={success:'#16a34a',error:'#dc2626',info:'#2563eb',warn:'#d97706'};
  const el=document.createElement('div');
  el.className='wms-toast';
  el.style.cssText=`position:fixed;top:20px;right:20px;z-index:9999;padding:12px 20px;border-radius:12px;color:#fff;font-size:14px;font-weight:600;font-family:Inter,sans-serif;background:${C[type]||C.info};box-shadow:0 8px 32px rgba(0,0,0,.4);max-width:340px;transition:opacity .3s;`;
  el.textContent=msg;document.body.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';setTimeout(()=>el.remove(),350);},3000);
}

export function drawWarehouseMap(canvas,locations,route){
  const ctx=canvas.getContext('2d'),W=canvas.width,H=canvas.height,PAD=52;
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#0f172a';ctx.fillRect(0,0,W,H);
  const racks=Object.values(locations).filter(l=>l.loc_id!==0);
  if(!racks.length)return;
  const xs=racks.map(l=>l.x),ys=racks.map(l=>l.y);
  const minX=Math.min(...xs)-1,maxX=Math.max(...xs)+1,minY=Math.min(...ys)-1,maxY=Math.max(...ys)+1;
  const rX=maxX-minX||1,rY=maxY-minY||1;
  const cx=x=>PAD+((x-minX)/rX)*(W-PAD*2);
  const cy=y=>H-PAD-((y-minY)/rY)*(H-PAD*2);
  // Aisle guides
  const aisles=[...new Set(racks.map(l=>l.x))].sort((a,b)=>a-b);
  ctx.strokeStyle='rgba(51,65,85,.35)';ctx.lineWidth=1;
  aisles.forEach(ax=>{ctx.beginPath();ctx.moveTo(cx(ax),PAD);ctx.lineTo(cx(ax),H-PAD);ctx.stroke();});
  // Rack dots
  racks.forEach(l=>{ctx.fillStyle='#1e293b';ctx.strokeStyle='#334155';ctx.lineWidth=.5;ctx.beginPath();ctx.rect(cx(l.x)-5,cy(l.y)-5,10,10);ctx.fill();ctx.stroke();});
  // Pick locations
  const picks=new Set(route.filter(id=>id!==0));
  picks.forEach(id=>{
    const l=locations[id];if(!l)return;
    const lx=cx(l.x),ly=cy(l.y);
    ctx.fillStyle='#f59e0b';ctx.strokeStyle='#fbbf24';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.rect(lx-10,ly-10,20,20);ctx.fill();ctx.stroke();
    ctx.fillStyle='#0f172a';ctx.font='bold 7px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(id).slice(0,4),lx,ly);
  });
  // Step badges (no lines)
  route.forEach((id,idx)=>{
    if(id===0)return;const l=locations[id];if(!l)return;
    const lx=cx(l.x)+14,ly=cy(l.y)-14;
    ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(lx,ly,9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 8px Inter,sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(idx),lx,ly);
  });
  // Depot star
  ctx.font='20px sans-serif';ctx.fillStyle='#10b981';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText('★',cx(minX+.5),H-PAD+14);
  ctx.font='bold 9px Inter,sans-serif';ctx.fillText('DEPOT',cx(minX+.5),H-PAD+28);
  // Legend
  ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillStyle='#f59e0b';ctx.fillRect(PAD,10,10,10);
  ctx.fillStyle='#94a3b8';ctx.font='10px Inter,sans-serif';ctx.fillText('Pick Loc',PAD+14,15);
  ctx.fillStyle='#3b82f6';ctx.beginPath();ctx.arc(PAD+100,15,7,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#94a3b8';ctx.fillText('Step#',PAD+112,15);
  ctx.fillStyle='#10b981';ctx.font='14px sans-serif';ctx.fillText('★',PAD+180,15);
  ctx.fillStyle='#94a3b8';ctx.font='10px Inter,sans-serif';ctx.fillText('Depot',PAD+196,15);
}

export function routeSequenceHTML(route){
  if(!route||!route.length)return'<p style="color:#64748b">No route.</p>';
  return route.map((id,i)=>{
    const label=id===0?'DEPOT':String(id);
    const bg=id===0?'rgba(16,185,129,.25)':'rgba(59,130,246,.2)';
    const border=id===0?'rgba(16,185,129,.5)':'rgba(59,130,246,.4)';
    const color=id===0?'#6ee7b7':'#93c5fd';
    const badge=`<span style="display:inline-flex;align-items:center;padding:4px 10px;border-radius:8px;font-size:13px;font-weight:700;background:${bg};border:1px solid ${border};color:${color};font-family:monospace;">${label}</span>`;
    const arrow=i<route.length-1?`<span style="color:#475569;font-size:11px;margin:0 3px;">&rsaquo;</span>`:'';
    return badge+arrow;
  }).join('');
}

export function stepTableHTML(steps){
  if(!steps||!steps.length)return'<p style="padding:16px;color:#64748b;font-size:13px;">No steps.</p>';
  const rows=steps.map(s=>`
    <tr style="border-bottom:1px solid #1e293b;">
      <td style="padding:9px 13px;text-align:center;"><span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:rgba(59,130,246,.2);color:#93c5fd;font-size:12px;font-weight:700;">${s.step}</span></td>
      <td style="padding:9px 13px;text-align:center;font-family:monospace;font-weight:700;">${s.isDepot?'<span style="color:#10b981;">DEPOT</span>':`<span style="color:#fbbf24;">${s.locId}</span>`}</td>
      <td style="padding:9px 13px;text-align:center;color:#94a3b8;">${s.block}</td>
      <td style="padding:9px 13px;text-align:center;color:#e2e8f0;">${s.distanceM.toFixed(1)} m</td>
      <td style="padding:9px 13px;text-align:center;color:#e2e8f0;">${s.timeSec.toFixed(1)} s</td>
    </tr>`).join('');
  return`<table style="width:100%;border-collapse:collapse;font-size:13px;">
    <thead><tr style="background:#1e293b;">
      <th style="padding:10px 13px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:center;">Step</th>
      <th style="padding:10px 13px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:center;">Pick Location</th>
      <th style="padding:10px 13px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:center;">Block</th>
      <th style="padding:10px 13px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:center;">Distance</th>
      <th style="padding:10px 13px;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:.05em;text-align:center;">Time</th>
    </thead><tbody>${rows}</tbody></table>`;
}

export function showLoading(msg='Optimizing...'){
  if(!document.getElementById('_spinSt')){const s=document.createElement('style');s.id='_spinSt';s.textContent='@keyframes _spin{to{transform:rotate(360deg)}}';document.head.appendChild(s);}
  let el=document.getElementById('_wmsLoading');
  if(!el){
    el=document.createElement('div');el.id='_wmsLoading';
    el.style.cssText='position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;background:rgba(10,15,30,.92);backdrop-filter:blur(6px);';
    el.innerHTML=`<div style="text-align:center;">
      <div style="position:relative;width:72px;height:72px;margin:0 auto 18px;">
        <div style="position:absolute;inset:0;border-radius:50%;border:4px solid rgba(59,130,246,.15);"></div>
        <div style="position:absolute;inset:0;border-radius:50%;border:4px solid transparent;border-top-color:#3b82f6;animation:_spin .8s linear infinite;"></div>
        <div style="position:absolute;inset:8px;border-radius:50%;border:4px solid transparent;border-top-color:rgba(59,130,246,.4);animation:_spin 1.5s linear infinite;"></div>
      </div>
      <p id="_wmsLMsg" style="color:#f1f5f9;font-weight:700;font-size:17px;margin-bottom:7px;font-family:Inter,sans-serif;"></p>
      <p id="_wmsLDet" style="color:#64748b;font-size:13px;margin-bottom:14px;font-family:Inter,sans-serif;">Starting...</p>
      <div style="width:240px;height:4px;background:#1e293b;border-radius:4px;margin:0 auto;">
        <div id="_wmsLBar" style="height:4px;background:#3b82f6;border-radius:4px;width:0%;transition:width .2s;"></div>
      </div></div>`;
    document.body.appendChild(el);
  }
  el.style.display='flex';
  document.getElementById('_wmsLMsg').textContent=msg;
}
export function updateLoadingProgress(gen,total,best){
  const d=document.getElementById('_wmsLDet'),b=document.getElementById('_wmsLBar');
  if(d)d.textContent=`Generation ${gen} / ${total} — Best: ${best.toFixed(1)} m`;
  if(b)b.style.width=Math.round(gen/total*100)+'%';
}
export function hideLoading(){const el=document.getElementById('_wmsLoading');if(el)el.style.display='none';}
