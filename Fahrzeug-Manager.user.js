// ==UserScript==
// @name         LSS Fahrzeug-Manager mit API & globaler Konfiguration
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Fahrzeug-Manager mit Tabellen, Spoilern pro Gebäudetyp, Dark/Light Mode, mittiger Lightbox, API-Daten und globaler Fahrzeug-Konfiguration
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @grant        none
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
        '26_normal': 'Seenotrettungswache'
    };
    const globalWachenConfig = {};

    // === CSS einfügen ===
    function addFahrzeugManagerStyles() {
        if (document.getElementById('fahrzeug-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'fahrzeug-manager-styles';
        style.innerHTML = `
        :root {
            --fm-background-color: #ffffff;
            --fm-text-color: #000000;
            --fm-border-color: #ccc;
            --fm-button-background-color: #007bff;
            --fm-button-text-color: #ffffff;
            --fm-danger-color: #dc3545;
            --fm-success-color: #28a745;
            --fm-spoiler-bg-light: #eee;
            --fm-spoiler-bg-dark: #444;
            --fm-spoiler-text-light: #000;
            --fm-spoiler-text-dark: #fff;
        }

        #fahrzeug-manager-lightbox {
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
            z-index: 9999;
            overflow-y: auto;
        }

        #fahrzeug-manager-content {
            background: var(--fm-background-color);
            color: var(--fm-text-color);
            border: 1px solid var(--fm-border-color);
            padding: 20px;
            width: 90%;
            max-width: 2000px;
            max-height: 80vh;
            overflow-y: auto;
            border-radius: 8px;
            position: relative;
            box-sizing: border-box;
        }

        #fahrzeug-manager-content h2 {
            text-align: left;
            margin-bottom: 15px;
        }

        #fahrzeug-manager-content table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
        }

        #fahrzeug-manager-content th,
        #fahrzeug-manager-content td {
            text-align: center;
            vertical-align: middle;
            border: 1px solid var(--fm-border-color);
            padding: 10px;
        }

        .fm-btn {
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            border: none;
            cursor: pointer;
            color: var(--fm-button-text-color);
            background-color: var(--fm-button-background-color);
        }

        .fm-btn-success {
            background-color: var(--fm-success-color);
            color: white;
        }

        .fm-btn-danger {
            background-color: var(--fm-danger-color);
            color: white;
        }

        .fm-btn-reset {
            background-color: var(--fm-button-background-color);
            color: var(--fm-button-text-color);
        }

        .fm-btn-xs {
            padding: 2px 6px;
            font-size: 12px;
            border-radius: 3px;
        }
        `;
        document.head.appendChild(style);
    }

    // === Menü-Button einfügen ===
    function addFahrzeugManagerButton() {
        const menu = document.querySelector('#menu_profile + .dropdown-menu');
        if (!menu) return;

        if (menu.querySelector('#fahrzeug-manager-button')) return;

        const li = document.createElement('li');
        li.setAttribute('role', 'presentation');

        const a = document.createElement('a');
        a.href = "#";
        a.id = "fahrzeug-manager-button";
        a.innerHTML = '<span class="glyphicon glyphicon-road"></span>&nbsp;&nbsp; Fahrzeug-Manager';

        a.addEventListener('click', function(e) {
            e.preventDefault();
            openFahrzeugManagerLightbox();
        });

        li.appendChild(a);

        const firstDivider = menu.querySelector('li.divider');
        if (firstDivider) {
            menu.insertBefore(li, firstDivider);
        } else {
            menu.appendChild(li);
        }
    }

    function waitForMenu() {
        const menu = document.querySelector('#menu_profile + .dropdown-menu');
        if(menu) {
            addFahrzeugManagerStyles();
            addFahrzeugManagerButton();
        } else {
            setTimeout(waitForMenu, 500);
        }
    }
    window.addEventListener('load', waitForMenu);

    // === Lightbox Haupt ===
    async function openFahrzeugManagerLightbox() {
        if(!document.getElementById('fahrzeug-manager-lightbox')) createFahrzeugManagerLightbox();

        const lightbox = document.getElementById('fahrzeug-manager-lightbox');
        const content = document.getElementById('fahrzeug-manager-content');

        lightbox.style.background = document.body.classList.contains('dark') ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.7)';
        content.style.backgroundColor = document.body.classList.contains('dark') ? '#2c2c2c' : '#ffffff';
        content.style.color = document.body.classList.contains('dark') ? '#fff' : '#000';
        lightbox.style.display = 'flex';

        // Daten laden
        await loadBuildingData();
    }

    function createFahrzeugManagerLightbox() {
        if(document.getElementById('fahrzeug-manager-lightbox')) return;

        const lightbox = document.createElement('div');
        lightbox.id = 'fahrzeug-manager-lightbox';

        const content = document.createElement('div');
        content.id = 'fahrzeug-manager-content';

        // Header + Close-Button
        const header = document.createElement('h2');
        header.innerText = 'Fahrzeug-Manager';

        // Global-Konfig Button
        const configButton = document.createElement('button');
        configButton.className = 'fm-btn fm-btn-success fm-btn-xs';
        configButton.style.marginLeft = '10px';
        configButton.innerText = 'Globale Wachen-Konfig';
        configButton.addEventListener('click', () => {
            openGlobalConfigLightbox(); // öffnet die globale Konfig-Lightbox
        });
        header.appendChild(configButton);

        // Close Button
        const closeButton = document.createElement('button');
        closeButton.id = 'fahrzeug-manager-close';
        closeButton.className = 'fm-btn fm-btn-danger';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.innerHTML = '&times;';
        closeButton.addEventListener('click', () => { lightbox.style.display = 'none'; });
        header.appendChild(closeButton);

        content.appendChild(header);


        // Spoiler pro Gebäudetyp
        for(const [type, name] of Object.entries(buildingTypeNames)) {
            const spoilerHeader = document.createElement('div');
            spoilerHeader.style.cursor = 'pointer';
            spoilerHeader.style.padding = '8px';
            spoilerHeader.style.marginTop = '10px';
            spoilerHeader.style.borderRadius = '4px';
            spoilerHeader.style.fontWeight = 'bold';
            spoilerHeader.innerText = name;
            if(document.body.classList.contains('dark')) {
                spoilerHeader.style.backgroundColor = 'var(--fm-spoiler-bg-dark)';
                spoilerHeader.style.color = 'var(--fm-spoiler-text-dark)';
            } else {
                spoilerHeader.style.backgroundColor = 'var(--fm-spoiler-bg-light)';
                spoilerHeader.style.color = 'var(--fm-spoiler-text-light)';
            }

            const table = document.createElement('table');
            table.className = 'table table-striped table-bordered';
            table.style.width = '100%';
            table.style.display = 'none';
            table.innerHTML = `
                <thead>
                    <tr>
                        <th>Leitstelle</th>
                        <th>Wachenname</th>
                        <th>Fahrzeuganzahl</th>
                        <th>Freie Stellplätze</th>
                        <th>Fahrzeugbezeichnung</th>
                        <th>Kaufen mit Credits</th>
                        <th>Kaufen mit Coins</th>
                    </tr>
                </thead>
            `;

            spoilerHeader.addEventListener('click', () => { table.style.display = table.style.display === 'none' ? 'table' : 'none'; });

            content.appendChild(spoilerHeader);
            content.appendChild(table);
        }

        lightbox.appendChild(content);
        document.body.appendChild(lightbox);
    }

    async function loadBuildingData() {
        console.log('Lade Gebäude- und Fahrzeug-Daten von API...');
        try {
            const [buildingsResponse, vehiclesResponse] = await Promise.all([
                fetch('https://www.leitstellenspiel.de/api/buildings'),
                fetch('https://www.leitstellenspiel.de/api/vehicles')
            ]);

            if(!buildingsResponse.ok || !vehiclesResponse.ok) throw new Error('API konnte nicht geladen werden');

            const buildings = await buildingsResponse.json();
            const vehicles = await vehiclesResponse.json();

            console.log('Gebäude-Daten:', buildings);
            console.log('Fahrzeuge-Daten:', vehicles);

            const config = getGlobalConfig();

            for(const [type, name] of Object.entries(buildingTypeNames)) {
                const table = Array.from(document.querySelectorAll('#fahrzeug-manager-content table'))
                .find(t => t.previousElementSibling && t.previousElementSibling.innerText === name);
                if(!table) continue;

                console.log(`Fülle Tabelle für ${name}`);

                const oldTbody = table.querySelector('tbody');
                if(oldTbody) table.removeChild(oldTbody);
                const tbody = document.createElement('tbody');

                let filteredBuildings = buildings.filter(b => {
                    const bType = `${b.building_type}_${b.small_building ? 'small' : 'normal'}`;
                    return bType === type;
                });
                filteredBuildings.sort((a,b) => a.caption.toUpperCase().localeCompare(b.caption.toUpperCase()));

                if(filteredBuildings.length === 0) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td colspan="7" style="text-align:center;">Keine Wachen vorhanden</td>`;
                    tbody.appendChild(tr);
                } else {
                    for(const b of filteredBuildings) {
                        const tr = document.createElement('tr');
                        tr.dataset.buildingId = b.id;

                        const vehiclesAtBuilding = vehicles.filter(v => v.building_id === b.id);
                        const currentVehicles = vehiclesAtBuilding.length;
                        const maxStellplaetze = b.level + 1;
                        const freeSpots = maxStellplaetze - currentVehicles;

                        let leitstelleName = '-';
                        if(b.leitstelle_building_id) {
                            const lstBuilding = buildings.find(l => l.id === b.leitstelle_building_id);
                            if(lstBuilding) leitstelleName = lstBuilding.caption;
                        }

                        // Fahrzeuge gruppieren
                        const counts = {};
                        vehiclesAtBuilding.forEach(v => {
                            let type = v.vehicle_type_caption || v.caption;
                            type = type.replace(/\s*-\s*\n\s*/g,'-').replace(/\n/g,' ').replace(/\s+/g,' ').trim();
                            counts[type] = (counts[type] || 0) + 1;
                        });

                        // Globale Konfiguration anwenden (fehlende Fahrzeuge markieren)
                        const configForBuilding = config[b.building_type + (b.small_building?'_small':'_normal')] || {};
                        const vehicleDisplay = Object.entries(counts)
                        .map(([type,count]) => {
                            const wanted = configForBuilding[type] || 0;
                            const missing = wanted - count;
                            return missing > 0 ? `<span style="color:red">${missing}x ${type}</span>` : `${count}x ${type}`;
                        }).join(', ');

                        tr.innerHTML = `
                            <td>${leitstelleName}</td>
                            <td>${b.caption}</td>
                            <td>${currentVehicles}</td>
                            <td>${freeSpots}</td>
                            <td>${vehicleDisplay || '-'}</td>
                            <td><button class="fm-btn fm-btn-success">Credits</button></td>
                            <td><button class="fm-btn fm-btn-danger">Coins</button></td>
                        `;

                        tbody.appendChild(tr);
                    }
                }

                table.appendChild(tbody);
                addColumnFilters(table);
            }
        } catch(err) {
            console.error(err);
        }
    }

    function addColumnFilters(table) {
        const thead = table.querySelector('thead');
        if(thead.querySelector('tr.filter-row')) return;

        const filterRow = document.createElement('tr');
        filterRow.className = 'filter-row';

        Array.from(thead.querySelectorAll('th')).forEach((th, colIndex) => {
            const thFilter = document.createElement('th');

            if(colIndex <= 3) {
                const select = document.createElement('select');
                select.style.width = '100%';
                select.innerHTML = `<option value="">Alle</option>`;
                const values = Array.from(table.querySelectorAll('tbody tr td:nth-child(' + (colIndex+1) + ')'))
                .map(td => td.innerText)
                .filter((v,i,a) => a.indexOf(v)===i).sort();
                values.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);
                select.addEventListener('change', () => {
                    const filterValue = select.value;
                    Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
                        const cellText = tr.querySelector('td:nth-child('+(colIndex+1)+')').innerText;
                        tr.style.display = (!filterValue || cellText === filterValue) ? '' : 'none';
                    });
                });
                thFilter.appendChild(select);
            } else if(colIndex===4) {
                const button = document.createElement('button');
                button.className = 'fm-btn fm-btn-reset fm-btn-xs';
                button.innerText = 'Filter zurücksetzen';
                button.addEventListener('click', () => {
                    thead.querySelectorAll('select').forEach(s=>s.value='');
                    Array.from(table.querySelectorAll('tbody tr')).forEach(tr=>tr.style.display='');
                });
                thFilter.appendChild(button);
            }

            filterRow.appendChild(thFilter);
        });

        thead.appendChild(filterRow);
    }

    // === Globale Fahrzeugkonfiguration ===
    function getGlobalConfig() {
        return JSON.parse(localStorage.getItem('globalVehicleConfig') || '{}');
    }

    function setGlobalConfig(config) {
        localStorage.setItem('globalVehicleConfig', JSON.stringify(config));
    }

    async function openGlobalConfigLightbox() {
        const oldBox = document.getElementById('global-config-lightbox');
        if(oldBox) oldBox.remove();

        const lightbox = document.createElement('div');
        lightbox.id = 'global-config-lightbox';
        lightbox.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);display:flex;justify-content:center;align-items:center;z-index:10001;";

        const box = document.createElement('div');
        box.style = "background:var(--fm-background-color);color:var(--fm-text-color);padding:20px;border-radius:8px;width:700px;max-height:80vh;overflow-y:auto;";
        box.innerHTML = `
        <h3>Globale Fahrzeug-Konfiguration</h3>
        <p>Pro Wachenart gewünschte Fahrzeuge und Stückzahl auswählen.</p>
        <div id="global-config-list">Lade Fahrzeugdaten…</div>
        <div style="margin-top:15px;text-align:right;">
            <button class="fm-btn fm-btn-success" id="global-config-save">Speichern</button>
            <button class="fm-btn fm-btn-danger" id="global-config-cancel">Schließen</button>
        </div>
    `;
        lightbox.appendChild(box);
        document.body.appendChild(lightbox);

        // Schließen-Button
        box.querySelector('#global-config-cancel').addEventListener('click', () => lightbox.remove());

        const configList = box.querySelector('#global-config-list');

        try {
            // API abfragen
            const [buildings, vehicles] = await Promise.all([
                fetch('https://www.leitstellenspiel.de/api/buildings').then(r => r.json()),
                fetch('https://www.leitstellenspiel.de/api/vehicles').then(r => r.json())
            ]);

            // Wachen nach Typ gruppieren
            const wachenByType = {};
            buildings.forEach(b => {
                const typeKey = `${b.building_type}_${b.small_building ? 'small' : 'normal'}`;
                if(!wachenByType[typeKey]) wachenByType[typeKey] = [];
                wachenByType[typeKey].push(b);
            });

            // Fahrzeugtypen pro Wache ermitteln
            const vehiclesByBuilding = {};
            vehicles.forEach(v => {
                if(!vehiclesByBuilding[v.building_id]) vehiclesByBuilding[v.building_id] = [];
                vehiclesByBuilding[v.building_id].push(v.vehicle_type_caption || v.caption);
            });

            // Für jede Wachenart eine Checkbox-Liste erstellen
            for(const [typeKey, buildingsOfType] of Object.entries(wachenByType)) {
                const typeName = buildingTypeNames[typeKey] || typeKey;
                const vehicleSet = new Set();
                buildingsOfType.forEach(b => {
                    (vehiclesByBuilding[b.id] || []).forEach(v => vehicleSet.add(v));
                });

                if(vehicleSet.size === 0) continue; // keine Fahrzeuge vorhanden

                const wacheDiv = document.createElement('div');
                wacheDiv.style.marginBottom = '15px';
                const title = document.createElement('h4');
                title.innerText = typeName;
                wacheDiv.appendChild(title);

                vehicleSet.forEach(v => {
                    const fDiv = document.createElement('div');
                    fDiv.style.marginBottom = '5px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.id = `${typeKey}-${v}`;
                    checkbox.dataset.wache = typeKey;
                    checkbox.dataset.fahrzeug = v;

                    // Wenn schon globale Konfig existiert, aktivieren
                    if(globalWachenConfig[typeKey] && globalWachenConfig[typeKey][v] > 0) {
                        checkbox.checked = true;
                    }

                    const label = document.createElement('label');
                    label.htmlFor = checkbox.id;
                    label.innerText = ` ${v} `;

                    const countInput = document.createElement('input');
                    countInput.type = 'number';
                    countInput.min = 1;
                    countInput.value = globalWachenConfig[typeKey] && globalWachenConfig[typeKey][v] ? globalWachenConfig[typeKey][v] : 1;
                    countInput.style.width = '50px';
                    countInput.disabled = !checkbox.checked;

                    checkbox.addEventListener('change', () => {
                        countInput.disabled = !checkbox.checked;
                    });

                    fDiv.appendChild(checkbox);
                    fDiv.appendChild(label);
                    fDiv.appendChild(countInput);
                    wacheDiv.appendChild(fDiv);
                });

                configList.appendChild(wacheDiv);
            }

        } catch (err) {
            console.error('Fehler beim Laden der Fahrzeugdaten:', err);
            configList.innerText = 'Fehler beim Laden der Fahrzeugdaten.';
        }

        // Speichern
        box.querySelector('#global-config-save').addEventListener('click', () => {
            for(const wacheDiv of configList.children) {
                const typeKey = Object.keys(buildingTypeNames).find(k => buildingTypeNames[k] === wacheDiv.querySelector('h4').innerText);
                if(!typeKey) continue;
                if(!globalWachenConfig[typeKey]) globalWachenConfig[typeKey] = {};

                const inputs = wacheDiv.querySelectorAll('input[type="checkbox"]');
                inputs.forEach(chk => {
                    const f = chk.dataset.fahrzeug;
                    const countInput = chk.nextSibling.nextSibling;
                    if(chk.checked) globalWachenConfig[typeKey][f] = parseInt(countInput.value, 10);
                    else delete globalWachenConfig[typeKey][f];
                });
            }
            console.log('Globale Wachen-Konfiguration gespeichert:', globalWachenConfig);
            lightbox.remove();
        });
    }

})();
