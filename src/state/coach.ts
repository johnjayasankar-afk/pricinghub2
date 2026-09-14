const KEY = "keepfloor.coach.v1";

export function coachDismissed(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function dismissCoach(): void {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode */
  }
}
