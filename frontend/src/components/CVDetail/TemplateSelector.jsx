import React from 'react';
import PropTypes from 'prop-types';
import { FileText, Palette, Minimize2 } from 'lucide-react';

// Template metadata (matching backend TemplateService)
const TEMPLATES = [
    {
        id: 'modern',
        name: 'Modern',
        description: 'Clean two-column layout with accent colors',
        atsScore: 95,
        icon: Palette,
        available: true,
    },
    {
        id: 'professional',
        name: 'Professional',
        description: 'Traditional single-column corporate style',
        atsScore: 98,
        icon: FileText,
        available: false, // Not yet implemented
    },
    {
        id: 'minimal',
        name: 'Minimal',
        description: 'Simple text-focused design',
        atsScore: 100,
        icon: Minimize2,
        available: false, // Not yet implemented
    },
];

/**
 * Template Selector Component
 * 
 * Allows user to select from available CV templates
 */
const TemplateSelector = ({ selectedTemplate, onTemplateSelect, className }) => {
    return (
        <div className={`template-selector ${className ? className : ''}`}>
            <h3 className="template-selector__title">Choose Template</h3>
            <div className="template-selector__grid">
                {TEMPLATES.map((template) => {
                    const Icon = template.icon;
                    const isSelected = selectedTemplate === template.id;
                    const isAvailable = template.available;

                    return (
                        <button
                            key={template.id}
                            className={`template-card ${isSelected ? 'template-card--selected' : ''} ${!isAvailable ? 'template-card--disabled' : ''
                                }`}
                            onClick={() => isAvailable && onTemplateSelect(template.id)}
                            disabled={!isAvailable}
                        >
                            <div className="template-card__icon">
                                <Icon size={24} />
                            </div>
                            <div className="template-card__content">
                                <h4 className="template-card__name">{template.name}</h4>
                                <p className="template-card__description">{template.description}</p>
                                <div className="template-card__footer">
                                    <span className="template-card__ats">
                                        ATS Score: {template.atsScore}%
                                    </span>
                                    {!isAvailable && (
                                        <span className="template-card__badge">Coming Soon</span>
                                    )}
                                </div>
                            </div>
                            {isSelected && (
                                <div className="template-card__checkmark">✓</div>
                            )}
                        </button>
                    );
                })}
            </div>

            <style jsx>{`
        .template-selector {
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .template-selector__title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1f2937;
        }

        .template-selector__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 1rem;
        }

        .template-card {
          position: relative;
          padding: 1.5rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .template-card:hover:not(.template-card--disabled) {
          border-color: #3b82f6;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
        }

        .template-card--selected {
          border-color: #3b82f6;
          background: #eff6ff;
        }

        .template-card--disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .template-card__icon {
          color: #6b7280;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: #f3f4f6;
          border-radius: 8px;
        }

        .template-card--selected .template-card__icon {
          color: #3b82f6;
          background: #dbeafe;
        }

        .template-card__content {
          flex: 1;
        }

        .template-card__name {
          font-size: 1rem;
          font-weight: 600;
          margin-bottom: 0.25rem;
          color: #111827;
        }

        .template-card__description {
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .template-card__footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
        }

        .template-card__ats {
          color: #059669;
          font-weight: 500;
        }

        .template-card__badge {
          padding: 0.25rem 0.5rem;
          background: #fef3c7;
          color: #92400e;
          border-radius: 4px;
          font-weight: 500;
        }

        .template-card__checkmark {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 24px;
          height: 24px;
          background: #3b82f6;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 0.875rem;
        }
      `}</style>
        </div>
    );
};

TemplateSelector.propTypes = {
    selectedTemplate: PropTypes.string.isRequired,
    onTemplateSelect: PropTypes.func.isRequired,
    className: PropTypes.string,
};

export default TemplateSelector;
export { TEMPLATES };
