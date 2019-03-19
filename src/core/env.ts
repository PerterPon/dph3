
/*
 * env.ts
 * Author: Pon<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 19:38:57 GMT+0800 (CST)
 */

import { initConfig, getConfig } from 'src/core/config';
import { initLogger } from 'src/core/log';

import { TDPHConfig } from 'main-types';

export async function initEnv(): Promise<void> {
    const etcEnv = process.env['ETC_ENV'];
    await initConfig(etcEnv);
    const config: TDPHConfig = getConfig();
    initLogger(config.log);
}
