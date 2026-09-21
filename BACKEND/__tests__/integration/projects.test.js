/**
 * Integration Tests — Projects API (/api/projects/*)
 * Tests CRUD, search/filter, pagination, and authorization.
 */

const request = require('supertest');
require('../setup/testSetup');
const { createUser, createAdmin, createProject, getAuthToken } = require('../setup/testSetup');
const app = require('../../server');

// ─── GET /api/projects ─────────────────────────────────────────────────────
describe('GET /api/projects', () => {
  test('200 — returns public list of projects without auth', async () => {
    const owner = await createUser();
    await createProject(owner);
    await createProject(owner);

    const res = await request(app).get('/api/projects');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(Array.isArray(res.body.data.projects)).toBe(true);
  });

  test('200 — pagination works correctly', async () => {
    const owner = await createUser();
    // Create 5 projects
    for (let i = 0; i < 5; i++) {
      await createProject(owner, { title: `Pagination Project ${i}` });
    }

    const res = await request(app).get('/api/projects?page=1&limit=3');

    expect(res.status).toBe(200);
    expect(res.body.data.projects.length).toBeLessThanOrEqual(3);
    expect(res.body.pages).toBeDefined();
  });

  test('200 — filters by researchArea', async () => {
    const owner = await createUser();
    await createProject(owner, { researchArea: 'Biology', title: 'Bio Project' });
    await createProject(owner, { researchArea: 'Physics', title: 'Physics Project' });

    const res = await request(app).get('/api/projects?researchArea=Biology');

    expect(res.status).toBe(200);
    res.body.data.projects.forEach(p => {
      expect(p.researchArea).toBe('Biology');
    });
  });

  test('200 — filters by status', async () => {
    const owner = await createUser();
    await createProject(owner, { status: 'Completed', title: 'Done Project' });
    await createProject(owner, { status: 'Planning', title: 'Planned Project' });

    const res = await request(app).get('/api/projects?status=Completed');

    expect(res.status).toBe(200);
    res.body.data.projects.forEach(p => {
      expect(p.status).toBe('Completed');
    });
  });
});

// ─── GET /api/projects/:id ─────────────────────────────────────────────────
describe('GET /api/projects/:id', () => {
  test('200 — returns single project by ID', async () => {
    const owner = await createUser();
    const project = await createProject(owner, { title: 'Specific Project' });

    const res = await request(app).get(`/api/projects/${project._id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.project._id.toString()).toBe(project._id.toString());
    expect(res.body.data.project.title).toBe('Specific Project');
  });

  test('404 — returns 404 for non-existent project', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app).get(`/api/projects/${fakeId}`);
    expect(res.status).toBe(404);
  });
});

// ─── POST /api/projects ────────────────────────────────────────────────────
describe('POST /api/projects', () => {
  const validProject = () => ({
    title: `New Project ${Date.now()}`,
    description: 'This is a valid project description for testing purposes.',
    researchArea: 'Computer Science'
  });

  test('201 — authenticated user can create a project', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(validProject());

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('success');
    expect(res.body.data.project.owner.toString()).toBe(user._id.toString());
  });

  test('401 — unauthenticated user cannot create a project', async () => {
    const res = await request(app)
      .post('/api/projects')
      .send(validProject());

    expect(res.status).toBe(401);
  });

  test('400 — rejects missing title', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const { title, ...payload } = validProject();
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  test('400 — rejects missing description', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const { description, ...payload } = validProject();
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(res.status).toBe(400);
  });

  test('400 — rejects title exceeding 200 characters', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ ...validProject(), title: 'T'.repeat(201) });

    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/projects/:id ─────────────────────────────────────────────────
describe('PUT /api/projects/:id', () => {
  test('200 — owner can update their own project', async () => {
    const owner = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(owner);

    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Updated Title', status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.data.project.title).toBe('Updated Title');
    expect(res.body.data.project.status).toBe('In Progress');
  });

  test('403 — non-owner cannot update the project', async () => {
    const owner = await createUser();
    const other = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(other);

    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Hijacked Title' });

    expect(res.status).toBe(403);
  });

  test('401 — unauthenticated cannot update project', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    const res = await request(app)
      .put(`/api/projects/${project._id}`)
      .send({ title: 'Anonymous Edit' });

    expect(res.status).toBe(401);
  });
});

// ─── DELETE /api/projects/:id ──────────────────────────────────────────────
describe('DELETE /api/projects/:id', () => {
  test('200 — owner can delete their project', async () => {
    const owner = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(owner);

    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
  });

  test('403 — non-owner cannot delete the project', async () => {
    const owner = await createUser();
    const other = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(other);

    const res = await request(app)
      .delete(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('401 — unauthenticated cannot delete project', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    const res = await request(app)
      .delete(`/api/projects/${project._id}`);

    expect(res.status).toBe(401);
  });
});

// ─── POST /api/projects/:id/comments ───────────────────────────────────────
describe('POST /api/projects/:id/comments', () => {
  test('201 — authenticated user can comment on a project', async () => {
    const owner = await createUser();
    const commenter = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(commenter);

    const res = await request(app)
      .post(`/api/projects/${project._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Great research work!' });

    expect(res.status).toBe(201);
    expect(res.body.data.comment.text).toBe('Great research work!');
  });

  test('400 — rejects empty comment text', async () => {
    const owner = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(owner);

    const res = await request(app)
      .post(`/api/projects/${project._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: '' });

    expect(res.status).toBe(400);
  });

  test('401 — unauthenticated cannot post comments', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    const res = await request(app)
      .post(`/api/projects/${project._id}/comments`)
      .send({ text: 'Anonymous comment' });

    expect(res.status).toBe(401);
  });
});

// ─── GET /api/projects/my ──────────────────────────────────────────────────
describe('GET /api/projects/my', () => {
  test('200 — returns only projects owned by current user', async () => {
    const user1 = await createUser();
    const user2 = await createUser();
    await createProject(user1, { title: 'User1 Project A' });
    await createProject(user1, { title: 'User1 Project B' });
    await createProject(user2, { title: 'User2 Project' });
    const token = getAuthToken(user1);

    const res = await request(app)
      .get('/api/projects/my')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    res.body.data.projects.forEach(p => {
      const ownerId = p.owner._id ? p.owner._id.toString() : p.owner.toString();
      expect(ownerId).toBe(user1._id.toString());
    });
  });

  test('401 — unauthenticated cannot access own projects', async () => {
    const res = await request(app).get('/api/projects/my');
    expect(res.status).toBe(401);
  });
});
