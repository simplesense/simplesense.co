import { describe, it, expect } from 'vitest'
import { isBlockedIpv4, isBlockedIpv6, isBlockedIp } from '../src/ip-blocklist'

describe('isBlockedIpv4', () => {
  it('blocks the cloud-metadata endpoint (169.254.169.254)', () => {
    expect(isBlockedIpv4('169.254.169.254')).toBe(true)
  })
  it('blocks loopback', () => {
    expect(isBlockedIpv4('127.0.0.1')).toBe(true)
    expect(isBlockedIpv4('127.255.255.255')).toBe(true)
  })
  it('blocks the three RFC1918 private ranges', () => {
    expect(isBlockedIpv4('10.0.0.1')).toBe(true)
    expect(isBlockedIpv4('10.255.255.255')).toBe(true)
    expect(isBlockedIpv4('172.16.0.1')).toBe(true)
    expect(isBlockedIpv4('172.31.255.255')).toBe(true)
    expect(isBlockedIpv4('192.168.0.1')).toBe(true)
    expect(isBlockedIpv4('192.168.255.255')).toBe(true)
  })
  it('does not block adjacent-but-public addresses around the 172.16/12 boundary', () => {
    expect(isBlockedIpv4('172.15.255.255')).toBe(false)
    expect(isBlockedIpv4('172.32.0.0')).toBe(false)
  })
  it('blocks CGNAT (100.64.0.0/10)', () => {
    expect(isBlockedIpv4('100.64.0.1')).toBe(true)
    expect(isBlockedIpv4('100.100.0.1')).toBe(true)
    expect(isBlockedIpv4('100.63.255.255')).toBe(false)
  })
  it('blocks 0.0.0.0/8 and the broadcast address', () => {
    expect(isBlockedIpv4('0.0.0.0')).toBe(true)
    expect(isBlockedIpv4('255.255.255.255')).toBe(true)
  })
  it('blocks multicast and reserved space', () => {
    expect(isBlockedIpv4('224.0.0.1')).toBe(true)
    expect(isBlockedIpv4('240.0.0.1')).toBe(true)
  })
  it('allows well-known real public IPs', () => {
    expect(isBlockedIpv4('8.8.8.8')).toBe(false)
    expect(isBlockedIpv4('1.1.1.1')).toBe(false)
    expect(isBlockedIpv4('93.184.216.34')).toBe(false) // example.com
  })
  it('refuses (blocks) an unparseable string rather than treating it as safe', () => {
    expect(isBlockedIpv4('not-an-ip')).toBe(true)
    expect(isBlockedIpv4('999.999.999.999')).toBe(true)
    expect(isBlockedIpv4('1.2.3')).toBe(true)
  })
  it('does not accept octal/decimal-integer disguises as a valid dotted-quad (refuses them)', () => {
    // e.g. "017700000001" (octal for 127.0.0.1) or "2130706433" (decimal for 127.0.0.1) —
    // isBlockedIpv4 only parses strict dotted-quad; anything else must be treated as unsafe.
    expect(isBlockedIpv4('2130706433')).toBe(true)
    expect(isBlockedIpv4('0x7f000001')).toBe(true)
  })
})

describe('isBlockedIpv6', () => {
  it('blocks the unspecified and loopback addresses', () => {
    expect(isBlockedIpv6('::')).toBe(true)
    expect(isBlockedIpv6('::1')).toBe(true)
  })
  it('blocks link-local (fe80::/10)', () => {
    expect(isBlockedIpv6('fe80::1')).toBe(true)
    expect(isBlockedIpv6('fe80::abcd:1234')).toBe(true)
  })
  it('blocks unique-local (fc00::/7)', () => {
    expect(isBlockedIpv6('fc00::1')).toBe(true)
    expect(isBlockedIpv6('fd12:3456::1')).toBe(true)
  })
  it('blocks multicast (ff00::/8)', () => {
    expect(isBlockedIpv6('ff02::1')).toBe(true)
  })
  it('blocks an IPv4-mapped loopback/metadata address (dotted-decimal form)', () => {
    expect(isBlockedIpv6('::ffff:127.0.0.1')).toBe(true)
    expect(isBlockedIpv6('::ffff:169.254.169.254')).toBe(true)
  })
  it('blocks the SAME mapped address in its hex-group form — the form url.hostname actually produces (regression: this bypassed a dotted-decimal-only regex)', () => {
    expect(isBlockedIpv6('::ffff:7f00:1')).toBe(true) // 127.0.0.1
    expect(isBlockedIpv6('::ffff:a9fe:a9fe')).toBe(true) // 169.254.169.254, the cloud-metadata IP
    expect(isBlockedIpv6('::ffff:a00:1')).toBe(true) // 10.0.0.1
  })
  it('blocks the deprecated IPv4-compatible form (::a.b.c.d, no ffff)', () => {
    expect(isBlockedIpv6('::7f00:1')).toBe(true) // ::127.0.0.1 in hex-group form
  })
  it('blocks a NAT64-embedded metadata/loopback address (64:ff9b::/96)', () => {
    expect(isBlockedIpv6('64:ff9b::a9fe:a9fe')).toBe(true)
    expect(isBlockedIpv6('64:ff9b::7f00:1')).toBe(true)
  })
  it('does not block a NAT64 address whose embedded IPv4 is public', () => {
    expect(isBlockedIpv6('64:ff9b::0808:0808')).toBe(false) // 8.8.8.8
  })
  it('allows a real public IPv6 address', () => {
    expect(isBlockedIpv6('2606:4700:4700::1111')).toBe(false) // Cloudflare DNS
  })
  it('refuses (blocks) an unparseable string', () => {
    expect(isBlockedIpv6('not-an-ipv6')).toBe(true)
  })
})

describe('isBlockedIp — dispatch', () => {
  it('routes a colon-containing string to the IPv6 checker', () => {
    expect(isBlockedIp('::1')).toBe(true)
    expect(isBlockedIp('2606:4700:4700::1111')).toBe(false)
  })
  it('routes a dotted string to the IPv4 checker', () => {
    expect(isBlockedIp('127.0.0.1')).toBe(true)
    expect(isBlockedIp('8.8.8.8')).toBe(false)
  })
})
