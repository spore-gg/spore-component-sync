import { getApiUrl, getCliConfig, writeCliConfig } from '../../util/config.js';
import { createOrg } from '../../util/org.js';

export default async function (orgName: string) {
  console.log(`Creating org ${orgName}`);

  const newOrg = await createOrg({ name: orgName })

  console.log('New org:', newOrg);

  const cliConfig = getCliConfig()
  const apiUrl = getApiUrl()
  cliConfig.currentOrgs[apiUrl] = newOrg.id
  writeCliConfig(cliConfig)
  
  console.log(`Now using org ${newOrg.id} for API "${apiUrl}"`)
}
