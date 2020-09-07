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
  ralley dev          Start dev environment

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

To start a dev server use:

```
ralley dev
```

And to queue a request use: 

```sh
curl http://localhost:4747/myurl.com?_delay=10
```

The `queue` and `requests` commands support a `--dev` flag which can be used to target your dev server instead of the Ralley production servers. E.g. To list requests on your dev server use `ralley requests --dev`

You can specify a workspace ID (and optional token) when creating the dev server, this allows you to start multiple servers without causing conflicts.

```sh
ralley dev -w name:token123
```


#### Differences to production

There are some minor differences to the production server:

 * If token is not provided using `ralley dev -w name:token`, then _token is not required. In production, _token param is always required.

 * Only the the following endpoints are supported. These endpoints work in the same way as the [Ralley API](https://ralley.io/docs), unless otherwise specified:

    * Queue [ANY] - `http://localhost:4747/<url>` (incl all headers/query parameters)
    * Bulk [POST] - `http://localhost:4747/bulk`
    * List requests [GET] - `http://localhost:4747/requests`. Only exact match filters are supported (e.g. `/requests?filters={duration: 0.1}`).
    * Get a single request [GET] - `http://localhost:4747/requests/<id>`
    * Pause request [PATCH] - `http://localhost:4747/requests/<id>/inactive`
    * Unpause request [PATCH] - `http://localhost:4747/requests/<id>/active`
    * Get request body [GET] - `http://localhost:4747/requests/<id>/request.body`
    * Get response body [GET] - `http://localhost:4747/requests/<id>/response.body`

* In addition, you can reset/remove *completed requests* by calling `/requests/reset` [POST]. If you wish to remove *ALL requests* (including pending and active requests), then append `?hard=1`. This can be useful for automated testing.
