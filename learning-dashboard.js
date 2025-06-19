import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyClUZhBQl8PHUtry4XoebfW5AWTK3F1vzg",
  authDomain: "muhanga-001.firebaseapp.com",
  projectId: "muhanga-001",
  storageBucket: "muhanga-001.firebasestorage.app",
  messagingSenderId: "573247415653",
  appId: "1:573247415653:web:8d7430641ea5545cb5ed8c",
  measurementId: "G-47CEHX3VYZ"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const userNameSpan = document.getElementById("user-name");
const usersList = document.getElementById("users-list");
const logoutBtn = document.getElementById("logout-btn");
const audio = new Audio("notification.mp3"); // Notification sound

// Track notified users to avoid duplicate alerts
const notifiedSenders = new Set();

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "signin.html";
    return;
  }

  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    const currentUser = snapshot.docs.find(doc => doc.data().uid === user.uid);
    const currentData = currentUser?.data();
    userNameSpan.textContent = currentData?.name || "User";

    usersList.innerHTML = "";

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.uid !== user.uid && data.role !== "principal") {
        const card = document.createElement("div");
        card.className = "user-card";
        card.dataset.uid = data.uid;
        card.textContent = `${data.name} (${data.role})`;
        card.onclick = () => {
          // Clear dot on click
          const dot = card.querySelector(".notification-dot");
          if (dot) dot.remove();
          notifiedSenders.delete(data.uid);
          window.location.href = `chat.html?uid=${data.uid}`;
        };
        usersList.appendChild(card);
      }
    });

    // Start watching for new messages
    watchNewMessages(user.uid);

  } catch (error) {
    console.error("Error loading users:", error);
    usersList.innerHTML = "<p>Error loading users. Try again later.</p>";
  }
});

// Monitor for new messages
function watchNewMessages(currentUid) {
  const messagesRef = collection(db, "p2p_messages");
  const q = query(messagesRef);

  onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      const msg = change.doc.data();

      if (
        change.type === "added" &&
        msg.receiverId === currentUid &&
        msg.senderId !== currentUid &&
        !notifiedSenders.has(msg.senderId)
      ) {
        notifiedSenders.add(msg.senderId);

        // Play sound
        audio.play().catch(err => console.warn("Notification sound error:", err));

        // Show red dot
        const card = document.querySelector(`[data-uid="${msg.senderId}"]`);
        if (card && !card.querySelector(".notification-dot")) {
          const dot = document.createElement("span");
          dot.className = "notification-dot";
          dot.textContent = " 🔴";
          card.appendChild(dot);
        }
      }
    });
  });
}

// Logout
logoutBtn.addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "signin.html";
  } catch (error) {
    alert("Error logging out.");
  }
});