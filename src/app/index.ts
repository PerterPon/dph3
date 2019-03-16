
/*
 * index.ts
 * Author: PerterPon<perterpon@gmail.com>
 * Create: Sat Mar 16 2019 17:01:14 GMT+0800 (CST)
 */

import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import chalk from 'chalk';
import { Logger } from 'log4js';

import { getConfig } from 'src/core/config';
import { getLogger } from 'src/core/log';

import { getDebugger } from 'src/core/debug';

import { TDPHConfig } from 'main-types';

const router: KoaRouter = new KoaRouter();
async function createApp(): Promise<void> {
    const app: Koa = new Koa();

    app.use(router.routes());
    app.use(router.allowedMethods());

    const config: TDPHConfig = getConfig();
    const logger: Logger = getLogger();

    app.listen(config.app.port, () => {
        logger.info(chalk.yellow(`[APP] app is listening port: [${config.app.port}]`));
    });
}

router.get('/debug', (ctx: Koa.Context) => {
    const debug = getDebugger();
    ctx.body = JSON.stringify(debug);
});

export function startApp(): void {
    createApp();
}

