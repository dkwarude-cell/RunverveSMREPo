module.exports = {
  root: true,
  extends: ['@react-native-community'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  env: {
    node: true,
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
  },
};
