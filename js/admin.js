// ===== Admin Page Logic =====

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const adminNavBtns = document.querySelectorAll(".admin-nav .nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    // Player Management Elements
    const playerNameInput = document.getElementById("playerName");
    const playerCodeInput = document.getElementById("playerCode");
    const playerPositionInput = document.getElementById("playerPosition");
    const playerNumberInput = document.getElementById("playerNumber");
    const addPlayerBtn = document.getElementById("addPlayerBtn");
    const playersListAdmin = document.getElementById("playersListAdmin");

    // Match Management Elements
    const matchOpponentInput = document.getElementById("matchOpponent");
    const matchDateInput = document.getElementById("matchDate");
    const matchTimeInput = document.getElementById("matchTime");
    const matchLocationInput = document.getElementById("matchLocation");
    const matchTypeSelect = document.getElementById("matchType");
    const addMatchBtn = document.getElementById("addMatchBtn");
    const matchesListAdmin = document.getElementById("matchesListAdmin");

    // Notification Elements
    const notificationMessageInput = document.getElementById("notificationMessage");
    const sendNotificationBtn = document.getElementById("sendNotificationBtn");

    // Posts Management Elements
    const allPostsListAdmin = document.getElementById("allPostsListAdmin");

    // Settings Elements
    const toggleChatSwitch = document.getElementById("toggleChat");
    const togglePostsSwitch = document.getElementById("togglePosts");
    const clearGeneralChatBtn = document.getElementById("clearGeneralChatBtn");

    // Dashboard Stats
    const totalPlayersSpan = document.getElementById("totalPlayers");
    const totalGeneralMessagesSpan = document.getElementById("totalGeneralMessages");
    const totalPostsSpan = document.getElementById("totalPosts");

    // Check if admin is logged in
    if (localStorage.getItem("userType") !== "admin") {
        window.location.href = "index.html";
    }

    // Logout functionality
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("userType");
        localStorage.removeItem("loggedInUser");
        window.location.href = "index.html";
    });

    // Tab switching functionality
    adminNavBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            adminNavBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabContents.forEach(content => content.classList.remove("active"));
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
        });
    });

    // --- Player Management ---
    addPlayerBtn.addEventListener("click", async () => {
        const name = playerNameInput.value.trim();
        const code = playerCodeInput.value.trim();
        const position = playerPositionInput.value.trim();
        const number = parseInt(playerNumberInput.value.trim());

        if (!name || !code || !position || isNaN(number)) {
            FCWolves.showNotification("الرجاء ملء جميع حقول اللاعب بشكل صحيح.", "error");
            return;
        }

        try {
            // Check if player code already exists
            const snapshot = await FCWolves.database.ref("players").orderByChild("code").equalTo(code).once("value");
            if (snapshot.exists()) {
                FCWolves.showNotification("رمز اللاعب موجود بالفعل. الرجاء اختيار رمز آخر.", "error");
                return;
            }

            const newPlayerRef = FCWolves.database.ref("players").push();
            await newPlayerRef.set({
                name,
                code,
                position,
                number,
                online: false
            });
            FCWolves.showNotification("تم إضافة اللاعب بنجاح!");
            playerNameInput.value = "";
            playerCodeInput.value = "";
            playerPositionInput.value = "";
            playerNumberInput.value = "";
        } catch (error) {
            console.error("Error adding player:", error);
            FCWolves.showNotification("حدث خطأ أثناء إضافة اللاعب.", "error");
        }
    });

    // Listen for player changes
    FCWolves.database.ref("players").on("value", (snapshot) => {
        playersListAdmin.innerHTML = "";
        let playerCount = 0;
        snapshot.forEach((childSnapshot) => {
            const player = childSnapshot.val();
            const playerId = childSnapshot.key;
            playerCount++;
            const playerCard = document.createElement("div");
            playerCard.className = "player-card-admin card";
            playerCard.innerHTML = `
                <h3>${player.name}</h3>
                <p>الرمز: ${player.code}</p>
                <p>المركز: ${player.position}</p>
                <p>الرقم: ${player.number}</p>
                <button class="btn btn-danger delete-player-btn" data-id="${playerId}">
                    <i class="fas fa-trash"></i> حذف
                </button>
            `;
            playersListAdmin.appendChild(playerCard);
        });
        totalPlayersSpan.textContent = playerCount;

        // Add event listeners for delete buttons
        document.querySelectorAll(".delete-player-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const playerIdToDelete = e.target.dataset.id;
                if (confirm("هل أنت متأكد من حذف هذا اللاعب؟")) {
                    try {
                        await FCWolves.database.ref(`players/${playerIdToDelete}`).remove();
                        FCWolves.showNotification("تم حذف اللاعب بنجاح!");
                    } catch (error) {
                        console.error("Error deleting player:", error);
                        FCWolves.showNotification("حدث خطأ أثناء حذف اللاعب.", "error");
                    }
                }
            });
        });
    });

    // --- Match Management ---
    addMatchBtn.addEventListener("click", async () => {
        const opponent = matchOpponentInput.value.trim();
        const date = matchDateInput.value;
        const time = matchTimeInput.value;
        const location = matchLocationInput.value.trim();
        const type = matchTypeSelect.value;

        if (!opponent || !date || !time || !location || !type) {
            FCWolves.showNotification("الرجاء ملء جميع حقول المباراة.", "error");
            return;
        }

        try {
            const newMatchRef = FCWolves.database.ref("matches").push();
            await newMatchRef.set({
                opponent,
                date,
                time,
                location,
                type,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            FCWolves.showNotification("تم إضافة المباراة بنجاح!");
            matchOpponentInput.value = "";
            matchDateInput.value = "";
            matchTimeInput.value = "";
            matchLocationInput.value = "";
            matchTypeSelect.value = "ودية";
        } catch (error) {
            console.error("Error adding match:", error);
            FCWolves.showNotification("حدث خطأ أثناء إضافة المباراة.", "error");
        }
    });

    // Listen for match changes
    FCWolves.database.ref("matches").on("value", (snapshot) => {
        matchesListAdmin.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const match = childSnapshot.val();
            const matchId = childSnapshot.key;
            const matchItem = document.createElement("div");
            matchItem.className = "match-item card";
            matchItem.innerHTML = `
                <div class="match-details">
                    <h4>${match.opponent} (${match.type})</h4>
                    <p>التاريخ: ${match.date} الوقت: ${match.time}</p>
                    <p>المكان: ${match.location}</p>
                </div>
                <button class="btn btn-danger delete-match-btn" data-id="${matchId}">
                    <i class="fas fa-trash"></i> حذف
                </button>
            `;
            matchesListAdmin.appendChild(matchItem);
        });

        // Add event listeners for delete buttons
        document.querySelectorAll(".delete-match-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const matchIdToDelete = e.target.dataset.id;
                if (confirm("هل أنت متأكد من حذف هذه المباراة؟")) {
                    try {
                        await FCWolves.database.ref(`matches/${matchIdToDelete}`).remove();
                        FCWolves.showNotification("تم حذف المباراة بنجاح!");
                    } catch (error) {
                        console.error("Error deleting match:", error);
                        FCWolves.showNotification("حدث خطأ أثناء حذف المباراة.", "error");
                    }
                }
            });
        });
    });

    // --- Notification System ---
    sendNotificationBtn.addEventListener("click", async () => {
        const message = notificationMessageInput.value.trim();
        if (!message) {
            FCWolves.showNotification("الرجاء كتابة رسالة الإشعار.", "error");
            return;
        }

        try {
            const newNotificationRef = FCWolves.database.ref("notifications").push();
            await newNotificationRef.set({
                message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });
            FCWolves.showNotification("تم إرسال الإشعار بنجاح!");
            notificationMessageInput.value = "";
        } catch (error) {
            console.error("Error sending notification:", error);
            FCWolves.showNotification("حدث خطأ أثناء إرسال الإشعار.", "error");
        }
    });

    // --- Posts Management (Admin View) ---
    FCWolves.database.ref("posts").on("value", (snapshot) => {
        allPostsListAdmin.innerHTML = "";
        let postCount = 0;
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            const postId = childSnapshot.key;
            postCount++;
            const postItem = document.createElement("div");
            postItem.className = "post-item card";
            postItem.innerHTML = `
                <div class="post-header">
                    <span class="post-author">${post.authorName}</span>
                    <span class="post-date">${FCWolves.formatDate(post.timestamp)}</span>
                </div>
                <p class="post-content">${post.content}</p>
                ${post.imageUrl ? `<img src="${post.imageUrl}" alt="Post Image" style="max-width: 100%; border-radius: 8px; margin-top: 10px;">` : ``}
                <button class="btn btn-danger delete-post-btn" data-id="${postId}">
                    <i class="fas fa-trash"></i> حذف المنشور
                </button>
            `;
            allPostsListAdmin.appendChild(postItem);
        });
        totalPostsSpan.textContent = postCount;

        // Add event listeners for delete buttons
        document.querySelectorAll(".delete-post-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postIdToDelete = e.target.dataset.id;
                if (confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
                    try {
                        await FCWolves.database.ref(`posts/${postIdToDelete}`).remove();
                        FCWolves.showNotification("تم حذف المنشور بنجاح!");
                    } catch (error) {
                        console.error("Error deleting post:", error);
                        FCWolves.showNotification("حدث خطأ أثناء حذف المنشور.", "error");
                    }
                }
            });
        });
    });

    // --- Settings Management ---
    // Load initial settings
    FCWolves.database.ref("settings").on("value", (snapshot) => {
        const settings = snapshot.val();
        if (settings) {
            toggleChatSwitch.checked = settings.chatEnabled;
            togglePostsSwitch.checked = settings.postsEnabled;
        }
    });

    // Toggle Chat
    toggleChatSwitch.addEventListener("change", async (e) => {
        try {
            await FCWolves.database.ref("settings/chatEnabled").set(e.target.checked);
            FCWolves.showNotification(`تم ${e.target.checked ? "تفعيل" : "تعطيل"} الدردشة العامة.`);
        } catch (error) {
            console.error("Error toggling chat:", error);
            FCWolves.showNotification("حدث خطأ أثناء تغيير حالة الدردشة.", "error");
        }
    });

    // Toggle Posts
    togglePostsSwitch.addEventListener("change", async (e) => {
        try {
            await FCWolves.database.ref("settings/postsEnabled").set(e.target.checked);
            FCWolves.showNotification(`تم ${e.target.checked ? "تفعيل" : "تعطيل"} المنشورات.`);
        } catch (error) {
            console.error("Error toggling posts:", error);
            FCWolves.showNotification("حدث خطأ أثناء تغيير حالة المنشورات.", "error");
        }
    });

    // Clear General Chat
    clearGeneralChatBtn.addEventListener("click", async () => {
        if (confirm("هل أنت متأكد من حذف جميع رسائل الدردشة العامة؟ لا يمكن التراجع عن هذا الإجراء!")) {
            try {
                await FCWolves.database.ref("generalChat").remove();
                FCWolves.showNotification("تم حذف جميع رسائل الدردشة العامة بنجاح!");
            } catch (error) {
                console.error("Error clearing general chat:", error);
                FCWolves.showNotification("حدث خطأ أثناء حذف رسائل الدردشة العامة.", "error");
            }
        }
    });

    // --- Dashboard Stats Update ---
    FCWolves.database.ref("generalChat").on("value", (snapshot) => {
        totalGeneralMessagesSpan.textContent = snapshot.exists() ? snapshot.numChildren() : 0;
    });
});

