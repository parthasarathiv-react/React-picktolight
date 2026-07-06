module.exports = {
    style: {
        postcss: {
            mode: 'extends',
            loaderOptions: {
                postcssOptions: {
                    ident: 'postcss',
                    plugins: [
                        require('tailwindcss'),
                        require('autoprefixer'),
                    ],
                },
            },
        },
    },
    webpack: {
        configure: (webpackConfig) => {
            // Split vendor bundles so the initial app chunk is smaller → lower TBT
            if (webpackConfig.optimization) {
                webpackConfig.optimization.splitChunks = {
                    chunks: 'all',
                    cacheGroups: {
                        // React core — smallest but most reused
                        reactVendor: {
                            test: /[\\/]node_modules[\\/](react|react-dom|react-router-dom|scheduler)[\\/]/,
                            name: 'vendor-react',
                            priority: 40,
                            enforce: true,
                        },
                        // Radix UI primitives
                        radixVendor: {
                            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
                            name: 'vendor-radix',
                            priority: 30,
                            enforce: true,
                        },
                        // Lucide icons tree-shaken chunk
                        lucideVendor: {
                            test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                            name: 'vendor-lucide',
                            priority: 20,
                            enforce: true,
                        },
                        // Everything else in node_modules
                        defaultVendors: {
                            test: /[\\/]node_modules[\\/]/,
                            name: 'vendor-misc',
                            priority: 10,
                            enforce: true,
                        },
                    },
                };
            }
            return webpackConfig;
        },
    },
};
