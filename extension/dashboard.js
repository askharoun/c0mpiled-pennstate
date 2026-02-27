// dashboard.js

const processBtn = document.getElementById('processBtn');
const fileInput = document.getElementById('fileInput');
const resultsGrid = document.getElementById('resultsGrid');
const loader = document.getElementById('loader');
const statusUpdate = document.getElementById('statusUpdate');

processBtn.addEventListener('click', async () => {
    const file = fileInput.files[0];
    if (!file) {
        alert("Please select a syllabus file first!");
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    // Show loading state
    loader.classList.remove('hidden');
    resultsGrid.innerHTML = '';
    statusUpdate.innerText = "Analyzing content...";

    try {
        const response = await fetch('http://localhost:8000/process-syllabus', {
            method: 'POST',
            body: formData
        });

        const result = await response.json();
        
        // Gemini usually returns JSON inside a string; we need to parse it
        const rawData = JSON.parse(result.data.replace(/```json|```/g, ''));
        renderDashboard(rawData);
        
        statusUpdate.innerText = "Analysis Complete!";
    } catch (error) {
        console.error("Error:", error);
        statusUpdate.innerText = "Error: Backend not running.";
    } finally {
        loader.classList.add('hidden');
    }
});

function renderDashboard(data) {
    document.getElementById('courseTitle').innerText = data.course_name || "Syllabus Results";

    data.weeks.forEach(item => {
        const card = document.createElement('div');
        card.className = 'module-card';

        card.innerHTML = `
            <h3>${item.topic}</h3>
            <p><strong>Summary:</strong> ${item.summary}</p>
            
            <div class="resource-links">
                <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(item.youtube_query)}" target="_blank" class="yt-link">
                    📺 Watch Study Videos
                </a>
            </div>

            <div class="practice-area">
                <h4>Practice Problems</h4>
                <ul>
                    ${item.practice_problems.map(p => `<li>${p}</li>`).join('')}
                </ul>
            </div>
        `;
        resultsGrid.appendChild(card);
    });
}