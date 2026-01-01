const path = require('path');
// Register aliases
const moduleAlias = require('module-alias');
moduleAlias.addAliases({
    '@core': path.join(__dirname, '../../../src/core'),
    '@utils': path.join(__dirname, '../../../src/core/utils'),
    '@constants': path.join(__dirname, '../../../src/core/constants'),
    '@config': path.join(__dirname, '../../../src/core/config'),
    '@errors': path.join(__dirname, '../../../src/core/errors')
});
// Manually mock logger
const mockLogger = {
    warn: () => { },
    info: () => { },
    debug: () => { },
    error: () => { }
};

// Override require to mock logger if needed, but easier is to depend on the file layout.
// Since cv-data-transformer.js does require('./core/logger'), and src/core/utils/core/logger.js exists, it should work.
// But we need to make sure we require the transformer from the rich path.

const transformerPath = path.resolve(__dirname, '../../../src/core/utils/cv-data-transformer.js');
console.log('Loading transformer from:', transformerPath);

try {
    const CVDataTransformer = require(transformerPath);

    // Test 1: Links Normalization
    console.log('Test 1: Normalizing Social Links...');
    const personalInfoInput = {
        firstName: 'John',
        linkedin: 'linkedin.com/in/test',
        website: 'test.com',
        links: []
    };
    const normalizedPersonal = CVDataTransformer.normalizePersonalInfo(personalInfoInput);

    const hasLinkedIn = normalizedPersonal.links.some(l => l.label === 'LinkedIn' && l.url === 'linkedin.com/in/test');
    const hasWebsite = normalizedPersonal.links.some(l => l.label === 'Website' && l.url === 'test.com');

    if (hasLinkedIn && hasWebsite) console.log('PASS: Links normalized correctly');
    else console.error('FAIL: Links normalization failed', normalizedPersonal.links);

    // Test 2: Skills Grouping
    console.log('Test 2: Grouping Skills...');
    const skillsInput = [
        { name: 'Java', category: 'Backend' },
        { name: 'React', category: 'Frontend' },
        'Communication',
        { category: 'Frontend', skills: ['CSS'] }
    ];

    const normalizedSkills = CVDataTransformer.normalizeSkills(skillsInput);

    // Check Backend
    const backend = normalizedSkills.find(s => s.category === 'Backend');
    const frontend = normalizedSkills.find(s => s.category === 'Frontend');
    const keySkills = normalizedSkills.find(s => s.category === 'Key Skills');

    let success = true;
    if (!backend || !backend.skills.includes('Java')) {
        console.error('FAIL: Backend skills missing Java');
        success = false;
    }
    if (!frontend || !frontend.skills.includes('React') || !frontend.skills.includes('CSS')) {
        console.error('FAIL: Frontend skills missing React or CSS');
        success = false;
    }
    if (!keySkills || !keySkills.skills.includes('Communication')) {
        console.error('FAIL: Key Skills missing Communication');
        success = false;
    }

    if (success) console.log('PASS: Skills grouped correctly');

} catch (err) {
    console.error('Test Crashed:', err);
}
