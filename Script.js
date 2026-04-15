// Script.js  (main logic) - replace your existing Script.js
const apiKey = 'Your API'; // keep your key

// helpers
function formatDate(timestamp) {
    const d = new Date(timestamp);
    const opts = { weekday: 'short' };
    return d.toLocaleDateString(undefined, opts);
}

function humanTime(str) {
    // weatherapi returns HH:MM (local) as string; just return it
    return str;
}

async function updateWeather(city) {
    if (!city) return;

    const loc = citylist[city];
    if (!loc) return;
    const [lat, lon] = loc;
    const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;

    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.error('API error', data.error);
            return;
        }

        // header / main info
        const locName = `${data.location.name}, ${data.location.country}`;
        document.getElementById('bigLocation').textContent = locName;
        const now = new Date(data.location.localtime);
        document.getElementById('dateStr').textContent = now.toDateString();

        // current
        const curr = data.current;
        const bigTemp = `${Math.round(curr.temp_c)}°C`;
        document.getElementById('bigTemp').textContent = bigTemp;
        document.getElementById('feelsLike').textContent = `${Math.round(curr.feelslike_c)}°C`;
        document.getElementById('Humidity').textContent = `${curr.humidity}%`;
        document.getElementById('pressure').textContent = `${curr.pressure_mb} MB`;
        document.getElementById('wind_speed').textContent = `${curr.wind_kph} KM/H`;
        document.getElementById('Condition').textContent = curr.condition.text;

        // icon (use 64x64 served by weatherapi, ensure https)
        const bigIconWrap = document.getElementById('bigIcon');
        const iconUrl = curr.condition.icon.startsWith('//') ? 'https:' + curr.condition.icon : curr.condition.icon;
        bigIconWrap.innerHTML = `<img src="${iconUrl}" alt="${curr.condition.text}" />`;

        // coords
        document.getElementById('latitude').textContent = data.location.lat;
        document.getElementById('longitude').textContent = data.location.lon;

        // astro
        const today = data.forecast.forecastday[0].astro;
        document.getElementById('sunrise').textContent = today.sunrise || '-';
        document.getElementById('sunset').textContent = today.sunset || '-';

        // build 7-day forecast grid
        const grid = document.getElementById('forecastGrid');
        grid.innerHTML = '';
        data.forecast.forecastday.forEach(fd => {
            const dayLabel = formatDate(fd.date);
            const dayIcon = fd.day.condition.icon.startsWith('//') ? 'https:' + fd.day.condition.icon : fd.day.condition.icon;
            const minT = Math.round(fd.day.mintemp_c);
            const maxT = Math.round(fd.day.maxtemp_c);
            const textCond = fd.day.condition.text;

            const card = document.createElement('div');
            card.className = 'day-card';
            card.innerHTML = `
                <div class="dow">${dayLabel}<div style="font-weight:400;font-size:11px;margin-top:4px">${fd.date}</div></div>
                <div class="icon"><img src="${dayIcon}" alt="${textCond}"></div>
                <div class="temp-small"><span>${minT}°</span><span>${maxT}°</span></div>
                <div style="margin-top:8px;font-size:12px;opacity:0.95">${textCond}</div>
            `;

            // on click, update details panel with day's details
            card.addEventListener('click', () => {
                document.querySelectorAll('.day-card').forEach(el => el.style.borderColor = 'rgba(255,255,255,0.04)');
                card.style.borderColor = 'rgba(255,255,255,0.25)';
                const details = document.getElementById('currentDetails');
                details.innerHTML = `
                    <p><strong>${dayLabel} — ${fd.date}</strong></p>
                    <p><strong>Avg temp:</strong> ${Math.round(fd.day.avgtemp_c)}°C</p>
                    <p><strong>Max:</strong> ${Math.round(fd.day.maxtemp_c)}°C, <strong>Min:</strong> ${Math.round(fd.day.mintemp_c)}°C</p>
                    <p><strong>Chance of rain:</strong> ${fd.day.daily_chance_of_rain || 0}%</p>
                    <p><strong>Humidity:</strong> ${fd.day.avghumidity}%</p>
                `;
            });

            grid.appendChild(card);
        });

        // auto-select first card
        const firstCard = grid.querySelector('.day-card');
        if (firstCard) firstCard.click();

    } catch (err) {
        console.error('Error fetching weather data:', err);
    }
}

// wire up dropdown
document.getElementById('cities').addEventListener('change', (e) => {
    const selectedCity = e.target.value;
    updateWeather(selectedCity);
});

// optionally preselect a city on load
window.addEventListener('DOMContentLoaded', () => {
    // pick a sensible default if present
    const prefer = 'Istanbul';
    const select = document.getElementById('cities');
    if (Array.from(select.options).some(o => o.value === prefer)) {
        select.value = prefer;
        updateWeather(prefer);
    }
});
