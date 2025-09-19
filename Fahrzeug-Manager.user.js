// ==UserScript==
// @name         * 1 - Leitstellenspiel Fahrzeug-Manager mit Fahrzeugtypen
// @namespace    https://leitstellenspiel.de/
// @version      2.7
// @description  Zeigt Fahrzeuge auf Wache nach Typ (LF 20, DLK, etc.) mit Mapping auf LSS-Manager-API
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Globale Daten
    let buildingDataGlobal = [];       // alle Gebäude (Array)
    let vehicleDataGlobal = [];        // alle Fahrzeuge (Array)
    let vehicleMapGlobal = {};         // mapping buildingId -> [fahrzeuge]
    let vehicleTypeMapGlobal = {};     // mapping typeId -> vehicleType info (von LSSM API)
    let currentCredits = 0;
    let currentCoins = 0;

    const buildingTypeNames = {
        '0_normal': 'Feuerwache (Normal)',
        '0_small': 'Feuerwache (Kleinwache)',
        '2_normal': 'Rettungswache (Normal)',
        '2_small': 'Rettungswache (Kleinwache)',
        '6_normal': 'Polizeiwache (Normal)',
        '6_small': 'Polizeiwache (Kleinwache)',
        '9_normal': 'Technisches Hilfswerk',
        '11_normal': 'Bereitschaftspolizei',
        '12_normal': 'Schnelleinsatzgruppe (SEG)',
        '15_normal': 'Wasserrettung',
        '17_normal': 'Polizei-Sondereinheiten',
        '24_normal': 'Reiterstaffel',
        '25_normal': 'Bergrettungswache',
        '26_normal': 'Seenotrettungswache',
    };

    // Button ins Profil-Dropdown einfügen
    const menu = document.querySelector('#menu_profile + ul.dropdown-menu');
    if (menu) {
        const divider = menu.querySelector('li.divider');
        if (divider) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.id = 'fahrzeug-manager-btn';
            a.innerHTML = '<span class="glyphicon glyphicon-list"></span>&nbsp;&nbsp; Fahrzeug-Manager';
            li.appendChild(a);
            menu.insertBefore(li, divider);
        }
    }

    document.addEventListener('click', e=>{
        if(e.target && e.target.id==='fahrzeug-manager-btn'){
            e.preventDefault();
            $('#fahrzeugManagerModal').modal('show');
            loadBuildingsFromAPI();
        }
    });

    // Modal HTML
    const modalHTML = `
        <div class="modal fade" id="fahrzeugManagerModal" tabindex="-1" role="dialog" aria-labelledby="fahrzeugManagerLabel">
          <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
              <div class="modal-header" style="display: flex; flex-direction: column; gap: 5px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                      <h3 class="modal-title" id="fahrzeugManagerLabel" style="font-weight: bold; margin: 0;">🚒 Fahrzeug-Manager</h3>
                      <div style="display: flex; gap: 10px; align-items: center;">
                          <button type="button" class="fm-config-btn" id="fm-config-btn">Fahrzeugkonfiguration</button>
                          <button type="button" class="fm-close-btn" data-dismiss="modal">Schließen ✖</button>
                      </div>
                  </div>
                  <div style="display: grid; grid-template-columns: max-content 1fr; gap: 15px; row-gap: 3px; align-items: center; font-size: 14px;">
                      <div>Aktuelle Credits: <span id="fm-credits" style="color: #5cb85c; font-weight: bold;">0</span></div>
                      <div>Ausgewählte Credits: <span id="fm-costs-credits" style="color: #5cb85c; font-weight: bold;">0</span></div>
                      <div>Aktuelle Coins: <span id="fm-coins" style="color: #dc3545; font-weight: bold;">0</span></div>
                      <div>Ausgewählte Coins: <span id="fm-costs-coins" style="color: #dc3545; font-weight: bold;">0</span></div>
                  </div>
                  <div id="fm-progress-container" style="width: 100%; display: none; margin-top: 5px;">
    <div id="fm-progress-text" style="font-size: 13px; margin-bottom: 3px; font-weight: bold; color: #007bff;">
        Kauf gestartet...
    </div>
    <div style="background: #e0e0e0; border-radius: 4px; overflow: hidden; height: 8px;">
        <div id="fm-progress-bar" style="width: 0%; height: 100%; background: #28a745; transition: width 0.3s ease;"></div>
    </div>
</div>
              </div>
              <div class="modal-body" id="fahrzeug-manager-content">
                <p>Lade Daten...</p>
              </div>
            </div>
          </div>
        </div>`;

    // Fahrzeugkonfigurations-Modal
    const configModalHTML = `
        <div class="modal fade" id="fahrzeugConfigModal" tabindex="-1" role="dialog" aria-labelledby="fahrzeugConfigLabel">
          <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
              <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
                <h3 class="modal-title" id="fahrzeugConfigLabel" style="font-weight: bold; margin: 0;">⚙️ Fahrzeugkonfiguration ⚙️</h3>
                <button type="button" class="fm-close-btn" data-dismiss="modal">Schließen ✖</button>
              </div>
              <div class="modal-body" id="fahrzeug-config-content">
                <p>Lade Fahrzeugtypen...</p>
              </div>
            </div>
          </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    document.body.insertAdjacentHTML('beforeend', configModalHTML);

    document.addEventListener('click', e => {
        if (e.target && e.target.id === 'fm-config-btn') {
            e.preventDefault();
            $('#fahrzeugConfigModal').modal('show');
            loadVehicleConfig();
        }
    });

    // CSS
    GM_addStyle(`
        #fahrzeugManagerModal .modal-dialog { max-width: 2500px; width: 95%; margin: 30px auto; }
        #fahrzeugManagerModal .modal-content { width: 100%; overflow-x: auto; }
        #fahrzeugManagerModal { z-index: 10000 !important; }
        .modal-backdrop { z-index: 9999 !important; }
        .fm-close-btn { background-color: #dc3545; color: white; border: none; border-radius: 4px; padding: 5px 10px; font-size: 13px; cursor: pointer; }
        .fm-close-btn:hover { background-color: #c82333; }
        .fm-select { cursor: pointer; }
        .btn-xs { padding: 2px 6px; font-size: 12px; }
        .fm-spoiler { border: 1px solid var(--spoiler-border); border-radius: 4px; margin-bottom: 8px; overflow: hidden; }
        .fm-spoiler-header { background-color: var(--spoiler-header-bg); color: var(--spoiler-header-text); padding: 8px 12px; cursor: pointer; font-weight: bold; user-select: none; transition: background-color 0.2s; }
        .fm-spoiler-header:hover { background-color: var(--spoiler-header-hover); }
        .fm-spoiler-body { display: none; padding: 10px; background: var(--spoiler-body-bg); color: var(--spoiler-body-text); overflow-x: auto; }
        .fm-spoiler-body.active { display: block; }
        body:not(.dark) { --spoiler-border: #ddd; --spoiler-header-bg: #f7f7f7; --spoiler-header-text: #000; --spoiler-header-hover: #eaeaea; --spoiler-body-bg: #fff; --spoiler-body-text: #000; --table-header-bg: #f1f1f1; }
        body.dark { --spoiler-border: #444; --spoiler-header-bg: #333; --spoiler-header-text: #eee; --spoiler-header-hover: #444; --spoiler-body-bg: #222; --spoiler-body-text: #ddd; --table-header-bg: #333; }
        .fm-spoiler table { border-collapse: collapse; width: 100%; table-layout: auto; min-width: 800px; }
        .fm-spoiler table th, .fm-spoiler table td, .fm-spoiler table .fm-filter-row td { border: none; padding: 6px 8px; text-align: center; vertical-align: middle; white-space: nowrap; }
        .fm-spoiler table thead th, .fm-spoiler table .fm-filter-row td { background-color: var(--table-header-bg); font-weight: bold; }
        .fm-filter-row select, .fm-filter-row button.fm-filter-reset { font-size: 12px; padding: 2px 4px; min-width: 100px; width: 100%; }
        .fm-badge-green { background-color: #28a745 !important; color: #fff !important; }
        .fm-vehicle-list { white-space: normal !important; word-break: normal !important; overflow-wrap: normal !important; max-width: 350px; display: inline-block; }
        .fm-config-btn { background-color: #007bff; color: white; border: none; border-radius: 4px; padding: 5px 10px; font-size: 13px; cursor: pointer; }
        .fm-config-btn:hover { background-color: #0069d9; }
        #fahrzeugConfigModal .modal-dialog { max-width: 2000px; width: 90%; margin: 30px auto; }
        #fahrzeugConfigModal .modal-content { width: 100%; overflow-x: auto; }
        #fahrzeugConfigModal { z-index: 10001 !important; }  /* höher als FahrzeugManager */
        #fahrzeugConfigModal + .modal-backdrop { z-index: 10000 !important; }
    `);

    // LSS-Manager Fahrzeugtypen laden
    async function loadVehicleTypesLSSM() {
        try {
            const res = await fetch('https://api.lss-manager.de/de_DE/vehicles');
            const data = await res.json();
            return data; // keys: 0, 1, 2, ... → direkt verwendbar!
        } catch (e) {
            console.error('Fehler beim Laden der LSSM Fahrzeugtypen:', e);
            return {};
        }
    }

    // Fahrzeuge laden und nach Gebäude gruppieren
    async function loadVehiclesFromAPI_raw() {
        try {
            const res = await fetch('/api/vehicles');
            const vehicles = await res.json();
            return vehicles;
        } catch (error) {
            console.error('Fehler beim Laden der Fahrzeugdaten:', error);
            return [];
        }
    }

    // Gesamte Übersicht laden (setzt auch globale Daten)
    async function loadBuildingsFromAPI() {
        const content = document.getElementById('fahrzeug-manager-content');
        content.innerHTML = '<p><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> Lade Übersicht...</p>';
        try {
            const [buildings, vehiclesRaw, vehicleTypeMap] = await Promise.all([
                fetch('/api/buildings').then(r=>r.json()),
                loadVehiclesFromAPI_raw(),
                loadVehicleTypesLSSM()
            ]);

            // Globale Speicherung
            buildingDataGlobal = buildings;
            vehicleDataGlobal = vehiclesRaw;
            vehicleTypeMapGlobal = vehicleTypeMap;

            // vehicleMap aufbauen
            const vehicleMap = {};
            vehicleDataGlobal.forEach(v => {
                if (!vehicleMap[v.building_id]) vehicleMap[v.building_id] = [];
                vehicleMap[v.building_id].push(v);
            });
            vehicleMapGlobal = vehicleMap;

            // leitstellen map und vehicle_count berechnen
            const leitstellenMap = {};
            buildings.forEach(b => { if(b.building_type===7 || b.is_leitstelle) leitstellenMap[b.id]=b.caption; });
            buildings.forEach(b => {
                b.leitstelle_caption = b.leitstelle_building_id && leitstellenMap[b.leitstelle_building_id] ? leitstellenMap[b.leitstelle_building_id] : "-";
                b.vehicle_count = (vehicleMap[b.id] || []).length;
            });

            const filteredBuildings = buildings.filter(b=>getBuildingTypeName(b)!==null);
            content.innerHTML = buildBuildingsByType(filteredBuildings, vehicleMap, vehicleTypeMap);

            // Spoiler eventlisteners
            document.querySelectorAll('.fm-spoiler-header').forEach(header=>{
                header.addEventListener('click', ()=>{
                    const targetId = header.dataset.target;
                    document.querySelectorAll('.fm-spoiler-body').forEach(body=>{
                        body.id===targetId ? body.classList.toggle('active') : body.classList.remove('active');
                    });
                });
            });

            // Wichtig: Listener für die Tabellen (Select-All, Filter, Checkboxen) anfügen
            attachAllTableListeners();
        } catch(err) {
            content.innerHTML = `<div class="alert alert-danger">❌ Fehler beim Laden der Daten: ${err}</div>`;
        }
    }

    // --- Einzelne Tabellen: Event-Listener zentral anlegen ---
    function attachAllTableListeners() {
        const content = document.getElementById('fahrzeug-manager-content');
        if (!content) return;

        // Delegierte Events
        content.addEventListener('change', e => {
            const table = e.target.closest('.fm-table');
            if (!table) return;

            // Filter geändert
            if (e.target.classList.contains('fm-filter-leitstelle') ||
                e.target.classList.contains('fm-filter-wache')) {
                applyFilters(table);
            }

            // einzelne Checkbox geändert
            if (e.target.classList.contains('fm-select')) {
                updateSelectAll(table);
                updateSelectedCosts();
            }

            // Select-All geändert
            if (e.target.classList.contains('fm-select-all')) {
                const checked = e.target.checked;
                table.querySelectorAll('tbody tr').forEach(row => {
                    if (row.style.display !== 'none') {
                        const cb = row.querySelector('.fm-select');
                        if (cb) cb.checked = checked;
                    }
                });
                updateSelectedCosts();
            }
        });

        content.addEventListener('click', e => {
            if (!e.target.classList.contains('fm-filter-reset')) return;
            const table = e.target.closest('.fm-table');
            if (!table) return;
            const filterLeitstelle = table.querySelector('.fm-filter-leitstelle');
            const filterWache = table.querySelector('.fm-filter-wache');
            if (filterLeitstelle) filterLeitstelle.value = '';
            if (filterWache) filterWache.value = '';
            applyFilters(table);
        });

        function applyFilters(table) {
            const leitstelle = table.querySelector('.fm-filter-leitstelle')?.value || '';
            const wache = table.querySelector('.fm-filter-wache')?.value || '';
            const rows = [...table.querySelectorAll('tbody tr')];
            rows.forEach(row => {
                const rowLeitstelle = row.cells[1]?.textContent.trim() || '';
                const rowWache = row.cells[2]?.textContent.trim() || '';
                row.style.display = (leitstelle && rowLeitstelle !== leitstelle) ||
                    (wache && rowWache !== wache) ? 'none' : '';
            });
            updateSelectAll(table);
        }

        function updateSelectAll(table) {
            const rows = [...table.querySelectorAll('tbody tr')];
            const visibleCheckboxes = rows
            .filter(r => r.style.display !== 'none')
            .map(r => r.querySelector('.fm-select'))
            .filter(Boolean);
            const allCheckbox = table.querySelector('.fm-select-all');
            if (allCheckbox) {
                allCheckbox.checked = visibleCheckboxes.length > 0 &&
                    visibleCheckboxes.every(cb => cb.checked);
            }
        }

        // Initial Filter anwenden
        document.querySelectorAll('.fm-table').forEach(table => applyFilters(table));
    }

    // Tabellen nach Schließen des Config-Modals aktualisieren
    $('#fahrzeugConfigModal').on('hidden.bs.modal', () => {
        const content = document.getElementById('fahrzeug-manager-content');
        if (!content) return;

        // Gefilterte Gebäude nach Typ
        const filteredBuildings = buildingDataGlobal.filter(b => getBuildingTypeName(b) !== null);

        // Tabellen neu bauen
        content.innerHTML = buildBuildingsByType(filteredBuildings, vehicleMapGlobal, vehicleTypeMapGlobal);

        // Spoiler-Eventlistener erneut setzen
        document.querySelectorAll('.fm-spoiler-header').forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.target;
                document.querySelectorAll('.fm-spoiler-body').forEach(body => {
                    body.id === targetId ? body.classList.toggle('active') : body.classList.remove('active');
                });
            });
        });

        // Checkbox-Listener für Kosten aktualisieren
        setTimeout(() => {
            document.querySelectorAll('.fm-table').forEach(table => {
                const allCheckbox = table.querySelector('.fm-select-all');
                const filterLeitstelle = table.querySelector('.fm-filter-leitstelle');
                const filterWache = table.querySelector('.fm-filter-wache');
                const resetBtn = table.querySelector('.fm-filter-reset');

                function applyFilters() {
                    const leitstelle = filterLeitstelle.value;
                    const wache = filterWache.value;
                    table.querySelectorAll('tbody tr').forEach(row => {
                        const rowLeitstelle = row.cells[1].textContent.trim();
                        const rowWache = row.cells[2].textContent.trim();
                        row.style.display = (leitstelle && rowLeitstelle !== leitstelle) || (wache && rowWache !== wache) ? 'none' : '';
                    });
                    const visibleCheckboxes = [...table.querySelectorAll('tbody tr')]
                    .filter(r => r.style.display !== 'none')
                    .map(r => r.querySelector('.fm-select'));
                    allCheckbox.checked = visibleCheckboxes.length > 0 && visibleCheckboxes.every(cb => cb.checked);
                }

                allCheckbox.addEventListener('change', () => {
                    const checked = allCheckbox.checked;
                    table.querySelectorAll('tbody tr').forEach(row => {
                        if(row.style.display !== 'none') row.querySelector('.fm-select').checked = checked;
                    });
                    updateSelectedCosts();
                });
                filterLeitstelle.addEventListener('change', applyFilters);
                filterWache.addEventListener('change', applyFilters);
                resetBtn.addEventListener('click', () => { filterLeitstelle.value=''; filterWache.value=''; applyFilters(); });
                table.querySelectorAll('.fm-select').forEach(cb => {
                    cb.addEventListener('change', () => { applyFilters(); updateSelectedCosts(); });
                });
            });
        }, 0);
    });

    // Gebäudetypname bestimmen
    function getBuildingTypeName(building) {
        let typeId = building.building_type;
        const size = building.small_building ? 'small' : 'normal';
        const key = `${typeId}_${size}`;
        return buildingTypeNames[key] ?? null;
    }

    // Maximale Stellplätze berechnen (inkl. Erweiterungen)
    function getMaxVehiclesForBuilding(building) {
        let max = (building.level ?? 0) + 1;

        // Erweiterungen berücksichtigen
        if (Array.isArray(building.extensions)) {
            building.extensions.forEach(ext => {
                if (ext.givesParkingLots) {
                    max += ext.givesParkingLots;
                }
            });
        }
        return max;
    }

    // Nach Typ gruppieren und Spoiler bauen
    function buildBuildingsByType(buildings, vehicleMap, vehicleTypeMap) {
        const grouped = {};
        buildings.forEach(b => {
            const typeName = getBuildingTypeName(b);
            if(!typeName) return;
            if(!grouped[typeName]) grouped[typeName]=[];
            grouped[typeName].push(b);
        });

        let html='';
        Object.keys(buildingTypeNames).forEach((key, idx) => {
            const typeName = buildingTypeNames[key];
            if(grouped[typeName]){
                // Filtere Wachen mit freien Stellplätzen:
                const filteredBuildings = grouped[typeName].filter(b => {
                    const vehiclesCount = (vehicleMap[b.id] || []).length;
                    // Stellplätze: Level + 1 (wie im Code), kann ggf. angepasst werden
                    const maxVehicles = getMaxVehiclesForBuilding(b);
                    return vehiclesCount < maxVehicles;

                });
                if(filteredBuildings.length > 0) {
                    html+=
                        `<div class="fm-spoiler">
                         <div class="fm-spoiler-header" data-target="fm-spoiler-body-${idx}">${typeName}</div>
                         <div id="fm-spoiler-body-${idx}" class="fm-spoiler-body">${buildFahrzeugTable(filteredBuildings, idx, vehicleMap, vehicleTypeMap)}</div>
                         </div>`;
                }
            }
        });
        return html;
    }

    // Tabelle für Gebäude eines Typs
    function buildFahrzeugTable(buildings, tableId, vehicleMap, vehicleTypeMap) {
        const leitstellen = [...new Set(buildings.map(b => b.leitstelle_caption).filter(Boolean))];
        const wachen = [...new Set(buildings.map(b => b.caption).filter(Boolean))];

        let html = `<table class="table fm-table" id="fm-table-${tableId}">

        <thead>
        <tr><th>Alle Aus-/Abwählen</th><th>Leitstelle</th><th>Wache</th><th>Fahrzeuge</th><th>Freie Stellplätze</th><th>Fahrzeuge auf Wache</th><th>Fehlende Fahrzeuge</th><th>Kaufen mit Credits</th><th>Kaufen mit Coins</th></tr>
        <tr class="fm-filter-row">
        <td><input type="checkbox" class="fm-select-all" data-table="${tableId}"></td>
        <td><select class="fm-filter-leitstelle" data-table="${tableId}"><option value="">Alle</option>${leitstellen.map(n=>`<option value="${n}">${n}</option>`).join('')}</select></td>
        <td><select class="fm-filter-wache" data-table="${tableId}"><option value="">Alle</option>${wachen.map(n=>`<option value="${n}">${n}</option>`).join('')}</select></td>
        <td><button class="fm-filter-reset btn btn-primary btn-xs" data-table="${tableId}">Reset</button></td>
        <td></td>
        <td></td>
        <td></td>
        <td><button class="btn btn-success btn-xs fm-buy-selected-credits" data-table="${tableId}"> Alle kaufen (Credits)</button></td>
        <td><button class="btn btn-danger btn-xs fm-buy-selected-coins" data-table="${tableId}"> Alle kaufen (Coins)</button></td>
        </tr>
        </thead>
        <tbody>`;

        const sortedBuildings = buildings.slice().sort((a, b) => a.caption.localeCompare(b.caption));

        sortedBuildings.forEach((b, idx) => {
            const vehiclesOnBuilding = vehicleMap[b.id] || [];
            const typeCountMap = {};

            vehiclesOnBuilding.forEach(v => {
                const typeId = v.vehicle_type;
                let typeName = vehicleTypeMap[typeId]?.caption || `Unbekannt (Typ ${typeId})`;
                typeCountMap[typeName] = (typeCountMap[typeName] || 0) + 1;
            });

            const vehicleNames = Object.entries(typeCountMap)
            .map(([name, count]) => count > 1 ? `${count}x ${name}` : name)
            .join(',<wbr> ') || 'Keine Fahrzeuge auf Wache vorhanden';

            // **Hier stellen wir sicher, dass der Config-Key stimmt**
            const configKey = `${b.building_type}_${b.small_building ? 'small' : 'normal'}`;
            const missingData = getMissingVehiclesForBuilding(b, vehicleMap, vehicleTypeMap, configKey);

            console.info(`[FM][Table] Wache "${b.caption}" - Fehlende Fahrzeuge:`, missingData.names);

            const missingVehiclesJson = JSON.stringify(missingData.vehiclesIds || []);

            html += `<tr data-building-id="${b.id}" data-missing-vehicle-ids='${missingVehiclesJson}'>
            <td>
                <input type="checkbox" class="fm-select" id="fm-select-${tableId}-${idx}"
                    data-credits="${missingData.totalCredits}"
                    data-coins="${missingData.totalCoins}">
            </td>
            <td>${b.leitstelle_caption ?? '-'}</td>
            <td>${b.caption}</td>
            <td>${b.vehicle_count ?? 0}</td>
            <td><span class="badge fm-badge-green">${Math.max((b.level ?? 0) + 1 - vehiclesOnBuilding.length, 0)}</span></td>
            <td><span class="fm-vehicle-list">${vehicleNames}</span></td>
            <td><span class="fm-vehicle-list">${missingData.names}</span></td>
            <td>
                <button class="btn btn-success btn-xs fm-buy-credit"
                    ${missingData.totalCredits > currentCredits ? 'disabled title="Nicht genug Credits"' : ''}
                >
                    ${missingData.totalCredits.toLocaleString()} Credits
                </button>
            </td>
            <td>
                <button class="btn btn-danger btn-xs fm-buy-coin"
                    ${missingData.totalCoins > currentCoins ? 'disabled title="Nicht genug Coins"' : ''}
                >
                    ${missingData.totalCoins.toLocaleString()} Coins
                </button>
            </td>
        </tr>`;
        });

        html += '</tbody></table>';
        return html;
    }

    // Aktuelle Ressourcen holen und regelmäßig aktualisieren
    async function updateUserResources(){
        try {
            const res = await fetch('/api/userinfo');
            const data = await res.json();
            currentCredits = data.credits_user_current || 0;
            currentCoins = data.coins_user_current || 0;

            document.getElementById('fm-credits').textContent = currentCredits.toLocaleString();
            document.getElementById('fm-coins').textContent = currentCoins.toLocaleString();

            // Buttons nachführen
            updateBuyButtons();
        } catch(e) {
            console.warn(e);
        }
    }
    setInterval(updateUserResources, 1000);
    updateUserResources();

    function updateBuyButtons() {
        document.querySelectorAll('#fahrzeugModal table tbody tr').forEach(row => {
            const creditsCost = parseInt(row.querySelector('.fm-select')?.dataset.credits || '0', 10);
            const coinsCost = parseInt(row.querySelector('.fm-select')?.dataset.coins || '0', 10);

            const creditBtn = row.querySelector('.fm-buy-credit');
            const coinBtn = row.querySelector('.fm-buy-coin');

            if (creditBtn) {
                if (creditsCost > currentCredits) {
                    creditBtn.disabled = true;
                    creditBtn.title = `Benötigt: ${creditsCost.toLocaleString()} Credits (nur ${currentCredits.toLocaleString()} vorhanden)`;
                } else {
                    creditBtn.disabled = false;
                    creditBtn.title = '';
                }
            }

            if (coinBtn) {
                if (coinsCost > currentCoins) {
                    coinBtn.disabled = true;
                    coinBtn.title = `Benötigt: ${coinsCost.toLocaleString()} Coins (nur ${currentCoins.toLocaleString()} vorhanden)`;
                } else {
                    coinBtn.disabled = false;
                    coinBtn.title = '';
                }
            }
        });
    }

    // Ausgewählte Kosten berechnen
    function updateSelectedCosts(){
        let totalCredits=0,totalCoins=0;
        document.querySelectorAll('.fm-select:checked').forEach(cb=>{
            totalCredits += parseInt(cb.dataset.credits,10)||0;
            totalCoins += parseInt(cb.dataset.coins,10)||0;
        });
        document.getElementById('fm-costs-credits').textContent=totalCredits.toLocaleString();
        document.getElementById('fm-costs-coins').textContent=totalCoins.toLocaleString();
    }

    // Lade die gespeicherte Konfiguration
    async function loadVehicleConfig() {
        const content = document.getElementById('fahrzeug-config-content');
        content.innerHTML = '<p><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> Lade Fahrzeugkonfiguration...</p>';

        try {
            const [buildingTypes, vehicleTypes] = await Promise.all([
                fetch('https://api.lss-manager.de/de_DE/buildings').then(r => r.json()),
                loadVehicleTypesLSSM()
            ]);

            const sortedBuildingKeys = Object.keys(buildingTypeNames);
            let html = '';

            sortedBuildingKeys.forEach((key) => {
                const buildingId = parseInt(key.split('_')[0], 10);
                const buildingCaption = buildingTypeNames[key];
                if (!buildingCaption) return;

                const vehiclesForBuilding = Object.values(vehicleTypes).filter(v =>
                                                                               Array.isArray(v.possibleBuildings) && v.possibleBuildings.includes(buildingId)
                                                                              );

                if (vehiclesForBuilding.length > 0) {
                    html += `
<div class="fm-spoiler">
  <div class="fm-spoiler-header" data-target="fm-config-body-${key}">
    ${buildingCaption} – wird geladen …
  </div>
  <div id="fm-config-body-${key}" class="fm-spoiler-body">
    ${buildConfigGrid(vehiclesForBuilding, key, 10, buildingCaption)}
  </div>
</div>`;
                }
            });

            content.innerHTML = html || '<div class="alert alert-info">Keine passenden Fahrzeuge gefunden.</div>';

            // Spoiler-Logik
            document.querySelectorAll('#fahrzeugConfigModal .fm-spoiler-header').forEach(header => {
                header.addEventListener('click', () => {
                    const targetId = header.dataset.target;
                    document.querySelectorAll('#fahrzeugConfigModal .fm-spoiler-body').forEach(body => {
                        body.id === targetId ? body.classList.toggle('active') : body.classList.remove('active');
                    });
                });
            });

        } catch (err) {
            content.innerHTML = `<div class="alert alert-danger">❌ Fehler beim Laden der Konfigurationsdaten: ${err}</div>`;
        }
    }

    // Funktion für das Konfigurationsmenü
    function buildConfigGrid(vehicles, tableId, itemsPerRow = 10, buildingCaption = '') {
        if (!vehicles || vehicles.length === 0) return '<div>Keine Fahrzeuge vorhanden</div>';

        vehicles.sort((a, b) => a.caption.localeCompare(b.caption));

        // gespeicherte Config laden
        let savedConfig = [];
        try {
            savedConfig = JSON.parse(localStorage.getItem(`fm-config-${tableId}`)) || [];
            console.info(`[FM][Config] Geladene Config fm-config-${tableId}:`, savedConfig);
        } catch (e) {
            savedConfig = [];
            console.warn(`[FM][Config] Fehler beim Laden der Config fm-config-${tableId}:`, e);
        }

        let html = `<div style="margin-bottom:5px; display:flex; gap:5px;">
    <button class="btn btn-success btn-xs fm-config-select-all" data-table="${tableId}">Alle anwählen</button>
    <button class="btn btn-danger btn-xs fm-config-deselect-all" data-table="${tableId}">Alle abwählen</button>
    <button class="btn btn-primary btn-xs fm-config-toggle" data-table="${tableId}">Abgewählte Fahrzeuge anzeigen</button>
</div>`; // Buttons **vor** Grid

        html += `<div class="fm-config-grid" id="fm-config-table-${tableId}" style="
    display: grid;
    grid-template-columns: repeat(${itemsPerRow}, minmax(120px, 1fr));
    gap: 4px 8px;
    width: 100%;
">`;

        vehicles.forEach((vehicle, idx) => {
            const saved = savedConfig.find(c => (c.typeId !== undefined && String(c.typeId) === String(vehicle.id)) || c.caption === vehicle.caption);
            const checked = saved ? !!saved.checked : true;
            const amount = saved ? (parseInt(saved.amount, 10) || 1) : 1;

            html += `<div class="fm-config-cell" style="
            white-space: nowrap;
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
            padding: 4px 6px;
            border: 1px solid var(--spoiler-border);
            border-radius: 4px;
            background: var(--spoiler-body-bg);
            color: var(--spoiler-body-text);
        ">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; width: 100%;">
                <input type="checkbox" class="fm-config-select" id="fm-config-select-${tableId}-${idx}"
                       data-caption="${vehicle.caption}"
                       data-type-id="${vehicle.id}"
                       ${checked ? 'checked' : ''}>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${vehicle.caption}</span>
            </label>
            <input type="number" class="fm-config-amount" id="fm-config-amount-${tableId}-${idx}"
                   value="${amount}" min="1" style="
                width: 100%;
                padding: 2px 4px;
                border: 1px solid var(--spoiler-border);
                border-radius: 3px;
                background: var(--spoiler-body-bg);
                color: var(--spoiler-body-text);
            " />
        </div>`;
        });

        html += `</div>`; // Ende Grid

        // DOM-Event-Bindings + Debug
        setTimeout(() => {
            const grid = document.getElementById(`fm-config-table-${tableId}`);
            if (!grid) return;

            const header = document.querySelector(`[data-target="fm-config-body-${tableId}"]`);
            if (!header) return;

            function updateHeaderCount() {
                let selected = 0;
                grid.querySelectorAll('.fm-config-cell').forEach(cell => {
                    const cb = cell.querySelector('.fm-config-select');
                    const input = cell.querySelector('.fm-config-amount');
                    if (!cb || !input) return;
                    if (cb.checked) selected += parseInt(input.value, 10) || 0;
                });
                header.innerHTML = `${buildingCaption} – ${selected} Fahrzeuge`;
                console.info(`[FM][Config] Header-Update: ${selected} Fahrzeuge ausgewählt für ${buildingCaption}`);
            }

            function saveConfig() {
                const config = [];
                grid.querySelectorAll('.fm-config-cell').forEach(cell => {
                    const cb = cell.querySelector('.fm-config-select');
                    const input = cell.querySelector('.fm-config-amount');
                    if (!cb || !input) return;
                    config.push({
                        typeId: parseInt(cb.dataset.typeId, 10),
                        caption: cb.dataset.caption,
                        checked: cb.checked,
                        amount: parseInt(input.value, 10) || 1
                    });
                });
                localStorage.setItem(`fm-config-${tableId}`, JSON.stringify(config));
                console.info(`[FM][Config] Automatisch gespeichert fm-config-${tableId}:`, config);
            }

            // Checkboxen & Inputs
            grid.querySelectorAll('.fm-config-select').forEach(cb => {
                const cell = cb.closest('.fm-config-cell');
                cb.addEventListener('change', () => {
                    console.info(`[FM][Config] Checkbox geändert: ${cb.dataset.caption} => ${cb.checked}`);
                    if (!cell) return;
                    cell.style.display = cb.checked ? '' : 'none';
                    updateHeaderCount();
                    saveConfig();
                });
            });

            grid.querySelectorAll('.fm-config-amount').forEach(input => {
                input.addEventListener('change', () => {
                    console.info(`[FM][Config] Menge geändert: ${input.previousElementSibling.textContent} => ${input.value}`);
                    updateHeaderCount(); saveConfig();
                });
                input.addEventListener('input', () => { updateHeaderCount(); saveConfig(); });
            });

            // Toggle abgewählte Fahrzeuge
            const toggleBtn = grid.parentElement.querySelector('.fm-config-toggle');
            if (toggleBtn) {
                let showingHidden = false;
                toggleBtn.addEventListener('click', () => {
                    showingHidden = !showingHidden;
                    grid.querySelectorAll('.fm-config-cell').forEach(cell => {
                        const cb = cell.querySelector('.fm-config-select');
                        if (cb && !cb.checked) {
                            cell.style.display = showingHidden ? '' : 'none';
                        }
                    });
                    toggleBtn.textContent = showingHidden ? 'Abgewählte Fahrzeuge ausblenden' : 'Abgewählte Fahrzeuge anzeigen';
                    console.info(`[FM][Config] Toggle abgewählte Fahrzeuge: ${showingHidden ? 'anzeigen' : 'ausblenden'}`);
                });
            }

            // Alle anwählen / abwählen
            const btnSelectAll = grid.parentElement.querySelector('.fm-config-select-all');
            const btnDeselectAll = grid.parentElement.querySelector('.fm-config-deselect-all');

            btnSelectAll?.addEventListener('click', () => {
                console.info(`[FM][Config] Alle Fahrzeuge anwählen`);
                grid.querySelectorAll('.fm-config-cell').forEach(cell => {
                    const cb = cell.querySelector('.fm-config-select');
                    if (!cb) return;
                    cb.checked = true;
                    cell.style.display = '';
                });
                updateHeaderCount();
                saveConfig();
            });

            btnDeselectAll?.addEventListener('click', () => {
                console.info(`[FM][Config] Alle Fahrzeuge abwählen`);
                grid.querySelectorAll('.fm-config-cell').forEach(cell => {
                    const cb = cell.querySelector('.fm-config-select');
                    if (!cb) return;
                    cb.checked = false;
                    cell.style.display = 'none';
                });
                updateHeaderCount();
                saveConfig();
            });

            // Initial zählen & ausblenden abgewählter Zellen
            grid.querySelectorAll('.fm-config-cell').forEach(cell => {
                const cb = cell.querySelector('.fm-config-select');
                if (cb && !cb.checked) cell.style.display = 'none';
            });
            updateHeaderCount();

        }, 0);

        return html;
    }

    function getMissingVehiclesForBuilding(building, vehicleMap, vehicleTypeMap) {
        console.group(`[FM][Debug][Missing] Wache: "${building.caption}"`);

        // Fahrzeuge auf der Wache
        const vehiclesOnBuilding = vehicleMap[building.id] || [];
        console.info('🚓 Fahrzeuge auf der Wache:', vehiclesOnBuilding.map(v => v.vehicle_type));

        // vorhandene Fahrzeuge pro Typ zählen
        const istByType = {};
        vehiclesOnBuilding.forEach(v => {
            const tid = String(v.vehicle_type);
            istByType[tid] = (istByType[tid] || 0) + 1;
        });
        console.info('🔢 Vorhandene Anzahl pro Typ:', istByType);

        // Config-Key: building_type_small/normal
        const buildingKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;

        // Config laden
        let config = [];
        try {
            config = JSON.parse(localStorage.getItem(`fm-config-${buildingKey}`)) || [];
        } catch (e) {
            console.warn(`[FM][Debug] Fehler beim Laden der Config für ${building.caption}`, e);
            config = [];
        }
        console.info('📦 Geladene Config:', config.map(c => ({caption: c.caption, typeId: c.typeId, checked: c.checked, amount: c.amount})));

        const missing = [];
        const missingVehicleIds = [];
        let totalCredits = 0;
        let totalCoins = 0;

        config.forEach(c => {
            if (!c.checked) {
                console.info(`⛔ Überspringe "${c.caption}" (nicht ausgewählt)`);
                return;
            }

            const requestedAmount = parseInt(c.amount, 10) || 1;
            let typeId = c.typeId != null ? String(c.typeId) : null;

            // fallback über caption, falls typeId fehlt
            if (!typeId) {
                const vtEntry = Object.entries(vehicleTypeMap).find(
                    ([id, v]) => (v.caption || '').trim() === (c.caption || '').trim()
                );
                if (vtEntry) typeId = String(vtEntry[0]);
                console.info(`🔍 Fallback über Caption für "${c.caption}" → TypId: ${typeId}`);
            }

            if (!typeId) {
                console.warn(`⚠️ Kein Typ gefunden für "${c.caption}"`);
                return;
            }

            const ist = istByType[typeId] || 0;
            const diff = Math.max(requestedAmount - ist, 0);

            if (diff <= 0) {
                console.info(`✅ Typ ${typeId} ("${c.caption}") ausreichend vorhanden (${ist}/${requestedAmount})`);
                return;
            }

            const vt = vehicleTypeMap[typeId];
            if (vt) {
                totalCredits += (vt.credits || 0) * diff;
                totalCoins += (vt.coins || 0) * diff;
            }

            for (let i = 0; i < diff; i++) missingVehicleIds.push(parseInt(typeId, 10));
            missing.push(diff > 1 ? `${diff}x ${c.caption}` : c.caption);

            console.info(`❌ Fehlend: ${diff}x "${c.caption}"`);
        });

        console.info('🏁 Endgültig fehlen:', missing.length ? missing.join(', ') : 'Keine');
        console.groupEnd();

        return {
            names: missing.join(',<wbr> ') || 'Keine',
            totalCredits,
            totalCoins,
            vehiclesIds: missingVehicleIds
        };
    }

    // Expose updateSelectedCosts globally in case listeners need it
    window.fm_updateSelectedCosts = updateSelectedCosts;

    async function buyVehicles(rows, currency, confirmBeforeBuy = true) {
        if (!rows || rows.length === 0) return;

        // Alle Fahrzeug-IDs sammeln
        const allVehicleIds = [];
        const buildingMap = {}; // für Anzeige im Overlay
        rows.forEach(row => {
            const vehicleIds = JSON.parse(row.dataset.missingVehicleIds || '[]');
            if (vehicleIds.length > 0) {
                allVehicleIds.push(...vehicleIds.map(id => ({buildingId: parseInt(row.dataset.buildingId,10), vehicleId: id})));
                buildingMap[row.dataset.buildingId] = row.closest('tr').cells[2]?.textContent || `Wache ${row.dataset.buildingId}`;
            }
        });

        if (allVehicleIds.length === 0) {
            console.info("✅ Keine Fahrzeuge zu kaufen.");
            return;
        }

        // --- Gesamtkosten berechnen ---
        let totalCost = 0;
        allVehicleIds.forEach(v => {
            const vt = vehicleTypeMapGlobal[v.vehicleId];
            if (!vt) return;
            totalCost += currency === 'credits' ? vt.credits : vt.coins;
        });

        const available = currency === 'credits' ? currentCredits : currentCoins;
        if (totalCost > available) {
            alert(`❌ Nicht genug ${currency}!\nBenötigt: ${totalCost.toLocaleString()} ${currency}\nVorhanden: ${available.toLocaleString()} ${currency}`);
            return;
        }

        // --- Bestätigung nur bei Sammelkauf ---
        if (confirmBeforeBuy && !confirm(`Sollen wirklich ${allVehicleIds.length} Fahrzeuge (${totalCost.toLocaleString()} ${currency}) gekauft werden?`)) {
            return;
        }

        // --- Fortschrittsanzeige im Modal-Header ---
        const progressContainer = document.getElementById('fm-progress-container');
        const progressText = document.getElementById('fm-progress-text');
        const progressBar = document.getElementById('fm-progress-bar');
        progressContainer.style.display = 'block';
        progressText.style.display = 'block';
        progressBar.style.width = '0%';
        progressText.textContent = `0 / ${allVehicleIds.length} Fahrzeuge gekauft`;

        // --- Kauf durchführen ---
        for (let i = 0; i < allVehicleIds.length; i++) {
            const { buildingId, vehicleId } = allVehicleIds[i];
            const url = `/buildings/${buildingId}/vehicle/${buildingId}/${vehicleId}/${currency}?building=${buildingId}`;

            try {
                const res = await fetch(url, { method: 'GET' });
                if (res.ok) {
                    console.info(`✅ Fahrzeugtyp ${vehicleId} auf Wache ${buildingId} gekauft`);
                } else {
                    let text = '';
                    try { text = await res.text(); } catch {}
                    console.warn(`⚠️ Fehler beim Kauf von Typ ${vehicleId} auf Wache ${buildingId} (Status ${res.status})`, text.slice(0,200));
                }
            } catch (err) {
                console.error(`❌ Kauf fehlgeschlagen für Typ ${vehicleId} auf Wache ${buildingId}:`, err);
            }

            // Fortschritt aktualisieren
            progressText.textContent = `${i + 1} / ${allVehicleIds.length} Fahrzeuge gekauft`;
            progressBar.style.width = `${Math.round(((i+1)/allVehicleIds.length)*100)}%`;

            // nur bei Sammelkauf Pause einfügen
            if (confirmBeforeBuy) await new Promise(r => setTimeout(r, 1000));
        }

        progressText.textContent = `✅ Kauf abgeschlossen (${allVehicleIds.length} Fahrzeuge)`;
        progressBar.style.width = `100%`;

        setTimeout(() => {
            progressContainer.style.display = 'none';
            progressBar.style.width = '0%';
        }, 2000);

        // Ansicht aktualisieren
        await loadBuildingsFromAPI();
    }

    // --- Eventlistener anpassen ---

    // Einzelkauf (kein Confirm)
    document.addEventListener('click', async e => {
        if (e.target && (e.target.classList.contains('fm-buy-credit') || e.target.classList.contains('fm-buy-coin'))) {
            e.preventDefault();
            const row = e.target.closest('tr');
            if (!row) return;
            const currency = e.target.classList.contains('fm-buy-credit') ? 'credits' : 'coins';
            await buyVehicles([row], currency, false);
        }
    });

    // Sammelkauf "Alle kaufen" (mit Confirm)
    document.addEventListener('click', async e => {
        if (e.target && (e.target.classList.contains('fm-buy-selected-credits') || e.target.classList.contains('fm-buy-selected-coins'))) {
            e.preventDefault();
            const table = e.target.closest('table');
            if (!table) return;
            const currency = e.target.classList.contains('fm-buy-selected-credits') ? 'credits' : 'coins';
            const selectedRows = [...table.querySelectorAll('tbody tr input.fm-select:checked')].map(cb => cb.closest('tr'));
            if (selectedRows.length === 0) {
                alert('Bitte mindestens eine Wache auswählen.');
                return;
            }
            await buyVehicles(selectedRows, currency, true);
        }
    });

})();
