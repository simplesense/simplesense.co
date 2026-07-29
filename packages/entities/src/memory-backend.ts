import type { Brand, EntityRegistryBackend } from './types'

/** In-process backend — the default for tests and short-lived runs. Nothing persists
 *  past the process, which is exactly right for a unit test and exactly wrong for
 *  production use (a future DB-backed implementation is a follow-up). */
export class InMemoryEntityRegistryBackend implements EntityRegistryBackend {
  private readonly brands = new Map<string, Brand>()

  async upsert(brand: Brand): Promise<void> {
    this.brands.set(brand.id, brand)
  }

  async getById(id: string): Promise<Brand | null> {
    return this.brands.get(id) ?? null
  }

  async findByDomain(domain: string): Promise<Brand | null> {
    const needle = domain.toLowerCase()
    for (const brand of this.brands.values()) {
      if (brand.domains.includes(needle)) {
        return brand
      }
    }
    return null
  }

  async all(): Promise<Brand[]> {
    return [...this.brands.values()]
  }
}
