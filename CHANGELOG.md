# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation of tsneedle DI container
- Token system with branded types
- Container with registration methods (registerClass, registerFactory, registerValue, registerSingleton)
- Lifecycle management (Transient, Singleton, Scoped)
- Sync and async resolution
- Circular dependency detection
- Decorators: @injectable, @singleton, @scoped, @inject, @optional, @lazy, @postConstruct, @preDestroy
- Metadata registry for decorator storage
- Hierarchical container scoping
- Module loading (defineModule, container.load)
- Container disposal with lifecycle hooks
- Optional reflect-metadata integration
- commitlint with conventional commits
- husky for git hooks
- GitHub Actions CI pipeline
- Multi-channel releases (dev, next, stable)

### Features
- Zero runtime dependencies (core)
- ESM + CJS dual module format
- TypeScript 5.2+ Stage 3 decorators
- Strong type safety with branded tokens

[Unreleased]: https://github.com/mrmeaow/tsneedle/compare/v0.1.0...HEAD
