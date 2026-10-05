'use strict'

const { test } = require('tap')
const Comparator = require('../../classes/comparator')
const comparatorIntersection = require('../fixtures/comparator-intersection.js')

test('comparator testing', t => {
  const c = new Comparator('>=1.2.3')
  t.ok(c.test('1.2.4'))
  const c2 = new Comparator(c)
  t.ok(c2.test('1.2.4'))
  const c3 = new Comparator(c, true)
  t.ok(c3.test('1.2.4'))
  // test an invalid version, should not throw
  const c4 = new Comparator(c)
  t.notOk(c4.test('not a version string'))
  t.end()
})

test('tostrings', (t) => {
  t.equal(new Comparator('>= v1.2.3').toString(), '>=1.2.3')
  t.end()
})

test('intersect comparators', (t) => {
  t.plan(comparatorIntersection.length)
  comparatorIntersection.forEach(([c0, c1, expect, includePrerelease]) =>
    t.test(`${c0} ${c1} ${expect}`, t => {
      const comp0 = new Comparator(c0)
      const comp1 = new Comparator(c1)

      t.equal(comp0.intersects(comp1, { includePrerelease }), expect,
        `${c0} intersects ${c1}`)

      t.equal(comp1.intersects(comp0, { includePrerelease }), expect,
        `${c1} intersects ${c0}`)
      t.end()
    }))
})

test('intersect demands another comparator', t => {
  const c = new Comparator('>=1.2.3')
  t.throws(() => c.intersects(), new TypeError('a Comparator is required'))
  t.end()
})

test('ANY matches anything', t => {
  const c = new Comparator('')
  t.ok(c.test('1.2.3'), 'ANY matches anything')
  const c1 = new Comparator('>=1.2.3')
  const ANY = Comparator.ANY
  t.ok(c1.test(ANY), 'anything matches ANY')
  t.end()
})

test('invalid comparator parse throws', t => {
  t.throws(() => new Comparator('foo bar baz'),
    new TypeError('Invalid comparator: foo bar baz'))
  t.end()
})

test('= is ignored', t => {
  t.match(new Comparator('=1.2.3'), new Comparator('1.2.3'))
  t.end()
})

test('exclusion comparators', t => {
  const c = new Comparator('!=1.2.3')
  t.equal(c.operator, '!=')
  t.equal(c.value, '!=1.2.3')
  t.equal(c.toString(), '!=1.2.3')
  t.equal(c.semver.version, '1.2.3')
  t.notOk(c.test('1.2.3'), 'excluded version does not match')
  t.ok(c.test('1.2.4'), 'any other version matches')
  t.ok(c.test('0.0.1'), 'any other version matches')

  t.equal(new Comparator('!= 1.2.3').value, '!=1.2.3', 'space is trimmed')
  t.equal(new Comparator('!=v1.2.3').value, '!=1.2.3', 'v is stripped')
  t.equal(new Comparator('!=1.2.3+build').value, '!=1.2.3', 'build is stripped')
  t.equal(new Comparator('!=1.2.3-alpha.1').value, '!=1.2.3-alpha.1',
    'prereleases can be excluded')
  t.equal(new Comparator('!=1.2.3', { loose: true }).value, '!=1.2.3',
    'loose mode parses exclusions')

  const c2 = new Comparator(c)
  t.equal(c2, c, 'comparator of comparator returns same object')
  t.notOk(c2.test('1.2.3'))
  t.end()
})

test('invalid exclusion comparators throw', t => {
  t.throws(() => new Comparator('!=1.2'),
    new TypeError('Invalid comparator: !=1.2'), 'partial version')
  t.throws(() => new Comparator('!=1.x'),
    new TypeError('Invalid comparator: !=1.x'), 'x-range')
  t.throws(() => new Comparator('!=*'),
    new TypeError('Invalid comparator: !=*'), 'star')
  t.throws(() => new Comparator('!='),
    new TypeError('Invalid comparator: !='), 'no version at all')
  t.throws(() => new Comparator('!=1.2', { loose: true }),
    new TypeError('Invalid comparator: !=1.2'), 'partial version, loose')
  t.throws(() => new Comparator('!=1.2.3.4', { loose: true }),
    new TypeError('Invalid comparator: !=1.2.3.4'), 'extra version parts, loose')
  t.end()
})
