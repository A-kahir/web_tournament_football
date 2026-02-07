// eFootball Clubs Database with Transparent PNG Logo URLs
const CLUBS = [
    { 
        id: 1, 
        name: "FC Barcelona", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/barcelona.efbb52fc.png"
    },
    { 
        id: 2, 
        name: "Real Madrid", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/real-madrid.81d3d699.png"
    },
    { 
        id: 3, 
        name: "Manchester United", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/manchester-united.7e7044cd.png"
    },
    { 
        id: 4, 
        name: "Manchester City", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/manchester-city.73ad38e1.png"
    },
    { 
        id: 5, 
        name: "Liverpool", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/liverpool.868c28cb.png"
    },
    { 
        id: 6, 
        name: "Chelsea", 
        logo: "https://assets.football-logos.cc/logos/england/256x256/chelsea.fe8d2c2e.png"
    },
    { 
        id: 7, 
        name: "Arsenal", 
        logo: "https://assets.football-logos.cc/logos/england/256x256/arsenal.e5528ede.png"
    },
    { 
        id: 8, 
        name: "Tottenham", 
        logo: "https://assets.football-logos.cc/logos/england/256x256/tottenham.f192bf50.png"
    },
    { 
        id: 9, 
        name: "Bayern Munich", 
        logo: "https://assets.football-logos.cc/logos/germany/256x256/bayern-munchen.6c38f13a.png"
    },
    { 
        id: 10, 
        name: "Borussia Dortmund", 
        logo: "https://assets.football-logos.cc/logos/germany/256x256/borussia-dortmund.09ffedcd.png"
    },
    { 
        id: 11, 
        name: "Paris Saint-Germain", 
        logo: "https://assets.football-logos.cc/logos/france/256x256/paris-saint-germain.579907dc.png"
    },
    { 
        id: 12, 
        name: "Juventus", 
        logo: "https://assets.football-logos.cc/logos/italy/256x256/juventus.a8baf848.png"
    },
    { 
        id: 13, 
        name: "AC Milan", 
        logo: "https://assets.football-logos.cc/logos/italy/256x256/milan.75d56f90.png"
    },
    { 
        id: 14, 
        name: "Inter Milan", 
        logo: "https://assets.football-logos.cc/logos/italy/256x256/inter.3a7ce90c.png"
    },
    { 
        id: 15, 
        name: "Atletico Madrid", 
        logo: "https://assets.football-logos.cc/logos/spain/256x256/atletico-madrid.ba72e2cf.png"
    },
    { 
        id: 16, 
        name: "Napoli", 
        logo: "https://assets.football-logos.cc/logos/italy/256x256/napoli.ee47a50b.png"
    },
    { 
        id: 17, 
        name: "AS Roma", 
        logo: "https://assets.football-logos.cc/logos/italy/700x700/roma.00288a7d.png"
    },
    { 
        id: 18, 
        name: "Benfica", 
        logo: "https://assets.football-logos.cc/logos/portugal/700x700/benfica.373a95ac.png"
    },
    { 
        id: 19, 
        name: "FC Porto", 
        logo: "https://assets.football-logos.cc/logos/portugal/700x700/fc-porto.67cd9d9f.png"
    },
    { 
        id: 20, 
        name: "Ajax", 
        logo: "https://assets.football-logos.cc/logos/netherlands/700x700/ajax.c59b8b0d.png"
    },
    { 
        id: 21, 
        name: "Sevilla", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/sevilla.1e74eafa.png"
    },
    { 
        id: 22, 
        name: "Valencia", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/valencia.b55bb96d.png"
    },
    { 
        id: 23, 
        name: "West Ham", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/west-ham.f5e80dff.png"
    },
    { 
        id: 24, 
        name: "Leicester City", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/leicester.89779459.png"
    },
    { 
        id: 25, 
        name: "Everton", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/everton.05c044b8.png"
    },
    { 
        id: 26, 
        name: "Newcastle", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/newcastle.441ac72b.png"
    },
    { 
        id: 27, 
        name: "Aston Villa", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/aston-villa.1c2803fb.png"
    },
    { 
        id: 28, 
        name: "Leeds United", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/leeds-united.38e6a1e3.png"
    },
    { 
        id: 29, 
        name: "Wolves", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/wolves.11d21e73.png"
    },
    { 
        id: 30, 
        name: "Brighton", 
        logo: "https://assets.football-logos.cc/logos/england/700x700/brighton.0b088155.png"
    },
    { 
        id: 31, 
        name: "Bayer Leverkusen", 
        logo: "https://assets.football-logos.cc/logos/germany/700x700/bayer-leverkusen.7c4c95f5.png"
    },
    { 
        id: 32, 
        name: "RB Leipzig", 
        logo: "https://assets.football-logos.cc/logos/germany/700x700/rb-leipzig.4948a7be.png"
    },
    { 
        id: 33, 
        name: "Sporting CP", 
        logo: "https://assets.football-logos.cc/logos/portugal/700x700/sporting-cp.92616403.png"
    },
    { 
        id: 34, 
        name: "Lazio", 
        logo: "https://assets.football-logos.cc/logos/italy/700x700/lazio.0926bd10.png"
    },
    { 
        id: 35, 
        name: "Raja Club Athletic", 
        logo: "https://assets.football-logos.cc/logos/morocco/256x256/raja-ca.8b32b083.png"
    },
    { 
        id: 36, 
        name: "Olympique Marseille", 
        logo: "https://assets.football-logos.cc/logos/france/700x700/marseille.1a8c6990.png"
    },
    { 
        id: 37, 
        name: "AS Monaco", 
        logo: "https://assets.football-logos.cc/logos/france/700x700/as-monaco.b63e9cff.png"
    },
    { 
        id: 38, 
        name: "Atalanta", 
        logo: "https://assets.football-logos.cc/logos/italy/700x700/atalanta.e73bf71e.png"
    },
    { 
        id: 39, 
        name: "Vitória de Guimarães", 
        logo: "https://assets.football-logos.cc/logos/portugal/700x700/vitoria-de-guimaraes.f031ef13.png"
    },
    { 
        id: 40, 
        name: "Villarreal", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/villarreal.f47fae64.png"
    },
    { 
        id: 41, 
        name: "Real Sociedad", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/real-sociedad.ea69a441.png"
    },
    { 
        id: 42, 
        name: "Athletic Bilbao", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/athletic-club.deef9dbe.png"
    },
    { 
        id: 43, 
        name: "Real Betis", 
        logo: "https://assets.football-logos.cc/logos/spain/700x700/real-betis.5bac0c39.png"
    },
    { 
        id: 44, 
        name: "Galatasaray", 
        logo: "https://assets.football-logos.cc/logos/turkey/700x700/galatasaray.090f837e.png"
    },
    { 
        id: 45, 
        name: "Fenerbahçe", 
        logo: "https://assets.football-logos.cc/logos/turkey/700x700/fenerbahce.0df7e3ee.png"
    },
    { 
        id: 46, 
        name: "Besiktas", 
        logo: "https://assets.football-logos.cc/logos/turkey/700x700/besiktas.c60ea853.png"
    },
    { 
        id: 47, 
        name: "Angers", 
        logo: "https://assets.football-logos.cc/logos/france/256x256/angers.e33bec50.png"
    },
    { 
        id: 48, 
        name: "Flamengo", 
        logo: "https://assets.football-logos.cc/logos/brazil/256x256/flamengo.9c3055f2.png"
    },
    { 
        id: 49, 
        name: "Fluminense", 
        logo: "https://assets.football-logos.cc/logos/brazil/256x256/fluminense.118d8b5e.png"
    },
    { 
        id: 50, 
        name: "Santos FC", 
        logo: "https://assets.football-logos.cc/logos/brazil/256x256/santos.5ea20e58.png"
    },
    { 
        id: 51, 
        name: "Al Nassr", 
        logo: "https://assets.football-logos.cc/logos/saudi-arabia/700x700/al-nassr.364981c5.png"
    },
    { 
        id: 52, 
        name: "Al Hilal", 
        logo: "https://assets.football-logos.cc/logos/saudi-arabia/700x700/al-hilal.8048d91c.png"
    },
    { 
        id: 53, 
        name: "Al Ittihad", 
        logo: "https://assets.football-logos.cc/logos/saudi-arabia/700x700/al-ittihad.31cfeda9.png"
    },
    { 
        id: 54, 
        name: "Getafe", 
        logo: "https://assets.football-logos.cc/logos/spain/256x256/getafe.edd42c3d.png"
    },
    { 
        id: 55, 
        name: "PSV Eindhoven", 
        logo: "https://assets.football-logos.cc/logos/netherlands/256x256/psv.b5ebd0db.png"
    },
    { 
        id: 56, 
        name: "Avispa Fukuoka", 
        logo: "https://assets.football-logos.cc/logos/japan/256x256/avispa-fukuoka.29a8870a.png"
    },
    { 
        id: 57, 
        name: "Inter Miami", 
        logo: "https://assets.football-logos.cc/logos/usa/700x700/inter-miami-cf.aeb3f125.png"
    }
];

const ADMIN_PASSWORD = "Adminfootball22";

// API Base URL - automatically works on Vercel
const API_URL = '/api/data';

// ============================================
// AUTO-SYNC SYSTEM - Real-time updates for all users
// ============================================

let lastKnownUpdate = 0;
let autoSyncInterval = null;

// Start auto-sync when page loads
function startAutoSync() {
    // Check for updates every 3 seconds
    autoSyncInterval = setInterval(async () => {
        try {
            const result = await apiCall('getAll');
            if (result && result.lastUpdate && result.lastUpdate > lastKnownUpdate) {
                console.log('🔄 New data detected, refreshing...');
                lastKnownUpdate = result.lastUpdate;
                
                // Trigger a page refresh to show new data
                if (typeof window.loadCurrentView === 'function') {
                    window.loadCurrentView();
                }
            }
        } catch (error) {
            console.log('Sync check failed:', error);
        }
    }, 3000); // Check every 3 seconds
}

// Stop auto-sync
function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
}

// ============================================
// API FUNCTIONS - Server-side storage
// ============================================

async function apiCall(action, key = null, data = null) {
    try {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action, key, data })
        };

        const response = await fetch(API_URL, options);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'API call failed');
        }
        
        // Update last known update time
        if (result.lastUpdate) {
            lastKnownUpdate = result.lastUpdate;
        }
        
        return result.data;
    } catch (error) {
        console.error('API Error:', error);
        // Fallback to localStorage for local development
        if (action === 'get') {
            const localData = localStorage.getItem(key);
            return localData ? JSON.parse(localData) : null;
        } else if (action === 'set') {
            localStorage.setItem(key, JSON.stringify(data));
            return data;
        }
        throw error;
    }
}

// Initialize storage
async function initializeStorage() {
    try {
        // Try to get all data to check if initialized
        const allData = await apiCall('getAll');
        
        // If no data exists, initialize
        if (!allData || !allData.players) {
            await apiCall('set', 'players', []);
            await apiCall('set', 'tournaments', []);
            await apiCall('set', 'activeTournament', null);
            await apiCall('set', 'adminExists', false);
        }
        
        // Start auto-sync after initialization
        startAutoSync();
        console.log('✅ Auto-sync enabled - page will refresh when data changes');
        
    } catch (error) {
        console.error('Storage initialization error:', error);
        // Fallback to localStorage
        if (!localStorage.getItem('players')) {
            localStorage.setItem('players', JSON.stringify([]));
            localStorage.setItem('tournaments', JSON.stringify([]));
            localStorage.setItem('activeTournament', JSON.stringify(null));
            localStorage.setItem('currentUser', JSON.stringify(null));
            localStorage.setItem('adminExists', JSON.stringify(false));
        }
    }
}

// Get data from API
async function getData(key) {
    return await apiCall('get', key);
}

// Save data to API
async function saveData(key, data) {
    return await apiCall('set', key, data);
}

// Get all players
async function getPlayers() {
    const players = await getData('players');
    return players || [];
}

// Save players
async function savePlayers(players) {
    return await saveData('players', players);
}

// Get tournaments
async function getTournaments() {
    const tournaments = await getData('tournaments');
    return tournaments || [];
}

// Save tournaments
async function saveTournaments(tournaments) {
    return await saveData('tournaments', tournaments);
}

// Get active tournament
async function getActiveTournament() {
    return await getData('activeTournament');
}

// Save active tournament
async function saveActiveTournament(tournament) {
    return await saveData('activeTournament', tournament);
}

// Get current user (still use localStorage for session)
function getCurrentUser() {
    const data = localStorage.getItem('currentUser');
    return data ? JSON.parse(data) : null;
}

// Save current user (still use localStorage for session)
function saveCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Check if admin exists
async function adminExists() {
    const exists = await getData('adminExists');
    return exists || false;
}

// Set admin exists
async function setAdminExists(exists) {
    return await saveData('adminExists', exists);
}

// Check if club is taken
async function isClubTaken(clubId) {
    const players = await getPlayers();
    return players.some(p => p.clubId === clubId);
}

// Get available clubs
async function getAvailableClubs() {
    const players = await getPlayers();
    const takenClubIds = players.map(p => p.clubId);
    return CLUBS.filter(club => !takenClubIds.includes(club.id));
}

// Get club by ID
function getClubById(clubId) {
    return CLUBS.find(c => c.id === clubId);
}

// Simple password hash (for demo - use proper hashing in production)
function hashPassword(password) {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString();
}

// Verify password
function verifyPassword(password, hashedPassword) {
    return hashPassword(password) === hashedPassword;
}

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// ADMIN FUNCTION: Clear all data and reset to fresh state
async function resetAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL players, tournaments, and data. This cannot be undone!\n\nAre you absolutely sure?')) {
        try {
            await saveData('players', []);
            await saveData('tournaments', []);
            await saveData('activeTournament', null);
            await saveData('adminExists', false);
            localStorage.clear();
            alert('✅ All data has been cleared. The page will now reload.');
            location.reload();
        } catch (error) {
            console.error('Reset error:', error);
            alert('Error resetting data. Please try again.');
        }
    }
}

// Make functions available globally
window.resetAllData = resetAllData;
window.stopAutoSync = stopAutoSync;
window.startAutoSync = startAutoSync;

// Initialize on load
initializeStorage();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    stopAutoSync();
});
