/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * @doc https://umijs.org/docs/guides/proxy
 */
const proxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080';

const proxyConfig = {
  '/api/': {
    target: proxyTarget,
    changeOrigin: true,
  },
  '/lab-adapter/': {
    target: process.env.LAB_ADAPTER_PROXY_TARGET || 'http://127.0.0.1:18085',
    changeOrigin: true,
    pathRewrite: { '^/lab-adapter': '' },
  },
};

export default {
  dev: proxyConfig,
  test: proxyConfig,
  pre: proxyConfig,
};
