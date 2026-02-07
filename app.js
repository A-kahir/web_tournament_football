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
    document.querySelectorAll('.tab-btn').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-content').forEach(f => f.classList.remove('active'));
    
    event.target.closest('.tab-btn').classList.add('active');
    
    if (tab === 'login') document.getElementById('loginForm').classList.add('active');
    if (tab === 'register') {
        document.getElementById('registerForm').classList.add('active');
        populateClubGrid();
    }
    if (tab === 'admin') document.getElementById('adminForm').classList.add('active');
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
    
    populateClubGrid();
    
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
    
    if (!name || name.length < 3) {
        errorMsg.textContent = name ? 'Name must be at least 3 characters' : 'Please enter your full name';
        return;
    }
    
    if (!password || password.length < 4) {
        errorMsg.textContent = password ? 'Password must be at least 4 characters' : 'Please enter a password';
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
        name,
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
    
    if (player.isAdmin) showAdminDashboard();
    else showPlayerDashboard();
}

// Admin Login
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    const errorMsg = document.getElementById('adminError');
    
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
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}

// Show Player Section
function showPlayerSection(section) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    document.getElementById(`${section}Section`).classList.add('active');
    document.getElementById(`nav${section.charAt(0).toUpperCase() + section.slice(1)}`).classList.add('active');
    
    if (section === 'stats') loadLeaderboards();
    if (section === 'tournaments') loadPlayerTournaments();
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
        const logo = document.getElementById('playerProfileLogo');
        logo.src = currentPlayer.clubLogo;
        logo.onerror = () => logo.style.display = 'none';
        
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
// TOURNAMENT FUNCTIONS
// ───────────────────────────────────────────────

function checkActiveTournament() {
    const tournament = getActiveTournament();
    const banner = document.getElementById('tournamentBanner');
    if (!tournament || getCurrentUser()?.isAdmin) {
        banner.style.display = 'none';
        return;
    }
    
    const isRegistered = tournament.players.some(p => p.id === getCurrentUser().id);
    
    banner.style.display = 'block';
    document.getElementById('bannerInfo').textContent = isRegistered
        ? `You're registered! ${tournament.players.length}/${tournament.maxPlayers}`
        : `New Tournament! ${tournament.players.length}/${tournament.maxPlayers} registered`;
    
    const btn = document.getElementById('bannerRegisterBtn');
    btn.innerHTML = isRegistered ? '✕ Unregister' : 'Register Now';
    btn.onclick = isRegistered ? unregisterFromTournament : registerForTournament;
    btn.className = isRegistered ? 'btn-banner btn-unregister' : 'btn-banner';
    
    if (!isRegistered) showToast('New tournament open! Join now.', 'info');
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
    showToast('Successfully registered!');
}

function unregisterFromTournament() {
    if (!confirm('Unregister from tournament?')) return;
    
    const tournament = getActiveTournament();
    const user = getCurrentUser();
    if (!tournament || !user || tournament.status !== 'registration') return;
    
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

function loadLeaderboards() {
    const container = document.getElementById('leaderboardContent');
    const players = getPlayers().filter(p => !p.isAdmin);
    
    if (players.length === 0) {
        container.innerHTML = '<p class="empty-state">No players yet</p>';
        return;
    }
    
    // Sort by: Championships (desc) → Matches Played (desc) → Goals (desc)
    const sorted = [...players].sort((a, b) => {
        const diffChamp = (b.championships || 0) - (a.championships || 0);
        if (diffChamp !== 0) return diffChamp;
        
        const diffMatches = (b.matchesPlayed || 0) - (a.matchesPlayed || 0);
        if (diffMatches !== 0) return diffMatches;
        
        return (b.goals || 0) - (a.goals || 0);
    });
    
    container.innerHTML = `
        <table class="leaderboard-table-unified">
            <thead>
                <tr>
                    <th class="rank-col">RANK</th>
                    <th class="logo-col">LOGO</th>
                    <th class="player-col">PLAYER</th>
                    <th class="club-col">CLUB</th>
                    <th class="stat-col">CHAMPIONSHIPS</th>
                    <th class="stat-col">FINALS PLAYED</th>
                    <th class="stat-col">TOTAL GOALS</th>
                </tr>
            </thead>
            <tbody>
                ${sorted.map((p, i) => {
                    const isTopThree = i < 3;
                    const rankDisplay = isTopThree ? ['🥇', '🥈', '🥉'][i] : (i + 1);
                    
                    return `
                        <tr class="${isTopThree ? 'top-rank' : ''}">
                            <td class="rank-cell">${rankDisplay}</td>
                            <td class="logo-cell">
                                <img src="${p.clubLogo}" class="table-club-logo" onerror="this.style.display='none'" alt="${p.clubName}">
                            </td>
                            <td class="player-cell">
                                <div class="player-name">${p.name}</div>
                                <div class="club-name">${p.clubName}</div>
                            </td>
                            <td class="club-name-cell">${p.clubName}</td>
                            <td class="stat-cell ${(p.championships || 0) > 0 ? 'highlight' : ''}">${p.championships || 0}</td>
                            <td class="stat-cell">${p.finalsReached || 0}</td>
                            <td class="stat-cell">${p.goals || 0}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function loadPlayerTournaments() {
    const container = document.getElementById('tournamentsList');
    const user = getCurrentUser();
    const tournaments = getTournaments();
    const active = getActiveTournament();
    
    let all = [...tournaments];
    if (active && active.players.some(p => p.id === user.id)) all.unshift(active);
    
    if (all.length === 0) {
        container.innerHTML = '<p class="empty-state">No tournaments yet</p>';
        return;
    }
    
    container.innerHTML = all.map(t => `
        <div class="tournament-card glass-card ${t.status==='completed'?'completed-tournament':''}" onclick="showPlayerTournamentDetails('${t.id}')">
            ${t.status==='completed' && t.winner ? `<img src="${t.winner.clubLogo}" class="champion-logo" alt="Champion">` : ''}
            <div class="tournament-header">
                <h4>Tournament #${t.id.slice(0,6)}</h4>
                <span class="tournament-date">${new Date(t.createdAt).toLocaleDateString()}</span>
            </div>
            <div class="tournament-info">
                <p>Players: ${t.players.length}</p>
                ${t.status==='completed' ? `<p class="winner">Champion: ${t.winner?.name||'?'}</p>` : ''}
                <p>Status: ${t.status==='registration'?'Open':t.status==='active'?'In Progress':'Completed'}</p>
            </div>
        </div>
    `).join('');
}

// ───────────────────────────────────────────────
// ADMIN DASHBOARD & TOURNAMENT MANAGEMENT
// ───────────────────────────────────────────────

function showAdminDashboard() {
    showPage('adminDashboard');
    loadAdminStats();
    loadPlayerManagement();
    loadActiveTournament();
    loadAdminLeaderboards();
    loadAdminHistory();
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
                <h3>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="vertical-align: middle; margin-right: 8px;">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v2h8v-2zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 17v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z" fill="currentColor"/>
                    </svg>
                    Player Management
                </h3>
            </div>
            <div class="table-container">
                <table class="players-table-new">
                    <thead>
                        <tr>
                            <th>Logo</th>
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
                                <td class="logo-cell"><img src="${p.clubLogo}" class="table-club-logo" onerror="this.style.display='none'"></td>
                                <td class="player-name-cell">${p.name}</td>
                                <td class="club-name-cell">${p.clubName || '-'}</td>
                                <td class="stat-cell">${p.matchesPlayed || 0}</td>
                                <td class="stat-cell">${p.goals || 0}</td>
                                <td class="stat-cell">${p.wins || 0}</td>
                                <td class="stat-cell highlight-stat">${p.championships || 0}</td>
                                <td class="actions-cell">
                                    <button class="btn-icon-action btn-reset" onclick="resetPlayerStats('${p.id}')" title="Reset Stats">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M13.65 2.35A7.958 7.958 0 008 0C3.58 0 0 3.58 0 8s3.58 8 8 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L9 7h7V0l-2.35 2.35z" fill="currentColor"/>
                                        </svg>
                                    </button>
                                    <button class="btn-icon-action btn-remove" onclick="removePlayerClub('${p.id}')" title="Remove Club">
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" fill="currentColor"/>
                                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" fill="currentColor"/>
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

// Helper to revert stats when editing a completed match
function revertMatchStats(match, players, tournament) {
    const p1 = players.find(p => p.id === match.player1?.id);
    const p2 = players.find(p => p.id === match.player2?.id);
    
    if (!p1 || !p2 || !match.completed || match.score1 === null || match.score2 === null) {
        return;
    }
    
    p1.matchesPlayed = Math.max(0, (p1.matchesPlayed || 0) - 1);
    p2.matchesPlayed = Math.max(0, (p2.matchesPlayed || 0) - 1);
    p1.goals = Math.max(0, (p1.goals || 0) - match.score1);
    p2.goals = Math.max(0, (p2.goals || 0) - match.score2);
    
    if (match.winner?.id === p1.id) {
        p1.wins = Math.max(0, (p1.wins || 0) - 1);
        p2.losses = Math.max(0, (p2.losses || 0) - 1);
    } else if (match.winner?.id === p2.id) {
        p2.wins = Math.max(0, (p2.wins || 0) - 1);
        p1.losses = Math.max(0, (p1.losses || 0) - 1);
    }
    
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

function updateMatchScore(matchId) {
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;
    
    const score1Input = document.getElementById(`score1_${match.id}`);
    const score2Input = document.getElementById(`score2_${match.id}`);
    
    if (!score1Input || !score2Input) return;
    
    const score1 = parseInt(score1Input.value);
    const score2 = parseInt(score2Input.value);
    
    if (isNaN(score1) || isNaN(score2) || score1 < 0 || score2 < 0) {
        showToast('Please enter valid non-negative numbers', 'error');
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
        penalties1 = parseInt(prompt(`${match.player1.name} penalty goals:`));
        penalties2 = parseInt(prompt(`${match.player2.name} penalty goals:`));
        
        if (isNaN(penalties1) || isNaN(penalties2) || penalties1 < 0 || penalties2 < 0 || penalties1 === penalties2) {
            showToast('Invalid penalty input - match not saved', 'error');
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
    
    showToast(`Match result saved${penalties1 !== null ? ' (via penalties)' : ''}`);
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
                <input type="number" id="score1_${match.id}" value="${match.score1 ?? 0}" min="0" class="score-input">
            </div>
            <div class="score-input-group">
                <label>${match.player2.name}</label>
                <input type="number" id="score2_${match.id}" value="${match.score2 ?? 0}" min="0" class="score-input">
            </div>
        </div>
        <button class="btn-submit-score" onclick="updateMatchScore('${match.id}')">
            Update Scores
        </button>
    `;
}

function deleteTournament() {
    if (!confirm('Delete current tournament? Player stats will be reverted.')) return;
    
    const tournament = getActiveTournament();
    if (!tournament) return;
    
    const players = getPlayers();
    
    tournament.matches.forEach(match => {
        if (!match.completed) return;
        
        const p1 = players.find(p => p.id === match.player1?.id);
        const p2 = players.find(p => p.id === match.player2?.id);
        
        if (p1 && p2) {
            p1.matchesPlayed = Math.max(0, (p1.matchesPlayed || 0) - 1);
            p2.matchesPlayed = Math.max(0, (p2.matchesPlayed || 0) - 1);
            p1.goals = Math.max(0, (p1.goals || 0) - (match.score1 || 0));
            p2.goals = Math.max(0, (p2.goals || 0) - (match.score2 || 0));
            
            if (match.winner?.id === p1.id) {
                p1.wins = Math.max(0, (p1.wins || 0) - 1);
                p2.losses = Math.max(0, (p2.losses || 0) - 1);
            } else if (match.winner?.id === p2.id) {
                p2.wins = Math.max(0, (p2.wins || 0) - 1);
                p1.losses = Math.max(0, (p1.losses || 0) - 1);
            }
            
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
    });
    
    savePlayers(players);
    saveActiveTournament(null);
    
    showToast('Tournament deleted and stats reverted');
    showAdminDashboard();
}

function displayBracket(tournament) {
    const container = document.getElementById('adminBracket');
    if (!tournament.rounds?.length) {
        container.innerHTML = '<p class="empty-state">Bracket not generated yet</p>';
        return;
    }
    
    container.innerHTML = tournament.rounds.map(round => `
        <div class="bracket-round">
            <h4>${round.name}</h4>
            <div class="bracket-matches">
                ${tournament.matches
                    .filter(m => m.roundNumber === tournament.rounds.findIndex(r => r.name === round.name) + 1)
                    .map(match => `
                        <div class="bracket-match ${match.completed ? 'completed' : ''}">
                            <div class="match-player ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                                ${match.player1 ? `
                                    <img src="${match.player1.clubLogo}" class="player-match-avatar">
                                    <span>${match.player1.name}</span>
                                    ${match.score1 !== null ? `<span class="player-score">${match.score1}</span>` : ''}
                                ` : '<span>TBD</span>'}
                            </div>
                            <div class="match-vs">VS</div>
                            <div class="match-player ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                                ${match.player2 ? `
                                    <img src="${match.player2.clubLogo}" class="player-match-avatar">
                                    <span>${match.player2.name}</span>
                                    ${match.score2 !== null ? `<span class="player-score">${match.score2}</span>` : ''}
                                ` : '<span>TBD</span>'}
                            </div>
                        </div>
                    `).join('')}
            </div>
        </div>
    `).join('');
}

function loadAdminLeaderboards() {
    const container = document.getElementById('adminLeaderboards');
    const players = getPlayers().filter(p => !p.isAdmin);
    
    const top = [...players]
        .sort((a,b) => (b.championships||0) - (a.championships||0))
        .slice(0,10);
    
    container.innerHTML = top.length === 0 
        ? '<p class="empty-state">No players yet</p>'
        : `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Logo</th>
                        <th>Player</th>
                        <th>Club</th>
                        <th>Goals</th>
                        <th>Finals</th>
                        <th>Titles</th>
                    </tr>
                </thead>
                <tbody>
                    ${top.map((p,i) => `
                        <tr>
                            <td>${i<3 ? ['🥇','🥈','🥉'][i] : i+1}</td>
                            <td><img src="${p.clubLogo}" class="table-club-logo"></td>
                            <td>${p.name}</td>
                            <td>${p.clubName}</td>
                            <td>${p.goals||0}</td>
                            <td>${p.finalsReached||0}</td>
                            <td class="highlight-cell">${p.championships||0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
}

function loadAdminHistory() {
    const container = document.getElementById('adminHistory');
    const tournaments = getTournaments();
    
    if (tournaments.length === 0) {
        container.innerHTML = '<p class="empty-state">No completed tournaments</p>';
        return;
    }
    
    container.innerHTML = tournaments.slice().reverse().map(t => `
        <div class="history-card glass-card-small">
            <div class="history-header">
                <h4 onclick="showTournamentDetails('${t.id}')" style="cursor: pointer;">Tournament #${t.id.slice(0,6)}</h4>
                <div class="history-actions">
                    <span class="history-date">${new Date(t.createdAt).toLocaleDateString()}</span>
                    <button class="btn-icon-small btn-delete-tournament" onclick="event.stopPropagation(); deleteOldTournament('${t.id}')" title="Delete Tournament">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" fill="currentColor"/>
                            <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" fill="currentColor"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="history-info" onclick="showTournamentDetails('${t.id}')" style="cursor: pointer;">
                <p>Winner: ${t.winner?.name || '?'}</p>
                <p>Players: ${t.players.length}</p>
            </div>
        </div>
    `).join('');
}

function deleteOldTournament(tournamentId) {
    if (!confirm('Delete this tournament? This will remove it from history but will NOT affect player stats.')) return;
    
    const tournaments = getTournaments();
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    
    saveTournaments(updatedTournaments);
    showToast('Tournament deleted from history');
    loadAdminHistory();
}

// ───────────────────────────────────────────────
// MODAL FUNCTIONS
// ───────────────────────────────────────────────

function showTournamentDetails(tournamentId) {
    let tournament = getTournaments().find(t => t.id === tournamentId);
    if (!tournament) tournament = getActiveTournament();
    if (!tournament || tournament.id !== tournamentId) return;
    
    const modal = document.getElementById('tournamentModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = `Tournament #${tournament.id.slice(0,6)}`;
    
    body.innerHTML = `
        <div class="tournament-details">
            <p><strong>Status:</strong> ${tournament.status}</p>
            <p><strong>Date:</strong> ${new Date(tournament.createdAt).toLocaleDateString()}</p>
            <p><strong>Players:</strong> ${tournament.players.length}</p>
            ${tournament.winner ? `<p><strong>Champion:</strong> ${tournament.winner.name}</p>` : ''}
        </div>
        
        <h4 style="margin:20px 0 12px">Participants</h4>
        <div class="participants-grid">
            ${tournament.players.map(p => `
                <div class="participant-card">
                    <img src="${p.clubLogo}" class="participant-logo">
                    <div class="participant-info">
                        <div class="participant-name">${p.name}</div>
                        <div class="participant-club">${p.clubName}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${tournament.rounds?.length ? `
            <h4 style="margin:24px 0 12px">Bracket</h4>
            ${tournament.rounds.map(r => `
                <div class="modal-round">
                    <h5>${r.name}</h5>
                    ${tournament.matches.filter(m => m.roundNumber === tournament.rounds.findIndex(rr => rr.name === r.name)+1)
                        .map(m => `
                            <div class="modal-match">
                                <div>${m.player1?.name || 'TBD'} ${m.score1 ?? ''}</div>
                                <div>${m.player2?.name || 'TBD'} ${m.score2 ?? ''}</div>
                            </div>
                        `).join('')}
                </div>
            `).join('')}
        ` : '<p>Bracket not available</p>'}
    `;
    
    modal.classList.add('active');
}

function showPlayerTournamentDetails(tournamentId) {
    const user = getCurrentUser();
    let tournament = getTournaments().find(t => t.id === tournamentId);
    if (!tournament) tournament = getActiveTournament();
    if (!tournament) return;
    
    const modal = document.getElementById('tournamentModal');
    const title = document.getElementById('modalTitle');
    const body = document.getElementById('modalBody');
    
    title.textContent = `Tournament #${tournament.id.slice(0,6)}`;
    
    body.innerHTML = `
        <div class="tournament-summary">
            <div class="summary-item">
                <span class="summary-label">Players:</span>
                <span class="summary-value">${tournament.players.length}</span>
            </div>
            <div class="summary-item">
                <span class="summary-label">Champion:</span>
                <span class="summary-value">${tournament.winner ? tournament.winner.name : 'TBD'}</span>
            </div>
        </div>
        
        <h4 class="section-title">Participants</h4>
        <div class="participants-grid-new">
            ${tournament.players.map(p => `
                <div class="participant-card-new ${p.id === user.id ? 'current-user' : ''} ${tournament.winner?.id === p.id ? 'is-champion' : ''}">
                    <img src="${p.clubLogo}" class="participant-logo-new" alt="${p.clubName}">
                    <div class="participant-info-new">
                        <div class="participant-name-new">${p.name}${p.id === user.id ? ' (You)' : ''}</div>
                        <div class="participant-club-new">${p.clubName}</div>
                    </div>
                    ${tournament.winner?.id === p.id ? '<div class="champion-badge">CHAMPION</div>' : ''}
                </div>
            `).join('')}
        </div>
        
        ${tournament.rounds?.length ? `
            <h4 class="section-title bracket-title">Bracket</h4>
            <div class="bracket-container-new">
                ${tournament.rounds.map((r, roundIndex) => `
                    <div class="bracket-round-new">
                        <h5 class="round-label">${r.name}</h5>
                        <div class="bracket-matches-new">
                            ${tournament.matches.filter(m => m.roundNumber === roundIndex + 1)
                                .map(m => {
                                    const isUser = (m.player1?.id === user.id) || (m.player2?.id === user.id);
                                    const hasScores = m.score1 !== null && m.score2 !== null;
                                    const hasPenalties = m.penalties1 !== null && m.penalties2 !== null;
                                    
                                    return `
                                        <div class="bracket-match-new ${isUser ? 'user-match-new' : ''} ${m.completed ? 'completed' : ''}">
                                            <div class="match-player-name match-player-left">${m.player1?.name || 'Player 1'}</div>
                                            
                                            ${m.player1 ? `<img src="${m.player1.clubLogo}" class="match-club-logo" alt="${m.player1.clubName}">` : '<div class="match-club-placeholder"></div>'}
                                            
                                            <div class="match-center">
                                                ${hasScores ? `
                                                    <div class="match-score">
                                                        <span class="score-number">${m.score1}</span>
                                                        <span class="score-separator">-</span>
                                                        <span class="score-number">${m.score2}</span>
                                                    </div>
                                                    ${hasPenalties ? `
                                                        <div class="match-penalties">
                                                            ${m.penalties1} - ${m.penalties2}
                                                        </div>
                                                    ` : ''}
                                                ` : ''}
                                            </div>
                                            
                                            ${m.player2 ? `<img src="${m.player2.clubLogo}" class="match-club-logo" alt="${m.player2.clubName}">` : '<div class="match-club-placeholder"></div>'}
                                            
                                            <div class="match-player-name match-player-right">${m.player2?.name || 'Player 2'}</div>
                                        </div>
                                    `;
                                }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        ` : '<p class="empty-bracket">Bracket not generated yet</p>'}
    `;
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('tournamentModal').classList.remove('active');
}

window.onclick = function(event) {
    const modal = document.getElementById('tournamentModal');
    if (event.target === modal) closeModal();
};