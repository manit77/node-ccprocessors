import { CCFormatAmount, CCFormatMM, CCIsCardExpired } from "../utilities";

describe('utilities.ts', () => {
    
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