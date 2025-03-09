import React, { useState, useEffect, createContext, useContext } from 'react';
import { X, Info, AlertCircle, CheckCircle } from 'lucide-react';

// Create context for toast notifications
const ToastContext = createContext(null);

// Toast types with their corresponding styles and icons
const TOAST_TYPES = {
  INFO: {
    bgColor: 'bg-blue-900',
    borderColor: 'border-blue-600',
    textColor: 'text-blue-300',
    icon: <Info className="w-5 h-5" />
  },
  SUCCESS: {
    bgColor: 'bg-green-900',
    borderColor: 'border-green-600',
    textColor: 'text-green-300',
    icon: <CheckCircle className="w-5 h-5" />
  },
  ERROR: {
    bgColor: 'bg-red-900',
    borderColor: 'border-red-600',
    textColor: 'text-red-300',
    icon: <AlertCircle className="w-5 h-5" />
  }
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a new toast notification
  const addToast = (message, type = 'INFO', duration = 3000) => {
    const id = Date.now();
    setToasts(prevToasts => [...prevToasts, { id, message, type, duration }]);
    return id;
  };

  // Remove a toast notification
  const removeToast = (id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  };

  // Create context value
  const contextValue = {
    addToast,
    removeToast
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            {...toast} 
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook to use the toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Toast notification component
const Toast = ({ id, message, type, duration, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  // Set up auto-close timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  // Get toast styling
  const toastStyle = TOAST_TYPES[type] || TOAST_TYPES.INFO;

  return (
    <div 
      className={`
        ${toastStyle.bgColor} 
        ${toastStyle.borderColor} 
        ${toastStyle.textColor} 
        border 
        rounded-lg 
        shadow-lg 
        p-4
        max-w-md
        backdrop-blur-md
        bg-opacity-80
        transform transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {toastStyle.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button 
          onClick={() => setIsVisible(false)} 
          className="ml-4 flex-shrink-0 opacity-50 hover:opacity-100 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;