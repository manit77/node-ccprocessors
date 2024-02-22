import express from "express";
import { GetENV } from "./utils/env";
import cors from "cors";
import { Logger } from "./models/logger";
import { AuthTokenObject, IWebService, IWebServiceDeps } from "./models/models";
import jwt from "jsonwebtoken";
import { AppServer } from "./appServer";
import { AppConfig } from "./models/appConfig";

let fs = require('fs');

(async () => {

    let env = await GetENV();
    let appConfig = new AppConfig(env);
    let logger = new Logger(appConfig.logfilepathandname());
    let token_secret = appConfig.token_secret_key();
    let http_port : string = appConfig.http_port();

    //show configs
    logger.WriteLog(`app_name: ${appConfig.app_name()}`);
    logger.WriteLog(`app_version: ${appConfig.app_version()}`);
    logger.WriteLog(`http_port: ${appConfig.http_port()}`);
    logger.WriteLog(`logfilepathandname: ${appConfig.logfilepathandname()}`);

    let serviceDeps :IWebServiceDeps = {
        AppConfig: appConfig
    }

    let appServer = new AppServer(serviceDeps);
    let services = appServer.GetServices()

    /// begin webserver code
    const expressApp = express();
    let httpServer = null;
    let isHttps = false;
    if (appConfig.cert_key_path && appConfig.cert_cert_path()) {
        let options = {
            key: fs.readFileSync(appConfig.cert_key_path()),
            cert: fs.readFileSync(appConfig.cert_cert_path())
        }
        logger.WriteLog(options);

        httpServer = require("https").createServer(options, expressApp);
        isHttps = true;
    } else {
        httpServer = require("http").createServer(expressApp);
    }

    expressApp.use(cors());
    expressApp.use(express.json({ limit: '100mb' }));
    expressApp.use(express.urlencoded({ extended: true }));
    expressApp.options('*', cors());
    expressApp.use(ExpressErrorHandling);

    expressApp.get("/version", async function (req, res) {
        res.json(appConfig.app_version());
    });

    //register all services
    for (let i = 0; i < services.length; i++) {
        let api = services[i];
        RegisterService(api);
    }
   
    function RegisterService(service: IWebService) {
        let routes = service.GetRoutes();
        for (let index = 0; index < routes.length; index++) {
            const route = routes[index];

            logger.WriteLog(`register route ${route.Path}`);

            if (route.Authenticated) {
                expressApp.post(route.Path, DecodeAuthToken, async function (req, res, next) {
                    try {
                        logger.WriteLog("auth post " + route.Path);
                        //const authToken: string = (req as any).authToken;
                        const authTokenObject = (req as any).authTokenObject as AuthTokenObject;
                        //PARSEPOSTDATA(req.body);
                        const returnData = await route.FnCall.bind(service)(authTokenObject, req.body);
                        res.json(returnData);

                    } catch (err) {
                        ExpressErrorHandling(err, req, res, next);
                    }
                });
            } else {
                expressApp.post(route.Path, async function (req, res, next) {
                    try {
                        logger.WriteLog("guest post " + route.Path);
                        //PARSEPOSTDATA(req.body);
                        const returnData = await route.FnCall.bind(service)(req.body);
                        res.json(returnData);
                    } catch (err) {
                        ExpressErrorHandling(err, req, res, next);
                    }
                });
            }
        }
    }

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

    function DecodeAuthToken(
        req: express.Request,
        res: express.Response,
        next: express.NextFunction | null
    ) {

        const bearerHeader = req.headers["authorization"];
        if (bearerHeader) {
            const bearer = bearerHeader.split(" ");          
            const bearerToken: string = bearer[1];
            try {

                let jwtAuthToken = jwt.verify(
                    bearerToken,
                    token_secret
                ) as AuthTokenObject;

                let authTokenObject : AuthTokenObject = {
                    userid: jwtAuthToken.userid, 
                    username: jwtAuthToken.username
                };

                (req as any).authToken = bearerToken;
                (req as any).authTokenObject = authTokenObject;

                if (next) {
                    next();
                }

            } catch (err) {
                res.sendStatus(403);
            }

        } else {
            res.sendStatus(403);
        }
    }

    httpServer.listen(http_port, () => {
        logger.WriteLog(`${appConfig.app_version()} running on ${isHttps ? "https" : "http"} on port ${http_port}`);
    });

})();
