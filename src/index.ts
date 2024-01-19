import express from "express";
import { GetENV } from "./env";
import cors from "cors";
import { Logger } from "./logger";
import { CreditCardProcessor } from "./creditCardProcessor";
import { ICreditCardItem } from "./models";
let fs = require('fs');

(async () => {

    let config = await GetENV();

    let version = "ccprocessors 1.0";
    let logger = new Logger(config.logfilepathandname);
    logger.WriteLog(`starting ${version}`);

    let ccProcessor = new CreditCardProcessor(config);

    const expressApp = express();
    let httpServer = null;
    let isHttps = false;
    if (config.cert_key_path && config.cert_cert_path) {
        let options = {
            key: fs.readFileSync(config.cert_key_path),
            cert: fs.readFileSync(config.cert_cert_path)
        }
        logger.WriteLog(options);
        
        httpServer = require("https").createServer(options, expressApp);
        isHttps = true;
    } else {
        httpServer = require("http").createServer(expressApp);
    }

    let http_port = config.http_port;

    expressApp.use(cors());
    expressApp.use(express.json({ limit: '100mb' }));
    expressApp.use(express.urlencoded({ extended: true }));
    expressApp.options('*', cors());

    expressApp.get("/version", async function (req, res) {
        res.json(version);
    });

    expressApp.post("/v1/authorizecard", async function (req, res, next) {
        try {

            if (req.body) {
                let result = await ccProcessor.AuthorizeCard(req.body as ICreditCardItem);
                res.json(result);
            } else {
                res.end();
            }
        } catch (err) {
            ExpressErrorHandling(err, req, res, next);
        }
    });

    expressApp.post("/v1/authorizecharge", async function (req, res, next) {
        try {

            if (req.body) {
                let result = await ccProcessor.ChargeAuthorization(req.body as ICreditCardItem);
                res.json(result);
            } else {
                res.end();
            }
        } catch (err) {
            ExpressErrorHandling(err, req, res, next);
        }
    });

    expressApp.post("/v1/chargecard", async function (req, res, next) {
        try {

            if (req.body) {
                let result = await ccProcessor.ChargeCard(req.body as ICreditCardItem);
                res.json(result);
            } else {
                res.end();
            }
        } catch (err) {
            ExpressErrorHandling(err, req, res, next);
        }
    });

    function ExpressErrorHandling(err: any, req: any, res: any, next: any) {
        GlobalErrorsHandling(err);

        err.statusCode = err.statusCode || 500;
        err.status = err.status || 'error';

        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }

    function GlobalErrorsHandling(err: any) {

        logger.WriteLog("GlobalErrorsHandling");

        if (err.stack) {
            logger.WriteLog(err.stack);
        }
        
        if (err.innerStack) {
            logger.WriteLog(err.innerStack);
        }

    }

    expressApp.use(ExpressErrorHandling);

    httpServer.listen(http_port, () => {
        logger.WriteLog(`${version} running on ${isHttps ? "https" : "http"} on port ${http_port}`);
    });

})();
