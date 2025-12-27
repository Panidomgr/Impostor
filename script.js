import { categoriesWords } from "./database.js";
import { categoriesQuestions } from "./database.js";
import { translations } from "./database.js";
var cats = [];

var tabOpen = false;

var currentLang = "en"; // Default



function setLanguage(lang) {
    // 1. Update Variable & Body Class...
    currentLang = lang;
    document.body.classList.remove('lang-en', 'lang-gr');
    document.body.classList.add('lang-' + lang);

    // 2. Update Text Content...
    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // 3. Update Placeholders...
    const inputs = document.querySelectorAll('.m-p-p-c-name');
    inputs.forEach(input => {
        input.placeholder = translations[lang]["placeholder_name"];
    });

    // --- 4. NEW: Update Image Alts ---
    const images = document.querySelectorAll('[data-lang-alt]');
    images.forEach(img => {
        const key = img.getAttribute('data-lang-alt');
        if (translations[lang][key]) {
            img.alt = translations[lang][key];
        }
    });
    // ---------------------------------

    // 5. Save to LocalStorage...
    localStorage.setItem('impostorLang', lang);
}

function toggleLanguage() {
    if (currentLang === "en") {
        setLanguage("gr");
    } else {
        setLanguage("en");
    }

    // Optional: Reload dynamic content (like categories) if they have translations too
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
    getPlayers();
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

    //MAKE BUTTON INACTIVE IF CARD AMOUNT REACH MAX

    if (playerCount == 10) {
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
    }
    updatePlayerCardNums();
    if (playerCount < 10) {
        var button = document.querySelector('#m-p-p-c-plus');
        if (!button.classList.contains('active')) {
            button.classList.add('active');
            button.style.cursor = "pointer";
            button.onclick = function () {
                makePlayerCard();
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

function getPlayers() {
    var box = document.querySelector("#m-p-p-c-cards-box");
    var playerCards = box.children;
    players = [];
    Array.from(playerCards).forEach((card, index) => {
        var name = card.querySelector(".m-p-p-c-name").value;
        if (name.length === 0) {
            players.push(`Player ` + (index + 1));
        } else {
            players.push(name);
        }
    });
    // console.log(players);
}



function getImpostorsNumber(input) {
    var count = input.value;
    if (count <= 1) {
        input.value = 1;
    }
    if (count >= playerCount) {
        input.value = playerCount;
    }

    saveGameData();
}



function toggleGameMode() {
    if (currentLang === "en") {
        alert("Questions coming soon!");
    } else {
        alert("Ερωτήσεις έρχονται σύντομα!")
    }
    return;

    var gameModes = document.getElementsByClassName('game-mode');
    Array.from(gameModes).forEach((gameMode, index) => {
        gameMode.classList.toggle('active');
        if (gameMode.classList.contains('active')) {
            selectedGameMode = gameMode.id;
        }
    });

    cats = [];
    fillCats();

    var box = document.querySelector('#m-p-c-c-cards-box');
    if (box.children.length > 0) {
        toggleCat(box.children[0]);
    }

    saveGameData();
}



function toggleCat(divCat) {
    if (divCat.classList.contains('active') && cats.length == 1) return;

    let myCats;
    if (selectedGameMode === "Words") {
        myCats = categoriesWords;
    } else {
        myCats = categoriesQuestions;
    }

    const cat = myCats.find(cat => cat.id === divCat.id);
    divCat.classList.toggle('active');
    if (divCat.classList.contains('active')) {
        if (!cats.includes(cat.id)) {
            cats.push(cat.id);
        }
    } else {
        if (cats.includes(cat.id)) {
            cats = cats.filter(c => c !== cat.id);
        }
    }

    saveGameData();
}

function fillCats() {
    var box = document.querySelector('#m-p-c-c-cards-box');
    box.innerHTML = '';
    let myCats;
    if (selectedGameMode === "Words") {
        myCats = categoriesWords;
    } else {
        myCats = categoriesQuestions;
    }
    myCats.forEach((cat) => {
        makeCat(cat);
    });
}

function makeCat(cat) {
    const div1 = document.createElement(`div`);
    div1.classList.add("cat", 'non-sel');
    div1.id = cat.id;
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



// --- NEW: SAVE FUNCTION ---
function saveGameData() {
    // 1. Get the current impostor count from input
    var impInput = document.querySelector('#impostors-count-box input');
    var impCount = impInput ? impInput.value : 1;

    // 2. Build the data object
    var data = {
        // Save the players array (which is updated by getPlayers inside closePlayersTab)
        players: players,
        mode: selectedGameMode,
        activeCats: cats, // This is your global array of selected category IDs
        impostors: impCount
    };

    // 3. Save to LocalStorage
    localStorage.setItem('impostorSaveData', JSON.stringify(data));
    // console.log("Game Saved:", data);
}

// --- NEW: LOAD FUNCTION ---
function loadGameData() {
    var savedLang = localStorage.getItem('impostorLang');
    if (savedLang) {
        setLanguage(savedLang);
    } else {
        setLanguage("en");
    }

    var savedJSON = localStorage.getItem('impostorSaveData');

    // IF WE HAVE SAVE DATA:
    if (savedJSON) {
        var data = JSON.parse(savedJSON);

        // A. Restore Game Mode
        if (data.mode) {
            selectedGameMode = data.mode;
            // Update the UI buttons
            document.querySelectorAll('.game-mode').forEach(el => {
                el.classList.remove('active');
                if (el.id === selectedGameMode) el.classList.add('active');
            });
        }

        // B. Restore Categories
        fillCats(); // Build the category UI first

        // If we had saved categories, click them
        if (data.activeCats && data.activeCats.length > 0) {
            data.activeCats.forEach(catId => {
                var catDiv = document.getElementById(catId);
                // Only click if it exists and isn't already active
                if (catDiv && !catDiv.classList.contains('active')) {
                    toggleCat(catDiv);
                }
            });
        } else {
            // Fallback: Select the first one if saved list was empty
            var box = document.querySelector('#m-p-c-c-cards-box');
            if (box.children.length > 0) toggleCat(box.children[0]);
        }

        // C. Restore Players
        if (data.players && data.players.length > 0) {
            data.players.forEach(name => {
                makePlayerCard(name); // Pass the saved name
            });
        } else {
            // Fallback if players array was empty
            makePlayerCard(); makePlayerCard(); makePlayerCard();
        }

        // D. Restore Impostor Count
        if (data.impostors) {
            var impInput = document.querySelector('#impostors-count-box input');
            if (impInput) impInput.value = data.impostors;
        }

    }
    // IF NO SAVE DATA (First time loading):
    else {
        makePlayerCard();
        makePlayerCard();
        makePlayerCard();

        fillCats();
        // Select first category by default
        var box = document.querySelector('#m-p-c-c-cards-box');
        if (box.children.length > 0) toggleCat(box.children[0]);
    }
}



function start() {
    window.location.href = "game.html";
}



//--INITIALISATION:
loadGameData();



// Making functions global so HTML can see them.
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