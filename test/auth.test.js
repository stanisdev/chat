'use strict';

const getServer = require('../src/app');
const request = require("supertest");
let server;

describe('Auth', () => {
  beforeAll(async () => {
    server = await getServer;
  });

  describe('/login', () => {
    test('Login the user successfully', async () => {
      const credentials = {
        email: 'tim@vmail.ua',
        password: '667Yt'
      };
      const response = await request(server)
        .post('/auth/login')
        .send(credentials);

      expect(response.statusCode).toBe(200);
      expect(typeof response.body.token).toBe('string');
    });
  });
});