// These are the low-level config types that will be upserted to mothertree

export interface MothertreeAppConfig {
  path: string;
  name: string;
  cliVersion: string;
  embeds: MothertreeEmbedConfig[];
  actions: MothertreeActionConfig[];
  countables: MothertreeCountableConfig[];
  products: MothertreeProductConfig[];
  productVariants: MothertreeProductVariantConfig[];
  powerups: MothertreePowerupConfig[];
  postInstallActionPath?: string;
}

export interface MothertreeEmbedConfig {
  slug: string;
  url: string;
  contentPageType: string;
  windowProps?: {
    title?: string;
    tooltipDescription?: string;
    initialDimensions?: {
      width: number;
      height: number;
    };
  };
  isResizable?: boolean;
  resizeBounds?: {
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
  };
  tileProps?: {
    bgColor?: string;
    title?: string;
  };
  defaultStyles?: object;
  isLoginRequired?: boolean;
  minTruffleVersion?: string;
  maxTruffleVersion?: string;
  deviceType?: 'desktop' | 'mobile';
  status?: 'published' | 'experimental' | 'disabled';
}

export interface MothertreeActionConfig {
  slug: string;
  operation: string;
  inputsTemplate: {
    // if operation is 'webhook'
    url?: string;

    // if operation is 'exchange'
    assets?: MothertreeAssetTemplateConfig[] | '{{USE_SECURE_PROVIDED}}';

    // if the operation is 'workflow'
    actionPaths?: string[];
  };
}

export interface MothertreeCountableConfig {
  slug: string;
  name?: string;
  category?: string;
  decimalPlaces?: number;
  data?: object;
}

export interface MothertreeProductConfig {
  slug: string;
  name?: string;
  category?: string;
  rank?: number;
}

export interface MothertreeProductVariantConfig {
  slug: string;
  name?: string;
  description?: string;
  productPath: string;
  actionPath: string;
  assetTemplates: MothertreeAssetTemplateConfig[];
}

export interface MothertreeAssetTemplateConfig {
  entityType?: 'countable' | 'fiat';
  entityId?: string | '{{USE_PROVIDED}}';
  entityPath?: string;
  count: number | '{{USE_PROVIDED}}';
  metadata: Record<string, any>; // eg for fiat, { feeCents: number }
  senders: MothertreeAssetParticipantTemplate[];
  receivers: MothertreeAssetParticipantTemplate[];
}

export interface MothertreeAssetParticipantTemplate {
  entityType: 'user' | 'org-member' | 'org' | 'company';
  entityId: string | '{{USE_PROVIDED}}' | '{{USE_USER_ID}}' | '{{USE_ORG_ID}}';
  share: number;
}

export interface MothertreePowerupConfig {
  slug: string;
  name?: string;
  data?: object;
  imageFileReference?: object;
}
