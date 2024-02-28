import { CreditCardProcessor } from "../models/creditCardProcessor";
import { ChargeResult, IAuthorization, ICreditCardItem, IWebService, IWebServiceDeps, Route } from "../models/models";

export class CreditCardService implements IWebService {

    ccProcessor: CreditCardProcessor;

    constructor(private deps: IWebServiceDeps){
        this.ccProcessor = new CreditCardProcessor(this.deps.AppConfig);
    }

    GetRoutes(): Route[] {
        let routes = new Array<Route>();

        routes.push({
            FnCall: this.AuthorizeCard,
            Path: "/v1/AuthorizeCard",
            Authenticated: false
        });

        routes.push({
            FnCall: this.ChargeAuthorization,
            Path: "/v1/ChargeAuthorization",
            Authenticated: false
        });

        routes.push({
            FnCall: this.ChargeCard,
            Path: "/v1/ChargeCard",
            Authenticated: false
        });

        return routes;
    }

    async AuthorizeCard(card: ICreditCardItem): Promise<ChargeResult> {
        try {
            return await this.ccProcessor.AuthorizeCard(card);
        } catch (err) {
            throw err;
        }
    }

    async ChargeAuthorization(card: IAuthorization): Promise<ChargeResult> {
        try {
            return await this.ccProcessor.ChargeAuthorization(card);
        } catch (err) {
            throw err;
        }
    }

    async ChargeCard(card: ICreditCardItem): Promise<ChargeResult> {
        try {
            return await this.ccProcessor.ChargeCard(card);
        } catch (err) {
            throw err;
        }
    }

}