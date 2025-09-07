// ==UserScript==
// @name         LSS Fahrzeug-Manager
// @namespace    http://tampermonkey.net/
// @version      2.8
// @description  Übersicht & Konfig:
// @author       Du
// @match        https://www.leitstellenspiel.de/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Reihenfolge und Mapping
    const wachenOrder = [
        '0_normal', '0_small',
        '2_normal', '2_small',
        '6_normal', '6_small',
        '9_normal', '11_normal', '12_normal', '15_normal', '17_normal',
        '24_normal', '25_normal', '26_normal'
    ];
    const apiMapping = {
        '0_normal': 0, '0_small': 18, '2_normal': 2, '2_small': 20, '6_normal': 6, '6_small': 19,
        '9_normal': 9, '11_normal': 11, '12_normal': 12, '15_normal': 15, '17_normal': 17,
        '24_normal': 24, '25_normal': 25, '26_normal': 26
    };
    const buildingTypeNames = {
        '0_normal': 'Feuerwache (Normal)', '0_small': 'Feuerwache (Kleinwache)',
        '2_normal': 'Rettungswache (Normal)', '2_small': 'Rettungswache (Kleinwache)',
        '6_normal': 'Polizeiwache (Normal)', '6_small': 'Polizeiwache (Kleinwache)',
        '9_normal': 'Technisches Hilfswerk', '11_normal': 'Bereitschaftspolizei',
        '12_normal': 'Schnelleinsatzgruppe (SEG)', '15_normal': 'Wasserrettung',
        '17_normal': 'Polizei-Sondereinheiten', '24_normal': 'Reiterstaffel',
        '25_normal': 'Bergrettungswache', '26_normal': 'Seenotrettungswache'
    };
    let globalWachenConfig = {};

    // Funktion für Hinzufügen der Styles (CSS für Buttons, Tabellen, Spoiler usw.)
    function addFahrzeugManagerStyles() {
        if (document.getElementById('fahrzeug-manager-styles')) return;

        const style = document.createElement('style');
        style.id = 'fahrzeug-manager-styles';
        style.innerHTML = `
    /* =========================
       ROOT VARIABLEN
       ========================= */
    :root {
        /* Button Colors */
        --fm-btn-primary-bg: #007bff;
        --fm-btn-success-bg: #28a745;
        --fm-btn-danger-bg: #dc3545;
        --fm-btn-coin-bg: #dc3545;
        --fm-btn-close-bg: #dc3545;
        --fm-btn-primary-txt: #fff;
        --fm-btn-success-txt: #fff;
        --fm-btn-danger-txt: #fff;

        /* Backgrounds & Text */
        --fm-background-light: #fff;
        --fm-background-dark: #222;
        --fm-text-light: #222;
        --fm-text-dark: #fff;

        /* Borders & Spoiler */
        --fm-border-light: #bbb;
        --fm-border-dark: #444;
        --fm-spoiler-bg-light: #eee;
        --fm-spoiler-bg-dark: #444;
        --fm-spoiler-txt-light: #000;
        --fm-spoiler-txt-dark: #fff;
    }

    /* =========================
       LIGHTBOX & BOX
       ========================= */
    .fm-lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        background: rgba(0,0,0,0.7);
    }

    .fm-box {
        min-width: 350px;
        max-width: 2000px;
        width: 95vw;
        background: var(--fm-background-light);
        color: var(--fm-text-light);
        border: 1px solid var(--fm-border-light);
        border-radius: 10px;
        padding: 20px;
        position: relative;
        max-height: 95vh;
        overflow-y: auto;
    }

    .dark .fm-box {
        background: var(--fm-background-dark);
        color: var(--fm-text-dark);
        border-color: var(--fm-border-dark);
    }

    /* =========================
       BUTTONS
       ========================= */
    .fm-btn {
        font-size: 14px;
        border: none;
        border-radius: 4px;
        padding: 5px 10px;
        cursor: pointer;
        transition: filter 0.1s;
        outline: none;
    }
    .fm-btn:active { filter: brightness(0.9); }
    .fm-btn:focus { box-shadow: 0 0 0 2px #88aaff88; }
    .fm-btn-primary { background-color: var(--fm-btn-primary-bg); color: var(--fm-btn-primary-txt); }
    .fm-btn-success { background-color: var(--fm-btn-success-bg); color: var(--fm-btn-success-txt); }
    .fm-btn-danger  { background-color: var(--fm-btn-danger-bg); color: var(--fm-btn-danger-txt); }
    .fm-btn-coin    { background-color: var(--fm-btn-coin-bg);   color: var(--fm-btn-danger-txt); }
    .fm-btn-close   { background-color: var(--fm-btn-close-bg);  color: var(--fm-btn-danger-txt); }

    /* =========================
       HEADER
       ========================= */
    .fm-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }
    .fm-header h2 { margin: 0; }
    .fm-header-btns {
        display: flex;
        gap: 8px;
    }

    /* =========================
       TABLES
       ========================= */
    .fm-table {
    width: 100%;          /* Tabelle passt sich der Box an */
    table-layout: auto;    /* flexible Spaltenbreite */
}
    .fm-table th, .fm-table td {
        padding: 5px 7px;
        text-align: center;
        border: 1px solid var(--fm-border-light);
    }
    .dark .fm-table th, .dark .fm-table td {
        border: 1px solid var(--fm-border-dark);
    }
    .fm-table td.wache,
    .fm-table td.leitstelle {
        white-space: nowrap;
        overflow: visible;
    }

    /* =========================
       MISSING VEHICLES
       ========================= */
    .fm-missing {
        color: var(--fm-btn-danger-bg);
        font-weight: bold;
    }

    /* =========================
       FILTER ROW
       ========================= */
    .fm-filter-row select { font-size:12px; width:100%; }

    /* =========================
       CHECKBOX ROWS
       ========================= */
    .fm-checkbox-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 5px;
    }
    .fm-checkbox-row label, .fm-checkbox-row span {
        font-size: 15px;
        margin: 0 6px 0 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .fm-checkbox-row input[type=number] {
        width: 44px;
        margin-left: 4px;
    }
    .fm-checkbox-row input[type="checkbox"] {
        align-self: flex-start;
        margin-top: 6px;
    }

    /* =========================
       ROW STATES
       ========================= */
    .fm-row-inactive { opacity: 0.4; pointer-events: auto; }
    .fm-row-disabled { opacity: 0.25 !important; pointer-events: none !important; }
    .fm-ext-hint {
        font-size:10px;
        color:var(--fm-btn-danger-bg);
        margin-left:5px;
    }
    .dark .fm-ext-hint { color:var(--fm-btn-danger-bg); }

    /* =========================
       SPOILER
       ========================= */
    .fm-spoiler {
        background: var(--fm-spoiler-bg-light);
        color: var(--fm-spoiler-txt-light);
        border-radius: 7px;
        margin: 8px 0 4px 0;
        padding: 7px 10px;
        cursor: pointer;
        user-select: none;
        font-weight: bold;
        transition: background 0.2s;
    }
    .dark .fm-spoiler {
        background: var(--fm-spoiler-bg-dark);
        color: var(--fm-spoiler-txt-dark);
    }
    .fm-spoiler-content {
    width: 100%;          /* volle Breite der Box */
    max-width: 100%;      /* kein Überschreiten der Box */
    padding: 10px;        /* Innenabstand */
    overflow-x: auto;     /* optional: Scroll nur wenn nötig */
}
    .fm-spoiler.fm-open + .fm-spoiler-content {
        max-height: 2000px;
        overflow: visible;
        padding-top: 7px;
        padding-bottom: 10px;
        margin-bottom: 10px;
    }
    `;
        document.head.appendChild(style);
    }

    // Funktion für das Erstellen von einheitlich gestylten Buttons
    function createStyledButton(label, opts = {}) {
        const btn = document.createElement('button');
        btn.className = 'fm-btn';
        if (opts.variant) btn.classList.add('fm-btn-' + opts.variant);
        btn.textContent = label;
        if (opts.title) btn.title = opts.title;
        if (opts.onclick) btn.onclick = opts.onclick;
        return btn;
    }

    // Funktion für Hinzufügen des Menüeintrags „Fahrzeug-Manager“ im Profildropdown
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
        a.onclick = e => {
            e.preventDefault();
            if (typeof openMainLightbox === 'function') openMainLightbox();
            else console.warn('openMainLightbox() noch nicht verfügbar');
        };

        li.appendChild(a);

        const firstDivider = menu.querySelector('li.divider');
        if (firstDivider) menu.insertBefore(li, firstDivider);
        else menu.appendChild(li);

        console.info('Fahrzeug-Manager Button hinzugefügt');
    }

    // MutationObserver, der das Menü überwacht
    function observeMenu() {
        const target = document.body;
        const observer = new MutationObserver(() => {
            const menu = document.querySelector('#menu_profile + .dropdown-menu');
            if (menu) {
                addFahrzeugManagerButton();
                observer.disconnect(); // nur einmal nötig
            }
        });
        observer.observe(target, { childList: true, subtree: true });
    }

    // Initialisierung beim Laden der Seite
    window.addEventListener('load', () => {
        addFahrzeugManagerStyles();
        observeMenu();
    });

    // Funktion für den Button „Globale Fahrzeug-Konfiguration“ (öffnet Lightbox)
    function openGlobalConfigBtn() {
        return createStyledButton('Globale Fahrzeug-Konfiguration', {
            variant: 'primary',
            onclick: () => openGlobalConfigModal()
        });
    }

    // Funktion für das Öffnen der Haupt-Lightbox (Übersicht aller Wachen + Fahrzeuge)
    async function openMainLightbox() {
        document.querySelectorAll('.fm-lightbox:not(#fm-globalconfig-lightbox)').forEach(e=>e.remove());
        const lightbox = document.createElement('div');
        lightbox.className = 'fm-lightbox';
        lightbox.id = 'fm-main-lightbox';
        if(document.body.classList.contains('dark')) lightbox.style.background = 'rgba(0,0,0,0.88)';
        document.body.appendChild(lightbox);

        const box = document.createElement('div');
        box.className = 'fm-box';
        box.style.maxWidth = "2000px";
        box.innerHTML = `
            <div class="fm-header">
                <h2>Fahrzeug-Manager Übersicht</h2>
                <div class="fm-header-btns"></div>
            </div>
            <div id="main-fahrzeug-manager-list">Lade Gebäudedaten…</div>
        `;
        const btnContainer = box.querySelector('.fm-header-btns');
        btnContainer.appendChild(openGlobalConfigBtn());
        // Schließen-Button = Danger
        btnContainer.appendChild(createStyledButton('Schließen', {
            variant: 'close',
            onclick: () => lightbox.remove()
        }));

        lightbox.appendChild(box);
        await renderMainOverview(box.querySelector('#main-fahrzeug-manager-list'));
    }

    // Funktion für das Rendern der Hauptübersicht (Tabelle mit Wachen und Fahrzeugstatus)
   async function renderMainOverview(container) {
    container.innerHTML = 'Lade Gebäudedaten…';
    try {
        const [buildings, vehicles, allVehicles] = await Promise.all([
            fetch('https://www.leitstellenspiel.de/api/buildings').then(r => r.json()),
            fetch('https://www.leitstellenspiel.de/api/vehicles').then(r => r.json()),
            fetch('https://api.lss-manager.de/de_DE/vehicles').then(r => r.json())
        ]);
        const globalConfigData = getGlobalConfig();
        globalWachenConfig = globalConfigData.vehicles || {};

        const wachenByType = {};
        buildings.forEach(b => {
            const typeKey = `${b.building_type}_${b.small_building ? 'small' : 'normal'}`;
            if (!wachenByType[typeKey]) wachenByType[typeKey] = [];
            wachenByType[typeKey].push(b);
        });

        container.innerHTML = '';
        const allSpoilers = [];

        wachenOrder.forEach(typeKey => {
            const apiBuildingType = apiMapping[typeKey];
            const typeName = buildingTypeNames[typeKey] || typeKey;
            const buildingsList = wachenByType[typeKey] || [];
            if (buildingsList.length === 0) return;

            const allowedVehicles = Object.values(allVehicles)
            .filter(v => Array.isArray(v.possibleBuildings) &&
                    v.possibleBuildings.map(Number).includes(Number(apiBuildingType)))
            .sort((a, b) => a.caption.localeCompare(b.caption, 'de'));

            const spoiler = document.createElement('div');
            spoiler.className = 'fm-spoiler';
            spoiler.tabIndex = 0;
            spoiler.innerText = `${typeName} (${buildingsList.length})`;
            allSpoilers.push(spoiler);

            const content = document.createElement('div');
            content.className = 'fm-spoiler-content';
            content.style.display = 'none'; // Spoiler standardmäßig geschlossen

            // Tabelle erstellen
            const table = document.createElement('table');
            table.className = 'fm-table';

            table.innerHTML = `
<thead>
<tr>
    <th>Alle An-/Abwählen</th>
    <th>Leitstelle</th>
    <th>Wachenname</th>
    <th>Fahrzeuganzahl</th>
    <th>Freie Stellplätze</th>
    <th>Fahrzeugbezeichnung</th>
    <th>Kaufen mit Credits</th>
    <th>Kaufen mit Coins</th>
</tr>
<tr class="fm-filter-row">
    <th><input type="checkbox" id="fm-select-all-${typeKey}"></th>
    <th>
        <select><option value=''>Alle</option></select>
    </th>
    <th>
        <select><option value=''>Alle</option></select>
    </th>
    <th></th>
    <th></th>
    <th></th>
    <th></th>
    <th></th>
</tr>
</thead>
<tbody></tbody>
`;

            const thead = table.querySelector('thead');
            const filterRow = thead.querySelector('.fm-filter-row');

            // Leitstelle-Pulldown
            const leitstelleSelect = filterRow.children[1].querySelector('select');
            Array.from(new Set(buildingsList.map(b => {
                if (b.leitstelle_building_id) {
                    const lst = buildings.find(l => l.id === b.leitstelle_building_id);
                    return lst ? lst.caption : '';
                }
                return '';
            })))
                .filter(Boolean).sort((a, b) => a.localeCompare(b, 'de'))
                .forEach(n => { let o = document.createElement('option'); o.value = n; o.innerText = n; leitstelleSelect.appendChild(o); });
            leitstelleSelect.onchange = () => updateTableFilter(table, 1, leitstelleSelect.value);

            // Wachenname-Pulldown
            const wacheSelect = filterRow.children[2].querySelector('select');
            buildingsList.map(b => b.caption).sort((a, b) => a.localeCompare(b, 'de')).forEach(n => {
                let o = document.createElement('option'); o.value = n; o.innerText = n; wacheSelect.appendChild(o);
            });
            wacheSelect.onchange = () => updateTableFilter(table, 2, wacheSelect.value);

            // Body
            const tbody = table.querySelector('tbody');
            buildingsList.sort((a, b) => a.caption.localeCompare(b.caption, 'de')).forEach(b => {
                const tr = document.createElement('tr');

                // Checkbox
                const checkboxTd = document.createElement('td');
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.dataset.buildingId = b.id;
                checkboxTd.appendChild(checkbox);
                tr.appendChild(checkboxTd);

                const vehiclesAtBuilding = vehicles.filter(v => v.building_id === b.id);
                const currentVehicles = vehiclesAtBuilding.length;
                const maxStellplaetze = b.level + 1;
                const freeSpots = maxStellplaetze - currentVehicles;
                let leitstelleName = '-';
                if (b.leitstelle_building_id) {
                    const lstBuilding = buildings.find(l => l.id === b.leitstelle_building_id);
                    if (lstBuilding) leitstelleName = lstBuilding.caption;
                }
                const counts = {};
                vehiclesAtBuilding.forEach(v => {
                    let type = v.vehicle_type_caption || v.caption;
                    type = type.replace(/\s*-\s*\n\s*/g, '-').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
                    counts[type] = (counts[type] || 0) + 1;
                });
                const configForBuilding = globalWachenConfig[typeKey] || {};

                const vehicleDisplay = allowedVehicles.map(v => {
                    const name = v.caption;
                    const wanted = configForBuilding[name] || 0;
                    const count = counts[name] || 0;

                    if (wanted > 0) {
                        const missing = wanted - count;
                        if (missing > 0) {
                            return `<span class="fm-missing">${missing}x ${name}</span>`;
                        } else {
                            return `${count}x ${name}`;
                        }
                    }
                    if (count > 0) return `${count}x ${name}`;
                    return '';
                }).filter(Boolean).join(', ');

                tr.innerHTML += `
<td class="leitstelle">${leitstelleName}</td>
<td class="wache">${b.caption}</td>
<td>${currentVehicles}</td>
<td>${freeSpots}</td>
<td>${vehicleDisplay || '-'}</td>
<td></td>
<td></td>
`;

                // Buttons
                const creditMissingTotal = allowedVehicles.reduce((sum, v) => {
                    const wanted = globalWachenConfig[typeKey]?.[v.caption] || 0;
                    const count = counts[v.caption] || 0;
                    const missing = Math.max(0, wanted - count);
                    return sum + missing * (v.credits || 0);
                }, 0);

                const coinMissingTotal = allowedVehicles.reduce((sum, v) => {
                    const wanted = globalWachenConfig[typeKey]?.[v.caption] || 0;
                    const count = counts[v.caption] || 0;
                    const missing = Math.max(0, wanted - count);
                    return sum + missing * (v.coins || 0);
                }, 0);

                const creditBtn = createStyledButton(`Credits: ${creditMissingTotal.toLocaleString()}`, {
                    variant: 'success', size: 'xs', title: 'Fahrzeug mit Credits kaufen', onclick: async () => { /* Kauf-Logik hier */ }
                });
                const coinBtn = createStyledButton(`Coins: ${coinMissingTotal}`, {
                    variant: 'danger', size: 'xs', title: 'Fahrzeug mit Coins kaufen', onclick: async () => { /* Kauf-Logik hier */ }
                });

                // Buttons in Spalten einfügen
                tr.children[6].style.display = 'flex';
                tr.children[6].style.justifyContent = 'center';
                tr.children[6].style.gap = '6px';
                tr.children[6].appendChild(creditBtn);

                tr.children[7].style.display = 'flex';
                tr.children[7].style.justifyContent = 'center';
                tr.children[7].style.gap = '6px';
                tr.children[7].appendChild(coinBtn);

                tbody.appendChild(tr);
            });

            // Checkbox "Alle auswählen"
            const selectAllCheckbox = table.querySelector(`#fm-select-all-${typeKey}`);
            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', e => {
                    const checked = e.target.checked;
                    tbody.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = checked);
                });
            }

            content.appendChild(table);
            container.appendChild(spoiler);
            container.appendChild(content);
        });

        // Spoiler Toggle
        allSpoilers.forEach(spoiler => {
            const content = spoiler.nextElementSibling;
            spoiler.onclick = () => {
                allSpoilers.forEach(s => {
                    if (s !== spoiler) {
                        s.classList.remove('fm-open');
                        s.nextElementSibling.style.display = 'none';
                    }
                });
                if (spoiler.classList.contains('fm-open')) {
                    spoiler.classList.remove('fm-open');
                    content.style.display = 'none';
                } else {
                    spoiler.classList.add('fm-open');
                    content.style.display = 'block';
                }
            };
            spoiler.onkeydown = e => { if (e.key === "Enter" || e.key === " ") spoiler.click(); };
        });

    } catch (err) {
        container.innerText = 'Fehler beim Laden der Gebäudedaten.';
        throw err;
    }
}

    // Funktion für das Anwenden von Filtereinstellungen in Tabellen (DropDowns)
    function updateTableFilter(table, col, value) {
        Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
            const tds = tr.querySelectorAll('td');
            if(!value || tds[col].innerText === value) tr.style.display = '';
            else tr.style.display = 'none';
        });
    }

    // Funktion für das Rendern der Fahrzeug-Konfigurationstabelle (Checkboxen + Anzahlfelder)
    function renderVehicleConfigTable({
        allowedVehicles,
        typeKey,
        globalWachenConfig,
        showInactive,
        buildingsOfType,
        buildingExtensionsIndex,
        vehicleExtensionRequirements, // Map Fahrzeug-ID → [Erweiterungen]
        hiddenVehicles = []
    })
    {
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        const columns = 4;
        let tr = document.createElement('tr');

        allowedVehicles.forEach((v, idx) => {
            if (idx % columns === 0 && idx > 0) {
                table.appendChild(tr);
                tr = document.createElement('tr');
            }
            const td = document.createElement('td');
            td.style.verticalAlign = 'top';
            td.style.padding = '4px 6px';

            const row = document.createElement('div');
            row.className = 'fm-checkbox-row';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';
            row.style.alignItems = 'center';
            row.style.gap = '4px';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${typeKey}-${v.caption}`;
            checkbox.dataset.wache = typeKey;
            checkbox.dataset.fahrzeug = v.caption;

            let checked = true;
            let val = globalWachenConfig[typeKey]?.[v.caption] || 1;

            if (hiddenVehicles.includes(v.caption)) {
                checked = false;
                val = 0;
            }
            checkbox.checked = checked;

            const nameSpan = document.createElement('span');
            nameSpan.textContent = v.caption;
            nameSpan.style.flex = '1 1 auto';
            nameSpan.style.overflow = 'hidden';
            nameSpan.style.textOverflow = 'clip';
            nameSpan.style.whiteSpace = 'nowrap';

            const countInput = document.createElement('input');
            countInput.type = 'number';
            countInput.min = 0;
            countInput.value = val;
            countInput.disabled = !checked;

            if (!checked && !showInactive) td.style.display = 'none';
            if (!checked && showInactive) row.classList.add('fm-row-inactive');

            checkbox.addEventListener('change', () => {
                countInput.disabled = !checkbox.checked || checkbox.disabled;
                if (!checkbox.checked) countInput.value = 0;
                if (!showInactive && !checkbox.checked) td.style.display = 'none';
                else td.style.display = '';
                if (showInactive && !checkbox.checked) row.classList.add('fm-row-inactive');
                else row.classList.remove('fm-row-inactive');
            });

            countInput.addEventListener('input', () => {
                if (countInput.value < 0) countInput.value = 0;
                if (parseInt(countInput.value, 10) === 0) {
                    td.style.display = showInactive ? '' : 'none';
                    if (showInactive) row.classList.add('fm-row-inactive');
                } else {
                    td.style.display = '';
                    row.classList.remove('fm-row-inactive');
                }
            });

            row.appendChild(checkbox);
            row.appendChild(nameSpan);
            row.appendChild(countInput);

            td.appendChild(row);
            tr.appendChild(td);
        });

        if (tr.childNodes.length > 0) table.appendChild(tr);
        return table;
    }

    // Funktion zum Öffnen der Lightbox zur globalen Konfiguration
    async function openGlobalConfigModal() {
        const existing = document.getElementById('fm-globalconfig-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.className = 'fm-lightbox';
        modal.id = 'fm-globalconfig-modal';
        if(document.body.classList.contains('dark')) modal.style.background = 'rgba(0,0,0,0.88)';
        document.body.appendChild(modal);

        const box = document.createElement('div');
        box.className = 'fm-box';
        box.style.maxWidth = '1200px';
        box.innerHTML = `
        <div class="fm-header">
            <h2>Globale Fahrzeug-Konfiguration</h2>
            <div class="fm-header-btns"></div>
        </div>
        <p style="margin-top:-8px;font-size:90%">
            Wähle pro Wachenart gewünschte Fahrzeuge und Stückzahl.<br>
            Fahrzeuge mit 0 werden nach Speichern ausgeblendet.
        </p>
        <div style="margin-bottom:10px">
            <label style="font-size:95%;user-select:none;cursor:pointer;">
              <input type="checkbox" id="fm-show-inactive" style="vertical-align:middle;margin-right:5px;">
              Ausgeblendete Fahrzeuge anzeigen
            </label>
        </div>
        <div id="fm-config-list">Lade Fahrzeugdaten…</div>
        <div style="margin-top:10px;text-align:right;">
            <button id="fm-save-config" class="fm-btn fm-btn-success">Speichern</button>
        </div>
    `;
        modal.appendChild(box);

        const headerBtns = box.querySelector('.fm-header-btns');
        headerBtns.style.display = 'flex';
        headerBtns.style.justifyContent = 'flex-end';
        const closeBtn = document.createElement('button');
        closeBtn.innerText = 'Schließen';
        closeBtn.className = 'fm-btn fm-btn-close'; // <-- rot
        closeBtn.onclick = ()=>modal.remove();
        headerBtns.appendChild(closeBtn);

        const toggleInactive = box.querySelector('#fm-show-inactive');
        let showInactive = false;
        toggleInactive.checked = false;
        toggleInactive.onchange = () => { showInactive = toggleInactive.checked; renderConfigContent(vehicleExtensionRequirements); };

        let allVehicles, buildings, allBuildingDefs, wachenByType;
        const configList = box.querySelector('#fm-config-list');
        const globalConfigData = getGlobalConfig();
        globalWachenConfig = globalConfigData.vehicles || {};
        const hiddenVehiclesGlobal = globalConfigData.hidden || {};

        let vehicleExtensionRequirements = {};

        (async function(){
            try {
                [allVehicles, buildings, allBuildingDefs] = await Promise.all([
                    fetch('https://api.lss-manager.de/de_DE/vehicles').then(r=>r.json()),
                    fetch('https://www.leitstellenspiel.de/api/buildings').then(r=>r.json()),
                    fetch('https://api.lss-manager.de/de_DE/buildings').then(r=>r.json())
                ]);

                wachenByType = {};
                buildings.forEach(b => {
                    const typeKey = `${b.building_type}_${b.small_building?'small':'normal'}`;
                    if(!wachenByType[typeKey]) wachenByType[typeKey]=[];
                    wachenByType[typeKey].push(b);
                });

                // Map Fahrzeug-ID → benötigte Erweiterungen **vor Render**
                Object.values(allBuildingDefs).forEach(building => {
                    if (Array.isArray(building.extensions)) {
                        building.extensions.forEach(ext => {
                            if (ext && Array.isArray(ext.unlocksVehicleTypes)) { // <-- hier prüfen
                                ext.unlocksVehicleTypes.forEach(vId => {
                                    if (!vehicleExtensionRequirements[vId]) vehicleExtensionRequirements[vId] = [];
                                    vehicleExtensionRequirements[vId].push(ext.caption);
                                });
                            }
                        });
                    }
                });

                renderConfigContent(vehicleExtensionRequirements);

            } catch(err) {
                configList.innerText = 'Fehler beim Laden der Fahrzeugdaten.';
                console.error(err);
            }
        })();

        async function renderConfigContent(vehicleExtensionRequirements) {
            configList.innerHTML = '';
            const buildingExtensionsIndex = {};
            buildings.forEach(b => {
                buildingExtensionsIndex[b.id] = new Set(
                    (b.extensions||[]).filter(e=>e.enabled).map(e=>e.caption)
                );
            });

            wachenOrder.forEach(typeKey => {
                const apiBuildingType = apiMapping[typeKey];
                if(typeof apiBuildingType === 'undefined') return;
                const typeName = buildingTypeNames[typeKey] || typeKey;

                const allowedVehiclesForType = Object.values(allVehicles)
                .filter(v => Array.isArray(v.possibleBuildings) && v.possibleBuildings.map(Number).includes(Number(apiBuildingType)))
                .sort((a,b)=>a.caption.localeCompare(b.caption,'de'));

                if(allowedVehiclesForType.length === 0) return;
                const buildingsOfType = (wachenByType && wachenByType[typeKey]) ? wachenByType[typeKey] : [];

                const spoiler = document.createElement('div');
                spoiler.className = 'fm-spoiler';
                spoiler.tabIndex = 0;

                const configuredCount = Object.keys(globalWachenConfig[typeKey] || {}).length;
                spoiler.innerText = `${typeName} (${configuredCount})`;

                const content = document.createElement('div');
                content.className = 'fm-spoiler-content';
                content.style.display = 'none';

                const table = renderVehicleConfigTable({
                    allowedVehicles: allowedVehiclesForType,
                    typeKey,
                    globalWachenConfig,
                    showInactive,
                    buildingsOfType,
                    buildingExtensionsIndex,
                    vehicleExtensionRequirements,
                    hiddenVehicles: hiddenVehiclesGlobal[typeKey] || []
                });

                content.appendChild(table);

                spoiler.onclick = () => {
                    configList.querySelectorAll('.fm-spoiler.fm-open').forEach(s => {
                        if (s !== spoiler) {
                            s.classList.remove('fm-open');
                            s.nextElementSibling.style.display = 'none';
                        }
                    });
                    const isOpen = spoiler.classList.toggle('fm-open');
                    content.style.display = isOpen ? 'block' : 'none';
                };

                configList.appendChild(spoiler);
                configList.appendChild(content);
            });
        }

        box.querySelector('#fm-save-config').onclick = ()=>{
            const config={}; const hidden={};
            configList.querySelectorAll('.fm-spoiler-content').forEach((content, idx)=>{
                const typeKey=wachenOrder[idx];
                if(!typeKey) return;
                config[typeKey]={}; hidden[typeKey]=[];
                content.querySelectorAll('.fm-checkbox-row').forEach(row=>{
                    const chk=row.querySelector('input[type="checkbox"]');
                    if(chk.disabled) return;
                    const f=chk.dataset.fahrzeug;
                    const val=parseInt(row.querySelector('input[type="number"]').value,10)||0;
                    if(chk.checked && val>0) config[typeKey][f]=val;
                    else hidden[typeKey].push(f);
                });
                if(Object.keys(config[typeKey]).length===0) delete config[typeKey];
                if(hidden[typeKey].length===0) delete hidden[typeKey];
            });
            setGlobalConfig({vehicles:config,hidden:hidden});
            modal.remove();
            alert("Globale Konfiguration gespeichert!");
        };
    }

    // Funktion zum Laden der gespeicherten globalen Konfiguration (aus localStorage)
    function getGlobalConfig() {
        try {
            const raw = localStorage.getItem('globalVehicleConfig');
            if (!raw) {
                return { vehicles: {}, hidden: {} };
            }
            const parsed = JSON.parse(raw);
            return {
                vehicles: parsed.vehicles || {},
                hidden: parsed.hidden || {}
            };
        } catch (e) {
            console.error("Fehler beim Laden der globalen Konfiguration:", e);
            return { vehicles: {}, hidden: {} };
        }
    }

    // Funktion zum Speichern der globalen Konfiguration (in localStorage)
    function setGlobalConfig(config) {
        // Fallbacks einsetzen, falls nur ein Teil übergeben wurde
        const safeConfig = {
            vehicles: config.vehicles || {},
            hidden: config.hidden || {}
        };
        globalWachenConfig = safeConfig;
        localStorage.setItem('globalVehicleConfig', JSON.stringify(safeConfig));
    }

})();
