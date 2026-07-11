'use strict';
import{toast}from'./ui.js';

export function exportExcel(results){
  const XLSX=window.XLSX;
  if(!XLSX){toast('SheetJS not loaded','error');return;}
  if(!results?.length){toast('No results to export','warn');return;}
  const wb=XLSX.utils.book_new();
  const sum=[['Order ID','Assigned Picker','Pick Locations','Travel Distance (m)','Est. Travel Time (min)','Optimized Route'],
    ...results.map(r=>[r.orderId,r.assignedPicker||'Unassigned',r.numPickLocations,+r.totalDistance.toFixed(2),+r.travelTimeMin.toFixed(2),(r.optimizedRoute||[]).map(id=>id===0?'DEPOT':id).join(' -> ')])];
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(sum),'Summary');
  for(const r of results){
    if(!r.steps?.length)continue;
    const data=[['Step','Pick Location','Block','Distance (m)','Travel Time (s)'],...r.steps.map(s=>[s.step,s.isDepot?'DEPOT':s.locId,s.block||'-',+s.distanceM.toFixed(2),+s.timeSec.toFixed(2)])];
    XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet(data),String(r.orderId||'order').slice(0,25).concat('_rt').slice(0,31));
  }
  XLSX.writeFile(wb,'warehouse_picker_report.xlsx');
  toast('Excel downloaded!','success');
}

export function exportPDF(results){
  const jsPDFCls=(window.jspdf?.jsPDF)||window.jsPDF;
  if(!jsPDFCls){toast('jsPDF not loaded','error');return;}
  if(!results?.length){toast('No results to export','warn');return;}
  const doc=new jsPDFCls({orientation:'portrait',unit:'mm',format:'a4'});
  const PW=210,M=14;
  // Header
  doc.setFillColor(15,23,42);doc.rect(0,0,PW,22,'F');
  doc.setFillColor(59,130,246);doc.rect(0,0,5,22,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(13);doc.setTextColor(241,245,249);
  doc.text('Warehouse Picker Route Report',PW/2,14,{align:'center'});
  let y=29;
  doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(100,116,139);
  doc.text(`Generated: ${new Date().toLocaleString()}  |  Speed: 84 m/min`,M,y);y+=7;
  // Summary table
  _sec(doc,'Route Optimization Summary',y);y+=9;
  doc.autoTable({startY:y,
    head:[['Order ID','Picker','Locations','Distance','Est. Time']],
    body:results.map(r=>[r.orderId,r.assignedPicker||'Unassigned',r.numPickLocations,r.totalDistance.toFixed(1)+' m',r.travelTimeMin.toFixed(2)+' min']),
    styles:{fontSize:8,cellPadding:3,textColor:[30,30,30]},
    headStyles:{fillColor:[30,58,138],textColor:[255,255,255],fontStyle:'bold'},
    alternateRowStyles:{fillColor:[248,250,252]},
    margin:{left:M,right:M}});
  y=doc.lastAutoTable.finalY+8;
  // Per-order detail
  for(const r of results){
    if(y>238){doc.addPage();y=18;}
    _sec(doc,`Order: ${r.orderId}`,y);y+=8;
    doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(40,40,40);
    doc.text(`Picker: ${r.assignedPicker||'Unassigned'}`,M,y);
    doc.text(`Pick Locations: ${r.numPickLocations}`,90,y);y+=5;
    doc.text(`Distance: ${r.totalDistance.toFixed(2)} m`,M,y);
    doc.text(`Est. Time: ${r.travelTimeMin.toFixed(2)} min`,90,y);y+=5;
    doc.setFont('helvetica','bold');doc.text('Route Sequence:',M,y);y+=4;
    doc.setFont('helvetica','normal');
    const seq=(r.optimizedRoute||[]).map(id=>id===0?'DEPOT':id).join(' -> ');
    const lines=doc.splitTextToSize(seq,PW-M*2);
    doc.text(lines,M,y);y+=lines.length*4+4;
    if(r.steps?.length){
      doc.autoTable({startY:y,
        head:[['Step','Pick Location','Block','Distance (m)','Time (s)']],
        body:r.steps.map(s=>[s.step,s.isDepot?'DEPOT':s.locId,s.block||'-',s.distanceM.toFixed(1),s.timeSec.toFixed(1)]),
        styles:{fontSize:7.5,cellPadding:2.5,textColor:[30,30,30]},
        headStyles:{fillColor:[30,58,138],textColor:[255,255,255]},
        alternateRowStyles:{fillColor:[248,250,252]},
        margin:{left:M,right:M}});
      y=doc.lastAutoTable.finalY+10;
    }
  }
  const tp=doc.internal.getNumberOfPages();
  for(let i=1;i<=tp;i++){
    doc.setPage(i);doc.setFillColor(226,232,240);doc.rect(0,284,PW,13,'F');
    doc.setFont('helvetica','normal');doc.setFontSize(7);doc.setTextColor(100,116,139);
    doc.text('Warehouse Picker Route Optimization System',M,291);
    doc.text(`Page ${i} / ${tp}`,PW-M,291,{align:'right'});
  }
  doc.save('warehouse_picker_report.pdf');
  toast('PDF downloaded!','success');
}

function _sec(doc,title,y){
  doc.setFillColor(30,41,59);doc.rect(14,y-4,182,9,'F');
  doc.setFillColor(59,130,246);doc.rect(14,y-4,3,9,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(241,245,249);
  doc.text(title,20,y+1.5);doc.setTextColor(0,0,0);
}
