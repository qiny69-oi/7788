/**
* 闲鱼去广告 - Egern 脚本
* 基于 qiny69-oi/7788 的 goofish.js 修改（2026-11-23）：
* 第 3 分支（个人主页 my.adapter）新增删除会员等级卡（闲鱼会员 X5 那条），其余与原版一致。
*/

export default async function (ctx) {
const url = ctx.request?.url || "";

// 只处理指定接口，其他请求直接放行
const supported =
url.includes("/mtop.taobao.idlehome.home.nextfresh") ||
url.includes("/mtop.taobao.idle.local.home") ||
url.includes("/mtop.idle.user.page.my.adapter") ||
url.includes("/mtop.taobao.idlehome.home.circle.list") ||
url.includes("/mtop.taobao.idle.local.nearby.itemdetail.enter") ||
url.includes("/mtop.taobao.idlemtopsearch.search") ||
url.includes("/mtop.taobao.idle.local.flow.plat.section");

if (!supported) return;

// 解析响应 JSON，解析失败则原样放行
let obj;
try {
obj = await ctx.response.json();
} catch {
return;
}

if (!obj || typeof obj!== "object" ||!obj.data) return;

const data = obj.data;

// 1. 首页商品信息流广告
if (url.includes("/mtop.taobao.idlehome.home.nextfresh")) {
delete data.widgetReturnDO;
delete data.bannerReturnDO;

if (Array.isArray(data.sections)) {
const excludeNames = [
"fish_home_yunying_card_d3",
"idlefish_seafood_market",
"fish_home_chat_room"
];

data.sections = data.sections.filter(section => {
if (!section || typeof section!== "object") return false;

const sectionData = section.data || {};
const templateName = section.template?.name;

// 过滤广告及运营内容
if (
sectionData.bizType === "AD" ||
sectionData.bizType === "homepage"
) {
return false;
}

// 过滤指定运营卡片
if (excludeNames.includes(templateName)) {
return false;
}

// 保留商品信息流
return sectionData.cardTypeValue === "Item";
});
}

// 首页顶部图标菜单
data.homeTopList = [];
}

// 2. 定位地区页面信息流广告
else if (url.includes("/mtop.taobao.idle.local.home")) {
if (Array.isArray(data.sections)) {
data.sections = data.sections.filter(section => {
return section?.data?.bizType!== "AD";
});
}
}

// 3. 个人主页广告
else if (url.includes("/mtop.idle.user.page.my.adapter")) {
const sections = data.container?.sections;

if (Array.isArray(sections)) {
const keepIndexes = ["0", "1", "3"];

data.container.sections = sections.filter(item =>
keepIndexes.includes(String(item?.index))
);
}

// 删除会员等级卡（闲鱼会员 X5 那条）
const userSection = data.container?.sections?.find(item =>
String(item?.index) === "0"
);

if (userSection?.item) {
delete userSection.item.level;
}

// 清除底部猜你喜欢
data.ability = [];
}

// 4. 首页顶部频道菜单
else if (url.includes("/mtop.taobao.idlehome.home.circle.list")) {
if (Array.isArray(data.circleList)) {
data.circleList = data.circleList.filter(circle =>
circle?.circleId === "1" || circle?.circleId === "2"
);
}

// 处理 next.headList
if (Array.isArray(data.next?.headList)) {
data.next.headList = data.next.headList.filter(item =>
item?.bizCode === "main" || item?.bizCode === "recycle"
);

const target = data.next.headList.find(
item => item?.bizCode === "recycle"
);

if (target) {
target.showInfo = target.showInfo || {};
target.showInfo.rightTagImage = {};
}
}

// 处理 headList
if (Array.isArray(data.headList)) {
data.headList = data.headList.filter(item =>
item?.bizCode === "main" || item?.bizCode === "recycle"
);

const target = data.headList.find(
item => item?.bizCode === "recycle"
);

if (target) {
target.showInfo = target.showInfo || {};
target.showInfo.rightTagImage = {};
}
}
}

// 5. 商品详情页周边推荐
else if (url.includes("/mtop.taobao.idle.local.nearby.itemdetail.enter")) {
data.targetUrl = "";

if (data.trackParams && typeof data.trackParams === "object") {
data.trackParams.itemIds = "";
}

data.nearbyItemInfoList = [];
data.name = "";
data.desc = "";
data.poiName = "";
}

// 6. 搜索结果信息流广告
else if (url.includes("/mtop.taobao.idlemtopsearch.search")) {
if (Array.isArray(data.resultList)) {
const excludeNames = [
"idlefish_search_card_category_select",
"idlefish_search_spu_market_publish"
];

data.resultList = data.resultList.filter(element => {
const exContent = element?.data?.item?.main?.exContent;

// 过滤闲鱼妈妈广告
if (
exContent?.isAliMaMaAD === true ||
exContent?.isAliMaMaAD === "true"
) {
return false;
}

// 过滤指定搜索卡片
const templateName = element?.data?.template?.name;

return!excludeNames.includes(templateName);
});
}

// 清除搜索结果前缀栏
delete data.resultPrefixBar;

// 清除顶部列表
if (Array.isArray(data.topList)) {
data.topList = [];
}
}

// 7. 同城页横幅广告
else if (url.includes("/mtop.taobao.idle.local.flow.plat.section")) {
const components = data.data?.components;

if (Array.isArray(components)) {
data.data.components = components.filter(item =>
item?.key!== "fish_home_activity_enter_cardV1"
);
}
}

// 返回修改后的响应体
return { body: obj};
}
