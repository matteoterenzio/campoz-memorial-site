const admin = require('firebase-admin');

// Inizializza Firebase Admin (solo una volta)
if (!admin.apps.length) {
    const serviceAccount = require('../../firebase-service-account.json');
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: 'campoz-memorial'
    });
}

const db = admin.firestore();

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
        // Recupera i ricordi da Firestore
        const snapshot = await db.collection('memories')
            .where('approved', '==', true)
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const memories = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            memories.push({
                id: doc.id,
                nome: data.nome,
                ricordo: data.ricordo,
                timestamp: data.timestamp.toDate().toISOString()
            });
        });

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
