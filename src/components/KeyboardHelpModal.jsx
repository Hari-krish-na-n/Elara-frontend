// src/components/KeyboardHelpModal.jsx
import React from 'react';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';
import './KeyboardHelpModal.css';

const KeyboardHelpModal = ({ onClose }) => {
  return (
    <div className="keyboard-help-overlay" onClick={onClose}>
      <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
        <div className="help-header">
          <h2>⌨️ Keyboard Shortcuts</h2>
          <button onClick={onClose} className="close-help">×</button>
        </div>
        <div className="help-content">
          <div className="help-section">
            <h3>Playback</h3>
            {KEYBOARD_SHORTCUTS.playback.map((shortcut, index) => (
              <div key={index} className="shortcut">
                <kbd>{shortcut.key}</kbd> <span>{shortcut.action}</span>
              </div>
            ))}
          </div>

          <div className="help-section">
            <h3>Volume</h3>
            {KEYBOARD_SHORTCUTS.volume.map((shortcut, index) => (
              <div key={index} className="shortcut">
                <kbd>{shortcut.key}</kbd> <span>{shortcut.action}</span>
              </div>
            ))}
          </div>

          <div className="help-section">
            <h3>Controls</h3>
            {KEYBOARD_SHORTCUTS.controls.map((shortcut, index) => (
              <div key={index} className="shortcut">
                <kbd>{shortcut.key}</kbd> <span>{shortcut.action}</span>
              </div>
            ))}
          </div>

          <div className="help-section">
            <h3>Navigation</h3>
            {KEYBOARD_SHORTCUTS.navigation.map((shortcut, index) => (
              <div key={index} className="shortcut">
                <kbd>{shortcut.key}</kbd> <span>{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardHelpModal;