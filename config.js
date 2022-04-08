var config = {};

// discord bot token
config.token = ""

// mnemonic for eth wallet
config.mnemonic = "";
config.ethProvider = ""

config.ports = {
    BTC: "8080",
    LTC: "8081"
}

// admin.macaroon absolute path
config.macaroonDir = {
    BTC: "",
    LTC: ""
}

config.coins = {
    BTC: {
        amount: "0.0001"
    },
    LTC: {
        amount: "0.0001"
    },
    ETH: {
        amount: "0.0001"
    },
    USDT: {
        amount: "0.0001",
        contract: "0xD92E713d051C37EbB2561803a3b5FBAbc4962431",
        decimals: 6
    },
    USDC: {
        amount: "0.0001",
        contract: "0x4DBCdF9B62e891a7cec5A2568C3F4FAF9E8Abe2b",
        decimals: 6
    },
}

// limit in hours
config.limit = 12;

module.exports = config;