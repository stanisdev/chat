'use string'

class Member {
  constructor() {
    this.prefix = '/member';
  }

  /**
   * List of chat's members
   */
  ['GET /:chat_id']() {}

  /**
   * Delete member from chat
   */
  ['DELETE /:chat_id/:user_id']() {}

  /**
   * Add new member(s)
   */
  ['POST /:chat_id']() {}

  /**
   * Info about member
   */
  ['GET /:chat_id/:user_id']() {}
}

module.exports = Member;