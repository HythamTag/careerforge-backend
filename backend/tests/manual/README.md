# Manual Test Suite

This directory contains scripts for manual verification and stress testing of the CV Parsing and Optimization system.

## Scripts

### 1. `api_upload_test.js`
- **Purpose**: Verifies the end-to-end API flow (Upload -> Parse -> Result).
- **Features**: Includes authentication (JWT generation), multi-step API interaction, and automated hallucination/completeness checks.
- **Audit Mode**: Configured to audit the entire `samples/` directory.

### 2. `bulk_parse_verify.js`
- **Purpose**: Internal worker-level stress test.
- **Features**: Processes multiple CVs directly through the parsing service to verify accuracy and throughput without API overhead.

### 3. `process_samples.js`
- **Purpose**: A comprehensive processing script used during the development of the "Chunked Parallel" strategy.
- **Features**: Automates the processing of all samples to a local result directory.

### 4. `reproduce_atia.js`
- **Purpose**: Targeted regression test for high-complexity CVs (specifically "Ahmed Atia").
- **Features**: Validates complex extraction and programmatic cleaning of hallucinations.

### 5. `check_audit_progress.js`
- **Purpose**: Database-driven progress reporter.
- **Features**: Queries MongoDB to provide real-time stats (Total, Success, Failed, Processing) grouped by unique CV ID.

## How to Run
Most scripts require the backend server and worker to be active.
```bash
node backend/tests/manual/<script_name>.js
```
