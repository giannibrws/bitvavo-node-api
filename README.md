A node API developed to interact with the dutch crypto exchange platform Bitvavo.
Bitvavo allows users to trade various cryptocurrencies. The API provides functionalities to perform actions such as fetching market data, placing orders, and retrieving account balances on the Bitvavo platform.

Additionally, this script ships with a comprehensive Discord integration. Users can setup their own bot which can subsequently execute commands, perform trading operations, check account balances, view market data, and more! 

All within their own Discord server.


# Getting started

npm install
npm install -g nodemon
npm start


# Sources


Bitvavo uses a weight based rate limiting system, with an allowed limit of 1000 per IP or API key each minute. Please inspect each endpoint in the Bitvavo API documentation to see the weight. Failure to respect the rate limit will result in an IP or API key ban.

https://docs.bitvavo.com/
https://github.com/bitvavo/node-bitvavo-api
https://discord.js.org/