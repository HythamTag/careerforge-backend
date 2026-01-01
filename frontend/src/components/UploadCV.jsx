import { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, AlertCircle, Loader, CheckCircle, File } from 'lucide-react';
import { cvApi } from '../services/api';

function UploadCV() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const navigate = useNavigate();
  const uploadingRef = useRef(false); // Guard against StrictMode double-calling

  // Reset guard on mount (handles navigation back to upload page)
  useEffect(() => {
    uploadingRef.current = false;
  }, []);

  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    if (uploadingRef.current) return; // Block duplicate calls from StrictMode

    uploadingRef.current = true;
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setError(null);
    setUploading(true);

    try {
      const response = await cvApi.uploadCV(selectedFile);
      if (response.success && response.data && response.data.cvId) {
        // Small delay to ensure DB commit completes
        await new Promise(resolve => setTimeout(resolve, 300));

        // Navigate to CV detail page
        navigate(`/cv/${response.data.cvId}`);
      } else {
        throw new Error('Upload succeeded but no CV ID returned');
      }
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.');
      setFile(null);
      setUploading(false);
      uploadingRef.current = false;
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    maxSize: 10485760, // 10MB
    disabled: uploading,
  });

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl mb-4">
          <Upload className="w-8 h-8 text-indigo-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Upload Your CV</h2>
        <p className="text-gray-500 mt-2">Start by uploading your PDF CV</p>
      </div>

      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 ${isDragActive && !isDragReject
          ? 'border-indigo-500 bg-indigo-50 scale-[1.02]'
          : isDragReject
            ? 'border-red-500 bg-red-50'
            : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          } ${uploading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />

        {uploading ? (
          <div className="flex flex-col items-center py-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-4 border-indigo-100"></div>
              <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
              <FileText className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-medium text-gray-900 mt-6">Uploading your CV...</p>
            <p className="text-sm text-gray-500 mt-1">{file?.name}</p>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setUploading(false);
                uploadingRef.current = false;
                setFile(null);
              }}
              className="mt-4 text-xs font-medium text-red-500 hover:text-red-700 pointer-events-auto cursor-pointer"
            >
              Cancel Upload
            </button>
          </div>
        ) : isDragReject ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-lg font-medium text-red-700">Invalid file type</p>
            <p className="text-sm text-red-500 mt-1">Only PDF files are accepted</p>
          </div>
        ) : isDragActive ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4 animate-pulse">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-medium text-indigo-700">Drop your CV here!</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center mb-4">
              <Upload className="w-8 h-8 text-indigo-600" />
            </div>
            <p className="text-lg font-medium text-gray-900">
              Drag & drop your CV here
            </p>
            <p className="text-gray-500 mt-1">or click to browse</p>
            <div className="mt-4 flex items-center space-x-2 text-xs text-gray-400">
              <File className="w-4 h-4" />
              <span>PDF files only • Max 10MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 bg-gradient-to-br from-red-50 to-orange-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h4 className="font-semibold text-red-800">Upload Failed</h4>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-xl bg-gray-50">
          <div className="w-10 h-10 mx-auto rounded-full bg-indigo-100 flex items-center justify-center mb-2">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-xs font-medium text-gray-700">AI Parsing</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-gray-50">
          <div className="w-10 h-10 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-xs font-medium text-gray-700">ATS Scoring</p>
        </div>
        <div className="text-center p-4 rounded-xl bg-gray-50">
          <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 flex items-center justify-center mb-2">
            <Upload className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-xs font-medium text-gray-700">Optimization</p>
        </div>
      </div>
    </div>
  );
}

export default UploadCV;
