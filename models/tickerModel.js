class Ticker {
    constructor(params) {
        this.name = params.name;
        this.symbol = params.symbol;
        this.price = params.price;
        this.quantity = params.quantity;
        this.market = params.market;
        this.createdAt = params.createdAt;
        this.timestamp = params.timestamp;
        this.volume = params.volume;
    }

    // Function to format ticker data (To-do)
    format(params) {
        return {
            name: this.name,
            symbol: this.symbol,
            price: params.last,
            quantity: this.quantity,
            market: this.market,
            createdAt: this.createdAt,
            timestamp: this.timestamp
        };
    }
}

module.exports = Ticker;