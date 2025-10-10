// Mobile utilities for POS System

// Touch-friendly utilities
window.MobileUtils = {
    // Check if device is mobile
    isMobile: () => {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.innerWidth <= 768;
    },

    // Check if device is tablet
    isTablet: () => {
        return /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent) ||
               (window.innerWidth > 768 && window.innerWidth <= 1024);
    },

    // Check if device supports touch
    isTouchDevice: () => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    },

    // Get device orientation
    getOrientation: () => {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    },

    // Add touch feedback to elements
    addTouchFeedback: (element) => {
        if (!window.MobileUtils.isTouchDevice()) return;

        element.addEventListener('touchstart', () => {
            element.style.transform = 'scale(0.95)';
            element.style.transition = 'transform 0.1s ease';
        });

        element.addEventListener('touchend', () => {
            element.style.transform = 'scale(1)';
        });

        element.addEventListener('touchcancel', () => {
            element.style.transform = 'scale(1)';
        });
    },

    // Prevent zoom on input focus (iOS)
    preventZoomOnFocus: () => {
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.style.fontSize = '16px';
            });
        });
    },

    // Handle swipe gestures
    addSwipeSupport: (element, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown) => {
        let startX, startY, endX, endY;
        const minSwipeDistance = 50;

        element.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        element.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;

            const deltaX = endX - startX;
            const deltaY = endY - startY;

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                // Horizontal swipe
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0 && onSwipeRight) {
                        onSwipeRight();
                    } else if (deltaX < 0 && onSwipeLeft) {
                        onSwipeLeft();
                    }
                }
            } else {
                // Vertical swipe
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0 && onSwipeDown) {
                        onSwipeDown();
                    } else if (deltaY < 0 && onSwipeUp) {
                        onSwipeUp();
                    }
                }
            }
        });
    },

    // Add pull-to-refresh functionality
    addPullToRefresh: (element, onRefresh) => {
        let startY = 0;
        let currentY = 0;
        let pullDistance = 0;
        const maxPullDistance = 100;

        element.addEventListener('touchstart', (e) => {
            if (element.scrollTop === 0) {
                startY = e.touches[0].clientY;
            }
        });

        element.addEventListener('touchmove', (e) => {
            if (element.scrollTop === 0) {
                currentY = e.touches[0].clientY;
                pullDistance = currentY - startY;

                if (pullDistance > 0) {
                    e.preventDefault();
                    element.style.transform = `translateY(${Math.min(pullDistance * 0.5, maxPullDistance)}px)`;
                }
            }
        });

        element.addEventListener('touchend', () => {
            if (pullDistance > maxPullDistance * 0.7) {
                onRefresh();
            }
            element.style.transform = '';
            pullDistance = 0;
        });
    },

    // Handle keyboard events for mobile
    handleMobileKeyboard: () => {
        const inputs = document.querySelectorAll('input, textarea');
        
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                // Scroll to input when keyboard appears
                setTimeout(() => {
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });
        });
    },

    // Add haptic feedback (if supported)
    hapticFeedback: (type = 'light') => {
        if ('vibrate' in navigator) {
            switch (type) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(50);
                    break;
                case 'heavy':
                    navigator.vibrate(100);
                    break;
                case 'success':
                    navigator.vibrate([50, 50, 50]);
                    break;
                case 'error':
                    navigator.vibrate([100, 50, 100]);
                    break;
            }
        }
    },

    // Optimize for mobile performance
    optimizeForMobile: () => {
        // Reduce animations on low-end devices
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4) {
            document.body.style.setProperty('--animation-duration', '0.1s');
        }

        // Disable hover effects on touch devices
        if (window.MobileUtils.isTouchDevice()) {
            const style = document.createElement('style');
            style.textContent = `
                @media (hover: none) {
                    *:hover {
                        background-color: inherit !important;
                        color: inherit !important;
                        transform: none !important;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    },

    // Handle mobile-specific navigation
    handleMobileNavigation: () => {
        // Add swipe to navigate between views
        const mainContent = document.querySelector('main');
        if (mainContent) {
            window.MobileUtils.addSwipeSupport(
                mainContent,
                () => {
                    // Swipe left - go to next view
                    console.log('Swipe left detected');
                },
                () => {
                    // Swipe right - go to previous view
                    console.log('Swipe right detected');
                }
            );
        }
    },

    // Initialize mobile features
    init: () => {
        window.MobileUtils.preventZoomOnFocus();
        window.MobileUtils.handleMobileKeyboard();
        window.MobileUtils.optimizeForMobile();
        window.MobileUtils.handleMobileNavigation();

        // Add touch feedback to all buttons
        const buttons = document.querySelectorAll('button, .touch-button');
        buttons.forEach(button => {
            window.MobileUtils.addTouchFeedback(button);
        });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                window.MobileUtils.handleMobileKeyboard();
            }, 500);
        });

        // Handle resize events
        window.addEventListener('resize', () => {
            if (window.MobileUtils.isMobile()) {
                window.MobileUtils.handleMobileKeyboard();
            }
            
            // Ensure mobile nav is hidden on desktop
            const mobileNav = document.querySelector('.mobile-nav');
            if (mobileNav) {
                if (window.innerWidth >= 1024) {
                    mobileNav.style.display = 'none';
                } else {
                    mobileNav.style.display = 'block';
                }
            }
        });
        
        // Initial check for mobile nav visibility
        const mobileNav = document.querySelector('.mobile-nav');
        if (mobileNav) {
            if (window.innerWidth >= 1024) {
                mobileNav.style.display = 'none';
            } else {
                mobileNav.style.display = 'block';
            }
        }
    }
};

// Initialize mobile utilities when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.MobileUtils.init();
    });
} else {
    window.MobileUtils.init();
}
