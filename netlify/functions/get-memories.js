const admin = require('firebase-admin');

if (!admin.apps.length) {
    // Converti \n in interruzioni di riga reali
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    admin.initializeApp({
        credential: admin.credential.cert({
            type: "service_account",
            project_id: process.env.FIREBASE_PROJECT_ID,
            private_key: privateKey,
            client_email: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: process.env.FIREBASE_PROJECT_ID
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
            body: JSON.stringify({ 
                error: 'Errore interno del server',
                details: error.message 
            })
        };
    }
};
