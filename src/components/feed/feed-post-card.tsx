"use client";

import Image from "next/image";
import { Bookmark, Heart, Maximize2, MessageCircle, MoreHorizontal, Pencil, Repeat2, Share2, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { apiRequest } from "@/lib/api";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ApiSuccess, FeedComment, FeedPost, FeedRealtimeEvent, Paginated } from "@/types/feed";

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

function normalizeComment(comment: FeedComment): FeedComment {
  const parentComment = comment.parentComment as unknown;
  const parentCommentId = typeof parentComment === "string"
    ? parentComment
    : parentComment && typeof parentComment === "object" && "_id" in parentComment
      ? String((parentComment as { _id: unknown })._id)
      : parentComment
        ? String(parentComment)
        : null;
  return { ...comment, parentComment: parentCommentId };
}

function upsertComment(current: FeedComment[], incoming: FeedComment) {
  const comment = normalizeComment(incoming);
  const existingIndex = current.findIndex((item) => item._id === comment._id);
  if (existingIndex === -1) return [comment, ...current];
  return current.map((item, index) => index === existingIndex ? { ...item, ...comment } : item);
}

function flattenReplies(parentId: string, comments: FeedComment[]): FeedComment[] {
  return comments
    .filter((comment) => comment.parentComment === parentId)
    .flatMap((comment) => [comment, ...flattenReplies(comment._id, comments)]);
}

function CommentSkeleton() {
  return <div className="feed-comment-skeleton" aria-hidden="true"><span className="feed-comment-skeleton__avatar" /><div><span className="feed-comment-skeleton__line feed-comment-skeleton__line--name" /><span className="feed-comment-skeleton__line feed-comment-skeleton__line--copy" /><span className="feed-comment-skeleton__line feed-comment-skeleton__line--action" /></div></div>;
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

function CommentItem({
  comment,
  replies,
  onReply,
  onLike,
  currentUserId,
  onEdit,
  onDelete,
  likeBusy,
}: {
  comment: FeedComment;
  replies: FeedComment[];
  onReply: (parentCommentId: string, content: string) => Promise<void>;
  onLike: (comment: FeedComment) => Promise<void>;
  currentUserId: string | null;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  likeBusy: boolean;
}) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [editBusy, setEditBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = currentUserId === comment.author._id;

  async function submitReply(event: FormEvent) {
    event.preventDefault();
    const content = replyText.trim();
    if (!content || replyBusy) return;
    setReplyBusy(true);
    try {
      await onReply(comment._id, content);
      setReplyText("");
      setReplyOpen(false);
    } finally {
      setReplyBusy(false);
    }
  }

  async function submitEdit(event: FormEvent) {
    event.preventDefault();
    const content = editText.trim();
    if (!content || editBusy) return;
    setEditBusy(true);
    try {
      await onEdit(comment._id, content);
      setEditOpen(false);
    } finally {
      setEditBusy(false);
    }
  }

  return (
    <article className="feed-comment" data-comment-id={comment._id}>
      <span className="feed-avatar feed-avatar--small">{initials(comment.author.firstName, comment.author.lastName)}</span>
      <div className="feed-comment__body">
        <div className="feed-comment__meta"><strong>{comment.author.firstName} {comment.author.lastName}</strong><small>· @{comment.author.username} · {relativeTime(comment.createdAt)}</small></div>
        {editOpen ? (
          <form className="feed-comment__edit-form" onSubmit={(event) => void submitEdit(event)}>
            <textarea value={editText} onChange={(event) => setEditText(event.target.value)} maxLength={1000} aria-label="Edit comment" autoFocus />
            <div><button type="button" onClick={() => { setEditText(comment.content); setEditOpen(false); }}>Cancel</button><button type="submit" disabled={!editText.trim() || editBusy}>{editBusy ? "Saving…" : "Save"}</button></div>
          </form>
        ) : <p>{comment.content}</p>}
        <div className="feed-comment__actions">
          <button type="button" onClick={() => setReplyOpen((open) => !open)}>{replyOpen ? "Cancel" : "Reply"}</button>
          <button type="button" className={comment.viewerHasLiked ? "feed-comment__like feed-comment__like--active" : "feed-comment__like"} aria-pressed={comment.viewerHasLiked} disabled={likeBusy} onClick={() => void onLike(comment)}>
            <Heart size={13} fill={comment.viewerHasLiked ? "currentColor" : "none"} /> {comment.likeCount}
          </button>
          {isOwner && !editOpen && <div className="feed-comment__menu"><button className="feed-comment__menu-trigger" type="button" aria-label="Comment options" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><MoreHorizontal size={14} /></button>{menuOpen && <div className="feed-comment__menu-popover" role="menu"><button type="button" role="menuitem" onClick={() => { setEditText(comment.content); setEditOpen(true); setMenuOpen(false); }}><Pencil size={12} /> Edit</button><button type="button" role="menuitem" onClick={() => { setMenuOpen(false); void onDelete(comment._id); }}><Trash2 size={12} /> Delete</button></div>}</div>}
        </div>
        {replyOpen && (
          <form className="feed-comment__reply-form" onSubmit={(event) => void submitReply(event)}>
            <input value={replyText} onChange={(event) => setReplyText(event.target.value)} maxLength={1000} placeholder={`Reply to ${comment.author.firstName}…`} aria-label={`Reply to ${comment.author.firstName}`} autoFocus />
            <button type="submit" disabled={!replyText.trim() || replyBusy}>{replyBusy ? "Posting…" : "Reply"}</button>
          </form>
        )}
        {replies.length > 0 && <div className="feed-comment__replies">{replies.map((reply) => <CommentItem key={reply._id} comment={reply} replies={[]} onReply={onReply} onLike={onLike} currentUserId={currentUserId} onEdit={onEdit} onDelete={onDelete} likeBusy={likeBusy} />)}</div>}
      </div>
    </article>
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

export function FeedPostCard({ post, onUpdate, onDelete, realtimeEvent, currentUserId }: { post: FeedPost; onUpdate: (post: FeedPost) => void; onDelete: () => void; realtimeEvent: FeedRealtimeEvent | null; currentUserId: string | null }) {
  const [liked, setLiked] = useState(post.viewerHasLiked);
  const [shared, setShared] = useState(post.viewerHasShared);
  const [busyAction, setBusyAction] = useState<"like" | "share" | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [commentLikeBusy, setCommentLikeBusy] = useState<string | null>(null);
  const [interactionError, setInteractionError] = useState("");
  const [postMenuOpen, setPostMenuOpen] = useState(false);
  const [postEditOpen, setPostEditOpen] = useState(false);
  const [postEditText, setPostEditText] = useState(post.content);
  const [postEditBusy, setPostEditBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ type: "post" | "comment"; id?: string } | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const isPostOwner = currentUserId === post.author._id;

  useEffect(() => setLiked(post.viewerHasLiked), [post.viewerHasLiked]);

  useEffect(() => {
    if (!realtimeEvent || !("postId" in realtimeEvent) || realtimeEvent.postId !== post._id) return;
    if (realtimeEvent.event === "comment.created") {
      const createdComment = normalizeComment({ ...realtimeEvent.comment, likeCount: realtimeEvent.comment.likeCount ?? 0, viewerHasLiked: false });
      setComments((current) => upsertComment(current, createdComment));
    } else if (realtimeEvent.event === "comment.updated") {
      setComments((current) => upsertComment(current, realtimeEvent.comment));
    } else if (realtimeEvent.event === "comment.deleted") {
      setComments((current) => current.filter((comment) => comment._id !== realtimeEvent.commentId));
    } else if (realtimeEvent.event === "comment.liked" || realtimeEvent.event === "comment.unliked") {
      setComments((current) => current.map((comment) => comment._id === realtimeEvent.commentId ? { ...comment, likeCount: realtimeEvent.likeCount } : comment));
    }
  }, [post._id, realtimeEvent]);

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
      setComments(() => response.data.docs.map(normalizeComment).reduce<FeedComment[]>((current, comment) => upsertComment(current, comment), []));
      onUpdate({ ...post, commentCount: response.data.totalDocs });
    } catch (error) { setCommentError(error instanceof Error ? error.message : "Comments could not be loaded."); }
    finally { setCommentsLoading(false); }
  }

  async function publishComment(content: string, parentCommentId?: string) {
    if (!content) return;
    setCommentError("");
    try {
      const response = await apiRequest<ApiSuccess<{ comment: FeedComment }>>(API_ENDPOINTS.FEED.COMMENTS(post._id), { method: "POST", body: JSON.stringify({ content, ...(parentCommentId ? { parentCommentId } : {}) }) });
      const createdComment = normalizeComment({ ...response.data.comment, likeCount: response.data.comment.likeCount ?? 0, viewerHasLiked: false });
      setComments((current) => upsertComment(current, createdComment));
      onUpdate({ ...post, commentCount: post.commentCount + 1 });
    } catch (error) { setCommentError(error instanceof Error ? error.message : "The comment could not be published."); }
  }

  async function submitComment(event: FormEvent) {
    event.preventDefault();
    const content = commentText.trim();
    if (!content) return;
    await publishComment(content);
    setCommentText("");
  }

  async function toggleCommentLike(comment: FeedComment) {
    if (commentLikeBusy) return;
    setCommentLikeBusy(comment._id);
    try {
      const response = await apiRequest<ApiSuccess<{ liked: boolean; likeCount: number }>>(API_ENDPOINTS.FEED.COMMENT_LIKES(comment._id), { method: comment.viewerHasLiked ? "DELETE" : "POST" });
      setComments((current) => current.map((item) => item._id === comment._id ? { ...item, viewerHasLiked: response.data.liked, likeCount: response.data.likeCount } : item));
    } catch (error) { setCommentError(error instanceof Error ? error.message : "The comment like could not be updated."); }
    finally { setCommentLikeBusy(null); }
  }

  async function updateComment(commentId: string, content: string) {
    const response = await apiRequest<ApiSuccess<{ comment: FeedComment }>>(API_ENDPOINTS.FEED.COMMENT(commentId), { method: "PATCH", body: JSON.stringify({ content }) });
    setComments((current) => current.map((item) => item._id === commentId ? normalizeComment({ ...item, ...response.data.comment }) : item));
  }

  async function deleteComment(commentId: string) {
    setConfirmTarget({ type: "comment", id: commentId });
  }

  async function savePostEdit(event: FormEvent) {
    event.preventDefault();
    const content = postEditText.trim();
    if (!content || postEditBusy) return;
    setPostEditBusy(true);
    try {
      const response = await apiRequest<ApiSuccess<{ post: FeedPost }>>(API_ENDPOINTS.FEED.POST(post._id), { method: "PATCH", body: JSON.stringify({ content }) });
      onUpdate(response.data.post);
      setPostEditOpen(false);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "The post could not be updated.");
    } finally {
      setPostEditBusy(false);
    }
  }

  async function deletePost() {
    setConfirmTarget({ type: "post" });
  }

  async function confirmDelete() {
    if (!confirmTarget) return;
    setDeleteBusy(true);
    try {
      if (confirmTarget.type === "post") {
        await apiRequest(API_ENDPOINTS.FEED.POST(post._id), { method: "DELETE" });
        onDelete();
      } else if (confirmTarget.id) {
        await apiRequest(API_ENDPOINTS.FEED.COMMENT(confirmTarget.id), { method: "DELETE" });
        setComments((current) => current.filter((item) => item._id !== confirmTarget.id));
        onUpdate({ ...post, commentCount: Math.max(0, post.commentCount - 1) });
      }
      setConfirmTarget(null);
    } catch (error) {
      setInteractionError(error instanceof Error ? error.message : "The post could not be deleted.");
    }
    finally { setDeleteBusy(false); }
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
          {isPostOwner && <div className="feed-story__menu"><button className="feed-story__menu-trigger" type="button" aria-label="Post options" aria-expanded={postMenuOpen} onClick={() => setPostMenuOpen((open) => !open)}><MoreHorizontal size={17} /></button>{postMenuOpen && <div className="feed-story__menu-popover" role="menu"><button type="button" role="menuitem" onClick={() => { setPostEditText(post.content); setPostEditOpen(true); setPostMenuOpen(false); }}><Pencil size={13} /> Edit</button><button type="button" role="menuitem" onClick={() => { setPostMenuOpen(false); void deletePost(); }}><Trash2 size={13} /> Delete</button></div>}</div>}
        </header>
        <div className="feed-story__copy">{postEditOpen ? <form className="feed-story__edit-form" onSubmit={(event) => void savePostEdit(event)}><textarea value={postEditText} onChange={(event) => setPostEditText(event.target.value)} maxLength={1000} aria-label="Edit post" autoFocus /><div><button type="button" onClick={() => { setPostEditText(post.content); setPostEditOpen(false); }}>Cancel</button><button type="submit" disabled={!postEditText.trim() || postEditBusy}>{postEditBusy ? "Saving…" : "Save"}</button></div></form> : <>{post.content && <CollapsiblePostContent content={post.content} />}<PostMedia post={post} /></>}</div>
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
            {commentsLoading ? <div className="feed-comments-skeleton" role="status" aria-label="Loading comments"><CommentSkeleton /><CommentSkeleton /><CommentSkeleton /></div> : comments.filter((comment) => !comment.parentComment).map((comment) => (
              <CommentItem key={comment._id} comment={comment} replies={flattenReplies(comment._id, comments)} onReply={(parentCommentId, content) => publishComment(content, parentCommentId)} onLike={toggleCommentLike} currentUserId={currentUserId} onEdit={updateComment} onDelete={deleteComment} likeBusy={commentLikeBusy === comment._id} />
            ))}
          </section>
        )}
        {confirmTarget && <ConfirmDialog title={confirmTarget.type === "post" ? "Delete this post?" : "Delete this comment?"} message="This action cannot be undone." busy={deleteBusy} onCancel={() => setConfirmTarget(null)} onConfirm={() => void confirmDelete()} />}
      </div>
    </article>
  );
}
