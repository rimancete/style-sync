export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'subject-case': [2, 'always',
      'lower-case',    // add new feature
      'sentence-case', // Add new feature  
      'start-case',    // Add New Feature
      'pascal-case',   // AddNewFeature
      'camel-case',    // addNewFeature
      'kebab-case',    // add-new-feature
      'snake-case'     // add_new_feature

    ],
  },
};
