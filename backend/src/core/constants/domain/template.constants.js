/**
 * ============================================================================
 * template.constants.js - Template Constants (Pure Static)
 * ============================================================================
 */

const TEMPLATES = Object.freeze({
  modern: Object.freeze({
    id: 'modern',
    name: 'Modern',
    description: 'Clean two-column layout with accent colors',
    atsScore: 95,
    preview: '/templates/previews/modern.png',
  }),
  professional: Object.freeze({
    id: 'professional',
    name: 'Professional',
    description: 'Traditional single-column corporate style',
    atsScore: 98,
    preview: '/templates/previews/professional.png',
  }),
  minimal: Object.freeze({
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple text-focused design',
    atsScore: 100,
    preview: '/templates/previews/minimal.png',
  }),
});

const CUSTOMIZATION = Object.freeze({
  VALID_FONTS: Object.freeze([
    'Inter, system-ui, sans-serif',
    'Arial, sans-serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Times New Roman, serif',
  ]),
  VALID_SECTIONS: Object.freeze([
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'publications',
    'languages',
  ]),
  TEMPLATE_CATEGORIES: Object.freeze([
    'professional',
    'modern',
    'creative',
    'minimal',
    'classic',
  ]),
  ATS_SCORE_MIN: 0,
  ATS_SCORE_MAX: 100,
  FONT_SIZE_MIN: 8,
  FONT_SIZE_MAX: 24,
  LINE_SPACING_MIN: 1.0,
  LINE_SPACING_MAX: 2.0,
  SECTION_SPACING_MIN: 0,
  SECTION_SPACING_MAX: 100,
  MARGIN_MIN: 0,
  HEX_COLOR_REGEX: /^#[0-9A-F]{6}$/i,
});

// Default customization values (single source of truth)
const DEFAULT_CUSTOMIZATION = Object.freeze({
  primaryColor: '#4F46E5',
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: '11pt',
  lineHeight: '1.5',
  sectionOrder: Object.freeze([
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'publications',
    'languages',
  ]),
});

module.exports = {
  TEMPLATES,
  CUSTOMIZATION,
  DEFAULT_CUSTOMIZATION,
};
