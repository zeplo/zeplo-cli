import path from 'path'

// Get the working directory
export const getCwd = (args: any) => path.resolve(process.cwd(), args.dir || '')
