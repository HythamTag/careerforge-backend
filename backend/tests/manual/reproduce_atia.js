const moduleAlias = require('module-alias');
const path = require('path');

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

const mockLogger = {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: (msg, meta) => console.log(`[DEBUG] ${msg}`, meta || ''),
    error: (msg, meta) => console.error(`[ERROR] ${msg}`, meta || '')
};

const atiaText = `
Ahmed Atia
Untitled CV
atyaa629@gmail.com
+20 111 791 0989
Egypt
LinkedIn
GitHub
Frontend Developer with a B.Sc. in Computer Science and graduate of the ITI MERN Stack program, with practical experience building responsive, high-performance web applications using React.js, Next.js, and TypeScript. Strong understanding of clean architecture, OOP, and design principles. Skilled in writing maintainable code and collaborating in agile teams to deliver great user experiences

Experience
Frontend Developer
ICTHUB • Cairo, Egypt
Jul 2023 - Sep 2023
Promoted from trainee to developer within weeks due to exceptional technical and problem-solving skills. Developed and maintained responsive, interactive interfaces using React.js and modern UI frameworks. Enhanced project UI performance and accessibility, ensuring alignment with WCAG and UX best practices.
Frontend Developer
Developer99
Jan 2023 - Present
Graduation Project (Frontend Role) Demo Video. Collaborated on a full-stack developer community platform; graded Excellent upon completion. Led frontend development using React.js and REST APIs with structured state management.
Education
Bachelor’s degree in computer science
Elshrouk Academy • Cairo
Jan 2019 - Jan 2023
Graduation Project: Developer99 — Earned Excellent Grade
Developer99 • Cairo
Invalid Date - Invalid Date
Information Technology Institute (ITI) MERN Stack
ITI • Cairo
Jul 2025 - Dec 2025
Skills
Frontend
React.js, Next.js, TypeScript, JavaScript (ES6+), Redux, Tailwind CSS, Shadcn UI, Material UI, Sass, UI/UX & Animation: Framer Motion, GSAP, Three.js, Responsive Design, Performance Optimization, Clean Architecture, OOP, SOLID
Tools
Git, GitHub, Vercel, Webpack, Vite, Postman, NextAuth.js, Sentry
Backend
Node.js, Express.js, MongoDB, Firebase
Key Skills
Agile Development, RESTful APIs, Design Patterns, OOP, Performance Optimization
Projects
Exclusive Store
Full-Stack E-Commerce App Live Demo | GitHub Developed an end-to-end e-commerce platform using React.js, Node.js, Express, and MongoDB. Boosted page performance by 25% through React optimization, lazy loading, and memorization. Implemented modular architecture for maintainability and seamless backend integration.
Technologies: React.js, Node.js, Express, MongoDB
GitHub
YC-Dictionary
Frontend Project Live Demo | GitHub Built a modern, responsive dictionary web app using Next.js and Sanity CMS. Designed intuitive UI/UX layouts with adaptive design and accessible navigation. Implemented CMS-driven content updates to ensure scalability.
Technologies: Next.js, Sanity CMS
GitHub
Publications
Exclusive Store — Full-Stack E-Commerce App Live Demo
GitHub
YC-Dictionary — Frontend Project Live Demo
GitHub
Languages
English: Fluent
Arabic: Native
`;

const { Ollama } = require('ollama');

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
            // Simple JSON extraction
            const jsonMatch = response.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return JSON.parse(response);
        } catch (e) {
            return null;
        }
    }
}

async function run() {
    const aiService = new MockOllamaService();
    // Constructor expects aiService
    const parser = new AIContentParserService(aiService);

    await parser.initialize();

    // Inject prompts manually to bypass file loading issues in test env
    parser.prompts = {
        chunk_profile: `
You are an expert CV parser. Extract the following sections from the CV text below.
Return strictly valid JSON.

SECTIONS TO EXTRACT:
1. personalInfo (firstName, lastName, email, phone, country, city, links: [{label, url}])
2. professionalSummary (string)
3. education (Array: degree, institution, location, startDate, endDate, current, description)
4. languages (Array: name, proficiency)

RULES:
- Handle "Contact" or header lines to find email/phone/links.
- Look for pipe-separated values (e.g. "Email | Phone | City, Country") in the header.
- "links" should include LinkedIn, GitHub, Portfolio, Website.
- Split Name into firstName/lastName.
- EDUCATION RULES:
  - Extract Degrees (B.Sc., M.Sc., Bachelor's) and Universities.
  - CRITICAL: IGNORE "Graduation Project" lines.
  - CRITICAL: IGNORE entries that look like "Experience" or have "Invalid Date".
  - CRITICAL: Education must have a clear Degree and Institution name.
- Dates: Use "MM/YYYY" or "YYYY".
- Do NOT hallucinate. If not found, ignore.
- Output JSON ONLY.

CV TEXT:
{{cvText}}
`,
        chunk_experience: `
You are an expert CV parser. Extract the following sections from the CV text below.
Return strictly valid JSON.

SECTIONS TO EXTRACT:
1. workExperience (Array: title, company, location, startDate, endDate, current, description)
2. projects (Array: title, description, url, technologies)

RULES:
- Focus ONLY on Work History and Projects.
- "description" should catch bullet points. Keep them as a single string joined by newlines, or a proper paragraph.
- If technologies are listed in a project, extract them as an array of strings.
- Dates: Use "MM/YYYY" or "YYYY".
- Do NOT hallucinate. If not found, ignore.
- Output JSON ONLY.

CV TEXT:
{{cvText}}
`,
        chunk_credentials: `
You are an expert CV parser. Extract the following sections from the CV text below.
Return strictly valid JSON.

SECTIONS TO EXTRACT:
1. skills (Array: { category, skills: [] }). Group by category (e.g., Languages, Tools, Frameworks).
2. certifications (Array: name, company, date, description, url)
3. publications (Array: title, publisher, date, description, url)
4. volunteer (Array: organization, role, startDate, endDate, description)

RULES:
- Focus ONLY on Skills, Certifications, Publications, Awards/Volunteer.
- Skills: Group them logically (e.g., "Frontend", "Backend", "Tools"). If unsure, use "Key Skills".
- PUBLICATIONS RULES:
  - CRITICAL: IGNORE any entry where the publisher is "GitHub", "Vercel", "Live Demo", "Link", or "Self-Published".
  - CRITICAL: IGNORE software projects, websites, or apps.
  - ONLY include academic papers, books, journals, or conference proceedings (e.g., IEEE, ACM, Springer).
  - If a section is titled "Publications" but lists projects, IGNORE IT.
- Do NOT hallucinate.
- Output JSON ONLY.

CV TEXT:
{{cvText}}
`
    };

    console.log('Parser initialized. Loaded prompts:', Object.keys(parser.prompts || {}));
    console.log('Running chunked parsing...');

    // Use private method _parseCV_Chunked directly if possible, or parseContent
    // Accessing private method via bracket notation for testing
    const result = await parser['_parseCV_Chunked'](atiaText, mockLogger);

    console.log('--- RAW RESPONSE ---');
    console.log(result.rawResponse);
    console.log('--- PARSED RESULT (Before Cleaning) ---');
    console.log(JSON.stringify(result.parsedContent, null, 2));

    const cleaned = CVDataTransformer.normalize(result.parsedContent);
    console.log('--- CLEANED RESULT (After Cleaning) ---');
    console.log(JSON.stringify(cleaned, null, 2));
}

run().catch(console.error);
