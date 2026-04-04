export interface HostContext {
  accessToken: string;
  directReportIds?: string[];
  userId: string;
  role: 'IC' | 'MANAGER' | 'LEADERSHIP';
  managerId?: string;
  teamId: string;
}
