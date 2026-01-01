const fs = require('fs').promises;
const path = require('path');
const moduleAlias = require('module-alias');
const { Ollama } = require('ollama');

// Register aliases
moduleAlias.addAliases({
    '@config': path.join(__dirname, '../../src/core/config'),
    '@utils': path.join(__dirname, '../../src/core/utils'),
    '@modules': path.join(__dirname, '../../src/modules'),
    '@shared': path.join(__dirname, '../../src/shared'),
    '@constants': path.join(__dirname, '../../src/core/constants'),
    '@errors': path.join(__dirname, '../../src/core/errors')
});

const AIContentParserService = require('../../src/modules/cv-parsing/services/ai-content-parser.service');
const CVDataTransformer = require('../../src/core/utils/cv-data-transformer');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const LOGS_DIR = 'c:/Users/Tag/Desktop/Careerforg ITI GRADUATION PROJECT/CV Enhancer/backend/logs/cvs';

const mockLogger = {
    info: () => { },
    warn: console.warn,
    error: console.error,
    debug: () => { }
};

// Mock AIService that wraps Ollama
class MockOllamaService {
    constructor() {
        this.ollama = new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' });
    }

    async callAI(messages, options) {
        try {
            const response = await this.ollama.chat({
                model: 'gemma2:2b',
                messages: messages,
                format: options.format,
                options: {
                    temperature: options.temperature,
                    num_ctx: 8192,
                    num_predict: options.maxTokens
                }
            });
            return response.message.content;
        } catch (error) {
            console.error('[AI SERVICE ERROR]', error);
            throw error;
        }
    }

    async parseJSONResponse(response) {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return JSON.parse(response);
        } catch (e) {
            return null;
        }
    }
}

async function getCVs() {
    console.log('[DEBUG] Looking for logs in:', LOGS_DIR);
    try {
        const dirs = await fs.readdir(LOGS_DIR, { withFileTypes: true });
        return dirs.filter(d => d.isDirectory()).map(d => path.join(LOGS_DIR, d.name));
    } catch (e) {
        console.error('Failed to list CVs:', e);
        return [];
    }
}

async function processCV(cvDir, parser) {
    const name = path.basename(cvDir);
    console.log(`\nProcessing: ${name}`);

    try {
        const textPath = path.join(cvDir, 'extracted_text.txt');
        const text = await fs.readFile(textPath, 'utf8');

        // Check if text is valid
        if (!text || text.length < 50) {
            console.log('  [SKIP] Text too short or empty.');
            return;
        }

        const start = Date.now();
        // Use PRIVATE method _parseCV_Chunked to force the specific strategy we are testing
        const result = await parser['_parseCV_Chunked'](text, mockLogger);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        const cleaned = CVDataTransformer.normalize(result.parsedContent);

        console.log(`  [DONE] Time: ${duration}s`);
        console.log(`  - Education: ${cleaned.education.length} items`);
        console.log(`  - Experience: ${cleaned.workExperience.length} items`);
        console.log(`  - Projects: ${cleaned.projects.length} items`);
        console.log(`  - Skills (Cats): ${cleaned.skills.length} categories`);
        console.log(`  - Publications: ${cleaned.publications.length} items`);

        // Validation Checks
        if (cleaned.publications.length > 0) {
            const suspectPubs = cleaned.publications.filter(p =>
                (p.publisher || '').match(/github|vercel|demo/i) ||
                (p.title || '').match(/demo|github/i)
            );
            if (suspectPubs.length > 0) {
                console.error('  [FAIL] Suspicious Publications found:', suspectPubs);
            } else {
                console.log('  [PASS] Publications look valid.');
            }
        }

        if (cleaned.education.length > 0) {
            const suspectEdu = cleaned.education.filter(e =>
                (e.degree || '').match(/graduation/i) ||
                (e.institution || '').match(/graduation/i)
            );
            if (suspectEdu.length > 0) {
                console.error('  [FAIL] Suspicious Education found (Graduation Project?):', suspectEdu);
            } else {
                console.log('  [PASS] Education looks valid.');
            }
        }

    } catch (e) {
        if (e.code === 'ENOENT') {
            console.log('  [SKIP] No extracted_text.txt found.');
        } else {
            console.error(`  [ERROR] Failed to process ${name}:`, e.message);
        }
    }
}

async function run() {
    console.log('Starting Bulk CV Verification...');
    const aiService = new MockOllamaService();
    const parser = new AIContentParserService(aiService);
    await parser.initialize();

    // Inject the SAME production prompts we just verified
    // (Ideally we load from file, but to be consistent with duplicate_atia.js, I will inject them 
    // OR we can rely on the service to load them since I updated the file on disk?
    // Wait, I updated the files on disk! So I SHOULD let the service load them naturally.
    // If the service loads them, we test the ACTUAL deployment state.)

    // HOWEVER, duplicate_atia.js failed to load files because of path resolution.
    // I need to ensure `ai-content-parser.service.js` finds the files.
    // The service uses `path.join(__dirname, '../../../shared/external/ai/prompts/multipass')`.
    // Since I am running the script from `backend/tests/manual/`, the service is required from `../../src/...`.
    // `__dirname` inside the service file refers to the service file's location, so it SHOULD work.
    // The previous failure in `reproduce_atia.js` might have been due to my manual hacking or environment.
    // I will TRY to let it load naturally. If it fails, I will fix the loading paths.

    const cvDirs = await getCVs();
    console.log(`Found ${cvDirs.length} potential CV directories.`);

    for (const dir of cvDirs) {
        await processCV(dir, parser);
    }

    console.log('\nBulk Verification Complete.');
}

run().catch(console.error);
