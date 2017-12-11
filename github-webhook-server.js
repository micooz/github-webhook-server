#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const child_process = require('child_process');
const yaml = require('js-yaml');

const defaultConfig = {
  'ssl': {
    'enable': false,
    'cert': '',
    'key': ''
  },
  'port': 8080,
  'path': '/',
  'secret': null,
  'on_issue': null,
  'on_push': null
};

function startServer(config) {
  const {ssl, secret, host, port, on_issue, on_push} = config;
  const handler = require('github-webhook-handler')({
    path: config.path,
    secret: secret
  });

  const requestListener = (req, res) => {
    handler(req, res, function () {
      res.statusCode = 404;
    });
  };

  let server;

  if (ssl.enable) {
    const key = fs.readFileSync(ssl.key);
    const cert = fs.readFileSync(ssl.cert);
    server = https.createServer({key, cert}, requestListener);
  } else {
    server = http.createServer(requestListener);
  }

  handler.on('error', function (err) {
    console.error('Error:', err.message);
  });

  handler.on('push', function (event) {
    const {repository} = event.payload;
    console.log('info: received a push event from:', repository.full_name);
    for (const cmd of on_push) {
      console.log(child_process.execSync(cmd));
    }
  });

  handler.on('issues', function (event) {
    const {repository} = event.payload;
    console.log('info: received an issue event from:', repository.full_name);
    for (const cmd of on_issue) {
      console.log(child_process.execSync(cmd));
    }
  });

  server.listen({host, port}, () => {
    console.log(`info: server now running at ${ssl.enable ? 'https' : 'http'}://${host}:${port}${config.path}`);
  });
}

function fillEnvs(content) {
  const regex = /\${([^\\}]*(?:\\.[^\\}]*)*)}/g;
  const vars = [];
  let tmpArr;
  while ((tmpArr = regex.exec(content)) !== null) {
    vars.push(tmpArr[1]);
  }
  for (const key of vars) {
    const value = process.env[key] || '';
    content = content.replace(`$\{${key}\}`, value);
  }
  return content;
}

function validate(config) {
  if (config.ssl) {
    const {enable, cert, key} = config.ssl;
    if (typeof enable !== 'boolean') {
      throw Error('ssl.enable is invalid');
    }
    if (enable && (!cert || !key)) {
      throw Error('ssl.cert and ssl.key must be set');
    }
  }
  if (typeof config.host !== 'string' || config.host.length < 1) {
    throw Error('host is invalid');
  }
  if (typeof config.port !== 'number') {
    throw Error('port is invalid');
  }
  if (typeof config.path !== 'string' || config.path.length < 1) {
    throw Error('path is invalid');
  }
  if (typeof config.secret !== 'string' || config.secret.length < 1) {
    throw Error('secret is invalid');
  }
  if (!config.on_issue) {
    throw Error('on_issue is invalid');
  }
  if (!config.on_push) {
    throw Error('on_push is invalid');
  }
}

function normalize(config) {
  if (config.ssl.enable) {
    config.ssl.cert = path.resolve(process.cwd(), config.ssl.cert);
    config.ssl.key = path.resolve(process.cwd(), config.ssl.key);
  }
  config.on_issue = Array.isArray(config.on_issue) ? config.on_issue : [config.on_issue];
  config.on_push = Array.isArray(config.on_push) ? config.on_push : [config.on_push];
  return config;
}

function main(args) {
  // args length check
  if (args.length < 1) {
    console.error('.yml file must be provided');
    process.exit(1);
  }

  try {
    // load yaml file
    const ymlFile = path.resolve(process.cwd(), args[0]);
    const ymlContent = fs.readFileSync(ymlFile, 'utf-8');

    // replace environment variables
    const mixedContent = fillEnvs(ymlContent);
    const userConfig = yaml.safeLoad(mixedContent);

    // validate configs
    const config = Object.assign(defaultConfig, userConfig);
    validate(config);

    // normalize configs
    normalize(config);

    // start server
    startServer(config);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

main(process.argv.slice(2));
