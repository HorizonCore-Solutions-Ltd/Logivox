export type PunchType = "clock-in" | "clock-out" | "break-start" | "break-end";

export interface TimeAttendancePunch {
  externalId: string;
  employeeExternalId: string;
  occurredAt: Date;
  type: PunchType;
  locationExternalId?: string;
  payload?: Record<string, unknown>;
}

export interface TimeAttendanceSchedule {
  externalId: string;
  employeeExternalId: string;
  start: Date;
  end: Date;
  role?: string;
  locationExternalId?: string;
  payload?: Record<string, unknown>;
}

export interface TimeAttendanceAdapter {
  provider: string;
  pullPunches(params: {
    start: Date;
    end: Date;
    locationExternalId?: string;
  }): Promise<TimeAttendancePunch[]>;
  pullSchedules?(params: {
    start: Date;
    end: Date;
    locationExternalId?: string;
  }): Promise<TimeAttendanceSchedule[]>;
  verifyWebhook?(
    payload: unknown,
    headers: Record<string, string | string[] | undefined>,
  ): Promise<boolean>;
  parseWebhook?(payload: unknown): Promise<{
    punches?: TimeAttendancePunch[];
    schedules?: TimeAttendanceSchedule[];
  }>;
}
