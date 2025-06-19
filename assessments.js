import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, onSnapshot,
  doc, serverTimestamp, deleteDoc
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
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

// DOM
const assessmentsContainer = document.getElementById("assessments-container");
const modal = document.getElementById("create-modal");
const addBtn = document.getElementById("add-btn");
const continueBtn = document.getElementById("continue-btn");
const searchInput = document.getElementById("search-input");

let currentUser = null;
let currentUserRole = null;
let allAssessments = [];
let allUsers = {};

// Code generator
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

addBtn.addEventListener("click", () => {
  document.getElementById("assessment-code").value = generateCode();
  modal.style.display = "flex";
});

// Auth
onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "signin.html";
  currentUser = user;

  const usersSnap = await getDocs(collection(db, "users"));
  usersSnap.docs.forEach(doc => {
    const data = doc.data();
    allUsers[data.uid] = data.name || "Unknown";
  });

  const userData = usersSnap.docs.find(d => d.data().uid === user.uid)?.data();
  currentUserRole = userData?.role;

  loadAssessments();
});

// Search
searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase();
  renderAssessments(allAssessments.filter(a =>
    a.name.toLowerCase().includes(term)
  ));
});

// Load assessments
function loadAssessments() {
  onSnapshot(collection(db, "assessments"), (snapshot) => {
    allAssessments = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    renderAssessments(allAssessments);
  });
}

// Render function
function renderAssessments(list) {
  assessmentsContainer.innerHTML = "";
  list.forEach(a => {
    const creatorName = allUsers[a.creatorId] || "Unknown";
    const createdTime = a.createdAt?.toDate?.().toLocaleString() || "Unknown";

    const div = document.createElement("div");
    div.className = "assessment-card";

    div.innerHTML = `
      <h3>${a.name}</h3>
      <p><strong>Description:</strong> ${a.description}</p>
      <p><strong>Rules:</strong> ${a.rules}</p>
      <small><strong>Created by:</strong> ${creatorName}</small><br>
      <small><strong>Created at:</strong> ${createdTime}</small><br>
      ${currentUser.uid === a.creatorId ? `<small><strong>PIN:</strong> ${a.code}</small><br>` : ""}
      <small>Status: ${a.status || 'incomplete'}</small><br>
      ${currentUser.uid === a.creatorId ? `
        <button class="edit-btn">Edit</button>
        <button class="delete-btn">Delete</button>
      ` : ''}
      ${["principal", "teacher", "dos"].includes(currentUserRole) ? `
        <button class="results-btn">Show Results</button>
      ` : ''}
    `;

    // Event listeners
    div.querySelector(".edit-btn")?.addEventListener("click", () => {
      location.href = `assessmentform.html?aid=${a.id}`;
    });

    div.querySelector(".delete-btn")?.addEventListener("click", async () => {
      if (confirm("Are you sure you want to delete this assessment?")) {
        await deleteDoc(doc(db, "assessments", a.id));
        alert("Assessment deleted");
      }
    });

    div.querySelector(".results-btn")?.addEventListener("click", () => {
      location.href = `results.html?aid=${a.id}`;
    });

    if (currentUser.uid !== a.creatorId) {
      div.addEventListener("click", () => {
        if (a.status !== "complete") {
          alert("This assessment is not yet available.");
        } else {
          const enteredPin = prompt("Enter assessment PIN:");
          if (enteredPin === a.code) {
            location.href = `answering.html?aid=${a.id}`;
          } else {
            alert("Wrong code!");
          }
        }
      });
    }

    assessmentsContainer.appendChild(div);
  });
}

// Create assessment
continueBtn.addEventListener("click", async () => {
  const name = document.getElementById("assessment-name").value.trim();
  const description = document.getElementById("assessment-desc").value.trim();
  const rules = document.getElementById("assessment-rules").value.trim();
  const code = document.getElementById("assessment-code").value.trim();

  if (!name || !description || !rules || !code) {
    return alert("Fill in all fields");
  }

  if (!["principal", "teacher", "dos"].includes(currentUserRole)) {
    return alert("You are not allowed to create assessments.");
  }

  try {
    const docRef = await addDoc(collection(db, "assessments"), {
      name,
      description,
      rules,
      code,
      creatorId: currentUser.uid,
      createdAt: serverTimestamp(),
      status: "incomplete"
    });

    modal.style.display = "none";
    location.href = `assessmentform.html?aid=${docRef.id}`;
  } catch (e) {
    console.error("Failed to create assessment:", e);
    alert("Error creating assessment");
  }
});