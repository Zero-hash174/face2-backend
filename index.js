const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

app.post('/send-notification', async (req, res) => {
    const { token, title, body, data } = req.body;

    if (!token) return res.status(400).send('Token is required');

    const isCall = data && (data.type === 'call_offer' || data.type === 'call_hangup');

    const message = {
        token: token,
        data: data || {}, 
        android: { priority: 'high' }
    };

    // ❌ احذف هذا الجزء تماماً للمكالمات لكي يستيقظ التطبيق في الخلفية
    /*
    if (isCall && data.type === 'call_offer') {
        message.notification = { title: "📞 مكالمة واردة", body: `لديك مكالمة من ${data.callerName}` };
        message.android.notification = { ... };
    }
    */
   
    // ✅ احتفظ بالإشعارات لرسائل الدردشة العادية فقط
    if (!isCall && (title || body)) {
        message.notification = { title, body };
        message.android.notification = {
            channelId: 'face2_msg_v16_custom',
            sound: 'incoming_message',
            defaultSound: false,
            defaultVibrateTimings: true
        };
    }

    try {
        const response = await admin.messaging().send(message);
        res.status(200).send({ success: true, response });
    } catch (error) {
        console.error("FCM Error:", error);
        res.status(500).send({ success: false, error: error.message });
    }
});

module.exports = app;
