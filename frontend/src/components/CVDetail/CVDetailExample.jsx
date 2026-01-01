import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Download, Loader } from 'lucide-react';
import { cvApi } from '../services/api';
import CVPreview from '../components/CVDetail/CVPreview';
import TemplateSelector from '../components/CVDetail/TemplateSelector';
import ThemeCustomizer, { DEFAULT_CUSTOMIZATION } from '../components/CVDetail/ThemeCustomizer';

/**
 * CV Detail Page - Integration Example
 * 
 * Shows how to integrate the preview, template selector, and customizer components
 * This serves as a reference for updating your existing CV detail page
 */
const CVDetailExample = () => {
    const { id } = useParams();
    const [cvData, setCvData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('modern');
    const [customization, setCustomization] = useState(DEFAULT_CUSTOMIZATION);

    useEffect(() => {
        const fetchCVData = async () => {
            try {
                setLoading(true);
                const response = await cvApi.getCV(id);
                const cvInfo = response?.data || response;
                setCvData(cvInfo);
            } catch (error) {
                console.error('Failed to fetch CV:', error);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchCVData();
        }
    }, [id]);

    const handleDownload = async (format = 'pdf') => {
        try {
            setDownloading(true);
            await cvApi.downloadCV(id, format, {
                templateId: selectedTemplate,
                customization: {
                    primaryColor: customization.primaryColor,
                    fontFamily: customization.fontFamily,
                },
            });
        } catch (error) {
            console.error('Download failed:', error);
            alert(`Failed to download CV: ${error.message}`);
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="cv-detail--loading">
                <Loader className="spinner" size={48} />
                <p>Loading CV preview...</p>
            </div>
        );
    }

    const cvContent = cvData?.content || cvData;
    if (!cvContent || (!cvContent.personalInfo && !cvContent.personal && !cvContent.workExperience && !cvContent.experience)) {
        return (
            <div className="cv-detail--error">
                <p>CV data not available. Please ensure the CV has been processed.</p>
            </div>
        );
    }

    return (
        <div className="cv-detail">
            {/* Left Sidebar - Controls */}
            <aside className="cv-detail__sidebar">
                {/* Template Selector */}
                <TemplateSelector
                    selectedTemplate={selectedTemplate}
                    onTemplateSelect={setSelectedTemplate}
                />

                {/* Theme Customizer */}
                <ThemeCustomizer
                    customization={customization}
                    onCustomizationChange={setCustomization}
                />

                {/* Download Button */}
                <button
                    className="download-btn"
                    onClick={() => handleDownload('pdf')}
                    disabled={downloading}
                >
                    {downloading ? (
                        <>
                            <Loader className="spinner" size={20} />
                            Generating PDF...
                        </>
                    ) : (
                        <>
                            <Download size={20} />
                            Download PDF
                        </>
                    )}
                </button>
            </aside>

            {/* Right Side - Preview */}
            <main className="cv-detail__preview-area">
                <div className="preview-header">
                    <h2>Preview</h2>
                    <p className="preview-hint">
                        Changes are applied instantly. Download when you're satisfied with the result.
                    </p>
                </div>

                <CVPreview
                    cvData={cvContent}
                    templateId={selectedTemplate}
                    customization={customization}
                />
            </main>

            <style jsx>{`
        .cv-detail {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 2rem;
          max-width: 1600px;
          margin: 0 auto;
          padding: 2rem;
          min-height: calc(100vh - 80px);
        }

        .cv-detail__sidebar {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          height: fit-content;
          position: sticky;
          top: 2rem;
        }

        .cv-detail__preview-area {
          background: #f9fafb;
          padding: 2rem;
          border-radius: 12px;
        }

        .preview-header {
          margin-bottom: 2rem;
        }

        .preview-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.5rem;
        }

        .preview-hint {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .cv-preview__container {
          display: flex;
          justify-content: center;
          align-items: flex-start;
        }

        .cv-preview__paper {
          background: white;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
          border-radius: 4px;
          max-width: 8.5in;
          width: 100%;
        }

        .download-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.875rem 1.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
        }

        .download-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 8px rgba(59, 130, 246, 0.3);
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        }

        .download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .cv-detail--loading,
        .cv-detail--error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
          color: #6b7280;
        }

        @media (max-width: 1024px) {
          .cv-detail {
            grid-template-columns: 1fr;
          }

          .cv-detail__sidebar {
            position: relative;
            top: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default CVDetailExample;
