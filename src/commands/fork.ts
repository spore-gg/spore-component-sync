import { packageFork } from '../util/package.js'
import { apiKeyCreate } from '../util/api-key.js'
import clone from '../util/clone.js'

export default async function fork ({
    packagePath,
    toPackageSlug,
    shouldCreateFrontendFiles
  }:
  {
    packagePath: string,
    toPackageSlug: string,
    shouldCreateFrontendFiles?: boolean
  }) {
  const pkg = await packageFork({ packagePath, toPackageSlug })
  const packageVersionId = pkg.latestPackageVersionId

  const apiKeyPayload = await apiKeyCreate({ type: 'secret', sourceType: 'package', sourceId: pkg.id })

  await clone({
    packageVersionId,
    toPackageSlug,
    shouldCreateConfigFile: true,
    shouldCreateFrontendFiles,
    secretKey: apiKeyPayload.apiKey.key
  })
}
