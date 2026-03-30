export function calculateRisk(user: any) {
    const depTotal = Number(user.depTotal || 0);
    const wthTotal = Math.abs(Number(user.wthTotal || 0));
    const bonusTotal = Number(user.bonusTotal || 0);
    const wthCount = Number(user.wthCount || 0);
    const depCount = Number(user.depCount || 0);
  
    let score = 0;
  
    // 1. 提现接近充值
    if (depTotal > 0 && wthTotal / depTotal >= 0.8) {
      score += 30;
    }
  
    // 2. 奖金金额偏大
    if (bonusTotal >= 80) {
      score += 20;
    } else if (bonusTotal >= 30) {
      score += 10;
    }
  
    // 3. 快进快出
    if (user.createdDateTime && user.visitedDateTime) {
      const created = new Date(user.createdDateTime).getTime();
      const visited = new Date(user.visitedDateTime).getTime();
  
      if (!Number.isNaN(created) && !Number.isNaN(visited)) {
        const diff = visited - created;
        if (diff > 0 && diff < 60 * 60 * 1000) {
          score += 15;
        }
      }
    }
  
    // 4. 提现次数偏高
    if (wthCount >= 1) {
      score += 10;
    }
    if (wthCount >= 3) {
      score += 10;
    }
  
    // 5. 充值少但奖金高
    if (depTotal <= 10 && bonusTotal >= 50) {
      score += 20;
    }
  
    // 6. 没怎么充值但有提现
    if (depTotal <= 10 && wthTotal > 0) {
      score += 20;
    }
  
    // 7. 充值次数少、提现次数有
    if (depCount <= 1 && wthCount >= 1) {
      score += 10;
    }
  
    let level = "LOW";
    if (score >= 50) level = "HIGH";
    else if (score >= 25) level = "MEDIUM";
  
    return { score, level };
  }