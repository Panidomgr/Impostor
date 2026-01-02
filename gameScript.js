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

// console.log("Data: ", data);

// --- 2. GAME VARIABLES ---
var playerIndex = 0;
// Structure: [ ["Name", "Role"], ["Name", "Role"] ]
var players = data.players.map(plr => [plr, "Undefined"]);
let busy = false;
var words = [];
var chosenWord = "";
var currentLang = "en"; // Default

const ImpLogoSrc = "https://res.cloudinary.com/dhon1edrf/image/upload/f_auto,q_auto/v1766804156/imp_tucedk.png";

// Question Game Global Variable
var crewQ = "";
var impQ = "";
var myPlayersQ = [];
var myAnswerDivs = [];

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

    const placers = document.querySelectorAll('[data-lang-placeholder]');
    placers.forEach(el => {
        const key = el.getAttribute('data-lang-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
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

    // --- GAME MODE: WORDS ---
    if (data.mode === "Words") {
        const allCats = categoriesWords;

        for (const cat of allCats) {
            if (cat.words && cat.words[oldLang] && cat.words[newLang]) {
                const index = cat.words[oldLang].indexOf(chosenWord);
                if (index !== -1) {
                    const translatedWord = cat.words[newLang][index];
                    if (translatedWord) {
                        chosenWord = translatedWord;
                        
                        // Update DOM Elements
                        const wordDiv = document.querySelector("#word");
                        if (wordDiv) wordDiv.textContent = chosenWord;

                        const resultWordDiv = document.querySelector("#result-word");
                        if (resultWordDiv) resultWordDiv.textContent = chosenWord;
                    }
                    break; 
                }
            }
        }
    } 
    
    // --- GAME MODE: QUESTIONS ---
    else {
        // We need to find the current crewQ in the database to get the index
        for (const cat of categoriesQuestions) {
            if (cat.questions_A && cat.questions_A[oldLang]) {
                
                // Case 1: Crew Question is from List A
                let idx = cat.questions_A[oldLang].indexOf(crewQ);
                if (idx !== -1) {
                    crewQ = cat.questions_A[newLang][idx];
                    impQ = cat.questions_B[newLang][idx];
                    break;
                }

                // Case 2: Crew Question is from List B
                idx = cat.questions_B[oldLang].indexOf(crewQ);
                if (idx !== -1) {
                    crewQ = cat.questions_B[newLang][idx];
                    impQ = cat.questions_A[newLang][idx];
                    break;
                }
            }
        }

        // Update the global Players Array so future turns use the new language
        for (let i = 0; i < myPlayersQ.length; i++) {
            if (myPlayersQ[i][1] === "Impostor") {
                myPlayersQ[i][2] = impQ;
            } else {
                myPlayersQ[i][2] = crewQ;
            }
        }

        // Update DOM: Current Active Question Card (if visible)
        let qDiv = document.getElementById('question');
        let card = document.getElementById("question-card");
        if (card.classList.contains('shown') && myPlayersQ[playerIndex]) {
             qDiv.textContent = myPlayersQ[playerIndex][2];
        }

        // Update DOM: Results Screen (Header)
        let resQDiv = document.getElementById('results-question');
        if (resQDiv) resQDiv.textContent = crewQ;

        // Update DOM: Results Screen (Impostor Questions in list)
        let impQDivs = document.querySelectorAll('.results-impostor-question');
        impQDivs.forEach(div => {
            div.textContent = impQ;
        });
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

    var card = (data.mode === "Words") ? document.querySelector("#unrevealed") : document.querySelector("#unrevealed-q");
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




//      QUESTION GAME BITCHES

function fillAndShowUnrevealedQuestionCard() {
    if (busy) return;
    busy = true;

    let nameDiv = document.getElementById("player-name-q");
    nameDiv.textContent = myPlayersQ[playerIndex][0];

    let qCard = document.getElementById('question-card');
    qCard.classList.remove('shown');

    let card = document.getElementById("unrevealed-q");
    if (!card.classList.contains('shown')) card.classList.add("shown");

    fillQuestionCard();

    setTimeout(() => {
        busy = false;
    }, 1000);
}

function fillQuestionCard() {
    let qDiv = document.getElementById('question');
    qDiv.textContent = myPlayersQ[playerIndex][2];

    let a = document.getElementById('answer');
    a.value = "";
}

function revealQuestionCard() {
    if (busy) return;
    busy = true;

    let unrevealed = document.getElementById("unrevealed-q")
    unrevealed.classList.remove('shown');

    let card = document.getElementById("question-card");
    if (!card.classList.contains('shown')) card.classList.add('shown');

    setTimeout(() => {
        busy = false;
    }, 1000);
}

function determineQuestions() {
    let rng = Math.floor(Math.random() * data.activeCats.length);
    let currentCat = data.activeCats[rng];
    let myCat = categoriesQuestions.find(cat => cat.id === currentCat);
    let qAmount = myCat.questions_A.en.length;
    let qIndex = Math.floor(Math.random() * qAmount);
    rng = Math.random();
    if (rng > 0.5) {
        crewQ = myCat.questions_A[currentLang][qIndex];
        impQ = myCat.questions_B[currentLang][qIndex];
    } else {
        crewQ = myCat.questions_B[currentLang][qIndex];
        impQ = myCat.questions_A[currentLang][qIndex];
    }
}

function getPlayersQuestionArray() {
    myPlayersQ = [];

    for (let i = 0; i < players.length; i++) {
        let name = players[i][0];
        let role = players[i][1];
        let assignedQuestion = (role === "Impostor") ? impQ : crewQ;
        let answer = "";

        myPlayersQ.push([name, role, assignedQuestion, answer]);
    }

    // console.log("Players: ", myPlayersQ);
}

function nextQuestionCard() {
    if (busy) return;

    let answerDiv = document.getElementById('answer');
    let answer = answerDiv.value;
    myPlayersQ[playerIndex][3] = answer;

    playerIndex++;

    if (playerIndex < data.players.length) {
        fillAndShowUnrevealedQuestionCard();

        setTimeout(() => {
            busy = false;
        }, 1000);
    } else {
        resultsQ();

        setTimeout(() => {
            busy = false;
        }, 5000);
    }
}

function makeQCard() {
    const div1 = document.createElement(`div`);
    div1.classList.add('results-q-answer-card');

    const div2 = document.createElement(`div`);
    div2.classList.add('results-index-container');
    div1.appendChild(div2);

    const div3 = document.createElement(`div`);
    div3.classList.add('results-index');
    div3.textContent = playerIndex + 1;
    div2.appendChild(div3);

    const img = document.createElement(`img`);
    img.classList.add('results-impostor-logo');
    img.src = ImpLogoSrc;
    img.alt = "Impostor-Logo";
    img.draggable = false;
    img.setAttribute('data-lang-alt', "alt_imp");
    div2.appendChild(img);

    const div4 = document.createElement(`div`);
    div1.appendChild(div4);

    const div5 = document.createElement(`div`);
    div5.classList.add('results-name-container');
    div4.appendChild(div5);

    const div6 = document.createElement(`div`);
    div6.classList.add('results-name');
    div6.textContent = myPlayersQ[playerIndex][0];
    div5.appendChild(div6);

    const div7 = document.createElement(`div`);
    div7.classList.add('results-impostor');
    div7.setAttribute('data-lang', "impostor");
    div7.textContent = translations[currentLang]["impostor"]
    div5.appendChild(div7);

    const div8 = document.createElement(`div`);
    div8.classList.add('results-answer-container');
    div4.appendChild(div8);

    const div9 = document.createElement(`div`);
    div9.classList.add('results-answer');
    div9.textContent = myPlayersQ[playerIndex][3];
    div8.appendChild(div9);

    const div10 = document.createElement(`div`);
    div10.classList.add('results-impostor-question');
    div10.setAttribute('data-lang', "results-impostor-question");
    if (myPlayersQ[playerIndex][1] === "Impostor") {
        div10.textContent = myPlayersQ[playerIndex][2];
    }
    div8.appendChild(div10);

    let box = document.getElementById('answers');
    box.appendChild(div1);
    myAnswerDivs.push(div1);

    playerIndex++;
}

function fillAnswersQ() {
    playerIndex = 0;
    myAnswerDivs = [];
    let box = document.getElementById('answers');
    box.innerHTML = '';

    for (let i = 0; i < myPlayersQ.length; i++) {
        makeQCard();
    }

    //Changing Data Lang Attribute for the amount of Impostors:
    let btn = document.getElementById('results-q-btn');
    if (data.impostors > 1) {
        btn.setAttribute('data-lang', "reveal_impostors");
        btn.textContent = translations[currentLang]["reveal_impostors"];
    } else {
        btn.setAttribute('data-lang', "reveal_impostor");
        btn.textContent = translations[currentLang]["reveal_impostor"];
    }
}

function fillResultsCardQ() {
    let qDiv = document.getElementById('results-question');
    qDiv.textContent = crewQ;

    fillAnswersQ();
}

function resultsQ() {
    if (busy) return;
    busy = true;

    fillResultsCardQ();

    let lastCard = document.getElementById('question-card');
    lastCard.classList.remove('shown');

    let resultsDiv = document.getElementById("results-q");
    if (!resultsDiv.classList.contains('shown')) resultsDiv.classList.add('shown');

    setTimeout(() => {
        busy = false;
    }, 5000);
}

function revealImpostorsQ() {
    if (busy) return;
    busy = true;

    playerIndex = 0;

    for (let i = 0; i < myAnswerDivs.length; i++) {
        if (myPlayersQ[playerIndex++][1] === "Crew") continue;
        myAnswerDivs[i].classList.add('impostor');
    }

    let btn = document.getElementById('results-q-btn');
    btn.setAttribute('data-lang', "play_again");
    btn.textContent = translations[currentLang]["play_again"];
    btn.onclick = () => {
        playAgain();
    }

    setTimeout(() => {
        busy = false;
    }, 5000);
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
determineImpostors();
if (data.mode === "Words") {
    fillWordCardUnrevealed();
    showUnrevealedCard();
    determineWord(); // Picks word based on the loaded language
    fillWordCardRevealed();
    determineStartingPlayer();
} else {
    determineQuestions();
    getPlayersQuestionArray();
    fillAndShowUnrevealedQuestionCard();
}






// --- 6. EXPOSE TO WINDOW (Required for HTML onclick) ---
window.revealWordCard = revealWordCard;
window.exit = exit;
window.nextWordCard = nextWordCard;
window.revealResults = revealResults;
window.playAgain = playAgain;
window.toggleLanguage = toggleLanguage;
window.revealQuestionCard = revealQuestionCard;
window.nextQuestionCard = nextQuestionCard;
window.revealImpostorsQ = revealImpostorsQ;
