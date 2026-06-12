export interface EmailSecurity {
  spoofable: string
  dmarc_policy: string
  blacklist_detections: number
  blacklist_total_list: number
  blacklist_detected_list: string[]
}

export interface VulnCount {
  critical?: number
  high?: number
  medium?: number
  low?: number
  info?: number
}

export interface NVulns {
  total?: VulnCount
  active: VulnCount
  passive: VulnCount
}

export interface LeakCategory {
  vip: number
  domain_stealer: number
  potential_stealer: number
  other_stealer: number
  general_leak: number
}

export interface NDataleak {
  total: LeakCategory
  resolved: LeakCategory
  unresolved: LeakCategory
  enumeration: number
}

export interface WAF {
  count: number
  assets: string[]
}

export interface CDN {
  count: number
  assets: string[]
}

export interface SecurityReport {
  idsummary: string
  status?: 'success' | 'error' | 'pending'
  summary_text: string
  summary_text_en: string
  risk_score: number
  creation_date: string
  last_edit: string
  domain_name: string

  servizi_esposti_score: number
  dataleak_score: number
  rapporto_leak_email_score: number
  spoofing_score: number
  open_ports_score: number
  blacklist_score: number
  vulnerability_score_active: number
  vulnerability_score_passive: number
  certificate_score: number

  n_port: Record<string, { n: number }>
  n_cert_attivi: number
  n_cert_scaduti: number
  n_asset: number
  n_similar_domains: number

  email_security: EmailSecurity
  n_dataleak: NDataleak
  n_vulns: NVulns
  waf: WAF
  cdn: CDN

  unique_ipv4: number
  unique_ipv6: number
}
