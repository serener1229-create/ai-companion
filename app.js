const BACKEND_URL = "https://niko-backend-1.onrender.com";


// ===============================
// PAGE NAVIGATION
// ===============================

const pages = document.querySelectorAll(".page");

function openPage(pageId) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === pageId);
  });

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


// Open pages from buttons
document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    openPage(button.dataset.page);
  });
});


// Back buttons
document.querySelectorAll(".back").forEach(button => {
  button.addEventListener("click", () => {
    openPage("home");
  });
});


// ===============================
// CHAT
// ===============================

const messages = document.getElementById("messages");
const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");


function addMessage(text, mine = false) {

  const bubble = document.createElement("div");

  bubble.className = mine
    ? "bubble me"
    : "bubble niko";

  bubble.textContent = text;

  messages.appendChild(bubble);

  messages.scrollTop = messages.scrollHeight;
}


// Initial message
if (messages) {
  addMessage(
    "Hey. I'm Niko. What are you thinking about?"
  );
}


// Send message
if (chatForm) {

  chatForm.addEventListener("submit", async event => {

    event.preventDefault();

    const text = messageInput.value.trim();

    if (!text) return;

    messageInput.value = "";

    addMessage(text, true);

    const thinking = document.createElement("div");

    thinking.className = "bubble niko";
    thinking.textContent = "Thinking…";

    messages.appendChild(thinking);

    messages.scrollTop = messages.scrollHeight;


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
        "I couldn't think of a response.";

      addMessage(reply);

      speak(reply);


    } catch (error) {

      thinking.remove();

      addMessage(
        "I can't reach Niko's server right now. Please try again in a moment."
      );

    }

  });

}


// ===============================
// LANGUAGE PAGE
// ===============================

const languageStatus =
  document.getElementById("languageStatus");


document.querySelectorAll("[data-lang]").forEach(button => {

  button.addEventListener("click", () => {

    const language = button.dataset.lang;


    if (languageStatus) {

      languageStatus.textContent =
        `Niko is ready for ${language}.`;

    }


    // Automatically open chat
    openPage("chat");


    // Put a useful starting message in the input
    if (messageInput) {

      messageInput.value =
        `Let's practice ${language}.`;

      messageInput.focus();

    }

  });

});


// ===============================
// MEMORY
// ===============================

const MEMORY_KEY = "nikoMemories";

const memoryForm =
  document.getElementById("memoryForm");

const memoryInput =
  document.getElementById("memoryInput");

const memoryList =
  document.getElementById("memoryList");


function getMemories() {

  try {

    return JSON.parse(
      localStorage.getItem(MEMORY_KEY) || "[]"
    );

  } catch {

    return [];

  }

}


function saveMemories(memories) {

  localStorage.setItem(
    MEMORY_KEY,
    JSON.stringify(memories)
  );

}


function renderMemory() {

  if (!memoryList) return;

  const memories = getMemories();

  memoryList.innerHTML = "";


  if (memories.length === 0) {

    const empty = document.createElement("div");

    empty.className = "memory-empty";

    empty.textContent =
      "Nothing saved yet.";

    memoryList.appendChild(empty);

    return;

  }


  memories.forEach((memory, index) => {

    const card = document.createElement("div");

    card.className = "memory-item";


    const text = document.createElement("span");

    text.textContent = memory;


    const deleteButton =
      document.createElement("button");

    deleteButton.textContent = "×";

    deleteButton.setAttribute(
      "aria-label",
      "Delete memory"
    );


    deleteButton.addEventListener(
      "click",
      () => {

        const current = getMemories();

        current.splice(index, 1);

        saveMemories(current);

        renderMemory();

      }
    );


    card.appendChild(text);

    card.appendChild(deleteButton);

    memoryList.appendChild(card);

  });

}


if (memoryForm) {

  memoryForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();

      const value =
        memoryInput.value.trim();

      if (!value) return;


      const memories = getMemories();

      memories.push(value);

      saveMemories(memories);

      memoryInput.value = "";

      renderMemory();

    }
  );

}


renderMemory();


// ===============================
// NIKO VOICE
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

  utterance.pitch = 1.0;

  utterance.volume = 1.0;


  speechSynthesis.speak(utterance);

}


// ===============================
// VOICE INPUT
// ===============================

let recognition = null;


const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.continuous = false;

  recognition.interimResults = false;


  recognition.onresult = event => {

    const transcript =
      event.results[0][0].transcript;


    openPage("chat");


    if (messageInput) {

      messageInput.value = transcript;

      chatForm.requestSubmit();

    }

  };


  recognition.onerror = error => {

    console.log(
      "Voice recognition:",
      error.error
    );

  };

}


// ===============================
// VOICE ACTIVATION BUTTON
// ===============================

// If your HTML has a voice button,
// this makes it work.

const voiceButton =
  document.getElementById("speakBtn");


if (voiceButton) {

  voiceButton.addEventListener(
    "click",
    () => {

      if (!recognition) {

        alert(
          "Voice input isn't supported in this browser."
        );

        return;

      }


      try {

        recognition.start();

        voiceButton.classList.add("listening");

      } catch {

        // Recognition may already be running.

      }

    }
  );

}


// Remove listening state
if (recognition) {

  recognition.onend = () => {

    if (voiceButton) {

      voiceButton.classList.remove(
        "listening"
      );

    }

  };

}


// ===============================
// KEYBOARD SHORTCUTS
// ===============================

document.addEventListener(
  "keydown",
  event => {

    // Escape = home
    if (event.key === "Escape") {

      openPage("home");

    }

    // / = focus chat
    if (
      event.key === "/" &&
      document.activeElement !== messageInput
    ) {

      event.preventDefault();

      openPage("chat");

      messageInput?.focus();

    }

  }
);


// ===============================
// SERVICE WORKER
// ===============================

if ("serviceWorker" in navigator) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(error => {

          console.log(
            "Service worker:",
            error
          );

        });

    }
  );

}


// ===============================
// START NIKO
// ===============================

openPage("home");
