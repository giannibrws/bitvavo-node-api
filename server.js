require("dotenv").config();

const express = require('express')
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

app.get('/markets', async (req, res) => {
    try {
        let response = await bitvavo.markets()
        console.log(response)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data');
    }
})


app.get('/markets/:symbol', async (req, res) => {
    try {
        const b = {
            "market": req.params.symbol + "-EUR",
        }

        let response = await bitvavo.markets(b)
        console.log(req.params.symbol)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + 'symbol ' + req.params.symbol);
    }
})

app.get('/ticker', async (req, res) => {
    try {
        let response = await bitvavo.tickerPrice({})

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})


app.get('/ticker/:symbol', async (req, res) => {
    try {
        const b = {
            "market": req.params.symbol + "-EUR",
        }

        let response = await bitvavo.tickerPrice(b)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})


app.listen(3000, () => {
    console.log('server is running on port 3000')
    console.log('go to http://localhost:3000/')
})