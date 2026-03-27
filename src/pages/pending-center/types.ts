export interface PendingCenterUser {
  id: string;
  username: string;
  display_name?: string;
  status?: string;
}

export interface ApprovalActor {
  id?: string;
  username?: string;
  display_name?: string;
}

export type PendingTriggerRecord = AutoHealing.Incident;

export type PendingApprovalRecord = AutoHealing.ApprovalTask & {
  updated_at?: string;
  initiator?: ApprovalActor;
};
