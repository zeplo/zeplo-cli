import { matchArr } from '../util'

describe('util.spec', () => {
  describe('matchArr', () => {
    test('match should return first match against regex', () => {
      const arr = ['abc1', 'def', 'abc2']
      expect(matchArr(arr, /abc/)).toEqual('abc1')
    })

    test('match should return undefined for no match', () => {
      const arr = ['abc1', 'def', 'abc2']
      expect(matchArr(arr, /zyx/)).toEqual(undefined)
    })
  })
})
