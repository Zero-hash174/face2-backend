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

    // الهيكل الأساسي للرسالة
    const message = {
        token: token,
        data: data || {}, // البيانات ستُمرر إلى MainActivity عند النقر
        android: { priority: 'high' }
    };

    if (isCall && data.type === 'call_offer') {
        // 🔥 إجبار خدمات جوجل على إظهار الإشعار حتى لو كان التطبيق مقتولاً 🔥
        message.notification = { 
            title: "📞 مكالمة واردة", 
            body: `لديك مكالمة من ${data.callerName}` 
        };
        message.android.notification = {
            channel_id: 'face2_incoming_call_v4_no_sound', // يجب أن يطابق الموجود في التطبيق
            default_vibrate_timings: true,
            default_sound: true
        };
    } else if (title || body) {
        // رسائل الدردشة العادية
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
        console.error("FCM Error:", error);
        res.status(500).send({ success: false, error: error.message });
    }
});

module.exports = app;
