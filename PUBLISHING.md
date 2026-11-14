# Maintainer release process

Run the local tests, then publish the reviewed source to the correct repository. Wait for all applicable GitHub Actions, including HACS validation and (for the integration) hassfest, to pass with no ignored checks. Fix failures before making a full release. The integration manifest version and card package version must match their respective release tags (with an optional v prefix).

The card repository is sarn-online/uk-power-out-card (Dashboard/plugin). The companion integration repository is sarn-online/uk-power-out (Integration). They are installed separately and must not be combined into one HACS package.

Default-catalog inclusion is a separate process. Only after publishing a full release and obtaining passing validation links, use the current hacs/default PR template, add the repository to the appropriate sorted JSON list, and submit from the owner's personal account without requesting reviewers. Never mark an unverified checklist item complete or describe submission as acceptance.

Official guidance: https://contributors.home-assistant.io/marketplace/guides/catalog/
