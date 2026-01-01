import { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, Loader, AlertCircle, TrendingUp, TrendingDown, RefreshCw, Target, CheckCircle } from 'lucide-react';
import { cvApi } from '../services/api';

function ATSScore({ cvId }) {
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const isFetching = useRef(false);

  const fetchScore = useCallback(async (jd) => {
    if (isFetching.current) return;
    isFetching.current = true;

    setLoading(true);
    setError(null);
    try {
      // versionId is undefined (uses latest), jobDescription is the JD string
      const response = await cvApi.getATSScore(cvId, undefined, jd);
      setScore(response.data ? response.data : response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setInitialLoading(false);
      isFetching.current = false;
    }
  }, [cvId]);

  // Fetch initial score without job description
  useEffect(() => {
    if (cvId) {
      fetchScore(null);
    }
  }, [cvId, fetchScore]);

  // Handler for manual recalculation with job description
  const handleRecalculate = () => {
    const trimmed = jobDescription.trim();
    fetchScore(trimmed ? trimmed : null);
  };

  const getScoreConfig = (scoreValue) => {
    if (scoreValue >= 80) {
      return {
        color: 'text-green-600',
        bg: 'bg-gradient-to-br from-green-50 to-emerald-50',
        border: 'border-green-200',
        gradient: 'from-green-500 to-emerald-500',
        label: 'Excellent',
        description: 'Your CV is highly compatible with ATS systems!'
      };
    }
    if (scoreValue >= 60) {
      return {
        color: 'text-amber-600',
        bg: 'bg-gradient-to-br from-amber-50 to-yellow-50',
        border: 'border-amber-200',
        gradient: 'from-amber-500 to-yellow-500',
        label: 'Good',
        description: 'Your CV has good ATS compatibility with room for improvement.'
      };
    }
    return {
      color: 'text-red-600',
      bg: 'bg-gradient-to-br from-red-50 to-orange-50',
      border: 'border-red-200',
      gradient: 'from-red-500 to-orange-500',
      label: 'Needs Improvement',
      description: 'Consider optimizing your CV for better ATS compatibility.'
    };
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500">Calculating ATS score...</p>
      </div>
    );
  }

  if (error && !score) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800">Error Calculating Score</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={() => fetchScore(null)}
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

  const scoreConfig = score ? getScoreConfig(score.score) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">ATS Compatibility Score</h3>
          <p className="text-sm text-gray-500">See how well your CV performs with Applicant Tracking Systems</p>
        </div>
      </div>

      {/* Job Description Input */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-2">
          Job Description (Optional)
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Paste a job description to get a more accurate, targeted ATS score.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={3}
            placeholder="Paste job description here for targeted scoring..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />
          <button
            onClick={handleRecalculate}
            disabled={loading}
            className="sm:self-end px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 min-w-[120px]"
          >
            {loading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Target className="w-5 h-5" />
                <span>Analyze</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Score Display */}
      {score && scoreConfig && (
        <div className="space-y-6">
          {/* Main Score Card */}
          <div className={`${scoreConfig.bg} border ${scoreConfig.border} rounded-xl p-6`}>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Score Circle */}
              <div className="relative">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="12"
                    fill="none"
                    className="text-white/50"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="url(#scoreGradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${(score.score / 100) * 352} 352`}
                    className="transition-all duration-1000 ease-out"
                  />
                  <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" className={`${scoreConfig.color}`} stopColor="currentColor" />
                      <stop offset="100%" className={`${scoreConfig.color}`} stopColor="currentColor" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className={`text-4xl font-bold ${scoreConfig.color}`}>{score.score}</span>
                    <span className={`text-lg ${scoreConfig.color}`}>/100</span>
                  </div>
                </div>
              </div>

              {/* Score Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start space-x-2 mb-2">
                  <CheckCircle className={`w-6 h-6 ${scoreConfig.color}`} />
                  <h4 className={`text-2xl font-bold ${scoreConfig.color}`}>{scoreConfig.label}</h4>
                </div>
                <p className="text-gray-600">{scoreConfig.description}</p>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          {score.breakdown && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h4>
              <div className="space-y-4">
                {Object.entries(score.breakdown).map(([key, value]) => {
                  // New scoring structure weights
                  const maxValue = key === 'structure' ? 40 :
                    key === 'skills' ? 25 :
                      key === 'experience' ? 25 :
                        key === 'formatting' ? 10 :
                          key === 'keywordMatch' ? 40 :
                            key === 'experienceRelevance' ? 25 :
                              key === 'skillsCoverage' ? 20 : 15;

                  const percentage = Math.round((value / maxValue) * 100);

                  // Format label
                  const label = key === 'skills' ? 'Skills Visibility' :
                    key === 'experience' ? 'Experience Quality' :
                      key === 'formatting' ? 'Formatting Safety' :
                        key === 'structure' ? 'Structure' :
                          key.replace(/([A-Z])/g, ' $1').trim();

                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium capitalize">
                          {label}
                        </span>
                        <span className="text-gray-500">{value}/{maxValue}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-2.5 rounded-full transition-all duration-500 ${percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            percentage >= 50 ? 'bg-gradient-to-r from-amber-500 to-yellow-500' :
                              'bg-gradient-to-r from-red-500 to-orange-500'
                            }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {score.recommendations && score.recommendations.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Recommendations</span>
              </h4>
              <ul className="space-y-3">
                {score.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start space-x-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-medium text-blue-700">{idx + 1}</span>
                    </div>
                    <span className="text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Keywords */}
          {score.missingKeywords && score.missingKeywords.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                <span>Missing Keywords</span>
              </h4>
              <p className="text-sm text-amber-700 mb-3">
                Consider adding these keywords to improve your ATS score:
              </p>
              <div className="flex flex-wrap gap-2">
                {score.missingKeywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-full text-sm font-medium"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ATSScore;
