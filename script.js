(function () {
  // Cegah duplikasi panel jika tombol diklik berkali-kali
  if (document.getElementById("qc-inline-panel")) {
    alert("Panel QC sudah terbuka di layar!");
    return;
  }

  // 1. Suntikkan library external yang dibutuhkan ke web target
  const tailwind = document.createElement("script");
  tailwind.src = "https://cdn.tailwindcss.com";
  document.head.appendChild(tailwind);

  const lucideSrc = document.createElement("script");
  lucideSrc.src = "https://unpkg.com/lucide@latest";
  document.head.appendChild(lucideSrc);

  const qrCodeSrc = document.createElement("script");
  qrCodeSrc.src = "https://unpkg.com/html5-qrcode";
  document.head.appendChild(qrCodeSrc);

  // 2. Buat container utama berbentuk Panel Melayang (Floating Panel)
  const panelContainer = document.createElement("div");
  panelContainer.id = "qc-inline-panel";
  // Desain container agar melayang di kanan layar, memiliki bayangan tebal, dan fixed
  panelContainer.className = "fixed top-4 right-4 w-[600px] h-[90vh] bg-slate-50 text-slate-800 flex rounded-2xl shadow-2xl border border-slate-200 z-[99999] overflow-hidden font-sans";
  
  // 3. Masukkan struktur HTML asli milikmu ke dalam container
  panelContainer.innerHTML = `
    <style>
      .form-group { position: relative; }
      .btn { cursor: pointer; display: inline-flex; align-items: center; justify-content: center; }
      .form-label { display: inline-block; font-size: 0.85rem; font-weight: 700; color: #2e3b82; margin-bottom: 0.5rem; text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #cbd5e1; }
      .form-input { width: 100%; padding: 0.6rem 0.85rem; border: 1.5px solid #a4b3d6; border-radius: 0.65rem; font-size: 0.875rem; color: #334155; background-color: #ffffff; transition: all 0.2s ease; }
      .form-input::placeholder { color: #cbd5e1; }
      .form-input:focus { outline: none; border-color: #3f51b5; box-shadow: 0 0 0 3px rgba(63, 81, 181, 0.15); }
      .form-input::-webkit-outer-spin-button, .form-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      select.form-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%232e3b82' stroke-width='2.5'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E"); background-size: 1.1rem; background-position: calc(100% - 0.75rem) center; }
      .btn-scan { padding: 0.5rem 1.5rem; background-color: #3b4cb4; color: #ffffff; font-size: 0.85rem; font-weight: 600; border-radius: 0.65rem; white-space: nowrap; transition: background-color 0.2s; }
      .btn-scan:hover { background-color: #2e3b82; }
      .section-title { font-size: 1.15rem; font-weight: 700; color: #2e3b82; margin-bottom: 1rem; text-decoration-line: underline; text-underline-offset: 5px; text-decoration-color: #2e3b82; }
    </style>

    <aside class="sidebar w-20 bg-indigo-800 flex flex-col justify-between items-center py-6 text-white shrink-0">
      <div class="flex flex-col items-center gap-8 w-full">
        <div class="sidebar-icon-wrapper p-2 hover:bg-indigo-700 rounded-lg cursor-pointer transition">
          <i data-lucide="store" class="w-7 h-7"></i>
        </div>
        <div class="sidebar-icon-wrapper p-2 hover:bg-indigo-700 rounded-lg cursor-pointer transition">
          <i data-lucide="badge-percent" class="w-6 h-6 opacity-80"></i>
        </div>
        <div class="sidebar-icon-wrapper p-2 hover:bg-indigo-700 rounded-lg cursor-pointer transition">
          <i data-lucide="pie-chart" class="w-6 h-6 opacity-80"></i>
        </div>
        <div class="p-3 bg-indigo-600/50 border border-indigo-400/30 rounded-xl shadow-md cursor-pointer w-12 h-12 flex items-center justify-center">
          <i data-lucide="settings" class="w-6 h-6"></i>
        </div>
      </div>
      <div class="sidebar-icon-wrapper p-2 hover:bg-indigo-700 rounded-lg cursor-pointer transition">
        <i data-lucide="log-out" class="w-6 h-6 opacity-80"></i>
      </div>
    </aside>

    <main class="flex-1 bg-white p-6 overflow-y-auto relative border border-slate-100">
      <button id="btn-close-panel" class="absolute top-4 right-4 text-indigo-900 hover:bg-slate-100 p-1.5 rounded-lg transition border border-indigo-900/20">
        <i data-lucide="x" class="w-5 h-5"></i>
      </button>

      <h1 class="text-xl font-bold text-indigo-950 mb-4 tracking-wide">Auto Fill QC Inline</h1>

      <div class="flex gap-6 text-xs font-medium text-slate-400 mb-4 pb-2 border-b border-slate-100">
        <button class="tab-btn text-indigo-800 border-b-2 border-indigo-800 pb-2 -mb-[17px] px-1 font-semibold">Semua</button>
        <button class="tab-btn hover:text-indigo-800 pb-2">Makanan</button>
        <button class="tab-btn hover:text-indigo-800 pb-2">Minuman</button>
        <button class="tab-btn hover:text-indigo-800 pb-2">Snack</button>
      </div>

      <form class="space-y-4 pt-2">
        <div class="grid grid-cols-1 gap-4">
          <div class="form-group">
            <label class="form-label">Nomer PO</label>
            <div class="flex gap-2">
              <input type="text" id="input-scan-po" placeholder="Hasil Scan PO" class="form-input" />
              <button type="button" id="btn-scan-po" class="btn btn-scan shadow-indigo-200 shadow-md">Scan PO</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Nomer Batch</label>
            <div class="flex gap-2">
              <input type="text" id="input-scan-batch" placeholder="Hasil Scan Batch" class="form-input" />
              <button type="button" id="btn-scan-batch" class="btn btn-scan shadow-indigo-200 shadow-md">Scan Batch</button>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Pilih Size</label>
            <select id="size-select" class="form-input appearance-none bg-no-repeat bg-right pr-8">
              <option value="">SELECT SIZE</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group"><label class="form-label">Density</label><input type="number" step="0.001" id="input-density-1" placeholder="Input Density" class="form-input" /></div>
          <div class="form-group"><label class="form-label">Toleransi</label><input type="text" id="input-toleransi" class="form-input" readonly /></div>
          <div class="form-group"><label class="form-label">Botol</label><input type="text" id="input-botol" class="form-input" readonly /></div>
          <div class="form-group"><label class="form-label">Cap</label><input type="text" id="input-cap" class="form-input" readonly /></div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="form-group"><label class="form-label">Label</label><input type="text" id="input-label" class="form-input" readonly /></div>
          <div class="form-group"><label class="form-label">Folding</label><input type="text" id="input-folding" class="form-input" readonly /></div>
          <div class="form-group"><label class="form-label">Layer</label><input type="text" id="input-layer" class="form-input" readonly /></div>
          <div class="form-group"><label class="form-label">Carton</label><input type="text" id="input-carton" class="form-input" readonly /></div>
        </div>
        <div class="form-group"><label class="form-label">Note</label><input type="text" id="input-note" class="form-input" readonly /></div>

        <div class="pb-2 border-t border-slate-200 pt-2">
          <h3 class="section-title">Berat Nett Pcs (Gram)</h3>
          <div class="grid grid-cols-3 gap-2">
            <div><label class="text-[10px] font-bold text-slate-500">Target</label><input type="text" id="nett-target" class="form-input font-semibold" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Minimum</label><input type="text" id="nett-min" class="form-input" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Maximum</label><input type="text" id="nett-max" class="form-input" readonly /></div>
          </div>
        </div>

        <div class="pb-2 border-t border-slate-200 pt-2">
          <h3 class="section-title">Berat Gross Pcs (Gram)</h3>
          <div class="grid grid-cols-3 gap-2">
            <div><label class="text-[10px] font-bold text-slate-500">Target</label><input type="text" id="gross-target" class="form-input font-semibold" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Minimum</label><input type="text" id="gross-min" class="form-input" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Maximum</label><input type="text" id="gross-max" class="form-input" readonly /></div>
          </div>
        </div>

        <div class="pb-2 border-t border-slate-200 pt-2">
          <h3 class="section-title">Berat Gross Carton (Kg)</h3>
          <div class="grid grid-cols-2 gap-2">
            <div><label class="text-[10px] font-bold text-slate-500">Target</label><input type="text" id="carton-target" class="form-input font-semibold" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Minimum</label><input type="text" id="carton-min" class="form-input" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Maximum</label><input type="text" id="carton-max" class="form-input" readonly /></div>
            <div><label class="text-[10px] font-bold text-slate-500">Toleransi</label><input type="text" id="carton-toleransi" class="form-input" readonly /></div>
          </div>
        </div>
      </form>
    </main>

    <div id="scanner-modal" class="fixed inset-0 bg-black/60 z-[100000] flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
      <div class="bg-white p-6 rounded-2xl max-w-md w-full mx-4 shadow-2xl relative">
        <h3 id="scanner-title" class="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          Scan Barcode
        </h3>
        <div id="scanner-reader" class="overflow-hidden rounded-xl bg-slate-100 border border-slate-200" style="width: 100%"></div>
        <button type="button" id="btn-close-scanner" class="mt-4 w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition">Batal / Tutup Kamera</button>
      </div>
    </div>
  `;

  // 4. Masukkan panel tersebut ke dalam body website target
  document.body.appendChild(panelContainer);

  // 5. Jalankan inisialisasi script bawaan kamu setelah library selesai dimuat
  setTimeout(() => {
    if (typeof lucide !== "undefined") lucide.createIcons();
    initLocalLogic();
  }, 1000);

  function initLocalLogic() {
    // Aksi tombol close panel melayang
    document.getElementById("btn-close-panel").addEventListener("click", () => {
      document.body.removeChild(panelContainer);
    });

    // Ambit data packaging.json langsung dari GitHub kamu
    fetch("https://raw.githubusercontent.com/erfandana/scriptbookmarklet/refs/heads/main/packaging.json?t=" + Date.now())
      .then(res => res.json())
      .then(data => {
        const sizeSelect = document.getElementById("size-select");
        const densityInput = document.getElementById("input-density-1");

        // Isi Dropdown Size
        data.forEach((item, index) => {
          const opt = document.createElement("option");
          opt.value = index;
          opt.textContent = item.size;
          sizeSelect.appendChild(opt);
        });

        // Mapping Kolom Input Lokal Panel
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

        function calculateWeights() {
          const selectedIndex = sizeSelect.value;
          const density = parseFloat(densityInput.value) || 0;

          if (selectedIndex !== "" && density > 0) {
            const s = data[selectedIndex];
            const v = s.volume || 0, isi = s.isi || 0, b = s.botol || 0, c = s.cap || 0;
            const l = s.label || 0, cp = s.carton || 0, f = s.folding || 0, ly = s.layer || 0, t = s.toleransi || 0;

            const nTar = v * density;
            const nMin = nTar - t;
            const nMax = nTar + t;

            const gTar = nTar + b + c;
            const gMin = nMin + b + c;
            const gMax = nMax + b + c;

            const akKardus = ly + cp;
            const akBotol = isi * (l + f);
            const cTarG = gTar * isi + akKardus + akBotol;
            const cMaxG = gMax * isi + akKardus + akBotol;

            let cMinG = 0, cTolG = 0;
            if (v <= 250) {
              cMinG = cTarG - nTar;
              cTolG = nTar;
            } else if (v >= 500) {
              cMinG = gMin * isi + akKardus + akBotol;
              cTolG = cMaxG - cTarG;
            }

            calcOutputs.nettTarget.value = nTar.toFixed(2);
            calcOutputs.nettMin.value = nMin.toFixed(2);
            calcOutputs.nettMax.value = nMax.toFixed(2);
            calcOutputs.grossTarget.value = gTar.toFixed(2);
            calcOutputs.grossMin.value = gMin.toFixed(2);
            calcOutputs.grossMax.value = gMax.toFixed(2);
            calcOutputs.cartonTarget.value = (cTarG / 1000).toFixed(3);
            calcOutputs.cartonMin.value = (cMinG / 1000).toFixed(3);
            calcOutputs.cartonMax.value = (cMaxG / 1000).toFixed(3);
            calcOutputs.cartonToleransi.value = (cTolG / 1000).toFixed(3);
          } else {
            Object.values(calcOutputs).forEach(el => if(el) el.value = "");
          }
        }

        sizeSelect.addEventListener("change", function () {
          const idx = this.value;
          if (idx !== "") {
            Object.keys(inputs).forEach(k => {
              if (inputs[k] && k !== "note") inputs[k].value = data[idx][k] !== undefined ? data[idx][k] : "";
            });
            inputs.note.value = data[idx]._note !== undefined ? data[idx]._note : "";
          } else {
            Object.values(inputs).forEach(el => if(el) el.value = "");
          }
          calculateWeights();
        });

        densityInput.addEventListener("input", calculateWeights);
      });

    // Logika tab switcher lokal panel
    const tabs = panelContainer.querySelectorAll(".tab-btn");
    tabs.forEach(tab => {
      tab.addEventListener("click", function () {
        tabs.forEach(item => {
          item.className = "tab-btn hover:text-indigo-800 pb-2 text-slate-400";
        });
        this.className = "tab-btn text-indigo-800 border-b-2 border-indigo-800 pb-2 -mb-[17px] px-1 font-semibold";
      });
    });
  }
})();
