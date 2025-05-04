// Game Constants and Variables
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const intro = document.getElementById("intro");
const controls = document.getElementById("controls");
const gameInterface = document.getElementById("gameInterface");
const levelUpScreen = document.getElementById("levelUp");
const gameOverScreen = document.getElementById("gameOver");

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
            console.log("Sound play error:", e);
          });
        }
      }
    }
  } catch (e) {
    console.log("Error playing sound:", e);
  }
}

// Game state with performance tracking and speed control
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
  bonusItems: [],
  isMuted: false,
  timeSlowFactor: null,
  lastFrameTime: 0,
  frameRate: 60,
  performanceMode: false, // Enable this automatically if frame rate drops
  gameSpeed: 1.0, // Game speed multiplier - can be adjusted by player
  baseItemSpeed: 1.5, // Base speed for falling items
  lastUpdateTime: 0 // For frame rate independence
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
  powerupActive: false,
  damageFlash: false // Added damage flash effect
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
  
  // Use a faster loop for better performance
  for (let i = gameState.particles.length - 1; i >= 0; i--) {
    const p = gameState.particles[i];
    p.x += p.speedX * timeScale;
    p.y += p.speedY * timeScale;
    p.life -= timeScale;
    p.height *= Math.pow(0.95, timeScale); // Particle gradually falls to ground
    
    // Optimize by removing particles that are off-screen
    if (p.life <= 0 || p.x < -20 || p.x > canvas.width + 20 || p.y < -20 || p.y > canvas.height + 20) {
      gameState.particles.splice(i, 1);
      continue;
    }
    
    // Use alpha based on life for fading effect
    const alpha = p.life / 50;
    
    if (p.text) {
      // Text particle (like emoji hearts)
      ctx.globalAlpha = alpha;
      ctx.font = `${p.size * 5}px Arial`;
      ctx.fillText(p.text, p.x, p.y);
    } else {
      // Shadow
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.arc(p.x + 2, p.y + 2 + p.height, p.size, 0, Math.PI * 2);
      ctx.fill();
      
      // Particle
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  
  // Limit max particles for performance
  if (gameState.particles.length > 200) {
    gameState.particles.splice(0, gameState.particles.length - 200);
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
  
  // Far distant clouds (slowest moving)
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  for (let i = 0; i < 5; i++) {
    const x = ((i * 100 + time * 20) % (canvas.width + 100)) - 50;
    const y = 50 + i * 15;
    const width = 80 + i * 10;
    const height = 20 + i * 5;
    
    // Draw cloud
    ctx.beginPath();
    ctx.ellipse(x, y, width/2, height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Secondary cloud parts
    ctx.beginPath();
    ctx.ellipse(x + width/4, y - height/4, width/3, height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(x - width/4, y - height/4, width/4, height/3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Mid-distance clouds (medium speed)
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < 3; i++) {
    const x = ((i * 150 + time * 40) % (canvas.width + 150)) - 75;
    const y = 90 + i * 30;
    const width = 100 + i * 20;
    const height = 25 + i * 8;
    
    // Draw cloud
    ctx.beginPath();
    ctx.ellipse(x, y, width/2, height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Secondary cloud parts
    ctx.beginPath();
    ctx.ellipse(x + width/3, y - height/3, width/3, height/2, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(x - width/3, y - height/5, width/4, height/3, 0, 0, Math.PI * 2);
    ctx.fill();
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
  
  // Ground grid pattern for perspective
  ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  ctx.lineWidth = 1;
  
  // Horizontal grid lines
  for (let i = 0; i < 10; i++) {
    const y = canvas.height - 30 + (i * 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Vertical grid lines with perspective
  for (let i = 0; i < 20; i++) {
    const x = i * (canvas.width / 20);
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - 30);
    ctx.lineTo(canvas.width/2 + (x - canvas.width/2) * 0.8, canvas.height);
    ctx.stroke();
  }
  
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

// Draw basket with enhanced 3D effect
function drawBasket() {
  const shadowOffset = 5;
  const basketDepth = 15;
  const glowIntensity = gameState.hasActivePowerup ? 15 : 0;
  
  // First draw the shadow basket if doubleTrouble is active
  if (gameState.hasActivePowerup && gameState.activePowerupType === "doubleTrouble" && gameState.shadowBasket) {
    const shadowBasket = gameState.shadowBasket;
    
    // Update shadow basket position to follow main basket with offset
    const targetOffsetX = -60; // Target offset from main basket
    const targetOffsetY = -40;
    
    // Smooth movement for shadow basket (easing)
    shadowBasket.offsetX += (targetOffsetX - shadowBasket.offsetX) * 0.1;
    shadowBasket.offsetY += (targetOffsetY - shadowBasket.offsetY) * 0.1;
    
    // Draw the shadow basket
    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.beginPath();
    ctx.moveTo(basket.x + shadowBasket.offsetX + shadowOffset, basket.y + shadowBasket.offsetY + shadowOffset);
    ctx.lineTo(basket.x + shadowBasket.width + shadowBasket.offsetX + shadowOffset, basket.y + shadowBasket.offsetY + shadowOffset);
    ctx.lineTo(basket.x + shadowBasket.width + shadowBasket.offsetX + shadowOffset, basket.y + shadowBasket.height + shadowBasket.offsetY + shadowOffset);
    ctx.lineTo(basket.x + shadowBasket.offsetX + shadowOffset, basket.y + shadowBasket.height + shadowBasket.offsetY + shadowOffset);
    ctx.closePath();
    ctx.fill();
    
    // Right side - darker
    ctx.fillStyle = shadowBasket.tertiaryColor;
    ctx.beginPath();
    ctx.moveTo(basket.x + shadowBasket.width + shadowBasket.offsetX, basket.y + shadowBasket.offsetY);
    ctx.lineTo(basket.x + shadowBasket.width + basketDepth + shadowBasket.offsetX, basket.y + basketDepth + shadowBasket.offsetY);
    ctx.lineTo(basket.x + shadowBasket.width + basketDepth + shadowBasket.offsetX, basket.y + shadowBasket.height + basketDepth + shadowBasket.offsetY);
    ctx.lineTo(basket.x + shadowBasket.width + shadowBasket.offsetX, basket.y + shadowBasket.height + shadowBasket.offsetY);
    ctx.closePath();
    ctx.fill();
    
    // Bottom side
    ctx.fillStyle = darkenColor(shadowBasket.color, 30);
    ctx.beginPath();
    ctx.moveTo(basket.x + shadowBasket.offsetX, basket.y + shadowBasket.height + shadowBasket.offsetY);
    ctx.lineTo(basket.x + basketDepth + shadowBasket.offsetX, basket.y + shadowBasket.height + basketDepth + shadowBasket.offsetY);
    ctx.lineTo(basket.x + shadowBasket.width + basketDepth + shadowBasket.offsetX, basket.y + shadowBasket.height + basketDepth + shadowBasket.offsetY);
    ctx.lineTo(basket.x + shadowBasket.width + shadowBasket.offsetX, basket.y + shadowBasket.height + shadowBasket.offsetY);
    ctx.closePath();
    ctx.fill();
    
    // Main basket face with metallic gradient
    const basketGradient = ctx.createLinearGradient(
      basket.x + shadowBasket.offsetX, basket.y + shadowBasket.offsetY, 
      basket.x + shadowBasket.width + shadowBasket.offsetX, basket.y + shadowBasket.height + shadowBasket.offsetY
    );
    
    basketGradient.addColorStop(0, lightenColor(shadowBasket.color, 20));
    basketGradient.addColorStop(0.5, shadowBasket.color);
    basketGradient.addColorStop(1, darkenColor(shadowBasket.color, 20));
    
    // Add glow effect
    ctx.shadowColor = shadowBasket.color;
    ctx.shadowBlur = glowIntensity;
    
    ctx.fillStyle = basketGradient;
    ctx.fillRect(
      basket.x + shadowBasket.offsetX, 
      basket.y + shadowBasket.offsetY, 
      shadowBasket.width, 
      shadowBasket.height
    );
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Top rim - lighter
    ctx.fillStyle = lightenColor(shadowBasket.color, 20);
    ctx.fillRect(
      basket.x + shadowBasket.offsetX, 
      basket.y + shadowBasket.offsetY, 
      shadowBasket.width, 10
    );
    
    // Basket pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
    ctx.lineWidth = 2;
    
    // Vertical lines with perspective
    for (let i = 1; i < 4; i++) {
      const x = basket.x + shadowBasket.offsetX + (shadowBasket.width / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, basket.y + shadowBasket.offsetY);
      ctx.lineTo(x, basket.y + shadowBasket.height + shadowBasket.offsetY);
      // Add perspective lines to rim
      ctx.moveTo(x, basket.y + shadowBasket.offsetY);
      ctx.lineTo(x + basketDepth/2, basket.y + basketDepth/2 + shadowBasket.offsetY);
      ctx.stroke();
    }
    
    // Horizontal line with perspective
    const midY = basket.y + shadowBasket.height/2 + shadowBasket.offsetY;
    ctx.beginPath();
    ctx.moveTo(basket.x + shadowBasket.offsetX, midY);
    ctx.lineTo(basket.x + shadowBasket.width + shadowBasket.offsetX, midY);
    // Add perspective line to right side
    ctx.moveTo(basket.x + shadowBasket.width + shadowBasket.offsetX, midY);
    ctx.lineTo(basket.x + shadowBasket.width + basketDepth + shadowBasket.offsetX, midY + basketDepth);
    ctx.stroke();
    
    // Add connection particles between main and shadow basket occasionally
    if (Math.random() > 0.9) {
      const mainX = basket.x + basket.width/2;
      const mainY = basket.y + basket.height/2;
      const shadowX = basket.x + shadowBasket.offsetX + shadowBasket.width/2;
      const shadowY = basket.y + shadowBasket.offsetY + shadowBasket.height/2;
      
      // Calculate direction vector
      const dx = shadowX - mainX;
      const dy = shadowY - mainY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // Normalized direction
      const ndx = dx / dist;
      const ndy = dy / dist;
      
      // Create particle at random position along the connection line
      const t = Math.random();
      const particleX = mainX + dx * t;
      const particleY = mainY + dy * t;
      
      // Add particle
      gameState.particles.push({
        x: particleX,
        y: particleY,
        size: Math.random() * 3 + 1,
        speedX: ndx * (Math.random() * 2),
        speedY: ndy * (Math.random() * 2),
        color: shadowBasket.color,
        life: 20,
        opacity: 0.7,
        height: Math.random() * 3
      });
    }
    
    // Add pulse effect
    const pulseFactor = Math.sin(Date.now() / 200) * 0.1 + 0.9;
    const pulseSize = shadowBasket.width * 0.6 * pulseFactor;
    
    const pulseGradient = ctx.createRadialGradient(
      basket.x + shadowBasket.offsetX + shadowBasket.width/2, 
      basket.y + shadowBasket.offsetY + shadowBasket.height/2, 
      0,
      basket.x + shadowBasket.offsetX + shadowBasket.width/2, 
      basket.y + shadowBasket.offsetY + shadowBasket.height/2, 
      pulseSize
    );
    
    pulseGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    pulseGradient.addColorStop(0.7, shadowBasket.color + "40");
    pulseGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = pulseGradient;
    ctx.fillRect(
      basket.x + shadowBasket.offsetX - pulseSize/2, 
      basket.y + shadowBasket.offsetY - pulseSize/2, 
      shadowBasket.width + pulseSize, 
      shadowBasket.height + pulseSize
    );
  }
  
  // Now draw the main basket
  // Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.moveTo(basket.x + shadowOffset, basket.y + shadowOffset);
  ctx.lineTo(basket.x + basket.width + shadowOffset, basket.y + shadowOffset);
  ctx.lineTo(basket.x + basket.width + shadowOffset, basket.y + basket.height + shadowOffset);
  ctx.lineTo(basket.x + shadowOffset, basket.y + basket.height + shadowOffset);
  ctx.closePath();
  ctx.fill();
  
  // Draw 3D sides
  
  // Right side - darker
  ctx.fillStyle = basket.tertiaryColor;
  ctx.beginPath();
  ctx.moveTo(basket.x + basket.width, basket.y);
  ctx.lineTo(basket.x + basket.width + basketDepth, basket.y + basketDepth);
  ctx.lineTo(basket.x + basket.width + basketDepth, basket.y + basket.height + basketDepth);
  ctx.lineTo(basket.x + basket.width, basket.y + basket.height);
  ctx.closePath();
  ctx.fill();
  
  // Bottom side
  ctx.fillStyle = darkenColor(basket.color, 30);
  ctx.beginPath();
  ctx.moveTo(basket.x, basket.y + basket.height);
  ctx.lineTo(basket.x + basketDepth, basket.y + basket.height + basketDepth);
  ctx.lineTo(basket.x + basket.width + basketDepth, basket.y + basket.height + basketDepth);
  ctx.lineTo(basket.x + basket.width, basket.y + basket.height);
  ctx.closePath();
  ctx.fill();
  
  // Main basket face with metallic gradient
  const basketGradient = ctx.createLinearGradient(
    basket.x, basket.y, 
    basket.x + basket.width, basket.y + basket.height
  );
  
  // Change gradient based on powerup status or damage flash
  if (basket.damageFlash) {
    // Red gradient for damage
    basketGradient.addColorStop(0, "#ff5555");
    basketGradient.addColorStop(0.5, "#ff3030");
    basketGradient.addColorStop(1, "#cc0000");
    
    // Add red glow effect when damaged
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
  } else if (gameState.hasActivePowerup) {
    const powerupColor = powerupTypes.find(p => p.type === gameState.activePowerupType)?.color || basket.color;
    basketGradient.addColorStop(0, lightenColor(powerupColor, 20));
    basketGradient.addColorStop(0.5, powerupColor);
    basketGradient.addColorStop(1, darkenColor(powerupColor, 20));
    
    // Add glow effect when powerup is active
    ctx.shadowColor = powerupColor;
    ctx.shadowBlur = glowIntensity;
  } else {
    basketGradient.addColorStop(0, lightenColor(basket.color, 20));
    basketGradient.addColorStop(0.5, basket.color);
    basketGradient.addColorStop(1, darkenColor(basket.color, 20));
  }
  
  ctx.fillStyle = basketGradient;
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Top rim - lighter
  ctx.fillStyle = lightenColor(basket.color, 20);
  ctx.fillRect(basket.x, basket.y, basket.width, 10);
  
  // Basket pattern
  ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  ctx.lineWidth = 2;
  
  // Vertical lines with perspective
  for (let i = 1; i < 4; i++) {
    const x = basket.x + (basket.width / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, basket.y);
    ctx.lineTo(x, basket.y + basket.height);
    // Add perspective lines to rim
    ctx.moveTo(x, basket.y);
    ctx.lineTo(x + basketDepth/2, basket.y + basketDepth/2);
    ctx.stroke();
  }
  
  // Horizontal line with perspective
  const midY = basket.y + basket.height/2;
  ctx.beginPath();
  ctx.moveTo(basket.x, midY);
  ctx.lineTo(basket.x + basket.width, midY);
  // Add perspective line to right side
  ctx.moveTo(basket.x + basket.width, midY);
  ctx.lineTo(basket.x + basket.width + basketDepth, midY + basketDepth);
  ctx.stroke();
  
  // Add metallic highlight
  const highlightGradient = ctx.createLinearGradient(
    basket.x, basket.y, 
    basket.x + basket.width/3, basket.y + basket.height/3
  );
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.7)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  
  ctx.fillStyle = highlightGradient;
  ctx.beginPath();
  ctx.ellipse(
    basket.x + basket.width/5, 
    basket.y + basket.height/5, 
    basket.width/5, 
    basket.height/8, 
    Math.PI/4, 0, Math.PI * 2
  );
  ctx.fill();
  
  // Pulse animation when powerup is active
  if (gameState.hasActivePowerup) {
    const pulseFactor = Math.sin(Date.now() / 200) * 0.1 + 0.9;
    const pulseSize = basket.width * 0.6 * pulseFactor;
    
    const powerupColor = powerupTypes.find(p => p.type === gameState.activePowerupType)?.color || "#ffffff";
    const pulseGradient = ctx.createRadialGradient(
      basket.x + basket.width/2, basket.y + basket.height/2, 0,
      basket.x + basket.width/2, basket.y + basket.height/2, pulseSize
    );
    
    pulseGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
    pulseGradient.addColorStop(0.7, `${powerupColor}40`);
    pulseGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    
    ctx.fillStyle = pulseGradient;
    ctx.fillRect(
      basket.x - pulseSize/2, 
      basket.y - pulseSize/2, 
      basket.width + pulseSize, 
      basket.height + pulseSize
    );
  }
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
function gameLoop(timestamp) {
  // Calculate delta time (time since last frame in seconds)
  const deltaTime = (timestamp - gameState.lastUpdateTime) / 1000;
  gameState.lastUpdateTime = timestamp;
  
  // Cap deltaTime to avoid huge jumps if the game was in background
  const cappedDeltaTime = Math.min(deltaTime, 0.1); 
  
  // Apply game speed multiplier to delta time
  const adjustedDeltaTime = cappedDeltaTime * gameState.gameSpeed;
  
  if (!gameState.isPaused) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update screen shake effect with frame rate independence
    updateScreenShake(adjustedDeltaTime);
    
    drawBackground();
    drawBasket();
    drawFallingItems();
    drawObstacles();
    updateParticles(adjustedDeltaTime);
    
    // Update active powerup time with frame rate independence
    if (gameState.hasActivePowerup) {
      gameState.powerupTimeLeft -= adjustedDeltaTime * 1000; // Convert to ms
      
      if (gameState.powerupTimeLeft <= 0) {
        // Handle powerup deactivation
        if (gameState.activePowerupType === "giant") {
          // Reset basket size based on current lives
          const sizeFactor = gameState.lives === 1 ? 0.65 : (gameState.lives === 2 ? 0.8 : 1.0);
          basket.width = 80 * sizeFactor;
          basket.height = 60 * sizeFactor;
        } else if (gameState.activePowerupType === "timeSlow") {
          // Reset time
          if (gameState.timeSlowFactor) {
            window.requestAnimationFrame = gameState.originalRequestAnimationFrame;
            gameState.timeSlowFactor = null;
            const overlay = document.getElementById("timeSlowOverlay");
            if (overlay) document.body.removeChild(overlay);
          }
        } else if (gameState.activePowerupType === "doubleTrouble") {
          // Remove shadow basket
          gameState.shadowBasket = null;
        }
        
        gameState.hasActivePowerup = false;
        gameState.activePowerupType = null;
        basket.powerupActive = false;
      }
      
      // Handle magnet powerup
      if (gameState.activePowerupType === "magnet") {
        // Pull items toward basket
        const magnetStrength = 3 * adjustedDeltaTime * 60; // Normalize to 60fps
        gameState.fallingItems.forEach(item => {
          const dx = (basket.x + basket.width/2) - (item.x + item.size/2);
          const dy = (basket.y + basket.height/2) - (item.y + item.size/2);
          const distance = Math.sqrt(dx*dx + dy*dy);
          
          if (distance < 200) { // Only affect items within range
            const factor = 1 - (distance / 200);
            item.x += dx * factor * 0.05 * magnetStrength;
            item.y += dy * factor * 0.05 * magnetStrength;
            
            // Add magnetic particle effect occasionally
            if (Math.random() > 0.95) {
              gameState.particles.push({
                x: item.x + item.size/2,
                y: item.y + item.size/2,
                size: Math.random() * 3 + 1,
                speedX: dx * 0.01,
                speedY: dy * 0.01,
                color: "#9b59b6",
                life: 20,
                opacity: 0.7,
                height: Math.random() * 3
              });
            }
          }
        });
      }
    }
    
    // Update positions of all falling items using deltaTime
    gameState.fallingItems.forEach(item => {
      if (!item.frozen) {
        item.rotation += item.rotationSpeed * adjustedDeltaTime * 60;
        item.y += item.speed * adjustedDeltaTime * 60;
      }
    });
    
    // Update positions of all powerups using deltaTime
    gameState.bonusItems.forEach(item => {
      item.rotation += item.rotationSpeed * adjustedDeltaTime * 60;
      item.y += item.speed * adjustedDeltaTime * 60;
    });
    
    // Update positions of all obstacles using deltaTime
    gameState.obstacles.forEach(obstacle => {
      if (!obstacle.frozen) {
        obstacle.rotation += obstacle.rotationSpeed * adjustedDeltaTime * 60;
        obstacle.y += obstacle.speed * adjustedDeltaTime * 60;
      }
    });
    
    // Check collisions with falling items
    for (let i = gameState.fallingItems.length - 1; i >= 0; i--) {
      const item = gameState.fallingItems[i];
      
      // Skip frozen items
      if (item.frozen) continue;
      
      // Check collision with main basket
      let collision = checkCollision(item);
      
      // Also check collision with shadow basket if doubleTrouble is active
      if (!collision && gameState.hasActivePowerup && gameState.activePowerupType === "doubleTrouble" && gameState.shadowBasket) {
        // Create a temporary collision box for the shadow basket
        const shadowBasket = {
          x: basket.x + gameState.shadowBasket.offsetX,
          y: basket.y + gameState.shadowBasket.offsetY,
          width: gameState.shadowBasket.width,
          height: gameState.shadowBasket.height
        };
        
        // Check collision with shadow basket
        collision = (
          item.x < shadowBasket.x + shadowBasket.width &&
          item.x + item.size > shadowBasket.x &&
          item.y + item.size > shadowBasket.y &&
          item.y < shadowBasket.y + shadowBasket.height
        );
      }
      
      if (collision) {
        // Apply score multiplier if active
        const multiplier = (gameState.hasActivePowerup && gameState.activePowerupType === "multiplier") ? 2 : 1;
        gameState.score += item.points * multiplier;
        
        // Create particles for celebration
        createParticles(item.x + item.size/2, item.y + item.size/2, item.color, 20);
        
        // Try to play sound
        playSound("collect");
        if (item.points >= 3) playSound("bounce"); // Extra sound for high-value items
        
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
      
      // Check collision with main basket
      let collision = checkCollision(item);
      
      // Also check collision with shadow basket if doubleTrouble is active
      if (!collision && gameState.hasActivePowerup && gameState.activePowerupType === "doubleTrouble" && gameState.shadowBasket) {
        // Create a temporary collision box for the shadow basket
        const shadowBasket = {
          x: basket.x + gameState.shadowBasket.offsetX,
          y: basket.y + gameState.shadowBasket.offsetY,
          width: gameState.shadowBasket.width,
          height: gameState.shadowBasket.height
        };
        
        // Check collision with shadow basket
        collision = (
          item.x < shadowBasket.x + shadowBasket.width &&
          item.x + item.size > shadowBasket.x &&
          item.y + item.size > shadowBasket.y &&
          item.y < shadowBasket.y + shadowBasket.height
        );
      }
      
      if (collision) {
        // Activate powerup
        activatePowerup(item.powerupType, item.duration);
        
        // Create particles
        createParticles(item.x + item.size/2, item.y + item.size/2, item.color, 30);
        
        // Try to play sound
        playSound("powerup");
        
        gameState.bonusItems.splice(i, 1);
      } else if (item.y > canvas.height) {
        gameState.bonusItems.splice(i, 1);
      }
    }
    
    // Check collisions with obstacles
    for (let i = gameState.obstacles.length - 1; i >= 0; i--) {
      const obstacle = gameState.obstacles[i];
      
      // Skip frozen obstacles
      if (obstacle.frozen) continue;
      
      // Check collision with main basket
      let collision = checkCollision(obstacle);
      
      // Also check collision with shadow basket if doubleTrouble is active
      if (!collision && gameState.hasActivePowerup && gameState.activePowerupType === "doubleTrouble" && gameState.shadowBasket) {
        // Create a temporary collision box for the shadow basket
        const shadowBasket = {
          x: basket.x + gameState.shadowBasket.offsetX,
          y: basket.y + gameState.shadowBasket.offsetY,
          width: gameState.shadowBasket.width,
          height: gameState.shadowBasket.height
        };
        
        // Check collision with shadow basket
        collision = (
          obstacle.x < shadowBasket.x + shadowBasket.width &&
          obstacle.x + obstacle.size > shadowBasket.x &&
          obstacle.y + obstacle.size > shadowBasket.y &&
          obstacle.y < shadowBasket.y + shadowBasket.height
        );
      }
      
      if (collision) {
        // If shield powerup is active or player is invincible, destroy obstacle without penalty
        if ((gameState.hasActivePowerup && gameState.activePowerupType === "shield") || gameState.isInvincible) {
          // Create different particle effects based on whether it's a shield or invincibility
          if (gameState.hasActivePowerup && gameState.activePowerupType === "shield") {
            createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, "#27ae60", 20);
          } else {
            // Special pink invincibility particles
            createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, "#e91e63", 20);
          }
          playSound("bounce");
        } else {
          // Deduct points and life
          gameState.score = Math.max(0, gameState.score - obstacle.points * 5);
          gameState.lives--;
          
          // AI FEATURE: Shrink the basket when player loses a life
          // Only if not already using giant powerup
          if (!gameState.hasActivePowerup || gameState.activePowerupType !== "giant") {
            // Store original dimensions for reference
            const originalWidth = 80;
            const originalHeight = 60;
            
            // Calculate new size based on remaining lives (3 = 100%, 2 = 80%, 1 = 65%)
            const sizeFactors = [0.65, 0.8, 1.0];
            const sizeFactor = sizeFactors[gameState.lives - 1] || 0.65;
            
            // Update basket dimensions
            basket.width = originalWidth * sizeFactor;
            basket.height = originalHeight * sizeFactor;
            
            // Create visual effect for basket shrinking
            createBasketShrinkEffect();
          }
          
          // Create particles for obstacle hit
          createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, obstacle.color, 15);
          
          // Add screen shake effect based on obstacle type
          const shakeIntensity = obstacle.points * 3 + 3; // More points = stronger shake
          startScreenShake(shakeIntensity, 300); // 300ms shake duration
          
          // Check game over
          if (gameState.lives <= 0) {
            gameOver();
            break;
          }
          
          // Try to play sound
          playSound("obstacle");
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

// Activate powerup with enhanced effects
function activatePowerup(type, duration) {
  // Clear any existing powerup
  if (gameState.hasActivePowerup) {
    // If giant powerup is ending, reset basket size
    if (gameState.activePowerupType === "giant") {
      basket.width = 80;
      basket.height = 60;
    } else if (gameState.activePowerupType === "doubleTrouble") {
      // Remove shadow basket if it exists
      if (gameState.shadowBasket) {
        gameState.shadowBasket = null;
      }
    }
  }
  
  gameState.hasActivePowerup = true;
  gameState.activePowerupType = type;
  gameState.powerupTimeLeft = duration;
  basket.powerupActive = true;
  
  // Handle immediate effect powerups
  switch(type) {
    case "blast":
      // Create a powerful blast effect at the center
      const blastX = canvas.width / 2;
      const blastY = canvas.height / 2;
      
      // Larger explosion effect at center
      for (let i = 0; i < 40; i++) {
        gameState.particles.push({
          x: blastX,
          y: blastY,
          size: Math.random() * 10 + 5,
          speedX: (Math.random() - 0.5) * 15,
          speedY: (Math.random() - 0.5) * 15,
          color: i % 2 === 0 ? "#ff9800" : "#ffeb3b",
          life: 60 + Math.random() * 30,
          opacity: 1,
          height: Math.random() * 10
        });
      }
      
      // Create shockwave effect
      const shockwave = document.createElement("div");
      shockwave.style.position = "fixed";
      shockwave.style.top = "50%";
      shockwave.style.left = "50%";
      shockwave.style.width = "10px";
      shockwave.style.height = "10px";
      shockwave.style.borderRadius = "50%";
      shockwave.style.transform = "translate(-50%, -50%)";
      shockwave.style.boxShadow = "0 0 0 0 rgba(255, 152, 0, 0.8)";
      shockwave.style.animation = "shockwaveEffect 0.5s ease-out forwards";
      shockwave.style.zIndex = "1000";
      document.body.appendChild(shockwave);
      
      // Add shockwave keyframes if not already in document
      if (!document.getElementById("shockwaveKeyframes")) {
        const keyframes = document.createElement("style");
        keyframes.id = "shockwaveKeyframes";
        keyframes.innerHTML = `
          @keyframes shockwaveEffect {
            0% {
              box-shadow: 0 0 0 0 rgba(255, 152, 0, 0.8);
            }
            100% {
              box-shadow: 0 0 0 100vh rgba(255, 152, 0, 0);
            }
          }
        `;
        document.head.appendChild(keyframes);
      }
      
      // Collect all items on screen
      gameState.fallingItems.forEach(item => {
        // Create collection particles at each item location
        createParticles(item.x + item.size/2, item.y + item.size/2, item.color, 15);
        
        // Add connecting line effect from center to each item
        const dx = item.x + item.size/2 - blastX;
        const dy = item.y + item.size/2 - blastY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Add particles along the line
        for (let i = 0; i < distance; i += distance / 10) {
          if (Math.random() > 0.7) {
            const x = blastX + Math.cos(angle) * i;
            const y = blastY + Math.sin(angle) * i;
            gameState.particles.push({
              x: x,
              y: y,
              size: Math.random() * 3 + 1,
              speedX: Math.cos(angle) * 2,
              speedY: Math.sin(angle) * 2,
              color: "#ff9800",
              life: 20 + Math.random() * 10,
              opacity: 0.7,
              height: Math.random() * 3
            });
          }
        }
        
        // Add score
        const multiplier = (gameState.hasActivePowerup && gameState.activePowerupType === "multiplier") ? 2 : 1;
        gameState.score += item.points * multiplier;
      });
      
      // Clear obstacles too
      gameState.obstacles.forEach(obstacle => {
        createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, "#ff9800", 15);
        
        // Add connecting line effect like with items
        const dx = obstacle.x + obstacle.size/2 - blastX;
        const dy = obstacle.y + obstacle.size/2 - blastY;
        const angle = Math.atan2(dy, dx);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        for (let i = 0; i < distance; i += distance / 10) {
          if (Math.random() > 0.7) {
            const x = blastX + Math.cos(angle) * i;
            const y = blastY + Math.sin(angle) * i;
            gameState.particles.push({
              x: x,
              y: y,
              size: Math.random() * 3 + 1,
              speedX: Math.cos(angle) * 2,
              speedY: Math.sin(angle) * 2,
              color: "#ff9800",
              life: 20 + Math.random() * 10,
              opacity: 0.7,
              height: Math.random() * 3
            });
          }
        }
      });
      
      // Screen flash effect
      const flashOverlay = document.createElement("div");
      flashOverlay.style.position = "fixed";
      flashOverlay.style.top = "0";
      flashOverlay.style.left = "0";
      flashOverlay.style.width = "100%";
      flashOverlay.style.height = "100%";
      flashOverlay.style.backgroundColor = "rgba(255, 152, 0, 0.3)";
      flashOverlay.style.zIndex = "1000";
      flashOverlay.style.pointerEvents = "none";
      document.body.appendChild(flashOverlay);
      
      // Start screen shake with more intensity
      startScreenShake(20, 500);
      
      // Replace all items and obstacles with new ones
      gameState.fallingItems = [];
      for (let i = 0; i < 5; i++) {
        gameState.fallingItems.push(createFallingItem());
      }
      gameState.obstacles = [];
      
      // Remove flash and shockwave after animation
      setTimeout(() => {
        document.body.removeChild(flashOverlay);
        document.body.removeChild(shockwave);
      }, 500);
      break;
      
    case "extraLife":
      // Add a heart to the UI if player has less than 3 lives
      if (gameState.lives < 3) {
        gameState.lives++;
        
        // Create heart explosion effect
        createHeartExplosion();
        
        // Play special heart sound
        try {
          playSound("powerup");
          setTimeout(() => playSound("collect"), 200);
        } catch (e) {
          console.log("Sound play error:", e);
        }
        
        // Set a temporary invincibility
        gameState.isInvincible = true;
        setTimeout(() => {
          gameState.isInvincible = false;
        }, 2000);
        
        // Highlight the lives display
        const livesElem = document.getElementById("lives");
        if (livesElem) {
          livesElem.style.transition = "all 0.3s ease";
          livesElem.style.transform = "translateZ(10px) scale(1.2)";
          livesElem.style.boxShadow = "0 0 15px #e91e63";
          
          setTimeout(() => {
            livesElem.style.transform = "translateZ(10px) scale(1)";
            livesElem.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          }, 1000);
        }
      } else {
        // If player already has max lives, give them points instead
        gameState.score += 50;
        
        // Create text particle to show bonus
        for (let i = 0; i < 5; i++) {
          gameState.particles.push({
            x: canvas.width/2 + (Math.random()*40 - 20),
            y: canvas.height/2 + (Math.random()*20 - 10),
            size: 10,
            speedX: Math.random() * 2 - 1,
            speedY: -2 - Math.random(),
            color: "#e91e63",
            life: 60,
            opacity: 1,
            height: 5,
            text: "+10 pts"
          });
        }
        
        // Create visual indication that lives are maxed
        const maxLivesText = document.createElement("div");
        maxLivesText.innerHTML = "MAX LIVES! +50 pts";
        maxLivesText.style.position = "fixed";
        maxLivesText.style.fontSize = "24px";
        maxLivesText.style.fontWeight = "bold";
        maxLivesText.style.color = "#e91e63";
        maxLivesText.style.top = "50%";
        maxLivesText.style.left = "50%";
        maxLivesText.style.transform = "translate(-50%, -50%)";
        maxLivesText.style.zIndex = "1000";
        maxLivesText.style.textShadow = "0 0 10px #fff";
        maxLivesText.style.pointerEvents = "none";
        document.body.appendChild(maxLivesText);
        
        // Add glowing effect to the score
        const scoreElem = document.getElementById("score");
        if (scoreElem) {
          scoreElem.style.transition = "all 0.3s ease";
          scoreElem.style.boxShadow = "0 0 15px #e91e63";
          scoreElem.style.backgroundColor = "rgba(233, 30, 99, 0.2)";
          
          setTimeout(() => {
            scoreElem.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
            scoreElem.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
          }, 1000);
        }
        
        // Add sparkling particles around the score
        const scoreRect = scoreElem.getBoundingClientRect();
        for (let i = 0; i < 15; i++) {
          gameState.particles.push({
            x: scoreRect.left + Math.random() * scoreRect.width,
            y: scoreRect.top + Math.random() * scoreRect.height,
            size: Math.random() * 3 + 1,
            speedX: Math.random() * 2 - 1,
            speedY: Math.random() * 2 - 1,
            color: "#e91e63",
            life: 30 + Math.random() * 20,
            opacity: 1,
            height: Math.random() * 3
          });
        }
        
        // Remove text after animation
        setTimeout(() => {
          document.body.removeChild(maxLivesText);
        }, 1000);
      }
      break;
      
    case "giant":
      // Calculate the base size multiplier based on current lives
      const baseSizeFactor = gameState.lives === 1 ? 0.65 : (gameState.lives === 2 ? 0.8 : 1.0);
      
      // Increase basket size by 50% of the calculated size
      basket.width = 80 * baseSizeFactor * 1.5;
      basket.height = 60 * baseSizeFactor * 1.5;
      
      // Create growth effect
      for (let i = 0; i < 30; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 30 + 20;
        gameState.particles.push({
          x: basket.x + basket.width/2 + Math.cos(angle) * distance,
          y: basket.y + basket.height/2 + Math.sin(angle) * distance,
          size: Math.random() * 6 + 3,
          speedX: Math.cos(angle) * 2,
          speedY: Math.sin(angle) * 2,
          color: "#4CAF50",
          life: 40 + Math.random() * 20,
          opacity: 0.8,
          height: Math.random() * 5
        });
      }
      break;
      
    case "freeze":
      // Temporarily freeze all items
      gameState.fallingItems.forEach(item => {
        item.frozen = true;
        item.originalSpeed = item.speed;
        item.speed = 0;
        // Create frost particles
        createParticles(item.x + item.size/2, item.y + item.size/2, "#00bcd4", 5);
      });
      gameState.obstacles.forEach(obstacle => {
        obstacle.frozen = true;
        obstacle.originalSpeed = obstacle.speed;
        obstacle.speed = 0;
        // Create frost particles
        createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, "#00bcd4", 5);
      });
      
      // Unfreeze after duration (instead of hardcoded 3 seconds)
      setTimeout(() => {
        if (gameState.activePowerupType === "freeze") {
          gameState.fallingItems.forEach(item => {
            if (item.frozen) {
              item.frozen = false;
              item.speed = item.originalSpeed || 2;
            }
          });
          gameState.obstacles.forEach(obstacle => {
            if (obstacle.frozen) {
              obstacle.frozen = false;
              obstacle.speed = obstacle.originalSpeed || 2;
            }
          });
          
          // Create thawing effect
          for (let i = 0; i < 10; i++) {
            const randomItem = gameState.fallingItems[Math.floor(Math.random() * gameState.fallingItems.length)];
            if (randomItem) {
              createParticles(randomItem.x + randomItem.size/2, 
                           randomItem.y + randomItem.size/2, 
                           "#81d4fa", 3);
            }
            
            const randomObstacle = gameState.obstacles[Math.floor(Math.random() * gameState.obstacles.length)];
            if (randomObstacle) {
              createParticles(randomObstacle.x + randomObstacle.size/2, 
                           randomObstacle.y + randomObstacle.size/2, 
                           "#81d4fa", 3);
            }
          }
        }
      }, duration);
      break;
      
    case "timeSlow":
      // Slow down game time (Matrix-style slow motion effect)
      if (!gameState.timeSlowFactor) {
        gameState.timeSlowFactor = 0.5; // Half speed
        gameState.originalRequestAnimationFrame = window.requestAnimationFrame;
        window.requestAnimationFrame = callback => {
          return gameState.originalRequestAnimationFrame(time => {
            callback(time * gameState.timeSlowFactor);
          });
        };
        
        // Add visual time slow effect
        const timeSlowOverlay = document.createElement("div");
        timeSlowOverlay.id = "timeSlowOverlay";
        timeSlowOverlay.style.position = "fixed";
        timeSlowOverlay.style.top = "0";
        timeSlowOverlay.style.left = "0";
        timeSlowOverlay.style.width = "100%";
        timeSlowOverlay.style.height = "100%";
        timeSlowOverlay.style.backgroundColor = "rgba(103, 58, 183, 0.1)";
        timeSlowOverlay.style.zIndex = "999";
        timeSlowOverlay.style.pointerEvents = "none";
        document.body.appendChild(timeSlowOverlay);
        
        // Slow down all existing items and obstacles
        gameState.fallingItems.forEach(item => {
          item.originalSpeed = item.speed;
          item.speed *= 0.5;
        });
        
        gameState.obstacles.forEach(obstacle => {
          obstacle.originalSpeed = obstacle.speed;
          obstacle.speed *= 0.5;
        });
      }
      
      // Set timeout to revert time slow after duration
      setTimeout(() => {
        if (gameState.timeSlowFactor && gameState.activePowerupType === "timeSlow") {
          window.requestAnimationFrame = gameState.originalRequestAnimationFrame;
          gameState.timeSlowFactor = null;
          const overlay = document.getElementById("timeSlowOverlay");
          if (overlay) document.body.removeChild(overlay);
          
          // Reset speeds of items and obstacles
          gameState.fallingItems.forEach(item => {
            if (item.originalSpeed) {
              item.speed = item.originalSpeed;
              delete item.originalSpeed;
            }
          });
          
          gameState.obstacles.forEach(obstacle => {
            if (obstacle.originalSpeed) {
              obstacle.speed = obstacle.originalSpeed;
              delete obstacle.originalSpeed;
            }
          });
        }
      }, duration);
      break;
      
    case "doubleTrouble":
      // Create a shadow basket that follows the main one
      gameState.shadowBasket = {
        width: basket.width,
        height: basket.height,
        depth: basket.depth,
        color: "#ff5722", // Orange color for shadow basket
        secondaryColor: darkenColor("#ff5722", 20),
        tertiaryColor: darkenColor("#ff5722", 40),
        offsetX: -30, // Initial offset from main basket
        offsetY: -30
      };
      
      // Create visual effect for the new basket appearing
      const portalEffect = document.createElement("div");
      portalEffect.style.position = "fixed";
      portalEffect.style.width = "80px";
      portalEffect.style.height = "80px";
      portalEffect.style.top = `${basket.y - 40}px`;
      portalEffect.style.left = `${basket.x - 40}px`;
      portalEffect.style.borderRadius = "50%";
      portalEffect.style.background = "radial-gradient(circle, #ff5722 0%, rgba(255,87,34,0) 70%)";
      portalEffect.style.animation = "portalPulse 1s ease-out forwards";
      portalEffect.style.zIndex = "1000";
      document.body.appendChild(portalEffect);
      
      // Add portal animation keyframes
      if (!document.getElementById("portalKeyframes")) {
        const keyframes = document.createElement("style");
        keyframes.id = "portalKeyframes";
        keyframes.innerHTML = `
          @keyframes portalPulse {
            0% { transform: scale(0.1); opacity: 1; }
            100% { transform: scale(2); opacity: 0; }
          }
        `;
        document.head.appendChild(keyframes);
      }
      
      // Remove portal effect after animation
      setTimeout(() => {
        document.body.removeChild(portalEffect);
      }, 1000);
      
      // Set timeout to remove shadow basket after duration
      setTimeout(() => {
        if (gameState.activePowerupType === "doubleTrouble") {
          // Create disappearing effect
          if (gameState.shadowBasket) {
            const fadeEffect = document.createElement("div");
            fadeEffect.style.position = "fixed";
            fadeEffect.style.width = "80px";
            fadeEffect.style.height = "80px";
            fadeEffect.style.top = `${basket.y + gameState.shadowBasket.offsetY - 40}px`;
            fadeEffect.style.left = `${basket.x + gameState.shadowBasket.offsetX - 40}px`;
            fadeEffect.style.borderRadius = "50%";
            fadeEffect.style.background = "radial-gradient(circle, #ff5722 0%, rgba(255,87,34,0) 70%)";
            fadeEffect.style.animation = "portalPulse 1s ease-in forwards";
            fadeEffect.style.zIndex = "1000";
            document.body.appendChild(fadeEffect);
            
            // Remove fade effect after animation
            setTimeout(() => {
              document.body.removeChild(fadeEffect);
            }, 1000);
            
            // Remove shadow basket
            gameState.shadowBasket = null;
          }
        }
      }, duration);
      break;
      
    case "goldRush":
      // Store original item types and create golden versions
      gameState.originalItems = [];
      gameState.fallingItems.forEach(item => {
        // Store original properties
        gameState.originalItems.push({
          x: item.x,
          y: item.y,
          type: item.type,
          points: item.points,
          color: item.color
        });
        
        // Transform to gold items (coins, gems, or stars)
        const goldTypes = ["coin", "gem", "star"];
        const randomType = goldTypes[Math.floor(Math.random() * goldTypes.length)];
        const goldItem = itemTypes.find(i => i.type === randomType) || itemTypes[0];
        
        // Apply gold transformation with sparkle effect
        item.type = randomType;
        item.points = goldItem.points * 2; // Double points for gold rush items
        item.color = "#ffd700"; // Gold color
        
        // Create transformation particles
        createParticles(item.x + item.size/2, item.y + item.size/2, "#ffd700", 10);
      });
      
      // Create a gold flash effect
      const goldFlash = document.createElement("div");
      goldFlash.style.position = "fixed";
      goldFlash.style.top = "0";
      goldFlash.style.left = "0";
      goldFlash.style.width = "100%";
      goldFlash.style.height = "100%";
      goldFlash.style.backgroundColor = "rgba(255, 215, 0, 0.3)";
      goldFlash.style.zIndex = "999";
      goldFlash.style.pointerEvents = "none";
      document.body.appendChild(goldFlash);
      
      // Add pulsing gold effect
      goldFlash.style.animation = "goldPulse 1s ease-in-out";
      
      // Add gold pulse keyframes
      if (!document.getElementById("goldKeyframes")) {
        const keyframes = document.createElement("style");
        keyframes.id = "goldKeyframes";
        keyframes.innerHTML = `
          @keyframes goldPulse {
            0% { opacity: 0.3; }
            50% { opacity: 0.6; }
            100% { opacity: 0; }
          }
        `;
        document.head.appendChild(keyframes);
      }
      
      // Remove gold flash after animation
      setTimeout(() => {
        document.body.removeChild(goldFlash);
      }, 1000);
      
      // Continuously transform new items that spawn during gold rush
      const goldRushInterval = setInterval(() => {
        gameState.fallingItems.forEach(item => {
          // Skip already transformed items
          if (item.goldRushTransformed) return;
          
          // Transform to gold items
          const goldTypes = ["coin", "gem", "star"];
          const randomType = goldTypes[Math.floor(Math.random() * goldTypes.length)];
          const goldItem = itemTypes.find(i => i.type === randomType) || itemTypes[0];
          
          // Apply gold transformation
          item.type = randomType;
          item.points = goldItem.points * 2; // Double points for gold rush items
          item.color = "#ffd700"; // Gold color
          item.goldRushTransformed = true; // Mark as transformed
          
          // Create transformation particles
          createParticles(item.x + item.size/2, item.y + item.size/2, "#ffd700", 5);
        });
      }, 500);
      
      // Set timeout to restore items after duration
      setTimeout(() => {
        if (gameState.activePowerupType === "goldRush") {
          // Clear the gold rush interval
          clearInterval(goldRushInterval);
          
          // Return currently visible items to normal types
          gameState.fallingItems.forEach(item => {
            if (item.goldRushTransformed) {
              // Pick a random normal fruit
              const normalFruits = ["apple", "banana", "orange", "strawberry", "watermelon"];
              const randomFruit = normalFruits[Math.floor(Math.random() * normalFruits.length)];
              const fruitItem = itemTypes.find(i => i.type === randomFruit) || itemTypes[0];
              
              // Transform back
              item.type = fruitItem.type;
              item.points = fruitItem.points;
              item.color = fruitItem.color;
              delete item.goldRushTransformed;
              
              // Create de-transformation particles
              createParticles(item.x + item.size/2, item.y + item.size/2, fruitItem.color, 5);
            }
          });
        }
      }, duration);
      break;
  }
  
  // Display powerup notification
  document.getElementById("powerup").classList.remove("hidden");
  document.getElementById("powerup").innerHTML = `PowerUp: ${type} <span class="powerup-emoji">${powerupTypes.find(p => p.type === type)?.emoji || ''}</span> (${Math.ceil(duration / 1000)}s)`;
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
  
  // Apply consistent styling to level up screen
  levelUpScreen.style.backgroundColor = "rgba(52, 152, 219, 0.9)";
  levelUpScreen.style.border = "4px solid rgba(41, 128, 185, 1)";
  levelUpScreen.style.borderRadius = "15px";
  levelUpScreen.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.4)";
  levelUpScreen.style.color = "white";
  levelUpScreen.style.fontFamily = "'Arial', sans-serif";
  
  // Style level up button
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  if (nextLevelBtn) {
    nextLevelBtn.style.backgroundColor = "rgba(46, 204, 113, 0.9)";
    nextLevelBtn.style.color = "white";
    nextLevelBtn.style.border = "2px solid rgba(39, 174, 96, 1)";
    nextLevelBtn.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    nextLevelBtn.style.padding = "12px 24px";
    nextLevelBtn.style.borderRadius = "8px";
    nextLevelBtn.style.margin = "10px";
    nextLevelBtn.style.cursor = "pointer";
    nextLevelBtn.style.fontSize = "18px";
    nextLevelBtn.style.transition = "all 0.2s ease";
    
    // Add hover effect
    nextLevelBtn.addEventListener('mouseover', () => {
      nextLevelBtn.style.backgroundColor = "rgba(39, 174, 96, 1)";
      nextLevelBtn.style.transform = "scale(1.05)";
    });
    
    nextLevelBtn.addEventListener('mouseout', () => {
      nextLevelBtn.style.backgroundColor = "rgba(46, 204, 113, 0.9)";
      nextLevelBtn.style.transform = "scale(1)";
    });
  }
  
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
  
  // Apply consistent styling to game over screen
  gameOverScreen.style.backgroundColor = "rgba(231, 76, 60, 0.9)";
  gameOverScreen.style.border = "4px solid rgba(192, 57, 43, 1)";
  gameOverScreen.style.borderRadius = "15px";
  gameOverScreen.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.4)";
  gameOverScreen.style.color = "white";
  gameOverScreen.style.fontFamily = "'Arial', sans-serif";
  
  // Style play again button
  const playAgainBtn = document.getElementById("playAgainBtn");
  if (playAgainBtn) {
    playAgainBtn.style.backgroundColor = "rgba(52, 152, 219, 0.9)";
    playAgainBtn.style.color = "white";
    playAgainBtn.style.border = "2px solid rgba(41, 128, 185, 1)";
    playAgainBtn.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    playAgainBtn.style.padding = "12px 24px";
    playAgainBtn.style.borderRadius = "8px";
    playAgainBtn.style.margin = "10px";
    playAgainBtn.style.cursor = "pointer";
    playAgainBtn.style.fontSize = "18px";
    playAgainBtn.style.transition = "all 0.2s ease";
    
    // Add hover effect
    playAgainBtn.addEventListener('mouseover', () => {
      playAgainBtn.style.backgroundColor = "rgba(41, 128, 185, 1)";
      playAgainBtn.style.transform = "scale(1.05)";
    });
    
    playAgainBtn.addEventListener('mouseout', () => {
      playAgainBtn.style.backgroundColor = "rgba(52, 152, 219, 0.9)";
      playAgainBtn.style.transform = "scale(1)";
    });
  }
  
  // Clear intervals
  clearInterval(obstacleInterval);
  clearInterval(powerupInterval);
}

// Start the game with performance monitoring and frame rate independence
function startGame() {
  console.log("Starting game!");
  
  // Store current mute state
  const wasMuted = gameState.isMuted;
  const savedGameSpeed = gameState.gameSpeed || 1.0;
  
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
    bonusItems: [],
    isMuted: wasMuted, // Preserve mute state
    timeSlowFactor: null,
    lastFrameTime: 0,
    frameRate: 60,
    performanceMode: false,
    gameSpeed: savedGameSpeed, // Preserve game speed setting
    baseItemSpeed: 1.5, // Base speed for falling items
    lastUpdateTime: 0, // For frame rate independence
    isInvincible: false // Track invincibility state for extraLife powerup
  };
  
  // Update speed display
  updateSpeedLabel();
  
  // Reset basket
  basket.x = canvas.width / 2 - basket.width / 2;
  // Set basket size based on lives
  const sizeFactor = gameState.lives === 1 ? 0.65 : (gameState.lives === 2 ? 0.8 : 1.0);
  basket.width = 80 * sizeFactor;
  basket.height = 60 * sizeFactor;
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
  
  // Make sure speed controls exist
  if (!document.getElementById("speedControls")) {
    addSpeedControls();
  }
  
  // Performance monitoring
  const performanceMonitor = setInterval(() => {
    if (gameState.frameRate < 45 && !gameState.performanceMode) {
      console.log("Low frame rate detected, enabling performance mode");
      gameState.performanceMode = true;
      // Reduce particle effects
      createParticles = function(x, y, color, amount) {
        amount = Math.min(amount, 10); // Cap particles
        for (let i = 0; i < amount; i++) {
          gameState.particles.push({
            x: x,
            y: y,
            size: Math.random() * 4 + 2,
            speedX: Math.random() * 4 - 2,
            speedY: Math.random() * 4 - 2,
            color: color,
            life: 20 + Math.random() * 10,
            opacity: 1,
            height: Math.random() * 3
          });
        }
      };
    }
  }, 5000);
  
  // Play start sound and background music
  playSound("start");
  setTimeout(() => {
    // Only play background music if not muted
    if (!gameState.isMuted) {
      playSound("background");
    }
  }, 500);
  
  // Create initial falling items
  gameState.fallingItems = [];
  for (let i = 0; i < 5; i++) {
    gameState.fallingItems.push(createFallingItem());
  }
  
  // Clear any existing intervals
  if (obstacleInterval) clearInterval(obstacleInterval);
  if (powerupInterval) clearInterval(powerupInterval);
  if (animationFrame) cancelAnimationFrame(animationFrame);
  
  // Create obstacles at intervals - using slower rate for better gameplay
  obstacleInterval = setInterval(() => {
    if (!gameState.isPaused) {
      const currentLevel = levelConfig[Math.min(gameState.level - 1, levelConfig.length - 1)];
      if (gameState.obstacles.length < currentLevel.maxObstacles) {
        gameState.obstacles.push(createObstacle());
        // Play sound when obstacle appears
        if (Math.random() > 0.7) playSound("fall");
      }
    }
  }, Math.max(2000, levelConfig[0].obstacleFrequency / gameState.gameSpeed)); // Adjust for game speed
  
  // Create powerups at intervals, increasing frequency with level
  powerupInterval = setInterval(() => {
    if (!gameState.isPaused && gameState.bonusItems.length < 1) {
      // Make powerups available from level 1
      const powerupChance = 0.15 + (gameState.level * 0.08); // 23% at level 1, 31% at level 2, etc.
      
      if (Math.random() < powerupChance) {
        gameState.bonusItems.push(createPowerup());
        playSound("bounce");
      }
    }
  }, Math.max(5000, (8000 - (gameState.level * 500)) / gameState.gameSpeed)); // Adjust for game speed
  
  // Performance tracking for game loop
  let lastTime = performance.now();
  let frameCount = 0;
  
  // Track last update time for delta calculation
  gameState.lastUpdateTime = performance.now();
  
  // Enhanced game loop with FPS monitoring
  function enhancedGameLoop(timestamp) {
    // Calculate frame rate every second
    frameCount++;
    if (timestamp - lastTime >= 1000) {
      gameState.frameRate = frameCount;
      frameCount = 0;
      lastTime = timestamp;
    }
    
    // Call the main game loop with timestamp
    gameLoop(timestamp);
  }
  
  // Start the enhanced game loop
  animationFrame = requestAnimationFrame(enhancedGameLoop);
  
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
  
  // Play button sound
  playSound("button");
  
  // Pause/resume background music only if not muted
  if (!gameState.isMuted) {
    if (gameState.isPaused) {
      sounds.background.pause();
    } else {
      sounds.background.play();
    }
  }
}

// Quit the game
function quitGame() {
  clearInterval(obstacleInterval);
  clearInterval(powerupInterval);
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
  
  // Stop background music
  sounds.background.pause();
  playSound("button");
  
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

// Toggle mute function
function toggleMute() {
  gameState.isMuted = !gameState.isMuted;
  
  // Update button text
  document.getElementById("muteBtn").innerText = gameState.isMuted ? "🔇" : "🔊";
  
  // Handle background music
  if (gameState.isMuted) {
    if (sounds.background.paused === false) {
      sounds.background.pause();
    }
  } else {
    // Only resume background music if game is not paused
    if (!gameState.isPaused && canvas.style.display !== "none") {
      sounds.background.play();
    }
  }
  
  // Play button sound (this will only play if unmuting)
  playSound("button");
}

// Event Listeners
document.getElementById("startGameBtn").addEventListener("click", function() {
  playSound("button");
  startGame();
});
document.getElementById("startGameBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  playSound("button");
  startGame();
});
document.getElementById("restartBtn").addEventListener("click", function() {
  playSound("button");
  restartGame();
});
document.getElementById("restartBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  playSound("button");
  restartGame();
});
// Sound effect handled inside pauseGame function
document.getElementById("pauseBtn").addEventListener("click", pauseGame);
document.getElementById("pauseBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  pauseGame();
});
// Sound effect handled inside quitGame function
document.getElementById("quitBtn").addEventListener("click", quitGame);
document.getElementById("quitBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  quitGame();
});
document.getElementById("playAgainBtn").addEventListener("click", function() {
  playSound("button");
  restartGame();
});
document.getElementById("playAgainBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  playSound("button");
  restartGame();
});
document.getElementById("muteBtn").addEventListener("click", toggleMute);
document.getElementById("muteBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  toggleMute();
});
document.getElementById("nextLevelBtn").addEventListener("click", function() {
  playSound("button");
  continueToNextLevel();
});
document.getElementById("nextLevelBtn").addEventListener("touchstart", function(e) {
  e.preventDefault();
  playSound("button");
  continueToNextLevel();
});

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
  
  // Initialize hearts for lives display
  document.getElementById("lives").innerHTML = "Lives: ❤️❤️❤️";
  
  document.getElementById("progressBar").style.width = "0%";
  document.getElementById("muteBtn").innerText = gameState.isMuted ? "🔇" : "🔊";
  
  // Apply consistent styling to game UI elements
  const uiElements = document.querySelectorAll('#gameInterface > div:not(#progressContainer)');
  uiElements.forEach(element => {
    element.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
    element.style.color = "white";
    element.style.border = "2px solid rgba(41, 128, 185, 0.9)";
    element.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    element.style.padding = "8px 12px";
    element.style.borderRadius = "8px";
    element.style.margin = "5px";
    element.style.fontFamily = "'Arial', sans-serif";
  });
  
  // Style progress container
  const progressContainer = document.getElementById("progressContainer");
  if (progressContainer) {
    progressContainer.style.backgroundColor = "rgba(236, 240, 241, 0.6)";
    progressContainer.style.border = "2px solid rgba(41, 128, 185, 0.9)";
    progressContainer.style.borderRadius = "10px";
    progressContainer.style.overflow = "hidden";
  }
  
  // Style progress bar
  const progressBar = document.getElementById("progressBar");
  if (progressBar) {
    progressBar.style.backgroundColor = "rgba(46, 204, 113, 0.8)";
    progressBar.style.transition = "width 0.3s ease";
  }
  
  // Style game controls
  const controlButtons = document.querySelectorAll('#controls button');
  controlButtons.forEach(button => {
    button.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
    button.style.color = "white";
    button.style.border = "2px solid rgba(41, 128, 185, 0.9)";
    button.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.3)";
    button.style.padding = "8px 16px";
    button.style.borderRadius = "8px";
    button.style.margin = "0 5px";
    button.style.cursor = "pointer";
    button.style.fontFamily = "'Arial', sans-serif";
    button.style.fontSize = "16px";
    button.style.transition = "all 0.2s ease";
    
    // Add hover effect
    button.addEventListener('mouseover', () => {
      button.style.backgroundColor = "rgba(41, 128, 185, 0.9)";
      button.style.transform = "translateY(-2px)";
    });
    
    button.addEventListener('mouseout', () => {
      button.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
      button.style.transform = "translateY(0)";
    });
  });
  
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
    
    // Show the appropriate instructions in the intro
    if (document.getElementById("mobile-control-hint")) {
      document.getElementById("mobile-control-hint").style.display = "inline-block";
      document.getElementById("desktop-control-hint").style.display = "none";
    }
  } else {
    // Show desktop instructions
    if (document.getElementById("desktop-control-hint")) {
      document.getElementById("desktop-control-hint").style.display = "inline-block";
      document.getElementById("mobile-control-hint").style.display = "none";
    }
  }
  
  // Add 3D lighting effect to intro
  const lightingEffect = document.createElement("div");
  lightingEffect.className = "lighting-effect";
  document.getElementById("intro").appendChild(lightingEffect);
  
  // Ensure canvas is properly sized
  resizeCanvas();
});

// Setup mobile controls
function setupMobileControls() {
  const mobileControls = document.createElement("div");
  mobileControls.id = "mobileControls";
  mobileControls.style.position = "fixed";
  mobileControls.style.bottom = "20px";
  mobileControls.style.left = "0";
  mobileControls.style.right = "0";
  mobileControls.style.display = "flex";
  mobileControls.style.justifyContent = "space-between";
  mobileControls.style.padding = "0 20px";
  mobileControls.style.zIndex = "1000";
  
  // Variables to store interval IDs
  let moveLeftInterval = null;
  let moveRightInterval = null;
  
  // Standardize button styling
  const buttonStyle = {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    color: "white",
    fontSize: "40px",
    border: "4px solid rgba(41, 128, 185, 0.9)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    userSelect: "none",
    touchAction: "manipulation"
  };
  
  const leftBtn = document.createElement("div");
  leftBtn.className = "controlBtn";
  leftBtn.innerHTML = "←";
  
  // Apply standardized styling to left button
  Object.assign(leftBtn.style, buttonStyle);
  
  leftBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Visual feedback on press
    leftBtn.style.backgroundColor = "rgba(41, 128, 185, 0.9)";
    leftBtn.style.transform = "scale(0.95)";
    
    // Clear any existing intervals first
    if (moveLeftInterval) clearInterval(moveLeftInterval);
    if (moveRightInterval) clearInterval(moveRightInterval);
    
    moveLeftInterval = setInterval(() => {
      if (basket.x > 0 && !gameState.isPaused) basket.x -= basket.speed/2;
    }, 16);
  });
  
  leftBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset visual state
    leftBtn.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
    leftBtn.style.transform = "scale(1)";
    
    if (moveLeftInterval) {
      clearInterval(moveLeftInterval);
      moveLeftInterval = null;
    }
  });
  
  leftBtn.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    
    // Reset visual state
    leftBtn.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
    leftBtn.style.transform = "scale(1)";
    
    if (moveLeftInterval) {
      clearInterval(moveLeftInterval);
      moveLeftInterval = null;
    }
  });
  
  const rightBtn = document.createElement("div");
  rightBtn.className = "controlBtn";
  rightBtn.innerHTML = "→";
  
  // Apply standardized styling to right button
  Object.assign(rightBtn.style, buttonStyle);
  
  rightBtn.addEventListener("touchstart", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Visual feedback on press
    rightBtn.style.backgroundColor = "rgba(41, 128, 185, 0.9)";
    rightBtn.style.transform = "scale(0.95)";
    
    // Clear any existing intervals first
    if (moveRightInterval) clearInterval(moveRightInterval);
    if (moveLeftInterval) clearInterval(moveLeftInterval);
    
    moveRightInterval = setInterval(() => {
      if (basket.x + basket.width < canvas.width && !gameState.isPaused) basket.x += basket.speed/2;
    }, 16);
  });
  
  rightBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset visual state
    rightBtn.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
    rightBtn.style.transform = "scale(1)";
    
    if (moveRightInterval) {
      clearInterval(moveRightInterval);
      moveRightInterval = null;
    }
  });
  
  rightBtn.addEventListener("touchcancel", (e) => {
    e.preventDefault();
    
    // Reset visual state
    rightBtn.style.backgroundColor = "rgba(52, 152, 219, 0.8)";
    rightBtn.style.transform = "scale(1)";
    
    if (moveRightInterval) {
      clearInterval(moveRightInterval);
      moveRightInterval = null;
    }
  });
  
  mobileControls.appendChild(leftBtn);
  mobileControls.appendChild(rightBtn);
  document.body.appendChild(mobileControls);
  
  // Add global touch handler to ensure all intervals are cleared if touch ends outside buttons
  document.addEventListener("touchend", (e) => {
    if (moveLeftInterval) {
      clearInterval(moveLeftInterval);
      moveLeftInterval = null;
    }
    if (moveRightInterval) {
      clearInterval(moveRightInterval);
      moveRightInterval = null;
    }
  }, { passive: true });
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

// Test function to verify new fruits and obstacles
function testRenderingImprovements() {
  console.log("Testing improved rendering...");
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Test background
  drawBackground();
  
  // Spacing for the test items
  const spacing = canvas.width / 10;
  const yPos = canvas.height / 4;
  
  // Test each fruit type
  console.log("Testing fruit rendering...");
  const testFruits = ["apple", "banana", "orange", "watermelon", "pineapple", "gem", "coin", "star"];
  testFruits.forEach((fruitType, index) => {
    // Find matching item type
    const itemType = itemTypes.find(item => item.type === fruitType) || itemTypes[0];
    
    // Create test fruit item
    const testFruit = {
      x: spacing + index * spacing,
      y: yPos,
      size: 40,
      type: fruitType,
      points: itemType.points,
      color: itemType.color,
      rotation: 0,
      rotationSpeed: 0,
      scale: 1,
      scaleDirection: 0.005,
      height: itemType.height,
      shadowOffset: itemType.shadowOffset,
      wobble: 0
    };
    
    // Add to game state temporarily
    gameState.fallingItems.push(testFruit);
  });
  
  // Test each obstacle type
  console.log("Testing obstacle rendering...");
  obstacleTypes.forEach((obstacleType, index) => {
    // Create test obstacle
    const testObstacle = {
      x: spacing + index * spacing,
      y: yPos * 2,
      size: 40,
      type: "obstacle",
      obstacleType: obstacleType.type,
      points: obstacleType.deduction,
      color: obstacleType.color,
      rotation: 0,
      rotationSpeed: 0,
      height: obstacleType.height,
      shadowOffset: obstacleType.shadowOffset,
      wobble: 0,
      emoji: obstacleType.emoji
    };
    
    // Add to game state temporarily
    gameState.obstacles.push(testObstacle);
  });
  
  // Draw test items
  drawFallingItems();
  drawObstacles();
  
  // Log test items for inspection
  console.log("Test fruits:", gameState.fallingItems.slice(-testFruits.length));
  console.log("Test obstacles:", gameState.obstacles.slice(-obstacleTypes.length));
  
  // Clean up test items after a few seconds
  setTimeout(() => {
    // Remove test items
    gameState.fallingItems = gameState.fallingItems.slice(0, -testFruits.length);
    gameState.obstacles = gameState.obstacles.slice(0, -obstacleTypes.length);
    console.log("Test rendering complete - items removed");
  }, 5000);
  
  return "Rendering test in progress - check game canvas for results";
}

// Make test available in the window object
window.testRenderingImprovements = testRenderingImprovements; 

// Function to initiate screen shake
function startScreenShake(intensity, duration) {
  screenShake.active = true;
  screenShake.intensity = intensity;
  screenShake.duration = duration;
  screenShake.timeLeft = duration;
}

// Update screen shake effect with frame rate independence
function updateScreenShake(deltaTime) {
  if (screenShake.active) {
    screenShake.timeLeft -= deltaTime * 1000; // Convert to ms
    
    if (screenShake.timeLeft <= 0) {
      screenShake.active = false;
      canvas.style.transform = 'translate(0px, 0px)';
    } else {
      const intensity = screenShake.intensity * (screenShake.timeLeft / screenShake.duration);
      const xShake = (Math.random() * 2 - 1) * intensity;
      const yShake = (Math.random() * 2 - 1) * intensity;
      canvas.style.transform = `translate(${xShake}px, ${yShake}px)`;
    }
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
  const shadowOffset = 5;
  const basketDepth = 15;
  const glowIntensity = gameState.hasActivePowerup ? 15 : 0;
  
  // First draw the shadow basket if doubleTrouble is active
  if (gameState.hasActivePowerup && gameState.activePowerupType === "doubleTrouble" && gameState.shadowBasket) {
    // ... existing shadow basket code ...
  }
  
  // Now draw the main basket
  // Shadow
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.moveTo(basket.x + shadowOffset, basket.y + shadowOffset);
  ctx.lineTo(basket.x + basket.width + shadowOffset, basket.y + shadowOffset);
  ctx.lineTo(basket.x + basket.width + shadowOffset, basket.y + basket.height + shadowOffset);
  ctx.lineTo(basket.x + shadowOffset, basket.y + basket.height + shadowOffset);
  ctx.closePath();
  ctx.fill();
  
  // Draw 3D sides
  
  // Right side - darker
  ctx.fillStyle = basket.tertiaryColor;
  ctx.beginPath();
  ctx.moveTo(basket.x + basket.width, basket.y);
  ctx.lineTo(basket.x + basket.width + basketDepth, basket.y + basketDepth);
  ctx.lineTo(basket.x + basket.width + basketDepth, basket.y + basket.height + basketDepth);
  ctx.lineTo(basket.x + basket.width, basket.y + basket.height);
  ctx.closePath();
  ctx.fill();
  
  // Bottom side
  ctx.fillStyle = darkenColor(basket.color, 30);
  ctx.beginPath();
  ctx.moveTo(basket.x, basket.y + basket.height);
  ctx.lineTo(basket.x + basketDepth, basket.y + basket.height + basketDepth);
  ctx.lineTo(basket.x + basket.width + basketDepth, basket.y + basket.height + basketDepth);
  ctx.lineTo(basket.x + basket.width, basket.y + basket.height);
  ctx.closePath();
  ctx.fill();
  
  // Main basket face with metallic gradient
  const basketGradient = ctx.createLinearGradient(
    basket.x, basket.y, 
    basket.x + basket.width, basket.y + basket.height
  );
  
  // Change gradient based on powerup status or damage flash
  if (basket.damageFlash) {
    // Red gradient for damage
    basketGradient.addColorStop(0, "#ff5555");
    basketGradient.addColorStop(0.5, "#ff3030");
    basketGradient.addColorStop(1, "#cc0000");
    
    // Add red glow effect when damaged
    ctx.shadowColor = "#ff0000";
    ctx.shadowBlur = 20;
  } else if (gameState.hasActivePowerup) {
    const powerupColor = powerupTypes.find(p => p.type === gameState.activePowerupType)?.color || basket.color;
    basketGradient.addColorStop(0, lightenColor(powerupColor, 20));
    basketGradient.addColorStop(0.5, powerupColor);
    basketGradient.addColorStop(1, darkenColor(powerupColor, 20));
    
    // Add glow effect when powerup is active
    ctx.shadowColor = powerupColor;
    ctx.shadowBlur = glowIntensity;
  } else {
    basketGradient.addColorStop(0, lightenColor(basket.color, 20));
    basketGradient.addColorStop(0.5, basket.color);
    basketGradient.addColorStop(1, darkenColor(basket.color, 20));
  }
  
  ctx.fillStyle = basketGradient;
  ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
  
  // Reset shadow
  ctx.shadowBlur = 0;
  
  // Rest of the drawBasket function remains the same
}

// Update the obstacle collision code in the gameLoop function
// Replace the section after "// Deduct points and life"
// Deduct points and life
gameState.score = Math.max(0, gameState.score - obstacle.points * 5);
gameState.lives--;

// AI FEATURE: Shrink the basket when player loses a life
// Only if not already using giant powerup
if (!gameState.hasActivePowerup || gameState.activePowerupType !== "giant") {
  // Store original dimensions for reference
  const originalWidth = 80;
  const originalHeight = 60;
  
  // Calculate new size based on remaining lives (3 = 100%, 2 = 80%, 1 = 65%)
  const sizeFactors = [0.65, 0.8, 1.0];
  const sizeFactor = sizeFactors[gameState.lives - 1] || 0.65;
  
  // Update basket dimensions
  basket.width = originalWidth * sizeFactor;
  basket.height = originalHeight * sizeFactor;
  
  // Create visual effect for basket shrinking
  createBasketShrinkEffect();
}

// Create particles for obstacle hit
createParticles(obstacle.x + obstacle.size/2, obstacle.y + obstacle.size/2, obstacle.color, 15);

// Add screen shake effect based on obstacle type
const shakeIntensity = obstacle.points * 3 + 3; // More points = stronger shake
startScreenShake(shakeIntensity, 300); // 300ms shake duration