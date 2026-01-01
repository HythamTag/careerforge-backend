import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate, useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Sparkles, BarChart3, Home as HomeIcon, ArrowLeft, Upload, LogOut, FolderOpen } from 'lucide-react';
import { cvApi } from './services/api';
import { authService } from './services/auth';
import ErrorBoundary from './components/ErrorBoundary';
import UploadCV from './components/UploadCV';
import CVStatus from './components/CVStatus';
import CVView from './components/CVView';
import OptimizeCV from './components/OptimizeCV';
import ATSScore from './components/ATSScore';
import Login from './components/Login';
import MyCVs from './components/MyCVs';

function Home() {
  const navigate = useNavigate();

  const handleViewCV = (cv) => {
    navigate(`/cv/${cv.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-indigo-200">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            CV Enhancer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-Powered CV Parsing and ATS Optimization to help you land your dream job
          </p>
        </div>

        {/* Upload Section */}
        <div className="max-w-2xl mx-auto mb-12">
          <UploadCV />
        </div>

        {/* My CVs Section */}
        <div className="max-w-5xl mx-auto mb-20 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <FolderOpen className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">My CVs</h2>
            </div>
          </div>
          <MyCVs onViewCV={handleViewCV} />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <FeatureCard
            icon={<FileText className="w-8 h-8" />}
            iconBg="from-indigo-500 to-blue-500"
            title="Smart Parsing"
            description="Extract structured data from your PDF CV using advanced AI technology"
          />
          <FeatureCard
            icon={<Sparkles className="w-8 h-8" />}
            iconBg="from-purple-500 to-pink-500"
            title="ATS Optimization"
            description="Enhance your CV for Applicant Tracking System compatibility"
          />
          <FeatureCard
            icon={<BarChart3 className="w-8 h-8" />}
            iconBg="from-green-500 to-emerald-500"
            title="ATS Scoring"
            description="Get detailed compatibility scores and personalized recommendations"
          />
        </div>

        {/* Stats Section */}
        <div className="mt-20 text-center">
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-6">Powered by</p>
          <div className="flex justify-center items-center space-x-8 text-gray-400">
            <span className="font-semibold">Gemini AI</span>
            <span>•</span>
            <span className="font-semibold">OpenAI</span>
            <span>•</span>
            <span className="font-semibold">Anthropic</span>
            <span>•</span>
            <span className="font-semibold">Hugging Face</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, iconBg, title, description }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 text-center transition-all duration-300 hover:scale-105 hover:shadow-xl border border-gray-100">
      <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${iconBg} rounded-2xl text-white mb-6 shadow-lg`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  );
}

function CVDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('status');

  const tabs = [
    { id: 'status', label: 'Status', icon: CheckCircle, color: 'indigo' },
    { id: 'view', label: 'View CV', icon: FileText, color: 'blue' },
    { id: 'optimize', label: 'Optimize', icon: Sparkles, color: 'purple' },
    { id: 'ats', label: 'ATS Score', icon: BarChart3, color: 'green' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-indigo-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Home</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Another CV</span>
          </Link>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
            <nav className="flex">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-4 px-4 font-medium text-sm transition-all relative ${isActive
                      ? 'text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : ''}`} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === 'status' && <CVStatus cvId={id} />}
            {activeTab === 'view' && <CVView cvId={id} />}
            {activeTab === 'optimize' && <OptimizeCV cvId={id} />}
            {activeTab === 'ats' && <ATSScore cvId={id} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [user, setUser] = useState(authService.getUser());

  const checkHealth = useCallback(async () => {
    try {
      const data = await cvApi.checkHealth();
      setHealthStatus(data.status === 'healthy' || data.status === 'OK');
    } catch {
      setHealthStatus(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleLogin = () => {
    setIsAuthenticated(true);
    setUser(authService.getUser());
  };

  const handleLogout = async () => {
    await authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen">
          {/* Navigation */}
          <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-between">
                <Link to="/" className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    CV Enhancer
                  </span>
                </Link>

                {/* Auth & Health Status */}
                <div className="flex items-center space-x-4">
                  {healthStatus !== null && (
                    <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${healthStatus ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                      <span className="text-xs font-medium text-gray-600">
                        {healthStatus ? 'API Online' : 'API Offline'}
                      </span>
                    </div>
                  )}
                  {isAuthenticated && user && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-700">
                        {user.firstName} {user.lastName}
                      </span>
                      <button
                        onClick={handleLogout}
                        className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </nav>

          {/* Routes */}
          <Routes>
            <Route
              path="/login"
              element={
                isAuthenticated ? (
                  <Navigate to="/" replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              }
            />
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Home />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
            <Route
              path="/cv/:id"
              element={
                isAuthenticated ? (
                  <CVDetail />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
