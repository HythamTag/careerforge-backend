import axios from 'axios';

// In development, use relative URLs to go through Vite proxy
// In production, use the configured API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const TOKEN_KEY = 'cv_enhancer_token';
const REFRESH_TOKEN_KEY = 'cv_enhancer_refresh_token';

// Helper functions for token management (avoid circular dependency)
const getToken = () => localStorage.getItem(TOKEN_KEY);
const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);
const setRefreshToken = (token) => localStorage.setItem(REFRESH_TOKEN_KEY, token);
const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem('cv_enhancer_user');
};

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 600000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          // Use axios directly to avoid circular dependency
          const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/v1/auth/refresh` : '/v1/auth/refresh';
          const response = await axios.post(refreshUrl, { refreshToken });
          // Backend returns { success: true, data: { token, refreshToken } }
          const tokenData = response.data?.data || response.data;
          if (tokenData.token) {
            setToken(tokenData.token);
            if (tokenData.refreshToken) {
              setRefreshToken(tokenData.refreshToken);
            }
            const token = getToken();
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          }
        }
      } catch (refreshError) {
        // Refresh failed, clear auth
        clearAuth();
        // Don't redirect automatically - let the app handle it
      }
    }

    // Handle network errors (CORS, connection refused, etc.)
    if (!error.response) {
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        return Promise.reject(new Error('Cannot connect to server. Please check if the backend is running and the API URL is correct.'));
      }
      return Promise.reject(new Error(error.message));
    }

    const message = error.response?.data?.error?.message ? error.response.data.error.message : error.response?.data?.message ? error.response.data.message : error.message ? error.message : 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

/**
 * CV API - Enterprise Modular Endpoints
 * Updated to match Backend v1 Routes
 */
export const cvApi = {
  // ==========================================
  // 🧠 CV & UPLOAD
  // ==========================================

  uploadCV: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name.replace(/\.[^/.]+$/, ""));
    const response = await api.post('/v1/cvs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    const payload = response.data?.data || response.data;

    // Backend returns { cv: { id, ... }, parsing: { jobId, status } }
    // Handle both formats for backwards compatibility
    const cvId = payload.cv?.id || payload.cvId || payload.id;

    if (!cvId) {
      console.error('Upload response missing cvId:', payload);
      throw new Error('Upload failed: No CV ID returned');
    }

    return {
      success: true,
      data: {
        cvId: cvId,
        parsingJob: payload.parsing,
      },
    };
  },

  /**
   * Get all CVs for the current user
   */
  getUserCVs: async (options = {}) => {
    const { page = 1, limit = 20, sort = '-createdAt', status } = options;
    const params = { page, limit, sort };
    if (status) params.status = status;

    const response = await api.get('/v1/cvs', { params });
    return response.data?.data || response.data;
  },

  /**
   * Delete a CV by ID
   */
  deleteCV: async (cvId) => {
    const response = await api.delete(`/v1/cvs/${cvId}`);
    return response.data;
  },

  /**
   * Update a CV by ID
   */
  updateCV: async (cvId, data) => {
    const response = await api.put(`/v1/cvs/${cvId}`, data);
    return response.data;
  },

  /**
   * Get all versions of a CV
   */
  getCVVersions: async (cvId) => {
    const response = await api.get(`/v1/cvs/${cvId}/versions`);
    return response.data?.data || response.data;
  },

  /**
   * Activate a specific version of a CV
   */
  activateVersion: async (cvId, versionId) => {
    const response = await api.post(`/v1/cvs/${cvId}/versions/${versionId}/activate`);
    return response.data;
  },


  getCVStatus: async (cvId) => {
    try {
      // Use lightweight status endpoint for efficient polling
      const cvResponse = await api.get(`/v1/cvs/${cvId}/status`);
      const cvData = cvResponse.data?.data || cvResponse.data;

      // Map backend parsingStatus to frontend status
      // Backend parsingStatus: 'pending', 'processing', 'parsed', 'failed'
      let currentStatus = 'processing';
      if (cvData.parsingStatus === 'parsed' || cvData.parsingStatus === 'optimized' || cvData.isParsed === true) {
        currentStatus = cvData.parsingStatus === 'optimized' ? 'optimized' : 'parsed';
      } else if (cvData.parsingStatus === 'failed') {
        currentStatus = 'failed';
      } else if (cvData.parsingStatus === 'pending') {
        currentStatus = 'queued';
      } else if (cvData.parsingStatus === 'processing') {
        currentStatus = 'processing';
      }

      const status = {
        cvId: cvData.cvId || cvId,
        status: currentStatus,
        progress: currentStatus === 'parsed' ? 100 : (cvData.parsingProgress || 0),
        stage: cvData.parsingStage || null,
      };

      return { success: true, data: status };
    } catch (error) {
      return {
        success: false,
        data: {
          cvId,
          status: 'error',
          error: { message: error.message },
        },
      };
    }
  },

  getCV: async (cvId, versionId) => {
    const response = await api.get(`/v1/cvs/${cvId}`, {
      params: { _t: Date.now() }
    });
    return response.data;
  },

  // ==========================================
  // 🧠 ENHANCEMENT / OPTIMIZATION MODULE
  // ==========================================

  optimizeCV: async (cvId, { targetRole, jobDescription, versionId }) => {
    const cvResponse = await api.get(`/v1/cvs/${cvId}`);
    const cvResource = cvResponse.data?.data || cvResponse.data;
    const cvData = cvResource.content || cvResource;

    // Check for essential sections
    const hasPersonal = cvData.personalInfo || cvData.personal;
    const hasExperience = (cvData.workExperience && cvData.workExperience.length > 0) || (cvData.experience && cvData.experience.length > 0);
    const hasEducation = (cvData.education && cvData.education.length > 0);

    if (!cvData || (!hasPersonal && !hasExperience && !hasEducation)) {
      throw new Error('CV data not available. Please wait for parsing to complete.');
    }

    const payload = {
      cvId,
      cvData,
      jobData: {
        title: targetRole,
        description: jobDescription,
      },
    };

    if (versionId) {
      payload.options = { versionId };
    }

    const response = await api.post('/v1/optimize/tailor', payload);
    return response.data;
  },

  // ==========================================
  // 📊 ATS MODULE
  // ==========================================

  getATSScore: async (cvId, versionId, jobDescription) => {
    // Determine analysis type based on job description presence
    const type = (jobDescription && jobDescription.trim()) ? 'compatibility' : 'comprehensive';

    const payload = {
      cvId,
      type,
    };

    if (jobDescription && jobDescription.trim()) {
      payload.targetJob = { description: jobDescription.trim() }; // Backend expects targetJob object for compatibility
    }

    if (versionId) {
      payload.versionId = versionId;
    }

    const response = await api.post('/v1/cv-ats', payload);
    const result = response.data?.data || response.data;

    if (!result.jobId) {
      throw new Error('Failed to start ATS analysis: No job ID returned');
    }

    // Poll for completion
    let status = result.status || 'pending';
    let attempts = 0;
    const maxAttempts = 60; // 60 * 2s = 120s timeout

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      try {
        const statusResponse = await api.get(`/v1/cv-ats/${result.jobId}`);
        const statusData = statusResponse.data?.data || statusResponse.data;
        status = statusData.status;

        if (status === 'completed') {
          const resultResponse = await api.get(`/v1/cv-ats/${result.jobId}/result`);
          const resultData = resultResponse.data?.data || resultResponse.data;

          return {
            success: true,
            data: {
              score: resultData.results?.overallScore || 0,
              breakdown: resultData.results?.breakdown || {},
              recommendations: resultData.results?.recommendations || [],
              missingKeywords: resultData.results?.missingKeywords || [],
            },
          };
        }
      } catch (err) {
        break;
      }
      attempts++;
    }

    if (status === 'failed') {
      throw new Error('ATS analysis failed');
    }

    throw new Error(`ATS analysis timed out after ${maxAttempts * 2} seconds. Status: ${status}`);
  },

  // ==========================================
  // 📄 GENERATION MODULE
  // ==========================================

  downloadCV: async (cvId, format, templateOptions, versionId) => {
    const { templateId, customization } = templateOptions;
    const outputFormat = format || 'pdf';
    const finalTemplateId = templateId || 'modern';
    let result = null; // Will hold job info if we find existing or create new

    // Step 1: Check if there's an existing completed generation matching these parameters
    try {
      const historyResponse = await api.get('/v1/generation/history', {
        params: {
          cvId,
          format: outputFormat,
          status: 'completed',
          limit: 10,
        },
      });

      // ResponseFormatter.paginated returns { success: true, data: [...], pagination: {...} }
      const historyData = historyResponse.data?.data || historyResponse.data?.items || [];

      console.log('[CV Generation] Checking history for existing completed generation', {
        totalHistoryItems: historyData.length,
        cvId,
        outputFormat,
        finalTemplateId,
      });

      // Find a matching completed generation
      const existingJob = historyData.find(job => {
        // Match cvId, format, and templateId
        const jobCvId = job.cv?.id || job.cvId;
        const matchesCvId = jobCvId === cvId || jobCvId?.toString() === cvId?.toString();
        const matchesFormat = job.outputFormat === outputFormat;
        const matchesTemplate = job.templateId === finalTemplateId;
        // Note: versionId matching is optional since it might not be in history response
        const matchesVersion = !versionId || !job.versionId || job.versionId === versionId || job.versionId?.toString() === versionId?.toString();

        const matches = matchesCvId && matchesFormat && matchesTemplate && matchesVersion && job.status === 'completed';

        if (matches) {
          console.log('[CV Generation] Found matching completed job:', {
            jobId: job.jobId,
            cvId: jobCvId,
            format: job.outputFormat,
            template: job.templateId,
          });
        }

        return matches;
      });

      if (existingJob && existingJob.jobId) {
        console.log(`[CV Generation] Found existing completed generation: ${existingJob.jobId}`);
        // Download the existing file directly
        const downloadUrl = `${API_BASE_URL || ''}/v1/generation/${existingJob.jobId}/download`;
        const token = getToken();

        try {
          const downloadResponse = await api.get(downloadUrl, {
            responseType: 'blob',
          });

          const blob = new Blob([downloadResponse.data], {
            type: downloadResponse.headers['content-type'] ||
              (outputFormat === 'pdf' ? 'application/pdf' :
                outputFormat === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                  'application/octet-stream'),
          });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `cv-${cvId}.${outputFormat}`);
          document.body.appendChild(link);
          link.click();
          link.remove();
          window.URL.revokeObjectURL(url);

          return { success: true };
        } catch (downloadErr) {
          console.warn('[CV Generation] Failed to download existing generation, will create new one:', downloadErr.message);
          // Fall through to create a new generation
        }
      } else {
        console.log('[CV Generation] No matching completed generation found in history');

        // Check if there's a pending/processing job with the same parameters
        try {
          const pendingHistoryResponse = await api.get('/v1/generation/history', {
            params: {
              cvId,
              format: outputFormat,
              status: 'pending,processing', // Backend now supports comma-separated
              limit: 10,
            },
          });

          const allPendingData = pendingHistoryResponse.data?.data || [];
          const pendingJob = allPendingData.find(job => {
            const jobCvId = job.cv?.id || job.cvId;
            const matchesCvId = jobCvId === cvId || jobCvId?.toString() === cvId?.toString();
            const matchesFormat = job.outputFormat === outputFormat;
            const matchesTemplate = job.templateId === finalTemplateId;
            const matchesVersion = !versionId || !job.versionId || job.versionId === versionId || job.versionId?.toString() === versionId?.toString();

            return matchesCvId && matchesFormat && matchesTemplate && matchesVersion &&
              (job.status === 'pending' || job.status === 'processing');
          });

          if (pendingJob && pendingJob.jobId) {
            console.log(`[CV Generation] Found existing pending/processing generation: ${pendingJob.jobId}, will wait for it`);
            // Use the existing job and poll for completion - skip creating new job
            result = {
              jobId: pendingJob.jobId,
              status: pendingJob.status || 'pending',
            };
            // Continue to polling section below - don't create new job
          }
        } catch (pendingErr) {
          console.warn('[CV Generation] Failed to check for pending jobs:', pendingErr.message);
          // Fall through to create new job
        }
      }
    } catch (historyErr) {
      console.warn('[CV Generation] Failed to check generation history, will create new generation:', historyErr.message);
      // Fall through to create a new generation
    }

    // Step 2: No existing generation found, start a new one
    // Only create new job if we don't already have one from pending check
    if (!result || !result.jobId) {
      const payload = {
        cvId,
        outputFormat,
        templateId: finalTemplateId,
        type: 'from_cv',
      };

      if (versionId) {
        payload.versionId = versionId;
      }

      if (customization) {
        payload.parameters = { customizations: customization };
      }

      try {
        const response = await api.post('/v1/generation', payload);
        result = response.data?.data || response.data;

        if (!result.jobId) {
          throw new Error('Failed to start CV generation: No job ID returned');
        }
      } catch (error) {
        // Check if it's a quota exceeded error
        if (error.response?.status === 400 &&
          (error.response?.data?.message?.includes('Maximum concurrent generations') ||
            error.response?.data?.error?.message?.includes('Maximum concurrent generations'))) {

          // Try to get active jobs to show user what's pending
          try {
            const activeHistoryResponse = await api.get('/v1/generation/history', {
              params: {
                status: 'pending',
                limit: 10,
              },
            });

            const activeJobs = activeHistoryResponse.data?.data || [];
            const activeCount = activeJobs.length;

            throw new Error(
              `You have ${activeCount} generation job(s) currently in progress. ` +
              `Please wait for them to complete or cancel them before starting a new one. ` +
              `Maximum allowed: 3 concurrent generations.`
            );
          } catch (historyErr) {
            // If we can't get history, just show the quota error
            throw new Error(
              'Maximum concurrent generations (3) exceeded. ' +
              'Please wait for existing generation jobs to complete or cancel them before starting a new one.'
            );
          }
        }
        // Re-throw other errors
        throw error;
      }
    }

    // Poll for completion
    let status = result.status || 'pending';
    let attempts = 0;
    const maxAttempts = 60; // 60 * 2s = 120s timeout
    let lastError = null;
    let lastStatusData = null;

    console.log(`[CV Generation] Starting polling for jobId: ${result.jobId}, initial status: ${status}`);

    while (status !== 'completed' && status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      try {
        const statusResponse = await api.get(`/v1/generation/${result.jobId}`);

        // Check if we got a valid response
        if (!statusResponse || !statusResponse.data) {
          console.warn(`[CV Generation] Invalid response structure:`, statusResponse);
          throw new Error('Invalid response from status endpoint');
        }

        const statusData = statusResponse.data?.data || statusResponse.data;
        lastStatusData = statusData;

        // Log every status check for debugging
        console.log(`[CV Generation] Poll attempt ${attempts + 1}/${maxAttempts}:`, {
          status: statusData?.status,
          jobStatus: statusData?.jobStatus,
          completedAt: statusData?.completedAt,
          progress: statusData?.progress,
          currentStep: statusData?.currentStep,
          hasDownloadLink: !!statusData?._links?.download,
          hasOutputFile: !!statusData?.outputFile,
        });

        // Update status - check multiple possible fields
        if (statusData?.status) {
          const newStatus = statusData.status;
          if (newStatus !== status) {
            console.log(`[CV Generation] Status changed: ${status} -> ${newStatus}`);
          }
          status = newStatus;
        } else if (statusData?.jobStatus) {
          // Fallback to jobStatus if status not available
          status = statusData.jobStatus;
          console.log(`[CV Generation] Using jobStatus: ${status}`);
        }

        // Check multiple indicators of completion
        // 1. completedAt timestamp
        if (statusData?.completedAt && status !== 'completed') {
          console.log(`[CV Generation] Detected completedAt timestamp, forcing status to completed`);
          status = 'completed';
        }

        // 2. download link in _links (backend sets this when completed)
        if (statusData?._links?.download && status !== 'completed') {
          console.log(`[CV Generation] Detected download link, forcing status to completed`);
          status = 'completed';
        }

        // 3. outputFile.url (file is ready)
        if (statusData?.outputFile?.url && status !== 'completed') {
          console.log(`[CV Generation] Detected outputFile.url, forcing status to completed`);
          status = 'completed';
        }

        lastError = null;
      } catch (err) {
        lastError = err;
        console.error(`[CV Generation] Status check failed (attempt ${attempts + 1}/${maxAttempts}):`, {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        // Continue polling even if individual status check fails
      }
      attempts++;
    }

    console.log(`[CV Generation] Polling ended. Final status: ${status}, attempts: ${attempts}, lastStatusData:`, lastStatusData);

    // Final status check - make one more attempt if we're at max attempts
    if (attempts >= maxAttempts && status !== 'completed' && status !== 'failed') {
      try {
        const finalStatusResponse = await api.get(`/v1/generation/${result.jobId}`);
        const finalStatusData = finalStatusResponse.data?.data || finalStatusResponse.data;
        if (finalStatusData?.status) {
          status = finalStatusData.status;
          console.log(`[CV Generation] Final status check: ${status}`);
        }
      } catch (err) {
        console.warn('[CV Generation] Final status check failed:', err.message);
      }
    }

    // Check final status
    if (status === 'completed') {
      // Use download endpoint - backend will serve file or redirect
      const downloadUrl = `${API_BASE_URL || ''}/v1/generation/${result.jobId}/download`;
      const token = getToken();

      try {
        // Use axios to get the file (handles auth automatically)
        const downloadResponse = await api.get(downloadUrl, {
          responseType: 'blob', // Important: tell axios to expect binary data
        });

        // Create blob URL and trigger download
        const blob = new Blob([downloadResponse.data], {
          type: downloadResponse.headers['content-type'] ||
            (format === 'pdf' ? 'application/pdf' :
              format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                'application/octet-stream'),
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `cv-${cvId}.${format || 'pdf'}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        return { success: true };
      } catch (downloadErr) {
        console.error('[CV Generation] Download failed:', downloadErr);

        // If it's a redirect error or network error, try direct link
        if (downloadErr.response?.status === 302 || downloadErr.response?.status === 301) {
          // Redirect response - follow it
          const redirectUrl = downloadErr.response.headers.location || downloadErr.response.headers.Location;
          if (redirectUrl) {
            window.location.href = redirectUrl;
            return { success: true };
          }
        }

        // Fallback: try with fetch (handles redirects better)
        try {
          const fetchResponse = await fetch(downloadUrl, {
            method: 'GET',
            headers: {
              'Authorization': token ? `Bearer ${token}` : '',
            },
            redirect: 'follow', // Follow redirects
          });

          if (fetchResponse.ok || fetchResponse.redirected) {
            if (fetchResponse.redirected) {
              // Redirected to file URL
              window.location.href = fetchResponse.url;
            } else {
              // File response
              const blob = await fetchResponse.blob();
              const url = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.setAttribute('download', `cv-${cvId}.${format || 'pdf'}`);
              document.body.appendChild(link);
              link.click();
              link.remove();
              window.URL.revokeObjectURL(url);
            }
            return { success: true };
          }
        } catch (fetchErr) {
          console.error('[CV Generation] Fetch download also failed:', fetchErr);
          throw new Error(`Failed to download CV: ${downloadErr.message}`);
        }

        throw new Error(`Failed to download CV: ${downloadErr.message}`);
      }
    }

    if (status === 'failed') {
      throw new Error('CV generation failed');
    }

    // If we have a last error and status is still pending/processing, include error info
    const errorMsg = lastError
      ? `CV generation timed out after ${maxAttempts * 2} seconds. Last status: ${status}. Last error: ${lastError.message}`
      : `CV generation timed out after ${maxAttempts * 2} seconds. Last status: ${status}`;

    throw new Error(errorMsg);
  },

  getPreview: async (cvId, versionId, templateOptions) => {
    const { templateId, primaryColor } = templateOptions;

    const payload = {
      cvId,
      versionId,
      templateId,
    };

    if (primaryColor) {
      payload.parameters = {
        customizations: { primaryColor },
      };
    }

    const response = await api.post('/v1/generation/preview', payload);
    return response.data?.data || response.data;
  },

  // ==========================================
  // 🔧 UTILITY
  // ==========================================

  checkHealth: async () => {
    const response = await api.get('/v1/health');
    return response.data;
  },
};

export default api;
