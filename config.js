var config = {};

// discord bot token
config.token = ""

// mnemonic for eth wallet
config.mnemonic = "";
config.ethProvider = ""

config.lnd.btc = {
    port: "10000",
    host: "lnd-btc",
    macaroonDir: "/opt/faucet/conf/lnd/btc/admin.macaroon"
}

config.lnd.ltc = {
    port: "10000",
    host: "lnd-ltc",
    macaroonDir: "/opt/faucet/conf/lnd/ltc/admin.macaroon"
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