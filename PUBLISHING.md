# Publishing checklist

Repository: https://github.com/sarn-online/uk-power-out-card. No release or catalog submission has been made yet.

## 1. Choose the owner

Create or choose a personal GitHub account. Complete signup, email verification and any terms yourself. The chosen owner will maintain issues and releases. This package does not contain account credentials or private home dashboard screenshots.

## 2. Create a public repository

Recommended name: `uk-power-out-card`. Upload the contents of this directory as the repository root, including the root `power-out-card.js`, `.github`, `hacs.json`, README, NOTICE and LICENSE.

Set:

- Description: `Offline April 2026 ESEC reference rota card for Home Assistant. Exact OFF times, levels 1–18; no live outage confirmation.`
- Topics: `home-assistant`, `home-assistant-custom-card`, `hacs`, `lovelace`, `esec`, `power-outage`.
- Issues: enabled.
- Visibility: public.

MIT is the proposed code licence; the embedded public-sector data retains OGL v3.0 attribution.

## 3. Run checks

Wait for **Validate / Tests** and **Validate / HACS validation** to pass. Do not skip HACS checks with `ignore`. Fix any reported issue before submission. A local test pass does not establish a remote HACS pass.

Add the repository to your own Marketplace as a **Dashboard** custom repository, install it, reload and verify the card picker, visual editor, letter/level changes, persistence, midnight and layout. Remove your manual `/local/power-out-card.js` resource first to avoid loading the same custom element twice. Do not delete unrelated resources.

## 4. Publish v1.0.0

After the validation workflows pass, create a full GitHub release with tag `v1.0.0` (not merely a tag). Use CHANGELOG.md for the release notes. The release workflow builds/tests and attaches `power-out-card.js`. Verify that asset exists and that a clean Marketplace install succeeds.

## 5. Add the install badge

Replace `sarn-online` with the selected repository owner's login:

```markdown
[![Open in Home Assistant Marketplace](https://my.home-assistant.io/badges/marketplace_repository.svg)](https://my.home-assistant.io/redirect/marketplace_repository/?owner=sarn-online&repository=uk-power-out-card&category=plugin)
```

Once published, this link allows people to install it as a custom repository before catalog acceptance.

## 6. Submit to the shared catalog

From the repository owner's personal account:

1. Fork `hacs/default`.
2. Create a new branch from `master`.
3. Add `sarn-online/power-out-card` to the JSON list in `plugin`, in alphabetical order.
4. Open a pull request and fill the current upstream template completely.
5. Link the latest full release and a passing HACS action run with no ignored checks. Check every statement against actual results. Do not request individual reviewers.

Catalog review is external and may take months. Publication is not acceptance. Until accepted, share the custom repository install link.

Official references checked 11 November 2026:

- https://contributors.home-assistant.io/marketplace/guides/dashboard/
- https://contributors.home-assistant.io/marketplace/guides/catalog/
- https://contributors.home-assistant.io/marketplace/reference/hacs-json/
- https://contributors.home-assistant.io/marketplace/reference/validation/
