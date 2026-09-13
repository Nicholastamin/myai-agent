// ==========================================
// MyAI AGENT V5
// Search + Memory + Learning + Calculator
// ==========================================


// ==========================================
// ELEMENT
// ==========================================

const chat = document.getElementById("chat");

const input = document.getElementById("input");


// ==========================================
// MEMORY
// ==========================================

let memory =
    JSON.parse(
        localStorage.getItem("myai_memory")
    ) || [];


// ==========================================
// TRAINING DATA
// ==========================================

let training =
    JSON.parse(
        localStorage.getItem("myai_training")
    ) || {

        halo: [
            "halo",
            "hai",
            "hi",
            "selamat pagi",
            "selamat siang",
            "selamat malam"
        ],

        identitas: [
            "siapa kamu",
            "kamu siapa",
            "apa nama kamu"
        ],

        kalkulator: [
            "hitung",
            "berapa hasil",
            "kalkulator",
            "matematika"
        ],

        search: [
            "cari",
            "apa arti",
            "apa itu",
            "jelaskan",
            "siapa",
            "kapan",
            "dimana",
            "mengapa",
            "bagaimana"
        ]

    };


// ==========================================
// TAMPILKAN PESAN
// ==========================================

function pesan(teks, tipe, sumber = "") {

    const div =
        document.createElement("div");

    div.className =
        "message " + tipe;

    div.textContent = teks;


    if (sumber) {

        const source =
            document.createElement("div");

        source.className =
            "source";

        source.textContent =
            "Sumber: " + sumber;

        div.appendChild(source);
    }


    chat.appendChild(div);

    chat.scrollTop =
        chat.scrollHeight;
}


// ==========================================
// TOKENIZER
// ==========================================

function tokenize(teks) {

    return teks
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter(Boolean);

}


// ==========================================
// AI BELAJAR SEDERHANA
// ==========================================

function kenaliMaksud(teks) {

    const kata =
        tokenize(teks);

    let terbaik = null;

    let skorTerbaik = 0;


    for (
        const kategori in training
    ) {

        let skor = 0;


        for (
            const contoh of training[kategori]
        ) {

            const kataContoh =
                tokenize(contoh);


            for (
                const k of kata
            ) {

                if (
                    kataContoh.includes(k)
                ) {

                    skor++;
                }
            }
        }


        if (
            skor > skorTerbaik
        ) {

            skorTerbaik = skor;

            terbaik = kategori;
        }
    }


    return terbaik;
}


// ==========================================
// AJARI AI
// ==========================================
//
// Format:
//
// ajari | kategori | contoh
//
// Contoh:
//
// ajari | cuaca | apakah hari ini hujan
//

function belajar(teks) {

    const bagian =
        teks.split("|");


    if (
        bagian.length < 3
    ) {

        return false;
    }


    if (
        bagian[0]
            .trim()
            .toLowerCase() !== "ajari"
    ) {

        return false;
    }


    const kategori =
        bagian[1]
            .trim()
            .toLowerCase();


    const contoh =
        bagian
            .slice(2)
            .join("|")
            .trim();


    if (
        !kategori ||
        !contoh
    ) {

        return false;
    }


    if (
        !training[kategori]
    ) {

        training[kategori] = [];
    }


    training[kategori]
        .push(contoh);


    localStorage.setItem(
        "myai_training",
        JSON.stringify(training)
    );


    pesan(

        "🧠 Saya sudah belajar.\n\n" +

        "Kategori: " +
        kategori +

        "\nContoh: " +
        contoh,

        "ai"
    );


    return true;
}


// ==========================================
// MEMORY
// ==========================================

function simpanMemory(teks) {

    memory.push({

        isi: teks,

        waktu:
            new Date()
                .toLocaleString("id-ID")

    });


    localStorage.setItem(
        "myai_memory",
        JSON.stringify(memory)
    );

}


function tampilkanMemory() {

    if (
        memory.length === 0
    ) {

        pesan(
            "🧠 Saya belum mengingat apa pun.",
            "ai"
        );

        return;
    }


    let hasil =
        "🧠 Yang saya ingat:\n\n";


    memory.forEach(
        (item, index) => {

            hasil +=
                `${index + 1}. ` +
                item.isi +
                "\n";

        }
    );


    pesan(
        hasil,
        "ai"
    );
}


// ==========================================
// KALKULATOR
// ==========================================

function hitung(teks) {

    let ekspresi =
        teks
            .toLowerCase()

            .replace(/berapa/g, "")

            .replace(/hitung/g, "")

            .replace(/hasil/g, "")

            .replace(/kalkulator/g, "")

            .replace(/ditambah/g, "+")

            .replace(/tambah/g, "+")

            .replace(/dikurangi/g, "-")

            .replace(/kurang/g, "-")

            .replace(/dikali/g, "*")

            .replace(/kali/g, "*")

            .replace(/dibagi/g, "/")

            .replace(/bagi/g, "/")

            .replace(
                /[^0-9+\-*/().\s]/g,
                ""
            )

            .trim();


    if (
        !ekspresi ||
        !/[+\-*/]/.test(ekspresi)
    ) {

        return null;
    }


    try {

        const hasil =
            Function(
                '"use strict"; return (' +
                ekspresi +
                ')'
            )();


        return (
            ekspresi +
            " = " +
            hasil
        );

    }

    catch {

        return null;

    }

}


// ==========================================
// SEARCH INTERNET
// ==========================================

async function searchInternet(
    pertanyaan
) {

    pesan(
        "🔎 Saya sedang mencari informasi di internet...",
        "ai"
    );


    try {

        const url =
            "https://api.duckduckgo.com/" +

            "?q=" +
            encodeURIComponent(
                pertanyaan
            ) +

            "&format=json" +

            "&no_html=1" +

            "&skip_disambig=1";


        const response =
            await fetch(url);


        if (
            !response.ok
        ) {

            throw new Error(
                "Search gagal"
            );
        }


        const data =
            await response.json();


        // ==================================
        // ABSTRACT
        // ==================================

        if (
            data.AbstractText
        ) {

            pesan(

                data.AbstractText,

                "ai",

                data.AbstractURL || ""

            );

            return;
        }


        // ==================================
        // ANSWER
        // ==================================

        if (
            data.Answer
        ) {

            pesan(

                data.Answer,

                "ai",

                data.AbstractURL || ""

            );

            return;
        }


        // ==================================
        // RELATED TOPICS
        // ==================================

        if (
            data.RelatedTopics
        ) {

            const hasil =
                data.RelatedTopics

                    .filter(
                        item =>
                            item.Text
                    )

                    .slice(0, 5);


            if (
                hasil.length > 0
            ) {

                let jawaban =
                    "🔎 Hasil pencarian:\n\n";


                hasil.forEach(
                    (item, index) => {

                        jawaban +=

                            `${index + 1}. ` +

                            item.Text +

                            "\n\n";

                    }
                );


                pesan(
                    jawaban,
                    "ai"
                );


                return;
            }
        }


        pesan(

            "Saya tidak menemukan jawaban langsung. " +

            "Coba gunakan pertanyaan yang lebih spesifik.",

            "ai"
        );

    }


    catch (error) {

        console.error(error);


        pesan(

            "❌ Pencarian gagal.\n\n" +

            "Pastikan HP terhubung ke internet.",

            "ai"
        );

    }

}


// ==========================================
// AI AGENT
// ==========================================

async function proses(teks) {

    const lower =
        teks.toLowerCase();


    // ==================================
    // BELAJAR
    // ==================================

    if (
        belajar(teks)
    ) {

        return;
    }


    // ==================================
    // MEMORY
    // ==================================

    if (
        lower.startsWith(
            "ingat "
        )
    ) {

        const isi =
            teks.substring(6);


        simpanMemory(isi);


        pesan(

            "🧠 Baik, saya akan mengingat: " +
            isi,

            "ai"
        );


        return;
    }


    if (
        lower.includes(
            "apa yang kamu ingat"
        )
    ) {

        tampilkanMemory();

        return;
    }


    // ==================================
    // SALAM
    // ==================================

    if (
        lower === "halo" ||
        lower === "hai" ||
        lower === "hi"
    ) {

        pesan(
            "Halo! 👋 Ada yang bisa saya bantu?",
            "ai"
        );

        return;
    }


    // ==================================
    // IDENTITAS
    // ==================================

    if (
        lower.includes(
            "siapa kamu"
        )
    ) {

        pesan(

            "Saya MyAI Agent V5 🤖\n\n" +

            "Saya bisa:\n" +

            "• Mencari informasi di internet\n" +

            "• Mengingat informasi\n" +

            "• Belajar dari contoh\n" +

            "• Menghitung matematika\n" +

            "• Berjalan tanpa API key",

            "ai"
        );

        return;
    }


    // ==================================
    // KALKULATOR
    // ==================================

    const hasil =
        hitung(teks);


    if (
        hasil !== null
    ) {

        pesan(
            "🧮 " + hasil,
            "ai"
        );

        return;
    }


    // ==================================
    // SEARCH
    // ==================================

    await searchInternet(
        teks
    );

}


// ==========================================
// KIRIM
// ==========================================

async function kirim() {

    const teks =
        input.value.trim();


    if (
        teks === ""
    ) {

        return;
    }


    pesan(
        teks,
        "user"
    );


    input.value = "";


    await proses(
        teks
    );

}


// ==========================================
// ENTER
// ==========================================

input.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            kirim();

        }

    }
);


// ==========================================
// BUTTON CONTOH
// ==========================================

function contoh(teks) {

    input.value =
        teks;

    kirim();

}


function caraBelajar() {

    pesan(

        "📚 Cara mengajari saya:\n\n" +

        "ajari | kategori | contoh\n\n" +

        "Contoh:\n" +

        "ajari | cuaca | apakah hari ini hujan\n" +

        "ajari | sekolah | saya ingin belajar fisika\n\n" +

        "Setelah itu saya akan menyimpan contoh tersebut.",

        "ai"
    );

}


// ==========================================
// PESAN AWAL
// ==========================================

pesan(

    "Halo! 👋 Saya MyAI Agent V5.\n\n" +

    "Saya bisa mencari informasi di internet.\n\n" +

    "Coba tanyakan:\n" +

    "• Apa arti iklim?\n" +

    "• Siapa Albert Einstein?\n" +

    "• Mengapa terjadi hujan?\n" +

    "• Hitung 25 kali 4",

    "ai"
);
