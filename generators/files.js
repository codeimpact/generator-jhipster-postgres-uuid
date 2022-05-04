const jhipsterConstants = require('generator-jhipster/generators/generator-constants');
const fs = require('fs');
const glob = require('glob');
const getUuid = require('uuid-by-string');
const changeCase = require('change-case');

const uuid1 = '00000000-0000-0000-0000-000000000001';
const uuid2 = '00000000-0000-0000-0000-000000000002';

module.exports = {
    writeFiles
};

function initVariables(generator) {
    generator.loadServerConfig(generator.jhipsterAppConfig);

    // read config from .yo-rc.json
    generator.baseName = generator.jhipsterAppConfig.baseName;
    generator.packageName = generator.jhipsterAppConfig.packageName;
    generator.dtoSuffix = generator.jhipsterAppConfig.dtoSuffix;

    generator.clientFramework = generator.jhipsterAppConfig.clientFramework;
    generator.clientPackageManager = generator.jhipsterAppConfig.clientPackageManager;
    generator.buildTool = generator.jhipsterAppConfig.buildTool;

    // use constants from generator-constants.js
    generator.javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + generator.packageFolder}/`;
    generator.resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
    generator.testDir = `${jhipsterConstants.SERVER_TEST_SRC_DIR + generator.packageFolder}/`;
    generator.testResourceDir = jhipsterConstants.SERVER_TEST_RES_DIR;
    generator.webappDir = jhipsterConstants.CLIENT_MAIN_SRC_DIR;

    // show all variables
    generator.log('\n--- some config read from config ---');
    generator.log(`baseName=${generator.baseName}`);
    generator.log(`packageName=${generator.packageName}`);
    generator.log(`clientFramework=${generator.clientFramework}`);
    generator.log(`clientPackageManager=${generator.clientPackageManager}`);
    generator.log(`buildTool=${generator.buildTool}`);

    generator.log('\n--- some const ---');
    generator.log(`javaDir=${generator.javaDir}`);
    generator.log(`resourceDir=${generator.resourceDir}`);
    generator.log(`testDir=${generator.testDir}`);
    generator.log(`resourceDir=${generator.testResourceDir}`);
    generator.log(`webappDir=${generator.webappDir}`);
    generator.log(`dockerComposeFormatVersion=${generator.dockerComposeFormatVersion}`);
    generator.log(`dockerAkhq=${generator.dockerAkhq}`);

    if (generator.options['skip-prompts']) {
        generator.log('\n------');
        generator.log('Skipping prompts...');
    } else {
        generator.log('\n--- variables from questions ---');
        generator.log(`\nentities=${generator.entities}`);
        generator.log(`\ncomponentsPrefixes=${generator.componentsPrefixes}`);
        generator.log(`\npollingTimeout=${generator.pollingTimeout}`);
        generator.log(`\nautoOffsetResetPolicy=${generator.autoOffsetResetPolicy}`);
    }
    generator.log('------\n');
}

function writeFiles(generator) {
    initVariables(generator);

    convertInitialChangelog(generator);

    const entities = generator.getExistingEntityNames();
    entities.push('User');

    entities.forEach(entity => {
        convertComponents(generator, entity);
    });
}

function convertComponents(generator, entity) {
    convertEntity(generator, entity);
    const entityConfig = generator.getEntityConfig(entity);
    if (generator.isUserEntity(entity)) {
        convertDTO(generator, 'AdminUser');
        convertDTO(generator, entity);
        convertMapper(generator, entity);
    } else {
        convertLiquibaseChangelog(generator, entity);
    }

    if (entityConfig) {
        const config = entityConfig.createProxy();
        if (config.dto !== undefined && config.dto !== 'no') {
            convertDTO(generator, entity);
        }

        if (config.service !== undefined && config.service !== 'no') {
            const serviceImpl = config.service === 'serviceImpl';
            convertService(generator, entity, serviceImpl);
        }
    }
    convertRepository(generator, entity);
    convertResource(generator, entity);
    convertUserData(generator);
    convertFakeData(generator, entity);
}

function convertEntity(generator, entity) {
    const entityFilePath = `${generator.javaDir}domain/${entity}.java`;
    insertUuidImport(generator, entityFilePath, `package ${generator.packageName}.domain;`);
    generator.replaceContent(entityFilePath, '@GeneratedValue.*', '@GeneratedValue', true);
    generator.replaceContent(entityFilePath, '.*@SequenceGenerator.*\n', '', true);
    replaceToLongToUUIDNeedles(generator, entityFilePath, ['private Long id', ' id(Long id) {', 'Long getId() {', 'setId(Long id) {']);

    if (!generator.isUserEntity(entity)) {
        const entityTestPath = `${generator.testDir}domain/${entity}Test.java`;
        insertUuidImport(generator, entityTestPath, `package ${generator.packageName}.domain;`);
        const entityVarName = changeCase.camelCase(entity);
        const regexNeedles = [
            {
                regex: new RegExp(`${entityVarName}1\\.setId\\(1L\\)`, 'gm'),
                content: `${entityVarName}1.setId(UUID.fromString("${uuid1}"))`
            },
            {
                regex: new RegExp(`${entityVarName}2\\.setId\\(2L\\)`, 'gm'),
                content: `${entityVarName}2.setId(UUID.fromString("${uuid2}"))`
            }
        ];
        replaceRegexNeedles(generator, entityTestPath, regexNeedles);
    }
}

function convertRepository(generator, entity) {
    const repositoryFilePath = `${generator.javaDir}repository/${entity}Repository.java`;
    insertUuidImport(generator, repositoryFilePath, `package ${generator.packageName}.repository;`);
    replaceToLongToUUIDNeedles(generator, repositoryFilePath, ['Relationships(Long id)', '@Param("id") Long id']);
    generator.replaceContent(repositoryFilePath, `<${entity}, Long>`, `<${entity}, UUID>`, true);
}

function convertDTO(generator, dto) {
    const dtoName = `${dto}${generator.dtoSuffix}`;
    const dtoPath = `${generator.javaDir}service/dto/${dtoName}.java`;
    insertUuidImport(generator, dtoPath, `package ${generator.packageName}.service.dto;`);
    replaceToLongToUUIDNeedles(generator, dtoPath, ['private Long id', 'Long getId() {', 'setId(Long id) {']);

    // Convert resource tests.
    if (dto !== 'AdminUser' && dto !== 'User') {
        const dtoTestPath = `${generator.testDir}service/dto/${dtoName}Test.java`;
        insertUuidImport(generator, dtoTestPath, `package ${generator.packageName}.service.dto;`);
        const dtoVarName = `${changeCase.camelCase(dto)}${generator.dtoSuffix}`;
        const regExNeedles = [
            {
                regex: new RegExp(`${dtoVarName}1\\.setId\\(1L\\)`, 'gm'),
                content: `${dtoVarName}1.setId(UUID.fromString("${uuid1}"))`
            },
            {
                regex: new RegExp(`${dtoVarName}2\\.setId\\(2L\\)`, 'gm'),
                content: `${dtoVarName}2.setId(UUID.fromString("${uuid2}"))`
            }
        ];
        replaceRegexNeedles(generator, dtoTestPath, regExNeedles);
    }
}

function convertMapper(generator, entity) {
    const mapperPath = `${generator.javaDir}service/mapper/${entity}Mapper.java`;
    insertUuidImport(generator, mapperPath, `package ${generator.packageName}.service.mapper;`);
    const entityName = entity.toLowerCase();
    generator.replaceContent(mapperPath, `${entityName}FromId(Long id)`, `${entityName}FromId(UUID id)`, false);

    // Convert mapper test.
    const mapperTestPath = `${generator.testDir}service/mapper/${entity}MapperTest.java`;
    insertUuidImport(generator, mapperTestPath, `package ${generator.packageName}.service.mapper;`);
    generator.replaceContent(
        mapperTestPath,
        'Long DEFAULT_ID = 1L',
        'UUID DEFAULT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");',
        true
    );
}

function convertService(generator, entity, serviceImpl = false) {
    const replaceMethodsStrings = ['findOne(Long id)', 'delete(Long id)'];

    // Convert service implementation.
    if (serviceImpl) {
        const serviceImplPath = `${generator.javaDir}service/impl/${entity}ServiceImpl.java`;
        insertUuidImport(generator, serviceImplPath, `package ${generator.packageName}.service.impl;`);
        replaceToLongToUUIDNeedles(generator, serviceImplPath, replaceMethodsStrings);
    }

    // Convert service.
    const servicePath = `${generator.javaDir}service/${entity}Service.java`;
    insertUuidImport(generator, servicePath, `package ${generator.packageName}.service;`);
    replaceToLongToUUIDNeedles(generator, servicePath, replaceMethodsStrings);
}

function convertResource(generator, entity) {
    if (!generator.isUserEntity(entity)) {
        const resourcePath = `${generator.javaDir}web/rest/${entity}Resource.java`;
        insertUuidImport(generator, resourcePath, `package ${generator.packageName}.web.rest;`);

        const regExNeedles = [
            {
                regex: /\) final Long id,/gm,
                content: ') final UUID id,'
            },
            {
                regex: /@PathVariable Long id\)/gm,
                content: '@PathVariable UUID id)'
            }
        ];

        replaceRegexNeedles(generator, resourcePath, regExNeedles);
    }

    // Convert resource tests.
    const userResourceItTestPath = `${generator.testDir}web/rest/${entity}ResourceIT.java`;
    insertUuidImport(generator, userResourceItTestPath, `package ${generator.packageName}.web.rest;`);

    const regExNeedles = [];
    if (generator.isUserEntity(entity)) {
        regExNeedles.push(
            {
                regex: /user2\.setId\(2L\)/gm,
                content: `user2.setId(UUID.fromString("${uuid2}"))`
            },
            {
                regex: 'Long DEFAULT_ID = 1L;',
                content: `UUID DEFAULT_ID = UUID.fromString("${uuid1}");`
            }
        );
    } else {
        const camelCaseEntityName = changeCase.camelCase(entity);
        regExNeedles.push(
            {
                regex: /count\.incrementAndGet\(\)/gm,
                content: 'UUID.randomUUID()'
            },
            {
                regex: /\.getId\(\).intValue\(\)/gm,
                content: '.getId().toString()'
            },
            {
                regex: new RegExp(`${camelCaseEntityName}\\.setId\\(1L\\)`, 'gm'),
                content: `${camelCaseEntityName}.setId(UUID.fromString("${uuid1}"))`
            },
            {
                regex: /\.setId\(DEFAULT_ID\)/gm,
                content: `setId(UUID.fromString("${uuid1}"))`
            }
        );
    }
    generator.replaceContent(userResourceItTestPath, 'Long\\.MAX_VALUE', 'UUID.randomUUID()', 'true');
    replaceRegexNeedles(generator, userResourceItTestPath, regExNeedles);
}

function convertFakeData(generator, entity) {
    if (generator.isUserEntity(entity)) {
        return;
    }
    const snakeEntityName = changeCase.snakeCase(entity);
    const fakeDataFile = `${generator.resourceDir}/config/liquibase/fake-data/${snakeEntityName}.csv`;
    const lineNumbers = [...Array(10).keys()];

    const regExNeedles = [];
    lineNumbers.forEach(lineNr => {
        const id = lineNr + 1;
        const entityUUID = getUuid(`${entity}${id}`);
        regExNeedles.push({
            regex: new RegExp(`^${id};`, 'gm'),
            content: `${entityUUID};`
        });
    });
    replaceRegexNeedles(generator, fakeDataFile, regExNeedles);
}

function convertUserData(generator) {
    const userDataFile = `${generator.resourceDir}/config/liquibase/data/user.csv`;
    generator.replaceContent(userDataFile, '1;', `${getUuid('user1')};`, false);
    generator.replaceContent(userDataFile, '2;', `${getUuid('user2')};`, false);

    const userAuthoritiesDataFile = `${generator.resourceDir}/config/liquibase/data/user_authority.csv`;
    generator.replaceContent(userAuthoritiesDataFile, '1;', `${getUuid('user1')};`, false);
    generator.replaceContent(userAuthoritiesDataFile, '2;', `${getUuid('user2')};`, false);
}

function replaceRegexNeedles(generator, file, regExNeedles) {
    regExNeedles.forEach(needle => {
        generator.replaceContent(file, needle.regex, needle.content);
    });
}

function convertInitialChangelog(generator) {
    const file = glob.sync(`${generator.resourceDir}/config/liquibase/changelog/*initial_schema.xml`)[0];
    // eslint-disable-next-line no-template-curly-in-string
    generator.replaceContent(file, 'id" type="bigint"', 'id" type="${uuidType}"', true);
    // eslint-disable-next-line no-template-curly-in-string
    generator.replaceContent(file, 'id" type="numeric"', 'id" type="${uuidType}"', true);
    generator.replaceContent(
        file,
        '<changeSet id="00000000000000" author="jhipster">',
        '<changeSet id="00000000000000" author="jhipster" context="test">'
    );
}

function convertLiquibaseChangelog(generator, entity) {
    const file = glob.sync(`${generator.resourceDir}/config/liquibase/changelog/*entity_${entity}.xml`)[0];
    // eslint-disable-next-line no-template-curly-in-string
    generator.replaceContent(file, 'id" type="bigint"', 'id" type="${uuidType}"', true);
    // eslint-disable-next-line no-template-curly-in-string
    generator.replaceContent(file, 'id" type="numeric"', 'id" type="${uuidType}"', true);
}

/**
 * Replace the Long types in a file based on the given needles.
 *
 * @param generator         The jhipster generator.
 * @param filePath          The file to modify.
 * @param replaceNeedles    Array of needles to replace.
 */
function replaceToLongToUUIDNeedles(generator, filePath, replaceNeedles) {
    replaceNeedles.forEach(needle => {
        generator.replaceContent(filePath, needle, needle.replace('Long', 'UUID'), false);
    });
}

/**
 * Insert the UUID java import when it's not in the imports yet.
 *
 * @param generator The jhipster generator.
 * @param filePath  The path to the file where the import should be added.
 * @param needle    The needle where to include the import.
 */
function insertUuidImport(generator, filePath, needle) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    if (fileContent.indexOf('import java.util.UUID') < 0) {
        generator.replaceContent(filePath, needle, `${needle}\n\nimport java.util.UUID;`);
    }
}
