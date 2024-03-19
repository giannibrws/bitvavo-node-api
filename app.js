console.log('hi')

const express = require('express')
const app = express()

// Routes

app.get('/', (req, res) => {
    res.send('Hello node api is ready')
})

app.listen(3000, () => {
    console.log('server is running on port 3000')
    console.log('go to http://localhost:3000/')
})



