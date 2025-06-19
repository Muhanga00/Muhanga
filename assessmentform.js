import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getFirestore, doc, updateDoc, addDoc, collection, getDoc
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  getAuth, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyClUZhBQl8PHUtry4XoebfW5AWTK3F1vzg",
  authDomain: "muhanga-001.firebaseapp.com",
  projectId: "muhanga-001",
  storageBucket: "muhanga-001.appspot.com",
  messagingSenderId: "573247415653",
  appId: "1:573247415653:web:8d7430641ea5545cb5ed8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const form = document.getElementById("question-form");
const questionType = document.getElementById("question-type");
const multiSection = document.getElementById("multiple-choice-section");
const finishBtn = document.getElementById("finish-btn");

let aid = new URLSearchParams(window.location.search).get("aid");

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "signin.html";
  const docSnap = await getDoc(doc(db, "assessments", aid));
  if (!docSnap.exists()) {
    alert("Assessment not found");
    location.href = "assessments.html";
  }
});

questionType.addEventListener("change", () => {
  multiSection.style.display = questionType.value === "multiple" ? "block" : "none";
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const question = document.getElementById("question-text").value.trim();
  const type = questionType.value;
  const marks = parseInt(document.getElementById("marks").value.trim(), 10);

  if (!question || !type || isNaN(marks) || marks <= 0) {
    return alert("Please fill in all required fields with valid values.");
  }

  let data = {
    question,
    type,
    marks,
    assessmentId: aid
  };

  if (type === "multiple") {
    const optionA = document.getElementById("optionA").value.trim();
    const optionB = document.getElementById("optionB").value.trim();
    const optionC = document.getElementById("optionC").value.trim();
    const optionD = document.getElementById("optionD").value.trim();
    const correct = document.getElementById("correctOption").value.trim().toUpperCase();

    if (!optionA || !optionB || !optionC || !optionD || !["A", "B", "C", "D"].includes(correct)) {
      return alert("Please fill all options and specify a valid correct option (A–D).");
    }

    data.options = { A: optionA, B: optionB, C: optionC, D: optionD };
    data.correctOption = correct;
  }

  try {
    await addDoc(collection(db, "questions"), data);
    alert("Question added!");

    // Clear form
    form.reset();
    multiSection.style.display = "none";
  } catch (e) {
    console.error("Error adding question", e);
    alert("Error adding question");
  }
});

finishBtn.addEventListener("click", async () => {
  try {
    await updateDoc(doc(db, "assessments", aid), { status: "complete" });
    alert("Assessment marked as complete!");
    location.href = "assessments.html";
  } catch (e) {
    console.error("Failed to update assessment", e);
    alert("Error finishing assessment");
  }
});