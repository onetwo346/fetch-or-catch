// Game Constants and Variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const intro = document.getElementById("intro");
const controls = document.getElementById("controls");
const gameInterface = document.getElementById("gameInterface");
const levelUpScreen = document.getElementById("levelUp");
const gameOverScreen = document.getElementById("gameOver");

// Sound system with fallback
const sounds = {
  collect: new Audio(),
  obstacle: new Audio(),
  levelUp: new Audio(),
  gameOver: new Audio(),
  powerup: new Audio()
};

// Set sources and create fallback for sound errors
try {
  sounds.collect.src = "https://assets.mixkit.co/active_storage/sfx/208/208-preview.mp3";
  sounds.obstacle.src = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";
  sounds.levelUp.src = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3";
  sounds.gameOver.src = "https://assets.mixkit.co/active_storage/sfx/173/173-preview.mp3";
  sounds.powerup.src = "https://assets.mixkit.co/active_storage/sfx/2024/2024-preview.mp3";
  
  // Adjust sound volume
  for (const sound in sounds) {
    sounds[sound].volume = 0.3;
  }
} catch (e) {
  console.log("Error loading sounds:", e);
}

// Safe sound play function
function playSound(soundName) {
  try {
    if (sounds[soundName]) {
      sounds[soundName].currentTime = 0;
      const playPromise = sounds[soundName].play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Sound play error:", error);
        });
      }
    }
  } catch (e) {
    console.log("Error playing sound:", e);
  }
}

// Game state
let gameState = {
  score: 0,
  level: 1,
  lives: 3,
  targetScore: 100, // Score needed to complete level 1
  isPaused: false,
  hasActivePowerup: false,
  activePowerupType: null,
  powerupTimeLeft: 0,
  fallingItems: [],
  obstacles: [],
  particles: [],
  bonusItems: []
};

// Level configurations
const levelConfig = [
  { 
    targetScore: 100, 
    obstacleFrequency: 2000, 
    itemSpeed: 2,
    maxObstacles: 3,
    background: '#e0f7ff',
    specialItems: false
  },
  { 
    targetScore: 250, 
    obstacleFrequency: 1800, 
    itemSpeed: 2.5,
    maxObstacles: 4,
    background: '#d5f5ff',
    specialItems: true
  },
  { 
    targetScore: 500, 
    obstacleFrequency: 1600, 
    itemSpeed: 3,
    maxObstacles: 5,
    background: '#c8f0ff',
    specialItems: true
  },
  { 
    targetScore: 800, 
    obstacleFrequency: 1400, 
    itemSpeed: 3.5,
    maxObstacles: 6,
    background: '#b8ebff',
    specialItems: true
  },
  { 
    targetScore: 1200, 
    obstacleFrequency: 1200, 
    itemSpeed: 4,
    maxObstacles: 7,
    background: '#a0e4ff',
    specialItems: true
  }
];

// Basket properties with 3D effect
const basket = { 
  x: 170, 
  y: 520, 
  width: 80, 
  height: 60, 
  speed: 20,
  rotation: 0,
  depth: 20, // For 3D effect
  color: "#3498db",
  secondaryColor: "#2980b9",
  tertiaryColor: "#1a5276",
  powerupActive: false
};

// Define item types with points and 3D properties
const itemTypes = [
  { type: "fruit", points: 1, color: "#e74c3c", height: 8, shadowOffset: 5 }, // Apple
  { type: "gem", points: 2, color: "#3498db", height: 10, shadowOffset: 6 },  // Diamond
  { type: "coin", points: 3, color: "#f1c40f", height: 5, shadowOffset: 4 },  // Gold coin
  { type: "star", points: 5, color: "#f39c12", height: 12, shadowOffset: 7 }  // Star
];

// Special power-up items
const powerupTypes = [
  { type: "magnet", color: "#9b59b6", duration: 8000 }, // Attracts items
  { type: "shield", color: "#27ae60", duration: 10000 }, // Destroys obstacles
  { type: "slow", color: "#3498db", duration: 12000 },   // Slows down obstacles
  { type: "multiplier", color: "#e74c3c", duration: 15000 } // Score multiplier
];

// Obstacle types with 3D properties
const obstacleTypes = [
  { type: "spiky", color: "#8e44ad", deduction: 1, height: 15, shadowOffset: 8 },
  { type: "rock", color: "#7f8c8d", deduction: 1, height: 10, shadowOffset: 6 },
  { type: "bomb", color: "#e74c3c", deduction: 2, height: 12, shadowOffset: 7 }
];

// Game intervals
let obstacleInterval;
let powerupInterval;
let animationFrame;

// Helper functions for colors
function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return `#${(0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)}`;
}

function darkenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  return `#${(0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1)}`;
}

// Create a particle effect with 3D appearance
function createParticles(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    gameState.particles.push({
      x: x,
      y: y,
      size: Math.random() * 5 + 2,
      speedX: Math.random() * 6 - 3,
      speedY: Math.random() * 6 - 3,
      color: color,
      life: 30 + Math.random() * 20,
      opacity: 1,
      height: Math.random() * 5 // Z-height for 3D effect
    });
  }
}

// Update and draw particles with 3D effect
function updateParticles() {
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    p.x += p.speedX;
    p.y += p.speedY;
    p.life--;
    p.height *= 0.95; // Particle gradually falls to ground

    if (p.life <= 0) {
      gameState.particles.splice(i, 1);
      continue;
    }

    // Shadow
    ctx.globalAlpha = p.life / 80;
    ctx.fillStyle = "rgba(0,0,0,0.2)";
    ctx.beginPath();
    ctx.arc(p.x + 2, p.y + 2 + p.height, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Particle
    ctx.globalAlpha = p.life / 50;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Draw helper functions
function drawStar(x, y, spikes, outerRadius, innerRadius) {
  let rot = (Math.PI / 2) * 3;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(x, y - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    const x1 = x + Math.cos(rot) * outerRadius;
    const y1 = y + Math.sin(rot) * outerRadius;
    ctx.lineTo(x1, y1);
    rot += step;

    const x2 = x + Math.cos(rot) * innerRadius;
    const y2 = y + Math.sin(rot) * innerRadius;
    ctx.lineTo(x2, y2);
    rot += step;
  }
  
  ctx.closePath();
  ctx.fill();
}

function drawDiamond(x, y, size) {
  ctx.beginPath();
  ctx.moveTo(x, y - size/2);
  ctx.lineTo(x + size/2, y);
  ctx.lineTo(x, y + size/2);
  ctx.lineTo(x - size/2, y);
  ctx.closePath();
  ctx.fill();
}

// Draw 3D obstacles
function drawObstacles() {
  gameState.obstacles.forEach((obstacle) => {
    ctx.save();
    
    // Apply rotation
    ctx.translate(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2);
    ctx.rotate(obstacle.rotation);
    
    if (obstacle.obstacleType === "spiky") {
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      drawStar(obstacle.shadowOffset, obstacle.shadowOffset, 8, obstacle.size/2, obstacle.size/4);
      
      // Draw spiky ball with 3D effect
      const spikyGradient = ctx.createRadialGradient(
        0, -obstacle.height/2, obstacle.size/10,
        0, -obstacle.height/2, obstacle.size/2
      );
      spikyGradient.addColorStop(0, lightenColor(obstacle.color, 20));
      spikyGradient.addColorStop(1, obstacle.color);
      
      ctx.fillStyle = spikyGradient;
      drawStar(0, -obstacle.height/2, 8, obstacle.size/2, obstacle.size/3.5);
      
      // Add highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(-obstacle.size/6, -obstacle.size/6 - obstacle.height/2, obstacle.size/10, 0, Math.PI * 2);
      ctx.fill();
      
    } else if (obstacle.obstacleType === "rock") {
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.ellipse(obstacle.shadowOffset, obstacle.shadowOffset, obstacle.size/2, obstacle.size/3, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw rock with 3D texture
      const rockGradient = ctx.createRadialGradient(
        0, -obstacle.height/2, obstacle.size/10,
        0, -obstacle.height/2, obstacle.size/2
      );
      rockGradient.addColorStop(0, lightenColor(obstacle.color, 20));
      rockGradient.addColorStop(1, obstacle.color);
      
      ctx.fillStyle = rockGradient;
      
      // Draw irregular rock shape
      ctx.beginPath();
      ctx.moveTo(-obstacle.size/2, 0 - obstacle.height/2);
      ctx.quadraticCurveTo(-obstacle.size/2, -obstacle.size/2 - obstacle.height/2, 0, -obstacle.size/1.8 - obstacle.height/2);
      ctx.quadraticCurveTo(obstacle.size/2, -obstacle.size/2 - obstacle.height/2, obstacle.size/1.8, 0 - obstacle.height/2);
      ctx.quadraticCurveTo(obstacle.size/2, obstacle.size/2 - obstacle.height/2, 0, obstacle.size/1.8 - obstacle.height/2);
      ctx.quadraticCurveTo(-obstacle.size/2, obstacle.size/2 - obstacle.height/2, -obstacle.size/2, 0 - obstacle.height/2);
      ctx.closePath();
      ctx.fill();
      
      // Add texture lines
      ctx.strokeStyle = darkenColor(obstacle.color, 20);
      ctx.lineWidth = 1;
      
      // Cracks and texture details
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(
          (Math.random() - 0.5) * obstacle.size,
          (Math.random() - 0.5) * obstacle.size - obstacle.height/2
        );
        ctx.lineTo(
          (Math.random() - 0.5) * obstacle.size,
          (Math.random() - 0.5) * obstacle.size - obstacle.height/2
        );
        ctx.stroke();
      }
      
    } else if (obstacle.obstacleType === "bomb") {
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
      ctx.beginPath();
      ctx.arc(obstacle.shadowOffset, obstacle.shadowOffset, obstacle.size/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw bomb body with 3D effect
      const bombGradient = ctx.createRadialGradient(
        -obstacle.size/6, -obstacle.size/6 - obstacle.height/2, 0,
        0, 0 - obstacle.height/2, obstacle.size/2
      );
      bombGradient.addColorStop(0, "#4a4a4a");
      bombGradient.addColorStop(0.8, "#1a1a1a");
      
      ctx.fillStyle = bombGradient;
      ctx.beginPath();
      ctx.arc(0, -obstacle.height/2, obstacle.size/2, 0, Math.PI * 2);
      ctx.fill();
      
      // Draw fuse
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(-2, -obstacle.size/2 - 8 - obstacle.height/2, 4, 8);
      
      // Draw fuse spark
      ctx.fillStyle = "#FF4500";
      ctx.beginPath();
      ctx.arc(0, -obstacle.size/2 - 12 - obstacle.height/2, 4, 0, Math.PI * 2);
      ctx.fill();
      
      // Add highlight
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.arc(-obstacle.size/5, -obstacle.size/5 - obstacle.height/2, obstacle.size/8, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
    
    // Update rotation
    obstacle.rotation += obstacle.rotationSpeed;
    obstacle.y += obstacle.speed;
  });
}

// Check collision with 3D effect adjustment
function checkCollision(item) {
  return (
    item.x < basket.x + basket.width &&
    item.x + item.size > basket.x &&
    item.y + item.size > basket.y &&
    item.y < basket.y + basket.height
  );
}

// Handle keyboard movement
function moveBasket(event) {
  if (gameState.isPaused) return;
  
  if (event.key === "ArrowLeft" && basket.x > 0) {
    basket.x -= basket.speed;
  } else if (
    event.key === "ArrowRight" &&
    basket.x + basket.width < canvas.width
  ) {
    basket.x += basket.speed;
  }
}

// Handle touch movement for mobile
function touchMoveBasket(event) {
  if (gameState.isPaused) return;
  
  const touch = event.touches[0];
  const rect = canvas.getBoundingClientRect();
  const touchX = (touch.clientX - rect.left) * (canvas.width / rect.width);
  
  basket.x = touchX - basket.width / 2;
  
  if (basket.x < 0) basket.x = 0;
  if (basket.x + basket.width > canvas.width)
    basket.x = canvas.width - basket.width;
    
  event.preventDefault();
}

// Update game interface
function updateUI() {
  document.getElementById("score").innerText = `Score: ${gameState.score}`;
  document.getElementById("level").innerText = `Level: ${gameState.level}`;
  document.getElementById("lives").innerText = `Lives: ${gameState.lives}`;
  
  // Update progress bar
  const targetScore = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)].targetScore;
  const progress = Math.min(100, (gameState.score / targetScore) * 100);
  document.getElementById("progressBar").style.width = `${progress}%`;
  
  // Update powerup display
  const powerupElement = document.getElementById("powerup");
  if (gameState.hasActivePowerup) {
    powerupElement.classList.remove("hidden");
    powerupElement.innerText = `PowerUp: ${gameState.activePowerupType} (${Math.ceil(gameState.powerupTimeLeft / 1000)}s)`;
    
    if (gameState.powerupTimeLeft < 3000) {
      powerupElement.classList.add("flashing");
    } else {
      powerupElement.classList.remove("flashing");
    }
  } else {
    powerupElement.classList.add("hidden");
  }
}

// Main game loop
function gameLoop() {
  if (!gameState.isPaused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawBackground();
    drawBasket();
    drawFallingItems();
    drawObstacles();
    updateParticles();
    
    // Update active powerup time
    if (gameState.hasActivePowerup) {
      gameState.powerupTimeLeft -= 16; // ~60fps
      
      if (gameState.powerupTimeLeft <= 0) {
        gameState.hasActivePowerup = false;
        gameState.activePowerupType = null;
        basket.powerupActive = false;
      }
    }
    
    // Check collisions with falling items
    for (let i = gameState.fallingItems.length - 1; i >= 0; i--) {
      const item = gameState.fallingItems[i];
      
      if (checkCollision(item)) {
        // Apply score multiplier if active
        const multiplier = (gameState.hasActivePowerup && gameState.activePowerupType === "multiplier") ? 2 : 1;
        gameState.score += item.points * multiplier;
        
        // Create particles for celebration
        createParticles(item.x + item.size/2, item.y + item.size/2, item.color, 20);
        
        // Try to play sound
        try {
          playSound("collect");
        } catch (e) {
          console.log("Sound play error:", e);
        }
        
        gameState.fallingItems.splice(i, 1);
        gameState.fallingItems.push(createFallingItem());
        
        // Check if level is complete
        const currentLevelConfig = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
        if (gameState.score >= currentLevelConfig.targetScore) {
          levelUp();
          break;
        }
      } else if (item.y > canvas.height) {
        gameState.fallingItems[i] = createFallingItem();
      }
    }
    
    // Check collisions with bonus items (powerups)
    for (let i = gameState.bonusItems.length - 1; i >= 0; i--) {
      const item = gameState.bonusItems[i];
      
      if (checkCollision(item)) {
        // Activate powerup
        activatePowerup(item.powerupType, item.duration);
        
        // Create particles
        createParticles(item.x + item.size/2, item.y + item.size/2, item.color, 30);
        
        // Try to play sound
        try {
          playSound("powerup");
        } catch (e) {
          console.log("Sound play error:", e);
        }
        
        gameState.bonusItems.splice(i, 1);
      } else if (item.y > canvas.height) {
        gameState.bonusItems.splice(i, 1);
      }
    }
    
    // Check collisions with obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i];
      
      if (checkCollision(obstacle)) {
        // If shield powerup is active, destroy obstacle without penalty
        if (gameState.hasActivePowerup && gameState.activePowerupType === "shield") {
          createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, "#27ae60", 20);
        } else {
          // Deduct points and life
          gameState.score = Math.max(0, gameState.score - obstacle.points * 5);
          gameState.lives--;
          
          // Create particles for obstacle hit
          createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, obstacle.color, 15);
          
          // Check game over
          if (gameState.lives <= 0) {
            gameOver();
            break;
          }
          
          // Try to play sound
          try {
            playSound("obstacle");
          } catch (e) {
            console.log("Sound play error:", e);
          }
        }
        
        gameState.obstacles.splice(i, 1);
      } else if (obstacle.y > canvas.height) {
        gameState.obstacles.splice(i, 1);
      }
    }
    
    updateUI();
  }
  
  animationFrame = requestAnimationFrame(gameLoop);
}

// Activate powerup
function activatePowerup(type, duration) {
  gameState.hasActivePowerup = true;
  gameState.activePowerupType = type;
  gameState.powerupTimeLeft = duration;
  basket.powerupActive = true;
  
  // Display powerup notification
  document.getElementById("powerup").classList.remove("hidden");
  document.getElementById("powerup").innerText = `PowerUp: ${type} (${Math.ceil(duration / 1000)}s)`;
}

// Level up function
function levelUp() {
  gameState.level++;
  gameState.isPaused = true;
  
  // Try to play level up sound
  try {
    playSound("levelUp");
  } catch (e) {
    console.log("Sound play error:", e);
  }
  
  // Update level UI
  document.getElementById("newLevel").innerText = gameState.level;
  levelUpScreen.style.display = "flex";
  levelUpScreen.classList.add("show");
  
  // Reset progress bar
  document.getElementById("progressBar").style.width = "0%";
  
  // Update target score for next level
  if (gameState.level <= levelConfig.length) {
    gameState.targetScore = levelConfig[gameState.level - 1].targetScore;
  } else {
    // For levels beyond config, increase difficulty
    const lastLevelConfig = levelConfig[levelConfig.length - 1];
    gameState.targetScore = Math.floor(lastLevelConfig.targetScore * 1.5);
  }
}

// Game over function
function gameOver() {
  gameState.isPaused = true;
  
  // Try to play game over sound
  try {
    playSound("gameOver");
  } catch (e) {
    console.log("Sound play error:", e);
  }
  
  // Update game over UI
  document.getElementById("finalScore").innerText = gameState.score;
  document.getElementById("finalLevel").innerText = gameState.level;
  gameOverScreen.style.display = "flex";
  gameOverScreen.classList.add("show");
  
  // Clear intervals
  clearInterval(obstacleInterval);
  clearInterval(powerupInterval);
}

// Start the game
function startGame() {
  console.log("Starting game!");
  
  // Reset game state
  gameState = {
    score: 0,
    level: 1,
    lives: 3,
    targetScore: levelConfig[0].targetScore,
    isPaused: false,
    hasActivePowerup: false,
    activePowerupType: null,
    powerupTimeLeft: 0,
    fallingItems: [],
    obstacles: [],
    particles: [],
    bonusItems: []
  };
  
  // Reset basket
  basket.x = canvas.width / 2 - basket.width / 2;
  basket.powerupActive = false;
  
  // Reset UI
  updateUI();
  intro.style.display = "none";
  canvas.style.display = "block";
  controls.style.display = "flex";
  gameInterface.style.display = "block";
  levelUpScreen.style.display = "none";
  levelUpScreen.classList.remove("show");
  gameOverScreen.style.display = "none";
  gameOverScreen.classList.remove("show");
  
  // Create initial falling items
  gameState.fallingItems = [];
  for (let i = 0; i < 5; i++) {
    gameState.fallingItems.push(createFallingItem());
  }
  
  // Clear any existing intervals
  if (obstacleInterval) clearInterval(obstacleInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  // Create obstacles at intervals
  obstacleInterval = setInterval(() => {
    if (!gameState.isPaused) {
      const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
      if (gameState.obstacles.length < currentLevel.maxObstacles) {
        gameState.obstacles.push(createObstacle());
      }
    }
  }, levelConfig[0].obstacleFrequency);
  
  // Create powerups at intervals (from level 2+)
  powerupInterval = setInterval(() => {
    if (!gameState.isPaused && gameState.level >= 2 && gameState.bonusItems.length < 1 && Math.random() < 0.3) {
      gameState.bonusItems.push(createPowerup());
    }
  }, 10000);
  
  // Start the game loop
  gameLoop();
  
  console.log("Game started!");
}

// Continue to next level
function continueToNextLevel() {
  gameState.isPaused = false;
  levelUpScreen.style.display = "none";
  levelUpScreen.classList.remove("show");
  
  // Update obstacle interval based on new level
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  clearInterval(obstacleInterval);
  obstacleInterval = setInterval(() => {
    if (!gameState.isPaused && gameState.obstacles.length < currentLevel.maxObstacles) {
      gameState.obstacles.push(createObstacle());
    }
  }, currentLevel.obstacleFrequency);
}

// Restart the game
function restartGame() {
  startGame();
}

// Pause the game
function pauseGame() {
  gameState.isPaused = !gameState.isPaused;
  document.getElementById("pauseBtn").innerText = gameState.isPaused ? "Resume" : "Pause";
}

// Quit the game
function quitGame() {
  clearInterval(obstacleInterval);
  clearInterval(powerupInterval);
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  gameState.fallingItems = [];
  gameState.obstacles = [];
  gameState.particles = [];
  gameState.bonusItems = [];
  gameState.isPaused = false;
  
  canvas.style.display = "none";
  controls.style.display = "none";
  gameInterface.style.display = "none";
  intro.style.display = "flex";
  
  document.getElementById("score").innerText = "Score: 0";
  document.getElementById("level").innerText = "Level: 1";
  document.getElementById("lives").innerText = "Lives: 3";
  document.getElementById("progressBar").style.width = "0%";
}

// Event Listeners
document.getElementById("startGameBtn").addEventListener("click", startGame);
document.getElementById("restartBtn").addEventListener("click", restartGame);
document.getElementById("pauseBtn").addEventListener("click", pauseGame);
document.getElementById("quitBtn").addEventListener("click", quitGame);
document.getElementById("nextLevelBtn").addEventListener("click", continueToNextLevel);
document.getElementById("playAgainBtn").addEventListener("click", restartGame);

window.addEventListener("keydown", moveBasket);
canvas.addEventListener("touchmove", touchMoveBasket);

// Make canvas responsive
function resizeCanvas() {
  const maxWidth = window.innerWidth * 0.9;
  const maxHeight = window.innerHeight * 0.7;
  const aspectRatio = canvas.width / canvas.height;
  
  let newWidth = maxWidth;
  let newHeight = newWidth / aspectRatio;
  
  if (newHeight > maxHeight) {
    newHeight = maxHeight;
    newWidth = newHeight * aspectRatio;
  }
  
  canvas.style.width = newWidth + "px";
  canvas.style.height = newHeight + "px";
}

// Initial resize and resize on window change
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// Prevent context menu on long press (mobile)
canvas.addEventListener('contextmenu', function(e) {
  e.preventDefault();
});

// Initialize the game when the page loads
window.addEventListener('load', function() {
  console.log("Game initialized");
  // Initialize canvas size
  canvas.width = 400;
  canvas.height = 600;
  
  // Show intro and handle UI
  intro.style.display = "flex";
  canvas.style.display = "none";
  controls.style.display = "none";
  gameInterface.style.display = "none";
  
  // Make sure all UI elements are in the correct state
  document.getElementById("score").innerText = "Score: 0";
  document.getElementById("level").innerText = "Level: 1";
  document.getElementById("lives").innerText = "Lives: 3";
  document.getElementById("progressBar").style.width = "0%";
  
  // Preload sounds to avoid startup issues
  try {
    for (const sound in sounds) {
      sounds[sound].load();
    }
  } catch (e) {
    console.log("Error preloading sounds:", e);
  }
  
  // Setup mobile controls if on touch device
  if ("ontouchstart" in window) {
    setupMobileControls();
    document.getElementById("mobileControls").style.display = "flex";
  }
  
  // Ensure canvas is properly sized
  resizeCanvas();
});

// Setup mobile controls
function setupMobileControls() {
  const mobileControls = document.createElement("div");
  mobileControls.id = "mobileControls";
  
  const leftBtn = document.createElement("div");
  leftBtn.className = "controlBtn";
  leftBtn.innerHTML = "←";
  leftBtn.addEventListener("touchstart", () => {
    const moveLeftInterval = setInterval(() => {
      if (basket.x > 0) basket.x -= basket.speed/2;
    }, 16);
    
    leftBtn.addEventListener("touchend", () => {
      clearInterval(moveLeftInterval);
    });
  });
  
  const rightBtn = document.createElement("div");
  rightBtn.className = "controlBtn";
  rightBtn.innerHTML = "→";
  rightBtn.addEventListener("touchstart", () => {
    const moveRightInterval = setInterval(() => {
      if (basket.x + basket.width < canvas.width) basket.x += basket.speed/2;
    }, 16);
    
    rightBtn.addEventListener("touchend", () => {
      clearInterval(moveRightInterval);
    });
  });
  
  mobileControls.appendChild(leftBtn);
  mobileControls.appendChild(rightBtn);
  document.body.appendChild(mobileControls);
}

// Create a falling item with enhanced 3D properties
function createFallingItem() {
  const randomItem = itemTypes[Math.floor(Math.random() * itemTypes.length)];
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  
  return {
    x: Math.random() * (canvas.width - 40),
    y: -40,
    speed: currentLevel.itemSpeed + Math.random() * 1.5,
    size: 30,
    type: randomItem.type,
    points: randomItem.points,
    color: randomItem.color,
    rotation: 0,
    rotationSpeed: Math.random() * 0.06 - 0.03,
    scale: 1,
    scaleDirection: 0.005,
    height: randomItem.height, // Z-height for 3D effect
    shadowOffset: randomItem.shadowOffset
  };
}

// Create a powerup item
function createPowerup() {
  const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  
  return {
    x: Math.random() * (canvas.width - 40),
    y: -40,
    speed: currentLevel.itemSpeed + 1,
    size: 35,
    type: "powerup",
    powerupType: randomPowerup.type,
    color: randomPowerup.color,
    duration: randomPowerup.duration,
    rotation: 0,
    rotationSpeed: 0.05,
    scale: 1,
    scaleDirection: 0.01,
    height: 15, // Z-height for 3D effect
    shadowOffset: 10,
    glowing: true
  };
}

// Create an obstacle with enhanced 3D properties
function createObstacle() {
  const randomObstacle = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  
  return {
    x: Math.random() * (canvas.width - 40),
    y: -40,
    speed: gameState.hasActivePowerup && gameState.activePowerupType === "slow" 
           ? (currentLevel.itemSpeed + 0.5) * 0.5 
           : currentLevel.itemSpeed + 0.5 + Math.random() * 2,
    size: 30,
    type: "obstacle",
    obstacleType: randomObstacle.type,
    points: randomObstacle.deduction,
    color: randomObstacle.color,
    rotation: 0,
    rotationSpeed: randomObstacle.type === "spiky" ? 0.05 : 0.02,
    height: randomObstacle.height,
    shadowOffset: randomObstacle.shadowOffset
  };
}

// Draw background with enhanced visual elements
function drawBackground() {
  // Simple gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#e0f7ff");
  gradient.addColorStop(1, "#d8f3ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Ground
  ctx.fillStyle = "#a2d5f2";
  ctx.fillRect(0, canvas.height - 15, canvas.width, 15);
}

// Draw basket with simplified 3D effect
function drawBasket() {
  // Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(basket.x + 5, basket.y + 5, basket.width, basket.height);
  
  // Main basket
  ctx.fillStyle = basket.color;
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
  
  // Top edge
  ctx.fillStyle = basket.secondaryColor;
  ctx.fillRect(basket.x, basket.y, basket.width, 10);
  
  // Side edge
  ctx.fillStyle = basket.tertiaryColor;
  ctx.fillRect(basket.x + basket.width - 10, basket.y, 10, basket.height);
  
  // Basket pattern
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  
  // Vertical lines
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(basket.x + (basket.width / 4) * i, basket.y);
    ctx.lineTo(basket.x + (basket.width / 4) * i, basket.y + basket.height);
    ctx.stroke();
  }
  
  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(basket.x, basket.y + basket.height/2);
  ctx.lineTo(basket.x + basket.width, basket.y + basket.height/2);
  ctx.stroke();
}

// Draw falling items simply
function drawFallingItems() {
  // Draw regular items
  gameState.fallingItems.forEach(item => {
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(item.x + item.size/2 + 3, item.y + item.size/2 + 3, item.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Item
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x + item.size/2, item.y + item.size/2, item.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Update position
    item.y += item.speed;
  });
  
  // Draw bonus items (powerups)
  gameState.bonusItems.forEach(item => {
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(item.x + item.size/2 + 3, item.y + item.size/2 + 3, item.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Item
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x + item.size/2, item.y + item.size/2, item.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Text label
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.powerupType[0].toUpperCase(), item.x + item.size/2, item.y + item.size/2);
    
    // Update position
    item.y += item.speed;
  });
}

// Add a test function that can be called from the console
function testGame() {
  console.log("Testing game functionality...");
  
  // Test basic game objects
  console.log("Canvas:", canvas);
  console.log("Context:", ctx);
  console.log("Game State:", gameState);
  console.log("Basket:", basket);
  
  // Test drawing functions
  console.log("Testing draw functions...");
  try {
    drawBackground();
    drawBasket();
    console.log("Background and basket drawn successfully");
  } catch (e) {
    console.error("Error in drawing functions:", e);
  }
  
  // Test item creation
  console.log("Testing item creation...");
  try {
    const testItem = createFallingItem();
    gameState.fallingItems.push(testItem);
    console.log("Created test item:", testItem);
    
    const testObstacle = createObstacle();
    gameState.obstacles.push(testObstacle);
    console.log("Created test obstacle:", testObstacle);
    
    if (gameState.level >= 2) {
      const testPowerup = createPowerup();
      gameState.bonusItems.push(testPowerup);
      console.log("Created test powerup:", testPowerup);
    }
  } catch (e) {
    console.error("Error in item creation:", e);
  }
  
  // Test game movement
  console.log("Testing movement...");
  try {
    const oldY = gameState.fallingItems[0].y;
    // Force a game loop iteration
    gameLoop();
    const newY = gameState.fallingItems[0].y;
    console.log("Item before:", oldY, "Item after:", newY);
    if (newY > oldY) {
      console.log("Items are moving correctly!");
    } else {
      console.log("Movement test failed - items not moving");
    }
  } catch (e) {
    console.error("Error in movement test:", e);
  }
  
  return "Test complete - check console for results";
}

// Make test available in the window object
window.testGame = testGame;

// Run a simple test on load to verify functionality
window.addEventListener('load', function() {
  // Wait 1 second then run a simplified game test
  setTimeout(() => {
    try {
      console.log("Running automatic game verification...");
      
      // Verify canvas and context
      if (!canvas || !ctx) {
        console.error("Canvas or context not available!");
      } else {
        console.log("Canvas and context verified");
      }
      
      // Check if we can draw to the canvas
      try {
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(10, 10, 10, 10);
        console.log("Canvas drawing verified");
      } catch (e) {
        console.error("Canvas drawing failed:", e);
      }
    } catch (e) {
      console.error("Game verification failed:", e);
    }
  }, 1000);
}); 