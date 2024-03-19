require("dotenv").config();

const express = require('express')
const ticker = require('./models/tickerModel')
const utils = require('./utils/utils');

const app = express()

// Bitvavo config
const bitvavo = require('bitvavo')().options({
    APIKEY: process.env.BITVAVO_API_KEY,
    APISECRET: process.env.BITVAVO_API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: 'https://api.bitvavo.com/v2',
    WSURL: 'wss://ws.bitvavo.com/v2/',
    DEBUGGING: false
})

// Routes
app.get('/', (req, res) => {
    res.send('Hello node api is ready')
    let limitRemaining = bitvavo.getRemainingLimit();
    console.log(limitRemaining)
    console.log(bitvavo.time());
})

app.get('/markets/:symbol', async (req, res) => {
    let body = {};

    try {
        if (req.params.symbol) {
            body = {
                "market": req.params.symbol + "-EUR",
            }
        }

        let response = await bitvavo.markets(body)
        console.log(req.params.symbol)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + 'symbol ' + req.params.symbol);
    }
})

app.get('/ticker/:symbol', async (req, res) => {
    let body = {};

    try {
        if (req.params.symbol) {
            body = {
                "market": req.params.symbol + "-EUR",
            }
        }

        let response = await bitvavo.tickerPrice(body)

        console.log(response)

        b2 = {
            'symbol': req.params.symbol,
            'market': response.market,
            'price': response.price,
        }

        let m = utils.formatDtoModels('ticker', b2);
        console.log(m)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})

app.get('/ticker24/:symbol', async (req, res) => {
    let body = {};

    try {
        if (req.params.symbol) {
            body = {
                "market": req.params.symbol + "-EUR",
            }
        }

        let response = await bitvavo.tickerPrice(body)

        b2 = {
            'symbol': req.params.symbol,
            'market': response.market,
            'price': response.price,
        }

        let m = utils.formatDtoModels('ticker', b2);
        console.log(m)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})

/**
 * Get account balances for all assets.
 * 
 * Retrieves the current account balances for all assets available on the platform.
 * 
 * @route GET /assets
 * @returns {object} 200 - An object containing account balances for all assets
 * @returns {Error} 500 - Internal server error
 */
app.get('/assets', async (req, res) => {
    try {
        let response = await bitvavo.balance()

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})

app.listen(3000, () => {
    console.log('Server is running on port 3000')
    console.log('To navigate directly, go to: http://localhost:3000/')
})