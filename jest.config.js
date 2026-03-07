/**
 * Jest Configuration
 * Testing framework setup for FlowStock WMS
 */

const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],

  // Test environment
  testEnvironment: "jest-environment-jsdom",

  // Coverage configuration
  collectCoverageFrom: [
    "app/**/*.{js,jsx,ts,tsx}",
    "components/**/*.{js,jsx,ts,tsx}",
    "lib/**/*.{js,jsx,ts,tsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/.next/**",
    "!**/coverage/**",
    "!**/dist/**",
  ],

  // Coverage thresholds - 100% coverage required
  coverageThreshold: {
    global: {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },

  // Module name mapper for path aliases
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
    "^@/components/(.*)$": "<rootDir>/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
    "^@/app/(.*)$": "<rootDir>/app/$1",

    // Handle CSS imports (with CSS modules)
    "^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy",

    // Handle CSS imports (without CSS modules)
    "^.+\\.(css|sass|scss)$": "<rootDir>/__mocks__/styleMock.js",

    // Handle image imports
    "^.+\\.(jpg|jpeg|png|gif|webp|avif|svg)$":
      "<rootDir>/__mocks__/fileMock.js",
  },

  // Test match patterns
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],

  // Transform files with ts-jest
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
        },
      },
    ],
  },

  // Module file extensions
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],

  // Test timeout
  testTimeout: 10000,

  // Ignore patterns
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.next/",
    "/dist/",
    "/coverage/",
    "/docs/",
  ],

  // Watch plugins
  watchPlugins: [
    "jest-watch-typeahead/filename",
    "jest-watch-typeahead/testname",
  ],

  // Reporters
  reporters: [
    "default",
    [
      "jest-junit",
      {
        outputDirectory: "./coverage",
        outputName: "junit.xml",
        classNameTemplate: "{classname}",
        titleTemplate: "{title}",
      },
    ],
  ],

  // Globals
  globals: {
    "ts-jest": {
      tsconfig: {
        jsx: "react",
      },
    },
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
