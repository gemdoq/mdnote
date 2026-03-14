import client from './client'

export interface UserProfile {
  username: string
  email: string
  githubRepo: string | null
  hasGithubToken: boolean
}

export interface GitHubSettingsRequest {
  githubToken: string
  githubRepo: string
}

export const getProfile = () =>
  client.get<UserProfile>('/user/me')

export const updateGitHubSettings = (data: GitHubSettingsRequest) =>
  client.put('/user/github-settings', data)

export const testGithubConnection = () =>
  client.get('/user/github/test')
