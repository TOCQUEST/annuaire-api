'use strict'

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

class DataSet {
    constructor(path) {
        this.path = path
        this.communes = {}
        this.regions = {}
        this.organismes = {}
    }
    create() {
        var ds = this

        const handler = (entityName, entityType, regionWork) => {
            const entityPath = path.join(ds.path, entityName)
            return fs.readdirAsync(entityPath)
            .filter(item => fs.lstatAsync(path.join(entityPath, item)).then(res => res.isDirectory()))
            .map(regionDirectory => {
                if (regionWork) {
                    regionWork(regionDirectory)
                }

                const subdirectoryPath = path.join(entityPath, regionDirectory)
                return fs.readdirAsync(subdirectoryPath)
                .map(file => new entityType(ds, path.join(subdirectoryPath, file)))
                .map(entity => this.regions[regionDirectory][entityName][entity.id] = entity)
            }, { concurrency: 5 })
        }

        return handler('communes', Commune, regionDirectory => {
            ds.regions[regionDirectory] = {
                communes: {},
                organismes: {}
            }
        }).then(handler('organismes', Organisme))
        .then(() => ds)
    }
}

class Commune {
    constructor(ds, communePath) {
        this.ds = ds;
        this.path = communePath
        const { name } = path.parse(this.path)
        this.id = name;
        this.ds.communes[this.id] = this;
    }
}

class Organisme {
    constructor(ds, organismePath) {
        this.ds = ds;
        this.path = organismePath
        const { name } = path.parse(this.path)
        this.id = name;
        this.ds.organismes[this.id] = this;
    }
}

module.exports = {
    Commune,
    DataSet,
    Organisme
}
