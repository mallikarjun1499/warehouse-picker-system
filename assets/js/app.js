'use strict';

export const AppState = {
  orders:      {},
  locations:   {},
  pickers:     [],
  results:     {},        // keyed results (batch writes '__batch__' key)
  batchResult: null,      // legacy: mirrors pickerResults[0] for old pages
  pickerResults: [],      // Step 5: one optimized route result PER PICKER
                           // (unique locations are assigned to pickers, not orders)
  dataLoaded:  false,
  gaOptions: {
    // Matches the desktop app's OptimizeUI.Designer.cs default NumericUpDown
    // values exactly: numUpPopSize=200, numUpMaxGen=400,
    // numUpCrossoverProbability=0.85, numUpMutationProbability=0.05,
    // numUpSurvivorPopRatio=0.10, numUpSimilarFitness=150.
    popSize: 200, maxGen: 400, crossoverProb: 0.85,
    mutationProb: 0.05, survivorRatio: 0.10, maxSimilar: 150,
  },
};

export function saveState() {
  try {
    localStorage.setItem('wms_state', JSON.stringify({
      orders:      AppState.orders,
      locations:   AppState.locations,
      pickers:     AppState.pickers,
      results:     AppState.results,
      batchResult: AppState.batchResult,
      pickerResults: AppState.pickerResults,
      dataLoaded:  AppState.dataLoaded,
      gaOptions:   AppState.gaOptions,
    }));
  } catch (_) {}
}

export function loadState() {
  try {
    const raw = localStorage.getItem('wms_state');
    if (!raw) return;
    const s = JSON.parse(raw);
    Object.assign(AppState, s);
    if (!Array.isArray(AppState.pickerResults)) AppState.pickerResults = [];
    // Ensure location numbers survive JSON round-trip
    if (AppState.locations) {
      Object.entries(AppState.locations).forEach(([k, v]) => {
        if (v.loc_id == null) v.loc_id = Number(k);
        v.x     = Number(v.x)     || 0;
        v.y     = Number(v.y)     || 0;
        v.aisle = Number(v.aisle) || Number(v.x) || 0;
      });
    }
  } catch (_) {}
}

// Build a pick-location -> picker-name lookup from the latest per-picker
// optimization results. Locations are assigned to pickers, never orders,
// so this is the ONLY source of truth for "which picker handles this".
export function locationToPickerMap() {
  const map = {};
  (AppState.pickerResults || []).forEach(r => {
    (r.assignedLocations || []).forEach(locId => { map[locId] = r.assignedPicker; });
  });
  return map;
}

// An order's lines can land on different pickers, because pick LOCATIONS
// (not orders) are what get balanced across pickers. Returns the distinct
// picker name(s) currently covering this order's locations.
export function getPickersForOrder(orderId) {
  const order = AppState.orders[orderId];
  if (!order) return [];
  const map = locationToPickerMap();
  const names = new Set();
  order.lines.forEach(l => { if (map[l.pickLocation]) names.add(map[l.pickLocation]); });
  return [...names];
}

export function updatePickerStatus() {
  const map = locationToPickerMap();
  const locsByPicker = {};
  Object.entries(map).forEach(([locId, name]) => {
    (locsByPicker[name] ||= []).push(locId);
  });
  AppState.pickers.forEach(p => {
    const locs = locsByPicker[p.name] || [];
    p.status = locs.length ? 'Busy' : 'Available';
    p.assignedLocationCount = locs.length;
  });
}

export function initUI() {
  loadState();
  if (window.AOS) AOS.init({ duration: 500, once: true, offset: 40 });

  // Highlight active nav link
  const pages = {
    'dashboard': 'index.html', 'load-data': 'load-data.html',
    'orders': 'orders.html',   'pickers': 'pickers.html',
    'optimize': 'optimize.html', 'reports': 'reports.html',
  };
  const cur = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-page]').forEach(el => {
    const t = pages[el.dataset.page] || 'index.html';
    if (cur === t || (cur === '' && t === 'index.html'))
      el.classList.add('active');
    else
      el.classList.remove('active');
  });

  // Mobile sidebar toggle
  const toggle  = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
      overlay?.classList.toggle('hidden');
    });
    overlay?.addEventListener('click', () => {
      sidebar.classList.remove('open');
      overlay.classList.add('hidden');
    });
  }
}