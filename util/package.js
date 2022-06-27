import { getPackageConfig } from './config.js'
import { request } from './request.js'

const MODULE_REGEX = /@(.*?)\/([^@]+)(?:@([0-9.]+))?([^?#]*)$/i

export async function packageFork ({ packagePath, toPackageSlug }) {
  const { orgSlug, packageSlug, packageVersionSemver } = getPackageParts(packagePath)
  const query = `
    mutation PackageFork(
      $fromOrgSlug: String
      $fromPackageSlug: String
      $fromPackageVersionSemver: String
      $toPackageSlug: String
    ) {
      packageFork(
        fromOrgSlug: $fromOrgSlug
        fromPackageSlug: $fromPackageSlug
        fromPackageVersionSemver: $fromPackageVersionSemver
        toPackageSlug: $toPackageSlug
      ) {
        id
        latestPackageVersionId
      }
    }`
  const variables = {
    fromOrgSlug: orgSlug,
    fromPackageSlug: packageSlug,
    fromPackageVersionSemver: packageVersionSemver,
    toPackageSlug
  }

  const response = await request({ query, variables })
  return response.data.data.packageFork
}

export async function packageGet () {
  const { name } = await getPackageConfig()
  const { packageSlug } = getPackageParts(name)

  const query = `
    query PackageGet($slug: String) {
      package(slug: $slug) {
        id
        latestPackageVersionId
      }
    }
  `
  const variables = { slug: packageSlug }

  const response = await request({ query, variables })
  return response.data.data.package
}

export function getPackageParts (urlOrStr) {
  const [all, orgSlug, packageSlug, packageVersionSemver, filename] = urlOrStr?.match(MODULE_REGEX) || []
  if (!all) {
    console.log('failed to parse', urlOrStr)
  }
  return all ? { orgSlug, packageSlug, packageVersionSemver, filename } : null
}
