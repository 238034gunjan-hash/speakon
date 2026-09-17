/**
 * Speak-On Voice Translator - Main Application Logic
 * Implements translation, Edge TTS playback, persistent local storage,
 * dynamic theme switching, categorized phrases, and emergency triggers.
 */

// -------------------------------------------------------------
// 1. Core Data Constants (Dictionary & Categorized Phrases)
// -------------------------------------------------------------

// Quick Phrases are audience-aware, not just direction-aware.
//
//   enToNe -> an English-speaking tourist in Nepal: things a visitor asks for.
//   neToEn -> a Nepali shopkeeper, driver, receptionist or waiter: things a
//             service provider says to a visitor.
//
// The two lists are therefore different conversations, not mirror images of
// each other. `source` is always the language the user speaks, `target` the
// natural-sounding wording they are aiming for. The live translation still
// comes from the backend; `target` documents the intent of each phrase.
//
// Category keys match the mode keys in MODE_METADATA, so the situational card
// in a mode and the category in the Phrases tab share one list.

const PHRASE_CATEGORIES = [
  { key: "shop", icon: "\u{1F6CD}\u{FE0F}" },
  { key: "taxi", icon: "\u{1F695}" },
  { key: "hotel", icon: "\u{1F3E8}" },
  { key: "dining", icon: "\u{1F37D}\u{FE0F}" },
];

const QUICK_PHRASES = {
  // Tourist speaking: what a visitor needs to ask a local.
  enToNe: {
    shop: [
      { source: "How much does this cost?", target: "यसको मूल्य कति हो?" },
      { source: "Can you give me a discount?", target: "अलिकति छुट दिन मिल्छ?" },
      { source: "Do you have this in another color?", target: "यो अर्को रङमा पनि छ?" },
      { source: "Do you have a smaller size?", target: "अलि सानो साइज छ?" },
      { source: "I would like to buy this.", target: "मलाई यो किन्नु छ।" },
      { source: "Can I pay by card?", target: "कार्डबाट तिर्न मिल्छ?" },
      { source: "Is this the final price?", target: "यही नै अन्तिम मूल्य हो?" },
    ],
    taxi: [
      { source: "How much to the airport?", target: "एयरपोर्टसम्म कति लाग्छ?" },
      { source: "Please take me to this address.", target: "कृपया मलाई यो ठेगानामा लैजानुहोस्।" },
      { source: "How long will it take?", target: "पुग्न कति समय लाग्छ?" },
      { source: "Can you use the meter?", target: "मिटरबाट जान मिल्छ?" },
      { source: "Please stop here.", target: "कृपया यहिँ रोक्नुहोस्।" },
      { source: "I am going to Thamel.", target: "म ठमेल जाँदैछु।" },
      { source: "Can you wait for me?", target: "मलाई अलिकति पर्खिन सक्नुहुन्छ?" },
    ],
    hotel: [
      { source: "I have a reservation.", target: "मैले बुकिङ गरेको छु।" },
      { source: "Where is my room?", target: "मेरो कोठा कता हो?" },
      { source: "What time is breakfast?", target: "बिहानको खाना कति बजे हुन्छ?" },
      { source: "Is Wi-Fi available?", target: "यहाँ वाइफाइ छ?" },
      { source: "Can I check in early?", target: "अलि चाँडै चेक-इन गर्न मिल्छ?" },
      { source: "I need an extra towel.", target: "मलाई एउटा थप तौलिया चाहियो।" },
      { source: "Can you call a taxi for me?", target: "मेरो लागि ट्याक्सी बोलाइदिनुहुन्छ?" },
    ],
    dining: [
      { source: "Can I see the menu?", target: "मेनु हेर्न पाइन्छ?" },
      { source: "Is this vegetarian?", target: "यो शाकाहारी हो?" },
      { source: "Is this spicy?", target: "यो पिरो छ?" },
      { source: "I don't eat meat.", target: "म मासु खाँदिनँ।" },
      { source: "Can I have some water?", target: "अलिकति पानी पाउँ?" },
      { source: "I would like to order this.", target: "मलाई यो अर्डर गर्नु छ।" },
      { source: "Can I get the bill?", target: "बिल ल्याइदिनुहुन्छ?" },
    ],
  },

  // Local speaking: what a shopkeeper, driver, hotel or restaurant worker
  // needs to say to an English-speaking visitor.
  neToEn: {
    shop: [
      { source: "तपाईंलाई के चाहिन्छ?", target: "What are you looking for?" },
      { source: "यो कति वटा चाहिन्छ?", target: "How many would you like?" },
      { source: "यो यसको अन्तिम मूल्य हो।", target: "This is the final price." },
      { source: "म तपाईंलाई केही छुट दिन सक्छु।", target: "I can give you a discount." },
      { source: "तपाईंलाई अर्को रङ चाहिन्छ?", target: "Would you like a different color?" },
      { source: "यो अर्को साइजमा पनि छ।", target: "We have this in other sizes too." },
      { source: "तपाईं कार्ड वा नगदमा तिर्नुहुन्छ?", target: "Would you like to pay by card or cash?" },
      { source: "यो राम्रो गुणस्तरको हो।", target: "This is good quality." },
      { source: "तपाईंलाई अरू केही चाहिन्छ?", target: "Can I get you anything else?" },
      { source: "फिर्ता गर्न मिल्दैन।", target: "Sorry, we don't accept returns." },
    ],
    taxi: [
      { source: "तपाईं कहाँ जान चाहनुहुन्छ?", target: "Where would you like to go?" },
      { source: "कुन होटलमा जाने हो?", target: "Which hotel are you going to?" },
      { source: "त्यहाँ पुग्न लगभग ३० मिनेट लाग्छ।", target: "It takes about 30 minutes to get there." },
      { source: "बाटोमा धेरै ट्राफिक छ।", target: "There is a lot of traffic on the way." },
      { source: "मिटरबाट जाने हो?", target: "Shall we go by the meter?" },
      { source: "यहाँबाट ट्याक्सी लिन सजिलो हुन्छ।", target: "It is easy to get a taxi from here." },
      { source: "म तपाईंलाई यहाँसम्म पुर्याउँछु।", target: "I can drop you off right here." },
      { source: "तपाईंलाई एयरपोर्ट जानु छ?", target: "Are you heading to the airport?" },
      { source: "म तपाईंलाई पर्खिन सक्छु।", target: "I can wait for you." },
      { source: "भाडा यति हुन्छ।", target: "The fare comes to this much." },
    ],
    hotel: [
      { source: "तपाईंको बुकिङ छ?", target: "Do you have a reservation?" },
      { source: "कृपया आफ्नो पासपोर्ट देखाउनुहोस्।", target: "Could I see your passport, please?" },
      { source: "तपाईंको कोठा तयार छ।", target: "Your room is ready." },
      { source: "तपाईंको कोठा दोस्रो तलामा छ।", target: "Your room is on the second floor." },
      { source: "बिहानको खाना ७ बजेदेखि १० बजेसम्म हुन्छ।", target: "Breakfast is served from 7 to 10." },
      { source: "यहाँ Wi-Fi को पासवर्ड छ।", target: "Here is the Wi-Fi password." },
      { source: "तपाईंलाई अरू केही चाहिन्छ?", target: "Is there anything else you need?" },
      { source: "हामी तपाईंको लागि ट्याक्सी बोलाइदिन सक्छौँ।", target: "We can call a taxi for you." },
      { source: "चेक-आउट १२ बजेसम्म गर्नुपर्छ।", target: "Check-out is by 12 o'clock." },
      { source: "तपाईंलाई आफ्नो बसाइ कस्तो लागिरहेको छ?", target: "How are you enjoying your stay?" },
    ],
    dining: [
      { source: "तपाईंलाई टेबल चाहिन्छ?", target: "Would you like a table?" },
      { source: "कति जनाको लागि हो?", target: "How many people is it for?" },
      { source: "तपाईंलाई मेनु दिन्छु।", target: "Here is the menu." },
      { source: "तपाईंले के अर्डर गर्नुहुन्छ?", target: "What would you like to order?" },
      { source: "तपाईंलाई केही पिउन चाहिन्छ?", target: "Would you like something to drink?" },
      { source: "यो परिकार अलि पिरो छ।", target: "This dish is a little spicy." },
      { source: "यो शाकाहारी परिकार हो।", target: "This is a vegetarian dish." },
      { source: "तपाईंलाई अरू केही चाहिन्छ?", target: "Can I get you anything else?" },
      { source: "तपाईंको खाना केही बेरमा तयार हुन्छ।", target: "Your food will be ready shortly." },
      { source: "के म बिल ल्याइदिउँ?", target: "Shall I bring you the bill?" },
      { source: "तपाईं कार्ड वा नगदमा तिर्नुहुन्छ?", target: "Will you be paying by card or cash?" },
    ],
  },
};

const MODE_METADATA = {
  general: {
    title: "Voice Translator",
    class: "",
    label: "Modes: General",
  },
  shop: {
    title: "Shop Mode",
    class: "theme-shop",
    label: "Modes: Shop",
  },
  taxi: {
    title: "Taxi Mode",
    class: "theme-taxi",
    label: "Modes: Taxi",
  },
  hotel: {
    title: "Hotel Mode",
    class: "theme-hotel",
    label: "Modes: Hotel",
  },
  dining: {
    title: "Dining Mode",
    class: "theme-dining",
    label: "Modes: Dining",
  },
  emergency: {
    title: "Emergency Broadcast",
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

// -------------------------------------------------------------
// 1B. Directional UI Copy
// -------------------------------------------------------------
// Every string that should follow the selected translation direction lives
// here. The direction itself is derived from the existing language selects,
// so there is no second source of truth to keep in sync.

const UI_TEXT = {
  enToNe: {
    directionLabel: "English → नेपाली",
    sourceFieldLabel: "Speaking",
    targetFieldLabel: "Translation",
    speakPrompt: "Speak in English",
    micInstruction: "Tap the microphone to start speaking.",
    listeningTitle: "Listening",
    listeningInstruction: "Please speak clearly in English...",
    transcribingTitle: "Transcribing",
    transcribingInstruction: "Converting your English speech to text...",
    translatingTitle: "Translating",
    translatingInstruction: "Preparing your Nepali translation...",
    readyTitle: "Ready",
    playbackTitle: "Playback Ready",
    playbackInstruction: "Your Nepali audio is ready.",
    noAudioTitle: "No Audio",
    noAudioInstruction: "No audio was captured. Try again.",
    noAudioToast: "No audio captured.",
    noTextTitle: "No Text",
    noTextInstruction: "Speech was captured, but no words were recognised.",
    noTextToast: "No speech was recognised.",
    transcribeFailedTitle: "Transcription Failed",
    transcribeFailedInstruction: "Unable to convert your speech to text.",
    transcribeFailedToast: "Transcription failed. Please try again.",
    permissionTitle: "Permission Needed",
    permissionInstruction: "Allow microphone access to use voice input.",
    permissionToast: "Microphone permission denied.",
    translateFailedTitle: "Translation failed",
    translateFailedInstruction: "Unable to reach the translation service.",
    translateFailedToast: "Translation failed. Please check your connection.",
    emptyTranslationTitle: "No translation",
    emptyTranslationInstruction: "No translation came back. Please try again.",
    manualPlaceholder: "Or type English text here...",
    chatEmptySignedIn: "Your Nepali translation will appear here.",
    chatEmptySignedOut: "Sign in to save and sync conversation history.",
    bubbleSourceLabel: "You (English)",
    bubbleTargetLabel: "Nepali Translation",
    phrasesCardDesc: "Tap to translate and hear it in Nepali",
    phrasesTabTitle: "Quick Phrases",
    phrasesTabSubtitle: "Phrases a traveller in Nepal needs, ready to say in Nepali.",
    categories: {
      shop: "Shopping",
      taxi: "Taxi",
      hotel: "Hotel",
      dining: "Dining",
    },
    modeTitles: {
      general: "Voice Translator",
      shop: "Shop Mode",
      taxi: "Taxi Mode",
      hotel: "Hotel Mode",
      dining: "Dining Mode",
      emergency: "Emergency Broadcast",
    },
    modeLabels: {
      general: "Modes: General",
      shop: "Modes: Shop",
      taxi: "Modes: Taxi",
      hotel: "Modes: Hotel",
      dining: "Modes: Dining",
      emergency: "Modes: Emergency",
    },
    // Wording used inside the mode picker, where "General Mode" reads better
    // than the screen heading "Voice Translator".
    modesModalTitle: "Select Translation Mode",
    modeMenuTitles: {
      general: "General Mode",
      shop: "Shop Mode",
      taxi: "Taxi Mode",
      hotel: "Hotel Mode",
      dining: "Dining Mode",
    },
    modeActivatedToast: "{mode} activated.",
    phrasesCardTitleSuffix: "Phrases",
    resetModeLabel: "Reset Mode",
    swapToast: "Now translating English to Nepali.",
    qpTranslating: "Translating...",
    qpTranslateFailed: "Translation failed. Tap to retry.",
    chatTitle: "Conversations",
    newChatLabel: "New Chat",
    sidebarSignedOut: "Sign in to sync conversations.",
    sidebarEmpty: "No conversations yet.",
    emergencyTitle: "Emergency Quick-Access",
    emergencyTag: "Tap for instant audio help",
    emergencyLabels: {
      assistance: "Need Assistance",
      police: "Call Police",
      hospital: "Need Hospital",
      lost: "I Am Lost",
    },
  },

  neToEn: {
    directionLabel: "नेपाली → English",
    sourceFieldLabel: "बोल्ने भाषा",
    targetFieldLabel: "अनुवाद",
    speakPrompt: "नेपालीमा बोल्नुहोस्",
    micInstruction: "माइक्रोफोन थिचेर बोल्न सुरु गर्नुहोस्।",
    listeningTitle: "सुन्दै",
    listeningInstruction: "कृपया स्पष्ट रूपमा नेपालीमा बोल्नुहोस्...",
    transcribingTitle: "लेख्दै",
    transcribingInstruction: "तपाईंको नेपाली बोली पाठमा रूपान्तरण गर्दै...",
    translatingTitle: "अनुवाद गर्दै",
    translatingInstruction: "तपाईंको अंग्रेजी अनुवाद तयार गर्दै...",
    readyTitle: "तयार",
    playbackTitle: "सुन्न तयार",
    playbackInstruction: "तपाईंको अंग्रेजी अडियो तयार छ।",
    noAudioTitle: "अडियो आएन",
    noAudioInstruction: "कुनै आवाज रेकर्ड भएन। फेरि प्रयास गर्नुहोस्।",
    noAudioToast: "कुनै आवाज रेकर्ड भएन।",
    noTextTitle: "शब्द चिनिएन",
    noTextInstruction: "आवाज त आयो, तर कुनै शब्द चिन्न सकिएन।",
    noTextToast: "बोली चिन्न सकिएन।",
    transcribeFailedTitle: "लेख्न असफल",
    transcribeFailedInstruction: "तपाईंको बोली पाठमा बदल्न सकिएन।",
    transcribeFailedToast: "बोली पाठमा बदल्न सकिएन। फेरि प्रयास गर्नुहोस्।",
    permissionTitle: "अनुमति चाहियो",
    permissionInstruction: "आवाज प्रयोग गर्न माइक्रोफोनको अनुमति दिनुहोस्।",
    permissionToast: "माइक्रोफोनको अनुमति दिइएन।",
    translateFailedTitle: "अनुवाद असफल",
    translateFailedInstruction: "अनुवाद सेवासँग जोडिन सकिएन।",
    translateFailedToast: "अनुवाद असफल भयो। इन्टरनेट जाँच गर्नुहोस्।",
    emptyTranslationTitle: "अनुवाद आएन",
    emptyTranslationInstruction: "कुनै अनुवाद आएन। फेरि प्रयास गर्नुहोस्।",
    manualPlaceholder: "वा यहाँ नेपालीमा लेख्नुहोस्...",
    chatEmptySignedIn: "तपाईंको अंग्रेजी अनुवाद यहाँ देखिनेछ।",
    chatEmptySignedOut: "वार्तालाप सुरक्षित गर्न साइन इन गर्नुहोस्।",
    bubbleSourceLabel: "तपाईं (नेपाली)",
    bubbleTargetLabel: "English Translation",
    phrasesCardDesc: "थिचेर अंग्रेजीमा अनुवाद गरी सुनाउनुहोस्",
    phrasesTabTitle: "द्रुत वाक्यहरू",
    phrasesTabSubtitle: "पर्यटकसँग कुरा गर्दा चाहिने वाक्यहरू, तुरुन्तै अंग्रेजीमा।",
    categories: {
      shop: "पसल",
      taxi: "ट्याक्सी",
      hotel: "होटल",
      dining: "डाइनिङ",
    },
    modeTitles: {
      general: "आवाज अनुवादक",
      shop: "पसल मोड",
      taxi: "ट्याक्सी मोड",
      hotel: "होटल मोड",
      dining: "खानपान मोड",
      emergency: "आपतकालीन प्रसारण",
    },
    modeLabels: {
      general: "मोड: सामान्य",
      shop: "मोड: पसल",
      taxi: "मोड: ट्याक्सी",
      hotel: "मोड: होटल",
      dining: "मोड: खानपान",
      emergency: "मोड: आपतकालीन",
    },
    modesModalTitle: "अनुवाद मोड छान्नुहोस्",
    modeMenuTitles: {
      general: "सामान्य मोड",
      shop: "पसल मोड",
      taxi: "ट्याक्सी मोड",
      hotel: "होटल मोड",
      dining: "खानपान मोड",
    },
    modeActivatedToast: "{mode} सक्रिय भयो।",
    phrasesCardTitleSuffix: "वाक्यहरू",
    resetModeLabel: "सामान्य मोडमा फर्कनुहोस्",
    swapToast: "अब नेपालीबाट अंग्रेजीमा अनुवाद हुनेछ।",
    qpTranslating: "अनुवाद गर्दै...",
    qpTranslateFailed: "अनुवाद असफल भयो। फेरि थिच्नुहोस्।",
    chatTitle: "वार्तालाप",
    newChatLabel: "नयाँ कुराकानी",
    sidebarSignedOut: "वार्तालाप सिंक गर्न साइन इन गर्नुहोस्।",
    sidebarEmpty: "अहिलेसम्म कुनै वार्तालाप छैन।",
    emergencyTitle: "आपतकालीन छिटो सहयोग",
    emergencyTag: "तुरुन्तै अडियो सहयोगका लागि थिच्नुहोस्",
    emergencyLabels: {
      assistance: "सहयोग चाहियो",
      police: "प्रहरी बोलाउनुहोस्",
      hospital: "अस्पताल चाहियो",
      lost: "म हराएँ",
    },
    // In the English direction the backend expands an emergency_action into a
    // full request sentence. It has no Nepali equivalent, so the Nepali
    // direction sends these sentences as the source text instead.
    emergencyPhrases: {
      assistance: "कृपया मलाई सहयोग गर्नुहोस्। आपतकालीन अवस्था छ।",
      police: "कृपया प्रहरीलाई बोलाउनुहोस्। मलाई सहयोग चाहियो।",
      hospital: "कृपया मलाई नजिकैको अस्पताल पुऱ्याउनुहोस्। मलाई उपचार चाहियो।",
      lost: "म हराएँ। कृपया मलाई बाटो पत्ता लगाउन सहयोग गर्नुहोस्।",
    },
  },
};

const API_BASE_URL =
  window.SPEAKON_API_BASE_URL ||
  (window.location.protocol === "file:" || window.location.port === "5500"
    ? "http://localhost:5000"
    : window.location.origin);

async function translateViaBackend(text, options = {}) {
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
      emergency_action: options.emergencyAction || undefined,
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

  return {
    sourceText: data.source_text || text,
    translatedText: data.translated_text,
    suggestion: data.suggestion || null,
  };
}

const WHISPER_API_URL = `${API_BASE_URL}/transcribe`;

// -------------------------------------------------------------
// 2. DOM Elements Mapping
// -------------------------------------------------------------

const appShell = document.getElementById("appShell");

// Mode headers & triggers
const mainScreenTitle = document.getElementById("mainScreenTitle");
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
const sourceLangLabel = document.getElementById("sourceLangLabel");
const targetLangLabel = document.getElementById("targetLangLabel");
const speakPrompt = document.getElementById("speakPrompt");
const phrasesCardDesc = document.getElementById("phrasesCardDesc");
const phrasesTabTitle = document.getElementById("phrasesTabTitle");
const phrasesTabSubtitle = document.getElementById("phrasesTabSubtitle");
const chatTitle = document.getElementById("chatTitle");
const modesModalTitle = document.getElementById("modesModalTitle");
const emergencyTitle = document.getElementById("emergencyTitle");
const emergencyTag = document.getElementById("emergencyTag");
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

// Phrases Tab container - category cards are rendered into it.
const phrasesWrapper = document.getElementById("phrasesWrapper");

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

// -------------------------------------------------------------
// 3. Application State & Storage Setup
// -------------------------------------------------------------

let activeMode = "general"; // Default
let isListening = false;
let isTranscribing = false;
let autoPlayActive = false;
let speechSpeedRate = 1.0;
let savedBookmarks = []; // In-memory bookmarked favorites for the current session
let toastTimer;
let mediaRecorder = null;
let mediaStream = null;
let recordedChunks = [];
let activeTtsAudio = null;
let activeTtsAudioUrl = null;
let ttsPlaybackRequestId = 0;
let emergencyRequestInProgress = false;
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
    suggestedReply: message.suggested_reply,
    suggestedTranslation: message.suggested_translation,
    suggestedReplyLanguage: message.suggested_reply_language,
    suggestedTranslationLanguage: message.suggested_translation_language,
    suggestionReason: message.suggestion_reason,
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
    applyDirectionalUI();
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
      suggested_reply: entry.suggestedReply || null,
      suggested_translation: entry.suggestedTranslation || null,
      suggested_reply_language: entry.suggestedReplyLanguage || null,
      suggested_translation_language: entry.suggestedTranslationLanguage || null,
      suggestion_reason: entry.suggestionReason || null,
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

// -------------------------------------------------------------
// 4B. Directional UI (English -> Nepali vs Nepali -> English)
// -------------------------------------------------------------

// Direction is read straight off the existing selects - no extra state.
function isNepaliSource() {
  return sourceLanguage.value === "Nepali";
}

function directionalText() {
  return isNepaliSource() ? UI_TEXT.neToEn : UI_TEXT.enToNe;
}

// Bubble captions follow each message's own languages, so reopening an older
// conversation recorded in the other direction is still labelled correctly.
function bubbleLabels(entry) {
  const copy = entry.from === "Nepali" ? UI_TEXT.neToEn : UI_TEXT.enToNe;
  return { source: copy.bubbleSourceLabel, target: copy.bubbleTargetLabel };
}

// Restarts the shared fadeIn so a rewritten label is noticed rather than
// silently swapped. Removing and re-adding needs a reflow in between.
function replayDirectionFade(element) {
  if (!element) return;
  element.classList.remove("direction-fade");
  void element.offsetWidth;
  element.classList.add("direction-fade");
}

function applyDirectionalUI() {
  const copy = directionalText();

  sourceLangLabel.textContent = copy.sourceFieldLabel;
  targetLangLabel.textContent = copy.targetFieldLabel;
  speakPrompt.textContent = copy.speakPrompt;
  manualTextInput.placeholder = copy.manualPlaceholder;

  // Only reset the mic caption while idle, so an in-flight recording or
  // translation keeps showing its own progress text.
  if (!isListening && !isTranscribing) {
    statusText.textContent = copy.readyTitle;
    statusInstruction.textContent = copy.micInstruction;
  }

  if (phrasesCardDesc) phrasesCardDesc.textContent = copy.phrasesCardDesc;
  if (phrasesTabTitle) phrasesTabTitle.textContent = copy.phrasesTabTitle;
  if (phrasesTabSubtitle) phrasesTabSubtitle.textContent = copy.phrasesTabSubtitle;

  // The screen heading stays in English in both directions. It names the
  // screen rather than instructing the user, so it reads as a fixed title.
  // The modes pill right below it still follows the selected direction.
  const headings = UI_TEXT.enToNe.modeTitles;
  mainScreenTitle.textContent = headings[activeMode] || headings.general;
  activeModeLabel.textContent = copy.modeLabels[activeMode] || copy.modeLabels.general;

  // Conversation workspace chrome.
  if (chatTitle) chatTitle.textContent = copy.chatTitle;
  if (btnConversationClear) btnConversationClear.textContent = copy.newChatLabel;

  if (btnClearModeContext) btnClearModeContext.textContent = copy.resetModeLabel;

  // Mode picker modal.
  if (modesModalTitle) modesModalTitle.textContent = copy.modesModalTitle;
  document.querySelectorAll(".mode-selection-item").forEach((item) => {
    const label = copy.modeMenuTitles[item.dataset.mode];
    const titleNode = item.querySelector(".mode-item-title");
    if (label && titleNode) titleNode.textContent = label;
  });

  // Emergency quick-access: caption and the four action labels.
  if (emergencyTitle) emergencyTitle.textContent = copy.emergencyTitle;
  if (emergencyTag) emergencyTag.textContent = copy.emergencyTag;
  document.querySelectorAll(".emergency-btn").forEach((btn) => {
    const label = copy.emergencyLabels[btn.dataset.action];
    const labelNode = btn.querySelector(".emerg-label");
    if (!label || !labelNode) return;
    labelNode.textContent = label;
    btn.setAttribute("aria-label", label);
  });

  // Flags the whole shell so CSS can react to the active direction.
  appShell.classList.toggle("dir-ne-en", isNepaliSource());

  replayDirectionFade(speakPrompt);
  replayDirectionFade(statusInstruction);

  // Repaint phrase lists and bubbles in the new source language.
  // renderModePhrases also writes the situational card's title.
  renderModePhrases();
  renderGlobalPhrasesTab();
  renderConversationList();
  renderConversationSidebar();
}

// Keeps the two selects a valid pair, then repaints the interface.
function handleDirectionChange(changedSelect) {
  if (changedSelect === sourceLanguage) {
    targetLanguage.value = sourceLanguage.value === "English" ? "Nepali" : "English";
  } else {
    sourceLanguage.value = targetLanguage.value === "English" ? "Nepali" : "English";
  }
  applyDirectionalUI();
  showToast(directionalText().swapToast);
}

sourceLanguage.addEventListener("change", () => handleDirectionChange(sourceLanguage));
targetLanguage.addEventListener("change", () => handleDirectionChange(targetLanguage));

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
  if (!firstName) {
    resetProfileButton();
    return;
  }

  openProfile.textContent = firstName.charAt(0).toUpperCase();
  openProfile.setAttribute("aria-label", `${firstName} account`);
  openProfile.title = firstName;
  openProfile.classList.add("is-signed-in");
}

function resetProfileButton() {
  openProfile.textContent = "Login / Register";
  openProfile.setAttribute("aria-label", "Login or register");
  openProfile.removeAttribute("title");
  openProfile.classList.remove("is-signed-in");
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
// 5. Edge TTS Playback & Recorders
// -------------------------------------------------------------

function stopTtsPlayback() {
  if (activeTtsAudio) {
    activeTtsAudio.pause();
    activeTtsAudio = null;
  }
  if (activeTtsAudioUrl) {
    URL.revokeObjectURL(activeTtsAudioUrl);
    activeTtsAudioUrl = null;
  }
}

async function speakTranslation(text, customRate = null, language = targetLanguage.value) {
  if (!String(text || "").trim()) return;

  const requestId = ++ttsPlaybackRequestId;
  stopTtsPlayback();

  try {
    const response = await auth.fetchWithAuth("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        // The translation language title (for example, English or Nepali)
        // is normalized by the backend to the matching Edge Neural voice.
        language,
        speed: customRate || speechSpeedRate,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Could not generate speech");
    }

    const audioUrl = URL.createObjectURL(await response.blob());
    if (requestId !== ttsPlaybackRequestId) {
      URL.revokeObjectURL(audioUrl);
      return;
    }

    const audio = new Audio(audioUrl);
    activeTtsAudio = audio;
    activeTtsAudioUrl = audioUrl;
    audio.playbackRate = customRate || speechSpeedRate;
    audio.onended = audio.onerror = () => {
      if (activeTtsAudio === audio) stopTtsPlayback();
    };
    await audio.play();
  } catch (error) {
    if (requestId !== ttsPlaybackRequestId) return;
    console.error("Edge TTS playback failed:", error);
    showToast(error.message || `Could not play ${language} audio.`);
  }
}

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
    directionalText().listeningTitle,
    directionalText().listeningInstruction,
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
          setMicStatus(
            "error",
            directionalText().noAudioTitle,
            directionalText().noAudioInstruction,
          );
          showToast(directionalText().noAudioToast);
          return;
        }

        isTranscribing = true;
        setMicStatus(
          "transcribing",
          directionalText().transcribingTitle,
          directionalText().transcribingInstruction,
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

          const copy = directionalText();
          if (message.includes("empty-audio")) {
            showToast(copy.noAudioToast);
          } else if (message.includes("empty-transcript")) {
            setMicStatus("error", copy.noTextTitle, copy.noTextInstruction);
            showToast(copy.noTextToast);
          } else {
            setMicStatus(
              "error",
              copy.transcribeFailedTitle,
              copy.transcribeFailedInstruction,
            );
            showToast(copy.transcribeFailedToast);
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
        directionalText().permissionTitle,
        directionalText().permissionInstruction,
      );

      if (error && error.name === "NotAllowedError") {
        showToast(directionalText().permissionToast);
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
    setMicStatus("", directionalText().readyTitle, directionalText().micInstruction);
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

// Resolves to the saved entry, or to null when nothing could be translated.
// options.emergencyAction  - expand a quick-access alert server-side.
// options.speakResult      - read the translation out even if auto-play is off.
async function processTranslation(sourceText, options = {}) {
  if (!sourceText.trim()) {
    showToast("Type or speak a phrase to translate.");
    return null;
  }

  statusBadge.className = "status-badge translating";
  statusText.textContent = directionalText().translatingTitle;
  statusInstruction.textContent = directionalText().translatingInstruction;

  const originalLang = sourceLanguage.value;
  const translatedLang = targetLanguage.value;

  let translationResult;
  try {
    translationResult = await translateViaBackend(sourceText, options);
  } catch (error) {
    console.error("Backend translation error:", error);
    showToast(directionalText().translateFailedToast);
    statusBadge.className = "status-badge error";
    statusText.textContent = directionalText().translateFailedTitle;
    statusInstruction.textContent = directionalText().translateFailedInstruction;
    return null;
  }

  if (!translationResult?.translatedText) {
    showToast(directionalText().translateFailedToast);
    statusBadge.className = "status-badge error";
    statusText.textContent = directionalText().emptyTranslationTitle;
    statusInstruction.textContent = directionalText().emptyTranslationInstruction;
    return null;
  }

  const entry = {
    id: Date.now(),
    from: originalLang,
    to: translatedLang,
    original: translationResult.sourceText,
    translated: translationResult.translatedText,
    suggestedReply: translationResult.suggestion?.suggested_reply || null,
    suggestedTranslation: translationResult.suggestion?.suggested_translation || null,
    suggestedReplyLanguage:
      translationResult.suggestion?.suggested_reply_language || null,
    suggestedTranslationLanguage:
      translationResult.suggestion?.suggested_translation_language || null,
    suggestionReason: translationResult.suggestion?.suggestion_reason || null,
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
      suggested_reply: entry.suggestedReply,
      suggested_translation: entry.suggestedTranslation,
      suggested_reply_language: entry.suggestedReplyLanguage,
      suggested_translation_language: entry.suggestedTranslationLanguage,
      suggestion_reason: entry.suggestionReason,
      created_at: new Date().toISOString(),
    });
    showToast("Translation ready, but history was not saved.");
  }

  renderConversationList();

  statusBadge.className = "status-badge ready-playback";
  statusText.textContent = directionalText().playbackTitle;
  statusInstruction.textContent = directionalText().playbackInstruction;

  if (autoPlayActive || options.speakResult) {
    speakTranslation(savedEntry.translated, null, savedEntry.to);
  }

  return savedEntry;
}

// -------------------------------------------------------------
// 7. Dynamic UI Renderers
// -------------------------------------------------------------

function renderConversationList() {
  renderTranslationQuota();

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
        <p>${auth.isLoggedIn() ? directionalText().chatEmptySignedIn : directionalText().chatEmptySignedOut}</p>
      </div>
    `;
    return;
  }

  currentLog.forEach((entry) => {
    const labels = bubbleLabels(entry);
    const sentRow = document.createElement("div");
    sentRow.className = "speech-row sent";
    sentRow.innerHTML = `
      <div class="speech-bubble">
        <div class="bubble-meta">${labels.source}</div>
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
    const suggestionHtml =
      entry.suggestedReply && entry.suggestedTranslation
        ? `
        <div class="ai-suggestion-card">
          <div class="ai-suggestion-label">AI suggestion${entry.suggestionReason ? ` · ${escapeHtml(entry.suggestionReason)}` : ""}</div>
          <div class="ai-suggestion-text">${escapeHtml(entry.suggestedReply)}</div>
          <div class="ai-suggestion-translation">${escapeHtml(entry.suggestedTranslation)}</div>
          <div class="ai-suggestion-actions">
            <button class="suggestion-action-btn btn-suggestion-use" type="button">Use</button>
            <button class="suggestion-action-btn btn-suggestion-copy" type="button">Copy</button>
            <button class="suggestion-action-btn btn-suggestion-play" type="button">Play</button>
          </div>
        </div>
        `
        : "";

    recRow.innerHTML = `
      <div class="speech-bubble">
        <div class="bubble-meta">${labels.target}</div>
        <div class="bubble-text">${entry.translated}</div>
        <div class="bubble-time">${entry.timestamp}</div>
        ${suggestionHtml}
        
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
    recRow.querySelector(".btn-suggestion-use")?.addEventListener("click", () => {
      manualTextInput.value = entry.suggestedReply;
      manualTextInput.focus();
      showToast("Suggestion added to input.");
    });
    recRow.querySelector(".btn-suggestion-copy")?.addEventListener("click", () => {
      navigator.clipboard.writeText(entry.suggestedReply);
      showToast("Suggestion copied.");
    });
    recRow.querySelector(".btn-suggestion-play")?.addEventListener("click", () => {
      speakTranslation(
        entry.suggestedTranslation,
        speechSpeedRate,
        entry.suggestedTranslationLanguage || entry.to,
      );
      showToast("Reading suggested reply.");
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

// Display-only allowance shown next to the Conversations header.
// One unit is spent per translation (per chat bubble), across all conversations.
const TRANSLATION_QUOTA = 15;

const TRANSLATION_USAGE_PREFIX = "speakon_translations_used_";

function translationUsageKey() {
  const userId = auth.user?.id;
  return userId ? `${TRANSLATION_USAGE_PREFIX}${userId}` : null;
}

function readTranslationLedger() {
  const key = translationUsageKey();
  if (!key) return { total: 0, counted: {} };
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "{}");
    return { total: Number(stored.total) || 0, counted: stored.counted || {} };
  } catch (error) {
    return { total: 0, counted: {} };
  }
}

function writeTranslationLedger(ledger) {
  const key = translationUsageKey();
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(ledger));
  } catch (error) {
    // Storage unavailable (private mode) - the badge still tracks this session.
  }
}

// Each conversation's bubbles are banked once and the running total only ever
// climbs, so deleting a conversation never hands the translations back and the
// countdown carries on into whatever is translated next.
function countTranslationsUsed() {
  if (!auth.isLoggedIn()) return activeMessages.length;

  const ledger = readTranslationLedger();

  conversations.forEach((conversation) => {
    // The open conversation is counted from the live bubble list so the badge
    // ticks down the moment a bubble appears.
    const current =
      activeConversation && conversation.id === activeConversation.id
        ? activeMessages.length
        : Number(conversation.message_count) || 0;
    const banked = Number(ledger.counted[conversation.id]) || 0;

    if (current > banked) {
      ledger.total += current - banked;
      ledger.counted[conversation.id] = current;
    }
  });

  writeTranslationLedger(ledger);
  return ledger.total;
}

function renderTranslationQuota() {
  const quotaBadge = document.getElementById("translationQuota");
  if (!quotaBadge) return;

  const remaining = Math.max(0, TRANSLATION_QUOTA - countTranslationsUsed());

  quotaBadge.textContent = `${remaining}/${TRANSLATION_QUOTA}`;
  quotaBadge.classList.toggle("is-low", remaining > 0 && remaining <= 3);
  quotaBadge.classList.toggle("is-empty", remaining === 0);
}

function renderConversationSidebar() {
  renderTranslationQuota();

  if (!conversationList) {
    return;
  }

  conversationList.innerHTML = "";

  const copy = directionalText();

  if (!auth.isLoggedIn()) {
    conversationList.innerHTML = `<div class="conversation-empty">${copy.sidebarSignedOut}</div>`;
    return;
  }

  if (conversations.length === 0) {
    conversationList.innerHTML = `<div class="conversation-empty">${copy.sidebarEmpty}</div>`;
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

// -------------------------------------------------------------
// Quick Phrases
// -------------------------------------------------------------
// A Quick Phrase is ordinary user input: tapping one fills the text box the
// user would have typed into and hands it to processTranslation(), the same
// path the microphone and the Send button use. There is no second translation
// or speech mechanism here, so phrases share the conversation, the history and
// the Edge TTS voice with everything else.

let quickPhraseRequestId = 0;
let activeQuickPhraseButton = null;

function setQuickPhraseButtonState(button, stateClass, statusMessage) {
  button.classList.remove("is-loading", "is-playing", "is-error");
  if (stateClass) button.classList.add(stateClass);
  button.disabled = stateClass === "is-loading" || stateClass === "is-playing";
  const statusEl = button.querySelector(".phrase-status");
  if (statusEl) statusEl.textContent = statusMessage || "";
}

// The phrase list for the direction the user is speaking in.
function phrasesForCategory(categoryKey) {
  const set = isNepaliSource() ? QUICK_PHRASES.neToEn : QUICK_PHRASES.enToNe;
  return set[categoryKey] || [];
}

async function handleQuickPhraseClick(phraseText, button) {
  if (button.disabled) return; // this phrase is already in flight

  if (activeQuickPhraseButton && activeQuickPhraseButton !== button) {
    setQuickPhraseButtonState(activeQuickPhraseButton, null, "");
  }
  activeQuickPhraseButton = button;

  const copy = directionalText();
  const requestId = ++quickPhraseRequestId;
  setQuickPhraseButtonState(button, "is-loading", copy.qpTranslating);

  // Show the phrase where typed input goes, so the tap reads as "this is what
  // I said" rather than as a hidden shortcut.
  manualTextInput.value = phraseText;

  let entry = null;
  try {
    entry = await processTranslation(phraseText, { speakResult: true });
  } catch (error) {
    console.error("Quick phrase translation failed:", error);
  } finally {
    if (manualTextInput.value === phraseText) manualTextInput.value = "";
  }

  if (requestId !== quickPhraseRequestId) return; // superseded by a newer tap

  if (!entry) {
    setQuickPhraseButtonState(button, "is-error", copy.qpTranslateFailed);
    return;
  }

  // Leave the translation on the button: the person holding the phone can see
  // what the other side is about to hear.
  setQuickPhraseButtonState(button, null, entry.translated);
}

// Builds one phrase button. Used by both the in-mode card and the Phrases tab.
function buildPhraseButton(phraseText, className) {
  const button = document.createElement("button");
  button.className = className;
  button.type = "button";
  button.innerHTML = `
    <span class="phrase-text-wrap">
      <span class="phrase-text">${escapeHtml(phraseText)}</span>
      <span class="phrase-status" aria-live="polite"></span>
    </span>
    <span class="phrase-play-arrow">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    </span>
  `;
  button.addEventListener("click", () => handleQuickPhraseClick(phraseText, button));
  return button;
}

function renderModePhrases() {
  modePhrasesGrid.innerHTML = "";

  // The dedicated emergency section already provides its four quick actions.
  // Do not render another generic phrase list when that mode is active.
  if (activeMode === "general" || activeMode === "emergency") {
    modePhrasesCard.style.display = "none";
    return;
  }

  modePhrasesCard.style.display = "flex";
  const copy = directionalText();
  phrasesCardTitle.textContent = `${copy.modeTitles[activeMode]} ${copy.phrasesCardTitleSuffix}`;

  phrasesForCategory(activeMode).forEach((phrase) => {
    modePhrasesGrid.appendChild(buildPhraseButton(phrase.source, "mode-phrase-btn"));
  });
}

// One category card per context, rebuilt whenever the direction changes so the
// headings and the phrases always belong to the same audience.
function renderGlobalPhrasesTab() {
  if (!phrasesWrapper) return;

  const copy = directionalText();
  phrasesWrapper.innerHTML = "";

  PHRASE_CATEGORIES.forEach((category) => {
    const phrases = phrasesForCategory(category.key);
    if (!phrases.length) return;

    const card = document.createElement("div");
    card.className = "phrases-category-card";
    card.innerHTML = `
      <h2 class="category-header">
        <span class="cat-icon">${category.icon}</span>
        <span>${escapeHtml(copy.categories[category.key] || category.key)}</span>
      </h2>
      <div class="phrases-grid"></div>
    `;

    const grid = card.querySelector(".phrases-grid");
    phrases.forEach((phrase) => {
      grid.appendChild(buildPhraseButton(phrase.source, "phrase-row-btn"));
    });

    phrasesWrapper.appendChild(card);
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

  // Header labels and the modes pill are written by applyDirectionalUI below,
  // which picks the wording for the active translation direction.

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

  // Reset microphone badge before the directional pass rewrites its wording
  statusBadge.className = "status-badge";

  // Emergency keeps whichever direction the user selected: a Nepali speaker
  // needs the alert in English just as a tourist needs it in Nepali.

  // Repaints headings, phrase lists, conversation bubbles and mic captions
  // in whichever direction is now selected.
  applyDirectionalUI();

  if (triggerToast) {
    const copy = directionalText();
    const modeName = copy.modeTitles[modeKey] || metadata.title;
    showToast(copy.modeActivatedToast.replace("{mode}", modeName));
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
  applyDirectionalUI();
  showToast(directionalText().swapToast);
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

// Emergency Alert Buttons click. data-action is the backend key and data-phrase
// the English source text; the visible label is set by applyDirectionalUI.
document.querySelectorAll(".emergency-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    if (emergencyRequestInProgress) return;

    const emergencyAction = btn.dataset.action;
    if (!emergencyAction) return;

    emergencyRequestInProgress = true;
    document.querySelectorAll(".emergency-btn").forEach((button) => {
      button.disabled = true;
    });

    try {
      setTranslatorMode("emergency", false);

      // English source: the backend turns the action key into a full request
      // sentence. Nepali source: send the Nepali sentence itself, so the
      // saved message really is the language the user is speaking.
      if (isNepaliSource()) {
        await processTranslation(
          UI_TEXT.neToEn.emergencyPhrases[emergencyAction],
        );
      } else {
        await processTranslation(btn.dataset.phrase, { emergencyAction });
      }
    } finally {
      emergencyRequestInProgress = false;
      document.querySelectorAll(".emergency-btn").forEach((button) => {
        button.disabled = false;
      });
    }
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
  autoPlayActive = false;
  speechSpeedRate = 1.0;

  document.body.className = "";
  appShell.className = "app-shell";

  toggleAutoPlay.checked = false;
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
