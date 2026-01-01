// Minimal CV Template - React Version
// Based on backend/src/templates/cv/minimal.hbs

const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const join = (arr, separator) => {
    if (!Array.isArray(arr)) return '';
    return arr.map(item => {
        if (typeof item === 'string') return item;
        return item.name || item.skill || JSON.stringify(item);
    }).join(separator);
};

const MinimalTemplate = ({ data }) => {
    const styles = {
        container: {
            fontFamily: "'Helvetica', sans-serif",
            margin: 0,
            padding: '40px',
            lineHeight: '1.5',
            color: '#333',
            backgroundColor: 'white',
            minHeight: '11in',
        },
        header: {
            marginBottom: '40px',
            borderBottom: '1px solid #eee',
            paddingBottom: '20px',
        },
        name: {
            fontSize: '28px',
            marginBottom: '5px',
            fontWeight: '300',
            textTransform: 'uppercase',
            letterSpacing: '1px',
        },
        titleStyle: {
            fontSize: '16px',
            color: '#777',
        },
        contactInfo: {
            fontSize: '14px',
            color: '#666',
            marginTop: '10px',
        },
        contactItem: {
            display: 'inline-block',
            marginRight: '15px',
        },
        link: {
            color: '#666',
            textDecoration: 'none',
            borderBottom: '1px dotted #ccc',
        },
        section: {
            marginBottom: '35px',
        },
        sectionTitle: {
            fontSize: '16px',
            marginBottom: '15px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            color: '#222',
        },
        item: {
            marginBottom: '25px',
        },
        itemHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '5px',
        },
        itemTitle: {
            fontWeight: 'bold',
            fontSize: '15px',
        },
        itemSubtitle: {
            fontStyle: 'italic',
            color: '#555',
            fontSize: '14px',
        },
        itemDate: {
            color: '#888',
            fontSize: '13px',
        },
        description: {
            fontSize: '14px',
            color: '#444',
            marginTop: '5px',
        },
        skillGroup: {
            marginBottom: '10px',
        },
        skillCategory: {
            fontWeight: 'bold',
            fontSize: '14px',
            marginBottom: '3px',
            display: 'inline-block',
            minWidth: '120px',
        },
        skillList: {
            display: 'inline',
            fontSize: '14px',
            color: '#555',
        },
    };

    const getFullName = () => {
        if (!data?.personalInfo) return '';
        return [data.personalInfo.firstName, data.personalInfo.lastName].filter(Boolean).join(' ');
    };

    const splitDescription = (desc) => {
        if (!desc) return [];
        return desc.split('\n').filter(line => line.trim().length > 0);
    };

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <h1 style={styles.name}>{getFullName()}</h1>
                {data?.title && <div style={styles.titleStyle}>{data.title}</div>}
                <div style={styles.contactInfo}>
                    {data?.personalInfo?.email && <span style={styles.contactItem}>{data.personalInfo.email}</span>}
                    {data?.personalInfo?.phone && <span style={styles.contactItem}>{data.personalInfo.phone}</span>}
                    {data?.personalInfo?.country && <span style={styles.contactItem}>{data.personalInfo.country}</span>}
                    {data?.personalInfo?.links?.map((link, i) => (
                        <span key={i} style={styles.contactItem}>
                            <a href={link.url} target="_blank" rel="noreferrer" style={styles.link}>{link.label}</a>
                        </span>
                    ))}
                </div>
            </div>

            {/* SUMMARY */}
            {data?.professionalSummary && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Summary</h2>
                    <p style={{ fontSize: '14px', margin: 0 }}>{data.professionalSummary}</p>
                </div>
            )}

            {/* EXPERIENCE */}
            {data?.workExperience?.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Experience</h2>
                    {data.workExperience.map((exp, i) => (
                        <div key={i} style={styles.item}>
                            <div style={styles.itemHeader}>
                                <span style={styles.itemTitle}>{exp.title}</span>
                                <span style={styles.itemDate}>
                                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                                </span>
                            </div>
                            <div style={styles.itemSubtitle}>
                                {exp.company}{exp.location ? ` | ${exp.location}` : ''}
                            </div>
                            {exp.description && (
                                <div style={styles.description}>
                                    {splitDescription(exp.description).map((line, j) => (
                                        <div key={j}>{line}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* PROJECTS */}
            {data?.projects?.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Projects</h2>
                    {data.projects.map((proj, i) => (
                        <div key={i} style={styles.item}>
                            <div style={styles.itemHeader}>
                                <span style={styles.itemTitle}>
                                    {proj.title}
                                    {proj.url && (
                                        <a href={proj.url} style={{ fontSize: '12px', marginLeft: '10px', color: '#555' }} target="_blank" rel="noreferrer">
                                            [Link]
                                        </a>
                                    )}
                                </span>
                            </div>
                            <div style={styles.description}>{proj.description}</div>
                            {proj.technologies?.length > 0 && (
                                <div style={{ fontSize: '13px', color: '#666', marginTop: '3px' }}>
                                    Technologies: {join(proj.technologies, ', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* EDUCATION */}
            {data?.education?.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Education</h2>
                    {data.education.map((edu, i) => (
                        <div key={i} style={styles.item}>
                            <div style={styles.itemHeader}>
                                <span style={styles.itemTitle}>{edu.degree}</span>
                                <span style={styles.itemDate}>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                </span>
                            </div>
                            <div style={styles.itemSubtitle}>
                                {edu.institution}{edu.location ? ` | ${edu.location}` : ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SKILLS */}
            {data?.skills?.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Skills</h2>
                    {data.skills.map((cat, i) => (
                        <div key={i} style={styles.skillGroup}>
                            <span style={styles.skillCategory}>{cat.category}:</span>
                            <span style={styles.skillList}>{join(cat.skills, ', ')}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* CERTIFICATIONS */}
            {data?.certifications?.length > 0 && (
                <div style={styles.section}>
                    <h2 style={styles.sectionTitle}>Certifications</h2>
                    {data.certifications.map((cert, i) => (
                        <div key={i} style={{ marginBottom: '15px' }}>
                            <div style={styles.itemHeader}>
                                <span style={{ ...styles.itemTitle, fontSize: '14px' }}>{cert.name}</span>
                                <span style={styles.itemDate}>{formatDate(cert.startDate)}</span>
                            </div>
                            <div style={styles.itemSubtitle}>{cert.company}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MinimalTemplate;
