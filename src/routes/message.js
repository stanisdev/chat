'use string'

class Message {
  constructor() {
    this.prefix = '/message';
  }

  /**
   * Edit message
   */
  ['POST: /:id']() {}

  /**
   * Update status of messages
   */
  ['GET: /:ids']() {}
}

module.exports = Message;