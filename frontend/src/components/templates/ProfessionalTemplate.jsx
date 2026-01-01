// Professional CV Template - React Version
// Based on backend/src/templates/cv/professional.hbs

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

const ProfessionalTemplate = ({ data }) => {
    const styles = {
        container: {
            fontFamily: "'Times New Roman', serif",
            margin: 0,
            padding: '40px',
            color: '#111',
            lineHeight: '1.5',
            backgroundColor: 'white',
            minHeight: '11in',
        },
        header: {
            textAlign: 'center',
            marginBottom: '30px',
            borderBottom: '2px solid #111',
            paddingBottom: '20px',
        },
        name: {
            fontSize: '32px',
            fontWeight: 'bold',
            margin: '0 0 10px 0',
            textTransform: 'uppercase',
        },
        title: {
            fontSize: '18px',
            fontStyle: 'italic',
            marginBottom: '10px',
        },
        contact: {
            fontSize: '14px',
        },
        contactItem: {
            margin: '0 5px',
        },
        link: {
            color: '#111',
            textDecoration: 'none',
        },
        section: {
            marginBottom: '30px',
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            borderBottom: '1px solid #ddd',
            paddingBottom: '5px',
            marginBottom: '15px',
        },
        itemRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
        },
        itemMain: {
            fontWeight: 'bold',
            fontSize: '16px',
        },
        itemSub: {
            fontStyle: 'italic',
            fontSize: '15px',
        },
        itemDate: {
            fontSize: '14px',
        },
        description: {
            fontSize: '14px',
            marginTop: '5px',
            textAlign: 'justify',
        },
        skillsGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            fontSize: '14px',
        },
        skillCat: {
            fontWeight: 'bold',
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
                <div style={styles.name}>{getFullName()}</div>
                {data?.title && <div style={styles.title}>{data.title}</div>}
                <div style={styles.contact}>
                    {data?.personalInfo?.email && <span style={styles.contactItem}>{data.personalInfo.email}</span>}
                    {data?.personalInfo?.phone && <span style={styles.contactItem}>• {data.personalInfo.phone}</span>}
                    {data?.personalInfo?.country && <span style={styles.contactItem}>• {data.personalInfo.country}</span>}
                    {data?.personalInfo?.links?.map((link, i) => (
                        <span key={i} style={styles.contactItem}>
                            • <a href={link.url} target="_blank" rel="noreferrer" style={styles.link}>{link.label}</a>
                        </span>
                    ))}
                </div>
            </div>

            {/* PROFESSIONAL SUMMARY */}
            {data?.professionalSummary && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Professional Summary</div>
                    <div style={styles.description}>{data.professionalSummary}</div>
                </div>
            )}

            {/* EXPERIENCE */}
            {data?.workExperience?.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Experience</div>
                    {data.workExperience.map((exp, i) => (
                        <div key={i} style={{ marginBottom: '20px' }}>
                            <div style={styles.itemRow}>
                                <div style={styles.itemMain}>{exp.title}</div>
                                <div style={styles.itemDate}>
                                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                                </div>
                            </div>
                            <div style={styles.itemRow}>
                                <div style={styles.itemSub}>
                                    {exp.company}{exp.location ? `, ${exp.location}` : ''}
                                </div>
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

            {/* EDUCATION */}
            {data?.education?.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Education</div>
                    {data.education.map((edu, i) => (
                        <div key={i} style={{ marginBottom: '20px' }}>
                            <div style={styles.itemRow}>
                                <div style={styles.itemMain}>{edu.degree}</div>
                                <div style={styles.itemDate}>
                                    {formatDate(edu.startDate)} - {formatDate(edu.endDate)}
                                </div>
                            </div>
                            <div style={styles.itemRow}>
                                <div style={styles.itemSub}>{edu.institution}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* SKILLS */}
            {data?.skills?.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Key Skills</div>
                    <div style={styles.skillsGrid}>
                        {data.skills.map((cat, i) => (
                            <div key={i}>
                                <span style={styles.skillCat}>{cat.category}:</span> {join(cat.skills, ', ')}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* PROJECTS */}
            {data?.projects?.length > 0 && (
                <div style={styles.section}>
                    <div style={styles.sectionTitle}>Projects</div>
                    {data.projects.map((proj, i) => (
                        <div key={i} style={{ marginBottom: '20px' }}>
                            <div style={styles.itemRow}>
                                <div style={styles.itemMain}>
                                    {proj.title}
                                    {proj.url && (
                                        <a href={proj.url} style={{ fontWeight: 'normal', fontSize: '12px', marginLeft: '8px' }}>
                                            Link
                                        </a>
                                    )}
                                </div>
                            </div>
                            <div style={styles.description}>{proj.description}</div>
                            {proj.technologies?.length > 0 && (
                                <div style={{ ...styles.description, fontStyle: 'italic' }}>
                                    Tech: {join(proj.technologies, ', ')}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProfessionalTemplate;
