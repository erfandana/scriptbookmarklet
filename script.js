document.addEventListener("DOMContentLoaded", function () {
  lucide.createIcons();
  initTabInteractions();
  initScanButtons();
  initImageOcr(); // Inisialisasi Fitur OCR

  fetch("packaging.json")
    .then((response) => {
      if (!response.ok) throw new Error("Gagal mengambil data file json.");
      return response.json();
    })
    .then((data) => {
      initSizeDropdown(data);
    })
    .catch((error) => {
      console.error("Error muat file JSON:", error);
    });
});

function initSizeDropdown(data) {
  const sizeSelect = document.getElementById("size-select");
  const densityInput1 = document.getElementById("input-density-1");

  const inputs = {
    cap: document.getElementById("input-cap"),
    botol: document.getElementById("input-botol"),
    carton: document.getElementById("input-carton"),
    toleransi: document.getElementById("input-toleransi"),
    label: document.getElementById("input-label"),
    folding: document.getElementById("input-folding"),
    layer: document.getElementById("input-layer"),
    note: document.getElementById("input-note"),
  };

  const calcOutputs = {
    nettTarget: document.getElementById("nett-target"),
    nettMin: document.getElementById("nett-min"),
    nettMax: document.getElementById("nett-max"),
    grossTarget: document.getElementById("gross-target"),
    grossMin: document.getElementById("gross-min"),
    grossMax: document.getElementById("gross-max"),
    cartonTarget: document.getElementById("carton-target"),
    cartonMin: document.getElementById("carton-min"),
    cartonMax: document.getElementById("carton-max"),
    cartonToleransi: document.getElementById("carton-toleransi"),
  };

  if (sizeSelect) {
    sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
    data.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = item.size;
      sizeSelect.appendChild(option);
    });
  }

  function calculateWeights() {
    const selectedIndex = sizeSelect.value;
    const density = parseFloat(densityInput1.value) || 0;

    if (selectedIndex !== "" && density > 0) {
      const selectedData = data[selectedIndex];

      const volume = selectedData.volume || 0;
      const isi = selectedData.isi || 0;
      const botol = selectedData.botol || 0;
      const cap = selectedData.cap || 0;
      const label = selectedData.label || 0;
      const cartonPackaging = selectedData.carton || 0;
      const folding = selectedData.folding || 0;
      const layer = selectedData.layer || 0;
      const toleransi = selectedData.toleransi || 0;

      const nettTarget = volume * density;
      const nettMin = nettTarget - toleransi;
      const nettMax = nettTarget + toleransi;

      const grossTarget = nettTarget + botol + cap;
      const grossMin = nettMin + botol + cap;
      const grossMax = nettMax + botol + cap;

      const aksesorisKardus = layer + cartonPackaging;
      const aksesorisBotol = isi * (label + folding);

      const cartonTargetGram = grossTarget * isi + aksesorisKardus + aksesorisBotol;
      const cartonMaxGram = grossMax * isi + aksesorisKardus + aksesorisBotol;

      let cartonMinGram = 0;
      let cartonToleransiGram = 0;

      if (volume <= 250) {
        cartonMinGram = cartonTargetGram - nettTarget;
        cartonToleransiGram = nettTarget;
      } else if (volume >= 500) {
        cartonMinGram = grossMin * isi + aksesorisKardus + aksesorisBotol;
        cartonToleransiGram = cartonMaxGram - cartonTargetGram;
      }

      const cartonTargetKg = cartonTargetGram / 1000;
      const cartonMinKg = cartonMinGram / 1000;
      const cartonMaxKg = cartonMaxGram / 1000;
      const cartonToleransiKg = cartonToleransiGram / 1000;

      if (calcOutputs.nettTarget) calcOutputs.nettTarget.value = nettTarget.toFixed(2);
      if (calcOutputs.nettMin) calcOutputs.nettMin.value = nettMin.toFixed(2);
      if (calcOutputs.nettMax) calcOutputs.nettMax.value = nettMax.toFixed(2);

      if (calcOutputs.grossTarget) calcOutputs.grossTarget.value = grossTarget.toFixed(2);
      if (calcOutputs.grossMin) calcOutputs.grossMin.value = grossMin.toFixed(2);
      if (calcOutputs.grossMax) calcOutputs.grossMax.value = grossMax.toFixed(2);

      if (calcOutputs.cartonTarget) calcOutputs.cartonTarget.value = cartonTargetKg.toFixed(3);
      if (calcOutputs.cartonMin) calcOutputs.cartonMin.value = cartonMinKg.toFixed(3);
      if (calcOutputs.cartonMax) calcOutputs.cartonMax.value = cartonMaxKg.toFixed(3);
      if (calcOutputs.cartonToleransi) calcOutputs.cartonToleransi.value = cartonToleransiKg.toFixed(3);
    } else {
      Object.keys(calcOutputs).forEach((key) => {
        if (calcOutputs[key]) calcOutputs[key].value = "";
      });
    }
  }

  if (sizeSelect) {
    sizeSelect.addEventListener("change", function () {
      const selectedIndex = this.value;
      if (selectedIndex !== "") {
        const selectedData = data[selectedIndex];
        Object.keys(inputs).forEach((key) => {
          if (inputs[key] && key !== "note") {
            inputs[key].value = selectedData[key] !== undefined ? selectedData[key] : "";
          }
        });
        if (inputs.note) {
          inputs.note.value = selectedData._note !== undefined ? selectedData._note : "";
        }
      } else {
        Object.keys(inputs).forEach((key) => {
          if (inputs[key]) inputs[key].value = "";
        });
      }
      calculateWeights();
    });
  }

  if (densityInput1) {
    densityInput1.addEventListener("input", calculateWeights);
  }

  // Tambahan: Supaya saat input Botol, Cap, dll diubah manual, hasil perhitungan di bawah otomatis ikut berubah
  Object.keys(inputs).forEach((key) => {
    if (inputs[key] && key !== "note") {
      inputs[key].addEventListener("input", () => {
        // Update data sementara di memory agar fungsi kalkulasi mengambil angka baru yang diketik
        const selectedIndex = sizeSelect.value;
        if (selectedIndex !== "") {
          data[selectedIndex][key] = parseFloat(inputs[key].value) || 0;
          calculateWeights();
        }
      });
    }
  });
}

function initScanButtons() {
  const btnScanPo = document.getElementById("btn-scan-po");
  const btnScanBatch = document.getElementById("btn-scan-batch");
  const inputScanPo = document.getElementById("input-scan-po");
  const inputScanBatch = document.getElementById("input-scan-batch");
  const modal = document.getElementById("scanner-modal");
  const modalTitle = document.getElementById("scanner-title");
  const btnClose = document.getElementById("btn-close-scanner");

  let html5Qrcode = null;
  let targetInput = null;

  function openScanner(inputElement, titleText) {
    targetInput = inputElement;

    // Modifikasi judul modal untuk menyertakan opsi upload gambar sebagai fallback/alternatif
    if (modalTitle) {
      modalTitle.innerHTML = `
        <div class="flex flex-col gap-1 w-full">
          <div class="flex items-center gap-2 text-indigo-950">
            <i data-lucide="scan-line" class="text-indigo-600 w-5 h-5"></i> <span>${titleText}</span>
          </div>
          <label class="mt-2 text-xs text-indigo-600 underline cursor-pointer hover:text-indigo-800 block text-right font-normal">
            Atau klik disini untuk upload foto Barcode
            <input type="file" id="fallback-scan-file" accept="image/*" class="hidden" />
          </label>
        </div>
      `;
    }
    lucide.createIcons();

    if (modal) {
      modal.classList.remove("hidden");
      setTimeout(() => {
        modal.classList.remove("opacity-0");
      }, 50);
    }

    const readerElem = document.getElementById("scanner-reader");
    if (readerElem) readerElem.innerHTML = "";

    html5Qrcode = new Html5Qrcode("scanner-reader");

    // Pasang event listener untuk fallback upload file gambar di dalam modal
    setTimeout(() => {
      const fallbackInput = document.getElementById("fallback-scan-file");
      if (fallbackInput) {
        fallbackInput.addEventListener("change", function (e) {
          const file = e.target.files[0];
          if (!file) return;

          html5Qrcode
            .scanFile(file, true)
            .then((decodedText) => {
              onScanSuccess(decodedText);
            })
            .catch((err) => {
              alert("Sistem gagal membaca barcode dari gambar ini. Pastikan gambar barcode jelas.");
              console.error(err);
            });
        });
      }
    }, 100);

    // Jalankan Kamera bawaan
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices.length) {
          throw new Error("Kamera hardware tidak terdeteksi.");
        }
        const camera = devices.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear")) || devices[0];
        return html5Qrcode.start(camera.id, { fps: 10, qrbox: { width: 280, height: 160 } }, onScanSuccess, onScanFailure);
      })
      .then(() => {
        setTimeout(() => {
          const video = document.querySelector("#scanner-reader video");
          if (video) {
            video.style.width = "100%";
            video.style.height = "auto";
            video.style.display = "block";
            video.style.objectFit = "cover";
          }
        }, 100);
      })
      .catch((err) => {
        console.error("Gagal inisialisasi kamera live:", err);

        // Tampilkan pesan panduan alternatif di dalam box scanner (bukan alert pop-up yang mengganggu)
        if (readerElem) {
          readerElem.innerHTML = `
            <div class="p-6 text-center text-sm text-slate-600 bg-red-50 rounded-xl border border-red-100">
              <p class="font-bold text-red-700 mb-1">Akses Kamera Diblokir Browser</p>
              <p class="text-xs mb-3 text-slate-500">Sistem keamanan situs web ini membatasi fungsi kamera via bookmarklet.</p>
              <p class="font-semibold text-indigo-700">Silakan gunakan menu "Upload foto Barcode" di bagian atas modal ini.</p>
            </div>
          `;
        }
      });
  }

  function closeScanner() {
    if (html5Qrcode && html5Qrcode.isScanning) {
      html5Qrcode
        .stop()
        .then(() => {
          hideModalElements();
        })
        .catch(() => {
          hideModalElements();
        });
    } else {
      hideModalElements();
    }
  }

  function hideModalElements() {
    if (modal) {
      modal.classList.add("opacity-0");
      setTimeout(() => {
        modal.classList.add("hidden");
        const readerElem = document.getElementById("scanner-reader");
        if (readerElem) readerElem.innerHTML = "";
      }, 300);
    }
  }

  function onScanSuccess(decodedText) {
    if (targetInput) {
      targetInput.value = decodedText;
      targetInput.classList.add("bg-green-50", "border-green-400");
      setTimeout(() => {
        targetInput.classList.remove("bg-green-50", "border-green-400");
      }, 1000);
    }
    closeScanner();
  }

  function onScanFailure(error) {
    // Diabaikan agar log tidak penuh saat proses pencarian frame barcode berjalan live
  }

  if (btnScanPo) btnScanPo.addEventListener("click", () => openScanner(inputScanPo, "Scan Barcode Nomer PO"));
  if (btnScanBatch) btnScanBatch.addEventListener("click", () => openScanner(inputScanBatch, "Scan Barcode Nomer Batch"));
  if (btnClose) btnClose.addEventListener("click", closeScanner);
}

function initTabInteractions() {
  const tabs = document.querySelectorAll(".tab-btn");
  const formUtama = document.getElementById("form-qc-utama");
  const formMakanan = document.getElementById("form-qc-makanan");
  const formMinuman = document.getElementById("form-qc-minuman");
  const actionButtons = document.getElementById("action-buttons-container");

  const containerBotolCap = document.getElementById("container-botol-cap");
  const containerBeratGross = document.getElementById("container-berat-gross");
  const containerNitrogen = document.getElementById("container-nitrogen");

  // Render otomatis Input 1 sampai 10
  if (containerBotolCap && containerBeratGross && containerNitrogen) {
    let htmlBotolCap = "";
    let htmlBeratGross = "";
    let htmlNitrogen = "";

    for (let i = 1; i <= 10; i++) {
      htmlBotolCap += `
        <div class="flex flex-col gap-1 w-full">
          <label class="text-sm font-bold text-indigo-700 underline">${i}</label>
          <input type="number" step="0.01" id="makanan-bc-${i}" placeholder="0.00" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-300 transition shadow-sm bg-white" />
        </div>
      `;
      htmlBeratGross += `
        <div class="flex flex-col gap-1 w-full">
          <label class="text-sm font-bold text-indigo-700 underline">${i}</label>
          <input type="number" step="0.01" id="makanan-bg-${i}" placeholder="0.00" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-300 transition shadow-sm bg-white" />
        </div>
      `;
      htmlNitrogen += `
        <div class="flex flex-col gap-1 w-full">
          <label class="text-sm font-bold text-indigo-700 underline">${i}</label>
          <input type="number" step="0.01" id="minuman-nitro-${i}" placeholder="0.00" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-300 transition shadow-sm bg-white" />
        </div>
      `;
    }
    containerBotolCap.innerHTML = htmlBotolCap;
    containerBeratGross.innerHTML = htmlBeratGross;
    containerNitrogen.innerHTML = htmlNitrogen;
  }

  // --- LOGIKA UTAMA: CLEAR TOTAL SEMUA HALAMAN & TAB ---
  if (actionButtons) {
    const btnClear = actionButtons.querySelector('button[type="button"]');
    if (btnClear) {
      btnClear.addEventListener("click", function () {
        // 1. RESET TAB UTAMA (Kalibrasi)
        if (formUtama) {
          formUtama.reset();

          // Kosongkan manual elemen input berstatus readonly hasil kalkulasi
          const readonlyInputs = formUtama.querySelectorAll("input[readonly]");
          readonlyInputs.forEach((input) => (input.value = ""));
        }

        // 2. RESET TAB MAKANAN (Berat)
        for (let i = 1; i <= 10; i++) {
          const bcInput = document.getElementById(`makanan-bc-${i}`);
          const bgInput = document.getElementById(`makanan-bg-${i}`);
          if (bcInput) bcInput.value = "";
          if (bgInput) bgInput.value = "";
        }

        const fileBC = document.getElementById("import-botol-cap");
        const fileBG = document.getElementById("import-berat-gross");
        if (fileBC) fileBC.value = "";
        if (fileBG) fileBG.value = "";

        const labelBC = document.getElementById("file-name-label");
        const labelBG = document.getElementById("file-name-gross-label");
        if (labelBC) {
          labelBC.textContent = "Belum ada file terpilih";
          labelBC.className = "text-sm text-slate-400 italic font-medium truncate max-w-xs";
        }
        if (labelBG) {
          labelBG.textContent = "Belum ada file terpilih";
          labelBG.className = "text-sm text-slate-400 italic font-medium truncate max-w-xs";
        }

        // 3. RESET TAB MINUMAN (Nitrogen)
        for (let i = 1; i <= 10; i++) {
          const nitroInput = document.getElementById(`minuman-nitro-${i}`);
          if (nitroInput) nitroInput.value = "";
        }

        const fileNitro = document.getElementById("import-nitrogen");
        if (fileNitro) fileNitro.value = "";

        const labelNitro = document.getElementById("file-name-nitrogen-label");
        if (labelNitro) {
          labelNitro.textContent = "Belum ada file terpilih";
          labelNitro.className = "text-sm text-slate-400 italic font-medium truncate max-w-xs";
        }
      });
    }
  }

  // --- FILTER DAN INTERAKSI KLIK TAB ---
  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Reset semua tab ke kondisi tidak aktif (menggunakan border transparan)
      tabs.forEach((item) => {
        item.className = "tab-btn text-slate-400 border-b-2 border-transparent hover:text-indigo-800 pb-2 px-1 cursor-pointer whitespace-nowrap";
      });

      // Set tab yang diklik menjadi aktif (menggunakan border indigo)
      this.className = "tab-btn text-indigo-800 border-b-2 border-indigo-800 pb-2 px-1 font-semibold cursor-pointer whitespace-nowrap";

      if (formUtama) {
        formUtama.classList.add("hidden");
        formUtama.classList.remove("block");
      }
      if (formMakanan) {
        formMakanan.classList.add("hidden");
        formMakanan.classList.remove("block");
      }
      if (formMinuman) {
        formMinuman.classList.add("hidden");
        formMinuman.classList.remove("block");
      }

      const tabId = this.id;
      if (tabId === "tab-kalibrasi" && formUtama) {
        formUtama.classList.remove("hidden");
        formUtama.classList.add("block");
        if (actionButtons) actionButtons.classList.add("hidden");
      } else if (tabId === "tab-berat" && formMakanan) {
        formMakanan.classList.remove("hidden");
        formMakanan.classList.add("block");
        if (actionButtons) actionButtons.classList.add("hidden");
      } else if (tabId === "tab-nitrogen" && formMinuman) {
        formMinuman.classList.remove("hidden");
        formMinuman.classList.add("block");
        if (actionButtons) actionButtons.classList.remove("hidden");
      } else {
        if (actionButtons) actionButtons.classList.add("hidden");
      }
    });
  });
}

function initImageOcr() {
  // --- 1. OCR BERAT BOTOL & CAP (Tab Berat) ---
  const fileInputBC = document.getElementById("import-botol-cap");
  const fileNameLabelBC = document.getElementById("file-name-label");

  if (fileInputBC && fileNameLabelBC) {
    fileInputBC.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      fileNameLabelBC.textContent = file.name;
      fileNameLabelBC.className = "text-sm text-indigo-600 font-semibold truncate max-w-xs";

      for (let i = 1; i <= 10; i++) {
        const inputField = document.getElementById(`makanan-bc-${i}`);
        if (inputField) inputField.value = "";
      }
      prosesOcrGambar(file, "makanan-bc-");
    });
  }

  // --- 2. OCR BERAT GROSS (Tab Berat) ---
  const fileInputBG = document.getElementById("import-berat-gross");
  const fileNameLabelBG = document.getElementById("file-name-gross-label");

  if (fileInputBG && fileNameLabelBG) {
    fileInputBG.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      fileNameLabelBG.textContent = file.name;
      fileNameLabelBG.className = "text-sm text-indigo-600 font-semibold truncate max-w-xs";

      for (let i = 1; i <= 10; i++) {
        const inputField = document.getElementById(`makanan-bg-${i}`);
        if (inputField) inputField.value = "";
      }
      prosesOcrGambar(file, "makanan-bg-");
    });
  }

  // --- 3. OCR PENGECEKAN NITROGEN (Tab Nitrogen) ---
  const fileInputNitro = document.getElementById("import-nitrogen");
  const fileNameLabelNitro = document.getElementById("file-name-nitrogen-label");

  if (fileInputNitro && fileNameLabelNitro) {
    fileInputNitro.addEventListener("change", function (e) {
      const file = e.target.files[0];
      if (!file) return;
      fileNameLabelNitro.textContent = file.name;
      fileNameLabelNitro.className = "text-sm text-indigo-600 font-semibold truncate max-w-xs";

      for (let i = 1; i <= 10; i++) {
        const inputField = document.getElementById(`minuman-nitro-${i}`);
        if (inputField) inputField.value = "";
      }
      prosesOcrGambar(file, "minuman-nitro-");
    });
  }
}

function prosesOcrGambar(file, prefixIdTarget) {
  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width * 2;
      canvas.height = img.height * 2;
      const ctx = canvas.getContext("2d");
      ctx.filter = "contrast(200%)";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      Tesseract.recognize(canvas, "eng", {
        tessedit_char_whitelist: "0123456789.kg ",
      }).then(({ data: { text } }) => {
        const lines = text.split("\n").filter((l) => l.trim().length > 0);

        lines.forEach((line, index) => {
          if (index < 10) {
            let cleanLine = line.toLowerCase().replace(/\s+/g, "");
            let num = parseFloat(cleanLine);

            if (!isNaN(num)) {
              if (cleanLine.includes("kg")) {
                num = num * 1000;
              }
              const currentInput = document.getElementById(`${prefixIdTarget}${index + 1}`);
              if (currentInput) {
                currentInput.value = num;
              }
            }
          }
        });
      });
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}
