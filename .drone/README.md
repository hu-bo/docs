Drone CI multi-app configuration

Usage:

- The repository root `.drone.yml` uses bitsbeats/drone-tree-config to dispatch to per-app `.drone.yml` files.
- Set repository secrets in Drone:
  - `DRONE_TREE_SECRET` - shared secret between Drone and drone-tree-config
  - `GITHUB_TOKEN` - personal access token (if using GitHub)

Plugin environment flags (in root `.drone.yml`):
- `PLUGIN_CONCAT=true` to combine found configs into a multi-machine build.
- `PLUGIN_FALLBACK=true` to rebuild all when no matching changes are found.

How it works:
- When a push or PR is created, drone-tree-config inspects changed files and returns the matching `.drone.yml` files to Drone. Drone will execute those pipelines.

Advanced options:
- `PLUGIN_ALLOW_LIST_FILE` can restrict which repos use the plugin by providing a file with regex rules.
- `PLUGIN_CONSIDER_FILE` lets you provide a file listing which `.drone.yml` should be considered; useful to reduce API calls.
- `PLUGIN_CACHE_TTL` enables in-memory caching to reduce rate limits against provider APIs.

Example Drone server environment (docker-compose excerpt):

```yaml
environment:
  - DRONE_YAML_ENDPOINT=http://drone-tree-config:3000
  - DRONE_YAML_SECRET=<SECRET>
```

Make sure to store `<SECRET>` and `GITHUB_TOKEN` as Drone repository or organization secrets.

Notes:
- Adjust `trigger` sections in each app `.drone.yml` to match your release flow.
- If you want all pipelines to run on every build, set `PLUGIN_ALWAYS_RUN_ALL=true` in the root `.drone.yml` plugin environment.

