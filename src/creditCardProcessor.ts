import { CloverClient } from "./cloverClient";
import { CCBrands, ChargeResult, ICreditCardItem, CCProcessors } from "./models";
import * as utils from "./utilities"
import NodeCache from "node-cache";

export class CreditCardProcessor {

    cache = new NodeCache({ stdTTL: 3600, checkperiod: 3620 });
    clover : CloverClient = null;

    constructor(private config) {
       
    }
 
    GetCCClient(ptype : CCProcessors) {
        if(ptype == CCProcessors.clover){
            if(this.clover == null){
                this.clover = new CloverClient(this.config.cc_token, this.config.cc_environment);
            }
            return this.clover;
        }
        return null;
    }

    GetCardType(number: string) : CCBrands {
        const re = {
            VISA: /^4[0-9]{12}(?:[0-9]{3})?$/,
            MC: /^(5[1-5][0-9]{14}|2(22[1-9][0-9]{12}|2[3-9][0-9]{13}|[3-6][0-9]{14}|7[0-1][0-9]{13}|720[0-9]{12}))$/,
            AMEX: /^3[47][0-9]{13}$/,
            DISCOVER: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
            // DINERS: /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,          
            // JCB: /^(?:2131|1800|35\d{3})\d{11}$/
            // electron: /^(4026|417500|4405|4508|4844|4913|4917)\d+$/,
            // maestro: /^(5018|5020|5038|5612|5893|6304|6759|6761|6762|6763|0604|6390)\d+$/,
            // dankort: /^(5019)\d+$/,
            // interpayment: /^(636)\d+$/,
            // unionpay: /^(62|88)\d+$/,

        }

        for (var key in re) {
            if (re[key].test(number)) {
                return key as CCBrands
            }
        }

        return null;
    }

    CopyCardToCard(src: ICreditCardItem, dest: ICreditCardItem) {
        dest.address_city = src.address_city;
        dest.address_country = src.address_country;
        dest.address_line1 = src.address_line1;
        dest.address_line2 = src.address_line2;
        dest.address_state = src.address_state;
        dest.address_zip = src.address_zip;

        dest.brand = this.GetCardType(src.number);

        dest.country = src.country;
        dest.cvv = src.cvv;
        dest.exp_month = src.exp_month;
        dest.exp_year = src.exp_year;

        dest.first6 = src.first6;
        dest.last4 = src.last4;
        dest.name = src.name;
        dest.number = src.number;
    }

    async AuthorizeCard(card: ICreditCardItem): Promise<ChargeResult> {

        let ccresult = new ChargeResult();

        switch (card.processortype) {

            case CCProcessors.clover:
                {
                    try {
                        
                        let cloverClient = this.GetCCClient(card.processortype);
                        let apiKey: string = this.cache.get("apiKey");
                        if (apiKey == undefined || apiKey == "") {
                            apiKey = await cloverClient.GetAPIKey();
                            this.cache.set("apiKey", apiKey);
                        }

                        //let cloverCard = new CreditCardItem();
                        //transfer values over
                        //this.CopyCardToCard(card, cloverCard);

                        let token = await cloverClient.CreateCardToken(card, apiKey);

                        card.cardid = token;

                        let charge = await cloverClient.CreateCharge(token);

                        //transfer values over
                        charge.amount = card.amountCharge * 100; //0.10 = 100, 10.00 * 100 = 1000, 10.01 * 100 = 1001                        
                        charge.external_customer_reference = card.external_customer_reference;
                        charge.external_reference_id = card.external_reference_id;

                        let returnData: any = await cloverClient.AuthorizeCard(charge, card.clientIP);
                        if (returnData.status === "succeeded") {
                            ccresult.authid = returnData.id;
                            ccresult.success = true;
                            ccresult.message = "card authorized.";
                        }
                        ccresult.result = JSON.stringify(returnData);

                    } catch (err: any) {
                        ccresult.success = false;
                        ccresult.result = JSON.stringify(err);

                        if (err.data && err.data.error && err.data.error.message) {
                            ccresult.message = err.data.error.message;
                        } else if (err.message) {
                            ccresult.message = err.message;
                        } else {
                            ccresult.message = "error authorizing credit card.";
                        }
                    }
                    break;
                }
            default: {
                ccresult.success = false;
                ccresult.result = "processor type not supported."
            }
        }

        return ccresult;
    }

    async ChargeAuthorization(card: ICreditCardItem): Promise<ChargeResult> {

        let ccresult = new ChargeResult();

        switch (card.processortype) {

            case CCProcessors.clover:
                {
                    try {                      
                        
                        let cloverClient = this.GetCCClient(card.processortype) as CloverClient;
                        
                        let authid = card.authid;

                        let amount = card.amountCharge * 100; //0.10 = 100, 10.00 * 100 = 1000, 10.01 * 100 = 1001

                        let returnData: any = await cloverClient.ChargeChargeId(amount, card.clientIP, authid);
                        if (returnData.paid === true && returnData.status === "succeeded") {
                            ccresult.chargeid = returnData.id;
                            ccresult.success = true;
                            ccresult.message = "card charged.";
                        }

                        ccresult.result = JSON.stringify(returnData);

                    } catch (err: any) {
                        ccresult.success = false;
                        ccresult.result = JSON.stringify(err);

                        if (err.data && err.data.error && err.data.error.message) {
                            ccresult.message = err.data.error.message;
                        } else if (err.message) {
                            ccresult.message = err.message;
                        } else {
                            if (utils.IsString(err)) {
                                ccresult.message = err;
                            } else {
                                ccresult.message = "error charging credit card.";
                            }
                        }
                    }
                    break;
                }
            default: {
                ccresult.success = false;
                ccresult.result = "processor type not supported."
            }
        }

        return ccresult;
    }

    async ChargeCard(card: ICreditCardItem): Promise<ChargeResult> {

        let ccresult = new ChargeResult();

        switch (card.processortype) {

            case CCProcessors.clover:
                {
                    try {
                        let cloverClient = this.GetCCClient(card.processortype) as CloverClient;
                        let apiKey: string = this.cache.get("apiKey");
                        if (apiKey == undefined || apiKey == "") {
                            apiKey = await cloverClient.GetAPIKey();
                            this.cache.set("apiKey", apiKey);
                        }

                        // let cloverCard = new CreditCardItem();
                        // this.CopyCardToCard(card, cloverCard);

                        let token = await cloverClient.CreateCardToken(card, apiKey);
                        ccresult.cardid = token;

                        let charge = await cloverClient.CreateCharge(token);
                      
                        charge.amount = card.amountCharge * 100; //0.10 = 100, 10.00 * 100 = 1000, 10.01 * 100 = 1001                        
                        charge.external_customer_reference = card.external_customer_reference;
                        charge.external_reference_id = card.external_reference_id;

                        let returnData: any = await cloverClient.ChargeCardToken(charge, card.clientIP);
                        if (returnData.paid === true && returnData.status === "succeeded") {
                            ccresult.chargeid = returnData.id;
                            ccresult.success = true;
                            ccresult.message = "card charged.";
                        }
                        ccresult.result = JSON.stringify(returnData);

                    } catch (err: any) {
                        ccresult.success = false;
                        ccresult.result = JSON.stringify(err);

                        if (err.data && err.data.error && err.data.error.message) {
                            ccresult.message = err.data.error.message;
                        } else if (err.message) {
                            ccresult.message = err.message;
                        } else {
                            ccresult.message = "error charging credit card.";
                        }
                    }
                    break;
                }
            default: {
                ccresult.success = false;
                ccresult.result = "processor type not supported."
            }
        }

        return ccresult;
    }


}


