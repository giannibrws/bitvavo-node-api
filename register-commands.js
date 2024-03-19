require("dotenv").config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands= [
    {
        name: 'buy-now',
        description: 'Create a buy order',
        options: [
            {
                name: 'symbol',
                description: 'Symbol of the coin you want to buy',
                type: ApplicationCommandOptionType.String,
                choices: [
                    {
                        name: 'BTC',
                        value: 'BTC',
                    },
                    {
                        name: 'VET',
                        value: 'VET',
                    },
                    {
                        name: 'XRP',
                        value: 'XRP',
                    },
                ],
                required: true,
            },
            {
                name: 'price',
                description: 'Price of the coin you want to buy',
                type: ApplicationCommandOptionType.Number,
                required: true,
            },
            {
                name: 'amount',
                description: 'Amount of coins you want to buy',
                type: ApplicationCommandOptionType.Number,
                required: true,

            },
        ]
    }
];

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN)

const slashRegister = async () => {
    try {
        console.log('registering commands')
        await rest.put(
            Routes.applicationGuildCommands(
                process.env.DISCORD_BOT_CLIENT_ID, 
                process.env.DISCORD_GUILD_ID),
            {
                body: commands
            }
        )

        console.log('finished registering commands')
    } catch (error) {
        console.log(error)
    }
}

slashRegister();
