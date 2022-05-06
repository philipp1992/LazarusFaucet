const axios = require("axios");
const https = require("https");
const config = require("./config.js");

const httpsAgent = new https.Agent({
    rejectUnauthorized: false, // (NOTE: this will disable client verification)
});

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

async function sendCoins(web3, wallet, coin, address, amount) {
	console.log(wallet)
    let res = "Coin not supported";
    switch (coin) {
        case "ETH":
            res = await sendETH(web3, wallet, address, amount);
            break;
        default:
            res = await sendERC20(web3, wallet, address, amount, config.coins[coin].contract, config.coins[coin].decimals);
            break;
    }

    return res;
}

async function sendETH(web3, wallet, address, amount) {

    let options = {
        to: address,
        value: amount * Math.pow(10, 18),
        gas: "40000"
    };

    let signedTx = await web3.eth.accounts.signTransaction(options, wallet.eth.private);

    try {
        let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .once('transactionHash', (hash) => {
                return hash;
            })

        return txHash.transactionHash;

    } catch (error) {
        console.log(error);
        options.gas = Math.floor(options.gas * 1.2) // 20% more gas
        signedTx = await web3.eth.accounts.signTransaction(options, wallet.eth.private);

        let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .once('transactionHash', (hash) => {
                return hash;
            })

        return txHash.transactionHash;
    }
}

async function sendERC20(web3, wallet, address, amount, contractAddress, decimals) {

    const ABI = [
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_to",
                    "type": "address"
                },
                {
                    "name": "_value",
                    "type": "uint256"
                }
            ],
            "name": "transfer",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
    ];

    const contract = new web3.eth.Contract(ABI, contractAddress);

    const tx = await contract.methods.transfer(address, amount * Math.pow(10, decimals));

    let options = {
        from: wallet.eth.address,
        to: contractAddress,
        data: tx.encodeABI(),
        gas: await tx.estimateGas({ from: wallet.eth.address }), // unused gas is refunded
    };

    let signedTx = await web3.eth.accounts.signTransaction(options, wallet.eth.private);

    try {
        let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
            .once('transactionHash', (hash) => {
                return hash;
            })

        return txHash.transactionHash;

    } catch (error) {
        console.log(error);
        options.gas = Math.floor(options.gas * 1.2) // 20% more gas
        signedTx = await web3.eth.accounts.signTransaction(options, wallet.eth.private);

        try {
            let txHash = await web3.eth.sendSignedTransaction(signedTx.rawTransaction)
                .once('transactionHash', (hash) => {
                    return hash;
                })

            return txHash.transactionHash;

        } catch (error) {
            console.log(error);
            return "unlucky"
        }
    }
}

module.exports.sendCoins = sendCoins;
