/**
 * Unit Tests — Project Model
 * Tests: isOwner(), isCollaborator(), incrementViews()
 */

const { createUser, createProject } = require('../../../__tests__/setup/testSetup');
const Project = require('../../../models/Project');

describe('Project Model — Schema Validation', () => {
  test('creates a valid project successfully', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    expect(project._id).toBeDefined();
    expect(project.status).toBe('Planning');
    expect(project.isOpenForCollaboration).toBe(true);
    expect(project.visibility).toBe('Public');
    expect(project.viewCount).toBe(0);
  });

  test('requires title, description, researchArea, and owner', async () => {
    await expect(Project.create({})).rejects.toThrow();
  });

  test('rejects title exceeding 200 characters', async () => {
    const owner = await createUser();
    await expect(
      Project.create({
        title: 'A'.repeat(201),
        description: 'Valid desc',
        researchArea: 'CS',
        owner: owner._id
      })
    ).rejects.toThrow();
  });

  test('rejects invalid status enum', async () => {
    const owner = await createUser();
    await expect(
      createProject(owner, { status: 'InvalidStatus' })
    ).rejects.toThrow();
  });

  test('rejects maxCollaborators > 50', async () => {
    const owner = await createUser();
    await expect(
      createProject(owner, { maxCollaborators: 51 })
    ).rejects.toThrow();
  });
});

describe('Project Model — isOwner()', () => {
  test('returns true when userId matches owner', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    expect(project.isOwner(owner._id)).toBe(true);
  });

  test('returns false when userId does not match owner', async () => {
    const owner = await createUser();
    const other = await createUser();
    const project = await createProject(owner);

    expect(project.isOwner(other._id)).toBe(false);
  });

  test('works correctly when owner is populated (object with _id)', async () => {
    const owner = await createUser();
    const project = await createProject(owner);
    const populated = await Project.findById(project._id).populate('owner');

    expect(populated.isOwner(owner._id)).toBe(true);
  });

  test('accepts string userId as argument', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    expect(project.isOwner(owner._id.toString())).toBe(true);
  });
});

describe('Project Model — isCollaborator()', () => {
  test('returns false when collaborators list is empty', async () => {
    const owner = await createUser();
    const user = await createUser();
    const project = await createProject(owner);

    expect(project.isCollaborator(user._id)).toBe(false);
  });

  test('returns true when user is in collaborators list', async () => {
    const owner = await createUser();
    const collaborator = await createUser();
    const project = await createProject(owner);

    project.collaborators.push({ user: collaborator._id, role: 'Researcher' });
    await project.save();

    expect(project.isCollaborator(collaborator._id)).toBe(true);
  });

  test('returns false when user is not in collaborators list', async () => {
    const owner = await createUser();
    const collaborator = await createUser();
    const other = await createUser();
    const project = await createProject(owner);

    project.collaborators.push({ user: collaborator._id, role: 'Researcher' });
    await project.save();

    expect(project.isCollaborator(other._id)).toBe(false);
  });
});

describe('Project Model — incrementViews()', () => {
  test('increments viewCount by 1', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    expect(project.viewCount).toBe(0);
    await project.incrementViews();

    const updated = await Project.findById(project._id);
    expect(updated.viewCount).toBe(1);
  });

  test('increments viewCount multiple times correctly', async () => {
    const owner = await createUser();
    const project = await createProject(owner);

    await project.incrementViews();
    await project.incrementViews();
    await project.incrementViews();

    const updated = await Project.findById(project._id);
    expect(updated.viewCount).toBe(3);
  });
});
