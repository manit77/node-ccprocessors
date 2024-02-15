import { ReadFile } from "src/utils/utilities";

export class AppConfig {

    constructor(private env: any) {

    }   

    public app_name() {
        return this.GetConfig("app_name");
    }

    public app_version() {
        return this.GetConfig("app_version");
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