// Basic Wordle Solver using Information Theory
class WordleSolver {
  constructor() {
    this.possibleWords = [...WORD_LIST];
    this.eliminatedWords = new Set();
    this.gameState = {
      guesses: [],
      feedback: [],
      currentRow: 0
    };
    this.letterFrequencies = this.calculateLetterFrequencies();
  }

  // Calculate letter frequencies in the word list
  calculateLetterFrequencies() {
    const frequencies = {};
    for (let i = 97; i <= 122; i++) { // a-z
      frequencies[String.fromCharCode(i)] = 0;
    }
    
    this.possibleWords.forEach(word => {
      for (let char of word) {
        frequencies[char]++;
      }
    });
    
    return frequencies;
  }

  // Get the best starting word based on letter frequency
  getBestStartingWord() {
    let bestWord = 'raise'; // Default good starting word
    let bestScore = 0;
    
    // Check common good starting words first
    const goodStarters = ['raise', 'roate', 'soare', 'stare', 'arise', 'irate', 'orate'];
    
    for (let word of goodStarters) {
      if (this.possibleWords.includes(word)) {
        const score = this.calculateWordScore(word);
        if (score > bestScore) {
          bestScore = score;
          bestWord = word;
        }
      }
    }
    
    return bestWord;
  }

  // Calculate word score based on letter frequency and position
  calculateWordScore(word) {
    let score = 0;
    const usedLetters = new Set();
    
    for (let i = 0; i < word.length; i++) {
      const letter = word[i];
      if (!usedLetters.has(letter)) {
        score += this.letterFrequencies[letter] || 0;
        usedLetters.add(letter);
      }
    }
    
    return score;
  }

  // Get the best next word based on current game state
  getBestNextWord() {
    if (this.possibleWords.length === 0) {
      return null;
    }
    
    if (this.possibleWords.length === 1) {
      return this.possibleWords[0];
    }
    
    // If this is the first guess, use a good starting word
    if (this.gameState.guesses.length === 0) {
      return this.getBestStartingWord();
    }
    
    // For simplicity, just return the first possible word
    // This can be enhanced later with better algorithms
    return this.possibleWords[0];
  }

  // Get feedback for a guess against a target word
  getFeedback(guess, target) {
    const feedback = new Array(5).fill('gray');
    const targetLetters = target.split('');
    const guessLetters = guess.split('');
    
    // First pass: mark greens
    for (let i = 0; i < 5; i++) {
      if (guessLetters[i] === targetLetters[i]) {
        feedback[i] = 'green';
        targetLetters[i] = null; // Mark as used
      }
    }
    
    // Second pass: mark yellows
    for (let i = 0; i < 5; i++) {
      if (feedback[i] !== 'green') {
        const letterIndex = targetLetters.indexOf(guessLetters[i]);
        if (letterIndex !== -1) {
          feedback[i] = 'yellow';
          targetLetters[letterIndex] = null; // Mark as used
        }
      }
    }
    
    return feedback;
  }

  // Process feedback and update possible words
  processFeedback(guess, feedback) {
    this.gameState.guesses.push(guess);
    this.gameState.feedback.push([...feedback]);
    this.gameState.currentRow++;
    
    // Filter possible words based on feedback
    this.possibleWords = this.possibleWords.filter(word => {
      return this.isWordCompatible(word, guess, feedback);
    });
    
    // Update letter frequencies
    this.letterFrequencies = this.calculateLetterFrequencies();
  }

  // Check if a word is compatible with the given feedback
  isWordCompatible(word, guess, feedback) {
    const wordLetters = word.split('');
    const guessLetters = guess.split('');
    
    // Check greens first
    for (let i = 0; i < 5; i++) {
      if (feedback[i] === 'green' && wordLetters[i] !== guessLetters[i]) {
        return false;
      }
    }
    
    // Check yellows and grays
    const letterCounts = {};
    for (let i = 0; i < 5; i++) {
      letterCounts[wordLetters[i]] = (letterCounts[wordLetters[i]] || 0) + 1;
    }
    
    for (let i = 0; i < 5; i++) {
      const guessLetter = guessLetters[i];
      
      if (feedback[i] === 'yellow') {
        // Letter must be in word but not at this position
        if (wordLetters[i] === guessLetter || !letterCounts[guessLetter]) {
          return false;
        }
        letterCounts[guessLetter]--;
      } else if (feedback[i] === 'gray') {
        // Letter should not be in word (unless it's already accounted for by greens/yellows)
        const greenCount = feedback.filter((f, j) => f === 'green' && guessLetters[j] === guessLetter).length;
        const yellowCount = feedback.filter((f, j) => f === 'yellow' && guessLetters[j] === guessLetter).length;
        const totalNeeded = greenCount + yellowCount;
        
        if (letterCounts[guessLetter] > totalNeeded) {
          return false;
        }
      }
    }
    
    return true;
  }

  // Reset the solver
  reset() {
    this.possibleWords = [...WORD_LIST];
    this.eliminatedWords.clear();
    this.gameState = {
      guesses: [],
      feedback: [],
      currentRow: 0
    };
    this.letterFrequencies = this.calculateLetterFrequencies();
  }

  // Get current statistics
  getStats() {
    return {
      possibleWords: this.possibleWords.length,
      totalWords: WORD_LIST.length,
      eliminatedWords: this.eliminatedWords.size
    };
  }
}

// Global solver instance
let solver = new WordleSolver();

// Initialize the game board
function initializeGameBoard() {
  console.log('Initializing game board...');
  const gameBoard = document.getElementById('game-board');
  if (!gameBoard) {
    console.error('Game board element not found!');
    return;
  }
  
  gameBoard.innerHTML = '';
  
  for (let row = 0; row < 6; row++) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'tile-container';
    rowDiv.id = `row-${row}`;
    
    for (let col = 0; col < 5; col++) {
      const tile = document.createElement('div');
      tile.className = 'tile';
      tile.id = `tile-${row}-${col}`;
      tile.dataset.row = row;
      tile.dataset.col = col;
      
      // Add click handlers for color cycling
      tile.addEventListener('click', function() {
        cycleTileColor(this);
      });
      
      rowDiv.appendChild(tile);
    }
    
    gameBoard.appendChild(rowDiv);
  }
  console.log('Game board initialized successfully');
}

// Cycle through tile colors (gray -> yellow -> green -> gray)
function cycleTileColor(tile) {
  console.log('Cycling tile color:', tile.id);
  const colors = ['gray', 'yellow', 'green'];
  const currentColor = tile.className.includes('gray') ? 'gray' : 
                      tile.className.includes('yellow') ? 'yellow' : 
                      tile.className.includes('green') ? 'green' : 'gray';
  
  // Remove all color classes
  tile.classList.remove('gray', 'yellow', 'green');
  
  // Add next color
  const currentIndex = colors.indexOf(currentColor);
  const nextIndex = (currentIndex + 1) % colors.length;
  tile.classList.add(colors[nextIndex]);
  
  // Update suggestion
  updateSuggestion();
}

// Update the suggestion based on current board state
function updateSuggestion() {
  console.log('Updating suggestion...');
  const suggestionText = document.getElementById('suggestion-text');
  const wordsRemaining = document.getElementById('words-remaining');
  
  if (!suggestionText || !wordsRemaining) {
    console.error('Suggestion elements not found!');
    return;
  }
  
  // Reset solver
  solver.reset();
  
  // Process all completed rows
  for (let row = 0; row < 6; row++) {
    const rowDiv = document.getElementById(`row-${row}`);
    if (!rowDiv) continue;
    
    const tiles = rowDiv.querySelectorAll('.tile');
    let word = '';
    let feedback = [];
    let isComplete = true;
    
    for (let col = 0; col < 5; col++) {
      const tile = tiles[col];
      const letter = tile.textContent.toLowerCase();
      
      if (!letter) {
        isComplete = false;
        break;
      }
      
      word += letter;
      
      // Determine feedback based on tile color
      let color = 'gray';
      if (tile.classList.contains('yellow')) color = 'yellow';
      else if (tile.classList.contains('green')) color = 'green';
      
      feedback.push(color);
    }
    
    if (isComplete && word.length === 5) {
      console.log('Processing word:', word, 'with feedback:', feedback);
      solver.processFeedback(word, feedback);
    }
  }
  
  // Get best next word
  const bestWord = solver.getBestNextWord();
  if (bestWord) {
    suggestionText.textContent = bestWord.toUpperCase();
    console.log('Best word:', bestWord);
  } else {
    suggestionText.textContent = 'NO WORDS LEFT';
    console.log('No words left');
  }
  
  // Update words remaining
  const stats = solver.getStats();
  wordsRemaining.textContent = stats.possibleWords;
  console.log('Words remaining:', stats.possibleWords);
}

// Handle word input
function handleWordInput() {
  console.log('Setting up word input handlers...');
  const input = document.getElementById('guess-input');
  const submitButton = document.getElementById('submit-button');
  
  if (!input || !submitButton) {
    console.error('Input elements not found!');
    return;
  }
  
  input.addEventListener('input', function() {
    this.value = this.value.toLowerCase().replace(/[^a-z]/g, '');
    if (this.value.length === 5) {
      submitButton.disabled = false;
    } else {
      submitButton.disabled = true;
    }
  });
  
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && this.value.length === 5) {
      submitWord();
    }
  });
  
  submitButton.addEventListener('click', submitWord);
  console.log('Word input handlers set up successfully');
}

// Submit a word to the board
function submitWord() {
  console.log('Submitting word...');
  const input = document.getElementById('guess-input');
  const word = input.value.toLowerCase();
  
  if (word.length !== 5 || !WORD_LIST.includes(word)) {
    alert('Please enter a valid 5-letter word!');
    return;
  }
  
  // Find the next empty row
  let targetRow = -1;
  for (let row = 0; row < 6; row++) {
    const rowDiv = document.getElementById(`row-${row}`);
    if (!rowDiv) continue;
    
    const tiles = rowDiv.querySelectorAll('.tile');
    let isEmpty = true;
    
    for (let col = 0; col < 5; col++) {
      if (tiles[col].textContent) {
        isEmpty = false;
        break;
      }
    }
    
    if (isEmpty) {
      targetRow = row;
      break;
    }
  }
  
  if (targetRow === -1) {
    alert('Board is full!');
    return;
  }
  
  // Fill the row with the word
  const rowDiv = document.getElementById(`row-${targetRow}`);
  const tiles = rowDiv.querySelectorAll('.tile');
  
  for (let col = 0; col < 5; col++) {
    tiles[col].textContent = word[col].toUpperCase();
    tiles[col].classList.add('filled');
  }
  
  // Clear input
  input.value = '';
  document.getElementById('submit-button').disabled = true;
  
  // Update suggestion
  updateSuggestion();
  console.log('Word submitted successfully:', word);
}

// Reset the game
function resetGame() {
  console.log('Setting up reset handler...');
  const resetButton = document.getElementById('reset-button');
  if (!resetButton) {
    console.error('Reset button not found!');
    return;
  }
  
  resetButton.addEventListener('click', function() {
    console.log('Resetting game...');
    // Clear all tiles
    for (let row = 0; row < 6; row++) {
      const rowDiv = document.getElementById(`row-${row}`);
      if (!rowDiv) continue;
      
      const tiles = rowDiv.querySelectorAll('.tile');
      for (let col = 0; col < 5; col++) {
        tiles[col].textContent = '';
        tiles[col].classList.remove('filled', 'gray', 'yellow', 'green');
      }
    }
    
    // Reset solver
    solver.reset();
    
    // Update suggestion
    updateSuggestion();
    
    // Clear input
    const input = document.getElementById('guess-input');
    if (input) {
      input.value = '';
      document.getElementById('submit-button').disabled = true;
    }
    console.log('Game reset successfully');
  });
  console.log('Reset handler set up successfully');
}

// Initialize everything when the page loads
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing solver...');
  try {
    initializeGameBoard();
    handleWordInput();
    resetGame();
    updateSuggestion();
    console.log('Solver initialized successfully');
  } catch (error) {
    console.error('Error initializing solver:', error);
  }
}); 