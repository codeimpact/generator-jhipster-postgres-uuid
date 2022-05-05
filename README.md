# generator-jhipster-postgres-uuid

[![NPM version][npm-image]][npm-url] [![Build Status][github-actions-image]][github-actions-url] [![Dependency Status][daviddm-image]][daviddm-url]

> JHipster module, Convert id&#39;s to postgres uuid&#39;s

# Introduction

This is a [JHipster](https://www.jhipster.tech/) module, that is meant to be used in a JHipster application. and will generate uuid's for instead for id fields.

### Support:

- Currently, only tested with jhipster 7

### Will modify your:

- entities
- services (serviceImpl and serviceClasses)
- resources
- dto's (use the entitySuffix)
- liquibase change sets and remove the sequence generator
- unit and integration tests
- fake data

### todo

- add tests
- cleanup code

### Not supported / tested yet:

- Reactive application (not tested)
- jpa model filtering
- message brokers
- search engines
- front-end support
- micro services

# Prerequisites

As this is a [JHipster](https://www.jhipster.tech/) module, we expect you have JHipster and its related tools already installed:

- [Installing JHipster](https://www.jhipster.tech/installation/)

# Installation

## With NPM

To install this module:

```bash
npm install -g generator-jhipster-postgres-uuid
```

To update this module:

```bash
npm update -g generator-jhipster-postgres-uuid
```

## With Yarn

To install this module:

```bash
yarn global add generator-jhipster-postgres-uuid
```

To update this module:

```bash
yarn global upgrade generator-jhipster-postgres-uuid
```

# Usage

```bash
yo jhipster-postgres-uuid
```

## Running the module local for development

During development of the module:

1. Make a link for npm so that we can use it in the jhipster project

```bash
cd generator-jhipster-postgres-uuid
npm link
```

2. Link the module to jhipster

You could also use Yarn for this if you prefer (my-app is the folder of your jhipster application)

```bash
cd my-app
npm link generator-jhipster-postgres-uuid
```

# License

MIT © [Jan-Jaap Arends](http://www.codeimpact.nl)

[npm-image]: https://img.shields.io/npm/v/generator-jhipster-postgres-uuid.svg
[npm-url]: https://npmjs.org/package/generator-jhipster-postgres-uuid
[github-actions-image]: https://github.com/codeimpact/generator-jhipster-postgres-uuid/workflows/Build/badge.svg
[github-actions-url]: https://github.com/codeimpact/generator-jhipster-postgres-uuid/actions
[daviddm-image]: https://david-dm.org/codeimpact/generator-jhipster-postgres-uuid.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/codeimpact/generator-jhipster-postgres-uuid
