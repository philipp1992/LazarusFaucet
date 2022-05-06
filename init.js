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
           
            eth: {
                address: ethAccount.address,
                private: ethAccount.privateKey,
            },
        };
    } catch (error) {
        return { error: "Error unlocking ETH wallet!" + error };
    }
}



module.exports.unlockWallet = unlockWallet;
