// Global State
let currentPage = 'login';
let selectedClubId = null;
let currentLeaderboard = 'wins';

// Toast Notification System
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initializeStorage();
    checkAutoLogin();
});

// Check Auto Login
function checkAutoLogin() {
    const user = getCurrentUser();
    if (user) {
        if (user.isAdmin) {
            showAdminDashboard();
        } else {
            showPlayerDashboard();
        }
    } else {
        populateClubGrid();
    }
}

// Tab Switching
function showTab(tab) {
    const tabs = document.querySelectorAll('.tab-btn');
    const forms = document.querySelectorAll('.form-content');
    
    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));
    
    event.target.closest('.tab-btn').classList.add('active');
    
    if (tab === 'login') {
        document.getElementById('loginForm').classList.add('active');
    } else if (tab === 'register') {
        document.getElementById('registerForm').classList.add('active');
        populateClubGrid();
    } else if (tab === 'admin') {
        document.getElementById('adminForm').classList.add('active');
    }
}

// Populate Club Grid
function populateClubGrid() {
    const clubGrid = document.getElementById('clubGrid');
    if (!clubGrid) return;
    
    clubGrid.innerHTML = '';
    
    CLUBS.forEach(club => {
        const isTaken = isClubTaken(club.id);
        const isSelected = selectedClubId === club.id;
        
        const clubCard = document.createElement('div');
        clubCard.className = `club-card ${isTaken ? 'taken' : ''} ${isSelected ? 'selected' : ''}`;
        clubCard.onclick = () => !isTaken && selectClub(club.id);
        
        clubCard.innerHTML = `
            <img src="${club.logo}" alt="${club.name}" class="club-logo" 
                 onerror="this.style.display='none'">
            <p class="club-name">${club.name}</p>
            ${isTaken ? '<span class="taken-badge">TAKEN</span>' : ''}
        `;
        
        clubGrid.appendChild(clubCard);
    });
}

// Select Club
function selectClub(clubId) {
    selectedClubId = clubId;
    const club = getClubById(clubId);
    
    // Update grid
    populateClubGrid();
    
    // Show preview
    const preview = document.getElementById('selectedClubPreview');
    const previewLogo = document.getElementById('previewClubLogo');
    const previewName = document.getElementById('previewClubName');
    
    previewLogo.src = club.logo;
    previewLogo.onerror = () => previewLogo.style.display = 'none';
    previewName.textContent = club.name;
    preview.style.display = 'block';
}

// Clear Club Selection
function clearClubSelection() {
    selectedClubId = null;
    document.getElementById('selectedClubPreview').style.display = 'none';
    populateClubGrid();
}

// Player Registration
function playerRegister() {
    const name = document.getElementById('regName').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;
    const errorMsg = document.getElementById('regError');
    
    errorMsg.textContent = '';
    
    // Validation
    if (!name) {
        errorMsg.textContent = 'Please enter your full name';
        return;
    }
    
    if (name.length < 3) {
        errorMsg.textContent = 'Name must be at least 3 characters';
        return;
    }
    
    if (!password) {
        errorMsg.textContent = 'Please enter a password';
        return;
    }
    
    if (password.length < 4) {
        errorMsg.textContent = 'Password must be at least 4 characters';
        return;
    }
    
    if (password !== confirmPassword) {
        errorMsg.textContent = 'Passwords do not match';
        return;
    }
    
    if (!selectedClubId) {
        errorMsg.textContent = 'Please select a club';
        return;
    }
    
    // Check if name already exists
    const players = getPlayers();
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        errorMsg.textContent = 'This name is already taken';
        return;
    }
    
    // Check if club is taken
    if (isClubTaken(selectedClubId)) {
        errorMsg.textContent = 'This club was just taken, please select another';
        populateClubGrid();
        return;
    }
    
    // Get club info
    const club = getClubById(selectedClubId);
    
    // Create player
    const newPlayer = {
        id: generateId(),
        name: name,
        password: hashPassword(password),
        clubId: club.id,
        clubName: club.name,
        clubLogo: club.logo,
        isAdmin: false,
        tournaments: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        goals: 0,
        championships: 0,
        finalsReached: 0,
        createdAt: new Date().toISOString()
    };
    
    players.push(newPlayer);
    savePlayers(players);
    
    // Auto login
    const user = { ...newPlayer };
    delete user.password;
    saveCurrentUser(user);
    
    // Clear form
    selectedClubId = null;
    
    // Show toast and dashboard
    showToast(`Welcome ${name}! Your account has been created.`);
    showPlayerDashboard();
}

// Player Login
function playerLogin() {
    const name = document.getElementById('loginName').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    errorMsg.textContent = '';
    
    if (!name || !password) {
        errorMsg.textContent = 'Please enter name and password';
        return;
    }
    
    const players = getPlayers();
    const player = players.find(p => p.name.toLowerCase() === name.toLowerCase());
    
    if (!player) {
        errorMsg.textContent = 'Player not found';
        return;
    }
    
    if (!verifyPassword(password, player.password)) {
        errorMsg.textContent = 'Incorrect password';
        return;
    }
    
    // Login successful
    const user = { ...player };
    delete user.password;
    saveCurrentUser(user);
    
    showToast(`Welcome back, ${player.name}!`);
    
    if (player.isAdmin) {
        showAdminDashboard();
    } else {
        showPlayerDashboard();
    }
}

// Admin Login
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('adminError');
    
    errorMsg.textContent = '';
    
    if (!password) {
        errorMsg.textContent = 'Please enter admin password';
        return;
    }
    
    // Check password
    if (password !== ADMIN_PASSWORD) {
        errorMsg.textContent = 'Incorrect admin password';
        return;
    }
    
    // Check if admin already exists
    if (!adminExists()) {
        // First time admin setup
        const adminUser = {
            id: 'admin',
            name: 'Administrator',
            isAdmin: true,
            createdAt: new Date().toISOString()
        };
        
        setAdminExists(true);
        saveCurrentUser(adminUser);
    } else {
        // Admin already exists
        const adminUser = {
            id: 'admin',
            name: 'Administrator',
            isAdmin: true
        };
        saveCurrentUser(adminUser);
    }
    
    showToast('Admin access granted', 'success');
    showAdminDashboard();
}

// Logout
function logout() {
    saveCurrentUser(null);
    location.reload();
}

// Show Page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

// Show Player Section
function showPlayerSection(section) {
    const sections = document.querySelectorAll('.dashboard-section');
    const navBtns = document.querySelectorAll('.nav-btn');
    
    sections.forEach(s => s.classList.remove('active'));
    navBtns.forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${section}Section`).classList.add('active');
    document.getElementById(`nav${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.add('active');
    
    if (section === 'stats') {
        loadLeaderboards('wins');
    } else if (section === 'tournaments') {
        loadPlayerTournaments();
    }
}

// Show Player Dashboard
function showPlayerDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update profile
    const players = getPlayers();
    const currentPlayer = players.find(p => p.id === user.id);
    
    if (currentPlayer) {
        document.getElementById('playerProfileName').textContent = currentPlayer.name;
        document.getElementById('playerProfileClub').textContent = currentPlayer.clubName;
        document.getElementById('playerProfileLogo').src = currentPlayer.clubLogo;
        
        document.getElementById('profileTournaments').textContent = currentPlayer.tournaments || 0;
        document.getElementById('profileWins').textContent = currentPlayer.championships || 0;
        
        document.getElementById('matchesPlayed').textContent = currentPlayer.matchesPlayed || 0;
        document.getElementById('goalsScored').textContent = currentPlayer.goals || 0;
        document.getElementById('finalsReached').textContent = currentPlayer.finalsReached || 0;
        document.getElementById('championships').textContent = currentPlayer.championships || 0;
    }
    
    checkActiveTournament();
    showPage('playerDashboard');
    showPlayerSection('profile');
}

// Check Active Tournament
function checkActiveTournament() {
    const tournament = getActiveTournament();
    const banner = document.getElementById('tournamentBanner');
    const bannerInfo = document.getElementById('bannerInfo');
    const bannerBtn = document.getElementById('bannerRegisterBtn');
    const user = getCurrentUser();
    
    if (!tournament || !user || user.isAdmin) {
        banner.style.display = 'none';
        return;
    }
    
    if (tournament.status === 'registration') {
        const isRegistered = tournament.players.some(p => p.id === user.id);
        
        if (!isRegistered) {
            banner.style.display = 'block';
            bannerInfo.textContent = `${tournament.players.length}/${tournament.maxPlayers} players registered`;
            bannerBtn.style.display = 'block';
        } else {
            banner.style.display = 'block';
            bannerInfo.textContent = `You're registered! ${tournament.players.length}/${tournament.maxPlayers} players total`;
            bannerBtn.style.display = 'none';
        }
    } else {
        banner.style.display = 'none';
    }
}

// Register for Tournament
function registerForTournament() {
    const tournament = getActiveTournament();
    const user = getCurrentUser();
    
    if (!tournament || !user) return;
    
    if (tournament.players.length >= tournament.maxPlayers) {
        showToast('Tournament is full', 'error');
        return;
    }
    
    const players = getPlayers();
    const player = players.find(p => p.id === user.id);
    
    if (!player) return;
    
    tournament.players.push({
        id: player.id,
        name: player.name,
        clubId: player.clubId,
        clubName: player.clubName,
        clubLogo: player.clubLogo
    });
    
    saveActiveTournament(tournament);
    checkActiveTournament();
    showToast('Successfully registered for tournament!');
}

// Load Leaderboards
function loadLeaderboards(type) {
    currentLeaderboard = type;
    const players = getPlayers();
    const content = document.getElementById('leaderboardContent');
    
    // Remove active from all tabs
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Add active to current tab
    event?.target?.classList.add('active');
    
    let sortedPlayers = [...players];
    
    if (type === 'wins') {
        sortedPlayers.sort((a, b) => (b.wins || 0) - (a.wins || 0));
    } else if (type === 'goals') {
        sortedPlayers.sort((a, b) => (b.goals || 0) - (a.goals || 0));
    } else if (type === 'titles') {
        sortedPlayers.sort((a, b) => (b.championships || 0) - (a.championships || 0));
    }
    
    content.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Logo</th>
                    <th>Club</th>
                    <th>Player</th>
                    <th>Goals</th>
                    <th>Finals</th>
                    <th>Championships</th>
                </tr>
            </thead>
            <tbody>
                ${sortedPlayers.map((player, index) => `
                    <tr>
                        <td class="rank-cell">
                            ${index < 3 ? `<span class="medal medal-${index + 1}">${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>` : `<span class="rank-number">${index + 1}</span>`}
                        </td>
                        <td>
                            <img src="${player.clubLogo}" alt="${player.clubName}" class="table-club-logo" onerror="this.style.display='none'">
                        </td>
                        <td class="club-name-cell">${player.clubName}</td>
                        <td class="player-name-cell">${player.name}</td>
                        <td>${player.goals || 0}</td>
                        <td>${player.finalsReached || 0}</td>
                        <td class="highlight-cell">${player.championships || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load Player Tournaments
function loadPlayerTournaments() {
    const user = getCurrentUser();
    const tournaments = getTournaments();
    const activeTournament = getActiveTournament();
    const list = document.getElementById('tournamentsList');
    
    // Combine completed tournaments with active tournament if player is in it
    let allTournaments = [...tournaments];
    if (activeTournament && activeTournament.status === 'active' && 
        activeTournament.players.some(p => p.id === user.id)) {
        allTournaments.unshift(activeTournament);
    }
    
    const playerTournaments = allTournaments.filter(t => 
        t.players.some(p => p.id === user.id)
    );
    
    if (playerTournaments.length === 0) {
        list.innerHTML = '<p class="empty-state">No tournament history yet</p>';
        return;
    }
    
    list.innerHTML = playerTournaments.map(t => `
        <div class="tournament-card glass-card" onclick="showPlayerTournamentDetails('${t.id}')">
            <div class="tournament-card-header">
                <h3>${t.status === 'completed' ? '🏆' : '🎮'} Tournament #${t.id.slice(0, 6)}</h3>
                <span class="tournament-date">${new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="tournament-card-info">
                <p>Players: ${t.players.length}</p>
                <p>Status: ${t.status === 'completed' ? 'Completed' : t.status === 'active' ? 'In Progress' : 'Registration'}</p>
                ${t.winner ? `<p><strong>🏆 Winner: ${t.winner.name}</strong></p>` : ''}
            </div>
        </div>
    `).join('');
}

// Show Admin Dashboard
function showAdminDashboard() {
    const players = getPlayers();
    const tournaments = getTournaments();
    const activeTournament = getActiveTournament();
    
    // Update stats
    document.getElementById('adminTotalPlayers').textContent = players.length;
    document.getElementById('adminTotalTournaments').textContent = tournaments.length;
    
    let totalMatches = 0;
    tournaments.forEach(t => {
        if (t.matches) {
            totalMatches += t.matches.length;
        }
    });
    document.getElementById('adminTotalMatches').textContent = totalMatches;
    
    // Show active tournament if exists
    if (activeTournament) {
        showActiveTournamentPanel(activeTournament);
    } else {
        document.getElementById('activeTournamentPanel').style.display = 'none';
    }
    
    loadAdminLeaderboards();
    loadAdminHistory();
    loadPlayerManagement();
    
    showPage('adminDashboard');
}

// Load Player Management
function loadPlayerManagement() {
    const container = document.getElementById('playerManagement');
    if (!container) return;
    
    const players = getPlayers();
    
    container.innerHTML = `
        <div class="glass-card admin-section">
            <div class="section-header-admin">
                <h3>👥 Player Management</h3>
                <p class="section-subtitle">Total Players: ${players.length}</p>
            </div>
            
            <div class="players-table-container">
                <table class="stats-table admin-table">
                    <thead>
                        <tr>
                            <th>Logo</th>
                            <th>Club</th>
                            <th>Player Name</th>
                            <th>Matches</th>
                            <th>Finals</th>
                            <th>Championships</th>
                            <th>Joined</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${players.length === 0 ? '<tr><td colspan="8" class="empty-state">No players registered yet</td></tr>' : players.map(player => `
                            <tr>
                                <td>
                                    <img src="${player.clubLogo}" alt="${player.clubName}" class="table-club-logo" onerror="this.style.display='none'">
                                </td>
                                <td class="club-name-cell">${player.clubName}</td>
                                <td class="player-name-cell">${player.name}</td>
                                <td>${player.matchesPlayed || 0}</td>
                                <td>${player.finalsReached || 0}</td>
                                <td class="highlight-cell">${player.championships || 0}</td>
                                <td>${new Date(player.createdAt).toLocaleDateString()}</td>
                                <td>
                                    <button class="btn-icon-small" onclick="resetPlayerStats('${player.id}')" title="Reset Stats" style="margin-right: 8px;">
                                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                                            <path d="M4 10a6 6 0 1112 0M4 10V4m0 6h6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                    <button class="btn-delete-small" onclick="deletePlayer('${player.id}', '${player.name}')" title="Delete Player">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M2 4h12M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1m2 0v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4h8z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}


// Reset Player Stats - NEW FUNCTION
function resetPlayerStats(playerId) {
    if (!confirm('Reset all stats for this player to 0?')) return;
    
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    
    if (!player) return;
    
    player.tournaments = 0;
    player.matchesPlayed = 0;
    player.wins = 0;
    player.losses = 0;
    player.goals = 0;
    player.championships = 0;
    player.finalsReached = 0;
    
    savePlayers(players);
    showToast(`Stats reset for ${player.name}`);
    loadPlayerManagement();
    loadAdminLeaderboards();
}

// Delete Player Function
function deletePlayer(playerId, playerName) {
    if (!confirm(`Are you sure you want to delete ${playerName}?\n\nThis action cannot be undone and will:\n- Remove their account\n- Free up their club\n- Remove their tournament history`)) {
        return;
    }
    
    let players = getPlayers();
    players = players.filter(p => p.id !== playerId);
    savePlayers(players);
    
    // Also remove from active tournament if registered
    const activeTournament = getActiveTournament();
    if (activeTournament) {
        activeTournament.players = activeTournament.players.filter(p => p.id !== playerId);
        saveActiveTournament(activeTournament);
    }
    
    showToast(`${playerName} has been deleted`, 'success');
    loadPlayerManagement();
    loadAdminLeaderboards();
    
    // Update stats
    const tournaments = getTournaments();
    document.getElementById('adminTotalPlayers').textContent = players.length;
}

// Show Active Tournament Panel
function showActiveTournamentPanel(tournament) {
    const panel = document.getElementById('activeTournamentPanel');
    panel.style.display = 'block';
    
    const statusBadge = document.getElementById('tournamentStatusBadge');
    statusBadge.innerHTML = `
        <span class="status-badge status-${tournament.status}">
            ${tournament.status === 'registration' ? '📝 Registration' : 
              tournament.status === 'active' ? '🎮 Active' : '✅ Completed'}
        </span>
    `;
    
    const regStatus = document.getElementById('registrationStatus');
    regStatus.textContent = `${tournament.players.length}/${tournament.maxPlayers} players registered`;
    
    const startBtn = document.getElementById('startTournamentBtn');
    if (tournament.status === 'registration') {
        startBtn.style.display = tournament.players.length >= 4 ? 'block' : 'none';
        document.getElementById('matchManagement').style.display = 'none';
    } else if (tournament.status === 'active') {
        startBtn.style.display = 'none';
        document.getElementById('matchManagement').style.display = 'block';
        loadMatchManagement(tournament);
    }
    
    displayBracket(tournament);
}

// Create Tournament
function createTournament() {
    const size = parseInt(document.getElementById('tournamentSize').value);
    const type = document.getElementById('tournamentType').value;
    const errorMsg = document.getElementById('tournamentError');
    
    errorMsg.textContent = '';
    
    // Check if there's already an active tournament
    const activeTournament = getActiveTournament();
    if (activeTournament && activeTournament.status !== 'completed') {
        errorMsg.textContent = 'Please complete or delete the current tournament first';
        return;
    }
    
    // Create new tournament
    const tournament = {
        id: generateId(),
        maxPlayers: size,
        type: type,
        status: 'registration',
        players: [],
        matches: [],
        rounds: [],
        createdAt: new Date().toISOString()
    };
    
    saveActiveTournament(tournament);
    showToast('Tournament created! Waiting for players to register.');
    showAdminDashboard();
}

// Start Tournament
function startTournament() {
    const tournament = getActiveTournament();
    
    if (!tournament) return;
    
    if (tournament.players.length < 4) {
        showToast('Need at least 4 players to start', 'error');
        return;
    }
    
    // Create bracket
    tournament.status = 'active';
    createBracket(tournament);
    
    saveActiveTournament(tournament);
    showToast('Tournament started!');
    showAdminDashboard();
}

// Create Bracket
function createBracket(tournament) {
    const players = [...tournament.players];
    
    // Shuffle players
    for (let i = players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [players[i], players[j]] = [players[j], players[i]];
    }
    
    // Calculate rounds
    const numPlayers = players.length;
    const numRounds = Math.ceil(Math.log2(numPlayers));
    
    tournament.rounds = [];
    tournament.matches = [];
    
    // Create first round matches
    const firstRound = {
        roundNumber: 1,
        name: numPlayers === 4 ? 'Semi-Finals' : numPlayers === 8 ? 'Quarter-Finals' : 'Round 1',
        matches: []
    };
    
    for (let i = 0; i < players.length; i += 2) {
        const match = {
            id: generateId(),
            roundNumber: 1,
            player1: players[i],
            player2: players[i + 1] || null,
            score1: null,
            score2: null,
            winner: players[i + 1] ? null : players[i],
            completed: !players[i + 1]
        };
        
        firstRound.matches.push(match);
        tournament.matches.push(match);
    }
    
    tournament.rounds.push(firstRound);
    
    // Create subsequent rounds
    for (let r = 2; r <= numRounds; r++) {
        const round = {
            roundNumber: r,
            name: r === numRounds ? 'Final' : r === numRounds - 1 ? 'Semi-Finals' : `Round ${r}`,
            matches: []
        };
        
        const prevRound = tournament.rounds[r - 2];
        const numMatches = Math.ceil(prevRound.matches.length / 2);
        
        for (let i = 0; i < numMatches; i++) {
            const match = {
                id: generateId(),
                roundNumber: r,
                player1: null,
                player2: null,
                score1: null,
                score2: null,
                winner: null,
                completed: false
            };
            
            round.matches.push(match);
            tournament.matches.push(match);
        }
        
        tournament.rounds.push(round);
    }
}

// Load Match Management
function loadMatchManagement(tournament) {
    const matchesList = document.getElementById('matchesList');
    
    const currentRound = tournament.rounds.find(r => 
        r.matches.some(m => !m.completed && m.player1 && m.player2)
    );
    
    if (!currentRound) {
        matchesList.innerHTML = '<p class="empty-state">All matches completed!</p>';
        return;
    }
    
    matchesList.innerHTML = `
        <h4 class="round-title">${currentRound.name}</h4>
        ${currentRound.matches.map(match => {
            if (!match.player1 || !match.player2) return '';
            
            return `
                <div class="match-card ${match.completed ? 'match-completed' : ''}">
                    <div class="match-players">
                        <div class="match-player-item">
                            <img src="${match.player1.clubLogo}" alt="${match.player1.clubName}" class="match-player-logo">
                            <div class="match-player-details">
                                <span class="match-player-name">${match.player1.name}</span>
                                <span class="match-club-name">${match.player1.clubName}</span>
                            </div>
                        </div>
                        <span class="match-vs">VS</span>
                        <div class="match-player-item">
                            <img src="${match.player2.clubLogo}" alt="${match.player2.clubName}" class="match-player-logo">
                            <div class="match-player-details">
                                <span class="match-player-name">${match.player2.name}</span>
                                <span class="match-club-name">${match.player2.clubName}</span>
                            </div>
                        </div>
                    </div>
                    ${match.completed ? `
                        <div class="match-result-saved">
                            <div class="result-scores">
                                <div class="score-display ${match.score1 > match.score2 ? 'winner-score' : ''}">
                                    <span class="score-label">${match.player1.name}</span>
                                    <span class="score-value">${match.score1}</span>
                                </div>
                                <span class="score-separator">-</span>
                                <div class="score-display ${match.score2 > match.score1 ? 'winner-score' : ''}">
                                    <span class="score-label">${match.player2.name}</span>
                                    <span class="score-value">${match.score2}</span>
                                </div>
                            </div>
                            <div class="match-winner-info">
                                <p class="winner-badge-small">🏆 Winner: ${match.winner.name}</p>
                            </div>
                            <button onclick="editMatch('${match.id}')" class="btn-edit-score">
                                ✏️ Change Result
                            </button>
                        </div>
                    ` : `
                        <div class="match-score-input">
                            <div class="score-input-group">
                                <label>${match.player1.name}</label>
                                <input type="number" id="score1_${match.id}" min="0" placeholder="0" class="score-input">
                            </div>
                            <span style="font-size: 24px; color: var(--text-secondary);">-</span>
                            <div class="score-input-group">
                                <label>${match.player2.name}</label>
                                <input type="number" id="score2_${match.id}" min="0" placeholder="0" class="score-input">
                            </div>
                        </div>
                        <button onclick="submitMatchResult('${match.id}')" class="btn-submit-score">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                <path d="M16 6L8.5 13.5L4 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                            Submit Result
                        </button>
                    `}
                </div>
            `;
        }).join('')}
    `;
}

// Submit Match Result - FIXED VERSION
function submitMatchResult(matchId) {
    const tournament = getActiveTournament();
    const match = tournament.matches.find(m => m.id === matchId);
    
    // Prevent double submission
    if (match.completed) {
        showToast('Match already completed', 'error');
        return;
    }
    
    const score1 = parseInt(document.getElementById(`score1_${matchId}`).value);
    const score2 = parseInt(document.getElementById(`score2_${matchId}`).value);
    
    if (isNaN(score1) || isNaN(score2)) {
        showToast('Please enter valid scores', 'error');
        return;
    }
    
    if (score1 === score2) {
        showToast('Match cannot be a tie', 'error');
        return;
    }
    
    match.score1 = score1;
    match.score2 = score2;
    match.winner = score1 > score2 ? match.player1 : match.player2;
    match.completed = true;
    
    // Update player stats
    const players = getPlayers();
    const p1 = players.find(p => p.id === match.player1.id);
    const p2 = players.find(p => p.id === match.player2.id);
    
    if (p1) {
        p1.matchesPlayed = (p1.matchesPlayed || 0) + 1;
        p1.goals = (p1.goals || 0) + score1;
        if (match.winner.id === p1.id) {
            p1.wins = (p1.wins || 0) + 1;
        } else {
            p1.losses = (p1.losses || 0) + 1;
        }
    }
    
    if (p2) {
        p2.matchesPlayed = (p2.matchesPlayed || 0) + 1;
        p2.goals = (p2.goals || 0) + score2;
        if (match.winner.id === p2.id) {
            p2.wins = (p2.wins || 0) + 1;
        } else {
            p2.losses = (p2.losses || 0) + 1;
        }
    }
    
    savePlayers(players);
    
    // Advance winner to next round
    advanceWinner(tournament, match);
    
    // Check if round is complete
    const currentRound = tournament.rounds.find(r => r.roundNumber === match.roundNumber);
    const allCompleted = currentRound.matches.every(m => m.completed);
    
    if (allCompleted) {
        // Check if final
        if (match.roundNumber === tournament.rounds.length) {
            completeTournament(tournament, match.winner);
        }
    }
    
    saveActiveTournament(tournament);
    showToast('Match result recorded!');
    showAdminDashboard();
}

// Reset Match - NEW FUNCTION
function editMatch(matchId) {
    if (!confirm('Do you want to change this match result? This will reopen the score inputs.')) {
        return;
    }
    
    const tournament = getActiveTournament();
    const match = tournament.matches.find(m => m.id === matchId);
    
    if (!match || !match.completed) return;
    
    // Revert player stats
    const players = getPlayers();
    const p1 = players.find(p => p.id === match.player1.id);
    const p2 = players.find(p => p.id === match.player2.id);
    
    if (p1) {
        p1.matchesPlayed = Math.max(0, (p1.matchesPlayed || 0) - 1);
        p1.goals = Math.max(0, (p1.goals || 0) - (match.score1 || 0));
        if (match.winner?.id === p1.id) {
            p1.wins = Math.max(0, (p1.wins || 0) - 1);
        } else {
            p1.losses = Math.max(0, (p1.losses || 0) - 1);
        }
    }
    
    if (p2) {
        p2.matchesPlayed = Math.max(0, (p2.matchesPlayed || 0) - 1);
        p2.goals = Math.max(0, (p2.goals || 0) - (match.score2 || 0));
        if (match.winner?.id === p2.id) {
            p2.wins = Math.max(0, (p2.wins || 0) - 1);
        } else {
            p2.losses = Math.max(0, (p2.losses || 0) - 1);
        }
    }
    
    savePlayers(players);
    
    // Remove winner from next round
    const nextRound = tournament.rounds.find(r => r.roundNumber === match.roundNumber + 1);
    if (nextRound) {
        const currentRound = tournament.rounds.find(r => r.roundNumber === match.roundNumber);
        const matchIndex = currentRound.matches.indexOf(match);
        const nextMatchIndex = Math.floor(matchIndex / 2);
        const nextMatch = nextRound.matches[nextMatchIndex];
        
        if (matchIndex % 2 === 0) {
            nextMatch.player1 = null;
        } else {
            nextMatch.player2 = null;
        }
    }
    
    // Reset match
    match.score1 = null;
    match.score2 = null;
    match.winner = null;
    match.completed = false;
    
    saveActiveTournament(tournament);
    showToast('Match reopened for editing');
    showAdminDashboard();
}

// Advance Winner
function advanceWinner(tournament, match) {
    const nextRound = tournament.rounds.find(r => r.roundNumber === match.roundNumber + 1);
    
    if (!nextRound) return;
    
    const currentRound = tournament.rounds.find(r => r.roundNumber === match.roundNumber);
    const matchIndex = currentRound.matches.indexOf(match);
    const nextMatchIndex = Math.floor(matchIndex / 2);
    const nextMatch = nextRound.matches[nextMatchIndex];
    
    if (matchIndex % 2 === 0) {
        nextMatch.player1 = match.winner;
    } else {
        nextMatch.player2 = match.winner;
    }
    
    // FIXED: Check if it's the final AND both finalists are now set
    if (nextRound.roundNumber === tournament.rounds.length) {
        // Only increment finalsReached when BOTH players are determined for the final
        if (nextMatch.player1 && nextMatch.player2 && !nextMatch.finalsTracked) {
            const players = getPlayers();
            const p1 = players.find(p => p.id === nextMatch.player1.id);
            const p2 = players.find(p => p.id === nextMatch.player2.id);
            
            if (p1) p1.finalsReached = (p1.finalsReached || 0) + 1;
            if (p2) p2.finalsReached = (p2.finalsReached || 0) + 1;
            
            nextMatch.finalsTracked = true; // Mark to prevent double increment
            savePlayers(players);
        }
    }
}

// Complete Tournament
function completeTournament(tournament, winner) {
    tournament.status = 'completed';
    tournament.winner = winner;
    tournament.completedAt = new Date().toISOString();
    
    // Update winner stats
    const players = getPlayers();
    const winnerPlayer = players.find(p => p.id === winner.id);
    
    if (winnerPlayer) {
        winnerPlayer.championships = (winnerPlayer.championships || 0) + 1;
        winnerPlayer.tournaments = (winnerPlayer.tournaments || 0) + 1;
        savePlayers(players);
    }
    
    // Update all participants
    tournament.players.forEach(tp => {
        const player = players.find(p => p.id === tp.id);
        if (player && player.id !== winner.id) {
            player.tournaments = (player.tournaments || 0) + 1;
        }
    });
    savePlayers(players);
    
    // Save to history
    const tournaments = getTournaments();
    tournaments.push(tournament);
    saveTournaments(tournaments);
    
    saveActiveTournament(null);
    
    showToast(`🏆 ${winner.name} wins the tournament!`);
}

// Delete Tournament - ENHANCED WITH STATS CLEANUP
function deleteTournament() {
    if (!confirm('Delete this tournament? All match data from this tournament will be removed from player stats.')) {
        return;
    }
    
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    // Revert all stats from this tournament
    const players = getPlayers();
    
    tournament.matches.forEach(match => {
        if (!match.completed) return;
        
        const p1 = players.find(p => p.id === match.player1?.id);
        const p2 = players.find(p => p.id === match.player2?.id);
        
        if (p1) {
            p1.matchesPlayed = Math.max(0, (p1.matchesPlayed || 0) - 1);
            p1.goals = Math.max(0, (p1.goals || 0) - (match.score1 || 0));
            if (match.winner?.id === p1.id) {
                p1.wins = Math.max(0, (p1.wins || 0) - 1);
            } else {
                p1.losses = Math.max(0, (p1.losses || 0) - 1);
            }
        }
        
        if (p2) {
            p2.matchesPlayed = Math.max(0, (p2.matchesPlayed || 0) - 1);
            p2.goals = Math.max(0, (p2.goals || 0) - (match.score2 || 0));
            if (match.winner?.id === p2.id) {
                p2.wins = Math.max(0, (p2.wins || 0) - 1);
            } else {
                p2.losses = Math.max(0, (p2.losses || 0) - 1);
            }
        }
    });
    
    // Revert finals reached
    const finalMatch = tournament.matches.find(m => m.roundNumber === tournament.rounds?.length);
    if (finalMatch && finalMatch.finalsTracked) {
        const fp1 = players.find(p => p.id === finalMatch.player1?.id);
        const fp2 = players.find(p => p.id === finalMatch.player2?.id);
        
        if (fp1) fp1.finalsReached = Math.max(0, (fp1.finalsReached || 0) - 1);
        if (fp2) fp2.finalsReached = Math.max(0, (fp2.finalsReached || 0) - 1);
    }
    
    savePlayers(players);
    saveActiveTournament(null);
    showToast('Tournament deleted and stats reverted');
    showAdminDashboard();
}

// Display Bracket
function displayBracket(tournament) {
    const bracket = document.getElementById('adminBracket');
    
    if (!tournament.rounds || tournament.rounds.length === 0) {
        bracket.innerHTML = '';
        return;
    }
    
    bracket.innerHTML = tournament.rounds.map(round => `
        <div class="bracket-round">
            <h4>${round.name}</h4>
            <div class="bracket-matches">
                ${round.matches.map(match => {
                    if (!match.player1 && !match.player2) return '';
                    
                    return `
                        <div class="bracket-match ${match.completed ? 'completed' : ''}">
                            ${match.player1 ? `
                                <div class="match-player ${match.winner?.id === match.player1.id ? 'winner' : ''}">
                                    <div class="player-match-info">
                                        <img src="${match.player1.clubLogo}" class="player-match-avatar" onerror="this.style.display='none'">
                                        <span class="player-match-name">${match.player1.name}</span>
                                    </div>
                                    ${match.score1 !== null ? `<span class="player-score">${match.score1}</span>` : ''}
                                </div>
                            ` : '<div class="match-player">TBD</div>'}
                            
                            ${match.player2 ? `
                                <div class="match-player ${match.winner?.id === match.player2.id ? 'winner' : ''}">
                                    <div class="player-match-info">
                                        <img src="${match.player2.clubLogo}" class="player-match-avatar" onerror="this.style.display='none'">
                                        <span class="player-match-name">${match.player2.name}</span>
                                    </div>
                                    ${match.score2 !== null ? `<span class="player-score">${match.score2}</span>` : ''}
                                </div>
                            ` : '<div class="match-player">TBD</div>'}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `).join('');
}

// Load Admin Leaderboards
function loadAdminLeaderboards() {
    const container = document.getElementById('adminLeaderboards');
    const players = getPlayers();
    
    const topPlayers = [...players]
        .sort((a, b) => (b.championships || 0) - (a.championships || 0))
        .slice(0, 10);
    
    container.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Logo</th>
                    <th>Club</th>
                    <th>Player</th>
                    <th>Matches</th>
                    <th>Finals</th>
                    <th>Championships</th>
                </tr>
            </thead>
            <tbody>
                ${topPlayers.length === 0 ? '<tr><td colspan="7" class="empty-state">No players yet</td></tr>' : topPlayers.map((player, index) => `
                    <tr>
                        <td class="rank-cell">
                            ${index < 3 ? `<span class="medal medal-${index + 1}">${index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>` : `<span class="rank-number">${index + 1}</span>`}
                        </td>
                        <td>
                            <img src="${player.clubLogo}" alt="${player.clubName}" class="table-club-logo" onerror="this.style.display='none'">
                        </td>
                        <td class="club-name-cell">${player.clubName}</td>
                        <td class="player-name-cell">${player.name}</td>
                        <td>${player.goals || 0}</td>
                        <td>${player.finalsReached || 0}</td>
                        <td class="highlight-cell">${player.championships || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// Load Admin History
function loadAdminHistory() {
    const container = document.getElementById('adminHistory');
    const tournaments = getTournaments();
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No completed tournaments yet</p>';
        return;
    }
    
    container.innerHTML = tournaments.slice().reverse().map(t => `
        <div class="history-card glass-card-small" onclick="showTournamentDetails('${t.id}')">
            <div class="history-header">
                <h4>🏆 Tournament #${t.id.slice(0, 6)}</h4>
                <span class="history-date">${new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="history-info">
                <p><strong>Winner:</strong> ${t.winner?.name || 'Unknown'}</p>
                <p><strong>Players:</strong> ${t.players.length}</p>
                <p><strong>Matches:</strong> ${t.matches.length}</p>
            </div>
        </div>
    `).join('');
}

// Show Tournament Details (Admin View)
function showTournamentDetails(tournamentId) {
    const tournaments = getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    
    if (!tournament) return;
    
    const modal = document.getElementById('tournamentModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Tournament #${tournament.id.slice(0, 6)}`;
    
    modalBody.innerHTML = `
        <div class="tournament-details">
            <div class="detail-row">
                <span class="detail-label">Winner:</span>
                <span class="detail-value">${tournament.winner?.name || 'Unknown'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(tournament.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Players:</span>
                <span class="detail-value">${tournament.players.length}</span>
            </div>
        </div>
        
        <h4 style="margin: 24px 0 12px;">Bracket</h4>
        ${tournament.rounds ? tournament.rounds.map(round => `
            <div class="modal-round">
                <h5>${round.name}</h5>
                ${round.matches.map(match => {
                    if (!match.player1 && !match.player2) return '';
                    return `
                        <div class="modal-match">
                            <div>${match.player1?.name || 'TBD'} ${match.score1 !== null ? match.score1 : ''}</div>
                            <div>${match.player2?.name || 'TBD'} ${match.score2 !== null ? match.score2 : ''}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `).join('') : '<p>No bracket data available</p>'}
    `;
    
    modal.classList.add('active');
}

// Show Tournament Details (Player View) - NEW FUNCTION
function showPlayerTournamentDetails(tournamentId) {
    const user = getCurrentUser();
    const tournaments = getTournaments();
    const activeTournament = getActiveTournament();
    
    // Check both completed and active tournaments
    let tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament && activeTournament && activeTournament.id === tournamentId) {
        tournament = activeTournament;
    }
    
    if (!tournament) return;
    
    const modal = document.getElementById('tournamentModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    const isPlayerInTournament = tournament.players.some(p => p.id === user.id);
    
    modalTitle.textContent = `Tournament #${tournament.id.slice(0, 6)}`;
    
    let statusMessage = '';
    if (tournament.status === 'active') {
        statusMessage = '<div class="status-message status-active">🎮 Tournament in progress</div>';
    } else if (tournament.status === 'completed') {
        statusMessage = `<div class="status-message status-completed">🏆 Winner: <strong>${tournament.winner?.name}</strong></div>`;
    }
    
    modalBody.innerHTML = `
        ${statusMessage}
        
        <div class="tournament-details">
            <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">${tournament.status === 'completed' ? 'Completed' : tournament.status === 'active' ? 'In Progress' : 'Registration'}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${new Date(tournament.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Players:</span>
                <span class="detail-value">${tournament.players.length}</span>
            </div>
            ${tournament.status === 'completed' && tournament.winner ? `
                <div class="detail-row">
                    <span class="detail-label">Champion:</span>
                    <span class="detail-value">🏆 ${tournament.winner.name}</span>
                </div>
            ` : ''}
        </div>
        
        <h4 style="margin: 24px 0 12px;">Participants</h4>
        <div class="participants-grid">
            ${tournament.players.map(p => `
                <div class="participant-card ${p.id === user.id ? 'current-user' : ''} ${tournament.winner?.id === p.id ? 'tournament-winner' : ''}">
                    <img src="${p.clubLogo}" alt="${p.clubName}" class="participant-logo">
                    <div class="participant-info">
                        <div class="participant-name">${p.name}${p.id === user.id ? ' (You)' : ''}</div>
                        <div class="participant-club">${p.clubName}</div>
                    </div>
                    ${tournament.winner?.id === p.id ? '<div class="winner-badge">🏆 CHAMPION</div>' : ''}
                </div>
            `).join('')}
        </div>
        
        ${tournament.rounds && tournament.rounds.length > 0 ? `
            <h4 style="margin: 24px 0 12px;">Tournament Bracket</h4>
            ${tournament.rounds.map(round => `
                <div class="modal-round">
                    <h5>${round.name}</h5>
                    ${round.matches.map(match => {
                        if (!match.player1 && !match.player2) return '';
                        
                        const isUserInMatch = (match.player1?.id === user.id) || (match.player2?.id === user.id);
                        
                        return `
                            <div class="modal-match ${isUserInMatch ? 'user-match' : ''} ${match.completed ? 'completed' : ''}">
                                <div class="match-detail ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                                    <span>${match.player1?.name || 'TBD'}${match.player1?.id === user.id ? ' (You)' : ''}</span>
                                    ${match.score1 !== null ? `<strong>${match.score1}</strong>` : ''}
                                </div>
                                <div class="match-detail ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                                    <span>${match.player2?.name || 'TBD'}${match.player2?.id === user.id ? ' (You)' : ''}</span>
                                    ${match.score2 !== null ? `<strong>${match.score2}</strong>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('')}
        ` : '<p class="empty-state">Bracket not yet created</p>'}
    `;
    
    modal.classList.add('active');
}

// Close Modal
function closeModal() {
    document.getElementById('tournamentModal').classList.remove('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('tournamentModal');
    if (event.target === modal) {
        closeModal();
    }
}
