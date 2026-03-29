import client from './client'

export interface UserProfile {
  username: string
  email: string
  githubRepo: string | null
  hasGithubToken: boolean
  provider: string
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

export const changePassword = (data: { currentPassword: string; newPassword: string }) =>
  client.put<{ success: boolean; message: string }>('/user/password', data)
