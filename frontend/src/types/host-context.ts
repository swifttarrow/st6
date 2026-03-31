export interface HostContext {
  userId: string;
  role: 'IC' | 'MANAGER' | 'LEADERSHIP';
  managerId?: string;
  teamId: string;
}
