import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth Module (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/auth/register (POST)', () => {
    it('should register a new user successfully', () => {
      const registerDto = {
        email: `test${Date.now()}@fintech.com`,
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'User',
      };

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(registerDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
          expect(res.body.user.email).toBe(registerDto.email);
          expect(res.body.user).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test1234',
        })
        .expect(400);
    });

    it('should fail with weak password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'test@fintech.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('/api/auth/login (POST)', () => {
    it('should login successfully with valid credentials', async () => {
      const email = `test${Date.now()}@fintech.com`;
      const password = 'Test1234';

      // Register user first
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ email, password, firstName: 'Test', lastName: 'Login' })
        .expect(201);

      // Then login
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body).toHaveProperty('token');
        });
    });

    it('should fail with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@fintech.com',
          password: 'WrongPassword123',
        })
        .expect(401);
    });
  });
});
