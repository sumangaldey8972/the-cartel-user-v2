export type ReplyPermission = "EVERYONE" | "FOLLOWING" | "MENTIONED";
export type CropAspect = "original" | "1 / 1" | "16 / 9" | "4 / 5";

export type FeedAuthor = {
  _id: string;
  firstName: string;
  lastName: string;
  username: string;
};

export type FeedMedia = {
  publicId: string;
  secureUrl: string;
  resourceType: "image" | "video";
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  duration?: number;
  altText: string;
  taggedPeople: string[];
  madeWithAi: boolean;
  cropAspect: CropAspect;
  cropX: number;
  cropY: number;
  zoom: number;
};

export type CreatePostInput = {
  content: string;
  replyPermission: ReplyPermission;
  media: FeedMedia[];
};

export type FeedPost = CreatePostInput & {
  _id: string;
  author: FeedAuthor;
  tags: string[];
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewerHasLiked: boolean;
  viewerHasShared: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedComment = {
  _id: string;
  post: string;
  author: FeedAuthor;
  parentComment: string | null;
  content: string;
  likeCount: number;
  viewerHasLiked: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FeedRealtimeEvent =
  | { event: "post.created"; post: FeedPost }
  | { event: "post.updated"; post: FeedPost }
  | { event: "post.deleted"; postId: string }
  | { event: "comment.created"; postId: string; comment: FeedComment; commentCount: number }
  | { event: "comment.updated"; postId: string; comment: FeedComment }
  | { event: "comment.deleted"; postId: string; commentId: string; commentCount: number }
  | { event: "comment.liked"; postId: string; commentId: string; likeCount: number; userId: string }
  | { event: "comment.unliked"; postId: string; commentId: string; likeCount: number; userId: string }
  | { event: "post.liked"; postId: string; likeCount: number; userId: string }
  | { event: "post.unliked"; postId: string; likeCount: number; userId: string };

export type Paginated<T> = {
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type ApiSuccess<T> = { success: true; message?: string; data: T };

export type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
  uploadUrl: string;
};

export type CloudinaryUploadResponse = {
  public_id: string;
  secure_url: string;
  resource_type: "image" | "video";
  format?: string;
  width?: number;
  height?: number;
  bytes?: number;
  duration?: number;
  error?: { message?: string };
};
