const helmet = require('helmet');

const helmetConfig = helmet({
  contentSecurityPolicy: false
});

module.exports = helmetConfig;
