// SunoToolkit Cyberpunk Terminal Interface
(function () {
  "use strict";

  // Global state
  let sunoConnected = false;
  let currentTab = "generate";
  let progressInterval = null;

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function () {
    initializeApp();
    setupDragDrop();
  });

  function initializeApp() {
    setupEventListeners();
    startClock();
    checkServerStatus();
    updateNodeVersion();
    terminalBoot();
    addStyles();
    showConsoleArt();
  }

  // Terminal Boot Sequence
  function terminalBoot() {
    const bootMessages = [
      "SISTEM_BASLANIYOR...",
      "SUNO_AI_MODULU_YUKLENIYOR...",
      "TERMINAL_ARAYUZ_HAZIRLANIYOR...",
      "HAZIR.",
    ];

    let i = 0;
    const bootInterval = setInterval(function () {
      if (i < bootMessages.length) {
        updateStatus(bootMessages[i]);
        i++;
      } else {
        clearInterval(bootInterval);
        updateStatus("SISTEM_HAZIR");
      }
    }, 800);
  }

  // Real-time Clock
  function startClock() {
    function updateTime() {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("tr-TR", { hour12: false });
      const dateStr = now.toLocaleDateString("tr-TR");
      const timestampEl = document.getElementById("timestamp");
      if (timestampEl) {
        timestampEl.textContent = dateStr + "_" + timeStr;
      }
    }

    updateTime();
    setInterval(updateTime, 1000);
  }

  // Event Listeners
  function setupEventListeners() {
    // Tab switching
    document.querySelectorAll(".tab-button").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        switchTab(e.target.dataset.tab);
      });
    });

    // Connection buttons
    const initBtn = document.getElementById("initBtn");
    const statusBtn = document.getElementById("statusBtn");

    if (initBtn) initBtn.addEventListener("click", initializeSuno);
    if (statusBtn) statusBtn.addEventListener("click", checkServerStatus);

    // Form submissions
    const generateForm = document.getElementById("generateForm");
    const batchForm = document.getElementById("batchForm");
    const lyricsForm = document.getElementById("lyricsForm");

    if (generateForm) {
      generateForm.addEventListener("submit", handleGenerateForm);
    }
    if (batchForm) batchForm.addEventListener("submit", handleBatchForm);
    if (lyricsForm) lyricsForm.addEventListener("submit", handleLyricsForm);

    // Other buttons
    const loadSongsBtn = document.getElementById("loadSongsBtn");
    const downloadSampleBtn = document.getElementById("downloadSampleBtn");
    const copyLyricsBtn = document.getElementById("copyLyricsBtn");

    if (loadSongsBtn) loadSongsBtn.addEventListener("click", loadSongs);
    if (downloadSampleBtn) {
      downloadSampleBtn.addEventListener("click", downloadSampleCsv);
    }
    if (copyLyricsBtn) copyLyricsBtn.addEventListener("click", copyLyrics);

    // File upload handler
    const csvFileInput = document.getElementById("csvFile");
    if (csvFileInput) csvFileInput.addEventListener("change", handleFileSelect);

    // Prompt type change handler
    const promptType = document.getElementById("promptType");
    if (promptType) {
      promptType.addEventListener("change", function (e) {
        const promptTextarea = document.getElementById("promptText");
        if (promptTextarea) {
          if (e.target.value === "gpt") {
            promptTextarea.placeholder = "> romantik_jazz_ayisigi_hakkinda";
          } else {
            promptTextarea.placeholder =
              "> kendi_sarki_sozlerinizi_buraya_yazin";
          }
        }
      });
    }

    // Modal close
    const progressModal = document.getElementById("progressModal");
    if (progressModal) {
      progressModal.addEventListener("click", function (e) {
        if (e.target.id === "progressModal") {
          hideProgressModal();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        const activeTab = document.querySelector(".tab-panel.active");
        const form = activeTab ? activeTab.querySelector("form") : null;
        if (form) {
          e.preventDefault();
          form.dispatchEvent(new Event("submit"));
        }
      }

      if (e.key === "Escape") {
        hideProgressModal();
      }
    });
  }

  // Update Status Display
  function updateStatus(message) {
    const statusText = document.getElementById("statusText");
    if (statusText) {
      statusText.textContent = message;
    }
  }

  // Update Connection ASCII
  function updateConnectionAscii(status, auth, limit) {
    const ascii =
      "\n ┌─────────────────────────────┐\n" +
      " │     SUNO AI BAGLANTISI      │\n" +
      " │                             │\n" +
      " │  Durum: [" +
      status.padEnd(11) +
      "]       │\n" +
      " │  Kimlik: [" +
      auth.padEnd(10) +
      "]       │\n" +
      " │  Limit:  [" +
      limit.padEnd(10) +
      "]       │\n" +
      " └─────────────────────────────┘";

    const connectionAscii = document.getElementById("connectionAscii");
    if (connectionAscii) {
      connectionAscii.textContent = ascii;
    }
  }

  // Tab Management
  function switchTab(tabName) {
    if (!tabName) return;

    document.querySelectorAll(".tab-button").forEach(function (btn) {
      btn.classList.remove("active");
    });
    const activeTabBtn = document.querySelector('[data-tab="' + tabName + '"]');
    if (activeTabBtn) activeTabBtn.classList.add("active");

    document.querySelectorAll(".tab-panel").forEach(function (panel) {
      panel.classList.remove("active");
    });
    const activePanel = document.getElementById(tabName);
    if (activePanel) activePanel.classList.add("active");

    currentTab = tabName;
    logTerminalAction("TAB_DEGISTI: " + tabName.toUpperCase());
  }

  // Server Status Check
  function checkServerStatus() {
    fetch("/api/status")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        updateStatusIndicator(data);

        if (data.sunoInitialized) {
          sunoConnected = true;
          updateStatus("SUNO_AI_BAGLANDI");
          updateConnectionAscii(
            "BAGLANDI",
            "AKTIF",
            data.remainingLimit || "BILINMIYOR",
          );
        } else {
          sunoConnected = false;
          updateStatus("SUNO_AI_BEKLENIYOR");
          updateConnectionAscii("BEKLEMEDE", "BEKLENIYOR", "BILINMIYOR");
        }
      })
      .catch(function (error) {
        console.error("Status check failed:", error);
        updateStatusIndicator({ server: "error" });
        updateStatus("SUNUCU_HATASI");
        updateConnectionAscii("HATA", "BAGLANTI_YOK", "BILINMIYOR");
      });
  }

  // Update Status Indicator
  function updateStatusIndicator(data) {
    const indicator = document.getElementById("statusDot");
    if (!indicator) return;

    if (data.server === "running") {
      indicator.className = sunoConnected
        ? "status-dot connected"
        : "status-dot";
    } else {
      indicator.className = "status-dot error";
    }
  }

  // Initialize Suno AI
  function initializeSuno() {
    const initBtn = document.getElementById("initBtn");
    setButtonLoading(initBtn, true);
    updateStatus("SUNO_AI_BASLATILIYOR...");

    fetch("/api/init", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          sunoConnected = true;
          showNotification(
            "BASARILI",
            "Suno AI basariyla baglandi!",
            "success",
          );
          updateStatus("SUNO_AI_AKTIF");
          updateConnectionAscii("BAGLANDI", "AKTIF", data.remainingLimit);
          checkServerStatus();
        } else {
          throw new Error(data.error);
        }
      })
      .catch(function (error) {
        console.error("Suno initialization failed:", error);
        showNotification(
          "HATA",
          error.message || "Suno AI baglantisi basarisiz",
          "error",
        );
        updateStatus("BAGLANTI_HATASI");
        updateConnectionAscii("HATA", "BASARISIZ", "BILINMIYOR");

        if (error.message?.includes("cookie")) {
          updateConnectionAscii("COOKIE_HATA", "CONFIG_KONTROL", "BILINMIYOR");
        }
      })
      .finally(function () {
        setButtonLoading(initBtn, false);
      });
  }

  // Handle Generate Form
  function handleGenerateForm(e) {
    e.preventDefault();

    if (!sunoConnected) {
      showNotification(
        "UYARI",
        "Once Suno AI baglantisi kurulmali!",
        "warning",
      );
      return;
    }

    const formData = new FormData(e.target);
    const promptType = document.getElementById("promptType").value;
    const promptText = document.getElementById("promptText").value.trim();

    if (!promptText) {
      showNotification("HATA", "Prompt alani bos olamaz!", "error");
      return;
    }

    const payload = {
      tags: formData.get("tags") || "pop",
      make_instrumental: document.getElementById("instrumental").checked,
      title: formData.get("title") || "",
    };

    if (promptType === "gpt") {
      payload.gpt_description_prompt = promptText;
      payload.prompt = "";
    } else {
      payload.prompt = promptText;
      payload.gpt_description_prompt = "";
    }

    const generateBtn = document.getElementById("generateBtn");
    setButtonLoading(generateBtn, true);

    showProgressModal(
      "SARKI_URETILIYOR",
      "AI sarkinizi olusturuyor, lutfen bekleyin...",
    );
    updateStatus("URETIM_SURUYOR...");

    fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          showNotification(
            "BASARILI",
            data.songs.length + " sarki basariyla uretildi!",
            "success",
          );
          displayGeneratedSongs(data.songs);
          updateStatus("URETIM_TAMAMLANDI");
        } else {
          throw new Error(data.error);
        }
      })
      .catch(function (error) {
        console.error("Generate failed:", error);
        showNotification(
          "HATA",
          error.message || "Sarki uretimi basarisiz",
          "error",
        );
        updateStatus("URETIM_HATASI");
      })
      .finally(function () {
        setButtonLoading(generateBtn, false);
        hideProgressModal();
      });
  }

  // Display Generated Songs
  function displayGeneratedSongs(songs) {
    let resultHtml = '<div class="result-terminal">';
    resultHtml += '<div class="result-header">';
    resultHtml +=
      '<span class="result-title">[URETILEN_SARKILAR_' +
      songs.length +
      "]</span>";
    resultHtml += "</div>";
    resultHtml += '<div class="result-content">';

    songs.forEach(function (song, index) {
      resultHtml +=
        "[" +
        (index + 1) +
        "] " +
        (song.title || "SARKI_" + (index + 1)) +
        "\n";
      resultHtml += "    ID: " + (song.id || "BILINMIYOR") + "\n";
      resultHtml += "    DURUM: " + (song.status || "ISLEM_SURUYOR") + "\n\n";
    });

    resultHtml += "</div></div>";

    const generatePanel = document.querySelector("#generate .window-content");
    if (generatePanel) {
      const oldResults = generatePanel.querySelectorAll(".result-terminal");
      oldResults.forEach(function (result) {
        result.remove();
      });
      generatePanel.insertAdjacentHTML("beforeend", resultHtml);
    }
  }

  // Handle Batch Form
  function handleBatchForm(e) {
    e.preventDefault();

    if (!sunoConnected) {
      showNotification(
        "UYARI",
        "Once Suno AI baglantisi kurulmali!",
        "warning",
      );
      return;
    }

    const formData = new FormData(e.target);
    const csvFile = formData.get("csvFile");

    if (!csvFile || csvFile.size === 0) {
      showNotification("HATA", "CSV dosyasi secilmedi!", "error");
      return;
    }

    const batchBtn = document.getElementById("batchBtn");
    setButtonLoading(batchBtn, true);

    showProgressModal("TOPLU_URETIM", "CSV dosyasi yukleniyor ve isleniyor...");
    updateStatus("TOPLU_ISLEM_BASLIYOR...");

    fetch("/api/batch-upload", {
      method: "POST",
      body: formData,
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          showNotification(
            "BASARILI",
            data.promptCount +
              " sarki icin toplu uretim baslatildi! Tahmini sure: " +
              data.estimatedTime,
            "success",
          );

          e.target.reset();
          hideFileInfo();
          updateStatus("TOPLU_URETIM_BASLATILDI");
        } else {
          throw new Error(data.error);
        }
      })
      .catch(function (error) {
        console.error("Batch upload failed:", error);
        showNotification(
          "HATA",
          error.message || "Toplu uretim basarisiz",
          "error",
        );
        updateStatus("TOPLU_URETIM_HATASI");
      })
      .finally(function () {
        setButtonLoading(batchBtn, false);
        hideProgressModal();
      });
  }

  // Handle Lyrics Form
  function handleLyricsForm(e) {
    e.preventDefault();

    if (!sunoConnected) {
      showNotification(
        "UYARI",
        "Once Suno AI baglantisi kurulmali!",
        "warning",
      );
      return;
    }

    const prompt = document.getElementById("lyricsPrompt").value.trim();

    if (!prompt) {
      showNotification("HATA", "Sarki sozu promptu bos olamaz!", "error");
      return;
    }

    const lyricsBtn = document.getElementById("lyricsBtn");
    setButtonLoading(lyricsBtn, true);
    updateStatus("SOZ_URETILIYOR...");

    fetch("/api/lyrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          displayLyrics(data.lyrics);
          showNotification(
            "BASARILI",
            "Sarki sozu basariyla uretildi!",
            "success",
          );
          updateStatus("SOZ_URETIM_TAMAMLANDI");
        } else {
          throw new Error(data.error);
        }
      })
      .catch(function (error) {
        console.error("Lyrics generation failed:", error);
        showNotification(
          "HATA",
          error.message || "Sarki sozu uretimi basarisiz",
          "error",
        );
        updateStatus("SOZ_URETIM_HATASI");
      })
      .finally(function () {
        setButtonLoading(lyricsBtn, false);
      });
  }

  // Display Lyrics
  function displayLyrics(lyrics) {
    const resultBox = document.getElementById("lyricsResult");
    const lyricsText = document.getElementById("lyricsText");

    if (lyricsText && resultBox) {
      lyricsText.textContent = lyrics;
      resultBox.style.display = "block";
      resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }

  // Copy Lyrics
  function copyLyrics() {
    const lyricsText = document.getElementById("lyricsText");
    if (!lyricsText) return;

    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(lyricsText.textContent)
        .then(function () {
          showNotification(
            "BASARILI",
            "Sarki sozu panoya kopyalandi!",
            "success",
          );
        })
        .catch(function () {
          fallbackCopyLyrics(lyricsText);
        });
    } else {
      fallbackCopyLyrics(lyricsText);
    }
  }

  // Fallback Copy Method
  function fallbackCopyLyrics(element) {
    const textArea = document.createElement("textarea");
    textArea.value = element.textContent;
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      showNotification("BASARILI", "Sarki sozu panoya kopyalandi!", "success");
    } catch (err) {
      showNotification("HATA", "Kopyalama basarisiz", "error");
    }

    document.body.removeChild(textArea);
  }

  // Load Songs
  function loadSongs() {
    if (!sunoConnected) {
      showNotification(
        "UYARI",
        "Once Suno AI baglantisi kurulmali!",
        "warning",
      );
      return;
    }

    const loadBtn = document.getElementById("loadSongsBtn");
    setButtonLoading(loadBtn, true);
    updateStatus("SARKILAR_YUKLENIYOR...");

    fetch("/api/songs")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (data.success) {
          displaySongs(data.songs);
          showNotification(
            "BASARILI",
            data.count + " sarki yuklendi!",
            "success",
          );
          updateStatus("SARKI_LISTESI_YUKLENDI");
        } else {
          throw new Error(data.error);
        }
      })
      .catch(function (error) {
        console.error("Load songs failed:", error);
        showNotification(
          "HATA",
          error.message || "Sarki listesi yuklenemedi",
          "error",
        );
        updateStatus("SARKI_YUKLEME_HATASI");
      })
      .finally(function () {
        setButtonLoading(loadBtn, false);
      });
  }

  // Display Songs
  function displaySongs(songs) {
    const container = document.getElementById("songsContainer");
    if (!container) return;

    if (!songs || songs.length === 0) {
      container.innerHTML =
        '<div class="empty-display">' +
        '<pre class="empty-ascii">\n' +
        " ┌─────────────────────────────┐\n" +
        " │                             │\n" +
        " │      [SARKI_BULUNAMADI]     │\n" +
        " │                             │\n" +
        " │   Henuz sarki uretilmemis   │\n" +
        " │      veya yuklenemedi       │\n" +
        " │                             │\n" +
        " └─────────────────────────────┘\n" +
        "</pre>" +
        "</div>";
      return;
    }

    let songsHtml = "";
    songs.forEach(function (song, index) {
      const number = "[" + String(index + 1).padStart(3, "0") + "]";
      const title = song.title || "ISIMSIZ_SARKI";
      const id = "ID: " + (song.id || "BILINMIYOR");
      const status = getSongStatusClass(song.status);
      const genre = "TUR: " + (song.tags || "BILINMIYOR");
      const created = song.created_at
        ? "OLUSTURMA: " +
          new Date(song.created_at)
            .toLocaleString("tr-TR")
            .replace(/[:.]/g, "_")
        : "";

      songsHtml += '<div class="song-item">';
      songsHtml += '<div class="song-info">';
      songsHtml += "<h4>" + number + " " + title + "</h4>";
      songsHtml += "<p>" + id + " | TUR: " + genre + "</p>";
      if (created) songsHtml += "<p>" + created + "</p>";
      songsHtml += "</div>";
      songsHtml += '<div class="song-status ' + status + '">';
      songsHtml += song.status || "BILINMIYOR";
      songsHtml += "</div>";
      songsHtml += "</div>";
    });

    container.innerHTML = songsHtml;
  }

  // Get Song Status Class
  function getSongStatusClass(status) {
    if (!status) return "processing";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("complete") || statusLower.includes("success")) {
      return "completed";
    }
    if (statusLower.includes("error") || statusLower.includes("fail")) {
      return "failed";
    }
    return "processing";
  }

  // File Select Handler
  function handleFileSelect(e) {
    const file = e.target.files[0];
    const fileInfo = document.getElementById("fileInfo");
    if (!fileInfo) return;

    if (file) {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        showNotification("HATA", "Sadece CSV dosyalari kabul edilir!", "error");
        e.target.value = "";
        return;
      }

      fileInfo.innerHTML =
        '<div style="display: flex; align-items: center; gap: 8px;">' +
        '<span style="color: var(--primary-green);">[CSV_DOSYASI]</span>' +
        "<strong>" +
        file.name +
        "</strong>" +
        "<span>(" +
        formatFileSize(file.size) +
        ")</span>" +
        "</div>";
      fileInfo.style.display = "block";
    } else {
      fileInfo.style.display = "none";
    }
  }

  // Hide File Info
  function hideFileInfo() {
    const fileInfo = document.getElementById("fileInfo");
    if (fileInfo) fileInfo.style.display = "none";
  }

  // Format File Size
  function formatFileSize(bytes) {
    if (bytes === 0) return "0_BYTE";
    const k = 1024;
    const sizes = ["BYTE", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + "_" + sizes[i];
  }

  // Download Sample CSV
  function downloadSampleCsv() {
    const csvContent =
      "prompt,tags,make_instrumental,title\n" +
      '"romantik jazz ayisigi hakkinda",jazz,false,"Ayisigi Serenadi"\n' +
      '"yaz tatili hakkinda neseli pop sarkisi",pop,false,"Yaz Ruyalari"\n' +
      '"sakin enstrumental piyano muzigi",classical,true,"Piyano Yansimasi"\n' +
      '"ozgurluk hakkinda enerjik rock sarkisi",rock,false,"Ozgur Kalp"\n' +
      '"meditasyon icin ambient elektronik muzik",electronic,true,"Dijital Huzur"';

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "suno-toolkit-ornek.csv";
    a.click();
    window.URL.revokeObjectURL(url);

    showNotification("BASARILI", "Ornek CSV dosyasi indirildi!", "success");
  }

  // Progress Modal
  function showProgressModal(title, message) {
    const modal = document.getElementById("progressModal");
    const titleEl = document.getElementById("progressTitle");
    const messageEl = document.getElementById("progressMessage");

    if (titleEl) titleEl.textContent = "[" + title + "]";
    if (messageEl) messageEl.textContent = message;
    if (modal) modal.classList.add("show");

    simulateProgress();
  }

  function hideProgressModal() {
    const modal = document.getElementById("progressModal");
    if (modal) modal.classList.remove("show");
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
  }

  function simulateProgress() {
    const progressText = document.getElementById("progressText");
    let progress = 0;

    progressInterval = setInterval(function () {
      progress += Math.random() * 10;
      if (progress > 90) progress = 90;

      const progressStr = Math.round(progress) + "%";
      if (progressText) progressText.textContent = progressStr;
    }, 500);
  }

  // Button Loading State
  function setButtonLoading(button, loading) {
    if (!button) return;

    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = "[ISLEM_DEVAM_EDIYOR]";
      button.style.animation = "pulse 1s infinite";
    } else {
      button.disabled = false;
      button.style.animation = "";
      if (button.dataset.originalText) {
        button.textContent = button.dataset.originalText;
      }
    }
  }

  // Terminal Logging
  function logTerminalAction(action) {
    const timestamp = new Date().toLocaleTimeString("tr-TR", { hour12: false });
    console.log(
      "%c[TERMINAL] " + action,
      "color: #00ff00; font-family: monospace;",
    );
  }

  // Notifications System
  function showNotification(title, message, type) {
    type = type || "info";
    const container = document.getElementById("notifications");
    if (!container) return;

    const id = "notification-" + Date.now();

    const notification = document.createElement("div");
    notification.className = "notification " + type;
    notification.id = id;
    notification.innerHTML =
      '<div style="font-weight: bold; margin-bottom: 4px;">[' +
      title +
      "]</div>" +
      '<div style="font-size: 10px;">' +
      message +
      "</div>";

    container.appendChild(notification);

    logTerminalAction(type.toUpperCase() + ": " + title + " - " + message);

    setTimeout(function () {
      removeNotification(id);
    }, 4000);

    notification.addEventListener("click", function () {
      removeNotification(id);
    });
  }

  function removeNotification(id) {
    const notification = document.getElementById(id);
    if (notification) {
      notification.style.animation = "slideOutRight 0.3s ease forwards";
      setTimeout(function () {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }

  // Update Node Version
  function updateNodeVersion() {
    fetch("/api/status")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        const version = data.nodeVersion || "BILINMIYOR";
        const nodeVersionEl = document.getElementById("nodeVersion");
        if (nodeVersionEl) {
          nodeVersionEl.textContent = version;
        }
      })
      .catch(function () {
        const nodeVersionEl = document.getElementById("nodeVersion");
        if (nodeVersionEl) {
          nodeVersionEl.textContent = "BILINMIYOR";
        }
      });
  }

  // Add Additional Styles
  function addStyles() {
    const additionalStyles =
      "@keyframes slideOutRight {" +
      "from { transform: translateX(0); opacity: 1; }" +
      "to { transform: translateX(100%); opacity: 0; }" +
      "}" +
      "@keyframes pulse {" +
      "0%, 100% { opacity: 1; }" +
      "50% { opacity: 0.6; }" +
      "}";

    const styleSheet = document.createElement("style");
    styleSheet.textContent = additionalStyles;
    document.head.appendChild(styleSheet);
  }

  // Console ASCII Art
  function showConsoleArt() {
    console.log(
      "%c\n" +
        "  ____                   _____           _ _    _ _   \n" +
        " / ___| _   _ _ __   ___ |_   _|__   ___ | | | _(_) |_ \n" +
        " \\___ \\| | | | '_ \\ / _ \\  | |/ _ \\ / _ \\| | |/ / | __|\n" +
        "  ___) | |_| | | | | (_) | | | (_) | (_) | |   <| | |_ \n" +
        " |____/ \\__,_|_| |_|\\___/  |_|\\___/ \\___/|_|_|\\_\\_|\\__|\n" +
        "                                                      \n" +
        "           [ CYBERPUNK TERMINAL INTERFACE v1.0 ]      \n",
      "color: #00ff00; font-family: monospace; font-size: 8px;",
    );

    console.log(
      "%c[SISTEM] Terminal arayuzu basariyla yuklendi",
      "color: #00ffff; font-family: monospace;",
    );
    console.log(
      "%c[OZELLIK] Tek sarki uretimi",
      "color: #00ff00; font-family: monospace;",
    );
    console.log(
      "%c[OZELLIK] Toplu sarki uretimi (CSV)",
      "color: #00ff00; font-family: monospace;",
    );
    console.log(
      "%c[OZELLIK] Sarki sozu uretimi",
      "color: #00ff00; font-family: monospace;",
    );
    console.log(
      "%c[OZELLIK] Sarki listesi goruntuleme",
      "color: #00ff00; font-family: monospace;",
    );
    console.log(
      "%c[OZELLIK] Gercek zamanli durum takibi",
      "color: #00ff00; font-family: monospace;",
    );
  }

  // Drag and Drop Setup
  function setupDragDrop() {
    const fileLabel = document.querySelector(".file-label");
    const fileInput = document.getElementById("csvFile");

    if (fileLabel && fileInput) {
      ["dragenter", "dragover", "dragleave", "drop"].forEach(
        function (eventName) {
          fileLabel.addEventListener(eventName, preventDefaults, false);
        },
      );

      function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
      }

      ["dragenter", "dragover"].forEach(function (eventName) {
        fileLabel.addEventListener(eventName, highlight, false);
      });

      ["dragleave", "drop"].forEach(function (eventName) {
        fileLabel.addEventListener(eventName, unhighlight, false);
      });

      function highlight(e) {
        fileLabel.style.filter = "brightness(1.2)";
        const dropAscii = fileLabel.querySelector(".drop-ascii");
        if (dropAscii) {
          dropAscii.style.borderColor = "var(--primary-green)";
          dropAscii.style.color = "var(--primary-green)";
          dropAscii.style.textShadow = "0 0 8px var(--primary-green)";
        }
      }

      function unhighlight(e) {
        fileLabel.style.filter = "brightness(1)";
        const dropAscii = fileLabel.querySelector(".drop-ascii");
        if (dropAscii) {
          dropAscii.style.borderColor = "var(--text-dim)";
          dropAscii.style.color = "var(--text-dim)";
          dropAscii.style.textShadow = "none";
        }
      }

      fileLabel.addEventListener("drop", handleDrop, false);

      function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;

        if (files.length > 0) {
          fileInput.files = files;
          fileInput.dispatchEvent(new Event("change"));
        }
      }
    }
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", function () {
    if (progressInterval) {
      clearInterval(progressInterval);
    }
  });
})();
