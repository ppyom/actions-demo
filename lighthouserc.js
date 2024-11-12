module.exports = {
  ci: {
    collect: {
      staticDistDir: "./build",
      url: ["http://localhost:3001"],
      numberOfRuns: 5,
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
