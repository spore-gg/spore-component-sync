import { describe, expect, it } from 'vitest';
import {
  convertActionConfigsToMothertreeActionConfigs,
  convertAppConfigToMothertreeConfig,
  convertProductConfigsToMothertreeProductAndVariantConfigs,
  validateAppConfig,
} from '../../src/util/app-config';

describe('app-config', () => {
  describe('validateAppConfig', () => {
    it('should allow a valid config', () => {
      const config = {
        path: '@truffle/test-app',
        name: 'test-app',
        cliVersion: '0.0.0',
        embeds: [
          {
            slug: 'test-embed',
            url: 'https://example.com',
            contentPageType: 'youtubeVideo',
          },
        ],
        countables: [
          {
            slug: 'channel-points',
            name: 'Channel Points',
            category: 'currency-virtual',
            decimalPlaces: 0,
          },
        ],
        products: [
          {
            slug: 'test-product',
            name: 'Test Product',
            category: 'test-category',
            variants: [
              {
                slug: 'test-variant',
                price: 100,
              },
            ],
          },
        ],
      };

      expect(validateAppConfig(config)).toMatchSnapshot();
    });

    it('should throw an error for an invalid config', () => {
      const config = {
        path: '@truffle/test-app',
        name: 'test-app',
        // missing cliVersion
      };

      expect(() => validateAppConfig(config)).toThrowErrorMatchingSnapshot();
    });
  });

  describe('convertActionConfigsToMothertreeActionConfigs', () => {
    it('should convert a basic webhook action', () => {
      const actionConfigs = [
        {
          slug: 'test-action',
          operation: 'webhook',
          url: 'https://example.com',
        },
      ];
      const mtAppConfig = {
        actions: [],
      };

      convertActionConfigsToMothertreeActionConfigs(actionConfigs, mtAppConfig);

      expect(mtAppConfig.actions).toMatchSnapshot();
    });

    it('should convert a basic webhook action with data', () => {
      const actionConfigs = [
        {
          slug: 'test-action',
          operation: 'webhook',
          url: 'https://example.com',
          data: {
            some: 'data',
          },
        },
      ];
      const mtAppConfig = {
        actions: [],
      };

      convertActionConfigsToMothertreeActionConfigs(actionConfigs, mtAppConfig);

      expect(mtAppConfig.actions).toMatchSnapshot();
    });

    it('should convert a basic workflow action', () => {
      const actionConfigs = [
        {
          slug: 'test-action',
          operation: 'workflow',
          strategy: 'sequential',
          actions: [
            './_Action/action-1',
            {
              slug: 'action-2',
              operation: 'webhook',
              url: 'https://example.com',
            },
          ],
        },
      ];
      const mtAppConfig = {
        actions: [],
      };

      convertActionConfigsToMothertreeActionConfigs(actionConfigs, mtAppConfig);

      expect(mtAppConfig.actions).toMatchSnapshot();
    });

    it('should convert a basic exchange action', () => {
      const actionConfigs = [
        {
          slug: 'test-action',
          operation: 'exchange',
          assets: [
            {
              path: './_Asset/test-asset',
              quantity: 1,
            },
          ],
        },
      ];
      const mtAppConfig = {
        actions: [],
      };

      convertActionConfigsToMothertreeActionConfigs(actionConfigs, mtAppConfig);

      expect(mtAppConfig.actions).toMatchSnapshot();
    });

    it('should convert a basic apply-powerup action with a powerup path', () => {
      const actionConfigs = [
        {
          slug: 'test-action',
          operation: 'apply-powerup',
          powerup: '@truffle/app/_Powerup/test-powerup',
          targetType: 'test-target-type',
          targetId: 'test-target-id',
          ttlSeconds: 60,
        },
      ];
      const mtAppConfig = {
        actions: [],
      };

      convertActionConfigsToMothertreeActionConfigs(actionConfigs, mtAppConfig);

      expect(mtAppConfig.actions).toMatchSnapshot();
    });

    it('should convert a basic apply-powerup action with a powerup object', () => {
      const actionConfigs = [
        {
          slug: 'test-action',
          operation: 'apply-powerup',
          powerup: {
            slug: 'test-powerup',
            name: 'Test Powerup',
          },
          targetType: 'test-target-type',
          targetId: 'test-target-id',
          ttlSeconds: 60,
        },
      ];
      const mtAppConfig = {
        powerups: [],
        actions: [],
      };

      convertActionConfigsToMothertreeActionConfigs(actionConfigs, mtAppConfig);

      expect(mtAppConfig).toMatchSnapshot();
    });
  });

  describe('convertProductConfigsToMothertreeProductAndVariantConfigs', () => {
    it('should convert a basic product', () => {
      const productConfigs = [
        {
          slug: 'test-product',
          name: 'Test Product',
          category: 'test-category',
          variants: [
            {
              slug: 'test-variant',
              price: 100,
            },
          ],
        },
      ];
      const mtAppConfig = {
        products: [],
        productVariants: [],
        actions: [],
      };

      convertProductConfigsToMothertreeProductAndVariantConfigs(
        productConfigs,
        mtAppConfig,
      );

      expect(mtAppConfig).toMatchSnapshot();
    });

    it('should convert a product with a variant with an action', () => {
      const productConfigs = [
        {
          slug: 'test-product',
          name: 'Test Product',
          category: 'test-category',
          variants: [
            {
              slug: 'test-variant',
              price: 100,
              action: {
                slug: 'test-action',
                operation: 'webhook',
                url: 'https://example.com',
              },
            },
          ],
        },
      ];
      const mtAppConfig = {
        products: [],
        productVariants: [],
        actions: [],
      };

      convertProductConfigsToMothertreeProductAndVariantConfigs(
        productConfigs,
        mtAppConfig,
      );

      expect(mtAppConfig).toMatchSnapshot();
    });
  });

  describe('convertAppConfigToMothertreeConfig', () => {
    it('should convert a basic app config', () => {
      const appConfig = {
        path: '@truffle/test-app',
        name: 'test-app',
        cliVersion: '0.0.0',
        embeds: [
          {
            slug: 'test-embed',
            url: 'https://example.com',
            contentPageType: 'youtubeVideo',
          },
        ],
        actions: [
          {
            slug: 'test-action',
            operation: 'webhook',
            url: 'https://example.com',
          },
        ],
        countables: [
          {
            slug: 'channel-points',
            name: 'Channel Points',
            category: 'currency-virtual',
            decimalPlaces: 0,
          },
        ],
        products: [
          {
            slug: 'test-product',
            name: 'Test Product',
            category: 'test-category',
            variants: [
              {
                slug: 'test-variant',
                price: 100,
              },
            ],
          },
        ],
      };

      expect(convertAppConfigToMothertreeConfig(appConfig)).toMatchSnapshot();
    });

    it('should define a postInstallActionPath for a postInstallAction that is defined as a path', () => {
      const appConfig = {
        path: '@truffle/test-app',
        name: 'test-app',
        cliVersion: '0.0.0',
        postInstallAction: './_Action/post-install',
      };

      expect(
        convertAppConfigToMothertreeConfig(appConfig).postInstallActionPath,
      ).toBe(appConfig.postInstallAction);
    });

    it('should convert a postInstallAction that is defined as an action object', () => {
      const appConfig = {
        path: '@truffle/test-app',
        name: 'test-app',
        cliVersion: '0.0.0',
        postInstallAction: {
          operation: 'webhook',
          url: 'https://example.com',
        },
      };

      expect(convertAppConfigToMothertreeConfig(appConfig)).toMatchSnapshot();
    });
  });
});
