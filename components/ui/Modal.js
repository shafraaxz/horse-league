// FILE: components/ui/Modal.js (ENHANCED)
// ===========================================
import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventBodyScroll = true,
  className = '',
  headerClassName = '',
  contentClassName = '',
  animation = 'fade' // 'fade', 'slide', 'zoom'
}) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const firstFocusableRef = useRef(null);
  const lastFocusableRef = useRef(null);

  // Size configurations
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    full: 'max-w-screen-xl mx-4',
  };

  // Animation classes
  const animationClasses = {
    fade: {
      backdrop: {
        enter: 'transition-opacity duration-300 ease-out opacity-0',
        enterActive: 'opacity-100',
        exit: 'transition-opacity duration-200 ease-in opacity-100',
        exitActive: 'opacity-0'
      },
      modal: {
        enter: 'transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4',
        enterActive: 'opacity-100 scale-100 translate-y-0',
        exit: 'transition-all duration-200 ease-in opacity-100 scale-100 translate-y-0',
        exitActive: 'opacity-0 scale-95 translate-y-4'
      }
    },
    slide: {
      backdrop: {
        enter: 'transition-opacity duration-300 ease-out opacity-0',
        enterActive: 'opacity-100',
        exit: 'transition-opacity duration-200 ease-in opacity-100',
        exitActive: 'opacity-0'
      },
      modal: {
        enter: 'transition-transform duration-300 ease-out translate-x-full',
        enterActive: 'translate-x-0',
        exit: 'transition-transform duration-200 ease-in translate-x-0',
        exitActive: 'translate-x-full'
      }
    },
    zoom: {
      backdrop: {
        enter: 'transition-opacity duration-300 ease-out opacity-0',
        enterActive: 'opacity-100',
        exit: 'transition-opacity duration-200 ease-in opacity-100',
        exitActive: 'opacity-0'
      },
      modal: {
        enter: 'transition-all duration-300 ease-out opacity-0 scale-50',
        enterActive: 'opacity-100 scale-100',
        exit: 'transition-all duration-200 ease-in opacity-100 scale-100',
        exitActive: 'opacity-0 scale-50'
      }
    }
  };

  // Get focusable elements
  const getFocusableElements = () => {
    if (!modalRef.current) return [];
    
    return modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
  };

  // Handle opening modal
  useEffect(() => {
    if (isOpen) {
      // Store current focused element
      previousFocusRef.current = document.activeElement;
      
      // Prevent body scroll
      if (preventBodyScroll) {
        document.body.style.overflow = 'hidden';
      }
      
      // Start animation
      setIsVisible(true);
      setIsAnimating(true);
      
      // Complete entrance animation
      const timer = setTimeout(() => {
        setIsAnimating(false);
        
        // Focus management
        const focusableElements = getFocusableElements();
        if (focusableElements.length > 0) {
          focusableElements[0].focus();
          firstFocusableRef.current = focusableElements[0];
          lastFocusableRef.current = focusableElements[focusableElements.length - 1];
        }
      }, 50);
      
      return () => clearTimeout(timer);
    } else if (isVisible) {
      // Start exit animation
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setIsAnimating(false);
        
        // Restore body scroll
        if (preventBodyScroll) {
          document.body.style.overflow = 'unset';
        }
        
        // Return focus to previous element
        if (previousFocusRef.current) {
          previousFocusRef.current.focus();
        }
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen, isVisible, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isVisible) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnEscape, isVisible, onClose]);

  // Handle focus trap
  useEffect(() => {
    if (!isVisible || isAnimating) return;
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isVisible, isAnimating]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preventBodyScroll) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [preventBodyScroll]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not visible
  if (!isVisible) return null;

  const currentAnimation = animationClasses[animation] || animationClasses.fade;
  const isEntering = isOpen && isAnimating;
  const isExiting = !isOpen && isAnimating;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className={`fixed inset-0 bg-black transition-opacity ${
            isEntering 
              ? `${currentAnimation.backdrop.enter} ${currentAnimation.backdrop.enterActive}`
              : isExiting
              ? `${currentAnimation.backdrop.exit} ${currentAnimation.backdrop.exitActive}`
              : 'bg-opacity-50'
          }`}
          onClick={handleBackdropClick}
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        />

        {/* Spacer for centering */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal */}
        <div 
          ref={modalRef}
          className={`inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform sm:my-8 sm:align-middle sm:w-full ${
            sizeClasses[size]
          } ${
            isEntering 
              ? `${currentAnimation.modal.enter} ${currentAnimation.modal.enterActive}`
              : isExiting
              ? `${currentAnimation.modal.exit} ${currentAnimation.modal.exitActive}`
              : ''
          } ${className}`}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className={`bg-white px-6 py-4 border-b border-gray-200 ${headerClassName}`}>
              <div className="flex justify-between items-center">
                {title && (
                  <h3 
                    id="modal-title"
                    className="text-xl font-semibold text-gray-900"
                  >
                    {title}
                  </h3>
                )}
                {showCloseButton && (
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className={`bg-white px-6 py-6 ${contentClassName}`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Additional Modal Components for common use cases

// Confirmation Modal
export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "default" // 'default', 'danger', 'warning'
}) {
  const typeStyles = {
    default: {
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: "text-blue-600"
    },
    danger: {
      button: "bg-red-600 hover:bg-red-700 text-white",
      icon: "text-red-600"
    },
    warning: {
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
      icon: "text-yellow-600"
    }
  };

  const currentStyle = typeStyles[type];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${currentStyle.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Loading Modal
export function LoadingModal({ 
  isOpen, 
  message = "Loading...",
  showClose = false,
  onClose
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose || (() => {})} 
      showCloseButton={showClose}
      closeOnBackdrop={false}
      closeOnEscape={false}
      size="sm"
    >
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">{message}</p>
      </div>
    </Modal>
  );
}

// Image Modal
export function ImageModal({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageAlt = "Image",
  title
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="xl"
      className="bg-transparent shadow-none"
      contentClassName="p-0 bg-transparent"
    >
      <div className="text-center">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
      </div>
    </Modal>
  );
}
