const chalk = require('chalk');
const semver = require('semver');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const packagejs = require('../../package.json');
const files = require('../files');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            readConfig() {
                this.jhipsterAppConfig = this.getJhipsterConfig('.yo-rc.json').createProxy();
                if (!this.jhipsterAppConfig) {
                    this.error('"Can\'t·read·.yo-rc.json"');
                }
            },

            displayLogo() {
                this.log(
                    chalk.white(
                        `Welcome to the ${chalk.bold('JHipster postgres uuid')} converter! ${chalk.yellow(`v${packagejs.version}\n`)}`
                    )
                );
            },

            checkJhipster() {
                const currentJhipsterVersion = this.jhipsterAppConfig.jhipsterVersion;
                const minimumJhipsterVersion = packagejs.dependencies['generator-jhipster'];
                if (!semver.satisfies(currentJhipsterVersion, minimumJhipsterVersion)) {
                    this.warning(
                        `\nYour generated project used an old JHipster version (${currentJhipsterVersion})... you need at least (${minimumJhipsterVersion})\n`
                    );
                }
            },

            checkDBType() {
                if (this.jhipsterAppConfig.prodDatabaseType !== 'postgresql') {
                    this.env.error(`${chalk.red.bold('ERROR!')} This module is made for postgres databases only...\n`);
                }
            }
        };
    }

    writing() {
        files.writeFiles(this);
        this.addNpmDevDependency('generator-jhipster-postgres-uuid', packagejs.version);
        try {
            this.registerModule(
                'generator-jhipster-postgres-uuid',
                'entity',
                'post',
                'entity',
                'A JHipster module that generates uuids for postgres'
            );
        } catch (e) {
            this.log(`${chalk.red.bold('WARN!')} Could not register as a jhipster entity post creation hook...\n`, e);
        }
    }

    end() {
        this.log('End of postgres-uuid generator');
    }
};
