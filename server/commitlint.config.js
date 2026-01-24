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
      'api',      // API endpoints
      'auth',     // Authentication & authorization
      'db',       // Database related
      'health',   // Health checks
      'config',   // Configuration changes
      'deps',     // Dependencies
      'docs',     // Documentation
      'prisma',   // Database schema/migrations
      'customer',  // Customer system
      'booking',  // Booking system
      'branch',   // Multi-branch features
      'professional',   // Professional system
      'service',  // Services
      'user',     // User management
      'core',     // Core functionality
      'test'      // Test related
    ]],
    'subject-case': [2, 'always',
      'lower-case',    // add new feature
      'sentence-case', // Add new feature  
      'start-case',    // Add New Feature
      'pascal-case',   // AddNewFeature
      'camel-case',    // addNewFeature
      'kebab-case',    // add-new-feature
      'snake-case'     // add_new_feature

    ],
    'subject-max-length': [2, 'always', 50],
    'body-max-line-length': [2, 'always', 72],
    'header-max-length': [2, 'always', 72]
  }
};
