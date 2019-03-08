
/*
 * main.d.ts
 * Author: 梁月<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 14:51:21 GMT+0800 (CST)
 */

declare module "main-types" {
    import { Configuration as TLogConfiguration } from 'log4js';

    import { DPHCoin, DPHExchange, StandardCoin } from 'src/enums/main';
    
    import { TFees } from 'exchange-types';
    import { TPricerSymbols } from 'pricer-types';

    export type DPHName = string;

    export type TDPHConfig = {
        log: TLogConfiguration,
        ipc: {
            [name: string]: TProcessConfig;
        },
        exchanges: {
            [name: string]: TExchangeConfig;
        },
        supportedCoin: Array<DPHCoin>;
        supportedStandard: Array<StandardCoin>;
        supportedExchange: Array<DPHExchange>;
        database: TDataBaseConfig;
        strategy: {
            [strategName: string]: {
                [configName: string]: any;
            }
        };
    };

    export type TProcessConfig = {
        file: string;
        sock?: string;
    };

    export type TExchangeConfig = {
        [name: string]: any;
        fees: TFees;
        apiKey: string;
        apiSecret: string;
        USDSymbols: TPricerSymbols;
        BTCSymbols: TPricerSymbols;
    };

    export type TDataBaseConfig = {
        host: string;
        user: string;
        password: string;
        database?: string;
        port?: number;
        showLog: boolean;
    };

}