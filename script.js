document.addEventListener('DOMContentLoaded', () => {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');
    const literaryText = document.getElementById('literary-text');
    const visitorCountElement = document.getElementById('visitor-count');

    // --- إدارة الوضع الليلي/النهاري ---
    const currentTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);

    themeToggle.addEventListener('click', () => {
        let theme = document.documentElement.getAttribute('data-theme');
        let newTheme = theme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    function updateThemeIcon(theme) {
        if (theme === 'dark') {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
    }

    // --- جلب النصوص الأدبية مباشرة من تليجرام (نسخة GitHub Pages) ---
    const CHANNELS = ['Rawwda', 'QQ_Y8I', 'gazl30', 'for47sev'];

    function cleanText(text) {
        if (!text) return null;
        const socialPatterns = [/http/i, /www\./i, /@[a-zA-Z]/i, /تواصل/i, /واتساب/i, /تليجرام/i, /تابعنا/i, /للمزيد/i];
        if (socialPatterns.some(pattern => pattern.test(text))) return null;
        let cleaned = text.replace(/[0-9٠-٩]/g, '');
        cleaned = cleaned.replace(/[^\u0600-\u06FF\s\u2000-\u206F\u2E00-\u2E7F'!"#$%&()*+,\-./:;<=>?@[\]^_`{|}~]/gu, '');
        cleaned = cleaned.replace(/&[a-z]+;/gi, '');
        cleaned = cleaned.trim().replace(/\s+/g, ' ');
        return cleaned.length > 10 ? cleaned : null;
    }

    async function fetchFromTelegram() {
        let allTexts = [];
        try {
            for (const channel of CHANNELS) {
                // استخدام خدمة وكيل (Proxy) لتجاوز قيود CORS عند الجلب من المتصفح
                const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(`https://t.me/s/${channel}`)}`);
                const data = await response.json();
                const html = data.contents;
                
                const regex = /<div class="tgme_widget_message_text[^>]*>([\s\S]*?)<\/div>/g;
                let match;
                while ((match = regex.exec(html)) !== null) {
                    let rawText = match[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '');
                    const cleaned = cleanText(rawText);
                    if (cleaned) allTexts.push(cleaned);
                }
            }
            
            if (allTexts.length > 0) {
                const randomIndex = Math.floor(Math.random() * allTexts.length);
                literaryText.innerText = allTexts[randomIndex];
            } else {
                literaryText.innerText = "لا توجد نصوص متاحة حالياً.";
            }
        } catch (error) {
            literaryText.innerText = "حدث خطأ أثناء تحميل النصوص.";
        }
    }

    // --- محاكاة عداد الزوار (لأن GitHub Pages ثابتة) ---
    function updateVisitorCount() {
        let count = localStorage.getItem('visitor_count') || Math.floor(Math.random() * 100) + 50;
        count = parseInt(count) + 1;
        localStorage.setItem('visitor_count', count);
        visitorCountElement.innerText = count;
    }

    fetchFromTelegram();
    updateVisitorCount();
});
