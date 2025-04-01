document.addEventListener("DOMContentLoaded", () => {
    fetchListOfCity();
    const cityInput = document.getElementById("select_city_input");
    cityInput.addEventListener("input", (event) => {
        const cityName = event.target.value;
        if (cityName) {
            fetch7TopPartiesByCity(cityName);
        }
    });
});

function fetchListOfCity() {
    const citiesURL =
        "https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&q=&limit=32000";
    fetch(citiesURL)
        .then((response) => response.json())
        .then((data) => {
            const cities = data.result.records.map(city => city["שם_ישוב"]);
            const cityListElement = document.getElementById("city_list");
            cities.forEach(cityName => {
                const option = document.createElement("option");
                option.value = cityName;
                cityListElement.appendChild(option);
            });
        })
        .catch(error => console.error("Error fetching cities:", error));
}

function fetch7TopPartiesByCity(cityName) {
    const partiesURL = `https://data.gov.il/api/3/action/datastore_search?resource_id=929b50c6-f455-4be2-b438-ec6af01421f2&q={"שם ישוב":"${cityName}"}`;
    
    fetch(partiesURL)
        .then((response) => response.json())
        .then((data) => {
            const cityData = data.result.records[0];
            if (cityData) {
                const partyVotes = Object.entries(cityData)
                    .filter(([key]) => !["שם ישוב", "סמל ישוב", "בזב", "מצביעים", "פסולים", "כשרים", "_id"].includes(key))
                    .map(([party, votes]) => [party, Number(votes)])
                    .filter(([_, votes]) => votes > 10)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 7);

                const labels = partyVotes.map(item => item[0]);
                const dataValues = partyVotes.map(item => item[1]);

                document.getElementById("chartTitle").textContent = `תוצאות הבחירות ב-${cityName}`;
                
                // הצגת הגרף
                drawChart(labels, dataValues);
            }
        })
        .catch(error => console.error("Error fetching parties:", error));
}

function resetCanvas() {
    document.getElementById("canvasContainer").innerHTML = `
        <h1 id="chartTitle">תוצאות הבחירות</h1>
        <p id="loadingMessage">אנא המתן... נטען נתונים...</p>
        <canvas id="myChart" style="display:none;"></canvas>`;
}

function drawChart(labels, data) {
    resetCanvas();
    const ctx = document.getElementById("myChart");

    // הצגת הגרף והסתרת הודעת הטעינה
    document.getElementById("loadingMessage").style.display = "none";
    document.getElementById("myChart").style.display = "block";

    new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                label: "קולות לפי מפלגה",
                data,
                backgroundColor: "rgba(54, 162, 235, 0.5)",
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 1,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}
