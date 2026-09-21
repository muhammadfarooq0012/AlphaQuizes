/* ═══════════════════════════════════════════════════════════════
   LOADER.JS — Data Loading & Configuration Module
   Handles fetching subjects config and quiz JSON data
   ═══════════════════════════════════════════════════════════════ */

/**
 * DataLoader — Singleton module for managing data fetching.
 * Loads subjects-config.json and individual chapter quiz files.
 */
const DataLoader = (() => {
    // ─── Private State ───
    let _config = null;      // Cached subjects config
    let _cache = {};          // Cache for fetched quiz data: { "subject/chapter": [...] }
    const CONFIG_PATH = 'subjects-config.json';
    const QUIZES_DIR = 'Quizes';

    // ─── Public API ───

    /**
     * Load the subjects configuration file.
     * Caches result for subsequent calls.
     * @returns {Promise<Object>} The config object with a `subjects` array.
     */
    async function loadConfig() {
        if (_config) return _config;

        try {
            const response = await fetch(CONFIG_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status} ${response.statusText}`);
            }
            _config = await response.json();

            // Validate structure
            if (!_config.subjects || !Array.isArray(_config.subjects)) {
                throw new Error('Invalid config: "subjects" array not found');
            }

            return _config;
        } catch (error) {
            console.error('[DataLoader] Config load error:', error);
            throw error;
        }
    }

    /**
     * Get all subjects with their metadata.
     * @returns {Promise<Array>} Array of subject objects
     */
    async function getSubjects() {
        const config = await loadConfig();
        return config.subjects;
    }

    /**
     * Get a single subject by folder name.
     * @param {string} folder - The subject folder name
     * @returns {Promise<Object|null>} Subject object or null
     */
    async function getSubject(folder) {
        const subjects = await getSubjects();
        return subjects.find(s => s.folder === folder) || null;
    }

    /**
     * Get chapters for a specific subject.
     * @param {string} folder - The subject folder name
     * @returns {Promise<Array>} Array of chapter file names
     */
    async function getChapters(folder) {
        const subject = await getSubject(folder);
        if (!subject) return [];
        return subject.chapters || [];
    }

    /**
     * Fetch quiz data for a specific chapter.
     * Results are cached for performance.
     * @param {string} subjectFolder - The subject folder name
     * @param {string} chapterFile - The chapter file name (without .json)
     * @returns {Promise<Array>} Array of question objects
     */
    async function fetchQuizData(subjectFolder, chapterFile) {
        const cacheKey = `${subjectFolder}/${chapterFile}`;

        // Return cached data if available
        if (_cache[cacheKey]) {
            return _cache[cacheKey];
        }

        const url = `${QUIZES_DIR}/${encodeURIComponent(subjectFolder)}/${encodeURIComponent(chapterFile)}.json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load quiz: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Validate quiz data structure
            if (!Array.isArray(data)) {
                throw new Error('Invalid quiz data: expected an array of questions');
            }

            // Validate each question
            data.forEach((q, idx) => {
                if (!q.question || !Array.isArray(q.options) || typeof q.correctAnswer !== 'number') {
                    console.warn(`[DataLoader] Question ${idx + 1} has invalid structure, skipping validation`);
                }
            });

            // Cache the validated data
            _cache[cacheKey] = data;
            return data;

        } catch (error) {
            console.error(`[DataLoader] Quiz load error (${cacheKey}):`, error);
            throw error;
        }
    }

    /**
     * Get total statistics for all subjects.
     * @returns {Promise<Object>} { totalSubjects, totalChapters }
     */
    async function getStats() {
        const subjects = await getSubjects();
        const totalChapters = subjects.reduce((sum, s) => sum + (s.chapters ? s.chapters.length : 0), 0);
        return {
            totalSubjects: subjects.length,
            totalChapters
        };
    }

    /**
     * Search across subjects and chapters.
     * @param {string} query - Search query string
     * @returns {Promise<Array>} Array of search result objects
     */
    async function search(query) {
        if (!query || query.trim().length === 0) return [];

        const subjects = await getSubjects();
        const q = query.toLowerCase().trim();
        const results = [];

        subjects.forEach(subject => {
            // Search subject names
            if (subject.name.toLowerCase().includes(q)) {
                results.push({
                    type: 'subject',
                    name: subject.name,
                    icon: subject.icon,
                    color: subject.color,
                    folder: subject.folder,
                    chapterCount: subject.chapters ? subject.chapters.length : 0
                });
            }

            // Search chapters within each subject
            if (subject.chapters) {
                subject.chapters.forEach(chapter => {
                    const chapterName = formatChapterName(chapter);
                    if (chapterName.toLowerCase().includes(q) || subject.name.toLowerCase().includes(q)) {
                        results.push({
                            type: 'chapter',
                            name: chapterName,
                            subjectName: subject.name,
                            icon: subject.icon,
                            color: subject.color,
                            folder: subject.folder,
                            file: chapter
                        });
                    }
                });
            }
        });

        // Deduplicate and limit results
        return results.slice(0, 15);
    }

    /**
     * Format a chapter filename into a readable name.
     * e.g., "chapter01" → "Chapter 01"
     * @param {string} filename - The chapter filename
     * @returns {string} Formatted chapter name
     */
    function formatChapterName(filename) {
        return filename
            .replace(/([a-z])(\d)/gi, '$1 $2')                // Add space before numbers
            .replace(/^chapter\s*/i, 'Chapter ')               // Capitalize "Chapter"
            .replace(/^(\w)/, c => c.toUpperCase());           // Capitalize first letter
    }

    /**
     * Clear all cached data.
     */
    function clearCache() {
        _config = null;
        _cache = {};
    }

    // ─── Expose Public API ───
    return {
        loadConfig,
        getSubjects,
        getSubject,
        getChapters,
        fetchQuizData,
        getStats,
        search,
        formatChapterName,
        clearCache
    };
})();
