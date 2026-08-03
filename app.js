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

  const bubble = document.createElement("div");

  bubble.className =
    "bubble " + (mine ? "me" : "niko");

  bubble.textContent = text;

  messages.appendChild(bubble);

  messages.scrollTop = messages.scrollHeight;
}


// Initial message
addMessage(
  "Hi. I'm Niko. What would you like to talk about?"
);


document.getElementById("chatForm").addEventListener(
  "submit",
  async event => {

    event.preventDefault();

    const input =
      document.getElementById("messageInput");

    const text = input.value.trim();

    if (!text) return;

    input.value = "";

    addMessage(text, true);

    addMessage("Thinking...");

    const thinking =
      messages.lastElementChild;

    try {

      const response = await fetch(
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
        throw new Error("Server error");
      }


      const data = await response.json();

      thinking.remove();


      const reply =
        data.reply ||
        "I couldn't get a response from Niko.";

      addMessage(reply);

      speak(reply);

    }

    catch (error) {

      thinking.remove();

      addMessage(
        "I can't reach Niko's server right now. Please try again in a moment."
      );

    }

  }
);


// ===============================
// LANGUAGE PRACTICE
// ===============================

document.querySelectorAll("[data-lang]").forEach(button => {

  button.addEventListener("click", () => {

    const language =
      button.dataset.lang;

    const status =
      document.getElementById(
        "languageStatus"
      );

    status.textContent =
      `Niko is ready for ${language}. Opening chat...`;

    setTimeout(() => {

      showPage("chat");

      const input =
        document.getElementById(
          "messageInput"
        );

      input.value =
        `Let's practice ${language}.`;

      input.focus();

    }, 350);

  });

});


// ===============================
// MEMORY
// ===============================

const memoryKey = "nikoMemories";


function getMemories() {

  try {

    return JSON.parse(
      localStorage.getItem(memoryKey) || "[]"
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
    document.getElementById("memoryList");

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


  memories.forEach((memory, index) => {

    const item =
      document.createElement("div");

    item.className =
      "memory-item";


    const text =
      document.createElement("span");

    text.textContent =
      memory;


    const deleteButton =
      document.createElement("button");

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

        current.splice(index, 1);

        saveMemories(current);

        renderMemory();

      }
    );


    item.appendChild(text);

    item.appendChild(deleteButton);

    list.appendChild(item);

  });

}


document.getElementById(
  "memoryForm"
).addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const input =
      document.getElementById(
        "memoryInput"
      );

    const value =
      input.value.trim();

    if (!value) return;


    const memories =
      getMemories();

    memories.push(value);

    saveMemories(memories);

    input.value = "";

    renderMemory();

  }
);


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
    new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";

  utterance.rate = 0.95;

  utterance.pitch = 1;


  const voices =
    speechSynthesis.getVoices();


  const preferred =
    voices.find(voice =>
      /Samantha|Google US English|Microsoft/i
        .test(voice.name)
    );


  if (preferred) {
    utterance.voice = preferred;
  }


  speechSynthesis.speak(
    utterance
  );

}


// Some browsers load voices later
speechSynthesis.onvoiceschanged =
  () => {
    speechSynthesis.getVoices();
  };


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


      input.value =
        transcript;


      document.getElementById(
        "chatForm"
      ).requestSubmit();

    };


  recognition.onerror =
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


// ===============================
// SERVICE WORKER
// ===============================

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});

}
