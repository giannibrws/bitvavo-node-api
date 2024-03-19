require("dotenv").config();

const express = require('express')
const axios = require('axios');
const { 
    Client, 
    GatewayIntentBits, 
    MessageActionRow,
    MessageButton, 
    ComponentType, 
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle} 
= require('discord.js');

const ticker = require('./models/tickerModel')
const utils = require('./utils/utils');
const app = express()

// Allow express to parse JSON bodies
app.use(express.json())

// Bitvavo config
const bitvavo = require('bitvavo')().options({
    APIKEY: process.env.BITVAVO_API_KEY,
    APISECRET: process.env.BITVAVO_API_SECRET,
    ACCESSWINDOW: 10000,
    RESTURL: 'https://api.bitvavo.com/v2',
    WSURL: 'wss://ws.bitvavo.com/v2/',
    DEBUGGING: false
})


/** DISCORD SECTION */ 

// Create a new Discord client instance
const client = new Client({
    intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

// Event listener for when the bot is ready
client.on('ready', (c) => {
  console.log(` ${c.user.tag} is online!`);

});

// Event listener for when a message is received
client.on('messageCreate', message => {
    // console.log(message)
  // Ignore messages from the bot itself
  if (message.author.bot) return;

  // Check if the message starts with the prefix '!'
  if (message.content.startsWith('!nexus')) {
    // Send a reply to the message author
    message.reply('We zijn dr');

    if (message.content.startsWith('!nexus')) {
        let msg = message.content
    }
  }
});

const yesButton = new ButtonBuilder()
.setLabel('Yes')
.setStyle(ButtonStyle.Primary)
.setCustomId('btn-accept')

const noButton = new ButtonBuilder()
.setLabel('No')
.setStyle(ButtonStyle.Secondary)
.setCustomId('btn-cancel')

const btnRow = new ActionRowBuilder().addComponents(yesButton, noButton)

// Event listener for when a message is received
client.on('interactionCreate', async (interaction) => {
  // Ignore messages from the bot itself
  if (interaction.isCommand()) {
    if (interaction.commandName === 'buy-now') {
        let chosenSymbol = interaction.options.get('symbol')?.value ?? '';
        let chosenPrice = interaction.options.get('price')?.value ?? '';
        let chosenAmount = interaction.options.get('amount')?.value ?? '';

        console.log(chosenAmount)

        if (chosenAmount > 1000) {
            interaction.reply('You better not be doing that right now')
        } else {
            let msg = `Are you sure you want to buy ${chosenAmount} ${chosenSymbol} for € ${chosenPrice}?`;

            console.log(msg)
            reply = interaction.reply({
                content: msg,
                components: [btnRow]
            });
        }
      } 
  }  else if (interaction.isButton()) {
    console.log(interaction)
    if (interaction.customId === 'btn-accept') {
        // Proceed with the buy operation
        interaction.reply('Making buy request');
    } else if (interaction.customId === 'btn-cancel') {
        interaction.reply('Buy operation canceled.');
    }
}
});

// Login to Discord with your app's token
client.login(process.env.DISCORD_BOT_TOKEN);

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


/**
 * TRADING SECTION
 */


/**
 * Create an open order on the Bitvavo platform
 * e.g. /create-order/VET
 *
 * @route POST /create-order/:symbol
 * @param {string} :symbol.path.required - The token to buy
 * @returns {object} 200 - 
 * @returns {Error} 500 - Internal server error
 */
app.post('/create-order/:symbol', async (req, res) => {
    let postData = {};

    if (!req.params.symbol) {
        return
    }

    try {
        const market = req.params.symbol.toUpperCase() + "-EUR";

        if (!req.body.amount) {
            res.status(500).send('no amount');
            return; // Halt function execution
        }

        if (!req.body.action) {
            res.status(500).send('no action given, options = buy/sell');
            return; // Halt function execution
        }

        // https://docs.bitvavo.com/#tag/Trading-endpoints/paths/~1order/post
        let price = req.body.price;

        // Handle lower priced tickers           
        if (Number(price) < 1) {
            price = parseFloat(req.body.price).toFixed(4).toString() // You can use a maximum of five digits for price
        } else if (Number(price) > 5 && req.body.action === 'buy') {
            res.status(500).send({
                'error-message': 'Abort, price too high!',
                'price': price,
            });
            return; // Halt function execution
        } else {
            price = parseFloat(req.body.price).toFixed(2).toString()
        } 

        postData = {
            amount: req.body.amount,
            price: price, 
        }

     // Optional parameters: limit:(amount, price, postOnly), market:(amount, amountQuote, disableMarketProtection),
        // stopLoss/takeProfit:(amount, amountQuote, disableMarketProtection, triggerType, triggerReference, triggerAmount)
        // stopLossLimit/takeProfitLimit:(amount, price, postOnly, triggerType, triggerReference, triggerAmount)
        //  all orderTypes: timeInForce, selfTradePrevention, responseRequired, clientOrderId

        let response = await bitvavo.placeOrder(market, req.body.action, 'limit', postData)
        console.log(response)

        res.json(response);
    } catch (error) {
        console.log(error)

        getMininimalQuoteOrderValue(req.params.symbol.toUpperCase())
        .then(minValue => {
            console.log(minValue);
    
            res.status(500).send({
                'error-message': "Error fetching market data " + error,
                'symbol': req.params.symbol,
                'request-body': postData,
                'amountQuotes': minValue
            });
        })
    }
})

/**
 * Retrieves order information for a specific symbol and order UUID.
 * 
 * This endpoint fetches details for the specified order identified by its UUID.
 * 
 * @route GET /get-order/:symbol/:orderUuid
 * @param {string} :symbol - The symbol for which the order details are requested.
 * @param {string} :orderUuid - The UUID of the order for which details are requested.
 * @returns {object} 200 - An object containing details of the requested order.
 * @returns {object} 500 - An error message if there was an issue retrieving the order details.
 */
app.get('/get-order/:symbol/:orderUuid', async (req, res) => {
    let postData = {};

    if (!req.params.symbol) {
        return
    }

    try {
        const market = req.params.symbol.toUpperCase() + "-EUR";
        let response = await bitvavo.getOrder(market, req.params.orderUuid)
        console.log(response)

        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send({
            'error-message': "Error retrieving order " + error,
            'symbol': req.params.symbol,
            'request-body': postData,
        });
    }
})

/**
 * Get the minimal quote value needed to create an order on the Bitvavo platform
 * 
 * @param {*} symbol 
 * @returns 
 */
function getMininimalQuoteOrderValue(symbol) {
    return axios.get(process.env.BASE_URL + '/markets/' + symbol, {})
        .then((response) => {
            return response.data;
        })
        .catch((error) => {
            console.error(error);
            return response.error;
        });
}

app.listen(3000, () => {
    console.log('Server is running on port 3000')
    console.log('To navigate directly, go to:' + process.env.BASE_URL)
})