
/*
 * pricer.d.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 15:32:42 GMT+0800 (CST)
 */

declare module "pricer-types" {

    export type TPricerSymbols = {
        [supportedCoin: string]: string;
    };

    export type TOrderBook = {
        asks: [number, number][];
        bids: [number, number][];
    };

    export type TBinanceDepthUpdate = {
        e: string;
        E: number;
        s: string;
        U: number;
        u: number;
        b: [number, number][];
        a: [number, number][];
    }

}
