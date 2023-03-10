#!/usr/bin/env -S node --experimental-modules --experimental-import-meta-resolve --experimental-network-imports --no-warnings
// NOTE: `#!/usr/bin/env -S node` will break Windows (the -S). It screws w/ how npm generates ps1/cmd files (it looks at first word after /usr/bin/env)
// Unfortunately the -S is necessary for linux to parse the additional flags
// TODO: figure out a solution that can work for both
import 'reflect-metadata'

import { Argument, program } from 'commander'
import { Command } from './util/command.js'
import truffleCli from '../package.json' assert { type: 'json' }
import { readCliConfig, registerCliConfig } from './util/config.js'
import { defaultCliConfig } from './assets/default-config.js'
import { actionLoader } from './util/action-loader.js'

program
  .name(truffleCli.name)
  .description(truffleCli.description)
  .version(truffleCli.version, '-v, --version')
  .option('-p, --profile <name>', 'The profile from your Truffle config file to use.')
  .option('--apiUrl <url>', `The Mycelium API URL to use, default: "${defaultCliConfig.apiUrl}"`)
  .option('--org <org-id>', 'The id of the org to use for this command.')

program.addCommand(
  new Command('login')
    .description('Login in to truffle.')
    .argument('[email]', 'Email to login with')
    .argument('[password]', 'Password to login with')
    .action(actionLoader('commands/login/login.js'))
)

program.addCommand(
  new Command('auth')
    .description('Set your API Key.')
    .argument('<secret-key>', 'Your API Key.')
    .action(async (secretKey: string) => {
      const { default: auth } = await
      import('./commands/auth.js')
      await auth({ secretKey })
    }
    )
)

program.addCommand(
  new Command('org')
    .description('Manage orgs')
    .addCommand(
      new Command('use')
        .description('Set the current org to use.')
        .argument('<slug-or-id>', 'The slug or the id of the org to use.')
        .action(actionLoader('commands/org/use.js'))
    )
    .addCommand(
      new Command('create')
        .description('Creates a new org')
        .argument('<org-name>', 'Name of the org to create')
        .action(actionLoader('commands/org/create.js'))
    )
    .addCommand(
      new Command('join')
        .description('Join an existing org')
        .action(actionLoader('commands/org/join.js'))
    )
)

program.addCommand(
  new Command('user')
    .description('Manage users')
    .addCommand(
      new Command('create')
        .description('Creates a new user')
        .argument('[email]', 'Email of the user to create')
        .argument('[password]', 'Password of the user to create')
        .action(actionLoader('commands/user/create.js'))
    )
)

program.addCommand(
  new Command('whoami')
    .description('Check your authentication status')
    .alias('me')
    .action(actionLoader('commands/whoami.js'))
)

program.addCommand(
  new Command('clone')
    .description('Clone an existing package.')
    .argument('<package-path>', 'The name of the package to clone.')
    .argument('<package-name>', 'The name of the new package.')
    .option('--frontend', 'Clone the frontend project.', false)
    .action(async (packagePath, packageName, options) => {
      const { default: clone } = await
      import('./util/clone.js')

      await clone({
        packagePath,
        toPackageSlug: packageName,
        shouldCreateConfigFile: true,
        shouldCreateFrontendFiles: options.frontend
      })
    })
)

program.addCommand(
  new Command('create')
    .description('Create a new package.')
    .argument('<package-name>', 'The name of the package to create.')
    .option('--frontend', 'Create a frontend project.', false)
    .action(async (packageName, options) => {
      const { default: create } = await
      import('./commands/create.js')

      await create({
        toPackageSlug: packageName,
        shouldCreateFrontendFiles: options.frontend
      })
    })
)

program.addCommand(
  new Command('frontend')
    .description('Work with a frontend project.')
    .addCommand(
      new Command('pull')
        .description('Pull the frontend project associated with this package.')
        .action(actionLoader('./commands/frontend/pull.js'))
    )
    .addCommand(
      new Command('dev')
      .description('Starts the frontend dev server in the current directory.')
      .action(actionLoader('./commands/frontend/dev.js'))
    )
    .addCommand(
      new Command('deploy')
      .description('Deploys the frontend project associated with this package.')
      .action(actionLoader('./commands/frontend/deploy.js'))
    )
)

program.addCommand(
  new Command('deploy')
    .description('Deploy your package to production.')
    .option('--frontend', 'Deploy the frontend project.', false)
    .action(async (options) => {
      const { deploy } = await
      import('./commands/deploy.js')
      
      await deploy({
        // only update the domain if they're deploying the frontend
        shouldUpdateDomain: options.frontend,
        shouldOnlyUploadConfig: !options.frontend
      })
    })
)

program.addCommand(
  new Command('fork')
    .description('Fork an existing package.')
    .argument('<package-path>', 'The name of the package to fork.')
    .argument('<package-name>', 'The name of the new package.')
    .option('--frontend', 'Clone the frontend project.', false)
    .action(async (packagePath, packageName, options) => {
      const { default: fork } = await
      import('./commands/fork.js')

      await fork({
        packagePath,
        toPackageSlug: packageName,
        shouldCreateFrontendFiles: options.frontend
      })
    })
)

program.addCommand(
  new Command('get-package-token')
    .description('Get a package-install scoped user access token for testing.')
    .action(actionLoader('commands/package-token.js'))
)

program.addCommand(
  new Command('regenerate-api-key')
    .description('Request a new API Key.')
    .action(actionLoader('commands/regenerate.js'))
)

program.addCommand(
  new Command('install')
    .description('Install a new package.')
    .argument('<package-path>', 'The name of the package to install.')
    .option('-f, --force', 'Force install the package.', false)
    .action(async (packagePath, { force }) => {
      const { default: install } = await
      import('./commands/install.js')
      await install({
        installedPackageVersionPath: packagePath,
        isForceInstall: force
      })
    })
)

program.addCommand(
  new Command('pull')
    .description('Fetch the upstream package.')
    .action(actionLoader('commands/pull.js'))
)

program.addCommand(
  new Command('ls')
    .description('List existing packages.')
    .action(actionLoader('commands/list.js'))
)

program.addCommand(
  new Command('functions')
    .description('Manage Truffle Functions')
    .addCommand(
      new Command('deploy')
        .description('Deploy functions.')
        .option('-a, --all', 'Deploy all functions.', false)
        .argument('[function-name]', 'The name of the function to deploy.')
        .action(async (functionName, { all }) => {
          const { default: deploy } = await import('./commands/functions/deploy.js')
          await deploy({
            all,
            functionName
          })
        }).on('--help', () => {
          console.log('  Examples:')
          console.log()
          console.log('    $ truffle functions deploy')
          console.log('    $ truffle functions deploy --all')
          console.log('    $ truffle functions deploy myFunction')
        }))
    .addCommand(
      new Command('logs')
        .description('View logs for deployed Truffle Functions.')
        .option('-a, --all', 'View logs for all functions.', false)
        .argument('[function-name]', 'The name of the function to view logs for.')
        .action(async (functionName, { all }) => {
          const { default: logs } = await import('./commands/functions/logs.js')
          await logs({
            all,
            functionName
          })
        }).on('--help', () => {
          console.log('  Examples:')
          console.log()
          console.log('    $ truffle functions logs')
          console.log('    $ truffle functions logs --all')
          console.log('    $ truffle functions logs myFunction')
        }))
)

program.addCommand(
  new Command('describe')
    .description('Print data about your current package.')
    .addArgument(
      new Argument('[model]')
        .choices([
          'subscriptions',
          'topics',
          'package'
        ])
    )
    .action(async (model) => {
      const { default: describe } = await
      import('./commands/describe.js')
      await describe({ model })
    })
)

if (2 in process.argv === false) {
  program.help()
}

(async () => {
  // load the cli config into memory
  const cliConfig = readCliConfig()
  registerCliConfig(cliConfig)

  await program.parseAsync(process.argv)
})()
