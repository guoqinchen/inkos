// IPC Channel Constants

export const IPC_CHANNELS = {
  // Init
  INIT_PROJECT_ROOT: 'init:project-root',
  INIT_GET_PROJECT_ROOT: 'init:get-project-root',

  // Pipeline
  PIPELINE_WRITE: 'pipeline:write',
  PIPELINE_AUDIT: 'pipeline:audit',
  PIPELINE_REVISE: 'pipeline:revise',
  PIPELINE_CANCEL: 'pipeline:cancel',

  // Streaming
  STREAM_CHUNK: 'stream:chunk',
  STREAM_PROGRESS: 'stream:progress',
  STREAM_COMPLETE: 'stream:complete',
  STREAM_ERROR: 'stream:error',

  // Book
  BOOK_LIST: 'book:list',
  BOOK_CREATE: 'book:create',
  BOOK_GET: 'book:get',
  BOOK_DELETE: 'book:delete',

  // Chapter
  CHAPTER_LIST: 'chapter:list',
  CHAPTER_GET: 'chapter:get',
  CHAPTER_APPROVE: 'chapter:approve',

  // Truth Files
  TRUTH_LIST: 'truth:list',
  TRUTH_GET: 'truth:get',
  TRUTH_UPDATE: 'truth:update',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // Daemon
  DAEMON_STATUS: 'daemon:status',
  DAEMON_UP: 'daemon:up',
  DAEMON_DOWN: 'daemon:down',

  // Analytics
  ANALYTICS_GET: 'analytics:get',

  // WebSocket
  WS_CONNECT: 'ws:connect',
} as const;
