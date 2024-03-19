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

/** ROUTES SECTION */ 

/**
 * Root Route
 *
 * Displays a message indicating that the Node API is ready.
 *
 * @route GET /
 * @returns {string} 200 - A message indicating that the Node API is ready
 */
app.get('/', (req, res) => {
    res.send('Hello node api is ready')
    let limitRemaining = bitvavo.getRemainingLimit();
    console.log(limitRemaining)
    console.log(bitvavo.time());
})

/**
 * Get Market Data for a Symbol
 *
 * Retrieves market data for a specified symbol.
 *
 * @route GET /markets/:symbol
 * @param {string} :symbol.path.required - The symbol for which market data is to be retrieved
 * @returns {object} 200 - Market data for the specified symbol
 * @returns {Error} 500 - Internal server error
 */
app.get('/markets/:symbol', async (req, res) => {
    let body = {};

    try {
        if (req.params.symbol) {
            body = {
                "market": req.params.symbol.toUpperCase() + "-EUR",
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

/**
 * Get Ticker Price for a Symbol
 *
 * Retrieves the ticker price for a specified symbol.
 *
 * @route GET /ticker/:symbol
 * @param {string} :symbol.path.required - The symbol for which ticker price is to be retrieved
 * @returns {object} 200 - Ticker price for the specified symbol
 * @returns {Error} 500 - Internal server error
 */
app.get('/ticker/:symbol', async (req, res) => {
    let body = {};

    try {
        if (req.params.symbol) {
            body = {
                "market": req.params.symbol.toUpperCase() + "-EUR",
            }
        }

        let response = await bitvavo.tickerPrice(body)
        const responseData = {...body, ... response}
        console.log(response)

        let formattedResponse = utils.formatDtoModels('ticker', responseData);
        res.json(formattedResponse);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})

/**
 * Get Ticker Price for a Symbol (24-hour)
 *
 * Retrieves the 24-hour ticker price for a specified symbol.
 *
 * @route GET /ticker24/:symbol
 * @param {string} :symbol.path.required - The symbol for which 24-hour ticker price is to be retrieved
 * @returns {object} 200 - 24-hour ticker price for the specified symbol
 * @returns {Error} 500 - Internal server error
 */
app.get('/ticker24/:symbol', async (req, res) => {
    let body = {};

    try {
        if (req.params.symbol) {
            body = {
                "market": req.params.symbol.toUpperCase() + "-EUR",
            }
        }

        let response = await bitvavo.ticker24h(body)
        const responseData = {...body, ... response}

        let m = utils.formatDtoModels('ticker', responseData);
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

/**
 * WEBSOCKET SECTION
 */

/**
 * Updated ticker24h objects are sent on this channel once per second. 
 * A ticker24h object is considered updated if one of the values besides timestamp has changed.
 */
// bitvavo.websocket.subscriptionTicker24h('BTC-EUR', (response) => {
//     // Perform any action
//     console.log(response)
// })

/**
 * Sends an update whenever an event happens which is related to the account. 
 * These are ‘order’ events (create, update, cancel) or ‘fill’ events (a trade occurred).
 */
// bitvavo.websocket.subscriptionAccount('BTC-EUR', (response) => {
//     console.log(response)
// })

app.listen(3000, () => {
    console.log('Server is running on port 3000')
    console.log('To navigate directly, go to: http://localhost:3000/')
})