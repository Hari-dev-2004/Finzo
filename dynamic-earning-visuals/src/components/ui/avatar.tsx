import React from 'react';

interface AvatarProps {
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ className, children }: AvatarProps) {
  return (
    <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`}>
      {children}
    </div>
  );
}

interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export function AvatarImage({ className, src, alt, ...props }: AvatarImageProps) {
  return (
    <img 
      src={src} 
      alt={alt || "Avatar"} 
      className={`aspect-square h-full w-full ${className || ''}`} 
      {...props} 
    />
  );
}

interface AvatarFallbackProps {
  className?: string;
  children?: React.ReactNode;
}

export function AvatarFallback({ className, children }: AvatarFallbackProps) {
  return (
    <div 
      className={`flex h-full w-full items-center justify-center rounded-full bg-muted ${className || ''}`}
    >
      {children}
    </div>
  );
}
