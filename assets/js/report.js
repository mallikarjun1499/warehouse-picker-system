'use strict';
import { toast } from './ui.js';

/* ─── Excel export ─────────────────────────────────────────────────────────── */
export function exportExcel(results) {
  const XLSX = window.XLSX;
  if (!XLSX)          { toast('SheetJS not loaded', 'error'); return; }
  if (!results?.length){ toast('No results to export', 'warn');  return; }

  const wb  = XLSX.utils.book_new();
  const r   = results[0];           // batch is always one result object

  /* ── Summary sheet ── */
  const ordersStr = (r.ordersIncluded || []).join(', ') || r.orderId || '—';
  const sum = [
    ['Batch Optimization Report'],
    ['Generated', new Date().toLocaleString()],
    [],
    ['Assigned Picker',        r.assignedPicker  || 'Unassigned'],
    ['Orders Included',        ordersStr],
    ['Total Unique Pick Locs', r.numPickLocations],
    ['Total Travel Distance',  +r.totalDistance.toFixed(2)],
    ['Est. Travel Time (min)', +r.travelTimeMin.toFixed(2)],
    [],
    ['Optimized Route'],
    [(r.optimizedRoute || []).map(id => id === 0 ? 'DEPOT' : id).join(' -> ')],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sum), 'Summary');

  /* ── Step-by-step sheet ── */
  if (r.steps?.length) {
    const steps = [
      ['Step', 'Pick Location', 'Block', 'Distance (m)', 'Travel Time (s)'],
      ...r.steps.map(s => [
        s.step,
        s.isDepot ? 'DEPOT' : s.locId,
        s.block  || '-',
        +s.distanceM.toFixed(2),
        +s.timeSec.toFixed(2),
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(steps), 'Route Steps');
  }

  /* ── Orders included sheet ── */
  if (r.ordersIncluded?.length) {
    const oSheet = [
      ['#', 'Order ID'],
      ...r.ordersIncluded.map((id, i) => [i + 1, id]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(oSheet), 'Orders Included');
  }

  XLSX.writeFile(wb, 'warehouse_batch_report.xlsx');
  toast('Excel downloaded!', 'success');
}

/* ─── PDF export ───────────────────────────────────────────────────────────── */
export function exportPDF(results) {
  const jsPDFCls = (window.jspdf?.jsPDF) || window.jsPDF;
  if (!jsPDFCls)       { toast('jsPDF not loaded', 'error'); return; }
  if (!results?.length){ toast('No results to export', 'warn'); return; }

  const doc = new jsPDFCls({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = 210, M = 14;
  const r   = results[0];

  /* ── Header bar ── */
  doc.setFillColor(15, 23, 42);  doc.rect(0, 0, PW, 22, 'F');
  doc.setFillColor(59, 130, 246);doc.rect(0, 0, 5,  22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13); doc.setTextColor(241, 245, 249);
  doc.text('Warehouse Batch Picker Route Report', PW / 2, 14, { align: 'center' });

  let y = 29;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date().toLocaleString()}  |  Walking speed: 84 m/min`,
    M, y
  );
  y += 8;

  /* ── Batch summary section ── */
  _sec(doc, 'Batch Optimization Summary', y); y += 9;

  const ordersStr = (r.ordersIncluded || []).join(', ') || r.orderId || '—';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9); doc.setTextColor(30, 30, 30);

  const metaRows = [
    ['Assigned Picker',          r.assignedPicker || 'Unassigned'],
    ['Orders Included',          ordersStr],
    ['Total Unique Pick Locations', String(r.numPickLocations)],
    ['Total Travel Distance',    r.totalDistance.toFixed(2) + ' m'],
    ['Estimated Travel Time',    r.travelTimeMin.toFixed(2)  + ' min'],
  ];
  doc.autoTable({
    startY: y,
    head:   [['Field', 'Value']],
    body:   metaRows,
    styles:          { fontSize: 9, cellPadding: 3.5, textColor: [30, 30, 30] },
    headStyles:      { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles:    { 0: { fontStyle: 'bold', cellWidth: 70 } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: M, right: M },
  });
  y = doc.lastAutoTable.finalY + 8;

  /* ── Route sequence ── */
  if (y > 230) { doc.addPage(); y = 18; }
  _sec(doc, 'Optimized Picking Sequence', y); y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); doc.setTextColor(40, 40, 40);
  const seq = (r.optimizedRoute || []).map(id => id === 0 ? 'DEPOT' : id).join(' -> ');
  const seqLines = doc.splitTextToSize(seq, PW - M * 2);
  doc.text(seqLines, M, y);
  y += seqLines.length * 4 + 8;

  /* ── Step-by-step table ── */
  if (r.steps?.length) {
    if (y > 220) { doc.addPage(); y = 18; }
    _sec(doc, 'Picker Step Table', y); y += 9;
    doc.autoTable({
      startY: y,
      head:   [['Step', 'Pick Location', 'Block', 'Distance (m)', 'Travel Time (s)']],
      body:   r.steps.map(s => [
        s.step,
        s.isDepot ? 'DEPOT' : s.locId,
        s.block   || '-',
        s.distanceM.toFixed(1),
        s.timeSec.toFixed(1),
      ]),
      styles:          { fontSize: 8, cellPadding: 2.8, textColor: [30, 30, 30] },
      headStyles:      { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    });
    y = doc.lastAutoTable.finalY + 8;
  }

  /* ── Orders included table ── */
  if (r.ordersIncluded?.length) {
    if (y > 230) { doc.addPage(); y = 18; }
    _sec(doc, 'Orders Included in Batch', y); y += 9;
    doc.autoTable({
      startY: y,
      head:   [['#', 'Order ID']],
      body:   r.ordersIncluded.map((id, i) => [i + 1, id]),
      styles:          { fontSize: 8, cellPadding: 3, textColor: [30, 30, 30] },
      headStyles:      { fillColor: [30, 58, 138], textColor: [255, 255, 255] },
      columnStyles:    { 0: { cellWidth: 18 } },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: M, right: M },
    });
  }

  /* ── Footer on every page ── */
  const tp = doc.internal.getNumberOfPages();
  for (let i = 1; i <= tp; i++) {
    doc.setPage(i);
    doc.setFillColor(226, 232, 240); doc.rect(0, 284, PW, 13, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7); doc.setTextColor(100, 116, 139);
    doc.text('Warehouse Picker Route Optimization System — Batch Report', M, 291);
    doc.text(`Page ${i} / ${tp}`, PW - M, 291, { align: 'right' });
  }

  doc.save('warehouse_batch_report.pdf');
  toast('PDF downloaded!', 'success');
}

/* ─── Helper ────────────────────────────────────────────────────────────────── */
function _sec(doc, title, y) {
  doc.setFillColor(30, 41, 59);  doc.rect(14, y - 4, 182, 9, 'F');
  doc.setFillColor(59, 130, 246);doc.rect(14, y - 4, 3,   9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9); doc.setTextColor(241, 245, 249);
  doc.text(title, 20, y + 1.5);
  doc.setTextColor(0, 0, 0);
}
