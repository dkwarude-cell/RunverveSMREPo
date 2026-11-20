const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // native build output (thousands of files rewritten on every Gradle/Xcode build) - Metro doesn't need to watch it
    blockList: [
      /[/\\]android[/\\](app[/\\])?build[/\\].*/,
      /[/\\]android[/\\](app[/\\])?\.cxx[/\\].*/,
      /[/\\]android[/\\]\.gradle[/\\].*/,
      /[/\\]node_modules[/\\][^/\\]+[/\\]android[/\\](build|\.cxx)[/\\].*/,
      /[/\\]ios[/\\](build|Pods)[/\\].*/,
    ],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
