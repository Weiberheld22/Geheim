// ==UserScript==
// @name         Leitstellenspiel Fahrzeug-Manager mit Fahrzeugnamen
// @namespace    https://leitstellenspiel.de/
// @version      2.5
// @description  Fahrzeug-Manager mit Credits/Coins + eigene Spoiler nach Gebäudetyp + Fahrzeuge auf Wache als Namen
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

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

    function getBuildingTypeName(building) {
        let typeId = building.building_type;
        const size = building.small_building ? 'small' : 'normal';
        const key = `${typeId}_${size}`;
        return buildingTypeNames[key] ?? null;
    }

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

    // Modal HTML
    const modalHTML = `
    <div class="modal fade" id="fahrzeugManagerModal" tabindex="-1" role="dialog" aria-labelledby="fahrzeugManagerLabel">
      <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
          <div class="modal-header" style="display: flex; flex-direction: column; gap: 5px;">
              <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <h3 class="modal-title" id="fahrzeugManagerLabel" style="font-weight: bold; margin: 0;">🚒 Fahrzeug-Manager</h3>
                  <button type="button" class="fm-close-btn" data-dismiss="modal">Schließen ✖</button>
              </div>
              <div style="display: grid; grid-template-columns: max-content 1fr; gap: 15px; row-gap: 3px; align-items: center; font-size: 14px;">
                  <div>Aktuelle Credits: <span id="fm-credits" style="color: #5cb85c; font-weight: bold;">0</span></div>
                  <div>Ausgewählte Credits: <span id="fm-costs-credits" style="color: #5cb85c; font-weight: bold;">0</span></div>
                  <div>Aktuelle Coins: <span id="fm-coins" style="color: #dc3545; font-weight: bold;">0</span></div>
                  <div>Ausgewählte Coins: <span id="fm-costs-coins" style="color: #dc3545; font-weight: bold;">0</span></div>
              </div>
          </div>
          <div class="modal-body" id="fahrzeug-manager-content">
            <p>Lade Daten...</p>
          </div>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

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
    `);

    async function loadVehiclesFromAPI() {
        try {
            const res = await fetch('/api/vehicles');
            const vehicles = await res.json(); // liefert Array
            const vehicleMap = {};
            vehicles.forEach(v => {
                if (!vehicleMap[v.building_id]) vehicleMap[v.building_id] = [];
                vehicleMap[v.building_id].push(v);
            });
            return vehicleMap;
        } catch (error) {
            console.error('Fehler beim Laden der Fahrzeugdaten:', error);
            return {};
        }
    }

    // --- Tabelle bauen ---
    function buildFahrzeugTable(buildings, tableId, vehicleMap) {
        const leitstellen = [...new Set(buildings.map(b => b.leitstelle_caption).filter(Boolean))];
        const wachen = [...new Set(buildings.map(b => b.caption).filter(Boolean))];

        let html = `<table class="table fm-table" id="fm-table-${tableId}">
<thead>
<tr><th></th><th>Leitstelle</th><th>Wache</th><th>Fahrzeuge</th><th>Freie Stellplätze</th><th>Fahrzeuge auf Wache</th><th>Kaufen mit Credits</th><th>Kaufen mit Coins</th></tr>
<tr class="fm-filter-row">
<td><input type="checkbox" class="fm-select-all" data-table="${tableId}"></td>
<td><select class="fm-filter-leitstelle" data-table="${tableId}"><option value="">Alle</option>${leitstellen.map(n=>`<option value="${n}">${n}</option>`).join('')}</select></td>
<td><select class="fm-filter-wache" data-table="${tableId}"><option value="">Alle</option>${wachen.map(n=>`<option value="${n}">${n}</option>`).join('')}</select></td>
<td><button class="fm-filter-reset btn btn-primary btn-xs" data-table="${tableId}">Reset</button></td><td></td><td></td><td></td><td></td>
</tr>
</thead>
<tbody>`;

        // Alphabetisch nach Wachenname sortieren
    const sortedBuildings = buildings.slice().sort((a, b) => a.caption.localeCompare(b.caption));

    sortedBuildings.forEach((b, idx) => {
        const vehiclesOnBuilding = vehicleMap[b.id] || [];
        const vehicleCountMap = {};
        const maxVehicles = (b.level ?? 0) + 1; // Level 0 → 1 Platz, Level 1 → 2 Plätze, etc.
        const freeSlots = Math.max(maxVehicles - vehiclesOnBuilding.length, 0);
        vehiclesOnBuilding.forEach(v => {
            const name = v.caption;
            vehicleCountMap[name] = (vehicleCountMap[name] || 0) + 1;
        });
        const vehicleNames = Object.entries(vehicleCountMap)
            .map(([name, count]) => count > 1 ? `${count}x ${name}` : name)
            .join(', ') || '-';

            html += `<tr>
<td><input type="checkbox" class="fm-select" id="fm-select-${tableId}-${idx}"></td>
<td>${b.leitstelle_caption ?? '-'}</td>
<td>${b.caption}</td>
<td>${b.vehicle_count ?? 0}</td>
<td><span class="badge">${freeSlots}</span></td>
<td>${vehicleNames}</td>
<td><button class="btn btn-success btn-xs fm-buy-credit">Kaufen (Credits)</button></td>
<td><button class="btn btn-danger btn-xs fm-buy-coin">Kaufen (Coins)</button></td>
</tr>`;
        });

        html += `</tbody></table>`;

        setTimeout(() => {
            const table = document.getElementById(`fm-table-${tableId}`);
            if (!table) return;
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
                .filter(r => r.style.display!=='none')
                .map(r => r.querySelector('.fm-select'));
                allCheckbox.checked = visibleCheckboxes.length>0 && visibleCheckboxes.every(cb=>cb.checked);
            }

            allCheckbox.addEventListener('change', () => {
                const checked = allCheckbox.checked;
                table.querySelectorAll('tbody tr').forEach(row => { if(row.style.display!=='none') row.querySelector('.fm-select').checked=checked; });
                updateSelectedCosts();
            });
            filterLeitstelle.addEventListener('change', applyFilters);
            filterWache.addEventListener('change', applyFilters);
            resetBtn.addEventListener('click', ()=>{ filterLeitstelle.value=''; filterWache.value=''; applyFilters(); });
            table.querySelectorAll('.fm-select').forEach(cb => {
                cb.addEventListener('change', ()=>{ applyFilters(); updateSelectedCosts(); });
            });
        },0);

        return html;
    }

    function buildBuildingsByType(buildings, vehicleMap) {
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
                html+=`<div class="fm-spoiler">
<div class="fm-spoiler-header" data-target="fm-spoiler-body-${idx}">${typeName}</div>
<div id="fm-spoiler-body-${idx}" class="fm-spoiler-body">${buildFahrzeugTable(grouped[typeName], idx, vehicleMap)}</div>
</div>`;
            }
        });
        return html;
    }

    async function loadBuildingsFromAPI() {
        const content = document.getElementById('fahrzeug-manager-content');
        content.innerHTML = '<p><span class="glyphicon glyphicon-refresh glyphicon-spin"></span> Lade Übersicht...</p>';
        try {
            const [buildings, vehicleMap] = await Promise.all([
                fetch('/api/buildings').then(r=>r.json()),
                loadVehiclesFromAPI()
            ]);

            const leitstellenMap = {};
            buildings.forEach(b => { if(b.building_type===7 || b.is_leitstelle) leitstellenMap[b.id]=b.caption; });
            buildings.forEach(b => {
                b.leitstelle_caption = b.leitstelle_building_id && leitstellenMap[b.leitstelle_building_id] ? leitstellenMap[b.leitstelle_building_id] : "-";
                b.vehicle_count = (vehicleMap[b.id] || []).length;
            });

            const filteredBuildings = buildings.filter(b=>getBuildingTypeName(b)!==null);
            content.innerHTML = buildBuildingsByType(filteredBuildings, vehicleMap);

            document.querySelectorAll('.fm-spoiler-header').forEach(header=>{
                header.addEventListener('click', ()=>{
                    const targetId = header.dataset.target;
                    document.querySelectorAll('.fm-spoiler-body').forEach(body=>{
                        body.id===targetId ? body.classList.toggle('active') : body.classList.remove('active');
                    });
                });
            });
        } catch(err) {
            content.innerHTML = `<div class="alert alert-danger">❌ Fehler beim Laden der Daten: ${err}</div>`;
        }
    }

    document.addEventListener('click', e=>{
        if(e.target && e.target.id==='fahrzeug-manager-btn'){
            e.preventDefault();
            $('#fahrzeugManagerModal').modal('show');
            loadBuildingsFromAPI();
        }
    });

    async function updateUserResources(){
        try{
            const res = await fetch('/api/userinfo');
            const data = await res.json();
            document.getElementById('fm-credits').textContent=(data.credits_user_current||0).toLocaleString();
            document.getElementById('fm-coins').textContent=(data.coins_user_current||0).toLocaleString();
        } catch(e){ console.warn(e); }
    }
    setInterval(updateUserResources,1000); updateUserResources();

    function updateSelectedCosts(){
        let totalCredits=0,totalCoins=0;
        document.querySelectorAll('.fm-select:checked').forEach(cb=>{
            totalCredits += parseInt(cb.dataset.credits,10)||0;
            totalCoins += parseInt(cb.dataset.coins,10)||0;
        });
        document.getElementById('fm-costs-credits').textContent=totalCredits.toLocaleString();
        document.getElementById('fm-costs-coins').textContent=totalCoins.toLocaleString();
    }

})();
