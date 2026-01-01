/**
 * PDF GENERATOR ADAPTER (Infrastructure Layer)
 * 
 * Single Responsibility: Generating PDFs from HTML using Puppeteer
 * Delegates browser management to BrowserManager
 * 
 * @module modules/generation/infrastructure/adapters/pdf-generator.adapter
 */

const { logger } = require('@utils');
const { FileError } = require('@errors');
const { FILE_LIMITS } = require('@constants');

class PdfGeneratorAdapter {
  /**
     * @param {BrowserManagerAdapter} browserManager - Browser manager instance
     */
  constructor(browserManager) {
    this.browserManager = browserManager;
  }

  /**
     * Generate PDF from HTML content
     * 
     * @param {string} html - HTML content to convert
     * @param {Object} options - PDF generation options
     * @param {string} options.format - Page format (A4, Letter, etc.)
     * @param {Object} options.margin - Page margins
     * @param {boolean} options.printBackground - Include background graphics
     * @returns {Promise<Buffer>} PDF buffer
     */
  async generateFromHtml(html, options) {
    const startTime = Date.now();
    let page = null;

    try {
      const browser = await this.browserManager.getBrowser();
      page = await browser.newPage();

      // Ensure HTML is a complete document
      let completeHtml = html;
      if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
        // Wrap fragment in complete HTML document
        completeHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
${html}
</body>
</html>`;
        logger.debug('Wrapped HTML fragment in complete document', {
          operation: 'PDF generation',
          originalLength: html.length,
          wrappedLength: completeHtml.length,
        });
      }

      // Log HTML structure for debugging
      const hasHtmlTag = completeHtml.includes('<html');
      const hasBodyTag = completeHtml.includes('<body');
      const hasDoctype = completeHtml.includes('<!DOCTYPE');
      
      logger.info('HTML structure check', {
        operation: 'PDF generation',
        hasDoctype,
        hasHtmlTag,
        hasBodyTag,
        htmlLength: completeHtml.length,
        htmlPreview: completeHtml.substring(0, 300),
      });

      // Set content
      await page.setContent(completeHtml, {
        waitUntil: 'networkidle0',
        timeout: FILE_LIMITS.DOCUMENT_GENERATION_TIMEOUT_MS,
      });

      // Wait for content to actually render - check if body has content
      try {
        await page.waitForFunction(() => {
          const body = document.body;
          return body && (body.innerText.length > 100 || body.children.length > 0);
        }, { timeout: 5000 });
      } catch (waitError) {
        logger.warn('Content wait timeout, proceeding anyway', {
          operation: 'PDF generation',
          error: waitError.message,
        });
      }

      // Verify page has content before generating PDF
      const pageContent = await page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const bodyText = body?.innerText || '';
        const bodyHTML = body?.innerHTML || '';
        
        return {
          bodyExists: !!body,
          htmlExists: !!html,
          bodyTextLength: bodyText.length,
          bodyHTMLLength: bodyHTML.length,
          bodyChildren: body?.children?.length || 0,
          allText: bodyText.substring(0, 200), // First 200 chars for debugging
          hasContent: bodyText.length > 100 || (body?.children?.length || 0) > 0,
        };
      });

      logger.info('Page content check before PDF generation', {
        operation: 'PDF generation',
        bodyExists: pageContent.bodyExists,
        htmlExists: pageContent.htmlExists,
        bodyTextLength: pageContent.bodyTextLength,
        bodyHTMLLength: pageContent.bodyHTMLLength,
        bodyChildrenCount: pageContent.bodyChildren,
        textPreview: pageContent.allText,
        hasContent: pageContent.hasContent,
      });

      if (!pageContent.bodyExists) {
        logger.error('Document body does not exist', {
          operation: 'PDF generation',
          htmlExists: pageContent.htmlExists,
        });
        throw new FileError('Document body does not exist, cannot generate PDF');
      }

      if (!pageContent.hasContent && pageContent.bodyTextLength < 50) {
        // Try to get more info about what's wrong
        const pageInfo = await page.evaluate(() => {
          return {
            documentHTML: document.documentElement?.outerHTML?.substring(0, 500),
            bodyHTML: document.body?.outerHTML?.substring(0, 500),
            computedStyle: window.getComputedStyle(document.body)?.display || 'unknown',
          };
        });
        
        logger.error('Page appears to be empty before PDF generation', {
          operation: 'PDF generation',
          bodyTextLength: pageContent.bodyTextLength,
          bodyHTMLLength: pageContent.bodyHTMLLength,
          bodyChildrenCount: pageContent.bodyChildren,
          bodyDisplay: pageInfo.computedStyle,
          bodyHTMLPreview: pageInfo.bodyHTML,
        });
        throw new FileError(`Page content is empty (body text: ${pageContent.bodyTextLength} chars, body HTML: ${pageContent.bodyHTMLLength} chars), cannot generate PDF`);
      }

      // Generate PDF
      const pdfOptions = this._buildPdfOptions(options);
      const pdfBuffer = await page.pdf(pdfOptions);

      // Validate PDF buffer
      if (!pdfBuffer) {
        logger.error('PDF generation returned null/undefined', {
          operation: 'PDF generation',
          duration: `${Date.now() - startTime}ms`,
        });
        throw new FileError('PDF generation returned null or undefined');
      }

      if (!Buffer.isBuffer(pdfBuffer)) {
        const originalLength = pdfBuffer?.length || 0;
        const originalType = typeof pdfBuffer;
        const constructorName = pdfBuffer?.constructor?.name;
        const isArray = Array.isArray(pdfBuffer);
        const isUint8Array = pdfBuffer instanceof Uint8Array;
        
        logger.warn('PDF generation did not return a Buffer', {
          operation: 'PDF generation',
          duration: `${Date.now() - startTime}ms`,
          type: originalType,
          constructor: constructorName,
          isArray: isArray,
          isUint8Array: isUint8Array,
          originalLength: originalLength,
        });
        
        // Convert to Buffer - handle all possible types
        let convertedBuffer;
        if (isUint8Array) {
          convertedBuffer = Buffer.from(pdfBuffer);
        } else if (isArray) {
          convertedBuffer = Buffer.from(pdfBuffer);
        } else if (pdfBuffer && typeof pdfBuffer === 'object' && 'buffer' in pdfBuffer) {
          // Handle ArrayBuffer or TypedArray
          convertedBuffer = Buffer.from(pdfBuffer.buffer || pdfBuffer);
        } else {
          logger.error('Cannot convert PDF result to Buffer', {
            operation: 'PDF generation',
            type: originalType,
            constructor: constructorName,
            hasLength: 'length' in (pdfBuffer || {}),
          });
          throw new FileError(`PDF generation returned invalid type: ${originalType} (${constructorName})`);
        }
        
        // Validate converted buffer
        if (!Buffer.isBuffer(convertedBuffer)) {
          throw new FileError('Failed to convert PDF result to Buffer');
        }
        
        if (convertedBuffer.length === 0) {
          logger.error('Converted PDF buffer is empty', {
            operation: 'PDF generation',
            originalLength: originalLength,
            convertedLength: convertedBuffer.length,
          });
          throw new FileError('Converted PDF buffer is empty');
        }
        
        logger.info('Converted PDF result to Buffer', {
          operation: 'PDF generation',
          originalType: constructorName || originalType,
          originalLength: originalLength,
          convertedLength: convertedBuffer.length,
          sizeKB: (convertedBuffer.length / 1024).toFixed(2),
        });
        
        return convertedBuffer;
      }

      if (pdfBuffer.length === 0) {
        logger.error('PDF generation returned empty buffer', {
          operation: 'PDF generation',
          duration: `${Date.now() - startTime}ms`,
        });
        throw new FileError('PDF generation returned empty buffer');
      }

      const duration = Date.now() - startTime;
      logger.info('PDF generated successfully', {
        operation: 'PDF generation',
        duration: `${duration}ms`,
        size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
      });

      return pdfBuffer;
    } catch (error) {
      logger.logError(error, {
        operation: 'PDF generation',
        duration: `${Date.now() - startTime}ms`,
      });
      // Re-throw FileError as-is, wrap others
      if (error instanceof FileError) {
        throw error;
      }
      throw new FileError(`Failed to generate PDF: ${error.message}`);
    } finally {
      // Cleanup page
      if (page) {
        try {
          await page.close();
        } catch (cleanupError) {
          logger.warn('Failed to close page', {
            error: cleanupError.message,
          });
        }
      }
    }
  }

  /**
     * Generate PDF from URL
     * 
     * @param {string} url - URL to convert to PDF
     * @param {Object} options - PDF generation options
     * @returns {Promise<Buffer>} PDF buffer
     */
  async generateFromUrl(url, options) {
    const startTime = Date.now();
    let page = null;

    try {
      const browser = await this.browserManager.getBrowser();
      page = await browser.newPage();

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: FILE_LIMITS.DOCUMENT_GENERATION_TIMEOUT_MS,
      });

      const pdfOptions = this._buildPdfOptions(options);
      const pdfBuffer = await page.pdf(pdfOptions);

      logger.info('PDF generated from URL', {
        operation: 'PDF generation from URL',
        url,
        duration: `${Date.now() - startTime}ms`,
      });

      return pdfBuffer;
    } catch (error) {
      logger.logError(error, {
        operation: 'PDF generation from URL',
        url,
      });
      throw new FileError(`Failed to generate PDF from URL: ${error.message}`);
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (cleanupError) {
          logger.warn('Failed to close page', {
            error: cleanupError.message,
          });
        }
      }
    }
  }

  /**
     * Build PDF options from user options
     * @private
     */
  _buildPdfOptions(options) {
    return {
      format: options.format || 'A4',
      margin: options.margin || {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
      printBackground: options.printBackground !== false,
      preferCSSPageSize: false,
    };
  }
}

module.exports = PdfGeneratorAdapter;


