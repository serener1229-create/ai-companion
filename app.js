const BACKEND_URL = "https://niko-backend-1.onrender.com";

const pages = [...document.querySelectorAll(".page")];

function showPage(id) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === id);
  });

  window.scrollTo(0, 0);
}


/* =========================
   PAGE NAVIGATION
========================= */

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    showPage(button.dataset.page);
  });
});

document.querySelectorAll(".back").forEach(button => {
  button.addEventListener("click", () => {
    showPage("home");
  });
});


/* =========================
   CHAT
========================= */

const messages = document.getElementById("messages");

function addMessage(text, mine = false) {
  const bubble = document.createElement("div");

  bubble.className =
    "bubble " + (mine ? "me" : "niko");

  bubble.textContent = text;

  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;

  return bubble;
}

addMessage(
  "Hi! I'm Niko 👋 Say “Niko” when you want to talk to me."
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

    const thinking = addMessage("Thinking…");

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
        "I couldn't get a response.";

      addMessage(reply);

      speak(reply);

    } catch (error) {

      thinking.remove();

      addMessage(
        "I can't reach Niko's server right now. Please try again."
      );
    }
  }
);


/* =========================
   NIKO VOICE
========================= */

let availableVoices = [];

function loadVoices() {
  if (!("speechSynthesis" in window)) return;

  availableVoices =
    window.speechSynthesis.getVoices();
}

loadVoices();

if ("speechSynthesis" in window) {
  speechSynthesis.onvoiceschanged = loadVoices;
}


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
  utterance.pitch = 1.05;
  utterance.volume = 1;

  /*
    Prefer an English voice if the device provides one.
  */

  const englishVoice =
    availableVoices.find(
      voice =>
        voice.lang &&
        voice.lang.toLowerCase().startsWith("en")
    );

  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  speechSynthesis.speak(utterance);
}


/* =========================
   WAKE WORD: "NIKO"
========================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;

let wakeRecognition = null;
let wakeListening = false;
let commandRecognition = null;

function createWakeRecognition() {

  if (!SpeechRecognition) {
    console.log(
      "Speech recognition isn't supported in this browser."
    );

    return null;
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang = "en-US";

  /*
    We only need short pieces of speech
    while waiting for "Niko".
  */

  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  recognition.onstart = () => {

    wakeListening = true;

    console.log(
      "Niko wake-word listener is active."
    );

    updateWakeStatus("Listening for “Niko”…");
  };


  recognition.onresult = event => {

    for (
      let i = event.resultIndex;
      i < event.results.length;
      i++
    ) {

      const result =
        event.results[i];

      if (!result.isFinal) continue;

      const transcript =
        result[0].transcript
          .trim()
          .toLowerCase();

      console.log(
        "Heard:",
        transcript
      );

      /*
        Recognise:
        "Niko"
        "Hey Niko"
        "Okay Niko"
        "Hi Niko"
      */

      const wakeWord =
        /\b(?:hey|hi|okay|ok)?\s*niko\b/i;

      if (wakeWord.test(transcript)) {

        activateNiko();

        return;
      }
    }
  };


  recognition.onerror = event => {

    console.log(
      "Wake recognition error:",
      event.error
    );

    wakeListening = false;

    /*
      Some browsers stop recognition automatically.
      We restart it after a short delay.
    */

    if (
      event.error !== "not-allowed" &&
      event.error !== "service-not-allowed"
    ) {

      setTimeout(() => {
        startWakeListener();
      }, 1200);
    }
  };


  recognition.onend = () => {

    wakeListening = false;

    /*
      Keep the wake listener alive while
      the Niko page is open.
    */

    if (
      document.visibilityState === "visible"
    ) {

      setTimeout(() => {
        startWakeListener();
      }, 700);
    }
  };


  return recognition;
}


function startWakeListener() {

  if (!SpeechRecognition) return;

  if (wakeListening) return;

  if (
    document.visibilityState !== "visible"
  ) {
    return;
  }

  if (!wakeRecognition) {
    wakeRecognition =
      createWakeRecognition();
  }

  if (!wakeRecognition) return;

  try {

    wakeRecognition.start();

  } catch (error) {

    /*
      Browser can throw if start()
      is called while already starting.
    */

    console.log(
      "Wake listener:",
      error.message
    );
  }
}


/* =========================
   WHEN "NIKO" IS HEARD
========================= */

function activateNiko() {

  console.log("Niko activated!");

  /*
    Stop the wake listener temporarily
    so it doesn't hear the command twice.
  */

  stopWakeListener();

  /*
    Open the chat page.
  */

  showPage("chat");

  /*
    Niko acknowledges the wake word.
  */

  speak("Yes?");

  updateWakeStatus("Niko is listening…");

  /*
    Wait briefly for "Yes?" to finish,
    then listen for the actual command.
  */

  setTimeout(() => {

    startCommandListener();

  }, 900);
}


/* =========================
   COMMAND LISTENER
========================= */

function startCommandListener() {

  if (!SpeechRecognition) {

    alert(
      "Voice recognition isn't supported in this browser."
    );

    return;
  }

  if (commandRecognition) {

    try {
      commandRecognition.abort();
    } catch (_) {}

  }

  commandRecognition =
    new SpeechRecognition();

  commandRecognition.lang =
    "en-US";

  commandRecognition.continuous =
    false;

  commandRecognition.interimResults =
    false;

  commandRecognition.maxAlternatives =
    1;


  commandRecognition.onstart = () => {

    updateWakeStatus(
      "🎙️ I'm listening…"
    );
  };


  commandRecognition.onresult =
    event => {

      const command =
        event.results[0][0].transcript.trim();

      console.log(
        "Niko command:",
        command
      );

      if (!command) return;

      document.getElementById(
        "messageInput"
      ).value = command;

      /*
        Send the recognized command
        to your existing backend.
      */

      document
        .getElementById("chatForm")
        .requestSubmit();
    };


  commandRecognition.onerror =
    event => {

      console.log(
        "Command recognition:",
        event.error
      );

      updateWakeStatus(
        "Say “Niko” whenever you want me."
      );
    };


  commandRecognition.onend = () => {

    commandRecognition = null;

    updateWakeStatus(
      "Say “Niko” whenever you want me."
    );

    /*
      Start waiting for the wake word again.
    */

    setTimeout(() => {
      startWakeListener();
    }, 700);
  };


  try {

    commandRecognition.start();

  } catch (error) {

    console.log(
      "Could not start command recognition:",
      error
    );
  }
}


/* =========================
   STOP WAKE LISTENER
========================= */

function stopWakeListener() {

  if (!wakeRecognition) return;

  try {
    wakeRecognition.stop();
  } catch (_) {}

  wakeListening = false;
}


/* =========================
   STATUS
========================= */

function updateWakeStatus(text) {

  /*
    This won't break anything if
    you haven't added a status element yet.
  */

  const status =
    document.getElementById(
      "wakeStatus"
    );

  if (status) {
    status.textContent = text;
  }
}


/* =========================
   START LISTENING AFTER
   USER INTERACTION
========================= */

/*
  Browsers may require microphone permission
  to be granted from a user interaction.

  Clicking anywhere on Niko starts the listener.
*/

document.addEventListener(
  "click",
  () => {

    if (!wakeListening) {
      startWakeListener();
    }

  },
  { once: true }
);


/*
  Also try when the page becomes visible.
*/

document.addEventListener(
  "visibilitychange",
  () => {

    if (
      document.visibilityState === "visible"
    ) {

      setTimeout(() => {
        startWakeListener();
      }, 500);

    } else {

      stopWakeListener();

    }

  }
);


/* =========================
   LANGUAGE PAGE
========================= */

document.querySelectorAll(
  "[data-lang]"
).forEach(button => {

  button.addEventListener(
    "click",
    () => {

      const language =
        button.dataset.lang;

      document.getElementById(
        "languageStatus"
      ).textContent =
        `🌟 Niko is ready for ${language}! Go to Talk to Niko and say "Let's practice ${language}."`;

    }
  );

});


/* =========================
   MEMORY
========================= */

const memoryKey =
  "nikoMemories";


function renderMemory() {

  const list =
    document.getElementById(
      "memoryList"
    );

  const memories =
    JSON.parse(
      localStorage.getItem(
        memoryKey
      ) || "[]"
    );

  list.innerHTML = "";

  memories.forEach(
    (memory, index) => {

      const card =
        document.createElement(
          "div"
        );

      card.className = "card";

      const text =
        document.createElement(
          "span"
        );

      text.textContent =
        "💭 " + memory;

      const deleteButton =
        document.createElement(
          "button"
        );

      deleteButton.textContent =
        "🗑️";

      deleteButton.style.float =
        "right";

      deleteButton.style.border =
        "0";

      deleteButton.style.background =
        "transparent";

      deleteButton.style.cursor =
        "pointer";

      deleteButton.onclick = () => {

        memories.splice(
          index,
          1
        );

        localStorage.setItem(
          memoryKey,
          JSON.stringify(memories)
        );

        renderMemory();

      };

      card.appendChild(text);
      card.appendChild(
        deleteButton
      );

      list.appendChild(card);

    }
  );
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
      JSON.parse(
        localStorage.getItem(
          memoryKey
        ) || "[]"
      );

    memories.push(value);

    localStorage.setItem(
      memoryKey,
      JSON.stringify(memories)
    );

    input.value = "";

    renderMemory();

  }
);

renderMemory();


/* =========================
   SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});

}
