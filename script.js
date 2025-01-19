class QuizGame {
    constructor() {
        this.currentQuestion = 0;
        this.score = 0;
        this.timer = null;
        this.timeLeft = 30;
        this.questions = [];
        this.difficulty = '';

        // DOM Elements
        this.startScreen = document.getElementById('start-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.endScreen = document.getElementById('end-screen');
        this.questionText = document.getElementById('question-text');
        this.optionsContainer = document.getElementById('options-container');
        this.scoreElement = document.getElementById('score');
        this.timeElement = document.getElementById('time');
        this.feedbackElement = document.getElementById('feedback');
        this.feedbackText = document.getElementById('feedback-text');
        this.additionalInfo = document.getElementById('additional-info');
        this.finalScoreElement = document.getElementById('final-score');
        this.loadingElement = document.getElementById('loading');
        this.restartBtn = document.getElementById('restart-btn');
        this.difficultyBtns = document.querySelectorAll('.difficulty-btn');

        // Audio elements
        this.timerSound = document.getElementById('timer-sound');
        this.correctSound = document.getElementById('correct-sound');
        this.wrongSound = document.getElementById('wrong-sound');

        // Event Listeners
        this.difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.difficulty));
        });

        this.restartBtn.addEventListener('click', () => {
            this.showScreen('start-screen');
        });
    }

    async fetchQuestions(difficulty) {
        try {
            const response = await fetch(`https://opentdb.com/api.php?amount=10&difficulty=${difficulty}`);
            const data = await response.json();
            
            if (data.response_code === 0) {
                return data.results.map(q => ({
                    question: this.decodeHtml(q.question),
                    options: this.shuffleOptions([
                        ...q.incorrect_answers.map(a => this.decodeHtml(a)),
                        this.decodeHtml(q.correct_answer)
                    ]),
                    correct: q.correct_answer,
                    category: q.category,
                    additionalInfo: `Category: ${q.category}`
                }));
            } else {
                throw new Error('Failed to fetch questions');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            return null;
        }
    }

    decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }

    async startGame(difficulty) {
        this.difficulty = difficulty;
        this.currentQuestion = 0;
        this.score = 0;
        
        // Show loading state
        this.showScreen('game-screen');
        this.questionText.textContent = 'Loading questions...';
        this.loadingElement.classList.remove('hidden');
        this.optionsContainer.classList.add('hidden');
        
        // Fetch questions from API
        const questions = await this.fetchQuestions(difficulty);
        
        if (!questions) {
            this.questionText.textContent = 'Error loading questions. Please try again.';
            this.loadingElement.classList.add('hidden');
            return;
        }
        
        this.questions = questions;
        this.loadingElement.classList.add('hidden');
        this.optionsContainer.classList.remove('hidden');
        this.updateScore();
        this.loadQuestion();
    }

    shuffleOptions(options) {
        const shuffledOptions = [...options];
        for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
        }
        return shuffledOptions;
    }

    loadQuestion() {
        const question = this.questions[this.currentQuestion];
        this.questionText.textContent = question.question;
        
        // Clear previous options
        this.optionsContainer.innerHTML = '';
        
        // Create new option buttons
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.innerHTML = `
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${option}</span>
            `;
            button.addEventListener('click', () => this.checkAnswer(option, question.correct));
            this.optionsContainer.appendChild(button);
        });

        // Hide feedback
        this.feedbackElement.classList.add('hidden');
        
        // Reset and start timer
        this.timeLeft = 30;
        this.updateTimer();
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.updateTimer(), 1000);
        this.timerSound.currentTime = 0;
        this.timerSound.play();
    }

    updateTimer() {
        this.timeElement.textContent = this.timeLeft;
        if (this.timeLeft <= 5) {
            this.timeElement.style.animation = 'pulse 0.5s infinite';
        }
        if (this.timeLeft <= 0) {
            clearInterval(this.timer);
            this.timerSound.pause();
            this.showFeedback(false, "Time's up!");
            setTimeout(() => this.nextQuestion(), 2000);
        }
        this.timeLeft--;
    }

    checkAnswer(selectedAnswer, correctAnswer) {
        clearInterval(this.timer);
        this.timerSound.pause();
        const correct = selectedAnswer === correctAnswer;
        
        // Update score
        if (correct) {
            this.score += 10;
            this.updateScore();
            this.correctSound.play();
        } else {
            this.wrongSound.play();
        }

        // Show feedback
        this.showFeedback(correct);

        // Highlight correct and incorrect answers
        const options = this.optionsContainer.children;
        for (const option of options) {
            option.disabled = true;
            if (option.querySelector('.option-text').textContent === correctAnswer) {
                option.classList.add('correct');
            } else if (option.querySelector('.option-text').textContent === selectedAnswer && !correct) {
                option.classList.add('incorrect');
            }
        }

        setTimeout(() => this.nextQuestion(), 2000);
    }

    showFeedback(correct, message = null) {
        this.feedbackElement.classList.remove('hidden', 'correct', 'incorrect');
        this.feedbackElement.classList.add(correct ? 'correct' : 'incorrect');
        
        this.feedbackText.textContent = message || (correct ? 'Correct!' : 'Incorrect!');
        this.additionalInfo.textContent = this.questions[this.currentQuestion].additionalInfo;
    }

    updateScore() {
        this.scoreElement.textContent = this.score;
        this.finalScoreElement.textContent = this.score;
    }

    nextQuestion() {
        this.currentQuestion++;
        if (this.currentQuestion < this.questions.length) {
            this.loadQuestion();
        } else {
            this.endGame();
        }
    }

    endGame() {
        this.showScreen('end-screen');
        this.timerSound.pause();
    }

    showScreen(screenId) {
        [this.startScreen, this.gameScreen, this.endScreen].forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }
}

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new QuizGame();
});
