import Link from "next/link";
import { Bot, ChevronDown, MoreHorizontal, Search, UsersRound } from "lucide-react";
import { FeedColumn } from "@/components/feed/feed-column";
import { ResponsiveSidebar } from "@/components/layout/sidebar/mobile-sidebar";

const pulseItems = [
  { symbol: "S&P 500", value: "5,832.31", change: "+0.41%", positive: true },
  { symbol: "NASDAQ", value: "18,724.92", change: "+0.72%", positive: true },
  { symbol: "BTC", value: "$71,420", change: "−1.18%", positive: false },
];

export function AppShell() {
  return (
    <div className="app-frame">
      <ResponsiveSidebar />
      <FeedColumn />

      <aside className="right-rail">
        <div className="right-rail__inner">
          <label className="right-rail-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Search The Cartel" aria-label="Search The Cartel" />
          </label>
          <section className="rail-card market-pulse">
            <div className="rail-card__heading"><div><p className="section-kicker">Market pulse</p><h2>Live overview</h2></div><span className="live-label"><i /> Live</span></div>
            <div className="pulse-list">
              {pulseItems.map((item) => (
                <div className="pulse-item" key={item.symbol}><div><strong>{item.symbol}</strong><span>{item.value}</span></div><span className={item.positive ? "positive" : "negative"}>{item.change}</span></div>
              ))}
            </div>
            <button className="text-button">View markets <span>→</span></button>
          </section>
          <section className="rail-card trending-card">
            <div className="rail-card__heading"><div><p className="section-kicker">What matters now</p><h2>Trending</h2></div><button className="small-icon-button" aria-label="Trending options"><MoreHorizontal size={17} /></button></div>
            {["Topics will appear here", "Market conversations", "Publisher briefings"].map((title, index) => (
              <div className="trend-placeholder" key={title}><span>0{index + 1}</span><div><strong>{title}</strong><small>{index === 0 ? "Built for live community momentum" : index === 1 ? "Ranked by relevance, not noise" : "Verified sources, clearly labeled"}</small></div></div>
            ))}
          </section>
          <section className="ai-card">
            <span className="ai-card__icon"><Bot size={21} /></span><p className="section-kicker">Cartel AI</p><h2>Understand the story behind the move.</h2>
            <Link href="/cartel-ai">Open Cartel AI <span>↗</span></Link>
          </section>
          <section className="network-card"><UsersRound size={18} /><div><strong>Build your network</strong><span>Follow credible voices and publishers.</span></div><ChevronDown size={16} /></section>
        </div>
      </aside>

    </div>
  );
}
