// Import Supabase configuration
import { supabase } from './supabase-config.js';

// Global variables
let currentUser = null;
let currentStage = null;
let userProgress = {};
let stageWinners = {};

// Supabase configuration
const supabaseUrl = 'https://vlcjilzgntxweomnyfgd.supabase.co';

// Stage data with videos and riddles (answers removed - using backend validation)
const stages = [
    {
        id: 1,
        title: "The Beginning",
        description: "Watch carefully and find the hidden clue!",
        icon: "🎬",
        videoId: "dQw4w9WgXcQ",
        question: "What's the first word spoken in the video?",
        prize: "$50"
    },
    {
        id: 2,
        title: "Digital Mysteries", 
        description: "Technology holds the answer...",
        icon: "💻",
        videoId: "kJQP7kiw5Fk",
        question: "What programming language is mentioned first?",
        prize: "$50"
    },
    {
        id: 3,
        title: "Nature's Secrets",
        description: "Look closely at the natural world",
        icon: "🌿",
        videoId: "orn-FWjGOrE",
        question: "What color flower appears at 0:30?",
        prize: "$50"
    },
    {
        id: 4,
        title: "Urban Explorer",
        description: "City lights hide the truth",
        icon: "🏙️",
        videoId: "2Vv-BfVoq4g",
        question: "How many buildings are shown in the skyline?",
        prize: "$50"
    },
    {
        id: 5,
        title: "Time Traveler",
        description: "History reveals its mysteries",
        icon: "⏰",
        videoId: "fJ9rUzIMcZQ",
        question: "What year is mentioned in the description?",
        prize: "$50"
    },
    {
        id: 6,
        title: "Ocean Depths",
        description: "Dive deep for hidden treasures",
        icon: "🌊",
        videoId: "Bo_deCOd1HU",
        question: "What sea creature appears first?",
        prize: "$50"
    },
    {
        id: 7,
        title: "Space Odyssey",
        description: "The stars align to show the way",
        icon: "🚀",
        videoId: "V_Ne5TkbMvs",
        question: "Which planet is featured prominently?",
        prize: "$50"
    },
    {
        id: 8,
        title: "Musical Journey",
        description: "Listen for the hidden melody",
        icon: "🎵",
        videoId: "y6120QOlsfU",
        question: "What instrument plays the solo?",
        prize: "$50"
    },
    {
        id: 9,
        title: "Art & Culture",
        description: "Beauty holds the key",
        icon: "🎨",
        videoId: "OYecfV3ubP8",
        question: "What color dominates the painting?",
        prize: "$50"
    },
    {
        id: 10,
        title: "Adventure Calls",
        description: "Brave the unknown territories",
        icon: "🗺️",
        videoId: "hFZFjoX2cGg",
        question: "What's the name of the mountain?",
        prize: "$50"
    },
    {
        id: 11,
        title: "Food & Flavor",
        description: "Taste the secret ingredient",
        icon: "🍳",
        videoId: "ZcJjMnHoIBI",
        question: "What spice is added last?",
        prize: "$50"
    },
    {
        id: 12,
        title: "Sports Champion",
        description: "Victory requires precision",
        icon: "⚽",
        videoId: "jNQXAC9IVRw",
        question: "What's the final score?",
        prize: "$50"
    },
    {
        id: 13,
        title: "Science Lab",
        description: "Experiment with possibilities",
        icon: "🧪",
        videoId: "Ac7G7xOG2Ag",
        question: "What chemical reaction occurs?",
        prize: "$50"
    },
    {
        id: 14,
        title: "Fashion Forward",
        description: "Style reveals the pattern",
        icon: "👗",
        videoId: "pt8VYOfr8To",
        question: "What fabric is featured?",
        prize: "$50"
    },
    {
        id: 15,
        title: "Grand Finale",
        description: "The ultimate challenge awaits!",
        icon: "✈️",
        videoId: "M7lc1UVf-VE",
        question: "What's the destination code?",
        prize: "50K Miles"
    }
];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initialized');
    
    // Check authentication state
    checkAuthState();
    
    // Load winners data
    loadWinners();
    
    // Generate stage cards
    generateStageCards();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load user progress from localStorage as fallback
    loadLocalProgress();
});

// Authentication state management
async function checkAuthState() {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Auth check error:', error);
            showAuthSection();
            return;
        }

        if (user) {
            currentUser = user;
            showUserSection();
            await loadUserProgress();
        } else {
            showAuthSection();
        }
    } catch (error) {
        console.error('Auth state check failed:', error);
        showAuthSection();
    }
}

// Load winners data from backend
async function loadWinners() {
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/app_5fe11f8255_get_winners`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                stageWinners = data.winners;
                console.log('Winners loaded:', stageWinners);
                updateWinnerDisplay();
            }
        }
    } catch (error) {
        console.error('Failed to load winners:', error);
    }
}

// Update winner display on all stage cards
function updateWinnerDisplay() {
    stages.forEach(stage => {
        const stageCard = document.querySelector(`[data-stage="${stage.id}"]`);
        if (stageCard) {
            const winnerStatus = stageCard.querySelector('.winner-status');
            if (winnerStatus) {
                const winner = stageWinners[stage.id];
                if (winner) {
                    winnerStatus.textContent = `WON BY: ${winner.username}`;
                    winnerStatus.className = 'winner-status claimed';
                } else {
                    winnerStatus.textContent = 'UNCLAIMED';
                    winnerStatus.className = 'winner-status unclaimed';
                }
            }
        }
    });

    // Update master riddle status
    updateMasterRiddleStatus();
}

// Update master riddle status
function updateMasterRiddleStatus() {
    const masterStatus = document.getElementById('masterStatus');
    const masterCard = document.getElementById('masterRiddleCard');
    
    if (!masterStatus || !masterCard) return;

    // Check if user has completed all 15 stages
    const completedStages = Object.keys(userProgress).filter(stage => userProgress[stage]).length;
    
    if (completedStages < 15) {
        masterStatus.textContent = 'LOCKED';
        masterStatus.className = 'master-status locked';
        masterCard.style.display = 'none';
    } else {
        masterCard.style.display = 'block';
        const winner = stageWinners[16]; // Master riddle is stage 16
        if (winner) {
            masterStatus.textContent = `WON BY: ${winner.username}`;
            masterStatus.className = 'master-status claimed';
        } else {
            masterStatus.textContent = 'UNCLAIMED';
            masterStatus.className = 'master-status unclaimed';
        }
    }
}

// Show authentication section
function showAuthSection() {
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('userInfo').style.display = 'none';
    document.getElementById('progressOverview').style.display = 'none';
}

// Show user section
function showUserSection() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('userInfo').style.display = 'block';
    document.getElementById('progressOverview').style.display = 'block';
    
    // Update user greeting
    const username = currentUser?.user_metadata?.username || 
                    currentUser?.user_metadata?.full_name || 
                    currentUser?.email?.split('@')[0] || 'User';
    
    document.getElementById('userGreeting').textContent = `Welcome back, ${username}!`;
    
    updateProgressDisplay();
}

// Generate stage cards
function generateStageCards() {
    const stagesGrid = document.getElementById('stagesGrid');
    stagesGrid.innerHTML = '';

    stages.forEach(stage => {
        const isCompleted = userProgress[stage.id] || false;
        const isLocked = stage.id > 1 && !userProgress[stage.id - 1];
        
        const stageCard = document.createElement('div');
        stageCard.className = `stage-card ${isCompleted ? 'completed' : ''} ${isLocked ? 'locked' : ''} ${stage.id === 15 ? 'stage-15' : ''}`;
        stageCard.setAttribute('data-stage', stage.id);
        
        stageCard.innerHTML = `
            <div class="stage-prize">${stage.prize}</div>
            <div class="stage-header">
                <div class="stage-number">Stage ${stage.id}</div>
            </div>
            <div class="stage-icon">${stage.icon}</div>
            <div class="stage-title">${stage.title}</div>
            <div class="stage-description">${stage.description}</div>
            <div class="winner-status unclaimed">UNCLAIMED</div>
        `;

        if (!isLocked) {
            stageCard.addEventListener('click', () => openStage(stage.id));
        }

        stagesGrid.appendChild(stageCard);
    });

    // Update winner display after cards are generated
    updateWinnerDisplay();
}

// Setup event listeners
function setupEventListeners() {
    // Auth modal
    const authModal = document.getElementById('authModal');
    const loginButton = document.getElementById('loginButton');
    const authClose = authModal.querySelector('.close');

    loginButton.addEventListener('click', () => {
        authModal.style.display = 'block';
        initAuthUI();
    });

    authClose.addEventListener('click', () => {
        authModal.style.display = 'none';
    });

    // Sync button
    document.getElementById('syncButton').addEventListener('click', syncProgress);

    // Logout button
    document.getElementById('logoutButton').addEventListener('click', logout);

    // Video modal
    const videoModal = document.getElementById('videoModal');
    const videoClose = videoModal.querySelector('.close');
    const submitAnswer = document.getElementById('submitAnswer');
    const answerInput = document.getElementById('answerInput');

    videoClose.addEventListener('click', closeVideoModal);
    submitAnswer.addEventListener('click', submitStageAnswer);
    
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitStageAnswer();
        }
    });

    // Success modal
    const successModal = document.getElementById('successModal');
    const continueButton = document.getElementById('continueButton');

    continueButton.addEventListener('click', () => {
        successModal.style.display = 'none';
        generateStageCards(); // Refresh to show updated progress
        updateMasterRiddleStatus();
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.style.display = 'none';
        }
        if (e.target === videoModal) {
            closeVideoModal();
        }
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
}

// Open a stage
function openStage(stageId) {
    const stage = stages.find(s => s.id === stageId);
    if (!stage) return;

    // Check if stage is locked
    if (stageId > 1 && !userProgress[stageId - 1]) {
        alert('Complete the previous stage first!');
        return;
    }

    // Check if stage is already completed
    if (userProgress[stageId]) {
        alert('You have already completed this stage!');
        return;
    }

    currentStage = stage;
    
    // Open video modal
    const videoModal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    const questionText = document.getElementById('questionText');
    const answerInput = document.getElementById('answerInput');
    const answerFeedback = document.getElementById('answerFeedback');

    // Set video URL
    videoFrame.src = `https://www.youtube.com/embed/${stage.videoId}?autoplay=1`;
    
    // Set question
    questionText.textContent = stage.question;
    
    // Clear previous input and feedback
    answerInput.value = '';
    answerFeedback.textContent = '';
    answerFeedback.className = 'feedback';

    videoModal.style.display = 'block';
}

// Close video modal
function closeVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const videoFrame = document.getElementById('videoFrame');
    
    videoFrame.src = '';
    videoModal.style.display = 'none';
    currentStage = null;
}

// Validate answer using Supabase function
async function validateAnswer(stage, step, answer) {
    console.log(`[VALIDATE] Validating stage ${stage}, step ${step}, answer: ${answer}`);
    
    try {
        const response = await fetch(`${supabaseUrl}/functions/v1/validate-answer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stage: stage,
                step: step,
                answer: answer
            })
        });

        console.log(`[VALIDATE] Response status: ${response.status}`);

        if (!response.ok) {
            console.error('Validation request failed:', response.status);
            return false;
        }

        const data = await response.json();
        console.log(`[VALIDATE] Response data:`, data);
        return data.ok === true;
    } catch (error) {
        console.error('Answer validation error:', error);
        return false;
    }
}

// Submit stage answer
async function submitStageAnswer() {
    if (!currentStage) return;

    const answerInput = document.getElementById('answerInput');
    const answerFeedback = document.getElementById('answerFeedback');
    const submitButton = document.getElementById('submitAnswer');

    const userAnswer = answerInput.value.trim();
    
    if (!userAnswer) {
        answerFeedback.textContent = 'Please enter an answer.';
        answerFeedback.className = 'feedback error';
        return;
    }

    // Disable submit button temporarily
    submitButton.disabled = true;
    answerFeedback.textContent = 'Validating answer...';
    answerFeedback.className = 'feedback';

    // Use Supabase function to validate answer
    const isCorrect = await validateAnswer(currentStage.id, 1, userAnswer);

    if (isCorrect) {
        // Correct answer!
        answerFeedback.textContent = 'Correct! Processing your completion...';
        answerFeedback.className = 'feedback success';

        // Mark as completed locally
        userProgress[currentStage.id] = true;
        saveLocalProgress();

        // Try to register as winner if user is authenticated
        let isFirstSolver = false;
        if (currentUser) {
            try {
                await saveUserProgress();
                isFirstSolver = await registerWinner(currentStage.id);
            } catch (error) {
                console.error('Failed to save progress or register winner:', error);
            }
        }

        // Close video modal
        closeVideoModal();

        // Show success modal
        showSuccessModal(currentStage, isFirstSolver);

        // Refresh winners data
        await loadWinners();

    } else {
        // Wrong answer
        answerFeedback.textContent = 'Not quite right. Watch the video again and try a different answer.';
        answerFeedback.className = 'feedback error';
    }

    // Re-enable submit button
    submitButton.disabled = false;
}

// Register winner for a stage
async function registerWinner(stageId) {
    if (!currentUser) return false;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return false;

        const response = await fetch(`${supabaseUrl}/functions/v1/app_5fe11f8255_register_winner`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ stage: stageId })
        });

        if (response.ok) {
            const data = await response.json();
            return data.success;
        }
    } catch (error) {
        console.error('Failed to register winner:', error);
    }

    return false;
}

// Show success modal
function showSuccessModal(stage, isFirstSolver) {
    const successModal = document.getElementById('successModal');
    const successTitle = document.getElementById('successTitle');
    const successMessage = document.getElementById('successMessage');
    const prizeNotification = document.getElementById('prizeNotification');

    if (isFirstSolver) {
        successTitle.textContent = '🏆 FIRST SOLVER! 🏆';
        successMessage.textContent = `Congratulations! You're the first person to solve Stage ${stage.id}!`;
        prizeNotification.textContent = `You've won ${stage.prize}! Check your email for prize details.`;
        prizeNotification.style.display = 'block';
    } else {
        successTitle.textContent = 'Stage Completed!';
        successMessage.textContent = `Great job completing Stage ${stage.id}! Keep going to unlock more challenges.`;
        prizeNotification.style.display = 'none';
    }

    successModal.style.display = 'block';
}

// Load user progress from Supabase
async function loadUserProgress() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('app_5fe11f8255_user_progress')
            .select('stage, completed')
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Error loading user progress:', error);
            return;
        }

        // Convert to our format
        const newProgress = {};
        if (data) {
            data.forEach(item => {
                if (item.completed) {
                    newProgress[item.stage] = true;
                }
            });
        }

        userProgress = newProgress;
        updateProgressDisplay();
        generateStageCards();
        
    } catch (error) {
        console.error('Failed to load user progress:', error);
    }
}

// Save user progress to Supabase
async function saveUserProgress() {
    if (!currentUser) return;

    try {
        const completedStages = Object.keys(userProgress).filter(stage => userProgress[stage]);
        
        for (const stage of completedStages) {
            const { error } = await supabase
                .from('app_5fe11f8255_user_progress')
                .upsert({
                    user_id: currentUser.id,
                    stage: parseInt(stage),
                    completed: true
                }, {
                    onConflict: 'user_id,stage'
                });

            if (error) {
                console.error('Error saving progress for stage', stage, error);
            }
        }
    } catch (error) {
        console.error('Failed to save user progress:', error);
    }
}

// Sync progress
async function syncProgress() {
    if (!currentUser) return;

    const syncButton = document.getElementById('syncButton');
    const originalText = syncButton.textContent;
    
    syncButton.textContent = '🔄 Syncing...';
    syncButton.disabled = true;

    try {
        await loadUserProgress();
        await loadWinners();
        
        syncButton.textContent = '✅ Synced!';
        setTimeout(() => {
            syncButton.textContent = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Sync failed:', error);
        syncButton.textContent = '❌ Sync Failed';
        setTimeout(() => {
            syncButton.textContent = originalText;
        }, 2000);
    } finally {
        syncButton.disabled = false;
    }
}

// Load progress from localStorage (fallback)
function loadLocalProgress() {
    const saved = localStorage.getItem('treasureHuntProgress');
    if (saved) {
        try {
            const localProgress = JSON.parse(saved);
            // Only use local progress if user is not authenticated
            if (!currentUser) {
                userProgress = localProgress;
                updateProgressDisplay();
                generateStageCards();
            }
        } catch (error) {
            console.error('Failed to load local progress:', error);
        }
    }
}

// Save progress to localStorage
function saveLocalProgress() {
    try {
        localStorage.setItem('treasureHuntProgress', JSON.stringify(userProgress));
    } catch (error) {
        console.error('Failed to save local progress:', error);
    }
}

// Update progress display
function updateProgressDisplay() {
    const completedCount = Object.keys(userProgress).filter(stage => userProgress[stage]).length;
    const totalEarned = completedCount * 50; // $50 per stage for stages 1-14, different for 15

    document.getElementById('completedCount').textContent = completedCount;
    document.getElementById('totalEarned').textContent = `$${totalEarned}`;
}

// Logout
async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
        
        currentUser = null;
        userProgress = {};
        showAuthSection();
        generateStageCards();
        
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// Listen for auth state changes
supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, session?.user?.email);
    
    if (event === 'SIGNED_IN' && session?.user) {
        currentUser = session.user;
        showUserSection();
        loadUserProgress();
        document.getElementById('authModal').style.display = 'none';
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        userProgress = {};
        showAuthSection();
        generateStageCards();
    }
});