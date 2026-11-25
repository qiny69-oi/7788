/*
 * JD ad-endpoint blocker + functionId logger.（Egern 原生 ctx 版）
 * 逻辑与 y0unge/ad-block-collection 的 jd_ad_request.js 完全一致，
 * 仅把 Loon/Surge 的 $request/$done 接口换成 Egern 的 export default + ctx 接口：
 * 命中纯广告 fid 时用 ctx.respond 本地返回空 JSON，未命中则把已读取的 body 原样回填透传。
 *
 * The modern JD network stack (JDNetworkBaseAF) serializes functionId into
 * the POST body, leaving the URL bare ("/client.action?"), so URL-based
 * rewrites/scripts never match those requests. This script reads the body,
 * answers pure-ad endpoints locally with an empty JSON.
 */

const DEBUG = false; // true: 输出全部 functionId 流水用于排查（平时保持 false 省电）

const REJECT_FIDS = {
  queryPagePopWindow: 1, // page pop-up ads
  babelGetGuideTips: 1, // home guide overlay
  secondFloor: 1, // pull-down marketing second floor
  searchBoxWord: 1, // search box marketing words
  stationPullService: 1,
  uniformRecommend0: 1, // recommendation feed ad slots
  uniformRecommend6: 1,
  uniformRecommend9: 1,
};

export default async function (ctx) {
  const url = ctx.request.url || "";
  let body = "";
  try {
    body = await ctx.request.text();
  } catch (e) {}
  let fid = "";

  const um = url.match(/[?&]functionId=([^&]+)/);
  if (um) fid = um[1];

  if (!fid && typeof body === "string" && body.length > 0) {
    const bm = body.match(/(?:^|&)functionId=([^&]*)/);
    if (bm) {
      try {
        fid = decodeURIComponent(bm[1].replace(/\+/g, "%20"));
      } catch (e) {
        fid = bm[1];
      }
    }
    if (!fid) {
      const jm = body.match(/"functionId"\s*:\s*"([^"]+)"/);
      if (jm) fid = jm[1];
    }
  }

  if (DEBUG) {
    console.warn(
      "[JD-FID] " +
        (ctx.request.method || "GET") +
        " fid=" +
        (fid || "(none)") +
        " url=" +
        url.slice(0, 120)
    );
  }

  if (fid && REJECT_FIDS[fid]) {
    console.warn("[JD-FID] blocked fid=" + fid);
    return ctx.respond({
      status: 200,
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: "{}",
    });
  }

  // body 已被读取消费，未命中时原样回填透传；无 body 则直接透传
  if (body) return { body };
}
