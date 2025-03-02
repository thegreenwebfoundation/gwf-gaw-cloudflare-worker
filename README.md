# Grid-aware Worker

This repository contains the code for a Cloudflare Worker that is applied to the <https://www.thegreenwebfoundation.org/tools/grid-aware-websites/> URL. It is a demonstration implementation of the [Grid-aware Websites](/thegreenwebfoundation/grid-aware-websites) project.

## Guide

This worker follows the steps discussed in the tutorial - [Add Grid-aware Websites to an existing site with Cloudflare Workers](https://developers.thegreenwebfoundation.org/grid-aware-websites/tutorials/grid-aware-tutorial-cloudflare-workers/). It makes the following changes to the page that it is applied to:

- Remove the iframe that contains presentation slide deck (visual change).
- Add a small banner at the top of the page noting that the visitor is seeing a grid-aware site. (visual change)
- Remove the Smush plugin. (non-visual)
- Remove the YouTube Lyte plugin script. (non-visual)
- Remove the Mailin plugin script. (non-visual)
- Remove the Code Prettify script & CSS. (non-visual)
