// ===== Player Page Logic =====

document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const playerNavBtns = document.querySelectorAll(".player-nav .nav-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const playerNameHeader = document.getElementById("playerNameHeader");

    // Team Tab Elements
    const teamPlayersList = document.getElementById("teamPlayersList");
    const upcomingMatchesList = document.getElementById("upcomingMatchesList");
    const calendarContainer = document.getElementById("calendarContainer");

    // Posts Tab Elements
    const postContentInput = document.getElementById("postContent");
    const createPostBtn = document.getElementById("createPostBtn");
    const postsFeed = document.getElementById("postsFeed");

    // Chat Tab Elements
    const chatTabBtns = document.querySelectorAll(".chat-tab-btn");
    const generalChatSection = document.getElementById("general-chat-section");
    const privateChatSection = document.getElementById("private-chat-section");
    const generalChatMessageInput = document.getElementById("generalChatMessageInput");
    const sendGeneralChatBtn = document.getElementById("sendGeneralChatBtn");
    const generalChatMessages = document.getElementById("generalChatMessages");
    const generalChatTypingIndicator = document.getElementById("generalChatTypingIndicator");
    const privateChatSearchInput = document.getElementById("privateChatSearchInput");
    const privateChatUsersList = document.getElementById("privateChatUsersList");
    const privateChatHeader = document.getElementById("privateChatHeader");
    const privateChatRecipientName = document.getElementById("privateChatRecipientName");
    const privateChatMessages = document.getElementById("privateChatMessages");
    const privateChatMessageInput = document.getElementById("privateChatMessageInput");
    const sendPrivateChatBtn = document.getElementById("sendPrivateChatBtn");
    const privateChatInputArea = document.getElementById("privateChatInputArea");
    const privateChatTypingIndicator = document.getElementById("privateChatTypingIndicator");

    // Profile Tab Elements
    const profileName = document.getElementById("profileName");
    const profileCode = document.getElementById("profileCode");
    const profilePosition = document.getElementById("profilePosition");
    const profileNumber = document.getElementById("profileNumber");
    const profileAvatar = document.getElementById("profileAvatar");

    let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    let currentPrivateChatRecipient = null;
    let typingTimeout = null;
    let userLikes = JSON.parse(localStorage.getItem("userLikes")) || {};

    // Check if player is logged in
    if (!loggedInUser || loggedInUser.type !== "player") {
        window.location.href = "index.html";
        return;
    }

    playerNameHeader.textContent = loggedInUser.name;

    // Set player online status
    FCWolves.database.ref(`players/${loggedInUser.id}/online`).onDisconnect().set(false);
    FCWolves.database.ref(`players/${loggedInUser.id}/online`).set(true);

    // Logout functionality
    logoutBtn.addEventListener("click", () => {
        FCWolves.database.ref(`players/${loggedInUser.id}/online`).set(false);
        localStorage.removeItem("userType");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("userLikes");
        window.location.href = "index.html";
    });

    // Tab switching functionality
    playerNavBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            playerNavBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            tabContents.forEach(content => content.classList.remove("active"));
            document.getElementById(`${btn.dataset.tab}-tab`).classList.add("active");
        });
    });

    // --- Team Tab ---
    // Display players with online status
    FCWolves.database.ref("players").on("value", (snapshot) => {
        teamPlayersList.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const player = childSnapshot.val();
            const playerId = childSnapshot.key;
            const playerCard = document.createElement("div");
            playerCard.className = "player-card card";
            playerCard.innerHTML = `
                <h3>${player.name} ${player.online ? '<span class="online-indicator"><i class="fas fa-circle"></i></span>' : ''}</h3>
                <p>المركز: ${player.position}</p>
                <p>الرقم: ${player.number}</p>
            `;
            teamPlayersList.appendChild(playerCard);
        });
    });

    // Display upcoming matches
    FCWolves.database.ref("matches").on("value", (snapshot) => {
        upcomingMatchesList.innerHTML = "";
        snapshot.forEach((childSnapshot) => {
            const match = childSnapshot.val();
            const matchId = childSnapshot.key;
            const matchItem = document.createElement("div");
            matchItem.className = "match-item card";
            matchItem.innerHTML = `
                <h4>${match.opponent} (${match.type})</h4>
                <p>التاريخ: ${match.date} الوقت: ${match.time}</p>
                <p>المكان: ${match.location}</p>
                <div class="comment-section">
                    <textarea class="comment-input" placeholder="أضف تعليقك على المباراة..." data-match-id="${matchId}"></textarea>
                    <button class="btn btn-primary comment-btn" data-match-id="${matchId}">أضف تعليق</button>
                </div>
            `;
            upcomingMatchesList.appendChild(matchItem);
        });

        // Add event listeners for match comments
        document.querySelectorAll(".comment-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const matchId = e.target.dataset.matchId;
                const commentInput = e.target.previousElementSibling;
                const comment = commentInput.value.trim();

                if (!comment) {
                    FCWolves.showNotification("الرجاء كتابة تعليق.", "error");
                    return;
                }

                try {
                    const newCommentRef = FCWolves.database.ref(`matches/${matchId}/comments`).push();
                    await newCommentRef.set({
                        author: loggedInUser.name,
                        comment: comment,
                        timestamp: firebase.database.ServerValue.TIMESTAMP
                    });
                    FCWolves.showNotification("تم إضافة التعليق بنجاح!");
                    commentInput.value = "";
                } catch (error) {
                    console.error("Error adding comment:", error);
                    FCWolves.showNotification("حدث خطأ أثناء إضافة التعليق.", "error");
                }
            });
        });
    });

    // Calendar 2025
    function generateCalendar(year) {
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        let calendarHTML = `<h3>تقويم ${year}</h3><div class="calendar-grid">`;

        for (let i = 0; i < 12; i++) {
            const date = new Date(year, i, 1);
            const firstDay = date.getDay();
            const daysInMonth = new Date(year, i + 1, 0).getDate();

            calendarHTML += `<div class="month-card card">
                                <h4>${monthNames[i]}</h4>
                                <div class="days-grid">
                                    <span class="day-name">أحد</span>
                                    <span class="day-name">اثنين</span>
                                    <span class="day-name">ثلاثاء</span>
                                    <span class="day-name">أربعاء</span>
                                    <span class="day-name">خميس</span>
                                    <span class="day-name">جمعة</span>
                                    <span class="day-name">سبت</span>`;

            for (let j = 0; j < firstDay; j++) {
                calendarHTML += `<span class="empty-day"></span>`;
            }

            for (let day = 1; day <= daysInMonth; day++) {
                calendarHTML += `<span class="day-number">${day}</span>`;
            }
            calendarHTML += `</div></div>`;
        }
        calendarHTML += `</div>`;
        calendarContainer.innerHTML = calendarHTML;
    }

    generateCalendar(2025);

    // --- Posts Tab ---
    createPostBtn.addEventListener("click", async () => {
        const content = postContentInput.value.trim();
        if (!content) {
            FCWolves.showNotification("الرجاء كتابة محتوى المنشور.", "error");
            return;
        }

        try {
            const newPostRef = FCWolves.database.ref("posts").push();
            await newPostRef.set({
                authorId: loggedInUser.id,
                authorName: loggedInUser.name,
                content: content,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                likes: 0,
                likedBy: {},
                comments: {}
            });
            FCWolves.showNotification("تم نشر المنشور بنجاح!");
            postContentInput.value = "";
        } catch (error) {
            console.error("Error creating post:", error);
            FCWolves.showNotification("حدث خطأ أثناء نشر المنشور.", "error");
        }
    });

    // Display posts
    FCWolves.database.ref("posts").orderByChild("timestamp").on("value", (snapshot) => {
        postsFeed.innerHTML = "";
        const posts = [];
        snapshot.forEach((childSnapshot) => {
            const post = childSnapshot.val();
            post.id = childSnapshot.key;
            posts.push(post);
        });

        // Sort posts by timestamp (newest first)
        posts.reverse().forEach(post => {
            const postId = post.id;
            const isLiked = post.likedBy && post.likedBy[loggedInUser.id];
            const commentsCount = post.comments ? Object.keys(post.comments).length : 0;
            
            const postItem = document.createElement("div");
            postItem.className = "post-item card";
            postItem.innerHTML = `
                <div class="post-header">
                    <span class="post-author">${post.authorName}</span>
                    <span class="post-date">${FCWolves.formatDate(post.timestamp)}</span>
                </div>
                <p class="post-content">${post.content}</p>
                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" data-id="${postId}">
                        <i class="fas fa-thumbs-up"></i> ${post.likes || 0}
                    </button>
                    <button class="action-btn comment-post-btn" data-id="${postId}">
                        <i class="fas fa-comment"></i> ${commentsCount > 0 ? commentsCount : 'تعليق'}
                    </button>
                    ${post.authorId === loggedInUser.id ? `
                    <button class="action-btn edit-post-btn" data-id="${postId}">
                        <i class="fas fa-edit"></i> تعديل
                    </button>
                    <button class="action-btn delete-post-btn" data-id="${postId}">
                        <i class="fas fa-trash"></i> حذف
                    </button>` : ``}
                </div>
            `;
            postsFeed.appendChild(postItem);
        });

        // Add event listeners for post actions
        document.querySelectorAll(".like-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                const isCurrentlyLiked = e.currentTarget.classList.contains("liked");
                
                try {
                    const postRef = FCWolves.database.ref(`posts/${postId}`);
                    const snapshot = await postRef.once("value");
                    const post = snapshot.val();
                    
                    if (isCurrentlyLiked) {
                        // Unlike the post
                        await postRef.child(`likedBy/${loggedInUser.id}`).remove();
                        await postRef.child("likes").set((post.likes || 1) - 1);
                    } else {
                        // Check if user has already liked this post
                        if (post.likedBy && post.likedBy[loggedInUser.id]) {
                            FCWolves.showNotification("لقد أعجبت بهذا المنشور بالفعل.", "info");
                            return;
                        }
                        // Like the post
                        await postRef.child(`likedBy/${loggedInUser.id}`).set(true);
                        await postRef.child("likes").set((post.likes || 0) + 1);
                    }
                } catch (error) {
                    console.error("Error liking/unliking post:", error);
                    FCWolves.showNotification("حدث خطأ أثناء تحديث الإعجاب.", "error");
                }
            });
        });

        document.querySelectorAll(".comment-post-btn").forEach(button => {
            button.addEventListener("click", (e) => {
                const postId = e.currentTarget.dataset.id;
                window.location.href = `comments.html?postId=${postId}`;
            });
        });

        document.querySelectorAll(".edit-post-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                const currentContent = e.currentTarget.closest(".post-item").querySelector(".post-content").textContent;
                const newContent = prompt("تعديل المنشور:", currentContent);
                if (newContent !== null && newContent.trim() !== "") {
                    try {
                        await FCWolves.database.ref(`posts/${postId}/content`).set(newContent);
                        FCWolves.showNotification("تم تعديل المنشور بنجاح!");
                    } catch (error) {
                        console.error("Error editing post:", error);
                        FCWolves.showNotification("حدث خطأ أثناء تعديل المنشور.", "error");
                    }
                }
            });
        });

        document.querySelectorAll(".delete-post-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const postId = e.currentTarget.dataset.id;
                if (confirm("هل أنت متأكد من حذف هذا المنشور؟")) {
                    try {
                        await FCWolves.database.ref(`posts/${postId}`).remove();
                        FCWolves.showNotification("تم حذف المنشور بنجاح!");
                    } catch (error) {
                        console.error("Error deleting post:", error);
                        FCWolves.showNotification("حدث خطأ أثناء حذف المنشور.", "error");
                    }
                }
            });
        });
    });

    // --- Chat Tab ---
    const chatSearchInput = document.getElementById("chatSearchInput");
    const conversationsList = document.getElementById("conversationsList");
    const chatTitle = document.getElementById("chatTitle");
    const chatSubtitle = document.getElementById("chatSubtitle");
    const chatMessages = document.getElementById("chatMessages");
    const chatMessageInput = document.getElementById("chatMessageInput");
    const sendChatBtn = document.getElementById("sendChatBtn");
    const chatTypingIndicator = document.getElementById("chatTypingIndicator");

    let currentChatType = "group";
    let currentChatId = "fc_wolves";
    let currentRecipientId = null;
    let typingTimeout = null;

    // Initialize chat
    loadConversations();
    loadMessages();

    // Load conversations list
    function loadConversations() {
        FCWolves.database.ref("players").on("value", (snapshot) => {
            // Clear existing private conversations
            const existingPrivate = conversationsList.querySelectorAll('[data-chat-type="private"]');
            existingPrivate.forEach(item => item.remove());

            snapshot.forEach((childSnapshot) => {
                const player = childSnapshot.val();
                const playerId = childSnapshot.key;
                
                if (playerId !== loggedInUser.id) {
                    const conversationItem = document.createElement("div");
                    conversationItem.className = "conversation-item";
                    conversationItem.setAttribute("data-chat-type", "private");
                    conversationItem.setAttribute("data-chat-id", playerId);
                    conversationItem.innerHTML = `
                        <div class="conversation-avatar private-avatar">
                            ${player.name.charAt(0)}
                            ${player.online ? '<span class="online-dot"></span>' : ''}
                        </div>
                        <div class="conversation-info">
                            <div class="conversation-name">${player.name}</div>
                            <div class="conversation-preview">${player.online ? 'متصل' : 'غير متصل'}</div>
                        </div>
                    `;
                    conversationItem.addEventListener("click", () => switchConversation("private", playerId, player.name));
                    conversationsList.appendChild(conversationItem);
                }
            });
        });
    }

    // Switch conversation
    function switchConversation(type, chatId, recipientName = null) {
        // Update active conversation
        document.querySelectorAll(".conversation-item").forEach(item => item.classList.remove("active"));
        document.querySelector(`[data-chat-id="${chatId}"]`).classList.add("active");

        currentChatType = type;
        currentChatId = chatId;
        currentRecipientId = type === "private" ? chatId : null;

        // Update chat header
        if (type === "group") {
            chatTitle.textContent = "FC WOLVES";
            chatSubtitle.textContent = "المحادثة العامة للفريق";
        } else {
            chatTitle.textContent = recipientName;
            chatSubtitle.textContent = "محادثة خاصة";
        }

        // Load messages for this conversation
        loadMessages();
    }

    // Load messages
    function loadMessages() {
        let messagesRef;
        
        if (currentChatType === "group") {
            messagesRef = FCWolves.database.ref("generalChat");
        } else {
            const chatId = [loggedInUser.id, currentRecipientId].sort().join("_");
            messagesRef = FCWolves.database.ref(`privateChats/${chatId}`);
        }

        messagesRef.orderByChild("timestamp").limitToLast(50).on("value", (snapshot) => {
            chatMessages.innerHTML = "";
            snapshot.forEach((childSnapshot) => {
                const message = childSnapshot.val();
                const messageElement = document.createElement("div");
                messageElement.className = `message ${message.senderId === loggedInUser.id ? "sent" : "received"}`;
                messageElement.innerHTML = `
                    <div class="message-content">
                        ${message.senderId !== loggedInUser.id && currentChatType === "group" ? `<div class="sender-name">${message.senderName}</div>` : ""}
                        <div class="message-text">${message.message}</div>
                        <div class="message-time">${FCWolves.formatTime(message.timestamp)}</div>
                    </div>
                `;
                chatMessages.appendChild(messageElement);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    }

    // Send message
    sendChatBtn.addEventListener("click", sendMessage);
    chatMessageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    async function sendMessage() {
        const message = chatMessageInput.value.trim();
        if (!message) return;

        try {
            let messageRef;
            
            if (currentChatType === "group") {
                messageRef = FCWolves.database.ref("generalChat").push();
            } else {
                const chatId = [loggedInUser.id, currentRecipientId].sort().join("_");
                messageRef = FCWolves.database.ref(`privateChats/${chatId}`).push();
            }

            await messageRef.set({
                senderId: loggedInUser.id,
                senderName: loggedInUser.name,
                message: message,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            chatMessageInput.value = "";
            
            // Remove typing indicator
            if (currentChatType === "group") {
                FCWolves.database.ref(`generalChatTyping/${loggedInUser.id}`).remove();
            }
        } catch (error) {
            console.error("Error sending message:", error);
            FCWolves.showNotification("حدث خطأ أثناء إرسال الرسالة.", "error");
        }
    }

    // Typing indicator
    chatMessageInput.addEventListener("input", () => {
        if (currentChatType === "group") {
            FCWolves.database.ref(`generalChatTyping/${loggedInUser.id}`).set({
                name: loggedInUser.name,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
                FCWolves.database.ref(`generalChatTyping/${loggedInUser.id}`).remove();
            }, 3000);
        }
    });

    // Listen for typing indicators (only for group chat)
    FCWolves.database.ref("generalChatTyping").on("value", (snapshot) => {
        if (currentChatType !== "group") return;
        
        const typingUsers = [];
        snapshot.forEach((childSnapshot) => {
            const typing = childSnapshot.val();
            if (childSnapshot.key !== loggedInUser.id) {
                typingUsers.push(typing.name);
            }
        });

        if (typingUsers.length > 0) {
            chatTypingIndicator.textContent = `${typingUsers.join(", ")} يكتب...`;
            chatTypingIndicator.classList.remove("hidden");
        } else {
            chatTypingIndicator.classList.add("hidden");
        }
    });

    // Search conversations
    chatSearchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const conversationItems = conversationsList.querySelectorAll(".conversation-item");
        
        conversationItems.forEach(item => {
            const conversationName = item.querySelector(".conversation-name").textContent.toLowerCase();
            if (conversationName.includes(searchTerm)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    });

    // --- Profile Tab ---
    profileName.textContent = loggedInUser.name;
    profileCode.textContent = loggedInUser.code;
    profilePosition.textContent = loggedInUser.position;
    profileNumber.textContent = loggedInUser.number;
});

