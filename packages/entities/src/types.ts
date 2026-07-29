/**
 * S7 Entity registry (COMPOUND_ENGINEERING_PLAN.md §3): "brands, domains, marketplaces,
 * competitor sets; keys every module's outputs so cross-module intelligence compounds."
 * A `Brand` is the shared identity every intelligence module (M1, M2, M3, M5, M8, …) can
 * key its findings against, so a domain seen by one module resolves to the same entity
 * another module already knows about.
 */
export interface Brand {
  id: string
  name: string
  /** Lowercase, no protocol/path, e.g. "example.com" or "shop.example.com". */
  domains: string[]
  /** Free-form lowercase tags, e.g. "amazon", "etsy" — not validated against a fixed enum. */
  marketplaces: string[]
  /** Ids of other `Brand` records this brand competes with. */
  competitorIds: string[]
}

/**
 * Storage seam — `EntityRegistry` is the public API; a backend is just persistence.
 */
export interface EntityRegistryBackend {
  upsert(brand: Brand): Promise<void>
  getById(id: string): Promise<Brand | null>
  findByDomain(domain: string): Promise<Brand | null>
  all(): Promise<Brand[]>
}
