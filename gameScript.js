import { categoriesWords, categoriesQuestions, translations } from "./database.js";

// --- 1. DATA LOADING ---
var savedJSON = localStorage.getItem('impostorSaveData');
var data;

if (savedJSON) {
    data = JSON.parse(savedJSON);
} else {
    data = {
        players: ["Player 1", "Player 2", "Player 3"],
        impostors: 1,
        activeCatsWords: ["Animals"],
        activeCatsQuestions: ["Social"],
        mode: "Words",
        settings: { rngImpostors: false, showCat: false }
    };
}

// Safety Defaults
if (!data.players || data.players.length === 0) {
    data.players = ["Player 1", "Player 2", "Player 3"];
}
if (!data.activeCatsWords || data.activeCatsWords.length === 0) {
    data.activeCatsWords = ["Animals"];
}
if (!data.activeCatsQuestions || data.activeCatsQuestions.length === 0) {
    data.activeCatsQuestions = ["Social"];
}

// Determine which list to use for the active game
var gameActiveCats = [];
if (data.mode === "Words") {
    gameActiveCats = data.activeCatsWords;
} else {
    gameActiveCats = data.activeCatsQuestions;
}

// --- 2. GAME VARIABLES ---
var playerIndex = 0;
var players = data.players.map(plr => [plr, "Undefined"]);
let busy = false;
var words = [];
var chosenWord = "";
var currentLang = "en"; 

const ImpLogoSrc = "https://res.cloudinary.com/dhon1edrf/image/upload/f_auto,q_auto/v1766804156/imp_tucedk.png";

var crewQ = "";
var impQ = "";
var myPlayersQ = [];
var myAnswerDivs = [];

var unrevealed = document.getElementById('unrevealed');
var crewCard = document.getElementById('revealed-crew');
var impCard = document.getElementById('revealed-imp');

// --- 3. LANGUAGE FUNCTIONS ---
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

    const placers = document.querySelectorAll('[data-lang-placeholder]');
    placers.forEach(el => {
        const key = el.getAttribute('data-lang-placeholder');
        if (translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
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
    const oldLang = currentLang;
    const newLang = currentLang === "en" ? "gr" : "en";
    
    // 1. Update all standard UI elements first
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
                        
                        const wordDiv = document.querySelector("#word");
                        if (wordDiv) wordDiv.textContent = chosenWord;

                        const resultWordDiv = document.querySelector("#result-word");
                        if (resultWordDiv) resultWordDiv.textContent = chosenWord;

                        if (data.settings && data.settings.showCat === true) {
                            const hintText = document.getElementById('category-hint-text');
                            const translatedCatName = translations[newLang][cat.id] || cat.id;
                            if (hintText) hintText.textContent = translatedCatName;
                        }
                    }
                    break; 
                }
            }
        }

        let resultsDiv = document.getElementById("results-div");
        if (resultsDiv.classList.contains("shown") && parseInt(data.impostors) > 1) {
            let textDiv = document.getElementById("results-text");
            textDiv.textContent = translations[newLang]["the_impostors_were"];
        }

    } 
    
    // --- GAME MODE: QUESTIONS ---
    else {
        // Helper keys to search through all 5 lists
        const keys = ['questions_A', 'questions_B', 'questions_C', 'questions_D', 'questions_E'];

        for (const cat of categoriesQuestions) {
            let foundCrew = false;
            let foundImp = false;

            // Search for Crew Question translation
            for (const key of keys) {
                if (cat[key] && cat[key][oldLang]) {
                    let idx = cat[key][oldLang].indexOf(crewQ);
                    if (idx !== -1) {
                        crewQ = cat[key][newLang][idx];
                        foundCrew = true;
                        break; 
                    }
                }
            }

            // Search for Impostor Question translation (independent search)
            for (const key of keys) {
                if (cat[key] && cat[key][oldLang]) {
                    let idx = cat[key][oldLang].indexOf(impQ);
                    if (idx !== -1) {
                        impQ = cat[key][newLang][idx];
                        foundImp = true;
                        break; 
                    }
                }
            }

            if (foundCrew || foundImp) break; 
        }

        // Update global array
        for (let i = 0; i < myPlayersQ.length; i++) {
            if (myPlayersQ[i][1] === "Impostor") {
                myPlayersQ[i][2] = impQ;
            } else {
                myPlayersQ[i][2] = crewQ;
            }
        }

        // Update DOM elements if visible
        let qDiv = document.getElementById('question');
        let card = document.getElementById("question-card");
        if (card && card.classList.contains('shown') && myPlayersQ[playerIndex]) {
             qDiv.textContent = myPlayersQ[playerIndex][2];
        }
        let resQDiv = document.getElementById('results-question');
        if (resQDiv) resQDiv.textContent = crewQ;
        
        let impQDivs = document.querySelectorAll('.results-impostor-question');
        impQDivs.forEach(div => {
            div.textContent = impQ;
        });
    }
}

// --- 4. GAME LOGIC ---

function exit() {
    var userAgreed = confirm(translations[currentLang]["exit_msg"]);
    if (userAgreed) {
        window.location.href = "index.html";
    }
}

function fillWordCardUnrevealed() {
    let plrs = data.players;
    var nameDiv = document.querySelector("#player-name");
    if(plrs[playerIndex]) {
        nameDiv.textContent = plrs[playerIndex];
    }
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

        // Hint Logic
        const hintContainer = document.getElementById('imp-hint-container');
        const hintText = document.getElementById('category-hint-text');
        if (hintContainer) hintContainer.style.display = 'none';

        if (data.settings && data.settings.showCat === true) {
            let foundCatId = "";
            for (const cat of categoriesWords) {
                if (cat.words[currentLang] && cat.words[currentLang].includes(chosenWord)) {
                    foundCatId = cat.id;
                    break;
                }
            }
            if (foundCatId) {
                const translatedCatName = translations[currentLang][foundCatId] || foundCatId;
                if (hintText) hintText.textContent = translatedCatName;
                if (hintContainer) hintContainer.style.display = 'flex';
            }
        }

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
    for (let i = 0; i < players.length; i++) {
        players[i][1] = "Crew";
    }

    let candidates = [];
    for (let i = 0; i < players.length; i++) {
        candidates.push(i);
    }

    var impCount = parseInt(data.impostors);

    if (data.settings && data.settings.rngImpostors === true) {
        let maxImpostors = Math.max(1, players.length - 1);
        impCount = Math.floor(Math.random() * maxImpostors) + 1;
        data.impostors = impCount;
    }

    if (impCount >= players.length) impCount = players.length - 1;
    if (impCount < 1) impCount = 1;

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

    for (let i = 0; i < gameActiveCats.length; i++) {
        let cat = myCats.find(cat => cat.id === gameActiveCats[i]);
        if(cat && cat.words) {
            let wordList = cat.words[currentLang];
            if (wordList) {
                wordList.forEach((word) => {
                    if (!words.includes(word)) {
                        words.push(word);
                    }
                });
            }
        }
    }

    if (words.length > 0) {
        let randomIndex = Math.floor(Math.random() * words.length);
        chosenWord = words[randomIndex];
    } else {
        chosenWord = "Error - No Categories";
    }
}

function determineStartingPlayer() {
    let rng;
    if (parseInt(data.impostors) >= players.length) {
        rng = Math.floor(Math.random() * players.length);
        document.querySelector("#starting-player-name").textContent = players[rng][0];
    } else {
        let playerHasBeenChosen = false;
        let attempts = 0; 
        while (!playerHasBeenChosen && attempts < 100) {
            rng = Math.floor(Math.random() * players.length);
            attempts++;
            if (players[rng][1] === "Impostor") continue;

            document.querySelector("#starting-player-name").textContent = players[rng][0];
            playerHasBeenChosen = true;
        }
        if(!playerHasBeenChosen) {
             document.querySelector("#starting-player-name").textContent = players[0][0];
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

    document.getElementById("result-word").textContent = "";
    document.getElementById("imp-name").textContent = "";

    document.querySelector("#voting-phase-div").classList.remove("shown");
    document.querySelector("#results-div").classList.add("shown");

    setTimeout(() => {
        write(chosenWord, "result-word");

        setTimeout(() => {
            let myString = "";
            let tempImpCount = 0;
            let actualImps = players.filter(p => p[1] === "Impostor").length;

            for (let i = 0; i < players.length; i++) {
                if (players[i][1] === "Crew") continue;
                tempImpCount++;
                if (tempImpCount === actualImps) {
                    myString += players[i][0];
                } else {
                    myString += players[i][0] + ", ";
                }
            }
            write(myString, "imp-name");
        }, 500);
    }, 500);

    setTimeout(() => {
        busy = false;
    }, 1000);
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
            setTimeout(type, 50);
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


//      QUESTION GAME LOGIC 

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
    // USE THE NEW gameActiveCats VARIABLE
    let rng = Math.floor(Math.random() * gameActiveCats.length);
    let currentCat = gameActiveCats[rng];
    
    let myCat = categoriesQuestions.find(cat => cat.id === currentCat);
    if(!myCat) myCat = categoriesQuestions[0]; 

    // Find length of one of the lists (assuming all have equal length for simplicity, 
    // though the code handles it by using just one length)
    let qAmount = myCat.questions_A.en.length;
    let qIndex = Math.floor(Math.random() * qAmount);

    // --- NEW LOGIC: Pick 2 different lists from A, B, C, D, E ---
    const keys = ['questions_A', 'questions_B', 'questions_C', 'questions_D', 'questions_E'];
    
    // Pick first random key index (0-4)
    let k1 = Math.floor(Math.random() * 5);
    
    // Pick second random key index (0-4), ensuring it's not the same as k1
    let k2 = Math.floor(Math.random() * 5);
    while (k2 === k1) {
        k2 = Math.floor(Math.random() * 5);
    }

    // Assign questions
    // Note: We use the `keys` array to access the property dynamically
    crewQ = myCat[keys[k1]][currentLang][qIndex];
    impQ = myCat[keys[k2]][currentLang][qIndex];
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

var savedLang = localStorage.getItem('impostorLang');
if (savedLang) {
    setLanguage(savedLang);
} else {
    setLanguage("en");
}

// First, determine impostors (this handles RNG if enabled)
determineImpostors();

if (data.mode === "Words") {
    fillWordCardUnrevealed();
    showUnrevealedCard();
    determineWord();
    fillWordCardRevealed();
    determineStartingPlayer();
} else {
    determineQuestions();
    getPlayersQuestionArray();
    fillAndShowUnrevealedQuestionCard();
}

// --- 6. EXPOSE TO WINDOW ---
window.revealWordCard = revealWordCard;
window.exit = exit;
window.nextWordCard = nextWordCard;
window.revealResults = revealResults;
window.playAgain = playAgain;
window.toggleLanguage = toggleLanguage;
window.revealQuestionCard = revealQuestionCard;
window.nextQuestionCard = nextQuestionCard;
window.revealImpostorsQ = revealImpostorsQ;
