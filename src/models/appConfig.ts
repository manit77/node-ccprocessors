import path from "path";
import * as fssynch from "fs";
import { FileExists } from "src/utils/utilities";

export class AppConfig {

    private packageJson: { name?: string; version?: string } | null = null;

    constructor(private env: any) {
        const pkgPath = path.join(process.cwd(), "package.json");
        if (FileExists(pkgPath)) {
            try {
                const raw = fssynch.readFileSync(pkgPath, "utf8");
                this.packageJson = JSON.parse(raw);
            } catch {
                this.packageJson = null;
            }
        }
    }

    public app_name() {
        if (this.packageJson && typeof this.packageJson.name === "string") {
            return this.packageJson.name;
        }
        return "";
    }

    public app_version() {
        if (this.packageJson && typeof this.packageJson.version === "string") {
            return this.packageJson.version;
        }
        return "";
    }

    public cc_token() {
        return this.GetConfig("cc_token");
    }
    public cc_environment(){
        return this.GetConfig("cc_environment");
    }

    public http_port() {
        return this.GetConfig("http_port");
    }

    public cert_key_path() {
        return this.GetConfig("cert_key_path");
    }

    public cert_cert_path() {
        return this.GetConfig("cert_cert_path");
    }

    public logfilepathandname() {
        return this.GetConfig("logfilepathandname");
    }

    public token_secret_key() {
        return this.GetConfig("token_secret_key");
    }

    GetConfig(key: string): string {
        return this.env[key];
    }

}