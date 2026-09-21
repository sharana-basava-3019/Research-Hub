/**
 * Unit Tests — Collaboration Model
 * Tests: accept(), reject(), cancel(), revoke(), exit(), requestExists()
 * REGRESSION FOCUS: revoke() and exit() must remove user from Project.collaborators
 */

const { createUser, createProject, createCollaboration } = require('../../../__tests__/setup/testSetup');
const Collaboration = require('../../../models/Collaboration');
const Project = require('../../../models/Project');

describe('Collaboration Model — accept()', () => {
  test('sets status to Accepted', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner, { isOpenForCollaboration: true });
    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request'
    });

    await collab.accept('Looking forward to working together!');

    const updated = await Collaboration.findById(collab._id);
    expect(updated.status).toBe('Accepted');
    expect(updated.response.message).toBe('Looking forward to working together!');
    expect(updated.response.respondedAt).toBeDefined();
  });

  test('adds the sender (request mode) to Project.collaborators', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request',
      proposedRole: 'Data Analyst'
    });

    await collab.accept();

    const updatedProject = await Project.findById(project._id);
    const addedCollab = updatedProject.collaborators.find(
      c => c.user.toString() === sender._id.toString()
    );
    expect(addedCollab).toBeDefined();
    expect(addedCollab.role).toBe('Data Analyst');
  });

  test('adds the receiver (invite mode) to Project.collaborators', async () => {
    const owner = await createUser();
    const invitee = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(owner, invitee, project, {
      collaborationType: 'invite',
      proposedRole: 'UI/UX Designer'
    });

    await collab.accept();

    const updatedProject = await Project.findById(project._id);
    const addedCollab = updatedProject.collaborators.find(
      c => c.user.toString() === invitee._id.toString()
    );
    expect(addedCollab).toBeDefined();
    expect(addedCollab.role).toBe('UI/UX Designer');
  });
});

describe('Collaboration Model — reject()', () => {
  test('sets status to Rejected', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);

    await collab.reject('Not a good fit right now.');

    const updated = await Collaboration.findById(collab._id);
    expect(updated.status).toBe('Rejected');
    expect(updated.response.message).toBe('Not a good fit right now.');
  });

  test('does NOT add user to Project.collaborators', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);

    await collab.reject();

    const updatedProject = await Project.findById(project._id);
    expect(updatedProject.collaborators).toHaveLength(0);
  });
});

describe('Collaboration Model — cancel()', () => {
  test('sets status to Cancelled', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project);

    await collab.cancel();

    const updated = await Collaboration.findById(collab._id);
    expect(updated.status).toBe('Cancelled');
  });
});

describe('Collaboration Model — revoke() — REGRESSION', () => {
  test('sets status to Revoked', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });

    // Manually add to project.collaborators to simulate accepted state
    project.collaborators.push({ user: sender._id, role: 'Collaborator' });
    await project.save();

    await collab.revoke('Project direction changed.');

    const updated = await Collaboration.findById(collab._id);
    expect(updated.status).toBe('Revoked');
    expect(updated.response.message).toBe('Project direction changed.');
  });

  test('REMOVES collaborator from Project.collaborators (request mode)', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    // Add to collaborators first (simulates accepted state)
    project.collaborators.push({ user: sender._id, role: 'Researcher' });
    await project.save();

    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });

    await collab.revoke('Reason for revoke');

    const updatedProject = await Project.findById(project._id);
    const stillInProject = updatedProject.collaborators.find(
      c => c.user.toString() === sender._id.toString()
    );
    expect(stillInProject).toBeUndefined(); // 🔴 REGRESSION CHECK
  });

  test('REMOVES invitee from Project.collaborators (invite mode)', async () => {
    const owner = await createUser();
    const invitee = await createUser();
    const project = await createProject(owner);

    project.collaborators.push({ user: invitee._id, role: 'Designer' });
    await project.save();

    const collab = await createCollaboration(owner, invitee, project, {
      collaborationType: 'invite', status: 'Accepted'
    });

    await collab.revoke();

    const updatedProject = await Project.findById(project._id);
    const stillInProject = updatedProject.collaborators.find(
      c => c.user.toString() === invitee._id.toString()
    );
    expect(stillInProject).toBeUndefined(); // 🔴 REGRESSION CHECK
  });
});

describe('Collaboration Model — exit() — REGRESSION', () => {
  test('sets status to Exited', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);
    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });

    await collab.exit('Moving to another project.');

    const updated = await Collaboration.findById(collab._id);
    expect(updated.status).toBe('Exited');
  });

  test('REMOVES collaborator from Project.collaborators on exit (request mode)', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    project.collaborators.push({ user: sender._id, role: 'Researcher' });
    await project.save();

    const collab = await createCollaboration(sender, owner, project, {
      collaborationType: 'request', status: 'Accepted'
    });

    await collab.exit('I need to focus elsewhere.');

    const updatedProject = await Project.findById(project._id);
    const stillInProject = updatedProject.collaborators.find(
      c => c.user.toString() === sender._id.toString()
    );
    expect(stillInProject).toBeUndefined(); // 🔴 REGRESSION CHECK
  });

  test('REMOVES invitee from Project.collaborators on exit (invite mode)', async () => {
    const owner = await createUser();
    const invitee = await createUser();
    const project = await createProject(owner);

    project.collaborators.push({ user: invitee._id, role: 'Designer' });
    await project.save();

    const collab = await createCollaboration(owner, invitee, project, {
      collaborationType: 'invite', status: 'Accepted'
    });

    await collab.exit('Personal reasons.');

    const updatedProject = await Project.findById(project._id);
    const stillInProject = updatedProject.collaborators.find(
      c => c.user.toString() === invitee._id.toString()
    );
    expect(stillInProject).toBeUndefined(); // 🔴 REGRESSION CHECK
  });
});

describe('Collaboration Model — requestExists()', () => {
  test('returns true for Pending collaboration between same parties', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    await createCollaboration(sender, owner, project, { status: 'Pending' });

    const exists = await Collaboration.requestExists(sender._id, owner._id, project._id);
    expect(exists).toBe(true);
  });

  test('returns true for Accepted collaboration (duplicate guard)', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    await createCollaboration(sender, owner, project, { status: 'Accepted' });

    const exists = await Collaboration.requestExists(sender._id, owner._id, project._id);
    expect(exists).toBe(true);
  });

  test('returns false for Rejected collaboration (allows re-request)', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    await createCollaboration(sender, owner, project, { status: 'Rejected' });

    const exists = await Collaboration.requestExists(sender._id, owner._id, project._id);
    expect(exists).toBe(false); // Rejected → can re-request
  });

  test('returns false for Revoked collaboration (allows re-request)', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    await createCollaboration(sender, owner, project, { status: 'Revoked' });

    const exists = await Collaboration.requestExists(sender._id, owner._id, project._id);
    expect(exists).toBe(false); // Revoked → can re-request
  });

  test('returns false when no collaboration exists', async () => {
    const owner = await createUser();
    const sender = await createUser();
    const project = await createProject(owner);

    const exists = await Collaboration.requestExists(sender._id, owner._id, project._id);
    expect(exists).toBe(false);
  });
});
