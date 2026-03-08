import client from './client'

export interface NoteListItem {
  filename: string
  path: string
}

export interface Note {
  filename: string
  content: string
  sha: string
}

export interface NoteCreateRequest {
  filename: string
  content: string
}

export interface NoteUpdateRequest {
  content: string
  sha: string
}

export const listNotes = () =>
  client.get<NoteListItem[]>('/notes')

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
