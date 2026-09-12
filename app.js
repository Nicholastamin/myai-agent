// ===============================
// MyAI Agent V3
// Tanpa API key - berjalan di browser
// Belajar menggunakan Multinomial Naive Bayes
// ===============================

const STORAGE = "myai_v3_training";
const NOTES = "myai_v3_notes";
const CHAT = "myai_v3_chat";

const defaultTraining = {
  halo: [
    "halo", "hai", "hi", "selamat pagi", "selamat siang",
    "selamat sore", "selamat malam", "apa kabar", "hai ai"
  ],
  identitas: [
    "siapa kamu", "kamu siapa", "namamu siapa", "apa nama kamu"
  ],
  kalkulator: [
    "hitung 2 tambah 3", "berapa 10 kali 5", "hitung 20 dibagi 4",
    "berapa 9 kurang 2", "tolong hitung matematika", "kalkulator"
  ],
  simpan_catatan: [
    "simpan catatan", "buat catatan", "ingat ini",
    "simpan catatan belajar", "saya mau menyimpan catatan"
  ],
  daftar_catatan: [
    "lihat catatan", "tampilkan catatan", "apa saja catatan saya",
    "daftar catatan", "buka catatan"
  ],
  buat_file: [
    "buat file txt", "buat file teks", "simpan menjadi file",
    "buat dokumen txt"
  ],
  ajar: [
    "ajari kamu", "saya mau mengajari kamu", "ajarkan sesuatu",
    "belajar dari saya", "ajari ai"
  ],
  status: [
    "apa yang kamu pelajari", "berapa contoh yang kamu punya",
    "status belajar", "lihat pembelajaran"
  ]
};

let training = loadTraining();
let notes = JSON.parse(localStorage.getItem(NOTES) || "[]");
let history = JSON.parse(localStorage.getItem(CHAT) || "[]");

function loadTraining() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    return saved && Object.keys(saved).length ? saved : structuredClone(defaultTraining);
  } catch {
    return structuredClone(defaultTraining);
  }
}

function saveTraining() {
  localStorage.setItem(STORAGE, JSON.stringify(training));
}

function saveNotes() {
  localStorage.setItem(NOTES, JSON.stringify(notes));
}

function saveHistory() {
  localStorage.setItem(CHAT, JSON.stringify(history));
}

function tokenize(text) {
  return text.toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// ===============================
// Naive Bayes
// ===============================

function trainModel() {
  const model = {};
  const vocabulary = new Set();
  let totalDocs = 0;

  for (const [intent, examples] of Object.entries(training)) {
    const wordCounts = {};
    let totalWords = 0;

    for (const example of examples) {
      totalDocs++;
      for (const word of tokenize(example)) {
        vocabulary.add(word);
        wordCounts[word] = (wordCounts[word] || 0) + 1;
        totalWords++;
      }
    }

    model[intent] = {
      docs: examples.length,
      wordCounts,
      totalWords
    };
  }

  return { model, vocabulary, totalDocs };
}

let modelData = trainModel();

function predict(text) {
  const words = tokenize(text);
  if (!words.length) return { intent: null, confidence: 0 };

  const { model, vocabulary, totalDocs } = modelData;
  const scores = {};

  for (const [intent, data] of Object.entries(model)) {
    // log prior
    let score = Math.log((data.docs + 1) / (totalDocs + Object.keys(model).length));

    for (const word of words) {
      const count = data.wordCounts[word] || 0;
      // Laplace smoothing
      score += Math.log((count + 1) / (data.totalWords + vocabulary.size));
    }
    scores[intent] = score;
  }

  const ranked = Object.entries(scores).sort((a,b) => b[1] - a[1]);
  const best = ranked[0];

  // Ubah jarak skor menjadi indikator keyakinan sederhana.
  const second = ranked[1] ? ranked[1][1] : best[1] - 2;
  const confidence = 1 / (1 + Math.exp(-(best[1] - second)));

  return { intent: best[0], confidence };
}

// ===============================
// Chat UI
// ===============================

function addMessage(role, text, save=true) {
  const chat = document.getElementById("chat");
  const div = document.createElement("div");
  div.className = "msg " + role;
  div.textContent = text;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;

  if (save) {
    history.push({ role, text });
    saveHistory();
  }
}

function restoreChat() {
  document.getElementById("chat").innerHTML = "";
  if (history.length) {
    history.forEach(x => addMessage(x.role, x.text, false));
  } else {
    addMessage("bot",
      "Halo! Saya MyAI Agent V3.\n" +
      "Saya berjalan langsung di browser tanpa API key.\n\n" +
      "Saya bisa belajar dari contoh yang kamu berikan. Coba ketik: \"ajari saya\"."
    );
  }
}

function sendQuick(text) {
  document.getElementById("input").value = text;
  document.getElementById("form").requestSubmit();
}

// ===============================
// Belajar
// Format:
// ajari | intent | contoh kalimat
// Contoh:
// ajari | halo | selamat malam semuanya
// ===============================

function teachCommand(text) {
  const parts = text.split("|").map(x => x.trim());

  if (parts.length >= 3 && parts[0].toLowerCase() === "ajari") {
    const intent = parts[1].toLowerCase().replace(/\s+/g, "_");
    const example = parts.slice(2).join(" | ");

    if (!intent || !example) return false;

    if (!training[intent]) training[intent] = [];
    training[intent].push(example);

    modelData = trainModel();
    saveTraining();

    addMessage("bot",
      `Saya belajar.\n\nContoh "${example}" sekarang dimasukkan ke kategori "${intent}".\n` +
      `Total contoh yang saya punya: ${countExamples()}.`
    );
    updateStatus();
    return true;
  }

  return false;
}

function demoTeach() {
  addMessage("bot",
    "Cara mengajari saya:\n\n" +
    "ajari | nama_kategori | contoh kalimat\n\n" +
    "Contoh:\n" +
    "ajari | cuaca | bagaimana keadaan cuaca\n" +
    "ajari | cuaca | apakah hari ini hujan\n\n" +
    "Setelah itu saya akan belajar pola kata dari contoh tersebut."
  );
}

function countExamples() {
  return Object.values(training).reduce((sum, arr) => sum + arr.length, 0);
}

// ===============================
// Tools
// ===============================

function calculate(text) {
  let expr = text.toLowerCase()
    .replace(/berapa|hitung|tolong|kalkulator/g, "")
    .replace(/ditambah|tambah/gi, "+")
    .replace(/dikurangi|kurang/gi, "-")
    .replace(/dikali|kali/gi, "*")
    .replace(/dibagi|bagi/gi, "/")
    .replace(/[^0-9+\-*/().\s]/g, "")
    .trim();

  if (!expr || !/[+\-*/]/.test(expr)) return null;

  try {
    // Hanya karakter matematika yang diizinkan.
    const result = Function('"use strict"; return (' + expr + ')')();
    if (!Number.isFinite(result)) return "Hasil tidak valid.";
    return `${expr} = ${result}`;
  } catch {
    return "Saya tidak bisa menghitung bentuk tersebut.";
  }
}

function saveNote(text) {
  const content = text
    .replace(/simpan catatan/i, "")
    .replace(/buat catatan/i, "")
    .replace(/ingat ini/i, "")
    .trim();

  if (!content) return "Tulis isi catatannya setelah perintah.";

  notes.push({
    text: content,
    time: new Date().toLocaleString("id-ID")
  });
  saveNotes();

  return `Catatan disimpan: "${content}"`;
}

function listNotes() {
  if (!notes.length) return "Belum ada catatan.";

  return "Catatan kamu:\n" +
    notes.map((n,i) => `${i+1}. ${n.text} (${n.time})`).join("\n");
}

function createTextFile(text) {
  let content = text.replace(/buat file txt/i, "").trim();
  if (!content) content = "File dibuat oleh MyAI Agent V3.";

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "hasil-myAI.txt";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return "File TXT berhasil dibuat.";
}

function updateStatus() {
  document.getElementById("status").textContent =
    `${countExamples()} contoh pembelajaran • ${Object.keys(training).length} kategori`;
}

// ===============================
// Agent Router
// ===============================

function respond(text) {
  const teach = teachCommand(text);
  if (teach) return;

  const prediction = predict(text);
  const intent = prediction.intent;

  // Perintah yang sangat jelas didahulukan.
  if (/(simpan catatan|buat catatan|ingat ini)/i.test(text)) {
    addMessage("bot", saveNote(text));
    return;
  }

  if (/(lihat catatan|tampilkan catatan|daftar catatan|buka catatan)/i.test(text)) {
    addMessage("bot", listNotes());
    return;
  }

  if (/(buat file txt|buat file teks)/i.test(text)) {
    addMessage("bot", createTextFile(text));
    return;
  }

  const math = calculate(text);
  if (math) {
    addMessage("bot", math);
    return;
  }

  if (intent === "halo") {
    addMessage("bot", "Halo! Senang bertemu denganmu.");
    return;
  }

  if (intent === "identitas") {
    addMessage("bot",
      "Saya MyAI Agent V3, AI lokal sederhana yang berjalan di browser. " +
      "Saya tidak memakai API key. Saya bisa belajar dari contoh yang kamu ajarkan."
    );
    return;
  }

  if (intent === "status") {
    addMessage("bot",
      `Saya memiliki ${countExamples()} contoh pembelajaran dalam ${Object.keys(training).length} kategori.`
    );
    return;
  }

  if (intent === "ajar") {
    demoTeach();
    return;
  }

  // Kalau keyakinan rendah, minta contoh.
  if (prediction.confidence < 0.56) {
    addMessage("bot",
      "Saya belum yakin memahami maksudmu.\n\n" +
      "Kamu bisa mengajari saya dengan format:\n" +
      "ajari | nama_kategori | contoh kalimat"
    );
    return;
  }

  addMessage("bot",
    `Saya mengenali perintah itu sebagai "${intent}".\n` +
    "Tetapi kategori tersebut belum memiliki tindakan khusus."
  );
}

document.getElementById("form").addEventListener("submit", e => {
  e.preventDefault();

  const input = document.getElementById("input");
  const text = input.value.trim();
  if (!text) return;

  addMessage("user", text);
  input.value = "";
  respond(text);
});

function resetAI() {
  if (!confirm("Hapus semua pembelajaran, catatan, dan percakapan?")) return;

  localStorage.removeItem(STORAGE);
  localStorage.removeItem(NOTES);
  localStorage.removeItem(CHAT);

  training = structuredClone(defaultTraining);
  notes = [];
  history = [];
  modelData = trainModel();

  restoreChat();
  updateStatus();
}

restoreChat();
updateStatus();
