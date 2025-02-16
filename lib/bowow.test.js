const bowow = require('./bowow')

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

describe('bowow', () => {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000

  it('bowow to be a function', () => expect(bowow).toBeInstanceOf(Function))

  describe('errors', () => {
    it('closes browser when passed function throws Error', () =>
      bowow($ => {
        throw new Error('err')
      }).catch(err => {
        expect(err.message).toEqual('err')
      }))

    it('closes browser when passed function throws Error', () =>
      bowow($ =>
        $(() => {
          throw new Error('err')
        })
      ).catch(err => {
        expect(err.message).toEqual('err')
      }))
  })

  it('passes a $ function as param', () =>
    bowow($ => expect($).toBeInstanceOf(Function)))

  it('passes returned value back from bowow', () =>
    expect(bowow($ => 9)).resolves.toEqual(9))

  it('navigates to page when given a browser', () =>
    bowow(async $ => {
      $.go('http://www.google.com')

      const title = $(() => document.title)

      expect(title).toMatch(/Google/)
    }))

  it('supports refresh', () =>
    bowow(async $ => {
      $.go('https://mea.favequest.net/ts')

      const ts1 = $(() => document.body.innerText)

      await wait(1500)
      $.refresh()

      const ts2 = $(() => document.body.innerText)

      expect(ts1).not.toEqual(ts2)
    }))

  it('supports back and forward', () =>
    bowow(async $ => {
      const waitForGoogle = () => document.title.includes('Google')

      const waitForDigg = () =>
        $.wait(10000, () => document.title.includes('Digg'))

      $.go('https://google.com')
      waitForGoogle()

      $.go('https://digg.com')
      waitForDigg()

      $.back()
      waitForGoogle()

      $.forward()
      waitForDigg()
    }))

  describe('browser js execution', () => {
    it('passing js code to $ invokes it in browser', () =>
      expect(bowow($ => $(() => window.navigator.appVersion))).resolves.toMatch(
        /Chrom/ // Chrome or Chromium
      ))

    it('exceptions thrown get passed back', () =>
      bowow($ =>
        $(() => {
          throw new Error('testing')
        })
      ).then(
        () => {
          throw new Error('fail')
        },
        err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('testing')
        }
      ))

    it('unknown variables outside of function cause rejections', () => {
      let x = 0
      return bowow($ => $(() => console.log(x))).then(
        () => {
          throw new Error('fail')
        },
        err => {
          expect(err).toBeInstanceOf(Error)
          expect(err.message).toEqual('x is not defined')
        }
      )
    })

    it('arguments can be passed in', () =>
      bowow($ => expect($(({ a, b }) => a + b, { a: 1, b: 2 })).toEqual(3)))
  })

  describe('jQuery usage', () => {
    it('invokes jQuery when invoked directly', () =>
      bowow(async $ => {
        $('https://bing.com')
        $('input[name=q]').val('testing')
        $('input[type=submit]').click()

        $('#b_results')
        return $(() => document.title)
      }).then(title => expect(title).toEqual('testing - Bing')))

    it('returns simple values when using jQuery getters', () =>
      bowow(async $ => {
        $('https://bing.com')
        return expect(
          $('input[name=q]')
            .val('testing')
            .val()
        ).toEqual('testing')
      }))

    it('map behaves as expected', () =>
      bowow(async $ => {
        $('https://www.google.com')

        const urls = $('a')
          .map((i, el) => $(el).attr('href'))
          .get()
        expect(Array.isArray(urls)).toEqual(true)

        const parents = $('a').map((i, el) => $(el).parent())

        expect(typeof parents.jquery).toEqual('string')
      }))
  })

  describe('sleep', () => {
    it('is supported by passing a number into $', () =>
      bowow($ => {
        const start = Date.now()
        $(1200)
        const end = Date.now()
        expect(end - start >= 1200).toEqual(true)
      }))

    it('will succeed when predicate passed and is eventually truthy', () =>
      bowow($ => {
        const result = $(
          10000,
          () => {
            window.counts = (window.counts || 0) + 1
            return window.counts >= 5 ? 'YAY' : false
          },
          50
        )

        return expect(result).toEqual('YAY')
      }))

    it('will throw when predicate passed and is never truthy', () =>
      bowow($ => expect(() => $(1000, () => false, 50)).toThrow(/Timeout/)))
  })

  describe('downloads', () => {
    it('returns list of downloaded files synchronously', () =>
      bowow($ => expect($.downloads()).toEqual([])))

    it('throws if no download in timeout given', () =>
      bowow($ => expect(() => $.downloads(1500)).toThrow(/Timeout/)))
  })
})
