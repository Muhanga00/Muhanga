import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClUZhBQl8PHUtry4XoebfW5AWTK3F1vzg",
  authDomain: "muhanga-001.firebaseapp.com",
  projectId: "muhanga-001",
  storageBucket: "muhanga-001.firebasestorage.app",
  messagingSenderId: "573247415653",
  appId: "1:573247415653:web:8d7430641ea5545cb5ed8c",
  measurementId: "G-47CEHX3VYZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Handle sign up form submission
document.getElementById("signup-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("name").value.trim();
  const role = document.getElementById("role").value;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submitBtn = document.getElementById("submit-btn");

  submitBtn.disabled = true;
  submitBtn.textContent = "Creating...";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: name,
      role: role,
      email: email,
      createdAt: serverTimestamp()
    });

    alert("Account created successfully!");
    window.location.href = "signin.html";
  } catch (error) {
    alert("Error: " + error.message);
    submitBtn.disabled = false;
    submitBtn.textContent = "Create Account";
  }
});

