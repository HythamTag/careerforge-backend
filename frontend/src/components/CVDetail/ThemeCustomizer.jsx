import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Palette, Type, RotateCcw } from 'lucide-react';

// Theme constants matching backend TemplateService
const DEFAULT_CUSTOMIZATION = {
    primaryColor: '#2563eb',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '11pt',
    lineHeight: '1.5',
};

const COLOR_PRESETS = [
    { name: 'Blue', value: '#2563eb' },
    { name: 'Purple', value: '#7c3aed' },
    { name: 'Green', value: '#059669' },
    { name: 'Red', value: '#dc2626' },
    { name: 'Orange', value: '#ea580c' },
    { name: 'Teal', value: '#0d9488' },
];

const FONT_OPTIONS = [
    { name: 'Inter (Recommended)', value: 'Inter, system-ui, sans-serif' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Courier New', value: 'Courier New, monospace' },
    { name: 'Times New Roman', value: 'Times New Roman, serif' },
];

/**
 * Theme Customizer Component
 * 
 * Allows user to customize CV template colors, fonts, and other styling
 */
const ThemeCustomizer = ({ customization, onCustomizationChange, className }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleColorChange = (color) => {
        onCustomizationChange({ ...customization, primaryColor: color });
    };

    const handleFontChange = (font) => {
        onCustomizationChange({ ...customization, fontFamily: font });
    };

    const handleReset = () => {
        onCustomizationChange(DEFAULT_CUSTOMIZATION);
    };

    return (
        <div className={`theme-customizer ${className || ''}`}>
            <div className="theme-customizer__header">
                <h3 className="theme-customizer__title">
                    <Palette size={20} />
                    Customize Theme
                </h3>
                <button
                    className="theme-customizer__reset"
                    onClick={handleReset}
                    title="Reset to defaults"
                >
                    <RotateCcw size={16} />
                    Reset
                </button>
            </div>

            <div className="theme-customizer__content">
                {/* Color Picker */}
                <div className="customizer-section">
                    <label className="customizer-section__label">
                        <Palette size={16} />
                        Primary Color
                    </label>
                    <div className="color-picker">
                        {COLOR_PRESETS.map((preset) => (
                            <button
                                key={preset.value}
                                className={`color-preset ${customization.primaryColor === preset.value
                                        ? 'color-preset--selected'
                                        : ''
                                    }`}
                                style={{ backgroundColor: preset.value }}
                                onClick={() => handleColorChange(preset.value)}
                                title={preset.name}
                                aria-label={preset.name}
                            />
                        ))}
                        <input
                            type="color"
                            className="color-input"
                            value={customization.primaryColor}
                            onChange={(e) => handleColorChange(e.target.value)}
                            title="Custom color"
                        />
                    </div>
                </div>

                {/* Font Selector */}
                <div className="customizer-section">
                    <label className="customizer-section__label">
                        <Type size={16} />
                        Font Family
                    </label>
                    <select
                        className="font-selector"
                        value={customization.fontFamily || DEFAULT_CUSTOMIZATION.fontFamily}
                        onChange={(e) => handleFontChange(e.target.value)}
                    >
                        {FONT_OPTIONS.map((font) => (
                            <option key={font.value} value={font.value}>
                                {font.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Info */}
                <div className="customizer-info">
                    <p>
                        💡 Changes are applied instantly to the preview. Download to save your customized CV.
                    </p>
                </div>
            </div>

            <style jsx>{`
        .theme-customizer {
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .theme-customizer__header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .theme-customizer__title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
        }

        .theme-customizer__reset {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          color: #6b7280;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .theme-customizer__reset:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .theme-customizer__content {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .customizer-section {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .customizer-section__label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .color-picker {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .color-preset {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .color-preset:hover {
          transform: scale(1.1);
        }

        .color-preset--selected {
          border-color: #1f2937;
          box-shadow: 0 0 0 2px white, 0 0 0 4px #1f2937;
        }

        .color-input {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 2px solid #e5e7eb;
          cursor: pointer;
          padding: 0;
        }

        .color-input::-webkit-color-swatch-wrapper {
          padding: 0;
        }

        .color-input::-webkit-color-swatch {
          border: none;
          border-radius: 6px;
        }

        .font-selector {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #1f2937;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        .font-selector:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .customizer-info {
          padding: 0.75rem;
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
          border-radius: 4px;
        }

        .customizer-info p {
          font-size: 0.875rem;
          color: #1e40af;
          margin: 0;
        }
      `}</style>
        </div>
    );
};

ThemeCustomizer.propTypes = {
    customization: PropTypes.shape({
        primaryColor: PropTypes.string,
        fontFamily: PropTypes.string,
        fontSize: PropTypes.string,
        lineHeight: PropTypes.string,
    }).isRequired,
    onCustomizationChange: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default ThemeCustomizer;
export { DEFAULT_CUSTOMIZATION, COLOR_PRESETS, FONT_OPTIONS };
