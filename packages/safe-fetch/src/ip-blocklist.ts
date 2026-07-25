/**
 * SSRF defense, layer 1: is a (already DNS-resolved, literal) IP address one we should
 * never let the scanner connect to? Ranges per IANA special-purpose registries —
 * includes the cloud-metadata endpoint (169.254.169.254 falls inside link-local) since
 * that's the highest-value SSRF target in practice. Pure, no I/O — takes a literal IP
 * string, never a hostname (hostname -> IP resolution happens one layer up, in
 * `safe-fetch.ts`, specifically so this function can't be fooled by a hostname that
 * *looks* safe but resolves somewhere else).
 */

interface Cidr4 {
  base: number
  maskBits: number
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let n = 0
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null
    const v = Number(p)
    if (v > 255) return null
    n = (n << 8) | v
  }
  return n >>> 0
}

function cidr4(range: string): Cidr4 {
  const [addr, bits] = range.split('/')
  const base = ipv4ToInt(addr!)
  if (base === null) throw new Error(`invalid CIDR base: ${range}`)
  return { base, maskBits: Number(bits) }
}

// IANA IPv4 Special-Purpose Address Registry — loopback, private, link-local (incl.
// cloud metadata 169.254.169.254), CGNAT, documentation/test ranges, multicast, reserved.
const BLOCKED_IPV4_RANGES = [
  '0.0.0.0/8',
  '10.0.0.0/8',
  '100.64.0.0/10',
  '127.0.0.0/8',
  '169.254.0.0/16',
  '172.16.0.0/12',
  '192.0.0.0/24',
  '192.0.2.0/24',
  '192.168.0.0/16',
  '198.18.0.0/15',
  '198.51.100.0/24',
  '203.0.113.0/24',
  '224.0.0.0/4',
  '240.0.0.0/4',
  '255.255.255.255/32',
].map(cidr4)

export function isBlockedIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip)
  if (n === null) return true // unparseable — refuse rather than guess it's safe
  return BLOCKED_IPV4_RANGES.some(({ base, maskBits }) => {
    const mask = maskBits === 0 ? 0 : (0xffffffff << (32 - maskBits)) >>> 0
    return (n & mask) === (base & mask)
  })
}

/**
 * Expands IPv6 shorthand ("::1", "fe80::1") to 8 groups of 4 hex digits, first
 * rewriting a trailing IPv4-dotted tail (the "::ffff:169.254.169.254" style some
 * callers pass directly) into its 2-hex-group equivalent so every downstream check
 * operates on ONE canonical hex-group representation. This matters because
 * `url.hostname` (safe-fetch.ts's only source of an IPv6 literal) always yields the
 * RFC 5952 hex-group serialization — `::ffff:169.254.169.254` becomes
 * `::ffff:a9fe:a9fe` before this function ever sees it — so a check gated on spotting
 * a dotted tail in the *input string* would never fire for real traffic. Returns null
 * if invalid.
 */
function expandIpv6(ip: string): string[] | null {
  const dottedTail = ip.match(/^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/)
  let normalized = ip
  if (dottedTail) {
    const v4 = ipv4ToInt(dottedTail[2]!)
    if (v4 === null) return null
    const hex = v4.toString(16).padStart(8, '0')
    normalized = `${dottedTail[1]}${hex.slice(0, 4)}:${hex.slice(4)}`
  } else if (ip.includes('.')) {
    return null // a dot outside a recognized trailing-IPv4 position — not valid IPv6
  }
  const parts = normalized.split('::')
  if (parts.length > 2) return null
  const head = parts[0] === '' ? [] : parts[0]!.split(':')
  const tail = parts.length === 2 ? (parts[1] === '' ? [] : parts[1]!.split(':')) : []
  if (parts.length === 1 && head.length !== 8) return null
  const missing = 8 - head.length - tail.length
  if (missing < 0) return null
  const groups = [...head, ...Array(parts.length === 2 ? missing : 0).fill('0'), ...tail]
  if (groups.length !== 8) return null
  if (!groups.every((g) => /^[0-9a-fA-F]{1,4}$/.test(g))) return null
  return groups.map((g) => g.padStart(4, '0').toLowerCase())
}

function hexGroupsToIpv4(hi: string, lo: string): string {
  const h = Number.parseInt(hi, 16)
  const l = Number.parseInt(lo, 16)
  return [h >> 8, h & 0xff, l >> 8, l & 0xff].join('.')
}

/**
 * An embedded IPv4 address inside an IPv6 literal — IPv4-mapped (`::ffff:0:0/96`, the
 * form real dual-stack sockets treat as the plain IPv4 address on the wire, RFC 3493
 * §3.7), the deprecated IPv4-compatible form (`::0:0/96`, no `ffff`), or NAT64
 * (`64:ff9b::/96`, RFC 6052). Checked unconditionally on the expanded hex groups —
 * never gated on which textual form the caller used — because that per-form gating is
 * exactly what let `::ffff:a9fe:a9fe` (the hex form `url.hostname` always produces)
 * slip past the original dotted-decimal-only regex.
 */
function embeddedIpv4(groups: string[]): string | null {
  const first5Zero = groups.slice(0, 5).every((g) => g === '0000')
  if (first5Zero && (groups[5] === 'ffff' || groups[5] === '0000')) {
    return hexGroupsToIpv4(groups[6]!, groups[7]!)
  }
  if (
    groups[0] === '0064' &&
    groups[1] === 'ff9b' &&
    groups.slice(2, 6).every((g) => g === '0000')
  ) {
    return hexGroupsToIpv4(groups[6]!, groups[7]!)
  }
  return null
}

export function isBlockedIpv6(ip: string): boolean {
  const groups = expandIpv6(ip.toLowerCase())
  if (!groups) return true // unparseable — refuse

  const isZero = (gs: string[]) => gs.every((g) => g === '0000')
  if (isZero(groups)) return true // :: (unspecified)
  if (isZero(groups.slice(0, 7)) && groups[7] === '0001') return true // ::1 (loopback)
  if (groups[0]!.startsWith('fe8') || groups[0]!.startsWith('fe9')) return true // fe80::/10 (partial)
  if (groups[0]!.startsWith('fea') || groups[0]!.startsWith('feb')) return true // fe80::/10 (rest)
  const firstByte = Number.parseInt(groups[0]!.slice(0, 2), 16)
  if (firstByte >= 0xfc && firstByte <= 0xfd) return true // fc00::/7 (unique local)
  if (firstByte >= 0xff) return true // ff00::/8 (multicast)

  const v4 = embeddedIpv4(groups)
  if (v4 !== null) return isBlockedIpv4(v4)

  return false
}

/** Dispatches on address family. `net.isIP()`-style callers should pass the literal, not a hostname. */
export function isBlockedIp(ip: string): boolean {
  return ip.includes(':') ? isBlockedIpv6(ip) : isBlockedIpv4(ip)
}
