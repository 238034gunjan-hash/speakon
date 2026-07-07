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
    { text: "How much does this cost?", translated: "à¤¯à¥‹ à¤•à¤¤à¤¿ à¤°à¥à¤ªà¥ˆà¤¯à¤¾à¤ à¤¹à¥‹?" },
    {
      text: "Can you lower the price?",
      translated: "à¤•à¥‡ à¤¤à¤ªà¤¾à¤ˆà¤‚ à¤®à¥‚à¤²à¥à¤¯ à¤˜à¤Ÿà¤¾à¤‰à¤¨ à¤¸à¤•à¥à¤¨à¥à¤¹à¥à¤¨à¥à¤›?",
    },
    { text: "I only want one.", translated: "à¤®à¤²à¤¾à¤ˆ à¤à¤‰à¤Ÿà¤¾ à¤®à¤¾à¤¤à¥à¤° à¤šà¤¾à¤¹à¤¿à¤¨à¥à¤›à¥¤" },
    {
      text: "Do you accept cards?",
      translated: "à¤•à¥‡ à¤¤à¤ªà¤¾à¤ˆà¤‚ à¤•à¤¾à¤°à¥à¤¡ à¤¸à¥à¤µà¥€à¤•à¤¾à¤° à¤—à¤°à¥à¤¨à¥à¤¹à¥à¤¨à¥à¤›?",
    },
    { text: "That is too expensive.", translated: "à¤¯à¥‹ à¤§à¥‡à¤°à¥ˆ à¤®à¤¹à¤à¤—à¥‹ à¤­à¤¯à¥‹à¥¤" },
    { text: "Can I see another one?", translated: "à¤•à¥‡ à¤® à¤…à¤°à¥à¤•à¥‹ à¤¹à¥‡à¤°à¥à¤¨ à¤¸à¤•à¥à¤›à¥?" },
  ],
  taxi: [
    {
      text: "Please take me to this location.",
      translated: "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤®à¤²à¤¾à¤ˆ à¤¯à¥‹ à¤ à¤¾à¤‰à¤à¤®à¤¾ à¤²à¥ˆà¤œà¤¾à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤",
    },
    { text: "Stop here.", translated: "à¤¯à¤¹à¤¾à¤ à¤°à¥‹à¤•à¥à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤" },
    { text: "How much is the fare?", translated: "à¤­à¤¾à¤¡à¤¾ à¤•à¤¤à¤¿ à¤¹à¥‹?" },
    { text: "Please drive slowly.", translated: "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤¬à¤¿à¤¸à¥à¤¤à¤¾à¤°à¥ˆ à¤¹à¤¾à¤•à¥à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤" },
    {
      text: "Can you wait for me?",
      translated: "à¤•à¥‡ à¤¤à¤ªà¤¾à¤ˆà¤‚ à¤®à¥‡à¤°à¥‹ à¤²à¤¾à¤—à¤¿ à¤ªà¤°à¥à¤–à¤¨ à¤¸à¤•à¥à¤¨à¥à¤¹à¥à¤¨à¥à¤›?",
    },
    {
      text: "Take me to the airport.",
      translated: "à¤®à¤²à¤¾à¤ˆ à¤µà¤¿à¤®à¤¾à¤¨à¤¸à¥à¤¥à¤² à¤²à¥ˆà¤œà¤¾à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤",
    },
  ],
  hotel: [
    { text: "I have a reservation.", translated: "à¤®à¥‡à¤°à¥‹ à¤¬à¥à¤•à¤¿à¤™ à¤›à¥¤" },
    {
      text: "I need a room for one night.",
      translated: "à¤®à¤²à¤¾à¤ˆ à¤à¤• à¤°à¤¾à¤¤à¤•à¥‹ à¤²à¤¾à¤—à¤¿ à¤•à¥‹à¤ à¤¾ à¤šà¤¾à¤¹à¤¿à¤¨à¥à¤›à¥¤",
    },
    { text: "Is breakfast included?", translated: "à¤•à¥‡ à¤¬à¤¿à¤¹à¤¾à¤¨à¤•à¥‹ à¤–à¤¾à¤¨à¤¾ à¤¸à¤®à¤¾à¤µà¥‡à¤¶ à¤›?" },
    { text: "The Wi-Fi is not working.", translated: "à¤µà¤¾à¤‡à¤«à¤¾à¤‡ à¤šà¤²à¥‡à¤•à¥‹ à¤›à¥ˆà¤¨à¥¤" },
    {
      text: "Can I get room service?",
      translated: "à¤•à¥‡ à¤® à¤•à¥‹à¤ à¤¾ à¤¸à¥‡à¤µà¤¾ à¤ªà¤¾à¤‰à¤¨ à¤¸à¤•à¥à¤›à¥?",
    },
    { text: "I want to check out.", translated: "à¤® à¤šà¥‡à¤• à¤†à¤‰à¤Ÿ à¤—à¤°à¥à¤¨ à¤šà¤¾à¤¹à¤¨à¥à¤›à¥à¥¤" },
  ],
  dining: [
    { text: "I would like to order.", translated: "à¤® à¤…à¤°à¥à¤¡à¤° à¤—à¤°à¥à¤¨ à¤šà¤¾à¤¹à¤¨à¥à¤›à¥à¥¤" },
    {
      text: "Do you have vegetarian food?",
      translated: "à¤•à¥‡ à¤¤à¤ªà¤¾à¤ˆà¤‚à¤¸à¤à¤— à¤¶à¤¾à¤•à¤¾à¤¹à¤¾à¤°à¥€ à¤–à¤¾à¤¨à¤¾ à¤›?",
    },
    {
      text: "No spicy food please.",
      translated: "à¤•à¥ƒà¤ªà¤¯à¤¾ à¤ªà¤¿à¤°à¥‹ à¤–à¤¾à¤¨à¤¾ à¤¨à¤¹à¤¾à¤²à¥à¤¨à¥à¤¹à¥‹à¤²à¤¾à¥¤",
    },
    { text: "Can I see the menu?", translated: "à¤•à¥‡ à¤® à¤®à¥‡à¤¨à¥ à¤¹à¥‡à¤°à¥à¤¨ à¤¸à¤•à¥à¤›à¥?" },
    { text: "The food was excellent.", translated: "à¤–à¤¾à¤¨à¤¾ à¤¨à¤¿à¤•à¥ˆ à¤®à¤¿à¤ à¥‹ à¤¥à¤¿à¤¯à¥‹à¥¤" },
    { text: "Can I get the bill?", translated: "à¤•à¥‡ à¤® à¤¬à¤¿à¤² à¤ªà¤¾à¤‰à¤¨ à¤¸à¤•à¥à¤›à¥?" },
  ],
  emergency: [
    { text: "Need Assistance", translated: "à¤®à¤²à¤¾à¤ˆ à¤¸à¤¹à¤¯à¥‹à¤— à¤šà¤¾à¤¹à¤¿à¤¯à¥‹à¥¤" },
    { text: "Call Police", translated: "à¤ªà¥à¤°à¤¹à¤°à¥€à¤²à¤¾à¤ˆ à¤«à¥‹à¤¨ à¤—à¤°à¥à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤" },
    { text: "Need Hospital", translated: "à¤®à¤²à¤¾à¤ˆ à¤…à¤¸à¥à¤ªà¤¤à¤¾à¤² à¤œà¤¾à¤¨à¥à¤ªà¤°à¥à¤›à¥¤" },
    { text: "I Am Lost", translated: "à¤® à¤¹à¤°à¤¾à¤à¤à¥¤" },
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

const MODE_TRANSLATION_CONTEXT = {
  general:
    "Everyday travel conversation. Keep the translation natural, polite, and broadly useful.",
  shop:
    "Local market or shop conversation. Expect prices, bargaining, discounts, quantities, checkout, payment, change, receipts, and product questions.",
  taxi:
    "Taxi, ride-share, bus, or local transport conversation. Expect directions, pickup/dropoff, fares, waiting, traffic, routes, luggage, and timing.",
  hotel:
    "Hotel or guesthouse conversation. Expect booking, check-in, checkout, room issues, Wi-Fi, breakfast, room service, keys, and hospitality requests.",
  dining:
    "Restaurant or cafe conversation. Expect menus, ordering, spice level, dietary needs, billing, water, table service, and food feedback.",
  emergency:
    "Urgent emergency conversation. Keep wording direct, clear, respectful, and easy to understand under stress.",
};

// Compile quick phrase lookups bidirectionally.
const DEMO_TRANSLATIONS = {
  hello: "Namaste",
  "thank you": "Dhanyabad",
  yes: "Ho",
  no: "Hoina",
  "how are you?": "Tapailai kasto cha?",
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
      mode: activeMode,
      mode_title: MODE_METADATA[activeMode]?.title || "General Mode",
      mode_context:
        MODE_TRANSLATION_CONTEXT[activeMode] || MODE_TRANSLATION_CONTEXT.general,
      recent_messages: activeMessages.slice(-6).map((message) => ({
        original_text: message.original_text,
        translated_text: message.translated_text,
        original_language: message.original_language,
        translated_language: message.translated_language,
      })),
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

const WHISPER_API_URL = `${API_BASE_URL}/transcribe`;

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
const conversationList = document.getElementById("conversationList");
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
const signedOutAccount = document.getElementById("signedOutAccount");
const signedInAccount = document.getElementById("signedInAccount");
const accountModalDescription = document.getElementById("accountModalDescription");
const accountAvatar = document.getElementById("accountAvatar");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const btnLogout = document.getElementById("btnLogout");
const connectivityBadge = document.getElementById("connectivityBadge");
const connectivityText = document.getElementById("connectivityText");

// -------------------------------------------------------------
// 3. Application State & Storage Setup
// -------------------------------------------------------------

let activeMode = "general"; // Default
let isListening = false;
let isTranscribing = false;
let autoPlayActive = true;
let speechSpeedRate = 1.0;
let savedBookmarks = []; // In-memory bookmarked favorites for the current session
let toastTimer;
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let availableSpeechVoices = [];
let conversations = [];
let activeConversation = null;
let activeMessages = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatConversationDate(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMessageTime(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function messageToEntry(message) {
  return {
    id: message.id,
    from: message.original_language,
    to: message.translated_language,
    original: message.original_text,
    translated: message.translated_text,
    timestamp: formatMessageTime(message.created_at),
    createdAt: message.created_at,
  };
}

async function parseApiResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function apiFetch(path, options = {}) {
  const response = await auth.fetchWithAuth(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
  return parseApiResponse(response);
}

async function loadConversations(selectFirst = true) {
  if (!auth.isLoggedIn()) {
    conversations = [];
    activeConversation = null;
    activeMessages = [];
    renderConversationSidebar();
    renderConversationList();
    renderHistoryTab();
    return;
  }

  try {
    const data = await apiFetch("/conversations");
    conversations = data.conversations || [];
    renderConversationSidebar();
    renderHistoryTab();

    if (selectFirst && conversations.length > 0) {
      await loadConversation(conversations[0].id);
    } else if (conversations.length === 0) {
      activeConversation = null;
      activeMessages = [];
      renderConversationList();
    }
  } catch (error) {
    console.error("Failed to load conversations:", error);
    showToast("Could not load conversation history.");
  }
}

async function createConversation() {
  const data = await apiFetch("/conversations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_language: sourceLanguage.value,
      target_language: targetLanguage.value,
    }),
  });

  activeConversation = data.conversation;
  activeMessages = [];
  conversations = [
    activeConversation,
    ...conversations.filter((item) => item.id !== activeConversation.id),
  ];
  renderConversationSidebar();
  renderConversationList();
  renderHistoryTab();
  return activeConversation;
}

async function ensureActiveConversation() {
  if (activeConversation) {
    return activeConversation;
  }
  return createConversation();
}

async function loadConversation(conversationId) {
  try {
    const data = await apiFetch(`/conversations/${conversationId}`);
    activeConversation = data.conversation;
    activeMessages = data.messages || [];
    sourceLanguage.value = activeConversation.source_language;
    targetLanguage.value = activeConversation.target_language;
    renderConversationSidebar();
    renderConversationList();
  } catch (error) {
    console.error("Failed to load conversation:", error);
    showToast("Could not open that conversation.");
  }
}

async function deleteConversation(conversationId) {
  try {
    await apiFetch(`/conversations/${conversationId}`, { method: "DELETE" });
    conversations = conversations.filter((item) => item.id !== conversationId);
    if (activeConversation?.id === conversationId) {
      activeConversation = null;
      activeMessages = [];
    }
    renderConversationSidebar();
    renderConversationList();
    renderHistoryTab();
    showToast("Conversation deleted.");
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    showToast("Could not delete conversation.");
  }
}

async function saveTranslatedMessage(entry) {
  if (!auth.isLoggedIn()) {
    throw new Error("Sign in to save conversation history.");
  }

  const conversation = await ensureActiveConversation();
  const data = await apiFetch("/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      conversation_id: conversation.id,
      sender: "user",
      original_text: entry.original,
      translated_text: entry.translated,
      original_language: entry.from,
      translated_language: entry.to,
      audio_url: entry.audio_url || null,
    }),
  });

  activeConversation = data.conversation;
  activeMessages.push(data.message);
  conversations = [
    activeConversation,
    ...conversations.filter((item) => item.id !== activeConversation.id),
  ];
  renderConversationSidebar();
  renderHistoryTab();
  return messageToEntry(data.message);
}

async function initApp() {
  setTranslatorMode("general", false);
  updateOfflineStatus();
  await loadConversations(true);
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
openProfile.addEventListener("click", () => {
  renderAccountModal();
  profileModal.classList.add("show");
});
closeProfileModal.addEventListener("click", () =>
  profileModal.classList.remove("show"),
);
profileModal.addEventListener("click", (e) => {
  if (e.target === profileModal) profileModal.classList.remove("show");
});

function updateProfileButton(user) {
  const firstName = user?.first_name?.trim();
  if (!firstName) return;

  openProfile.textContent = firstName.charAt(0).toUpperCase();
  openProfile.setAttribute("aria-label", `${firstName} account`);
  openProfile.title = firstName;
}

function resetProfileButton() {
  openProfile.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>`;
  openProfile.setAttribute("aria-label", "Profile Account");
  openProfile.removeAttribute("title");
}

updateProfileButton(auth.user);

function renderAccountModal() {
  const user = auth.user;
  const isSignedIn = auth.isLoggedIn() && user;

  signedOutAccount.hidden = Boolean(isSignedIn);
  signedInAccount.hidden = !isSignedIn;
  accountModalDescription.textContent = isSignedIn
    ? "You are signed in to Speak-On."
    : "Sign in to save and synchronize your language learning progress.";

  if (!isSignedIn) return;

  const firstName = user.first_name?.trim() || "User";
  accountAvatar.textContent = firstName.charAt(0).toUpperCase();
  accountName.textContent = firstName;
  accountEmail.textContent = user.email || "";
}

btnLogout.addEventListener("click", () => {
  auth.logout(false);
  conversations = [];
  activeConversation = null;
  activeMessages = [];
  resetProfileButton();
  renderAccountModal();
  renderConversationSidebar();
  renderConversationList();
  renderHistoryTab();
  profileModal.classList.remove("show");
  showToast("Logged out successfully.");
});

btnSwitchToSignUp.addEventListener("click", () => {
  window.location.href = "/signup.html";
});

function handleGoogleSignInFromProfile(response) {
  auth.googleSignIn(response.credential)
    .then(() => {
      showToast("Successfully logged in with Google!");
      profileModal.classList.remove("show");
      updateProfileButton(auth.user);
      renderAccountModal();
      loadConversations(true);
    })
    .catch((error) => {
      showToast("Google sign-in failed: " + error.message);
    });
}

auth.initGoogleButton(btnGoogleLogin, handleGoogleSignInFromProfile).catch((error) => {
  btnGoogleLogin.hidden = true;
  console.error(error);
});

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!emailInput.value || !passwordInput.value) {
    showToast("Please enter an email and password.");
    return;
  }

  btnEmailLogin.disabled = true;
  btnEmailLogin.textContent = "Signing in...";

  try {
    await auth.login(emailInput.value, passwordInput.value);
    profileModal.classList.remove("show");
    showToast("Logged in successfully!");
    updateProfileButton(auth.user);
    renderAccountModal();
    await loadConversations(true);
    loginForm.reset();
  } catch (error) {
    showToast(error.message);
  } finally {
    btnEmailLogin.disabled = false;
    btnEmailLogin.textContent = "Sign In";
  }
});

// -------------------------------------------------------------
// 5. Speech Synthesizers & Recorders
// -------------------------------------------------------------

const TTS_LANGUAGE_CONFIG = {
  English: {
    lang: "en-US",
    voiceLangs: ["en-US", "en-GB", "en"],
    voiceNames: ["english"],
  },
  Nepali: {
    lang: "ne-NP",
    voiceLangs: ["ne-NP", "ne", "hi-IN", "hi"],
    voiceNames: ["nepali", "hindi"],
  },
};

function refreshSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    availableSpeechVoices = [];
    return availableSpeechVoices;
  }

  availableSpeechVoices = window.speechSynthesis.getVoices();
  return availableSpeechVoices;
}

function getSpeechConfig(language) {
  return TTS_LANGUAGE_CONFIG[language] || TTS_LANGUAGE_CONFIG.English;
}

function findSpeechVoice(language) {
  const config = getSpeechConfig(language);
  const voices = refreshSpeechVoices();

  return (
    voices.find((voice) => config.voiceLangs.includes(voice.lang)) ||
    voices.find((voice) =>
      config.voiceLangs.some((lang) =>
        voice.lang.toLowerCase().startsWith(lang.toLowerCase().split("-")[0]),
      ),
    ) ||
    voices.find((voice) =>
      config.voiceNames.some((name) =>
        voice.name.toLowerCase().includes(name),
      ),
    ) ||
    null
  );
}

function initSpeechVoices() {
  if (!("speechSynthesis" in window)) {
    return;
  }

  refreshSpeechVoices();
  window.speechSynthesis.addEventListener("voiceschanged", refreshSpeechVoices);
}

function speakTranslation(text, customRate = null, language = targetLanguage.value) {
  if (!("speechSynthesis" in window)) {
    showToast("Text-to-speech not supported in this browser.");
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const speechConfig = getSpeechConfig(language);
  const selectedVoice = findSpeechVoice(language);

  utterance.lang = speechConfig.lang;
  utterance.rate = customRate || speechSpeedRate;

  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.onerror = () => {
    showToast(`Could not play ${language} voice on this device.`);
  };

  if (language === "Nepali" && !selectedVoice) {
    showToast("Nepali voice is not installed. Trying browser default voice.");
  }

  window.speechSynthesis.speak(utterance);
}

initSpeechVoices();

// Microphone capture and Whisper transcription
function setMicStatus(state, title, instruction) {
  statusBadge.className = `status-badge ${state}`.trim();
  statusText.textContent = title;
  statusInstruction.textContent = instruction;
}

function stopActiveStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
}

async function transcribeAudioBlob(audioBlob) {
  if (!audioBlob || audioBlob.size === 0) {
    throw new Error("empty-audio");
  }

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.webm");
  formData.append("language", sourceLanguage.value);

  const response = await fetch(WHISPER_API_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`whisper-api-${response.status}: ${errorText}`);
  }

  return response.json();
}

function startRecordingSession() {
  if (isListening || isTranscribing) {
    return;
  }

  if (!navigator.mediaDevices || !window.MediaRecorder) {
    showToast("Voice capture is not supported in this browser.");
    return;
  }

  isListening = true;
  micButton.classList.add("listening");
  wavesContainer.classList.add("animating");
  setMicStatus(
    "listening",
    "Listening",
    "Please speak clearly into your microphone...",
  );

  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      if (!isListening) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaStream = stream;
      recordedChunks = [];

      const preferredMimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];
      const mimeType = preferredMimeTypes.find((type) =>
        window.MediaRecorder.isTypeSupported(type),
      );

      mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error("MediaRecorder error:", event.error || event);
        stopRecordingSession();
        showToast("Microphone capture failed. Please try again.");
      };

      mediaRecorder.onstop = async () => {
        const currentRecorder = mediaRecorder;
        const audioBlob = new Blob(recordedChunks, {
          type: currentRecorder?.mimeType || "audio/webm",
        });

        recordedChunks = [];
        mediaRecorder = null;
        stopActiveStream();

        if (!audioBlob.size) {
          isTranscribing = false;
          setMicStatus("error", "No Audio", "No audio was captured. Try again.");
          showToast("No audio captured.");
          return;
        }

        isTranscribing = true;
        setMicStatus(
          "transcribing",
          "Transcribing",
          "Sending audio to Whisper for speech-to-text...",
        );

        try {
          const response = await transcribeAudioBlob(audioBlob);
          const transcript = (response && response.text ? String(response.text) : "").trim();

          console.log("Whisper transcript received:", transcript);

          if (!transcript) {
            throw new Error("empty-transcript");
          }

          showToast(
            response.language
              ? `Transcribed ${response.language} audio.`
              : "Audio transcribed successfully.",
          );
          await processTranslation(transcript);
        } catch (error) {
          console.error("Whisper transcription error:", error);
          const message = String(error?.message || error);

          if (message.includes("empty-audio")) {
            showToast("No audio was captured. Please try again.");
          } else if (message.includes("empty-transcript")) {
            setMicStatus(
              "error",
              "No Text",
              "Speech was captured, but Whisper returned no transcript.",
            );
            showToast("Whisper returned no text.");
          } else {
            setMicStatus(
              "error",
              "Transcription Failed",
              "Unable to convert audio to text.",
            );
            showToast("Transcription failed. Please try again.");
          }
        } finally {
          isTranscribing = false;
        }
      };

      try {
        mediaRecorder.start();
      } catch (error) {
        console.error("Failed to start MediaRecorder:", error);
        stopRecordingSession();
        showToast("Could not start microphone recording.");
      }
    })
    .catch((error) => {
      console.error("Microphone permission error:", error);
      isListening = false;
      micButton.classList.remove("listening");
      wavesContainer.classList.remove("animating");
      setMicStatus(
        "error",
        "Permission Needed",
        "Allow microphone access to use voice input.",
      );

      if (error && error.name === "NotAllowedError") {
        showToast("Microphone permission denied.");
      } else {
        showToast("Unable to access microphone.");
      }
    });
}

function stopRecordingSession() {
  isListening = false;
  micButton.classList.remove("listening");
  wavesContainer.classList.remove("animating");

  if (mediaRecorder && mediaRecorder.state === "recording") {
    try {
      mediaRecorder.stop();
    } catch (e) {}
    return;
  }

  if (!isTranscribing) {
    setMicStatus("", "Ready", "Tap the microphone and begin speaking");
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
    if (activeMode === "shop") fallbackText = "à¤¯à¥‹ à¤•à¤¤à¤¿ à¤°à¥à¤ªà¥ˆà¤¯à¤¾à¤ à¤¹à¥‹?";
    else if (activeMode === "taxi") fallbackText = "à¤®à¤²à¤¾à¤ˆ à¤µà¤¿à¤®à¤¾à¤¨à¤¸à¥à¤¥à¤² à¤²à¥ˆà¤œà¤¾à¤¨à¥à¤¹à¥‹à¤¸à¥à¥¤";
    else if (activeMode === "dining") fallbackText = "à¤•à¥‡ à¤® à¤®à¥‡à¤¨à¥ à¤¹à¥‡à¤°à¥à¤¨ à¤¸à¤•à¥à¤›à¥?";
    else if (activeMode === "hotel") fallbackText = "à¤®à¥‡à¤°à¥‹ à¤¬à¥à¤•à¤¿à¤™ à¤›à¥¤";
    else fallbackText = "à¤¨à¤®à¤¸à¥à¤¤à¥‡, à¤¤à¤ªà¤¾à¤ˆà¤‚à¤²à¤¾à¤ˆ à¤•à¤¸à¥à¤¤à¥‹ à¤›?";
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

  let savedEntry = entry;
  try {
    savedEntry = await saveTranslatedMessage(entry);
  } catch (error) {
    console.error("Failed to save message:", error);
    activeMessages.push({
      id: entry.id,
      sender: "user",
      original_text: entry.original,
      translated_text: entry.translated,
      original_language: entry.from,
      translated_language: entry.to,
      audio_url: null,
      created_at: new Date().toISOString(),
    });
    showToast("Translation ready, but history was not saved.");
  }

  renderConversationList();

  statusBadge.className = "status-badge ready-playback";
  statusText.textContent = "Playback Ready";
  statusInstruction.textContent = "Audio translation built!";

  if (autoPlayActive) {
    speakTranslation(savedEntry.translated, null, savedEntry.to);
  }
}

// -------------------------------------------------------------
// 7. Dynamic UI Renderers
// -------------------------------------------------------------

function renderConversationList() {
  const currentLog = activeMessages.map(messageToEntry);
  chatContainer.innerHTML = "";

  if (currentLog.length === 0) {
    chatContainer.innerHTML = `
      <div class="chat-empty-state">
        <div class="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <p>${auth.isLoggedIn() ? "Start a new translation or reopen a saved conversation." : "Sign in to save and sync conversation history."}</p>
      </div>
    `;
    return;
  }

  currentLog.forEach((entry) => {
    const sentRow = document.createElement("div");
    sentRow.className = "speech-row sent";
    sentRow.innerHTML = `
      <div class="speech-bubble">
        <div class="bubble-meta">Tourist (${entry.from})</div>
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
        <div class="bubble-meta">– Translation (${entry.to})</div>
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
      speakTranslation(entry.translated, speechSpeedRate, entry.to);
      showToast("Reading audio translation.");
    });
    recRow.querySelector(".btn-action-slow").addEventListener("click", () => {
      speakTranslation(entry.translated, 0.7, entry.to);
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
        renderConversationList();
        renderHistoryTab();
      });

    chatContainer.appendChild(recRow);
  });

  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function renderConversationSidebar() {
  if (!conversationList) {
    return;
  }

  conversationList.innerHTML = "";

  if (!auth.isLoggedIn()) {
    conversationList.innerHTML = `<div class="conversation-empty">Sign in to sync conversations.</div>`;
    return;
  }

  if (conversations.length === 0) {
    conversationList.innerHTML = `<div class="conversation-empty">No conversations yet.</div>`;
    return;
  }

  conversations.forEach((conversation) => {
    const item = document.createElement("button");
    item.className = `conversation-item ${activeConversation?.id === conversation.id ? "active" : ""}`;
    item.type = "button";
    item.innerHTML = `
      <span class="conversation-item-main">
        <span class="conversation-item-title">${escapeHtml(conversation.title)}</span>
        <span class="conversation-item-meta">${escapeHtml(conversation.source_language)} <-> ${escapeHtml(conversation.target_language)}</span>
      </span>
      <span class="conversation-item-date">${escapeHtml(formatConversationDate(conversation.updated_at))}</span>
      <span class="conversation-delete" title="Delete conversation" aria-label="Delete conversation">x</span>
    `;

    item.addEventListener("click", () => loadConversation(conversation.id));
    item.querySelector(".conversation-delete").addEventListener("click", (event) => {
      event.stopPropagation();
      deleteConversation(conversation.id);
    });
    conversationList.appendChild(item);
  });
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
  historyCount.textContent = `${conversations.length} database conversations`;

  if (!auth.isLoggedIn()) {
    historyList.innerHTML = `
      <div style="text-align:center; padding: 40px 10px; color:var(--text-muted);">
        <p>Sign in to view synchronized conversation history.</p>
      </div>
    `;
    return;
  }

  if (conversations.length === 0) {
    historyList.innerHTML = `
      <div style="text-align:center; padding: 40px 10px; color:var(--text-muted);">
        <p>No conversations saved yet.</p>
      </div>
    `;
    return;
  }

  conversations.forEach((conversation) => {
    const item = document.createElement("button");
    item.className = "history-item conversation-history-item";
    item.type = "button";
    item.innerHTML = `
      <div class="history-meta">
        <span class="history-langs">${escapeHtml(conversation.source_language)} <-> ${escapeHtml(conversation.target_language)}</span>
        <span>${escapeHtml(formatConversationDate(conversation.updated_at))}</span>
      </div>
      <span class="history-original">${escapeHtml(conversation.title)}</span>
      <span class="history-translated">${conversation.message_count || 0} messages</span>
    `;
    item.addEventListener("click", () => {
      loadConversation(conversation.id);
      document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
      document.querySelector('.nav-tab[data-target="tab-translator"]').classList.add("active");
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      document.getElementById("tab-translator").classList.add("active");
    });
    historyList.appendChild(item);
  });
}

// -------------------------------------------------------------
// 8. Navigation & Mode Transitions Coordinator
// -------------------------------------------------------------

function setTranslatorMode(modeKey, triggerToast = true) {
  const metadata = MODE_METADATA[modeKey];
  if (!metadata) return;

  if (isListening) stopRecordingSession();

  activeMode = modeKey;

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

// New database-backed conversation
btnConversationClear.addEventListener("click", async () => {
  if (!auth.isLoggedIn()) {
    showToast("Sign in to create synced conversations.");
    return;
  }

  try {
    await createConversation();
    showToast("New conversation started.");
  } catch (error) {
    console.error("Failed to create conversation:", error);
    showToast("Could not start a new conversation.");
  }
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
  showToast(autoPlayActive ? "Auto-play enabled." : "Auto-play disabled.");
});

speechSpeedSlider.addEventListener("input", (e) => {
  speechSpeedRate = parseFloat(e.target.value);
  speechSpeedVal.textContent = `${speechSpeedRate.toFixed(1)}x`;
});

toggleDarkMode.addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("dark-mode");
    showToast("Softer dark theme activated.");
  } else {
    document.body.classList.remove("dark-mode");
    showToast("Standard light theme active.");
  }
});

toggleHighContrast.addEventListener("change", (e) => {
  if (e.target.checked) {
    document.body.classList.add("high-contrast");
    showToast("High contrast mode active.");
  } else {
    document.body.classList.remove("high-contrast");
    showToast("Standard text contrast active.");
  }
});

btnResetBookmarks.addEventListener("click", () => {
  savedBookmarks = [];
  renderConversationList();
  renderHistoryTab();
  showToast("Bookmarks deleted successfully.");
});

btnClearHistory.addEventListener("click", async () => {
  await loadConversations(false);
  showToast("Conversation history refreshed.");
});

btnResetApp.addEventListener("click", () => {
  savedBookmarks = [];
  activeConversation = null;
  activeMessages = [];
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
  renderConversationList();
  renderHistoryTab();

  showToast("Speak-On screen settings reset.");
});

// -------------------------------------------------------------
// 11. Initializer call execution
// -------------------------------------------------------------
initApp();
renderGlobalPhrasesTab();
