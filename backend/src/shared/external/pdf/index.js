/**
 * PDF SERVICES MODULE
 * 
 * Production-ready PDF services with dependency injection
 * 
 * @module shared/external/pdf
 */

const PDFService = require('./PDFService');
const PDFValidator = require('./PDFValidator');

module.exports = {
  PDFService,
  PDFValidator,
};
