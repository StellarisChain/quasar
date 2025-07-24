import React, { useState, useRef, useEffect } from 'react';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  enabled?: boolean;
}

// Dropdown Component
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  isOpen,
  onToggle,
  enabled = true,
}) => {
  return (
    <div className="dropdown">
      <div
        onClick={enabled ? onToggle : undefined}
        className="dropdown-trigger dropdown-anim"
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        aria-disabled={!enabled}
        style={{
          cursor: enabled ? 'pointer' : 'not-allowed',
          transition: 'background 0.2s',
          opacity: !enabled ? 0.6 : 1,
        }}
      >
        {trigger}
      </div>
      <div
        className={`dropdown-content${isOpen ? ' open' : ''}`}
        style={{
          maxHeight: isOpen ? 500 : 0,
          opacity: isOpen ? 1 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.2s',
        }}
      >
        {children}
      </div>
    </div>
  );
};