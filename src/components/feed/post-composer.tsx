"use client";

import Image from "next/image";
import {
  Crop,
  ChevronDown,
  FileText,
  Globe2,
  ImageIcon,
  Smile,
  Sparkles,
  UserPlus,
  X,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import { ApiClientError, apiRequest } from "@/lib/api";
import type {
  ApiSuccess,
  CloudinarySignature,
  CloudinaryUploadResponse,
  CreatePostInput,
  CropAspect,
  FeedMedia,
} from "@/types/feed";

const CHARACTER_LIMIT = 1000;
const MAX_MEDIA_ITEMS = 4;

type ReplyPermission = "Everyone" | "People you follow" | "People you mention";

type MediaAttachment = {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  altText: string;
  taggedPeople: string[];
  madeWithAi: boolean;
  aspectRatio: number | null;
  cropAspect: CropAspect;
  cropX: number;
  cropY: number;
  zoom: number;
  uploadedMedia?: Omit<FeedMedia, "altText" | "taggedPeople" | "madeWithAi" | "cropAspect" | "cropX" | "cropY" | "zoom">;
  uploadError?: string;
};

export function PostComposer({ onPublish }: { onPublish: (post: CreatePostInput) => Promise<void> }) {
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [replyPermission, setReplyPermission] = useState<ReplyPermission>("Everyone");
  const [replyMenuOpen, setReplyMenuOpen] = useState(false);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const [editingMediaId, setEditingMediaId] = useState<string | null>(null);
  const [mediaDetailsId, setMediaDetailsId] = useState<string | null>(null);
  const [mediaDetailsPanel, setMediaDetailsPanel] = useState<"people" | "alt" | null>(null);
  const [personInput, setPersonInput] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const attachmentsRef = useRef<MediaAttachment[]>([]);
  const uploadRequests = useRef(new Map<string, XMLHttpRequest>());

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => () => {
    uploadRequests.current.forEach((request) => request.abort());
    attachmentsRef.current.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
  }, []);

  useEffect(() => {
    if (!expanded) return;
    textareaRef.current?.focus();
  }, [expanded]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "0px";
    textarea.style.height = `${Math.max(76, textarea.scrollHeight)}px`;
  }, [content, expanded]);

  async function uploadAttachment(attachment: MediaAttachment) {
    try {
      const signatureResponse = await apiRequest<ApiSuccess<{ upload: CloudinarySignature }>>(
        API_ENDPOINTS.FEED.MEDIA_SIGNATURE,
        { method: "POST" },
      );
      const { upload } = signatureResponse.data;
      const body = new FormData();
      body.append("file", attachment.file);
      body.append("api_key", upload.apiKey);
      body.append("timestamp", String(upload.timestamp));
      body.append("signature", upload.signature);
      body.append("public_id", upload.publicId);

      const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
        const request = new XMLHttpRequest();
        uploadRequests.current.set(attachment.id, request);
        request.open("POST", upload.uploadUrl);
        request.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const progress = Math.max(1, Math.min(99, Math.round((event.loaded / event.total) * 100)));
          setAttachments((current) => current.map((item) => item.id === attachment.id ? { ...item, progress } : item));
        };
        request.onload = () => {
          uploadRequests.current.delete(attachment.id);
          try {
            const response = JSON.parse(request.responseText || "{}") as CloudinaryUploadResponse;
            if (request.status >= 200 && request.status < 300) resolve(response);
            else reject(new Error(response.error?.message ?? "Media upload failed"));
          } catch {
            reject(new Error("Media service returned an invalid response"));
          }
        };
        request.onerror = () => { uploadRequests.current.delete(attachment.id); reject(new Error("Media upload failed. Check your connection and try again.")); };
        request.onabort = () => { uploadRequests.current.delete(attachment.id); reject(new DOMException("Upload cancelled", "AbortError")); };
        request.send(body);
      });

      setAttachments((current) => current.map((item) => item.id === attachment.id ? {
        ...item,
        progress: 100,
        uploadError: undefined,
        uploadedMedia: {
          publicId: result.public_id,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          duration: result.duration,
        },
      } : item));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      const message = error instanceof ApiClientError || error instanceof Error ? error.message : "Media upload failed";
      setAttachments((current) => current.map((item) => item.id === attachment.id ? { ...item, progress: 0, uploadError: message } : item));
    }
  }

  function handleMediaSelection(event: ChangeEvent<HTMLInputElement>) {
    const remainingSlots = MAX_MEDIA_ITEMS - attachments.length;
    const files = Array.from(event.target.files ?? []).slice(0, remainingSlots);
    if (files.length === 0) return;

    const nextAttachments = files.map((file) => ({
      id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: 1,
      altText: "",
      taggedPeople: [],
      madeWithAi: false,
      aspectRatio: null,
      cropAspect: "original" as const,
      cropX: 50,
      cropY: 50,
      zoom: 1,
    }));
    setAttachments((current) => [...current, ...nextAttachments]);
    nextAttachments.forEach((attachment) => void uploadAttachment(attachment));
    event.target.value = "";
  }

  function removeAttachment(id: string) {
    uploadRequests.current.get(id)?.abort();
    uploadRequests.current.delete(id);
    setAttachments((current) => {
      const attachment = current.find((item) => item.id === id);
      if (attachment) URL.revokeObjectURL(attachment.previewUrl);
      return current.filter((item) => item.id !== id);
    });
  }

  function resetComposer() {
    uploadRequests.current.forEach((request) => request.abort());
    uploadRequests.current.clear();
    attachments.forEach((attachment) => URL.revokeObjectURL(attachment.previewUrl));
    setAttachments([]);
    setContent("");
    setReplyMenuOpen(false);
    setEditingMediaId(null);
    setMediaDetailsId(null);
    setMediaDetailsPanel(null);
    setPersonInput("");
    setSubmitError("");
    setExpanded(false);
  }

  function updateAttachment(id: string, changes: Partial<MediaAttachment>) {
    setAttachments((current) => current.map((attachment) => (
      attachment.id === id ? { ...attachment, ...changes } : attachment
    )));
  }

  function openMediaDetails(id: string, panel: "people" | "alt") {
    setMediaDetailsId(id);
    setMediaDetailsPanel(panel);
    setPersonInput("");
  }

  function addTaggedPerson(attachment: MediaAttachment) {
    const cleanPerson = personInput.trim().replace(/^@/, "");
    if (!cleanPerson) return;
    if (!attachment.taggedPeople.some((person) => person.toLowerCase() === cleanPerson.toLowerCase())) {
      updateAttachment(attachment.id, { taggedPeople: [...attachment.taggedPeople, cleanPerson] });
    }
    setPersonInput("");
  }

  async function publishPost() {
    const cleanContent = content.trim();
    if ((!cleanContent && attachments.length === 0) || attachments.some((item) => item.progress < 100 || !item.uploadedMedia)) return;
    const finalPayload: CreatePostInput = {
      content: cleanContent,
      replyPermission: replyPermission === "Everyone" ? "EVERYONE" : replyPermission === "People you follow" ? "FOLLOWING" : "MENTIONED",
      media: attachments.map((attachment) => ({
        ...attachment.uploadedMedia!,
        altText: attachment.altText,
        taggedPeople: attachment.taggedPeople,
        madeWithAi: attachment.madeWithAi,
        cropAspect: attachment.cropAspect,
        cropX: attachment.cropX,
        cropY: attachment.cropY,
        zoom: attachment.zoom,
      })),
    };
    console.log("[PostComposer] Final payload:", finalPayload);
    setSubmitError("");
    setIsPublishing(true);
    try {
      await onPublish(finalPayload);
      resetComposer();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "The post could not be published.");
    } finally {
      setIsPublishing(false);
    }
  }

  const canPost = Boolean(content.trim() || attachments.length > 0)
    && attachments.every((attachment) => attachment.progress === 100 && Boolean(attachment.uploadedMedia))
    && !isPublishing;
  const editingAttachment = attachments.find((attachment) => attachment.id === editingMediaId) ?? null;
  const detailsAttachment = attachments.find((attachment) => attachment.id === mediaDetailsId) ?? null;

  return (
    <section className={expanded ? "post-composer post-composer--expanded" : "post-composer"} aria-label="Create a post">
      <button className="post-composer__avatar" type="button" aria-label="Focus post composer" onClick={() => setExpanded(true)}>SD</button>
      <div className="post-composer__body">
        <textarea
          ref={textareaRef}
          className="post-composer__textarea"
          maxLength={CHARACTER_LIMIT}
          rows={1}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onFocus={() => setExpanded(true)}
          placeholder="Share news, analysis or a thought…"
          aria-label="Post content"
        />

        {expanded && (
          <>
            {attachments.length > 0 && (
              <div className={`post-composer__media post-composer__media--${attachments.length}`}>
                {attachments.map((attachment) => (
                  <article
                    className={attachments.length === 1 && attachment.cropAspect === "original"
                      ? "post-composer__media-item post-composer__media-item--natural"
                      : "post-composer__media-item post-composer__media-item--cropped"}
                    key={attachment.id}
                    style={attachments.length === 1
                      ? (attachment.cropAspect === "original" && attachment.aspectRatio
                          ? { aspectRatio: `${attachment.aspectRatio}` }
                          : { aspectRatio: attachment.cropAspect === "original" ? "16 / 9" : attachment.cropAspect })
                      : undefined}
                  >
                    {attachment.file.type.startsWith("video/") ? (
                      <video
                        src={attachment.previewUrl}
                        muted
                        playsInline
                        onLoadedMetadata={(event) => updateAttachment(attachment.id, { aspectRatio: event.currentTarget.videoWidth / event.currentTarget.videoHeight })}
                        style={{ objectPosition: `${attachment.cropX}% ${attachment.cropY}%`, transform: `scale(${attachment.zoom})` }}
                      />
                    ) : (
                      <Image
                        src={attachment.previewUrl}
                        alt={attachment.altText || "Selected post media preview"}
                        fill
                        sizes="(max-width: 760px) 100vw, 680px"
                        unoptimized
                        onLoad={(event) => updateAttachment(attachment.id, { aspectRatio: event.currentTarget.naturalWidth / event.currentTarget.naturalHeight })}
                        style={{ objectPosition: `${attachment.cropX}% ${attachment.cropY}%`, transform: `scale(${attachment.zoom})` }}
                      />
                    )}
                    <button className="post-composer__edit-media" type="button" onClick={() => setEditingMediaId(attachment.id)}><Crop size={14} /> Edit</button>
                    <button className="post-composer__remove-media" type="button" aria-label={`Remove ${attachment.file.name}`} onClick={() => removeAttachment(attachment.id)}><X size={15} /></button>
                    {attachment.progress < 100 && (
                      <div className="post-composer__upload-state">
                        {attachment.uploadError ? (
                          <><strong>!</strong><span>{attachment.uploadError}</span><button type="button" onClick={() => void uploadAttachment(attachment)}>Retry upload</button></>
                        ) : (
                          <><strong>{attachment.progress}%</strong><span>Uploading {attachment.progress}%</span><progress max="100" value={attachment.progress}>{attachment.progress}%</progress></>
                        )}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}

            {attachments.length > 0 && (
              <div className="post-composer__media-info">
                <button type="button" onClick={() => openMediaDetails(attachments[0].id, "people")}><UserPlus size={15} /> Tag people</button>
                <button type="button" onClick={() => openMediaDetails(attachments[0].id, "alt")}><FileText size={15} /> Add description</button>
                <label>
                  <input
                    type="checkbox"
                    checked={attachments[0].madeWithAi}
                    onChange={(event) => updateAttachment(attachments[0].id, { madeWithAi: event.target.checked })}
                  />
                  <Sparkles size={15} /> Made with AI
                </label>
              </div>
            )}

            <div className="post-composer__reply">
              <button type="button" aria-expanded={replyMenuOpen} onClick={() => setReplyMenuOpen((open) => !open)}>
                <Globe2 size={15} /> {replyPermission} can reply <ChevronDown size={14} />
              </button>
              {replyMenuOpen && (
                <div className="post-composer__reply-menu" role="menu">
                  {(["Everyone", "People you follow", "People you mention"] as ReplyPermission[]).map((permission) => (
                    <button type="button" role="menuitem" key={permission} onClick={() => { setReplyPermission(permission); setReplyMenuOpen(false); }}>{permission}</button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <div className="post-composer__footer">
          <div className="post-composer__tools">
            <button type="button" aria-label="Media" onClick={() => { setExpanded(true); mediaInputRef.current?.click(); }} disabled={attachments.length >= MAX_MEDIA_ITEMS}><ImageIcon size={17} /><span>Media</span></button>
            {expanded && <button type="button" aria-label="Add emoji" onClick={() => setContent((current) => `${current}${current ? " " : ""}🙂`)}><Smile size={17} /><span>Emoji</span></button>}
          </div>
          {expanded && <span className={content.length > 900 ? "post-composer__count post-composer__count--near" : "post-composer__count"}>{content.length} / {CHARACTER_LIMIT}</span>}
          <button className="post-composer__submit" type="button" disabled={!canPost} onClick={() => void publishPost()}>{isPublishing ? "Posting…" : "Post"}</button>
        </div>
        {submitError && <p className="post-composer__error" role="alert">{submitError}</p>}
      </div>
      <input ref={mediaInputRef} className="post-composer__file-input" type="file" accept="image/*,video/*" multiple onChange={handleMediaSelection} />

      {editingAttachment && (
        <div className="media-editor" role="dialog" aria-modal="true" aria-labelledby="media-editor-title">
          <div className="media-editor__backdrop" onClick={() => setEditingMediaId(null)} />
          <section className="media-editor__dialog">
            <header>
              <div><span>Media editor</span><h2 id="media-editor-title">Crop media</h2></div>
              <button type="button" aria-label="Close media editor" onClick={() => setEditingMediaId(null)}><X size={18} /></button>
            </header>
            <div className="media-editor__ratios" aria-label="Crop ratio">
              {(["original", "1 / 1", "16 / 9", "4 / 5"] as MediaAttachment["cropAspect"][]).map((ratio) => (
                <button
                  type="button"
                  className={editingAttachment.cropAspect === ratio ? "is-active" : ""}
                  key={ratio}
                  onClick={() => updateAttachment(editingAttachment.id, { cropAspect: ratio })}
                >{ratio === "original" ? "Original" : ratio.replaceAll(" ", "")}</button>
              ))}
            </div>
            <div className="media-editor__stage" style={{ aspectRatio: editingAttachment.cropAspect === "original" ? `${editingAttachment.aspectRatio || 16 / 9}` : editingAttachment.cropAspect }}>
              {editingAttachment.file.type.startsWith("video/") ? (
                <video src={editingAttachment.previewUrl} muted playsInline style={{ objectPosition: `${editingAttachment.cropX}% ${editingAttachment.cropY}%`, transform: `scale(${editingAttachment.zoom})` }} />
              ) : (
                <Image src={editingAttachment.previewUrl} alt={editingAttachment.altText || "Media crop preview"} fill sizes="720px" unoptimized style={{ objectPosition: `${editingAttachment.cropX}% ${editingAttachment.cropY}%`, transform: `scale(${editingAttachment.zoom})` }} />
              )}
            </div>
            <div className="media-editor__controls">
              <label>Zoom <input type="range" min="1" max="2.5" step="0.05" value={editingAttachment.zoom} onChange={(event) => updateAttachment(editingAttachment.id, { zoom: Number(event.target.value) })} /></label>
              <label>Horizontal <input type="range" min="0" max="100" value={editingAttachment.cropX} onChange={(event) => updateAttachment(editingAttachment.id, { cropX: Number(event.target.value) })} /></label>
              <label>Vertical <input type="range" min="0" max="100" value={editingAttachment.cropY} onChange={(event) => updateAttachment(editingAttachment.id, { cropY: Number(event.target.value) })} /></label>
            </div>
            <footer><button type="button" onClick={() => setEditingMediaId(null)}>Save crop</button></footer>
          </section>
        </div>
      )}

      {detailsAttachment && mediaDetailsPanel && (
        <div className="media-details" role="dialog" aria-modal="true" aria-labelledby="media-details-title">
          <div className="media-details__backdrop" onClick={() => setMediaDetailsId(null)} />
          <section className="media-details__dialog">
            <header>
              <div><span>Media details</span><h2 id="media-details-title">{mediaDetailsPanel === "people" ? "Tag people" : "Add a description"}</h2></div>
              <button type="button" aria-label="Close media details" onClick={() => setMediaDetailsId(null)}><X size={18} /></button>
            </header>
            {mediaDetailsPanel === "people" ? (
              <div className="media-details__people">
                <p>Add the people featured in this media.</p>
                <div><span>@</span><input autoFocus value={personInput} onChange={(event) => setPersonInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") addTaggedPerson(detailsAttachment); }} placeholder="Username" /><button type="button" onClick={() => addTaggedPerson(detailsAttachment)}>Add</button></div>
                {detailsAttachment.taggedPeople.length > 0 && <ul>{detailsAttachment.taggedPeople.map((person) => <li key={person}>@{person}<button type="button" aria-label={`Remove ${person}`} onClick={() => updateAttachment(detailsAttachment.id, { taggedPeople: detailsAttachment.taggedPeople.filter((item) => item !== person) })}><X size={12} /></button></li>)}</ul>}
              </div>
            ) : (
              <label className="media-details__alt">Describe this media for people who use screen readers.<textarea autoFocus maxLength={1000} value={detailsAttachment.altText} onChange={(event) => updateAttachment(detailsAttachment.id, { altText: event.target.value })} placeholder="What is shown in this image?" /><span>{detailsAttachment.altText.length} / 1000</span></label>
            )}
            <footer><button type="button" onClick={() => setMediaDetailsId(null)}>Done</button></footer>
          </section>
        </div>
      )}
    </section>
  );
}
