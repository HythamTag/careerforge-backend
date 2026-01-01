/**
 * CUSTOMIZATION VALIDATOR ADAPTER (Infrastructure Layer)
 * 
 * Single Responsibility: Validating template customization options
 * 
 * @module modules/generation/infrastructure/adapters/CustomizationValidator
 */

const { ValidationError } = require('@errors');
const { CUSTOMIZATION } = require('@constants');

class CustomizationValidator {
  constructor() {
    // Valid customization options from centralized constants
    this.validFonts = CUSTOMIZATION.VALID_FONTS;
    this.validSections = CUSTOMIZATION.VALID_SECTIONS;
  }

  /**
     * Validate customization options
     * 
     * @param {Object} customization - Customization options to validate
     * @returns {boolean} True if valid
     * @throws {ValidationError} If validation fails
     */
  validate(customization) {
    if (!customization || typeof customization !== 'object') {
      return true; // Empty customization is valid (will use defaults)
    }

    // Validate primary color (hex color)
    if (customization.primaryColor) {
      this._validateColor(customization.primaryColor);
    }

    // Validate font family
    if (customization.fontFamily) {
      this._validateFont(customization.fontFamily);
    }

    // Validate section order
    if (customization.sectionOrder) {
      this._validateSectionOrder(customization.sectionOrder);
    }

    return true;
  }

  /**
     * Validate hex color format
     * @private
     */
  _validateColor(color) {
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new ValidationError(
        'Primary color must be a valid hex color (e.g., #2563eb)',
        'primaryColor',
      );
    }
  }

  /**
     * Validate font family
     * @private
     */
  _validateFont(fontFamily) {
    if (!this.validFonts.includes(fontFamily)) {
      throw new ValidationError(
        `Font family must be one of: ${this.validFonts.join(', ')}`,
        'fontFamily',
      );
    }
  }

  /**
     * Validate section order
     * @private
     */
  _validateSectionOrder(sectionOrder) {
    if (!Array.isArray(sectionOrder)) {
      throw new ValidationError('Section order must be an array', 'sectionOrder');
    }

    // Check for invalid sections
    const invalidSections = sectionOrder.filter(
      (section) => !this.validSections.includes(section),
    );

    if (invalidSections.length > 0) {
      throw new ValidationError(
        `Invalid sections in order: ${invalidSections.join(', ')}`,
        'sectionOrder',
      );
    }
  }
}

module.exports = CustomizationValidator;


