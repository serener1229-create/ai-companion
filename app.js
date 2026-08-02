const BACKEND_URL = "https://niko-backend-1.onrender.com";

const screens = [...document.querySelectorAll(".screen")];

function show(id) {
  screens.forEach(s =>
    s.classList.toggle("active", s.id === id)
  );

  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-screen]").forEach(button => {
  button.onclick = () => show(button.dataset.screen);
});

document.querySelectorAll(".back").forEach(button => {
  button.onclick = () => show("home");
});


/* =========================
   CHAT
========================= */

const messages = document.getElementById("messages");

function addMessage(text, mine = false) {
  const div = document.createElement("div");

  div.className = "bubble " + (mine ? "me" : "niko");

  div.textContent = text;

  messages.appendChild(div);

  messages.scrollTop = messages.scrollHeight;

  return div;
}


/* =========================
   NIKO VOICE
========================= */

let nikoVoice = null;
let voiceEnabled = true;

function loadVoices() {
  if (!("speechSynthesis" in window)) return;

  const voices = speechSynthesis.getVoices();

  if (!voices.length) return;

  /*
   * Prefer a natural English voice.
   * The exact voices available depend on
   * the phone/browser.
   */

  nikoVoice =
    voices.find(v =>
      v.lang === "en-US" &&
      /Samantha|Karen|Alex|Daniel/i.test(v.name)
    ) ||

    voices.find(v =>
      v.lang.startsWith("en-US")
    ) ||

    voices.find(v =>
      v.lang.startsWith("en")
    ) ||

    voices[0];
}


/*
 * iPhone/Safari may load voices
 * asynchronously.
 */
if ("speechSynthesis" in window) {
  loadVoices();

  speechSynthesis.onvoiceschanged = loadVoices;
}


function speak(text) {

  if (!voiceEnabled) return;

  if (!("speechSynthesis" in window)) {
    return;
  }

  if (!text) return;

  /*
   * Stop anything Niko was saying previously.
   */
  speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(text);

  if (nikoVoice) {
    utterance.voice = nikoVoice;
  }

  utterance.lang =
    nikoVoice?.lang || "en-US";

  /*
   * Voice settings.
   * These make Niko sound less robotic.
   */
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  speechSynthesis.speak(utterance);
}


/* =========================
   FIRST NIKO MESSAGE
========================= */

addMessage(
  "Hi! I'm Niko. Ask me anything, or choose a language to practice."
);


/* =========================
   CHAT FORM
========================= */

document.getElementById("chatForm").onsubmit =
  async e => {

    e.preventDefault();

    const input =
      document.getElementById("messageInput");

    const text =
      input.value.trim();

    if (!text) return;

    input.value = "";

    addMessage(text, true);

    const thinking =
      addMessage("Thinking…");

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
          "Server error: " + response.status
        );
      }

      const data =
        await response.json();

      thinking.remove();

      const reply =
        data.reply ||
        "I couldn't get a response.";

      addMessage(reply);

      /*
       * Make Niko speak.
       */
      speak(reply);

    } catch (error) {

      thinking.remove();

      addMessage(
        "I can't reach Niko's server right now. Please try again in a moment."
      );
    }
  };


/* =========================
   LANGUAGE PRACTICE
========================= */

document.querySelectorAll("[data-lang]")
  .forEach(button => {

    button.onclick = () => {

      const lang =
        button.dataset.lang;

      document.getElementById(
        "languageStatus"
      ).textContent =
        `Niko is ready to practice ${lang}. Open "Talk to Niko" and say: "Let's practice ${lang}."`;

    };

  });


/* =========================
   MEMORY
========================= */

const memoryKey = "nikoMemories";

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
        document.createElement("div");

      card.className = "card";

      card.innerHTML = `
        <span></span>
        <button
          style="
            float:right;
            border:0;
            background:none;
            color:white;
            font-size:16px;
          "
          aria-label="Delete memory"
        >
          🗑️
        </button>
      `;

      card.querySelector(
        "span"
      ).textContent = memory;

      card.querySelector(
        "button"
      ).onclick = () => {

        memories.splice(index, 1);

        localStorage.setItem(
          memoryKey,
          JSON.stringify(memories)
        );

        renderMemory();
      };

      list.appendChild(card);
    }
  );
}


document.getElementById(
  "memoryForm"
).onsubmit = e => {

  e.preventDefault();

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
};


renderMemory();


/* =========================
   VOICE INPUT
========================= */

document.getElementById(
  "speakBtn"
).onclick = () => {

  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {

    alert(
      "Voice input isn't supported in this browser."
    );

    return;
  }

  const recognition =
    new SpeechRecognition();

  recognition.lang = "en-US";

  recognition.interimResults = false;

  recognition.maxAlternatives = 1;


  /*
   * Show chat while listening.
   */
  show("chat");


  recognition.onstart = () => {

    const button =
      document.getElementById(
        "speakBtn"
      );

    button.textContent = "🔴";

    button.setAttribute(
      "aria-label",
      "Listening"
    );
  };


  recognition.onresult =
    event => {

      const transcript =
        event.results[0][0]
          .transcript;

      const input =
        document.getElementById(
          "messageInput"
        );

      input.value =
        transcript;

      /*
       * Automatically send
       * what you said to Niko.
       */
      document
        .getElementById("chatForm")
        .requestSubmit();
    };


  recognition.onerror =
    event => {

      console.log(
        "Voice recognition error:",
        event.error
      );
    };


  recognition.onend = () => {

    const button =
      document.getElementById(
        "speakBtn"
      );

    button.textContent = "🎙️";

    button.setAttribute(
      "aria-label",
      "Voice input"
    );
  };


  try {

    recognition.start();

  } catch (error) {

    console.log(
      "Could not start voice recognition:",
      error
    );
  }
};


/* =========================
   SERVICE WORKER
========================= */

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});

}
