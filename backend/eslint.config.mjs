import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", "node_modules", "coverage"] },

  {
    files: ["**/*.ts"],
    languageOptions: {
      globals: globals.node,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-undef": "off"
    },
  },
];