module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', [
      'feat',     // New feature
      'fix',      // Bug fix
      'docs',     // Documentation changes
      'style',    // Code style changes (formatting, etc)
      'refactor', // Code refactoring
      'perf',     // Performance improvements
      'test',     // Adding or modifying tests
      'chore',    // Maintenance tasks
      'ci',       // CI/CD changes
      'build',    // Build system changes
      'revert'    // Revert previous commit
    ]],
    'scope-enum': [2, 'always', [
      // Server scopes
      'api',          // API endpoints
      'auth',         // Authentication & authorization
      'booking',      // Booking system
      'branch',       // Multi-branch features
      'professional', // Professional system
      'service',      // Services
      'user',         // User management
      'customer',     // Customer system
      'db',           // Database related
      'prisma',       // Database schema/migrations
      'health',       // Health checks
      
      // Client scopes
      'client',       // General client changes
      'ui',           // UI components and styling
      'routing',      // Routing and navigation
      'store',        // State management
      'i18n',         // Internationalization
      'components',   // React components
      
      // Shared scopes
      'docs',         // Documentation
      'config',       // Configuration changes
      'deps',         // Dependencies
      'ci',           // CI/CD
      'build',        // Build system
      'test',         // Test related
      'core',         // Core functionality
      'chore'         // General maintenance
    ]],
    'subject-case': [2, 'always', [
      'lower-case',    // add new feature
      'sentence-case', // Add new feature
      'start-case',    // Add New Feature
      'pascal-case',   // AddNewFeature
      'camel-case',    // addNewFeature
      'kebab-case',    // add-new-feature
      'snake-case'     // add_new_feature
    ]],
    'subject-max-length': [2, 'always', 72],
    'body-max-line-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 100]
  }
};
