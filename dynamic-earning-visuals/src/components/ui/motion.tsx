import React, { ReactNode, useEffect, useRef, useState } from 'react';

interface MotionProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  duration?: number;
  delay?: number;
  className?: string;
}

export const Motion = ({
  children,
  animation = 'fade-in',
  duration = 0.5,
  delay = 0,
  className = '',
}: MotionProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  const getAnimationClass = () => {
    if (!isVisible) return 'opacity-0';

    const animationClasses = {
      'fade-in': 'animate-fade-in',
      'slide-up': 'animate-slide-up',
      'slide-down': 'animate-slide-down',
      'slide-left': 'animate-slide-left',
      'slide-right': 'animate-slide-right',
    };

    return animationClasses[animation] || 'animate-fade-in';
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClass()} ${className}`}
      style={{
        opacity: isVisible ? 1 : 0,
        animationDuration: `${duration}s`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
};

interface MotionGroupProps {
  children: ReactNode;
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right';
  staggerDelay?: number;
  className?: string;
}

export const MotionGroup = ({
  children,
  animation = 'fade-in',
  staggerDelay = 0.1,
  className = '',
}: MotionGroupProps) => {
  // We clone each child and inject animation props
  const childrenWithProps = React.Children.map(children, (child, index) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        animation,
        delay: index * staggerDelay,
      });
    }
    return child;
  });

  return <div className={className}>{childrenWithProps}</div>;
};
