/**
 * Dev harness — simulates how the PA host app would mount the micro-frontend.
 * Change the role to 'IC' | 'MANAGER' | 'LEADERSHIP' to test different views.
 */
import { mount } from './index';

const container = document.getElementById('app')!;

// Change these to test different roles
const context = {
  userId: 'dev-user-1',
  role: 'MANAGER' as const,
  teamId: 'team-alpha',
  managerId: 'mgr-1',
};

mount(container, context);
