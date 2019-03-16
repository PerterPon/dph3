
/*
 * dh-stratege.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Mon Feb 18 2019 20:55:23 GMT+0800 (CST)
 */

import * as _ from 'lodash';

import { BaseStratege } from 'src/strategies/base-stratege';
import { getConfig } from 'src/core/config';

import { DPHExchange, StandardCoin, DPHCoin, ETradeType, EOrderType, EStrategyType } from 'src/enums/main';
import { getLogger } from 'src/core/log';
import { getDebugger } from 'src/core/debug';

import { TDPHConfig } from 'main-types';
import { TTHStrategeConfig, TTHCalItem } from 'stratege-types';
import { TOrderBook } from 'pricer-types';
import { TTHAction } from 'action-types';
import { TFees } from 'exchange-types';
import { Logger } from 'log4js';
import chalk from 'chalk';

export class DHStratege extends BaseStratege {

    private latestExchangeValueMap: Map<string, TTHAction> = new Map();
    private coinValueMap: Map<string, string> = new Map();

    public async priceUpdate(exchange: DPHExchange, coin: DPHCoin, standardCoin: StandardCoin, orderBook: TOrderBook): Promise<void> {
        const firstAsk: [number,number] = orderBook.asks[0];
        const firstBid: [number, number] = orderBook.bids[0];
        const checkKey: string = `${exchange}_${standardCoin}_${coin}`;
        // sense of price
        // one price one action
        const firstAskPrice: number = _.get(firstAsk, '[0]');
        const firstBidPrice: number = _.get(firstBid, '[0]');
        const valueKey: string = `${firstAskPrice}_${firstBidPrice}`;
        const oldValue: string|undefined = this.coinValueMap.get(checkKey);
        if (oldValue === valueKey) {
            return;
        }
        this.coinValueMap.set(checkKey, valueKey);

        // some times, binance order book will left nothing, so here need do something.
        if (true === _.isEmpty(firstAsk) || true === _.isEmpty(firstBid)) {
            return;
        }

        super.priceUpdate(exchange, coin, standardCoin, orderBook);
    }

    protected async pushPrice(): Promise<void> {
        const dpCoinMap: Map<string, Map<DPHExchange, TOrderBook>> = this.deconstruction();
        const thActions: TTHAction[] = this.calculate(dpCoinMap);
        if (0 < thActions.length) {
            this.popPrice(thActions);
        }
    }

    private deconstruction(): Map<string, Map<DPHExchange, TOrderBook>> {
        const arrayMap = Array.from(this.exchangeMap);

        const dpCoinMap: Map<string, Map<DPHExchange, TOrderBook>> = new Map();

        for (let i = 0; i < arrayMap.length; i ++) {
            const exchange: DPHExchange = arrayMap[i][0];
            const standardCoinMap: Map<StandardCoin, Map<DPHCoin, TOrderBook>> = arrayMap[i][1];
            const standardCoinArrayMap = Array.from(standardCoinMap);
            for (let j = 0; j < standardCoinArrayMap.length; j++) {
                const standardCoin: StandardCoin = standardCoinArrayMap[j][0];
                const coinMap: Map<DPHCoin, TOrderBook> = standardCoinArrayMap[j][1];
                const coinMapArray = Array.from(coinMap);
                for (let l = 0; l < coinMapArray.length; l ++) {
                    const coin: DPHCoin = coinMapArray[l][0];
                    const orderBook: TOrderBook = coinMapArray[l][1];
                    const dpCoin: string = `${standardCoin}_${coin}`;
                    let exchangeOB: Map<DPHExchange, TOrderBook>| undefined = dpCoinMap.get(dpCoin);
                    if (undefined === exchangeOB) {
                        exchangeOB = new Map();
                        dpCoinMap.set(dpCoin, exchangeOB);
                    }
                    exchangeOB.set(exchange, orderBook);
                }
            }
        }

        return dpCoinMap;
    }

    private calculate(dpCoinMap: Map<string, Map<DPHExchange, TOrderBook>>): TTHAction[] {
        const arrayMap = Array.from(dpCoinMap);
        const config: TDPHConfig = getConfig();
        const bookIndex: number = config.strategy.TH.bookIndex || 0;
        const thActions: TTHAction[] = [];
        for (let i = 0; i < arrayMap.length; i++) {
            const item = arrayMap[i];
            const [dpCoin, exchangeOB] = item;
            const [standardCoin, dphCoin] = dpCoin.split('_');
            const exchangeMap = Array.from(exchangeOB);
            const calItems: TTHCalItem[] = [];
            for (let j = 0; j < exchangeMap.length; j++) {
                const exchangeItem = exchangeMap[j];
                const [exchange, orderBook] = exchangeItem;
                const fees: TFees = config.exchanges[exchange].fees;
                const calItem: TTHCalItem = {
                    fees: fees,
                    ask: orderBook.asks[bookIndex],
                    bid: orderBook.bids[bookIndex],
                    exchange: exchange,
                    coin: dphCoin as DPHCoin,
                    standardCoin: standardCoin as StandardCoin
                };
                calItems.push(calItem);
            }
            const actions: TTHAction[] = this.doCalItem(calItems);
            thActions.push(...actions);
        }

        return thActions;
    }

    private doCalItem(calItems: TTHCalItem[]): TTHAction[] {
        if (1 >= calItems.length) {
            return [];
        }

        const config: TDPHConfig = getConfig();
        const strategeConfig: TTHStrategeConfig = config.strategy.TH as TTHStrategeConfig;
        const thBuffer: number = strategeConfig.buffer;

        const actions: TTHAction[] = [];
        const asks: number[] = [];
        const bids: number[] = [];
        const logger: Logger = getLogger();

        for (let i = 0; i < calItems.length; i++) {
            const item: TTHCalItem = calItems[i];
            const {ask, bid} = item;
            asks.push(ask[0]);
            bids.push(bid[0]);
        }

        // 1. get the best ask and bid
        // choose the min ask price
        const bestAsk: number = Math.min(...asks);
        // choose the max bid price
        const bestBid: number = Math.max(...bids);
        // if best ask > best bid, meaningless
        if (bestAsk >= bestBid) {
            logger.info(`[DH-STRATEGE] calculate item, but ask > ask, \nask: [${bestAsk}] bid: [${bestBid}]`);
            return [];
        }

        const bAskIndex: number = asks.indexOf(bestAsk);
        const bBidIndex: number = bids.indexOf(bestBid);
        
        const askItem: TTHCalItem = calItems[bAskIndex];
        const bidItem: TTHCalItem = calItems[bBidIndex];
        if (bAskIndex === bBidIndex) {
            logger.error(`[DH-STRATEGE] best ask and best bid was the same! item: [${JSON.stringify(askItem)}]`);
            return [];
        }
        // 2. get the target amount
        const askAmount: number = Math.abs(askItem.ask[1]);
        const bidAmount: number = Math.abs(bidItem.bid[1]);

        // choose the min amount
        let targetAmount: number = Math.min(askAmount, bidAmount);
        if (targetAmount < 0.006) {
            logger.warn(`too low amount: [${targetAmount}], give up`);
            return [];
        }
        targetAmount = 0.005 + Math.random() * 0.001;

        // 3. calculate the total fee
        const askFee: number = askItem.fees.taker;
        const bidFee: number = bidItem.fees.maker;

        const totalFee: number = bestAsk * targetAmount * askFee + bestBid * targetAmount * bidFee;
        const aimsProfit: number = totalFee * (1 + thBuffer);

        if ((bestBid - bestAsk) * targetAmount >= aimsProfit) {
            const totalProfit: number = (bestBid - bestAsk) * targetAmount - totalFee;
            const buyAction: TTHAction = {
                action: ETradeType.BUY,
                price: bestAsk,
                amount: targetAmount,
                orderType: EOrderType.LIMIT,
                coin: askItem.coin,
                standardCoin: askItem.standardCoin,
                exchange: askItem.exchange,
                stratege: EStrategyType.TH
            };
            const sellAction: TTHAction = {
                action: ETradeType.SELL,
                price: bestBid,
                amount: targetAmount,
                orderType: EOrderType.LIMIT,
                coin: bidItem.coin,
                standardCoin: bidItem.standardCoin,
                exchange: bidItem.exchange,
                stratege: EStrategyType.TH
            };
            const buyActionDuplicate: boolean = this.checkDuplicate(buyAction);
            const sellActionDuplicate: boolean = this.checkDuplicate(sellAction);

            // buy action and sell action not duplicate
            // and this is a valid action
            if (true === buyActionDuplicate || true === sellActionDuplicate) {
                return actions;
            }

            actions.push(buyAction, sellAction);
            const debug = getDebugger();
            const totalFeeDebug = debug.totalFee || 0;
            const totalProfitDebug = debug.totalProfit || 0;
            const totalAmountDebug = debug.totalAmount || 0;
            debug.totalFee = totalFeeDebug + totalFee;
            debug.totalProfit = totalProfitDebug + totalProfit;
            debug.totalAmount = totalAmountDebug + targetAmount;
            logger.info(
                chalk.blue(`[DH-STRATEGE] new action [${askItem.coin}]: 
                fee: [${totalFee}], profit: [${totalProfit}], amount: [${targetAmount}]
                Sell: ${bidItem.exchange} | ${bestBid} | ${targetAmount}
                Buy: ${askItem.exchange} | ${bestAsk} | ${targetAmount}
                `)
            );
        } else {
            const actuallyProfit: number = (bestBid - bestAsk) * targetAmount - totalFee;
            logger.info(`[DH-STRATEGE] not enough profit, give up!\nask: [${askItem.exchange}:${bestAsk}], bid: [${bidItem.exchange}:${bestBid}], amount: [${targetAmount}] total fee: [${totalFee}], aim profit: [${aimsProfit}], actually profit: [${actuallyProfit}]`);
        }

        return actions;
    }

    private checkDuplicate(action: TTHAction): boolean {
        const checkKey: string = `${action.exchange}_${action.standardCoin}_${action.coin}_${action.price}_${action.amount}_${action.orderType}`;
        const latestValue: TTHAction | undefined = this.latestExchangeValueMap.get(checkKey);
        if (undefined === latestValue) {
            this.latestExchangeValueMap.set(checkKey, action);
            return false;
        }
        const result: boolean = _.isEqual(action, latestValue);
        if (false === result) {
            this.latestExchangeValueMap.set(checkKey, action);
        }
        return result;
    }

}



