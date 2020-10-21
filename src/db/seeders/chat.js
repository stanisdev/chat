'use strict';

const chats = [
  {
    _id: '1',
    type: 0, // Dialog
    members: [
      {
        user_id: '1',
        name: 'Tim',
        is_deleted: false
      },
      {
        user_id: '2',
        name: 'Dina',
        is_deleted: false
      }
    ]
  },
  {
    _id: '2',
    type: 1, // Group chat
    members: [
      {
        user_id: '1',
        name: 'Tim',
        status: 1
      },
      {
        user_id: '2',
        name: 'Dina',
        status: 0
      }
    ]
  }
];

module.exports = chats;
