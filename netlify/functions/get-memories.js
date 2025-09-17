// netlify/functions/get-memories.js
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const dataPath = join('/tmp', 'memories.json');
        let memories = [];

        if (existsSync(dataPath)) {
            try {
                const data = readFileSync(dataPath, 'utf8');
                const allMemories = JSON.parse(data);
                memories = allMemories.filter(memory => memory.approved === true);
                memories.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            } catch (error) {
                memories = [];
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(memories)
        };

    } catch (error) {
        console.error('Errore nella funzione get-memories:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Errore interno del server' })
        };
    }
};
