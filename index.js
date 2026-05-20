const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

// قراءة المفتاح الخاص من متغيرات البيئة في Vercel
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

app.post('/send-notification', async (req, res) => {
    const { token, title, body, data } = req.body;

    if (!token) return res.status(400).send('Token is required');

    // التحقق من نوع الحدث (مكالمة أم لا)
    const isCall = data && (data.type === 'call_offer' || data.type === 'call_hangup');

    // الهيكل الأساسي للرسالة (الأولوية العالية مطلوبة دائماً)
    const message = {
        token: token,
        data: data || {},
        android: { priority: 'high' }
    };

    if (isCall) {
        // 🟢 إذا كانت مكالمة:
        // نرسلها كـ Pure Data Message فقط لإيقاظ أندرويد 14 في الخلفية.
        // لا نقوم بإضافة message.notification نهائياً هنا.
    } else if (title || body) {
        // 🔵 إذا كانت رسالة دردشة عادية:
        // نضيف قسم الإشعارات لكي يظهر للمستخدم بشكل طبيعي
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

// تصدير التطبيق ليتوافق مع Vercel
module.exports = app;
