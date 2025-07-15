import React, { useState, useRef, useEffect } from 'react';

// Dropdown Component
export const Dropdown = ({
  trigger,
  children,
  isOpen,
  onToggle
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <div className="dropdown">
      <div
        onClick={onToggle}
        className="dropdown-trigger dropdown-anim"
        tabIndex={0}
        role="button"
        aria-expanded={isOpen}
        style={{ cursor: 'pointer', outline: 'none', transition: 'background 0.2s' }}
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