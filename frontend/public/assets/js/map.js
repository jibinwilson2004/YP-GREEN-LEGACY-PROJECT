// Tree Tag GIS & Telemetry Map Engine
document.addEventListener('DOMContentLoaded', () => {
  // 1. Cluster Nodes Data
  const clusterData = {
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
  const closePopoverBtn = document.getElementById('closePopoverBtn');

  function showNode(key) {
    const data = clusterData[key] || clusterData.kochi;
    if (popoverTitle) popoverTitle.textContent = data.name;
    if (popoverTag) popoverTag.textContent = data.tag;
    if (popoverSpecies) popoverSpecies.textContent = data.species;
    if (popoverBatch) popoverBatch.textContent = data.batchCount;
    if (popoverPartner) popoverPartner.textContent = `Verified by ${data.partner}`;
    if (popoverPlanted) popoverPlanted.textContent = data.planted;
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
        btn.className = 'px-3 py-1 text-label-sm font-label-md rounded bg-surface-container-lowest text-primary shadow-sm font-semibold transition-all';
      } else {
        btn.className = 'px-3 py-1 text-label-sm font-label-md rounded text-on-surface-variant hover:text-on-surface transition-all';
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

  // 4. Export Audit Data Button (CSV Download)
  const exportBtn = document.getElementById('exportAuditBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const csvRows = [
        ["Tag_ID", "Botanical_Species", "Common_Name", "Cluster_Sector", "Latitude", "Longitude", "Planted_Date", "Survival_Rate", "Auditor"],
        ["TT-8841", "Tectona grandis", "Teak", "Govt Model HS Campus, Kozhikode", "11.2588", "75.7804", "2024-02-15", "99.8%", "Thanal Agroecology"],
        ["TT-8840", "Dalbergia latifolia", "Indian Rosewood", "Sustera Community Cluster, Wayanad", "11.6854", "76.1320", "2024-01-10", "99.6%", "Sustera Foundation"],
        ["TT-8839", "Azadirachta indica", "Neem", "Old Age Home Sanatorium, Madurai", "9.9252", "78.1198", "2023-10-28", "99.2%", "EcoCare Western Ghats"],
        ["TT-8838", "Artocarpus heterophyllus", "Jackfruit", "EcoCare Riparian Buffer, Palakkad", "10.7867", "76.6548", "2023-10-25", "98.9%", "EcoCare Western Ghats"],
        ["TT-2849", "Terminalia arjuna", "Arjuna", "Kochi St. Teresa's Micro-Canopy", "9.9312", "76.2673", "2023-11-04", "99.4%", "Thanal Agroecology"]
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
