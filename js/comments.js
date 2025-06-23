// Comments Page Logic

document.addEventListener("DOMContentLoaded", () => {
    const postPreview = document.getElementById("postPreview");
    const commentsContainer = document.getElementById("commentsContainer");
    const commentInput = document.getElementById("commentInput");
    const submitCommentBtn = document.getElementById("submitCommentBtn");

    let loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    let currentPostId = null;

    // Check if user is logged in
    if (!loggedInUser) {
        window.location.href = "index.html";
        return;
    }

    // Get post ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentPostId = urlParams.get("postId");

    if (!currentPostId) {
        alert("معرف المنشور غير صحيح");
        history.back();
        return;
    }

    // Load post data
    FCWolves.database.ref(`posts/${currentPostId}`).once("value", (snapshot) => {
        if (snapshot.exists()) {
            const post = snapshot.val();
            displayPost(post);
        } else {
            alert("المنشور غير موجود");
            history.back();
        }
    });

    // Load comments
    loadComments();

    // Submit comment
    submitCommentBtn.addEventListener("click", submitComment);
    commentInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submitComment();
        }
    });

    function displayPost(post) {
        postPreview.innerHTML = `
            <div class="post-header">
                <span class="post-author">${post.authorName}</span>
                <span class="post-date">${FCWolves.formatDate(post.timestamp)}</span>
            </div>
            <p class="post-content">${post.content}</p>
        `;
    }

    function loadComments() {
        FCWolves.database.ref(`posts/${currentPostId}/comments`).on("value", (snapshot) => {
            commentsContainer.innerHTML = "";
            
            if (!snapshot.exists()) {
                commentsContainer.innerHTML = '<div class="no-comments">لا توجد تعليقات بعد. كن أول من يعلق!</div>';
                return;
            }

            const comments = [];
            snapshot.forEach((childSnapshot) => {
                const comment = childSnapshot.val();
                comment.id = childSnapshot.key;
                comments.push(comment);
            });

            // Sort comments by timestamp (newest first)
            comments.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            comments.forEach(comment => {
                const commentElement = document.createElement("div");
                commentElement.className = "comment-item";
                commentElement.innerHTML = `
                             <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${FCWolves.formatDate(comment.timestamp)}</span>
                    ${comment.authorId === loggedInUser.id ? `
                    <div class="comment-actions">
                        <button class="action-btn edit-comment-btn" data-id="${comment.id}"><i class="fas fa-edit"></i></button>
                        <button class="action-btn delete-comment-btn" data-id="${comment.id}"><i class="fas fa-trash"></i></button>
                    </div>` : ``}
                </div>
                <p class="comment-text">${comment.comment}</p>nt}</p>
                `;
                commentsContainer.appendChild(commentElement);
            });
        });
    }

    async function submitComment() {
        const commentText = commentInput.value.trim();
        
        if (!commentText) {
            FCWolves.showNotification("الرجاء كتابة تعليق.", "error");
            return;
        }

        try {
            submitCommentBtn.disabled = true;
            submitCommentBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            const newCommentRef = FCWolves.database.ref(`posts/${currentPostId}/comments`).push();
            await newCommentRef.set({
                author: loggedInUser.name,
                authorId: loggedInUser.id,
                comment: commentText,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            });

            commentInput.value = "";
            FCWolves.showNotification("تم إضافة التعليق بنجاح!");
        } catch (error) {
            console.error("Error adding comment:", error);
            FCWolves.showNotification("حدث خطأ أثناء إضافة التعليق.", "error");
        } finally {
            submitCommentBtn.disabled = false;
            submitCommentBtn.innerHTML = '<i class="fas fa-paper-plane"></i>';
        }
    }
});



        // Add event listeners for comment actions
        document.querySelectorAll(".edit-comment-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const commentId = e.currentTarget.dataset.id;
                const currentCommentText = e.currentTarget.closest(".comment-item").querySelector(".comment-text").textContent;
                const newCommentText = prompt("تعديل التعليق:", currentCommentText);
                if (newCommentText !== null && newCommentText.trim() !== "") {
                    try {
                        await FCWolves.database.ref(`posts/${currentPostId}/comments/${commentId}/comment`).set(newCommentText);
                        FCWolves.showNotification("تم تعديل التعليق بنجاح!");
                    } catch (error) {
                        console.error("Error editing comment:", error);
                        FCWolves.showNotification("حدث خطأ أثناء تعديل التعليق.", "error");
                    }
                }
            });
        });

        document.querySelectorAll(".delete-comment-btn").forEach(button => {
            button.addEventListener("click", async (e) => {
                const commentId = e.currentTarget.dataset.id;
                if (confirm("هل أنت متأكد من حذف هذا التعليق؟")) {
                    try {
                        await FCWolves.database.ref(`posts/${currentPostId}/comments/${commentId}`).remove();
                        FCWolves.showNotification("تم حذف التعليق بنجاح!");
                    } catch (error) {
                        console.error("Error deleting comment:", error);
                        FCWolves.showNotification("حدث خطأ أثناء حذف التعليق.", "error");
                    }
                }
            });
        });


