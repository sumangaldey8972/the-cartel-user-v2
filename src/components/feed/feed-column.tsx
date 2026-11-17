"use client";

import { useCallback, useEffect, useState } from "react";
import { FeedPostCard } from "@/components/feed/feed-post-card";
import { PostComposer } from "@/components/feed/post-composer";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { apiRequest } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { ApiSuccess, CreatePostInput, FeedPost, FeedRealtimeEvent, Paginated } from "@/types/feed";

type FeedFilter = "for-you" | "following" | "latest";

const marketPulse = [
  { symbol: "BTC", value: "$67,482", change: "+1.48%", positive: true },
  { symbol: "ETH", value: "$3,712", change: "+0.92%", positive: true },
  { symbol: "GOLD", value: "$2,341", change: "+0.62%", positive: true },
  { symbol: "EUR/USD", value: "1.0872", change: "+0.24%", positive: true },
  { symbol: "NASDAQ", value: "18,614", change: "−0.18%", positive: false },
];

export function FeedColumn() {
  const [filter, setFilter] = useState<FeedFilter>("for-you");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [realtimeEvent, setRealtimeEvent] = useState<FeedRealtimeEvent | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void apiRequest<ApiSuccess<{ user: { id: string } }>>(API_ENDPOINTS.AUTH.CURRENT_USER)
      .then((response) => { if (active) setCurrentUserId(response.data.user.id); })
      .catch(() => { if (active) setCurrentUserId(null); });
    return () => { active = false; };
  }, []);

  const loadPosts = useCallback(async (activeFilter: FeedFilter) => {
    setLoading(true);
    setFeedError("");
    try {
      const sort = activeFilter === "for-you" ? "popular" : "latest";
      const response = await apiRequest<ApiSuccess<Paginated<FeedPost>>>(`${API_ENDPOINTS.FEED.POSTS}?page=1&limit=20&sort=${sort}`);
      setPosts(response.data.docs);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "The feed could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPosts(filter), 0);
    return () => window.clearTimeout(timer);
  }, [filter, loadPosts]);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("feed")
      .on("broadcast", { event: "post.created" }, ({ payload }) => {
        const event = { event: "post.created", ...payload } as Extract<FeedRealtimeEvent, { event: "post.created" }>;
        const createdPost = { ...event.post, viewerHasLiked: false, viewerHasShared: false };
        setPosts((current) => current.some((post) => post._id === createdPost._id) ? current : [createdPost, ...current]);
      })
      .on("broadcast", { event: "post.updated" }, ({ payload }) => {
        const event = { event: "post.updated", ...payload } as Extract<FeedRealtimeEvent, { event: "post.updated" }>;
        setPosts((current) => current.map((post) => post._id === event.post._id ? event.post : post));
      })
      .on("broadcast", { event: "post.deleted" }, ({ payload }) => {
        const event = { event: "post.deleted", ...payload } as Extract<FeedRealtimeEvent, { event: "post.deleted" }>;
        setPosts((current) => current.filter((post) => post._id !== event.postId));
      })
      .on("broadcast", { event: "comment.created" }, ({ payload }) => {
        const event = { event: "comment.created", ...payload } as Extract<FeedRealtimeEvent, { event: "comment.created" }>;
        setRealtimeEvent(event);
        setPosts((current) => current.map((post) => post._id === event.postId ? { ...post, commentCount: event.commentCount ?? post.commentCount + 1 } : post));
      })
      .on("broadcast", { event: "comment.updated" }, ({ payload }) => setRealtimeEvent({ event: "comment.updated", ...payload } as FeedRealtimeEvent))
      .on("broadcast", { event: "comment.deleted" }, ({ payload }) => {
        const event = { event: "comment.deleted", ...payload } as Extract<FeedRealtimeEvent, { event: "comment.deleted" }>;
        setRealtimeEvent(event);
        setPosts((current) => current.map((post) => post._id === event.postId ? { ...post, commentCount: event.commentCount ?? Math.max(0, post.commentCount - 1) } : post));
      })
      .on("broadcast", { event: "comment.liked" }, ({ payload }) => setRealtimeEvent({ event: "comment.liked", ...payload } as FeedRealtimeEvent))
      .on("broadcast", { event: "comment.unliked" }, ({ payload }) => setRealtimeEvent({ event: "comment.unliked", ...payload } as FeedRealtimeEvent))
      .on("broadcast", { event: "post.liked" }, ({ payload }) => {
        const event = { event: "post.liked", ...payload } as Extract<FeedRealtimeEvent, { event: "post.liked" }>;
        setRealtimeEvent(event);
        setPosts((current) => current.map((post) => post._id === event.postId ? { ...post, likeCount: event.likeCount } : post));
      })
      .on("broadcast", { event: "post.unliked" }, ({ payload }) => {
        const event = { event: "post.unliked", ...payload } as Extract<FeedRealtimeEvent, { event: "post.unliked" }>;
        setRealtimeEvent(event);
        setPosts((current) => current.map((post) => post._id === event.postId ? { ...post, likeCount: event.likeCount } : post));
      })
      .subscribe((status, error) => {
        if (status === "SUBSCRIBED") {
          console.info("[Supabase] Feed realtime channel subscribed");
          return;
        }
        console.warn("[Supabase] Feed realtime channel status", { status, error });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  async function publishPost(payload: CreatePostInput) {
    const response = await apiRequest<ApiSuccess<{ post: FeedPost }>>(API_ENDPOINTS.FEED.POSTS, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    const createdPost = { ...response.data.post, viewerHasLiked: false, viewerHasShared: false };
    setPosts((current) => [createdPost, ...current.filter((post) => post._id !== createdPost._id)]);
    setFilter("latest");
  }

  function updatePost(updatedPost: FeedPost) {
    setPosts((current) => current.map((post) => post._id === updatedPost._id ? updatedPost : post));
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

      <PostComposer onPublish={publishPost} />

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
        {loading && <p className="feed-stream__status">Loading feed…</p>}
        {feedError && <div className="feed-stream__status feed-stream__status--error" role="alert"><span>{feedError}</span><button type="button" onClick={() => void loadPosts(filter)}>Try again</button></div>}
        {!loading && !feedError && posts.length === 0 && <p className="feed-stream__status">No posts yet. Start the conversation.</p>}
        {posts.map((post) => <FeedPostCard key={post._id} post={post} onUpdate={updatePost} onDelete={() => setPosts((current) => current.filter((item) => item._id !== post._id))} realtimeEvent={realtimeEvent} currentUserId={currentUserId} />)}
      </section>
    </main>
  );
}
