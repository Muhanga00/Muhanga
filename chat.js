import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyClUZhBQl8PHUtry4XoebfW5AWTK3F1vzg",
  authDomain: "muhanga-001.firebaseapp.com",
  projectId: "muhanga-001",
  storageBucket: "muhanga-001.firebasestorage.app",
  messagingSenderId: "573247415653",
  appId: "1:573247415653:web:8d7430641ea5545cb5ed8c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const messageInput = document.getElementById("message-input");
const chatForm = document.getElementById("chat-form");
const messagesContainer = document.getElementById("messages");
const chatWithName = document.getElementById("chat-with-name");
const logoutBtn = document.getElementById("logout-btn");

// Get receiver ID from URL
const urlParams = new URLSearchParams(window.location.search);
const receiverId = urlParams.get("uid");
let currentUser = null;

// Utility to generate consistent chatId
function getChatId(uid1, uid2) {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
}

// Listen for auth changes
onAuthStateChanged(auth, async (user) => {
  if (!user || !receiverId) {
    window.location.href = "signin.html";
    return;
  }

  currentUser = user;
  await loadReceiverName();
  subscribeToMessages();
});

// Load receiver name
async function loadReceiverName() {
  try {
    const snap = await getDoc(doc(db, "users", receiverId));
    const data = snap.data();
    chatWithName.textContent = `Chat with ${data?.name || "User"}`;
  } catch (err) {
    console.error("Failed to load receiver name:", err);
    chatWithName.textContent = "Chat";
  }
}

// Subscribe to messages
function subscribeToMessages() {
  const chatId = getChatId(currentUser.uid, receiverId);
  const q = query(collection(db, "p2p_messages"), orderBy("createdAt"));

  onSnapshot(q, (snapshot) => {
    messagesContainer.innerHTML = "";

    const filtered = snapshot.docs.filter(doc => doc.data().chatId === chatId);

    if (filtered.length === 0) {
      messagesContainer.innerHTML = `<p class="no-messages">No messages yet.</p>`;
      return;
    }

    filtered.forEach(async docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.className = `message ${msg.senderId === currentUser.uid ? "self" : ""}`;

      const time = msg.createdAt?.toDate
        ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : "";

      let status = "";
      if (msg.senderId === currentUser.uid) {
        status = msg.read ? "✓✓ Read" : "✓ Sent";
      }

      div.innerHTML = `
        <div class="sender">${msg.senderId === currentUser.uid ? "You" : msg.senderName || "User"}</div>
        <div class="text">${msg.text}</div>
        <div class="meta"><small>${time} ${status}</small></div>
      `;

      messagesContainer.appendChild(div);

      // Mark message as read
      if (msg.receiverId === currentUser.uid && !msg.read) {
        try {
          await updateDoc(doc(db, "p2p_messages", docSnap.id), { read: true });
        } catch (err) {
          console.error("Error updating read status:", err);
        }
      }

      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    });
  });
}

// Send a new message
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  const chatId = getChatId(currentUser.uid, receiverId);

  try {
    await addDoc(collection(db, "p2p_messages"), {
      chatId,
      text,
      senderId: currentUser.uid,
      receiverId,
      senderName: currentUser.displayName || "Anonymous",
      createdAt: serverTimestamp(),
      read: false
    });

    messageInput.value = "";
  } catch (err) {
    alert("Message failed to send.");
    console.error("Error sending message:", err);
  }
});

// Logout handler
logoutBtn.addEventListener("click", () => {
  signOut(auth).then(() => {
    window.location.href = "signin.html";
  });
});