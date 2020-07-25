# Ralley Cli

[Ralley](https://ralley.io) is a managed message queue as a service. Blimey, that's a mouthful. We help you send queued messages without any setup. All you have to do is prefix your request with `ralley.to/` and we'll queue it for you!

This is the CLI for Ralley. It helps you to view requests, manage your account and has a really handy `dev` server.


### Install

Install using NPM:

```
npm install -g @ralley/cli
```

Install using script:

```bash
curl -fsSL get.ralley.io -o get-ralley.sh
sh get-ralley.sh
```

You should update Ralley by running the same command.


### Usage

```
Usage: ralley <command> [options]

Commands:
  ralley workspaces   Manage workspaces
  ralley queue <url>  Send a queued request to a service
  ralley requests     Manage requests
  ralley config       Configure CLI
  ralley login        Login to Ralley
  ralley logout       Logout (and delete user config)
  ralley signup       Sign up to Ralley
  ralley dev          Manage dev environment

Options:
  --version, -v    Show version number                                 [boolean]
  --token, -t      Authentication token
  --workspace, -w  Workspace to target
  --endpoint, -e   Queue server endpoint
  --dev            Send requests to dev server
  --silent, -s     Silent mode (no stdout)
  --debug          Debug mode (more stdout)
  --json           Format response as JSON (only valid for list commands)
  -h               Show help

```

For additional usage commands use `-h` on sub-commands. E.g. `ralley workspaces -h`.



### Dev Server (`ralley dev`)

A local dev server that can be used during development. It implements the [same API](https://ralley.io/docs) as the `ralley.to`. By default it runs on http://localhost:4747 - you can specify an alternative port using `-p`.

So to queue a request it would be: 

```sh
curl http://localhost:4747/myurl.com?_delay=10

```

The `queue` and `requests` commands support a `--dev` flag which can be used to target your dev server instead of the Ralley servers. E.g. To list requests in your dev server use `ralley requests --dev`



#### Differences to production

There are some minor differences to the production server:

 * No token is required (any `_token` parameter will be ignored)

 * Only the the following endpoints are supported. These endpoints work in the same way as the [Ralley API](https://ralley.io/docs):

    * Queue - `http://localhost:4747/<url>` (incl all headers/query parameters)
    * Bulk - `http://localhost:4747/bulk`
    * List requests - `http://localhost:4747/requests`
    * Get a single request - `http://localhost:4747/requests/<id>`
    * Pause request - `http://localhost:4747/requests/<id>/inactive`
    * Unpause request - `http://localhost:4747/requests/<id>/active`



#### Setup

This repo is split into two packages:

 - pacakge/cli - the core client that is used to create the released binaries
 - package/download - used on NPM to install the library (using the released binaries)
