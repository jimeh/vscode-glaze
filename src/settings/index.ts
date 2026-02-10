export {
  GLAZE_ACTIVE_KEY,
  themeScopeKey,
  mergeColorCustomizations,
  removeGlazeColors,
  hasGlazeColorsWithoutMarker,
} from './colorCustomizations';
export type { ColorCustomizations } from './colorCustomizations';
export {
  readLocalColorCustomizations,
  writeLocalColorCustomizations,
} from './localSettingsFile';
export { shouldUseLocalSettings } from './settingsTarget';
