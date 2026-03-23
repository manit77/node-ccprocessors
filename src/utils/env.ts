import * as util from './utilities'

export async function GetENV(configFilePath?: string) {
    // List of config files to check, in order
    const configFiles = [
        "dev-env.json",
        "env.json",
        "config.json"
    ];
    // Directories to check in order
    const directories = ["", "src/"];

    let envFilePath = configFilePath || null;
    let env = null;

    if (envFilePath) {
        console.log(`trying ${envFilePath}`);
        if (util.FileExists(envFilePath)) {
            env = JSON.parse(await util.ReadFile(envFilePath));
        }
    }

    // If not loaded, try all combinations
    if (!env) {
        for (const dir of directories) {
            for (const file of configFiles) {
                const tryPath = dir + file;
                console.log(`trying ${tryPath}`);
                if (util.FileExists(tryPath)) {
                    envFilePath = tryPath;
                    env = JSON.parse(await util.ReadFile(tryPath));
                    break;
                }
            }
            if (env) break;
        }
    }

    if (env) {
        console.log(`loading env from ${envFilePath}`);
    }

    if (!env) {
        console.log("loading env from process");
        env = process.env;
    }
    return env;
}