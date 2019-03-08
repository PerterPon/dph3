
/*
 * ccxt-trader.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Mar 02 2019 22:03:19 GMT+0800 (CST)
 */

import * as ccxt from 'ccxt';

const config = {
    bitfinex: {
        apiKey: '6fiVZXQ4wj847hhvOexFF97gTg2Sipae4hqDTAGXyVv',
        apiSecret: '96586oIKxrarhpcPML4j2Zd5bxkGQxT9OH7KhBofrt7'
    },
    binance: {
        apiKey: 'nNLgCm51PaKyjiDpDsNgwZOm9MdEFXekRh7jXeubHf8BVOajQg7EyfnvjLbmZhdR',
        apiSecret: '1BfRkdLjDpbYuu0qI1pypdFlotTRltVugFRXpJb7ZKGwydRU2R0IUwPNkEBVtnC0'
    }
};

const bitfinexExchange = new ccxt.bitfinex({
    apiKey: config.bitfinex.apiKey,
    secret: config.bitfinex.apiSecret
});

const binanceExchange = new ccxt.binance({
    apiKey: config.binance.apiKey,
    secret: config.binance.apiSecret
});

async function start() {
    try {
        // console.log(await bitfinexExchange.loadMarkets());
        const result = await bitfinexExchange.createOrder('BTC/USD', 'market', 'buy', 0.005);
        // const result = await bitfinexExchange.cancelOrder('22894433620');
        // const result = await bitfinexExchange.fetchOrder('22894606555');
        
        console.log(result);
        // const result1 = await bitfinexExchange.fetchOrder('22894433620');
        // console.log(result1);
    } catch(e) {
        console.log(e);
    }
}

start();

// async function start() {

//     try {
//         // console.log(await binanceExchange.loadMarkets());
//         // const result = await binanceExchange.createOrder('BTC/USDT', 'limit', 'sell', 0.004, 3700);
//         // await binanceExchange.cancelOrder('275061354', 'BTC/USDT');
//         // const result = await binanceExchange.fetchOrder('275061354', 'BTC/USDT');
//         // console.log(result);
//         // console.log(result);
//     } catch(e) {
//         console.log(e);
//     }

// }

// start();

