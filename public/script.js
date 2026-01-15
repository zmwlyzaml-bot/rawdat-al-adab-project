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

    // --- جلب النصوص الأدبية ---
    async function fetchTexts() {
        try {
            const response = await fetch('/api/texts');
            const texts = await response.json();
            
            if (texts && texts.length > 0) {
                // اختيار نص عشوائي
                const randomIndex = Math.floor(Math.random() * texts.length);
                literaryText.innerText = texts[randomIndex];
            } else {
                literaryText.innerText = "لا توجد نصوص متاحة حالياً. يرجى المحاولة لاحقاً.";
            }
        } catch (error) {
            console.error('Error fetching texts:', error);
            literaryText.innerText = "حدث خطأ أثناء تحميل النصوص.";
        }
    }

    // --- إدارة عداد الزوار ---
    async function updateVisitorCount() {
        try {
            const response = await fetch('/api/visit');
            const data = await response.json();
            visitorCountElement.innerText = data.count;
        } catch (error) {
            console.error('Error updating visitor count:', error);
        }
    }

    // التنفيذ عند التحميل
    fetchTexts();
    updateVisitorCount();
});
