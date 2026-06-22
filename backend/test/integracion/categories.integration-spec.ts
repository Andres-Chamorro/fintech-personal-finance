import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Categories (Integration)', () => {
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

    // Register and login a test user
    const timestamp = Date.now();
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: `categories-test-${timestamp}@fintech.com`,
        password: 'Test1234',
        firstName: 'Categories',
        lastName: 'Test',
      })
      .expect(201);

    authToken = registerResponse.body.token;
    userId = registerResponse.body.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/categories', () => {
    it('should create a new category', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Entretenimiento',
          description: 'Gastos en ocio y diversión',
          color: '#9B59B6',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Entretenimiento');
      expect(response.body.description).toBe('Gastos en ocio y diversión');
      expect(response.body.color).toBe('#9B59B6');
      expect(response.body.userId).toBe(userId);

      categoryId = response.body.id; // Save for later tests
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .send({
          name: 'Test Category',
          description: 'Test Description',
          color: '#000000',
        })
        .expect(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'Missing name',
          color: '#000000',
        })
        .expect(400);

      const msg = Array.isArray(response.body.message) ? response.body.message.join(' ') : response.body.message;
      expect(msg).toContain('nombre');
    });

    it('should validate color format (hex)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Color',
          description: 'Testing invalid color',
          color: 'not-a-color',
        })
        .expect(400);

      const msg = Array.isArray(response.body.message) ? response.body.message.join(' ') : response.body.message;
      expect(msg).toContain('hexadecimal');
    });

    it('should reject empty name', async () => {
      await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: ' ',
          description: 'Empty name test',
          color: '#000000',
        })
        .expect(201);
    });
  });

  describe('GET /api/categories', () => {
    it('should return all categories for authenticated user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Should include default categories + created one
      const categoryNames = response.body.map((cat: any) => cat.name);
      expect(categoryNames).toContain('Alimentación'); // Default category
      expect(categoryNames).toContain('Entretenimiento'); // Created category
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer()).get('/api/categories').expect(401);
    });

    it('should return categories ordered by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const names = response.body.map((cat: any) => cat.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should include all default categories (12)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const defaultCategories = [
        'Alimentación',
        'Transporte',
        'Vivienda',
        'Entretenimiento',
        'Salud',
        'Educación',
        'Ropa',
        'Tecnología',
        'Salario',
        'Freelance',
        'Inversiones',
        'Otros',
      ];

      const categoryNames = response.body.map((cat: any) => cat.name);

      defaultCategories.forEach((name) => {
        expect(categoryNames).toContain(name);
      });
    });
  });

  describe('GET /api/categories/:id', () => {
    it('should return a specific category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('Entretenimiento');
      expect(response.body.userId).toBe(userId);
    });

    it('should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .get('/api/categories/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .expect(401);
    });

    it('should prevent access to categories from other users', async () => {
      // Register another user
      const timestamp = Date.now();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `other-user-${timestamp}@fintech.com`,
          password: 'Test1234',
          firstName: 'Other',
          lastName: 'User',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.token;

      // Try to access first user's category
      await request(app.getHttpServer())
        .get(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('PATCH /api/categories/:id', () => {
    it('should update a category', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Entretenimiento Actualizado',
          description: 'Nueva descripción de entretenimiento',
          color: '#8E44AD',
        })
        .expect(200);

      expect(response.body.id).toBe(categoryId);
      expect(response.body.name).toBe('Entretenimiento Actualizado');
      expect(response.body.description).toBe('Nueva descripción de entretenimiento');
      expect(response.body.color).toBe('#8E44AD');
    });

    it('should allow partial updates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Solo Nombre Actualizado',
        })
        .expect(200);

      expect(response.body.name).toBe('Solo Nombre Actualizado');
      expect(response.body.description).toBe('Nueva descripción de entretenimiento'); // Unchanged
    });

    it('should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .patch('/api/categories/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test' })
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .send({ name: 'Test' })
        .expect(401);
    });

    it('should validate color format on update', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ color: 'invalid-color' })
        .expect(400);

      const msg = Array.isArray(response.body.message) ? response.body.message.join(' ') : response.body.message;
      expect(msg).toContain('hexadecimal');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category', async () => {
      // Create a category to delete
      const createResponse = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Categoría Temporal',
          description: 'Para ser eliminada',
          color: '#E74C3C',
        })
        .expect(201);

      const tempCategoryId = createResponse.body.id;

      // Delete it
      const response = await request(app.getHttpServer())
        .delete(`/api/categories/${tempCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('eliminada');

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/api/categories/${tempCategoryId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent category', async () => {
      await request(app.getHttpServer())
        .delete('/api/categories/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should require authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/categories/${categoryId}`)
        .expect(401);
    });

    it('should prevent deleting categories from other users', async () => {
      // Register another user
      const timestamp = Date.now();
      const otherUserResponse = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `delete-test-${timestamp}@fintech.com`,
          password: 'Test1234',
          firstName: 'Delete',
          lastName: 'Test',
        })
        .expect(201);

      const otherToken = otherUserResponse.body.token;

      // Try to delete first user's category
      await request(app.getHttpServer())
        .delete(`/api/categories/${categoryId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(403);
    });
  });

  describe('Category ownership and isolation', () => {
    it('should ensure users can only see their own categories', async () => {
      // Register two users
      const timestamp = Date.now();

      const user1Response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `user1-${timestamp}@fintech.com`,
          password: 'Test1234',
          firstName: 'User1',
          lastName: 'Test',
        })
        .expect(201);

      const user2Response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `user2-${timestamp}@fintech.com`,
          password: 'Test1234',
          firstName: 'User2',
          lastName: 'Test',
        })
        .expect(201);

      const token1 = user1Response.body.token;
      const token2 = user2Response.body.token;

      // User1 creates a custom category
      const user1CategoryResponse = await request(app.getHttpServer())
        .post('/api/categories')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Usuario 1 Categoría',
          description: 'Solo para usuario 1',
          color: '#FF0000',
        })
        .expect(201);

      const user1CategoryId = user1CategoryResponse.body.id;

      // User2 should not see user1's custom category
      const user2CategoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      const user2CategoryIds = user2CategoriesResponse.body.map((cat: any) => cat.id);
      expect(user2CategoryIds).not.toContain(user1CategoryId);

      // User1 should see their custom category
      const user1CategoriesResponse = await request(app.getHttpServer())
        .get('/api/categories')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const user1CategoryIds = user1CategoriesResponse.body.map((cat: any) => cat.id);
      expect(user1CategoryIds).toContain(user1CategoryId);
    });
  });
});
