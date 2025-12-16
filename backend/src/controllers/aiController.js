/**
 * AI enhancement controller
 * Owner: Backend Leader
 */

const AIService = require("../services/aiService");

class AIController {
  static enhanceSection(req, res) {
    const { sectionText, sectionType } = req.body || {};

    if (!sectionText || !sectionType) {
      return res.status(400).json({
        success: false,
        error: {
          code: "AI_INVALID_INPUT",
          message: "sectionText and sectionType are required",
        },
      });
    }

    try {
      const result = AIService.enhanceSection(sectionText, sectionType);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: {
          code: "AI_ENHANCEMENT_FAILED",
          message: error.message,
        },
      });
    }
  }
}

module.exports = AIController;
