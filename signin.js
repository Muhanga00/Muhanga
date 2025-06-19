import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle sign-in
document.getElementById("signin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const signinBtn = document.getElementById("signin-btn");
  signinBtn.disabled = true;
  signinBtn.textContent = "Signing in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);
    alert("Signed in successfully!");
    window.location.href = "learning-dashboard.html"; // or redirect based on role
  } catch (error) {
    alert("Error: " + error.message);
    signinBtn.disabled = false;
    signinBtn.textContent = "Sign In";
  }
});

// Handle forgot password
document.getElementById("forgot-password-link").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alert("Please enter your email address first.");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    alert("Password reset email sent to: " + email);
  } catch (error) {
    alert("Error: " + error.message);
  }
});

