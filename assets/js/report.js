'use strict';
import { toast } from './ui.js';

/* ─── Excel export ─────────────────────────────────────────────────────────── */
/* `results` holds ONE entry PER PICKER — unique pick locations were assigned
   to pickers (not orders), and the existing GA was run independently for
   each picker, so every picker gets its own set of sheets below.          */
export function exportExcel(results) {
  const XLSX = window.XLSX;
  if (!XLSX)          { toast('SheetJS not loaded', 'error'); return; }
  if (!results?.length){ toast('No results to export', 'warn');  return; }

  const wb = XLSX.utils.book_new();

  /* ── Overview sheet: every picker, one row each ── */
  const ordersStr = (results[0]?.ordersIncluded || []).join(', ') || '—';
  const overview = [
    ['Warehouse Picker Route Optimization — Overview'],
    ['Generated', new Date().toLocaleString()],
    ['Orders Merged Into Batch', ordersStr],
    [],
    ['Picker Name', 'Assigned Locations', 'Total Distance (m)', 'Travel Time (min)'],
    ...results.map(r => [
      r.assignedPicker || 'Unassigned',
      r.numPickLocations,
      +r.totalDistance.toFixed(2),
      +r.travelTimeMin.toFixed(2),
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(overview), 'Overview');

  /* ── One sheet per picker: their locations + optimized route + steps ── */
  const usedNames = new Set();
  results.forEach(r => {
    const sheetName = _sheetName(r.assignedPicker || 'Unassigned', usedNames);

    const rows = [
      ['Picker Route Report'],
      ['Picker Name',            r.assignedPicker || 'Unassigned'],
      ['Assigned Locations',     r.numPickLocations],
      ['Total Travel Distance',  +r.totalDistance.toFixed(2)],
      ['Est. Travel Time (min)', +r.travelTimeMin.toFixed(2)],
      [],
      ['Assigned Pick Locations'],
      [(r.assignedLocations || []).join(', ') || '—'],
      [],
      ['Optimized Sequence'],
      [(r.optimizedRoute || []).map(id => id === 0 ? 'DEPOT' : id).join(' -> ')],
      [],
      ['Step', 'Pick Location', 'Block', 'Distance (m)', 'Travel Time (s)'],
      ...(r.steps || []).map(s => [
        s.step,
        s.isDepot ? 'DEPOT' : s.locId,
        s.block  || '-',
        +s.distanceM.toFixed(2),
        +s.timeSec.toFixed(2),
      ]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName);
  });

  /* ── Orders included sheet (shared across all pickers) ── */
  const ordersIncluded = results[0]?.ordersIncluded;
  if (ordersIncluded?.length) {
    const oSheet = [
      ['#', 'Order ID'],
      ...ordersIncluded.map((id, i) => [i + 1, id]),
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(oSheet), 'Orders Included');
  }

  XLSX.writeFile(wb, 'warehouse_picker_report.xlsx');
  toast('Excel downloaded!', 'success');
}

/* Build a safe, unique, <=31-char Excel sheet name from a picker name */
function _sheetName(name, usedNames) {
  let base = String(name).replace(/[:\\/?*\[\]]/g, '').trim().slice(0, 28) || 'Picker';
  let candidate = base, n = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${base.slice(0, 28 - String(n).length - 1)}-${n}`;
    n++;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

/* ─── PDF export ───────────────────────────────────────────────────────────── */
/* `results` holds ONE entry PER PICKER. Page 1 is an all-pickers overview;
   every picker then gets their own section with their assigned locations,
   optimized sequence, and step table.                                     */
export function exportPDF(results) {
  const jsPDFCls = (window.jspdf?.jsPDF) || window.jsPDF;
  if (!jsPDFCls)       { toast('jsPDF not loaded', 'error'); return; }
  if (!results?.length){ toast('No results to export', 'warn'); return; }

  const doc = new jsPDFCls({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const PW  = 210, M = 14;

  _header(doc, PW, 'Warehouse Picker Route Optimization Report');

  let y = 29;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  doc.text(
    `Generated: ${new Date().toLocaleString()}  |  Walking speed: 84 m/min  |  Pickers: ${results.length}`,
    M, y
  );
  y += 8;

  /* ── All-pickers overview ── */
  _sec(doc, 'All Pickers Overview', y); y += 9;
  const ordersStr = (results[0]?.ordersIncluded || []).join(', ') || '—';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8); doc.setTextColor(100, 116, 139);
  const ordersLines = doc.splitTextToSize(`Orders merged into this batch: ${ordersStr}`, PW - M * 2);
  doc.text(ordersLines, M, y);
  y += ordersLines.length * 4 + 4;

  doc.autoTable({
    startY: y,
    head:   [['Picker Name', 'Assigned Locations', 'Distance (m)', 'Travel Time (min)']],
    body:   results.map(r => [
      r.assignedPicker || 'Unassigned',
      String(r.numPickLocations),
      r.totalDistance.toFixed(2),
      r.travelTimeMin.toFixed(2),
    ]),
    styles:          { fontSize: 9, cellPadding: 3.5, textColor: [30, 30, 30] },
    headStyles:      { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: M, right: M },
  });
  y = doc.lastAutoTable.finalY + 8;

  /* ── One section per picker ── */
  results.forEach(r => {
    doc.addPage(); y = 18;
    _sec(doc, `Picker: ${r.assignedPicker || 'Unassigned'}`, y); y += 9;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9); doc.setTextColor(30, 30, 30);
    const metaRows = [
      ['Picker Name',            r.assignedPicker || 'Unassigned'],
      ['Assigned Locations',     String(r.numPickLocations)],
      ['Total Travel Distance',  r.totalDistance.toFixed(2) + ' m'],
      ['Estimated Travel Time',  r.travelTimeMin.toFixed(2)  + ' min'],
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

    /* Assigned locations */
    if (y > 230) { doc.addPage(); y = 18; }
    _sec(doc, 'Assigned Locations', y); y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); doc.setTextColor(40, 40, 40);
    const locsStr = (r.assignedLocations || []).join(', ') || '—';
    const locsLines = doc.splitTextToSize(locsStr, PW - M * 2);
    doc.text(locsLines, M, y);
    y += locsLines.length * 4 + 8;

    /* Optimized sequence */
    if (y > 230) { doc.addPage(); y = 18; }
    _sec(doc, 'Optimized Sequence', y); y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8); doc.setTextColor(40, 40, 40);
    const seq = (r.optimizedRoute || []).map(id => id === 0 ? 'DEPOT' : id).join(' -> ');
    const seqLines = doc.splitTextToSize(seq, PW - M * 2);
    doc.text(seqLines, M, y);
    y += seqLines.length * 4 + 8;

    /* Step-by-step table */
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
  });

  /* ── Orders included table (shared, appended once at the end) ── */
  const ordersIncluded = results[0]?.ordersIncluded;
  if (ordersIncluded?.length) {
    doc.addPage(); y = 18;
    _sec(doc, 'Orders Included in Batch', y); y += 9;
    doc.autoTable({
      startY: y,
      head:   [['#', 'Order ID']],
      body:   ordersIncluded.map((id, i) => [i + 1, id]),
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
    doc.text('Warehouse Picker Route Optimization System — Picker Report', M, 291);
    doc.text(`Page ${i} / ${tp}`, PW - M, 291, { align: 'right' });
  }

  doc.save('warehouse_picker_report.pdf');
  toast('PDF downloaded!', 'success');
}

/* ─── Helpers ───────────────────────────────────────────────────────────────── */
function _header(doc, PW, title) {
  doc.setFillColor(15, 23, 42);  doc.rect(0, 0, PW, 22, 'F');
  doc.setFillColor(59, 130, 246);doc.rect(0, 0, 5,  22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13); doc.setTextColor(241, 245, 249);
  doc.text(title, PW / 2, 14, { align: 'center' });
}

function _sec(doc, title, y) {
  doc.setFillColor(30, 41, 59);  doc.rect(14, y - 4, 182, 9, 'F');
  doc.setFillColor(59, 130, 246);doc.rect(14, y - 4, 3,   9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9); doc.setTextColor(241, 245, 249);
  doc.text(title, 20, y + 1.5);
  doc.setTextColor(0, 0, 0);
}