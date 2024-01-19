export class CreditCardItem implements ICreditCardItem {
    brand: CCBrands = CCBrands.MC; // ** required
    number: string = ""; // cc number ** required
    exp_month: string = ""; // two digit month ** required
    exp_year: string = ""; // 4 digit year ** required
    name: string = ""; // first space last 'Manit Chanthavong', ** required
    cvv: string = ""; //security code ** required
    first6: string = "000000";  //first 6 digits of card ** required
    country: string = "US"; //country code ** required
    last4: string = "0000"; // ** required
    address_line1: string = ""; //'address1';
    address_line2: string = ""; //'address2';
    address_city: string = ""; //'irving';
    address_state: string = ""; // 'tx';
    address_zip: string = ""; // "75063";
    address_country: "US"
    amountCharge: number; //format is 1.00 = $1.00
    processortype: CCProcessors = CCProcessors.clover
    clientIP = "192.168.1.1";
    external_reference_id: string = ""; //order number
    external_customer_reference: string = ""; //customer number
    cardid: string = "";
    authid: string = "";
    chargeid: string = "";
}

export interface ICreditCardItem {
    brand: CCBrands;
    number: string;
    exp_month: string;
    exp_year: string;
    name: string;
    cvv: string;
    first6: string;
    country: string;
    last4: string;
    address_line1: string;
    address_line2: string;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
    amountCharge: number
    processortype: CCProcessors;
    clientIP : string;
    external_reference_id: string;
    external_customer_reference: string;
    cardid: string;
    authid: string;
    chargeid: string;
}

export enum CCBrands {
    MC = 'MC',
    VISA = "VISA",
    AMEX = "AMEX",
    DISCOVER = "DISCOVER"
}

export class ChargeResult {
    success = false;
    result: string = "";
    message: string = "";
    cardid: string = "";
    authid: string = "";
    chargeid: string = "";
}


export enum CCProcessors {
    clover = "clover"
}