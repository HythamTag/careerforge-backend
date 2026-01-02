import { useState, useEffect, useCallback } from 'react';
import { Clock, Loader, CheckCircle, XCircle, FileText, Download, Sparkles, RefreshCw, AlertCircle, Info } from 'lucide-react';
import { cvApi } from '../services/api';

function CVStatus({ cvId }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const response = await cvApi.getCVStatus(cvId);
      const statusData = response.data ? response.data : response;

      if (!statusData || typeof statusData.status !== 'string') {
        throw new Error('Invalid status response format');
      }

      setStatus(statusData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setStatus({
        cvId,
        status: 'error',
        error: { message: err.message }
      });
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Poll for updates when processing
  useEffect(() => {
    if (status?.status !== 'processing' && status?.status !== 'queued') {
      return;
    }

    const interval = setInterval(fetchStatus, 2000);
    return () => clearInterval(interval);
  }, [status?.status, fetchStatus]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800">Error Loading Status</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchStatus}
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

  const statusConfig = {
    queued: {
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
      border: 'border-amber-200',
      label: 'Queued',
      description: 'Your CV is in the queue and will be processed shortly.'
    },
    processing: {
      icon: Loader,
      color: 'text-blue-600',
      bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
      border: 'border-blue-200',
      label: 'Processing',
      description: 'AI is analyzing and extracting information from your CV.'
    },
    parsed: {
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
      border: 'border-green-200',
      label: 'Parsing Complete',
      description: 'Your CV has been successfully parsed and is ready.'
    },
    optimized: {
      icon: Sparkles,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      label: 'Optimization Complete',
      description: 'Your CV has been tailored for the specified job.'
    },
    failed: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Parsing Failed',
      description: 'We encountered an error while parsing your CV.'
    },
    error: {
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      border: 'border-red-200',
      label: 'Error',
      description: 'An error occurred during processing.'
    },
  };

  const currentStatus = status.status;
  const config = statusConfig[currentStatus] || statusConfig.error; // Fallback to error status
  const Icon = config.icon;
  const isProcessing = currentStatus === 'processing';
  const isSuccess = currentStatus === 'parsed' || currentStatus === 'optimized';

  // Check if error is just a warning (e.g., AI quota for optimization, but CV is still parsed)
  const hasNonBlockingError = status?.error && isSuccess;
  const hasBlockingError = status?.error && !isSuccess;

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <div className={`${config.bg} border ${config.border} rounded-xl p-6 transition-all`}>
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-full ${isSuccess ? 'bg-white/50' : 'bg-white/30'}`}>
            <Icon
              className={`w-8 h-8 ${config.color} ${isProcessing ? 'animate-spin' : ''}`}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">
              {config.label}
            </h3>
            <p className="text-gray-600 mt-1">
              {isProcessing && status.stage ? status.stage : config.description}
            </p>

            {/* Progress Bar */}
            {(currentStatus === 'processing' || currentStatus === 'queued') && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span className="font-medium">{status.progress || 0}%</span>
                </div>
                <div className="w-full bg-white/50 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${status.progress || 0}%` }}
                  />
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <button
              onClick={fetchStatus}
              className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-white/50 text-gray-700 rounded-lg hover:bg-white/80 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Status</span>
            </button>
          </div>
        </div>
      </div>

      {/* Non-blocking Warning (e.g., optimization failed but CV is parsed) */}
      {hasNonBlockingError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Note</p>
              <p className="text-sm text-amber-700 mt-1">{status.error.message}</p>
              {status.error.code && (
                <p className="text-xs text-amber-600 mt-1 font-mono">Code: {status.error.code}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blocking Error */}
      {hasBlockingError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error Details</p>
              <p className="text-sm text-red-600 mt-1">{status.error.message}</p>
              {status.error.code && (
                <p className="text-xs text-red-500 mt-1 font-mono">Code: {status.error.code}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CV Info Footer */}
      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">CV ID</p>
          <p className="font-mono text-sm text-gray-700">{status.cvId ? status.cvId : cvId}</p>
        </div>
        {isSuccess && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Ready to view
          </span>
        )}
      </div>
    </div>
  );
}

export default CVStatus;
