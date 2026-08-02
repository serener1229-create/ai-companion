const BACKEND_URL = "https://niko-backend-1.onrender.com";

const pages = [...document.querySelectorAll(".page")];

function showPage(id) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === id);
  });

  window.scrollTo(0, 0);
}

/* PAGE NAVIGATION */

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


/* CHAT */

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
  "Hi! I'm Niko 👋 What would you like to talk about?"
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


/* LANGUAGES */

document.querySelectorAll("[data-lang]").forEach(button => {

  button.addEventListener("click", () => {

    const language = button.dataset.lang;

    document.getElementById(
      "languageStatus"
    ).textContent =
      `🌟 Niko is ready for ${language}! Go to Talk to Niko and say "Let's practice ${language}."`;

  });

});


/* MEMORY */

const memoryKey = "nikoMemories";

function renderMemory() {

  const list =
    document.getElementById("memoryList");

  const memories =
    JSON.parse(
      localStorage.getItem(memoryKey) || "[]"
    );

  list.innerHTML = "";

  memories.forEach((memory, index) => {

    const card =
      document.createElement("div");

    card.className = "card";

    const text =
      document.createElement("span");

    text.textContent = "💭 " + memory;

    const deleteButton =
      document.createElement("button");

    deleteButton.textContent = "🗑️";

    deleteButton.style.float = "right";
    deleteButton.style.border = "0";
    deleteButton.style.background = "transparent";
    deleteButton.style.cursor = "pointer";

    deleteButton.onclick = () => {

      memories.splice(index, 1);

      localStorage.setItem(
        memoryKey,
        JSON.stringify(memories)
      );

      renderMemory();
    };

    card.appendChild(text);
    card.appendChild(deleteButton);

    list.appendChild(card);

  });
}


document.getElementById("memoryForm").addEventListener(
  "submit",
  event => {

    event.preventDefault();

    const input =
      document.getElementById("memoryInput");

    const value =
      input.value.trim();

    if (!value) return;

    const memories =
      JSON.parse(
        localStorage.getItem(memoryKey) || "[]"
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


/* NIKO VOICE */

function speak(text) {

  if (
    !("speechSynthesis" in window) ||
    !text
  ) {
    return;
  }

  speechSynthesis.cancel();

  const voice =
    new SpeechSynthesisUtterance(text);

  voice.lang = "en-US";
  voice.rate = 0.95;
  voice.pitch = 1.05;
  voice.volume = 1;

  speechSynthesis.speak(voice);
}


/* VOICE INPUT */

const speakButton =
  document.getElementById("speakBtn");

if (speakButton) {

  speakButton.addEventListener(
    "click",
    () => {

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

      recognition.onresult =
        event => {

          document.getElementById(
            "messageInput"
          ).value =
            event.results[0][0].transcript;

          showPage("chat");

          document
            .getElementById("chatForm")
            .requestSubmit();
        };

      recognition.start();

    }
  );

}


/* SERVICE WORKER */

if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});

}
