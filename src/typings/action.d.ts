
/*
 * action.d.ts
 * Author: 王 羽涵<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 16:10:02 GMT+0800 (CST)
 */

declare module "action-types" {

    import { ETradeType, EOrderType, DPHCoin, StandardCoin, DPHExchange, EStrategyType } from 'src/enums/main';

    import { TAmount, TPrice } from 'exchange-types';

    export type TTHAction = {
        stratege: EStrategyType;
        action: ETradeType;
        price: TPrice;
        amount: TAmount;
        orderType: EOrderType;
        coin: DPHCoin;
        standardCoin: StandardCoin;
        exchange: DPHExchange;
    };

}