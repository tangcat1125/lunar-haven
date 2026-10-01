/**
 * LunarCalendar - 公曆轉農曆精準演算法
 * 提供公曆與農曆雙曆對照、中文曆法格式化（如「八月十九」）、星期轉換
 */
class LunarCalendar {
  constructor() {
    // 1900 ~ 2050 農曆編碼數據表
    this.lunarInfo = [
      0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
      0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
      0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
      0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
      0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
      0x06ca0,0x0b550,0x15355,0x04da0,0x0a5d0,0x14573,0x052d0,0x0a9a8,0x0e950,0x06aa0,
      0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
      0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b5a0,0x195a6,
      0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
      0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
      0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
      0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
      0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
      0x05aa0,0x076a3,0x096d0,0x04bd7,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
      0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0
    ];

    this.nStr1 = ['日', '一', '二', '三', '四', '五', '六'];
    this.nStr2 = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'];
    this.nStr3 = ['初', '十', '廿', '卅'];
  }

  lYearDays(y) {
    let sum = 348;
    for (let i = 0x8000; i > 0x8; i >>= 1) {
      sum += (this.lunarInfo[y - 1900] & i) ? 1 : 0;
    }
    return sum + this.leapDays(y);
  }

  leapMonth(y) {
    return this.lunarInfo[y - 1900] & 0xf;
  }

  leapDays(y) {
    if (this.leapMonth(y)) {
      return (this.lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
    }
    return 0;
  }

  monthDays(y, m) {
    return (this.lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
  }

  solarToLunar(solarDate) {
    const baseDate = new Date(1900, 0, 31);
    let offset = Math.floor((solarDate.getTime() - baseDate.getTime()) / 86400000);
    let y, daysInYear = 0;
    for (y = 1900; y < 2050 && offset > 0; y++) {
      daysInYear = this.lYearDays(y);
      offset -= daysInYear;
    }
    if (offset < 0) {
      offset += daysInYear;
      y--;
    }

    let isLeap = false;
    let leap = this.leapMonth(y);
    let m = 1, daysInMonth = 0;
    for (m = 1; m < 13 && offset > 0; m++) {
      if (leap > 0 && m === (leap + 1) && !isLeap) {
        --m;
        isLeap = true;
        daysInMonth = this.leapDays(y);
      } else {
        daysInMonth = this.monthDays(y, m);
      }
      if (isLeap && m === (leap + 1)) isLeap = false;
      offset -= daysInMonth;
    }

    if (offset === 0 && leap > 0 && m === leap + 1) {
      if (isLeap) {
        isLeap = false;
      } else {
        isLeap = true;
        --m;
      }
    }

    if (offset < 0) {
      offset += daysInMonth;
      --m;
    }

    return {
      year: y,
      month: m,
      day: offset + 1,
      isLeap: isLeap
    };
  }

  // 格式化農曆字串，例如「八月十九」
  formatLunarDay(lunar) {
    let mStr = (lunar.isLeap ? '閏' : '') + this.nStr2[lunar.month - 1] + '月';
    let dStr = '';
    const day = lunar.day;
    if (day === 10) {
      dStr = '初十';
    } else if (day === 20) {
      dStr = '二十';
    } else if (day === 30) {
      dStr = '三十';
    } else {
      dStr = this.nStr3[Math.floor(day / 10)] + (day % 10 === 0 ? '十' : this.getDigitChar(day % 10));
    }
    return mStr + dStr;
  }

  getDigitChar(n) {
    const chars = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    return chars[n] || '';
  }

  // 格式化公曆字串，例如「9月29日（二）」
  formatGregorian(date) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const w = this.nStr1[date.getDay()];
    return `${m}月${d}日（${w}）`;
  }
}

window.lunarCalendar = new LunarCalendar();
