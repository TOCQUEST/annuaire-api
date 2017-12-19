const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')

module.exports = (dataPath) => {
    return Promise.all(['communes', 'organismes'].map(folder => {
        const mainPath = path.join(dataPath, folder)
        return fs.readdirAsync(mainPath)
        .filter(item => fs.lstatAsync(path.join(mainPath, item)).then(res => res.isDirectory()))
        .map(subdirectory => {
            const subdirectoryPath = path.join(mainPath, subdirectory)
            return fs.readdirAsync(subdirectoryPath)
            .then(files => {
                return files.reduce((res, file) => {
                    const { name } = path.parse(file)
                    res[name] = {
                        file: path.join(subdirectoryPath, file)
                    }
                    return res
                }, {})
            })
        }, { concurrency: 5 })
        .then(lists => Object.assign(...lists))
        .then(object => {
            return {
                [folder]: object
            }
        })
    }))
    .then(lists => Object.assign(...lists))
}
