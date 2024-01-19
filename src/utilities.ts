import { assign, pick, keys, isUndefined, isNull, each, isDate, isString, isObject } from 'lodash'
import crypto from 'crypto';
import fs from 'fs/promises';
import * as fssynch from 'fs';

export function Copy(fromObject: any, toObject: any, ignoreKeys: string[] = []): any {
  let tokeys = keys(toObject);

  let newKeys = new Array<string>();
  if (ignoreKeys && ignoreKeys.length > 0) {
    for (let index = 0; index < tokeys.length; index++) {
      const key = tokeys[index];
      var arrIgnoreKey = ignoreKeys.filter(ikey => ikey == key);
      if (arrIgnoreKey.length == 0) {
        newKeys.push(key);
      }
    }
  } else {
    newKeys = tokeys;
  }

  return assign(toObject, pick(fromObject, newKeys));
}

export function CryptoGetSalt() {
  return crypto.randomBytes(16).toString('hex');
}

export function CryptoHashSalt(salt: string, value: string) {
  return crypto.pbkdf2Sync(value, salt, 1000, 64, 'sha512').toString('hex');
}

export function CryptoVerifyHash(salt: string, value: string, hash: string) {
  var hashGenerated = crypto.pbkdf2Sync(value, salt, 1000, 64, 'sha512').toString('hex');
  return hashGenerated === hash;
}

export function StringIsNullOrEmpty(val: string): boolean {
  if (val === undefined || val == null || val == "") {
    return true;
  }
  return false;
}

export function NumberIsNullOrZeroOrLess(val: any): boolean {
  if (val === undefined || val == null || val === 0) {
    return true;
  }
  return false;
}

export function IsNullOrUndefined(val: any): boolean {
  if (undefined === val || val == null) {
    return true;
  }
  return false;
}

export function IsObject(o) {
  return o !== null && typeof o === 'object' && Array.isArray(o) === false;
}

export function IsDate(o) {
  return o instanceof Object && o.constructor === Date;
}

export function IsString(v) {
  return typeof v === 'string' || v instanceof String
}

export function GetTenDigitPhoneNumber(pnum: string): string {
  if (pnum.length > 10) {
    return pnum.substr(pnum.length - 10, 10);
  }
  return pnum;
}

export function ParseString(invalue: any): String {
  if (isNull(invalue)) {
    return "";
  }
  if (isUndefined(invalue)) {
    return "";
  }
  return new String(invalue);
}

export function ParseBool(invalue: any): boolean {
  if (isNull(invalue) || isUndefined(invalue)) {
    return false
  }
  if (invalue == true || invalue == "1" || invalue == "y" || invalue == "Y") {
    return true;
  }
  return false;
}

export function ParseNum(invalue: any, defaultvalue = 0): Number {
  var rv = 0;
  if (invalue == null || invalue == typeof (undefined)) {
    rv = defaultvalue
  } else {
    rv = Number(invalue);
    if (isNaN(rv)) {
      rv = defaultvalue;
    }
  }
  return rv;
}

export function ParseDate(invalue: any, defaultvalue = null) : Date | null {
  var rv = null;
  if (invalue == null || invalue == typeof (undefined) || invalue === "") {
    rv = defaultvalue
  } else if(isDate(invalue)) {
    rv = invalue;
  } else {
    //check if date part
    if(isString(invalue)){      
        rv = new Date(invalue);  
    } else if (isObject(invalue)) {

      if((invalue as any).year && (invalue as any).month && (invalue as any).day){
        //rv = new Date((invalue as any).year, (invalue as any).month - 1, (invalue as any).day, 0, 0, 0, 0);
        //throw error cannot process date part
        throw new Error("date part not supported: " + invalue);
      }

    }  else {
      rv = new Date(invalue);
    }
  }
  return rv;
}

export function RoundUp(num: number, decimalplaces: number = 0): Number {
  return +(num).toFixed(decimalplaces);
}

export function WeekOfYear(inDate: Date, weekStart: number = 0): Number {
  var januaryFirst = new Date(inDate.getFullYear(), 0, 1);
  return Math.floor((((Number(inDate) - Number(januaryFirst)) / 86400000) + januaryFirst.getDay() - weekStart) / 7) + 1;
}

export function DateDiff(datepart: string, todate: Date, fromdate: Date) {

  datepart = datepart.toLowerCase();

  var diff = Number(todate) - Number(fromdate);

  var divideBy: any = {
    w: 604800000, //week
    d: 86400000, // day
    h: 3600000, // hours
    n: 60000, // minutes
    s: 1000 // sec
  };

  var result = Math.abs(Math.trunc(diff / divideBy[datepart]))

  return result;
}

export async function CreateDirectory(path: string , recursive = true): Promise<boolean> {
  try {
    await fs.mkdir(path, { recursive: recursive });
    return true;
  } catch {
    return false;
  }
}

export async function DirectoryExists(path: string): Promise<boolean> {
  // the result can be either false (from the caught error) or it can be an fs.stats object
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function DeleteFile(src: string) : Promise<boolean> {
  try {
    await fs.unlink(src);
    return true
  } catch (error) {
    console.log(error);
  }
  return false;
}

export async function MoveFile(src: string, dst: string) : Promise<boolean> {
  try {
    await fs.rename(src, dst);
    return true;
  } catch (error) {
    console.log(error);
  }
  return false;
}

export async function ReadFile(src: string): Promise<string>{
  try {
    let buffer = (await fs.readFile(src));
    let content = await buffer.toString(); //bug, returns a promise of string
    return content;
  } catch(error){
    console.log(error);
    throw error;
  }
}

export async function WriteFile(src: string, content: string): Promise<void>{
  try {
    await fs.writeFile(src, content);
  } catch(error){
    console.log(error);
    throw error;
  }
}

export async function AppendFile(src: string, content: string): Promise<void>{
  try {
    await fs.appendFile(src, content);
  } catch(error){
    console.log(error);
    throw error;
  }
}

export function FileExists(src: string): boolean {  
  return fssynch.existsSync(src);
}

