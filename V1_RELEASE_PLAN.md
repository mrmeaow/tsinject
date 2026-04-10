# v1.0.0 Stable Release Plan

## Current Status (as of 2026-04-10)

### Package Info
- **Name**: `@mrmeaow/tsinject`
- **Current Version**: `0.2.0-dev.0` (dev branch)
- **GitHub**: https://github.com/mrmeaow/tsinject
- **npm**: https://www.npmjs.com/package/@mrmeaow/tsinject
- **JSR**: https://jsr.io/@mrmeaow/tsinject

### Test Coverage
- **Current**: 43.4%
- **Target**: 90%+
- **Threshold Configured**: 90% (statements, branches, functions, lines)

### Coverage Breakdown
| Module | Coverage | Status |
|--------|----------|--------|
| binding | 100% | ✅ |
| token | 100% | ✅ |
| modules | 100% | ✅ |
| errors | 98.03% | ✅ |
| container | 39.17% | ⚠️ Needs work |
| metadata | 47.05% | ⚠️ Needs work |
| decorators | 21.1% | ❌ Critical gap |
| context | 6.25% | ❌ Critical gap |
| **Overall** | **43.4%** | ❌ Below target |

## CI/CD Status

### Working
- ✅ Multi-node testing (18, 20, 22)
- ✅ TypeScript type checking
- ✅ Biome linting
- ✅ Test coverage reporting
- ✅ ESM/CJS runtime compatibility
- ✅ npm publish (dev tag) with version check
- ✅ JSR publish (dev) with OIDC
- ✅ Semantic versioning (prerelease dev.N)

### Branch Strategy
```
main → v1.0.0, v1.1.0, etc. (stable LTS)
dev  → v0.2.0-dev.1, v0.2.0-dev.2, etc. (prerelease)
next → v0.3.0-next.1, v0.3.0-next.2, etc. (experimental)
```

## Requirements for v1.0.0

### 1. Test Coverage ≥ 90%
**Priority: HIGH**

Uncovered areas needing tests:
- [ ] Container async resolution paths (lines 504-617)
- [ ] All decorators (@injectable, @inject, @singleton, @scoped, @optional, @lazy, @postConstruct, @preDestroy)
- [ ] Metadata registry full coverage
- [ ] Resolution context creation and usage
- [ ] Edge cases and error paths

### 2. Battle-Testing Checklist
- [ ] Zero critical bugs reported
- [ ] All public APIs have comprehensive tests
- [ ] Edge cases covered (circular deps, missing tokens, async failures)
- [ ] Performance benchmarks acceptable
- [ ] TypeScript strict mode compatibility verified
- [ ] ESM + CJS both fully functional
- [ ] reflect-metadata integration tested

### 3. Documentation
- [x] README with installation and basic usage
- [x] Comparison table (verified)
- [ ] API documentation (JSDoc complete)
- [ ] Migration guides (if applicable)
- [ ] Advanced usage examples

### 4. Code Quality
- [x] TypeScript strict mode
- [x] Biome linting passes
- [x] No console warnings
- [x] Zero runtime dependencies
- [x] Tree-shakeable exports

## Release Process (Once Ready)

```bash
# 1. Ensure dev branch is stable
git checkout dev
git push origin dev

# 2. Merge to main via PR
git checkout main
git merge dev
git push origin main

# 3. release-please will:
#    - Bump version to 1.0.0
#    - Update CHANGELOG.md
#    - Create GitHub release
#    - Trigger CI to publish to npm (latest tag)
#    - Trigger CI to publish to JSR (latest)
```

## Timeline Estimate
- **Coverage to 90%**: ~2-3 days of focused test writing
- **Battle-testing**: ~1-2 weeks of real-world usage
- **Documentation**: ~1 day
- **Total**: ~2-4 weeks from current state

## Next Steps
1. **Write comprehensive tests** for uncovered modules
2. **Run coverage** after each test batch
3. **Fix any bugs** discovered during testing
4. **Update docs** with real-world examples
5. **Merge to main** when all criteria met
