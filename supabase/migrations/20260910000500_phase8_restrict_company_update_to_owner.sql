-- Phase 8: Public Business Showcase audit
--
-- "Update own company" RLS policy checked only `id = get_my_company_id()`,
-- with no owner check at all. Any authenticated staff member (technician,
-- front desk, branch manager) could directly update the companies row -
-- including publishing/unpublishing the public showcase, rewriting its
-- contents, or changing the company name/logo. Fails "owner-control
-- verification" explicitly. Restricted to the owner, matching every other
-- company-wide setting (staff, branches, subscription) which already
-- require is_company_owner().
drop policy if exists "Update own company" on public.companies;
create policy "Owner can update own company"
  on public.companies for update
  using (id = public.get_my_company_id() and public.is_company_owner())
  with check (id = public.get_my_company_id() and public.is_company_owner());

-- Verified clean, no change needed:
-- - Public showcase SELECT policy + column-level GRANTs to anon: correct,
--   only name/logo_url/slug/showcase_* ever exposed, confirmed in Phase 1.
-- - Public showcase page (app/showcase/[slug]/page.tsx) queries only the
--   allowed columns and double-checks showcase_enabled client-side too.
-- - slug has a unique partial index, no collision risk.
--
-- Gap noted, not a bug: "public product selection" from the roadmap does
-- not exist yet - there is no table linking inventory items to the public
-- showcase, only company-level text fields (showcase_services is a plain
-- text array, not linked to real inventory/pricing). This is unbuilt
-- feature work, not something to invent without a spec.
