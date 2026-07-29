import { describe, it, expect } from 'vitest'
import { EntityRegistry } from '../src/entity-registry'
import { InMemoryEntityRegistryBackend } from '../src/memory-backend'

function makeRegistry(): EntityRegistry {
  return new EntityRegistry(new InMemoryEntityRegistryBackend())
}

describe('EntityRegistry', () => {
  it('registering a brand generates an id', async () => {
    const registry = makeRegistry()
    const brand = await registry.register({
      name: 'Acme',
      domains: ['acme.com'],
      marketplaces: [],
      competitorIds: [],
    })
    expect(brand.id).toBeTruthy()
    expect(typeof brand.id).toBe('string')
  })

  it('registering with an explicit id keeps it', async () => {
    const registry = makeRegistry()
    const brand = await registry.register({
      id: 'brand-1',
      name: 'Acme',
      domains: ['acme.com'],
      marketplaces: [],
      competitorIds: [],
    })
    expect(brand.id).toBe('brand-1')
  })

  it('domains are lowercased on store and matched case-insensitively by findByDomain', async () => {
    const registry = makeRegistry()
    await registry.register({
      name: 'Acme',
      domains: ['ACME.com', 'Shop.ACME.com'],
      marketplaces: [],
      competitorIds: [],
    })

    const stored = await registry.findByDomain('acme.com')
    expect(stored?.domains).toEqual(['acme.com', 'shop.acme.com'])

    expect(await registry.findByDomain('ACME.COM')).not.toBeNull()
    expect(await registry.findByDomain('Shop.Acme.Com')).not.toBeNull()
  })

  it('registering a domain already claimed by a different brand throws', async () => {
    const registry = makeRegistry()
    await registry.register({
      name: 'Acme',
      domains: ['acme.com'],
      marketplaces: [],
      competitorIds: [],
    })

    await expect(
      registry.register({
        name: 'Impostor',
        domains: ['ACME.com'],
        marketplaces: [],
        competitorIds: [],
      }),
    ).rejects.toThrow()
  })

  it('re-registering the same brand id with the same domain does not throw', async () => {
    const registry = makeRegistry()
    await registry.register({
      id: 'brand-1',
      name: 'Acme',
      domains: ['acme.com'],
      marketplaces: [],
      competitorIds: [],
    })

    await expect(
      registry.register({
        id: 'brand-1',
        name: 'Acme Renamed',
        domains: ['acme.com'],
        marketplaces: [],
        competitorIds: [],
      }),
    ).resolves.toMatchObject({ id: 'brand-1', name: 'Acme Renamed' })
  })

  it('linkCompetitors is symmetric (both sides get the other id)', async () => {
    const registry = makeRegistry()
    const a = await registry.register({
      name: 'A',
      domains: ['a.com'],
      marketplaces: [],
      competitorIds: [],
    })
    const b = await registry.register({
      name: 'B',
      domains: ['b.com'],
      marketplaces: [],
      competitorIds: [],
    })

    await registry.linkCompetitors(a.id, b.id)

    const refreshedA = await registry.getById(a.id)
    const refreshedB = await registry.getById(b.id)
    expect(refreshedA?.competitorIds).toEqual([b.id])
    expect(refreshedB?.competitorIds).toEqual([a.id])
  })

  it('linkCompetitors is idempotent (calling it twice does not duplicate the id)', async () => {
    const registry = makeRegistry()
    const a = await registry.register({
      name: 'A',
      domains: ['a.com'],
      marketplaces: [],
      competitorIds: [],
    })
    const b = await registry.register({
      name: 'B',
      domains: ['b.com'],
      marketplaces: [],
      competitorIds: [],
    })

    await registry.linkCompetitors(a.id, b.id)
    await registry.linkCompetitors(a.id, b.id)

    const refreshedA = await registry.getById(a.id)
    const refreshedB = await registry.getById(b.id)
    expect(refreshedA?.competitorIds).toEqual([b.id])
    expect(refreshedB?.competitorIds).toEqual([a.id])
  })

  it('linkCompetitors throws for an unknown id', async () => {
    const registry = makeRegistry()
    const a = await registry.register({
      name: 'A',
      domains: ['a.com'],
      marketplaces: [],
      competitorIds: [],
    })

    await expect(registry.linkCompetitors(a.id, 'nonexistent')).rejects.toThrow()
    await expect(registry.linkCompetitors('nonexistent', a.id)).rejects.toThrow()
  })

  it('linkCompetitors throws when brandId === competitorId', async () => {
    const registry = makeRegistry()
    const a = await registry.register({
      name: 'A',
      domains: ['a.com'],
      marketplaces: [],
      competitorIds: [],
    })

    await expect(registry.linkCompetitors(a.id, a.id)).rejects.toThrow()
  })

  it('all() returns everything registered', async () => {
    const registry = makeRegistry()
    await registry.register({
      name: 'A',
      domains: ['a.com'],
      marketplaces: [],
      competitorIds: [],
    })
    await registry.register({
      name: 'B',
      domains: ['b.com'],
      marketplaces: [],
      competitorIds: [],
    })

    const all = await registry.all()
    expect(all.map((b) => b.name).sort()).toEqual(['A', 'B'])
  })

  it('getById returns null for an unknown id', async () => {
    const registry = makeRegistry()
    expect(await registry.getById('nonexistent')).toBeNull()
  })
})
