import { useState } from 'react';
import { Download, Loader, Layout } from 'lucide-react';
import { cvApi } from '../services/api';

// Import all templates
import ProfessionalTemplate from './templates/ProfessionalTemplate';
import MinimalTemplate from './templates/MinimalTemplate';

// --- Template Options ---
const TEMPLATE_OPTIONS = [
  { id: 'modern', name: 'Modern', description: 'Clean and contemporary design' },
  { id: 'professional', name: 'Professional', description: 'Traditional serif style' },
  { id: 'minimal', name: 'Minimal', description: 'Simple and elegant' },
];

// --- Helpers ---
const formatDate = (dateString) => {
  if (!dateString) return 'Present';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const join = (arr, separator) => {
  if (!Array.isArray(arr)) return '';
  return arr
    .map(item => {
      if (typeof item === 'string') return item;
      return item.name ? item.name : item.skill ? item.skill : JSON.stringify(item);
    })
    .join(separator);
};

// --- Modern Template Renderer (React Version of modern.hbs) ---
const ModernTemplate = ({ data, customization }) => {
  const { primaryColor, fontFamily } = customization;

  const styles = {
    container: {
      fontFamily: fontFamily,
      color: '#1f2937',
      lineHeight: '1.5',
      maxWidth: '8.5in',
      margin: '0 auto',
      padding: '48px',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      minHeight: '11in',
    },
    header: {
      textAlign: 'center',
      marginBottom: '20pt',
      paddingBottom: '12pt',
      borderBottom: `3px solid ${primaryColor}`,
    },
    h1: {
      fontSize: '28pt',
      fontWeight: '600',
      color: '#111827',
      marginBottom: '4pt',
      lineHeight: '1.2',
    },
    headerTitle: {
      fontSize: '10pt',
      color: '#6b7280',
      fontWeight: '400',
      marginBottom: '8pt',
    },
    headerContact: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '12pt',
      fontSize: '10pt',
      color: '#4b5563',
      marginTop: '8pt',
    },
    section: {
      marginBottom: '16pt',
    },
    h2: {
      fontSize: '14pt',
      color: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginTop: '16pt',
      marginBottom: '8pt',
      paddingBottom: '4pt',
      borderBottom: `2px solid ${primaryColor}`,
      fontWeight: '600',
    },
    h3: {
      fontSize: '12pt',
      color: '#374151',
      marginTop: '8pt',
      marginBottom: '4pt',
      fontWeight: '600',
    },
    itemHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: '4pt',
    },
    subtitle: {
      color: '#6b7280',
      fontSize: '10pt',
    },
    date: {
      color: '#6b7280',
      fontSize: '10pt',
      fontStyle: 'italic',
    },
    list: {
      marginLeft: '16pt',
      marginTop: '4pt',
      color: '#374151',
    },
    listItem: {
      marginBottom: '2pt',
    },
    summary: {
      marginBottom: '16pt',
      padding: '12pt',
      backgroundColor: '#f9fafb',
      borderLeft: `3px solid ${primaryColor}`,
      color: '#374151',
    },
    link: {
      color: primaryColor,
      textDecoration: 'none',
    },
    skillsCategory: {
      marginBottom: '8pt',
    },
    skillsName: {
      fontWeight: '600',
      color: '#374151',
      marginBottom: '2pt',
    },
    skillsList: {
      color: '#4b5563',
    }
  };

  const getFullName = () => {
    if (!data.personalInfo) return '';
    return [data.personalInfo.firstName, data.personalInfo.lastName].filter(Boolean).join(' ');
  };

  const getLink = (label) => {
    if (!data.personalInfo?.links) return null;
    return data.personalInfo.links.find(l => l.label.toLowerCase() === label.toLowerCase())?.url;
  };

  const splitDescription = (desc) => {
    if (!desc) return [];
    return desc.split('\n').filter(line => line.trim().length > 0);
  };

  return (
    <div style={styles.container}>
      {/* HEADER */}
      <header style={styles.header}>
        <h1 style={styles.h1}>{getFullName()}</h1>
        {data.title && (
          <div style={styles.headerTitle}>{data.title}</div>
        )}
        <div style={styles.headerContact}>
          {data.personalInfo?.email && <span>{data.personalInfo.email}</span>}
          {data.personalInfo?.phone && <span>{data.personalInfo.phone}</span>}
          {data.personalInfo?.country && <span>{data.personalInfo.country}</span>}
          {getLink('LinkedIn') && (
            <span><a href={getLink('LinkedIn')} style={styles.link}>LinkedIn</a></span>
          )}
          {getLink('GitHub') && (
            <span><a href={getLink('GitHub')} style={styles.link}>GitHub</a></span>
          )}
          {getLink('Website') && (
            <span><a href={getLink('Website')} style={styles.link}>Website</a></span>
          )}
        </div>
      </header>

      {/* SUMMARY */}
      {data.professionalSummary && (
        <section style={styles.summary}>
          <p>{data.professionalSummary}</p>
        </section>
      )}

      {/* EXPERIENCE */}
      {data.workExperience && data.workExperience.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Experience</h2>
          {data.workExperience.map((exp, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={styles.itemHeader}>
                <div>
                  <h3 style={styles.h3}>{exp.title}</h3>
                  <div style={styles.subtitle}>
                    {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                  </div>
                </div>
                <div style={styles.date}>
                  {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                </div>
              </div>
              {exp.description && (
                <ul style={styles.list}>
                  {splitDescription(exp.description).map((bullet, j) => (
                    <li key={j} style={styles.listItem}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* EDUCATION */}
      {data.education && data.education.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Education</h2>
          {data.education.map((edu, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={styles.itemHeader}>
                <div>
                  <h3 style={styles.h3}>
                    {edu.degree}
                  </h3>
                  <div style={styles.subtitle}>
                    {edu.institution}{edu.location ? ` • ${edu.location}` : ''}
                  </div>
                </div>
                <div style={styles.date}>
                  {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                </div>
              </div>
              {edu.description && (
                <ul style={styles.list}>
                  {splitDescription(edu.description).map((bullet, j) => (
                    <li key={j} style={styles.listItem}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </section>
      )}

      {/* SKILLS */}
      {data.skills && data.skills.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Skills</h2>
          {data.skills.map((categoryObj, i) => (
            <div key={i} style={styles.skillsCategory}>
              <div style={styles.skillsName}>{categoryObj.category}</div>
              <div style={styles.skillsList}>{join(categoryObj.skills, ', ')}</div>
            </div>
          ))}
        </section>
      )}

      {/* PROJECTS */}
      {data.projects && data.projects.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Projects</h2>
          {data.projects.map((proj, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <h3 style={styles.h3}>{proj.title}</h3>
              {proj.description && (
                <div style={{ marginTop: '4pt', color: '#374151' }}>{proj.description}</div>
              )}
              {proj.technologies && proj.technologies.length > 0 && (
                <div style={{ marginTop: '4pt', color: '#374151' }}>
                  <strong>Technologies:</strong> {join(proj.technologies, ', ')}
                </div>
              )}
              {proj.url && (
                <div style={{ marginTop: '4pt' }}>
                  <a href={proj.url} style={styles.link}>{proj.url}</a>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* CERTIFICATIONS */}
      {data.certifications && data.certifications.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Certifications</h2>
          {data.certifications.map((cert, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={styles.itemHeader}>
                <h3 style={styles.h3}>{cert.name}</h3>
                {cert.startDate && <div style={styles.date}>{formatDate(cert.startDate)}</div>}
              </div>
              {cert.company && (
                <div style={styles.subtitle}>{cert.company}</div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* PUBLICATIONS */}
      {data.publications && data.publications.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Publications</h2>
          {data.publications.map((pub, i) => (
            <div key={i} style={{ marginBottom: '12pt' }}>
              <div style={styles.itemHeader}>
                <h3 style={styles.h3}>{pub.title}</h3>
                {pub.date && <div style={styles.date}>{formatDate(pub.date)}</div>}
              </div>
              {pub.publisher && (
                <div style={styles.subtitle}>{pub.publisher}</div>
              )}
              {pub.description && (
                <div style={{ marginTop: '4pt', color: '#374151' }}>{pub.description}</div>
              )}
              {pub.url && (
                <div style={{ marginTop: '4pt' }}>
                  <a href={pub.url} style={styles.link}>{pub.url}</a>
                </div>
              )}
            </div>
          ))}
        </section>
      )}

      {/* LANGUAGES */}
      {data.languages && data.languages.length > 0 && (
        <section style={styles.section}>
          <h2 style={styles.h2}>Languages</h2>
          {data.languages.map((lang, i) => (
            <div key={i} style={styles.skillsCategory}>
              <span style={styles.skillsName}>{lang.name}:</span> <span style={{ color: '#4b5563' }}>{lang.proficiency}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

// --- Main Component ---
function CVPreview({ cvId, data, primaryColor }) {
  const [downloading, setDownloading] = useState({ pdf: false, docx: false });
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');

  const handleDownload = async (format) => {
    setDownloading((prev) => ({ ...prev, [format]: true }));
    setError(null);
    try {
      await cvApi.downloadCV(cvId, format, {
        templateId: selectedTemplate,
        customization: { primaryColor }
      });
    } catch (err) {
      setError(`Download failed: ${err.message}`);
    } finally {
      setDownloading((prev) => ({ ...prev, [format]: false }));
    }
  };

  // Render the appropriate template based on selection
  const renderTemplate = () => {
    const customization = { primaryColor, fontFamily: "'Helvetica', 'Arial', sans-serif" };

    switch (selectedTemplate) {
      case 'professional':
        return <ProfessionalTemplate data={data} />;
      case 'minimal':
        return <MinimalTemplate data={data} />;
      case 'modern':
      default:
        return <ModernTemplate data={data} customization={customization} />;
    }
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="cv-preview-container">
      {/* Download Controls */}
      <div className="download-bar">
        <div className="download-bar-content">
          <div className="preview-info">
            <span className="preview-label">CV Preview (Live)</span>
          </div>

          {/* Template Selector */}
          <div className="template-selector">
            <Layout size={16} className="template-icon" />
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="template-select"
            >
              {TEMPLATE_OPTIONS.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          <div className="download-buttons">
            <button
              onClick={() => handleDownload('pdf')}
              disabled={downloading.pdf}
              className="download-btn pdf"
            >
              {downloading.pdf ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloading.pdf ? 'Generating...' : 'Download PDF'}
            </button>
            <button
              onClick={() => handleDownload('docx')}
              disabled={downloading.docx}
              className="download-btn docx"
            >
              {downloading.docx ? (
                <Loader size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {downloading.docx ? 'Generating...' : 'Download DOCX'}
            </button>
          </div>
        </div>
        {error && <div className="download-error">{error}</div>}
      </div>

      {/* Frontend Rendered Template */}
      <div className="preview-scroll-area">
        <div className="preview-paper-wrapper">
          {renderTemplate()}
        </div>
      </div>

      <style>{`
        .cv-preview-container {
          background: #e5e7eb;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 800px;
        }

        .download-bar {
          background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
          padding: 16px 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          z-index: 10;
        }

        .download-bar-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
        }

        .preview-label {
          color: #a0a0b0;
          font-size: 14px;
          font-weight: 500;
        }

        .template-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 12px;
          border-radius: 8px;
        }

        .template-icon {
          color: #a0a0b0;
        }

        .template-select {
          background: transparent;
          border: none;
          color: white;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          outline: none;
          padding: 4px 8px;
        }

        .template-select option {
          background: #1e1e2e;
          color: white;
        }

        .download-buttons {
          display: flex;
          gap: 12px;
        }

        .download-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .download-btn.pdf {
          background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%);
          color: white;
        }

        .download-btn.pdf:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);
        }

         .download-btn.docx {
            background: linear-gradient(135deg, #059669 0%, #10B981 100%);
            color: white;
        }

        .download-btn.docx:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
        }

        .download-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .download-error {
          color: #f87171;
          font-size: 13px;
          margin-top: 8px;
        }

        .preview-scroll-area {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 40px;
          display: flex;
          justify-content: center;
        }

        .preview-paper-wrapper {
          width: 8.5in;
          min-height: 11in;
          background: white;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          transform-origin: top center;
        }
        
        /* Mobile Scale */
        @media (max-width: 900px) {
            .preview-paper-wrapper {
                transform: scale(0.8);
                margin-top: -50px; 
            }
            .download-bar-content {
                flex-direction: column;
                align-items: stretch;
            }
            .template-selector {
                justify-content: center;
            }
            .download-buttons {
                justify-content: center;
            }
        }
        
        @media (max-width: 600px) {
            .preview-paper-wrapper {
                transform: scale(0.5);
                margin-top: -200px;
            }
            .preview-scroll-area {
                padding: 10px;
            }
        }
      `}</style>
    </div>
  );
}

export default CVPreview;
