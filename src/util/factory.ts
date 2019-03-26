
/*
 * connection-factory.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 17:22:35 GMT+0800 (CST)
 */

import { IBaseConnection } from 'src/connections/base-connection';

// prices
import { IPricer } from 'src/pricers/base-pricer';
import { BitfinexPricer } from 'src/pricers/bitfinex-pricer';
import { BinancePricer } from 'src/pricers/binance-pricer';
import { HuobiproPricer } from 'src/pricers/huobipro-pricer';

// strategies
import { IStratege } from 'src/strategies/base-stratege';
import { DHStratege } from 'src/strategies/dh-stratege';

// excutor
import { IExcutor } from 'src/excutors/base-excutor';
import { THExcutor } from 'src/excutors/th-excutor';

import { DPHExchange, EStrategyType } from 'src/enums/main';
import { DPHName } from 'main-types';

const connectionMap: Map<DPHName, IBaseConnection> = new Map();
interface ConnectionClass {
    new(): IBaseConnection;
}
export function getConnection(ConnectionClass: ConnectionClass, name: string): IBaseConnection {
    let instance: IBaseConnection|undefined = connectionMap.get(name);
    if (undefined === instance) {
        instance = new ConnectionClass();
        connectionMap.set(name, instance);
    }
    return instance;
}

interface PricerClass {
    new(): IPricer;
}
const pricerMap: Map<DPHExchange, PricerClass> = new Map([]);
pricerMap.set(DPHExchange.BINANCE, BinancePricer);
pricerMap.set(DPHExchange.BITFINEX, BitfinexPricer);
pricerMap.set(DPHExchange.HUOBIPRO, HuobiproPricer);

export function getPricer(exchangeName: DPHExchange): PricerClass {
    const pricerClass: PricerClass|undefined = pricerMap.get(exchangeName);
    if (undefined === pricerClass) {
        throw new Error(`[FACTORITY] trying to get pricer class: [${exchangeName}], but got undefined!`);
    }
    return pricerClass;
}

interface StrategeClass {
    new(): IStratege;
}

const strategeMap: Map<EStrategyType, StrategeClass> = new Map();
strategeMap.set(EStrategyType.TH, DHStratege);
export function getStratege(stratege: EStrategyType): StrategeClass {
    const strategeClass: StrategeClass = strategeMap.get(stratege);
    if (undefined === strategeClass) {
        throw new Error(`[FACTORITY] trying to get stratege class: [${stratege}], but got undefined!`);
    }
    return strategeClass;
}

interface ExcutorClass {
    new(): IExcutor;
}

const excutorMap: Map<EStrategyType, ExcutorClass> = new Map();
excutorMap.set(EStrategyType.TH, THExcutor);
export function getExcutor(stratege: EStrategyType): ExcutorClass {
    const strategeClass: ExcutorClass = excutorMap.get(stratege);
    if (undefined === strategeClass) {
        throw new Error(`[FACTORITY] trying to get excutor class: [${stratege}], but got undefined!`);
    }
    return strategeClass;
}
