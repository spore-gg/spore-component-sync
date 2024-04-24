import { readFile } from 'fs/promises';
import Joi from 'joi';
import path from 'path';
import { AppConfig } from 'src/types/generated';
import * as schemas from '../constants/app-config-schema';
import _ from 'lodash';
import {
  MothertreeAppConfig,
  MothertreeAssetParticipantTemplate,
} from 'src/types/mt-app-config';
import { SPARKS_PATH } from 'src/constants/resource-paths';

export const DEFAULT_APP_CONFIG_FILE_NAME = 'truffle.config.mjs';

export function getAppConfigPath() {
  return path.join(process.cwd(), `/${DEFAULT_APP_CONFIG_FILE_NAME}`);
}

export async function readRawAppConfig() {
  return await readFile(getAppConfigPath(), 'utf8');
}

export async function readAppConfig() {
  return await import(new URL(`file://${getAppConfigPath()}`).href);
}

export async function isInAppDir() {
  // check if app config already exists
  try {
    await readAppConfig();
    return true;
  } catch {
    return false;
  }
}

export function validateAppConfig(appConfig: any): AppConfig {
  Joi.assert(appConfig, schemas.APP_CONFIG_SCHEMA);
  schemas.APP_CONFIG_SCHEMA.validate;
  return appConfig;
}

export function makeLocalActionPath(actionSlug: string) {
  return `./_Action/${actionSlug}`;
}

export function makeLocalPowerupPath(powerupSlug: string) {
  return `./_Powerup/${powerupSlug}`;
}

type ActionConfig = NonNullable<AppConfig['actions']>[number];
type EmbeddedActionConfig = Omit<ActionConfig, 'slug'>;

export function convertActionConfigsToMothertreeActionConfigs(
  actionConfigs: ActionConfig[],
  mtAppConfig: MothertreeAppConfig,
) {
  mtAppConfig.actions.push(
    ...actionConfigs.map((actionConfig) => {
      let inputsTemplate: Record<string, unknown>;
      switch (actionConfig.operation) {
        case 'workflow': {
          inputsTemplate = {
            // if the action is a workflow, we need to create a new action for each sub-action
            // and add the sub-action paths to the inputsTemplate
            actionPaths: actionConfig.actions.map(
              // a sub action could either be an action path or an embedded action
              (subAction: EmbeddedActionConfig | string, subActionIdx) => {
                // if the sub-action is a string, it's an action path, so just return it
                if (typeof subAction === 'string') {
                  return subAction;
                }

                // if the sub-action is an embedded action, we need to create a new action
                const slug = `${actionConfig.slug}-step-${subActionIdx}`;

                // add the sub-action to the actions array
                convertActionConfigsToMothertreeActionConfigs(
                  [{ ...subAction, slug }],
                  mtAppConfig,
                );

                return makeLocalActionPath(slug);
              },
            ),

            // pass along the strategy
            strategy: actionConfig.strategy,
          };
          break;
        }

        case 'apply-powerup': {
          // actionConfig.powerup is either a string or an object containing a powerup config
          let powerupPath: string = '';
          if (typeof actionConfig.powerup === 'string') {
            powerupPath = actionConfig.powerup;
          } else {
            mtAppConfig.powerups.push(actionConfig.powerup);
            powerupPath = makeLocalPowerupPath(actionConfig.powerup.slug);
          }

          inputsTemplate = {
            powerupPath: powerupPath,
            targetType: actionConfig.targetType,
            targetId: actionConfig.targetId,
            ttlSeconds: actionConfig.ttlSeconds,
          };
          break;
        }

        case 'webhook': {
          inputsTemplate = {
            url: actionConfig.url,
            data: actionConfig.data,
          };
          break;
        }

        case 'exchange': {
          inputsTemplate = {
            assets: actionConfig.assets,
          };
          break;
        }
      }

      return {
        slug: actionConfig.slug,
        operation: actionConfig.operation,
        isDirectExecutionAllowed:
          actionConfig.isDirectExecutionAllowed ?? false,
        inputsTemplate,
      };
    }),
  );
}

export function makeLocalProductPath(productSlug: string) {
  return `./_Product/${productSlug}`;
}

type ProductConfig = NonNullable<AppConfig['products']>[number];

/**
 * Takes an array of cli formatted product configs and converts them to mothertree formatted product and variant configs
 * @param productConfigs
 * @returns
 */
export function convertProductConfigsToMothertreeProductAndVariantConfigs(
  productConfigs: ProductConfig[],
  mtAppConfig: MothertreeAppConfig,
) {
  // add an exchange action to be used by all product variants
  const exchangeActionSlug = 'default-exchange-action';
  mtAppConfig.actions.push({
    slug: exchangeActionSlug,
    operation: 'exchange',
    inputsTemplate: {
      assets: '{{USE_SECURE_PROVIDED}}',
    },
  });
  const exchangeActionPath = makeLocalActionPath(exchangeActionSlug);

  // add all products to the products array
  mtAppConfig.products.push(
    ...productConfigs.map((product, productIdx) => {
      // add all product variants to the productVariants array
      mtAppConfig.productVariants.push(
        ...product.variants.map((variant) => {
          // by default, the actionPath is the exchange action
          let actionPath = exchangeActionPath;

          // if the variant has an action, we need to create a
          // workflow action that includes the exchange action
          // and the variant action
          if (variant.action) {
            const workflowActionSlug = `${product.slug}-${variant.slug}-workflow`;
            const workflowActionPath = makeLocalActionPath(workflowActionSlug);

            // add the workflow action to the actions array
            convertActionConfigsToMothertreeActionConfigs(
              [
                {
                  slug: workflowActionSlug,
                  operation: 'workflow',
                  strategy: 'sequential',
                  actions: [exchangeActionPath, variant.action],
                },
              ],
              mtAppConfig,
            );

            // in this case, we overwrite the actionPath with the workflow action path
            actionPath = workflowActionPath;
          }

          return {
            slug: variant.slug,
            name: variant.name,
            description: variant.description,
            actionPath,
            productPath: makeLocalProductPath(product.slug),
            assetTemplates: [
              {
                // TODO: support other countable types
                entityPath: SPARKS_PATH,
                count: variant.price,
                senders: [
                  {
                    entityType: 'user',
                    entityId: '{{USE_USER_ID}}',
                    share: 1,

                    // tbh I don't know why we have to cast this
                  } as MothertreeAssetParticipantTemplate,
                ],
                // TODO: if we want, we can change this to do rev/share split with org, us, and dev...
                // this might not be the place to do that though
                receivers: [
                  {
                    entityType: 'org',
                    entityId: '{{USE_ORG_ID}}',
                    share: 1,

                    // tbh I don't know why we have to cast this
                  } as MothertreeAssetParticipantTemplate,
                ],
                metadata: {},
              },
            ],
          };
        }),
      );

      return {
        slug: product.slug,
        name: product.name,
        category: product.category,
        rank: product.rank ?? productIdx,
      };
    }),
  );
}

export function convertAppConfigToMothertreeConfig(appConfig: AppConfig) {
  const mtAppConfig: MothertreeAppConfig = {
    path: appConfig.path,
    name: appConfig.name,
    cliVersion: appConfig.cliVersion,
    embeds: appConfig.embeds ?? [],
    countables: appConfig.countables ?? [],
    powerups: appConfig.powerups ?? [],
    actions: [],
    products: [],
    productVariants: [],
  };

  if (appConfig.actions) {
    convertActionConfigsToMothertreeActionConfigs(
      appConfig.actions,
      mtAppConfig,
    );
  }

  if (typeof appConfig.postInstallAction === 'string') {
    mtAppConfig.postInstallActionPath = appConfig.postInstallAction;
  }
  // if postInstallAction is an object, we need to convert it to a MothertreeActionConfig,
  // and add it to the actions array, and set the postInstallActionPath
  else if (appConfig.postInstallAction != null) {
    // add a slug to the action config
    const postInstallAction = {
      ...appConfig.postInstallAction,
      slug: 'post-install-action',
    };

    // add the action to the actions array
    convertActionConfigsToMothertreeActionConfigs(
      [postInstallAction],
      mtAppConfig,
    );

    // set the postInstallActionPath
    mtAppConfig.postInstallActionPath = makeLocalActionPath(
      postInstallAction.slug,
    );
  }

  if (appConfig.products) {
    convertProductConfigsToMothertreeProductAndVariantConfigs(
      appConfig.products,
      mtAppConfig,
    );
  }

  return mtAppConfig;
}
