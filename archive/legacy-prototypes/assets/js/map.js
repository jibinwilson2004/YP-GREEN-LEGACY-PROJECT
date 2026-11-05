// Tree Tag GIS & Telemetry Map Engine
document.addEventListener('DOMContentLoaded', () => {
  // 1. Cluster Nodes Data (Including Jibin Wilson's Planted Tree)
  const clusterData = {
    jibin_tree: {
      name: "Mar Baselios Institute (MBITS) — Jibin's Sapling",
      tag: "#TT-8841",
      species: "Tectona grandis (Teak)",
      batchCount: "Planted by Jibin Wilson (Student Reg #22)",
      partner: "APJAKTU NSSCELL NRPF",
      biome: "Academic Micro-Canopy",
      planted: "Planted Oct 14, 2023 • In-Situ Audited & Verified",
      survival: "100%",
      lat: "10.0528° N",
      lon: "76.6346° E",
      co2: "42.5 kg/yr",
      planter: "Jibin Wilson",
      college: "Mar Baselios Institute of Technology and Science-MBI",
      cluster: "EKM",
      accuracy: "±3.2m (98% confidence • 40% Cutoff Passed)"
    },
    kochi: {
      name: "Kochi St. Teresa's Micro-Canopy",
      tag: "#TT-2849",
      species: "Terminalia arjuna (Arjuna)",
      batchCount: "450 saplings tagged",
      partner: "Thanal Agroecology Alliance",
      biome: "Urban Micro-Sanctuary",
      planted: "Planted Nov 2023 • Satellite Monitored",
      survival: "99.4%",
      lat: "9.9312° N",
      lon: "76.2673° E",
      co2: "18.2 t/yr"
    },
    wayanad: {
      name: "Wayanad Shola Bio-Corridor",
      tag: "#TT-8924",
      species: "Swietenia mahagoni (Mahogany)",
      batchCount: "3,347 saplings tagged",
      partner: "Sustera Community Cluster",
      biome: "Agroforestry & Riparian",
      planted: "Planted Oct 2023 • In-Situ Audited",
      survival: "99.8%",
      lat: "11.6854° N",
      lon: "76.1320° E",
      co2: "142.5 t/yr"
    },
    palakkad: {
      name: "Palakkad Gap Central Reserve",
      tag: "#TT-4102",
      species: "Tectona grandis (Teak)",
      batchCount: "10,189 saplings tagged",
      partner: "EcoCare Western Ghats",
      biome: "Agroforestry & Riparian",
      planted: "Planted Aug 2023 • Sentinel-2 Synced",
      survival: "98.9%",
      lat: "10.7867° N",
      lon: "76.6548° E",
      co2: "410.8 t/yr"
    },
    bengaluru: {
      name: "Bengaluru Tech Park Micro-Forest",
      tag: "#TT-5510",
      species: "Azadirachta indica (Neem)",
      batchCount: "2,093 saplings tagged",
      partner: "GreenEarth Collective",
      biome: "Urban Micro-Sanctuary",
      planted: "Planted Dec 2023 • IoT Mesh Active",
      survival: "99.1%",
      lat: "12.9716° N",
      lon: "77.5946° E",
      co2: "88.4 t/yr"
    },
    alappuzha: {
      name: "Alappuzha Marine Wetlands Canopy",
      tag: "#TT-6721",
      species: "Ceriops tagal (Mangrove)",
      batchCount: "4,620 saplings tagged",
      partner: "Thanal Agroecology Alliance",
      biome: "Agroforestry & Riparian",
      planted: "Planted Jan 2024 • Tidal Monitored",
      survival: "97.8%",
      lat: "9.4981° N",
      lon: "76.3388° E",
      co2: "184.8 t/yr"
    },
    srilanka: {
      name: "Sri Lanka Coastal Reserve Hub",
      tag: "#TT-7104",
      species: "Acacia mellifera",
      batchCount: "4,810 saplings tagged",
      partner: "EcoForest Inst.",
      biome: "Agroforestry & Riparian",
      planted: "Planted Sep 2023 • Tidal Resilient",
      survival: "98.2%",
      lat: "6.9271° N",
      lon: "79.8612° E",
      co2: "384.8 t/yr"
    }
  };

  // Node Popover Elements
  const nodePopover = document.getElementById('nodePopover');
  const popoverTitle = document.getElementById('popoverTitle');
  const popoverTag = document.getElementById('popoverTag');
  const popoverSpecies = document.getElementById('popoverSpecies');
  const popoverBatch = document.getElementById('popoverBatch');
  const popoverPartner = document.getElementById('popoverPartner');
  const popoverPlanted = document.getElementById('popoverPlanted');
  const popoverLatLon = document.getElementById('popoverLatLon');
  const closePopoverBtn = document.getElementById('closePopoverBtn');

  function showNode(key) {
    const data = clusterData[key] || clusterData.kochi;
    if (popoverTitle) popoverTitle.textContent = data.name;
    if (popoverTag) popoverTag.textContent = data.tag;
    if (popoverSpecies) popoverSpecies.textContent = data.species;
    if (popoverBatch) popoverBatch.textContent = data.batchCount;
    if (popoverPartner) popoverPartner.textContent = `Verified by ${data.partner}`;
    if (popoverPlanted) popoverPlanted.textContent = data.planted;
    if (popoverLatLon) popoverLatLon.textContent = `Lat: ${data.lat} • Lon: ${data.lon}`;
    if (nodePopover) nodePopover.classList.remove('hidden');
  }

  document.querySelectorAll('[data-cluster-key]').forEach(elem => {
    elem.addEventListener('click', () => {
      const key = elem.getAttribute('data-cluster-key');
      showNode(key);
    });
  });

  if (closePopoverBtn) {
    closePopoverBtn.addEventListener('click', () => {
      if (nodePopover) nodePopover.classList.add('hidden');
    });
  }

  // 2. View Switcher (Clusters / Heatmap / Satellite)
  const viewClusterBtn = document.getElementById('view-cluster-btn');
  const viewHeatmapBtn = document.getElementById('view-heatmap-btn');
  const viewSatelliteBtn = document.getElementById('view-satellite-btn');
  const mapCanvas = document.getElementById('map-canvas');

  function setActiveViewBtn(activeBtn) {
    [viewClusterBtn, viewHeatmapBtn, viewSatelliteBtn].forEach(btn => {
      if (!btn) return;
      if (btn === activeBtn) {
        btn.className = 'px-3 py-1 text-label-sm font-label-md rounded bg-surface-container-lowest text-primary shadow-sm font-semibold transition-all cursor-pointer';
      } else {
        btn.className = 'px-3 py-1 text-label-sm font-label-md rounded text-on-surface-variant hover:text-on-surface transition-all cursor-pointer';
      }
    });
  }

  if (viewClusterBtn) {
    viewClusterBtn.addEventListener('click', () => {
      setActiveViewBtn(viewClusterBtn);
      if (mapCanvas) mapCanvas.style.filter = 'none';
      document.querySelectorAll('.cluster-node-dot').forEach(d => d.style.display = 'flex');
    });
  }

  if (viewHeatmapBtn) {
    viewHeatmapBtn.addEventListener('click', () => {
      setActiveViewBtn(viewHeatmapBtn);
      if (mapCanvas) mapCanvas.style.filter = 'hue-rotate(45deg) saturate(1.4)';
    });
  }

  if (viewSatelliteBtn) {
    viewSatelliteBtn.addEventListener('click', () => {
      setActiveViewBtn(viewSatelliteBtn);
      if (mapCanvas) mapCanvas.style.filter = 'contrast(1.1) brightness(0.95)';
    });
  }

  // 3. Search & Filter in Plantings Drawer
  const searchInput = document.getElementById('tree-search-input');
  const plantingCards = document.querySelectorAll('.planting-item-card');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      plantingCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        if (text.includes(query)) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }

  // 4. "SHOW TREES HE PLANTED" (JIBIN WILSON REGISTERED TREE FEATURE)
  const userBanner = document.getElementById('userPlantedBanner');
  const filterAllBtn = document.getElementById('filterAllTreesBtn');
  const filterUserBtn = document.getElementById('filterUserTreesBtn');
  const jibinTreeDot = document.getElementById('jibinTreeDot');

  window.showUserPlantedTrees = function(userName = 'Jibin Wilson') {
    // 1. Show alert banner
    if (userBanner) {
      userBanner.classList.remove('hidden');
    }
    // 2. Dim other cluster dots and highlight Jibin's planted tree
    document.querySelectorAll('.cluster-node-dot').forEach(dot => {
      if (dot.id === 'jibinTreeDot') {
        dot.style.display = 'flex';
        dot.classList.add('scale-125', 'z-40');
      } else {
        dot.classList.add('opacity-40');
      }
    });

    // 3. Toggle drawer cards to show Jibin's tree
    plantingCards.forEach(card => {
      if (card.getAttribute('data-planter') === 'jibin-wilson') {
        card.style.display = 'block';
        card.classList.add('ring-2', 'ring-secondary', 'bg-emerald-50/50');
      } else {
        card.style.display = 'none';
      }
    });

    // 4. Update tab buttons
    if (filterUserBtn) {
      filterUserBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded bg-secondary text-white shadow-xs';
    }
    if (filterAllBtn) {
      filterAllBtn.className = 'px-2.5 py-1 text-xs font-medium rounded text-on-surface-variant hover:text-primary';
    }

    // 5. Open Jibin's tree telemetry inspection popover automatically!
    showNode('jibin_tree');

    if (window.TreeTagAuth) {
      window.TreeTagAuth.showToast(`Displaying trees planted by ${userName} (#TT-8841)`);
    }
  };

  window.showAllRegionalTrees = function() {
    if (userBanner) {
      userBanner.classList.add('hidden');
    }
    document.querySelectorAll('.cluster-node-dot').forEach(dot => {
      dot.style.display = 'flex';
      dot.classList.remove('opacity-40', 'scale-125', 'z-40');
    });
    plantingCards.forEach(card => {
      card.style.display = 'block';
      card.classList.remove('ring-2', 'ring-secondary', 'bg-emerald-50/50');
    });
    if (filterAllBtn) {
      filterAllBtn.className = 'px-2.5 py-1 text-xs font-semibold rounded bg-primary text-white shadow-xs';
    }
    if (filterUserBtn) {
      filterUserBtn.className = 'px-2.5 py-1 text-xs font-medium rounded text-on-surface-variant hover:text-primary';
    }
  };

  if (filterAllBtn) {
    filterAllBtn.addEventListener('click', window.showAllRegionalTrees);
  }
  if (filterUserBtn) {
    filterUserBtn.addEventListener('click', () => window.showUserPlantedTrees('Jibin Wilson'));
  }

  // Check URL query parameters: e.g. map.html?user=jibin-wilson or ?tree=TT-8841
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('user') === 'jibin-wilson' || urlParams.get('tree') === 'TT-8841' || urlParams.get('filter') === 'planted') {
    setTimeout(() => {
      window.showUserPlantedTrees('Jibin Wilson');
    }, 300);
  }

  // 5. GPS CAPTURE STATION WITH 40% CUTOFF & LAT/LON DETAILS
  const openGpsModalBtn = document.getElementById('openGpsCaptureBtn');
  const gpsModal = document.getElementById('gpsCaptureModal');
  const closeGpsModalBtn = document.getElementById('closeGpsModalBtn');
  const gpsLatitudeEl = document.getElementById('gpsLatitude');
  const gpsLongitudeEl = document.getElementById('gpsLongitude');
  const gpsAltitudeEl = document.getElementById('gpsAltitude');
  const gpsAccuracyRadEl = document.getElementById('gpsAccuracyRadius');
  const gpsAccuracyPctEl = document.getElementById('gpsAccuracyPct');
  const gpsAccuracyBar = document.getElementById('gpsAccuracyBar');
  const gpsStatusBadge = document.getElementById('gpsStatusBadge');
  const gpsCutoffAlert = document.getElementById('gpsCutoffAlert');
  const confirmRegisterBtn = document.getElementById('confirmGpsRegisterBtn');
  const simulateGoodBtn = document.getElementById('simulateGoodGpsBtn');
  const simulatePoorBtn = document.getElementById('simulatePoorGpsBtn');

  let currentGpsData = {
    lat: 10.052814,
    lng: 76.634629,
    altitude: 48.2,
    radiusM: 3.2,
    confidencePct: 92
  };

  function updateGpsModalUI(data) {
    currentGpsData = data;
    if (gpsLatitudeEl) gpsLatitudeEl.textContent = `${data.lat.toFixed(6)}° N`;
    if (gpsLongitudeEl) gpsLongitudeEl.textContent = `${data.lng.toFixed(6)}° E`;
    if (gpsAltitudeEl) gpsAltitudeEl.textContent = `${data.altitude.toFixed(1)} m`;
    if (gpsAccuracyRadEl) gpsAccuracyRadEl.textContent = `±${data.radiusM.toFixed(1)} m`;
    if (gpsAccuracyPctEl) gpsAccuracyPctEl.textContent = `${data.confidencePct}%`;
    if (gpsAccuracyBar) gpsAccuracyBar.style.width = `${Math.min(100, data.confidencePct)}%`;

    const CUTOFF_PERCENT = 40;
    const passesCutoff = data.confidencePct >= CUTOFF_PERCENT;

    if (passesCutoff) {
      if (gpsAccuracyBar) {
        gpsAccuracyBar.className = 'h-3 rounded-full bg-secondary transition-all duration-300';
      }
      if (gpsStatusBadge) {
        gpsStatusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container text-on-secondary-container flex items-center gap-1';
        gpsStatusBadge.innerHTML = `<span class="material-symbols-outlined text-[16px]">verified</span><span>PASSED (>40% Cutoff)</span>`;
      }
      if (gpsCutoffAlert) {
        gpsCutoffAlert.className = 'p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2';
        gpsCutoffAlert.innerHTML = `
          <span class="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
          <div>
            <strong>GPS Accuracy Verified (${data.confidencePct}%):</strong> Passes the institutional 40% accuracy cutoff threshold. Coordinates ready for cryptographic registry tagging.
          </div>
        `;
      }
      if (confirmRegisterBtn) {
        confirmRegisterBtn.disabled = false;
        confirmRegisterBtn.className = 'w-full py-3 rounded-lg bg-secondary hover:bg-primary text-white font-label-md text-sm font-bold shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2';
      }
    } else {
      if (gpsAccuracyBar) {
        gpsAccuracyBar.className = 'h-3 rounded-full bg-red-500 transition-all duration-300';
      }
      if (gpsStatusBadge) {
        gpsStatusBadge.className = 'px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 flex items-center gap-1';
        gpsStatusBadge.innerHTML = `<span class="material-symbols-outlined text-[16px]">error</span><span>REJECTED (<40% Cutoff)</span>`;
      }
      if (gpsCutoffAlert) {
        gpsCutoffAlert.className = 'p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2';
        gpsCutoffAlert.innerHTML = `
          <span class="material-symbols-outlined text-red-600 text-[20px]">warning</span>
          <div>
            <strong>Accuracy Below 40% Cutoff Threshold (${data.confidencePct}%):</strong> GPS accuracy is too low for verifiable registration. Registration blocked. Move to an open area away from tall canopy or obstructions and retry.
          </div>
        `;
      }
      if (confirmRegisterBtn) {
        confirmRegisterBtn.disabled = true;
        confirmRegisterBtn.className = 'w-full py-3 rounded-lg bg-gray-300 text-gray-500 font-label-md text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2 opacity-70';
      }
    }
  }

  if (openGpsModalBtn) {
    openGpsModalBtn.addEventListener('click', () => {
      if (gpsModal) {
        gpsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
      }
      // Attempt real browser GPS or use realistic default
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          pos => {
            const accRadius = pos.coords.accuracy || 4.2;
            const score = Math.max(10, Math.min(99, Math.round(100 - (accRadius * 2.5))));
            updateGpsModalUI({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              altitude: pos.coords.altitude || 48.0,
              radiusM: accRadius,
              confidencePct: score
            });
          },
          () => {
            updateGpsModalUI(currentGpsData);
          },
          { enableHighAccuracy: true, timeout: 6000 }
        );
      } else {
        updateGpsModalUI(currentGpsData);
      }
    });
  }

  if (closeGpsModalBtn && gpsModal) {
    closeGpsModalBtn.addEventListener('click', () => {
      gpsModal.classList.add('hidden');
      document.body.style.overflow = '';
    });
  }

  if (simulateGoodBtn) {
    simulateGoodBtn.addEventListener('click', () => {
      updateGpsModalUI({
        lat: 10.052814,
        lng: 76.634629,
        altitude: 48.2,
        radiusM: 2.8,
        confidencePct: 94
      });
    });
  }

  if (simulatePoorBtn) {
    simulatePoorBtn.addEventListener('click', () => {
      updateGpsModalUI({
        lat: 10.052814,
        lng: 76.634629,
        altitude: 12.0,
        radiusM: 24.5,
        confidencePct: 28 // UNDER 40% CUTOFF!
      });
    });
  }

  if (confirmRegisterBtn) {
    confirmRegisterBtn.addEventListener('click', () => {
      if (currentGpsData.confidencePct < 40) {
        alert('Cannot register tree: Accuracy is below the 40% cutoff threshold.');
        return;
      }
      if (gpsModal) gpsModal.classList.add('hidden');
      document.body.style.overflow = '';
      if (window.TreeTagAuth) {
        window.TreeTagAuth.showToast(`Tree successfully geotagged at ${currentGpsData.lat.toFixed(5)}°, ${currentGpsData.lng.toFixed(5)}°!`);
      }
      window.showUserPlantedTrees('Jibin Wilson');
    });
  }

  // 6. Export Audit Data Button (CSV Download)
  const exportBtn = document.getElementById('exportAuditBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const csvRows = [
        ["Tag_ID", "Botanical_Species", "Common_Name", "Cluster_Sector", "Latitude", "Longitude", "Accuracy_M", "Confidence", "Planter", "Planted_Date", "Survival_Rate", "Auditor"],
        ["TT-8841", "Tectona grandis", "Teak", "Mar Baselios Institute (MBITS), Kothamangalam", "10.0528", "76.6346", "3.2", "98%", "Jibin Wilson", "2023-10-14", "100%", "APJAKTU NSSCELL NRPF"],
        ["TT-8840", "Dalbergia latifolia", "Indian Rosewood", "Sustera Community Cluster, Wayanad", "11.6854", "76.1320", "4.5", "92%", "Community Volunteer", "2024-01-10", "99.6%", "Sustera Foundation"],
        ["TT-8839", "Azadirachta indica", "Neem", "Old Age Home Sanatorium, Madurai", "9.9252", "78.1198", "5.1", "88%", "EcoCare Cluster", "2023-10-28", "99.2%", "EcoCare Western Ghats"],
        ["TT-8838", "Artocarpus heterophyllus", "Jackfruit", "EcoCare Riparian Buffer, Palakkad", "10.7867", "76.6548", "3.8", "95%", "EcoCare Western Ghats", "2023-10-25", "98.9%", "EcoCare Western Ghats"],
        ["TT-2849", "Terminalia arjuna", "Arjuna", "Kochi St. Teresa's Micro-Canopy", "9.9312", "76.2673", "4.1", "90%", "Thanal Student Cell", "2023-11-04", "99.4%", "Thanal Agroecology"]
      ];

      const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "tree_tag_verified_audit_ledger.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
});
