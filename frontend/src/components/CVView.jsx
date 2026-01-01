import { useState, useEffect, useCallback } from 'react';
import { Loader, AlertCircle, FileText, RefreshCw } from 'lucide-react';
import { cvApi } from '../services/api';
import CVPreview from './CVPreview';

/**
 * CVView Component
 * 
 * Fetches and displays CV data using the CVPreview component.
 * Handles loading, error states, and data fetching.
 */
function CVView({ cvId }) {
  const [cvData, setCvData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCV = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await cvApi.getCV(cvId);
      const cvInfo = response?.data || response;
      setCvData(cvInfo);
    } catch (err) {
      console.error("CV fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    if (cvId) {
      fetchCV();
    }
  }, [cvId, fetchCV]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Loading CV data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800">Error Loading CV</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchCV}
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

  const data = cvData.content || cvData;

  if (!data || (!data.personalInfo && !data.personal && !data.workExperience && !data.experience && !data.education && !data.skills && !data.professionalSummary && !data.summary)) {
    return (
      <div className="text-center py-16">
        <div className="bg-gradient-to-br from-gray-100 to-gray-50 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
          <FileText className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">CV Not Ready Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto mb-6">
          Your CV is still being processed. Please check the Status tab for progress updates.
        </p>
        <button
          onClick={fetchCV}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </button>
      </div>
    );
  }

  // Render the CV using Frontend Component (User Request)
  return (
    <CVPreview
      cvId={cvId}
      data={data}
      primaryColor="#4F46E5"
    />
  );
}

export default CVView;
