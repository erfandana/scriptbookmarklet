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
  sizeSelect.innerHTML = '<option value="">SELECT SIZE</option>';
  data.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = item.size;
    sizeSelect.appendChild(option);
  });

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
      calcOutputs.nettTarget.value = nettTarget.toFixed(2);
      calcOutputs.nettMin.value = nettMin.toFixed(2);
      calcOutputs.nettMax.value = nettMax.toFixed(2);

      calcOutputs.grossTarget.value = grossTarget.toFixed(2);
      calcOutputs.grossMin.value = grossMin.toFixed(2);
      calcOutputs.grossMax.value = grossMax.toFixed(2);

      calcOutputs.cartonTarget.value = cartonTargetKg.toFixed(3);
      calcOutputs.cartonMin.value = cartonMinKg.toFixed(3);
      calcOutputs.cartonMax.value = cartonMaxKg.toFixed(3);
      calcOutputs.cartonToleransi.value = cartonToleransiKg.toFixed(3);
    } else {
      // Reset bersihkan form output jika data inputan belum lengkap
      Object.keys(calcOutputs).forEach((key) => {
        if (calcOutputs[key]) calcOutputs[key].value = "";
      });
    }
  }

  // Event pemicu ketika pilihan jenis/ukuran produk diganti
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
      inputs.note.value = selectedData._note !== undefined ? selectedData._note : "";
    } else {
      // Kosongkan seluruh form jika select kembali ke default "SELECT SIZE"
      Object.keys(inputs).forEach((key) => {
        if (inputs[key]) inputs[key].value = "";
      });
    }
    calculateWeights();
  });

  // Jalankan perhitungan ulang secara real-time saat angka density diketik manual
  densityInput1.addEventListener("input", calculateWeights);
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

  modalTitle.innerHTML =
    `<i data-lucide="scan-line" class="text-indigo-600 w-5 h-5"></i> ${titleText}`;

  lucide.createIcons();

  modal.classList.remove("hidden");

  setTimeout(() => {
    modal.classList.remove("opacity-0");
  }, 50);

  document.getElementById("scanner-reader").innerHTML = "";

  html5Qrcode = new Html5Qrcode("scanner-reader");

  Html5Qrcode.getCameras()
    .then((devices) => {

      if (!devices.length) {
        alert("Kamera tidak ditemukan");
        return;
      }

      const camera =
        devices.find(d =>
          d.label.toLowerCase().includes("back") ||
          d.label.toLowerCase().includes("rear")
        ) || devices[0];

      return html5Qrcode.start(
        camera.id,
        {
          fps: 10,
          qrbox: {
            width: 280,
            height: 160
          }
        },
        onScanSuccess,
        onScanFailure
      );

    })
    .then(() => {

      setTimeout(() => {

        const video =
          document.querySelector("#scanner-reader video");

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
      // Jika stream video kamera sedang menyala aktif, matikan terlebih dahulu
      if (html5Qrcode.isScanning) {
        html5Qrcode
          .stop()
          .then(() => {
            hideModalElements();
          })
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
    modal.classList.add("opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
      document.getElementById("scanner-reader").innerHTML = ""; // Bersihkan sisa elemen kamera
    }, 300);
  }

  function onScanSuccess(decodedText, decodedResult) {
    if (targetInput) {
      targetInput.value = decodedText; // Masukkan teks hasil deteksi ke form text

      // Beri indikasi visual kedipan hijau pertanda data berhasil masuk
      targetInput.classList.add("bg-green-50", "border-green-400");
      setTimeout(() => {
        targetInput.classList.remove("bg-green-50", "border-green-400");
      }, 1000);
    }
    closeScanner(); // Otomatis tutup kamera setelah sukses mendeteksi 1 barcode
  }

  function onScanFailure(error) {
    // Diabaikan karena scanning mencari frame kode berulang kali setiap milidetik secara konstan
  }

  // Pasang event klik pada tombol pemicu scan
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
// INTERAKSI DESAIN TABS
// ========================================================
// ========================================================
// INTERAKSI DESAIN TABS & PERGANTIAN FORM
// ========================================================
function initTabInteractions() {
  const tabs = document.querySelectorAll(".tab-btn");
  const formUtama = document.getElementById("form-qc-utama");
  const formMakanan = document.getElementById("form-qc-makanan");

  tabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // 1. Bersihkan semua style aktif dari semua tab
      tabs.forEach((item) => {
        item.classList.remove("text-indigo-800", "border-b-2", "border-indigo-800", "font-semibold", "-mb-[10px]", "px-1");
        item.classList.add("text-slate-400");
      });

      // 2. Set style aktif pada tab yang sedang diklik
      this.classList.remove("text-slate-400");
      this.classList.add("text-indigo-800", "border-b-2", "border-indigo-800", "font-semibold", "-mb-[10px]", "px-1");

      // 3. LOGIKA PERGANTIAN HALAMAN/FORM
      const tabId = this.id;

      if (tabId === "tab-makanan") {
        // Jika klik tab Makanan -> Sembunyikan utama, munculkan makanan
        if (formUtama) formUtama.classList.add("hidden");
        if (formMakanan) formMakanan.classList.remove("hidden");
      } else if (tabId === "tab-semua") {
        // Jika klik tab Semua -> Munculkan utama, sembunyikan makanan
        if (formUtama) formUtama.classList.remove("hidden");
        if (formMakanan) formMakanan.classList.add("hidden");
      } else {
        // Untuk tab Minuman dan Snack (jika formnya belum dibuat, sembunyikan semua dulu)
        if (formUtama) formUtama.classList.add("hidden");
        if (formMakanan) formMakanan.classList.add("hidden");
      }
    });
  });
}
