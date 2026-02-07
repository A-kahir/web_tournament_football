// Global State
let currentPage = 'login';
let selectedClubId = null;
let currentLeaderboard = 'championships';

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
    
    const players = getPlayers();
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        errorMsg.textContent = 'This name is already taken';
        return;
    }
    
    if (isClubTaken(selectedClubId)) {
        errorMsg.textContent = 'This club was just taken, please select another';
        populateClubGrid();
        return;
    }
    
    const club = getClubById(selectedClubId);
    
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
    
    const user = { ...newPlayer };
    delete user.password;
    saveCurrentUser(user);
    
    selectedClubId = null;
    
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
    
    if (password !== ADMIN_PASSWORD) {
        errorMsg.textContent = 'Incorrect admin password';
        return;
    }
    
    const adminUser = {
        id: 'admin',
        name: 'Administrator',
        isAdmin: true,
        createdAt: new Date().toISOString()
    };
    
    setAdminExists(true);
    saveCurrentUser(adminUser);
    
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
        loadLeaderboards();
    } else if (section === 'tournaments') {
        loadPlayerTournaments();
    }
}

// Show Player Dashboard
function showPlayerDashboard() {
    const user = getCurrentUser();
    if (!user) return;
    
    const players = getPlayers();
    const currentPlayer = players.find(p => p.id === user.id);
    
    if (currentPlayer) {
        document.getElementById('playerProfileName').textContent = currentPlayer.name;
        document.getElementById('playerProfileClub').textContent = currentPlayer.clubName;
        const profileLogo = document.getElementById('playerProfileLogo');
        profileLogo.src = currentPlayer.clubLogo;
        profileLogo.onerror = () => profileLogo.style.display = 'none';
        
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

// ───────────────────────────────────────────────
// TOURNAMENT RELATED FUNCTIONS
// ───────────────────────────────────────────────

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
        
        banner.style.display = 'block';
        bannerInfo.textContent = isRegistered 
            ? `You're registered! ${tournament.players.length}/${tournament.maxPlayers} players total`
            : `${tournament.players.length}/${tournament.maxPlayers} players registered - New Tournament Available!`;
        bannerBtn.innerHTML = isRegistered ? '✕ Unregister' : 'Register Now';
        bannerBtn.onclick = isRegistered ? unregisterFromTournament : registerForTournament;
        bannerBtn.className = isRegistered ? 'btn-banner btn-unregister' : 'btn-banner';
        bannerBtn.style.display = 'block';
        
        if (!isRegistered) {
            showToast('New tournament available! Register now.', 'info');
        }
    } else {
        banner.style.display = 'none';
    }
}

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
    
    player.tournaments = (player.tournaments || 0) + 1;
    savePlayers(players);
    
    saveActiveTournament(tournament);
    checkActiveTournament();
    showToast('Successfully registered for tournament!');
}

function unregisterFromTournament() {
    if (!confirm('Are you sure you want to unregister?')) return;
    
    const tournament = getActiveTournament();
    const user = getCurrentUser();
    
    if (!tournament || !user) return;
    
    if (tournament.status !== 'registration') {
        showToast('Cannot unregister after start', 'error');
        return;
    }
    
    tournament.players = tournament.players.filter(p => p.id !== user.id);
    
    const players = getPlayers();
    const player = players.find(p => p.id === user.id);
    if (player) {
        player.tournaments = Math.max(0, (player.tournaments || 0) - 1);
        savePlayers(players);
    }
    
    saveActiveTournament(tournament);
    checkActiveTournament();
    showToast('Unregistered successfully');
}

// ───────────────────────────────────────────────
// LEADERBOARDS & PLAYER TOURNAMENTS
// ───────────────────────────────────────────────

function loadLeaderboards() {
    const container = document.getElementById('leaderboardContent');
    const players = getPlayers().filter(p => !p.isAdmin);
    
    const sortedPlayers = [...players].sort((a, b) => {
        if ((b.championships || 0) !== (a.championships || 0)) {
            return (b.championships || 0) - (a.championships || 0);
        } else if ((b.finalsReached || 0) !== (a.finalsReached || 0)) {
            return (b.finalsReached || 0) - (a.finalsReached || 0);
        } else {
            return (b.goals || 0) - (a.goals || 0);
        }
    });
    
    container.innerHTML = `
        <table class="leaderboard-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Logo</th>
                    <th>Player</th>
                    <th>Club</th>
                    <th>Championships</th>
                    <th>Finals</th>
                    <th>Total Goals</th>
                </tr>
            </thead>
            <tbody>
                ${sortedPlayers.map((p, i) => `
                    <tr>
                        <td>${i + 1}</td>
                        <td><img src="${p.clubLogo}" class="table-club-logo" onerror="this.style.display='none'"></td>
                        <td>${p.name}</td>
                        <td>${p.clubName}</td>
                        <td>${p.championships || 0}</td>
                        <td>${p.finalsReached || 0}</td>
                        <td>${p.goals || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadPlayerTournaments() {
    const container = document.getElementById('tournamentsList');
    const user = getCurrentUser();
    const tournaments = getTournaments();
    const active = getActiveTournament();
    
    let allTournaments = [...tournaments];
    if (active && active.players.some(p => p.id === user.id)) {
        allTournaments.unshift(active);
    }
    
    if (allTournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments yet</p>';
        return;
    }
    
    container.innerHTML = allTournaments.map(t => `
        <div class="tournament-card glass-card ${t.status === 'completed' ? 'completed-tournament' : ''}" onclick="showPlayerTournamentDetails('${t.id}')">
            <div class="tournament-header">
                <h4>Tournament #${t.id.slice(0,6)}</h4>
                <span class="tournament-date">${new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="tournament-info">
                <p>Players: ${t.players.length}</p>
                ${t.status === 'completed' ? `<p class="winner">Champion: ${t.winner?.name || 'TBD'}</p>` : ''}
                <p>Status: ${t.status === 'registration' ? 'Open' : t.status === 'active' ? 'In Progress' : 'Completed'}</p>
            </div>
        </div>
    `).join('');
}

// ───────────────────────────────────────────────
// ADMIN DASHBOARD & TOURNAMENT MANAGEMENT
// ───────────────────────────────────────────────

function showAdminDashboard() {
    showPage('adminDashboard');
    loadAdminCurrentTournamentSummary();
    loadAdminStats();
    loadPlayerManagement();
    loadActiveTournament();
    loadAdminLeaderboards();
    loadAdminHistory();
}

function loadAdminCurrentTournamentSummary() {
    const container = document.querySelector('.admin-wrapper'); // Assuming at top
    const tournament = getActiveTournament();
    
    if (!tournament) return;
    
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'glass-card admin-section';
    summaryDiv.innerHTML = `
        <div class="section-header-admin">
            <h3>Current Tournament Summary</h3>
        </div>
        <table class="players-table">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Club</th>
                    <th>Matches</th>
                    <th>Goals</th>
                    <th>Wins</th>
                </tr>
            </thead>
            <tbody>
                ${tournament.players.map(p => {
                    const player = getPlayers().find(pl => pl.id === p.id);
                    return `
                        <tr>
                            <td>${p.name}</td>
                            <td>${p.clubName}</td>
                            <td>${player?.matchesPlayed || 0}</td>
                            <td>${player?.goals || 0}</td>
                            <td>${player?.wins || 0}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
        <div class="actions">
            <button class="btn-icon" onclick="resetCurrentTournamentStats()"><svg>...</svg> Reset Stats</button>
            <button class="btn-icon" onclick="deleteTournament()"><svg>...</svg> Delete</button>
        </div>
    `;
    container.insertBefore(summaryDiv, container.firstChild);
}

function resetCurrentTournamentStats() {
    if (!confirm('Reset stats for current tournament?')) return;
    
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const players = getPlayers();
    
    tournament.matches.forEach(match => revertMatchStats(match, players, tournament));
    
    tournament.matches.forEach(m => {
        m.completed = false;
        m.score1 = null;
        m.score2 = null;
        m.penalties1 = null;
        m.penalties2 = null;
        m.winner = null;
        m.finalsTracked = false;
    });
    
    tournament.status = 'registration';
    tournament.currentRound = 1;
    tournament.rounds = [];
    tournament.winner = null;
    
    savePlayers(players);
    saveActiveTournament(tournament);
    showToast('Current tournament stats reset');
    showAdminDashboard();
}

function loadAdminStats() {
    const players = getPlayers();
    const tournaments = getTournaments();
    
    document.getElementById('adminTotalTournaments').textContent = tournaments.length;
    document.getElementById('adminTotalPlayers').textContent = players.length;
    document.getElementById('adminTotalMatches').textContent = 
        tournaments.reduce((sum, t) => sum + (t.matches?.length || 0), 0);
}

function loadPlayerManagement() {
    const container = document.getElementById('playerManagement');
    const players = getPlayers().filter(p => !p.isAdmin);
    
    if (players.length === 0) {
        container.innerHTML = '<p class="empty-state">No players registered yet</p>';
        return;
    }
    
    container.innerHTML = `
        <div class="glass-card admin-section">
            <div class="section-header-admin">
                <h3>👥 Player Management</h3>
            </div>
            <table class="players-table">
                <thead>
                    <tr>
                        <th>Club</th>
                        <th>Name</th>
                        <th>Club</th>
                        <th>Matches</th>
                        <th>Goals</th>
                        <th>Wins</th>
                        <th>Titles</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${players.map(p => `
                        <tr>
                            <td><img src="${p.clubLogo}" class="table-club-logo" onerror="this.style.display='none'"></td>
                            <td>${p.name}</td>
                            <td>${p.clubName}</td>
                            <td>${p.matchesPlayed || 0}</td>
                            <td>${p.goals || 0}</td>
                            <td>${p.wins || 0}</td>
                            <td class="highlight-cell">${p.championships || 0}</td>
                            <td>
                                <button onclick="resetPlayerStats('${p.id}')">Reset Stats</button>
                                <button onclick="removePlayerClub('${p.id}')">Remove Club</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function resetPlayerStats(playerId) {
    if (!confirm('Reset player stats? This cannot be undone.')) return;
    
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.matchesPlayed = 0;
        player.goals = 0;
        player.wins = 0;
        player.losses = 0;
        player.championships = 0;
        player.finalsReached = 0;
        player.tournaments = 0;
        savePlayers(players);
        showToast('Player stats reset');
        loadPlayerManagement();
    }
}

function removePlayerClub(playerId) {
    if (!confirm('Remove player club? They can re-register.')) return;
    
    const players = getPlayers();
    const player = players.find(p => p.id === playerId);
    if (player) {
        player.clubId = null;
        player.clubName = '';
        player.clubLogo = '';
        savePlayers(players);
        showToast('Club removed');
        loadPlayerManagement();
    }
}

function createTournament() {
    const size = parseInt(document.getElementById('tournamentSize').value);
    const type = document.getElementById('tournamentType').value;
    const error = document.getElementById('tournamentError');
    
    if (getActiveTournament()) {
        error.textContent = 'There is already an active tournament';
        return;
    }
    
    const players = getPlayers().filter(p => !p.isAdmin);
    if (players.length < size) {
        error.textContent = `Not enough players (${players.length}/${size})`;
        return;
    }
    
    const tournament = {
        id: generateId(),
        maxPlayers: size,
        type: type,
        status: 'registration',
        players: [],
        matches: [],
        rounds: [],
        currentRound: 1,
        createdAt: new Date().toISOString()
    };
    
    saveActiveTournament(tournament);
    showToast(`New tournament created! Players can now register.`);
    showAdminDashboard();
}

function loadActiveTournament() {
    const tournament = getActiveTournament();
    const panel = document.getElementById('activeTournamentPanel');
    
    if (!tournament) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    
    document.getElementById('registrationStatus').textContent = 
        tournament.status === 'registration' 
            ? `Registration open: ${tournament.players.length}/${tournament.maxPlayers} players`
            : tournament.status === 'active'
                ? `Tournament in progress - Round ${tournament.currentRound || 1}`
                : 'Tournament completed';
    
    document.getElementById('startTournamentBtn').style.display = 
        tournament.status === 'registration' ? 'inline-block' : 'none';
    
    document.getElementById('matchManagement').style.display = 
        tournament.status === 'active' ? 'block' : 'none';
    
    if (tournament.status === 'active') {
        loadMatchManagement();
        displayBracket(tournament);
    }
}

function startTournament() {
    const tournament = getActiveTournament();
    if (!tournament || tournament.status !== 'registration') return;
    
    if (tournament.players.length < tournament.maxPlayers) {
        if (!confirm(`Start with ${tournament.players.length} players? (Less than max ${tournament.maxPlayers})`)) return;
    }
    
    if (tournament.players.length < 2) {
        showToast('Need at least 2 players', 'error');
        return;
    }
    
    tournament.status = 'active';
    
    const shuffled = [...tournament.players].sort(() => Math.random() - 0.5);
    const matches = [];
    
    for (let i = 0; i < shuffled.length; i += 2) {
        if (i + 1 < shuffled.length) {
            matches.push({
                id: generateId(),
                roundNumber: 1,
                player1: shuffled[i],
                player2: shuffled[i + 1],
                score1: null,
                score2: null,
                penalties1: null,
                penalties2: null,
                winner: null,
                completed: false,
                finalsTracked: false
            });
        } else {
            // Bye for odd number
            matches.push({
                id: generateId(),
                roundNumber: 1,
                player1: shuffled[i],
                player2: null,
                score1: null,
                score2: null,
                winner: shuffled[i],
                completed: true
            });
        }
    }
    
    tournament.matches = matches;
    tournament.rounds = [{ name: 'Round 1', matches }];
    tournament.currentRound = 1;
    
    saveActiveTournament(tournament);
    showToast('Tournament started!');
    loadActiveTournament();
}

function advanceTournament() {
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const currentRound = tournament.currentRound;
    const roundMatches = tournament.matches.filter(m => m.roundNumber === currentRound);
    
    if (!roundMatches.every(m => m.completed)) return;
    
    const winners = roundMatches.map(m => m.winner);
    
    if (winners.length <= 1) {
        tournament.status = 'completed';
        tournament.winner = winners[0];
        
        saveActiveTournament(null);
        const tournaments = getTournaments();
        saveTournaments([...tournaments, tournament]);
        
        showToast(`Tournament completed! Champion: ${tournament.winner?.name || 'N/A'}`);
        showAdminDashboard();
        return;
    }
    
    const nextRound = currentRound + 1;
    const nextMatches = [];
    
    for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
            nextMatches.push({
                id: generateId(),
                roundNumber: nextRound,
                player1: winners[i],
                player2: winners[i + 1],
                score1: null,
                score2: null,
                penalties1: null,
                penalties2: null,
                winner: null,
                completed: false,
                finalsTracked: false
            });
        } else {
            // Bye
            nextMatches.push({
                id: generateId(),
                roundNumber: nextRound,
                player1: winners[i],
                player2: null,
                score1: null,
                score2: null,
                winner: winners[i],
                completed: true
            });
        }
    }
    
    tournament.matches.push(...nextMatches);
    tournament.rounds.push({ name: `Round ${nextRound}`, matches: nextMatches });
    tournament.currentRound = nextRound;
    
    saveActiveTournament(tournament);
    showToast(`Advanced to Round ${nextRound}`);
    loadActiveTournament();
}

function loadMatchManagement() {
    const container = document.getElementById('matchesList');
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const matches = tournament.matches.filter(m => m.roundNumber === tournament.currentRound);
    
    container.innerHTML = matches.map(match => `
        <div class="match-card glass-card" id="match_${match.id}">
            <div class="match-header">
                <span class="match-title">Match #${match.id.slice(0,6)}</span>
                <span class="match-round">Round ${match.roundNumber}</span>
            </div>
            <div class="match-players">
                <div class="match-player">
                    <img src="${match.player1?.clubLogo}" class="match-player-logo" onerror="this.style.display='none'">
                    <span class="match-player-name">${match.player1?.name || 'Bye'}</span>
                    <span class="match-club-name">${match.player1?.clubName || ''}</span>
                </div>
                <span class="match-vs">VS</span>
                <div class="match-player">
                    <img src="${match.player2?.clubLogo}" class="match-player-logo" onerror="this.style.display='none'">
                    <span class="match-player-name">${match.player2?.name || 'Bye'}</span>
                    <span class="match-club-name">${match.player2?.clubName || ''}</span>
                </div>
            </div>
            ${match.completed ? `
                <div class="match-result">
                    <span class="score-display">
                        ${match.score1 ?? '-'} - ${match.score2 ?? '-'}
                        ${match.penalties1 !== null ? ` (${match.penalties1}-${match.penalties2} pens)` : ''}
                    </span>
                    <span class="winner-name">Winner: ${match.winner.name}</span>
                    <button class="btn-edit-score" onclick="enableScoreEdit('${match.id}')">
                        Edit Score
                    </button>
                </div>
            ` : `
                <div class="match-score-input">
                    <div class="score-input-group">
                        <label>${match.player1?.name || 'Bye'}</label>
                        <input type="number" id="score1_${match.id}" value="0" min="0" class="score-input">
                    </div>
                    <div class="score-input-group">
                        <label>${match.player2?.name || 'Bye'}</label>
                        <input type="number" id="score2_${match.id}" value="0" min="0" class="score-input">
                    </div>
                </div>
                <button class="btn-submit-score" onclick="updateMatchScore('${match.id}')">
                    Submit Scores
                </button>
            `}
        </div>
    `).join('');
}

// Helper to revert stats for a match (used during edits)
function revertMatchStats(match, players, tournament) {
    const p1 = players.find(p => p.id === match.player1?.id);
    const p2 = players.find(p => p.id === match.player2?.id);
    
    if (p1 && p2 && match.completed && match.score1 !== null && match.score2 !== null) {
        // Revert common stats
        p1.matchesPlayed = Math.max(0, (p1.matchesPlayed || 0) - 1);
        p2.matchesPlayed = Math.max(0, (p2.matchesPlayed || 0) - 1);
        p1.goals = Math.max(0, (p1.goals || 0) - match.score1);
        p2.goals = Math.max(0, (p2.goals || 0) - match.score2);
        
        // Revert win/loss
        if (match.winner?.id === p1.id) {
            p1.wins = Math.max(0, (p1.wins || 0) - 1);
            p2.losses = Math.max(0, (p2.losses || 0) - 1);
        } else if (match.winner?.id === p2.id) {
            p2.wins = Math.max(0, (p2.wins || 0) - 1);
            p1.losses = Math.max(0, (p1.losses || 0) - 1);
        }
        
        // If final match, revert finals/championships
        const isFinal = match.roundNumber === tournament.rounds?.length;
        if (isFinal) {
            p1.finalsReached = Math.max(0, (p1.finalsReached || 0) - 1);
            p2.finalsReached = Math.max(0, (p2.finalsReached || 0) - 1);
            if (match.winner?.id === p1.id) {
                p1.championships = Math.max(0, (p1.championships || 0) - 1);
            } else if (match.winner?.id === p2.id) {
                p2.championships = Math.max(0, (p2.championships || 0) - 1);
            }
        }
    }
}

function updateMatchScore(matchId) {
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const score1Input = document.getElementById(`score1_${match.id}`);
    const score2Input = document.getElementById(`score2_${match.id}`);
    const submitBtn = document.querySelector(`button[onclick="updateMatchScore('${matchId}')"]`);
    
    if (!score1Input || !score2Input) return;
    
    if (submitBtn) submitBtn.disabled = true;
    
    const score1 = parseInt(score1Input.value);
    const score2 = parseInt(score2Input.value);
    
    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
        showToast('Invalid scores', 'error');
        if (submitBtn) submitBtn.disabled = false;
        return;
    }
    
    const players = getPlayers();
    
    if (match.completed) {
        revertMatchStats(match, players, tournament);
    }
    
    let winner = score1 > score2 ? match.player1 : match.player2;
    let penalties1 = null;
    let penalties2 = null;
    
    if (score1 === score2) {
        // Tiebreaker: Penalties
        penalties1 = parseInt(prompt(`${match.player1.name} penalty goals:`));
        penalties2 = parseInt(prompt(`${match.player2.name} penalty goals:`));
        
        if (isNaN(penalties1) || isNaN(penalties2) || penalties1 < 0 || penalties2 < 0 || penalties1 === penalties2) {
            showToast('Invalid penalties - must differ', 'error');
            if (submitBtn) submitBtn.disabled = false;
            return;
        }
        
        winner = penalties1 > penalties2 ? match.player1 : match.player2;
    }
    
    match.score1 = score1;
    match.score2 = score2;
    match.penalties1 = penalties1;
    match.penalties2 = penalties2;
    match.completed = true;
    match.winner = winner;
    
    const p1 = players.find(p => p.id === match.player1?.id);
    const p2 = players.find(p => p.id === match.player2?.id);
    
    if (p1 && p2) {
        p1.matchesPlayed = (p1.matchesPlayed || 0) + 1;
        p2.matchesPlayed = (p2.matchesPlayed || 0) + 1;
        p1.goals = (p1.goals || 0) + score1;
        p2.goals = (p2.goals || 0) + score2;
        
        if (match.winner.id === p1.id) {
            p1.wins = (p1.wins || 0) + 1;
            p2.losses = (p2.losses || 0) + 1;
        } else {
            p2.wins = (p2.wins || 0) + 1;
            p1.losses = (p1.losses || 0) + 1;
        }
        
        const isFinal = match.roundNumber === tournament.rounds?.length;
        if (isFinal && !match.finalsTracked) {
            p1.finalsReached = (p1.finalsReached || 0) + 1;
            p2.finalsReached = (p2.finalsReached || 0) + 1;
            const champ = match.winner.id === p1.id ? p1 : p2;
            champ.championships = (champ.championships || 0) + 1;
            match.finalsTracked = true;
        }
    }
    
    savePlayers(players);
    saveActiveTournament(tournament);
    
    const currentRoundMatches = tournament.matches.filter(m => m.roundNumber === tournament.currentRound);
    if (currentRoundMatches.every(m => m.completed)) {
        advanceTournament();
    }
    
    loadMatchManagement();
    displayBracket(tournament);
    showAdminDashboard();
    
    showToast('Match updated');
    
    if (submitBtn) submitBtn.disabled = false;
}

function enableScoreEdit(matchId) {
    const tournament = getActiveTournament();
    const match = tournament?.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const element = document.getElementById(`match_${matchId}`);
    if (!element) return;
    
    element.innerHTML = `
        <div class="match-header">
            <span class="match-title">Match #${match.id.slice(0,6)}</span>
            <span class="match-round">Round ${match.roundNumber}</span>
        </div>
        <div class="match-players">
            <div class="match-player">
                <img src="${match.player1.clubLogo}" class="match-player-logo" onerror="this.style.display='none'">
                <span class="match-player-name">${match.player1.name}</span>
                <span class="match-club-name">${match.player1.clubName}</span>
            </div>
            <span class="match-vs">VS</span>
            <div class="match-player">
                <img src="${match.player2.clubLogo}" class="match-player-logo" onerror="this.style.display='none'">
                <span class="match-player-name">${match.player2.name}</span>
                <span class="match-club-name">${match.player2.clubName}</span>
            </div>
        </div>
        <div class="match-score-input">
            <div class="score-input-group">
                <label>${match.player1.name}</label>
                <input type="number" id="score1_${match.id}" value="${match.score1 || 0}" min="0" class="score-input">
            </div>
            <div class="score-input-group">
                <label>${match.player2.name}</label>
                <input type="number" id="score2_${match.id}" value="${match.score2 || 0}" min="0" class="score-input">
            </div>
        </div>
        <button class="btn-submit-score" onclick="updateMatchScore('${match.id}')">
            Update Scores
        </button>
    `;
}

function deleteTournament() {
    if (!confirm('Delete tournament? Stats will be reverted.')) return;
    
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const players = getPlayers();
    
    tournament.matches.forEach(match => revertMatchStats(match, players, tournament));
    
    savePlayers(players);
    saveActiveTournament(null);
    
    showToast('Tournament deleted, stats reverted');
    showAdminDashboard();
}

function deleteOldTournament(tournamentId) {
    if (!confirm('Delete this old tournament? Stats will be reverted.')) return;
    
    const tournaments = getTournaments();
    const tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) return;
    
    const players = getPlayers();
    
    tournament.matches.forEach(match => revertMatchStats(match, players, tournament));
    
    savePlayers(players);
    saveTournaments(tournaments.filter(t => t.id !== tournamentId));
    
    showToast('Old tournament deleted, stats reverted');
    loadAdminHistory();
}

function displayBracket(tournament) {
    const container = document.getElementById('adminBracket');
    if (!tournament.rounds?.length) {
        container.innerHTML = '<p>Bracket not generated</p>';
        return;
    }
    
    container.innerHTML = tournament.rounds.map(round => `
        <div class="bracket-round">
            <h4>${round.name}</h4>
            ${round.matches.map(match => `
                <div class="bracket-match ${match.completed ? 'completed' : ''}">
                    <div class="match-player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                        <img src="${match.player1?.clubLogo}" class="player-logo">
                        ${match.player1 ? match.player1.name : 'TBD'} ${match.score1 !== null ? match.score1 : ''}
                        ${match.penalties1 !== null ? `(${match.penalties1} pens)` : ''}
                    </div>
                    <div class="match-vs">VS</div>
                    <div class="match-player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                        <img src="${match.player2?.clubLogo}" class="player-logo">
                        ${match.player2 ? match.player2.name : 'TBD'} ${match.score2 !== null ? match.score2 : ''}
                        ${match.penalties2 !== null ? `(${match.penalties2} pens)` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `).join('');
}

function loadAdminLeaderboards() {
    const container = document.getElementById('adminLeaderboards');
    const players = getPlayers().filter(p => !p.isAdmin);
    
    const sorted = [...players].sort((a, b) => {
        if ((b.championships || 0) !== (a.championships || 0)) return b.championships - a.championships;
        return b.finalsReached - a.finalsReached;
    }).slice(0, 10);
    
    container.innerHTML = `
        <table class="stats-table">
            <thead>
                <tr>
                    <th>Rank</th>
                    <th>Logo</th>
                    <th>Player</th>
                    <th>Club</th>
                    <th>Titles</th>
                    <th>Finals</th>
                    <th>Goals</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((p, i) => `
                    <tr>
                        <td>${i+1}</td>
                        <td><img src="${p.clubLogo}" class="table-club-logo"></td>
                        <td>${p.name}</td>
                        <td>${p.clubName}</td>
                        <td>${p.championships || 0}</td>
                        <td>${p.finalsReached || 0}</td>
                        <td>${p.goals || 0}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function loadAdminHistory() {
    const container = document.getElementById('adminHistory');
    const tournaments = getTournaments();
    
    container.innerHTML = tournaments.slice().reverse().map(t => `
        <div class="history-card glass-card-small" onclick="showTournamentDetails('${t.id}')">
            <div class="history-header">
                <h4>Tournament #${t.id.slice(0,6)}</h4>
                <span>${new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="history-info">
                <p>Champion: ${t.winner?.name || 'N/A'}</p>
                <p>Players: ${t.players.length}</p>
            </div>
            <button onclick="deleteOldTournament('${t.id}'); event.stopPropagation();">Delete</button>
        </div>
    `).join('') || '<p>No history</p>';
}

// ───────────────────────────────────────────────
// MODAL FUNCTIONS
// ───────────────────────────────────────────────

function showTournamentDetails(tournamentId) {
    const tournament = getTournaments().find(t => t.id === tournamentId) || getActiveTournament();
    if (!tournament) return;
    
    const modal = document.getElementById('tournamentModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = `Tournament #${tournament.id.slice(0,6)}`;
    
    body.innerHTML = `
        <div class="tournament-details">
            <p><strong>Status:</strong> ${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</p>
            <p><strong>Date:</strong> ${new Date(tournament.createdAt).toLocaleDateString()}</p>
            <p><strong>Players:</strong> ${tournament.players.length}</p>
            ${tournament.winner ? `<p><strong>Champion:</strong> ${t.winner.name}</p>` : ''}
        </div>
        
        <h4>Bracket Tree</h4>
        ${tournament.rounds?.map(round => `
            <div class="modal-round">
                <h5>${round.name}</h5>
                ${round.matches.map(match => `
                    <div class="modal-match">
                        <div class="${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                            <img src="${match.player1?.clubLogo}" class="player-logo">
                            ${match.player1?.name || 'TBD'} ${match.score1 !== null ? match.score1 : ''}
                            ${match.penalties1 !== null ? `(${match.penalties1} pens)` : ''}
                        </div>
                        <div class="match-vs">VS</div>
                        <div class="${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                            <img src="${match.player2?.clubLogo}" class="player-logo">
                            ${match.player2?.name || 'TBD'} ${match.score2 !== null ? match.score2 : ''}
                            ${match.penalties2 !== null ? `(${match.penalties2} pens)` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('') || '<p>No bracket</p>'}
    `;
    
    modal.classList.add('active');
}

function showPlayerTournamentDetails(tournamentId) {
    const user = getCurrentUser();
    const tournament = getTournaments().find(t => t.id === tournamentId) || getActiveTournament();
    if (!tournament) return;
    
    const modal = document.getElementById('tournamentModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = `Tournament #${tournament.id.slice(0,6)}`;
    
    body.innerHTML = `
        <div class="tournament-details">
            <p><strong>Status:</strong> ${tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}</p>
            <p><strong>Date:</strong> ${new Date(tournament.createdAt).toLocaleDateString()}</p>
            <p><strong>Players:</strong> ${tournament.players.length}</p>
            ${tournament.winner ? `<p><strong>Champion:</strong> ${t.winner.name}</p>` : ''}
        </div>
        
        <h4>Participants</h4>
        <div class="participants-grid">
            ${tournament.players.map(p => `
                <div class="participant-card ${p.id === user.id ? 'current-user' : ''} ${tournament.winner?.id === p.id ? 'tournament-winner' : ''}">
                    <img src="${p.clubLogo}" class="participant-logo">
                    <div class="participant-info">
                        <div class="participant-name">${p.name}${p.id === user.id ? ' (You)' : ''}</div>
                        <div class="participant-club">${p.clubName}</div>
                    </div>
                    ${tournament.winner?.id === p.id ? '<div class="winner-badge">CHAMPION</div>' : ''}
                </div>
            `).join('')}
        </div>
        
        <h4>Bracket Tree</h4>
        ${tournament.rounds?.map(round => `
            <div class="modal-round">
                <h5>${round.name}</h5>
                ${round.matches.map(match => `
                    <div class="modal-match ${ (match.player1?.id === user.id || match.player2?.id === user.id) ? 'user-match' : '' }">
                        <div class="${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                            <img src="${match.player1?.clubLogo}" class="player-logo">
                            ${match.player1?.name || 'TBD'} ${match.score1 !== null ? match.score1 : ''}
                            ${match.penalties1 !== null ? `(${match.penalties1} pens)` : ''}
                            ${match.player1?.id === user.id ? ' (You)' : ''}
                        </div>
                        <div class="match-vs">VS</div>
                        <div class="${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                            <img src="${match.player2?.clubLogo}" class="player-logo">
                            ${match.player2?.name || 'TBD'} ${match.score2 !== null ? match.score2 : ''}
                            ${match.penalties2 !== null ? `(${match.penalties2} pens)` : ''}
                            ${match.player2?.id === user.id ? ' (You)' : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('') || '<p>No bracket yet</p>'}
    `;
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('tournamentModal').classList.remove('active');
}

window.onclick = (event) => {
    const modal = document.getElementById('tournamentModal');
    if (event.target === modal) closeModal();
};