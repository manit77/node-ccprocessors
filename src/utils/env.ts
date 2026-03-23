import * as util from './utilities'

export async function getConfig(configFilePath?: string) {
    // List of config files to check, in order
    const configFiles = [
        "dev-env.json",
        "env.json",
        "config.json"
    ];
    // Directories to check in order
    const directories = ["", "src/"];

    let config = null;

    if (configFilePath) {
        console.log(`trying ${configFilePath}`);
        if (util.FileExists(configFilePath)) {
            config = JSON.parse(await util.ReadFile(configFilePath));
        }
    }

    // If not loaded, try all combinations
    if (!config) {
        for (const dir of directories) {
            for (const file of configFiles) {
                const tryPath = dir + file;
                console.log(`trying ${tryPath}`);
                if (util.FileExists(tryPath)) {
                    configFilePath = tryPath;
                    config = JSON.parse(await util.ReadFile(tryPath));
                    break;
                }
            }
            if (config) break;
        }
    }

    if (config) {
        console.log(`loading env from ${configFilePath}`);
    }

    //use the process env instead
    if (!config) {
        console.log("loading env from process");
        config = process.env;
    }
    return config;
}