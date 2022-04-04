const DiscordJS = require("discord.js");
const { Intents } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");
const WAValidator = require("multicoin-address-validator");
const Web3 = require("web3");
const config = require("./config.js");
const { initWallet, unlockWallet } = require("./init.js");
const { sendCoins } = require("./send.js");
const LRU = require("lru-cache");
dotenv.config();

const cache = {
    BTC: new LRU({
        max: 500,
    }),
    LTC: new LRU({
        max: 500,
    }),
    ETH: new LRU({
        max: 500,
    }),
    USDT: new LRU({
        max: 500,
    }),
}

// needed to avoid sending multiple not yet accepted txns to the ethereum blockchain 
let ethReady = true;

const localdir =
    process.env.LOCALAPPDATA ||
    (process.platform == "darwin"
        ? process.env.HOME + "/Library/Application Support"
        : process.env.HOME + "/.local/share");
const dir = localdir + "/LazarusFaucet";

let wallet;
// wallet = {
//     btc: {
//         address: string,
//         macaroon: string,
//     },
//     ltc: {
//         address: string,
//         macaroon: string,
//     },
//     eth: {
//         address: string,
//         private: string,
//     }
// }

const web3 = new Web3("wss://rinkeby.infura.io/ws/v3/71aa74e8a7ad452a8c3809a184548998");

setTimeout(async () => {
    if (!fs.existsSync(dir + "/btc/data/chain/bitcoin/testnet/admin.macaroon")) {
        wallet = await initWallet(
            web3,
            config.mnemonic,
            config.password,
            config.birthTimestamp
        );
        console.log(wallet);
    } else {
        wallet = await unlockWallet(web3, config.mnemonic, config.password);
        console.log(wallet);
    }
}, 5000);

const client = new DiscordJS.Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

client.on("ready", () => {
    console.log("Faucet bot is up and running!");
});

client.on("messageCreate", async (message) => {
    // Ignore bots, including myself
    if (message.author.bot) return;

    // BTC-tb1qa...
    let coinAddress = message.content.split("-");

    // filter bad format
    if (coinAddress.length == 2) {
        let coin = coinAddress[0];
        let address = coinAddress[1];

        if (config.coins[coin] != undefined) {
            try {
                let valid = false;
                let validationCoin = coin;

                // if coin is a token -> validate eth address
                if (coin != "BTC" && "LTC") {
                    validationCoin = "ETH";
                }

                // validate address for given coin
                valid = WAValidator.validate(address, validationCoin, "testnet");

                if (valid) {
                    // check if user has already withdrawn
                    if (!cache[coin].has(message.author.id)) {

                        if (coin != "BTC" && "LTC") {
                            if (ethReady == false) {
                                message.reply({
                                    content:
                                        "Please wait for the previous ethereum transaction to be accepted by the blockchain!",
                                });
                                return;
                            } else {
                                ethReady = false;
                            }
                        }

                        // add user in queue
                        cache[coin].set(message.author.id, 1, {
                            ttl: 1000 * 60 * 60 * config.limit
                        });

                        let txHash = await sendCoins(web3, wallet, coin, address, config.coins[coin].amount);

                        let txExplorer;
                        switch (coin) {
                            case "BTC":
                                txExplorer = "https://www.blockchain.com/btc-testnet/tx/" + txHash;
                                break;
                            case "LTC":
                                txExplorer = "https://blockexplorer.one/litecoin/testnet/tx/" + txHash;
                                break;
                            default:
                                txExplorer = "https://rinkeby.etherscan.io/tx/" + txHash;
                                ethReady = true;
                                break;
                        }

                        let msg = "Sent " + config.coins[coin].amount + " " + coin + ": " + txExplorer;
                        console.log(msg);

                        message.reply({
                            content: msg,
                        });

                    } else {
                        message.reply({
                            content:
                                "Please wait for " +
                                config.limit +
                                " hours between coin requests from the same account!",
                        });
                    }
                } else {
                    message.reply({
                        content: coin + " address not valid!",
                    });
                }
            } catch (error) {
                console.log(coin + " ERROR: " + error);
            }
        }
        else {
            console.log(coin + " not supported");
        }
    }
});

client.login(process.env.TOKEN);
