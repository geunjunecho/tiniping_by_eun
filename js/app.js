document.addEventListener('DOMContentLoaded', () => {
    let appData = { seasons: [], tinipings: [] };
    let filteredData = [];
    
    // State
    let currentSeasonId = 'all';
    let activeGrades = new Set(['로열', '일반', '레전드', '빌런']);
    let searchQuery = '';

    // DOM Elements
    const grid = document.getElementById('tinipingGrid');
    const seasonTabs = document.getElementById('seasonTabs');
    const searchInput = document.getElementById('searchInput');
    const gradeBtns = document.querySelectorAll('.grade-btn');
    const statsCounter = document.getElementById('statsCounter');
    
    const modal = document.getElementById('detailModal');
    const closeBtn = document.querySelector('.close-btn');

    // Create Background Particles
    createParticles();

    // Fetch Data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            appData = data;
            initApp();
        })
        .catch(err => {
            console.error("Error loading data:", err);
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">데이터를 불러오는데 실패했습니다.</p>';
        });

    function initApp() {
        renderSeasonTabs();
        applyFilters();
        
        // Event Listeners
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            applyFilters();
        });

        gradeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const grade = btn.dataset.grade;
                if (activeGrades.has(grade)) {
                    activeGrades.delete(grade);
                    btn.classList.remove('active');
                } else {
                    activeGrades.add(grade);
                    btn.classList.add('active');
                }
                applyFilters();
            });
        });

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    function createParticles() {
        const particlesContainer = document.getElementById('particles');
        const symbols = ['💖', '✨', '⭐', '🌸', '🎀'];
        const particleCount = 25;

        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.classList.add('particle');
            p.innerText = symbols[Math.floor(Math.random() * symbols.length)];
            
            // Randomize position, size, and animation duration
            p.style.left = `${Math.random() * 100}vw`;
            p.style.animationDuration = `${10 + Math.random() * 15}s`;
            p.style.animationDelay = `${Math.random() * 5}s`;
            p.style.fontSize = `${10 + Math.random() * 20}px`;
            
            particlesContainer.appendChild(p);
        }
    }

    function renderSeasonTabs() {
        seasonTabs.innerHTML = '';
        
        // All button
        const allBtn = document.createElement('button');
        allBtn.className = 'season-btn active';
        allBtn.innerText = '✨ 전체';
        allBtn.addEventListener('click', () => {
            document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
            allBtn.classList.add('active');
            currentSeasonId = 'all';
            applyFilters();
        });
        seasonTabs.appendChild(allBtn);

        // Season buttons
        appData.seasons.forEach(season => {
            const btn = document.createElement('button');
            btn.className = 'season-btn';
            btn.innerText = `${season.id}기: ${season.theme}`;
            btn.style.color = season.color;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                btn.style.backgroundColor = season.color;
                btn.style.color = 'white';
                
                // Reset others
                document.querySelectorAll('.season-btn:not(.active)').forEach(b => {
                    b.style.backgroundColor = 'rgba(255,255,255,0.6)';
                    if(b.innerText !== '✨ 전체'){
                        const idMatch = b.innerText.match(/^(\d+)기/);
                        if(idMatch) {
                            const sid = parseInt(idMatch[1]);
                            const sd = appData.seasons.find(s=>s.id === sid);
                            b.style.color = sd ? sd.color : '#666';
                        }
                    } else {
                        b.style.color = '#666';
                    }
                });

                currentSeasonId = season.id;
                applyFilters();
            });
            seasonTabs.appendChild(btn);
        });
    }

    function applyFilters() {
        filteredData = appData.tinipings.filter(tp => {
            // Season filter
            const matchSeason = currentSeasonId === 'all' || tp.season.includes(currentSeasonId);
            
            // Grade filter
            const matchGrade = activeGrades.has(tp.grade);
            
            // Search filter
            const matchSearch = tp.name.includes(searchQuery) || tp.nameEn.toLowerCase().includes(searchQuery);

            return matchSeason && matchGrade && matchSearch;
        });

        renderGrid();
        updateStats();
    }

    function renderGrid() {
        grid.innerHTML = '';
        
        if (filteredData.length === 0) {
            grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 2rem; color: #666;">조건에 맞는 티니핑이 없습니다 😢</p>';
            return;
        }

        filteredData.forEach((tp, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            card.style.setProperty('--card-color', tp.color);
            
            const firstChar = tp.name.charAt(0);
            
            // Grade icon
            let gradeIcon = '';
            if(tp.grade === '로열') gradeIcon = '👑';
            else if(tp.grade === '레전드') gradeIcon = '🌈';
            else if(tp.grade === '빌런') gradeIcon = '😈';
            
            // Get main season info
            const mainSeasonObj = appData.seasons.find(s => s.id === tp.mainSeason);
            const seasonBadgeStyle = mainSeasonObj ? `background-color: ${mainSeasonObj.color}` : 'background-color: #ccc';

            card.innerHTML = `
                <div class="avatar-container">
                    <img src="${tp.image}" class="avatar-img" alt="${tp.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div class="avatar-fallback" style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">${firstChar}</div>
                </div>
                <h3 class="tiniping-name">${tp.name}</h3>
                <p class="tiniping-name-en">${tp.nameEn}</p>
                <div class="badge-row">
                    <span class="badge grade-${tp.grade}">${gradeIcon} ${tp.grade}</span>
                    <span class="badge emotion">${tp.emotion}</span>
                    <span class="badge" style="${seasonBadgeStyle}">${tp.mainSeason}기</span>
                </div>
            `;

            // Staggered animation
            setTimeout(() => {
                card.classList.add('visible');
            }, index * 30);

            card.addEventListener('click', () => openModal(tp));
            grid.appendChild(card);
        });
    }

    function updateStats() {
        statsCounter.innerText = `총 ${filteredData.length}마리의 티니핑`;
    }

    function openModal(tp) {
        const firstChar = tp.name.charAt(0);
        const avatarContainer = document.getElementById('modalAvatar');
        
        avatarContainer.style.backgroundColor = tp.color;
        avatarContainer.innerHTML = `
            <img src="${tp.image}" alt="${tp.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
            <div class="avatar-fallback" style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">${firstChar}</div>
        `;

        document.getElementById('modalNameKo').innerText = tp.name;
        document.getElementById('modalNameKo').style.color = tp.color;
        document.getElementById('modalNameEn').innerText = tp.nameEn;
        
        let gradeIcon = '';
        if(tp.grade === '로열') gradeIcon = '👑';
        else if(tp.grade === '레전드') gradeIcon = '🌈';
        else if(tp.grade === '빌런') gradeIcon = '😈';

        const gradeBadge = document.getElementById('modalGrade');
        gradeBadge.className = `badge grade-${tp.grade}`;
        gradeBadge.innerText = `${gradeIcon} ${tp.grade}`;

        const emotionBadge = document.getElementById('modalEmotion');
        emotionBadge.className = 'badge emotion';
        emotionBadge.innerText = tp.emotion;

        const mainSeasonObj = appData.seasons.find(s => s.id === tp.mainSeason);
        const seasonBadge = document.getElementById('modalSeason');
        seasonBadge.className = 'badge';
        seasonBadge.style.backgroundColor = mainSeasonObj ? mainSeasonObj.color : '#ccc';
        seasonBadge.innerText = `${tp.mainSeason}기 ${mainSeasonObj ? mainSeasonObj.theme : ''}`;

        document.getElementById('modalDescription').innerText = tp.description;

        const genderIndicator = document.getElementById('modalGender');
        genderIndicator.className = `gender-indicator gender-${tp.gender}`;
        genderIndicator.innerText = tp.gender === '여' ? '♀ 여' : '♂ 남';

        modal.classList.add('show');
    }

    function closeModal() {
        modal.classList.remove('show');
    }
});
