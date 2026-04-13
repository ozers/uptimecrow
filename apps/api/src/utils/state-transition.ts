export type StateTransition = "none" | "up_to_down" | "down_to_up";

export function evaluateTransition(
  currentStatus: string,
  checkPassed: boolean,
  failureCount: number,
  confirmationCount: number,
): StateTransition {
  if (currentStatus === "up" || currentStatus === "unknown") {
    if (!checkPassed && failureCount >= confirmationCount) {
      return "up_to_down";
    }
  }

  if (currentStatus === "down") {
    if (checkPassed) {
      return "down_to_up";
    }
  }

  return "none";
}
