// Quick container test
try {
    const { getContainer } = require('./backend/src/core/container/index.js');
    const container = getContainer();

    console.log('✅ Container initialized successfully');
    console.log(`📊 Registered services: ${Array.from(container._factories.keys()).length}`);

    // Test resolving key services
    const services = ['aiService', 'aiContentParserService', 'cvOptimizerService', 'atsFeedbackService'];
    services.forEach(service => {
        try {
            const instance = container.resolve(service);
            console.log(`✅ ${service}: Available`);
        } catch (e) {
            console.log(`❌ ${service}: Failed - ${e.message}`);
        }
    });

} catch (error) {
    console.error('❌ Container initialization failed:', error.message);
    process.exit(1);
}
