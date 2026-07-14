'use strict';

export const AppState = {
  orders:      {},
  locations:   {},
  pickers:     [],
  results:     {},        // keyed results (batch writes '__batch__' key)
  batchResult: null,      // the single batch optimization result
  assignments: {},
  dataLoaded:  false,
  gaOptions: {
    popSize: 50, maxGen: 200, crossoverProb: 0.85,
    mutationProb: 0.15, survivorRatio: 0.3, maxSimilar: 30,
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
      assignments: AppState.assignments,
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

export function getPickerForOrder(orderId) {
  return AppState.assignments[orderId] || 'Unassigned';
}

export function updatePickerStatus() {
  const busy = new Set(Object.values(AppState.assignments));
  AppState.pickers.forEach(p => {
    p.status = busy.has(p.name) ? 'Busy' : 'Available';
    p.assignedOrderId =
      Object.entries(AppState.assignments).find(([, n]) => n === p.name)?.[0] ?? null;
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
