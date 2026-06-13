(() => {
  'use strict';

  const MADEIRA_CENTER = [32.7607, -16.9595];
  const MADEIRA_BOUNDS = L.latLngBounds(
    [32.6000, -17.3000],
    [33.1200, -16.2500]
  );

  const state = {
    map: null,
    activeLayerKey: 'osm',
    activeBase: null,
    hybridLabels: null,
  };

  const statusEl = document.getElementById('status');
  const layerButtons = Array.from(document.querySelectorAll('[data-layer]'));

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function tileLayer(url, options) {
    return L.tileLayer(url, {
      maxZoom: 19,
      crossOrigin: true,
      updateWhenIdle: true,
      updateWhenZooming: false,
      keepBuffer: 4,
      ...options,
    });
  }

  const layers = {
    osm: () => tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }),
    topo: () => tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      maxZoom: 17,
      attribution: 'Map data &copy; OpenStreetMap contributors, SRTM | Map style &copy; OpenTopoMap',
    }),
    sat: () => tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri',
    }),
    hybrid: () => tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Tiles &copy; Esri | Labels &copy; Carto/OpenStreetMap',
    }),
  };

  function labelLayer() {
    return tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      opacity: 0.92,
      attribution: '&copy; Carto &copy; OpenStreetMap contributors',
      pane: 'labelsPane',
    });
  }

  function setLayer(key) {
    if (!layers[key] || !state.map) return;

    if (state.activeBase) state.map.removeLayer(state.activeBase);
    if (state.hybridLabels) {
      state.map.removeLayer(state.hybridLabels);
      state.hybridLabels = null;
    }

    state.activeLayerKey = key;
    state.activeBase = layers[key]().addTo(state.map);

    if (key === 'hybrid') {
      state.hybridLabels = labelLayer().addTo(state.map);
    }

    layerButtons.forEach((button) => {
      button.classList.toggle('is-active', button.dataset.layer === key);
    });

    setStatus(`Basiskarte: ${keyLabel(key)}`);
    scheduleMapResize();
  }

  function keyLabel(key) {
    return ({ osm: 'OSM', topo: 'Topo', sat: 'Satellit', hybrid: 'Satellit-Hybrid' })[key] || key;
  }

  function scheduleMapResize() {
    if (!state.map) return;
    requestAnimationFrame(() => {
      state.map.invalidateSize({ pan: false });
      setTimeout(() => state.map.invalidateSize({ pan: false }), 180);
    });
  }

  function initMap() {
    state.map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      fadeAnimation: false,
      zoomAnimation: true,
      markerZoomAnimation: false,
      inertia: true,
      worldCopyJump: false,
    });

    state.map.createPane('labelsPane');
    state.map.getPane('labelsPane').style.zIndex = 360;
    state.map.getPane('labelsPane').style.pointerEvents = 'none';

    L.control.zoom({ position: 'bottomright' }).addTo(state.map);

    setLayer('osm');
    state.map.fitBounds(MADEIRA_BOUNDS, { padding: [22, 84], animate: false });
    setStatus('Madeira-Karte bereit. Keine Pins, keine Tracks.');

    window.addEventListener('resize', scheduleMapResize, { passive: true });
    window.addEventListener('orientationchange', () => setTimeout(scheduleMapResize, 260), { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) setTimeout(scheduleMapResize, 120);
    });
  }

  function bindUI() {
    layerButtons.forEach((button) => {
      button.addEventListener('click', () => setLayer(button.dataset.layer));
    });

    document.getElementById('fitMadeira')?.addEventListener('click', () => {
      state.map?.fitBounds(MADEIRA_BOUNDS, { padding: [22, 84], animate: true });
      scheduleMapResize();
    });
  }

  function boot() {
    try {
      bindUI();
      requestAnimationFrame(initMap);
    } catch (error) {
      console.error(error);
      setStatus(`Fehler: ${error.message}`);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
