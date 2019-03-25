
/*
 * main.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 19:24:54 GMT+0800 (CST)
 */

import * as _ from 'lodash';

import { Logger } from 'log4js';

import { initEnv } from 'src/core/env';
import { getConfig } from 'src/core/config';
import { getLogger, testLog } from 'src/core/log';

import { IPricer } from 'src/pricers/base-pricer';
import { IStratege } from 'src/strategies/base-stratege';

import { CCXTTrader } from 'src/traders/ccxt-trader';

import { getPricer, getStratege, getExcutor } from 'src/util/factory';
import { sleep } from 'src/util';

import { DPHExchange, DPHCoin, StandardCoin, EStrategyType } from 'src/enums/main';

import { TDPHConfig, DPHName } from 'main-types';
import { TOrderBook } from 'pricer-types';
import { TTHAction } from 'action-types';
import { IExcutor } from './excutors/base-excutor';

export async function stopDPH(): Promise<void> {
    priceMap.clear();
    strategeMap.clear();
    excutorMap.clear();
}

export async function startDPH(): Promise<void> {
    await initPricers();
    await initExcutors();
    await initTraders();
    await initStrategies();
    await startListening();
}

const priceMap: Map<DPHName, IPricer> = new Map();
const strategeMap: Map<DPHName, IStratege> = new Map();
const excutorMap: Map<DPHName, IExcutor> = new Map();

async function initPricers(): Promise<void> {
    const log: Logger = getLogger();
    log.info(`initing pricers ...`);
    const config: TDPHConfig = getConfig();
    const exchanges: DPHExchange[] = config.supportedExchange;
    const coins: DPHCoin[] = config.supportedCoin;
    const standardCoins: StandardCoin[] = config.supportedStandard;
    for (let i = 0; i < exchanges.length; i++) {
        const exchange: DPHExchange = exchanges[i];
        const Pricer = getPricer(exchange);
        const pricer: IPricer = new Pricer();
        await pricer.init();
        priceMap.set(exchange, pricer);

        for (let j = 0; j < coins.length; j ++) {
            const coin: DPHCoin = coins[j];
            for (let k = 0; k < standardCoins.length; k ++) {
                const standardCoin: StandardCoin = standardCoins[k];
                await pricer.registerCoin(coin, standardCoin);
            }
        }
    }
    log.info(`pricers init success!`);
}

async function initExcutors(): Promise<void> {
    const log: Logger = getLogger();
    log.info('initing excutors ...');
    const config: TDPHConfig = getConfig();
    const strategies = config.strategy;
    for (let strategeName in strategies) {
        const ExcutorClass = getExcutor(strategeName as EStrategyType);
        const excutor: IExcutor = new ExcutorClass();
        await excutor.init();
        excutorMap.set(strategeName, excutor);
    }
    log.info('excutors init success!');
}

async function initTraders(): Promise<void> {
    const log: Logger = getLogger();
    log.info('initing traders ...');
    const trader: CCXTTrader = await CCXTTrader.getInstrance();
    await trader.init();
    log.info('traders init success!');
}

async function initStrategies(): Promise<void> {
    const log: Logger = getLogger();
    log.info('initing strategies ...');
    const config: TDPHConfig = getConfig();
    const strategies = config.strategy;
    for (let strategeName in strategies) {
        const strategeClass = getStratege(strategeName as EStrategyType);
        const stratege: IStratege = new strategeClass();
        await stratege.init();
        strategeMap.set(strategeName, stratege);
    }

    log.info('strategies init success!');
}

async function startListening(): Promise<void> {
    startListeningStratege();
    startListeningPrice();
}

/** listening stratege */
async function startListeningStratege(): Promise<void> {
    const logger: Logger = getLogger();
    logger.info('start listening stratege...');
    const config: TDPHConfig = getConfig();
    const strategies = config.strategy;
    for (let strategeName in strategies) {
        const stratege: IStratege = strategeMap.get(strategeName);
        listenStratege(stratege);
    }
}

async function listenStratege(stratege: IStratege): Promise<void> {
    while (true) {
        const actions: TTHAction[] = await stratege.fetchAction();
        const actionMap: Map<EStrategyType, TTHAction[]> = new Map();
        const actionStrategies: EStrategyType[] = [];
        for (let i = 0; i < actions.length; i++) {
            const action: TTHAction = actions[i];
            const stratege: EStrategyType = action.stratege;
            let aimActions: TTHAction[]|undefined = actionMap.get(stratege);
            if (false === _.isArray(aimActions)) {
                aimActions = [];
                actionMap.set(stratege, aimActions);
                actionStrategies.push(stratege);
            }
            aimActions.push(action);
        }

        for (let i = 0; i < actionStrategies.length; i++) {
            const stratege: EStrategyType = actionStrategies[i];
            const excutor: IExcutor = excutorMap.get(stratege);
            const actions: TTHAction[] = actionMap.get(stratege);
            excutor.excute(actions);
        }

        // just sleep 10's, before anothor actions
        await sleep(10 * 1000);
    }
}

/** listening price */
async function startListeningPrice(): Promise<void> {
    const logger: Logger = getLogger();
    logger.info('start listening price...');
    const config: TDPHConfig = getConfig();
    const standardCoins: StandardCoin[] = config.supportedStandard;
    const coins: DPHCoin[] = config.supportedCoin;
    for (let i = 0; i < standardCoins.length; i++) {
        const standardCoin: StandardCoin = standardCoins[i];
        for (let j = 0; j < coins.length; j++) {
            const coin: DPHCoin = coins[j];
            listenExchange(coin, standardCoin);
        }
    }
}

async function listenExchange( coin: DPHCoin, standardCoin: StandardCoin ): Promise<void> {
    const config: TDPHConfig = getConfig();
    const supportedExchange: DPHExchange[] = config.supportedExchange;
    for ( let i = 0; i < supportedExchange.length; i++ ) {
        const exchange: DPHExchange = supportedExchange[i];
        listenPrice(coin, standardCoin, exchange);
    }
}

async function listenPrice( coin: DPHCoin, standardCoin: StandardCoin, exchange: DPHExchange ): Promise<void> {
    const pricer: IPricer|undefined = priceMap.get(exchange);
    if (undefined === pricer) {
        throw new Error(`listen price but could not find exchange: coin: [${coin}], standard coin: [${standardCoin}], exchange: [${exchange}]`);
    }

    while (true) {
        const ob: TOrderBook = await pricer.getOrderBook(coin, standardCoin);
        testLog(`[main] listenPrice, coin: [${coin}], standardCoin: [${standardCoin}], exchange: [${exchange}], ob: [${JSON.stringify(ob)}]`);
        const config: TDPHConfig = getConfig();
        const strategies = config.strategy;
        for (let strategeName in strategies) {
            const stratege: IStratege = strategeMap.get(strategeName);
            await stratege.priceUpdate(exchange, coin, standardCoin, ob);
        }
    }
}
