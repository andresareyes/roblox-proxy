const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Roblox Gamepass Proxy Server' 
    });
});

// Get all gamepasses from a user's games
app.get('/api/user-gamepasses/:userId', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Get user's games
        const gamesResponse = await robloxAPI.get(
            `https://games.roblox.com/v2/users/${userId}/games?limit=50`
        );
        
        const result = [];
        
        for (const game of gamesResponse.data.data) {
            try {
                // Try using catalog API instead
                const catalogUrl = `https://catalog.roblox.com/v1/search/items/details`;
                
                const catalogResponse = await robloxAPI.post(catalogUrl, {
                    itemIds: [],
                    keyword: "",
                    limit: 100,
                    creatorTargetId: game.creator.id,
                    creatorType: game.creator.type
                });
                
                // Filter for passes only
                const passes = catalogResponse.data.data.filter(item => 
                    item.itemType === "GamePass"
                );
                
                if (passes.length > 0) {
                    result.push({
                        gameId: game.id,
                        gameName: game.name,
                        gamepasses: passes
                    });
                }
                
            } catch (error) {
                console.log(`Error for game ${game.id}:`, error.message);
            }
        }
        
        res.json({ success: true, data: result });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;