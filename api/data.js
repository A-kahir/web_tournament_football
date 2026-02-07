/**
 * Vercel Serverless API for eFootball Tournament Manager
 * Stores data globally so all users see the same data in real-time
 */

// Global in-memory store (persists across requests on the same instance)
global.dataStore = global.dataStore || {
    players: [],
    tournaments: [],
    activeTournament: null,
    adminExists: false,
    lastUpdate: Date.now()
};

export default async function handler(req, res) {
    // Enable CORS so all devices can access
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ 
            success: false, 
            error: 'Method not allowed. Use POST.' 
        });
    }

    try {
        const { action, key, data } = req.body;

        switch (action) {
            case 'get':
                return handleGet(key, res);
            
            case 'set':
                return handleSet(key, data, res);
            
            case 'getAll':
                return handleGetAll(res);
            
            case 'delete':
                return handleDelete(key, res);
            
            default:
                return res.status(400).json({ 
                    success: false, 
                    error: 'Invalid action. Use: get, set, getAll, or delete' 
                });
        }
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
}

function handleGet(key, res) {
    const data = global.dataStore[key] !== undefined ? global.dataStore[key] : null;
    return res.status(200).json({ 
        success: true, 
        data,
        lastUpdate: global.dataStore.lastUpdate
    });
}

function handleSet(key, data, res) {
    global.dataStore[key] = data;
    global.dataStore.lastUpdate = Date.now();
    
    return res.status(200).json({ 
        success: true, 
        data,
        lastUpdate: global.dataStore.lastUpdate
    });
}

function handleGetAll(res) {
    return res.status(200).json({ 
        success: true, 
        data: {
            players: global.dataStore.players || [],
            tournaments: global.dataStore.tournaments || [],
            activeTournament: global.dataStore.activeTournament || null,
            adminExists: global.dataStore.adminExists || false,
        },
        lastUpdate: global.dataStore.lastUpdate
    });
}

function handleDelete(key, res) {
    delete global.dataStore[key];
    global.dataStore.lastUpdate = Date.now();
    
    return res.status(200).json({ 
        success: true,
        lastUpdate: global.dataStore.lastUpdate
    });
}