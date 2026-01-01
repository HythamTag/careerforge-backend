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
const PDFService = require('../../src/shared/external/pdf/PDFService');
const PDFValidator = require('../../src/shared/external/pdf/PDFValidator');
const CVDataTransformer = require('../../src/core/utils/cv-data-transformer');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const SAMPLES_DIR = 'c:/Users/Tag/Desktop/Careerforg ITI GRADUATION PROJECT/CV Enhancer/samples';

const mockLogger = {
    info: () => { },
    warn: console.warn,
    error: console.error,
    debug: () => { }
};

// Mock AIService
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

// Mock Config for PDF Service
const mockConfig = {
    fileLimits: {
        maxPages: 50,
        maxSize: 10 * 1024 * 1024
    }
};

async function getSampleCVs() {
    try {
        const items = await fs.readdir(SAMPLES_DIR, { withFileTypes: true });
        const results = [];

        for (const item of items) {
            if (item.isDirectory()) {
                const subDir = path.join(SAMPLES_DIR, item.name);
                const files = await fs.readdir(subDir);
                const pdf = files.find(f => f.toLowerCase().endsWith('.pdf'));
                if (pdf) {
                    results.push({
                        name: item.name,
                        path: path.join(subDir, pdf)
                    });
                }
            }
        }
        return results;
    } catch (e) {
        console.error('Failed to list samples:', e);
        return [];
    }
}

async function processSample(cvFile, pdfService, parser) {
    console.log(`\nProcessing: ${cvFile.name}`);

    try {
        const fileBuffer = await fs.readFile(cvFile.path);

        // 1. Extract Text
        console.log('  [1/3] Extracting text...');
        const extractResult = await pdfService.extractText(fileBuffer);
        const text = extractResult.text;

        if (!text || text.length < 50) {
            console.log('  [SKIP] Extracted text too short.');
            return;
        }

        // 2. Parse with AI
        console.log('  [2/3] Parsing (Chunked)...');
        const start = Date.now();
        const result = await parser['_parseCV_Chunked'](text, mockLogger);
        const duration = ((Date.now() - start) / 1000).toFixed(1);

        // 3. Transform & Clean
        console.log(`  [3/3] Transforming (Time: ${duration}s)...`);
        const cleaned = CVDataTransformer.normalize(result.parsedContent);

        // 4. Report
        console.log(`  [REPORT]`);
        console.log(`  - Education: ${cleaned.education.length}`);
        console.log(`  - Experience: ${cleaned.workExperience.length}`);
        console.log(`  - Projects: ${cleaned.projects.length}`);
        console.log(`  - Publications: ${cleaned.publications.length}`);

        // 5. Detect Issues
        const badPubs = cleaned.publications.filter(p => (p.publisher || '').match(/github|demo/i));
        const badEdu = cleaned.education.filter(e => (e.degree || '').match(/graduation/i));

        if (badPubs.length > 0) console.error('  [FAIL] GitHub links in Publications!');
        if (badEdu.length > 0) console.error('  [FAIL] Graduation Project in Education!');

        if (badPubs.length === 0 && badEdu.length === 0) {
            console.log('  [PASS] Clean parsing.');
        }

    } catch (e) {
        console.error(`  [ERROR] Failed: ${e.message}`);
    }
}

async function run() {
    console.log('Starting Generalization Testing on Samples...');

    // Services
    const aiService = new MockOllamaService();
    const parser = new AIContentParserService(aiService);
    const validator = new PDFValidator(mockConfig, mockLogger);
    const pdfService = new PDFService(mockConfig, mockLogger, validator);

    await parser.initialize();

    const samples = await getSampleCVs();
    console.log(`Found ${samples.length} valid PDF samples.`);

    // Limit to first 5 samples to avoid 20-minute run, unless user wants ALL.
    // User said "use them for your checks", implying a decent cover. 
    // I will run 5 first to verify speed/success.
    const samplesToRun = samples.slice(0, 5);

    for (const sample of samplesToRun) {
        await processSample(sample, pdfService, parser);
    }

    console.log('\nGeneralization Testing Complete (Subset of 5).');
}

run().catch(console.error);
