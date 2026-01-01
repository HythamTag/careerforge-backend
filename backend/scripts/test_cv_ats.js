// Quick cv-ats module test
try {
    const { getContainer } = require('../src/core/container/index.js');
    const container = getContainer();

    console.log('✅ Container initialized');

    const service = container.resolve('cvAtsService');
    const analysisService = container.resolve('cvAtsAnalysisService');

    console.log('✅ cvAtsService resolved');
    console.log('✅ cvAtsAnalysisService resolved');

    console.log('\n✅ CV-ATS module test complete');
    process.exit(0);
} catch (error) {
    console.error('❌ CV-ATS test failed:', error.message);
    process.exit(1);
}
