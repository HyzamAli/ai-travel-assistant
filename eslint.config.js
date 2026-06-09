// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
    rules: {
      // Reanimated `SharedValue.value = …` is the documented mutation API;
      // the React Compiler rule treats SharedValues as immutable, producing
      // false positives. Disabled globally rather than per-site.
      'react-hooks/immutability': 'off',
    },
  },
]);
