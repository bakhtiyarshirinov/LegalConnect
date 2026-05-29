import api from './axios'

export interface UploadedFile {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
}

export async function uploadFile(file: File): Promise<UploadedFile> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<UploadedFile>('/files/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}
