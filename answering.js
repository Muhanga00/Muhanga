import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getFirestore, collection, query, where, getDoc, getDocs, addDoc, doc, serverTimestamp
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

const titleEl = document.getElementById("title");
const descEl = document.getElementById("description");
const rulesEl = document.getElementById("rules");
const questionsContainer = document.getElementById("questions-container");
const answerForm = document.getElementById("answer-form");

questionsContainer.innerHTML = "<p>⏳ Loading assessment...</p>";

const aid = new URLSearchParams(location.search).get("aid");
if (!aid) {
  alert("Missing assessment ID.");
  location.href = "assessments.html";
}

let currentUser = null;
let questionsList = [];

onAuthStateChanged(auth, async (user) => {
  if (!user) return location.href = "assessments.html";
  currentUser = user;

  try {
    await loadAssessment();
    await loadQuestions();
  } catch (e) {
    console.error(e);
    alert("Failed to load assessment.");
    location.href = "assessments.html";
  }
});

async function loadAssessment() {
  const snap = await getDoc(doc(db, "assessments", aid));
  if (!snap.exists()) throw new Error("Assessment not found");

  const a = snap.data();
  titleEl.textContent = a.name || "Untitled";
  descEl.textContent = a.description || "";
  rulesEl.textContent = a.rules || "";
}

async function loadQuestions() {
  const qSnap = await getDocs(query(collection(db, "questions"), where("assessmentId", "==", aid)));
  questionsList = qSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  if (questionsList.length === 0) {
    questionsContainer.innerHTML = "<p>No questions found.</p>";
    return;
  }

  questionsContainer.innerHTML = "";

  for (let i = 0; i < questionsList.length; i++) {
    const q = questionsList[i];
    const box = document.createElement("div");
    box.className = "question-box";

    const label = document.createElement("label");
    label.innerHTML = `<strong>Q${i + 1}:</strong> ${q.question} (${q.marks || 0} marks)`;
    box.appendChild(label);

    if (q.type === "multiple" && q.options && typeof q.options === "object") {
      for (const key in q.options) {
        const opt = document.createElement("label");
        opt.style.display = "block";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `q-${q.id}`;
        radio.value = key;

        opt.appendChild(radio);
        opt.append(` ${key}: ${q.options[key]}`);
        box.appendChild(opt);
      }
    } else {
      const textarea = document.createElement("textarea");
      textarea.name = `q-${q.id}`;
      textarea.rows = 3;
      textarea.placeholder = "Your answer...";
      textarea.style.width = "100%";
      box.appendChild(textarea);
    }

    questionsContainer.appendChild(box);
  }
}

answerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const answers = [];
  let totalMarks = 0;
  let earnedMarks = 0;

  for (const q of questionsList) {
    const input = document.querySelector(`[name="q-${q.id}"]:checked`) || document.querySelector(`[name="q-${q.id}"]`);
    const value = input?.value?.trim();
    if (!value) {
      alert("Answer all questions before submitting.");
      return;
    }

    const marks = parseFloat(q.marks) || 0;
    totalMarks += marks;

    let isCorrect = false;
    let marksEarned = 0;

    if (q.type === "multiple") {
      isCorrect = (q.correctOption === value);
      if (isCorrect) marksEarned = marks;
    } else {
      // Open-ended: grant full marks automatically
      marksEarned = marks;
    }

    earnedMarks += marksEarned;

    answers.push({
      assessmentId: aid,
      questionId: q.id,
      questionText: q.question,
      answer: value,
      isCorrect: isCorrect,
      marksEarned: marksEarned,
      totalMarks: marks,
      userId: currentUser.uid,
      submittedAt: serverTimestamp()
    });
  }

  try {
    for (const ans of answers) {
      await addDoc(collection(db, "answers"), ans);
    }

    alert(`✅ Answers submitted!\nYou earned ${earnedMarks} out of ${totalMarks} marks.`);
    location.href = "assessments.html";
  } catch (err) {
    console.error("Submit error", err);
    alert("Failed to submit answers.");
  }
});