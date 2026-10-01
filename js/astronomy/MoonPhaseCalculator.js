/**
 * MoonPhaseCalculator - 8大月相與明暗幾何計算器
 * 依據農曆日精準映射標準天文月相名稱、明暗比例與危險期標記
 */
class MoonPhaseCalculator {
  constructor() {
    this.phases = [
      {
        id: 'new_moon',
        index: 0,
        name: '朔月',
        alias: '新月',
        english: 'New Moon',
        days: [29, 30, 1],
        illumination: 0.0,
        direction: 'none',
        crisisType: 'DARK_WOLF_ATTACK',
        dangerText: '至暗朔月・群狼夜襲',
        desc: '伸手不見五指，夜空無月，野狼自黑森林蜂擁而至！'
      },
      {
        id: 'waxing_crescent',
        index: 1,
        name: '眉月',
        alias: '蛾眉月',
        english: 'Waxing Crescent',
        days: [2, 3, 4, 5, 6],
        illumination: 0.25,
        direction: 'right',
        crisisType: 'INFECTION_SPREAD',
        dangerText: '銀鉤破曉・狼毒蔓延',
        desc: '右側微亮細弧，被咬傷者傷口發紫，需速採附子草！'
      },
      {
        id: 'first_quarter',
        index: 2,
        name: '上弦月',
        alias: '上弦月',
        english: 'First Quarter',
        days: [7, 8],
        illumination: 0.5,
        direction: 'right',
        crisisType: null,
        dangerText: '半弦高懸・鍛銀備藥',
        desc: '右半邊亮，切線筆直，鍛造銀短劍與解藥的黃金時期。'
      },
      {
        id: 'waxing_gibbous',
        index: 3,
        name: '盈凸月',
        alias: '盈凸月',
        english: 'Waxing Gibbous',
        days: [9, 10, 11, 12, 13],
        illumination: 0.75,
        direction: 'right',
        crisisType: 'RACE_DEADLINE',
        dangerText: '月輪漸滿・最後賽跑',
        desc: '右側大部明亮，狼毒逼近心臟，解藥必須於此刻完成交付！'
      },
      {
        id: 'full_moon',
        index: 4,
        name: '望月',
        alias: '滿月',
        english: 'Full Moon',
        days: [14, 15, 16],
        illumination: 1.0,
        direction: 'full',
        crisisType: 'WEREWOLF_OUTBREAK',
        dangerText: '銀月當空・狼人異變',
        desc: '滿月銀華照徹石階，未解毒之傷者狂暴狼化，警鐘長鳴！'
      },
      {
        id: 'waning_gibbous',
        index: 5,
        name: '虧凸月',
        alias: '虧凸月',
        english: 'Waning Gibbous',
        days: [17, 18, 19, 20, 21],
        illumination: 0.75,
        direction: 'left',
        crisisType: null,
        dangerText: '月色漸微・衛兵平暴',
        desc: '左側大部明亮，狼人氣力衰退，衛兵全力逮捕與壓制。'
      },
      {
        id: 'third_quarter',
        index: 6,
        name: '下弦月',
        alias: '下弦月',
        english: 'Third Quarter',
        days: [22, 23],
        illumination: 0.5,
        direction: 'left',
        crisisType: null,
        dangerText: '殘弦照夜・重建防線',
        desc: '左半邊亮，半圓朝東，趕緊修繕損毀設施與加固柵欄。'
      },
      {
        id: 'waning_crescent',
        index: 7,
        name: '殘月',
        alias: '殘月',
        english: 'Waning Crescent',
        days: [24, 25, 26, 27, 28],
        illumination: 0.25,
        direction: 'left',
        crisisType: 'PRE_DARK_WARNING',
        dangerText: '殘月將隱・至暗預警',
        desc: '左側殘存細弧，黑夜再度籠罩，儲備木材鐵礦準備下一輪防禦。'
      }
    ];
  }

  // 根據農曆日期計算月相
  calculatePhaseByLunar(lunar) {
    const day = lunar.day;
    for (const phase of this.phases) {
      if (phase.days.includes(day)) {
        return phase;
      }
    }
    // 預設朔月
    return this.phases[0];
  }

  // 是否為朔月至暗連續期（廿八～初二）
  isDarkMoonCrisisPeriod(day) {
    return day >= 28 || day <= 2;
  }

  // 是否為滿月銀月異變期（十四～十六）
  isFullMoonCrisisPeriod(day) {
    return day >= 14 && day <= 16;
  }

  // 是否為狼毒治癒賽跑關鍵期（初三～十三）
  isInfectionRacePeriod(day) {
    return day >= 3 && day <= 13;
  }
}

window.moonPhaseCalculator = new MoonPhaseCalculator();
