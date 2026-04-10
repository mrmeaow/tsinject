# Contributing to tsinject

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/mrmeaow/tsinject.git
cd tsinject

# Install dependencies
pnpm install

# Run development mode
pnpm dev

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage
```

## Coding Standards

- **TypeScript**: Strict mode enabled
- **Formatting**: Use Biome (`pnpm lint:fix`)
- **Testing**: Write tests for new features
- **Commits**: Follow [Conventional Commits](https://www.conventionalcommits.org/)

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation |
| `style` | Formatting |
| `refactor` | Code restructuring |
| `test` | Tests |
| `chore` | Maintenance |

### Examples

```
feat(container): add tryResolve method
fix(decorators): correct @preDestroy registration
docs: update README with new examples
```

## Pull Request Process

1. Fork the repo and create a feature branch
2. Make your changes with passing tests
3. Ensure `pnpm typecheck && pnpm lint && pnpm test` passes
4. Update documentation if needed
5. Submit a PR with a clear description

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `dev` | Active development |
| `next` | Stable pre-releases |
| `main` | Stable releases |

## Release Process

Releases are automated via GitHub Actions:
- Push to `dev` → dev release (`0.x.x-dev`)
- Push to `next` → next release (`0.x.x-next`)
- Push to `main` → stable release (latest)

## Code of Conduct

Be respectful and inclusive. Follow the [Contributor Covenant](https://www.contributor-covenant.org/).

## Questions?

Open an issue for discussion or ask in discussions.
