module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/server/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          isolatedModules: false,
        },
      },
    ],
  },
};
