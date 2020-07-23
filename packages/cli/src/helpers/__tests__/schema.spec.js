import validate from '@ralley/validator'
import schema from '../schema'

describe('Validate config', () => {
  test('Valid name has no errors', () => {
    const errors = validate(schema, {
      name: 'valid/name',
    })
    expect(errors).toHaveLength(0)
  })

  test('Invalid service name has errors', () => {
    const errors = validate(schema, {
      name: 'valid/name/age',
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Too many `/` in service name')
  })

  test('Mode is HTTPS with no port', () => {
    const errors = validate(schema, {
      mode: 'HTTPS',
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toEqual('No `port` specified in HTTP mode')
    expect(errors[0].severity).toEqual('warning')
  })

  test('Trigger is one of allowed types', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/cron',
        options: {
          cron: '* * * * *',
        },
      }],
    })
    expect(errors).toHaveLength(0)
  })

  test('Trigger is not one of allowed', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/random',
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Invalid option selected for `triggers.0.type`')
  })

  test('Trigger app must have account field', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'app/stripe',
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Missing required key `triggers.0.account` - account is required for app/* triggers')
  })

  test('Trigger must have a type', () => {
    const errors = validate(schema, {
      triggers: [{
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toEqual('Missing required key `triggers.0.type`')
  })

  test('Trigger cron schedule must be present', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/cron',
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Missing required key `triggers.0.options.cron`')
  })

  test('Trigger cron schedule must be valid', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/cron',
        options: {
          cron: 'a b c d e f',
        },
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Invalid cron \'a b c d e f\' for key `triggers.0.options.cron`')
  })

  test('Trigger cron schedule must not report error if valid', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/cron',
        options: {
          cron: '* * * * *',
        },
      }],
    })
    expect(errors).toHaveLength(0)
  })

  test('Trigger interval schedule must be present', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/interval',
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Missing required key `triggers.0.options.interval`')
  })

  test('Trigger interval schedule must be valid', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/interval',
        options: {
          interval: 'asdasd',
        },
      }],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Invalid interval \'asdasd\' for key `triggers.0.options.interval`')
  })

  test('Trigger interval schedule must not report error if valid', () => {
    const errors = validate(schema, {
      triggers: [{
        type: 'schedule/interval',
        options: {
          interval: '10m',
        },
      }],
    })
    expect(errors).toHaveLength(0)
  })

  test('Environment as a list of strings', () => {
    const errors = validate(schema, {
      environment: ['TEST=HELLO_WORLD'],
    })
    expect(errors).toHaveLength(0)
  })

  test('Environment as alias env as a list of strings', () => {
    const errors = validate(schema, {
      env: ['TEST=HELLO_WORLD'],
    })
    expect(errors).toHaveLength(0)
  })


  test('Environment cannot be a list of numbers', () => {
    const errors = validate(schema, {
      environment: [23],
    })
    expect(errors).toHaveLength(1)
    expect(errors[0].message).toContain('Invalid type for `environment.0`')
  })
})
