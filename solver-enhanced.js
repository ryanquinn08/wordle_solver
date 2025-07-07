// Enhanced Solver Features
class EnhancedSolver {
  constructor() {
    this.simulationStats = {
      gamesPlayed: 0,
      totalGuesses: 0,
      wins: 0,
      guessDistribution: {}
    };
    this.chart = null;
  }

  // Run a single simulation
  async runSimulation() {
    const targetWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    const solver = new WordleSolver();
    let guesses = [];
    let feedback = [];
    
    for (let attempt = 1; attempt <= 6; attempt++) {
      const guess = solver.getBestNextWord();
      if (!guess) break;
      
      guesses.push(guess);
      const result = this.getFeedback(guess, targetWord);
      feedback.push(result);
      
      solver.processFeedback(guess, result);
      
      if (guess === targetWord) {
        this.updateStats(attempt, true);
        return {
          target: targetWord,
          guesses: guesses,
          won: true,
          attempts: attempt
        };
      }
    }
    
    this.updateStats(6, false);
    return {
      target: targetWord,
      guesses: guesses,
      won: false,
      attempts: 6
    };
  }

  // Get feedback for a guess against target
  getFeedback(guess, target) {
    const feedback = new Array(5).fill('gray');
    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    
    // Mark greens
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        feedback[i] = 'green';
        targetLetters[i] = null;
      }
    }
    
    // Mark yellows
    for (let i = 0; i < 5; i++) {
      if (feedback[i] !== 'green') {
        const letterIndex = targetLetters.indexOf(guessLetters[i]);
        if (letterIndex !== -1) {
          feedback[i] = 'yellow';
          targetLetters[letterIndex] = null;
        }
      }
    }
    
    return feedback;
  }

  // Update simulation statistics
  updateStats(attempts, won) {
    this.simulationStats.gamesPlayed++;
    this.simulationStats.totalGuesses += attempts;
    
    if (won) {
      this.simulationStats.wins++;
    }
    
    this.simulationStats.guessDistribution[attempts] = 
      (this.simulationStats.guessDistribution[attempts] || 0) + 1;
    
    this.updateDisplay();
  }

  // Update the display with current stats
  updateDisplay() {
    const gamesPlayed = document.getElementById('games-played');
    const averageGuesses = document.getElementById('average-guesses');
    const successRate = document.getElementById('success-rate');
    
    if (gamesPlayed) {
      gamesPlayed.textContent = this.simulationStats.gamesPlayed;
    }
    
    if (averageGuesses && this.simulationStats.gamesPlayed > 0) {
      const avg = (this.simulationStats.totalGuesses / this.simulationStats.gamesPlayed).toFixed(2);
      averageGuesses.textContent = avg;
    }
    
    if (successRate && this.simulationStats.gamesPlayed > 0) {
      const rate = ((this.simulationStats.wins / this.simulationStats.gamesPlayed) * 100).toFixed(1);
      successRate.textContent = rate + '%';
    }
  }

  // Initialize simulation controls
  initializeSimulationControls() {
    const run1Button = document.getElementById('run-1-sim');
    const run10Button = document.getElementById('run-10-sim');
    
    if (run1Button) {
      run1Button.addEventListener('click', async () => {
        const result = await this.runSimulation();
        this.displaySimulationResult(result);
      });
    }
    
    if (run10Button) {
      run10Button.addEventListener('click', async () => {
        for (let i = 0; i < 10; i++) {
          const result = await this.runSimulation();
          this.displaySimulationResult(result);
          // Small delay to prevent browser freezing
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      });
    }
  }

  // Display simulation result
  displaySimulationResult(result) {
    const resultDiv = document.getElementById('last-sim-result');
    if (resultDiv) {
      const status = result.won ? 'WON' : 'LOST';
      resultDiv.textContent = `${status}: ${result.target.toUpperCase()} in ${result.attempts} guesses`;
    }
  }

  // Reset simulation stats
  resetStats() {
    this.simulationStats = {
      gamesPlayed: 0,
      totalGuesses: 0,
      wins: 0,
      guessDistribution: {}
    };
    this.updateDisplay();
    
    const resultDiv = document.getElementById('last-sim-result');
    if (resultDiv) {
      resultDiv.textContent = 'Click a simulation button to see results';
    }
  }
}

// Global enhanced solver instance
let enhancedSolver = new EnhancedSolver();

// Initialize enhanced features when page loads
document.addEventListener('DOMContentLoaded', function() {
  enhancedSolver.initializeSimulationControls();
}); 