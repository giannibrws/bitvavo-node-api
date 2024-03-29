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
    EmbedBuilder,
    ButtonStyle} 
= require('discord.js');

const ticker = require('./models/tickerModel')
const order = require('./models/orderModel')

const utils = require('./utils/utils');
const { error } = require("console");
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
    message.reply('Hallo');
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
let createOrderParams = {};

// Event listener for when a message is received
client.on('interactionCreate', async (interaction) => {
  // Ignore messages from the bot itself
  if (interaction.isCommand()) {
    if (interaction.commandName === 'buy-now') {
        let chosenSymbol = interaction.options.get('symbol')?.value ?? '';
        let chosenPrice = interaction.options.get('price')?.value ?? '';
        let chosenAmount = interaction.options.get('amount')?.value ?? '';

        createOrderParams = {
            'symbol': chosenSymbol,
            'price': chosenPrice,
            'amount': chosenAmount,
        }

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
      } else if (interaction.commandName === 'view-orders') {
        let chosenSymbol = interaction.options.get('symbol')?.value ?? '';
        try {
            let openOrders = await viewOrders(chosenSymbol);
            let transformedOrders = openOrders.map(orderData => new order(orderData));

            // Prettify the JSON data
            let formattedOrders = JSON.stringify(transformedOrders, null, 2);

            // Create a message embed to display the formatted JSON
            const embed = new EmbedBuilder()
                .setTitle('Orders')
                .setDescription('Here are all the open orders for ' + chosenSymbol)
                .setColor('#0099ff')
                .addFields(
                    {
                        name: 'Order Data', 
                        value: '```json\n' + formattedOrders + '\n```',
                    }
                ) 
            
            // Reply with the message embed
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('Failed to retrieve orders. Please try again later.');
        }
      } else if (interaction.commandName === 'view-portfolio') {
        try {
            let assets = await viewAssets();

            // Prettify the JSON data
            let formattedAssets = JSON.stringify(assets, null, 2);
            console.log(formattedAssets)

            // Create a message embed to display the formatted JSON
            const embed = new EmbedBuilder()
                .setTitle('Your portfolio')
                .setColor('#ffc000')
                .addFields(
                    {
                        name: 'Asset values', 
                        value: '```json\n' + formattedAssets + '\n```',
                    }
                ) 
            
            // Reply with the message embed
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply('Failed to retrieve assets. Please try again later.');
        }
      }

  }  else if (interaction.isButton()) {
    console.log(interaction)
    if (interaction.customId === 'btn-accept') {
        // Proceed with the buy operation
        await interaction.reply('Making buy request');

        try {
            let res = await createOrder(createOrderParams.symbol, createOrderParams);
            // If the order creation is successful, send another message
            await interaction.followUp(JSON.stringify(res));
        } catch (error) {
            // Handle errors if the order creation fails
            console.error(error);
            await interaction.followUp('Failed to create order. Please try again later.');
        }
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
    try {
        if (!req.params.symbol) {
            throw error('no symbol')
        }

        let response = await getCurrentMarketPrice(req.params.symbol)
        res.json(response);
    } catch (error) {
        console.log(error)
        res.status(500).send('Error fetching market data ' + error + ' given symbol: ' + req.params.symbol);
    }
})

// Function to fetch current market price for a given symbol
async function getCurrentMarketPrice(symbol) {
    try {
      // Prepare the request body
      const body = {
        market: symbol.toUpperCase() + '-EUR'
      };
  
      // Fetch ticker price for the symbol from Bitvavo
      const response = await bitvavo.tickerPrice(body);
  
      // Return the last price from the ticker data
      return parseFloat(response.price);
    } catch (error) {
      console.error('Error fetching current market price for symbol:', symbol, error);
      throw error; // Throw the error for handling at the higher level
    }
  }

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
    let response = await viewAssets();
    res.json(response);
})

// Define the function to handle asset retrieval
async function viewAssets() {
    try {
        let balance = await bitvavo.balance();

         // Initialize total balance in euros
        let totalBalanceEuros = 0;

        // Iterate over each asset balance
        for (const [index, asset] of balance.entries()) {
            // Dont get price for euros ofc
            let marketPrice;

            // Fetch current market price for the asset
            if (asset.symbol === 'EUR') {
                marketPrice = 1;
            } else {
                marketPrice = await getCurrentMarketPrice(asset.symbol);
            }

            // Calculate value of the asset in euros
            const assetValueEuros = parseFloat(asset.available) * marketPrice;
            balance[index].priceInEuros = '€' + assetValueEuros.toFixed(2).toString();

            // Add asset value to total balance in euros
            totalBalanceEuros += assetValueEuros;
        }

        // Return the total balance in euros
        let totalBalance = {
            'totalBalance': '€' + parseFloat(totalBalanceEuros).toFixed(2).toString(),
        }

        let newRes = {...balance, totalBalance}

        return newRes; // Return the response from the function
    } catch (error) {
        console.log(error);
        throw new Error('Error fetching asset data: ' + error.message); // Throw a new error with the appropriate message
    }
}


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
    const response = await createOrder(req.params.symbol, req.body);
    res.json(response);
});

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
    const response = await viewOrder(req.params.symbol, req.params.orderUuid);
    res.json(response);
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

/**
 * Create an open order on the Bitvavo platform
 * 
 * @param {String} symbol 
 * @param {JSON} body (request params)
 * @returns {JSON}
 */
async function createOrder(symbol, body) {
    symbol = symbol.toUpperCase();
    let postData = {};

    try {
        if (!symbol) {
            throw new Error('Missing symbol');
        }

        const market = symbol + "-EUR";

        if (!body.amount) {
            throw new Error('No amount specified');
        }

        if (!body.action) {
            throw new Error('No action specified, options are buy/sell');
        }

        // Handle lower priced tickers           
        let price = body.price;

        if (Number(price) < 1) {
            price = parseFloat(body.price).toFixed(4).toString(); // Use a maximum of five digits for price
        } else if (Number(price) > 5 && body.action === 'buy') {
            throw new Error('Abort, price too high!');
        } else {
            price = parseFloat(body.price).toFixed(2).toString();
        }

        postData = {
            amount: body.amount,
            price: price, 
        };

        // Optional parameters: limit:(amount, price, postOnly), market:(amount, amountQuote, disableMarketProtection),
        // stopLoss/takeProfit:(amount, amountQuote, disableMarketProtection, triggerType, triggerReference, triggerAmount)
        // stopLossLimit/takeProfitLimit:(amount, price, postOnly, triggerType, triggerReference, triggerAmount)
        // all orderTypes: timeInForce, selfTradePrevention, responseRequired, clientOrderId

        return await bitvavo.placeOrder(market, body.action, 'limit', postData);
    } catch (error) {
        const minValue = await getMininimalQuoteOrderValue(symbol);

        return {
            'error-message': "Error fetching market data. " + error,
            'symbol': symbol,
            'request-body': body,
            'amountQuotes': minValue
        };
    }
}

// Define the function to handle order retrieval
async function viewOrder(symbol, orderUuid) {
    try {
        if (!symbol) {
            throw new Error('Missing symbol');
        }

        const market = symbol.toUpperCase() + "-EUR";
        const response = await bitvavo.getOrder(market, orderUuid);
        return response;
    } catch (error) {
        return {
            'error-message': "Error retrieving order " + error,
            'symbol': symbol,
            'orderUuid': orderUuid
        };
    }
}

// Define the function to handle order retrieval
async function viewOrders(symbol, openOnly = true) {
    try {
        if (!symbol) {
            throw new Error('Missing symbol');
        }

        const market = symbol.toUpperCase() + "-EUR";
        let response;

        // Get only open orders
        if (openOnly) {
            const orders = await bitvavo.ordersOpen({});
            response= orders.filter(order => order.market === market);
        } else {
            response = await bitvavo.getOrders(market, {});
        }

        return response;
    } catch (error) {
        return {
            'error-message': "Error retrieving order " + error,
            'symbol': symbol,
        };
    }
}

app.listen(3000, () => {
    console.log('Server is running on port 3000')
    console.log('To navigate directly, go to:' + process.env.BASE_URL)
})