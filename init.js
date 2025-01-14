const axios = require("axios");
const https = require("https");
const WebSocket = require('ws');
const fs = require("fs");
const ethers = require("ethers");
const config = require("./config.js");

const httpsAgent = new https.Agent({
    rejectUnauthorized: false // (NOTE: this will disable client verification)
});

async function unlockWallet(web3, mnemonic) {

    // You must unlock the btc and ltc lnd wallets manually!!

    // --- BTC wallet ---
    const btcMacaroon = fs.readFileSync(config.lnd.btc.macaroonDir);
    const btcMacaroonHexString = btcMacaroon.toString("hex");
    console.log(btcMacaroonHexString)
    // --- LTC wallet ---
    const ltcMacaroon = fs.readFileSync(config.lnd.ltc.macaroonDir);
    const ltcMacaroonHexString = ltcMacaroon.toString("hex");

    // --- ETH wallet ---
    const ethWallet = ethers.Wallet.fromMnemonic(mnemonic);
    console.log("Wallet unlocked, wait for servers to start up...");

    try {
        const ethAccount = await web3.eth.accounts.privateKeyToAccount(ethWallet.privateKey);

        //const btcAddress = await getBtcAddress(btcMacaroonHexString);
        //	console.log(btcAddress)
	   //        const ltcAddress = await getLtcAddress(ltcMacaroonHexString);

        console.log("READY!");
        return {
            btc: {
//                address: btcAddress,
                macaroon: btcMacaroonHexString,
            },
            ltc: {
  //              address: ltcAddress,
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

async function getBtcAddress(macaroon) {

    const wsState = new WebSocket("wss://" + config.lnd.btc.host + ":" + config.lnd.btc.port + "/v1/state/subscribe?method=GET", {
        rejectUnauthorized: false,
    });
    const headers = {
        "Grpc-Metadata-macaroon": macaroon,
    };
    return new Promise(async function (resolve, reject) {
        wsState.on('message', async (message) => {
            if (JSON.parse(message).result != undefined) {
                console.log("BTC wallet state \t| " + JSON.parse(message).result.state);
                if (JSON.parse(message).result != undefined && JSON.parse(message).result.state == "SERVER_ACTIVE") 
		     try {
                    let btcAddress = await axios
                        .post("https://" + config.lnd.btc.host + ":" + config.lnd.btc.port + "/v2/wallet/address/next", { type: 1 }, { httpsAgent, headers: headers, })
                        .then((res) => {
                            return res.data.addr;
                        })
                        .catch((error) => {
                            return error.response;
                        });

                    resolve(btcAddress);
		     }
		    catch(err) {
			    return err
                }
            }
        });
    });
}

async function getLtcAddress(macaroon) {

    //    const wsState = new WebSocket("wss://127.0.0.1:" + config.ports.LTC + "/v1/state/subscribe?method=GET", {
    //        rejectUnauthorized: false,
    //    });
    //
    //    const headers = {
    //        "Grpc-Metadata-macaroon": macaroon,
    //    };
    //
    //    return new Promise(async function (resolve, reject) {
    //        wsState.on('message', async (message) => {
    //            if (JSON.parse(message).result != undefined) {
    //                console.log("LTC Wallet state \t| " + JSON.parse(message).result.State);
    //                if (JSON.parse(message).result != undefined && JSON.parse(message).result.State == "RPC_ACTIVE") {
    //                    let ltcAddress = await axios
    //                        .get("https://127.0.0.1:" + config.ports.LTC + "/v1/newaddress", { type: "p2wkh" }, { httpsAgent, headers: headers, })
    //                        .then((res) => {
    //                            return res.data.addr;
    //                        })
    //                        .catch((error) => {
    //                            return error.response;
    //                        });
    //
    //                    resolve(ltcAddress);
    //                }
    //            }
    //        });
    //    });

    return "thisshittylnd"
}

module.exports.unlockWallet = unlockWallet;
