// Quick cv-ats module test
try {
    const { getContainer } = require('./backend/src/core/container/index.js');
    const container = getContainer();

    console.log('✅ Container initialized');

    const service = container.resolve('cvAtsService');
    const analysisService = container.resolve('cvAtsAnalysisService');

    console.log('✅ cvAtsService resolved successfully');
    console.log('✅ cvAtsAnalysisService resolved successfully');

    console.log('🎉 CV-ATS module test passed!');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

