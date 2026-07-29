import { randomUUID } from 'node:crypto'
import type { Brand, EntityRegistryBackend } from './types'

/** Public API for S7 — wraps a storage backend with id generation, domain
 *  normalization/uniqueness, and the symmetric competitor-linking rules, so no
 *  backend implementation has to get any of that right itself. */
export class EntityRegistry {
  constructor(private readonly backend: EntityRegistryBackend) {}

  async register(input: Omit<Brand, 'id'> & { id?: string }): Promise<Brand> {
    const id = input.id ?? randomUUID()
    const domains = input.domains.map((domain) => domain.toLowerCase())

    for (const domain of domains) {
      const existing = await this.backend.findByDomain(domain)
      if (existing !== null && existing.id !== id) {
        throw new Error(`Domain "${domain}" is already registered to brand "${existing.id}"`)
      }
    }

    const brand: Brand = {
      id,
      name: input.name,
      domains,
      marketplaces: input.marketplaces,
      competitorIds: input.competitorIds,
    }
    await this.backend.upsert(brand)
    return brand
  }

  async getById(id: string): Promise<Brand | null> {
    return this.backend.getById(id)
  }

  async findByDomain(domain: string): Promise<Brand | null> {
    return this.backend.findByDomain(domain.toLowerCase())
  }

  async linkCompetitors(brandId: string, competitorId: string): Promise<void> {
    if (brandId === competitorId) {
      throw new Error(`A brand cannot compete with itself (id "${brandId}")`)
    }

    const brand = await this.backend.getById(brandId)
    if (brand === null) {
      throw new Error(`No brand registered with id "${brandId}"`)
    }
    const competitor = await this.backend.getById(competitorId)
    if (competitor === null) {
      throw new Error(`No brand registered with id "${competitorId}"`)
    }

    await this.backend.upsert({
      ...brand,
      competitorIds: dedupedAppend(brand.competitorIds, competitorId),
    })
    await this.backend.upsert({
      ...competitor,
      competitorIds: dedupedAppend(competitor.competitorIds, brandId),
    })
  }

  async all(): Promise<Brand[]> {
    return this.backend.all()
  }
}

function dedupedAppend(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids : [...ids, id]
}
