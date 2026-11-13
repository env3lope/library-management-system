module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  testMatch: ["<rootDir>/tests/**/*.test.{js,jsx}"],
  clearMocks: true,
};
