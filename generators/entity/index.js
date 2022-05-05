const chalk = require('chalk');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const packagejs = require('../../package.json');
const files = require('../files');

module.exports = class extends BaseGenerator {
    get initializing() {
        return {
            readConfig() {
                this.entityConfig = this.options.entityConfig;
                this.jhipsterAppConfig = this.getJhipsterConfig('.yo-rc.json').createProxy();
                if (!this.jhipsterAppConfig) {
                    this.error('Cannot read .yo-rc.json');
                }
                files.initVariables(this);
            },
            displayLogo() {
                this.log(
                    chalk.white(`Running ${chalk.bold('JHipster postgres uuid')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`)
                );
            },
            validate() {
                // this shouldn't be run directly
                if (!this.entityConfig) {
                    this.env.error(
                        `${chalk.red.bold('ERROR!')} This sub generator should be used only from JHipster and cannot be run directly...\n`
                    );
                }
            }
        };
    }

    writing() {
        console.log(`Convert ${this.entityConfig.entityClass}`);
        files.convertComponents(this, this.entityConfig.entityClass);
    }

    end() {
        this.log('End of postgres-uuid generator');
    }
};
