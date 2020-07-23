import { oneOfType } from '@zeplo/validator'
import ms from 'ms'
import Cron from 'cron-converter'

export const allowedTriggers = [
  'schedule/cron',
  'schedule/interval',
]

const disallowedChars = /[^a-z0-9-_]/

export const runtime = {
  image: {
    type: String,
  },
  environment: {
    type: [oneOfType({
      type: String,
      test: (value) => {
        if (!/^[a-zA-Z_].*$/.test(value)) {
          return `Invalid environment variable ${value}`
        }
        return null
      },
    }, {
      type: {
        name: {
          type: String,
          required: true,
        },
        value: String,
        valueFromGlobal: String,
      },
    })],
    alias: 'env',
  },
  environment_file: {
    type: String,
    alias: 'env_file',
  },
  restart: {
    type: Boolean,
  },
}

export default {
  ...runtime,
  specVersion: {
    type: oneOfType(String, Number),
    test: value => (value === '1' || value === 1 ? null : 'Invalid specVersion, expected 1'),
  },
  name: {
    alias: 'service',
    type: String,
    test: (value) => {
      const split = value.split('/')
      if (value.split('/').length > 2) return 'Too many `/` in service name - must be in format <namespace>/<service_name> or <service_name>'
      const serviceName = split[1] || split[0]
      const spaceName = split[1] ? split[0] : null
      if (serviceName && serviceName.match(disallowedChars)) return 'Invalid service name'
      if (spaceName && spaceName.match(disallowedChars)) return 'Invalid namespace'
      return null
    },
  },
  public: Boolean,
  mode: {
    type: String,
    oneOf: ['HTTPS', 'RUN'],
  },
  triggers: [{
    type: {
      type: {
        type: String,
        required: true,
        oneOf: allowedTriggers,
      },
      account: {
        type: String,
        testEmpty: true,
        test: (value, all, parent, keyPath) => {
          if (!value && parent.type && parent.type.split('/')[0] === 'app') {
            return `Missing required key \`${keyPath}\` - account is required for app/* triggers`
          }
          return null
        },
      },
      options: {
        type: Object,
        testEmpty: true,
        test: (value = {}, all, parent, keyPath) => {
          if (parent.type === 'schedule/cron') {
            if (!value.cron) {
              return `Missing required key \`${keyPath}.cron\` - cron is required for schedule/cron`
            }
            try {
              const cron = new Cron()
              cron.fromString(value.cron)
              return null
            } catch (e) {
              return `Invalid cron '${value.cron}' for key \`${keyPath}.cron\``
            }
          }
          if (parent.type === 'schedule/interval') {
            if (!value.interval) {
              return `Missing required key \`${keyPath}.interval\` - interval is required for schedule/interval`
            }
            const milli = ms(value.interval)
            if (!milli) {
              return `Invalid interval '${value.interval}' for key \`${keyPath}.interval\``
            }
          }
          return null
        },
      },
      tag: {
        type: String,
        default: 'latest',
      },
      meta: oneOfType(Object, Array),
    },
  }],
  disableAutoQueue: Boolean,
  alias: String,
  scale: oneOfType(Number, {
    type: {
      concurrency: Number,
    },
  }),
  resource: {
    type: {
      memory: Number,
    },
  },
  build: {
    type: {
      context: {
        type: String,
        default: './',
      },
      // nodejs, go, ruby, python, java-mvn, php or docker
      builder: {
        type: String,
        oneOf: ['nodejs', 'go', 'ruby', 'python', 'python-2.7', 'java-mvn', 'php', 'docker', 'shell'],
      },
      include: [String],
      exclude: [String],
    },
    test: (value, all) => {
      if (all.image) {
        return {
          message: 'Both `image` and `build` properties specified. Build config will be ignored.',
          severity: 'warning',
        }
      }
      return null
    },
  },
  requires: {
    type: [oneOfType(String, {
      type: {
        name: String,
        prompt: {
          type: String,
          oneOf: ['text', 'editor', 'password'],
        },
        secret: Boolean,
      },
    })],
    alias: 'requires_environment',
  },
}
