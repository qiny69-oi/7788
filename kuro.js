/**
 * 库街区社区 + 鸣潮自动签到
 * 
 * 环境变量：
 *   KURO_TOKEN        - 必须
 *   KURO_DEVCODE      - 建议填写
 *   KURO_DISTINCT_ID  - 建议填写
 */
export default async function (ctx) {
  const token = ctx.env.KURO_TOKEN;
  const devCode = ctx.env.KURO_DEVCODE || "";
  const distinctId = ctx.env.KURO_DISTINCT_ID || "";

  if (!token) {
    ctx.notify({
      title: "库街区签到失败",
      body: "未配置环境变量 KURO_TOKEN",
      sound: true
    });
    return;
  }

  const results = [];

  // ========== 社区签到请求头 ==========
  const bbsHeaders = {
    "Host": "api.kurobbs.com",
    "token": token,
    "source": "ios",
    "lang": "zh-Hans",
    "User-Agent": "KuroGameBox/20261105141507 CFNetwork/3896.300.31 Darwin/27.3.0",
    "channelId": "1",
    "channel": "appstore",
    "version": "3.5.0",
    "model": "iPhone18,4",
    "osVersion": "27.3",
    "devCode": devCode,
    "distinct_id": distinctId,
    "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
    "Accept": "*/*",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    "priority": "u=3, i"
  };

  // ========== 鸣潮签到请求头 ==========
  const gameHeaders = {
    "Host": "api.kurobbs.com",
    "token": token,
    "source": "ios",
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) KuroGameBox/3.5.0",
    "Origin": "https://web-static.kurobbs.com",
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Accept-Language": "zh-CN,zh-Hans;q=0.9",
    "Sec-Fetch-Site": "same-site",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "priority": "u=3, i",
    "devcode": "117.182.246.3, Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) KuroGameBox/3.5.0"
  };

  // ========== 1. 社区签到 ==========
  try {
    const resp = await ctx.http.post("https://api.kurobbs.com/user/signIn", {
      headers: bbsHeaders,
      body: "gameId=2&geeTestData="
    });
    const data = await resp.json();
    console.log("社区签到返回：", JSON.stringify(data));

    if (data.code === 200) {
      if (data.data && data.data.geeTest === true) {
        results.push("社区：触发验证码（需手动签到）");
      } else if (data.data && data.data.continueDays !== undefined) {
        results.push(`社区：签到成功（连签${data.data.continueDays}天）`);
      } else {
        results.push("社区：签到成功");
      }
    } else if (data.code === 1511) {
      results.push("社区：今日已签到");
    } else {
      results.push(`社区：失败（${data.msg || data.code}）`);
    }
  } catch (e) {
    results.push(`社区：异常（${e.message}）`);
  }

  // ========== 2. 鸣潮游戏签到 ==========
  try {
    const roleId = "119621903";
    const serverId = "76402e5b20be2c39f095a152090afddc";
    const userId = "24498486";
    const reqMonth = String(new Date().getMonth() + 1).padStart(2, "0");

    const body = `gameId=3&serverId=${serverId}&roleId=${roleId}&userId=${userId}&reqMonth=${reqMonth}`;

    const resp = await ctx.http.post("https://api.kurobbs.com/encourage/signIn/v2", {
      headers: gameHeaders,
      body: body
    });
    const data = await resp.json();
    console.log("鸣潮签到返回：", JSON.stringify(data));

    if (data.code === 200) {
      results.push("鸣潮：签到成功");
    } else if (data.code === 1511) {
      results.push("鸣潮：今日已签到");
    } else {
      results.push(`鸣潮：失败（${data.msg || data.code}）`);
    }
  } catch (e) {
    results.push(`鸣潮：异常（${e.message}）`);
  }

  // ========== 发送通知 ==========
  ctx.notify({
    title: "库街区签到结果",
    body: results.join("\n"),
    sound: true
  });
}