document.addEventListener("DOMContentLoaded", function () {
  // Inisialisasi ikon Lucide dan interaksi tombol di awal load page
  lucide.createIcons();
  initTabInteractions();
  initScanButtons();

  // Mengambil database spesifikasi material produk
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

  // Pemetaan elemen form input spesifikasi material
  const inputs = {
    cap: document.getElementById("input-cap"),
    botol: document.getElementById("input-botol"),
    carton: document.getElementById("input-carton"),
    toleransi: document.getElementById("input-toleransi"),
    label: document.getElementById("input-label"),
    folding: document.getElementById("input-folding"),
    layer: document.getElementById("input-layer"),
    note: document.getElementById("input-note"), // Menunjuk ke elemen HTML input note
  };

  // Pemetaan elemen form output hasil perhitungan matematis
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

  // Memasukkan daftar ukuran produk ke dalam elemen select dropdown
  if (sizeSelect) {
    sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
    data.forEach((item, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = item.size;
      sizeSelect.appendChild(option);
    });
  }

  // ========================================================
  // LOGIKA UTAMA PERHITUNGAN MATEMATIKA QC
  // ========================================================
  function calculateWeights() {
    const selectedIndex = sizeSelect.value;
    const density = parseFloat(densityInput1.value) || 0;

    if (selectedIndex !== "" && density > 0) {
      const selectedData = data[selectedIndex];

      // Ambil nilai dasar spesifikasi (satuan gram dan ml) dari JSON
      const volume = selectedData.volume || 0;
      const isi = selectedData.isi || 0;
      const botol = selectedData.botol || 0;
      const cap = selectedData.cap || 0;
      const label = selectedData.label || 0;
      const cartonPackaging = selectedData.carton || 0;
      const folding = selectedData.folding || 0;
      const layer = selectedData.layer || 0;
      const toleransi = selectedData.toleransi || 0;

      // ----------------------------------------------------
      // 1. HITUNG BERAT NETT PCS (GRAM)
      // ----------------------------------------------------
      const nettTarget = volume * density;
      const nettMin = nettTarget - toleransi;
      const nettMax = nettTarget + toleransi;

      // ----------------------------------------------------
      // 2. HITUNG BERAT GROSS PCS (GRAM)
      // ----------------------------------------------------
      const grossTarget = nettTarget + botol + cap;
      const grossMin = nettMin + botol + cap;
      const grossMax = nettMax + botol + cap;

      // ----------------------------------------------------
      // 3. HITUNG BERAT GROSS CARTON (GRAM) & KONDISI TOLERANSI
      // ----------------------------------------------------
      const aksesorisKardus = layer + cartonPackaging;
      const aksesorisBotol = isi * (label + folding);

      // Rumus target kotor karton dan batas maksimum karton (dalam gram)
      const cartonTargetGram = grossTarget * isi + aksesorisKardus + aksesorisBotol;
      const cartonMaxGram = grossMax * isi + aksesorisKardus + aksesorisBotol;

      let cartonMinGram = 0;
      let cartonToleransiGram = 0;

      // Aturan kondisional pembagian volume sesuai standar QC Anda
      if (volume <= 250) {
        // KONDISI JIKA 250ML KEBAWAH (TERMASUK 250ML)
        cartonMinGram = cartonTargetGram - nettTarget;
        cartonToleransiGram = nettTarget; // Toleransi sebesar target nett per pcs
      } else if (volume >= 500) {
        // KONDISI JIKA 500ML SAMPAI 5 LITER
        cartonMinGram = grossMin * isi + aksesorisKardus + aksesorisBotol;
        cartonToleransiGram = cartonMaxGram - cartonTargetGram; // Selisih max dengan target
      }

      // ----------------------------------------------------
      // 4. KONVERSI OUTPUT HASIL KE KILOGRAM (KG) / DIBAGI 1000
      // ----------------------------------------------------
      const cartonTargetKg = cartonTargetGram / 1000;
      const cartonMinKg = cartonMinGram / 1000;
      const cartonMaxKg = cartonMaxGram / 1000;
      const cartonToleransiKg = cartonToleransiGram / 1000;

      // Tempelkan hasil akhir ke masing-masing kolom teks form UI
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
      // Reset bersihkan form output jika data inputan belum lengkap
      Object.keys(calcOutputs).forEach((key) => {
        if (calcOutputs[key]) calcOutputs[key].value = "";
      });
    }
  }

  // Event pemicu ketika pilihan jenis/ukuran produk diganti
  if (sizeSelect) {
    sizeSelect.addEventListener("change", function () {
      const selectedIndex = this.value;

      if (selectedIndex !== "") {
        const selectedData = data[selectedIndex];

        // Auto-fill field data numerik standar
        Object.keys(inputs).forEach((key) => {
          if (inputs[key] && key !== "note") {
            inputs[key].value = selectedData[key] !== undefined ? selectedData[key] : "";
          }
        });

        // Ambil teks string secara manual dari key '_note' di JSON Anda
        if (inputs.note) {
          inputs.note.value = selectedData._note !== undefined ? selectedData._note : "";
        }
      } else {
        // Kosongkan seluruh form jika select kembali ke default "SELECT SIZE"
        Object.keys(inputs).forEach((key) => {
          if (inputs[key]) inputs[key].value = "";
        });
      }
      calculateWeights();
    });
  }

  // Jalankan perhitungan ulang secara real-time saat angka density diketik manual
  if (densityInput1) {
    densityInput1.addEventListener("input", calculateWeights);
  }
}

// ========================================================
// LOGIKA BUKA KAMERA SCANNER BARCODE (CLEAN TANPA IMPORT)
// ========================================================
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
    if (modalTitle) {
      modalTitle.innerHTML = `<i data-lucide="scan-line" class="text-indigo-600 w-5 h-5"></i> ${titleText}`;
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

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices.length) {
          alert("Kamera tidak ditemukan");
          return;
        }

        const camera = devices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear")
        ) || devices[0];

        return html5Qrcode.start(
          camera.id,
          {
            fps: 10,
            qrbox: { width: 280, height: 160 }
          },
          onScanSuccess,
          onScanFailure
        );
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
        }, 1000);
      })
      .catch((err) => {
        console.error(err);
        alert("Kamera gagal diakses: " + err);
        closeScanner();
      });
  }

  function closeScanner() {
    if (html5Qrcode) {
      if (html5Qrcode.isScanning) {
        html5Qrcode.stop()
          .then(() => { hideModalElements(); })
          .catch((err) => {
            console.error("Gagal mematikan stream video kamera:", err);
            hideModalElements();
          });
      } else {
        hideModalElements();
      }
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

  function onScanSuccess(decodedText, decodedResult) {
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
    // Diabaikan karena scanning berulang terus-menerus
  }

  if (btnScanPo) {
    btnScanPo.addEventListener("click", () => openScanner(inputScanPo, "Scan Barcode Nomer PO"));
  }
  if (btnScanBatch) {
    btnScanBatch.addEventListener("click", () => openScanner(inputScanBatch, "Scan Barcode Nomer Batch"));
  }
  if (btnClose) {
    btnClose.addEventListener("click", closeScanner);
  }
}

// ========================================================
// INTERAKSI DESAIN TABS & PERGANTIAN FORM MULTI-TAB
// ========================================================
function initTabInteractions() {
  const tabs = document.querySelectorAll(".tab-btn");
  
  const formUtama = document.getElementById("form-qc-utama");
  const formMakanan = document.getElementById("form-qc-makanan");
  const formMinuman = document.getElementById("form-qc-minuman");
  const actionButtons = document.getElementById("action-buttons-container");

  // Render input grid dinamis Makanan di dalam JS agar rapi
  const containerBotolCap = document.getElementById("container-botol-cap");
  const containerBeratGross = document.getElementById("container-berat-gross");
  
  if (containerBotolCap || containerBeratGross) {
    let htmlInputs = "";
    for (let i = 1; i <= 10; i++) {
      htmlInputs += `
        <div class="flex flex-col gap-1">
          <label class="text-sm font-bold text-indigo-700 underline">${i}</label>
          <input type="number" step="0.01" placeholder="Input Density" class="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 placeholder:text-slate-300 transition shadow-sm" />
        </div>
      `;
    }
    if (containerBotolCap) containerBotolCap.innerHTML = htmlInputs;
    if (containerBeratGross) containerBeratGross.innerHTML = htmlInputs;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // 1. Reset visual state seluruh tab
      tabs.forEach((item) => {
        item.className = "tab-btn hover:text-indigo-800 pb-2 text-slate-400 cursor-pointer";
      });

      // 2. Set active state untuk tab yang diklik (menggunakan sintaks bersih kelas string biasa)
      this.className = "tab-btn text-indigo-800 border-b-2 border-indigo-800 pb-2 -mb-[10px] px-1 font-semibold cursor-pointer";

      // 3. Sembunyikan semua kontainer form terlebih dahulu
      if (formUtama) formUtama.classList.add("hidden");
      if (formMakanan) formMakanan.classList.add("hidden");
      if (formMinuman) formMinuman.classList.add("hidden");

      // 4. Tampilkan form spesifik yang dipilih berdasarkan ID Tab
      const tabId = this.id;
      if (tabId === "tab-semua") {
        if (formUtama) formUtama.classList.remove("hidden");
        if (actionButtons) actionButtons.classList.remove("hidden");
      } else if (tabId === "tab-makanan") {
        if (formMakanan) formMakanan.classList.remove("hidden");
        if (actionButtons) actionButtons.classList.remove("hidden");
      } else if (tabId === "tab-minuman") {
        if (formMinuman) formMinuman.classList.remove("hidden");
        if (actionButtons) actionButtons.classList.remove("hidden");
      } else if (tabId === "tab-snack") {
        if (actionButtons) actionButtons.classList.add("hidden"); // Sembunyikan tombol jika halaman snack masih kosong
      }
    });
  });
}
