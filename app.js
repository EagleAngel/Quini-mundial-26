let eliminatedTeams =
JSON.parse(
localStorage.getItem("eliminatedTeams")
) || [];
const allTeams = [
...new Set(
participantsData.flatMap(
p => p.teams
)
)
];
const matches = [
{
    date:"11-Jun-2026",
    home:"México",
    away:"Canadá"
},
{
    date:"12-Jun-2026",
    home:"Brasil",
    away:"Japón"
},
{
    date:"13-Jun-2026",
    home:"Francia",
    away:"Alemania"
}
];
const select =
document.getElementById(
"championSelect"
);
allTeams.sort().forEach(team=>{
const option =
document.createElement("option");
option.value=team;
option.textContent=team;
select.appendChild(option);
});
function render(){

    document.getElementById(
        "totalPlayers"
    ).textContent =
    participantsData.length;

    document.getElementById(
        "aliveTeamsCount"
    ).textContent =
    allTeams.length -
    eliminatedTeams.length;

    const container =
    document.getElementById(
        "participantsContainer"
    );

    container.innerHTML = "";

    participantsData.forEach(player => {

        const div =
        document.createElement("div");

        div.className =
        "participant";

        let html =
        `<h3>${player.name}</h3>`;

        player.teams.forEach(team => {

            const eliminated =
            eliminatedTeams.includes(team);

            html += `
            <span
                class="team ${eliminated ? 'eliminated' : ''}"
                onclick="toggleTeam('${team}')">
                ${team}
            </span>`;

        });

        div.innerHTML = html;

        container.appendChild(div);

    });

    updateChart();

    updateRanking();
    
    renderMatches();

}


function updateWinner(){

const champion =
select.value;

let winner="-";

participantsData.forEach(p=>{

if(
p.teams.includes(champion)
)
winner=p.name;

});

document.getElementById(
"winner"
).textContent=winner;

}

select.addEventListener(
"change",
updateWinner
);

let chart;
function toggleTeam(team){

    if(eliminatedTeams.includes(team)){
        eliminatedTeams =
        eliminatedTeams.filter(
            t => t !== team
        );
    }else{
    eliminatedTeams.push(team);

    saveEliminatedTeam(team)
    }

saveTournamentSettings();
    );

    render();
}

function updateChart(){

const labels =
participantsData.map(
p=>p.name
);

const values =
participantsData.map(player => {

    return player.teams.filter(team =>
        !eliminatedTeams.includes(team)
    ).length;

});

if(chart)
chart.destroy();

chart =
new Chart(
document.getElementById(
"probabilityChart"
),
{
type:"bar",
data:{
labels,
datasets:[
  
{
label:
"Equipos asignados",
data:values
}
]
}
}
);

}

render();
function updateRanking(){

    const ranking =
    participantsData.map(player => {

        const aliveTeams =
        player.teams.filter(team =>
            !eliminatedTeams.includes(team)
        );

        return {
            name: player.name,
            alive: aliveTeams.length
        };

    });

    ranking.sort((a,b) =>
        b.alive - a.alive
    );

    const container =
    document.getElementById("ranking");

    container.innerHTML = "";

    ranking.forEach(player => {

        const div =
        document.createElement("div");

        div.className =
        "ranking-item";

        div.innerHTML =
        `${player.name} - ${player.alive} equipos vivos`;

        container.appendChild(div);

    });

}

async function testFirebase(){

    const snapshot =
    await firestoreGetDocs(
        firestoreCollection(
            db,
            "participants"
        )
    );

    snapshot.forEach(doc => {

        console.log(
            doc.id,
            doc.data()
        );

    });

    alert(
        "Consulta realizada. Revisa la consola."
    );

}
function renderMatches(){

    const container =
    document.getElementById(
        "matchesContainer"
    );

    container.innerHTML = "";

    matches.forEach(match => {

        const div =
        document.createElement("div");

        div.className =
        "match-card";

        div.innerHTML = `
            <div class="match-date">
                ${match.date}
            </div>

            <strong>
                ${match.home}
            </strong>

            vs

            <strong>
                ${match.away}
            </strong>
        `;

        container.appendChild(div);

    });

}
async function saveEliminatedTeam(team){

    await firestoreSetDoc(

        firestoreDoc(
            db,
            "eliminatedTeams",
            team
        ),

        {
            name: team
        }

    );

}
async function loadTournamentSettings(){

    const snapshot =
    await firestoreGetDoc(
        firestoreDoc(
            db,
            "settings",
            "tournament"
        )
    );

    if(snapshot.exists()){

        const data =
        snapshot.data();

        eliminatedTeams =
        data.eliminatedTeams || [];

       loadTournamentSettings();

    }

}
async function saveTournamentSettings(){

    await firestoreSetDoc(
        firestoreDoc(
            db,
            "settings",
            "tournament"
        ),
        {
            champion: select.value || "",
            eliminatedTeams: eliminatedTeams
        }
    );

}
