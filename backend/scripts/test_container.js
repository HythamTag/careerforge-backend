// Quick container test
try {
    const { getContainer } = require('../src/core/container/index.js');
    const container = getContainer();

    console.log('✅ Container initialized successfully');
    console.log(`📊 Registered services: ${Array.from(container._factories.keys()).length}`);

    // Test resolving key services
    const services = ['aiService', 'aiContentParserService', 'cvOptimizerService', 'atsFeedbackService'];
    
    for (const serviceName of services) {
        try {
            const service = container.resolve(serviceName);
            console.log(`✅ ${serviceName} resolved`);
        } catch (error) {
            console.log(`❌ ${serviceName} failed: ${error.message}`);
        }
    }

    console.log('\n✅ Container test complete');
    process.exit(0);
} catch (error) {
    console.error('❌ Container test failed:', error.message);
    process.exit(1);
}
