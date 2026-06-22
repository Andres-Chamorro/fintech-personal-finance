import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Budgets Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let categoryId: string;

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

    // Register and login
    const email = `test-budgets-${Date.now()}@fintech.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'Budgets',
      });

    authToken = registerResponse.body.token;

    // Get a category
    const categoriesResponse = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);

    categoryId = categoriesResponse.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/budgets (POST)', () => {
    it('should create a budget successfully', () => {
      const currentDate = new Date();
      const createDto = {
        amount: 500000,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        categoryId: categoryId,
      };

      return request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(parseFloat(res.body.amount)).toBe(createDto.amount);
          expect(res.body.month).toBe(createDto.month);
          expect(res.body.year).toBe(createDto.year);
          expect(res.body.categoryId).toBe(categoryId);
        });
    });

    it('should reject duplicate budgets', async () => {
      const currentDate = new Date();
      const createDto = {
        amount: 300000,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        categoryId: categoryId,
      };

      // Try to create the same budget twice (first one already created in previous test)
      return request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Ya existe un presupuesto');
        });
    });

    it('should reject past months', () => {
      const currentDate = new Date();
      const pastMonth = currentDate.getMonth() === 0 ? 12 : currentDate.getMonth();
      const pastYear =
        currentDate.getMonth() === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();

      return request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 400000,
          month: pastMonth,
          year: pastYear,
          categoryId: categoryId,
        })
        .expect(400)
        .expect((res) => {
          const msg = Array.isArray(res.body.message) ? res.body.message.join(' ') : res.body.message;
          expect(msg).toContain('anteriores');
        });
    });

    it('should reject amount less than minimum', () => {
      const currentDate = new Date();
      return request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500, // Less than 1000
          month: currentDate.getMonth() + 2,
          year: currentDate.getFullYear(),
          categoryId: categoryId,
        })
        .expect(400);
    });

    it('should reject invalid month', () => {
      return request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 500000,
          month: 13, // Invalid month
          year: 2026,
          categoryId: categoryId,
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer()).post('/api/budgets').send({}).expect(401);
    });
  });

  describe('/api/budgets (GET)', () => {
    it('should get all budgets with alerts', () => {
      return request(app.getHttpServer())
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('id');
            expect(res.body[0]).toHaveProperty('amount');
            expect(res.body[0]).toHaveProperty('spent');
            expect(res.body[0]).toHaveProperty('remaining');
            expect(res.body[0]).toHaveProperty('percentage');
            expect(res.body[0]).toHaveProperty('alerts');
            expect(res.body[0]).toHaveProperty('category');
          }
        });
    });

    it('should filter by month and year', () => {
      const currentDate = new Date();
      return request(app.getHttpServer())
        .get('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('/api/budgets/:id (GET)', () => {
    let budgetId: string;

    beforeAll(async () => {
      const currentDate = new Date();
      // Get second category for unique budget
      const categoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      const secondCategoryId = categoriesResponse.body[1].id;

      const response = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 600000,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          categoryId: secondCategoryId,
        });
      budgetId = response.body.id;
    });

    it('should get a specific budget', () => {
      return request(app.getHttpServer())
        .get(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(budgetId);
          expect(res.body).toHaveProperty('spent');
          expect(res.body).toHaveProperty('remaining');
          expect(res.body).toHaveProperty('percentage');
        });
    });

    it('should return 404 for non-existent budget', () => {
      return request(app.getHttpServer())
        .get('/api/budgets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/api/budgets/:id (DELETE)', () => {
    it('should delete a budget', async () => {
      const currentDate = new Date();
      // Get third category
      const categoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      const thirdCategoryId = categoriesResponse.body[2].id;

      const createResponse = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 400000,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          categoryId: thirdCategoryId,
        });

      const budgetId = createResponse.body.id;

      return request(app.getHttpServer())
        .delete(`/api/budgets/${budgetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('eliminado exitosamente');
        });
    });
  });

  describe('/api/budgets/:id (PATCH)', () => {
    let budgetToUpdateId: string;

    beforeAll(async () => {
      const currentDate = new Date();
      const categoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      const fifthCategoryId = categoriesResponse.body[4].id;

      const response = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 200000,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          categoryId: fifthCategoryId,
        });
      budgetToUpdateId = response.body.id;
    });

    it('should update a budget amount', () => {
      return request(app.getHttpServer())
        .patch(`/api/budgets/${budgetToUpdateId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 800000 })
        .expect(200)
        .expect((res) => {
          expect(parseFloat(res.body.amount)).toBe(800000);
        });
    });

    it('should return 404 for non-existent budget', () => {
      return request(app.getHttpServer())
        .patch('/api/budgets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ amount: 300000 })
        .expect(404);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer())
        .patch(`/api/budgets/${budgetToUpdateId}`)
        .send({ amount: 300000 })
        .expect(401);
    });
  });

  describe('Budget Alerts', () => {
    it('should show warning alert at 80% spent', async () => {
      const currentDate = new Date();
      // Get fourth category
      const categoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      const fourthCategoryId = categoriesResponse.body[3].id;

      // Create budget
      const budgetResponse = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 100000,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          categoryId: fourthCategoryId,
        });

      // Create transaction that reaches 80%
      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 80000,
          description: 'Test 80%',
          transactionDate: new Date().toISOString().split('T')[0],
          categoryId: fourthCategoryId,
        });

      // Check budget has warning alert
      const budgetDetailResponse = await request(app.getHttpServer())
        .get(`/api/budgets/${budgetResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(budgetDetailResponse.body.percentage).toBeGreaterThanOrEqual(80);
      expect(budgetDetailResponse.body.alerts).toContainEqual(
        expect.stringContaining('ADVERTENCIA'),
      );
    });

    it('should show critical alert when budget exceeded (100%)', async () => {
      const currentDate = new Date();
      const categoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      const sixthCategoryId = categoriesResponse.body[5].id;

      const budgetResponse = await request(app.getHttpServer())
        .post('/api/budgets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 50000,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
          categoryId: sixthCategoryId,
        });

      await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 60000,
          description: 'Test 120%',
          transactionDate: new Date().toISOString().split('T')[0],
          categoryId: sixthCategoryId,
        });

      const budgetDetailResponse = await request(app.getHttpServer())
        .get(`/api/budgets/${budgetResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(budgetDetailResponse.body.percentage).toBeGreaterThanOrEqual(100);
      expect(budgetDetailResponse.body.alerts).toContainEqual(
        expect.stringContaining('CRÍTICO'),
      );
    });
  });
});
