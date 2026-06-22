import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Transactions Module (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
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

    // Register and login to get token
    const email = `test-transactions-${Date.now()}@fintech.com`;
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'Test1234',
        firstName: 'Test',
        lastName: 'Transactions',
      });

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;

    // Get a category to use in tests
    const categoriesResponse = await request(app.getHttpServer())
      .get('/api/categories')
      .set('Authorization', `Bearer ${authToken}`);

    categoryId = categoriesResponse.body[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/api/transactions (POST)', () => {
    it('should create a transaction successfully', () => {
      const createDto = {
        type: 'expense',
        amount: 50000,
        description: 'Test transaction',
        transactionDate: '2026-06-15',
        categoryId: categoryId,
      };

      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.type).toBe(createDto.type);
          expect(parseFloat(res.body.amount)).toBe(createDto.amount);
          expect(res.body.description).toBe(createDto.description);
          expect(res.body.categoryId).toBe(categoryId);
        });
    });

    it('should create transaction without category', () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'income',
          amount: 100000,
          description: 'Salary',
          transactionDate: '2026-06-15',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.categoryId).toBeNull();
        });
    });

    it('should reject future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 50000,
          description: 'Future transaction',
          transactionDate: futureDate.toISOString().split('T')[0],
          categoryId: categoryId,
        })
        .expect(400)
        .expect((res) => {
          const msg = Array.isArray(res.body.message) ? res.body.message.join(' ') : res.body.message;
          expect(msg).toContain('no puede ser futura');
        });
    });

    it('should reject negative amounts', () => {
      return request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: -50000,
          description: 'Negative amount',
          transactionDate: '2026-06-15',
        })
        .expect(400);
    });

    it('should require authentication', () => {
      return request(app.getHttpServer()).post('/api/transactions').send({}).expect(401);
    });
  });

  describe('/api/transactions (GET)', () => {
    let transactionId: string;

    beforeAll(async () => {
      // Create a transaction for testing
      const response = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 75000,
          description: 'Test for GET',
          transactionDate: '2026-06-10',
          categoryId: categoryId,
        });
      transactionId = response.body.id;
    });

    it('should get all transactions with pagination', () => {
      return request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('pagination');
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.pagination.page).toBe(1);
        });
    });

    it('should filter transactions by type', () => {
      return request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ type: 'expense' })
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((transaction: any) => {
            expect(transaction.type).toBe('expense');
          });
        });
    });

    it('should filter transactions by category', () => {
      return request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ categoryId })
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((transaction: any) => {
            if (transaction.categoryId) {
              expect(transaction.categoryId).toBe(categoryId);
            }
          });
        });
    });

    it('should filter by date range', () => {
      return request(app.getHttpServer())
        .get('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: '2026-06-01',
          endDate: '2026-06-30',
        })
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });
  });

  describe('/api/transactions/:id (PATCH)', () => {
    let transactionId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 50000,
          description: 'Original',
          transactionDate: '2026-06-15',
          categoryId: categoryId,
        });
      transactionId = response.body.id;
    });

    it('should update a transaction', () => {
      return request(app.getHttpServer())
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 60000,
          description: 'Updated',
        })
        .expect(200)
        .expect((res) => {
          expect(parseFloat(res.body.amount)).toBe(60000);
          expect(res.body.description).toBe('Updated');
        });
    });

    it('should update categoryId', async () => {
      // Get another category
      const categoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`);

      const newCategoryId = categoriesResponse.body[1]?.id;

      if (newCategoryId) {
        return request(app.getHttpServer())
          .patch(`/api/transactions/${transactionId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            categoryId: newCategoryId,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.categoryId).toBe(newCategoryId);
          });
      }
    });

    it('should not allow updating with future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      return request(app.getHttpServer())
        .patch(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          transactionDate: futureDate.toISOString().split('T')[0],
        })
        .expect(400);
    });
  });

  describe('/api/transactions/:id (DELETE)', () => {
    it('should delete a transaction', async () => {
      const createResponse = await request(app.getHttpServer())
        .post('/api/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 50000,
          description: 'To be deleted',
          transactionDate: '2026-06-15',
        });

      const transactionId = createResponse.body.id;

      return request(app.getHttpServer())
        .delete(`/api/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toContain('eliminada exitosamente');
        });
    });

    it('should return 404 for non-existent transaction', () => {
      return request(app.getHttpServer())
        .delete('/api/transactions/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('/api/transactions/balance (GET)', () => {
    it('should return balance calculation', () => {
      return request(app.getHttpServer())
        .get('/api/transactions/balance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('totalIncome');
          expect(res.body).toHaveProperty('totalExpense');
          expect(res.body).toHaveProperty('balance');
          expect(typeof res.body.balance).toBe('number');
        });
    });
  });
});
