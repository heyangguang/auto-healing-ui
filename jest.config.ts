import { configUmiAlias, createConfig } from '@umijs/max/test';

export default async (): Promise<any> => {
  const config = await configUmiAlias({
    ...createConfig({
      target: 'browser',
    }),
  });
  return {
    ...config,
    openHandlesTimeout: 5000,
    moduleNameMapper: {
      ...(config.moduleNameMapper || {}),
      '^@umijs/max$': '<rootDir>/src/.umi-test/exports.ts',
    },
    testEnvironmentOptions: {
      ...(config?.testEnvironmentOptions || {}),
      url: 'http://localhost:8000',
    },
    setupFilesAfterEnv: [...(config.setupFilesAfterEnv || []), './tests/setupTests.jsx'],
    globals: {
      ...config.globals,
      localStorage: null,
    },
  };
};
