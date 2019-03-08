
/*
 * exchange.d.ts
 * Author: 梁月<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 14:54:02 GMT+0800 (CST)
 */

declare module "exchange-types" {

    export type TAmount = number;

    export type TPrice = number;

    export type TFees = {
        taker: number;
        maker: number;
    };

}
