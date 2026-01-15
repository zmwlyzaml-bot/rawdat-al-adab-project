const express = require('express');
const axios = require('axios');
const cors = require('cors');
const NodeCache = require('node-cache');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// إعدادات التخزين المؤقت (Cache) لمدة ساعة
const cache = new NodeCache({ stdTTL: 3600 });

// إعدادات عداد الزوار (في الذاكرة)
const visitors = new Set();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// قائمة القنوات المطلوبة
const CHANNELS = [
    'Rawwda',
    'QQ_Y8I',
    'gazl30',
    'for47sev'
];

// استبدل هذا بالتوكن الخاص بك عند التشغيل الفعلي
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

/**
 * تنظيف وتصفية النصوص بناءً على القواعد الصارمة
 */
function cleanText(text) {
    if (!text) return null;

    // استبعاد النصوص التي تحتوي على روابط أو معرفات تواصل اجتماعي
    const socialPatterns = [
        /http[s]?:\/\//i,
        /www\./i,
        /@[a-zA-Z0-9_]+/i,
        /تواصل معنا/i,
        /واتساب/i,
        /تليجرام/i,
        /انستقرام/i,
        /تويتر/i,
        /تابعنا/i,
        /للمزيد/i,
        /Telegram/i,
        /WhatsApp/i,
        /Instagram/i
    ];

    if (socialPatterns.some(pattern => pattern.test(text))) {
        return null;
    }

    let cleaned = text;

    // إزالة الأرقام (العربية والإنجليزية)
    cleaned = cleaned.replace(/[0-9٠-٩]/g, '');

    // إزالة الرموز الزخرفية والعشوائية (مع الإبقاء على الإيموجي وعلامات الترقيم الأساسية)
    // ملاحظة: هذا النمط يحاول الحفاظ على الحروف العربية والمسافات والإيموجي
    cleaned = cleaned.replace(/[^\u0600-\u06FF\s\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/gu, '');
    
    // إزالة رموز HTML الكيانية الشائعة التي قد تتبقى
    cleaned = cleaned.replace(/&[a-z]+;/gi, '');
    
    // إزالة المسافات الزائدة
    cleaned = cleaned.trim().replace(/\s+/g, ' ');

    return cleaned.length > 10 ? cleaned : null;
}

/**
 * جلب المنشورات من تليجرام
 * ملاحظة: بما أننا نستخدم Bot API، سنحتاج لاستخدام getUpdates أو Webhook.
 * ولكن لجلب منشورات القنوات العامة، الطريقة الأفضل هي استخدام Telegram Database Library (TDLib) 
 * أو كشط الصفحة العامة إذا لم يتوفر توكن بوت بصلاحيات أدمن.
 * هنا سنحاكي الجلب من خلال API افتراضي أو كشط بسيط للصفحة العامة للقناة.
 */
async function fetchChannelTexts(channelName) {
    try {
        // محاكاة جلب البيانات من صفحة القناة العامة (t.me/s/channelname)
        // هذه الطريقة لا تتطلب توكن بوت وتعمل مع القنوات العامة
        const response = await axios.get(`https://t.me/s/${channelName}`);
        const html = response.data;
        
        // استخراج النصوص من HTML (منشورات تليجرام تكون في div class="tgme_widget_message_text")
        const texts = [];
        const regex = /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g;
        let match;
        
        while ((match = regex.exec(html)) !== null) {
            let rawText = match[1]
                .replace(/<br\s*\/?>/gi, '\n') // تحويل <br> إلى سطر جديد
                .replace(/<[^>]+>/g, '') // إزالة أي وسم HTML آخر
                .replace(/&quot;/g, '"')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>');
            
            const cleaned = cleanText(rawText);
            if (cleaned) {
                texts.push(cleaned);
            }
        }
        return texts;
    } catch (error) {
        console.error(`Error fetching from ${channelName}:`, error.message);
        return [];
    }
}

// API للحصول على النصوص
app.get('/api/texts', async (req, res) => {
    let allTexts = cache.get('all_texts');
    
    if (!allTexts) {
        allTexts = [];
        for (const channel of CHANNELS) {
            const channelTexts = await fetchChannelTexts(channel);
            allTexts.push(...channelTexts);
        }
        
        // إزالة التكرار
        allTexts = [...new Set(allTexts)];
        cache.set('all_texts', allTexts);
    }
    
    res.json(allTexts);
});

// API لعداد الزوار
app.get('/api/visit', (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    // تجاهل localhost (127.0.0.1 أو ::1)
    if (ip !== '127.0.0.1' && ip !== '::1' && ip !== 'localhost') {
        visitors.add(ip);
    }
    
    res.json({ count: visitors.size });
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
