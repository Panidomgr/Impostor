import { categoriesWords, categoriesQuestions, translations } from "./database.js";

// --- 1. DATA LOADING ---
var savedJSON = localStorage.getItem('impostorSaveData');
var data;

if (savedJSON) {
    data = JSON.parse(savedJSON);
} else {
    // Fallback if no save exists
    data = {
        players: ["Player 1", "Player 2", "Player 3"],
        impostors: 1,
        activeCats: ["Animals"],
        mode: "Words"
    };
}

if (!data.players || data.players.length === 0) {
    data.players = ["Player 1", "Player 2", "Player 3"];
}

// --- 2. GAME VARIABLES ---
var playerIndex = 0;
// Structure: [ ["Name", "Role"], ["Name", "Role"] ]
var players = data.players.map(plr => [plr, "Undefined"]);
let busy = false;
var words = [];
var chosenWord = "";
var currentLang = "en"; // Default

// DOM Elements
var unrevealed = document.getElementById('unrevealed');
var crewCard = document.getElementById('revealed-crew');
var impCard = document.getElementById('revealed-imp');


// --- 3. LANGUAGE FUNCTIONS ---
function setLanguage(lang) {
    // A. Update Variable & Body Class
    currentLang = lang;
    document.body.classList.remove('lang-en', 'lang-gr');
    document.body.classList.add('lang-' + lang);

    // B. Update Text Content
    const elements = document.querySelectorAll('[data-lang]');
    elements.forEach(element => {
        const key = element.getAttribute('data-lang');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // C. Update Placeholders
    const inputs = document.querySelectorAll('.m-p-p-c-name');
    inputs.forEach(input => {
        input.placeholder = translations[lang]["placeholder_name"];
    });

    // D. Update Image Alts
    const images = document.querySelectorAll('[data-lang-alt]');
    images.forEach(img => {
        const key = img.getAttribute('data-lang-alt');
        if (translations[lang][key]) {
            img.alt = translations[lang][key];
        }
    });

    // E. Save to LocalStorage
    localStorage.setItem('impostorLang', lang);
}

function toggleLanguage() {
    const oldLang = currentLang;
    const newLang = currentLang === "en" ? "gr" : "en";

    // 1. Update all standard UI elements (Buttons, Headers, etc.)
    setLanguage(newLang);

    // 2. Find and Translate the Active Game Word
    // Combine both lists so we search everywhere
    const allCats = [...categoriesWords, ...categoriesQuestions];

    for (const cat of allCats) {
        // Safety Check: Ensure this category has lists for both languages
        if (cat.words && cat.words[oldLang] && cat.words[newLang]) {
            
            // Try to find the current chosenWord in the OLD language list
            const index = cat.words[oldLang].indexOf(chosenWord);

            if (index !== -1) {
                // Found it! Get the corresponding word from the NEW language list
                const translatedWord = cat.words[newLang][index];

                // If a translation exists, update the game state
                if (translatedWord) {
                    chosenWord = translatedWord;

                    // Update the text on the revealed card immediately
                    const wordDiv = document.querySelector("#word");
                    if (wordDiv) wordDiv.textContent = chosenWord;

                    // Update the results screen if the game is already over
                    const resultWordDiv = document.querySelector("#result-word");
                    if (resultWordDiv) resultWordDiv.textContent = chosenWord;
                }
                
                // We found our match, no need to keep checking other categories
                break; 
            }
        }
    }
}


// --- 4. GAME LOGIC FUNCTIONS ---

function exit() {
    var userAgreed = confirm(translations[currentLang]["exit_msg"]);
    if (userAgreed) {
        window.location.href = "index.html";
    }
}

function fillWordCardUnrevealed() {
    let plrs = data.players;
    var nameDiv = document.querySelector("#player-name");
    // Player names are user input, so they don't get translated
    nameDiv.textContent = plrs[playerIndex];
}

function showUnrevealedCard() {
    if (busy) return;
    busy = true;

    var card = document.querySelector("#unrevealed");
    if (!card.classList.contains("shown")) {
        card.classList.add("shown");
    }

    setTimeout(() => {
        busy = false;
    }, 1000);
}

function fillWordCardRevealed() {
    var wordDiv = document.querySelector("#word");
    wordDiv.textContent = chosenWord;
}

function revealWordCard() {
    if (busy) return;
    busy = true;

    unrevealed.classList.remove('shown');

    if (players[playerIndex][1] === "Impostor") {
        impCard.classList.add('shown');
    } else {
        crewCard.classList.add('shown');
    }

    setTimeout(() => {
        busy = false;
    }, 1000);
}

function nextWordCard() {
    if (busy) return;

    crewCard.classList.remove("shown");
    impCard.classList.remove("shown");

    playerIndex++;

    fillWordCardUnrevealed();

    if (playerIndex < data.players.length) {
        showUnrevealedCard();
    } else {
        start();
    }
}

function determineImpostors() {
    // Reset to Crew
    for (let i = 0; i < players.length; i++) {
        players[i][1] = "Crew";
    }

    let candidates = [];
    for (let i = 0; i < players.length; i++) {
        candidates.push(i);
    }

    var impCount = parseInt(data.impostors);

    for (let i = 0; i < impCount; i++) {
        if (candidates.length === 0) break;
        let randomIndex = Math.floor(Math.random() * candidates.length);
        let realPlayerIndex = candidates[randomIndex];
        players[realPlayerIndex][1] = "Impostor";
        candidates.splice(randomIndex, 1);
    }
}

function determineWord() {
    let myCats = categoriesWords;
    words = [];
    chosenWord = "";

    for (let i = 0; i < data.activeCats.length; i++) {
        let cat = myCats.find(cat => cat.id === data.activeCats[i]);
        // This picks the word list based on the CURRENT language at start
        let wordList = cat.words[currentLang]; 
        
        if (wordList) {
            wordList.forEach((word) => {
                if (!words.includes(word)) {
                    words.push(word);
                }
            });
        }
    }

    if (words.length > 0) {
        let randomIndex = Math.floor(Math.random() * words.length);
        chosenWord = words[randomIndex];
    } else {
        chosenWord = "Error";
    }
}

function determineStartingPlayer() {
    let rng;
    // Safety check if everyone is impostor (rare custom setting)
    if (parseInt(data.impostors) === players.length) {
        rng = Math.floor(Math.random() * players.length);
        document.querySelector("#starting-player-name").textContent = players[rng][0];
    } else {
        let playerHasBeenChosen = false;
        while (!playerHasBeenChosen) {
            rng = Math.floor(Math.random() * players.length);
            if (players[rng][1] === "Impostor") continue;
            
            document.querySelector("#starting-player-name").textContent = players[rng][0];
            playerHasBeenChosen = true;
        }
    }
}

function start() {
    if (busy) return;
    busy = true;

    unrevealed.classList.remove("shown");
    impCard.classList.remove("shown");
    crewCard.classList.remove("shown");

    var div = document.querySelector("#voting-phase-div");
    div.classList.add("shown");

    setTimeout(() => {
        busy = false;
    }, 5000);
}

function revealResults() {
    if (busy) return;
    busy = true;

    var textDiv = document.getElementById("results-text");
    if (parseInt(data.impostors) === 1) {
        textDiv.textContent = translations[currentLang]["the_impostor_was"];
    } else {
        textDiv.textContent = translations[currentLang]["the_impostors_were"];
    }

    // --- FIX: Clear the old text immediately so it doesn't show up early ---
    document.getElementById("result-word").textContent = "";
    document.getElementById("imp-name").textContent = "";
    // ---------------------------------------------------------------------

    document.querySelector("#voting-phase-div").classList.remove("shown");
    document.querySelector("#results-div").classList.add("shown");

    setTimeout(() => {
        write(chosenWord, "result-word");

        setTimeout(() => {
            let myString = "";
            let tempImpCount = 0;
            let totalImps = parseInt(data.impostors);

            for (let i = 0; i < players.length; i++) {
                if (players[i][1] === "Crew") continue;
                tempImpCount++;
                if (tempImpCount === totalImps) {
                    myString += players[i][0];
                } else {
                    myString += players[i][0] + ", ";
                }
            }
            write(myString, "imp-name");
        }, 2000);
    }, 2000);

    setTimeout(() => {
        busy = false;
    }, 5000);
}

function write(text, elementId) {
    const element = document.getElementById(elementId);
    if (!element) return; 

    element.textContent = ""; 
    let i = 0;
    const cursor = "|";

    function type() {
        if (i < text.length) {
            element.textContent = text.substring(0, i + 1) + cursor;
            i++;
            setTimeout(type, 150);
        } else {
            flashCursor(element, text, cursor, 3);
        }
    }
    type();
}

function flashCursor(element, finalText, cursor, times) {
    let count = 0;
    let isVisible = true;
    const interval = setInterval(() => {
        if (isVisible) {
            element.textContent = finalText;
        } else {
            element.textContent = finalText + cursor;
        }
        isVisible = !isVisible;
        count++;
        if (count >= times * 2) {
            clearInterval(interval);
            element.textContent = finalText; 
        }
    }, 500);
}

function playAgain() {
    if (busy) return;
    var userAgreed = confirm(translations[currentLang]["play_again_msg"]);
    if (userAgreed) {
        window.location.reload();
    }
}


// --- 5. INITIALIZATION ---

// Load Language first
var savedLang = localStorage.getItem('impostorLang');
if (savedLang) {
    setLanguage(savedLang);
} else {
    setLanguage("en");
}

// Run Game Logic
fillWordCardUnrevealed();
showUnrevealedCard();
determineImpostors();
determineWord(); // Picks word based on the loaded language
fillWordCardRevealed();
determineStartingPlayer();


// --- 6. EXPOSE TO WINDOW (Required for HTML onclick) ---
window.revealWordCard = revealWordCard;
window.exit = exit;
window.nextWordCard = nextWordCard;
window.revealResults = revealResults;
window.playAgain = playAgain;
window.toggleLanguage = toggleLanguage;
