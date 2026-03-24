import React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';

interface ScrollAreaProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const ScrollArea: React.FC<ScrollAreaProps> = ({ children, className = '', style }) => (
  <ScrollAreaPrimitive.Root className={`scroll-area ${className}`} style={style}>
    <ScrollAreaPrimitive.Viewport className="scroll-area__viewport">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollAreaPrimitive.Scrollbar orientation="vertical" className="scroll-area__scrollbar">
      <ScrollAreaPrimitive.Thumb className="scroll-area__thumb" />
    </ScrollAreaPrimitive.Scrollbar>
  </ScrollAreaPrimitive.Root>
);
