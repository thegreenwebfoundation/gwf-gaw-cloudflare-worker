# Grid-aware Worker

This repository contains the code for a Cloudflare Worker that is applied to the <https://www.thegreenwebfoundation.org/tools/grid-aware-websites/> URL. It is a demonstration implementation of the [Grid-aware Websites](https://github.com/thegreenwebfoundation/grid-aware-websites) project.

## Guide

This worker follows the steps discussed in the tutorial - [Add Grid-aware Websites to an existing site with Cloudflare Workers](https://developers.thegreenwebfoundation.org/grid-aware-websites/tutorials/grid-aware-tutorial-cloudflare-workers/). It makes the following changes to the page that it is applied to:

- Remove the iframe that contains presentation slide deck (visual change).
- Add a small banner at the top of the page noting that the visitor is seeing a grid-aware site. (visual change)
- Remove the Smush plugin. (non-visual)
- Remove the YouTube Lyte plugin script. (non-visual)
- Remove the Mailin plugin script. (non-visual)
- Remove the Code Prettify script & CSS. (non-visual)

The code for this Worker can be found in the [/src/index.js](/src/index.js) file.

## Development

To make changes to this Worker, and deploy it:

1. Fork this repository, and clone it to your development environment.
2. In your terminal, navigate to the folder that the project is cloned into.
3. Run `npm install` to install all the project dependencies.

### Optional - If using this for your own domain

#### Setting routes

Before we start writing code, we'll first configure our worker to run on the route we want it to apply to. We want to apply this Worker to the `/tools/grid-aware-websites/` path on the `thegreenwebfoundation.org` domain. To do that, we include the following configuration inside of the `wrangler.json` file. You should replace the `pattern`, and `zone_name` with your own desired route.

```json
"routes": [
  {
   "pattern": "www.thegreenwebfoundation.org/tools/grid-aware-websites/",
   "zone_name": "thegreenwebfoundation.org"
  }
 ]
```

For more information about routes, and how to configure them for Cloudflare Workers, [refer to the Cloudflare documentation](https://developers.cloudflare.com/workers/configuration/routing/routes/).

#### Adding the Electricity Maps API for development

Later in the project, we'll use the Electricity Maps API to get information about the power breakdown of a country's energy grid. For this, you'll need an Electricity Maps API key added to your project. We'll first set this up for our development environment, and later in this tutorial we'll set it up for production. To do this securely, we'll create a `.dev.vars` file in the root directory of our project. Inside that file you can add your Electricity Maps API key as a variable - here we've named the variable `EMAPS_API_KEY`.

```txt
EMAPS_API_KEY="<your_api_key>"
```

#### Adding the Electricity Maps API for production

Add the `EMAPS_API_KEY` secret to your Cloudflare account so that it can be used by the Worker. You can [learn more about secrets](https://developers.cloudflare.com/workers/configuration/secrets/) in the Cloudflare docs. To add the `EMAPS_API_KEY` secret to your account, run the following command in your terminal.

```bash
npx wrangler secret put EMAPS_API_KEY
```

You'll then be prompted to select the Cloudflare account to add this to - it must be the same account as the domain or zone you are doing to deploy this Worker too eventually. You'll then be asked to add your API key value. Do that, and press enter. If you're deploying the Worker code for the first time, you will also be asked if you want to create a new Worker to assign this secret to. Select `Yes (Y)`. With that done, you should soon see a message confirming that the secret was successfully added.

## Deploying to production

When you're ready, you can deploy your worker to run on your website for the actual path you've configured. Run `npx wrangler deploy` in your terminal to deploy your Worker to production.
