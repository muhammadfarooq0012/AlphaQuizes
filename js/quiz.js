/* ═══════════════════════════════════════════════════════════════
   QUIZ.JS — Quiz Engine Module
   Manages quiz state, question rendering, and navigation
   ═══════════════════════════════════════════════════════════════ */

/**
 * QuizEngine — Manages quiz playback for a single chapter.
 * Loads questions, renders one at a time, handles prev/next navigation.
 */
const QuizEngine = (() => {
  // ─── Private State ───
  let _questions = []; // Current quiz questions array
  let _currentIndex = 0; // Current question index
  let _subjectName = ""; // Current subject display name
  let _chapterName = ""; // Current chapter display name
  let _container = null; // DOM container for quiz rendering
  let _answers = []; // Selected option index for each question
  let _submitted = false; // Whether the quiz has been submitted
  let _clipboardGuardBound = false;

  // Option letters for labeling
  const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

  // ─── Public API ───

  /**
   * Initialize and start a quiz.
   * @param {Object} params
   * @param {string} params.subjectFolder - Subject folder name
   * @param {string} params.chapterFile - Chapter file name (without .json)
   * @param {string} params.subjectName - Display name for the subject
   * @param {string} params.chapterName - Display name for the chapter
   * @param {HTMLElement} params.container - DOM element to render into
   */
  async function start({
    subjectFolder,
    chapterFile,
    subjectName,
    chapterName,
    container,
  }) {
    _container = container;
    _subjectName = subjectName;
    _chapterName = chapterName;
    _currentIndex = 0;
    _answers = [];
    _submitted = false;
    _bindClipboardGuard();

    // Show loading state
    _container.innerHTML = `
            <div class="quiz-container">
                <div class="content-loader">
                    <div class="spinner"></div>
                    <p>Loading questions...</p>
                </div>
            </div>
        `;

    try {
      // Fetch quiz data
      _questions = await DataLoader.fetchQuizData(subjectFolder, chapterFile);

      if (_questions.length === 0) {
        _renderEmpty();
        return;
      }

      // Render first question
      _renderQuiz();
    } catch (error) {
      _renderError(error.message);
    }
  }

  /**
   * Navigate to the next question.
   */
  function next() {
    if (_currentIndex < _questions.length - 1) {
      _currentIndex++;
      _renderQuiz();
      _scrollToTop();
    }
  }

  /**
   * Select and check an answer for the current question.
   * @param {number} optionIndex
   */
  function selectAnswer(optionIndex) {
    if (_submitted) return;
    _answers[_currentIndex] = optionIndex;
    _renderQuiz();
  }

  /**
   * Submit the quiz and show the score and answer review.
   */
  function submit() {
    if (_submitted || _questions.length === 0) return;
    _submitted = true;
    _renderResults();
    _scrollToTop();
  }

  /**
   * Navigate to the previous question.
   */
  function prev() {
    if (_currentIndex > 0) {
      _currentIndex--;
      _renderQuiz();
      _scrollToTop();
    }
  }

  /**
   * Get current quiz state.
   * @returns {Object} { currentIndex, totalQuestions, isFirst, isLast }
   */
  function getState() {
    return {
      currentIndex: _currentIndex,
      totalQuestions: _questions.length,
      isFirst: _currentIndex === 0,
      isLast: _currentIndex === _questions.length - 1,
    };
  }

  /**
   * Check if a quiz is currently active.
   * @returns {boolean}
   */
  function isActive() {
    return _questions.length > 0;
  }

  // ─── Private Methods ───

  /**
   * Render the complete quiz UI with current question.
   */
  function _renderQuiz() {
    const q = _questions[_currentIndex];
    const total = _questions.length;
    const progress = (((_currentIndex + 1) / total) * 100).toFixed(1);
    const isFirst = _currentIndex === 0;
    const isLast = _currentIndex === total - 1;
    const selectedAnswer = _answers[_currentIndex];
    const hasAnswer = selectedAnswer !== undefined;

    _container.innerHTML = `
            <div class="quiz-container page-transition quiz-protected">
                <!-- Back Button -->
                <button class="back-button" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Chapters
                </button>

                <!-- Quiz Header -->
                <div class="quiz-header">
                    <div class="quiz-counter">
                        Question <span>${_currentIndex + 1}</span> of <span>${total}</span>
                    </div>
                    <div class="quiz-chapter-title">
                        <i class="fas fa-book-open"></i> ${_subjectName} — ${_chapterName}
                    </div>
                </div>

                <!-- Progress Bar -->
                <div class="quiz-progress">
                    <div class="quiz-progress-fill" style="width: ${progress}%"></div>
                </div>

                <!-- Question Card -->
                <div class="question-card">
                    <div class="question-number">
                        <i class="fas fa-question-circle"></i>
                        Question ${_currentIndex + 1}
                    </div>
                    <h2 class="question-text">${_formatBilingualText(q.question)}</h2>

                    <!-- Options -->
                    <div class="options-list">
                        ${q.options
                          .map(
                            (opt, idx) => `
                            <button type="button" class="option-item ${hasAnswer && idx === q.correctAnswer ? "correct" : ""} ${hasAnswer && selectedAnswer === idx && idx !== q.correctAnswer ? "incorrect" : ""} ${!hasAnswer && selectedAnswer === idx ? "selected" : ""}" data-option-index="${idx}" ${hasAnswer ? "disabled" : ""}>
                                <div class="option-letter">${OPTION_LETTERS[idx]}</div>
                                <span class="option-text">${_formatBilingualText(opt)}</span>
                              <span class="option-check">${hasAnswer && idx === q.correctAnswer ? '<i class="fas fa-check-circle"></i>' : hasAnswer && selectedAnswer === idx ? '<i class="fas fa-times-circle"></i>' : ""}</span>
                            </button>
                        `,
                          )
                          .join("")}
                    </div>
                    ${
                      hasAnswer
                        ? `<div class="question-feedback ${selectedAnswer === q.correctAnswer ? "feedback-correct" : "feedback-incorrect"}">
                      <i class="fas ${selectedAnswer === q.correctAnswer ? "fa-check-circle" : "fa-lightbulb"}"></i>
                      ${selectedAnswer === q.correctAnswer ? "Correct answer. Well done!" : "Not quite. The correct answer is highlighted in green. Review it and keep practicing."}
                    </div>`
                        : ""
                    }
                </div>

                <!-- Navigation Buttons -->
                <div class="quiz-nav">
                    <button class="btn btn-ghost" id="quiz-prev" ${isFirst ? "disabled" : ""}>
                        <i class="fas fa-chevron-left"></i>
                        Previous
                    </button>
                    <div class="quiz-nav-info">
                        ${_currentIndex + 1} / ${total}
                    </div>
                    <button class="btn btn-primary" id="quiz-next" ${!isLast && selectedAnswer === undefined ? "disabled" : ""}>
                        ${isLast ? "Submit Quiz" : "Next"}
                        <i class="fas ${isLast ? "fa-check" : "fa-chevron-right"}"></i>
                    </button>
                </div>
            </div>
        `;

    // Bind navigation button events
    const prevBtn = document.getElementById("quiz-prev");
    const nextBtn = document.getElementById("quiz-next");
    const optionButtons = _container.querySelectorAll(".option-item");

    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", isLast ? submit : next);
    optionButtons.forEach((button) => {
      button.addEventListener("click", () => {
        selectAnswer(Number(button.dataset.optionIndex));
      });
    });
  }

  /**
   * Render the final score and constructive answer review.
   */
  function _renderResults() {
    const total = _questions.length;
    const score = _questions.reduce((count, question, index) => {
      return count + (_answers[index] === question.correctAnswer ? 1 : 0);
    }, 0);
    const percentage = Math.round((score / total) * 100);
    const feedback =
      percentage >= 80
        ? "Excellent work. Review the questions you missed to make your understanding even stronger."
        : percentage >= 60
          ? "Good progress. Revisit the missed concepts and try the quiz again to improve your score."
          : "Keep practicing. Review the explanations below, study the related material, and try again.";

    _container.innerHTML = `
            <div class="quiz-container page-transition quiz-results">
                <button class="back-button" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Chapters
                </button>

                <div class="results-summary">
                    <div class="results-icon"><i class="fas fa-award"></i></div>
                    <p class="results-label">Quiz Complete</p>
                    <h1>${score} / ${total}</h1>
                    <p class="results-percentage">${percentage}%</p>
                    <p class="results-feedback">${feedback}</p>
                    <button class="btn btn-primary" id="quiz-retry">
                        <i class="fas fa-redo"></i>
                        Try Again
                    </button>
                </div>

                <div class="results-review">
                    <h2><i class="fas fa-clipboard-check"></i> Answer Review</h2>
                    ${_questions
                      .map((question, index) => {
                        const isCorrect =
                          _answers[index] === question.correctAnswer;
                        const userAnswer =
                          _answers[index] === undefined
                            ? "Not answered"
                            : question.options[_answers[index]];
                        return `
                            <article class="review-item ${isCorrect ? "review-correct" : "review-incorrect"}">
                                <div class="review-status">
                                    <i class="fas ${isCorrect ? "fa-check-circle" : "fa-times-circle"}"></i>
                                    Question ${index + 1}
                                </div>
                                <h3>${_formatBilingualText(question.question)}</h3>
                                <p><strong>Your answer:</strong> ${_formatBilingualText(userAnswer)}</p>
                                ${isCorrect ? '<p class="review-message"><i class="fas fa-thumbs-up"></i> Correct. Keep building on this understanding.</p>' : `<p><strong>Correct answer:</strong> ${_formatBilingualText(question.options[question.correctAnswer])}</p><p class="review-message"><i class="fas fa-lightbulb"></i> Review this concept and try a similar question again.</p>`}
                            </article>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;

    const retryButton = document.getElementById("quiz-retry");
    if (retryButton)
      retryButton.addEventListener("click", () => {
        _answers = [];
        _submitted = false;
        _currentIndex = 0;
        _renderQuiz();
        _scrollToTop();
      });
  }

  /**
   * Render empty state when no questions found.
   */
  function _renderEmpty() {
    _container.innerHTML = `
            <div class="quiz-container page-transition">
                <button class="back-button" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Chapters
                </button>
                <div class="empty-state">
                    <i class="fas fa-inbox empty-state-icon"></i>
                    <h3>No Questions Available</h3>
                    <p>This chapter doesn't have any questions yet. Please check back later.</p>
                    <a href="#subjects" class="btn btn-primary mt-2">
                        <i class="fas fa-book"></i>
                        Browse Subjects
                    </a>
                </div>
            </div>
        `;
  }

  /**
   * Render error state.
   * @param {string} message - Error message to display
   */
  function _renderError(message) {
    _container.innerHTML = `
            <div class="quiz-container page-transition">
                <button class="back-button" onclick="window.history.back()">
                    <i class="fas fa-arrow-left"></i>
                    Back to Chapters
                </button>
                <div class="error-state">
                    <div class="error-state-icon">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                    <h3>Failed to Load Quiz</h3>
                    <p>${_escapeHtml(message)}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        <i class="fas fa-redo"></i>
                        Retry
                    </button>
                </div>
            </div>
        `;
  }

  /**
   * Scroll main content to top smoothly.
   */
  function _scrollToTop() {
    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Prevent copying, cutting, pasting, and text selection inside quizzes.
   */
  function _bindClipboardGuard() {
    if (_clipboardGuardBound || !_container) return;

    const blockClipboardAction = (event) => {
      event.preventDefault();
      return false;
    };

    _container.addEventListener("copy", blockClipboardAction);
    _container.addEventListener("cut", blockClipboardAction);
    _container.addEventListener("paste", blockClipboardAction);
    _container.addEventListener("contextmenu", blockClipboardAction);
    _container.addEventListener("dragstart", blockClipboardAction);
    _container.addEventListener("selectstart", blockClipboardAction);

    _clipboardGuardBound = true;
  }

  /**
   * Escape HTML entities to prevent XSS.
   * @param {string} str - Raw string
   * @returns {string} Escaped string
   */
  function _escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Render mixed English/Urdu text with Urdu styling after the separator.
   * @param {string} str
   * @returns {string}
   */
  function _formatBilingualText(str) {
    if (!str) return "";

    const parts = String(str).split(" / ");
    if (parts.length < 2) {
      return _escapeHtml(str);
    }

    const englishText = _escapeHtml(parts.shift().trim());
    const urduText = _escapeHtml(parts.join(" / ").trim());

    return `${englishText} <span class="urdu-separator">/</span> <span class="urdu-text" lang="ur" dir="rtl">${urduText}</span>`;
  }

  // ─── Expose Public API ───
  return {
    start,
    next,
    prev,
    selectAnswer,
    submit,
    getState,
    isActive,
  };
})();
