// משתנה לשמירת הגרף
let myChart = null;

// קריאה ל-API כדי לקבל את רשימת הערים
fetch('https://data.gov.il/api/3/action/datastore_search?resource_id=929b50c6-f455-4be2-b438-ec6af01421f2&fields=%22שם%20ישוב%22&limit=32000')
    .then(response => response.json())
    .then(data => {
        console.log(data);
        
        if (data && data.result && data.result.records && data.result.records.length > 0) {
            // יצירת מערך של ערים ייחודיות
            const cities = [...new Set(data.result.records.map(record => record['שם ישוב'] || ''))];

            const citySelect = document.getElementById('city');
            citySelect.innerHTML = ''; // איפוס רשימת הערים לפני הוספה

            // הוספת ערים לשדה הבחירה
            cities.forEach(city => {
                const option = document.createElement('option');
                option.value = city;
                option.textContent = city;
                citySelect.appendChild(option);
            });
        }
    })
    .catch(error => {
        console.error('Error fetching city list:', error);
    });


document.getElementById('city').addEventListener('change', function () {
    const city = this.value;
    const partiesDiv = document.getElementById('parties');
    partiesDiv.innerHTML = ''; // איפוס התצוגה לפני בקשה חדשה

    // אם קיים גרף קודם, נמחק אותו
    if (myChart) {
        myChart.destroy(); 
    }

    const storedData = localStorage.getItem(city);
    if (storedData) {
        // אם יש נתונים מקומיים, נטען אותם
        renderParties(JSON.parse(storedData));
    } else {
        // קריאת API עם שאילתא לעיר שנבחרה
        fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=929b50c6-f455-4be2-b438-ec6af01421f2&q=${city}&limit=32000`)
            .then(response => response.json())
            .then(data => {
                if (data && data.result && data.result.records && data.result.records.length > 0) {
                    // שמירת הנתונים ב-localStorage עבור העיר
                    localStorage.setItem(city, JSON.stringify(data.result.records));

                    // קריאה לפונקציה שמציגה את המפלגות
                    renderParties(data.result.records);
                } else {
                    partiesDiv.textContent = 'service error ---';
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                partiesDiv.textContent = 'שגיאה בעת טעינת המידע.';
            });
    }
});

// פונקציה להצגת המפלגות והקולות
function renderParties(records) {
    const partiesDiv = document.getElementById('parties');
    const list = document.createElement('ul');
    const parties = {};

    // מעבר על כל הרשומות והוספת המפלגות עם קולות
    records.forEach(record => {
        const partyData = {};

        // מעבר על כל המפתחות של ה-record
        Object.keys(record).forEach(key => {
            // הוספת ערך למפלגה אם השם שלה לא ריק
            if (key.trim() !== "") {
                partyData[key] = record[key];
            }
        });

        // הוספת המפלגות ונתוני הקולות למערך
        for (let party in partyData) {
            const votes = parseInt(partyData[party]) || 0; // המרת הערך למספר
            if (votes > 0) { // הצגת המפלגות עם קולות
                if (!parties[party]) {
                    parties[party] = 0;
                }
                parties[party] += votes;
            }
        }
    });

    // יצירת רשימה עם המפלגות והקולות
    for (let party in parties) {
        const votes = parties[party];
        const listItem = document.createElement('li');
    }

    partiesDiv.innerHTML = ''; // איפוס התוכן הקודם
    partiesDiv.appendChild(list); // הוספת הרשימה לתצוגה

    // סינון המפלגות עם יותר מ-10 קולות
    const filteredParties = Object.entries(parties)
        .filter(([party, votes]) => votes > 10)  // רק המפלגות עם יותר מ-10 קולות
        .sort((a, b) => b[1] - a[1])  // סדר ירוד לפי כמות הקולות
        .slice(0, 7); // לבחור את 7 המפלגות הגדולות ביותר

    const labels = filteredParties.map(item => item[0]); // שמות המפלגות
    const dataForChart = filteredParties.map(item => item[1]); // כמות הקולות
    const s = document.getElementById('seven');
    s.innerHTML = 'שבע המפלגות הגבוהות ביותר';
    const r = document.getElementById('results');
    r.innerHTML = 'תוצאות הבחירות';

    // הגדרת הגרף ב-Chart.js
    const ctx = document.getElementById('myChart').getContext('2d');
    // יצירת גרף חדש
    myChart = new Chart(ctx, {
        type: 'bar', // גרף עמודות
        data: {
            labels: labels,
            datasets: [{
                label: 'קולות לכל מפלגה',
                data: dataForChart,
                backgroundColor: 'rgba(54, 162, 235, 0.2)', // צבע מילוי
                borderColor: 'rgba(54, 162, 235, 1)', // צבע קו הגבול
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
