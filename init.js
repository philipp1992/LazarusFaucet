const axios = require("axios");
const https = require("https");
const WebSocket = require('ws');
const fs = require("fs");
const ethers = require("ethers");
const { mnemonicToSeed } = require("ethereum-cryptography/bip39");
const { HDKey } = require("ethereum-cryptography/hdkey");

const LOCALDIR = process.env.LOCALAPPDATA ||
    (process.platform == "darwin"
        ? process.env.HOME + "/Library/Application Support"
        : process.env.HOME + "/.local/share");

const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // (NOTE: this will disable client verification)
});

async function initWallet(web3, mnemonic, password, birthTimestamp) {
    const seedArray = await mnemonicToSeed(mnemonic);
    const masterkey = HDKey.fromMasterSeed(seedArray, {
        // testnet
        private: 0x04358394,
        public: 0x043587cf,
    }).privateExtendedKey;

    const pass = btoa(password);

    let data = {
        wallet_password: pass,
        extended_master_key: masterkey,
        extended_master_key_birthday_timestamp: birthTimestamp,
    };

    // --- BTC wallet
    let response = await axios
        .post("https://127.0.0.1:8080/v1/initwallet", data, { httpsAgent })
        .then((res) => {
            return res.data;
        })
        .catch((error) => {
            return error.response.data;
        });

    if (response["admin_macaroon"] == undefined) {
        let err = {
            error: "Error in BTC wallet creation",
        };
        switch (response["message"]) {
            case "wallet already unlocked, WalletUnlocker service is no longer available":
                err.error = "Wallet already created!";
                break;
            case "wallet already exists":
                err.error = "Wallet already created!";
                break;
            case "password must have at least 8 characters":
                err.error = "Password must have at least 8 characters";
                break;
            default:
                err.error = "Error in BTC wallet creation";
                break;
        }

        return err;
    } else {

        let btcMacaroonHexString = response["admin_macaroon"];

        // --- LTC wallet ---
        response = await axios
            .post("https://127.0.0.1:8081/v1/initwallet", data, { httpsAgent })
            .then((res) => {
                return res.data;
            })
            .catch((error) => {
                return error.response.data;
            });

        if (response["admin_macaroon"] == undefined) {
            let err = {
                error: "Error in LTC wallet creation",
            };
            switch (response["message"]) {
                case "wallet already unlocked, WalletUnlocker service is no longer available":
                    err.error = "Wallet already created!";
                    break;
                case "wallet already exists":
                    err.error = "Wallet already created!";
                    break;
                case "password must have at least 8 characters":
                    err.error = "Password must have at least 8 characters";
                    break;
                default:
                    err.error = "Error in BTC wallet creation";
                    break;
            }

            return err;
        } else {

            let ltcMacaroonHexString = response["admin_macaroon"];

            // --- ETH wallet ---
            try {
                const ethWallet = ethers.Wallet.fromMnemonic(mnemonic);
                console.log("Wallet initialized, wait for servers to start up...");

                try {
                    const ethAccount = await web3.eth.accounts.privateKeyToAccount(ethWallet.privateKey);
                    const btcAddress = await getBtcAddress(btcMacaroonHexString);
                    const ltcAddress = "";
                    // const ltcAddress = await getLtcAddress(ltcMacaroonHexString);

                    console.log("READY!");
                    return {
                        btc: {
                            address: btcAddress,
                            macaroon: btcMacaroonHexString,
                        },
                        ltc: {
                            address: ltcAddress,
                            macaroon: ltcMacaroonHexString,
                        },
                        eth: {
                            address: ethAccount.address,
                            private: ethAccount.privateKey,
                        },
                    };
                } catch (error) {
                    return { error: "Error unlocking ETH wallet!" + error };
                }
            } catch (error) {
                return { error: "Error in ETH wallet creation: " + error };
            }
        }
    }
}

async function unlockWallet(web3, mnemonic, password) {

    const pass = btoa(password);

    const data = {
        wallet_password: pass,
    };

    // --- BTC wallet ---
    let dir = LOCALDIR + "/LazarusFaucet/btc";

    const macaroon = fs.readFileSync(
        dir + "/data/chain/bitcoin/testnet/admin.macaroon"
    );
    var btcMacaroonHexString = macaroon.toString("hex");

    const headers = {
        "Grpc-Metadata-macaroon": btcMacaroonHexString,
    };

    let response = await axios
        .post("https://127.0.0.1:8080/v1/unlockwallet", data, {
            httpsAgent,
            headers: headers,
        })
        .then((res) => {
            return res.data;
        })
        .catch((error) => {
            return error.response.data;
        });

    if (JSON.stringify(response) == "{}") {
        // --- LTC wallet ---
        dir = LOCALDIR + "/LazarusFaucet/ltc";

        const macaroon = fs.readFileSync(
            dir + "/data/chain/litecoin/testnet/admin.macaroon"
        );
        var ltcMacaroonHexString = macaroon.toString("hex");

        const headers = {
            "Grpc-Metadata-macaroon": ltcMacaroonHexString,
        };

        let response = await axios
            .post("https://127.0.0.1:8081/v1/unlockwallet", data, {
                httpsAgent,
                headers: headers,
            })
            .then((res) => {
                return res.data;
            })
            .catch((error) => {
                return error.response.data;
            });

        if (JSON.stringify(response) == "{}") {

            const ethWallet = ethers.Wallet.fromMnemonic(mnemonic);
            console.log("Wallet unlocked, wait for servers to start up...");

            try {
                const ethAccount = await web3.eth.accounts.privateKeyToAccount(ethWallet.privateKey);
                const btcAddress = await getBtcAddress(btcMacaroonHexString);
                const ltcAddress = "";
                // const ltcAddress = await getLtcAddress(ltcMacaroonHexString);

                console.log("READY!");
                return {
                    btc: {
                        address: btcAddress,
                        macaroon: btcMacaroonHexString,
                    },
                    ltc: {
                        address: ltcAddress,
                        macaroon: ltcMacaroonHexString,
                    },
                    eth: {
                        address: ethAccount.address,
                        private: ethAccount.privateKey,
                    },
                };
            } catch (error) {
                return { error: "Error unlocking ETH wallet!" + error };
            }

        }
    } else if (response["message"] == "invalid passphrase for master public key")
        return { error: "Wrong password!" };
    else return { error: "Wallet already unlocked!" };
}

async function getBtcAddress(macaroon) {

    const wsState = new WebSocket('wss://127.0.0.1:8080/v1/state/subscribe?method=GET', {
        rejectUnauthorized: false,
    });

    const headers = {
        "Grpc-Metadata-macaroon": macaroon,
    };

    return new Promise(async function (resolve, reject) {
        wsState.on('message', async (message) => {
            if (JSON.parse(message).result != undefined) {
                console.log("BTC wallet state \t| " + JSON.parse(message).result.state);
                if (JSON.parse(message).result != undefined && JSON.parse(message).result.state == "SERVER_ACTIVE") {
                    let btcAddress = await axios
                        .post("https://127.0.0.1:8080/v2/wallet/address/next", { type: 1 }, { httpsAgent, headers: headers, })
                        .then((res) => {
                            return res.data.addr;
                        })
                        .catch((error) => {
                            return error.response.data;
                        });

                    resolve(btcAddress);
                }
            }
        });
    });
}

async function getLtcAddress(macaroon) {

    const wsState = new WebSocket('wss://127.0.0.1:8081/v1/state/subscribe?method=GET', {
        rejectUnauthorized: false,
    });

    const headers = {
        "Grpc-Metadata-macaroon": macaroon,
    };

    return new Promise(async function (resolve, reject) {
        wsState.on('message', async (message) => {
            if (JSON.parse(message).result != undefined) {
                console.log("LTC Wallet state \t| " + JSON.parse(message).result.state);
                if (JSON.parse(message).result.state == "SERVER_ACTIVE") {
                    let ltcAddress = await axios
                        .post("https://127.0.0.1:8081/v2/wallet/address/next", { type: 1 }, { httpsAgent, headers: headers, })
                        .then((res) => {
                            return res.data.addr;
                        })
                        .catch((error) => {
                            return error.response.data;
                        });

                    resolve(ltcAddress);
                }
            }
        });
    });
}

module.exports.initWallet = initWallet;
module.exports.unlockWallet = unlockWallet;
