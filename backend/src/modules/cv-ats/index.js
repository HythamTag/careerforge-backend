/**
 * CV ATS MODULE
 *
 * CV Applicant Tracking System analysis and optimization module.
 * Provides ATS scoring, suggestions, and compatibility analysis for CVs.
 *
 * @module modules/cv-ats
 */

const routes = require('./routes/cv-ats.routes');

module.exports = {
  name: 'cv-ats',
  routes: routes,
};

