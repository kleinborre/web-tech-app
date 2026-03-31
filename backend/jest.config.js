/**
 * Jest Configuration for ImageToTextOnline
 * 
 * Uses Node.js experimental ESM support since the project uses "type": "module".
 * Run with: npm test
 * 
 * @version 1.0.0
 */

export default {
    // Use Node's experimental ESM support
    transform: {},
    
    // Test file patterns
    testMatch: [
        '**/__tests__/**/*.test.js'
    ],
    
    // Test environment
    testEnvironment: 'node',
    
    // Timeout for async tests (10 seconds — some DNS checks take time)
    testTimeout: 10000,
    
    // Show verbose output with test names
    verbose: true,
    
    // Force exit after tests complete (closes DB connections, etc.)
    forceExit: true,
    
    // Detect open handles (helps debug hanging tests)
    detectOpenHandles: true,

    // Coverage settings (optional — uncomment to generate coverage report)
    // collectCoverage: true,
    // coverageDirectory: 'coverage',
    // coverageReporters: ['text', 'text-summary'],
};
