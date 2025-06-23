// ===== Firebase Configuration =====
const firebaseConfig = {
  apiKey: "AIzaSyAaNGTCdQVnF7hqLD3irngJQquHRK8vCXk",
  authDomain: "fc-wolves-app.firebaseapp.com",
  databaseURL: "https://fc-wolves-app-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "fc-wolves-app",
  storageBucket: "fc-wolves-app.appspot.com",
  messagingSenderId: "1052697954397",
  appId: "1:1052697954397:web:7266d638b753093c94e5b4"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== Initialize Default Data =====
function initializeDefaultData() {
    // Default players data
    const defaultPlayers = {
        player1: {
            name: "جهاد الغرياني",
            code: "0011JM",
            position: "رأس حربة",
            number: 9,
            online: false
        },
        player2: {
            name: "عبدالسلام علي",
            code: "aabd11",
            position: "حارس",
            number: 1,
            online: false
        },
        player3: {
            name: "ميمد",
            code: "mmemd110",
            position: "وسط",
            number: 8,
            online: false
        },
        player4: {
            name: "تخرخوري",
            code: "ttgrgoi77",
            position: "جناح او حارس",
            number: 7,
            online: false
        },
        player5: {
            name: "ميلاد",
            code: "mmellad44",
            position: "قلب دفاع",
            number: 4,
            online: false
        },
        player6: {
            name: "الديدي",
            code: "dedeee222",
            position: "قلب دفاع",
            number: 2,
            online: false
        }
    };

    // Check if players exist, if not create them
    database.ref('players').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            database.ref('players').set(defaultPlayers);
        }
    });

    // Initialize app settings
    const defaultSettings = {
        chatEnabled: true,
        postsEnabled: true,
        teamName: "FC WOLVES"
    };

    database.ref('settings').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            database.ref('settings').set(defaultSettings);
        }
    });
}

// ===== Utility Functions =====
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
        return 'الآن';
    } else if (diff < 3600000) { // Less than 1 hour
        const minutes = Math.floor(diff / 60000);
        return `منذ ${minutes} دقيقة`;
    } else if (diff < 86400000) { // Less than 1 day
        const hours = Math.floor(diff / 3600000);
        return `منذ ${hours} ساعة`;
    } else {
        return date.toLocaleDateString('ar-SA');
    }
}

function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ===== Calendar System 2025 =====
function generateCalendar2025() {
    const months = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    
    const calendar = {};
    
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(2025, month + 1, 0).getDate();
        calendar[months[month]] = {
            monthNumber: month + 1,
            days: daysInMonth,
            events: []
        };
    }
    
    return calendar;
}

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultData();
    
    // Initialize calendar
    const calendar2025 = generateCalendar2025();
    database.ref('calendar2025').once('value', (snapshot) => {
        if (!snapshot.exists()) {
            database.ref('calendar2025').set(calendar2025);
        }
    });
});

// ===== Export for use in other files =====
window.FCWolves = {
    database,
    showNotification,
    formatDate,
    formatTime,
    generateId
};

