// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import stylistic from '@stylistic/eslint-plugin'

export default withNuxt(
  // Configuración personalizada
  {
    plugins: {
      '@stylistic': stylistic
    },
    rules: {
      '@stylistic/indent': ['error', 2, {
        ignoredNodes: ['TemplateLiteral']
      }],

      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],

      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],

      '@stylistic/semi': ['error', 'never'],

      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/object-curly-spacing': ['error', 'always'],

      '@stylistic/space-before-blocks': 'error',
      '@stylistic/keyword-spacing': 'error',

      'vue/html-indent': ['error', 2],
      'vue/script-indent': ['error', 2, { baseIndent: 0 }],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/html-closing-bracket-newline': ['error', {
        singleline: 'never',
        multiline: 'always'
      }],
      'vue/multi-word-component-names': 'off',
      'vue/require-v-for-key': 'error',
      'vue/no-v-html': 'warn',
      'vue/valid-template-root': 'off',

      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'warn' // Cambiar a warning
    }
  },
  {
    files: ['**/*.vue'],
    rules: {
      '@stylistic/indent': 'off' // Desactivar para archivos Vue
    }
  }
)
