
export interface AuthArgs {
  t?: string
  token?: string
}

export interface GlobalArgs {
  t?: string
  token?: string
  workspace?: string
  w?: string
  quiet?: boolean
  q?: boolean
  json?: boolean
  debug?: boolean
  ignoreUpdates?: boolean
}

export interface BasicConfig {
  user: {
    defaultWorkspace: string
  }
  cli: {
    lastUpdateCheck: number
  }
}

export interface AuthConfig {
  credentials: Record<string, AuthConfigCredential>
  defaultAuth: string|null
}

export interface AuthConfigCredential {
  type: 'jwt'|'token'
  token: string
}
