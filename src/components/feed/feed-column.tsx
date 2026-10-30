"use client";

import {
  Bookmark,
  DollarSign,
  Heart,
  ImageIcon,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Repeat2,
  Share2,
  X,
} from "lucide-react";
import { useState } from "react";

type FeedFilter = "for-you" | "following" | "latest";

const marketPulse = [
  { symbol: "BTC", value: "$67,482", change: "+1.48%", positive: true },
  { symbol: "ETH", value: "$3,712", change: "+0.92%", positive: true },
  { symbol: "GOLD", value: "$2,341", change: "+0.62%", positive: true },
  { symbol: "EUR/USD", value: "1.0872", change: "+0.24%", positive: true },
  { symbol: "NASDAQ", value: "18,614", change: "−0.18%", positive: false },
];

function ActionButton({
  label,
  active = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      className={active ? "feed-action feed-action--active" : "feed-action"}
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function FeedColumn() {
  const [filter, setFilter] = useState<FeedFilter>("for-you");
  const [composerOpen, setComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [publishedPosts, setPublishedPosts] = useState<string[]>([]);

  function publishPost() {
    const post = draft.trim();
    if (!post) return;
    setPublishedPosts((current) => [post, ...current]);
    setDraft("");
    setComposerOpen(false);
    setFilter("for-you");
  }

  return (
    <main className="main-column feed-column" id="feed">
      <header className="feed-masthead">
        <div>
          <h1>Your feed</h1>
          <p>THURSDAY, 29 OCTOBER</p>
        </div>
        <div className="feed-switch" role="tablist" aria-label="Feed view">
          {([
            ["for-you", "For you"],
            ["following", "Following"],
            ["latest", "Latest"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? "feed-switch__tab feed-switch__tab--active" : "feed-switch__tab"}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="feed-composer" aria-label="Create a post">
        <button className="feed-composer__avatar" type="button" aria-label="Create a post" onClick={() => setComposerOpen(true)}>SD</button>
        <div className="feed-composer__main">
          <button className="feed-composer__prompt" type="button" onClick={() => setComposerOpen(true)}>
            Share news, analysis or a thought…
          </button>
          <div className="feed-composer__tools">
            <button type="button" onClick={() => setComposerOpen(true)}><ImageIcon size={14} /> Media</button>
            <button type="button" onClick={() => setComposerOpen(true)}><Link2 size={14} /> Link</button>
            <button type="button" onClick={() => setComposerOpen(true)}><DollarSign size={14} /> Market</button>
          </div>
        </div>
        <button className="feed-composer__submit" type="button" onClick={() => setComposerOpen(true)}>Post</button>
      </section>

      <section className="feed-market-pulse" aria-label="Market pulse">
        <header><span><i /> Market pulse</span><small>Live</small></header>
        <div>
          {marketPulse.map((item) => (
            <article key={item.symbol}>
              <span>{item.symbol}</span>
              <strong>{item.value}</strong>
              <em className={item.positive ? "positive" : "negative"}>{item.change}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="feed-stream" aria-label="News feed">
        {publishedPosts.map((post, index) => (
          <article className="feed-story feed-story--user" key={`${post}-${index}`}>
            <div className="feed-story__body">
              <header className="feed-author">
                <span className="feed-avatar feed-avatar--me">SD</span>
                <div><strong>Suman Dey</strong><small>@sumandey · now</small></div>
                <button type="button" aria-label="More options"><MoreHorizontal size={17} /></button>
              </header>
              <div className="feed-story__copy"><p>{post}</p></div>
              <div className="feed-actions">
                <ActionButton label="Comment"><MessageCircle size={16} /><span>0</span></ActionButton>
                <ActionButton label="Repost"><Repeat2 size={16} /><span>0</span></ActionButton>
                <ActionButton label="Like"><Heart size={16} /><span>0</span></ActionButton>
                <ActionButton label="Save"><Bookmark size={16} /></ActionButton>
                <ActionButton label="Share"><Share2 size={16} /></ActionButton>
              </div>
            </div>
          </article>
        ))}

      </section>

      {composerOpen && (
        <div className="feed-modal" role="presentation">
          <button className="feed-modal__backdrop" type="button" aria-label="Close composer" onClick={() => setComposerOpen(false)} />
          <section className="feed-modal__card" role="dialog" aria-modal="true" aria-labelledby="feed-composer-title">
            <header><h2 id="feed-composer-title">Create a post</h2><button type="button" aria-label="Close" onClick={() => setComposerOpen(false)}><X size={20} /></button></header>
            <div className="feed-modal__author"><span className="feed-avatar feed-avatar--me">SD</span><div><strong>Suman Dey</strong><small>Everyone can reply</small></div></div>
            <textarea autoFocus maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share news, analysis or a thought…" />
            <footer><span>{draft.length} / 500</span><button type="button" disabled={!draft.trim()} onClick={publishPost}>Post</button></footer>
          </section>
        </div>
      )}
    </main>
  );
}
