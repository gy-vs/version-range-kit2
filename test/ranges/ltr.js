'use strict'

const { test } = require('tap')
const ltr = require('../../ranges/ltr')
const versionLtr = require('../fixtures/version-lt-range')
const versionNotLtr = require('../fixtures/version-not-lt-range')

test('ltr tests', (t) => {
  // [range, version, options]
  // Version should be less than range
  versionLtr.forEach(([range, version, options = false]) => {
    const msg = `ltr(${version}, ${range}, ${options})`
    t.ok(ltr(version, range, options), msg)
  })
  t.end()
})

test('negative ltr tests', (t) => {
  // [range, version, options]
  // Version should NOT be less than range
  versionNotLtr.forEach(([range, version, options = false]) => {
    const msg = `!ltr(${version}, ${range}, ${options})`
    t.notOk(ltr(version, range, options), msg)
  })
  t.end()
})

test('ltr with exclusion comparators', (t) => {
  // a version in the range is not outside of it
  t.notOk(ltr('1.4.2', '!=1.4.3'), '1.4.2 is in !=1.4.3, not less than it')
  // anything else throws rather than answering incorrectly
  t.throws(() => ltr('1.4.3', '!=1.4.3'),
    new TypeError('gtr/ltr are not supported for ranges with != comparators: !=1.4.3'))
  t.throws(() => ltr('2.0.0', '>=1.2.0 <2.0.0 !=1.4.3'), TypeError)
  t.end()
})
