// LINE Messaging API の型定義

export type WebhookEvent =
  | MessageEvent
  | FollowEvent
  | UnfollowEvent
  | JoinEvent
  | LeaveEvent
  | PostbackEvent;

export interface MessageEvent {
  type: 'message';
  replyToken: string;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
  message: TextMessage | ImageMessage | VideoMessage;
}

export interface TextMessage {
  type: 'text';
  id: string;
  text: string;
}

export interface ImageMessage {
  type: 'image';
  id: string;
}

export interface VideoMessage {
  type: 'video';
  id: string;
}

export interface FollowEvent {
  type: 'follow';
  replyToken: string;
  source: {
    type: 'user';
    userId: string;
  };
  timestamp: number;
}

export interface UnfollowEvent {
  type: 'unfollow';
  source: {
    type: 'user';
    userId: string;
  };
  timestamp: number;
}

export interface JoinEvent {
  type: 'join';
  replyToken: string;
  source: {
    type: 'group' | 'room';
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
}

export interface LeaveEvent {
  type: 'leave';
  source: {
    type: 'group' | 'room';
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
}

export interface PostbackEvent {
  type: 'postback';
  replyToken: string;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  timestamp: number;
  postback: {
    data: string;
  };
}

// LINE API リクエスト・レスポンス型
export interface ReplyMessageRequest {
  replyToken: string;
  messages: Message[];
}

export type Message = TextMessagePayload | ImageMessagePayload;

export interface TextMessagePayload {
  type: 'text';
  text: string;
}

export interface ImageMessagePayload {
  type: 'image';
  originalContentUrl: string;
  previewImageUrl: string;
}
