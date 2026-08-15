import React, { useState, useEffect, useRef, useMemo, Children, cloneElement } from 'https://esm.sh/react@18.3.1';
import ReactDOM from 'https://esm.sh/react-dom@18.3.1/client';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.17';

function DockItem({ children, className = '', onClick, mouseX, spring, distance, magnification, baseItemSize, label, isActive }) {
  const ref = useRef(null);
  const isHovered = useMotionValue(0);

  const mouseDistance = useTransform(mouseX, val => {
    const rect = ref.current?.getBoundingClientRect() ?? {
      x: 0,
      width: baseItemSize
    };
    return val - rect.x - baseItemSize / 2;
  });

  const targetSize = useTransform(mouseDistance, [-distance, 0, distance], [baseItemSize, magnification, baseItemSize]);
  const size = useSpring(targetSize, spring);

  const handleKeyDown = e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return React.createElement(
    motion.div,
    {
      ref: ref,
      style: { width: size, height: size },
      onHoverStart: () => isHovered.set(1),
      onHoverEnd: () => isHovered.set(0),
      onFocus: () => isHovered.set(1),
      onBlur: () => isHovered.set(0),
      onClick: onClick,
      className: `dock-item ${isActive ? 'active' : ''} ${className}`,
      tabIndex: 0,
      role: 'button',
      'aria-haspopup': 'true',
      'aria-label': label,
      onKeyDown: handleKeyDown
    },
    Children.map(children, child => cloneElement(child, { isHovered }))
  );
}

function DockLabel({ children, className = '', ...rest }) {
  const { isHovered } = rest;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isHovered) return;
    const unsubscribe = isHovered.on('change', latest => {
      setIsVisible(latest === 1);
    });
    return () => unsubscribe();
  }, [isHovered]);

  return React.createElement(
    AnimatePresence,
    null,
    isVisible &&
      React.createElement(
        motion.div,
        {
          initial: { opacity: 0, y: 0 },
          animate: { opacity: 1, y: -10 },
          exit: { opacity: 0, y: 0 },
          transition: { duration: 0.2 },
          className: `dock-label ${className}`,
          role: 'tooltip',
          style: { x: '-50%' }
        },
        children
      )
  );
}

function DockIcon({ children, className = '' }) {
  return React.createElement('div', { className: `dock-icon ${className}` }, children);
}

function Dock({
  items,
  className = '',
  spring = { mass: 0.1, stiffness: 150, damping: 12 },
  magnification = 70,
  distance = 200,
  panelHeight = 68,
  dockHeight = 256,
  baseItemSize = 50
}) {
  const mouseX = useMotionValue(Infinity);
  const isHovered = useMotionValue(0);

  const maxHeight = useMemo(
    () => Math.max(dockHeight, magnification + magnification / 2 + 4),
    [magnification, dockHeight]
  );
  const heightRow = useTransform(isHovered, [0, 1], [panelHeight, maxHeight]);
  const height = useSpring(heightRow, spring);

  return React.createElement(
    motion.div,
    { style: { height, scrollbarWidth: 'none' }, className: 'dock-outer' },
    React.createElement(
      motion.div,
      {
        onMouseMove: ({ pageX }) => {
          isHovered.set(1);
          mouseX.set(pageX);
        },
        onMouseLeave: () => {
          isHovered.set(0);
          mouseX.set(Infinity);
        },
        className: `dock-panel ${className}`,
        style: { height: panelHeight },
        role: 'toolbar',
        'aria-label': 'Application dock'
      },
      items.map((item, index) =>
        React.createElement(
          DockItem,
          {
            key: index,
            onClick: item.onClick,
            className: item.className,
            mouseX: mouseX,
            spring: spring,
            distance: distance,
            magnification: magnification,
            baseItemSize: baseItemSize,
            label: item.label,
            isActive: item.isActive
          },
          React.createElement(DockIcon, null, item.icon),
          React.createElement(DockLabel, null, item.label)
        )
      )
    )
  );
}

function AppDock() {
  const [activeNav, setActiveNav] = useState('home');
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const handleViewChange = (e) => {
      if (e.detail && e.detail.viewId) {
        setActiveNav(e.detail.viewId);
      }
    };
    const handleCartUpdate = (e) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setCartCount(e.detail.count);
      }
    };

    window.addEventListener('svarnam:viewchange', handleViewChange);
    window.addEventListener('svarnam:cartupdate', handleCartUpdate);

    // Initial check
    if (window.svarnamState) {
      if (window.svarnamState.activeView) setActiveNav(window.svarnamState.activeView);
      if (typeof window.svarnamState.cartCount === 'number') setCartCount(window.svarnamState.cartCount);
    }

    return () => {
      window.removeEventListener('svarnam:viewchange', handleViewChange);
      window.removeEventListener('svarnam:cartupdate', handleCartUpdate);
    };
  }, []);

  const items = [
    {
      icon: React.createElement('i', { className: 'material-icons-round' }, 'home'),
      label: 'Home',
      isActive: activeNav === 'home',
      onClick: () => {
        setActiveNav('home');
        if (window.navigateTo) window.navigateTo('home');
      }
    },
    {
      icon: React.createElement('i', { className: 'material-icons-round' }, 'search'),
      label: 'Search',
      isActive: activeNav === 'shop',
      onClick: () => {
        setActiveNav('shop');
        if (window.navigateTo) window.navigateTo('shop');
      }
    },
    {
      icon: React.createElement(
        'div',
        { style: { position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' } },
        React.createElement('i', { className: 'material-icons-round' }, 'shopping_cart'),
        cartCount > 0 && React.createElement('span', { className: 'dock-badge' }, cartCount)
      ),
      label: 'Cart',
      isActive: activeNav === 'cart' || activeNav === 'checkout' || activeNav === 'confirmation',
      onClick: () => {
        setActiveNav('cart');
        if (window.navigateTo) window.navigateTo('cart');
      }
    }
  ];

  return React.createElement(Dock, {
    items: items,
    panelHeight: 68,
    baseItemSize: 50,
    magnification: 72,
    distance: 180
  });
}

// Mount when DOM is ready
function mountDock() {
  const container = document.getElementById('dock-root');
  if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(React.createElement(AppDock));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountDock);
} else {
  mountDock();
}
