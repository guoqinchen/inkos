import React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

interface DialogContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DialogContent: React.FC<DialogContentProps> = ({ children, className = '' }) => (
  <DialogPortal>
    <DialogPrimitive.Overlay className={`dialog-overlay ${className}`} />
    <DialogPrimitive.Content className={`dialog-content ${className}`}>
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
);
