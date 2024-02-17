module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    tsconfigRootDir: __dirname,
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
  ],
  plugins: ["@typescript-eslint", "import"],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "object-curly-spacing": "off",
    "quote-props": 1,
    "max-len": "off",
    "require-jsdoc": "off",
    "indent": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "valid-jsdoc": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-case-declarations": "off",
    "operator-linebreak": "off",
    "linebreak-style": "off",
    "no-useless-escape": "off",
    "no-useless-catch": "off",
  },
};
