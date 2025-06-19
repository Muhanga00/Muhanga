import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  query,
  where,
  addDoc,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyClUZhBQl8PHUtry4XoebfW5AWTK3F1vzg",
  authDomain: "muhanga-001.firebaseapp.com",
  projectId: "muhanga-001",
  storageBucket: "muhanga-001.firebasestorage.app",
  messagingSenderId: "573247415653",
  appId: "1:573247415653:web:8d7430641ea5545cb5ed8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM elements
const messageInput = document.getElementById("message-input");
const chatForm = document.getElementById("chat-form");
const chatContainer = document.querySelector(".chat-container");
const groupPinDisplay = document.getElementById("group-pin");

// Get groupId from URL
const urlParams = new URLSearchParams(window.location.search);
const groupId = urlParams.get("groupId");
let currentUser = null;

// Auth state listener
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "signin.html";
    return;
  }

  currentUser = user;

  if (!groupId) {
    alert("Missing groupId in URL.");
    return;
  }

  const groupDoc = await getDoc(doc(db, "groups", groupId));
  if (!groupDoc.exists()) {
    alert("Group not found.");
    return;
  }

  const groupData = groupDoc.data();
  groupPinDisplay.textContent = `Group PIN: ${groupData.pin || "N/A"}`;

  subscribeToMessages();
});

// Subscribe to messages
function subscribeToMessages() {
  const q = query(
    collection(db, "group_messages"),
    where("groupId", "==", groupId)
  );

  onSnapshot(q, (snapshot) => {
    const messages = [];

    snapshot.forEach((docSnap) => {
      const msg = docSnap.data();
      msg.id = docSnap.id;

      if (!msg.message) return;
      messages.push(msg);
    });

    // Sort messages by timestamp or fallback to doc ID
    messages.sort((a, b) => {
      if (a.timestamp && b.timestamp) {
        return a.timestamp.toMillis() - b.timestamp.toMillis();
      } else {
        return a.id.localeCompare(b.id);
      }
    });

    chatContainer.innerHTML = "";

    messages.forEach((msg) => {
      const div = document.createElement("div");
      div.className = "message";
      if (msg.senderId === currentUser.uid) {
        div.classList.add("self");
      }

      const formatted = linkify(msg.message);
      div.innerHTML = `
        <div class="sender">${msg.senderName || "Anonymous"}</div>
        <div>${formatted}</div>
      `;

      chatContainer.appendChild(div);
    });

    chatContainer.scrollTop = chatContainer.scrollHeight;
  });
}

// Send a message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "group_messages"), {
      groupId,
      message: text,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || "Anonymous",
      timestamp: serverTimestamp()
    });

    messageInput.value = "";
  } catch (err) {
    console.error("Failed to send message:", err);
    alert("Message failed to send.");
  }
});

// Convert plain URLs to clickable links
function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank">${url}</a>`;
  });
}