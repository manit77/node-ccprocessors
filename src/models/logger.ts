import * as log from "log4js";

export class Logger {
  
  logObj = log.getLogger("default");

  constructor(private logfilepathandname = "logs/application", private usepm2: boolean = true, private pm2instancevar: string = "NODE_APP_INSTANCE") {

    console.log("*** logger created. usepm2=" + usepm2 + "&logfilepathandname=" + logfilepathandname);

    log.configure({
      appenders: {
        out: { type: 'console' },
        default: {
          type: 'dateFile'
          , filename: logfilepathandname
          //, "pattern": "yyyy-MM-dd"
          , alwaysIncludePattern: true
          , daysToKeep: 15
          , keepFileExt: true
        },
        // task: { type: 'dateFile', filename: 'logs/task',"pattern":"yyyy-MM-dd.log", alwaysIncludePattern:true },
        // result: { type: 'dateFile', filename: 'logs/result',"pattern":"-dd.log", alwaysIncludePattern:true},
        // error: { type: 'dateFile', filename: 'logs/error', "pattern":"-dd.log",alwaysIncludePattern:true},
        // rate: { type: 'dateFile', filename: 'logs/rate', "pattern":"-dd.log",alwaysIncludePattern:true}
      },
      categories: {
        default: { appenders: ['out', 'default'], level: 'info' },
        // task: { appenders: ['task'], level: 'info'},
        // result: { appenders: ['result'], level: 'info' },
        // error: { appenders: ['error'], level: 'error' },
        // rate: { appenders: ['rate'], level: 'info' }
      },
      pm2: this.usepm2,
      pm2InstanceVar: this.pm2instancevar
    });

   
    this.logObj = log.getLogger("default");
  }
  WriteLog(...logtext: string | any) {    
    this.logObj.info(logtext);
  }
  WriteError(...logtext: string | any) {
    this.logObj.error(logtext);
  }
}