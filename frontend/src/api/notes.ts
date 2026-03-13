import client from './client'
import axios from 'axios'

export interface NoteListItem {
  filename: string
  path: string
  pinned: boolean
  tags?: string[]
}

export interface Note {
  filename: string
  content: string
  sha: string
  tags?: string[]
}

export interface NoteCreateRequest {
  filename: string
  content: string
}

export interface NoteUpdateRequest {
  content: string
  sha: string
}

export interface SharedNote {
  filename: string
  content: string
}

export const listNotes = (sort?: string, order?: string) => {
  const params = new URLSearchParams()
  if (sort) params.set('sort', sort)
  if (order) params.set('order', order)
  const qs = params.toString()
  return client.get<NoteListItem[]>(`/notes${qs ? `?${qs}` : ''}`)
}

export const getNote = (filename: string) =>
  client.get<Note>(`/notes/${encodeURIComponent(filename)}`)

export const createNote = (data: NoteCreateRequest) =>
  client.post<Note>('/notes', data)

export const updateNote = (filename: string, data: NoteUpdateRequest) =>
  client.put<Note>(`/notes/${encodeURIComponent(filename)}`, data)

export const deleteNote = (filename: string) =>
  client.delete(`/notes/${encodeURIComponent(filename)}`)

export const searchNotes = (query: string) =>
  client.get<NoteListItem[]>(`/notes/search?q=${encodeURIComponent(query)}`)

export const pinNote = (filename: string) =>
  client.put<{ pinned: boolean }>(`/notes/${encodeURIComponent(filename)}/pin`)

export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return client.post<{ url: string }>('/notes/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const shareNote = (filename: string) =>
  client.post<{ token: string }>(`/notes/${encodeURIComponent(filename)}/share`)

export const unshareNote = (filename: string) =>
  client.delete(`/notes/${encodeURIComponent(filename)}/share`)

export const getSharedNote = (token: string) =>
  axios.get<SharedNote>(`/api/shared/${encodeURIComponent(token)}`)
