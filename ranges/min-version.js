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

    let setMin = null
    const exclusions = []
    comparators.forEach((comparator) => {
      // Clone to avoid manipulating the comparator's semver object.
      const compver = new SemVer(comparator.semver.version)
      switch (comparator.operator) {
        case '>':
          bumpVersion(compver)
          /* fallthrough */
        case '':
        case '>=':
          if (!setMin || gt(compver, setMin)) {
            setMin = compver
          }
          break
        case '<':
        case '<=':
          /* Ignore maximum versions */
          break
        case '!=':
          // exclusions are applied to the minimum once it is known
          exclusions.push(comparator.semver)
          break
        /* istanbul ignore next */
        default:
          throw new Error(`Unexpected operation: ${comparator.operator}`)
      }
    })
    if (exclusions.length) {
      // with no lower bound the set starts at 0.0.0, then move up
      // past any excluded versions
      setMin = setMin || new SemVer('0.0.0')
      while (exclusions.some(v => v.version === setMin.version)) {
        bumpVersion(setMin)
      }
    }
    if (setMin && (!minver || gt(minver, setMin))) {
      minver = setMin
    }
  }

  if (minver && range.test(minver)) {
    return minver
  }

  return null
}

// the lowest version higher than the given one, mirroring the
// handling of the `>` operator above
const bumpVersion = (compver) => {
  if (compver.prerelease.length === 0) {
    compver.patch++
  } else {
    compver.prerelease.push(0)
  }
  compver.raw = compver.format()
}
module.exports = minVersion
