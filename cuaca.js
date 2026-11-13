
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const hasilPencarian = document.getElementById("hasilPencarian");
const status = document.getElementById("status");
const weatherContainer = document.getElementById("weatherContainer");

// MENCARI LOKASI
searchForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const keyword = searchInput.value.trim();

    if (!keyword) return;

    try {
        status.textContent = "Sedang mencari lokasi...";
        hasilPencarian.innerHTML = "";
        weatherContainer.hidden = true;

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(keyword)}&count=8&language=id&format=json`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Gagal mencari lokasi");
        }

        const result = await response.json();

        if (!result.results || result.results.length === 0) {
            status.textContent = "Lokasi tidak ditemukan.";
            return;
        }

        status.textContent = "Pilih lokasi yang kamu cari:";

        result.results.forEach((lokasi) => {
            const button = document.createElement("button");

            button.className = "hasil-item";

            button.textContent =
                `${lokasi.name}, ${lokasi.admin1 || ""}, ${lokasi.country}`;

            button.addEventListener("click", () => {
                hasilPencarian.innerHTML = "";
                getCuaca(lokasi);
            });

            hasilPencarian.appendChild(button);
        });

    } catch (error) {
        status.textContent = "Terjadi kesalahan: " + error.message;
        console.error(error);
    }
});


// MENGAMBIL DATA CUACA
async function getCuaca(lokasi) {
    try {
        status.textContent = "Mengambil data cuaca...";
        weatherContainer.hidden = true;

        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lokasi.latitude}&longitude=${lokasi.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=1`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Gagal mengambil data cuaca");
        }

        const data = await response.json();

        const current = data.current;
        const hourly = data.hourly;

        document.getElementById("namaLokasi").textContent =
            `${lokasi.name}, ${lokasi.country}`;

        document.getElementById("tanggal").textContent =
            "Waktu lokal: " + current.time.replace("T", " ");

        document.getElementById("suhu").textContent =
            `${current.temperature_2m}°C`;

        document.getElementById("kondisi").textContent =
            getKondisi(current.weather_code);

        document.getElementById("terasa").textContent =
            `Terasa seperti ${current.apparent_temperature}°C`;

        document.getElementById("icon").textContent =
            getIcon(current.weather_code, current.is_day);

        document.getElementById("kelembapan").textContent =
            `${current.relative_humidity_2m}%`;

        document.getElementById("angin").textContent =
            `${current.wind_speed_10m} km/j`;

        const index = hourly.time.findIndex(
            time => time >= current.time
        );

        const indexCuaca = index >= 0 ? index : 0;

        document.getElementById("hujan").textContent =
            `${hourly.precipitation_probability[indexCuaca]}%`;

        // MENAMPILKAN PRAKIRAAN PER JAM

        const daftar = document.getElementById("daftarCuaca");

        daftar.innerHTML = "";

        for (let i = indexCuaca; i < Math.min(indexCuaca + 8, hourly.time.length); i++) {

            const waktu = hourly.time[i].split("T")[1];

            const kondisi = getKondisi(hourly.weather_code[i]);

            const icon = getIcon(hourly.weather_code[i], 1);

            const item = document.createElement("div");

            item.className = "cuaca-item";

            item.innerHTML = `
                <span class="waktu">${waktu}</span>
                <span class="kondisi">${icon} ${kondisi}</span>
                <span class="suhu">${hourly.temperature_2m[i]}°C</span>
            `;

            daftar.appendChild(item);
        }

        weatherContainer.hidden = false;
        status.textContent = "Data cuaca berhasil diperbarui.";

    } catch (error) {
        status.textContent = "Gagal mengambil cuaca: " + error.message;
        console.error(error);
    }
}


// MENERJEMAHKAN KODE CUACA WMO
function getKondisi(code) {

    const kondisi = {
        0: "Cerah",
        1: "Cerah Berawan",
        2: "Berawan Sebagian",
        3: "Mendung",
        45: "Berkabut",
        48: "Kabut Tebal",
        51: "Gerimis Ringan",
        53: "Gerimis Sedang",
        55: "Gerimis Lebat",
        61: "Hujan Ringan",
        63: "Hujan Sedang",
        65: "Hujan Lebat",
        71: "Salju Ringan",
        73: "Salju Sedang",
        75: "Salju Lebat",
        80: "Hujan Lokal Ringan",
        81: "Hujan Lokal Sedang",
        82: "Hujan Lokal Lebat",
        95: "Badai Petir",
        96: "Badai Petir dengan Hujan Es",
        99: "Badai Petir dengan Hujan Es Lebat"
    };

    return kondisi[code] || "Kondisi tidak diketahui";
}


// ICON CUACA
function getIcon(code, isDay) {

    if (code === 0) {
        return isDay ? "☀️" : "🌙";
    }

    if (code === 1 || code === 2) return "🌤️";
    if (code === 3) return "☁️";

    if (code === 45 || code === 48) return "🌫️";

    if (code >= 51 && code <= 67) return "🌧️";

    if (code >= 71 && code <= 77) return "❄️";

    if (code >= 80 && code <= 82) return "🌦️";

    if (code >= 95) return "⛈️";

    return "🌥️";
}


// TAMPILKAN CUACA MEDAN SAAT PERTAMA DIBUKA
searchInput.value = "Medan";

getLokasiAwal();

async function getLokasiAwal() {
    try {
        const response = await fetch(
            "https://geocoding-api.open-meteo.com/v1/search?name=Medan&count=1&language=id&format=json"
        );

        const result = await response.json();

        if (result.results && result.results.length > 0) {
            await getCuaca(result.results[0]);
        }

    } catch (error) {
        status.textContent = "Silakan cari lokasi secara manual.";
        console.error(error);
    }
}
