import { categoriesWords } from "./database.js";
import { categoriesQuestions } from "./database.js";
import { translations } from "./database.js";

// --- CATEGORY STATE MANAGEMENT ---
// We now store categories separately for each mode
var activeCatsWords = [];
var activeCatsQuestions = [];

var tabOpen = false;
var currentLang = "en";
var busy = false;
var isLoading = false;

// --- SETTINGS VARIABLES ---
var rngImpCount = false;
var showCatVal = false;

function setLanguage(lang) {
    currentLang = lang;
    document.body.classList.remove('lang-en', 'lang-gr');
    document.body.classList.add('lang-' + lang);

    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    const inputs = document.querySelectorAll('.m-p-p-c-name');
    inputs.forEach(input => {
        input.placeholder = translations[lang]["placeholder_name"];
    });

    const images = document.querySelectorAll('[data-lang-alt]');
    images.forEach(img => {
        const key = img.getAttribute('data-lang-alt');
        if (translations[lang][key]) {
            img.alt = translations[lang][key];
        }
    });

    localStorage.setItem('impostorLang', lang);
}

function toggleLanguage() {
    if (currentLang === "en") {
        setLanguage("gr");
    } else {
        setLanguage("en");
    }
    fillCats();
}

function openPlayersTab() {
    var tab = document.querySelector('#main-page-players-box');
    if (!tab.classList.contains('active') && tabOpen == false) {
        tab.classList.add('active');
        tabOpen = true;
    }
}

function closePlayersTab() {
    var tab = document.querySelector('#main-page-players-box');
    if (tab.classList.contains('active')) {
        tab.classList.remove('active');
        tabOpen = false;
    }
    // Force a save when closing the tab to ensure players are stored
    saveGameData();
}

var playerCount = 0;
var players = [];
var selectedGameMode = 'Words';

function makePlayerCard(savedName = "") {
    const div1 = document.createElement(`div`);
    div1.classList.add('main-page-player-card');

    const div2 = document.createElement(`div`);
    div2.classList.add('m-p-p-c-div');
    div1.appendChild(div2);

    const div3 = document.createElement(`div`);
    div3.classList.add('m-p-p-c-num', 'non-sel');
    div3.textContent = ++playerCount;
    div2.appendChild(div3);

    const input = document.createElement(`input`);
    input.type = 'text';
    input.placeholder = translations[currentLang]["placeholder_name"];
    input.classList.add('m-p-p-c-name');
    if (savedName) {
        input.value = savedName;
    }
    // Add listener to save when name changes
    input.addEventListener('change', saveGameData);
    div2.appendChild(input);

    const div4 = document.createElement(`div`);
    div4.classList.add('m-p-p-c-del', 'non-sel');
    div4.textContent = 'X';
    div4.onclick = function () {
        removePlayerCard(div1);
    }
    div1.appendChild(div4);

    var box = document.querySelector("#m-p-p-c-cards-box");
    box.appendChild(div1);

    if (playerCount == 20) {
        var button = document.querySelector('#m-p-p-c-plus');
        if (button.classList.contains('active')) {
            button.classList.remove('active');
            button.onclick = '';
            button.style.cursor = "not-allowed";
        }
    }
}

function removePlayerCard(div) {
    if (playerCount > 3) {
        div.remove();
        // Update numbers immediately
        updatePlayerCardNums();
        // Trigger save immediately to prevent desync
        saveGameData();
    }

    if (playerCount < 10) {
        var button = document.querySelector('#m-p-p-c-plus');
        if (!button.classList.contains('active')) {
            button.classList.add('active');
            button.style.cursor = "pointer";
            button.onclick = function () {
                makePlayerCard();
                saveGameData(); // Save after adding
            };
        }
    }
}

function updatePlayerCardNums() {
    const nums = document.getElementsByClassName('m-p-p-c-num');
    Array.from(nums).forEach((num, index) => {
        num.textContent = index + 1;
    });
    playerCount = nums.length;
}

// Helper to sync the 'players' variable with the DOM inputs
function getPlayers() {
    var box = document.querySelector("#m-p-p-c-cards-box");
    var playerCards = box.children;
    players = [];
    Array.from(playerCards).forEach((card, index) => {
        var nameInput = card.querySelector(".m-p-p-c-name");
        var name = nameInput ? nameInput.value : "";
        if (name.trim().length === 0) {
            players.push(`Player ` + (index + 1));
        } else {
            players.push(name);
        }
    });
}

function getImpostorsNumber(input) {
    var count = input.value;
    if (count < 1) {
        input.value = 0;
    }
    if (count >= playerCount) {
        input.value = playerCount;
    }
    saveGameData();
}

function toggleGameMode() {
    var gameModes = document.getElementsByClassName('game-mode');
    Array.from(gameModes).forEach((gameMode, index) => {
        gameMode.classList.toggle('active');
        if (gameMode.classList.contains('active')) {
            selectedGameMode = gameMode.id;
        }
    });

    fillCats();

    // --- UPDATED SETTINGS LOGIC ---
    var catSettingBtn = document.getElementById('category-setting');

    // Disable "Show Category" button if in Questions mode
    if (selectedGameMode === "Questions") {
        catSettingBtn.classList.add('hidden');
    } else {
        catSettingBtn.classList.remove('hidden');
    }

    saveGameData();
}

function toggleCat(divCat) {
    let targetArray;
    if (selectedGameMode === "Words") {
        targetArray = activeCatsWords;
    } else {
        targetArray = activeCatsQuestions;
    }

    // Fix: Check the specific array length, not a generic 'cats' array
    if (!isLoading && divCat.classList.contains('active') && targetArray.length == 1) return;

    let myCatsDB;
    if (selectedGameMode === "Words") {
        myCatsDB = categoriesWords;
    } else {
        myCatsDB = categoriesQuestions;
    }

    const catObj = myCatsDB.find(c => c.id === divCat.id);

    // Toggle Visuals
    divCat.classList.toggle('active');

    // Toggle Data
    if (divCat.classList.contains('active')) {
        if (!targetArray.includes(catObj.id)) {
            targetArray.push(catObj.id);
        }
    } else {
        if (targetArray.includes(catObj.id)) {
            // Re-assign to filter out the ID
            if (selectedGameMode === "Words") {
                activeCatsWords = activeCatsWords.filter(c => c !== catObj.id);
            } else {
                activeCatsQuestions = activeCatsQuestions.filter(c => c !== catObj.id);
            }
        }
    }

    saveGameData();
}

function fillCats() {
    var box = document.querySelector('#m-p-c-c-cards-box');
    box.innerHTML = '';

    let myCatsDB;
    let activeArray;

    if (selectedGameMode === "Words") {
        myCatsDB = categoriesWords;
        activeArray = activeCatsWords;
    } else {
        myCatsDB = categoriesQuestions;
        activeArray = activeCatsQuestions;
    }

    myCatsDB.forEach((cat) => {
        makeCat(cat, activeArray);
    });
}

function makeCat(cat, activeArray) {
    const div1 = document.createElement(`div`);
    div1.classList.add("cat", 'non-sel');
    div1.id = cat.id;

    // Set active state based on the memory array
    if (activeArray.includes(cat.id)) {
        div1.classList.add('active');
    }

    div1.onclick = function () {
        toggleCat(this);
    };

    const img = document.createElement(`img`);
    img.classList.add("cat-img");
    img.alt = translations[currentLang][cat.id] || cat.id;
    img.src = cat.img;
    img.draggable = false;
    div1.appendChild(img);

    const div2 = document.createElement(`div`);
    div2.classList.add("cat-title");
    div2.textContent = translations[currentLang][cat.id]
    div1.appendChild(div2);

    var box = document.querySelector("#m-p-c-c-cards-box");
    box.appendChild(div1);
}

function openCatsTab() {
    var tab = document.querySelector('#main-page-cats-box');
    if (!tab.classList.contains('active') && tabOpen == false) {
        tab.classList.add('active');
        tabOpen = true;
    }
}

function closeCatsTab() {
    var tab = document.querySelector('#main-page-cats-box');
    if (tab.classList.contains('active')) {
        tab.classList.remove('active');
        tabOpen = false;
    }
}

// --- SAVE FUNCTION ---
function saveGameData() {
    if (isLoading) return;

    var impInput = document.querySelector('#impostors-count-box input');
    var impCount = impInput ? impInput.value : 1;

    // FIX: Always sync players from DOM before saving to avoid data loss
    getPlayers();

    var data = {
        players: players,
        mode: selectedGameMode,
        // Save BOTH arrays
        activeCatsWords: activeCatsWords,
        activeCatsQuestions: activeCatsQuestions,
        impostors: impCount,
        settings: {
            rngImpostors: rngImpCount,
            showCat: showCatVal
        }
    };

    localStorage.setItem('impostorSaveData', JSON.stringify(data));
}

// --- LOAD FUNCTION ---
function loadGameData() {
    isLoading = true;

    var savedLang = localStorage.getItem('impostorLang');
    if (savedLang) {
        setLanguage(savedLang);
    } else {
        setLanguage("en");
    }

    var savedJSON = localStorage.getItem('impostorSaveData');

    if (savedJSON) {
        var data = JSON.parse(savedJSON);

        // A. Restore Game Mode
        if (data.mode) {
            selectedGameMode = data.mode;
            document.querySelectorAll('.game-mode').forEach(el => {
                el.classList.remove('active');
                if (el.id === selectedGameMode) el.classList.add('active');
            });
        }

        // B. Restore Settings
        if (data.settings) {
            if (data.settings.rngImpostors) {
                var rngBtn = document.getElementById('random-imp-setting');
                if (rngBtn && !rngBtn.classList.contains('active')) {
                    toggleRNGSetting(rngBtn);
                }
            } else {
                if (data.impostors) {
                    var impInput = document.querySelector('#impostors-count-box input');
                    if (impInput) impInput.value = data.impostors;
                }
            }

            if (data.settings.showCat) {
                var catBtn = document.getElementById('category-setting');
                if (catBtn && !catBtn.classList.contains('active')) {
                    toggleCatSetting(catBtn);
                }
            }
        }

        var catSettingBtn = document.getElementById('category-setting');

        // Disable "Show Category" button if in Questions mode
        if (selectedGameMode === "Questions") {
            catSettingBtn.classList.add('hidden');
        } else {
            catSettingBtn.classList.remove('hidden');
        }

        // C. Restore Categories (Legacy Support)
        if (data.activeCatsWords) activeCatsWords = data.activeCatsWords;
        if (data.activeCatsQuestions) activeCatsQuestions = data.activeCatsQuestions;

        // Migration: If user has old 'activeCats' but no new arrays, use that for Words
        if (data.activeCats && (!data.activeCatsWords || data.activeCatsWords.length === 0)) {
            activeCatsWords = data.activeCats;
        }

        // Defaults if empty
        if (activeCatsWords.length === 0) activeCatsWords = ["Animals"];
        if (activeCatsQuestions.length === 0) activeCatsQuestions = ["Social"];

        // Now draw the cats
        fillCats();

        // D. Restore Players
        if (data.players && data.players.length > 0) {
            players = data.players;
            data.players.forEach(name => {
                makePlayerCard(name);
            });
        } else {
            makePlayerCard(); makePlayerCard(); makePlayerCard();
            getPlayers();
        }

    }
    // First time loading (No Save Data)
    else {
        makePlayerCard();
        makePlayerCard();
        makePlayerCard();
        getPlayers();

        // Set defaults
        activeCatsWords = ["Animals"];
        activeCatsQuestions = ["Social"];

        fillCats();

        isLoading = false;
        saveGameData();
        return;
    }

    isLoading = false;
}

function toggleCatSetting(box) {
    // Prevent toggling if disabled
    if (box.classList.contains('disabled')) return;

    if (!box.classList.contains('active')) {
        box.classList.add('active');
        showCatVal = true;
    } else {
        box.classList.remove('active');
        showCatVal = false;
    }
    saveGameData();
}

function toggleRNGSetting(box) {
    if (!box.classList.contains('active')) {
        box.classList.add('active');
        rngImpCount = true;
        toggleImpCount(false);
    } else {
        box.classList.remove('active');
        rngImpCount = false;
        toggleImpCount(true);
    }

    saveGameData();
}

function toggleImpCount(enabled) {
    let box = document.getElementById('impostors-count-box');
    let input = document.querySelector('#impostors-count-box>input');

    if (enabled) {
        if (box.classList.contains('disabled')) box.classList.remove('disabled');
        input.disabled = false;
    } else {
        if (!box.classList.contains('disabled')) box.classList.add('disabled');
        input.disabled = true;
    }
}

function start() {
    window.location.href = "game.html";
}

loadGameData();

window.toggleCat = toggleCat;
window.openPlayersTab = openPlayersTab;
window.closePlayersTab = closePlayersTab;
window.makePlayerCard = makePlayerCard;
window.getImpostorsNumber = getImpostorsNumber;
window.toggleGameMode = toggleGameMode;
window.openCatsTab = openCatsTab;
window.closeCatsTab = closeCatsTab;
window.start = start;
window.toggleLanguage = toggleLanguage;
window.toggleCatSetting = toggleCatSetting;
window.toggleRNGSetting = toggleRNGSetting;
