// ===== Mobile Menu Toggle =====
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle && navMenu) {
  mobileMenuToggle.addEventListener('click', function() {
    this.classList.toggle('active');
    navMenu.classList.toggle('active');
  });

  // Close menu when clicking on a link
  const navLinks = navMenu.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    });
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-container')) {
      mobileMenuToggle.classList.remove('active');
      navMenu.classList.remove('active');
    }
  });
}

// ===== Honeycomb Background Animation =====
function createHoneycombPattern() {
  const honeycombBg = document.getElementById('honeycombBg');
  if (!honeycombBg) return;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  svg.setAttribute('viewBox', '0 0 1200 800');
  svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');

  const rows = 8;
  const cols = 12;
  const hexSize = 60;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * hexSize * 1.5 + (row % 2 ? hexSize * 0.75 : 0);
      const y = row * hexSize * 0.866;
      
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      
      const points = [
        `${x},${y - 25}`,
        `${x + 22},${y - 12}`,
        `${x + 22},${y + 12}`,
        `${x},${y + 25}`,
        `${x - 22},${y + 12}`,
        `${x - 22},${y - 12}`
      ].join(' ');
      
      polygon.setAttribute('points', points);
      polygon.setAttribute('fill', 'none');
      polygon.setAttribute('stroke', '#FFC107');
      polygon.setAttribute('stroke-width', '1.5');
      polygon.style.opacity = '0';
      polygon.style.animation = `hexagonFade 4s ease-in-out ${(row + col) * 0.05}s infinite alternate`;
      
      g.appendChild(polygon);
      svg.appendChild(g);
    }
  }

  honeycombBg.appendChild(svg);
}

// Create hexagon fade animation dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes hexagonFade {
    0% { opacity: 0.3; transform: scale(0.95); }
    100% { opacity: 0.6; transform: scale(1); }
  }
`;
document.head.appendChild(style);

createHoneycombPattern();

// ===== Product Favorite Toggle =====
const favoriteButtons = document.querySelectorAll('.product-favorite');

favoriteButtons.forEach(button => {
  button.addEventListener('click', function() {
    const svg = this.querySelector('svg');
    const path = svg.querySelector('path');
    
    if (this.classList.contains('favorited')) {
      this.classList.remove('favorited');
      path.style.fill = 'none';
    } else {
      this.classList.add('favorited');
      path.style.fill = '#ef4444';
    }
  });
});

// ===== Newsletter Form Submission =====
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const emailInput = this.querySelector('.cta-input');
    const email = emailInput.value;
    
    if (email) {
      // Simulate form submission
      const submitButton = this.querySelector('.cta-btn');
      const originalText = submitButton.textContent;
      
      submitButton.textContent = '✓ Erfolgreich!';
      submitButton.style.background = '#10b981';
      
      setTimeout(() => {
        submitButton.textContent = originalText;
        submitButton.style.background = '';
        emailInput.value = '';
      }, 3000);
    }
  });
}

// ===== Add to Cart Animation =====
const addToCartButtons = document.querySelectorAll('.product-add-btn');

addToCartButtons.forEach(button => {
  button.addEventListener('click', function() {
    const originalText = this.textContent;
    
    this.textContent = '✓ Hinzugefügt!';
    this.style.background = 'linear-gradient(135deg, #10b981, #059669)';
    
    setTimeout(() => {
      this.textContent = originalText;
      this.style.background = '';
    }, 2000);
  });
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const href = this.getAttribute('href');
    if (href !== '#' && href.length > 1) {
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }
  });
});

// ===== Scroll Animations =====
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe elements for scroll animations
const animatedElements = document.querySelectorAll('.feature-card, .product-card, .section-header, .cta-content');
animatedElements.forEach(el => {
  observer.observe(el);
});

// ===== Hexagon Icon Hover Effects =====
const hexagonIcons = document.querySelectorAll('.hexagon-icon');

hexagonIcons.forEach(icon => {
  const card = icon.closest('.feature-card');
  
  if (card) {
    card.addEventListener('mouseenter', () => {
      icon.style.transform = 'scale(1.1) rotate(5deg)';
    });
    
    card.addEventListener('mouseleave', () => {
      icon.style.transform = 'scale(1) rotate(0deg)';
    });
  }
});

// ===== Lazy Loading Images =====
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        imageObserver.unobserve(img);
      }
    });
  });

  const images = document.querySelectorAll('img');
  images.forEach(img => {
    imageObserver.observe(img);
  });
}

// ===== Performance: Debounce Scroll Events =====
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ===== Header Shadow on Scroll =====
const header = document.querySelector('.header');
let lastScroll = 0;

const handleScroll = debounce(() => {
  const currentScroll = window.pageYOffset;
  
  if (currentScroll > 100) {
    header.style.boxShadow = '0 4px 16px rgba(255, 193, 7, 0.15)';
  } else {
    header.style.boxShadow = '0 2px 8px rgba(255, 193, 7, 0.1)';
  }
  
  lastScroll = currentScroll;
}, 10);

window.addEventListener('scroll', handleScroll);

// ===== Console Easter Egg =====
console.log('%c🍯 Golden Honey', 'font-size: 24px; font-weight: bold; color: #FFC107;');
console.log('%cNatürlicher Honig direkt vom Imker!', 'font-size: 14px; color: #FFB300;');
console.log('%cMade with ❤️ using Vanilla JavaScript', 'font-size: 12px; color: #6B6B6B;');


// ================================== ERGÄNZUNGEN BZW. VERBINDUNG MIT ANDERE HTML ===========================//
function login() {
  window.location.href = "login.html";
}

function register(){
  window.location .href = "register.html";
}
