'use strict'

const { test } = require('tap')
const satisfies = require('../../functions/satisfies')
const rangeInclude = require('../fixtures/range-include.js')
const rangeExclude = require('../fixtures/range-exclude.js')
test('range tests', t => {
  t.plan(rangeInclude.length)
  rangeInclude.forEach(([range, ver, options]) =>
    t.ok(satisfies(ver, range, options), `${range} satisfied by ${ver}`))
})

test('negative range tests', t => {
  t.plan(rangeExclude.length)
  rangeExclude.forEach(([range, ver, options]) =>
    t.notOk(satisfies(ver, range, options), `${range} not satisfied by ${ver}`))
})

test('invalid ranges never satisfied (but do not throw)', t => {
  const cases = [
    ['blerg', '1.2.3'],
    ['git+https://user:password0123@github.com/foo', '123.0.0', true],
    ['^1.2.3', '2.0.0-pre'],
    ['0.x', undefined],
    ['*', undefined],
  ]
  t.plan(cases.length)
  cases.forEach(([range, ver]) =>
    t.notOk(satisfies(ver, range), `${range} not satisfied because invalid`))
})

test('!= exclusions', t => {
  // [range, version, expect]
  const include = [
    ['!=1.4.3', '1.4.4'],
    ['!=1.4.3', '0.0.0'],
    ['>=1.2.0 <2.0.0 !=1.4.3', '1.2.0'],
    ['>=1.2.0 <2.0.0 !=1.4.3', '1.4.4'],
    ['^1.2.0 !=1.4.3 !=1.5.0', '1.4.4'],
    ['^1.2.0 !=1.4.3 || 1.4.3', '1.4.3'],
    ['!=2.0.0-rc.2', '2.0.0'],
    ['>=1.2.3-beta.1 !=1.2.3-beta.1', '1.2.3-beta.2'],
    ['>=1.2.0 !=1.2.3-beta.1', '1.2.3'],
  ]
  const exclude = [
    ['!=1.4.3', '1.4.3'],
    ['>=1.2.0 <2.0.0 !=1.4.3', '1.4.3'],
    ['^1.2.0 !=1.4.3 !=1.5.0', '1.4.3'],
    ['^1.2.0 !=1.4.3 !=1.5.0', '1.5.0'],
    ['^1.2.0 !=1.4.3', '2.0.0'],
    ['!=2.0.0-rc.2', '2.0.0-rc.2'],
    // the exclusion does not by itself grant prerelease matching
    ['>=1.2.0 !=1.2.3-beta.1', '1.2.3-beta.2'],
    // nor does it allow the excluded prerelease when another comp grants it
    ['>=1.2.3-beta.1 !=1.2.3-beta.1', '1.2.3-beta.1'],
  ]
  t.plan(include.length + exclude.length)
  include.forEach(([range, ver]) =>
    t.ok(satisfies(ver, range), `${ver} satisfies ${range}`))
  exclude.forEach(([range, ver]) =>
    t.notOk(satisfies(ver, range), `${ver} does not satisfy ${range}`))
})
