'use string'

class Chat {
  constructor() {
    this.prefix = '/chat';
  }

  /**
   * All user's chats
   */
  ['GET: /']() {}

  /**
   * Messages of specific chat
   */
  ['GET: /:id']() {}

  /**
   * Add new message
   */
  ['POST: /:id']() {}

  /**
   * Create chat
   */
  ['PUT: /']() {}

  /**
   * Delete chat
   */
  ['DELETE: /:id']() {}
}

module.exports = Chat;