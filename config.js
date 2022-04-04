var config = {};

// wallet setup
config.mnemonic = "24 word bip39 mnemonic";
config.password = "password";
// 01-01-2022
config.birthTimestamp = "1640995200"; // ignore, for faster lnd sync
config.coins = {
    BTC: {
        amount: "0.0001"
    },
    // LTC: {
    //     amount: "1"
    // },
    ETH: {
        amount: "0.0001"
    },
    USDT: {
        amount: "0.0001"
    },
}
config.limit = 12; // limit in hours

module.exports = config;