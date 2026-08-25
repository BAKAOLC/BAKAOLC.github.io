import { validateCharacterProfilesConfig } from './validation';

import type { CharacterProfile } from '@/types';

let characterProfilesPromise: Promise<CharacterProfile[]> | null = null;

export const loadCharacterProfilesConfig = (): Promise<CharacterProfile[]> => {
  characterProfilesPromise ??= import('./character-profiles.json5')
    .then(module => validateCharacterProfilesConfig(module.default));

  return characterProfilesPromise;
};
