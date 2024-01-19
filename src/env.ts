import * as util from './utilities'

export async function GetENV() {
    let envFilePath = "dev-env.json";
    let env = null;

    console.log(`trying ${envFilePath}`);
    if (util.FileExists(envFilePath)) {
        env = JSON.parse(await util.ReadFile(envFilePath));
    }

    envFilePath = "src/dev-env.json";
    console.log(`trying ${envFilePath}`);

    if (util.FileExists(envFilePath)) {
        env = JSON.parse(await util.ReadFile(envFilePath));
    }

    if (env) {
        console.log(`loading env from ${envFilePath}`);
    }

    if (env == null) {
        console.log("loading env from process");
        env = process.env;
    }
    return env;
}