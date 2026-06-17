import {
    db,
    collection,
    onSnapshot,
    doc,
    setDoc,
    getDoc
} from "./firebase.js";

// ── Datos ──────────────────────────────────────────────────────────────
let eliminatedTeams = [];

const allTeams = [
    ...new Set(participantsData.flatMap(p => p.teams))
];

// Calendario de partidos (fase de grupos, equipos relevantes primero)
const matches = [
    { date: "11-Jun-2026", home: "México",         away: "Canadá" },
    { date: "12-Jun-2026", home: "Brasil",          away: "Japón" },
    { date: "13-Jun-2026", home: "Francia",         away: "Alemania" },
    { date: "13-Jun-2026", home: "España",          away: "Marruecos" },
    { date: "14-Jun-2026", home: "Argentina",       away: "Sudáfrica" },
    { date: "14-Jun-2026", home: "Portugal",        away: "Corea del Sur" },
    { date: "15-Jun-2026", home: "Colombia",        away: "Ecuador" },
    { date: "15-Jun-2026", home: "Estados Unidos",  away: "Panamá" },
    { date: "16-Jun-2026", home: "Inglaterra",      away: "Uruguay" },
    { date: "16-Jun-2026", home: "Países Bajos",    away: "Japón" },
    { date: "17-Jun-2026", home: "Senegal",         away: "Costa de Marfil" },
    { date: "17-Jun-2026", home: "Alemania",        away: "Suiza" },
    { date: "18-Jun-2026", home: "Francia",         away: "Bélgica" },
    { date: "18-Jun-2026", home: "México",          away: "Haití" },
    { date: "19-Jun-2026", home: "Brasil",          away: "Colombia" },
    { date: "19-Jun-2026", home: "España",          away: "Túnez" },
    { date: "20-Jun-2026", home: "Argentina",       away: "Australia" },
    { date: "20-Jun-2026", home: "Croacia",         away: "Arabia Saudita" },
    { date: "21-Jun-2026", home: "Portugal",        away: "Austria" },
    { date: "21-Jun-2026", home: "Turquía",         away: "Qatar" },
    { date: "22-Jun-2026", home: "Estados Unidos",  away: "Ecuador" },
    { date: "22-Jun-2026", home: "Canadá",          away: "Panamá" },
    { date: "23-Jun-2026", home: "Inglaterra",      away: "Noruega" },
    { date: "23-Jun-2026", home: "Países Bajos",    away: "Escocia" },
    { date: "24-Jun-2026", home: "Japón",           away: "Corea del Sur" },
    { date: "24-Jun-2026", home: "Ghana",           away: "Argelia" },
];

// ── Firebase: escuchar cambios en tiempo real ──────────────────────────
function listenTournamentSettings() {
    onSnapshot(
        doc(db, "settings", "tournament"),
        (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                eliminatedTeams = data.eliminatedTeams || [];
                const champion  = data.champion || "";
                const select    = document.getElementById("championSelect");
                if (select) select.value = champion;
            }
            render();
        }
    );
}

function listenRanking() {
    const ref = collection(db, "ranking");
    onSnapshot(ref, (snapshot) => {
        const data = snapshot.docs.map(d => d.data());
        renderRankingFirestore(data);
    });
}

async function saveTournamentSettings() {
    const select = document.getElementById("championSelect");
    await setDoc(
        doc(db, "settings", "tournament"),
        {
            champion:       select ? select.value : "",
            eliminatedTeams: eliminatedTeams
        }
    );
}

// ── Render principal ───────────────────────────────────────────────────
function render() {
    // Resumen - contadores
    document.getElementById("totalPlayers").textContent  = participantsData.length;
    document.getElementById("aliveTeamsCount").textContent = allTeams.length - eliminatedTeams.length;

    // Ganador (basado en campeón seleccionado)
    const select   = document.getElementById("championSelect");
    const champion = select ? select.value : "";
    let winner = "-";
    if (champion) {
        participantsData.forEach(p => {
            if (p.teams.includes(champion)) winner = p.name;
        });
    }
    document.getElementById("winner").textContent = winner;

    renderParticipants();
    updateChart();
    updateRanking();
    renderMatches();
}

function renderParticipants() {
    const container = document.getElementById("participantsContainer");
    container.innerHTML = "";

    participantsData.forEach(player => {
        const div       = document.createElement("div");
        div.className   = "participant";

        const aliveCount = player.teams.filter(t => !eliminatedTeams.includes(t)).length;
        const statusClass = aliveCount > 0 ? "alive" : "dead";

        let html = `<h3>${player.name} <span class="${statusClass}">(${aliveCount} vivos)</span></h3>`;

        player.teams.forEach(team => {
            const elim = eliminatedTeams.includes(team);
            html += `
                <span class="team ${elim ? "eliminated" : ""}" 
                      style="cursor:pointer" 
                      onclick="toggleEliminated('${team}')" 
                      title="Click para eliminar/restaurar">
                    ${team}
                </span>`;
        });

        div.innerHTML = html;
        container.appendChild(div);
    });
}

// Permite eliminar/restaurar equipos con click (solo Admin)
window.toggleEliminated = function(team) {
    const idx = eliminatedTeams.indexOf(team);
    if (idx === -1) {
        eliminatedTeams.push(team);
    } else {
        eliminatedTeams.splice(idx, 1);
    }
    saveTournamentSettings();
};

// ── Ranking local (por equipos vivos) ─────────────────────────────────
function updateRanking() {
    const ranking = participantsData.map(player => ({
        name:  player.name,
        alive: player.teams.filter(t => !eliminatedTeams.includes(t)).length
    }));
    ranking.sort((a, b) => b.alive - a.alive);

    const container = document.getElementById("ranking");
    container.innerHTML = ranking.map((p, i) => `
        <div class="ranking-item" style="animation-delay:${i * 50}ms">
            <span class="pos">#${i + 1}</span>
            <span class="name">${p.name}</span>
            <span class="pts">${p.alive} equipos vivos</span>
        </div>
    `).join("");
}

// Ranking desde Firestore (si existe colección "ranking")
function renderRankingFirestore(data) {
    if (!data || data.length === 0) return; // cae al ranking local
    const container = document.getElementById("ranking");
    container.innerHTML = data
        .sort((a, b) => b.points - a.points)
        .map((p, i) => `
            <div class="ranking-item" style="animation-delay:${i * 50}ms">
                <span class="pos">#${i + 1}</span>
                <span class="name">${p.name}</span>
                <span class="pts">${p.points} pts</span>
            </div>
        `).join("");
}

// ── Gráfica ────────────────────────────────────────────────────────────
let chart;
function updateChart() {
    const labels = participantsData.map(p => p.name);
    const values = participantsData.map(player =>
        player.teams.filter(t => !eliminatedTeams.includes(t)).length
    );

    if (chart) chart.destroy();

    chart = new Chart(document.getElementById("probabilityChart"), {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "Equipos vivos",
                data: values,
                backgroundColor: values.map(v =>
                    v === 0 ? "#ef4444" : v === 1 ? "#f97316" : "#22c55e"
                )
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { labels: { color: "white" } }
            },
            scales: {
                x: { ticks: { color: "white" } },
                y: { ticks: { color: "white", stepSize: 1 }, beginAtZero: true }
            }
        }
    });
}

// ── Calendario ─────────────────────────────────────────────────────────
function renderMatches() {
    const container = document.getElementById("matchesContainer");
    container.innerHTML = "";

    // Agrupar por fecha
    const byDate = {};
    matches.forEach(m => {
        if (!byDate[m.date]) byDate[m.date] = [];
        byDate[m.date].push(m);
    });

    Object.entries(byDate).forEach(([date, games]) => {
        const dateHeader = document.createElement("h3");
        dateHeader.textContent = date;
        dateHeader.style.cssText = "margin-top:16px; color:#94a3b8; font-size:.9rem;";
        container.appendChild(dateHeader);

        games.forEach(match => {
            const homeElim = eliminatedTeams.includes(match.home);
            const awayElim = eliminatedTeams.includes(match.away);

            const div = document.createElement("div");
            div.className = "match-card";

            div.innerHTML = `
                <strong class="${homeElim ? "eliminated-text" : ""}">${match.home}</strong>
                <span style="margin:0 10px; opacity:.6">vs</span>
                <strong class="${awayElim ? "eliminated-text" : ""}">${match.away}</strong>
            `;
            container.appendChild(div);
        });
    });
}

// ── Selector de campeón ────────────────────────────────────────────────
function initChampionSelect() {
    const select = document.getElementById("championSelect");
    if (!select) return;
    select.style.display = "block";
    select.style.cssText = "display:block; margin:10px 0; padding:8px 12px; border-radius:8px; background:#1e293b; color:white; border:1px solid #334155;";

    allTeams.sort().forEach(team => {
        const option       = document.createElement("option");
        option.value       = team;
        option.textContent = team;
        select.appendChild(option);
    });

    select.addEventListener("change", () => saveTournamentSettings());
}

// ── Tabs ───────────────────────────────────────────────────────────────
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.getElementById(btn.dataset.tab).classList.add("active");
            btn.classList.add("active");
        });
    });
}

// ── Service Worker ─────────────────────────────────────────────────────
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

// ── Init ───────────────────────────────────────────────────────────────
initTabs();
initChampionSelect();
listenTournamentSettings();
listenRanking();
