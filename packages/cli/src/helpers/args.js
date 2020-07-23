import path from 'path'

// Get the environment file (e.g. .env)
export const getEnvFile = (args, config) =>
  args.environment_file || args.env_file || config.environment_file

// Get the working directory
export const getCwd = args => path.resolve(process.cwd(), args.dir || '')
