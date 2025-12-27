import { categoriesWords, categoriesQuestions, translations } from "./database.js";

var savedJSON = localStorage.getItem('impostorSaveData');
var data;

if (savedJSON) {
    data = JSON.parse(savedJSON);
} else {
    // Fallback if no save exists immediately
    data = {
        players: ["Player 1", "Player 2", "Player 3"],
        impostors: 1,
        activeCats: ["Animals"],
        mode: "Words"
    };
}

if (data.players.length === 0) {
    data.players = ["Player 1", "Player 2", "Player 3"];
}

// console.log(data);



var playerIndex = 0;
// Structure: [ ["Name", "Role"], ["Name", "Role"] ]
var players = data.players.map(plr => [plr, "Undefined"]);
let busy = false;
var words = [];
var chosenWord = "";


var unrevealed = document.getElementById('unrevealed');
var crewCard = document.getElementById('revealed-crew');
var impCard = document.getElementById('revealed-imp');

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
    // fillCats(); 
}

function exit() {
    var userAgreed = confirm(translations[currentLang]["exit_msg"]);

    if (userAgreed) {
        window.location.href = "index.html";
    }
}

function fillWordCardUnrevealed() {
    let plrs = data.players;

    var nameDiv = document.querySelector("#player-name");
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
    // 1. First, set EVERYONE to "Crew" by default
    for (let i = 0; i < players.length; i++) {
        players[i][1] = "Crew";
    }

    // 2. Create a temporary pool of indexes (0, 1, 2, etc.)
    // We will pick numbers from here and remove them so we don't pick duplicates.
    let candidates = [];
    for (let i = 0; i < players.length; i++) {
        candidates.push(i);
    }

    // 3. Loop based on how many impostors we need
    var impCount = parseInt(data.impostors); // Make sure it's a number

    for (let i = 0; i < impCount; i++) {
        // If we run out of players (safety check), stop
        if (candidates.length === 0) break;

        // Pick a random spot in our list of CANDIDATES
        let randomIndex = Math.floor(Math.random() * candidates.length);

        // Find out which real player ID was at that spot
        let realPlayerIndex = candidates[randomIndex];

        // Mark that player as Impostor
        players[realPlayerIndex][1] = "Impostor";

        // Remove that index from candidates so they can't be picked again
        candidates.splice(randomIndex, 1);
    }

    // console.log("Players:", players);
}

function determineWord() {

    let myCats = categoriesWords;

    words = [];
    chosenWord = "";

    for (let i = 0; i < data.activeCats.length; i++) {
        let cat = myCats.find(cat => cat.id === data.activeCats[i]);
        let wordList = cat.words[currentLang]; 
        
        if (wordList) {
            wordList.forEach((word) => {
                if (!words.includes(word)) {
                    words.push(word);
                }
            });
        }
    }

    let randomIndex = Math.floor(Math.random() * words.length);

    chosenWord = words[randomIndex];
}

function determineStartingPlayer() {
    let rng;
    if (parseInt(data.impostors) === players.length) {
        rng = Math.floor(Math.random() * players.length);
        var nameSpan = document.querySelector("#starting-player-name");
        nameSpan.textContent = players[rng][0];
    } else {
        let playerHasBeenChosen = false;
        while (!playerHasBeenChosen) {
            rng = Math.floor(Math.random() * players.length);
            if (players[rng][1] === "Impostor") continue;
            var nameSpan = document.querySelector("#starting-player-name");
            nameSpan.textContent = players[rng][0];
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

    var div = document.querySelector("#voting-phase-div");
    div.classList.remove("shown");

    var resultsDiv = document.querySelector("#results-div");
    resultsDiv.classList.add("shown");

    setTimeout(() => {
        write(chosenWord, "result-word");


        setTimeout(() => {
            let myString = "";
            let tempImpCount = 0;
            for (let i = 0; i < players.length; i++) {
                if (players[i][1] === "Crew") continue;
                tempImpCount++;
                if (tempImpCount === parseInt(data.impostors)) {
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
    if (!element) return; // Safety check

    element.textContent = ""; // Clear existing text
    let i = 0;

    // The cursor character
    const cursor = "|";

    function type() {
        if (i < text.length) {
            // Add the next letter + the cursor
            element.textContent = text.substring(0, i + 1) + cursor;
            i++;
            // Speed of typing (50ms per letter)
            setTimeout(type, 150);
        } else {
            // Typing finished. Start the flashing cursor.
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
            // Hide cursor (show only text)
            element.textContent = finalText;
        } else {
            // Show cursor
            element.textContent = finalText + cursor;
        }

        isVisible = !isVisible;
        count++;

        // Stop after flashing 'times' amount (multiply by 2 for on/off cycles)
        if (count >= times * 2) {
            clearInterval(interval);
            element.textContent = finalText; // Ensure it ends clean (no cursor)
        }
    }, 500); // 500ms flash speed (slow)
}

function playAgain() {
    if (busy) return;
    var userAgreed = confirm(translations[currentLang]["play_again_msg"]);

    if (userAgreed) {
        window.location.reload();
    }
}




//INIT

// 1. Safety Check: Ensure data exists before doing anything
if (!data) {
    // If no save found, create default dummy data so it doesn't crash
    data = {
        players: ["Player 1", "Player 2", "Player 3"],
        impostors: 1,
        activeCats: ["Animals"],
        mode: "Words"
    };
}

// 2. Load Language FIRST (so the word is picked in the correct language)
var savedLang = localStorage.getItem('impostorLang');
if (savedLang) {
    setLanguage(savedLang);
} else {
    setLanguage("en");
}

// 3. Now run the game logic
fillWordCardUnrevealed();
showUnrevealedCard();
determineImpostors();
determineWord(); // Now uses the correct language and correct category list
fillWordCardRevealed();
determineStartingPlayer();



//WINDOWS

window.revealWordCard = revealWordCard;
window.exit = exit;
window.nextWordCard = nextWordCard;
window.revealResults = revealResults;
window.playAgain = playAgain;