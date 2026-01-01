import React from 'react';
import PropTypes from 'prop-types';

/**
 * Error Boundary Component
 * 
 * Catches errors in child components and displays fallback UI
 * Used to prevent CV preview crashes from breaking the entire page
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('CV Preview Error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                this.props.fallback || (
                    <div style={styles.errorContainer}>
                        <div style={styles.errorIcon}>⚠️</div>
                        <h3 style={styles.errorTitle}>Preview Failed to Load</h3>
                        <p style={styles.errorMessage}>
                            There was an error rendering the CV preview. Please try refreshing the page.
                        </p>
                        {this.props.onRetry && (
                            <button
                                style={styles.retryButton}
                                onClick={() => {
                                    this.setState({ hasError: false, error: null });
                                    this.props.onRetry();
                                }}
                            >
                                Try Again
                            </button>
                        )}
                    </div>
                )
            );
        }

        return this.props.children;
    }
}

const styles = {
    errorContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        background: '#fef2f2',
        border: '2px dashed #ef4444',
        borderRadius: '8px',
        textAlign: 'center',
    },
    errorIcon: {
        fontSize: '3rem',
        marginBottom: '1rem',
    },
    errorTitle: {
        color: '#dc2626',
        marginBottom: '0.5rem',
    },
    errorMessage: {
        color: '#991b1b',
        marginBottom: '1rem',
    },
    retryButton: {
        padding: '0.5rem 1rem',
        background: '#dc2626',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.875rem',
        fontWeight: 500,
    },
};

ErrorBoundary.propTypes = {
    children: PropTypes.node.isRequired,
    fallback: PropTypes.node,
    onRetry: PropTypes.func,
};

export default ErrorBoundary;
