const path = require('path')

const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs'))
const yaml = require('js-yaml')

function YAMLtoJSON (p) {
  return fs.readFileAsync(p)
    .then(yaml.safeLoad)
    .then(organisme => {
      organisme.horaires = organisme.horaires || (organisme['accueil physique'] && organisme['accueil physique'].horaires)

      const geoJson = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [null, null]
        },
        properties: organisme
      }

      return {
        path: p,
        json: geoJson
      }
    })
}

function addOrganismes (folder, dataset) {
  return Promise.map(fs.readdirAsync(folder), departementFolder => {
    const departementPath = path.join(folder, departementFolder)

    return Promise.map(fs.readdirAsync(departementPath), organismeFile => {
      const organismePath = path.join(departementPath, organismeFile)
      return YAMLtoJSON(organismePath)
        .then(organisme => {
          const props = organisme.json.properties
          dataset.organismes[props.pivotLocal] = dataset.organismes[props.pivotLocal] || []
          dataset.organismes[props.pivotLocal].push(organisme.json)

          props.zonage.communes.forEach(communesLabel => {
            const communeId = communesLabel.slice(0, 5)

            let commune = dataset.communes[communeId]
            if (!commune) {
              return
            }

            commune.organismes[props.pivotLocal] = commune.organismes[props.pivotLocal] || []
            commune.organismes[props.pivotLocal].push(organisme.json)
          })

          if (!dataset.departements[departementFolder]) {
            return dataset
          }

          let departement = dataset.departements[departementFolder]
          departement.organismes[props.pivotLocal] = departement.organismes[props.pivotLocal] || []
          departement.organismes[props.pivotLocal].push(organisme.json)

          return dataset
        })
    })
  }).then(() => dataset)
}

module.exports = addOrganismes
