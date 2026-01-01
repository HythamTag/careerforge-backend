/**
 * PARSER STRATEGY REGISTRY
 *
 * Manages available parsing strategies and selects appropriate parser for file types.
 *
 * @module modules/cv-parsing/strategies/parser-strategy.registry
 */

const PDFParserStrategy = require('./pdf-parser.strategy');
const DOCXParserStrategy = require('./docx-parser.strategy');
const { ValidationError } = require('@errors');
const { ERROR_CODES } = require('@constants');

class ParserStrategyRegistry {
  constructor() {
    this.strategies = new Map();
    this._initializeStrategies();
  }

  _initializeStrategies() {
    // Register available parsing strategies
    this.register(new PDFParserStrategy());
    this.register(new DOCXParserStrategy());

    // this.register(new ImageParserStrategy());
    // this.register(new OCRParserStrategy());
    // this.register(new HTMLParserStrategy());
  }

  register(strategy) {
    if (!strategy.name) {
      throw new ValidationError('Strategy must have a name', ERROR_CODES.VALIDATION_ERROR);
    }
    this.strategies.set(strategy.name, strategy);
  }

  getStrategy(name) {
    return this.strategies.get(name);
  }

  getAllStrategies() {
    return Array.from(this.strategies.values());
  }

  getStrategyForFile(mimeType) {
    for (const strategy of this.strategies.values()) {
      if (strategy.canHandle(mimeType)) {
        return strategy;
      }
    }
    return null;
  }

  getSupportedTypes() {
    const types = new Set();
    for (const strategy of this.strategies.values()) {
      strategy.supportedTypes.forEach(type => types.add(type));
    }
    return Array.from(types);
  }

  hasStrategyForType(mimeType) {
    return this.getStrategyForFile(mimeType) !== null;
  }
}

module.exports = ParserStrategyRegistry;
