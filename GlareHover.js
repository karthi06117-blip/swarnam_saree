// Vanilla JavaScript GlareHover Component
class GlareHover {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      width: options.width || '100%',
      height: options.height || '100%',
      background: options.background || '#000',
      borderRadius: options.borderRadius || '10px',
      borderColor: options.borderColor || '#333',
      glareColor: options.glareColor || '#ffffff',
      glareOpacity: options.glareOpacity || 0.3,
      glareAngle: options.glareAngle || -30,
      glareSize: options.glareSize || 300,
      transitionDuration: options.transitionDuration || 800,
      playOnce: options.playOnce || false,
      className: options.className || ''
    };
    
    this.init();
  }

  init() {
    const wrapper = document.createElement('div');
    wrapper.className = `glare-hover ${this.options.playOnce ? 'glare-hover--play-once' : ''} ${this.options.className}`;
    
    // Set CSS variables
    this.setStyles(wrapper);
    
    // Wrap the original element
    this.element.parentNode.insertBefore(wrapper, this.element);
    wrapper.appendChild(this.element);
  }

  setStyles(wrapper) {
    const hex = this.options.glareColor.replace('#', '');
    let rgba = this.options.glareColor;

    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      rgba = `rgba(${r}, ${g}, ${b}, ${this.options.glareOpacity})`;
    } else if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      rgba = `rgba(${r}, ${g}, ${b}, ${this.options.glareOpacity})`;
    }

    wrapper.style.setProperty('--gh-width', this.options.width);
    wrapper.style.setProperty('--gh-height', this.options.height);
    wrapper.style.setProperty('--gh-bg', this.options.background);
    wrapper.style.setProperty('--gh-br', this.options.borderRadius);
    wrapper.style.setProperty('--gh-angle', `${this.options.glareAngle}deg`);
    wrapper.style.setProperty('--gh-duration', `${this.options.transitionDuration}ms`);
    wrapper.style.setProperty('--gh-size', `${this.options.glareSize}%`);
    wrapper.style.setProperty('--gh-rgba', rgba);
    wrapper.style.setProperty('--gh-border', this.options.borderColor);
  }

  static applyToImage(imageElement, options = {}) {
    return new GlareHover(imageElement, options);
  }
}

// Global function to apply glare to all saree images
function applyGlareToSarees() {
  // Apply to featured products and shop products
  const sareeImages = document.querySelectorAll('.saree-card-img img, .product-detail-hero img');
  
  sareeImages.forEach(img => {
    // Skip if already wrapped
    if (!img.parentElement.classList.contains('glare-hover')) {
      GlareHover.applyToImage(img, {
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        borderColor: '#D4AF37',
        glareColor: '#D4AF37',
        glareOpacity: 0.25,
        glareAngle: -30,
        glareSize: 300,
        transitionDuration: 800,
        playOnce: false,
        className: 'saree-glare'
      });
    }
  });
}

// Apply glare effect when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyGlareToSarees);
} else {
  applyGlareToSarees();
}

// Re-apply glare when products are dynamically rendered
const observer = new MutationObserver(() => {
  applyGlareToSarees();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
