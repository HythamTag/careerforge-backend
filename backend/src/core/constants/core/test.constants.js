/**
 * ============================================================================
 * test.constants.js - Test & Mock Data Constants (Pure Static)
 * ============================================================================
 */

/**
 * Mock AI Provider Delay
 * Simulated processing time for mock/testing purposes
 */
const MOCK_PROVIDER_DELAY_MS = 1000;

/**
 * Processing Sample Data
 * Default values for sample/mock processing operations
 */
const PROCESSING_SAMPLES = Object.freeze({
    /**
     * Sample processing time for mock operations (2.5 seconds)
     * Simulates realistic AI processing delay
     */
    PROCESSING_TIME_MS: 2500,

    /**
     * Sample start date for date range examples
     * '2020-01' - January 2020
     */
    START_DATE: '2020-01',

    /**
     * Sample end date for date range examples
     * '2023-12' - December 2023
     */
    END_DATE: '2023-12',

    /**
     * Sample confidence score percentage
     * 85% - represents high confidence in analysis
     */
    CONFIDENCE_SCORE: 85,
});

module.exports = {
    MOCK_PROVIDER_DELAY_MS,
    PROCESSING_SAMPLES,
};
