import { CCFormatAmount, CCFormatMM, CCIsCardExpired, IsNullOrUndefined, ParseBool, ParseNum, ParseString } from "../utilities";

describe('Test utilities.ts', () => {

  test('ParseString', () => {
    let res = ParseString(null);
    expect(res).toBe("");

    res = ParseString(1);
    expect(res).toBe("1");

    let a;
    res = ParseString(a);
    expect(res).toBe("");

    res = ParseString(undefined);
    expect(res).toBe("");
    
    res = ParseString({});
    expect(res).toBe("");

    res = ParseString(NaN);
    expect(res).toBe("");

    res = ParseString(Infinity);
    expect(res).toBe("");

  });
  
  test('ParseBool', () => {
    let res = ParseBool(null);
    expect(res).toBe(false);

    res = ParseBool("true");
    expect(res).toBe(true);

    res = ParseBool(false);
    expect(res).toBe(false);

    res = ParseBool("false");
    expect(res).toBe(false);

    res = ParseBool("1");
    expect(res).toBe(true);

    res = ParseBool(1);
    expect(res).toBe(true);

    res = ParseBool(0);
    expect(res).toBe(false);

    res = ParseBool("0");
    expect(res).toBe(false);

    res = ParseBool("a");
    expect(res).toBe(false);

    res = ParseBool("y");
    expect(res).toBe(true);

    res = ParseBool("Y");
    expect(res).toBe(true);

    res = ParseBool("n");
    expect(res).toBe(false);

    res = ParseBool("N");
    expect(res).toBe(false);

    res = ParseBool(NaN);
    expect(res).toBe(false);    

    res = ParseBool(Infinity);
    expect(res).toBe(false);

  });

  test('ParseNum', () => {
    let res = ParseNum(null);
    expect(res).toBe(0);

    res = ParseNum("1");
    expect(res).toBe(1);

    res = ParseNum("a");
    expect(res).toBe(0);

    res = ParseNum(NaN);
    expect(res).toBe(0);    

    res = ParseNum(Infinity);
    expect(res).toBe(0);

  });

  test('IsNullOrUndefined', () => {
    let res = IsNullOrUndefined(null);
    expect(res).toBe(true);

    let a;
    res = IsNullOrUndefined(a);
    expect(res).toBe(true);

    res = IsNullOrUndefined(undefined);
    expect(res).toBe(true);

    res = IsNullOrUndefined(1);
    expect(res).toBe(false);

    res = IsNullOrUndefined("1");
    expect(res).toBe(false);

    res = IsNullOrUndefined(true);
    expect(res).toBe(false);

    res = IsNullOrUndefined(false);
    expect(res).toBe(false);

    res = IsNullOrUndefined(-1);
    expect(res).toBe(false);

    res = IsNullOrUndefined(NaN);
    expect(res).toBe(false);

  });

  test('CCFormatMM len should be 2', () => {
        let res = CCFormatMM(1);
      expect(res.length).toBe(2);
  });

  test('CCIsCardExpired should not be expired', () => {
    
    let cDate = new Date('2024-01-01');
    let res = CCIsCardExpired(2024, 1, cDate);
    expect(res).toBe(false);
    
    res = CCIsCardExpired(2025, 1, cDate);
    expect(res).toBe(false);


  });

  test('CCIsCardExpired should be expired', () => {
    let cDate = new Date('2024-01-01');
    let res = CCIsCardExpired(2024, 2, cDate);
    expect(res).toBe(true);

    res = CCIsCardExpired(2023, 1, cDate);
    expect(res).toBe(true);

  });

  test('CCFormatAmount', () => {
    
    let res = CCFormatAmount(2.1);
    expect(res).toBe("2.10");    

    res = CCFormatAmount(0.1);
    expect(res).toBe("0.10");

  });

  


  });