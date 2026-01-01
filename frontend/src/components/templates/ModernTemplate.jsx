import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { formatDate, joinArray } from '../../utils/cvHelpers';

/**
 * Modern CV Template - React Component
 * 
 * Visually identical to backend/src/templates/cv/modern.hbs
 * Clean two-column layout with accent colors
 */
const ModernTemplate = ({ cvData, customization }) => {
    // Default customization values (matching backend TemplateService)
    const theme = {
        primaryColor: customization.primaryColor,
        fontFamily: customization.fontFamily,
        fontSize: customization.fontSize,
        lineHeight: customization.lineHeight,
    };

    // Memoize styles to prevent recalculation on every render
    const styles = useMemo(() => ({
        container: {
            maxWidth: '8.5in',
            margin: '0 auto',
            padding: '0.5in',
            fontFamily: theme.fontFamily,
            fontSize: theme.fontSize,
            lineHeight: theme.lineHeight,
            color: '#1f2937',
            background: 'white',
        },
        header: {
            textAlign: 'center',
            marginBottom: '20pt',
            paddingBottom: '12pt',
            borderBottom: `3px solid ${theme.primaryColor}`,
        },
        headerTitle: {
            fontSize: '28pt',
            fontWeight: 600,
            color: '#111827',
            marginBottom: '4pt',
            lineHeight: 1.2,
        },
        headerSubtitle: {
            fontSize: '10pt',
            color: '#6b7280',
            fontWeight: 400,
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
        summary: {
            marginBottom: '16pt',
            padding: '12pt',
            background: '#f9fafb',
            borderLeft: `3px solid ${theme.primaryColor}`,
        },
        sectionTitle: {
            fontSize: '14pt',
            fontWeight: 600,
            color: theme.primaryColor,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginTop: '16pt',
            marginBottom: '8pt',
            paddingBottom: '4pt',
            borderBottom: `2px solid ${theme.primaryColor}`,
        },
        sectionItem: {
            marginBottom: '12pt',
        },
        sectionItemHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: '4pt',
        },
        sectionItemTitle: {
            fontSize: '12pt',
            fontWeight: 600,
            color: '#111827',
        },
        sectionItemSubtitle: {
            color: '#6b7280',
            fontSize: '10pt',
        },
        sectionItemDate: {
            color: '#6b7280',
            fontSize: '10pt',
            fontStyle: 'italic',
        },
        sectionItemDescription: {
            marginTop: '4pt',
            color: '#374151',
        },
        bulletList: {
            marginLeft: '16pt',
            marginTop: '4pt',
        },
        bulletItem: {
            marginBottom: '2pt',
        },
        skillsCategory: {
            marginBottom: '8pt',
        },
        skillsCategoryName: {
            fontWeight: 600,
            color: '#374151',
            marginBottom: '2pt',
        },
        skillsList: {
            color: '#4b5563',
        },
        link: {
            color: theme.primaryColor,
            textDecoration: 'none',
        },
    }), [theme.primaryColor, theme.fontFamily, theme.fontSize, theme.lineHeight]);

    // Format helpers
    const getFullName = () => {
        if (!cvData.personalInfo) return '';
        return [cvData.personalInfo.firstName, cvData.personalInfo.lastName].filter(Boolean).join(' ');
    };

    const getLink = (label) => {
        if (!cvData.personalInfo?.links) return null;
        return cvData.personalInfo.links.find(l => l.label.toLowerCase() === label.toLowerCase())?.url;
    };

    const splitDescription = (desc) => {
        if (!desc) return [];
        return desc.split('\n').filter(line => line.trim().length > 0);
    };

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <header style={styles.header}>
                <h1 style={styles.headerTitle}>{getFullName()}</h1>
                {cvData.title && (
                    <div style={styles.headerSubtitle}>{cvData.title}</div>
                )}
                <div style={styles.headerContact}>
                    {cvData.personalInfo?.email && <span>{cvData.personalInfo.email}</span>}
                    {cvData.personalInfo?.phone && <span>{cvData.personalInfo.phone}</span>}
                    {cvData.personalInfo?.country && <span>{cvData.personalInfo.country}</span>}
                    {getLink('LinkedIn') && (
                        <span>
                            <a href={getLink('LinkedIn')} style={styles.link}>
                                LinkedIn
                            </a>
                        </span>
                    )}
                    {getLink('Website') && (
                        <span>
                            <a href={getLink('Website')} style={styles.link}>
                                Website
                            </a>
                        </span>
                    )}
                    {getLink('Portfolio') && (
                        <span>
                            <a href={getLink('Portfolio')} style={styles.link}>
                                Portfolio
                            </a>
                        </span>
                    )}
                </div>
            </header>

            {/* SUMMARY */}
            {cvData.professionalSummary && (
                <section style={styles.summary}>
                    <p style={{ margin: 0 }}>{cvData.professionalSummary}</p>
                </section>
            )}

            {/* EXPERIENCE */}
            {cvData.workExperience && cvData.workExperience.length > 0 && (
                <section>
                    <h2 style={styles.sectionTitle}>Experience</h2>
                    {cvData.workExperience.map((exp, index) => (
                        <div key={index} style={styles.sectionItem}>
                            <div style={styles.sectionItemHeader}>
                                <div>
                                    <h3 style={styles.sectionItemTitle}>{exp.title}</h3>
                                    <div style={styles.sectionItemSubtitle}>
                                        {exp.company}
                                        {exp.location && ` • ${exp.location}`}
                                    </div>
                                </div>
                                <div style={styles.sectionItemDate}>
                                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                                </div>
                            </div>
                            {exp.description && (
                                <div style={styles.sectionItemDescription}>
                                    <ul style={styles.bulletList}>
                                        {splitDescription(exp.description).map((resp, idx) => (
                                            <li key={idx} style={styles.bulletItem}>
                                                {resp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* EDUCATION */}
            {cvData.education && cvData.education.length > 0 && (
                <section>
                    <h2 style={styles.sectionTitle}>Education</h2>
                    {cvData.education.map((edu, index) => (
                        <div key={index} style={styles.sectionItem}>
                            <div style={styles.sectionItemHeader}>
                                <div>
                                    <h3 style={styles.sectionItemTitle}>
                                        {edu.degree}
                                    </h3>
                                    <div style={styles.sectionItemSubtitle}>
                                        {edu.institution}
                                        {edu.location && ` • ${edu.location}`}
                                    </div>
                                </div>
                                <div style={styles.sectionItemDate}>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                </div>
                            </div>
                            {edu.description && (
                                <div style={styles.sectionItemDescription}>
                                    <ul style={styles.bulletList}>
                                        {splitDescription(edu.description).map((desc, idx) => (
                                            <li key={idx} style={styles.bulletItem}>
                                                {desc}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* SKILLS */}
            {cvData.skills && cvData.skills.length > 0 && (
                <section>
                    <h2 style={styles.sectionTitle}>Skills</h2>
                    {cvData.skills.map((categoryObj, index) => (
                        <div key={index} style={styles.skillsCategory}>
                            <div style={styles.skillsCategoryName}>{categoryObj.category}</div>
                            <div style={styles.skillsList}>
                                {joinArray(categoryObj.skills, ', ')}
                            </div>
                        </div>
                    ))}
                </section>
            )}

            {/* PROJECTS */}
            {cvData.projects && cvData.projects.length > 0 && (
                <section>
                    <h2 style={styles.sectionTitle}>Projects</h2>
                    {cvData.projects.map((project, index) => (
                        <div key={index} style={styles.sectionItem}>
                            <h3 style={styles.sectionItemTitle}>{project.title}</h3>
                            {project.description && (
                                <div style={styles.sectionItemDescription}>
                                    <p style={{ margin: 0 }}>{project.description}</p>
                                </div>
                            )}
                            {project.technologies && project.technologies.length > 0 && (
                                <div style={styles.sectionItemDescription}>
                                    <p style={{ margin: 0 }}>
                                        <strong>Technologies:</strong>{' '}
                                        {joinArray(project.technologies, ', ')}
                                    </p>
                                </div>
                            )}
                            {project.url && (
                                <div style={{ marginTop: '4pt' }}>
                                    <a href={project.url} style={styles.link}>{project.url}</a>
                                </div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* CERTIFICATIONS */}
            {cvData.certifications && cvData.certifications.length > 0 && (
                <section>
                    <h2 style={styles.sectionTitle}>Certifications</h2>
                    {cvData.certifications.map((cert, index) => (
                        <div key={index} style={styles.sectionItem}>
                            <div style={styles.sectionItemHeader}>
                                <h3 style={styles.sectionItemTitle}>{cert.name}</h3>
                                {cert.startDate && (
                                    <div style={styles.sectionItemDate}>
                                        {formatDate(cert.startDate)}
                                    </div>
                                )}
                            </div>
                            {cert.company && (
                                <div style={styles.sectionItemSubtitle}>{cert.company}</div>
                            )}
                        </div>
                    ))}
                </section>
            )}

            {/* LANGUAGES */}
            {cvData.languages && cvData.languages.length > 0 && (
                <section>
                    <h2 style={styles.sectionTitle}>Languages</h2>
                    {cvData.languages.map((lang, index) => (
                        <div key={index} style={styles.skillsCategory}>
                            <span style={styles.skillsCategoryName}>{lang.name}:</span>{' '}
                            {lang.proficiency}
                        </div>
                    ))}
                </section>
            )}
        </div>
    );
};

ModernTemplate.propTypes = {
    cvData: PropTypes.shape({
        title: PropTypes.string,
        template: PropTypes.string,
        personalInfo: PropTypes.shape({
            firstName: PropTypes.string,
            lastName: PropTypes.string,
            email: PropTypes.string,
            phone: PropTypes.string,
            country: PropTypes.string,
            links: PropTypes.arrayOf(PropTypes.shape({
                label: PropTypes.string,
                url: PropTypes.string,
            })),
        }),
        professionalSummary: PropTypes.string,
        workExperience: PropTypes.arrayOf(PropTypes.object),
        education: PropTypes.arrayOf(PropTypes.object),
        skills: PropTypes.arrayOf(PropTypes.shape({
            category: PropTypes.string,
            skills: PropTypes.arrayOf(PropTypes.string)
        })),
        projects: PropTypes.arrayOf(PropTypes.object),
        certifications: PropTypes.arrayOf(PropTypes.object),
        languages: PropTypes.arrayOf(PropTypes.object),
    }),
    customization: PropTypes.shape({
        primaryColor: PropTypes.string,
        fontFamily: PropTypes.string,
        fontSize: PropTypes.string,
        lineHeight: PropTypes.string,
    }),
};

export default ModernTemplate;
