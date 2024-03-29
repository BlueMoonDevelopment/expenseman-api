import { server_settings } from '../../json/config.json';

/**
* If debug_log is enabled in config.json file, print out debug message to console
* @param {string} msg The message to log
*/
export function debug(msg: any): void {
    if (server_settings.debug_log) {
        console.log(`[DEBUG] ${msg}`);
    }
}

/**
 * Print out info message to console
 * @param {string} msg The message to log
 */
export function info(msg: any): void {
    console.log(`[INFO] ${msg}`);
}

/**
 * Print out error message to console
 * @param {string} msg The error message to log
 */
export function error(msg: any): void {
    console.log(`[ERROR] ${msg}`);
}

export function errorWithError(msg: any, err: Error): void {
    console.log(`[ERROR] ${msg}`);
    console.error(err);
}

