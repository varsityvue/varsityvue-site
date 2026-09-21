export type PickemSelectionMap = Record<string, string>;

export type PickemStateGame = {
  id: string;
  locked: boolean;
};

export type PickemSaveStatus = "idle" | "pending" | "success" | "error";

export type PickemClientState = {
  selections: PickemSelectionMap;
  savedSelections: PickemSelectionMap;
  saveStatus: PickemSaveStatus;
  message: string;
};

export type PickemClientAction =
  | { type: "select"; gameId: string; schoolSlug: string; locked: boolean }
  | { type: "save-start" }
  | { type: "save-success"; message: string }
  | { type: "save-error"; message: string };

export function createPickemClientState(
  selections: PickemSelectionMap,
  savedSelections: PickemSelectionMap,
): PickemClientState {
  return { selections, savedSelections, saveStatus: "idle", message: "" };
}

export function pickemClientReducer(
  state: PickemClientState,
  action: PickemClientAction,
): PickemClientState {
  if (action.type === "select") {
    if (action.locked || state.saveStatus === "pending") return state;
    return {
      ...state,
      selections: { ...state.selections, [action.gameId]: action.schoolSlug },
      saveStatus: "idle",
      message: "",
    };
  }
  if (action.type === "save-start") {
    return state.saveStatus === "pending"
      ? state
      : { ...state, saveStatus: "pending", message: "Saving your picks…" };
  }
  if (action.type === "save-success") {
    return {
      ...state,
      savedSelections: { ...state.selections },
      saveStatus: "success",
      message: action.message,
    };
  }
  return { ...state, saveStatus: "error", message: action.message };
}

export function derivePickemClientState(
  games: PickemStateGame[],
  state: PickemClientState,
) {
  const gameIds = new Set(games.map((game) => game.id));
  const selectedCount = games.filter((game) => Boolean(state.selections[game.id])).length;
  const savedPickCount = Object.keys(state.savedSelections).filter((gameId) => gameIds.has(gameId)).length;
  const dirtyGameIds = games
    .filter(
      (game) => !game.locked && state.selections[game.id] !== state.savedSelections[game.id],
    )
    .map((game) => game.id);

  return {
    selectedCount,
    savedPickCount,
    totalGames: games.length,
    allPicksMade: games.length > 0 && selectedCount === games.length,
    dirtyGameIds,
    pendingChangeCount: dirtyGameIds.length,
    hasUnsavedChanges: dirtyGameIds.length > 0,
  };
}

export function isPickSelected(
  selections: PickemSelectionMap,
  gameId: string,
  schoolSlug: string,
) {
  return selections[gameId] === schoolSlug;
}

export function canSubmitPickem(
  state: PickemClientState,
  hasUnsavedChanges: boolean,
) {
  return state.saveStatus !== "pending" && hasUnsavedChanges;
}

export function shouldShowMobileSaveBar(hasUnsavedChanges: boolean) {
  return hasUnsavedChanges;
}

export function shouldWarnBeforeUnload(hasUnsavedChanges: boolean) {
  return hasUnsavedChanges;
}
