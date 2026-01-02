import { useState, useEffect, useCallback } from 'react';
import { FileText, Trash2, Eye, Download, Clock, CheckCircle, XCircle, Loader, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { cvApi } from '../services/api';

// Format date helper
const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Get status badge
const StatusBadge = ({ status }) => {
    const statusConfig = {
        parsed: { icon: CheckCircle, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', text: 'Parsed' },
        optimized: { icon: Sparkles, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', text: 'Optimized' },
        processing: { icon: Loader, color: '#6366F1', bg: 'rgba(99, 102, 241, 0.1)', text: 'Processing' },
        pending: { icon: Clock, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', text: 'Pending' },
        failed: { icon: XCircle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', text: 'Failed' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '500',
            color: config.color,
            backgroundColor: config.bg,
        }}>
            <Icon size={12} className={status === 'processing' ? 'animate-spin' : ''} />
            {config.text}
        </span>
    );
};

// Single CV Card
const CVCard = ({ cv, onView, onDelete, onDownload }) => {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async (e) => {
        e.stopPropagation();
        if (!window.confirm('Are you sure you want to delete this CV?')) return;

        setDeleting(true);
        try {
            await onDelete(cv.id);
        } catch (err) {
            console.error('Delete failed:', err);
        }
        setDeleting(false);
    };

    const getTitle = () => {
        if (cv.title) return cv.title;
        if (cv.content?.personalInfo) {
            const { firstName, lastName } = cv.content.personalInfo;
            if (firstName || lastName) return `${firstName || ''} ${lastName || ''}`.trim();
        }
        return 'Untitled CV';
    };

    return (
        <div style={styles.card} onClick={() => onView(cv)}>
            {/* Card Header */}
            <div style={styles.cardHeader}>
                <div style={styles.cardIcon}>
                    <FileText size={24} />
                </div>
                <div style={styles.cardMeta}>
                    <StatusBadge status={cv.parsingStatus || 'pending'} />
                </div>
            </div>

            {/* Card Body */}
            <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{getTitle()}</h3>
                <p style={styles.cardDate}>
                    <Clock size={12} style={{ marginRight: '4px' }} />
                    {formatDate(cv.createdAt)}
                </p>
                {cv.parsingMetadata?.fileType && (
                    <span style={styles.fileType}>{cv.parsingMetadata.fileType.toUpperCase()}</span>
                )}
            </div>

            {/* Card Actions */}
            <div style={styles.cardActions}>
                <button
                    style={{ ...styles.actionBtn, ...styles.viewBtn }}
                    onClick={(e) => { e.stopPropagation(); onView(cv); }}
                    title="View CV"
                >
                    <Eye size={16} />
                </button>
                {(cv.parsingStatus === 'parsed' || cv.parsingStatus === 'optimized') && (
                    <button
                        style={{ ...styles.actionBtn, ...styles.downloadBtn }}
                        onClick={(e) => { e.stopPropagation(); onDownload(cv); }}
                        title="Download CV"
                    >
                        <Download size={16} />
                    </button>
                )}
                <button
                    style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                    onClick={handleDelete}
                    disabled={deleting}
                    title="Delete CV"
                >
                    {deleting ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
            </div>
        </div>
    );
};

// Main MyCVs Component
function MyCVs({ onViewCV }) {
    const [cvs, setCVs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchCVs = useCallback(async () => {
        try {
            setError(null);
            const data = await cvApi.getUserCVs({ limit: 50, sort: '-createdAt' });
            setCVs(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchCVs();
    }, [fetchCVs]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCVs();
    };

    const handleDelete = async (cvId) => {
        try {
            await cvApi.deleteCV(cvId);
            setCVs(prev => prev.filter(cv => cv.id !== cvId));
        } catch (err) {
            alert('Failed to delete CV: ' + err.message);
        }
    };

    const handleView = (cv) => {
        if (onViewCV) onViewCV(cv);
    };

    const handleDownload = async (cv) => {
        try {
            await cvApi.downloadCV(cv.id, 'pdf', { templateId: 'modern' });
        } catch (err) {
            alert('Download failed: ' + err.message);
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.loadingState}>
                    <Loader size={32} className="animate-spin" style={{ color: '#6366F1' }} />
                    <p>Loading your CVs...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <div style={styles.header}>
                <div>
                    <h2 style={styles.headerTitle}>My CVs</h2>
                    <p style={styles.headerSubtitle}>{cvs.length} CV{cvs.length !== 1 ? 's' : ''} uploaded</p>
                </div>
                <button
                    style={styles.refreshBtn}
                    onClick={handleRefresh}
                    disabled={refreshing}
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Error State */}
            {error && (
                <div style={styles.errorState}>
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            {/* Empty State */}
            {cvs.length === 0 && !error && (
                <div style={styles.emptyState}>
                    <FileText size={48} style={{ color: '#9CA3AF' }} />
                    <h3>No CVs yet</h3>
                    <p>Upload your first CV to get started</p>
                </div>
            )}

            {/* CV Grid */}
            {cvs.length > 0 && (
                <div style={styles.grid}>
                    {cvs.map(cv => (
                        <CVCard
                            key={cv.id}
                            cv={cv}
                            onView={handleView}
                            onDelete={handleDelete}
                            onDownload={handleDownload}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Styles
const styles = {
    container: {
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
    },
    headerTitle: {
        fontSize: '24px',
        fontWeight: '600',
        color: '#111827',
        margin: 0,
    },
    headerSubtitle: {
        fontSize: '14px',
        color: '#6B7280',
        margin: '4px 0 0 0',
    },
    refreshBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        background: 'white',
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        transition: 'all 0.2s',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '20px',
    },
    card: {
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #E5E7EB',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '16px 16px 12px',
        background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
    },
    cardIcon: {
        width: '44px',
        height: '44px',
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
    },
    cardMeta: {},
    cardBody: {
        padding: '16px',
    },
    cardTitle: {
        fontSize: '16px',
        fontWeight: '600',
        color: '#111827',
        margin: '0 0 8px 0',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    cardDate: {
        fontSize: '13px',
        color: '#6B7280',
        margin: 0,
        display: 'flex',
        alignItems: 'center',
    },
    fileType: {
        display: 'inline-block',
        marginTop: '8px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#6366F1',
        background: 'rgba(99, 102, 241, 0.1)',
        borderRadius: '4px',
    },
    cardActions: {
        display: 'flex',
        gap: '8px',
        padding: '12px 16px',
        borderTop: '1px solid #F3F4F6',
        background: '#FAFAFA',
    },
    actionBtn: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    viewBtn: {
        background: '#EEF2FF',
        color: '#4F46E5',
    },
    downloadBtn: {
        background: '#ECFDF5',
        color: '#059669',
    },
    deleteBtn: {
        background: '#FEF2F2',
        color: '#DC2626',
    },
    loadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        gap: '16px',
        color: '#6B7280',
    },
    emptyState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px',
        gap: '12px',
        textAlign: 'center',
        color: '#6B7280',
    },
    errorState: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 16px',
        background: '#FEF2F2',
        borderRadius: '8px',
        color: '#DC2626',
        marginBottom: '20px',
    },
};

export default MyCVs;
