
/*
* trade.d.ts
* Author: Pon<perterpon@gmail.com>
* Create: Sat Dec 22 2018 17:13:00 GMT+0800 (CST)
*/


declare module "trade-types" {
    import { ETradeType, EOrderType, ECCXTOrderStatus } from "src/enums/main";

    export type TTradeType = string;

    export type TCCXTOrderStatus = {
        id: string;
        symbol: string;
        type: EOrderType;
        side: ETradeType;
        status: ECCXTOrderStatus;
    };
}