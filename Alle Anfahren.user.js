// ==UserScript==
// @name         [LSS] 35 - Alle Anfahren
// @namespace    https://leitstellenspiel.de/
// @version      1.0
// @description  Alle Verbandseinsätze und Krankentransporte automatisch anfahren mit separaten Buttons
// @author       Caddy21
// @match        https://www.leitstellenspiel.de/*
// @icon         https://github.com/Caddy21/-docs-assets-css/raw/main/yoshi_icon__by_josecapes_dgqbro3-fullview.png
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const HLF = '30';
    const FUSTW = '32';
    const DHüFKw = '94';
    const MOPED = '95';
    const KTW = '38';
    const ITW = '97';
    const SRK = '159';

    function getMissionNameFromSidebar(missionEl) {
        let sortableBy = missionEl.getAttribute('data-sortable-by');
        if (!sortableBy) return 'Unbekannt';
        try {
            let obj = JSON.parse(sortableBy);
            return obj.caption || 'Unbekannt';
        } catch(e) {
            console.error('Fehler beim Parsen von data-sortable-by', e);
            return 'Unbekannt';
        }
    }

    function parseVehicleHTML(html, allowedTypesList) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let rows = doc.querySelectorAll('tr.vehicle_select_table_tr');

            // Hilfsfunktion: filtere Fahrzeuge nach Typen
            function getCandidates(typeIds) {
                let candidates = [];
                rows.forEach(row => {
                    let input = row.querySelector('input.vehicle_checkbox[name="vehicle_ids[]"]');
                    let vehicleId = input?.value;
                    let typeId = input?.getAttribute('vehicle_type_id');
                    let distCell = row.querySelector('td[sortvalue]');
                    let sortVal = distCell?.getAttribute('sortvalue');
                    if (vehicleId && typeId && sortVal && typeIds.includes(typeId)) {
                        candidates.push({
                            id: vehicleId,
                            type: typeId,
                            dist: parseInt(sortVal, 10)
                        });
                    }
                });
                candidates.sort((a, b) => a.dist - b.dist);
                return candidates[0]?.id || null;
            }

            // allowedTypesList kann z. B. so aussehen: [[HLF, FUSTW], [SRK]]
            for (let types of allowedTypesList) {
                let result = getCandidates(types);
                if (result) return result;
            }
            return null;

        } catch(e) {
            console.error('Fehler beim Parsen des Vehicle HTML', e);
            return null;
        }
    }


    function parseCSRFToken(html) {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            let tokenInput = doc.querySelector('input[name="authenticity_token"]');
            return tokenInput?.value || null;
        } catch(e) {
            console.error('Fehler beim Parsen des CSRF-Tokens', e);
            return null;
        }
    }

    async function triggerAlarm(missionId, vehicleId, csrfToken, missionName) {
        if (!csrfToken) return;
        let formData = new URLSearchParams();
        formData.append('utf8', '✓');
        formData.append('authenticity_token', csrfToken);
        formData.append('vehicle_ids[]', vehicleId);
        formData.append('commit', 'Alarmieren');

        try {
            let resp = await fetch(`/missions/${missionId}/alarm`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            if (resp.ok) console.log(`✅ Alarm für "${missionName}" (${missionId}) mit Fahrzeug ${vehicleId}`);
            else console.error(`❌ Fehler Alarm "${missionName}" (${missionId}): ${resp.status}`);
        } catch(e) {
            console.error('Fetch-Fehler', e);
        }
    }

    async function handleMission(missionEl, allowedTypesList) {
        let missionId = missionEl.id.replace('mission_', '');
        if (!missionId) return;
        let participantEl = missionEl.querySelector(`#mission_participant_${missionId}`);
        if (participantEl && !participantEl.classList.contains('hidden')) return;

        try {
            let resp = await fetch(`/missions/${missionId}`, { credentials: 'same-origin' });
            if (!resp.ok) return;
            let html = await resp.text();
            let vehicleId = parseVehicleHTML(html, allowedTypesList);
            let csrfToken = parseCSRFToken(html);
            let missionName = getMissionNameFromSidebar(missionEl);
            if (vehicleId && csrfToken) await triggerAlarm(missionId, vehicleId, csrfToken, missionName);
        } catch(e) { console.error(e); }
    }

    function createButton(text, title, clickHandler) {
        let btn = document.createElement('a');
        btn.href = "#";
        btn.setAttribute('role', 'button');
        btn.className = "btn btn-xs btn-primary mission_selection";
        btn.style.marginLeft = "5px";
        btn.setAttribute('title', title);

        let iconSpan = document.createElement('span');
        iconSpan.className = "glyphicon glyphicon-flash";
        btn.appendChild(iconSpan);

        let textSpan = document.createElement('span');
        textSpan.style.marginLeft = "3px";
        textSpan.textContent = text;
        btn.appendChild(textSpan);

        btn.addEventListener('click', async (e) => { e.preventDefault(); await clickHandler(); });
        return btn;
    }

    function addButtons(container) {
        if (!container) return;

        // Button Verband
        const verbandBtn = createButton("Alle anfahren (Verband)", "Alle Verbandseinsätze anfahren", async () => {
            const selectors = [
                { sel: '#mission_list_alliance .missionSideBarEntry', types: [[HLF, FUSTW, MOPED, DHüFKw], [SRK]] },
                { sel: '#mission_list_sicherheitswache_alliance .missionSideBarEntry', types: [[HLF, FUSTW, MOPED, DHüFKw], [SRK]] },
                { sel: '#mission_list_alliance_event .missionSideBarEntry', types: [[HLF, FUSTW, MOPED, DHüFKw], [SRK]] }
            ];
            for (let s of selectors) {
                const missions = document.querySelectorAll(s.sel);
                for (let m of missions) await handleMission(m, s.types);
            }
            console.log('✅ Auto-Alarm Verband abgeschlossen');
        });

        // Button Krankentransporte
        const ktBtn = createButton("Alle anfahren (KT)", "Alle Krankentransporte anfahren", async () => {
            const missions = document.querySelectorAll('#mission_list_krankentransporte .missionSideBarEntry');
            for (let m of missions) {
                let caption = getMissionNameFromSidebar(m).toLowerCase();
                let allowed = caption.includes('intensiv') ? [ITW] : [KTW];
                await handleMission(m, allowed);
            }
            console.log('✅ Auto-Alarm KT abgeschlossen');
        });

        container.appendChild(ktBtn);
        container.appendChild(verbandBtn);
    }

    function waitForContainer() {
        const container = document.querySelector('.mission-filters-row .mission-participation-filters');
        if (container) { addButtons(container); return; }

        const observer = new MutationObserver((mutations, obs) => {
            const c = document.querySelector('.mission-filters-row .mission-participation-filters');
            if (c) { addButtons(c); obs.disconnect(); }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    waitForContainer();

})();
