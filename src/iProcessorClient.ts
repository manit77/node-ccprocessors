export interface IProcessorClient {
    AuthorizeCard : (charge: any)=>{};
    ChargeAuthorization : (charge: any)=>{};
    ChargeCard : (charge: any)=>{};
}