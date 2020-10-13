'use strict';

const getServer = require('../src/app');
const request = require("supertest");

let server;

describe('Auth', () => {
  beforeAll(async () => {
    server = await getServer;
  });

  describe('/login', () => {
    test('login the user successfully', async () => {
      const credentials = {
        email: 'tim@mail.ua',
        password: '667Yt'
      };
      const response = await request(server)
        .post('/auth/login')
        .send(credentials);

      expect(response.statusCode).toBe(200);
      expect(typeof response.body.token).toBe('string');
    });

    test('restrict to login user if wrong email was passed', async () => {
      const credentials = {
        email: 'tim@mail.uj',
        password: '667Yt'
      };
      const response = await request(server)
        .post('/auth/login')
        .send(credentials);

      expect(response.statusCode).toBe(400);
    });

    test('restrict to login user if wrong password was passed', async () => {
      const credentials = {
        email: 'tim@mail.ua',
        password: '667Yt*'
      };
      const response = await request(server)
        .post('/auth/login')
        .send(credentials);

      expect(response.statusCode).toBe(400);
    });

    test('get an error if "email" field is not present in the body', async () => {
      const credentials = {
        password: '667Yt'
      };
      const response = await request(server)
        .post('/auth/login')
        .send(credentials);

      expect(response.statusCode).toBe(400);
    });
  });
});