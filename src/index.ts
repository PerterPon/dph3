
/*
 * index.ts
 * Author: 梁月<perterpon@gmail.com>
 * Create: Sat Dec 22 2018 14:49:09 GMT+0800 (CST)
 */

import * as commander from 'commander';
import chalk from 'chalk';
import { start } from 'src/main';

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

commander
    .option('-v, --env [value]', 'running env')
    .parse(process.argv);

start();

process.on('uncaughtException', (error) => {
    console.log(chalk.red('---------uncaughtException--------'));
    console.log(error);
});

process.on('unhandledRejection', (error) => {
    console.log(chalk.red('=========unhandledRejection========='));
    console.log('unhandled rejection', error);
});
