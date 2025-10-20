module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
  },
  extends: ["eslint:recommended", "plugin:import/recommended", "prettier"],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module",
  },
  rules: {
    "import/no-unresolved": "off",
  },
};
