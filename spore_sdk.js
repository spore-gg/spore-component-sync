import axios from 'axios'
import fs from 'fs'

// TODO: spore-sdk npm package
let secretKey, apiUrl

export async function setConfig (config = {}) {
  let sporeConfig, sporeSecretConfig
  try {
    sporeSecretConfig = JSON.parse(fs.readFileSync('./spore.secret.json'))
    sporeConfig = JSON.parse(fs.readFileSync('./spore.config.json'))
  } catch (err) {
    console.log('err', err)
  }

  secretKey = config.secretKey || sporeSecretConfig?.secretKey
  apiUrl = config.apiUrl || sporeConfig?.apiUrl
}

export async function componentUpsert ({ id, jsx, sass }) {
  const query = `
    mutation ComponentUpsert(
      $id: ID
      # $slug: String
      # $childComponentConfigs: JSON
      $sass: String
      # $sassMixins: String
      $jsx: String
      # $componentInstanceId: ID
    ) {
      componentUpsert(
        id: $id
        # slug: $slug
        # childComponentConfigs: $childComponentConfigs
        sass: $sass
        # sassMixins: $sassMixins
        jsx: $jsx
        # componentInstanceId: $componentInstanceId
      ) { id }
    }`

  const variables = { id, jsx, sass }
  const response = await request({ query, variables })
  return response.data.data.componentUpsert
}

export async function componentGetAll () {
  const query = `
    query ComponentGetAll($shouldFetchByDevOrgId: Boolean) {
      components(shouldFetchByDevOrgId: $shouldFetchByDevOrgId) {
        nodes {
          id
          slug
          jsx
          sass
          collection {
            slug
          }
        }
      }
    }
  `
  const variables = { shouldFetchByDevOrgId: true }

  const response = await request({ query, variables })
  return response.data.data.components
}

async function request ({ query, variables }) {
  if (!secretKey) {
    throw new Error('Must specify secretKey (use setConfig())')
  }
  const response = await axios.post(apiUrl, { query, variables }, {
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    }
  })
  // console.log('res', JSON.stringify(response.data, null, 2))
  if (response?.data?.errors?.length) {
    throw new Error('Error saving', JSON.stringify(response.data.errors))
  }
  return response
}
