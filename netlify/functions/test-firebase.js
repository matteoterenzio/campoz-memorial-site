exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL ? "presente" : "mancante",
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? "presente" : "mancante",
            privateKeyStart: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.substring(0, 30) + "..." : "nulla"
        })
    };
};
