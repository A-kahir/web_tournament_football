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
async function checkAutoLogin() {
    const user = getCurrentUser();
    if (user) {
        if (user.isAdmin) {
            showAdminDashboard();
        } else {
            showPlayerDashboard();
        }
    } else {
        await populateClubGrid();
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
async function populateClubGrid() {
    const clubGrid = document.getElementById('clubGrid');
    if (!clubGrid) return;
    
    clubGrid.innerHTML = '';
    
    // Get all players once to check taken clubs
    const players = await getPlayers();
    const takenClubIds = players.map(p => p.clubId);
    
    CLUBS.forEach(club => {
        const isTaken = takenClubIds.includes(club.id);
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
async function playerRegister() {
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
    
    const players = await getPlayers();
    if (players.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        errorMsg.textContent = 'This name is already taken';
        return;
    }
    
    if (await isClubTaken(selectedClubId)) {
        errorMsg.textContent = 'This club was just taken, please select another';
        await populateClubGrid();
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
    await savePlayers(players);
    
    const user = { ...newPlayer };
    delete user.password;
    saveCurrentUser(user);
    
    selectedClubId = null;
    
    showToast(`Welcome ${name}! Your account has been created.`);
    setTimeout(() => {
        showPlayerDashboard();
    }, 500);
}

// Player Login - FIXED: Made async and added await
async function playerLogin() {
    const name = document.getElementById('loginName').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorMsg = document.getElementById('loginError');
    
    errorMsg.textContent = '';
    
    if (!name || !password) {
        errorMsg.textContent = 'Please enter name and password';
        return;
    }
    
    // FIXED: Added await here
    const players = await getPlayers();
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
    
    setTimeout(() => {
        if (player.isAdmin) showAdminDashboard();
        else showPlayerDashboard();
    }, 300);
}

// Admin Login - FIXED: Made async and added await
async function adminLogin() {
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
    
    // FIXED: Added await here
    await setAdminExists(true);
    saveCurrentUser(adminUser);
    
    showToast('Admin access granted', 'success');
    setTimeout(() => {
        showAdminDashboard();
    }, 300);
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    location.reload();
}

// Show Player Dashboard
function showPlayerDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('playerDashboard').classList.add('active');
    document.getElementById('adminDashboard').classList.remove('active');
    
    loadPlayerDashboard();
}

// Show Admin Dashboard
function showAdminDashboard() {
    document.getElementById('loginPage').classList.remove('active');
    document.getElementById('playerDashboard').classList.remove('active');
    document.getElementById('adminDashboard').classList.add('active');
    
    loadAdminDashboard();
}

// ───────────────────────────────────────────────
// PLAYER DASHBOARD FUNCTIONS
// ───────────────────────────────────────────────

async function loadPlayerDashboard() {
    const user = getCurrentUser();
    if (!user) {
        logout();
        return;
    }
    
    // Update user data from server
    const players = await getPlayers();
    const updatedUser = players.find(p => p.id === user.id);
    
    if (updatedUser) {
        const userWithoutPassword = { ...updatedUser };
        delete userWithoutPassword.password;
        saveCurrentUser(userWithoutPassword);
    }
    
    updatePlayerHeader();
    await loadPlayerStats();
    await loadPlayerTournaments();
    await checkActiveTournament();
}

function updatePlayerHeader() {
    const user = getCurrentUser();
    document.getElementById('playerName').textContent = user.name;
    document.getElementById('playerClub').textContent = user.clubName;
    
    const playerLogo = document.getElementById('playerLogo');
    playerLogo.src = user.clubLogo;
    playerLogo.onerror = () => playerLogo.style.display = 'none';
}

async function loadPlayerStats() {
    const user = getCurrentUser();
    
    document.getElementById('statTournaments').textContent = user.tournaments || 0;
    document.getElementById('statMatches').textContent = user.matchesPlayed || 0;
    document.getElementById('statWins').textContent = user.wins || 0;
    document.getElementById('statGoals').textContent = user.goals || 0;
    document.getElementById('statChampionships').textContent = user.championships || 0;
    document.getElementById('statFinals').textContent = user.finalsReached || 0;
    
    const winRate = user.matchesPlayed > 0 
        ? Math.round((user.wins / user.matchesPlayed) * 100) 
        : 0;
    document.getElementById('statWinRate').textContent = winRate + '%';
}

async function loadPlayerTournaments() {
    const user = getCurrentUser();
    const tournaments = await getTournaments();
    const userTournaments = tournaments.filter(t => 
        t.players.some(p => p.id === user.id)
    );
    
    const container = document.getElementById('tournamentsList');
    
    if (userTournaments.length === 0) {
        container.innerHTML = `
            <div class="empty-state-player">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style="opacity: 0.3; margin-bottom: 16px;">
                    <circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/>
                    <path d="M32 20v24M20 32h24" stroke="currentColor" stroke-width="2"/>
                </svg>
                <p>No tournament history yet</p>
                <p style="opacity: 0.6; font-size: 14px;">Wait for the admin to create a tournament</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userTournaments.slice().reverse().map(t => {
        const userParticipant = t.players.find(p => p.id === user.id);
        const isWinner = t.winner && t.winner.id === user.id;
        
        return `
            <div class="tournament-card glass-card-small ${isWinner ? 'winner-card' : ''}" 
                 onclick="showPlayerTournamentDetails('${t.id}')">
                <div class="tournament-header-small">
                    <h4>Tournament #${t.id.slice(0,6)}</h4>
                    ${isWinner ? '<span class="winner-badge">🏆 Champion</span>' : ''}
                </div>
                <div class="tournament-info-small">
                    <p>📅 ${new Date(t.createdAt).toLocaleDateString()}</p>
                    <p>👥 ${t.players.length} Players</p>
                    <p>🏆 Winner: ${t.winner ? t.winner.name : 'TBD'}</p>
                </div>
            </div>
        `;
    }).join('');
}

async function checkActiveTournament() {
    const user = getCurrentUser();
    const activeTournament = await getActiveTournament();
    const activeTournamentSection = document.getElementById('activeTournamentSection');
    const content = document.getElementById('activeTournamentContent');
    
    if (!activeTournament) {
        activeTournamentSection.style.display = 'none';
        return;
    }
    
    const isRegistered = activeTournament.players.some(p => p.id === user.id);
    const canRegister = activeTournament.status === 'registration' && 
                       activeTournament.players.length < activeTournament.maxPlayers;
    
    activeTournamentSection.style.display = 'block';
    
    if (activeTournament.status === 'registration') {
        if (isRegistered) {
            content.innerHTML = `
                <div class="registration-success">
                    <div class="success-icon">✓</div>
                    <h4>You're Registered!</h4>
                    <p>Waiting for tournament to start...</p>
                    <p class="player-count">${activeTournament.players.length}/${activeTournament.maxPlayers} Players</p>
                    <button onclick="unregisterFromTournament()" class="btn-secondary">Unregister</button>
                </div>
            `;
        } else if (canRegister) {
            content.innerHTML = `
                <div class="registration-prompt">
                    <h4>New Tournament Available!</h4>
                    <p>Join the ${activeTournament.maxPlayers}-player tournament</p>
                    <p class="player-count">${activeTournament.players.length}/${activeTournament.maxPlayers} Players</p>
                    <button onclick="registerForTournament()" class="btn-primary">Register Now</button>
                </div>
            `;
        } else {
            content.innerHTML = `
                <div class="registration-closed">
                    <h4>Tournament Full</h4>
                    <p>This tournament has reached maximum capacity</p>
                    <p class="player-count">${activeTournament.players.length}/${activeTournament.maxPlayers} Players</p>
                </div>
            `;
        }
    } else if (activeTournament.status === 'active') {
        if (isRegistered) {
            content.innerHTML = `
                <div class="tournament-active">
                    <h4>🎮 Tournament In Progress</h4>
                    <p>Check the bracket below for match updates</p>
                    <button onclick="showPlayerTournamentDetails('${activeTournament.id}')" class="btn-primary">
                        View Tournament
                    </button>
                </div>
                <div id="playerBracket"></div>
            `;
            renderPlayerBracket(activeTournament);
        } else {
            content.innerHTML = `
                <div class="tournament-spectate">
                    <h4>Tournament In Progress</h4>
                    <p>You can spectate this tournament</p>
                    <button onclick="showPlayerTournamentDetails('${activeTournament.id}')" class="btn-secondary">
                        View Bracket
                    </button>
                </div>
            `;
        }
    }
}

async function registerForTournament() {
    const user = getCurrentUser();
    const activeTournament = await getActiveTournament();
    
    if (!activeTournament || activeTournament.status !== 'registration') {
        showToast('Tournament registration is not available', 'error');
        return;
    }
    
    if (activeTournament.players.length >= activeTournament.maxPlayers) {
        showToast('Tournament is full', 'error');
        return;
    }
    
    if (activeTournament.players.some(p => p.id === user.id)) {
        showToast('You are already registered', 'error');
        return;
    }
    
    const players = await getPlayers();
    const fullUserData = players.find(p => p.id === user.id);
    
    activeTournament.players.push({
        id: fullUserData.id,
        name: fullUserData.name,
        clubId: fullUserData.clubId,
        clubName: fullUserData.clubName,
        clubLogo: fullUserData.clubLogo
    });
    
    await saveActiveTournament(activeTournament);
    
    showToast('Successfully registered for tournament!');
    await checkActiveTournament();
}

async function unregisterFromTournament() {
    if (!confirm('Are you sure you want to unregister from this tournament?')) return;
    
    const user = getCurrentUser();
    const activeTournament = await getActiveTournament();
    
    if (!activeTournament || activeTournament.status !== 'registration') {
        showToast('Cannot unregister at this time', 'error');
        return;
    }
    
    activeTournament.players = activeTournament.players.filter(p => p.id !== user.id);
    await saveActiveTournament(activeTournament);
    
    showToast('Unregistered from tournament');
    await checkActiveTournament();
}

function renderPlayerBracket(tournament) {
    const container = document.getElementById('playerBracket');
    if (!container) return;
    
    const user = getCurrentUser();
    
    container.innerHTML = `
        <div class="bracket-view-player">
            ${tournament.rounds.map((round, roundIndex) => `
                <div class="bracket-round">
                    <h4 class="round-title">${round.name}</h4>
                    <div class="round-matches">
                        ${tournament.matches
                            .filter(m => m.roundNumber === roundIndex + 1)
                            .map(match => {
                                const isUserMatch = match.player1?.id === user.id || match.player2?.id === user.id;
                                return `
                                    <div class="bracket-match ${isUserMatch ? 'user-match' : ''} ${match.completed ? 'completed' : ''}">
                                        <div class="match-team ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                                            <span class="team-name">${match.player1?.name || 'TBD'}</span>
                                            ${match.score1 !== null ? `<span class="team-score">${match.score1}</span>` : ''}
                                        </div>
                                        <div class="match-team ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                                            <span class="team-name">${match.player2?.name || 'TBD'}</span>
                                            ${match.score2 !== null ? `<span class="team-score">${match.score2}</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// ───────────────────────────────────────────────
// ADMIN DASHBOARD FUNCTIONS
// ───────────────────────────────────────────────

async function loadAdminDashboard() {
    await loadAdminStats();
    await loadPlayerManagement();
    await loadActiveTournamentPanel();
    await loadAdminLeaderboards();
    await loadAdminHistory();
}

async function loadAdminStats() {
    const tournaments = await getTournaments();
    const players = await getPlayers();
    
    const totalMatches = tournaments.reduce((sum, t) => 
        sum + (t.matches?.filter(m => m.completed).length || 0), 0
    );
    
    document.getElementById('adminTotalTournaments').textContent = tournaments.length;
    document.getElementById('adminTotalPlayers').textContent = players.length;
    document.getElementById('adminTotalMatches').textContent = totalMatches;
}

async function loadPlayerManagement() {
    const players = await getPlayers();
    const container = document.getElementById('playerManagement');
    
    if (players.length === 0) {
        container.innerHTML = `
            <div class="glass-card admin-section">
                <div class="section-header-admin">
                    <h3>👥 Player Management</h3>
                </div>
                <p class="empty-state">No players registered yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="glass-card admin-section">
            <div class="section-header-admin">
                <h3>👥 Player Management</h3>
                <span class="player-count-badge">${players.length} Players</span>
            </div>
            <div class="players-grid">
                ${players.map(p => `
                    <div class="player-management-card">
                        <img src="${p.clubLogo}" class="player-mgmt-logo" onerror="this.style.display='none'">
                        <div class="player-mgmt-info">
                            <h4>${p.name}</h4>
                            <p>${p.clubName}</p>
                            <div class="player-mgmt-stats">
                                <span>🏆 ${p.championships}</span>
                                <span>⚽ ${p.matchesPlayed} matches</span>
                                <span>✓ ${p.wins} wins</span>
                            </div>
                        </div>
                        <button onclick="deletePlayer('${p.id}')" class="btn-delete-player" title="Delete Player">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z" fill="currentColor"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" fill="currentColor"/>
                            </svg>
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function deletePlayer(playerId) {
    if (!confirm('Delete this player? This will remove them from all tournaments and cannot be undone.')) return;
    
    const players = await getPlayers();
    const updatedPlayers = players.filter(p => p.id !== playerId);
    
    await savePlayers(updatedPlayers);
    showToast('Player deleted');
    await loadPlayerManagement();
    await loadAdminStats();
}

async function createTournament() {
    const size = parseInt(document.getElementById('tournamentSize').value);
    const errorMsg = document.getElementById('tournamentError');
    
    const activeTournament = await getActiveTournament();
    if (activeTournament) {
        errorMsg.textContent = 'Please complete or delete the active tournament first';
        return;
    }
    
    const players = await getPlayers();
    if (players.length < size) {
        errorMsg.textContent = `Not enough players. Need ${size}, have ${players.length}`;
        return;
    }
    
    const newTournament = {
        id: generateId(),
        maxPlayers: size,
        players: [],
        matches: [],
        rounds: [],
        status: 'registration',
        createdAt: new Date().toISOString(),
        winner: null
    };
    
    await saveActiveTournament(newTournament);
    
    showToast('Tournament created! Players can now register.');
    await loadActiveTournamentPanel();
}

async function loadActiveTournamentPanel() {
    const activeTournament = await getActiveTournament();
    const panel = document.getElementById('activeTournamentPanel');
    const badge = document.getElementById('tournamentStatusBadge');
    
    if (!activeTournament) {
        panel.style.display = 'none';
        return;
    }
    
    panel.style.display = 'block';
    
    const statusColors = {
        'registration': '#f59e0b',
        'active': '#10b981',
        'completed': '#6366f1'
    };
    
    badge.innerHTML = `
        <span class="status-badge" style="background: ${statusColors[activeTournament.status]}20; color: ${statusColors[activeTournament.status]}">
            ${activeTournament.status.toUpperCase()}
        </span>
    `;
    
    if (activeTournament.status === 'registration') {
        document.getElementById('tournamentControls').style.display = 'block';
        document.getElementById('matchManagement').style.display = 'none';
        
        const regStatus = document.getElementById('registrationStatus');
        regStatus.innerHTML = `
            <div class="registration-info-admin">
                <h4>Tournament Size: ${activeTournament.maxPlayers} Players</h4>
                <p>Registered: ${activeTournament.players.length}/${activeTournament.maxPlayers}</p>
                <div class="registered-players">
                    ${activeTournament.players.map(p => `
                        <div class="registered-player-chip">
                            <img src="${p.clubLogo}" class="chip-logo">
                            <span>${p.name}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        const startBtn = document.getElementById('startTournamentBtn');
        if (activeTournament.players.length === activeTournament.maxPlayers) {
            startBtn.disabled = false;
            startBtn.textContent = '▶ Start Tournament';
        } else {
            startBtn.disabled = true;
            startBtn.textContent = `Waiting for players (${activeTournament.players.length}/${activeTournament.maxPlayers})`;
        }
    } else if (activeTournament.status === 'active') {
        document.getElementById('tournamentControls').style.display = 'none';
        document.getElementById('matchManagement').style.display = 'block';
        
        await loadMatchManagement(activeTournament);
        renderAdminBracket(activeTournament);
    }
}

async function startTournament() {
    const activeTournament = await getActiveTournament();
    
    if (!activeTournament || activeTournament.players.length !== activeTournament.maxPlayers) {
        showToast('Cannot start tournament - not enough players', 'error');
        return;
    }
    
    // Generate bracket
    activeTournament.status = 'active';
    generateBracket(activeTournament);
    
    // Update player stats
    const players = await getPlayers();
    activeTournament.players.forEach(tournamentPlayer => {
        const player = players.find(p => p.id === tournamentPlayer.id);
        if (player) {
            player.tournaments = (player.tournaments || 0) + 1;
        }
    });
    await savePlayers(players);
    
    await saveActiveTournament(activeTournament);
    
    showToast('Tournament started!');
    await loadActiveTournamentPanel();
}

function generateBracket(tournament) {
    const playerCount = tournament.players.length;
    const rounds = Math.log2(playerCount);
    
    // Shuffle players randomly
    const shuffledPlayers = [...tournament.players].sort(() => Math.random() - 0.5);
    
    // Create rounds
    tournament.rounds = [];
    for (let i = 0; i < rounds; i++) {
        const roundName = i === rounds - 1 ? 'Final' : 
                         i === rounds - 2 ? 'Semi-Finals' : 
                         i === rounds - 3 ? 'Quarter-Finals' : 
                         `Round ${i + 1}`;
        tournament.rounds.push({ 
            name: roundName, 
            matchCount: Math.pow(2, rounds - i - 1) 
        });
    }
    
    // Create first round matches
    tournament.matches = [];
    for (let i = 0; i < shuffledPlayers.length; i += 2) {
        tournament.matches.push({
            id: generateId(),
            roundNumber: 1,
            matchNumber: (i / 2) + 1,
            player1: shuffledPlayers[i],
            player2: shuffledPlayers[i + 1],
            score1: null,
            score2: null,
            penalties1: null,
            penalties2: null,
            winner: null,
            completed: false
        });
    }
    
    // Create placeholder matches for subsequent rounds
    for (let round = 2; round <= rounds; round++) {
        const matchesInRound = Math.pow(2, rounds - round);
        for (let i = 0; i < matchesInRound; i++) {
            tournament.matches.push({
                id: generateId(),
                roundNumber: round,
                matchNumber: i + 1,
                player1: null,
                player2: null,
                score1: null,
                score2: null,
                penalties1: null,
                penalties2: null,
                winner: null,
                completed: false
            });
        }
    }
}

async function loadMatchManagement(tournament) {
    const container = document.getElementById('matchesList');
    
    const pendingMatches = tournament.matches.filter(m => 
        !m.completed && m.player1 && m.player2
    );
    
    if (pendingMatches.length === 0) {
        container.innerHTML = '<p class="empty-state">No pending matches</p>';
        return;
    }
    
    container.innerHTML = pendingMatches.map(match => `
        <div class="match-card glass-card-small">
            <div class="match-header">
                <h4>${tournament.rounds[match.roundNumber - 1].name} - Match ${match.matchNumber}</h4>
            </div>
            <div class="match-players">
                <div class="match-player">
                    <img src="${match.player1.clubLogo}" class="match-player-logo">
                    <span>${match.player1.name}</span>
                </div>
                <span class="vs-text">VS</span>
                <div class="match-player">
                    <img src="${match.player2.clubLogo}" class="match-player-logo">
                    <span>${match.player2.name}</span>
                </div>
            </div>
            <div class="match-score-inputs">
                <input type="number" id="score1_${match.id}" min="0" placeholder="0" class="score-input">
                <span>-</span>
                <input type="number" id="score2_${match.id}" min="0" placeholder="0" class="score-input">
            </div>
            <div class="penalty-inputs" style="display:none;" id="penalties_${match.id}">
                <label>Penalties:</label>
                <input type="number" id="pen1_${match.id}" min="0" max="10" placeholder="0" class="penalty-input">
                <span>-</span>
                <input type="number" id="pen2_${match.id}" min="0" max="10" placeholder="0" class="penalty-input">
            </div>
            <button onclick="checkForDraw('${match.id}')" class="btn-primary btn-small">Submit Result</button>
        </div>
    `).join('');
}

function checkForDraw(matchId) {
    const score1 = parseInt(document.getElementById(`score1_${matchId}`).value) || 0;
    const score2 = parseInt(document.getElementById(`score2_${matchId}`).value) || 0;
    
    if (score1 === score2) {
        document.getElementById(`penalties_${matchId}`).style.display = 'flex';
        showToast('Draw! Please enter penalty shootout scores', 'info');
        
        // Change button to submit with penalties
        event.target.onclick = () => submitMatchResult(matchId, true);
        event.target.textContent = 'Submit with Penalties';
    } else {
        submitMatchResult(matchId, false);
    }
}

async function submitMatchResult(matchId, hasPenalties) {
    const activeTournament = await getActiveTournament();
    const match = activeTournament.matches.find(m => m.id === matchId);
    
    if (!match) return;
    
    const score1 = parseInt(document.getElementById(`score1_${matchId}`).value) || 0;
    const score2 = parseInt(document.getElementById(`score2_${matchId}`).value) || 0;
    
    let winner;
    
    if (hasPenalties) {
        const pen1 = parseInt(document.getElementById(`pen1_${matchId}`).value) || 0;
        const pen2 = parseInt(document.getElementById(`pen2_${matchId}`).value) || 0;
        
        if (pen1 === pen2) {
            showToast('Penalties cannot be tied', 'error');
            return;
        }
        
        match.penalties1 = pen1;
        match.penalties2 = pen2;
        winner = pen1 > pen2 ? match.player1 : match.player2;
    } else {
        winner = score1 > score2 ? match.player1 : match.player2;
    }
    
    match.score1 = score1;
    match.score2 = score2;
    match.winner = winner;
    match.completed = true;
    
    // Update player stats
    const players = await getPlayers();
    
    const player1 = players.find(p => p.id === match.player1.id);
    const player2 = players.find(p => p.id === match.player2.id);
    
    if (player1) {
        player1.matchesPlayed = (player1.matchesPlayed || 0) + 1;
        player1.goals = (player1.goals || 0) + score1;
        if (winner.id === player1.id) player1.wins = (player1.wins || 0) + 1;
        else player1.losses = (player1.losses || 0) + 1;
    }
    
    if (player2) {
        player2.matchesPlayed = (player2.matchesPlayed || 0) + 1;
        player2.goals = (player2.goals || 0) + score2;
        if (winner.id === player2.id) player2.wins = (player2.wins || 0) + 1;
        else player2.losses = (player2.losses || 0) + 1;
    }
    
    await savePlayers(players);
    
    // Check if this is the final
    const finalMatch = activeTournament.matches.find(m => 
        m.roundNumber === activeTournament.rounds.length && !m.completed
    );
    
    if (finalMatch && finalMatch.id === matchId) {
        // Update finalist stats
        if (player1) player1.finalsReached = (player1.finalsReached || 0) + 1;
        if (player2) player2.finalsReached = (player2.finalsReached || 0) + 1;
        
        // Update winner stats
        const championPlayer = players.find(p => p.id === winner.id);
        if (championPlayer) {
            championPlayer.championships = (championPlayer.championships || 0) + 1;
        }
        
        await savePlayers(players);
        
        // Complete tournament
        activeTournament.status = 'completed';
        activeTournament.winner = winner;
        activeTournament.completedAt = new Date().toISOString();
        
        const tournaments = await getTournaments();
        tournaments.push(activeTournament);
        await saveTournaments(tournaments);
        await saveActiveTournament(null);
        
        showToast(`🏆 ${winner.name} wins the tournament!`);
        await loadActiveTournamentPanel();
        await loadAdminHistory();
        return;
    }
    
    // Advance winner to next round
    advanceWinner(activeTournament, match);
    
    await saveActiveTournament(activeTournament);
    showToast('Match result saved');
    await loadMatchManagement(activeTournament);
    renderAdminBracket(activeTournament);
}

function advanceWinner(tournament, completedMatch) {
    const nextRoundNumber = completedMatch.roundNumber + 1;
    const nextMatchNumber = Math.ceil(completedMatch.matchNumber / 2);
    
    const nextMatch = tournament.matches.find(m => 
        m.roundNumber === nextRoundNumber && m.matchNumber === nextMatchNumber
    );
    
    if (!nextMatch) return;
    
    if (completedMatch.matchNumber % 2 === 1) {
        nextMatch.player1 = completedMatch.winner;
    } else {
        nextMatch.player2 = completedMatch.winner;
    }
}

async function deleteTournament() {
    if (!confirm('Delete this tournament? This cannot be undone.')) return;
    
    await saveActiveTournament(null);
    showToast('Tournament deleted');
    await loadActiveTournamentPanel();
}

function renderAdminBracket(tournament) {
    const container = document.getElementById('adminBracket');
    if (!container) return;
    
    container.innerHTML = `
        <div class="bracket-view">
            ${tournament.rounds.map((round, roundIndex) => `
                <div class="bracket-round">
                    <h4 class="round-title">${round.name}</h4>
                    <div class="round-matches">
                        ${tournament.matches
                            .filter(m => m.roundNumber === roundIndex + 1)
                            .map(match => `
                                <div class="bracket-match ${match.completed ? 'completed' : ''}">
                                    <div class="match-team ${match.winner?.id === match.player1?.id ? 'winner' : ''}">
                                        <span class="team-name">${match.player1?.name || 'TBD'}</span>
                                        ${match.score1 !== null ? `<span class="team-score">${match.score1}${match.penalties1 !== null ? ` (${match.penalties1})` : ''}</span>` : ''}
                                    </div>
                                    <div class="match-team ${match.winner?.id === match.player2?.id ? 'winner' : ''}">
                                        <span class="team-name">${match.player2?.name || 'TBD'}</span>
                                        ${match.score2 !== null ? `<span class="team-score">${match.score2}${match.penalties2 !== null ? ` (${match.penalties2})` : ''}</span>` : ''}
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function loadAdminLeaderboards() {
    const container = document.getElementById('adminLeaderboards');
    const players = await getPlayers();
    
    if (players.length === 0) {
        container.innerHTML = '<p class="empty-state">No player statistics available</p>';
        return;
    }
    
    const championshipLeaders = [...players]
        .sort((a, b) => (b.championships || 0) - (a.championships || 0))
        .slice(0, 5);
    
    const winLeaders = [...players]
        .sort((a, b) => (b.wins || 0) - (a.wins || 0))
        .slice(0, 5);
    
    const goalLeaders = [...players]
        .sort((a, b) => (b.goals || 0) - (a.goals || 0))
        .slice(0, 5);
    
    container.innerHTML = `
        <div class="leaderboards-grid">
            <div class="leaderboard-section">
                <h4>🏆 Most Championships</h4>
                ${championshipLeaders.map((p, i) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${i + 1}</span>
                        <img src="${p.clubLogo}" class="leader-logo">
                        <span class="leader-name">${p.name}</span>
                        <span class="leader-stat">${p.championships || 0}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="leaderboard-section">
                <h4>✓ Most Wins</h4>
                ${winLeaders.map((p, i) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${i + 1}</span>
                        <img src="${p.clubLogo}" class="leader-logo">
                        <span class="leader-name">${p.name}</span>
                        <span class="leader-stat">${p.wins || 0}</span>
                    </div>
                `).join('')}
            </div>
            
            <div class="leaderboard-section">
                <h4>⚽ Most Goals</h4>
                ${goalLeaders.map((p, i) => `
                    <div class="leaderboard-item">
                        <span class="rank">#${i + 1}</span>
                        <img src="${p.clubLogo}" class="leader-logo">
                        <span class="leader-name">${p.name}</span>
                        <span class="leader-stat">${p.goals || 0}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

async function loadAdminHistory() {
    const container = document.getElementById('adminHistory');
    const tournaments = await getTournaments();
    
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

async function deleteOldTournament(tournamentId) {
    if (!confirm('Delete this tournament? This will remove it from history but will NOT affect player stats.')) return;
    
    const tournaments = await getTournaments();
    const updatedTournaments = tournaments.filter(t => t.id !== tournamentId);
    
    await saveTournaments(updatedTournaments);
    showToast('Tournament deleted from history');
    await loadAdminHistory();
}

// ───────────────────────────────────────────────
// MODAL FUNCTIONS
// ───────────────────────────────────────────────

async function showTournamentDetails(tournamentId) {
    const tournaments = await getTournaments();
    let tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
        const activeTournament = await getActiveTournament();
        if (activeTournament && activeTournament.id === tournamentId) {
            tournament = activeTournament;
        }
    }
    if (!tournament) return;
    
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

async function showPlayerTournamentDetails(tournamentId) {
    const user = getCurrentUser();
    const tournaments = await getTournaments();
    let tournament = tournaments.find(t => t.id === tournamentId);
    if (!tournament) {
        const activeTournament = await getActiveTournament();
        if (activeTournament && activeTournament.id === tournamentId) {
            tournament = activeTournament;
        }
    }
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