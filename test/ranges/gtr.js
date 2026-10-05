'use strict'

const { test } = require('tap')
const gtr = require('../../ranges/gtr')
const versionGtr = require('../fixtures/version-gt-range')
const versionNotGtr = require('../fixtures/version-not-gt-range')

test('gtr tests', (t) => {
  // [range, version, options]
  // Version should be greater than range
  versionGtr.forEach((tuple) => {
    const range = tuple[0]
    const version = tuple[1]
    const options = tuple[2] || false
    const msg = `gtr(${version}, ${range}, ${options})`
    t.ok(gtr(version, range, options), msg)
  })
  t.end()
})

test('negative gtr tests', (t) => {
  // [range, version, options]
  // Version should NOT be greater than range
  versionNotGtr.forEach((tuple) => {
    const range = tuple[0]
    const version = tuple[1]
    const options = tuple[2] || false
    const msg = `!gtr(${version}, ${range}, ${options})`
    t.notOk(gtr(version, range, options), msg)
  })
  t.end()
})

test('gtr with exclusion comparators', (t) => {
  // a version in the range is not outside of it
  t.notOk(gtr('1.4.4', '!=1.4.3'), '1.4.4 is in !=1.4.3, not greater than it')
  // anything else throws rather than answering incorrectly
  t.throws(() => gtr('1.4.3', '!=1.4.3'),
    new TypeError('gtr/ltr are not supported for ranges with != comparators: !=1.4.3'))
  t.throws(() => gtr('2.0.0', '>=1.2.0 <2.0.0 !=1.4.3'), TypeError)
  t.end()
})
