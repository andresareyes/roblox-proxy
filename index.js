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
        
        // Validate userId
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid user ID' 
            });
        }
        
        console.log(`Fetching gamepasses for user: ${userId}`);
        
        // Get user's games
        const gamesResponse = await axios.get(
            `https://games.roblox.com/v2/users/${userId}/games?limit=50&sortOrder=Asc`
        );
        
        const games = gamesResponse.data.data;
        const result = [];
        
        // Get gamepasses for each game
        for (const game of games) {
            try {
                const passesResponse = await axios.get(
                    `https://games.roblox.com/v1/games/${game.id}/game-passes?limit=100&sortOrder=Asc`
                );
                
                if (passesResponse.data.data.length > 0) {
                    result.push({
                        gameId: game.id,
                        gameName: game.name,
                        rootPlaceId: game.rootPlaceId,
                        gamepasses: passesResponse.data.data.map(pass => ({
                            id: pass.id,
                            name: pass.name,
                            displayName: pass.displayName,
                            price: pass.price
                        }))
                    });
                }
            } catch (error) {
                console.error(`Error fetching passes for game ${game.id}:`, error.message);
            }
        }
        
        res.json({ 
            success: true, 
            userId: parseInt(userId),
            gamesChecked: games.length,
            gamesWithPasses: result.length,
            data: result 
        });
        
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;