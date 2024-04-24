import Joi from 'joi';

export const CONTENT_PAGE_TYPES = [
  'appManagement',
  'quickActions',
  'youtube',
  'youtubeVideo',
  'youtubeLive',
  'youtubeLiveUpcoming',
  'youtubeLiveNow',
  'youtubeLiveVod',
  'youtubeChatFrame',
  'twitch',
  'twitchEmbed',
] as const;
export type ContentPageType = (typeof CONTENT_PAGE_TYPES)[number];

export const OPERATION_TYPES = [
  'webhook',
  'workflow',
  'exchange',
  'apply-powerup',
  // TODO: support these
  // 'conditional',
] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export const ASSET_PARTICIPANT_ENTITY_TYPES = [
  'user',
  'org-member',
  'org',
  'company',
] as const;
export type AssetParticipantEntityType =
  (typeof ASSET_PARTICIPANT_ENTITY_TYPES)[number];

const COUNTABLE_SCHEMA = Joi.object({
  slug: Joi.string().required(),
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  decimalPlaces: Joi.number().optional(),
});

export const EMBED_SCHEMA = Joi.object({
  slug: Joi.string().required(),
  url: Joi.string().required(),
  iconUrl: Joi.string().optional(),
  contentPageType: Joi.string()
    .valid(...CONTENT_PAGE_TYPES)
    .required(),
  windowProps: Joi.object({
    title: Joi.string().optional(),
    tooltipDescription: Joi.string().optional(),
    initialDimensions: Joi.object({
      width: Joi.number().required(),
      height: Joi.number().required(),
    }).optional(),
  }).optional(),
  isResizable: Joi.boolean().optional(),
  resizeBounds: Joi.object({
    minWidth: Joi.number().required(),
    minHeight: Joi.number().required(),
    maxWidth: Joi.number().required(),
    maxHeight: Joi.number().required(),
  }).optional(),
  tileProps: Joi.object({
    bgColor: Joi.string().optional(),
    title: Joi.string().optional(),
  }).optional(),
  defaultStyles: Joi.object().optional(),
  isLoginRequired: Joi.boolean().optional(),
  minTruffleVersion: Joi.string().optional(),
  maxTruffleVersion: Joi.string().optional(),
  deviceType: Joi.string().valid('desktop', 'mobile').optional(),
  parentQuerySelector: Joi.string().optional(),
  status: Joi.string()
    .valid('published', 'experimental', 'disabled')
    .optional(),
});

const POWERUP_SCHEMA = Joi.object({
  slug: Joi.string().required(),
  name: Joi.string().optional(),
  data: Joi.object().optional(),
  imageFileReference: Joi.object().optional(),
});

const ASSET_PARTICIPANT_TEMPLATE_SCHEMA = Joi.object({
  entityType: Joi.string()
    .valid(...ASSET_PARTICIPANT_ENTITY_TYPES)
    .required(),
  entityId: Joi.string().required(),
  share: Joi.number().required(),
});

const ASSET_TEMPLATE_SCHEMA = Joi.object({
  entityType: Joi.string().valid('countable', 'fiat'),
  entityId: Joi.string(),
  entityPath: Joi.string(),
  count: Joi.alternatives()
    .try(
      Joi.number().required(),
      Joi.string().valid('{{USE_PROVIDED}}').required(),
    )
    .required(),
  metadata: Joi.object().optional(),
  senders: Joi.array().items(ASSET_PARTICIPANT_TEMPLATE_SCHEMA).required(),
  receivers: Joi.array().items(ASSET_PARTICIPANT_TEMPLATE_SCHEMA).required(),
})
  // this makes it so that either entityId and entityType is required or entityPath is required
  .with('entityId', 'entityType')
  .xor('entityPath', 'entityId');

export const ACTION_SCHEMA = Joi.object({
  operation: Joi.string()
    .valid(...OPERATION_TYPES)
    .required(),

  name: Joi.string().optional(),

  // webhook inputs
  url: Joi.when('operation', {
    is: 'webhook',
    then: Joi.string().required(),
  }),

  data: Joi.when('operation', {
    is: 'webhook',
    then: Joi.alternatives()
      .try(Joi.object(), Joi.string().valid('{{USE_PROVIDED}}'))
      .optional(),
  }),

  // workflow inputs
  strategy: Joi.when('operation', {
    is: 'workflow',
    then: Joi.string().valid('sequential', 'parallel').required(),
  }),

  actions: Joi.when('operation', {
    is: 'workflow',
    then: Joi.array().items(Joi.link('#actionSchema')).required(),
  }),

  // exchange inputs
  assets: Joi.when('operation', {
    is: 'exchange',
    then: Joi.alternatives()
      .try(
        Joi.string().valid('{{USE_SECURE_PROVIDED}}').required(),
        Joi.array().items(ASSET_TEMPLATE_SCHEMA).required(),
      )
      .required(),
  }),

  // apply-pwerup inputs
  powerup: Joi.when('operation', {
    is: 'apply-powerup',
    then: Joi.alternatives().try(Joi.string(), POWERUP_SCHEMA).required(),
  }),

  targetType: Joi.when('operation', {
    is: 'apply-powerup',
    then: Joi.string().required(),
  }),

  targetId: Joi.when('operation', {
    is: 'apply-powerup',
    then: Joi.string().required(),
  }),

  ttlSeconds: Joi.when('operation', {
    is: 'apply-powerup',
    then: Joi.number().required(),
  }),

  inputsTemplate: Joi.object().optional(),

  isDirectExecutionAllowed: Joi.boolean().optional(),
}).id('actionSchema');

const ACTION_WITH_SLUG_SCHEMA = ACTION_SCHEMA.concat(
  Joi.object({
    slug: Joi.string().required(),
  }),
);

export const PRODUCT_VARIANT_SCHEMA = Joi.object({
  slug: Joi.string().required(),
  name: Joi.string().optional(),
  price: Joi.number().required(),
  description: Joi.string().optional(),
  action: ACTION_SCHEMA.optional(),
  assets: Joi.array().items(ASSET_SCHEMA).optional(),
});

export const PRODUCT_SCHEMA = Joi.object({
  slug: Joi.string().required(),
  name: Joi.string().optional(),
  category: Joi.string().optional(),
  rank: Joi.number().optional(),
  variants: Joi.array().items(PRODUCT_VARIANT_SCHEMA).required(),
});

export const APP_CONFIG_SCHEMA = Joi.object({
  path: Joi.string().required(),
  name: Joi.string().required(),
  cliVersion: Joi.string().required(),
  description: Joi.string().optional(),
  embeds: Joi.array().items(EMBED_SCHEMA).optional(),
  countables: Joi.array().items(COUNTABLE_SCHEMA).optional(),
  products: Joi.array().items(PRODUCT_SCHEMA).optional(),
  actions: Joi.array().items(ACTION_WITH_SLUG_SCHEMA).optional(),
  powerups: Joi.array().items(POWERUP_SCHEMA).optional(),
  postInstallAction: Joi.alternatives()
    .try(Joi.string(), ACTION_SCHEMA)
    .optional(),
});
