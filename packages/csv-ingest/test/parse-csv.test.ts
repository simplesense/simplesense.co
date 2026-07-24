import { describe, it, expect } from 'vitest'
import { parseCsv } from '../src/parse-csv'

describe('parseCsv', () => {
  it('parses a simple comma-separated grid', () => {
    expect(parseCsv('a,b,c\n1,2,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '2', '3'],
    ])
  })

  it('handles a file with no trailing newline', () => {
    expect(parseCsv('a,b\n1,2')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('handles CRLF line endings', () => {
    expect(parseCsv('a,b\r\n1,2\r\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('strips a leading UTF-8 BOM', () => {
    expect(parseCsv('﻿a,b\n1,2\n')).toEqual([
      ['a', 'b'],
      ['1', '2'],
    ])
  })

  it('keeps a literal comma inside a quoted field', () => {
    expect(parseCsv('name,note\n"Smith, Jr.",ok\n')).toEqual([
      ['name', 'note'],
      ['Smith, Jr.', 'ok'],
    ])
  })

  it('keeps a literal newline inside a quoted field', () => {
    expect(parseCsv('name,note\n"line one\nline two",ok\n')).toEqual([
      ['name', 'note'],
      ['line one\nline two', 'ok'],
    ])
  })

  it('unescapes a doubled quote inside a quoted field', () => {
    expect(parseCsv('name\n"She said ""hi"""\n')).toEqual([['name'], ['She said "hi"']])
  })

  it('treats an unquoted empty field as an empty string, not dropped', () => {
    expect(parseCsv('a,b,c\n1,,3\n')).toEqual([
      ['a', 'b', 'c'],
      ['1', '', '3'],
    ])
  })

  it('returns an empty array for an empty string', () => {
    expect(parseCsv('')).toEqual([])
  })

  it('parses a header-only file as one row, zero data rows', () => {
    expect(parseCsv('a,b,c\n')).toEqual([['a', 'b', 'c']])
  })
})
