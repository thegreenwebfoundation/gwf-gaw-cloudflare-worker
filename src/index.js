import { PowerBreakdown } from '@greenweb/grid-aware-websites';
import { getLocation, saveDataToKv, fetchDataFromKv } from '@greenweb/gaw-plugin-cloudflare-workers';

export default {
	// First fetch the request
	async fetch(request, env, ctx) {
		const response = await fetch(request.url);
		// Then check if the request content type is HTML.
		const contentType = response.headers.get('content-type');

		// If the content is not HTML, then return the response without any changes.
		if (!contentType || !contentType.includes('text/html')) {
			return new Response(response.body, {
				...response,
			});
		}

		try {

			// We use a cookie to allow us to manually disable the grid-aware feature.
			// This is useful for testing purposes. It can also be used to disable the feature for specific users.
			const cookie = request.headers.get('cookie');
			if (cookie && cookie.includes('gaw=false')) {
				return new Response(response.body, {
					...response,
				});
			}


			// If the content type is HTML, we get the country the request came from
			const location = await getLocation(request);
			const { country } = location;

			// If the country data does not exist, then return the response without any changes.
			if (!country) {
				return new Response(response.body, {
					...response,
				});
			}

			// Check we have have cached grid data for the country
			let gridData = await fetchDataFromKv(env, country);

			// If no cached data, fetch it using the PowerBreakdown class
			if (!gridData) {
				const options = {
					mode: 'low-carbon',
					apiKey: env.EMAPS_API_KEY,
				}

				const powerBreakdown = new PowerBreakdown(options);
				gridData = await powerBreakdown.check(country);

				// If there's an error getting data, return the web page without any modifications
				if (gridData.status === 'error') {
					return new Response(response.body, {
						...response,
						headers: {
							...response.headers,
						},
					});
				}

				// Save the fresh data to KV for future use.
				// By default data is stored for 1 hour.
				await saveDataToKv(env, country, JSON.stringify(gridData));
			} else {
				// Parse twice because the data appears to be double-stringified
				// TODO: Is this a bug with Wrangler, Workers KV, or something else?
				gridData = JSON.parse(JSON.parse(gridData));
			}


			// If the grid aware flag is triggered (gridAware === true), then we'll return a modified HTML page to the user.
			if (gridData.gridAware) {

				// Use the HTMLRewriter API to modify the HTML page.
				// We remove iframes that are present on the page.
				// We also remove lazy loading from images that is done by the Smush plugin.
				// We also remove the Youtube Lyte plugin.
				// We also remove the Sendinblue plugin.
				// We also add a banner to the top of the page to inform the user that the page is grid-aware.

				const modifyHTML = new HTMLRewriter().on('iframe', {
					element(element) {
						element.remove();
					},
				}).on('main', {
					element(element) {
						element.prepend(`<div class="grid-aware-info">
							<div class="container single-page-container">
							This page is grid-aware, and has been modified to use less power.
							</div>
							</div>`, { html: true });
					},
				}).on('body', {
					element(element) {
						element.prepend(`<style>
							.grid-aware-info {
								background-color: #f0f0f0;
								padding-block: 0.5rem;
								text-align: center;
								color: #000;
							}
							</style>`, { html: true });
					}
				}).on('link[href*="code-prettify"]', {
					element(element) {
						element.remove();
					},
				}).on('script[src*="code-prettify"]', {
					element(element) {
						element.remove();
					},
				}).on('script[id*="code-prettify"]', {
					element(element) {
						element.remove();
					},
				}).on('script[id*="sib-front-js"]', {
					element(element) {
						element.remove();
					},
				}).on('script[src*="wp-youtube-lyte"]', {
					element(element) {
						element.remove();
					}
			}).on('script[id*="smush-lazy-load-js"]', {
				element(element) {
					element.remove();
				}
			}).on('img[class*="wp-post-image lazyload"]', {
				element(element) {
					const src = element.getAttribute('data-src');
					element.setAttribute('loading', 'lazy');
					element.setAttribute('src', src);
					element.removeAttribute('data-src');
					element.removeAttribute('data-srcset');
					element.removeAttribute('data-sizes');
					element.removeAttribute('style');
					element.setAttribute('class', "attachment-post-thumbnail size-post-thumbnail wp-post-image");
				}
			});

				// Transform the response using the HTMLRewriter API, and set appropriate headers.
				let modifiedResponse = new Response(modifyHTML.transform(response).body, {
					...response,
					headers: {
						...response.headers,
						'Content-Type': 'text/html;charset=UTF-8',
					},
				});

				return modifiedResponse;
			}

			// If the grid aware flag is not triggered, then we'll return the original HTML page to the user.
			return new Response(response.body, {
				...response,
				headers: {
					...response.headers,
				},
			});
		} catch (e) {

			// If there's an error getting data, return the web page without any modifications
			console.log('Error getting grid data', e);
			return new Response(response.body, {
				...response,
				headers: {
					...response.headers,
				},
			});
		}
	},
};
