const BACKEND_URL = "https://niko-backend-1.onrender.com";

const screens = [...document.querySelectorAll(".screen")];

function show(id) {
  screens.forEach(s => s.classList.toggle("active", s.id === id));
  window.scrollTo(0, 0);
}

document.querySelectorAll("[data-screen]").forEach(b => {
  b.onclick = () => show(b.dataset.screen);
});

document.querySelectorAll(".back").forEach(b => {
  b.onclick = () => show("home");
});

const messages = document.getElementById("messages");

function addMessage(text, mine = false) {
  const div = document.createElement("div");
  div.className = "bubble " + (mine ? "me" : "niko");
  div.textContent = text;
  messages.appendChild(div);
  messages.scrollTop = messages.scrollHeight;
}

addMessage("Hi! I'm Niko. Ask me anything, or choose a language to practice.");

document.getElementById("chatForm").onsubmit = async e => {
  e.preventDefault();

  const input = document.getElementById("messageInput");
  const text = input.value.trim();

  if (!text) return;

  input.value = "";
  addMessage(text, true);
  addMessage("Thinking…");

  const thinking = messages.lastChild;

  try {
    const response = await fetch(BACKEND_URL + "/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message: text })
    });

    const data = await response.json();

    thinking.remove();

    const reply = data.reply || "I couldn't get a response.";
    addMessage(reply);
    speak(reply);

  } catch (error) {
    thinking.remove();

    addMessage(
      "I can't reach Niko's server right now. Please try again in a moment."
    );
  }
};

document.querySelectorAll("[data-lang]").forEach(b => {
  b.onclick = () => {
    const lang = b.dataset.lang;

    document.getElementById("languageStatus").textContent =
      `Niko is ready to practice ${lang}. Open "Ask Niko" and say: "Let's practice ${lang}."`;
  };
});

const memoryKey = "nikoMemories";

function renderMemory() {
  const list = document.getElementById("memoryList");
  const memories = JSON.parse(
    localStorage.getItem(memoryKey) || "[]"
  );

  list.innerHTML = "";

  memories.forEach((memory, index) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <span></span>
      <button style="float:right;border:0;background:none">🗑️</button>
    `;

    card.querySelector("span").textContent = memory;

    card.querySelector("button").onclick = () => {
      memories.splice(index, 1);
      localStorage.setItem(memoryKey, JSON.stringify(memories));
      renderMemory();
    };

    list.appendChild(card);
  });
}

document.getElementById("memoryForm").onsubmit = e => {
  e.preventDefault();

  const input = document.getElementById("memoryInput");
  const value = input.value.trim();

  if (!value) return;

  const memories = JSON.parse(
    localStorage.getItem(memoryKey) || "[]"
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

function speak(text) {
  if (!("speechSynthesis" in window) || !text) return;

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";

  speechSynthesis.speak(utterance);
}

document.getElementById("speakBtn").onclick = () => {
  const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice input isn't supported in this browser.");
    return;
  }

  const recognition = new SpeechRecognition();

  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.onresult = event => {
    document.getElementById("messageInput").value =
      event.results[0][0].transcript;

    show("chat");

    document.getElementById("chatForm").requestSubmit();
  };

  recognition.start();
};

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});
}
