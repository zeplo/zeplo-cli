export function getWorkspace (args: any) {
  const [workspace] = (args.workspace || args.dev || 'default').split(':')
  return workspace
}
