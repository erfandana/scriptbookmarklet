(function () {
  // 1. Ambil database packaging langsung dari Raw GitHub kamu
  const JSON_URL = "https://raw.githubusercontent.com/username-kamu/repo-baru-kamu/main/packaging.json";

  fetch(JSON_URL)
    .then((response) => {
      if (!response.ok) throw new Error("Gagal mengambil data JSON.");
      return response.json();
    })
    .then((data) => {
      runAutofillLogic(data);
    })
    .catch((error) => {
      console.error("Error Bookmarklet:", error);
      alert("Gagal memuat database material dari GitHub.");
    });

  function runAutofillLogic(data) {
    // =========================================================================
    // PENTING: Ganti string ID di bawah ini dengan ID ASLI yang ada di web target!
    // =========================================================================
    const webSelectSize   = document.getElementById("id_select_size_di_web_target");
    const webInputDensity = document.getElementById("id_input_density_di_web_target");
    
    // Pemetaan elemen output pada web target
    const webOutputs = {
      nettTarget:      document.getElementById("id_nett_target_di_web"),
      nettMin:         document.getElementById("id_nett_min_di_web"),
      nettMax:         document.getElementById("id_nett_max_di_web"),
      grossTarget:     document.getElementById("id_gross_target_di_web"),
      grossMin:        document.getElementById("id_gross_min_di_web"),
      grossMax:        document.getElementById("id_gross_max_di_web"),
      cartonTarget:    document.getElementById("id_carton_target_di_web"),
      cartonMin:       document.getElementById("id_carton_min_di_web"),
      cartonMax:       document.getElementById("id_carton_max_di_web"),
      cartonToleransi: document.getElementById("id_carton_toleransi_di_web"),
    };

    if (!webSelectSize || !webInputDensity) {
      alert("Bookmarklet tidak mendeteksi form input yang sesuai di halaman ini!");
      return;
    }

    // Fungsi hitung kalkulasi matematis (diadopsi dari logika QC kamu)
    function calculate() {
      // Mengasumsikan value dari select di web target berupa text ukuran (misal: "100 X 20ML")
      const selectedSizeText = webSelectSize.value; 
      const selectedData = data.find(item => item.size === selectedSizeText);
      const density = parseFloat(webInputDensity.value) || 0;

      if (selectedData && density > 0) {
        const volume = selectedData.volume || 0;
        const isi = selectedData.isi || 0;
        const botol = selectedData.botol || 0;
        const cap = selectedData.cap || 0;
        const label = selectedData.label || 0;
        const cartonPackaging = selectedData.carton || 0;
        const folding = selectedData.folding || 0;
        const layer = selectedData.layer || 0;
        const toleransi = selectedData.toleransi || 0;

        // 1. HITUNG BERAT NETT PCS
        const nettTarget = volume * density;
        const nettMin = nettTarget - toleransi;
        const nettMax = nettTarget + toleransi;

        // 2. HITUNG BERAT GROSS PCS
        const grossTarget = nettTarget + botol + cap;
        const grossMin = nettMin + botol + cap;
        const grossMax = nettMax + botol + cap;

        // 3. HITUNG BERAT GROSS CARTON
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

        // 4. KONVERSI KE KG
        const cartonTargetKg = cartonTargetGram / 1000;
        const cartonMinKg = cartonMinGram / 1000;
        const cartonMaxKg = cartonMaxGram / 1000;
        const cartonToleransiKg = cartonToleransiGram / 1000;

        // Masukkan nilai hasil hitungan ke input field web target
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
        
        // Trigger event 'input' atau 'change' manual jika web target menggunakan framework (React/Vue)
        Object.values(webOutputs).forEach(el => {
          if(el) el.dispatchEvent(new Event('input', { bubbles: true }));
        });
      }
    }

    // Pasang listener agar web target otomatis menghitung saat user mengganti isi form
    webSelectSize.addEventListener("change", calculate);
    webInputDensity.addEventListener("input", calculate);
    
    // Jalankan sekali di awal eksekusi bookmarklet
    calculate();
    alert("Bookmarklet QC Inline berhasil diaktifkan pada halaman ini!");
  }
})();
