'use strict'

const SemVer = require('../classes/semver')
const Range = require('../classes/range')
const gt = require('../functions/gt')

const minVersion = (range, loose) => {
  range = new Range(range, loose)

  let minver = new SemVer('0.0.0')
  if (range.test(minver)) {
    return minver
  }

  minver = new SemVer('0.0.0-0')
  if (range.test(minver)) {
    return minver
  }

  minver = null
  for (let i = 0; i < range.set.length; ++i) {
    const comparators = range.set[i]
    // != comparators are not bounds, but an excluded lower bound may need to
    // be bumped, so keep them around for the bump loop below.
    const neqComparators = comparators.filter(c => c.operator === '!=')

    let setMin = null
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer(comparator.semver.version)
      switch (comparator.operator) {
        case '>':
          if (compver.prerelease.length === 0) {
            compver.patch++
          } else {
            compver.prerelease.push(0)
          }
          compver.raw = compver.format()
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt(compver, setMin)) {
            setMin = compver
          }
          break
        case '<':
        case '<=':
        case '!=':
          /* Ignore maximum and exclusion versions */
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    })

    // With no lower bound (eg. `<2.0.0 !=1.0.0`), the first candidate is
    // 0.0.0-0, the lowest possible version.
    let candidate = setMin || new SemVer('0.0.0-0')

    // Walk the candidate upwards until it satisfies this comparator set:
    // an != comparator bumps it past a single excluded version, and a
    // prerelease that is not allowed by the prerelease-matching rules is
    // raised to its tuple's release version. An upper bound rejecting the
    // candidate means the set is a null set.
    const setRange = new Range(comparators.map(c => c.value).join(' '),
      loose)
    while (!setRange.test(candidate)) {
      const excluded = neqComparators.find(
        c => c.semver.compare(candidate) === 0)
      if (excluded) {
        candidate = nextAfter(excluded.semver)
      } else if (candidate.prerelease.length) {
        candidate = new SemVer(
          `${candidate.major}.${candidate.minor}.${candidate.patch}`)
      } else {
        candidate = null
        break
      }
    }

    if (candidate && (!minver || gt(minver, candidate))) {
      minver = candidate
    }
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}

// The lowest version strictly higher than v, bumping the patch for release
// versions or extending the prerelease identifier list otherwise.
const nextAfter = (v) => {
  const next = new SemVer(v.version)
  if (next.prerelease.length === 0) {
    next.patch++
  } else {
    next.prerelease.push(0)
  }
  next.raw = next.format()
  return next
}

module.exports = minVersion
