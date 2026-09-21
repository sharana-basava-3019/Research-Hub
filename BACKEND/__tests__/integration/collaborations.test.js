/**
 * Integration Tests — Collaboration API (/api/collaborations/*)
 * Tests full lifecycle: send → accept/reject → revoke/exit/cancel
 * PRIMARY REGRESSION SUITE for the recently added revoke/exit features.
 */

const request = require('supertest');
require('../setup/testSetup');
const {
  createUser, createProject, createCollaboration, getAuthToken
} = require('../setup/testSetup');
const Project = require('../../models/Project');
const Collaboration = require('../../models/Collaboration');
const app = require('../../server');

// ─── POST /api/collaborations (send request) ───────────────────────────────
describe('POST /api/collaborations — Send Request', () => {
  test('201 — non-owner can request to join an open project', async () => {
    const owner = await createUser();
    const requester = await createUser();
    const project = await createProject(owner, { isOpenForCollaboration: true });
    const token = getAuthToken(requester);

    const res = await request(app)
      .post('/api/collaborations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: project._id.toString(),
        message: 'I would love to collaborate!',
        collaborationType: 'request'
      });

    expect(res.status).toBe(201);
    expect(res.body.data.collaboration.status).toBe('Pending');
    expect(res.body.data.collaboration.collaborationType).toBe('request');
  });

  test('400 — cannot send request to closed project', async () => {
    const owner = await createUser();
    const requester = await createUser();
    const project = await createProject(owner, { isOpenForCollaboration: false });
    const token = getAuthToken(requester);

    const res = await request(app)
      .post('/api/collaborations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: project._id.toString(),
        message: 'Please let me join!',
        collaborationType: 'request'
      });

    expect(res.status).toBe(400);
  });

  test('400 — owner cannot request to join their own project', async () => {
    const owner = await createUser();
    const project = await createProject(owner);
    const token = getAuthToken(owner);

    const res = await request(app)
      .post('/api/collaborations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        projectId: project._id.toString(),
        message: 'Joining my own project',
        collaborationType: 'request'
      });

    expect(res.status).toBe(400);
  });

  test('400 — duplicate request is rejected', async () => {
    const owner = await createUser();
    const requester = await createUser();
    const project = await createProject(owner, { isOpenForCollaboration: true });
    const token = getAuthToken(requester);

    const payload = {
      projectId: project._id.toString(),
      message: 'First request',
      collaborationType: 'request'
    };

    await request(app).post('/api/collaborations').set('Authorization', `Bearer ${token}`).send(payload);
    const res = await request(app).post('/api/collaborations').set('Authorization', `Bearer ${token}`).send(payload);

    expect(res.status).toBe(400);
  });

  test('401 — unauthenticated cannot send request', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    const res = await request(app)
      .post('/api/collaborations')
      .send({ projectId: project._id.toString(), message: 'Hi' });

    expect(res.status).toBe(401);
  });

  test('400 — missing projectId returns error', async () => {
    const user = await createUser();
    const token = getAuthToken(user);

    const res = await request(app)
      .post('/api/collaborations')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'No project id' });

    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/collaborations/:id/accept ───────────────────────────────────
describe('PUT /api/collaborations/:id/accept — REGRESSION', () => {
  test('200 — receiver can accept pending request', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(owner); // owner is receiver of a request

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/accept`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Welcome aboard!' });

    expect(res.status).toBe(200);
    expect(res.body.data.collaboration.status).toBe('Accepted');
  });

  test('REGRESSION — accepting adds collaborator to Project.collaborators', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request'
    });
    const token = getAuthToken(owner);

    await request(app)
      .put(`/api/collaborations/${collab._id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    const updatedProject = await Project.findById(project._id);
    const addedCollab = updatedProject.collaborators.find(
      c => c.user.toString() === sender._id.toString()
    );
    expect(addedCollab).toBeDefined();
  });

  test('403 — non-receiver cannot accept', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const thirdParty = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(thirdParty);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('403 — sender cannot accept their own request', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(sender);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('400 — cannot accept an already-accepted request', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, { status: 'Accepted' });
    const token = getAuthToken(owner);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/accept`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/collaborations/:id/reject ───────────────────────────────────
describe('PUT /api/collaborations/:id/reject', () => {
  test('200 — receiver can reject pending request', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(owner);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/reject`)
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'Not the right fit.' });

    expect(res.status).toBe(200);
    expect(res.body.data.collaboration.status).toBe('Rejected');
  });

  test('403 — non-receiver cannot reject', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(sender);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/reject`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── PUT /api/collaborations/:id/revoke ── REGRESSION ─────────────────────
describe('PUT /api/collaborations/:id/revoke — REGRESSION', () => {
  test('200 — project owner can revoke accepted collaboration', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    project.collaborators.push({ user: sender._id, role: 'Researcher' });
    await project.save();
    const collab = await createCollaboration(sender, owner, project, { status: 'Accepted' });
    const token = getAuthToken(owner);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Project scope changed.' });

    expect(res.status).toBe(200);
    expect(res.body.data.collaboration.status).toBe('Revoked');
  });

  test('REGRESSION — revoke removes user from Project.collaborators', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    project.collaborators.push({ user: sender._id, role: 'Researcher' });
    await project.save();
    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });
    const token = getAuthToken(owner);

    await request(app)
      .put(`/api/collaborations/${collab._id}/revoke`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Reason' });

    const updatedProject = await Project.findById(project._id);
    const stillInProject = updatedProject.collaborators.find(
      c => c.user.toString() === sender._id.toString()
    );
    expect(stillInProject).toBeUndefined(); // 🔴 REGRESSION CHECK
  });

  test('403 — non-owner cannot revoke accepted collaboration', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const thirdParty = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, { status: 'Accepted' });
    const token = getAuthToken(thirdParty);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/revoke`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('400 — cannot revoke already rejected collaboration', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, { status: 'Rejected' });
    const token = getAuthToken(owner);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/revoke`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── PUT /api/collaborations/:id/exit ── REGRESSION ───────────────────────
describe('PUT /api/collaborations/:id/exit — REGRESSION', () => {
  test('200 — collaborator can exit accepted collaboration', async () => {
    const owner = await createUser();
    const collaborator = await createUser();
    const project = await createProject(owner);
    project.collaborators.push({ user: collaborator._id, role: 'Researcher' });
    await project.save();
    const collab = await createCollaboration(collaborator, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });
    const token = getAuthToken(collaborator);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/exit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Pursuing different opportunities.' });

    expect(res.status).toBe(200);
    expect(res.body.data.collaboration.status).toBe('Exited');
  });

  test('REGRESSION — exit removes collaborator from Project.collaborators', async () => {
    const owner = await createUser();
    const collaborator = await createUser();
    const project = await createProject(owner);
    project.collaborators.push({ user: collaborator._id, role: 'Data Analyst' });
    await project.save();
    const collab = await createCollaboration(collaborator, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });
    const token = getAuthToken(collaborator);

    await request(app)
      .put(`/api/collaborations/${collab._id}/exit`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Moving on.' });

    const updatedProject = await Project.findById(project._id);
    const stillInProject = updatedProject.collaborators.find(
      c => c.user.toString() === collaborator._id.toString()
    );
    expect(stillInProject).toBeUndefined(); // 🔴 REGRESSION CHECK
  });

  test('400 — project owner cannot exit their own project', async () => {
    const owner = await createUser();
    const collaborator = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(collaborator, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });
    const token = getAuthToken(owner); // owner tries to exit

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/exit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test('400 — cannot exit a non-accepted collaboration', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, { status: 'Pending' });
    const token = getAuthToken(sender);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/exit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  test('403 — third party cannot exit someone else\'s collaboration', async () => {
    const owner = await createUser();
    const collaborator = await createUser();
    const thirdParty = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(collaborator, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });
    const token = getAuthToken(thirdParty);

    const res = await request(app)
      .put(`/api/collaborations/${collab._id}/exit`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─── DELETE /api/collaborations/:id (cancel) ──────────────────────────────
describe('DELETE /api/collaborations/:id — Cancel', () => {
  test('200 — sender can cancel their pending request', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(sender);

    const res = await request(app)
      .delete(`/api/collaborations/${collab._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const deleted = await Collaboration.findById(collab._id);
    expect(deleted.status).toBe('Cancelled');
  });

  test('403 — non-sender cannot cancel', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const thirdParty = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);
    const token = getAuthToken(thirdParty);

    const res = await request(app)
      .delete(`/api/collaborations/${collab._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  test('400 — cannot cancel already-accepted request', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, { status: 'Accepted' });
    const token = getAuthToken(sender);

    const res = await request(app)
      .delete(`/api/collaborations/${collab._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });
});

// ─── GET /api/collaborations/stats ────────────────────────────────────────
describe('GET /api/collaborations/stats', () => {
  test('200 — returns correct stats for user', async () => {
    const user = await createUser();
    const owner = await createUser();
    const project = await createProject(owner);
    await createCollaboration(user, owner, project, { status: 'Pending' });

    const token = getAuthToken(user);
    const res = await request(app)
      .get('/api/collaborations/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.stats.pending).toBeGreaterThanOrEqual(1);
    expect(res.body.data.stats.total).toBeGreaterThanOrEqual(1);
  });

  test('401 — unauthenticated request is rejected', async () => {
    const res = await request(app).get('/api/collaborations/stats');
    expect(res.status).toBe(401);
  });
});
