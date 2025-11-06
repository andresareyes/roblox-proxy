require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Get cookie from environment variable
const ROBLOSECURITY_COOKIE = process.env.ROBLOSECURITY;

if (!ROBLOSECURITY_COOKIE) {
    console.error('❌ ERROR: ROBLOSECURITY environment variable not set!');
    console.error('Create a .env file with: ROBLOSECURITY=your_cookie_here');
    process.exit(1);
}

console.log('✅ Cookie loaded successfully');

// Create axios instance with authentication
const robloxAPI = axios.create({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.roblox.com/',
        'Origin': 'https://www.roblox.com',
        'Cookie': `.ROBLOSECURITY=${ROBLOSECURITY_COOKIE}`
    }
});

app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Roblox Gamepass Proxy Server - Authenticated',
        authenticated: true
    });
});

app.get('/api/user-gamepasses/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID' 
            });
        }
        
        console.log(`\n=== Fetching gamepasses for user: ${userId} ===`);
        
        // Get user's games
        const gamesUrl = `https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`;
        const gamesResponse = await robloxAPI.get(gamesUrl);
        const games = gamesResponse.data.data;
        
        console.log(`✓ Found ${games.length} games\n`);
        
        const result = [];
        const errors = [];
        let successCount = 0;
        let errorCount = 0;
        
        for (const game of games) {
            console.log(`[${successCount + errorCount + 1}/${games.length}] Checking: "${game.name}"`);
            
            try {
                const passesUrl = `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100&sortOrder=Asc`;
                
                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 300));
                
                const passesResponse = await robloxAPI.get(passesUrl);
                const passes = passesResponse.data.data;
                
                console.log(`   ✓ ${passes.length} gamepasses found`);
                
                if (passes.length > 0) {
                    result.push({
                        gameId: game.id,
                        gameName: game.name,
                        rootPlaceId: game.rootPlaceId,
                        gamepasses: passes.map(pass => ({
                            id: pass.id,
                            name: pass.name,
                            displayName: pass.displayName,
                            price: pass.price
                        }))
                    });
                }
                successCount++;
                
            } catch (error) {
                errorCount++;
                const status = error.response?.status || 'N/A';
                console.log(`   ✗ ERROR: HTTP ${status}`);
                errors.push(`Game ${game.id}: HTTP ${status}`);
            }
        }
        
        console.log(`\n=== Summary ===`);
        console.log(`Successful: ${successCount}, Failed: ${errorCount}, With Passes: ${result.length}`);
        
        res.json({ 
            success: true, 
            userId: parseInt(userId),
            gamesChecked: games.length,
            successfulRequests: successCount,
            failedRequests: errorCount,
            gamesWithPasses: result.length,
            data: result 
        });
        
    } catch (error) {
        console.error('Fatal Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
    console.log(`📍 Test at: http://localhost:${PORT}`);
});

module.exports = app;