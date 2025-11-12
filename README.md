# ID ↔ EN Translator (Chrome Extension)

Fitur:
- Popup untuk menerjemahkan teks Indonesia ↔ Inggris.
- Klik kanan pada teks yang dipilih di halaman untuk menerjemahkan cepat dengan overlay hasil.

Cara install (Chrome):
- Buka `chrome://extensions`.
- Aktifkan "Developer mode" (Mode pengembang).
- Klik "Load unpacked" lalu pilih folder ini.

Cara pakai:
- Popup: klik ikon extension lalu masukkan teks dan pilih arah terjemahan.
- Klik kanan: seleksi teks di halaman, klik kanan, pilih "Translate Indonesia → English" atau "Translate English → Indonesia". Hasil akan muncul di overlay dekat pilihan.

Catatan:
- API yang digunakan: LibreTranslate (utama) dengan fallback ke MyMemory.
- Beberapa layanan publik memiliki batasan kecepatan; jika gagal, coba lagi.