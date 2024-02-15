import { IWebService, IWebServiceDeps } from "./models/models";
import { CreditCardService } from "./services/creditCardServiceService";

export class AppServer {

    constructor(private deps: IWebServiceDeps){
        
    }

    GetServices(): Array<IWebService> {
        let ccService = new CreditCardService(this.deps);
        return [ccService];

    }
}