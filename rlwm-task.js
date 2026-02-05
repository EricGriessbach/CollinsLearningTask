// RLWM Task - JavaScript Implementation
// Based on Collins (2025) Nature Human Behaviour

// Experiment configuration
const config = {
    setSizes: [2, 3, 4, 5, 6, 3], // Different set sizes for each block
    iterationsPerStimulus: 10,    // How many times each stimulus is shown
    feedbackDuration: 800,        // ms to show feedback
    interTrialInterval: 500,      // ms between trials
    stimulusCategories: [
        ['🐱', '🐶', '🐭', '🐹', '🐰', '🦊'], // Animals
        ['🍎', '🍊', '🍋', '🍌', '🍇', '🍓'], // Fruits
        ['⚽', '🏀', '🎾', '🏈', '⚾', '🎱'], // Sports
        ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️'], // Vehicles
        ['🌸', '🌺', '🌻', '🌷', '🌹', '🏵️'], // Flowers
        ['⭐', '🌟', '✨', '💫', '🌠', '☄️']  // Stars
    ]
};

// Experiment state
let state = {
    currentBlock: 0,
    currentTrial: 0,
    blocks: [],
    trialSequence: [],
    currentStimulus: null,
    correctAction: null,
    waitingForResponse: false,
    results: {
        totalTrials: 0,
        correctResponses: 0,
        blockResults: []
    }
};

// Initialize the experiment
window.startExperiment = function() {
    document.getElementById('instructions').style.display = 'none';
    document.getElementById('config-screen').classList.add('active');
    
    // Generate configuration UI
    generateConfigUI();
}

// Generate the configuration UI
function generateConfigUI() {
    const container = document.getElementById('block-configs');
    container.innerHTML = '';
    
    config.setSizes.forEach((setSize, index) => {
        const blockConfig = document.createElement('div');
        blockConfig.className = 'block-config';
        blockConfig.innerHTML = `
            <div class="block-config-header">
                <div class="block-config-title">Block ${index + 1}</div>
                <div class="set-size-controls">
                    <div class="set-size-label">Number of Symbols:</div>
                    <div class="set-size-buttons">
                        ${[2, 3, 4, 5, 6].map(size => `
                            <button class="set-size-btn ${size === setSize ? 'selected' : ''}" 
                                    onclick="updateSetSize(${index}, ${size})">
                                ${size}
                            </button>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        container.appendChild(blockConfig);
    });
}

// Update set size for a specific block
window.updateSetSize = function(blockIndex, newSize) {
    config.setSizes[blockIndex] = newSize;
    generateConfigUI();
}

// Add a new block
window.addBlock = function() {
    // Add a new block with default size of 3
    config.setSizes.push(3);
    generateConfigUI();
}

// Remove the last block
window.removeBlock = function() {
    if (config.setSizes.length > 1) {
        config.setSizes.pop();
        generateConfigUI();
    }
}

// Go back to instructions
window.showInstructions = function() {
    document.getElementById('config-screen').classList.remove('active');
    document.getElementById('instructions').style.display = 'block';
}

// Confirm configuration and start experiment
window.confirmConfiguration = function() {
    document.getElementById('config-screen').classList.remove('active');
    document.getElementById('game-area').classList.add('active');
    
    // Generate all blocks with the configured set sizes
    generateBlocks();
    
    // Start first block
    startBlock(0);
}

// Generate all experimental blocks
function generateBlocks() {
    config.setSizes.forEach((setSize, blockIndex) => {
        const stimuli = selectStimuli(blockIndex, setSize);
        const correctActions = generateCorrectActions(setSize);
        const sequence = generateTrialSequence(stimuli, config.iterationsPerStimulus);
        
        state.blocks.push({
            setSize: setSize,
            stimuli: stimuli,
            correctActions: correctActions,
            sequence: sequence,
            results: []
        });
    });
    
    document.getElementById('total-blocks').textContent = state.blocks.length;
}

// Select stimuli for a block from the appropriate category
function selectStimuli(blockIndex, setSize) {
    const category = config.stimulusCategories[blockIndex % config.stimulusCategories.length];
    return category.slice(0, setSize);
}

// Generate random correct actions for each stimulus
function generateCorrectActions(setSize) {
    const actions = {};
    for (let i = 0; i < setSize; i++) {
        actions[i] = Math.floor(Math.random() * 3) + 1; // Random action 1, 2, or 3
    }
    return actions;
}

// Generate trial sequence with pseudo-randomization
function generateTrialSequence(stimuli, iterations) {
    const sequence = [];
    
    // Create base sequence with all stimuli repeated for each iteration
    for (let iter = 0; iter < iterations; iter++) {
        for (let i = 0; i < stimuli.length; i++) {
            sequence.push({
                stimulusIndex: i,
                stimulus: stimuli[i],
                iteration: iter + 1
            });
        }
    }
    
    // Properly shuffle the entire sequence
    return shuffleWithConstraints(sequence);
}

// Shuffle array while avoiding immediate repetitions
function shuffleWithConstraints(arr) {
    // Create a copy to work with
    const shuffled = [...arr];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Fix immediate repetitions with a repair pass
    for (let attempts = 0; attempts < 100; attempts++) {
        let hasRepetition = false;
        
        for (let i = 0; i < shuffled.length - 1; i++) {
            if (shuffled[i].stimulusIndex === shuffled[i + 1].stimulusIndex) {
                hasRepetition = true;
                
                // Find a position to swap with that doesn't create a new repetition
                let swapIndex = -1;
                for (let j = i + 2; j < shuffled.length; j++) {
                    // Check if swapping won't create new repetitions
                    const wouldCreateRepBefore = (j > 0 && shuffled[j - 1].stimulusIndex === shuffled[i + 1].stimulusIndex);
                    const wouldCreateRepAfter = (j < shuffled.length - 1 && shuffled[j + 1].stimulusIndex === shuffled[i + 1].stimulusIndex);
                    const wouldCreateRepAtI = (shuffled[j].stimulusIndex === shuffled[i].stimulusIndex);
                    const wouldCreateRepAtIPlus2 = (i + 2 < shuffled.length && shuffled[j].stimulusIndex === shuffled[i + 2].stimulusIndex);
                    
                    if (!wouldCreateRepBefore && !wouldCreateRepAfter && !wouldCreateRepAtI && !wouldCreateRepAtIPlus2) {
                        swapIndex = j;
                        break;
                    }
                }
                
                // Perform the swap if we found a valid position
                if (swapIndex !== -1) {
                    [shuffled[i + 1], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[i + 1]];
                }
            }
        }
        
        // If no repetitions found, we're done
        if (!hasRepetition) break;
    }
    
    return shuffled;
}

// Start a specific block
function startBlock(blockIndex) {
    state.currentBlock = blockIndex;
    state.currentTrial = 0;
    
    const block = state.blocks[blockIndex];
    
    // Update UI
    document.getElementById('block-number').textContent = blockIndex + 1;
    document.getElementById('set-size').textContent = block.setSize;
    document.getElementById('total-trials').textContent = block.sequence.length;
    
    // Generate and populate legend
    generateLegend(block);
    
    // Reset legend to hidden state
    const legend = document.getElementById('legend');
    legend.classList.add('hidden');
    document.getElementById('legend-toggle-text').textContent = 'Show Answer Key (for learning)';
    
    // Start first trial
    setTimeout(() => startTrial(), 500);
}

// Generate legend showing correct mappings
function generateLegend(block) {
    const legendContainer = document.getElementById('legend');
    legendContainer.innerHTML = '';
    
    block.stimuli.forEach((stimulus, index) => {
        const correctAction = block.correctActions[index];
        
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <span class="legend-stimulus">${stimulus}</span>
            <span class="legend-arrow">→</span>
            <span class="legend-key">${correctAction}</span>
        `;
        
        legendContainer.appendChild(legendItem);
    });
}

// Toggle legend visibility
window.toggleLegend = function() {
    const legend = document.getElementById('legend');
    const toggleText = document.getElementById('legend-toggle-text');
    
    if (legend.classList.contains('hidden')) {
        legend.classList.remove('hidden');
        toggleText.textContent = 'Hide Answer Key';
    } else {
        legend.classList.add('hidden');
        toggleText.textContent = 'Show Answer Key (for learning)';
    }
}

// Start a single trial
function startTrial() {
    const block = state.blocks[state.currentBlock];
    const trial = block.sequence[state.currentTrial];
    
    state.currentStimulus = trial.stimulus;
    state.correctAction = block.correctActions[trial.stimulusIndex];
    state.waitingForResponse = true;
    
    // Update trial counter
    document.getElementById('trial-number').textContent = state.currentTrial + 1;
    updateProgressBar();
    
    // Show stimulus and action buttons
    showStimulus(trial.stimulus);
}

// Display stimulus and action buttons
function showStimulus(stimulus) {
    const trialArea = document.getElementById('trial-area');
    trialArea.innerHTML = `
        <div class="stimulus">${stimulus}</div>
        <div class="action-buttons">
            <button class="action-btn" onclick="makeResponse(1)">1</button>
            <button class="action-btn" onclick="makeResponse(2)">2</button>
            <button class="action-btn" onclick="makeResponse(3)">3</button>
        </div>
        <div class="key-hint">Press 1, 2, or 3 on your keyboard</div>
    `;
}

// Handle response
window.makeResponse = function(action) {
    if (!state.waitingForResponse) return;
    
    state.waitingForResponse = false;
    
    // Highlight selected button
    const buttons = document.querySelectorAll('.action-btn');
    buttons[action - 1].classList.add('selected');
    
    // Check if correct
    const isCorrect = action === state.correctAction;
    
    // Record result
    const block = state.blocks[state.currentBlock];
    const trial = block.sequence[state.currentTrial];
    
    block.results.push({
        trial: state.currentTrial,
        stimulus: trial.stimulus,
        stimulusIndex: trial.stimulusIndex,
        iteration: trial.iteration,
        response: action,
        correct: isCorrect,
        rt: null // Could add reaction time tracking
    });
    
    state.results.totalTrials++;
    if (isCorrect) state.results.correctResponses++;
    
    // Show feedback
    setTimeout(() => showFeedback(isCorrect), 300);
}

// Show feedback
function showFeedback(isCorrect) {
    const trialArea = document.getElementById('trial-area');
    const feedbackClass = isCorrect ? 'correct' : 'incorrect';
    const feedbackText = isCorrect ? 'Correct! ✓' : 'Incorrect ✗';
    
    trialArea.innerHTML = `
        <div class="feedback ${feedbackClass}">${feedbackText}</div>
    `;
    
    // Move to next trial or block
    setTimeout(() => {
        state.currentTrial++;
        
        const block = state.blocks[state.currentBlock];
        if (state.currentTrial < block.sequence.length) {
            startTrial();
        } else {
            endBlock();
        }
    }, config.feedbackDuration);
}

// End current block
function endBlock() {
    const block = state.blocks[state.currentBlock];
    const blockAccuracy = block.results.filter(r => r.correct).length / block.results.length;
    
    state.results.blockResults.push({
        block: state.currentBlock,
        setSize: block.setSize,
        accuracy: blockAccuracy,
        trials: block.results.length
    });
    
    // Show inter-block screen
    const trialArea = document.getElementById('trial-area');
    trialArea.innerHTML = `
        <div style="text-align: center;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Block ${state.currentBlock + 1} Complete!</h2>
            <p style="font-size: 24px; margin-bottom: 10px;">Accuracy: ${(blockAccuracy * 100).toFixed(1)}%</p>
            <p style="color: #666;">Take a short break if needed.</p>
            <button class="next-btn" onclick="continueToNextBlock()">
                ${state.currentBlock < state.blocks.length - 1 ? 'Next Block' : 'See Results'}
            </button>
        </div>
    `;
}

// Continue to next block or show results
window.continueToNextBlock = function() {
    if (state.currentBlock < state.blocks.length - 1) {
        startBlock(state.currentBlock + 1);
    } else {
        showResults();
    }
}

// Show final results
function showResults() {
    document.getElementById('game-area').classList.remove('active');
    document.getElementById('results').classList.add('active');
    
    const overallAccuracy = (state.results.correctResponses / state.results.totalTrials * 100).toFixed(1);
    
    document.getElementById('overall-accuracy').textContent = overallAccuracy + '%';
    document.getElementById('total-trials-completed').textContent = state.results.totalTrials;
    document.getElementById('blocks-completed').textContent = state.blocks.length;
    
    // Log detailed results to console for researchers
    console.log('Experiment Results:', state.results);
    console.log('Block-by-block data:', state.results.blockResults);
}

// Update progress bar
function updateProgressBar() {
    const block = state.blocks[state.currentBlock];
    const progress = ((state.currentTrial + 1) / block.sequence.length) * 100;
    document.getElementById('progress-fill').style.width = progress + '%';
}

// Keyboard event listener
document.addEventListener('keydown', (event) => {
    if (state.waitingForResponse) {
        const key = event.key;
        if (key === '1' || key === '2' || key === '3') {
            makeResponse(parseInt(key));
        }
    }
});

// Export data function (for researchers)
function downloadData() {
    const dataStr = JSON.stringify(state.results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `rlwm-data-${Date.now()}.json`;
    link.click();
}

// Make download function available globally
window.downloadData = downloadData;
