
/*
 * index.ts
 * Author: 梁月<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 14:49:09 GMT+0800 (CST)
 */

import * as commander from 'commander';
import chalk from 'chalk';
import { startDPH } from 'src/main';
import { startApp } from 'src/app';
import { initEnv } from 'src/core/env';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

commander
    .option('-v, --env [value]', 'running env')
    .parse(process.argv);

start();

async function start(): Promise<void> {
    await initEnv();
    startDPH();
    startApp();
}

async function stop(): Promise<void> {
    
}

process.on('uncaughtException', (error) => {
    console.log(chalk.red('---------uncaughtException--------'));
    console.log(error);
});

process.on('unhandledRejection', (error) => {
    console.log(chalk.red('=========unhandledRejection========='));
    console.log('unhandled rejection', error);
});
