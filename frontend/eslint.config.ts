import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  
  {
    name: 'app/custom-rules-fixes',
    files: ['**/*.vue', '**/*.ts', '**/*.js', '**/*.tsx'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-mutating-props': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'vue/valid-template-root': 'off'
    }
  }
)