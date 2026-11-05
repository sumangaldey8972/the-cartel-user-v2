"use client";

import Image from "next/image";
import { Bookmark, Heart, Maximize2, MessageCircle, MoreHorizontal, Repeat2, Share2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { apiRequest } from "@/lib/api";
import type { ApiSuccess, FeedComment, FeedPost, Paginated } from "@/types/feed";

function renderPostContent(content: string) {
  return content.split(/(#[\p{L}\p{M}\p{N}_]+)/gu).map((part, index) => (
    part.startsWith("#") ? <span className="feed-story__hashtag" key={`${part}-${index}`}>{part}</span> : part
  ));
}

function initials(firstName: string, lastName: string) {
  return `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase();
}

function relativeTime(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1_000));
  if (seconds < 60) return "now";
  if (seconds < 3_600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86_400) return `${Math.floor(seconds / 3_600)}h`;
  return `${Math.floor(seconds / 86_400)}d`;
}

function ActionButton({ label, active = false, disabled = false, onClick, children }: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return <button className={active ? "feed-action feed-action--active" : "feed-action"} type="button" aria-label={label} aria-pressed={active || undefined} disabled={disabled} onClick={onClick}>{children}</button>;
}

function CollapsiblePostContent({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(false);
  const [canExpand, setCanExpand] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const element = contentRef.current;
    if (!element || expanded) return;
    const observer = new ResizeObserver(() => {
      setCanExpand(element.scrollHeight > element.clientHeight + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [content, expanded]);

  return (
    <div className="feed-story__content">
      <p ref={contentRef} className={expanded ? "" : "feed-story__content--collapsed"}>
        {renderPostContent(content)}
        {expanded && canExpand && <button className="feed-story__show-less" type="button" aria-expanded="true" onClick={() => setExpanded(false)}>Show less</button>}
      </p>
      {!expanded && canExpand && <button className="feed-story__show-more" type="button" aria-expanded="false" onClick={() => setExpanded(true)}><span aria-hidden="true">… </span>Show more</button>}
    </div>
  );
}

function PostMedia({ post }: { post: FeedPost }) {
  const [openMedia, setOpenMedia] = useState<FeedPost["media"][number] | null>(null);

  useEffect(() => {
    if (!openMedia) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenMedia(null);
    }
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMedia]);

  if (post.media.length === 0) return null;
  return (
    <>
      <div className={`feed-story__media feed-story__media--${post.media.length}`}>
        {post.media.map((media) => {
          const naturalRatio = media.width && media.height ? media.width / media.height : 16 / 9;
          const cropAspect = media.cropAspect ?? "original";
          const aspectRatio = post.media.length === 1 ? (cropAspect === "original" ? naturalRatio : cropAspect) : undefined;
          const mediaStyle = { objectPosition: `${media.cropX ?? 50}% ${media.cropY ?? 50}%`, transform: `scale(${media.zoom ?? 1})` };
          return (
            <figure key={media.publicId} style={post.media.length === 1 ? { aspectRatio } : undefined}>
              {media.resourceType === "video"
                ? <video controls playsInline src={media.secureUrl} style={mediaStyle} />
                : <Image src={media.secureUrl} alt={media.altText || "Post media"} fill sizes="(max-width: 760px) 100vw, 700px" style={mediaStyle} />}
              {post.media.length === 1 && media.resourceType !== "video" && (
                <button className="feed-story__media-open" type="button" onClick={() => setOpenMedia(media)}>
                  <Maximize2 size={15} />
                  <span>Open full image</span>
                </button>
              )}
              {media.madeWithAi && <figcaption>Made with AI</figcaption>}
            </figure>
          );
        })}
      </div>
      {openMedia && (
        <div className="feed-media-viewer" role="dialog" aria-modal="true" aria-label="Full image preview" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setOpenMedia(null);
        }}>
          <div className="feed-media-viewer__content">
            <button type="button" aria-label="Close full image" onClick={() => setOpenMedia(null)}><X size={20} /></button>
            <div className="feed-media-viewer__image">
              <Image src={openMedia.secureUrl} alt={openMedia.altText || "Post media"} fill sizes="90vw" priority style={{ objectFit: "contain" }} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function FeedPostCard({ post, onUpdate }: { post: FeedPost; onUpdate: (post: FeedPost) => void }) {
  const [liked, setLiked] = useState(post.viewerHasLiked);
  const [shared, setShared] = useState(post.viewerHasShared);
  const [busyAction, setBusyAction] = useState<"like" | "share" | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [interactionError, setInteractionError] = useState("");

  async function toggleLike() {
    if (busyAction) return;
    setBusyAction("like");
    setInteractionError("");
    try {
      const response = await apiRequest<ApiSuccess<{ liked: boolean; likeCount: number }>>(API_ENDPOINTS.FEED.LIKES(post._id), { method: liked ? "DELETE" : "POST" });
      setLiked(response.data.liked);
      onUpdate({ ...post, likeCount: response.data.likeCount, viewerHasLiked: response.data.liked });
    } catch (error) { setInteractionError(error instanceof Error ? error.message : "The like could not be updated."); }
    finally { setBusyAction(null); }
  }

  async function toggleShare() {
    if (busyAction) return;
    setBusyAction("share");
    setInteractionError("");
    try {
      const response = await apiRequest<ApiSuccess<{ shared: boolean; shareCount: number }>>(API_ENDPOINTS.FEED.SHARES(post._id), { method: shared ? "DELETE" : "POST" });
      setShared(response.data.shared);
      onUpdate({ ...post, shareCount: response.data.shareCount, viewerHasShared: response.data.shared });
    } catch (error) { setInteractionError(error instanceof Error ? error.message : "The repost could not be updated."); }
    finally { setBusyAction(null); }
  }

  async function openComments() {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (!nextOpen || comments.length > 0) return;
    setCommentsLoading(true);
    setCommentError("");
    try {
      const response = await apiRequest<ApiSuccess<Paginated<FeedComment>>>(`${API_ENDPOINTS.FEED.COMMENTS(post._id)}?page=1&limit=20`);
      setComments(response.data.docs);
    } catch (error) { setCommentError(error instanceof Error ? error.message : "Comments could not be loaded."); }
    finally { setCommentsLoading(false); }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    setCommentError("");
    try {
      const response = await apiRequest<ApiSuccess<{ comment: FeedComment }>>(API_ENDPOINTS.FEED.COMMENTS(post._id), { method: "POST", body: JSON.stringify({ content }) });
      setComments((current) => [response.data.comment, ...current]);
      setCommentText("");
      onUpdate({ ...post, commentCount: post.commentCount + 1 });
    } catch (error) { setCommentError(error instanceof Error ? error.message : "The comment could not be published."); }
  }

  async function shareExternally() {
    const url = `${window.location.origin}/?post=${post._id}`;
    if (navigator.share) await navigator.share({ title: "The Cartel", text: post.content, url });
    else await navigator.clipboard.writeText(url);
  }

  return (
    <article className="feed-story feed-story--user">
      <div className="feed-story__body">
        <header className="feed-author">
          <span className="feed-avatar feed-avatar--me">{initials(post.author.firstName, post.author.lastName)}</span>
          <div><strong>{post.author.firstName} {post.author.lastName}</strong><small>@{post.author.username} · {relativeTime(post.createdAt)}</small></div>
          <button type="button" aria-label="More options"><MoreHorizontal size={17} /></button>
        </header>
        <div className="feed-story__copy">{post.content && <CollapsiblePostContent content={post.content} />}<PostMedia post={post} /></div>
        <div className="feed-actions">
          <ActionButton label="Comment" active={commentsOpen} onClick={() => void openComments()}><MessageCircle size={16} /><span>{post.commentCount}</span></ActionButton>
          <ActionButton label="Repost" active={shared} disabled={busyAction === "share"} onClick={() => void toggleShare()}><Repeat2 size={16} /><span>{post.shareCount}</span></ActionButton>
          <ActionButton label="Like" active={liked} disabled={busyAction === "like"} onClick={() => void toggleLike()}><Heart size={16} /><span>{post.likeCount}</span></ActionButton>
          <ActionButton label="Save"><Bookmark size={16} /></ActionButton>
          <ActionButton label="Share" onClick={() => void shareExternally()}><Share2 size={16} /></ActionButton>
        </div>
        {interactionError && <p className="feed-story__interaction-error" role="alert">{interactionError}</p>}
        {commentsOpen && (
          <section className="feed-comments-panel" aria-label="Comments">
            <form onSubmit={(event) => void submitComment(event)}><input value={commentText} onChange={(event) => setCommentText(event.target.value)} maxLength={1000} placeholder="Write a comment…" aria-label="Comment" /><button type="submit" disabled={!commentText.trim()}>Reply</button></form>
            {commentError && <p className="feed-comments-panel__error" role="alert">{commentError}</p>}
            {commentsLoading ? <p>Loading comments…</p> : comments.map((comment) => (
              <article key={comment._id}><span className="feed-avatar feed-avatar--small">{initials(comment.author.firstName, comment.author.lastName)}</span><div><strong>{comment.author.firstName} {comment.author.lastName}</strong><small>@{comment.author.username} · {relativeTime(comment.createdAt)}</small><p>{comment.content}</p></div></article>
            ))}
          </section>
        )}
      </div>
    </article>
  );
}
