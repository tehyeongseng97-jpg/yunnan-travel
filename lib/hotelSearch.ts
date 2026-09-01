/**
 * Hotel Search
 * ------------------------------------------------------------
 * 酒店价格是动态的（需选日期才显示），搜索引擎摘要页抓不到可靠价格，
 * 强行抓取只会返回大量"无法确认"，没有实际价值。
 * 改为诚实的方案：生成真实的携程搜索链接，附带区域和日期，
 * 让用户自己去看当前实时价格 —— 不假装能做到做不到的事。
 */

export interface HotelSearchLinks {
  location: string;
  checkIn?: string;
  checkOut?: string;
  links: { label: string; url: string }[];
}

export function buildHotelSearchLinks(
  location: string,
  checkIn?: string,
  checkOut?: string
): HotelSearchLinks {
  const encodedLocation = encodeURIComponent(location);

  const links = [
    {
      label: "携程搜索",
      url: `https://hotels.ctrip.com/hotels/list?city=&keyword=${encodedLocation}`,
    },
    {
      label: "去哪儿搜索",
      url: `https://hotel.qunar.com/?keyword=${encodedLocation}`,
    },
    {
      label: "美团搜索",
      url: `https://www.meituan.com/s/${encodedLocation}/`,
    },
  ];

  return { location, checkIn, checkOut, links };
}
