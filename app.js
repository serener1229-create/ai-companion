const BACKEND_URL = "https://niko-backend-1.onrender.com";


// ===============================
// PAGE NAVIGATION
// ===============================

const pages = [...document.querySelectorAll(".page")];
const navItems = [...document.querySelectorAll(".nav-item")];

function showPage(id) {

  pages.forEach(page => {
    page.classList.toggle("active", page.id === id);
  });

  navItems.forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === id
    );
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// Buttons that open pages
document.querySelectorAll("[data-page]").forEach(button => {

  button.addEventListener("click", () => {

    const page = button.dataset.page;

    if (page) {
      showPage(page);
    }

  });

});


// Back buttons
document.querySelectorAll(".back").forEach(button => {

  button.addEventListener("click", () => {
    showPage("home");
  });

});


// ===============================
// CHAT
// ===============================

const messages = document.getElementById("messages");

function addMessage(text, mine = false) {

  if (!messages) return;

  const bubble = document.createElement("div");

  bubble.className =
    "bubble " + (mine ? "me" : "niko");

  bubble.textContent = text;

  messages.appendChild(bubble);

  messages.scrollTop = messages.scrollHeight;

}


// Initial message
if (messages) {

  addMessage(
    "Hi. I'm Niko. What would you like to talk about?"
  );

}


const chatForm =
  document.getElementById("chatForm");


if (chatForm) {

  chatForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();

      const input =
        document.getElementById("messageInput");

      if (!input) return;

      const text =
        input.value.trim();

      if (!text) return;

      input.value = "";

      addMessage(text, true);

      addMessage("Thinking...");

      const thinking =
        messages.lastElementChild;


      try {

        const response =
          await fetch(
            BACKEND_URL + "/chat",
            {
              method: "POST",

              headers: {
                "Content-Type": "application/json"
              },

              body: JSON.stringify({
                message: text
              })
            }
          );


        if (!response.ok) {
          throw new Error(
            `Server returned ${response.status}`
          );
        }


        const data =
          await response.json();


        if (thinking) {
          thinking.remove();
        }


        const reply =
          data.reply ||
          "I couldn't get a response from Niko.";


        addMessage(reply);

        speak(reply);

      }

      catch (error) {

        console.error(
          "Niko chat error:",
          error
        );


        if (thinking) {
          thinking.remove();
        }


        addMessage(
          "I can't reach Niko's server right now. Please try again in a moment."
        );

      }

    }
  );

}


// ===============================
// LANGUAGE PRACTICE
// ===============================

const languageCodes = {

  English: "en",

  Turkish: "tr",

  German: "de",

  Korean: "ko",

  Urdu: "ur",

  Russian: "Russian"

};


// Currently selected language
let selectedLanguage = "English";


document.querySelectorAll("[data-lang]").forEach(button => {

  button.addEventListener("click", () => {

    const language =
      button.dataset.lang;

    selectedLanguage =
      language;


    const status =
      document.getElementById(
        "languageStatus"
      );


    if (status) {

      status.textContent =
        `Niko is ready for ${language}. Opening chat...`;

    }


    setTimeout(() => {

      showPage("chat");


      const input =
        document.getElementById(
          "messageInput"
        );


      if (!input) return;


      input.value =
        `Let's practice ${language}.`;

      input.focus();


    }, 350);

  });

});


// ===============================
// TRANSLATION
// ===============================

/*
  This function talks to your backend:

  POST /translate

  Your API key stays safely on Render.
  It is NEVER placed in this JavaScript.
*/

async function translateText(
  text,
  source = "en",
  target = "Turkish"
) {

  if (!text || !text.trim()) {

    throw new Error(
      "Text to translate is required."
    );

  }


  const response =
    await fetch(
      BACKEND_URL + "/translate",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({

          text: text.trim(),

          source: source,

          target: target

        })
      }
    );


  const data =
    await response.json();


  if (!response.ok) {

    console.error(
      "Translation error:",
      data
    );

    throw new Error(
      data.error ||
      "Translation failed."
    );

  }


  return (
    data.translation ||
    data.translatedText ||
    data.result ||
    JSON.stringify(data)
  );

}


// Make it available if we add a translator UI later
window.translateText =
  translateText;


// ===============================
// OPTIONAL TRANSLATION HELPER
// ===============================

async function translateForNiko(
  text,
  targetLanguage
) {

  const target =
    languageCodes[targetLanguage] ||
    targetLanguage;


  try {

    const translation =
      await translateText(
        text,
        "en",
        target
      );


    return translation;

  }

  catch (error) {

    console.error(
      "Translation failed:",
      error
    );


    return null;

  }

}


window.translateForNiko =
  translateForNiko;


// ===============================
// MEMORY
// ===============================

const memoryKey =
  "nikoMemories";


function getMemories() {

  try {

    return JSON.parse(
      localStorage.getItem(
        memoryKey
      ) || "[]"
    );

  }

  catch {

    return [];

  }

}


function saveMemories(memories) {

  localStorage.setItem(
    memoryKey,
    JSON.stringify(memories)
  );

}


function renderMemory() {

  const list =
    document.getElementById(
      "memoryList"
    );


  if (!list) return;


  const memories =
    getMemories();


  list.innerHTML = "";


  if (memories.length === 0) {

    const empty =
      document.createElement("div");


    empty.className =
      "memory-item";


    empty.textContent =
      "Nothing saved yet.";


    list.appendChild(empty);

    return;

  }


  memories.forEach(
    (memory, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "memory-item";


      const text =
        document.createElement(
          "span"
        );


      text.textContent =
        memory;


      const deleteButton =
        document.createElement(
          "button"
        );


      deleteButton.className =
        "memory-delete";


      deleteButton.textContent =
        "×";


      deleteButton.setAttribute(
        "aria-label",
        "Delete memory"
      );


      deleteButton.addEventListener(
        "click",
        () => {

          const current =
            getMemories();


          current.splice(
            index,
            1
          );


          saveMemories(
            current
          );


          renderMemory();

        }
      );


      item.appendChild(text);

      item.appendChild(
        deleteButton
      );

      list.appendChild(item);

    }
  );

}


const memoryForm =
  document.getElementById(
    "memoryForm"
  );


if (memoryForm) {

  memoryForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const input =
        document.getElementById(
          "memoryInput"
        );


      if (!input) return;


      const value =
        input.value.trim();


      if (!value) return;


      const memories =
        getMemories();


      memories.push(value);


      saveMemories(
        memories
      );


      input.value = "";


      renderMemory();

    }
  );

}


renderMemory();


// ===============================
// NIKO SPEECH
// ===============================

function speak(text) {

  if (
    !("speechSynthesis" in window) ||
    !text
  ) {

    return;

  }


  speechSynthesis.cancel();


  const utterance =
    new SpeechSynthesisUtterance(
      text
    );


  utterance.lang =
    "en-US";


  utterance.rate =
    0.95;


  utterance.pitch =
    1;


  const voices =
    speechSynthesis.getVoices();


  const preferred =
    voices.find(
      voice =>
        /Samantha|Google US English|Microsoft/i
          .test(voice.name)
    );


  if (preferred) {

    utterance.voice =
      preferred;

  }


  speechSynthesis.speak(
    utterance
  );

}


window.speak =
  speak;


// Some browsers load voices later
if (
  "speechSynthesis" in window
) {

  speechSynthesis.onvoiceschanged =
    () => {

      speechSynthesis.getVoices();

    };

}


// ===============================
// VOICE INPUT
// ===============================

function startVoice() {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


  if (!SpeechRecognition) {

    alert(
      "Voice input isn't supported by this browser."
    );

    return;

  }


  const recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-US";


  recognition.interimResults =
    false;


  recognition.continuous =
    false;


  recognition.onstart =
    () => {

      const status =
        document.querySelector(
          ".voice-status"
        );


      if (status) {

        status.textContent =
          "LISTENING...";

      }

    };


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0]
          .transcript;


      showPage("chat");


      const input =
        document.getElementById(
          "messageInput"
        );


      if (!input) return;


      input.value =
        transcript;


      const form =
        document.getElementById(
          "chatForm"
        );


      if (form) {

        form.requestSubmit();

      }

    };


  recognition.onerror =
    error => {

      console.error(
        "Voice recognition error:",
        error
      );


      const status =
        document.querySelector(
          ".voice-status"
        );


      if (status) {

        status.textContent =
          "VOICE READY";

      }

    };


  recognition.onend =
    () => {

      const status =
        document.querySelector(
          ".voice-status"
        );


      if (status) {

        status.textContent =
          "VOICE READY";

      }

    };


  recognition.start();

}


// Make voice function available to buttons
window.startVoice =
  startVoice;


// Connect existing voice button if one exists
const voiceButton =
  document.getElementById(
    "speakBtn"
  );


if (voiceButton) {

  voiceButton.addEventListener(
    "click",
    startVoice
  );

}


// ===============================
// SERVICE WORKER
// ===============================

if (
  "serviceWorker" in navigator
) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(error => {

      console.log(
        "Service worker registration failed:",
        error
      );

    });

}
