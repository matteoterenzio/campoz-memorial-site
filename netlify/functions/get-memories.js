const admin = require('firebase-admin');

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
        console.log('Checking environment variables...');
        console.log('PROJECT_ID:', process.env.FIREBASE_PROJECT_ID);
        console.log('CLIENT_EMAIL:', process.env.FIREBASE_CLIENT_EMAIL);
        console.log('PRIVATE_KEY exists:', !!process.env.FIREBASE_PRIVATE_KEY);

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
        console.log('Firebase initialized successfully');

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
        console.error('Detailed error:', error);
        
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
