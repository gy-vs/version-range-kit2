'use strict'

const { test } = require('tap')
const Range = require('../../classes/range')
const Comparator = require('../../classes/comparator')
const rangeIntersection = require('../fixtures/range-intersection.js')

const rangeInclude = require('../fixtures/range-include.js')
const rangeExclude = require('../fixtures/range-exclude.js')
const rangeParse = require('../fixtures/range-parse.js')
const validRange = require('../../ranges/valid')

test('range tests', t => {
  t.plan(rangeInclude.length)
  rangeInclude.forEach(([range, ver, options]) => {
    const r = new Range(range, options)
    t.ok(r.test(ver), `${range} satisfied by ${ver}`)
  })
})

test('range parsing', t => {
  t.plan(rangeParse.length)
  rangeParse.forEach(([range, expect, options]) =>
    t.test(`${range} ${expect} ${JSON.stringify(options)}`, t => {
      if (expect === null) {
        t.throws(() => new Range(range, options), TypeError, `invalid range: ${range}`)
      } else {
        t.equal(new Range(range, options).range || '*', expect, `${range} => ${expect}`)
        t.equal(new Range(range, options).range, new Range(expect).range,
          'parsing both yields same result')
      }
      t.end()
    }))
})

test('throw for empty comparator set, even in loose mode', t => {
  t.throws(() => new Range('sadf||asdf', { loose: true }),
    TypeError('Invalid SemVer Range: sadf||asdf'))
  t.end()
})

test('convert comparator to range', t => {
  const c = new Comparator('>=1.2.3')
  const r = new Range(c)
  t.equal(r.raw, c.value, 'created range from comparator')
  t.end()
})

test('range as argument to range ctor', t => {
  const loose = new Range('1.2.3', { loose: true })
  t.equal(new Range(loose, { loose: true }), loose, 'loose option')
  t.equal(new Range(loose, true), loose, 'loose boolean')
  t.not(new Range(loose), loose, 'created new range if not matched')

  const incPre = new Range('1.2.3', { includePrerelease: true })
  t.equal(new Range(incPre, { includePrerelease: true }), incPre,
    'include prerelease, option match returns argument')
  t.not(new Range(incPre), incPre,
    'include prerelease, option mismatch does not return argument')

  t.end()
})

test('negative range tests', t => {
  t.plan(rangeExclude.length)
  rangeExclude.forEach(([range, ver, options]) => {
    const r = new Range(range, options)
    t.notOk(r.test(ver), `${range} not satisfied by ${ver}`)
  })
})

test('strict vs loose ranges', (t) => {
  [
    ['>=01.02.03', '>=1.2.3'],
    ['~1.02.03beta', '>=1.2.3-beta <1.3.0-0'],
  ].forEach(([loose, comps]) => {
    t.throws(() => new Range(loose))
    t.equal(new Range(loose, true).range, comps)
  })
  t.end()
})

test('tostrings', (t) => {
  t.equal(new Range('>= v1.2.3').toString(), '>=1.2.3')
  t.end()
})

test('formatted value is calculated lazily and cached', (t) => {
  const r = new Range('>= v1.2.3')
  t.equal(r.formatted, undefined)
  t.equal(r.format(), '>=1.2.3')
  t.equal(r.formatted, '>=1.2.3')
  t.equal(r.format(), '>=1.2.3')
  t.end()
})

test('ranges intersect', (t) => {
  rangeIntersection.forEach(([r0, r1, expect]) => {
    t.test(`${r0} <~> ${r1}`, t => {
      const range0 = new Range(r0)
      const range1 = new Range(r1)

      t.equal(range0.intersects(range1), expect,
        `${r0} <~> ${r1} objects`)
      t.equal(range1.intersects(range0), expect,
        `${r1} <~> ${r0} objects`)
      t.end()
    })
  })
  t.end()
})

test('missing range parameter in range intersect', (t) => {
  t.throws(() => {
    new Range('1.0.0').intersects()
  }, new TypeError('a Range is required'),
  'throws type error')
  t.end()
})

test('cache', (t) => {
  const cached = Symbol('cached')
  const r1 = new Range('1.0.0')
  r1.set[0][cached] = true
  const r2 = new Range('1.0.0')
  t.equal(r1.set[0][cached], true)
  t.equal(r2.set[0][cached], true) // Will be true, showing it's cached.
  t.end()
})

test('!= exclusions parse and normalize', t => {
  const cases = [
    ['>=1.2.0 <2.0.0 !=1.4.3', '>=1.2.0 <2.0.0 !=1.4.3'],
    ['^1.2.0 !=1.4.3 !=1.5.0', '>=1.2.0 <2.0.0-0 !=1.4.3 !=1.5.0'],
    ['!=1.4.3', '!=1.4.3'],
    ['!=2.0.0-rc.2', '!=2.0.0-rc.2'],
    // whitespace around the operator is trimmed like the others
    ['!= 1.4.3', '!=1.4.3'],
    [' >=1.2.0 != 1.4.3 ', '>=1.2.0 !=1.4.3'],
    // build metadata is stripped
    ['!=1.4.3+exp.sha.5114f85', '!=1.4.3'],
    // duplicates are deduped
    ['>=1.2.0 !=1.4.3 !=1.4.3', '>=1.2.0 !=1.4.3'],
    // || groups keep their own exclusions
    ['^1.2.0 !=1.4.3 || >=2.0.0 !=2.0.1',
      '>=1.2.0 <2.0.0-0 !=1.4.3||>=2.0.0 !=2.0.1'],
  ]
  cases.forEach(([input, wanted]) => {
    t.equal(new Range(input).range, wanted, `${input} => ${wanted}`)
  })
  t.end()
})

test('!= with a partial version is invalid', t => {
  const invalid = [
    '!=1.4',
    '!=1.x',
    '!=1',
    '!=1.*',
    '!=1.4.x',
    '!=*',
    '!==1.4.3',
    '>=1.0.0 !=1.4',
    '>=1.0.0 !=*',
    '>=1.0.0 !=2',
    '^1.0.0 !=1.x',
    '!=1.4.3-',
    '!=1.4.3 - 1.5.0',
  ]
  invalid.forEach((range) => {
    t.throws(() => new Range(range), TypeError, `strict invalid: ${range}`)
    if (range === '!=1.4.3 - 1.5.0') {
      // loose mode splits space-separated comparators, as it does elsewhere
      t.equal(new Range(range, { loose: true }).range, '!=1.4.3 1.5.0',
        'loose splits the hyphen-looking form')
    } else {
      t.throws(() => new Range(range, { loose: true }),
        TypeError, `loose invalid: ${range}`)
    }
  })
  // validRange reports them as null instead of throwing
  t.equal(validRange('!=1.4'), null)
  t.equal(validRange('!=*'), null)
  t.end()
})

test('!= only acts within its own comparator group', t => {
  const r = new Range('^1.2.0 !=1.4.3 || 1.4.3')
  t.ok(r.test('1.4.2'))
  t.ok(r.test('1.4.3'), '1.4.3 allowed through ||')
  t.notOk(new Range('^1.2.0 !=1.4.3').test('1.4.3'))
  // exclusion in one group does not leak into another
  const r2 = new Range('1.4.3 || ^1.2.0 !=1.4.3')
  t.ok(r2.test('1.4.3'))
  t.end()
})

test('!= prerelease matching keeps the existing rule', t => {
  // a comparator on the same tuple with a prerelease grants prereleases
  t.ok(new Range('>=1.2.3-beta.1 !=1.2.3-beta.1')
    .test('1.2.3-beta.2'))
  // an exclusion alone does not grant prereleases of the tuple
  t.notOk(new Range('>=1.2.0 !=1.2.3-beta.1')
    .test('1.2.3-beta.2'))
  // the excluded prerelease itself never matches, even when granted
  t.notOk(new Range('>=1.2.3-beta.1 !=1.2.3-beta.1')
    .test('1.2.3-beta.1'))
  // includePrerelease still makes the exclusion the only gate
  t.ok(new Range('>=1.2.0 !=1.2.3-beta.1', { includePrerelease: true })
    .test('1.2.3-beta.2'))
  t.notOk(new Range('>=1.2.0 !=1.2.3-beta.1', { includePrerelease: true })
    .test('1.2.3-beta.1'))
  t.end()
})

test('range intersects with != exclusions', t => {
  t.notOk(new Range('1.4.3').intersects(new Range('!=1.4.3')))
  t.ok(new Range('^1.4.0').intersects(new Range('!=1.4.3')))
  t.ok(new Range('!=1.4.3').intersects(new Range('!=1.4.3')))
  // an unsatisfiable group (version excluded from itself) does not
  // intersect, even with another satisfiable group on the other side
  t.notOk(new Range('1.4.3 !=1.4.3').intersects(new Range('1.4.3')))
  t.ok(new Range('1.4.3 !=1.4.3 || 1.4.4')
    .intersects(new Range('1.4.4')))
  t.notOk(new Range('1.4.3 !=1.4.3 || 1.4.4')
    .intersects(new Range('1.4.3')))
  t.end()
})

test('range created from an != comparator', t => {
  const c = new Comparator('!=1.4.3')
  const r = new Range(c)
  t.equal(r.raw, '!=1.4.3')
  t.equal(r.range, '!=1.4.3')
  t.notOk(r.test('1.4.3'))
  t.ok(r.test('1.4.4'))
  t.end()
})
