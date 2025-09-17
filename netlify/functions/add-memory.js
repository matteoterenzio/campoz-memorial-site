const admin = require('firebase-admin');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
    });
}

const db = admin.firestore();

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
            nome: sanitize(nome.trim()),
            ricordo: sanitize(ricordo.trim()),
            timestamp: admin.firestore.Timestamp.fromDate(new Date(timestamp)),
            approved: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await db.collection('memories').add(newMemory);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                success: true, 
                message: 'Ricordo salvato con successo',
                id: docRef.id
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
