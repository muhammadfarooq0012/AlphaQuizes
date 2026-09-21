/* ═══════════════════════════════════════════════════════════════
   APP.JS — Main Application Controller
   SPA router, page renderers, sidebar, search, dark mode, UI logic
   ═══════════════════════════════════════════════════════════════ */

/**
 * App — Main application controller.
 * Manages hash-based routing, page rendering, and all UI interactions.
 */
const App = (() => {
    // ─── DOM References ───
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => document.querySelectorAll(sel);
    const LOGO_PATH = 'assets/logo.jpg';

    let mainContent, sidebar, sidebarOverlay, navbar, searchInput, searchResults,
        searchContainer, searchClear, scrollTopBtn, darkModeBtn, donateBtn,
        donateModal, donateModalClose, hamburgerBtn, sidebarCloseBtn, loadingScreen;

    // ─── State ───
    let _currentPage = 'home';

    // ─── Initialization ───

    /**
     * Boot the application.
     */
    async function init() {
        // Cache DOM elements
        _cacheDOMElements();

        // Set auto-year in footer and sidebar
        _setAutoYear();

        // Initialize dark mode from localStorage
        _initDarkMode();

        // Set up event listeners
        _bindEvents();

        // Load initial data and dismiss loading screen
        try {
            await DataLoader.loadConfig();
        } catch (err) {
            console.error('[App] Failed to load config:', err);
        }

        // Dismiss loading screen after a slight delay for polish
        setTimeout(() => {
            if (loadingScreen) loadingScreen.classList.add('hidden');
        }, 800);

        // Handle initial route
        _handleRoute();
    }

    /**
     * Cache frequently accessed DOM elements.
     */
    function _cacheDOMElements() {
        mainContent = $('#main-content');
        sidebar = $('#sidebar');
        sidebarOverlay = $('#sidebar-overlay');
        navbar = $('#navbar');
        searchInput = $('#search-input');
        searchResults = $('#search-results');
        searchContainer = $('#search-container');
        searchClear = $('#search-clear');
        scrollTopBtn = $('#scroll-top');
        darkModeBtn = $('#dark-mode-toggle');
        donateBtn = $('#donate-btn');
        donateModal = $('#donate-modal');
        donateModalClose = $('#donate-modal-close');
        hamburgerBtn = $('#hamburger');
        sidebarCloseBtn = $('#sidebar-close');
        loadingScreen = $('#loading-screen');
    }

    /**
     * Set copyright year in all .auto-year elements.
     */
    function _setAutoYear() {
        const year = new Date().getFullYear();
        $$('.auto-year').forEach(el => el.textContent = year);
    }


    // ═══════════════════════════════════════════════════════════
    // ROUTING
    // ═══════════════════════════════════════════════════════════

    /**
     * Parse the URL hash and route to the correct page.
     */
    function _handleRoute() {
        const hash = window.location.hash.slice(1) || 'home';
        const parts = hash.split('/');
        const page = parts[0];

        // Close sidebar on navigation (mobile)
        _closeSidebar();
        _closeDonateModal();

        switch (page) {
            case 'home':
                _currentPage = 'home';
                _renderHome();
                break;
            case 'subjects':
                _currentPage = 'subjects';
                _renderSubjects();
                break;
            case 'chapters':
                _currentPage = 'chapters';
                _renderChapters(decodeURIComponent(parts[1] || ''));
                break;
            case 'quiz':
                _currentPage = 'quiz';
                _renderQuizPage(decodeURIComponent(parts[1] || ''), decodeURIComponent(parts[2] || ''));
                break;
            case 'about':
                _currentPage = 'about';
                _renderAbout();
                break;
            case 'contact':
                _currentPage = 'contact';
                _renderContact();
                break;
            default:
                _currentPage = 'home';
                _renderHome();
        }

        // Update sidebar active state
        _updateSidebarActive();

        // Scroll to top on page change
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    // ═══════════════════════════════════════════════════════════
    // PAGE RENDERERS
    // ═══════════════════════════════════════════════════════════

    /**
     * Render the Home page: Hero + Stats + Owners + Subjects preview.
     */
    async function _renderHome() {
        _updateBreadcrumb([{ label: 'Home' }]);

        // Show loading initially
        mainContent.innerHTML = `<div class="content-loader"><div class="spinner"></div><p>Loading...</p></div>`;

        try {
            const subjects = await DataLoader.getSubjects();
            const stats = await DataLoader.getStats();

            mainContent.innerHTML = `
                <div class="page-transition">
                    <!-- ═══ Hero Section ═══ -->
                    <section class="hero">
                        <div class="hero-shape"></div>
                        <div class="hero-shape"></div>
                        <div class="hero-shape"></div>
                        <div class="hero-shape"></div>
                        <div class="hero-content">
                            <div class="hero-logo">
                                <img src="${LOGO_PATH}" alt="Alpha Nursing Academy logo"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <i class="fas fa-heartbeat hero-logo-fallback"></i>
                            </div>
                            <h1>Alpha Nursing Academy</h1>
                            <p class="hero-tagline">Learn • Practice • Succeed</p>
                            <div class="hero-buttons">
                                <a href="#subjects" class="btn btn-lg btn-primary">
                                    <i class="fas fa-play"></i>
                                    Start Learning
                                </a>
                                <a href="#subjects" class="btn btn-lg btn-outline">
                                    <i class="fas fa-book"></i>
                                    Subjects
                                </a>
                            </div>
                        </div>
                    </section>

                    <!-- ═══ Stats Section ═══ -->
                    <section class="section">
                        <div class="stats-row">
                            <div class="stat-card animate-in">
                                <i class="fas fa-book"></i>
                                <span class="stat-number">${stats.totalSubjects}</span>
                                <span class="stat-label">Subjects</span>
                            </div>
                            <div class="stat-card animate-in">
                                <i class="fas fa-file-alt"></i>
                                <span class="stat-number">${stats.totalChapters}</span>
                                <span class="stat-label">Chapters</span>
                            </div>
                            <div class="stat-card animate-in">
                                <i class="fas fa-user-graduate"></i>
                                <span class="stat-number">∞</span>
                                <span class="stat-label">Students</span>
                            </div>
                            <div class="stat-card animate-in">
                                <i class="fas fa-award"></i>
                                <span class="stat-number">100%</span>
                                <span class="stat-label">Free Access</span>
                            </div>
                        </div>

                        <!-- ═══ Directors Section ═══ -->
                        <div class="section-header">
                            <div class="section-badge">
                                <i class="fas fa-star"></i>
                                Leadership
                            </div>
                            <h2 class="section-title">Our Directors</h2>
                            <p class="section-subtitle">Meet the visionaries behind Alpha Nursing Academy</p>
                        </div>
                        <div class="owners-grid">
                            <div class="owner-card animate-in">
                                <div class="owner-avatar">
                                    <i class="fas fa-user-tie"></i>
                                </div>
                                <h3>M. Sarfraz</h3>
                                <div class="owner-role">
                                    <i class="fas fa-crown"></i>
                                    Director
                                </div>
                                <a href="tel:03357851085" class="owner-phone">
                                    <i class="fas fa-phone-alt"></i>
                                    0335-7851085
                                </a>
                            </div>
                            <div class="owner-card animate-in">
                                <div class="owner-avatar">
                                    <i class="fas fa-user-tie"></i>
                                </div>
                                <h3>M. Farooq</h3>
                                <div class="owner-role">
                                    <i class="fas fa-crown"></i>
                                    Director
                                </div>
                                <a href="tel:03225307355" class="owner-phone">
                                    <i class="fas fa-phone-alt"></i>
                                    0322-5307355
                                </a>
                            </div>
                        </div>
                    </section>

                    <!-- ═══ Subjects Preview Section ═══ -->
                    <section class="section">
                        <div class="section-header">
                            <div class="section-badge">
                                <i class="fas fa-graduation-cap"></i>
                                Courses
                            </div>
                            <h2 class="section-title">Browse Subjects</h2>
                            <p class="section-subtitle">Choose a subject to start your exam preparation</p>
                        </div>
                        <div class="subjects-grid">
                            ${subjects.map((s, i) => _subjectCardHTML(s, i)).join('')}
                        </div>
                    </section>
                </div>
            `;

        } catch (error) {
            mainContent.innerHTML = `
                <div class="page-transition">
                    <section class="hero">
                        <div class="hero-shape"></div>
                        <div class="hero-shape"></div>
                        <div class="hero-content">
                            <div class="hero-logo">
                                <img src="${LOGO_PATH}" alt="Alpha Nursing Academy logo"
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <i class="fas fa-heartbeat hero-logo-fallback"></i>
                            </div>
                            <h1>Alpha Nursing Academy</h1>
                            <p class="hero-tagline">Learn • Practice • Succeed</p>
                        </div>
                    </section>
                    <section class="section">
                        <div class="error-state">
                            <div class="error-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                            <h3>Could Not Load Subjects</h3>
                            <p>${error.message}</p>
                            <button class="btn btn-primary" onclick="window.location.reload()">
                                <i class="fas fa-redo"></i> Retry
                            </button>
                        </div>
                    </section>
                </div>
            `;
        }
    }

    /**
     * Render the Subjects page.
     */
    async function _renderSubjects() {
        _updateBreadcrumb([
            { label: 'Home', href: '#home' },
            { label: 'Subjects' }
        ]);

        mainContent.innerHTML = `<div class="content-loader"><div class="spinner"></div><p>Loading subjects...</p></div>`;

        try {
            const subjects = await DataLoader.getSubjects();

            mainContent.innerHTML = `
                <div class="page-transition">
                    <section class="section">
                        <div class="section-header">
                            <div class="section-badge">
                                <i class="fas fa-graduation-cap"></i>
                                All Courses
                            </div>
                            <h2 class="section-title">Choose a Subject</h2>
                            <p class="section-subtitle">Select a subject to view its chapters and start studying</p>
                        </div>
                        ${subjects.length > 0 ? `
                            <div class="subjects-grid">
                                ${subjects.map((s, i) => _subjectCardHTML(s, i)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-book-open empty-state-icon"></i>
                                <h3>No Subjects Available</h3>
                                <p>No subjects have been configured yet. Please check back later.</p>
                            </div>
                        `}
                    </section>
                </div>
            `;
        } catch (error) {
            _renderPageError('Failed to load subjects', error.message);
        }
    }

    /**
     * Render the Chapters page for a specific subject.
     * @param {string} subjectFolder - The subject folder name
     */
    async function _renderChapters(subjectFolder) {
        if (!subjectFolder) {
            window.location.hash = '#subjects';
            return;
        }

        mainContent.innerHTML = `<div class="content-loader"><div class="spinner"></div><p>Loading chapters...</p></div>`;

        try {
            const subject = await DataLoader.getSubject(subjectFolder);
            if (!subject) {
                _renderPageError('Subject Not Found', `The subject "${subjectFolder}" could not be found.`);
                return;
            }

            const chapters = subject.chapters || [];

            _updateBreadcrumb([
                { label: 'Home', href: '#home' },
                { label: 'Subjects', href: '#subjects' },
                { label: subject.name }
            ]);

            mainContent.innerHTML = `
                <div class="page-transition">
                    <section class="section">
                        <button class="back-button" onclick="window.location.hash='#subjects'">
                            <i class="fas fa-arrow-left"></i>
                            Back to Subjects
                        </button>

                        <div class="section-header">
                            <div class="section-badge" style="background: ${subject.color}20; color: ${subject.color};">
                                <i class="fas ${subject.icon}"></i>
                                ${subject.name}
                            </div>
                            <h2 class="section-title">${subject.name} — Chapters</h2>
                            <p class="section-subtitle">${chapters.length} chapter${chapters.length !== 1 ? 's' : ''} available for study</p>
                        </div>

                        ${chapters.length > 0 ? `
                            <div class="chapters-grid">
                                ${chapters.map((ch, i) => {
                                    const chapterName = DataLoader.formatChapterName(ch);
                                    return `
                                        <a href="#quiz/${encodeURIComponent(subjectFolder)}/${encodeURIComponent(ch)}"
                                           class="chapter-card animate-in" style="animation-delay: ${i * 0.05}s">
                                            <div class="chapter-icon" style="background: ${subject.color}15; color: ${subject.color};">
                                                <i class="fas fa-file-alt"></i>
                                            </div>
                                            <div class="chapter-info">
                                                <h3>${chapterName}</h3>
                                                <p>Tap to start studying</p>
                                            </div>
                                            <div class="chapter-start-btn">
                                                <i class="fas fa-play"></i>
                                            </div>
                                        </a>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <i class="fas fa-folder-open empty-state-icon"></i>
                                <h3>No Chapters Yet</h3>
                                <p>No chapters have been added to ${subject.name} yet.</p>
                                <a href="#subjects" class="btn btn-primary mt-2">
                                    <i class="fas fa-arrow-left"></i> Back to Subjects
                                </a>
                            </div>
                        `}
                    </section>
                </div>
            `;
        } catch (error) {
            _renderPageError('Failed to load chapters', error.message);
        }
    }

    /**
     * Render the Quiz page.
     * @param {string} subjectFolder - Subject folder name
     * @param {string} chapterFile - Chapter file name
     */
    async function _renderQuizPage(subjectFolder, chapterFile) {
        if (!subjectFolder || !chapterFile) {
            window.location.hash = '#subjects';
            return;
        }

        try {
            const subject = await DataLoader.getSubject(subjectFolder);
            const subjectName = subject ? subject.name : subjectFolder;
            const chapterName = DataLoader.formatChapterName(chapterFile);

            _updateBreadcrumb([
                { label: 'Home', href: '#home' },
                { label: 'Subjects', href: '#subjects' },
                { label: subjectName, href: `#chapters/${encodeURIComponent(subjectFolder)}` },
                { label: chapterName }
            ]);

            // Delegate to QuizEngine
            await QuizEngine.start({
                subjectFolder,
                chapterFile,
                subjectName,
                chapterName,
                container: mainContent
            });

        } catch (error) {
            _renderPageError('Quiz Error', error.message);
        }
    }

    /**
     * Render the About page.
     */
    function _renderAbout() {
        _updateBreadcrumb([
            { label: 'Home', href: '#home' },
            { label: 'About Academy' }
        ]);

        mainContent.innerHTML = `
            <div class="page-transition">
                <div class="about-hero">
                    <h1><i class="fas fa-heartbeat"></i> About Alpha Nursing Academy</h1>
                    <p>Dedicated to shaping the future of nursing education</p>
                </div>
                <div class="about-content">
                    <div class="about-card animate-in">
                        <h2><i class="fas fa-bullseye"></i> Our Mission</h2>
                        <p>Alpha Nursing Academy is committed to providing high-quality nursing education and exam preparation resources. Our platform offers comprehensive study materials, practice quizzes, and interactive learning tools to help aspiring nurses excel in their examinations.</p>
                        <p>We believe that accessible, well-structured educational content is the key to success. Every student deserves the opportunity to learn, practice, and succeed in their nursing career.</p>
                    </div>

                    <div class="about-card animate-in">
                        <h2><i class="fas fa-lightbulb"></i> What We Offer</h2>
                        <div class="about-features">
                            <div class="about-feature">
                                <i class="fas fa-book-reader"></i>
                                <h4>Study Material</h4>
                                <p>Comprehensive chapter-wise content</p>
                            </div>
                            <div class="about-feature">
                                <i class="fas fa-tasks"></i>
                                <h4>Practice Quizzes</h4>
                                <p>MCQs with correct answers highlighted</p>
                            </div>
                            <div class="about-feature">
                                <i class="fas fa-mobile-alt"></i>
                                <h4>Mobile Friendly</h4>
                                <p>Study anytime, anywhere</p>
                            </div>
                            <div class="about-feature">
                                <i class="fas fa-lock-open"></i>
                                <h4>Free Access</h4>
                                <p>All content is completely free</p>
                            </div>
                        </div>
                    </div>

                    <div class="about-card animate-in">
                        <h2><i class="fas fa-users"></i> Our Team</h2>
                        <p>Alpha Nursing Academy is led by <strong>M. Sarfraz</strong> and <strong>M. Farooq</strong>, experienced educators dedicated to empowering the next generation of nurses. Their combined expertise in nursing education drives our mission to provide the best possible exam preparation platform.</p>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render the Contact page.
     */
    function _renderContact() {
        _updateBreadcrumb([
            { label: 'Home', href: '#home' },
            { label: 'Contact Us' }
        ]);

        mainContent.innerHTML = `
            <div class="page-transition">
                <div class="about-hero">
                    <h1><i class="fas fa-phone-alt"></i> Contact Us</h1>
                    <p>Get in touch with Alpha Nursing Academy</p>
                </div>
                <div class="contact-content">
                    <div class="section-header">
                        <h2 class="section-title">Our Directors</h2>
                        <p class="section-subtitle">Feel free to reach out for any inquiries</p>
                    </div>
                    <div class="contact-cards">
                        <div class="contact-card animate-in">
                            <div class="contact-card-icon">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <h3>M. Sarfraz</h3>
                            <span class="role">Director</span>
                            <a href="tel:03357851085" class="phone-link">
                                <i class="fas fa-phone-alt"></i>
                                0335-7851085
                            </a>
                        </div>
                        <div class="contact-card animate-in">
                            <div class="contact-card-icon">
                                <i class="fas fa-user-tie"></i>
                            </div>
                            <h3>M. Farooq</h3>
                            <span class="role">Director</span>
                            <a href="tel:03225307355" class="phone-link">
                                <i class="fas fa-phone-alt"></i>
                                0322-5307355
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }


    // ═══════════════════════════════════════════════════════════
    // HTML HELPERS
    // ═══════════════════════════════════════════════════════════

    /**
     * Generate HTML for a subject card.
     * @param {Object} subject - Subject data object
     * @param {number} index - Index for animation delay
     * @returns {string} HTML string
     */
    function _subjectCardHTML(subject, index) {
        const chapterCount = subject.chapters ? subject.chapters.length : 0;
        return `
            <a href="#chapters/${encodeURIComponent(subject.folder)}"
               class="subject-card animate-in" style="animation-delay: ${index * 0.05}s">
                <div class="subject-icon" style="background: ${subject.color || 'var(--primary)'};">
                    <i class="fas ${subject.icon || 'fa-book'}"></i>
                </div>
                <h3>${subject.name}</h3>
                <div class="subject-chapters-count">
                    <i class="fas fa-layer-group"></i>
                    ${chapterCount} Chapter${chapterCount !== 1 ? 's' : ''}
                </div>
            </a>
        `;
    }

    /**
     * Render a generic page error.
     */
    function _renderPageError(title, message) {
        mainContent.innerHTML = `
            <div class="page-transition">
                <section class="section">
                    <div class="error-state">
                        <div class="error-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                        <h3>${title}</h3>
                        <p>${message}</p>
                        <a href="#home" class="btn btn-primary">
                            <i class="fas fa-home"></i> Go Home
                        </a>
                    </div>
                </section>
            </div>
        `;
    }


    // ═══════════════════════════════════════════════════════════
    // BREADCRUMB
    // ═══════════════════════════════════════════════════════════

    /**
     * Update breadcrumb navigation.
     * @param {Array} items - Array of { label, href? } objects
     */
    function _updateBreadcrumb(items) {
        const breadcrumb = $('#breadcrumb');
        if (!breadcrumb) return;

        let html = '';
        items.forEach((item, i) => {
            if (i > 0) {
                html += '<span class="breadcrumb-separator"><i class="fas fa-chevron-right" style="font-size:0.6rem"></i></span>';
            }
            if (item.href && i < items.length - 1) {
                html += `<a href="${item.href}" class="breadcrumb-item">${i === 0 ? '<i class="fas fa-home"></i> ' : ''}${item.label}</a>`;
            } else {
                html += `<span class="breadcrumb-current">${item.label}</span>`;
            }
        });

        breadcrumb.innerHTML = html;
    }


    // ═══════════════════════════════════════════════════════════
    // SIDEBAR
    // ═══════════════════════════════════════════════════════════

    function _openSidebar() {
        if (sidebar) sidebar.classList.add('active');
        if (sidebarOverlay) sidebarOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function _closeSidebar() {
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function _toggleSidebar() {
        if (sidebar && sidebar.classList.contains('active')) {
            _closeSidebar();
        } else {
            _openSidebar();
        }
    }

    /**
     * Update sidebar active link based on current page.
     */
    function _updateSidebarActive() {
        $$('.sidebar-link').forEach(link => {
            link.classList.remove('active');
            const linkPage = link.getAttribute('data-page');
            if (linkPage === _currentPage ||
                (linkPage === 'subjects' && ['chapters', 'quiz'].includes(_currentPage))) {
                link.classList.add('active');
            }
        });
    }


    // ═══════════════════════════════════════════════════════════
    // DARK MODE
    // ═══════════════════════════════════════════════════════════

    function _initDarkMode() {
        const savedTheme = localStorage.getItem('ana-theme');
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            _updateDarkModeIcon(true);
        }
    }

    function _toggleDarkMode() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const newTheme = isDark ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('ana-theme', newTheme);
        _updateDarkModeIcon(!isDark);
    }

    function _updateDarkModeIcon(isDark) {
        if (darkModeBtn) {
            darkModeBtn.innerHTML = isDark
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    }

    /**
     * Open the donate popup.
     */
    function _openDonateModal() {
        if (!donateModal) return;
        donateModal.classList.add('active');
        donateModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    /**
     * Close the donate popup.
     */
    function _closeDonateModal() {
        if (!donateModal) return;
        donateModal.classList.remove('active');
        donateModal.setAttribute('aria-hidden', 'true');
        if (!sidebar || !sidebar.classList.contains('active')) {
            document.body.style.overflow = '';
        }
    }


    // ═══════════════════════════════════════════════════════════
    // SEARCH
    // ═══════════════════════════════════════════════════════════

    let _searchDebounce = null;

    function _handleSearchInput(e) {
        const query = e.target.value.trim();

        // Show/hide clear button
        if (searchClear) {
            searchClear.style.display = query.length > 0 ? 'flex' : 'none';
        }

        // Debounce search
        clearTimeout(_searchDebounce);
        _searchDebounce = setTimeout(async () => {
            if (query.length < 1) {
                _hideSearchResults();
                return;
            }

            const results = await DataLoader.search(query);
            _showSearchResults(results, query);
        }, 200);
    }

    function _showSearchResults(results, query) {
        if (!searchResults) return;

        if (results.length === 0) {
            searchResults.innerHTML = `
                <div class="search-no-results">
                    <i class="fas fa-search"></i>
                    No results found for "${query}"
                </div>
            `;
        } else {
            searchResults.innerHTML = results.map(r => {
                if (r.type === 'subject') {
                    return `
                        <a href="#chapters/${encodeURIComponent(r.folder)}" class="search-result-item" data-action="navigate">
                            <div class="search-result-icon" style="background: ${r.color || 'var(--primary)'}">
                                <i class="fas ${r.icon || 'fa-book'}"></i>
                            </div>
                            <div class="search-result-info">
                                <div class="search-result-title">${r.name}</div>
                                <div class="search-result-meta">${r.chapterCount} chapter${r.chapterCount !== 1 ? 's' : ''}</div>
                            </div>
                        </a>
                    `;
                } else {
                    return `
                        <a href="#quiz/${encodeURIComponent(r.folder)}/${encodeURIComponent(r.file)}" class="search-result-item" data-action="navigate">
                            <div class="search-result-icon" style="background: ${r.color || 'var(--primary)'}">
                                <i class="fas fa-file-alt"></i>
                            </div>
                            <div class="search-result-info">
                                <div class="search-result-title">${r.name}</div>
                                <div class="search-result-meta">${r.subjectName}</div>
                            </div>
                        </a>
                    `;
                }
            }).join('');
        }

        searchResults.classList.add('active');
    }

    function _hideSearchResults() {
        if (searchResults) searchResults.classList.remove('active');
    }

    function _clearSearch() {
        if (searchInput) searchInput.value = '';
        if (searchClear) searchClear.style.display = 'none';
        _hideSearchResults();
    }


    // ═══════════════════════════════════════════════════════════
    // SCROLL TO TOP
    // ═══════════════════════════════════════════════════════════

    function _handleScroll() {
        // Show/hide scroll-to-top button
        if (scrollTopBtn) {
            if (window.scrollY > 400) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        }

        // Add shadow to navbar on scroll
        if (navbar) {
            if (window.scrollY > 10) {
                navbar.style.boxShadow = 'var(--shadow-md)';
            } else {
                navbar.style.boxShadow = 'none';
            }
        }
    }

    function _scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }


    // ═══════════════════════════════════════════════════════════
    // KEYBOARD SUPPORT
    // ═══════════════════════════════════════════════════════════

    function _handleKeyDown(e) {
        if (e.key === 'Escape' && donateModal && donateModal.classList.contains('active')) {
            _closeDonateModal();
            return;
        }

        // Only handle arrow keys during quiz
        if (_currentPage !== 'quiz' || !QuizEngine.isActive()) return;

        // Don't intercept if user is typing in search
        if (document.activeElement === searchInput) return;

        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            QuizEngine.prev();
        } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            QuizEngine.next();
        }
    }


    // ═══════════════════════════════════════════════════════════
    // EVENT BINDINGS
    // ═══════════════════════════════════════════════════════════

    function _bindEvents() {
        // Hash change (SPA routing)
        window.addEventListener('hashchange', _handleRoute);

        // Scroll events
        window.addEventListener('scroll', _handleScroll, { passive: true });

        // Keyboard navigation
        document.addEventListener('keydown', _handleKeyDown);

        // Hamburger menu
        if (hamburgerBtn) hamburgerBtn.addEventListener('click', _toggleSidebar);

        // Sidebar close
        if (sidebarCloseBtn) sidebarCloseBtn.addEventListener('click', _closeSidebar);

        // Sidebar overlay click to close
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', _closeSidebar);

        // Sidebar link clicks (close sidebar on mobile after navigation)
        $$('.sidebar-link').forEach(link => {
            link.addEventListener('click', () => {
                if (link.id === 'nav-donate') return;
                // Small delay for the transition
                setTimeout(_closeSidebar, 100);
            });
        });

        // Dark mode toggle
        if (darkModeBtn) darkModeBtn.addEventListener('click', _toggleDarkMode);

        // Donate popup
        if (donateBtn) donateBtn.addEventListener('click', _openDonateModal);
        if (donateModalClose) donateModalClose.addEventListener('click', _closeDonateModal);
        if (donateModal) {
            donateModal.addEventListener('click', (e) => {
                if (e.target && e.target.hasAttribute('data-close-donate')) {
                    _closeDonateModal();
                }
            });
        }

        const sidebarDonateBtn = $('#nav-donate');
        if (sidebarDonateBtn) {
            sidebarDonateBtn.addEventListener('click', (e) => {
                e.preventDefault();
                _closeSidebar();
                _openDonateModal();
            });
        }

        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', _handleSearchInput);
            searchInput.addEventListener('focus', () => {
                if (searchInput.value.trim().length > 0) {
                    // Re-trigger search on focus
                    _handleSearchInput({ target: searchInput });
                }
            });
        }

        // Search clear button
        if (searchClear) searchClear.addEventListener('click', _clearSearch);

        // Click outside search to close results
        document.addEventListener('click', (e) => {
            if (searchContainer && !searchContainer.contains(e.target)) {
                _hideSearchResults();
            }
        });

        // Search result click — close search and navigate
        if (searchResults) {
            searchResults.addEventListener('click', (e) => {
                const item = e.target.closest('.search-result-item');
                if (item) {
                    _clearSearch();
                }
            });
        }

        // Scroll to top button
        if (scrollTopBtn) scrollTopBtn.addEventListener('click', _scrollToTop);
    }


    // ─── Expose Public API ───
    return { init };
})();


// ─── Boot the application when DOM is ready ───
document.addEventListener('DOMContentLoaded', App.init);
