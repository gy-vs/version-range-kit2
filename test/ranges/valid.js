'use strict'

const { test } = require('tap')
const validRange = require('../../ranges/valid')
const rangeParse = require('../fixtures/range-parse.js')

test('valid range test', (t) => {
  // validRange(range) -> result
  // translate ranges into their canonical form
  t.plan(rangeParse.length)
  rangeParse.forEach(([pre, wanted, options]) =>
    t.equal(validRange(pre, options), wanted,
      `validRange(${pre}) === ${wanted} ${JSON.stringify(options)}`))
})

test('valid range with != exclusions', (t) => {
  t.equal(validRange('>=1.2.0 <2.0.0 !=1.4.3'),
    '>=1.2.0 <2.0.0 !=1.4.3')
  t.equal(validRange('^1.2.0 !=1.4.3 !=1.5.0'),
    '>=1.2.0 <2.0.0-0 !=1.4.3 !=1.5.0')
  t.equal(validRange('!=1.4.3'), '!=1.4.3')
  t.equal(validRange('!=2.0.0-rc.2'), '!=2.0.0-rc.2')
  t.equal(validRange('!=v1.4.3', { loose: true }), '!=1.4.3')
  t.equal(validRange('!=1.4'), null)
  t.equal(validRange('!=1.x'), null)
  t.equal(validRange('>=1.0.0 !=1.2'), null)
  t.end()
})
