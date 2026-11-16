import {
  isDateString,
  isNonEmptyString,
  isNullableString,
  isRecord,
} from '../../../utils/guards';

/** Forma de `Project` en la API (`src/projects/projects.types.ts`). */
export type ChannelProfile = 'google_merchant';

export type ConfigurationStatus = 'required' | 'ready';

export interface Project {
  id: string;
  name: string;
  country: string | null;
  currency: string | null;
  channelProfile: ChannelProfile | null;
  configurationStatus: ConfigurationStatus;
  createdAt: string;
}

/** Lo que aceptan `POST /projects` y `PATCH /projects/:id`. */
export interface ProjectInput {
  name: string;
  country: string;
  currency: string;
  channelProfile: ChannelProfile;
}

export interface PageInfo {
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ProjectList {
  projects: Project[];
  page: PageInfo;
}

export const CHANNEL_PROFILE_LABELS: Record<ChannelProfile, string> = {
  google_merchant: 'Google Merchant Center',
};

export function isProject(value: unknown): value is Project {
  return (
    isRecord(value) &&
    isNonEmptyString(value.id) &&
    typeof value.name === 'string' &&
    isNullableString(value.country) &&
    isNullableString(value.currency) &&
    (value.channelProfile === null ||
      value.channelProfile === 'google_merchant') &&
    (value.configurationStatus === 'required' ||
      value.configurationStatus === 'ready') &&
    isDateString(value.createdAt)
  );
}

export function isPageInfo(value: unknown): value is PageInfo {
  return (
    isRecord(value) &&
    typeof value.limit === 'number' &&
    typeof value.offset === 'number' &&
    typeof value.hasMore === 'boolean'
  );
}
