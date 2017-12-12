# github-webhook-server

[![version](https://img.shields.io/npm/v/github-webhook-server.svg)](https://www.npmjs.com/package/github-webhook-server)
[![downloads](https://img.shields.io/npm/dt/github-webhook-server.svg)](https://www.npmjs.com/package/github-webhook-server)
[![license](https://img.shields.io/npm/l/github-webhook-server.svg)](https://github.com/micooz/github-webhook-server/blob/master/LICENSE)
[![dependencies](https://img.shields.io/david/micooz/github-webhook-server.svg)](https://www.npmjs.com/package/github-webhook-server)

> Flexible github webhook server.

## Features

* Support both HTTP and HTTPS.
* Custom hook scripts in yaml file.
* Protect sensitive data in environment variables.

## Install or Upgrade

```
$ npm install -g github-webhook-server
```

## Run Server

```
$ export GITHUB_WEBHOOK_SECRET=abcedf
$ github-webhook-server config.yml
```

## config.yml

```yaml
# HTTPS
ssl:
  enable: false
  cert: cert.pem
  key: key.pem

# Server Listening Address
host: localhost
port: 8080
path: /

# Secret of GitHub WebHook, use environment variables
secret: ${GITHUB_WEBHOOK_SECRET}

# Event Hooks
on_issue: echo "issue event received"
on_push:
  - echo "push event received"
```

> Hint: Set your webhook secret in: `https://github.com/<your_name>/<your_repository>/settings/hooks`.

## License

MIT
