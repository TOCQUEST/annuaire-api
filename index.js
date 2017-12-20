#!/usr/bin/env node
'use strict'

const Promise = require('bluebird')
const fs = Promise.promisifyAll(require('fs'))
const path = require('path')
const xml2js = Promise.promisifyAll(require('xml2js'))
var express = require('express')

const importData = require('./import')

function readXMLFile(path) {
    return fs.readFileAsync(path)
    .then(xml2js.parseStringAsync)
}

function readCommuneXMLFile(path) {
    return readXMLFile(path)
    .then(content => content.Commune.TypeOrganisme)
    .reduce((res, type) => {
        res[type.$.pivotLocal] = type.Organisme.map(organisme => organisme.$.id)
        return res
    }, {})
}

importData('data')
.then((data) => {

    function addCommuneData(req, res, next) {
        req.communeData = data.communes[req.params.commune_id]
        if (! req.communeData)
            return res.status(401).json({ message: `commune_id ${req.params.commune_id} not found` })

        if (req.communeData.content)
            return next()

        return readCommuneXMLFile(req.communeData.file)
        .then(data => req.communeData.content = data)
        .then(() => next())
    }

    function getOrganismeData(organisme_id) {
        let details = data.organismes[organisme_id]
        if (details.content)
            return Promise.resolve(details.content)

        return readXMLFile(details.file)
        .then(content => {
            details.content = content
            return content
        })
    }

    function getOrganisme(req, res) {
        req.organismeData = data.organismes[req.params.organisme_id]
        if (! req.organismeData)
            return res.status(401).json({ message: `organisme_id ${req.params.organisme_id} not found` })

        return getOrganismeData(req.params.organisme_id)
        .then((d) => res.json(d))
    }

    const port = process.env.PORT || 12345
    let app = express()

    let communeRouter = express.Router({ mergeParams: true })
    communeRouter.use(addCommuneData)

    communeRouter.get('/:pivot', (req, res) => {
        const organismeData = req.communeData.content[req.params.pivot]
        if (! organismeData)
            return res.status(401).json({ message: `pivot ${req.params.pivot} not found, must be in ${Object.keys(req.communeData.content)}` })

        Promise.map(organismeData, getOrganismeData)
        .then((d) => res.json(d))
    })


    let mainRouter = express.Router()
    mainRouter.use('/communes/:commune_id', communeRouter)
    mainRouter.get('/organismes/:organisme_id', getOrganisme)
    mainRouter.use((error, req, res, next) => {
        console.log(error)
        res.json({ message: 'error', error: error.message })
    })

    app.use('/v2', mainRouter)

    app.listen(port, () => {
        console.log('API listening on port %d', port)
    })
})
