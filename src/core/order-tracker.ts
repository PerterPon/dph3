
/*
 * order-tracker.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Fri Mar 08 2019 20:42:14 GMT+0800 (CST)
 */

import * as ccxt from 'ccxt';
import chalk from 'chalk';

import { DPHExchange, ECCXTOrderStatus } from 'src/enums/main';

import { sleep } from 'src/util';
import { TCCXTOrderStatus } from 'trade-types'
import { Logger } from 'log4js';
import { getLogger } from './log';

export async function trackOrder(exchangeName: DPHExchange, exchange: ccxt.Exchange, orderId: string, symbol: string): Promise<void> {
    while(true) {
        const status: ECCXTOrderStatus = await doCheck(exchangeName, exchange, orderId, symbol);
        if (ECCXTOrderStatus.CLOSED === status) {
            const logger: Logger = getLogger();
            logger.log(chalk.bgGreen(`order success! ${exchangeName} ${symbol}`));
            break;
        } else {
            await sleep( 10 * 1000 );
        }
    }

}

async function doCheck(exchangeName: DPHExchange, exchange: ccxt.Exchange, orderId: string, symbol: string): Promise<ECCXTOrderStatus> {
    let result: TCCXTOrderStatus;
    if (DPHExchange.BINANCE === exchangeName) {
        result = await exchange.fetchOrder(orderId, symbol);
    } else if (DPHExchange.BITFINEX === exchangeName) {
        result = await exchange.fetchOrder(orderId);
    }
    return result.status;
}
