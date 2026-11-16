/** Boost autoskills registry ids when queries use legacy rsc vocabulary or plain language. */
const REGISTRY_BOOSTS = [
  { terms: ['postgres', 'postgresdb', 'postgresql', 'base de datos'], ids: ['prisma-database-setup', 'supabase-postgres-best-practices', 'neon-postgres'], weight: 55 },
  { terms: ['nextjs', 'next.js', 'next'], ids: ['clerk-nextjs-patterns', 'tanstack-start'], weight: 45 },
  { terms: ['react'], ids: ['frontend-design', 'vercel-react-best-practices'], weight: 35 },
  { terms: ['vitest', 'jest', 'testing', 'test'], ids: ['vitest', 'python-testing-patterns'], weight: 25 },
  { terms: ['human', 'humano', 'humana', 'unslop', 'robotico', 'natural'], ids: ['adev-writing-guide'], weight: 50 },
  { terms: ['pagina', 'página', 'website', 'web', 'landing'], ids: ['frontend-design', 'seo', 'web-perf'], weight: 30 },
];

function queryTerms(query) {
  return String(query).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean);
}

export function applyRegistryBoosts(ranked, query) {
  const terms = queryTerms(query);
  if (!terms.length) return ranked;
  const byId = new Map(ranked.map((row) => [row.id, { ...row }]));
  for (const rule of REGISTRY_BOOSTS) {
    const hit = rule.terms.some((needle) => terms.some((t) => t.includes(needle) || needle.includes(t)));
    if (!hit) continue;
    for (const id of rule.ids) {
      const prev = byId.get(id) || { id, score: 0 };
      prev.score += rule.weight;
      byId.set(id, prev);
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}