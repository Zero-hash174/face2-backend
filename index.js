const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// قراءة المفتاح الخاص من متغيرات البيئة التي سيتم إعدادها في Vercel
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

app.post('/send-notification', async (req, res) => {
    const { token, title, body, data } = req.body;

    if (!token) return res.status(400).send('Token is required');

    const message = {
        token: token,
        data: data || {},
        android: { priority: 'high' }
    };

    if (title || body) {
        message.notification = { title, body };
        message.android.notification = {
            channel_id: 'face2_msg_v16_custom',
            sound: 'incoming_message',
            default_sound: false,
            default_vibrate_timings: true
        };
    }

    try {
        const response = await admin.messaging().send(message);
        res.status(200).send({ success: true, response });
    } catch (error) {
        res.status(500).send({ success: false, error: error.message });
    }
});

// تصدير التطبيق بدلاً من الاستماع المباشر لمنفذ محلي لتوافقه مع Vercel
module.exports = app;
