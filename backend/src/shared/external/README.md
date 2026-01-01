# External Services Module

Production-ready external service adapters following SOLID principles, proper dependency injection, and comprehensive error handling.

## Architecture

### Storage Services

The storage module uses the **Strategy Pattern** with provider implementations:

```
storage/
├── interfaces/
│   └── IStorageProvider.js          # Interface contract
├── providers/
│   ├── S3StorageProvider.js         # AWS S3 implementation
│   └── LocalStorageProvider.js      # Local filesystem implementation
├── StorageProviderFactory.js        # Factory for creating providers
├── StorageValidator.js              # Input validation
├── StorageService.js                # Facade/Orchestrator
└── index.js
```

### PDF Services

The PDF module provides instance-based services with dependency injection:

```
pdf/
├── PDFService.js                    # Main PDF operations
├── PDFValidator.js                  # PDF validation
└── index.js
```

## Usage

### Storage Service

```javascript
const { resolve } = require('@core/container');

// Get storage service from container
const storageService = resolve('storageService');

// Upload file
const result = await storageService.uploadFile(buffer, 'path/to/file.pdf', {
  contentType: 'application/pdf',
  provider: 's3', // optional, uses default if not specified
});

// Download file
const fileBuffer = await storageService.downloadFile('path/to/file.pdf', 's3');

// Delete file
await storageService.deleteFile('path/to/file.pdf');

// Generate signed URL
const url = await storageService.generateDownloadUrl('path/to/file.pdf', 's3', 3600);

// Check if file exists
const exists = await storageService.fileExists('path/to/file.pdf');

// Get file metadata
const metadata = await storageService.getFileMetadata('path/to/file.pdf');
```

### PDF Service

```javascript
const { resolve } = require('@core/container');

// Get PDF service from container
const pdfService = resolve('pdfService');

// Extract text from PDF
const result = await pdfService.extractText(pdfBuffer);
// Returns: { text, pages, metadata, stats }

// Validate PDF
const validation = await pdfService.validate(pdfBuffer);
// Returns: { valid, version, pages }

// Get metadata only
const metadata = await pdfService.getMetadata(pdfBuffer);
// Returns: { pages, title, author, ... }
```

## Backward Compatibility

The services maintain backward compatibility with existing code:

### Legacy Storage Methods

```javascript
// These still work:
await FileService.storeFile(file);           // Uses new provider system
await FileService.getFile(filePath, s3Key);  // Uses new provider system
await FileService.deleteFile(filePath, s3Key); // Uses new provider system
```

### Legacy PDF Methods

The old static methods are no longer available. Update code to use instance-based service:

```javascript
// OLD (no longer works):
// const text = await PDFService.extractText(buffer);

// NEW:
const pdfService = resolve('pdfService');
const result = await pdfService.extractText(buffer);
```

## Configuration

Storage providers are configured via environment variables and `@config`:

```javascript
// In container registration:
storageProviderFactory: {
  default: 'local', // or 's3'
  local: {
    basePath: './storage',
    baseUrl: 'http://localhost:3000/files',
  },
  s3: {
    region: 'us-east-1',
    bucket: 'my-bucket',
    accessKeyId: '...',
    secretAccessKey: '...',
    maxRetries: 3,
    defaultExpiration: 3600,
  },
}
```

## Error Handling

All services use custom error classes:

- `StorageError` - Storage operation failures
- `FileError` - File processing errors
- `ValidationError` - Input validation failures

```javascript
try {
  await storageService.uploadFile(buffer, key);
} catch (error) {
  if (error instanceof StorageError) {
    // Handle storage error
  } else if (error instanceof ValidationError) {
    // Handle validation error
  }
}
```

## Testing

Services are designed for easy testing with dependency injection:

```javascript
// Mock providers for testing
const mockProvider = {
  upload: jest.fn(),
  download: jest.fn(),
  delete: jest.fn(),
};

const mockFactory = {
  getProvider: () => mockProvider,
};

const storageService = new StorageService(mockFactory, validator, logger);
```

## Migration Guide

### From Static to Instance-Based

1. **Update service resolution:**
   ```javascript
   // Before
   const FileService = require('@storage');
   
   // After
   const { resolve } = require('@core/container');
   const fileService = resolve('fileService');
   ```

2. **Update method calls:**
   ```javascript
   // Before (static)
   await FileService.storeFile(file);
   
   // After (instance)
   await fileService.storeFile(file);
   ```

3. **Update PDF service:**
   ```javascript
   // Before
   const text = await PDFService.extractText(buffer);
   
   // After
   const pdfService = resolve('pdfService');
   const result = await pdfService.extractText(buffer);
   const text = result.text;
   ```

## Best Practices

1. **Always use dependency injection** - Get services from container
2. **Use validators** - Services validate inputs automatically
3. **Handle errors properly** - Use try/catch with specific error types
4. **Log operations** - Services log automatically, but add context when needed
5. **Use appropriate providers** - Choose local for dev, S3 for production

