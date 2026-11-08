export interface AnnouncementFeedItem {
  id: number
  title: string
  summary: string | null
  content: string
  category: string
  priority: 'normal' | 'important' | 'urgent'
  published_at: string | null
  expires_at: string | null
  author: { id: number; name: string }
}

export interface AnnouncementDetail extends AnnouncementFeedItem {
  audience_scope: 'all' | 'custom'
  audience_summary: string
  targets: {
    roles: Array<{ id: number; code: string; name: string }>
    programs: Array<{ id: number; code: string; name: string }>
    year_levels: Array<{ id: number; level: number; name: string }>
    sections: Array<{ id: number; code: string; name: string | null }>
    users: Array<{ id: number; name: string }>
  }
}

export interface AnnouncementFeedPagination {
  current_page: number
  last_page: number
  per_page: number
  total: number
}
