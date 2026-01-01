import { useState, useRef } from 'react';
import { Sparkles, Loader, CheckCircle, AlertCircle, Target, FileText } from 'lucide-react';
import { cvApi } from '../services/api';

function OptimizeCV({ cvId }) {
  const [targetRole, setTargetRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const isOptimizing = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOptimizing.current) return;
    isOptimizing.current = true;

    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await cvApi.optimizeCV(cvId, {
        targetRole: targetRole.trim(),
        jobDescription: jobDescription.trim() ? jobDescription.trim() : null,
      });
      setSuccess(true);
      setTargetRole('');
      setJobDescription('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      isOptimizing.current = false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg">
          <Sparkles className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Optimize for ATS</h3>
          <p className="text-sm text-gray-500">Enhance your CV for Applicant Tracking Systems</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Target Role Input */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
          <label htmlFor="targetRole" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
            <Target className="w-4 h-4 text-indigo-600" />
            <span>Target Role *</span>
          </label>
          <input
            type="text"
            id="targetRole"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            required
            placeholder="e.g., Senior Software Engineer, Product Manager"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400"
          />
          <p className="text-xs text-gray-500 mt-2">
            Specify the job title you're targeting for tailored optimization.
          </p>
        </div>

        {/* Job Description Input */}
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-5 border border-gray-200">
          <label htmlFor="jobDescription" className="flex items-center space-x-2 text-sm font-semibold text-gray-700 mb-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>Job Description (Optional)</span>
          </label>
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={5}
            placeholder="Paste the job description here for more targeted optimization..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Including the job description helps create a more tailored optimization.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !targetRole.trim()}
          className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-200"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              <span className="font-medium">Optimizing Your CV...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Start Optimization</span>
            </>
          )}
        </button>
      </form>

      {/* Success Message */}
      {success && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-green-800">Optimization Complete!</h4>
              <p className="text-sm text-green-700 mt-1">
                Your CV has been tailored successfully. You can now view the optimized version or download it as a PDF.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800">Optimization Failed</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-800">How it works</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1.5">
              <li>• AI analyzes your CV against ATS requirements</li>
              <li>• Keywords and formatting are optimized</li>
              <li>• Your original information is preserved</li>
              <li>• Download the optimized version when complete</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OptimizeCV;
