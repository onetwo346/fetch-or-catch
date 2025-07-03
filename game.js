// Game Constants and Variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const intro = document.getElementById("intro");
const controls = document.getElementById("controls");
const gameInterface = document.getElementById("gameInterface");
const levelUpScreen = document.getElementById("levelUp");
const gameOverScreen = document.getElementById("gameOver");
const optionsScreen = document.getElementById("optionsScreen");

// Add screen shake variables
let screenShake = {
  active: false,
  intensity: 0,
  duration: 0,
  timeLeft: 0
};

// Sound system with fallback
const sounds = {
  collect: new Audio(),
  obstacle: new Audio(),
  levelUp: new Audio(),
  gameOver: new Audio(),
  powerup: new Audio(),
  background: new Audio(),
  jump: new Audio(),
  fall: new Audio(),
  button: new Audio(),
  bounce: new Audio(),
  start: new Audio()
};

// Set sources and create fallback for sound errors
try {
  sounds.collect.src = "https://assets.mixkit.co/active_storage/sfx/208/208-preview.mp3";
  sounds.obstacle.src = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";
  sounds.levelUp.src = "https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3";
  sounds.gameOver.src = "https://assets.mixkit.co/active_storage/sfx/173/173-preview.mp3";
  sounds.powerup.src = "https://assets.mixkit.co/active_storage/sfx/2024/2024-preview.mp3";
  sounds.background.src = "https://assets.mixkit.co/active_storage/sfx/209/209-preview.mp3";
  sounds.jump.src = "https://assets.mixkit.co/active_storage/sfx/240/240-preview.mp3";
  sounds.fall.src = "https://assets.mixkit.co/active_storage/sfx/235/235-preview.mp3";
  sounds.button.src = "https://assets.mixkit.co/active_storage/sfx/270/270-preview.mp3";
  sounds.bounce.src = "https://assets.mixkit.co/active_storage/sfx/238/238-preview.mp3";
  sounds.start.src = "https://assets.mixkit.co/active_storage/sfx/217/217-preview.mp3";
  
  // Adjust sound volume
  for (const sound in sounds) {
    sounds[sound].volume = 0.3;
  }
  
  // Set background music to loop
  sounds.background.loop = true;
} catch (e) {
  console.log("Error loading sounds:", e);
}

// Safe sound play function with performance optimization
function playSound(soundName) {
  try {
    if (sounds[soundName] && !gameState.isMuted) {
      // Don't replay sounds that are already playing to avoid audio stacking
      if (sounds[soundName].paused || sounds[soundName].ended) {
        sounds[soundName].currentTime = 0;
        const playPromise = sounds[soundName].play();
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.log("Sound play error:", error);
          });
        }
      }
    }
  } catch (e) {
    console.log("Error playing sound:", e);
  }
}

// Game state with enhanced performance tracking and smooth movement
let gameState = {
  score: 0,
  level: 1,
  lives: 3,
  targetScore: 100,
  isPaused: false,
  hasActivePowerup: false,
  activePowerupType: null,
  powerupTimeLeft: 0,
  fallingItems: [],
  obstacles: [],
  particles: [],
  bonusItems: [],
  isMuted: false,
  timeSlowFactor: null,
  lastFrameTime: 0,
  frameRate: 60,
  performanceMode: false,
  gameSpeed: 1.0,
  baseItemSpeed: 1.5,
  lastUpdateTime: 0,
  deltaTime: 0,
  smoothing: 0.8, // Movement smoothing factor
  devicePixelRatio: window.devicePixelRatio || 1,
  useRAF: true, // Use requestAnimationFrame
  fpsInterval: 1000 / 60, // Target 60 FPS
  now: 0,
  then: Date.now(),
  elapsed: 0
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

// User customization options
const customizations = {
  basketStyle: localStorage.getItem('gameBasket') || 'classic',
  theme: localStorage.getItem('gameTheme') || 'space'
};

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
  powerupActive: false,
  damageFlash: false, // Added damage flash effect
  style: customizations.basketStyle || 'classic' // Add basket style property
};

// Expanded item types with more variety
const itemTypes = [
  // Common Fruits
  { type: "apple", points: 1, color: "#e74c3c", height: 8, shadowOffset: 5, rarity: 0.4 }, 
  { type: "banana", points: 1, color: "#f1c40f", height: 7, shadowOffset: 4, rarity: 0.3 },
  { type: "orange", points: 1, color: "#f39c12", height: 8, shadowOffset: 5, rarity: 0.3 },
  { type: "strawberry", points: 1, color: "#e74c3c", height: 6, shadowOffset: 4, rarity: 0.3 },
  { type: "grape", points: 1, color: "#9b59b6", height: 5, shadowOffset: 3, rarity: 0.3 },
  
  // Special fruits
  { type: "watermelon", points: 2, color: "#2ecc71", height: 10, shadowOffset: 6, rarity: 0.1 },
  { type: "pineapple", points: 2, color: "#1abc9c", height: 9, shadowOffset: 5, rarity: 0.1 },
  { type: "kiwi", points: 2, color: "#27ae60", height: 7, shadowOffset: 4, rarity: 0.1 },
  { type: "mango", points: 2, color: "#f39c12", height: 8, shadowOffset: 5, rarity: 0.1 },
  { type: "coconut", points: 2, color: "#7f8c8d", height: 8, shadowOffset: 5, rarity: 0.1 },
  
  // Desserts and Rare Foods
  { type: "cake", points: 3, color: "#e67e22", height: 10, shadowOffset: 6, rarity: 0.05 },
  { type: "icecream", points: 3, color: "#3498db", height: 10, shadowOffset: 6, rarity: 0.05 },
  { type: "donut", points: 3, color: "#e74c3c", height: 8, shadowOffset: 5, rarity: 0.05 },
  
  // Gems and special items
  { type: "gem", points: 3, color: "#3498db", height: 10, shadowOffset: 6, rarity: 0.05 },
  { type: "coin", points: 3, color: "#f1c40f", height: 5, shadowOffset: 4, rarity: 0.05 },
  { type: "star", points: 5, color: "#9b59b6", height: 12, shadowOffset: 7, rarity: 0.02 },
  { type: "rainbow", points: 10, color: "#1abc9c", height: 14, shadowOffset: 8, rarity: 0.01 }
];

// Expanded powerup types with more exciting effects
const powerupTypes = [
  { type: "magnet", color: "#9b59b6", duration: 8000, emoji: "🧲" }, // Attracts items
  { type: "shield", color: "#27ae60", duration: 10000, emoji: "🛡️" }, // Destroys obstacles
  { type: "multiplier", color: "#e74c3c", duration: 15000, emoji: "2️⃣" }, // Score multiplier
  { type: "freeze", color: "#00bcd4", duration: 7000, emoji: "❄️" }, // Freezes all items briefly
  { type: "blast", color: "#ff9800", duration: 500, emoji: "💥" }, // Collects all items on screen
  { type: "extraLife", color: "#e91e63", duration: 500, emoji: "❤️" }, // Extra life
  { type: "giant", color: "#8bc34a", duration: 10000, emoji: "🔍" }, // Makes basket bigger
  { type: "timeSlow", color: "#673ab7", duration: 8000, emoji: "🕰️" }, // Matrix-style slow motion effect
  { type: "doubleTrouble", color: "#ff5722", duration: 12000, emoji: "👯" }, // Creates a second basket that follows the main one
  { type: "goldRush", color: "#ffc107", duration: 6000, emoji: "💰" }  // Turns all items into high-value items temporarily
];

// Enhanced obstacle types with more variety
const obstacleTypes = [
  { 
    type: "spiky", 
    color: "#8e44ad", 
    deduction: 1, 
    height: 15, 
    shadowOffset: 8, 
    speed: 1.5,
    rotationSpeed: 0.05,
    rarity: 0.3,
    emoji: "💥"
  },
  { 
    type: "rock", 
    color: "#7f8c8d", 
    deduction: 1, 
    height: 10, 
    shadowOffset: 6, 
    speed: 1,
    rotationSpeed: 0.02,
    rarity: 0.3,
    emoji: "🪨"
  },
  { 
    type: "bomb", 
    color: "#e74c3c", 
    deduction: 2, 
    height: 12, 
    shadowOffset: 7, 
    speed: 2,
    rotationSpeed: 0.03,
    rarity: 0.2,
    emoji: "💣"
  },
  { 
    type: "lightning", 
    color: "#f1c40f", 
    deduction: 3, 
    height: 14, 
    shadowOffset: 9, 
    speed: 2.5,
    rotationSpeed: 0.07,
    rarity: 0.1,
    emoji: "⚡"
  },
  { 
    type: "skull", 
    color: "#2c3e50", 
    deduction: 3, 
    height: 14, 
    shadowOffset: 8, 
    speed: 2.2,
    rotationSpeed: 0.04,
    rarity: 0.15,
    emoji: "💀"
  },
  { 
    type: "devil", 
    color: "#c0392b", 
    deduction: 4, 
    height: 16, 
    shadowOffset: 9, 
    speed: 3,
    rotationSpeed: 0.06,
    rarity: 0.05,
    emoji: "😈"
  },
  { 
    type: "gun", 
    color: "#34495e", 
    deduction: 3, 
    height: 12, 
    shadowOffset: 7, 
    speed: 2.8,
    rotationSpeed: 0.05,
    rarity: 0.05,
    emoji: "🔫"
  }
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
function updateParticles(deltaTime) {
  // Normalize for 60fps
  const timeScale = deltaTime * 60;
  
  // Pre-calculate offscreen boundaries for performance
  const offscreenBoundary = 30; // Slightly larger than particle size
  const minX = -offscreenBoundary;
  const maxX = canvas.width + offscreenBoundary;
  const minY = -offscreenBoundary;
  const maxY = canvas.height + offscreenBoundary;
  
  // Use a faster loop for better performance
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    
    // Apply frame-rate independent movement
    p.x += p.speedX * timeScale;
    p.y += p.speedY * timeScale;
    p.life -= timeScale;
    p.height *= Math.pow(0.95, timeScale); // Particle gradually falls to ground
    
    // Skip rendering particles with very low opacity for performance
    if (p.life <= 0 || p.x < minX || p.x > maxX || p.y < minY || p.y > maxY) {
      gameState.particles.splice(i, 1);
      continue;
    }
    
    // Use alpha based on life for fading effect
    const alpha = p.life / 50;
    
    // Skip drawing very transparent particles (improves performance)
    if (alpha < 0.05) continue;
    
    if (p.text) {
      // Text particle (like emoji hearts)
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size * 5}px Arial`;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      // Only draw shadow if not in performance mode
      if (!gameState.performanceMode) {
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.arc(p.x + 2, p.y + 2 + p.height, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Particle
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  
  // More aggressive particle limiting based on performance
  const particleLimit = gameState.performanceMode ? 80 : 200;
  if (gameState.particles.length > particleLimit) {
    gameState.particles.splice(0, gameState.particles.length - particleLimit);
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

// Intelligent item selection based on current level
function selectItemWithIntelligence() {
  const currentLevel = gameState.level;
  let availableItems = itemTypes.filter(item => {
    // Gradually introduce more rare items as levels progress
    if (currentLevel <= 2) return item.rarity <= 0.4; // Common items
    if (currentLevel <= 4) return item.rarity <= 0.7; // More variety
    return true; // All items available
  });

  // Weighted random selection
  const totalWeight = availableItems.reduce((sum, item) => sum + (1 / item.rarity), 0);
  let random = Math.random() * totalWeight;
  
  for (let item of availableItems) {
    random -= 1 / item.rarity;
    if (random <= 0) return item;
  }
  
  return availableItems[0]; // Fallback
}

// Intelligent obstacle selection
function selectObstacleWithIntelligence() {
  const currentLevel = gameState.level;
  let availableObstacles = obstacleTypes.filter(obstacle => {
    // Gradually introduce more challenging obstacles
    if (currentLevel <= 2) return obstacle.rarity <= 0.3; // Easy obstacles
    if (currentLevel <= 4) return obstacle.rarity <= 0.7; // More variety
    return true; // All obstacles available
  });

  // Weighted random selection
  const totalWeight = availableObstacles.reduce((sum, obstacle) => sum + (1 / obstacle.rarity), 0);
  let random = Math.random() * totalWeight;
  
  for (let obstacle of availableObstacles) {
    random -= 1 / obstacle.rarity;
    if (random <= 0) return obstacle;
  }
  
  return availableObstacles[0]; // Fallback
}

// Create a falling item with enhanced intelligence
function createFallingItem() {
  const randomItem = selectItemWithIntelligence();
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  
  // Use baseItemSpeed for more consistent difficulty regardless of frame rate
  const baseSpeed = gameState.baseItemSpeed + (0.25 * (gameState.level - 1));
  const randomFactor = Math.random() * 0.5 + 0.75; // 0.75-1.25 random factor
  
  // Find a position that doesn't overlap with existing items
  let x;
  let minDistance = 45; // Minimum distance between items
  let attempts = 0;
  let validPosition = false;
  
  while (!validPosition && attempts < 10) {
    x = Math.random() * (canvas.width - 40);
    validPosition = true;
    
    // Check distance from existing items
    for (const item of gameState.fallingItems) {
      const distance = Math.abs(x - item.x);
      if (distance < minDistance) {
        validPosition = false;
        break;
      }
    }
    
    // Also check distance from powerups
    for (const item of gameState.bonusItems) {
      const distance = Math.abs(x - item.x);
      if (distance < minDistance) {
        validPosition = false;
        break;
      }
    }
    
    attempts++;
  }
  
  if (!validPosition) {
    // If we couldn't find a good position after max attempts, 
    // use a random position but with a different Y to avoid overlap
    x = Math.random() * (canvas.width - 40);
  }
  
  // Add more dynamic properties
  return {
    x: x,
    y: -40 - Math.random() * 30, // Stagger vertical positions to avoid alignment
    speed: baseSpeed * randomFactor, // Consistent speed regardless of frame rate
    size: 30 + Math.random() * 10, // Slightly variable size
    type: randomItem.type,
    points: randomItem.points,
    color: randomItem.color,
    rotation: Math.random() * Math.PI * 2, // Random initial rotation
    rotationSpeed: (Math.random() * 0.1 - 0.05) / 60, // Rotation per frame, adjusted for 60fps
    scale: 1,
    scaleDirection: 0.005 + Math.random() * 0.005,
    height: randomItem.height,
    shadowOffset: randomItem.shadowOffset,
    wobble: (Math.random() * 0.5 - 0.25) / 60 // Add slight horizontal movement, adjusted for 60fps
  };
}

// Create a powerup item with enhanced visuals
function createPowerup() {
  const randomPowerup = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  
  // Find a position that doesn't overlap with existing items
  let x;
  let minDistance = 50; // Larger minimum distance for powerups
  let attempts = 0;
  let validPosition = false;
  
  while (!validPosition && attempts < 10) {
    x = Math.random() * (canvas.width - 40);
    validPosition = true;
    
    // Check distance from existing items
    for (const item of gameState.fallingItems) {
      const distance = Math.abs(x - item.x);
      if (distance < minDistance) {
        validPosition = false;
        break;
      }
    }
    
    // Also check distance from other powerups
    for (const item of gameState.bonusItems) {
      const distance = Math.abs(x - item.x);
      if (distance < minDistance) {
        validPosition = false;
        break;
      }
    }
    
    attempts++;
  }
  
  if (!validPosition) {
    // If we couldn't find a good position, use a random one but at a different Y
    x = Math.random() * (canvas.width - 40);
  }
  
  return {
    x: x,
    y: -40 - Math.random() * 50, // Start higher up to ensure no overlap
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
    glowing: true,
    emoji: randomPowerup.emoji || "✨",
    pulsePhase: Math.random() * Math.PI * 2 // Random starting phase for pulse animation
  };
}

// Create an obstacle with enhanced intelligence
function createObstacle() {
  const randomObstacle = selectObstacleWithIntelligence();
  const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
  
  // Base obstacle speed adjusted for frame rate independence
  let baseSpeed = gameState.baseItemSpeed + 0.5 + (0.3 * (gameState.level - 1));
  
  // Adjust speed for time slow powerup if active
  if (gameState.hasActivePowerup && gameState.activePowerupType === "timeSlow") {
    baseSpeed *= 0.5;
  }
  
  // Random speed factor for variety
  const randomFactor = Math.random() * 0.5 + 0.75; // 0.75-1.25 random factor
  
  // Find a position that doesn't overlap with existing obstacles
  let x;
  let minDistance = 50; // Minimum distance between obstacles
  let attempts = 0;
  let validPosition = false;
  
  while (!validPosition && attempts < 10) {
    x = Math.random() * (canvas.width - 40);
    validPosition = true;
    
    // Check distance from existing obstacles
    for (const obstacle of gameState.obstacles) {
      const distance = Math.abs(x - obstacle.x);
      if (distance < minDistance) {
        validPosition = false;
        break;
      }
    }
    
    attempts++;
  }
  
  if (!validPosition) {
    // If we couldn't find a good position, use a random one but at a different Y
    x = Math.random() * (canvas.width - 40);
  }
  
  // More dynamic obstacle generation
  return {
    x: x,
    y: -40 - Math.random() * 30, // Stagger vertical positions
    speed: baseSpeed * randomFactor,
    size: 30 + Math.random() * 15, // Variable size
    type: "obstacle",
    obstacleType: randomObstacle.type,
    points: randomObstacle.deduction,
    color: randomObstacle.color,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (randomObstacle.rotationSpeed + Math.random() * 0.02) / 60, // Adjusted for 60fps
    height: randomObstacle.height,
    shadowOffset: randomObstacle.shadowOffset,
    wobble: (Math.random() * 0.5 - 0.25) / 60, // Add slight horizontal movement, adjusted for 60fps
    emoji: randomObstacle.emoji
  };
}

// Draw background with enhanced 3D parallax effect
function drawBackground() {
  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  skyGradient.addColorStop(0, "#87CEEB");
  skyGradient.addColorStop(0.5, "#e0f7ff");
  skyGradient.addColorStop(1, "#d8f3ff");
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Create a time-based animation value
  const time = Date.now() / 5000;
  
  // Reduce cloud detail in performance mode
  const cloudCount = gameState.performanceMode ? 3 : 5;
  
  // Far distant clouds (slowest moving)
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  for (let i = 0; i < cloudCount; i++) {
    const x = ((i * 100 + time * 20) % (canvas.width + 100)) - 50;
    const y = 50 + i * 15;
    const width = 80 + i * 10;
    const height = 20 + i * 5;
    
    // Draw cloud with simplified shape in performance mode
    ctx.beginPath();
    ctx.ellipse(x, y, width/2, height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Only draw detailed clouds if not in performance mode
    if (!gameState.performanceMode) {
      // Secondary cloud parts
      ctx.beginPath();
      ctx.ellipse(x + width/4, y - height/4, width/3, height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.beginPath();
      ctx.ellipse(x - width/4, y - height/4, width/4, height/3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  
  // Mid-distance clouds (medium speed) - skip in extreme performance mode
  if (!gameState.performanceMode || gameState.frameRate > 40) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    const midCloudCount = gameState.performanceMode ? 2 : 3;
    for (let i = 0; i < midCloudCount; i++) {
      const x = ((i * 150 + time * 40) % (canvas.width + 150)) - 75;
      const y = 90 + i * 30;
      const width = 100 + i * 20;
      const height = 25 + i * 8;
      
      // Draw cloud
      ctx.beginPath();
      ctx.ellipse(x, y, width/2, height/2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Secondary cloud parts - only if not in performance mode
      if (!gameState.performanceMode) {
        ctx.beginPath();
        ctx.ellipse(x + width/3, y - height/3, width/3, height/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(x - width/3, y - height/5, width/4, height/3, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  
  // Ground with perspective effect
  const groundGradient = ctx.createLinearGradient(0, canvas.height - 100, 0, canvas.height);
  groundGradient.addColorStop(0, "#a2d5f2");
  groundGradient.addColorStop(1, "#7fbbda");
  
  ctx.fillStyle = groundGradient;
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 30);
  ctx.lineTo(canvas.width, canvas.height - 30);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.lineTo(0, canvas.height);
  ctx.closePath();
  ctx.fill();
  
  // Ground grid pattern for perspective - adjust detail based on performance
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  
  // Horizontal grid lines - reduce in performance mode
  const horizontalLines = gameState.performanceMode ? 5 : 10;
  for (let i = 0; i < horizontalLines; i++) {
    const y = canvas.height - 30 + (i * (30 / horizontalLines));
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Vertical grid lines with perspective - reduce in performance mode
  const verticalLines = gameState.performanceMode ? 10 : 20;
  for (let i = 0; i < verticalLines; i++) {
    const x = i * (canvas.width / verticalLines);
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 30);
    ctx.lineTo(canvas.width/2 + (x - canvas.width/2) * 0.8, canvas.height);
    ctx.stroke();
  }
  
  // Skip ambient lighting in performance mode
  if (!gameState.performanceMode) {
    // Add subtle ambient lighting effect
    const lightRadius = Math.max(canvas.width, canvas.height) * 0.8;
    const lightGradient = ctx.createRadialGradient(
      canvas.width/2, canvas.height/2, 10,
      canvas.width/2, canvas.height/2, lightRadius
    );
    lightGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    lightGradient.addColorStop(1, 'rgba(0, 100, 255, 0.1)');
    
    ctx.fillStyle = lightGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// Modified drawBasket function to handle different basket styles
function drawBasket() {
  ctx.save();
  ctx.translate(basket.x + basket.width / 2, basket.y + basket.height / 2);
  ctx.rotate(basket.rotation);
  
  // Choose basket style based on user selection
  switch(basket.style) {
    case 'futuristic':
      drawFuturisticBasket();
      break;
    case 'cute':
      drawCuteBasket();
      break;
    case 'box':
      drawBoxBasket();
      break;
    case 'hat':
      drawHatBasket();
      break;
    default:
      drawClassicBasket();
      break;
  }
  
  ctx.restore();
  
  // Add shadow beneath basket for 3D effect
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(
    basket.x + basket.width/2, 
    basket.y + basket.height + 10, 
    basket.width/2 * 0.8, 
    basket.height/4 * 0.5, 
    0, 0, Math.PI * 2
  );
  ctx.fill();
}

// Classic wicker basket style
function drawClassicBasket() {
  // Base basket shape - 3D effect with depth
  ctx.fillStyle = basket.powerupActive ? getPowerupBasketColor() : basket.color;
  
  // Bottom of basket (3D effect)
  ctx.fillStyle = basket.tertiaryColor;
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, basket.height/2);
  ctx.lineTo(-basket.width/2 + basket.depth, basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2 - basket.depth, basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2, basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Front face of basket
  ctx.fillStyle = basket.powerupActive ? getPowerupBasketColor() : basket.color;
  ctx.fillRect(-basket.width/2, -basket.height/2, basket.width, basket.height);
  
  // Right side of basket (3D)
  ctx.fillStyle = basket.secondaryColor;
  ctx.beginPath();
  ctx.moveTo(basket.width/2, -basket.height/2);
  ctx.lineTo(basket.width/2 - basket.depth, -basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2 - basket.depth, basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2, basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Top of basket (3D)
  ctx.fillStyle = basket.powerupActive ? getDarkerPowerupColor() : darkenColor(basket.color, 20);
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, -basket.height/2);
  ctx.lineTo(-basket.width/2 + basket.depth, -basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2 - basket.depth, -basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2, -basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Wicker pattern horizontal lines
  const lineCount = 5;
  const lineSpacing = basket.height / (lineCount + 1);
  
  ctx.strokeStyle = basket.powerupActive ? getLighterPowerupColor() : lightenColor(basket.color, 10);
  ctx.lineWidth = 2;
  
  for (let i = 1; i <= lineCount; i++) {
    const y = -basket.height/2 + i * lineSpacing;
    ctx.beginPath();
    ctx.moveTo(-basket.width/2, y);
    ctx.lineTo(basket.width/2, y);
    ctx.stroke();
  }
  
  // Wicker pattern vertical lines
  const vertLineCount = 8;
  const vertLineSpacing = basket.width / (vertLineCount + 1);
  
  for (let i = 1; i <= vertLineCount; i++) {
    const x = -basket.width/2 + i * vertLineSpacing;
    ctx.beginPath();
    ctx.moveTo(x, -basket.height/2);
    ctx.lineTo(x, basket.height/2);
    ctx.stroke();
  }
  
  // Handle
  ctx.strokeStyle = basket.powerupActive ? getDarkerPowerupColor() : basket.tertiaryColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -basket.height/2 - 20, basket.width/3, 0, Math.PI, true);
  ctx.stroke();
}

// Futuristic spaceship-style basket
function drawFuturisticBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#4686FF";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#00D1FF";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#1A3A75";
  
  // Main body
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, 0);
  ctx.lineTo(-basket.width/2 + 10, -basket.height/2);
  ctx.lineTo(basket.width/2 - 10, -basket.height/2);
  ctx.lineTo(basket.width/2, 0);
  ctx.lineTo(basket.width/2 - 15, basket.height/2);
  ctx.lineTo(-basket.width/2 + 15, basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Bottom shadow
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(-basket.width/2 + 15, basket.height/2);
  ctx.lineTo(basket.width/2 - 15, basket.height/2);
  ctx.lineTo(basket.width/2 - 20, basket.height/2 - 10);
  ctx.lineTo(-basket.width/2 + 20, basket.height/2 - 10);
  ctx.closePath();
  ctx.fill();
  
  // Cockpit/dome
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(0, -basket.height/4, basket.width/4, 0, Math.PI * 2);
  ctx.fill();
  
  // Dome highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(-5, -basket.height/4 - 5, basket.width/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Side thrusters
  ctx.fillStyle = darkColor;
  ctx.fillRect(-basket.width/2 - 10, -5, 12, 10);
  ctx.fillRect(basket.width/2 - 2, -5, 12, 10);
  
  // Thruster glow effect
  if (Math.random() > 0.5) {
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-basket.width/2 - 10, 0);
    ctx.lineTo(-basket.width/2 - 20, 5);
    ctx.lineTo(-basket.width/2 - 20, -5);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(basket.width/2 + 10, 0);
    ctx.lineTo(basket.width/2 + 20, 5);
    ctx.lineTo(basket.width/2 + 20, -5);
    ctx.fill();
  }
  
  // Detail lines
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-basket.width/3, basket.height/4);
  ctx.lineTo(basket.width/3, basket.height/4);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(-basket.width/4, basket.height/2 - 5);
  ctx.lineTo(basket.width/4, basket.height/2 - 5);
  ctx.stroke();
}

// Cute teddy bear basket style
function drawCuteBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#BA8E6D";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#8B5A2B";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#E8C19D";
  
  // Main body (bear shape)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.arc(0, 0, basket.width/2 - 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Ears
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.arc(-basket.width/3, -basket.height/2 + 5, basket.width/6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/3, -basket.height/2 + 5, basket.width/6, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner ears
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(-basket.width/3, -basket.height/2 + 5, basket.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/3, -basket.height/2 + 5, basket.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.arc(-basket.width/6, -basket.height/8, basket.width/14, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/6, -basket.height/8, basket.width/14, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye highlights
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-basket.width/6 + 2, -basket.height/8 - 2, basket.width/25, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/6 + 2, -basket.height/8 - 2, basket.width/25, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#FF9999';
  ctx.beginPath();
  ctx.arc(0, 0, basket.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, basket.height/8, basket.width/5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  
  // Basket opening/hollow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(0, basket.height/6, basket.width/3, 0, Math.PI * 2);
  ctx.fill();
}

// Box basket style
function drawBoxBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#A67C52";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#C69C6D";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#7D5A3C";
  
  // Main box
  ctx.fillStyle = baseColor;
  ctx.fillRect(-basket.width/2, -basket.height/2, basket.width, basket.height);
  
  // Box top flaps
  ctx.fillStyle = accentColor;
  
  // Left flap
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, -basket.height/2);
  ctx.lineTo(-basket.width/6, -basket.height/2 - basket.height/4);
  ctx.lineTo(0, -basket.height/2);
  ctx.lineTo(-basket.width/2, -basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Right flap
  ctx.beginPath();
  ctx.moveTo(basket.width/2, -basket.height/2);
  ctx.lineTo(basket.width/6, -basket.height/2 - basket.height/4);
  ctx.lineTo(0, -basket.height/2);
  ctx.lineTo(basket.width/2, -basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Box details - tape
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 4;
  
  // Horizontal tape
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, 0);
  ctx.lineTo(basket.width/2, 0);
  ctx.stroke();
  
  // Vertical tape
  ctx.beginPath();
  ctx.moveTo(0, -basket.height/2);
  ctx.lineTo(0, basket.height/2);
  ctx.stroke();
  
  // Box inner shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(-basket.width/2 + 5, -basket.height/2 + 5, basket.width - 10, basket.height - 10);
  
  // Box edge highlights
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(-basket.width/2, -basket.height/2, basket.width, basket.height);
  
  // Optional box label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = Math.floor(basket.width/10) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("CATCH", 0, basket.height/4);
}

// Hat basket style
function drawHatBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#2C3E50";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#34495E";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#1B2631";
  
  // Hat brim
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(0, basket.height/3, basket.width/2, basket.height/6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat body (cylinder)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(0, -basket.height/3, basket.width/3, basket.height/10, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Connect the top and bottom of hat
  ctx.beginPath();
  ctx.moveTo(-basket.width/3, -basket.height/3);
  ctx.lineTo(-basket.width/3, basket.height/3);
  ctx.lineTo(basket.width/3, basket.height/3);
  ctx.lineTo(basket.width/3, -basket.height/3);
  ctx.closePath();
  ctx.fill();
  
  // Hat band
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.rect(-basket.width/3, -basket.height/6, basket.width*2/3, basket.height/10);
  ctx.fill();
  
  // Hat band decoration
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(basket.width/6, -basket.height/6 + basket.height/20, basket.width/12, basket.height/20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Inside of the hat (hollow for catching)
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(0, -basket.height/3, basket.width/4, basket.height/12, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat shine effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -basket.height/3, basket.width/3.5, basket.height/11, 0, Math.PI * 0.3, Math.PI * 0.7);
  ctx.stroke();
}

// Helper function to get color based on active powerup
function getPowerupBasketColor() {
  if (gameState.hasActivePowerup && gameState.activePowerupType) {
    const powerupInfo = powerupTypes.find(p => p.type === gameState.activePowerupType);
    return powerupInfo ? powerupInfo.color : basket.color;
  }
  return basket.color;
}

function getLighterPowerupColor() {
  if (gameState.hasActivePowerup && gameState.activePowerupType) {
    const powerupInfo = powerupTypes.find(p => p.type === gameState.activePowerupType);
    return powerupInfo ? lightenColor(powerupInfo.color, 30) : lightenColor(basket.color, 30);
  }
  return lightenColor(basket.color, 30);
}

function getDarkerPowerupColor() {
  if (gameState.hasActivePowerup && gameState.activePowerupType) {
    const powerupInfo = powerupTypes.find(p => p.type === gameState.activePowerupType);
    return powerupInfo ? darkenColor(powerupInfo.color, 30) : darkenColor(basket.color, 30);
  }
  return darkenColor(basket.color, 30);
}

// Modify drawFallingItems to add more realistic fruit rendering
function drawFallingItems() {
  // Draw regular items
  gameState.fallingItems.forEach(item => {
    // Skip if completely frozen
    if (item.frozen) {
      // Draw frozen effect
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#00bcd4";
      ctx.beginPath();
      ctx.arc(item.x + item.size/2, item.y + item.size/2, item.size/1.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Ice crystals
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = item.x + item.size/2 + Math.cos(angle) * (item.size/2 + 3);
        const y = item.y + item.size/2 + Math.sin(angle) * (item.size/2 + 3);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5);
        ctx.strokeStyle = "#81d4fa";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
      return;
    }
    
    // Add wobble effect
    item.x += item.wobble;
    
    // Constrain to canvas
    item.x = Math.max(0, Math.min(item.x, canvas.width - item.size));
    
    // Shadow with wobble
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(item.x + item.size/2 + 3, item.y + item.size/2 + 3, item.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Rotate item
    ctx.save();
    ctx.translate(item.x + item.size/2, item.y + item.size/2);
    ctx.rotate(item.rotation);
    
    // Draw different food shapes based on type
    switch(item.type) {
      case "apple":
        // Apple body
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Apple stem
        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(-2, -item.size/2, 4, 6);
        
        // Leaf
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.ellipse(4, -item.size/2 + 2, 5, 3, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        break;
      
      case "banana":
        // Banana shape (curved)
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.moveTo(-item.size/2, 0);
        ctx.quadraticCurveTo(0, -item.size/2, item.size/2, 0);
        ctx.quadraticCurveTo(0, item.size/4, -item.size/2, 0);
        ctx.closePath();
        ctx.fill();
        
        // Banana highlights
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        ctx.moveTo(-item.size/3, 0);
        ctx.quadraticCurveTo(0, -item.size/3, item.size/3, 0);
        ctx.stroke();
        break;
        
      case "orange":
        // Orange body
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Orange texture lines
        ctx.strokeStyle = "#e67e22";
        ctx.lineWidth = 1;
        for (let i = 0; i < 4; i++) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(i * Math.PI/2) * item.size/2, Math.sin(i * Math.PI/2) * item.size/2);
          ctx.stroke();
        }
        break;
      
      case "strawberry":
        // Strawberry body
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Strawberry seeds
        ctx.fillStyle = "#f1c40f";
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const distance = item.size / 3;
          ctx.fillRect(
            Math.cos(angle) * distance - 1,
            Math.sin(angle) * distance - 1,
            2, 2
          );
        }
        
        // Strawberry stem and leaf
        ctx.fillStyle = "#27ae60";
        ctx.beginPath();
        ctx.moveTo(-3, -item.size/2);
        ctx.lineTo(3, -item.size/2);
        ctx.lineTo(0, -item.size/2 - 5);
        ctx.closePath();
        ctx.fill();
        break;
      
      case "grape":
        // Cluster of grapes
        ctx.fillStyle = "#9b59b6";
        
        // Main grape
        ctx.beginPath();
        ctx.arc(0, 0, item.size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Surrounding grapes
        for (let i = 0; i < 5; i++) {
          const angle = i * Math.PI / 2.5;
          ctx.beginPath();
          ctx.arc(
            Math.cos(angle) * item.size/3,
            Math.sin(angle) * item.size/3,
            item.size/4,
            0, Math.PI * 2
          );
          ctx.fill();
        }
        
        // Stem
        ctx.strokeStyle = "#7f8c8d";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -item.size/3);
        ctx.lineTo(0, -item.size/2);
        ctx.stroke();
        break;
        
      case "watermelon":
        // Watermelon slice shape
        ctx.fillStyle = "#2ecc71";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        
        // Red flesh
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2.2, 0, Math.PI);
        ctx.closePath();
        ctx.fill();
        
        // Seeds
        ctx.fillStyle = "#34495e";
        for (let i = -2; i <= 2; i++) {
          for (let j = 0; j <= 1; j++) {
            ctx.beginPath();
            ctx.ellipse(i * 5, j * 5 - 5, 1.5, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
        
      case "pineapple":
        // Pineapple body
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        ctx.ellipse(0, 0, item.size/3, item.size/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Pineapple texture (diamond pattern)
        ctx.strokeStyle = "#e67e22";
        ctx.lineWidth = 1;
        
        // Create diamond pattern
        for (let i = -2; i <= 2; i++) {
          for (let j = -3; j <= 3; j++) {
            ctx.beginPath();
            ctx.rect(i * 5, j * 5, 4, 4);
            ctx.stroke();
          }
        }
        
        // Leaves on top
        ctx.fillStyle = "#27ae60";
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(0, -item.size/2);
          ctx.lineTo(i * 8, -item.size/2 - 10);
          ctx.lineTo(0, -item.size/2 - 5);
          ctx.closePath();
          ctx.fill();
        }
        break;
      
      case "kiwi":
        // Kiwi slice
        ctx.fillStyle = "#7f8c8d"; // Outer skin
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Green flesh
        ctx.fillStyle = "#27ae60";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2.3, 0, Math.PI * 2);
        ctx.fill();
        
        // White center
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Seeds
        ctx.fillStyle = "#34495e";
        for (let i = 0; i < 8; i++) {
          const angle = i * Math.PI / 4;
          const distance = item.size / 3.5;
          ctx.beginPath();
          ctx.ellipse(
            Math.cos(angle) * distance,
            Math.sin(angle) * distance,
            1.5, 1,
            angle,
            0, Math.PI * 2
          );
          ctx.fill();
        }
        break;
        
      case "mango":
        // Mango shape
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        ctx.ellipse(0, 0, item.size/3, item.size/2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Mango highlights
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.ellipse(-item.size/10, -item.size/10, item.size/5, item.size/4, Math.PI/4, 0, Math.PI * 2);
        ctx.fill();
        
        // Mango stem
        ctx.fillStyle = "#7f8c8d";
        ctx.fillRect(-2, -item.size/2, 4, 5);
        break;
        
      case "coconut":
        // Coconut
        ctx.fillStyle = "#7f8c8d";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Coconut texture
        ctx.strokeStyle = "#34495e";
        ctx.lineWidth = 1;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, 0, item.size/2 - i*3, 0, Math.PI * 2);
          ctx.stroke();
        }
        
        // "Eyes" of coconut
        ctx.fillStyle = "#34495e";
        ctx.beginPath();
        ctx.arc(-item.size/5, -item.size/5, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(item.size/5, -item.size/5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case "cake":
        // Cake base
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(-item.size/2, -item.size/4, item.size, item.size/2);
        
        // Frosting
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.ellipse(0, -item.size/4, item.size/2, item.size/6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Cherry on top
        ctx.fillStyle = "#e74c3c";
        ctx.beginPath();
        ctx.arc(0, -item.size/3, item.size/8, 0, Math.PI * 2);
        ctx.fill();
        
        // Candle
        ctx.fillStyle = "#3498db";
        ctx.fillRect(-2, -item.size/3 - item.size/6, 4, item.size/6);
        
        // Flame
        ctx.fillStyle = "#f39c12";
        ctx.beginPath();
        ctx.ellipse(0, -item.size/3 - item.size/6 - 3, 2, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case "icecream":
        // Cone
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.moveTo(-item.size/3, item.size/3);
        ctx.lineTo(item.size/3, item.size/3);
        ctx.lineTo(0, item.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Waffle pattern on cone
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-item.size/6, item.size/3);
        ctx.lineTo(-item.size/12, item.size/2.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(item.size/6, item.size/3);
        ctx.lineTo(item.size/12, item.size/2.5);
        ctx.stroke();
        
        // Ice cream scoop
        ctx.fillStyle = "#3498db"; // Blue ice cream
        ctx.beginPath();
        ctx.arc(0, -item.size/6, item.size/3, 0, Math.PI * 2);
        ctx.fill();
        
        // Sprinkles
        const sprinkleColors = ["#e74c3c", "#f1c40f", "#2ecc71", "#9b59b6"];
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = sprinkleColors[i % sprinkleColors.length];
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * item.size/4;
          ctx.save();
          ctx.translate(Math.cos(angle) * distance, Math.sin(angle) * distance - item.size/6);
          ctx.rotate(angle);
          ctx.fillRect(-2, -0.5, 4, 1);
          ctx.restore();
        }
        break;
        
      case "donut":
        // Donut base
        ctx.fillStyle = "#e67e22";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Donut hole
        ctx.fillStyle = "#ecf0f1";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/5, 0, Math.PI * 2);
        ctx.fill();
        
        // Pink frosting
        ctx.fillStyle = "#e84393";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.arc(0, 0, item.size/3.5, 0, Math.PI * 2, true);
        ctx.fill();
        
        // Sprinkles
        const donutSprinkleColors = ["#3498db", "#f1c40f", "#2ecc71", "#9b59b6"];
        for (let i = 0; i < 8; i++) {
          ctx.fillStyle = donutSprinkleColors[i % donutSprinkleColors.length];
          const angle = i * Math.PI / 4 + Math.PI / 8;
          ctx.save();
          ctx.translate(Math.cos(angle) * item.size/2.5, Math.sin(angle) * item.size/2.5);
          ctx.rotate(angle);
          ctx.fillRect(-2, -0.5, 4, 1);
          ctx.restore();
        }
        break;
        
      case "gem":
        // Draw diamond with more 3D effect
        ctx.fillStyle = item.color;
        drawDiamond(0, 0, item.size);
        
        // Add sparkle effect
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-item.size/5, -item.size/5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case "coin":
        // Gold coin
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Coin edge
        ctx.strokeStyle = "#f39c12";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2.5, 0, Math.PI * 2);
        ctx.stroke();
        
        // Dollar sign
        ctx.strokeStyle = "#d35400";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -item.size/5);
        ctx.lineTo(0, item.size/5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-item.size/8, -item.size/5);
        ctx.lineTo(item.size/8, -item.size/5);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(-item.size/8, item.size/5);
        ctx.lineTo(item.size/8, item.size/5);
        ctx.stroke();
        break;
        
      case "star":
        // Star
        ctx.fillStyle = item.color;
        drawStar(0, 0, 5, item.size/2, item.size/4);
        
        // Add sparkle effect
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(-item.size/5, -item.size/5, 2, 0, Math.PI * 2);
        ctx.fill();
        break;
        
      case "rainbow":
        // Rainbow item (ultra rare)
        const rainbowColors = ["#e74c3c", "#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];
        
        // Draw rainbow layers
        for (let i = 0; i < rainbowColors.length; i++) {
          const radius = item.size/2 - (i * item.size/12);
          ctx.fillStyle = rainbowColors[i];
          ctx.beginPath();
          ctx.arc(0, 0, radius, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // White center
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(0, 0, item.size/6, 0, Math.PI * 2);
        ctx.fill();
        
        // Add sparkle effect
        if (Math.random() > 0.7) {
          const sparkleAngle = Math.random() * Math.PI * 2;
          const sparkleDistance = Math.random() * item.size/2;
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(
            Math.cos(sparkleAngle) * sparkleDistance,
            Math.sin(sparkleAngle) * sparkleDistance,
            2, 0, Math.PI * 2
          );
          ctx.fill();
        }
        break;
        
      default:
        // Default for any other items
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(0, 0, item.size/2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Restore context
    ctx.restore();
    
    // Update rotation and position
    item.rotation += item.rotationSpeed;
    item.y += item.speed;
  });
  
  // Draw bonus items (powerups) with enhanced effects
  gameState.bonusItems.forEach(item => {
    // Similar modifications as falling items
    item.x += item.wobble;
    item.x = Math.max(0, Math.min(item.x, canvas.width - item.size));
    
    // Pulse animation for powerups
    item.pulsePhase += 0.1;
    const pulseFactor = 0.15 * Math.sin(item.pulsePhase) + 1;
    
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.arc(item.x + item.size/2 + 3, item.y + item.size/2 + 3, item.size/2, 0, Math.PI * 2);
    ctx.fill();
    
    // Rotate item
    ctx.save();
    ctx.translate(item.x + item.size/2, item.y + item.size/2);
    ctx.rotate(item.rotation);
    
    // Add glow effect
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 15;
    
    // Draw powerup with pulsing effect
    const pulseSize = item.size * pulseFactor;
    
    // Outer glow
    const gradient = ctx.createRadialGradient(0, 0, pulseSize/3, 0, 0, pulseSize/1.5);
    gradient.addColorStop(0, item.color);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, pulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    // Inner circle
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(0, 0, item.size/2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Text label with emoji
    ctx.fillStyle = "white";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(item.emoji, 0, 0);
    
    // Restore context
    ctx.restore();
    
    // Update rotation and position
    item.rotation += item.rotationSpeed;
    item.y += item.speed;
    
    // Add sparkling particles occasionally
    if (Math.random() > 0.9) {
      gameState.particles.push({
        x: item.x + Math.random() * item.size,
        y: item.y + Math.random() * item.size,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 2,
        speedY: (Math.random() - 0.5) * 2,
        color: item.color,
        life: 30,
        opacity: 1,
        height: Math.random() * 5
      });
    }
  });
}

// Modify drawObstacles to add dramatic effects
function drawObstacles() {
  gameState.obstacles.forEach((obstacle) => {
    // Skip normal rendering if completely frozen
    if (obstacle.frozen) {
      // Draw frozen effect similar to frozen items
      ctx.save();
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#00bcd4";
      ctx.beginPath();
      ctx.arc(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, obstacle.size/1.8, 0, Math.PI * 2);
      ctx.fill();
      
      // Ice crystals
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const x = obstacle.x + obstacle.size/2 + Math.cos(angle) * (obstacle.size/2 + 3);
        const y = obstacle.y + obstacle.size/2 + Math.sin(angle) * (obstacle.size/2 + 3);
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * 5, y + Math.sin(angle) * 5);
        ctx.strokeStyle = "#81d4fa";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      
      // Draw the original obstacle but faded inside the ice
      ctx.globalAlpha = 0.5;
      if (obstacle.emoji) {
        ctx.font = `${obstacle.size}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(obstacle.emoji, obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2);
      }
      
      ctx.restore();
      return;
    }
    
    // Add wobble effect
    obstacle.x += obstacle.wobble;
    
    // Constrain to canvas
    obstacle.x = Math.max(0, Math.min(obstacle.x, canvas.width - obstacle.size));
    
    ctx.save();
    
    // Apply translation
    ctx.translate(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2);
    
    // Add rotation for 3D effect
    ctx.rotate(obstacle.rotation);
    
    // Calculate 3D hover effect - makes obstacles float up and down slightly
    const hoverOffset = Math.sin(Date.now() / 300 + obstacle.x) * 3;
    
    // Add dramatic shadow based on height
    const shadowSize = obstacle.size * 0.7;
    const shadowY = 10 + hoverOffset/2;
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.ellipse(0, shadowY, shadowSize/2, shadowSize/4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // NEW: Add warning glow effect to all obstacles (pulsing red aura)
    const glowPulse = Math.sin(Date.now() / 200) * 0.3 + 0.7; // Value between 0.4 and 1.0
    const glowSize = obstacle.size * (1.2 + glowPulse * 0.3);
    const glowGradient = ctx.createRadialGradient(0, 0, obstacle.size/2, 0, 0, glowSize);
    glowGradient.addColorStop(0, `rgba(255, 0, 0, ${0.5 * glowPulse})`);
    glowGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(0, 0, glowSize, 0, Math.PI * 2);
    ctx.fill();
    
    // Use emoji with advanced rendering if available
    if (obstacle.emoji) {
      // Apply floating animation
      ctx.translate(0, -hoverOffset);
      
      // Add dramatic glow effect color based on obstacle type
      switch(obstacle.obstacleType) {
        case "skull":
          ctx.shadowColor = "#2c3e50";
          ctx.shadowBlur = 15;
          break;
        case "devil":
          ctx.shadowColor = "#c0392b";
          ctx.shadowBlur = 20;
          break;
        case "bomb":
          ctx.shadowColor = "#e74c3c";
          ctx.shadowBlur = 15;
          
          // Add bomb fuse particle effect
          if (Math.random() > 0.7) {
            gameState.particles.push({
              x: obstacle.x + obstacle.size/2,
              y: obstacle.y + obstacle.size/2 - obstacle.size/3,
              size: Math.random() * 3 + 1,
              speedX: Math.random() * 1 - 0.5,
              speedY: -Math.random() * 2 - 1,
              color: Math.random() > 0.5 ? "#e74c3c" : "#f39c12",
              life: 20 + Math.random() * 10,
              opacity: 1,
              height: Math.random() * 5
            });
          }
          break;
        case "lightning":
          // Flicker effect for lightning
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          ctx.shadowColor = "#f1c40f";
          ctx.shadowBlur = 10 + Math.random() * 20;
          break;
        default:
          ctx.shadowColor = obstacle.color;
          ctx.shadowBlur = 10;
      }
      
      // Draw emoji with enhanced size
      const emojiScale = 1 + Math.sin(Date.now() / 500) * 0.05; // Subtle pulsing effect
      ctx.font = `${obstacle.size * emojiScale}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obstacle.emoji, 0, 0);
      
      // Add subtle colored overlay for more dimension
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = obstacle.color;
      ctx.beginPath();
      ctx.arc(0, 0, obstacle.size/2.2, 0, Math.PI * 2);
      ctx.fill();
      
      // Reset alpha
      ctx.globalAlpha = 1;
    } else {
      // Fallback to traditional drawing with enhanced effects
      ctx.translate(0, -hoverOffset);
      ctx.shadowColor = obstacle.color;
      ctx.shadowBlur = 15;
      
      switch(obstacle.obstacleType) {
        case "spiky":
          // Spiky ball with enhanced gradient
          const spikyGradient = ctx.createRadialGradient(
            -obstacle.size/8, -obstacle.size/8, 0,
            0, 0, obstacle.size/1.5
          );
          spikyGradient.addColorStop(0, lightenColor(obstacle.color, 40));
          spikyGradient.addColorStop(0.6, obstacle.color);
          spikyGradient.addColorStop(1, darkenColor(obstacle.color, 30));
          
          ctx.fillStyle = spikyGradient;
          drawStar(0, 0, 8, obstacle.size/2, obstacle.size/5);
          break;
        
        case "rock":
          // Rock with enhanced texture
          const rockGradient = ctx.createRadialGradient(
            -obstacle.size/6, -obstacle.size/6, 0,
            0, 0, obstacle.size/1.5
          );
          rockGradient.addColorStop(0, lightenColor(obstacle.color, 20));
          rockGradient.addColorStop(0.7, obstacle.color);
          rockGradient.addColorStop(1, darkenColor(obstacle.color, 40));
          
          ctx.fillStyle = rockGradient;
          
          // Draw more natural rock shape
          ctx.beginPath();
          ctx.moveTo(-obstacle.size/2, 0);
          
          // Use sin-based randomizer for more natural rock shape
          const rockSeed = obstacle.x + obstacle.y; // Consistent seed
          for (let i = 0; i <= 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const noise = Math.sin(angle * 3 + rockSeed) * 0.2 + 0.8;
            const x = Math.cos(angle) * obstacle.size/2 * noise;
            const y = Math.sin(angle) * obstacle.size/2 * noise;
            ctx.lineTo(x, y);
          }
          
          ctx.closePath();
          ctx.fill();
          
          // Add rocky texture
          ctx.strokeStyle = darkenColor(obstacle.color, 20);
          ctx.lineWidth = 1;
          for (let i = 0; i < 5; i++) {
            const startAngle = Math.random() * Math.PI * 2;
            const length = Math.random() * obstacle.size * 0.8;
            const startX = Math.cos(startAngle) * obstacle.size/5;
            const startY = Math.sin(startAngle) * obstacle.size/5;
            const endX = startX + Math.cos(startAngle) * length;
            const endY = startY + Math.sin(startAngle) * length;
            
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
          }
          break;
        
        case "bomb":
          // Bomb with enhanced gradient
          const bombGradient = ctx.createRadialGradient(
            -obstacle.size/6, -obstacle.size/6, 0,
            0, 0, obstacle.size/1.5
          );
          bombGradient.addColorStop(0, "#6d6d6d");
          bombGradient.addColorStop(0.7, "#2d2d2d");
          bombGradient.addColorStop(1, "#1a1a1a");
          
          ctx.fillStyle = bombGradient;
          ctx.beginPath();
          ctx.arc(0, 0, obstacle.size/2, 0, Math.PI * 2);
          ctx.fill();
          
          // Add highlight
          ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
          ctx.beginPath();
          ctx.arc(-obstacle.size/5, -obstacle.size/5, obstacle.size/6, 0, Math.PI * 2);
          ctx.fill();
          
          // Fuse
          ctx.fillStyle = "#8B4513";
          ctx.fillRect(-2, -obstacle.size/2 - 8, 4, 8);
          
          // Fuse tip with animation
          ctx.fillStyle = Math.random() > 0.5 ? "#e74c3c" : "#f39c12";
          ctx.beginPath();
          ctx.arc(0, -obstacle.size/2 - 8, 3 + Math.random() * 2, 0, Math.PI * 2);
          ctx.fill();
          break;
        
        case "lightning":
          // Lightning bolt with flickering effect
          ctx.globalAlpha = 0.7 + Math.random() * 0.3;
          
          // Create zigzag lightning shape with inner glow
          const boltGradient = ctx.createLinearGradient(
            -obstacle.size/2, -obstacle.size/2,
            obstacle.size/2, obstacle.size/2
          );
          boltGradient.addColorStop(0, "#ffeb3b");
          boltGradient.addColorStop(0.5, "#FFC107");
          boltGradient.addColorStop(1, "#FF9800");
          
          ctx.fillStyle = boltGradient;
          ctx.beginPath();
          
          // Custom zigzag lightning shape
          ctx.moveTo(0, -obstacle.size/2);
          ctx.lineTo(obstacle.size/4, -obstacle.size/6);
          ctx.lineTo(0, obstacle.size/6);
          ctx.lineTo(obstacle.size/2, obstacle.size/2);
          ctx.lineTo(obstacle.size/4, 0);
          ctx.lineTo(-obstacle.size/4, obstacle.size/3);
          ctx.lineTo(-obstacle.size/2, -obstacle.size/3);
          ctx.closePath();
          ctx.fill();
          
          // Add white core for extreme brightness effect
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          ctx.beginPath();
          ctx.moveTo(0, -obstacle.size/3);
          ctx.lineTo(obstacle.size/8, -obstacle.size/8);
          ctx.lineTo(0, obstacle.size/8);
          ctx.lineTo(obstacle.size/4, obstacle.size/3);
          ctx.lineTo(obstacle.size/8, 0);
          ctx.lineTo(-obstacle.size/8, obstacle.size/5);
          ctx.lineTo(-obstacle.size/4, -obstacle.size/4);
          ctx.closePath();
          ctx.fill();
          break;
      }
    }
    
    // Reset shadow and context
    ctx.shadowBlur = 0;
    ctx.restore();
    
    // Update rotation and position
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
    if (Math.random() > 0.9) playSound("jump");
  } else if (
    event.key === "ArrowRight" &&
    basket.x + basket.width < canvas.width
  ) {
    basket.x += basket.speed;
    if (Math.random() > 0.9) playSound("jump");
  }
  
  // M key for mute toggle
  if (event.key === "m" || event.key === "M") {
    toggleMute();
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
  document.getElementById("level").innerHTML = `Level: ${gameState.level} 🏆`;
  
  // Update lives with heart icons
  const livesElement = document.getElementById("lives");
  let heartsHTML = '';
  for (let i = 0; i < gameState.lives; i++) {
    heartsHTML += '❤️';
  }
  for (let i = 0; i < 3 - gameState.lives; i++) {
    heartsHTML += '🖤';
  }
  livesElement.innerHTML = `Lives: ${heartsHTML}`;
  
  // Update progress bar
  const targetScore = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)].targetScore;
  const progress = Math.min(100, (gameState.score / targetScore) * 100);
  document.getElementById("progressBar").style.width = `${progress}%`;
  
  // Update powerup display
  const powerupElement = document.getElementById("powerup");
  if (gameState.hasActivePowerup) {
    powerupElement.classList.remove("hidden");
    const emoji = powerupTypes.find(p => p.type === gameState.activePowerupType)?.emoji || '';
    powerupElement.innerHTML = `PowerUp: ${gameState.activePowerupType} <span class="powerup-emoji">${emoji}</span> (${Math.ceil(gameState.powerupTimeLeft / 1000)}s)`;
    
    if (gameState.powerupTimeLeft < 3000) {
      powerupElement.classList.add("flashing");
    } else {
      powerupElement.classList.remove("flashing");
    }
  } else {
    powerupElement.classList.add("hidden");
  }
}

// Main game loop with frame rate independence
function animate(currentTime) {
  if (gameState.isPaused) {
    animationFrame = requestAnimationFrame(animate);
    return;
  }

  // Calculate time elapsed since last frame
  gameState.now = currentTime;
  gameState.elapsed = gameState.now - gameState.then;

  // Only draw if enough time has elapsed
  if (gameState.elapsed > gameState.fpsInterval) {
    // Adjust for time sync
    gameState.then = gameState.now - (gameState.elapsed % gameState.fpsInterval);
    
    // Calculate delta time for smooth animations
    const deltaTime = Math.min((gameState.now - gameState.lastFrameTime) / 1000, 0.1); // Cap at 100ms
    gameState.lastFrameTime = gameState.now;
    gameState.deltaTime = deltaTime;

    // Clear with optimization
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Apply screen shake with smoothing
    if (screenShake.active) {
      applyScreenShake(deltaTime);
    }
    
    // Draw game elements with delta time
    drawBackground();
    updateParticles(deltaTime);
    updateAndDrawItems(deltaTime);
    drawBasket();

    // Performance monitoring
    if (!gameState.performanceMode && deltaTime > 1/30) {
      console.log('Performance drop detected, enabling optimizations');
      enablePerformanceMode();
    }
  }

  // Request next frame
  animationFrame = requestAnimationFrame(animate);
}

// Update screen shake effect with frame rate independence
function updateScreenShake(deltaTime) {
  if (screenShake.active) {
    screenShake.timeLeft -= deltaTime * 1000; // Convert to ms
    
    if (screenShake.timeLeft <= 0) {
      screenShake.active = false;
      canvas.style.transform = ''; // Reset transform
      return;
    }
    
    const intensity = screenShake.intensity * (screenShake.timeLeft / screenShake.duration);
    const offsetX = (Math.random() * 2 - 1) * intensity;
    const offsetY = (Math.random() * 2 - 1) * intensity;
    
    // Apply transform directly to the canvas element
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }
}

// Add speed control buttons to game interface
function addSpeedControls() {
  const speedControlsDiv = document.createElement("div");
  speedControlsDiv.id = "speedControls";
  speedControlsDiv.style.position = "absolute";
  speedControlsDiv.style.top = "10px";
  speedControlsDiv.style.right = "10px";
  speedControlsDiv.style.display = "flex";
  speedControlsDiv.style.gap = "5px";
  
  const speedLabel = document.createElement("div");
  speedLabel.id = "speedLabel";
  speedLabel.innerText = "Speed: Normal";
  speedLabel.style.fontSize = "14px";
  speedLabel.style.padding = "5px";
  speedLabel.style.backgroundColor = "rgba(0,0,0,0.5)";
  speedLabel.style.color = "white";
  speedLabel.style.borderRadius = "5px";
  
  const decreaseBtn = document.createElement("button");
  decreaseBtn.innerText = "🐢";
  decreaseBtn.style.fontSize = "16px";
  decreaseBtn.style.padding = "5px 10px";
  decreaseBtn.style.cursor = "pointer";
  decreaseBtn.style.backgroundColor = "#27ae60";
  decreaseBtn.style.border = "none";
  decreaseBtn.style.borderRadius = "5px";
  decreaseBtn.addEventListener("click", () => {
    changeGameSpeed(-0.25);
    playSound("button");
  });
  
  const increaseBtn = document.createElement("button");
  increaseBtn.innerText = "🐇";
  increaseBtn.style.fontSize = "16px";
  increaseBtn.style.padding = "5px 10px";
  increaseBtn.style.cursor = "pointer";
  increaseBtn.style.backgroundColor = "#e74c3c";
  increaseBtn.style.border = "none";
  increaseBtn.style.borderRadius = "5px";
  increaseBtn.addEventListener("click", () => {
    changeGameSpeed(0.25);
    playSound("button");
  });
  
  const resetBtn = document.createElement("button");
  resetBtn.innerText = "🔄";
  resetBtn.style.fontSize = "16px";
  resetBtn.style.padding = "5px 10px";
  resetBtn.style.cursor = "pointer";
  resetBtn.style.backgroundColor = "#3498db";
  resetBtn.style.border = "none";
  resetBtn.style.borderRadius = "5px";
  resetBtn.addEventListener("click", () => {
    resetGameSpeed();
    playSound("button");
  });
  
  speedControlsDiv.appendChild(speedLabel);
  speedControlsDiv.appendChild(decreaseBtn);
  speedControlsDiv.appendChild(resetBtn);
  speedControlsDiv.appendChild(increaseBtn);
  
  gameInterface.appendChild(speedControlsDiv);
}

// Change game speed
function changeGameSpeed(delta) {
  gameState.gameSpeed = Math.max(0.25, Math.min(2.0, gameState.gameSpeed + delta));
  updateSpeedLabel();
}

// Reset game speed to normal
function resetGameSpeed() {
  gameState.gameSpeed = 1.0;
  updateSpeedLabel();
}

// Update speed label
function updateSpeedLabel() {
  const speedLabel = document.getElementById("speedLabel");
  if (speedLabel) {
    let speedText = "Normal";
    if (gameState.gameSpeed < 0.75) speedText = "Very Slow";
    else if (gameState.gameSpeed < 1.0) speedText = "Slow";
    else if (gameState.gameSpeed > 1.5) speedText = "Very Fast";
    else if (gameState.gameSpeed > 1.0) speedText = "Fast";
    
    speedLabel.innerText = `Speed: ${speedText}`;
    
    // Update level position after speed label changes
    setTimeout(() => {
      const levelElement = document.getElementById("level");
      const speedControls = document.getElementById("speedControls");
      
      if (levelElement && speedControls) {
        // Get position of speed controls
        const speedRect = speedControls.getBoundingClientRect();
        
        // Move level display below speed controls
        levelElement.style.top = (speedRect.bottom + 10) + "px";
        levelElement.style.right = "10px";
      }
    }, 50);
  }
}

// Fix UI overlap issue by moving level display
// This code will move the UI position via JavaScript rather than modifying CSS
// to ensure that it doesn't overlap with the game speed controls
window.addEventListener("DOMContentLoaded", function() {
  // Make sure this runs after the speed controls are added
  setTimeout(() => {
    const levelElement = document.getElementById("level");
    const speedControls = document.getElementById("speedControls");
    
    if (levelElement && speedControls) {
      // Get position of speed controls
      const speedRect = speedControls.getBoundingClientRect();
      
      // Move level display below speed controls
      levelElement.style.top = (speedRect.bottom + 10) + "px";
      levelElement.style.right = "10px";
    }
  }, 500); // Slight delay to ensure all elements are loaded
});

// Update level position whenever window is resized
window.addEventListener("resize", function() {
  setTimeout(() => {
    const levelElement = document.getElementById("level");
    const speedControls = document.getElementById("speedControls");
    
    if (levelElement && speedControls) {
      // Get position of speed controls
      const speedRect = speedControls.getBoundingClientRect();
      
      // Move level display below speed controls
      levelElement.style.top = (speedRect.bottom + 10) + "px";
      levelElement.style.right = "10px";
    }
  }, 100);
});

// Also update level position whenever game speed is changed
// Removed duplicate function definition to prevent conflicts

// Create a dedicated heart explosion effect function for the extraLife powerup
function createHeartExplosion() {
  // Create a larger visual effect for extra life
  const heartExplode = document.createElement("div");
  heartExplode.innerHTML = "❤️";
  heartExplode.style.position = "fixed";
  heartExplode.style.fontSize = "100px";
  heartExplode.style.top = "50%";
  heartExplode.style.left = "50%";
  heartExplode.style.transform = "translate(-50%, -50%)";
  heartExplode.style.zIndex = "1000";
  heartExplode.style.animation = "heartbeat 0.5s ease-in-out";
  heartExplode.style.pointerEvents = "none";
  document.body.appendChild(heartExplode);
  
  // Add heart animation keyframes if not already in document
  if (!document.getElementById("heartbeatKeyframes")) {
    const keyframes = document.createElement("style");
    keyframes.id = "heartbeatKeyframes";
    keyframes.innerHTML = `
      @keyframes heartbeat {
        0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 1; }
        100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
      }
    `;
    document.head.appendChild(keyframes);
  }
  
  // Create heart particles radiating from the center
  for (let i = 0; i < 20; i++) {
    gameState.particles.push({
      x: canvas.width/2,
      y: canvas.height/2,
      size: Math.random() * 5 + 2,
      speedX: Math.random() * 8 - 4,
      speedY: Math.random() * 8 - 4,
      color: "#e91e63",
      life: 60 + Math.random() * 20,
      opacity: 1,
      height: Math.random() * 5,
      text: "❤️"
    });
  }
  
  // Show healing effect around all sides of the screen
  const healEffect = document.createElement("div");
  healEffect.style.position = "fixed";
  healEffect.style.top = "0";
  healEffect.style.left = "0";
  healEffect.style.width = "100%";
  healEffect.style.height = "100%";
  healEffect.style.boxShadow = "inset 0 0 50px rgba(233, 30, 99, 0.7)";
  healEffect.style.pointerEvents = "none";
  healEffect.style.zIndex = "999";
  healEffect.style.animation = "pulsateHeal 0.5s ease-in-out";
  document.body.appendChild(healEffect);
  
  // Add heal pulse animation if not already in document
  if (!document.getElementById("healPulseKeyframes")) {
    const keyframes = document.createElement("style");
    keyframes.id = "healPulseKeyframes";
    keyframes.innerHTML = `
      @keyframes pulsateHeal {
        0% { opacity: 0; }
        50% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(keyframes);
  }
  
  // Add screen flash
  const flashOverlay = document.createElement("div");
  flashOverlay.style.position = "fixed";
  flashOverlay.style.top = "0";
  flashOverlay.style.left = "0";
  flashOverlay.style.width = "100%";
  flashOverlay.style.height = "100%";
  flashOverlay.style.backgroundColor = "rgba(233, 30, 99, 0.2)";
  flashOverlay.style.zIndex = "998";
  flashOverlay.style.pointerEvents = "none";
  document.body.appendChild(flashOverlay);
  
  // Add heart rain effect
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      const heartRain = document.createElement("div");
      heartRain.innerHTML = "❤️";
      heartRain.style.position = "fixed";
      heartRain.style.fontSize = Math.random() * 20 + 15 + "px";
      heartRain.style.top = "-30px";
      heartRain.style.left = Math.random() * 100 + "%";
      heartRain.style.opacity = "0.8";
      heartRain.style.zIndex = "997";
      heartRain.style.animation = `heartRain ${Math.random() * 2 + 2}s linear forwards`;
      heartRain.style.pointerEvents = "none";
      document.body.appendChild(heartRain);
      
      // Add heart rain animation if not already in document
      if (!document.getElementById("heartRainKeyframes")) {
        const keyframes = document.createElement("style");
        keyframes.id = "heartRainKeyframes";
        keyframes.innerHTML = `
          @keyframes heartRain {
            0% { transform: translateY(0) rotate(0deg); opacity: 0.8; }
            100% { transform: translateY(${window.innerHeight + 30}px) rotate(360deg); opacity: 0; }
          }
        `;
        document.head.appendChild(keyframes);
      }
      
      // Remove heart rain element after animation
      setTimeout(() => {
        document.body.removeChild(heartRain);
      }, 4000);
    }, i * 100);
  }
  
  // Remove visual elements after animation
  setTimeout(() => {
    document.body.removeChild(heartExplode);
    document.body.removeChild(healEffect);
    document.body.removeChild(flashOverlay);
  }, 500);
}

// Add function to create basket shrink effect
function createBasketShrinkEffect() {
  // Create shrink effect particles
  const basketCenterX = basket.x + basket.width/2;
  const basketCenterY = basket.y + basket.height/2;
  
  // Create particles around the basket perimeter
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const offsetX = Math.cos(angle) * (basket.width/2 + 10);
    const offsetY = Math.sin(angle) * (basket.height/2 + 5);
    
    gameState.particles.push({
      x: basketCenterX + offsetX,
      y: basketCenterY + offsetY,
      size: Math.random() * 4 + 2,
      speedX: offsetX * 0.05,
      speedY: offsetY * 0.05,
      color: "#ff3030", // Red particles for damage
      life: 40 + Math.random() * 20,
      opacity: 1,
      height: Math.random() * 3
    });
  }
  
  // Create flash effect on the basket
  basket.damageFlash = true;
  setTimeout(() => {
    basket.damageFlash = false;
  }, 500);
  
  // Add visual feedback with canvas flash
  const flashOverlay = document.createElement("div");
  flashOverlay.style.position = "fixed";
  flashOverlay.style.top = "0";
  flashOverlay.style.left = "0";
  flashOverlay.style.width = "100%";
  flashOverlay.style.height = "100%";
  flashOverlay.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
  flashOverlay.style.zIndex = "999";
  flashOverlay.style.pointerEvents = "none";
  flashOverlay.style.animation = "basketShrinkFlash 0.5s ease-out forwards";
  document.body.appendChild(flashOverlay);
  
  // Add flash animation keyframes if not already in document
  if (!document.getElementById("basketShrinkKeyframes")) {
    const keyframes = document.createElement("style");
    keyframes.id = "basketShrinkKeyframes";
    keyframes.innerHTML = `
      @keyframes basketShrinkFlash {
        0% { opacity: 0.2; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(keyframes);
  }
  
  // Remove flash after animation
  setTimeout(() => {
    document.body.removeChild(flashOverlay);
  }, 500);
}

// Modify the drawBasket function to show damage flash effect
function drawBasket() {
  ctx.save();
  ctx.translate(basket.x + basket.width / 2, basket.y + basket.height / 2);
  ctx.rotate(basket.rotation);
  
  // Choose basket style based on user selection
  switch(basket.style) {
    case 'futuristic':
      drawFuturisticBasket();
      break;
    case 'cute':
      drawCuteBasket();
      break;
    case 'box':
      drawBoxBasket();
      break;
    case 'hat':
      drawHatBasket();
      break;
    default:
      drawClassicBasket();
      break;
  }
  
  ctx.restore();
  
  // Add shadow beneath basket for 3D effect
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(
    basket.x + basket.width/2, 
    basket.y + basket.height + 10, 
    basket.width/2 * 0.8, 
    basket.height/4 * 0.5, 
    0, 0, Math.PI * 2
  );
  ctx.fill();
}

// Classic wicker basket style
function drawClassicBasket() {
  // Base basket shape - 3D effect with depth
  ctx.fillStyle = basket.powerupActive ? getPowerupBasketColor() : basket.color;
  
  // Bottom of basket (3D effect)
  ctx.fillStyle = basket.tertiaryColor;
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, basket.height/2);
  ctx.lineTo(-basket.width/2 + basket.depth, basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2 - basket.depth, basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2, basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Front face of basket
  ctx.fillStyle = basket.powerupActive ? getPowerupBasketColor() : basket.color;
  ctx.fillRect(-basket.width/2, -basket.height/2, basket.width, basket.height);
  
  // Right side of basket (3D)
  ctx.fillStyle = basket.secondaryColor;
  ctx.beginPath();
  ctx.moveTo(basket.width/2, -basket.height/2);
  ctx.lineTo(basket.width/2 - basket.depth, -basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2 - basket.depth, basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2, basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Top of basket (3D)
  ctx.fillStyle = basket.powerupActive ? getDarkerPowerupColor() : darkenColor(basket.color, 20);
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, -basket.height/2);
  ctx.lineTo(-basket.width/2 + basket.depth, -basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2 - basket.depth, -basket.height/2 - basket.depth);
  ctx.lineTo(basket.width/2, -basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Wicker pattern horizontal lines
  const lineCount = 5;
  const lineSpacing = basket.height / (lineCount + 1);
  
  ctx.strokeStyle = basket.powerupActive ? getLighterPowerupColor() : lightenColor(basket.color, 10);
  ctx.lineWidth = 2;
  
  for (let i = 1; i <= lineCount; i++) {
    const y = -basket.height/2 + i * lineSpacing;
    ctx.beginPath();
    ctx.moveTo(-basket.width/2, y);
    ctx.lineTo(basket.width/2, y);
    ctx.stroke();
  }
  
  // Wicker pattern vertical lines
  const vertLineCount = 8;
  const vertLineSpacing = basket.width / (vertLineCount + 1);
  
  for (let i = 1; i <= vertLineCount; i++) {
    const x = -basket.width/2 + i * vertLineSpacing;
    ctx.beginPath();
    ctx.moveTo(x, -basket.height/2);
    ctx.lineTo(x, basket.height/2);
    ctx.stroke();
  }
  
  // Handle
  ctx.strokeStyle = basket.powerupActive ? getDarkerPowerupColor() : basket.tertiaryColor;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -basket.height/2 - 20, basket.width/3, 0, Math.PI, true);
  ctx.stroke();
}

// Futuristic spaceship-style basket
function drawFuturisticBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#4686FF";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#00D1FF";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#1A3A75";
  
  // Main body
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, 0);
  ctx.lineTo(-basket.width/2 + 10, -basket.height/2);
  ctx.lineTo(basket.width/2 - 10, -basket.height/2);
  ctx.lineTo(basket.width/2, 0);
  ctx.lineTo(basket.width/2 - 15, basket.height/2);
  ctx.lineTo(-basket.width/2 + 15, basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Bottom shadow
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.moveTo(-basket.width/2 + 15, basket.height/2);
  ctx.lineTo(basket.width/2 - 15, basket.height/2);
  ctx.lineTo(basket.width/2 - 20, basket.height/2 - 10);
  ctx.lineTo(-basket.width/2 + 20, basket.height/2 - 10);
  ctx.closePath();
  ctx.fill();
  
  // Cockpit/dome
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(0, -basket.height/4, basket.width/4, 0, Math.PI * 2);
  ctx.fill();
  
  // Dome highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(-5, -basket.height/4 - 5, basket.width/8, 0, Math.PI * 2);
  ctx.fill();
  
  // Side thrusters
  ctx.fillStyle = darkColor;
  ctx.fillRect(-basket.width/2 - 10, -5, 12, 10);
  ctx.fillRect(basket.width/2 - 2, -5, 12, 10);
  
  // Thruster glow effect
  if (Math.random() > 0.5) {
    ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
    ctx.beginPath();
    ctx.moveTo(-basket.width/2 - 10, 0);
    ctx.lineTo(-basket.width/2 - 20, 5);
    ctx.lineTo(-basket.width/2 - 20, -5);
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(basket.width/2 + 10, 0);
    ctx.lineTo(basket.width/2 + 20, 5);
    ctx.lineTo(basket.width/2 + 20, -5);
    ctx.fill();
  }
  
  // Detail lines
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-basket.width/3, basket.height/4);
  ctx.lineTo(basket.width/3, basket.height/4);
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(-basket.width/4, basket.height/2 - 5);
  ctx.lineTo(basket.width/4, basket.height/2 - 5);
  ctx.stroke();
}

// Cute teddy bear basket style
function drawCuteBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#BA8E6D";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#8B5A2B";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#E8C19D";
  
  // Main body (bear shape)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.arc(0, 0, basket.width/2 - 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Ears
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.arc(-basket.width/3, -basket.height/2 + 5, basket.width/6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/3, -basket.height/2 + 5, basket.width/6, 0, Math.PI * 2);
  ctx.fill();
  
  // Inner ears
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.arc(-basket.width/3, -basket.height/2 + 5, basket.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/3, -basket.height/2 + 5, basket.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.arc(-basket.width/6, -basket.height/8, basket.width/14, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/6, -basket.height/8, basket.width/14, 0, Math.PI * 2);
  ctx.fill();
  
  // Eye highlights
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(-basket.width/6 + 2, -basket.height/8 - 2, basket.width/25, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(basket.width/6 + 2, -basket.height/8 - 2, basket.width/25, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#FF9999';
  ctx.beginPath();
  ctx.arc(0, 0, basket.width/10, 0, Math.PI * 2);
  ctx.fill();
  
  // Mouth
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, basket.height/8, basket.width/5, 0.2, Math.PI - 0.2);
  ctx.stroke();
  
  // Basket opening/hollow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.arc(0, basket.height/6, basket.width/3, 0, Math.PI * 2);
  ctx.fill();
}

// Box basket style
function drawBoxBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#A67C52";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#C69C6D";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#7D5A3C";
  
  // Main box
  ctx.fillStyle = baseColor;
  ctx.fillRect(-basket.width/2, -basket.height/2, basket.width, basket.height);
  
  // Box top flaps
  ctx.fillStyle = accentColor;
  
  // Left flap
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, -basket.height/2);
  ctx.lineTo(-basket.width/6, -basket.height/2 - basket.height/4);
  ctx.lineTo(0, -basket.height/2);
  ctx.lineTo(-basket.width/2, -basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Right flap
  ctx.beginPath();
  ctx.moveTo(basket.width/2, -basket.height/2);
  ctx.lineTo(basket.width/6, -basket.height/2 - basket.height/4);
  ctx.lineTo(0, -basket.height/2);
  ctx.lineTo(basket.width/2, -basket.height/2);
  ctx.closePath();
  ctx.fill();
  
  // Box details - tape
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 4;
  
  // Horizontal tape
  ctx.beginPath();
  ctx.moveTo(-basket.width/2, 0);
  ctx.lineTo(basket.width/2, 0);
  ctx.stroke();
  
  // Vertical tape
  ctx.beginPath();
  ctx.moveTo(0, -basket.height/2);
  ctx.lineTo(0, basket.height/2);
  ctx.stroke();
  
  // Box inner shadow for depth
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(-basket.width/2 + 5, -basket.height/2 + 5, basket.width - 10, basket.height - 10);
  
  // Box edge highlights
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(-basket.width/2, -basket.height/2, basket.width, basket.height);
  
  // Optional box label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = Math.floor(basket.width/10) + 'px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText("CATCH", 0, basket.height/4);
}

// Hat basket style
function drawHatBasket() {
  const baseColor = basket.powerupActive ? getPowerupBasketColor() : "#2C3E50";
  const accentColor = basket.powerupActive ? getLighterPowerupColor() : "#34495E";
  const darkColor = basket.powerupActive ? getDarkerPowerupColor() : "#1B2631";
  
  // Hat brim
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(0, basket.height/3, basket.width/2, basket.height/6, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat body (cylinder)
  ctx.fillStyle = baseColor;
  ctx.beginPath();
  ctx.ellipse(0, -basket.height/3, basket.width/3, basket.height/10, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Connect the top and bottom of hat
  ctx.beginPath();
  ctx.moveTo(-basket.width/3, -basket.height/3);
  ctx.lineTo(-basket.width/3, basket.height/3);
  ctx.lineTo(basket.width/3, basket.height/3);
  ctx.lineTo(basket.width/3, -basket.height/3);
  ctx.closePath();
  ctx.fill();
  
  // Hat band
  ctx.fillStyle = accentColor;
  ctx.beginPath();
  ctx.rect(-basket.width/3, -basket.height/6, basket.width*2/3, basket.height/10);
  ctx.fill();
  
  // Hat band decoration
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.ellipse(basket.width/6, -basket.height/6 + basket.height/20, basket.width/12, basket.height/20, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Inside of the hat (hollow for catching)
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(0, -basket.height/3, basket.width/4, basket.height/12, 0, 0, Math.PI * 2);
  ctx.fill();
  
  // Hat shine effect
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(0, -basket.height/3, basket.width/3.5, basket.height/11, 0, Math.PI * 0.3, Math.PI * 0.7);
  ctx.stroke();
}

// Helper function to get color based on active powerup
function getPowerupBasketColor() {
  if (gameState.hasActivePowerup && gameState.activePowerupType) {
    const powerupInfo = powerupTypes.find(p => p.type === gameState.activePowerupType);
    return powerupInfo ? powerupInfo.color : basket.color;
  }
  return basket.color;
}

function getLighterPowerupColor() {
  if (gameState.hasActivePowerup && gameState.activePowerupType) {
    const powerupInfo = powerupTypes.find(p => p.type === gameState.activePowerupType);
    return powerupInfo ? lightenColor(powerupInfo.color, 30) : lightenColor(basket.color, 30);
  }
  return lightenColor(basket.color, 30);
}

function getDarkerPowerupColor() {
  if (gameState.hasActivePowerup && gameState.activePowerupType) {
    const powerupInfo = powerupTypes.find(p => p.type === gameState.activePowerupType);
    return powerupInfo ? darkenColor(powerupInfo.color, 30) : darkenColor(basket.color, 30);
  }
  return darkenColor(basket.color, 30);
}

// ... existing code ...

// Function to apply the selected theme
function applyTheme(theme) {
  // If options.js has loaded and defined themeOptions, use that implementation
  if (typeof window.applyTheme === 'function' && window.applyTheme !== applyTheme) {
    return window.applyTheme(theme);
  }
  
  // Get the theme definition from options.js
  const themeOption = (typeof themeOptions !== 'undefined' && themeOptions) 
    ? themeOptions.find(t => t.id === theme) || themeOptions[0]
    : {
        id: theme,
        gradient: theme === 'ocean' 
          ? 'linear-gradient(45deg, #141E30, #243B55, #0575E6)' 
          : theme === 'forest' 
            ? 'linear-gradient(45deg, #134E5E, #71B280, #2C5364)'
            : theme === 'sunset'
              ? 'linear-gradient(45deg, #f12711, #f5af19, #FF8008)'
              : theme === 'neon'
                ? 'linear-gradient(45deg, #0a0047, #490066, #8E2DE2)'
                : 'linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d)',
        stars: 'rgba(255, 255, 255, 0.8)',
        nebulaColors: 'radial-gradient(circle at 20% 35%, rgba(142, 68, 173, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(41, 128, 185, 0.2) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(192, 57, 43, 0.2) 0%, transparent 50%)'
      };
  
  // Apply the gradient to the body
  document.body.style.background = themeOption.gradient;
  document.body.style.backgroundSize = '400% 400%';
  
  // Update stars (parallax background)
  const starsStyle = `
    radial-gradient(2px 2px at 20% 30%, ${themeOption.stars} 0%, transparent 100%),
    radial-gradient(2px 2px at 40% 70%, ${themeOption.stars} 0%, transparent 100%),
    radial-gradient(3px 3px at 50% 15%, ${themeOption.stars} 0%, transparent 100%),
    radial-gradient(2px 2px at 60% 50%, ${themeOption.stars} 0%, transparent 100%),
    radial-gradient(3px 3px at 70% 90%, ${themeOption.stars} 0%, transparent 100%),
    radial-gradient(2px 2px at 85% 25%, ${themeOption.stars} 0%, transparent 100%),
    radial-gradient(3px 3px at 90% 65%, ${themeOption.stars} 0%, transparent 100%)
  `;
  
  // Update the body::before (stars background)
  updatePseudoElementStyle('body::before', `
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: ${starsStyle};
    background-repeat: repeat;
    background-size: 500px 500px;
    transform: translateZ(0);
    animation: movingStars 60s linear infinite;
    z-index: -1;
  `);
  
  // Update nebula overlay
  updatePseudoElementStyle('body::after', `
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: ${themeOption.nebulaColors};
    mix-blend-mode: screen;
    z-index: -1;
    animation: nebulaMove 30s ease infinite alternate;
  `);
  
  // Store the chosen theme
  localStorage.setItem('gameTheme', theme);
  customizations.theme = theme;
  
  return themeOption;
}

// Helper function to update pseudo element styles
function updatePseudoElementStyle(selector, cssText) {
  // Check if a style for this selector already exists
  let styleElement = document.getElementById(`style-${selector.replace(/[^a-z0-9]/gi, '')}`);
  
  if (!styleElement) {
    // Create a new style element if it doesn't exist
    styleElement = document.createElement('style');
    styleElement.id = `style-${selector.replace(/[^a-z0-9]/gi, '')}`;
    document.head.appendChild(styleElement);
  }
  
  // Update the style content
  styleElement.innerHTML = `${selector} { ${cssText} }`;
}

// Function to properly initialize the game for the current device
function initializeGameForDevice() {
  // Optimize canvas for device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.scale(dpr, dpr);
  
  // Enable hardware acceleration
  canvas.style.transform = 'translateZ(0)';
  canvas.style.willChange = 'transform';
  
  // Optimize context
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  
  // Mobile device handling
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    setupMobileOptimizations();
  } else {
    setupDesktopOptimizations();
  }
  
  // Performance mode settings
  const isLowPerformance = checkDevicePerformance();
  if (isLowPerformance) {
    enablePerformanceMode();
  }
  
  // Initialize smooth animation loop
  gameState.then = Date.now();
  gameState.startTime = gameState.then;
  
  // Set up the animation frame request
  if (gameState.useRAF) {
    window.requestAnimationFrame = (
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      }
    );
  }
}

function setupMobileOptimizations() {
  const mobileControls = document.getElementById('mobileControls') || setupMobileControls();
  mobileControls.style.display = "flex";
  
  canvas.addEventListener('touchmove', throttle(touchMoveBasket, 16), { passive: true });
  canvas.addEventListener('touchstart', touchMoveBasket, { passive: true });
  
  updateMobileInstructions();
  setupOrientationHandler();
  optimizeScrolling();
}

function setupDesktopOptimizations() {
  document.getElementById("mobile-control-hint").style.display = "none";
  document.getElementById("desktop-control-hint").style.display = "inline-block";
  
  // Optimize keyboard input
  window.addEventListener('keydown', throttle(handleKeyDown, 16));
  window.addEventListener('keyup', handleKeyUp);
}

function checkDevicePerformance() {
  const isLowPerformance = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isLowPerformance || !window.requestAnimationFrame;
}

function enablePerformanceMode() {
  console.log("Enabling performance optimizations");
  gameState.performanceMode = true;
  gameState.fpsInterval = 1000 / 30; // Reduce to 30 FPS
  gameState.smoothing = 0.6; // Reduce smoothing
  reduceVisualEffects();
}

function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

function reduceVisualEffects() {
  // Reduce particle count
  gameState.maxParticles = 15;
  // Simplify animations
  gameState.useSimpleAnimations = true;
}

// Call initialize function when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGameForDevice);
} else {
  initializeGameForDevice();
}

// Also call it when the options button is clicked
document.addEventListener('DOMContentLoaded', function() {
  const optionsBtn = document.getElementById('optionsBtn');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', function() {
      setTimeout(initializeGameForDevice, 100);
    });
  }
  
  const startGameBtn = document.getElementById('startGameBtn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', function() {
      setTimeout(initializeGameForDevice, 100);
    });
  }
});