
/*
* stratege.d.ts
* Author: 王 羽涵<perterpon@gmail.com>
* Create: Sat Dec 22 2018 16:07:29 GMT+0800 (CST)
*/

declare module "stratege-types" {
    
    import { DPHCoin, StandardCoin, DPHExchange } from "src/enums/main";
    import { TFees } from "exchange-types";
    import { TOrderBook } from "pricer-types";

    export type TTHStrategeConfig = {
        buffer: number;
    }

    export type TTHCalItem = {
        coin: DPHCoin;
        standardCoin: StandardCoin;
        exchange: DPHExchange;
        fees: TFees;
        /** [price, amount] */
        ask: [number, number];
        bid: [number, number];
    };

}