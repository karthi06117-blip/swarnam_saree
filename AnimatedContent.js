// Vanilla JavaScript AnimatedContent Component with GSAP
// This creates smooth animations for content entering the viewport

class AnimatedContent {
  constructor(element, options = {}) {
    this.element = element;
    this.options = {
      distance: options.distance || 100,
      direction: options.direction || 'vertical', // 'vertical' or 'horizontal'
      reverse: options.reverse || false,
      duration: options.duration || 0.8,
      ease: options.ease || 'power3.out',
      initialOpacity: options.initialOpacity || 0,
      animateOpacity: options.animateOpacity !== false,
      scale: options.scale || 1,
      threshold: options.threshold || 0.1,
      delay: options.delay || 0,
      disappearAfter: options.disappearAfter || 0,
      disappearDuration: options.disappearDuration || 0.5,
      disappearEase: options.disappearEase || 'power3.in',
      onComplete: options.onComplete,
      onDisappearanceComplete: options.onDisappearanceComplete,
      className: options.className || '',
      triggerOnLoad: options.triggerOnLoad !== false, // Trigger on page load
      scrollContainer: options.scrollContainer || null
    };

    this.init();
  }

  init() {
    // Check if GSAP is available
    if (typeof gsap === 'undefined') {
      console.warn('AnimatedContent: GSAP library not found. Animations disabled.');
      return;
    }

    const el = this.element;
    const axis = this.options.direction === 'horizontal' ? 'x' : 'y';
    const offset = this.options.reverse ? -this.options.distance : this.options.distance;

    // Set initial state
    gsap.set(el, {
      [axis]: offset,
      scale: this.options.scale,
      opacity: this.options.animateOpacity ? this.options.initialOpacity : 1,
      visibility: 'visible'
    });

    if (this.options.triggerOnLoad) {
      // Trigger animation on page load
      setTimeout(() => {
        this.playAnimation();
      }, this.options.delay * 1000);
    } else {
      // Use Intersection Observer for scroll-based animation
      this.setupScrollTrigger();
    }
  }

  playAnimation() {
    const el = this.element;
    const axis = this.options.direction === 'horizontal' ? 'x' : 'y';

    const animationObj = {
      [axis]: 0,
      scale: 1,
      opacity: 1,
      duration: this.options.duration,
      ease: this.options.ease,
      onComplete: () => {
        if (this.options.onComplete) {
          this.options.onComplete();
        }

        // Handle disappearance after delay
        if (this.options.disappearAfter > 0) {
          setTimeout(() => {
            gsap.to(el, {
              [axis]: this.options.reverse ? this.options.distance : -this.options.distance,
              scale: 0.8,
              opacity: this.options.animateOpacity ? this.options.initialOpacity : 0,
              duration: this.options.disappearDuration,
              ease: this.options.disappearEase,
              onComplete: () => {
                if (this.options.onDisappearanceComplete) {
                  this.options.onDisappearanceComplete();
                }
              }
            });
          }, this.options.disappearAfter * 1000);
        }
      }
    };

    gsap.to(el, animationObj);
  }

  setupScrollTrigger() {
    // Use Intersection Observer as a simpler alternative to ScrollTrigger
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.playAnimation();
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: this.options.threshold }
    );

    observer.observe(this.element);
    this.observer = observer;
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  static applyToElements(selector, options = {}) {
    const elements = document.querySelectorAll(selector);
    const instances = [];
    elements.forEach((el) => {
      instances.push(new AnimatedContent(el, options));
    });
    return instances;
  }
}

// Global function to apply animations to saree images
function applySareeImageAnimations() {
  const sareeImages = document.querySelectorAll('.saree-card-img img, .product-detail-hero img');
  
  sareeImages.forEach((img, index) => {
    // Skip if already animated
    if (img.dataset.animated) return;
    
    // Wrap image if not already wrapped
    if (!img.parentElement.classList.contains('animated-content')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'animated-content';
      img.parentElement.insertBefore(wrapper, img);
      wrapper.appendChild(img);
    }
    
    new AnimatedContent(img.parentElement, {
      distance: 80,
      direction: 'vertical',
      reverse: false,
      duration: 0.8,
      ease: 'power2.out',
      initialOpacity: 0.3,
      animateOpacity: true,
      scale: 0.95,
      threshold: 0.2,
      delay: index * 0.1, // Stagger animations
      triggerOnLoad: true,
      className: 'saree-image-animation'
    });
    
    img.dataset.animated = true;
  });
}

// Apply animations when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySareeImageAnimations);
} else {
  applySareeImageAnimations();
}

// Re-apply when products are dynamically rendered
const observer = new MutationObserver(() => {
  applySareeImageAnimations();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Export for use
if (typeof window !== 'undefined') {
  window.AnimatedContent = AnimatedContent;
  window.applySareeImageAnimations = applySareeImageAnimations;
}
