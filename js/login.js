// ===== Login Page Logic =====

document.addEventListener("DOMContentLoaded", () => {
    const accessCodeInput = document.getElementById("accessCode");
    const loginBtn = document.getElementById("loginBtn");
    const errorMessage = document.getElementById("errorMessage");

    // Focus on input when page loads
    accessCodeInput.focus();

    // Handle Enter key press
    accessCodeInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleLogin();
        }
    });

    // Handle login button click
    loginBtn.addEventListener("click", handleLogin);

    async function handleLogin() {
        const accessCode = accessCodeInput.value.trim();

        if (!accessCode) {
            showError("الرجاء إدخال رمز الدخول.");
            return;
        }

        // Show loading state
        loginBtn.innerHTML = "<div class=\"loading\"></div> جاري التحقق...";
        loginBtn.disabled = true;

        try {
            // Check if it's the admin code
            if (accessCode === "0011JMFC") {
                localStorage.setItem("userType", "admin");
                localStorage.setItem("loggedInUser", JSON.stringify({ id: "admin", name: "المدرب", code: "0011JMFC", type: "admin" }));
                window.location.href = "admin.html";
                return;
            }

            // Check if it's a player code
            const playersSnapshot = await FCWolves.database.ref("players").orderByChild("code").equalTo(accessCode).once("value");

            if (playersSnapshot.exists()) {
                const playerData = Object.values(playersSnapshot.val())[0];
                const playerId = Object.keys(playersSnapshot.val())[0];
                
                // Store full player info in localStorage
                localStorage.setItem("userType", "player");
                localStorage.setItem("loggedInUser", JSON.stringify({ ...playerData, id: playerId, type: "player" }));
                
                // Update player online status
                await FCWolves.database.ref(`players/${playerId}/online`).set(true);
                
                // Set up disconnect handler
                FCWolves.database.ref(`players/${playerId}/online`).onDisconnect().set(false);
                
                window.location.href = "player.html";
            } else {
                showError("رمز الدخول غير صحيح. الرجاء المحاولة مرة أخرى.");
            }
        } catch (error) {
            console.error("Login error:", error);
            showError("حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.");
        } finally {
            // Reset button state
            loginBtn.innerHTML = "<i class=\"fas fa-sign-in-alt\"></i> دخول";
            loginBtn.disabled = false;
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.add("show");
        
        // Shake animation for input
        accessCodeInput.style.animation = "shake 0.5s ease-in-out";
        setTimeout(() => {
            accessCodeInput.style.animation = "";
        }, 500);
        
        setTimeout(() => {
            errorMessage.classList.remove("show");
        }, 4000);
    }
});

// Add shake animation to CSS
const style = document.createElement("style");
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);


