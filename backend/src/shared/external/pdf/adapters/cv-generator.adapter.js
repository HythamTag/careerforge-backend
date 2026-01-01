/**
 * CV GENERATOR ADAPTER (Infrastructure Layer)
 * 
 * Adapter for CV generation in multiple formats (PDF, DOCX).
 * Uses dependency injection for template rendering and PDF generation.
 * 
 * @module modules/generation/infrastructure/adapters/cv-generator.adapter
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
const logger = require('@utils/logger');
const { FileError } = require('@errors');
const { resolve, getContainer } = require('@core/container');
const { DOCUMENT_FORMATTING } = require('@constants');

class CVGeneratorAdapter {
  /**
   * Generate CV in specified format
   * 
   * @param {Object} cvData - CV data
   * @param {string} format - Output format ('pdf' or 'docx')
   * @param {Object} options - Generation options
   * @returns {Promise<Buffer|Stream>} Generated document
   */
  static async generate(cvData, format, options) {
    if (format === 'pdf') {
      return this.generatePDF(cvData, options);
    } else if (format === 'docx') {
      return this.generateDOCX(cvData);
    } else {
      throw new FileError(`Unsupported format: ${format}`);
    }
  }

  static buildContactInfo(cvData) {
    const contactInfo = [];
    if (cvData.personal?.email) {contactInfo.push(cvData.personal.email);}
    if (cvData.personal?.phone) {contactInfo.push(cvData.personal.phone);}
    if (cvData.personal?.location) {contactInfo.push(cvData.personal.location);}
    if (cvData.personal?.linkedin) {contactInfo.push(`LinkedIn: ${cvData.personal.linkedin}`);}
    if (cvData.personal?.github) {contactInfo.push(`GitHub: ${cvData.personal.github}`);}
    return contactInfo;
  }

  /**
   * Generate PDF using Puppeteer with Handlebars templates
   * Uses dependency injection for better testability
   * 
   * @param {Object} cvData - CV data to generate
   * @param {Object} options - Generation options
   * @param {string} options.templateId - Template identifier (default: 'modern')
   * @param {Object} options.customization - Template customization options
   * @returns {Promise<Buffer>} PDF buffer
   */
  static async generatePDF(cvData, options) {
    const startTime = Date.now();

    try {
      const {
        templateId,
        customization,
      } = options;

      // Get services from DI container
      const container = getContainer();
      const templateRenderer = resolve('templateRenderer');
      const pdfGenerator = resolve('pdfGenerator');

      // Render template with CV data
      const html = await templateRenderer.render(templateId, cvData, customization);

      // Generate PDF from HTML
      const pdfBuffer = await pdfGenerator.generateFromHtml(html, {
        format: 'Letter',
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in',
        },
        printBackground: true,
      });

      const duration = Date.now() - startTime;
      logger.info('PDF generated successfully', {
        operation: 'CV PDF generation',
        templateId,
        duration: `${duration}ms`,
        size: `${(pdfBuffer.length / 1024).toFixed(2)} KB`,
      });

      return pdfBuffer;
    } catch (error) {
      logger.logError(error, {
        operation: 'CV PDF generation',
        duration: `${Date.now() - startTime}ms`,
      });
      throw new FileError(`Failed to generate PDF: ${error.message}`);
    }
  }

  static async generateDOCX(cvData) {
    try {
      const children = [];

      this.addDOCXHeader(children, cvData);
      this.addDOCXSummary(children, cvData);
      this.addDOCXExperience(children, cvData);
      this.addDOCXEducation(children, cvData);
      this.addDOCXSkills(children, cvData);
      this.addDOCXProjects(children, cvData);
      this.addDOCXCertifications(children, cvData);

      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      });

      const buffer = await Packer.toBuffer(doc);
      return buffer;
    } catch (error) {
      logger.logError(error, {
        operation: 'DOCX generation',
      });
      throw new FileError(`Failed to generate DOCX: ${error.message}`);
    }
  }

  static addDOCXHeader(children, cvData) {
    if (cvData.personal?.name) {
      children.push(
        new Paragraph({
          text: cvData.personal.name,
          heading: HeadingLevel.TITLE,
          alignment: 'center',
        }),
      );
    }

    const contactInfo = this.buildContactInfo(cvData);
    if (contactInfo.length > 0) {
      children.push(
        new Paragraph({
          text: contactInfo.join(' | '),
          alignment: 'center',
          spacing: { after: DOCUMENT_FORMATTING.DOCX_SPACING_AFTER },
        }),
      );
    }
  }

  static addDOCXSummary(children, cvData) {
    if (cvData.summary) {
      children.push(
        new Paragraph({
          text: 'SUMMARY',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          text: cvData.summary,
          spacing: { after: DOCUMENT_FORMATTING.DOCX_SPACING_AFTER },
        }),
      );
    }
  }

  static addDOCXExperience(children, cvData) {
    if (cvData.experience && cvData.experience.length > 0) {
      children.push(new Paragraph({ text: 'EXPERIENCE', heading: HeadingLevel.HEADING_1 }));

      cvData.experience.forEach((exp) => {
        children.push(
          new Paragraph({
            text: `${exp.role} | ${exp.company}`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `${exp.startDate} - ${exp.endDate}`,
          }),
        );

        if (exp.bullets && exp.bullets.length > 0) {
          exp.bullets.forEach((bullet) => {
            children.push(
              new Paragraph({
                text: `• ${bullet}`,
                indent: { left: DOCUMENT_FORMATTING.DOCX_INDENT_LEFT },
              }),
            );
          });
        }

        children.push(new Paragraph({ text: '' }));
      });
    }
  }

  static addDOCXEducation(children, cvData) {
    if (cvData.education && cvData.education.length > 0) {
      children.push(new Paragraph({ text: 'EDUCATION', heading: HeadingLevel.HEADING_1 }));

      cvData.education.forEach((edu) => {
        children.push(
          new Paragraph({
            text: `${edu.degree} in ${edu.field}`,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: `${edu.institution} | ${edu.startDate} - ${edu.endDate}`,
          }),
          new Paragraph({ text: '' }),
        );
      });
    }
  }

  static addDOCXSkills(children, cvData) {
    if (cvData.skills) {
      children.push(new Paragraph({ text: 'SKILLS', heading: HeadingLevel.HEADING_1 }));

      if (cvData.skills.technical && cvData.skills.technical.length > 0) {
        children.push(
          new Paragraph({
            text: `Technical: ${cvData.skills.technical.join(', ')}`,
          }),
        );
      }

      if (cvData.skills.soft && cvData.skills.soft.length > 0) {
        children.push(
          new Paragraph({
            text: `Soft Skills: ${cvData.skills.soft.join(', ')}`,
          }),
        );
      }

      children.push(new Paragraph({ text: '' }));
    }
  }

  static addDOCXProjects(children, cvData) {
    if (cvData.projects && cvData.projects.length > 0) {
      children.push(new Paragraph({ text: 'PROJECTS', heading: HeadingLevel.HEADING_1 }));

      cvData.projects.forEach((project) => {
        children.push(
          new Paragraph({
            text: project.name,
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            text: project.description,
          }),
        );

        if (project.tech && project.tech.length > 0) {
          children.push(
            new Paragraph({
              text: `Tech: ${project.tech.join(', ')}`,
              indent: { left: DOCUMENT_FORMATTING.DOCX_INDENT_LEFT },
            }),
          );
        }

        children.push(new Paragraph({ text: '' }));
      });
    }
  }

  static addDOCXCertifications(children, cvData) {
    if (cvData.certifications && cvData.certifications.length > 0) {
      children.push(new Paragraph({ text: 'CERTIFICATIONS', heading: HeadingLevel.HEADING_1 }));

      cvData.certifications.forEach((cert) => {
        children.push(
          new Paragraph({
            text: `${cert.name} - ${cert.issuer} (${cert.date})`,
          }),
        );
      });
    }
  }
}

module.exports = CVGeneratorAdapter;


