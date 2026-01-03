import { useState, useEffect, useCallback } from 'react';
import { History, CheckCircle, Clock, Loader, RefreshCw, ChevronRight, Info, AlertCircle, Sparkles } from 'lucide-react';
import { cvApi } from '../services/api';

function CVVersions({ cvId, onVersionActivated }) {
    const [versions, setVersions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activatingId, setActivatingId] = useState(null);
    const [error, setError] = useState(null);

    const fetchVersions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await cvApi.getCVVersions(cvId);
            // Backend returns { success: true, data: { versions: [], pagination: {} } }
            // Backend returns array of versions via api.js helper
            const data = response;
            setVersions(Array.isArray(data) ? data : data.versions || data.data || []);
        } catch (err) {
            console.error('Failed to fetch versions:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [cvId]);

    useEffect(() => {
        if (cvId) {
            fetchVersions();
        }
    }, [cvId, fetchVersions]);

    const handleActivate = async (versionId) => {
        setActivatingId(versionId);
        try {
            await cvApi.activateVersion(cvId, versionId);
            // Refresh list to show new active version
            await fetchVersions();
            if (onVersionActivated) {
                onVersionActivated(versionId);
            }
        } catch (err) {
            console.error('Activation failed:', err);
            alert(`Activation failed: ${err.message}`);
        } finally {
            setActivatingId(null);
        }
    };

    if (loading && versions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading version history...</p>
            </div>
        );
    }

    if (error && versions.length === 0) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start space-x-3">
                    <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-red-800">Error Loading Versions</h3>
                        <p className="text-red-600 mt-1">{error}</p>
                        <button
                            onClick={fetchVersions}
                            className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Try Again</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <History className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Version History</h3>
                        <p className="text-sm text-gray-500">View and manage different versions of your CV</p>
                    </div>
                </div>
                <button
                    onClick={fetchVersions}
                    disabled={loading}
                    className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                    title="Refresh versions"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Info Alert */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700">
                    The <strong>Active</strong> version is what you see in the "View CV" tab and what gets used for downloads by default.
                </p>
            </div>

            {/* Versions List */}
            <div className="space-y-3">
                {versions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
                        <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No versions found for this CV.</p>
                    </div>
                ) : (
                    versions.map((version) => {
                        const isActive = version.isActive;
                        const isTailored = version.changeType === 'ai_optimized';

                        return (
                            <div
                                key={version.id || version._id}
                                className={`group relative bg-white border rounded-xl p-4 transition-all hover:shadow-md ${isActive ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        {/* Icon */}
                                        <div className={`p-2 rounded-lg ${isActive ? 'bg-indigo-100' : isTailored ? 'bg-purple-100' : 'bg-gray-100'
                                            }`}>
                                            {isTailored ? (
                                                <Sparkles className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-purple-600'}`} />
                                            ) : (
                                                <History className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-gray-600'}`} />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <h4 className="font-bold text-gray-900">
                                                    {version.name || `Version ${version.versionNumber}`}
                                                </h4>
                                                {isActive && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full">
                                                        Active
                                                    </span>
                                                )}
                                                {isTailored && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold uppercase rounded-full">
                                                        Tailored
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                                                {version.description || 'No description provided'}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(version.createdAt).toLocaleString()} • {version.metadata?.wordCount || 0} words
                                            </p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center space-x-2">
                                        {!isActive && (
                                            <button
                                                onClick={() => handleActivate(version.id || version._id)}
                                                disabled={activatingId === (version.id || version._id)}
                                                className="px-4 py-2 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                                            >
                                                {activatingId === (version.id || version._id) ? (
                                                    <Loader className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    'Activate'
                                                )}
                                            </button>
                                        )}
                                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

export default CVVersions;
