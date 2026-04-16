// ---------------- TAB SWITCHING LOGIC ----------------
// Simple tab navigation for sidebar
// showTab(tabName): Hides all sections, shows only the selected one, highlights active tab
function showTab(tabName) {
  // Hide all tab pages
  var tabs = ['dashboard', 'live', 'alerts', 'control', 'about'];
  tabs.forEach(function(tab) {
    var section = document.getElementById(tab);
    if (section) {
      section.style.display = 'none';
      section.classList.remove('active');
    }
    var btn = document.getElementById('tab-' + tab);
    if (btn) btn.classList.remove('active');
  });
  // Show selected tab
  var activeSection = document.getElementById(tabName);
  if (activeSection) {
    activeSection.style.display = 'block';
    setTimeout(function() { activeSection.classList.add('active'); }, 10); // for transition
  }
  // Highlight active button
  var activeBtn = document.getElementById('tab-' + tabName);
  if (activeBtn) activeBtn.classList.add('active');
}

// Set Dashboard as default tab on page load
window.addEventListener('DOMContentLoaded', function() {
  showTab('dashboard');
});

// ---- Mobile Menu Toggle ----
function toggleMobileMenu() {
  const sidebar = document.getElementById('sidebar');
  const navTabs = document.getElementById('nav-tabs');
  sidebar.classList.toggle('mobile-open');
  navTabs.classList.toggle('mobile-open');
}

// ---- Alert Functions ----
function dismissAlert() {
  const banner = document.getElementById('fire-alert-banner');
  banner.style.display = 'none';
}

// ---- Control Panel Functions ----
function simulateFire() {
  // Update Firebase with fire simulation data
  db.ref("/").set({
    temperature: 85,
    smoke: 450,
    status: "FIRE DETECTED"
  });
}

function resetSystem() {
  // Reset Firebase to safe state
  db.ref("/").set({
    temperature: 25,
    smoke: 50,
    status: "SAFE"
  });
}

// ---- Chart and Logging Variables ----
let sensorChart;
let dataLogs = []; // Array to store last 5 readings

// ---- Initialize Chart ----
function initChart() {
  const ctx = document.getElementById('sensorChart').getContext('2d');
  sensorChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Temperature (°C)',
        data: [],
        borderColor: '#ff5722',
        backgroundColor: 'rgba(255, 87, 34, 0.1)',
        tension: 0.4
      }, {
        label: 'Smoke Level',
        data: [],
        borderColor: '#9c27b0',
        backgroundColor: 'rgba(156, 39, 176, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

// ---- Update Chart ----
function updateChart(temperature, smoke) {
  if (!sensorChart) return;
  const now = new Date();
  const timeLabel = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');
  
  sensorChart.data.labels.push(timeLabel);
  sensorChart.data.datasets[0].data.push(temperature);
  sensorChart.data.datasets[1].data.push(smoke);
  
  // Keep only last 10 points
  if (sensorChart.data.labels.length > 10) {
    sensorChart.data.labels.shift();
    sensorChart.data.datasets[0].data.shift();
    sensorChart.data.datasets[1].data.shift();
  }
  
  sensorChart.update();
}

// ---- Logging System ----
function addLogEntry(temperature, smoke, status) {
  const timestamp = formatDateTime();
  const logEntry = {
    time: timestamp,
    temperature: temperature,
    smoke: smoke,
    status: status
  };
  
  dataLogs.unshift(logEntry); // Add to beginning
  if (dataLogs.length > 5) {
    dataLogs.pop(); // Remove oldest
  }
  
  updateLogTable();
}

function updateLogTable() {
  const tbody = document.getElementById('log-body');
  tbody.innerHTML = '';
  
  dataLogs.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.time}</td>
      <td>${log.temperature} °C</td>
      <td>${log.smoke}</td>
      <td>${log.status}</td>
    `;
    tbody.appendChild(row);
  });
}

// ---- Notification System ----
function showNotification(message) {
  const popup = document.getElementById('notification-popup');
  const messageEl = document.getElementById('notification-message');
  messageEl.textContent = message;
  popup.style.display = 'block';
  
  // Auto-hide after 3 seconds
  setTimeout(() => {
    popup.style.display = 'none';
  }, 3000);
}

// ---- Alert Banner ----
function updateAlertBanner(status) {
  const banner = document.getElementById('fire-alert-banner');
  if (status === 'FIRE DETECTED') {
    banner.style.display = 'flex';
    // Play alert sound (if supported)
    try {
      const audio = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav');
      audio.play();
    } catch (e) {
      // Sound not supported or file not available
    }
    showNotification('Fire Detected! Immediate action required!');
  } else {
    banner.style.display = 'none';
  }
}

// ---- Status Badge Update ----
function updateStatusBadge(status) {
  const badge = document.getElementById('status-badge');
  const emoji = document.getElementById('status-emoji');
  const value = document.getElementById('status-value');
  
  if (status === 'SAFE') {
    badge.className = 'status-badge safe';
    emoji.textContent = '🟢';
    value.textContent = 'SAFE';
  } else if (status === 'FIRE DETECTED') {
    badge.className = 'status-badge fire';
    emoji.textContent = '🔴';
    value.textContent = 'FIRE DETECTED';
  } else {
    badge.className = 'status-badge';
    emoji.textContent = '⚪';
    value.textContent = status || '--';
  }
}

// ---- Initialize on Load ----
window.addEventListener('DOMContentLoaded', function() {
  showTab('dashboard');
  initChart();
});


// Forest Fire Monitoring System Dashboard Script
// ---------------------------------------------
// This script connects to Firebase Realtime Database and updates the UI in real-time.
// Ready for ESP8266 sensor integration: Send data to the same database path ('/')
//
// Data format expected from hardware (ESP8266):
// {
//   "temperature": number,
//   "smoke": number,
//   "status": "SAFE" or "FIRE DETECTED"
// }

// ---- Firebase Configuration (SIMPLE & CORRECT) ----
// Only apiKey and databaseURL are required for this project

// ---- Firebase Configuration ----
// Only apiKey and databaseURL are required. Provided by user.
var firebaseConfig = {
  apiKey: "AIzaSyCJPxE-AdsmHLyGejshKmF2Kx9XymXZHYM",
  databaseURL: "https://forestfiredetection-8105a-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase (v8)
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();

// ---- Date and Time Formatting Function ----
// Formats current date and time as DD-MM-YYYY HH:MM:SS
function formatDateTime() {
  const now = new Date();
  // Get date components with leading zeros
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0'); // getMonth() is 0-based
  const year = now.getFullYear();
  // Get time components with leading zeros
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  // Return formatted string
  return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
}

// --------- Real-time Data Update ---------
// Listen for changes at root ("/")
db.ref("/").on("value", function(snapshot) {
  const data = snapshot.val();
  console.log("Firebase Data:", data); // For debugging

  // Update last updated timestamp
  const timestamp = formatDateTime();
  const lastUpdatedEl = document.getElementById("last-updated");
  const headerLastUpdatedEl = document.getElementById("header-last-updated");
  if (lastUpdatedEl) lastUpdatedEl.textContent = `Last updated: ${timestamp}`;
  if (headerLastUpdatedEl) headerLastUpdatedEl.textContent = `Last updated: ${timestamp}`;

  // Get UI elements
  var tempEl = document.getElementById("temperature-value");
  var smokeEl = document.getElementById("smoke-value");
  var statusEl = document.getElementById("status-value");
  // Live Data tab elements
  var liveTempEl = document.getElementById("live-temperature");
  var liveSmokeEl = document.getElementById("live-smoke");
  var liveStatusEl = document.getElementById("live-status");

  if (data) {
    // Update dashboard values
    if (tempEl) tempEl.textContent = data.temperature !== undefined ? data.temperature : "--";
    if (smokeEl) smokeEl.textContent = data.smoke !== undefined ? data.smoke : "--";
    updateStatusBadge(data.status);
    
    // Update live data tab values
    if (liveTempEl) liveTempEl.textContent = data.temperature !== undefined ? data.temperature + ' °C' : "-- °C";
    if (liveSmokeEl) liveSmokeEl.textContent = data.smoke !== undefined ? data.smoke : "--";
    if (liveStatusEl) {
      liveStatusEl.textContent = data.status || "--";
      liveStatusEl.style.fontWeight = "bold";
      if (data.status === "FIRE DETECTED") {
        liveStatusEl.style.color = "#d32f2f";
        liveStatusEl.style.animation = "blink 1s steps(2, start) infinite";
      } else if (data.status === "SAFE") {
        liveStatusEl.style.color = "#388e3c";
        liveStatusEl.style.animation = "none";
      } else {
        liveStatusEl.style.color = "";
        liveStatusEl.style.animation = "none";
      }
    }
    
    // Update chart and logging
    if (data.temperature !== undefined && data.smoke !== undefined) {
      updateChart(data.temperature, data.smoke);
      addLogEntry(data.temperature, data.smoke, data.status || "--");
    }
    
    // Update alerts
    updateAlertBanner(data.status);
  } else {
    // No data fallback
    if (tempEl) tempEl.textContent = "No Data";
    if (smokeEl) smokeEl.textContent = "No Data";
    updateStatusBadge("NO DATA");
    if (liveTempEl) liveTempEl.textContent = "No Data";
    if (liveSmokeEl) liveSmokeEl.textContent = "No Data";
    if (liveStatusEl) {
      liveStatusEl.textContent = "No Data";
      liveStatusEl.style.color = "";
      liveStatusEl.style.animation = "none";
    }
  }
});

// ---- Blinking Animation for FIRE DETECTED ----
// Add this CSS to your style.css if not present:
// @keyframes blink {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.2; }
// }

// ---- How Real-Time Update Works ----
// Whenever the Firebase database at path "/" changes, the callback above runs and updates the dashboard instantly.
// In the future, ESP8266 sensors will send temperature, smoke, and status data to this path, and the dashboard will reflect changes in real time.
// Responsive: handle orientation changes (optional, for best UX)
window.addEventListener('orientationchange', function() {
  window.scrollTo(0, 1);
});

// ---- END OF SCRIPT ----
