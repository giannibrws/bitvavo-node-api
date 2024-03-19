A simple node API developed to interact with the dutch crypto exchange platform Bitvavo


# Getting started

npm install
npm install -g nodemon

npm start


# Sources


Bitvavo uses a weight based rate limiting system, with an allowed limit of 1000 per IP or API key each minute. Please inspect each endpoint in the Bitvavo API documentation to see the weight. Failure to respect the rate limit will result in an IP or API key ban.

https://docs.bitvavo.com/
https://github.com/bitvavo/node-bitvavo-api
https://discord.js.org/