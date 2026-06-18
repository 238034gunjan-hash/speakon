/**
 * Speak-On Voice Translator - Main Application Logic
 * Implements actual and simulated Web Speech APIs, persistent local storage,
 * dynamic theme switching, categorized phrases, and emergency triggers.
 */

// -------------------------------------------------------------
// 1. Core Data Constants (Dictionary & Categorized Phrases)
// -------------------------------------------------------------

const MODE_PHRASES = {
  shop: [
    { text: "How much does this cost?", translated: "यो कति रुपैयाँ हो?" },
    {
      text: "Can you lower the price?",
      translated: "के तपाईं मूल्य घटाउन सक्नुहुन्छ?",
    },
    { text: "I only want one.", translated: "मलाई एउटा मात्र चाहिन्छ।" },
    {
      text: "Do you accept cards?",
      translated: "के तपाईं कार्ड स्वीकार गर्नुहुन्छ?",
    },
    { text: "That is too expensive.", translated: "यो धेरै महँगो भयो।" },
    { text: "Can I see another one?", translated: "के म अर्को हेर्न सक्छु?" },
  ],
  taxi: [
    {
      text: "Please take me to this location.",
      translated: "कृपया मलाई यो ठाउँमा लैजानुहोस्।",
    },
    { text: "Stop here.", translated: "यहाँ रोक्नुहोस्।" },
    { text: "How much is the fare?", translated: "भाडा कति हो?" },
    { text: "Please drive slowly.", translated: "कृपया बिस्तारै हाक्नुहोस्।" },
    {
      text: "Can you wait for me?",
      translated: "के तपाईं मेरो लागि पर्खन सक्नुहुन्छ?",
    },
    {
      text: "Take me to the airport.",
      translated: "मलाई विमानस्थल लैजानुहोस्।",
    },
  ],
  hotel: [
    { text: "I have a reservation.", translated: "मेरो बुकिङ छ।" },
    {
      text: "I need a room for one night.",
      translated: "मलाई एक रातको लागि कोठा चाहिन्छ।",
    },
    { text: "Is breakfast included?", translated: "के बिहानको खाना समावेश छ?" },
    { text: "The Wi-Fi is not working.", translated: "वाइफाइ चलेको छैन।" },
    {
      text: "Can I get room service?",
      translated: "के म कोठा सेवा पाउन सक्छु?",
    },
    { text: "I want to check out.", translated: "म चेक आउट गर्न चाहन्छु।" },
  ],
  dining: [
    { text: "I would like to order.", translated: "म अर्डर गर्न चाहन्छु।" },
    {
      text: "Do you have vegetarian food?",
      translated: "के तपाईंसँग शाकाहारी खाना छ?",
    },
    {
      text: "No spicy food please.",
      translated: "कृपया पिरो खाना नहाल्नुहोला।",
    },
    { text: "Can I see the menu?", translated: "के म मेनु हेर्न सक्छु?" },
    { text: "The food was excellent.", translated: "खाना निकै मिठो थियो।" },
    { text: "Can I get the bill?", translated: "के म बिल पाउन सक्छु?" },
  ],
  emergency: [
    { text: "Need Assistance", translated: "मलाई सहयोग चाहियो।" },
    { text: "Call Police", translated: "प्रहरीलाई फोन गर्नुहोस्।" },
    { text: "Need Hospital", translated: "मलाई अस्पताल जानुपर्छ।" },
    { text: "I Am Lost", translated: "म हराएँ।" },
  ],
};

const MODE_METADATA = {
  general: {
    title: "Voice Translator",
    desc: "Speak naturally and hear translations instantly.",
    class: "",
    label: "Modes: General",
  },
  shop: {
    title: "Shop Mode",
    desc: "Help tourists communicate while shopping in markets or local boutiques.",
    class: "theme-shop",
    label: "Modes: Shop",
  },
  taxi: {
    title: "Taxi Mode",
    desc: "Communicate with cab, auto-rickshaw, or ride-share drivers seamlessly.",
    class: "theme-taxi",
    label: "Modes: Taxi",
  },
  hotel: {
    title: "Hotel Mode",
    desc: "Navigate hotel room check-in, Wi-Fi networks, and hospitality services.",
    class: "theme-hotel",
    label: "Modes: Hotel",
  },
  dining: {
    title: "Dining Mode",
    desc: "Order local meals, specify spice tolerances, and request dining bills.",
    class: "theme-dining",
    label: "Modes: Dining",
  },
  emergency: {
    title: "Emergency Broadcast",
    desc: "High-visibility critical commands for stressful travel situations.",
    class: "theme-shop", // Employs crimson rose/red HSL
    label: "Modes: Emergency",
  },
};

// Compile dictionary bidirectionally
const DEMO_TRANSLATIONS = {
  hello: "नमस्ते",
  "thank you": "धन्यवाद",
  yes: "हो",
  no: "होइन",
  "how are you?": "तपाईंलाई कस्तो छ?",

  नमस्ते: "Hello / Namaste",
  धन्यवाद: "Thank you",
  हो: "Yes",
  होइन: "No",
};

// Inject phrases into the lookups
for (const mode in MODE_PHRASES) {
  MODE_PHRASES[mode].forEach((phrase) => {
    DEMO_TRANSLATIONS[phrase.text.toLowerCase().trim()] = phrase.translated;
    DEMO_TRANSLATIONS[phrase.translated.toLowerCase().trim()] = phrase.text;
  });
}

const API_BASE_URL =
  window.SPEAKON_API_BASE_URL ||
  (window.location.protocol === "file:" || window.location.port === "5500"
    ? "http://localhost:5000"
    : window.location.origin);

async function translateViaBackend(text) {
  const url = `${API_BASE_URL}/translate`;

  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text,
      source_lang: sourceLanguage.value,
      target_lang: targetLanguage.value,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Translate API error: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error);
  }

  return data.translated_text;
}

// -------------------------------------------------------------
// 2. DOM Elements Mapping
// -------------------------------------------------------------

const appShell = document.getElementById("appShell");

// Mode headers & triggers
const mainScreenTitle = document.getElementById("mainScreenTitle");
const mainScreenDesc = document.getElementById("mainScreenDesc");
const btnModesTrigger = document.getElementById("btnModesTrigger");
const btnClearModeContext = document.getElementById("btnClearModeContext");
const activeModeLabel = document.getElementById("activeModeLabel");

// Modal overlays
const modesModal = document.getElementById("modesModal");
const closeModesModal = document.getElementById("closeModesModal");

// Translator card specific mappings
const sourceLanguage = document.getElementById("sourceLanguage");
const targetLanguage = document.getElementById("targetLanguage");
const swapLanguages = document.getElementById("swapLanguages");
const micButton = document.getElementById("micButton");
const wavesContainer = document.getElementById("wavesContainer");
const statusBadge = document.getElementById("statusBadge");
const statusText = document.getElementById("statusText");
const statusInstruction = document.getElementById("statusInstruction");
const manualTextInput = document.getElementById("manualTextInput");
const btnManualTranslate = document.getElementById("btnManualTranslate");

// Quick phrases side card
const modePhrasesCard = document.getElementById("modePhrasesCard");
const phrasesCardTitle = document.getElementById("phrasesCardTitle");
const modePhrasesGrid = document.getElementById("modePhrasesGrid");

// Conversational Chat Container
const chatContainer = document.getElementById("chatContainer");
const btnConversationClear = document.getElementById("btnConversationClear");

// Category grids in Phrases Tab
const shoppingGrid = document.getElementById("cat-shopping");
const diningGrid = document.getElementById("cat-dining");
const transGrid = document.getElementById("cat-transportation");
const hotelGrid = document.getElementById("cat-hotel");

// History tab components
const historyList = document.getElementById("historyList");
const historyCount = document.getElementById("historyCount");
const btnClearHistory = document.getElementById("btnClearHistory");

// Toggle switches
const toggleAutoPlay = document.getElementById("toggleAutoPlay");
const speechSpeedSlider = document.getElementById("speechSpeedSlider");
const speechSpeedVal = document.getElementById("speechSpeedVal");
const toggleDarkMode = document.getElementById("toggleDarkMode");
const toggleHighContrast = document.getElementById("toggleHighContrast");
const btnResetBookmarks = document.getElementById("btnResetBookmarks");
const btnResetApp = document.getElementById("btnResetApp");

// Toast Feedbacks & Account elements
const toastNotification = document.getElementById("toastNotification");
const toastMessage = document.getElementById("toastMessage");
const openProfile = document.getElementById("openProfile");
const profileModal = document.getElementById("profileModal");
const closeProfileModal = document.getElementById("closeProfileModal");
const btnGoogleLogin = document.getElementById("btnGoogleLogin");
const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const btnEmailLogin = document.getElementById("btnEmailLogin");
const btnSwitchToSignUp = document.getElementById("btnSwitchToSignUp");
const connectivityBadge = document.getElementById("connectivityBadge");
const connectivityText = document.getElementById("connectivityText");

// -------------------------------------------------------------
// 3. Application State & Storage Setup
// -------------------------------------------------------------

let activeMode = "general"; // Default
let isListening = false;
let autoPlayActive = true;
let speechSpeedRate = 1.0;
let savedBookmarks = []; // Bookmarked favorites
let toastTimer;

// Isolated histories per mode
let historiesByMode = {
  general: [],
  shop: [],
  taxi: [],
  hotel: [],
  dining: [],
  emergency: [],
};

function initStorage() {
  // Theme settings reload
  if (localStorage.getItem("speakon_darkmode") === "true") {
    document.body.classList.add("dark-mode");
    toggleDarkMode.checked = true;
  }
  if (localStorage.getItem("speakon_highcontrast") === "true") {
    document.body.classList.add("high-contrast");
    toggleHighContrast.checked = true;
  }

  // Audio settings
  if (localStorage.getItem("speakon_autoplay") !== null) {
    autoPlayActive = localStorage.getItem("speakon_autoplay") === "true";
    toggleAutoPlay.checked = autoPlayActive;
  }
  if (localStorage.getItem("speakon_speed") !== null) {
    speechSpeedRate = parseFloat(localStorage.getItem("speakon_speed"));
    speechSpeedSlider.value = speechSpeedRate;
    speechSpeedVal.textContent = `${speechSpeedRate.toFixed(1)}x`;
  }

  // Reload bookmarks favorited
  if (localStorage.getItem("speakon_saved") !== null) {
    savedBookmarks = JSON.parse(localStorage.getItem("speakon_saved"));
  }

  // Reload isolated histories
  const modes = ["general", "shop", "taxi", "hotel", "dining", "emergency"];
  modes.forEach((mode) => {
    const cached = localStorage.getItem(`speakon_history_${mode}`);
    if (cached !== null) {
      historiesByMode[mode] = JSON.parse(cached);
    }
  });

  // Reload selected active mode on startup
  const savedActiveMode = localStorage.getItem("speakon_active_mode");
  if (savedActiveMode && modes.includes(savedActiveMode)) {
    setTranslatorMode(savedActiveMode, false);
  } else {
    setTranslatorMode("general", false);
  }

  renderHistoryTab();
  updateOfflineStatus();
}

function saveActiveHistory() {
  localStorage.setItem(
    `speakon_history_${activeMode}`,
    JSON.stringify(historiesByMode[activeMode]),
  );
  renderConversationList();
  renderHistoryTab();
}

function saveGlobalBookmarks() {
  localStorage.setItem("speakon_saved", JSON.stringify(savedBookmarks));
  renderConversationList();
  renderHistoryTab();
}

// -------------------------------------------------------------
// 4. Utility Handlers (Toasts, Network Connectivity, Modals)
// -------------------------------------------------------------

function showToast(message) {
  clearTimeout(toastTimer);
  toastMessage.textContent = message;
  toastNotification.classList.add("show");
  toastTimer = setTimeout(() => {
    toastNotification.classList.remove("show");
  }, 2400);
}

// Network indicator state watcher
function updateOfflineStatus() {
  if (navigator.onLine) {
    connectivityBadge.classList.remove("offline");
    connectivityText.textContent = "Online";
  } else {
    connectivityBadge.classList.add("offline");
    connectivityText.textContent = "Offline Mode";
  }
}
window.addEventListener("online", () => {
  updateOfflineStatus();
  showToast("Internet restored. Cloud engine online.");
});
window.addEventListener("offline", () => {
  updateOfflineStatus();
  showToast("Offline mode. Local dictionary engine active.");
});

// Profile Modal Interactions
openProfile.addEventListener("click", () => profileModal.classList.add("show"));
closeProfileModal.addEventListener("click", () =>
  profileModal.classList.remove("show"),
);
profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) profileModal.classList.remove("show");
});

btnGoogleLogin.addEventListener("click", () => {
  showToast("Google Authentication started...");
  setTimeout(() => {
    profileModal.classList.remove("show");
    showToast("Successfully logged in with Google!");
    openProfile.innerHTML = `<span style="font-weight:800; font-size:0.75rem; color:var(--primary);">Acc</span>`;
  }, 800);
});

btnEmailLogin.addEventListener("click", () => {
  if (emailInput.value && passwordInput.value) {
    showToast("Signing in...");
    setTimeout(() => {
      profileModal.classList.remove("show");
      showToast("Logged in successfully!");
      openProfile.innerHTML = `<span style="font-weight:800; font-size:0.75rem; color:var(--primary);">Acc</span>`;
    }, 700);
  } else {
    showToast("Please enter an email and password.");
  }
});

btnSwitchToSignUp.addEventListener("click", () => {
  showToast("Opening sign up portal...");
});

// -------------------------------------------------------------
// 5. Speech Synthesizers & Recorders
// -------------------------------------------------------------

function speakTranslation(text, customRate = null) {
  if (!("speechSynthesis" in window)) {
    showToast("Text-to-speech not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const targetNepali = targetLanguage.value === "Nepali";

  utterance.lang = targetNepali ? "ne-NP" : "en-US";
  utterance.rate = customRate || speechSpeedRate;

  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = null;
  if (targetNepali) {
    selectedVoice = voices.find(
      (v) => v.lang.includes("ne") || v.lang.includes("NP"),
    );
  } else {
    selectedVoice = voices.find(
      (v) => v.lang.includes("en-US") || v.lang.includes("en-GB"),
    );
  }
  if (selectedVoice) utterance.voice = selectedVoice;

  window.speechSynthesis.speak(utterance);
}

// Web Speech Recognition
const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    isListening = true;
    micButton.classList.add("listening");
    wavesContainer.classList.add("animating");

    statusBadge.className = "status-badge listening";
    statusText.textContent = "Listening";
    statusInstruction.textContent = "Please speak clearly into your device...";

    const fromEnglish = sourceLanguage.value === "English";
    recognition.lang = fromEnglish ? "en-US" : "ne-NP";
  };

  recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
    stopRecordingSession();

    if (event.error === "not-allowed") {
      showToast("Microphone access blocked. Enable permissions in settings.");
    } else {
      showToast("Microphone capture issue. Launching simulation fallback...");
      simulateSpeechInput();
    }
  };

  recognition.onend = () => {
    stopRecordingSession();
  };

  recognition.onresult = (event) => {
    const rawResult = event.results[0][0].transcript;
    if (rawResult) {
      processTranslation(rawResult);
    } else {
      showToast("No speech recognized. Try speaking again.");
    }
  };
}

function startRecordingSession() {
  if (recognition) {
    try {
      recognition.start();
    } catch (e) {
      recognition.stop();
      setTimeout(() => recognition.start(), 200);
    }
  } else {
    isListening = true;
    micButton.classList.add("listening");
    wavesContainer.classList.add("animating");

    statusBadge.className = "status-badge listening";
    statusText.textContent = "Listening";
    statusInstruction.textContent = "Simulating voice input...";

    setTimeout(() => {
      stopRecordingSession();
      simulateSpeechInput();
    }, 2400);
  }
}

function stopRecordingSession() {
  isListening = false;
  micButton.classList.remove("listening");
  wavesContainer.classList.remove("animating");

  statusBadge.className = "status-badge";
  statusText.textContent = "Ready";
  statusInstruction.textContent = "Tap the microphone and begin speaking";

  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {}
  }
}

function simulateSpeechInput() {
  const fromEnglish = sourceLanguage.value === "English";
  let fallbackText = "";

  if (fromEnglish) {
    if (activeMode === "shop") fallbackText = "How much does this cost?";
    else if (activeMode === "taxi")
      fallbackText = "Please take me to the airport.";
    else if (activeMode === "dining") fallbackText = "Can I see the menu?";
    else if (activeMode === "hotel") fallbackText = "I have a reservation.";
    else fallbackText = "Hello, how are you?";
  } else {
    if (activeMode === "shop") fallbackText = "यो कति रुपैयाँ हो?";
    else if (activeMode === "taxi") fallbackText = "मलाई विमानस्थल लैजानुहोस्।";
    else if (activeMode === "dining") fallbackText = "के म मेनु हेर्न सक्छु?";
    else if (activeMode === "hotel") fallbackText = "मेरो बुकिङ छ।";
    else fallbackText = "नमस्ते, तपाईंलाई कस्तो छ?";
  }

  showToast("Audio capture parsed.");
  processTranslation(fallbackText);
}

// -------------------------------------------------------------
// 6. Translation Engine
// -------------------------------------------------------------

async function processTranslation(sourceText) {
  if (!sourceText.trim()) {
    showToast("Type or speak a phrase to translate.");
    return;
  }

  statusBadge.className = "status-badge translating";
  statusText.textContent = "Translating";
  statusInstruction.textContent = "Processing local grammar dialects...";

  const originalLang = sourceLanguage.value;
  const translatedLang = targetLanguage.value;

  let resultText;
  try {
    resultText = await translateViaBackend(sourceText);
  } catch (error) {
    console.error("Backend translation error:", error);
    showToast("Backend translation failed. Please check the server.");
    statusBadge.className = "status-badge error";
    statusText.textContent = "Translation failed";
    statusInstruction.textContent = "Unable to get backend response.";
    return;
  }

  if (!resultText) {
    showToast("Backend returned no translation.");
    statusBadge.className = "status-badge error";
    statusText.textContent = "No translation";
    statusInstruction.textContent = "Backend response was empty.";
    return;
  }

  const entry = {
    id: Date.now(),
    from: originalLang,
    to: translatedLang,
    original: sourceText,
    translated: resultText,
    timestamp: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  };

  historiesByMode[activeMode].push(entry);
  saveActiveHistory();

  statusBadge.className = "status-badge ready-playback";
  statusText.textContent = "Playback Ready";
  statusInstruction.textContent = "Audio translation built!";

  if (autoPlayActive) {
    speakTranslation(resultText);
  }
}

// -------------------------------------------------------------
// 7. Dynamic UI Renderers
// -------------------------------------------------------------

function renderConversationList() {
  const currentLog = historiesByMode[activeMode];
  chatContainer.innerHTML = "";

  if (currentLog.length === 0) {
    chatContainer.innerHTML = `
      <div class="chat-empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p>Ready to translate. Tap the microphone or a quick phrase card above.</p>
      </div>
    `;
    return;
  }

  currentLog.forEach((entry) => {
    const sentRow = document.createElement("div");
    sentRow.className = "speech-row sent";
    sentRow.innerHTML = `
      <div class="speech-bubble">
        <div class="bubble-meta">👤 Tourist (${entry.from})</div>
        <div class="bubble-text">${entry.original}</div>
        <div class="bubble-time">${entry.timestamp}</div>
      </div>
    `;
    chatContainer.appendChild(sentRow);

    const recRow = document.createElement("div");
    recRow.className = "speech-row received";

    const isBookmarked = savedBookmarks.some(
      (b) => b.original === entry.original,
    );

    recRow.innerHTML = `
      <div class="speech-bubble">
        <div class="bubble-meta">🤖 Translation (${entry.to})</div>
        <div class="bubble-text">${entry.translated}</div>
        <div class="bubble-time">${entry.timestamp}</div>
        
        <div class="bubble-actions">
          <button class="action-icon-btn btn-action-play" title="Play Voice Audio" aria-label="Play translation voice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </button>
          
          <button class="action-icon-btn btn-action-slow" title="Slow Playback" aria-label="Play translation voice slowly">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a11 11 0 1 0 11 11A11 11 0 0 0 12 1Z" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </button>
          
          <button class="action-icon-btn btn-action-copy" title="Copy Translation Text" aria-label="Copy translated text">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          
          <button class="action-icon-btn btn-action-bookmark ${isBookmarked ? "saved" : ""}" title="Save Phrase" aria-label="Save phrase to favorites">
            <svg viewBox="0 0 24 24" fill="${isBookmarked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    `;

    // Hook bubble listeners
    recRow.querySelector(".btn-action-play").addEventListener("click", () => {
      speakTranslation(entry.translated, speechSpeedRate);
      showToast("Reading audio translation.");
    });
    recRow.querySelector(".btn-action-slow").addEventListener("click", () => {
      speakTranslation(entry.translated, 0.7);
      showToast("Reading slowly (0.7x speed).");
    });
    recRow.querySelector(".btn-action-copy").addEventListener("click", () => {
      navigator.clipboard.writeText(entry.translated);
      showToast("Copied to clipboard!");
    });
    recRow
      .querySelector(".btn-action-bookmark")
      .addEventListener("click", (e) => {
        const idx = savedBookmarks.findIndex(
          (b) => b.original === entry.original,
        );
        if (idx > -1) {
          savedBookmarks.splice(idx, 1);
          e.currentTarget.classList.remove("saved");
          e.currentTarget.querySelector("svg").setAttribute("fill", "none");
          showToast("Removed from saved phrases list.");
        } else {
          savedBookmarks.push(entry);
          e.currentTarget.classList.add("saved");
          e.currentTarget
            .querySelector("svg")
            .setAttribute("fill", "currentColor");
          showToast("Bookmarked to saved phrases.");
        }
        saveGlobalBookmarks();
      });

    chatContainer.appendChild(recRow);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderModePhrases() {
  modePhrasesGrid.innerHTML = "";

  if (activeMode === "general") {
    modePhrasesCard.style.display = "none";
    return;
  }

  // Show situational phrases card if in a business mode
  modePhrasesCard.style.display = "flex";
  phrasesCardTitle.textContent = `${MODE_METADATA[activeMode].title} Phrases`;

  MODE_PHRASES[activeMode].forEach((phraseObj) => {
    const chip = document.createElement("button");
    chip.className = "mode-phrase-btn";
    chip.innerHTML = `
      <span class="phrase-text">${phraseObj.text}</span>
      <span class="phrase-play-arrow">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
      </span>
    `;

    chip.addEventListener("click", () => {
      showToast("Playing quick phrase...");
      processTranslation(phraseObj.text);
    });

    modePhrasesGrid.appendChild(chip);
  });
}

function renderGlobalPhrasesTab() {
  const categories = ["shopping", "dining", "transportation", "hotel"];
  const grids = {
    shopping: shoppingGrid,
    dining: diningGrid,
    transportation: transGrid,
    hotel: hotelGrid,
  };

  categories.forEach((cat) => {
    const grid = grids[cat];
    if (!grid) return;

    grid.innerHTML = "";
    const mapKey =
      cat === "shopping" ? "shop" : cat === "transportation" ? "taxi" : cat;

    MODE_PHRASES[mapKey].forEach((phraseObj) => {
      const btn = document.createElement("button");
      btn.className = "phrase-row-btn";
      btn.innerHTML = `
        <span class="phrase-text">${phraseObj.text}</span>
        <span class="phrase-play-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </span>
      `;

      btn.addEventListener("click", () => {
        // Switch to appropriate tab and select context
        document
          .querySelectorAll(".nav-tab")
          .forEach((t) => t.classList.remove("active"));
        document
          .querySelector('.nav-tab[data-target="tab-translator"]')
          .classList.add("active");
        document
          .querySelectorAll(".tab-panel")
          .forEach((p) => p.classList.remove("active"));
        document.getElementById("tab-translator").classList.add("active");

        setTranslatorMode(mapKey);
        setTimeout(() => {
          processTranslation(phraseObj.text);
        }, 300);
      });

      grid.appendChild(btn);
    });
  });
}

function renderHistoryTab() {
  historyList.innerHTML = "";
  historyCount.textContent = `${savedBookmarks.length} bookmarked phrases`;

  const totalHistoryCount = Object.values(historiesByMode).reduce(
    (sum, list) => sum + list.length,
    0,
  );

  if (totalHistoryCount === 0 && savedBookmarks.length === 0) {
    historyList.innerHTML = `
      <div style="text-align:center; padding: 40px 10px; color:var(--text-muted);">
        <p>No translation logs found.</p>
      </div>
    `;
    return;
  }

  // Bookmarks first
  if (savedBookmarks.length > 0) {
    const bookmarkHeader = document.createElement("div");
    bookmarkHeader.className = "settings-group-title";
    bookmarkHeader.style.marginTop = "10px";
    bookmarkHeader.textContent = "⭐ Starred Favorites";
    historyList.appendChild(bookmarkHeader);

    savedBookmarks.forEach((fav) => {
      const item = document.createElement("div");
      item.className = "history-item";
      item.innerHTML = `
        <div class="history-meta">
          <span class="history-langs">${fav.from} → ${fav.to}</span>
          <div class="history-item-actions">
            <button class="action-icon-btn btn-fav-play" aria-label="Play audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
        </div>
        <span class="history-original">${fav.original}</span>
        <span class="history-translated">${fav.translated}</span>
      `;

      item.querySelector(".btn-fav-play").addEventListener("click", () => {
        speakTranslation(fav.translated);
      });

      historyList.appendChild(item);
    });
  }

  // Recents list
  const allRecents = [];
  for (const mode in historiesByMode) {
    historiesByMode[mode].forEach((entry) => {
      allRecents.push({ ...entry, mode: mode });
    });
  }

  if (allRecents.length > 0) {
    const recentHeader = document.createElement("div");
    recentHeader.className = "settings-group-title";
    recentHeader.style.marginTop = "20px";
    recentHeader.textContent = "🕰️ Recent Translations";
    historyList.appendChild(recentHeader);

    allRecents
      .sort((a, b) => b.id - a.id)
      .slice(0, 10)
      .forEach((recent) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
        <div class="history-meta">
          <span class="history-langs">${recent.from} → ${recent.to} (${recent.mode.toUpperCase()})</span>
          <div class="history-item-actions">
            <button class="action-icon-btn btn-recent-play" aria-label="Play audio">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
            </button>
          </div>
        </div>
        <span class="history-original">${recent.original}</span>
        <span class="history-translated">${recent.translated}</span>
      `;

        item.querySelector(".btn-recent-play").addEventListener("click", () => {
          speakTranslation(recent.translated);
        });

        historyList.appendChild(item);
      });
  }
}

// -------------------------------------------------------------
// 8. Navigation & Mode Transitions Coordinator
// -------------------------------------------------------------

function setTranslatorMode(modeKey, triggerToast = true) {
  const metadata = MODE_METADATA[modeKey];
  if (!metadata) return;

  if (isListening) stopRecordingSession();

  activeMode = modeKey;
  localStorage.setItem("speakon_active_mode", modeKey);

  // Update modes list modal highlighting
  document.querySelectorAll(".mode-selection-item").forEach((item) => {
    item.classList.remove("active");
    if (item.dataset.mode === modeKey) {
      item.classList.add("active");
    }
  });

  // Update Header Labels & pill
  activeModeLabel.textContent = metadata.label;
  mainScreenTitle.textContent = metadata.title;
  mainScreenDesc.textContent = metadata.desc;

  // Clear or apply theme modifiers
  appShell.className = "app-shell"; // Clear preceding
  if (metadata.class) {
    appShell.classList.add(metadata.class);
  }

  // Handle visual column extensions for modes
  const splitLayoutElement = document.querySelector(".mode-split-layout");
  if (modeKey === "general") {
    btnClearModeContext.style.display = "none";
    appShell.classList.remove("mode-active");
    splitLayoutElement.classList.remove("mode-active");
  } else {
    btnClearModeContext.style.display = "inline-flex";
    appShell.classList.add("mode-active");
    splitLayoutElement.classList.add("mode-active");
  }

  // Load contextual phrase lists
  renderModePhrases();

  // Load isolated conversation log
  renderConversationList();

  // Reset microphone instructions and badges
  statusBadge.className = "status-badge";
  statusText.textContent = "Ready";
  statusInstruction.textContent = "Tap the microphone and begin speaking";

  // Force alert contexts
  if (modeKey === "emergency") {
    sourceLanguage.value = "English";
    targetLanguage.value = "Nepali";
  }

  if (triggerToast) {
    showToast(`${metadata.title} activated.`);
  }
}

// Modes selection Modal toggles
btnModesTrigger.addEventListener("click", () =>
  modesModal.classList.add("show"),
);
closeModesModal.addEventListener("click", () =>
  modesModal.classList.remove("show"),
);
modesModal.addEventListener("click", (e) => {
  if (e.target === modesModal) modesModal.classList.remove("show");
});

// Bind list items inside modes selector modal
document.querySelectorAll(".mode-selection-item").forEach((item) => {
  item.addEventListener("click", () => {
    const key = item.dataset.mode;
    setTranslatorMode(key);
    modesModal.classList.remove("show");
  });
});

// Reset context shortcut
btnClearModeContext.addEventListener("click", () => {
  setTranslatorMode("general");
});

// Language Select Swaps
function swapSelectedLanguages() {
  const current = sourceLanguage.value;
  sourceLanguage.value = targetLanguage.value;
  targetLanguage.value = current;
  showToast(`Swapped Speaking Language to: ${sourceLanguage.value}`);
}
swapLanguages.addEventListener("click", swapSelectedLanguages);

// Microphone Button trigger
micButton.addEventListener("click", () => {
  if (isListening) {
    stopRecordingSession();
    showToast("Voice capture paused.");
  } else {
    startRecordingSession();
  }
});

// Manual Text inputs
btnManualTranslate.addEventListener("click", async () => {
  const text = manualTextInput.value;
  await processTranslation(text);
  manualTextInput.value = "";
});
manualTextInput.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const text = manualTextInput.value;
    await processTranslation(text);
    manualTextInput.value = "";
  }
});

// Clear conversation histories
btnConversationClear.addEventListener("click", () => {
  historiesByMode[activeMode] = [];
  saveActiveHistory();
  showToast("Cleared active conversation history.");
});

// Emergency Alert Buttons click
document.querySelectorAll(".emergency-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const phraseLabel = btn.dataset.phrase;

    // Load emergency context view first
    setTranslatorMode("emergency", false);

    setTimeout(() => {
      processTranslation(phraseLabel);
    }, 400);
  });
});

// -------------------------------------------------------------
// 9. Bottom Navigation Tabs
// -------------------------------------------------------------
document.querySelectorAll(".nav-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-tab")
      .forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");

    const targetId = tab.dataset.target;
    document
      .querySelectorAll(".tab-panel")
      .forEach((p) => p.classList.remove("active"));
    document.getElementById(targetId).classList.add("active");

    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// -------------------------------------------------------------
// 10. Settings Configuration Controls
// -------------------------------------------------------------

toggleAutoPlay.addEventListener("change", (e) => {
  autoPlayActive = e.target.checked;
  localStorage.setItem("speakon_autoplay", autoPlayActive);
  showToast(autoPlayActive ? "Auto-play enabled." : "Auto-play disabled.");
});

speechSpeedSlider.addEventListener("input", (e) => {
  speechSpeedRate = parseFloat(e.target.value);
  speechSpeedVal.textContent = `${speechSpeedRate.toFixed(1)}x`;
  localStorage.setItem("speakon_speed", speechSpeedRate);
});

toggleDarkMode.addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("dark-mode");
    localStorage.setItem("speakon_darkmode", "true");
    showToast("Softer dark theme activated.");
  } else {
    document.body.classList.remove("dark-mode");
    localStorage.setItem("speakon_darkmode", "false");
    showToast("Standard light theme active.");
  }
});

toggleHighContrast.addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("high-contrast");
    localStorage.setItem("speakon_highcontrast", "true");
    showToast("High contrast mode active.");
  } else {
    document.body.classList.remove("high-contrast");
    localStorage.setItem("speakon_highcontrast", "false");
    showToast("Standard text contrast active.");
  }
});

btnResetBookmarks.addEventListener("click", () => {
  savedBookmarks = [];
  saveGlobalBookmarks();
  showToast("Bookmarks deleted successfully.");
});

btnResetApp.addEventListener("click", () => {
  localStorage.clear();

  for (const m in historiesByMode) {
    historiesByMode[m] = [];
  }
  savedBookmarks = [];
  autoPlayActive = true;
  speechSpeedRate = 1.0;

  document.body.className = "";
  appShell.className = "app-shell";

  toggleAutoPlay.checked = true;
  speechSpeedSlider.value = 1.0;
  speechSpeedVal.textContent = "1.0x";
  toggleDarkMode.checked = false;
  toggleHighContrast.checked = false;

  setTranslatorMode("general", false);
  renderHistoryTab();

  showToast("Speak-On data successfully reset.");
});

// -------------------------------------------------------------
// 11. Initializer call execution
// -------------------------------------------------------------
initStorage();
renderGlobalPhrasesTab();
