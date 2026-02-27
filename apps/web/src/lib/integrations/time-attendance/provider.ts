import { TimeAttendanceAdapter } from "./adapter";
import { rotavuAdapter } from "./rotavu";

// Null provider to prevent silent mocks.
const nullProvider: TimeAttendanceAdapter = {
  provider: "none",
  async pullPunches() {
    throw new Error("No time and attendance provider configured");
  },
};

// Extend with real provider adapters and selection logic as needed.
export function getTimeAttendanceAdapter(): TimeAttendanceAdapter {
  const provider = process.env.TIME_ATTENDANCE_PROVIDER?.trim();
  switch (provider) {
    case "rotavu":
      return rotavuAdapter;
    // case "ukg": return ukgAdapter;
    // case "adp": return adpAdapter;
    // case "workday": return workdayAdapter;
    default:
      return nullProvider;
  }
}
