export type AdminActionState = { status: 'idle' | 'recorded' | 'rejected' | 'unknown'; message: string };
export const initialAdminActionState: AdminActionState = { status: 'idle', message: '' };
export function selectAdminWeek<T extends { id: string }>(weeks: T[], requested?: string): T | null {
  return requested !== undefined ? weeks.find(week => week.id === requested) ?? null : weeks[0] ?? null;
}
export async function runAdminWrite(write: () => PromiseLike<{ error: unknown }>): Promise<AdminActionState> {
  try {
    const { error } = await write();
    if (!error) return { status: 'recorded', message: 'Operation recorded. Refresh status before performing another operation.' };
    const detail = error as { message?: string; code?: string };
    const messages = ['Record notification before deciding this claim', 'A timely response and eligibility review are required', 'This candidate already has a final claim decision', 'The reviewed candidate changed. Refresh status and review the current winner'];
    const known = messages.find(message => detail.message?.includes(message));
    if (known) return { status: 'rejected', message: `${known}. Refresh status and review the requirements before retrying.` };
    // SQL exceptions definitively reject the transaction; transport errors can lose a committed response.
    if (detail.code?.startsWith('P') || detail.code?.startsWith('23') || detail.code === '42501') return { status: 'rejected', message: 'The database rejected this operation. Refresh status and verify administrator access, candidate, deadlines, and eligibility requirements.' };
    return { status: 'unknown', message: 'The result could not be confirmed. Refresh status to check whether it was recorded. Do not repeat the operation until verified.' };
  } catch {
    return { status: 'unknown', message: 'The result could not be confirmed. Refresh status to check whether it was recorded. Do not repeat the operation until verified.' };
  }
}
