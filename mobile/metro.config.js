const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  server: {
    enhanceMiddleware: middleware => {
      return (req, res, next) => {
        const pathname = (req.url || '').split('?')[0];

        if (req.method === 'GET' && pathname === '/status') {
          res.writeHead(200, {'Content-Type': 'text/plain'});
          res.end('packager-status:running');
          return;
        }

        if (req.method === 'GET' && pathname === '/') {
          res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
          res.end(
            '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Metro</title></head><body><pre>Metro dev server\nstatus: running\nstatus endpoint: /status\nandroid bundle: /index.bundle?platform=android</pre></body></html>',
          );
          return;
        }

        return middleware(req, res, next);
      };
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
