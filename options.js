/**
 * Game Customization Options
 * This file handles the themes and basket styles for the game.
 */

// Define the theme options
const themeOptions = [
  {
    id: 'space',
    name: 'Space',
    gradient: 'linear-gradient(45deg, #1a2a6c, #b21f1f, #fdbb2d)',
    stars: 'rgba(255, 255, 255, 0.8)',
    particleColors: ['#e74c3c', '#3498db', '#f1c40f', '#9b59b6'],
    nebulaColors: 'radial-gradient(circle at 20% 35%, rgba(142, 68, 173, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(41, 128, 185, 0.2) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(192, 57, 43, 0.2) 0%, transparent 50%)'
  },
  {
    id: 'ocean',
    name: 'Ocean',
    gradient: 'linear-gradient(45deg, #141E30, #243B55, #0575E6)',
    stars: 'rgba(255, 255, 255, 0.7)',
    particleColors: ['#2980b9', '#3498db', '#1abc9c', '#16a085'],
    nebulaColors: 'radial-gradient(circle at 20% 35%, rgba(41, 128, 185, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(26, 188, 156, 0.2) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(22, 160, 133, 0.2) 0%, transparent 50%)'
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: 'linear-gradient(45deg, #134E5E, #71B280, #2C5364)',
    stars: 'rgba(255, 255, 255, 0.6)',
    particleColors: ['#27ae60', '#2ecc71', '#f1c40f', '#f39c12'],
    nebulaColors: 'radial-gradient(circle at 20% 35%, rgba(39, 174, 96, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(46, 204, 113, 0.2) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(241, 196, 15, 0.2) 0%, transparent 50%)'
  },
  {
    id: 'sunset',
    name: 'Sunset',
    gradient: 'linear-gradient(45deg, #f12711, #f5af19, #FF8008)',
    stars: 'rgba(255, 255, 255, 0.7)',
    particleColors: ['#e67e22', '#d35400', '#f39c12', '#ff5e57'],
    nebulaColors: 'radial-gradient(circle at 20% 35%, rgba(230, 126, 34, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(211, 84, 0, 0.2) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(243, 156, 18, 0.2) 0%, transparent 50%)'
  },
  {
    id: 'neon',
    name: 'Neon',
    gradient: 'linear-gradient(45deg, #0a0047, #490066, #8E2DE2)',
    stars: 'rgba(255, 255, 255, 0.9)',
    particleColors: ['#ff2a6d', '#05d9e8', '#01ffc3', '#d401ff'],
    nebulaColors: 'radial-gradient(circle at 20% 35%, rgba(255, 42, 109, 0.2) 0%, transparent 40%), radial-gradient(circle at 80% 20%, rgba(5, 217, 232, 0.2) 0%, transparent 40%), radial-gradient(circle at 50% 80%, rgba(1, 255, 195, 0.2) 0%, transparent 50%)'
  }
];

// Define the basket style options
const basketOptions = [
  {
    id: 'classic',
    name: 'Classic',
    emoji: '🧺',
    baseColor: '#3498db',
    secondaryColor: '#2980b9',
    tertiaryColor: '#1a5276'
  },
  {
    id: 'futuristic',
    name: 'Futuristic',
    emoji: '🛸',
    baseColor: '#4686FF',
    secondaryColor: '#00D1FF',
    tertiaryColor: '#1A3A75'
  },
  {
    id: 'cute',
    name: 'Cute',
    emoji: '🧸',
    baseColor: '#BA8E6D',
    secondaryColor: '#E8C19D',
    tertiaryColor: '#8B5A2B'
  },
  {
    id: 'box',
    name: 'Box',
    emoji: '📦',
    baseColor: '#A67C52',
    secondaryColor: '#C69C6D',
    tertiaryColor: '#7D5A3C'
  },
  {
    id: 'hat',
    name: 'Hat',
    emoji: '🎩',
    baseColor: '#2C3E50',
    secondaryColor: '#34495E',
    tertiaryColor: '#1B2631'
  }
];

// Apply theme to the page
function applyTheme(themeId) {
  const theme = themeOptions.find(t => t.id === themeId) || themeOptions[0];
  
  // Update body background
  document.body.style.background = theme.gradient;
  document.body.style.backgroundSize = '400% 400%';
  
  // Update stars (parallax background)
  const starsStyle = `
    radial-gradient(2px 2px at 20% 30%, ${theme.stars} 0%, transparent 100%),
    radial-gradient(2px 2px at 40% 70%, ${theme.stars} 0%, transparent 100%),
    radial-gradient(3px 3px at 50% 15%, ${theme.stars} 0%, transparent 100%),
    radial-gradient(2px 2px at 60% 50%, ${theme.stars} 0%, transparent 100%),
    radial-gradient(3px 3px at 70% 90%, ${theme.stars} 0%, transparent 100%),
    radial-gradient(2px 2px at 85% 25%, ${theme.stars} 0%, transparent 100%),
    radial-gradient(3px 3px at 90% 65%, ${theme.stars} 0%, transparent 100%)
  `;
  
  // Create a style element to replace the body::before content
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
    background: ${theme.nebulaColors};
    mix-blend-mode: screen;
    z-index: -1;
    animation: nebulaMove 30s ease infinite alternate;
  `);
  
  // Store the selected theme in localStorage
  localStorage.setItem('gameTheme', themeId);
  
  // Update customizations object if it exists
  if (typeof customizations !== 'undefined') {
    customizations.theme = themeId;
  }
  
  return theme;
}

// Make the function globally available
window.applyTheme = applyTheme;

// Apply basket style
function applyBasketStyle(styleId) {
  const style = basketOptions.find(s => s.id === styleId) || basketOptions[0];
  
  // Update basket colors immediately if the basket object exists
  if (typeof basket !== 'undefined') {
    basket.style = styleId;
    basket.color = style.baseColor;
    basket.secondaryColor = style.secondaryColor;
    basket.tertiaryColor = style.tertiaryColor;
  }
  
  // Store the selected basket style in localStorage
  localStorage.setItem('gameBasket', styleId);
  
  // Update customizations object if it exists
  if (typeof customizations !== 'undefined') {
    customizations.basketStyle = styleId;
  }
  
  return style;
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

// Initialize the options in the UI
function initializeOptions() {
  const optionsContainer = document.querySelector('#optionsScreen .options-container');
  const backgroundSection = document.querySelector('#backgroundSection .option-choices');
  const basketSection = document.querySelector('#basketSection .option-choices');
  
  // Clear existing options
  if (backgroundSection) backgroundSection.innerHTML = '';
  if (basketSection) basketSection.innerHTML = '';
  
  // Add theme options
  themeOptions.forEach(theme => {
    const themeElement = document.createElement('div');
    themeElement.className = 'option-choice background-choice';
    themeElement.setAttribute('data-theme', theme.id);
    
    themeElement.innerHTML = `
      <div class="preview-box ${theme.id}-theme" style="background: ${theme.gradient}"></div>
      <span>${theme.name}</span>
    `;
    
    themeElement.addEventListener('click', () => {
      // Remove active class from all choices
      document.querySelectorAll('.background-choice').forEach(el => el.classList.remove('active'));
      // Add active class to this choice
      themeElement.classList.add('active');
      // Apply the theme
      applyTheme(theme.id);
    });
    
    if (backgroundSection) backgroundSection.appendChild(themeElement);
  });
  
  // Add basket options
  basketOptions.forEach(basket => {
    const basketElement = document.createElement('div');
    basketElement.className = 'option-choice basket-choice';
    basketElement.setAttribute('data-basket', basket.id);
    
    basketElement.innerHTML = `
      <div class="preview-box basket-preview ${basket.id}-basket">${basket.emoji}</div>
      <span>${basket.name}</span>
    `;
    
    basketElement.addEventListener('click', () => {
      // Remove active class from all choices
      document.querySelectorAll('.basket-choice').forEach(el => el.classList.remove('active'));
      // Add active class to this choice
      basketElement.classList.add('active');
      // Apply the basket style
      applyBasketStyle(basket.id);
    });
    
    if (basketSection) basketSection.appendChild(basketElement);
  });
  
  // Highlight the saved options
  const savedTheme = localStorage.getItem('gameTheme') || 'space';
  const savedBasket = localStorage.getItem('gameBasket') || 'classic';
  
  document.querySelectorAll('.background-choice').forEach(choice => {
    if (choice.getAttribute('data-theme') === savedTheme) {
      choice.classList.add('active');
    }
  });
  
  document.querySelectorAll('.basket-choice').forEach(choice => {
    if (choice.getAttribute('data-basket') === savedBasket) {
      choice.classList.add('active');
    }
  });
  
  // Apply the saved theme
  applyTheme(savedTheme);
}

// Initialize event listeners for options screen
document.addEventListener('DOMContentLoaded', function() {
  // Initialize options when DOM is loaded
  initializeOptions();
  
  // Open options screen when ENTER GAME is clicked
  const optionsBtn = document.getElementById('optionsBtn');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', function() {
      document.getElementById('intro').style.display = 'none';
      document.getElementById('optionsScreen').style.display = 'flex';
      
      // Initialize options again in case they weren't loaded yet
      initializeOptions();
    });
  }
  
  // Go back to intro screen
  const backToIntroBtn = document.getElementById('backToIntroBtn');
  if (backToIntroBtn) {
    backToIntroBtn.addEventListener('click', function() {
      document.getElementById('optionsScreen').style.display = 'none';
      document.getElementById('intro').style.display = 'flex';
    });
  }
  
  // Start game after selecting options
  const startGameBtn = document.getElementById('startGameBtn');
  if (startGameBtn) {
    startGameBtn.addEventListener('click', function() {
      document.getElementById('optionsScreen').style.display = 'none';
      
      // Start the game
      if (typeof startGame === 'function') {
        startGame();
      }
    });
  }
}); 