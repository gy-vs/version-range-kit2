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

test('!= comparator excludes one exact version', t => {
  const c = new Comparator('!=1.4.3')
  t.equal(c.operator, '!=')
  t.equal(c.value, '!=1.4.3')
  t.equal(c.toString(), '!=1.4.3')
  t.notOk(c.test('1.4.3'))
  t.ok(c.test('1.4.4'))
  t.ok(c.test('1.4.2'))
  // build metadata is still stripped
  t.equal(new Comparator('!=1.4.3+build').value, '!=1.4.3')
  // invalid version strings do not throw from test
  t.notOk(c.test('not a version string'))
  t.end()
})

test('!= comparator accepts prereleases', t => {
  const c = new Comparator('!=2.0.0-rc.2')
  t.equal(c.value, '!=2.0.0-rc.2')
  t.notOk(c.test('2.0.0-rc.2'))
  t.ok(c.test('2.0.0-rc.3'))
  t.ok(c.test('2.0.0'))
  t.end()
})

test('!= requires a complete version', t => {
  t.throws(() => new Comparator('!=1.4'),
    new TypeError('Invalid comparator: !=1.4'))
  t.throws(() => new Comparator('!=1.x'),
    new TypeError('Invalid comparator: !=1.x'))
  t.throws(() => new Comparator('!=1'),
    new TypeError('Invalid comparator: !=1'))
  t.throws(() => new Comparator('!='),
    new TypeError('Invalid comparator: !='))
  t.end()
})

test('!= comparator loose parsing', t => {
  const c = new Comparator('!=v1.4.3beta', { loose: true })
  t.equal(c.value, '!=1.4.3-beta')
  t.notOk(c.test('1.4.3-beta'))
  t.ok(c.test('1.4.3'))
  t.throws(() => new Comparator('!=1.4', { loose: true }),
    new TypeError('Invalid comparator: !=1.4'))
  t.end()
})

test('!= comparator intersections', t => {
  const neq = new Comparator('!=1.4.3')
  // a single excluded point does not intersect that exact version
  t.notOk(neq.intersects(new Comparator('1.4.3')))
  t.notOk(new Comparator('1.4.3').intersects(neq))
  // but it intersects every other version and every span
  t.ok(neq.intersects(new Comparator('1.4.4')))
  t.ok(neq.intersects(new Comparator('>=1.4.3')))
  t.ok(neq.intersects(new Comparator('<1.4.3')))
  t.ok(neq.intersects(new Comparator('<=1.4.3')))
  t.ok(neq.intersects(new Comparator('!=1.4.3')))
  t.ok(neq.intersects(new Comparator('!=1.4.4')))
  t.ok(new Comparator('!=2.0.0-rc.2')
    .intersects(new Comparator('2.0.0-rc.2')) === false)
  t.end()
})
