/**
 * Mock Search Adapter
 * ------------------------------------------------------------
 * 用于本地跑通 pipeline，不依赖真实 Search API Key。
 * 数据来自实际执行的 web_search 结果（普达措门票）。
 * 上线时把 SearchAdapter 换成真实实现。
 */

import { SearchAdapter, RawSearchResult } from "./searchAgent";

export const mockPudacuoAdapter: SearchAdapter = {
  async search(_query: string): Promise<RawSearchResult[]> {
    return [
      {
        url: "https://touch.piao.qunar.com/touch/detail.htm?id=2231",
        title: "普达措国家公园门票+景区内往返观光车票 - 去哪儿网",
        snippet: "门票+景区内往返观光车票 ¥138起 随买随用 随时退无需换票",
        publishedAt: new Date().toISOString(),
      },
      {
        url: "https://touch.piao.qunar.com/touch/detail.htm?id=2231&pkg=vip",
        title: "普达措国家公园门票+快速通行+VIP权益+拼车接驳 - 去哪儿网",
        snippet: "门票+快速通行服务+VIP权益礼包+园内观光车拼车+独克宗古城往返直通车拼车 ¥238起",
        publishedAt: new Date().toISOString(),
      },
      {
        url: "http://km.bendibao.com/tour/2023215/71865.shtm",
        title: "香格里拉普达措国家公园门票优惠政策及优惠对象-昆明本地宝",
        snippet: "香格里拉普达措国家公园门票价格为¥138，门票68元/人、车票70元人",
        publishedAt: "2023-02-15",
      },
    ];
  },
};
