import type {
  DeveloperProfile,
  ExtractedHiringSignal,
  GapAnalysisResult,
  RawCareerSource,
  RecruiterLensResult,
  ResumeContextMappingRequest,
  ResumeContextMappingResult,
  RoleBaseline,
  DbCategory,
  PostWithMeta,
  PostWithComments,
  DbPost
} from "../../shared/types";

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {})
    },
    ...options
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? `Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function loadSampleData() {
  return fetchJson<{ sources: RawCareerSource[] }>("/api/load-sample-data", {
    method: "POST"
  });
}

export function getSources() {
  return fetchJson<{ sources: RawCareerSource[] }>("/api/sources");
}

export function getSignals() {
  return fetchJson<{ signals: ExtractedHiringSignal[] }>("/api/signals");
}

export function getBaselines() {
  return fetchJson<{ baselines: RoleBaseline[] }>("/api/baselines");
}

export function extractSignals() {
  return fetchJson<{ signals: ExtractedHiringSignal[] }>("/api/extract-signals", {
    method: "POST",
    body: JSON.stringify({ useGemini: true })
  });
}

export function buildBaseline() {
  return fetchJson<{ baselines: RoleBaseline[] }>("/api/build-baseline", {
    method: "POST"
  });
}

export function analyzeProfile(profile: DeveloperProfile) {
  return fetchJson<{ result: GapAnalysisResult; baseline: RoleBaseline }>("/api/analyze-profile", {
    method: "POST",
    body: JSON.stringify(profile)
  });
}

export function refactorIntroduction(profile: DeveloperProfile) {
  return fetchJson<{ result: RecruiterLensResult; baseline: RoleBaseline }>(
    "/api/refactor-introduction",
    {
      method: "POST",
      body: JSON.stringify(profile)
    }
  );
}

export function mapResumeContext(request: ResumeContextMappingRequest) {
  return fetchJson<ResumeContextMappingResult>("/api/map-resume-context", {
    method: "POST",
    body: JSON.stringify(request)
  });
}

export function getCategories() {
  return fetchJson<{ categories: DbCategory[] }>('/api/categories')
}

export function getPosts(params?: { category?: string; q?: string }) {
  const qs = new URLSearchParams()
  if (params?.category) qs.set('category', params.category)
  if (params?.q) qs.set('q', params.q)
  const query = qs.toString() ? `?${qs}` : ''
  return fetchJson<{ posts: PostWithMeta[] }>(`/api/posts${query}`)
}

export function getPost(id: string | number) {
  return fetchJson<PostWithComments>(`/api/posts/${id}`)
}

export function createPost(title: string, content: string, category_id: number, image_url?: string) {
  return fetchJson<DbPost>('/api/posts', {
    method: 'POST',
    body: JSON.stringify({ title, content, category_id, image_url })
  })
}

export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}))
    throw new Error((payload as { error?: string }).error ?? `Upload failed: ${res.status}`)
  }
  const data = await res.json() as { url: string }
  return data.url
}

export function addComment(postId: string | number, content: string) {
  return fetchJson<{ id: number; content: string; created_at: string }>(
    `/api/posts/${postId}/comments`,
    { method: 'POST', body: JSON.stringify({ content }) }
  )
}

export function togglePostLike(postId: string | number) {
  return fetchJson<{ liked: boolean }>(`/api/posts/${postId}/like`, { method: 'POST' })
}
