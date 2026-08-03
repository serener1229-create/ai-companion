const BACKEND_URL =
  "https://niko-backend-1.onrender.com";


// ==========================================
// PAGE NAVIGATION
// ==========================================

const pages =
  document.querySelectorAll(".page");

const navItems =
  document.querySelectorAll(".nav-item");


function openPage(pageId) {

  pages.forEach(page => {

    page.classList.toggle(
      "active",
      page.id === pageId
    );

  });


  navItems.forEach(item => {

    item.classList.toggle(
      "active",
      item.dataset.page === pageId
    );

  });


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


// All page buttons

document
  .querySelectorAll("[data-page]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        openPage(
          button.dataset.page
        );

      }
    );

  });


// Back buttons

document
  .querySelectorAll(".back")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        openPage("home");

      }
    );

  });



// ==========================================
// CHAT
// ==========================================

const messages =
  document.getElementById("messages");

const chatForm =
  document.getElementById("chatForm");

const messageInput =
  document.getElementById("messageInput");


function addMessage(
  text,
  mine = false
) {

  if (!messages) return;

  const bubble =
    document.createElement("div");

  bubble.className =
    "bubble " +
    (mine ? "me" : "niko");

  bubble.textContent = text;

  messages.appendChild(bubble);

  messages.scrollTop =
    messages.scrollHeight;

}


// First Niko message

if (messages) {

  addMessage(
    "Hey. I'm Niko. What are you thinking about?"
  );

}


// Send message

if (chatForm) {

  chatForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      const text =
        messageInput.value.trim();


      if (!text) return;


      messageInput.value = "";


      addMessage(
        text,
        true
      );


      const thinking =
        document.createElement("div");

      thinking.className =
        "bubble niko";

      thinking.textContent =
        "Thinking…";


      messages.appendChild(
        thinking
      );


      messages.scrollTop =
        messages.scrollHeight;


      try {

        const response =
          await fetch(
            BACKEND_URL + "/chat",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json"
              },

              body: JSON.stringify({
                message: text
              })
            }
          );


        if (!response.ok) {
          throw new Error(
            "Server error"
          );
        }


        const data =
          await response.json();


        thinking.remove();


        const reply =
          data.reply ||
          "I couldn't get a response.";


        addMessage(reply);


        speak(reply);


      } catch (error) {

        thinking.remove();


        addMessage(
          "I can't reach Niko's server right now. Please try again in a moment."
        );

      }

    }
  );

}



// ==========================================
// LANGUAGES
// ==========================================

const languageStatus =
  document.getElementById(
    "languageStatus"
  );


document
  .querySelectorAll("[data-lang]")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const language =
          button.dataset.lang;


        if (languageStatus) {

          languageStatus.textContent =
            `Niko is ready for ${language}.`;

        }


        openPage("chat");


        if (messageInput) {

          messageInput.value =
            `Let's practice ${language}.`;

          messageInput.focus();

        }

      }
    );

  });



// ==========================================
// MEMORY
// ==========================================

const MEMORY_KEY =
  "nikoMemories";


const memoryForm =
  document.getElementById(
    "memoryForm"
  );


const memoryInput =
  document.getElementById(
    "memoryInput"
  );


const memoryList =
  document.getElementById(
    "memoryList"
  );


function getMemories() {

  try {

    return JSON.parse(
      localStorage.getItem(
        MEMORY_KEY
      ) || "[]"
    );

  } catch {

    return [];

  }

}


function saveMemories(
  memories
) {

  localStorage.setItem(
    MEMORY_KEY,
    JSON.stringify(memories)
  );

}


function renderMemory() {

  if (!memoryList) return;


  const memories =
    getMemories();


  memoryList.innerHTML = "";


  if (memories.length === 0) {

    const empty =
      document.createElement("div");

    empty.className =
      "memory-empty";

    empty.textContent =
      "Nothing saved yet.";

    memoryList.appendChild(
      empty
    );

    return;

  }


  memories.forEach(
    (memory, index) => {

      const card =
        document.createElement("div");

      card.className =
        "memory-item";


      const text =
        document.createElement("span");

      text.textContent =
        memory;


      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.textContent =
        "×";


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


      card.appendChild(text);

      card.appendChild(
        deleteButton
      );

      memoryList.appendChild(
        card
      );

    }
  );

}


if (memoryForm) {

  memoryForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const value =
        memoryInput.value.trim();


      if (!value) return;


      const memories =
        getMemories();


      memories.push(value);


      saveMemories(
        memories
      );


      memoryInput.value =
        "";


      renderMemory();

    }
  );

}


renderMemory();



// ==========================================
// NIKO SPEECH
// ==========================================

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
    1.0;


  utterance.volume =
    1.0;


  speechSynthesis.speak(
    utterance
  );

}



// ==========================================
// VOICE RECOGNITION
// ==========================================

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;


if (SpeechRecognition) {

  recognition =
    new SpeechRecognition();


  recognition.lang =
    "en-US";


  recognition.continuous =
    false;


  recognition.interimResults =
    false;

}



// ==========================================
// FLOATING NIKO
// ==========================================

const nikoFloatButton =
  document.getElementById(
    "nikoFloatButton"
  );


const nikoVoicePanel =
  document.getElementById(
    "nikoVoicePanel"
  );


const nikoMicButton =
  document.getElementById(
    "nikoMicButton"
  );


const voiceStatus =
  document.getElementById(
    "voiceStatus"
  );


// Open floating panel

if (nikoFloatButton) {

  nikoFloatButton.addEventListener(
    "click",
    () => {

      nikoVoicePanel.classList.toggle(
        "open"
      );

    }
  );

}



// Start listening

function startListening() {

  if (!recognition) {

    alert(
      "Voice input isn't supported in this browser."
    );

    return;

  }


  try {

    recognition.start();

  } catch {

    // Already listening

  }

}


if (nikoMicButton) {

  nikoMicButton.addEventListener(
    "click",
    startListening
  );

}



// Voice started

if (recognition) {

  recognition.onstart =
    () => {

      nikoMicButton?.classList.add(
        "listening"
      );


      if (voiceStatus) {

        voiceStatus.textContent =
          "Listening…";

      }

    };



  recognition.onresult =
    event => {

      const transcript =
        event
          .results[0][0]
          .transcript;


      openPage("chat");


      if (messageInput) {

        messageInput.value =
          transcript;

        chatForm.requestSubmit();

      }


      nikoVoicePanel?.classList.remove(
        "open"
      );

    };



  recognition.onend =
    () => {

      nikoMicButton?.classList.remove(
        "listening"
      );


      if (voiceStatus) {

        voiceStatus.textContent =
          "Tap to talk";

      }

    };



  recognition.onerror =
    () => {

      nikoMicButton?.classList.remove(
        "listening"
      );


      if (voiceStatus) {

        voiceStatus.textContent =
          "Couldn't hear you";

      }

    };

}



// ==========================================
// VOICE PAGE BUTTON
// ==========================================

const voiceListenButton =
  document.getElementById(
    "voiceListenButton"
  );


if (voiceListenButton) {

  voiceListenButton.addEventListener(
    "click",
    () => {

      startListening();

    }
  );

}



// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener(
  "keydown",
  event => {

    if (
      event.key === "Escape"
    ) {

      openPage("home");

    }


    if (
      event.key === "/" &&
      document.activeElement !==
        messageInput
    ) {

      event.preventDefault();

      openPage("chat");

      messageInput?.focus();

    }

  }
);



// ==========================================
// SERVICE WORKER
// ==========================================

if (
  "serviceWorker" in navigator
) {

  window.addEventListener(
    "load",
    () => {

      navigator.serviceWorker
        .register("sw.js")
        .catch(() => {});

    }
  );

}



// ==========================================
// START
// ==========================================

openPage("home");
