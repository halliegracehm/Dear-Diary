// Latest My Inner Mind podcast episodes from the Podbean RSS feed
const FEED = process.env.PODCAST_FEED_URL || "https://feed.podbean.com/halliegracehm/feed.xml";
const PAGE = "https://halliegracehm.podbean.com/";

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .trim();
}
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}
function attr(xml, name, a) {
  const m = xml.match(new RegExp(`<${name}\\s[^>]*${a}="([^"]+)"`, "i"));
  return m ? decode(m[1]) : "";
}

export function parseFeed(xml) {
  const channelHead = xml.split(/<item[\s>]/i)[0];
  const showImage = attr(channelHead, "itunes:image", "href") || tag(tag(channelHead, "image"), "url");
  const items = xml.match(/<item[\s>][\s\S]*?<\/item>/gi) || [];
  const episodes = items.slice(0, 12).map((it) => ({
    title: tag(it, "title"),
    date: tag(it, "pubDate"),
    url: attr(it, "enclosure", "url"),
    duration: tag(it, "itunes:duration"),
    image: attr(it, "itunes:image", "href") || showImage,
    link: tag(it, "link"),
  })).filter((e) => e.title && e.url && /^https:\/\//.test(e.url));
  return { title: tag(channelHead, "title"), link: tag(channelHead, "link") || PAGE, episodes };
}

export default async function handler(req, res) {
  try {
    const r = await fetch(FEED, { headers: { "User-Agent": "MyInnerMind/1.0" } });
    if (!r.ok) throw new Error("feed " + r.status);
    const data = parseFeed(await r.text());
    res.setHeader("Cache-Control", "s-maxage=1800, stale-while-revalidate=86400");
    return res.status(200).json(data);
  } catch (e) {
    console.error("podcast feed error", e);
    return res.status(200).json({ link: PAGE, episodes: [] });
  }
}
