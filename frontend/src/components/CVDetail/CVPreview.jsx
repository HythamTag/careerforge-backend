import React from 'react';
import PropTypes from 'prop-types';
import ModernTemplate from '../templates/ModernTemplate';
import ErrorBoundary from '../common/ErrorBoundary';

/**
 * CV Preview Component
 * 
 * Renders live preview of CV using selected template
 * Updates instantly when customization changes
 */
const CVPreview = ({ cvData, templateId, customization, className }) => {
    // Render appropriate template based on templateId
    const renderTemplate = () => {
        switch (templateId) {
            case 'modern':
                return <ModernTemplate cvData={cvData} customization={customization} />;

            case 'professional':
                return <div>Professional template coming soon...</div>;

            case 'minimal':
                return <div>Minimal template coming soon...</div>;

            default:
                return <ModernTemplate cvData={cvData} customization={customization} />;
        }
    };

    return (
        <div className={`cv-preview ${className ? className : ''}`}>
            <div className="cv-preview__container">
                <ErrorBoundary fallback={
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#dc2626' }}>
                        Failed to render CV preview. Please check your CV data.
                    </div>
                }>
                    <div className="cv-preview__paper">
                        {renderTemplate()}
                    </div>
                </ErrorBoundary>
            </div>
        </div>
    );
};

CVPreview.propTypes = {
    cvData: PropTypes.object.isRequired,
    templateId: PropTypes.oneOf(['modern', 'professional', 'minimal']),
    customization: PropTypes.shape({
        primaryColor: PropTypes.string,
        fontFamily: PropTypes.string,
        fontSize: PropTypes.string,
        lineHeight: PropTypes.string,
    }),
    className: PropTypes.string,
};

CVPreview.defaultProps = {
    templateId: 'modern',
    customization: {},
};

export default CVPreview;
