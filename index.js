// Menu toggle function
function toggleMenu() {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.display = sidebar.style.display === 'flex' ? 'none' : 'flex';
}

// Section switching
function showSection(sectionId) {
  const sections = document.querySelectorAll('main section');
  sections.forEach(section => section.classList.remove('active-section'));

  const target = document.getElementById(sectionId);
  if (target) {
    target.classList.add('active-section');
    document.getElementById('sidebar').style.display = 'none';
  }
}

// Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import { getFirestore, collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Load posts from Firestore
async function loadPosts() {
  const postsContainer = document.getElementById("posts-container");
  postsContainer.innerHTML = "<p>Loading posts...</p>";

  try {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      postsContainer.innerHTML = "<p>No posts available yet.</p>";
      return;
    }

    postsContainer.innerHTML = "";

    querySnapshot.forEach((doc) => {
      const post = doc.data();
      const postDiv = document.createElement("div");
      postDiv.className = "post";
      postDiv.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.description}</p>
        <a href="${post.mediaLink}" target="_blank">View Media</a>
      `;
      postsContainer.appendChild(postDiv);
    });
  } catch (error) {
    console.error("Error loading posts: ", error);
    postsContainer.innerHTML = "<p>Failed to load posts. Please try again later.</p>";
  }
}

// Load posts on page load
window.addEventListener("DOMContentLoaded", () => {
  loadPosts();
});

// ✅ Make functions available in HTML (because we're using type="module")
window.toggleMenu = toggleMenu;
window.showSection = showSection;