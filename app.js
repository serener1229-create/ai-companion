const BACKEND_URL = localStorage.getItem("nikoBackendURL") || "http://YOUR-COMPUTER-IP:3000";

const screens = [...document.querySelectorAll(".screen")];
function show(id){screens.forEach(s=>s.classList.toggle("active",s.id===id)); window.scrollTo(0,0)}
document.querySelectorAll("[data-screen]").forEach(b=>b.onclick=()=>show(b.dataset.screen));
document.querySelectorAll(".back").forEach(b=>b.onclick=()=>show("home"));

const messages=document.getElementById("messages");
function addMessage(text, mine=false){
  const div=document.createElement("div");
  div.className="bubble "+(mine?"me":"niko");
  div.textContent=text;
  messages.appendChild(div);
  messages.scrollTop=messages.scrollHeight;
}
addMessage("Hi! I'm Niko. Ask me anything, or choose a language to practice.");

document.getElementById("chatForm").onsubmit=async e=>{
  e.preventDefault();
  const input=document.getElementById("messageInput"), text=input.value.trim();
  if(!text)return;
  input.value=""; addMessage(text,true); addMessage("Thinking…");
  const thinking=messages.lastChild;
  try{
    const r=await fetch(BACKEND_URL+"/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text})});
    const data=await r.json();
    thinking.remove(); addMessage(data.reply||"I couldn't get a response.");
    speak(data.reply||"");
  }catch{
    thinking.remove();
    addMessage("I can't reach Niko's AI server yet. Set the backend URL in this app and make sure the backend is running.");
  }
};

document.querySelectorAll("[data-lang]").forEach(b=>b.onclick=()=>{
  const lang=b.dataset.lang;
  document.getElementById("languageStatus").textContent=`Niko is ready to practice ${lang}. Open “Ask Niko” and say: “Let's practice ${lang}. Correct my mistakes.”`;
});

const memoryKey="nikoMemories";
function renderMemory(){
  const list=document.getElementById("memoryList"), memories=JSON.parse(localStorage.getItem(memoryKey)||"[]");
  list.innerHTML="";
  memories.forEach((m,i)=>{
    const card=document.createElement("div"); card.className="card";
    card.innerHTML=`<span></span> <button style="float:right;border:0;background:none">🗑️</button>`;
    card.querySelector("span").textContent=m;
    card.querySelector("button").onclick=()=>{memories.splice(i,1);localStorage.setItem(memoryKey,JSON.stringify(memories));renderMemory()};
    list.appendChild(card);
  });
}
document.getElementById("memoryForm").onsubmit=e=>{
  e.preventDefault(); const input=document.getElementById("memoryInput"),v=input.value.trim(); if(!v)return;
  const memories=JSON.parse(localStorage.getItem(memoryKey)||"[]"); memories.push(v); localStorage.setItem(memoryKey,JSON.stringify(memories)); input.value=""; renderMemory();
};
renderMemory();

function speak(text){
  if(!("speechSynthesis" in window)||!text)return;
  speechSynthesis.cancel();
  const u=new SpeechSynthesisUtterance(text); u.lang="en-US"; speechSynthesis.speak(u);
}

document.getElementById("speakBtn").onclick=()=>{
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR){alert("Voice input is not supported in this browser. You can still use Niko by typing.");return}
  const r=new SR(); r.lang="en-US"; r.interimResults=false;
  r.onresult=e=>{document.getElementById("messageInput").value=e.results[0][0].transcript; show("chat"); document.getElementById("chatForm").requestSubmit()};
  r.start();
};

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(()=>{});
