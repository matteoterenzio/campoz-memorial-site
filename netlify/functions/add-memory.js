// netlify/functions/add-memory.js
const { readFileSync, writeFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { nome, ricordo, timestamp } = JSON.parse(event.body);

        if (!nome || !ricordo || !timestamp) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Dati mancanti' })
            };
        }

        if (nome.length > 50 || ricordo.length > 500) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nome o ricordo troppo lunghi' })
            };
        }

        const spamWords = ['viagra', 'casino', 'lottery', 'win money', 'click here', 'free money', 'porn', 'sex'];
        const textToCheck = (nome + ' ' + ricordo).toLowerCase();
        const containsSpam = spamWords.some(word => textToCheck.includes(word));
        
        if (containsSpam) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Contenuto non appropriato' })
            };
        }

        const sanitize = (str) => str.replace(/[<>]/g, '');

        const newMemory = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            nome: sanitize(nome.trim()),
            ricordo: sanitize(ricordo.trim()),
            timestamp: new Date(timestamp).toISOString(),
            approved: true
        };

        const dataDir = '/tmp';
        const dataPath = join(dataDir, 'memories.json');

        if (!existsSync(dataDir)) {
            mkdirSync(dataDir, { recursive: true });
        }

        let memories = [];
        
        if (existsSync(dataPath)) {
            try {
                const data = readFileSync(dataPath, 'utf8');
                memories = JSON.parse(data);
            } catch (error) {
                memories = [];
            }
        }

        memories.push(newMemory);

        if (memories.length > 100) {
            memories = memories.slice(-100);
        }

        writeFileSync(dataPath, JSON.stringify(memories, null, 2));

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Ricordo salvato con successo',
                memory: newMemory
            })
        };

    } catch (error) {
        console.error('Errore nella funzione add-memory:', error);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Errore interno del server' })
        };
    }
};
