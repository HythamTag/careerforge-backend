/**
 * DEPENDENCY INJECTION CONTAINER
 *
 * Centralized dependency injection following DIP.
 * 
 * @module container
 */

const fs = require('fs');
const path = require('path');
const logger = require('@utils/logger');

class Container {
  constructor() {
    this._instances = new Map();
    this._factories = new Map();
    this._initialized = false;
  }

  register(name, factory) {
    this._factories.set(name, factory);
  }

  resolve(name) {
    if (this._instances.has(name)) {
      return this._instances.get(name);
    }

    if (this._factories.has(name)) {
      const factory = this._factories.get(name);
      const instance = factory(this);
      this._instances.set(name, instance);
      return instance;
    }

    const { AppError } = require('@errors');
    const { ERROR_CODES, HTTP_STATUS } = require('@constants');
    throw new AppError(`Dependency '${name}' not registered in container`, HTTP_STATUS.INTERNAL_SERVER_ERROR, ERROR_CODES.CONFIGURATION_ERROR);
  }

  has(name) {
    return this._instances.has(name) || this._factories.has(name);
  }

  getRegisteredServices() {
    return Array.from(this._factories.keys());
  }

  initialize() {
    if (this._initialized) {
      return;
    }

    this._registerCoreServices();
    this._initialized = true;

    logger.debug('Dependency container initialized', {
      operation: 'Container initialization',
      registeredServices: Array.from(this._factories.keys()),
    });
  }

  _registerCoreServices() {
    // ========================================
    // AI SERVICES
    // ========================================
    this.register('aiValidator', (container) => {
      const { AIValidator } = require('@ai');
      const config = require('@config');
      return new AIValidator(config);
    });

    // GENERIC PROVIDER (Fallback)
    this.register('aiProvider', () => {
      const { AIProviderFactory } = require('@ai');
      return AIProviderFactory.createFromEnv();
    });

    // OLLAMA PARSER PROVIDER (Fast - Port 11434)
    this.register('ollamaParserProvider', () => {
      const { OllamaProvider } = require('@ai/providers');
      const config = require('@config');
      return new OllamaProvider({
        host: config.ai.ollama.hosts.parser,
        model: config.ai.models.parser.ollama,
        timeout: config.ai.ollama.timeout
      });
    });

    // OLLAMA OPTIMIZER PROVIDER (Heavy - Port 11435)
    this.register('ollamaOptimizerProvider', () => {
      const { OllamaProvider } = require('@ai/providers');
      const config = require('@config');
      return new OllamaProvider({
        host: config.ai.ollama.hosts.optimizer,
        model: config.ai.models.optimizer.ollama,
        timeout: config.ai.ollama.timeout
      });
    });

    // OLLAMA ATS PROVIDER (Analytical - Port 11436)
    this.register('ollamaAtsProvider', () => {
      const { OllamaProvider } = require('@ai/providers');
      const config = require('@config');
      return new OllamaProvider({
        host: config.ai.ollama.hosts.ats,
        model: config.ai.models.ats.ollama,
        timeout: config.ai.ollama.timeout
      });
    });

    // AI SERVICE - PARSER
    this.register('aiServiceParser', (container) => {
      const { AIService } = require('@ai');
      const config = require('@config');
      const provider = config.ai.provider === 'ollama'
        ? container.resolve('ollamaParserProvider')
        : container.resolve('aiProvider');

      return new AIService(
        provider,
        container.resolve('aiValidator'),
        require('@ai').JSONParser,
        config
      );
    });

    // AI SERVICE - OPTIMIZER
    this.register('aiServiceOptimizer', (container) => {
      const { AIService } = require('@ai');
      const config = require('@config');

      let provider;
      if (config.ai.provider === 'ollama') {
        provider = container.resolve('ollamaOptimizerProvider');
      } else {
        provider = container.resolve('aiProvider');
      }

      return new AIService(
        provider,
        container.resolve('aiValidator'),
        require('@ai').JSONParser,
        config
      );
    });

    // AI SERVICE - ATS (New Service for ATS Logic)
    this.register('aiServiceAts', (container) => {
      const { AIService } = require('@ai');
      const config = require('@config');

      let provider;
      if (config.ai.provider === 'ollama') {
        provider = container.resolve('ollamaAtsProvider');
      } else {
        provider = container.resolve('aiProvider');
      }

      return new AIService(
        provider,
        container.resolve('aiValidator'),
        require('@ai').JSONParser,
        config
      );
    });

    // DEFAULT AI SERVICE (Aliased to Optimizer)
    this.register('aiService', (container) => {
      return container.resolve('aiServiceOptimizer');
    });

    this.register('textCleanerService', () => {
      const { StringCleaner } = require('@utils');
      return {
        clean: (text) => StringCleaner.removeControlCharacters(text),
      };
    });

    // ========================================
    // AI CONTENT PARSING SERVICE
    // ========================================
    this.register('aiContentParserService', (container) => {
      const AIContentParserService = require('@modules/cv-parsing/services/ai-content-parser.service');
      // Inject explicit PARSER service
      return new AIContentParserService(container.resolve('aiServiceParser'));
    });

    // ========================================
    // LEGACY CV PARSER SERVICE (Wrapper)
    // ========================================
    this.register('cvParserService', (container) => {
      const aiContentParser = container.resolve('aiContentParserService');
      return {
        parse: async (text) => {
          return await aiContentParser.parseContent(text);
        },
      };
    });


    // ========================================
    // FILE SERVICES
    // ========================================
    // ========================================
    // STORAGE SERVICES
    // ========================================
    this.register('storageValidator', (container) => {
      const { StorageValidator } = require('@storage');
      const config = require('@config');
      return new StorageValidator(config);
    });

    this.register('storageProviderFactory', (container) => {
      const { StorageProviderFactory } = require('@storage');
      const config = require('@config');
      const logger = require('@utils/logger');
      return StorageProviderFactory.createFromEnv(config, logger);
    });

    this.register('storageService', (container) => {
      const { StorageService } = require('@storage');
      return new StorageService(
        container.resolve('storageProviderFactory'),
        container.resolve('storageValidator'),
        require('@utils/logger')
      );
    });

    // Alias for backward compatibility
    this.register('fileService', (container) => {
      return container.resolve('storageService');
    });

    // ========================================
    // PDF SERVICES
    // ========================================
    this.register('pdfValidator', (container) => {
      const { PDFValidator } = require('@pdf');
      const config = require('@config');
      return new PDFValidator(config);
    });

    this.register('pdfService', (container) => {
      const { PDFService } = require('@pdf');
      const config = require('@config');
      const logger = require('@utils/logger');
      return new PDFService(
        config,
        logger,
        container.resolve('pdfValidator')
      );
    });

    // ========================================
    // AI SERVICES
    // ========================================
    // ========================================
    // CV OPTIMIZER SERVICE
    // ========================================
    this.register('cvOptimizerService', (container) => {
      const CVOptimizerService = require('@modules/cv-optimizer/services/cv-optimizer.service');
      // Inject explicit OPTIMIZER service
      return new CVOptimizerService(container.resolve('aiServiceOptimizer'));
    });

    // ========================================
    // CV ATS ANALYSIS SERVICE
    // ========================================
    this.register('cvAtsAnalysisService', (container) => {
      const CvAtsAnalysisService = require('@modules/cv-ats/services/cv-ats-analysis.service');
      // Inject explicit ATS service
      return new CvAtsAnalysisService(container.resolve('aiServiceAts'));
    });

    // ========================================
    // CV ATS SERVICE
    // ========================================
    this.register('cvAtsService', (container) => {
      const CvAtsService = require('@modules/cv-ats/services/cv-ats.service');
      return new CvAtsService(
        container.resolve('cvAtsRepository'),
        container.resolve('jobService'),
        container.resolve('cvRepository'),
        container.resolve('cvAtsAnalysisService'),
        container.resolve('cvVersionRepository'),
      );
    });

    // ========================================
    // CV ATS REPOSITORY
    // ========================================
    this.register('cvAtsRepository', () => {
      const CvAtsRepository = require('@modules/cv-ats/repositories/cv-ats.repository');
      return new CvAtsRepository();
    });

    // ========================================
    // TEMPLATE SERVICES
    // ========================================
    this.register('templateCache', () => {
      const TemplateCache = require('@pdf/adapters/template-cache.adapter');
      return new TemplateCache();
    });

    this.register('templateLoader', (c) => {
      const TemplateLoader = require('@pdf/adapters/template-loader.adapter');
      return new TemplateLoader(c.resolve('templateCache'));
    });

    this.register('customizationValidator', () => {
      const CustomizationValidator = require('@pdf/adapters/customization-validator.adapter');
      return new CustomizationValidator();
    });

    this.register('templateRenderer', (container) => {
      const TemplateRenderer = require('@pdf/adapters/template-renderer.adapter');
      return new TemplateRenderer(
        container.resolve('templateLoader'),
        container.resolve('customizationValidator'),
      );
    });

    // ========================================
    // PDF GENERATION SERVICES
    // ========================================
    this.register('browserManager', () => {
      const BrowserManagerAdapter = require('@pdf/adapters/browser-manager.adapter');
      const config = require('@config');
      const { FILE_LIMITS } = require('@constants');
      return new BrowserManagerAdapter({
        timeout: FILE_LIMITS.DOCUMENT_GENERATION_TIMEOUT_MS,
        dockerEndpoint: config.puppeteer.wsEndpoint,
      });
    });

    this.register('pdfGenerator', (container) => {
      const PdfGeneratorAdapter = require('@pdf/adapters/pdf-generator.adapter');
      return new PdfGeneratorAdapter(container.resolve('browserManager'));
    });

    this.register('cvGeneratorService', () => {
      const CVGeneratorAdapter = require('@pdf/adapters/cv-generator.adapter');
      return CVGeneratorAdapter;
    });


    // ========================================
    // CV PARSING MODULE STRATEGIES
    // ========================================
    this.register('parserStrategyRegistry', () => {
      const ParserStrategyRegistry = require('@modules/cv-parsing/strategies/parser-strategy.registry');
      return new ParserStrategyRegistry();
    });

    // ========================================
    // CV PARSING MODULE SERVICE
    // ========================================
    this.register('cvParsingService', (container) => {
      const CVParsingService = require('@modules/cv-parsing/services/cv-parsing.service');
      return new CVParsingService(
        container.resolve('cvParsingRepository'),
        container.resolve('jobService'),
        container.resolve('cvRepository'),
        container.resolve('fileService'),
        container.resolve('aiContentParserService'),
        container.resolve('parserStrategyRegistry'),
        container.resolve('cvVersionRepository')
      );
    });

    // ========================================
    // CV PARSING CONTROLLER
    // ========================================
    this.register('cvParsingController', (container) => {
      const CVParsingController = require('@modules/cv-parsing/controllers/cv-parsing.controller');
      return new CVParsingController(
        container.resolve('cvParsingService'),
        container.resolve('cvParsingRepository')
      );
    });

    // ========================================
    // CV PARSING REPOSITORY
    // ========================================
    this.register('cvParsingRepository', () => {
      const CVParsingRepository = require('@modules/cv-parsing/repositories/cv-parsing.repository');
      return new CVParsingRepository();
    });

    // ========================================
    // JOBS MODULE SERVICE
    // ========================================
    this.register('jobRepository', () => {
      const JobRepository = require('@modules/jobs/repositories/job.repository');
      return new JobRepository();
    });

    this.register('jobService', (container) => {
      const JobService = require('@modules/jobs/services/job.service');
      const logger = require('@utils/logger');
      return new JobService({
        jobRepository: container.resolve('jobRepository'),
        queueService: container.resolve('queueService'),
        logger: logger,
      });
    });

    // ========================================
    // CVS MODULE SERVICES
    // ========================================
    this.register('cvRepository', () => {
      const CVRepository = require('@modules/cvs/repositories/cv.repository');
      return new CVRepository();
    });

    this.register('cvService', (container) => {
      const CVService = require('@modules/cvs/services/cv.service');
      return new CVService(
        container.resolve('cvRepository'),
        container.resolve('cvVersionRepository'),
        container.resolve('fileService'),
        container.resolve('cvParsingService')
      );
    });

    // ========================================
    // CV VERSION MODULE SERVICES
    // ========================================
    this.register('cvVersionRepository', () => {
      const CVVersionRepository = require('@modules/cvs/repositories/cv-version.repository');
      return new CVVersionRepository();
    });

    this.register('cvVersionService', (c) => {
      const CVVersionService = require('@modules/cvs/services/cv-version.service');
      return new CVVersionService(c.resolve('cvVersionRepository'), c.resolve('cvRepository'));
    });

    // ========================================
    // ENHANCEMENT SERVICES REMOVED
    // Now using direct optimization without job orchestration
    // ========================================


    // ========================================
    // CV GENERATION MODULE SERVICES
    // ========================================
    this.register('generationRepository', () => {
      const GenerationRepository = require('@modules/cv-generation/repositories/generation.repository');
      return new GenerationRepository();
    });

    this.register('generationService', (container) => {
      const GenerationService = require('@modules/cv-generation/services/generation.service');
      return new GenerationService(
        container.resolve('generationRepository'),
        container.resolve('jobService'),
        container.resolve('cvRepository'),
        container.resolve('fileService'),
        container.resolve('templateRenderer'),
        container.resolve('cvVersionRepository'),
        container.resolve('pdfGenerator'),
        container.resolve('cvGeneratorService')
      );
    });


    // ========================================
    // WEBHOOKS MODULE SERVICES
    // ========================================
    this.register('webhookRepository', () => {
      const WebhookRepository = require('@modules/webhooks/repositories/webhook.repository');
      return new WebhookRepository();
    });

    this.register('webhookService', (container) => {
      const WebhookService = require('@modules/webhooks/services/webhook.service');
      return new WebhookService(
        container.resolve('webhookRepository'),
        container.resolve('jobService'),
      );
    });

    // ========================================
    // QUEUE SERVICE
    // ========================================
    this.register('queueService', () => {
      const QueueService = require('@messaging/queues/queue.service');
      const queueService = new QueueService();
      // Initialize queues asynchronously
      queueService.initialize().catch(error => {
        logger.error('Failed to initialize queue service', { error: error.message, stack: error.stack });
      });
      return queueService;
    });

    // ========================================
    // HEALTH MODULE SERVICE
    // ========================================
    this.register('healthService', () => {
      const HealthService = require('@modules/health/services/health.service');
      return new HealthService();
    });

    // ========================================
    // AUTH MODULE SERVICE
    // ========================================
    this.register('authService', (container) => {
      const AuthService = require('@modules/auth/services/auth.service');
      const config = require('@config');
      return new AuthService(
        container.resolve('userRepository'),
        config,
      );
    });

    // ========================================
    // USER MODULE SERVICES
    // ========================================
    this.register('userRepository', () => {
      const UserRepository = require('@modules/users/repositories/user.repository');
      return new UserRepository();
    });

    this.register('userService', (container) => {
      const UserService = require('@modules/users/services/user.service');
      return new UserService(
        container.resolve('userRepository'),
        container.resolve('fileService'),
      );
    });
  }

}

const container = new Container();

function getContainer() {
  if (!container._initialized) {
    container.initialize();
  }
  return container;
}

function resolve(name) {
  return getContainer().resolve(name);
}

module.exports = {
  container,
  getContainer,
  resolve,
  Container,
};
