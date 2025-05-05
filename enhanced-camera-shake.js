// Enhanced Camera Shake Effects for Fetch or Catch Game
// This adds dramatic screen shake effects when obstacles are eaten

// Define the camera shake system
const cameraShake = {
  // Is the shake effect currently active
  active: false,
  
  // Current intensity of the shake (pixels)
  intensity: 0,
  
  // Duration of the shake in milliseconds
  duration: 0,
  
  // Time remaining for the current shake
  timeLeft: 0,
  
  // The DOM element to apply the shake to (game canvas by default)
  targetElement: null,
  
  // Flash overlay element for dramatic effect
  flashOverlay: null,
  
  // Track the original position
  originalTransform: '',
  
  // Initialize the shake system
  init() {
    // Get the canvas element
    this.targetElement = document.getElementById('gameCanvas');
    
    // Create flash overlay if it doesn't exist
    if (!document.getElementById('flashOverlay')) {
      this.flashOverlay = document.createElement('div');
      this.flashOverlay.id = 'flashOverlay';
      document.body.appendChild(this.flashOverlay);
    } else {
      this.flashOverlay = document.getElementById('flashOverlay');
    }
    
    // Store original transform
    this.originalTransform = this.targetElement.style.transform || '';
    
    // Ensure we don't interfere with existing transitions
    this.targetElement.style.transition = 'none';
  },
  
  // Start a new camera shake effect
  start(intensity, duration, type = 'normal') {
    // If a more intense shake is already happening, don't override it
    if (this.active && this.intensity > intensity) return;
    
    // Set new shake parameters
    this.active = true;
    this.intensity = intensity;
    this.duration = duration;
    this.timeLeft = duration;
    this.shakeType = type;
    
    // Apply appropriate flash effect based on intensity
    if (intensity > 15) {
      this.flash(0.3, 150);
    } else if (intensity > 8) {
      this.flash(0.2, 100);
    }
  },
  
  // Update the shake effect (call this in game loop)
  update(deltaTime) {
    if (!this.active || !this.targetElement) return;
    
    // Decrease time left
    this.timeLeft -= deltaTime * 1000; // Convert to ms
    
    if (this.timeLeft <= 0) {
      // Reset when done
      this.reset();
      return;
    }
    
    // Calculate current shake intensity based on time left (ease out)
    const progress = this.timeLeft / this.duration;
    const currentIntensity = this.intensity * progress;
    
    // Generate random offsets
    let offsetX = 0;
    let offsetY = 0;
    let rotation = 0;
    
    switch (this.shakeType) {
      case 'obstacle':
        // More violent for obstacles - horizontal + vertical with rotation
        offsetX = (Math.random() * 2 - 1) * currentIntensity * 1.5;
        offsetY = (Math.random() * 2 - 1) * currentIntensity;
        rotation = (Math.random() * 2 - 1) * currentIntensity * 0.05; // degrees
        break;
        
      case 'explosion':
        // Explosive effect - circular pattern
        const angle = Math.random() * Math.PI * 2;
        offsetX = Math.cos(angle) * currentIntensity * 1.2;
        offsetY = Math.sin(angle) * currentIntensity * 1.2;
        rotation = (Math.random() * 2 - 1) * currentIntensity * 0.08;
        break;
        
      case 'normal':
      default:
        // Standard shake
        offsetX = (Math.random() * 2 - 1) * currentIntensity;
        offsetY = (Math.random() * 2 - 1) * currentIntensity;
        break;
    }
    
    // Apply transform to the canvas
    this.targetElement.style.transform = `${this.originalTransform} translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`;
  },
  
  // Reset the shake effect
  reset() {
    this.active = false;
    
    // Reset transform to original position smoothly
    this.targetElement.style.transition = 'transform 0.2s ease-out';
    this.targetElement.style.transform = this.originalTransform;
    
    // Remove transition after reset
    setTimeout(() => {
      this.targetElement.style.transition = 'none';
    }, 200);
  },
  
  // Create a flash effect
  flash(opacity = 0.3, duration = 100) {
    if (!this.flashOverlay) return;
    
    // Set flash opacity
    this.flashOverlay.style.opacity = opacity.toString();
    
    // Fade out
    setTimeout(() => {
      this.flashOverlay.style.opacity = '0';
    }, duration);
  }
};

// Function to create dramatic effect when eating obstacles
function createObstacleEatEffect(x, y, obstacleType) {
  // Start an appropriate shake based on the obstacle type
  let intensity = 10;
  let duration = 300;
  
  // Adjust shake intensity based on obstacle type
  switch (obstacleType) {
    case 'bomb':
      intensity = 25;
      duration = 500;
      cameraShake.start(intensity, duration, 'explosion');
      break;
    case 'lightning':
      intensity = 20;
      duration = 400;
      cameraShake.start(intensity, duration, 'obstacle');
      break;
    case 'spiky':
      intensity = 15;
      duration = 350;
      cameraShake.start(intensity, duration, 'obstacle');
      break;
    default:
      cameraShake.start(intensity, duration, 'obstacle');
      break;
  }
  
  // Create visual feedback at the position of the obstacle
  if (typeof createParticles === 'function') {
    // If the game has a particle system, use it
    const particleColors = {
      'bomb': '#e74c3c',
      'lightning': '#f1c40f',
      'spiky': '#8e44ad',
      'rock': '#7f8c8d'
    };
    
    const color = particleColors[obstacleType] || '#e74c3c';
    createParticles(x, y, color, 15);
  }
}

// Initialize the camera shake system when the page loads
window.addEventListener('load', () => {
  cameraShake.init();
  console.log('🔥 Enhanced camera shake system initialized');
  console.log('💥 Dramatic obstacle eating effects enabled');
  
  // If we need to test the effect
  window.testShakeEffect = (intensity = 15, duration = 500, type = 'obstacle') => {
    console.log(`Testing shake effect: ${type} (intensity: ${intensity}, duration: ${duration}ms)`);
    cameraShake.start(intensity, duration, type);
  };
});

// Export the camera shake system for use in the main game
window.cameraShake = cameraShake;
window.createObstacleEatEffect = createObstacleEatEffect; 