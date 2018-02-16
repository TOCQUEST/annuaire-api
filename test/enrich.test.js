const assert = require('assert')
const enrich = require('../enrich')

describe('enrich', function () {
  let dataset

  before((done) => {
    dataset = {
      communes: {
        '29011': {
          organismes: {}
        }
      },
      departements: {
        '29': {
          organismes: {}
        }
      },
      organismes: {}
    }
    enrich('./data', dataset).then(() => done())
  })

  it('adds organisme', () => {
    assert.equal(Object.keys(dataset.organismes).length, 1)
  })

  it('adds an organisme in commune', () => {
    assert.equal(Object.keys(dataset.communes['29011'].organismes).length, 1)
    assert.equal(Object.keys(dataset.communes['29011'].organismes.cdas).length, 1)
  })

  it('adds an organisme in departement', () => {
    assert.equal(Object.keys(dataset.departements['29'].organismes).length, 1)
    assert.equal(Object.keys(dataset.departements['29'].organismes.cdas).length, 1)
  })
})
