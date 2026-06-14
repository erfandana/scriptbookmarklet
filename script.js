(function () {
  // 1. LINK RAW JSON KAMU (Sesuaikan jika nama reponya berbeda)
  const JSON_URL = "https://raw.githubusercontent.com/erfandana/scriptbookmarklet/refs/heads/main/packaging.json?t=" + Date.now();

  fetch(JSON_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Gagal mengambil data JSON dari GitHub.");
      return response.json();
    })
    .then((data) => {
      eksekusiAutofill(data);
    })
    .catch((error) => {
      console.error("Error:", error);
      alert("Gagal memuat database QC dari GitHub: " + error.message);
    });

  function eksekusiAutofill(database) {
    // =========================================================================
    // ⚠️ PENTING: GANTI ID DI BAWAH INI DENGAN ID ASLI YANG ADA DI WEB TARGET!
    // =========================================================================
    const webSelectSize   = document.getElementById("ISI_DENGAN_ID_SELECT_SIZE_DI_WEB_TARGET");
    const webInputDensity = document.getElementById("ISI_DENGAN_ID_INPUT_DENSITY_DI_WEB_TARGET");
    
    // Pemetaan elemen output/hasil hitung di halaman web target
    const webOutputs = {
      nettTarget:      document.getElementById("ISI_ID_NET_TARGET_DI_WEB"),
      nettMin:         document.getElementById("ISI_ID_NET_MIN_DI_WEB"),
      nettMax:         document.getElementById("ISI_ID_NET_MAX_DI_WEB"),
      grossTarget:     document.getElementById("ISI_ID_GROSS_TARGET_DI_WEB"),
      grossMin:        document.getElementById("ISI_ID_GROSS_MIN_DI_WEB"),
      grossMax:        document.getElementById("ISI_ID_GROSS_MAX_DI_WEB"),
      cartonTarget:    document.getElementById("ISI_ID_CARTON_TARGET_DI_WEB"),
      cartonMin:       document.getElementById("ISI_ID_CARTON_MIN_DI_WEB"),
      cartonMax:       document.getElementById("ISI_ID_CARTON_MAX_DI_WEB"),
      cartonToleransi: document.getElementById("ISI_ID_CARTON_TOLERANSI_DI_WEB"),
    };

    // Validasi apakah bookmarklet dijalankan di halaman yang benar
    if (!webSelectSize || !webInputDensity) {
      alert("Tombol autofill aktif, tetapi input Size atau Density tidak ditemukan di halaman ini. Periksa kembali ID elemennya!");
      return;
    }

    // Fungsi Kalkulasi QC
    function hitungOtomatis() {
      const selectedSizeText = webSelectSize.value; // Mengambil text ukuran (misal: "100 X 20ML")
      const selectedData = database.find(item => item.size === selectedSizeText);
      const density = parseFloat(webInputDensity.value) || 0;

      if (selectedData && density > 0) {
        // Ambil nilai spesifikasi dasar dari JSON
        const volume = selectedData.volume || 0;
        const isi = selectedData.isi || 0;
        const botol = selectedData.botol || 0;
        const cap = selectedData.cap || 0;
        const label = selectedData.label || 0;
        const cartonPackaging = selectedData.carton || 0;
        const folding = selectedData.folding || 0;
        const layer = selectedData.layer || 0;
        const toleransi = selectedData.toleransi || 0;

        // 1. Hitung Nett Pcs
        const nettTarget = volume * density;
        const nettMin = nettTarget - toleransi;
        const nettMax = nettTarget + toleransi;

        // 2. Hitung Gross Pcs
        const grossTarget = nettTarget + botol + cap;
        const grossMin = nettMin + botol + cap;
        const grossMax = nettMax + botol + cap;

        // 3. Hitung Gross Carton (Gram)
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

        // 4. Konversi ke Kilogram (Kg)
        const cartonTargetKg = cartonTargetGram / 1000;
        const cartonMinKg = cartonMinGram / 1000;
        const cartonMaxKg = cartonMaxGram / 1000;
        const cartonToleransiKg = cartonToleransiGram / 1000;

        // Tembakkan langsung ke form input web target
        if(webOutputs.nettTarget) webOutputs.nettTarget.value = nettTarget.toFixed(2);
        if(webOutputs.nettMin) webOutputs.nettMin.value = nettMin.toFixed(2);
        if(webOutputs.nettMax) webOutputs.nettMax.value = nettMax.toFixed(2);

        if(webOutputs.grossTarget) webOutputs.grossTarget.value = grossTarget.toFixed(2);
        if(webOutputs.grossMin) webOutputs.grossMin.value = grossMin.toFixed(2);
        if(webOutputs.grossMax) webOutputs.grossMax.value = grossMax.toFixed(2);

        if(webOutputs.cartonTarget) webOutputs.cartonTarget.value = cartonTargetKg.toFixed(3);
        if(webOutputs.cartonMin) webOutputs.cartonMin.value = cartonMinKg.toFixed(3);
        if(webOutputs.cartonMax) webOutputs.cartonMax.value = cartonMaxKg.toFixed(3);
        if(webOutputs.cartonToleransi) webOutputs.cartonToleransi.value = cartonToleransiKg.toFixed(3);
        
        // Opsional: Trigger event agar sistem web target tahu ada perubahan data (berguna jika web target pakai React/Vue)
        Object.values(webOutputs).forEach(el => {
          if(el) el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    }

    // Daftarkan event listener di web target supaya begitu user input Density / ganti Size, angka langsung re-calculate otomatis
    webSelectSize.addEventListener("change", hitungOtomatis);
    webInputDensity.addEventListener("input", hitungOtomatis);
    
    // Jalankan kalkulasi pertama kali saat bookmarklet di-klik
    hitungOtomatis();
    alert("Kalkulator QC Inline Berhasil Disuntikkan!");
  }
})();
