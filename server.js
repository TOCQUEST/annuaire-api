var express = require('express')
const { prepareDataset } = require('./main')
const enrich = require('./enrich')

const dataset = enrich('data', prepareDataset())
const port = process.env.PORT || 12346
let app = express()

let mainRouter = express.Router()
mainRouter.get('/communes/:communeId/:pivot', (req, res) => {
  const pivots = new Set(req.params.pivot.split('+'))
  const commune = dataset.communes[req.params.communeId]

  if (!commune) {
    return res.status(401).json({ message: `communeId ${req.params.communeId} not found` })
  }

  let organismes = []
  pivots.forEach(pivot => {
    const pivotOrganismes = (commune.organismes[pivot] || []).map(organismeId => dataset.organismes[organismeId])
    organismes = organismes.concat(pivotOrganismes)
  })

  res.json({
    type: 'FeatureCollection',
    features: organismes
  })
})

mainRouter.get('/departements/:departementId/:pivot', (req, res) => {
  const pivots = new Set(req.params.pivot.split('+'))
  const departement = dataset.departements[req.params.departementId]

  if (!departement) {
    return res.status(401).json({ message: `departementId ${req.params.departementId} not found` })
  }

  let organismes = []
  pivots.forEach(pivot => {
    organismes = organismes.concat(departement.organismes[pivot] || [])
  })
  res.json({
    type: 'FeatureCollection',
    features: organismes
  })
})

mainRouter.get('/', (req, res) => {
  res.status(401).json({ message: `There is nothing here, you should use (communes|departements)/:id/:pivot. Both return GeoJSON.` })
})

mainRouter.use((error, req, res, next) => {
  console.log(error)
  res.json({ message: 'error', error: error.message })
})

app.use('/v3', mainRouter)

app.listen(port, () => {
  console.log('API listening on port %d', port)
})
