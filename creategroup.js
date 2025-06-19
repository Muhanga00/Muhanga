import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.9.0/firebase-auth.js";

// Firebase Config
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

const groupList = document.getElementById("groups-list");
const modal = document.getElementById("group-modal");
const openModalBtn = document.getElementById("open-modal");
const createBtn = document.getElementById("create-group-btn");
const searchInput = document.getElementById("search-groups");
const toggleBtn = document.getElementById("toggle-my-groups");

let currentUser = null;
let currentUserData = null;
let showOnlyMyGroups = false;
let groupsCache = [];

// Show modal
openModalBtn.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Toggle between all groups and user's groups
toggleBtn.addEventListener("click", () => {
  showOnlyMyGroups = !showOnlyMyGroups;
  toggleBtn.textContent = showOnlyMyGroups ? "Show All Groups" : "Show My Groups";
  renderGroupList(groupsCache);
});

// Search filter
searchInput.addEventListener("input", () => {
  renderGroupList(groupsCache);
});

// Auth check
onAuthStateChanged(auth, async user => {
  if (!user) return location.href = "signin.html";
  currentUser = user;

  const usersSnap = await collection(db, "users");
  onSnapshot(usersSnap, (snapshot) => {
    const allUsers = {};
    snapshot.docs.forEach(doc => {
      const d = doc.data();
      allUsers[d.uid] = d.name;
    });

    currentUserData = allUsers[currentUser.uid];
    loadGroups(allUsers);
  });
});

// Generate 6-digit PIN
function generatePin() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Live load groups
function loadGroups(userMap) {
  onSnapshot(collection(db, "groups"), (snapshot) => {
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      creatorName: userMap[doc.data().creatorId] || "Unknown"
    }));
    groupsCache = groups;
    renderGroupList(groups);
  });
}

// Render group list
function renderGroupList(groups) {
  const searchTerm = searchInput.value.toLowerCase();
  groupList.innerHTML = "";

  groups
    .filter(g => g.name.toLowerCase().includes(searchTerm))
    .filter(g => !showOnlyMyGroups || g.members?.includes(currentUser.uid))
    .forEach(group => {
      const isMember = group.members?.includes(currentUser.uid);
      const div = document.createElement("div");
      div.className = "group-card";
      div.innerHTML = `
        <div>
          <h4>${group.name}</h4>
          <small>By: ${group.creatorName}</small>
          <p>${group.description}</p>
          <small>Members: ${group.members?.length || 0}</small>
          ${isMember ? '<span class="notif-icon">🔔</span>' : ""}
        </div>
      `;

      div.onclick = () => handleJoinGroup(group.id, group);

      if (group.creatorId === currentUser.uid) {
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "danger-btn";
        delBtn.onclick = async (e) => {
          e.stopPropagation();
          if (confirm("Delete this group?")) {
            await deleteDoc(doc(db, "groups", group.id));
            alert("Group deleted");
          }
        };
        div.appendChild(delBtn);
      }

      if (isMember && group.creatorId !== currentUser.uid) {
        const leaveBtn = document.createElement("button");
        leaveBtn.textContent = "Leave";
        leaveBtn.className = "leave-btn";
        leaveBtn.onclick = async (e) => {
          e.stopPropagation();
          const updated = group.members.filter(uid => uid !== currentUser.uid);
          await updateDoc(doc(db, "groups", group.id), { members: updated });
          alert("You left the group.");
        };
        div.appendChild(leaveBtn);
      }

      groupList.appendChild(div);
    });
}

// Join group logic
async function handleJoinGroup(groupId, group) {
  const isCreator = group.creatorId === currentUser.uid;
  const isMember = group.members?.includes(currentUser.uid);

  if (isCreator || isMember) {
    location.href = `groupchat.html?groupId=${groupId}`;
    return;
  }

  const enteredPin = prompt(`Enter PIN to join "${group.name}":`);
  if (enteredPin === group.pin) {
    const updatedMembers = [...(group.members || []), currentUser.uid];
    await updateDoc(doc(db, "groups", groupId), { members: updatedMembers });
    location.href = `groupchat.html?groupId=${groupId}`;
  } else {
    alert("Wrong PIN!");
  }
}

// Create new group
createBtn.addEventListener("click", async () => {
  const name = document.getElementById("group-name").value.trim();
  const desc = document.getElementById("group-desc").value.trim();
  if (!name) return alert("Group name required.");

  const pin = generatePin();
  try {
    await addDoc(collection(db, "groups"), {
      name,
      description: desc,
      creatorId: currentUser.uid,
      pin,
      members: [currentUser.uid],
      createdAt: new Date()
    });
    alert(`Group created!\nPIN: ${pin}`);
    modal.style.display = "none";
  } catch (err) {
    console.error(err);
    alert("Failed to create group.");
  }
});
