module.exports = {
  root: true,

  env: {
    es2021: true,
    node: true,
  },

  extends: ['airbnb-base'],

  parser: '@babel/eslint-parser',

  parserOptions: {
    requireConfigFile: false,
  },

  rules: {
    'no-console': 'off',
    'consistent-return': 'off',
    'class-methods-use-this': 'off',
    semi: [2, 'always'],
  },
};
