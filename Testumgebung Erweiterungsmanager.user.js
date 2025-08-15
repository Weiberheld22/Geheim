// ==UserScript==
// @name         *Beta-Testcode für den Erweiterungs-Manager
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Dies ist ein Testcode und garantiert keine 100% funktionalität Updates erfolgen OHNE Vorankündigung!
// @author       Caddy21
// @match        https://www.leitstellenspiel.de/
// @grant        GM_xmlhttpRequest
// @connect      api.lss-manager.de
// @connect      leitstellenspiel.de
// @grant        GM_getValue
// @grant        GM_setValue
// @icon         https://github.com/Caddy21/-docs-assets-css/raw/main/yoshi_icon__by_josecapes_dgqbro3-fullview.png
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // Funktion um die Lightbox und Stile zu erstellen
    const styles = `
        :root {
        --background-color: #f2f2f2;
        --text-color: #000;
        --border-color: #ccc;
        --button-background-color: #007bff;
        --button-hover-background-color: #0056b3;
        --button-text-color: #ffffff;
        --warning-color: #fd7e14;
        --warning-hover: #e96b00;
        --credits-color: #28a745;
        --coins-color: #dc3545;
        --cancel-color: #6c757d;
        }

        #extension-lightbox {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
        }

        #extension-lightbox-header {
        background: var(--background-color);
        padding: 10px;
        border-bottom: 1px solid var(--border-color);
        text-align: right;
        z-index: 2;
        }

        #extension-lightbox-content {
        background: var(--background-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        padding: 20px;
        width: 100%;
        max-width: 1500px;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        text-align: center;
        }

        #extension-lightbox-header #close-extension-helper {
        font-weight: 600;
        background-color: #ff4d4d;
        color: white;
        border: none;
        padding: 6px 14px;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s ease;
        }

        #extension-lightbox table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
        font-size: 16px;
        }

        #extension-lightbox th,
        #extension-lightbox td {
        text-align: center;
        vertical-align: middle;
        }

        #extension-lightbox td {
        background-color: var(--background-color);
        color: var(--text-color);
        border: 1px solid var(--border-color);
        padding: 10px;
        }

        #extension-lightbox thead {
        background-color: var(--background-color);
        font-weight: bold;
        border-bottom: 2px solid var(--border-color);
        }

        #extension-lightbox      #loading-overlay {
        background-color: #f0f0f0;
        border-radius: 6px;
        padding: 15px;
        margin-bottom: 15px;
        }

        /* === Buttons === */
        #extension-lightbox button,
        .currency-button,
        .cancel-button {
        border: none;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 4px;
        font-size: 14px;
        color: var(--button-text-color);
        transition: background-color 0.2s ease-in-out;
        }

        #extension-lightbox .spoiler-button               { background-color: green; }
        #extension-lightbox .lager-button                 { background-color: darkorange; }
        #extension-lightbox .level-button                 { background-color: brown; }
        #extension-lightbox .build-selected-button        { background-color: blue; }
        #extension-lightbox .build-all-button             { background-color: red; }
        #extension-lightbox .build-selected-levels-button { background-color: purple; }

        #extension-lightbox .build-selected-button:hover:enabled,
        #extension-lightbox .build-selected-levels-button:enabled,
        #extension-lightbox .build-all-button:hover:enabled {
        filter: brightness(90%);
        }

        #extension-lightbox .extension-button:disabled,
        #extension-lightbox .build-selected-button:disabled,
        #extension-lightbox .build-selected-levels-button:disabled,
        #extension-lightbox .build-all-button:disabled {
        background-color: gray !important;
        cursor: not-allowed;
        }

        #extension-lightbox button.btn-danger,
        #extension-lightbox button.btn-danger:hover,
        #extension-lightbox button.btn-danger:focus,
        #extension-lightbox button.btn-danger:active {
        background-color: var(--coins-color) !important;
        border-color: var(--coins-color) !important;
        color: white !important;
        box-shadow: none !important;
        filter: none !important;
        transition: none !important;
        cursor: pointer;
        }

        /* Neue Flexbox-Regel für Button-Container mit Abständen */
        #extension-lightbox .button-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 8px 5px;
        }

        /* Alte margin bei Buttons entfernen */
        #extension-lightbox .button-container > button {
        margin: 0;
        }

        #extension-lightbox .spoiler-content {
        display: none;
        }

        #extension-lightbox .extension-search {
        width: 100%;
        padding: 8px;
        margin: 10px 0;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 14px;
        }

        /* === Currency Modal === */
        .currency-selection {
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid black;
        padding: 20px;
        z-index: 10001;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .currency-button.credits-button { background-color: var(--credits-color); }
        .currency-button.coins-button   { background-color: var(--coins-color); }
        .cancel-button                  { background-color: var(--cancel-color); }

        #open-extension-helper {
        cursor: pointer;
        }

        .active-button {
        background-color: #007bff;
        color: white;
        font-weight: bold;
        }

        `;

    // Wende den Modus an, wenn das DOM bereit ist
    window.addEventListener('load', () => {
        applyMode();
        observeLightbox(); // Beobachtet dynamische Änderungen
    });

    // Fügt die Stile hinzu
    const styleElement = document.createElement('style');
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    const lightbox = document.createElement('div');
    lightbox.id = 'extension-lightbox';
    lightbox.style.display = 'none';
    lightbox.innerHTML = `
  <div id="extension-lightbox-modal">
    <div id="extension-lightbox-header" style="display:flex; justify-content:space-between; align-items:center;">
      <div id="user-balance" style="text-align:left; display: flex; gap: 20px;">
        <div>
          <div>Aktuelle Credits: <span id="current-credits" style="color: var(--credits-color); font-weight: bold;">...</span></div>
          <div>Aktuelle Coins: <span id="current-coins" style="color: var(--coins-color); font-weight: bold;">...</span></div>
        </div>
        <div>
          <div>Ausgewählte Credits: <span id="selected-credits" style="color: var(--credits-color); font-weight: bold;">0</span></div>
          <div>Ausgewählte Coins: <span id="selected-coins" style="color: var(--coins-color); font-weight: bold;">0</span></div>
        </div>
      </div>
      <button id="close-extension-helper">Schließen</button>
    </div>
    <div id="extension-lightbox-content">
      <h3>🚒🏗️ <strong>Herzlich willkommen beim ultimativen Ausbau-Assistenten für eure Wachen!</strong> 🚒🏗️</h3>
      <h2><br>Dem Erweiterungs-Manager</h2>
      <h5>
        <br><br>Dieses kleine Helferlein zeigt euch genau, wo noch Platz in euren Wachen ist: Welche <strong>Erweiterungen</strong> und <strong>Lagerräume</strong> noch möglich sind – und mit nur ein paar Klicks geht’s direkt in den Ausbau. Einfacher wird’s nicht!
        <br><br>Und das Beste: Über den
        <button id="open-extension-settings" style="
          font-weight: 600;
          color: #fff;
          background-color: var(--primary-color, #007bff);
          border: none;
          padding: 6px 14px;
          border-radius: 5px;
          cursor: pointer;
          transition: background-color 0.3s ease;
          margin: 0 5px;
        ">
          Einstellungen
        </button>
        -Button könnt ihr festlegen, welche Erweiterungen und Lagerräume euch pro Wachen-Typ angezeigt werden – ganz nach eurem Geschmack. Einmal gespeichert, für immer gemerkt.
        <br><br>Kleiner Hinweis am Rande: Feedback, Verbesserungsvorschläge oder Kritik zum Skript sind jederzeit im
        <a href="https://forum.leitstellenspiel.de/index.php?thread/27856-script-erweiterungs-manager/" target="_blank" style="color:#007bff; text-decoration:none;">
          <strong>Forum</strong>
        </a> willkommen. 💌
        <br><br><br>Und nun viel Spaß beim Credits oder Coins ausgeben!
        <br><br>
        <div id="loading-container" style="display:none; padding: 20px; text-align:center;">
  <div id="loading-text" style="font-weight: bold; font-size: 16px;">Lade Daten</div>
</div>
        <div id="extension-list"></div>
      </h5>
    </div>
  </div>
`;

    // Werte nur aktualisieren, nicht die komplette HTML-Struktur ersetzen
    getUserCredits().then(({ credits, coins }) => {
        document.getElementById('current-credits').textContent = credits.toLocaleString();
        document.getElementById('current-coins').textContent = coins.toLocaleString();

        // Beispielhafte initiale Werte für "Ausgewählte" (später dynamisch anpassen)
        updateSelectedAmounts();
    }).catch(() => {
        // Optional: Fehleranzeige bei Ladeproblemen
        document.getElementById('current-credits').textContent = 'Fehler';
        document.getElementById('current-coins').textContent = 'Fehler';
    });

    document.body.appendChild(lightbox);

    const openBtn = document.getElementById('open-extension-settings');
    const lightboxContent = lightbox.querySelector('#extension-lightbox-content');

    openBtn.addEventListener('mouseenter', () => {
        openBtn.style.backgroundColor = '#0056b3'; // dunkleres Blau beim Hover
    });
    openBtn.addEventListener('mouseleave', () => {
        openBtn.style.backgroundColor = 'var(--primary-color, #007bff)';
    });
    openBtn.addEventListener('click', () => {
        openExtensionSettingsOverlay();
    });

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Globale Variablen von:
    const manualExtensions = {
        '0_normal': [ // Feuerwache (normal)
            { id: 0, name: 'Rettungsdienst', cost: 100000, coins: 20 },
            { id: 1, name: '1te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 2, name: '2te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 3, name: '3te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 4, name: '4te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 5, name: '5te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 6, name: 'Wasserrettung', cost: 400000, coins: 25 },
            { id: 7, name: '6te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 8, name: 'Flughafenfeuerwehr', cost: 300000, coins: 25 },
            { id: 9, name: 'Großwache', cost: 1000000, coins: 50 },
            { id: 10, name: '7te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 11, name: '8te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 12, name: '9te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 13, name: 'Werkfeuerwehr', cost: 100000, coins: 20 },
            { id: 14, name: 'Netzersatzanlage 50', cost: 100000, coins: 20 },
            { id: 15, name: 'Netzersatzanlage 200', cost: 100000, coins: 20 },
            { id: 16, name: 'Großlüfter', cost: 75000, coins: 15 },
            { id: 17, name: '10te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 18, name: 'Drohneneinheit', cost: 150000, coins: 25 },
            { id: 19, name: 'Verpflegungsdienst', cost: 200000, coins: 25 },
            { id: 20, name: '1te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 21, name: '2te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 22, name: '3te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 23, name: '4te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 24, name: '5te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 25, name: 'Bahnrettung', cost: 125000, coins: 25 },
            { id: 26, name: '11te Ab-Stellplatz', cost: 150000, coins: 20 },
            { id: 27, name: '12te Ab-Stellplatz', cost: 150000, coins: 20 },
        ],
        '1_normal': [ // Feuerwehrschule
            { id: 0, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 1, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 2, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
        ],
        '2_normal': [ // Rettungswache
            { id: 0, name: 'Großwache', cost: 1000000, coins: 50 },
        ],
        '3_normal': [ // Rettungsschule
            { id: 0, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 1, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 2, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
        ],
        '4_normal': [ // Krankenhaus
            { id: 0, name: 'Allgemeine Innere', cost: 10000, coins: 10 },
            { id: 1, name: 'Allgemeine Chirugie', cost: 10000, coins: 10 },
            { id: 2, name: 'Gynäkologie', cost: 70000, coins: 15 },
            { id: 3, name: 'Urologie', cost: 70000, coins: 15 },
            { id: 4, name: 'Unfallchirugie', cost: 70000, coins: 15 },
            { id: 5, name: 'Neurologie', cost: 70000, coins: 15 },
            { id: 6, name: 'Neurochirugie', cost: 70000, coins: 15 },
            { id: 7, name: 'Kardiologie', cost: 70000, coins: 15 },
            { id: 8, name: 'Kardiochirugie', cost: 70000, coins: 15 },
            { id: 9, name: 'Großkrankenhaus', cost: 200000, coins: 50 },
        ],
        '5_normal': [ // Rettungshubschrauber-Station
            { id: 0, name: 'Windenrettung', cost: 200000, coins: 15 },
        ],
        '6_normal': [ // Polizeiwache
            { id: 0, name: '1te Zelle', cost: 25000, coins: 5 },
            { id: 1, name: '2te Zelle', cost: 25000, coins: 5 },
            { id: 2, name: '3te Zelle', cost: 25000, coins: 5 },
            { id: 3, name: '4te Zelle', cost: 25000, coins: 5 },
            { id: 4, name: '5te Zelle', cost: 25000, coins: 5 },
            { id: 5, name: '6te Zelle', cost: 25000, coins: 5 },
            { id: 6, name: '7te Zelle', cost: 25000, coins: 5 },
            { id: 7, name: '8te Zelle', cost: 25000, coins: 5 },
            { id: 8, name: '9te Zelle', cost: 25000, coins: 5 },
            { id: 9, name: '10te Zelle', cost: 25000, coins: 5 },
            { id: 10, name: 'Diensthundestaffel', cost: 100000, coins: 10 },
            { id: 11, name: 'Kriminalpolizei', cost: 100000, coins: 20 },
            { id: 12, name: 'Dienstgruppenleitung', cost: 200000, coins: 25 },
            { id: 13, name: 'Motorradstaffel', cost: 75000, coins: 15 },
            { id: 14, name: 'Großwache', cost: 1000000, coins: 50 },
            { id: 15, name: 'Großgewahrsam', cost: 200000, coins: 50 },
        ],
        '8_normal': [ // Polizeischule
            { id: 0, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 1, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 2, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
        ],
        '9_normal': [ // THW
            { id: 0, name: '1. Technischer Zug: Fachgruppe Bergung/Notinstandsetzung', cost: 25000, coins: 5 },
            { id: 1, name: '1. Technischer Zug: Zugtrupp', cost: 25000, coins: 5 },
            { id: 2, name: 'Fachgruppe Räumen', cost: 25000, coins: 5 },
            { id: 3, name: 'Fachgruppe Wassergefahren', cost: 500000, coins: 15 },
            { id: 4, name: '2. Technischer Zug - Bergungsgruppe', cost: 25000, coins: 5 },
            { id: 5, name: '2. Technischer Zug: Fachgruppe Bergung/Notinstandsetzung', cost: 25000, coins: 5 },
            { id: 6, name: '2. Technischer Zug: Zugtrupp', cost: 25000, coins: 5 },
            { id: 7, name: 'Fachgruppe Ortung', cost: 450000, coins: 25 },
            { id: 8, name: 'Fachgruppe Wasserschaden/Pumpen', cost: 200000, coins: 25 },
            { id: 9, name: 'Fachruppe Schwere Bergung', cost: 200000, coins: 25 },
            { id: 10, name: 'Fachgruppe Elektroversorgung', cost: 200000, coins: 25 },
            { id: 11, name: 'Ortsverband-Mannschaftstransportwagen', cost: 50000, coins: 15 },
            { id: 12, name: 'Trupp Unbemannte Luftfahrtsysteme', cost: 50000, coins: 15 },
            { id: 13, name: 'Fachzug Führung und Kommunikation', cost: 300000, coins: 25 },
        ],
        '10_normal': [ // THW-Bundesschule
            { id: 0, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 1, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 2, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
        ],
        '11_normal': [ // Bereitschaftspolizei
            { id: 0, name: '2. Zug der 1. Hundertschaft', cost: 25000, coins: 5 },
            { id: 1, name: '3. Zug der 1. Hundertschaft', cost: 25000, coins: 5 },
            { id: 2, name: 'Sonderfahrzeug: Gefangenenkraftwagen', cost: 25000, coins: 5 },
            { id: 3, name: 'Technischer Zug: Wasserwerfer', cost: 25000, coins: 5 },
            { id: 4, name: 'SEK: 1. Zug', cost: 100000, coins: 10 },
            { id: 5, name: 'SEK: 2. Zug', cost: 100000, coins: 10 },
            { id: 6, name: 'MEK: 1. Zug', cost: 100000, coins: 10 },
            { id: 7, name: 'MEK: 2. Zug', cost: 100000, coins: 10 },
            { id: 8, name: 'Diensthundestaffel', cost: 100000, coins: 10 },
            { id: 9, name: 'Reiterstaffel', cost: 300000, coins: 25},
            { id: 10, name: 'Lautsprecherkraftwagen', cost: 100000, coins: 10},
        ],
        '12_normal': [ // SEG
            { id: 0, name: 'Führung', cost: 25000, coins: 5 },
            { id: 1, name: 'Sanitätsdienst', cost: 25500, coins: 5 },
            { id: 2, name: 'Wasserrettung', cost: 500000, coins: 25 },
            { id: 3, name: 'Rettungshundestaffel', cost: 350000, coins: 25 },
            { id: 4, name: 'SEG-Drohne', cost: 50000, coins: 15 },
            { id: 5, name: 'Betreuungs- und Verpflegungsdienst', cost: 200000, coins: 25 },
            { id: 6, name: 'Technik und Sicherheit', cost: 200000, coins: 25 },
        ],
        '13_normal': [ // Polizeihubschrauberstation
            { id: 0, name: 'Außenlastbehälter', cost: 200000, coins: 15 },
            { id: 1, name: 'Windenrettung', cost: 200000, coins: 15 },
        ],
        '17_normal': [ // Polizeisondereinheit
            { id: 0, name: 'SEK: 1. Zug', cost: 100000, coins: 10 },
            { id: 1, name: 'SEK: 2. Zug', cost: 100000, coins: 10 },
            { id: 2, name: 'MEK: 1. Zug', cost: 100000, coins: 10 },
            { id: 3, name: 'MEK: 2. Zug', cost: 100000, coins: 10 },
            { id: 4, name: 'Diensthundestaffel', cost: 100000, coins: 10 },

        ],
        '0_small': [ // Feuerwehr (Kleinwache)
            { id: 0, name: 'Rettungsdienst', cost: 100000, coins: 20 },
            { id: 1, name: '1te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 2, name: '2te AB-Stellplatz', cost: 100000, coins: 20 },
            { id: 6, name: 'Wasserrettung', cost: 400000, coins: 25 },
            { id: 8, name: 'Flughafenfeuerwehr', cost: 300000, coins: 25 },
            { id: 13, name: 'Werkfeuerwehr', cost: 100000, coins: 20 },
            { id: 14, name: 'Netzersatzanlage 50', cost: 100000, coins: 20 },
            { id: 16, name: 'Großlüfter', cost: 75000, coins: 25 },
            { id: 18, name: 'Drohneneinheit', cost: 150000, coins: 25 },
            { id: 19, name: 'Verpflegungsdienst', cost: 200000, coins: 25 },
            { id: 20, name: '1te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 21, name: '2te Anhänger Stellplatz', cost: 75000, coins: 15 },
            { id: 25, name: 'Bahnrettung', cost: 125000, coins: 25 },
        ],
        '6_small': [ // Polizei (Kleinwache)
            { id: 0, name: '1te Zelle', cost: 25000, coins: 5 },
            { id: 1, name: '2te Zelle', cost: 25000, coins: 5 },
            { id: 10, name: 'Diensthundestaffel', cost: 100000, coins: 10 },
            { id: 11, name: 'Kriminalpolizei', cost: 100000, coins: 20 },
            { id: 12, name: 'Dienstgruppenleitung', cost: 200000, coins: 25 },
            { id: 13, name: 'Motorradstaffel', cost: 75000, coins: 15 },
        ],
        '24_normal': [ // Reiterstaffel
            { id: 0, name: 'Reiterstaffel', cost: 300000, coins: 25 },
            { id: 1, name: 'Reiterstaffel', cost: 300000, coins: 25 },
            { id: 2, name: 'Reiterstaffel', cost: 300000, coins: 25 },
            { id: 3, name: 'Reiterstaffel', cost: 300000, coins: 25 },
            { id: 4, name: 'Reiterstaffel', cost: 300000, coins: 25 },
            { id: 5, name: 'Reiterstaffel', cost: 300000, coins: 25 },
        ],
        '25_normal': [ // Bergrettungswache
            { id: 0, name: 'Höhenrettung', cost: 50000, coins: 25 },
            { id: 1, name: 'Drohneneinheit', cost: 75000, coins: 25 },
            { id: 2, name: 'Rettungshundestaffel', cost: 350000, coins: 25 },
            { id: 3, name: 'Rettungsdienst', cost: 100000, coins: 20 },
        ],
        '27_normal': [ // Schule für Seefahrt und Seenotrettung
            { id: 0, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 1, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
            { id: 2, name: 'Weiterer Klassenraum', cost: 400000, coins: 40 },
        ],
    };          // Erweiterungen
    const manualStorageRooms = {
        '0_normal': [
            { id: 'initial_containers', name: 'Lagerraum', cost: 25000, coins: 10, additionalStorage: 40 },
            { id: 'additional_containers_1', name: '1te Zusätzlicher Lagerraum', cost: 50000, coins: 12, additionalStorage: 30 },
            { id: 'additional_containers_2', name: '2te Zusätzlicher Lagerraum', cost: 50000, coins: 12, additionalStorage: 30 },
            { id: 'additional_containers_3', name: '3te Zusätzlicher Lagerraum', cost: 100000, coins: 15, additionalStorage: 30 },
            { id: 'additional_containers_4', name: '4te Zusätzlicher Lagerraum', cost: 100000, coins: 15, additionalStorage: 30 },
            { id: 'additional_containers_5', name: '5te Zusätzlicher Lagerraum', cost: 100000, coins: 15, additionalStorage: 30 },
            { id: 'additional_containers_6', name: '6te Zusätzlicher Lagerraum', cost: 100000, coins: 15, additionalStorage: 30 },
            { id: 'additional_containers_7', name: '7te Zusätzlicher Lagerraum', cost: 100000, coins: 15, additionalStorage: 30 },
        ], // Feuerwache (Normal)
        '0_small': [
            { id: 'initial_containers', name: 'Lagerraum', cost: 25000, coins: 10, additionalStorage: 40 },
            { id: 'additional_containers_1', name: '1te Zusätzlicher Lagerraum', cost: 50000, coins: 10, additionalStorage: 30 },
            { id: 'additional_containers_2', name: '2te Zusätzlicher Lagerraum', cost: 50000, coins: 10, additionalStorage: 30 },
        ],  // Feuerwache (Kleinwache)
        '5_normal': [
            { id: 'initial_containers', name: 'Lagerraum', cost: 25000, coins: 10, additionalStorage: 40 },
        ], // Rettungshubschrauber-Station
    };        // Lagerräume
    const manualLevels = {
        '0_normal': [  // Feuerwache (Normal)
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
            { id: 5, name: '6', cost: 100000, coins: 20 },
            { id: 6, name: '7', cost: 100000, coins: 20 },
            { id: 7, name: '8', cost: 100000, coins: 20 },
            { id: 8, name: '9', cost: 100000, coins: 20 },
            { id: 9, name: '10', cost: 100000, coins: 20 },
            { id: 10, name: '11', cost: 100000, coins: 20 },
            { id: 11, name: '12', cost: 100000, coins: 20 },
            { id: 12, name: '13', cost: 100000, coins: 20 },
            { id: 13, name: '14', cost: 100000, coins: 20 },
            { id: 14, name: '15', cost: 100000, coins: 20 },
            { id: 15, name: '16', cost: 100000, coins: 20 },
            { id: 16, name: '17', cost: 100000, coins: 20 },
            { id: 17, name: '18', cost: 100000, coins: 20 },
            { id: 18, name: '19', cost: 100000, coins: 20 },
        ],

        '0_small': [  // Feuerwache (Kleinwache)
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
        ],

        '2_normal': [  // Rettungswache (Normal)
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
            { id: 5, name: '6', cost: 100000, coins: 20 },
            { id: 6, name: '7', cost: 100000, coins: 20 },
            { id: 7, name: '8', cost: 100000, coins: 20 },
            { id: 8, name: '9', cost: 100000, coins: 20 },
            { id: 9, name: '10', cost: 100000, coins: 20 },
            { id: 10, name: '11', cost: 100000, coins: 20 },
            { id: 11, name: '12', cost: 100000, coins: 20 },
            { id: 12, name: '13', cost: 100000, coins: 20 },
            { id: 13, name: '14', cost: 100000, coins: 20 },
        ],

        '2_small': [  // Rettungswache (Kleinwache)
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
        ],

        '4_normal': [  // Krankenhaus
            { id: 0, name: '1', cost: 19000, coins: 11 },
            { id: 1, name: '2', cost: 19000, coins: 11 },
            { id: 2, name: '3', cost: 19000, coins: 11 },
            { id: 3, name: '4', cost: 19000, coins: 11 },
            { id: 4, name: '5', cost: 19000, coins: 11 },
            { id: 5, name: '6', cost: 19000, coins: 11 },
            { id: 6, name: '7', cost: 19000, coins: 11 },
            { id: 7, name: '8', cost: 19000, coins: 11 },
            { id: 8, name: '9', cost: 19000, coins: 11 },
            { id: 9, name: '10', cost: 19000, coins: 11 },
            { id: 10, name: '11', cost: 19000, coins: 11 },
            { id: 11, name: '12', cost: 19000, coins: 11 },
            { id: 12, name: '13', cost: 19000, coins: 11 },
            { id: 13, name: '14', cost: 19000, coins: 11 },
            { id: 14, name: '15', cost: 19000, coins: 11 },
            { id: 15, name: '16', cost: 19000, coins: 11 },
            { id: 16, name: '17', cost: 19000, coins: 11 },
            { id: 17, name: '18', cost: 19000, coins: 11 },
            { id: 18, name: '19', cost: 19000, coins: 11 },
            { id: 19, name: '20', cost: 19000, coins: 11 },
        ],

        '6_normal': [  // Polizeiwache (Normal)
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
            { id: 5, name: '6', cost: 100000, coins: 20 },
            { id: 6, name: '7', cost: 100000, coins: 20 },
            { id: 7, name: '8', cost: 100000, coins: 20 },
            { id: 8, name: '9', cost: 100000, coins: 20 },
            { id: 9, name: '10', cost: 100000, coins: 20 },
            { id: 10, name: '11', cost: 100000, coins: 20 },
            { id: 11, name: '12', cost: 100000, coins: 20 },
            { id: 12, name: '13', cost: 100000, coins: 20 },
            { id: 13, name: '14', cost: 100000, coins: 20 },
        ],

        '6_small': [  // Polizeiwache (Kleinwache)
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
        ],

        '15_normal': [  // Wasserrettung
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
        ],

        '25_normal': [  // Bergrettungswache
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
            { id: 5, name: '6', cost: 100000, coins: 20 },
            { id: 6, name: '7', cost: 100000, coins: 20 },
            { id: 7, name: '8', cost: 100000, coins: 20 },
            { id: 8, name: '9', cost: 100000, coins: 20 },
            { id: 9, name: '10', cost: 100000, coins: 20 },
            { id: 10, name: '11', cost: 100000, coins: 20 },
            { id: 11, name: '12', cost: 100000, coins: 20 },
            { id: 12, name: '13', cost: 100000, coins: 20 },
            { id: 13, name: '14', cost: 100000, coins: 20 },
        ],

        '26_normal': [  // Seenotrettungswache
            { id: 0, name: '1', cost: 10000, coins: 10 },
            { id: 1, name: '2', cost: 50000, coins: 15 },
            { id: 2, name: '3', cost: 100000, coins: 20 },
            { id: 3, name: '4', cost: 100000, coins: 20 },
            { id: 4, name: '5', cost: 100000, coins: 20 },
        ],
    };              // Ausbaustufen
    const buildingTypeNames = {
        '0_normal': 'Feuerwache (Normal)',
        '0_small': 'Feuerwache (Kleinwache)',
        '1_normal': 'Feuerwehrschule',
        '2_normal': 'Rettungswache (Normal)',
        '2_small': 'Rettungswache (Kleinwache)',
        '3_normal': 'Rettungsschule',
        '4_normal': 'Krankenhaus',
        '5_normal': 'Rettungshubschrauber-Station',
        '6_normal': 'Polizeiwache (Normal)',
        '6_small': 'Polizeiwache (Kleinwache)',
        '8_normal': 'Polizeischule',
        '9_normal': 'Technisches Hilfswerk',
        '10_normal': 'Technisches Hilfswerk - Bundesschule',
        '11_normal': 'Bereitschaftspolizei',
        '12_normal': 'Schnelleinsatzgruppe (SEG)',
        '13_normal': 'Polizeihubschrauber-Station',
        '15_normal': 'Wasserrettung',
        '17_normal': 'Polizei-Sondereinheiten',
        '24_normal': 'Reiterstaffel',
        '25_normal': 'Bergrettungswache',
        '26_normal': 'Seenotrettungswache',
        '27_normal': 'Schule für Seefahrt und Seenotrettung',
    };         // Gebäudenamen
    const allowedBuildings = new Set([
        '0_normal',  // Feuerwache (Normal)
        '0_small',   // Feuerwache (Kleinwache)
        '4_normal',  // Krankenhaus
        '6_normal',  // Polizeiwache (Normal)
        '6_small',   // Polizeiwache (Kleinwache)
        '2_normal',  // Rettungswache (Normal)
        '2_small',   // Rettungswache (Kleinwache)
        '15_small',  // Wasserrettung
        '25_normal', // Bergrettungswache
        '26_normal', // Seenotrettungswache)
    ]); // Buttons für Bestimmte Gebäude

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Bereich für das Userinterface

    const SETTINGS_KEY = 'enabledExtensions';
    const defaultExtensionSettings = {};

    // Extensions in default settings
    for (const category in manualExtensions) {
        for (const ext of manualExtensions[category]) {
            defaultExtensionSettings[`${category}_${ext.id}`] = true;
        }
    }

    // Lagerräume in default settings
    for (const category in manualStorageRooms) {
        for (const room of manualStorageRooms[category]) {
            const key = `${category}_storage_${room.name.replace(/\s+/g, '_')}`;
            defaultExtensionSettings[key] = true;
        }
    }

    // Funktion um Einstellungen zu speichern
    function saveExtensionSettings(settings) {
        GM_setValue(SETTINGS_KEY, settings);
    }

    // Funktion zum beziehen der gespeicherten Einstellungen
    function getExtensionSettings() {
        return { ...defaultExtensionSettings, ...GM_getValue(SETTINGS_KEY, {}) };
    }

    // Funktion um das Overlay anzuzeigen
    function openExtensionSettingsOverlay() {
        const settings = getExtensionSettings();

        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 10001,
            overflowY: 'auto',
        });

        const panel = document.createElement('div');
        Object.assign(panel.style, {
            margin: '50px auto',
            padding: '20px',
            background: 'var(--background-color, #fff)',
            color: 'var(--text-color, #000)',
            borderRadius: '10px',
            maxWidth: '800px',
            boxShadow: '0 0 10px rgba(0,0,0,0.25)',
        });

        // Beschreibung
        const description = document.createElement('div');
        description.style.marginBottom = '20px';

        const descHeading = document.createElement('h4');
        Object.assign(descHeading.style, {
            marginBottom: '10px',
            fontSize: '1.2em',
            lineHeight: '1.4',
        });
        descHeading.textContent = '🛠️ Erweiterungen & Lagerräume anpassen';

        description.appendChild(descHeading);

        const descText = document.createElement('p');
        descText.textContent = 'Gestalte deine Wachen individuell: Bestimme, welche Erweiterungen und Lagerräume du je Gebäude-Typ sehen möchtest. Deine Einstellungen werden gespeichert und beibehalten!';
        descText.style.lineHeight = '1.6';
        descText.style.margin = '0';

        description.appendChild(descText);
        panel.appendChild(description);

        // Tabs Buttons
        const btnGroup = document.createElement('div');
        btnGroup.style.marginBottom = '10px';

        const extBtn = document.createElement('button');
        extBtn.id = 'tab-ext-btn';
        extBtn.className = 'tab-btn active';
        extBtn.textContent = 'Erweiterungen';
        Object.assign(extBtn.style, {
            background: '#007bff',
            color: 'white',
            padding: '6px 12px',
            marginRight: '6px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
        });

        const storageBtn = document.createElement('button');
        storageBtn.id = 'tab-storage-btn';
        storageBtn.className = 'tab-btn';
        storageBtn.textContent = 'Lagerräume';
        Object.assign(storageBtn.style, {
            background: 'transparent',
            color: 'var(--text-color, #000)',
            padding: '6px 12px',
            marginRight: '6px',
            border: '1px solid var(--border-color, #ccc)',
            borderRadius: '4px',
            cursor: 'pointer',
        });

        btnGroup.appendChild(extBtn);
        btnGroup.appendChild(storageBtn);
        panel.appendChild(btnGroup);

        // Container für Tab-Inhalte
        const tabContent = document.createElement('div');
        tabContent.id = 'settings-tab-content';
        tabContent.style.margin = '20px 0';
        panel.appendChild(tabContent);

        function createSpoilerLegend(text) {
            const legend = document.createElement('legend');
            Object.assign(legend.style, {
                color: 'var(--text-color, #000)',
                borderBottom: '1px solid var(--border-color, #ccc)',
                padding: '6px 10px',
                marginBottom: '6px',
                cursor: 'pointer',
                userSelect: 'none',
                fontWeight: '600',
                fontSize: '0.95em',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
            });

            const arrow = document.createElement('span');
            arrow.textContent = '▶';
            arrow.style.transition = 'transform 0.2s ease';

            const labelText = document.createElement('span');
            labelText.textContent = text;

            legend.appendChild(arrow);
            legend.appendChild(labelText);

            return {legend, arrow};
        }

        function createExtensionForm() {
            const form = document.createElement('form');

            for (const category in manualExtensions) {
                const fieldset = document.createElement('fieldset');
                fieldset.style.marginBottom = '12px';

                const { legend, arrow } = createSpoilerLegend(buildingTypeNames[category] || category);

                const content = document.createElement('div');
                content.style.display = 'none';
                content.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
                content.style.gap = '8px';
                content.style.padding = '8px 0';

                const allLabel = document.createElement('label');
                allLabel.style.gridColumn = '1 / -1';
                allLabel.style.display = 'flex';
                allLabel.style.alignItems = 'center';
                allLabel.style.gap = '6px';
                allLabel.style.fontWeight = '500';

                const selectAllCheckbox = document.createElement('input');
                selectAllCheckbox.type = 'checkbox';

                const selectAllText = document.createElement('span');
                selectAllText.textContent = 'Alle Erweiterungen an-/abwählen';
                selectAllText.style.fontWeight = 'bold';
                selectAllText.style.color = 'var(--primary-color, #007bff)';

                allLabel.appendChild(selectAllCheckbox);
                allLabel.appendChild(selectAllText);
                content.appendChild(allLabel);

                const checkboxes = [];

                manualExtensions[category]
                    .slice()
                    .sort((a, b) => {
                    const aAlpha = /^[A-Za-z]/.test(a.name);
                    const bAlpha = /^[A-Za-z]/.test(b.name);

                    if (aAlpha && !bAlpha) return -1;
                    if (!aAlpha && bAlpha) return 1;

                    return a.name.localeCompare(b.name, 'de', { numeric: true });
                })
                    .forEach(ext => {
                    const key = `${category}_${ext.id}`;
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.gap = '6px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = settings[key];
                    checkbox.dataset.key = key;

                    checkbox.addEventListener('change', () => {
                        settings[key] = checkbox.checked;
                        const allChecked = checkboxes.every(cb => cb.checked);
                        selectAllCheckbox.checked = allChecked;
                    });

                    label.appendChild(checkbox);
                    label.append(` ${ext.name}`);
                    content.appendChild(label);
                    checkboxes.push(checkbox);
                });

                selectAllCheckbox.checked = checkboxes.every(cb => cb.checked);
                selectAllCheckbox.addEventListener('change', () => {
                    checkboxes.forEach(cb => {
                        cb.checked = selectAllCheckbox.checked;
                        settings[cb.dataset.key] = cb.checked;
                    });
                });

                legend.addEventListener('click', () => {
                    const open = content.style.display === 'grid';
                    content.style.display = open ? 'none' : 'grid';
                    arrow.textContent = open ? '▶' : '▼';
                });

                fieldset.appendChild(legend);
                fieldset.appendChild(content);
                form.appendChild(fieldset);
            }

            return form;
        }

        function createStorageForm() {
            const form = document.createElement('form');

            for (const category in manualStorageRooms) {
                const fieldset = document.createElement('fieldset');
                fieldset.style.marginBottom = '12px';

                const {legend, arrow} = createSpoilerLegend(buildingTypeNames[category] || category);

                const content = document.createElement('div');
                content.style.display = 'none';
                content.style.gridTemplateColumns = 'repeat(auto-fill, minmax(150px, 1fr))';
                content.style.gap = '8px';
                content.style.padding = '8px 0';

                // Alle an-/abwählen Checkbox
                const allLabel = document.createElement('label');
                allLabel.style.gridColumn = '1 / -1';
                allLabel.style.display = 'flex';
                allLabel.style.alignItems = 'center';
                allLabel.style.gap = '6px';
                allLabel.style.fontWeight = '500';

                const selectAllCheckbox = document.createElement('input');
                selectAllCheckbox.type = 'checkbox';

                const selectAllText = document.createElement('span');
                selectAllText.textContent = 'Alle Lagerräume an-/abwählen';
                selectAllText.style.fontWeight = 'bold';
                selectAllText.style.color = 'var(--primary-color, #007bff)';

                allLabel.appendChild(selectAllCheckbox);
                allLabel.appendChild(selectAllText);
                content.appendChild(allLabel);

                const checkboxes = [];

                manualStorageRooms[category].forEach(room => {
                    const key = `${category}_storage_${room.name.replace(/\s+/g, '_')}`;
                    const label = document.createElement('label');
                    label.style.display = 'flex';
                    label.style.alignItems = 'center';
                    label.style.gap = '6px';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.checked = settings[key];
                    checkbox.dataset.key = key;

                    checkbox.addEventListener('change', () => {
                        settings[key] = checkbox.checked;
                        const allChecked = checkboxes.every(cb => cb.checked);
                        selectAllCheckbox.checked = allChecked;
                    });

                    label.appendChild(checkbox);
                    label.append(` ${room.name}`);
                    content.appendChild(label);
                    checkboxes.push(checkbox);
                });

                selectAllCheckbox.checked = checkboxes.every(cb => cb.checked);
                selectAllCheckbox.addEventListener('change', () => {
                    checkboxes.forEach(cb => {
                        cb.checked = selectAllCheckbox.checked;
                        settings[cb.dataset.key] = cb.checked;
                    });
                });

                legend.addEventListener('click', () => {
                    const open = content.style.display === 'grid';
                    content.style.display = open ? 'none' : 'grid';
                    arrow.textContent = open ? '▶' : '▼';
                });

                fieldset.appendChild(legend);
                fieldset.appendChild(content);
                form.appendChild(fieldset);
            }

            return form;
        }

        function setActiveTab(tabName) {
            if (tabName === 'extensions') {
                extBtn.classList.add('active');
                Object.assign(extBtn.style, {background: '#007bff', color: 'white', border: 'none'});
                storageBtn.classList.remove('active');
                Object.assign(storageBtn.style, {background: 'transparent', color: 'var(--text-color, #000)', border: '1px solid var(--border-color, #ccc)'});
                tabContent.innerHTML = '';
                tabContent.appendChild(createExtensionForm());
            } else {
                storageBtn.classList.add('active');
                Object.assign(storageBtn.style, {background: '#007bff', color: 'white', border: 'none'});
                extBtn.classList.remove('active');
                Object.assign(extBtn.style, {background: 'transparent', color: 'var(--text-color, #000)', border: '1px solid var(--border-color, #ccc)'});
                tabContent.innerHTML = '';
                tabContent.appendChild(createStorageForm());
            }
        }

        extBtn.addEventListener('click', () => setActiveTab('extensions'));
        storageBtn.addEventListener('click', () => setActiveTab('storage'));
        setActiveTab('extensions');

        // Gemeinsamer Button-Bereich unten (inkl. Schließen)
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            justifyContent: 'center',
            gap: '10px',
            marginTop: '20px',
        });

        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Speichern';
        Object.assign(saveBtn.style, {
            background: '#28a745',
            color: 'white',
            padding: '6px 12px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
        });
        saveBtn.addEventListener('click', () => {
            saveExtensionSettings(settings);
            alert('Deine Einstellungen wurden gespeichert. Die Seite wird neu geladen, um diese zu übernehmen.');
            overlay.remove();
            location.reload();
        });

        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Schließen';
        Object.assign(closeBtn.style, {
            backgroundColor: '#dc3545',
            color: '#fff',
            border: 'none',
            padding: '6px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
        });
        closeBtn.addEventListener('click', () => overlay.remove());

        buttonContainer.appendChild(saveBtn);
        buttonContainer.appendChild(closeBtn);
        panel.appendChild(buttonContainer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);
    }

    // Ende des Userinterfaces

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Funktion zum Abrufen der Benutzereinstellungen vom API
    async function getUserMode() {
        try {
            const response = await fetch('https://www.leitstellenspiel.de/api/settings');
            const data = await response.json();
            return data; // Gibt die vollständige Antwort zurück
        } catch (error) {
            console.error("Fehler beim Abrufen der Einstellungen: ", error);
            return null;
        }
    }

    // Funktion zum Anwenden des Dark- oder Light-Modus basierend auf der API-Antwort
    async function applyMode() {
        const userSettings = await getUserMode();
        if (!userSettings) {
            return;
        }

        const mode = userSettings.design_mode; // Benutze jetzt "design_mode" anstelle von "mode"
        // Warten auf das Lightbox-Element
        const lightboxContent = document.getElementById('extension-lightbox-content');
        if (!lightboxContent) {
            return;
        }

        // Entferne alle möglichen Modus-Klassen
        lightboxContent.classList.remove('dark', 'light');

        // Modus anwenden
        if (mode === 1 || mode === 4) { // Dunkelmodus
            lightboxContent.classList.add('dark');

            // Dark Mode für Tabelle
            document.documentElement.style.setProperty('--background-color', '#333');
            document.documentElement.style.setProperty('--text-color', '#fff');
            document.documentElement.style.setProperty('--border-color', '#444');
        } else if (mode === 2 || mode === 3) { // Hellmodus
            lightboxContent.classList.add('light');

            // Light Mode für Tabelle
            document.documentElement.style.setProperty('--background-color', '#f2f2f2');
            document.documentElement.style.setProperty('--text-color', '#000');
            document.documentElement.style.setProperty('--border-color', '#ccc');
        } else { // Standardmodus (wenn der Modus unbekannt ist)
            lightboxContent.classList.add('light'); // Standardmäßig hell

            // Standard Light Mode für Tabelle
            document.documentElement.style.setProperty('--background-color', '#f2f2f2');
            document.documentElement.style.setProperty('--text-color', '#000');
            document.documentElement.style.setProperty('--border-color', '#ccc');
        }
    }

    // Funktion zur Beobachtung der Lightbox auf Änderungen (für dynamisch geladene Elemente)
    function observeLightbox() {
        const lightboxContainer = document.getElementById('extension-lightbox');
        if (!lightboxContainer) {
            return;
        }

        const observer = new MutationObserver(() => {
            // Überprüfe, ob das Content-Element in der Lightbox existiert
            const lightboxContent = document.getElementById('extension-lightbox-content');
            if (lightboxContent) {
                applyMode(); // Wenn das Lightbox-Inhalt gefunden wird, Modus anwenden
                observer.disconnect(); // Beende die Beobachtung, wenn die Lightbox gefunden wurde
            }
        });

        // Beobachte das Hinzufügen von neuen Kindelementen (wie die Lightbox-Inhalte)
        observer.observe(lightboxContainer, { childList: true, subtree: true });
    }

    // Darkmode oder Whitemode anwenden
    function applyTheme() {
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        lightboxContent.classList.toggle('dark', isDarkMode);
        lightboxContent.classList.toggle('light', !isDarkMode);
    }

    // Event-Listener für Theme-Änderungen
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    // Theme initial anwenden
    applyTheme();

    // Funktion zum Formatieren der Zahl
    function formatNumber(number) {
        return new Intl.NumberFormat('de-DE').format(number);
    }

    // Funktion zum Abrufen des CSRF-Tokens
    function getCSRFToken() {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta ? meta.getAttribute('content') : '';
    }

    // Button im Profilmenü hinzufügen
    function addMenuButton() {
        const profileMenu = document.querySelector('#menu_profile + .dropdown-menu');
        if (!profileMenu) {
            console.error('Profilmenü (#menu_profile + .dropdown-menu) nicht gefunden. Der Button konnte nicht hinzugefügt werden.');
            return;
        }

        // Prüfen, ob der Button bereits existiert
        if (profileMenu.querySelector('#open-extension-helper')) return;

        // <li>-Element erstellen
        const menuButton = document.createElement('li');
        menuButton.setAttribute('role', 'presentation');

        // <a>-Element erstellen (wie bei den anderen Einträgen)
        const link = document.createElement('a');
        link.id = 'open-extension-helper';
        link.href = '#'; // notwendig, damit Styles greifen
        link.innerHTML = `
        <span class="glyphicon glyphicon-wrench"></span>&nbsp;&nbsp; Erweiterungs-Manager
    `;

        // Verhalten wie bei einem normalen Menü-Eintrag
        link.addEventListener('click', (e) => {
            e.preventDefault(); // verhindert Navigation

            document.getElementById('selected-credits').textContent = "0";
            document.getElementById('selected-coins').textContent = "0";

            checkPremiumAndShowHint(); // deine Funktion
        });

        // Elemente zusammenbauen
        menuButton.appendChild(link);

        // Einfügen vor Divider oder am Ende
        const divider = profileMenu.querySelector('li.divider');
        if (divider) {
            profileMenu.insertBefore(menuButton, divider);
        } else {
            profileMenu.appendChild(menuButton);
        }
    }

    // Initial den Button hinzufügen
    addMenuButton();

    // Globale Variable definieren
    var user_premium = false;

    // Funktion, um den Premium-Status zu überprüfen
    function checkPremiumStatus() {
        // Suchen Sie nach dem Skript-Tag, das die Variable user_premium setzt
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var scriptContent = scripts[i].textContent;
            var premiumMatch = scriptContent.match(/var user_premium\s*=\s*(true|false);/);
            if (premiumMatch) {
                user_premium = (premiumMatch[1] === 'true');
                break;
            }
        }

        // Fallback, falls die Variable nicht gefunden wird
        if (typeof user_premium === 'undefined') {
            console.error("Die Variable 'user_premium' ist nicht definiert. Bitte prüfen Sie die HTML-Struktur.");
            user_premium = false; // Standardwert setzen
        }
    }

    // Rufen Sie die Funktion auf, um den Status zu überprüfen
    checkPremiumStatus();

    // Funktion zur Prüfung von Premium und Hinweis
    async function checkPremiumAndShowHint() {
        const userSettings = await getUserMode();
        const isDarkMode = userSettings && (userSettings.design_mode === 1 || userSettings.design_mode === 4);

        function createCustomAlert(message, isDarkMode, callback) {
            const alertDiv = document.createElement('div');
            alertDiv.style.position = 'fixed';
            alertDiv.style.top = '50%';
            alertDiv.style.left = '50%';
            alertDiv.style.transform = 'translate(-50%, -50%)';
            alertDiv.style.padding = '20px';
            alertDiv.style.border = '1px solid';
            alertDiv.style.borderRadius = '10px';
            alertDiv.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.2)';
            alertDiv.style.width = '300px';
            alertDiv.style.textAlign = 'center';
            alertDiv.style.zIndex = '10002';

            alertDiv.style.background = isDarkMode ? '#333' : '#fff';
            alertDiv.style.color = isDarkMode ? '#fff' : '#000';
            alertDiv.style.borderColor = isDarkMode ? '#444' : '#ccc';

            const alertText = document.createElement('p');
            alertText.textContent = message;
            alertDiv.appendChild(alertText);

            const closeButton = document.createElement('button');
            closeButton.textContent = 'OK';
            closeButton.style.marginTop = '10px';
            closeButton.style.padding = '5px 10px';
            closeButton.style.border = 'none';
            closeButton.style.cursor = 'pointer';
            closeButton.style.borderRadius = '4px';
            closeButton.style.backgroundColor = isDarkMode ? '#444' : '#007bff';
            closeButton.style.color = isDarkMode ? '#fff' : '#fff';
            closeButton.onclick = () => {
                document.body.removeChild(alertDiv);
                callback();
            };
            alertDiv.appendChild(closeButton);

            document.body.appendChild(alertDiv);
        }

        if (typeof user_premium !== 'undefined') {

            if (!user_premium) {
                createCustomAlert("Du kannst dieses Script nur mit Einschränkungen nutzen da du keinen Premium-Account hast.", isDarkMode, () => {
                    const lightbox = document.getElementById('extension-lightbox');
                    lightbox.style.display = 'flex';
                    fetchBuildingsAndRender(); // API-Daten abrufen, wenn das Script geöffnet wird
                });
            } else {
                const lightbox = document.getElementById('extension-lightbox');
                lightbox.style.display = 'flex';
                fetchBuildingsAndRender(); // API-Daten abrufen, wenn das Script geöffnet wird
            }
        } else {
            console.error("Die Variable 'user_premium' ist nicht definiert. Bitte prüfe, ob sie korrekt geladen wurde.");
        }
    }

    // Funktion, um den Namen eines Gebäudes anhand der ID zu bekommen
    function getBuildingCaption(buildingId) {
        const building = buildingsData.find(b => String(b.id) === String(buildingId));
        if (building) {

            return building.caption; // Direkt den Gebäudennamen zurückgeben
        }

        return 'Unbekanntes Gebäude';
    }

    let buildingsData = [];
    let buildingGroups = {};
    const storageGroups = {};
    const selectedLevels = {};
    const storageBuildQueue = {};

    // Funktion um alle Daten zu sammeln
    async function fetchBuildingsAndRender() {
        const loadingText = document.getElementById('loading-text');
        const loadingContainer = document.getElementById('loading-container');
        const extensionList = document.getElementById('extension-list');

        let dotInterval;

        function startLoadingAnimation() {
            let dots = 0;
            loadingText.textContent = 'Lade die Daten, je nach Größe kann dies einen Augenblick dauern';
            dotInterval = setInterval(() => {
                dots = (dots + 1) % 4; // 0 bis 3 Punkte
                loadingText.textContent = 'Lade die Daten, je nach Größe kann dies einen Augenblick dauern' + '.'.repeat(dots);
            }, 500);
        }

        function stopLoadingAnimation() {
            clearInterval(dotInterval);
        }

        // Ladeanzeige starten
        loadingContainer.style.display = 'block';
        extensionList.style.display = 'none';
        startLoadingAnimation();

        try {
            const response = await fetch('https://www.leitstellenspiel.de/api/buildings');
            if (!response.ok) throw new Error('Fehler beim Abrufen der Daten');
            const buildingsData = await response.json();

            buildingsData.forEach(building => getBuildingLevelInfo(building));
            await initUserCredits();
            await renderMissingExtensions(buildingsData);

            // Ladeanzeige beenden
            stopLoadingAnimation();
            loadingContainer.style.display = 'none';
            extensionList.style.display = 'block';

        } catch (error) {
            stopLoadingAnimation();
            loadingContainer.style.display = 'none';
            extensionList.style.display = 'block';
            extensionList.innerHTML = 'Fehler beim Laden der Gebäudedaten.';
        }
    }

    // Funktion, um den Namen der zugehörigen Leitstelle zu ermitteln
    function getLeitstelleName(building) {
        if (!building.leitstelle_building_id) return 'Keine Leitstelle';

        const leitstelle = buildingsData.find(b => b.id === building.leitstelle_building_id);
        return leitstelle ? leitstelle.caption : 'Unbekannt';
    }

    // Funktion um die Ausbaustufen zu ermitteln
    function getBuildingLevelInfo(building) {
        const type = building.building_type;
        const size = building.small_building ? 'small' : 'normal';
        const key = `${type}_${size}`;
        const levelData = manualLevels[key];
        if (!levelData) return null;

        // currentLevel ist das Level im Gebäude-Objekt, >=0
        const currentLevel = (typeof building.level === 'number' && building.level >= 0) ? building.level : -1;

        // current = Stufe mit id == currentLevel, oder null falls Level -1
        const current = currentLevel >= 0 ? levelData.find(l => l.id === currentLevel) : null;
        // next = Level mit id currentLevel + 1, oder erstes Level wenn currentLevel -1 (noch kein Gebäude)
        const next = currentLevel >= 0 ? levelData.find(l => l.id === currentLevel + 1) : levelData[0];

        return { current, next, currentLevel };
    }

    // Funktion um die aktuelle Credits und Coins des Users abzurufen
    async function getUserCredits() {
        try {
            const response = await fetch('https://www.leitstellenspiel.de/api/userinfo');
            if (!response.ok) {
                throw new Error('Fehler beim Abrufen der Credits und Coins');
            }
            const data = await response.json();
            return {
                credits: data.credits_user_current,
                coins: data.coins_user_current,
                premium: data.premium // Fügen Sie diese Zeile hinzu, um den Premium-Status zurückzugeben
            };
        } catch (error) {
            console.error('Fehler beim Abrufen der Credits und Coins:', error);
            throw error;
        }
    }

    // Funktion um fehlende Lagererweiterungen für eine Gebäudegruppe zu ermitteln
    function prepareStorageGroup(groupKey, group, settings) {
        if (!storageGroups[groupKey]) storageGroups[groupKey] = [];

        group.forEach(({ building }) => {
            const baseKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const options = manualStorageRooms[baseKey];
            if (!options) return;

            const current = new Set((building.storage_upgrades || []).map(u => u.type_id));
            const missingExtensions = [];

            options.forEach(opt => {
                const id = opt.id;
                if (current.has(id)) return;

                const storageKey = `${baseKey}_storage_${opt.name.replace(/\s+/g, '_')}`;
                if (settings[storageKey] === false) return;

                missingExtensions.push({
                    id,
                    cost: opt.cost,
                    coins: opt.coins,
                    isStorage: true
                });
            });

            if (missingExtensions.length > 0) {
                storageGroups[groupKey].push({ building, missingExtensions });
            }
        });
    }

    // Funktion um die Tabellen mit Daten zu füllen
    async function renderMissingExtensions(buildings) {
        const userInfo = await getUserCredits();
        const list = document.getElementById('extension-list');
        list.innerHTML = '';

        buildingGroups = {};
        buildingsData = buildings;

        buildings.sort((a, b) =>
                       a.building_type === b.building_type
                       ? a.caption.localeCompare(b.caption)
                       : a.building_type - b.building_type
                      );

        const settings = getExtensionSettings();

        // Gruppiere Gebäude nach Typ & filtere erlaubte Erweiterungen
        buildings.forEach(building => {
            const baseKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const extensions = manualExtensions[baseKey];
            const storageOptions = manualStorageRooms[baseKey];

            // Wir erlauben Gebäude auch dann, wenn sie keine Erweiterungen oder Lager haben, aber Ausbaustufen
            const hasLevelUpgrade = !!getBuildingLevelInfo(building)?.next;

            // Falls keine Erweiterungen, keine Lager und keine Ausbaustufen, skippen
            if (!extensions && !storageOptions && !hasLevelUpgrade) return;

            const existingExtensions = new Set(building.extensions.map(e => e.type_id));
            const existingStorages = new Set((building.storage_upgrades || []).map(u => Object.keys(u)[0]));

            const allowedExtensions = (extensions || []).filter(ext => {
                const key = `${baseKey}_${ext.id}`;
                if (!settings[key] || isExtensionLimitReached(building, ext.id)) return false;

                // Bereits gebaute Erweiterung ausblenden
                if (existingExtensions.has(ext.id)) return false;

                const isForbidden = (forbiddenIds) =>
                forbiddenIds.some(id => existingExtensions.has(id)) && !forbiddenIds.includes(ext.id);

                if (building.building_type === 6 && building.small_building) {
                    return !isForbidden([10, 11, 12, 13]);
                }

                if (building.building_type === 0 && building.small_building) {
                    return !isForbidden([0, 6, 8, 13, 14, 16, 18, 19, 25]);
                }

                return true;
            });

            const enabledStorages = (storageOptions || []).filter(opt => {
                const key = `${baseKey}_storage_${opt.name.replace(/\s+/g, '_')}`;
                return settings[key] !== false && !existingStorages.has(opt.id.toString());
            });

            // Gebäude auch dann hinzufügen, wenn keine Erweiterungen oder Lager fehlen, aber Ausbaustufen vorhanden sind
            if (allowedExtensions.length === 0 && enabledStorages.length === 0 && !hasLevelUpgrade) return;

            buildingGroups[baseKey] = buildingGroups[baseKey] || [];
            buildingGroups[baseKey].push({ building, missingExtensions: allowedExtensions });

            // Lagergruppen vorbereiten
            if (enabledStorages.length > 0) {
                prepareStorageGroup(baseKey, [{ building }], settings);
            }
        });

        // Für jede Gruppe UI erzeugen
        Object.entries(buildingGroups).forEach(([groupKey, group]) => {
            const buildingType = buildingTypeNames[groupKey] || 'Unbekannt';

            const header = createHeader(buildingType);
            const buttons = createButtonContainer(groupKey, group, userInfo);

            buttons.container.dataset.buildingType = groupKey;

            const hasEnabledStorage = group.some(({ building }) => {
                const baseKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
                const options = manualStorageRooms[baseKey];
                if (!options) return false;

                return options.some(opt => {
                    const key = `${baseKey}_storage_${opt.name.replace(/\s+/g, '_')}`;
                    return settings[key] !== false;
                });
            });

            if (buttons.lagerButton) {
                buttons.lagerButton.disabled = !hasEnabledStorage;
                buttons.lagerButton.style.opacity = hasEnabledStorage ? '1' : '0.5';
                buttons.lagerButton.style.cursor = hasEnabledStorage ? 'pointer' : 'not-allowed';
                if (!hasEnabledStorage) {
                    buttons.lagerButton.title = 'Keine Lager-Erweiterung für diese Gruppe aktiviert';
                }
            }

            const hasExtensions = group.some(({ missingExtensions }) => missingExtensions.length > 0);

            if (buttons.spoilerButton) {
                buttons.spoilerButton.disabled = !hasExtensions;
                buttons.spoilerButton.style.opacity = hasExtensions ? '1' : '0.5';
                buttons.spoilerButton.style.cursor = hasExtensions ? 'pointer' : 'not-allowed';
                if (!hasExtensions) {
                    buttons.spoilerButton.title = 'Keine Erweiterungen zum Ausbau oder ausgewählt';
                }
            }

            const spoilerWrapper = (hasExtensions && buttons.spoilerButton)
            ? createSpoilerContentWrapper(buttons.spoilerButton)
            : null;

            if (spoilerWrapper) {
                const table = createExtensionTable(groupKey, group, userInfo, buttons.buildSelectedButton);
                spoilerWrapper.appendChild(table);
            }

            const lagerWrapper = buttons.lagerButton && hasEnabledStorage
            ? createLagerContentWrapper(buttons.lagerButton, group, userInfo, buttons.buildSelectedButton)
            : null;

            // Level-Upgrades prüfen
            const hasLevelUpgrades = group.some(({ building }) => {
                const levelInfo = getBuildingLevelInfo(building);
                return levelInfo?.next;
            });

            let levelWrapper = null;
            if (buttons.levelButton) {
                buttons.levelButton.disabled = !hasLevelUpgrades;
                buttons.levelButton.style.opacity = hasLevelUpgrades ? '1' : '0.5';
                buttons.levelButton.style.cursor = hasLevelUpgrades ? 'pointer' : 'not-allowed';

                if (!hasLevelUpgrades) {
                    buttons.levelButton.title = 'Keine weiteren Ausbaustufen verfügbar';
                } else {
                    levelWrapper = createLevelContentWrapper(buttons.levelButton, group, userInfo);
                }
            }

            // Buttons + Header einfügen
            list.append(header, buttons.container);
            if (spoilerWrapper) list.appendChild(spoilerWrapper);
            if (lagerWrapper) list.appendChild(lagerWrapper);
            if (levelWrapper) list.appendChild(levelWrapper);

            // Wrapper gegenseitig referenzieren als Array (otherWrappers)
            const wrappers = [spoilerWrapper, lagerWrapper, levelWrapper].filter(Boolean);
            wrappers.forEach(wrapper => {
                wrapper.otherWrappers = wrappers.filter(w => w !== wrapper);
            });
        });
    }

    // Funktion um den TabellenHeader zu erstellen
    function createHeader(title) {
        const h = document.createElement('h4');
        h.textContent = title;
        h.classList.add('building-header');
        return h;
    }

    // Funktion um den ButtonContainer zu erstellen
    function createButtonContainer(groupKey, group, userInfo) {
        const container = document.createElement('div');
        container.classList.add('button-container');

        const spoilerButton = createButton('Erweiterungen', ['btn', 'spoiler-button']);

        const showLevelButton = group.some(({ building }) => {
            const key = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            return allowedBuildings.has(key);
        });

        let levelButton = null;
        if (showLevelButton) {
            levelButton = createButton('Ausbaustufen', ['btn', 'level-button']);
        }

        const canBuildStorage = group.some(({ building }) => {
            const key = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            return manualStorageRooms.hasOwnProperty(key);
        });

        let lagerButton = null;
        if (canBuildStorage) {
            lagerButton = createButton('Lagerräume', ['btn', 'lager-button']);
        }

        const buildSelectedButton = createButton('Ausgewählte Erweiterungen/Lager bauen', ['btn', 'build-selected-button']);
        buildSelectedButton.disabled = true;
        buildSelectedButton.onclick = () => buildSelectedExtensions();

        const buildSelectedLevelsButton = createButton('Ausgewählte Stufen bauen', ['btn', 'build-selected-levels-button']);
        buildSelectedLevelsButton.disabled = true;
        buildSelectedLevelsButton.onclick = () => buildSelectedLevels(group, userInfo);

        const buildAllButton = createButton('Sämtliche Erweiterungen/Lager bei allen Wachen bauen', ['btn', 'build-all-button']);
        buildAllButton.onclick = () => showCurrencySelectionForAll(groupKey);

        [spoilerButton, lagerButton, buildSelectedButton, levelButton, buildSelectedLevelsButton, buildAllButton]
            .filter(Boolean)
            .forEach(btn => container.appendChild(btn));

        return {
            container,
            spoilerButton,
            levelButton,
            lagerButton,
            buildSelectedLevelsButton,
            buildSelectedButton,

        };
    }

    // Funktion um die Buttons zu erstellen
    function createButton(text, classes = []) {
        const btn = document.createElement('button');
        btn.textContent = text;
        classes.forEach(cls => btn.classList.add(cls));
        return btn;
    }

    // Funktion um die Spoiler-Inhalte zu erstellen (Erweiterung/Lager/Stufenausbau)
    function resetButtonText(wrapper) {
        if (!wrapper.associatedButton) return;
        if (wrapper.classList.contains('spoiler-content')) {
            wrapper.associatedButton.textContent = 'Erweiterungen';
        } else if (wrapper.classList.contains('lager-wrapper')) {
            wrapper.associatedButton.textContent = 'Lagerräume';
        } else if (wrapper.classList.contains('level-wrapper')) {
            wrapper.associatedButton.textContent = 'Ausbaustufen';
        }
    }
    function createSpoilerContentWrapper(spoilerButton) {
        const wrapper = document.createElement('div');
        wrapper.className = 'spoiler-content';
        wrapper.style.display = 'none';

        spoilerButton.addEventListener('click', () => {
            const show = wrapper.style.display !== 'block';

            if (wrapper.otherWrappers) {
                wrapper.otherWrappers.forEach(other => {
                    other.style.display = 'none';
                    if (other.associatedButton) {
                        other.associatedButton.classList.remove('active-button');
                        resetButtonText(other);
                    }
                });
            }

            wrapper.style.display = show ? 'block' : 'none';
            spoilerButton.textContent = show ? 'Erweiterungen ausblenden' : 'Erweiterungen';
            spoilerButton.classList.toggle('active-button', show);
        });

        wrapper.associatedButton = spoilerButton;
        return wrapper;
    }
    function createLagerContentWrapper(lagerButton, group, userInfo, buildSelectedButton) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('lager-wrapper');
        wrapper.style.display = 'none';
        wrapper.style.marginTop = '10px';

        const lagerTable = createLagerTable(group, userInfo, buildSelectedButton);
        wrapper.appendChild(lagerTable);

        lagerButton.addEventListener('click', () => {
            const show = wrapper.style.display !== 'block';

            if (wrapper.otherWrappers) {
                wrapper.otherWrappers.forEach(other => {
                    other.style.display = 'none';
                    if (other.associatedButton) {
                        other.associatedButton.classList.remove('active-button');
                        resetButtonText(other);
                    }
                });
            }

            wrapper.style.display = show ? 'block' : 'none';
            lagerButton.textContent = show ? 'Lagerräume ausblenden' : 'Lagerräume';
            lagerButton.classList.toggle('active-button', show);
        });

        wrapper.associatedButton = lagerButton;
        return wrapper;
    }
    function createLevelContentWrapper(levelButton, group, userInfo, buildSelectedButton) {
        const wrapper = document.createElement('div');
        wrapper.classList.add('level-wrapper');
        wrapper.style.display = 'none';
        wrapper.style.marginTop = '10px';

        const levelTable = createLevelTable(group, userInfo);
        wrapper.appendChild(levelTable);

        levelButton.addEventListener('click', () => {
            const show = wrapper.style.display !== 'block';

            if (wrapper.otherWrappers) {
                wrapper.otherWrappers.forEach(other => {
                    other.style.display = 'none';
                    if (other.associatedButton) {
                        other.associatedButton.classList.remove('active-button');
                        resetButtonText(other);
                    }
                });
            }

            wrapper.style.display = show ? 'block' : 'none';
            levelButton.textContent = show ? 'Ausbaustufen ausblenden' : 'Ausbaustufen';
            levelButton.classList.toggle('active-button', show);
        });

        wrapper.associatedButton = levelButton;
        return wrapper;
    }

    // Funktion zur Prüfung der richtigen Baureihenfolge von Lagerräumen
    function canBuildStorageInOrder(storageId, buildingType, builtStorages) {
        const storageList = manualStorageRooms[buildingType];
        if (!storageList) return true;

        const indexToBuild = storageList.findIndex(s => s.id === storageId);
        if (indexToBuild === -1) return true;

        for (let i = 0; i < indexToBuild; i++) {
            if (!builtStorages.includes(storageList[i].id)) {

                return false;
            }
        }

        return true;
    }
    function canBuildAllSelectedInOrder(selectedStorages, buildingType, builtStorages) {
        const storageList = manualStorageRooms[buildingType];
        if (!storageList) return true;

        const allBuilt = new Set(builtStorages);

        for (let i = 0; i < storageList.length; i++) {
            const currentStorageId = storageList[i].id;

            if (selectedStorages.includes(currentStorageId)) {
                // Prüfe: sind alle vorherigen gebaut?
                for (let j = 0; j < i; j++) {
                    const prevStorageId = storageList[j].id;
                    if (!allBuilt.has(prevStorageId)) {
                        // Nicht erlaubt, weil vorherige Lager fehlen
                        return false;
                    }
                }

                // Temporär als "gebaut" markieren, um Reihenfolge in dieser Session zu tracken
                allBuilt.add(currentStorageId);
            }
        }

        return true;
    }

    // Funktion um die Tabelle für Erweiterung, Lager und Ausbaustufen zu erstellen
    function createExtensionTable(groupKey, group, userInfo, buildSelectedButton) {
        const table = document.createElement('table');
        table.innerHTML = `
        <thead style="background-color: #f2f2f2; font-weight: bold; border-bottom: 2px solid #ccc;">
            <tr>
                <th style="padding: 10px; text-align: center;">Alle An- / Abwählen</th>
                <th>Leitstelle</th>
                <th>Wache/Gebäude</th>
                <th>Baubare Erweiterungen</th>
                <th>Bauen mit Credits</th>
                <th>Bauen mit Coins</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;

        const tbody = table.querySelector('tbody');
        const filters = {};
        const filterRow = document.createElement('tr');
        const filterElements = {};

        // Checkbox für „Alle auswählen“
        const selectAllCell = document.createElement('th');
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.className = 'select-all-checkbox';
        selectAllCheckbox.dataset.group = groupKey;
        selectAllCell.appendChild(selectAllCheckbox);
        filterRow.appendChild(selectAllCell);

        // Hilfsfunktion für Dropdown-Filter
        function createDropdownFilter(options, placeholder, colIndex) {
            const th = document.createElement('th');
            const select = document.createElement('select');
            select.innerHTML = `<option value="">🔽 ${placeholder}</option>`;
            [...new Set(options)].sort().forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                filters[colIndex] = select.value || undefined;
                applyAllFilters();
                updateSelectAllCheckboxState();
            });

            filterElements[colIndex] = select;
            th.appendChild(select);
            return th;
        }

        // Sammle Filteroptionen
        const leitstellen = group.map(g => getLeitstelleName(g.building));
        const wachen = group.map(g => g.building.caption);
        const erweiterungen = group.flatMap(g => g.missingExtensions.map(e => e.name));

        filterRow.appendChild(createDropdownFilter(leitstellen, 'Leitstelle', 1));
        filterRow.appendChild(createDropdownFilter(wachen, 'Wache', 2));
        filterRow.appendChild(createDropdownFilter(erweiterungen, 'Erweiterung', 3));

        // Filter zurücksetzen
        const resetCell = document.createElement('th');
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Filter zurücksetzen';
        resetBtn.classList.add('btn', 'btn-sm', 'btn-primary');
        resetBtn.style.padding = '2px 6px';
        resetBtn.style.fontSize = '0.8em';
        resetBtn.onclick = () => {
            Object.values(filterElements).forEach(select => select.selectedIndex = 0);
            Object.keys(filters).forEach(k => delete filters[k]);
            applyAllFilters();
            updateSelectAllCheckboxState();
        };
        resetCell.appendChild(resetBtn);
        filterRow.appendChild(resetCell);

        // Leere Spalte "Bauen mit Coins" ersetzen durch einen globalen Abwähl-Button
        const uncheckAllCell = document.createElement('th');
        uncheckAllCell.style.textAlign = 'center';
        uncheckAllCell.style.padding = '4px 8px';

        const uncheckAllBtn = document.createElement('button');
        uncheckAllBtn.textContent = 'Alle abwählen';
        uncheckAllBtn.classList.add('btn', 'btn-sm', 'btn-warning');
        uncheckAllBtn.style.padding = '2px 6px';
        uncheckAllBtn.style.fontSize = '0.8em';

        uncheckAllBtn.onclick = () => {
            tbody.querySelectorAll('tr').forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.extension-checkbox');
                    if (cb && !cb.disabled) {
                        cb.checked = false;
                    }
                }
            });
            updateBuildSelectedButton();
            updateSelectAllCheckboxState();
            updateSelectedAmounts(group, userInfo);
        };

        uncheckAllCell.appendChild(uncheckAllBtn);
        filterRow.appendChild(uncheckAllCell);

        table.querySelector('thead').appendChild(filterRow);

        selectAllCheckbox.addEventListener('change', (event) => {
            const isChecked = selectAllCheckbox.checked;

            // Gesamtkosten nur der sichtbaren, nicht deaktivierten Checkboxen
            let totalCredits = 0;
            let totalCoins = 0;

            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.extension-checkbox');
                    if (cb && !cb.disabled) {
                        if (isChecked) {
                            totalCredits += Number(cb.dataset.creditCost) || 0;
                            totalCoins += Number(cb.dataset.coinCost) || 0;
                        }
                    }
                }
            });

            const canPayAllWithCredits = currentCredits >= totalCredits;
            const canPayAllWithCoins = currentCoins >= totalCoins;

            if (!canPayAllWithCredits && !canPayAllWithCoins) {
                alert("Du hast nicht genug Credits oder Coins für die gesamte Auswahl!");
                // Checkbox zurücksetzen, da nicht erlaubt
                selectAllCheckbox.checked = false;
                return;
            }

            // Checkboxen setzen
            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.extension-checkbox');
                    if (cb && !cb.disabled) {
                        cb.checked = isChecked;
                    }
                }
            });

            updateBuildSelectedButton();
            updateSelectAllCheckboxState();
            updateSelectedAmounts(group, userInfo);
        });


        group.forEach(({ building, missingExtensions }) => {
            missingExtensions.forEach(extension => {
                if (isExtensionLimitReached(building, extension.id)) return;

                const row = document.createElement('tr');
                row.classList.add(`row-${building.id}-${extension.id}`);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'extension-checkbox';
                checkbox.dataset.buildingId = building.id;
                checkbox.dataset.extensionId = extension.id;
                checkbox.dataset.creditCost = extension.cost;
                checkbox.dataset.coinCost = extension.coins;

                checkbox.disabled = userInfo.credits < extension.cost && userInfo.coins < extension.coins;
                checkbox.addEventListener('change', () => {
                    updateBuildSelectedButton();
                    updateSelectedAmounts(group, userInfo);
                });

                row.innerHTML = `
                <td></td>
                <td>${getLeitstelleName(building)}</td>
                <td>${building.caption}</td>
                <td>${extension.name}</td>
            `;

                row.children[0].appendChild(checkbox);

                // Credits-Button
                const creditCell = document.createElement('td');
                const creditBtn = document.createElement('button');
                creditBtn.textContent = `${formatNumber(extension.cost)} Credits`;
                creditBtn.classList.add('btn', 'btn-xl', 'credit-button');
                creditBtn.style.backgroundColor = '#28a745';
                creditBtn.style.color = 'white';
                creditBtn.disabled = userInfo.credits < extension.cost;
                creditBtn.onclick = async () => {
                    await buildExtension(building, extension.id, 'credits', extension.cost, row);

                    // Auswahl für diese Erweiterung zurücksetzen
                    const cb = row.querySelector('.extension-checkbox');
                    if (cb) cb.checked = false;

                    // Guthaben neu laden und anzeigen
                    await initUserCredits();

                    updateSelectedAmounts(group, userInfo);
                };

                creditCell.appendChild(creditBtn);
                row.appendChild(creditCell);

                // Coins-Button
                const coinsCell = document.createElement('td');
                const coinBtn = document.createElement('button');
                coinBtn.textContent = `${extension.coins} Coins`;
                coinBtn.classList.add('btn', 'btn-xl', 'coins-button');
                coinBtn.style.backgroundColor = '#dc3545';
                coinBtn.style.color = 'white';
                coinBtn.disabled = userInfo.coins < extension.coins;
                coinBtn.onclick = async () => {
                    await buildExtension(building, extension.id, 'coins', extension.coins, row);

                    const cb = row.querySelector('.extension-checkbox');
                    if (cb) cb.checked = false;

                    await initUserCredits();

                    updateSelectedAmounts(group, userInfo);
                };

                coinsCell.appendChild(coinBtn);
                row.appendChild(coinsCell);

                tbody.appendChild(row);
            });
        });

        function applyAllFilters() {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                let visible = true;
                Object.entries(filters).forEach(([i, val]) => {
                    const text = row.children[i]?.textContent.toLowerCase().trim();
                    if (val && text !== val.toLowerCase()) visible = false;
                });
                row.style.display = visible ? '' : 'none';
            });
        }

        function updateSelectAllCheckboxState() {
            const rows = tbody.querySelectorAll('tr');
            let total = 0, checked = 0;
            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.extension-checkbox');
                    if (cb && !cb.disabled) {
                        total++;
                        if (cb.checked) checked++;
                    }
                }
            });
            selectAllCheckbox.checked = total > 0 && total === checked;
            selectAllCheckbox.indeterminate = checked > 0 && checked < total;
        }

        return table;
    }
    function createLagerTable(group, userInfo, buildSelectedButton, currentGroupKey) {
        const settings = getExtensionSettings();
        const liveBuiltStorages = {};  // Live-Tracking der gebauten Lager pro Gebäude

        // Initialisiere liveBuiltStorages mit aktuellen Upgrades
        group.forEach(({ building }) => {
            liveBuiltStorages[building.id] = new Set(
                (building.storage_upgrades || []).map(u => u.type_id)
            );
        });

        const table = document.createElement('table');
        table.innerHTML = `
    <thead style="background-color: #f2f2f2; font-weight: bold; border-bottom: 2px solid #ccc;">
        <tr>
            <th style="padding: 10px; text-align: center;">Alle An- / Abwählen</th>
            <th>Leitstelle</th>
            <th>Wache</th>
            <th>Baubare Lager</th>
            <th>Lagerkapazität</th>
            <th>Credits</th>
            <th>Coins</th>
        </tr>
    </thead>
    <tbody></tbody>
    `;

        const tbody = table.querySelector('tbody');
        const filters = {};
        const filterElements = {};
        const filterRow = document.createElement('tr');

        const selectAllCell = document.createElement('th');
        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';
        selectAllCheckbox.className = 'select-all-checkbox-lager';
        selectAllCell.appendChild(selectAllCheckbox);
        filterRow.appendChild(selectAllCell);

        function createDropdownFilter(options, placeholder, colIndex) {
            const th = document.createElement('th');
            const select = document.createElement('select');
            select.innerHTML = `<option value="">🔽 ${placeholder}</option>`;
            [...new Set(options)].sort().forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });

            select.addEventListener('change', () => {
                filters[colIndex] = select.value || undefined;
                applyAllFilters();
                updateSelectAllCheckboxState();
            });

            filterElements[colIndex] = select;
            th.appendChild(select);
            return th;
        }

        const leitstellen = [];
        const wachen = [];
        const lagerArten = [];

        group.forEach(({ building }) => {
            const baseKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const options = manualStorageRooms[baseKey];
            if (!options) return;

            // Hier liveBuiltStorages für das Gebäude verwenden
            const current = liveBuiltStorages[building.id];

            options.forEach(opt => {
                const id = opt.id;

                if (current.has(id)) return; // Bereits gebaut, nicht anzeigen

                const storageKey = `${baseKey}_storage_${opt.name.replace(/\s+/g, '_')}`;
                if (settings[storageKey] === false) return;

                leitstellen.push(getLeitstelleName(building));
                wachen.push(building.caption);
                lagerArten.push(opt.name);

                const row = document.createElement('tr');
                row.classList.add(`storage-row-${building.id}-${id}`);

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'storage-checkbox';
                checkbox.dataset.buildingId = building.id;
                checkbox.dataset.storageType = id;
                checkbox.dataset.creditCost = opt.cost;
                checkbox.dataset.coinCost = opt.coins;
                checkbox.disabled = userInfo.credits < opt.cost && userInfo.coins < opt.coins;
                checkbox.addEventListener('change', () => {
                    updateBuildSelectedButton();
                    updateSelectedAmounts(group, userInfo);
                });

                const checkboxCell = document.createElement('td');
                checkboxCell.appendChild(checkbox);
                row.appendChild(checkboxCell);

                [getLeitstelleName(building), building.caption, opt.name, `+${opt.additionalStorage}`].forEach(text => {
                    const td = document.createElement('td');
                    td.textContent = text;
                    row.appendChild(td);
                });

                const creditCell = document.createElement('td');
                const creditBtn = document.createElement('button');
                creditBtn.textContent = `${formatNumber(opt.cost)} Credits`;
                creditBtn.classList.add('btn', 'btn-xl', 'credit-button');
                creditBtn.style.backgroundColor = '#28a745';
                creditBtn.style.color = 'white';
                creditBtn.disabled = userInfo.credits < opt.cost;
                creditBtn.onclick = async () => {
                    const built = [...liveBuiltStorages[building.id]];

                    if (!canBuildStorageInOrder(id, baseKey, built)) {
                        alert("Bitte beachte: Die Lagerräume müssen in der vorgegebenen Reihenfolge gebaut werden.\n\nReihenfolge:\n1. Lagerraum\n2. 1te zusätzlicher Lagerraum\n3. 2te zusätzlicher Lagerraum\n4. 3te zusätzlicher Lagerraum\n5. 4te zusätzlicher Lagerraum\n6. 5te zusätzlicher Lagerraum\n7. 6te zusätzlicher Lagerraum\n8. 7te zusätzlicher Lagerraum");
                        return;
                    }

                    await buildStorage(building, id, 'credits', opt.cost, row);

                    liveBuiltStorages[building.id].add(id);

                    creditBtn.disabled = true;
                    coinBtn.disabled = true;
                    checkbox.disabled = true;

                    await initUserCredits();
                    updateBuildSelectedButton();
                    updateSelectedAmounts(group, userInfo);
                };

                creditCell.appendChild(creditBtn);
                row.appendChild(creditCell);

                const coinsCell = document.createElement('td');
                const coinBtn = document.createElement('button');
                coinBtn.textContent = `${opt.coins} Coins`;
                coinBtn.classList.add('btn', 'btn-xl', 'coins-button');
                coinBtn.style.backgroundColor = '#dc3545';
                coinBtn.style.color = 'white';
                coinBtn.disabled = userInfo.coins < opt.coins;
                coinBtn.onclick = () => {
                    const built = [...liveBuiltStorages[building.id]];

                    if (!canBuildStorageInOrder(id, baseKey, built)) {
                        alert("Bitte beachte: Die Lagerräume müssen in der vorgegebenen Reihenfolge gebaut werden.\n\nReihenfolge:\n1. Lagerraum\n2. 1te zusätzlicher Lagerraum\n3. 2te zusätzlicher Lagerraum\n4. 3te zusätzlicher Lagerraum\n5. 4te zusätzlicher Lagerraum\nusw.");
                        return;
                    }

                    buildStorage(building, id, 'coins', opt.coins, row);

                    liveBuiltStorages[building.id].add(id);

                    creditBtn.disabled = true;
                    coinBtn.disabled = true;
                    checkbox.disabled = true;

                    initUserCredits();
                    updateBuildSelectedButton();
                    updateSelectedAmounts(group, userInfo);
                };

                coinsCell.appendChild(coinBtn);
                row.appendChild(coinsCell);

                tbody.appendChild(row);
            });
        });

        // Filterzeile ergänzen
        filterRow.appendChild(createDropdownFilter(leitstellen, 'Leitstelle', 1));
        filterRow.appendChild(createDropdownFilter(wachen, 'Wache', 2));
        filterRow.appendChild(createDropdownFilter(lagerArten, 'Erweiterung', 3));

        const resetCell = document.createElement('th');
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Filter zurücksetzen';
        resetBtn.classList.add('btn', 'btn-sm', 'btn-primary');
        resetBtn.style.padding = '2px 6px';
        resetBtn.style.fontSize = '0.8em';
        resetBtn.onclick = () => {
            Object.values(filterElements).forEach(select => select.selectedIndex = 0);
            Object.keys(filters).forEach(k => delete filters[k]);
            applyAllFilters();
            updateSelectAllCheckboxState();
        };
        resetCell.appendChild(resetBtn);
        filterRow.appendChild(resetCell);

        // Leere Spalte "Bauen mit Coins" ersetzen durch einen globalen Abwähl-Button
        const uncheckAllCell = document.createElement('th');
        uncheckAllCell.style.textAlign = 'center';
        uncheckAllCell.style.padding = '4px 8px';

        const uncheckAllBtn = document.createElement('button');
        uncheckAllBtn.textContent = 'Alle abwählen';
        uncheckAllBtn.classList.add('btn', 'btn-sm', 'btn-warning');
        uncheckAllBtn.style.padding = '2px 6px';
        uncheckAllBtn.style.fontSize = '0.8em';

        uncheckAllBtn.onclick = () => {
            tbody.querySelectorAll('tr').forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.storage-checkbox');
                    if (cb && !cb.disabled) {
                        cb.checked = false;
                    }
                }
            });
            updateBuildSelectedButton();
            updateSelectAllCheckboxState();
            updateSelectedAmounts(group, userInfo);
        };

        uncheckAllCell.appendChild(uncheckAllBtn);
        filterRow.appendChild(uncheckAllCell);

        table.querySelector('thead').appendChild(filterRow);

        selectAllCheckbox.addEventListener('change', (event) => {
            const isChecked = selectAllCheckbox.checked;

            let totalCredits = 0;
            let totalCoins = 0;

            const rows = tbody.querySelectorAll('tr');

            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.storage-checkbox');
                    if (cb && !cb.disabled) {
                        if (isChecked) {
                            totalCredits += Number(cb.dataset.creditCost) || 0;
                            totalCoins += Number(cb.dataset.coinCost) || 0;
                        }
                    }
                }
            });

            const canPayAllWithCredits = currentCredits >= totalCredits;
            const canPayAllWithCoins = currentCoins >= totalCoins;

            if (!canPayAllWithCredits && !canPayAllWithCoins) {
                alert("Du hast nicht genug Credits ODER Coins für die gesamte Auswahl!");
                selectAllCheckbox.checked = false;
                return;
            }

            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    const cb = row.querySelector('.storage-checkbox');
                    if (cb && !cb.disabled) {
                        cb.checked = isChecked;
                    }
                }
            });

            updateSelectAllCheckboxState();
            updateBuildSelectedButton();
            updateSelectedAmounts(group, userInfo);
        });


        function applyAllFilters() {
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                let visible = true;
                Object.entries(filters).forEach(([i, val]) => {
                    const text = row.children[i]?.textContent.toLowerCase().trim();
                    if (val && text !== val.toLowerCase()) visible = false;
                });
                row.style.display = visible ? '' : 'none';
            });
        }

        function updateSelectAllCheckboxState() {
            const visibleRows = [...tbody.querySelectorAll('tr')].filter(row => row.style.display !== 'none');
            if (visibleRows.length === 0) {
                selectAllCheckbox.checked = false;
                selectAllCheckbox.indeterminate = false;
                selectAllCheckbox.disabled = true;
                return;
            }
            selectAllCheckbox.disabled = false;
            const allChecked = visibleRows.every(row => row.querySelector('.storage-checkbox').checked || row.querySelector('.storage-checkbox').disabled);
            const noneChecked = visibleRows.every(row => !row.querySelector('.storage-checkbox').checked);
            selectAllCheckbox.checked = allChecked;
            selectAllCheckbox.indeterminate = !allChecked && !noneChecked;
        }

        updateSelectAllCheckboxState();

        // Speichere die Lagerdaten für die Bau-Funktion (das bleibt unverändert)
        if (!storageGroups[currentGroupKey]) storageGroups[currentGroupKey] = [];

        group.forEach(({ building }) => {
            const baseKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const options = manualStorageRooms[baseKey];
            if (!options) return;

            const current = new Set((building.storage_upgrades || []).map(u => Object.keys(u)[0]));

            const missingExtensions = [];

            options.forEach(opt => {
                const id = opt.id;
                if (current.has(id)) return;

                const storageKey = `${baseKey}_storage_${opt.name.replace(/\s+/g, '_')}`;
                if (getExtensionSettings()[storageKey] === false) return;

                missingExtensions.push({
                    id,
                    cost: opt.cost,
                    coins: opt.coins,
                    isStorage: true
                });
            });

            if (missingExtensions.length > 0) {
                storageGroups[currentGroupKey].push({ building, missingExtensions });
            }
        });

        return table;
    }
    function createLevelTable(group, userInfo) {
        function updateBuildButtons(building, selectedLevelId, creditCell, coinCell, levelList, currentLevel) {
            let totalCredits = 0;
            let totalCoins = 0;

            if (selectedLevelId === null) {
                creditCell.innerHTML = '';
                coinCell.innerHTML = '';

                const creditBtn = document.createElement('button');
                creditBtn.textContent = '0 Credits';
                creditBtn.classList.add('btn', 'btn-sm');
                creditBtn.style.backgroundColor = '#28a745';
                creditBtn.style.color = 'white';
                creditBtn.disabled = true;
                creditCell.appendChild(creditBtn);

                const coinBtn = document.createElement('button');
                coinBtn.textContent = '0 Coins';
                coinBtn.classList.add('btn', 'btn-sm');
                coinBtn.style.backgroundColor = '#dc3545';
                coinBtn.style.color = 'white';
                coinBtn.disabled = true;
                coinCell.appendChild(coinBtn);
                return;
            }

            if (selectedLevelId >= currentLevel) {
                for (let i = currentLevel; i <= selectedLevelId; i++) {
                    const stufe = levelList[i];
                    if (!stufe) continue;
                    totalCredits += stufe.cost || 0;
                    totalCoins += stufe.coins || 0;
                }
            } else {
                totalCredits = 0;
                totalCoins = 0;
            }

            creditCell.innerHTML = '';
            const creditBtn = document.createElement('button');
            creditBtn.textContent = `${totalCredits.toLocaleString()} Credits`;
            creditBtn.classList.add('btn', 'btn-sm');
            creditBtn.style.backgroundColor = '#28a745';
            creditBtn.style.color = 'white';
            creditBtn.disabled = userInfo.credits < totalCredits || totalCredits === 0;
            creditBtn.onclick = async () => {
                if (userInfo.credits < totalCredits) {
                    alert('Nicht genug Credits!');
                    return;
                }
                try {
                    await buildLevel(building.id, 'credits', selectedLevelId);
                    for (const b of group) {
                        const currentLevel = getBuildingLevelInfo(b.building)?.currentLevel ?? 0;
                        selectedLevels[b.building.id] = currentLevel;
                    }
                    fetchBuildingsAndRender();
                    updateSelectedAmounts(group, userInfo);
                    updateBuildSelectedLevelsButtonState(group);
                } catch {
                    alert('Fehler beim Bauen mit Credits.');
                }
            };
            creditCell.appendChild(creditBtn);

            coinCell.innerHTML = '';
            const coinBtn = document.createElement('button');
            coinBtn.textContent = `${totalCoins.toLocaleString()} Coins`;
            coinBtn.classList.add('btn', 'btn-sm');
            coinBtn.style.backgroundColor = '#dc3545';
            coinBtn.style.color = 'white';
            coinBtn.disabled = userInfo.coins < totalCoins || totalCoins === 0;
            coinBtn.onclick = async () => {
                if (userInfo.coins < totalCoins) {
                    alert('Nicht genug Coins!');
                    return;
                }
                try {
                    await buildLevel(building.id, 'coins', selectedLevelId);
                    for (const b of group) {
                        const currentLevel = getBuildingLevelInfo(b.building)?.currentLevel ?? 0;
                        selectedLevels[b.building.id] = currentLevel;
                    }
                    fetchBuildingsAndRender();
                    updateSelectedAmounts(group, userInfo);
                    updateBuildSelectedLevelsButtonState(group);
                } catch {
                    alert('Fehler beim Bauen mit Coins.');
                }
            };
            coinCell.appendChild(coinBtn);
        }

        const isDarkMode = () => document.body.classList.contains('dark');
        const updateButtonColors = (container) => {
            container.querySelectorAll('button').forEach(btn => {
                if (btn.dataset.active === 'true') {
                    btn.style.backgroundColor = '#28a745';
                    btn.style.color = '#fff';
                } else {
                    if (isDarkMode()) {
                        btn.style.backgroundColor = '#444';
                        btn.style.color = '#fff';
                    } else {
                        btn.style.backgroundColor = '#e0e0e0';
                        btn.style.color = '#000';
                    }
                }
            });
        };

        // --- Tabelle mit Head und Body ---
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.innerHTML = `
        <thead style="background-color: #f2f2f2; font-weight: bold; border-bottom: 2px solid #ccc;">
            <tr>
                <th style="padding: 10px; text-align: center;">Leitstelle</th>
                <th style="padding: 10px; text-align: center;">Wache</th>
                <th style="padding: 10px; text-align: center;">Stufe</th>
                <th style="padding: 10px; text-align: center;">Ausbaustufe wählen</th>
                <th style="padding: 10px; text-align: center;">Bauen mit Credits</th>
                <th style="padding: 10px; text-align: center;">Bauen mit Coins</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
        const tbody = table.querySelector('tbody');
        const thead = table.querySelector('thead');

        // --- Filter-Row bauen ---
        const filterRow = document.createElement('tr');
        // Zellen für Filter (Leitstelle + Wache) + Leer für Rest + Reset-Button am Ende
        const leitstelleOptions = [...new Set(group.map(({ building }) => getLeitstelleName(building)))].sort();
        const wacheOptions = [...new Set(group.map(({ building }) => building.caption || '-'))].sort();
        const stufeOptions = [...new Set(
            group
            .filter(({ building }) => {
                const info = getBuildingLevelInfo(building);
                if (!info) return false;
                const type = building.building_type;
                const size = building.small_building ? 'small' : 'normal';
                const key = `${type}_${size}`;
                const levelList = manualLevels[key];
                if (!levelList) return false;

                // Nur Gebäude, die nicht komplett ausgebaut sind
                return info.currentLevel < levelList.length;
            })
            .map(({ building }) => {
                const info = getBuildingLevelInfo(building);
                return info ? info.currentLevel.toString() : null;
            })
            .filter(x => x !== null && x !== '-1')
        )].sort((a, b) => Number(a) - Number(b));


        function createFilterCell(options, placeholder) {
            const th = document.createElement('th');
            th.style.padding = '4px 8px';
            const select = document.createElement('select');
            select.style.width = '100%';
            select.innerHTML = `<option value="">🔽 ${placeholder}</option>`;
            options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                select.appendChild(option);
            });
            th.appendChild(select);
            return { th, select };
        }

        const leitstelleFilter = createFilterCell(leitstelleOptions, 'Leitstellen');
        const wacheFilter = createFilterCell(wacheOptions, 'Wachen');
        const ausbaustufeFilter = createFilterCell(stufeOptions, 'Stufe');

        filterRow.appendChild(leitstelleFilter.th);
        filterRow.appendChild(wacheFilter.th);
        filterRow.appendChild(ausbaustufeFilter.th);
        // --- Neuer globaler "Stufenauswahl löschen" Button ---
        const clearLevelsTh = document.createElement('th');
        clearLevelsTh.style.textAlign = 'center';
        clearLevelsTh.style.padding = '4px 8px';

        const clearLevelsBtn = document.createElement('button');
        clearLevelsBtn.textContent = 'Stufenauswahl löschen';
        clearLevelsBtn.classList.add('btn', 'btn-sm', 'btn-warning');
        clearLevelsBtn.style.padding = '2px 6px';
        clearLevelsBtn.style.fontSize = '0.8em';
        clearLevelsBtn.onclick = () => {
            // Alle Auswahl zurücksetzen
            for (const id in selectedLevels) {
                selectedLevels[id] = null;
            }
            // Alle Buttons zurücksetzen
            tbody.querySelectorAll('tr').forEach(row => {
                const levelChoiceCell = row.children[3];
                if (levelChoiceCell) {
                    levelChoiceCell.querySelectorAll('button').forEach(btn => btn.dataset.active = 'false');
                    updateButtonColors(levelChoiceCell);
                }
                // Bauen-Buttons auf 0 setzen
                const buildingId = Object.keys(selectedLevels)[Array.from(tbody.children).indexOf(row)];
                const buildingData = group.find(g => g.building.id == buildingId);
                if (buildingData) {
                    const levelInfo = getBuildingLevelInfo(buildingData.building);
                    const key = `${buildingData.building.building_type}_${buildingData.building.small_building ? 'small' : 'normal'}`;
                    const levelList = manualLevels[key];
                    updateBuildButtons(buildingData.building, null, row.children[4], row.children[5], levelList, levelInfo.currentLevel);
                }
            });
            updateSelectedAmounts(group, userInfo);
            updateBuildSelectedLevelsButtonState(group);
        };

        clearLevelsTh.appendChild(clearLevelsBtn);
        filterRow.appendChild(clearLevelsTh);
        filterRow.appendChild(document.createElement('th')); // Credits keine Filter

        // Reset Button
        const resetTh = document.createElement('th');
        resetTh.style.textAlign = 'center';
        resetTh.style.padding = '4px 8px';
        const resetBtn = document.createElement('button');
        resetBtn.textContent = 'Filter zurücksetzen';
        resetBtn.classList.add('btn', 'btn-sm', 'btn-primary');
        resetBtn.style.padding = '2px 6px';
        resetBtn.style.fontSize = '0.8em';
        resetBtn.onclick = () => {
            leitstelleFilter.select.selectedIndex = 0;
            wacheFilter.select.selectedIndex = 0;
            ausbaustufeFilter.select.selectedIndex = 0;
            applyFilters();
        };
        resetTh.appendChild(resetBtn);
        filterRow.appendChild(resetTh);

        thead.appendChild(filterRow);

        // --- Filterfunktion ---
        function applyFilters() {
            const selectedLeitstelle = leitstelleFilter.select.value;
            const selectedWache = wacheFilter.select.value;
            const selectedStufe = ausbaustufeFilter.select.value;

            tbody.querySelectorAll('tr').forEach(row => {
                const leitstelleText = row.children[0].textContent;
                const wacheText = row.children[1].textContent;
                const stufeText = row.children[2].textContent;

                const matchLeitstelle = !selectedLeitstelle || leitstelleText === selectedLeitstelle;
                const matchWache = !selectedWache || wacheText === selectedWache;
                const matchStufe = !selectedStufe || stufeText === selectedStufe;

                row.style.display = (matchLeitstelle && matchWache && matchStufe) ? '' : 'none';
            });
        }

        // --- Tabellenzeilen aufbauen (dein Originalcode vereinfacht) ---
        group.forEach(({ building }) => {
            const levelInfo = getBuildingLevelInfo(building);
            if (!levelInfo) return;

            const leitstelleName = getLeitstelleName(building);
            const wache = building.caption || '-';
            const currentLevel = levelInfo.currentLevel;

            const key = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const levelList = manualLevels[key];
            if (!levelList) return;

            const maxLevel = levelList.length;
            if (currentLevel >= maxLevel) return; // schon voll ausgebaut

            selectedLevels[building.id] = null;

            const row = document.createElement('tr');
            row.style.borderBottom = '1px solid #ddd';

            function createCell(text, center = true) {
                const td = document.createElement('td');
                td.style.padding = '8px';
                if (center) td.style.textAlign = 'center';
                td.textContent = text;
                return td;
            }

            const leitstelleCell = createCell(leitstelleName);
            const wacheCell = createCell(wache);
            const currentLevelCell = createCell(currentLevel.toString());

            const levelChoiceCell = document.createElement('td');
            levelChoiceCell.style.padding = '8px';
            levelChoiceCell.style.textAlign = 'center';

            const creditCell = document.createElement('td');
            creditCell.style.textAlign = 'center';
            const coinCell = document.createElement('td');
            coinCell.style.textAlign = 'center';

            row.appendChild(leitstelleCell);
            row.appendChild(wacheCell);
            row.appendChild(currentLevelCell);
            row.appendChild(levelChoiceCell);
            row.appendChild(creditCell);
            row.appendChild(coinCell);

            // Hier kannst du deine updateBuildButtons-Funktion einfügen
            updateBuildButtons(building, null, creditCell, coinCell, levelList, currentLevel);

            // Buttons für Level-Auswahl und Reset (dein bestehender Code)
            levelList.forEach(stufe => {
                if (stufe.id >= currentLevel) {
                    const lvlBtn = document.createElement('button');
                    lvlBtn.textContent = (stufe.id + 1).toString();
                    lvlBtn.className = 'expand_direct';
                    lvlBtn.setAttribute('level', stufe.id.toString());
                    lvlBtn.style.display = 'inline-block';
                    lvlBtn.style.padding = '2px 6px';
                    lvlBtn.style.margin = '0 2px';
                    lvlBtn.style.fontSize = '11px';
                    lvlBtn.style.borderRadius = '12px';
                    lvlBtn.style.border = 'none';
                    lvlBtn.style.cursor = 'pointer';
                    lvlBtn.style.fontWeight = 'bold';
                    lvlBtn.style.transition = 'background-color 0.2s, color 0.2s';
                    lvlBtn.dataset.active = 'false';

                    lvlBtn.addEventListener('mouseenter', () => {
                        if (lvlBtn.dataset.active !== 'true') {
                            lvlBtn.style.backgroundColor = isDarkMode() ? '#666' : '#ccc';
                        }
                    });
                    lvlBtn.addEventListener('mouseleave', () => {
                        if (lvlBtn.dataset.active !== 'true') {
                            updateButtonColors(levelChoiceCell);
                        }
                    });

                    lvlBtn.onclick = () => {
                        let totalCredits = 0;
                        let totalCoins = 0;
                        for (let i = currentLevel; i <= stufe.id; i++) {
                            const s = levelList[i];
                            if (!s) continue;
                            totalCredits += s.cost || 0;
                            totalCoins += s.coins || 0;
                        }

                        const canPayWithCredits = userInfo.credits >= totalCredits && totalCredits > 0;
                        const canPayWithCoins = userInfo.coins >= totalCoins && totalCoins > 0;
                        if (!canPayWithCredits && !canPayWithCoins) {
                            alert('Nicht genug Credits oder Coins für diese Stufe!');
                            return;
                        }

                        levelChoiceCell.querySelectorAll('button').forEach(btn => btn.dataset.active = 'false');
                        lvlBtn.dataset.active = 'true';
                        updateButtonColors(levelChoiceCell);
                        selectedLevels[building.id] = stufe.id;
                        updateBuildButtons(building, stufe.id, creditCell, coinCell, levelList, currentLevel);
                        updateSelectedAmounts(group, userInfo);
                        updateBuildSelectedLevelsButtonState(group);
                    };

                    levelChoiceCell.appendChild(lvlBtn);
                }
            });

            // Reset-Button pro Zeile
            const trashBtn = document.createElement('button');
            trashBtn.innerHTML = '🗑️';
            trashBtn.title = 'Auswahl zurücksetzen';
            trashBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            trashBtn.style.display = 'inline-block';
            trashBtn.style.padding = '2px 6px';
            trashBtn.style.margin = '0 2px';
            trashBtn.style.fontSize = '11px';
            trashBtn.style.borderRadius = '12px';
            trashBtn.style.border = 'none';
            trashBtn.style.cursor = 'pointer';
            trashBtn.style.fontWeight = 'bold';
            trashBtn.onclick = () => {
                selectedLevels[building.id] = null;
                levelChoiceCell.querySelectorAll('button').forEach(btn => btn.dataset.active = 'false');
                updateButtonColors(levelChoiceCell);
                updateBuildButtons(building, null, creditCell, coinCell, levelList, currentLevel);
                updateSelectedAmounts(group, userInfo);
                updateBuildSelectedLevelsButtonState(group);
            };

            levelChoiceCell.appendChild(trashBtn);
            updateButtonColors(levelChoiceCell);

            tbody.appendChild(row);
        });

        // --- Eventlistener auf Filter setzen ---
        leitstelleFilter.select.addEventListener('change', applyFilters);
        wacheFilter.select.addEventListener('change', applyFilters);
        ausbaustufeFilter.select.addEventListener('change', applyFilters);

        return table;
    }

    let currentCredits = 0;
    let currentCoins = 0;

    // Funktion um aktuelle Credtis/Coins in den Header einzufügen
    async function initUserCredits() {
        try {
            const data = await getUserCredits();
            currentCredits = data.credits;
            currentCoins = data.coins;
            // Hier könntest du die Werte auch anzeigen, z.B.:
            document.getElementById('current-credits').textContent = currentCredits.toLocaleString();
            document.getElementById('current-coins').textContent = currentCoins.toLocaleString();
        } catch (e) {
            // Fehlerbehandlung
            alert("Konnte Guthaben nicht laden.");
        }
    }

    // Diese Funktion dann beim Laden der Seite aufrufen
    initUserCredits();

    // Funktion zur Gesamtkostenberechnung
    function updateSelectedAmounts(group, userInfo) {
        if (!Array.isArray(group)) {
            return;
        }

        let totalCredits = 0;
        let totalCoins = 0;

        // Kosten der Erweiterungen und Lager
        document.querySelectorAll('.extension-checkbox:checked, .storage-checkbox:checked').forEach(cb => {
            totalCredits += Number(cb.dataset.creditCost) || 0;
            totalCoins += Number(cb.dataset.coinCost) || 0;
        });

        // Kosten der Level
        group.forEach(({ building }) => {
            const key = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const levelList = manualLevels[key];
            if (!levelList) {
                return;
            }

            const apiLevel = getBuildingLevelInfo(building)?.currentLevel ?? 0;

            // Index des aktuellen Levels suchen anhand des Namens (z.B. "1", "2" ...)
            let currentLevelIndex = levelList.findIndex(l => Number(l.name) === Number(apiLevel));
            // Wenn nicht gefunden → -1 (vor dem ersten Ausbau)
            if (currentLevelIndex === -1) {
                currentLevelIndex = -1;
            }

            const selectedLevelIndex = selectedLevels[building.id] ?? currentLevelIndex;

            // Wenn keine Änderung oder Downgrade, überspringen
            if (selectedLevelIndex <= currentLevelIndex) {
                return;
            }

            // Kosten von nächstem Level bis ausgewähltem Level aufsummieren
            for (let i = currentLevelIndex + 1; i <= selectedLevelIndex; i++) {
                const stufe = levelList[i];
                if (!stufe) continue;
                totalCredits += stufe.cost || 0;
                totalCoins += stufe.coins || 0;
            }
        });

        document.getElementById('selected-credits').textContent = totalCredits.toLocaleString();
        document.getElementById('selected-coins').textContent = totalCoins.toLocaleString();

        const canPayAllWithCredits = userInfo.credits >= totalCredits;
        const canPayAllWithCoins = userInfo.coins >= totalCoins;

        if (!canPayAllWithCredits && !canPayAllWithCoins) {
            alert("Du hast nicht genug Credits ODER Coins für die gesamte Auswahl!");
        }
    }

    // Filterfunktion über Dropdowns
    function filterTableByDropdown(table, columnIndex, filterValue) {
        const tbody = table.querySelector('tbody');
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const cell = row.children[columnIndex];
            const cellText = cell?.textContent.toLowerCase() || '';
            const match = !filterValue || cellText === filterValue.toLowerCase();
            row.style.display = match ? '' : 'none';
        });
    }

    // Funktion zur Filterungen der Tabelleninhalten
    function filterTable(tbody, searchTerm) {
        const rows = tbody.querySelectorAll("tr");

        rows.forEach(row => {
            const leitstelle = row.cells[1]?.textContent.toLowerCase() || "";
            const wachenName = row.cells[2]?.textContent.toLowerCase() || "";
            const erweiterung = row.cells[3]?.textContent.toLowerCase() || "";
            const isBuilt = row.classList.contains("built"); // Prüft, ob bereits gebaut

            if (isBuilt) {
                row.style.display = "none"; // Gebaute Zeilen bleiben unsichtbar
            } else if (leitstelle.includes(searchTerm) || wachenName.includes(searchTerm) || erweiterung.includes(searchTerm)) {
                row.style.display = "";
            } else {
                row.style.display = "none";
            }
        });
    }

    // Funktion zur Unterscheidung der Erweiterungswarteschlange zwischen Premium und Nicht Premium User
    function isExtensionLimitReached(building, extensionId) {
        const fireStationSmallAlwaysAllowed = [1, 2, 10, 11];
        const fireStationSmallLimited = [0, 6, 8, 13, 14, 16, 18, 19, 25];

        const policeStationSmallAlwaysAllowed = [0, 1];
        const policeStationSmallLimited = [10, 11, 12, 13];

        const thwAllExtensions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]; // Alle THW-Erweiterungen
        const bpolAllExtensions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // Alle BPol-Erweiterungen
        const polSonderEinheitAllExtensions = [0, 1, 2, 3, 4]; // Alle PolSondereinheit-Erweiterungen
        const KhAllExtensions = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]; // Alle Krankenhaus-Erweiterungen

        // Falls Premium aktiv ist, gibt es keine Einschränkungen für THW, B-Pol, Schulen und Pol-Sondereinheit
        if (typeof !user_premium !== "undefined" && user_premium) {
            return false; // Keine Einschränkungen für Premium-Nutzer
        }

        // Falls es sich um eine Schule handelt und der Benutzer kein Premium hat
        if (building.building_type === 1 || building.building_type === 3 || building.building_type === 8 || building.building_type === 10 || building.building_type === 27) {
            // Erweiterung 0 und 1 sind immer erlaubt
            if (extensionId === 0 || extensionId === 1) return false;

            // Erweiterung 2 nur erlaubt, wenn Erweiterung 0 bereits gebaut wurde
            if (extensionId === 2) {
                const hasExtension0 = building.extensions.some(ext => ext.type_id === 0);
                if (!hasExtension0) return true; // Blockiere Erweiterung 2, wenn Erweiterung 0 noch nicht gebaut wurde
            }
        }

        if (building.building_type === 0 && building.small_building) {
            // Feuerwache (Kleinwache): Prüfen, ob die Erweiterung limitiert ist
            if (fireStationSmallAlwaysAllowed.includes(extensionId)) return false;
            return building.extensions.some(ext => fireStationSmallLimited.includes(ext.type_id));
        }

        if (building.building_type === 6 && building.small_building) {
            // Polizeiwache (Kleinwache): Prüfen, ob die Erweiterung limitiert ist
            if (policeStationSmallAlwaysAllowed.includes(extensionId)) return false;
            return building.extensions.some(ext => policeStationSmallLimited.includes(ext.type_id));
        }

        if (building.building_type === 4) {
            // Krankenhaus
            const khRequiredFirst = [0, 1];
            const khRestrictedUntilFirstTwo = [2, 3, 4, 5, 6, 7, 8];
            const khAlwaysAllowed = [9];

            if (khAlwaysAllowed.includes(extensionId)) return false;

            const hasRequiredFirstExtensions = khRequiredFirst.every(reqId =>
                                                                     building.extensions.some(ext => ext.type_id === reqId)
                                                                    );

            if (khRestrictedUntilFirstTwo.includes(extensionId) && !hasRequiredFirstExtensions) {
                return true;
            }

            return false;
        }

        if (building.building_type === 9) {
            // THW
            const thwRequiredFirst = [0, 1];
            const thwRestrictedUntilFirstTwo = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 13];
            const thwAlwaysAllowed = [11];

            if (thwAlwaysAllowed.includes(extensionId)) return false;

            const hasRequiredFirstExtensions = thwRequiredFirst.every(reqId =>
                                                                      building.extensions.some(ext => ext.type_id === reqId)
                                                                     );

            if (thwRestrictedUntilFirstTwo.includes(extensionId) && !hasRequiredFirstExtensions) {
                return true;
            }

            return false;
        }

        if (building.building_type === 11) {
            // BPol
            const bpolAlwaysAllowed = [0, 3, 4, 6, 8, 9, 10];
            const bpolConditional = { 1: 0, 2: 1, 5: 4, 7: 8 };

            if (bpolAlwaysAllowed.includes(extensionId)) return false;
            if (bpolConditional[extensionId] !== undefined) {
                return !building.extensions.some(ext => ext.type_id === bpolConditional[extensionId]);
            }

            return false;
        }

        if (building.building_type === 17) {
            // PolSonderEinheit
            const polSonderEinheitAlwaysAllowed = [0, 2, 4];
            const polSonderEinheitConditional = { 1: 0, 3: 1 };

            if (polSonderEinheitAlwaysAllowed.includes(extensionId)) return false;
            if (polSonderEinheitConditional[extensionId] !== undefined) {
                return !building.extensions.some(ext => ext.type_id === polSonderEinheitConditional[extensionId]);
            }

            return false;
        }

        return false;
    }

    // Schließen-Button-Funktionalität
    document.getElementById('close-extension-helper').addEventListener('click', () => {
        const lightbox = document.getElementById('extension-lightbox');
        lightbox.style.display = 'none';

        // Setze die globalen Variablen zurück
        buildingGroups = {};
        buildingsData = [];
    });

    // Initial den Button hinzufügen
    addMenuButton();

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Anfang des Bereichs für den Einzelbau in einem Gebäude

    // Funktion zum Bau einer Erweiterung, eines Lagerraumes
    async function buildExtension(building, extensionId, currency, amount, row) {
        const userInfo = await getUserCredits();

        // Die Erweiterung wird direkt gebaut
        const csrfToken = getCSRFToken();
        const buildUrl = `/buildings/${building.id}/extension/${currency}/${extensionId}`;

        await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: buildUrl,
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                onload: function(response) {
                    // Überprüfen, ob die Zeile existiert
                    if (row) {
                        // Wenn es sich um eine Polizei-Kleinwache handelt und Erweiterungen 10, 11, 12 oder 13 betroffen sind
                        if (building.building_type === 6 && building.small_building && [10, 11, 12, 13].includes(extensionId)) {
                            // Alle Erweiterungen der Polizei-Kleinwache ausblenden, die noch nicht gebaut wurden
                            const allRows = document.querySelectorAll(
                                `.row-${building.id}-10,
                         .row-${building.id}-11,
                         .row-${building.id}-12,
                         .row-${building.id}-13`
                            );
                            allRows.forEach(otherRow => {
                                if (otherRow !== row) {
                                    otherRow.style.display = 'none'; // Alle anderen Zeilen ausblenden
                                }
                            });
                        }

                        // Wenn es sich um eine Feuerwehr-Kleinwache handelt und Erweiterungen 0, 3, 4, 5, 6, 7, 8, 9 oder 12 betroffen sind
                        if (building.building_type === 0 && building.small_building && [0, 6, 8, 13, 14, 16, 18, 19, 25].includes(extensionId)) {
                            // Alle Erweiterungen der Feuerwehr-Kleinwache ausblenden, die noch nicht gebaut wurden
                            const allRows = document.querySelectorAll(
                                `.row-${building.id}-0,
                         .row-${building.id}-6,
                         .row-${building.id}-8,
                         .row-${building.id}-13,
                         .row-${building.id}-14,
                         .row-${building.id}-16,
                         .row-${building.id}-18,
                         .row-${building.id}-19,
                         .row-${building.id}-25`
                            );
                            allRows.forEach(otherRow => {
                                if (otherRow !== row) {
                                    otherRow.style.display = 'none'; // Alle anderen Zeilen ausblenden
                                }
                            });
                        }

                        if (row) {
                            row.classList.add("built"); // Markiert die Zeile als gebaut
                            row.style.display = "none"; // Blendet sie weiterhin aus
                        }

                        row.style.display = 'none'; // Die ausgebaute Zeile wird ausgeblendet
                    }

                    resolve(response);
                },
                onerror: function(error) {
                    console.error(`Fehler beim Bauen der Erweiterung in Gebäude ${building.id}.`, error);
                    reject(error);
                }
            });
        });
    }
    async function buildStorage(building, storageId, currency, cost, row) {
        const csrfToken = getCSRFToken();
        const buildUrl = `https://www.leitstellenspiel.de/buildings/${building.id}/storage_upgrade/${currency}/${storageId}?redirect_building_id=${building.id}`;

        await new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: buildUrl,
                headers: {
                    'X-CSRF-Token': csrfToken,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: '', // kein body nötig
                withCredentials: true, // <-- wichtig
                onload: function(response) {
                    if (response.status >= 200 && response.status < 400) {
                        if (row) {
                            row.classList.add("built");
                            row.style.display = "none";
                        }
                    } else {
                        console.error(`Fehler beim Bau des Lagerraums in Gebäude ${building.id}`, response);
                    }
                    resolve(response);
                },
                onerror: function(error) {
                    console.error(`Netzwerkfehler beim Bau des Lagerraums in Gebäude ${building.id}`, error);
                    reject(error);
                }
            });
        });
    }
    async function buildLevel(buildingId, currency, level) {
        const csrfToken = getCSRFToken();
        const initialUrl = `https://www.leitstellenspiel.de/buildings/${buildingId}/expand_do/${currency}?level=${level}`;

        // Hilfsfunktion: GET-Request per GM_xmlhttpRequest, gibt Promise mit Antwort
        function doGetRequest(url) {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    withCredentials: true,
                    headers: {
                        'X-CSRF-Token': csrfToken,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    onload: (response) => resolve(response),
                    onerror: (error) => reject(error)
                });
            });
        }

        try {
            const response1 = await doGetRequest(initialUrl);

            if (response1.status === 302) {
                // Redirect URL auslesen
                const locationHeader = (response1.responseHeaders.match(/location:\s*(.+)/i) || [])[1];
                if (!locationHeader) throw new Error('Redirect ohne Location-Header');

                const redirectUrl = locationHeader.trim();

                // Zweite Anfrage an Redirect-URL
                const response2 = await doGetRequest(redirectUrl);

                if (response2.status >= 200 && response2.status < 400) {
                    console.info(`Gebäude ${buildingId} auf Stufe ${level} mit ${currency} ausgebaut (nach Redirect).`);
                    // Hier kannst du die UI updaten (z.B. Status in Tabelle, Credits anpassen etc.)
                    return response2;
                } else {
                    throw new Error(`Fehler nach Redirect: Status ${response2.status}`);
                }
            } else if (response1.status >= 200 && response1.status < 400) {
                console.info(`Gebäude ${buildingId} auf Stufe ${level} mit ${currency} ausgebaut.`);
                // UI updaten
                return response1;
            } else {
                throw new Error(`Fehler beim Ausbau: Status ${response1.status}`);
            }
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    fetchBuildingsAndRender();

    // Ende des Bereichs für den Einzelbau in einem Gebäude

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Anfang der Funktion für * Bau von ausgewählten Erweiterungen *

    // Funktion zum Überprüfen der maximalen Erweiterungen für Kleinwachen
    function checkMaxExtensions(buildingId, selectedExtensions) {
        const building = buildingsData.find(b => String(b.id) === String(buildingId));
        if (!building) return false;

        if (building.building_type === 0 && building.small_building) {
            // Feuerwehr Kleinwache: maximal 1 Erweiterung + 2 AB-Stellplätze + 2 Anhänger-Stellplätze
            const maxExtensions = 1;
            const maxABStellplatz = 2;
            const maxAnhStellplatz = 2;

            let extensionCount = 0;
            let abStellplatzCount = 0;
            let anhStellplatzCount = 0;

            selectedExtensions.forEach(extensionId => {
                if ([0, 6, 8, 13, 14, 16, 18, 19, 25].includes(extensionId)) {
                    extensionCount++;
                } else if (extensionId === 1) {
                    abStellplatzCount++;
                } else if (extensionId === 20) {
                    anhStellplatzCount++;
                }
            });

            if (extensionCount > maxExtensions || abStellplatzCount > maxABStellplatz || anhStellplatzCount > maxAnhStellplatz) {
                return false;
            }
        }

        if (building.building_type === 6 && building.small_building) {
            // Polizei Kleinwache: maximal 1 Erweiterung + 2 Zellen
            const maxExtensions = 1;
            const maxZellen = 2;

            let extensionCount = 0;
            let zellenCount = 0;

            selectedExtensions.forEach(extensionId => {
                if ([10, 11, 12, 13].includes(extensionId)) {
                    extensionCount++;
                } else if (extensionId === 0) {
                    zellenCount++;
                }
            });

            if (extensionCount > maxExtensions || zellenCount > maxZellen) {
                return false;
            }
        }

        return true;
    }

    // Hilfsfunktion: ermittelt aktuelle Lagerzustände eines Gebäudes
    function getCurrentStorageState(buildingId) {
        const building = buildingsData.find(b => String(b.id) === String(buildingId));
        if (!building) return [];

        // Bereits gebaute Erweiterungen
        const builtExtensions = building.extensions ? building.extensions.map(e => e.type_id) : [];

        // Bereits gebaute oder im Bau befindliche Lager
        const builtStorages = new Set(
            (building.storage_upgrades || [])
            .filter(s => s.available || storageBuildQueue[buildingId]?.includes(s.type_id))
            .map(s => s.type_id)
        );

        // Lager, die gerade ausgewählt wurden (Queue)
        if (storageBuildQueue[buildingId]) {
            storageBuildQueue[buildingId].forEach(s => builtStorages.add(s));
        }

        return Array.from(new Set([...builtExtensions, ...builtStorages]));
    }

    // Funktion zum Bau der ausgewählten Erweiterungen
    async function buildSelectedExtensions() {
        const selectedExtensions = document.querySelectorAll('.extension-checkbox:checked');
        const selectedStorages = document.querySelectorAll('.storage-checkbox:checked');

        const selectedExtensionsByBuilding = {};
        const selectedStoragesByBuilding = {};

        // Erweiterungen erfassen
        selectedExtensions.forEach(checkbox => {
            const buildingId = checkbox.dataset.buildingId;
            const extensionId = parseInt(checkbox.dataset.extensionId, 10);

            if (!selectedExtensionsByBuilding[buildingId]) {
                selectedExtensionsByBuilding[buildingId] = [];
            }
            selectedExtensionsByBuilding[buildingId].push(extensionId);
        });

        // Lager erfassen
        selectedStorages.forEach(checkbox => {
            const buildingId = checkbox.dataset.buildingId;
            const storageType = checkbox.dataset.storageType;

            if (!selectedStoragesByBuilding[buildingId]) {
                selectedStoragesByBuilding[buildingId] = [];
            }
            selectedStoragesByBuilding[buildingId].push(storageType);
        });

        // Prüfung Lagerreihenfolge unter Berücksichtigung API-Daten
        for (const [buildingId, storageTypes] of Object.entries(selectedStoragesByBuilding)) {
            const building = buildingsData.find(b => String(b.id) === String(buildingId));
            if (!building) continue;

            const buildingTypeKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const storageOrder = manualStorageRooms[buildingTypeKey]?.map(s => s.id) || [];

            // Bereits gebaut + API-Lager
            const builtStorages = new Set(
                (building.storage_upgrades || [])
                .filter(s => !s.available) // nur Lager, die schon gebaut wurden
                .map(s => s.type_id)
            );

            // Lokale Bau-Queue hinzufügen
            if (storageBuildQueue[buildingId]) {
                storageBuildQueue[buildingId].forEach(s => builtStorages.add(s));
            }
            // Temporär die ausgewählten als "im Bau" markieren
            storageTypes.forEach(s => builtStorages.add(s));

            for (let i = 0; i < storageTypes.length; i++) {
                const storageId = storageTypes[i];
                const requiredIndex = storageOrder.indexOf(storageId);
                if (requiredIndex === -1) {
                    continue;
                }

                const missing = storageOrder.slice(0, requiredIndex).some(prevId => !builtStorages.has(prevId));

                if (missing) {
                    showError(`Bitte beachte: Die Lagerräume müssen in der vorgegebenen Reihenfolge gebaut werden.\n\nReihenfolge:\n1. Lagerraum\n2. 1te zusätzlicher Lagerraum\n3. 2te zusätzlicher Lagerraum\n4. 3te zusätzlicher Lagerraum\n5. 4te zusätzlicher Lagerraum\n6. 5te zusätzlicher Lagerraum\n7. 6te zusätzlicher Lagerraum\n8. 7te zusätzlicher Lagerraum`);
                    updateBuildSelectedButton();
                    return;
                }
            }
            //console.log(`✅ Reihenfolge korrekt für Gebäude ${getBuildingCaption(buildingId)}`);
        }

        // Berechne Credits und Coins inkl. API-Lager
        const userInfo = await getUserCredits();
        let totalCredits = 0;
        let totalCoins = 0;

        for (const [buildingId, extensions] of Object.entries(selectedExtensionsByBuilding)) {
            extensions.forEach(extensionId => {
                const row = document.querySelector(`.row-${buildingId}-${extensionId}`);
                if (!row) return;

                const creditElement = row.querySelector('.credit-button');
                const coinElement = row.querySelector('.coins-button');

                if (creditElement) totalCredits += parseInt(creditElement.innerText.replace(/\D/g, '') || '0', 10);
                if (coinElement) totalCoins += parseInt(coinElement.innerText.replace(/\D/g, '') || '0', 10);
            });
        }

        for (const [buildingId, storageTypes] of Object.entries(selectedStoragesByBuilding)) {
            const building = buildingsData.find(b => String(b.id) === String(buildingId));
            if (!building) continue;

            const buildingTypeKey = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const storageDefs = manualStorageRooms[buildingTypeKey];
            if (!storageDefs) continue;

            storageTypes.forEach(storageType => {
                const storageDef = storageDefs.find(s => s.id === storageType);
                if (!storageDef) return;

                totalCredits += storageDef.cost || 0;
                totalCoins += storageDef.coins || 0;
            });
        }

        // Zeige Coin/Credit-Auswahl
        showCurrencySelection(selectedExtensionsByBuilding, userInfo, selectedStoragesByBuilding);

        // Checkboxen zurücksetzen
        setTimeout(() => {
            [...selectedExtensions, ...selectedStorages].forEach(checkbox => checkbox.checked = false);
            document.querySelectorAll('.select-all-checkbox, .select-all-checkbox-lager').forEach(cb => {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            });
            updateBuildSelectedButton();
        }, 100);
    }

    // Funktion um den "Ausgewählte Erweiterungen bauen"-Button zu aktivieren
    function updateBuildSelectedButton() {
        const buttonContainers = document.querySelectorAll('.button-container');

        buttonContainers.forEach(container => {
            const buildSelectedButton = container.querySelector('.build-selected-button');
            if (!buildSelectedButton) return;

            // Nächstes .spoiler-content und .lager-wrapper-Element im DOM
            const spoilerContent = container.nextElementSibling?.classList.contains('spoiler-content')
            ? container.nextElementSibling
            : null;

            const lagerWrapper = spoilerContent?.nextElementSibling?.classList.contains('lager-wrapper')
            ? spoilerContent.nextElementSibling
            : container.nextElementSibling?.classList.contains('lager-wrapper')
            ? container.nextElementSibling
            : null;

            const selectedExtensionCheckboxes = spoilerContent
            ? spoilerContent.querySelectorAll('.extension-checkbox:checked')
            : [];

            const selectedStorageCheckboxes = lagerWrapper
            ? lagerWrapper.querySelectorAll('.storage-checkbox:checked')
            : [];

            const isAnySelected = selectedExtensionCheckboxes.length > 0 || selectedStorageCheckboxes.length > 0;
            buildSelectedButton.disabled = !isAnySelected;
        });
    }

    // Funktion zur Auswahl der Zahlmöglichkeit sowie Prüfung der ausgewählten Erweiterungen
    async function showCurrencySelection(selectedExtensionsByBuilding, userInfo, selectedStoragesByBuilding) {
        const userSettings = await getUserMode();
        const isDarkMode = userSettings && (userSettings.design_mode === 1 || userSettings.design_mode === 4);

        let totalCredits = 0;
        let totalCoins = 0;

        const extensionRows = [];
        const storageRows = [];

        // Erweiterungskosten sammeln
        for (const [buildingId, extensions] of Object.entries(selectedExtensionsByBuilding)) {
            for (const extensionId of extensions) {
                const row = document.querySelector(`.row-${buildingId}-${extensionId}`);
                if (row) {
                    const extensionCost = parseInt(row.querySelector('.credit-button')?.innerText.replace(/\D/g, '') || '0', 10);
                    const extensionCoins = parseInt(row.querySelector('.coins-button')?.innerText.replace(/\D/g, '') || '0', 10);
                    totalCredits += extensionCost;
                    totalCoins += extensionCoins;
                    extensionRows.push({ buildingId, extensionId, extensionCost, extensionCoins, row });
                }
            }
        }

        // Lagerkosten sammeln
        for (const [buildingId, storageTypes] of Object.entries(selectedStoragesByBuilding)) {
            for (const storageType of storageTypes) {
                const row = document.querySelector(`.storage-row-${buildingId}-${storageType}`);
                if (row) {
                    const storageCost = parseInt(row.querySelector('.credit-button')?.innerText.replace(/\D/g, '') || '0', 10);
                    const storageCoins = parseInt(row.querySelector('.coins-button')?.innerText.replace(/\D/g, '') || '0', 10);
                    totalCredits += storageCost;
                    totalCoins += storageCoins;
                    storageRows.push({ buildingId, storageType, storageCost, storageCoins, row });
                }
            }
        }

        const fehlendeCredits = Math.max(0, totalCredits - userInfo.credits);
        const fehlendeCoins = Math.max(0, totalCoins - userInfo.coins);

        if (userInfo.credits < totalCredits && userInfo.coins < totalCoins) {
            alert(`Du hast nicht genug Ressourcen!\n\n- Fehlende Credits: ${formatNumber(fehlendeCredits)}\n- Fehlende Coins: ${formatNumber(fehlendeCoins)}`);
            return;
        }

        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'currency-selection';
        selectionDiv.style.position = 'fixed';
        selectionDiv.style.top = '50%';
        selectionDiv.style.left = '50%';
        selectionDiv.style.transform = 'translate(-50%, -50%)';
        selectionDiv.style.zIndex = '10001';
        selectionDiv.style.background = isDarkMode ? '#333' : '#fff';
        selectionDiv.style.color = isDarkMode ? '#fff' : '#000';
        selectionDiv.style.border = `1px solid ${isDarkMode ? '#444' : '#ccc'}`;
        selectionDiv.style.padding = '20px';
        selectionDiv.style.borderRadius = '8px';
        selectionDiv.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        selectionDiv.style.minWidth = '320px';
        selectionDiv.style.textAlign = 'center';

        const totalText = document.createElement('p');
        totalText.innerHTML = `Wähle zwischen <b style="color:green">Credits (grün)</b> oder <b style="color:red">Coins (rot)</b><br><br>Info:<br>Sollte eine Währung <b>nicht</b> ausreichend vorhanden sein,<br>kannst Du diese nicht auswählen`;
        selectionDiv.appendChild(totalText);

        function showProgress() {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '50%';
            container.style.left = '50%';
            container.style.transform = 'translate(-50%, -50%)';
            container.style.zIndex = '10002';
            container.style.background = isDarkMode ? '#333' : '#fff';
            container.style.padding = '20px';
            container.style.borderRadius = '8px';
            container.style.textAlign = 'center';
            container.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            container.innerHTML = 'Bitte warten...';

            const progressBar = document.createElement('div');
            progressBar.style.height = '10px';
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = '#e0e0e0';
            progressBar.style.marginTop = '10px';
            progressBar.style.borderRadius = '5px';

            const progressFill = document.createElement('div');
            progressFill.style.height = '100%';
            progressFill.style.width = '0%';
            progressFill.style.backgroundColor = '#76c7c0';
            progressFill.style.borderRadius = '5px';
            progressBar.appendChild(progressFill);

            const progressText = document.createElement('p');
            progressText.style.marginTop = '8px';
            progressText.textContent = '0 von 0 Erweiterungen gebaut';

            container.appendChild(progressBar);
            container.appendChild(progressText);

            document.body.appendChild(container);

            return {
                container,
                update: (done, total) => {
                    progressFill.style.width = `${(done / total) * 100}%`;
                    progressText.textContent = `${done} von ${total} Erweiterungen gebaut`;
                },
                close: () => {
                    document.body.removeChild(container);
                }
            };
        }

        const creditsButton = document.createElement('button');
        creditsButton.className = 'currency-button credits-button';
        creditsButton.textContent = `${formatNumber(totalCredits)} Credits`;
        creditsButton.disabled = userInfo.credits < totalCredits;
        creditsButton.style.margin = '5px';
        creditsButton.style.padding = '10px 20px';
        creditsButton.style.backgroundColor = '#28a745';
        creditsButton.style.color = 'white';
        creditsButton.style.border = 'none';
        creditsButton.style.borderRadius = '5px';
        creditsButton.style.cursor = creditsButton.disabled ? 'not-allowed' : 'pointer';

        creditsButton.onclick = async () => {
            const progress = showProgress();
            const totalTasks = extensionRows.length + storageRows.length;
            let done = 0;

            for (const ext of extensionRows) {
                await buildExtension({ id: ext.buildingId }, ext.extensionId, 'credits', ext.extensionCost, ext.row);
                done++;
                progress.update(done, totalTasks);
            }

            for (const store of storageRows) {
                await buildStorage({ id: store.buildingId }, store.storageType, 'credits', store.storageCost, store.row);
                done++;
                progress.update(done, totalTasks);
            }

            progress.close();
            document.body.removeChild(selectionDiv);

            await fetchBuildingsAndRender();
        };

        const coinsButton = document.createElement('button');
        coinsButton.className = 'currency-button coins-button';
        coinsButton.textContent = `${formatNumber(totalCoins)} Coins`;
        coinsButton.disabled = userInfo.coins < totalCoins;
        coinsButton.style.margin = '5px';
        coinsButton.style.padding = '10px 20px';
        coinsButton.style.backgroundColor = '#dc3545';
        coinsButton.style.color = 'white';
        coinsButton.style.border = 'none';
        coinsButton.style.borderRadius = '5px';
        coinsButton.style.cursor = coinsButton.disabled ? 'not-allowed' : 'pointer';

        coinsButton.onclick = async () => {
            const progress = showProgress();
            const totalTasks = extensionRows.length + storageRows.length;
            let done = 0;

            for (const ext of extensionRows) {
                await buildExtension({ id: ext.buildingId }, ext.extensionId, 'coins', ext.extensionCoins, ext.row);
                done++;
                progress.update(done, totalTasks);
            }

            for (const store of storageRows) {
                await buildStorage({ id: store.buildingId }, store.storageType, 'coins', store.storageCoins, store.row);
                done++;
                progress.update(done, totalTasks);
            }

            progress.close();
            document.body.removeChild(selectionDiv);

            await fetchBuildingsAndRender();
        };

        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = 'Abbrechen';
        cancelButton.style.margin = '5px';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.backgroundColor = '#6c757d';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.onclick = () => {
            document.body.removeChild(selectionDiv);
        };

        selectionDiv.appendChild(creditsButton);
        selectionDiv.appendChild(coinsButton);
        selectionDiv.appendChild(cancelButton);

        document.body.appendChild(selectionDiv);
    }

    // Funktiom um eine Fehlermeldung auszugeben
    function showError(message) {
        // Verstecke den Währungscontainer, falls er existiert
        const currencyContainer = document.getElementById('currency-container');
        if (currencyContainer) {
            currencyContainer.style.display = 'none';
        }

        // Fehlercontainer abrufen
        const errorMessageDiv = document.getElementById('error-message');

        if (errorMessageDiv) {
            errorMessageDiv.textContent = message; // Fehlermeldung setzen
            errorMessageDiv.style.display = 'block'; // Sichtbar machen
        } else {
            alert(message); // Falls das Element nicht existiert, nutze ein Alert
            updateBuildSelectedButton();

        }
    }

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('extension-checkbox') || event.target.classList.contains('storage-checkbox')) {
            const cb = event.target;
            const willBeChecked = !cb.checked;

            let totalCredits = 0;
            let totalCoins = 0;

            document.querySelectorAll('.extension-checkbox:checked, .storage-checkbox:checked').forEach(el => {
                totalCredits += Number(el.dataset.creditCost) || 0;
                totalCoins += Number(el.dataset.coinCost) || 0;
            });

            // Wenn Checkbox aktiviert werden soll, addiere deren Werte
            if (willBeChecked) {
                totalCredits += Number(cb.dataset.creditCost) || 0;
                totalCoins += Number(cb.dataset.coinCost) || 0;
            }

            const canPayAllWithCredits = currentCredits >= totalCredits;
            const canPayAllWithCoins = currentCoins >= totalCoins;

            if (!canPayAllWithCredits && !canPayAllWithCoins) {
                alert("Du hast nicht genug Credits ODER Coins für die gesamte Auswahl!");
                event.preventDefault(); // Verhindert das Ändern der Checkbox
            } else {
                // Nach dem Klick die Anzeige aktualisieren
                setTimeout(() => updateSelectedAmounts(), 0);
                updateBuildSelectedButton();
            }
        }
    });

    // Ende der Funktion für * Bau von ausgewählten Erweiterungen *

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Anfang der Funktion für * Bau von ausgewählten Stufen *

    // Funktion zum Bau der ausgewählten Stufen
    async function buildSelectedLevels(group, userInfo) {
        let totalCredits = 0;
        let totalCoins = 0;
        const levelRows = [];

        for (const { building } of group) {
            const level = selectedLevels[building.id];
            if (level === undefined || level === null) continue;

            const key = `${building.building_type}_${building.small_building ? 'small' : 'normal'}`;
            const levelList = manualLevels[key];
            if (!levelList) continue;

            const currentLevel = getBuildingLevelInfo(building)?.currentLevel ?? -1;

            const start = currentLevel === -1 ? 0 : (currentLevel < level ? currentLevel + 1 : level + 1);
            const end = currentLevel === -1 ? level : (currentLevel < level ? level : currentLevel);

            let buildingCredits = 0;
            let buildingCoins = 0;

            for (let i = start; i <= end; i++) {
                const stufe = levelList[i];
                if (!stufe) continue;
                buildingCredits += stufe.cost || 0;
                buildingCoins += stufe.coins || 0;
            }

            if (buildingCredits === 0 && buildingCoins === 0) continue;

            totalCredits += buildingCredits;
            totalCoins += buildingCoins;

            // Speichern wie bei extensionRows in showCurrencySelection
            levelRows.push({
                buildingId: building.id,
                targetLevel: level,
                buildingCredits,
                buildingCoins
            });
        }

        if (levelRows.length === 0) {
            alert("Keine Leveländerungen ausgewählt.");
            return;
        }

        // Jetzt einfach dein vorhandenes Fenster nutzen, aber angepasst für Level-Bau
        await showCurrencySelectionForLevels(levelRows, userInfo, totalCredits, totalCoins);
    }

    // Funktion um den Ausgewählte Stufen Button zu aktivieren
    function updateBuildSelectedLevelsButtonState(group) {
        if (!group.length) {
            console.warn('⚠️ Gruppe ist leer');
            return;
        }

        // Wachtentyp-Schlüssel bestimmen (z. B. "6_small")
        const typeKey = `${group[0].building.building_type}_${group[0].building.small_building ? 'small' : 'normal'}`;

        // Nur den passenden Button-Container suchen
        const container = document.querySelector(`.button-container[data-building-type="${typeKey}"]`);
        if (!container) {
            console.warn(`⚠️ Kein Button-Container für Typ ${typeKey} gefunden`);
            return;
        }

        const buildSelectedLevelsButton = container.querySelector('.build-selected-levels-button');
        if (!buildSelectedLevelsButton) {
            console.warn(`⚠️ Build-Selected-Level-Button für Typ ${typeKey} nicht gefunden`);
            return;
        }

        // Prüfen, ob mindestens ein Gebäude in dieser Gruppe eine passende Auswahl hat
        let hasSelectedLevels = false;

        for (const { building } of group) {
            const currentLevel = getBuildingLevelInfo(building)?.currentLevel ?? -1;
            const selectedLevel = selectedLevels[building.id] ?? null;

            if (selectedLevel !== null && selectedLevel >= currentLevel) {
                hasSelectedLevels = true;
                break;
            }
        }

        buildSelectedLevelsButton.disabled = !hasSelectedLevels;
    }

    // Auswahlfenster für Level-Ausbau
    async function showCurrencySelectionForLevels(levelRows, userInfo, totalCredits, totalCoins) {
        const userSettings = await getUserMode();
        const isDarkMode = userSettings && (userSettings.design_mode === 1 || userSettings.design_mode === 4);

        const fehlendeCredits = Math.max(0, totalCredits - userInfo.credits);
        const fehlendeCoins = Math.max(0, totalCoins - userInfo.coins);

        if (userInfo.credits < totalCredits && userInfo.coins < totalCoins) {
            alert(`Du hast nicht genug Ressourcen!\n\n- Fehlende Credits: ${formatNumber(fehlendeCredits)}\n- Fehlende Coins: ${formatNumber(fehlendeCoins)}`);
            return;
        }

        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'currency-selection';
        selectionDiv.style.position = 'fixed';
        selectionDiv.style.top = '50%';
        selectionDiv.style.left = '50%';
        selectionDiv.style.transform = 'translate(-50%, -50%)';
        selectionDiv.style.zIndex = '10001';
        selectionDiv.style.background = isDarkMode ? '#333' : '#fff';
        selectionDiv.style.color = isDarkMode ? '#fff' : '#000';
        selectionDiv.style.border = `1px solid ${isDarkMode ? '#444' : '#ccc'}`;
        selectionDiv.style.padding = '20px';
        selectionDiv.style.borderRadius = '8px';
        selectionDiv.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
        selectionDiv.style.minWidth = '320px';
        selectionDiv.style.textAlign = 'center';

        const totalText = document.createElement('p');
        totalText.innerHTML = `Wähle zwischen <b style="color:green">Credits (grün)</b> oder <b style="color:red">Coins (rot)</b><br><br>Info:<br>Sollte eine Währung <b>nicht</b> ausreichend vorhanden sein,<br>kannst Du diese nicht auswählen`;
        selectionDiv.appendChild(totalText);

        // Fortschrittsanzeige
        function showProgress() {
            const container = document.createElement('div');
            container.style.position = 'fixed';
            container.style.top = '50%';
            container.style.left = '50%';
            container.style.transform = 'translate(-50%, -50%)';
            container.style.zIndex = '10002';
            container.style.background = isDarkMode ? '#333' : '#fff';
            container.style.padding = '20px';
            container.style.borderRadius = '8px';
            container.style.textAlign = 'center';
            container.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
            container.innerHTML = 'Bitte warten...';

            const progressBar = document.createElement('div');
            progressBar.style.height = '10px';
            progressBar.style.width = '100%';
            progressBar.style.backgroundColor = '#e0e0e0';
            progressBar.style.marginTop = '10px';
            progressBar.style.borderRadius = '5px';

            const progressFill = document.createElement('div');
            progressFill.style.height = '100%';
            progressFill.style.width = '0%';
            progressFill.style.backgroundColor = '#76c7c0';
            progressFill.style.borderRadius = '5px';
            progressBar.appendChild(progressFill);

            const progressText = document.createElement('p');
            progressText.style.marginTop = '8px';
            progressText.textContent = '0 von 0 Gebäude gebaut';

            container.appendChild(progressBar);
            container.appendChild(progressText);

            document.body.appendChild(container);

            return {
                container,
                update: (done, total) => {
                    progressFill.style.width = `${(done / total) * 100}%`;
                    progressText.textContent = `${done} von ${total} Gebäude gebaut`;
                },
                close: () => {
                    document.body.removeChild(container);
                }
            };
        }

        // Credits-Button
        const creditsButton = document.createElement('button');
        creditsButton.className = 'currency-button credits-button';
        creditsButton.textContent = `${formatNumber(totalCredits)} Credits`;
        creditsButton.disabled = userInfo.credits < totalCredits;
        creditsButton.style.margin = '5px';
        creditsButton.style.padding = '10px 20px';
        creditsButton.style.backgroundColor = '#28a745';
        creditsButton.style.color = 'white';
        creditsButton.style.border = 'none';
        creditsButton.style.borderRadius = '5px';
        creditsButton.style.cursor = creditsButton.disabled ? 'not-allowed' : 'pointer';

        creditsButton.onclick = async () => {
            const progress = showProgress();
            let done = 0;
            const totalTasks = levelRows.length;

            for (const lvl of levelRows) {
                await buildLevel(lvl.buildingId, 'credits', lvl.targetLevel);
                userInfo.credits -= lvl.buildingCredits;
                done++;
                progress.update(done, totalTasks);
            }

            progress.close();
            document.body.removeChild(selectionDiv);
        };

        // Coins-Button
        const coinsButton = document.createElement('button');
        coinsButton.className = 'currency-button coins-button';
        coinsButton.textContent = `${formatNumber(totalCoins)} Coins`;
        coinsButton.disabled = userInfo.coins < totalCoins;
        coinsButton.style.margin = '5px';
        coinsButton.style.padding = '10px 20px';
        coinsButton.style.backgroundColor = '#dc3545';
        coinsButton.style.color = 'white';
        coinsButton.style.border = 'none';
        coinsButton.style.borderRadius = '5px';
        coinsButton.style.cursor = coinsButton.disabled ? 'not-allowed' : 'pointer';

        coinsButton.onclick = async () => {
            const progress = showProgress();
            let done = 0;
            const totalTasks = levelRows.length;

            for (const lvl of levelRows) {
                await buildLevel(lvl.buildingId, 'coins', lvl.targetLevel);
                userInfo.coins -= lvl.buildingCoins;
                done++;
                progress.update(done, totalTasks);
            }

            progress.close();
            document.body.removeChild(selectionDiv);
        };

        // Abbrechen-Button
        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = 'Abbrechen';
        cancelButton.style.margin = '5px';
        cancelButton.style.padding = '10px 20px';
        cancelButton.style.backgroundColor = '#6c757d';
        cancelButton.style.color = 'white';
        cancelButton.style.border = 'none';
        cancelButton.style.borderRadius = '5px';
        cancelButton.style.cursor = 'pointer';
        cancelButton.onclick = () => {
            document.body.removeChild(selectionDiv);
        };

        selectionDiv.appendChild(creditsButton);
        selectionDiv.appendChild(coinsButton);
        selectionDiv.appendChild(cancelButton);

        document.body.appendChild(selectionDiv);
    }

    // Ende der Funktion für * Bau von ausgewählten Stufen *

    // ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // Anfang der Funktion * Alle Erweiterungen * in einem Gebäude bauen

    // Funktion zur Auswahl der Währung und Prüfung der Credit/Coins vorhandenheit
    async function showCurrencySelectionForAll(groupKey) {
        const userSettings = await getUserMode();
        const isDarkMode = userSettings && (userSettings.design_mode === 1 || userSettings.design_mode === 4);

        const wachenGroup = buildingGroups[groupKey] || [];
        const lagerGroup = storageGroups[groupKey] || [];
        const combinedGroup = [...wachenGroup, ...lagerGroup];

        if (combinedGroup.length === 0) {
            console.error(`Keine Erweiterungen für Gruppen-Key: ${groupKey}`);
            return;
        }

        let totalCredits = 0;
        let totalCoins = 0;

        combinedGroup.forEach(({ missingExtensions }) => {
            missingExtensions.forEach(extension => {
                totalCredits += extension.cost;
                totalCoins += extension.coins;
            });
        });

        const userInfo = await getUserCredits();
        const fehlendeCredits = Math.max(0, totalCredits - userInfo.credits);
        const fehlendeCoins = Math.max(0, totalCoins - userInfo.coins);

        if (userInfo.credits < totalCredits && userInfo.coins < totalCoins) {
            alert(`Du hast nicht genug Ressourcen!\n\n- Fehlende Credits: ${formatNumber(fehlendeCredits)}\n- Fehlende Coins: ${formatNumber(fehlendeCoins)}`);
            return;
        }

        const selectionDiv = document.createElement('div');
        selectionDiv.className = 'currency-selection';
        selectionDiv.style.background = isDarkMode ? '#333' : '#fff';
        selectionDiv.style.color = isDarkMode ? '#fff' : '#000';
        selectionDiv.style.borderColor = isDarkMode ? '#444' : '#ccc';

        const totalText = document.createElement('p');
        totalText.innerHTML = `Wähle zwischen <b>Credits (grün)</b> oder <b>Coins (rot)</b><br><br>Info:<br>Sollte eine Währung <b>nicht</b> ausreichend vorhanden sein,<br>kannst Du diese nicht auswählen`;
        selectionDiv.appendChild(totalText);

        const creditsButton = document.createElement('button');
        creditsButton.className = 'currency-button credits-button';
        creditsButton.textContent = `${formatNumber(totalCredits)} Credits`;
        creditsButton.disabled = userInfo.credits < totalCredits;
        creditsButton.onclick = async () => {
            document.body.removeChild(selectionDiv);
            await buildAllExtensionsWithPause(groupKey, 'credits');
        };

        const coinsButton = document.createElement('button');
        coinsButton.className = 'currency-button coins-button';
        coinsButton.textContent = `${formatNumber(totalCoins)} Coins`;
        coinsButton.disabled = userInfo.coins < totalCoins;
        coinsButton.onclick = async () => {
            document.body.removeChild(selectionDiv);
            await buildAllExtensionsWithPause(groupKey, 'coins');
        };

        const cancelButton = document.createElement('button');
        cancelButton.className = 'cancel-button';
        cancelButton.textContent = 'Abbrechen';
        cancelButton.onclick = () => {
            document.body.removeChild(selectionDiv);
        };

        selectionDiv.appendChild(creditsButton);
        selectionDiv.appendChild(coinsButton);
        selectionDiv.appendChild(cancelButton);

        document.body.appendChild(selectionDiv);
    }

    // Funktion um die Gesamtkosten zu errechnen
    async function calculateAndBuildAllExtensions(groupKey, currency) {
        const wachenGroup = buildingGroups[groupKey] || [];
        const lagerGroup = storageGroups[groupKey] || [];
        const combinedGroup = [...wachenGroup, ...lagerGroup];

        const totalExtensions = combinedGroup.reduce((sum, { missingExtensions }) => sum + missingExtensions.length, 0);
        const totalCost = combinedGroup.reduce((sum, { missingExtensions }) => {
            return sum + missingExtensions.reduce((extSum, extension) => extSum + extension[currency], 0);
        }, 0);

        try {
            const userInfo = await getUserCredits();
            if ((currency === 'credits' && userInfo.credits < totalCost) || (currency === 'coins' && userInfo.coins < totalCost)) {
                alert(`Nicht genügend ${currency === 'credits' ? 'Credits' : 'Coins'}. Der Bauversuch wird abgebrochen.`);
                return;
            }

            const { progressContainer, progressText, progressFill } = await createProgressBar(totalExtensions);
            let builtCount = 0;

            for (const { building, missingExtensions } of combinedGroup) {
                for (const extension of missingExtensions) {
                    if (!isExtensionLimitReached(building, extension.id)) {
                        const isStorage = extension.isStorage === true;

                        if (isStorage) {
                            await buildStorage(building, extension.id, currency, extension[currency]);
                        } else {
                            await buildExtension(building, extension.id, currency, extension[currency]);
                        }

                        builtCount++;
                        updateProgress(builtCount, totalExtensions, progressText, progressFill);
                    }
                }
            }

            removeProgressBar(progressContainer);

            // Tabelle aktualisieren
            renderMissingExtensions(buildingsData);
        } catch (error) {
            console.error('Fehler beim Abrufen der Credits und Coins:', error);
            alert('Fehler beim Abrufen der Credits und Coins.');
        }
    }

    // Funktion zur Erstellung der Fortschrittsanzeige
    async function createProgressBar(totalExtensions) {
        const userSettings = await getUserMode();
        const isDarkMode = userSettings && (userSettings.design_mode === 1 || userSettings.design_mode === 4);

        const progressContainer = document.createElement('div');
        progressContainer.className = 'progress-container';
        progressContainer.style.position = 'fixed';
        progressContainer.style.top = '50%';
        progressContainer.style.left = '50%';
        progressContainer.style.transform = 'translate(-50%, -50%)';
        progressContainer.style.padding = '20px';
        progressContainer.style.border = '1px solid #ccc';
        progressContainer.style.borderRadius = '10px';
        progressContainer.style.boxShadow = '0px 0px 10px rgba(0,0,0,0.2)';
        progressContainer.style.width = '300px';
        progressContainer.style.textAlign = 'center';
        progressContainer.style.zIndex = '10002'; // Sicherstellen, dass der Fortschrittsbalken oben bleibt

        // Set background color based on mode
        progressContainer.style.background = isDarkMode ? '#333' : '#fff';
        progressContainer.style.color = isDarkMode ? '#fff' : '#000';

        const progressText = document.createElement('p');
        progressText.textContent = `0 / ${totalExtensions} Erweiterungen gebaut`;
        progressText.style.fontWeight = 'bold'; // Fettschrift für bessere Lesbarkeit
        progressText.style.fontSize = '16px'; // Größere Schrift für bessere Sichtbarkeit

        const progressBar = document.createElement('div');
        progressBar.style.width = '100%';
        progressBar.style.background = isDarkMode ? '#555' : '#ddd';  // Hintergrund für die Progressbar
        progressBar.style.borderRadius = '5px';
        progressBar.style.marginTop = '10px';
        progressBar.style.overflow = 'hidden'; // Hinzugefügt um sicherzustellen, dass der Fortschrittsbalken den Container nicht verlässt

        const progressFill = document.createElement('div');
        progressFill.style.width = '0%';
        progressFill.style.height = '20px';
        progressFill.style.background = '#4caf50';
        progressFill.style.borderRadius = '5px';

        progressBar.appendChild(progressFill);
        progressContainer.appendChild(progressText);
        progressContainer.appendChild(progressBar);
        document.body.appendChild(progressContainer);

        return { progressContainer, progressText, progressFill };
    }

    // Funktion zur Aktualisierung des Fortschritts
    function updateProgress(builtCount, totalExtensions, progressText, progressFill) {
        progressText.textContent = `${builtCount} / ${totalExtensions} Erweiterungen gebaut`;
        progressFill.style.width = Math.min(100, (builtCount / totalExtensions) * 100) + '%'; // Math.min hinzugefügt, um sicherzustellen, dass die Breite nicht 100% überschreitet
    }

    // Funktion zum Entfernen der Fortschrittsanzeige mit 500ms Verzögerung
    function removeProgressBar(progressContainer) {
        setTimeout(() => {
            document.body.removeChild(progressContainer);
        }, 500); // 500ms Pause bevor die Fortschrittsanzeige entfernt wird
    }

    // Funktion um einfach alles zu bauen was man eingestellt hat
    async function buildAllExtensionsWithPause(groupKey, currency) {
        const wachenGroup = buildingGroups[groupKey] || [];
        const lagerGroup = storageGroups[groupKey] || [];
        const combinedGroup = [...wachenGroup, ...lagerGroup];

        let totalExtensions = combinedGroup.reduce((sum, { missingExtensions }) => sum + missingExtensions.length, 0);
        let builtCount = 0;

        const { progressContainer, progressText, progressFill } = await createProgressBar(totalExtensions);

        for (const { building, missingExtensions } of combinedGroup) {
            for (const extension of missingExtensions) {
                if (!isExtensionLimitReached(building, extension.id)) {
                    const isStorage = extension.isStorage === true;

                    const row = document.querySelector(
                        isStorage
                        ? `.storage-row-${building.id}-${extension.id}`
                        : `.row-${building.id}-${extension.id}`
                    );

                    if (isStorage) {
                        await buildStorage(building, extension.id, currency, extension[currency], row);
                    } else {
                        await buildExtensionWithPause(building, extension.id, currency, extension[currency], row);
                    }

                    await new Promise(resolve => setTimeout(resolve, 500));
                    builtCount++;
                    updateProgress(builtCount, totalExtensions, progressText, progressFill);
                }
            }
        }

        removeProgressBar(progressContainer);
    }

})();
